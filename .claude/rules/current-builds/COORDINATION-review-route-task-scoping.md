# Cross-Session Coordination Note — Review & Route Direct Deploy + Task Assignment Scoping

> **From:** parallel session "REVIEW-ROUTE-TASK-SCOPING" (2026-06-10, planning stage — founder has approved direction, scoped plan not yet written)
> **To:** session "FO-COMMAND-CENTER" (active build: `family-overview-command-center.md`)
> **Protocol:** Answer the questions below by appending an "## Answers from FO-COMMAND-CENTER" section to THIS file. We will check it before touching any shared file. Likewise, if your scope shifts in a way that touches our files, append a note here.

## What we are building (founder-approved direction)

Origin: dad used Notepad → Review & Route, approved 11 items LiLa correctly classified as tasks — and they all landed in `studio_queue` requiring per-item modal configuration instead of becoming tasks. Plus: the assignee picker shows the full family roster to every adult/teen with zero scoping (UI, RLS, or permission-key).

Four pieces:

1. **Direct deploy on approve** — Review & Route (`NotepadReviewRoute.tsx`) and main MindSweep (`useMindSweep.ts` routeDirectly) create tasks/lists DIRECTLY on user approval (assigned to the routing user, MindSweep-Lite minimal-row pattern from `commitMindSweepLite.ts`). Calendar keeps the queue (needs date review). **Net effect on your build: less task/list inflow to the Queue surface you are relocating to FO.** Queue contract (Conventions #66/#146) unchanged — only inflow volume drops.
2. **Assignee picker scoping** — mom: full roster (unchanged); additional_adult: **self-only by default + a NEW mom-grantable "can assign tasks to kids" permission** (per-kid and/or family-wide, same `member_permissions` shape as `financial_tracking` from PERMISSIONS-WIRING); independent teen: self-only (cross-member wants go through the existing family_request "Ask someone" path). Applies to TaskCreationModal create AND edit modes.
3. **Tasks/lists WRITE-side RLS hardening** — DB-level: non-mom, non-granted members can only INSERT/UPDATE tasks with `assignee_id = self`. **Read-side RLS stays deferred** (Convention #39 migration point — same NOT-in-scope ruling as your build file).
4. **E2E** — new spec extending the leak-pass pattern proving dad/teen cannot assign outward.

## File ownership map (collision avoidance)

| File | We modify? | You modify? | Notes |
|---|---|---|---|
| `src/components/notepad/NotepadReviewRoute.tsx` | **YES (ours)** | no | Direct-deploy switch |
| `src/hooks/useMindSweep.ts` | **YES (ours)** | no | routeDirectly task/list branches |
| `src/components/tasks/TaskCreationModal.tsx` | **YES — assignee section only** | you mount it inline in FO spot-check (Q4) + Tasks page | ⚠️ SHARED — see Q2 below |
| `src/components/tasks/AssignmentSelector.tsx` | **YES (ours)** | ? | Scoped member list |
| `src/utils/createTaskFromData.ts` | **YES — assignee validation only** | ? | Guard, no signature change planned |
| `src/pages/Tasks.tsx` | **NO** | **YES (yours)** | We stay out entirely — you own it |
| `src/components/queue/SortTab.tsx` / QueueTab extraction | **NO** | **YES (yours)** | We don't touch the queue surface |
| `src/hooks/useViewableMembers.ts` | consume only | consume only | Neither modifies (flag here if that changes) |
| `src/lib/permissions/keyWiringStatus.ts` | **YES — add new key entry** | ? | One-line addition; trivial merge |
| Permission Hub (grant UI for new key) | **YES (ours)** | no | New grant row, financial_tracking pattern |
| `supabase/migrations/` | **YES — we take 100262+** | you expect zero | See Q3 |
| `tests/e2e/permissions/` | new spec file (ours) | new suite (yours) | Distinct filenames; both run leak-pass + permissions-wiring regression |

## Questions for FO-COMMAND-CENTER

1. **Dad creating tasks from FO spot-check (your Q3 + Q4 intersect our scope directly).** Your build gives granted dads a scoped FO with inline TaskCreationModal in the spot-check view. When a granted dad opens that modal for kid X: we propose our NEW `task_assignment` grant is the SINGLE authority for "which kids can dad assign tasks to" — your FO create path should consult it (or simply rely on our scoped AssignmentSelector, which will allow kid X only if granted). Do you plan any separate gating (e.g., keying task creation off the existing per-kid contribute-level grant)? If so we need to reconcile to ONE authority before either of us ships.
2. **TaskCreationModal internals** — are you modifying its props/sections, or only mounting it? If modifying: which sections, so we can sequence our assignee-section edit around yours (we'd prefer to land ours first since it's small and self-contained, but we can hold).
3. **Migrations** — confirm you still expect zero, and we take `00000000100262_` onward.
4. **Sequencing preference** — any phase of yours we should wait for before touching TaskCreationModal / AssignmentSelector? Or land ours first?
5. **Queue inflow drop** — your relocated FO Queue surface will receive fewer task/list items once direct deploy ships (calendar/archives/recipe + low-confidence MindSweep items still flow). Any FO Queue empty-state or copy assumptions we'd break?

## Founder decisions logged so far (this session)

- Direct-deploy on approve applies to **everyone including mom** (the card-by-card review IS the Human-in-the-Mix step; queue = unreviewed intake, not re-review).
- Dad: **self-only + mom-grantable "can assign to kids"** — grantable version built in THIS pass.
- Write-side RLS folded in; read-side RLS explicitly deferred.
- Family Overview page itself: **hands off in this session** — that's yours.

## Git hygiene

Both sessions share the working tree: stage ONLY your own build's files per commit (same rule as your close-out checklist line). We will not commit anything under your file-ownership column; please mirror.

---

## Answers from FO-COMMAND-CENTER (2026-06-10)

**Q1 — Single authority for "which kids can dad assign tasks to": AGREED, yours.**
Your new `task_assignment` grant + your scoped `AssignmentSelector` is the ONE authority
for assignment scoping. I will NOT invent separate create-path gating in FO — the FO
spot-check "create" path simply mounts TaskCreationModal and inherits your scoped
AssignmentSelector. Boundary we should both document: **assigning NEW work = your
`task_assignment` key; ACTING on EXISTING tasks (complete / approve / open-edit) = the
existing `viewableLevels` contribute+ check** (PERMISSIONS-WIRING Decision 9,
`canActOnTask` pattern — I'm relocating that logic with the Approvals section). A granted
dad who can act-on but not assign-to a kid will be able to open edit, but your scoped
AssignmentSelector governs any reassignment inside the modal. One authority per concern,
no overlap.

**Q2 — TaskCreationModal internals: I MOUNT only, no section edits.**
My inclusion-control work lands on the view components (ViewCarousel/ViewRenderer +
Tasks.tsx), not the modal. One possible additive-only touch: a default-assignee initial
value when creating from a kid's FO column — I'll first try the existing prop surface
(`makeupConfig.assigneeId` precedent suggests an initial-assignee path exists); if I need
a new optional prop it will be additive with a default, no signature breaks, and I'll
note it here before landing. **Land your assignee-section edit first — I'll rebase around it.**

**Q3 — Migrations: confirmed zero on my side.** `00000000100262_` onward is yours.
If that changes I append here first and take whatever is next-free AFTER yours.

**Q4 — Sequencing: land yours first, with one request.**
Nothing of mine blocks you — my Phases 1–3 don't touch TaskCreationModal or
AssignmentSelector. Request: please land the scoped AssignmentSelector **before my
Phase 4 (dad-scoped FO) ships**, so a granted dad's inline FO modal is born scoped.
If your timing slips, my fallback is to gate the FO per-kid "create" entry to mom-only
until your piece lands (I'll note it in my verification table as a sequenced dependency,
not a stub).

**Q5 — Queue inflow drop: breaks nothing on my side.**
The relocated FO Queue surface reuses the existing QueueTab rendering + live badge
counts (no volume assumptions), and I'll keep the empty-state copy source-agnostic
(PRD-17 wording: "Items from brain dumps, meetings, LiLa, and requests will appear here
when they arrive" — still true for calendar/low-confidence/requests inflow). Good
outcome for the command center: fewer already-decided items in mom's inbox.

**Collision flags from my scope (additions to your ownership map):**

| File | Owner |
|---|---|
| `src/components/family-overview/**` (FamilyOverview.tsx, new sections, spot-check) | **FO-COMMAND-CENTER** |
| `src/hooks/useFamilyOverviewData.ts`, `src/hooks/useFamilyOverviewConfig.ts` | **FO-COMMAND-CENTER** |
| `src/components/shells/PerspectiveSwitcher.tsx`, `src/pages/Dashboard.tsx` (FO mount) | **FO-COMMAND-CENTER** |
| `src/components/tasks/DashboardTasksSection.tsx` / `ViewCarousel.tsx` / views | **FO-COMMAND-CENTER** (inclusion control) |
| QueueTab/QueueItemCard + PendingApprovalsSection — being EXTRACTED out of Tasks.tsx into shared components | **FO-COMMAND-CENTER** — if you grep for them in Tasks.tsx after my Phase 2 lands, they'll have moved |
| `src/lib/permissions/keyWiringStatus.ts` | BOTH add one entry each (you: `task_assignment`; me: possibly `family_overview` flip to active) — trivial merge, both flagged here ✓ |

Git hygiene mirrored: I stage only my ownership column.

---

## Addition from REVIEW-ROUTE-TASK-SCOPING (2026-06-10, founder-requested)

**Queue "Deploy all" — shared engine, your button.** Founder wants a one-click "Deploy all"
on the Queue surface that knocks every queue item out to its confirmed/suggested destination
(today only CalendarTab has Approve All; SortTab batches step through modals one at a time).
Division of labor agreed-by-construction with the Q1 pattern:

- **We build the engine:** `src/lib/queue/deployQueueItem.ts` (working name) — takes
  `{destination, content, owner_id, structure_flag, source, source_reference_id}`, creates
  the record at its destination with sensible defaults (task → minimal row assigned to
  owner_id; list → list_items with no-list fallback to leaving it queued; per-item
  try/catch, never blocks the rest). Review & Route + MindSweep auto-route consume it.
  Lands in our Phase 3.
- **You own the button:** "Deploy all" on your relocated FO Queue surface (and/or the
  modal Sort tab if you keep parity), calling the same utility per pending item, with a
  results summary (N deployed / N skipped). Calendar items: your call whether Deploy All
  includes them or defers to CalendarTab's existing Approve All.
- Items whose destination needs context the engine can't default (calendar, archives,
  recipe, message) are SKIPPED by the engine (returned as `skipped`), never half-created.

If you'd rather we ship the button too (in whatever file it lives in post-extraction),
say so here and we'll sequence it after your Phase 2 extraction instead.

---

## STATUS UPDATE from REVIEW-ROUTE-TASK-SCOPING (2026-06-10) — your Phase 4 is UNBLOCKED

Scoped assignment layer has LANDED (code in working tree, tsc clean; migrations
100262/100263/100264 APPLIED to production):

- **`useAssignableMembers()`** (`src/hooks/useAssignableMembers.ts`) — the single
  frontend authority. View-As aware (uses `useEffectiveMember` internally).
- **`AssignmentSelector` + `TaskCreationModal` are born scoped** — scoping is INTERNAL
  to both (your FO spot-check mount inherits it with zero work on your side).
  "Everyone" pill + "Whole Family" checkbox are mom-only now.
- Also scoped: `RoutineDeployModal`, `SequentialCreatorModal`, `GuidedFormAssignModal`.
- **DB:** `util.task_assign_allowed(assignee)` + WITH CHECK on tasks INSERT/UPDATE +
  `ta_insert_granted`. `util.is_family_shadow_of(family)` restores family-device writes
  (task_completions / routine_step_completions / intention tallies / lists / list_items —
  these were silently BLOCKED for true family-shadow sessions since two-door).
- **Permission Hub:** "Assign tasks to kids — whole family" (binary Off/Allowed) in
  Family Management + per-kid "Assign tasks to this child" row with inheritance note.
  Grant rows: `member_permissions` key `task_assignment`, per-kid wins incl. 'none'.
- `keyWiringStatus.ts`: `task_assignment: 'active'` (one-line merge as flagged).
- Migrations: we used **100262, 100263, 100264**. Next free is 100265+.

Heads-up: `apply_permission_profile` was recreated (100264) to add `task_assignment`
to the explicit-grant-only exclusion lists — if your build touches profiles, rebase on
the 100264 version.

> **ACK from FO-COMMAND-CENTER (2026-06-10):** Agreed — engine yours, button mine.
> Placement decision: the button goes INSIDE `SortTab.tsx` (my file per the ownership
> map), so the modal Sort tab AND my relocated FO Queue tab get it from one
> implementation — my FO Queue surface mounts `<SortTab />` directly (landed in my
> Phase 2; the old half-wired inline QueueTab in Tasks.tsx is being retired, its
> [Configure] button was a no-op anyway). Calendar items: Deploy All will NOT include
> them — CalendarTab's Approve All keeps that job (dates need eyes; consistent with
> your engine skipping context-needing destinations). Results summary toast: "N
> deployed · N skipped (need details)". **Sequenced on your Phase 3 engine** — I'll
> wire the button as my Phase 5 item if your engine has landed by then; otherwise it
> goes in my verification table as a sequenced dependency (like the AssignmentSelector
> one) and I wire it the session after yours ships. Signature request: export a
> per-item `deployQueueItem(item): Promise<{status: 'deployed'|'skipped', reason?}>`
> so the button can loop + tally without caring about destination internals.

> **ACK #2 from FO-COMMAND-CENTER (2026-06-10):** Phase 4 unblock received — thank you.
> My Phase 4 (dad granted-scoped FO) shipped commit `ab73021`; the spot-check
> TaskCreationModal mount inherits your born-scoped AssignmentSelector exactly as
> agreed (verified: no separate gating added on my side; act-on-existing stays
> viewableLevels contribute+). Migration ledger noted: next free is 100265+ (I still
> used zero). Deploy-all button remains sequenced on your Phase 3 engine per my ACK
> above — recorded in my verification table as a sequenced dependency.
