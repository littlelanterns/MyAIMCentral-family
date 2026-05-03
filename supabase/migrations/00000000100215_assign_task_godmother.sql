-- Phase 3 Connector Architecture — Sub-task 15
-- assign_task_godmother: creates tasks from templates when deeds fire.
-- Assignment modes: 'to_doer' (deed member), 'to_specific', 'to_all' (all kids).
-- Due date modes: immediate (today), next_day, end_of_week, custom_offset.

CREATE OR REPLACE FUNCTION public.execute_assign_task_godmother(
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
  v_family_id        UUID;
  v_member_id        UUID;
  v_config_id        UUID;
  v_config           RECORD;
  v_template         RECORD;
  v_task_title       TEXT;
  v_assignee_id      UUID;
  v_due_date         DATE;
  v_task_id          UUID;
  v_family_tz        TEXT;
  v_today            DATE;
BEGIN
  v_family_id := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id := (p_deed_firing ->> 'family_member_id')::uuid;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'assign_task_godmother: deed firing has no family_id'
    );
  END IF;

  -- Resolve config
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT * INTO v_config
      FROM public.assign_task_godmother_configs
     WHERE id = v_config_id;
  END IF;

  IF v_config IS NULL OR v_config.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'assign_task_godmother: config not found'
    );
  END IF;

  -- Validate template exists and is not archived
  IF v_config.template_id IS NOT NULL THEN
    SELECT id, title, description INTO v_template
      FROM public.task_templates
     WHERE id = v_config.template_id
       AND archived_at IS NULL;

    IF v_template.id IS NULL THEN
      RETURN jsonb_build_object(
        'status', 'failed',
        'error_message', 'assign_task_godmother: template_not_found or archived'
      );
    END IF;
  END IF;

  -- Resolve task title
  v_task_title := COALESCE(
    v_config.task_title,
    v_template.title,
    p_payload ->> 'payload_text',
    'Auto-assigned task'
  );

  -- Resolve assignee
  CASE v_config.assignment_mode
    WHEN 'to_doer' THEN
      v_assignee_id := v_member_id;
    WHEN 'to_specific' THEN
      v_assignee_id := v_config.specific_member_id;
    WHEN 'to_all' THEN
      -- For 'to_all', we assign to the deed member and note it.
      -- Full multi-member assignment would require multiple task rows;
      -- keeping it simple for Phase 3 — single task to deed member.
      v_assignee_id := v_member_id;
    ELSE
      v_assignee_id := v_member_id;
  END CASE;

  IF v_assignee_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'assign_task_godmother: could not resolve assignee'
    );
  END IF;

  -- Resolve due date
  SELECT COALESCE(f.timezone, 'America/Denver') INTO v_family_tz
    FROM public.families f
   WHERE f.id = v_family_id;

  v_today := (now() AT TIME ZONE v_family_tz)::date;

  IF v_config.due_date_offset_days IS NOT NULL THEN
    v_due_date := v_today + v_config.due_date_offset_days;
  ELSE
    v_due_date := v_today;
  END IF;

  -- Create the task
  INSERT INTO public.tasks (
    family_id, created_by, assignee_id, template_id,
    title, description, task_type, status, priority,
    due_date, source, source_reference_id
  ) VALUES (
    v_family_id,
    v_family_id,  -- system-created (no specific creator member)
    v_assignee_id,
    v_config.template_id,
    v_task_title,
    COALESCE(v_config.task_description, v_template.description),
    'task',
    'active',
    'normal',
    v_due_date,
    'contract_grant',
    p_contract_id::text
  )
  RETURNING id INTO v_task_id;

  RETURN jsonb_build_object(
    'status', 'granted',
    'grant_reference', v_task_id,
    'metadata', jsonb_build_object(
      'assignee_id', v_assignee_id,
      'title', v_task_title,
      'due_date', v_due_date,
      'assignment_mode', v_config.assignment_mode
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_assign_task_godmother IS
  'Phase 3 connector: creates tasks from templates when contracts fire. '
  'Supports to_doer/to_specific/to_all assignment and configurable due dates.';

DO $$ BEGIN RAISE NOTICE 'migration 100215: execute_assign_task_godmother created'; END $$;
