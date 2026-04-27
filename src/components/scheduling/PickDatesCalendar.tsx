import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { SchedulerAction } from './types'
import { DAY_LABELS } from './types'

interface PickDatesCalendarProps {
  paintedDates: string[]
  dispatch: React.Dispatch<SchedulerAction>
  weekStartDay?: 0 | 1
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function PickDatesCalendar({ paintedDates, dispatch, weekStartDay = 0 }: PickDatesCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const todayStr = toISODate(today)
  const paintedSet = useMemo(() => new Set(paintedDates), [paintedDates])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    let startDow = firstDay.getDay()
    if (weekStartDay === 1) {
      startDow = startDow === 0 ? 6 : startDow - 1
    }
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const grid: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(viewYear, viewMonth, d))
    }
    return grid
  }, [viewYear, viewMonth, weekStartDay])

  const dayLabels = weekStartDay === 1
    ? [...DAY_LABELS.slice(1), DAY_LABELS[0]]
    : [...DAY_LABELS]

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl p-3"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
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

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayLabels.map(d => (
            <div key={d} className="text-center text-xs font-medium py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="h-9" />
            }

            const iso = toISODate(date)
            const isToday = iso === todayStr
            const isPainted = paintedSet.has(iso)

            return (
              <button
                key={iso}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_PAINTED_DATE', date: iso })}
                className="h-9 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: isPainted
                    ? 'var(--color-accent, var(--color-sage-teal, #68a395))'
                    : 'transparent',
                  color: isPainted
                    ? 'var(--color-text-on-primary, white)'
                    : 'var(--color-text-primary)',
                  outline: isToday ? '2px solid var(--color-golden-honey, #d4a843)' : 'none',
                  outlineOffset: '1px',
                }}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
          Tap dates to select or deselect
        </p>
      </div>

      {paintedDates.length > 0 && (
        <div>
          <div
            className="text-xs font-medium mb-1.5 uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Selected dates ({paintedDates.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {paintedDates.map(d => {
              const dateObj = new Date(d + 'T00:00:00')
              const label = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric' })
              return (
                <span
                  key={d}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent, var(--color-sage-teal, #68a395)) 15%, transparent)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-accent, var(--color-sage-teal, #68a395))',
                  }}
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_PAINTED_DATE', date: d })}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
