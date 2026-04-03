/**
 * InfoCountdown — Personal dashboard widget for family countdowns.
 * Shows the nearest countdown with emoji + days remaining.
 */

import { Hourglass } from 'lucide-react'
import { useVisibleCountdowns } from '@/hooks/useCountdowns'
import { useFamily } from '@/hooks/useFamily'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

function daysUntil(targetDate: string): number {
  const target = new Date(targetDate + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function InfoCountdown({ widget: _widget, isCompact }: Props) {
  const { data: family } = useFamily()
  const { data: countdowns = [] } = useVisibleCountdowns(family?.id)

  if (countdowns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1 px-2 text-center">
        <Hourglass size={16} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          No upcoming countdowns
        </span>
      </div>
    )
  }

  const items = isCompact ? countdowns.slice(0, 2) : countdowns.slice(0, 4)

  return (
    <div className="flex flex-col gap-2 px-2 py-1.5">
      {items.map((cd) => {
        const days = daysUntil(cd.target_date)
        const isToday = days === 0

        return (
          <div key={cd.id} className="flex items-center gap-2">
            <span className="text-base shrink-0">{cd.emoji || '🎯'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {cd.title}
              </p>
              <p
                className="text-[10px] font-semibold"
                style={{ color: isToday ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
              >
                {isToday ? 'Today is the day!' : `${days} day${days !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        )
      })}
      {countdowns.length > items.length && (
        <span className="text-[10px] text-center" style={{ color: 'var(--color-text-secondary)' }}>
          +{countdowns.length - items.length} more
        </span>
      )}
    </div>
  )
}
