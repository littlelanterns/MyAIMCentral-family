/**
 * HubCalendarSection — PRD-14D Family Hub
 *
 * Wraps the existing CalendarWidget for the Hub context.
 * Passes hubMode=true to filter events by show_on_hub.
 * Supports week/month/both view modes from Hub config.
 */

import { CalendarWidget } from '@/components/calendar'
import { MonthViewModal } from '@/components/calendar/MonthViewModal'
import { useFamilyHubConfig } from '@/hooks/useFamilyHubConfig'
import { useFamily } from '@/hooks/useFamily'

export function HubCalendarSection() {
  const { data: family } = useFamily()
  const { data: config } = useFamilyHubConfig(family?.id)

  const calendarView = ((config?.preferences as Record<string, unknown>)?.hub_calendar_view as string) ?? 'week'

  return (
    <div data-testid="hub-calendar-section" className="space-y-3">
      {/* Week view */}
      {(calendarView === 'week' || calendarView === 'both') && (
        <CalendarWidget hubMode />
      )}

      {/* Month view — rendered inline (not as modal) */}
      {(calendarView === 'month' || calendarView === 'both') && (
        <MonthViewModal
          isOpen={true}
          onClose={() => {/* no-op — inline rendering, not a closeable modal */}}
          onDateSelect={() => {/* no-op for Hub — just visual */}}
          inline
        />
      )}
    </div>
  )
}
