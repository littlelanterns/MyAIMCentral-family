# Feature Decision File: PRD-42 — KitchenCompass (Meal Planning), Phase A

> **Created:** 2026-07-07
> **PRD:** `prds/daily-life/PRD-42-Meal-Planning.md`
> **Addenda read:** `claude/dispatch-factory/PRD42.md` (the 13 reconciliation rulings — LAW; no separate PRD-42-specific addendum exists, the pack IS the addendum). Also checked and confirmed non-conflicting: `PRD-Audit-Readiness-Addendum.md`, PRD-35 scheduler addenda, PRD-31 permission-matrix addenda.
> **Founder approved:** 2026-07-07 (D-42-8 re-confirmed via AskUserQuestion at build start — "Yes — build Phase A now as scoped")

---

## What Is Being Built

KitchenCompass is a family meal-planning feature. Phase A ships the practical core: mom (or a granted adult) captures recipes from a link, a photo, pasted text, or by describing something that "went well," reviews the AI extraction before it saves (Human-in-the-Mix), scales recipes up or down, plans meals onto a weekly calendar with drag-and-drop, cooks from a big-type step-through Cook View that surfaces family-specific cooking notes ("Family Pointers" — "how WE do it"), sends the week's ingredients to an existing shopping list with automatic scaling, and records food restrictions (always enforced, never toggle-off-able) and preferences per family member. Phase B (suggestion engine, LiLa integration, Family Hub surface, kid-facing views) and Phase C (grocery-cart export) are explicitly out of scope for this build — see `.claude/rules/current-builds/PRD-42-meal-planning.md` for the full phase breakdown and founder confirmation record.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| `/meals` (`Meals.tsx`) | Top-level page, This Week / Recipe Box tabs, Food Profiles button (mom/grant only) |
| `RecipeCaptureModal.tsx` | 4-tile chooser (Link/Photo/Paste/This Went Well, mic on the last), HITM review card (Edit/Approve/Regenerate/Reject) |
| `RecipeBox.tsx` | Search, 5 filter chips (Favorites/Traditions/Quick/Slow cooker/New), sort, empty states, recipe cards |
| `RecipeDetailModal.tsx` | Scale stepper (0.5×–4×+custom), `scale_assist` AI hint on non-1×, ingredients w/ discrete-item scaling notes, instructions, saved versions, rotation dial (mom-only), hearts strip, Family Pointers section (mic-addable) |
| `AddToPlanModal.tsx` | Date + slot picker (defaults to `meal_settings.enabled_slots`), servings input |
| `ThisWeekPlan.tsx` | Week/Day/Month views, dnd-kit cross-cell drag-drop, MiniCalendarPicker date-jump popover, busy-evening flags, "Send to shopping list" |
| `AddEntryModal.tsx` | "+" empty-cell button → recipe search picker or freeform title |
| `EntrySheetModal.tsx` | View recipe / Cook this, servings, who's-cooking + kids-helped member pills, notes, mark made / didn't happen / remove, mark-made follow-up strip (leftovers / homeschool minutes / celebrate victory) |
| `CookViewModal.tsx` | Full-screen big-type step-through, recipe pointers pinned at top, technique-tag pointers matched per step, scaled ingredients, in-the-moment mic-addable pointer capture |
| `SendToShoppingListModal.tsx` | Merge-review (identical items combined + summed across recipes), editable rows, list picker, "already have it" toggle |
| `FoodProfilesModal.tsx` | Whole-family + per-member cards; always-include Restrictions (no toggle); Loves/Not-a-fan-of quick-add to Archives Preferences; mom-only `nutrition_direction` free-text |
| SortTab Recipe card | Queue item with `destination='recipe'` opens `RecipeCaptureModal` prefilled with the queued content |
| Sidebar/BottomNav entry | "KitchenCompass" (ChefHat icon), Plan & Do section, mom + additional_adult shells |

---

## Key PRD Decisions (Easy to Miss)

1. **Display name is "KitchenCompass"; all keys/routes stay `meals_*`/`/meals`** regardless of any future display-name change (per the pack header).
2. **`food_restrictions` has NO `is_included_in_ai` column** — an always-include inversion of the universal three-tier toggle pattern (D-42-4). This is intentional: safety-critical restrictions can never be excluded from LiLa's meal-planning context. A new CLAUDE.md convention documenting this exception is explicitly deferred to Phase B close-out per the pack.
3. **Scaling is pure client-side math.** `scale_assist` (a single optional Haiku call for awkward-to-scale ingredients like "1 egg") is itself HITM-reviewed and never automatic.
4. **`meal_plan_entries.entry_date` is EXEMPT from Convention #257 trigger derivation** — it's a future-facing planning date ("what are we cooking Tuesday"), not a "today" value, so it is client-set directly (ruling 4).
5. **Teen recipe inserts are forced to `approval_status='suggested'` at the RLS WITH CHECK layer**, not just client-side — a teen cannot bypass this by editing the request payload.
6. **`meal_feedback.feedback` CHECK allows only `'loved' | 'liked'`** — celebration-only enforced at the schema layer (matches Convention #219/#180 lineage), not just UI convention.
7. **Allergen banners warn, never block** — mom always has final say.
8. **No calorie/macro UI anywhere.** The only nutrition surface in the entire PRD is the mom-only `nutrition_direction` free-text field; it never renders on any kid surface (moot in Phase A since there are zero kid-facing meal surfaces yet).
9. **`meal_pointers` is family-readable by every role but mom/grant-editable only**, with an exactly-one-of CHECK on `recipe_id`/`technique_tag` (D-42-6 rider).
10. **Recipe dual-route classification target is `recipes`, not `archives`** (ruling 1) — `mindsweep-sort`'s auxiliary metadata label was stale from before the `recipes` table existed; fixed as a single-line change.
11. **`meal_planning` is an explicit-grant-only, family-wide permission key** (Convention #274 shape — binary 'none'/'manage', `target_member_id IS NULL`, never touched by `apply_permission_profile()`), not a per-kid grant.

---

## Addendum Rulings

### From `claude/dispatch-factory/PRD42.md` (all 13 rulings — the only PRD-42 addendum):
- Ruling 1: recipe dual-route target is `recipes`, not `archives`.
- Ruling 2: no parallel grocery machinery — ingredients flow through the existing `list_items` table/hooks, never a new grocery-specific table.
- Ruling 3 / D-42-4: `food_restrictions` always-include inversion, no `is_included_in_ai` column.
- Ruling 4: `entry_date` exempt from Convention #257.
- Ruling 9: `meal_planning` explicit-grant-only family-wide key.
- D-42-6: Family Pointers ("how WE do it") rider — recipe-specific + technique-tag pointers, family-readable/mom-editable.
- D-42-8: two-v1-phase scope (Phase A this build / Phase B suggestion engine + LiLa + Hub + kid surfaces / Phase C grocery export blocked on founder ops signups) — **re-confirmed explicitly at build start per the pack's own instruction**, since the founder's original chat reply never typed an explicit yes/no on the phase-split question itself.
- (Rulings 2, 5–8, 10–13 are folded directly into the PRD text and were not separately re-litigated — confirmed via the freshness preamble cross-check against 20 relevant CLAUDE.md conventions, no drift found.)

---

## Database Changes Required

### New Tables (migration `00000000100291`)
- `recipes` — title/description/source_type/ingredients (JSONB)/instructions (JSONB)/timing/effort_level/rotation/approval_status/embedding (halfvec 1536)
- `recipe_versions` — scaled/adapted snapshots
- `meal_plan_entries` — entry_date/meal_slot/recipe_id/status/cook_member_id/kids_helped_member_ids, protected by a field-scoped BEFORE UPDATE trigger (`enforce_meal_plan_entry_edit_scope`)
- `food_restrictions` — member_id nullable (whole-family), restriction_type, severity, **no `is_included_in_ai`**
- `meal_feedback` — append-only, `feedback IN ('loved','liked')`, no UPDATE policy
- `meal_settings` — one row per family, auto-provisioned via a new trigger on `families` INSERT
- `meal_pointers` — recipe-specific or technique-tag pointers, exactly-one-of CHECK

### Also this migration
- `util.has_meal_planning_grant()` helper (SECURITY DEFINER)
- `match_recipes()` semantic-search RPC
- `recipe-photos` storage bucket + 3 RLS policies
- `meal_planning` permission key registration (`feature_access_v2`, `permission_level_profiles`, `apply_permission_profile()` exclusion)
- `meals_basic`/`meals_ai_capture` feature keys

### Modified (migration `00000000100294`)
- `victories.source` CHECK extended with `'meal_made'`

### Other
- `embed` Edge Function `TABLE_CONFIG` entry for `recipes` (title + description columns)

---

## Mom-UI Verification

*(Copied from `.claude/rules/current-builds/PRD-42-meal-planning.md` — Claude-driven per Convention #277, `tests/e2e/features/meal-planning-eyes-on-tour.spec.ts`, 26 screenshots across 3 viewports, all read directly.)*

**Real defect found and fixed during this pass:** the first tour run surfaced visible bleed-through/ghosting in Cook View. Root cause: all 9 meal-planning components used `var(--color-bg)`, a CSS custom property that does not exist in `ThemeProvider.tsx`. Fixed all 21 occurrences across 9 files, mapped to the correct existing tokens (`--color-bg-card`/`--color-bg-primary`/`--color-bg-secondary`). Re-verified with a second full tour pass — all clean below.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence |
|---------|-----------------|---------------|---------------|---------------|----------|
| Recipe Capture (4 tiles) + HITM review | ✅ | (shares modal w/ detail) | ✅ | Mom | `meal-02-capture-tiles-*` |
| Recipe Box (search/filter/empty states) | ✅ | ✅ | ✅ | Mom | `meal-01-recipe-box-*` |
| Recipe Detail (scaling/versions/pointers) | ✅ post-fix | ✅ | (bracketed by desktop/mobile) | Mom | `meal-03/04-*` |
| This Week (week/day/month + drag-drop) | ✅ | ✅ | ✅ | Mom | `meal-05-this-week-*` |
| Cook View | ✅ post-fix (was: transparent bleed-through) | ✅ | ✅ | Mom | `meal-07-cook-view-*` |
| Entry sheet + mark-made follow-up | ✅ post-fix | ✅ | ✅ | Mom | `meal-06-entry-sheet-*` |
| Send-to-shopping-list merge review | ✅ verified via DB-asserted E2E test 5 | — | — | Mom | `meal-planning.spec.ts` test 5 |
| Food Profiles | ✅ post-fix | ✅ | ✅ | Mom | `meal-08-food-profiles-*` |
| SortTab Recipe card | ✅ verified via DB-asserted E2E test 9 | — | — | Mom | `meal-planning.spec.ts` test 9 |
| Sidebar/BottomNav parity (Convention #16) | ✅ "KitchenCompass" in Plan & Do, after Touch Base | N/A | ✅ same section/label/icon/position in More menu; tap-through routes to `/meals` | Mom | `meal-09/10/11-*` |

---

## Post-Build Verification

*(Copied from `.claude/rules/current-builds/PRD-42-meal-planning.md` — Checkpoint 5, 2026-07-07. 0 Missing for Phase A scope.)*

| Requirement | Status | Evidence |
|---|---|---|
| A1: `recipes` table + RLS (mom/adult full CRUD, teen suggested-only via WITH CHECK) | **Wired** | Migration 100291 §1; E2E test 8 RLS probes |
| A1: `recipe_versions` table + RLS | **Wired** | Migration 100291 §2 |
| A1: `meal_plan_entries` table + field-scoped edit-authority trigger | **Wired** | Migration 100291 §3; E2E test 10 |
| A1: `food_restrictions` table, always-include inversion | **Wired** | Migration 100291 §4; E2E test 6 |
| A1: `meal_feedback` table, append-only, celebration-only CHECK | **Wired** | Migration 100291 §5 |
| A1: `meal_settings` table + auto-provision trigger + backfill | **Wired** | Migration 100291 §6; 3 rows verified |
| A1: `meal_pointers` table, family-readable/mom-editable, exactly-one-of CHECK | **Wired** | Migration 100291 §7; E2E test 7 |
| A1: `meal_planning` explicit-grant-only permission key | **Wired** | Migration 100291 §9; Permission Hub grant row |
| A1: `meals_basic`/`meals_ai_capture` feature keys | **Wired** | Migration 100291 §10 |
| A1: `match_recipes` semantic search RPC | **Wired** | Migration 100291 §11 |
| A1: `recipe-photos` storage bucket + RLS | **Wired** | Migration 100291 §12 |
| A1: `embed` TABLE_CONFIG entry | **Wired** | `supabase/functions/embed/index.ts` |
| A1: `victories.source` CHECK extended | **Wired** | Migration 100294 |
| A2: `recipe-extract` Edge Function (5 modes) | **Wired (not yet deployed)** | Full SAFETY-BETA-GATE scaffold; awaiting founder-approved deploy pass |
| A2: data hooks (`useRecipes`/`useMealPlan`/`useFoodProfiles`) | **Wired** | `src/hooks/*.ts` |
| A2: Recipe Capture modal + HITM review | **Wired** | E2E test 9, tour shot 02 |
| A2: Recipe Box | **Wired** | E2E test 1, tour shot 01 |
| A2: Recipe Detail + versions + pointers | **Wired** | E2E test 2+7, tour shots 03/04 |
| A2: AddToPlanModal | **Wired** | E2E test 3 |
| A2: SendToShoppingListModal | **Wired** | E2E test 5 |
| A3: This Week plan | **Wired** | E2E test 3+10, tour shot 05 |
| A3: Cook View | **Wired** | E2E test 7, tour shot 07 |
| A3: Entry sheet | **Wired** | E2E test 4, tour shot 06 |
| A3: Mark-made follow-up strip | **Wired** | Real stale-prop bug found+fixed |
| A3: Food Profiles | **Wired** | E2E test 6, tour shot 08 |
| A3: SortTab wiring + `mindsweep-sort` fix | **Wired** | E2E test 9 |
| A3: `/meals` route + page shell | **Wired** | `App.tsx`, `Meals.tsx` |
| A3: Sidebar registration | **Wired** | `Sidebar.tsx` |
| A3: BottomNav/More-menu parity | **Wired** | Tour shots 09–11, visually + functionally confirmed |
| Proof: `tsc -b` clean | **Wired** | Exit 0 |
| Proof: lint clean | **Wired** | 0 errors, touched files only |
| Proof: functional E2E suite | **Wired** | 10/10, zero residue |
| Proof: Convention #277 eyes-on tour | **Wired** | 26 screenshots, 1 real defect found+fixed |
| Deploy: `recipe-extract` | **Pending founder approval** | Standing project convention |
| Regression: shared-fixture suites | **Pending founder approval** | Standing project convention (other sessions may share fixtures) |
| Close-out docs | **Wired** | This file, STUB_REGISTRY, WIRING_STATUS, `live_schema.md` regen all complete |
| Commit | **Not done** | Standing instruction: never commit unless explicitly asked |

**0 Missing for Phase A scope.**

---

## Stubs Named This Phase

Full list with rationale in `STUB_REGISTRY.md` → "PRD-42 KitchenCompass (Meal Planning) — Phase A": suggestion engine, `meal_planning` LiLa mode, Family Hub section, Guided/Play/teen dashboard surfaces, `meal_plan` dashboard widget (blocked on ST-E), theme nights, prep reminders, budget estimate, Instacart/Walmart export (Phase C), fridge-scan/cookbook-export/pantry PECs, `family_moments` photo routing, homeschool compliance surfacing, Special Adult shift-meals view (blocked on SAEX), the deferred CLAUDE.md convention entry for the always-include inversion pattern, and the FDWA reconciliation note.

---

## Coordination Notes for Future Builders

- **Whoever builds FDWA (family-shadow write-audit):** this build added 2 family-shadow RLS policies (`meal_feedback` INSERT, `meal_plan_entries` UPDATE status-only) via the `00000000100262` precedent (`util.is_family_shadow_of()`) ahead of FDWA's own landing. Reconcile against whatever pattern FDWA standardizes on.
- **Whoever builds PRD-42 Phase B:** add the always-include-inversion CLAUDE.md convention entry (deferred here per the pack's own instruction); the current 8-key canonical tracker-category scheme (`routine_trackers`, `goal_pursuit`, `progress_visualizers`, `reward_allowance`, `achievement_recognition`, `reflection_insight`, `family_social`, `skill_tracking`) is noted for whoever builds the `meal_plan` dashboard widget (slice B3), which is blocked on STUDIO-EXPERIENCE ST-E landing first.
- **`supabase/functions/mindsweep-sort/index.ts`** had substantial uncommitted changes from a parallel SAFETY-BETA-GATE Slice E session at build time; this build's one-line `recipe_to` fix was applied and should be patch-staged (not whole-file staged) at commit time to avoid clobbering that session's in-progress ethics-guard rollout.
