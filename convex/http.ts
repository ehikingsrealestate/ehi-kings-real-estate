import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { randomToken } from "./crypto";

const http = httpRouter();

function titleize(localPart: string): string {
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Zoho OAuth redirect target. Registered as the client's Redirect URI:
//   https://<deployment>.convex.site/zoho/callback
http.route({
  path: "/zoho/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const appUrl = process.env.APP_URL ?? "https://ehi-kings-real-estate.vercel.app";
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "ehikings.com").toLowerCase();

    const back = (path: string) => Response.redirect(`${appUrl}${path}`, 302);
    const fail = (where: "login" | "mail", msg: string) =>
      back(`/admin/${where === "login" ? "login" : "mail"}?zoho=error&msg=${encodeURIComponent(msg)}`);

    if (!code || !state) return fail("login", "Missing authorization code.");

    const bundle = await ctx.runQuery(internal.zoho.userForState, { state });
    if (!bundle) return fail("login", "This sign-in link expired — try again.");

    const accountsHost = process.env.ZOHO_ACCOUNTS_HOST ?? "https://accounts.zoho.com";
    const mailHost = process.env.ZOHO_MAIL_HOST ?? "https://mail.zoho.com";

    try {
      // 1. code -> tokens
      const tokRes = await fetch(`${accountsHost}/oauth/v2/token`, {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.ZOHO_CLIENT_ID!,
          client_secret: process.env.ZOHO_CLIENT_SECRET!,
          redirect_uri: process.env.ZOHO_REDIRECT_URI!,
          code,
        }),
      });
      const tok = await tokRes.json();
      if (!tok.refresh_token) return fail(bundle.purpose === "login" ? "login" : "mail", tok.error ?? "No refresh token returned.");

      // 2. read the Zoho account (email, id, from-address, display name)
      const accRes = await fetch(`${mailHost}/api/accounts`, {
        headers: { Authorization: `Zoho-oauthtoken ${tok.access_token}` },
      });
      const accJson = await accRes.json();
      const acc = (accJson?.data ?? [])[0] ?? {};
      const accountId = String(acc.accountId ?? "");
      const email = (acc.primaryEmailAddress ?? acc.mailboxAddress ?? acc.incomingUserName ?? "").toLowerCase();
      const displayName = acc.displayName ?? acc.accountDisplayName ?? "";
      const fromAddress =
        acc.sendMailDetails?.find((d: { fromAddress?: string }) => d.fromAddress)?.fromAddress ?? email;
      if (!accountId || !email) return fail(bundle.purpose === "login" ? "login" : "mail", "Could not read your Zoho account.");

      // ── LOGIN: find/create the staff account, start a session ──
      if (bundle.purpose === "login") {
        if (!email.endsWith(`@${allowedDomain}`)) {
          return fail("login", `Use your @${allowedDomain} email to sign in.`);
        }
        const name = displayName || titleize(email.split("@")[0]);
        const userId = await ctx.runMutation(internal.zoho.findOrCreateUser, { email, name });
        await ctx.runMutation(internal.zoho.saveAccount, { userId, email, accountId, refreshToken: tok.refresh_token, fromAddress, state });
        const sessionToken = randomToken();
        await ctx.runMutation(internal.zoho.createLoginSession, { userId, token: sessionToken });
        // Hand the session back via URL fragment (not sent to servers / logs).
        return back(`/admin#token=${sessionToken}`);
      }

      // ── CONNECT: link mailbox to the already-signed-in user ──
      if (!bundle.userId) return fail("mail", "Sign in again, then connect.");
      await ctx.runMutation(internal.zoho.saveAccount, {
        userId: bundle.userId,
        email,
        accountId,
        refreshToken: tok.refresh_token,
        fromAddress,
        state,
      });
      return back("/admin/mail?zoho=connected");
    } catch (e) {
      return fail(bundle.purpose === "login" ? "login" : "mail", (e as Error).message);
    }
  }),
});

// Cal.com webhook → CRM lead. Point a Cal.com webhook (BOOKING_CREATED) at:
//   https://third-tern-430.convex.site/cal/webhook
http.route({
  path: "/cal/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      if (body?.triggerEvent !== "BOOKING_CREATED") {
        return new Response(JSON.stringify({ ok: true, ignored: body?.triggerEvent ?? "unknown" }), { status: 200 });
      }
      const p = body.payload ?? {};
      const attendee = (p.attendees ?? [])[0] ?? {};
      const start = p.startTime ? new Date(p.startTime) : null;
      await ctx.runMutation(api.crm.submitLead, {
        name: attendee.name ?? "Cal.com booking",
        email: attendee.email ?? undefined,
        message: `Cal.com booking: ${p.title ?? "booking"}${p.description ? ` — ${p.description}` : ""}`,
        bookingType: "inspection",
        service: p.title ?? "Scheduled booking",
        source: "cal.com webhook",
        preferredDate: start ? start.toISOString().slice(0, 10) : undefined,
        preferredTime: start ? start.toISOString().slice(11, 16) : undefined,
        consentMarketing: false,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 200 });
    }
  }),
});

// Instagram (Meta) OAuth redirect target. Register this URL in the Meta app:
//   https://<deployment>.convex.site/instagram/callback
http.route({
  path: "/instagram/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // the staff session token
    const appUrl = process.env.APP_URL ?? "https://ehikings.vercel.app";
    if (!code || !state) return Response.redirect(`${appUrl}/admin/social?ig=error`, 302);
    const res = await ctx.runAction(api.instagram.completeConnect, { code, userToken: state });
    if (res.ok) return Response.redirect(`${appUrl}/admin/social?ig=connected`, 302);
    return Response.redirect(`${appUrl}/admin/social?ig=error&msg=${encodeURIComponent(res.error ?? "Connection failed")}`, 302);
  }),
});

export default http;
