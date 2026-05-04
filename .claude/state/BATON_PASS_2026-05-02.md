# Baton Pass — 2026-05-02

## What just shipped

**Workers 2+3 — Shared Routines + Shared Lists behavioral layer** (commit `b255217`)

9 items resolved — 4 verified already wired, 5 built:
- Multi-instance FIRST-N-COMPLETERS with per-instance completer colors
- Mom re-attribution via clickable "done by [Name]" picker on shared routine steps
- Cross-Sibling Edit Authority — shared items are mom-edit-only (Convention 266)
- List item "I'm on it" claim semantics with member colors (migration 100196)
- ShareListModal "Shared list" / "Individual copies" mode toggle
- RoutineWeekEditPage expanded for shared tasks — 7-day fallback, completer names+colors
- "View this week →" entry point on shared routine step checklists (mom only)
- 13 Playwright e2e tests all green
- Conventions 266-270 added to CLAUDE.md
- WIRING_STATUS.md updated — 5 new Wired entries replacing the shared routines Stub

**Pre-commit override recorded:** `useRoutineWeekView.ts` uses `.toISOString().slice(0,10)` on an explicitly UTC-constructed date (`T12:00:00Z` + `setUTCDate`). Same pattern as existing line 134 in the same file. Override reason documented in `.claude/state/OVERRIDES.md`.

## Uncommitted work in the tree

BookShelf bug fixes from a parallel session are still uncommitted:
- `src/components/bookshelf/` (6 files), `src/hooks/useExtractionData.ts`, `useExtractionItemActions.ts`, `src/lib/extractionActions.ts`, `src/pages/BookShelfPage.tsx`
- `supabase/functions/bookshelf-discuss/index.ts`, `bookshelf-study-guide/index.ts`
- `src/components/beta/GlitchReporterFAB.tsx`, `src/components/rhythms/sections/MorningInsightSection.tsx`
- 2 PRD-23 addenda, `STUB_REGISTRY.md`, `package-lock.json`
- 2 new migrations (100194 bookshelf_reading_positions, 100195 dedup_book_discussion_mode_key)
- 1 new hook `useBookReadingPosition.ts`, Worker 4 Playwright test
- DO NOT commit or modify these files in the next session unless finishing the BookShelf work

## What's next: Phase 3 — Connector Layer

The dispatch prompt is already drafted in `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §11 (line 935). It's a big build (21 sub-tasks) with 14 investigation prompts that must run before code starts.

### Recommended session structure:

1. **Fresh orchestrator session** — paste the Phase 3 dispatch prompt from §11
2. **Before any code:** run investigations 1-17 from §5 (lines 245-590). These are paste-ready research prompts. INV 1-14 are Phase 3 prerequisites; INV 15-17 cover Phase 3.5 pool topics but may inform Phase 3 decisions. Results inform the sub-task sequence.
3. **After investigations:** founder reviews results and approves the sub-task sequence
4. **Build sub-tasks 1-21** per §6.2, one commit per sub-task

### Key reference docs for Phase 3:
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — the Phase 2 build plan (authoritative)
- `claude/web-sync/Connector-Architecture-and-Routing-Model.md` — Phase 1 design (vocabulary, schema)
- `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` — cross-cutting principles
- `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — existing reward infrastructure
- `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — existing connector infrastructure
- `claude/web-sync/Connector-Build-Sequence-Orientation.md` — orientation doc

### Infrastructure now available that Phase 3 inherits:
- `deed_firings` table (migration 100180, Worker 5)
- `fire-painted-schedules` Edge Function (hourly cron, Worker 5)
- `instantiation_mode` + `collaboration_mode` columns on tasks and lists
- `pending_changes` table + cron auto-apply (Stage 3)
- Shared routine completion with member attribution (Workers 2+3)
- `useDuplicateListForMembers` for individual-copy list sharing (Workers 2+3)

### Current migration number: `00000000100196`
### Next migration starts at: `00000000100197`
### `tsc -b`: 0 errors at time of baton pass
