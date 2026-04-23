-- Allowance progress RPC — frequency-day-aware live tallying
--
-- Replaces the inline denominator logic in supabase/functions/calculate-allowance-period
-- which multiplied total_template_steps × days_in_period, ignoring task_template_sections.frequency_days.
-- That produced denominators several times larger than the true number of step
-- opportunities a kid could actually complete in a week.
--
-- The RPC walks each day in the period, reads the day-of-week, and sums only
-- the steps whose section's frequency_days includes that weekday. Both the
-- Edge Function (at period close) and the AllowanceCalculatorTracker widget
-- (live, mid-period) call this function, so the math is authoritative in SQL.

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
  rounding_behavior TEXT
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
  v_caller_family UUID;
  v_member_family UUID;
BEGIN
  -- Authorization: caller must be service_role OR share a family with the target member
  SELECT family_id INTO v_member_family FROM family_members WHERE id = p_member_id;
  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() <> 'service_role' THEN
    SELECT family_id INTO v_caller_family
    FROM family_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_caller_family IS NULL OR v_caller_family <> v_member_family THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  -- Load config
  SELECT * INTO v_config
  FROM allowance_configs
  WHERE family_member_id = p_member_id;

  IF NOT FOUND OR NOT v_config.enabled THEN
    RETURN QUERY SELECT
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::INTEGER, 0::INTEGER, 'dynamic'::TEXT, 'round_nearest'::TEXT;
    RETURN;
  END IF;

  v_period_days := (p_period_end - p_period_start) + 1;
  IF v_period_days < 1 THEN
    v_period_days := 1;
  END IF;
  v_base := COALESCE(v_config.weekly_amount, 0);

  -- Iterate tasks eligible for allowance this period
  FOR v_task IN
    SELECT t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at
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
    v_total_assigned := v_total_assigned + v_pool_fraction;
    v_total_points := v_total_points + (v_weight * v_pool_fraction);

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
      -- Frequency-day-aware denominator: walk each active day, sum only steps
      -- whose section.frequency_days includes that weekday.
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

      SELECT COUNT(*)::INT INTO v_routine_actual_completed
      FROM routine_step_completions rsc
      WHERE rsc.task_id = v_task.id
        AND rsc.member_id = p_member_id
        AND rsc.period_date BETWEEN p_period_start AND p_period_end;

      IF v_routine_total_possible > 0 THEN
        v_routine_fraction := LEAST(v_routine_actual_completed::NUMERIC / v_routine_total_possible, 1);
        v_total_completed := v_total_completed + (v_routine_fraction * v_pool_fraction);
        v_completed_points := v_completed_points + (v_weight * v_routine_fraction * v_pool_fraction);
      END IF;
    ELSIF v_task.status = 'completed' THEN
      v_total_completed := v_total_completed + v_pool_fraction;
      v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
    END IF;
  END LOOP;

  -- Completion percentage
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

  -- Base amount scaled by completion
  v_calc_amount := v_base * (v_completion_pct / 100);
  IF v_completion_pct < COALESCE(v_config.minimum_threshold, 0) THEN
    v_calc_amount := 0;
  END IF;

  -- Bonus
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
    COALESCE(v_config.rounding_behavior, 'round_nearest')::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE) TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE) IS
  'Live allowance tallying for a member over an arbitrary period. Frequency-day-aware: walks each day in [period_start, period_end], reads day-of-week, and sums only template steps whose section.frequency_days includes that weekday. Used by the AllowanceCalculatorTracker widget (live) and the calculate-allowance-period Edge Function (at period close). SECURITY DEFINER with caller-must-share-family check; service_role bypasses the check.';
