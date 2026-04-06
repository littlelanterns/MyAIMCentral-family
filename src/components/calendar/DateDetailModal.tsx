/**
 * DateDetailModal — transient modal showing events for a specific date.
 *
 * Opened when clicking any date on any calendar view.
 * Uses ModalV2 with type="transient", size "md".
 * Shows events grouped by type, approve/reject for mom, task due dates.
 *
 * PRD-14B Screen 3 + spec
 *
 * Session 4 additions: Edit/Delete buttons, items-to-bring checklist,
 * leave-by time, attendees, recurrence info, rejection note input.
 */

import { useState, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, Clock,
  Plus, Pencil, Trash2, Users, Repeat, MapPin, Package, Car, Layers,
} from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import {
  useEventsForDate, useTasksDueInRange, useApproveEvent,
  useRejectEvent, useDeleteEvent, useCalendarSettings, useUpdateEvent,
  useOptionGroupEvents, useConfirmOption, useDismissOption, useDismissRemainingOptions,
} from '@/hooks/useCalendarEvents'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { CalendarEvent, EventAttendee, TaskDueDate, ItemToBring } from '@/types/calendar'

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

function describeRecurrence(rule: string | null): string | null {
  if (!rule || rule === 'none') return null
  switch (rule) {
    case 'daily': return 'Repeats daily'
    case 'weekdays': return 'Repeats on weekdays'
    case 'weekly': return 'Repeats weekly'
    case 'biweekly': return 'Repeats every 2 weeks'
    case 'monthly': return 'Repeats monthly'
    case 'yearly': return 'Repeats yearly'
    case 'custom': return 'Custom schedule'
    default: return null
  }
}

interface DateDetailModalProps {
  date: Date
  isOpen: boolean
  onClose: () => void
  onDateChange: (date: Date) => void
  onAddEvent?: (date: Date) => void
  onEditEvent?: (event: CalendarEvent) => void
}

export function DateDetailModal({ date, isOpen, onClose, onDateChange, onAddEvent, onEditEvent }: DateDetailModalProps) {
  const { data: events } = useEventsForDate(date)
  const { data: tasksDue } = useTasksDueInRange(date, date)
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: settings } = useCalendarSettings()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const approveEvent = useApproveEvent()
  const rejectEvent = useRejectEvent()
  const deleteEvent = useDeleteEvent()
  const updateEvent = useUpdateEvent()
  const [showJumpPicker, setShowJumpPicker] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  const isMom = member?.role === 'primary_parent'
  const driveTime = settings?.default_drive_time_minutes ?? 30

  // Build member name map for attendees display
  const memberNameMap = new Map<string, string>()
  for (const m of familyMembers ?? []) {
    memberNameMap.set(m.id, m.display_name)
  }

  // Group events
  const allEvents = events ?? []
  const tasks = tasksDue ?? []
  const hasContent = allEvents.length > 0 || tasks.length > 0

  const handleApprove = useCallback(async (eventId: string) => {
    await approveEvent.mutateAsync(eventId)
  }, [approveEvent])

  const handleReject = useCallback(async (eventId: string, note: string) => {
    await rejectEvent.mutateAsync({ eventId, note: note || undefined })
    setRejectingId(null)
    setRejectionNote('')
  }, [rejectEvent])

  const handleDelete = useCallback(async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId)
    setConfirmDeleteId(null)
  }, [deleteEvent])

  const handleToggleItem = useCallback((event: CalendarEvent & { event_attendees: EventAttendee[] }, idx: number) => {
    const currentItems: ItemToBring[] = event.items_to_bring ?? []
    const updated = currentItems.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    )
    // Optimistic: the query will re-fetch on invalidation
    updateEvent.mutate({ eventId: event.id, updates: { items_to_bring: updated } })
  }, [updateEvent])

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
        <div className="px-4 py-3 space-y-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
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

          {/* All Calendar Events */}
          {allEvents.length > 0 && (
            <EventSection title="Events" icon={CalendarIcon}>
              {allEvents.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  isMom={isMom}
                  driveTime={driveTime}
                  memberNameMap={memberNameMap}
                  onApprove={handleApprove}
                  onReject={(id) => { setRejectingId(id); setRejectionNote('') }}
                  onEdit={onEditEvent ? () => onEditEvent(ev) : undefined}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  onToggleItem={(idx) => handleToggleItem(ev, idx)}
                  isCreator={ev.created_by === member?.id}
                />
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

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 85%, transparent)' }}>
          <div className="rounded-xl p-5 mx-4 max-w-sm space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Delete this event?
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="text-xs font-medium px-3 py-1.5 rounded"
                style={{ background: 'var(--color-danger, #E53E3E)', color: 'var(--color-bg-card, #fff)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection note overlay */}
      {rejectingId && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 85%, transparent)' }}>
          <div className="rounded-xl p-5 mx-4 max-w-sm space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Reject this event?
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Optional note for why it's being rejected..."
              className="w-full rounded-lg text-sm p-2 outline-none resize-none"
              rows={3}
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setRejectingId(null); setRejectionNote('') }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => handleReject(rejectingId, rejectionNote)}>Reject</Button>
            </div>
          </div>
        </div>
      )}
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
  driveTime,
  memberNameMap,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onToggleItem,
  isCreator,
}: {
  event: CalendarEvent & { event_attendees: EventAttendee[] }
  isMom: boolean
  driveTime: number
  memberNameMap: Map<string, string>
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit?: () => void
  onDelete: (id: string) => void
  onToggleItem: (idx: number) => void
  isCreator: boolean
}) {
  const isPending = event.status === 'pending_approval'
  const isPenciledIn = event.status === 'penciled_in'
  const isTentative = isPending || isPenciledIn
  const canEdit = isMom || isCreator
  const attendees = event.event_attendees ?? []
  const recurrenceText = describeRecurrence(event.recurrence_rule)

  // Calculate leave-by time
  let leaveByDisplay: string | null = null
  if (event.transportation_needed && event.start_time && driveTime > 0) {
    if (event.leave_by_time) {
      leaveByDisplay = `Leave by ${formatTime(event.leave_by_time)}`
    } else {
      // Calculate from start_time - drive_time
      const [h, m] = event.start_time.split(':').map(Number)
      const totalMin = h * 60 + m - driveTime
      if (totalMin >= 0) {
        const lh = Math.floor(totalMin / 60)
        const lm = totalMin % 60
        leaveByDisplay = `Leave by ${formatTime(`${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}:00`)}`
      }
    }
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: isTentative ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
        opacity: isTentative ? 0.8 : 1,
      }}
    >
      {/* Header row: time + title + action buttons */}
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
            {isPenciledIn && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)', color: 'var(--color-btn-primary-bg)' }}
              >
                tentative
              </span>
            )}
          </div>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {event.title}
          </p>
        </div>

        {/* Edit / Delete buttons */}
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 rounded"
                style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
                aria-label="Edit event"
              >
                <Pencil size={13} />
              </button>
            )}
            <button
              onClick={() => onDelete(event.id)}
              className="p-1 rounded"
              style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
              aria-label="Delete event"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={11} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{event.location}</p>
        </div>
      )}

      {/* Leave-by time */}
      {leaveByDisplay && (
        <div className="flex items-center gap-1 mt-1">
          <Car size={11} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <p className="text-xs font-medium" style={{ color: 'var(--color-accent, var(--color-text-secondary))' }}>{leaveByDisplay}</p>
          {event.transportation_notes && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}> · {event.transportation_notes}</span>
          )}
        </div>
      )}

      {/* Recurrence info */}
      {recurrenceText && (
        <div className="flex items-center gap-1 mt-1">
          <Repeat size={11} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{recurrenceText}</p>
        </div>
      )}

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="flex items-start gap-1 mt-1.5">
          <Users size={11} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '2px' }} />
          <div className="flex flex-wrap gap-1">
            {attendees.map(a => (
              <span
                key={a.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border)' }}
              >
                {memberNameMap.get(a.family_member_id) ?? 'Unknown'}
                {a.attendee_role && a.attendee_role !== 'attending' && (
                  <span style={{ opacity: 0.7 }}> · {a.attendee_role}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items to bring */}
      {event.items_to_bring && event.items_to_bring.length > 0 && (
        <div className="mt-2 pt-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Package size={11} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
              Items to bring
            </span>
          </div>
          <div className="space-y-0.5">
            {event.items_to_bring.map((item: ItemToBring, idx: number) => (
              <label key={idx} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggleItem(idx)}
                  className="rounded"
                  style={{ accentColor: 'var(--color-btn-primary-bg)', width: '12px', height: '12px', cursor: 'pointer' }}
                />
                <span style={{ textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.5 : 1 }}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

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

      {/* Option group view for penciled-in events with siblings */}
      {isPenciledIn && isMom && event.option_group_id && (
        <OptionGroupActions eventId={event.id} optionGroupId={event.option_group_id} groupTitle={event.option_group_title} />
      )}

      {/* Confirm/Dismiss for penciled-in events WITHOUT option group */}
      {isPenciledIn && isMom && !event.option_group_id && (
        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => onApprove(event.id)}
            className="text-xs font-medium px-3 py-1 rounded"
            style={{ background: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
          >
            Confirm
          </button>
          <button
            onClick={() => onReject(event.id)}
            className="text-xs font-medium px-3 py-1 rounded"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rejection note display */}
      {event.status === 'rejected' && event.rejection_note && (
        <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
          <span className="font-medium">Rejected:</span> {event.rejection_note}
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

/** Shows all sibling dates in an option group with Confirm/Dismiss per date.
 *  Mom can confirm multiple dates (e.g. attending several performances of a play). */
function OptionGroupActions({ eventId, optionGroupId, groupTitle }: {
  eventId: string
  optionGroupId: string
  groupTitle: string | null
}) {
  const { data: siblings = [] } = useOptionGroupEvents(optionGroupId)
  const confirmOption = useConfirmOption()
  const dismissOption = useDismissOption()
  const dismissRemaining = useDismissRemainingOptions()

  if (siblings.length <= 1) return null

  const confirmedCount = siblings.filter(s => s.status === 'approved').length
  const penciledCount = siblings.filter(s => s.status === 'penciled_in').length

  function formatOptionDate(dateStr: string, startTime: string | null): string {
    const d = new Date(dateStr + 'T12:00:00')
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hour = h % 12 || 12
      return `${dayStr} at ${hour}:${String(m).padStart(2, '0')} ${ampm}`
    }
    return dayStr
  }

  const busy = confirmOption.isPending || dismissOption.isPending || dismissRemaining.isPending

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Layers size={12} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-btn-primary-bg)' }}>
          {groupTitle || 'Date options'}
        </span>
      </div>
      <p className="text-[10px] mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {confirmedCount > 0
          ? `${confirmedCount} confirmed, ${penciledCount} still tentative`
          : `${penciledCount} tentative dates — confirm the ones you want to attend`}
      </p>
      <div className="space-y-1.5">
        {siblings.map(sib => {
          const isThis = sib.id === eventId
          const isConfirmed = sib.status === 'approved'
          return (
            <div
              key={sib.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor: isConfirmed
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)'
                  : isThis
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, transparent)'
                    : 'var(--color-bg-card)',
                border: isConfirmed
                  ? '1px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
              }}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {formatOptionDate(sib.event_date, sib.start_time)}
                </p>
                {sib.location && (
                  <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {sib.location}
                  </p>
                )}
                {isConfirmed && (
                  <span className="text-[9px] font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
                    confirmed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isConfirmed ? (
                  <button
                    onClick={() => dismissOption.mutate({ eventId: sib.id })}
                    disabled={busy}
                    className="text-[10px] font-medium px-2 py-1 rounded"
                    title="Remove this date"
                    style={{
                      background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                      color: 'var(--color-btn-primary-bg)',
                      border: '1px solid var(--color-btn-primary-bg)',
                      minHeight: 'unset',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    Going
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => confirmOption.mutate({ eventId: sib.id, optionGroupId })}
                      disabled={busy}
                      className="text-[10px] font-medium px-2 py-1 rounded"
                      style={{
                        background: 'var(--color-btn-primary-bg)',
                        color: 'var(--color-btn-primary-text)',
                        border: 'none',
                        minHeight: 'unset',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => dismissOption.mutate({ eventId: sib.id })}
                      disabled={busy}
                      className="text-[10px] font-medium px-2 py-1 rounded"
                      style={{
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        minHeight: 'unset',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Remove all remaining penciled-in dates */}
      {penciledCount > 0 && confirmedCount > 0 && (
        <button
          onClick={() => dismissRemaining.mutate({ optionGroupId })}
          disabled={busy}
          className="mt-2 text-[10px] font-medium w-full py-1.5 rounded"
          style={{
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            border: '1px dashed var(--color-border)',
            minHeight: 'unset',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
        >
          Remove remaining {penciledCount} date{penciledCount > 1 ? 's' : ''} I'm not attending
        </button>
      )}
    </div>
  )
}
