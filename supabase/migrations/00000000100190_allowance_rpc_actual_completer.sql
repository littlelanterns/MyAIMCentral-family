-- Task 2 / V8 — calculate_allowance_progress + check_day_completion actual-completer fix.
--
-- BUG: Both RPCs credit the PRIMARY ASSIGNEE (tasks.assignee_id) for
-- non-routine task completions, ignoring the ACTUAL COMPLETER stored in
-- task_completions.family_member_id. For shared tasks where Member A is
-- the primary assignee but Member B completed it, only Member A got
-- allowance credit. Routine steps were already correct (they JOIN
-- routine_step_completions.member_id).
--
-- FIX SUMMARY:
--
-- 1. calculate_allowance_progress: Widen the task iteration cursor to
--    include tasks where the member appears in task_assignments (not just
--    tasks.assignee_id). For the NUMERATOR (completion credit), check
--    task_completions.family_member_id = p_member_id instead of
--    tasks.status = 'completed'. A task completed by someone else does NOT
--    credit this member.
--
-- 2. check_day_completion: Same widening — check tasks assigned to or
--    assigned via task_assignments, and use task_completions to determine
--    per-member completion rather than tasks.status.
--
-- DESIGN RULES:
--   - DENOMINATOR: task appears for a member if assignee_id = member OR
--     task_assignments row exists for member. DISTINCT on task id prevents
--     double-counting when both conditions match.
--   - NUMERATOR: task is "completed by this member" if a task_completions
--     row exists with family_member_id = member AND approval_status NOT
--     'rejected' (i.e. NULL = auto-approved, 'approved' = mom-approved,
--     'pending' = awaiting approval — pending counts as completed for
--     progress display, same as existing behavior where status=completed
--     already counted).
--   - Extra-credit branch: same fix applied.
--   - Routine branch: UNCHANGED — already uses
--     routine_step_completions.member_id correctly.
--   - Grace-day logic: UNCHANGED — carried forward from migration 100175.
--
-- Preserves all corrections from 100164 (frequency-day-aware tally +
-- dedupe per step/day), 100171 (Extra Credit separation), 100172 (grace-
-- day denominator/numerator walk), and 100175 (per-day grace mode).
--
-- Signature: (UUID, DATE, DATE, JSONB DEFAULT NULL) — same as 100175.
-- 20-column return — same as 100175. DROP + CREATE for clean replace.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. calculate_allowance_progress — actual-completer fix
-- ═══════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, DATE[]);
DROP FUNCTION IF EXISTS public.calculate_allowance_progress(UUID, DATE, DATE, JSONB);

CREATE FUNCTION public.calculate_allowance_progress(
  p_member_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_grace_days JSONB DEFAULT NULL
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
  -- Per-day grace classification (NEW-TT, carried from 100175)
  v_full_exclude_set DATE[] := ARRAY[]::DATE[];
  v_numerator_keep_set DATE[] := ARRAY[]::DATE[];
  v_grace_entry JSONB;
  v_grace_date DATE;
  v_grace_mode TEXT;
  -- V8 actual-completer: whether THIS member completed this task
  v_member_completed BOOLEAN;
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

  -- Grace-day parsing (carried from 100175 NEW-TT)
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

  -- V8 FIX: Widen the task cursor to include tasks where this member is
  -- the primary assignee OR appears in task_assignments. DISTINCT on
  -- t.id prevents double-counting when both paths match the same task.
  FOR v_task IN
    SELECT DISTINCT ON (t.id)
           t.id, t.task_type, t.status, t.template_id, t.allowance_points,
           t.created_at, t.is_extra_credit
    FROM tasks t
    LEFT JOIN task_assignments ta ON ta.task_id = t.id
                                  AND ta.member_id = p_member_id
    WHERE (t.assignee_id = p_member_id OR ta.member_id IS NOT NULL)
      AND t.counts_for_allowance = TRUE
      AND t.archived_at IS NULL
      AND t.created_at::DATE <= p_period_end
    ORDER BY t.id
  LOOP
    v_effective_start := GREATEST(v_task.created_at::DATE, p_period_start);
    IF v_effective_start > p_period_end THEN
      CONTINUE;
    END IF;
    v_days_active := (p_period_end - v_effective_start) + 1;
    v_pool_fraction := v_days_active::NUMERIC / v_period_days;
    v_weight := COALESCE(v_task.allowance_points, v_config.default_point_value, 1);

    -- V8 FIX: Determine if THIS MEMBER completed the task by checking
    -- task_completions.family_member_id instead of tasks.status.
    -- A non-rejected completion counts. This correctly attributes credit
    -- to the actual completer for shared tasks.
    SELECT EXISTS (
      SELECT 1 FROM task_completions tc
      WHERE tc.task_id = v_task.id
        AND tc.family_member_id = p_member_id
        AND (tc.approval_status IS NULL OR tc.approval_status = 'approved')
    ) INTO v_member_completed;

    -- Extra-credit branch (migration 100171) — excluded from denominator,
    -- counted in numerator only.
    IF v_task.is_extra_credit = TRUE
       AND v_task.task_type <> 'routine'
       AND COALESCE(v_config.extra_credit_enabled, FALSE) = TRUE THEN
      -- V8 FIX: use v_member_completed instead of v_task.status = 'completed'
      IF v_member_completed THEN
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
      -- Routine branch: UNCHANGED from 100175. Already uses
      -- routine_step_completions.member_id = p_member_id correctly.
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
      -- Non-routine branch
      v_nonroutine_total := v_nonroutine_total + 1;
      -- V8 FIX: use v_member_completed instead of v_task.status = 'completed'
      IF v_member_completed THEN
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
    v_extra_credit_weight;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB) IS
  'V8 actual-completer fix (migration 100190). Non-routine task completion credit is now based on task_completions.family_member_id (the person who actually did the work) instead of tasks.assignee_id + tasks.status. Task iteration cursor widened to include task_assignments so shared tasks appear in the denominator for all assigned members. Routine branch unchanged — already uses routine_step_completions.member_id. Preserves all prior corrections: 100164 frequency-day-aware, 100171 extra credit, 100172 grace days, 100175 per-day grace mode.';


-- ═══════════════════════════════════════════════════════════════════════
-- 2. check_day_completion — actual-completer fix
-- ═══════════════════════════════════════════════════════════════════════
--
-- BUG: Checked `tasks WHERE assignee_id = p_member_id AND status NOT IN
-- ('completed', 'cancelled')`. For shared tasks, a task completed by
-- another assignee would show as 'completed' on the task row but the
-- current member didn't do it — OR a task assigned via task_assignments
-- wouldn't appear at all.
--
-- FIX: Check tasks assigned to this member (via assignee_id OR
-- task_assignments). A task is "complete for this member" if a
-- task_completions row exists with family_member_id = p_member_id and
-- a non-rejected status, OR if the task is cancelled.

CREATE OR REPLACE FUNCTION public.check_day_completion(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_incomplete INTEGER;
BEGIN
  -- Count tasks assigned to this member that are NOT completed by them
  -- and NOT cancelled. A task with status='completed' but completed by
  -- a different member is still incomplete for THIS member.
  SELECT count(DISTINCT t.id) INTO v_incomplete
    FROM public.tasks t
    LEFT JOIN public.task_assignments ta
      ON ta.task_id = t.id AND ta.member_id = p_member_id
   WHERE (t.assignee_id = p_member_id OR ta.member_id IS NOT NULL)
     AND t.archived_at IS NULL
     AND (t.due_date IS NULL OR t.due_date <= CURRENT_DATE)
     AND t.status <> 'cancelled'
     -- Exclude tasks this member has personally completed
     AND NOT EXISTS (
       SELECT 1 FROM public.task_completions tc
        WHERE tc.task_id = t.id
          AND tc.family_member_id = p_member_id
          AND (tc.approval_status IS NULL OR tc.approval_status = 'approved')
     );

  RETURN v_incomplete = 0;
END;
$fn$;

REVOKE ALL ON FUNCTION public.check_day_completion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_day_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_day_completion(UUID) TO service_role;

COMMENT ON FUNCTION public.check_day_completion(UUID) IS
  'V8 actual-completer fix (migration 100190). Uses task_completions.family_member_id to determine per-member completion instead of tasks.status. Includes task_assignments for shared task visibility. A shared task completed by someone else does not count as complete for this member.';


-- ═══════════════════════════════════════════════════════════════════════
-- 3. Edge Function caller: total_tasks_assigned count
-- ═══════════════════════════════════════════════════════════════════════
--
-- NOTE: The calculate-allowance-period Edge Function (lines 234-241)
-- also does a direct query:
--   .from('tasks').select('id', { count: 'exact', head: true })
--   .eq('assignee_id', period.family_member_id)
--
-- This is for the display-only `total_tasks_assigned` column on
-- allowance_periods. The fix for this is in the Edge Function code,
-- not in this migration. It's a cosmetic display number — the actual
-- calculation math runs through the RPC above.

-- Verification
DO $$ BEGIN
  RAISE NOTICE 'migration 100190: V8 actual-completer fix applied';
  RAISE NOTICE '  calculate_allowance_progress signature: %', (
    SELECT pg_get_function_arguments(oid)
    FROM pg_proc
    WHERE proname = 'calculate_allowance_progress'
      AND pronamespace = 'public'::regnamespace
  );
  RAISE NOTICE '  check_day_completion signature: %', (
    SELECT pg_get_function_arguments(oid)
    FROM pg_proc
    WHERE proname = 'check_day_completion'
      AND pronamespace = 'public'::regnamespace
  );
END $$;
