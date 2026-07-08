# Active Build: PRD-42 — KitchenCompass (Meal Planning), Phase A

> **Status: CODE COMPLETE + DEPLOYED — 0 Missing, all A1/A2/A3 requirements Wired, `recipe-extract` deployed + live-verified 2026-07-07. Holding for the coordination seat's tree-wide "BATCH PASS — GO" relay before running shared regression suites; commit rides the same tree-wide batch (selective staging, this build's files only).**
> Worker: Sonnet 5 implementation worker, dispatched directly (per `.claude/rules/model-routing.md`).
> Authority chain: `prds/daily-life/PRD-42-Meal-Planning.md` (full PRD, read in full 2026-07-07) → `claude/dispatch-factory/PRD42.md` (13 reconciliation rulings — LAW) → this file (Phase A build scope).
> Display name: **KitchenCompass**. All keys/routes stay `meals_*` / `/meals` regardless of any future display-name change.
> Migration discipline: next FREE number confirmed **100289** at file-creation time (local=remote verified through 100288 via `supabase migration list --linked`). Will re-check immediately before applying — parallel sessions are actively landing migrations.

---

## Freshness preamble (run before founder confirmation, per dispatch instructions)

- `git log --oneline --since=2026-07-06`: 10 commits since the pack was produced — SAFETY-BETA-GATE gate closure, dates/streak fix, STUDIO-EXPERIENCE ST-0 hotfix, KIDS-REWARDS Slice 5 close-out, NOTRAIN-HARDEN, Family Goals & Prizes ship, HITM-CLOSURE, voice-input repair, Convention #278/#279 registration, and an allowance-settlement fix. None of these touch meal planning, recipes, or `mindsweep-sort`'s recipe branch.
- **CLAUDE.md conventions added since pack production:** #278 (Family Goals engine — not applicable here; explicit note in PRD42 pack that FGPZ territory is untouched) and #279 (HITM Applicability & Declared Exceptions — directly applicable: recipe capture review IS a persisting-AI-output HITM gate per Convention #4/#279, no exception needed, built as designed).
- **FDWA (family-shadow write pattern) has NOT landed** — confirmed via `claude/dispatch-factory/MANIFEST.md` (still "decisions-pending"). Per the pack's own fallback instruction: follow migration `00000000100262`'s precedent (`util.is_family_shadow_of()` pattern from RR-DEPLOY-SCOPING) for the two family-shadow policies this build needs (`meal_feedback` INSERT, `meal_plan_entries` UPDATE status-only). Leaving a coordination note for FDWA at close-out.
- **ST-E (tracker widget canonical categories) has NOT landed** — confirmed via `.claude/rules/current-builds/STUDIO-EXPERIENCE.md` (only ST-0 hotfix shipped; ST-A through ST-G undispatched). Not a Phase A blocker: the `meal_plan` dashboard widget is explicitly **Phase B scope** (§6.10, slice B3), so Phase A never touches `WidgetPicker.tsx` or `widget_starter_configs`. Current canonical category keys (8, snake_case: `routine_trackers`, `goal_pursuit`, `progress_visualizers`, `reward_allowance`, `achievement_recognition`, `reflection_insight`, `family_social`, `skill_tracking`) noted for whoever builds B3.
- **`mindsweep-sort`'s recipe dual-route metadata reverified** at the exact cited location — line 426 today: `...(r.category === 'recipe' ? { destination_detail: { dual_route: true, recipe_to: 'archives', ingredients_to: 'list' } } : {})`. Confirmed stale per ruling 1; `destination: 'recipe'` (the actual `studio_queue.destination` value, set via the `CATEGORY_TO_DESTINATION`-style map at line 100) is already correct and already skipped (never half-created) by `deployQueueItem.ts`'s `default` branch — so the only thing broken is the auxiliary `recipe_to` label. **Coordination flag:** `supabase/functions/mindsweep-sort/index.ts` currently has substantial UNCOMMITTED changes from a parallel session (SAFETY-BETA-GATE Slice E, adding `ethics-guard` imports — confirmed via `git status`). My edit to this file will be a single-line value change (`recipe_to: 'archives'` → `recipe_to: 'recipes'`) layered on top of their in-progress edit. At commit time I will stage ONLY my hunk (patch-level), never the whole file, to avoid committing someone else's in-flight work under my name.
- **Working tree has ~59 pending changes from parallel sessions** (SAFETY-BETA-GATE Slice E ethics-enforcement rollout across ~30 Edge Functions, PRD-43 dispatch-pack docs, MANIFEST/RSTP doc updates). None overlap Phase A's file set except the one `mindsweep-sort` line above. Selective staging of only my own files at commit time; will not touch any Edge Function outside `recipe-extract` (new) and the one-line `mindsweep-sort` metadata fix.

---

## Source material read (this session, in full)

- `prds/daily-life/PRD-42-Meal-Planning.md` — full PRD, every section (§1–§14).
- `claude/dispatch-factory/PRD42.md` — the 13 reconciliation rulings (LAW) + slice plan + founder decision table + dispatch prompts.
- CLAUDE.md (baked into session context) — Conventions #4, #7, #8, #16, #55, #75, #76, #98, #143, #223, #227, #247, #248, #256, #257, #271, #274, #276, #277, #279 all directly bear on this build; cross-checked each against the PRD text (all consistent, no drift found).
- `claude/live_schema.md` — confirmed none of the 7 new tables exist yet; confirmed `recipe` is not currently a `list_type`/table anywhere.
- Live code: `supabase/functions/mindsweep-sort/index.ts` (recipe classification + dual-route metadata), `src/lib/queue/deployQueueItem.ts` (confirms recipe skip contract), `supabase/functions/_shared/{auth,crisis-detection,openrouter-client,safety-preamble}.ts` (all exist, will be reused verbatim), `supabase/migrations/00000000100069_create_family_avatars_bucket.sql` (storage bucket pattern), `src/components/shells/Sidebar.tsx` (sidebar registration pattern — Plan & Do section, alongside Touch Base/Calendar/Trackers), `src/components/widgets/WidgetPicker.tsx` (confirmed current 8-key category scheme, not touched by Phase A).

No PRD-42-specific addenda exist beyond the dispatch pack itself (the pack IS the addendum — authored same session as the PRD, per the pack's own header). `prds/addenda/PRD-Audit-Readiness-Addendum.md`, PRD-35 scheduler addenda, and PRD-31 permission-matrix addenda were checked for scheduling/permission-relevant rulings — none conflict with PRD-42 §5/§7/§8.

---

## Founder gate — MUST be confirmed before any code (dispatch pack D-42-8)

> **D-42-8 (v1 scope):** the founder's original reply trailed off at item 8 with no objection — she endorsed the differentiator list ("I love all the suggestions. Especially the dinner conversation prompts") but never typed an explicit yes/no on the scope question itself. The pack marks this "inferred approved" and explicitly assigns the Phase A worker to re-confirm before writing code.
>
> **The scope being confirmed:** ship KitchenCompass in **two v1 build phases** —
> - **Phase A (this dispatch):** Recipe Box, capture (link/photo/paste/went-well), scaling + saved versions, This Week plan (week/day/month + drag-drop), **Cook View + Family Pointers** (the D-42-6 "how WE do it" rider), send-to-shopping-list, Food Profiles (allergies/restrictions + Archives preferences quick-add), SortTab Recipe card, sidebar registration.
> - **Phase B (separate future dispatch):** the suggestion engine (Favorites/Traditions/Try Something New + the "Use it up" box), the `meal_planning` LiLa mode, Family Hub "What's for Dinner" section + kid/Play surfaces, theme nights + prep reminders, and the full E2E/close-out pass.
> - **Phase C (its own future pre-build, blocked on founder ops):** Instacart/Walmart grocery-cart export — needs the founder to sign up for the Instacart Developer Platform + Walmart affiliate program first.
>
> Everything else in the pack (D-42-1 through D-42-7) is already resolved and folded into the PRD text — those are NOT being re-asked.

---

## Phase A build plan (slices A1 → A2 → A3, per the pack)

**A1 — Schema:** `recipes`, `recipe_versions`, `meal_plan_entries`, `food_restrictions`, `meal_feedback`, `meal_pointers`, `meal_settings` + RLS (incl. teen `suggested` WITH CHECK, family-shadow policies via the 100262 precedent, append-only `meal_feedback`, family-readable `meal_pointers`) + embedding trigger on `recipes` + `embed` TABLE_CONFIG entry + `match_recipes` RPC + `recipe-photos` storage bucket + feature keys (`meals_basic`, `meals_ai_capture`) registered in `feature_key_registry`/`feature_access_v2` + `claude/live_schema.md` DOMAIN_ORDER entry.

**A2 — Capture + Recipe Box:** `recipe-extract` Edge Function (modes: `link`/`photo`/`paste`/`went_well`/`scale_assist`; full SAFETY-BETA-GATE scaffold — `authenticateRequest`, `detectCrisis` on free text, `buildSafetyPreamble` on prompt builders, shared no-training OpenRouter client, cost logging to `ai_usage_tracking`) + Recipe Capture modal (4 tiles incl. voice via the already-repaired `useVoiceInput`) + HITM review card (Convention #4: Edit/Approve/Regenerate/Reject, nothing persists pre-Approve) + Recipe Box page (keyword + semantic search via `match_recipes`, filter chips, sort, empty states) + Recipe Detail (scaling stepper client-side math + `scale_assist` escape hatch, saved versions, rotation dial, hearts strip w/ `is_included_in_ai` summary line, tradition/texture chips, **Family Pointers section** with mic-addable notes).

**A3 — Plan + Cook View + Shopping + Profiles:** This Week plan surface (week/day/month views, dnd-kit drag-drop with ⠿ handles, busy-evening flags from `calendar_events`, entry sheet), **Cook View** (big-type step-through, pointers interleaved, scaled quantities, in-the-moment mic pointer capture), mark-made follow-up strip (leftovers/kids-helped/homeschool-minutes prompt/victory hook), send-to-shopping-list merge review (dynamic serving scaling, `store_category`, "already have it" toggles → existing `list_items` hooks), Food Profiles screen (restrictions editor + Archives preferences quick-add + mom-only free-text steer fields), allergen warning banners (warn, never block), SortTab Recipe card (queue wiring + the one-line `mindsweep-sort` metadata fix), sidebar registration under Plan & Do (mom/adult/independent shells) + BottomNav parity check.

## Hard rules carried into every slice

- HITM review card before ANY extracted recipe persists — nothing writes to `recipes` before Approve.
- Scaling is pure client-side math; `scale_assist` is an OPTIONAL single Haiku call, itself HITM-reviewed, never automatic.
- `food_restrictions` has **no `is_included_in_ai` column** — always-include inversion (D-42-4); editor copy states plainly it can't be turned off. This becomes a new numbered CLAUDE.md convention at Phase B close-out (Phase A just builds the correct schema/behavior; the convention doc entry is a Phase B task per the pack).
- `meal_feedback.feedback` CHECK allows only `'loved' | 'liked'` — celebration-only enforced at the schema layer, not just the UI.
- Allergen banners **warn, never block** — mom decides.
- No calorie/macro UI anywhere. The only nutrition surface in the whole PRD is the mom-only `nutrition_direction` free-text field in Food Profiles — Phase A builds the column and the editor; it is never rendered on any kid surface (there are no kid-facing meal surfaces in Phase A at all — those are Phase B/§6.11).
- `meal_pointers`: family-**readable** by every role, mom/grant-**editable**, CHECK exactly-one-of `recipe_id`/`technique_tag`.
- Teen recipe inserts forced to `approval_status='suggested'` at the RLS WITH CHECK layer, not just client-side.
- Every "today/tonight" read routes through `useFamilyToday`/`fetchFamilyToday` (Convention #257); `meal_plan_entries.entry_date` itself is EXEMPT from trigger derivation (it's a future-facing planning date, not "today") — confirmed via the pack's ruling 4 and PRD §5.3/§9.9.
- Lucide only, zero emoji, theme tokens only (`npm run check:colors`), density classes (`density-compact` browse / `density-comfortable` capture), ModalV2 for all modals, dnd-kit with ⠿ handles, BottomNav parity via the single `getSidebarSections` registration (Convention #16 checklist).
- `meal_planning` LiLa mode and `meal-suggest` EF are explicitly **Phase B** — Phase A does not touch `lila_guided_modes` or the context-assembler.

## Stubs registered this phase (full list finalizes at Phase B close-out per the pack §13)

Suggestion engine (Favorites/Traditions/Try Something New/"Use it up" box) · `meal_planning` LiLa mode · Family Hub `family_meals` section · Guided/Play/teen dashboard surfaces · `meal_plan` dashboard widget · theme nights (`meal_patterns`) · prep reminders · budget estimate · Instacart/Walmart export (Phase C) · fridge-scan camera PEC · Family Cookbook export PEC · pantry inventory PEC · `family_moments` photo routing (PRD-37) · homeschool compliance reporting surfacing (PRD-28B) · Special Adult shift-meals view (SAEX).

## Dependency/coordination notes

- Depends on (all built, verified live): PRD-09B shopping (`list_items`, `store_category`), Archives (`archive_context_items` Preferences folder), Calendar (`calendar_events`, `calendar_settings.week_start_day`), Universal Scheduler (Phase B only), Family Hub (Phase B only), MindSweep/Queue (`mindsweep-sort`, `studio_queue`, `deployQueueItem.ts`), `embed` pipeline, `whisper-transcribe`/`useVoiceInput` (already repaired 2026-07-07, commit `ff7c566`).
- Coordinate: FDWA (not landed — using 100262 precedent, flagged for whoever builds FDWA to reconcile), mindsweep-sort (one-line change, patch-staged to avoid clobbering the parallel SAFETY-BETA-GATE Slice E edit).
- No upstream blockers for Phase A.

## Mom-UI Surfaces (Phase A)

- `/meals` — This Week tab (default) + Recipe Box tab — shells: mom, adult, independent (read + own-cook + suggest-recipe); new top-level page, sidebar + BottomNav registration required (Convention #16).
- Recipe Capture modal (4 tiles + HITM review card) — shells: mom, adult, independent; new.
- Recipe Detail (scaling, versions, rotation dial, hearts, Family Pointers) — shells: mom, adult (independent read + own-suggested-edit); new.
- Cook View (entry sheet → big-type step-through) — shells: mom, adult, independent (as assigned cook); new.
- Entry sheet (assign cook, mark made, kids-helped, notes) — shells: mom, adult; new.
- Send-to-shopping-list merge review — shells: mom, adult (with `meal_planning` grant); new.
- Food Profiles screen — shells: mom, adult (with grant); new.
- SortTab Recipe card — shells: mom (Queue tab is mom-only per Convention #66/#146); modification to existing SortTab.

No Guided/Play/kid-facing surfaces in Phase A (those are §6.11, Phase B scope).

## Mom-UI Verification

*(Claude-driven per Convention #277 — `tests/e2e/features/meal-planning-eyes-on-tour.spec.ts`, EYES_ON_TOUR=1, 26 screenshots in `eyes-on-tour/meal-*.png`, all read directly.)*

**Real defect found and fixed during this pass:** the first tour run (24 shots) surfaced visible bleed-through/ghosting in Cook View — the EntrySheetModal underneath was showing through the "opaque" Cook View panel. Root cause: all 9 meal-planning components used `var(--color-bg)`, a CSS custom property that **does not exist** in `ThemeProvider.tsx` (only `--color-bg-primary/secondary/tertiary/card/nav/input` are set), so every one of those backgrounds silently rendered transparent. This is exactly the class of defect Convention #277 exists to catch — it was invisible to `tsc`/lint/the functional Playwright suite and would have shipped. Fixed all 21 occurrences across `CookViewModal`, `EntrySheetModal`, `RecipeDetailModal`, `FoodProfilesModal`, `SendToShoppingListModal`, `AddEntryModal`, `AddToPlanModal`, `ThisWeekPlan`, `RecipeBox` — mapped to the correct existing tokens (`--color-bg-card` for modal panels, `--color-bg-primary` for the Cook View full-screen takeover, `--color-bg-secondary` for nested inputs/popovers/badges), matching the pattern already used correctly elsewhere in the same files and by `ModalV2.tsx`. Re-ran `tsc -b` (clean), the full functional E2E suite (10/10 still green — confirms this was CSS-only, no DOM/behavior change), and the full tour a second time; all 24 shots re-verified clean below. Also added 2 new tour tests for the Convention #16 mobile/desktop nav parity check (shots 09–11), which had not yet been visually exercised.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Recipe Capture (4 tiles) + HITM review | ✅ clean 4-tile modal (Link/Photo/Paste/This Went Well), correct icons/copy | not separately shot (same responsive modal as recipe detail — confirmed via tablet detail shot) | ✅ modal readable, tiles stack correctly | Mom | `meal-02-capture-tiles-{desktop,mobile}` | 2026-07-07 |
| Recipe Box (search/filter/empty states) | ✅ search bar, 5 filter chips, populated card renders correctly | ✅ same layout, responsive width | ✅ stacks correctly above BottomNav, FAB doesn't overlap | Mom | `meal-01-recipe-box-{desktop,tablet,mobile}` | 2026-07-07 |
| Recipe Detail (scaling/versions/pointers) | ✅ **post-fix**: solid white card, no bleed-through; scale stepper (0.5×–4×+custom), "Smooth these with AI" scale_assist hint on non-1× scale, ingredients w/ "(discrete item)" scaling notes, Family Pointers section w/ mic-addable input, explanatory copy on pointer visibility | ✅ same, responsive | not separately shot (desktop/mobile bracket the range) | Mom | `meal-03/04-recipe-detail{,-scaled}-{desktop,tablet}` | 2026-07-07 |
| This Week (week/day/month + drag-drop) | ✅ week grid Sun–Sat, view switcher (list/week/month), Today button, date-jump, seeded entry highlighted on its day, "Send to shopping list" button | ✅ same grid, correctly narrows | ✅ single-column responsive stack, entry visible | Mom | `meal-05-this-week-{desktop,tablet,mobile}` | 2026-07-07 |
| Cook View | ✅ **post-fix**: solid full-screen white/primary-bg takeover (was: transparent, showing EntrySheetModal ghosted underneath), "How We Do It" recipe pointer card, scaled ingredients "(for 4)", "Step 1 of 3" big-type instruction, prev/next nav, mic-addable "Add a pointer for next time" | ✅ same, correctly scaled | ✅ same, full-width mobile layout, close button reachable | Mom | `meal-07-cook-view-{desktop,tablet,mobile}` (both pre-fix broken + post-fix clean captured) | 2026-07-07 |
| Entry sheet + mark-made follow-up | ✅ **post-fix**: solid white card, View recipe/Cook this buttons, Servings input, Who's-cooking + Kids-helped member pill selectors (correct member colors), Notes, Mark made/Didn't happen, Remove from plan | ✅ same, responsive | ✅ same, scrolls correctly within viewport | Mom | `meal-06-entry-sheet-{desktop,tablet,mobile}` | 2026-07-07 |
| Send-to-shopping-list merge review | ✅ verified via functional E2E test 5 (DB-asserted: scaled quantities + store_category written correctly); not separately toured (same modal-panel pattern as Recipe Detail/Entry Sheet, same fix applied) | — | — | Mom | `meal-planning.spec.ts` test 5 (DB assertion) | 2026-07-07 |
| Food Profiles | ✅ **post-fix**: solid white modal, "Start with allergies" banner, Whole-family/per-member cards (colored borders match member colors), always-include Restrictions copy ("can't be turned off"), Loves/Not-a-fan-of quick-add columns | ✅ same, responsive | ✅ same, cards stack, scrollable | Mom | `meal-08-food-profiles-{desktop,tablet,mobile}` | 2026-07-07 |
| SortTab Recipe card | ✅ verified via functional E2E test 9 (DB-asserted: queue card opens RecipeCaptureModal prefilled with content); not separately toured (SortTab is a Queue-modal surface, out of the page-tour flow) | — | — | Mom | `meal-planning.spec.ts` test 9 (DB assertion) | 2026-07-07 |
| Sidebar/BottomNav parity (Convention #16) | ✅ desktop sidebar: "KitchenCompass" (ChefHat icon) in **Plan & Do** section, immediately after Touch Base | N/A (parity check is desktop-vs-mobile only) | ✅ More menu: same label, same icon, same section ("PLAN & DO"), same position after Touch Base; tap-through correctly routes to `/meals` and lands on This Week tab | Mom | `meal-11-desktop-sidebar-parity`, `meal-09-more-menu-mobile`, `meal-10-more-menu-routed-mobile` | 2026-07-07 |

## Post-Build Verification

*(Checkpoint 5 — every A1/A2/A3 requirement: Wired / Stubbed / Missing. Zero Missing required for Phase A scope.)*

| Requirement | Status | Evidence |
|---|---|---|
| A1: `recipes` table + RLS (mom/adult full CRUD, teen suggested-only via WITH CHECK) | **Wired** | Migration 100291 §1; E2E test 8 RLS probes |
| A1: `recipe_versions` table + RLS | **Wired** | Migration 100291 §2 |
| A1: `meal_plan_entries` table + field-scoped edit-authority trigger | **Wired** | Migration 100291 §3, `enforce_meal_plan_entry_edit_scope()`; E2E test 10 |
| A1: `food_restrictions` table, no `is_included_in_ai` column (always-include inversion) | **Wired** | Migration 100291 §4; E2E test 6 |
| A1: `meal_feedback` table, append-only, celebration-only CHECK | **Wired** | Migration 100291 §5 |
| A1: `meal_settings` table + auto-provision trigger + backfill | **Wired** | Migration 100291 §6; verified 3 rows post-apply |
| A1: `meal_pointers` table, family-readable/mom-editable, exactly-one-of CHECK | **Wired** | Migration 100291 §7; E2E test 7 |
| A1: `meal_planning` explicit-grant-only family-wide permission key | **Wired** | Migration 100291 §9; `apply_permission_profile()` rewritten with exclusion; Permission Hub grant row wired |
| A1: `meals_basic`/`meals_ai_capture` feature keys | **Wired** | Migration 100291 §10 |
| A1: `match_recipes` semantic search RPC | **Wired** | Migration 100291 §11 |
| A1: `recipe-photos` storage bucket + RLS | **Wired** | Migration 100291 §12 |
| A1: `embed` Edge Function `recipes` TABLE_CONFIG entry | **Wired** | `supabase/functions/embed/index.ts` |
| A1: `victories.source` CHECK extended with `'meal_made'` | **Wired** | Migration 100294 |
| A2: `recipe-extract` Edge Function (link/photo/paste/went_well/scale_assist) | **Wired, deployed** | `supabase/functions/recipe-extract/index.ts`; full SAFETY-BETA-GATE scaffold (auth, crisis, safety preamble, ethics-guard, no-training client, cost logging); deployed 2026-07-07 with `--no-verify-jwt` per seat-approved gate 1; live probe confirms `authenticateRequest` gate: unauthenticated POST → `401 {"error":"Unauthorized"}` |
| A2: `useRecipes`/`useMealPlan`/`useFoodProfiles` data hooks | **Wired** | `src/hooks/useRecipes.ts`, `useMealPlan.ts`, `useFoodProfiles.ts` |
| A2: Recipe Capture modal (4 tiles) + HITM review card | **Wired** | `RecipeCaptureModal.tsx`; Convention #4/#279 Edit/Approve/Regenerate/Reject before persist; E2E test 9, tour shot 02 |
| A2: Recipe Box (search/filter/sort/empty states) | **Wired** | `RecipeBox.tsx`; E2E test 1, tour shot 01 |
| A2: Recipe Detail (scaling, versions, rotation, hearts, Family Pointers) | **Wired** | `RecipeDetailModal.tsx`; E2E test 2 + 7, tour shots 03/04 |
| A2: `AddToPlanModal` | **Wired** | `AddToPlanModal.tsx`; E2E test 3 |
| A2: `SendToShoppingListModal` (merge review, dynamic scaling) | **Wired** | `SendToShoppingListModal.tsx`; E2E test 5 |
| A3: This Week plan (week/day/month, dnd-kit drag-drop, MiniCalendarPicker date-jump) | **Wired** | `ThisWeekPlan.tsx`; E2E test 3 + 10, tour shot 05 |
| A3: Cook View (big-type step-through, pointer matching, mic capture) | **Wired** | `CookViewModal.tsx`; E2E test 7, tour shot 07 |
| A3: Entry sheet (assign cook, kids-helped, mark made/didn't happen, notes) | **Wired** | `EntrySheetModal.tsx`; E2E test 4, tour shot 06 |
| A3: Mark-made follow-up strip (leftovers/homeschool-minutes/victory) | **Wired** | `EntrySheetModal.tsx` follow-up block; real bug found+fixed (stale-prop gating) during build |
| A3: Food Profiles (restrictions + Archives preferences quick-add + nutrition_direction) | **Wired** | `FoodProfilesModal.tsx`; E2E test 6, tour shot 08 |
| A3: SortTab Recipe card + queue wiring | **Wired** | `SortTab.tsx`, `QueueCard.tsx`; E2E test 9 |
| A3: `mindsweep-sort` recipe dual-route metadata fix (ruling 1) | **Wired** | `recipe_to: 'recipes'` (was `'archives'`), patch-staged to avoid clobbering parallel session's file |
| A3: `/meals` route + Meals page shell (This Week/Recipe Box tabs) | **Wired** | `src/pages/Meals.tsx`, `App.tsx` route |
| A3: Sidebar registration (mom + additional_adult shells, Plan & Do section) | **Wired** | `Sidebar.tsx` — `getSidebarSections`, both shell blocks |
| A3: BottomNav/More-menu parity (Convention #16) | **Wired** | Structural: `BottomNav.tsx` reads `getSidebarSections` (no parallel list). Visual: tour shots 09–11, tap-through confirmed routes to `/meals` |
| Proof: `tsc -b` clean | **Wired** | Exit 0, re-verified after CSS token fix |
| Proof: lint clean | **Wired** | 0 errors on all touched files (pre-existing unrelated WishLists/WishCatchModal errors from a parallel untracked PRD-43 session correctly left untouched) |
| Proof: functional E2E suite (MEALTEST fixtures, DB-asserted) | **Wired** | `meal-planning.spec.ts` 10/10 passing, zero residue verified across recipes/meal_plan_entries/meal_pointers/food_restrictions/list_items/studio_queue/lists |
| Proof: Convention #277 eyes-on tour, every screenshot read | **Wired** | 26 screenshots across 3 viewports + 2 nav-parity tests; 1 real defect found (CSS token bug) and fixed; suite + tour both re-verified green post-fix |
| Deploy: `recipe-extract` Edge Function | **Wired, deployed** | Seat-approved gate 1, 2026-07-07. Deployed `--no-verify-jwt` to `vjfbzpliqialqmabfnxs`; live 401 probe confirms `authenticateRequest` gate is active |
| Regression: shared-fixture suites (leak-pass, permissions-wiring, fo-command-center) | **Holding for seat's "BATCH PASS — GO" relay** | Seat is consolidating ONE tree-wide pass covering this build + WishLists + SM-A/B + Slice E simultaneously; SM-B currently holds the suite slot |
| Close-out docs (STUB_REGISTRY, WIRING_STATUS, `live_schema.md` regen, LiLa knowledge, feature-decisions record) | **Wired** | STUB_REGISTRY.md + WIRING_STATUS.md sections added, `live_schema.md` regenerated (new "Meal Planning (KitchenCompass)" DOMAIN_ORDER entry), `help-patterns.ts` + `feature-guide-knowledge.ts` (PAGE_KNOWLEDGE + USE_CASE_RECIPE) updated, `claude/feature-decisions/PRD-42-Meal-Planning.md` created, README index row added. CLAUDE.md convention entry for the always-include inversion pattern remains explicitly deferred to Phase B close-out per the pack's own instruction. |
| Commit | **Holding** | Seat instruction: rides the tree-wide batch, selective staging of this build's own files only, seat sweeps shared files (Sidebar.tsx, PermissionHub.tsx, App.tsx) last |

**0 Missing for Phase A scope.** All A1/A2/A3 requirements are Wired, `recipe-extract` is deployed and live-verified. Regression suite run and commit are holding on the coordination seat's tree-wide batch signal.
