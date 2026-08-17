# Design — Ehi-Kings Real Estate & Construction

A locked design system for this app, produced by `hallmark redesign` (multi-page).
Every page reads this file before emitting code. Extend or amend it when the
system needs to grow — do not regenerate per page. Across pages, **consistency is
the goal, not variety.**

## Genre
editorial — luxury, content-led, quiet. The medium is paper, not glass.

## Macrostructure family
- **Marketing pages** (Home): Photographic — full-bleed imagery, type as annotation,
  the image edge is the divider.
- **Content pages** (About, Construction): Long Document / Narrative Workflow —
  continuous prose, numbered process, hairline section breaks.
- **Listing pages** (Land, Properties): Catalogue — uniform card grid of inventory.
  Cards link to a detail page; type is colour-coded (green = land, blue = home).
- **Detail pages** (Estate): Zillow-style — full-bleed landscape hero (estate name,
  location, type badge) at the top; below it a quick-facts strip (size · title · type ·
  region), an overview, highlights, optional pricing-options table, and a sticky
  price + CTA sidebar (Book an inspection / Request details).
- **Index pages** (Journal): Index-First — the list *is* the page.

## Theme — custom (luxury · near-black base · green + blue accents)
The **primary base is unchanged** (near-black paper, off-white ink). The accent
system is **luxury green (primary) + luxury blue (secondary)** — an homage to the
original ehikings.com brand palette, replacing the previous gold/brown accent.
- `--color-bg`         oklch(0.16 0.008 75)   — paper, near-black (never pure #000)
- `--color-surface`   oklch(0.21 0.009 75)   — raised band
- `--color-primary`   oklch(0.95 0.008 85)   — ink, off-white
- `--color-muted`     oklch(0.70 0.010 82)   — secondary text
- `--color-rule`      oklch(0.34 0.010 78)   — hairline
- `--color-accent`    oklch(0.68 0.115 162)  — luxury green, PRIMARY accent (≤ 5% per viewport)
- `--color-accent-2`  oklch(0.62 0.130 245)  — luxury blue, SECONDARY accent
- `--color-accent-ink`oklch(0.17 0.020 162)  — ink on accent fills
- `--color-focus`     oklch(0.76 0.130 162)  — focus ring

### Accent usage
- **Green** carries the brand: eyebrows, primary CTAs, hovers, promo ticker, land listings.
- **Blue** is the counterpoint: home/building listings, price-tier figures, secondary highlights.
- The two never compete in the same element — green leads, blue accents.

## Typography
- Display: Cormorant Garamond, weight 300, style **normal** (roman — never italic)
- Body:    Manrope, weight 400
- Display tracking: -0.01em (tight)
- Numbers: `tabular-nums` (`.tnum`) on all prices, plot sizes, phones

## Spacing
4-point named scale in `tokens.css`. Pages use named tokens, never raw values.

## Motion
- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1); `--ease-in-out`.
- Reveal pattern: one gentle fade-up per section on first view in. No bounce.
- Reduced-motion: collapses to near-instant (handled globally in `index.css`).

## Microinteractions stance
- Silent success (contact form swaps to a quiet confirmation; no celebratory toast).
- Hover affordances all have focus/tap equivalents.
- Focus ring appears instantly, never animated.

## CTA voice
- Primary: gold fill, `accent-ink` text, pill, copy as an invitation
  ("Book a consultation", "Send enquiry").
- Secondary: hairline-bordered pill or typographic link with an animated underline rule.

## Nav & footer (shared across every page)
- Nav: **N9 edge-aligned minimal** — wordmark hard-left, destinations hard-right,
  hairline beneath; collapses to a sheet on mobile.
- Footer: **Ft1 mast-headed** — statement + single action, then wordmark band.

## What pages MUST share
- The `EK` wordmark + "Real Estate & Construction" lockup.
- The gold accent and its placement (≤ 5% per viewport).
- Cormorant Garamond display + Manrope body.
- The CTA voice (pill shape, copy pattern).
- Hairline rules instead of card borders for structure.

## What pages MAY differ on
- Macrostructure within the family (Photographic vs Long Document vs Catalogue).
- Hero treatment and section rhythm.
- Imagery selection.

## Per-page allowances
- Marketing/listing pages MAY use photography.
- Content pages: typography-led, imagery optional.
- No invented metrics or testimonials anywhere — copy is sourced from ehikings.com.

## Admin / Staff workspace (`/admin`)
A separate, app-like surface for staff — same token system, different chrome.
- **Backend:** Convex (`convex/`) — real database, server functions, real-time.
  Auth is company-email + password (PBKDF2-hashed, session tokens). Prod
  deployment `third-tern-430`; client reads `VITE_CONVEX_URL`.
- **RBAC is server-enforced, not cosmetic.** Every query/mutation resolves the
  caller's role and checks a capability before returning data. A Worker's
  `tasks.list` only returns tasks assigned to or created by them — the MD's
  confidential tasks are never sent to the client. Capabilities:
  `view_all_tasks · assign_tasks · manage_employees · manage_permissions ·
  create_channels · view_reports`, editable live in the **Access** matrix.
- **Hierarchy:** Admin → Manager → Agent → Worker, shown as a colour-coded role
  badge beside every name (Admin = green fill, Manager = blue fill, Agent = green
  outline, Worker = hairline).
- **Surfaces:** Overview (KPIs + recent tasks), Tasks (assign + status), Team
  (roster + add/manage employees), Chat (real-time project channels; restricted
  channels stay private to members), Mail (Zoho Mail inbox — see
  `ZOHO_MAIL_SETUP.md`), Access (permission matrix, Admin-only).
- **Chrome:** desktop left sidebar; **mobile = liquid-glass bottom nav**
  (`backdrop-blur-2xl` + translucent white + saturate) so it reads as a native app.
- **PWA:** `manifest.webmanifest` (start_url `/admin`, standalone) + service
  worker + apple-touch icon → installable to the home screen.
- **Logo:** the **full-colour** logo on a white chip (the dark site uses the
  white logo); accents follow the green/blue system above.
- **Cards/inputs:** `bg-surface/40`, hairline `--color-rule` borders, `rounded-2xl`,
  pill CTAs — consistent with the marketing site.

## Exports
### tokens.css
See [`tokens.css`](tokens.css) at the project root.
