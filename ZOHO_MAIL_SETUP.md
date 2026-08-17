# Connecting Zoho Mail (per-user)

Each employee links **their own** Zoho mailbox from `/admin/mail` and sees only
their own inbox; they can also send mail from their own address. This uses a
single Zoho OAuth client (one app) that every staff member authorizes
individually via a redirect flow handled by Convex.

> The **Mail** tab is visible to every signed-in staff member. Each person's
> inbox and tokens are isolated per user in the `mailAccounts` table.

---

## One-time admin setup

### 1. Create a Server-based Application
At **https://api-console.zoho.com → Add Client → Server-based Applications**
(NOT Self Client — per-user OAuth needs a redirect URI).

- **Homepage URL:** `https://ehi-kings-real-estate.vercel.app`
- **Authorized Redirect URIs:** add **both** of these:
  - `https://third-tern-430.convex.site/zoho/callback`  ← production
  - `https://basic-guineapig-352.convex.site/zoho/callback`  ← local dev (optional)

Copy the **Client ID** and **Client Secret**.

### 2. Put the client credentials on the backend

```bash
npx convex env set --prod ZOHO_CLIENT_ID     <client id>
npx convex env set --prod ZOHO_CLIENT_SECRET <client secret>
```

(Already set for you, no action needed: `ZOHO_REDIRECT_URI`, `APP_URL`. For
non-`.com` regions also set `ZOHO_ACCOUNTS_HOST` / `ZOHO_MAIL_HOST`.)

That's it for setup. No refresh token or account ID to manage by hand — those are
captured per user automatically when they connect.

---

## What each employee does

1. Sign in to the dashboard, open **Mail**.
2. Click **Connect my Zoho Mail** → approve access on Zoho's screen.
3. They're redirected back; their inbox loads. Done.

Scopes requested: `ZohoMail.messages.READ`, `ZohoMail.messages.CREATE`,
`ZohoMail.accounts.READ` (read + send + identify the account).

---

## How it works

- [`convex/zoho.ts`](convex/zoho.ts) — `connectUrl` (builds the consent URL with a
  one-time `state` nonce), `status`, `listInbox`, `sendMail`, `disconnect`.
- [`convex/http.ts`](convex/http.ts) — `GET /zoho/callback` exchanges the code for
  the user's refresh token, reads their account id + from-address, and stores it
  in `mailAccounts` keyed by `userId`, then redirects back to `/admin/mail`.
- Only the per-user **refresh token** is stored (server-side, in Convex). Each
  request mints a fresh 1-hour access token. Nothing sensitive reaches the browser.

## Notes
- The previous shared-mailbox env vars (`ZOHO_REFRESH_TOKEN`, `ZOHO_ACCOUNT_ID`)
  are no longer used and can be removed: `npx convex env remove --prod ZOHO_REFRESH_TOKEN`.
- To restrict who can use Mail, gate the nav item / `listInbox` on a capability
  (e.g. `view_reports`) — currently open to all signed-in staff by design.
