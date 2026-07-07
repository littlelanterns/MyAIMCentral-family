# PRD-42: KitchenCompass — Recipes, Weekly Plans & Family Food Intelligence

> **Status:** APPROVED WITH RIDERS — designed 2026-07-06 (Fable design session); founder rulings D-42-1..7 recorded same day (see §14). D-42-8 (scope confirm) inferred-approved — founder's reply trailed off at item 8; two-phase v1 + Phase C stands unless she says otherwise.
> **Category:** daily-life
> **Working name:** **KitchenCompass** (founder pick 2026-07-06 — "at least the working name for now"; routes/keys stay `meals_*` regardless of final display name)
> **Number note:** PRD-39 is soft-earmarked in `MYAIM_GAMEPLAN_v2.2.md` for the Playwright Video Library; PRD-40 (COPPA) and PRD-41 (LiLa Runtime Ethics) exist. PRD-42 confirmed free by repo-wide grep 2026-07-06.
> **Dispatch pack:** `claude/dispatch-factory/PRD42.md`
> **Depends on (all built):** Lists/Shopping (PRD-09B Living Shopping List + Shopping Mode), Archives (PRD-13), Calendar (PRD-14B), Universal Scheduler (PRD-35), Family Hub (PRD-14D), MindSweep (PRD-17B), LiLa core (PRD-05), notifications (PRD-15), Universal Queue (PRD-17)
> **Feeds later (sockets/stubs):** Family Feeds (PRD-37), Compliance reporting (PRD-28B home-ec hours), BigPlans (PRD-29)

---

## 1. Vision & Product Summary

Mom captures the recipes her family actually eats — from a website link, a photo of a
handwritten card, pasted text, or a picture of tonight's dinner plus "here's what I did" in
her own words. The platform organizes them into a family Recipe Box, plans the week on a
drag-and-drop calendar, sends ingredients to the shopping lists the family already uses, and
— because LiLa knows this family's allergies, sensitivities, favorites, traditions, and busy
evenings — suggests meals that fit **this** family, not a generic audience.

Founder requirements (verbatim intent, all in scope):

- Add recipes as **website links, photos, or copy/paste text**.
- **Custom recipe scaling** (.5x, 1.5x, 2x, 3x, 4x, arbitrary) with the ability to **save
  scaled versions**. Standard scaling is pure client-side math — no AI call; AI assists only
  awkward conversions ("1 egg × 1.5").
- **"This went well" capture:** mom photographs something she made, types or speaks what she
  did in normal language, and it saves as a recipe.
- **Favorite Meals:** AI knows which suggestions to repeat and what goes together for THIS
  family.
- **Traditions:** recipes tied to holidays/traditions — "this is our Christmas-morning
  recipe" — surfaced when the occasion approaches.
- **Try Something New:** AI sees what the family already likes and suggests adjacent new
  things. Canonical use case: *"this is what my family currently likes; I'd like to add more
  whole foods and make it healthier."*
- Full AI access to family **food preferences, likes/dislikes, sensitivities, allergies**,
  and existing favorites.
- Fits the existing ecosystem — recipes route through MindSweep, ingredients route through
  the existing shopping-list machinery, food context lives with Archives, meal slots show on
  the Calendar/Hub, and LiLa gleans from all of it (Convention #247 attribute 3).

**What makes this superior to every meal app on the market** (full fold-in map in §12):
the meal plan lives inside the family's operating system. Kids tap-to-heart tonight's dinner
on the Family Hub and that trains the suggestion engine. Cooking with a kid logs homeschool
home-ec hours. A first solo dinner becomes a Victory. Grandma's recipe becomes a Tradition
that resurfaces every December. Aisle-sorted shopping already exists. No standalone meal app
can touch any of that.

---

## 2. Feature Name

**KitchenCompass** — founder pick 2026-07-06 (D-42-1), working name at minimum. Rejected:
TableSpread, GatherRound. Guidance framing; echoes GuidingStars.

All keys/routes are `meals_*` and `/meals` and do NOT change if the display name is ever
revisited (`meals_basic` stays `meals_basic`, exactly as `guiding_stars_basic` ≠
"GuidingStars"). UI strings use "KitchenCompass"; a single display-name constant makes any
future rename a one-line change.

---

## 3. Ecosystem Position — What Already Exists and What This PRD Does With It

This section is normative. The build inherits these; it must not create parallel machinery.

| Existing piece | State today | This PRD's ruling |
|---|---|---|
| **MindSweep `recipe` destination** (Conventions #180/#182/#276; `mindsweep-sort` classifies `recipe` with dual-route metadata `{recipe_to: 'archives', ingredients_to: 'list'}`) | Classifier works; items land in `studio_queue` and **dead-end** — `deployQueueItem.ts` skips recipe ("needs review context"); no destination surface exists | **Inherited and completed.** The dual-route TARGET changes: recipe body → `recipes` table (NOT archives — that mapping predates this PRD and is superseded), ingredients → shopping list. SortTab gets a Recipe card that opens the capture-review flow prefilled (§6.9). `deployQueueItem` continues to skip recipes — card-by-card review IS the HITM step and recipes always need it. Update the dual-route metadata in `mindsweep-sort` to `{recipe_to: 'recipes', ingredients_to: 'list'}`. |
| **Living Shopping List + Shopping Mode** (PRD-09B: `store_tags`, `store_category`, quantity/unit, purchase history, aisle lens, always-on lists) | Fully built and in production use | **The only grocery pipeline.** "Send ingredients to shopping list" writes `list_items` rows through existing hooks with `store_category` inferred at extraction time. Aisle-by-aisle categorization is NOT rebuilt — it exists. `purchase_history` prices later power budget estimates (§12.13). |
| **Archives Preferences + Health & Medical folders** (PRD-13; context assembly already topic-matches `food\|meal\|diet\|cook` → Preferences) | Built; auto-provisioned per member | **Likes/dislikes live HERE** as `archive_context_items` in the member's Preferences folder ("checked somewhere, checked everywhere" — Convention #75). The Food Profile screen (§6.7) is a fast writer INTO Archives, not a parallel store. Allergies/sensitivities get a NEW dedicated table (`food_restrictions`, §5.4) because they are a safety constraint with different inclusion semantics (§8.2). |
| **Calendar (PRD-14B) + `calendar_settings.week_start_day`** | Built | Meal plan week grid respects `week_start_day`. Activity-aware planning reads `calendar_events` for the visible week (evening events → "busy night" flag). Meals do NOT duplicate into `calendar_events` (same rule as tasks, Convention #112 spirit); an optional Calendar overlay reads `meal_plan_entries` directly. |
| **Universal Scheduler (PRD-35)** | Built | Theme nights ("Taco Tuesday") store RRULE JSONB in `meal_patterns.recurrence_details` (Conventions #23–#25). Never a custom recurrence picker. |
| **Family Hub (PRD-14D)** section machinery | Built; section keys graft at read time | New Hub section key `family_meals` ("What's for Dinner") — §6.8. |
| **Dashboard widgets (PRD-10)** | Built | New widget template `meal_plan` (Tonight + week strip) as data, not code (widget_starter_configs row). |
| **`useVoiceInput` + `whisper-transcribe`** | Built | "This went well" voice narration. |
| **`daily_holidays` (1502 rows) + calendar events** | Built | Tradition surfacing matches `tradition_tags` against upcoming holidays + family calendar events (§7.4). |
| **Embedding pipeline** (pgmq → `embed` EF → OpenAI; Convention #5) | Built, healthy | `recipes.embedding halfvec(1536)` via `util.queue_embedding_job()` trigger + `embed` TABLE_CONFIG entry. Never synchronous. |
| **LiLa** (Convention #247/#248) | Built | New guided mode `meal_planning` — **category 1 (LiLa-powered)**, registered in `lila_guided_modes` with non-empty `context_sources`, using `assembleContext()` with a new meal-context loader (§7.5). Stated explicitly per Convention #248: this tool participates in gleaning — kid hearts, went-well captures, and plan history make LiLa smarter about this family's food over time. |
| **Edge Function conventions** (one-tool-one-function; Zod; cost logging; `authenticateRequest` + `detectCrisis` per SAFETY-BETA-GATE; `_shared/openrouter-client.ts` no-training; safety preamble on prompt-building functions) | Built | Two new functions: `recipe-extract`, `meal-suggest` (§7). Both follow the full SAFETY-BETA-GATE pattern from birth. |
| **`family_today` / Convention #257** | Built (11 protected tables) | `meal_plan_entries.entry_date` is a **user-chosen planning date** (future-facing), NOT a "today" derivation — exempt from trigger derivation by design. Every "tonight/today" READ routes through `useFamilyToday`/`fetchFamilyToday`. `made_at` is TIMESTAMPTZ server-set. No new DATE column ever derives from a client clock. |
| **Family-shadow write policies** (Convention #276, FDWA pack) | Partial | Hub tap-to-heart and mark-made from family devices require `util.is_family_shadow_of()` policies on `meal_feedback` + `meal_plan_entries` (UPDATE status only). Coordinate with FDWA if it lands first. |
| **Homeschool time logs (PRD-28)** | Built, 0 rows | "Kids helped cook" writes `homeschool_time_logs` (minutes, home-ec subject) — an EVENT log (numerator), consistent with FGPZ Rider 2; never an inline obligations derivation (Convention #271). |
| **Victories (PRD-11) + AIR** | Built | Cooking milestones create victories (source `'meal_made'` added to victories source vocabulary). |
| **Family Feeds (PRD-37)** | NOT built | "Went well" photos → `family_moments` is a REGISTERED STUB owned by the PRD-37 build. Photos persist on the recipe/feedback rows now so nothing is lost. |

---

## 4. Core Concepts & Mental Model

1. **Recipe Box** — the family's recipe library. Every recipe is family-scoped, photo-first,
   HITM-reviewed on capture, embeddable, heart-toggleable for LiLa context.
2. **Meal Plan** — dated entries in slots (breakfast/lunch/dinner/snack/custom). An entry
   references a recipe OR is freeform ("Leftovers," "Pizza night out"). Planning is
   drag-and-drop; marking made is one tap.
3. **Food Profiles** — per-member: hard restrictions (allergies/sensitivities — dedicated
   table, always in AI context) and soft preferences (likes/dislikes — Archives items).
4. **Suggestion Engine** — embedding-first, three rails: *Favorites due for a repeat*
   (rotation-aware, $0), *Traditions coming up* (tag/date matching, $0), *Try Something New*
   (Haiku, grounded in the family corpus, whole-foods-shift aware).
5. **Feedback loop** — kid hearts (Hub tap), mom's rotation dial (favorite/normal/rest/
   retired), and times-made counts feed the engine. Celebration-only: kids can only express
   positives; "not again" is mom's quiet dial, never a kid-facing mechanic.

---

## 5. Data Model

All tables snake_case, RLS enabled, family-scoped. Migration numbers assigned at build time.

### 5.1 `recipes`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `family_id` | UUID FK families | |
| `created_by` | UUID FK family_members | |
| `title` | TEXT NOT NULL | |
| `description` | TEXT | |
| `source_type` | TEXT CHECK | `'link' \| 'photo' \| 'paste' \| 'went_well' \| 'manual' \| 'mindsweep'` |
| `source_url` | TEXT | original link when source_type='link' |
| `photo_urls` | TEXT[] | storage paths (Supabase Storage bucket `recipe-photos`, family-scoped path prefix) |
| `ingredients` | JSONB | `[{text, quantity, unit, item, store_category, optional, scaling_note}]` — `store_category` inferred at extraction for shopping handoff |
| `instructions` | JSONB | `[{step, text}]` |
| `prep_minutes` / `cook_minutes` / `total_minutes` | INTEGER | minutes as base unit (Convention #227 spirit) |
| `servings_base` | NUMERIC | the 1x serving count |
| `effort_level` | TEXT CHECK | `'quick' \| 'standard' \| 'project'` — powers activity-aware planning + one-tap swap |
| `equipment_tags` | TEXT[] | `slow_cooker`, `instant_pot`, `oven`, `no_cook`, `grill`, … |
| `tags` | TEXT[] | cuisine/meal-type/free tags |
| `tradition_tags` | TEXT[] | e.g. `['christmas_morning']` — free text, chip-edited |
| `texture_flavor_tags` | TEXT[] | sensory vocabulary (`crunchy`, `mild`, `saucy`…) — powers picky-eater bridging (§12.5) |
| `rotation` | TEXT CHECK DEFAULT 'normal' | `'favorite' \| 'normal' \| 'rest' \| 'retired'` — mom's quiet dial; `retired` never suggested, never shown to kids as such |
| `approval_status` | TEXT CHECK DEFAULT 'approved' | `'approved' \| 'suggested'` — teen-added recipes enter as `suggested` until mom approves (§8) |
| `times_made` | INTEGER DEFAULT 0 | denormalized counter, bumped by mark-made |
| `is_included_in_ai` | BOOLEAN DEFAULT true | Heart/HeartOff, Convention #8/#74 |
| `embedding` | halfvec(1536) | async queue trigger |
| `archived_at`, `created_at`, `updated_at` | | |

RLS: family members SELECT (all roles — recipes are family-shared; no kid-privacy affordance
per the standing no-hiding principle). INSERT: mom, adults; teens INSERT with
`approval_status='suggested'` enforced by WITH CHECK. UPDATE/DELETE: mom + `meal_planning`
grant (D-42-6); creator may edit own `suggested` rows.

### 5.2 `recipe_versions` (saved scaled/adapted versions)

`id`, `recipe_id` FK ON DELETE CASCADE, `family_id`, `label` TEXT ("Double batch for co-op"),
`scale_factor` NUMERIC, `servings` NUMERIC, `ingredients` JSONB (converted snapshot),
`notes` TEXT, `created_by`, `created_at`. RLS mirrors recipes.

### 5.3 `meal_plan_entries`

| Column | Type | Notes |
|---|---|---|
| `id`, `family_id` | | |
| `entry_date` | DATE | **user-chosen planning date** — exempt from #257 trigger derivation (it is not "today"); all "today" reads use `family_today` |
| `meal_slot` | TEXT CHECK | `'breakfast' \| 'lunch' \| 'dinner' \| 'snack' \| 'custom'` |
| `custom_slot_label` | TEXT | when slot='custom' |
| `recipe_id` | UUID FK nullable ON DELETE SET NULL | |
| `recipe_version_id` | UUID FK nullable | which saved version is planned |
| `title_snapshot` | TEXT NOT NULL | snapshot of recipe title at planning time (survives recipe deletion) OR the freeform text ("Leftovers: chili") |
| `status` | TEXT CHECK DEFAULT 'planned' | `'planned' \| 'made' \| 'skipped' \| 'moved'` — `skipped` is internal state only; UI language is always neutral ("didn't happen"), never shame |
| `made_at` | TIMESTAMPTZ | server `now()` at mark-made |
| `cook_member_id` | UUID nullable | who's cooking (teen volunteering, sous-chef) |
| `kids_helped_member_ids` | UUID[] DEFAULT '{}' | sous-chef credit → homeschool/victory hooks |
| `prep_task_id` | UUID nullable FK tasks | generated defrost/prep task link |
| `servings_planned` | NUMERIC | drives dynamic grocery scaling |
| `notes` | TEXT | |
| `created_by`, `created_at`, `updated_at` | | |

Multiple entries per (date, slot) allowed — main + side. No unique constraint.
RLS: family SELECT all roles; INSERT/UPDATE/DELETE mom + `meal_planning` grant; adults may
UPDATE `status`/`made_at`/`kids_helped_member_ids` (mark-made) without the grant;
family-shadow policy for Hub mark-made + hearts (Convention #276 pattern).

### 5.4 `food_restrictions` — the hard-constraint table

| Column | Type | Notes |
|---|---|---|
| `id`, `family_id` | | |
| `member_id` | UUID nullable | NULL = whole-family rule (e.g. "we keep kosher") |
| `restriction_type` | TEXT CHECK | `'allergy' \| 'intolerance' \| 'medical_diet' \| 'religious' \| 'strong_dislike'` |
| `item` | TEXT NOT NULL | "peanuts", "gluten", "red dye 40" |
| `severity` | TEXT CHECK | `'life_threatening' \| 'avoid' \| 'limit'` |
| `notes` | TEXT | |
| `created_by`, `created_at`, `updated_at` | | |

**Deliberately NO `is_included_in_ai` column.** This table is ALWAYS loaded into every
meal-AI context regardless of any toggle state — the inverted Privacy-Filtered pattern
(always-include for safety). Proposed as a new CLAUDE.md convention at build close-out
(D-42-4). RLS: SELECT all family roles (safety info is family knowledge); INSERT/UPDATE/
DELETE mom + granted adults.

### 5.5 `meal_feedback` — positive-only signals

`id`, `family_id`, `recipe_id` FK, `meal_plan_entry_id` nullable FK, `member_id` (who),
`feedback` TEXT CHECK (`'loved' \| 'liked'`) — **no negative values exist in the enum**
(celebration-only is enforced by the schema, not just the UI), `note` TEXT nullable
(mom's "went well" notes attach here), `photo_url` TEXT nullable, `acted_by` UUID nullable
(hub-device attribution), `created_at`. UNIQUE `(meal_plan_entry_id, member_id)` where
entry is non-null (idempotent taps). RLS: family SELECT; INSERT own-member + mom +
family-shadow; no UPDATE (append-only signals); DELETE mom.

### 5.6 `meal_patterns` — theme nights / recurring slots

`id`, `family_id`, `label` ("Taco Tuesday"), `meal_slot`, `recurrence_details` JSONB
(Universal Scheduler RRULE output, Convention #24), `suggestion_tag` TEXT nullable (fill the
slot from recipes tagged e.g. `tacos`) OR `recipe_id` nullable (always the same dish),
`is_active` BOOLEAN, `created_at`, `updated_at`. Instances expand on the fly via rrule.js
(Convention #25) and render as ghost entries on the plan until confirmed/filled.

### 5.7 `meal_settings` — per family

`family_id` PK, `enabled_slots` JSONB DEFAULT `["dinner"]` (Buffet: maximal options,
minimal default — dinner-only until mom adds more), `default_servings` NUMERIC,
`show_on_hub` BOOLEAN DEFAULT true, `kid_recipe_browsing` BOOLEAN DEFAULT false (Guided
shell recipe box access), `prep_reminders_enabled` BOOLEAN DEFAULT true,
`prep_reminder_time` TIME DEFAULT '19:00', `connection_prompts_enabled` BOOLEAN DEFAULT
false, `standing_direction` TEXT (mom's free-text steer for suggestions — "more whole
foods, healthier"), `nutrition_direction` TEXT (D-42-3 rider: mom's optional
nutrition/macro-flavored goals in her own words, e.g. "more protein at breakfast, less
sugar" — ALWAYS passed to meal-suggest context when set; **rendered ONLY on mom/granted-adult
surfaces, never on any kid-facing surface** — no tracking UI, no numbers, just AI
awareness), `use_up_note` JSONB (`{text, updated_at}` — the "use it up" box, §6.5; auto-ages
out of suggestion context after 14 days), `created_at`, `updated_at`. Week start day comes
from `calendar_settings.week_start_day` — NOT duplicated here.

### 5.8 `meal_pointers` — "how WE do it" family know-how (founder rider, D-42-6)

| Column | Type | Notes |
|---|---|---|
| `id`, `family_id` | | |
| `recipe_id` | UUID nullable FK ON DELETE CASCADE | set = pointer for this recipe |
| `technique_tag` | TEXT nullable | set = reusable technique note ("browning ground beef", "our rice ratio") — surfaces on ANY recipe whose ingredients/steps match the tag |
| `text` | TEXT NOT NULL | mom's pointer, her words ("Gideon: use the small skillet", "we do half the sugar") |
| `sort_order` | INTEGER | |
| `created_by`, `created_at`, `updated_at` | | |

CHECK: exactly one of `recipe_id` / `technique_tag` is non-null. Voice-addable (mic on the
editor). RLS: family SELECT all roles (the whole point is dad and the kids can read them
while cooking); INSERT/UPDATE/DELETE mom + `meal_planning` grant. Pointers persist across
every future making of the meal — captured once, reused forever.

### 5.9 Not built (explicit)

No `pantry_items`, no nutrition columns, no external-sync tables — see §11 dispositions.
No new columns on `list_items` (shopping handoff uses existing columns; recipe provenance
goes in `list_items.notes`).

---

## 6. Screens & Interactions

Top-level page at **`/meals`**, registered once in `getSidebarSections()` under **Plan & Do**
(Convention #16 — flows into BottomNav More automatically; mobile parity check at build).
Two tabs: **This Week** (default) and **Recipe Box**. Density: `density-compact` on browse
surfaces, `density-comfortable` on capture/review flows.

### 6.1 This Week (plan view)

- **Week grid** (default): days × enabled slots, week starts per `calendar_settings.week_start_day`.
  Desktop: 7 columns. Mobile: vertical day list, today auto-scrolled (via `useFamilyToday`).
- Each cell: entry card(s) — photo thumb, title, effort chip (quick/standard/project),
  cook avatar if assigned, heart-count badge after made. `+` in empty cells.
- **Drag-and-drop** between days/slots (@dnd-kit per universal convention; ⠿ handle on
  touch). Drop persists `entry_date`/`meal_slot`.
- **Busy-evening flags:** days whose `calendar_events` include late-afternoon/evening events
  show a small clock chip ("Busy evening"); the add-meal picker on those days pre-filters to
  `effort_level='quick'` OR `equipment_tags @> {slow_cooker}` — pre-filter only, never a
  restriction (Buffet).
- **Day view:** single day, slots stacked, larger cards, notes visible.
- **Month view:** compact dots/titles per day; tradition markers on matching holidays;
  tapping a date opens Day view (transient modal pattern consistent with Calendar's
  DateDetailModal behavior — Convention #108 spirit).
- **Entry tap →** entry sheet: view recipe (→ detail), **[Cook this]** (Cook View below),
  change servings, assign cook (member pills, `useAssignableMembers` scoping if a task is
  generated), "kids helped" pills, mark made / didn't happen / move, notes, remove.
- **Cook View** (founder rider, D-42-6): the cook-facing surface — large type, step-through
  instructions with **Family Pointers interleaved** (recipe-specific pointers pinned at top;
  technique pointers surface beside matching steps/ingredients), scaled quantities for the
  entry's `servings_planned`, "Add a pointer" (text + mic) so mom can capture know-how in
  the moment and it's saved for every future making. Readable by whoever's cooking — dad,
  a teen, a Guided kid at mom's side. Reading-support-friendly (larger targets, no dense
  prose).
- **Mark made:** one tap → `status='made'`, `made_at=now()`, `times_made++` → follow-up
  strip: "Plan leftovers tomorrow?" (creates freeform entry `Leftovers: {title}`) ·
  "Kids helped?" (member pills → `kids_helped_member_ids` → optional homeschool minutes
  prompt, §12.1) · camera icon ("Snap it for the memory book" → `meal_feedback.photo_url`).
- **Didn't happen:** neutral copy, offers "Move to tonight / pick a day / let it go." Never
  auto-reschedules silently; never counts, streaks, or shames (celebration-only).
- **Toolbar:** MiniCalendarPicker (shared component), view switcher, **[Send week to
  shopping list]** (§6.6), **[Suggestions]** (§6.5), overflow → meal settings.
- **One-tap swap:** entry overflow → "Swap this meal" → 3 alternatives ranked client-side by
  embedding similarity + matching effort_level + restriction-safe + rotation-aware. $0 — no
  model call. Tap replaces entry (old recipe unaffected).
- **Ghost entries** from `meal_patterns` ("Taco Tuesday") render dashed; tap → "Fill it":
  suggestion-tag matches or the fixed recipe; confirm materializes a real entry.
- **Empty state:** warm — "Nothing planned yet. Start with tonight." + [Plan a meal] +
  [What does my family love? →] (opens suggestions; if Recipe Box empty, routes to capture).

### 6.2 Recipe Box

- Grid/list toggle. Cards: photo, title, effort chip, total_minutes, heart-count,
  "Made 12×", tradition chip if tagged, `Suggested by {teen}` badge on `approval_status='suggested'`.
- **Search:** keyword (title/tags/ingredients) + semantic (query embedding vs
  `recipes.embedding` via a `match_recipes` RPC) merged.
- Filter chips: Favorites · Traditions · Quick (≤30 min) · Slow cooker · New (never made) ·
  tags. Filters compose.
- Sort: recently added / most made / A-Z.
- `+ Add Recipe` → capture modal (§6.3).
- **Empty state:** the three capture tiles rendered inline ("Add your first recipe — paste
  it, snap it, or link it") + "Or tell LiLa what you made last night that went well."

### 6.3 Recipe Capture (ModalV2, persistent type — survives minimize)

Four entry tiles:

1. **Link** — paste URL → `recipe-extract` fetches + structures. Failure (paywall/bot-wall/
   non-recipe page) → friendly fallback: "That site wouldn't share. Copy the recipe text and
   paste it instead?" with the paste pane pre-opened. Input preserved.
2. **Photo** — camera or upload (multi-photo for card front/back) → vision extraction.
   Unreadable → "I couldn't read that one — try a closer shot, or type what you can see."
3. **Paste** — freeform text box → extraction. This is also where MindSweep recipe queue
   items arrive prefilled (§6.9).
4. **This Went Well** — camera first ("Snap what you made"), then "What did you do?" —
   text box + mic (`useVoiceInput` → `whisper-transcribe`). Extraction structures mom's
   natural language into ingredients/steps *as she described them* — loose is fine; the
   review step says "I kept it the way you said it. Fill in more anytime."

All four converge on the **HITM review card** (Convention #4): every extracted field
editable inline (title, ingredients rows with qty/unit/item/store_category, steps, times,
servings, tags), confidence-shaded fields for low-certainty extractions, then
**Edit / Approve / Regenerate / Reject**. Approve inserts the `recipes` row (+ photo upload)
and offers: "Add to this week?" / "Send ingredients to a shopping list?" Nothing persists
before Approve.

### 6.4 Recipe Detail

- Hero photo (right-click disabled not required — recipes are the family's own content),
  meta row (times, servings, effort, equipment), tags + tradition chips (chip editor),
  texture/flavor chips, Heart (`is_included_in_ai`) with the standard summary line on the
  Recipe Box page ("LiLa is drawing from X/Y recipes").
- **Scaling stepper:** presets `.5× 1× 1.5× 2× 3× 4×` + free-numeric input. Client-side
  pure math re-renders quantities live. Rows the math can't cleanly scale (unit-less "1 egg",
  "1 can", "salt to taste") get an amber dot + sensible display ("1–2 eggs", unchanged for
  to-taste) and a one-tap **"Smooth these with AI"** (single Haiku call via `recipe-extract`
  `mode:'scale_assist'`, HITM-reviewed) — optional, never automatic.
- **[Save this version]** → label prompt → `recipe_versions` row. Versions list under the
  stepper; planning an entry can pick a version.
- **[Add to plan]** → date + slot picker (defaults: next empty dinner).
- **[Send ingredients to shopping list]** → §6.6 flow scoped to this recipe.
- **Kid hearts strip:** avatars of members who hearted, celebration copy ("Loved by Ruthie
  and Gideon").
- **Family Pointers section** (D-42-6): mom's "how WE do it" notes for this recipe +
  matching technique pointers, chip-tagged, mic-addable, drag-reorderable. Editable by mom +
  granted adults; readable by everyone (that's the point — instructions for dad and the
  kids). [+ New technique note] creates a reusable `technique_tag` pointer.
- **Made-it history:** timeline of `made` entries + `meal_feedback` photos/notes.
- **Mom's rotation dial** (mom + granted only): Favorite / Normal / Rest for now / Retire.
  Quiet control — no kid-facing surface ever shows "retired."
- Teen-suggested recipes show an **[Approve]** bar for mom (flips `approval_status`); until
  approved they don't enter suggestions or plans. No visible "reject" — mom can quietly
  archive (celebration-only; the teen's box shows their suggestion as "waiting for mom").

### 6.5 Suggestions ("What should we make?")

Drawer/panel off This Week. At the top, the **"Use it up" box** (founder rider, D-42-7
compromise): *"Anything you want to use up first, or anything you have on hand you'd like
to use?"* — text + mic input, no camera, no inventory system. Contents persist to
`meal_settings.use_up_note`, feed every suggestion call while fresh (14-day age-out,
one-tap clear), and matching cards show a "uses your zucchini" chip. The camera-scan
version stays a PlannedExpansionCard (§11.7).

Three rails:

1. **Favorites due for a repeat** — $0: rotation-aware ranking (favorite-weighted, recently
   made downweighted, restriction-safe always).
2. **Traditions coming up** — $0: `tradition_tags` matched against next-30-day
   `daily_holidays` + family `calendar_events` titles (embedding-assisted match). "Christmas
   morning is in 12 days — Grandma's cinnamon rolls?"
3. **Try Something New** — Haiku: compact context = restriction list (always), preference
   items, top favorites (titles + tags only), mom's `standing_direction` (seeded from the
   canonical use case: "more whole foods, healthier"), her `nutrition_direction` when set
   (D-42-3 rider — AI-aware of mom's nutrition goals in her words; never surfaced on kid
   views, never numeric tracking), the `use_up_note` while fresh, texture notes for
   picky-eater bridging. Returns 3–5 idea cards (title, why it fits: "adjacent to your
   tacos — same flavors, whole-grain swap"). **Ephemeral until accepted** (HITM): accepting
   a card opens the capture review with the idea pre-structured → mom approves → it becomes
   a real recipe (tag `new_try`) and optionally lands on the plan.
4. Every AI card carries the standard regenerate/reject affordances; every rail is
   restriction-filtered BEFORE display (hard constraint, §8.2).

Empty states: <3 recipes → rails collapse to "Add a few family favorites first so I can
learn your taste" + capture shortcut. No restrictions on file → banner: "Add any allergies
first — I'll always plan around them" → §6.7.

### 6.6 Send to Shopping List

From a recipe, a week, or selected entries:

1. Build ingredient set; multiply by `servings_planned / servings_base` per entry (dynamic
   grocery scaling).
2. **Merge review screen** (this is the HITM for the batch): identical items combined
   ("onions ×3 — from Chili and Fajitas"), each row editable/toggleable, `store_category`
   shown as chips, "already have it" toggle per row (mom's manual pantry check — no
   inventory system), list picker (defaults to the family's shopping list; respects existing
   list-share scoping).
3. Confirm → `list_items` INSERTs through existing list hooks (quantity, unit,
   store_category, notes = "for {recipe} · {date}"). Results toast: "14 items added to
   Groceries." From there the existing Living Shopping List + Shopping Mode take over
   entirely.

### 6.7 Food Profiles

Reached from meal settings + a first-run banner. Per-member cards (roster order, member colors):

- **Restrictions block** (writes `food_restrictions`): type, item, severity, notes. Reads as
  a safety card — always-on copy: "LiLa always plans around these. This can't be turned off."
- **Likes/dislikes quick-add** (writes `archive_context_items` into that member's
  Preferences folder, `context_field` prefixed food-taxonomy): two chip inputs — "Loves…" /
  "Not a fan of…". Items show with the standard Heart toggle (they're normal Archives items;
  Convention #75 write-back applies).
- Whole-family row for family-level rules (kosher/halal/vegetarian household) → `member_id NULL`.
- Empty state: "Start with allergies — then teach LiLa your family's tastes."

### 6.8 Family Hub — "What's for Dinner" section (`family_meals`)

- Tonight's entries (per `family_today`), photo-forward, slot labels. Play-friendly: image
  dominates, minimal text.
- After an entry is marked made: **tap-to-heart** appears — member avatar picker (like the
  Hub tally pattern) → pick yourself → heart animation → `meal_feedback` row (`acted_by`
  attribution on family devices). Idempotent per member.
- Optional line under tonight's dinner when `connection_prompts_enabled`: a table-talk
  prompt (static curated pool, faith-aware via `faith_preferences.relevance_setting`;
  Haiku-personalized later — pool ships first, same pattern as Convention #177).
- Section key grafts into `family_hub_configs.section_order` at read time; mom-configurable
  visibility; hidden when no entries this week (warm empty state on mom's view only).

### 6.9 Universal Queue — Recipe cards (SortTab)

`studio_queue` rows with `destination='recipe'` (from MindSweep/Notepad) render a Recipe
card: preview of captured text/scan → **[Review & Save]** opens capture modal, Paste pane
prefilled → normal extraction + HITM → on save, offer ingredient routing (dual-route
fulfilled) → queue row marked processed. **[Not a recipe]** reroutes via RoutingStrip.
"Deploy all" continues to skip recipes (engine contract unchanged — context needed).

### 6.10 Dashboard widget (`meal_plan` template)

Tonight + 7-day strip, tap-through to `/meals`. Widget template as data
(`widget_starter_configs` row, canonical category per ST-E scheme). Available to mom/adult
dashboards; Guided/Play see meals on Hub + their dashboard section instead (below).

### 6.11 Guided/Play surfaces

- **Guided dashboard:** "Tonight's dinner" line in the existing calendar/day area (read-only,
  photo + title). If `kid_recipe_browsing=true`, Recipe Box is reachable read-only (no
  capture, no plan edit). Hearts only via Hub or their dashboard line post-made.
- **Play shell:** no meals page. Hub section only — picture + big heart tap. 56px targets,
  Lucide icons, zero text dependence.
- **Independent teen:** full read of plan + Recipe Box; may add recipes (→ `suggested`);
  may volunteer as cook on an entry (sets `cook_member_id=self`); hearts; no plan
  restructuring, no settings, no restriction editing.

---

## 7. AI Architecture & Cost Model

### 7.1 `recipe-extract` Edge Function (dedicated — one-tool-one-function)

Modes: `link` (server-side fetch + readability strip → Haiku), `photo` (Haiku vision),
`paste` (Haiku), `went_well` (Haiku, "preserve mom's voice" prompt), `scale_assist` (Haiku,
tiny). Zod-validated I/O against the recipe schema; `authenticateRequest`; `detectCrisis`
on all free-text input; `buildSafetyPreamble` prepended (it builds prompts); shared
no-training OpenRouter client; costs → `ai_usage_tracking` (`feature_key='recipe_extract'`).
Category-2 native utility (own function, NOT in `lila_guided_modes`) — stated per
Convention #248. HITM always happens client-side after it returns.

### 7.2 `meal-suggest` Edge Function (dedicated)

Only the **Try Something New** rail calls a model (Haiku). Favorites + Traditions rails and
one-tap swap are DB/embedding queries (RPCs), zero model cost. Restriction list is injected
into every prompt AND re-filtered on output (dual enforcement, the Convention #98 pattern).
System-prompt rules: whole-foods shifts framed as swaps-from-favorites; never diet-culture
language, never body talk; picky-eater bridging uses texture/flavor adjacency. When mom's
`nutrition_direction` is set, the model honors it QUALITATIVELY ("higher-protein twist on
your usual pancakes") — no calorie counts, no macro numbers, no tracking output, ever; and
nothing nutrition-flavored renders on any kid surface (D-42-3). Same
auth/crisis/no-training/cost-log scaffold. Category-2 utility.

### 7.3 `meal_planning` LiLa guided mode (category 1)

Registered in `lila_guided_modes`, `context_sources=['meal_context']`, real system prompt
(purpose + off-purpose redirect per NEW-C standard), safety preamble inherited. New loader
in `_shared/context-assembler.ts`: **food_restrictions (ALWAYS, toggle-independent — the
one sanctioned inversion, D-42-4)** + Preferences food items (toggle-respecting) + top
hearted/most-made recipe titles + this week's plan + upcoming tradition matches. Layer 2
trigger joins the existing `food|meal|diet|cook` topic pattern. Mom/adult (+teen
read-oriented) availability. Conversational plan suggestions are ephemeral until mom
accepts them into the plan (HITM).

### 7.4 Tradition & holiday matching

Nightly-computed (or on-page-load) match of `tradition_tags` against next-30-day
`daily_holidays` names + family `calendar_events` titles, embedding-assisted for fuzzy
matches ("resurrection rolls" ↔ Easter). Zero model calls.

### 7.5 Cost model (per family / month, non-metered envelope)

| Operation | Model | Est. volume | Est. cost |
|---|---|---|---|
| Recipe extraction (paste/link) | Haiku ~3k in / 1k out | 12/mo | ~$0.05 |
| Recipe extraction (photo/went_well, vision) | Haiku vision | 6/mo | ~$0.06 |
| Try Something New | Haiku ~3k in / 800 out | 6/mo | ~$0.03 |
| scale_assist | Haiku tiny | 4/mo | ~$0.01 |
| Embeddings (recipes + queries) | text-embedding-3-small | 20 docs + 40 queries | <$0.01 |
| Favorites/Traditions/swap/allergen checks | none (pgvector + SQL) | — | $0.00 |
| **Total** | | | **≈ $0.15/family/mo** |

Whisper voice notes ride the existing non-metered transcription path. LiLa `meal_planning`
conversations are Sonnet-metered like every other mode (PRD-31), outside this envelope.
**Fridge scanner (later slice): Sonnet vision ≈ $0.02–0.04/scan — tier-gated Full Magic +
per-use metered; never in the base envelope.** Comfortably inside <$1/family/mo
(embedding-first principle holds: ~90% of engine activity is $0).

---

## 8. Permissions — All Five Roles

### 8.1 Role matrix

| Capability | Mom | Additional Adult | Independent (teen) | Guided | Play |
|---|---|---|---|---|---|
| View plan / Recipe Box | ✅ | ✅ | ✅ | Tonight's dinner; Recipe Box read-only if `kid_recipe_browsing` | Hub picture only |
| Add recipes | ✅ | ✅ | ✅ as `suggested` | ❌ | ❌ |
| Edit/archive recipes, rotation dial | ✅ | grant | own `suggested` only | ❌ | ❌ |
| Plan entries (add/move/remove), patterns, settings | ✅ | `meal_planning` grant (family-wide, explicit-grant-only — Convention #274 shape; profiles never touch it) | ❌ | ❌ | ❌ |
| Mark made / kids-helped / leftovers | ✅ | ✅ (no grant needed) | own-cook entries | ❌ | ❌ |
| Volunteer as cook | ✅ | ✅ | ✅ (self only) | ❌ | ❌ |
| Hearts | ✅ | ✅ | ✅ | ✅ (Hub/dashboard) | ✅ (Hub tap) |
| Food restrictions edit | ✅ | grant | ❌ (view own + family) | ❌ | ❌ |
| Preferences quick-add | ✅ (any member) | own + grant | own | ❌ (mom records) | ❌ |
| AI capture/suggestions | ✅ | ✅ | capture only (→ suggested) | ❌ | ❌ |

Special Adults: no meals access in v1 (consistent with Meetings posture, Convention #236);
"what to feed the kids on my shift" is a registered SAEX-adjacent stub. View As: standard
identity-scope behavior; nothing here is kid-private (meal data is family-shared —
`filterKidPrivate` untouched; no new kid-privacy affordances per the standing principle).

### 8.2 The allergy inversion (proposed convention)

`food_restrictions` ignores the three-tier `is_included_in_ai` system in the
**always-include** direction: no toggle can remove a restriction from meal-AI context, and
suggestion output is post-filtered against it as a second layer. Mirror image of Privacy
Filtered (Convention #76): that one is "never include regardless of toggles"; this is
"always include regardless of toggles," justified only by physical safety. Scope: meal
surfaces + the `meal_planning` loader (not a general context change). Proposed as a
numbered convention at close-out (D-42-4).

### 8.3 Feature keys

`meals_basic` (box + plan + shopping handoff), `meals_ai_capture`, `meals_suggestions`,
`meals_hub_section`; future: `meals_fridge_scan`, `meals_cookbook_export`. Registered in
`feature_key_registry`, gated with `<PermissionGate>`/`useCanAccess()` (beta bypass per
Convention #10). Proposed tiers (chart-owned, not hardcoded — Convention #256): Essential =
basic + capture; Enhanced = suggestions + Hub section; Full Magic = fridge scan.

---

## 9. Edge Cases

1. **Link extraction fails** (paywall/bot-wall/JS-only) → fallback-to-paste flow, input
   preserved, never a raw error (Error Handling convention).
2. **Photo unreadable** → retry guidance + manual-entry escape; partial extraction keeps
   whatever was legible with confidence shading.
3. **Non-linear scaling** ("1 egg × 1.5", "to taste", "1 can") → amber-dot rows + display
   heuristics + optional `scale_assist`; never silently produce "1.5 eggs."
4. **Recipe deleted while planned** → FK SET NULL; entry survives on `title_snapshot`;
   detail affordances degrade gracefully ("recipe no longer in your box").
5. **Allergen conflict on manual plan/capture** — fuzzy ingredient match against
   `food_restrictions` → warning banner ("Contains peanuts — Ruthie's allergy"), **never a
   block** (mom decides; maybe Ruthie's away that night). AI suggestion paths hard-filter;
   manual paths warn.
6. **Duplicate capture** — embedding similarity ≥ threshold on save → "Looks a lot like
   {existing}. Keep both / open that one instead." Never silent dedupe.
7. **Missed meals** — no silent auto-reschedule ever; yesterday's `planned` entries show a
   quiet "Still want this? Move to tonight / pick a day / let it go." Neutral copy.
8. **Leftover conversion** — mark-made follow-up creates freeform next-day entry; no
   inventory pretensions.
9. **Timezones/devices** — every "today/tonight" read via `family_today`; `made_at`
   server-set; the tour must include the evening-hour class check (Convention #257(c)
   pre-work gate applies since this feature stores dates).
10. **Teen suggestion never approved** — stays visible to the teen as "waiting for mom";
    mom's quiet archive removes it without a rejection event (celebration-only).
11. **Hub heart race/duplicate taps** — UNIQUE constraint absorbs; UI idempotent.
12. **Week with zero recipes but patterns active** — ghost entries render with "Fill it"
    even when the box is sparse; filling falls back to capture.
13. **`servings_planned` changed after list sent** — no retroactive list mutation; the merge
    review is the commit point (toast notes this on re-send: "already-sent items won't
    double — review the merge").
14. **Multi-family-member cook conflict** — last write wins on `cook_member_id`; entry sheet
    shows current cook; no locking needed at family scale.

---

## 10. Non-Negotiables Checklist (build-blocking)

- HITM on every persisting AI output: extraction review, suggestion acceptance, scale_assist
  (Convention #4). Conversational/ephemeral suggestions exempt until accepted.
- Embedding-first engine; Haiku only where listed; Sonnet only in metered LiLa mode + gated
  scanner. Envelope ≈ $0.15/mo (§7.5).
- `is_included_in_ai` on recipes with page summary line; Heart/HeartOff only (never Eye).
- RLS on all seven tables incl. family-shadow policies where Hub writes; snake_case; no
  nautical names; append-only `meal_feedback`.
- Lucide only, zero emoji; zero hardcoded colors; density classes; ModalV2; drag-to-reorder
  conventions; horizontal-scroll arrows on chip rows.
- Celebration-only: schema-level positive-only feedback; neutral missed-meal copy; no
  streaks/guilt anywhere; no diet-culture or body-talk language in any prompt or UI string.
- Buffet: dinner-only default slots, everything expandable; suggestion filters are
  pre-filters never restrictions.
- Templates as data: widget starter config, connection-prompt pool, slot definitions.
- Mobile-first 375px; BottomNav parity via `getSidebarSections` single registration.
- Edge Functions: dedicated per tool, Zod, auth, crisis gate, safety preamble, no-training
  client, cost logging.
- No external attribution in UI text.

---

## 11. External Requirements — Dispositions

Founder-supplied research list; each mapped to **build-internal** / **adapt-onto-platform** /
**PlannedExpansionCard** (PRD-32A, Convention #31):

| # | Requirement | Disposition | Rationale |
|---|---|---|---|
| 1 | Bi-directional Google/Apple/Cozi calendar sync | **PlannedExpansionCard** | Calendar sync is a platform-level PRD-14B Phase 1 concern; never built per-feature. Card collects demand + notify-me. |
| 2 | Auto-rescheduling missed meals; leftover conversion | **Build-internal (adapted)** | As one-tap human affordances (§9.7–9.8), never silent automation — silent rescheduling is how apps erode trust. |
| 3 | Smart reminders (defrost tonight, slow-cooker prep) | **Build-internal** | Night-before notification (existing pipeline, category `tasks`/new `meals`) + optional generated prep task (`source='meal_prep'`) that participates in routines/gamification — better than a push. |
| 4 | Activity-aware planning (soccer 6 PM → quick meals) | **Build-internal** | Reads `calendar_events` for the week; busy-evening flags + effort pre-filter (§6.1). |
| 5 | Per-member profiles: allergies, dislikes | **Build-internal** | `food_restrictions` + Archives Preferences (§5.4, §6.7). |
| 5b | Calorie/macro goals | **AI-awareness only (build-internal) + PlannedExpansionCard for tracking** | Founder ruling D-42-3: no tracking surfaces in v1 ("later or never"); kids NEVER see calorie/macro anything; BUT the AI is aware when mom sets `nutrition_direction` in her own words (§5.7, §7.2) — qualitative honoring, no numbers. Numeric tracking = adults-only demand card. |
| 6 | Hybrid macro + kid-portion plan generation | **PlannedExpansionCard** | Depends on 5b tracking; same card family. |
| 7 | Fridge Cleanout scanner (receipts/fridge photo → recipes) | **Compromise built now + camera card later** | Founder ruling D-42-7: v1 builds the "Use it up" text/voice box (§6.5) — same job, no camera, ~$0. The photo-scan version stays a PlannedExpansionCard (Full Magic + metered when built — Sonnet vision cost). |
| 8 | Batch-cooking logic (double bases early in week) | **Build-internal (lite)** | Suggestion-rail hint tied to busy-day detection ("Double this Monday — Thursday's packed"). Freezer inventory NOT built (rides pantry card). |
| 9 | Push grocery to Instacart/Walmart carts | **Build — Phase C slice** (founder upgraded from demand card, 2026-07-06: "really intrigued") | Instacart Developer Platform is an official public API: we send the list, get back a link, mom taps "Shop this on Instacart," items arrive matched in her cart at her chosen store (Aldi included) and she checks out herself — no credentials shared. Walmart = affiliate add-to-cart deep links + product-search SKU matching (clunkier; needs an item-match review step). Sequence: Instacart first, Walmart second. Ops prerequisite: founder signs up for both developer/affiliate programs (free). Item matching gets a review screen before handoff (HITM spirit). |
| 9b | AnyList/Todoist/iOS Reminders push | **Never-build** | Our Living Shopping List replaces them outright. |
| 10 | Aisle-by-aisle categorization by store layout | **Adapt — already exists** | Shopping Mode aisle lens + `store_category` (PRD-09B). Extraction populates `store_category`; zero new UI. |
| 11 | Pantry inventory subtracting owned items | **PlannedExpansionCard** | High-maintenance pattern most moms abandon; the merge-review "already have it" toggle (§6.6) covers 80% at 2% of the cost. Validate before building. |
| 12 | Dynamic grocery scaling when servings change | **Build-internal** | `servings_planned/servings_base` math in the send-to-list flow (§6.6). |
| 13 | Tri-view (daily / weekly drag-drop / monthly themes+budget) | **Build-internal** (views); budget overlay later | Day/Week/Month in v1 (§6.1); month budget estimate joins with §12.13 once `purchase_history` has data. |
| 14 | One-tap meal swap (3 alternatives matching prep + profile) | **Build-internal** | Embedding + attribute ranking, $0 (§6.1). |

---

## 12. Beyond the Market — Mom/Family Differentiators and Where They Fold In

Ranked additions no competitor can match, each with its fold-in point:

1. **Cooking counts for homeschool.** "Kids helped" on mark-made → optional
   `homeschool_time_logs` minutes (home-ec subject). Event-log write (numerator; FGPZ Rider-2
   consistent). *Fold: mark-made follow-up strip, Slice 3.* Unique: no meal app talks to a
   compliance reporter (PRD-28B consumes this later).
2. **Sous-chef as a real task.** Assign a kid a cooking role → optional `tasks` row
   (allowance/gamification flags mom-controlled, `useAssignableMembers` scoping). *Fold:
   entry sheet, Slice 3.*
3. **First-solo-dinner Victory + memory photos.** Cooking milestones → `victories`
   (`source='meal_made'`); went-well photos persist now and flow to `family_moments` when
   PRD-37 ships (registered stub). *Fold: mark-made flow, Slice 3.*
4. **Tap-to-heart on the Family Hub.** Kids give rate-free positive feedback on the family
   device; hearts train the suggestion engine. *Fold: `family_meals` Hub section, Slice 2.*
5. **Picky-eater bridges (sensory-aware).** `texture_flavor_tags` + adjacency framing in
   Try Something New ("Gideon likes crunchy — baked chickpea 'croutons' next to the soup").
   Purpose-built for the disability/sensory-kid audience this platform serves. *Fold:
   suggestion prompt + tags, Slice 4.*
6. **Whole-foods shift without a lecture.** Mom's standing direction field; suggestions
   framed as swaps of existing favorites; zero diet-culture language by prompt law. *Fold:
   `meal_settings` + meal-suggest prompt, Slice 4.* (The founder's canonical use case.)
7. **Traditions as first-class memory.** Tradition tags + holiday/calendar surfacing;
   heirloom recipes resurface themselves. *Fold: Slice 1 (tags) + Slice 4 (surfacing).*
8. **Grandma pipeline.** Out of Nest relatives send recipes via the family sweep email
   (rides MindSweep email intake once DNS lands — MSWP ops item) or mom captures from
   Content Corner links; enters as a queue Recipe card. *Fold: §6.9 already covers it; no
   extra build.*
9. **Theme nights.** "Taco Tuesday" via Universal Scheduler patterns with ghost-entry
   fill. *Fold: `meal_patterns`, Slice 5.*
10. **Dinner-table connection prompts.** Optional table-talk prompt beside tonight's dinner
    on the Hub; faith-aware. Meal apps feed stomachs; this one feeds the conversation.
    *Fold: Hub section toggle + curated pool, Slice 5.*
11. **Defrost as a routine step, not a nag.** Prep reminders can be real tasks that play in
    the family's existing routine/reward machinery. *Fold: Slice 5 with #3-adjacent
    notification work.*
12. **"What's for dinner?" self-serve.** The Hub answers the 5 PM question; Play kids see a
    picture. *Fold: Slice 2.*
13. **Budget from YOUR store, not a database.** Week-cost estimate from the family's own
    `purchase_history` prices (already collected by Living Shopping List). *Fold: Slice 5
    (behind a data-sufficiency check), month-view overlay later.*
14. **Allergy-safe potluck card.** Printable dish card ("contains / free of") for co-ops and
    grandparents' houses. *Fold: PlannedExpansionCard in v1; tiny later slice.*
15. **Family Cookbook keepsake.** Traditions + went-well photos + "in mom's words" notes →
    printable heirloom cookbook (PDF export). *Fold: PlannedExpansionCard in v1
    (`meals_cookbook_export`) — high demand-validation + marketing value; build post-beta.*
16. **Family Pointers — "how WE do it."** Mom's know-how attached to recipes and reusable
    techniques, interleaved into a big-type Cook View so dad or a kid can make the meal the
    family's way without mom standing over the stove. Captured once (typed or spoken),
    served every future time. *Fold: `meal_pointers` + Cook View, Phase A (founder rider
    D-42-6).* No competitor has family-institutional-knowledge as a first-class object.
17. **"Use it up" planning without inventory theater.** Tell it what's in the fridge in a
    sentence; suggestions bend toward it. Waste reduction without the pantry-database chore
    that makes moms abandon other apps. *Fold: Suggestions drawer box, Phase B (founder
    rider D-42-7).*

---

## 13. Stubs & Later Slices (registered at build close-out)

| Item | Owner |
|---|---|
| **Instacart cart export** (official Developer Platform link handoff + item-match review) | **Phase C slice, this PRD** (founder-upgraded 2026-07-06; ops prereq: dev-account signup) |
| **Walmart cart export** (affiliate add-to-cart deep links + SKU matching) | Phase C slice, after Instacart |
| Fridge Cleanout camera scanner (`fridge-scan` EF, Full Magic, metered) | PEC in v1; build only on demand signal ("Use it up" box covers the job meanwhile) |
| Family Cookbook export | Later slice / PEC-validated |
| Pantry inventory | PEC-validated only |
| Nutrition tracking (adults) | PEC-validated only (AI-awareness via `nutrition_direction` ships in v1) |
| Google/Apple/Cozi calendar sync | PEC (platform-level, PRD-14B concern) |
| `family_moments` photo routing | PRD-37 build |
| Home-ec hours in compliance reports | PRD-28B build |
| Special Adult "shift meals" view | SAEX follow-up |
| Connection-prompt Haiku personalization | Post-pool polish |
| Allergy potluck card | Tiny later slice |

## 14. Founder Decision Record (resolved 2026-07-06)

| # | Decision | Ruling |
|---|---|---|
| D-42-1 | Name | **KitchenCompass** (working name at minimum; TableSpread/GatherRound rejected) |
| D-42-2 | Number | PRD-42 ("whatever is available" — PRD-39 stays earmarked for the video library) |
| D-42-3 | Calories/macros | Tracking = "later or never" plan (adults-only PEC). **Kids never see calorie/macro surfaces — standing rule.** RIDER: AI must be AWARE of mom's nutrition-type goals when she sets them → `nutrition_direction` field, qualitative honoring only, mom/adult surfaces only. |
| D-42-4 | Allergy always-include inversion | **Agreed** — new numbered convention at build close-out. |
| D-42-5 | Grocery-cart integrations | **UPGRADED**: founder "really intrigued" by Instacart/Walmart cart export → Phase C build slice (Instacart first — official API, covers Aldi; Walmart second). AnyList/Todoist never-build. Calendar sync stays a PEC. |
| D-42-6 | Adult/kid involvement | Anyone with permissions, yes — kids involved with meals. RIDER: **Instructions/Family Pointers** — cook-facing instructions telling dad or the kids how to do it, mom-addable pointers saved for every future making (recipe-specific + reusable technique notes) → `meal_pointers` + Cook View, Phase A. |
| D-42-7 | Fridge scanner | Demand card stays; **compromise built now**: "Anything you want to use up first, or anything you have on hand you'd like to use?" text/voice box feeding suggestions (§6.5). |
| D-42-8 | v1 scope (Phases A+B, Phase C follow) | **Inferred approved** — founder's reply trailed off at item 8 with no objection; she endorsed the differentiator list ("I love all the suggestions. Especially the dinner conversation prompts"). Flag: confirm explicitly at Phase A pre-build gate. |
