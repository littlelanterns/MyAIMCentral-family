/**
 * GrantedRoute — grant-aware route guard for surfaces that are mom-only BY
 * DEFAULT but grantable to additional adults (PERMISSIONS-WIRING build,
 * founder gate 2026-06-09).
 *
 * Same architecture as MomOnlyRoute: navigation invisibility is the PRIMARY
 * enforcement (getSidebarSections only lists these routes for mom or granted
 * adults); this guard is the safety net for direct URLs / deep links.
 *
 * Behavior:
 *  - mom (primary_parent)                      → pass
 *  - additional_adult holding the grant        → pass
 *      grant='studio' / 'reward_rules'  → family-wide row at view+
 *      grant='financial_tracking'       → ≥1 per-kid row at view+
 *  - everyone else (incl. View-As data subjects without the grant)
 *                                              → friendly blocked card
 *
 * Data scoping inside the admitted page remains the page's job
 * (useViewableMembers / useManagementGrants) — this guard only opens the door.
 */

import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MomOnlyBlockedCard } from './MomOnlyRoute'
import { useManagementGrants } from './useManagementGrants'

export type GrantedRouteKey = 'studio' | 'reward_rules' | 'financial_tracking'

interface GrantedRouteProps {
  grant: GrantedRouteKey
  children: ReactNode
}

export function GrantedRoute({ grant, children }: GrantedRouteProps) {
  const { member, isViewAs, origin } = useEffectiveMember()
  const { stopViewAs } = useViewAs()
  const navigate = useNavigate()
  const grants = useManagementGrants(member)

  // Neutral frame while the member record or grants load — no content flash,
  // no false block (matches MomOnlyRoute).
  if (!member || grants.isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }} />
      </ProtectedRoute>
    )
  }

  const allowed =
    member.role === 'primary_parent' ||
    (member.role === 'additional_adult' &&
      (grant === 'studio'
        ? grants.studioLevel !== 'none'
        : grant === 'reward_rules'
          ? grants.rewardRulesLevel !== 'none'
          : grants.financeMaxLevel !== 'none'))

  if (!allowed) {
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
