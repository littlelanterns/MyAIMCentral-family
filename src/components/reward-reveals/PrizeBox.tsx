/**
 * PrizeBox — Kid-facing view of earned but unredeemed prizes.
 *
 * Fun card grid showing what they've earned. Mom sees "Mark Redeemed"
 * buttons; kids just see their prize cards with a warm "waiting for
 * you!" framing. Redeemed prizes show with a faded/checked style.
 *
 * Can be rendered as:
 *   - A standalone section on a dashboard
 *   - Inside a modal or settings page
 *   - On the Finances tab for families using allowance
 */

import { useState } from 'react'
import { Gift, Check, PartyPopper } from 'lucide-react'
import { FeatureIcon } from '@/components/shared/FeatureIcon'
import {
  useEarnedPrizes,
  useRedeemPrize,
} from '@/hooks/useRewardReveals'
import type { EarnedPrize } from '@/types/reward-reveals'

interface PrizeBoxProps {
  memberId: string
  /** The current user's member ID (to populate redeemed_by) */
  currentMemberId: string
  /** Whether the viewer can mark prizes as redeemed (mom/dad only) */
  canRedeem: boolean
  /** Fun or compact mode */
  variant?: 'fun' | 'compact'
}

export function PrizeBox({
  memberId,
  currentMemberId,
  canRedeem,
  variant = 'fun',
}: PrizeBoxProps) {
  const { data: prizes = [], isLoading } = useEarnedPrizes(memberId)
  const redeemMutation = useRedeemPrize()
  const [showRedeemed, setShowRedeemed] = useState(false)

  const unredeemed = prizes.filter((p) => !p.redeemed_at)
  const redeemed = prizes.filter((p) => p.redeemed_at)

  if (isLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading your prizes...
      </div>
    )
  }

  if (prizes.length === 0) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Gift
          size={48}
          style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}
        />
        <div
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {variant === 'fun'
            ? 'No prizes yet! Keep going and they\u2019ll show up here.'
            : 'No earned prizes'}
        </div>
      </div>
    )
  }

  const handleRedeem = (prize: EarnedPrize) => {
    redeemMutation.mutate({
      prizeId: prize.id,
      redeemedBy: currentMemberId,
      memberId,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: variant === 'fun' ? 'var(--font-size-lg)' : 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          <Gift size={variant === 'fun' ? 24 : 18} style={{ color: 'var(--color-btn-primary-bg)' }} />
          {variant === 'fun' ? 'My Prize Box' : 'Prize Box'}
          {unredeemed.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-text-on-primary, #fff)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
              }}
            >
              {unredeemed.length}
            </span>
          )}
        </div>

        {redeemed.length > 0 && (
          <button
            type="button"
            onClick={() => setShowRedeemed(!showRedeemed)}
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showRedeemed ? 'Hide redeemed' : `Show redeemed (${redeemed.length})`}
          </button>
        )}
      </div>

      {/* Unredeemed prizes */}
      {unredeemed.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              variant === 'fun'
                ? 'repeat(auto-fill, minmax(140px, 1fr))'
                : 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: variant === 'fun' ? '0.75rem' : '0.5rem',
          }}
        >
          {unredeemed.map((prize) => (
            <PrizeCard
              key={prize.id}
              prize={prize}
              canRedeem={canRedeem}
              onRedeem={handleRedeem}
              variant={variant}
              isRedeeming={redeemMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Empty unredeemed */}
      {unredeemed.length === 0 && (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          All prizes redeemed! Nice work.
        </div>
      )}

      {/* Redeemed prizes (collapsed by default) */}
      {showRedeemed && redeemed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            Redeemed
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.5rem',
              opacity: 0.6,
            }}
          >
            {redeemed.map((prize) => (
              <PrizeCard
                key={prize.id}
                prize={prize}
                canRedeem={false}
                onRedeem={() => {}}
                variant="compact"
                redeemed
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Individual prize card ──

function PrizeCard({
  prize,
  canRedeem,
  onRedeem,
  variant,
  redeemed = false,
  isRedeeming = false,
}: {
  prize: EarnedPrize
  canRedeem: boolean
  onRedeem: (prize: EarnedPrize) => void
  variant: 'fun' | 'compact'
  redeemed?: boolean
  isRedeeming?: boolean
}) {
  const hasImage = prize.prize_type === 'image' && prize.prize_image_url
  const hasPlatformImage = prize.prize_type === 'platform_image' && prize.prize_asset_key
  const isCelebration = prize.prize_type === 'celebration_only'
  const imageSize = variant === 'fun' ? 80 : 56

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.375rem',
        padding: variant === 'fun' ? '0.75rem' : '0.5rem',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: redeemed
          ? '1px solid var(--color-border)'
          : '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Redeemed checkmark */}
      {redeemed && (
        <div
          style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            width: '20px',
            height: '20px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-success, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={12} style={{ color: '#fff' }} />
        </div>
      )}

      {/* Prize image */}
      {hasImage && (
        <img
          src={prize.prize_image_url!}
          alt={prize.prize_name || 'Prize'}
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
            objectFit: 'cover',
            borderRadius: 'var(--vibe-radius-card, 0.5rem)',
          }}
        />
      )}

      {hasPlatformImage && (
        <FeatureIcon
          featureKey={prize.prize_asset_key!}
          fallback={<Gift size={imageSize * 0.6} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          size={imageSize}
          assetSize={128}
          variant="B"
        />
      )}

      {!hasImage && !hasPlatformImage && !isCelebration && (
        <Gift
          size={imageSize * 0.6}
          style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }}
        />
      )}

      {isCelebration && (
        <PartyPopper
          size={imageSize * 0.6}
          style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }}
        />
      )}

      {/* Prize name */}
      {prize.prize_name && (
        <div
          style={{
            fontSize: variant === 'fun' ? 'var(--font-size-sm)' : 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          {prize.prize_name}
        </div>
      )}

      {/* Earned date */}
      <div
        style={{
          fontSize: '0.625rem',
          color: 'var(--color-text-muted, var(--color-text-secondary))',
        }}
      >
        {new Date(prize.earned_at).toLocaleDateString()}
      </div>

      {/* Mark Redeemed button (mom only) */}
      {canRedeem && !redeemed && (
        <button
          type="button"
          onClick={() => onRedeem(prize)}
          disabled={isRedeeming}
          style={{
            marginTop: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-text-on-primary, #fff)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isRedeeming ? '...' : 'Redeemed!'}
        </button>
      )}
    </div>
  )
}
