# Build History — MyAIM Central

> Append-only log of build closures and baton-passes.
> Updated by the orchestration layer at every close-out (Checkpoint 6).
> For the current state snapshot, see `CURRENT.md`.

---

## 2026-04-28 — Daily Progress Marking CLOSED

**Type:** PRD-driven build (PRD-09A Addendum)
**Scope:** "Worked on this today" for multi-day tasks + routine steps, optional duration capture, soft-claim, aggregation display, Long Term Task type
**Duration:** Single long session (orchestrator + executor combined)
**Final state:** All addendum §12 requirements verified. 13 Playwright tests pass. 8 stubs filed.
**Commits:** 617c44a, e6d3f64, 1e59840, 7a5e985, 3350dda, f207e99 + close-out commit

### What shipped
- 4 migrations (100183-100186): track_progress, in_progress_member_id, list defaults, CHECK extension, feature keys
- Long Term Task as first-class Task Type in the creation picker
- "Worked on this today" button on TaskCard (standard, Guided, Play variants)
- DurationPromptModal with 6 chips + min/hr custom input + skip
- Soft-claim authorization + cross-claim warning + Done-blocked modal + "Ask Mom" via PRD-15 family_requests
- Aggregation subtitle: "N sessions · X hours" with cache invalidation + success toast
- Track property inheritance across Paths A (opportunity claim), B (routine step), C (list promotion), E (direct creation), F (rhythm capture), G (MindSweep sort)
- List-level tracking defaults + per-item tri-state overrides
- resolveTrackingProperties(), checkSoftClaimAuthorization(), formatPracticeAggregation() helpers
- Emoji convention updated: no emoji anywhere including Play shell
- 6 CLAUDE.md conventions added (260-265)

### 9 post-sub-task-12 discoveries (eyes-on review findings)

1. **Phantom feature gate.** `useCanAccess` on newly-registered feature keys returned false despite `feature_access_v2` rows existing — cache/timing issue. Fix: don't gate creation-time toggles on useCanAccess; gate at the type-picker level instead (picking Long Term Task IS the toggle).
2. **Task Type vs Advanced toggle.** A structurally different kind of task deserves a first-class type, not a buried checkbox. Convention 260 codifies this.
3. **Vercel config.toml gap.** Worker 5's Edge Function shipped without a config.toml entry. Pre-existing, blocked deploy.
4. **Grid layout orphan.** Odd number of tiles in a 2-column grid leaves one half-width alone. Moving List into the grid array fixed it.
5. **Prop not threaded through DnD wrapper.** `onWorkedOnThis` was threaded through 8 layers of components correctly but missed at the `<SortableTaskItem>` JSX call site. Convention 262 codifies the full threading checklist.
6. **Minutes-only custom input.** Users type hours, not 480-minute values. Added min/hr segmented toggle.
7. **Missing cache invalidation for aggregations.** Mutation invalidated the parent entity key but not the aggregation query key. Convention 261 codifies this.
8. **No success feedback.** Practice log write succeeded silently. Added toast confirmation.
9. **Incorrect PRD-15 deferral.** `useCreateRequest` was fully operational since Build G. "Ask Mom" wired to fire a real request instead of stubbing.

### Patterns worth watching in future builds
- **Phantom feature gate:** newly-registered feature keys may not resolve on first render. Don't gate creation-time UI on useCanAccess for new features in the same build.
- **DnD wrapper call-site gap:** SortableItem wrappers render their child component — any new prop on the child must also appear at the wrapper's JSX call site, not just in its interface.
- **Aggregation key discipline:** if you add a new aggregation query, grep for every mutation that feeds it and add the invalidation at each site.
- **Deferred deferral:** before filing a "PRD-XX not ready" stub, grep the codebase to check if the infrastructure already shipped.

### Spec observations for future sessions
- Single-window combined orchestrator+executor worked well for this build size (12 sub-tasks, sequential, single coherent surface). For Workers 2+3 (multi-surface, more concurrent decisions), multi-window separation is likely better. Spec needs to clarify when single-window is appropriate vs multi-window separation.

---

## 2026-04-27 — Conductor Session: Connector Architecture Orchestration + Worker 5 + Daily Progress Marking Scoping

**Type:** Multi-phase conductor session (Plan Mode → Execute Mode → Plan Mode pivot)
**Duration:** Single long session covering orchestration setup, Worker 5 dispatch/monitoring, Workers 2+3 scoping, and Daily Progress Marking pivot

### What shipped
- **Worker 5 (Painter / Universal Scheduler Upgrade)** — commits 3f0b802 + 6775e09. Pick Dates mode, deed_firings table, fire-painted-schedules Edge Function + cron, per-date assignee editor, time-of-day windows, Active today badge on list cards. 8 sub-tasks, all signed off.
- **Connector architecture design docs** — orientation prompt, coordination brief (with verb-form lock §2.10 and deed-firings table ownership updates), build plan updates, Worker 5 dispatch prompt, Worker 5 review checklist.
- **Orchestration state infrastructure** — CURRENT.md, HISTORY.md, orchestration artifacts.

### What was scoped but paused
- **Workers 2+3 (Shared Routines + Shared Lists)** — full scoping complete: 8 founder questions answered, two discovery passes (practice/mastery infrastructure status + list claim semantics), bug reports triaged for adjacent surfaces, borderline items identified. Paused for Daily Progress Marking detour. Preserved at `.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md`.

### What was scoped for next session
- **Daily Progress Marking (PRD-09A addendum)** — addendum authored by founder, Q1-Q6 answered and locked, pre-build notes saved. Dispatch prompt generated for fresh orchestrator session.

### Observations
- **Verb-form source_type lock was the right call.** Pre-parallel investigation surfaced the three-style naming gap; locking before workers shipped prevented migration churn. Convention §2.10 added to Coordination Brief.
- **Deed-firings table ownership shift to Worker 5 was the right call.** Worker 5 shipped the table and wrote real firings; Phase 3 inherits rather than creates. Painted-day firings are observable immediately.
- **Discovery pass depth matters.** First discovery for Workers 2+3 missed the Build J practice/mastery infrastructure gap (schema existed but UI was partially unwired). Second pass caught it. This drove the Daily Progress Marking detour — planning-side review caught what execution-side wouldn't have.
- **The "two-fires" triage pattern works.** Bug reports + triage worksheet cross-reference surfaced 4 bug reports adjacent to Workers 2+3 surfaces (routine lifecycle, Herringbone duplicates, overdue-past-end-date). Folding them into Workers 2+3 scope prevents separate bug-fix passes on the same surfaces.
- **Dispatch prompt framing matters.** Initial dispatch prompt framed the next session as a "worker with locked scope" — founder corrected to "orchestrator adopting the role for the entire build." The orchestration layer's design is that every fresh session IS the orchestrator; there's no separate long-lived coordinator.

### Commits this session
- `9dc7a60` — docs: connector architecture plans, Daily Progress Marking addendum, orchestration state (13 files, 5098 insertions)
- `0a592ce` — feat: orchestration layer infrastructure (pre-existing, from parallel work)
- Worker 5 commits monitored but authored in separate session: `3f0b802` + `6775e09`

### Next session
Fresh orchestrator session dispatching Daily Progress Marking build. Dispatch prompt at `claude/web-sync/Daily-Progress-Marking-Dispatch-Prompt.md`. After that build closes, Workers 2+3 resumes.
