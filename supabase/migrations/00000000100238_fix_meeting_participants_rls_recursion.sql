-- Fix `meeting_participants` RLS recursion that was causing every authenticated
-- query against `public.meetings` to return 500 from PostgREST.
--
-- Repro (failing query from the dashboard's `useActiveMeetings` /
-- `useRecentMeetings` hooks):
--   GET /rest/v1/meetings?select=...&family_id=eq.<id>&status=eq.completed
--   → 500 Internal Server Error
--
-- Root cause: the `mp_participant_read` policy on `meeting_participants`
-- (created in migration 100146) self-references the same table inside its OR
-- branch:
--
--   USING (
--     family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
--     OR meeting_id IN (
--       SELECT meeting_id FROM meeting_participants  -- ← recursive
--       WHERE family_member_id IN (...)
--     )
--   )
--
-- That OR branch was meant to grant a participant visibility into their
-- co-participants in the same meeting. But the subquery against
-- `meeting_participants` re-triggers the same policy on every row evaluated,
-- which Postgres detects as infinite recursion (42P17). When PostgREST hits
-- a `meetings` query, the planner expands `meetings_participant_read`, whose
-- subquery into `meeting_participants` then evaluates `mp_participant_read`,
-- and the whole evaluation explodes — even for primary_parent users who
-- only need `meetings_mom_read` to pass.
--
-- Fix: drop the recursive policy and recreate without the self-reference.
-- The first OR branch ("I am the participant") plus the existing
-- `mp_mom_read` policy ("mom sees all participants in her family's meetings")
-- covers every read path the app actually uses today.
--
-- Co-participant visibility (a non-mom seeing the OTHER members of a meeting
-- they're in) is not required by any current consumer. If a future feature
-- needs it, implement via a SECURITY DEFINER helper that returns the meeting
-- ids the caller participates in — never via a self-referential RLS policy.
--
-- Same defect class as migration 100080 (list_shares), same shape of fix.
-- Idempotent — safe to re-run.

DROP POLICY IF EXISTS mp_participant_read ON public.meeting_participants;

CREATE POLICY mp_participant_read ON public.meeting_participants FOR SELECT USING (
  family_member_id IN (
    SELECT id FROM public.family_members WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY mp_participant_read ON public.meeting_participants IS
  'Members can read their own participation rows. Mom-level visibility into all family meeting participants is granted by the mp_mom_read policy. Do not add a self-referential subquery into meeting_participants here — see migration 100238 for the recursion incident.';
