/**
 * useCalendarEvents — PRD-14B Calendar data hooks
 *
 * Follows the same React Query patterns as useTasks.ts and useLists.ts.
 * All calendar CRUD, approval workflow, attendees, categories, settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from './useFamily'
import { useFamilyMember } from './useFamilyMember'
import { useActedBy } from './useActedBy'
import type {
  CalendarEvent,
  EventAttendee,
  EventCategory,
  CalendarSettings,
  CreateEventInput,
  AttendeeInput,
  TaskDueDate,
} from '@/types/calendar'

// ─── Query Keys ──────────────────────────────────────────────

const calendarKeys = {
  all: ['calendar'] as const,
  events: (familyId: string) => [...calendarKeys.all, 'events', familyId] as const,
  eventsRange: (familyId: string, start: string, end: string) =>
    [...calendarKeys.events(familyId), 'range', start, end] as const,
  eventsDate: (familyId: string, date: string) =>
    [...calendarKeys.events(familyId), 'date', date] as const,
  pending: (familyId: string) => [...calendarKeys.events(familyId), 'pending'] as const,
  categories: (familyId: string) => [...calendarKeys.all, 'categories', familyId] as const,
  settings: (familyId: string) => [...calendarKeys.all, 'settings', familyId] as const,
  tasksDue: (familyId: string, start: string, end: string) =>
    [...calendarKeys.all, 'tasks-due', familyId, start, end] as const,
}

// ─── Utility ─────────────────────────────────────────────────

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Events Queries ──────────────────────────────────────────

/** Get events for a date range (family-scoped) — includes multi-day events that overlap the range */
export function useEventsForRange(start: Date, end: Date, memberFilter?: string[], hubOnly?: boolean) {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: calendarKeys.eventsRange(familyId ?? '', toISODate(start), toISODate(end)),
    queryFn: async () => {
      // Multi-day fix: include events where event_date OR end_date falls within the range,
      // or where the event spans the entire range (event_date before start AND end_date after end).
      // Using .or() to cover: single-day events in range + multi-day events overlapping range.
      const startStr = toISODate(start)
      const endStr = toISODate(end)
      let query = supabase
        .from('calendar_events')
        .select('*, event_attendees(*)')
        .eq('family_id', familyId!)
        .or(`and(event_date.gte.${startStr},event_date.lte.${endStr}),and(end_date.gte.${startStr},end_date.lte.${endStr}),and(event_date.lte.${startStr},end_date.gte.${endStr})`)
        .in('status', ['approved', 'pending_approval', 'penciled_in'])
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })

      if (memberFilter && memberFilter.length > 0) {
        query = query.in('created_by', memberFilter)
      }

      // PRD-14D: Hub calendar filters by show_on_hub
      if (hubOnly) {
        query = query.eq('show_on_hub', true)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as (CalendarEvent & { event_attendees: EventAttendee[] })[]
    },
    enabled: !!familyId,
  })
}

/** Get events for a specific date — includes multi-day events that span this date */
export function useEventsForDate(date: Date) {
  const { data: family } = useFamily()
  const familyId = family?.id
  const dateStr = toISODate(date)

  return useQuery({
    queryKey: calendarKeys.eventsDate(familyId ?? '', dateStr),
    queryFn: async () => {
      // Multi-day fix: include events where this date falls between event_date and end_date
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, event_attendees(*)')
        .eq('family_id', familyId!)
        .or(`and(event_date.eq.${dateStr},end_date.is.null),and(event_date.lte.${dateStr},end_date.gte.${dateStr}),and(event_date.eq.${dateStr},end_date.eq.${dateStr})`)
        .order('start_time', { ascending: true, nullsFirst: false })

      if (error) throw error
      return (data ?? []) as (CalendarEvent & { event_attendees: EventAttendee[] })[]
    },
    enabled: !!familyId,
  })
}

/** Get pending events for approval (mom only) */
export function usePendingEvents() {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: calendarKeys.pending(familyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, event_attendees(*)')
        .eq('family_id', familyId!)
        .eq('status', 'pending_approval')
        .order('event_date', { ascending: true })

      if (error) throw error
      return (data ?? []) as (CalendarEvent & { event_attendees: EventAttendee[] })[]
    },
    enabled: !!familyId,
  })
}

// ─── Task Due Dates ──────────────────────────────────────────

/** Get tasks with due dates in a range (read from tasks table, NOT calendar_events) */
export function useTasksDueInRange(start: Date, end: Date, memberFilter?: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: [...calendarKeys.tasksDue(familyId ?? '', toISODate(start), toISODate(end)), memberFilter ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('id, title, due_date, assignee_id, status, priority, created_by')
        .eq('family_id', familyId!)
        .not('due_date', 'is', null)
        .neq('task_type', 'routine')
        .gte('due_date', toISODate(start))
        .lte('due_date', toISODate(end))
        .is('archived_at', null)
        .order('due_date', { ascending: true })

      if (memberFilter && memberFilter.length > 0) {
        query = query.in('assignee_id', memberFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as TaskDueDate[]
    },
    enabled: !!familyId,
  })
}

// ─── Event Mutations ─────────────────────────────────────────

/** Create a new calendar event */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!family?.id || !member?.id) throw new Error('No family/member context')

      // Determine status: explicit penciled_in takes priority, then role-based logic
      let status: string = 'pending_approval'
      if (input.status === 'penciled_in') {
        status = 'penciled_in'
      } else if (member.role === 'primary_parent') {
        status = 'approved'
      } else {
        // Check auto-approve list
        const { data: settings } = await supabase
          .from('calendar_settings')
          .select('auto_approve_members')
          .eq('family_id', family.id)
          .single()

        if (settings?.auto_approve_members?.includes(member.id)) {
          status = 'approved'
        }
      }

      const { attendees, status: _inputStatus, option_group_id, option_group_title, calendar_subtype, ...eventFields } = input

      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventFields,
          family_id: family.id,
          created_by: member.id,
          status,
          items_to_bring: eventFields.items_to_bring ?? [],
          acted_by: actedBy,
          ...(option_group_id ? { option_group_id } : {}),
          ...(option_group_title ? { option_group_title } : {}),
          ...(calendar_subtype ? { calendar_subtype } : {}),
        })
        .select()
        .single()

      if (error) throw error

      // Insert attendees if provided
      if (attendees && attendees.length > 0 && event) {
        const attendeeRows = attendees.map((a: AttendeeInput) => ({
          event_id: event.id,
          family_member_id: a.family_member_id,
          attendee_role: a.attendee_role ?? 'attending',
        }))

        const { error: attError } = await supabase
          .from('event_attendees')
          .insert(attendeeRows)

        if (attError) console.error('Failed to insert attendees:', attError)
      }

      return event as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

/** Update an existing calendar event */
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()

  return useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<CreateEventInput> }) => {
      const { attendees: _attendees, ...eventUpdates } = updates

      const { data, error } = await supabase
        .from('calendar_events')
        .update({ ...eventUpdates, acted_by: actedBy })
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

/** Delete (hard delete) a calendar event */
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

// ─── Approval Mutations ──────────────────────────────────────

/** Approve a pending event (mom only) */
export function useApproveEvent() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: member?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

/** Reject a pending event (mom only) */
export function useRejectEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, note }: { eventId: string; note?: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          status: 'rejected',
          rejection_note: note ?? null,
        })
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

// ─── Categories ──────────────────────────────────────────────

/** Get all available categories (system + family custom) */
export function useEventCategories() {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: calendarKeys.categories(familyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
        .or(`family_id.is.null,family_id.eq.${familyId}`)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as EventCategory[]
    },
    enabled: !!familyId,
  })
}

/** Create a custom event category */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { data: family } = useFamily()

  return useMutation({
    mutationFn: async (input: { name: string; icon?: string; color?: string }) => {
      if (!family?.id) throw new Error('No family context')

      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')

      const { data, error } = await supabase
        .from('event_categories')
        .insert({
          family_id: family.id,
          name: input.name,
          slug,
          icon: input.icon ?? 'calendar-days',
          color: input.color ?? null,
          is_system: false,
        })
        .select()
        .single()

      if (error) throw error
      return data as EventCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

// ─── Calendar Settings ───────────────────────────────────────

/** Get calendar settings for the family (creates default if not exists) */
export function useCalendarSettings() {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: calendarKeys.settings(familyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('family_id', familyId!)
        .single()

      if (error && error.code === 'PGRST116') {
        // No settings row yet — create default
        const { data: created, error: createErr } = await supabase
          .from('calendar_settings')
          .insert({ family_id: familyId! })
          .select()
          .single()

        if (createErr) throw createErr
        return created as CalendarSettings
      }

      if (error) throw error
      return data as CalendarSettings
    },
    enabled: !!familyId,
  })
}

/** Update calendar settings */
export function useUpdateCalendarSettings() {
  const queryClient = useQueryClient()
  const { data: family } = useFamily()

  return useMutation({
    mutationFn: async (updates: Partial<Omit<CalendarSettings, 'id' | 'family_id' | 'created_at' | 'updated_at'>>) => {
      if (!family?.id) throw new Error('No family context')

      const { data, error } = await supabase
        .from('calendar_settings')
        .update(updates)
        .eq('family_id', family.id)
        .select()
        .single()

      if (error) throw error
      return data as CalendarSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

// ─── Option Groups ──────────────────────────────────────────

/** Fetch all sibling events in an option group */
export function useOptionGroupEvents(optionGroupId: string | null | undefined) {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: [...calendarKeys.all, 'option-group', optionGroupId],
    queryFn: async () => {
      if (!familyId || !optionGroupId) return []
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, event_attendees(*)')
        .eq('family_id', familyId)
        .eq('option_group_id', optionGroupId)
        .neq('status', 'cancelled')
        .order('event_date', { ascending: true })

      if (error) throw error
      return (data ?? []) as (CalendarEvent & { event_attendees: EventAttendee[] })[]
    },
    enabled: !!familyId && !!optionGroupId,
  })
}

/** Confirm one date from an option group — does NOT auto-cancel siblings.
 *  Mom can confirm multiple dates (e.g. attending several performances). */
export function useConfirmOption() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()
  const { data: member } = useFamilyMember()

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string; optionGroupId: string }) => {
      if (!member) throw new Error('No member context')

      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: member.id,
          approved_at: new Date().toISOString(),
          acted_by: actedBy,
        })
        .eq('id', eventId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

/** Dismiss a single penciled-in date (cancel it) */
export function useDismissOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('id', eventId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

/** Dismiss all remaining penciled-in siblings in one action */
export function useDismissRemainingOptions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ optionGroupId }: { optionGroupId: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('option_group_id', optionGroupId)
        .eq('status', 'penciled_in')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}

// ─── Attendees ───────────────────────────────────────────────

/** Add attendees to an event */
export function useAddAttendees() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, attendees }: { eventId: string; attendees: AttendeeInput[] }) => {
      const rows = attendees.map(a => ({
        event_id: eventId,
        family_member_id: a.family_member_id,
        attendee_role: a.attendee_role ?? 'attending',
      }))

      const { error } = await supabase
        .from('event_attendees')
        .upsert(rows, { onConflict: 'event_id,family_member_id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
  })
}
