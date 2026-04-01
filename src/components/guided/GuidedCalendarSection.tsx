/**
 * PRD-25: Guided Calendar Section
 * Self-only filtered calendar view (day view default).
 */

import { CalendarWidget } from '@/components/calendar'

interface GuidedCalendarSectionProps {
  memberId: string
}

export function GuidedCalendarSection({ memberId: _memberId }: GuidedCalendarSectionProps) {
  // CalendarWidget currently shows all family events.
  // Self-only filtering will be added when CalendarWidget gains memberIds prop for filtering.
  // For now, renders the standard week view.
  return <CalendarWidget viewMode="week" />
}
