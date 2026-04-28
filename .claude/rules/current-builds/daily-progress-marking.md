# Daily Progress Marking — Active Build

## Status: ACTIVE

**PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
**Addendum:** `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md`
**Pre-build notes:** `claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md`
**Feature decision file:** `claude/feature-decisions/PRD-09A-Daily-Progress-Marking.md`
**Paused context:** Workers 2+3 at `.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md`
**Build type:** Single-worker orchestrator session (orchestrator + executor)

### Addenda Read
- `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md` ← primary spec
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` ← Build J infrastructure
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` ← studio context
- `claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md` ← Q&A, scope locks

---

## Pre-Build Summary

### Q4 Proposal: Aggregation Display Layout

**One layout, three examples, no redesign needed across scales:**

The aggregation renders as a single subtitle line on the task card, between the task title and the action buttons. Format uses a middle dot (·) separator with natural number formatting:

```
[Build my app]
1 session · 15 min
[Worked on this today]    [Done]

[Build my app]
47 sessions · 32 hours
[Worked on this today]    [Done]

[Build my app]
273 sessions · 2,667 hours
[Worked on this today]    [Done]
```

**Duration formatting rules (single `formatDuration` helper):**
- 0 min (no duration logged): omit the duration portion entirely → "47 sessions"
- 1–59 min: "{n} min"
- 60–119 min: "1 hr {n} min"
- 120+ min: convert to hours, round to nearest whole hour → "{n} hours" with comma-separated thousands

**Count formatting:** singular "session" / plural "sessions", comma-separated thousands.

**When `track_duration` is off but `track_progress` is on:** subtitle shows count only → "47 sessions"

**Tap behavior:** Tapping the subtitle line expands a session history list below the card (or opens a detail modal on mobile if space is tight). Each history row shows: date, duration if logged, who did it.

**Why this works at all scales:** The subtitle is a single flex row with two text spans separated by " · ". Text wraps naturally if the card is narrow. Number formatting with commas handles thousands. The layout is identical whether the numbers are 1 or 2,667 — no conditional rendering branches.

**Mobile (≤640px):** Same layout, text-sm. If the two action buttons need to stack, they stack below the subtitle. The subtitle itself never wraps in practice (even "273 sessions · 2,667 hours" is ~30 characters).

---

### Q6 Proposal: Soft-Claim Cross-Claim Warning Copy

When a sibling taps "Worked on this today" on a task where another family member has the soft-claim:

**Modal title:** "Someone's already working on this"

**Body:** "[Name] has been putting in time on this. You can still log your work — it just means you're both working on it now.

**Buttons:**
- [Log my work] (primary) — proceeds to log the practice session, adds the caller as a secondary worker
- [Never mind] (secondary) — cancels, no state change

**When a sibling taps "Done" on a soft-claimed task they don't hold:**

**Modal title:** "Hold on"

**Body:** "[Name] has been doing the work on this one. Only [Name] or mom can mark it done."

**Button:**
- [Got it] — dismisses

**Why this tone:** Warm, not accusatory. Doesn't say "you can't" — says "here's who can." Matches the celebration-only, no-shame philosophy.

---

### PracticeSourceType Extension Cascade

**Current definition:** `src/types/tasks.ts:644`
```typescript
export type PracticeSourceType = 'sequential_task' | 'randomizer_item'
```

**Extends to:** `'sequential_task' | 'randomizer_item' | 'task' | 'routine_step'`

**Files that import/reference PracticeSourceType:**

| File | Lines | Change Required |
|---|---|---|
| `src/types/tasks.ts` | 644, 653, 669 | Extend type union |
| `src/hooks/usePractice.ts` | 25 (import), 69, 108, 261, 294, 441, 455, 576, 589, 623 | New conditional branches in 4 hooks |
| `src/pages/Tasks.tsx` | 798, 1591, 1614 | No change (hardcoded to 'sequential_task') |
| `src/pages/Lists.tsx` | 3025, 3052 | No change (hardcoded to 'randomizer_item') |
| `supabase/migrations/00000000100105` | 131-132 | CHECK constraint extension via new migration |

**Branching logic that needs new cases in `usePractice.ts`:**
1. `useLogPractice` (line 108): if/else on sourceType — needs `'task'` branch
2. `useSubmitMastery` (line 294): if/else — `'task'` branch not needed (no mastery on standalone tasks in this build)
3. `useApproveMasterySubmission` (line 455): if/else — same, no mastery on standalone tasks
4. `useRejectMasterySubmission` (line 589, 623): if/else — same

**Net: only `useLogPractice` gets a meaningful new branch for `'task'` source type.** The mastery hooks don't apply to standalone tasks (mastery is a sequential/randomizer concept). The `'routine_step'` source type flows through the existing `useCompleteRoutineStep` path in `useTaskCompletions.ts` (line 408) with a new practice_log write layered on top — it doesn't go through `useLogPractice` at all.

**Wait — clarification on `'routine_step'`:** For track-progress routine steps, the "Worked on this today" action needs to:
1. Write to `routine_step_completions` (existing path via `useCompleteRoutineStep`)
2. ALSO write to `practice_log` with `source_type='routine_step'` (new)
3. Optionally capture duration

This means the RoutineStepChecklist's `handleToggleStep` function gets a new code path for track-progress steps that calls BOTH the existing completion hook AND a new practice-log write. The `'routine_step'` source_type exists in the DB CHECK and the TypeScript union for this purpose.

---

### Generation Path Code Mapping (Paths A-G + unlisted)

#### Path A — Opportunity/Activity List Claim → Task
- **File:** `src/hooks/useOpportunityLists.ts:164`
- **Current state:** Already carries `track_duration` from `listItem.track_duration` (line 179). Does NOT carry `track_progress`.
- **Wire:** Add `track_progress: listItem.track_progress ?? list.default_track_progress ?? false` to the insert at line 164.
- **Soft-claim:** The claim itself is the implicit soft-claim — set `in_progress_member_id: memberId` in the same insert.

#### Path B — Sequential List Item via Linked Routine Step
- **File:** `src/components/tasks/RoutineStepChecklist.tsx` (rendering), `src/hooks/useTaskCompletions.ts:408` (completion)
- **Current state:** Daily check-off writes ONLY to `routine_step_completions`. Does NOT write to `practice_log`. Linked content resolves at render time via inline queries (lines 35-84 for sequential, 86-125 for randomizer).
- **Wire:** In `RoutineStepChecklist`, when a step resolves to a track-progress-enabled linked source, render "Worked on this today" button instead of simple checkbox. The handler calls BOTH `useCompleteRoutineStep` (existing) AND writes to `practice_log` with `source_type='routine_step'`.
- **Key:** The routine step check-off and the practice-log write are the SAME user action. One tap = both writes.

#### Path C — Promoted List Item → Task
- **File:** `src/hooks/useLists.ts:357` (promote to studio_queue), then `src/utils/createTaskFromData.ts:382/403` (actual task insert)
- **Current state:** Promotion routes through `studio_queue` with `destination='task'`. The studio_queue row carries `source_reference_id` (the list item ID). When the queue item is processed via `createTaskFromData`, it does NOT inherit track properties from the source list item.
- **Wire:** Two options:
  - (a) When inserting the studio_queue row, also store `track_progress` and `track_duration` in `content_details` JSONB.
  - (b) When `createTaskFromData` processes a queue item with `source='list_promoted'`, look up the source list item by `source_reference_id` and inherit.
  - **Recommend option (b)** — cleaner, doesn't require schema change on studio_queue.

#### Path D — List Deployed as Routine (Worker 4)
- **Not built yet.** Document inheritance rule for Worker 4 in feature decision file. Already documented.

#### Path E — Direct Task Creation (TaskCreationModal)
- **File:** `src/utils/createTaskFromData.ts:382` (multi-assignee), `:403` (single/shared)
- **Current state:** Neither `track_progress` nor `track_duration` are in the insert payload despite `track_duration` existing on the tasks table.
- **Wire:**
  - Add `track_progress` and `track_duration` to `CreateTaskData` interface in `src/types/tasks.ts`
  - Add toggles to `TaskCreationModal.tsx` in the Advanced options section
  - Write both fields in the insert at lines 382 and 403
  - Task Breaker subtasks (line 502): inherit from parent task's values

#### Path F — Rhythm-Created Task (Tomorrow Capture)
- **File:** `src/lib/rhythm/commitTomorrowCapture.ts:92-106`
- **Current state:** Creates tasks with `source='rhythm_priority'`, no track properties.
- **Wire:** The `commitTomorrowCapture` function receives items from `RhythmMetadataContext`. The EveningTomorrowCaptureSection component that stages items needs track-property toggles. When mom types "working on painting the kitchen" and toggles track_progress on, that flows through to the insert at line 92. Minimal UI: two small toggle chips below the text input.

#### Path G — MindSweep Sort → Task
- **File:** `src/lib/rhythm/commitMindSweepLite.ts:172-187`
- **Current state:** Creates tasks with `source='rhythm_mindsweep_lite'`, no track properties.
- **Wire:** The MindSweepLiteSection (and MindSweepLiteTeenSection) show per-item disposition overrides. For items with `disposition='task'`, add optional track-property toggles. When committed, pass through to the insert at line 172.

#### Unlisted Path K — Routine Duplication (Deploy Copy)
- **File:** `src/components/tasks/RoutineDuplicateDialog.tsx:165`
- **Current state:** Creates task with `source='template_deployed'`, no track properties.
- **Wire:** Inherit track properties from the source task being duplicated. Read from the source task row.
- **Scope:** Opportunistic — retrofit if touching this surface, else file as follow-up.

#### Unlisted Path L — Randomizer Spinner Widget → Task
- **File:** `src/components/widgets/trackers/RandomizerSpinnerTracker.tsx:106`
- **Current state:** Creates task with `source='randomizer_draw'`, no track properties.
- **Wire:** Inherit from the list item being assigned.
- **Scope:** Opportunistic — retrofit if touching this surface, else file as follow-up.

#### Tasks.tsx Quick-Create (line 200) and Bulk AI Add (line 226)
- These are PATH E variants (both create tasks directly in Tasks.tsx).
- Quick-create: title-only, no room for toggles. Default false/false. Mom edits later.
- Bulk AI add: batch insert from parsed text. Default false/false. Mom edits later.
- Both get false/false defaults from the migration. No toggle exposure needed.

---

### Sub-Task Sequence (dependency order)

| # | Sub-Task | Dependencies | Deliverables |
|---|---|---|---|
| 1 | Schema migration (100183) | None | New columns on tasks, lists, list_items. ALTER practice_log CHECK. |
| 2 | TypeScript types | Sub-task 1 | PracticeSourceType extended. CreateTaskData extended. Task/List interfaces updated. |
| 3 | Core hooks | Sub-task 2 | useLogPractice new 'task' branch. Aggregation query hook. Soft-claim on completion. |
| 4 | DurationPromptModal component | Sub-task 2 | 6 chips + custom + skip. Theme-tokened. All shells. |
| 5 | TaskCreationModal toggles + createTaskFromData wiring (Path E) | Sub-tasks 2, 3 | Toggles in Advanced section. Both fields written to insert. |
| 6 | List config UI (list-level defaults) | Sub-task 1 | default_track_progress toggle on list settings. |
| 7 | Path A + Path C inheritance | Sub-tasks 2, 5 | useOpportunityLists inherits track_progress. createTaskFromData inherits from source list item. |
| 8 | TaskCard — "Worked on this today" + aggregation display | Sub-tasks 3, 4 | New button, subtitle, session history. |
| 9 | Path B — RoutineStepChecklist "Worked on this today" | Sub-tasks 3, 4 | New handler for track-progress steps. Dual write (completion + practice_log). |
| 10 | Soft-claim UI (warning modal, completion gating, dashboard visibility) | Sub-tasks 3, 8 | Warning modal. Completion check. Dashboard query extension. |
| 11 | Path F + Path G toggles | Sub-tasks 2, 5 | commitTomorrowCapture + commitMindSweepLite carry track properties. |
| 12 | Feature keys + final verification | All above | Register keys. tsc -b. Visual verification. |

---

### Stubs (registered in STUB_REGISTRY)

1. **Inactivity-based auto-unclaim** — Schema tracks last session date via practice_log. No UI for mom-configurable timeout. Future enhancement.
2. **Cross-task time aggregation reports** — Per-task aggregation is in scope. Cross-task/cross-kid analytics deferred to PRD-28B.
3. **Paths H-J toggles** — If not touching LiLa acceptance, plan decomposition, or other capture surfaces in this build, filed as follow-up. Existing default behavior preserved (false/false).
4. **Paths K-L inheritance** — RoutineDuplicateDialog and RandomizerSpinnerTracker. Filed as follow-up unless touched.

---

### Mom-UI Surfaces

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells | Type |
|---|---|---|---|---|---|
| Task creation modal — toggles | ✅ verify | ✅ verify | ✅ verify | Mom | Modified |
| List creation/edit — toggles | ✅ verify | ✅ verify | ✅ verify | Mom | Modified |
| TaskCard — "Worked on this today" + aggregation | ✅ verify | ✅ verify | ✅ verify | Mom, Independent, Guided, Play | Modified |
| RoutineStepChecklist — "Worked on this today" | ✅ verify | ✅ verify | ✅ verify | Mom, Independent, Guided, Play | Modified |
| DurationPromptModal | ✅ verify | ✅ verify | ✅ verify | All | New |
| Soft-claim warning modal | ✅ verify | ✅ verify | ✅ verify | All | New |
| Session history expansion | ✅ verify | ✅ verify | ✅ verify | Mom, Independent | New |
| Dashboard — soft-claimed tasks | ✅ verify | ✅ verify | ✅ verify | All | Modified |
| Tasks page — "My Tasks" filter | ✅ verify | ✅ verify | ✅ verify | Mom, Independent | Modified |

## During-Build State Note

Between sub-tasks 3 (core hooks ship `in_progress_member_id` attribution) and sub-task 10 (soft-claim UI surfaces), the soft-claim behavior is **partial**: attribution writes exist in the database, but the warning modal and completion gating don't fire. Testing "what happens if a sibling tries to complete?" in that window will show incomplete behavior — that is expected, not a bug. Completion gating activates with sub-task 10.

## Workers 2+3 Inheritance Note

**Sequential collections and `track_progress`:** Sub-task 7 added `track_progress: false` as the explicit default for tasks generated by `useCreateSequentialCollection` (line 173) and inherits `track_progress` from source tasks when restarting a collection for another student (line 424 + select query at line 345). The `sequential_collections` table itself does NOT have a `default_track_progress` column — this is asymmetric with `default_track_duration` which exists from Build J. If Workers 2+3 or a future build needs collection-level `default_track_progress`, it requires a migration to add the column to `sequential_collections`. For now, sequential items inherit `track_progress` from their individual task rows (set at creation or via the restart copy), not from a collection default.

**Opportunity claim soft-claim:** Sub-task 7 wired Path A (`useOpportunityLists.ts`) to set `in_progress_member_id = memberId` at claim time when the claimed item resolves `track_progress = true`. This means the claimer is automatically the soft-claim holder. Workers 2+3's shared-task relaxation ("any active practicer") should be aware that opportunity claims already pre-set the holder — the sharing mode just needs to allow additional holders, not clear the first one.

## Founder-Approved Refinements

- **Q4 aggregation:** Comma formatting on BOTH numbers — sessions and hours. "1,247 sessions · 2,667 hours."
- **Q6 Done-blocking modal:** Split buttons: `[Ask Mom]  [Got it, never mind]` — give kids a path forward, not just a stop sign. "Ask Mom" creates a notification to mom (or fallback toast if notification type isn't wired yet).

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Task creation modal — track toggles | ⚠️ | ⚠️ | ⚠️ | | | |
| List creation/edit — default toggles | ⚠️ | ⚠️ | ⚠️ | | | |
| TaskCard — "Worked on this today" button | ⚠️ | ⚠️ | ⚠️ | | | |
| TaskCard — aggregation display | ⚠️ | ⚠️ | ⚠️ | | | |
| Personal Dashboard — soft-claim visibility | ⚠️ | ⚠️ | ⚠️ | | | |
| Tasks page — "My Tasks" filter includes soft-claimed | ⚠️ | ⚠️ | ⚠️ | | | |
| DurationPromptModal | ⚠️ | ⚠️ | ⚠️ | | | |
| RoutineStepChecklist — "Worked on this today" | ⚠️ | ⚠️ | ⚠️ | | | |
| Soft-claim warning modal (log work) | ⚠️ | ⚠️ | ⚠️ | | | |
| Soft-claim warning modal (Done blocked) | ⚠️ | ⚠️ | ⚠️ | | | |
| Session history detail | ⚠️ | ⚠️ | ⚠️ | | | |

*(Each row transitions from ⚠️ → ✅ as founder does eyes-on verification at checkpoints)*

---

## Baton-Pass Handoffs

*(Populated if baton-pass is needed mid-build)*
