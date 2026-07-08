/**
 * SafetyRecipientRoute — recipient-aware route guard for `/safety-flags`
 * (PRD-30 Screen 4). GrantedRoute-shape guard, but the grant model here is
 * `safety_notification_recipients`, not `member_permissions` — PRD-30 owns
 * its own recipient table (feature decision file: "PRD-30's own table +
 * Settings UI is the authority").
 *
 * Behavior:
 *  - mom (primary_parent)                       → pass (always an active
 *    recipient, auto-provisioned)
 *  - additional_adult holding an active recipient row → pass
 *  - everyone else (kids, ungranted dad, View-As data subjects)
 *                                                → friendly blocked card
 *
 * Same invisibility-over-blocking architecture as MomOnlyRoute/GrantedRoute:
 * this route is never a sidebar entry (Convention #16 N/A — reached only via
 * Settings link, FO section, and notification tap-through), so this guard is
 * the safety net, not the primary control.
 */

import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MomOnlyBlockedCard } from './MomOnlyRoute'
import { useIsSafetyRecipient } from '@/hooks/useSafetyMonitoring'

export function SafetyRecipientRoute({ children }: { children: ReactNode }) {
  const { member, isViewAs, origin } = useEffectiveMember()
  const { stopViewAs } = useViewAs()
  const navigate = useNavigate()
  const { isRecipient, isLoading } = useIsSafetyRecipient(
    member ? { id: member.id, family_id: member.family_id, role: member.role } : null,
  )

  if (!member || isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }} />
      </ProtectedRoute>
    )
  }

  if (!isRecipient) {
    return (
      <MomOnlyBlockedCard
        origin={origin}
        isViewAs={isViewAs}
        onExit={() => { void stopViewAs() }}
        onBack={() => navigate(-1)}
      />
    )
  }

  return <ProtectedRoute>{children}</ProtectedRoute>
}
