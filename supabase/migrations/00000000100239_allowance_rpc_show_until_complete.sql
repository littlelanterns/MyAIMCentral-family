-- ============================================================================
-- 100239 — Allowance RPC honors show_until_complete on routine sections
--
-- Bug: When a routine section had `show_until_complete = true` (e.g. the
-- "Wednesday — Fridge & Fixtures" section in mom's kitchen template), the
-- dashboard correctly kept it visible past Wednesday so the kid could catch
-- up. But calculate_allowance_progress was filtering completions by
-- `EXTRACT(DOW FROM rsc.period_date) = ANY(tts.frequency_days)` — meaning
-- a Wednesday-only step checked on Thursday was thrown out of the numerator
-- and the kid's allowance percentage didn't move. The denominator still
-- counted that Wednesday step, so the kid was guaranteed to lose those
-- points by doing the work even one day late.
--
-- Founder rule: a section with `show_until_complete = true` should count
-- toward allowance whenever the kid checks it, on any day in the period.
-- A section with `show_until_complete = false` keeps the same-weekday-only
-- behavior (the "Every Day Mon–Sat" pattern that disappears if missed).
--
-- This migration is identical to 100235 except for one OR clause on the
-- routine numerator query (line 259 of 100235 → relaxed here). Denominator
-- logic, grace day handling, extra credit, numerator boost, pool fraction,
-- bonus, rounding — all unchanged.
--
-- Safe to apply: idempotent CREATE OR REPLACE, same signature, same return
-- shape. No data migration required. Effect on Gideon's current period:
-- his Wednesday-section completions (already in the database, just being
-- filtered out) will start showing up in the percentage immediately.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_allowance_progress(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE,
  p_grace_days   JSONB DEFAULT NULL,
  p_pool_name    TEXT  DEFAULT 'default'
)
RETURNS TABLE (
  pool_name                TEXT,
  effective_tasks_assigned NUMERIC,
  effective_tasks_completed NUMERIC,
  completion_percentage    NUMERIC,
  total_points             NUMERIC,
  completed_points         NUMERIC,
  base_amount              NUMERIC,
  bonus_applied            BOOLEAN,
  bonus_amount             NUMERIC,
  calculated_amount        NUMERIC,
  total_earned             NUMERIC,
  minimum_threshold        INTEGER,
  bonus_threshold          INTEGER,
  calculation_approach     TEXT,
  rounding_behavior        TEXT,
  raw_steps_completed      INTEGER,
  raw_steps_available      INTEGER,
  nonroutine_tasks_total   INTEGER,
  nonroutine_tasks_completed INTEGER,
  extra_credit_completed   INTEGER,
  extra_credit_weight_added NUMERIC,
  numerator_boost_total    NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_config_id UUID;
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
  v_overage_cap NUMERIC;
  v_full_exclude_set DATE[] := ARRAY[]::DATE[];
  v_numerator_keep_set DATE[] := ARRAY[]::DATE[];
  v_grace_entry JSONB;
  v_grace_date DATE;
  v_grace_mode TEXT;
  v_numerator_boost NUMERIC := 0;
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
  WHERE family_member_id = p_member_id
    AND allowance_configs.pool_name = p_pool_name;

  IF NOT FOUND OR NOT v_config.enabled THEN
    RETURN QUERY SELECT
      p_pool_name,
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::INTEGER, 0::INTEGER, 'dynamic'::TEXT, 'round_nearest'::TEXT,
      0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER,
      0::INTEGER, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  v_config_id := v_config.id;
  v_overage_cap := COALESCE(v_config.overage_cap, 100);

  v_grace_enabled := COALESCE(v_config.grace_days_enabled, TRUE);
  IF v_grace_enabled AND p_grace_days IS NOT NULL AND jsonb_typeof(p_grace_days) = 'array' THEN
    FOR v_grace_entry IN SELECT * FROM jsonb_array_elements(p_grace_days) LOOP
      IF jsonb_typeof(v_grace_entry) = 'string' THEN
        BEGIN
          v_grace_date := (v_grace_entry #>> '{}')::DATE;
          v_full_exclude_set := array_append(v_full_exclude_set, v_grace_date);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSIF jsonb_typeof(v_grace_entry) = 'object' THEN
        BEGIN
          v_grace_date := (v_grace_entry ->> 'date')::DATE;
          v_grace_mode := COALESCE(v_grace_entry ->> 'mode', 'full_exclude');
          IF v_grace_mode = 'numerator_keep' THEN
            v_numerator_keep_set := array_append(v_numerator_keep_set, v_grace_date);
          ELSE
            v_full_exclude_set := array_append(v_full_exclude_set, v_grace_date);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
    END LOOP;
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
      AND (
        t.pool_id = v_config_id
        OR (t.pool_id IS NULL AND p_pool_name = 'default')
      )
  LOOP
    v_effective_start := GREATEST(v_task.created_at::DATE, p_period_start);
    IF v_effective_start > p_period_end THEN
      CONTINUE;
    END IF;
    v_days_active := (p_period_end - v_effective_start) + 1;
    v_pool_fraction := v_days_active::NUMERIC / v_period_days;
    v_weight := COALESCE(v_task.allowance_points, v_config.default_point_value, 1);

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

    v_total_assigned := v_total_assigned + v_pool_fraction;
    v_total_points := v_total_points + (v_weight * v_pool_fraction);

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
      v_routine_total_possible := 0;
      v_day := v_effective_start;
      WHILE v_day <= p_period_end LOOP
        IF v_day = ANY(v_full_exclude_set) OR v_day = ANY(v_numerator_keep_set) THEN
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

      -- ── ONLY DIFFERENCE FROM 100235 ──
      -- Numerator: include this completion if EITHER
      --   (a) the section is show_until_complete (catch-up allowed any day), OR
      --   (b) the completion's day-of-week matches the section's scheduled days.
      -- Denominator above is unchanged — each day's scheduled steps still count
      -- once, so the kid's percentage tops out at 100% (also enforced by
      -- LEAST(... , 1) on v_routine_fraction below).
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
          AND (
            tts.show_until_complete = TRUE
            OR (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
          )
          AND NOT (rsc.period_date = ANY(v_full_exclude_set))
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

  SELECT COALESCE(SUM((cgl.metadata ->> 'boost_weight')::decimal), 0)
  INTO v_numerator_boost
  FROM contract_grant_log cgl
  JOIN deed_firings df ON df.id = cgl.deed_firing_id
  WHERE cgl.godmother_type = 'numerator'
    AND cgl.status = 'granted'
    AND cgl.metadata ->> 'family_member_id' = p_member_id::text
    AND COALESCE(cgl.metadata ->> 'pool_name', 'default') = p_pool_name
    AND df.fired_at::date BETWEEN p_period_start AND p_period_end;

  v_total_completed := v_total_completed + v_numerator_boost;
  v_completed_points := v_completed_points + v_numerator_boost;

  IF v_total_assigned = 0 THEN
    v_completion_pct := 100;
  ELSIF COALESCE(v_config.calculation_approach, 'dynamic') = 'points_weighted' THEN
    v_completion_pct := CASE WHEN v_total_points > 0
      THEN LEAST((v_completed_points / v_total_points) * 100, v_overage_cap)
      ELSE 100 END;
  ELSE
    v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, v_overage_cap);
  END IF;

  IF v_completion_pct < COALESCE(v_config.minimum_threshold, 0) THEN
    v_calc_amount := 0;
  ELSE
    v_calc_amount := v_base * (v_completion_pct / 100);
  END IF;

  v_bonus_applied := v_completion_pct >= COALESCE(v_config.bonus_threshold, 90);
  IF v_bonus_applied THEN
    IF COALESCE(v_config.bonus_type, 'percentage') = 'flat' THEN
      v_bonus_amt := COALESCE(v_config.bonus_flat_amount, 0);
    ELSE
      v_bonus_amt := v_calc_amount * (COALESCE(v_config.bonus_percentage, 0) / 100);
    END IF;
  ELSE
    v_bonus_amt := 0;
  END IF;

  CASE COALESCE(v_config.rounding_behavior, 'nearest_cent')
    WHEN 'round_up' THEN
      v_calc_amount := CEIL(v_calc_amount * 100) / 100;
      v_bonus_amt := CEIL(v_bonus_amt * 100) / 100;
    WHEN 'round_down' THEN
      v_calc_amount := FLOOR(v_calc_amount * 100) / 100;
      v_bonus_amt := FLOOR(v_bonus_amt * 100) / 100;
    ELSE
      v_calc_amount := ROUND(v_calc_amount, 2);
      v_bonus_amt := ROUND(v_bonus_amt, 2);
  END CASE;

  v_total_earned_val := v_calc_amount + v_bonus_amt;

  RETURN QUERY SELECT
    p_pool_name,
    v_total_assigned,
    v_total_completed,
    v_completion_pct,
    v_total_points,
    v_completed_points,
    v_base,
    v_bonus_applied,
    v_bonus_amt,
    v_calc_amount,
    v_total_earned_val,
    COALESCE(v_config.minimum_threshold, 0)::INTEGER,
    COALESCE(v_config.bonus_threshold, 90)::INTEGER,
    COALESCE(v_config.calculation_approach, 'dynamic'),
    COALESCE(v_config.rounding_behavior, 'nearest_cent'),
    v_raw_steps_completed,
    v_raw_steps_available,
    v_nonroutine_total,
    v_nonroutine_completed,
    v_extra_credit_completed,
    v_extra_credit_weight,
    v_numerator_boost;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB, TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB, TEXT) IS
  'Phase 3.5 + 100239: per-pool allowance progress. Routine sections with '
  'show_until_complete=true accept catch-up completions on any weekday in the '
  'period; sections with show_until_complete=false only count completions on '
  'the section''s scheduled weekday(s). Denominator unchanged. '
  'Numerator clamped at 100% per routine via LEAST(... , 1).';
