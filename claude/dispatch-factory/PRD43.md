# Pre-Dispatch Pack — PRD43: WishLists (Gift Planning & In-Store Capture)

> **Factory status:** **APPROVED 2026-07-07** — founder resolved D-43-1..9 same day, all
> recommendations approved with ONE change: **name = WishLists** (plain compound-capitals;
> rejected WishWell/WishKeeper/GiftGlow). Values line confirmed verbatim (surprise is not
> surveillance; no-hiding runs one direction). Rulings recorded in the PRD's §14 Founder
> Decision Record. **Dispatch prompts below are FINAL** — founder dispatches Phase A from
> the queue.
> Produced: 2026-07-07 (Fable 5 design session — PRD authored same session, so this pack's
> evidence IS the PRD: `prds/daily-life/PRD-43-Wishlists-Gift-Planning.md`. Recon was two
> live agents: PRD sweep [09B/13/15/33/24 + addenda] + code/RLS audit; findings folded into
> the PRD's §3 ecosystem table. No separate RECON file.)
> Item ID: PRD43. Priority: **P3** (family-experience). Name **WishLists**
> (founder pick, D-43-1; keys/routes `wishlists_*` — exactly aligned).
> Two v1 build phases, one dispatch prompt each.
> Headline: the April 2026 design doc (`Composed-View-Surfaces-and-Wishlists.md`) did the
> architecture; production did most of the plumbing. **The context-assembler already has a
> wishlist loader — dark because `lists.is_included_in_ai` defaults false with no UI toggle.
> Lists RLS is already owner-or-parent (a mom-owned unshared list is ALREADY invisible to a
> kid's own login) — the only hidden-list hole is the family-device shadow policy, closed
> with one RESTRICTIVE policy. `list_items` already carries reward-image columns and
> `reward_proposals` already gives kids "ask to earn this."** The build is: one capture
> sheet, two small EFs, three small tables, a handful of columns, and wiring.

## Reconciliation rulings (newer wins — named explicitly)

1. **April doc remains in force; its one schema idea is superseded.** Composed-view
   portrait, "Add as reward" promotion, "still wanted" state, store-domain grouping,
   wishlist-to-budget: all honored (PRD §3/§12). The `wishlist_reward_links` table idea
   predates the Phase-3 connector + KIDS-REWARDS spine — superseded by provenance metadata
   (`source_list_item_id`) on existing reward artifacts. No new reward table.
2. **`gift_for` reconciliation:** production `list_items.gift_for` is a **UUID FK →
   family_members** (Living-Shopping-List addendum), not PRD-09B's TEXT occasion field.
   Ruling: `gift_for` keeps the recipient semantic and stays dormant in v1 (future kids'
   giving-lists socket); occasions get `occasion_tags TEXT[]`. Never regress it to text.
3. **The hidden mom list is the Living-Shopping-List addendum's "Gift Ideas" lists, made
   first-class:** `list_type='gift_ideas'` + `lists.subject_member_id` + RESTRICTIVE RLS
   (`AS RESTRICTIVE` on lists AND list_items: `list_type IS DISTINCT FROM 'gift_ideas' OR
   util.gift_planning_access(family_id)`; helper returns FALSE for family-shadow sessions).
   Restrictive = ANDed over every present/future permissive policy — closes the
   `lists_family_device` read hole and immunizes against FDWA's planned policy expansions.
   **Coordination note to FDWA: never add gift_ideas arms; the restrictive policy makes
   that structural.**
4. **Two disconnected "wishlist" concepts reconciled:** the `lists`-table wishlist is
   canonical (the assembler loader already reads it); the orphaned auto-provisioned Archives
   `folder_type='wishlist'` folder becomes a doorway to the member's wishlist surface —
   Convention #75, no copies. PRD-13's mom-only Archive wishlist card intent is served by
   the Gift Planning surface.
5. **Capture never blocks on AI (HITM threading per Convention #279):** typed/spoken text =
   mom's own words, saves instantly, no HITM. Photo saves instantly with the image; Sonnet
   vision proposes a title as a confirm-required chip (the confirm IS the HITM). Link og:/
   JSON-LD extraction is deterministic parsing (.ics class — no HITM, labeled "auto-filled");
   only the rare Haiku fallback requires confirm. The 5-second capture contract is normative.
6. **Rewards spine reality:** PRD-24's `gamification_rewards`/`reward_redemptions` were
   never built — nothing may target them. "Add as reward" prefills task/contract reward
   fields (reward_description/reward_image_url exist on `tasks` AND `list_items`); kid-side
   "Ask to earn this" prefills `reward_proposals.terms`. **ST-F owns payer architecture —
   this build only prefills whatever ST-F leaves standing** (check whether ST-F landed at
   build time; if contracts-as-payer changed, follow its ruling).
7. **Share links are greenfield and the ONLY external exposure.** Out of Nest (PRD-15) is
   conversation-only by design — not the mechanism. Tokenized link: 128-bit token, SHA-256
   hash stored (PIN discipline), revocable, default-90-day expiry, noindex, per-IP
   rate-limited, first-name-only, frozen mom-approved sizes snapshot. Public traffic ONLY
   via the `wishlist-share` EF (no PostgREST). ARP/PRD-40 coordination: one line in the
   data-practices summary for counsel.
8. **Claims are DB-invisible to the subject:** `gift_claims` has NO kid read arm, NO
   family-device arm, and excludes rows whose list subject/owner is the caller (mom never
   sees claims on her own list). First-claim-wins partial unique index. E2E leak probes are
   load-bearing deliverables, not nice-to-haves.
9. **Convention #257 posture:** `gift_history.given_on` is a user-chosen date (exempt class,
   `meal_plan_entries.entry_date` precedent). Birthday-nudge cron computes at
   `families.timezone`, idempotent per (member, year). No client "today" writes anywhere.
   Run the #257(c) verification queries pre-work.
10. **Both EFs carry the full SAFETY-BETA-GATE scaffold from birth.** `wishlist-extract`
    (link + photo modes, recipe-extract one-EF-many-modes precedent; category-2 utility per
    Convention #248 — stated). `wishlist-share` is public token-auth (`--no-verify-jwt`,
    token-hash constant-time check in code, no AI, Zod, structured count logging).
11. **`lists.is_included_in_ai` anomaly handled surgically:** wishlist creation sets true +
    Heart toggle + context indicator ship; the table default stays false for other list
    types. The existing assembler loader (§2f) gains per-item `is_included_in_ai` +
    `wishlist_state='active'` filters + recency order. `gift_ideas` lists get a HARD
    assembler exclusion for any conversation whose member/View-As subject is the list's
    subject (Convention #76 class).
12. **`list_type` CHECK extension follows the ST-0 lesson:** rebuild from the CURRENT
    production constraint body, never a stale migration; ship the enumeration regression
    vitest (constraint values ⊇ every literal the code writes).
13. **Scoping-correctness (ST-A rider-b class):** Special Adults appear in NO gift audience,
    picker, or policy. Sibling visibility default NO (D-43-5). MindSweep teen disposition
    maps wishlist classifications to "Add to my wishlist" (self only).
14. **Mobile parity:** `/wishlists` registers ONCE in `getSidebarSections()` (Family
    section); Convention #16 checklist at build. The public `/wish/{token}` page lives
    outside AuthGate with no shell.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

**Phase A — Foundation, capture, three surfaces (dispatch 1):**

| Slice | Scope | Routing |
|---|---|---|
| A1 | Migration: `lists.subject_member_id` + partial unique (one gift_ideas list per family+subject); `list_items` +`image_url` +`is_included_in_ai` +`wishlist_state` +`occasion_tags` +`added_by` +`excluded_from_shares`; `gift_claims` + `wishlist_share_links` + `gift_history` tables; `util.gift_planning_access()` helper; RESTRICTIVE gift_ideas policies (lists + list_items); adult-read policy for kid wishlists per D-43-5; `gift_planning` grant key + Permission Hub row + `apply_permission_profile` exclusion; `list_type` CHECK extension + enumeration vitest; `wishlist-images` storage bucket; feature keys; member-removal share-link auto-revoke; schema:dump | Sonnet xhigh + migration-writer + rls-verifier |
| A2 | `wishlist-extract` EF (link deterministic og:/JSON-LD/oEmbed + Haiku fallback; photo Sonnet vision; full safety scaffold; cost logging) + WishCatch capture sheet (person pills w/ last-used memory, text/mic/camera/link-detect, instant save, suggested-title confirm chips, duplicate soft-warn, sticky reopen) + entry points: QuickCreate action, `/wishlists` headers, RoutingStrip `wishlist` destination w/ person drill-down (`dynamicSubOptions`), `mindsweep-sort` wishlist classification + Review & Route card + deployQueueItem wishlist path + teen disposition mapping | Sonnet xhigh |
| A3 | `/wishlists` surface per shell (teen full-control list w/ dnd priority + occasion filters + dormant + hearts + balance/"$X away" gated on `child_can_see_finances`; guided simplified; Play picture grid, no prices; mom/adult person tabs) + item detail/refine sheet (incl. store-domain group toggle, exclude-from-shares) + Gift Planning tab (gift_ideas lazy-create, WishCatch-in-context, Considering copies w/ provenance + changed-their-mind flags, claim controls) + Archives folder doorway + sidebar/BottomNav registration + FeatureGuide | Sonnet xhigh |

**Phase B — Sharing, intelligence, motivation bridge (dispatch 2, after A sign-off):**

| Slice | Scope | Routing |
|---|---|---|
| B1 | `wishlist-share` EF (view/reserve/purchase/release; token-hash auth; rate limit; counters) + public `/wish/{token}` page (outside AuthGate, exposure contract per PRD §6.6, noindex, warm dead-ends) + share-link manager (scope picker: occasions/pinned items; sizes snapshot editor from `archive_member_settings.physical_description`; allow-reserve per D-43-3; expiry; revoke; view analytics) + claim race handling both paths | Sonnet xhigh |
| B2 | Gift history (claim `given` transitions + manual entries + per-member/year/occasion views) + LiLa: assembler loader upgrade (per-item filters, recency, cap, gift_ideas subject-exclusion) + Gifts-mode wiring + `is_negative_preference` avoid-context + birthday-nudge cron (SQL-only, family-timezone, idempotent) + help-patterns + feature-guide-knowledge | Sonnet xhigh |
| B3 | Motivation bridge: "Add as reward" prefill (+ "Set up as a reward" indicator via provenance query), "Ask to earn this" → reward_proposals prefill, CONDITIONAL "Add to Reward Shop" prefill if PECON has shipped (reward_shop_items name/image + provenance — freshness check), Shopping Mode Gift Ideas section for gift_ideas lists (`include_in_shopping_mode`) + Watch-For query, FGPZ prize-image prefill, wishlist-to-budget display sums + PlannedExpansionCards ×4 + E2E `tests/e2e/features/wishlists-gift-planning.spec.ts` (WISHTEST prefix; load-bearing leak probes: kid-session zero-rows on all four gift tables, family-device gift_ideas zero-rows, View-As-kid no-gift-surface render, subject-exclusion on own-list claims, forged/expired/revoked token probes, claim race exactly-one, capture-speed smoke) + Convention #277 eyes-on tour + docs close-out (STUB_REGISTRY, WIRING_STATUS, CLAUDE.md conventions per PRD §15, live_schema regen) | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 per phase | **Fable if available, else Opus** |

Rider (a) standard (STUDIO-EXPERIENCE): every pin drives the REAL flow with service-role DB
assertions. WISHTEST fixture prefix, swept beforeAll+afterAll, zero residue.

## Founder decisions — RESOLVED 2026-07-07 (all recommendations approved; full record PRD §14)

| # | Decision | Ruling |
|---|---|---|
| D-43-1 | Name | **WishLists** (founder pick — plain compound-capitals; rejected WishWell/WishKeeper/GiftGlow); keys `wishlists_*` |
| D-43-2 | Share-link exposure | First-name label, items only, frozen mom-approved sizes opt-in, revocable, 90-day default, noindex, rate-limited — nothing else about the child |
| D-43-3 | Reserve-without-account | **v1**, per-link toggle — reservation is what actually prevents double-gifting |
| D-43-4 | Mom sees claims on kids' lists? | **Yes** — all gift-access adults see claims EXCEPT on their own list (subject-exclusion protects everyone's surprises incl. mom's) |
| D-43-5 | Kid wishlist default visibility | Kid + mom + additional_adult; siblings NO (shareable); Special Adults never; gift_planning surfaces stay mom + explicit grant |
| D-43-6 | Price tracking / extension / Secret Santa | All PlannedExpansionCards |
| D-43-7 | Wishlist → LiLa/Archives | Direct context source, zero copying; manual Send-to-Archives for durable interests; NO auto-glean |
| D-43-8 | Default LiLa inclusion | New wishlists `is_included_in_ai=true` + hearts + indicator; founder-family backfill only with her explicit ok at build |
| D-43-9 | v1 scope | Phases A+B as specced |

## Dependency edges

- Depends on (all BUILT): lists/list_items + Living-Shopping-List machinery (PRD-09B),
  Archives incl. `physical_description`/`is_negative_preference` (PRD-13 + later
  migrations), context assembler wishlist loader (dark — this lights it), MindSweep +
  share_target text/url (PRD-17B), RoutingStrip (PRD-17), notifications (PRD-15), rewards
  spine (`earned_prizes`/`reward_proposals`/reward columns, KIDS-REWARDS), financial ledger
  + `child_can_see_finances` (PRD-28), `useVoiceInput` (VOICE-INPUT-REPAIR), pg_cron +
  Vault (Convention #246).
- Coordinate with (in flight / packs): **PECON** (landed same day, 2026-07-07, parallel
  session — the Point Economy / Reward Shop sibling. Verified non-conflicting: PECON's shop
  purchases create `earned_prizes` with `source_type='store_purchase'`; PRD-43's bridge
  prefills `reward_proposals` + task/contract reward fields; no shared tables, no shared
  provenance enum values. NATURAL INTEGRATION: if PECON ships first, the wishlist item
  action sheet gains an "Add to Reward Shop" prefill (`reward_shop_items` name/image from
  the item, `source_list_item_id` provenance) — Phase B slice B3 carries this as a
  conditional deliverable, display-level prefill only, zero schema coupling. Both packs'
  freshness preambles check for the other), **ST-F** (reward payer architecture — prefill
  only, follow its ruling), **FDWA** (restrictive policy note — never open gift_ideas;
  whoever lands second re-verifies), **PRD-30 SM-C** (shared email sender → emailed share
  links; v1 copy-link), **PRD-33** (image share_target + offline capture sockets), **FGPZ**
  (prize-image prefill, display-level only), **ARP/PRD-40** (share-link line in the
  data-practices summary for counsel).
- Unblocks later: kids' giving-lists, Secret Santa (randomizer + claims), group gifting,
  goal-pool savings wiring (PRD-28), Out-of-Nest in-app wishlist surface (PRD-37 era).
- No upstream blockers. Suggested queue slot: **P3 chain beside PRD12A/12B and PRD42** —
  high founder-family daily-use value (the in-store moment), zero dependency risk, and the
  capture surface it builds (WishCatch + RoutingStrip destination) sweetens MindSweep and
  Notepad immediately.

---

## DISPATCH PROMPT — PHASE A (paste into a FRESH session after decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-43 WishLists (Gift Planning & In-Store Capture),
PHASE A (schema + RLS, capture pipeline, the three per-kid surfaces). Founder resolved
decision batch D-43-1..9 on 2026-07-07 — all recommendations approved; the one override is
the NAME: **WishLists** (display name via a single constant). Rulings live in the PRD's §14
Founder Decision Record; if anything in this pack disagrees with §14, the PRD §14 text
wins. Keys/routes are `wishlists_*`.

FRESHNESS PREAMBLE: pack produced 2026-07-07. Run `git log --oneline --since=2026-07-07`;
re-read CLAUDE.md conventions added since; check whether ST-F landed (reward payer
architecture — Phase B prefills follow it, but note it now); check whether FDWA landed (its
family-shadow policies must NOT open gift_ideas — your RESTRICTIVE policy makes that
structural; verify no gift_ideas arms were added); re-verify the CURRENT production
`lists.list_type` CHECK body before extending it (ST-0 lesson — never rebuild from a stale
migration); take the next FREE migration number at file-creation time and re-check
immediately before applying — if `supabase migration list --linked` shows unapplied
migrations that are NOT yours, apply only your own idempotent SQL via
`supabase db query --linked -f <file>`, never `db push`.

READ FIRST (in order):
1. prds/daily-life/PRD-43-Wishlists-Gift-Planning.md — FULL read, every word. It is the
   requirement list: every screen, field, empty state, edge case in §4–§12 gets built
   exactly as written. §8's visibility matrix and §6.1's 5-second capture contract are
   normative.
2. claude/dispatch-factory/PRD43.md — the 14 reconciliation rulings are LAW (esp. ruling 3:
   RESTRICTIVE policy shape; ruling 5: capture never blocks on AI; ruling 8: claims
   DB-invisible to the subject; ruling 12: CHECK-extension discipline).
3. claude/feature-decisions/Composed-View-Surfaces-and-Wishlists.md — design lineage
   (store-domain grouping, still-wanted state, progressive refinement all trace here).
4. prds/addenda/Living-Shopping-List-and-Shopping-Mode-Addendum.md §Gift Ideas + §Watch For
   — the gift_ideas canon this build makes first-class.
5. supabase/functions/_shared/{safety-preamble,crisis-detection,openrouter-client}.ts +
   supabase/functions/mindsweep-scan/index.ts — your wishlist-extract scaffold (link fetch
   pattern + vision pattern live there).
6. src/hooks/useLists.ts + src/pages/Lists.tsx wishlist rendering + the lists/list_items
   RLS migrations (00000000000026, 00000000100140/100141, 00000000100262) — the policy set
   your restrictive policy layers onto. Read every live policy before writing yours.
7. Create .claude/rules/current-builds/PRD-43-wishlists.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md incl. Mom-UI Surfaces list; founder
   approval BEFORE code.

BUILD SLICES A1→A2→A3 per the pack table. HARD RULES: the 5-second capture contract is
normative (no required fields beyond one input; nothing blocks save; AI proposals land as
confirm chips AFTER the save); typed/spoken captures are mom's words — no HITM; photo/link
AI-derived text persists ONLY behind the confirm chip (Convention #279); RESTRICTIVE (not
permissive) policies enforce gift_ideas invisibility incl. against family-shadow sessions;
gift_claims gets NO kid read arm, NO family-device arm, and subject-exclusion (mom never
reads claims on her own list); Special Adults appear in NO gift audience or picker;
`gift_planning` is explicit-grant-only (apply_permission_profile exclusion list — migration
100264 precedent); every capture writes added_by + wishlist_state='active' +
is_included_in_ai=true; occasions are occasion_tags — NEVER repurpose gift_for (it stays
the dormant UUID recipient FK); dnd-kit with ⠿ handles persisting sort_order; balance
surfaces gate on primary-pool child_can_see_finances and Play shows no prices at all;
every "today" read via useFamilyToday (Convention #257; run the #257(c) queries pre-work);
Lucide only, zero emoji, theme tokens only (npm run check:colors), density classes, ModalV2,
BottomNav parity via the single getSidebarSections registration (#16 checklist).

PROOF (rider-a standard — pins drive REAL flows with service-role DB assertions, WISHTEST
prefix, swept): capture round-trip for all four input modes (text/voice-transcript/photo/
link — mock the model only where Playwright can't hold a key); RLS leak probes are
LOAD-BEARING: kid session reads zero gift_ideas/gift_claims rows (direct PostgREST probes),
family-device session reads zero gift_ideas rows, View-As-kid renders no gift surface, the
enumeration vitest green; suggested-title chip confirm persists + reject discards;
duplicate soft-warn renders and never blocks; teen dnd reorder persists; dormant round-trip;
Gift Planning Considering-copy carries provenance + changed-their-mind flag. tsc -b clean,
lint clean, regression pins green (leak-pass is MANDATORY — you touch lists RLS; run
fo-command-center and kids-rewards slices too if you touch any surface they pin). Ask the
founder before running shared-fixture suites and before deploying ANY Edge
Function (present the deploy list for one approved pass). Convention #277 eyes-on tour for
every Phase-A Mom-UI row at desktop/tablet/mobile as mom + teen + guided + Play; fill the
table in the active build file. NOTHING COMMITS until proof green AND founder confirms;
selective staging of YOUR files only (parallel sessions are active — check git status
first). Close-out: Checkpoint 5 zero-Missing for Phase A scope, live_schema regen,
STUB_REGISTRY (register the PRD §13 sockets), WIRING_STATUS section, leave Phase B a
coordination note (EF names, policy names, route/testid contracts it consumes).
```

## DISPATCH PROMPT — PHASE B (paste into a FRESH session after Phase A sign-off)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-43 WishLists, PHASE B (share links + public page,
gift history, LiLa wiring + birthday nudge, motivation bridge, E2E + close-out). Phase A is
signed off — read its coordination note in .claude/rules/current-builds/ (or the archived
build file) FIRST, then the same READ list as Phase A (PRD full read, pack rulings,
freshness preamble with `git log --since=<Phase A close date>` — including whether ST-F
landed: your Add-as-reward prefill follows ITS payer ruling; whether PECON shipped: if yes,
the item action sheet gains "Add to Reward Shop" (reward_shop_items name/image prefill +
source_list_item_id provenance, display-level only); and whether PRD-30 SM-C's shared
send-email exists: if yes, wire one-tap emailed share links; if no, copy-link only +
quiet note, never a fake sender).

BUILD SLICES B1→B3 per the pack table. HARD RULES: the share-link exposure contract (PRD
§6.6/§8.3) is normative — first-name-only label, items + optional FROZEN mom-approved sizes
snapshot, nothing else about the child in any payload, noindex, per-IP rate limit; tokens
are 128-bit, SHA-256-hashed at rest (PIN discipline), raw shown exactly once; the public
page lives OUTSIDE AuthGate with no shell and every byte it renders comes through the
wishlist-share EF (zero PostgREST from the public page); claim race = partial unique index
+ "already spoken for" on BOTH the EF path and the adult UI path; gift_history.given_on is
a user-chosen date (Convention #257 exempt class — no trigger derivation); birthday-nudge
cron is SQL-only at families.timezone, idempotent per (member, year), priority 'normal',
NEVER DND-bypassing; the assembler gift_ideas subject-exclusion is a HARD constraint
(Convention #76 class) — pin it; Gifts-mode suggestions stay ephemeral until mom's one-tap
adoption into gift_ideas (Convention #279 — the tap IS the persistence gate);
PlannedExpansionCards carry all three Convention #31 sections; no emoji anywhere.

PROOF (WISHTEST prefix, swept): forged-token / expired / revoked probes all dead (zero
rows, zero writes); reserve → gift_claims row with claimant_label + share_link_id; race
probe exactly-one-claim; kid session still zero-rows on all four gift tables after every
new policy (re-run the Phase A leak probes — they are regression pins now); subject-
exclusion probe (mom queries claims on her own list → zero); share page drops
dormant/received/excluded items live; sizes snapshot FROZEN (edit archives after link
creation → page unchanged); LiLa loader probe (heart an item off → gone from assembled
context; gift_ideas never assemble for the subject's conversations); birthday nudge
idempotence; Add-as-reward prefill lands reward_description/reward_image_url + provenance
and the indicator renders; Ask-to-earn prefills reward_proposals.terms. Full Convention
#277 eyes-on tour (mom + teen + guided + Play + the PUBLIC share page at three viewports),
fill the Mom-UI table. tsc -b, lint, regression pins (leak-pass, permissions-wiring — you
add a Permission Hub row; fo-command-center; kids-rewards slices — you touch
reward_proposals surfaces). Founder approval before EF deploys and shared suites. NOTHING
COMMITS until proof green AND founder confirms; selective staging. Close-out: Checkpoint 5
zero-Missing across the WHOLE PRD (A + B), verification table copied to
claude/feature-decisions/PRD-43-Wishlists-Gift-Planning.md record, live_schema regen,
STUB_REGISTRY + WIRING_STATUS + CLAUDE.md (both PRD §15 conventions), LiLa knowledge
updates (help-patterns + feature-guide-knowledge), FeatureGuide on /wishlists, archive the
build file, feature-decisions README index row.
```
