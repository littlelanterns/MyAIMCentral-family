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
 *   - Any data subject who is NOT the primary parent → render the friendly
 *     blocked card. This covers BOTH View-As sessions AND direct-URL entry by
 *     a non-mom member on their own login (additional_adult, teens with PIN
 *     shadow sessions). Closed 2026-06-09 (role-scoping leak pass): previously
 *     this guard only fired inside View-As, so dad on his own login could
 *     reach mom-only pages by typing the URL.
 *   - Mom (primary_parent) → pass through to <ProtectedRoute> unchanged.
 *   - While the member record is still loading → neutral empty frame (no
 *     content flash for non-mom, no false block for mom).
 *
 * The origin drives the copy + affordances:
 *   - 'mom_viewing'    → mom is the real human. Offer "Exit View As" (returns
 *                        her to the same route, now as herself, where the page
 *                        renders normally).
 *   - 'member_session' → a kid is the real human at the hub. No exit affordance
 *                        (the kid cannot end their own session); offer a gentle
 *                        "Go back" so they are not dead-ended.
 *   - own login        → dad/teen reached it directly. Gentle "Go back".
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
  isViewAs: boolean
  onExit: () => void
  onBack: () => void
}

function MomOnlyBlockedCard({ origin, isViewAs, onExit, onBack }: MomOnlyBlockedCardProps) {
  // "Exit View As" only makes sense when mom is the real human behind a
  // View-As session. Kid-at-hub sessions and non-mom members on their own
  // login both get the gentle "Go back" path.
  const isMomViewing = isViewAs && origin === 'mom_viewing'

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
        {isMomViewing
          ? 'This is a mom-only area. Tap Exit View As to access it.'
          : "Ask mom to help with this — it's a parent-only area."}
      </p>
      {isMomViewing ? (
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
      ) : (
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

  // While the member record loads, render a neutral frame inside the auth
  // guard — no content flash for non-mom, no false block for mom.
  if (!member) {
    return (
      <ProtectedRoute>
        <div className="min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }} />
      </ProtectedRoute>
    )
  }

  // Block ANY non-mom data subject — View-As sessions AND direct-URL entry by
  // a non-mom member on their own login (2026-06-09 role-scoping leak pass;
  // previously only View-As sessions were blocked, so dad on his own login
  // could reach mom-only pages by typing the URL).
  if (member.role !== 'primary_parent') {
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
