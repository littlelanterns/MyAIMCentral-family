/**
 * RequestsTab (PRD-17 Screen 4)
 *
 * Placeholder implementation — shows correct empty state.
 * Full requests flow deferred to PRD-15.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { HandHelping } from 'lucide-react'
import { EmptyState } from '@/components/shared'

export function RequestsTab() {
  // STUB: Full implementation wires to PRD-15 family_requests flow.
  // Query: family_requests WHERE status = 'pending' AND (assigned_to = currentMemberId OR family_id)
  return (
    <div style={{ padding: '2rem 1rem' }}>
      <EmptyState
        icon={<HandHelping size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
        title="No requests waiting."
        description="When your family sends you requests, they'll appear here."
      />
    </div>
  )
}
