/**
 * DateDetailModal — transient modal showing events for a specific date.
 *
 * Opened when clicking any date on any calendar view.
 * Uses ModalV2 with type="transient", size "md".
 * Shows events grouped by type, approve/reject for mom, task due dates.
 *
 * PRD-14B Screen 3 + spec
 */

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, Clock, AlertCircle, Plus } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useEventsForDate, useTasksDueInRange, useApproveEvent, useRejectEvent, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { CalendarEvent, EventAttendee, TaskDueDate } from '@/types/calendar'

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(time: string | null): string {
  if (!time) return 'All Day'
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

interface DateDetailModalProps {
  date: Date
  isOpen: boolean
  onClose: () => void
  onDateChange: (date: Date) => void
  onAddEvent?: (date: Date) => void
}

export function DateDetailModal({ date, isOpen, onClose, onDateChange, onAddEvent }: DateDetailModalProps) {
  const { data: events } = useEventsForDate(date)
  const { data: tasksDue } = useTasksDueInRange(date, date)
  const { data: member } = useFamilyMember()
  const { data: settings } = useCalendarSettings()
  const approveEvent = useApproveEvent()
  const rejectEvent = useRejectEvent()
  const [showJumpPicker, setShowJumpPicker] = useState(false)

  const isMom = member?.role === 'primary_parent'

  // Group events by type
  const calendarEvents = (events ?? []).filter(e => e.event_type === 'event' || e.event_type === 'appointment' || e.event_type === 'activity')
  const deadlines = (events ?? []).filter(e => e.event_type === 'deadline')
  const reminders = (events ?? []).filter(e => e.event_type === 'reminder')
  const tasks = tasksDue ?? []

  const hasContent = calendarEvents.length > 0 || deadlines.length > 0 || reminders.length > 0 || tasks.length > 0

  const handleApprove = useCallback(async (eventId: string) => {
    await approveEvent.mutateAsync(eventId)
  }, [approveEvent])

  const handleReject = useCallback(async (eventId: string) => {
    await rejectEvent.mutateAsync({ eventId })
  }, [rejectEvent])

  return (
    <ModalV2
      id="date-detail"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={formatDate(date)}
    >
      <div style={{ padding: '0' }}>
        {/* Navigation header */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => onDateChange(addDays(date, -1))}
            className="flex items-center justify-center rounded-full"
            style={{ width: '28px', height: '28px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
            aria-label="Previous day"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowJumpPicker(!showJumpPicker)}
              className="flex items-center gap-1 text-xs font-medium rounded px-2 py-1"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
            >
              <CalendarIcon size={12} />
              Jump to date
            </button>
            {showJumpPicker && (
              <div className="absolute top-full mt-1 left-1/2 z-50" style={{ transform: 'translateX(-50%)' }}>
                <MiniCalendarPicker
                  selectedDate={date}
                  onDateSelect={(d) => {
                    onDateChange(d)
                    setShowJumpPicker(false)
                  }}
                  weekStartDay={(settings?.week_start_day ?? 0) as 0 | 1}
                  showTodayButton
                />
              </div>
            )}
          </div>

          <button
            onClick={() => onDateChange(addDays(date, 1))}
            className="flex items-center justify-center rounded-full"
            style={{ width: '28px', height: '28px', background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
            aria-label="Next day"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {!hasContent && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Clock size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No events scheduled</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                This day is free. Add an event to get started.
              </p>
            </div>
          )}

          {/* Tasks Due */}
          {tasks.length > 0 && (
            <EventSection title="Tasks Due" icon={CheckSquare}>
              {tasks.map(t => (
                <TaskDueDateCard key={t.id} task={t} />
              ))}
            </EventSection>
          )}

          {/* Calendar Events */}
          {calendarEvents.length > 0 && (
            <EventSection title="Events" icon={CalendarIcon}>
              {calendarEvents.map(ev => (
                <EventCard key={ev.id} event={ev} isMom={isMom} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </EventSection>
          )}

          {/* Deadlines */}
          {deadlines.length > 0 && (
            <EventSection title="Deadlines" icon={AlertCircle}>
              {deadlines.map(ev => (
                <EventCard key={ev.id} event={ev} isMom={isMom} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </EventSection>
          )}

          {/* Reminders */}
          {reminders.length > 0 && (
            <EventSection title="Reminders" icon={Clock}>
              {reminders.map(ev => (
                <EventCard key={ev.id} event={ev} isMom={isMom} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </EventSection>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-center px-4 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => onAddEvent?.(date)}
            className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-4 py-2"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>
    </ModalV2>
  )
}

// ─── Sub-Components ──────────────────────────────────────────

function EventSection({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size: number }>; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function EventCard({
  event,
  isMom,
  onApprove,
  onReject,
}: {
  event: CalendarEvent & { event_attendees: EventAttendee[] }
  isMom: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const isPending = event.status === 'pending_approval'

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: isPending ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {event.is_all_day ? 'All Day' : `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ''}`}
            </span>
            {isPending && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)', color: 'var(--color-accent)' }}
              >
                pending
              </span>
            )}
          </div>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {event.title}
          </p>
          {event.location && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {event.location}
            </p>
          )}
        </div>
        {event.priority && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
            style={{
              backgroundColor: event.priority === 'high'
                ? 'color-mix(in srgb, var(--color-danger, #E53E3E) 15%, transparent)'
                : 'var(--color-bg-card)',
              color: event.priority === 'high'
                ? 'var(--color-danger, #E53E3E)'
                : 'var(--color-text-secondary)',
            }}
          >
            {event.priority}
          </span>
        )}
      </div>

      {/* Approve/Reject buttons for pending events — mom only */}
      {isPending && isMom && (
        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => onApprove(event.id)}
            className="text-xs font-medium px-3 py-1 rounded"
            style={{ background: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
          >
            Approve
          </button>
          <button
            onClick={() => onReject(event.id)}
            className="text-xs font-medium px-3 py-1 rounded"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

function TaskDueDateCard({ task }: { task: TaskDueDate }) {
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-2"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        opacity: 0.85,
      }}
    >
      <CheckSquare size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {task.status === 'completed' ? 'Completed' : 'Due'}
          {task.priority && ` · ${task.priority}`}
        </p>
      </div>
    </div>
  )
}
