/**
 * extractCalendarDetail — client wrapper for the calendar-extract Edge Function
 * (RR-DEPLOY-SCOPING follow-up, founder request 2026-06-10: "meeting today at 4"
 * should open Create Event with today's date + 16:00 pre-filled, editable).
 *
 * Returns the flat MindSweep-shaped destination_detail (calendar_subtype,
 * event_title, events[], ...) that SortTab.queueItemToCalendarEvent and
 * CalendarTab already know how to render — or null on any failure (callers
 * fall back to the unparsed behavior; extraction is enrichment, never a gate).
 */
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso } from '@/utils/dates'

export interface CalendarDetailEvent {
  date: string
  start_time: string | null
  end_time: string | null
  notes: string | null
}

export interface ExtractedCalendarDetail {
  calendar_subtype: string
  event_title: string
  event_location: string | null
  event_description: string | null
  events: CalendarDetailEvent[]
  start_date: string | null
  end_date: string | null
  recurrence_days: string[]
  attendee_names: string[]
  driver_name: string | null
  extracted_by: 'calendar-extract'
}

export async function extractCalendarDetail(
  content: string,
  familyId: string,
  memberId: string,
): Promise<ExtractedCalendarDetail | null> {
  try {
    const { data, error } = await supabase.functions.invoke('calendar-extract', {
      body: {
        content,
        today: todayLocalIso(),
        family_id: familyId,
        member_id: memberId,
      },
    })
    if (error || !data?.destination_detail) return null
    return data.destination_detail as ExtractedCalendarDetail
  } catch {
    return null
  }
}

/** True when a queue row's content_details already carry usable event data. */
export function hasUsableCalendarDetail(details: unknown): boolean {
  if (!details || typeof details !== 'object') return false
  const d = details as Record<string, unknown>
  // ICS / normalized path
  const parsed = d.parsed_event as Record<string, unknown> | undefined
  if (parsed && typeof parsed.event_date === 'string' && parsed.event_date) return true
  // Flat MindSweep / calendar-extract path
  const events = d.events as Array<Record<string, unknown>> | undefined
  if (Array.isArray(events) && events.some((e) => typeof e?.date === 'string' && e.date)) return true
  if (typeof d.start_date === 'string' && d.start_date) return true
  return false
}
