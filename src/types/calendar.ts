/**
 * Calendar types — PRD-14B
 *
 * Uses separate DATE + TIME fields per founder-confirmed schema.
 * Recurrence via RRULE JSONB per PRD-35.
 */

export interface CalendarEvent {
  id: string
  family_id: string
  created_by: string
  title: string
  description: string | null
  location: string | null
  event_date: string // DATE as ISO string 'YYYY-MM-DD'
  end_date: string | null
  start_time: string | null // TIME as 'HH:MM:SS' or null (all-day)
  end_time: string | null
  is_all_day: boolean
  event_type: EventType
  category_id: string | null
  priority: 'low' | 'medium' | 'high' | null
  color: string | null
  icon_override: string | null
  source_type: EventSource
  source_reference_id: string | null
  source_image_url: string | null
  external_id: string | null
  external_source: string | null
  last_synced_at: string | null
  recurrence_rule: RecurrenceRule | null
  recurrence_details: Record<string, unknown> | null
  recurrence_parent_id: string | null
  status: EventStatus
  rejection_note: string | null
  approved_by: string | null
  approved_at: string | null
  transportation_needed: boolean
  transportation_notes: string | null
  items_to_bring: ItemToBring[]
  leave_by_time: string | null // TIME as 'HH:MM:SS'
  notes: string | null
  reminder_minutes: number[] | null
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

export interface ItemToBring {
  text: string
  checked: boolean
  ai_suggested: boolean
}

export type EventType = 'task' | 'event' | 'deadline' | 'reminder' | 'appointment' | 'activity'
export type EventStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
export type EventSource = 'manual' | 'review_route' | 'image_ocr' | 'lila_guided' | 'task_auto' | 'google_sync'
export type RecurrenceRule = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'

export interface EventAttendee {
  id: string
  event_id: string
  family_member_id: string
  attendee_role: 'attending' | 'driving' | 'requested_presence'
  response_status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface EventCategory {
  id: string
  family_id: string | null
  name: string
  slug: string
  icon: string
  color: string | null
  is_system: boolean
  sort_order: number
  created_at: string
}

export interface CalendarSettings {
  id: string
  family_id: string
  default_drive_time_minutes: number
  required_intake_fields: string[]
  auto_approve_members: string[]
  week_start_day: 0 | 1
  created_at: string
  updated_at: string
}

// Input types for creation/update
export interface CreateEventInput {
  title: string
  description?: string
  location?: string
  event_date: string // 'YYYY-MM-DD'
  end_date?: string
  start_time?: string // 'HH:MM' or 'HH:MM:SS'
  end_time?: string
  is_all_day?: boolean
  event_type?: EventType
  category_id?: string
  priority?: 'low' | 'medium' | 'high'
  recurrence_rule?: RecurrenceRule
  recurrence_details?: Record<string, unknown>
  transportation_needed?: boolean
  transportation_notes?: string
  items_to_bring?: ItemToBring[]
  leave_by_time?: string
  notes?: string
  reminder_minutes?: number[]
  attendees?: AttendeeInput[]
}

export interface AttendeeInput {
  family_member_id: string
  attendee_role?: 'attending' | 'driving' | 'requested_presence'
}

// Task due date type (read from tasks table, not calendar_events)
export interface TaskDueDate {
  id: string
  title: string
  due_date: string
  assignee_id: string | null
  status: string
  priority: string | null
  created_by: string
}

// Calendar view types
export type CalendarView = 'day' | 'week' | 'month'
export type CalendarFilter = 'me' | 'family' | 'pick'
export type CalendarColorMode = 'dots' | 'stripe'
