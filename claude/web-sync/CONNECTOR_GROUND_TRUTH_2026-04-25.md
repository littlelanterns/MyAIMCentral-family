# Connector Ground Truth — 2026-04-25

> Forensic report on existing infrastructure that bears on a multi-pool / connector architecture design pass. Investigative-only. No proposals, no recommendations, no "we should." Five sections, numbered to match the questions.

---

## 0. How the single-pool allowance percentage actually works

### Plain-English summary

The headline "78%" the kid sees is a **single ratio per child** computed by one Postgres RPC (`calculate_allowance_progress`) that walks every `tasks` row where `assignee_id = kid` AND `counts_for_allowance = true` AND `archived_at IS NULL`. There is **one pool per child** — there is no `pool_name` column, no `allowance_pools` table, no per-task pool tag. Every allowance-counting task contributes to the same denominator and numerator.

Routines and non-routines are tallied differently inside the RPC but feed the same overall fraction. The ratio is "weighted pool-fraction completed ÷ weighted pool-fraction assigned" — both sides use a per-task `pool_fraction = days_active_in_period / period_days` so a task added Wednesday of a Sunday-start week contributes ≈ 5/7 of a unit, not a full unit. Routines further subdivide each task's slice by per-day step counts. Points-Weighted multiplies each contribution by `tasks.allowance_points` (or `default_point_value`).

### Authoritative locations

| Layer | File | Status |
|---|---|---|
| RPC math | `supabase/migrations/00000000100175_per_day_grace_mode.sql` (canonical 4-arg form, JSONB grace) | shipped |
| RPC math (prior) | `00000000100154` → `100156` → `100164` → `100171` → `100172` → `100175` (chain of `DROP + CREATE`) | superseded but kept inline for fresh-DB rebuilds |
| Edge Function (period close) | `supabase/functions/calculate-allowance-period/index.ts` | shipped |
| Frontend hook | `src/hooks/useFinancial.ts:348-402` (`useLiveAllowanceProgress`) | shipped |
| Widget | `src/components/widgets/trackers/AllowanceCalculatorTracker.tsx` | shipped |
| PRD spec | `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md:660-702`, edge cases at L971-991 | base spec |

### Q0.1 — Numerator and denominator

When mom sees "Maya is at 78%," the denominator is the **sum across all eligible tasks** of `pool_fraction = days_active_in_period / period_days`. The numerator is **the same `pool_fraction` weighted by completion** — for routines, by the actual-completed-step / total-possible-step ratio; for non-routines, by `1 if status='completed' else 0`.

`supabase/migrations/00000000100164_calculate_allowance_progress_fix.sql:147-149` (the regular-task contribution to the denominator):

```sql
v_days_active := (p_period_end - v_effective_start) + 1;
v_pool_fraction := v_days_active::NUMERIC / v_period_days;
v_total_assigned := v_total_assigned + v_pool_fraction;
v_total_points := v_total_points + (v_weight * v_pool_fraction);
```

The completion percentage in the default Dynamic approach is **`v_total_completed / v_total_assigned`** (`100164:227-229`):

```sql
ELSE
  v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, 100);
END IF;
v_completion_pct := ROUND(v_completion_pct, 2);
```

So 78% does NOT mean "78 of 100 tasks done." It means the weighted fraction of assignment slices that are "filled in." For a kid with three routines and four non-routines all created at period start, the denominator is 7. For a kid with two routines created Sunday and one non-routine added Thursday, the denominator is `2 + 2 + (4/7) ≈ 4.57`.

### Q0.2 — Routine step completions

Routines do NOT just count as one task in the numerator. The RPC walks each day in the period, asks each section "is your `frequency_days` array containing this DOW?", sums step counts, and produces `v_routine_total_possible` — the total number of step instances that were scheduled this period. It then queries `routine_step_completions` for actual completions (deduped on `step_id, period_date` per Bug 2 fix) filtered to the same DOW filter (Bug 1 fix). The ratio `v_routine_actual_completed / v_routine_total_possible` is a fraction in `[0,1]`. That fraction is then **multiplied by `pool_fraction`** for that routine — so the routine still contributes only one `pool_fraction` slice to the overall numerator/denominator, but its slice can be partially filled.

`100164:153-210`:

```sql
IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
  -- Denominator: walk each day, sum steps where DOW ∈ section.frequency_days
  v_routine_total_possible := 0;
  v_day := v_effective_start;
  WHILE v_day <= p_period_end LOOP
    v_dow_str := EXTRACT(DOW FROM v_day)::INT::TEXT;
    SELECT COALESCE(SUM(
      (SELECT COUNT(*)::INT FROM task_template_steps stp WHERE stp.section_id = tts.id)
    ), 0)
    INTO v_day_step_count
    FROM task_template_sections tts
    WHERE tts.template_id = v_task.template_id
      AND v_dow_str = ANY(tts.frequency_days);
    v_routine_total_possible := v_routine_total_possible + COALESCE(v_day_step_count, 0);
    v_day := v_day + 1;
  END LOOP;

  -- Numerator: same DOW filter, dedupe per (step_id, period_date)
  SELECT COUNT(*)::INT INTO v_routine_actual_completed
  FROM (
    SELECT DISTINCT rsc.step_id, rsc.period_date
    FROM routine_step_completions rsc
    JOIN task_template_steps stp ON stp.id = rsc.step_id
    JOIN task_template_sections tts ON tts.id = stp.section_id
    WHERE rsc.task_id = v_task.id
      AND rsc.member_id = p_member_id
      AND rsc.period_date BETWEEN v_effective_start AND p_period_end
      AND (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
  ) dedup;

  IF v_routine_total_possible > 0 THEN
    v_routine_fraction := LEAST(
      v_routine_actual_completed::NUMERIC / v_routine_total_possible, 1
    );
    v_total_completed := v_total_completed + (v_routine_fraction * v_pool_fraction);
    v_completed_points := v_completed_points
      + (v_weight * v_routine_fraction * v_pool_fraction);
  END IF;
```

So a Morning Routine with 28 step-instances scheduled this week and 21 completed contributes a 0.75 fraction (75% of one task slice) to the numerator. NOT 21 individual units; one slice, partially filled.

The widget separately reports raw step counts via `raw_steps_completed` / `raw_steps_available` for the "21 / 28 steps" display line, but those numbers do NOT drive the percentage — they are just a more child-legible secondary readout.

### Q0.3 — `calculation_approach` ∈ {fixed, dynamic, points_weighted} — what's the math difference?

Worked example: same kid, same week (Sunday-start, 7 days), all tasks created at period start so `pool_fraction = 1.0` for each.

**Setup.** Kid is assigned:
- Morning Routine (template, 4 steps every day → 28 step-instances/week). Kid completes 21.
- Bedroom Clean Routine (3 steps M-W-F → 9 step-instances/week). Kid completes 6.
- "Take out trash" non-routine task. Mom sets `allowance_points=3`. Kid completes it.
- "Read 30 min" non-routine task. Kid did not complete.

`weekly_amount = $14`, `default_point_value = 1`.

**Fixed (`calculation_approach='fixed'`).** RPC behavior is **identical to Dynamic** in the current code path (`100175:298-307` — only branches on `'points_weighted'`). The "Fixed Template" UX label in PRD-28 §168 implies a different intent (mom locks the pool to a template), but at the math level there is no special-case branch:

```sql
ELSIF COALESCE(v_config.calculation_approach, 'dynamic') = 'points_weighted' THEN
  v_completion_pct := CASE WHEN v_total_points > 0
    THEN LEAST((v_completed_points / v_total_points) * 100, 100)
    ELSE 100 END;
ELSE
  v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, 100);
END IF;
```

`fixed` falls through the `ELSE` branch — same path as Dynamic.

**Dynamic.** Numerator = sum of completion-weighted slices. Denominator = sum of slices.
- Morning Routine: `21/28 × 1.0 = 0.75`
- Bedroom Clean: `6/9 × 1.0 = 0.667`
- Trash: `1 × 1.0 = 1.0`
- Read: `0 × 1.0 = 0`
- numerator = `0.75 + 0.667 + 1.0 + 0 = 2.417`
- denominator = `1.0 + 1.0 + 1.0 + 1.0 = 4.0`
- pct = `2.417 / 4.0 = 60.4%`
- `calculated_amount = $14 × 0.604 = $8.46`
- bonus_threshold default 90% → no bonus
- `total_earned = $8.46`

**Points-Weighted.** Same setup but `weight = COALESCE(allowance_points, default_point_value, 1)`:
- Morning Routine: weight 1, contribution to denominator = `1 × 1.0 = 1`. Numerator = `1 × 0.75 × 1.0 = 0.75`.
- Bedroom Clean: weight 1, denominator += 1, numerator += `1 × 0.667 × 1.0 = 0.667`.
- Trash: weight 3 (allowance_points), denominator += `3 × 1.0 = 3`. Numerator += `3 × 1 × 1.0 = 3`.
- Read: weight 1, denominator += 1, numerator += 0.
- numerator (`completed_points`) = `0.75 + 0.667 + 3 + 0 = 4.417`
- denominator (`total_points`) = `1 + 1 + 3 + 1 = 6`
- pct = `4.417 / 6 = 73.6%`
- `calculated_amount = $14 × 0.736 = $10.30`

So in Points-Weighted, the kid scores higher because the trash task they DID complete is weighted 3× heavier. In Dynamic, it counts as one slice regardless of weight.

`100164:223-229` is the branch:

```sql
IF v_total_assigned = 0 THEN
  v_completion_pct := 100;
ELSIF COALESCE(v_config.calculation_approach, 'dynamic') = 'points_weighted' THEN
  v_completion_pct := CASE WHEN v_total_points > 0
    THEN LEAST((v_completed_points / v_total_points) * 100, 100)
    ELSE 100 END;
ELSE
  v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, 100);
END IF;
```

**Summary:** `fixed` and `dynamic` are mathematically identical in the current code; `points_weighted` divides `completed_points / total_points` instead of `total_completed / total_assigned`. All three accumulate `total_assigned`, `total_completed`, `total_points`, and `completed_points` on every task — the branch only chooses which two to divide.

### Q0.4 — `is_extra_credit=true`

Yes, this matches the founder's framing: it adds to the numerator without adding to the denominator.

`supabase/migrations/00000000100171_calculate_allowance_progress_extra_credit.sql:170-188` (with all later migrations preserving the same branch):

```sql
-- Extra-credit branch: excluded from denominator entirely. Only counted
-- in numerator on completion, and only when the child's config has
-- extra_credit_enabled = true.
IF v_task.is_extra_credit = TRUE
   AND v_task.task_type <> 'routine'
   AND COALESCE(v_config.extra_credit_enabled, FALSE) = TRUE THEN
  -- NOT added to v_total_assigned (denominator excluded).
  -- NOT added to v_total_points (denominator excluded).
  IF v_task.status = 'completed' THEN
    v_extra_credit_completed := v_extra_credit_completed + 1;
    v_extra_credit_weight := v_extra_credit_weight + (v_weight * v_pool_fraction);
    v_total_completed := v_total_completed + v_pool_fraction;
    v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
  END IF;
  CONTINUE;
END IF;
```

Three rules embedded:
1. Denominator-excluded entirely (no `v_total_assigned` or `v_total_points` increment).
2. Numerator-incremented on completion only, by `pool_fraction` (and `weight × pool_fraction` in points mode).
3. Two gates: `task_type <> 'routine'` (routines are explicitly out of scope per the comment at L36-39 of 100171) AND `allowance_configs.extra_credit_enabled = TRUE`. If extra credit is disabled in config, an `is_extra_credit=true` task is skipped entirely (CONTINUE) — not counted as a regular task either.

**Cap at 100%.** Per `100171:248-257` and PRD-28 §979: `LEAST(..., 100)` caps the percentage. Extra credit can restore the kid to 100% but cannot push above. PRD-28 §979 explains the rationale: "Allowing >100% would create inflation."

**Worked example.** Kid has the same setup as Q0.3 (Dynamic, 60.4% before extra credit). Mom adds an `is_extra_credit=true` task "Help neighbor" (`weight=1`), kid completes it.
- numerator = `2.417 + 1.0 (extra credit) = 3.417`
- denominator unchanged = `4.0`
- `pct = 3.417 / 4.0 = 85.4%`. Capped at 100%, so 85.4% (no cap hit).
- `calculated_amount = $14 × 0.854 = $11.96`

If kid had completed two extra credits, numerator = `4.417 / 4.0 = 110%` → capped to 100%. `calculated_amount = $14`. Bonus at 90% → applies (see Q0.5).

The RPC also returns `extra_credit_completed` and `extra_credit_weight_added` as separate columns (`100171:285-305`) so the UI can display "+ 2 extra credit tasks" without backing the math out of the cap.

### Q0.5 — `bonus_threshold` and `bonus_percentage`

`100164:237-246` shows the bonus math:

```sql
v_bonus_applied := v_completion_pct >= COALESCE(v_config.bonus_threshold, 85);
IF v_bonus_applied THEN
  IF COALESCE(v_config.bonus_type, 'percentage') = 'flat' THEN
    v_bonus_amt := COALESCE(v_config.bonus_flat_amount, 0);
  ELSE
    v_bonus_amt := v_base * (COALESCE(v_config.bonus_percentage, 20) / 100.0);
  END IF;
ELSE
  v_bonus_amt := 0;
END IF;

v_total_earned_val := v_calc_amount + v_bonus_amt;
```

Three rules:
1. Bonus is binary — kicks in once `completion_percentage >= bonus_threshold`. Default threshold 90 (PRD spec) but RPC fallback is 85.
2. Two bonus types: `percentage` (default — `weekly_amount × bonus_percentage / 100`) and `flat` (column added in `100135` — `bonus_flat_amount` is the dollar value). Toggle via `allowance_configs.bonus_type`.
3. The bonus is **added on top of `calculated_amount`**, which is itself `weekly_amount × completion_pct / 100`.

**Worked example A — percentage bonus.** Kid hits 92% on $14/week, bonus_threshold=90, bonus_percentage=20 (the schema defaults).
- `calculated_amount = $14 × 0.92 = $12.88`
- bonus: `$14 × 20/100 = $2.80`
- `total_earned = $12.88 + $2.80 = $15.68`

**Worked example B — kid at 89.99%.** Bonus does NOT apply.
- `calculated_amount = $14 × 0.8999 = $12.60`
- `bonus_amount = 0`
- `total_earned = $12.60`

**Worked example C — flat bonus.** Same kid at 92%, `bonus_type='flat'`, `bonus_flat_amount=$5`.
- `calculated_amount = $14 × 0.92 = $12.88`
- `bonus_amount = $5`
- `total_earned = $12.88 + $5 = $17.88`

**Crucial note for multi-pool feasibility.** The bonus is evaluated against ONE percentage. If pools were introduced as denominators, the question "does the bonus apply per-pool, or to a roll-up percentage?" has no current answer — there is one percentage, one bonus computation, period.

### Q0.6 — `grace_days_enabled` and `makeup_window`

**Plain-English experience.** When grace days are enabled, mom can mark specific dates as "this day didn't count" — kid was sick, family went on a road trip, etc. The kid sees the same percentage they would have seen if those days had never been on the schedule. With makeup window, mom can extend the period a couple days past `period_end` so kid has time to catch up before the period closes.

**Grace day mechanics.** `00000000100175_per_day_grace_mode.sql` is the current canonical RPC. Two modes per grace day (per founder request 2026-04-24, recorded at `100175:1-18`):

- `full_exclude` (default): day removed from BOTH numerator and denominator. As if the day didn't exist.
- `numerator_keep`: day removed from denominator only. Kid keeps any credit they earned that day, but isn't held to the day's full slate. ("I'm a nice mom" — founder verbatim.)

Schema: `allowance_periods.grace_days` is JSONB. Entries are either bare strings (`"2026-04-19"`, treated as full_exclude for back-compat) or objects (`{date, mode}`). Hook: `useAddGraceDay` / `useRemoveGraceDay` in `src/hooks/useFinancial.ts:438-530`. UI: `GraceDaysManager`.

The RPC's grace-day denominator walk:

```sql
WHILE v_day <= p_period_end LOOP
  -- Grace-day exclusion: skip this day entirely. Does not contribute to the
  -- possible step count; numerator filter below also drops completions
  -- whose period_date is in the set.
  IF v_day = ANY(v_grace_set) THEN
    v_day := v_day + 1;
    CONTINUE;
  END IF;
  ...
```

(`100172:209-215` — preserved through 100175.)

Numerator: matching `WHERE NOT (rsc.period_date = ANY(v_grace_set))` for full_exclude mode (`100172:243-244`).

**Edge case** — all days marked grace → `effective_tasks_assigned = 0` → 100% earned (PRD-28 §977 quoted directly in `100172:271-273`). This is the same branch as "zero tasks assigned this period."

**Important historical note.** Migrations `100154 / 100156 / 100164 / 100171` shipped grace_days_enabled awareness but the RPC never actually consumed `grace_days` until `100172` (`100172:1-9`). Before 100172, mom marking grace days was a no-op mathematically — the data persisted but didn't change the math. The `useAddGraceDay` hook had been writing to the column the whole time.

**Makeup window.** `allowance_configs.makeup_window_enabled` + `makeup_window_days INTEGER DEFAULT 2`. When the period ends and the cron fires, the Edge Function checks:

`supabase/functions/calculate-allowance-period/index.ts:192-204`:

```typescript
if (config.makeup_window_enabled) {
  const windowEnd = addDays(period.period_end, config.makeup_window_days)
  if (localDateStr <= windowEnd) {
    // Update status to makeup_window if not already
    if (period.status === 'active') {
      await supabase.from('allowance_periods')
        .update({ status: 'makeup_window' }).eq('id', period.id)
    }
    continue
  }
}
```

While `status='makeup_window'`, the cron skips closing the period. Kid can still complete tasks against it. Once `localDateStr > windowEnd`, the cron processes the period normally.

### Q0.7 — What does the kid see as their "percentage" on the dashboard?

The `completion_percentage` column from the RPC return — column index 3 of the RETURNS TABLE in `100175:79`:

```sql
completion_percentage NUMERIC,
```

This is the post-cap, post-bonus-evaluation, ROUND(.., 2) value that lives in `progress.completion_percentage` server-side and `liveProgress.completion_percentage` client-side. The widget renders it as `prd28Pct = Math.round(liveProgress?.completion_percentage ?? activePeriod.completion_percentage)` (`AllowanceCalculatorTracker.tsx:147`).

The "Today" view toggle (NEW-OO, 2026-04-24, `AllowanceCalculatorTracker.tsx:69-78`) re-runs the same RPC with `p_period_start = p_period_end = familyToday` so kid sees today's slice using the identical math, just with a 1-day window.

The widget separately renders `displayCompleted / displayAvailable` as the secondary readout — for routines this is `raw_steps_completed + nonroutine_tasks_completed / raw_steps_available + nonroutine_tasks_total` (`AllowanceCalculatorTracker.tsx:154-169`). That readout is NOT used to compute the percentage shown — it's a child-legible decoration.

### Q0.8 — What happens at week close?

`calculate-allowance-period/index.ts:218-405`. Hourly cron fires (UTC). For each family, computes local time. For each member with an active period whose `period_end < localDateStr`, checks:

1. `extra_credit_enabled` etc. by loading `allowance_configs`.
2. **Per-child `calculation_time` window check** (`index.ts:172-189`): only fire within the configured 1-hour window after `calculation_time` (default 23:59 → fires sometime after midnight local).
3. If `makeup_window_enabled` and within window → flip status to `makeup_window`, skip.
4. **Call the RPC** with the period's grace_days payload. Same RPC, same math as the live widget.
5. Snapshot the values into `allowance_periods` row:

```typescript
await supabase.from('allowance_periods').update({
  status: 'calculated',
  total_tasks_assigned: totalTasksAssignedCount ?? 0,
  grace_day_tasks_excluded: graceDayTasksExcluded,
  effective_tasks_assigned: effectiveAssigned,
  tasks_completed: Math.max(0, effectiveCompleted - extraCreditCompleted),
  extra_credit_completed: extraCreditCompleted,
  effective_tasks_completed: effectiveCompleted,
  completion_percentage: completionPct,
  calculated_amount: calculatedAmount,
  bonus_applied: bonusApplied,
  bonus_amount: bonusAmount,
  total_earned: totalEarned,
  calculation_details: {
    approach: progress.calculation_approach,
    total_points: ...,
    completed_points: ...,
    grace_days: graceDays,
    extra_credit_completed, extra_credit_weight_added,
    rpc: 'calculate_allowance_progress',
  },
  calculated_at: now.toISOString(),
  closed_at: now.toISOString(),
})
```

(`index.ts:284-316`)

6. **Write financial transaction** with `transaction_type='allowance_earned'`, `amount = total_earned`, `balance_after = previous_balance + total_earned`, source pointer to the period (`index.ts:383-405`).
7. **Process auto-deduct loans** before crediting (`index.ts:329-381`): deduct as much as `Math.min(loan.auto_deduct_amount, netEarned, loan.remaining_balance)` and write a `loan_repayment` transaction. This is order-of-ops AFTER the allowance calc but the code does it BEFORE the allowance_earned write to the ledger — see comments at `index.ts:349-351` for the balance_after sequencing.
8. **Open next period** with `period_start = period_end + 1`, `period_end` derived by trigger.

**Single source of truth.** Both the live widget and the period-close Edge Function call the SAME `calculate_allowance_progress` RPC. Live values during the week and closing values at period end use identical math.

### Multi-pool feasibility implications (descriptive only)

Anywhere the RPC says `WHERE t.assignee_id = p_member_id AND t.counts_for_allowance = TRUE` there is currently no further filter. To support multiple pools, every accumulator (`v_total_assigned`, `v_total_completed`, `v_total_points`, `v_completed_points`, `v_raw_steps_*`, `v_nonroutine_*`, `v_extra_credit_*`) would need a `_per_pool` shape, and the final percentage / calculated_amount / bonus computation would need to fork per pool. The RPC's RETURNS TABLE is currently a 20-column flat shape — it's not structured to return a per-pool array. Three of the four bonus-related fields (`bonus_threshold`, `bonus_percentage`, `bonus_flat_amount`) live on `allowance_configs`, one record per child — so per-pool bonus thresholds would require a new table or a JSONB shape on `allowance_configs`.

There is **zero** current concept of pools in the schema, RPC, Edge Function, or frontend. Section 2 covers this in more detail.

---

## 1. PRD-35 Universal Scheduler

### Plain-English summary

PRD-35 is **partially built**. The component itself is shipped — `src/components/scheduling/UniversalScheduler.tsx` exists and is consumed by tasks, calendar, meetings, and rhythms. The RRULE JSONB output format is in production. The `access_schedules` table replaced `shift_schedules`. What is NOT built: the LiLa schedule-extract Edge Function, the rrule.js instance generator helper, and (most relevant for the connector question) any abstraction that turns a phrase like "stroke_of = end_of_week" into a fire-time. The Universal Scheduler today configures **WHEN something recurs**; it does not currently expose hooks for "fire this thing at the end of the configured period."

### Built vs. spec

| Piece | Status | Citation |
|---|---|---|
| `UniversalScheduler` React component (radio-frequency UI, calendar preview, RRULE JSONB output) | shipped | `src/components/scheduling/UniversalScheduler.tsx`, `src/components/scheduling/types.ts:9-50` (`SchedulerOutput`) |
| `RRULE JSONB` storage format on `tasks.recurrence_details`, `calendar_events.recurrence_details`, `meeting_schedules.recurrence_details` | shipped | live_schema.md confirms columns; `prds/infrastructure/PRD-35-Universal-Scheduler.md:265-316` |
| `access_schedules` table replacing `shift_schedules` | shipped | `supabase/migrations/00000000000004_universal_scheduler.sql:13-22` (NB: shape differs from PRD-35 §326-342 — see below) |
| `is_member_available()` helper | shipped (partial) | `supabase/migrations/00000000000004_universal_scheduler.sql:57-` |
| rrule.js instance generation (`rruleFromJSON`, `generatePreviewInstances`) | shipped | `src/components/scheduling/schedulerUtils.ts` (exported via `index.ts`) |
| Calendar preview (collapsible mini-calendar) | shipped | `src/components/scheduling/CalendarPreview.tsx` |
| `schedule-extract` Edge Function (LiLa parses "every 90 days from last dose") | NOT BUILT | `supabase/functions/schedule-extract/` does not exist |
| Streak detection ("every consecutive day for N days") as a first-class concept | NOT BUILT | not in PRD-35; not in the type system; PRD-35 has `count` (occurrence count) and seasonal/exception logic but no streak primitive |
| Calendar patterns ("every Tuesday," "first of the month") | shipped | weekly day picker, monthly weekday/date pickers, yearly month/day pickers all in `UniversalScheduler.tsx` |
| Completion-dependent scheduling ("every 90 days after last completion") | shipped (data model) | `types.ts:32-41`, RPC integration unclear |

### What "fire at this time" / "fire on this schedule" vocabulary exists

The `SchedulerOutput` type is the canonical contract:

```typescript
// src/components/scheduling/types.ts:9-30
export interface SchedulerOutput {
  rrule: string | null              // RFC 5545 RRULE
  dtstart: string                   // ISO 8601
  until: string | null
  count: number | null
  exdates: string[]
  rdates: string[]
  timezone: string
  schedule_type: 'fixed' | 'completion_dependent' | 'custody'
  completion_dependent: CompletionDependentConfig | null
  custody_pattern: CustodyPatternConfig | null
}
```

PRD-35 §266-271: "The Universal Scheduler does not create its own table. It outputs a structured JSONB object that consuming features store in their existing columns." The component is **purely declarative** — it produces a `SchedulerOutput` value that gets written to `tasks.recurrence_details` (or wherever). It has no notion of "fire this side-effect on these dates." The consuming feature owns the firing.

### Streak detection / calendar patterns

- Calendar patterns: handled. Day-of-week multi-select, monthly ordinal weekdays ("3rd Tuesday"), monthly dates with `+ Add another` (per `types.ts:82-93` `WeekdayRow` + `monthlyDates`), yearly month-pills + within-month patterns. The `[+ Add another]` pattern is universal across monthly/yearly (PRD-35 §93-95).
- Streak detection: NOT in the data model. There is no `consecutive_days` or `streak_threshold` field on `SchedulerOutput`. The closest analogue is `count` (UNTIL N occurrences) which is total firings, not consecutive. Streak is currently an emergent property of `family_members.current_streak` / `longest_streak` (`gamification`), not a scheduler primitive.

### "If a contract said `stroke_of = end_of_week`, would Universal Scheduler be the right thing to invoke?"

The Universal Scheduler today **does not have a concept of "stroke_of."** It declares when a thing recurs; it does not accept event-emitting hooks. The "end of period" firing for allowance is currently handled by the `calculate-allowance-period` Edge Function on a pg_cron schedule:

`supabase/migrations/00000000100134_allowance_financial.sql:933-942`:

```sql
PERFORM cron.schedule(
  'calculate-allowance-period',
  '10 * * * *',
  $cron$
  SELECT util.invoke_edge_function('calculate-allowance-period');
  $cron$
);
```

Hourly UTC cron, with the per-child `calculation_time` window gating handled inside the function (`calculate-allowance-period/index.ts:172-189`). PRD-35 explicitly handles "RECURRENCE" but not "TRIGGER ON COMPLETION OF PERIOD" — those are separate concerns in the current code.

### Integration shape

PRD-35 §358-379 lists incoming and outgoing flows. **Inputs**: parent feature passes `value: SchedulerOutput | null` and `onChange: (value: SchedulerOutput) => void` props (`types.ts:55-71`). **Outputs**: a JSONB blob that goes into the parent feature's existing column.

There is no RPC, no hook, no Edge Function exposed by PRD-35. There is no event bus. Consuming features read `recurrence_details` as ordinary JSONB and call `rrule.js`-based helpers (`schedulerUtils.generatePreviewInstances`) to generate dates client-side.

---

## 2. Allowance pools as a first-class concept

### Plain-English summary

There is **NO concept of multiple named pools per kid anywhere today**. One `allowance_configs` row per kid (UNIQUE on `family_member_id`), one `weekly_amount`, one `calculation_approach`, one `bonus_threshold`. Tasks have one `counts_for_allowance` boolean — it's binary, not pool-tagged. The `task_categories` JSONB column on `allowance_configs` is the closest existing structure, but it's a **filter** (which categories of tasks count toward this kid's single pool), not a pool grouper.

### Schema search results

- **No `allowance_pools` table exists.** Confirmed via Glob `supabase/migrations/*pool*.sql` (no matches) and Grep `pool_name|pool_id|allowance_pool|pools` across `supabase/migrations` (no matches in any DDL).
- **No `pool_name` column on `tasks`.** Confirmed by reading `00000000100023_tasks_prd09a_full.sql` and `100134_allowance_financial.sql`. The columns added in 100134 (`counts_for_allowance`, `counts_for_homework`, `counts_for_gamification`, `allowance_points`) are scalars, no pool tag.
- **`allowance_configs` is UNIQUE on `family_member_id`.** `100134:69-70` — `CREATE UNIQUE INDEX idx_allowance_configs_member ON public.allowance_configs (family_member_id)`. The schema explicitly enforces "one config per child."
- **PRD-28 search for "pool" / "pools".** Five hits across the entire PRD, none specifying multiple pools. The matches are: "Dynamic Pool" (a name for one of the three calc approaches, NOT a multi-pool concept) and "denominator" / "numerator" descriptions. PRD-28 §168-170 defines:
  > Fixed Template — "Set a fixed weekly task schedule. Best for consistent routines." (Approach A)
  > Dynamic Pool — "Tasks are counted dynamically each week. Best for variable schedules." (Approach B)
  > Points-Weighted — "Different tasks worth different points. Best for incentivizing harder tasks." (Approach C)
- **`task_categories JSONB` on `allowance_configs`.** PRD-28 §674: "Array of category strings that count toward allowance." NOT pools. PRD-28 §187: "These categories map to task tags, not to the `life_area_tag` enum directly. A task tagged `life_area_tag = 'homeschool'` would match 'Homework / Schoolwork.' The mapping is defined once in the allowance config and evaluated at calculation time." This column was specified but **does not appear in the live RPC** — `100164:103-108` selects only `t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at` and filters only `counts_for_allowance = TRUE`. The category mapping was specced but not built into the math layer. (`task_categories` IS a column on the live `allowance_configs` table — confirmed via grep — but the RPC ignores it.)

### What's the shape of adding pools?

Not asked to propose; describing the implementation surface only:

- Schema: **no existing column on tasks, task_templates, or allowance_configs accommodates a pool tag.** A new column would be needed (`tasks.allowance_pool_id` or `tasks.allowance_pool_name`) along with a new table (or JSONB on `allowance_configs`) defining the pools.
- RPC: the `FOR v_task IN SELECT ... FROM tasks` loop in `calculate_allowance_progress` is per-task. Every accumulator is a single scalar (`v_total_assigned`, `v_total_completed`, etc.). To return per-pool numbers, the RPC's RETURNS TABLE shape (currently 20 columns flat per `100175`) would need to become per-pool — likely a JSONB return or a `RETURNS SETOF` with one row per pool.
- Edge Function: `calculate-allowance-period/index.ts:284-316` writes ONE update to `allowance_periods` per period. With multiple pools, either (a) one row per pool per period (schema change to `allowance_periods` — currently UNIQUE doesn't enforce this but the trigger logic would shift), or (b) a JSONB sub-structure for per-pool details on the existing single row.
- Bonus logic: `bonus_threshold`, `bonus_percentage`, `bonus_flat_amount`, `bonus_type` are scalar columns on `allowance_configs`. Per-pool bonus would require either pool-shape JSONB or new `allowance_pools` table.
- Frontend: `AllowanceCalculatorTracker` reads ONE `liveProgress.completion_percentage`. Per-pool would require multiple data shapes feeding the widget.

### PRD-28 anticipations of pools that weren't built

None found. PRD-28 §322 is illustrative ("Jake's Week (Dynamic Pool)") — `Dynamic Pool` is the calculation_approach name, not a pool grouper. PRD-28 §319 confirms: "**Middle section: This Week's Progress** (one card per child with allowance enabled)" — one card per child, not per pool.

PRD-28 stubs section (§1027-1035) lists deferred items: Universal Timer integration, compliance reporting, biweekly/monthly periods, business work export. No multi-pool stub.

PRD-28 addendum (`prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md`) covers cross-PRD impacts but does not mention pools.

### Pools rolling up into other pools (hierarchy)

Not specified anywhere in PRD-28 or the addendum. There is no concept of pool hierarchy.

---

## 3. Time-attached tasks and tracker types

### Plain-English summary

PRD-36 Universal Timer is **specced and partially built**. `time_sessions` table is in production (live_schema row 1, columns include `task_id`, `widget_id`, `list_item_id`, `started_at`, `ended_at`, `duration_minutes`). The TimerProvider/FloatingBubble React layer ships. Time tracking integrates with tasks via the `task_id` FK. **However: time-tracking does not flow into the allowance percentage today.** The `calculate_allowance_progress` RPC does not read `time_sessions` at all. Trackers (PRD-10 widgets) can attach to tasks via `data_source_ids: UUID[]`, but the data flow is task_completion → widget_data_points (via spec, partially via app code), not the other way around.

### `time_sessions` table — built and schema

live_schema.md `time_sessions — 1 rows`. Columns confirmed in live schema:

```
id, family_id, family_member_id, started_by,
task_id, widget_id, list_item_id,
source_type, source_reference_id, timer_mode,
started_at, ended_at, duration_minutes,
is_standalone, standalone_label,
pomodoro_interval_number, pomodoro_config,
countdown_target_minutes, auto_paused,
edited, edited_by, edited_at, original_timestamps, edit_reason,
deleted_at, metadata, created_at
```

PRD-36 spec for the table at `prds/infrastructure/PRD-36-Universal-Timer.md:434-468`:

| Column | Type | Notes |
|---|---|---|
| `task_id` | UUID NULLABLE | FK → tasks (NULL for standalone/widget/list sessions) |
| `widget_id` | UUID NULLABLE | FK → dashboard_widgets |
| `list_item_id` | UUID NULLABLE | FK → list_items |
| `source_type` + `source_reference_id` | TEXT + UUID | Generic future attachment points |
| `duration_minutes` | INTEGER | Calculated on session end: `EXTRACT(EPOCH FROM ended_at - started_at) / 60` |

PRD-36 §468: "Dedicated FKs (`task_id`, `widget_id`, `list_item_id`) provide indexed query performance for the most common attachment points. The generic `source_type` + `source_reference_id` pair handles future attachment points (learning logs, project steps, etc.)..."

### Can a task have a time tracker that records "X minutes spent"?

Yes, via `time_sessions.task_id`. The `tasks` table has `time_tracking_enabled BOOLEAN` and `time_threshold_minutes INTEGER` columns (live_schema confirms these exist in the migrated live database). The TimerProvider in `src/features/timer/TimerProvider.tsx` exposes `startTimer({ task_id, ... })` which inserts a `time_sessions` row with `started_at = now()`. On stop, `ended_at = now()` and `duration_minutes` is computed.

PRD-36 §725: "Duration stored as INTEGER minutes in `duration_minutes` for completed sessions." (Consistent with PRD-28's homeschool minute-as-base-unit Convention #227.)

### Does PRD-10 widgets support tracker types that link to a task?

Yes via `dashboard_widgets.data_source_ids UUID[]`. PRD-10 §518: "Array of task_ids, routine_ids, etc. that feed this widget." `data_source_type` is a discriminator (live_schema confirms both columns exist).

PRD-10 §995: "Triggers added: Task completion → `widget_data_points` insert for linked widgets."

The `widget_data_points` table (live_schema confirms 67 rows, columns: `widget_id`, `family_member_id`, `recorded_at`, `recorded_date`, `value`, `value_type`, `metadata`, `recorded_by_member_id`) is the time-series store. `widget_data_points` is append-only per PRD-10 §976: "Never update or delete data points — always insert new ones."

### "If a kid practices piano for 15 minutes today and 30 minutes tomorrow, where does that data live?"

Two possible locations depending on how it was logged:

1. **Via Universal Timer with task_id FK** → `time_sessions` row(s). To roll up "minutes per week," a downstream consumer would `SELECT SUM(duration_minutes) FROM time_sessions WHERE task_id = ? AND family_member_id = ? AND started_at >= week_start GROUP BY ...`.
2. **Via PRD-10 widget data point manual entry** → `widget_data_points` row with `value = 15` etc.
3. **Via PRD-28 homework time logging** → `homeschool_time_logs` table (live_schema row, columns include `subject_id`, `task_id`, `log_date`, `minutes_logged`). For homeschool-tagged tasks specifically.

**Can a contract listen for "minutes accumulated above 60 this week"?** No such mechanism exists today. There is no event bus, no cron-backed threshold-evaluator, no trigger that fires "above-threshold" events. The closest analogue is `roll_creature_for_completion` (the gamification RPC) firing on `task_completions` insert — but that fires per task completion, not per cumulative threshold.

### Tracker types that already produce "firings"

The codebase has these completion-event consumers:
- `roll_creature_for_completion(p_task_completion_id)` — invoked from `useCompleteTask`, `useApproveTaskCompletion`, `useApproveCompletion`, `useApproveMasterySubmission` (Convention #198). Fires on task_completions insert. Returns gamification result (creature, page, points).
- `calculate_allowance_progress` is **not** a firing — it's a read-side RPC called by the live widget (every 15s stale) and the period-close Edge Function (hourly).
- `widget_data_points` inserts — append-only data store, not events.
- `time_sessions.ended_at` set — no trigger fires from this; `duration_minutes` is calculated by `tasks.recurrence_details`-aware code or app-side after stop.

PRD-10 §995 specs a trigger ("Task completion → `widget_data_points` insert for linked widgets") that would qualify as a "firing," but per `WIRING_STATUS.md` `Track | Notepad | Widget data point | Stub | PRD-10 widget data routing not built`. So the spec says trackers fire from tasks, but the trigger isn't built end-to-end.

---

## 4. The numerator boost concept (`is_extra_credit`, `extra_credit_enabled`)

### Plain-English summary

`tasks.is_extra_credit` does match the founder's framing: a true value adds the task's completion to the numerator without adding it to the denominator. There are TWO toggles: per-task (`tasks.is_extra_credit`) and per-child config (`allowance_configs.extra_credit_enabled`). BOTH must be true for the task to participate as extra credit; if `extra_credit_enabled=false` at the config layer, an `is_extra_credit=true` task is **silently skipped** by the RPC (not counted as regular either). For repeatable tasks (the "do as many as needed" case), there is partial support via `tasks.max_completions` and opportunity sub-types, but **the allowance RPC does not currently handle multi-completions-per-day per task** — it reads `t.status = 'completed'` once per task, not per completion.

### `tasks.is_extra_credit` — current behavior

`supabase/migrations/00000000100170_tasks_is_extra_credit_column.sql` (verbatim quoted in §0.4 above). Default false on both tables.

`COMMENT ON COLUMN public.tasks.is_extra_credit`:
> "PRD-28 Extra Credit: when true + counts_for_allowance=true, this task counts into the numerator of the allowance completion % but NOT the denominator. Capped at 100% effective completion. Designated by mom in TaskCreationModal. Consumed by calculate_allowance_progress RPC."

### `allowance_configs.extra_credit_enabled` — current behavior

Master toggle per child. `100171:170-188` in the RPC (quoted in §0.4):

```sql
IF v_task.is_extra_credit = TRUE
   AND v_task.task_type <> 'routine'
   AND COALESCE(v_config.extra_credit_enabled, FALSE) = TRUE THEN
  ...
  CONTINUE;
END IF;
```

Three rules:
1. If `extra_credit_enabled = false` AND `is_extra_credit = true` → the task is **skipped entirely** (not counted as denominator OR numerator). This is the comment at `100171:32-35`: "When disabled, is_extra_credit=true tasks are ignored entirely (not counted toward denominator as a fallback — they remain out-of-pool since they were never in the denominator)."
2. Routine-type extra credit is NOT a spec pattern. Routines with `is_extra_credit=true` fall through to regular routine handling (`100171:36-39`, `100171:177` — `task_type <> 'routine'` gate).
3. Effective completion still capped at 100% — extra credit can restore but not push above (PRD-28 §979).

### Does it match the founder's framing "adds to numerator without adding to denominator"?

Yes, exactly. Quoted from `100171:21-28`:

> Math (PRD-28 L979 authoritative):
>   1. Extra-credit tasks are EXCLUDED from the denominator entirely.
>      They do not shrink the denominator; they do not grow it.
>   2. Regular tasks contribute to both denominator and numerator as before.
>   3. Extra-credit completions ADD to the numerator only.

### "Do as many as needed with a required floor" — is this modeled today?

**Partial support, not designed for the use case.** Three relevant fields exist:

- **`tasks.max_completions INTEGER`** — added in `100023:222`. PRD-09A `opportunity_capped` sub-type uses this for "max total completions across the family," not "max per kid per day." See `100134:325-336` for the task_type CHECK including `'opportunity_capped'`.
- **`tasks.task_type` enum** — `task | routine | opportunity_repeatable | opportunity_claimable | opportunity_capped | sequential | habit | guided_form | list | makeup` (`100134:325-336`). The opportunity sub-types are about claiming and repeating, not about per-day-floor semantics.
- **`task_completions` table — multi-row per task allowed** — but the RPC reads `t.status = 'completed'`, not `COUNT(*) FROM task_completions WHERE task_id = ?`. The `tasks.status` column is binary: `pending | completed | etc.` — it doesn't accumulate.

**For non-routine repeatable tasks**, the allowance RPC `100164:211-218` reads:

```sql
ELSE
  v_nonroutine_total := v_nonroutine_total + 1;
  IF v_task.status = 'completed' THEN
    v_nonroutine_completed := v_nonroutine_completed + 1;
    v_total_completed := v_total_completed + v_pool_fraction;
    v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
  END IF;
END IF;
```

So a task that the kid completes 5 times this week (creating 5 `task_completions` rows but the parent `tasks.status = 'completed'`) contributes **one slice** to the numerator, not five.

**For routines**, the situation is different — `routine_step_completions` IS multi-row per (step, day) tolerated, and the RPC dedupes per `(step_id, period_date)` (`100164:185-196`). So a kid who does "Take Out Trash" routine step every day for a week contributes 7 distinct numerator events (one per day, deduped within day).

### Once-per-day binary tasks vs. "do as many as needed" tasks

The founder's distinction between "toilet wash (once per day, binary)" and "do as many as needed with a required floor" is **not currently modeled at the `tasks` table level**. There are two adjacent shapes that don't quite fit:

- `task_template_steps.instance_count INTEGER` (live_schema row 8 column) — the per-routine-step "how many checkboxes per day" count. Convention #20 explains this is the "instance_number = separate checkboxes" pattern. So a routine step "Take a vitamin" with `instance_count = 2` shows two checkboxes per day. This IS a "do N per day" mechanism, but only for routine steps, and the floor is exact (N), not "≥ N".
- `tasks.max_completions` for opportunity_capped — global max, not per-day floor.

**No `min_completions_per_period` or `floor_per_day` field exists on tasks or task_templates** (verified by reading the column lists for both tables in live_schema.md).

The pattern "this task can be completed multiple times per day, and each completion contributes incrementally" — the closest current support is `instance_count` on routine steps, which produces the multi-checkbox UI but is fixed (exactly N checkboxes), not "≥ N with a floor for credit."

---

## Summary of highest-impact findings

The single-pool allowance math is mathematically tighter than expected: the RPC's accumulators (`v_total_assigned`, `v_total_completed`, `v_total_points`, `v_completed_points`) are scalar singletons, the `RETURNS TABLE` is a 20-column flat shape, and `bonus_threshold`/`bonus_percentage`/`bonus_flat_amount` are scalar columns on `allowance_configs` (one row per kid, UNIQUE `family_member_id`). Multi-pool would require restructuring these accumulators into per-pool maps and changing the RPC return shape — not a single-column addition. Most surprisingly, `calculation_approach='fixed'` and `'dynamic'` are mathematically identical in current code (both fall through the same ELSE branch); only `'points_weighted'` branches differently. The `task_categories JSONB` column on `allowance_configs` was specced for category filtering but the live RPC never reads it. Pools are mentioned exactly zero times across PRD-28, the addendum, schema migrations, and frontend code. PRD-35 Universal Scheduler is built as a declarative recurrence-config component — it does not have "stroke_of"/"fire-on-event" vocabulary; period-end firing is currently handled by `pg_cron + util.invoke_edge_function('calculate-allowance-period')`. PRD-36 Universal Timer is in production with `time_sessions.task_id` FK linkage, but `calculate_allowance_progress` does not read `time_sessions` — time-spent does not flow into the allowance percentage today. `is_extra_credit` matches the founder's "numerator without denominator" framing exactly, but "do as many as needed with a per-day floor" is not modeled — `tasks.max_completions` is a global cap, `instance_count` is a fixed-N count on routine steps, and there is no `min_completions_per_period` field anywhere.
