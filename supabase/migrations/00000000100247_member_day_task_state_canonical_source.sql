-- ============================================================================
-- 100247 — Member-Day Task State: Canonical Source (Single Source of Truth)
--          Convention #271
--
-- Establishes ONE canonical query for "what counts for a member on a given
-- date." Three painted-blind read paths (useRoutineWeekView,
-- calculate_allowance_progress, calculate-allowance-period Edge Function) were
-- counting past-end-date painted routines in allowance denominators because
-- they re-derived the schedule rules inline by day-of-week and never honored
-- the painted `rdates` array. Kids couldn't see the routines on their
-- dashboards to mark them off — only the math was silently affected.
--
-- This migration introduces:
--   • obligation_active_for_member_on_date(task, member, date) → BOOLEAN
--       Layer 1, internal. The atomic "is this task active for this member
--       on this date" predicate. Mirrors src/lib/tasks/recurringTaskFilter.ts
--       (the frozen TS reference) EXACTLY, plus assignee/archived/created
--       gating. The SQL here MUST stay line-for-line equivalent to the
--       `sqlLayer1Mirror` function in tests/routine-day-state-invariant.test.ts
--       — if you change one, change the other, and the invariant test must
--       still pass.
--   • get_member_day_obligations(member, period_start, period_end) → TABLE
--       Layer 2, public. The single function every measurement/reward surface
--       calls. This build populates source_type='routine_step' rows only;
--       future builds extend it to other source_types (Convention #271).
--       The locked return shape carries pool_id, task_segment_id,
--       is_extra_credit, homework_subject_ids so no follow-up amendment is
--       needed when those reward surfaces are refactored in.
--   • A rewrite of calculate_allowance_progress so its routine denominator +
--       completion counting gate each day through Layer 1 (honoring painted
--       rdates) while preserving ALL prior fairness logic: archived-during-
--       period proportional counting (100243), step.created_at fairness
--       (100244), show_until_complete (100239), orphan counting (100241),
--       multi-pool (100235), numerator boost, grace days.
--   • Backfill: set recurrence_details.until = last(rdates) on the 3 painted
--       production routines that lack it (idempotent, conditional).
--   • Archive the orphan assignee_id=NULL Kitchen Zone task.
-- ============================================================================


-- ============================================================================
-- Layer 1 — obligation_active_for_member_on_date (internal predicate)
--
-- MIRRORS tests/routine-day-state-invariant.test.ts `sqlLayer1Mirror`
-- and src/lib/tasks/recurringTaskFilter.ts. Do not diverge without updating
-- both and re-running the invariant test.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obligation_active_for_member_on_date(
  p_task_id   UUID,
  p_member_id UUID,
  p_date      DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_task            RECORD;
  v_details         JSONB;
  v_sched_type      TEXT;
  v_rrule           TEXT;
  v_until_str       TEXT;
  v_dtstart_str     TEXT;
  v_assignee_match  BOOLEAN;
  -- RRULE parse helpers
  v_freq            TEXT;
  v_byday           TEXT;
  v_bymonthday      TEXT;
  v_dow_token       TEXT;
  v_date_dow        INT;
  v_date_dom        INT;
BEGIN
  SELECT t.id, t.task_type, t.recurrence_rule, t.recurrence_details,
         t.due_date, t.created_at, t.archived_at, t.assignee_id
    INTO v_task
    FROM tasks t
   WHERE t.id = p_task_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- ── Gating predicate 1: archived_at IS NULL OR archived_at::date >= date ──
  IF v_task.archived_at IS NOT NULL AND v_task.archived_at::DATE < p_date THEN
    RETURN FALSE;
  END IF;

  -- ── Gating predicate 2: created_at::date <= date + 1 day ──
  IF v_task.created_at IS NOT NULL AND v_task.created_at::DATE > (p_date + INTERVAL '1 day')::DATE THEN
    RETURN FALSE;
  END IF;

  -- ── Gating predicate 3: assignee match (direct or via task_assignments) ──
  v_assignee_match := (v_task.assignee_id = p_member_id)
    OR EXISTS (
      SELECT 1 FROM task_assignments ta
       WHERE ta.task_id = p_task_id
         AND ta.family_member_id = p_member_id
    );
  IF NOT v_assignee_match THEN
    RETURN FALSE;
  END IF;

  v_details := v_task.recurrence_details;

  -- ── Routine end-date: until in details, legacy fallback due_date ──
  -- (recurringTaskFilter applies this only for task_type='routine')
  IF v_task.task_type = 'routine' THEN
    v_until_str := COALESCE(v_details->>'until', v_task.due_date::TEXT);
    IF v_until_str IS NOT NULL AND v_until_str <> '' THEN
      -- hide if until < date (endDate = until 23:59:59 < startOfDate 00:00:00)
      IF v_until_str::DATE < p_date THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;

  -- ── Advance-start gating: future dtstart hides the task ──
  v_dtstart_str := v_details->>'dtstart';
  IF v_dtstart_str IS NOT NULL AND v_dtstart_str <> '' THEN
    -- dtstart may be 'YYYY-MM-DD' or full ISO; take the date portion.
    IF LEFT(v_dtstart_str, 10)::DATE > p_date THEN
      RETURN FALSE;
    END IF;
  END IF;

  v_sched_type := v_details->>'schedule_type';

  -- ── Painted: only visible on explicitly painted rdates (minus exdates) ──
  IF v_sched_type = 'painted' THEN
    -- exdate beats rdate
    IF v_details ? 'exdates'
       AND (v_details->'exdates') @> to_jsonb(p_date::TEXT) THEN
      RETURN FALSE;
    END IF;
    RETURN COALESCE(
      (v_details ? 'rdates') AND ((v_details->'rdates') @> to_jsonb(p_date::TEXT)),
      FALSE
    );
  END IF;

  -- ── No recurrence_rule at all → always visible (after advance-start) ──
  IF v_task.recurrence_rule IS NULL THEN
    RETURN TRUE;
  END IF;

  IF v_details IS NULL THEN
    RETURN TRUE;
  END IF;

  v_rrule := v_details->>'rrule';
  IF v_rrule IS NULL OR v_rrule = '' THEN
    RETURN TRUE;
  END IF;

  -- ── completion_dependent → visible when pending (no calendar) ──
  IF v_task.recurrence_rule = 'completion_dependent' THEN
    RETURN TRUE;
  END IF;

  -- ── RRULE day-membership ──
  -- Production routines do NOT use RRULE strings (they use per-section
  -- frequency_days, recurrence_rule=null, handled above). This branch exists
  -- for parity with the TS reference's rrule.js evaluation across the common
  -- forms: FREQ=DAILY, FREQ=WEEKLY;BYDAY=..., FREQ=MONTHLY;BYMONTHDAY=...
  --
  -- Apply the RRULE's own dtstart/until window first.
  IF v_dtstart_str IS NOT NULL AND v_dtstart_str <> ''
     AND LEFT(v_dtstart_str, 10)::DATE > p_date THEN
    RETURN FALSE;
  END IF;
  -- For non-routine, until is read from rrule details too (end_date fallback)
  v_until_str := COALESCE(v_details->>'until', v_details->>'end_date');
  IF v_until_str IS NOT NULL AND v_until_str <> '' AND v_until_str::DATE < p_date THEN
    RETURN FALSE;
  END IF;

  -- Extract FREQ / BYDAY / BYMONTHDAY tokens from the RRULE string.
  v_freq := (regexp_match(v_rrule, 'FREQ=([A-Z]+)'))[1];
  v_byday := (regexp_match(v_rrule, 'BYDAY=([0-9A-Z,\-]+)'))[1];
  v_bymonthday := (regexp_match(v_rrule, 'BYMONTHDAY=([0-9,\-]+)'))[1];

  v_date_dow := EXTRACT(DOW FROM p_date)::INT;      -- 0=Sun..6=Sat
  v_date_dom := EXTRACT(DAY FROM p_date)::INT;

  IF v_freq = 'DAILY' THEN
    RETURN TRUE;

  ELSIF v_freq = 'WEEKLY' THEN
    IF v_byday IS NULL THEN
      -- weekly with no byday → treat as matching every week (visible daily
      -- window check already passed); rrule.js with no byday uses dtstart DOW,
      -- but production never hits this; default to visible to avoid hiding data.
      RETURN TRUE;
    END IF;
    -- map this date's DOW (0=Sun) to the RRULE token
    v_dow_token := (ARRAY['SU','MO','TU','WE','TH','FR','SA'])[v_date_dow + 1];
    RETURN position(v_dow_token IN v_byday) > 0;

  ELSIF v_freq = 'MONTHLY' THEN
    IF v_bymonthday IS NULL THEN
      RETURN TRUE; -- monthly w/o bymonthday → conservative visible
    END IF;
    RETURN (',' || v_bymonthday || ',') LIKE ('%,' || v_date_dom::TEXT || ',%');

  ELSIF v_freq = 'YEARLY' THEN
    -- Not used by routines; conservative visible (don't hide data on parse gap)
    RETURN TRUE;
  END IF;

  -- Unknown FREQ — mirror the TS reference's catch-all (don't hide data)
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obligation_active_for_member_on_date(UUID, UUID, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.obligation_active_for_member_on_date IS
  'Convention #271 Layer 1 (internal). Atomic "is this task active for this '
  'member on this date" predicate. Mirrors src/lib/tasks/recurringTaskFilter.ts '
  'and tests/routine-day-state-invariant.test.ts sqlLayer1Mirror EXACTLY. '
  'Honors painted rdates/exdates, dtstart, until, archived, created, assignee. '
  'Used only by get_member_day_obligations (Layer 2).';


-- ============================================================================
-- Layer 2 — get_member_day_obligations (public canonical query)
--
-- Returns one row per (date, routine step) that counts for the member in the
-- period. source_type='routine_step' only this build; grouping fields carried
-- for future reward surfaces (Checkpoint-1 lock).
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_member_day_obligations(UUID, DATE, DATE);

CREATE FUNCTION public.get_member_day_obligations(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS TABLE (
  date                   DATE,
  source_type            TEXT,
  task_id                UUID,
  template_id            UUID,
  section_id             UUID,
  step_id                UUID,
  pool_id                UUID,
  task_segment_id        UUID,
  counts_for_allowance   BOOLEAN,
  counts_for_gamification BOOLEAN,
  counts_for_homework    BOOLEAN,
  is_extra_credit        BOOLEAN,
  allowance_points       INTEGER,
  homework_subject_ids   UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_member_family UUID;
  v_authorized BOOLEAN := FALSE;
BEGIN
  -- Authorization: service_role, or a member of the subject's family.
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

  RETURN QUERY
  WITH period_days AS (
    SELECT gs::DATE AS d
    FROM generate_series(p_period_start, p_period_end, INTERVAL '1 day') gs
  ),
  -- Candidate routine tasks: assigned directly OR via task_assignments.
  candidate_tasks AS (
    SELECT DISTINCT t.id, t.template_id, t.pool_id, t.task_segment_id,
           t.counts_for_allowance, t.counts_for_gamification,
           t.counts_for_homework, t.is_extra_credit,
           t.allowance_points, t.homework_subject_ids
    FROM tasks t
    WHERE t.task_type = 'routine'
      AND t.template_id IS NOT NULL
      AND (
        t.assignee_id = p_member_id
        OR EXISTS (
          SELECT 1 FROM task_assignments ta
           WHERE ta.task_id = t.id AND ta.family_member_id = p_member_id
        )
      )
      -- coarse pre-filter; Layer 1 does the authoritative per-day check
      AND t.created_at::DATE <= p_period_end
      AND (t.archived_at IS NULL OR t.archived_at::DATE >= p_period_start)
  )
  SELECT
    pd.d AS date,
    'routine_step'::TEXT AS source_type,
    ct.id AS task_id,
    ct.template_id,
    tts.id AS section_id,
    stp.id AS step_id,
    ct.pool_id,
    ct.task_segment_id,
    ct.counts_for_allowance,
    ct.counts_for_gamification,
    ct.counts_for_homework,
    ct.is_extra_credit,
    ct.allowance_points,
    ct.homework_subject_ids
  FROM period_days pd
  JOIN candidate_tasks ct ON TRUE
  -- authoritative per-day task activity (painted rdates, until, dtstart, etc.)
  JOIN LATERAL (
    SELECT public.obligation_active_for_member_on_date(ct.id, p_member_id, pd.d) AS active
  ) act ON act.active
  -- sections scheduled on this day-of-week
  JOIN task_template_sections tts
    ON tts.template_id = ct.template_id
   AND (EXTRACT(DOW FROM pd.d)::INT::TEXT) = ANY(tts.frequency_days)
  -- steps that existed on this day (created_at fairness, 100244)
  JOIN task_template_steps stp
    ON stp.section_id = tts.id
   AND stp.created_at::DATE <= pd.d
  ORDER BY pd.d, tts.sort_order, stp.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_day_obligations(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.get_member_day_obligations IS
  'Convention #271 Layer 2 (public canonical query). One row per (date, '
  'routine step) that counts for the member in the period. This build '
  'populates source_type=''routine_step'' only; future builds extend to '
  'other source types without renaming. Return shape carries pool_id, '
  'task_segment_id, is_extra_credit, homework_subject_ids for future reward '
  'surfaces. Gates each day through obligation_active_for_member_on_date so '
  'painted rdates / until / dtstart are honored. Honors task_template_sections.'
  'frequency_days (per-DOW) and task_template_steps.created_at (step fairness).';


-- ============================================================================
-- Rewrite calculate_allowance_progress: gate the routine day-loop + completion
-- counting through Layer 1 (painted-aware) while preserving ALL prior fairness
-- logic (100243 archived-end-cap, 100244 step.created_at, 100239 s_u_c, 100241
-- orphan, 100235 multi-pool, numerator boost, grace days).
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
  v_routine_orphan_completed INT;
  v_routine_fraction NUMERIC;
  v_completion_pct NUMERIC;
  v_base NUMERIC;
  v_calc_amount NUMERIC;
  v_bonus_applied BOOLEAN;
  v_bonus_amt NUMERIC;
  v_total_earned_val NUMERIC;
  v_effective_start DATE;
  v_effective_end DATE;
  v_day DATE;
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

  -- Include tasks archived DURING the period (100243 fix)
  FOR v_task IN
    SELECT t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at,
           t.is_extra_credit, t.archived_at
    FROM tasks t
    WHERE t.assignee_id = p_member_id
      AND t.counts_for_allowance = TRUE
      AND (t.archived_at IS NULL OR t.archived_at::DATE > p_period_start)
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

    IF v_task.archived_at IS NOT NULL THEN
      v_effective_end := LEAST(p_period_end, (v_task.archived_at::DATE - 1));
      IF v_effective_end < v_effective_start THEN
        CONTINUE;
      END IF;
    ELSE
      v_effective_end := p_period_end;
    END IF;

    v_days_active := (v_effective_end - v_effective_start) + 1;
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
      WHILE v_day <= v_effective_end LOOP
        IF v_day = ANY(v_full_exclude_set) OR v_day = ANY(v_numerator_keep_set) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

        -- ── Convention #271: gate the day through Layer 1 so painted rdates,
        -- until, dtstart are honored. Before this, the day-loop counted by
        -- frequency_days/DOW alone, which is why past-end-date painted
        -- routines silently inflated the denominator. ──
        IF NOT public.obligation_active_for_member_on_date(v_task.id, p_member_id, v_day) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

        -- Steps scheduled this day-of-week that existed on this day (100244).
        SELECT COALESCE(SUM(
          (SELECT COUNT(*)::INT FROM task_template_steps stp
           WHERE stp.section_id = tts.id
             AND stp.created_at::DATE <= v_day)
        ), 0)
        INTO v_day_step_count
        FROM task_template_sections tts
        WHERE tts.template_id = v_task.template_id
          AND (EXTRACT(DOW FROM v_day)::INT::TEXT) = ANY(tts.frequency_days);

        v_routine_total_possible := v_routine_total_possible + COALESCE(v_day_step_count, 0);
        v_day := v_day + 1;
      END LOOP;

      -- Part A: completions with valid step_id, gated by Layer 1 activity per
      -- completion's period_date (painted-aware).
      SELECT COUNT(*)::INT
      INTO v_routine_actual_completed
      FROM (
        SELECT DISTINCT rsc.step_id, rsc.period_date
        FROM routine_step_completions rsc
        JOIN task_template_steps stp ON stp.id = rsc.step_id
        JOIN task_template_sections tts ON tts.id = stp.section_id
        WHERE rsc.task_id = v_task.id
          AND rsc.member_id = p_member_id
          AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
          AND (
            tts.show_until_complete = TRUE
            OR (EXTRACT(DOW FROM rsc.period_date)::INT::TEXT) = ANY(tts.frequency_days)
          )
          AND NOT (rsc.period_date = ANY(v_full_exclude_set))
          AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date)
      ) dedup;

      -- Part B: orphaned completions (step_id IS NULL from template edits).
      SELECT COUNT(*)::INT
      INTO v_routine_orphan_completed
      FROM routine_step_completions rsc
      WHERE rsc.task_id = v_task.id
        AND rsc.member_id = p_member_id
        AND rsc.step_id IS NULL
        AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
        AND NOT (rsc.period_date = ANY(v_full_exclude_set))
        AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date);

      v_routine_actual_completed := v_routine_actual_completed + v_routine_orphan_completed;

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
  '100247 (Convention #271): routine denominator + completion counting now '
  'gate each day through obligation_active_for_member_on_date so painted '
  'rdates / until / dtstart are honored (fixes past-end-date painted routines '
  'silently inflating the denominator). Preserves: archived task proportional '
  'counting (100243), step.created_at fairness (100244), show_until_complete '
  '(100239), orphan counting (100241), multi-pool (100235), numerator boost, '
  'grace days.';


-- ============================================================================
-- Backfill: set recurrence_details.until = last(rdates) on painted routines
-- that lack it. Idempotent (conditional WHERE until IS NULL). Defense-in-depth
-- for any fast-path until check. Affects the 3 production painted rows.
-- ============================================================================

UPDATE public.tasks t
SET recurrence_details = jsonb_set(
  t.recurrence_details,
  '{until}',
  to_jsonb(
    (t.recurrence_details->'rdates') ->> (
      jsonb_array_length(t.recurrence_details->'rdates') - 1
    )
  )
)
WHERE t.task_type = 'routine'
  AND t.recurrence_details->>'schedule_type' = 'painted'
  AND (t.recurrence_details->>'until') IS NULL
  AND t.recurrence_details ? 'rdates'
  AND jsonb_array_length(t.recurrence_details->'rdates') > 0;


-- ============================================================================
-- Cleanup: archive the orphan assignee_id=NULL Kitchen Zone task. Idempotent
-- (conditional on existence + not already archived).
-- ============================================================================

UPDATE public.tasks
SET archived_at = NOW()
WHERE id = 'c06c706c-83bb-4279-98df-35344de7f04c'
  AND assignee_id IS NULL
  AND archived_at IS NULL;


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_painted_no_until INT;
  v_orphan_archived INT;
BEGIN
  SELECT count(*) INTO v_painted_no_until
  FROM tasks
  WHERE task_type = 'routine'
    AND recurrence_details->>'schedule_type' = 'painted'
    AND (recurrence_details->>'until') IS NULL
    AND recurrence_details ? 'rdates'
    AND jsonb_array_length(recurrence_details->'rdates') > 0;

  SELECT count(*) INTO v_orphan_archived
  FROM tasks
  WHERE id = 'c06c706c-83bb-4279-98df-35344de7f04c'
    AND archived_at IS NOT NULL;

  RAISE NOTICE 'migration 100247: member-day canonical source applied';
  RAISE NOTICE '  obligation_active_for_member_on_date: %', (
    SELECT pg_get_function_arguments(oid) FROM pg_proc
    WHERE proname = 'obligation_active_for_member_on_date'
      AND pronamespace = 'public'::regnamespace LIMIT 1);
  RAISE NOTICE '  get_member_day_obligations: %', (
    SELECT pg_get_function_arguments(oid) FROM pg_proc
    WHERE proname = 'get_member_day_obligations'
      AND pronamespace = 'public'::regnamespace LIMIT 1);
  RAISE NOTICE '  painted routines still missing until (should be 0): %', v_painted_no_until;
  RAISE NOTICE '  orphan Kitchen Zone archived (should be 1): %', v_orphan_archived;
END $$;
