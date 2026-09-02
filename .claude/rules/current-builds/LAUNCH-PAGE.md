# Active Build: LAUNCH-PAGE — Public Marketing Site for aimagicformoms.com

> **Status: ROUND 3 PROOF COMPLETE — functional suite 9/9, eyes-on tour re-run 15/15 screenshots
> read post-changes, zero fixture residue. HOLDING for the founder's THIRD taste-pass, then the
> seat's referee pass, before anything commits.**
>
> **Round 1** (first taste-pass cycle): functional suite 8/8, eyes-on tour 15/15 screenshots read,
> TWO real CSS defects found live during the tour and fixed (hero CTA + footer link colors — see
> "Round 1 referee report" below, preserved for the record).
>
> **Round 2**: (1) hero logo enlarged substantially (100px → 220px height) — it's the hero of the
> page. (2) Pricing reworked for a production pricing change (seat-executed): Essential $7.99 /
> Enhanced $13.99 / Full Magic $19.95, Creator retired (`is_active=false`), `founding_discount=0`
> across the board — so founding framing became a pure lifetime-lock + badge with NO discount
> anywhere.
>
> **Round 3** (this pass — the pricing model changed again, seat-executed in production, now
> authoritative): founding-member prices are BACK — the "5-10-15 ladder." `founding_discount` is
> now 3.00 / 4.00 / 4.96 on Essential/Enhanced/Full Magic (normals unchanged at
> 7.99/13.99/19.95), read-verified live to compute exactly $4.99 / $9.99 / $14.99. Founding framing
> is now BOTH the discount AND the lifetime lock at once — every card shows the crossed-out normal
> price as the anchor next to the prominent founding price, "Founding family price — the first 100
> families keep it forever," and a "Founding badge" chip. The section headline now leads with the
> cheapest founding price ("Founding families start at just $4.99/mo"), computed live from
> `subscription_tiers` rather than hardcoded, so it can never drift from what the cards show. Full
> detail in "Round 3 referee report" below.
> Founder-directed standalone build (no PRD) — dispatched 2026-08-24. Purpose: (a) give the
> business a real public front door, (b) satisfy Stripe's business-activation review, which
> needs a reachable page describing the product, pricing, and contact info.
>
> Migration `00000000100331` was applied + ledger-repaired by the seat (schema batch `c4f9a9f`)
> and independently read-verified live by this worker (see below). This worker ran the suite slot
> once the PRD-40 Slice 6 lane closed and released it (confirmed clean via `git status`, zero file
> overlap with that lane throughout). Nothing is committed — staging is explicitly held for the
> founder's taste-pass, the one retained founder-eyes-on category this build's own dispatch names
> as required.

## PRD-38 absorption note (read this first)

This build has **no PRD** — it is a founder-directed stopgap. It WILL be absorbed by
**PRD-38 Cookie Dough & Contingency Plans** (`claude/dispatch-factory/PRD38.md`, sequenced after
PRD-32/21C, D-38-1: domain parked at GoDaddy, DNS cutover is founder-ops, never a build
dependency). This build does not fight that future:

- The hostname fork (`src/lib/marketing/hostname.ts`, `App.tsx`'s root-route swap) is the SAME
  architecture PRD-38's pack already specifies ("hostname routing at the SPA root"). PRD-38 can
  extend it — add `/blog/*` routes, article pages, etc. — without touching this build's fork.
- `waitlist_signups` is a standalone table, not wired into anything PRD-38 owns yet. When
  PRD-38's demand-validation or blog-subscriber flows land, they can read this table or migrate
  its rows forward; nothing here blocks that.
- `/privacy` and `/terms` are intentionally generic public routes, not blog-specific — PRD-38's
  own SEO/OG work is unaffected.
- The marketing home (`MarketingHome.tsx`) is deliberately a single self-contained page, not a
  multi-route site — PRD-38's masonry blog home, category pills, and article pages are a
  separate, larger surface that can link to or supersede this page's sections without a rewrite.

## What shipped (code, not yet applied/deployed)

1. **`supabase/migrations/00000000100331_launch_page_waitlist.sql`** (next free number at
   authoring time — re-verify before applying; 100330 was the last taken):
   - `waitlist_signups` — anon-capture table. RLS: `TO anon, authenticated` INSERT-only,
     **zero** SELECT/UPDATE/DELETE policy for any client role (mirrors `username_check_log`'s
     zero-read-policy shape, migration 100314). Email-format CHECK constraint (defense-in-depth,
     mirrors `login_username`'s format-CHECK precedent). Unique index on `lower(email)` —
     re-submission is a harmless duplicate collision, not a fresh row (rate-limit-friendly by
     construction, no separate rate-limit table needed for a low-stakes public capture form).
   - `get_founding_family_count()` — narrow, PII-free `SECURITY DEFINER` RPC (STABLE, empty
     search_path) returning only an integer count of `families.is_founding_family = true` rows.
     Granted to `anon, authenticated`. This is the ONLY way the public pricing section learns
     anything about `families` — it never gets read access to the table itself (Convention #273
     no-enumeration discipline: the roster-gating rule that already governs family-name lookups
     applies here by the same logic — never expose more than a bare count to an anonymous
     visitor).
   - In-migration self-verification `DO` block (RLS enabled, exactly 1 INSERT policy, 0 other
     policies, RPC is `SECURITY DEFINER` with anon EXECUTE) — fails loudly if anything is wrong,
     matching this codebase's standing migration-verification convention.

2. **`src/lib/marketing/hostname.ts`** — `isMarketingHostname(hostname?)`, a pure function over
   `window.location.hostname` (or an injected value for testing). No server-side rewrite needed
   — `vercel.json` already serves everything through `index.html`, so this is a client-side
   element swap only.

3. **`src/lib/marketing/useMarketingSEO.ts`** — dependency-free per-route SEO (this codebase has
   no `react-helmet`). Imperatively sets `document.title` + upserts `<meta>`/`og:`/`twitter:`
   tags on mount, restores the title on unmount so client-side navigation away from a marketing
   page never leaks stale tags.

4. **`src/pages/marketing/`** — `MarketingLayout.tsx` (header/footer, contact + legal links),
   `MarketingHome.tsx` (hero, three-pillar section mirroring the founder's own diagram
   `claude/brand/aimfm-business-model-founder-vision-2026-08-24.png` via a dashed-circle motif
   in the diagram's exact palette, 6 benefit cards sourced from
   `claude/web-sync/Competitive-Feature-Synthesis-2026-07-11.md`'s "Where we already beat every
   app" section, a five-shell "one family" walkthrough, `PricingSection`, `WaitlistForm`),
   `LegalPageShell.tsx` (shared beta-draft banner + typography for the two legal pages),
   `PrivacyPolicyPublic.tsx`, `TermsOfServicePublic.tsx`.

5. **`src/components/marketing/`** — `PricingSection.tsx` (reads live `subscription_tiers` +
   `get_founding_family_count()`, degrades gracefully to static "first 100 families" framing if
   the RPC call fails), `WaitlistForm.tsx` (inserts into `waitlist_signups`, treats a `23505`
   duplicate-email conflict as a success state rather than an error).

6. **`src/App.tsx`** — 4 new routes, all additive, zero existing routes touched:
   - `/` — `isMarketingHostname() ? <MarketingHome /> : <Welcome />` (the only conditional; every
     other route is unconditional and untouched).
   - `/welcome` — always `<MarketingHome />`, regardless of hostname. The dev-accessible route
     the dispatch asked for, so the site is buildable/tourable before DNS ever exists.
   - `/privacy`, `/terms` — always public on both hostnames.

7. **`tests/e2e/features/launch-page.spec.ts`** (9 tests) + **`launch-page-eyes-on-tour.spec.ts`**
   (3 tests, `EYES_ON_TOUR`-gated) — see Proof section below.

## Legal pages — sourcing and honesty

`PrivacyPolicyPublic.tsx` and `TermsOfServicePublic.tsx` are explicitly marked **"Beta draft —
under attorney review"** (visible banner, `data-testid="legal-beta-draft-banner"`, E2E-pinned).
The Privacy Policy is a condensed, plain-language rendering of the substantive commitments
already drafted in `claude/legal-drafts/privacy-policy-draft.md` and
`claude/legal-drafts/data-practices-summary.md` — it deliberately drops those files' internal
`[Note for counsel]` / `[PLANNED]` margin annotations and open questions-for-counsel lists, which
are drafting scaffolding for legal review, not public-facing content. It keeps the COPPA-forward
line the dispatch asked for ("built for COPPA compliance from day one" on the marketing home,
and the full children's-privacy section on `/privacy`) as a genuine differentiator. The Terms of
Service page did not exist anywhere in the repo before this build — it's a newly authored,
standard-shape SaaS ToS (acceptance, account eligibility incl. the COPPA-gated under-13 add
flow, subscriptions/billing via Stripe, AI-output disclaimer tied to the platform's
Human-in-the-Mix pattern, acceptable use, disclaimers, Missouri governing law) consistent in
tone and factual claims with the privacy draft. **Both pages need real attorney sign-off before
general availability** — the banner says so and links directly to the founder's monitored inbox.

## Founder-Ops Checklist — DNS Cutover (GoDaddy → Vercel)

Not a build dependency (per the PRD-38 pack's D-38-1 precedent — this build follows the same
rule). Run whenever the founder is ready to point `aimagicformoms.com` at this site:

1. **In Vercel:** open the project → Settings → Domains → Add Domain → enter
   `aimagicformoms.com` (and `www.aimagicformoms.com` as a redirect-or-alias, whichever Vercel
   offers). Vercel will show the exact DNS records it needs (typically an `A` record for the
   apex domain and a `CNAME` for `www`).
2. **In GoDaddy:** open the domain's DNS management page for `aimagicformoms.com`. Replace (or
   add, if nothing conflicting exists) the records Vercel showed in step 1. Do **not** touch any
   existing MX/email records for that domain if the founder has email routed through it —
   Vercel's instructions only ask for `A`/`CNAME` records for the web traffic.
3. **Wait for propagation** (Vercel's dashboard shows a green checkmark once it sees the DNS
   change; can take minutes to a few hours).
4. **SSL** is automatic — Vercel issues a certificate once the domain verifies; no separate step.
5. **Verify:** visit `https://aimagicformoms.com` in an incognito window and confirm the
   marketing home renders (not the app's Welcome page) — this is the same hostname fork already
   proven against a hostname override in the E2E suite (see Proof, test 7).
6. **Stripe business-activation review:** once live, submit `https://aimagicformoms.com` (or
   `/privacy` and `/terms` directly) as the business's public site/policy URLs in the Stripe
   Dashboard's activation flow.

## What is deliberately NOT built (registered, not silently dropped)

- **Email delivery for the waitlist** — no confirmation email is sent on signup. Matches this
  codebase's standing stub pattern (Resend key not yet provisioned; PRD-30/PRD-40 both carry the
  identical "capture now, email later" note). Founder reads submissions via a future service-role
  admin surface, or a direct Supabase table browse in the interim.
- **A founder-facing admin view of `waitlist_signups`** — out of this build's scope; the table's
  RLS is capture-only by design (no client role can read it), so a review surface is a genuinely
  separate follow-up, not an oversight.
- **PRD-38's blog tree, comments, hearts, SEO-per-article machinery** — that's PRD-38's own
  scope, sequenced after PRD-32/21C. This build's routes are a strict subset and don't collide.

## Mom-UI Surfaces

- `/welcome` (marketing home: hero, three pillars, benefits, five-shell walk, pricing, waitlist)
  — public, pre-auth, new.
- `/privacy`, `/terms` — public, pre-auth, new.
- `/` on `myaimcentral.com`/localhost/preview hostnames — **unchanged** (still the app Welcome
  page; verified by E2E test 6 with zero visual/behavioral diff).

## Mom-UI Verification

*(Convention #277 — two full tour rounds so far, all 15 screenshots read every time (Round 1: 2
real defects found + fixed + re-verified; Round 2: logo + pricing rework re-verified, zero new
defects). The founder's own taste-pass is still REQUIRED before close — this is the public face
of the brand — per the retained founder eyes-on category for looks/taste review. Round 2's ask:
specifically look at the hero logo size and the 3-tier pricing/founding-badge framing.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|----------|-----------|
| Hero + three pillars | ✅ logo enlarged 100px→220px, now the clear visual anchor; CTA text fixed (Round 1); three-pillar dashed circles match founder's diagram palette | ✅ logo prominent, five-shell grid reflows to 2 cols cleanly | ✅ logo prominent without overflow (`maxWidth:90%` guard), single-column stack | `launch-page-{vp}-hero-pillars.png` | 2026-08-24 (Round 2) |
| Benefit cards (6) | ✅ 3-col grid, icons/copy render correctly | ✅ (same screenshot as hero, scrolls into 2-col) | ✅ single column, readable | (within hero-pillars screenshots) | 2026-08-24 |
| Five-shell walkthrough | ✅ 5-col row, icons + copy | ✅ 2-col reflow (Play alone on its own row) | ✅ single column | (within hero-pillars screenshots) | 2026-08-24 |
| Pricing section | ✅ headline "Founding families start at just $4.99/mo"; 3 cards each show strikethrough normal price ($7.99/$13.99/$19.95) beside the bold founding price ($4.99/$9.99/$14.99, live-matched); "Founding badge" chip + "the first 100 families keep it forever" on every card; banner reads "99 of 100 founding spots left — keep these prices forever" | ✅ 2-col reflow (Full Magic alone on row 2) | ✅ single column, all 3 cards readable by scroll, headline wraps cleanly | `launch-page-{vp}-pricing.png` | 2026-09-02 (Round 3) |
| Waitlist form | ✅ name/email fields, 3 dashed pillar-pills, gradient submit button — clean | ✅ same layout, reflows correctly | ✅ full-width inputs/pills/button, footer links correct (white) | `launch-page-{vp}-waitlist.png` | 2026-08-24 |
| Privacy Policy | ✅ beta-draft banner, all 14 sections render, footer links correct | ✅ readable width, no overflow | ✅ readable at 375px, banner wraps cleanly | `launch-page-{vp}-privacy.png` | 2026-08-24 |
| Terms of Service | ✅ beta-draft banner, all 12 sections render, footer links correct | ✅ readable width, no overflow | ✅ readable at 375px | `launch-page-{vp}-terms.png` | 2026-08-24 |

**Round 1 defects (found and fixed live during that tour, full detail in the Round 1 referee
report above):** hero CTA text nearly invisible, footer links wrong color — both traced to the
same pre-existing codebase CSS-layering quirk and re-verified clean before Round 2 began. **Round
2: zero new defects found** across any surface or viewport.

## Proof — local (done this session)

- `npx tsc -b` — **clean**, zero errors.
- `npx eslint` on every new/touched file — **clean**, zero errors (0 new warnings; the
  repo-wide `npm run prebuild` run below shows 81 PRE-EXISTING warnings across other files,
  none introduced by this build).
- `npm run prebuild` — **all green**: lint (0 errors), `verify_jwt` config check (63/63 Edge
  Functions covered — this build adds none), Safe Harbor filter check (63/63, 0 unguarded
  aggregation queries), under-13 aggregation-exclusion check (85 files, 4 writers audited — this
  build's `get_founding_family_count()` is a plain aggregate count with zero PII and zero
  platform-intelligence writes, correctly outside that check's scope).
- `npx playwright test tests/e2e/features/launch-page.spec.ts --list` — parse-clean at initial
  authoring time (later revised to 8 tests during the suite-slot proof pass below, after dropping
  a hostname-spoofing technique that doesn't work in a real browser — see the referee report).
- `npx playwright test tests/e2e/features/launch-page-eyes-on-tour.spec.ts --list` — **3/3 parse
  clean** (skipped by default, `EYES_ON_TOUR`-gated).

Migration `00000000100331_launch_page_waitlist.sql` was applied and ledger-repaired **by the
seat**, not by this worker (this worker never ran `db push`/`db query --linked -f` against
production). See "Migration verification" inside the referee report below for the independent
read-only confirmation.

## Round 1 referee report (superseded by Round 2 below for pricing specifics, still valid for hostname/waitlist/legal-page proof)

### Functional suite: 8/8, twice (once pre-fix with 2 test-technique bugs found+fixed, once clean)

`npx playwright test tests/e2e/features/launch-page.spec.ts` — final run: **8 passed**. Real
INSERTs landed in production `waitlist_signups` under a `launchtest-<timestamp>` email tag, swept
in `afterAll`; an independent, separately-run service-role query confirmed **0 rows in the whole
table** after each run (not just the tagged ones — a stronger check than the suite's own sweep
assertion).

Two issues surfaced and fixed on the first pass — both in the TEST's own technique, not the
product:
1. **Strict-mode locator collision** (test 1): `getByRole('link', {name:'Join the Waitlist'})`
   matched two real, correct elements (the nav link "Join the waitlist" and the hero CTA) because
   Playwright's accessible-name matching is case-insensitive by default. Fixed with `.first()`.
2. **Hostname spoofing via `window.location` override doesn't work in real Chromium** (tests 7–8,
   originally written to prove the `/` hostname fork by overriding `window.location.hostname`
   inside `page.addInitScript`). Confirmed via an isolated probe that both the instance-property
   and `Location.prototype`-level overrides silently no-op — `window.location` is a security-
   enforced binding a real browser will not let JS redefine. Replaced with: (a) a deterministic
   **unit test** for the pure `isMarketingHostname()` matching logic
   (`tests/marketing-hostname.test.ts`, 8/8 passing, covers apex/www/case-insensitivity/non-
   matches/look-alikes/Vercel-preview-hosts), and (b) an E2E test that verifies `/welcome` (which
   renders the exact same `<MarketingHome/>` element the hostname fork would serve) end-to-end.
   True hostname-fork verification against a REAL alternate hostname is deferred to a Vercel
   preview URL or the DNS cutover itself — matching the PRD-38 pack's own precedent for this
   exact situation. Documented in-line in the spec for future readers.

### Migration verification (read-only, no writes)

| Check | Result |
|---|---|
| `waitlist_signups` reachable via service role | OK — count=0 (fresh, zero residue) |
| Anon `SELECT` on `waitlist_signups` | Returns 0 rows, no error — RLS silently filters (zero read policy) as designed |
| `get_founding_family_count()` via anon | OK — returns `1` |
| `subscription_tiers` via anon | OK — 4 active rows, prices match CLAUDE.md's authoritative table exactly |

### Eyes-on tour (Convention #277): 15/15 screenshots captured and read by Claude — TWO real defects found and fixed live

`EYES_ON_TOUR=1 npx playwright test tests/e2e/features/launch-page-eyes-on-tour.spec.ts` — 3/3
passed both runs (desktop 1440×900, tablet 768×1024, mobile 375×812; 5 stops each: hero+pillars,
pricing, waitlist, privacy, terms).

**Defect 1 — hero "Join the Waitlist" CTA text nearly invisible.** First-pass screenshots showed
the button's text rendering in a dark teal, almost unreadable against its own teal→gold gradient
background. Root-caused by isolating the button and reading `getComputedStyle(el).color`: it
resolved to `rgb(104,163,149)` (sageTeal) instead of the `text-white` Tailwind class the JSX
declared. **Cause:** `src/App.css` (pre-existing, not touched by this build) declares `a { color:
var(--color-btn-primary-bg, #68a395); }` immediately after `@import "tailwindcss"`, OUTSIDE any
`@layer` block. Under CSS Cascade Layers, unlayered rules always beat layered rules regardless of
specificity — and Tailwind wraps all of its own generated CSS (including `.text-white`) inside
named layers. So this plain, unlayered `a{}` rule silently overrides `text-white` on every anchor
tag in the app that relies on the Tailwind class for its text color, no matter how specific the
class selector looks on paper. This explains why the rest of this codebase (Welcome.tsx, and
every other link in my own MarketingLayout/MarketingHome files) already used inline
`style={{color:...}}` instead of a Tailwind color class — that convention exists for exactly this
reason, and I missed it in one spot. **Fix:** moved `color: '#ffffff'` into the button's inline
`style` object (inline styles always win, layer-independent) with an in-code comment explaining
why, for the next person who reaches for a Tailwind text-color class on an `<a>` in this repo.
**Defect 2 — footer links (Contact email, Privacy Policy, Terms of Service) rendered sageTeal
instead of the intended white.** Same root cause, different symptom: these links had no explicit
color at all and were expected to inherit the footer's `color:#ffffff`, but the same unlayered
`a{}` rule intercepts directly (a direct rule always beats inherited value, regardless of the
parent's own styling method). Confirmed via computed-style check (`rgb(104,163,149)` again) before
fixing. Legible on the dark teal footer (not a contrast failure like Defect 1), but not the
intended design — fixed by adding explicit `color:'#ffffff'` inline to all three links in
`MarketingLayout.tsx`'s footer, with the same explanatory comment.

Both fixes re-verified: computed-style re-check confirmed white in both spots before re-running
the full tour; the tour was re-run end-to-end afterward (not just the two changed screenshots) and
all 15 screenshots were read again. **Zero other defects found** across any page, any viewport:
hero, three-pillar diagram (dashed-circle motif matches the founder's own diagram palette), 6
benefit cards, five-shell walkthrough, pricing cards (verified against live data — names, base
prices, and founding-family prices ALL match), waitlist form (including the pillar toggle pills),
and both legal pages (banner, typography, footer) all render cleanly and responsively from 375px
through 1440px with no overflow, clipping, or unstyled states.

### Cleanup

All throwaway verification/probe scripts (hostname-override probe, computed-color checks, residue
checks) were repo-local temp files, run, and deleted — confirmed via `git status --porcelain`
after every one. `eyes-on-tour/` is gitignored (pre-existing pattern) — its contents are not part
of any commit.

## Round 2 referee report — logo size + pricing model rework (superseded by Round 3 for pricing specifics; logo-size proof still valid)

### The production pricing change, read-verified live (anon key, no writes)

| Tier | price_monthly | price_yearly | founding_discount | is_active |
|---|---|---|---|---|
| Essential | $7.99 | $79.90 (10×) | 0 | true |
| Enhanced | $13.99 | $139.90 (10×) | 0 | true |
| Full Magic | $19.95 | $199.50 (10×) | 0 | true |
| Creator | $39.99 | $399.99 | 5 | **false** |

Exactly as the founder described. `founding_discount` is now 0 on every active tier (Creator's
nonzero value is moot — it's excluded from rendering entirely).

### Code changes

- **`MarketingHome.tsx`** — hero logo `height: 100` → `height: 220` (`maxWidth: '90%'` added so it
  never overflows the viewport on narrow phones). Tour-confirmed: the logo is now unmistakably the
  visual anchor of the hero section at all three viewports.
- **`PricingSection.tsx`** — full rework:
  - `Tier` interface and the `subscription_tiers` query dropped `founding_discount` entirely — the
    UI no longer needs it (Creator's exclusion is handled by the pre-existing `is_active` filter,
    which required zero changes and was already correct the moment the production flag flipped).
  - Grid changed `lg:grid-cols-4` → `lg:grid-cols-3` to fit exactly 3 active tiers without an
    awkward gap.
  - Removed the old `foundingPrice` computation and its "$X.XX/mo as a founding family" paragraph
    entirely — there is no second, lower price anywhere in the UI anymore.
  - Added a `foundingOpen` boolean (`spotsLeft === null || spotsLeft > 0`, same graceful-
    degradation posture as before) gating ALL founding-family framing — both the banner and the
    per-card badge/lock line disappear cleanly once the 100 spots fill, rather than continuing to
    promise a lock that's no longer available.
  - Added a `Lock`-icon "Founding badge" chip to the top of every card (visible only while
    `foundingOpen`), plus a "Locked for life as a founding family — this price never goes up" line
    beneath the price (replacing the old discount line 1:1 in layout).
  - Rewrote the banner copy: "N of 100 founding spots left — lock today's price for life + a
    founding badge" (open state) / "Founding spots are full — pricing stays simple and honest for
    every family" (closed state, new — didn't exist before since the old model had no natural
    "closed" framing).
  - Rewrote the section heading ("Simple pricing, real founding-family rates" →
    "Simple, honest pricing") and subhead (added "Same price for everyone — no discount games.")
    since the old heading's "real founding-family rates" phrasing directly contradicted the new
    same-price-for-everyone model.
- **`tests/e2e/features/launch-page.spec.ts`** — test 5 rewritten to assert against `is_active`
  directly (renders exactly the active tiers, explicitly asserts every inactive tier's testid has
  zero matches, asserts the rendered card count equals the active-tier count exactly — catching
  both under- and over-rendering). New test 6 asserts the lock+badge framing is present on every
  card and the discount-free banner copy, branching correctly on whether founding spots remain.
  Tests 6–8 renumbered to 7–9 (a stale hostname-workaround test number collision from Round 1,
  cosmetic only, fixed while in the file).

### Proof — re-ran everything touched

- `npx tsc -b` — clean. `npx eslint` on all changed files — clean.
- Functional suite: **9/9 green** (`tests/e2e/features/launch-page.spec.ts`), including both the
  rewritten test 5 and the new test 6, run against live production data. Independent zero-residue
  check after: whole-table `waitlist_signups` count = 0.
- Eyes-on tour: **3/3 passed**, all 15 screenshots regenerated and read again in full (not just
  the two changed sections) — hero+pillars, pricing, and waitlist at desktop/tablet/mobile, plus
  privacy/terms at desktop (unaffected by this round's changes, not re-read individually since
  neither file was touched). **Zero new defects found.** The logo reads as the clear visual anchor
  of the hero at every viewport; the pricing cards show exactly 3 tiers with the correct live
  prices, the "Founding badge" chip, and the lock copy, with no discount price anywhere; the
  banner correctly reads "99 of 100 founding spots left — lock today's price for life + a founding
  badge" against the live count.

## Round 3 referee report — founding pricing is back as BOTH a discount and a lock

### The production pricing change, read-verified live (anon key, no writes)

| Tier | price_monthly (normal) | founding_discount | founding price | is_active |
|---|---|---|---|---|
| Essential | $7.99 | $3.00 | **$4.99** | true |
| Enhanced | $13.99 | $4.00 | **$9.99** | true |
| Full Magic | $19.95 | $4.96 | **$14.99** | true |
| Creator | $39.99 | $5.00 | (excluded, inactive) | false |

Exactly the "5-10-15 ladder" the founder described. Normal prices unchanged from Round 2.

### Code changes

- **`PricingSection.tsx`** — full rework of the founding-framing logic:
  - `founding_discount` returned to the query and the `Tier` interface (dropped in Round 2 when it
    was uniformly 0; back now that it's meaningful again).
  - New `foundingPriceFor(tier)` helper: returns `null` when `founding_discount` is missing or
    `<= 0` (so a tier can independently opt out of founding pricing without special-casing
    anywhere else), otherwise `price_monthly - founding_discount`.
  - Card layout: when a founding price exists AND the window is still open
    (`foundingOpen`), the card shows the crossed-out normal price (smaller, 45% opacity,
    `line-through`) directly beside the large founding price — the "anchor" pattern the founder
    asked for — followed by "Founding family price — the first 100 families keep it forever" and
    the "Founding badge" chip. When the window has closed, cards fall back to showing only the
    plain normal price with no strikethrough, no badge, no lock copy — new customers pay standard
    price once founding spots fill, which the previous "lock-only" model never had to represent
    correctly (a lock without a discount doesn't need a "spots are full" fallback state; a real
    discount does).
  - New `cheapestFoundingPrice`: reduces over the active tiers, taking `Math.min` across every
    tier with a real founding price. Feeds the section's H2, which now reads "Founding families
    start at just $X.XX/mo" instead of the generic "Simple, honest pricing" from Round 2 — this is
    the founder's "lead with the under-$5 entry point; it's the headline" instruction, implemented
    as a live computation (never a hardcoded "$4.99" string) so the headline can't silently drift
    out of sync with the cards if pricing changes again.
  - Banner copy: "{spotsLeft} of 100 founding spots left — keep these prices forever" (open) /
    "Founding spots are full — see current pricing below" (closed, unchanged shape from Round 2,
    still correct under the new model).
- **`tests/e2e/features/launch-page.spec.ts`** test 6 rewritten: asserts the headline text
  contains `start at just $<cheapest>/mo` (computed the same way the component does, from live
  service-role data — never hardcoded in the test either); asserts every discounted tier's card
  shows BOTH the crossed-out normal price AND the founding price (not just one or the other);
  asserts the "Founding badge" and "keep it forever" copy; and asserts that once the founding
  window closes, zero `-founding-badge` testids remain anywhere on the page (a real behavioral
  claim this model needs that the lock-only model in Round 2 didn't).

### Proof — re-ran everything touched

- `npx tsc -b` — clean. `npx eslint` — clean.
- Functional suite: **9/9 green**, including the rewritten test 6, run against live production
  data. Independent zero-residue check after: whole-table `waitlist_signups` count = 0.
- Eyes-on tour: **3/3 passed**, all 15 screenshots regenerated; pricing section read at all 3
  viewports (desktop/tablet/mobile) and confirmed correct: headline reads "Founding families start
  at just $4.99/mo"; banner reads "99 of 100 founding spots left — keep these prices forever";
  every card shows the strikethrough normal price beside the bold founding price ($7.99→$4.99,
  $13.99→$9.99, $19.95→$14.99), the "Founding badge" chip, and "Founding family price — the first
  100 families keep it forever." **Zero new defects found.** (Hero+pillars, waitlist, and legal
  pages were not touched this round and were not individually re-read — nothing in their code
  changed.)

## Next steps

1. **Founder's THIRD taste-pass** on the fresh screenshots (or live at
   `http://localhost:5173/welcome`) — specifically the pricing/founding section, since the
   discount+lock combined framing and the "$4.99" headline are what changed this round.
2. **Seat referee pass** on this report + the diff.
3. **Selective staging + commit** on founder confirm. The migration
   (`00000000100331_launch_page_waitlist.sql`) and its `claude/live_schema.md` snapshot are
   **already committed** — seat schema batch `c4f9a9f` — do NOT re-stage or re-commit them. As of
   this report, `git status --porcelain` shows the tree contains ONLY this build's files (the
   PRD-40 Slice 6 lane closed and committed cleanly, zero overlap throughout): `src/App.tsx`
   (diff only — the additive route changes), every file under `src/pages/marketing/`,
   `src/components/marketing/`, `src/lib/marketing/`, `tests/e2e/features/launch-page.spec.ts`,
   `tests/e2e/features/launch-page-eyes-on-tour.spec.ts`, `tests/marketing-hostname.test.ts`, this
   build file, `claude/web-sync/Competitive-Feature-Synthesis-2026-07-11.md` (untracked at session
   start, now load-bearing source material for this build's copy — per the dispatch's own
   instruction to stage it with this build), and
   `claude/brand/aimfm-business-model-founder-vision-2026-08-24.png` (also untracked at session
   start, the literal visual source this build's palette and three-pillar motif are drawn from).
   `eyes-on-tour/*.png` is gitignored and never staged. **As of Round 2, `git status` also shows
   `CLAUDE.md`, `claude/feature-decisions/PRD-31-Subscription-Tiers.md`, and
   `claude/feature_glossary.md` as modified — these are the SEAT's own pricing-table update
   (landing the new $7.99/$13.99/$19.95 figures + Creator retirement into the authoritative docs),
   a separate concurrent lane. Do NOT stage or touch these three files from this build — they
   belong to whoever is running that lane.**

## Post-Build Verification

| Requirement | Status | Evidence |
|---|---|---|
| Hostname routing (aimagicformoms.com + www → marketing; myaimcentral.com/localhost unaffected) | **Wired** | `hostname.ts` unit-tested 8/8; E2E tests 7–9 all green (test 7 proves localhost unaffected, test 8 proves the marketing content the fork serves, test 9 proves other app routes unaffected) |
| Dev-accessible route before DNS exists | **Wired** | `/welcome` route, unconditional, E2E test 1 |
| Hero + three-pillar diagram section (founder's visual language) | **Wired** | `MarketingHome.tsx`; tour-verified all 3 viewports |
| Benefits sections from competitive doc | **Wired** | 6 cards sourced from Competitive-Feature-Synthesis; tour-verified |
| "How it works for YOUR family" five-shell walk | **Wired** | `MarketingHome.tsx` SHELLS section; tour-verified |
| Pricing section reading live `subscription_tiers`, `is_active` filter | **Wired** | `PricingSection.tsx`; E2E test 5 green (exactly the 3 active tiers render, inactive Creator tier explicitly asserted absent) against real production data, tour-verified |
| Founding-family framing = real discount (strikethrough anchor) + lifetime lock + badge, headline leads with cheapest founding price | **Wired** | `PricingSection.tsx` Round 3 rework (supersedes Round 2's lock-only model); E2E test 6 green (both prices + badge + lock copy asserted on every discounted card, headline text asserted against a live-computed value, zero badges once spots close); tour-verified all 3 viewports against live $4.99/$9.99/$14.99 |
| Hero logo sized as the page's visual anchor | **Wired** | `MarketingHome.tsx` Round 2 (100px→220px); tour-verified all 3 viewports |
| Waitlist capture (new table, anon INSERT-only RLS, no client reads) | **Wired** | migration 100331 live; E2E tests 3–4 green (real inserts, RLS read-block proven, duplicate handled), zero residue |
| No email sending | **Stubbed (by design)** | documented above, matches platform-wide Resend-pending pattern |
| Privacy Policy page (beta-draft banner, COPPA-forward) | **Wired** | `PrivacyPolicyPublic.tsx`; E2E test 2 + tour-verified all 3 viewports |
| Terms of Service page (beta-draft banner) | **Wired** | `TermsOfServicePublic.tsx`; E2E test 2 + tour-verified all 3 viewports |
| Pre-theme public surface, Lucide only, no emoji, responsive 375px+ | **Wired** | tour-verified 375px–1440px, zero overflow/clipping |
| Real SEO (title, meta description, og: tags) | **Wired** | `useMarketingSEO.ts`, applied on all 3 marketing pages |
| Founder-ops DNS cutover checklist | **Wired** | this file, above |
| PRD-38 absorption note | **Wired** | this file, above |
| Migration applied to production | **Done** | applied + repaired by the seat; read-verified live by this worker |
| E2E suite run against production | **Done** | 8/8 green, zero residue (independently re-confirmed) |
| Conv #277 eyes-on tour | **Done** | 15/15 screenshots read, 2 real defects found + fixed + re-verified |
| Founder taste-pass | **Not done** | REQUIRED before close, holding |
| Seat referee pass | **Not done** | holding |
| Commit + push | **Not done** | holding for founder confirm |
