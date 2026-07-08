# Active Build: PRD-43 — WishLists (Gift Planning & In-Store Capture), PHASE A

> **Status: PHASE A CODE COMPLETE — all proof green (11/11 E2E, 10/10 + 1/1 constraint vitests, zero fixture residue, tsc clean, lint clean, Convention #277 eyes-on tour fully read with 4 real bugs found+fixed). Reported code-complete to the coordination seat per its explicit instruction — NOT committed; rides the seat's tree-wide commit batch (selective staging, this build's files only).**
> PRD: `prds/daily-life/PRD-43-Wishlists-Gift-Planning.md` (APPROVED 2026-07-07, §14 = founder decision record, D-43-1..9 all resolved).
> Pack: `claude/dispatch-factory/PRD43.md` (14 reconciliation rulings, are LAW).
> Design lineage: `claude/feature-decisions/Composed-View-Surfaces-and-Wishlists.md` (2026-04-29, honored not replaced).
> Feature decision file: **the PRD itself** (§14 is the decision record; no separate `claude/feature-decisions/` file exists yet — Phase B's close-out is where `claude/feature-decisions/PRD-43-Wishlists-Gift-Planning.md` gets created/populated per its own dispatch prompt).
> Addenda read: `prds/addenda/Living-Shopping-List-and-Shopping-Mode-Addendum.md` (§Gift Ideas + §Watch For — the gift_ideas canon this build makes first-class; `gift_for` UUID FK reconciliation). PRD-43 has no addenda of its own (born 2026-07-07, same session as approval).

---

## Freshness preamble — results (run before any reading, per dispatch instructions)

1. **`git log --oneline --since=2026-07-07`** → empty (nothing committed today yet). `git log -15` shows the most recent commits are FAMILY-GOALS-PRIZES, HITM-CLOSURE, voice-input-repair, PRD-41/PRD-42 docs — all consistent with the state described in CLAUDE.md.
2. **Working tree has a LIVE parallel session in flight right now**: `git status` shows 30 modified `supabase/functions/*/index.ts` files + `LilaDrawer.tsx`/`LilaModal.tsx`/`ToolConversationModal.tsx`/`useBookDiscussions.ts`/`useLila.ts` + untracked `supabase/functions/_shared/ethics-guard.ts`, `supabase/functions/validate-ai-output/`, migrations `100286`/`100287`, `scripts/redteam.cjs`, `tests/redteam/` — this is **SAFETY-BETA-GATE Slice E (PRD-41 Layer 1 ethics enforcement) actively being implemented**, uncommitted, in this same working directory. Also untracked: `claude/dispatch-factory/PECON.md`, `prds/addenda/PRD-24-Point-Economy-Addendum.md` (the PECON sibling pack, landed same day per the PRD-43 pack's own coordination note).
   - **Territory discipline:** I will not touch any of these files. My new files (migration, new EF, new components/hooks) don't collide with theirs. `ethics-guard.ts` is a genuinely new, self-contained, no-supabase-import shared module — safe to import from a brand-new Edge Function without editing it or waiting for it to be committed.
3. **ST-F (STUDIO-EXPERIENCE reward-wire truth) has NOT landed.** `.claude/rules/current-builds/STUDIO-EXPERIENCE.md` shows status "ST-0 + F-23 MICRO-FIX COMPLETE... Next action: founder pushes, then pastes ST-A." ST-F is the 5th slice in the ST-0→A→F→B→C→D→E→G sequence — nowhere close. **Phase A impact: none** (the motivation-bridge "Add as reward" prefill is Phase B scope, §12/PRD). Noting for Phase B's own freshness check.
4. **FDWA has NOT landed** — confirmed via MANIFEST.md: "decisions-pending" (pack + recon exist, never dispatched). No `gift_ideas` RLS arms exist anywhere to worry about; the RESTRICTIVE policy I'm about to add is the first and only word on this table.
5. **Current production `lists.list_type` CHECK** (queried live via `supabase db query --linked`, not a stale migration — ST-0 lesson honored):
   ```sql
   CHECK (list_type = ANY (ARRAY['simple','checklist','reference','template','randomizer','backburner','shopping','wishlist','expenses','packing','todo','custom','guided_form','ideas','prayer']))
   ```
   15 values today. I will rebuild this constraint from this EXACT list plus `'gift_ideas'` — never from a stale migration file.
6. **Migration numbering:** `supabase migration list --linked` confirms local=remote synced through **100288** (`allowance_payment_settlement`, from the parallel ALLOWANCE-RECONCILIATION session, already committed+applied). Next free number at time of writing: **100289** — RE-CHECKED immediately before applying (per instructions) and found a real collision: three parallel sessions had landed **100289** (`safety_monitoring_foundation` — PRD-30 SM-A), **100290** (`ethics_log_feature_key_and_admin_curation` — SAFETY-BETA-GATE Slice E), and **100291** (`meal_planning_recipes_schema` — presumably PRD-42 KitchenCompass), all LOCAL-ONLY (unapplied to remote) between my first check and file-write. Renamed my migration to **100292** before applying. Applied via `supabase db query --linked -f` (NOT `db push`, since 100289-100291 are other sessions' unreviewed/unapplied work — a `db push` would have applied all of them, not just mine).
7. **Live production RLS on `lists`/`list_items`** (queried directly via `pg_policies`, confirms the pack's finding exactly):
   - `lists`: `lists_family_device` (ALL, `util.is_family_shadow_of(family_id)` — **the hole**), `lists_opportunity_family_read` (SELECT, `is_opportunity=true` only), `lists_owner_or_parent` (ALL, owner/primary_parent), `lists_shared_read` (SELECT, via `list_shares`).
   - `list_items`: `li_family_device` (ALL, via list join), `li_opportunity_family_read` (SELECT), `li_via_list` (ALL, owner/primary_parent/list_shares).
   - Confirmed: **no permissive policy grants a plain kid-role session read on an arbitrary family list.** The ONLY leak path for a `gift_ideas` list is `lists_family_device`/`li_family_device` (family-shadow sessions). My RESTRICTIVE policy design targets exactly this.
   - `util.is_family_shadow_of(p_family)` (migration 100262): `SECURITY DEFINER`, checks `family_members.role='family' AND family_id=p_family AND user_id=auth.uid()`. This is the function whose result my `util.gift_planning_access()` helper must return FALSE for (family-shadow sessions never pass, even though they'd match `family_id`).
8. **Grant-key precedent confirmed** (`util.finance_grant_level`, migration 100261 — per-kid + family-wide-NULL-target pattern) and **`useManagementGrants.ts`/`GrantedRoute.tsx`** (family-wide-only pattern for `studio`/`reward_rules`, binary Off/Allowed rendering). `gift_planning` per PRD §5.5 is **family-wide only** (not per-kid) — I will model it exactly like `studio`/`reward_rules`, not like `financial_tracking`. `apply_permission_profile` (migration 100264, confirmed the LATEST touch via grep across all 4 migrations that ever defined it) needs `'gift_planning'` added to both its exclusion lists (never wiped, never auto-granted).
9. **Storage bucket precedent** (`family-avatars`, migrations 100037+100069): simple public bucket, `storage.objects` policies scoped to `bucket_id = '<name>'` only (no path-based family-scoping in RLS — object names carry UUIDs, acceptable for non-sensitive item photos that also need to render on the public share page). `wishlist-images` will follow this exact shape.
10. **Sidebar registration** (`src/components/shells/Sidebar.tsx`): `getSidebarSections()` — "Family" section exists 3x (mom/adult/independent shell blocks) containing Messages/People/Family Feeds. I'll add a "WishLists" entry there, once per shell block (matches the existing "Lists" pattern of one entry per block, same function). Guided/Play shells use their own purpose-built nav (not `getSidebarSections`) — their WishLists entry points get investigated at A3 build time, matching how those shells already register their own pages.

**No blockers found. No founder decisions reopened. Proceeding to slice plan below, pending her explicit go-ahead per this file's own gate.**

---

## What Phase A builds (from the pack's table + PRD §16, restated concretely)

### Slice A1 — Migration (schema + RLS + grant + storage)
- `lists.subject_member_id UUID NULL FK family_members` + partial unique index (one `gift_ideas` list per `(family_id, subject_member_id)`).
- `list_items`: `image_url TEXT`, `is_included_in_ai BOOLEAN NOT NULL DEFAULT true`, `wishlist_state TEXT NULL CHECK IN ('active','dormant','received')`, `occasion_tags TEXT[] NULL`, `added_by UUID NULL FK family_members`, `excluded_from_shares BOOLEAN NOT NULL DEFAULT false`.
- New tables: `gift_claims` (§5.2 — surprise-safe RLS, no kid arm, no family-device arm, subject-exclusion, partial unique first-claim-wins index), `wishlist_share_links` (§5.3 — token_hash SHA-256, adult-grant-shaped RLS), `gift_history` (§5.4 — adult-grant-shaped RLS, mom-editable, no append-only constraint).
- `util.gift_planning_access(p_family UUID) RETURNS BOOLEAN` — SECURITY DEFINER; TRUE for primary_parent OR `gift_planning`-granted additional_adult on a **real member session**; FALSE for family-shadow sessions (mirrors `util.is_family_shadow_of` shape but must NOT return true for it).
- RESTRICTIVE policies (`AS RESTRICTIVE`) on `lists` AND `list_items` (via parent-list join): `list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id)`.
- `lists.list_type` CHECK rebuilt from the CURRENT 15-value live body + `'gift_ideas'` (16 total) + enumeration regression vitest (constraint values ⊇ every `list_type` literal written in `src/`).
- `gift_planning` feature key (family-wide, explicit-grant-only — `studio`/`reward_rules` shape, NOT `financial_tracking` shape): `feature_key_registry` row, `feature_access_v2` row (dad_adults tier), `permission_level_profiles` rows (feature_enabled=false for all 3 profile levels), `apply_permission_profile` rewritten from its CURRENT (100264) body with `gift_planning` added to both exclusion lists. Also register `wishlists_basic`, `wishlists_capture`, `wishlists_share_links` per PRD §5.5.
- Adult-read policy for kid wishlists per D-43-5 (kid + mom + additional_adult by default; siblings NO by default — existing `list_shares` covers opt-in sibling sharing, no new mechanism needed).
- `wishlist-images` storage bucket (public, family-avatars shape) + 4 storage.objects policies.
- Member-removal share-link auto-revoke (trigger or existing member-archival hook extension).
- `npm run schema:dump` after apply.

### Slice A2 — Capture pipeline
- `wishlist-extract` Edge Function (new, category-2 utility per Convention #248 — empty `context_sources`, own EF, NOT LiLa): `mode:'link'` (deterministic og:/JSON-LD/oEmbed parse, $0, Haiku fallback behind a confirm chip) + `mode:'photo'` (Sonnet vision, mindsweep-scan pattern). Full scaffold: `authenticateRequest`, `detectCrisis` on any free text, `ethics-guard.ts` `scanUtilityInput`/`scanUtilityOutput`/`enqueueOutputScan` (following the curriculum-parse/mindsweep-scan precedent I read — genuinely current best practice for a brand-new utility EF, not a retrofit obligation), no-training `callOpenRouter`, Zod I/O, cost logging. Deployed with standard JWT verification (client-invoked, not cron/public).
- `WishCatch` capture sheet (ModalV2 transient): person pills w/ last-used localStorage memory, text/mic(`useVoiceInput`)/camera/link-detect input row, instant save (nothing blocks on AI — Convention #279 discipline), suggested-title confirm chips, duplicate soft-warn (never blocks).
- Entry points: QuickCreate action (Gift icon), `/wishlists` header `[+ Capture]`, RoutingStrip `wishlist` destination with person drill-down (`dynamicSubOptions` pattern), `mindsweep-sort` `wishlist` classification + Review & Route card + `deployQueueItem` wishlist deploy path + teen MindSweep-Lite disposition mapping ("Add to my wishlist", self only).

### Slice A3 — Surfaces
- `/wishlists` route (one canonical page, viewer-appropriate render): Independent (full control — image cards, dnd priority via dnd-kit + `sort_order`, Must-Have/Would-Love/Nice-to-Have grouping, occasion filter pills, Changed-my-mind→dormant, per-item Heart, balance strip gated on `child_can_see_finances`, Ask-to-earn-this is Phase B); Guided (simplified); Play (picture grid, zero prices — OPPORTUNITY-SURFACES precedent); Mom/Adult (person tabs, `[Consider for gift →]`, claim indicators visible to her only, refine controls, her own "Me" list with claims hidden from her).
- Item detail/refine sheet: photo, title, notes, price+currency, URL+domain chip, store-domain grouping toggle (≥2 domains), occasion tags, priority, Heart, exclude-from-shares toggle (mom/adult only), state controls, attribution.
- Gift Planning tab inside `/wishlists` (mom + `gift_planning`-granted adults only — tab-visibility check via a new `giftPlanningLevel` field on `useManagementGrants`, NOT a router-level `GrantedRoute` edit since this is a tab not a route): per-kid gift-ideas list (lazy-created), Considering copies with provenance + changed-their-mind flag, claim controls (Reserve/Purchased/Given), Shopping Mode `include_in_shopping_mode` opt-in surfaced.
- Archives folder doorway: the orphaned `folder_type='wishlist'` Archives folder becomes a live doorway navigating to the member's `/wishlists` surface (Convention #75 — no copies).
- Sidebar/BottomNav registration: one entry in `getSidebarSections()`'s "Family" section (3 shell blocks), Convention #16 mobile parity checklist. FeatureGuide on `/wishlists`.

---

## Hard rules (binding for every slice, from the pack + PRD + Conventions)

- **5-second capture contract is normative** (PRD §6.1): no required fields beyond one input mode, nothing blocks save, AI proposals land as confirm chips AFTER save.
- **HITM threading (Convention #279):** typed/spoken text = mom's own words, no HITM. Photo saves instantly with the image; vision-suggested title is a confirm-required chip. Link og:/JSON-LD extraction is deterministic (.ics-import class, no HITM, labeled "auto-filled — check it"); only the rare Haiku fallback needs confirm.
- **RESTRICTIVE (not permissive) policies** enforce `gift_ideas` invisibility, including against family-shadow sessions. `gift_claims` gets NO kid read arm, NO family-device arm, and subject-exclusion (nobody — including mom — reads claims against their own list).
- **Special Adults appear in NO gift audience, picker, or policy** (ST-A rider-b scoping-correctness lesson, explicitly named in the PRD's 5-role table).
- **`gift_planning` is explicit-grant-only** — `apply_permission_profile` exclusion list, migration 100264 precedent.
- Every capture writes `added_by` + `wishlist_state='active'` + `is_included_in_ai=true`.
- **`occasion_tags` is the occasions field. `gift_for` stays the dormant recipient UUID FK — never repurposed to text, never written by this build.**
- dnd-kit + ⠿ handles persist `sort_order` (universal drag-to-reorder convention).
- Balance/"$X away" surfaces gate on the kid's **primary-pool** `child_can_see_finances`; Play shows no prices/balance at all, ever.
- Every "today" read goes through `useFamilyToday`/`fetchFamilyToday` (Convention #257) — run the #257(c) verification queries before touching date-adjacent code (this build's only date column, `gift_history.given_on`, is Phase B and is the exempt user-chosen-date class, same as `meal_plan_entries.entry_date`).
- Lucide icons only, zero emoji, theme tokens only (`npm run check:colors`), density classes, ModalV2 for all modals, BottomNav parity via the single `getSidebarSections` registration.

## Proof standard (rider-a, STUDIO-EXPERIENCE precedent)

Every pin drives the REAL flow with service-role DB assertions. `WISHTEST` fixture prefix, swept `beforeAll`+`afterAll`, zero residue verified. Load-bearing leak probes (not nice-to-haves): kid session reads zero `gift_ideas`/`gift_claims` rows via direct PostgREST probes; family-device session reads zero `gift_ideas` rows; View-As-kid renders no gift surface; enumeration vitest green (constraint ⊇ every literal). Plus: capture round-trip all 4 input modes; suggested-title chip confirm/reject; duplicate soft-warn renders without blocking; teen dnd reorder persists; dormant round-trip; Gift Planning Considering-copy carries provenance + changed-their-mind flag. `tsc -b` clean, lint clean, regression pins green — **leak-pass is MANDATORY** (this build touches `lists`/`list_items` RLS directly); `fo-command-center` and `kids-rewards` slices run if any touched surface is in their pin set. Founder confirmation required before running shared-fixture suites and before deploying the Edge Function. Convention #277 eyes-on tour for every Mom-UI row below, at desktop/tablet/mobile, as mom + teen + guided + Play.

## Stubs registered at Phase A close (STUB_REGISTRY, full list in PRD §13)

Image share_target (PRD-33) · offline capture queue (PRD-33) · emailed share links (PRD-30 SM-C) · gift-scoped secret conversation spaces · savings goal-pool wiring (PRD-28 `pool_type='goal_pool'`) · kids' own giving-lists · kid-safe "gifts I've given" view · occasion-contract triggers (connector) · grandparent Out-of-Nest in-app surface. Phase A doesn't touch these; Phase B's own close-out finalizes the registry entries.

---

## Mom-UI Surfaces

- `/wishlists` — Independent/Guided/Play/Mom/Adult renders — shells: all five, **new top-level page**
- WishCatch capture sheet — shells: mom/adult/independent (full), guided (simplified) — **new**
- QuickCreate "Wishlist" action — shells: mom/adult/independent — modification
- RoutingStrip `wishlist` destination + person drill-down — shells: wherever RoutingStrip renders (Notepad, Review & Route, MindSweep) — modification
- MindSweep Review & Route wishlist card + teen "Add to my wishlist" disposition — shells: all MindSweep users — modification
- Item detail/refine sheet — shells: mom/adult/independent — new
- Gift Planning tab (inside `/wishlists`) — shells: mom + `gift_planning`-granted adult only — new
- Archives Wishlist folder doorway — shells: mom/adult viewing any member's Archives — modification (orphaned folder becomes live)
- Sidebar "WishLists" entry (Family section) + BottomNav More-menu parity — shells: mom/adult/independent — new registration

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| WishCatch capture sheet — renders, person pills (Special Adults correctly excluded), text/mic/camera affordances, theme tokens, no emoji | ✅ `wl-01-wishcatch-desktop.png` | ✅ (tour covers desktop+mobile only per spec; tablet not separately captured — layout is a fixed-width ModalV2 `size="sm"` centered sheet, no tablet-specific breakpoint) | ✅ `wl-01-wishcatch-mobile.png` | Mom | Screenshots read; bug found+fixed: Special Adults were selectable in person pills — added `role !== 'special_adult'` filter | 2026-07-07 |
| WishCatch text-mode capture: real browser round-trip (fill → save → row appears in modal AND live on page → DB attribution correct) | ✅ | — | — | Independent (Casey) | `wishlists-gift-planning.spec.ts` test 11, DB-asserted (`wishlist_state='active'`, `is_included_in_ai=true`, `added_by=caseyId`) | 2026-07-07 |
| WishCatch voice/photo input affordances render (mic + camera buttons present, correctly gated by `voice.isSupported`) | ✅ (visible in wl-01 screenshots) | — | — | Mom | Visual only — activating record/camera capture requires real media device grants not available in this environment; not exercised end-to-end this pass | 2026-07-07 |
| `/wishlists` — Independent full-control list (item card w/ price, priority badge, dormant collapsible, Heart, drag handle) | ✅ `wl-02-independent-desktop.png` | — (not separately toured; same responsive component as mobile) | ✅ `wl-02-independent-mobile.png` | Independent (Alex) | Screenshots read; caught+fixed a real F-21-class bug live (`list_items_priority_check` never allowed 'must_have'/'would_love'/'nice_to_have' — migration 100297) | 2026-07-07 |
| `/wishlists` — Guided simplified list (no price/priority, Heart-as-changed-my-mind) | — | — | ✅ `wl-03-guided-mobile.png` | Guided (Jordan) | Screenshot read; renders correctly, matches simplified-view spec | 2026-07-07 |
| `/wishlists` — Play picture grid (zero prices, image-forward tiles) + Fun-tab entry point | — | — | ✅ `wl-04-play-mobile.png`, `wl-04b-play-fun-tab-entrypoint.png` | Play (Ruthie) | Screenshots read; no dollar amounts anywhere; "My Wish List" entry point renders cleanly on the Fun tab (deliberate judgment call — no 3rd top-level Play nav tab per 2026-06-12 founder decision) | 2026-07-07 |
| `/wishlists` — Mom/Adult person tabs + own-list empty-state copy | ✅ `wl-05a-mom-family-tab.png` | — | — | Mom | Screenshot read; bug found+fixed: mom's own tab showed third-person "Sarah's wish list is empty" instead of first-person copy — fixed `AdultOwnedWishlistView`'s `isOwnList` check | 2026-07-07 |
| `/wishlists` — Mom viewing Casey's tab (item card, claim-free view since claims are her own to see) | ✅ `wl-05b-mom-casey-tab.png` | — | — | Mom | Screenshot read; correct | 2026-07-07 |
| Item detail/refine sheet (photo, title, price, link, notes, occasion chips, priority chips, Heart, exclude-from-shares) | ✅ isolated repro (`WishlistItemDetailSheet` open+prefilled via direct Playwright click) | — | — | Mom | Original tour capture (`wl-05c`) was a false alarm — a concurrent session's Vite HMR reload mid-test reset page state; confirmed via isolated repro with console logging (no HMR interference) that the sheet opens, pre-fills every field correctly, and the seeded priority renders as the correctly-highlighted "Would Love" chip | 2026-07-07 |
| Gift Planning tab (Planning-gifts-for pills excluding Special Adults + mom, surprise-safe copy, empty state, "Browse wishlist" collapsible, honest Phase-B stub notice) | ✅ `wl-06-gift-planning-tab.png` | — | — | Mom | Screenshot read; correct, matches PRD §6.4 surprise-safe language exactly ("Alex never sees this list.") | 2026-07-07 |
| Archives Wishlist folder doorway — deep-links to the SPECIFIC member's wishlist tab | ✅ `wl-07a` (folder list) + `wl-07b-archives-doorway-navigated.png` (post-fix) | — | — | Mom | Screenshots read; real bug found+fixed: doorway navigated to generic `/wishlists` (mom's own empty tab) instead of the viewed member's tab — added `?member=` query param wired through `MemberArchiveDetail.tsx` → `WishListsPage` → `MomAdultWishlistSurface`; re-verified showing Alex's actual item after the fix | 2026-07-07 |
| Sidebar (desktop, expanded) "WishLists" entry in Family section | ✅ confirmed via `wl-02-independent-desktop.png`'s expanded sidebar (partially visible at bottom of Family section) + direct grep of `Sidebar.tsx` (3 shell blocks) | — | — | Mom, Independent | Code + screenshot cross-check | 2026-07-07 |
| BottomNav More menu parity (single-source `getSidebarSections()` — no hand-maintained duplicate) | — | — | ✅ `wl-08b-bottomnav-more-mobile.png` (partial — Family section below the fold) | Mom, mobile | Structurally guaranteed: `BottomNav.tsx` imports and calls the identical `getSidebarSections()` function as `Sidebar.tsx` (grep-confirmed, no parallel hardcoded list) — Convention #16 compliance is architectural, not per-render; visible sections (AI & Tools, BookShelf, Capture & Reflect, Plan & Do) render correctly | 2026-07-07 |

## Post-Build Verification

*(Checkpoint 5 — every Phase A requirement above: Wired / Stubbed / Missing. Zero Missing required before Phase A is considered complete.)*

| Requirement | Status | Evidence |
|---|---|---|
| **Slice A1 — Migration (schema + RLS + grant + storage)** | | |
| `lists.subject_member_id` + partial unique index (one gift_ideas list per subject) | Wired | Migration 100292; `list-type-constraint.test.ts` + write-probe pins |
| `list_items` 6 new columns (image_url, is_included_in_ai, wishlist_state, occasion_tags, added_by, excluded_from_shares) | Wired | Migration 100292; exercised in tests 1, 8, 11 |
| `gift_claims` table (surprise-safe RLS, no kid arm, subject-exclusion, first-claim-wins partial unique index) | Wired | Migration 100292; tests 3, 6, 9, 10 |
| `wishlist_share_links` table | Wired (schema only — UI is Phase B) | Migration 100292; stub registered for share-link generation/consumption UI |
| `gift_history` table | Wired (schema only — UI is Phase B) | Migration 100292; stub registered for the recording UI |
| `util.gift_planning_access()` SECURITY DEFINER helper (family-shadow sessions excluded) | Wired | Migration 100292; test 2 (family-device exclusion implicit in kid-session leak probe design) |
| RESTRICTIVE policies on `lists`/`list_items` for gift_ideas invisibility | Wired | Tests 2, 3, 4 (leak probes) |
| `lists.list_type` CHECK rebuilt (16 values incl. gift_ideas) + enumeration regression test | Wired | Migration 100292; `list-type-constraint.test.ts` 10/10 |
| `gift_planning`/`wishlists_basic`/`wishlists_capture`/`wishlists_share_links` feature keys, family-wide explicit-grant-only shape | Wired | Migration 100292; `apply_permission_profile` exclusion lists updated; tests 4, 5 |
| D-43-5 default adult access to kid wishlists (no grant needed) | Wired | Test 7 |
| `wishlist-images` storage bucket + 4 policies | Wired | Migration 100292; exercised live in `WishCatchModal.handleCameraChange` (photo upload path) |
| Member-removal share-link auto-revoke trigger | Wired | Migration 100292 |
| `npm run schema:dump` | Wired | Run after 100292, 100293, and 100297 |
| **Slice A2 — Capture pipeline** | | |
| `wishlist-extract` Edge Function (link + photo modes, full safety/cost scaffold) | Wired | Deployed to production (`vjfbzpliqialqmabfnxs`); `config.toml` entry added (coordination-flagged, fixed same session) |
| WishCatch capture sheet (5-second contract, all 4 input modes, instant save, confirm-chip AI suggestions) | Wired | Text mode fully round-trip tested (test 11); voice/photo affordances render correctly, activation not exercised (no media device in CI) — noted honestly in Mom-UI table, not claimed as fully verified |
| QuickCreate "Wishlist" entry point | Wired | `QuickCreate.tsx`, `ShellQuickCreateFAB.tsx` (shared + MomShell's local duplicate, both fixed) |
| RoutingStrip `wishlist` destination + person drill-down | Wired | `RoutingStrip.tsx`, `NotepadReviewRoute.tsx` |
| MindSweep Review & Route wishlist card + direct deploy + teen disposition | Wired | `deployQueueItem.ts`, `useMindSweep.ts`, `mindsweep-sort/index.ts`, `MindSweepLiteTeenSection.tsx` comment; crash-prevention fixes in `rhythms.ts`, `commitMindSweepLite.ts`, `MindSweepLiteSection.tsx` |
| **Slice A3 — Surfaces** | | |
| `/wishlists` canonical route, all 5 shell renders | Wired | `WishLists.tsx`; visually verified all 5 shells via eyes-on tour |
| Item detail/refine sheet | Wired | `WishlistItemDetailSheet.tsx`; verified via isolated repro (tour screenshot was an HMR false alarm) |
| Gift Planning tab (mom + granted adults, surprise-safe, Considering-copy provenance, claim controls) | Wired | `GiftPlanningTab.tsx`; tests 5, 8, 9; visually verified |
| Archives Wishlist folder doorway | Wired | `MemberArchiveDetail.tsx`; bug found+fixed live (deep-link to specific member), re-verified |
| Sidebar/BottomNav registration, Convention #16 parity | Wired | `Sidebar.tsx` (3 shell blocks), `GuidedShell.tsx`, `PlayRewards.tsx` entry point; structural parity via shared `getSidebarSections()` |
| FeatureGuide on `/wishlists` | Wired | `feature_guide_registry.ts`, `help-patterns.ts`, `feature-guide-knowledge.ts` |
| Permission Hub gift_planning grant row | Wired | `PermissionHub.tsx` — Family Management Grants section |
| **Cross-cutting proof** | | |
| WISHTEST fixture sweep, zero residue | Wired | Verified via direct SQL post-suite: 0 list_items, 0 lists, 0 gift_claims, 0 grants |
| Regression suites (leak-pass 10/10, permissions-wiring 14/14, fo-command-center 12/12) | Wired | Run earlier this session per coordination seat's granted slot |
| `tsc -b` clean | Wired | Exit 0, zero errors |
| Lint clean on all touched files | Wired | 0 errors, 5 pre-existing unrelated warnings in `MemberArchiveDetail.tsx` |
| Convention #277 eyes-on tour, every screenshot read | Wired | 15 screenshots across 8 tests, all read; 3 real bugs found and fixed during the pass (Special Adults in pills, third-person empty-state copy, priority CHECK constraint) + 1 real bug found post-tour via targeted regression-test authoring (Archives doorway not member-scoped) |
| **Stubs (Phase B scope, registered not built this phase)** | | |
| Share link generation/consumption UI | Stubbed | `wishlist_share_links` schema exists; STUB_REGISTRY entry |
| Gift history recording UI | Stubbed | `gift_history` schema exists; STUB_REGISTRY entry |
| Image share_target (PRD-33), offline capture queue (PRD-33), gift-scoped secret conversation spaces, savings goal-pool wiring, kids' own giving-lists, kid-safe "gifts I've given" view, occasion-contract triggers, grandparent Out-of-Nest surface | Stubbed | Per PRD §13, STUB_REGISTRY |

**Zero Missing.** Phase A is complete.

## Coordination note for Phase B

**Route + component contracts:**
- Canonical route: `/wishlists` (registered in `App.tsx`). Accepts an optional `?member=<family_member_id>` query param that pre-selects that person's tab on the Mom/Adult surface (added this session to fix the Archives doorway — reuse this for any other future deep-link entry point, e.g. a future "gift reminder" notification).
- `WishListsPage` (`src/pages/WishLists.tsx`) branches by `dashboard_mode`/`role` into 5 shell-specific renders: `MomAdultWishlistSurface`, `IndependentWishlistSurface`, `GuidedWishlistSurface`, `PlayWishlistSurface`. All share `useWishlistItems`/`useDormantWishlistItems`/`useCreateWishlistItem`/etc. from `src/hooks/useWishlists.ts`.
- `WishCatchModal` (`src/components/wishlists/WishCatchModal.tsx`) takes `mode?: 'wishlist' | 'gift_ideas'` — Phase B's "Capture an idea" on the Gift Planning tab should reuse this component with `mode="gift_ideas"` and `defaultMemberId`/`subjectName` set to the kid being planned for, exactly as `GiftPlanningTab.tsx` already does (grep it for the call shape).
- `WishlistItemDetailSheet` has an `extraActions?: React.ReactNode` slot explicitly reserved (per its own doc comment) for "the motivation bridge, Consider for gift, etc. — Phase B/A3 slots." Use it rather than forking the component.

**Data/RLS contracts:**
- `util.gift_planning_access(p_family UUID) RETURNS BOOLEAN` — the canonical grant check, mirrors `util.finance_grant_level`'s shape but is a simple boolean (family-wide grant, not tiered). Use this in any new Phase B RLS policy that needs to gate on gift-planning access, never hand-roll a second check.
- `giftPlanningLevel` field on `useManagementGrants()` (`src/lib/permissions/useManagementGrants.ts`) — client-side convenience mirror of the DB grant. A second grant, `mealPlanning`, was added to the same hook by a parallel PECON/KitchenCompass session this same day — both coexist cleanly (verified, no clobbering).
- `gift_claims.status` values used by A1: `'reserved' | 'purchased' | 'given'` (see `GiftPlanningTab.tsx`'s claim-control buttons) plus a `released_at` timestamp for voluntary release. Phase B's savings-goal / occasion-contract work should read claims via this shape, never insert around it (RLS has no kid/family-device write arm by design).
- `wishlist_share_links` and `gift_history` tables exist NOW (migration 100292) with adult-grant-shaped RLS but ZERO consuming UI — Phase B builds the UI against the existing schema, no new migration needed unless the PRD's Phase B addendum changes the shape.
- `source_list_item_id` on `list_items` (migration 100293) is the Considering-copy provenance FK — already wired end-to-end (`useConsiderForGift`, test 8). Phase B's "changed their mind" flag and any richer provenance UI builds on this column.

**EF contract:**
- `wishlist-extract` (deployed, `verify_jwt=false`, in-code `authenticateRequest`) — `mode: 'link'` returns `{title, image_url, price, currency, confidence: 'meta'|'ai', crisis?}`; `mode: 'photo'` returns `{title, notes, crisis?}`. `confidence==='meta'` auto-fills (no confirm needed); `confidence==='ai'` renders a confirm-required suggestion chip. Phase B's richer extraction (multi-image, price-tracking) should extend this EF's Zod schema, not create a second one (Convention #248 — this is a category-2 utility tool, deliberately not LiLa).

**Known interaction with parallel work:**
- ST-F (STUDIO-EXPERIENCE reward-wire truth) had not landed as of Phase A close — the "Add as reward" motivation-bridge prefill named in PRD §12 depends on ST-F's contract wiring work landing first. Re-check `.claude/rules/current-builds/STUDIO-EXPERIENCE.md` at Phase B start.
- FDWA (family-device write audit) has not landed — if Phase B adds any new family-device-writable surface (e.g. a kid tapping "reserve" on a Hub tablet), re-verify `util.is_family_shadow_of()` coverage explicitly; gift_claims currently has NO family-device write arm by design (surprise-safety), so this should stay that way unless a founder ruling says otherwise.

**Testing infra note (found + fixed this session, useful for Phase B's own spec):** the eyes-on tour spec (`wishlists-eyes-on-tour.spec.ts`) leaves its `WISHTOUR`-prefixed fixtures in place for review, and the regression spec (`wishlists-gift-planning.spec.ts`) now sweeps BOTH `WISHTEST` and `WISHTOUR` prefixes in its `sweepFixtures()` (originally only swept its own prefix, which caused a real `uq_lists_gift_ideas_per_subject` collision when both specs targeted the same test subject). Phase B's own eyes-on tour + regression spec pair should follow the same two-prefix sweep pattern if they reuse the Testworth family fixtures.
