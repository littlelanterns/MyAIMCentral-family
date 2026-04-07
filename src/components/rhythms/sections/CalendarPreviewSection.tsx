/**
 * PRD-18 Section Type #4: Calendar Preview
 *
 * Today's events at a glance. Tappable to navigate to /calendar.
 * Auto-hides if no events match the configured scope.
 *
 * Two scopes (controlled by section.config.scope):
 *
 *   'family' (default — used by adult/independent morning rhythms):
 *     Shows ALL family events for today. Mom's mental load includes
 *     the whole family's day, so seeing "kids have co-op at 10" matters
 *     even if she's not technically an attendee.
 *
 *   'member' (used by Guided morning rhythm seed):
 *     Shows only events the member is an attendee on, OR family-wide
 *     events with no specific attendees (which implicitly include
 *     everyone). Filters out events that don't involve the kid at all
 *     (e.g., "Dad's dentist appointment"). Reduces noise so the kid
 *     sees only events relevant to them.
 *
 * Founder rule (2026-04-07):
 *   "Calendar should only show anything that involves the member for
 *    independent and guided. Mom really does need to know everything."
 *
 * The scope is read from rhythm_configs.sections JSONB so mom can
 * change it per-rhythm via Rhythms Settings without code changes.
 */

import { Calendar, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEventsForDate } from '@/hooks/useCalendarEvents'

export type CalendarPreviewScope = 'family' | 'member'

interface Props {
  /** Maximum events to show inline. Default 5. */
  maxItems?: number
  /** Scope: 'family' (default) shows all events; 'member' filters to events the member attends. */
  scope?: CalendarPreviewScope
  /** Member ID for scope='member' filtering. Required when scope='member'. */
  memberId?: string
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

export function CalendarPreviewSection({
  maxItems = 5,
  scope = 'family',
  memberId,
}: Props) {
  const { data: events = [], isLoading } = useEventsForDate(new Date())

  if (isLoading) return null

  // Apply member-scope filter if requested. The hook already returns
  // event_attendees joined as a sub-array, so we filter in memory —
  // no extra query needed. An event is "in scope" for a member if:
  //   - the member is in the event_attendees list, OR
  //   - the event has zero attendees (implicit family-wide event —
  //     things like "Dentist appointment 2pm" with no attendee
  //     selection get included for everyone)
  const scopedEvents =
    scope === 'member' && memberId
      ? events.filter(e => {
          const attendees = e.event_attendees ?? []
          if (attendees.length === 0) return true // family-wide → include
          return attendees.some(a => a.family_member_id === memberId)
        })
      : events

  if (scopedEvents.length === 0) return null // auto-hide when nothing in scope

  const visible = scopedEvents.slice(0, maxItems)
  const overflow = scopedEvents.length - visible.length

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
              className="text-xs font-mono shrink-0 w-20"
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
