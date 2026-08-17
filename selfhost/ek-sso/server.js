// Ehi-Kings SSO gateway.
//
// One admin login, every Suite module opens already signed in. The admin panel
// (Convex `suite.ticket`) mints a short-lived HMAC ticket from the staff
// session; the browser hits https://<app-host>/ek-sso?t=<ticket>. Caddy routes
// that path here (same hostname as the app), we log into the app server-side as
// the right account, and re-emit the app's own session cookie — first-party to
// the app's host — then redirect to the app. No second password screen.
//
// Because we answer under the app's own hostname, the Set-Cookie we forward is
// first-party to that app, so the browser keeps it just like a normal login.
//
// Env: EK_SSO_SECRET (shared with Convex), plus per-app service credentials.

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.EK_SSO_SECRET || "";
const PORT = Number(process.env.PORT || 8099);

// Internal (docker-network) origins for each app + how to sign in to each.
const APPS = {
  "marketing": {   // listmonk — single shared admin account
    origin: "http://listmonk:9000",
    strategy: "listmonk",
    landing: "/admin/",
    user: process.env.LISTMONK_ADMIN_USER || "admin",
    pass: process.env.LISTMONK_ADMIN_PASSWORD || "",
  },
  "automations": { // n8n — single shared owner account
    origin: "http://n8n:5678",
    strategy: "n8n",
    landing: "/home/workflows",
    user: process.env.N8N_OWNER_EMAIL || "",
    pass: process.env.N8N_OWNER_PASSWORD || "",
  },
  "social": {      // Postiz — shared team account
    origin: "http://postiz:5000",
    strategy: "postiz",
    landing: "/",
    user: process.env.POSTIZ_EMAIL || "",
    pass: process.env.POSTIZ_PASSWORD || "",
  },
  "scheduling": {  // Cal.com — NextAuth credentials
    origin: "http://calcom:3000",
    strategy: "calcom",
    landing: "/event-types",
    user: process.env.CAL_EMAIL || "",
    pass: process.env.CAL_PASSWORD || "",
  },
  "crm": {         // Twenty — token in localStorage (bootstrap page)
    origin: "http://twenty:3000",
    strategy: "twenty",
    landing: "/",
    user: process.env.TWENTY_EMAIL || "",
    pass: process.env.TWENTY_PASSWORD || "",
  },
};

// ── ticket verification ─────────────────────────────────────────────────────
function b64urlToBuf(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}
function verifyTicket(ticket) {
  if (!SECRET || !ticket || !ticket.includes(".")) return null;
  const [payload, sig] = ticket.split(".");
  const expect = createHmac("sha256", SECRET).update(payload).digest();
  const got = b64urlToBuf(sig);
  if (expect.length !== got.length || !timingSafeEqual(expect, got)) return null;
  let data;
  try { data = JSON.parse(b64urlToBuf(payload).toString("utf8")); } catch { return null; }
  if (!data || typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null;
  return data;
}

// ── helpers ─────────────────────────────────────────────────────────────────
const appHost = (host) => `https://${host}`;

// Forward the app's own Set-Cookie headers to the browser, scoped to the app
// host. Strip Domain (defaults to the request host = the app) and keep Secure.
function relayCookies(res, setCookies) {
  const out = [];
  for (const c of setCookies) {
    let cookie = c.replace(/;\s*Domain=[^;]*/i, "");
    if (!/;\s*Secure/i.test(cookie)) cookie += "; Secure";
    out.push(cookie);
  }
  if (out.length) res.setHeader("Set-Cookie", out);
}

function fail(res, msg) {
  res.writeHead(400, { "Content-Type": "text/html" });
  res.end(`<!doctype html><meta charset=utf8><body style="font:16px system-ui;padding:3rem;max-width:32rem;margin:auto">
    <h2>Couldn't open this module</h2><p>${msg}</p>
    <p><a href="javascript:history.back()">Go back</a></p>`);
}

// ── per-app login strategies (all return { cookies:[], redirect, html? }) ────
async function loginListmonk(app) {
  // listmonk: nonce cookie from the login page, then form POST.
  const g = await fetch(`${app.origin}/admin/login`, { redirect: "manual" });
  const nonce = g.headers.getSetCookie?.() || [];
  const form = new URLSearchParams({ username: app.user, password: app.pass, next: "/admin" });
  const r = await fetch(`${app.origin}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: nonce.map((c) => c.split(";")[0]).join("; ") },
    body: form,
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie?.() || [];
  if (!cookies.length) throw new Error("listmonk login returned no session");
  return { cookies, redirect: app.landing };
}

async function loginN8n(app) {
  const r = await fetch(`${app.origin}/rest/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrLdapLoginId: app.user, password: app.pass }),
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie?.() || [];
  if (!cookies.length) throw new Error(`n8n login failed (${r.status})`);
  return { cookies, redirect: app.landing };
}

async function loginPostiz(app) {
  const r = await fetch(`${app.origin}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: app.user, password: app.pass, provider: "LOCAL" }),
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie?.() || [];
  if (!cookies.length) throw new Error(`Postiz login failed (${r.status})`);
  return { cookies, redirect: app.landing };
}

async function loginCalcom(app) {
  // NextAuth credentials: csrf token+cookie, then callback.
  const csrfRes = await fetch(`${app.origin}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.getSetCookie?.() || [];
  const { csrfToken } = await csrfRes.json();
  const body = new URLSearchParams({
    csrfToken, email: app.user, password: app.pass,
    redirect: "false", json: "true", callbackUrl: appHost("scheduling.207-180-245-46.sslip.io"),
  });
  const r = await fetch(`${app.origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.map((c) => c.split(";")[0]).join("; "),
    },
    body,
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie?.() || [];
  const sessionCookies = cookies.filter((c) => /session-token/i.test(c));
  if (!sessionCookies.length) throw new Error(`Cal.com login failed (${r.status})`);
  return { cookies: sessionCookies, redirect: app.landing };
}

async function loginTwenty(app) {
  // Twenty keeps JWT tokens in localStorage, not cookies. Sign in server-side
  // via GraphQL, then serve a tiny page (from the app's own origin) that seeds
  // localStorage and reloads into the app.
  const q = async (query, variables) => {
    const r = await fetch(`${app.origin}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors) throw new Error(j.errors[0]?.message || "twenty graphql error");
    return j.data;
  };
  const origin = appHost("crm.207-180-245-46.sslip.io");
  const a = await q(
    `mutation($e:String!,$p:String!,$o:String!){ getLoginTokenFromCredentials(email:$e,password:$p,origin:$o){ loginToken{ token } } }`,
    { e: app.user, p: app.pass, o: origin }
  );
  const loginToken = a.getLoginTokenFromCredentials.loginToken.token;
  const b = await q(
    `mutation($t:String!,$o:String!){ getAuthTokensFromLoginToken(loginToken:$t,origin:$o){ tokens{ accessOrWorkspaceAgnosticToken{ token } refreshToken{ token } } } }`,
    { t: loginToken, o: origin }
  );
  const t = b.getAuthTokensFromLoginToken.tokens;
  const access = t.accessOrWorkspaceAgnosticToken.token;
  const refresh = t.refreshToken.token;
  const seed = JSON.stringify({ accessToken: access, refreshToken: refresh });
  const html = `<!doctype html><meta charset=utf8><title>Ehi-Kings</title>
<body style="font:16px system-ui;padding:3rem;text-align:center">Signing you in…
<script>try{var s=${JSON.stringify(seed)};var d=JSON.parse(s);
localStorage.setItem('tokenPair', JSON.stringify({accessOrWorkspaceAgnosticToken:{token:d.accessToken},refreshToken:{token:d.refreshToken}}));
}catch(e){}location.replace('/');</script></body>`;
  return { cookies: [], redirect: app.landing, html };
}

const STRATEGIES = {
  listmonk: loginListmonk, n8n: loginN8n, postiz: loginPostiz,
  calcom: loginCalcom, twenty: loginTwenty,
};

// ── request handler ─────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  try {
    const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(":")[0];
    const url = new URL(req.url, `https://${host}`);
    if (url.pathname === "/ek-sso/health") { res.writeHead(200); return res.end("ok"); }
    if (!url.pathname.startsWith("/ek-sso")) { res.writeHead(404); return res.end(); }

    const sub = host.split(".")[0];
    const app = APPS[sub];
    if (!app) return fail(res, "Unknown module.");

    const data = verifyTicket(url.searchParams.get("t"));
    if (!data) return fail(res, "This sign-in link expired. Reopen the module from the admin panel.");
    if (data.app && data.app !== sub) return fail(res, "This link is for a different module.");
    if (!app.pass) return fail(res, "This module's account isn't set up on the server yet.");

    const result = await STRATEGIES[app.strategy](app);
    relayCookies(res, result.cookies);
    if (result.html) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(result.html);
    }
    res.writeHead(302, { Location: result.redirect });
    res.end();
  } catch (e) {
    fail(res, (e && e.message) || "Sign-in failed.");
  }
});

server.listen(PORT, () => console.log(`ek-sso on :${PORT}`));
