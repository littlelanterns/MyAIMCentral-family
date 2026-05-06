-- ============================================================================
-- Phase 3.5 Worker B2 — Multi-Pool RPC Rewrite + Fold-ins
--
-- 1. Resolve fixed vs dynamic (Row 168 / SCOPE-3.F31) — collapse into one
-- 2. Rewrite calculate_allowance_progress for per-pool operation
-- 3. Create get_pool_progress thin wrapper
-- 4. Create calculate_weighted_combination
-- 5. Update execute_numerator_godmother to record pool_name (option a)
-- 6. Migrate any existing 'fixed' configs to 'dynamic'
-- ============================================================================


-- ============================================================================
-- 1. Collapse 'fixed' into 'dynamic' (Row 168)
--    fixed and dynamic produce identical math (Ground Truth §0.3).
--    'hourly' and 'financial_approval' are dead enum values per audit
--    SCOPE-3.F31 — noted here, actual CHECK cleanup deferred to avoid
--    touching the enum constraint in a multi-concern migration.
-- ============================================================================

UPDATE public.allowance_configs
  SET calculation_approach = 'dynamic'
WHERE calculation_approach = 'fixed';


-- ============================================================================
-- 2. Rewrite calculate_allowance_progress for per-pool
-- ============================================================================

DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, DATE[]);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, JSONB);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, JSONB, TEXT);

CREATE FUNCTION public.calculate_allowance_progress(
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
  -- Per-day grace classification (NEW-TT)
  v_full_exclude_set DATE[] := ARRAY[]::DATE[];
  v_numerator_keep_set DATE[] := ARRAY[]::DATE[];
  v_grace_entry JSONB;
  v_grace_date DATE;
  v_grace_mode TEXT;
  -- Numerator boost from contract_grant_log
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

  -- Load the pool-specific config
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

  -- Parse grace days (NEW-TT: per-day mode)
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

  -- Walk tasks assigned to this member that belong to this pool.
  -- pool_id = config.id → explicit pool assignment.
  -- pool_id IS NULL + pool_name = 'default' → backward-compatible default pool.
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

    -- Extra-credit branch: excluded from denominator, counted in numerator only.
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

  -- Numerator boost from numerator_godmother grant log entries for this pool.
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

  -- Compute completion percentage
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
  'Phase 3.5: per-pool allowance progress. p_pool_name filters tasks by pool affiliation. '
  'Default pool includes tasks with pool_id IS NULL for backward compatibility. '
  'Reads numerator boosts from contract_grant_log. Uses overage_cap from pool config.';


-- ============================================================================
-- 3. get_pool_progress — thin wrapper returning just the percentage
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pool_progress(
  p_member_id    UUID,
  p_pool_name    TEXT,
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_pct NUMERIC;
BEGIN
  SELECT cap.completion_percentage INTO v_pct
  FROM public.calculate_allowance_progress(
    p_member_id, p_period_start, p_period_end, NULL, p_pool_name
  ) cap;

  RETURN COALESCE(v_pct, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pool_progress(UUID, TEXT, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.get_pool_progress IS
  'Phase 3.5: lightweight per-pool completion percentage for cross-pool conditions '
  'and widget display. Thin wrapper around calculate_allowance_progress.';


-- ============================================================================
-- 4. calculate_weighted_combination — weighted average across active pools
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_weighted_combination(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS TABLE (
  combined_percentage NUMERIC,
  pool_count          INTEGER,
  pool_details        JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pool        RECORD;
  v_pct         NUMERIC;
  v_weight_sum  NUMERIC := 0;
  v_weighted_sum NUMERIC := 0;
  v_count       INTEGER := 0;
  v_details     JSONB := '[]'::jsonb;
BEGIN
  FOR v_pool IN
    SELECT ac.pool_name, ac.pool_weight, ac.payout_mode
    FROM allowance_configs ac
    WHERE ac.family_member_id = p_member_id
      AND ac.pool_status = 'active'
      AND ac.enabled = true
    ORDER BY ac.pool_name
  LOOP
    v_count := v_count + 1;

    SELECT cap.completion_percentage INTO v_pct
    FROM public.calculate_allowance_progress(
      p_member_id, p_period_start, p_period_end, NULL, v_pool.pool_name
    ) cap;

    v_pct := COALESCE(v_pct, 0);

    v_details := v_details || jsonb_build_object(
      'pool_name', v_pool.pool_name,
      'percentage', v_pct,
      'weight', COALESCE(v_pool.pool_weight, 1.0),
      'payout_mode', v_pool.payout_mode
    );

    -- Measurement-only pools are tracked but excluded from weighted payout
    IF v_pool.payout_mode != 'measurement_only' THEN
      v_weight_sum := v_weight_sum + COALESCE(v_pool.pool_weight, 1.0);
      v_weighted_sum := v_weighted_sum + (v_pct * COALESCE(v_pool.pool_weight, 1.0));
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    CASE WHEN v_weight_sum > 0
      THEN ROUND(v_weighted_sum / v_weight_sum, 2)
      ELSE 0::NUMERIC
    END,
    v_count,
    v_details;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_weighted_combination(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_weighted_combination IS
  'Phase 3.5: computes weighted average of all active pool percentages for a member. '
  'Measurement-only pools are calculated and returned in pool_details but excluded '
  'from the weighted combination payout math.';


-- ============================================================================
-- 5. Update execute_numerator_godmother to record pool_name (option a)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_numerator_godmother(
  p_contract_id  UUID,
  p_deed_firing  JSONB,
  p_payload      JSONB,
  p_stroke_of    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_source_type  TEXT;
  v_boost_weight DECIMAL;
  v_config_id    UUID;
  v_pool_name    TEXT := 'default';
BEGIN
  v_source_type := p_deed_firing ->> 'source_type';

  IF v_source_type NOT IN (
    'task_completion', 'routine_step_completion',
    'list_item_completion', 'opportunity_claimed'
  ) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', format('numerator_godmother: unsupported source_type %s', v_source_type)
    );
  END IF;

  v_boost_weight := COALESCE((p_payload ->> 'payload_amount')::decimal, 1.0);

  -- Resolve pool_name from the contract's godmother config
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT agc.pool_name INTO v_pool_name
      FROM public.allowance_godmother_configs agc
     WHERE agc.id = v_config_id;
    v_pool_name := COALESCE(v_pool_name, 'default');
  END IF;

  RETURN jsonb_build_object(
    'status', 'granted',
    'metadata', jsonb_build_object(
      'boost_weight', v_boost_weight,
      'deferred_to', 'period_close',
      'source_type', v_source_type,
      'source_id', p_deed_firing ->> 'source_id',
      'family_member_id', p_deed_firing ->> 'family_member_id',
      'pool_name', v_pool_name
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_numerator_godmother IS
  'Phase 3.5: records above-and-beyond credit for allowance numerator boost '
  'with pool_name resolved from the contract''s godmother_config_id → '
  'allowance_godmother_configs.pool_name. Self-contained metadata for '
  'period-close reader.';


-- ============================================================================
-- Verification
-- ============================================================================

DO $$ BEGIN
  RAISE NOTICE 'migration 100235: multi-pool RPC rewrite complete';
  RAISE NOTICE '  calculate_allowance_progress: %', (
    SELECT pg_get_function_arguments(oid)
    FROM pg_proc
    WHERE proname = 'calculate_allowance_progress'
      AND pronamespace = 'public'::regnamespace
    LIMIT 1
  );
  RAISE NOTICE '  get_pool_progress: %', (
    SELECT pg_get_function_arguments(oid)
    FROM pg_proc
    WHERE proname = 'get_pool_progress'
      AND pronamespace = 'public'::regnamespace
  );
  RAISE NOTICE '  calculate_weighted_combination: %', (
    SELECT pg_get_function_arguments(oid)
    FROM pg_proc
    WHERE proname = 'calculate_weighted_combination'
      AND pronamespace = 'public'::regnamespace
  );
  RAISE NOTICE '  fixed configs migrated: %', (
    SELECT count(*) FROM allowance_configs WHERE calculation_approach = 'fixed'
  );
END $$;
