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
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: currentMember?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ eventId, note }: { eventId: string; note: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'rejected',
          rejection_note: note || null,
        })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      setRejectingId(null)
      setRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
    },
  })

  const bulkApproveMutation = useMutation({
    mutationFn: async (eventIds: string[]) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          status: 'approved',
          approved_by: currentMember?.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', eventIds)
      if (error) throw error
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

      // Create the calendar event
      const { error: eventErr } = await supabase.from('calendar_events').insert({
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
      if (eventErr) throw eventErr

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

        await supabase.from('calendar_events').insert({
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

  // Build a pre-filled CalendarEvent from queue item for EventCreationModal
  function queueItemToEditEvent(item: CalendarQueueItem): CalendarEvent & { event_attendees?: EventAttendee[] } {
    const parsed = item.content_details?.parsed_event
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
      event_attendees: [],
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
                  </div>

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
                      onClick={() => rejectMutation.mutate({ eventId: event.id, note: rejectNote })}
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
                    onClick={() => approveMutation.mutate(event.id)}
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
              bulkApproveMutation.mutate(pendingEvents.map((e) => e.id))
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

      {/* Edit & Approve modal for queue items (create new event pre-filled) */}
      {editQueueEvent && (
        <EventCreationModal
          isOpen={true}
          onClose={async () => {
            // Mark the queue item as processed after the modal creates the event
            await supabase
              .from('studio_queue')
              .update({ processed_at: new Date().toISOString() })
              .eq('id', editQueueEvent.id)

            setEditQueueEvent(null)
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.invalidateQueries({ queryKey: ['studio-queue-calendar'] })
            queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
            queryClient.invalidateQueries({ queryKey: ['queue-badge-calendar'] })
            queryClient.invalidateQueries({ queryKey: ['queue-badge'] })
          }}
          initialEvent={queueItemToEditEvent(editQueueEvent)}
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
