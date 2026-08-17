# Unified Admin Plan — apps as features, one login

Goal: staff sign into the Ehi-Kings admin **once** and use email marketing,
automation, support, scheduling, social, and CRM as if they were built-in tabs —
no separate logins into listmonk / n8n / Postiz / Twenty / Chatwoot / Cal.com.

## The honest constraint up front

True single-sign-on into every app's own UI is gated: n8n, Twenty, Chatwoot and
Cal.com all sell SAML/OIDC SSO as **enterprise features**. So the winning
strategy is not "SSO into six dashboards" — it's:

> **Native-first:** the admin talks to each app through its REST API using
> server-side API keys (stored in Convex env, never in the browser). Staff use
> OUR pages; the apps become invisible engines. Where an app's UI is still
> needed, we auto-login or embed it same-origin.

This is exactly how billion-dollar internal tools are built.

---

## Phase 0 — Same origin + TLS (the foundation) · ~1 hour + DNS wait

1. Add DNS records at the ehikings.com registrar (does not touch the WordPress site):
   - `admin.ehikings.com  A  207.180.245.46`
   - `tools.ehikings.com  A  207.180.245.46` (webhooks/public endpoints)
2. Install **Caddy** on the VPS (one container, auto-HTTPS via Let's Encrypt).
3. Caddy routes, all on `admin.ehikings.com`:
   - `/`                → the admin SPA (static `dist/` served from the VPS — "the code on the VPS", as you suggested)
   - `/apps/listmonk/*` → listmonk:9000
   - `/apps/n8n/*`      → n8n:5678
   - `/apps/postiz/*`   → postiz:5000
   - `/apps/twenty/*`   → twenty:3001
   - `/apps/chatwoot/*` → chatwoot:3002
   - `/apps/cal/*`      → calcom:3003
   - Caddy **strips `X-Frame-Options`** and sets `Content-Security-Policy:
     frame-ancestors admin.ehikings.com` on proxied apps.

Result: everything is HTTPS, same origin. Every app becomes embeddable
(including Chatwoot/Cal which currently refuse), cookies behave, no mixed
content. Raw ports 9000/5678/5000/3001–3003 get closed in ufw — only 80/443
stay public. Vercel keeps serving the public site at ehikings.vercel.app /
ehikings.com; the admin gains a second, VPS-served home at admin.ehikings.com
(the Vercel /admin keeps working for everything Convex-native).

## Phase 1 — One login, app by app · 1–2 days

| App | Strategy | Login result |
|---|---|---|
| **listmonk** | Go fully headless: new admin **Marketing** tab using listmonk's REST API via Convex actions (server-side API token). Create/send campaigns, manage lists, view opens/clicks, auto-sync CRM opt-ins nightly (n8n or Convex cron). | Staff never see listmonk. **Zero extra login.** |
| **Chatwoot** | Best unlock in the lot: Chatwoot's **Platform API can mint login (SSO) links per agent**. Admin "Support" tab → Convex action creates/fetches the agent + SSO link → embedded Chatwoot opens **already signed in**. Plus: its live-chat widget goes on the public site (visitors need no login ever). | **True one-click auto-login.** |
| **n8n** | Treat as plumbing, not a destination. Workflows fire via webhooks + n8n's public API (API key, works in the free version). Only the MD/tech admin ever opens the editor (one shared owner account). | Staff: **no login needed, ever.** |
| **Twenty** | Two-way sync via its REST/GraphQL API: our native CRM tab stays the daily driver; Twenty runs deep pipeline views for power users. Sync leads both ways on a schedule. | Most staff: never log in. Power users: one workspace login. |
| **Cal.com** | Customers book on public pages (no login). Bookings flow into the CRM via Cal webhooks → Convex. Event types managed by one admin account, or replace the Calendly embed with Cal's own embed. | Staff: **no login needed.** |
| **Postiz** | Marketing-team tool: embedded same-origin; newer Postiz supports generic OIDC if we later add an identity provider, else one shared marketing login. Post-scheduling via API where useful. | One shared login (or OIDC later). |

## Phase 2 — The admin absorbs the UIs · 2–4 days, incremental

- **Marketing tab** (replaces listmonk UI): campaigns, lists, subscriber counts,
  send + stats. CRM "consented" leads auto-flow in.
- **Support tab**: Chatwoot conversations embedded with auto-login; unread count
  badge in the sidebar via Chatwoot API.
- **Automations tab**: list of live n8n workflows + last-run status via n8n API;
  "Run now" buttons; deep-link to the editor only for admins.
- **Bookings**: Cal webhook → CRM lead with `inspection_booked` stage
  (Tue/Thu/Sat 10:00 rules configured inside Cal event types).
- Existing **Apps** tab stays as the "raw doors" for admins/debugging.

## Phase 3 — Automation glue (n8n flows) · ongoing

1. New CRM lead → notify Team Chat + create follow-up task (2-day SLA).
2. Newsletter opt-in → listmonk list → welcome campaign.
3. Chatwoot conversation resolved → log to CRM timeline.
4. Paystack payment reference recorded → receipt email + MD notification.
5. Inspection booked (Cal) → reminder email 24h before (Tue/Thu/Sat 10:00).

## Security items bundled into Phase 0
- Close raw app ports (ufw), everything through Caddy 443 only.
- Rotate: VPS root password, listmonk admin password, pasted API keys
  (InsForge `uak_…`, NVIDIA). Disable SSH password auth (key already installed).
- App API keys live in Convex env / VPS env — never in the browser bundle.

## What I need from you
1. **Registrar access or two DNS records added**: `admin` + `tools` A-records → `207.180.245.46`.
2. Confirm the admin's home: keep Vercel `/admin` AND add `admin.ehikings.com` (recommended), or move admin fully to the VPS.
3. Green light per phase — Phase 0 is the unblocker for everything.

Cost of all of this: **₦0/month beyond the VPS you already bought.**
