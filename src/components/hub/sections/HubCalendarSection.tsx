/**
 * HubCalendarSection — PRD-14D Family Hub
 *
 * Wraps the existing CalendarWidget for the Hub context.
 * Passes hubMode=true to filter events by show_on_hub.
 */

import { CalendarWidget } from '@/components/calendar'

export function HubCalendarSection() {
  return (
    <div data-testid="hub-calendar-section">
      <CalendarWidget hubMode />
    </div>
  )
}
