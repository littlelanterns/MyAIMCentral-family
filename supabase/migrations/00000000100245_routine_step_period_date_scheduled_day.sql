-- ============================================================================
-- 100245 — Routine step period_date attribution: scheduled day, not completion day
--
-- Founder rule (refined 2026-05-19):
--   When a kid catches up on a carry-over section (show_until_complete=true)
--   on a day that ISN'T the section's scheduled day, the completion should be
--   attributed to the section's ORIGINAL scheduled day — not the day it was
--   actually checked off. This way:
--
--     • The "Today" allowance view (filtered by period_date = today) shows
--       only the work that was scheduled for today.
--     • The "Weekly" allowance view (filtered by period_date BETWEEN week
--       start AND week end) still includes the catch-up (because the original
--       scheduled day is within the week).
--     • Catch-ups from a previous allowance period (>= 7 days back) don't
--       inflate the current period — they either fall outside the period
--       range (cleanly excluded by the existing BETWEEN filter) or fall back
--       to today as a last resort.
--
-- This supersedes migration 100157, which set period_date = completion day in
-- the family timezone. Same family-timezone derivation, same fallback logic;
-- the new part is the walk-back for carry-over (show_until_complete) sections.
--
-- Behavior matrix (kid checks off step on Wed May 20, family in CDT):
--
--   Section frequency_days │ show_until_complete │ period_date written
--   ───────────────────────┼─────────────────────┼─────────────────────
--   ['1','2','3','4','5']  │     either          │   Wed May 20 (today's DOW=3 matches)
--   ['1'] (Mon only)       │     true            │   Mon May 18 (walked back 2 days)
--   ['1'] (Mon only)       │     false           │   Wed May 20 (no carry-over allowed,
--                          │                     │   but section also shouldn't be
--                          │                     │   showing on Wed if not s_u_c)
--   ['5'] (Fri only)       │     true            │   Fri May 15 (walked back 5 days,
--                          │                     │   previous period)
--   NULL or empty array    │     either          │   Wed May 20 (no scheduling info)
--
-- No data migration: existing rows keep their (old-semantics) period_date.
-- Future inserts/updates use the new logic. Old period snapshots stay frozen.
-- The dashboard checklist UI handles the rendering for carry-over sections via
-- weekCompletedStepIds — see RoutineStepChecklist.tsx isSectionActiveToday.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_routine_step_period_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
  v_today DATE;
  v_dow_today INT;
  v_frequency_days TEXT[];
  v_show_until_complete BOOLEAN;
  v_walk_date DATE;
  v_walk_dow INT;
BEGIN
  -- Family timezone (matches migration 100157 logic)
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm
  JOIN families f ON f.id = fm.family_id
  WHERE fm.id = NEW.member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  -- Default completed_at if not supplied (matches column default NOW())
  IF NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  -- Today in the family's local timezone
  v_today := (NEW.completed_at AT TIME ZONE v_family_timezone)::date;
  v_dow_today := EXTRACT(DOW FROM v_today)::INT;

  -- Look up the step's section settings. Handles step_id IS NULL gracefully
  -- (orphans from prior template edits) by leaving frequency_days NULL.
  IF NEW.step_id IS NOT NULL THEN
    SELECT tts.frequency_days, tts.show_until_complete
    INTO v_frequency_days, v_show_until_complete
    FROM task_template_steps stp
    JOIN task_template_sections tts ON tts.id = stp.section_id
    WHERE stp.id = NEW.step_id;
  END IF;

  -- Use today as period_date when:
  --   • No section info found (orphan completion or missing data)
  --   • Section has no frequency_days (defaults to every day)
  --   • Today's DOW already matches the section's scheduled days
  --   • Section is NOT show_until_complete (no carry-over allowed)
  -- This preserves migration 100157's behavior for the common case where
  -- the kid is doing today's scheduled work on today.
  IF v_frequency_days IS NULL
     OR array_length(v_frequency_days, 1) IS NULL
     OR v_show_until_complete IS NOT TRUE
     OR v_dow_today::TEXT = ANY(v_frequency_days)
  THEN
    NEW.period_date := v_today;
    RETURN NEW;
  END IF;

  -- Carry-over case: section is show_until_complete AND today is NOT a
  -- scheduled day. Walk back up to 7 days to find the most recent scheduled
  -- day. The walk attributes the completion to the original assignment day
  -- so the daily numerator stays clean and the weekly numerator still gets
  -- credit (the scheduled day is within the week range).
  v_walk_date := v_today - 1;
  FOR i IN 1..7 LOOP
    v_walk_dow := EXTRACT(DOW FROM v_walk_date)::INT;
    IF v_walk_dow::TEXT = ANY(v_frequency_days) THEN
      NEW.period_date := v_walk_date;
      RETURN NEW;
    END IF;
    v_walk_date := v_walk_date - 1;
  END LOOP;

  -- Walk-back exhausted without finding a scheduled day in the last 7 days.
  -- This shouldn't happen for valid frequency_days arrays (they must contain
  -- at least one DOW 0-6, and 7 days covers every DOW once). Fall back to
  -- today so the completion isn't lost. Stale catch-ups beyond 7 days will
  -- count for today's date.
  NEW.period_date := v_today;
  RETURN NEW;
END;
$$;

-- Trigger registration unchanged (still BEFORE INSERT OR UPDATE OF completed_at)
DROP TRIGGER IF EXISTS trg_set_routine_step_period_date ON public.routine_step_completions;

CREATE TRIGGER trg_set_routine_step_period_date
  BEFORE INSERT OR UPDATE OF completed_at ON public.routine_step_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_routine_step_period_date();

COMMENT ON FUNCTION public.set_routine_step_period_date() IS
  'Sets routine_step_completions.period_date to the section''s most recent scheduled day (walking back from completed_at in the family timezone, up to 7 days). Carry-over completions on non-scheduled days are attributed to the original scheduled day, preventing daily-view inflation while keeping weekly credit intact. Supersedes migration 100157.';
