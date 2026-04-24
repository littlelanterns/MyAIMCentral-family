-- routine_step_completions.period_date must reflect the family's local date,
-- not the clicking device's local date. Devices with misconfigured clocks
-- (commonly a kid's tablet left in UTC or a sleep-mode-stale clock) were
-- writing period_date = tomorrow, making checked steps invisible when mom
-- viewed the dashboard from a device with the correct timezone.
--
-- This trigger derives period_date from completed_at in the family's
-- timezone, overriding whatever the client sent. Completed_at remains
-- TIMESTAMPTZ (authoritative moment). period_date is now a deterministic
-- function of completed_at + families.timezone — no device clock involved.
--
-- Fallback: if family lookup fails (shouldn't happen, all rows have member_id
-- pointing at family_members), use America/Chicago as a last resort so the
-- trigger never blocks an insert.

CREATE OR REPLACE FUNCTION public.set_routine_step_period_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
BEGIN
  -- Look up the family's timezone via member_id → family_members → families
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

  NEW.period_date := (NEW.completed_at AT TIME ZONE v_family_timezone)::date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_routine_step_period_date ON public.routine_step_completions;

CREATE TRIGGER trg_set_routine_step_period_date
  BEFORE INSERT OR UPDATE OF completed_at ON public.routine_step_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_routine_step_period_date();

COMMENT ON FUNCTION public.set_routine_step_period_date() IS
  'Derives period_date from completed_at in the family''s timezone. Overrides whatever the client sent. Prevents device-clock-misconfiguration bugs where a kid''s tablet in UTC writes tomorrow''s date and "today" queries miss all their completed steps.';
