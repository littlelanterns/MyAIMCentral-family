-- Stage 3 Worker 3: Auto-apply scheduled pending changes via pg_cron.
--
-- Runs hourly at :15 (offset: :00 mindsweep, :05 carry-forward, :20 painted-schedules).
-- Applies pending_changes rows where trigger_mode IN ('schedule_activation', 'scheduled_date')
-- and trigger_at has passed. Pure SQL — no Edge Function needed.

CREATE OR REPLACE FUNCTION util.apply_scheduled_pending_changes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_change  RECORD;
  v_delta   JSONB;
  v_key     TEXT;
  v_val     TEXT;
  v_sets    TEXT[];
BEGIN
  FOR v_change IN
    SELECT *
    FROM public.pending_changes
    WHERE applied_at IS NULL
      AND cancelled_at IS NULL
      AND trigger_mode IN ('schedule_activation', 'scheduled_date')
      AND trigger_at IS NOT NULL
      AND trigger_at <= now()
    ORDER BY created_at ASC
  LOOP
    v_delta := v_change.change_payload;

    CASE v_change.source_type

      WHEN 'routine_template' THEN
        IF v_delta ? 'sections' THEN
          PERFORM public.update_routine_template_atomic(
            p_template_id := v_change.source_id,
            p_title       := COALESCE(v_delta->>'title', (SELECT title FROM public.task_templates WHERE id = v_change.source_id)),
            p_description := COALESCE(v_delta->>'description', (SELECT description FROM public.task_templates WHERE id = v_change.source_id)),
            p_sections    := v_delta->'sections'
          );
        ELSE
          UPDATE public.task_templates
          SET title       = COALESCE(v_delta->>'title', title),
              description = COALESCE(v_delta->>'description', description),
              updated_at  = now()
          WHERE id = v_change.source_id;
        END IF;

      WHEN 'routine_section' THEN
        UPDATE public.task_template_sections
        SET title          = COALESCE(v_delta->>'title', title),
            section_name   = COALESCE(v_delta->>'section_name', section_name),
            frequency_rule = COALESCE(v_delta->>'frequency_rule', frequency_rule),
            updated_at     = now()
        WHERE id = v_change.source_id;

      WHEN 'routine_step' THEN
        UPDATE public.task_template_steps
        SET title                  = COALESCE(v_delta->>'title', title),
            step_name              = COALESCE(v_delta->>'step_name', step_name),
            step_notes             = COALESCE(v_delta->>'step_notes', step_notes),
            display_name_override  = COALESCE(v_delta->>'display_name_override', display_name_override),
            updated_at             = now()
        WHERE id = v_change.source_id;

      WHEN 'list' THEN
        -- Build dynamic SET clause from payload keys
        v_sets := ARRAY[]::TEXT[];
        FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_delta)
        LOOP
          v_sets := v_sets || format('%I = %L', v_key, v_val);
        END LOOP;
        IF array_length(v_sets, 1) > 0 THEN
          EXECUTE format(
            'UPDATE public.lists SET %s, updated_at = now() WHERE id = %L',
            array_to_string(v_sets, ', '),
            v_change.source_id
          );
        END IF;

      WHEN 'list_item' THEN
        v_sets := ARRAY[]::TEXT[];
        FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_delta)
        LOOP
          v_sets := v_sets || format('%I = %L', v_key, v_val);
        END LOOP;
        IF array_length(v_sets, 1) > 0 THEN
          EXECUTE format(
            'UPDATE public.list_items SET %s, updated_at = now() WHERE id = %L',
            array_to_string(v_sets, ', '),
            v_change.source_id
          );
        END IF;

      WHEN 'sequential_collection' THEN
        v_sets := ARRAY[]::TEXT[];
        FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_delta)
        LOOP
          v_sets := v_sets || format('%I = %L', v_key, v_val);
        END LOOP;
        IF array_length(v_sets, 1) > 0 THEN
          EXECUTE format(
            'UPDATE public.sequential_collections SET %s, updated_at = now() WHERE id = %L',
            array_to_string(v_sets, ', '),
            v_change.source_id
          );
        END IF;

      WHEN 'sequential_item' THEN
        v_sets := ARRAY[]::TEXT[];
        FOR v_key, v_val IN SELECT * FROM jsonb_each_text(v_delta)
        LOOP
          v_sets := v_sets || format('%I = %L', v_key, v_val);
        END LOOP;
        IF array_length(v_sets, 1) > 0 THEN
          EXECUTE format(
            'UPDATE public.tasks SET %s, updated_at = now() WHERE id = %L',
            array_to_string(v_sets, ', '),
            v_change.source_id
          );
        END IF;

      ELSE
        RAISE WARNING 'Unknown source_type in pending_changes: %', v_change.source_type;
    END CASE;

    -- Mark as applied
    UPDATE public.pending_changes
    SET applied_at = now()
    WHERE id = v_change.id;

  END LOOP;
END;
$$;

-- Schedule hourly at :15
SELECT cron.schedule(
  'apply-scheduled-pending-changes',
  '15 * * * *',
  $$SELECT util.apply_scheduled_pending_changes();$$
);
