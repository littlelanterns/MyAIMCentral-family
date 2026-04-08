/**
 * CalendarTab (PRD-17 Screen 2 + Phase 0 Calendar Import)
 *
 * Shows two types of pending calendar items:
 * 1. Pending calendar_events (status='pending_approval') — submitted by family members
 * 2. Imported calendar items in studio_queue (destination='calendar') — from .ics import, MindSweep detection
 *
 * Actions:
 * - Approve: creates calendar_event (for queue items) or approves (for pending events)
 * - Edit & Approve: opens EventCreationModal pre-filled
 * - Reject/Dismiss: rejects event or dismisses queue item
 * - Bulk Approve All
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState } from 'react'
import {
  CalendarCheck, Calendar, MapPin, Car, User, Check, Pencil, X,
  Wand2, FileUp, Clock,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { usePendingEvents } from '@/hooks/useCalendarEvents'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { EventCreationModal } from '@/components/calendar/EventCreationModal'
import { createNotification } from '@/utils/createNotification'
import type { CalendarEvent, EventAttendee } from '@/types/calendar'
import type { CalendarQueueEventDetail } from '@/types/mindsweep'

// ── Studio queue calendar items ──

interface CalendarQueueItem {
  id: string
  family_id: string
  owner_id: string
  content: string
  content_details: CalendarQueueEventDetail | null
  source: string
  mindsweep_confidence: string | null
  created_at: string
}

function useCalendarQueueItems(familyId: string | undefined) {
  return useQuery({
    queryKey: ['studio-queue-calendar', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('studio_queue')
        .select('id, family_id, owner_id, content, content_details, source, mindsweep_confidence, created_at')
        .eq('family_id', familyId)
        .eq('destination', 'calendar')
        .is('processed_at', null)
        .is('dismissed_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as CalendarQueueItem[]
    },
    enabled: !!familyId,
  })
}

// ── Formatting helpers ──

function formatEventDate(event: CalendarEvent): string {
  const d = new Date(event.event_date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (event.is_all_day || !event.start_time) return `${dateStr} \u00b7 All day`

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h % 12 || 12
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`
  }

  const start = fmtTime(event.start_time)
  const end = event.end_time ? ` \u2013 ${fmtTime(event.end_time)}` : ''
  return `${dateStr} \u00b7 ${start}${end}`
}

function formatQueueEventDate(parsed: CalendarQueueEventDetail['parsed_event']): string {
  const d = new Date(parsed.event_date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (parsed.is_all_day || !parsed.start_time) return `${dateStr} \u00b7 All day`

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h % 12 || 12
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`
  }

  const start = fmtTime(parsed.start_time)
  const end = parsed.end_time ? ` \u2013 ${fmtTime(parsed.end_time)}` : ''

  if (parsed.end_date && parsed.end_date !== parsed.event_date) {
    const endD = new Date(parsed.end_date + 'T00:00:00')
    const endDateStr = endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${dateStr} \u2013 ${endDateStr} \u00b7 ${start}${end}`
  }

  return `${dateStr} \u00b7 ${start}${end}`
}

// ── Component ──

export function CalendarTab() {
  const { data: pendingEvents = [], isLoading: loadingEvents } = usePendingEvents()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const { data: currentMember } = useFamilyMember()
  const { data: queueItems = [], isLoading: loadingQueue } = useCalendarQueueItems(family?.id)
  const queryClient = useQueryClient()

  const [editEvent, setEditEvent] = useState<(CalendarEvent & { event_attendees?: EventAttendee[] }) | null>(null)
  const [editQueueEvent, setEditQueueEvent] = useState<CalendarQueueItem | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const isLoading = loadingEvents || loadingQueue
  const totalItems = pendingEvents.length + queueItems.length

  const getMemberName = (memberId: string) => {
    const m = familyMembers.find((fm) => fm.id === memberId)
    return m?.display_name ?? 'Family member'
  }

  const getMemberColor = (memberId: string) => {
    const m = familyMembers.find((fm) => fm.id === memberId)
    return m?.assigned_color ?? m?.member_color ?? undefined
  }

  // ── Mutations for pending calendar_events ──

  const approveMutation = useMutation({
    mutationFn: async (event: CalendarEvent & { event_attendees?: EventAttendee[] }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: currentMember?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', event.id)
      if (error) throw error

      // Notify the event creator that their event was approved
      if (event.created_by && event.created_by !== currentMember?.id && family?.id) {
        createNotification({
          family_id: family.id,
          recipient_member_id: event.created_by,
          notification_type: 'calendar_approved',
          category: 'calendar',
          title: `"${event.title}" approved`,
          body: `Your calendar event has been approved.`,
          source_type: 'calendar_events',
          source_reference_id: event.id,
          action_url: '/calendar',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ event, note }: { event: CalendarEvent & { event_attendees?: EventAttendee[] }; note: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'rejected',
          rejection_note: note || null,
        })
        .eq('id', event.id)
      if (error) throw error

      // Notify the event creator that their event was rejected
      if (event.created_by && event.created_by !== currentMember?.id && family?.id) {
        createNotification({
          family_id: family.id,
          recipient_member_id: event.created_by,
          notification_type: 'calendar_rejected',
          category: 'calendar',
          title: `"${event.title}" not approved`,
          body: note ? `Reason: ${note}` : 'Your calendar event was not approved.',
          source_type: 'calendar_events',
          source_reference_id: event.id,
          action_url: '/calendar',
        })
      }
    },
    onSuccess: () => {
      setRejectingId(null)
      setRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
    },
  })

  const bulkApproveMutation = useMutation({
    mutationFn: async (events: (CalendarEvent & { event_attendees?: EventAttendee[] })[]) => {
      const eventIds = events.map((e) => e.id)
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: currentMember?.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', eventIds)
      if (error) throw error

      // Notify each unique event creator
      if (family?.id && currentMember?.id) {
        const uniqueCreators = [...new Set(events.map((e) => e.created_by).filter((id) => id && id !== currentMember.id))]
        for (const creatorId of uniqueCreators) {
          const creatorEvents = events.filter((e) => e.created_by === creatorId)
          createNotification({
            family_id: family.id,
            recipient_member_id: creatorId,
            notification_type: 'calendar_approved',
            category: 'calendar',
            title: creatorEvents.length === 1
              ? `"${creatorEvents[0].title}" approved`
              : `${creatorEvents.length} events approved`,
            body: 'Your calendar events have been approved.',
            action_url: '/calendar',
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
    },
  })

  // ���─ Mutations for studio_queue calendar items ──

  const approveQueueItem = useMutation({
    mutationFn: async (item: CalendarQueueItem) => {
      const parsed = item.content_details?.parsed_event
      if (!parsed || !currentMember) throw new Error('Missing event data')

      // Create the calendar event — select back the new id so we can
      // attach event_attendees rows for any detected attendees.
      const { data: inserted, error: eventErr } = await supabase
        .from('calendar_events')
        .insert({
          family_id: item.family_id,
          created_by: currentMember.id,
          title: parsed.title,
          event_date: parsed.event_date,
          start_time: parsed.start_time,
          end_time: parsed.end_time,
          end_date: parsed.end_date,
          is_all_day: parsed.is_all_day,
          location: parsed.location,
          description: parsed.description,
          recurrence_rule: parsed.recurrence_rule ? mapRRuleToSimple(parsed.recurrence_rule) : null,
          recurrence_details: parsed.recurrence_rule ? { rrule: parsed.recurrence_rule } : null,
          reminder_minutes: parsed.reminder_minutes,
          status: 'approved',
          approved_by: currentMember.id,
          approved_at: new Date().toISOString(),
          source_type: item.content_details?.source_type === 'ics_import' ? 'ics_import' : 'review_route',
        })
        .select('id')
        .single()
      if (eventErr) throw eventErr
      if (!inserted?.id) throw new Error('calendar_events insert returned no id')

      // Persist detected attendees (mindsweep_detected path only).
      // Driver (if any) gets attendee_role='driving', everyone else 'attending'.
      const attendeeIds = parsed.attendee_member_ids ?? []
      if (attendeeIds.length > 0) {
        const driverId = parsed.driver_member_id ?? null
        const attendeeRows = attendeeIds.map((memberId) => ({
          event_id: inserted.id,
          family_member_id: memberId,
          attendee_role: memberId === driverId ? 'driving' : 'attending',
          response_status: 'pending' as const,
        }))
        const { error: attErr } = await supabase.from('event_attendees').insert(attendeeRows)
        if (attErr) throw attErr
      }

      // Mark queue item processed
      const { error: queueErr } = await supabase
        .from('studio_queue')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', item.id)
      if (queueErr) throw queueErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge'] })
    },
  })

  const dismissQueueItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('studio_queue')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge'] })
    },
  })

  const bulkApproveQueue = useMutation({
    mutationFn: async (items: CalendarQueueItem[]) => {
      for (const item of items) {
        const parsed = item.content_details?.parsed_event
        if (!parsed || !currentMember) continue

        const { data: inserted, error: eventErr } = await supabase
          .from('calendar_events')
          .insert({
            family_id: item.family_id,
            created_by: currentMember.id,
            title: parsed.title,
            event_date: parsed.event_date,
            start_time: parsed.start_time,
            end_time: parsed.end_time,
            end_date: parsed.end_date,
            is_all_day: parsed.is_all_day,
            location: parsed.location,
            description: parsed.description,
            recurrence_rule: parsed.recurrence_rule ? mapRRuleToSimple(parsed.recurrence_rule) : null,
            recurrence_details: parsed.recurrence_rule ? { rrule: parsed.recurrence_rule } : null,
            reminder_minutes: parsed.reminder_minutes,
            status: 'approved',
            approved_by: currentMember.id,
            approved_at: new Date().toISOString(),
            source_type: item.content_details?.source_type === 'ics_import' ? 'ics_import' : 'review_route',
          })
          .select('id')
          .single()
        if (eventErr || !inserted?.id) continue

        const attendeeIds = parsed.attendee_member_ids ?? []
        if (attendeeIds.length > 0) {
          const driverId = parsed.driver_member_id ?? null
          const attendeeRows = attendeeIds.map((memberId) => ({
            event_id: inserted.id,
            family_member_id: memberId,
            attendee_role: memberId === driverId ? 'driving' : 'attending',
            response_status: 'pending' as const,
          }))
          await supabase.from('event_attendees').insert(attendeeRows)
        }
      }

      // Mark all processed
      const ids = items.map(i => i.id)
      await supabase
        .from('studio_queue')
        .update({ processed_at: new Date().toISOString() })
        .in('id', ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge'] })
    },
  })

  // Build a pre-filled CalendarEvent from queue item for EventCreationModal.
  // For mindsweep_detected items, pre-populate event_attendees from the
  // detected attendee_member_ids and mark the driver (if any) with
  // attendee_role='driving'. EventCreationModal reads this array into its
  // attendees Map so everything shows up pre-selected when the modal opens.
  function queueItemToEditEvent(item: CalendarQueueItem): CalendarEvent & { event_attendees?: EventAttendee[] } {
    const parsed = item.content_details?.parsed_event
    const attendeeIds = parsed?.attendee_member_ids ?? []
    const driverId = parsed?.driver_member_id ?? null
    const preAttendees: EventAttendee[] = attendeeIds.map((memberId) => ({
      id: `preview-${memberId}`,
      event_id: '',
      family_member_id: memberId,
      attendee_role: memberId === driverId ? 'driving' : 'attending',
      response_status: 'pending',
      created_at: new Date().toISOString(),
    }))
    return ({
      id: '', // empty = create mode in EventCreationModal
      family_id: item.family_id,
      created_by: currentMember?.id ?? '',
      title: parsed?.title ?? item.content,
      event_date: parsed?.event_date ?? '',
      start_time: parsed?.start_time ?? null,
      end_time: parsed?.end_time ?? null,
      end_date: parsed?.end_date ?? null,
      is_all_day: parsed?.is_all_day ?? false,
      location: parsed?.location ?? null,
      description: parsed?.description ?? null,
      recurrence_rule: parsed?.recurrence_rule ? mapRRuleToSimple(parsed.recurrence_rule) : null,
      recurrence_details: parsed?.recurrence_rule ? { rrule: parsed.recurrence_rule } : null,
      reminder_minutes: parsed?.reminder_minutes ?? null,
      status: 'approved',
      source_type: item.content_details?.source_type === 'ics_import' ? 'ics_import' : 'review_route',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Fields we don't have from .ics
      event_type: null,
      category_id: null,
      priority: null,
      color: null,
      icon_override: null,
      source_reference_id: null,
      source_image_url: null,
      external_id: null,
      external_source: null,
      last_synced_at: null,
      recurrence_parent_id: null,
      approved_by: null,
      approved_at: null,
      rejection_note: null,
      transportation_needed: false,
      transportation_notes: null,
      items_to_bring: null,
      leave_by_time: null,
      notes: null,
      is_included_in_ai: true,
      show_on_hub: false,
      acted_by: null,
      event_attendees: preAttendees,
    }) as unknown as CalendarEvent & { event_attendees?: EventAttendee[] }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <EmptyState
          icon={<CalendarCheck size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          title="No events waiting for approval."
          description="When your kids add events or you import a calendar, they'll appear here for your review."
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '0.75rem' }} className="space-y-3">
      {/* ── Imported calendar items from queue ── */}
      {queueItems.length > 0 && (
        <>
          {pendingEvents.length > 0 && (
            <div className="flex items-center gap-2 pb-1">
              <FileUp size={12} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Imported events ({queueItems.length})
              </span>
            </div>
          )}

          {queueItems.map((item) => {
            const parsed = item.content_details?.parsed_event
            const sourceLabel = item.content_details?.source_type === 'ics_import' ? 'Calendar import' : 'MindSweep'

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '0.75rem' }} className="space-y-2">
                  {/* Title row */}
                  <div className="flex items-start gap-2">
                    <Calendar size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600,
                        fontSize: 'var(--font-size-base, 1rem)',
                        color: 'var(--color-text-heading)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}>
                        {parsed?.title ?? item.content}
                      </p>
                      {parsed && (
                        <p style={{
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          color: 'var(--color-text-secondary)',
                          margin: '2px 0 0 0',
                        }}>
                          {formatQueueEventDate(parsed)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                    {parsed?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {parsed.location}
                      </span>
                    )}
                    {parsed?.recurrence_rule && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Recurring
                      </span>
                    )}
                    {parsed?.driver_member_id && (
                      <span className="flex items-center gap-1" title="Detected driver">
                        <Car size={12} />
                        {getMemberName(parsed.driver_member_id)} driving
                      </span>
                    )}
                  </div>

                  {/* Detected attendees — pre-selected member pills */}
                  {parsed?.attendee_member_ids && parsed.attendee_member_ids.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <User size={12} style={{ color: 'var(--color-text-secondary)' }} />
                      {parsed.attendee_member_ids.map((memberId) => {
                        const name = getMemberName(memberId)
                        const color = getMemberColor(memberId)
                        const isDriver = memberId === parsed.driver_member_id
                        return (
                          <span
                            key={memberId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: color
                                ? `color-mix(in srgb, ${color} 18%, var(--color-bg-card))`
                                : 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
                              color: color ?? 'var(--color-btn-primary-bg)',
                              border: `1px solid ${color ?? 'var(--color-border)'}`,
                            }}
                          >
                            {isDriver && <Car size={10} />}
                            {name}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Source badge */}
                  <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                    {item.content_details?.source_type === 'ics_import'
                      ? <FileUp size={12} />
                      : <Wand2 size={12} />
                    }
                    <span>{sourceLabel}</span>
                    {item.mindsweep_confidence && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: item.mindsweep_confidence === 'high'
                            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                            : 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                          color: item.mindsweep_confidence === 'high'
                            ? 'var(--color-btn-primary-bg)'
                            : 'var(--color-accent)',
                        }}
                      >
                        {item.mindsweep_confidence}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  {parsed?.description && (
                    <p className="line-clamp-2" style={{
                      fontSize: 'var(--font-size-xs, 0.75rem)',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}>
                      {parsed.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => approveQueueItem.mutate(item)}
                      disabled={approveQueueItem.isPending || !parsed}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
                        color: 'var(--color-btn-primary-bg)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditQueueEvent(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card))',
                        color: 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text-heading))',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={14} />
                      Edit & Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissQueueItem.mutate(item.id)}
                      disabled={dismissQueueItem.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-error) 8%, var(--color-bg-card))',
                        color: 'var(--color-error)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── Section divider ── */}
      {queueItems.length > 0 && pendingEvents.length > 0 && (
        <div className="flex items-center gap-2 pb-1 pt-2">
          <User size={12} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Family member submissions ({pendingEvents.length})
          </span>
        </div>
      )}

      {/* ── Pending calendar_events from family members ── */}
      {pendingEvents.map((event) => {
        const isRejecting = rejectingId === event.id
        const creatorName = getMemberName(event.created_by)
        const creatorColor = getMemberColor(event.created_by)

        return (
          <div
            key={event.id}
            style={{
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.75rem' }} className="space-y-2">
              {/* Title row */}
              <div className="flex items-start gap-2">
                <Calendar size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 600,
                    fontSize: 'var(--font-size-base, 1rem)',
                    color: 'var(--color-text-heading)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}>
                    {event.title}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-xs, 0.75rem)',
                    color: 'var(--color-text-secondary)',
                    margin: '2px 0 0 0',
                  }}>
                    {formatEventDate(event)}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {event.location}
                  </span>
                )}
                {event.transportation_needed && (
                  <span className="flex items-center gap-1">
                    <Car size={12} />
                    Needs ride
                  </span>
                )}
              </div>

              {/* Submitted by */}
              <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                <User size={12} />
                <span>Submitted by</span>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: creatorColor
                      ? `color-mix(in srgb, ${creatorColor} 15%, var(--color-bg-card))`
                      : 'var(--color-bg-secondary)',
                    color: creatorColor ?? 'var(--color-text-primary)',
                  }}
                >
                  {creatorName}
                </span>
              </div>

              {/* Reject note input */}
              {isRejecting && (
                <div className="space-y-2">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Optional reason for declining..."
                    rows={2}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm, 0.875rem)',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setRejectingId(null); setRejectNote('') }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-xs, 0.75rem)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate({ event, note: rejectNote })}
                      disabled={rejectMutation.isPending}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        border: 'none',
                        backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, var(--color-bg-card))',
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-xs, 0.75rem)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isRejecting && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate(event)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
                      color: 'var(--color-btn-primary-bg)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditEvent(event)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card))',
                      color: 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text-heading))',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={14} />
                    Edit & Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingId(event.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-error) 8%, var(--color-bg-card))',
                      color: 'var(--color-error)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Bulk approve */}
      {totalItems > 1 && (
        <button
          type="button"
          onClick={() => {
            if (pendingEvents.length > 0) {
              bulkApproveMutation.mutate(pendingEvents)
            }
            if (queueItems.length > 0) {
              bulkApproveQueue.mutate(queueItems)
            }
          }}
          disabled={bulkApproveMutation.isPending || bulkApproveQueue.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Check size={16} />
          Approve all ({totalItems})
        </button>
      )}

      {/* Edit & Approve modal for pending events */}
      {editEvent && (
        <EventCreationModal
          isOpen={true}
          onClose={() => {
            setEditEvent(null)
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
          }}
          initialEvent={editEvent}
        />
      )}

      {/* Edit & Approve modal for queue items (create new event pre-filled).
          onCreated fires ONLY on successful save — that's when we mark the
          queue item processed. onClose fires on save AND cancel, so it must
          NOT mark processed (that would destroy the queue item if user
          cancels). */}
      {editQueueEvent && (
        <EventCreationModal
          isOpen={true}
          initialEvent={queueItemToEditEvent(editQueueEvent)}
          onCreated={async () => {
            // Save succeeded — mark the queue item as processed and refresh.
            await supabase
              .from('studio_queue')
              .update({ processed_at: new Date().toISOString() })
              .eq('id', editQueueEvent.id)

            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.invalidateQueries({ queryKey: ['studio-queue-calendar'] })
            queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
            queryClient.invalidateQueries({ queryKey: ['studio-queue-count'] })
          }}
          onClose={() => {
            // Fires on save AND cancel. Only closes the modal — the queue
            // item stays pending on cancel so the user can retry.
            setEditQueueEvent(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Map an RRULE string to a simple recurrence_rule enum value.
 * e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR" → "weekly"
 */
function mapRRuleToSimple(rrule: string): string {
  const freq = rrule.match(/FREQ=(\w+)/)?.[1]?.toLowerCase()
  switch (freq) {
    case 'daily': return 'daily'
    case 'weekly': return 'weekly'
    case 'monthly': return 'monthly'
    case 'yearly': return 'yearly'
    default: return 'custom'
  }
}
