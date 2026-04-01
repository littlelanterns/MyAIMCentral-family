/**
 * CalendarWidget — compact week view for the Personal Dashboard.
 *
 * Visual style matches v1: warm card-like day columns with filled headers,
 * today in accent color, "No events" placeholder, accent "View Month" button.
 * MiniCalendarPicker popup for jump-to-date.
 *
 * PRD-14B: Dashboard widget defaults to Week view.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon, Settings } from 'lucide-react'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useEventsForRange, useTasksDueInRange, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { DateDetailModal } from './DateDetailModal'
import { MonthViewModal } from './MonthViewModal'
import { EventCreationModal } from './EventCreationModal'
import { CalendarSettingsModal } from './CalendarSettingsModal'
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

export type CalendarViewMode = 'week' | 'month' | 'both'

export function CalendarWidget({ hubMode, viewMode }: { hubMode?: boolean; viewMode?: CalendarViewMode } = {}) {
  const { data: settings } = useCalendarSettings()
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1
  const dayNames = weekStartDay === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN

  const today = new Date()
  const [weekOffset, setWeekOffset] = useState(0)
  const [showMiniPicker, setShowMiniPicker] = useState(false)

  const weekStart = useMemo(() => {
    const base = getWeekStart(today, weekStartDay)
    return addDays(base, weekOffset * 7)
  }, [weekOffset, weekStartDay])

  const weekEnd = addDays(weekStart, 6)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const { data: events } = useEventsForRange(weekStart, weekEnd, undefined, hubMode)
  const { data: tasksDue } = useTasksDueInRange(weekStart, weekEnd)
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showMonth, setShowMonth] = useState(false)
  const [showEventCreation, setShowEventCreation] = useState(false)
  const [eventCreationDate, setEventCreationDate] = useState<string | undefined>()
  const [showSettings, setShowSettings] = useState(false)
  const [editingEvent, setEditingEvent] = useState<(CalendarEvent & { event_attendees: EventAttendee[] }) | null>(null)

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
      const key = t.due_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasksDue])

  const memberColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of familyMembers ?? []) {
      if (m.calendar_color || m.assigned_color) {
        map.set(m.id, m.calendar_color || m.assigned_color || 'var(--color-btn-primary-bg)')
      }
    }
    return map
  }, [familyMembers])

  const todayKey = toISODate(today)

  // Jump to week containing a specific date
  const jumpToDate = (date: Date) => {
    const targetWeekStart = getWeekStart(date, weekStartDay)
    const baseWeekStart = getWeekStart(today, weekStartDay)
    const diffDays = Math.round((targetWeekStart.getTime() - baseWeekStart.getTime()) / (1000 * 60 * 60 * 24))
    setWeekOffset(Math.round(diffDays / 7))
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header toolbar — gradient */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
          }}
        >
          {/* Title */}
          <h3
            className="text-base font-bold"
            style={{
              color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
              fontFamily: 'var(--font-heading)',
            }}
          >
            This Week
          </h3>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs px-2.5 py-1 rounded font-medium"
              style={{
                background: 'color-mix(in srgb, var(--color-text-on-primary, #fff) 20%, transparent)',
                color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                border: '1px solid color-mix(in srgb, var(--color-text-on-primary, #fff) 30%, transparent)',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '28px',
                background: 'transparent',
                color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                border: 'none', minHeight: 'unset', cursor: 'pointer',
              }}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '28px',
                background: 'transparent',
                color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                border: 'none', minHeight: 'unset', cursor: 'pointer',
              }}
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>

            {/* MiniCalendarPicker jump-to-date */}
            <div className="relative">
              <button
                onClick={() => setShowMiniPicker(!showMiniPicker)}
                className="flex items-center justify-center rounded"
                style={{
                  width: '28px', height: '28px',
                  background: 'transparent',
                  color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                  border: 'none', minHeight: 'unset', cursor: 'pointer',
                }}
                aria-label="Jump to date"
              >
                <CalendarIcon size={14} />
              </button>
              {showMiniPicker && (
                <div className="absolute top-full mt-1 right-0 z-50">
                  <MiniCalendarPicker
                    selectedDate={weekStart}
                    onDateSelect={(d) => {
                      jumpToDate(d)
                      setShowMiniPicker(false)
                    }}
                    weekStartDay={weekStartDay}
                    showTodayButton
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center rounded"
              style={{
                width: '28px', height: '28px',
                background: 'transparent',
                color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                border: 'none', minHeight: 'unset', cursor: 'pointer',
              }}
              aria-label="Calendar settings"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={() => setShowMonth(true)}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 ml-1"
              style={{
                background: 'color-mix(in srgb, var(--color-text-on-primary, #fff) 20%, transparent)',
                color: 'var(--color-text-on-primary, var(--color-btn-primary-text))',
                border: '1px solid color-mix(in srgb, var(--color-text-on-primary, #fff) 30%, transparent)',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
            >
              <CalendarDays size={14} />
              View Month
            </button>
          </div>
        </div>

        {/* Week grid — card-like day columns */}
        <div className="grid grid-cols-7 gap-px px-3 pb-3" style={{ backgroundColor: 'transparent' }}>
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
                className="flex flex-col rounded-lg overflow-hidden"
                style={{
                  border: `1px solid ${isToday ? 'var(--color-btn-primary-bg)' : 'color-mix(in srgb, var(--color-border) 60%, transparent)'}`,
                  cursor: 'pointer',
                  minHeight: '90px',
                  background: 'transparent',
                }}
              >
                {/* Day header — filled background */}
                <div
                  className="flex flex-col items-center py-1.5 px-1"
                  style={{
                    background: isToday
                      ? 'var(--color-btn-primary-bg)'
                      : 'color-mix(in srgb, var(--color-btn-primary-bg) 18%, var(--color-bg-secondary))',
                  }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color: isToday
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {dayNames[i]}
                  </span>
                  <span
                    className="text-base font-bold"
                    style={{
                      color: isToday
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-primary)',
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Day body — auto-height to fit event text */}
                <div
                  className="flex-1 flex flex-col gap-0.5 px-0.5 py-1"
                  style={{
                    background: isToday
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                  }}
                >
                  {totalItems > 0 ? (
                    <>
                      {dayEvents.slice(0, 4).map((ev) => {
                        const evColor = ev.status === 'pending_approval'
                          ? 'var(--color-text-secondary)'
                          : memberColorMap.get(ev.created_by) ?? 'var(--color-btn-primary-bg)'
                        return (
                          <div
                            key={ev.id}
                            className="flex items-start gap-0.5 text-left"
                            style={{ opacity: ev.status === 'pending_approval' ? 0.5 : 1 }}
                          >
                            <span
                              className="rounded-full shrink-0 mt-[3px]"
                              style={{
                                width: '5px',
                                height: '5px',
                                backgroundColor: evColor,
                              }}
                            />
                            <span
                              className="text-[9px] leading-tight truncate"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {ev.start_time ? ev.start_time.slice(0, 5) + ' ' : ''}{ev.title}
                            </span>
                          </div>
                        )
                      })}
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start gap-0.5 text-left"
                          style={{ opacity: 0.7 }}
                        >
                          <span
                            className="rounded-sm shrink-0 mt-[3px]"
                            style={{
                              width: '5px',
                              height: '5px',
                              backgroundColor: memberColorMap.get(t.assignee_id ?? t.created_by) ?? 'var(--color-text-secondary)',
                            }}
                          />
                          <span
                            className="text-[9px] leading-tight truncate italic"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {t.title}
                          </span>
                        </div>
                      ))}
                      {totalItems > 6 && (
                        <span className="text-[8px] text-center" style={{ color: 'var(--color-text-secondary)' }}>
                          +{totalItems - 6} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span
                      className="text-[10px] italic text-center flex-1 flex items-center justify-center"
                      style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
                    >
                      No events
                    </span>
                  )}
                </div>
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
          onAddEvent={(d) => {
            setEventCreationDate(toISODate(d))
            setEditingEvent(null)
            setShowEventCreation(true)
          }}
          onEditEvent={(ev) => {
            setEditingEvent({ ...ev, event_attendees: (ev as CalendarEvent & { event_attendees?: EventAttendee[] }).event_attendees ?? [] })
            setShowEventCreation(true)
          }}
        />
      )}

      {/* EventCreationModal */}
      <EventCreationModal
        isOpen={showEventCreation}
        onClose={() => {
          setShowEventCreation(false)
          setEditingEvent(null)
        }}
        initialDate={eventCreationDate}
        initialEvent={editingEvent ?? undefined}
      />

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

      {/* Calendar Settings Modal */}
      <CalendarSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  )
}
