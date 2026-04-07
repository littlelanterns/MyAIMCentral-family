# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: IDLE

> Build J (PRD-09A/09B Linked Routine Steps, Mastery & Practice Advancement — Session 2) completed 2026-04-06. 37 wired, 6 stubbed, 0 missing across 43 requirements. 7/7 Playwright E2E tests passing. Verification archived to `claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md`. Session 3 (Studio Intelligence Phase 2 — intent-based search) and the Linked-Steps follow-up phase (routine duplication dialog + linked-step dashboard rendering) are the next in the PRD-09A/09B sequence.

---

# Build J: PRD-09A/09B Linked Routine Steps, Mastery & Practice Advancement (Session 2) — COMPLETED 2026-04-06

### PRD Files
- `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

### Addenda Read
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` **(primary authoritative source for this build)**
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (Studio evolution context — Session 3 forward)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`

### Feature Decision File
`claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md`

### Predecessor
Build H (PRD-09A/09B Studio Intelligence Phase 1) completed 2026-04-06 — fixed broken sequential creation wiring, added cross-surface visibility, added capability tags foundation. Build J is the direct successor: the building blocks the founder's homeschool use case needs before Session 3 can build Studio intent-based search.

---

### Pre-Build Summary

#### Context

PRD-09A/09B Studio Intelligence Phase 1 (Build H) fixed a silent bug where sequential collection creation was broken everywhere (dead code in `SequentialCreator` / `SequentialCollectionView` with zero callers; `sequential_collections` table had 0 rows in production). It revived those dead-code components, added cross-surface visibility, and added `capability_tags` as the data foundation for Session 3's intent-based Studio search. Build J adds the content-layer features that families actually need to run a homeschool year: **per-item advancement modes** on sequential collections AND randomizer lists, **linked routine steps** that dynamically pull today's content from a sequential/randomizer/recurring source, **randomizer draw modes** including auto-rotation via Surprise Me, an **AI-assisted curriculum parse Edge Function** for paste-and-import list creation, a **Reading List Studio template**, and **routine duplication with linked step resolution** for multi-child families.

The founder's end-state: a daily school routine where "Math" auto-shows today's chapter from a sequential list, "Scripture Study" shows today's reading with duration tracking, and "Skateboard Practice" auto-draws a random trick from a mastery-enabled randomizer — all within one routine, each advancing independently. Mom sets this up in Studio once; the child experiences a simple checklist; the complexity is in setup, not in use.

#### Dependencies Already Built (can reuse wholesale)

- **`sequential_collections` table** + `useCreateSequentialCollection` + `useSequentialCollection` + `useSequentialCollections` + `useRedeploySequentialCollection` + `usePromoteNextSequentialItem` hooks (all live + working as of Build H)
- **`SequentialCreator`** + **`SequentialCreatorModal`** + **`SequentialCollectionView`** + **`SequentialCollectionCard`** components (revived in Build H, wired from Studio + Tasks tab + Lists page)
- **`Randomizer.tsx`** + `RandomizerSpinner` + `RandomizerResultCard` + `useSmartDraw` + `useSmartDrawCompletion` + `useListItemMemberTracking` + `FrequencyRulesEditor` (live + working). The weighting/cooldown/lifetime-cap logic in `useSmartDraw` is exactly what Surprise Me needs — we call `draw(1)` and store the result in the new `randomizer_draws` table.
- **`RoutineSectionEditor.tsx`** (858 lines) — section + step editor with frequency per section, step notes, instance_count, require_photo. `RoutineStep` type is local to this file; we'll extend it with step_type, linked_source_id, linked_source_type, display_name_override.
- **`RoutineBrainDump.tsx`** (641 lines) — pattern reference for the paste-and-parse UX. Uses shared `ai-parse` Edge Function via `sendAIMessage`. We deliberately diverge for `curriculum-parse`: new dedicated Edge Function per founder convention (confirmed Build H — "Each AI tool gets its own Edge Function, task-breaker has its own").
- **`task-breaker` Edge Function** (167 lines) — exact pattern reference for `curriculum-parse`: Haiku via OpenRouter, Zod validation, cost logging, `_shared/cors.ts` + `_shared/cost-logger.ts`, JSON-only output with markdown-fence fallback.
- **`createTaskFromData`** — the shared task creation utility with the Build H guard that throws on `taskType='sequential'`. Linked step persistence plugs into the existing routine section/step write path at line 203.
- **`PendingApprovalsSection`** in `src/pages/Tasks.tsx:1062` + `useTasksWithPendingApprovals` + `useApproveTaskCompletion` + `useRejectTaskCompletion`. Sequential mastery submissions reuse this existing queue by setting `tasks.status='pending_approval'` and writing a `task_completions` row with `approval_status='pending'` + new column `completion_type='mastery_submit'`. The UI forks on `task.advancement_mode==='mastery'` to render mastery-specific history and use mastery approve/reject hooks.
- **Studio seed data** in `src/components/studio/studio-seed-data.ts` — `TASK_TEMPLATES_BLANK` + `TASK_TEMPLATES_EXAMPLES` + capability_tags pattern. Reading List is added here.
- **`useActedBy`** for write attribution on practice/mastery events (already used by `useTaskCompletions`)
- **`ListItem`** already has a `url` column — the addendum's note about URLs being supported on list_items is correct. Sequential items (tasks table) did NOT have a dedicated URL column — `useCreateSequentialCollection` currently writes URLs into `image_url` (hook line 139). Build J adds the new `tasks.resource_url` column and corrects this.

#### Dependencies NOT Yet Built

- **PRD-11B Family Celebration gamification consumption of mastery events** — forward note only.
- **PRD-24 Gamification points for practice/mastery/streaks** — forward note only.
- **PRD-28B Compliance reporting consumption of `practice_log`** — schema is designed for this; reports not built here.
- **PRD-29 BigPlans Learning Path container** — forward note. Badge/award "pick N of M" logic belongs here, not in sequential lists. Curriculum-parse detects `pick_n_of_m` patterns in metadata only.
- **PRD-05 `studio_create_guide` conversational creation** — Session 3 Phase 3. Depends on PRD-05, PRD-18, PRD-29.
- **BookShelf reading assignments as a linked source type** — deferred. Reading lists are sequential collections with the Reading List template applied.

#### Build Items (4 sub-phases, one migration)

**Sub-phase A — Foundation (schema + types + hooks + Edge Function)**

1. **Migration `00000000100105_linked_steps_mastery_advancement.sql`** — single file containing all schema changes (bumped from 100104 due to collision with pre-existing `100104_guided_evening_rhythm.sql`):
   - ALTER `tasks` ADD COLUMN (11): `advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`, `mastery_approved_by`, `mastery_approved_at`, `require_mastery_approval`, `require_mastery_evidence`, `track_duration`, `resource_url`
   - ALTER `sequential_collections` ADD COLUMN (5): `default_advancement_mode`, `default_practice_target`, `default_require_approval`, `default_require_evidence`, `default_track_duration`
   - ALTER `task_completions` ADD COLUMN (4): `completion_type` (enum: complete|practice|mastery_submit), `duration_minutes`, `mastery_evidence_url`, `mastery_evidence_note`
   - ALTER `task_template_steps` ADD COLUMN (4): `step_type` (enum: static|linked_sequential|linked_randomizer|linked_task), `linked_source_id`, `linked_source_type`, `display_name_override`
   - ALTER `list_items` ADD COLUMN (10): same 10 advancement columns as tasks
   - ALTER `lists` ADD COLUMN (7): `draw_mode` (enum: focused|buffet|surprise|NULL), `max_active_draws`, and 5 default_* columns
   - CREATE TABLE `practice_log` (id, family_id, family_member_id, source_type, source_id, draw_id, practice_type, duration_minutes, evidence_url, evidence_note, period_date, created_at) + RLS + indexes
   - CREATE TABLE `randomizer_draws` (id, list_id, list_item_id, family_member_id, drawn_at, draw_source, routine_instance_date, status, completed_at, practice_count, created_at) + RLS + indexes + UNIQUE partial on (list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'
   - INSERT 6 feature keys into `feature_key_registry` + tier grants in `feature_access_v2`
   - Idempotent backfill UPDATE: copy `image_url` → `resource_url` for existing sequential task rows where `image_url` was used for URL storage (where `task_type='sequential' AND resource_url IS NULL AND image_url LIKE 'http%'`)
   - All idempotent: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`

2. **TypeScript types** — extend `src/types/tasks.ts` (`Task`, `TaskCompletion`, `SequentialCollection`, `TaskTemplateStep` interfaces) and `src/types/lists.ts` (`List`, `ListItem` interfaces) with the new columns. Add new interfaces: `PracticeLog`, `RandomizerDraw`, `AdvancementMode` enum, `MasteryStatus` enum, `DrawMode` enum, `StepType` enum, `LinkedSourceType` enum, `CompletionType` enum, `PracticeType` enum.

3. **`useCreateSequentialCollection` update** — in `src/hooks/useSequentialCollections.ts`:
   - Change `image_url: item.url ?? null` (line 139) to `resource_url: item.url ?? null`
   - Accept `defaultAdvancementMode`, `defaultPracticeTarget`, `defaultRequireApproval`, `defaultRequireEvidence`, `defaultTrackDuration` on the collection payload
   - Propagate defaults to each child task insert (so new items inherit the collection defaults)

4. **`usePractice` hook file (new)** — `src/hooks/usePractice.ts`:
   - `useLogPractice` mutation: writes practice_log row; for sequential items also writes task_completions (completion_type='practice') and increments tasks.practice_count; auto-promotes next item when practice_count reaches practice_target for practice_count mode
   - `useSubmitMastery` mutation: writes practice_log (practice_type='mastery_submit') + evidence fields; sets source row's mastery_status='submitted', mastery_submitted_at=now(); for sequential items, also sets tasks.status='pending_approval' + writes task_completions row with completion_type='mastery_submit', approval_status='pending'; for randomizer items, sets the active randomizer_draws row to status='submitted' (new status value added to enum in migration) OR just updates list_items.mastery_status — design detail to finalize in implementation
   - `useApproveMasterySubmission` mutation: sets mastery_status='approved', mastery_approved_by, mastery_approved_at; for sequential: sets task status='completed' and triggers `usePromoteNextSequentialItem`; for randomizer: sets list_items.is_available=false (exits pool); writes an audit trail entry
   - `useRejectMasterySubmission` mutation: sets mastery_status back to 'practicing' (NOT 'rejected' on the source — child continues practicing); the practice_log row keeps its rejection note for history; for sequential: resets tasks.status back to 'pending'

5. **`useRandomizerDraws` hook (new)** — `src/hooks/useRandomizerDraws.ts`: query + mutations for the `randomizer_draws` table. Used by Randomizer for Focused/Buffet slot management and by Surprise Me auto-draw.

6. **`useSurpriseMeAutoDraw` hook (new)** — same file or companion: called when a linked Surprise Me routine step renders. Checks for an existing active `randomizer_draws` row for `(list_id, family_member_id, routine_instance_date)`; if none, invokes `useSmartDraw.draw(1)` and writes the draw record with `draw_source='auto_surprise'`. Idempotent.

7. **Edge Function `curriculum-parse`** — `supabase/functions/curriculum-parse/index.ts`:
   - Haiku via OpenRouter (`anthropic/claude-haiku-4.5`)
   - Pattern: copy task-breaker structure exactly (cors, zod, fetch, parse, log cost)
   - System prompt: extract items from curriculum text, detect URLs embedded in text, flag required/starred items, suggest advancement_mode per item, suggest practice_target, detect pick_n_of_m metadata, preserve order, clean up numbering prefixes
   - Input Zod: `raw_text`, `list_type` ('sequential'|'randomizer'), optional `context.subject_area`, optional `context.target_level`, optional `family_id` + `member_id` for cost logging
   - Output: `{ items: [{ title, notes?, url?, is_required?, suggested_advancement_mode, suggested_practice_target?, suggested_require_approval?, prerequisite_note?, sort_order }], detected_metadata?: { source_name?, total_required?, pick_n_of_m? } }`
   - Return input_tokens + output_tokens + call `logAICost` with featureKey='curriculum_ai_parse'

8. **TypeScript check:** `tsc -b` zero errors
9. **Playwright smoke test:** migration applied, new columns queryable via Supabase client

**Sub-phase B — Sequential Advancement Modes UI**

1. `SequentialCreator` UI: new "Advancement defaults" section (default mode, target, approval, evidence, duration toggles) with bulk-set-then-override explanation text; `[Paste Curriculum]` button stub until Sub-phase C wires the modal
2. Item editor (inline from SequentialCollectionView): advancement mode override, practice_target, approval/evidence/duration toggles, resource URL input
3. `SequentialCollectionView` — per-item progress subtitle: "3/5 practices" / "Practiced 8 times" / "Submitted — awaiting approval" / "Mastered"
4. `PracticeCompletionDialog` component — duration prompt modal (15/30/45/60/custom minutes) shown when `track_duration=true` on practice completion
5. `MasterySubmissionModal` component — optional evidence (photo upload or text note) when `require_mastery_evidence=true`; confirms submission; calls `useSubmitMastery`
6. `TaskCard.tsx` updates — sequential task subtitle shows advancement progress; `[Submit as Mastered]` button when mastery status is 'practicing'; resource URL tappable
7. `PendingApprovalsSection` in `Tasks.tsx:1062` — detect mastery submissions via `task.advancement_mode === 'mastery' && task.mastery_status === 'submitted'`; render with practice history count, evidence if present; use `useApproveMasterySubmission` and `useRejectMasterySubmission` instead of the standard approve/reject hooks
8. Playwright tests:
   - Create sequential collection with practice_count mode, default target 3 → practice 3 times → next item auto-promotes
   - Create sequential collection with mastery mode, require_approval=true → practice 5 times → submit → mom approves → item completes + next promotes
   - Reject mastery submission → mastery_status returns to 'practicing', child can continue and resubmit
   - Duration tracking prompt appears when track_duration=true, doesn't appear otherwise
9. `tsc -b` zero errors

**Sub-phase C — Randomizer Advancement Modes + Draw Behaviors + Curriculum Parse**

1. Randomizer list editor (wherever lists are created/edited for randomizer type): add draw_mode selector (Focused/Buffet/Surprise Me), max_active_draws input, default advancement mode + defaults, per-item advancement override
2. `Randomizer.tsx` rendering updates:
   - Focused mode: Draw button locks after one draw until that item is completed/mastered
   - Buffet mode: Draw button allows up to N draws; slot opens on completion/mastery; badge "2/3 active"
   - Surprise Me mode: no Draw button; auto-drawn item rendered immediately (or "All mastered!" celebration); uses `useSurpriseMeAutoDraw`
3. Per-item progress display in the item list section (practice_count / mastery)
4. Randomizer mastery submission modal (reuse/extend the sequential one)
5. Randomizer mastery approval surfacing: inline section at top of RandomizerDetailView showing pending mastery submissions with approve/reject buttons (not going into PendingApprovalsSection for MVP — that's sequential-only)
6. `CurriculumParseModal` component — paste text area, optional subject_area / target_level, `[Parse]` button invoking `curriculum-parse` Edge Function, loading state, review table with per-item editable title / notes / URL / advancement mode dropdown / practice_target input / required flag, Human-in-the-Mix accept-all or per-item accept/reject
7. Wire `CurriculumParseModal` into SequentialCreator `[Paste Curriculum]` button
8. Add equivalent `[Paste Curriculum]` button on randomizer list creator
9. Playwright tests:
   - Create randomizer with mastery mode → practice 5 times → submit → mom approves → item exits pool (is_available=false)
   - Focused draw mode: draw → cannot draw again until item completed
   - Buffet draw mode with max_active_draws=3: can draw 3 times, 4th draw blocked until one completes
   - Surprise Me: linked routine step auto-draws on first open; refresh shows same item (deterministic per day)
   - curriculum-parse Edge Function: happy path with real curriculum text, error handling for malformed responses
10. `tsc -b` zero errors

**Sub-phase D — Linked Routine Steps + Reading List Template + Routine Duplication**

1. `RoutineSectionEditor.tsx` — `StepRow` component extended to show step type on creation:
   - `[+ Add Step]` button → inline dropdown: "Text Step" (existing) / "Linked Content" (new)
   - On "Linked Content" selection: opens `LinkedSourcePicker` modal
   - Linked steps render differently in the editor: link icon, source name, no title input (or greyed out title input with override text field)
   - `display_name_override` text input (optional, below the source display)
2. `LinkedSourcePicker` modal component — `src/components/tasks/sequential/LinkedSourcePicker.tsx`:
   - Tabs: Sequential List / Randomizer List / Recurring Task
   - Lists all family items of the selected type filtered by the assigned member's access permissions
   - Click to select; close modal with source id + type
3. Extend `RoutineStep` type in `RoutineSectionEditor.tsx` with `step_type`, `linked_source_id`, `linked_source_type`, `display_name_override`
4. `createTaskFromData` — extend the routine step persistence block (around line 193) to write the new 4 columns to `task_template_steps`
5. **Routine linked step rendering (child/dashboard view)** — wherever routine steps render (TaskCard or a new routine step renderer), detect `step_type !== 'static'` and render source-appropriate content:
   - `linked_sequential`: show source name / display override + expand to show current active item(s) from the sequential collection (query by `sequential_collection_id` + `sequential_is_active=true`) with resource URL if present, inline practice/mastery buttons
   - `linked_randomizer`: show source name + expand to show currently drawn item(s) from active `randomizer_draws` for this member + list (Surprise Me: the auto-drawn item for today; Focused/Buffet: the manually drawn items)
   - `linked_task`: show source task name + current state (simple passthrough)
6. **Reading List Studio template** — add `ex_reading_list` entry to `TASK_TEMPLATES_EXAMPLES` in `studio-seed-data.ts`:
   - templateType: 'sequential'
   - name: 'Reading List'
   - tagline: 'Sequential reading list with mastery + duration tracking. Finish one book at a time.'
   - Description explaining the workflow
   - capability_tags: ['reading', 'books', 'mastery', 'duration_tracking', 'homeschool', 'curriculum', 'one_at_a_time']
   - When the user clicks [Customize], the SequentialCreator opens with defaults preset: default_advancement_mode='mastery', default_require_approval=true, default_track_duration=true, default_active_count=1, default_promotion_timing='manual'
7. `RoutineDuplicateDialog` component — new modal:
   - Shows the routine name + destination child picker
   - For each linked step in the source routine: a resolution row — "X's routine links to [Source Name]. Which list should Y's link to?" with options: Same list (shared progress) / Pick a different list (list picker) / Create new (opens SequentialCreatorModal or list picker)
   - On submit: duplicates `task_templates` → `task_template_sections` → `task_template_steps` with resolved `linked_source_id` per linked step
8. Wire a `[Duplicate for another child]` button on routine templates in Studio "My Customized"
9. Playwright tests:
   - Build routine with a linked sequential step; assign to child; child sees source name + current item on dashboard; completing the linked item writes practice_log + advances source
   - Build routine with a linked Surprise Me randomizer step; on first dashboard open, auto-draw runs + locks in; refresh shows same item
   - Duplicate routine for second child: linked step prompts for source resolution; pick "Same list" → new routine shares progress; pick "Create new" → SequentialCreatorModal opens to create a new collection for the second child
   - Reading List template deploys with correct defaults (verify in DB that default_advancement_mode='mastery', default_track_duration=true, default_active_count=1)
10. `tsc -b` zero errors
11. **Post-build verification table filled** in feature decision file
12. **STUB_REGISTRY.md updates**: flip lines 429-435 from "⏳ Unwired (MVP) Session 2" to "✅ Wired PRD-09A/09B Linked Steps (Build J)" with 2026-04-XX date
13. **CLAUDE.md additions** (post-build checklist Part B): 10 new convention lines per addendum — linked step semantics, advancement modes, draw modes, practice_log vs task_completions, mastery exit from randomizer pool, Reading List as Studio template, badge/award deferred to BigPlans, curriculum-parse Human-in-the-Mix, linked step frequency inheritance, routine duplication source resolution
14. **Feature decision file verification table completed** with zero Missing, founder sign-off

#### Stubs (NOT Building This Session)

- LiLa `studio_create_guide` conversational creation — Session 3 Phase 3
- Community curriculum template sharing (Creator tier) — post-MVP
- Pre-built curriculum templates (Frontier Girls, classical) — content sprint, not this build
- Learning Path duplication in BigPlans — PRD-29
- Badge/award pick-N-of-M logic — PRD-29
- Gamification point events for practice/mastery — PRD-24
- Auto-Victory on mastery approval — PRD-11 enhancement
- Compliance report consumption of practice_log — PRD-28B
- BookShelf reading assignments as a linked source type — deferred
- Cross-source unified mastery approval queue — sequential uses Tasks.tsx queue; randomizer uses per-list inline section
- Rich evidence capture (camera integration, multi-file) — basic upload/note only in this phase
- Real-time Surprise Me re-draw within same day — explicitly NOT supported (that's the feature)

#### Key Decisions

1. **One migration file.** All 41 column additions + 2 new tables + RLS + indexes + feature keys + backfill in `00000000100105_linked_steps_mastery_advancement.sql`. Idempotent. Rollback is a single file revert.
2. **`practice_log` is the unified cross-source log.** Sequential items also dual-write to `task_completions` (completion_type='practice') for backward-compatible per-task audit views. Randomizer items write ONLY to `practice_log` (no task_completions parent).
3. **`curriculum-parse` is a dedicated Edge Function**, not a reuse of `ai-parse`. Founder convention confirmed Build H. Follows task-breaker code pattern exactly. The addendum's "Same as routine-brain-dump" refers to UX pattern only; routine-brain-dump actually uses shared ai-parse — we're deliberately diverging for architectural consistency with task-breaker.
4. **Mastery rejection = `mastery_status` returns to `'practicing'`**, not `'rejected'`. The completion record keeps the rejection note for history. Child keeps practicing.
5. **Mastered randomizer items exit the pool permanently** via `list_items.is_available = false`. `is_repeatable` is ignored for mastery items.
6. **Surprise Me is deterministic per day** via UNIQUE partial index on `randomizer_draws(list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'`. Refresh = same item.
7. **`resource_url` is a new `tasks` column.** `image_url` is no longer overloaded for sequential item URLs. Migration includes an idempotent backfill for existing rows where `image_url` held a URL.
8. **Sequential mastery approvals reuse `PendingApprovalsSection`** (Tasks.tsx:1062) via `task.status='pending_approval'` + new `completion_type='mastery_submit'` detection. Randomizer mastery approvals surface inline on the Lists detail view. A unified cross-source queue is NOT built in this phase.
9. **Linked steps inherit section frequency**; source advancement is cumulative and independent.
10. **Bulk-set-then-override for advancement defaults.** Collection/list defaults propagate to new items; per-item override is the exception path, not the default path.
11. **Zero new authentication or permission patterns.** Existing RLS + member_permissions apply; linked source picker filters by current member's access already.
12. **4 sub-phases A→B→C→D; Sub-phase A is foundation (schema + hooks + Edge Function); Sub-phase D is the integration layer that ties everything together.**

---

# Build C: PRD-25 Guided Dashboard (Phase A)

### PRD Files
- `prds/dashboards/PRD-25-Guided-Dashboard.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-25-Guided-Dashboard.md`

### Build Spec
`specs/PRD-25-Phase-A-Guided-Dashboard-Core-Spec.md` — Founder-provided implementation spec covering all Phase A build items.

---

### Pre-Build Summary

#### Context
Guided Dashboard is the dashboard experience for children aged 8-12 in the Guided shell. Currently, Guided members see the same Dashboard.tsx wrapped in GuidedShell, which provides a custom bottom nav and simplified header. PRD-25 replaces this with a purpose-built GuidedDashboard with 7 sections, the Next Best Thing suggestion engine, Best Intentions for Guided members, and Mom's Dashboard Management screen.

GuidedShell already exists (`src/components/shells/GuidedShell.tsx`) with its own custom bottom nav (hardcoded navItems, NOT using shared BottomNav.tsx). The shell wraps all Guided member pages including `/dashboard`.

#### Dependencies Already Built
- GuidedShell with custom bottom nav (PRD-04)
- Dashboard.tsx with data-driven section system via dashboard_configs.layout.sections (PRD-14)
- Best Intentions hooks: useBestIntentions with full CRUD + useLogIteration (PRD-06)
- Tasks hooks: useTasks with 12 view formats, useCompleteTask (PRD-09A)
- CalendarWidget (PRD-14B) — needs memberIds filter for self-only view
- DashboardGrid with canReorderOnly prop (PRD-10)
- Widget Picker + Configuration modals (PRD-10)
- FamilyMembers.tsx with dashboard_mode selector (PRD-22)
- Edge Function shared utilities: _shared/cors.ts, _shared/auth.ts, _shared/cost-logger.ts
- useActedBy hook for write attribution (PRD-14)
- useGuidingStars hook for greeting rotation (PRD-06)

#### Dependencies NOT Yet Built
- spelling_coaching_cache table (Phase A creates table, Phase B uses it)
- GuidedDashboard page component (new)
- NBT engine (new frontend computation)
- guided-nbt-glaze Edge Function (new)
- GuidedManagementScreen (new)
- Reading Support CSS infrastructure (new)

#### Build Items (Phase A — 12 items)

**1. Migration 00000000100077**
- `spelling_coaching_cache` table — global cache for spelling coaching explanations (Phase B usage)
- Verify best_intentions + intention_iterations have all needed columns (ADD COLUMN IF NOT EXISTS for safety)
- Feature keys: `guided_dashboard`, `guided_nbt`, `guided_best_intentions`, `guided_reading_support`, `guided_spelling_coaching`, `guided_reflections`, `guided_write_drawer`

**2. TypeScript types**
- `src/types/guided-dashboard.ts` — GuidedDashboardPreferences, GuidedSectionKey, NBTSuggestion, section defaults

**3. Hooks**
- `useGuidedDashboardConfig` — wraps dashboard_configs with Guided-specific defaults
- `useNBTEngine` — 7-level deterministic priority engine from task/intention data
- `useNBTGlaze` — calls guided-nbt-glaze Edge Function with session caching
- `useGuidedBestIntentions` — personal + family intentions for Guided member

**4. Section components (7)**
- GuidedGreetingSection — name + time greeting + Guiding Stars rotation + gamification indicators
- GuidedBestIntentionsSection — personal + family intentions, tap-to-celebrate, child creation
- NextBestThingCard — current suggestion + AI glaze + [Do This] + [Something Else]
- GuidedCalendarSection — self-only CalendarWidget in day view
- GuidedActiveTasksSection — Simple List / Now-Next-Optional, celebration animation
- GuidedWidgetGrid — canReorderOnly, no resize/delete/create
- CelebrateSection — stub with PlannedExpansionCard (PRD-11 dependency)

**5. GuidedDashboard page**
- Conditional render inside Dashboard.tsx when dashboard_mode='guided'
- Section renderer from dashboard_configs.layout.sections with Guided defaults
- Reading Support CSS class toggle

**6. GuidedShell bottom nav rename**
- Change "Journal" → "Write" in GuidedShell.tsx navItems array
- Phase A: still routes to `/journal`. Phase B: triggers Write drawer.

**7. GuidedManagementScreen**
- Section reorder/visibility (Greeting + NBT + Best Intentions unhideable)
- Feature toggles: Reading Support, Spelling Coaching
- Best Intentions CRUD for child
- child_can_create_best_intentions toggle
- Wire into FamilyMembers.tsx as "Manage Dashboard" button for guided members

**8. Edge Function: guided-nbt-glaze**
- Haiku-class model, authenticated, generates 10-20 word encouraging sentence
- Uses _shared/ utilities pattern
- Fallback: "Up next: [task title]"

**9. Reading Support CSS infrastructure**
- `.guided-reading-support` class with larger font + TTS icon visibility
- TTS via browser speechSynthesis API
- Speaker icons (Volume2) hidden by default, shown when enabled

**10. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building Phase A)
- Write drawer (3 tabs: Notepad, Messages, Reflections) — Phase B
- Spelling & Grammar Coaching UI — Phase B
- DailyCelebration Reflections step — Phase C (PRD-11 dependency)
- LiLa Homework Help modal — Future (PRD-05 guided modes)
- LiLa Communication Coach modal — Future (PRD-05 guided modes)
- Victory Recorder integration — Future (PRD-11)
- Visual World theme skinning — Future (PRD-24A)
- Gamification pipeline — Future (PRD-24)
- Before-send message coaching — Future (PRD-15)
- Graduation flow (Guided → Independent) — Post-MVP

### Key Decisions
1. **No separate route** — GuidedDashboard renders conditionally inside Dashboard.tsx based on dashboard_mode='guided'
2. **GuidedShell's own bottom nav modified directly** — not shared BottomNav.tsx
3. **Reuse existing useBestIntentions** — no new hooks for personal intentions
4. **NBT is frontend-only computation** — no database table, no server logic
5. **Gamification indicators are visual stubs** — read from family_members columns
6. **Reading Support is CSS-only** — no backend, uses browser speechSynthesis
7. **spelling_coaching_cache table created but unused in Phase A**
8. **Management screen in FamilyMembers.tsx** — opens as modal for guided members
9. **Unhideable sections: Greeting, Next Best Thing, Best Intentions** — mom cannot hide these

---

# Build D: PRD-17 Universal Queue & Routing System (Gap-Fill) — COMPLETED

### PRD Files
- `prds/communication/PRD-17-Universal-Queue-Routing-System.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`

---

### Pre-Build Summary

#### Context
PRD-17 is the central routing infrastructure — the "sorting station" where items from brain dumps, meetings, LiLa, kid requests, and goals land in one unified inbox. Mom opens the Review Queue modal, processes everything, closes it. This is critical infrastructure that PRD-17B (MindSweep) sits directly on top of.

**~75% of PRD-17 was already built** across earlier phases (PRD-14B, PRD-09A, PRD-08, PRD-14C). This session fills the remaining gaps to make the queue fully functional before MindSweep.

#### Dependencies Already Built
- UniversalQueueModal with 3 tabs, badge counts, "All caught up!" state
- SortTab with studio_queue items, QueueCard, BatchCard (Send as Group / Process All / Expand / Dismiss)
- RoutingStrip with 15+ destinations, context filtering, sub-destination drill-down
- BreathingGlow presence indicator component
- studio_queue table with full PRD-17 schema, RLS, indexes
- useStudioQueue hooks (items, count, batched, role-scoped)
- TaskCreationModal Quick Mode / Full Mode toggle with pre-population
- RoutingToastProvider with 5-second undo
- TaskRouteHandler (notepad → studio_queue)
- PendingItemsBar entry point (Family Overview)
- Feature keys registered (studio_queue, queue_modal, queue_quick_mode, routing_strip, queue_batch_processing)
- Badge style preference (glow/numeric, localStorage)
- RequestsTab stub with empty state (PRD-15 dependency)
- EventCreationModal for calendar event editing (PRD-14B)

#### Dependencies NOT Yet Built
- PRD-15 (Messages, Requests & Notifications) — RequestsTab stays stub
- PRD-16 (Meetings) — meeting_action source stays stub
- PRD-17B (MindSweep) — columns/sources not added yet

#### Build Items (Gap-Fill — 7 items)

**1. QuickTasks "Review Queue" click → opens modal**
- Change the indicator click handler from "toggle mode" to "open UniversalQueueModal"
- QuickTasks needs to import and render UniversalQueueModal
- BreathingGlow on the Inbox icon when any tab has pending items
- When modal is open, indicator remains visible but non-interactive
- Mode toggle (glow/numeric) moves to long-press or is removed (toggle exists in PendingItemsBar already)

**2. CalendarTab wired to real pending events**
- Query `calendar_events WHERE status='pending' AND family_id = currentFamilyId`
- Render approval cards with: event title, date/time, location, submitter (avatar + name via created_by)
- Transportation needs indicator if applicable
- Source indicator if from image/Route
- **Approve** — sage teal bg, sets status='approved', approved_by, approved_at
- **Edit & Approve** — soft gold bg, opens EventCreationModal in edit mode, saves as approved
- **Reject** — light blush bg, dropdown with optional rejection note, sets status='rejected'
- **Approve all (N)** — gradient button at bottom when N > 1
- Empty state: CalendarCheck icon + "No events waiting for approval."
- All colors from theme tokens

**3. List picker from Sort tab**
- When a studio_queue item has `destination='list'`, the [Add to list] button opens a list picker overlay
- List picker shows: existing family lists (filtered by owner), option to create new list
- On selection: add item content as `list_items` record in chosen list, set `studio_queue.processed_at`
- For batch items with destination='list': "Send as Group" adds all items to the same list
- Critical for MindSweep readiness — shopping items need clean list routing

**4. Dashboard queue indicator**
- Add a queue pending indicator somewhere visible on Dashboard (personal view)
- Breathing glow or badge that opens UniversalQueueModal on click
- Only visible to mom/primary_parent (and permitted additional_adults)
- Uses useStudioQueueCount + pending calendar events count

**5. Tasks page queue badge**
- Add badge indicator on Tasks page that opens modal to Sort tab
- Shows count of pending studio_queue items
- Breathing glow when items exist

**6. Calendar page queue badge**
- Add badge indicator on Calendar page that opens modal to Calendar tab
- Shows count of pending calendar events
- Breathing glow when events await approval

**7. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building This Phase)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Notification creation on approve/reject (PRD-15 not built)
- Settings page badge preference toggle (PRD-22)
- Widget/Tracker creation from Sort tab (PRD-10 stubs already in place)
- Goal decomposition → studio_queue (future PRD)
- LiLa destination suggestion hints on queue cards (post-MVP)
- Real-time concurrent processing indicators (post-MVP)
- MindSweep columns/sources/tile (PRD-17B — do not add yet)
- RequestsTab full implementation (PRD-15 — stub already correct)
- Keyboard shortcuts / swipe gestures (post-MVP)

### Key Decisions
1. **QuickTasks click = open modal** — this is the #1 priority. Mom's primary daily entry point.
2. **CalendarTab connects to existing EventCreationModal** for "Edit & Approve" — no new modal.
3. **List picker is essential for MindSweep readiness** — shopping items need list routing, not task routing.
4. **No new migration needed** — all tables and columns already exist.
5. **Stubs stay stubs** — RequestsTab, notification auto-dismiss, MindSweep columns are all correctly deferred.
6. **BreathingGlow already works** — just needs to be connected to more entry points.

---

# Build E: PRD-17B MindSweep

### PRD Files
- `prds/communication/PRD-17B-MindSweep.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17B-MindSweep.md`

---

### Pre-Build Summary

#### Context
MindSweep is the AI auto-sort intelligence layer that sits on top of the Universal Queue & Routing System (PRD-17, just completed — 30 wired, 7 stubbed, 0 missing, 24 E2E tests passing). It is a **mode**, not a separate feature. It adds automatic extraction, classification, confidence scoring, and routing to the existing Notepad -> Review & Route -> Queue pipeline. Three routing paradigms now exist: "Send to" (manual), "Review & Route" (semi-manual), "MindSweep" (automatic).

MindSweep also introduces external intake channels: quick-capture PWA at `/sweep`, share-to-app, and email forwarding (email delivery stubbed — requires DNS setup).

This is a competitive differentiator against Jam Family Calendar's "Jaime" which routes to 3 destinations. MindSweep routes to 15+ destinations with configurable intelligence, sensitivity rules, cross-member detection, and learning patterns.

#### Infrastructure Already Built
- **PRD-17 (Universal Queue)** — FULLY BUILT: UniversalQueueModal, SortTab, QueueCard, BatchCard, RoutingStrip (15+ destinations), ListPickerModal, TaskCreationModal, BreathingGlow, RoutingToastProvider, useStudioQueue hooks, QueueBadge on Dashboard/Tasks/Calendar, QuickTasks modal trigger
- **studio_queue table** — Full schema with RLS, indexes. Already has `mindsweep_confidence` + `mindsweep_event_id` columns. `source` field has no CHECK constraint (free text).
- **families table** — Already has `sweep_email_address` + `sweep_email_enabled` columns (migration 00000000000001)
- **pgvector infrastructure** — FULLY BUILT: `embed` Edge Function (processes 13+ tables), `queue_embedding_job()` trigger, pgmq `embedding_jobs` queue, halfvec(1536) with HNSW indexes on 14 tables, `match_bookshelf_chunks()` + `match_bookshelf_extractions()` RPCs, OpenAI text-embedding-3-small
- **whisper-transcribe** — Edge Function exists, processes audio via OpenAI Whisper
- **useVoiceInput hook** — Exists with MediaRecorder + Web Speech API + Whisper fallback
- **Vision OCR** — Pattern exists in bookshelf-process (Claude Haiku via OpenRouter for image text extraction)
- **All routing destinations** — Tasks, Lists (10 types), Calendar, Journal, Victory Recorder, Guiding Stars, Best Intentions, Archives, InnerWorkings, Backburner, Ideas
- **context-assembler.ts** — Three-layer relevance-filtered context assembly in `_shared/`
- **cost-logger.ts** — AI cost tracking utility in `_shared/`
- **QuickTasks MindSweep button** — Already defined (Brain icon, routes to `/sweep`)
- **QuickCreate MindSweep action** — Already defined (routes to `/sweep`)
- **Types** — `mindsweep_confidence` already typed in `src/types/tasks.ts`

#### Dependencies NOT Yet Built
- PRD-15 (Messages/Notifications) — cross-member notification creation stubbed
- PRD-16 (Meetings) — "MindSweep All" stubbed
- PRD-18 (Rhythms) — MindSweep Digest rendering stubbed (register section type only)
- PRD-33 (PWA/Offline) — full offline sync stubbed (basic IndexedDB capture for /sweep fine)

#### What's Now Built (Sprint 1+2, 2026-04-03)
- `/sweep` route in App.tsx (ProtectedRouteNoShell)
- `MindSweepCapture.tsx` page — text, voice, scan (ScanLine → Haiku vision OCR), link (URL → Haiku summarize), holding queue UI, settings panel (5 sections)
- `mindsweep-sort` Edge Function — embedding-first + Haiku LLM batch classification, sensitivity rules, cross-member detection
- `mindsweep-scan` Edge Function — 2 modes: `scan` (image → text via Haiku vision) and `link` (URL → summarized text)
- MindSweep tile on RoutingStrip wired to sweep pipeline (NotepadDrawer intercepts `destination === 'mindsweep'`)
- Processing overlay in NotepadDrawer + status display on /sweep
- `useRunSweep` shared hook — used by both NotepadDrawer and MindSweepCapture
- `useDeleteHolding` + `useMarkHoldingProcessed` mutations with cache invalidation
- `useSweepStatus` with 8-second auto-reset timer
- `routeSweepResults` concurrent inserts via Promise.all
- `useVoiceInput` — `forceHighAccuracy` option + <30s Web Speech API shortcut (skip Whisper for short recordings)
- `UndoToast` / `RoutingToastProvider` — `onUndo` made optional for MindSweep confirmation toasts
- Confidence badge on QueueCard for MindSweep-originated items
- 11 Playwright E2E tests passing
- `tsc -b` zero errors

#### Sub-Phase Plan (3 phases)

**Phase A: Data layer + mindsweep-sort Edge Function + RoutingStrip tile**
1. Migration `00000000100089_mindsweep_tables.sql` — 5 new tables with RLS + indexes + feature keys + classify_by_embedding RPC
2. TypeScript types: `src/types/mindsweep.ts`
3. `mindsweep-sort` Edge Function — embedding-first classification + Haiku LLM fallback + sensitivity rules + cross-member detection + recipe/travel detection
4. MindSweep tile on RoutingStrip — Wand2 icon, sends content through `mindsweep-sort`, handles results per aggressiveness mode
5. Processing indicator + confirmation toast
6. Confidence badge on QueueCard for MindSweep-originated items
7. `useMindSweep` hook — settings, sweep trigger, holding queue management
8. TypeScript check: `tsc -b` zero errors

**Phase B: Quick-capture PWA + voice + scan + holding queue**
1. ~~`/sweep` route in App.tsx~~ DONE (Sprint 1)
2. ~~`MindSweepCapture.tsx` page component — text, voice, scan, link~~ DONE (Sprint 1+2)
3. ~~Voice optimization: Web Speech API for <30s, Whisper for 30s+~~ DONE (Sprint 2)
4. ~~Scan: vision model OCR — image NOT stored, text extraction only~~ DONE (Sprint 2)
5. ~~Link capture: URL fetch + summarize~~ DONE (Sprint 2)
6. ~~Holding queue UI: item count, [Sweep All], [Save for Later]~~ DONE (Sprint 2)
7. Auto-sweep: pg_cron job at configured time — NOT YET
8. Share-to-app via Web Share Target API — NOT YET (investigate PWA setup)
9. PWA manifest for `/sweep` (distinct icon) — NOT YET (investigate PWA setup)
10. Basic IndexedDB offline capture — NOT YET
11. ~~QuickTasks MindSweep button opens quick-capture~~ DONE (already wired)
12. ~~TypeScript check~~ DONE

**Phase C: Settings + email stub + polish**
1. MindSweep Settings screen — 8 sections (auto-sort mode, always-review rules, processing schedule, voice, scanning info, external intake, home screen, digest)
2. Email forwarding UI (display address, allowed senders management) — delivery stubbed
3. `mindsweep-email-intake` Edge Function code (ready to enable when DNS configured)
4. Approval pattern data collection (record actions to `mindsweep_approval_patterns`)
5. Feature keys + `useCanAccess()` wiring
6. MindSweep Digest section type #28 registered (stub renderer)
7. TypeScript check
8. Post-build PRD verification

### Stubs (NOT Building Any Phase)
- Approval pattern LEARNING recommendations (Phase 2)
- Weekly MindSweep intelligence report (Phase 2)
- Email forwarding DELIVERY infrastructure (DNS + webhook)
- MindSweep onboarding prompt (add to home screen during onboarding)
- MindSweep Digest RENDERING in rhythms (PRD-18 not built)
- "MindSweep All" on meeting post-processing (PRD-16 not built)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Cross-member routing notification creation (PRD-15 not built)
- Proactive capture prompts
- MindSweep dashboard widget
- Seasonal content capture suggestions
- SMS intake channel
- Full offline sync (PRD-33 scope)

### Key Decisions
1. **Embedding-first classification is viable** — pgvector infrastructure fully built (14 tables with embeddings, `embed` Edge Function, HNSW indexes). Need new `classify_by_embedding()` RPC to compare MindSweep items against existing family content.
2. **5 mindsweep tables need creation** — none exist in live DB. Migration 00000000100089.
3. **studio_queue columns already exist** — mindsweep_confidence + mindsweep_event_id already in migration 00000000000008. No ALTER needed.
4. **families sweep columns already exist** — sweep_email_address + sweep_email_enabled in migration 00000000000001. No ALTER needed.
5. **Vision OCR reuses bookshelf-process pattern** — Claude Haiku via OpenRouter for image text extraction. Extract into shared utility or inline in mindsweep-sort.
6. **Voice optimization wraps existing useVoiceInput** — add <30s Web Speech API shortcut before Whisper.
7. **Non-queue destinations route directly** — Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives, InnerWorkings create records directly. Tasks, Lists go through studio_queue.
8. **3 sub-phases** — A (data + Edge Function + RoutingStrip), B (PWA + voice + scan + holding), C (settings + email + polish).

---

# Build F: PRD-23 BookShelf Platform Library (Phase 1: Schema + Data Migration) — COMPLETED

### PRD Files
- `prds/ai-vault/PRD-23-BookShelf.md` (full PRD)
- `specs/BookShelf-Platform-Library-Phase1-Spec.md` (founder-approved architecture spec)

### Addenda Read
- `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-23-Session-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1.md`

---

### Pre-Build Summary

#### Context
BookShelf currently stores chunks, embeddings, and extractions at the family level — 5 separate extraction tables each with `family_id` and `family_member_id`. Every family uploading the same book pays full AI cost again (~$1-2/book). The correct architecture: books, chunks, and extractions live at the platform level in `platform_intelligence`. Personal state (hearts, notes) moves to `bookshelf_user_state`, created on-demand per member.

This is Phase 1 of 5: database-only. Create new tables, migrate existing data, set up RLS, update RPCs. No Edge Function or frontend changes.

#### Current Data State (Verified from live DB 2026-04-03)

| Table | Rows | Notes |
|---|---|---|
| bookshelf_items (total) | 559 | 348 standalone + 33 parents + 178 child parts |
| bookshelf_items (extracted) | 228 | extraction_status='completed' |
| bookshelf_items (chunked only) | 331 | extraction_status='none' |
| bookshelf_chunks | 58,115 | Platform-level via book_cache_id |
| bookshelf_summaries | 21,538 | 2 hearted |
| bookshelf_insights | 23,977 | 7 hearted |
| bookshelf_declarations | 16,931 | 4 hearted |
| bookshelf_action_steps | 16,134 | 0 hearted |
| bookshelf_questions | 9,894 | 0 hearted |
| platform_intelligence.book_cache | 578 | 19 more than bookshelf_items (orphans) |
| bookshelf_discussions | 4 | 9 messages |
| bookshelf_collections | 15 | 83 items |
| journal_prompts | 2 | |
| bookshelf_member_settings | 3 | |

- **Hearted items:** 13 total (0 user notes, 0 routing flags set)
- **book_cache_id:** populated for ALL 559 items (zero NULLs), 559 distinct values
- **Distinct families:** 1

#### Multi-Part Book Structure (33 parents, 178 children)

33 books were split into 2-9 parts during upload. Parent row has clean title + `part_count`. Child rows have `parent_bookshelf_item_id` + `part_number`. Each has its own unique `book_cache_id`.

**Chunk storage is inconsistent across multi-part books:**
- Some parents have chunks, children don't (e.g., Critical Thinking: 361 parent chunks)
- Some have BOTH duplicated (e.g., Your Forces: 699 parent + 602 child)
- Some have neither (e.g., Actionable Gamification: 0 on both)
- **Extractions always live on CHILD items, not parents** (verified: parent has 0 summaries, child part 2 has 160)

**Founder-approved consolidation decision:** Each parent maps to ONE book_library entry. All child parts' chunks + extractions consolidate under the parent's book_library_id.

#### Dependencies Already Built
- `platform_intelligence.book_cache` table (578 rows, title_author_embedding, ethics_gate_status)
- `bookshelf_items` table (32 cols) with `book_cache_id` FK, `parent_bookshelf_item_id`, `part_number`, `part_count`
- `bookshelf_chunks` table (10 cols: id, book_cache_id, chunk_index, chunk_text, token_count, chapter_title, chapter_index, embedding, metadata, created_at)
- 5 extraction tables — routing columns only on declarations (sent_to_guiding_stars, guiding_star_id), action_steps (sent_to_tasks, task_id), questions (sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id). Summaries and insights have NO routing columns.
- `match_bookshelf_chunks` + `match_bookshelf_extractions` RPCs
- Embedding pipeline (util.queue_embedding_job triggers on all extraction tables)
- Study guide components + Edge Function stub (not affected by Phase 1)

#### Dependencies NOT Yet Built
- `platform_intelligence.book_library` (renamed from book_cache — this phase)
- `platform_intelligence.book_chunks` (new — this phase)
- `platform_intelligence.book_extractions` (new unified table — this phase)
- `bookshelf_user_state` (new — this phase)
- `match_book_chunks` + `match_book_extractions` RPCs (new — this phase)

#### Build Items (Phase 1 — 8 items)

**1. Migration 00000000100090_bookshelf_platform_library.sql**
- Rename `platform_intelligence.book_cache` → `platform_intelligence.book_library`
- Add columns: extraction_status, extraction_count, discovered_sections
- Create `platform_intelligence.book_chunks` (book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count)
- Create `platform_intelligence.book_extractions` unified table
  - extraction_type discriminator (summary/insight/declaration/action_step/question)
  - 3 text levels: text, guided_text, independent_text
  - Type-specific nullable columns: content_type, declaration_text, style_variant, value_name, richness
  - Flags: is_key_point, is_from_go_deeper, is_deleted, audience
- Create `bookshelf_user_state` (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai, routing flags, UNIQUE(member_id, extraction_id))
- Add `book_library_id` column to `bookshelf_items`
- RLS + indexes + HNSW embedding indexes + updated_at triggers

**2. Data migration: Link bookshelf_items → book_library (multi-part consolidation)**
- Standalone + parent items: `book_library_id = book_cache_id` (direct 1:1)
- Child parts: `book_library_id = parent's book_cache_id` (consolidate under parent)
- Covers ALL 559 items

**3. Data migration: Chunks to platform level**
- Copy bookshelf_chunks → platform_intelligence.book_chunks
- For multi-part children: remap book_cache_id → parent's book_library_id
- For multi-part chunk ordering: `(part_number * 10000) + chunk_index` preserves sequence
- Preserve embeddings (no re-embedding); disable trigger during bulk insert
- Column mapping: chunk_text → text, token_count → tokens_count, metadata dropped

**4. Data migration: Extractions to platform level**
- Consolidate 5 tables → platform_intelligence.book_extractions
- For multi-part children: remap via bookshelf_item → parent's book_library_id
- Map extraction_type from source table name
- Map type-specific columns (declaration_text, style_variant, value_name, richness)
- **CRITICAL:** Disable embedding triggers during bulk insert to avoid 88K re-embedding jobs

**5. Data migration: Personal state (13 hearted items)**
- Create bookshelf_user_state rows for all 13 hearted items
- Match old extraction rows → new book_extractions rows by text + section_title + extraction_type
- Preserve routing flags (all currently false/null but schema supports them)

**6. Update book_library extraction_status**
- Set extraction_status='completed' and extraction_count for books with extractions
- Multi-part parents: sum extraction counts across all child parts

**7. New RPCs: match_book_chunks + match_book_extractions**
- `match_book_chunks`: queries platform_intelligence.book_chunks, filtered by family's bookshelf_items.book_library_id
- `match_book_extractions`: queries platform_intelligence.book_extractions LEFT JOIN bookshelf_user_state for personal state

**8. Verification queries**
- Row count validation (chunks, extractions, user_state)
- Multi-part consolidation check (parent book_library entries have correct counts)
- RLS check (authenticated read, service write)
- RPC smoke test

### Stubs (NOT Building This Phase)
- Edge Function changes (Phase 3)
- Frontend code changes (Phase 2)
- Old table drops (Phase 4)
- guided_text/independent_text generation (Phase 3 backfill)
- bookshelf-process cache hit/miss wiring (Phase 3)
- Multi-part chunk deduplication (Phase 4 cleanup)

### Key Decisions
1. **Multi-part consolidation** — 33 parent books each map to ONE book_library entry. 178 child parts' chunks + extractions consolidate under parent's book_library_id. Chunk ordering preserved via `(part_number * 10000) + chunk_index`.
2. **Add book_library_id, keep book_cache_id** — new column for new RPCs, old column stays for backward compat. Phase 4 drops book_cache_id.
3. **Copy chunks to new PI table** — HNSW indexes can't be built on views. ~175MB temporary duplication until Phase 4.
4. **Disable embedding triggers during bulk migration** — 88K extractions + 58K chunks would overwhelm queue. Existing embeddings copied directly.
5. **Column name mapping** — bookshelf_chunks.chunk_text → book_chunks.text, token_count → tokens_count, metadata dropped.
6. **Old tables stay functional** — no drops, no FK changes. Frontend continues on old tables until Phase 2.
7. **bookshelf_user_state on-demand only** — 13 rows created for hearted items; future hearts create rows on demand.

---

# Build G: PRD-15 Messages, Requests & Notifications

### PRD Files
- `prds/communication/PRD-15-Messages-Requests-Notifications.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md` (MindSweep cross-member routing)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-15-Messages-Requests-Notifications.md`

### Build Plan
`C:\Users\tenis\.claude\plans\structured-wibbling-riddle.md` — Founder-reviewed 5-phase plan.

---

### Pre-Build Summary

#### Context
PRD-15 defines the family communication backbone — three interconnected subsystems (Messages, Requests, Notifications) across 10 screens, 12 database tables, 11 feature keys, and 4 Edge Functions. This is the largest remaining PRD and every other feature depends on Notifications.

Only `out_of_nest_members` (migration 17, 4 rows) exists. `notifications` and `notification_preferences` exist in DB but are NOT API-exposed and have no migration file. All messaging tables and `family_requests` do NOT exist yet. `usePendingCounts.ts` query on `family_requests` silently fails (returns 0). `RequestsTab.tsx` is a stub. `MessagesPage` is a placeholder. No notification bell in any shell.

#### Dependencies Already Built
- out_of_nest_members table (migration 17, 4 rows, used in FamilySetup + ArchivesPage)
- RequestsTab.tsx stub in UniversalQueueModal
- MessagesPage placeholder at /messages route
- RoutingStrip 'message' destination (exists but no handler)
- QuickCreate "Send Request" action (falls back to Notepad)
- BreathingGlow component (src/components/ui/BreathingGlow.tsx)
- CalendarTab approve/reject handlers (ready for notification wiring)
- ListPickerModal, EventCreationModal, TaskCreationModal (for request accept routing)
- MemberPillSelector component
- ModalV2 component
- usePendingCounts.ts (queries family_requests, silently fails)
- _shared/context-assembler.ts, _shared/cost-logger.ts, _shared/cors.ts, _shared/auth.ts

#### Dependencies NOT Yet Built
- Supabase Realtime (first usage in codebase — verify enabled on project)
- Push notification infrastructure (post-MVP)
- Email delivery for Out of Nest (stub)
- PRD-16 (Meetings) — meeting action items → requests deferred
- PRD-30 (Safety) — safety flag alert notifications deferred

#### Build Phases (5 phases, A→B→C/D→E)

**Phase A: Infrastructure** — Migration 00000000100098 (9 new tables + 2 ALTER + RLS + triggers + indexes + 11 feature keys), TypeScript types, feature key registration. RLS built WITH the tables — critical privacy rule: mom cannot read other members' messages.

**Phase B: Notifications + Calendar Wiring** — NotificationBell (reuses BreathingGlow), NotificationTray, NotificationPreferencesPanel, useNotifications + useNotificationPreferences hooks, createNotification utility. Bell added to Mom/Adult/Independent shells. Wire calendar approve/reject notifications immediately for real test data.

**Phase C: Requests** — useRequests hook, QuickRequestModal, RequestCard (handles source='mindsweep_auto' attribution), wire RequestsTab, QuickCreate "Send Request", RoutingStrip 'request' destination (15th), accept routing to Calendar/Tasks/List/Acknowledge with sender notification.

**Phase D: Messages Core** — 6 hooks (spaces, threads, messages, realtime, permissions, unread count), MessagesPage (Spaces + Chats tabs), ConversationSpaceView, ChatThreadView, MessageInputBar, ComposeFlow, MessageSearch, initializeConversationSpaces (runs on first /messages visit with warm loading state). Sidebar nav + Queue Modal chat shortcut.

**Phase E: Messages Advanced** — 4 Edge Functions (lila-message-respond, message-coach, auto-title-thread, notify-out-of-nest stub), CoachingCheckpoint, ContentCorner + LinkPreviewCard, MessagingSettings (7 sections), LiLa "Ask LiLa & Send" button, "Discuss" from request → conversation thread.

#### Stubs (NOT Building)
- Push notifications, SMS/text for Out of Nest
- Morning digest / Daily Briefing
- Victory sharing / Family celebration / Permission change / LiLa suggestion notifications
- Content Corner LiLa link pre-screening
- Higgins/Cyrano coaching integration
- Read receipts, message reactions, voice messages
- Extended Out of Nest (family tree)
- Message coaching activity log
- Calendar reminder notifications via pg_cron

#### Key Decisions
1. **RLS in Phase A** — built with tables, not bolted on. Mom can't read other members' messages.
2. **Calendar notifications wired in Phase B** — real test data for notification tray from day one
3. **BreathingGlow reused** — existing component from PRD-17, not recreated
4. **usePendingCounts backward compatible** — existing query shape works after table creation, Phase C tightens
5. **Queue Modal chat shortcut in Phase D** — per PRD-15 Screen 8
6. **"Send as Request" in Phase C** — 15th RoutingStrip destination, not deferred
7. **family_requests.source includes 'mindsweep_auto'** — PRD-17B cross-member routing
8. **initializeConversationSpaces on first /messages visit** — warm loading state, idempotent, no PRD-01 coupling

---

# Build H: PRD-09A/09B Studio Intelligence Phase 1 — Sequential Wiring Fix + Cross-Surface Visibility + Capability Tags

### PRD Files
- `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

### Addenda Read
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (**primary authoritative source for this build — Phase 1 scope only**)
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (read for Session 2 context — NOT building this session)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `specs/studio-seed-templates.md` (founder-authoritative Studio five-layer mental model)
- `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` (forward concept capture — not in scope)

### Feature Decision File
`claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`

### Build Plan
Session 1 of a three-session sequence:
- **Session 1 (this build):** Fix broken sequential creation wiring, randomizer on Lists page, sequential cross-surface visibility, capability tags foundation on Studio seed data.
- **Session 2 (next):** Linked Steps / Mastery / Advancement addendum — advancement modes, `practice_log` + `randomizer_draws` tables, linked routine steps, `curriculum-parse` Edge Function, Reading List template, routine duplication.
- **Session 3 (after):** Studio Intelligence Phase 2 — "What do you want to create?" search bar, use case categories, enhanced template cards, "My Library" tab, post-creation recommendations.
- **Phase 3 (forward note, not scheduled):** LiLa `studio_create_guide` conversational creation mode. Depends on PRD-05, PRD-18, PRD-29.

---

### Pre-Build Summary

#### Context

The PRD-09A/09B audit discovered that sequential collection creation is **broken everywhere**. Fully-built dead-code components (`SequentialCreator.tsx`, `SequentialCollectionView.tsx`, `useCreateSequentialCollection` hook) exist but have zero callers in src/. The `sequential_collections` table has **0 rows** in the live database (confirmed in `claude/live_schema.md` line 757). Every current "Create Sequential" entry point opens `TaskCreationModal` with `initialTaskType='sequential'`, which silently writes a malformed single row to the `tasks` table with no children and no `sequential_collections` entry.

Additionally, the `Lists.tsx:357` hard-coded type picker grid excludes `'randomizer'` even though `RandomizerDetailView`, the `Randomizer` component, and the `TYPE_CONFIG` entry all exist. Randomizer creation works only via the Studio → `/lists?create=randomizer` URL-param backdoor.

This build is a deliberate architectural evolution from PRD-09A line 469's original ruling ("Sequential collections need their own tab because the management experience is unique"). Per the Studio Intelligence addendum, sequential collections will now be visible on **both** the Tasks → Sequential tab AND the Lists page. Mom thinks of sequential collections as "lists of content for my kids," not "task-system items." Dual access, not migration. The rich management experience (`SequentialCollectionView`) is the primary rendering on both surfaces. Studio remains the universal creation library. The capability tags added this session are the data foundation for Session 3's intent-based Studio search.

**No database migrations. No new tables. No new columns. Phase 1 is 100% frontend wiring plus a seed data config update.**

#### Dependencies Already Built
- `sequential_collections` table (live schema line 757) — 14 columns, 0 rows
- `useCreateSequentialCollection` hook (`src/hooks/useSequentialCollections.ts:80-165`) — fully functional mutation
- `useSequentialCollection` hook — fetches collection + child tasks + active task
- `useSequentialCollections` hook — lists all collections for a family
- `useRedeploySequentialCollection` — restart-for-another-student flow
- `SequentialCreator.tsx` — full creation UI with title, manual/URL/image, items textarea, BulkAddWithAI integration, promotion timing, active count. **Zero callers in src/**.
- `SequentialCollectionView.tsx` — full management view with progress bars, active item highlighting, restart-for-another-student, archive, member picker modal. **Zero callers in src/**.
- `TaskCreationModal.tsx` — accepts `initialTaskType` prop (line 107, 401), assigns to state (line 412, 437)
- `createTaskFromData.ts` — shared task creation utility used by 4 shells
- `Lists.tsx` — `TYPE_CONFIG` includes `randomizer`, `RandomizerDetailView` rendered when `list_type='randomizer'`, `?create=` URL param path (lines 157-164)
- `Studio.tsx` — `handleCustomize` with sequential branch (lines 223-228) currently routing to TaskCreationModal
- `studio-seed-data.ts` — `TASK_TEMPLATES_BLANK`, `TASK_TEMPLATES_EXAMPLES`, `GUIDED_FORM_TEMPLATES_BLANK`, `GUIDED_FORM_TEMPLATES_EXAMPLES`, `LIST_TEMPLATES_BLANK`, `LIST_TEMPLATES_EXAMPLES`, `RANDOMIZER_TEMPLATE_BLANK`. Sequential blank template at `sys_task_sequential` (line 66).
- `StudioTemplate` type — defined in `StudioTemplateCard.tsx`
- `BulkAddWithAI` component — already wired inside `SequentialCreator` (lines 163-179) for AI parse of table-of-contents
- `useLists` hook — simple `.from('lists').select('*').eq('family_id', familyId)` query, returns `List[]`
- `useFamily`, `useFamilyMember`, `useFamilyMembers` hooks — for context
- `ModalV2` component — for the new `SequentialCreatorModal` wrapper
- Live randomizer infrastructure: `Randomizer` component, `RandomizerDetailView`, `lists.list_type='randomizer'` support in all CRUD hooks

#### Dependencies NOT Yet Built
- **Session 2 scope (read for context only, NOT built this session):**
  - Advancement mode columns (`advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, etc.) on `tasks` and `list_items`
  - `practice_log` table
  - `randomizer_draws` table
  - `resource_url` column on `tasks`
  - Default advancement columns on `sequential_collections`
  - `draw_mode` column on `lists`
  - Linked routine steps (`step_type` enum on `task_template_steps`)
  - `curriculum-parse` Edge Function
  - Reading List Studio template
  - Routine duplication with linked step resolution
- **Session 3 scope (Phase 2):** "What do you want to create?" search bar, use case categories, enhanced template cards rendering capability tags, "My Library" tab, post-creation smart recommendation cards
- **Phase 3 scope (forward note):** LiLa `studio_create_guide` mode, conversational school year planner, proactive Studio suggestions
- **Captured concepts (not scheduled):** Living shopping list enhancement, backburner activation as victory

#### Build Items (Phase 1 — 14 items, 4 sub-phases)

**Sub-phase 1A: Revive dead sequential creation code + guard broken path (7 items)**
1. Create `src/components/tasks/sequential/SequentialCreatorModal.tsx` — tiny ModalV2 wrapper around the existing `SequentialCreator` component. Accepts `isOpen`, `onClose`, `familyId`, `createdBy`, `assigneeId` (optional), `onSaved` callback. Internally calls `useCreateSequentialCollection().mutateAsync()` with the shape: `{ collection: {family_id, title, promotion_timing, active_count}, items: [{title}], assigneeId, createdBy }`. Reused from Studio, Tasks page, and Lists page — single source of truth for the creation modal shell.
2. Update `TaskCreationModal.tsx` `useEffect` that assigns `initialTaskType` (lines 412 and 437) to skip `'sequential'` — log a `console.warn` if encountered, do not assign to state. This is a defensive change; the proper fix is the guard in step 3.
3. Add guard clause at top of `createTaskFromData()` in `src/utils/createTaskFromData.ts` — if `data.taskType === 'sequential'`, throw `new Error("Sequential collections must be created via useCreateSequentialCollection, not createTaskFromData. This is a bug — check the caller.")`. Prevents silent re-introduction of the broken path.
4. Update `Studio.tsx` `handleCustomize` branch for `sequential` template type (currently lines 223-228): instead of setting `modalInitialType='sequential'` and opening TaskCreationModal, open the new SequentialCreatorModal. Add `sequentialModalOpen` state.
5. Update `Tasks.tsx` `SequentialTab` `onCreate` handler (line 493 wiring): open the new SequentialCreatorModal instead of `setShowCreateModal(true)` (which opens TaskCreationModal). Add `sequentialModalOpen` state in the Tasks page.
6. Replace `Tasks.tsx` `SequentialTab` inline rendering (lines 1197-1302) with `<SequentialCollectionView familyId={family.id} onCreateCollection={() => setSequentialModalOpen(true)} />`. Standalone-sequential-task rendering path (lines 1292-1300) is removed — standalone sequential tasks without a collection are no longer a valid state once the creation path is fixed.
7. Verify `SequentialCollectionView.tsx` doesn't need internal changes. It already uses `useSequentialCollections(familyId)`, `useSequentialCollection(id)`, `useRedeploySequentialCollection`, and `useFamilyMembers`. All hooks exist and work. The one concern is the `onCreateCollection` callback — the component accepts it as a prop and already renders a [+ Create] button that fires it.

**Sub-phase 1B: Randomizer on Lists page type picker (1 item)**
8. Edit `Lists.tsx:357` — add `'randomizer'` to the hard-coded type array. One-line fix. After fix: `(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'reference', 'ideas', 'prayer', 'backburner', 'randomizer', 'custom'] as ListType[])`. Randomizer already has a TYPE_CONFIG entry (line 88), RandomizerDetailView already renders it (line 1025-1029), and the createList path already accepts `list_type='randomizer'`.

**Sub-phase 1C: Cross-surface visibility — sequential on Lists page (4 items)**
9. Add `'sequential'` as a TYPE_CONFIG entry in `Lists.tsx` with distinct icon (`Layers` or `BookOpen`). Label: "Sequential Collection". Description: "Ordered items that feed one at a time". Mark as a special meta-type that doesn't map to a real `list_type` enum value.
10. Add `'sequential'` to the type picker grid at `Lists.tsx:357`. When clicked, opens the SequentialCreatorModal instead of the simple list-name input path (requires adding a branch before `handleCreate`).
11. Query sequential collections on the Lists page: import `useSequentialCollections` and call with `family?.id`. Render a new `SequentialCollectionCardOnList` component for each, placed above (or alongside) the regular list cards. Cards show: BookOpen/Layers icon, "Sequential" badge (theme-tokened pill), title, progress indicator (compute from `useSequentialCollection(id)` or use the `current_index` + `total_items` fields on the row without the deeper query for performance). Tapping the card sets a new `selectedSequentialId` state.
12. When `selectedSequentialId` is set, render `<SequentialCollectionView>` in a detail view (mirroring the `selectedListId` pattern at `Lists.tsx:217-224`). Uses the same back button / detail container pattern as `ListDetailView`.

**Sub-phase 1D: Capability tags on Studio seed data (2 items)**
13. Add `capability_tags: string[]` as a **required** field (no `?`) on the `StudioTemplate` type in `src/components/studio/StudioTemplateCard.tsx`. TypeScript compile error on any template that forgets tags.
14. Populate `capability_tags` on every seed template in `studio-seed-data.ts`: all TASK_TEMPLATES_BLANK entries, all TASK_TEMPLATES_EXAMPLES, all GUIDED_FORM_TEMPLATES_BLANK, all GUIDED_FORM_TEMPLATES_EXAMPLES, all LIST_TEMPLATES_BLANK, all LIST_TEMPLATES_EXAMPLES, and RANDOMIZER_TEMPLATE_BLANK. Tag lists taken verbatim from `PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.

**Verification (3 items, part of the build)**
- `tsc -b` — zero errors. Mandatory before declaring complete (CLAUDE.md convention #121).
- Playwright E2E test file `tests/e2e/features/studio-intelligence-phase1.spec.ts` — create sequential from Studio, Tasks, Lists → each produces one `sequential_collections` row + N `tasks` rows with proper `sequential_collection_id`. Create randomizer from Lists page [+ New List] picker → produces one `lists` row with `list_type='randomizer'`. Verify sequential collection appears on Lists page AND Tasks → Sequential tab after creation.
- `npm run check:colors` — no hardcoded colors introduced. Mandatory per CLAUDE.md convention #15.

#### Stubs (NOT Building This Phase)

All Phase 2 items (search, categories, My Library, recommendations), all Phase 3 items (LiLa creation guide), all Session 2 Linked Steps items (advancement modes, practice_log, linked steps, curriculum-parse, Reading List template, routine duplication). Per-item edit/reassign/delete on SequentialCollectionView remains as-is (existing PRD-09A stub, not regressing).

#### Key Decisions
1. **Zero database changes.** Capability tags live in TypeScript seed data config (Option B from addendum §1D). Tags are a Studio presentation concern, not a runtime data concern.
2. **SequentialCreatorModal is the single source of truth** for sequential creation. Studio, Tasks page, and Lists page all open the same modal. Reuses the existing SequentialCreator component UI without modification.
3. **Dual access, not migration.** Sequential collections remain on Tasks → Sequential tab (with upgraded rendering via the revived SequentialCollectionView) AND are visible on the Lists page. Both paths open the same creation modal and the same management view.
4. **Defensive guards at two layers.** `TaskCreationModal` skips `initialTaskType='sequential'` with a warning; `createTaskFromData` throws on `taskType='sequential'`. Cannot silently create broken rows again.
5. **`capability_tags` is required on the `StudioTemplate` type.** Forgetting tags on a future template is a compile error, not a silent data quality issue. Ensures Session 3 search has complete data.
6. **The standalone-sequential-task rendering path is removed.** Lines 1292-1300 of Tasks.tsx render sequential tasks that have no `sequential_collection_id`. After the fix, such tasks cannot be created via the UI. If any exist in production from the broken period, they remain as orphaned task rows — not touched by this build.
7. **STUB_REGISTRY.md line 368 is currently wrong.** "Sequential reuse/redeploy flow | ✅ Wired | Phase 10 Repair" is incorrect — SequentialCollectionView has zero callers. Will be corrected in the post-build updates.
8. **`is_system` vs `is_system_template`.** Live schema has both columns on `task_templates`. `Studio.tsx:67-72` filters by `is_system = false` — keep using that. No change this build.

---

# Build I: PRD-18 Rhythms & Reflections (Phase A — Foundation)

### PRD Files
- `prds/daily-life/PRD-18-Rhythms-Reflections.md` (full PRD — 1147 lines, read every word)

### Addenda Read
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-18-Enhancement-Addendum.md` (**8 enhancements — primary authoritative source alongside the base PRD**)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-18-Rhythms-Reflections.md`

### Build Plan
Four sub-phases A → B → C → D (full detail in the feature decision file). This CURRENT_BUILD section scopes **Phase A only**. Phases B/C/D repopulate this section on their own cycles after founder approval.

- **Phase A (this build):** Foundation — rhythm tables, Morning Rhythm, Evening Rhythm core (13-section fixed sequence, mood triage removed), dashboard section registry integration, breathing-glow cards, basic section renderers reusing existing hooks (Guiding Stars, Best Intentions, Task Preview, Calendar, Reflections via existing `useReflections`), per-role default seeding, Guided/Play handoff to DailyCelebration, Rhythms Settings page, `rhythm_capture` routing destination.
- **Phase B (next):** Periodic rhythms (Weekly/Monthly/Quarterly), Enhancement 1 (Evening Tomorrow Capture + Morning Priorities Recall), Enhancement 8 (On the Horizon with Task Breaker integration), Enhancement 5 (Carry Forward fallback behavior + midnight cron).
- **Phase C (after):** Enhancement 2 (MindSweep-Lite with Haiku dispositions, batched on Close My Day), Enhancement 3 (Morning Insight with BookShelf semantic pull), Enhancement 4 (Feature Discovery nudge engine), Enhancement 6 (tracker `rhythm_keys` configuration).
- **Phase D (final):** Enhancement 7 (Independent Teen tailored experience — 8 evening sections, 7 morning sections, teen framing, teen MindSweep-Lite dispositions, 15 teen insight questions, 1-2 reflection question count).

---

### Pre-Build Summary (Phase A)

#### Context

PRD-18 is the platform's activation engine — the daily rhythms that transform MyAIM from a collection of management tools into a living companion. The founder's family already has a nightly reflection habit from StewardShip (V1), and Reflections as a standalone page is already substantially built (migrations 100071/100072, `reflection_prompts` + `reflection_responses` tables, `useReflections` hook with 32 default lazy-seed + journal auto-creation, `ReflectionsPage` with 3 tabs). This build adds the **rhythm shell** around existing infrastructure — Morning and Evening modals that auto-open on first dashboard visit during their active hours, collapse to breathing-glow dashboard cards, and consume data from already-built features (Guiding Stars, Best Intentions, Tasks, Calendar, Reflections).

The Enhancement Addendum (2026-04-07) adds 8 enhancements that transform rhythms into the platform's onboarding engine: rotating conversational tomorrow capture with fuzzy task matching, MindSweep-Lite brain dumps with Haiku dispositions, BookShelf semantic morning insights, feature discovery nudges, carry-forward fallback behavior, tracker rhythm surfacing, On-the-Horizon 7-day lookahead, and a full tailored teen experience. Those are scoped to Phases B, C, and D — **Phase A builds only the foundation.**

Phase A is foundation, not cosmetic. Without it, none of the enhancements can render. The evening rhythm narrative arc (celebrate → plan → clear head → reflect → close) requires all 13 base sections in place even if some surface as stubs until Phase B adds the AI pieces. Guided/Play members do NOT get the adult evening rhythm — at evening rhythm time, they trigger `DailyCelebration` from PRD-11 (already built). The mood triage section is **removed** from the default evening sequence per founder decision in Enhancement 6 ("Moms will literally always be drained or tired. That's not a mood, that is the phase of life we are in."). The `mood_triage` column on `rhythm_completions` stays in schema for future use but is not populated by default.

#### Dependencies Already Built

**Reflections infrastructure (reuse wholesale — do not rebuild):**
- `reflection_prompts` table with `daily_life` category (migrations 00000000100071, 00000000100072)
- `reflection_responses` table with RLS — mom reads children's, dad's responses private via existing `rr_parent_reads_children` policy
- `useReflections.ts` hook — CRUD on prompts, save/update responses, auto-create journal entries with category tags, archive/restore, reorder, 32 default lazy-seed
- `ReflectionsPage.tsx` — 3 tabs (Today, Past, Manage) at `/reflections`
- `ReflectionsTodayTab`, `ReflectionsPastTab`, `ReflectionsManageTab`, `ReflectionQuestionCard` components
- `WriteDrawerReflections` (Guided shell) — mini reflection pattern already proven for embedding
- `reflections_basic` + `reflections_custom` feature keys already in registry
- **`journal_entries.tags TEXT[]`** already exists since migration 00000000000006 (line 17) — no column addition needed

**Dashboard section system (PRD-14 — fully operational data-driven renderer):**
- `src/components/dashboard/dashboardSections.ts` — `SECTION_KEYS` enum (`greeting`, `calendar`, `active_tasks`, `widget_grid`, `best_intentions`, `next_best_thing`, `celebrate`), `SECTION_META`, `DEFAULT_SECTIONS`, `getSections(dashboardConfig?.layout)` reads from `dashboard_configs.layout.sections` JSONB
- `DashboardSectionWrapper.tsx` — drag/collapse/visibility controls via `dnd-kit`
- `Dashboard.tsx` — `localSections` state, `updateSection()`, switch-on-section-key renderer
- Greeting section already built with Guiding Star rotation

**Data consumers already built:**
- `useGuidingStars(memberId)` — `src/hooks/useGuidingStars.ts:33` — returns active non-archived entries ordered by `entry_type + sort_order`
- `useBestIntentions(memberId)` — `src/hooks/useBestIntentions.ts:46` — returns active non-archived ordered by `is_active DESC + sort_order ASC`
- `CalendarWidget` — `src/components/calendar/CalendarWidget.tsx` — supports `personalMemberId` filter, week/month view with tasks + events
- `DashboardTasksSection` — `src/components/tasks/DashboardTasksSection.tsx` — renders active tasks list
- `NotepadDrawer` — `src/components/notepad/NotepadDrawer.tsx` — full Smart Notepad (will wrap with lighter embed shell for Brain Dump)

**Victory Recorder + activity log infrastructure:**
- `victories.source` enum ALREADY includes `'reflection_routed'` (migration 00000000100102, line 41) — no update needed
- `VictoryRecorder` page built (non-guided shells)
- `activity_log_entries` table exists (migration 00000000000009:406-423); trigger pattern established
- `DailyCelebration` component built (PRD-11 Phase 12C, 2026-04-02)

**Routing and navigation:**
- `RoutingStrip` — `src/components/shared/RoutingStrip.tsx:70-100` — destinations: calendar, tasks, list, journal, guiding_stars, best_intentions, victory, track, messages, ideas, template, hidden, lila, mindsweep, request. **No `rhythm_capture` yet — must add.**
- `Sidebar.tsx:34-141` — Capture & Reflect section already has "Journal", "Reflections", "Morning Rhythm", "Evening Review" entries pointing to `/rhythms/morning` and `/rhythms/evening` (currently placeholder pages at `src/pages/placeholder/index.tsx:38,42`)
- `App.tsx` — `/rhythms/morning` → `MorningRhythmPage` (placeholder), `/rhythms/evening` → `EveningReviewPage` (placeholder), `/reflections` → real `ReflectionsPage`, no `/rhythms/settings` route yet

**Enhancement dependencies (used in Phase B/C, not Phase A, but confirmed present):**
- `TaskBreaker` component + `task-breaker` Edge Function (for Enhancement 8 On the Horizon)
- `match_book_extractions()` RPC (migration 00000100092:56) — for Enhancement 3 Morning Insight
- `mindsweep-sort` Edge Function (migration 00000100093) — for Enhancement 2 MindSweep-Lite reuse or inspiration

#### Dependencies NOT Yet Built

- **PRD-05 (LiLa Core) day-data context assembly enhancement** — required for LiLa dynamic reflection prompts. Phase A ships without dynamic prompts.
- **PRD-05 (LiLa Core) `contextual_help` context injection** — required for tooltip "What's this?" rollout. Phase A does NOT ship tooltip enhancement.
- **PRD-03 (Design System) Tooltip component "What's this?" link support** — same deferral.
- **PRD-12A (Personal LifeLantern)** — Quarterly Inventory reads `life_lantern_areas` staleness. Stub in Phase B.
- **PRD-15 (Messages/Requests/Notifications)** — currently being built in Build G. Required for (a) teen rhythm request flow to `family_requests`, (b) MindSweep-Lite "delegate" disposition creating messages, (c) rhythm completion notifications. Phase A does not depend on PRD-15.
- **PRD-16 (Meetings)** — Weekly/Monthly Review deep-dive links + Completed Meetings section. Stub until wired.
- **Studio rhythm templates** — no `rhythm_templates` table yet. Stub until post-MVP content sprint.
- **Embedded Smart Notepad mini-component** — does NOT exist. Phase A creates a lightweight wrapper around `NotepadDrawer` for the Brain Dump rhythm section.

#### Build Items (Phase A — 15 items)

**1. Migration 00000000100103: `rhythms_foundation.sql`**
- `rhythm_configs` table — per-member configuration with `sections JSONB` (ordered array), `section_order_locked BOOLEAN` (true for evening), `timing JSONB`, `auto_open BOOLEAN`, `reflection_guideline_count INTEGER`, `source_template_id`, `archived_at`
- `rhythm_completions` table — per-period tracking with `period TEXT` (YYYY-MM-DD / YYYY-W## / YYYY-MM / YYYY-Q#), `status` ('pending','completed','dismissed','snoozed'), `mood_triage` nullable (preserved in schema but not populated), `metadata JSONB` (`priority_items`, `mindsweep_items`, `brain_dump_notepad_tab_id`), `snoozed_until`, `completed_at`, `dismissed_at`
- `feature_discovery_dismissals` table — per-member feature discovery dismissal tracking (used by Phase C but schema created in Phase A)
- `morning_insight_questions` table — empty in Phase A; Phase C seeds 20 adult + 15 teen questions
- RLS: members manage own; mom reads all family completions; mom configures all family rhythm configs
- Indexes: UNIQUE `(family_id, member_id, rhythm_key)` on configs, UNIQUE `(family_id, member_id, rhythm_key, period)` on completions, `(family_id, member_id, status)` on completions, `(family_id, member_id, enabled)` on configs
- `set_updated_at` trigger on `rhythm_configs`
- Activity log trigger on `rhythm_completions` INSERT (`event_type='rhythm_completed'`)
- Feature keys added: `rhythms_basic`, `rhythms_periodic`, `rhythms_custom`, `reflections_export`, `rhythm_dynamic_prompts`, `rhythm_morning_insight`, `rhythm_feature_discovery`, `rhythm_mindsweep_lite`, `rhythm_on_the_horizon`, `rhythm_tracker_prompts` (10 new keys; `reflections_basic` + `reflections_custom` already exist)
- Default `rhythm_configs` seeding trigger on `family_members` INSERT — per-role templates (mom/adult/teen/guided/play). Morning active, Evening active, Weekly Review active, Monthly off, Quarterly off. Teen template uses Enhancement 7 base structure (framing language seeded in Phase D)
- Backfill existing family members with default rhythm_configs via idempotent UPSERT

**2. TypeScript types (`src/types/rhythms.ts`)**
- `RhythmKey`, `RhythmType`, `RhythmStatus`, `SectionType`, `RhythmSection`, `RhythmConfig`, `RhythmCompletion`, `RhythmTiming`, per-role default template constants

**3. Hooks (`src/hooks/useRhythms.ts`)**
- `useRhythmConfigs(memberId)`, `useRhythmConfig(memberId, rhythmKey)`, `useRhythmCompletion(memberId, rhythmKey, period)`, `useTodaysRhythmCompletions(memberId)`, `useCompleteRhythm()`, `useSnoozeRhythm()`, `useDismissRhythm()`, `useUpdateRhythmConfig()`, `useActiveRhythmForTime(memberId)`

**4. Date-seeded PRNG utility (`src/lib/rhythm/dateSeedPrng.ts`)**
- Deterministic PRNG seeded by `(memberId, date, rhythm_key)`. Same inputs always produce same output — used for rotation in Guiding Star, Scripture/Quote, Reflections sections.

**5. Section renderer system (`src/components/rhythms/sections/`)**
- `SectionRendererSwitch.tsx` — switch on `section.section_type` → renders correct component
- Auto-hide logic when data empty (Guiding Star hides if no entries, Scripture hides if no entries, Completed Meetings hides if none, Milestone Celebrations hides if none, Before You Close the Day hides if nothing pending)

**6. Morning Rhythm section components**
- `GuidingStarRotationSection`, `BestIntentionsFocusSection`, `TaskPreviewSection` (wraps `DashboardTasksSection` read-only), `CalendarPreviewSection` (wraps `CalendarWidget` with `personalMemberId` day view), `BrainDumpSection` (embedded Smart Notepad, writes `notepad_tabs` with `source_type='rhythm_capture'`), `PeriodicCardsSlot` (renders nothing in Phase A)

**7. Evening Rhythm section components**
- `EveningGreetingSection`, `AccomplishmentsVictoriesSection` (reads `victories` + today's task completions, deduped), `CompletedMeetingsSection` (stub until PRD-16), `MilestoneCelebrationsSection`, `ClosingThoughtSection`, `FromYourLibrarySection`, `BeforeCloseTheDaySection`, `ReflectionsSection` (3 rotating questions via PRNG, existing `useSaveResponse` with `source_context='evening_rhythm'`, "See all questions →" link to `/reflections`), `CloseMyDayActionBar`
- Carry Forward section preserved as toggleable but OFF by default
- Mood triage NOT in default sequence (Enhancement 6 removal)
- MindSweep-Lite section component stubbed (Phase C builds the AI logic)
- Tomorrow Capture section stubbed (Phase B builds rotating prompts + fuzzy match)

**8. `MorningRhythmModal` + `MorningRhythmCard`**
- Auto-open once per day on first dashboard visit during morning hours (member's configured wake time → noon)
- Non-blocking modal, themed header, section cards, bottom action bar
- `[Start My Day]` → writes `rhythm_completions` with `status='completed'`
- `[Snooze ▾]` → dropdown (30 min / 1 hr / Dismiss for today) → `snoozed_until` or `dismissed`
- Breathing-glow card states: pending / completed / snoozed

**9. `EveningRhythmModal` + `EveningRhythmCard`**
- Same delivery pattern as morning — auto-open during evening hours
- **Fixed section sequence** — `section_order_locked=true`. Sections toggle on/off but NEVER reorder
- `[Close My Day]` commits completion + Phase B/C metadata when wired

**10. Dashboard integration**
- `dashboardSections.ts` — add `morning_rhythm` and `evening_rhythm` keys with `is_auto_managed=true`, `hideable=false`
- `Dashboard.tsx` — render rhythm cards at position 0 when their period is pending/in-progress
- Reuse existing `BreathingGlow` component from PRD-17
- Edit mode must NOT allow hiding rhythm sections

**11. `RhythmsSettingsPage` (`/rhythms/settings`)**
- New route in `App.tsx`, new sidebar entry in `Sidebar.tsx` (under Settings, not a new top-level nav)
- Member picker (mom only)
- Active Rhythms list + Available Rhythms list + Custom Rhythms list (custom creation flow stubbed with `PlannedExpansionCard` for Phase A)
- Per-rhythm settings drawer: enable/disable, timing, section toggles, section reordering (not for evening), `[Restore Defaults]`
- `[Browse Studio Templates →]` PlannedExpansionCard

**12. Sidebar + routing updates**
- Replace placeholder pages at `/rhythms/morning` and `/rhythms/evening` — routes still exist but redirect to `/dashboard` (the real experience is the auto-open modal + breathing-glow card)
- Add `/rhythms/settings` route → `RhythmsSettingsPage`
- Add "Rhythms" Settings entry in Sidebar

**13. `rhythm_capture` routing destination**
- Add to `RoutingStrip` destinations
- BrainDumpSection writes `notepad_tabs` with `source_type='rhythm_capture'` — routing from the notepad tab writes back to rhythm context

**14. Guided/Play evening handoff**
- At evening rhythm time, detect member role; if `play`, trigger `DailyCelebration` instead of EveningRhythmModal
- No rhythm card appears for Play in evening — DailyCelebration is the experience
- **(scope addition 2026-04-07)** Guided members DO get an evening rhythm — see item 16 below. Play stays unchanged.
- `rhythm_completions` records still written for completion tracking

**15. TypeScript check**
- `tsc -b` — zero errors before declaring Phase A complete

**16. Mini evening rhythm for Guided (mid-build scope addition, 2026-04-07)**
- Migration `00000000100104_guided_evening_rhythm.sql` — extends `auto_provision_member_resources()` to also seed an evening rhythm config for Guided members + backfills 3 existing active Guided members across the database (Mosiah in OurFamily, plus 2 Jordans in test families)
- Coexists with the existing CelebrateSection — Celebrate button still launches DailyCelebration overlay separately. The mini evening rhythm is a structured 3-section daily check-in modal; DailyCelebration is the sparkly celebration overlay.
- 3 new section types added to `RhythmSectionType` union: `guided_day_highlights`, `guided_pride_reflection`, `guided_tomorrow_lookahead`
- 3 new section components in `src/components/rhythms/sections/guided/`:
  - `GuidedDayHighlightsSection` — reads today's victories with kid framing ("Look at what you did today!"), warm empty state for quiet days
  - `GuidedPrideReflectionSection` — single hardcoded prompt "Is there anything you're proud of yourself for today?", textarea writes directly to `journal_entries` with `entry_type='reflection'`, `tags=['reflection','guided_evening','pride']`, `visibility='shared_parents'`
  - `GuidedTomorrowLookAheadSection` — single hardcoded prompt "What are you looking forward to tomorrow?", same architecture as Pride section, `tags=['reflection','guided_evening','tomorrow']`
- Reading Support flag (`readingSupport`) flows from `GuidedDashboard` → `RhythmDashboardCard` → `RhythmModal` → `SectionRendererSwitch` → each section component. Guided sections show a `Volume2` icon that reads the prompt aloud via `speechSynthesis` when reading support is enabled.
- `'evening_rhythm'` added to `GUIDED_SECTION_KEYS` in `src/types/guided-dashboard.ts` (slot before `celebrate`). `getGuidedSections()` auto-merges the new key into existing dashboard configs on next read — no `dashboard_configs` backfill needed.
- `GuidedDashboard.renderSection` adds a case for `evening_rhythm` that renders `<RhythmDashboardCard rhythmKey="evening" readingSupport={...} />`. The card renders without the collapsible wrapper (same pattern as `greeting` and `next_best_thing`).
- `GuidedManagementScreen.SECTION_LABELS` updated to include `evening_rhythm: 'Evening Check-in'` for the management UI
- **No new tables, no new feature keys.** Reuses the existing `rhythm_configs` / `rhythm_completions` infrastructure built in migration 100103.
- **Reflection responses do NOT use `reflection_prompts`/`reflection_responses` infrastructure.** Two reasons: (a) the lazy-seed in `useReflectionPrompts` only fires on `/reflections` page visit, which Guided kids don't visit; (b) the prompts are hardcoded so a `reflection_prompts` row would be redundant. Direct `journal_entries` writes use the existing journal RLS, which already lets mom see kids' reflections via View As.
- **Reuses existing `RhythmModal` and `RhythmDashboardCard`** rather than building Guided-specific variants. Same auto-open logic, snooze menu, completion flow. UI tightening for kid-friendly tone is deferred to a polish pass.
- Verification: Mosiah's evening rhythm config has 4 sections in correct order (highlights → pride → tomorrow → close), `section_order_locked=true`. Database total: 21 evening rhythms (was 18 adults + 3 new Guided). `tsc -b --force` clean.

**17. Position 0 fix + Guided reflections expansion (mid-build follow-up, 2026-04-07)**

Two issues surfaced after the initial Guided evening rhythm landed:

**(a) Position 0 bug.** The rhythm cards were rendering at the BOTTOM of the dashboard instead of at position 0 as PRD-18 + the Cross-PRD Impact Addendum specify. Root cause: the `getSections()` helper merges missing default keys at the END of the saved layout, not at their default position. For existing dashboard_configs whose layouts were saved before the rhythm keys were added, the rhythm sections got appended.

**Fix:** Removed `morning_rhythm` and `evening_rhythm` from the section registry entirely (`SECTION_KEYS`, `SECTION_META`, `DEFAULT_SECTIONS`). Same for Guided (`GUIDED_SECTION_KEYS`, `SECTION_LABELS`). The `RhythmDashboardCard` now renders DIRECTLY at position 0 in `Dashboard.tsx` and `GuidedDashboard.tsx`, OUTSIDE the data-driven section system. This is more robust than fixing the merge logic because:
  - The user's saved layout doesn't need to know about rhythm cards at all
  - Edit mode can never accidentally hide them
  - New rhythm types in the future don't require schema migration of dashboard_configs
  - Truly auto-managed semantics — never reorderable, never hideable
- The card itself still self-hides when outside its time window AND has no completion record, so the slot is invisible most of the day.
- Adult Dashboard renders both morning + evening cards above all sections. Guided/Play kids are excluded from the adult evening card because guided members render their own evening card inside `GuidedDashboard`.
- `sortableSectionIds` no longer needs to filter rhythm keys (they're not in `activeSections` anymore).

**(b) Guided reflections section + rotating wordings.** Tenise asked for: (i) rotating wordings on Pride and Tomorrow sections so the kid doesn't see the same exact prompt every night, and (ii) a NEW reflection section that pulls from the existing reflection_prompts library, picks one of 20 child-appropriate prompts via PRNG, with an inline "View All" expander to swap.

**Pride wordings (6 rotations):** "Is there anything you're proud of yourself for today?" / "What's something you did today that made you feel good about yourself?" / "What's a moment from today you want to remember?" / "Was there a time today when you tried hard at something?" / "What's something kind of awesome you did today?" / "Did anything happen today that you're glad about?"

**Tomorrow wordings (6 rotations):** "What are you looking forward to tomorrow?" / "What's one thing you're excited about for tomorrow?" / "Is there anything special about tomorrow?" / "What's something you want to try or do tomorrow?" / "What would make tomorrow a really good day?" / "What's on your mind for tomorrow?"

The active wording is picked deterministically via `pickOne(WORDINGS, rhythmSeed(memberId, 'evening:pride'/'evening:tomorrow', new Date()))` — same kid sees same wording all day, different tomorrow. The selected wording is saved INTO the journal entry content so the historical record shows which version was answered. Tags stay constant.

**New `GuidedReflectionsSection`:**
- Reads from existing `reflection_prompts` library via `useReflectionPrompts` (lazy-seeds 32 default prompts on first call, same as `WriteDrawerReflections`)
- Filters to 20 hardcoded child-friendly sort_orders: `[1, 2, 3, 4, 5, 8, 9, 12, 13, 20, 21, 22, 24, 25, 26, 28, 29, 30, 31, 32]` — picked from the original 32 by excluding adult/abstract/judgmental ones (full rationale in the component file)
- Date-seeded PRNG picks ONE active prompt for the day (key `'evening:guided_reflections'`)
- "View All questions" inline expander shows all 20 as tappable buttons; tapping one swaps the active prompt and collapses the list. Override is session-only — next day a new prompt rotates in via PRNG.
- Save uses the existing `useSaveResponse` mutation, which writes BOTH a `reflection_responses` row AND a `journal_entries` row with category-derived tags. Mom finds these in /reflections Past tab via View As AND in the kid's journal under the relevant category tag.
- Reading Support: Volume2 icon reads the active prompt aloud
- Already-answered prompts in the View All list show a "✓" prefix
- **Architecture mirrors the planned teen evening reflection** (Enhancement Addendum decision 30: "1-2 reflection questions per evening, pulled from teen-appropriate prompts filtered from the existing pool"). Guided gets 1 question by default with the View All escape hatch.
- Mom-controlled curation via `preferences.reflection_prompts` is NOT wired in this build — the 20 sort_orders are platform-curated. Phase B can wire the preference if needed.

**New section sequence (5 sections, was 4):**
1. `guided_day_highlights` — today's victories with kid framing
2. `guided_pride_reflection` — rotating wording, direct journal_entries write
3. `guided_reflections` — NEW, library-backed, PRNG pick, View All
4. `guided_tomorrow_lookahead` — rotating wording, direct journal_entries write
5. `close_my_day` — completion action

**Migration filename collision:** I initially named the migration `00000000100105_guided_evening_reflections.sql` but discovered there was already an `00000000100105_linked_steps_mastery_advancement.sql` from the parallel PRD-09A/09B "Build J" Linked Steps session. The Linked Steps SQL was already applied AND recorded in `supabase_migrations.schema_migrations` (verified directly), but having two files at the same version number confused `db push --dry-run`. **Renamed to `00000000100106_guided_evening_reflections.sql`** to resolve the collision. Did NOT touch the Linked Steps migration — outside this build's scope.

**Migration 00000000100106:** Replaces `auto_provision_member_resources()` to seed the new 5-section evening rhythm for new Guided members. Backfills existing 3 active Guided members across the database via idempotent UPDATE that only fires when `sections @> '[{"section_type":"guided_reflections"}]'::jsonb` is FALSE.

**TaskCard.tsx note:** During clean-rebuild verification, `tsc -b --force` initially showed errors in `src/components/tasks/TaskCard.tsx`. Investigation showed these are uncommitted changes from the parallel Linked Steps "Build J" (references `onSubmitMastery`, `GraduationCap`, `ExternalLink` — Linked Steps mastery features). Errors are NOT in any file I touched. After clearing `.tsbuildinfo` cache files, `tsc --noEmit` and `tsc -b` both exit 0 cleanly. **Surface this to the Linked Steps build owner: TaskCard.tsx has uncommitted unresolved references that may fail Vercel deploy in strict mode if not resolved before commit.**

**Verification:** Backfill confirmed via `npx supabase db query --linked` — all 3 existing Guided members have evening rhythm with 5 sections in correct order (highlights → pride → reflections → tomorrow → close). `npx tsc --noEmit` clean (zero errors). `npx tsc -b` clean after clearing tsbuildinfo cache.

#### Stubs (NOT Building Phase A)

**All 8 Enhancement Addendum enhancements deferred to later phases:**
- **Enhancement 1** (Evening Tomorrow Capture + Morning Priorities Recall + `rhythm_priority` task source) — Phase B
- **Enhancement 2** (MindSweep-Lite + Haiku dispositions + batched Close My Day commit) — Phase C
- **Enhancement 3** (Morning Insight with BookShelf semantic pull + 20 question pool) — Phase C
- **Enhancement 4** (Feature Discovery with 2-3x/week gate + dismiss + engagement tracking) — Phase C
- **Enhancement 5** (Carry Forward fallback behavior + midnight cron + backlog prompt) — Phase B
- **Enhancement 6** (Tracker `rhythm_keys` multi-select in widget settings) — Phase C
- **Enhancement 7** (Independent Teen tailored experience) — Phase D
- **Enhancement 8** (On the Horizon 7-day lookahead + Task Breaker integration) — Phase B

**Other deferrals:**
- Weekly Review / Monthly Review / Quarterly Inventory inline cards — Phase B
- Studio rhythm template library (7-10 templates) — post-MVP content sprint, no `rhythm_templates` table yet
- Teen rhythm request flow through Universal Queue Modal — depends on PRD-15
- LiLa dynamic reflection prompts — depends on PRD-05 day-data context enhancement
- Tooltip + "What's this?" → LiLa contextual help rollout — depends on PRD-03 + PRD-05 enhancements
- LifeLantern Check-in staleness — depends on PRD-12A
- Completed Meetings section — depends on PRD-16
- Weekly / Monthly Review deep-dive links — depends on PRD-16 meeting types
- Rhythm completion indicators on Family Overview — wire post-build (PRD-14C already built, just needs query)
- Reflection export as formatted document — post-MVP
- Premium reflection prompt packs — post-MVP
- Push notifications for rhythm reminders — post-MVP
- Voice-to-text for reflection answers — post-MVP
- Renewal Dimension Rotation section type — post-MVP, belongs in Sabbath studio template
- Reflection sharing on Family Hub — post-MVP
- Rhythm analytics — post-MVP

#### Key Decisions

1. **Phase A is foundation only.** None of the 8 enhancements ship in Phase A. The evening rhythm sequence is complete at 13 sections, but MindSweep-Lite / Tomorrow Capture render as stubs in Phase A and fill in during Phase B/C. This preserves the narrative arc without blocking on AI infrastructure.
2. **Reflections infrastructure is reused wholesale.** `reflection_prompts`, `reflection_responses`, `useReflections`, `ReflectionsPage`, 32 default prompts, journal entry auto-creation with tags — all already built. Phase A's `ReflectionsSection` is a thin wrapper pulling 3 rotating questions via PRNG and saving via the existing hook.
3. **`journal_entries.tags TEXT[]` already exists** (migration 100006) — the PRD-18 Cross-PRD Impact Addendum schema change is already applied.
4. **`victories.source` already includes `'reflection_routed'`** (migration 100102) — no enum update needed.
5. **Mood triage removed from default evening sequence** per Enhancement Addendum founder decision. Column preserved in schema.
6. **Guided/Play evening handoff to DailyCelebration** — already built. Phase A enforces the time-trigger handoff.
7. **Auto-open modal triggers once per period.** After dismissal, only the breathing-glow dashboard card is shown until the next period.
8. **Rhythm cards are `is_auto_managed=true`** — inserted at position 0 in Dashboard section list. Edit mode cannot hide them.
9. **Date-seeded PRNG for rotation.** Same prompts/stars on same day if user re-opens the rhythm. Non-negotiable for user trust.
10. **Sidebar nav entries already exist** — placeholder pages get replaced, nav doesn't gain morning/evening entries. Rhythms Settings is the only new nav entry.
11. **RLS inherits existing patterns** — members manage own, mom reads all children (dad's reflections remain private via existing `rr_parent_reads_children` policy).
12. **Zero blockers on PRD-15.** Phase A does not require messaging infrastructure.
13. **Embedded Smart Notepad is a thin wrapper around NotepadDrawer.** Phase A does not build a separate mini-Notepad component.
14. **The `mood_triage` column stays in schema.** Future-proofs against reactivation without requiring a new migration.
15. **Default rhythm configs seed on member insert via trigger**, with backfill for existing members via idempotent UPSERT in the migration itself.

---

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

*Bug fixes (View As modal, Hub navigation, Notepad close) completed 2026-03-25. No new stubs.*

*PRD-21A (AI Vault Browse & Content Delivery) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. 88 requirements: 74 wired, 14 stubbed, 0 missing. 12 new tables, 3 content items loaded, sidebar simplified to Lucide icons.*

*PRD-21 (Communication & Relationship Tools) completed 2026-03-26. Verification archived to `claude/feature-decisions/PRD-21-Communication-Relationship-Tools.md`. 42 requirements: 32 wired, 10 stubbed, 0 missing. 8 Edge Functions deployed, 4 new tables, AI Toolbox sidebar + QuickTasks buttons, 198 condensed intelligence items powering system prompts.*

*PRD-34 (ThoughtSift — Decision & Thinking Tools) completed 2026-03-26. 3 sub-phases: 34A (Foundation + Translator + Decision Guide), 34B (Perspective Shifter + Mediator), 34C (Board of Directors). 6 tables, 5 Edge Functions, 18 personas + 17 lenses + 15 frameworks seeded, 5 vault items. Total: 129 wired, 22 stubbed, 0 missing across all sub-phases.*

*UX Overhaul Sessions 1-5 completed 2026-03-28. Density system, ModalV2, hardcoded color audit, QuickCreate FAB, calendar visual overhaul, DateDetailModal, calendar settings, tooltip conversion, list task type, tracker quick-create, element size preference.*

*PRD-14 (Personal Dashboard Reconciliation) completed 2026-03-30. Verification archived to `claude/feature-decisions/PRD-14-Personal-Dashboard.md`. 42 requirements: 37 wired, 5 stubbed, 0 missing. Data-driven section system, Guiding Stars greeting rotation, starter widget auto-deploy, perspective switcher expansion (all roles), View As full shell modal with theme persistence, acted_by attribution on 3 tables, permission-gated member picker, feature exclusion enforcement. BookShelf + ThemeSelector added to Independent/Adult shells.*

*PRD-14C (Family Overview) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-14C-Family-Overview.md`. 20 wired, 8 stubbed (4 planned + 4 UX polish deferred), 0 missing. Per-member config, member pill selector, pending items bar, horizontally-scrollable member columns with 7 section types, dad's scoped view.*

*PRD-23 (BookShelf Sessions A+B) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-23-BookShelf.md`. 44 wired, 0 stubbed, 0 missing. Session A: Library page, tag filter bar, 7 sort options, grid/compact layout, collection CRUD, multi-select, continue banner. Session B: 5-layer extraction browser, ExtractionBrowser with single/multi/collection/hearted modes, 5 specialized item components, ApplyThisSheet (8 destinations), SemanticSearchPanel, ChapterJumpOverlay, 2 Edge Functions (bookshelf-search, bookshelf-key-points), JournalPromptsPage, migration 100066 (vector search RPCs). 42 new files total.*

*PRD-23 (BookShelf Polish) completed 2026-04-01. Wired Search Library button, added History button to library, added action buttons to collection/multi-book view, removed Refresh Key Points (redundant). Fixed bookshelf-discuss: added missing discussion_type column, fixed model ID, fixed extraction query column name (user_id → family_member_id), added source honesty guardrail. Built `_shared/context-assembler.ts` — three-layer relevance-filtered context assembly module (first consumer: bookshelf-discuss). Added Layered-Context-Assembly-Spec.md for future Edge Function migrations. 5 Playwright tests with real API calls passing.*

*PRD-11 (Victory Recorder Phases 12A+12B+12C) completed 2026-04-02. Verification archived to `claude/feature-decisions/PRD-11-Victory-Recorder.md`. Phase 12A: core recording, browsing, celebration for adults/teens — VictoryRecorder page, RecordVictory modal, CelebrationModal, CelebrationArchive, celebrate-victory Edge Function, useVictories hook, activity log trigger. Phase 12B: intelligence layer — scan-activity-victories Edge Function, Victory Suggestions UI, CompletionNotePrompt, 4 activity log sources, Notepad victory routing, LiLa action chip, useVictoryReckoningContext hook. Phase 12C: DailyCelebration 5-step overlay for Guided/Play, SimplifiedRecordVictory for kids, ConfettiBurst + AnimatedList components, 15 voice personalities, VoiceSelector, useVoicePreference hook, celebrate-victory voice param + roleToMemberType bug fix, CelebrateSection + PlayShell Celebrate button wired. PRD-11B (Family Celebration) NOT built — separate future phase.*

*PRD-14D (Family Hub Phase A) completed 2026-04-03. 4 tables (family_hub_configs, family_best_intentions, family_intention_iterations, countdowns) + calendar_events.show_on_hub column. Hub Mode kiosk lock with PIN (hash_hub_pin + verify_hub_pin RPCs). Member Quick Access: PIN auth modal triggers ViewAs with privacy exclusions (Safe Harbor auto-excluded per PRD-20, private journals filtered). Hub Settings: full CRUD for intentions, countdowns, section order, Hub PIN. 2 personal dashboard widgets (info_family_intention, info_countdown) registered in widget catalog. ViewAs routing: 17 missing page routes added. Pre-existing TS errors fixed (QuickTasks, CalendarTab, Tasks). Remaining stubs: Slideshow (Phase B), TV Mode (PRD-14E), Family Vision section (PRD-12B), Special Adult shift-scoped access (PRD-27).*

*PRD-17 (Universal Queue & Routing — Gap-Fill) completed 2026-04-03. Verification archived to `claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`. 30 wired, 7 stubbed, 0 missing. Gap-fill: QuickTasks opens modal, CalendarTab with Approve/Edit/Reject, ListPickerModal for list items, QueueBadge on Dashboard+Tasks+Calendar, calendar status bug fixed, Quick Mode schedule passthrough, shared task visibility, RoutingToastProvider on Adult/Independent shells. 24 Playwright E2E tests (Dad flows, teen access, honey-do pipeline).*

*PRD-17B MindSweep Sprint 1+2 completed 2026-04-03. Phase A (data layer, migration 100089, mindsweep-sort Edge Function, 5 tables, classify_by_embedding RPC, useMindSweep hooks, QueueCard confidence badges, RoutingStrip tile) + Phase B partial (MindSweepCapture page at /sweep with text/voice/scan/link/holding queue/settings, mindsweep-scan Edge Function for vision OCR + link summarization, useVoiceInput <30s Web Speech optimization, useRunSweep shared hook, UndoToast optional onUndo). /simplify review applied: stale closure fix, triplicated reset extraction, shared sweep runner, cache invalidation mutations, auto-reset timer, concurrent inserts, type cleanup. 11 Playwright E2E tests passing. Phase B remaining: auto-sweep pg_cron, share-to-app, PWA manifest, IndexedDB offline. Phase C not started.*

*PRD-09A/09B Studio Intelligence Phase 1 (Build H) completed 2026-04-06. Verification archived to `claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`. 27 wired, 0 stubbed, 0 missing. Fixed a critical silent bug: sequential collection creation was broken everywhere (dead code in SequentialCreator/SequentialCollectionView with zero callers; sequential_collections table had 0 rows in production). Revived dead code via new SequentialCreatorModal wrapper, wired it from Studio + Tasks → Sequential tab + Lists page [+ New List] picker, added two-layer guards (createTaskFromData throws, TaskCreationModal skips initialTaskType='sequential'), removed the broken inline SequentialTab sub-component. Cross-surface visibility: sequential collections now appear on the Lists page alongside regular lists (with Sequential badge + progress) AND on the Tasks → Sequential tab (dual access). One-line randomizer fix: added 'randomizer' to Lists.tsx type picker grid. Data foundation: capability_tags required field on StudioTemplate type, populated on all 27 seed templates + widget starter config adapter. Zero database migrations. Deliberate PRD divergence from PRD-09A line 469 documented. 4 Playwright E2E tests passing (sequential creation DB verification, Lists page visibility, Tasks tab visibility, randomizer creation). Session 2 (Linked Steps addendum — advancement modes, practice_log, curriculum-parse Edge Function, Reading List template) and Session 3 (Studio Phase 2 — intent-based search, use case categories, My Library) are the follow-ons.*

---
