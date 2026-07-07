/**
 * RedeemedHistoryModal — KIDS-REWARDS-PAGE Slice 2 (gate Pillar 4 + Q8).
 *
 * The "Previously Redeemed" click-in history for a member's My Rewards page.
 * NOT always visible — opened from the Custom Rewards section button only.
 *
 * Shows redeemed earned_prizes ONLY (Q8 — money history stays in the ledger):
 * what they earned, HOW they earned it (provenance resolver, recon Section 4),
 * WHEN they earned it, when it was redeemed, and who marked it redeemed.
 */

import { Gift, History, PartyPopper } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import { useEarnedPrizes } from '@/hooks/useRewardReveals'
import { useRewardProvenance } from '@/hooks/useRewardProvenance'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import type { EarnedPrize } from '@/types/reward-reveals'

interface RedeemedHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  familyId: string
  /**
   * FAMILY-GOALS-PRIZES Build Item 7: redeemed Family Prizes this member
   * participated in (family_member_id=NULL rows, so they're invisible to the
   * member-scoped useEarnedPrizes(memberId) query below). Caller resolves via
   * useRecentlyRedeemedPrizes() filtered to source_type='family_goal' AND
   * shared_with_member_ids.includes(memberId). Merged in, not a replacement —
   * RedeemedHistoryModal stays the ONE reusable "reward history" surface
   * (Pillar 4) regardless of source.
   */
  additionalRedeemed?: EarnedPrize[]
}

export function RedeemedHistoryModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  familyId,
  additionalRedeemed = [],
}: RedeemedHistoryModalProps) {
  const { data: prizes = [] } = useEarnedPrizes(memberId)
  const { data: members = [] } = useFamilyMembers(familyId)

  const redeemed = [...prizes, ...additionalRedeemed]
    .filter(p => p.redeemed_at)
    .sort(
      (a, b) =>
        new Date(b.redeemed_at!).getTime() - new Date(a.redeemed_at!).getTime(),
    )

  const { data: provenance = {} } = useRewardProvenance(redeemed)
  const memberNames = new Map(members.map(m => [m.id, m.display_name]))

  return (
    <ModalV2
      id={`redeemed-history-${memberId}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Previously Redeemed"
      subtitle={`${memberName}'s reward history`}
    >
      <div data-testid="redeemed-history" className="space-y-2">
        {redeemed.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 py-8 text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <History size={32} style={{ opacity: 0.5 }} />
            <p className="text-sm">No redeemed rewards yet.</p>
          </div>
        ) : (
          redeemed.map(prize => (
            <RedeemedRow
              key={prize.id}
              prize={prize}
              earnedBy={provenance[prize.id] ?? null}
              redeemedByName={
                prize.redeemed_by ? memberNames.get(prize.redeemed_by) ?? null : null
              }
              isSelfRedeemed={prize.redeemed_by === memberId}
            />
          ))
        )}
      </div>
    </ModalV2>
  )
}

function RedeemedRow({
  prize,
  earnedBy,
  redeemedByName,
  isSelfRedeemed,
}: {
  prize: EarnedPrize
  earnedBy: string | null
  redeemedByName: string | null
  isSelfRedeemed: boolean
}) {
  const displayName = prize.prize_name || prize.prize_text || 'Reward'
  const hasImage = prize.prize_type === 'image' && prize.prize_image_url
  const hasPlatformImage = prize.prize_type === 'platform_image' && prize.prize_asset_key
  const isCelebration = prize.prize_type === 'celebration_only'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Thumb */}
      <div className="shrink-0">
        {hasImage ? (
          <img
            src={prize.prize_image_url!}
            alt={displayName}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : hasPlatformImage ? (
          <PlatformAssetImage
            assetKey={prize.prize_asset_key!}
            fallback={<Gift size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />}
            size={48}
            assetSize={128}
            variant="B"
          />
        ) : isCelebration ? (
          <PartyPopper size={28} style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }} />
        ) : (
          <Gift size={28} style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {displayName}
        </p>
        {earnedBy && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Earned by: {earnedBy}
          </p>
        )}
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Earned {new Date(prize.earned_at).toLocaleDateString()}
          {prize.redeemed_at && (
            <>
              {' · Used '}
              {new Date(prize.redeemed_at).toLocaleDateString()}
              {!isSelfRedeemed && redeemedByName && ` (marked by ${redeemedByName})`}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
