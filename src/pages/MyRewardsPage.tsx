/**
 * MyRewardsPage — kid-facing rewards surface (stub).
 *
 * Route: /my-rewards. Visibility is gated PER-CHILD by
 * `family_members.preferences.show_my_rewards` (read via `useShowMyRewards`,
 * default false) which controls whether the sidebar entry renders at all
 * (invisibility-over-blocking, founder Q2a). This page is the kid-facing
 * counterpart to mom's `/prize-board` (which is hard-blocked from kid shells
 * via `<MomOnlyRoute>`).
 *
 * THIS BUILD ships only the route + sidebar entry + per-child toggle gate +
 * shell wiring. The real content (prizes earned, allowance balance, money for
 * tasks — scoped to ONLY this child, respecting PRD-28 `child_can_see_finances`
 * for dollar visibility) is a scoped follow-up build with its own
 * feature-decision doc. Until then this renders the demand-validation card.
 *
 * Convention #39 (View As Identity-Scope Architecture), founder Q2a (2026-05-25).
 */

import { Gift } from 'lucide-react'
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
import { FeatureIcon } from '@/components/shared'

export function MyRewardsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FeatureIcon
          featureKey="my_rewards_page"
          fallback={<Gift size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          size={40}
        />
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          My Rewards
        </h1>
      </div>
      <PlannedExpansionCard featureKey="my_rewards_page" />
    </div>
  )
}
