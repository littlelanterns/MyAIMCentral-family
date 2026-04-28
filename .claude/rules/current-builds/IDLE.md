# Active Build Context

> This folder lives at `.claude/rules/current-builds/` and is auto-loaded into every Claude Code session via the native `.claude/rules/` recursive discovery mechanism (no explicit `@`-reference in CLAUDE.md required). One `.md` file per in-flight build (kebab-case filename matching the build identity, e.g. `PRD-30-safety-monitoring.md`). When nothing is active, only this `IDLE.md` file exists.
>
> Build files in this folder **must not include YAML `paths:` frontmatter** — frontmatter with `paths:` makes the file path-conditional, which breaks the unconditional auto-load pattern this folder relies on.

## Status: IDLE

No builds are currently in flight. No code should be written without starting the pre-build process per `claude/PRE_BUILD_PROCESS.md`.

### Last signed-off builds

- **Daily Progress Marking** (2026-04-28) — 55 requirements: 47 wired, 8 stubbed, 0 missing. 13 Playwright tests, 6 UT items pending multi-member verification. Long Term Task type, soft-claim, duration tracking. Verification in `claude/feature-decisions/PRD-09A-Daily-Progress-Marking.md`.
- **Worker 5 — Painter / Universal Scheduler Upgrade** (2026-04-27) — 8 sub-tasks complete, 0 missing. Pick Dates painted-calendar mode, deed_firings table, per-date assignee editor, time-of-day windows, fire-painted-schedules Edge Function, Active today badge. Verification in `claude/feature-decisions/Worker-5-Painter-Universal-Scheduler-Upgrade.md`.
- **Build P — PRD-16 Meetings** (2026-04-16) — 127 requirements verified: 114 wired, 13 stubbed, 0 missing. Verification table in `claude/feature-decisions/PRD-16-Meetings.md`.
- **Build M — PRD-24 + PRD-26 Play Dashboard + Sticker Book + Configurable Earning Strategies** (formalized 2026-04-16, originally recorded 2026-04-13) — 42 wired, 12 stubbed, 0 missing. Verification tables in `claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md` and `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md`.
- **Build O — PRD-28 Tracking, Allowance & Financial** (2026-04-13) — archived in `.claude/completed-builds/2026-04/build-o-prd-28-tracking.md`.
- **Phase 1b — PRD-23 BookShelf Platform Migration** (2026-04-13) — archived in `.claude/completed-builds/2026-04/phase-1b-prd-23-bookshelf-platform-migration.md`.

### Full archive

The complete set of signed-off builds and their pre-build summaries lives in `.claude/completed-builds/`, organized by month:

- `.claude/completed-builds/2026-04/` — 17 build files covering Builds C through P, Phase 1b, Worker 5, and Daily Progress Marking
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
