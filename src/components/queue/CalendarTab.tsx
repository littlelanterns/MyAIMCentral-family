/**
 * CalendarTab (PRD-17 Screen 2)
 *
 * Placeholder implementation — shows correct empty state.
 * Full calendar approval flow deferred to PRD-14B.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { CalendarCheck } from 'lucide-react'
import { EmptyState } from '@/components/shared'

export function CalendarTab() {
  // STUB: Full implementation wires to PRD-14B calendar event approval flow.
  // Query: calendar_events WHERE status = 'pending' AND family_id = currentFamilyId
  return (
    <div style={{ padding: '2rem 1rem' }}>
      <EmptyState
        icon={<CalendarCheck size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
        title="No events waiting for approval."
        description="When your kids add events, they'll appear here for your review."
      />
    </div>
  )
}
