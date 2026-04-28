# Feature Decision File: PRD-09A — Daily Progress Marking

> **Created:** 2026-04-27
> **PRD:** `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
> **Addenda read:**
>   - `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md` (primary spec)
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (Build J infrastructure)
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (studio/sequential context)
> **Pre-build notes:** `claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md`
> **Founder approved:** pending

---

## What Is Being Built

Adding the ability to mark "I worked on this today" on tasks and routine steps as a separate event from "this is done." Tasks that take many days (building an app, learning a skill, memorizing multiplication tables) get daily progress logging with optional duration capture. The UI shows session count and total time aggregated over weeks or months. A soft-claim system prevents one kid from swooping in to mark another kid's long-running task as Done.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| TaskCreationModal — track_progress + track_duration toggles | New form fields in Advanced options |
| List creation/edit — default_track_progress toggle | New list-level default |
| Per-item override in list item editor | track_progress on list_items (NULL = inherit) |
| TaskCard — "Worked on this today" button | New button for track_progress tasks |
| TaskCard — aggregation subtitle display | Session count + total duration |
| RoutineStepChecklist — "Worked on this today" | Replaces simple check for track-progress steps |
| DurationPromptModal | 6 chips + custom + skip |
| Soft-claim warning modal | Cross-claim attempt warning |
| Session history expansion/modal | Tap aggregation to see per-session list |
| Dashboard — soft-claim visibility | Soft-claimed tasks on claimer's dashboard |
| Tasks page — filter includes soft-claimed | Query extension for "My Tasks" |
| MindSweep sort — track toggles | New toggles in sort-to-task UI |
| Tomorrow Capture — track toggles | New toggles in rhythm creation |

---

## Key PRD Decisions (Easy to Miss)

1. `track_progress` and `track_duration` are independent booleans. All four combinations valid.
2. Default for both: **off**. Mom opts in per task.
3. Routine step "Worked on this today" IS the daily check-off. One tap = practice logged + step done for today.
4. "Done" for routine steps with linked sequential sources is in the list/collection view, not the routine view.
5. Soft-claim is NOT a hard lock — mom always overrides, siblings get a warning not a block.
6. Aggregation display must handle 4-digit hour totals without overflow.
7. Duration chips: [5, 10, 15, 30, 45, 60] + Custom + Skip.
8. `practice_log.source_type` CHECK constraint at DB level must be extended (not just app validation).
9. Universal inheritance rule: ANY task from ANY source must honor track property inheritance (§6.2).
10. Soft-claimed tasks must appear on claimer's dashboard and Tasks page (§4.5).

---

## Addendum Rulings

### From PRD-09A-Daily-Progress-Marking-Addendum.md:
- Model A confirmed: single "Worked on this today" button (§3.1)
- Option B for soft-claim: explicit `in_progress_member_id` column (§4.3, pre-build Q2)
- Paths A-G mandatory; H-J opportunistic (§6.6)
- Tier gating: placeholder, all true during beta (§10)
- Inactivity auto-unclaim: stubbed (§1.4)

### From Pre-Build Notes:
- Duration chips: [5, 10, 15, 30, 45, 60] (Q5)
- `tasks.track_duration` already exists — only `track_progress` is new (Q1)
- Routine step "Done" placement matches existing behavior — no harmonization (Q3)

---

## Database Changes Required

### New Columns (single migration 00000000100183)

| Table | Column | Type | Default | Notes |
|---|---|---|---|---|
| tasks | track_progress | BOOLEAN NOT NULL | false | New |
| tasks | in_progress_member_id | UUID NULL | — | FK → family_members, soft-claim |
| lists | default_track_progress | BOOLEAN NOT NULL | false | New |
| list_items | track_progress | BOOLEAN NULL | — | NULL = inherit from list |

### Modified Constraints

| Table | Change |
|---|---|
| practice_log | DROP + re-CREATE source_type CHECK to add 'task' and 'routine_step' |

### Migration Notes
- `tasks.track_duration` already exists (Build J migration 100105) — NOT re-added
- `list_items.track_duration` already exists — NOT re-added
- `lists.default_track_duration` already exists — NOT re-added
- CHECK change is additive — existing rows unaffected
- All new columns default to false/NULL — no behavioral change for existing data

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| task_progress_tracking | Essential | all | track_progress toggle |
| task_duration_tracking | Essential | all | track_duration toggle |
| task_session_history | Essential | all | Aggregation + history |
| task_soft_claim | Essential | all | Soft-claim + completion gating |

All return true during beta (placeholder).

---

## Stubs — Do NOT Build This Phase

- [ ] Inactivity-based auto-unclaim (mom-configurable timeout) — schema accommodates, UI doesn't surface
- [ ] Cross-task time aggregation reports (deferred to PRD-28B)
- [ ] Bulk-edit UI for track toggles (GAP-D — separate worker)
- [ ] List-item practice/mastery action buttons (GAP-A — separate worker)
- [ ] Path H (LiLa-suggested task acceptance) — unless surface is touched
- [ ] Path I (Plan/goal decomposition) — unless surface is touched
- [ ] Path J (Other capture surfaces) — unless surface is touched

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads list item track properties | ← | Lists (PRD-09B) | list_items.track_progress, lists.default_track_progress |
| Writes practice sessions | → | practice_log | source_type='task' or 'routine_step' |
| Extends useLogPractice | → | usePractice.ts | New branches for 'task' and 'routine_step' |
| Sets soft-claim | → | tasks.in_progress_member_id | On first practice log |
| Blocks completion | → | useCompleteTask | Soft-claim authorization check |
| Inherits from opportunity claim | ← | useOpportunityLists.ts | Path A track_progress inheritance |
| Surfaces on claimer dashboard | → | Dashboard queries | in_progress_member_id filter |

---

## Things That Connect Back to This Feature Later

- Workers 2+3 (Shared Routines + Lists) — sharing mode relaxes soft-claim to "any active practicer"
- PRD-24 (Gamification) — practice sessions on tasks should trigger gamification events
- PRD-28B (Compliance Reporting) — practice_log rows with duration feed compliance reports
- PRD-29 (BigPlans) — task decomposition should expose track toggles
- Worker 4 (Lists Template Deploy) — list-deployed routines must inherit track properties

---

## Unlisted Generation Paths Found (§6.6 requirement)

Two task-creation paths NOT enumerated in addendum §6.3 were found during codebase search:

1. **RoutineDuplicateDialog** (`src/components/tasks/RoutineDuplicateDialog.tsx:165`) — Creates a task row when duplicating a routine to another assignee. Source: `template_deployed`. Should inherit track properties from the source task being duplicated.

2. **RandomizerSpinnerTracker** (`src/components/widgets/trackers/RandomizerSpinnerTracker.tsx:106`) — Creates a task row when a randomizer widget assigns a drawn item. Source: `randomizer_draw`. Should inherit track properties from the list item.

Both follow the universal rule (§6.2) and will be filed as opportunistic retrofits alongside Paths H-J.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] Unlisted paths acknowledged
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build. Filled in during close-out.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
