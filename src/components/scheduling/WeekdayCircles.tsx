/**
 * Reusable day-of-week multi-select circles (PRD-35)
 * Used in Weekly, Custom, Alternating Weeks A/B
 *
 * weekStartDay prop controls visual ordering:
 *   0 (default) = Su M Tu W Th F Sa
 *   1           = M Tu W Th F Sa Su
 * Internal day values are always 0=Su, 1=Mo, ... 6=Sa regardless of display order.
 */

import { DAY_LABELS } from './types'

interface WeekdayCirclesProps {
  selected: number[]
  onToggle: (day: number) => void
  label?: string
  /** 0=Sunday first (default), 1=Monday first */
  weekStartDay?: 0 | 1
}

export function WeekdayCircles({ selected, onToggle, label, weekStartDay = 0 }: WeekdayCirclesProps) {
  // Build display order: when weekStartDay=1, rotate Sunday to end
  const dayOrder = weekStartDay === 1
    ? [1, 2, 3, 4, 5, 6, 0] // Mon=1, Tue=2, ..., Sat=6, Sun=0
    : [0, 1, 2, 3, 4, 5, 6] // Sun=0, Mon=1, ..., Sat=6

  return (
    <div>
      {label && (
        <div className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </div>
      )}
      <div className="flex gap-1.5">
        {dayOrder.map((dayIndex) => {
          const active = selected.includes(dayIndex)
          return (
            <button
              key={dayIndex}
              type="button"
              onClick={() => onToggle(dayIndex)}
              className="w-9 h-9 rounded-full text-xs font-medium transition-colors flex items-center justify-center"
              style={{
                backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'transparent',
                color: active ? 'var(--color-btn-primary-text, #fff)' : 'var(--color-text-primary)',
                border: active ? '2px solid var(--color-btn-primary-bg)' : '2px solid var(--color-border)',
              }}
            >
              {DAY_LABELS[dayIndex]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
