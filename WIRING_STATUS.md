# Wiring Status — End-to-End Routing

> Tracks which RoutingStrip destinations actually work vs stub.
> Updated each build session. Last updated: 2026-05-01 (Universal Capability Parity — Stage 3).

## RoutingStrip Destinations

| Destination | Routes From | Creates Record In | Status | Notes |
|---|---|---|---|---|
| Calendar | Notepad, MindSweep, .ics import | `studio_queue` → `calendar_events` | **Wired** | Queue → CalendarTab approve/edit/skip + .ics file upload on /sweep |
| Tasks | Notepad, Review & Route | `studio_queue` (destination='task') | **Wired** | Queue → TaskCreationModal works |
| List | Notepad, Review & Route | Shows list picker | **Wired** | ListPickerModal in SortTab |
| Journal | Notepad, Review & Route | `journal_entries` | **Wired** | Routes to journal |
| Guiding Stars | Notepad, Review & Route, MindSweep | `guiding_stars` | **Wired** | PRD-06 built |
| Best Intentions | Notepad, Meeting, MindSweep | `best_intentions` | **Wired** | PRD-06 built |
| Victory | Notepad, Review & Route, MindSweep | `victories` | **Wired** | PRD-11 built |
| Track | Notepad | Widget data point | Stub | PRD-10 widget data routing not built |
| Message | Notepad | Opens composer | Stub | PRD-15 not built |
| Agenda | Notepad | Meeting agenda item | Stub | PRD-16 not built |
| InnerWorkings | Notepad, MindSweep | `self_knowledge` | **Wired** | PRD-07 built |
| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |
| Ideas | Notepad, Review & Route | `lists` (type='ideas') | **Wired** | Creates list item in Ideas list |
| Backburner | Notepad, Review & Route, Meeting, MindSweep | `lists` (type='backburner') | **Wired** | Creates list item in Backburner |
| Note | Notepad | `journal_entries` (free_write) | **Wired** | Quick note |
| MindSweep | Notepad, /sweep | `studio_queue` + direct inserts | **Wired** | PRD-17B: embedding-first + Haiku classification |
| Acknowledge | Request accept | Notification only | Stub | PRD-15 not built |
| Skip | Meeting action | No record | **Wired** | Just dismisses |

## Studio → Feature Wiring

| Studio Action | Target | Status | Notes |
|---|---|---|---|
| [Customize] Task types (task/routine/opportunity) | TaskCreationModal | **Wired** | Opens modal pre-configured for type |
| [Customize] Sequential Collection | SequentialCreatorModal | **Wired** | PRD-09A/09B Studio Intelligence Phase 1 — previously silently broken (opened TaskCreationModal which created malformed rows). Now routes through `useCreateSequentialCollection`. |
| [Customize] List types | Navigate /lists?create=type | **Wired** | URL param auto-opens create modal |
| [Customize] Randomizer | Navigate /lists?create=randomizer | **Wired** | Studio URL path; also accessible directly via Lists page [+ New List] picker as of Phase 1 |
| [Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow |
| [Customize] Trackers/Widgets | WidgetPicker + WidgetConfiguration | **Wired** | PRD-10 Phase A |
| My Customized: Deploy | TaskCreationModal | **Wired** | Opens modal from template |
| My Customized: Edit | TaskCreationModal | **Wired** | Opens modal for editing |
| My Customized: Duplicate | RoutineDuplicateChooserDialog → RoutineDuplicateTemplateDialog \| RoutineDuplicateDialog | **Wired** | Worker ROUTINE-PROPAGATION (2026-04-25, c4): single duplicate entry point per Convention #255. Chooser asks "What would you like to do?" → "Copy and Customize" (independent template, lands in My Customized) or "Assign Additional Member" (existing deploy flow). Non-routines keep shallow-copy path. |
| My Customized: Archive | Supabase soft delete | **Wired** | Sets archived_at |

## Routine Deployment & Propagation (Worker ROUTINE-PROPAGATION, 2026-04-25)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| "Schedule to start later" toggle | Toggle in TaskCreationModal routine SectionCard, off by default; on reveals date picker | **Wired** | c2. Persists to `recurrence_details.dtstart` JSONB. Toggle-off silently writes `familyToday` (Convention #257 compliant via `fetchFamilyToday`). |
| Advance-start gating on dashboard | `recurringTaskFilter` hides routines whose `recurrence_details.dtstart` is in the future | **Wired** | c1. Both RRULE and per-section-frequency code paths covered. |
| Master-template edit confirmation | When mom edits a master with 1+ active deployments, modal names every affected family member ("This will update 3 active routines: Ruthie, Mosiah, and Gideon.") | **Wired** | c3. `MasterTemplateEditConfirmationModal`. Pre-check fires from both `handleSave` and `handleSaveToStudio`. 0-deployment path silent (toast only). |
| Overlap detection — backstop | Postgres trigger `prevent_overlapping_routine_assignments` raises `exclusion_violation` on overlap | **Wired** | c2.5. Migration 100176. Replaces strict unique index `tasks_unique_active_routine_per_assignee` from migration 100152. |
| Overlap detection — application warm path | `detectRoutineOverlap` pre-checks before insert; `RoutineOverlapResolutionModal` surfaces when found | **Wired** | c2.5. Three options: Replace / Keep both, adjust dates / Cancel. "Open existing routine" deep link. |
| Date-range overlap rule | `(existing.dtstart <= new.end_date) AND (existing.end_date >= new.dtstart)` with NULL end_date = +infinity | **Wired** | c2.5. Pure predicate `dateRangesOverlap` exported separately for cross-feature reuse. |
| Sequential non-overlapping deployments | Same template, same assignee, non-overlapping date ranges allowed | **Wired** | c2.5 founder D5 rescope. Summer routine + fall routine for same kid both legitimate. |
| "Scheduled to start" badge on Studio | `ScheduledStartBadge` size=full next to type pill on My Customized cards when ANY active deployment has future dtstart | **Wired** | c5. `useCustomizedTemplates` query computes earliest future dtstart per template. |
| "Scheduled to start" badge on Tasks page | `ScheduledStartBadge` size=compact below task title in TaskCard for routines with future dtstart | **Wired** | c5. Theme tokens only. |
| Post-save toasts | RoutingToastProvider success toast on every routine-template save path | **Wired** | c6. Five distinct variants. Anti-panic UX. |
| Master-template propagation contract | `task_template_sections` and `task_template_steps` propagate live via `template_id` join. Task-level fields snapshot. Past `routine_step_completions` survive structural edits. | **Wired** | c8. Convention #259 added to CLAUDE.md. |
| Shared `cloneRoutineTemplate` utility | `src/lib/templates/cloneRoutineTemplate.ts` — pure deep-clone, no task row insert. Reused by `RoutineDuplicateDialog` (clone-and-deploy) and `RoutineDuplicateTemplateDialog` (clone-only). | **Wired** | c4. Founder D6 Thread 1 — utilities live under `src/lib/templates/` for cross-feature reuse by future Workers 2/3/4. |
| Shared template UI under `src/components/templates/` | ScheduledStartBadge, MasterTemplateEditConfirmationModal, RoutineOverlapResolutionModal, RoutineDuplicateChooserDialog, RoutineDuplicateTemplateDialog | **Wired** | c2.5/c3/c4/c5. Cross-feature reuse-ready. |
| Lists template deploy | `useCreateList` hydrates `default_items` into `list_items` at deploy time (snapshot). `template_id` written. `ListDuplicateDialog` for copy-and-rename. | **Wired** | Worker 4 (2026-05-01). D-L1 snapshot, no propagation. |
| Shared routines (is_shared=true) completion UX | Anyone-can-complete + completer-color rendering + allowance credit to actual completer | Stub | Deferred to Worker 2 SHARED-ROUTINES per founder D6 Thread 3. Handoff: `claude/feature-decisions/Shared-Assignment-Model-Worker-Handoff.md`. Worker 1 audited is_shared=true rows pass advance-start + overlap detection cleanly. |

## Routine Save Reliability (Worker ROUTINE-SAVE-FIX, 2026-04-26)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| `routine_step_completions.step_id` ON DELETE SET NULL | Migration 100177 brings the FK into compliance with Convention #259. Step deletion no longer fails when completions reference it; orphaned completions retain `step_id=NULL`. | **Wired** | c1. All consumer call sites (`TaskCard`, `RoutineStepChecklist`, `GuidedActiveTasksSection`) filter NULLs out of their `Set<string>` so orphans never produce false-positive checkmarks on live steps. `RoutineStepCompletion.step_id` widened to `string \| null`. |
| Save-handler error toast | `TaskCreationModal.handleSave`, `handleSaveToStudio`, and `handleEditConfirm` all wrap `onSave` in try/catch. On reject: `console.error('Routine save failed:', err)` + error-variant toast ("Couldn't save changes. Please try again or contact support.") + modal stays open. | **Wired** | c2. Replaces silent try/finally that swallowed every save throw. |
| `UndoToast` error variant | `variant: 'success' \| 'error'` on `UndoToast` and `RoutingToastProvider`. Error variant uses error-token border, AlertTriangle icon, role='alert' / aria-live='assertive', 10s default dwell (vs 5s for success). | **Wired** | c2. All existing call sites preserved by default `variant='success'`. |
| `update_routine_template_atomic` RPC | Migration 100178 adds a SECURITY DEFINER function that performs the entire routine-template rewrite (UPDATE template + DELETE old sections/steps + INSERT new sections/steps) inside a single transaction. RLS check inside enforces caller's family ownership. Returns `{section_count, step_count}` jsonb. | **Wired** | c3. Eliminates partial-commit risk that motivated the silent-save bug. |
| Single rewrite path across call sites | `createTaskFromData.ts` editingTemplateId branch and `Tasks.tsx:handleEditTask` both call the RPC. Frequency-rule normalization (mwf, t_th, custom day sort/dedupe) lives in `src/lib/templates/serializeRoutineSectionsForRpc.ts` so the SQL stays simple and the mapping is unit-testable. | **Wired** | c3. Replaces two divergent inline rewrite chains that diverged on error handling (one threw, one swallowed). |
| Routine edit error surfacing | `Tasks.tsx:handleEditTask` now throws on UPDATE-tasks failure (was `console.error + return`) and on RPC failure. The c2 catch block in `TaskCreationModal` surfaces both via the error toast. | **Wired** | c3. Mom always sees what happened — no more silent saves. |

## Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)

| Capability | Entry Point | Status | Notes |
|---|---|---|---|
| Create from Studio | Studio → Sequential Collection [Customize] → SequentialCreatorModal | **Wired** | Phase 1 (2026-04-06). Before Phase 1 this opened TaskCreationModal and silently wrote a broken single-row task. |
| Create from Tasks → Sequential tab | Tasks → Sequential tab → [+ Create] → SequentialCreatorModal | **Wired** | Same modal as Studio. |
| Create from Lists page | Lists → [+ New List] → "Sequential Collection" tile → SequentialCreatorModal | **Wired** | Phase 1 cross-surface visibility — new entry point. |
| DB writes | `sequential_collections` row + N `tasks` rows with `task_type='sequential'`, `sequential_collection_id`, `sequential_position`, first `active_count` flagged `sequential_is_active=true` | **Wired** | Via `useCreateSequentialCollection` mutation. E2E verified in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. |
| Visible on Tasks → Sequential tab | `<SequentialCollectionView>` renders expandable cards with progress, restart-for-another-student, archive | **Wired** | Revived from dead code in Phase 1. |
| Visible on Lists page | Inline tile in grid / list view with "Sequential" badge + `current_index/total_items` subtitle | **Wired** | Phase 1 dual access. Only shown on `filter='all'`. |
| Sequential detail view from Lists page | Back-button wrapper rendering `<SequentialCollectionCard>` | **Wired** | Phase 1 — uses exported `SequentialCollectionCard`. Card has its own expand/collapse. |
| `createTaskFromData` guard | Throws `Error` on `taskType='sequential'` | **Wired** | Prevents silent re-introduction of the broken path. |
| `TaskCreationModal` guard | Skips `initialTaskType='sequential'` with `console.warn` | **Wired** | Defensive layer above the guard. |
| Advancement modes (practice_count / mastery) | — | **Wired** | Build J (2026-04-06) |
| Linked routine steps — editor + persistence | — | **Wired** | Build J (2026-04-06) |
| Linked routine steps — dashboard rendering | RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources | **Wired** | GuidedActiveTasksSection + TaskCard. 2026-04-13. |
| `curriculum-parse` Edge Function | — | **Wired** | Build J (2026-04-06) |

## Studio Capability Tags (PRD-09A/09B Studio Intelligence Phase 1)

| Item | Status | Notes |
|---|---|---|
| `capability_tags: string[]` required on `StudioTemplate` type | **Wired** | Compile-time error if a future template forgets tags. |
| Tags populated on all 27 seed templates | **Wired** | Blank formats + examples across task, guided form, list, and randomizer categories. |
| Widget starter configs carry baseline tags | **Wired** | Adapter in Studio.tsx adds `['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`. Phase 2 will replace with per-tracker-type tags. |
| Studio search bar rendering tags | — | Stub (Session 3 / Phase 2) |
| Use case category browse | — | Stub (Session 3 / Phase 2) |
| "Best for:" tagline + tag pills on cards | — | Stub (Session 3 / Phase 2) |
| "My Library" unified tab | — | Stub (Session 3 / Phase 2) |

## System Lists (auto-created per member)

| List | Type | Auto-Created | Routes From | Status |
|---|---|---|---|---|
| Backburner | `backburner` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
| Ideas | `ideas` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |

## User-Created List Types

| Type | Create UI | Detail View | Type-Specific Fields | Status |
|---|---|---|---|---|
| Shopping | **Working** | **Working** | quantity, unit, sections | **Working** |
| Wishlist | **Working** | **Working** | URL, price, total | **Working** |
| Expenses | **Working** | **Working** | amount, category, total | **Working** |
| Packing | **Working** | **Working** | sections, progress | **Working** |
| To-Do | **Working** | **Working** | priority, promote to task | **Working** |
| Prayer | **Working** | **Working** | basic items | **Working** |
| Ideas | **Working** | **Working** | basic items | **Working** |
| Backburner | **Working** | **Working** | basic items | **Working** |
| Custom | **Working** | **Working** | flexible | **Working** |
| Randomizer | **Working** | **Working** | draw spinner, category filter | **Working** |

## Seed Data in DB

| Table | System Records | Example Records | Verified |
|---|---|---|---|
| task_templates | 8 blank formats | 7 pre-filled examples | Yes (API test) |
| task_template_sections | — | Morning Routine (3), Bedroom (3) | Yes (migration success) |
| task_template_steps | — | ~22 steps across routines | Yes (migration success) |
| list_templates | 7 blank formats | 4 pre-filled examples | Yes (API test) |
| guided_form_responses | Table exists | — | Yes (API test) |

## RLS Verification

| Table | Anon Read | Auth Read | Auth Write | Verified |
|---|---|---|---|---|
| task_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| list_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| lists | — | Owner + parent | Owner + parent | Yes (wishlist create test) |
| guided_form_responses | — | Family-scoped | Own records | Yes (empty query succeeds) |

## Quick Create Actions (Global "+" Button)

| Action | Opens | Status | Notes |
|---|---|---|---|
| Add Task | Navigate `/tasks?new=1` | **Wired** | TaskCreationModal in Quick Mode |
| Quick Note | Notepad drawer (mom) or `/notepad` | **Wired** | Via NotepadBridge context |
| Log Victory | Navigate `/victories?new=1` | **Wired** | Victory recording page |
| Calendar Event | Navigate `/calendar?new=1` | **Wired** | EventCreationModal on CalendarPage + CalendarWidget |
| Send Request | Opens Notepad (fallback) | Stub | PRD-15 request modal not built |
| Mind Sweep | Navigate `/sweep` | **Wired** | MindSweep capture: text, voice, scan, link, calendar import |

## Calendar Import (Phase 0)

| Path | How It Works | Status |
|---|---|---|
| Upload .ics file | Calendar button on /sweep → parse → studio_queue → CalendarTab approve | **Wired** |
| Screenshot event | Scan button → OCR → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Paste event link | Link button → fetch + summarize → MindSweep classifies → CalendarTab | **Wired** |
| Type event details | Text → Sweep Now → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Forward email (.ics) | Email forwarding → mindsweep-email-intake | Stub (DNS not configured) |
| Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP) |

## Task Breaker AI (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Text Mode — Quick | TaskCreationModal → TaskBreaker → `task-breaker` Edge Function (Haiku) → 3-5 subtasks | **Wired** | Family context + active task counts passed |
| Text Mode — Detailed | Same flow → 5-10 subtasks with descriptions | **Wired** | |
| Text Mode — Granular | Same flow → 10-20 micro-steps | **Wired** | |
| Subtask creation | Accepted subtasks → child `tasks` rows via `parent_task_id` | **Wired** | Created in `createTaskFromData` |
| Image Mode | Camera/upload → Sonnet vision → action steps as subtasks | **Wired** | Camera capture + file upload in TaskBreaker.tsx, multimodal message to task-breaker Edge Function (Sonnet when image, Haiku for text-only). 2026-04-13. |
| Standalone Modal | StandaloneTaskBreakerModal — type task name + description, break down, save parent+children | **Wired** | QuickTasks strip (Zap icon pill), also openable from AI Vault. 2026-04-13. |
| AI Vault Entry | Single "Task Breaker" vault item covering text + image modes | **Wired** | Migration 100132. No tier assignment (deferred post-beta). 2026-04-13. |
| QuickTasks Strip | Zap icon pill → opens StandaloneTaskBreakerModal | **Wired** | Between Tasks and MindSweep in action order. 2026-04-13. |

## Task Rotation Advancement (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Rotation config persistence | `createTaskFromData` writes `recurrence_details.rotation` JSONB + `task_assignments` with `rotation_position` + `is_active` when `rotationEnabled=true` | **Wired** | 2026-04-13. Members array, current_index, frequency, last_rotated_at all stored. |
| Rotation cron | `advance_task_rotations()` runs daily at 00:15 UTC via pg_cron. Finds tasks with elapsed rotation periods, bumps current_index (wrapping), flips is_active on assignments, updates assignee_id. | **Wired** | Migration 100133. Supports weekly, biweekly, monthly, custom (defaults to weekly). |
| Rotation UI | AssignmentSelector toggle + frequency dropdown (weekly/biweekly/monthly/custom) | **Wired** | Already existed — now the config actually persists. |

## Opportunity Claim Lock Expiration (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Server-side cron | `expire_overdue_task_claims()` runs hourly via pg_cron, releases expired claims | **Wired** | Sets status='released', released=true |
| Client-side backup | `useExpireOverdueClaims` sweeps on page load | **Wired** | Belt-and-suspenders with server cron |

## List Victory Mode (PRD-09B)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Victory mode selector | 4-option segmented control (None / Per item / All done / Both) in list detail header | **Wired** | Shopping + generic list views, owner/parent only |
| Per-item victories | Checking a flagged item → victory with source='list_item_completed', idempotent | **Wired** | Checks for existing victory before creating |
| List-level victories | Last unchecked item checked → victory with source='list_completed' | **Wired** | Debounced per session |
| Per-item flag toggle | Trophy icon on each item, toggleable by owner/parent | **Wired** | Auto-flags all items when switching to item_completed or both |
| Auto-flagging on mode change | Switching to item_completed/both bulk-sets all items' victory_flagged=true | **Wired** | Mom can unflag specific items |
| Default by list type | randomizer → 'item_completed', everything else → 'none' | **Wired** | Frontend default in useCreateList |
| Celebration banner | "All done! Victory recorded!" on list completion | **Wired** | Auto-dismisses after 4 seconds |
| victory_flagged column | Per-item boolean on list_items, default false | **Wired** | Migration 100102 |

## Painted Calendar / Pick Dates (Worker 5, 2026-04-27)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| "Pick Dates" frequency option | New radio option in UniversalScheduler alongside One-time/Daily/Weekly/Monthly/Yearly/Custom. Tap dates on a calendar grid. | **Wired** | Produces `schedule_type='painted'` SchedulerOutput with explicit `rdates`. |
| Per-date assignee mapping | When 2+ members assigned and Pick Dates active, each painted date gets member-color pill assignee buttons. | **Wired** | `PickDatesAssigneeEditor` component. `assignee_map` on SchedulerOutput. |
| Instantiation mode selector | "Each kid does their own" vs "Shared — anyone completes" segmented control. | **Wired** | `instantiation_mode` on SchedulerOutput. |
| Time-of-day window | Optional "Active from [time] to [time]" on painted schedules. | **Wired** | `active_start_time` / `active_end_time` on SchedulerOutput. |
| deed_firings table | Connector architecture event log. Stores `scheduled_occurrence_active` firings. | **Wired** | Migration 100180. Phase 3 inherits + adds contract evaluation. |
| Painted-day deed firing | Hourly Edge Function (`fire-painted-schedules`, cron :20) writes deed firings when painted days arrive per family timezone. | **Wired** | Idempotent via unique key. Convention #246 compliant. |
| lists.schedule_config | JSONB column for attaching painted/recurring schedules to lists. | **Wired** | Migration 100181. NULL = always active. |
| "Active today" badge on list cards | Display-only pill on Lists page grid/list views when a list has a schedule attached. Green "Active today" or gray "Scheduled". | **Wired** | No filtering/hiding — Phase 3 scope. |
| CalendarPreview painted mode | CalendarPreview day-click toggles painted dates (not RDATE/EXDATE) when `schedule_type='painted'`. | **Wired** | |
| `isDateActive()` helper | Checks if a specific date is active in any SchedulerOutput. Works for all schedule types. | **Wired** | Exported from `@/components/scheduling`. |
| Contract evaluation of deed firings | Phase 3 reads deed_firings and evaluates contracts → godmother dispatch | Stub | Phase 3 scope |
| List visibility gating by schedule | Lists hidden/filtered based on schedule active state | Stub | Phase 3 scope |
| Convert-to-recurrence detection | Detect weekly patterns in painted dates and offer RRULE conversion | Stub | Optional polish pass |

## Universal Capability Parity — Stage 2 (2026-04-30)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Victory on task completion | `useCompleteTask` creates `victories` row when `task.victory_flagged=true` via `createVictoryForCompletion` | **Wired** | 4 paths: useCompleteTask, useApproveTaskCompletion, useApproveCompletion, useApproveMasterySubmission |
| Shared routine completion attribution | Routine step completion uses member-color badges + "done by [Name]" text. `SharedWithHeader` shows shared assignment indicator. | **Wired** | `routine_step_completions.member_id` credits actual completer |
| Shared list completion attribution | List item check uses `checked_by` for member-color display | **Wired** | Member color rendered via `useMemberColor` |
| Soft-claim visibility on task cards | "In progress by [Name]" badge on `track_progress=true` tasks with `in_progress_member_id` set | **Wired** | Opportunity items show per-item attribute badges (reward, claim lock, advancement) |
| Allowance actual-completer pipeline | RPC uses `task_completions.family_member_id` (not `tasks.assignee_id`). Edge Function display count includes `task_assignments`. | **Wired** | Stage 1 migration 100190 + Stage 2 Edge Function fix |

## Universal Capability Parity — Stage 3 (2026-05-01)

| Capability | How It Works | Status | Notes |
|---|---|---|---|
| Content edit timing — Now/Next cycle | Mom chooses whether edits apply immediately or stage for next cycle. `pending_changes` table stages changes; cron auto-applies scheduled ones. | **Wired** | Migration 100192 (table), 100193 (cron). Routines: schedule_activation. Lists/sequential: manual_apply. |
| Routine Now/Next modal | `MasterTemplateEditConfirmationModal` extended with Now/Next segmented control. Type-aware defaults (display→Now, structural→Next). | **Wired** | Worker 2. Staging intercept in `handleEditConfirm` + save-to-studio. |
| List Now/Next modal | `NowNextChoiceModal` shared component. Intercepts capability edits on shared lists via `handleSharedListEdit`. | **Wired** | Worker 3 + gap fix. Tracking defaults + victory mode routed through handler. |
| Sequential Now/Next modal | `NowNextChoiceModal` on SequentialCollectionView. Per-item advancement edits pass through `onStagedEdit` prop. | **Wired** | Worker 3 + gap fix. |
| PendingChangesBadge | Self-hiding badge on Studio template cards, list cards, sequential collection cards. | **Wired** | Shows "N pending" when count > 0. |
| PendingChangesSummary | Collapsible inline section in TaskCreationModal for routine editing. Per-item cancel + apply-all. | **Wired** | Worker 2. |
| Apply Pending Changes banner | Banner on list detail + sequential detail views with "Apply now" button. | **Wired** | Worker 3. Calls `useApplyPendingChanges`. |
| Cron auto-apply | `util.apply_scheduled_pending_changes()` runs hourly at :15. Dynamic SQL for generic apply. | **Wired** | Migration 100193. Handles all 7 source types. |
| Family Overview bug fix | Null-due-date tasks filtered to 7-day window + not-completed + `isRecurringTaskVisibleToday`. | **Wired** | `useFamilyOverviewData.ts:59`. |
| LiLa drawer default closed | `MomShell.tsx` `_lilaVisible` defaults to `false` instead of `true`. | **Wired** | UX fix. |
| FeatureGuide disabled | `FEATURE_GUIDES_DISABLED = true` constant guards render + effect. | **Wired** | Temporary. Flip to `false` to re-enable. |

## Known Issues / TODO

- LiLa help button in GuidedFormFillView is a stub (PRD-05 dependency)
- Guided Form child fill view + mom review flow not tested end-to-end
- Quick Create "Send Request" falls back to Notepad until PRD-15 is built
