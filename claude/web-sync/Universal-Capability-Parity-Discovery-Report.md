# Universal Capability Parity — Discovery Report

> **Generated:** 2026-04-28
> **Type:** Read-only discovery — no code changes, no recommendations
> **Context:** Daily Progress Marking shipped track_progress + track_duration + soft-claim on tasks and routine steps. Founder wants a parity matrix across all primitives before deciding sequencing.
> **Principle:** Default-include. Uncertainty → ⚠️ + open question, not "doesn't apply."

---

## 1. Parity Matrix

### Legend

- **✅ Full** — Schema column exists + mom-configuration UI to set it + runtime behavior reads/uses the value
- **⚠️ Schema only** — Column exists but either (a) no mom-facing UI to configure it, OR (b) UI exists but the value is not consumed at runtime to change behavior, OR (c) column exists on a parent table only and individual-item override is missing
- **❌ Missing** — No schema column, no UI, no runtime behavior
- **🔗 Inherited** — No column on this primitive; capability is inherited from a linked/parent source at runtime. Distinguished from ⚠️ because the inheritance is intentional and working.

### Underlying tables per primitive type

| Primitive | Table | Distinguishing filter |
|---|---|---|
| Standalone task | `tasks` | No `template_id`, no `sequential_collection_id` |
| Recurring/routine task | `tasks` | Has `template_id`, `task_type='routine'` |
| Static routine step | `task_template_steps` | `step_type='static'` |
| Linked routine step | `task_template_steps` | `step_type IN ('linked_sequential','linked_randomizer','linked_task')` |
| Sequential item | `tasks` | `sequential_collection_id` set, `task_type='sequential'` |
| Randomizer list item | `list_items` | Parent `lists.list_type='randomizer'` |
| Plain list item | `list_items` | Parent list is non-randomizer, non-sequential |
| Habit | `tasks` | `task_type='habit'` |

---

### The Matrix

| # | Capability | Standalone Task | Routine Task | Static Step | Linked Step | Sequential Item | Randomizer Item | Plain List Item | Habit |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Track daily progress | ✅ Full | ✅ Full | ❌ Missing | 🔗 Inherited | ✅ Full | ⚠️ Schema only | ⚠️ Schema only | ✅ Full |
| 2 | Track duration | ✅ Full | ✅ Full | ❌ Missing | 🔗 Inherited | ✅ Full | ⚠️ Schema only | ⚠️ Schema only | ✅ Full |
| 3 | Counts for allowance | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ❌ Missing | ❌ Missing | ✅ Full |
| 4 | Counts for gamification | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ❌ Missing | ❌ Missing | ✅ Full |
| 5 | Counts for homework | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ❌ Missing | ❌ Missing | ✅ Full |
| 6 | Victory on completion | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ✅ Full | ✅ Full | ✅ Full |
| 7 | Require approval | ✅ Full | ✅ Full | ❌ Missing | 🔗 Inherited | ✅ Full | ⚠️ Schema only | ❌ Missing | ✅ Full |
| 8 | Advancement mode | ⚠️ Schema only | ⚠️ Schema only | ❌ Missing | 🔗 Inherited | ✅ Full | ✅ Full | ⚠️ Schema only | ⚠️ Schema only |
| 9 | Attach reward | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ❌ Missing | ✅ Full | ⚠️ Schema only | ✅ Full |
| 10 | Sharing / multi-assignee | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ⚠️ Schema only | ⚠️ Schema only | ✅ Full |
| 11 | Soft-claim | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ⚠️ Schema only | ❌ Missing | ❌ Missing | ✅ Full |
| 12 | Schedule / due date | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ✅ Full |
| 13 | Life area tag | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ✅ Full | ❌ Missing | ❌ Missing | ✅ Full |
| 14 | Milestone flag | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |
| 15 | Include in LiLa AI | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing |
| 16 | Resource URL | ✅ Full | ✅ Full | ❌ Missing | 🔗 Inherited | ✅ Full | ⚠️ Schema only | ⚠️ Schema only | ✅ Full |
| 17 | Image / icon | ⚠️ Schema only | ⚠️ Schema only | ❌ Missing | ❌ Missing | ⚠️ Schema only | ❌ Missing | ❌ Missing | ⚠️ Schema only |
| 18 | Notes / description | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 19 | Subtasks (Task Breaker) | ✅ Full | ✅ Full | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ✅ Full |

---

### Cell-by-cell evidence notes

**Capability 1 — Track daily progress (`track_progress`)**

| Primitive | Rating | Evidence |
|---|---|---|
| Standalone task | ✅ Full | `tasks.track_progress` column (migration 100183). Config UI: TaskCreationModal Rewards & Tracking section checkbox + Long Term Task type picker auto-sets it. Runtime: TaskCard renders "Worked on this today" button when `task.track_progress && status !== 'completed'`. Practice logged to `practice_log` with `source_type='task'`. |
| Routine task | ✅ Full | Same `tasks.track_progress` column. Same TaskCard UI (routine tasks render as TaskCard on dashboard). |
| Static step | ❌ Missing | `task_template_steps` has no `track_progress` column. Steps are simple checkboxes with `routine_step_completions`. |
| Linked step | 🔗 Inherited | `RoutineStepChecklist.tsx:52` queries the linked source task's `track_progress` and `track_duration`. When the linked source has `track_progress=true`, the step renders the practice action instead of a simple checkbox. Working at runtime. |
| Sequential item | ✅ Full | Sequential items are `tasks` rows — same column. `useCreateSequentialCollection` propagates from collection defaults. Practice actions work via the existing mastery/practice pipeline. |
| Randomizer item | ⚠️ Schema only | `list_items.track_progress` column exists (migration 100183). `lists.default_track_progress` exists with config UI in `TrackingDefaultsPanel`. Per-item tri-state override in Lists.tsx:1798. **BUT:** no runtime "Worked on this today" button renders on list items directly. The value is only consumed when an item becomes a task via opportunity claim (`useOpportunityLists.ts:180` inherits it). Mom can configure it; the value propagates to generated tasks; but there is no standalone runtime action on the list item itself. |
| Plain list item | ⚠️ Schema only | Same situation as randomizer items. Column + config UI exists; no standalone runtime action. |
| Habit | ✅ Full | Habits are `tasks` rows with `task_type='habit'`. Same column, same TaskCard rendering. |

**Capability 2 — Track duration (`track_duration`)**

Same pattern as capability 1. Key difference: `track_duration` existed since Build J (migration 100105) on `tasks`, `list_items`, `lists.default_track_duration`, and `sequential_collections.default_track_duration`. Daily Progress Marking added the `DurationPromptModal` UI and wired it into task completion + practice flows.

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | Column + DurationPromptModal on completion and on "Worked on this today". |
| Static step | ❌ Missing | No column on `task_template_steps`. |
| Linked step | 🔗 Inherited | Reads linked source's `track_duration` via `RoutineStepChecklist.tsx:52`. |
| Sequential item | ✅ Full | Column + config UI in SequentialCreator + runtime via PracticeCompletionDialog. |
| Randomizer/Plain item | ⚠️ Schema only | Column + list-level config UI. No standalone runtime prompt on list items; propagates to generated tasks only. |

**Capability 3 — Counts for allowance (`counts_for_allowance`)**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.counts_for_allowance` column. Config UI: TaskCreationModal checkbox. Runtime: `calculate-allowance-period` Edge Function queries `.eq('counts_for_allowance', true)`. |
| Static/Linked step | ❌ Missing | No column on `task_template_steps`. Allowance operates on the parent task, not on individual steps. |
| Sequential item | ⚠️ Schema only | Column exists (it's a `tasks` row). But: the sequential collection creation UI (`SequentialCreatorModal`) does not expose this toggle. Sequential items inherit the column's default (`false`). Mom cannot currently set `counts_for_allowance=true` on a sequential item without editing the DB directly. |
| Randomizer/Plain item | ❌ Missing | No `counts_for_allowance` column on `list_items`. |

**Capability 4 — Counts for gamification (`counts_for_gamification`)**

Same pattern as capability 3. Column on `tasks` (default `true`), `task_templates` carries it. Config UI in TaskCreationModal. No column on `list_items`. Sequential items inherit from `tasks` default but no creation UI.

**Capability 5 — Counts for homework (`counts_for_homework`)**

Same pattern as capabilities 3-4. Column on `tasks`, config UI in TaskCreationModal, consumed by `LogLearningTracker.tsx:193`. No column on `list_items`. No creation UI in SequentialCreatorModal.

**Capability 6 — Victory on completion**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.victory_flagged` column. TaskCreationModal "Flag completion as a Victory" checkbox. Runtime: `useTasks.ts:336` creates victory record on completion. |
| Static/Linked step | ❌ Missing | No column on `task_template_steps`. No per-step victory concept. |
| Sequential item | ⚠️ Schema only | Column exists. SequentialCreatorModal does not expose the toggle. |
| Randomizer/Plain item | ✅ Full | `list_items.victory_flagged` column. Lists.tsx renders per-item trophy toggle button. `lists.victory_mode` (none/item_completed/list_completed/both) drives runtime behavior: checking a flagged item creates a victory record. Full 4-mode system working. |

**Capability 7 — Require approval (`require_approval`)**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.require_approval` column. TaskCreationModal checkbox. Runtime: completion goes to `pending_approval` status; appears in PendingApprovalsSection. |
| Static/Linked step | ❌ / 🔗 | Static: no column, no concept. Linked: mastery approval (`require_mastery_approval`) is inherited from the linked source, but general `require_approval` is not — that lives on the parent task, not the step. |
| Sequential item | ✅ Full | Column exists. `require_mastery_approval` also exists. Both configurable in SequentialCreator. Runtime: mastery submissions go to approval queue. |
| Randomizer item | ⚠️ Schema only | `list_items.require_mastery_approval` exists. No general `require_approval` on list_items. The mastery approval path works (usePractice.ts handles it), but non-mastery completion approval is not a list_items concept. |
| Plain item | ❌ Missing | No approval concept. Checking a plain list item is instant. |

**Capability 8 — Advancement mode**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine task | ⚠️ Schema only | `tasks.advancement_mode` column exists. BUT: the TaskCreationModal does not expose an advancement mode picker for standalone or routine tasks. The column is only populated via opportunity claim inheritance (`useOpportunityLists.ts:175`) or sequential collection creation. A standalone task created through the normal modal always gets `advancement_mode` default. |
| Habit | ⚠️ Schema only | Same — column exists on `tasks`, but habits don't surface the concept in UI. |
| Static step | ❌ Missing | No column. |
| Linked step | 🔗 Inherited | Reads from linked source (sequential/randomizer item). |
| Sequential item | ✅ Full | Full lifecycle: collection-level default + per-item override in SequentialCreator. Practice/mastery UI in SequentialCollectionView. Approval queue for mastery. |
| Randomizer item | ✅ Full | `list_items.advancement_mode` column. Config in Lists.tsx. Mastery detection in `useRandomizerDraws.ts:71`. |
| Plain item | ⚠️ Schema only | Column exists but no configuration UI for plain lists. Default is 'complete'. |

**Capability 9 — Attach reward**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | TaskCreationModal "Reward Type" dropdown + amount field. `task_rewards` table row created. `points_override` on tasks for gamification pipeline. |
| Static/Linked step | ❌ Missing | No reward concept at step level. |
| Sequential item | ❌ Missing | Column `sequential_collections.reward_per_item_type/amount` exists in schema but `tasks` rows for sequential items don't carry reward type/amount directly (only `points_override`). No reward configuration in SequentialCreator UI. |
| Randomizer item | ✅ Full | `list_items.reward_type` + `list_items.reward_amount`. `lists.default_reward_type/amount`. Config UI in Lists.tsx. SmartImportModal extracts rewards. Propagated to tasks on claim via `useOpportunityLists.ts:158-159`. |
| Plain item | ⚠️ Schema only | Columns exist (`reward_type`, `reward_amount` on `list_items`). No configuration UI surfaces them for plain lists — these columns are rendered only when `lists.is_opportunity=true`. |

**Capability 10 — Sharing / multi-assignee**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.is_shared` column. `task_assignments` table. TaskCreationModal member picker with Any/Each toggle (Convention #119). `is_shared=true` set when 2+ assignees selected with "Any" mode. |
| Static/Linked step | ❌ Missing | No column on `task_template_steps`. Sharing is a property of the parent routine task, not individual steps. |
| Sequential item | ⚠️ Schema only | Column exists (it's a `tasks` row), but `useCreateSequentialCollection` hardcodes `is_shared: false`. No sharing configuration in SequentialCreator. |
| Randomizer/Plain item | ⚠️ Schema only | `lists.is_shared` exists. `list_shares` table exists. Lists.tsx renders "Shared" badge. But: sharing UX is incomplete — Workers 2+3 scope. Today mom can set `is_shared=true` but the completion/color-of-completer UX is not built. |

**Capability 11 — Soft-claim (`in_progress_member_id`)**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.in_progress_member_id` column (migration 100183). Set on first practice session. Completion gating via `softClaim.ts`. Cross-claim warning modal. Dashboard visibility via query OR clause. |
| Static/Linked step | ❌ Missing | No column on `task_template_steps`. |
| Sequential item | ⚠️ Schema only | Column exists (tasks row). Not actively set during sequential practice — `useLogPractice` 'task' branch sets it, but sequential practice goes through the 'sequential_task' branch which does not set `in_progress_member_id`. |
| Randomizer/Plain item | ❌ Missing | No `in_progress_member_id` column on `list_items`. |

**Capability 12 — Schedule / due date / recurrence**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.due_date`, `tasks.due_time`, `tasks.recurrence_details`, `tasks.recurrence_rule`. Full Universal Scheduler integration in TaskCreationModal. |
| Static/Linked step | ❌ Missing | Steps inherit timing from their parent section's `frequency_rule`/`frequency_days`, not individual scheduling. |
| Sequential item | ❌ Missing | Sequential items don't have individual due dates. The parent task/collection may have one. |
| Randomizer/Plain item | ❌ Missing | `list_items` has no due_date column. `lists.schedule_config` exists (migration 100181, Worker 5) for list-level scheduling, but individual items don't have dates. |
| Habit | ✅ Full | Same `tasks` columns. |

**Capability 13 — Life area tag**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.life_area_tag`. TaskCreationModal life area selector. Runtime: ByCategoryView groups by it. DailyCelebration and victory routing use it. |
| Static/Linked step | ❌ Missing | No column on `task_template_steps`. |
| Sequential item | ✅ Full | Column exists. `sequential_collections.life_area_tag` also exists. Propagated during creation. |
| Randomizer/Plain item | ❌ Missing | No `life_area_tag` on `list_items`. `list_items.category` exists (free-form TEXT, used for section grouping in shopping lists etc.), but it's not the same semantic as the platform-wide `life_area_tag` taxonomy. |

**Capability 14 — Milestone flag (`is_milestone`)**

| Primitive | Rating | Notes |
|---|---|---|
| ALL | ❌ Missing | No `is_milestone` column exists anywhere in the live schema. The concept is documented extensively in `Composition-Architecture-and-Assembly-Patterns.md` and `TRIAGE_WORKSHEET.md` (row NEW-N) but has no implementation. Zero schema, zero UI, zero runtime. |

**Capability 15 — Include in LiLa AI context (`is_included_in_ai`)**

| Primitive | Rating | Notes |
|---|---|---|
| ALL task-based | ❌ Missing | `tasks` has no `is_included_in_ai` column. Context assembly (`_shared/context-assembler.ts`) does not load individual tasks into LiLa context. |
| ALL step-based | ❌ Missing | Same. |
| Randomizer/Plain item | ❌ Missing | `list_items` has no `is_included_in_ai`. The parent `lists.is_included_in_ai` column exists and the toggle works at the list level, but individual items have no per-item AI context toggle. |

**Capability 16 — Resource URL**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.resource_url`. TaskCard renders it as a clickable link (TaskCard.tsx:259). |
| Static step | ❌ Missing | No column on `task_template_steps`. |
| Linked step | 🔗 Inherited | `RoutineStepChecklist.tsx:52` queries `resource_url` from the linked source task. Renders it. |
| Sequential item | ✅ Full | Column exists. Propagated in `useSequentialCollections.ts:164`. Displayed in collection view. |
| Randomizer/Plain item | ⚠️ Schema only | `list_items.url` column exists (note: different column name than tasks). Used by opportunity claim to populate `resource_url` on the generated task. But: no standalone rendering of URLs on list items in the main list detail view (only rendered in OpportunityListBrowse when claiming). |

**Capability 17 — Image / icon**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ⚠️ Schema only | `tasks.image_url` exists but is legacy (Convention #166: `resource_url` replaced it for URLs). `tasks.icon_asset_key` + `tasks.icon_variant` exist and are used by PlayTaskTile (Play shell only). TaskCreationModal has an icon picker for Play children. No general-purpose image attachment UI for non-Play shells. |
| Static/Linked step | ❌ Missing | No columns. |
| Sequential item | ⚠️ Schema only | Same as standalone task (it's a `tasks` row). |
| Randomizer/Plain item | ❌ Missing | No image/icon columns on `list_items`. |

**Capability 18 — Notes / description**

| Primitive | Rating | Notes |
|---|---|---|
| ALL | ✅ Full | `tasks.description`, `task_template_steps.step_notes`, `list_items.notes`. All have creation/edit UI. All render in their respective views. |

**Capability 19 — Subtasks (Task Breaker)**

| Primitive | Rating | Notes |
|---|---|---|
| Standalone/Routine/Habit task | ✅ Full | `tasks.parent_task_id` FK. TaskBreaker component (Haiku/Sonnet AI decomposition). Context menu "Break It Down" action. StandaloneTaskBreakerModal for QuickTasks strip. |
| Static/Linked step | ❌ Missing | Steps are not decomposable into sub-steps. |
| Sequential item | ❌ Missing | Sequential items don't have a Task Breaker surface (they ARE the decomposition of a collection). |
| Randomizer/Plain item | ❌ Missing | No decomposition concept for list items. |

---

## 2. Opportunity Investigation

### How "opportunity" is currently modeled

**At the list level — `lists` table:**
- `lists.is_opportunity BOOLEAN` — a flag on ANY list type (shopping, custom, randomizer, etc.). When `true`, the list is treated as an opportunity board.
- `lists.default_opportunity_subtype` — `'repeatable'` | `'claimable'` | `'one_time'` (nullable). Inherited by items that don't specify their own.
- `lists.default_reward_type` — `'money'` | `'points'` | `'privilege'` (nullable).
- `lists.default_reward_amount` — DECIMAL (nullable).
- `lists.default_claim_lock_duration` — INTEGER (nullable).
- `lists.default_claim_lock_unit` — TEXT (nullable).
- `lists.eligible_members` — UUID[] (nullable, null = everyone).

**At the item level — `list_items` table:**
- `list_items.opportunity_subtype` — per-item override of the list default.
- `list_items.reward_type`, `list_items.reward_amount` — per-item reward override.
- `list_items.claim_lock_duration`, `list_items.claim_lock_unit` — per-item lock override.

**At the task level — `tasks` table:**
- `tasks.task_type` CHECK constraint includes `'opportunity_repeatable'`, `'opportunity_claimable'`, `'opportunity_capped'`.
- These task_type values are set by the claim→task bridge in `useOpportunityLists.ts:150-155`, mapping opportunity subtypes to task_type values.
- The tasks page Opportunities tab filters by these task_type values (Tasks.tsx:547-549).

### Current flow — how claiming works

1. **Browse:** `OpportunityListBrowse.tsx` renders available items from lists where `is_opportunity=true`. Items shown via `useOpportunityItems` hook (queries `list_items.is_available=true`).

2. **Claim:** Kid taps "I'll do this!" → `useClaimOpportunityItem` mutation fires:
   - Availability check (for one_time/claimable: no existing active task from same item)
   - Cooldown check (for repeatable: respects `cooldown_hours`)
   - Maps subtype to task_type (`one_time` → `opportunity_capped`, `claimable` → `opportunity_claimable`, `repeatable` → `opportunity_repeatable`)
   - Creates a `tasks` row with `source='opportunity_list_claim'`, `source_reference_id=listItem.id`
   - Inherits: advancement_mode, practice_target, mastery settings, track_duration, track_progress, in_progress_member_id, resource_url from the list item
   - Creates `task_rewards` record if reward configured
   - Creates `task_claims` record for claimable subtypes (with lock timer)

3. **Complete:** Standard task completion pipeline (approval, gamification, allowance).

### Which surfaces treat opportunity as what

| Surface | Treats opportunity as... |
|---|---|
| Lists.tsx (list detail settings) | **List attribute** — checkbox `is_opportunity` on any list type. When checked, reveals opportunity settings panel. |
| OpportunityListBrowse.tsx | **List type** — dedicated browsing component for opportunity lists. |
| Tasks.tsx Opportunities tab | **Task type** — filters by `task_type IN (opportunity_repeatable, opportunity_claimable, opportunity_capped)` on generated tasks. |
| useOpportunityLists.ts | **List attribute** — queries `lists.is_opportunity=true`. |
| OpportunityDashboardView.tsx | **Task type** — renders generated opportunity tasks on kid dashboards. |
| createTaskFromData.ts | **Task type** — maps opportunity subtypes to task_type values. |
| Studio seed templates | **Template type** — `template_type: 'opportunity_claimable'` is a distinct Studio shelf category. |
| SmartImportModal | **List attribute** — passes `is_opportunity` into edge function context. |

### Key observation

Opportunity is modeled as a **list-level boolean attribute** (`is_opportunity`) that can be applied to ANY list type, combined with **item-level subtype/reward overrides**. When a kid claims an item, it generates a `tasks` row with one of three opportunity-specific `task_type` values. The pattern is: list → item → generated task. Opportunity is NOT a separate entity — it's a behavioral overlay on the existing list infrastructure.

---

## 3. Infrastructure Inventory — Daily Progress Marking

### 3.1 practice_log.source_type CHECK constraint

Current accepted values (after migration 100183):
```
'sequential_task', 'randomizer_item', 'task', 'routine_step'
```
The constraint is a database-level CHECK, extended additively. Existing rows unaffected.

### 3.2 Inheritance resolution function

**YES — built as a single-source-of-truth helper.**

File: `src/lib/tasks/resolveTrackingProperties.ts`

```typescript
export function resolveTrackingProperties(
  item?: TrackableItem | null,
  listDefaults?: ListTrackingDefaults | null
): { track_progress: boolean; track_duration: boolean }
```

Called from `createTaskFromData.ts` (lines 79-93) for ALL task creation paths. Handles the three-tier resolution: item explicit → list defaults → false. This is a reusable pattern that could be extended to resolve other capabilities.

### 3.3 Feature key registry

Four keys registered in migration 100186:
- `task_progress_tracking` — Essential tier, all role groups
- `task_duration_tracking` — Essential tier, all role groups
- `task_session_history` — Essential tier, all role groups
- `task_soft_claim` — Essential tier, all role groups

All return `true` unconditionally during beta (per Convention: `useCanAccess()` returns true for everything during beta). No actual gating logic. The infrastructure is: key in `feature_key_registry` + rows in `feature_access_v2` per role group + `useCanAccess()` hook always returns true.

### 3.4 Per-task track toggle UI

**Where it lives:**
- `TaskCreationModal.tsx:2298-2318` — Two checkboxes in the "Rewards & Completion Tracking" section:
  - "Track daily progress (multi-day)" → `data.trackProgress`
  - "Track time spent" → `data.trackDuration`
- Primary entry: Long Term Task type in the Task Type picker auto-sets both to `true`.

**Reusability assessment:**
- The checkboxes are **inline in TaskCreationModal** — not extracted as a reusable component.
- The `TrackingDefaultsPanel` component (`src/components/lists/TrackingDefaultsPanel.tsx`) IS reusable — it's a standalone panel with `defaultTrackProgress` and `defaultTrackDuration` props. Used in Lists.tsx for list-level defaults. Could be reused in any "Configure Item" surface.
- The per-item tri-state override (inherit/on/off) in Lists.tsx:1798-1817 is **inline JSX** — not extracted.

### 3.5 "Configure Item" / three-dot menu pattern

**Existing patterns found:**

1. **TaskCard context menu** (`TaskCard.tsx:748-825`) — `MoreVertical` icon opens a dropdown with: Edit, Focus Timer, Break It Down, Assign, Remove from dashboard, Delete. **This is the closest existing "configure item" surface for tasks.** It is action-oriented, not configuration-oriented. No toggles for track_progress, counts_for_allowance, etc.

2. **CustomizedTemplateCard menu** (`CustomizedTemplateCard.tsx`) — `MoreHorizontal` on Studio templates: Deploy, Edit, Duplicate, Archive.

3. **MemberArchiveDetail menu** (`MemberArchiveDetail.tsx:365`) — `MoreVertical` on archive items.

4. **LilaConversationHistory context menu** — Long-press context menu for conversation items.

5. **No universal "Configure Item" component exists.** Each surface has its own ad-hoc menu. There is no shared component like `<ItemConfigMenu capabilities={...} />`. The TaskCreationModal serves as the configuration surface for tasks (opened via the Edit action in the context menu), but it's heavy and modal-based — not suitable for quick inline capability toggles.

---

## 4. Asymmetries

### 4.1 `list_items` has no `in_progress_member_id`

Daily Progress Marking added `tasks.in_progress_member_id` for soft-claim. `list_items` has no equivalent column. List items that become tasks via opportunity claim get the soft-claim on the generated task, but a standalone list item (not claimed into a task) cannot track who's currently working on it.

### 4.2 Static routine steps have no capability columns at all

`task_template_steps` has: title, notes, sort_order, instance_count, require_photo, step_type, linked_source_id/type, display_name_override. That's it. None of the 19 capabilities (except notes and require_photo) exist on this table. Static steps are pure checkbox items. Any capability a step needs must come from the parent task, the parent section, or a linked source.

### 4.3 Habit has no special behavior

`task_type='habit'` is in the CHECK constraint and appears in filter logic (Tasks.tsx:539, PlayDashboard.tsx:92), but habits have **zero distinguishing behavior** from standalone tasks beyond the type label. They use the same `tasks` columns, same TaskCard rendering, same completion pipeline. The schema treats habits as tasks with a different type label.

There is no habit-specific:
- Streak tracking (streaks are at the member level via `family_members.current_streak/longest_streak`, driven by the gamification pipeline on ANY task completion, not habit-specific)
- Frequency expectation (habits have `recurrence_details` same as any recurring task)
- "Did I do this today?" UI (track_progress serves this purpose now, but it's not habit-specific)

### 4.4 Sequential items carry task columns but miss creation UI

Sequential items are `tasks` rows, so they have ALL the schema columns (counts_for_allowance, victory_flagged, icon_asset_key, etc.). But `SequentialCreatorModal` only exposes: title, description, advancement_mode, practice_target, mastery approval/evidence, track_duration, track_progress, life_area_tag, resource_url. It does NOT expose: counts_for_allowance, counts_for_homework, counts_for_gamification, victory_flagged, reward, icon, sharing.

### 4.5 `list_items.url` vs `tasks.resource_url`

Different column names for the same concept. `list_items.url` → propagated to `tasks.resource_url` on opportunity claim (`useOpportunityLists.ts:189`). The naming asymmetry means any universal "Configure Item" component would need to alias/normalize this.

### 4.6 Advancement mode on standalone tasks is dead weight

`tasks.advancement_mode` column exists but standalone tasks created through TaskCreationModal always get the default value. The column is only populated with non-default values when the task is generated from a sequential collection or opportunity claim. There is no "advancement mode picker" in the task creation UI.

### 4.7 is_included_in_ai gap

The three-tier context toggle pattern (`is_included_in_ai` at person/category/item level) is well-established for archives, self_knowledge, guiding_stars, best_intentions, journal_entries, and lists. But it does NOT extend to tasks, task steps, or individual list items. Tasks are not individually includable/excludable from LiLa context.

---

## 5. Open Questions for Founder

### Architectural

**Q1.** Static routine steps have no capability columns. Should a "Configure Item" entry point on a static step surface capabilities from the **parent task** (the routine deployment) rather than from the step itself? Or should steps gain their own capability columns?

**Q2.** Linked routine steps inherit capabilities from their linked source. Should the "Configure Item" entry point on a linked step navigate to the linked source's configuration, or should there be a step-level override layer?

**Q3.** The Habit task type has no distinguishing behavior from a standalone task. Should the universal capability parity work treat `task_type='habit'` as a genuine eighth primitive, or should it be collapsed into "standalone task with a label"?

**Q4.** `is_milestone` has no schema anywhere. This is a new capability that would need to be added to potentially every table. Is this in scope for the parity work, or is it a separate initiative per the Composition Architecture doc's NEW-N triage item?

**Q5.** `is_included_in_ai` on tasks/list items would be a fundamentally new context source for LiLa. Is this in scope for parity, or does it belong with the context assembly pipeline work?

### Capability-specific

**Q6.** Counts-for-allowance/homework/gamification on list items: these don't exist today. Should the parity work add these columns to `list_items`, or should these capabilities only apply after an item becomes a task (via opportunity claim)?

**Q7.** Reward attachment on sequential items: `sequential_collections` has `reward_per_item_type/amount` columns in the schema, but the creation UI doesn't expose them and generated task rows don't carry per-item rewards. Should parity include wiring this?

**Q8.** Victory-on-completion for sequential items: the column exists but no creation UI. When a kid masters a sequential item (e.g., finishes a chapter), should a victory automatically fire? This seems like it should, but it's not wired today.

**Q9.** Schedule/due-date on list items: items don't have individual dates. Some list types (shopping, packing) are date-irrelevant. Should parity add `due_date` to `list_items`, or is date always a list-level (via `lists.schedule_config`) or generated-task-level concern?

**Q10.** Soft-claim on list items: this would require `list_items.in_progress_member_id`. But list items don't have a "Worked on this today" action today. Should parity add both the column AND the runtime action, or just the column (propagated to generated tasks)?

### Interaction concerns

**Q11.** `advancement_mode='mastery'` + `sharing='shared_anyone_completes'`: who submits "I've mastered this"? Any of the shared participants? Only the soft-claim holder? Only mom? This is a real interaction that will arise in homeschool families with shared curriculum.

**Q12.** `counts_for_allowance=true` + `is_shared=true`: if a shared task is worth $3 and Mosiah completes it, does Mosiah's allowance get +$3, or does each kid's allowance get +$3? The locked Workers 2+3 decision says "actual completer's numerator" — but does that mean only ONE kid earns, or ALL kids who practiced on it?

**Q13.** `track_progress=true` on a plain list item: what would "Worked on this today" mean on a shopping list item? Should some list types be excluded from certain capabilities, or should the UI just not render capabilities that don't make sense for the list type?

**Q14.** Should the "Configure Item" entry point be a modal (like TaskCreationModal edit mode), an inline expandable panel, or a three-dot context menu with toggles? The current TaskCard context menu is action-oriented; adding 8+ toggles to it would change its character significantly.

### Naming/data

**Q15.** `list_items.url` vs `tasks.resource_url` — should parity normalize this, or leave the column names as-is with an aliasing layer?

**Q16.** `list_items.category` (free-form, for section grouping) vs `tasks.life_area_tag` (platform taxonomy for filtering/reporting). These are different concepts with similar names. Should parity add `life_area_tag` to `list_items` as a separate column, coexisting with `category`?

---

## 6. Workers 2+3 Work-in-Progress Report

### Code on disk: **NONE**

Workers 2+3 is **purely planning-side**. No scaffolding, no migrations, no half-built components.

Evidence:
- No migrations reference "shared routines" or "shared lists" (`supabase/migrations/` grep: zero results)
- No `sharing_mode` column in any migration file
- `git log --all --oneline --diff-filter=A` for shared-routine/shared-list patterns: only the docs commit (`9dc7a60`)
- The paused build file (`.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md`) contains only planning decisions, scoping answers, bug fix lists, and forward-compat notes

### Existing infrastructure relevant to Workers 2+3

- `tasks.is_shared` column exists and is functional (set by TaskCreationModal when 2+ assignees + "Any" mode)
- `task_assignments` table supports multiple assignees per task
- `routine_step_completions.member_id` captures the actual completer per step
- `lists.is_shared` column exists
- `list_shares` table exists
- `list_items.checked_by` + `list_items.checked_at` capture the completer
- Shared-routine-related vitest (Worker 1 audit): `tests/recurring-task-filter-advance-start.test.ts` includes `is_shared=true` test block

### Interaction with universal-capability-parity

If the founder decides to pursue universal capability parity BEFORE Workers 2+3, the sharing-related capabilities (#10) would be addressed as part of parity. Workers 2+3 would then inherit a richer capability surface and focus purely on the shared-completion UX (completer color rendering, mom review surface, allowance credit routing).

If Workers 2+3 ships FIRST, the sharing UX ships on the current capability surface, and parity would later back-fill missing capabilities on shared primitives.

Either sequencing is valid. The decision depends on whether "every item configurable the same way" or "sharing actually working" is higher priority for beta.

---

## 7. Scope Estimate

### Cell counts from the parity matrix

| Status | Count | Percentage |
|---|---|---|
| ✅ Full | 64 | 42% |
| ⚠️ Schema only | 28 | 18% |
| 🔗 Inherited | 7 | 5% |
| ❌ Missing | 53 | 35% |
| **Total** | **152** | 100% |

### ⚠️ Schema-only cells (28) — Quick wins

These have the column but need mom-configuration UI and/or runtime behavior:

**Tasks-based (standalone/routine/habit) — 5 cells:**
- Advancement mode on standalone tasks (column exists, no UI picker)
- Image/icon on non-Play tasks (column exists, picker only for Play)
- Image/icon on routine tasks (same)
- Image/icon on habit tasks (same)
- Image/icon on sequential items (same)

**Sequential items — 5 cells:**
- Counts for allowance (column exists, no SequentialCreator UI)
- Counts for gamification (same)
- Counts for homework (same)
- Victory on completion (same)
- Soft-claim (column exists, not wired in sequential practice flow)

**List items (randomizer + plain) — 11 cells:**
- Track progress on randomizer (column + config exists, no runtime action)
- Track progress on plain (same)
- Track duration on randomizer (same)
- Track duration on plain (same)
- Require approval on randomizer (mastery approval exists, general approval doesn't)
- Advancement mode on plain (column exists, no config UI)
- Reward on plain (columns exist, only shown when is_opportunity)
- Sharing on randomizer (is_shared exists, UX incomplete)
- Sharing on plain (same)
- Sharing on sequential (is_shared exists, hardcoded false)
- Resource URL on randomizer/plain (url column exists, no rendering in main list view)

**Also counted:**
- 2 more resource_url on list items

### ❌ Missing cells (53) — Real work

**Broadly:**
- `is_milestone`: 8 cells (all primitives) — entirely new capability
- `is_included_in_ai`: 8 cells (all primitives) — new on tasks/items, existing pattern on other tables
- Everything on static steps: 16 cells — these would require new columns on `task_template_steps` (or a decision that capabilities live on the parent, not the step)
- Counts-for-allowance/homework/gamification on list items: 6 cells — new columns
- Various other gaps: 15 cells

### How many can reuse Daily Progress Marking's pattern

**High reusability (toggle on item → wire to existing capability):**
- Track progress/duration on list items (runtime action): pattern exists on TaskCard, needs a list-item equivalent
- Counts-for-allowance/homework/gamification on list items: same toggle pattern from TaskCreationModal
- Victory on sequential items: same checkbox pattern
- Sharing UI gaps: pattern exists in TaskCreationModal

**Medium reusability (pattern exists but needs adaptation):**
- Soft-claim on list items: `in_progress_member_id` pattern exists on tasks, needs column + hooks for list_items
- Advancement mode on standalone tasks: column exists, needs UI picker (can reuse from SequentialCreator)

**New infrastructure needed:**
- `is_milestone`: entirely new. No schema, no UI, no runtime. Estimated: 1 migration + 1 reusable component + wiring in every creation modal.
- `is_included_in_ai` on tasks/items: schema is trivial, but wiring into context assembly pipeline is non-trivial.
- "Configure Item" universal component: no existing equivalent. Would need design + implementation.
- Static step capabilities: architectural decision needed first (see Q1).

### Rough magnitude

- **⚠️ cells (28 quick wins):** Mostly UI work — adding toggles to existing creation/edit modals, adding runtime behavior to read existing columns. Estimated ~1-2 focused sessions.
- **❌ cells that reuse patterns (25-30 of the 53):** Column additions + toggle UI + wiring. Estimated ~2-3 focused sessions.
- **❌ cells that need new infrastructure (23-28):** `is_milestone`, `is_included_in_ai`, static step decisions, universal "Configure Item" surface. Estimated ~3-5 focused sessions, with design decisions needed before code.
- **Total estimated:** 6-10 focused sessions, assuming no architectural redesigns.

---

*End of Universal Capability Parity Discovery Report*
