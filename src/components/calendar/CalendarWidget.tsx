/**
 * CalendarWidget — compact week view for the Personal Dashboard.
 *
 * Default view: Week (7-column grid).
 * Respects calendar_settings.week_start_day.
 * Click any day → DateDetailModal (modal, not navigation).
 * "View Month" → full month in a transient modal overlay.
 *
 * PRD-14B, spec: Calendar-System-Build-Spec.md
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Expand } from 'lucide-react'
import { useEventsForRange, useTasksDueInRange, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { DateDetailModal } from './DateDetailModal'
import { MonthViewModal } from './MonthViewModal'
import type { CalendarEvent, EventAttendee, TaskDueDate } from '@/types/calendar'

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function getWeekStart(date: Date, weekStartDay: 0 | 1): Date {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const diff = (dayOfWeek - weekStartDay + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

const DAY_NAMES_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`
}

export function CalendarWidget() {
  const { data: settings } = useCalendarSettings()
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1
  const dayNames = weekStartDay === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN

  const today = new Date()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = useMemo(() => {
    const base = getWeekStart(today, weekStartDay)
    return addDays(base, weekOffset * 7)
  }, [weekOffset, weekStartDay])

  const weekEnd = addDays(weekStart, 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const { data: events } = useEventsForRange(weekStart, weekEnd)
  const { data: tasksDue } = useTasksDueInRange(weekStart, weekEnd)
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMonth, setShowMonth] = useState(false)

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, (CalendarEvent & { event_attendees: EventAttendee[] })[]>()
    for (const ev of events ?? []) {
      const key = ev.event_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [events])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskDueDate[]>()
    for (const t of tasksDue ?? []) {
      const key = t.due_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasksDue])

  // Member color map
  const memberColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of familyMembers ?? []) {
      if (m.calendar_color || m.assigned_color_token) {
        map.set(m.id, m.calendar_color || m.assigned_color_token || 'var(--color-btn-primary-bg)')
      }
    }
    return map
  }, [familyMembers])

  const todayKey = toISODate(today)

  return (
    <>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              This Week
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="flex items-center justify-center rounded"
              style={{ width: '24px', height: '24px', background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
              aria-label="Previous week"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)', minWidth: '100px', textAlign: 'center' }}>
              {formatDateRange(weekStart, weekEnd)}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="flex items-center justify-center rounded"
              style={{ width: '24px', height: '24px', background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
              aria-label="Next week"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setShowMonth(true)}
              className="flex items-center gap-1 text-xs rounded px-2 py-1 ml-1"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
            >
              <Expand size={12} />
              Month
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => {
            const dayKey = toISODate(day)
            const isToday = dayKey === todayKey
            const dayEvents = eventsByDate.get(dayKey) ?? []
            const dayTasks = tasksByDate.get(dayKey) ?? []
            const totalItems = dayEvents.length + dayTasks.length

            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center py-2 px-1 transition-colors"
                style={{
                  background: isToday ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' : 'transparent',
                  borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                  minHeight: '64px',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: 'none',
                }}
              >
                {/* Day name */}
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {dayNames[i]}
                </span>

                {/* Date number */}
                <span
                  className="text-sm font-semibold rounded-full flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                    background: isToday ? 'var(--color-btn-primary-bg)' : 'transparent',
                  }}
                >
                  {day.getDate()}
                </span>

                {/* Event dots */}
                {totalItems > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center" style={{ maxWidth: '40px' }}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className="rounded-full"
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: ev.status === 'pending_approval'
                            ? 'var(--color-text-secondary)'
                            : memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)',
                          opacity: ev.status === 'pending_approval' ? 0.5 : 1,
                        }}
                      />
                    ))}
                    {dayTasks.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className="rounded-sm"
                        style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: memberColorMap.get(t.assignee_id ?? t.created_by) ?? 'var(--color-text-secondary)',
                          opacity: 0.6,
                        }}
                      />
                    ))}
                    {totalItems > 5 && (
                      <span className="text-[8px]" style={{ color: 'var(--color-text-secondary)' }}>+{totalItems - 5}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* DateDetailModal */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Month View Modal */}
      {showMonth && (
        <MonthViewModal
          isOpen={true}
          onClose={() => setShowMonth(false)}
          onDateSelect={(d) => {
            setShowMonth(false)
            setSelectedDate(d)
          }}
        />
      )}
    </>
  )
}
