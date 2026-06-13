/**
 * MyRewardsPage — member-facing rewards surface (KIDS-REWARDS-PAGE Slice 2).
 *
 * Route: /my-rewards (Guided / Independent / Adult shells). Visibility is
 * gated PER-CHILD by `family_members.preferences.show_my_rewards` — DEFAULT
 * ON (founder ruling 2026-06-12); mom can turn it off per member, which hides
 * the nav entry (invisibility-over-blocking). Direct-URL reach while the page
 * is off shows a friendly card, never a hard block.
 *
 * Sections (mom opt-in per kid, gate Q1): Points, Custom Rewards (+ click-in
 * Previously Redeemed history), Victories, Money owed (Convention #271 —
 * same source as the Balance page). Creatures/Coloring land in Slice 3;
 * Propose-a-Reward in Slice 4. Play shell uses /rewards (PlayRewards), not
 * this page.
 *
 * View As: renders the EFFECTIVE member's page (useEffectiveMember). Kid-final
 * self-redeem is offered only on the member's own real auth session —
 * redeem_own_prize is earner-auth-only (Convention #39).
 */

import { Gift } from 'lucide-react'
import { FeatureGuide, FeatureIcon } from '@/components/shared'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useMyRewardsSettings } from '@/hooks/useMyRewardsSettings'
import { MyRewards } from '@/components/rewards/MyRewards'

export function MyRewardsPage() {
  const { member, isViewAs } = useEffectiveMember()
  const { data: authMember } = useFamilyMember()
  const { data: settings } = useMyRewardsSettings(member?.id ?? null)

  if (!member || !settings) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Loading...
      </div>
    )
  }

  const isOwnSession = !isViewAs && authMember?.id === member.id

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

      <FeatureGuide featureKey="my_rewards_page" />

      {settings.showMyRewards ? (
        <MyRewards member={member} variant="standard" isOwnSession={isOwnSession} />
      ) : (
        <div
          data-testid="my-rewards-not-enabled"
          className="flex flex-col items-center gap-3 rounded-xl p-8 text-center"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Gift size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            This page isn't set up yet.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            A parent can turn it on from Gamification Settings.
          </p>
        </div>
      )}
    </div>
  )
}
