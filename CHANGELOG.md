# Changelog

Running log of features added / changed, newest first.

## 2026-07-16 (Claude) — Imported 284 clients from the estate sheet + marketer field

- **Imported the real client data**: "ESTATE AND E-MAIL SHEET.xlsx" — 13
  sheets, one per estate, columns NAME / PHONE / EMAIL / MARKETER. Each
  client tagged with its estate (sheet name) + marketer. 303 rows → **284
  unique clients across 13 estates** (208 with marketer, 195 email, 213
  phone). Handled: double-table sheet (ABIJO), "NIL" cells, leading
  punctuation on phones, multi-value email/phone.
- **New `marketer` variable** (schema + CRM list + LeadPanel edit + sort
  option) — the agent who brought each client.
- **importLeads is now an UPSERT** (match by email → phone → name+estate) so
  re-importing updates existing clients instead of duplicating. The original
  50 Grace Court records were matched + updated (estate + marketer added),
  not duplicated. New `crm.removeLeads` mutation; cleaned 10 stale
  dup/test records.
- **UI import now tags each Excel sheet with its estate name** and maps
  MARKETER + cleans phone/NIL — so future re-uploads of this workbook work
  the same way.
- **Verified live**: By-estate view shows all 13 estates (e.g. "PERFECT
  GARDEN ESTATE ABOREJI — 89 leads") with clients listed + clickable — the
  "click an estate → see its clients" ask. Deployed to ehikings.com.

## 2026-07-08 (Claude) — CRM verified live + reclassify 50 to Clients + robust import

- **Verified the whole CRM end-to-end** against real data (50 records) by
  driving the actual admin UI + backend with a temporary, since-removed
  admin-session helper: Notion panel, per-channel toggles, estate picker,
  Leads/Clients switch, 12 sort keys, broadcast composer — all confirmed
  working. Backend list/update/celebrations verified via CLI.
- **Reclassified the 50 imported records Leads → Clients** (they were the
  wrong type). New `crm.setRecordTypeBulk` mutation (ids or all) + a "Move to
  Clients/Leads" button on the CRM selection bar.
- **Importer hardened for messy real-world sheets**: rowsToObjects now drops
  blank leading rows and auto-detects the header row (by known column names /
  most-populated row), so exports with a title row or header on row 2 parse
  correctly. Confirmed against a real 4-sheet workbook (found a 522-row RSVP
  sheet parse cleanly).
- Vercel CLI updated 54.20 → 56.2.0. Deployed to prod; aliased ehikings.com +
  www + ehikings.vercel.app; temp helper removed and redeployed.

## 2026-07-08 (Claude) — CRM: Clients DB, per-channel consent, broadcast, multi-sheet

Built with a research workflow (mapped social/marketing/import + ranked OSS
references: Twenty/Mautic/Chatwoot/Postiz → verdict: build natively) and an
adversarial review workflow (caught + fixed 3 bugs pre-deploy).

### Data model (convex/schema.ts, crm.ts)
- leads gain `recordType` ('lead'|'client') and `contactPrefs`
  {email,sms,whatsapp}. Legacy `consentMarketing` kept and mirrored to
  contactPrefs.email (both directions, in updateLead). listLeads normalises
  legacy rows + filters by recordType. Deployed to Convex.
- New `broadcast` action: segment = recordType + stage + channel opt-in.
  Email sends via Zoho now; SMS via Twilio, WhatsApp via Meta Cloud API when
  their env keys are set (otherwise reports "not connected"). Cap 300/send.

### CRM UI (src/admin/CRM.tsx, LeadPanel.tsx)
- **Clients database**: a Leads/Clients switch — same views/tools for both.
- **Per-channel consent**: single opt-in replaced by Email/SMS/WhatsApp
  chips (list) + toggles (panel) + a record-type selector; "reachable"
  stat + channel filter.
- **Broadcast composer**: email/SMS/WhatsApp to the current segment.
- **Multi-sheet Excel import**: reads every sheet (readXlsxFile default
  export → [{sheet,data}]); picker chooses sheet(s) + target (leads/clients).
  Full column mapping incl. birthday/anniversary/move-in, tags, notes, and
  per-channel consent columns.
- **Sort by 12 keys**: date added (new/old), name, stage, priority, last
  contacted, budget, estate, booking type, upcoming celebration, opt-in,
  source.
- **Inline editable estate**: property is a dropdown on each row (change
  Charis Garden → Audacious without opening the record).

### Review fixes (pre-deploy)
- CRITICAL: `btoa()` doesn't exist in Convex runtime → added a b64 helper
  (matches marketing.ts) for the Twilio SMS auth header.
- consentMarketing could diverge from contactPrefs.email → both now sync
  whichever side is edited.
- CSV parser mangled quoted commas ("Smith, John") → replaced with an
  RFC-4180 parser (verified: keeps commas inside quotes).

### Deploy
- Deployed to Vercel prod; aliased ehikings.com + www + ehikings.vercel.app;
  verified live (server: Vercel).

## 2026-07-08 (Claude) — Notion-style CRM upgrade + ehikings.com live

### CRM (src/admin/CRM.tsx, LeadPanel.tsx, convex/crm.ts, schema.ts)
- **Notion-style lead profile**: click any lead name (or row in By-estate /
  Celebrations) → a right-side slide-over (`LeadPanel.tsx`) opens with the
  full profile. Inline-editable contact, budget, service; stage / priority /
  owner selects; marketing opt-in; linked estate card (photo, price,
  features pulled from the live listings); notes; and the celebrations
  editor. Everything autosaves via the extended `crm.updateLead`.
- **Celebrations**: leads carry an `events[]` (kind/date/note) — birthday,
  anniversary, move-in, custom. New `crm.upcomingCelebrations` query returns
  the next 60 days of recurring dates; a "Celebrations" CRM view lists them
  ("in 3 days", "Today 🎉") with one-click open to send wishes.
- **By estate** view: leads grouped by their estate of interest, each group
  showing the live estate's photo, price and feature chips.
- **Mass email**: checkbox multi-select in the Leads list + a bulk composer
  (`crm.bulkEmail` action) that sends one message to all selected leads via
  the sender's Zoho mailbox, `{{name}}` personalisation, and marks each
  contacted. Capped at 200/send.
- **CSV import** now also maps birthday / anniversary / DOB columns into
  celebration events (existing name/email/phone/property mapping kept).
- schema: `leads.events[]` and `leads.tags[]` added; `updateLead` extended to
  edit every field. Deployed to Convex.

### Domain
- ehikings.com nameservers propagated to Vercel; re-aliased ehikings.com +
  www + ehikings.vercel.app to the new production build. Verified
  `server: Vercel` serving the site (old Hostinger PHP site gone). Zoho email
  (MX/SPF/DKIM pre-loaded in Vercel DNS) preserved.

## 2026-07-10 (Claude) — Admin UX pass: scrollable sidebar, Settings, ops dashboard, cloud login fix

### Fixed
- **Sidebar couldn't scroll** — with 18 destinations the nav overflowed the
  viewport and the footer was unreachable. Nav is now `flex-1 min-h-0
  overflow-y-auto`; the profile/theme/sign-out footer stays pinned.
- **OpenCloud "Logging you in" hang** (cloud.207-180-245-46.sslip.io) — the
  browser-side OIDC pointed straight at accounts.zoho.com, whose token endpoint
  blocks CORS so the SPA exchange can never finish. Restored OpenCloud's
  built-in sign-in (LibreGraph IdP) on the VPS; Zoho SSO for the cloud parked
  until a server-side OIDC broker exists (compose backup: docker-compose.yml.bak-oidc).
- **Suite → AI Assistant "Open signed-in"** always failed (minted an SSO ticket
  for a gateway that doesn't exist); now opens the console directly.

### Added
- **/admin/settings for every role** (`src/admin/Settings.tsx` + nav + route):
  profile (name/title/phone with new `users.updateProfile` mutation + schema
  `phone` field; `auth.me` returns phone/createdAt), account (email/role),
  mailbox (Zoho connect/disconnect status), appearance (theme), security.
- **Industry ops dashboard** (`src/admin/Dashboard.tsx`): KPI strip (new leads
  7d, open leads, pipeline value ₦, overdue tasks, inspections 7d), lead-stage
  funnel, "On deck today" panel, role-aware quick-action pills. Workers keep a
  tasks-only view; existing greeting/command bar/agents sections preserved.

### Verified
- Browser-tested (both themes): login via token, sidebar scroll at short
  viewports, Settings save persists to the live backend, KPIs/funnel/today
  render with real data, zero console errors. tsc + build clean; schema pushed.

## 2026-07-10 (Claude) — Real company media (testimonials, allocations, MD, offers)

Processed the client-supplied "FOR WEB CONTENT" drop and placed each asset in its
right section (all real photos/videos — replacing stock where it counts).

### Added
- **Testimonials section on Home** (`src/components/Testimonials.tsx`, `src/data/media.ts`):
  4 real client testimonial videos (transcoded to 720p H.264 + poster frames,
  click-to-play) + a "physical allocation days" strip of real allocation photos.
- **Current Offers gallery on Properties** (`src/components/CurrentOffers.tsx`):
  9 branded estate flyers as offer cards, each linking to its estate.
- **Per-estate "Current offer" brochure** block on EstateDetail (`brochureFor`).
- **Real MD portrait** in the About leadership carousel (professional studio
  photo, square face-crop → `public/team/kingsley-ehikioya.png`).
- **Real Perfect Garden Estate, Epe photo** as that estate's hero (walled site +
  signboard) — patched in the Convex `properties` table (dev+prod) and static
  fallback; also flows through the AI Matchmaker.

### Notes
- Assets processed with ffmpeg/sips into `public/{team,estates,testimonials,allocations,brochures}`.
- `FOR WEB CONTENT/` added to `.vercelignore` (raw .MOV files exceed Vercel's 100 MB/file limit); only transcoded web videos ship.
- Background removal assessed and judged unnecessary (studio portraits read premium in the circular frames).
- No existing features changed — additive components + data only.

## 2026-07-08 (Claude) — OpenCloud "Login with Zoho" SSO live

- Applied the Zoho OAuth client (id/secret in /root/ehikings/.env as
  ZOHO_CLIENT_ID/SECRET) and switched OpenCloud to external OIDC against
  https://accounts.zoho.com (env in the `opencloud` service: OC_OIDC_ISSUER,
  WEB_OIDC_CLIENT_ID, PROXY_OIDC_REWRITE_WELLKNOWN, PROXY_AUTOPROVISION_ACCOUNTS,
  PROXY_USER_OIDC_CLAIM=email, PROXY_ACCESS_TOKEN_VERIFY_METHOD=none,
  OC_EXCLUDE_RUN_SERVICES=idp).
- Verified: OpenCloud's /.well-known now advertises Zoho as issuer; Zoho
  authorize endpoint returns 302→login for our client_id+redirect_uri (i.e.
  Zoho accepts the client). cloud.… homepage 200.
- Bootstrapping note: built-in login is now disabled, so staff sign in via
  Zoho and auto-provision as regular users. Owner logs in once, then gets
  promoted to OpenCloud admin via `docker exec … opencloud graph/users` CLI.
  Break-glass: built-in admin still in idm.boltdb — revert the OIDC env to
  restore local login.
- Docs `selfhost/opencloud-zoho-sso.md` reflects the applied config.

## 2026-07-08 (Claude) — Company Cloud in the admin panel + prod deploy

### Admin: Company Cloud launcher (src/admin/CompanyCloud.tsx)
- New `/admin/cloud` page + "Cloud" nav item, visible to ALL staff (workers
  included). Three launch tiles — Company Drive (OpenCloud), Company Docs
  (Docmost), Company Photos (Ente) — open the self-hosted apps in a new tab,
  each with a login hint. Admins also see a setup checklist.
- URLs from VITE_APP_CLOUD_URL / DOCS_URL / PHOTOS_URL with hardcoded sslip.io
  fallbacks so the tiles work with zero extra config.

### Company SSO groundwork
- Verified the real constraints: OpenCloud supports external OIDC (can do
  "Login with Zoho"); Docmost SSO is Enterprise-only (community = email
  invite); Ente cannot SSO at all (E2E — the password IS the key). Zoho is a
  valid OIDC IdP.
- Wrote `selfhost/opencloud-zoho-sso.md`: exact Zoho api-console steps +
  ready-to-apply OpenCloud OIDC env (auto-provision on). Blocked only on a
  Zoho OAuth client id/secret from the owner.

### Shipped to production (ehikings.vercel.app)
- Deployed + re-aliased. This finally lands: the empty `VITE_CONVEX_URL`
  fix (AI chat / chatbot / admin backend were dead on the live domain —
  now pointed at basic-guineapig-352.convex.cloud, verified in the bundle),
  journal editor visible to workers (nav + page + backend gate relaxed to
  any staff), and the Company Cloud page.

## 2026-07-08 (Claude) — Company cloud on the VPS: OpenCloud + Docmost + Ente

Added a self-hosted "company cloud" to the `/root/ehikings` docker stack
(mirrored in `selfhost/`), all behind the existing Caddy with automatic HTTPS
on sslip.io hosts. 9 new containers, ~2.6 GB RAM used total, 9 GB free.

- **OpenCloud** (files/Drive) → https://cloud.207-180-245-46.sslip.io.
  Single-binary `opencloudeu/opencloud`, built-in IDP, `PROXY_TLS=false`
  behind Caddy, `OC_URL` = public https. Login `admin` + `OC_ADMIN_PASSWORD`
  (in VPS .env). Verified: page + OIDC discovery resolve.
- **Docmost** (team docs/wiki) → https://docs.207-180-245-46.sslip.io.
  App + postgres:18-alpine + redis:8. Note: pg18 needs the volume at
  `/var/lib/postgresql` (not `/data`) — fixed after first-boot crashloop.
  First visitor creates the workspace/admin.
- **Ente** (E2E-encrypted photos & 2FA) → https://photos.207-180-245-46.sslip.io,
  museum API at photos-api.…, public albums at albums.…. museum
  (`ghcr.io/ente/server`) + postgres:15 + minio (3 buckets via the socat
  localhost:3200 trick) + web (`ghcr.io/ente/web`, `ENTE_API_ORIGIN` = public
  api). Config in `selfhost/ente/museum.yaml` (secrets from .env). Verified:
  `/ping` → pong, signup OTP → 200 + code generated.
- Caddy: 5 new vhosts (cloud/docs/photos/photos-api/albums), 10 GB body
  limit on cloud + photos-api for large uploads.
- Follow-up: no SMTP yet — Ente signup codes and Docmost/OpenCloud invite
  emails print to `docker logs`; add SMTP creds to make sign-up self-serve.

## 2026-07-07 (Claude) — Journal dark-flash fix + Contact scheduling restored

### Fixed: Journal (and any short/transitioning page) flashed dark
- Root cause: the base `body` background was the old dark luxury token
  (`:root --color-bg`, oklch 0.16). The white `.site-shell` covers it only
  when tall enough, so on the Journal page — and during route transitions —
  the dark body bled through the lower half.
- index.css: body background is now white (oklch 0.995); `.site-shell` and
  `.site-shell > main` are explicitly white with `min-height: 60vh` so no
  public route can reveal the body. Admin is unaffected — `.admin-os` paints
  its own full-viewport background over the body. Verified in-browser: the
  black lower half is gone.

### Contact page — scheduling section restored + animations
- Re-added the clean "Schedule" block that had been dropped: three booking
  cards (Book a consultation / Book a site inspection / Pay for land online)
  as cursor-spotlight cards, plus the live inspection-calendar iframe
  (VITE_APP_CAL_URL / VITE_CALENDLY_INSPECTION_URL) with a Tue/Thu/Sat 10:00
  helper header, and a graceful placeholder when the URL isn't set.
- Added animation throughout Contact: BlurText word-reveal headings,
  drawn-in GrowRule hairlines, Reveal scroll-ins on the cards + calendar,
  a Magnet on the submit button, and a spring pop-in on the success state.

### Deployed
- Built and pushed to Vercel production; re-aliased ehikings.vercel.app and
  ehi-kings-real-estate.vercel.app to the new build (200 OK).

## 2026-07-07 (Claude) — AI chatbot with CRM lead capture + ehikings.vercel.app fix

### ChatWidget → AI assistant (src/components/ChatWidget.tsx)
- The public chat is now AI-first: the start form asks name, email (now
  required), and "how can we help"; on start it (1) opens the support-inbox
  conversation staff already see in the admin, (2) files a CRM lead with
  `service: 'AI Chatbot'`, `source: 'website chatbot'` — the "chatbot leads
  from website" — and (3) answers instantly via the grounded
  `api.assistant.publicAsk` action (real listing/site data, no invented
  facts). Every follow-up message gets an AI reply with the conversation
  history; a "Ehi-Kings AI is typing…" indicator shows while it thinks.
- New `api.inbox.postAssistantMessage` mutation (visitor-token-gated) posts
  the AI's replies into the same thread, so the admin inbox shows the whole
  AI conversation and staff can take over anytime. AI failures degrade
  silently to human-reply mode. Deployed to Convex.
- Verified end-to-end in the browser: form → thread → real AI reply with
  Lekki listing data.

### ehikings.vercel.app was serving a stale build
- The `ehikings.vercel.app` alias pointed at an old deployment. All aliases
  (ehikings.vercel.app + ehi-kings-real-estate.vercel.app) now point at
  today's production build, and future deploys were re-aliased after each
  push in this session.

## 2026-07-07 (Claude) — Production deploy + self-hosted Cal.com scheduling

### Deployed
- Pushed to Vercel production (twice: once immediately, once after wiring the
  scheduling env var so the build bakes it in).

### Cal.com re-added to the VPS stack (Calendly fix)
- Root cause: the Book page's scheduling embed reads
  VITE_CALENDLY_INSPECTION_URL / VITE_APP_CAL_URL, but the production value
  was EMPTY and the old scheduling host had been decommissioned.
- selfhost/docker-compose.yml: re-added `cal` (calcom/cal.com:latest,
  127.0.0.1:3001→3000, 2GB limit) + `cal-db` (postgres:16-alpine, persistent
  volume). Secrets (CAL_NEXTAUTH_SECRET, CAL_ENCRYPTION_KEY) generated into
  /root/ehikings/.env on the VPS; reuses existing CAL_PW.
- selfhost/Caddyfile: new scheduling.207-180-245-46.sslip.io vhost →
  cal:3000 with the embeddable snippet (X-Frame-Options stripped,
  frame-ancestors now also allows https://ehikings.com / *.ehikings.com).
- Vercel env: VITE_APP_CAL_URL=https://scheduling.207-180-245-46.sslip.io
  (Production) — the Book page's inspection embed + link light up with it.
- First-run: visit /auth/setup on the scheduling host to create the admin
  user, then create a "Site inspection" event type (Tue/Thu/Sat 10:00,
  2-day minimum notice — Cal.com supports both natively) and optionally set
  VITE_CALENDLY_INSPECTION_URL to that event's direct link.

## 2026-07-07 (Claude) — Journal↔admin, admin reskin/animations, MD's booking list

### Journal connected to the admin panel
- New `posts` Convex table + `convex/posts.ts` (public `list`/`getBySlug`;
  admin `listAll`/`upsert`/`setPublished`/`remove`/`importPosts`) — deployed.
- New admin page `/admin/journal` (src/admin/Journal.tsx): list with Live/
  Draft badges, publish/unpublish, delete, full editor (title, slug,
  category, date, reading time, excerpt, body paragraphs, SEO meta +
  keywords), one-click "Import current articles" seeding the 5 static posts.
  Registered in App.tsx routes + AdminLayout nav (admin-only).
- Public Blog/BlogPost now read Convex via new `src/data/usePosts.ts`
  (fallback to the static JOURNAL while the table is empty; loading-aware so
  Convex-only posts don't flash NotFound).

### Admin panel — brand look + animations
- Default theme is now the light brand look (saved preference still wins).
- Dashboard: hero greeting is a BlurText word reveal; all four signal
  stats now CountUp; new "Open leads" signal (replaces Completed; counts
  leads not closed/lost); new CRM (open-lead count) and Journal workspace
  tiles.
- CRM: new "Open (not closed)" segment in the stage filter — the "leads we
  haven't closed" view.

### MD's list — status after this pass
- Tue/Thu/Sat 10:00 + 2-days-advance inspection rule: already enforced in
  Book.tsx (verified: min date = today+2, day check on submit).
- Booking pages now DIFFERENT per flow: mode-driven BlurText hero ("Book a
  consultation." / "Book a site inspection." / "Pay for land online."),
  flow-specific info cards, inspection-only rule card + date helper text.
- Calendly: existing VITE_CALENDLY_INSPECTION_URL embed now also accepts
  VITE_APP_CAL_URL (self-hosted Cal.com) as fallback.
- Pay for land + sign-in: Paystack checkout already live on Book page; now
  prefills name/email/phone from the signed-in customer, shows an account
  card ("payment recorded against your account") and a sign-in prompt for
  guests; estate pages already deep-link with the property slug.
- 2-day response copy: already present across Book/Contact/EstateDetail.
- Newsletter/email marketing: footer + booking opt-ins already stored as
  consentMarketing leads; admin Marketing already syncs opt-ins to Listmonk
  and sends campaigns (SMTP config in-app). Lead-gen: CRM + import + new
  open-leads segment.

## 2026-07-07 (Claude) — 20+ new effects (lenis/react-spring/ark/mantine/rive) + About rebuild

### New dependencies (all requested repos integrated)
- `lenis` — site-wide inertial smooth scrolling (LenisProvider in Layout,
  exposed as `window.__lenis`; nav reset + back-to-top ride it).
- `@react-spring/web` — leadership carousel slot springs, hero word rotator,
  carousel text transitions.
- `@mantine/hooks` — `useInterval` (carousel auto-rotate, word rotator) and
  `useHover` (pause-on-hover).
- `@ark-ui/react` — headless Accordion powering the new About FAQ.
- `@rive-app/react-canvas` — `RiveSlot` component; renders any `.riv` dropped
  into `public/rive/` (graceful no-op until an asset exists).

### About page — fixed + rebuilt (src/pages/About.tsx)
- Leadership section replaced with `LeadershipCarousel` (fx/): a triangle of
  three floating circular portraits — focused person large at top-centre with
  a pulsing halo, other two smaller at bottom-left/right, all levitating on a
  slow CSS bob. Arrows / dots / clicking a portrait / 5s auto-rotate (paused
  on hover) spring the next photo up into focus; name, role, and bio
  cross-fade alongside. Fixes: MD portrait now perfectly circular
  (aspect-square + rounded-full); the other two portraits are much bigger and
  float, per request.
- New FAQ section ("Answers before you ask.") on Ark Accordion with smooth
  --height open/close animation; 4 grounded Q&As (titles, building on owned
  land, payment plans, coverage).
- BlurText word reveals on the h1/h2s and philosophy quote; GrowRule drawn-in
  hairlines under eyebrows; Reveal on mission/vision + values; values numbers
  unified to green accent-2; RiveSlot placed in the header (md+).

### New fx kit (src/components/fx/)
- `LenisProvider`, `ScrollProgress` (top gradient bar), `BackToTop`
  (spring pop-in after 1200px), `RotatingText` (react-spring word flip),
  `GrowRule` (self-drawing hairline), `VelocitySkew` (scroll-velocity skew),
  `confetti.ts` (canvas burst), `FaqAccordion`, `LeadershipCarousel`,
  `RiveSlot`.

### Site-wide effects wired in
- Layout: Lenis, scroll progress bar, animated route transitions
  (AnimatePresence fade/rise between pages), back-to-top button.
- Nav: hides on scroll down / reveals on scroll up (rAF-driven); logo
  tilts + scales on hover.
- Hero: two shooting stars streak across the sky on loops; subline noun
  rotates (Land → Homes → Builds → Estates).
- Home: GrowRule under Company/Portfolio/Services eyebrows; process panel
  breathes (animated radial light); marquee skews with scroll velocity.
- EstateGrid: photos unveil with a bottom-up clip-path curtain on scroll;
  slower, deeper Ken Burns zoom on hover.
- Footer: card rises in on view; confetti bursts from the subscribe button
  on success.
- ChatWidget: pulsing attention ring on the launcher when closed.
- index.css: float-bob, focus-pulse, shooting-star, panel-breathe, faq
  open/close, chat-pulse keyframes.

## 2026-07-07 (Claude) — Automations hub, AI Matchmaker, SEO/analytics, lean VPS

### New: AI Property Matchmaker (public, flagship)
- `convex/match.ts` — public `suggest({brief, budget?})` action. Rule-based
  scoring over live listings (kind, location, budget, features) + a warm
  AI "why it fits" line per match. Reuses the assistant's multi-provider
  fallback chain via new `internal.assistant.rawCompletion` (Gemini→Groq→
  DeepSeek→NVIDIA) so one provider's quota/outage never disables the copy;
  clean grammatical fallback when no provider answers.
- `src/components/PropertyMatchmaker.tsx` on `src/pages/Properties.tsx` — buyer
  describes what they want in plain words, gets ranked matches with links.
  Verified end-to-end in-browser (renders, submits, AI blurbs, 0 errors).

### New: Automations hub (n8n, connected to the whole company)
- `src/data/automations.ts` — 8 curated real-estate automations adapted from
  Zie619/n8n-workflows + enescingoz/awesome-n8n-templates.
- `src/admin/Automations.tsx` (+ route + nav) — catalog with category filter,
  a colour-coded left→right flow diagram per automation, how-to steps, and a
  one-click "Launch in n8n" that opens n8n signed-in via `suite.ticket`.

### SEO + analytics
- `src/components/Seo.tsx` (per-page title/description/OG/Twitter/canonical),
  applied to every public page; `public/robots.txt` (+ `Disallow: /admin`)
  and `public/sitemap.xml`; `<Analytics/>` (@vercel/analytics) in main.tsx;
  richer default `<title>`/meta/OG in index.html.

### Trimmed / removed (per "add a feature, delete a useless one")
- Admin agents 17 → 5 (kept lead-intake, buyer-match, listing-manager,
  follow-up, pipeline) in `src/data/adminAgents.ts`.
- Suite: removed dead "Marketing Console" card (listmonk decommissioned) and
  the Chatwoot SSO path (Support is native); `suite.ts` HOSTS trimmed to just
  the live n8n host; Marketing tab degrades to "email runs via Automations".
- VPS decommissioned to a lean 4-container stack (Caddy, n8n, PicoClaw, SSO);
  removed Chatwoot/Twenty/Cal.com/listmonk/Postiz — ~20 GB disk + 6 GB RAM
  reclaimed. n8n kept and reachable at automations.207-180-245-46.sslip.io.

## 2026-07-07 (Claude) — React-Bits animation layer (dopamine pass)

### New kit: src/components/reactbits/ (adapted from DavidHDev/react-bits)
- `BlurText` — per-word blur/rise reveal on scroll-into-view (+ `as` prop for
  h1/h2 semantics); `ShinyText` — looping shine sweep across text;
  `CountUp` — spring number counter on view; `ClickSpark` — gold spark
  burst on every click (fixed full-viewport canvas + window listener);
  `Magnet` — cursor-magnetic buttons; `SpotlightCard` — cursor-tracking
  radial glow (unstyled base); `TiltCard` — 3D perspective tilt + tracking
  glare (motion springs); `StarBorder` — orbiting light border (brand
  restyle); `Marquee` — seamless CSS marquee (uniform gap, pauses on
  hover); `TwinkleStars` — own 2D-canvas star field (DPR-aware).
- index.css: `marquee-scroll`, `star-movement-top/bottom` keyframes and
  `.star-border-glow*` positioning.

### Integrations
- Layout: global `<ClickSpark sparkColor="#d9a94f">` (champagne, matches
  the building lights).
- Hero: `TwinkleStars` twinkling in the dusk sky; eyebrow + "Featured
  development" caption → ShinyText; headline → BlurText word reveal; both
  CTAs wrapped in Magnet.
- Home: all section headings → BlurText; new CountUp stats row under the
  lede (20+ years, live listings count, 6 services); "All properties" →
  Magnet; services → SpotlightCards (blue glow) with StarBorder + Magnet
  "Book a consultation"; process panel → SpotlightCard (white glow) with
  ShinyText label; new oversized Marquee strip (Land · Homes ·
  Construction · Lekki, Lagos · Ehi-Kings) above the footer.
- EstateGrid: each card wrapped in TiltCard (5° perspective tilt + glare).
- Reduced-motion: TiltCard/stars disabled; scroll reveals degrade gracefully.

## 2026-07-07 (Claude) — SEO basics + Vercel analytics on the public site

### Seo.tsx — dependency-free head manager
- New `src/components/Seo.tsx` renders null and, via `useEffect`, sets
  `document.title` and upserts `description`, `og:title/description/image/
  type=website/url/site_name`, `twitter:card=summary_large_image` (+ title/
  description/image), and a `<link rel="canonical">`. Tags are created if
  missing and updated in place on prop change. Props `{ title, description?,
  image?, path? }`; title auto-suffixed with " · Ehi-Kings Real Estate",
  default og:image `/hero/building-poster.jpg`, canonical/og:image resolved
  to absolute `https://ehikings.vercel.app` URLs.

### Per-page SEO tags (truthful titles + descriptions)
- Added `<Seo>` at the top of Home, About, Properties, Contact, Construction,
  Blog, and EstateDetail. EstateDetail is dynamic — title/description/image
  derived from the estate (canonical `/estates/:slug`, og:image = its media).
- Blog's old inline `useEffect` title/description hack was replaced by `<Seo>`
  (dropped the now-unused `useEffect`/`COMPANY` imports).

### Crawlability + analytics
- New `public/robots.txt` (allow all, `Disallow: /admin`, references sitemap)
  and `public/sitemap.xml` listing /, /about, /properties, /construction,
  /blog, /contact, /book on `https://ehikings.vercel.app`.
- `src/main.tsx` renders `<Analytics/>` from `@vercel/analytics/react` once
  inside the router.
- `index.html` gained default canonical + og/twitter tags (it had none).

## 2026-07-07 (Claude) — AI Property Matchmaker (flagship feature)

### PropertyMatchmaker.tsx — new public component
- Dark, premium on-brand section: headline "Tell us what you're looking
  for," a brief textarea (placeholder example: "3-bedroom home in Lekki
  under ₦80M, gated estate for my family") and an optional budget input,
  plus a "Find my match" button with a `Loader2` busy state.
- Calls the existing `api.match.suggest` action (`{ brief, budget? }` →
  `{ matches }`); no backend changes made, per instructions.
- Renders up to 4 AI-ranked matches as cards — image (via `estateMedia`
  fallback keyed off a minimal `Estate`-shaped object built from the match,
  else `match.img`), name, location, price, and an italic "why it fits"
  line — each linking to `/estates/:slug`.
- Friendly empty state (no close match, links to Contact) and error state
  (inline red banner) if the action throws.

### Properties.tsx — wired in
- Inserted `<PropertyMatchmaker />` (wrapped in the existing `Reveal`
  scroll-in primitive) directly below the page heading and above the
  search/filter + listing grid section, so buyers hit it immediately.
  Existing filters, region chips, and `EstateGrid` are untouched.

## 2026-07-07 (Claude) — Cinematic pinned scroll hero (findrealestate.com-style)

### Audacious3DScroll.tsx — pinned scrub rewrite
- Studied findrealestate.com's hero (500vh track, sticky 100vh stage, layered
  sky/house/clouds/smoke composite scrubbed by scroll, Lenis smoothing) and
  rebuilt ours on the same architecture: a 320vh scroll track with a
  `position: sticky` 100svh stage; ~2.2 viewports of scrolling scrub the
  scene like a film.
- Timeline: (1) centered headline over dusk sky, roofline teasing at the
  bottom edge + animated scroll cue; (2) building rises from below the frame
  in real 3D perspective (y 76%→0, scale 1.14→1, rotateX 12°→0, origin at its
  base), passing in front of the fading content; (3) soft haze plumes drift
  horizontally across the building (opposite directions) for depth, and a
  "Featured development — Audacious Hotel Apartments" caption fades in once
  it settles; (4) mist rolls up over the base and a white gradient hands off
  to the page as the pin releases.
- Scrub progress is read on a requestAnimationFrame loop
  (`window.scrollY / (trackHeight − viewport)`) instead of motion's
  `useScroll` — scroll events proved unreliable in embedded browsers and the
  hero is always at page top, so the manual read is both simpler and robust.
  A spring (stiffness 120, damping 30) smooths the scrub, Lenis-style.
- Haze plumes are hidden and the mist band shortened on <640px so the
  smaller building isn't washed out; reduced-motion renders the static
  one-screen layout.
- Hero content re-centered (Home.tsx) to suit the rising-building
  composition; added `hero-cue` keyframes to index.css.

## 2026-07-07 (Claude) — Professional/minimal redesign + rebuilt 3D scroll hero

### Audacious3DScroll.tsx — hero rebuilt
- New composition: content block sits in the top half, building is a flow
  element anchored to the bottom of the section — headline can no longer
  overlap the building, and the empty-sky void is gone.
- Real 3D scroll: section-scoped `useScroll` (`start start → end start`);
  the building recedes (y 0→18%, scale 1→0.94), tilts back in perspective
  (`rotateX 0→9deg`, `perspective: 1100`, origin at its base) and dims
  slightly, while the content lifts away faster and fades — camera-like
  parallax depth. Springs smooth all transforms.
- Cleaner dusk sky (single 5-stop gradient + one warm horizon glow); removed
  the muddy bottom fade — hero now hands off to the white page with a crisp
  edge. Entrance: building fades/rises in over 1.2s.
- Removed the separate mobile branch (same layout works at all widths);
  reduced-motion renders the identical layout statically.

### Home.tsx — minimal editorial pass
- Hero copy: statement headline (company philosophy) instead of the giant
  company name; small tracking eyebrow; white + ghost-outline buttons; all
  drop shadows and the colored glow shadows removed; facts row dropped.
- All sections: green pill badges replaced with quiet uppercase eyebrows;
  filled colored cards replaced with hairline `border-t` list items
  (Mission/Vision, Services 01–06, Process 01–04); animated `home-progress`
  lines removed; buttons unified to one quiet outline style that fills
  `bg-primary` on hover; MagneticLink and unused scroll code removed.

### Nav.tsx / EstateGrid.tsx / Footer.tsx — de-noised
- Nav: liquid-sheen animation and blue glow shadow removed; slimmer bar
  (4.25rem, rounded-2xl, bg-primary/85); white underline for active links;
  account button and mobile CTA now white-on-primary instead of green.
- Estate cards: neutral dark badge for Land/Home (was green/blue fills),
  plain region label, price in deep brand blue (was lemon green), muted meta
  icons, ghost Overview pill, hairline border + lighter hover shadow, hover
  photo-sheen removed.
- Footer: CTA + subscribe button green → primary blue; contact icons muted;
  hover accent unified to blue.

### index.css — dead decoration removed
- Deleted `liquid-sheen`, `photo-sheen`, `home-progress` keyframes and the
  `.site-liquid-nav` / `.motion-photo-card` / `.home-progress` rules.

## 2026-07-06 (Claude) — Visual cleanup: Nav + Footer consistency

### Nav.tsx — tidier mobile menu
- Aligned the mobile menu item padding to `px-5` and gave the account
  (Sign in / Dashboard) link matching `px-5` + a `mt-2` gap consistent with
  the `grid gap-2` stack; added `transition-colors` and a hover state to the
  account link so it matches the nav items. Desktop liquid-nav untouched.

### Footer.tsx — unified rhythm, consistent headings
- Switched the outer container to the site padding scale
  `px-4 sm:px-6 md:px-10 lg:px-14` and padded the white card evenly
  (`p-6 sm:p-8 md:p-12`) instead of the ad-hoc `p-5/7/10`.
- Unified all section headings (Quick navigation, Properties, Subscribe) to
  `text-lg font-heading` (was a mix of `text-xl` and `text-2xl`); list groups
  now share `mt-6 space-y-4 text-sm` rhythm (was `mt-8 space-y-5`).
- Replaced the arbitrary `mt-24` copyright gap with a `flex-col` + `mt-auto`
  bottom-pin so the copyright/legal row sits at the base of the brand column
  and lines up naturally at any height; contact + subscribe blocks use a
  consistent `mt-8`.
- Added `shrink-0` to inline icons and the subscribe button, and gave the
  legal links the same `text-muted` + hover treatment as the rest.

## 2026-07-06 (Claude) — Visual cleanup: Home.tsx section rhythm (below hero)

### Home.tsx — unified rhythm, calmer cards (hero untouched)
- Standardized every below-hero section to one padding scale
  `px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:px-14` (was ad-hoc
  `py-8/py-10/py-12`), with a shared `max-w-[1520px]` container; removed the
  redundant inner `bg-white py-4/8` and `border-y … py-8/12` wrappers on the
  lede and featured blocks.
- Unified card radius to `rounded-[1.5rem]` across lede, services, promo, and
  process cards (was a mix of 1.35/1.45/1.65/1.75/2.25rem); dropped the noisy
  per-card drop-shadows in favor of `border-rule` + hover only.
- Calmed the service cards: removed the fixed `min-h-[13.5rem]` and the
  decorative accent bar next to the number, switched to `h-full` equal-height
  cards, and tightened the oversized `clamp(…,5.2rem)` heading to
  `clamp(…,4.25rem)` (applied the same cap to lede/services/promo headings).
- Balanced paragraph widths with `max-w-prose`/`max-w-2xl` and moved secondary
  copy to `text-muted`; consistent `gap-4`/`gap-6` grid gaps throughout.
- Kept all sections, links, routes, copy, data, `showSection` logic, and the
  `Audacious3DScroll` hero usage intact. `npx tsc --noEmit` passes clean.

## 2026-07-06 (Claude) — Visual cleanup: About + Contact pages

### About.tsx — calmer, site-consistent rhythm
- Switched from one giant `<article>` wrapper to a `<header>` + `<section>` structure
  matching Construction.tsx, so every block shares the same `mx-auto max-w-4xl
  px-4 sm:px-6 md:px-12` container and standard `pt-28 sm:pt-36 md:pt-48` /
  `pb-20 sm:pb-28` page padding.
- Unified inter-section spacing to the site's `mt-20 sm:mt-24` scale (was a flat,
  heavier `mt-24` everywhere); intro paragraph now `mt-8` like sibling pages.
- Balanced line lengths: intro/blockquote/lead paragraphs capped (`max-w-2xl` /
  `max-w-3xl` / `max-w-xl`) so long copy no longer runs the full column width.
- Tidied grids with consistent gaps (`gap-6`/`gap-10`) and mobile-friendlier
  `space-y-10 sm:space-y-12` on the values list; no content, copy, or data changed.

### Contact.tsx — tidied spacing/alignment, form untouched
- Container narrowed to the shared `max-w-6xl` with calmer `gap-12 lg:gap-20`
  columns; details block spacing normalized (`mt-12`).
- Success card padding unified to `p-8 sm:p-10` (was `p-7 sm:p-12`).
- All form fields, labels, validation, consent checkbox, and the `submitLead`
  mutation are unchanged — behaviour is identical.

## 2026-07-05 (Claude) — Saved chat history (both surfaces), admin-gated + resource-capped PicoClaw

### Conversation persistence (new backend)
- New `conversations` + `conversationMessages` tables and `convex/conversations.ts`
  (list / messages / start / append / rename / remove) — per-user, per-surface
  ('assistant' | 'picoclaw'), owner-checked. Chats now survive reloads.
- PicoClaw console gained a **Sessions** dropdown (list/new/delete/reopen); the
  Company Assistant gained a **Recent** rail section. Verified: a chat persists
  across a full page reload and reopens with its full message history.

### PicoClaw locked down (it's a real agent)
- PicoClaw's toolset includes `exec` (shell), file write/edit, `cron`, `spawn`/
  `subagent`, `install_skill` — sandboxed to its workspace (no Docker socket) but
  it consumes shared VPS CPU/RAM/disk. So: the AI-Chat PicoClaw console and the
  Suite "AI Assistant" card are now **Admin-only**; a non-admin is bounced to the
  Company Assistant, and the console renders an "Admins only" card.
- Added container resource caps (`mem_limit: 768m`, `cpus: 1.0`, `pids_limit: 256`,
  tmpfs /tmp) so a runaway agent loop can't starve the other services.

## 2026-07-05 (Claude) — Assistant chat history + admin-gated PicoClaw (superseded above)

### AI Chat persistence & history (`src/admin/Chat.tsx`)
- Added a **Recent** section to the left rail (below AI Agents) listing
  `api.conversations.list` for kind `assistant`, newest first. Each row loads
  that conversation into the thread on click; a trash icon (hover/focus) deletes
  it. Added a **+ New chat** control that resets to a fresh thread.
- Wired persistence into `send()`: maintains an `activeConversationId`, calls
  `conversations.start` on the first user send, and appends the user message and
  the model reply as they occur. Loading a Recent row hydrates the visible
  messages from `conversations.messages`; deleting the active chat resets to a
  fresh one. Model picker, attachments, quick actions and the `?ask=` boot param
  all keep working.

### Admin-gated PicoClaw
- The PicoClaw rail entry now renders only when `me?.role === 'Admin'`. A
  non-admin who somehow lands on the `picoclaw` view is forced back to
  `assistant`. The assistant/PicoClaw view switch and `PicoClawConsole` render
  are unchanged.

## 2026-07-05 (Claude) — PicoClaw wired to NVIDIA + integrated red console in AI Chat

### PicoClaw runtime on NVIDIA
- Configured the VPS PicoClaw with the NVIDIA NIM key: added an `nvidia-llama`
  model (`meta/llama-3.3-70b-instruct`, api_base integrate.api.nvidia.com/v1) to
  its config, stored the key in `.security.yml`, set it as the default agent
  model. Verified it authenticates and routes to NVIDIA.

### AI Chat → agents + PicoClaw console (Claude-Code-desktop style)
- `src/admin/Chat.tsx`: added a left rail listing **Assistants** (Company
  Assistant + PicoClaw) and the top **AI Agents** (link to /admin/agents). The
  existing chat is unchanged; selecting PicoClaw swaps in the console.
- New `src/admin/PicoClawConsole.tsx`: a **red-themed, two-pane** console —
  a CHAT pane (red bubbles, example chips) and a live **TERMINAL** pane
  (mac-dots, monospace) that logs each turn (`$ picoclaw agent -m …` →
  `routing to NVIDIA NIM` → tools → `✓ response received`). Backed by the same
  NVIDIA Llama 3.3 70B; "Open full console" opens the real PicoClaw dashboard.
- **Reliability fix** (`convex/assistant.ts`): added a 22s per-provider timeout
  so a slow/overloaded endpoint (NVIDIA's free NIM tier under load) falls
  through to the next configured provider instead of hanging the request —
  helps the whole AI chat. Verified PicoClaw answers end-to-end in-browser.

## 2026-07-05 (Claude) — Collapsible Team Chat sidebars + PicoClaw AI assistant

### Collapsible sidebars (Team Chat)
- Both the **channel/inbox list** (left) and the **Shared context** panel (right)
  now collapse to a thin rail on desktop, freeing the conversation to fill the
  space. Toggle buttons in each header (PanelLeft/PanelRight icons) + an expand
  button on the rail; state persists in localStorage (`ek_tc_list`,
  `ek_tc_context`). Grid switched to auto-sized columns so widths animate.
  Mobile master/detail behaviour is unchanged. Verified both directions in-browser.

### PicoClaw — self-hosted AI assistant
- Deployed `sipeed/picoclaw:launcher` to the VPS stack (web console :18800,
  bound to localhost, behind Caddy at `assistant.207-180-245-46.sslip.io` with a
  fixed dashboard token) — a lightweight AI assistant that connects an LLM to
  WhatsApp/Telegram/Discord for auto-replies.
- Added an **AI Assistant** card to the admin Suite (`VITE_APP_ASSISTANT_URL`).
  First open: enter the dashboard token, add an LLM key, connect a channel.

## 2026-07-04 (Claude) — "Add …" progressive-disclosure pattern (cleaner UI)

- New reusable `src/admin/AddMenu.tsx` — a button that opens a small picker list,
  so pages show only what's active and offer more on demand instead of laying
  every option out. Click-outside + Esc to close, left/right align, primary/
  secondary variants.
- **Social**: replaced the six always-visible channel cards with an **"Add
  connector"** picker. Only connected channels (and the one being connected)
  show as cards; a clean empty state otherwise. Picking a channel opens its
  connect flow on demand (Instagram → Meta setup, others → handle form).
- **CRM**: header now has a single **"New"** picker (New deal / New company /
  Import lead sheet) instead of scattered buttons; search box given a sensible
  fixed width so it no longer squeezes thin next to the filter chips.
- Verified both pickers in-browser (open, pick, on-demand card/form); typecheck
  + build clean; deployed to Vercel prod.

## 2026-07-04 (Claude) — Searchbar fix, REAL Instagram publishing, site-wide clean sweep

### Searchbar overlap (CRM + Tasks)
- `.admin-filter-select`/`.admin-input` set `padding` via shorthand, which in
  Tailwind v4 beats layered `pl-*` utilities — so the search icon overlapped the
  placeholder. Added a dedicated `.admin-search` class (icon room baked in) and
  used it on the CRM and Tasks search boxes. Verified: icon and text no longer collide.

### Real Instagram publishing (not a text box)
- New `convex/instagram.ts` — the actual Meta Graph API pipeline: `saveMetaApp`
  (store App ID/Secret server-side in new `appConfig` table), `connectUrl`
  (Facebook OAuth), `/instagram/callback` httpAction (code → long-lived token →
  find FB Page + linked IG Business account → store real token + ig user id),
  and `publishNow` (creates a media container + `media_publish`). `disconnect`.
- Social page Instagram card now: **Set up** (paste Meta App ID/Secret + copyable
  callback URL to register) → **Connect Instagram** (real Facebook OAuth) →
  **Publish to Instagram** on scheduled posts with an image. Honest: Meta requires
  a one-time app authorization (same for every scheduler) — this makes it real.

### Clean sweep — 22 issues reviewed, high/medium fixed
- CRM: stat cards + Bookings view no longer corrupted by the leads stage filter
  (stats/bookings computed from the unfiltered set; stage resets on view switch);
  dead "Call" anchor → muted "No contact"; date input normalized to YYYY-MM-DD.
- Marketing: list `<select>` no longer silently no-ops (visible "choose a list");
  SMTP port field can be cleared/retyped; notice colour tracked explicitly (a
  successful "saved as draft" no longer shows as an amber warning).
- Team Chat: usable on mobile now (master/detail with a back button, both modes);
  Customers unread badge actually fetches counts on the Team tab.
- Mobile bottom nav capped to 5 primary items + a **More** sheet (was 13 crammed).
- Home: fixed "Dubai skyline" alt text; "Book a consultation" CTA → /book?type=
  consultation; featured grid empty state. Book: fixed Lagos UTC off-by-one min date.
- Mail: Disconnect reachable on mobile. Apps: blank-iframe fallback note. Agents:
  n8n SSO errors show inline instead of hard-navigating. Tasks: "No due date"
  instead of "due —"; removed dead `wide` prop.
- Typecheck + build clean; verified searchbar, Instagram setup, mobile Team Chat
  + More menu in browser; deployed Convex + Vercel prod.

## 2026-07-04 (Claude) — Bug fixes: mail formatting, marketing sending, social connectors, n8n link

### Mail — reads as sent (was one run-on line)
- The reading pane only had Zoho's one-line `summary`. Added `zoho.getMessage`
  (fetches the real message body by folderId+messageId) and Mail.tsx now renders
  the full HTML body in a sandboxed iframe (or pre-wrapped plain text) with
  proper paragraphs/spacing. Outgoing mail also sent as HTML so line breaks
  survive (`sendMail` converts newlines + `mailFormat: html`).

### Marketing — campaigns can actually deliver
- Root cause: listmonk shipped placeholder SMTP (`smtp.yoursite.com`), so nothing
  ever sent. `marketing.overview` now reports `sendingReady`; `createCampaign`/
  `sendCampaign` refuse to "send" into the void and return a clear message.
- New `marketing.setSmtp` + a **Sending settings** panel (Zoho: smtp.zoho.com:465
  + app-specific password) so staff can turn on real delivery.

### Social — connectors + hardened create
- `social.upsertPost` hardened (rejects NaN/empty dates with a clear message
  instead of an opaque server error — fixes the reported `M(social:upsertPost)`
  failure) and redeployed to prod.
- New `socialConnections` table + `listConnections`/`connectChannel`/
  `disconnectChannel`; Social page gains a **Connected channels** section for
  Instagram/Facebook/X/LinkedIn/TikTok/WhatsApp (handle + optional n8n auto-post
  webhook). Honest: planning is native; live auto-posting needs a webhook/API key.

### Agents page — automations open n8n
- The stale GitHub-fork integration cards now point to the real destinations:
  Twenty→/admin/crm, Chatwoot→/admin/team-chat, listmonk→/admin/marketing,
  Postiz→/admin/social (all native), and **Automation Studio (n8n)** opens the
  running n8n **signed-in** via the SSO gateway (suite.ticket).

## 2026-07-04 (Claude) — Apps REBUILT from scratch as native features (no external UIs, no logins)

Every feature now lives on our own Convex tables and our own React pages —
the external engines are no longer in the staff path at all.

### Support inbox (replaces Chatwoot) — inside Team Chat
- `convex/inbox.ts` + `supportConversations`/`supportMessages` tables: public
  widget endpoints (startConversation / postVisitorMessage / visitorThread via
  a visitorToken) + staff ops (list/counts/thread/reply/private notes/assign/
  status/markRead/**toLead** one-click convert to CRM lead).
- Team Chat gained a **Team | Customers** toggle: customer inbox with status
  filters, unread badges, live thread, Reply vs Private-note composer, assign,
  Open/Pending/Resolved, contact panel. Fully live (Convex reactivity).
- New `src/components/ChatWidget.tsx`: floating live-chat on the public site
  (bottom-left; AI chatbot keeps bottom-right). Verified full round trip in
  browser: visitor message → admin inbox → staff reply → visitor sees it live.

### Sales pipeline (replaces Twenty) — inside CRM
- `convex/sales.ts` + `companies`/`deals` tables: pipeline query with ₦ totals,
  upsertDeal/moveDeal/upsertCompany/**dealFromLead** (promote lead → deal).
- CRM page now has **Leads | Pipeline | Companies | Bookings** views: kanban
  board (New/Qualified/Site visit/Negotiation/Won/Lost) with per-column ₦
  totals and stage moves, companies book with pipeline value, bookings view
  grouping inspection/consultation leads by date. All lead features preserved;
  each lead gained a "→ Deal" button.

### Social planner (replaces Postiz) — new /admin/social
- `convex/social.ts` + `socialPosts` table; Social page: compose with platform
  chips + char counter, schedule or draft, day-grouped timeline, mark
  published / cancel / edit. Nav item "Social" (hidden from Workers).

### Bookings (replaces Cal.com day-to-day) — CRM ▸ Bookings
- Inspection/consultation requests grouped by preferred date (Cal webhook and
  Book page already feed these leads).

### Suite page
- Support Desk / Sales Pipeline / Social Studio cards now badge **Native** and
  deep-link to the rebuilt pages; engine consoles (Marketing/Automations/
  Scheduling) keep one-click SSO for advanced use.
- Typecheck + build clean; verified in-browser end-to-end; deployed Convex prod
  + Vercel prod + re-alias.

## 2026-07-04 (Claude) — One admin login opens the modules (SSO gateway)

### New: ek-sso gateway (`selfhost/ek-sso/`)
- Small Node service on the VPS. The admin panel mints a 2-minute HMAC ticket
  from the staff session (`convex/suite.ts` `ticket`, signed with EK_SSO_SECRET
  shared with the gateway). Browser hits `https://<module-host>/ek-sso?t=…`;
  Caddy routes `/ek-sso*` to the gateway (same origin as the app), which logs in
  as the service account server-side and re-emits the app's own session cookie
  first-party — so the module opens already signed in, no second login.
- Per-app strategies: listmonk (form login), n8n (`/rest/login`), Cal.com
  (NextAuth csrf→credentials), Postiz (`/auth/login`), Twenty (localStorage
  token bootstrap). Chatwoot keeps its existing platform SSO.

### Verified working one-click sign-in (4 modules)
- **Marketing Console** (listmonk) — shared account · cookie authenticates `/api/lists`.
- **Automation Studio** (n8n) — shared account · cookie authenticates `/rest/login`.
- **Scheduling** (Cal.com) — created the admin service account directly in the
  Cal DB (bcrypt) · SSO session returns the signed-in Ehi-Kings user.
- **Support Desk** (Chatwoot) — per-user platform SSO (unchanged).

### First-run blockers (honest status in the Suite UI — “Setup” badge)
- **CRM Pro** (Twenty): auth mutations (`signUp`/`getLoginTokenFromCredentials`)
  aren't exposed on `/graphql` until a workspace exists — chicken-and-egg on a
  fresh instance. Card shows “create the workspace once via Preview, then
  sign-in turns on”.
- **Social Studio** (Postiz): added a Temporal service (`postiz-temporal`,
  temporalio/auto-setup) it requires to boot; backend still fails registering
  >3 Text search attributes (SQL visibility caps at 3 — needs Elasticsearch-
  backed Temporal). Marked “finishing server setup”.

### Admin UI
- `src/admin/Apps.tsx`: every hosted module now has an **Open signed-in** button
  (generalized handler → `suite.ticket` or `support.ssoLink`), a Shared/Personal
  account badge, a Preview (embed) button, and Live/Setup/Offline status.
- Caddy: `(sso)` snippet routes `/ek-sso*` on each module host to the gateway.
- Deployed: Convex prod + Vercel prod + `ehikings.vercel.app` re-alias.

## 2026-07-04 (Claude) — White-label pass: the suite reads as Ehi-Kings-built

### Feature-named HTTPS hosts (engine names gone from every URL)
- New Caddy hosts: `marketing` / `automations` / `social` / `crm` / `support` /
  `scheduling` `.207-180-245-46.sslip.io`; old engine-named hosts 301-redirect.
- Compose envs (Postiz MAIN/FRONTEND/BACKEND URLs, Twenty SERVER_URL, Chatwoot
  FRONTEND_URL, Cal NEXTAUTH/WEBAPP URLs) + Convex `LISTMONK_URL`/`CHATWOOT_URL`
  + `.env.local` + Vercel prod `VITE_APP_*` all moved to the vanity hosts.

### In-app Ehi-Kings branding
- **Marketing engine (listmonk)**: site name "Ehi-Kings Marketing", colour
  Ehi-Kings logo, root URL on the new host, "Powered by listmonk" footer hidden
  via admin+public custom CSS (verified in embedded screenshot).
- **Support Desk (Chatwoot)**: InstallationConfig branded — installation/brand
  name "Ehi-Kings", brand URL ehikings.vercel.app, light+dark logos.
- **Automation Studio (n8n)**: templates, personalization, diagnostics, hiring
  banner and version notices disabled; editor/webhook URLs pinned.
- **Scheduling (Cal.com)**: app name "Ehi-Kings Scheduling", company name,
  support email envs set.

### /admin/apps → "Suite"
- Page + sidebar renamed **Suite**; six modules: Marketing Console, Automation
  Studio, Social Studio, CRM Pro, Support Desk (Open signed-in), Scheduling.
- Removed all open-source names, repo/fork links, fork-reference cards and the
  docker-compose footer from the UI (forks still exist on GitHub; compose file
  unchanged as the deployment source).
- Verified in-browser: login → Suite grid renders, Marketing Console embeds
  with Ehi-Kings branding end-to-end. Deployed to Vercel prod + re-aliased.

## 2026-07-04 (Claude) — Apps become native admin features: HTTPS, headless Marketing, Chatwoot SSO, Cal→CRM

### Phase 0 — Free HTTPS without a registrar (sslip.io + Caddy)
- Added `selfhost/Caddyfile` + Caddy container: every app now lives at
  `https://<app>.207-180-245-46.sslip.io` with automatic Let's Encrypt certs
  (listmonk, n8n, postiz, twenty, chatwoot, cal — all verified live).
- Caddy strips `X-Frame-Options` and sets `frame-ancestors` so previously
  embed-blocked apps (Chatwoot, Cal.com) can render inside /admin/apps.
- **Firewall locked down**: app ports rebound to `127.0.0.1` in compose
  (Docker bypasses ufw, so localhost binding is the real fix) + ufw allows
  removed — only 22/80/443 reachable; verified raw ports closed from outside.

### Phase 1 — Chatwoot as a feature (one-click signed-in)
- Bootstrapped Chatwoot fully via API/rails: "Ehi-Kings" account, platform
  app + token (server-side Convex env only).
- New `convex/support.ts` `ssoLink` action: finds/creates a Chatwoot agent for
  the logged-in staff member (Admin/Manager → administrator role), then mints
  a short-lived SSO auto-login URL. `users` table gained `chatwootUserId`.
- /admin/apps Chatwoot card now has **"Open signed-in"** — no separate login.
- Caddyfile maps dashed `X-Cw-Token` → underscored `api_access_token`
  (Caddy silently drops underscored request headers).

### Phase 2 — Native Marketing tab (headless listmonk)
- New `convex/marketing.ts`: overview / ensureDefaultList / syncOptIns /
  createCampaign / sendCampaign actions using a listmonk API user
  (staff never see listmonk itself). n8n owner account claimed securely.
- New `src/admin/Marketing.tsx` + sidebar item (hidden from Workers): stats,
  one-click "Sync CRM opt-ins" (consenting leads → subscriber list),
  compose + send campaigns, live campaign/list status.
- Verified end-to-end from CLI: real lists/campaigns returned; CRM opt-in
  sync working against the footer newsletter subscriber.

### Phase 3 — Cal.com bookings land in the CRM
- `convex/http.ts` `/cal/webhook` (POST): `BOOKING_CREATED` → CRM lead with
  inspection type, preferred date/time, cal.com source.
  Point Cal.com's webhook at `https://third-tern-430.convex.site/cal/webhook`.

### Deploys
- Convex prod deployed (support/marketing/webhook + env vars dev+prod);
  `.env.local` + Vercel production env → the six HTTPS app URLs;
  typecheck + build clean; Vercel prod deploy + `ehikings.vercel.app` re-alias.

## 2026-07-03 (Claude) — ALL open-source tools deployed + integrated into /admin/apps

### Full stack now running on the Contabo VPS (18 containers)
- Extended `selfhost/docker-compose.yml` with **Postiz** (:5000, +Postgres+Redis),
  **Twenty CRM** (:3001, +Postgres+Redis+worker), **Chatwoot** (:3002,
  +pgvector Postgres+Redis+Sidekiq, self-migrating boot), **Cal.com** (:3003,
  +Postgres); generated per-app secrets; opened ufw 5000/3001/3002/3003.
- Fixed Twenty restart loop (created missing `default` database).
- **Verified all six apps publicly reachable**: listmonk :9000 · n8n :5678 ·
  Postiz :5000 · Twenty :3001 · Chatwoot :3002 · Cal.com :3003.

### Admin /admin/apps upgrades
- All six now show **Hosted** with in-admin embed; frame-header check showed
  Chatwoot (SAMEORIGIN) and Cal.com (DENY) refuse iframes → their cards now use
  an honest **"Open in tab"** primary action (fixable later by stripping headers
  at the Caddy TLS proxy).
- Added **Customermates** and **Awesome SaaS Directory** cards with "View fork"
  links (no published server images to host); hosted-app cards link their forks.
- `.env.local` wired: `VITE_APP_{POSTIZ,TWENTY,CHATWOOT,CAL}_URL` → VPS.
- First-run setup pending (first visitor claims each): Postiz account, Twenty
  workspace, Chatwoot account, Cal.com user, n8n owner.
- Local only; typecheck/build clean. **No Vercel deploy.**

## 2026-07-03 (Claude) — OSS apps actually running INSIDE the admin (Contabo VPS)

### VPS provisioned (Contabo Cloud VPS 20 · 207.180.245.46 · Ubuntu 24.04, 6c/11GB)
- SSH key auth set up (`~/.ssh/ehikings_vps`); Docker 29 + compose installed;
  ufw enabled (22/80/443/9000/5678).
- Deployed `selfhost/docker-compose.yml` to `/root/ehikings` and started it:
  **listmonk** (+ Postgres 17) and **n8n** — all containers healthy.
- Verified publicly: listmonk `http://207.180.245.46:9000` (admin/ehikings123),
  n8n `http://207.180.245.46:5678` (create owner on first open) — both HTTP 200.

### New: /admin/apps — self-hosted apps embedded in the admin
- `src/admin/Apps.tsx` + route + sidebar item ("Apps", hidden from Workers):
  cards for listmonk, n8n, Postiz, Twenty, Chatwoot, Cal.com with Hosted /
  Fork-ready status, "Open here" (in-admin iframe view with open-in-tab
  fallback), URLs via `VITE_APP_*_URL` env.
- `.env.local` points listmonk/n8n at the VPS. **Verified in browser:** real
  listmonk login page rendering inside the admin shell.
- `selfhost/docker-compose.yml` added (same file runs locally or on any VPS).

### Notes / next stage
- Production caveat: the HTTPS admin (ehikings.vercel.app) cannot iframe plain
  HTTP — Stage 2 = point `mail.ehikings.com` / `flows.ehikings.com` DNS at the
  VPS + add Caddy for auto-TLS, then embedding works everywhere and n8n gets a
  proper WEBHOOK_URL.
- ⚠️ Rotate: VPS root password (email + chat), consider disabling SSH password
  auth (key already installed); change listmonk admin password after TLS.
- Local only — no Vercel deploy this turn.

## 2026-07-03 (Claude) — CRM/booking gaps, Paystack, NVIDIA AI, forks, InsForge

### Forks & platform setup
- Forked to github.com/nigelose10: **awesome-saas-directory, customermates,
  postiz-app, listmonk** (twenty, cal, n8n already forked previously).
- **InsForge** CLI logged in and linked to project **"Ehi Kings"**
  (`cff02097…`, bnzt74ru.us-east) — ready for future backend tasks. This turn's
  CRM stayed on Convex because admin auth/RBAC/Zoho send all live there and the
  team needs the CRM working now; migration to InsForge is possible later.
- Ran the requested `npx skills add NVIDIA/skills` installs (codex agent).

### Paystack — live checkout scaffold (activates when keys land)
- New `src/lib/paystack.ts` (on-demand official inline.js loader + typed helper).
- `src/pages/Book.tsx` Land-payment mode: optional **Amount (₦)** field; with
  `VITE_PAYSTACK_PUBLIC_KEY` set it opens real Paystack checkout and records the
  paid **reference + amount into the CRM lead message**; window closed → clear
  error, nothing charged; no key → existing payment-interest lead flow.
- `.env.example` documents `VITE_PAYSTACK_PUBLIC_KEY` (secret key = backend
  later, for webhook verification).

### Calendly
- Inline **Calendly iframe embed** on the inspection tab when
  `VITE_CALENDLY_INSPECTION_URL` is set (link fallback kept).

### NVIDIA AI in the admin copilot (verified live)
- Added **NVIDIA NIM** as an OpenAI-compatible provider in
  `convex/assistant.ts` (integrate.api.nvidia.com/v1, default
  `meta/llama-3.3-70b-instruct`, `NVIDIA_MODEL` overridable); key set on Convex
  **dev + prod**; `providerStatus` now returns gemini/groq/deepseek/**nvidia**.
- Model picker: new NVIDIA group (Llama 3.3 70B, Nemotron 70B, DeepSeek R1).

### Verified already-built by Codex (no duplication)
- CRM admin page with **Excel import** (`read-excel-file`), stages, Zoho
  **Send email** per lead; `convex/crm.ts` (submitLead/list/update/import);
  Book page with **Tue/Thu/Sat 10:00 + 2-days-ahead** inspection rules;
  newsletter footer opt-in → CRM; “responds within 2 days” copy.

### Notes
- Integration-skill search: no skill can auto-integrate self-hosted SaaS apps;
  best matches were n8n-workflow-architect (211 installs — below quality bar)
  and caffeinelabs email-marketing (3.6K, content-focused). Our study-and-
  rebuild workflow remains the path; n8n/listmonk/cal forks are ready to
  self-host when wanted.
- ⚠️ InsForge user key + NVIDIA key were pasted in chat — recommend rotating
  both after setup settles.
- All local: typecheck/build clean, Convex dev pushed. **No Vercel deploy.**

## 2026-07-03 (Claude)

### 3D scroll hero — scaffold + generated cloud asset (preview at /scroll-demo)
- Added `src/components/hero3d/ScrollVideoHero.tsx`: a pinned 260vh hero that
  scroll-scrubs a cinematic camera-move video (building phase 0→0.62), rises
  clouds over the frame (0.55→0.96, also scroll-scrubbed), then ramps a white
  overlay (0.82→0.97) that hands off into the all-white page. Layers: poster →
  scrub video → gradient → headline → clouds → white.
- Robustness: assets are HEAD-preflighted (a dev-server SPA fallback or 404
  never counts as video); missing building clip → poster with scale/parallax;
  missing cloud clip → procedural CSS clouds; `prefers-reduced-motion` → static
  hero; mobile → poster parallax (no scrubbing).
- **Generated the cloud→white clip with the user's Higgsfield subscription**
  (kling3_0_turbo, 5s, 16:9, 7.5 credits of 101.6) and installed it at
  `public/hero/clouds.mp4` (2 MB). Verified frame arc with ffmpeg: bright
  cloudscape → near-white final frame.
- Added `/scroll-demo` route + `src/pages/ScrollDemo.tsx` playground and
  `public/hero/README.md` (asset names + ffmpeg all-keyframe encode commands
  for silky scrubbing).
- Verification note: build/typecheck clean; hero fold, layer stack, asset
  loading, and manual video seeking verified in the preview browser. Live
  scroll animation could NOT be exercised there (hidden tab freezes
  requestAnimationFrame → all framer-motion output frozen; proven with a
  0-ticks rAF probe) — needs a real-browser check at /scroll-demo.
- Still pending: the Audacious building camera-move clip (Higgsfield
  image-to-video from the user's photo) → `public/hero/building.mp4`; then
  graft the hero into Home.

## 2026-06-27 (Claude)

### Admin Chat → model picker + file uploads
- Added a **searchable model picker** to the chat composer (grouped by provider,
  with tool/vision capability icons and locked state for providers without a key),
  populated from `assistant.providerStatus`; the chosen model persists.
- Added **file uploads** (paperclip): images go to vision-capable models, text
  files (`.md/.csv/.json/.txt/…`) are inlined into the prompt; attachment chips
  with remove. Backend `assistant.ask` now accepts `provider`, `model`, and
  `attachments` (multimodal content built for the latest user turn);
  `chatCompletion` honours the preferred provider/model with fallback.
- Polished the empty state to "What can I help with?" + a "New chat" reset, and
  hardened the picker to stay usable if `providerStatus` is unavailable.
- Build/typecheck green. NOT deployed this turn — Codex is actively editing the
  shared Convex backend, so a prod deploy is held to avoid shipping half-finished
  parallel work / racing the Convex deploy.

### Admin Chat → Vercel AI Chatbot UI + PWA fix + ehikings.vercel.app
- Reskinned `src/admin/Chat.tsx` to the **Vercel AI Chatbot** look — greeting +
  suggested-action cards, avatar + **markdown** assistant messages, and the
  rounded multimodal composer — while keeping the Convex agent, company/tools/
  Zoho actions, provider list, and `?ask=` boot param. Added `react-markdown` +
  `remark-gfm` and `src/admin/chat/Markdown.tsx`.
- **Fixed "installed app opens the home page":** Codex had set the PWA
  `start_url` to `/`; restored it to `/admin` (+ stable `id`), and added a
  standalone-launch redirect in `src/main.tsx` (covers iOS, which ignores
  start_url) so the home-screen app opens the workspace.
- **Domain:** deployed Convex prod + Vercel prod and pointed **ehikings.vercel.app**
  at the new deployment; set Convex `APP_URL` to the new domain.
- Note: `admin.ehikings.vercel.app` isn't possible on Vercel's free `*.vercel.app`
  (single-label only) — admin stays at `ehikings.vercel.app/admin`.

## 2026-06-27

### Admin dashboard → agency command center + AI provider rollout
- Rebuilt the admin dashboard into a darker command-center UI inspired by the
  latest dashboard references, using the brand green/blue accents and fewer
  decorative content boxes.
- Added an Admin `Agents` workspace at `/admin/agents` with 15 real-estate
  operating modes for lead intake, buyer matching, inspections, listings,
  follow-up, pipeline, site content, legal/title checks, construction progress,
  finance, support, location intelligence, analytics, and company copilot work.
- Wired each agent to the real Convex assistant action with live company,
  website, and listing context instead of static placeholder buttons.
- Added a provider-status panel so the dashboard shows which backend AI
  providers are configured without exposing secret values.
- Added curated OpenApps-style setup links for Twenty, Chatwoot, Cal.com, n8n,
  Baserow, and PostHog, clearly marked as "Needs setup" until credentials or
  self-hosted URLs are connected.
- Changed the AI backend from one Gemini-only endpoint to a provider fallback
  layer supporting Gemini, Groq, DeepSeek, and custom OpenAI-compatible
  providers.
- Set Convex production and dev environment variables for Gemini/Google, Groq,
  and DeepSeek keys, with `AI_PROVIDER=gemini` as the default.
- Connected the official site editor to the public website: published site
  blocks now feed the homepage and footer instead of only changing the editor
  preview.
- Updated the homepage hero text back to white over the photographic hero image
  for readability.
- Updated the site editor shell to an "official site studio" workspace with a
  live-site link and clearer published-content language.
- Deployed Convex production functions and deployed the updated Vercel
  production app.
- Added `https://ehikings.vercel.app` as the requested Vercel alias and disabled
  Vercel SSO protection so the public and admin routes serve the app directly.
- Verification: `npm run lint` passed, `npm run build` passed, Convex production
  deploy passed, Vercel production deploy passed, and live checks returned `200`
  for `/`, `/admin`, `/admin/agents`, and `/admin/site-editor` at
  `https://ehikings.vercel.app`.

### Admin access → MD email promoted
- Promoted `kings.ceo@ehikings.com` from Worker to Admin in production Convex.
- Set `kings.ceo@ehikings.com` as the production `INITIAL_ADMIN_EMAIL` fallback
  so future Zoho bootstrap logic treats the MD email as the official admin
  account.
- Updated the Zoho account bootstrap fallback in code from `info@ehikings.com`
  to `kings.ceo@ehikings.com`.
- Removed the temporary production promotion mutation after running it, then
  redeployed Convex so no maintenance helper remains exposed.
- Verification: production Convex now shows `kings.ceo@ehikings.com` as an
  active Admin with title `Managing Director / CEO`, password login disabled,
  and Zoho-first access preserved.

## 2026-06-26

### Production deployment → version archive + admin cleanup
- Archived the previous live Vercel production deployment into the local
  `version 1/` folder with a static mirror and Vercel metadata before pushing
  the new version.
- Excluded `version 1/` from `.vercelignore` and `.gitignore` so the archive
  stays local and is not uploaded with future deployments.
- Replaced the old demo seed with production bootstrap logic: default
  permissions are created without fake users, and an optional real initial admin
  can be created from environment variables.
- Updated Zoho onboarding so a clean database can create real staff accounts
  without demo credentials; first/configured admin sign-in can bootstrap Admin
  access.
- Removed the visible demo account block from the admin login page and cleared
  the white logo plate on admin setup/login screens.
- Changed staff creation to Zoho-first profiles with optional temporary
  password support instead of forcing fake passwords.
- Removed fake shared-file rows from Team Chat and filtered direct messages to
  active staff only.
- Cleaned production Convex data: removed seeded demo users, seeded tasks,
  seeded team-chat rooms/messages, old demo sessions, and cleared the shared
  password from the official admin account.
- Preserved the existing real `moji.kuwadinu@ehikings.com` staff account and
  the official `info@ehikings.com` Admin identity.
- Imported the 17 official public listings into production Convex so the admin
  Listings manager starts with real editable property data instead of an empty
  database.
- Renamed the project metadata from the starter app identity to
  `ehi-kings-real-estate`, replaced the scaffold README, and updated
  `metadata.json`.
- Upgraded `convex` to clear the production `ws` vulnerability reported by
  npm audit.
- Deployed Convex production functions and deployed the updated Vercel
  production app at `https://ehi-kings-real-estate.vercel.app`.
- Verification: `npm run lint` passed, `npm run build` passed, live Vercel
  checks passed for `/`, `/admin/login`, and `/admin`, and production Convex
  now has only two active staff rows with password login disabled, 17 editable
  listings, no seeded chat rooms, and no seeded messages. `npm audit --omit=dev`
  reports zero vulnerabilities. Vite still reports the existing large-chunk
  warning after build.

### Public website → stronger blue/green pairing + mobile pass
- Changed the homepage hero supporting text and fact strip under the image to
  the logo green `#6E8C14` with stronger weight/drop shadow for readability.
- Rebalanced the public site so blue handles structure/trust and green handles
  guidance, land, category, focus, and secondary action states.
- Added green accents across homepage company blocks, mission/vision cards,
  service rows, process progress bars, listing cards, properties filters,
  About, Construction, Contact, Journal, article pages, and the footer.
- Kept the Properties `All areas` filter in the requested blue while using
  green for land/specific region choices.
- Improved mobile friendliness across public components: smaller mobile card
  radii, safer responsive headline steps, no viewport-scaled headline sizing,
  normal letter spacing, better image constraints, larger tap targets, and
  mobile-safe listing card layouts.
- Verification: `npm run lint` passed, `npm run build` passed, and browser
  mobile smoke checks passed for `/`, `/properties`, `/about`, `/construction`,
  `/contact`, and `/blog` with no horizontal overflow and no tiny tap targets.
  Vite still reports the existing large-chunk warning after build.

### Brand accent correction → logo blue + lemon green
- Extracted the public brand palette from the provided references: action blue
  `#0063DE`, logo green `#6E8C14`, and deep logo navy `#144687`.
- Updated global public/admin accent tokens in `src/index.css`, including a
  separate dark ink token for lemon-green fills so green badges/buttons remain
  readable.
- Changed public dark statement blocks from near-black to deep logo blue through
  the public `.site-shell` primary token.
- Flattened `src/components/Nav.tsx` so the public navbar no longer has a
  nested navbar inside it.
- Removed the duplicate desktop Contact CTA from the public navbar; Contact now
  appears once as a normal nav item.
- Removed the text block beside the public navbar logo so only the logo itself
  appears there.
- Updated selected property filters, listing type pills, admin dashboard accent
  constants, task status colours, chat controls, and site-editor preview styling
  to use the same blue/green brand system.
- Updated `index.html` and `public/manifest.webmanifest` theme colours to the
  logo navy.
- Verification: `npm run lint` passed, `npm run build` passed, and browser
  smoke checks passed for `/construction` and `/properties`. Vite still reports
  the existing large-chunk warning after build.

## 2026-06-25

### Admin panel → full-screen minimal operations pass
- Made `AI Chat`, `Mail`, `Team Chat`, and `Site Editor` use full-height
  workspace layouts inside the admin shell instead of padded boxed pages.
- Flattened the shared admin shell by reducing rounded nav/button treatments
  and keeping the collapsible sidebar separate from the public website.
- Rebuilt `src/admin/Chat.tsx` into a cleaner company AI surface with no
  duplicate title card, no separate "Company assistant" card, and no separate
  "cost-effective LLM options" card.
- Made the AI chat top controls real: `Company data`, `Tools`, `Zoho`, and
  `LLM costs` now click and return useful workspace output. The Zoho action
  checks the signed-in user's mailbox connection directly.
- Rebuilt `src/admin/Mail.tsx` as a full-screen mail client with a flat header,
  two-pane inbox, side-panel composer, reply, refresh, disconnect, and connect
  actions.
- Rebuilt `src/admin/TeamChat.tsx` as a full-screen team chat app; removed fake
  call/video/attachment-style controls and the decorative workspace sidebar, and
  kept only working room, DM, search, create, send, and shared-context actions.
- Reworked `src/admin/WebsiteEditor.tsx` into a flatter three-pane editor
  workspace with editable areas, central fields, and desktop preview instead of
  nested rounded cards.
- Added a subtle public-site photo-card sheen animation in `src/index.css` and
  `src/components/EstateGrid.tsx` so listing imagery has more motion without
  changing the site structure.
- Verification: `npm run lint` passed, `npm run build` passed, and browser
  smoke checks passed after signing in as `info@ehikings.com` / `ehikings` for
  `/admin/chat`, `/admin/mail`, `/admin/team-chat`, and `/admin/site-editor`.
  Vite still reports the existing large-chunk warning after build.

### Public website → truthful cinematic skin + route cleanup
- Reworked the public homepage as a full-screen photographic hero instead of a
  boxed hero, preserving the existing public-site bones while changing the skin
  to a cleaner luxury real-estate direction.
- Removed the public homepage property tabs/filter surface; filters now live on
  the single `/properties` page only.
- Kept `/land` as a redirect to `/properties?kind=land` so land remains a
  filter inside the Properties page, not a separate public page.
- Rebuilt the public navbar as a long dark liquid-glass bar with a transparent
  logo and no logo background; fixed the CSS override that was preventing the
  nav from staying fixed.
- Removed the public floating AI chatbot, AI matcher, and browser-side Gemini
  helper/package so the public site no longer makes false AI/concierge claims.
  The company AI chat remains in the admin workspace.
- Replaced internal-facing public copy like “admin-managed property table” and
  “SEO-focused” with buyer-facing language.
- Updated Properties to a working filter hub for all listings, land, homes,
  regions, and search, reading from the Convex-backed listings hook with static
  fallback.
- Added `src/data/propertyMedia.ts` and wired listings/detail pages to use clean,
  photorealistic landscape media instead of stretching flyer graphics across
  cards and hero images.
- Added image expansion on estate detail pages and cleaned the detail hero so
  overview images fit the landscape space.
- Rebuilt the Journal as a working blog index plus `/blog/:slug` article pages
  with SEO metadata and grounded, buyer-focused article content.
- Consolidated public actions around `/contact`; removed old enquiry/contact
  duplication from visible public flows.
- Updated PWA metadata so the public shell identifies as Ehi-Kings rather than
  “EK Staff”; the admin install helper still uses staff wording inside admin.
- Used two parallel review subagents to audit public-route separation, visible
  copy, mobile overflow, nav behavior, and estate-detail imagery.
- Verification: `npm run lint` passed, `npm run build` passed, and browser smoke
  checks passed on desktop and mobile for `/`, `/properties?kind=land`, `/blog`,
  `/blog/reading-a-lagos-title`, and `/estates/grace-apartments-lekki`.
  Vite still reports the existing large-chunk warning after build.

## 2026-06-24

### Cleanup pass + Listings CMS + pro Tasks + PWA install (review pending — NOT deployed)
- **Theme cleanup (white + blue/green, futuristic):** fixed `src/index.css` —
  public `.site-shell` is now a true white canvas with **brand blue (primary) +
  green (secondary)** accents (was light-grey bg + a stray gold accent-2); admin
  accent-2 also corrected green→pairs with blue.
- **Public nav/footer cleaned for the white site:** `src/components/Nav.tsx`
  rebuilt as a clean white floating-pill nav using the **colour logo** (the white
  logo was invisible on white) with blue active state; `Footer.tsx` logo switched
  to the colour logo. (Note: dropped the duplicate desktop "properties map" icon
  button — Properties is already in the nav; say if you want it back.)
- **Admin-editable Listings → live on the site (new):**
  - `convex/schema.ts` `properties` table + `convex/properties.ts`
    (public `list`, admin `listAll`/`upsert`/`setActive`/`remove`/`importListings`).
  - `src/admin/PropertiesManager.tsx` (Admin-only) at `/admin/listings` — grid,
    full editor (incl. price tiers), show/hide, delete, "Import current listings".
  - `src/data/useEstates.ts` hook; public `Properties`, `Land`, `EstateDetail`
    now read the live table (static fallback) → admin edits publish to the site.
- **Tasks → "Operations" command-center** (`src/admin/Tasks.tsx`,
  `convex/tasks.ts`): MD remote-oversight stat band (open / in-progress /
  overdue / due-≤3-days / done-this-week), search, status/priority/assignee
  filters, sort, **Board⇄List**, priority levels, departments, reassign, overdue
  flags, team-workload bars, CSV export, completion timestamps.
- **Admin mobile + PWA install:** `src/admin/InstallButton.tsx` (Android/desktop
  prompt + iOS Add-to-Home-Screen steps) in the sidebar + mobile bar;
  `manifest.webmanifest` gets maskable icons + app shortcuts.
- **Dashboard improvements (additive):** restored green accent, added a "Needs
  attention" oversight band (overdue/due-soon/done-this-week) + dynamic status
  pill + Manage-listings quick action.
- Pushed to Convex **dev** only; **no Vercel / Convex-prod deploy** (awaiting review).

### Main website correction → original-video direction
- Installed `Leonxlnx/taste-skill` with `npx skills add`, adding 13 local taste
  skills including `gpt-taste`, `design-taste-frontend`,
  `high-end-visual-design`, `image-to-code`, and `redesign-existing-projects`.
- Re-read and applied the local `hallmark` skill plus the relevant taste-skill
  guidance for this public-site correction.
- Restored the public website font direction to the original
  `Poppins`/`Roboto` pairing instead of the experimental
  `Instrument Serif`/`Manrope` pairing.
- Removed the white rectangle behind the navbar logo by switching the public nav
  to the transparent `/ehi-kings-logo.png` asset and putting it on dark glass
  navigation.
- Rebuilt `src/pages/Home.tsx` around the reference video language: rounded
  grey canvas, cinematic photo hero, filter/listing card section, animated
  property-tour carousel, photorealistic gallery reel, characteristics panel,
  leadership section, AI matcher, services, and contact CTA.
- Replaced the vector generated listing placeholders with photorealistic property
  imagery and existing estate photos.
- Restored and redesigned `src/components/Footer.tsx` as a large rounded white
  footer card with a transparent logo treatment, contact details, navigation,
  and subscribe row.
- Added Hallmark project-memory metadata for this correction in
  `.hallmark/log.json`.

### Main website → white editorial investment redesign
- Separated the public website from admin/editor data by removing the public
  `useSiteBlocks` hook and deleting `src/components/useSiteBlocks.ts`.
- Added a public-only `site-shell` theme in `src/index.css` with a white canvas,
  blue-black ink, clay accent, Google-loaded `Instrument Serif` + `Manrope`,
  light grid texture, and restrained motion utilities. Admin routes keep their
  existing dark admin shell.
- Rebuilt `src/pages/Home.tsx` into a white editorial real-estate investment
  homepage with oversized expressive type, animated stacked property visuals,
  stat cards, generated listing cards, services, and a redesigned AI matcher
  section.
- Updated `src/components/Nav.tsx` and `src/components/Footer.tsx` to match the
  new public website design while leaving the admin panel separate.
- Added generated listing visuals under `public/generated/` for temporary
  listing imagery: villa, investment tower, land plan, and garden residence.
- Restyled `src/components/AIMatchmaker.tsx` to fit the light public site and
  removed the old dark-card visual treatment.

### Site editor → draft / review / publish + layout controls
- Upgraded `convex/site.ts` and `convex/schema.ts` so website content now has
  separate draft, review, and published states. Public pages read published
  values only.
- Expanded `src/admin/WebsiteEditor.tsx` into a workflow studio with Save Draft,
  Send Review, Publish, draft preview, status metrics, and per-block workflow
  actions.
- Added editable layout/section controls in `src/data/siteBlocks.ts`: hero
  layout, homepage section order/visibility, featured-estate count, and services
  heading.
- Updated `src/pages/Home.tsx` to render homepage sections from the published
  section-order control and adjust hero layout / featured count from published
  layout settings.

### Company AI → Zoho-aware agent tools
- Added a `search_mail` tool in `convex/assistant.ts`. It searches/summarizes
  only the signed-in user's connected Zoho mailbox, preserving the existing
  per-user OAuth boundary.
- Updated the AI chat UI in `src/admin/Chat.tsx` with a Zoho Mail capability
  chip and a starter prompt for summarizing the user's latest emails.

### Team chat → Brandux-style workspace
- Added `src/admin/TeamChat.tsx`, a dedicated team chat workspace with a
  workspace sidebar, channel/personal-message sidebar, central chat thread,
  channel tabs, composer, and right-side shared media/files/links panel.
- Added `/admin/team-chat` route and kept `/admin/chat` as the company AI chat.

### Admin shell → collapsible sidebar
- Made the main admin sidebar collapsible in `src/admin/AdminLayout.tsx`, with
  compact icon-only mode and local persistence.
- Renamed dashboard nav entries to distinguish `AI Chat` from `Team Chat`.
- Removed the last green dashboard status tint so the admin accent reads blue.

### Admin dashboard → blue Skiff/Odysseus update
- Changed the global site/admin primary accent from green to blue in
  `src/index.css`, so shared buttons, links, rings, and highlights now inherit
  the blue brand direction.
- Removed the white logo backing in `src/admin/AdminLayout.tsx` and switched
  the admin chrome to the transparent Ehi-Kings logo.
- Added an Admin-only `Site` navigation item and `/admin/site-editor` route.

### Company AI chat → dedicated ChatGPT-style page
- Replaced the old project-group chat page with a dedicated company AI chat in
  `src/admin/Chat.tsx`.
- The chat sends company, portfolio, editable website-block, task, and staff
  context into the existing Odysseus-style Convex agent.
- Added visible low-cost/free LLM options in the chat sidebar: Gemini Flash,
  Groq-hosted Llama, OpenRouter free models, DeepSeek, Ollama local models, and
  Mistral.

### Website editor → Lovable-inspired admin studio
- Added persistent editable website blocks in `convex/schema.ts` and
  `convex/site.ts`.
- Added `src/admin/WebsiteEditor.tsx` with content inventory, editable fields,
  live preview, draft/save flow, and AI-generated edit proposals.
- Initially wired homepage hero/lead/matchmaker copy and footer CTA to editable
  blocks; this was later removed from the public website to keep the website and
  admin/editor surfaces separate.
- Added `convex/assistant.ts:suggestSiteEdits` so admins can ask Gemini for
  website edit proposals before applying/saving.
- Set `AI_API_KEY` on the Convex dev deployment as a backend secret for Gemini.

### Copilot → multi-provider + agentic (Odysseus-inspired)
- `convex/assistant.ts` rewritten to use **any OpenAI-compatible** Chat Completions
  endpoint via env (`AI_BASE_URL`, `AI_API_KEY`/`GEMINI_API_KEY`, `AI_MODEL`) —
  works with Gemini, Groq, OpenRouter, DeepSeek, Together, Cerebras, Mistral,
  OpenAI, or local Ollama.
- Added an **agent tool loop** (multi-round) so the copilot can take actions, not
  just answer: `create_task`, `update_task_status`, `find_estate`. Tools run
  through RBAC'd Convex mutations — the copilot can only do what the signed-in
  user is permitted to do.
- `src/admin/AssistantDock.tsx` now sends the portfolio catalog and shows which
  tools an answer ran.

### Mail → skiff-mail two-pane client
- `src/admin/Mail.tsx` redesigned into a Skiff Mail-style **two-pane inbox**
  (message list + reading pane), Skiff-styled, with a floating **Compose** panel
  and **Reply** (prefills recipient/subject). Mobile collapses to list ⇄ reader.

### Process
- Added this `CHANGELOG.md`; each change set is now logged here.

## Earlier (summary)
- AI copilot dock added to the dashboard (Gemini via Convex, RBAC-safe context).
- Dashboard restyled in Skiff UI design language (layered surfaces, tinted icon chips).
- Sign in with Zoho (per-user OAuth); fixed redirect + session-token pickup.
- Zoho Mail per-user inbox + send; Convex backend with server-enforced RBAC.
- Admin workspace: auth, tasks, team, permissions, chat, PWA, liquid-glass mobile nav.
- Multi-page marketing site, estate detail pages, green/blue luxury theme, logo, MD photo.
