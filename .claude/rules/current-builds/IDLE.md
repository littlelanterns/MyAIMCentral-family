# Active Build Context

> This folder lives at `.claude/rules/current-builds/` and is auto-loaded into every Claude Code session via the native `.claude/rules/` recursive discovery mechanism (no explicit `@`-reference in CLAUDE.md required). One `.md` file per in-flight build (kebab-case filename matching the build identity, e.g. `PRD-30-safety-monitoring.md`). When nothing is active, only this `IDLE.md` file exists.
>
> Build files in this folder **must not include YAML `paths:` frontmatter** — frontmatter with `paths:` makes the file path-conditional, which breaks the unconditional auto-load pattern this folder relies on.

## Status: NO ACTIVE BUILDS IN FLIGHT

### Active builds

- None in flight.

### Last signed-off builds

- **Member-Day Task State — Single Source of Truth** (2026-06-08) — Money-math bug fix: 3 painted-blind read paths (`useRoutineWeekView`, `calculate_allowance_progress`, `calculate-allowance-period`) counted past-end-date painted routines in kids' allowance denominators (silent erosion for Gideon/Miriam/Mosiah). Established canonical `get_member_day_obligations` (Layer 2) + `obligation_active_for_member_on_date` (Layer 1, mirrors `recurringTaskFilter.ts`); 3 callers refactored; **Convention #271** codified (dashboard-truth invariant); invariant test `tests/routine-day-state-invariant.test.ts` (19/19) guards TS↔SQL drift; 3 painted rows backfilled + 1 orphan archived. Return shape pre-carries pool_id/task_segment_id/is_extra_credit/homework_subject_ids for future reward surfaces. Migration 100247. Commit `6143b5a`. Checkpoint 5 audit: 12/12 Wired, 0 Missing, 3/3 Discipline-2 prod checks. Single worker. Open follow-ups: founder this-week testing + per-kid old→corrected delta review (default corrected); grandfathered surfaces refactor when next touched. Archived in `.claude/completed-builds/2026-06/member-day-task-state-canonical-source.md`.
- **View-As — Identity-Scope Architecture** (2026-06-04) — View As + Family Hub PIN flow re-architected as a modal overlay with identity-scoped data. `useEffectiveMember/Shell/Viewer` hooks, `view_as_sessions.origin` column, `<MomOnlyRoute>` backstop (16 routes), `filterKidPrivate()` helper, hub `member_session` flow, modal inactivity timeout + warning banner, My Rewards kid stub. Convention #39 rewritten + #272 (realtime per-instance channels). 5 crash-detour fixes (realtime channel collisions, ErrorBoundary around modal, hub-route modal mount, Family Overview columns, banner theming) + cross-shell shell-derivation fix + emoji removal. Migrations 100246 + 100248. Post-build audit: 48 reqs / 45 Wired / 2 Stub / 0 Missing. Workers 1–7 + 5A–5E. Archived in `.claude/completed-builds/2026-06/view-as-identity-scope-architecture.md`.
- **PRD-09B — Living Shopping List & Shopping Mode V1** (signed off 2026-06-04; code shipped 2026-05-04 `f2569b7`) — Always-on shopping lists, Recently Purchased tab, purchase history, auto-archive cron, per-section timing; Shopping Mode (cross-list store selection + store view + aisle lens). Migration 100230. V2/V3 items documented as stubs. Closed under opportunistic-eyes-on basis (code shipped + pushed + in production use). Archived in `.claude/completed-builds/2026-06/prd-09b-living-shopping-list-shopping-mode.md`.
- **TaskCreationModal — Checkbox Honesty** (signed off 2026-06-04; code shipped 2026-05-25 `970e175`) — Fixes silent revert of task tracking checkboxes (allowance/gamification/homework/extra-credit/track-progress/track-duration) on parent re-render, via `hasUserInteractedRef` + `editTaskId` instrumentation. Vitest invariant is the proof; planned E2E intentionally dropped per plan. Archived in `.claude/completed-builds/2026-06/taskcreationmodal-checkbox-honesty.md`.
- **Phase 3.5 — Multi-Pool Allowance** (2026-05-06) — 14 capabilities, 3 fold-in items, 18 key decisions. Per-pool configs/periods/RPCs, Edge Function per-pool close + cross-pool logic, frontend per-pool widget + multi-pool config + full ledger + compute-then-prompt recalculate + grace day sync + period history grouping. Migrations 100234-100236. 5 workers (A→E). 17 Playwright tests, 0 bugs. 4 stubs. Archived in `.claude/completed-builds/2026-05/phase-3.5-multi-pool-allowance.md`.
- **Phase 3.8 — Activity Management** (2026-05-05) — Per-item recurrence, ActivityListWizard (6 steps + deploy-target picker), SharedTaskListWizard (5 steps + claim-to-promote + write-back), Play icon launchers, Guided/Independent activity surfaces, reveal animation picker, NLC routing, Task Breaker Vault fix. 5 seeded templates, 3 migrations (100231-100233), 21+ Playwright tests. 68/68 verified. Archived in `.claude/completed-builds/2026-05/phase-3.8-activity-management.md`.
- **Phase 3.7 — Wizards & Seeded Templates** (2026-05-04) — 3 wizards, 3 seeded templates, NLC entry point, Drafts tab, draft persistence. Migration 100229. 6 Playwright tests. Archived in `.claude/completed-builds/2026-05/phase-3.7-wizards-seeded-templates.md`.
- **Phase 3 — Connector Layer** (2026-05-03) — 25 sub-tasks wired, 0 missing. 12 godmothers, deed_firings dispatch trigger, contracts table, IF evaluation (8 patterns), inheritance resolution, presentation layer, `/contracts` UI, `/prize-board` expansion (Allowance/Prizes/Balance). 14 Playwright tests. Migrations 100199-100225. Archived in `.claude/completed-builds/2026-05/phase-3-connector-layer.md`.
- **Workers 2+3 — Shared Routines + Shared Lists** (2026-05-02) — 9 items: 4 already wired, 5 built. Multi-instance FIRST-N-COMPLETERS, mom re-attribution, cross-sibling edit authority, list claim semantics, four-mode sharing config, week view with member colors. 13 Playwright tests. Conventions 266-270. Archived in `.claude/completed-builds/2026-05/workers-2-3-shared-routines-lists.md`.

### Full archive

The complete set of signed-off builds and their pre-build summaries lives in `.claude/completed-builds/`, organized by month:

- `.claude/completed-builds/2026-04/` — 17 build files covering Builds C through P, Phase 1b, Worker 5, and Daily Progress Marking
- `.claude/completed-builds/2026-05/` — Phase 3.5, Phase 3.8, Phase 3.7, Phase 3 Connector Layer, Universal Capability Parity Stages 1-2-3, Workers 2+3
- `.claude/completed-builds/README.md` — chronological completion ledger + index of all archived build files

Search `.claude/completed-builds/` via mgrep when you need to recall the full pre-build summary, decisions, or stubs for a historical build. The feature-decision files in `claude/feature-decisions/` remain the authoritative post-verification record per build.

---

## Starting a new build

When a new build begins per `claude/PRE_BUILD_PROCESS.md`:

1. Create a new file in this folder: `.claude/rules/current-builds/<build-identity>.md` (e.g. `PRD-30-safety-monitoring.md`). Do not add YAML frontmatter.
2. Populate it with the full pre-build summary: PRD path, addenda read, feature decision file, dependencies, build scope, stubs, key decisions, open questions. If the build touches any UI, include a `## Mom-UI Verification` section with this table template — populate it during the build at each inter-worker checkpoint (Checkpoint 2) and finalize at Checkpoint 5:
   ```
   | Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
   |---------|-----------------|---------------|---------------|---------------|----------|-----------|
   ```
3. Optionally delete `IDLE.md` while the build is active (it'll be re-created on sign-off), OR leave it in place — the recursive auto-load will surface both.
4. On sign-off, move the build file from `.claude/rules/current-builds/` to `.claude/completed-builds/YYYY-MM/`, update `.claude/completed-builds/README.md`, and restore/update `IDLE.md` if no other builds remain active.
