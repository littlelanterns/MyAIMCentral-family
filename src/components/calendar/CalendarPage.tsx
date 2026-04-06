/**
 * CalendarPage — full calendar page at /calendar.
 *
 * Default view: Month (per founder decision).
 * Day/Week/Month views, filter modes (Me/Family/Pick Members),
 * color mode (Dots/Stripe), date navigation with MiniCalendarPicker.
 * Task due dates shown with CheckSquare icon, muted style.
 * Member colors applied as dots or left-border stripes.
 * ?new=1 URL param auto-opens EventCreationModal.
 *
 * PRD-14B Screen 1, spec: Calendar-System-Build-Spec.md
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings,
  CheckSquare, Circle, Check,
} from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useEventsForRange, useTasksDueInRange, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useUpdateTask, useCompleteTask } from '@/hooks/useTasks'
import { DateDetailModal } from './DateDetailModal'
import { EventCreationModal } from './EventCreationModal'
import { CalendarSettingsModal } from './CalendarSettingsModal'
import { QueueBadge } from '@/components/queue/QueueBadge'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import type { CalendarView, CalendarFilter, CalendarColorMode } from '@/types/calendar'
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

/** Member color dot (8px circle) before event text */
function ColorDot({ color, pending }: { color: string; pending?: boolean }) {
  return (
    <span
      className="rounded-full inline-block flex-shrink-0"
      style={{
        width: '8px',
        height: '8px',
        backgroundColor: pending ? 'var(--color-text-secondary)' : color,
        opacity: pending ? 0.5 : 1,
      }}
    />
  )
}

/** Stacked dots for multi-attendee events (up to 3 + overflow) */
function StackedDots({ colors, pending }: { colors: string[]; pending?: boolean }) {
  const shown = colors.slice(0, 3)
  const overflow = colors.length - 3
  return (
    <span className="inline-flex items-center gap-px flex-shrink-0">
      {shown.map((c, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: '6px',
            height: '6px',
            backgroundColor: pending ? 'var(--color-text-secondary)' : c,
            opacity: pending ? 0.5 : 1,
            marginLeft: i > 0 ? '-2px' : 0,
          }}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[7px] ml-px" style={{ color: 'var(--color-text-secondary)' }}>+{overflow}</span>
      )}
    </span>
  )
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { data: settings } = useCalendarSettings()
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const weekStartDay = (settings?.week_start_day ?? 0) as 0 | 1
  const dayHeaders = weekStartDay === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN
  const pendingCounts = usePendingCounts(family?.id, member?.id)
  const updateTask = useUpdateTask()
  const completeTask = useCompleteTask()

  const today = new Date()
  const [view, setView] = useState<CalendarView>(() => {
    try {
      const stored = localStorage.getItem('myaim-calendar-default-view')
      if (stored === 'month' || stored === 'week' || stored === 'day') return stored
    } catch { /* ignore */ }
    return 'month'
  })
  const [currentDate, setCurrentDate] = useState(today)
  const [filter, setFilter] = useState<CalendarFilter>('family')
  const [pickedMemberIds, setPickedMemberIds] = useState<Set<string>>(new Set())
  const [colorMode, setColorMode] = useState<CalendarColorMode>(() => {
    try {
      const stored = localStorage.getItem('myaim-calendar-color-mode')
      if (stored === 'dots' || stored === 'stripe') return stored
    } catch { /* ignore */ }
    return 'dots'
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventCreation, setShowEventCreation] = useState(false)
  const [eventCreationDate, setEventCreationDate] = useState<string | undefined>()
  const [showMiniPicker, setShowMiniPicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingEvent, setEditingEvent] = useState<(CalendarEvent & { event_attendees?: EventAttendee[] }) | null>(null)
  const [taskDetailId, setTaskDetailId] = useState<string | null>(null)
  const [taskCompletedId, setTaskCompletedId] = useState<string | null>(null)
  const [taskDatePickerValue, setTaskDatePickerValue] = useState<string>('')

  // ?new=1 URL param → auto-open EventCreationModal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('new') === '1') {
      setShowEventCreation(true)
      // Strip param from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('new')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Persist color mode
  useEffect(() => {
    try { localStorage.setItem('myaim-calendar-color-mode', colorMode) } catch { /* ignore */ }
  }, [colorMode])

  // Initialize picked members to all when switching to pick mode
  useEffect(() => {
    if (filter === 'pick' && pickedMemberIds.size === 0 && familyMembers?.length) {
      setPickedMemberIds(new Set(familyMembers.map(m => m.id)))
    }
  }, [filter, familyMembers, pickedMemberIds.size])

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

  // Member filter for query
  const memberFilter = useMemo(() => {
    if (filter === 'me' && member) return [member.id]
    if (filter === 'pick' && pickedMemberIds.size > 0) return Array.from(pickedMemberIds)
    return undefined
  }, [filter, member, pickedMemberIds])

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
  const navigateCalendar = useCallback((dir: 'prev' | 'next') => {
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

  // Get attendee colors for an event
  const getEventColors = useCallback((ev: CalendarEvent & { event_attendees: EventAttendee[] }) => {
    const colors: string[] = []
    // Creator color first
    const creatorColor = memberColorMap.get(ev.created_by)
    if (creatorColor) colors.push(creatorColor)
    // Then attendees
    for (const att of ev.event_attendees ?? []) {
      const c = memberColorMap.get(att.family_member_id)
      if (c && !colors.includes(c)) colors.push(c)
    }
    return colors.length > 0 ? colors : ['var(--color-btn-primary-bg)']
  }, [memberColorMap])

  // Event label rendering helper (dots or stripe mode)
  const renderEventLabel = useCallback((
    ev: CalendarEvent & { event_attendees: EventAttendee[] },
    opts: { isToday?: boolean; compact?: boolean } = {},
  ) => {
    const isPending = ev.status === 'pending_approval'
    const isPenciledIn = ev.status === 'penciled_in'
    const isTentative = isPending || isPenciledIn
    const colors = getEventColors(ev)
    const primaryColor = isPending ? 'var(--color-text-secondary)' : colors[0]

    if (colorMode === 'stripe') {
      return (
        <div
          key={ev.id}
          className={`text-[${opts.compact ? '9' : '10'}px] leading-tight rounded-sm px-1 py-px truncate`}
          style={{
            backgroundColor: opts.isToday
              ? 'color-mix(in srgb, var(--color-btn-primary-text) 20%, transparent)'
              : isTentative
                ? 'var(--color-bg-secondary)'
                : `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
            color: opts.isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
            borderLeft: `3px solid ${primaryColor}`,
            borderStyle: isTentative ? 'dashed' : 'solid',
            opacity: isTentative ? 0.75 : 1,
          }}
        >
          {ev.start_time ? ev.start_time.slice(0, 5) + ' ' : ''}{ev.title}
        </div>
      )
    }

    // Dots mode
    return (
      <div
        key={ev.id}
        className={`text-[${opts.compact ? '9' : '10'}px] leading-tight rounded-sm px-1 py-px truncate flex items-center gap-1`}
        style={{
          backgroundColor: opts.isToday
            ? 'color-mix(in srgb, var(--color-btn-primary-text) 20%, transparent)'
            : isTentative
              ? 'var(--color-bg-secondary)'
              : `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
          color: opts.isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
          opacity: isTentative ? 0.75 : 1,
        }}
      >
        {colors.length > 1
          ? <StackedDots colors={colors} pending={isTentative} />
          : <ColorDot color={primaryColor} pending={isTentative} />
        }
        <span className="truncate">
          {ev.start_time ? ev.start_time.slice(0, 5) + ' ' : ''}{ev.title}
        </span>
      </div>
    )
  }, [colorMode, getEventColors])

  // Task due date label rendering
  const renderTaskLabel = useCallback((
    t: TaskDueDate,
    opts: { isToday?: boolean } = {},
  ) => {
    const taskColor = memberColorMap.get(t.assignee_id ?? t.created_by) ?? 'var(--color-text-secondary)'

    return (
      <div
        key={t.id}
        className="text-[9px] leading-tight rounded-sm px-1 py-px truncate flex items-center gap-1 cursor-pointer"
        style={{
          backgroundColor: opts.isToday
            ? 'color-mix(in srgb, var(--color-btn-primary-text) 15%, transparent)'
            : 'var(--color-bg-secondary)',
          color: opts.isToday ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
          borderLeft: colorMode === 'stripe' ? `3px solid ${taskColor}` : undefined,
          opacity: 0.85,
        }}
        onClick={(e) => {
          e.stopPropagation()
          setTaskDetailId(t.id)
        }}
      >
        {colorMode === 'dots' && <CheckSquare size={8} className="flex-shrink-0" style={{ opacity: 0.7 }} />}
        <span className="truncate">{t.title}</span>
      </div>
    )
  }, [colorMode, memberColorMap])

  // Task detail for click action
  const taskDetail = useMemo(() => {
    if (!taskDetailId) return null
    for (const tasks of tasksByDate.values()) {
      const found = tasks.find(t => t.id === taskDetailId)
      if (found) return found
    }
    return null
  }, [taskDetailId, tasksByDate])

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
          <div className="flex items-center gap-2">
            {/* PRD-17: Pending approval badge → opens Queue Modal Calendar tab */}
            {member?.role === 'primary_parent' && pendingCounts.calendar > 0 && (
              <QueueBadge
                count={pendingCounts.calendar}
                defaultTab="calendar"
                compact
              />
            )}
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
        </div>

        {/* Controls bar */}
        <div
          className="px-4 py-2.5 flex items-center gap-3 flex-wrap"
          style={{ background: 'var(--color-bg-card)' }}
        >
          {/* Date navigation */}
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigateCalendar('prev')} className="p-1.5 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }} aria-label="Previous">
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm font-semibold min-w-[180px] text-center" style={{ color: 'var(--color-text-heading)' }}>
              {titleLabel}
            </span>

            <button onClick={() => navigateCalendar('next')} className="p-1.5 rounded" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }} aria-label="Next">
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

          {/* View toggle + Filter + Color mode */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
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

            {/* Filter toggle: Me / Family / Pick */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {([['me', 'Me'], ['family', 'Family'], ['pick', 'Pick']] as [CalendarFilter, string][]).map(([f, label]) => (
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

            {/* Dots / Stripe toggle */}
            <button
              onClick={() => setColorMode(colorMode === 'dots' ? 'stripe' : 'dots')}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded font-medium"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
              title={colorMode === 'dots' ? 'Switch to stripe mode' : 'Switch to dots mode'}
            >
              {colorMode === 'dots' ? <><Circle size={8} fill="currentColor" /> Dots</> : <>▌Stripe</>}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
              aria-label="Calendar settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Pick Members avatar row */}
        {filter === 'pick' && familyMembers && familyMembers.length > 0 && (
          <div
            className="px-4 py-2 flex items-center gap-2 overflow-x-auto"
            style={{
              background: 'var(--color-bg-card)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              onClick={() => {
                const allIds = familyMembers.map(m => m.id)
                const allSelected = allIds.every(id => pickedMemberIds.has(id))
                setPickedMemberIds(allSelected ? new Set() : new Set(allIds))
              }}
              className="text-[10px] font-medium flex-shrink-0"
              style={{
                color: 'var(--color-btn-primary-bg)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minHeight: 'unset',
              }}
            >
              {familyMembers.every(m => pickedMemberIds.has(m.id)) ? 'Clear All' : 'Select All'}
            </button>
            {familyMembers.map(m => {
              const isActive = pickedMemberIds.has(m.id)
              const mColor = m.calendar_color || m.assigned_color || 'var(--color-btn-primary-bg)'
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setPickedMemberIds(prev => {
                      const next = new Set(prev)
                      if (next.has(m.id)) next.delete(m.id)
                      else next.add(m.id)
                      return next
                    })
                  }}
                  className="flex flex-col items-center gap-0.5 flex-shrink-0"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: 'unset',
                    opacity: isActive ? 1 : 0.4,
                  }}
                  title={m.display_name}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${mColor} 20%, var(--color-bg-card))`,
                      border: `2.5px solid ${isActive ? mColor : 'var(--color-border)'}`,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {m.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] truncate max-w-[48px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {m.display_name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        )}
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

                  {/* Event + task labels */}
                  <div className="flex flex-col gap-px mt-1 overflow-hidden flex-1">
                    {dayEvs.slice(0, 3).map(ev => renderEventLabel(ev, { isToday, compact: true }))}
                    {dayTasks.slice(0, 2).map(t => renderTaskLabel(t, { isToday }))}
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
                    style={{
                      minHeight: '180px',
                      background: isToday
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))'
                        : 'var(--color-bg-card)',
                      borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    {dayEvs.slice(0, 4).map(ev => renderEventLabel(ev, { isToday }))}
                    {dayTasks.slice(0, 2).map(t => renderTaskLabel(t, { isToday }))}
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
              {(eventsByDate.get(toISODate(currentDate)) ?? []).map(ev => {
                const evColors = getEventColors(ev)
                const isPending = ev.status === 'pending_approval'
                const isTentative = isPending || ev.status === 'penciled_in'
                return (
                  <div
                    key={ev.id}
                    className="rounded-lg p-3 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: isTentative ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                      borderLeft: colorMode === 'stripe'
                        ? `4px ${isTentative ? 'dashed' : 'solid'} ${isPending ? 'var(--color-text-secondary)' : evColors[0]}`
                        : undefined,
                      opacity: isTentative ? 0.75 : 1,
                    }}
                    onClick={() => handleDateClick(currentDate)}
                  >
                    <div className="flex items-center gap-2">
                      {colorMode === 'dots' && (
                        evColors.length > 1
                          ? <StackedDots colors={evColors} pending={isTentative} />
                          : <ColorDot color={evColors[0]} pending={isTentative} />
                      )}
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {ev.is_all_day ? 'All Day' : `${ev.start_time?.slice(0, 5) ?? ''} – ${ev.end_time?.slice(0, 5) ?? ''}`}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                )
              })}
              {(tasksByDate.get(toISODate(currentDate)) ?? []).map(t => (
                <div
                  key={t.id}
                  className="rounded-lg p-3 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderLeft: colorMode === 'stripe'
                      ? `4px solid ${memberColorMap.get(t.assignee_id ?? t.created_by) ?? 'var(--color-text-secondary)'}`
                      : undefined,
                    opacity: 0.85,
                  }}
                  onClick={() => setTaskDetailId(t.id)}
                >
                  <div className="flex items-center gap-2">
                    {colorMode === 'dots' && <CheckSquare size={12} style={{ color: 'var(--color-text-secondary)' }} />}
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{t.title}</p>
                  </div>
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
          { label: 'Event', color: 'var(--color-btn-primary-bg)' },
          { label: 'Task', color: 'var(--color-text-secondary)' },
          { label: 'Pending', color: 'var(--color-text-secondary)', dashed: true },
        ].map(({ label, color, dashed }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="rounded-full"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: color,
                border: dashed ? '1px dashed var(--color-text-secondary)' : 'none',
                opacity: dashed ? 0.5 : 1,
              }}
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
          onEditEvent={(ev) => {
            setEditingEvent(ev)
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

      {/* Calendar Settings */}
      <CalendarSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onDefaultViewChange={(v) => setView(v as CalendarView)}
      />

      {/* Task Due Date Detail Mini-Modal */}
      {taskDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => { setTaskDetailId(null); setTaskCompletedId(null); setTaskDatePickerValue('') }}
        >
          <div className="fixed inset-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 60%, transparent)' }} />
          <div
            className="relative rounded-xl p-5 w-full max-w-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {taskCompletedId === taskDetail.id ? (
                  <Check size={18} style={{ color: 'var(--color-success, #38A169)' }} />
                ) : (
                  <CheckSquare size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                )}
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
                  {taskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => { setTaskDetailId(null); setTaskCompletedId(null); setTaskDatePickerValue('') }}
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 'unset' }}
              >
                Close
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {/* Due Date row — shows date picker inline when editing */}
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>Due Date</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={taskDatePickerValue || taskDetail.due_date}
                    onChange={(e) => {
                      const newDate = e.target.value
                      setTaskDatePickerValue(newDate)
                      if (newDate) {
                        updateTask.mutate({ id: taskDetail.id, due_date: newDate })
                      }
                    }}
                    className="text-xs rounded px-1.5 py-1 outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: (taskCompletedId === taskDetail.id || taskDetail.status === 'completed')
                      ? 'color-mix(in srgb, var(--color-success, #38A169) 15%, transparent)'
                      : 'var(--color-bg-secondary)',
                    color: (taskCompletedId === taskDetail.id || taskDetail.status === 'completed')
                      ? 'var(--color-success, #38A169)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {taskCompletedId === taskDetail.id ? 'completed' : taskDetail.status}
                </span>
              </div>

              {taskDetail.priority && (
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{taskDetail.priority}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Mark Complete — hidden if already completed */}
                {taskDetail.status !== 'completed' && taskCompletedId !== taskDetail.id && (
                  <button
                    onClick={() => {
                      if (!member?.id) return
                      completeTask.mutate({
                        taskId: taskDetail.id,
                        memberId: member.id,
                        requireApproval: false,
                      }, {
                        onSuccess: () => {
                          setTaskCompletedId(taskDetail.id)
                        },
                      })
                    }}
                    disabled={completeTask.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                      color: 'var(--color-btn-primary-text)',
                      border: 'none',
                      cursor: completeTask.isPending ? 'default' : 'pointer',
                      minHeight: 'unset',
                      opacity: completeTask.isPending ? 0.7 : 1,
                    }}
                  >
                    <Check size={12} />
                    {completeTask.isPending ? 'Saving…' : 'Mark Complete'}
                  </button>
                )}
                {(taskDetail.status === 'completed' || taskCompletedId === taskDetail.id) && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      background: 'color-mix(in srgb, var(--color-success, #38A169) 15%, transparent)',
                      color: 'var(--color-success, #38A169)',
                    }}
                  >
                    <Check size={12} />
                    Completed!
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setTaskDetailId(null)
                  setTaskCompletedId(null)
                  setTaskDatePickerValue('')
                  navigate(`/tasks?taskId=${taskDetail.id}`)
                }}
                className="text-sm font-medium"
                style={{
                  color: 'var(--color-btn-primary-bg)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 'unset',
                }}
              >
                Open full task →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
