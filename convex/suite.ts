import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// One-click SSO for the Suite modules that live on the VPS behind the ek-sso
// gateway (listmonk, n8n, Postiz, Cal.com, Twenty). We mint a short-lived
// HMAC ticket from the signed-in staff session; the browser opens
// https://<app-host>/ek-sso?t=<ticket>, the gateway verifies it and hands back
// the app's own session cookie. Chatwoot has its own SSO (see support.ts).
//
// Env (Convex): EK_SSO_SECRET (shared with the gateway),
//   VITE-independent app hosts are fixed below.

// Only n8n (automations) remains on the VPS after the redundant app suite was
// decommissioned and rebuilt natively. Marketing/social/CRM/support are now
// native admin pages and no longer SSO into a self-hosted engine.
const HOSTS: Record<string, string> = {
  automations: "https://automations.207-180-245-46.sslip.io",
};

// n8n's free edition has a single shared owner account (everyone lands in the
// same workspace) — surfaced to the UI for an honest label.
const SHARED = new Set(["automations"]);

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return b64url(new Uint8Array(sig));
}

export const ticket = action({
  args: { token: v.string(), app: v.string() },
  handler: async (
    ctx,
    { token, app },
  ): Promise<{ configured: boolean; url?: string; shared?: boolean; error?: string }> => {
    const me = await ctx.runQuery(api.auth.me, { token });
    if (!me) throw new Error("Not authenticated.");
    if (me.role === "Worker") throw new Error("The Suite is available to Agents and above.");

    const host = HOSTS[app];
    if (!host) return { configured: false, error: "Unknown module." };
    const secret = process.env.EK_SSO_SECRET;
    if (!secret) return { configured: false, error: "SSO is not configured on the backend yet." };

    const payload = {
      app,
      email: me.email,
      name: me.name,
      role: me.role,
      exp: Math.floor(Date.now() / 1000) + 120, // 2-minute window
    };
    const payloadB64 = b64url(new TextEncoder().encode(JSON.stringify(payload)));
    const sig = await sign(payloadB64, secret);
    const url = `${host}/ek-sso?t=${payloadB64}.${sig}`;
    return { configured: true, url, shared: SHARED.has(app) };
  },
});
