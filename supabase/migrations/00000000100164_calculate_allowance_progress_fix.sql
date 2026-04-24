-- Row 9 SCOPE-3.F14 / Worker B1a — calculate_allowance_progress correctness fixes
--
-- Replaces the RPC body introduced in migration 100156 to fix two defects that
-- skewed live allowance math. Return signature is unchanged (18 columns), so
-- CREATE OR REPLACE FUNCTION without DROP is safe and keeps all existing
-- callers working (AllowanceCalculatorTracker widget + calculate-allowance-period
-- Edge Function).
--
-- Bug 1 — Weekday-filter asymmetry.
--   The denominator ("total possible steps this period") correctly walks each
--   day in [period_start, period_end], reads the DOW, and sums only steps
--   whose section.frequency_days includes that weekday.
--   The numerator ("completed steps this period") did NOT apply the same
--   filter — it counted every completion row whose period_date landed in the
--   range, regardless of whether the step's section was active that day. A
--   kid who checks a Monday/Wednesday/Friday step on a Tuesday would
--   contribute to the numerator but not the denominator. The LEAST(…, 1)
--   fraction cap prevented > 100% but the internal tally was still wrong,
--   pushing completion percentages higher than the rubric specifies.
--
-- Bug 2 — No dedupe per step/day in the numerator.
--   routine_step_completions has no unique index on (step_id, period_date)
--   (instance_number allows multi-instance practice within a day). A kid who
--   checks a step, unchecks it, and re-checks it can produce two rows in the
--   table. For allowance purposes, each step counts at most once per day.
--
-- Fix for both: inner subquery joins the completion to its step → section,
-- applies the DOW-matches-frequency_days filter, and deduplicates on
-- (step_id, period_date).
--
-- Production correction: after this migration lands, every child's live
-- allowance tally may shift. Worker B1a's final report includes a per-child
-- pre-fix-vs-post-fix delta spot-check against a representative Wednesday
-- snapshot so the founder can verify the shift matches intuition.

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
  nonroutine_tasks_completed INTEGER
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
      0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;

  v_period_days := (p_period_end - p_period_start) + 1;
  IF v_period_days < 1 THEN
    v_period_days := 1;
  END IF;
  v_base := COALESCE(v_config.weekly_amount, 0);

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
      -- Denominator: frequency-day-aware total possible steps in period.
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

      -- Numerator: same frequency-day filter + dedupe per (step, day).
      --
      -- Bug 1 fix: only count completions that landed on a day where the
      -- step's section was scheduled active (DOW ∈ section.frequency_days).
      -- An off-schedule completion is still a real completion in the raw
      -- table and still earns the kid its per-task creature-reveal roll via
      -- the roll_creature_for_completion RPC, but it does NOT count toward
      -- the allowance rubric, which is defined against the scheduled week.
      --
      -- Bug 2 fix: DISTINCT on (step_id, period_date) so that repeated
      -- check/uncheck/re-check cycles within a single day count once.
      --
      -- Also bound period_date to the effective_start..period_end window so
      -- completions logged before the task was created don't leak in.
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
    v_nonroutine_completed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE) IS
  'Row 9 SCOPE-3.F14 / Worker B1a. Live allowance tallying for a member over an arbitrary period. Frequency-day-aware on BOTH sides (denominator + numerator, fixing migration 100156 asymmetry) and dedupes completions per (step_id, period_date) to prevent repeated-check inflation. 18-column return signature preserved.';
