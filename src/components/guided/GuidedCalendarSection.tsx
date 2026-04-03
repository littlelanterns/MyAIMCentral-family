/**
 * PRD-25: Guided Calendar Section
 * Self-only filtered calendar view (day view default).
 */

import { CalendarWidget } from '@/components/calendar'

interface GuidedCalendarSectionProps {
  memberId: string
}

export function GuidedCalendarSection({ memberId }: GuidedCalendarSectionProps) {
  return <CalendarWidget viewMode="week" personalMemberId={memberId} />
}
