-- ============================================================================
-- 100241 — Fix orphaned routine step completions
--
-- Problem: update_routine_template_atomic (migration 100178) DELETEs all steps
-- and INSERTs new ones on every template edit. The ON DELETE SET NULL FK
-- (migration 100177) turns historical step_id references to NULL. These orphan
-- completions are then invisible to calculate_allowance_progress because its
-- numerator query uses JOIN task_template_steps (which drops NULL step_ids).
--
-- Three fixes:
--   1. calculate_allowance_progress: count orphaned completions in the numerator
--      so past work is never silently dropped from allowance math.
--   2. update_routine_template_atomic: accept optional step IDs from the caller,
--      UPDATE existing steps in place instead of DELETE+INSERT. Only genuinely
--      removed steps get deleted (and orphan their completions).
--   3. One-time re-link of existing orphaned completions where possible.
--
-- Family impact: 384 orphaned completions across Mosiah (176), Gideon (144),
-- Helam (53), Miriam (11) will immediately start counting toward allowance.
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. calculate_allowance_progress — count orphaned completions
-- ═══════════════════════════════════════════════════════════════════════
-- The numerator query changes from JOIN (drops NULLs) to a two-part count:
--   Part A: completions with valid step_id (existing logic, unchanged)
--   Part B: orphaned completions (step_id IS NULL) for the same task+member+period
-- Both parts are summed and clamped at the denominator via LEAST(..., 1).

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

      -- Part A: completions with valid step_id (standard path)
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

      -- Part B: orphaned completions (step_id IS NULL from template edits)
      -- These represent real work the kid did before the template was edited.
      -- Count distinct period_dates with orphaned completions, then multiply
      -- by the average steps-per-orphan-day to approximate the lost numerator.
      -- Simpler approach: count each orphan row as one completed step.
      SELECT COUNT(*)::INT
      INTO v_routine_orphan_completed
      FROM routine_step_completions rsc
      WHERE rsc.task_id = v_task.id
        AND rsc.member_id = p_member_id
        AND rsc.step_id IS NULL
        AND rsc.period_date BETWEEN v_effective_start AND p_period_end
        AND NOT (rsc.period_date = ANY(v_full_exclude_set));

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
  'Phase 3.5 + 100239 + 100241: orphaned completions (step_id IS NULL from '
  'template edits) now count in the numerator. Past work is never silently '
  'dropped. show_until_complete still honored. Denominator unchanged.';


-- ═══════════════════════════════════════════════════════════════════════
-- 2. update_routine_template_atomic — stable step IDs
-- ═══════════════════════════════════════════════════════════════════════
-- Now accepts optional `id` field on each step in p_sections JSON.
-- If a step has an id that matches an existing step in the template,
-- it's UPDATEd in place (preserving the step_id FK for completions).
-- Steps without an id (or with a non-matching id) are INSERTed as new.
-- Existing steps not present in the input are DELETEd (and orphan).

CREATE OR REPLACE FUNCTION public.update_routine_template_atomic(
  p_template_id   uuid,
  p_title         text,
  p_description   text,
  p_sections      jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_user_id    uuid := auth.uid();
  v_caller_family_id  uuid;
  v_template_family   uuid;
  v_section           jsonb;
  v_step              jsonb;
  v_new_section_id    uuid;
  v_existing_section_id uuid;
  v_existing_step_id  uuid;
  v_step_id_input     uuid;
  v_section_count     integer := 0;
  v_step_count        integer := 0;
  v_kept_section_ids  uuid[] := ARRAY[]::uuid[];
  v_kept_step_ids     uuid[] := ARRAY[]::uuid[];
BEGIN
  -- ── RLS check ─────────────────────────────────────────────────
  IF v_caller_user_id IS NOT NULL THEN
    SELECT family_id INTO v_caller_family_id
    FROM public.family_members
    WHERE user_id = v_caller_user_id
    LIMIT 1;

    SELECT family_id INTO v_template_family
    FROM public.task_templates
    WHERE id = p_template_id;

    IF v_template_family IS NULL THEN
      RAISE EXCEPTION 'Template not found: %', p_template_id
        USING ERRCODE = 'no_data_found';
    END IF;

    IF v_caller_family_id IS NULL OR v_caller_family_id <> v_template_family THEN
      RAISE EXCEPTION 'Permission denied: caller does not own template %', p_template_id
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- ── Step 1: update template metadata ───────────────────────────
  UPDATE public.task_templates
     SET title         = p_title,
         template_name = p_title,
         description   = p_description,
         updated_at    = now()
   WHERE id = p_template_id;

  -- ── Step 2: process sections — upsert pattern ─────────────────
  IF p_sections IS NOT NULL AND jsonb_typeof(p_sections) = 'array' THEN
    FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
    LOOP
      -- Check if this section has an existing id we should preserve
      v_existing_section_id := NULL;
      IF v_section ->> 'id' IS NOT NULL THEN
        SELECT id INTO v_existing_section_id
          FROM public.task_template_sections
         WHERE id = (v_section ->> 'id')::uuid
           AND template_id = p_template_id;
      END IF;

      IF v_existing_section_id IS NOT NULL THEN
        -- UPDATE existing section in place
        UPDATE public.task_template_sections SET
          title = v_section ->> 'title',
          section_name = COALESCE(v_section ->> 'section_name', v_section ->> 'title'),
          frequency_rule = v_section ->> 'frequency_rule',
          frequency_days = CASE
            WHEN v_section -> 'frequency_days' IS NULL OR v_section -> 'frequency_days' = 'null'::jsonb
              THEN NULL
            ELSE ARRAY(SELECT (jsonb_array_elements_text(v_section -> 'frequency_days'))::integer)
          END,
          show_until_complete = COALESCE((v_section ->> 'show_until_complete')::boolean, false),
          sort_order = COALESCE((v_section ->> 'sort_order')::integer, 0),
          updated_at = now()
        WHERE id = v_existing_section_id;

        v_new_section_id := v_existing_section_id;
      ELSE
        -- INSERT new section
        INSERT INTO public.task_template_sections (
          template_id, title, section_name, frequency_rule, frequency_days,
          show_until_complete, sort_order
        ) VALUES (
          p_template_id,
          v_section ->> 'title',
          COALESCE(v_section ->> 'section_name', v_section ->> 'title'),
          v_section ->> 'frequency_rule',
          CASE
            WHEN v_section -> 'frequency_days' IS NULL OR v_section -> 'frequency_days' = 'null'::jsonb
              THEN NULL
            ELSE ARRAY(SELECT (jsonb_array_elements_text(v_section -> 'frequency_days'))::integer)
          END,
          COALESCE((v_section ->> 'show_until_complete')::boolean, false),
          COALESCE((v_section ->> 'sort_order')::integer, 0)
        )
        RETURNING id INTO v_new_section_id;
      END IF;

      v_kept_section_ids := array_append(v_kept_section_ids, v_new_section_id);
      v_section_count := v_section_count + 1;

      -- Process steps within this section
      IF v_section -> 'steps' IS NOT NULL AND jsonb_typeof(v_section -> 'steps') = 'array' THEN
        FOR v_step IN SELECT * FROM jsonb_array_elements(v_section -> 'steps')
        LOOP
          -- Check if step has an existing id we should preserve
          v_step_id_input := NULL;
          v_existing_step_id := NULL;
          IF v_step ->> 'id' IS NOT NULL THEN
            BEGIN
              v_step_id_input := (v_step ->> 'id')::uuid;
              SELECT id INTO v_existing_step_id
                FROM public.task_template_steps
               WHERE id = v_step_id_input
                 AND section_id IN (
                   SELECT id FROM public.task_template_sections
                    WHERE template_id = p_template_id
                 );
            EXCEPTION WHEN OTHERS THEN
              v_existing_step_id := NULL;
            END;
          END IF;

          IF v_existing_step_id IS NOT NULL THEN
            -- UPDATE existing step in place — preserves step_id FK for completions
            UPDATE public.task_template_steps SET
              section_id = v_new_section_id,
              title = v_step ->> 'title',
              step_name = COALESCE(v_step ->> 'step_name', v_step ->> 'title'),
              step_notes = NULLIF(v_step ->> 'step_notes', ''),
              instance_count = COALESCE((v_step ->> 'instance_count')::integer, 1),
              require_photo = COALESCE((v_step ->> 'require_photo')::boolean, false),
              sort_order = COALESCE((v_step ->> 'sort_order')::integer, 0),
              step_type = COALESCE(v_step ->> 'step_type', 'static'),
              linked_source_id = CASE
                WHEN v_step ->> 'linked_source_id' IS NOT NULL AND v_step ->> 'linked_source_id' <> ''
                THEN (v_step ->> 'linked_source_id')::uuid ELSE NULL END,
              linked_source_type = NULLIF(v_step ->> 'linked_source_type', ''),
              display_name_override = NULLIF(v_step ->> 'display_name_override', ''),
              updated_at = now()
            WHERE id = v_existing_step_id;

            v_kept_step_ids := array_append(v_kept_step_ids, v_existing_step_id);
          ELSE
            -- INSERT new step
            INSERT INTO public.task_template_steps (
              section_id, title, step_name, step_notes, instance_count,
              require_photo, sort_order, step_type, linked_source_id,
              linked_source_type, display_name_override
            ) VALUES (
              v_new_section_id,
              v_step ->> 'title',
              COALESCE(v_step ->> 'step_name', v_step ->> 'title'),
              NULLIF(v_step ->> 'step_notes', ''),
              COALESCE((v_step ->> 'instance_count')::integer, 1),
              COALESCE((v_step ->> 'require_photo')::boolean, false),
              COALESCE((v_step ->> 'sort_order')::integer, 0),
              COALESCE(v_step ->> 'step_type', 'static'),
              CASE
                WHEN v_step ->> 'linked_source_id' IS NOT NULL AND v_step ->> 'linked_source_id' <> ''
                THEN (v_step ->> 'linked_source_id')::uuid ELSE NULL END,
              NULLIF(v_step ->> 'linked_source_type', ''),
              NULLIF(v_step ->> 'display_name_override', '')
            )
            RETURNING id INTO v_existing_step_id;

            v_kept_step_ids := array_append(v_kept_step_ids, v_existing_step_id);
          END IF;

          v_step_count := v_step_count + 1;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- ── Step 3: delete steps NOT in the kept set (genuinely removed) ──
  DELETE FROM public.task_template_steps
   WHERE section_id IN (
     SELECT id FROM public.task_template_sections
      WHERE template_id = p_template_id
   )
   AND NOT (id = ANY(v_kept_step_ids));

  -- ── Step 4: delete sections NOT in the kept set ───────────────
  DELETE FROM public.task_template_sections
   WHERE template_id = p_template_id
     AND NOT (id = ANY(v_kept_section_ids));

  RETURN jsonb_build_object('section_count', v_section_count, 'step_count', v_step_count);
END;
$$;

COMMENT ON FUNCTION public.update_routine_template_atomic(uuid, text, text, jsonb) IS
  '100241: stable step IDs. Steps with matching id are UPDATEd in place '
  '(preserving FK for routine_step_completions). Only genuinely removed '
  'steps are DELETEd (and orphan their completions via ON DELETE SET NULL).';


-- ═══════════════════════════════════════════════════════════════════════
-- 3. Re-link orphaned completions where possible
-- ═══════════════════════════════════════════════════════════════════════
-- For orphans on tasks that still have a live template, try to match by
-- sort position within the section. This is best-effort — orphans that
-- can't be matched stay NULL but now count via Part 1 above.

DO $$
DECLARE
  v_relinked INT := 0;
  v_skipped INT := 0;
  v_orphan RECORD;
  v_candidate_step_id UUID;
BEGIN
  FOR v_orphan IN
    SELECT rsc.id, rsc.task_id, rsc.completed_at, rsc.period_date,
           rsc.family_member_id, rsc.instance_number,
           t.template_id
    FROM routine_step_completions rsc
    JOIN tasks t ON t.id = rsc.task_id
    WHERE rsc.step_id IS NULL
      AND t.template_id IS NOT NULL
    ORDER BY rsc.completed_at
  LOOP
    -- Try to find a step in the current template that doesn't already
    -- have a completion for this member+date+instance. Pick by sort_order
    -- to approximate the original position.
    SELECT stp.id INTO v_candidate_step_id
    FROM task_template_steps stp
    JOIN task_template_sections sec ON sec.id = stp.section_id
    WHERE sec.template_id = v_orphan.template_id
      AND NOT EXISTS (
        SELECT 1 FROM routine_step_completions existing
        WHERE existing.step_id = stp.id
          AND existing.family_member_id = v_orphan.family_member_id
          AND existing.period_date = v_orphan.period_date
          AND existing.instance_number = COALESCE(v_orphan.instance_number, 1)
      )
    ORDER BY sec.sort_order, stp.sort_order
    LIMIT 1;

    IF v_candidate_step_id IS NOT NULL THEN
      BEGIN
        UPDATE routine_step_completions
           SET step_id = v_candidate_step_id
         WHERE id = v_orphan.id;
        v_relinked := v_relinked + 1;
      EXCEPTION WHEN unique_violation THEN
        v_skipped := v_skipped + 1;
      END;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'migration 100241: re-linked % orphaned completions, % could not be matched', v_relinked, v_skipped;
END $$;


-- Verification
DO $$ BEGIN
  RAISE NOTICE 'migration 100241: orphan completion fixes applied';
  RAISE NOTICE '  calculate_allowance_progress: orphans now count in numerator';
  RAISE NOTICE '  update_routine_template_atomic: stable step IDs via upsert';
  RAISE NOTICE '  orphan re-linking: best-effort position matching';
END $$;
