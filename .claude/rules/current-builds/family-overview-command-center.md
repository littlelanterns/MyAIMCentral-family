# Active Build: Family Overview Command Center (FO-COMMAND-CENTER)

## Status: ACTIVE — founder approved 2026-06-10 (all Q1–Q9 answered; Q8 relocate confirmed; Q5 order confirmed: Events → Tasks → Routines → Sequential → Opportunities → Best Intentions → Trackers → Weekly Completion → Victories)

## Build phases

1. **FO sections + data** — add `routines`/`sequential` section keys + new default order (append-if-missing for saved orders); routines/sequential data hooks; wire Victories + Weekly Completion (allowance progress) sections live.
2. **Relocations** — FO gains page-level tabs [Overview] [Approvals] [Queue] [Finances]; PendingApprovalsSection extracted to shared component (mastery fork + canActOnTask intact); QueueTab + QueueItemCard extracted; FinancesTab mounted on FO; member spot-check expanded view with inline TaskCreationModal; Sequential [+ Create] relocated (Convention #150 amendment).
3. **Tasks page personal** — remove relocated tabs + member pill bar; add ViewCarousel/ViewRenderer; inclusion control (global default in per-member prefs + session override pills); sequential shows next-item-only, tap-through.
4. **Dad scoped FO** — PerspectiveSwitcher FO tab for additional_adult with viewable members; FamilyOverview swaps stale `view_as_permissions` for `useViewableMembers`; view-vs-contribute action gating; Queue stays mom-only (RLS); Finances per grants.
5. **Tests + close-out** — new Playwright suite; regression (leak-pass + permissions-wiring); tsc/lint; eyes-on verification; file updates + LiLa knowledge.

## Cross-session coordination (REVIEW-ROUTE-TASK-SCOPING, 2026-06-10)

See `COORDINATION-review-route-task-scoping.md` (answers appended). Agreed: their new
`task_assignment` grant + scoped AssignmentSelector is the single authority for
assignment scoping; my FO create path mounts TaskCreationModal and inherits it.
Act-on-existing stays `viewableLevels` contribute+ (mine, relocating with Approvals).
**Sequenced dependency: their scoped AssignmentSelector should land before my Phase 4
ships; fallback = FO per-kid create entry gated mom-only until it lands.** They take
migrations 100262+; I expect zero. Both stage only own files.

> Worker: FO-COMMAND-CENTER. Dispatch: `claude/dispatch-prompts/family-overview-command-center-session.md`.
> Vision (THE LAW): `claude/feature-decisions/Family-Overview-Command-Center-Vision.md`
> Feature decision file: `claude/feature-decisions/Family-Overview-Command-Center.md`

## Source material read (full documents)

- Vision file; PRD-14C; PRD-09A; PRD-17 (all full)
- Addenda: PRD-14 Cross-PRD; PRD-09A/09B Studio Intelligence; PRD-09A/09B Linked Steps/Mastery; PRD-09A Daily Progress Marking; PRD-17B Cross-PRD; PRD-Audit-Readiness; PRD-Template-and-Audit-Updates
- Completed builds: role-scoping-leak-pass.md; permissions-wiring.md (incl. PRD-31 Permission Matrix rulings)
- Code: FamilyOverview.tsx, useFamilyOverviewData.ts, useFamilyOverviewConfig.ts, Tasks.tsx, UniversalQueueModal.tsx (structure), DashboardTasksSection.tsx, Dashboard.tsx (FO mount + views), PerspectiveSwitcher.tsx
- Tool health (Convention #241): codegraph initialized this session ✓; endor-cli-tools connected ✓; mgrep not used (Convention #242)

## Pre-Build Summary

### What moves TO Family Overview
1. **Member spot-checking** — per-member deep view (today behind the Tasks member pill bar)
2. **Category sections per member column** — ADD `routines` + `sequential` section keys to the existing 7 (events, tasks, best_intentions, trackers, weekly_completion, opportunities, victories). Registered TEXT constants — no migration.
3. **PendingApprovalsSection** — relocated intact, INCLUDING the Build J mastery fork (Convention #161: `completion_type='mastery_submit'` → mastery hooks → flip to `'mastery_approved'` for the gamification RPC, Convention #200) and PERMISSIONS-WIRING `canActOnTask` view-vs-contribute gating.
4. **Queue surface** — the Tasks page inline Queue tab relocates. UniversalQueueModal 3-tab contract (Conventions #66/#146) and all modal entry points untouched.
5. **Category multi-select** — "all selected categories for all selected people" (extends `family_overview_configs`).
6. Member column scroll + member multi-select — ALREADY BUILT, keep.

### What the Tasks page becomes
- Purely personal: own items (incl. soft-claim-held per Daily Progress Marking §4.5) + prioritization views.
- NEW inclusion control: routines / opportunities / sequential viewable alongside tasks inside the views (display filter only — Convention #68, view metadata already on `tasks` rows).
- Tabs/sections that leave: Routines, Opportunities, Sequential, Queue (+ Approvals section). Finances tab fate = gate Q7.

### Known supersessions (document, newer-wins per Convention #11)
- Studio Intelligence addendum "Sequential tab dual access, not moved" → superseded by founder vision 2026-06-09.
- Convention #150 entry-point list amendment: Tasks → Sequential [+ Create] entry point follows the Sequential surface to FO.

### Schema / migrations
- **Expected: zero migrations.** Section keys are registered constants; preferences persist in existing JSONB columns. `family_overview` feature key already registered (migration 000009).
- If any migration becomes needed: check `npx supabase migration list --linked` FIRST (last known 100261), idempotent SQL, `npm run schema:dump` after.

### Stale code to correct in passing
- FamilyOverview dad-scoping reads `view_as_permissions` (pre-leak-pass). Replace with `useViewableMembers` (or remove if FO stays mom-only — gate Q3). Currently dead code: PerspectiveSwitcher is mom-only.

### NOT in scope
- Tasks/Lists RLS hardening (Convention #39); Reflections revamp; My Rewards content; Special Adult Experience; any reduction of the 13 prioritization views; new gamification/reward surfaces; the 6 PlannedViewStub views stay stubs; FO AI digest/forecast.

## Founder Decisions (gate answers, 2026-06-10)

| # | Decision |
|---|---|
| Q1 | **APPROVED** — Approvals + Queue surfaces move entirely off Tasks. QuickTasks strip queue-modal icon + QueueBadge entry points stay (modal ≠ page surface). |
| Q2 | **HYBRID** — Option B global default ("what counts as a task" setting) + Option A per-day override pills on the view header. **Sequential items in task views show ONLY the next item to be done**; tapping it (if allowed) opens the full list / complete-early etc. |
| Q3 | **YES** — dad gets a granted-scoped Family Overview: only the children he holds permission for, only what each grant allows. Via `useViewableMembers` + PerspectiveSwitcher gains the FO tab for granted additional_adults. Stale `view_as_permissions` read replaced. |
| Q4 | **APPROVED** — full TaskCreationModal opens inline inside the FO spot-check view. No page hopping. |
| Q5 | **Best Intentions moves next to Trackers** (sequential + opportunities are more timeline-bound, rank higher). Default order: Events → Tasks → Routines → Sequential → Opportunities → Best Intentions → Trackers → Weekly Completion → Victories. (Exact BI position — above Trackers — confirmed at gate recap.) |
| Q6 | **CONFIRMED** — ViewCarousel + ViewRenderer (the 13 views) added to the Tasks page; dashboard section unchanged. |
| Q7 | **Finances tab moves to Family Overview** (off Tasks). |
| Q8 | Walkthrough requested — pending founder confirmation (Sequential "+ Create" entry point relocation, Convention #150 amendment). |
| Q9 | **WIRE BOTH** — Victories section (live data) + Weekly Completion section (PRD-28 allowance progress RPCs). |

## Mom-UI Surfaces

- Family Overview (Dashboard → Family Overview perspective) — shells: mom (+ adult if Q3=yes) — heavy modification
- Tasks page — shells: mom, adult, independent (guided untouched) — heavy modification
- Dashboard PerspectiveSwitcher — shells: mom (+ adult if Q3=yes) — modification only if Q3=yes
- Sidebar/BottomNav — only if any nav entry changes (none expected; FO lives behind PerspectiveSwitcher) — parity check if touched

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| FO member-column horizontal scroll (375px snap) | | | | | | |
| FO new sections (routines/sequential) | | | | | | |
| FO category multi-select | | | | | | |
| FO relocated Approvals (incl. mastery card) | | | | | | |
| FO relocated Queue surface | | | | | | |
| Tasks page personal view + view carousel | | | | | | |
| Tasks view inclusion control (B default + A override pills) | | | | | | |
| FO Finances tab (relocated) | | | | | | |
| Dad's granted-scoped FO (adult shell) | | | | | | |
| FO Victories + Weekly Completion sections (newly wired) | | | | | | |

## Test plan

- New Playwright suite extending `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` pattern (Testworth family, service-role fixtures, unique prefix, afterAll cleanup).
- Regression: `role-scoping-leak-pass.spec.ts` AND `permissions-wiring.spec.ts` must stay green (same Tasks surface).
- `./node_modules/.bin/tsc -b` clean (Convention #121); lint no new errors.

## Close-out checklist (Convention #14)

- Post-Build Verification table (zero Missing) + Mom-UI table complete
- WIRING_STATUS.md, BUILD_STATUS.md, feature-decisions README index, follow-up queue memory (item 11 → shipped)
- CLAUDE.md convention amendments (#150 entry point; supersession notes; any new conventions)
- `<FeatureGuide featureKey="family_overview" />` if page identity changes materially; LiLa knowledge (help-patterns.ts + feature-guide-knowledge.ts)
- Logical commits per phase; stage ONLY this build's files (parallel sessions share the tree); push at end
