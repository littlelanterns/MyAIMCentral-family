-- ============================================================================
-- Task Rotation Advancement Cron (PRD-09A)
--
-- Advances rotation assignments on recurring tasks when the rotation period
-- has elapsed. Runs daily at 00:15 UTC (after carry-forward at :05).
--
-- Rotation config lives in tasks.recurrence_details->'rotation':
--   { enabled: true, frequency: 'weekly'|'biweekly'|'monthly',
--     members: [uuid, ...], current_index: 0, last_rotated_at: 'YYYY-MM-DD' }
--
-- On advance: bump current_index (wrapping), flip is_active on task_assignments,
-- update tasks.assignee_id to the new active member, stamp last_rotated_at.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.advance_task_rotations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  rot JSONB;
  freq TEXT;
  last_rotated DATE;
  members JSONB;
  member_count INT;
  old_index INT;
  new_index INT;
  new_member_id UUID;
  old_member_id UUID;
  should_advance BOOLEAN;
BEGIN
  -- Find all tasks with active rotation config
  FOR rec IN
    SELECT t.id, t.recurrence_details
    FROM public.tasks t
    WHERE t.recurrence_details IS NOT NULL
      AND t.recurrence_details->'rotation'->>'enabled' = 'true'
      AND t.status IN ('pending', 'in_progress')
      AND t.archived_at IS NULL
  LOOP
    rot := rec.recurrence_details->'rotation';
    freq := rot->>'frequency';
    last_rotated := (rot->>'last_rotated_at')::DATE;
    members := rot->'members';
    member_count := jsonb_array_length(members);
    old_index := COALESCE((rot->>'current_index')::INT, 0);

    -- Skip if fewer than 2 members or missing data
    IF member_count < 2 OR last_rotated IS NULL THEN
      CONTINUE;
    END IF;

    -- Determine if the period has elapsed
    should_advance := FALSE;
    CASE freq
      WHEN 'weekly' THEN
        should_advance := (CURRENT_DATE - last_rotated) >= 7;
      WHEN 'biweekly' THEN
        should_advance := (CURRENT_DATE - last_rotated) >= 14;
      WHEN 'monthly' THEN
        should_advance := (CURRENT_DATE >= (last_rotated + INTERVAL '1 month')::DATE);
      WHEN 'custom' THEN
        -- Custom rotation: default to weekly if no interval specified
        should_advance := (CURRENT_DATE - last_rotated) >= 7;
      ELSE
        should_advance := FALSE;
    END CASE;

    IF NOT should_advance THEN
      CONTINUE;
    END IF;

    -- Advance: wrap around
    new_index := (old_index + 1) % member_count;
    new_member_id := (members->>new_index)::UUID;
    old_member_id := (members->>old_index)::UUID;

    -- Deactivate old assignment
    UPDATE public.task_assignments
    SET is_active = false,
        updated_at = now()
    WHERE task_id = rec.id
      AND family_member_id = old_member_id
      AND rotation_position = old_index;

    -- Activate new assignment
    UPDATE public.task_assignments
    SET is_active = true,
        updated_at = now()
    WHERE task_id = rec.id
      AND family_member_id = new_member_id
      AND rotation_position = new_index;

    -- Update task's primary assignee
    UPDATE public.tasks
    SET assignee_id = new_member_id,
        recurrence_details = jsonb_set(
          jsonb_set(
            rec.recurrence_details,
            '{rotation,current_index}',
            to_jsonb(new_index)
          ),
          '{rotation,last_rotated_at}',
          to_jsonb(CURRENT_DATE::TEXT)
        ),
        updated_at = now()
    WHERE id = rec.id;

  END LOOP;
END;
$$;

-- Schedule daily at 00:15 UTC (after carry-forward fallback at :05)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove if already scheduled (idempotent)
    BEGIN
      PERFORM cron.unschedule('advance-task-rotations');
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Job doesn't exist yet
    END;

    PERFORM cron.schedule(
      'advance-task-rotations',
      '15 0 * * *',
      'SELECT public.advance_task_rotations()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping rotation advancement scheduling';
END;
$outer$;
