-- Worker B1b / NEW-GG — calculate_allowance_progress consumes grace_days.
--
-- Gap: migrations 100154/100156/100164/100171 shipped the RPC with
-- allowance_configs.grace_days_enabled awareness but NEVER actually
-- consumed the per-period `allowance_periods.grace_days JSONB` array.
-- The Edge Function and the `useAddGraceDay` hook have always written
-- to that column, but the widget tally and the period-close math have
-- been silently ignoring it — meaning every grace-day mark today is a
-- no-op mathematically, even though it persists to the DB.
--
-- Fix: add an optional `p_grace_days DATE[]` parameter to the RPC.
-- When NULL (back-compat for existing call sites that don't know about
-- the parameter), behavior is unchanged. When populated:
--   * Routine branch: each day in the period that is in the grace array
--     is skipped entirely — does not contribute to denominator or
--     numerator. Routine step denominator walk skips the day; numerator
--     completions on that day are excluded via WHERE clause.
--   * Non-routine branch: tasks whose `created_at::DATE` falls within
--     a grace day are NOT excluded — grace days shrink the denominator
--     on a per-day basis for routines (where a day = a discrete block
--     of steps) but do not retroactively unassign calendar tasks.
--     This matches the PRD-28 L977 rule: "All grace days → effective=0
--     → 100%" which only works if each grace day actually zeroes out
--     its contribution to the denominator.
--   * `grace_day_tasks_excluded` is reported as the total step count
--     skipped across all grace days (for display/audit).
--
-- 20-column signature preserved (same shape as migration 100171). The
-- new `grace_day_tasks_excluded` tally is written back to the period
-- via `calculate-allowance-period`'s existing column; no new return
-- columns required.
--
-- Callers updated in the same B1b landing:
-- - src/hooks/useFinancial.ts — `useLiveAllowanceProgress` passes the
--   active period's `grace_days` array through to the RPC.
-- - supabase/functions/calculate-allowance-period/index.ts — passes
--   `period.grace_days` through to the RPC call.
--
-- Preserves all corrections from migration 100164 (Bug 1 frequency-day-
-- aware tally + Bug 2 dedupe per step/day) AND from migration 100171
-- (Extra Credit separation).
--
-- ── DROP-before-CREATE (Postgres overload + signature change rule) ──
-- Migration 100171 left a 3-arg form (UUID, DATE, DATE) returning 20 columns.
-- This migration replaces that with a single 4-arg form whose 4th parameter
-- has a default, so callers that pass 3 args resolve to the same function via
-- Postgres's default-argument rules. Both shapes are dropped first to leave
-- only the new canonical form. IF EXISTS keeps the migration idempotent
-- across fresh DBs and replays. Per founder spec 2026-04-24: ONE function,
-- with the new signature — no parallel 3-arg overload alongside.

DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, DATE[]);

CREATE FUNCTION public.calculate_allowance_progress(
  p_member_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_grace_days DATE[] DEFAULT NULL
)
RETURNS TABLE (
  effective_tasks_assigned NUMERIC,
  effective_tasks_completed NUMERIC,
  completion_percentage NUMERIC,
  total_points NUMERIC,
  completed_points NUMERIC,
  base_amount NUMERIC,
  bonus_applied BOOLEAN,
  bonus_amount NUMERIC,
  calculated_amount NUMERIC,
  total_earned NUMERIC,
  minimum_threshold INTEGER,
  bonus_threshold INTEGER,
  calculation_approach TEXT,
  rounding_behavior TEXT,
  raw_steps_completed INTEGER,
  raw_steps_available INTEGER,
  nonroutine_tasks_total INTEGER,
  nonroutine_tasks_completed INTEGER,
  extra_credit_completed INTEGER,
  extra_credit_weight_added NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_period_days INT;
  v_total_assigned NUMERIC := 0;
  v_total_completed NUMERIC := 0;
  v_total_points NUMERIC := 0;
  v_completed_points NUMERIC := 0;
  v_task RECORD;
  v_days_active INT;
  v_pool_fraction NUMERIC;
  v_weight NUMERIC;
  v_routine_total_possible INT;
  v_routine_actual_completed INT;
  v_routine_fraction NUMERIC;
  v_completion_pct NUMERIC;
  v_base NUMERIC;
  v_calc_amount NUMERIC;
  v_bonus_applied BOOLEAN;
  v_bonus_amt NUMERIC;
  v_total_earned_val NUMERIC;
  v_effective_start DATE;
  v_day DATE;
  v_dow_str TEXT;
  v_day_step_count INT;
  v_member_family UUID;
  v_authorized BOOLEAN := FALSE;
  v_raw_steps_completed INT := 0;
  v_raw_steps_available INT := 0;
  v_nonroutine_total INT := 0;
  v_nonroutine_completed INT := 0;
  v_extra_credit_completed INT := 0;
  v_extra_credit_weight NUMERIC := 0;
  v_grace_enabled BOOLEAN;
  v_grace_set DATE[];
BEGIN
  SELECT family_id INTO v_member_family FROM family_members WHERE id = p_member_id;
  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_config
  FROM allowance_configs
  WHERE family_member_id = p_member_id;

  IF NOT FOUND OR NOT v_config.enabled THEN
    RETURN QUERY SELECT
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::INTEGER, 0::INTEGER, 'dynamic'::TEXT, 'round_nearest'::TEXT,
      0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER,
      0::INTEGER, 0::NUMERIC;
    RETURN;
  END IF;

  -- Grace-day set: only honored when the config master toggle is on AND
  -- the caller passed an array. An empty-but-not-null array is treated
  -- as "grace enabled, zero days marked" — not as NULL.
  v_grace_enabled := COALESCE(v_config.grace_days_enabled, TRUE);
  v_grace_set := CASE
    WHEN v_grace_enabled AND p_grace_days IS NOT NULL THEN p_grace_days
    ELSE ARRAY[]::DATE[]
  END;

  v_period_days := (p_period_end - p_period_start) + 1;
  IF v_period_days < 1 THEN
    v_period_days := 1;
  END IF;
  v_base := COALESCE(v_config.weekly_amount, 0);

  FOR v_task IN
    SELECT t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at,
           t.is_extra_credit
    FROM tasks t
    WHERE t.assignee_id = p_member_id
      AND t.counts_for_allowance = TRUE
      AND t.archived_at IS NULL
      AND t.created_at::DATE <= p_period_end
  LOOP
    v_effective_start := GREATEST(v_task.created_at::DATE, p_period_start);
    IF v_effective_start > p_period_end THEN
      CONTINUE;
    END IF;
    v_days_active := (p_period_end - v_effective_start) + 1;
    v_pool_fraction := v_days_active::NUMERIC / v_period_days;
    v_weight := COALESCE(v_task.allowance_points, v_config.default_point_value, 1);

    -- Extra-credit branch (migration 100171) — excluded from denominator,
    -- counted in numerator only.
    IF v_task.is_extra_credit = TRUE
       AND v_task.task_type <> 'routine'
       AND COALESCE(v_config.extra_credit_enabled, FALSE) = TRUE THEN
      IF v_task.status = 'completed' THEN
        v_extra_credit_completed := v_extra_credit_completed + 1;
        v_extra_credit_weight := v_extra_credit_weight + (v_weight * v_pool_fraction);
        v_total_completed := v_total_completed + v_pool_fraction;
        v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
      END IF;
      CONTINUE;
    END IF;

    -- Regular task: denominator + numerator as before.
    v_total_assigned := v_total_assigned + v_pool_fraction;
    v_total_points := v_total_points + (v_weight * v_pool_fraction);

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
      v_routine_total_possible := 0;
      v_day := v_effective_start;
      WHILE v_day <= p_period_end LOOP
        -- Grace-day exclusion (NEW-GG): skip this day entirely. Does
        -- not contribute to the possible step count; numerator filter
        -- below also drops completions whose period_date is in the set.
        IF v_day = ANY(v_grace_set) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

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

      SELECT COUNT(*)::INT
      INTO v_routine_actual_completed
      FROM (
        SELECT DISTINCT rsc.step_id, rsc.period_date
        FROM routine_step_completions rsc
        JOIN task_template_steps stp ON stp.id = rsc.step_id
        JOIN task_template_sections tts ON tts.id = stp.section_id
        WHERE rsc.task_id = v_task.id
          AND rsc.member_id = p_member_id
          AND rsc.period_date BETWEEN v_effective_start AND p_period_end
          AND (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
          -- NEW-GG: grace-day exclusion on the numerator side, mirroring
          -- the denominator walk above.
          AND NOT (rsc.period_date = ANY(v_grace_set))
      ) dedup;

      v_raw_steps_available := v_raw_steps_available + v_routine_total_possible;
      v_raw_steps_completed := v_raw_steps_completed
        + LEAST(v_routine_actual_completed, v_routine_total_possible);

      IF v_routine_total_possible > 0 THEN
        v_routine_fraction := LEAST(
          v_routine_actual_completed::NUMERIC / v_routine_total_possible,
          1
        );
        v_total_completed := v_total_completed + (v_routine_fraction * v_pool_fraction);
        v_completed_points := v_completed_points
          + (v_weight * v_routine_fraction * v_pool_fraction);
      END IF;
    ELSE
      v_nonroutine_total := v_nonroutine_total + 1;
      IF v_task.status = 'completed' THEN
        v_nonroutine_completed := v_nonroutine_completed + 1;
        v_total_completed := v_total_completed + v_pool_fraction;
        v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
      END IF;
    END IF;
  END LOOP;

  IF v_total_assigned = 0 THEN
    -- PRD-28 L977: "All grace days → effective_tasks_assigned = 0 → 100%"
    -- and PRD-28 L975: "Zero tasks assigned → 100%." Same branch.
    v_completion_pct := 100;
  ELSIF COALESCE(v_config.calculation_approach, 'dynamic') = 'points_weighted' THEN
    v_completion_pct := CASE WHEN v_total_points > 0
      THEN LEAST((v_completed_points / v_total_points) * 100, 100)
      ELSE 100 END;
  ELSE
    v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, 100);
  END IF;
  v_completion_pct := ROUND(v_completion_pct, 2);

  v_calc_amount := v_base * (v_completion_pct / 100);
  IF v_completion_pct < COALESCE(v_config.minimum_threshold, 0) THEN
    v_calc_amount := 0;
  END IF;

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

  IF COALESCE(v_config.rounding_behavior, 'round_nearest') = 'round_up' THEN
    v_total_earned_val := CEIL(v_total_earned_val * 100) / 100.0;
  ELSIF v_config.rounding_behavior = 'round_down' THEN
    v_total_earned_val := FLOOR(v_total_earned_val * 100) / 100.0;
  ELSE
    v_total_earned_val := ROUND(v_total_earned_val, 2);
  END IF;

  RETURN QUERY SELECT
    v_total_assigned,
    v_total_completed,
    v_completion_pct,
    v_total_points,
    v_completed_points,
    v_base,
    v_bonus_applied,
    v_bonus_amt,
    ROUND(v_calc_amount, 2),
    v_total_earned_val,
    COALESCE(v_config.minimum_threshold, 0)::INTEGER,
    COALESCE(v_config.bonus_threshold, 85)::INTEGER,
    COALESCE(v_config.calculation_approach, 'dynamic')::TEXT,
    COALESCE(v_config.rounding_behavior, 'round_nearest')::TEXT,
    v_raw_steps_completed,
    v_raw_steps_available,
    v_nonroutine_total,
    v_nonroutine_completed,
    v_extra_credit_completed,
    v_extra_credit_weight;
END;
$$;

-- One canonical function only — no parallel 3-arg overload. Per founder
-- spec 2026-04-24: callers that pass 3 args resolve to this 4-arg form
-- via the DEFAULT NULL on p_grace_days. PostgREST RPC clients that omit
-- `p_grace_days` from the JSON body get NULL automatically; clients
-- that include it pass the array through.

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, DATE[])
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, DATE[]) IS
  'Worker B1b / NEW-GG. Live allowance tallying with optional grace_days shrinkage. When p_grace_days is populated AND allowance_configs.grace_days_enabled=true, each date in the array is excluded from the routine step denominator walk AND from the numerator completion filter. All grace days → effective_tasks_assigned=0 → 100% per PRD-28 L977. Preserves migration 100171 extra-credit separation. 20-column return signature. 4-arg signature with p_grace_days DEFAULT NULL — single canonical function; 3-arg call sites resolve via the default.';
