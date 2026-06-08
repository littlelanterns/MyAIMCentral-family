# Member-Day Task State — Canonical Source (Single Source of Truth)

## Status: PRE-BUILD (awaiting founder sign-off on decision file + this summary; no code dispatched)

## Founder-Approved Companion: `claude/feature-decisions/Member-Day-Task-State-Single-Source-of-Truth.md`

---

## The Principle Being Established (CONVENTION #271)

**Single Source of Truth for Member-Day Obligations.** Any code that needs to know what tasks, routine steps, opportunities, sequential items, randomizer draws, intention tallies, tracker events, homework logs, victories, or any other scoreable item counts for a member on a given date — for ANY measurement or reward purpose (allowance, gamification, homework, points, streaks, victories, custom parent reward systems, checkmark-only tracking) — reads from ONE canonical query: `get_member_day_obligations(member_id, period_start, period_end)`.

**Dashboard-truth invariant:** if a scoreable item doesn't appear on the kid's dashboard for a day, it cannot appear in ANY measurement-or-reward denominator (allowance, gamification, homework, points, custom) for that day. Display and math MUST come from the same query.

**Privacy boundary:** Privacy filters (Convention #76, kid-private journal/reflections, View-As `filterKidPrivate`) apply ON TOP of the function's output to control DISPLAY on mom-side surfaces. They do not change underlying math. A kid-private item still counts in the kid's denominator; mom just doesn't see the line item.

**Forward-facing design choice:** the function name is deliberately broad ("obligations") and the return shape includes a `source_type` discriminator. This build only fills in `source_type='routine_step'` (the bleeding case). Future builds extend the SAME function to populate other source types (`'task'`, `'opportunity_claim'`, `'sequential_item'`, `'randomizer_draw'`, `'intention_tally'`, `'tracker_event'`, `'homework_log'`, `'victory'`). Callers don't change — they get richer data automatically as source types are wired in.

---

## The Bug (concise)

Allowance History (`/settings/allowance/:memberId/history`) and the period-close allowance calc are painted-blind. Past-end-date painted routines (Upper Common Room, Kitchen Zone, Zone 2: Herringbone — all ended 5/23) are still showing in Gideon's/Miriam's/Mosiah's denominators on 5/24–5/28. Silent allowance erosion. Kids cannot see the routines on their dashboards to mark them off — only the math is affected.

Three painted-blind code paths:
1. `src/features/financial/useRoutineWeekView.ts:175-195` — TS filter checks `until`/`dtstart` but not `rdates`
2. `supabase/migrations/00000000100235_multi_pool_rpc_rewrite.sql:226-247` — SQL day-loop counts by `frequency_days` only
3. `supabase/functions/calculate-allowance-period/index.ts:615-658` — Edge Function `countAssignedTasks` no painted check

The dashboard filter (`src/lib/tasks/recurringTaskFilter.ts:65-66`) IS correct — painted routines correctly hide via `isDateActive(rdates)`. The bug is that the 3 above paths re-derive the rules without honoring the painted shape.

Source-material verification: live DB query (this session, 2026-05-28) confirmed the 3 painted production rows have `rdates` ending `2026-05-23`, `assignee_id` populated correctly, `archived_at IS NULL`. Defect is in the read paths, not the data.

## Source Material Read In Full
- `claude/feature-decisions/Member-Day-Task-State-Single-Source-of-Truth.md` (this build's decision file)
- `src/features/financial/useRoutineWeekView.ts` (full file)
- `src/features/financial/RoutineWeekEditPage.tsx` (the mom history page surface)
- `supabase/migrations/00000000100235_multi_pool_rpc_rewrite.sql` (current allowance RPC)
- `supabase/functions/calculate-allowance-period/index.ts` (Edge Function `countAssignedTasks`)
- `src/lib/tasks/recurringTaskFilter.ts` (the reference TS implementation that the SQL function must match)
- `src/components/scheduling/schedulerUtils.ts` (`isDateActive`)
- `claude/live_schema.md` (`tasks`, `task_template_sections`, `task_template_steps`, `task_completions`, `task_assignments`, `allowance_configs`, `allowance_periods`)

## Addenda / Conventions Honored
- Convention #14 (post-phase checklist Part A then Part B)
- Convention #16 (mobile/desktop nav parity — N/A this build, no new top-level pages)
- Convention #121 (`npx tsc -b` clean before close)
- Convention #246 (pg_cron → `util.invoke_edge_function` — N/A, no new cron jobs)
- Convention #257 (server-derived dates — Layer 2 RPC accepts DATE params from caller; Edge Function uses `fetchFamilyToday` pattern already in place)
- Convention #259 (template propagation contract — preserved; this build doesn't change propagation, only read consistency)
- Convention #266 (cross-sibling edit authority — preserved)
- Convention #270 (RoutineWeekEditPage week fallback — preserved; refactored caller honors same fallback)

## Locked Decisions (from decision file)
- **D1:** Solution C — canonical RPC, all callers consume it. No parallel TS predicate implementation.
- **D2:** Two-layer RPC: Layer 1 atomic boolean (`obligation_active_for_member_on_date`), Layer 2 bulk period (`get_member_day_obligations`, return shape carries pool_id + task_segment_id + is_extra_credit + homework_subject_ids per Checkpoint-1 lock). Public callers use Layer 2.
- **D3:** Three caller refactors only: `useRoutineWeekView`, `calculate_allowance_progress`, `calculate-allowance-period`.
- **D4:** `recurringTaskFilter` stays as-is this build; becomes the TS reference implementation for the invariant test.
- **D5:** Backfill migration writes `until = last_rdate` on the 3 existing painted rows. Idempotent. Also archives the orphan `assignee_id=NULL` Kitchen Zone row.
- **D6:** Convention #271 added to CLAUDE.md (exact wording in decision file).
- **D7:** Invariant test (`tests/routine-day-state-invariant.test.ts`) — TS `recurringTaskFilter` vs SQL Layer 1 across synthetic 30-day corpus.

## Database Changes Required

| Object | Change | Scope |
|---|---|---|
| `obligation_active_for_member_on_date(p_task_id UUID, p_member_id UUID, p_date DATE) RETURNS BOOLEAN` | NEW SQL function (Layer 1, internal — used only by Layer 2) | Migration `00000000100247` |
| `get_member_day_obligations(p_member_id UUID, p_period_start DATE, p_period_end DATE) RETURNS TABLE(date DATE, source_type TEXT, task_id UUID, template_id UUID, section_id UUID, step_id UUID, pool_id UUID, task_segment_id UUID, counts_for_allowance BOOLEAN, counts_for_gamification BOOLEAN, counts_for_homework BOOLEAN, is_extra_credit BOOLEAN, allowance_points INTEGER, homework_subject_ids UUID[])` | NEW SQL function (Layer 2, public). This build implements `source_type='routine_step'` only; future builds extend to other source types. **Return shape carries every grouping field a current or planned reward surface needs** (Checkpoint-1 lock 2026-06-08): `pool_id` for Phase 3.5 multi-pool allowance, `task_segment_id` for Build M sticker-earning segments, `homework_subject_ids` + `is_extra_credit` for homework/allowance reporting — so no follow-up amendment is required when those surfaces are refactored into Convention #271. This build populates allowance-relevant fields for routine_step rows; grouping fields are selected through from `tasks` (NULL where not applicable). | Migration `00000000100247` |
| `calculate_allowance_progress` | REWRITE day-loop to consume Layer 2 instead of inline `frequency_days` derivation | Migration `00000000100247` |
| `tasks` rows for 3 painted routines | UPDATE to set `recurrence_details.until = last(rdates)` where currently NULL | Migration `00000000100247` (idempotent) |
| Orphan Kitchen Zone row (`c06c706c-83bb-4279-98df-35344de7f04c`) | UPDATE `archived_at = NOW()` | Migration `00000000100247` (idempotent, conditional on existence) |

Single migration: `00000000100247_member_day_task_state_canonical_source.sql`. All SQL changes in one file so deploy is atomic.

## Caller Refactors

| Caller | File | Refactor |
|---|---|---|
| History page data hook | `src/features/financial/useRoutineWeekView.ts:140-200` | Replace inline filter + day-rendering with one `supabase.rpc('get_member_day_obligations', ...)` call |
| Allowance period close | `supabase/functions/calculate-allowance-period/index.ts:615-658` | Replace `countAssignedTasks` body with `supabase.rpc('get_member_day_obligations', ...)` |
| Allowance period RPC | `00000000100235_multi_pool_rpc_rewrite.sql:226-247` | Replaced by the new migration's rewrite — old function body becomes a call to Layer 2 |

## New Test

| Test | Location | What It Asserts |
|---|---|---|
| Routine day-state invariant | `tests/routine-day-state-invariant.test.ts` | TS `isRecurringTaskVisibleToday` agrees with SQL Layer 1 across 30-day × synthetic corpus (painted single-day, painted multi-day, painted scattered, recurring daily, recurring weekly+byday, recurring monthly, with/without until, with/without dtstart, archived, assigned-direct, assigned-via-task_assignments, shared) |

## Stubs — Do NOT Build This Phase

**Grandfathered surfaces (governed by Convention #271; refactored when next touched):**
- [ ] `roll_creature_for_completion` RPC (gamification — Build M)
- [ ] Homework time log writes (`homeschool_time_logs` via `useFinancial`, etc.)
- [ ] Victory creation paths (`createVictoryForCompletion`, `createVictoryForDeed`, victory_godmother)
- [ ] Tracker widget event recording (`widget_data_points` from various trackers)
- [ ] Best Intention tally writes (`intention_iterations`)
- [ ] Practice log writes (`practice_log` from `useLogPractice`)
- [ ] Task-level "is this assigned today" derivations in `useTasks`, `useOpportunityLists`, `useSequentialCollections`, `useFamilyOverviewData`
- [ ] `DashboardTasksSection`, `Tasks.tsx`, `SequentialCollectionView`, `widgets/trackers/*` — re-derive measurement logic inline

**Architectural follow-ups (separate builds):**
- [ ] Refactoring `recurringTaskFilter` to consume the RPC — currently the TS reference for the invariant test
- [ ] Extending `get_member_day_obligations` to populate non-routine `source_type` values (one source per follow-up build)
- [ ] Event-level audit single-source (clicked/added/deleted/grace-day attribution)
- [ ] UI redesign of history page — not in scope, data source swap only
- [ ] Backfilling `until` on non-painted recurring rows — they work correctly via RRULE path

## Cross-Feature Dependencies

| This feature | Direction | Connected to | Status |
|---|---|---|---|
| `get_member_day_obligations` (NEW Layer 2 RPC) | → | `useRoutineWeekView` (history page render) | NEW |
| `get_member_day_obligations` | → | `calculate_allowance_progress` (allowance calc) | NEW |
| `get_member_day_obligations` | → | `calculate-allowance-period` Edge Function | NEW |
| `obligation_active_for_member_on_date` (NEW Layer 1) | → | `recurringTaskFilter` (TS reference) via invariant test only | NEW |
| Future: `roll_creature_for_completion` (gamification) | → | RPC via Convention #271 | GRANDFATHERED |
| Future: homework time log writes | → | RPC via Convention #271 | GRANDFATHERED |
| Future: victory creation paths | → | RPC via Convention #271 | GRANDFATHERED |
| Future: tracker widget event recording | → | RPC via Convention #271 | GRANDFATHERED |
| Future: kid My Rewards stub | → | RPC via Convention #271 | STUB |
| Future: Family Overview if refactored | → | RPC via Convention #271 | STUB |

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| Allowance History page (`/settings/allowance/:memberId/history`) — per-day step lists, per-day counts | Mom | Modification — data source swap, no visual redesign |
| Mom Dashboard `AllowanceCalculatorTracker` widget | Mom | Verify — values may shift downward (correctness fix) |
| Mom-facing Prize Board → Allowance tab | Mom | Verify — current-period progress shifts |
| Kid dashboards (regression guard, no expected change) | Adult/Independent/Guided/Play | Verify only — `recurringTaskFilter` unchanged |

## Mom-UI Verification (populate during build)

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Gideon history week 5/24–5/30 — Upper Common Room no longer shown on Sun/Mon | | | | Mom | | |
| Gideon history week 5/24–5/30 — denominator drops to honest count | | | | Mom | | |
| Miriam history week 5/18–5/24 — Kitchen Zone shows ONLY on 5/22, 5/23 | | | | Mom | | |
| Mosiah history week 5/18–5/24 — Zone 2: Herringbone shows ONLY on 5/18–5/23 | | | | Mom | | |
| Helam history week 5/18–5/24 — unchanged where unaffected (regression guard) | | | | Mom | | |
| Mom Dashboard `AllowanceCalculatorTracker` — current-period % reflects corrected denominators | | | | Mom | | |
| Mom Prize Board → Allowance tab — per-kid current-period progress reflects corrected denominators | | | | Mom | | |
| Gideon's Guided dashboard — `recurringTaskFilter` behavior unchanged (regression guard) | | | | Guided | | |
| Miriam's Adult dashboard — same regression guard | | | | Adult | | |
| Mosiah's Independent dashboard — same regression guard | | | | Independent | | |
| Invariant test — passes deterministically across 3 consecutive runs | | | | n/a | `tests/routine-day-state-invariant.test.ts` | |

## Worker Decomposition (single worker, multiple discrete steps)

This is small enough to be one worker, not a multi-worker phase. Order matters within the worker:

1. **Write the invariant test first** (`tests/routine-day-state-invariant.test.ts`). Fails against the current state. This locks in the contract before any RPC is written.
2. **Write migration `00000000100247`** — Layer 1 + Layer 2 SQL functions + rewrite `calculate_allowance_progress` + backfill 3 painted rows + archive orphan row. Apply via `supabase db push --linked`.
3. **Regenerate `claude/live_schema.md`** via `npm run schema:dump`.
4. **Refactor `useRoutineWeekView.ts`** to consume Layer 2 RPC. Smoke-test in browser (mom views Gideon's history).
5. **Refactor `calculate-allowance-period/index.ts` `countAssignedTasks`** to consume Layer 2 RPC. Deploy with `supabase functions deploy calculate-allowance-period --no-verify-jwt` per Convention #246.
6. **Run invariant test** — must pass.
7. **`npx tsc -b`** — must be clean.
8. **`npm run lint`** — must be clean (no new errors).
9. **Populate Mom-UI Verification table** at all 3 viewports for each row.
10. **Add Convention #271 to CLAUDE.md** with the exact wording from D6.
11. **Update STUB_REGISTRY.md** with the explicit out-of-scope items.
12. **Update WIRING_STATUS.md** noting the RPC as new shared infrastructure with three named consumers.
13. **Copy Post-Build Verification table** to the feature-decision file.

## Build-Wide Disciplines (carried forward from View-As build)

These applied to View-As and are explicitly carried forward to this build per the project-wide pattern:

### Discipline 1 — Runtime smoke test for any new column / new RPC writes
For every Layer 2 RPC call the worker introduces, the Checkpoint 2 report MUST include a runtime smoke test result (actual rows returned for at least one known production member-period, compared against expected output). `tsc -b passed` is insufficient evidence per the project's pre-existing-no-generated-types posture.

### Discipline 2 — Post-build insert-path verification
Checkpoint 5 audit MUST query production after deploy:
- `recurrence_details->>'until'` populated on the 3 painted rows
- Orphan Kitchen Zone row `archived_at IS NOT NULL`
- One Layer 2 RPC call against Gideon + week 5/24–5/30 returns zero rows for the 3 expired painted templates

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Layer 1 SQL diverges from `recurringTaskFilter` on an edge case | Medium | High | Invariant test covers synthetic 30-day corpus; fails CI on disagreement |
| History page performance regresses (now one RPC call instead of one big SELECT) | Low | Medium | Layer 2 returns full period in one round-trip; EXPLAIN ANALYZE during build |
| Allowance amounts shift mid-period, surprising kids who saw a higher balance | Medium | Medium | Founder eyeballs current values; documents whether to honor old or correct value per kid in verification table |
| Backfill collides with new deploys | Very low | Low | Migration UPDATE is conditional on `until IS NULL`; idempotent |
| Worker forgets to deploy Edge Function with `--no-verify-jwt` | Low | Medium | Step 5 of build order explicitly calls it out; Convention #246 governs |
| Convention #271 wording is too broad and accidentally blocks legitimate future work | Low | Low | Decision-file wording was explicitly scoped to routine-day state; opportunities have their own lifecycle and are not covered |
| The "shifting allowance amount" change is read by a kid mid-period and they panic | Low | Medium | This is a mom-only screen; kid surfaces don't show denominators. Kid-visible balances only change at period close. |

## Pre-Build Founder Sign-Off Required
- [ ] Decision file D1-D7 confirmed
- [ ] This build file's scope / order / verification table acceptable
- [ ] Convention #271 wording acceptable (or revised)
- [ ] Stubs list acceptable
- [ ] **Approved to dispatch single worker**

## Post-Build Founder Sign-Off
- [ ] Mom-UI Verification table fully ✅ at 3 viewports
- [ ] Zero Missing in Post-Build Verification
- [ ] `npx tsc -b` clean
- [ ] `npm run lint` clean
- [ ] Invariant test passes deterministically 3x
- [ ] Convention #271 in CLAUDE.md
- [ ] STUB_REGISTRY.md updated
- [ ] WIRING_STATUS.md updated
- [ ] `claude/live_schema.md` regenerated
- [ ] Feature-decision file Post-Build section populated
- [ ] **Approved to commit**
- [ ] **Approved to push**
