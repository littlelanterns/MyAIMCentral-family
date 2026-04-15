/**
 * One-time fix: add event_attendees to meeting calendar events that were
 * created by the Meeting Setup Wizard before the attendee fix was deployed.
 *
 * Runs once on MeetingsPage mount. Finds calendar_events with
 * source_type='meeting_schedule' that have zero attendees, matches them
 * to their meeting_schedules via title pattern, and inserts attendees.
 *
 * Safe to run multiple times — uses upsert on (event_id, family_member_id).
 * Self-disabling: once all events have attendees, this does nothing.
 */

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'

export function useFixMeetingEventAttendees(
  familyId: string | undefined,
  memberId: string | undefined,
  familyMembers: FamilyMember[],
) {
  const hasRun = useRef(false)

  useEffect(() => {
    if (!familyId || !memberId || familyMembers.length === 0 || hasRun.current) return
    hasRun.current = true

    void fixAttendees(familyId, memberId, familyMembers)
  }, [familyId, memberId, familyMembers])
}

async function fixAttendees(
  familyId: string,
  momId: string,
  familyMembers: FamilyMember[],
) {
  try {
    // 1. Find meeting-sourced calendar events with no attendees
    const { data: events, error: evErr } = await supabase
      .from('calendar_events')
      .select('id, title, event_attendees(id)')
      .eq('family_id', familyId)
      .eq('source_type', 'meeting_schedule')

    if (evErr || !events) return

    const eventsWithoutAttendees = events.filter(
      e => !e.event_attendees || e.event_attendees.length === 0,
    )

    if (eventsWithoutAttendees.length === 0) return

    // 2. Find the additional adult (partner)
    const partner = familyMembers.find(m => m.role === 'additional_adult' && m.is_active)

    // 3. For each event, determine attendees from the title pattern
    const attendeeInserts: Array<{ event_id: string; family_member_id: string; attendee_role: string }> = []

    for (const event of eventsWithoutAttendees) {
      const title = (event.title as string) ?? ''

      // Family Council — no attendees needed (visible to all)
      if (title === 'Family Council') continue

      // Couple Check-in — both parents
      if (title === 'Couple Check-in' && partner) {
        attendeeInserts.push(
          { event_id: event.id as string, family_member_id: momId, attendee_role: 'attending' },
          { event_id: event.id as string, family_member_id: partner.id, attendee_role: 'attending' },
        )
        continue
      }

      // 1:1 meetings — title contains child's name: "[Label] with [ChildName]"
      const withMatch = title.match(/\bwith\s+(.+)$/i)
      if (withMatch) {
        const childName = withMatch[1].trim()
        const child = familyMembers.find(
          m => m.display_name.toLowerCase() === childName.toLowerCase() && m.is_active,
        )
        if (child) {
          // Add mom (or the parent in the recurrence_details.parent_id if available)
          attendeeInserts.push(
            { event_id: event.id as string, family_member_id: momId, attendee_role: 'attending' },
            { event_id: event.id as string, family_member_id: child.id, attendee_role: 'attending' },
          )
          // If partner exists and title could be their alternate month, add partner too
          // (conservative: just add mom + child; partner's alternate events get their own attendees)
        }
        continue
      }
    }

    if (attendeeInserts.length === 0) return

    // 4. Upsert all attendees
    const { error: insertErr } = await supabase
      .from('event_attendees')
      .upsert(attendeeInserts, { onConflict: 'event_id,family_member_id' })

    if (insertErr) {
      console.warn('[useFixMeetingEventAttendees] upsert failed:', insertErr.message)
    } else {
      console.log(`[useFixMeetingEventAttendees] Fixed ${attendeeInserts.length} attendee records across ${eventsWithoutAttendees.length} events`)
    }
  } catch (err) {
    console.warn('[useFixMeetingEventAttendees] error:', err)
  }
}
