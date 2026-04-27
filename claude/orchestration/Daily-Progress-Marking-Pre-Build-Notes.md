# Daily Progress Marking — Pre-Build Notes (Orchestrator Output)

> **Created:** 2026-04-27 by orchestrator session during Workers 2+3 scoping detour
> **Status:** Founder-approved Q&A answers ready for worker consumption
> **Addendum:** `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md`
> **Paused work:** Workers 2+3 scoping preserved at `.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md`

---

## Open Questions — Founder Answers (approved 2026-04-27)

### Q1: Does `tasks.track_duration` already exist?

**YES.** Verified in `claude/live_schema.md`:
- `tasks.track_duration` — row 64
- `list_items.track_duration` — row 49
- `sequential_collections.default_track_duration` — row 19
- `lists.default_track_duration` — row 32

All shipped in Build J (migration 100105). **Only `track_progress` is new in this build.** Migration adds `track_progress` column only; `track_duration` is already wired.

### Q2: Soft-claim implementation

**Option B approved** — explicit `tasks.in_progress_member_id UUID NULL` column. Rationale: single column read vs N+1 subquery on every dashboard render. Worker must verify cleanup edge cases: re-attribution (mom changing completer) must update `in_progress_member_id` correctly; completion must clear it; re-opening a completed task must handle the column state.

### Q3: Routine step "Done" placement

**No harmonization needed.** Existing behavior (daily check-off in RoutineStepChecklist, mastery/completion in SequentialCollectionView) matches the addendum's design exactly.

### Q4: Aggregation display layout

**Worker proposes in pre-build summary.** Founder requirement: must work for BOTH ends of the range — "1 session · 15 min" must look as natural as "273 sessions · 2,667 hours." Design for both extremes, not just the impressive case.

### Q5: Duration prompt chip values

**Approved set:** `[5, 10, 15, 30, 45, 60]` minutes, plus Custom field, plus Skip option. Six chips fits on mobile. 5/10 min covers short kid-practice sessions (piano warm-up, reading).

### Q6: Soft-claim cross-claim warning copy

**Worker proposes in pre-build summary.** Standard review pattern — founder reviews before code.

---

## Schema Finding — CHECK Constraint on practice_log

**CRITICAL for migration:** `practice_log.source_type` has a DB-level CHECK constraint (migration 100105, line 131-132):

```sql
CHECK (source_type IN ('sequential_task','randomizer_item'))
```

This build's migration MUST ALTER this CHECK to add `'task'` and `'routine_step'`. This is NOT just application-layer validation — the DB will reject inserts with the new source types until the CHECK is extended.

Migration must be:
- Additive (existing rows with `sequential_task` and `randomizer_item` remain valid)
- Reversible (standard DROP + re-CREATE CHECK pattern)
- Tested: verify 0 existing rows violate the new CHECK before applying

Founder re-read and updated the addendum §5.1 to capture this explicitly. Worker must read the updated §5.1 before coding.

---

## Scope Decisions (locked)

### Paths A-G: mandatory in this build
- **Path A** — Opportunity/activity/browsable list claim → task: inherit track properties
- **Path B** — Sequential list item via linked routine step: resolve track properties from linked source
- **Path C** — Promoted list item → task: inherit track properties
- **Path D** — List deployed as routine (Worker 4): document inheritance rule for Worker 4
- **Path E** — Direct task creation: expose toggles in TaskCreationModal
- **Path F** — Rhythm-created task: expose toggles in creation modal
- **Path G** — MindSweep sort-to-task: expose toggles in sort UI

### Paths H-J: opportunistic
- **Path H** — LiLa-suggested tasks: retrofit IF worker touches acceptance surface; else stub
- **Path I** — Plan/goal decomposition → task: retrofit IF worker touches surface; else stub
- **Path J** — Other capture surfaces (voice, scan, AI Vault): retrofit IF touched; else stub
- All stubs filed in STUB_REGISTRY with follow-up note

### Soft-claim: Option B
- `tasks.in_progress_member_id UUID NULL` column
- Set on first practice session logged
- Cleared on completion
- Mom and task creator always override
- Sibling cross-claim: warning, not block

### Duration chips: [5, 10, 15, 30, 45, 60] + Custom + Skip

### Tier gating: all feature keys return true during beta (placeholder)

---

## Discovery Findings (from orchestrator session)

### What's already built (Build J — verified 2026-04-27)

| Capability | Schema | Backend | UI |
|---|---|---|---|
| `tasks.track_duration` | ✅ | ✅ (useLogPractice accepts durationMinutes) | ❌ (no UI prompts) |
| `practice_log` table | ✅ | ✅ | n/a |
| `useLogPractice` hook | ✅ | ✅ (sequential + randomizer) | ✅ (sequential TaskCard only) |
| `useSubmitMastery` hook | ✅ | ✅ | ✅ (sequential TaskCard only) |
| Mastery approval queue | ✅ | ✅ | ✅ (Tasks.tsx PendingApprovalsSection) |
| `tasks.kanban_status` with `in_progress` | ✅ | ✅ (set by Pomodoro) | ✅ (KanbanView) |
| Sequential task practice button | ✅ | ✅ | ✅ |
| List item practice button | ✅ | ✅ (hook supports it) | ❌ |
| OpportunitySettingsPanel advancement defaults | ✅ | ✅ | ✅ |
| SequentialCreator advancement mode picker | ✅ | ✅ | ✅ |

### What this build adds

- `tasks.track_progress` column (new)
- `tasks.in_progress_member_id` column (new — soft-claim)
- `lists.default_track_progress` column (new)
- `list_items.track_progress` column (new — NULL = inherit)
- `practice_log.source_type` CHECK extended to include `'task'` and `'routine_step'`
- "Worked on this today" button on TaskCard for track-progress tasks
- "Worked on this today" on RoutineStepChecklist for track-progress steps
- Duration prompt modal (6 chips + custom + skip)
- Aggregation display on task cards
- Soft-claim authorization on task completion
- Soft-claim visibility on claimer's dashboard
- Track property toggles on TaskCreationModal, list config, MindSweep sort, rhythm creation
- Inheritance resolution across Paths A-G
- Feature key registration (placeholder, all true during beta)

---

## Forward-Compat Note for Workers 2+3

When Workers 2+3 resumes after this build:
- `track_progress` flag exists on tasks
- "Worked on this today" UI exists
- `practice_log` accepts `'task'` and `'routine_step'`
- Soft-claim exists; shared mode relaxes "single holder" to "any active practicer"
- Workers 2+3 builds sharing awareness into soft-claim warning and completion check
- Per addendum §9: no conflict; sharing layers cleanly on top

---

## Bug Reports Adjacent to This Surface

From the 2026-04-27 triage (orchestrator session):
- `30102e19` + `cd02de88` — routines showing overdue past end date (routine lifecycle, folded into Workers 2+3 scope, NOT this build)
- `bed6e781` — Herringbone routine duplicate iterations (folded into Workers 2+3 scope, NOT this build)
- `bc0597ad` — rhythm-created task with no due date showing overdue (borderline for Workers 2+3; NOT this build)

None of these are in scope for Daily Progress Marking. They remain in the Workers 2+3 paused scope.
