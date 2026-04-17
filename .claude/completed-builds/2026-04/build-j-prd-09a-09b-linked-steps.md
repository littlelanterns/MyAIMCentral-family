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

