# Universal Capability Parity — Stage 1 + Stage 2

## Status: STAGE 2 COMPLETE

**Started:** 2026-04-30
**Stage 2 completed:** 2026-04-30
**PRDs:** PRD-09A, PRD-09B, PRD-28 (cross-cutting)
**Feature decision files:** Universal-Capability-Parity-Principle.md, Composed-View-Surfaces-and-Wishlists.md, Master-Plans.md
**Discovery reports:** claude/web-sync/Universal-Capability-Parity-Discovery-Report.md, claude/web-sync/Universal-Capability-Parity-Discovery-Report-2.md
**Paused build reference:** .claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md

## Stage 1 Scope (Complete)

### Migrations
1. **100187** — `instantiation_mode` TEXT column + `collaboration_mode` TEXT column on `tasks` and `lists`. Backfill from JSONB. CHECK constraints (extensible TEXT, not Postgres enum).
2. **100188** — `life_area_tag` → `life_area_tags` (TEXT[]) on `tasks`, `task_templates`, `victories`, `sequential_collections`. Add `life_area_tags TEXT[]` to `list_items`. GIN indexes. Backfill single values to single-element arrays.
3. **100189** — `list_items.url` → `list_items.resource_url` rename. `list_templates.default_items` JSONB key rename.
4. **100190** — `calculate_allowance_progress` + `check_day_completion` RPCs: actual-completer fix (credit `task_completions.family_member_id` instead of `tasks.assignee_id`).

### Resolver Functions (new files in src/lib/tasks/)
- resolveRewardProperties.ts
- resolveAllowanceProperties.ts
- resolveHomeworkProperties.ts
- resolveCategorizationProperties.ts
- resolveAccessProperties.ts

### Creation Path Wiring (10 paths)
Each path updated to call appropriate resolvers per R4 audit table.

### TypeScript Type Updates
- Task.life_area_tag → Task.life_area_tags: LifeAreaTag[]
- Task + instantiation_mode, collaboration_mode top-level fields
- ListItem.url → ListItem.resource_url
- List + instantiation_mode, collaboration_mode top-level fields
- SchedulerOutput.instantiation_mode removed (reads from task/list column)

## Stage 2 Scope (Complete)

### Worker A — Step Rendering + Shared Completion UX (commit 5bcb920)
- Routine step notes, photo requirement, instance_count, resource_url linkify
- Shared completion: member-color badges, "done by [Name]", SharedWithHeader

### Worker B — Opportunity Attributes + Soft-Claim (commit b074639)
- Per-item attribute badges (reward, claim lock, advancement mode)
- Soft-claim visibility on track_progress tasks

### Worker C — Victory Pipeline (commit bc91506)
- Victory-on-completion wired through 4 paths: useCompleteTask, useApproveTaskCompletion, useApproveCompletion, useApproveMasterySubmission

### Worker E — Allowance E2E + Close-Out
- Cosmetic `total_tasks_assigned` fix in `calculate-allowance-period` Edge Function (includes `task_assignments` for shared tasks)
- E2E pipeline verification (see below)
- `require_note` stub documented in STUB_REGISTRY.md

## Locked Decisions (from founder sign-off)
- DQ1: Subtasks do NOT inherit allowance/homework/victory. DO inherit tracking + categorization.
- DQ2: Quick-capture paths (H, I) stay bare. No resolver changes needed.
- DQ3: Routine deploy (Path E) snapshots ALL capability fields at deploy time.
- DQ4: Randomizer spinner (Path F) gets full capability inheritance like Path A.
- DQ5: Sequential track_progress inherits from collection defaults (fix hardcoded false).
- DQ6: Template capability edits follow Now/Next cycle rules (capability = structural-equivalent = defaults to Next cycle).
- DQ7: instantiation_mode JSONB dropped immediately in single commit (option a).
- D1: TEXT with CHECK constraint for instantiation_mode and collaboration_mode.
- D2: Existing is_shared=true rows backfilled to collaboration_mode='solo_claim'.
- D3: life_area_tags backfill now (trivial data volume).
- D4: list_templates.default_items JSONB url→resource_url included in migration.

## E2E Allowance Attribution Verification

Pipeline trace confirms end-to-end correctness:

1. **Task completion insert** (`useCompleteTask` — useTasks.ts:407-412): `task_completions.family_member_id = memberId` (actual completer from UI)
2. **Period calculation trigger** (`calculate-allowance-period` Edge Function): Calls `calculate_allowance_progress` RPC with `p_member_id = period.family_member_id`
3. **RPC numerator** (migration 100190, line 221-226): `SELECT EXISTS (SELECT 1 FROM task_completions tc WHERE tc.task_id = v_task.id AND tc.family_member_id = p_member_id AND ...)` — credits the actual completer, not the primary assignee
4. **RPC denominator** (migration 100190, line 196-208): Widened cursor includes `task_assignments` via LEFT JOIN, so shared tasks appear in the pool for all assigned members
5. **Display count** (Edge Function fix, this commit): `total_tasks_assigned` now includes both `tasks.assignee_id` and `task_assignments.member_id` (deduplicated via `.neq('tasks.assignee_id', period.family_member_id)`)
6. **Financial transaction write** (Edge Function line 383-402): `family_member_id: period.family_member_id`, amount from RPC calculation

**Remaining gap:** None in the allowance attribution pipeline. The only deferred item is `require_note` on `task_template_steps` (stub in STUB_REGISTRY.md).

## Post-Build Verification Table — Stage 2

| # | Scope Item | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Routine step notes rendering | **Wired** | Commit 5bcb920 |
| 2 | Routine step photo requirement indicator | **Wired** | Commit 5bcb920 |
| 3 | Routine step instance_count multi-instance display | **Wired** | Commit 5bcb920 |
| 4 | Step/list item resource_url linkify | **Wired** | Commit 5bcb920 |
| 5 | Shared completion: member-color badges | **Wired** | Commit 5bcb920 |
| 6 | Shared completion: "done by [Name]" attribution | **Wired** | Commit 5bcb920 |
| 7 | SharedWithHeader component | **Wired** | Commit 5bcb920 |
| 8 | Per-item attribute badges (opportunity items) | **Wired** | Commit b074639 |
| 9 | Soft-claim visibility on track_progress tasks | **Wired** | Commit b074639 |
| 10 | Victory pipeline: useCompleteTask path | **Wired** | Commit bc91506 |
| 11 | Victory pipeline: useApproveTaskCompletion path | **Wired** | Commit bc91506 |
| 12 | Victory pipeline: useApproveCompletion path | **Wired** | Commit bc91506 |
| 13 | Victory pipeline: useApproveMasterySubmission path | **Wired** | Commit bc91506 |
| 14 | Allowance total_tasks_assigned cosmetic fix + E2E verification | **Wired** | This commit (Worker E) |
| — | `require_note` per-step toggle | **Stubbed** | STUB_REGISTRY.md — column does not exist, deferred |

**Result: 14 Wired, 1 Stubbed, 0 Missing.**

## Mom-UI Verification

Stage 2 touches UI surfaces. Founder eyes-on verification needed for:

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Routine step notes/photo/instance_count rendering | Pending | Pending | Pending | Mom, Adult, Independent, Guided | — | — |
| Shared completion "done by [Name]" + member colors | Pending | Pending | Pending | Mom, Adult, Independent, Guided | — | — |
| SharedWithHeader on shared tasks | Pending | Pending | Pending | Mom, Adult, Independent | — | — |
| Opportunity per-item attribute badges | Pending | Pending | Pending | Mom, Adult, Independent | — | — |
| Soft-claim "In progress by [Name]" badge | Pending | Pending | Pending | Mom, Adult, Independent, Guided, Play | — | — |

Backend-only items (no UI verification needed): allowance Edge Function fix, victory pipeline hooks.

## Post-Phase Checklist
- [x] tsc -b clean
- [x] All creation paths produce tasks with correct capability set (Stage 1)
- [x] Migrations applied and verified (Stage 1: 100187-100190)
- [ ] live_schema.md regenerated (run `npm run schema:dump` after Edge Function deploy)
- [x] STUB_REGISTRY.md updated (require_note stub added)
- [x] WIRING_STATUS.md updated (Stage 2 entries added)
- [x] BUILD_STATUS.md updated (Stage 2 complete with date)
