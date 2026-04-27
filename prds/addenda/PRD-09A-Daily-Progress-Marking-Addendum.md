# PRD-09A Addendum: Daily Progress Marking on Tasks and Routine Steps

**Status:** Draft — created 2026-04-27 during Workers 2+3 scoping detour
**Scope:** Tasks (PRD-09A) + Routine Steps (linked to sequential collections via Linked-Steps-Mastery-Advancement-Addendum)
**Dependency:** Builds on existing `practice_log` + `task_completions` infrastructure shipped in Build J
**Blocks:** Workers 2+3 (Shared Routines + Shared Lists) inherit this work; sharing semantics layer on top of progress-marking cleanly
**Target build size:** Medium — probably one focused worker session of 2-3 days

---

## Plain English (What This Means For Tenise)

Right now, tasks and routine steps are binary: done or not done. That works for "make your bed" but breaks for "build my app" or "learn to tie shoes" — things that take many days, where each day's work matters but the overall thing isn't done. 

This addendum adds the ability to mark "I worked on this today" as a separate event from "this is done." Kids can show up and put in their daily 30 minutes on memorizing multiplication tables, and the routine recognizes that effort happened, even though the underlying skill isn't yet mastered. Optionally, time spent can be captured ("I worked on this for 25 minutes today"), aggregating into satisfying totals over weeks or months — for kids practicing piano over a year, for mom tracking how much time a long-running project actually took. The UI is designed to handle multi-thousand-hour totals because long projects accumulate quickly when you put in real daily work.

For routine steps, "Worked on this today" IS the daily check-off. Single tap, one action, but the daily work is logged and the underlying task progresses without being marked complete. When the underlying thing is genuinely done (skill mastered, app launched, project finished), a separate "Done" action completes it.

For the orchestration layer's first major architectural test post-launch, this is exactly the kind of build where planning-side review caught what execution-side discovery wouldn't have — a feature surface that mattered deeply but was invisible because the schema hid the gap.

---

## 1. Why This Addendum Exists

### 1.1 The Problem

Three real use cases from Tenise's family that don't work today:

1. **"Build my app"** — multi-month standalone task. No way to log daily work. No way to track total time spent. Just "in progress" or "done."

2. **Kid's school day routine** — includes "Memorize multiplication tables" as a routine step linked to a sequential mastery collection. Currently the kid taps "Done for the day" but there's no concept of "I worked on it for 20 minutes today" as a distinct event from "I mastered this set of facts." 

3. **"Learn to tie shoes"** — sequential skill that takes weeks of daily practice. Mom wants to see "Worked on it 14 times over 23 days" when the kid finally masters it.

The deeper friction Tenise stated in conversation: *"there are a LOT of days where I spend a LOT of time working on a project, but cannot mark it off because it isn't done."*

### 1.2 What's Already Built (Build J / Linked Steps Addendum)

Substantial infrastructure exists:

- **`practice_log` table** — captures individual practice sessions with `family_member_id`, `source_type`, `source_id`, optional `duration_minutes`, optional `evidence_url`/`evidence_note`, `period_date`. Currently scoped to `source_type IN ('sequential_task', 'randomizer_item')`.
- **`useLogPractice` hook** — backend logic to write practice records and increment counts.
- **`useSubmitMastery` hook** — backend logic for mastery submission.
- **`tasks.kanban_status`** with `in_progress` state — exists today, set by Pomodoro timer.
- **Sequential task UI** — full lifecycle (creation, practice button, mastery submission, approval queue, evidence display, dashboard subtitle) — already wired and working.

### 1.3 What's Missing (and what this addendum builds)

- **Per-task `track_progress` opt-in** — most tasks should not have daily-progress marking. Mom opts in per task at creation.
- **"Worked on this today" UI** for standalone tasks (TaskCard).
- **"Worked on this today" UI** for routine steps (RoutineStepChecklist) — replaces or augments the daily check-off when the linked source has progress tracking enabled.
- **Duration prompt UI** — appears when `track_duration` is enabled. Currently the backend accepts `durationMinutes` but no UI ever asks for it.
- **Aggregation display** — session count + total duration on the task card / detail view.
- **Soft-claim attribution** — when `track_progress` is enabled, the first kid to tap "worked on this" claims the in-progress state. Anti-poaching: someone else can't swoop in and check Done unless they're also a recognized worker on it.
- **Extended `practice_log.source_type`** — accepts `'task'` and `'routine_step'` in addition to existing values.

### 1.4 What This Addendum Does NOT Do

Captured here to prevent scope creep:

- **Generic "Universal Progress-Tracking"** for every kind of item (lists in practice/mastery mode, opportunity claims, etc.) — those use cases stay deferred. This addendum focuses on standalone tasks + routine steps because that's where the daily friction actually lives.
- **Bulk-edit UI for advancement properties (GAP-D)** — separate concern, separate worker.
- **List-item practice/mastery action UI (GAP-A)** — separate concern, separate worker. Lists with practice/mastery mode items remain in their current state.
- **Inactivity-based auto-unclaim** — stubbed for now (mom-configurable timeout). Schema accommodates it, UI doesn't surface it.
- **Mom's "review surface" for cross-task time analysis** — basic aggregation per task is in scope; cross-task / cross-kid analytics are not.

---

## 2. The Two-Toggle Model

The user-facing configuration is two independent boolean flags per task:

| `track_progress` | `track_duration` | Behavior |
|---|---|---|
| ❌ off | ❌ off | Standard task. Done / not done. (default for all existing tasks) |
| ✅ on | ❌ off | Daily-progress task. "Worked on this today" check-ins, no duration prompt. |
| ✅ on | ✅ on | Daily-progress task with duration. "Worked on this today" + "How long?" prompt. |
| ❌ off | ✅ on | Single-completion task with duration. "How long did this take?" prompt on completion only. |

All four combinations are valid. The schema treats them as independent.

### 2.1 Mom's Creation UI

When mom creates or edits a task:

```
Task: [Build my app]
Description: [...]

Advanced options:
☐ Track progress (multi-day)     ← new
☐ Track duration                  ← may already exist; verify and surface
```

Default for both: off. Most tasks stay simple. Mom opts in for the ones that matter.

### 2.2 Worker Verification

Worker should verify whether `tasks.track_duration` already exists as a column. If yes, surface it in the UI. If only `list_items.track_duration` exists, add `tasks.track_duration` in this build.

Either way, both columns are independent of each other.

---

## 3. Daily-Action UX (Model A — Confirmed)

### 3.1 The Confirmed Mental Model

For a track-progress-enabled task or routine step, the user-facing action is **single-button "Worked on this today."** This is Model A (confirmed in design conversation 2026-04-27).

- One tap → routine step done for today (routine progress increments)
- Same tap → practice session logged in `practice_log`
- Same tap (if `track_duration` enabled) → prompt: "How long?" → duration captured
- Underlying task does NOT advance/complete — that requires a separate "Done" action

### 3.2 The Two Buttons (Where They Appear)

For a track-progress-enabled standalone task:

```
[Build my app]
Description: ...

[Worked on this today]    ← daily action; logs practice
[Done]                    ← completion action; closes the task
```

For a track-progress-enabled routine step (linked or standalone):

```
RoutineStepChecklist:
  ✅ Make bed
  ✅ Brush teeth  
  ⏳ Memorize multiplication tables  [Worked on this today]    ← daily action
  ⏳ Tie shoes practice              [Worked on this today]
```

The "Done" action for routine steps that link to underlying sequential items appears in the **list/sequential-collection view, not the routine view.** This matches how the existing system works — kids practice via the routine, but "completion/mastery" of the underlying skill happens in the list view (per Linked Steps Addendum decision 9: "Direct list access for progress marking").

### 3.3 Duration Prompt UI

When the user taps "Worked on this today" on a task/step where `track_duration = true`:

```
How long did you work on this?

[15 min]  [30 min]  [45 min]  [1 hour]
[Custom: ___ minutes]
[Skip]
```

- Pre-set chips for fast tapping (kid-friendly)
- Custom field for precise entry
- Skip option (logs the session without duration)
- After tap: writes to `practice_log.duration_minutes`, marks step done for today

### 3.4 Aggregation Display

For track-progress-enabled tasks, the task card shows aggregated state. Example layout (numbers are illustrative — UI must handle four-digit hour totals):

```
[Build my app]
Working on this since: April 27, 2026
Sessions: 273 days
Total time: 2,667 hours
[Worked on this today]    [Done]
```

Tap "Sessions: 273 days" → expand to session history list (date, duration if logged).

For routine steps linked to track-progress sequential items, the dashboard task card already shows progress subtitle (per Linked Steps Addendum). Extend with duration aggregate when available:

```
Memorize multiplication tables
Practiced: 23 sessions, 8.5 hours total, current set: 6×7
[Worked on this today]
```

---

## 4. Soft-Claim Semantics

### 4.1 What Soft-Claim Solves

The "anti-poaching" use case from Tenise: *"if it is a job one, and my son works on it for 3 days, and my daughter runs in and finishes up the final steps and marks it as done after he did the majority of the work, that wouldn't be cool."*

Soft-claim addresses this for track-progress-enabled tasks: when someone has been logging progress, they have implicit ownership of the task's "in progress" state. Marking "Done" requires either being the soft-claim holder OR being mom (override).

### 4.2 How It Works

When the first practice session is logged on a track-progress-enabled task:

- `practice_log` row written with `family_member_id = X`
- `tasks.kanban_status` set to `'in_progress'`
- Implicit soft-claim: family member X is now "working on this"
- Task card shows: "X is working on this"

Subsequent sessions by family member X: just log additional practice. No state change.

If a different family member Y attempts to log a session: 
- Allowed if mom or task creator. Worker decides per-permission UX.
- If a sibling: warning surface — "X is working on this. Continue anyway?" If yes, log session under Y; soft-claim now ambiguous (multi-worker). For shared tasks (post-Workers 2+3), this is normal expected behavior.

If anyone attempts "Done":
- Allowed if: mom, the task creator (if mom-created tasks have an explicit recipient), OR the soft-claim holder.
- Blocked otherwise: "Only [holder] or mom can mark this complete. Want to ask them?"

### 4.3 Soft-Claim Attribution Storage

Schema choice (worker may refine):

- **Option A:** Compute soft-claim from `practice_log` (whoever has the most recent session, or whoever has any session, depending on semantics). No new column.
- **Option B:** Add `tasks.in_progress_member_id UUID` set when first session is logged, cleared on completion. Explicit.

Worker should pick based on schema simplicity. Option B is more explicit but adds a column. Option A reuses existing data but requires query logic. Either is acceptable; flag in pre-build summary.

### 4.4 What Soft-Claim Does NOT Do

- It is NOT a hard lock. Mom can always override. Other family members can join with warning.
- It does NOT prevent assignment from also having other workers (shared tasks via Workers 2+3 layer cleanly: shared tasks can have multiple soft-claim holders, one per active practicer).
- It does NOT auto-expire on inactivity (that's stubbed; future enhancement).

### 4.5 Soft-Claim Visibility on Claimer's Dashboard

Critical behavior — soft-claim must be VISIBLE to the claimer so they don't forget what they're working on.

When a family member becomes the soft-claim holder on a task (by logging the first practice session, or by being explicitly assigned via Path A opportunity claim, etc.), that task must appear on their:

- **Personal dashboard** — a "currently working on" or "in progress" widget/section
- **Tasks page** — visible in their task list with appropriate filtering ("My Tasks" includes soft-claimed tasks where they are the holder)
- **Anywhere else they review their own queue** — the Universal Queue (PRD-17) should treat soft-claimed tasks as queue-eligible for the holder

Implementation note: this is mostly query-layer work. The existing dashboard / tasks queries already filter by member; they need to extend the "tasks for this member" predicate to include "tasks where this member has logged practice sessions" (Option A) or "tasks where in_progress_member_id = this member" (Option B).

For Path A (opportunity claims): the existing claim→task bridge already creates a `tasks` row that should appear on the claimer's dashboard via existing patterns. Verify this still works for track-progress-enabled opportunity items.

For direct task creation: when mom creates a track-progress task and assigns it to a kid, the assignment is the implicit initial soft-claim. The task appears on the kid's dashboard via existing assignee-based queries. When the kid logs first practice, the soft-claim "activates" for completion-gating purposes but the visibility is already there from assignment.

For self-assigned soft-claim (kid logs practice on a task without explicit assignment): the task starts appearing on their dashboard from that moment. They don't need to assign it to themselves — practicing IS the assignment.

---

## 5. Schema Changes

### 5.1 New / Extended Columns

```sql
-- on tasks (track_duration already exists per Build J — verified):
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS track_progress BOOLEAN NOT NULL DEFAULT false;

-- on lists (for list-level defaults that propagate to generated tasks):
ALTER TABLE lists ADD COLUMN IF NOT EXISTS default_track_progress BOOLEAN NOT NULL DEFAULT false;
-- list_items.track_duration already exists per Build J — verified
-- consider list_items.track_progress for per-item override on lists:
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS track_progress BOOLEAN NULL;
-- (NULL on list_items means "inherit from list default"; explicit true/false overrides)

-- on tasks (Option B for soft-claim — confirmed by founder):
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS in_progress_member_id UUID NULL REFERENCES family_members(id);
-- Set on first practice session, cleared on completion. Re-attribution updates the column.

-- practice_log.source_type CHECK constraint extension (CRITICAL):
-- The column is TEXT but has a CHECK constraint limiting it to ('sequential_task', 'randomizer_item').
-- The migration MUST ALTER the CHECK to also accept 'task' and 'routine_step'.
ALTER TABLE practice_log DROP CONSTRAINT practice_log_source_type_check;
ALTER TABLE practice_log ADD CONSTRAINT practice_log_source_type_check
  CHECK (source_type IN ('sequential_task', 'randomizer_item', 'task', 'routine_step'));
-- Existing rows unaffected (additive change).
-- Down-migration: restore the original CHECK, but verify no rows have the new values first.
```

**Verified during second-pass discovery (2026-04-27):**
- `tasks.track_duration` already exists (Build J) ✓
- `list_items.track_duration` already exists (Build J) ✓
- `lists.default_track_duration` already exists (Build J) ✓
- `sequential_collections.default_track_duration` already exists (Build J) ✓
- `practice_log.source_type` has CHECK constraint requiring ALTER for new values ⚠️

### 5.2 Migration

Existing tasks: `track_progress` and `track_duration` default to `false`. No behavior change for any existing task.

Existing lists: `default_track_progress` defaults to `false`. No behavior change.

`practice_log.source_type` extension is additive — existing rows keep their values.

### 5.3 RLS Policies

Inherit existing policies. Family-scoped reads/writes. No new policy work expected.

---

## 6. Task Inheritance — Universal Rule (Critical)

### 6.1 Why This Section Exists

A large fraction of dashboard tasks aren't created directly through the task creation modal — they're generated from list items, captured from MindSweep, decomposed from BigPlans, surfaced by LiLa, parsed from voice notes, scanned from cookbooks, and created via every other capture/generation pathway in the app. If generated tasks don't inherit `track_progress` and `track_duration` from their source, the feature is broken at exactly the surfaces that matter most: school activity lists, opportunity lists, browsable activity lists, sequential collections, multi-day projects captured anywhere.

This section establishes a **universal inheritance rule** that applies to ANY task, regardless of what kind of source generated it.

### 6.2 The Universal Rule

**ANY task generated from ANY source — list, capture surface, AI suggestion, voice parse, scan, plan decomposition, or any other origin — MUST honor the following inheritance contract:**

- If the source has `track_progress` and `track_duration` properties (whether explicit or inherited from a parent like a list-level default), the generated task inherits them
- If the source has no track properties of its own, the generated task is created with sensible defaults (typically `false`/`false`) BUT mom can opt in at any capture/generation surface where it makes sense

**This applies to every source type that exists today and every source type that may ship in the future:**

**List-based sources:**
- Opportunity lists (browsable, claim-to-task)
- Activity lists (browsable, pick-and-do)
- Sequential lists (work through in order)
- Randomizer lists (system or kid draws)
- Checklist lists (regular)
- Shared lists (any of the above with multiple participants)
- Reading lists (Studio template — sequential with mastery defaults)
- Mastery / practice-count lists (advancement-mode-enabled)
- School activity lists (specific use case driving this addendum)
- Any list type defined in PRD-09B or future PRD addenda
- Lists deployed as routines (via Worker 4 LISTS-TEMPLATE-DEPLOY when it ships)

**Non-list capture / generation sources:**
- MindSweep captures → tasks
- ThoughtSift Decision Guide outputs → action items → tasks
- LiLa conversation suggestions accepted by mom → tasks
- Voice notes / brain dumps parsed into tasks
- Email or message imports → tasks (future)
- Goals from LifeLantern / Guiding Stars / Best Intentions that generate tasks
- BigPlans milestones decomposed into tasks
- Calendar event creation flows that spawn tasks
- Cookbook scanning that creates prep tasks
- AI Vault tools that generate to-dos
- Rhythm-created tasks (evening "thinking about for tomorrow" pattern)
- Routine-step → task promotion paths
- Any future capture or generation surface

**The rule:** wherever a task is created, the creation path must either:
1. Inherit track properties from a source that has them, OR
2. Provide mom (or the relevant actor) the ability to set track properties at creation time, OR
3. Default to `false`/`false` with documented rationale for why this surface doesn't expose the toggle

**Worker mandate:** The inheritance rule is universal. If you find a task-generation surface not enumerated below in §6.3, the rule still applies. Propagate properties from source where applicable, expose toggles where appropriate, surface any generation surface where compliance is unclear as an open question for me before code.

### 6.3 The Known Generation Paths

Documented explicitly so the worker has concrete code paths to verify. **This list is illustrative, not exhaustive — the universal rule in §6.2 governs.**

#### Path A — Opportunity / Activity / Browsable List Claim → Task

Existing pattern (per opportunity-list-unification-plan): kid browses an opportunity or activity list, claims an item → row inserted into `tasks` with `source = 'opportunity_list_claim'` (or equivalent) and `status = 'in_progress'`.

This path includes: opportunity lists, activity lists, any browsable list where a kid picks an item to do.

**Inheritance rule:**
- If source `list_items.track_progress` is true (or NULL with `lists.default_track_progress` true): generated task gets `track_progress = true`
- If source `list_items.track_duration` is true (or NULL with list default true): generated task gets `track_duration = true`
- The claim itself acts as the implicit soft-claim — the claimer is the in-progress holder from the moment of claim
- Generated task immediately appears on claimer's dashboard (existing behavior; soft-claim visibility per §4.5)

**Specific call-out (founder-flagged):** Browsable activity / opportunity lists are exactly the surface where this matters most. A kid browses "School Activities for Today," claims "Practice piano," and that task lands on their dashboard with `track_progress = true` and `track_duration = true` inherited from the source. They tap "Worked on this today" in the routine or on the dashboard, get the duration prompt, log 30 minutes, and the session aggregates over time.

#### Path B — Sequential List Item via Linked Routine Step

Existing pattern (per Linked Steps Addendum): routine step has `step_type = 'linked_sequential'`, resolves at render time to the kid's current sequential item. Daily routine action is "practice" on the linked source.

**Inheritance rule:**
- The routine step itself doesn't generate a `tasks` row (it resolves at render time to the linked source). The "Worked on this today" action targets the routine step + linked sequential item together.
- If source sequential item has `track_progress = true` (or sequential collection default), the routine step renders "Worked on this today" instead of the simple daily check
- `practice_log` writes with `source_type = 'sequential_task'` (existing behavior — no source_type change)
- Duration prompt fires if `track_duration` is true on either the sequential item or the collection default

#### Path C — Promoted List Item → Task

Existing column `list_items.promoted_to_task` + `list_items.promoted_task_id`. When promotion happens, a `tasks` row is created from the list item.

**Inheritance rule:**
- Generated task inherits `track_progress` from list item (or list default)
- Generated task inherits `track_duration` from list item (or list default)
- Promotion preserves source_id link so aggregations can be computed across the original list item AND the promoted task if needed

#### Path D — List Deployed as Routine (Worker 4 territory)

Future pattern via Worker 4 LISTS-TEMPLATE-DEPLOY: a list template is deployed as a routine, generating routine steps from list items.

**Inheritance rule:**
- Generated routine steps inherit `track_progress` from source list_items
- Worker 4 must respect this when it ships
- Documented here to prevent Worker 4 from accidentally stripping the inheritance

#### Path E — Direct Task Creation (no source)

Standard task creation path. Mom creates a task in the task creation modal.

**Inheritance rule:**
- Mom sets `track_progress` and `track_duration` directly via the toggles (per §3.1)
- No inheritance — this is a primary input path

#### Path F — Routine-Created Task (rhythm thinking-about, etc.)

Existing pattern: evening rhythm "thinking about for tomorrow" creates a `tasks` row.

**Inheritance rule:**
- These tasks default to `track_progress = false` and `track_duration = false`
- The rhythm-creation modal SHOULD expose track property toggles so mom can opt in when she's capturing something multi-day-worthy ("started thinking about painting the kitchen — that's a multi-week project")
- Future enhancement: rhythm templates could carry default progress-tracking properties; the modal-toggle approach is sufficient for v1

#### Path G — MindSweep Capture → Task (per PRD-17B)

Existing pattern: MindSweep captures get sorted into tasks (among other destinations).

**Inheritance rule:**
- Captured tasks default to `track_progress = false` and `track_duration = false`
- The MindSweep sort interface SHOULD expose track property toggles when sorting a capture into a task, so mom can opt in if the captured thought represents a multi-day project
- Worker should add the toggles to the sort UI; minimal additional work given the universal pattern

#### Path H — LiLa-Suggested Tasks

Pattern: LiLa suggests tasks during conversation; mom accepts and they're created.

**Inheritance rule:**
- LiLa-suggested tasks default to `track_progress = false` and `track_duration = false`
- The acceptance/confirmation surface SHOULD expose toggles when mom is reviewing the suggestion
- LiLa SHOULD heuristically suggest enabling track properties when the suggested task description implies multi-day work ("set up your business" vs "buy milk")
- Worker should wire the acceptance surface to expose toggles; LiLa heuristic is a future enhancement

#### Path I — Plan / Goal Decomposition → Task

Pattern: BigPlans milestones, LifeLantern goals, Guiding Stars, Best Intentions all generate tasks via various flows.

**Inheritance rule:**
- Decomposed tasks inherit track properties from the parent plan/goal if the plan has them
- If parent has no track properties (likely for v1), decomposed tasks default to false/false
- The decomposition / generation surface SHOULD expose toggles so mom can opt in
- Future: plans/goals could carry default track properties; deferred to those features' own roadmap

#### Path J — Other Capture Surfaces (voice, scan, import, AI Vault, etc.)

Pattern: Various surfaces capture content and generate tasks (cookbook scan, voice brain dump, future email/message import, AI Vault tools).

**Inheritance rule:**
- All such surfaces follow the same principle: default to false/false, but expose toggles where the capture surface allows
- When the capture surface doesn't naturally have a "edit before save" step (e.g., quick voice capture that goes straight to MindSweep), the captured task gets defaults; mom can edit later from the task itself
- Worker should propagate the principle to any capture surface touched in this build; surfaces not touched in this build can be retrofitted in their own future work

### 6.4 The Inheritance Resolution Function

A helper function resolves track-progress properties for any task-type item. Pseudocode:

```typescript
function resolveTrackingProperties(item: Task | ListItem | RoutineStep | CaptureSource): {
  track_progress: boolean,
  track_duration: boolean
} {
  // Direct properties win if explicitly set
  if (item.track_progress !== null && item.track_progress !== undefined) {
    return { track_progress: item.track_progress, track_duration: item.track_duration ?? false }
  }
  
  // For list_items with NULL track_progress, inherit from list
  if ('list_id' in item) {
    const list = getListById(item.list_id)
    return {
      track_progress: list.default_track_progress ?? false,
      track_duration: item.track_duration ?? list.default_track_duration ?? false
    }
  }
  
  // For other source types (MindSweep, LiLa suggestions, plan decomposition, etc.):
  // resolve from source's own track properties if it has them, else default false/false
  // Specific resolution logic per source type, called from each generation path
  
  return { track_progress: false, track_duration: false }
}
```

Worker may implement this as a database function, a service-layer function, or a hook helper — implementer's call. The function should be **single-source-of-truth** for resolution, called from every task-generation path so the universal rule (§6.2) is enforced consistently.

### 6.5 Mom-Side UI — Setting Defaults at the List Level

Per §3.1 task creation UI, individual tasks have toggles. For lists:

```
List: [School Activities for Mosiah]
Description: ...

List defaults (apply to new items added to this list, and to tasks generated from this list):
☐ Items track daily progress         ← new
☐ Items track time spent              ← may exist on list_items already; surface at list level

Per-item overrides available in item editor.
```

For non-list capture surfaces (Paths F-J), the corresponding sort/acceptance/decomposition UI exposes the same two toggles inline at the moment of task creation. Worker should wire each surface uniformly so mom encounters a consistent pattern: "when you create a task from anything, you can mark it as a multi-day track-progress task right there."

Per the GAP-D bulk-edit pattern (separate worker scope), mom will eventually be able to bulk-edit these properties across many items. For now (this addendum), per-item override happens in the individual item editor.

### 6.6 Worker Verification Step

During pre-build, the worker should map each known path (A-J in §6.3) to specific code paths in the codebase:

- Path A: search for opportunity / activity / browsable list claim → task creation (likely `useClaimOpportunity`, `useClaimActivity`, or similar — could be multiple hooks for different list flavors)
- Path B: search for routine step rendering with linked source resolution
- Path C: search for `promoted_to_task` write paths
- Path D: confirm Worker 4's planned scope respects this section
- Path E: task creation modal
- Path F: rhythm-created task generation
- Path G: MindSweep sort-to-task path
- Path H: LiLa task-suggestion acceptance surface
- Path I: BigPlans / LifeLantern / Guiding Stars / Best Intentions task generation paths
- Path J: voice-parse, cookbook-scan, AI-Vault, and other capture-to-task paths the codebase contains

For each, verify (or implement) the inheritance behavior. Surface any path where inheritance can't be cleanly implemented as an open question for me before code.

**Additional verification:** If during code search the worker discovers a task-generation path NOT enumerated in §6.3, surface it explicitly. The universal rule (§6.2) applies, but I want visibility on any path I didn't anticipate.

**Scope guard for this build:** The worker should retrofit Paths A-G in this build (the highest-traffic and most critical surfaces). Paths H-J should be retrofitted *if* the worker is already touching those surfaces for other reasons; if not, they're filed as follow-up work and stubbed (the surface still creates tasks, but the toggles are not yet exposed; existing default behavior preserved). Worker decides scope based on surface area and surfaces the call in the pre-build summary for my approval.

---

```sql
-- on tasks (verify whether track_duration exists; add if not):
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS track_progress BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS track_duration BOOLEAN NOT NULL DEFAULT false;

-- on tasks (Option B for soft-claim — worker decides):
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS in_progress_member_id UUID NULL REFERENCES family_members(id);

-- practice_log.source_type extension:
-- The column is TEXT, not enum. No schema change needed.
-- The CHECK constraint or application-layer validation needs to accept 'task' and 'routine_step' as valid values.
```

---

## 7. Hook Extensions

### 7.1 `useLogPractice` (extend existing)

Currently accepts `source_type` of `'sequential_task'` or `'randomizer_item'`. Extend to accept `'task'` and `'routine_step'`.

When called with `source_type = 'task'`:
- Write row to `practice_log` with task's id as `source_id`
- If `tasks.track_duration` and duration provided, log duration
- Set `tasks.kanban_status = 'in_progress'` if not already
- Set `tasks.in_progress_member_id = caller's id` (Option B) or leave to query (Option A)
- Ensure task appears on caller's dashboard / tasks list (per §4.5 — soft-claim visibility)

When called with `source_type = 'routine_step'`:
- Write row to `practice_log` with the step's id as `source_id`
- If linked source exists (sequential collection), also fire any existing linked-source advancement logic per Linked Steps Addendum (don't break existing behavior)
- Mark routine step done for today (existing routine_step_completion path)
- If `track_duration` and duration provided, log duration

### 7.2 New: `useCompleteTaskWithSoftClaim`

Wraps existing `useCompleteTask`. Adds soft-claim authorization check before completion:

- If caller is mom or task creator: proceed
- Else if caller has soft-claim (most recent session OR `in_progress_member_id` matches): proceed
- Else: return error with prompt to override or message claim holder

Worker may merge this into existing `useCompleteTask` rather than create a new hook — implementer's call.

### 7.3 Aggregation Query

New helper (or extension of existing): given a task id, return:
- `total_sessions: integer` (count of `practice_log` rows for this source)
- `total_duration_minutes: integer | null` (sum, null if no sessions logged duration)
- `first_session_date: date`
- `last_session_date: date`
- Optionally: array of session records for history view

Used by task card to render the aggregation display from §3.4.

---

## 8. UI Surfaces — Mom-UI Verification

### 8.1 Surfaces Touched

| Surface | Desktop ≥1024 | Tablet ~768 | Mobile ≤640 | Shells | Notes |
|---|---|---|---|---|---|
| Task creation modal — `track_progress` and `track_duration` toggles | ✅ | ✅ | ✅ | Mom | New form fields |
| List creation/edit — `default_track_progress` and `default_track_duration` toggles | ✅ | ✅ | ✅ | Mom | New form fields on list-level config |
| TaskCard — "Worked on this today" button | ✅ | ✅ | ✅ | Mom, Independent, Guided, Play | New button rendering |
| TaskCard — aggregation display | ✅ | ✅ | ✅ | Mom, Independent | Subtitle / detail expansion |
| Personal Dashboard — "currently working on" / soft-claim visibility | ✅ | ✅ | ✅ | Mom, Independent, Guided, Play | Soft-claimed tasks appear on claimer's dashboard |
| Tasks page — "My Tasks" filter includes soft-claimed | ✅ | ✅ | ✅ | Mom, Independent | Query-layer extension |
| Duration prompt modal | ✅ | ✅ | ✅ | All shells with task action | New modal |
| RoutineStepChecklist — "Worked on this today" | ✅ | ✅ | ✅ | Mom, Independent, Guided, Play | New button on linked or track-progress-enabled steps |
| Soft-claim warning modal | ✅ | ✅ | ✅ | All | New modal for cross-claim attempts |
| Session history detail | ✅ | ✅ | ✅ | Mom, Independent | New expansion / modal |

### 8.2 Verification Approach

Per the orchestration layer's Mom-UI Verification Protocol — eyes-on confirmation by Tenise across desktop, tablet, and mobile breakpoints. Specifically test:

- Track-progress task on desktop: full layout, both buttons visible
- Track-progress task on mobile: buttons stack appropriately, both reachable
- Duration prompt: chips fit on mobile without overflow
- Routine step "Worked on this today" tap area: large enough on mobile for kid-friendly tapping
- Aggregation display: four-digit hour totals don't overflow card layout

---

## 9. Sharing-Mode Interaction (Forward-Compat for Workers 2+3)

When Workers 2+3 ship shared tasks/routines, they inherit this addendum's progress-marking infrastructure cleanly:

### 9.1 Shared Task with Track-Progress Enabled

- Multiple family members can log practice sessions
- Each session attributes to the actual logger's `member_id` (already correct in `useLogPractice`)
- Soft-claim becomes multi-holder: each active practicer is implicitly working on it
- Aggregation display shows per-member breakdown: "Mosiah: 12 sessions / 4.5 hours, Helam: 8 sessions / 3 hours"
- "Done" requires mom OR a soft-claim holder (any of the active workers)

### 9.2 Shared Routine Step with Linked Sequential Item

- Same as today's shared routine step model (per Workers 2+3 decisions)
- "Worked on this today" attributes to the actual practicer
- The linked sequential item's `practice_count` increments when ANY shared participant practices
- This is correct: shared = collective progress on the underlying skill

### 9.3 What Workers 2+3 Need to Know

When Workers 2+3 dispatches:

- The `track_progress` flag exists on tasks
- "Worked on this today" UI exists on TaskCard and RoutineStepChecklist
- `practice_log` accepts `'task'` and `'routine_step'` as `source_type`
- Soft-claim attribution exists; shared mode just relaxes "single holder" to "any active practicer"

Workers 2+3 build sharing mode awareness into the soft-claim warning ("X is also working on this") and the completion check (allow any active practicer to mark Done in shared mode).

---

## 10. Tier Gating (Placeholder — Not Hardcoded for Beta)

Per `useCanAccess()` pattern. **All feature keys return `true` during beta** — tier gating is structurally registered but not enforced. The tier values below represent intended future enforcement; today they are placeholders only.

| Feature Key | Description | Tier |
|---|---|---|
| `task_progress_tracking` | track_progress option on tasks | Essential |
| `task_duration_tracking` | track_duration option on tasks | Essential |
| `task_session_history` | Aggregation display + session history view | Essential |
| `task_soft_claim` | Soft-claim attribution + completion gating | Essential |

All Essential because this is foundational personal task management — not a premium feature. **All features return true during beta — tier gating is registered for future use, not enforced today.** Worker should wire `useCanAccess()` hooks per existing convention without enforcement logic.

---

## 11. CLAUDE.md Additions from This Addendum

- [ ] `tasks.track_progress` enables daily-progress marking. When true, tasks render "Worked on this today" button in addition to "Done." Practice sessions log to `practice_log` with `source_type='task'`.
- [ ] `tasks.track_duration` independent of `track_progress`. When true, completion or daily-progress action prompts for duration; result stored in `practice_log.duration_minutes`.
- [ ] `practice_log.source_type` accepts `'task'` and `'routine_step'` in addition to existing `'sequential_task'` and `'randomizer_item'` values.
- [ ] Routine step "Worked on this today" replaces daily check-off when the step is track-progress-enabled (Model A). Single tap = practice logged + step done for today + no underlying task advancement.
- [ ] Soft-claim on track-progress tasks: first practicer becomes implicit "in-progress" holder. Completion requires mom, task creator, or a soft-claim holder. Schema implementation TBD by worker (compute from practice_log OR explicit `in_progress_member_id` column).
- [ ] Aggregation display on track-progress tasks shows session count + total duration. Tap to expand session history.

---

## 12. What "Done" Looks Like

### 12.1 MVP (Must Have)

- [ ] `tasks.track_progress` column exists and defaults to false
- [ ] `tasks.track_duration` column exists (verify or add) and defaults to false
- [ ] `lists.default_track_progress` column exists and defaults to false
- [ ] `list_items.track_progress` column exists (NULL = inherit from list, true/false = explicit override)
- [ ] Task creation/edit UI exposes both toggles
- [ ] List creation/edit UI exposes list-level default toggles
- [ ] Per-item override available in list item editor
- [ ] List-generated tasks (Paths A, C) inherit track properties from source at generation time
- [ ] Routine steps with linked sequential sources (Path B) resolve track properties from the linked source
- [ ] Rhythm-created tasks (Path F) creation modal exposes track property toggles
- [ ] MindSweep sort-to-task (Path G) exposes track property toggles when sorting capture into a task
- [ ] TaskCard renders "Worked on this today" button for track-progress tasks
- [ ] TaskCard renders aggregation display for track-progress tasks
- [ ] Soft-claimed tasks appear on claimer's dashboard and Tasks page (per §4.5)
- [ ] RoutineStepChecklist renders "Worked on this today" for track-progress steps and linked steps to track-progress sequential items
- [ ] Duration prompt modal renders when `track_duration = true` on the action target
- [ ] `useLogPractice` extended to accept `'task'` and `'routine_step'` source types
- [ ] Soft-claim authorization check on task completion
- [ ] Session history detail view (modal or expansion)
- [ ] Mom-UI verified across desktop / tablet / mobile in all relevant shells
- [ ] All `useCanAccess()` hooks wired with feature keys; all return true during beta (placeholder, not enforced)
- [ ] LiLa-suggested task acceptance (Path H), plan/goal decomposition (Path I), and other capture surfaces (Path J) — retrofit if surface is touched in this build; otherwise file as follow-up work and stub (existing default behavior preserved, no regression)

### 12.2 Stubbed

- [ ] Inactivity-based auto-unclaim — schema accommodates (track last session date), UI does not surface mom-configurable timeout. Documented in STUB_REGISTRY.
- [ ] Cross-task time aggregation reports — beyond per-task aggregation; documented as future PRD topic for compliance reporting.

### 12.3 Out of Scope

- [ ] Bulk-edit UI for track_progress / track_duration toggles across multiple tasks (GAP-D scope)
- [ ] Practice/mastery on lists in non-opportunity, non-randomizer modes (GAP-A scope)
- [ ] Universal generalization to opportunity claims, regular list items, etc.

---

## 13. Open Questions for Worker to Surface

These should be flagged in pre-build summary, not silently decided:

1. **`tasks.track_duration` already exists?** Verify schema. If yes, this addendum just adds `track_progress` + UI. If no, both columns are added in this build.

2. **Soft-claim Option A vs B?** Worker decides based on schema simplicity:
   - Option A: compute from `practice_log` (no new column, query logic)
   - Option B: explicit `tasks.in_progress_member_id` column (more straightforward, one extra column)

3. **Routine step "Done" placement.** Per §3.2, the "Done" action for linked routine steps appears in the list/sequential-collection view, not the routine. Verify this matches existing Linked Steps behavior; if existing behavior differs, propose harmonization.

4. **Aggregation display layout.** The text rendering of "47 sessions / 312 hours" on a task card needs to fit across desktop and mobile. Worker should propose layout in pre-build summary; mom (Tenise) reviews before code.

5. **Duration prompt chip values.** Default chips: 15/30/45/60 min. Worker should propose with rationale; consider whether "5 min" / "10 min" make sense for short kid-practice sessions.

6. **Soft-claim cross-claim warning copy.** "[X] is working on this. Continue anyway?" Worker proposes; founder reviews.

---

## 14. Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|---|---|---|
| PRD-09A (Tasks-Routines-Opportunities) | New per-task `track_progress` flag, new "Worked on this today" UI, soft-claim semantics on task completion | Update PRD-09A with addendum reference |
| PRD-09B (Lists-Studio-Templates) | List-level `default_track_progress` flag; list_items inherit; all list-to-task paths propagate per §6.3 Path A/C/D | Update PRD-09B with reference; ensure all current and future list types honor inheritance |
| PRD-11 (Victory Recorder) | "Worked on this for [N] days totaling [X] hours, then completed" is a natural victory candidate for track-progress task completion | Forward note: extend victory auto-suggestion logic when track-progress task completes |
| PRD-14 (Personal Dashboard) | Track-progress tasks may want a dedicated widget showing "currently working on" + aggregations; soft-claim visibility per §4.5 also affects dashboard task queries | Forward note: new widget type candidate; dashboard query extension required |
| PRD-17 (Universal Queue) | Soft-claimed tasks should be queue-eligible for the holder | Update queue routing to include soft-claim-held tasks |
| PRD-17B (MindSweep) | Sort-to-task path should expose track property toggles per §6.3 Path G | Update MindSweep sort UI to expose toggles |
| PRD-24 (Gamification) | Practice sessions on tasks should trigger gamification events the same way sequential-item practice does today | Forward note: extend point-event triggers for `source_type='task'` |
| PRD-28B (Compliance & Progress Reporting) | `practice_log` rows for tasks (especially with duration) feed compliance reporting cleanly. "Student worked on Math project for 4.5 hours over 8 sessions" is exactly what SDS reports want. | Forward note: extend report queries to include `source_type='task'` rows |
| PRD-29 (BigPlans) | Plan/goal decomposition into tasks should expose track property toggles per §6.3 Path I | Forward note: BigPlans task-generation surface to expose toggles |
| PRD-34 (ThoughtSift) | Decision Guide outputs that become tasks should expose track property toggles | Forward note: extend conversion-to-task surfaces |
| PRD-05 (LiLa Core) | LiLa-suggested tasks acceptance surface should expose track property toggles per §6.3 Path H; LiLa heuristic for suggesting toggles based on description is future work | Update LiLa task-acceptance UI |
| Workers 2+3 (Shared Routines + Lists, in flight) | Sharing inherits soft-claim and progress marking cleanly per §9 | Workers 2+3 dispatch prompt should reference this addendum and §9 specifically |

---

## 15. Decisions Made This Session

| # | Decision | Rationale |
|---|---|---|
| 1 | **Two independent toggles: `track_progress` + `track_duration`** | Matches real use cases — some daily-progress tasks need duration capture, some don't. Composable. |
| 2 | **Default for both: off** | Most tasks are simple done/not-done. Mom opts in for the few that need progress tracking. |
| 3 | **Model A: single "Worked on this today" button on routine steps** | Single tap is cleaner UX. Daily check-off and progress logging are the same event. Reduces cognitive load. |
| 4 | **Per-task opt-in, not per-list or per-routine** | Granularity matches mental model. A school routine has SOME track-progress steps and SOME standard steps. |
| 5 | **Routine step "Done" in list/collection view, not routine view** | Matches existing Linked Steps Addendum behavior (Decision 9). Don't force two completion paths in the routine UI. |
| 6 | **Soft-claim, not hard lock** | Real families have shared work. Don't block siblings; warn them. Mom always overrides. |
| 7 | **Soft-claim implementation TBD by worker (Option A or B)** | Both are acceptable; worker has best view of schema simplicity. |
| 8 | **Soft-claimed tasks visible on claimer's dashboard and tasks page** | Otherwise the soft-claim is invisible — claimer forgets they're working on something. Visibility is the whole point. |
| 9 | **Inactivity-based auto-unclaim stubbed** | Real need but small and bounded; stubbing now keeps scope tight. Future enhancement. |
| 10 | **Aggregation display per-task is in scope; cross-task analytics deferred** | Compliance reports already cover cross-task aggregation via PRD-28B. Don't duplicate. |
| 11 | **`practice_log.source_type` extension is additive, not migration** | TEXT column accepts new values; existing rows unaffected. Application validation extends. |
| 12 | **Forward-compat with Workers 2+3 sharing-mode** | Soft-claim relaxes to "any active practicer" in shared mode. No conflict; sharing layers cleanly on top. |
| 13 | **Universal inheritance rule: ANY task generated from ANY source must honor the inheritance contract** | Without this, the feature is broken at the highest-traffic surfaces. The rule applies to list-based generation paths (opportunity, activity, sequential, randomizer, checklist, shared, reading, mastery, school activity, future list types) AND non-list capture paths (MindSweep, ThoughtSift, LiLa suggestions, voice/scan, plan/goal decomposition, AI Vault tools, rhythm-created, future capture surfaces). Ten known generation paths enumerated for worker verification, but the rule governs all paths including ones not yet enumerated. Worker scope guard: retrofit Paths A-G in this build (highest-traffic); H-J retrofitted opportunistically or filed as follow-up. |
| 14 | **Tier gating registered as placeholder, all return true during beta** | Don't hardcode tier enforcement now; structure for future tier rollout. Per founder direction 2026-04-27. |
| 15 | **Aggregation display must accommodate multi-thousand-hour totals** | Real long-running projects can accumulate thousands of hours. UI layout must handle 4-digit hour totals without overflow on any device size. Don't design for hundreds of hours; design for thousands. |

---

*End of PRD-09A Addendum: Daily Progress Marking on Tasks and Routine Steps*
