-- Phase 3 Connector Architecture — Sub-task 4
-- compute_streak RPC: counts consecutive days with at least one deed firing.
-- Respects gamification_configs.streak_grace_days for gap tolerance.
-- Replaces the inline streak logic in roll_creature_for_completion Step 6.

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
  v_today           DATE := CURRENT_DATE;
  r                 RECORD;
BEGIN
  -- Load grace days from gamification config
  SELECT COALESCE(gc.streak_grace_days, 0)
    INTO v_grace_days
    FROM public.gamification_configs gc
   WHERE gc.family_member_id = p_family_member_id;

  -- Get distinct firing dates in descending order
  -- Optionally scoped by source_type and/or source_id
  FOR r IN
    SELECT DISTINCT (df.fired_at AT TIME ZONE 'UTC')::date AS fire_date
      FROM public.deed_firings df
     WHERE df.family_member_id = p_family_member_id
       AND (p_source_type IS NULL OR df.source_type = p_source_type)
       AND (p_source_id IS NULL OR df.source_id = p_source_id)
     ORDER BY fire_date DESC
  LOOP
    v_curr_date := r.fire_date;

    IF v_prev_date IS NULL THEN
      -- First date: check if it's today or yesterday (streak is current)
      v_gap := v_today - v_curr_date;
      IF v_gap > (1 + v_grace_days) THEN
        -- Most recent firing is too old — no active streak
        v_current_streak := 0;
        v_longest_streak := 0;
        EXIT;
      END IF;
      v_running := 1;
    ELSE
      v_gap := v_prev_date - v_curr_date;
      IF v_gap <= (1 + v_grace_days) THEN
        -- Within acceptable gap (consecutive or grace-tolerated)
        v_running := v_running + 1;
      ELSE
        -- Gap too large: streak broken
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

COMMENT ON FUNCTION public.compute_streak IS
  'Phase 3 connector: computes consecutive-day streak from deed_firings. '
  'Used as an IF condition on streak-pattern contracts. '
  'Respects gamification_configs.streak_grace_days for gap tolerance.';

DO $$ BEGIN RAISE NOTICE 'migration 100204: compute_streak RPC created'; END $$;
