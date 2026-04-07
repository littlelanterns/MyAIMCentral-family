/**
 * PRD-18 Section Type #4: Calendar Preview
 *
 * Today's events at a glance. Tappable to navigate to /calendar.
 * Auto-hides if no events today.
 */

import { Calendar, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEventsForDate } from '@/hooks/useCalendarEvents'

interface Props {
  /** Maximum events to show inline. Default 5. */
  maxItems?: number
}

function formatTime(time: string | null): string {
  if (!time) return 'All day'
  // time is HH:MM:SS or HH:MM
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const min = m ?? '00'
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${min} ${period}`
}

export function CalendarPreviewSection({ maxItems = 5 }: Props) {
  const { data: events = [], isLoading } = useEventsForDate(new Date())

  if (isLoading) return null
  if (events.length === 0) return null // auto-hide when nothing today

  const visible = events.slice(0, maxItems)
  const overflow = events.length - visible.length

  return (
    <Link
      to="/calendar"
      className="block rounded-xl p-5 transition-colors hover:bg-opacity-50"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Today's Calendar
          </h3>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
      </div>

      <ul className="space-y-1.5">
        {visible.map(event => (
          <li
            key={event.id}
            className="flex items-baseline gap-3 text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span
              className="text-xs font-mono flex-shrink-0 w-20"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {formatTime(event.start_time)}
            </span>
            <span className="truncate">{event.title}</span>
          </li>
        ))}
      </ul>

      {overflow > 0 && (
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          and {overflow} more
        </p>
      )}
    </Link>
  )
}
