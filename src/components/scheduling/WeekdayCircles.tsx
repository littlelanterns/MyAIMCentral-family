/**
 * Reusable day-of-week multi-select circles (PRD-35)
 * Used in Weekly, Custom, Alternating Weeks A/B
 */

import { DAY_LABELS } from './types'

interface WeekdayCirclesProps {
  selected: number[]
  onToggle: (day: number) => void
  label?: string
}

export function WeekdayCircles({ selected, onToggle, label }: WeekdayCirclesProps) {
  return (
    <div>
      {label && (
        <div className="text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </div>
      )}
      <div className="flex gap-1.5">
        {DAY_LABELS.map((dayLabel, i) => {
          const active = selected.includes(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className="w-9 h-9 rounded-full text-xs font-medium transition-colors flex items-center justify-center"
              style={{
                backgroundColor: active ? 'var(--color-sage-teal, #68a395)' : 'transparent',
                color: active ? 'white' : 'var(--color-text-primary)',
                border: active ? '2px solid var(--color-sage-teal, #68a395)' : '2px solid var(--color-border)',
              }}
            >
              {dayLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
