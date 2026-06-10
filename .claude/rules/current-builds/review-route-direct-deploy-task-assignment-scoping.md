# Active Build: Review & Route Direct Deploy + Task Assignment Scoping (RR-DEPLOY-SCOPING)

## Status: BUILD COMPLETE — awaiting founder verification + sign-off (2026-06-10)

## Post-Build Verification (Part A)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Review & Route task cards deploy directly on approve (assigned to routing user, source='review_route') | **Wired** | E2E `review-route-direct-deploy.spec.ts` 1/1 — 2 tasks created, 0 queue rows |
| 2 | Review & Route list cards deploy into chosen list (which-list drill-down) / shopping fallback / queue fallback | **Wired** | `dynamicSubOptions` on RoutingStrip + engine; drill-down UI = founder eyes-on |
| 3 | Calendar (and archives/recipe/message/track/agenda/optimizer) keep the queue path | **Wired** | E2E — calendar item landed in studio_queue |
| 4 | Confirmation summary toast after Route All ("N tasks added · N sent to your Queue") + per-item toasts | **Wired** | E2E asserts both toast strings |
| 5 | Per-item failure isolation (one failure never blocks the rest; failed items stay pending; error toast) | **Wired** | handleRouteAll try/catch tally + engine never-throws contract |
| 6 | MindSweep auto-route: task/list direct deploy when aggressiveness fires; always_ask/queue path unchanged | **Wired** | `useMindSweep.ts` routeDirectly via engine; autopilot E2E not automated (AI call) — code-reviewed, founder eyes-on optional |
| 7 | Shared deploy engine `deployQueueItem()` exported for FO "Deploy all" button | **Wired** | `src/lib/queue/deployQueueItem.ts`; FO ACK'd signature in coordination file |
| 8 | `task_assignment` key registered + keyWiringStatus 'active' + feature_access_v2 + profile protection | **Wired** | Migrations 100262/100264; `apply_permission_profile` exclusion lists |
| 9 | `util.task_assign_allowed()` grant resolution (per-kid wins incl. 'none'; family-wide covers future kids) | **Wired** | E2E RLS probes 4 + 5 |
| 10 | `useAssignableMembers()` single frontend authority, View-As aware | **Wired** | `src/hooks/useAssignableMembers.ts` |
| 11 | AssignmentSelector internally scoped; Whole Family checkbox mom-only | **Wired** | Internal `useAssignableMembers` + isMom gate |
| 12 | TaskCreationModal pills scoped, create AND edit modes; Everyone pill mom-only | **Wired** | E2E UI tests 6/7/8 (dad self-only; granted dad +kid; mom full+Everyone) |
| 13 | RoutineDeployModal / SequentialCreatorModal / GuidedFormAssignModal / ActivityListWizard deploy targets scoped | **Wired** | Code; SharedTaskListWizard verified NO task inserts (no scoping needed) |
| 14 | Permission Hub: family-wide "Assign tasks to kids" row (binary Off/Allowed) + per-kid row with inheritance note | **Wired** | PermissionHub.tsx; founder eyes-on pending |
| 15 | tasks INSERT/UPDATE WITH CHECK on assignee targeting; ungranted dad + teen blocked at DB | **Wired** | E2E RLS probes 1/2/3 (production DB) |
| 16 | task_assignments: granted INSERT path; 100152 scoped set preserved (no loosening — 100263 corrective) | **Wired** | Migration 100263; pg_policies = 6 |
| 17 | tasks_update_assigned_member WITH CHECK tightened (no assignee redirect via shared-task path) | **Wired** | Migration 100262 |
| 18 | Family-device write restoration: tasks, task_assignments, task_completions, routine_step_completions, intention_iterations, family_intention_iterations, lists, list_items | **Wired** | `util.is_family_shadow_of()` additive policies; founder eyes-on (kid dip-in on family tablet) recommended |
| 19 | 'mindsweep_auto' added to tasks_source_check (22 values) | **Wired** | Migration 100262 |
| 20 | Read-side tasks/lists RLS | **Stubbed** (unchanged) | Convention #39 migration point — explicitly out of scope |
| 21 | E2E: 8/8 scoping + 1/1 direct deploy + 24/24 regression (leak-pass + permissions-wiring); tsc -b clean; lint 0 errors | **Wired** | Run 2026-06-10 |
| 22 | Mobile/desktop nav parity | N/A | No new top-level pages |

**Zero Missing.** Stubs: read-side RLS (pre-existing, unchanged); comprehensive family-device write audit for remaining tables (journal/victories/widgets/practice_log/messages) filed as follow-up; FO Queue "Deploy all" button = FO-COMMAND-CENTER sequenced dependency (their verification table).

### Phase 0 recon results (2026-06-10) + founder rulings

1. **⚠️ Family-device write regression (pre-existing, exposed by two-door 2026-06-09):** true family-shadow sessions (role='family' member row) are BLOCKED by RLS from task_completions INSERT (`tc_insert_adult_or_self`, migration 100119), routine_step_completions INSERT (`rsc_insert_adult_or_self`), intention_iterations INSERT (`ii_insert_own`), and tasks INSERT (`tasks_manage_adults`). Pre-two-door, hub devices rested on mom's session which passed as adult. **Founder ruling: fold the fix into migration 100262** — family-shadow sessions get family-scoped write on those tables; kid identity enforced at app layer (documented Convention #39 limitation, same trust model as before, now explicit).
2. **Lists write RLS already correct** (`lists_owner_or_parent`, `li_via_list`) — non-mom cannot write to unowned/unshared lists nor create lists owned by others. Verify-only; no lists migration work.
3. **tasks.source CHECK** (migration 100232): `'review_route'` already valid; `'mindsweep_auto'` must be added in 100262.
4. **Review & Route 'list' tile has no sub-picker** (RoutingStrip line 80, no subOptions; items queue with structure_flag=null). **Founder ruling: build the which-list drill-down** (RoutingStrip subOptions pattern) → direct insert into chosen list; no pick → queue fallback.
5. **Picker inventory (Phase 2 sweep list):** TaskCreationModal (+AssignmentSelector), RoutineDeployModal (`src/components/templates/RoutineDeployModal.tsx:83`), SequentialCreatorModal (`:53`), GuidedFormAssignModal (prop-fed `eligibleChildren` — scope at callers), ActivityListWizard + SharedTaskListWizard (via MemberPillSelector).

> Origin: founder report 2026-06-10 — dad brain-dumped 11 items in Notepad, Review & Route classified all as tasks, he approved all 11, and they landed in `studio_queue` requiring per-item modal configuration instead of becoming his tasks. Investigation also found the task assignee picker shows the full family roster to every adult AND teen with zero enforcement at UI, RLS, or permission-key layer (teens can put tasks on mom's dashboard today).
>
> Build type: feature-surface session (not PRD-driven). Cross-session coordination with FO-COMMAND-CENTER complete — see `COORDINATION-review-route-task-scoping.md` (all 5 questions answered; we land first; their Phase 4 depends on our scoped AssignmentSelector).

## Source material read

- Investigation: full trace of NotepadReviewRoute.tsx, useMindSweep.ts, commitMindSweepLite.ts, createTaskFromData.ts, TaskCreationModal.tsx, AssignmentSelector.tsx, QuickCreate.tsx, tasks/lists RLS (migrations 000008, 000026, 100140, 100147, 100153), keyWiringStatus.ts, useViewableMembers.ts
- Conventions: #66 (queue = decision inbox), #4 (HITM), #271 (obligations), #273 (two-door auth), #274 (grant machinery), #39 (per-member-auth migration point), #257 (no client-side DATE writes)
- Completed builds: permissions-wiring.md (grant shape + `util.finance_grant_level` pattern), role-scoping-leak-pass
- WIRING_STATUS.md ("Tasks/Lists RLS hardening — Stub" entry)
- Coordination file: `COORDINATION-review-route-task-scoping.md` (FO-COMMAND-CENTER answers Q1–Q5)

## Founder decisions (2026-06-10, this session)

| # | Decision |
|---|---|
| D1 | **Direct-deploy on approve applies to EVERYONE including mom.** The Review & Route card-by-card approval IS the Human-in-the-Mix step. The queue is for unreviewed intake, never re-review. |
| D2 | **Dad (additional_adult): self-only assignment by default + NEW mom-grantable "can assign tasks to kids" permission, built in this pass** (per-kid + family-wide rows, financial_tracking shape). |
| D3 | **Teens (independent): self-only, flat.** Cross-member wants go through the existing family_request "Ask someone" path. |
| D4 | **Write-side tasks/lists RLS folded into this pass. Read-side RLS stays deferred** (Convention #39 migration point — unchanged). |
| D5 | **Family Overview page is hands-off in this session** — owned by parallel FO-COMMAND-CENTER build. |
| D6 | Members can flesh out their own direct-deployed tasks afterward via the existing Tasks page edit flow (verified working — they are creator AND assignee). Edit mode must get the same scoped picker so edit can't become a reassignment back door. |

## Build scope — four pieces

### Piece 1 — Direct deploy on approve (Review & Route + main MindSweep)

**Review & Route** (`src/components/notepad/NotepadReviewRoute.tsx` — the `handleRouteItem` switch at ~line 53):

- `tasks`/`task` destination: replace the `studio_queue` insert with a direct `tasks` INSERT using the proven MindSweep-Lite minimal-row pattern (`commitMindSweepLite.ts:173-191`): `title` = extracted content, `task_type='task'`, `status='pending'`, `priority='next'`, `assignee_id` = routing user, `created_by` = routing user, `source='review_route'`, `source_reference_id` = extracted item id. Mark `notepad_extracted_items` routed with the created task id.
- `list` destination: direct `list_items` INSERT into the chosen/matching list, mirroring the MindSweep-Lite list branch (`commitMindSweepLite.ts:366-393`) including its fallback: if no target list resolves, fall back to `studio_queue` (never silently drop).
- `calendar`, `track`, `message`, `agenda`, `optimizer` and unknown destinations: **unchanged — still queue.** Calendar legitimately needs date parsing + approval in CalendarTab.
- Per-item try/catch with partial-failure honesty (commitMindSweepLite pattern): one failed item never blocks the rest; failures surface, never swallow.
- **Post-deploy confirmation:** after Route All / per-item routing, show a summary toast/banner — e.g. "11 tasks added to your Tasks page" — so the user knows exactly where things went. No more silent disappearance into a queue.

**Main MindSweep** (`src/hooks/useMindSweep.ts` — `routeDirectly`, ~lines 344-481):

- Currently task/list/calendar/agenda ALWAYS queue even when `shouldAutoRoute()` is true (lines 352-365). Change: when auto-route fires, `task` → direct task insert (same minimal row, `source='mindsweep_auto'`), `list` → direct list_items insert with the same fallback-to-queue. `calendar`/`agenda` stay queued.
- The `queueForReview()` path (always_ask aggressiveness, low confidence, always_review_rules) is **unchanged** — the queue keeps its role for genuinely unreviewed/uncertain intake.
- Rhythm MindSweep-Lite: already correct, untouched.

**Shared deploy engine (founder addition 2026-06-10):** extract the direct-deploy writer into a reusable utility — `src/lib/queue/deployQueueItem.ts` (working name): takes a queue-item-shaped record `{destination, content, owner_id, structure_flag, source, source_reference_id}` and creates the record at its destination with sensible defaults (task → minimal task row assigned to owner; list → list_items with fallback; per-item try/catch honesty). Review & Route and MindSweep auto-route call it directly. **FO-COMMAND-CENTER will wire a "Deploy all" button on their relocated Queue surface that calls the same utility** (founder-requested — today the Sort tab only has per-batch step-through modals; only CalendarTab has Approve All). We own the engine; they own the button. Logged in the coordination file.

### Piece 2 — Assignee scoping (UI layer, invisibility-first)

- **New permission key `task_assignment`** registered in `feature_key_registry`; `keyWiringStatus.ts` entry → `'active'`.
- **Grant shape** (mirrors `financial_tracking` from PERMISSIONS-WIRING / Convention #274): `member_permissions` rows, `granted_to` = adult, `target_member_id` = kid or NULL (family-wide covering future kids), per-kid row ALWAYS wins over family-wide (including a per-kid 'none' carve-out). Resolution helper `util.task_assign_allowed(p_grantee, p_assignee)` (SECURITY DEFINER) — single resolution authority shared by RLS and frontend mirror.
- **New hook `useAssignableMembers()`** (`src/hooks/useAssignableMembers.ts`): mom → all active in-nest members; additional_adult → self + granted kids; independent/guided/play → self only. TS mirror of the SQL helper's resolution.
- **Picker sweep** — every task-deploy assignee surface consumes `useAssignableMembers()` instead of raw `useFamilyMembers()`:
  - `TaskCreationModal.tsx` (`assignableMembers`, ~line 1164) — create AND edit modes (D6)
  - `AssignmentSelector.tsx` (~line 61)
  - Studio deploy flows that pick assignees (RoutineDeployModal, SequentialCreatorModal, GuidedFormAssignModal) — recon will confirm the exact list; any picker feeding `tasks.assignee_id`/`task_assignments` gets scoped
  - "Everyone" pill renders only when 2+ members are assignable
- **Permission Hub**: new "Task assignment" grant row in Family Management (family-wide picker + per-kid inheritance note — exact financial_tracking UI pattern). Hub honesty: key ships 'active' because it IS enforced in this same pass.
- **What this looks like per role:** mom sees no change anywhere. Dad/teen creating a task simply see only themselves in the picker (single pre-selected pill — picker UI may collapse to a static "For: you" line when only one assignable). A granted dad sees himself + granted kids.

### Piece 3 — Write-side RLS hardening (tasks + task_assignments; lists verified)

Migration `00000000100262_task_assignment_write_rls.sql` (idempotent; FO session confirmed zero migrations on their side, 100262+ is ours):

- Register `task_assignment` feature key (seed) + `util.task_assign_allowed()` helper.
- Restructure tasks write policies: split the FOR ALL `tasks_manage_adults` into explicit read/insert/update so we can attach a **WITH CHECK on `assignee_id`**: allowed when caller is primary parent, OR assignee resolves to the caller's own member row, OR `util.task_assign_allowed()` grants it. Preserve untouched behavior for: `tasks_update_assigned_member` (shared-task completions, migration 100147), mom flows, completion/approval flows.
- Same WITH CHECK shape on `task_assignments` INSERT (`ta_via_task` currently allows anyone to assign anyone).
- **Lists:** verify `lists_owner_or_parent` + `list_items` write policies during recon; tighten only if a concrete gap is found (lists write RLS is already owner-or-parent shaped — expected small or no change).
- **Read-side scoping explicitly NOT touched** (D4).
- ⚠️ **Flagged design check (recon Phase 0, before the migration is written):** family-device hub dip-ins authenticate as the family shadow account (Convention #273), not the member — `auth.uid()` there is neither mom nor the kid. Recon must establish how task writes pass current RLS in that flow and ensure the new WITH CHECK is **no stricter than today for self-assignment paths** on family devices. Likely resolution: family-shadow sessions get family-scoped write (UI enforces effective-member identity, documented as a Convention #39 known limitation), per-member sessions (email + PIN/picture shadow accounts) get the strict self-or-granted check. Founder sees the recon result before the migration lands.

### Piece 4 — Tests + verification

- New `tests/e2e/permissions/task-assignment-scoping.spec.ts` (leak-pass pattern: Testworth family, service-role fixtures, unique prefix, afterAll cleanup): dad ungranted sees self-only picker; granted dad sees self + granted kid; per-kid carve-out wins over family-wide; teen self-only; direct RLS probe — dad/teen INSERT with foreign assignee_id rejected at DB; mom regression (full roster).
- New `tests/e2e/features/review-route-direct-deploy.spec.ts`: extract → approve all → tasks exist on the user's Tasks page with correct assignee/source, NOT in studio_queue; list destination lands in list_items; calendar destination still queues; confirmation summary shown; failed-item partial-commit honesty.
- Regression: `role-scoping-leak-pass.spec.ts` + `permissions-wiring.spec.ts` must stay green. FO session runs the same two — coordinate if either build turns one red.
- `./node_modules/.bin/tsc -b` clean (Convention #121); lint no new errors.

## Phases

| Phase | Content | Gate |
|---|---|---|
| 0 | Recon: hub dip-in tasks-write RLS reality; Review & Route list sub-destination handling; `tasks.source` constraint check; Studio deploy picker inventory; lists/list_items write-policy gap check | Founder sees RLS recon result before migration is written |
| 1 | Migration 100262 (key seed + `util.task_assign_allowed` + write WITH CHECKs) + `npm run schema:dump` | Applied + verified via pg_policies |
| 2 | `useAssignableMembers` + picker sweep + Permission Hub grant row + keyWiringStatus | **Unblocks FO-COMMAND-CENTER Phase 4** — note in coordination file when landed |
| 3 | Direct deploy: NotepadReviewRoute + useMindSweep + confirmation toasts | Eyes-on browser verification |
| 4 | E2E (both new specs) + regression + tsc + mobile checks | All green |
| 5 | Close-out: verification table, WIRING_STATUS, STUB_REGISTRY, CLAUDE.md convention entry, LiLa knowledge, coordination file final note | Founder sign-off |

## NOT in scope

- Read-side tasks/lists RLS (Convention #39 — own pass)
- Family Overview page, Tasks page layout, Queue surface relocation (FO-COMMAND-CENTER owns)
- Calendar event attendee scoping (different semantic — attendees aren't task assignment)
- Rhythm MindSweep-Lite (already correct)
- SortTab/queue review flow internals (queue keeps working as-is for what still flows into it)
- Teen-grantable assignment (teens stay flat self-only per D3)

## Expected new conventions (CLAUDE.md, at close-out)

- Direct-deploy contract: any surface where the user has card-by-card reviewed and approved AI-classified items MUST create the records directly (HITM is satisfied by that review); `studio_queue` is exclusively for unreviewed or context-incomplete intake.
- `task_assignment` grant is the single authority for "who can assign new tasks to whom"; acting on existing tasks stays on the contribute-level `viewableLevels` check (boundary agreed with FO-COMMAND-CENTER Q1).

## Mom-UI Surfaces

- Notepad Review & Route drawer — shells: mom, adult, independent — modification (direct deploy + confirmation summary)
- MindSweep (/sweep) — shells: mom, adult, independent — behavior change on auto-route only (no visual change beyond result location)
- TaskCreationModal / AssignmentSelector — shells: mom (no visible change), adult, independent (picker collapses to self) — modification
- Permission Hub — shell: mom — new grant row
- Tasks page — verification only (deployed tasks appear; edit-own works) — no code change (FO owns the file)

## Mom-UI Verification

> Playwright = automated browser evidence at desktop viewport. Founder eyes-on still required per Visual Verification standard for the rows marked PENDING.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Review & Route: approve all → tasks on Tasks page + summary toast | ✅ Playwright | PENDING | PENDING | adult | review-route-direct-deploy.spec.ts | 2026-06-10 |
| Review & Route: list item lands in chosen list (drill-down UI) | PENDING | PENDING | PENDING | mom/adult | founder eyes-on | |
| Review & Route: calendar item still goes to queue | ✅ Playwright (DB assert) | n/a | n/a | adult | same spec | 2026-06-10 |
| TaskCreationModal picker as mom (full roster + Everyone, unchanged) | ✅ Playwright | PENDING | PENDING | mom | task-assignment-scoping test 8 | 2026-06-10 |
| TaskCreationModal picker as ungranted dad (self only, no Everyone) | ✅ Playwright | PENDING | PENDING | adult | test 6 | 2026-06-10 |
| TaskCreationModal picker as granted dad (self + granted kid) | ✅ Playwright | PENDING | PENDING | adult | test 7 | 2026-06-10 |
| Edit own task as dad — no reassignment possible | DB-enforced (RLS probe 1) | n/a | n/a | adult | test 1 + scoped edit picker | 2026-06-10 |
| Permission Hub: Assign-tasks grant rows (family-wide + per-kid) | PENDING | PENDING | PENDING | mom | founder eyes-on | |
| Family tablet: kid dip-in can check off tasks/routines/tallies again | PENDING | PENDING | PENDING | family device | founder eyes-on (the regression fix) | |
| MindSweep autopilot: task auto-routes direct to Tasks | PENDING (optional) | | | mom | aggressiveness setting required | |

## Close-out checklist (Convention #14)

- Post-Build Verification table (zero Missing) + Mom-UI table complete
- WIRING_STATUS.md (Review & Route row task/list flip to direct; new "Task assignment scoping" section; Tasks/Lists RLS stub row updated to "write-side Wired / read-side deferred")
- STUB_REGISTRY.md (read-side RLS stays listed; any new stubs)
- CLAUDE.md new conventions (above) + claude/feature-decisions file + README index
- LiLa knowledge: help-patterns.ts + feature-guide-knowledge.ts ("where did my brain dump items go", "why can't I assign tasks to my kids" → Permission Hub grant walk-through)
- Final note in `COORDINATION-review-route-task-scoping.md` (Phase 2 landed → FO Phase 4 unblocked); archive both files to `.claude/completed-builds/2026-06/`
- Stage ONLY this build's files per commit (parallel session shares the tree)
