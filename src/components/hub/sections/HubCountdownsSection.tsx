/**
 * HubCountdownsSection — PRD-14D Family Hub
 *
 * Displays countdown cards sorted by nearest date.
 * Each card: icon + title + "X days" large number + target date.
 * Hidden when no active countdowns.
 */

import { Timer, PartyPopper } from 'lucide-react'
import { useVisibleCountdowns, daysUntil } from '@/hooks/useCountdowns'
import { useFamily } from '@/hooks/useFamily'

function formatTargetDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HubCountdownsSection() {
  const { data: family } = useFamily()
  const { data: countdowns } = useVisibleCountdowns(family?.id)

  if (!countdowns || countdowns.length === 0) return null

  return (
    <div className="space-y-3" data-testid="hub-countdowns-section">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Timer size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Countdowns
        </span>
      </div>

      {/* Countdown cards — horizontally scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {countdowns.map((cd) => {
          const days = daysUntil(cd.target_date)
          const isToday = days === 0

          return (
            <div
              key={cd.id}
              className="shrink-0 rounded-lg p-4 text-center"
              style={{
                minWidth: 140,
                maxWidth: 180,
                backgroundColor: isToday
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
                border: isToday
                  ? '2px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
              }}
            >
              {/* Icon / Emoji */}
              <div className="mb-2 text-center">
                {cd.emoji ? (
                  <span className="text-2xl">{cd.emoji}</span>
                ) : isToday ? (
                  <PartyPopper
                    size={24}
                    className="mx-auto"
                    style={{ color: 'var(--color-btn-primary-bg)' }}
                  />
                ) : (
                  <Timer
                    size={24}
                    className="mx-auto"
                    style={{ color: 'var(--color-text-secondary)' }}
                  />
                )}
              </div>

              {/* Title */}
              <p
                className="text-xs font-medium mb-1 truncate"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                {cd.title}
              </p>

              {/* Days number */}
              {isToday ? (
                <p
                  className="text-sm font-bold"
                  style={{ color: 'var(--color-btn-primary-bg)' }}
                >
                  Today is the day!
                </p>
              ) : (
                <>
                  <p
                    className="text-2xl font-bold leading-none"
                    style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
                  >
                    {days}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {days === 1 ? 'day' : 'days'}
                  </p>
                </>
              )}

              {/* Target date */}
              <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {formatTargetDate(cd.target_date)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
