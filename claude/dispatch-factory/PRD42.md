# Pre-Dispatch Pack — PRD42: KitchenCompass (Meal Planning)

> **Factory status:** **APPROVED** — founder resolved D-42-1..7 on 2026-07-06 (rulings + four
> riders recorded in the PRD's §14 Founder Decision Record and folded into the PRD text).
> D-42-8 (v1 scope) inferred-approved — her reply trailed off at item 8; the Phase A worker
> confirms it explicitly at the pre-build gate.
> Produced: 2026-07-06 (Fable 5 design session — PRD authored same session, so this pack's
> evidence IS the PRD: `prds/daily-life/PRD-42-Meal-Planning.md`. No separate RECON file.)
> Item ID: PRD42. Priority: P3 (family-experience). Working name **KitchenCompass**
> (keys/routes `meals_*` regardless). Two v1 build phases + Phase C (grocery-cart export,
> post-core), one dispatch prompt each for A/B; Phase C prompt authored at its own pre-build
> (needs founder ops: Instacart/Walmart developer-account signups first).
> Headline: greenfield feature, but ~60% of its "external requirements list" already exists on
> the platform (aisle-sorted shopping, store categories, purchase history, calendar reads,
> OCR/vision capture, holiday table, Hub sections). The build is mostly WIRING + two small
> Edge Functions + six new tables. MindSweep's `recipe` destination has been a dead-end since
> PRD-17B shipped — this build gives it its real home.

## Reconciliation rulings (newer wins — named explicitly)

1. **MindSweep dual-route target SUPERSEDED:** `mindsweep-sort`'s
   `{recipe_to: 'archives', ingredients_to: 'list'}` metadata predates a recipes table.
   New ruling: `recipe_to: 'recipes'`. `deployQueueItem.ts` continues to SKIP recipe
   (card-by-card review is the HITM step — Convention #276 direct-deploy does NOT extend to
   recipes). SortTab gains a Recipe card → capture-review prefilled.
2. **No parallel grocery machinery.** Ingredients → existing `list_items` via existing hooks;
   `store_category` populated at extraction; Shopping Mode aisle lens already does
   aisle-by-aisle. Zero new list columns; provenance in `list_items.notes`.
3. **Likes/dislikes live in Archives** (`archive_context_items`, Preferences folder,
   Convention #75 write-back). Allergies/sensitivities get the NEW `food_restrictions` table
   with the **always-include inversion** (no `is_included_in_ai` column; loaded into every
   meal-AI context regardless of toggles; output re-filtered as second layer). Proposed as a
   numbered convention at close-out (D-42-4).
4. **Convention #257 posture:** `meal_plan_entries.entry_date` is a user-chosen planning
   date — EXEMPT from trigger derivation (it is not "today"). All tonight/today READS via
   `useFamilyToday`/`fetchFamilyToday`; `made_at` server-set TIMESTAMPTZ; `meal_feedback`
   carries no DATE column at all. Run the #257(c) pre-work verification queries before
   touching anything.
5. **LiLa story stated per Convention #248:** `recipe-extract` + `meal-suggest` are
   category-2 native utilities (own EFs, empty context_sources, NOT LiLa). The `meal_planning`
   guided mode is category-1 (registered, non-empty `context_sources=['meal_context']`, MUST
   call `assembleContext()` with the new meal-context loader). Both EFs get the full
   SAFETY-BETA-GATE scaffold from birth (authenticateRequest, detectCrisis,
   buildSafetyPreamble on prompt builders, `_shared/openrouter-client.ts`, cost logging).
6. **Celebration-only is schema-enforced:** `meal_feedback.feedback` CHECK allows only
   `'loved' | 'liked'`. Mom's "not again" is the recipe `rotation` dial, never a kid-facing
   mechanic. Missed meals get neutral copy + one-tap human moves, NEVER silent auto-reschedule.
7. **No calorie/macro surface anywhere in v1; kids NEVER see calorie/macro data** (D-42-3
   values ruling). Nutrition Insights = adults-only PlannedExpansionCard. Meal-suggest prompt
   law: no diet-culture language, no body talk; whole-foods shifts framed as swaps from
   favorites.
8. **Kid-privacy:** meal data is family-shared; no new kid-privacy affordances (standing
   no-hiding-from-parents principle, MANIFEST 2026-07-04). `filterKidPrivate` untouched.
9. **Grants:** `meal_planning` is a family-wide explicit-grant-only key (Convention #274
   shape — `apply_permission_profile` never touches it). Adults mark-made WITHOUT the grant;
   plan-structure/settings/restrictions edits need mom or grant. Teens add recipes as
   `approval_status='suggested'` (WITH CHECK enforced).
10. **Family-shadow writes** (Convention #276/FDWA): Hub tap-to-heart + mark-made need
    `util.is_family_shadow_of()` policies on `meal_feedback` + `meal_plan_entries`
    (status-scoped UPDATE). If FDWA has landed by build time, follow its established pattern
    file-for-file; if not, use migration 100262's precedent and leave FDWA a coordination note.
11. **Homeschool/victory hooks are event-log writes** (numerators — FGPZ Rider 2 posture);
    never inline obligations derivation (Convention #271). `homeschool_time_logs` is a
    grandfathered surface — writes go through the existing insert path unchanged.
12. **Widget + Hub section as data:** `meal_plan` widget starter config row (canonical
    category per ST-E's scheme — check whether ST-E has landed and use its key set);
    `family_meals` Hub section key grafts at read time (mergeSectionOrder pattern).
13. **Fridge scanner is NOT in phases A/B.** PlannedExpansionCard ships in v1
    (`meals_fridge_scan`); camera scan builds only on demand signal. The founder's D-42-7
    compromise ships INSTEAD in Phase B: the "Use it up" text/voice box in the Suggestions
    drawer (`meal_settings.use_up_note`, 14-day age-out, "uses your zucchini" chips) — same
    job, ~$0.
14. **Family Pointers rider (D-42-6):** new `meal_pointers` table (recipe-specific OR
    reusable `technique_tag` notes; CHECK exactly-one) + Cook View on the entry sheet
    (big-type step-through, pointers interleaved, scaled quantities, mic-addable pointer
    capture in the moment). Family-readable by design — the point is dad and the kids can
    follow "how WE do it." Edit = mom + grant. Phase A scope.
15. **Nutrition awareness without tracking (D-42-3 rider):** `meal_settings.nutrition_direction`
    (mom's words, e.g. "more protein at breakfast") always feeds meal-suggest when set;
    honored QUALITATIVELY (no calorie/macro numbers in any output); rendered on mom/granted-
    adult surfaces only — never any kid-facing surface. Numeric tracking stays an
    adults-only PlannedExpansionCard.
16. **Grocery-cart export UPGRADED to Phase C build (D-42-5):** Instacart first (official
    Instacart Developer Platform — send items, receive a shopping-list link, mom's cart
    populates at her chosen retailer incl. Aldi, she checks out herself; no credentials in
    our system), Walmart second (affiliate add-to-cart deep links + product-search SKU
    matching — needs an item-match review screen). OPS PREREQUISITE before Phase C
    pre-build: founder signs up for the Instacart Developer Platform + Walmart affiliate/API
    programs (free). AnyList/Todoist = never-build. Calendar sync stays a platform-level PEC.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

**Phase A — Recipes, Plan, Shopping, Profiles (dispatch 1):**

| Slice | Scope | Routing |
|---|---|---|
| A1 | Schema: `recipes`, `recipe_versions`, `meal_plan_entries`, `food_restrictions`, `meal_feedback`, `meal_pointers`, `meal_settings` (incl. `standing_direction`, `nutrition_direction`, `use_up_note`) + RLS (incl. teen suggested WITH CHECK, family-shadow policies, append-only feedback, family-readable pointers) + embedding trigger + `embed` TABLE_CONFIG + `match_recipes` RPC + storage bucket + feature keys + DOMAIN_ORDER teach | Sonnet xhigh + migration-writer + rls-verifier |
| A2 | `recipe-extract` EF (link/photo/paste/went_well/scale_assist modes, full safety scaffold) + capture modal (4 tiles, voice via useVoiceInput, fallbacks) + HITM review card + Recipe Box (search keyword+semantic, filters, cards, empty states) + recipe detail (scaling stepper, versions, rotation dial, hearts strip, tradition/texture chips, **Family Pointers section** w/ mic + technique notes) | Sonnet xhigh |
| A3 | This Week plan surface (week/day/month, dnd-kit drag-drop, busy-evening flags from calendar_events, entry sheet + **Cook View** (big-type step-through, pointers interleaved, in-the-moment pointer capture), mark-made follow-up strip w/ leftovers + kids-helped + homeschool-minutes + victory hook), send-to-shopping-list merge review (dynamic serving scaling, store_category, "already have it" toggles), Food Profiles screen (restrictions + Archives quick-add + mom-only `nutrition_direction` editor), allergen warning banners, SortTab Recipe card (queue wiring + mindsweep-sort metadata update), sidebar registration + mobile parity | Sonnet xhigh |

**Phase B — Intelligence & Family Surfaces (dispatch 2, after A sign-off):**

| Slice | Scope | Routing |
|---|---|---|
| B1 | `meal-suggest` EF (Try Something New only calls Haiku; favorites/traditions/swap = RPC/$0; restriction dual-enforcement; picky-eater + whole-foods prompt law; `nutrition_direction` qualitative honoring; `use_up_note` context) + Suggestions drawer (**"Use it up" text/voice box at top**, 3 rails, "uses your…" chips, HITM acceptance into capture review) + one-tap swap + tradition/holiday matching | Sonnet xhigh |
| B2 | `meal_planning` guided mode (lila_guided_modes row, real prompt per NEW-C standard, meal-context loader in context-assembler with the always-include restrictions read) + LiLa knowledge (help-patterns + feature-guide-knowledge) + FeatureGuide cards | Sonnet xhigh |
| B3 | Hub `family_meals` section (tonight, tap-to-heart w/ acted_by attribution, connection-prompt pool behind toggle) + Guided/Play/teen surfaces per PRD §6.11 + `meal_plan` dashboard widget + PlannedExpansionCards (fridge scan, cookbook, pantry, nutrition, integrations) | Sonnet xhigh |
| B4 | `meal_patterns` theme nights (Universal Scheduler, ghost entries, fill-it) + prep reminders/tasks (`source='meal_prep'`, night-before notification) + budget estimate behind purchase_history data-sufficiency check | Sonnet xhigh |
| B5 | E2E `tests/e2e/features/meal-planning.spec.ts` (capture→HITM→box; scale+save version; plan+drag+mark-made; send-to-list DB-asserted rows incl. quantity scaling; restriction always-include probe — heart OFF everything and assert suggestions still filter; teen suggested WITH CHECK RLS probe; Hub heart attribution + idempotence; queue recipe card deploy; pointers render in Cook View incl. technique-tag matching; use-it-up chip probe; nutrition_direction absent from every kid-surface render; family_today evening-class check) + Convention #277 eyes-on tour + docs close-out | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 per phase | **Fable if available, else Opus** |

**Phase C — Grocery-cart export (post-core, founder-upgraded per D-42-5):** Instacart
Developer Platform link handoff (list → shopping-list URL → mom's cart at her retailer,
Aldi incl.), then Walmart affiliate add-to-cart + SKU-match review screen. Dedicated EF per
integration (one-tool-one-function), secrets in Vault, zero credentials stored, item-match
review before handoff. **Blocked on founder ops:** Instacart Developer Platform + Walmart
affiliate signups (free). Phase C dispatch prompt is authored at its own pre-build once the
accounts exist — API shapes get re-verified live then (external APIs drift; do not build
from this pack's description alone). The fridge-scanner PEC slice also parks here.

Rider (a) standard applies (STUDIO-EXPERIENCE): every pin drives the REAL flow with
service-role DB assertions. MEALTEST fixture prefix, swept beforeAll+afterAll, zero residue.

## Founder decisions — RESOLVED 2026-07-06 (full record in PRD §14)

| # | Decision | Ruling |
|---|---|---|
| D-42-1 | Feature name | **KitchenCompass** (working name at minimum; TableSpread/GatherRound rejected) |
| D-42-2 | Number | **PRD-42** ("whatever is available"; PRD-39 stays earmarked for the video library) |
| D-42-3 | Calorie/macro posture | Tracking = later-or-never (adults-only PEC); **kids never see calorie/macro surfaces — standing rule**; RIDER: AI aware of mom's nutrition goals via `nutrition_direction` (qualitative only, mom/adult surfaces only) |
| D-42-4 | Allergy always-include inversion | **Agreed** — new numbered convention at close-out |
| D-42-5 | Integrations | **UPGRADED:** Instacart/Walmart cart export = Phase C build (Instacart first — official API, Aldi covered; founder "really intrigued"); AnyList/Todoist never-build; calendar sync stays PEC |
| D-42-6 | Adult/kid posture | Anyone with permissions, yes; kids involved with meals; RIDER: **Family Pointers + Cook View** (mom-saved "how WE do it" instructions for dad/kids, recipe-specific + reusable technique notes) → Phase A |
| D-42-7 | Fridge scanner | Demand card stays; **compromise built in Phase B**: "Use it up" text/voice box feeding suggestions |
| D-42-8 | v1 scope (A+B, then C) | Inferred approved (reply trailed off at 8; differentiator list endorsed) — **Phase A worker re-confirms at the pre-build gate** |

## Dependency edges

- Depends on (all BUILT): PRD-09B shopping, PRD-13 Archives, PRD-14B calendar reads,
  PRD-35 scheduler, PRD-14D Hub sections, PRD-17/17B queue+MindSweep, PRD-05 LiLa,
  PRD-15 notifications, embed pipeline, whisper-transcribe.
- Coordinate with (in flight / packs): **FDWA** (family-shadow policy pattern — whoever
  lands second follows the first), **ST-E** (widget canonical categories), **SMFX/MSWP**
  (sweep-email DNS enables the grandma pipeline — ops, not code), **FGPZ** (PrizeBoard
  territory untouched; event-not-obligation posture shared).
- Unblocks later: PRD-37 (went-well photos → family_moments), PRD-28B (home-ec hours in
  compliance reports), PRD-29 (meal-adjacent BigPlans compositions), SAEX (shift meals view).
- No upstream blockers. Dispatch any time after the decision batch resolves. Suggested slot:
  P3 chain alongside PRD12A/12B — high founder-family daily-use value, zero dependency risk.

---

## DISPATCH PROMPT — PHASE A (paste into a FRESH session after decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-42 KitchenCompass, PHASE A (recipes, weekly plan,
Cook View + Family Pointers, shopping handoff, food profiles). Founder resolved all pack
decisions 2026-07-06 — rulings + riders in the PRD's §14 Founder Decision Record. Display
name KitchenCompass; keys/routes are `meals_*`. ONE open confirm: D-42-8 (v1 scope =
Phases A+B with Phase C following) was inferred from a trailed-off reply — restate it in
your pre-build summary and get her explicit yes there.

FRESHNESS PREAMBLE: pack produced 2026-07-06. Run `git log --oneline --since=2026-07-06`;
re-read CLAUDE.md conventions added since; check whether FDWA landed (if yes, copy its
family-shadow policy pattern exactly); check whether ST-E landed (widget category keys);
re-verify mindsweep-sort still carries the recipe dual-route metadata at the cited lines;
take the next FREE migration number at file-creation time and re-check immediately before
applying — if `supabase migration list --linked` shows unapplied migrations that are NOT
yours, apply only your own idempotent SQL via `supabase db query --linked -f <file>`,
never `db push`.

READ FIRST (in order):
1. prds/daily-life/PRD-42-Meal-Planning.md — FULL read, every word. It is the requirement
   list: every screen, field, empty state, edge case in §5–§11 gets built exactly as written.
2. claude/dispatch-factory/PRD42.md — the 13 reconciliation rulings are LAW (esp. ruling 1:
   deployQueueItem keeps SKIPPING recipes; ruling 3: likes/dislikes go to Archives, never a
   parallel store; ruling 4: #257 posture; ruling 6: schema-enforced celebration-only).
3. prds/addenda/PRD-Audit-Readiness-Addendum.md + PRD-35 + PRD-31 permission-matrix addenda
   sections that touch scheduling/permissions.
4. supabase/functions/_shared/{safety-preamble,crisis-detection,openrouter-client}.ts +
   one shipped EF (curriculum-parse) — your recipe-extract scaffold.
5. Create .claude/rules/current-builds/PRD-42-meal-planning.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md incl. Mom-UI Surfaces list; founder
   approval BEFORE code.

BUILD SLICES A1→A2→A3 per the pack table. HARD RULES: HITM review card before ANY extracted
recipe persists; scaling is client-side math (scale_assist Haiku call is optional and
HITM'd); food_restrictions has NO is_included_in_ai column and its editor copy says it
can't be turned off; meal_feedback enum is positive-only; allergen banners WARN and never
block mom; no calorie/macro tracking UI anywhere — the ONLY nutrition surface is the
mom-only nutrition_direction free-text editor in Food Profiles (never rendered on kid
surfaces); meal_pointers are family-READABLE by every role (that's their purpose) and
mom/grant-EDITABLE, with the exactly-one-of recipe_id/technique_tag CHECK; Cook View
interleaves pointers into big-type steps and supports in-the-moment mic capture; teen
inserts forced to approval_status='suggested' at the RLS layer; every today/tonight read
via useFamilyToday; Lucide only, zero emoji, theme tokens only (npm run check:colors),
density classes, ModalV2, dnd-kit with ⠿ handles, BottomNav parity via the single
getSidebarSections registration (#16 checklist).

PROOF (rider-a standard — pins drive REAL flows with service-role DB assertions, MEALTEST
prefix, swept): capture→HITM→recipes row for all four tiles (mock the model only where
Playwright can't hold a key — the live-model eyes-on rides the Phase B tour); scale + save
version row; plan entry drag persists date/slot; mark-made bumps times_made + follow-up
strip writes; send-to-list asserts list_items rows with scaled quantities + store_category;
teen suggested WITH CHECK probe (direct RLS insert attempt); restriction editor + allergen
warning render; queue Recipe card → prefilled capture → processed row. tsc -b clean, lint
clean, regression pins green (leak-pass — you add member-scoped RLS; fo-command-center —
you touch SortTab). Ask the founder before running shared-fixture suites and before
deploying ANY Edge Function (present the deploy list for one approved pass). Convention
#277 eyes-on tour for every Phase-A Mom-UI row at desktop/tablet/mobile; fill the table in
the active build file. NOTHING COMMITS until proof green AND founder confirms; selective
staging of YOUR files only (parallel sessions are active — check git status first).
Close-out: Checkpoint 5 zero-Missing for Phase A scope, live_schema regen, STUB_REGISTRY
(register PRD-37/28B/SAEX sockets + PEC stubs), WIRING_STATUS section, leave Phase B a
coordination note (loader/prompt/section keys it consumes).
```

## DISPATCH PROMPT — PHASE B (paste into a FRESH session after Phase A sign-off)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-42 KitchenCompass, PHASE B (suggestion engine +
"Use it up" box, LiLa mode, Hub/kid surfaces, theme nights, prep reminders, E2E +
close-out). Phase A is signed off — read its coordination note in
.claude/rules/current-builds/ (or the archived build file) FIRST, then the same READ list
as Phase A (PRD full read, pack rulings, freshness preamble with
`git log --since=<Phase A close date>`).

BUILD SLICES B1→B5 per the pack table. HARD RULES: Try Something New is the ONLY model call
in the engine — favorites/traditions/swap are RPC/$0; restrictions are ALWAYS in the prompt
AND output re-filtered (dual enforcement); the "Use it up" box (text + mic, NO camera) sits
at the top of the Suggestions drawer, persists to meal_settings.use_up_note with 14-day
age-out, and matching cards show "uses your …" chips; nutrition_direction is honored
QUALITATIVELY (no calorie/macro numbers in any output, nothing nutrition-flavored on any
kid surface); suggestion cards are ephemeral until HITM-accepted into the capture review;
prompt law = no diet-culture, no body talk, whole-foods-as-swaps, texture-adjacency for
picky eaters; meal_planning mode is category 1 — registered with
context_sources=['meal_context'] and calling assembleContext() (a hand-rolled context query
is a defect per Convention #248); Hub hearts carry acted_by attribution and are idempotent;
connection prompts ship as a curated static pool (no per-render AI); meal_patterns use the
Universal Scheduler component and rrule.js expansion only; PlannedExpansionCards per
Convention #31 (all three sections) for fridge-CAMERA-scan/cookbook/pantry/nutrition-
tracking/calendar-sync (grocery-cart export is NOT a card — it's the committed Phase C
build; don't demand-validate something already promised).

PROOF: tests/e2e/features/meal-planning.spec.ts completed per the pack's B5 list — the
always-include probe is load-bearing (heart OFF every recipe + preference, assert
suggestions still exclude restricted ingredients); Hub heart idempotence + family-shadow
attribution probe; ghost-entry fill; prep task source='meal_prep' row. Full Convention #277
eyes-on tour (mom + guided kid + Play Hub view, three viewports), fill the Mom-UI table.
tsc -b, lint, regression pins (leak-pass, fo-command-center, kids-rewards slices — you
touch Hub + dashboards). Founder approval before EF deploys and before running shared
suites. NOTHING COMMITS until proof green AND founder confirms; selective staging.
Close-out: Checkpoint 5 zero-Missing across the WHOLE PRD (Phase A + B), verification table
copied to a claude/feature-decisions/PRD-42-Meal-Planning.md record, live_schema regen,
STUB_REGISTRY + WIRING_STATUS + CLAUDE.md (new convention: meal-planning contract + the
allergy always-include convention per D-42-4), LiLa knowledge updates, FeatureGuide on
/meals, archive the build file, feature-decisions README index row.
```
