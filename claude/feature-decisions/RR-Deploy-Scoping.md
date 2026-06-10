# RR-DEPLOY-SCOPING — Review & Route Direct Deploy + Task Assignment Scoping

> Build date: 2026-06-10 (single session, parallel with FO-COMMAND-CENTER — coordination file: `.claude/completed-builds/2026-06/COORDINATION-review-route-task-scoping.md` after archive)
> Convention: #276. Migrations: 100262, 100263, 100264.
> E2E pins: `tests/e2e/permissions/task-assignment-scoping.spec.ts` (8), `tests/e2e/features/review-route-direct-deploy.spec.ts` (1).

## Origin

Founder report: dad brain-dumped 11 items in Notepad → Review & Route classified all as tasks → he approved all 11 → every one landed in `studio_queue` requiring per-item TaskCreationModal configuration. Plus: the assignee picker showed the full family roster to every adult AND teen with zero enforcement (UI, RLS, or permission key) — teens could put tasks on mom's dashboard.

## Founder Decisions

| # | Decision |
|---|---|
| D1 | Direct-deploy on approve applies to EVERYONE including mom — the card-by-card review IS the HITM step; queue = unreviewed intake, never re-review. |
| D2 | Dad: self-only assignment + mom-grantable `task_assignment` (per-kid + family-wide, financial_tracking shape) — grantable version built in this pass. |
| D3 | Teens: self-only, flat. Cross-member wants → family_request "Ask someone". |
| D4 | Write-side tasks/lists RLS folded in; read-side deferred (Convention #39). |
| D5 | Family Overview hands-off (parallel FO-COMMAND-CENTER session owns it). |
| D6 | Members flesh out their own deployed tasks via existing edit flow; edit picker gets the same scoping (no reassignment back door). |
| D7 | "Let's just fix it all" (Phase 0 recon results): family-device write restoration folded into 100262; Review & Route which-list drill-down built (option 1). |
| D8 | Queue "Deploy all": we ship the engine (`deployQueueItem.ts`), FO-COMMAND-CENTER ships the button on their relocated SortTab (their ACK in coordination file). |

## Phase 0 Recon Findings

1. **Family-device write regression** (exposed by two-door 2026-06-09): true family-shadow sessions were RLS-blocked from task_completions / routine_step_completions / intention_iterations / family_intention_iterations / tasks / lists / list_items writes — pre-two-door hub devices rode mom's session. Fixed via `util.is_family_shadow_of()` additive policies. Comprehensive audit of remaining tables = filed follow-up.
2. Lists write RLS already correct (verify-only).
3. `tasks.source` CHECK: 'review_route' existed; 'mindsweep_auto' added (22 values).
4. Review & Route 'list' tile had no which-list picker → built via `dynamicSubOptions` on RoutingStrip.
5. Migration 100152 had ALREADY scoped task_assignments (ta_insert mom-or-self) — 100262's redundant ta policies were corrected by 100263 (one of them would have loosened the intentional admin-only ta_delete).

## Cross-Session Coordination (FO-COMMAND-CENTER)

- Q1 boundary: `task_assignment` = assigning NEW work; `viewableLevels` contribute+ = acting on EXISTING tasks. One authority per concern.
- We landed the scoped AssignmentSelector first; their Phase 4 (dad-scoped FO, commit `ab73021`) inherits it with zero work.
- Engine/button split for Queue Deploy All; their button sequenced on our shipped engine.
- Migrations: ours 100262-100264; theirs zero. Convention numbers: theirs #275, ours #276.

## Post-Build Verification

(Authoritative copy in the archived build file — 22 rows, zero Missing; summary:)

- **Wired (21):** R&R task/list direct deploy + summary toast + per-item isolation; calendar queue path preserved; MindSweep auto-route direct (task/list); `deployQueueItem()` shared engine; `task_assignment` key + `util.task_assign_allowed()` + `useAssignableMembers()`; 6 picker surfaces scoped (AssignmentSelector + TaskCreationModal internal; RoutineDeployModal, SequentialCreatorModal, GuidedFormAssignModal, ActivityListWizard; SharedTaskListWizard verified no task inserts); Permission Hub family-wide + per-kid rows; profile protection (apply_permission_profile); tasks/ta WITH CHECKs; tasks_update_assigned_member tightened; family-device write restoration (8 tables); 'mindsweep_auto' source; E2E 8+1 new + 24 regression green; tsc/lint clean.
- **Stubbed (1 + 2 follow-ups):** read-side RLS (pre-existing, unchanged); family-device write audit for remaining tables; FO Deploy-all button (their sequenced dependency).
- **Founder eyes-on pending:** which-list drill-down UI, Permission Hub rows, family-tablet kid dip-in (the regression fix), mobile/tablet viewports.

## Key Implementation Notes

- `deployQueueItem()` never throws — every outcome is a returned status (`deployed | queued | skipped | error`); batch callers get per-item isolation for free. Context-needing destinations are SKIPPED, never half-created.
- Task minimal row = MindSweep-Lite pattern: pending / priority 'next' / assignee = owner / source attributed.
- AssignmentSelector + TaskCreationModal scope INTERNALLY (mount = scoped); "Everyone" + "Whole Family" are mom-only.
- Binary grant semantics: any non-'none' level = allowed; 'manage' is the canonical on-value (BinaryGrantPicker).
- `viewable-member-grants` query-key invalidation added to per-kid Hub mutations so useAssignableMembers caches refresh.
