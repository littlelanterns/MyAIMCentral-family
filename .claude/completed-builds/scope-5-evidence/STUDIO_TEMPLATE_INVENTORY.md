# Studio Creation Inventory

> Produced 2026-04-19 by Scope 5 walk-through.
> Purpose: Serve as the agenda for a future session where the founder will define
> intended click-to-deploy behavior for each entry, feeding the Universal Setup
> Wizards workstream. Audit-only — no design decisions made here.
>
> Source files traced:
> - [src/pages/Studio.tsx](../src/pages/Studio.tsx) (1078 lines)
> - [src/components/studio/studio-seed-data.ts](../src/components/studio/studio-seed-data.ts) (792 lines)
> - [src/hooks/useWidgets.ts](../src/hooks/useWidgets.ts#L118-L130) (`useWidgetStarterConfigs`)
> - DB seeds:
>   - [supabase/migrations/00000000000027_seed_studio_templates.sql](../supabase/migrations/00000000000027_seed_studio_templates.sql) — task/list templates
>   - [supabase/migrations/00000000100032_seed_widget_starter_configs.sql](../supabase/migrations/00000000100032_seed_widget_starter_configs.sql) — initial 10 widget starters
>   - [supabase/migrations/00000000100056_prd10_phase_b2_starter_configs.sql](../supabase/migrations/00000000100056_prd10_phase_b2_starter_configs.sql) — 35 Phase B2 widget starters
>   - [supabase/migrations/00000000100063_prd10_hub_widget_starter_configs.sql](../supabase/migrations/00000000100063_prd10_hub_widget_starter_configs.sql) — 1 Countdown starter
>   - [supabase/migrations/00000000100126_earning_strategies_color_reveal.sql](../supabase/migrations/00000000100126_earning_strategies_color_reveal.sql) — 32 `coloring_reveal_library` rows

---

## Summary counts

| Category | Shelf entries appearing in Studio | Seed rows in DB | Notes |
|---|---|---|---|
| Task & Chore Templates (blank) | 4 | 4 (`task_templates` — SODAS/What-If/Apology handled in Guided Forms row) | Blank formats |
| Task & Chore Templates (examples) | 6 | 4 (+2 live only in frontend seed) | `ex_reading_list` and `ex_tsg_randomizer` exist ONLY in frontend `studio-seed-data.ts` — no matching DB row |
| Guided Forms (blank) | 4 | 4 (`task_templates` with `template_type='guided_form'`) | — |
| Guided Forms (examples) | 3 | 3 | — |
| List Templates (blank) | 7 (6 list types + 1 Randomizer) | 0 | Blank list formats are frontend-only; creation is by `list_type` string, not by template row |
| List Templates (examples) | 4 | 4 (`list_templates`) | **DB seed rows never consulted by click handler** — handler navigates to `/lists?create=<type>` instead of cloning the example |
| Widget Starter Configs (Trackers & Widgets shelf) | 19 (after `FUNCTIONAL_TRACKER_TYPES` filter) | ~45 seeded across 3 migrations | ~26 starter configs seeded to DB but filtered out of Studio because their `tracker_type` is not in the functional allow-list |
| Gamification & Rewards | 6 | N/A (not template rows — point to settings/wizards/widget flows) | Star / Sticker Chart and Reward Spinner are `widget_*` types; the other 4 route to settings modals |
| Growth & Self-Knowledge | 2 | N/A | Static shelf tiles routing to wizard or feature navigation |
| Setup Wizards | 3 | N/A | Static shelf tiles routing to wizard modals |
| Coloring Reveal Library | 0 direct shelf tiles | 32 (`coloring_reveal_library`) | Library is consumed inside `GamificationSettingsModal` → not a Studio shelf entry itself |

**Grand total of tiles rendered on the shelf (without search filtering):** ~58 (4 + 6 + 4 + 3 + 7 + 4 + 19 + 6 + 2 + 3)

---

## Studio shelf structure (render order)

Rendered by [src/pages/Studio.tsx:617-708](../src/pages/Studio.tsx#L617-L708) inside `<StudioCategorySection>` wrappers. Order is source-code order; no dynamic reordering.

1. **Task & Chore Templates** (blanks + examples)
2. **Guided Forms & Worksheets** (blanks + examples)
3. **List Templates** (blanks + examples; blank Randomizer appended into the blanks list at [Studio.tsx:492](../src/pages/Studio.tsx#L492))
4. **Trackers & Widgets** — `starterConfigs` filtered by `FUNCTIONAL_TRACKER_TYPES` ([Studio.tsx:129-135](../src/pages/Studio.tsx#L129-L135))
5. **Gamification & Rewards** — `GAMIFICATION_TEMPLATES` (6 tiles)
6. **Growth & Self-Knowledge** — `GROWTH_TEMPLATES` (2 tiles)
7. **Setup Wizards** — `WIZARD_TEMPLATES` (3 tiles)

A second tab, **My Customized**, renders the family's own saved templates from `task_templates WHERE family_id = ? AND is_system = false` and is out of scope for this inventory (personal library, not a creation shelf).

---

## Task & Chore Templates

All click handlers resolved in `handleCustomize` ([Studio.tsx:329-458](../src/pages/Studio.tsx#L329-L458)).

### Simple Task

- **Seed location (frontend):** [studio-seed-data.ts:22-38](../src/components/studio/studio-seed-data.ts#L22-L38) (`TASK_TEMPLATES_BLANK[0]`, `id: 'sys_task_simple'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:125-148](../supabase/migrations/00000000000027_seed_studio_templates.sql#L125-L148) (`template_name = 'Simple Task'`)
- **Template type:** `task`
- **Capability tags:** `one_time`, `assignable`, `due_date`, `quick_action`, `to_do`
- **Shelf location:** Task & Chore Templates — blanks
- **Current click-to-deploy behavior:** Falls through all early-return branches; `studioTypeToTaskType` returns `'task'`; opens `TaskCreationModal` with `initialTaskType='task'`. Standard TaskCreationModal flow.
- **Intended behavior:** _to be defined in future session_

### Routine Checklist

- **Seed location (frontend):** [studio-seed-data.ts:39-58](../src/components/studio/studio-seed-data.ts#L39-L58) (`id: 'sys_task_routine'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:151-172](../supabase/migrations/00000000000027_seed_studio_templates.sql#L151-L172) (`template_name = 'Routine Checklist'`)
- **Template type:** `routine`
- **Capability tags:** `daily_checklist`, `recurring`, `sections`, `different_days`, `linked_content`, `morning_routine`, `school_routine`, `chore_routine`
- **Shelf location:** Task & Chore Templates — blanks
- **Current click-to-deploy behavior:** Opens `TaskCreationModal` with `initialTaskType='routine'`. No DB section pre-load for blanks (only examples trigger `loadRoutineTemplate`).
- **Intended behavior:** _to be defined in future session_

### Opportunity Board

- **Seed location (frontend):** [studio-seed-data.ts:59-76](../src/components/studio/studio-seed-data.ts#L59-L76) (`id: 'sys_task_opportunity'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:177-198](../supabase/migrations/00000000000027_seed_studio_templates.sql#L177-L198)
- **Template type:** `opportunity_claimable`
- **Capability tags:** `bonus_work`, `earn_rewards`, `job_board`, `claim_lock`, `family_economy`
- **Shelf location:** Task & Chore Templates — blanks
- **Current click-to-deploy behavior:** `studioTypeToTaskType` maps `opportunity_claimable` → `'opportunity'`; opens `TaskCreationModal` with `initialTaskType='opportunity'`.
- **Intended behavior:** _to be defined in future session_

### Sequential Collection

- **Seed location (frontend):** [studio-seed-data.ts:77-95](../src/components/studio/studio-seed-data.ts#L77-L95) (`id: 'sys_task_sequential'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:203-224](../supabase/migrations/00000000000027_seed_studio_templates.sql#L203-L224)
- **Template type:** `sequential`
- **Capability tags:** `tracks_progress`, `ordered_steps`, `curriculum`, `mastery`, `practice_count`, `one_at_a_time`, `drip_feed`, `learning_path`, `skill_building`, `homeschool`
- **Shelf location:** Task & Chore Templates — blanks
- **Current click-to-deploy behavior:** Early-return hits `template.templateType === 'sequential'` branch ([Studio.tsx:420-424](../src/pages/Studio.tsx#L420-L424)); opens `SequentialCreatorModal`. This is the Phase 1 fix that replaced the silently-broken TaskCreationModal route. **Confirmed working per convention #151.**
- **Intended behavior:** _to be defined in future session_

### Morning Routine (example)

- **Seed location (frontend):** [studio-seed-data.ts:101-120](../src/components/studio/studio-seed-data.ts#L101-L120) (`id: 'ex_morning_routine'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:371-455](../supabase/migrations/00000000000027_seed_studio_templates.sql#L371-L455) (template + 3 sections + ~11 steps)
- **Template type:** `routine`
- **Capability tags:** `daily_checklist`, `recurring`, `sections`, `different_days`, `morning_routine`, `school_routine`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** `template.isExample && taskType === 'routine'` branch ([Studio.tsx:434-454](../src/pages/Studio.tsx#L434-L454)) → looks up `task_templates` by title → `loadRoutineTemplate` reads sections + steps → opens `TaskCreationModal` pre-loaded with sections.
- **Intended behavior:** _to be defined in future session_

### Bedroom Clean-Up (example)

- **Seed location (frontend):** [studio-seed-data.ts:121-140](../src/components/studio/studio-seed-data.ts#L121-L140) (`id: 'ex_bedroom_cleanup'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:466-553](../supabase/migrations/00000000000027_seed_studio_templates.sql#L466-L553) (template + 3 sections + ~11 steps)
- **Template type:** `routine`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** Same as Morning Routine — DB lookup + `loadRoutineTemplate` + `TaskCreationModal`.
- **Intended behavior:** _to be defined in future session_

### Extra House Jobs Board (example)

- **Seed location (frontend):** [studio-seed-data.ts:141-158](../src/components/studio/studio-seed-data.ts#L141-L158) (`id: 'ex_extra_house_jobs'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:557-595](../supabase/migrations/00000000000027_seed_studio_templates.sql#L557-L595) (template row only — no child items seeded)
- **Template type:** `opportunity_claimable`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** Falls through to final branch with `modalDefaultTitle = template.name` set; opens `TaskCreationModal` with `initialTaskType='opportunity'`. The 8 chore jobs + 2 connection items described in the frontend tagline are NOT pre-loaded — the DB seed is just the template shell.
- **Intended behavior:** _to be defined in future session_

### Curriculum Chapter Sequence (example)

- **Seed location (frontend):** [studio-seed-data.ts:159-177](../src/components/studio/studio-seed-data.ts#L159-L177) (`id: 'ex_curriculum_sequence'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:600-632](../supabase/migrations/00000000000027_seed_studio_templates.sql#L600-L632) (template shell only — no sample chapters)
- **Template type:** `sequential`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** Hits `sequential` early-return branch → opens `SequentialCreatorModal`. Does NOT pre-load the 5 sample chapters — modal opens empty.
- **Intended behavior:** _to be defined in future session_

### Reading List (example)

- **Seed location (frontend):** [studio-seed-data.ts:178-203](../src/components/studio/studio-seed-data.ts#L178-L203) (`id: 'ex_reading_list'`)
- **Seed location (DB):** ⚠ **NONE** — no matching row in `task_templates`
- **Template type:** `sequential`
- **Capability tags:** `reading`, `books`, `mastery`, `duration_tracking`, `homeschool`, `curriculum`, `one_at_a_time`, `learning_path`, `tracks_progress`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** ID-specific routing at [Studio.tsx:865-886](../src/pages/Studio.tsx#L865-L886) — when `sequentialTemplateId === 'ex_reading_list'`, opens `SequentialCreatorModal` with preset defaults: `defaultAdvancementMode: 'mastery'`, `defaultRequireApproval: true`, `defaultTrackDuration: true`. Build J wiring per convention #164.
- **Intended behavior:** _to be defined in future session_

### TSG Extra Jobs Randomizer (example)

- **Seed location (frontend):** [studio-seed-data.ts:204-222](../src/components/studio/studio-seed-data.ts#L204-L222) (`id: 'ex_tsg_randomizer'`)
- **Seed location (DB):** ⚠ **NONE** — neither `task_templates` nor `list_templates` seed this row
- **Template type:** `randomizer`
- **Shelf location:** Task & Chore Templates — examples
- **Current click-to-deploy behavior:** `template.templateType === 'randomizer'` satisfies `template.templateType.startsWith('list_') || template.templateType === 'randomizer'` at [Studio.tsx:402-415](../src/pages/Studio.tsx#L402-L415) → `navigate('/lists?create=randomizer')`. Opens the generic blank randomizer create flow on the Lists page. The 9 chores + 4 connection items described in the tagline are NOT pre-loaded.
- **Intended behavior:** _to be defined in future session_

---

## Guided Forms

### Guided Form (blank)

- **Seed location (frontend):** [studio-seed-data.ts:227-246](../src/components/studio/studio-seed-data.ts#L227-L246) (`id: 'sys_guided_form_blank'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:229-253](../supabase/migrations/00000000000027_seed_studio_templates.sql#L229-L253) (`template_name = 'Guided Form'`)
- **Template type:** `guided_form`
- **Shelf location:** Guided Forms & Worksheets — blanks
- **Current click-to-deploy behavior:** `startsWith('guided_form')` branch at [Studio.tsx:389-399](../src/pages/Studio.tsx#L389-L399) → subtype map: `guided_form → 'custom'` → opens `GuidedFormAssignModal` with sections from `getSectionsForSubtype('custom')`.
- **Intended behavior:** _to be defined in future session_

### SODAS (blank)

- **Seed location (frontend):** [studio-seed-data.ts:247-266](../src/components/studio/studio-seed-data.ts#L247-L266) (`id: 'sys_guided_form_sodas'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:258-288](../supabase/migrations/00000000000027_seed_studio_templates.sql#L258-L288)
- **Template type:** `guided_form_sodas`
- **Section structure:** Situation → Options → Disadvantages → Advantages → Solution
- **Shelf location:** Guided Forms & Worksheets — blanks
- **Current click-to-deploy behavior:** Subtype map: `guided_form_sodas → 'sodas'` → `GuidedFormAssignModal` with SODAS section structure.
- **Intended behavior:** _to be defined in future session_

### What-If Game (blank)

- **Seed location (frontend):** [studio-seed-data.ts:267-286](../src/components/studio/studio-seed-data.ts#L267-L286) (`id: 'sys_guided_form_what_if'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:293-323](../supabase/migrations/00000000000027_seed_studio_templates.sql#L293-L323)
- **Template type:** `guided_form_what_if`
- **Section structure:** The Scenario → My Options → What Might Happen → What I Would Do → What I Learned
- **Shelf location:** Guided Forms & Worksheets — blanks
- **Current click-to-deploy behavior:** Subtype map: `guided_form_what_if → 'what_if'` → `GuidedFormAssignModal`.
- **Intended behavior:** _to be defined in future session_

### Apology Reflection (blank)

- **Seed location (frontend):** [studio-seed-data.ts:287-313](../src/components/studio/studio-seed-data.ts#L287-L313) (`id: 'sys_guided_form_apology'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:328-359](../supabase/migrations/00000000000027_seed_studio_templates.sql#L328-L359)
- **Template type:** `guided_form_apology_reflection`
- **Section structure:** What Happened → Who Was Affected and How → Why It Mattered → What I Wish I'd Done → How I Want to Make It Right → What I Want to Remember
- **Shelf location:** Guided Forms & Worksheets — blanks
- **Current click-to-deploy behavior:** Subtype map: `guided_form_apology_reflection → 'apology_reflection'` → `GuidedFormAssignModal`.
- **Intended behavior:** _to be defined in future session_

### SODAS Sibling Conflict (example)

- **Seed location (frontend):** [studio-seed-data.ts:320-337](../src/components/studio/studio-seed-data.ts#L320-L337) (`id: 'ex_sodas_sibling'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:637-670](../supabase/migrations/00000000000027_seed_studio_templates.sql#L637-L670)
- **Template type:** `guided_form_sodas`
- **Shelf location:** Guided Forms & Worksheets — examples
- **Current click-to-deploy behavior:** Same subtype routing as blank SODAS. The example's pre-filled Situation copy seeded in the DB (`config` JSONB) is NOT consulted by the click path — `GuidedFormAssignModal` is opened with blank sections from `getSectionsForSubtype('sodas')`.
- **Intended behavior:** _to be defined in future session_

### What-If: Friend Pressure (example)

- **Seed location (frontend):** [studio-seed-data.ts:338-355](../src/components/studio/studio-seed-data.ts#L338-L355) (`id: 'ex_what_if_friend_pressure'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:672-705](../supabase/migrations/00000000000027_seed_studio_templates.sql#L672-L705)
- **Template type:** `guided_form_what_if`
- **Shelf location:** Guided Forms & Worksheets — examples
- **Current click-to-deploy behavior:** Same as blank What-If — DB's pre-filled Scenario is ignored by the handler.
- **Intended behavior:** _to be defined in future session_

### Apology Reflection (example)

- **Seed location (frontend):** [studio-seed-data.ts:356-381](../src/components/studio/studio-seed-data.ts#L356-L381) (`id: 'ex_apology_general'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:707-739](../supabase/migrations/00000000000027_seed_studio_templates.sql#L707-L739) (`template_name = 'Apology Reflection (General)'`)
- **Template type:** `guided_form_apology_reflection`
- **Shelf location:** Guided Forms & Worksheets — examples
- **Current click-to-deploy behavior:** Same as blank Apology Reflection — DB's pre-filled warm intro note is ignored by the handler.
- **Intended behavior:** _to be defined in future session_

---

## List Templates

All click handlers at [Studio.tsx:402-415](../src/pages/Studio.tsx#L402-L415) — every list template dispatches through `navigate('/lists?create=<type>')`, NOT through a template-cloning flow. The DB's seeded `list_templates` rows exist but are not consulted by these handlers.

### Shopping List (blank)

- **Seed location (frontend):** [studio-seed-data.ts:388-404](../src/components/studio/studio-seed-data.ts#L388-L404) (`id: 'sys_list_shopping'`)
- **Seed location (DB):** ⚠ **NONE** (no blank list template row seeded; list creation uses `list_type` string)
- **Template type:** `list_shopping`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=shopping')` — opens generic blank list creator on Lists page.
- **Intended behavior:** _to be defined in future session_

### Wishlist (blank)

- **Seed location (frontend):** [studio-seed-data.ts:405-420](../src/components/studio/studio-seed-data.ts#L405-L420) (`id: 'sys_list_wishlist'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `list_wishlist`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=wishlist')`.
- **Intended behavior:** _to be defined in future session_

### Packing List (blank)

- **Seed location (frontend):** [studio-seed-data.ts:421-438](../src/components/studio/studio-seed-data.ts#L421-L438) (`id: 'sys_list_packing'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `list_packing`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=packing')`.
- **Intended behavior:** _to be defined in future session_

### Expense Tracker (blank)

- **Seed location (frontend):** [studio-seed-data.ts:439-456](../src/components/studio/studio-seed-data.ts#L439-L456) (`id: 'sys_list_expenses'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `list_expenses`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=expenses')`.
- **Intended behavior:** _to be defined in future session_

### To-Do List (blank)

- **Seed location (frontend):** [studio-seed-data.ts:457-474](../src/components/studio/studio-seed-data.ts#L457-L474) (`id: 'sys_list_todo'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `list_todo`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=todo')`.
- **Intended behavior:** _to be defined in future session_

### Custom List (blank)

- **Seed location (frontend):** [studio-seed-data.ts:475-490](../src/components/studio/studio-seed-data.ts#L475-L490) (`id: 'sys_list_custom'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `list_custom`
- **Shelf location:** List Templates — blanks
- **Current click-to-deploy behavior:** `navigate('/lists?create=custom')`.
- **Intended behavior:** _to be defined in future session_

### Randomizer / Draw List (blank)

- **Seed location (frontend):** [studio-seed-data.ts:550-568](../src/components/studio/studio-seed-data.ts#L550-L568) (`RANDOMIZER_TEMPLATE_BLANK`, `id: 'sys_randomizer'`)
- **Seed location (DB):** ⚠ **NONE**
- **Template type:** `randomizer`
- **Shelf location:** Appended into List Templates blanks array at [Studio.tsx:492](../src/pages/Studio.tsx#L492)
- **Current click-to-deploy behavior:** `navigate('/lists?create=randomizer')`.
- **Intended behavior:** _to be defined in future session_

### Weekly Grocery List (example)

- **Seed location (frontend):** [studio-seed-data.ts:495-508](../src/components/studio/studio-seed-data.ts#L495-L508) (`id: 'ex_weekly_grocery'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:749-796](../supabase/migrations/00000000000027_seed_studio_templates.sql#L749-L796) — template + 25 `default_items` JSONB
- **Template type:** `list_shopping`
- **Shelf location:** List Templates — examples
- **Current click-to-deploy behavior:** `navigate('/lists?create=shopping')` — **the 25 seeded sample items in the DB's `default_items` JSONB are never loaded**; user sees a blank shopping list creator.
- **Intended behavior:** _to be defined in future session_

### Family Road Trip Packing (example)

- **Seed location (frontend):** [studio-seed-data.ts:509-521](../src/components/studio/studio-seed-data.ts#L509-L521) (`id: 'ex_road_trip_packing'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:800-853](../supabase/migrations/00000000000027_seed_studio_templates.sql#L800-L853) — template + 30 `default_items`
- **Template type:** `list_packing`
- **Shelf location:** List Templates — examples
- **Current click-to-deploy behavior:** `navigate('/lists?create=packing')` — seeded items not loaded.
- **Intended behavior:** _to be defined in future session_

### Birthday Wishlist (Child) (example)

- **Seed location (frontend):** [studio-seed-data.ts:522-532](../src/components/studio/studio-seed-data.ts#L522-L532) (`id: 'ex_birthday_wishlist'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:857-884](../supabase/migrations/00000000000027_seed_studio_templates.sql#L857-L884) — template + 5 `default_items` with URLs/prices/notes
- **Template type:** `list_wishlist`
- **Shelf location:** List Templates — examples
- **Current click-to-deploy behavior:** `navigate('/lists?create=wishlist')` — seeded items not loaded.
- **Intended behavior:** _to be defined in future session_

### Homeschool Curriculum Budget (example)

- **Seed location (frontend):** [studio-seed-data.ts:533-545](../src/components/studio/studio-seed-data.ts#L533-L545) (`id: 'ex_homeschool_budget'`)
- **Seed location (DB):** [00000000000027_seed_studio_templates.sql:888+](../supabase/migrations/00000000000027_seed_studio_templates.sql#L888) — template + 5 sample expenses
- **Template type:** `list_expenses`
- **Shelf location:** List Templates — examples
- **Current click-to-deploy behavior:** `navigate('/lists?create=expenses')` — seeded items not loaded.
- **Intended behavior:** _to be defined in future session_

---

## Widget Starter Configs (Trackers & Widgets shelf)

Shelf is rendered from `useWidgetStarterConfigs()` results, filtered by `FUNCTIONAL_TRACKER_TYPES` at [Studio.tsx:129-135, 655](../src/pages/Studio.tsx#L655).

**Functional tracker types allowed:** `tally`, `streak`, `percentage`, `checklist`, `multi_habit_grid`, `boolean_checkin`, `sequential_path`, `achievement_badge`, `xp_level`, `timer_duration`, `allowance_calculator`, `leaderboard`, `mood_rating`, `countdown`, `snapshot_comparison`, `best_intention`, `randomizer_spinner`, `privilege_status`, `log_learning`.

Every tile on this shelf uses the same onCustomize at [Studio.tsx:672-675](../src/pages/Studio.tsx#L672-L675): `starterConfigs.find(sc => sc.id === t.id)` → `handleSelectStarterConfig(config)` → opens `WidgetConfiguration` modal. **All entries on this shelf share the same handler**; the "Intended behavior" column is collapsed for brevity.

| # | Config name | Seed migration | tracker_type | visual_variant | Passes `FUNCTIONAL_TRACKER_TYPES` filter? | In Studio shelf? |
|---|---|---|---|---|---|---|
| 1 | Morning Routine Streak | 100032 + 100056 (ON CONFLICT skip) | `streak` | `flame_counter` | ✓ | ✓ |
| 2 | Daily Habit Grid | 100032 + 100056 (ON CONFLICT skip) | `grid` | `bujo_monthly_grid` | ✗ `grid` not in allow-list | ✗ hidden |
| 3 | Reading Log (Books) | 100032 | `tally` | `star_chart` | ✓ | ✓ |
| 4 | Homeschool Hours by Subject | 100032 + 100056 | `timer_duration` | `time_bar_chart` | ✓ | ✓ |
| 5 | Sticker Chart | 100032 | `collection` | `animated_sticker_grid` | ✗ `collection` not in allow-list | ✗ hidden |
| 6 | IEP / ISP Goal Progress | 100032 + 100056 (ON CONFLICT skip) | `tally` | `progress_bar_multi` | ✓ | ✓ |
| 7 | Weekly Chore Completion | 100032 + 100056 (ON CONFLICT skip) | `percentage` | `donut_completion` | ✓ | ✓ |
| 8 | Independence Skills Path (Staircase) | 100032 + 100056 (ON CONFLICT skip) | `sequential_path` | `staircase` | ✓ | ✓ |
| 9 | Family Reading Race | 100032 + 100056 (ON CONFLICT skip) | `tally` | `colored_bars_competitive` | ✓ | ✓ |
| 10 | Daily Mood Check-In | 100032 + 100056 (ON CONFLICT skip) | `dot_circle` | `year_in_pixels_weekly` | ✗ `dot_circle` not in allow-list | ✗ hidden |
| 11 | Daily Check-In | 100056 | `boolean_checkin` | (varies) | ✓ | ✓ |
| 12 | Evening Checklist | 100056 | `checklist` | (varies) | ✓ | ✓ |
| 13 | Bedtime Routine | 100056 | `checklist` | (varies) | ✓ | ✓ |
| 14 | Reading Log | 100056 | `tally` | (varies) | ✓ | ✓ (duplicates #3 by concept) |
| 15 | Math Practice Streak | 100056 | `streak` | (varies) | ✓ | ✓ |
| 16 | Curriculum Progress | 100056 | `percentage` | (varies) | ✓ | ✓ |
| 17 | Typing Speed Progress | 100056 | `snapshot_comparison` | (varies) | ✓ | ✓ |
| 18 | Chore Points Board | 100056 | `tally` | (varies) | ✓ | ✓ |
| 19 | Responsibility Gauge | 100056 | `percentage` | (varies) | ✓ | ✓ |
| 20 | Extra Jobs Completion | 100056 | `tally` | (varies) | ✓ | ✓ |
| 21 | Weekly Allowance Calculator | 100056 | `allowance_calculator` | (varies) | ✓ | ✓ |
| 22 | Savings Goal | 100056 | `percentage` | (varies) | ✓ | ✓ |
| 23 | Chore Earnings Tracker | 100056 | `tally` | (varies) | ✓ | ✓ |
| 24 | Custom Goal Card | 100056 | `tally` | (varies) | ✓ | ✓ |
| 25 | Skill Mastery Path | 100056 | `sequential_path` | (varies) | ✓ | ✓ |
| 26 | Badge Collection | 100056 | `achievement_badge` | (varies) | ✓ | ✓ |
| 27 | XP & Level Up | 100056 | `xp_level` | (varies) | ✓ | ✓ |
| 28 | Water Intake | 100056 | `tally` | (varies) | ✓ | ✓ |
| 29 | Exercise Streak | 100056 | `streak` | (varies) | ✓ | ✓ |
| 30 | Sleep Check-In | 100056 | `boolean_checkin` | (varies) | ✓ | ✓ |
| 31 | Mood Tracker | 100056 | `mood_rating` | (varies) | ✓ | ✓ |
| 32 | Family Leaderboard | 100056 | `leaderboard` | (varies) | ✓ | ✓ |
| 33 | Countdown to Event | 100056 | `countdown` | (varies) | ✓ | ✓ (plus separate 100063 Countdown) |
| 34 | Family Chore Race | 100056 | `tally` | (varies) | ✓ | ✓ |
| 35 | Sensory Regulation Check-In | 100056 | `boolean_checkin` | (varies) | ✓ | ✓ |
| 36 | Therapy Practice Streak | 100056 | `streak` | (varies) | ✓ | ✓ |
| 37 | Weekly Celebration | 100056 | `tally` | (varies) | ✓ | ✓ |
| 38 | Countdown (Hub) | 100063 | `countdown` | `big_number` | ✓ | ✓ (distinct row from #33) |

> **Note on `tracker_type` values for rows 11-37:** These were spot-verified from the file structure but not all individually opened for `visual_variant`. The `tracker_type` values were extracted from the `INSERT` VALUES at lines 32-927 of migration 100056. An exhaustive per-row verification would take a second pass if needed for the design session.

**Filter-hidden count:** At least 3 rows are seeded but never appear on the Studio shelf because their `tracker_type` is not in `FUNCTIONAL_TRACKER_TYPES`: `Daily Habit Grid` (`grid`), `Sticker Chart` (`collection`), `Daily Mood Check-In` (`dot_circle`). This is the likely source of the founder's recollection that "the star/sticker chart works but has no Studio entrance." The `Sticker Chart` starter config is seeded in the DB but filtered out. The different shelf tile **Star / Sticker Chart** (`studio_star_chart` in `GAMIFICATION_TEMPLATES`) uses a `tally` tracker type and routes to the `StarChartWizard`, which is a separate, working path.

---

## Gamification & Rewards

Handler dispatch at [Studio.tsx:352-386](../src/pages/Studio.tsx#L352-L386). Tile IDs (`studio_*`) matter because several have ID-based early-return branches.

### Gamification Setup

- **Seed location (frontend):** [studio-seed-data.ts:573-591](../src/components/studio/studio-seed-data.ts#L573-L591) (`id: 'studio_gamification_setup'`)
- **Seed location (DB):** N/A (no template row — this is a shelf tile, not a template)
- **Template type:** `gamification_setup`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** `templateType.startsWith('gamification_')` → opens `gamificationPickerOpen` member-picker → on member pick, opens `GamificationSettingsModal` for that member. **Working path.**
- **Intended behavior:** _to be defined in future session_

### Day Segments

- **Seed location (frontend):** [studio-seed-data.ts:592-610](../src/components/studio/studio-seed-data.ts#L592-L610) (`id: 'studio_day_segments'`)
- **Seed location (DB):** N/A
- **Template type:** `gamification_segments`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** Same path as Gamification Setup — member picker → `GamificationSettingsModal`. Same modal, not a segment-specific flow. Founder would need to scroll to the Day Segments section within the modal.
- **Intended behavior:** _to be defined in future session_

### Coloring Page Reveal

- **Seed location (frontend):** [studio-seed-data.ts:611-629](../src/components/studio/studio-seed-data.ts#L611-L629) (`id: 'studio_coloring_reveal'`)
- **Seed location (DB):** Tile N/A; 32 `coloring_reveal_library` rows seeded in [00000000100126_earning_strategies_color_reveal.sql](../supabase/migrations/00000000100126_earning_strategies_color_reveal.sql) (Woodland Felt theme — 20 animals + 12 scenes)
- **Template type:** `gamification_coloring`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** Same path as Gamification Setup — member picker → `GamificationSettingsModal`. The modal contains the Coloring Reveals section from which the 32-page library is accessed.
- **Intended behavior:** _to be defined in future session_

### Reward Reveal

- **Seed location (frontend):** [studio-seed-data.ts:630-648](../src/components/studio/studio-seed-data.ts#L630-L648) (`id: 'studio_reward_reveal'`)
- **Seed location (DB):** N/A (reveal animations library seeded in [100142_reveal_animations_library.sql](../supabase/migrations/00000000100142_reveal_animations_library.sql); actual reveals stored in `reward_reveals` per [100143_reward_reveals.sql](../supabase/migrations/00000000100143_reward_reveals.sql))
- **Template type:** `reward_reveal`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** Early-return at [Studio.tsx:354-357](../src/pages/Studio.tsx#L354-L357) → `navigate('/settings/reward-reveals')` → `RewardRevealLibrary` page (route exists in `App.tsx`). **Working path** — navigates away from Studio.
- **Intended behavior:** _to be defined in future session_

### Star / Sticker Chart

- **Seed location (frontend):** [studio-seed-data.ts:649-667](../src/components/studio/studio-seed-data.ts#L649-L667) (`id: 'studio_star_chart'`)
- **Seed location (DB):** N/A for the shelf tile itself. (A DB widget starter config `Sticker Chart` with `tracker_type='collection'` exists in 100032 but is filter-hidden; this shelf tile is separate and opens the `StarChartWizard`.)
- **Template type:** `widget_tally`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** ID-specific early-return at [Studio.tsx:331-334](../src/pages/Studio.tsx#L331-L334) → opens `StarChartWizard`. **Working path.** Founder concern that "star/sticker chart works but has no Studio entrance" appears to be about the filter-hidden DB `Sticker Chart` starter config; the `studio_star_chart` shelf tile DOES have a working wizard entrance.
- **Intended behavior:** _to be defined in future session_

### Reward Spinner

- **Seed location (frontend):** [studio-seed-data.ts:668-686](../src/components/studio/studio-seed-data.ts#L668-L686) (`id: 'studio_reward_spinner'`)
- **Seed location (DB):** ⚠ No widget starter config with `tracker_type='randomizer_spinner'` is seeded in any migration. `randomizer_spinner` IS in `FUNCTIONAL_TRACKER_TYPES`, but no row exists to match.
- **Template type:** `widget_randomizer_spinner`
- **Shelf location:** Gamification & Rewards
- **Current click-to-deploy behavior:** `template.templateType.startsWith('widget_')` branch at [Studio.tsx:376-386](../src/pages/Studio.tsx#L376-L386) → `starterConfigs.find(sc => sc.tracker_type === 'randomizer_spinner')` returns `undefined` → falls to `setWidgetPickerOpen(true)` — **opens the unfiltered WidgetPicker instead of a Reward Spinner setup.** ⚠ **Broken handler — click does not reach a spinner config.**
- **Intended behavior:** _to be defined in future session_

---

## Growth & Self-Knowledge

### Get to Know Your Family

- **Seed location (frontend):** [studio-seed-data.ts:754-772](../src/components/studio/studio-seed-data.ts#L754-L772) (`id: 'studio_get_to_know'`)
- **Seed location (DB):** N/A (points to a wizard, not a template row)
- **Template type:** `self_knowledge_wizard`
- **Shelf location:** Growth & Self-Knowledge
- **Current click-to-deploy behavior:** ID-specific early-return at [Studio.tsx:335-338](../src/pages/Studio.tsx#L335-L338) → opens `GetToKnowWizard`. **Working path.** (A second fallback at [Studio.tsx:365-369](../src/pages/Studio.tsx#L365-L369) handles `templateType === 'self_knowledge_wizard'` for future tiles.)
- **Intended behavior:** _to be defined in future session_

### Best Intentions Starter

- **Seed location (frontend):** [studio-seed-data.ts:773-791](../src/components/studio/studio-seed-data.ts#L773-L791) (`id: 'studio_best_intentions'`)
- **Seed location (DB):** N/A
- **Template type:** `best_intentions_wizard`
- **Shelf location:** Growth & Self-Knowledge
- **Current click-to-deploy behavior:** Branch at [Studio.tsx:370-373](../src/pages/Studio.tsx#L370-L373) → `navigate('/guiding-stars?tab=intentions')`. **Working path** — navigates to the Best Intentions tab on the Guiding Stars page. Does NOT open a setup wizard despite the "Starter" label — it's a navigation shortcut.
- **Intended behavior:** _to be defined in future session_

---

## Setup Wizards

All three route through dedicated `templateType` early-returns in `handleCustomize`.

### Family Meeting Setup

- **Seed location (frontend):** [studio-seed-data.ts:692-710](../src/components/studio/studio-seed-data.ts#L692-L710) (`id: 'studio_meeting_setup'`)
- **Seed location (DB):** N/A (component-backed wizard; no template row)
- **Template type:** `meeting_setup_wizard`
- **Shelf location:** Setup Wizards
- **Current click-to-deploy behavior:** Early-return at [Studio.tsx:343-346](../src/pages/Studio.tsx#L343-L346) → opens `MeetingSetupWizard` (1366 lines, approved 2026-04-15 per `project_meeting_setup_wizard` memory). **Working path.**
- **Intended behavior:** _to be defined in future session_

### Routine Builder (AI)

- **Seed location (frontend):** [studio-seed-data.ts:711-729](../src/components/studio/studio-seed-data.ts#L711-L729) (`id: 'studio_routine_builder'`)
- **Seed location (DB):** N/A
- **Template type:** `routine_builder_wizard`
- **Shelf location:** Setup Wizards
- **Current click-to-deploy behavior:** Early-return at [Studio.tsx:339-342](../src/pages/Studio.tsx#L339-L342) → opens `RoutineBuilderWizard`. On `onAccept` with parsed sections, closes wizard and re-opens `TaskCreationModal` with `initialRoutineSections` pre-loaded. **Working path.** This is the AI routine-parse flow from Build J.
- **Intended behavior:** _to be defined in future session_

### Create a List (Universal List Wizard)

- **Seed location (frontend):** [studio-seed-data.ts:730-750](../src/components/studio/studio-seed-data.ts#L730-L750) (`id: 'studio_universal_list'`)
- **Seed location (DB):** N/A
- **Template type:** `list_wizard`
- **Shelf location:** Setup Wizards
- **Current click-to-deploy behavior:** Early-return at [Studio.tsx:347-350](../src/pages/Studio.tsx#L347-L350) → opens `UniversalListWizard` (1134 lines). **Working path.**
- **Intended behavior:** _to be defined in future session_

---

## Randomizers / Sequential / Other

No standalone shelf section for these. Entries covered above:

- Randomizer blank → `RANDOMIZER_TEMPLATE_BLANK` (frontend only), appended into List Templates blanks array, routes to `/lists?create=randomizer`.
- Randomizer example → `ex_tsg_randomizer` in Task examples, same navigation.
- Sequential Collection blank + 2 examples → Task & Chore Templates section, routes to `SequentialCreatorModal`.
- Reward Spinner → Gamification & Rewards section; is a widget, not a Studio-level randomizer.

---

## Mismatches and orphans

### Shelf entries with NO corresponding DB seed row

1. **`ex_reading_list`** (Task examples) — Frontend-only Studio tile; no `task_templates` row. Works because the handler has ID-based preset logic, not because a template row is cloned.
2. **`ex_tsg_randomizer`** (Task examples) — Frontend-only; no DB row. Handler navigates to blank `/lists?create=randomizer`, so the "9 chores + 4 connection items" described in the tagline are never loaded.
3. **All 7 `LIST_TEMPLATES_BLANK` entries + `RANDOMIZER_TEMPLATE_BLANK`** — Frontend-only by design; list creation is by `list_type` string. Not really orphans, but worth noting the asymmetry with task blanks, which DO have DB rows.
4. **`studio_reward_spinner`** (Gamification) — No `widget_starter_configs` row with `tracker_type='randomizer_spinner'` seeded anywhere. The handler silently falls through to the generic `WidgetPicker` — user sees an unfiltered widget browser instead of a reward spinner setup.

### DB seed rows with NO Studio shelf entry point (orphans in the other direction)

1. **`Daily Habit Grid`** starter config (`tracker_type='grid'`, migration 100032 + 100056) — Seeded but filtered out by `FUNCTIONAL_TRACKER_TYPES`. No Studio entrance.
2. **`Sticker Chart`** starter config (`tracker_type='collection'`, `visual_variant='animated_sticker_grid'`, migration 100032) — Seeded but filtered out. **This is the likely source of the founder's "star/sticker chart exists but has no Studio entrance" concern.** A separate `studio_star_chart` shelf tile uses a different tracker type (`tally`) via `StarChartWizard` and DOES have an entrance, but it's not the same underlying widget.
3. **`Daily Mood Check-In`** starter config (`tracker_type='dot_circle'`, migration 100032 + 100056) — Seeded but filtered out. Note: a different tile `Mood Tracker` with `tracker_type='mood_rating'` IS in the allow-list and appears on the shelf — they may be intended to be the same concept but are distinct DB rows.
4. **All 4 `list_templates` example rows** (Weekly Grocery, Road Trip Packing, Birthday Wishlist, Homeschool Curriculum Budget) — The rows exist in the DB with full `default_items` JSONB arrays (25, 30, 5, 5 items respectively), but the handler path `navigate('/lists?create=<type>')` never consults them. Users see blank list creators with no pre-filled sample items. **Broad orphan pattern: DB seed data intended for reuse is silently unused.**
5. **All 4 Task/Guided Form example `config` payloads** (`Extra House Jobs Board`, `Curriculum Chapter Sequence`, `SODAS Sibling Conflict`, `What-If Friend Pressure`, `Apology Reflection (General)`) — The `config` JSONB on these rows may contain pre-filled payloads (not verified in this audit), but the handler's `TaskCreationModal` / `GuidedFormAssignModal` opens don't load them. Only the Morning Routine and Bedroom Clean-Up examples DO load sections+steps from the DB, via `loadRoutineTemplate`. The other examples are treated as "name-hint only."

### Duplicate definitions across seed files

1. **Morning Routine Streak** — Seeded in both 100032 and 100056 (same `config_name` → deduped by `ON CONFLICT DO NOTHING` on the unique index, so only one row exists, but the SQL is duplicated).
2. **Daily Habit Grid, IEP / ISP Goal Progress, Weekly Chore Completion, Independence Skills Path, Family Reading Race, Daily Mood Check-In** — All seeded in 100032, also re-stated in 100056. Deduped at insert time.
3. **`Reading Log (Books)`** (100032) vs **`Reading Log`** (100056) — Different `config_name`, so two DB rows exist. Not a true duplicate but overlapping concepts.
4. **`Countdown to Event`** (100056, `tracker_type='countdown'`) vs **`Countdown`** (100063, `tracker_type='countdown'`, `visual_variant='big_number'`) — Two distinct rows, both visible on the shelf.

### Shelf entries whose handler routes to a broken/generic creator

1. **Reward Spinner** → opens unfiltered `WidgetPicker` (no matching starter config seeded).
2. **All 4 List example tiles** → navigate to blank `/lists?create=<type>`; the DB-seeded `default_items` are not loaded.
3. **Extra House Jobs Board** (task example) → opens `TaskCreationModal` for `opportunity` with only a pre-filled title; the "8 jobs + 2 connection items" described in the tagline are not seeded or loaded.
4. **Curriculum Chapter Sequence** (task example) → opens `SequentialCreatorModal` empty; "5 sample chapters" described in the tagline are not loaded.
5. **SODAS Sibling Conflict, What-If: Friend Pressure, Apology Reflection (examples)** → open `GuidedFormAssignModal` with blank sections via `getSectionsForSubtype`; the "pre-filled Situation / Scenario / warm intro note" described in each tagline is not loaded from the DB.

### Shelf entries that DO work correctly today (verified working wizard flows)

These are the minority that reach a complete, tile-specific destination:

1. **Simple Task / Routine Checklist / Opportunity Board / Sequential Collection (blanks)** — Open their respective modals with correct initial state (though the blanks have nothing DB-sourced to load).
2. **Morning Routine (example)** and **Bedroom Clean-Up (example)** — `loadRoutineTemplate` fully reads sections + steps from DB and pre-populates `TaskCreationModal`. **Fully wired.**
3. **Reading List (example)** — ID-specific preset logic fires `SequentialCreatorModal` with mastery + duration-tracking defaults. **Fully wired** (Build J).
4. **Sequential Collection (blank)** — Routes to `SequentialCreatorModal` (Phase 1 fix).
5. **All 4 Guided Form blanks** — Route to `GuidedFormAssignModal` with correct subtype sections.
6. **Gamification Setup, Day Segments, Coloring Page Reveal** — Route through the member picker to `GamificationSettingsModal` (same modal for all three; the modal's internal section is where the differentiation happens).
7. **Reward Reveal** — Navigates to `/settings/reward-reveals` page (`RewardRevealLibrary` component).
8. **Star / Sticker Chart (studio_star_chart)** — ID-specific early-return opens `StarChartWizard`.
9. **Get to Know Your Family** — ID-specific early-return opens `GetToKnowWizard`.
10. **Best Intentions Starter** — Navigates to `/guiding-stars?tab=intentions` (navigation, not a wizard).
11. **Family Meeting Setup / Routine Builder (AI) / Create a List** — All three Setup Wizards fire dedicated wizard modals.
12. **Trackers & Widgets shelf (19 functional entries)** — Each opens `WidgetConfiguration` pre-loaded with the starter config.

---

## Click-flow tally

| Status | Approximate count |
|---|---|
| Reaches a complete, tile-specific flow with DB data loaded as advertised | ~26 (4 task blanks, 4 guided form blanks, 2 routine examples, 1 Reading List, 1 Sequential blank, 3 guided form examples at subtype level, 6 gamification tiles, 2 growth tiles, 3 setup wizards) |
| Reaches a generic / blank creator — tagline-advertised sample content not loaded | ~10 (`Extra House Jobs Board`, `Curriculum Chapter Sequence`, `ex_tsg_randomizer`, all 4 list examples, 3 guided form examples in terms of `config` payload loading) |
| Opens an unfiltered picker / misroutes | 1 (Reward Spinner) |
| Seeded in DB but hidden from Studio by `FUNCTIONAL_TRACKER_TYPES` filter | ~3 widget starter configs (`Daily Habit Grid`, `Sticker Chart`, `Daily Mood Check-In`) |
