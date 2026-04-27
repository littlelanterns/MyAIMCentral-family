/**
 * Calendar Preview Component (PRD-35 Screen 2)
 *
 * Navigable mini calendar highlighting scheduled dates.
 * Tap highlighted day → add EXDATE (un-highlight).
 * Tap un-highlighted day → add RDATE (highlight).
 * Custody patterns show Mom/Co-parent colors.
 * Today shows Golden Honey border ring.
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SchedulerOutput, SchedulerAction } from './types'
import { DAY_LABELS } from './types'
import { generatePreviewInstances, getCustodyDayMap } from './schedulerUtils'

interface CalendarPreviewProps {
  output: SchedulerOutput
  dispatch: React.Dispatch<SchedulerAction>
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CalendarPreview({ output, dispatch }: CalendarPreviewProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  const todayStr = toISODate(today)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Generate dates for the calendar grid
  const { days, rangeStart, rangeEnd } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const startDow = firstDay.getDay() // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    // Build grid with leading empty cells
    const grid: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(viewYear, viewMonth, d))
    }

    const rs = new Date(viewYear, viewMonth, 1)
    const re = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59)
    return { days: grid, rangeStart: rs, rangeEnd: re }
  }, [viewYear, viewMonth])

  // Compute highlighted dates
  const highlightedDates = useMemo(() => {
    const instances = generatePreviewInstances(output, rangeStart, rangeEnd)
    return new Set(instances.map(d => toISODate(d)))
  }, [output, rangeStart, rangeEnd])

  // Custody day map (only for custody schedules)
  const custodyMap = useMemo(() => {
    if (output.schedule_type !== 'custody') return null
    return getCustodyDayMap(output, rangeStart, rangeEnd)
  }, [output, rangeStart, rangeEnd])

  const exdateSet = useMemo(() => new Set(output.exdates), [output.exdates])
  const rdateSet = useMemo(() => new Set(output.rdates), [output.rdates])

  function handleDayClick(date: Date) {
    const iso = toISODate(date)

    if (output.schedule_type === 'painted') {
      dispatch({ type: 'TOGGLE_PAINTED_DATE', date: iso })
      return
    }

    const isHighlighted = highlightedDates.has(iso) && !exdateSet.has(iso)
    const isRdate = rdateSet.has(iso)

    if (isRdate) {
      dispatch({ type: 'REMOVE_RDATE', date: iso })
    } else if (isHighlighted) {
      dispatch({ type: 'ADD_EXDATE', date: iso })
    } else if (exdateSet.has(iso)) {
      dispatch({ type: 'REMOVE_EXDATE', date: iso })
    } else {
      dispatch({ type: 'ADD_RDATE', date: iso })
    }
  }

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })

  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {monthName} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="h-8" />
          }

          const iso = toISODate(date)
          const isToday = iso === todayStr
          const isExdate = exdateSet.has(iso)
          const isRdate = rdateSet.has(iso)
          const isScheduled = highlightedDates.has(iso) && !isExdate
          const showHighlight = isScheduled || isRdate

          // Determine background color
          let bgColor = 'transparent'
          let textColor = 'var(--color-text-primary)'

          if (custodyMap && !isExdate) {
            const side = custodyMap.get(iso)
            if (side === 'A') {
              bgColor = 'var(--color-sage-teal, #68a395)'
              textColor = 'white'
            } else if (side === 'B') {
              bgColor = 'var(--color-vintage-plum, #8b5e7e)'
              textColor = 'white'
            }
          } else if (showHighlight) {
            bgColor = 'var(--color-sage-teal, #68a395)'
            textColor = 'white'
          }

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleDayClick(date)}
              className="h-8 rounded text-xs font-medium transition-colors flex items-center justify-center relative"
              style={{
                backgroundColor: bgColor,
                color: isExdate ? 'var(--color-text-secondary)' : textColor,
                textDecoration: isExdate ? 'line-through' : 'none',
                opacity: isExdate ? 0.5 : 1,
                outline: isToday ? '2px solid var(--color-golden-honey, #d4a843)' : 'none',
                outlineOffset: '1px',
              }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Legend for custody */}
      {custodyMap && output.custody_pattern && (
        <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }} />
            {output.custody_pattern.labels.A}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: 'var(--color-vintage-plum, #8b5e7e)' }} />
            {output.custody_pattern.labels.B}
          </span>
        </div>
      )}

      <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
        Tap a date to skip or add it
      </p>
    </div>
  )
}
