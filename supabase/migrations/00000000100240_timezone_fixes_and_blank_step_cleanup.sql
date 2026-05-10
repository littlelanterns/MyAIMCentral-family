-- ============================================================================
-- 100240 — Timezone fixes for server-side date comparisons + blank step cleanup
--
-- Convention #257 violation fixes:
--   1. archive_expired_routines — was using UTC CURRENT_DATE, killed 4 routines
--      5 hours early on 2026-05-09 (family timezone is America/Chicago).
--   2. check_day_completion — same UTC CURRENT_DATE bug.
--   3. compute_streak — v_today := CURRENT_DATE was UTC, streak boundary wrong.
--
-- All three now look up the family's timezone and use
-- (NOW() AT TIME ZONE family_tz)::DATE instead of CURRENT_DATE.
--
-- Also: deletes 3 blank ghost steps from the Kitchen template that were
-- created when mom backspaced step text (no trash icon was available).
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. archive_expired_routines — timezone-safe
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.archive_expired_routines(p_family_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_authorized BOOLEAN := FALSE;
  v_count INTEGER;
  v_family_tz TEXT;
  v_local_today DATE;
BEGIN
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = p_family_id
        AND user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Look up family timezone; fall back to America/Chicago
  SELECT COALESCE(NULLIF(f.timezone, ''), 'America/Chicago')
    INTO v_family_tz
    FROM families f
   WHERE f.id = p_family_id;

  IF v_family_tz IS NULL THEN
    v_family_tz := 'America/Chicago';
  END IF;

  v_local_today := (NOW() AT TIME ZONE v_family_tz)::DATE;

  WITH archived AS (
    UPDATE tasks
    SET archived_at = NOW(),
        status = 'cancelled'
    WHERE family_id = p_family_id
      AND task_type = 'routine'
      AND status = 'pending'
      AND archived_at IS NULL
      AND recurrence_details IS NOT NULL
      AND (recurrence_details->>'until') IS NOT NULL
      AND (recurrence_details->>'until')::DATE < v_local_today
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM archived;

  RETURN v_count;
END;
$fn$;

COMMENT ON FUNCTION public.archive_expired_routines(UUID) IS
  'Sweep: archives expired routines using the family''s local timezone '
  '(Convention #257). Fixed in migration 100240 — was using UTC CURRENT_DATE.';


-- ═══════════════════════════════════════════════════════════════════════
-- 2. check_day_completion — timezone-safe
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_day_completion(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_incomplete INTEGER;
  v_family_tz TEXT;
  v_local_today DATE;
BEGIN
  -- Look up family timezone via member
  SELECT COALESCE(NULLIF(f.timezone, ''), 'America/Chicago')
    INTO v_family_tz
    FROM family_members fm
    JOIN families f ON f.id = fm.family_id
   WHERE fm.id = p_member_id;

  IF v_family_tz IS NULL THEN
    v_family_tz := 'America/Chicago';
  END IF;

  v_local_today := (NOW() AT TIME ZONE v_family_tz)::DATE;

  SELECT count(DISTINCT t.id) INTO v_incomplete
    FROM public.tasks t
    LEFT JOIN public.task_assignments ta
      ON ta.task_id = t.id AND ta.member_id = p_member_id
   WHERE (t.assignee_id = p_member_id OR ta.member_id IS NOT NULL)
     AND t.archived_at IS NULL
     AND (t.due_date IS NULL OR t.due_date <= v_local_today)
     AND t.status <> 'cancelled'
     AND (
       t.task_type <> 'routine'
       OR t.recurrence_details IS NULL
       OR (t.recurrence_details->>'until') IS NULL
       OR (t.recurrence_details->>'until')::DATE >= v_local_today
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.task_completions tc
        WHERE tc.task_id = t.id
          AND tc.family_member_id = p_member_id
          AND (tc.approval_status IS NULL OR tc.approval_status = 'approved')
     );

  RETURN v_incomplete = 0;
END;
$fn$;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. compute_streak — timezone-safe
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.compute_streak(
  p_family_member_id UUID,
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_grace_days      INTEGER := 0;
  v_current_streak  INTEGER := 0;
  v_longest_streak  INTEGER := 0;
  v_last_fired_at   TIMESTAMPTZ := NULL;
  v_prev_date       DATE := NULL;
  v_curr_date       DATE;
  v_gap             INTEGER;
  v_running         INTEGER := 0;
  v_family_tz       TEXT;
  v_today           DATE;
  r                 RECORD;
BEGIN
  -- Look up family timezone
  SELECT COALESCE(NULLIF(f.timezone, ''), 'America/Chicago')
    INTO v_family_tz
    FROM family_members fm
    JOIN families f ON f.id = fm.family_id
   WHERE fm.id = p_family_member_id;

  IF v_family_tz IS NULL THEN
    v_family_tz := 'America/Chicago';
  END IF;

  v_today := (NOW() AT TIME ZONE v_family_tz)::DATE;

  -- Load grace days from gamification config
  SELECT COALESCE(gc.streak_grace_days, 0)
    INTO v_grace_days
    FROM public.gamification_configs gc
   WHERE gc.family_member_id = p_family_member_id;

  -- Get distinct firing dates in descending order, in the family's local timezone
  FOR r IN
    SELECT DISTINCT (df.fired_at AT TIME ZONE v_family_tz)::date AS fire_date
      FROM public.deed_firings df
     WHERE df.family_member_id = p_family_member_id
       AND (p_source_type IS NULL OR df.source_type = p_source_type)
       AND (p_source_id IS NULL OR df.source_id = p_source_id)
     ORDER BY fire_date DESC
  LOOP
    v_curr_date := r.fire_date;

    IF v_prev_date IS NULL THEN
      v_gap := v_today - v_curr_date;
      IF v_gap > (1 + v_grace_days) THEN
        v_current_streak := 0;
        v_longest_streak := 0;
        EXIT;
      END IF;
      v_running := 1;
    ELSE
      v_gap := v_prev_date - v_curr_date;
      IF v_gap <= (1 + v_grace_days) THEN
        v_running := v_running + 1;
      ELSE
        IF v_current_streak = 0 THEN
          v_current_streak := v_running;
        END IF;
        v_longest_streak := GREATEST(v_longest_streak, v_running);
        v_running := 1;
      END IF;
    END IF;

    v_prev_date := v_curr_date;
  END LOOP;

  -- Finalize
  IF v_running > 0 THEN
    IF v_current_streak = 0 THEN
      v_current_streak := v_running;
    END IF;
    v_longest_streak := GREATEST(v_longest_streak, v_running);
  END IF;

  -- Get last firing timestamp
  SELECT MAX(df.fired_at)
    INTO v_last_fired_at
    FROM public.deed_firings df
   WHERE df.family_member_id = p_family_member_id
     AND (p_source_type IS NULL OR df.source_type = p_source_type)
     AND (p_source_id IS NULL OR df.source_id = p_source_id);

  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'last_fired_at', v_last_fired_at
  );
END;
$fn$;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. Delete blank ghost steps from Kitchen template
-- ═══════════════════════════════════════════════════════════════════════
-- These were created when mom backspaced step text to empty because the
-- inline edit UI had no visible trash button (fixed in this same commit).

DELETE FROM task_template_steps
WHERE title = '' AND step_name = ''
  AND id IN (
    '43fd9b56-d151-4304-b987-c9f7b0e7b271',
    'b88ba35c-3f85-409d-89f6-55673dcc8c89',
    '007ec819-1768-4b3a-8a21-d59aa281d1d5'
  );


-- Verification
DO $$ BEGIN
  RAISE NOTICE 'migration 100240: timezone fixes applied';
  RAISE NOTICE '  archive_expired_routines: now uses family timezone';
  RAISE NOTICE '  check_day_completion: now uses family timezone';
  RAISE NOTICE '  compute_streak: now uses family timezone';
  RAISE NOTICE '  3 blank ghost steps deleted from Kitchen template';
END $$;
