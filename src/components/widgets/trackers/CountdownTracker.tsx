// PRD-10: Countdown tracker — target date countdown display
// Visual variants: big_number, calendar_tearaway, advent_calendar
// Supports emoji display, recurring_annually, show_on_target_day

import { useMemo } from 'react'
import { PartyPopper, Hourglass } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

interface CountdownConfig {
  target_date?: string
  emoji?: string
  recurring_annually?: boolean
  show_on_target_day?: boolean
  zero_action?: 'celebration' | 'reset' | 'archive'
  title_at_zero?: string
}

function differenceInDays(targetStr: string, now: Date): number {
  const target = new Date(targetStr + 'T00:00:00')
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getEffectiveTargetDate(targetStr: string, recurring: boolean): string {
  if (!recurring) return targetStr
  const now = new Date()
  const target = new Date(targetStr + 'T00:00:00')
  // If target has passed this year, use next year
  const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (thisYear.getTime() < today.getTime()) {
    // Past this year — use next year
    return `${now.getFullYear() + 1}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
  }
  // This year's date is today or in the future
  return `${now.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
}

export function CountdownTracker({
  widget,
  isCompact,
}: TrackerProps) {
  const config = widget.widget_config as CountdownConfig
  const rawTargetDate = config.target_date ?? ''
  const emoji = config.emoji ?? ''
  const recurringAnnually = config.recurring_annually ?? false
  const showOnTargetDay = config.show_on_target_day !== false // default true
  const titleAtZero = config.title_at_zero ?? 'Today is the day!'

  const targetDate = useMemo(() => {
    if (!rawTargetDate) return ''
    return getEffectiveTargetDate(rawTargetDate, recurringAnnually)
  }, [rawTargetDate, recurringAnnually])

  const { daysRemaining, progress, colorToken } = useMemo(() => {
    if (!targetDate) {
      return { daysRemaining: 0, progress: 0, colorToken: 'var(--color-text-tertiary)' }
    }

    const now = new Date()
    const remaining = differenceInDays(targetDate, now)

    // Calculate total days from widget creation to target
    const createdAt = new Date(widget.created_at)
    const totalDays = differenceInDays(targetDate, createdAt)
    const prog = totalDays > 0 ? Math.max(0, Math.min(1, remaining / totalDays)) : 0

    // Color based on urgency
    let color: string
    if (remaining <= 0) {
      color = 'var(--color-accent)'
    } else if (remaining <= 2) {
      color = 'var(--color-accent-deep)'
    } else {
      color = 'var(--color-accent)'
    }

    return { daysRemaining: remaining, progress: prog, colorToken: color }
  }, [targetDate, widget.created_at])

  // No target date configured
  if (!targetDate) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 text-center">
        <Hourglass size={24} style={{ color: 'var(--color-text-tertiary)' }} />
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Set a target date
        </div>
      </div>
    )
  }

  // Target day reached — hide if showOnTargetDay is false and not recurring
  if (daysRemaining <= 0 && !showOnTargetDay && !recurringAnnually) {
    return null
  }

  // Celebration state (day has arrived or passed)
  if (daysRemaining <= 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 text-center">
        {emoji ? (
          <span className={`${isCompact ? 'text-3xl' : 'text-5xl'} leading-none`}>{emoji}</span>
        ) : (
          <PartyPopper
            size={isCompact ? 28 : 40}
            style={{ color: 'var(--color-accent)' }}
            className="animate-bounce"
          />
        )}
        <div
          className={`${isCompact ? 'text-sm' : 'text-lg'} font-bold`}
          style={{ color: 'var(--color-accent)' }}
        >
          {titleAtZero}
        </div>
        {!isCompact && (
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {widget.title}
          </div>
        )}
      </div>
    )
  }

  // Compact: emoji + big number + "days"
  if (isCompact) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-1">
        {emoji && <span className="text-2xl leading-none">{emoji}</span>}
        <div
          className="text-3xl font-bold tabular-nums"
          style={{ color: colorToken }}
        >
          {daysRemaining}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {daysRemaining === 1 ? 'day' : 'days'}
        </div>
      </div>
    )
  }

  // Full big_number variant
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3">
      {/* Emoji */}
      {emoji && <span className="text-4xl leading-none">{emoji}</span>}

      {/* Big number */}
      <div className="text-center">
        <div
          className="text-4xl font-bold tabular-nums leading-none"
          style={{ color: colorToken }}
        >
          {daysRemaining}
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {daysRemaining === 1 ? 'day until' : 'days until'}
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {widget.title}
        </div>
      </div>

      {/* Draining progress bar */}
      <div className="w-full px-2">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-border-default)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(progress * 100, 2)}%`,
              background: colorToken,
            }}
          />
        </div>
      </div>

      {/* Tomorrow callout */}
      {daysRemaining === 1 && (
        <div
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          Tomorrow!
        </div>
      )}
    </div>
  )
}
