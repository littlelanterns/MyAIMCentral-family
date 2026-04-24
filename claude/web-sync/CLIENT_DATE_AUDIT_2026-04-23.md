# Client-Clock Date Handling Audit — 2026-04-23

> **Status:** Partial fix shipped. Routines covered. Other DATE columns still vulnerable.
> **Shipped in:** commit `b39ca44` (+ prior allowance commits `44bb23e`, `9a92072`, `98ce077`, `ff085d4`)
> **Author:** Session working Tenise's allowance calculator fix, 2026-04-23
> **Audience:** Future Claude session picking this up

---

## What we noticed

Tenise reported that her son Mosiah's Guided dashboard showed **0/31** and **0/20** step progress on his Bathroom Cleaning and Zone 2: Herringbone routines, even though he'd been checking steps off on a different device. The allowance widget at the bottom of the same dashboard showed **47/135 steps** and **$3.53 earned** — numbers that clearly reflected those checkmarks existed somewhere. The discrepancy between the task card (0/X) and the allowance widget (non-zero) was the first hint that the data was fine; the query filter was wrong.

Same-family comparison confirmed it: Gideon's identical Bathroom Cleaning routine correctly showed **15/20 today** on his dashboard, viewed from Tenise's device. So the component was working — Mosiah's specific completions just weren't being found by the "today" filter.

---

## Root cause

`routine_step_completions.period_date` (a `DATE` column) was being written client-side from `todayLocalIso()` in `RoutineStepChecklist.handleToggleStep`. `todayLocalIso()` calls `new Date().getDate()` etc., which returns the **clicking device's local date** — which depends entirely on that device's clock and timezone configuration.

Mosiah's completions from his other device had timestamps like `completed_at = 2026-04-23 23:53:14+00` (UTC) with `period_date = 2026-04-24`. In Central Time (UTC-5 DST), 23:53 UTC on April 23 is **18:53 on Thursday April 23 local** — clearly still Thursday. But `todayLocalIso()` on his device returned April 24, meaning his device's clock thought it was already tomorrow (misconfigured timezone, set to UTC, whatever).

When Tenise viewed from a device with the correct local time, the Guided task card query filtered `period_date = '2026-04-23'`, and Mosiah's 30 "tomorrow-tagged" completions were invisible.

The **allowance widget didn't have this bug** because the RPC `calculate_allowance_progress` queries the whole period range (`'2026-04-19'` → `'2026-04-25'`), so all the misdated rows were still inside the window and counted for pay. That's why the money math looked right while the daily tally was 0.

---

## What we fixed (routines only)

### Part A — One-shot data realignment (done via direct SQL)

```sql
UPDATE routine_step_completions rsc
SET period_date = (rsc.completed_at AT TIME ZONE f.timezone)::date
FROM family_members fm, families f
WHERE rsc.member_id = fm.id
  AND fm.family_id = f.id
  AND (rsc.completed_at AT TIME ZONE f.timezone)::date != rsc.period_date;
```

Repointed 31 misaligned rows across Tenise's family (30 Mosiah, 1 Helam) onto their correct family-local dates. This query is idempotent — safe to re-run, it's a no-op when everything's aligned. If another family shows the same symptom, run it again.

### Part B — Server-side trigger (migration `00000000100157_routine_step_period_date_trigger.sql`)

`BEFORE INSERT OR UPDATE OF completed_at` on `routine_step_completions` now runs a `SECURITY DEFINER` function that:

1. Looks up `families.timezone` via `member_id → family_members → families`
2. Computes `period_date := (NEW.completed_at AT TIME ZONE v_family_timezone)::date`
3. Overrides whatever the client sent

Fallback to `'America/Chicago'` if the family lookup fails (should never happen). The trigger never blocks an insert — if something goes wrong in the lookup, the insert still succeeds with the default fallback.

**Net result for routines:** `period_date` is now a deterministic function of `completed_at` + `families.timezone`. Completely independent of the clicking device's clock.

---

## The broader diagnosis (NOT fixed yet — survey only)

The same structural bug applies anywhere a `DATE` column gets populated from `todayLocalIso()` on the client. Grep of `src/` turned up these call sites, categorized by risk:

### Category A — Server-side, family-timezone-aware (SAFE)

Edge Functions using `Intl.DateTimeFormat({ timeZone: family.timezone })`. Not affected.

- `calculate-allowance-period` cron → `allowance_periods`, `financial_transactions`
- `mindsweep-auto-sweep` cron → `studio_queue`, `mindsweep_events`
- `process-carry-forward-fallback` cron → `tasks.priority`, new task rows
- `accrue-loan-interest` cron → `loans`

### Category B — Client-side WRITES to DATE columns (VULNERABLE)

Each of these writes a `DATE` from `todayLocalIso()`. Bad device clock → wrong day.

| Table.column | Write site | Symptom |
|---|---|---|
| `routine_step_completions.period_date` | (fixed) | — |
| `intention_iterations.day_date` | `useFamilyBestIntentions.ts:218` | Best Intentions tally "not counting" across devices |
| `task_completions.period_date` | `useOpportunityLists.ts:285`, `ColorRevealTallyWidget.tsx:65` | Opportunity + coloring reveals miss today |
| `tasks.due_date` (daily schedule) | `buildTaskScheduleFields.ts:20` | Daily tasks created late-evening land tomorrow |
| `tasks.recurrence_details.rotation.last_rotated_at` | `createTaskFromData.ts:411` | Rotation off by one day on first rotation |
| `homeschool_time_logs.log_date` | `useHomeschool.ts:357` | Time logs wrong day for ESA compliance |
| `victory_celebrations.celebration_date` | `useCelebrationArchive.ts:41` | Daily Celebration history shifted |
| `family_intention_iterations.day_date` | `useFamilyBestIntentions.ts:218` | Family intention streak counts off |

### Category C — Client-side READS with local-date filter (VULNERABLE even if writes were perfect)

Queries that filter `.eq('day_date', todayLocalIso())` on the viewing device. Even with correctly-stored data, a cross-device timezone mismatch means mom's device misses the kid's rows.

- `useTodaysIterations` → `intention_iterations`
- `useTodayFamilyIterations` → `family_intention_iterations`
- `useTodaysResponses` → `reflection_responses`
- `useDailySummary` (homeschool) → `homeschool_time_logs`
- `useFamilyOverviewData.today()` → `calendar_events`, `tasks`, multiple
- `PlayDashboard.tsx:80` → `tasks` filter
- `FinancesTab.tsx:333` → `allowance_periods`, `financial_transactions`
- `useFinancial.ts:692, 765` → `task_completions`, `allowance_periods`

### Category D — Harmless

File-name generation, in-memory math, seed hashes. No DB persistence.

- `ContextExportPage.tsx:150`, `bookshelfExport.ts:60` (filenames)
- `dateSeedPrng.ts` (deterministic seed — same day same output)
- `icsParser.ts`, `useNBTEngine.ts:41`, `BestIntentions.tsx` (internal math)

---

## Remediation options (for the future session to pick)

### Path 1 — Per-column triggers (what we just did for routines)

Mirror the migration 100157 pattern for each Category B column. One trigger per table.

- **Pro:** bulletproof, no frontend changes, each trigger is tiny
- **Con:** one migration per table, duplication of lookup logic, only covers writes (not reads)

### Path 2 — Global `family_today(p_member_id UUID) RETURNS DATE` RPC

All client-side date writes and filters call `supabase.rpc('family_today', {p_member_id})` instead of `todayLocalIso()`.

- **Pro:** one source of truth, covers both write *and* read paths, only one migration + one shared hook
- **Con:** every client site needs rewrite, adds a network roundtrip to every write and filter (mitigable with a short-TTL React Query cache — call it once a render, share across components)

### Recommended: Path 3 — Hybrid (Path 1 + Path 2)

- **Path 1 for writes:** ~7 triggers covering the Category B columns. Eliminates the write-side bug globally, independent of any frontend change.
- **Path 2 for reads:** rewrite Category C filter sites to use a single cached `useFamilyToday(memberId)` hook that calls `family_today` RPC once per render, caches for a few minutes.

Estimated effort: ~2 hours for the 7 triggers (Path 1), ~4 hours for the hook rewrite + Category C migrations (Path 2). Total half-day.

Founder has not yet approved implementation — she asked for diagnosis only on 2026-04-23. Pre-build this before starting: create a feature decision file, read the relevant PRDs (PRD-09A for tasks, PRD-28 for homeschool, PRD-06 for intentions, PRD-11/11B for victories), confirm no timezone-related PRD decisions override the approach.

---

## Invariants to preserve if you implement Path 1 or Path 3

1. **Trigger never blocks an insert.** Fallback to `'America/Chicago'` (or whichever global default) if family lookup fails.
2. **`SECURITY DEFINER` + `SET search_path = public`** — standard RLS bypass pattern, safe because the trigger doesn't read user data beyond the member→family join.
3. **`BEFORE INSERT OR UPDATE OF <timestamp column>`** — only recompute `date column` when the timestamp actually changes, not on unrelated updates.
4. **Completed_at default to NOW()** if null, so the trigger has something to work with.
5. **Column default stays as `CURRENT_DATE`** so schema introspection and inserts-without-timestamp don't break — the trigger replaces whatever is set.

---

## Verifying the routine fix (already shipped)

To confirm migration 100157 is holding over time, run this periodically:

```sql
SELECT COUNT(*)
FROM routine_step_completions rsc
JOIN family_members fm ON fm.id = rsc.member_id
JOIN families f ON f.id = fm.family_id
WHERE (rsc.completed_at AT TIME ZONE f.timezone)::date != rsc.period_date;
```

Should always return 0. If it's ever non-zero, either the trigger is broken or a code path is bypassing it (e.g., raw SQL insert via Edge Function that doesn't go through the ORM — possible but unlikely).

---

## Files referenced

- Fix: `supabase/migrations/00000000100157_routine_step_period_date_trigger.sql`
- Allowance RPC (context): `supabase/migrations/00000000100154_allowance_progress_rpc.sql`, `100155`, `100156`
- Client writes: `src/components/tasks/RoutineStepChecklist.tsx` (already goes through trigger now, no change needed)
- Date utils: `src/utils/dates.ts` (the `todayLocalIso()` everyone calls)
- Family timezone: `families.timezone` column (default `'America/Chicago'` per auth signup)

---

## Handoff summary for cross-session context

- **Convention reminder:** next new migration starts at `00000000100158_`.
- **RLS:** trigger is `SECURITY DEFINER` with `search_path = public`. No new RLS policies added. No table-level column changes.
- **Schema snapshot:** `claude/live_schema.md` regenerated on 2026-04-23 after 100157 landed.
- **No new CLAUDE.md conventions introduced** by this work. A convention around "use server-side triggers for DATE columns derived from client timestamps" would be useful when Path 1/3 is implemented, but it's premature to add until we've actually done the sweep.
