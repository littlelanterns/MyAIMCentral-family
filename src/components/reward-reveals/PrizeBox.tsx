/**
 * PrizeBox — Kid-facing view of earned but unredeemed prizes.
 *
 * Fun card grid showing what they've earned. Redeemed prizes show with a
 * faded/checked style behind a "Show redeemed" toggle.
 *
 * Redeem modes (KIDS-REWARDS-PAGE Q2, founder-approved 2026-06-12):
 *   - canRedeem (parents): "Redeemed!" button — direct UPDATE via
 *     useRedeemPrize (Prize Board behavior, unchanged).
 *   - selfRedeem (Guided/Independent kid viewing own prizes): "Redeem" button
 *     with a confirmation dialog → redeem_own_prize RPC (kid-final; quiet mom
 *     notification fires server-side).
 *   - playMode: NO redeem button — cards show "Ask a grown-up to use it!"
 *     Mom redeems from the Prize Board, as today.
 *
 * Display fix (Slice 1): cards render prize_text when prize_name is absent —
 * custom_reward text prizes previously rendered as a bare gift icon.
 *
 * Can be rendered as: a standalone dashboard section, inside a modal or
 * settings page, or on the Finances tab for families using allowance.
 */

import { useState } from 'react'
import { Gift, Check, PartyPopper, HandHelping } from 'lucide-react'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import {
  useEarnedPrizes,
  useRedeemPrize,
  useSelfRedeemPrize,
} from '@/hooks/useRewardReveals'
import type { EarnedPrize } from '@/types/reward-reveals'

interface PrizeBoxProps {
  memberId: string
  /** The current user's member ID (to populate redeemed_by) */
  currentMemberId: string
  /** Whether the viewer can mark prizes as redeemed (mom/dad only) */
  canRedeem: boolean
  /**
   * KIDS-REWARDS-PAGE Q2: kid-final self-redeem. Only pass true when the
   * viewer IS the earner on a Guided/Independent/Adult shell. Mutually
   * exclusive with canRedeem and playMode.
   */
  selfRedeem?: boolean
  /** Play shell: no redeem button; cards show "Ask a grown-up to use it!" */
  playMode?: boolean
  /** Fun or compact mode */
  variant?: 'fun' | 'compact'
  /**
   * KIDS-REWARDS-PAGE Slice 2: hide the inline "Show redeemed" toggle + grid.
   * The My Rewards page surfaces redeemed prizes through the click-in
   * Previously Redeemed history modal instead (gate Pillar 4 — history is
   * not always visible). Default false — existing call sites unchanged.
   */
  hideRedeemed?: boolean
}

export function PrizeBox({
  memberId,
  currentMemberId,
  canRedeem,
  selfRedeem = false,
  playMode = false,
  variant = 'fun',
  hideRedeemed = false,
}: PrizeBoxProps) {
  const { data: prizes = [], isLoading } = useEarnedPrizes(memberId)
  const redeemMutation = useRedeemPrize()
  const selfRedeemMutation = useSelfRedeemPrize()
  const [showRedeemed, setShowRedeemed] = useState(false)
  const [confirmingPrize, setConfirmingPrize] = useState<EarnedPrize | null>(null)

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
            ? 'No prizes yet! Keep going and they’ll show up here.'
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

  const handleSelfRedeemConfirmed = (prize: EarnedPrize) => {
    selfRedeemMutation.mutate({ prizeId: prize.id, memberId })
    setConfirmingPrize(null)
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

        {!hideRedeemed && redeemed.length > 0 && (
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
              selfRedeem={selfRedeem}
              playMode={playMode}
              onRedeem={handleRedeem}
              onSelfRedeem={(p) => setConfirmingPrize(p)}
              variant={variant}
              isRedeeming={redeemMutation.isPending || selfRedeemMutation.isPending}
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
      {!hideRedeemed && showRedeemed && redeemed.length > 0 && (
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
                selfRedeem={false}
                playMode={playMode}
                onRedeem={() => {}}
                onSelfRedeem={() => {}}
                variant="compact"
                redeemed
              />
            ))}
          </div>
        </div>
      )}

      {/* Self-redeem confirmation dialog (Q2: "Use your reward now?") */}
      {confirmingPrize && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Use your reward?"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.45)',
            padding: '1rem',
          }}
          onClick={() => setConfirmingPrize(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--vibe-radius-card, 1rem)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              maxWidth: '360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <PartyPopper size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              Use your reward now?
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {prizeDisplayName(confirmingPrize)}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setConfirmingPrize(null)}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  borderRadius: 'var(--vibe-radius-button, 0.5rem)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={() => handleSelfRedeemConfirmed(confirmingPrize)}
                disabled={selfRedeemMutation.isPending}
                data-testid="confirm-self-redeem"
                style={{
                  flex: 1,
                  minHeight: '44px',
                  borderRadius: 'var(--vibe-radius-button, 0.5rem)',
                  border: 'none',
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary, #fff)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {selfRedeemMutation.isPending ? '...' : 'Use it!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** prize_name first, prize_text fallback — custom text rewards have text only */
function prizeDisplayName(prize: EarnedPrize): string {
  return prize.prize_name || prize.prize_text || 'Your prize'
}

// ── Individual prize card ──

function PrizeCard({
  prize,
  canRedeem,
  selfRedeem,
  playMode,
  onRedeem,
  onSelfRedeem,
  variant,
  redeemed = false,
  isRedeeming = false,
}: {
  prize: EarnedPrize
  canRedeem: boolean
  selfRedeem: boolean
  playMode: boolean
  onRedeem: (prize: EarnedPrize) => void
  onSelfRedeem: (prize: EarnedPrize) => void
  variant: 'fun' | 'compact'
  redeemed?: boolean
  isRedeeming?: boolean
}) {
  const hasImage = prize.prize_type === 'image' && prize.prize_image_url
  const hasPlatformImage = prize.prize_type === 'platform_image' && prize.prize_asset_key
  const isCelebration = prize.prize_type === 'celebration_only'
  const imageSize = variant === 'fun' ? 80 : 56
  // Display fix: prize_text fallback so text-only custom rewards show words
  const displayName = prize.prize_name || prize.prize_text || null

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
          alt={displayName ?? 'Prize'}
          style={{
            width: `${imageSize}px`,
            height: `${imageSize}px`,
            objectFit: 'cover',
            borderRadius: 'var(--vibe-radius-card, 0.5rem)',
          }}
        />
      )}

      {hasPlatformImage && (
        <PlatformAssetImage
          assetKey={prize.prize_asset_key!}
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

      {/* Prize name (prize_text fallback) */}
      {displayName && (
        <div
          style={{
            fontSize: variant === 'fun' ? 'var(--font-size-sm)' : 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          {displayName}
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

      {/* Mark Redeemed button (mom/dad — Prize Board behavior) */}
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

      {/* Kid self-redeem (Q2 — confirmation handled by parent component) */}
      {selfRedeem && !canRedeem && !playMode && !redeemed && (
        <button
          type="button"
          onClick={() => onSelfRedeem(prize)}
          disabled={isRedeeming}
          data-testid="self-redeem-button"
          style={{
            marginTop: '0.25rem',
            padding: '0.375rem 0.75rem',
            minHeight: '36px',
            borderRadius: '9999px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-text-on-primary, #fff)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Redeem
        </button>
      )}

      {/* Play shell: no redeem — warm grown-up prompt (Q2) */}
      {playMode && !redeemed && (
        <div
          style={{
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <HandHelping size={14} />
          Ask a grown-up to use it!
        </div>
      )}
    </div>
  )
}
