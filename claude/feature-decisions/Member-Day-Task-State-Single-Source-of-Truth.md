# Member-Day Task State — Single Source of Truth

## Status: PRE-BUILD (decision file — locked decisions for the build to execute against)

## Created: 2026-05-28

## The Named Principle

**Single Source of Truth for Member-Day Obligations.** Every surface that needs to know what counts for a member on a given date — for ANY measurement or reward purpose (allowance, gamification, homework hours, victories, points, streaks, custom parent reward systems, checkmark-only behavior tracking, any future measurement surface mom invents) — reads from ONE canonical query. No surface re-derives the rules from `tasks` + `task_template_sections` + `recurrence_details` + `task_completions` + `task_assignments` + any other source independently.

**The dashboard-truth invariant:** if a scoreable item doesn't appear on the kid's dashboard for a given day, it cannot appear in ANY measurement-or-reward denominator (allowance, gamification, homework, points, custom, etc.) for that day. Display surface and math surface MUST come from the same query.

**Scope of "obligations":** routine steps, regular tasks with due dates, long-term tasks with daily progress marking, opportunities claimed, sequential collection currently-active items, randomizer draws of the day, Best Intention tally targets, tracker widget events, homework time targets, victories, and any future scoreable item type. The canonical function returns a unified shape regardless of source.

**Privacy boundary:** privacy filters (Convention #76 Privacy Filtered, kid-private journal/reflections, View-As `filterKidPrivate`) apply ON TOP of this function's output to control DISPLAY for mom-side surfaces. They do not change the underlying math — a kid-private item still counts the same toward their measurements; mom just doesn't see the line item.

This principle is broader than this build's immediate implementation. It establishes the architectural rule that ALL future builds must honor.

## The Triggering Bug

Gideon's Allowance History page (`/settings/allowance/:memberId/history`) showed past-end-date painted routines (Upper Common Room ended 5/23) in his denominator on 5/24, 5/25, 5/26. He had no way to see this on his own dashboard — only mom did, only via the audit history view. His allowance was being silently reduced for routines he was never scheduled to do.

Founder words (2026-05-28): "He doesn't even have a way on his own dashboard to mark these off if he wanted to, so I don't like that they are hidden/still assigned to him, just quietly lessening his allowance calculations, without him even having a way of seeing something is wrong. If he hadn't forgotten to mark his kitchen jobs yesterday, we wouldn't have discovered this. I assume it is also going on for my other kids."

## Root Cause (three places, each painted-blind)

1. **`useRoutineWeekView.ts:175-195`** — filters by `until` and `dtstart` but never checks `schedule_type='painted'` or the `rdates` array. The 3 production painted rows (Upper Common Room, Kitchen Zone, Zone 2: Herringbone) deployed before fix `71abaeb` (2026-05-28) have `rdates` but no `until` — so this filter passes them through every day-of-week-matching day.
2. **`calculate_allowance_progress` RPC (migration 100235, lines 226-247)** — day-loop counts `task_template_sections` whose `frequency_days` matches the day-of-week. Doesn't check painted `rdates`. THIS is what's actually reducing the allowance percentage.
3. **`calculate-allowance-period` Edge Function (`countAssignedTasks`, lines 615-658)** — counts tasks with `counts_for_allowance=true` and date-range match. No painted check at all.

## Locked Decisions (founder-approved before workers dispatch)

### D1: Solution C — canonical RPC, all callers consume it
- One SQL function is the source of truth for "is this routine step assigned to this member on this date?"
- TypeScript callers consume via `supabase.rpc()` — no parallel TS implementation of the predicates
- Performance: bulk variant returns per-period results in one round-trip so the history page does not fire 70+ calls

### D2: RPC signature (subject to refinement during the build, but shape locked)

Two layers:

**Layer 1 (atomic, internal) — `obligation_active_for_member_on_date(p_task_id UUID, p_member_id UUID, p_date DATE) RETURNS BOOLEAN`**
- Internal SQL function used only by Layer 2 — not called directly by TS callers
- Encodes ALL the predicates for a single task's activity on a given day:
  - `tasks.archived_at IS NULL OR archived_at > p_date`
  - `tasks.created_at <= p_date + interval '1 day'`
  - If `recurrence_details.dtstart` is set: `dtstart <= p_date`
  - If `recurrence_details.until` is set: `until >= p_date`
  - If `schedule_type = 'painted'`: `p_date::TEXT = ANY(recurrence_details->'rdates')`
  - Assignee match: `assignee_id = p_member_id` OR row in `task_assignments` where `member_id = p_member_id`
  - Shared routine semantics preserved per Convention #266

**Layer 2 (bulk, public) — `get_member_day_obligations(p_member_id UUID, p_period_start DATE, p_period_end DATE) RETURNS TABLE(date DATE, source_type TEXT, task_id UUID, template_id UUID, section_id UUID, step_id UUID, pool_id UUID, task_segment_id UUID, counts_for_allowance BOOLEAN, counts_for_gamification BOOLEAN, counts_for_homework BOOLEAN, is_extra_credit BOOLEAN, allowance_points INTEGER, homework_subject_ids UUID[])`**
- The public RPC every caller uses to ask "what counts for this kid on this day?"
- One round-trip per period
- **Grouping-field lock (Checkpoint-1, 2026-06-08):** the return shape carries every grouping field a current OR planned reward surface needs, so no follow-up amendment is required when those surfaces are refactored into Convention #271. `pool_id` → Phase 3.5 multi-pool allowance (5/6); `task_segment_id` → Build M gamification sticker-earning segments; `homework_subject_ids` + `is_extra_credit` → homework hour reporting + extra-credit handling. This build populates allowance-relevant fields for `routine_step` rows; grouping fields are projected through from `tasks` and are NULL where not applicable to a routine step. Convention #271 wording is unchanged — it points at the function; the function carries the data.
- `source_type` discriminator — values currently supported: `'routine_step'`. Future values (not in this build): `'task'`, `'long_term_progress'`, `'opportunity_claim'`, `'sequential_item'`, `'randomizer_draw'`, `'intention_tally'`, `'tracker_event'`, `'homework_log'`, `'victory'`. Future builds extend this function — they do NOT create new functions.
- For routine_step rows: joins Layer 1 across the period × candidate tasks × template_sections × steps; honors `task_template_sections.frequency_days` for per-day-of-week section filtering (this is correct existing behavior, not the bug)
- For other source_types: this build returns empty for them. Future builds wire each one in.
- Naming: deliberately broad ("obligations" not "routine steps") so future builds extend rather than rename.

### D3: Caller refactors (the only callers touched in this build)

1. **`useRoutineWeekView` (history page)** — replace raw filter at lines 175-195 + day-by-day rendering logic with one call to `get_member_day_obligations(memberId, periodStart, periodEnd)`.
2. **`calculate_allowance_progress` RPC** — rewrite the WHILE loop at lines 226-247 to call `get_member_day_obligations` instead of re-deriving day-of-week filtering inline.
3. **`calculate-allowance-period` Edge Function (`countAssignedTasks`)** — replace direct `tasks` query with `get_member_day_obligations` aggregated by task_id.

> **Naming reconciliation (Checkpoint-1 lock, 2026-06-08):** earlier drafts of this file referred to the Layer 2 function as `get_active_routine_steps_for_member` and the Layer 1 function as `routine_active_for_member_on_date`. Those names are **superseded**. The canonical names are `get_member_day_obligations` (Layer 2, public) and `obligation_active_for_member_on_date` (Layer 1, internal) — matching the active build file and Convention #271. Any remaining stale reference below is to be read as the broad name.

### D4: Dashboard filter (`recurringTaskFilter`) — NOT refactored this build
- Currently working correctly (verified during the bug triage)
- Refactoring it risks dashboard regression
- The convention text REQUIRES future dashboard-filter changes to use the RPC; for now `recurringTaskFilter` stays as-is and is the TS-side reference implementation that the SQL function must match exactly
- A unit test asserts the RPC's per-day output exactly matches `recurringTaskFilter`'s decision for the same input (the invariant test)

### D5: Backfill the 3 existing painted rows
- One-shot migration (idempotent, conditional): for each `tasks` row where `task_type='routine'` AND `recurrence_details->>'schedule_type'='painted'` AND `recurrence_details->>'until' IS NULL`, set `recurrence_details = jsonb_set(recurrence_details, '{until}', to_jsonb(rdates[array_length(rdates,1)]))`. This makes them visible to any future fast-path until-check, defense-in-depth.
- Affects 3 rows in production. Verified before backfill via SELECT count.

### D6: Convention text added to CLAUDE.md

Proposed wording (locked at sign-off):

> **271. Single Source of Truth for Member-Day Obligations.** Any code that needs to know what tasks, routine steps, sections, opportunities, sequential items, randomizer draws, intention tallies, tracker events, homework logs, victories, or any other scoreable item counts for a member on a given date MUST call `get_member_day_obligations(member_id, period_start, period_end)`. Do not re-derive the predicates inline. This applies across EVERY measurement, reward, and consequence surface — including but not limited to: kid dashboards, history/edit-past-days views, allowance numerator/denominator calculations, gamification rolls, homework hour reporting, points awarding, streak tracking, victory creation, checkmark-only behavior tracking, completion approvals, grace-day adjustments, painted-schedule honoring, scheduled-start gating, soft-claim resolution, shared-routine attribution, and any future surface mom invents to measure or reward family-member activity.
>
> **The dashboard-truth invariant:** if a scoreable item does not appear on the kid's dashboard for a given day, it cannot appear in ANY measurement-or-reward denominator (allowance, gamification, homework, points, custom, etc.) for that day. Display surface and math surface MUST be derived from the same query.
>
> **Privacy boundary:** Privacy filters (Convention #76 Privacy Filtered, kid-private journal/reflections, View-As `filterKidPrivate`) apply ON TOP of this function's output to control DISPLAY on mom-side surfaces. They do not change the underlying math — a kid-private item still counts the same toward their measurements; mom just doesn't see the line item.
>
> **TS reference implementation:** the current dashboard implementation (`src/lib/tasks/recurringTaskFilter.ts`) is the TS reference for the routine-step portion. The SQL function MUST produce identical decisions for identical inputs, asserted by `tests/routine-day-state-invariant.test.ts`. As future builds extend the function to cover non-routine source types, the invariant test corpus extends with them.
>
> **Grandfathered surfaces (governed but not refactored yet):** the following surfaces currently re-derive measurement logic inline. They are grandfathered as-is. **Any change to them MUST refactor them to consume `get_member_day_obligations` as part of that change.** The list is in `STUB_REGISTRY.md` under "Member-Day Obligations — Grandfathered" and is updated when new surfaces are discovered:
>   - `roll_creature_for_completion` RPC (gamification — Build M)
>   - Homework time log writes (`homeschool_time_logs`)
>   - Victory creation paths (`victories` inserts)
>   - Tracker widget event recording (`widget_data_points`)
>   - Best Intention tally writes (`intention_iterations`)
>   - Practice log writes (`practice_log`)
>   - Any task-level (non-routine) "is this assigned today" derivation in `useTasks`, `useOpportunityLists`, `useSequentialCollections`, `useFinancial`
>
> Any new code asking "what counts for this member on this day" — regardless of measurement type, regardless of source type — MUST call the function. No exceptions.

### D7: Invariant test
- New file: `tests/routine-day-state-invariant.test.ts`
- Generates a corpus of synthetic `tasks` rows covering: painted (single-day, multi-day, scattered), recurring (daily, weekly with byday, monthly), with/without `until`, with/without `dtstart`, archived/active, assigned-direct vs assigned-via-task_assignments, shared
- For each (row, date) pair across a 30-day window, asserts:
  - `recurringTaskFilter.isRecurringTaskVisibleToday(row, date)` (TS) === Layer 1 SQL predicate (via test RPC harness)
  - If both agree the row is visible, the row appears in `get_member_day_obligations` output for that date
  - If either says hidden, the row does NOT appear in output
- Test fails CI if the two implementations disagree on any case

## Stubs — explicitly out of scope this build

**Grandfathered surfaces (governed by Convention #271; refactored when next touched, not this build):**

- **`roll_creature_for_completion` RPC** (gamification — Build M) — uses `task_completions.id` keyed pipeline; next change to gamification math MUST consume `get_member_day_obligations`
- **Homework time log writes** (`homeschool_time_logs`) — `useFinancial` and related — next change MUST consume the function
- **Victory creation paths** (`createVictoryForCompletion`, `createVictoryForDeed`, and victory_godmother) — next change MUST consume the function
- **Tracker widget event recording** (`widget_data_points` writes from various trackers) — next change MUST consume the function
- **Best Intention tally writes** (`intention_iterations`) — next change MUST consume the function
- **Practice log writes** (`practice_log` from `useLogPractice`) — next change MUST consume the function
- **Task-level (non-routine) "is this assigned today" derivations** in `useTasks`, `useOpportunityLists`, `useSequentialCollections`, `useFinancial`, `useFamilyOverviewData` — next change MUST consume the function
- **`src/components/tasks/DashboardTasksSection.tsx`, `src/pages/Tasks.tsx`, `src/components/tasks/sequential/SequentialCollectionView.tsx`, `src/components/widgets/trackers/*`, `src/components/studio/wizards/*`** — all currently re-derive at least some portion of "what's measurable for this kid today" inline; next change to any of them MUST consume the function

**Architectural follow-ups (separate scoped builds):**

- **Refactoring `recurringTaskFilter` to consume the RPC.** Currently the TS reference for the invariant test. A future build replaces it with a thin wrapper around the RPC; until then, the invariant test catches drift.
- **Extending `get_member_day_obligations` to populate non-routine source_types.** Each non-routine measurement source (tasks, opportunities, sequentials, randomizers, intentions, trackers, homework, victories) gets its own follow-up build that extends the function and updates the test corpus. Not a single mega-build; one source_type at a time as the surfaces are touched.
- **Event-level audit single-source** (clicked/added/deleted/grace-day attribution) — broader follow-up; this build covers obligation-side ("what should count") but the same principle could extend to credit-side ("what got done").

**Single-row cleanups (this build handles):**

- **The orphan Kitchen Zone task (`c06c706c-83bb-4279-98df-35344de7f04c`, `assignee_id=NULL`).** Archived by the migration's idempotent cleanup step.

**Not this build, not blocking:**

- **Backfilling `until` on non-painted recurring rows that lack it.** Not in scope — they work correctly via the existing RRULE path.
- **UI surface changes to the history page beyond replacing the data source.** Display layout, columns, copy, day grouping — all unchanged. This is a wiring fix, not a redesign.
- **Performance tuning of the RPC.** Index review and EXPLAIN ANALYZE happen during the build; if a slow-path is identified, fix it in-build. Architectural redesign of the schema for read performance is post-MVP.

## Cross-PRD findings surfaced for future cleanup (not this build)

- The orphan `assignee_id=NULL` Kitchen Zone row suggests a deploy flow that creates a parent row without an assignee at some point. Worth a separate sweep to find and prevent. Not blocking.
- Founder mentioned grace days and clicked/added/deleted events should all flow from the same data. This build covers routine-day-state. A future build may extend the same single-source pattern to event-level audit (completion attribution, deletion semantics, grace day application). Tracked as `Allowance-Event-Single-Source` follow-up candidate.

## Mom-UI Surfaces touched

| Surface | Shells | New / Modification |
|---|---|---|
| Allowance History page (`/settings/allowance/:memberId/history`) — past-day step lists, per-day counts (`0/5`, `10/37`, etc.) | Mom | Modification — data source swap, no visual redesign |
| Allowance widget on Mom Dashboard (`AllowanceCalculatorTracker`) | Mom | Verify — values may shift downward by removing erroneously-counted days |
| Mom-facing Prize Board → Allowance tab | Mom | Verify — current period progress may shift |
| Kid-facing My Rewards stub (when built) | Adult/Independent/Guided | N/A this build (stub) — but Convention #271 applies when it's wired |

## Mom-UI Verification (populate during the build)

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| `/settings/allowance/:gideon/history` — Sun 5/24 row no longer lists Upper Common Room or Kitchen Zone | | | | Mom | | |
| `/settings/allowance/:gideon/history` — week 5/24–5/30 denominator drops to honest count | | | | Mom | | |
| `/settings/allowance/:miriam/history` — Kitchen Zone shows only on 5/22, 5/23 in week 5/18–5/24 | | | | Mom | | |
| `/settings/allowance/:mosiah/history` — Zone 2: Herringbone shows only on 5/18–5/23 in week 5/18–5/24 | | | | Mom | | |
| `/settings/allowance/:helam/history` — denominators unchanged where unaffected | | | | Mom | | |
| `AllowanceCalculatorTracker` on Mom Dashboard — current-period % reflects corrected denominators | | | | Mom | | |
| Mom Prize Board → Allowance tab — current period progress per kid reflects corrected denominators | | | | Mom | | |
| Kid dashboards (Guided + Play + Adult/Independent) — `recurringTaskFilter` behavior unchanged (regression guard) | | | | Guided/Play/Adult/Independent | | |
| Invariant test — TS `recurringTaskFilter` vs SQL Layer 1 agreement across 30-day × synthetic corpus | | | | n/a | `tests/routine-day-state-invariant.test.ts` | |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RPC output diverges from `recurringTaskFilter` on edge cases (timezone, single-day painted, completion-dependent) | Medium | High | Invariant test (D7) covers a 30-day × synthetic-corpus matrix. Fails CI on disagreement. |
| History page slow after refactor (one RPC call per page instead of one big SELECT) | Low | Medium | Bulk Layer 2 signature returns full period in one round-trip. EXPLAIN ANALYZE during build. |
| Allowance amounts shift for in-progress periods, surprising kids who already see balances | Medium | Medium | Founder eyeballs current-period values before the worker commits; if any kid's earned amount drops, mom decides whether to honor old number or correct number. Document outcome in verification table. |
| RPC migration runs but invariant test fails post-deploy | Low | High | Build the test FIRST, then the RPC, so the RPC is built to pass it. Worker runs test against staging before pushing migration to prod. |
| Backfill of `until` on 3 painted rows races with new deploys | Very low | Low | Migration is idempotent (conditional UPDATE WHERE until IS NULL). Safe to re-run. |
| The painted-rdates check in SQL uses string comparison; ISO date strings sort correctly but timezone-prefixed strings may not | Low | High | Layer 1 explicitly casts to `DATE` before comparison. Painted `rdates` are stored as YYYY-MM-DD strings (verified from production data). |
| Convention #271 wording conflicts with future surfaces that need different semantics (e.g. "available opportunities") | Low | Low | Convention scope is explicitly routine-day state, not opportunity availability. Opportunities have their own claim lifecycle; the predicate set is different. |

## Pre-Build Founder Sign-Off Required

Before any worker dispatches:
- [ ] D1 confirmed — Solution C, single canonical RPC, no parallel TS predicates
- [ ] D2 confirmed — two-layer RPC design, bulk Layer 2 as the public surface
- [ ] D3 confirmed — three callers refactored: `useRoutineWeekView`, `calculate_allowance_progress`, `calculate-allowance-period`
- [ ] D4 confirmed — `recurringTaskFilter` stays as-is this build, becomes the TS reference for the invariant test
- [ ] D5 confirmed — backfill migration for 3 painted rows + (optional) archive orphan Kitchen Zone task
- [ ] D6 confirmed — Convention #271 text (or revised wording founder approves)
- [ ] D7 confirmed — invariant test corpus shape acceptable
- [ ] Stubs list reviewed — nothing the founder considers missing
- [ ] Mom-UI verification table covers the surfaces founder wants eyes-on
- [ ] **Approved to dispatch the build worker**

## Post-Build Founder Sign-Off (after Mom-UI Verification table is fully ✅)

- [ ] Mom-UI Verification table fully populated at all 3 viewports
- [ ] Zero Missing items in Post-Build Verification (filled by Checkpoint 5)
- [ ] `npx tsc -b` clean
- [ ] `npm run lint` clean
- [ ] Invariant test passes deterministically (3 consecutive runs)
- [ ] Convention #271 added to `CLAUDE.md`
- [ ] `STUB_REGISTRY.md` updated with the explicit out-of-scope items above
- [ ] `WIRING_STATUS.md` updated (RPC as new shared infrastructure)
- [ ] `claude/live_schema.md` regenerated via `npm run schema:dump`
- [ ] Feature-decision file (this file) Post-Build section populated
- [ ] **Approved to commit**
- [ ] **Approved to push**

## Post-Build Verification (filled by Checkpoint 5)

| Requirement | Status | Notes |
|---|---|---|
| Layer 1 SQL function `obligation_active_for_member_on_date` exists and is correct | Wired | Migration 100247. Mirrors `recurringTaskFilter` + the `sqlLayer1Mirror` in the invariant test. Signature verified by migration NOTICE (`p_task_id uuid, p_member_id uuid, p_date date`). |
| Layer 2 SQL function `get_member_day_obligations` exists and is correct (return shape carries pool_id, task_segment_id, is_extra_credit, homework_subject_ids) | Wired | Migration 100247. Locked 14-column return shape implemented; populates `source_type='routine_step'` only. Smoke-tested live (Gideon). |
| `useRoutineWeekView` refactored to call Layer 2 | Wired | `src/features/financial/useRoutineWeekView.ts` — single `get_member_day_obligations` call replaces inline filter + per-DOW day-walk; `WeekViewData` shape unchanged; period fallback (#270) + shared-completer attribution (#266) preserved. tsc + lint clean. |
| `calculate_allowance_progress` RPC refactored to call Layer 2 | Wired (Layer 1 gate) | Migration 100247. Per D3, the routine day-loop + completion counting gate each day through `obligation_active_for_member_on_date` (the Layer 1 primitive that Layer 2 is built on), preserving 100243/100244/100239/100241/100235 fairness logic. Direct Layer-2 table call was not used here because the function accumulates per-day weighted fractions inline; gating via Layer 1 is the faithful, lower-risk realization of D3 that keeps all prior fairness. Smoke-tested live (Gideon 52.78%). |
| `calculate-allowance-period` Edge Function refactored to call Layer 2 | Wired | `countAssignedTasks` now aggregates the routine portion of `total_tasks_assigned` from `get_member_day_obligations` by task_id; non-routine portion direct-counted (grandfathered until Layer 2 `source_type='task'`). Deployed `--no-verify-jwt`. |
| Backfill migration applied; 3 painted rows have `until` populated | Wired | Migration 100247 idempotent UPDATE. Verified: 0 painted routines remain without `until`. |
| Orphan Kitchen Zone row archived (or explicit decision to leave) | Wired | `c06c706c-83bb-4279-98df-35344de7f04c` archived by idempotent step. Verified `archived_at IS NOT NULL`. |
| Invariant test passes | Wired | `tests/routine-day-state-invariant.test.ts` — 19/19 passing, deterministic across 3 consecutive runs. Includes production-bug repro (painted-no-until hidden after last rdate) + assignee/archived gate cases. |
| Convention #271 added to CLAUDE.md | Wired | Inserted between #270 and #272 with full D6 wording (principle, dashboard-truth invariant, privacy boundary, two-layer architecture, TS reference, grandfathered list). |
| Mom-UI verification table fully ✅ | Pending (founder) | Eyes-on at 3 viewports on deployed myaimcentral.com is the founder's, per build contract — not marked by the worker. |
| Founder-visible allowance amounts reviewed; any surprises documented | Pending (founder) | Smoke evidence: Gideon week 5/24–5/30 = 52.78% with expired painted Upper Common Room now excluded from the denominator (146 raw steps available, down from the painted-inflated count). Founder to confirm whether to honor old or corrected values per kid. |
