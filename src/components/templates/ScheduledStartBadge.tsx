/**
 * Worker ROUTINE-PROPAGATION (c5, founder Row 5) — "Scheduled to start
 * [date]" badge.
 *
 * Lives under src/components/templates/ (D6 Thread 1) so future
 * Worker 2 SHARED-ROUTINES + Worker 3 SHARED-LISTS can reuse the same
 * pill — once shared lists support advance scheduling, the badge will
 * surface there too.
 *
 * Renders only when dtstart > today. Returns null otherwise so the
 * caller can drop it into JSX without conditional render boilerplate.
 *
 * Theme tokens only — no hardcoded colors. Uses the info-tone tokens
 * with a Calendar icon. Naming: NO "kid"/"child" — pure date display.
 */

import { CalendarClock } from 'lucide-react'

export interface ScheduledStartBadgeProps {
  /** dtstart in YYYY-MM-DD or full ISO. NULL/undefined renders null. */
  dtstart: string | null | undefined
  /** Optional className passthrough for layout glue */
  className?: string
  /**
   * "compact" omits the "Scheduled to start" prefix and shows
   * just the date pill ("May 1"). Used in dense card grids.
   * "full" (default) shows "Scheduled to start May 1, 2026".
   */
  size?: 'compact' | 'full'
}

function isFuture(dtstart: string): boolean {
  // Compare in local time: today's start-of-day vs dtstart's start-of-day.
  const dtstartDate = new Date(
    dtstart.includes('T') ? dtstart : dtstart + 'T00:00:00',
  )
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Strict > today: same-day shows nothing (already active).
  return dtstartDate > today
}

function formatDate(iso: string, size: 'compact' | 'full'): string {
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
  if (size === 'compact') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ScheduledStartBadge({
  dtstart,
  className = '',
  size = 'full',
}: ScheduledStartBadgeProps) {
  if (!dtstart || typeof dtstart !== 'string') return null
  if (!isFuture(dtstart)) return null

  const formatted = formatDate(dtstart, size)
  const label =
    size === 'compact' ? formatted : `Scheduled to start ${formatted}`

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{
        background:
          'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
        color: 'var(--color-btn-primary-bg)',
        border:
          '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)',
      }}
      title={`Starts ${formatted}`}
    >
      <CalendarClock size={10} />
      {label}
    </span>
  )
}
