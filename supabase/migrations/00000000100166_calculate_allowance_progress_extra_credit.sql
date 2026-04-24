-- Worker B1b / NEW-EE — calculate_allowance_progress adds Extra Credit separation.
--
-- Replaces the 18-column RPC from migration 100164 with a 20-column return
-- signature that exposes extra-credit tallying separately from regular
-- completion tallying. Both callers (useLiveAllowanceProgress in the live
-- widget + the calculate-allowance-period Edge Function) are updated in
-- the same B1b landing.
--
-- Signature change rationale (founder-approved 2026-04-24):
--   allowance_periods.extra_credit_completed is a first-class table column
--   per PRD-28 schema. Stuffing the counter into calculation_details JSONB
--   would hide it from SQL consumers and create a table/RPC contract drift.
--   The two new columns make the RPC match the table contract.
--
-- New columns:
--   extra_credit_completed   INTEGER  — count of completed tasks where
--                                       tasks.is_extra_credit = true
--   extra_credit_weight_added NUMERIC — weighted contribution to numerator
--                                       (honors points_weighted approach)
--
-- Math (PRD-28 L979 authoritative):
--   1. Extra-credit tasks are EXCLUDED from the denominator entirely.
--      They do not shrink the denominator; they do not grow it.
--   2. Regular tasks contribute to both denominator and numerator as before.
--   3. Extra-credit completions ADD to the numerator only. In Dynamic
--      approach they add fraction-weighted tallies; in Points-Weighted they
--      add weight × pool_fraction to v_completed_points.
--   4. Completion % is still capped at 100%. Extra credit restores toward
--      100% but cannot push above it. Bonus threshold is evaluated against
--      the capped percentage.
--   5. Extra-credit counting respects allowance_configs.extra_credit_enabled.
--      When disabled, is_extra_credit=true tasks are ignored entirely (not
--      counted toward denominator as a fallback — they remain out-of-pool
--      since they were never in the denominator).
--
-- Non-routine extra-credit tasks only. Routines with is_extra_credit=true are
-- not a spec pattern — routines are the "regular rhythm" of the week; extra
-- credit is a discrete task mom designates ad-hoc. If a future PRD needs
-- extra-credit routines, the RPC's routine branch gets the same treatment.

CREATE OR REPLACE FUNCTION public.calculate_allowance_progress(
  p_member_id UUID,
  p_period_start DATE,
  p_period_end DATE
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

    -- Extra-credit branch: excluded from denominator entirely. Only counted
    -- in numerator on completion, and only when the child's config has
    -- extra_credit_enabled = true. Routine-type extra credit is not a spec
    -- pattern today — flag it for future consideration but treat as regular
    -- non-routine for now (routine.is_extra_credit=true falls through to the
    -- else branch and gets counted normally).
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

    -- Regular task: denominator + numerator as before.
    v_total_assigned := v_total_assigned + v_pool_fraction;
    v_total_points := v_total_points + (v_weight * v_pool_fraction);

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
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

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE) IS
  'Worker B1b / NEW-EE. Live allowance tallying with Extra Credit separation. Returns 20 columns (18 base + extra_credit_completed + extra_credit_weight_added). Extra-credit tasks excluded from denominator, counted in numerator only when extra_credit_enabled=true in config, capped at 100%. Replaces migration 100164 body; preserves all its corrections (frequency-day-aware tally + dedupe per step/day). Routine-type extra credit falls through to regular routine handling — spec pattern is non-routine tasks only.';
