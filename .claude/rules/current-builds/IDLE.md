# Active Build Context

> This folder lives at `.claude/rules/current-builds/` and is auto-loaded into every Claude Code session via the native `.claude/rules/` recursive discovery mechanism (no explicit `@`-reference in CLAUDE.md required). One `.md` file per in-flight build (kebab-case filename matching the build identity, e.g. `PRD-30-safety-monitoring.md`). When nothing is active, only this `IDLE.md` file exists.
>
> Build files in this folder **must not include YAML `paths:` frontmatter** — frontmatter with `paths:` makes the file path-conditional, which breaks the unconditional auto-load pattern this folder relies on.

## Status: ACTIVE BUILDS IN FLIGHT

### Active builds

- **PRD-09B Living Shopping List & Shopping Mode V1** — parallel build, committed (`f2569b7`), post-build verification pending. Build file: `prd-09b-living-shopping-list-shopping-mode.md` (in this folder).

### Last signed-off builds

- **Phase 3.7 — Wizards & Seeded Templates** (2026-05-04) — 3 wizards, 3 seeded templates, NLC entry point, Drafts tab, draft persistence. Migration 100229. 6 Playwright tests. Archived in `.claude/completed-builds/2026-05/phase-3.7-wizards-seeded-templates.md`.
- **Phase 3 — Connector Layer** (2026-05-03) — 25 sub-tasks wired, 0 missing. 12 godmothers, deed_firings dispatch trigger, contracts table, IF evaluation (8 patterns), inheritance resolution, presentation layer, `/contracts` UI, `/prize-board` expansion (Allowance/Prizes/Balance). 14 Playwright tests. Migrations 100199-100225. Archived in `.claude/completed-builds/2026-05/phase-3-connector-layer.md`.
- **Workers 2+3 — Shared Routines + Shared Lists** (2026-05-02) — 9 items: 4 already wired, 5 built. Multi-instance FIRST-N-COMPLETERS, mom re-attribution, cross-sibling edit authority, list claim semantics, four-mode sharing config, week view with member colors. 13 Playwright tests. Conventions 266-270. Archived in `.claude/completed-builds/2026-05/workers-2-3-shared-routines-lists.md`.

### Full archive

The complete set of signed-off builds and their pre-build summaries lives in `.claude/completed-builds/`, organized by month:

- `.claude/completed-builds/2026-04/` — 17 build files covering Builds C through P, Phase 1b, Worker 5, and Daily Progress Marking
- `.claude/completed-builds/2026-05/` — Phase 3.7, Phase 3 Connector Layer, Universal Capability Parity Stages 1-2-3, Workers 2+3
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
