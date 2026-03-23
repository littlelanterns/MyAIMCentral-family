-- MyAIM Central v2 — Phase 05: Universal Scheduler (PRD-35)
-- Tables: access_schedules
-- Enables shift-based, custody-based, and always-on availability patterns

-- ============================================================
-- Access Schedules
-- ============================================================
-- Determines when each family member is "available" for the platform.
-- Used by: special adults (shift schedules), custody arrangements,
-- streak calculations, task assignment windows, caregiver access.
-- Recurrence uses RRULE format (RFC 5545) stored as JSONB.

CREATE TABLE public.access_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('shift', 'custody', 'always_on')),
  recurrence_details JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_as_family ON public.access_schedules(family_id);
CREATE INDEX idx_as_member ON public.access_schedules(member_id);
CREATE INDEX idx_as_active ON public.access_schedules(family_id, is_active)
  WHERE is_active = true;

CREATE TRIGGER trg_as_updated_at
  BEFORE UPDATE ON public.access_schedules
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.access_schedules ENABLE ROW LEVEL SECURITY;

-- Primary parent can manage all schedules in the family
CREATE POLICY "as_manage_primary_parent" ON public.access_schedules
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- Scheduled member can read their own schedules
CREATE POLICY "as_select_own" ON public.access_schedules
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Helper: check if a member is currently available
-- ============================================================
-- Returns true if:
--   1. Member has no active schedules (default: always available)
--   2. Member has an 'always_on' schedule
--   3. Member has a shift/custody schedule and current time falls within it
-- Note: RRULE evaluation happens client-side via rrule.js.
-- This function handles the simple cases; complex recurrence is evaluated in the app.

CREATE OR REPLACE FUNCTION public.is_member_available(
  p_member_id UUID,
  p_check_time TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_schedule_count INTEGER;
  v_has_always_on BOOLEAN;
BEGIN
  -- Count active schedules for this member
  SELECT COUNT(*) INTO v_schedule_count
  FROM public.access_schedules
  WHERE member_id = p_member_id AND is_active = true;

  -- No schedules = always available (default behavior)
  IF v_schedule_count = 0 THEN
    RETURN true;
  END IF;

  -- Check for always_on schedule
  SELECT EXISTS(
    SELECT 1 FROM public.access_schedules
    WHERE member_id = p_member_id
      AND is_active = true
      AND schedule_type = 'always_on'
  ) INTO v_has_always_on;

  IF v_has_always_on THEN
    RETURN true;
  END IF;

  -- For shift/custody schedules, return NULL to indicate
  -- "needs client-side RRULE evaluation"
  -- The app layer will use rrule.js to resolve this
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
