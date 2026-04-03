/**
 * CalendarTab (PRD-17 Screen 2)
 *
 * Renders pending calendar events (status='pending_approval') with:
 * - Approve / Edit & Approve / Reject actions per card
 * - Bulk "Approve all" when multiple pending
 * - Opens EventCreationModal for "Edit & Approve"
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState } from 'react'
import { CalendarCheck, Calendar, MapPin, Car, User, Check, Pencil, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { usePendingEvents } from '@/hooks/useCalendarEvents'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { EventCreationModal } from '@/components/calendar/EventCreationModal'
import type { CalendarEvent, EventAttendee } from '@/types/calendar'

function formatEventDate(event: CalendarEvent): string {
  const d = new Date(event.event_date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (event.is_all_day || !event.start_time) return `${dateStr} · All day`

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h % 12 || 12
    return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`
  }

  const start = fmtTime(event.start_time)
  const end = event.end_time ? ` – ${fmtTime(event.end_time)}` : ''
  return `${dateStr} · ${start}${end}`
}

export function CalendarTab() {
  const { data: pendingEvents = [], isLoading } = usePendingEvents()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const { data: currentMember } = useFamilyMember()
  const queryClient = useQueryClient()

  const [editEvent, setEditEvent] = useState<(CalendarEvent & { event_attendees?: EventAttendee[] }) | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const getMemberName = (memberId: string) => {
    const m = familyMembers.find((fm) => fm.id === memberId)
    return m?.display_name ?? 'Family member'
  }

  const getMemberColor = (memberId: string) => {
    const m = familyMembers.find((fm) => fm.id === memberId)
    return m?.assigned_color ?? m?.member_color ?? undefined
  }

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

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
          Loading...
        </p>
      </div>
    )
  }

  if (pendingEvents.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <EmptyState
          icon={<CalendarCheck size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          title="No events waiting for approval."
          description="When your kids add events, they'll appear here for your review."
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '0.75rem' }} className="space-y-3">
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
      {pendingEvents.length > 1 && (
        <button
          type="button"
          onClick={() => bulkApproveMutation.mutate(pendingEvents.map((e) => e.id))}
          disabled={bulkApproveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Check size={16} />
          Approve all ({pendingEvents.length})
        </button>
      )}

      {/* Edit & Approve modal */}
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
    </div>
  )
}
