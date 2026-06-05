/**
 * MomOnlyRoute — SECONDARY enforcement backstop for mom-only routes.
 *
 * The PRIMARY enforcement for mom-only surfaces is navigation invisibility:
 * `getSidebarSections()` (Worker 2) simply does not list these routes for
 * non-mom shells, so the kid never sees a "Studio" button at all. This guard
 * is the safety net for the failure modes invisibility cannot cover — direct
 * URL entry, deep links, stale cache, bookmarks.
 *
 * Founding principle (Convention #39): invisibility over blocking. A user who
 * reaches this card means the invisibility layer failed for that path. The
 * card is therefore deliberately quiet and directive — informative, not
 * decorative. It is NOT meant to be the path of least resistance.
 *
 * Behavior:
 *   - Inside an active View-As session whose data subject is NOT the primary
 *     parent → render the friendly blocked card.
 *   - Outside View-As → pass through to <ProtectedRoute> unchanged. Mom (and
 *     any other authenticated user) reaches the route normally; their access
 *     is governed by ProtectedRoute + the page's own gating, not by this guard.
 *
 * The origin drives the copy + affordances:
 *   - 'mom_viewing'    → mom is the real human. Offer "Exit View As" (returns
 *                        her to the same route, now as herself, where the page
 *                        renders normally).
 *   - 'member_session' → a kid is the real human at the hub. No exit affordance
 *                        (the kid cannot end their own session); offer a gentle
 *                        "Go back" so they are not dead-ended.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useViewAs, type ViewAsOrigin } from '@/lib/permissions/ViewAsProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface MomOnlyBlockedCardProps {
  origin: ViewAsOrigin | null
  onExit: () => void
  onBack: () => void
}

function MomOnlyBlockedCard({ origin, onExit, onBack }: MomOnlyBlockedCardProps) {
  const isMemberSession = origin === 'member_session'

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
      >
        <Lock size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Parent-only area
      </h2>
      <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {isMemberSession
          ? "Ask mom to help with this — it's a parent-only area."
          : 'This is a mom-only area. Tap Exit View As to access it.'}
      </p>
      {isMemberSession ? (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
          }}
        >
          Go back
        </button>
      ) : (
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
          }}
        >
          Exit View As
        </button>
      )}
    </div>
  )
}

interface MomOnlyRouteProps {
  children: ReactNode
}

export function MomOnlyRoute({ children }: MomOnlyRouteProps) {
  const { member, isViewAs, origin } = useEffectiveMember()
  const { stopViewAs } = useViewAs()
  const navigate = useNavigate()

  // Backstop only — block when a View-As session is active and the data
  // subject is not the primary parent. Outside View-As, pass straight through.
  if (isViewAs && member?.role !== 'primary_parent') {
    return (
      <MomOnlyBlockedCard
        origin={origin}
        onExit={() => { void stopViewAs() }}
        onBack={() => navigate(-1)}
      />
    )
  }

  return <ProtectedRoute>{children}</ProtectedRoute>
}
