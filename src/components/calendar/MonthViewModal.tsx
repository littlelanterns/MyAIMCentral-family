/**
 * MonthViewModal — full month calendar in a transient modal overlay.
 *
 * Visual style matches v1: warm cell backgrounds, today in accent,
 * "Family Calendar" header, bottom legend with colored dots.
 *
 * Opened from the Dashboard widget "View Month" button.
 * Click any date → DateDetailModal (handled by parent).
 *
 * PRD-14B
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useEventsForRange, useTasksDueInRange, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { CalendarEvent, EventAttendee, TaskDueDate } from '@/types/calendar'

interface MonthViewModalProps {
  isOpen: boolean
  onClose: () => void
  onDateSelect: (date: Date) => void
  /** When true, renders inline (no modal wrapper) — used by Hub calendar */
  inline?: boolean
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonthGrid(year: number, month: number, weekStartDay: 0 | 1): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (firstDay.getDay() - weekStartDay + 7) % 7

  const cells: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_HEADERS_SUN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAY_HEADERS_MON = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function MonthViewModal({ isOpen, onClose, onDateSelect, inline }: MonthViewModalProps) {
  const { data: settings } = useCalendarSettings()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1
  const dayHeaders = weekStartDay === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN

  const today = new Date()
  const todayKey = toISODate(today)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const monthStart = useMemo(() => new Date(viewYear, viewMonth, 1), [viewYear, viewMonth])
  const monthEnd = useMemo(() => new Date(viewYear, viewMonth + 1, 0), [viewYear, viewMonth])

  const { data: events } = useEventsForRange(monthStart, monthEnd)
  const { data: tasksDue } = useTasksDueInRange(monthStart, monthEnd)

  const eventsByDate = useMemo(() => {
    const map = new Map<string, (CalendarEvent & { event_attendees: EventAttendee[] })[]>()
    for (const ev of events ?? []) {
      if (!map.has(ev.event_date)) map.set(ev.event_date, [])
      map.get(ev.event_date)!.push(ev)
    }
    return map
  }, [events])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskDueDate[]>()
    for (const t of tasksDue ?? []) {
      if (!map.has(t.due_date)) map.set(t.due_date, [])
      map.get(t.due_date)!.push(t)
    }
    return map
  }, [tasksDue])

  const memberColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of familyMembers ?? []) {
      map.set(m.id, m.calendar_color || m.assigned_color || 'var(--color-btn-primary-bg)')
    }
    return map
  }, [familyMembers])

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth, weekStartDay), [viewYear, viewMonth, weekStartDay])

  const navigateMonth = (dir: -1 | 1) => {
    const d = new Date(viewYear, viewMonth + dir, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const content = (
      <div className="px-4 pt-3 pb-4">
        {/* Month + year nav */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{
              color: 'var(--color-btn-primary-bg)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '28px',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: 'none', minHeight: 'unset', cursor: 'pointer',
              }}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '28px',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: 'none', minHeight: 'unset', cursor: 'pointer',
              }}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {/* Day headers */}
          <div
            className="grid grid-cols-7"
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
            }}
          >
            {dayHeaders.map((dh, i) => (
              <div
                key={`${dh}-${i}`}
                className="text-[10px] font-bold text-center py-2 tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {dh}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7"
              style={{
                borderBottom: wi < weeks.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {week.map((date, di) => {
                if (!date) {
                  return (
                    <div
                      key={`e-${wi}-${di}`}
                      className="aspect-square"
                      style={{
                        borderRight: di < 6 ? '1px solid var(--color-border)' : 'none',
                        background: 'var(--color-bg-card)',
                      }}
                    />
                  )
                }

                const key = toISODate(date)
                const isToday = key === todayKey
                const dayEvs = eventsByDate.get(key) ?? []
                const dayTasks = tasksByDate.get(key) ?? []
                const hasItems = dayEvs.length > 0 || dayTasks.length > 0

                return (
                  <button
                    key={key}
                    onClick={() => onDateSelect(date)}
                    className="aspect-square p-1.5 flex flex-col items-center justify-center"
                    style={{
                      background: isToday
                        ? 'var(--color-btn-primary-bg)'
                        : 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                      borderRight: di < 6 ? '1px solid var(--color-border)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      minHeight: 'unset',
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isToday
                          ? 'var(--color-btn-primary-text)'
                          : 'var(--color-text-primary)',
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {hasItems && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvs.slice(0, 3).map(ev => (
                          <span
                            key={ev.id}
                            className="rounded-full"
                            style={{
                              width: '5px',
                              height: '5px',
                              backgroundColor: isToday
                                ? 'var(--color-btn-primary-text)'
                                : memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)',
                              opacity: ev.status === 'pending_approval' ? 0.5 : (isToday ? 0.8 : 1),
                            }}
                          />
                        ))}
                        {dayTasks.slice(0, 2).map(t => (
                          <span
                            key={t.id}
                            className="rounded-sm"
                            style={{
                              width: '5px',
                              height: '5px',
                              backgroundColor: isToday
                                ? 'var(--color-btn-primary-text)'
                                : 'var(--color-text-secondary)',
                              opacity: 0.6,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-2">
          {[
            { label: 'Deadline', color: 'var(--color-text-primary)' },
            { label: 'Task', color: 'var(--color-text-secondary)' },
            { label: 'Event', color: 'var(--color-btn-primary-bg)' },
            { label: 'Reminder', color: 'var(--color-accent-deep, var(--color-btn-primary-bg))' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="rounded-full"
                style={{ width: '8px', height: '8px', backgroundColor: color }}
              />
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
  )

  if (inline) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {content}
      </div>
    )
  }

  return (
    <ModalV2
      id="month-view"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Family Calendar"
    >
      {content}
    </ModalV2>
  )
}
