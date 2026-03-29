/**
 * CalendarPage — full calendar page at /calendar.
 *
 * Default view: Month (per founder decision).
 * Day/Week/Month views, filter modes (Me/Family/Pick Members),
 * color mode (Dots/Stripe), date navigation with MiniCalendarPicker.
 *
 * PRD-14B Screen 1, spec: Calendar-System-Build-Spec.md
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
} from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useEventsForRange, useTasksDueInRange, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { DateDetailModal } from './DateDetailModal'
import { EventCreationModal } from './EventCreationModal'
import type { CalendarView, CalendarFilter } from '@/types/calendar'
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
  const diff = (d.getDay() - weekStartDay + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

function getMonthDays(year: number, month: number, weekStartDay: 0 | 1): (Date | null)[][] {
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
const DAY_HEADERS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_HEADERS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarPage() {
  const { data: settings } = useCalendarSettings()
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1
  const dayHeaders = weekStartDay === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN

  const today = new Date()
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(today)
  const [filter, setFilter] = useState<CalendarFilter>('family')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventCreation, setShowEventCreation] = useState(false)
  const [eventCreationDate, setEventCreationDate] = useState<string | undefined>()
  const [showMiniPicker, setShowMiniPicker] = useState(false)

  // Calculate date range based on view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return { rangeStart: start, rangeEnd: end }
    } else if (view === 'week') {
      const start = getWeekStart(currentDate, weekStartDay)
      return { rangeStart: start, rangeEnd: addDays(start, 6) }
    } else {
      return { rangeStart: currentDate, rangeEnd: currentDate }
    }
  }, [view, currentDate, weekStartDay])

  const memberFilter = filter === 'me' && member ? [member.id] : undefined
  const { data: events } = useEventsForRange(rangeStart, rangeEnd, memberFilter)
  const { data: tasksDue } = useTasksDueInRange(rangeStart, rangeEnd)

  // Build lookups
  const eventsByDate = useMemo(() => {
    const map = new Map<string, (CalendarEvent & { event_attendees: EventAttendee[] })[]>()
    for (const ev of events ?? []) {
      const key = ev.event_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
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

  const todayKey = toISODate(today)

  // Navigation
  const navigate = useCallback((dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (view === 'month') {
        const d = new Date(prev)
        d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1))
        return d
      } else if (view === 'week') {
        return addDays(prev, dir === 'next' ? 7 : -7)
      } else {
        return addDays(prev, dir === 'next' ? 1 : -1)
      }
    })
  }, [view])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleAddEvent = useCallback((date?: Date) => {
    setEventCreationDate(date ? toISODate(date) : undefined)
    setShowEventCreation(true)
  }, [])

  // Title for toolbar
  const titleLabel = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week') {
      const ws = getWeekStart(currentDate, weekStartDay)
      const we = addDays(ws, 6)
      const sm = ws.toLocaleDateString('en-US', { month: 'short' })
      const em = we.toLocaleDateString('en-US', { month: 'short' })
      return sm === em ? `${sm} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}` : `${sm} ${ws.getDate()} – ${em} ${we.getDate()}, ${ws.getFullYear()}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }, [view, currentDate, weekStartDay])

  // Month grid
  const monthWeeks = useMemo(() => {
    if (view !== 'month') return []
    return getMonthDays(currentDate.getFullYear(), currentDate.getMonth(), weekStartDay)
  }, [view, currentDate, weekStartDay])

  // Week grid
  const weekDays = useMemo(() => {
    if (view !== 'week') return []
    const ws = getWeekStart(currentDate, weekStartDay)
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  }, [view, currentDate, weekStartDay])

  return (
    <div className="density-compact">
      <FeatureGuide featureKey="calendar_basic" />

      {/* Toolbar — gradient header */}
      <div
        className="rounded-xl mb-4 overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Gradient title bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
          }}
        >
          <h1
            className="text-xl font-bold"
            style={{
              color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Calendar
          </h1>
          <button
            onClick={() => handleAddEvent()}
            className="flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-2"
            style={{
              background: 'color-mix(in srgb, var(--color-text-on-primary, #fff) 20%, transparent)',
              color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
              border: '1px solid color-mix(in srgb, var(--color-text-on-primary, #fff) 30%, transparent)',
              cursor: 'pointer',
              minHeight: 'unset',
            }}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>

        {/* Controls bar */}
        <div
          className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
          style={{ background: 'var(--color-bg-card)' }}
        >
          {/* Date navigation */}
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate('prev')} className="p-1.5 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }} aria-label="Previous">
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-semibold min-w-[180px] text-center" style={{ color: 'var(--color-text-heading)' }}>
              {titleLabel}
            </span>

            <button onClick={() => navigate('next')} className="p-1.5 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }} aria-label="Next">
              <ChevronRight size={16} />
            </button>

            <button onClick={goToToday} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}>
              Today
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMiniPicker(!showMiniPicker)}
                className="p-1.5 rounded"
                style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
                aria-label="Jump to date"
              >
                <CalendarIcon size={14} />
              </button>
              {showMiniPicker && (
                <div className="absolute top-full mt-1 right-0 z-50">
                  <MiniCalendarPicker
                    selectedDate={currentDate}
                    onDateSelect={(d) => {
                      setCurrentDate(d)
                      setShowMiniPicker(false)
                    }}
                    weekStartDay={weekStartDay}
                    showTodayButton
                  />
                </div>
              )}
            </div>
          </div>

          {/* View toggle + Filter */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {(['day', 'week', 'month'] as CalendarView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="text-xs px-3 py-1.5 font-medium capitalize"
                  style={{
                    background: view === v ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                    color: view === v ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: 'none',
                    minHeight: 'unset',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {([['me', 'Me'], ['family', 'Family']] as [CalendarFilter, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-xs px-3 py-1.5 font-medium"
                  style={{
                    background: filter === f ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                    color: filter === f ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: 'none',
                    minHeight: 'unset',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
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
              className="text-[10px] font-bold text-center py-2.5 tracking-wider uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {dh}
            </div>
          ))}
        </div>

        {/* Month View — square cells with event labels */}
        {view === 'month' && monthWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < monthWeeks.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            {week.map((date, di) => {
              if (!date) return (
                <div
                  key={`e-${wi}-${di}`}
                  className="aspect-square"
                  style={{
                    borderRight: di < 6 ? '1px solid var(--color-border)' : 'none',
                    background: 'var(--color-bg-card)',
                  }}
                />
              )

              const key = toISODate(date)
              const isToday = key === todayKey
              const dayEvs = eventsByDate.get(key) ?? []
              const dayTasks = tasksByDate.get(key) ?? []
              const totalItems = dayEvs.length + dayTasks.length

              return (
                <button
                  key={key}
                  onClick={() => handleDateClick(date)}
                  className="aspect-square p-1.5 text-left flex flex-col overflow-hidden"
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
                  {/* Date number */}
                  <span
                    className="text-sm font-bold self-end leading-tight"
                    style={{
                      color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                    }}
                  >
                    {date.getDate()}
                  </span>

                  {/* Event labels (show title text, not just dots) */}
                  <div className="flex flex-col gap-px mt-1 overflow-hidden flex-1">
                    {dayEvs.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[9px] leading-tight rounded-sm px-1 py-px truncate"
                        style={{
                          backgroundColor: isToday
                            ? 'color-mix(in srgb, var(--color-btn-primary-text) 20%, transparent)'
                            : ev.status === 'pending_approval'
                              ? 'var(--color-bg-secondary)'
                              : `color-mix(in srgb, ${memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'} 25%, transparent)`,
                          color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                          borderLeft: isToday
                            ? 'none'
                            : `2px solid ${ev.status === 'pending_approval' ? 'var(--color-text-secondary)' : memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'}`,
                          opacity: ev.status === 'pending_approval' ? 0.65 : 1,
                        }}
                      >
                        {ev.start_time ? ev.start_time.slice(0, 5) + ' ' : ''}{ev.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        className="text-[9px] leading-tight rounded-sm px-1 py-px truncate"
                        style={{
                          backgroundColor: isToday
                            ? 'color-mix(in srgb, var(--color-btn-primary-text) 15%, transparent)'
                            : 'var(--color-bg-secondary)',
                          color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {t.title}
                      </div>
                    ))}
                    {totalItems > 5 && (
                      <span
                        className="text-[8px]"
                        style={{ color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)' }}
                      >
                        +{totalItems - 5} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        {/* Week View — card-like columns with filled headers */}
        {view === 'week' && (
          <div className="grid grid-cols-7">
            {weekDays.map((date, i) => {
              const key = toISODate(date)
              const isToday = key === todayKey
              const dayEvs = eventsByDate.get(key) ?? []
              const dayTasks = tasksByDate.get(key) ?? []

              return (
                <button
                  key={key}
                  onClick={() => handleDateClick(date)}
                  className="flex flex-col"
                  style={{
                    borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: 'unset',
                    background: 'transparent',
                  }}
                >
                  {/* Day header */}
                  <div
                    className="flex flex-col items-center py-2"
                    style={{
                      background: isToday
                        ? 'var(--color-btn-primary-bg)'
                        : 'color-mix(in srgb, var(--color-btn-primary-bg) 18%, var(--color-bg-secondary))',
                      borderBottom: '1px solid var(--color-border)',
                      borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {dayHeaders[i]}
                    </span>
                    <span
                      className="text-base font-bold"
                      style={{
                        color: isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                      }}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Day body — tall rectangle */}
                  <div
                    className="flex-1 p-1.5 space-y-0.5 overflow-hidden"
                    style={{ minHeight: '180px' }}
                    style={{
                      background: isToday
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))'
                        : 'var(--color-bg-card)',
                      borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    {dayEvs.slice(0, 4).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[10px] rounded px-1 py-0.5 truncate"
                        style={{
                          backgroundColor: ev.status === 'pending_approval'
                            ? 'var(--color-bg-secondary)'
                            : `color-mix(in srgb, ${memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'} 20%, transparent)`,
                          color: 'var(--color-text-primary)',
                          borderLeft: `3px solid ${ev.status === 'pending_approval' ? 'var(--color-text-secondary)' : memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'}`,
                          opacity: ev.status === 'pending_approval' ? 0.6 : 1,
                          borderStyle: ev.status === 'pending_approval' ? 'dashed' : 'solid',
                        }}
                      >
                        {ev.start_time ? ev.start_time.slice(0, 5) : ''} {ev.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="text-[10px] rounded px-1 py-0.5 truncate" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        {t.title}
                      </div>
                    ))}
                    {dayEvs.length === 0 && dayTasks.length === 0 && (
                      <span className="text-[10px] italic block text-center mt-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                        No events
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="p-4">
            <button
              onClick={() => handleDateClick(currentDate)}
              className="w-full text-left"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', minHeight: 'unset' }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-heading)' }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </button>
            <div className="space-y-2">
              {(eventsByDate.get(toISODate(currentDate)) ?? []).map(ev => (
                <div
                  key={ev.id}
                  className="rounded-lg p-3 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: ev.status === 'pending_approval' ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                    borderLeft: `4px solid ${memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'}`,
                    opacity: ev.status === 'pending_approval' ? 0.7 : 1,
                  }}
                  onClick={() => handleDateClick(currentDate)}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {ev.is_all_day ? 'All Day' : `${ev.start_time?.slice(0, 5) ?? ''} – ${ev.end_time?.slice(0, 5) ?? ''}`}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </div>
              ))}
              {(tasksByDate.get(toISODate(currentDate)) ?? []).map(t => (
                <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', opacity: 0.85 }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{t.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Task due · {t.status}</p>
                </div>
              ))}
              {(eventsByDate.get(toISODate(currentDate)) ?? []).length === 0 && (tasksByDate.get(toISODate(currentDate)) ?? []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No events for this day</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
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
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* DateDetailModal */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          onDateChange={setSelectedDate}
          onAddEvent={handleAddEvent}
        />
      )}

      {/* EventCreationModal */}
      <EventCreationModal
        isOpen={showEventCreation}
        onClose={() => setShowEventCreation(false)}
        initialDate={eventCreationDate}
      />
    </div>
  )
}
