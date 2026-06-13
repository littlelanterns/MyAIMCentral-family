-- ============================================================================
-- 00000000100273 — Fix meetings ↔ meeting_participants RLS cross-recursion
--
-- P0 production bug, founder console report 2026-06-12 (KIDS-REWARDS-PAGE
-- Slice 2 session, same-day save — FO-COMMAND-CENTER/100265 precedent):
--   GET /rest/v1/meetings?...&status=eq.completed → 500
--   PostgREST body: 42P17 "infinite recursion detected in policy for
--   relation \"meetings\"" — reproduced for BOTH the founder family and the
--   Testworth family, i.e. every authenticated meetings read platform-wide.
--   The dashboard's recent-meetings query and the entire Meetings page have
--   been silently dead in production (meetings has 0 rows — nobody has been
--   able to use the feature).
--
-- Root cause — a TWO-TABLE policy cycle (the defect class Convention/migration
-- 100265 documented for tasks ↔ task_assignments: never let two tables'
-- policies subquery each other inline):
--
--   meetings_participant_read (meetings, SELECT)
--     → subqueries public.meeting_participants            (100146 line 107)
--   mp_mom_read (meeting_participants, SELECT)
--     → subqueries public.meetings                        (100146 line 88)
--
--   Evaluating either table's SELECT expands the other's policies, which
--   re-expand the first → 42P17.
--
-- Migration 100238 fixed the SELF-recursion inside mp_participant_read but
-- left this cross-table cycle in place.
--
-- Fix: the meetings-side participant lookup moves into a SECURITY DEFINER
-- helper (owner execution bypasses RLS inside the function, so no policy
-- re-expansion). After this, evaluating mp_mom_read's meetings subquery
-- expands meetings policies that no longer re-enter meeting_participants —
-- cycle broken in one authoritative place.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- 1. SECURITY DEFINER helper: meeting ids the calling user participates in.
CREATE OR REPLACE FUNCTION util.my_meeting_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT mp.meeting_id
    FROM public.meeting_participants mp
    JOIN public.family_members fm ON fm.id = mp.family_member_id
   WHERE fm.user_id = auth.uid()
$fn$;

REVOKE ALL ON FUNCTION util.my_meeting_ids() FROM anon;
GRANT EXECUTE ON FUNCTION util.my_meeting_ids() TO authenticated;

COMMENT ON FUNCTION util.my_meeting_ids IS
  'Meeting ids where the calling auth user is a participant. SECURITY DEFINER so meetings RLS policies can reference participation WITHOUT subquerying meeting_participants inline (the 42P17 cross-recursion fixed in migration 100273). Pattern reference: migration 100265 (tasks ↔ task_assignments).';

-- 2. Recreate the meetings participant-read policy on the helper.
DROP POLICY IF EXISTS meetings_participant_read ON public.meetings;
CREATE POLICY meetings_participant_read ON public.meetings FOR SELECT USING (
  id IN (SELECT util.my_meeting_ids())
);

COMMENT ON POLICY meetings_participant_read ON public.meetings IS
  'Participants read meetings they are in, via util.my_meeting_ids() (SECURITY DEFINER). Never subquery meeting_participants inline here — meeting_participants policies subquery meetings, and the inline pair is the 42P17 cycle fixed in migration 100273.';
