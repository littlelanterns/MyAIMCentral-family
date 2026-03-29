-- Fix event_attendees SELECT policy (E-1)
--
-- Previous policy only checked family membership on the parent event.
-- Any family member could see attendees for ANY event in the family,
-- including rejected, cancelled, and other members' draft events.
--
-- New policy mirrors calendar_events visibility rules:
--   - Approved events visible to all family members
--   - Own events (any status) visible to creator
--   - Primary parent sees all events
--
-- This prevents children from seeing attendee lists for events they
-- shouldn't have access to (other members' pending/rejected events).

DROP POLICY IF EXISTS "event_attendees_select" ON event_attendees;
CREATE POLICY "event_attendees_select" ON event_attendees
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM calendar_events
      WHERE
        family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
        AND (
          status = 'approved'
          OR created_by IN (SELECT id FROM family_members WHERE user_id = auth.uid())
          OR family_id IN (
            SELECT family_id FROM family_members
            WHERE user_id = auth.uid() AND role = 'primary_parent'
          )
        )
    )
  );
