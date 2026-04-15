/**
 * RewardRevealModal — Universal reward celebration
 *
 * Full-screen modal that plays a reveal animation (video or CSS), then
 * slides in a prize card showing the reward content. Works for any
 * completable source — tasks, widgets, lists, intentions, etc.
 *
 * Timing:
 *   - Video plays immediately on mount (muted + playsinline for iOS)
 *   - At video end (or 0.5s before via timeupdate), prize card slides in
 *   - SparkleOverlay + ConfettiBurst fire during video→card transition
 *   - Auto-dismiss after 6s from card appearance, or tap anywhere
 *
 * Rules:
 *   - 1:1 square video container
 *   - All colors via CSS custom properties (theme-tokened)
 *   - {reward} substitution happens BEFORE this component receives text
 *   - prefers-reduced-motion: skip video, show prize card directly
 *   - iOS Safari: <video playsinline muted> — never trigger native fullscreen
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { ConfettiBurst } from '@/components/shared/ConfettiBurst'
import { FeatureIcon } from '@/components/shared/FeatureIcon'
import { Gift } from 'lucide-react'
import type { ResolvedReveal } from '@/types/reward-reveals'

interface RewardRevealModalProps {
  /** The fully resolved reveal (animation + prize) from useCheckRevealTrigger */
  reveal: ResolvedReveal
  /** Called when the modal should dismiss */
  onClose: () => void
  /** Called after the reveal fires and auto-dismiss starts — use to record times_revealed */
  onRevealed?: () => void
}

export function RewardRevealModal({
  reveal,
  onClose,
  onRevealed,
}: RewardRevealModalProps) {
  const { animation, prize } = reveal
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCard, setShowCard] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [showSparkle, setShowSparkle] = useState(true)
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const revealedRef = useRef(false)

  const isVideo = animation.reveal_type === 'video' && animation.video_url
  const isCss = animation.reveal_type === 'css'
  const isCelebrationOnly = prize.prize_type === 'celebration_only'

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Fire onRevealed once when card appears
  useEffect(() => {
    if (showCard && !revealedRef.current) {
      revealedRef.current = true
      onRevealed?.()
    }
  }, [showCard, onRevealed])

  // Auto-dismiss 6s after card appears
  useEffect(() => {
    if (!showCard) return
    autoDismissRef.current = setTimeout(onClose, 6000)
    return () => clearTimeout(autoDismissRef.current)
  }, [showCard, onClose])

  // Skip video if reduced motion or no video
  useEffect(() => {
    if (prefersReducedMotion || (!isVideo && !isCss)) {
      setShowCard(true)
    }
  }, [prefersReducedMotion, isVideo, isCss])

  // CSS reveals: show card after a short delay
  useEffect(() => {
    if (isCss && !prefersReducedMotion) {
      const timer = setTimeout(() => setShowCard(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isCss, prefersReducedMotion])

  const handleVideoEnd = useCallback(() => {
    setShowCard(true)
  }, [])

  // Show card 0.5s before video ends for smoother overlap
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || showCard) return
    if (v.duration > 0 && v.currentTime >= v.duration - 0.5) {
      setShowCard(true)
    }
  }, [showCard])

  const handleTap = useCallback(() => {
    clearTimeout(autoDismissRef.current)
    onClose()
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isCelebrationOnly
          ? 'Celebration!'
          : `Reward: ${prize.prize_name || 'Congratulations!'}`
      }
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        cursor: 'pointer',
      }}
    >
      {/* Video reveal — 1:1 square container */}
      {isVideo && !showCard && (
        <video
          ref={videoRef}
          src={animation.video_url!}
          autoPlay
          playsInline
          muted
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: 'min(90vw, 400px)',
            height: 'min(90vw, 400px)',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            objectFit: 'contain',
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* CSS reveal placeholder */}
      {isCss && !showCard && (
        <CssRevealRenderer cssComponent={animation.css_component} />
      )}

      {/* Prize card — slides in from bottom */}
      {showCard && !isCelebrationOnly && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            maxWidth: '340px',
            width: '90vw',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card)',
            border: '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
            animation: prefersReducedMotion ? 'none' : 'rewardSlideIn 0.5s ease-out',
            textAlign: 'center',
          }}
        >
          <PrizeCardContent prize={prize} />

          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted, var(--color-text-secondary))',
              opacity: 0.7,
              marginTop: '0.25rem',
            }}
          >
            Tap anywhere to continue
          </div>
        </div>
      )}

      {/* Celebration-only: just show a brief "Hooray!" after video */}
      {showCard && isCelebrationOnly && (
        <div
          style={{
            fontSize: 'var(--font-size-2xl, 1.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-on-primary, #fff)',
            animation: prefersReducedMotion ? 'none' : 'rewardSlideIn 0.5s ease-out',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {prize.prize_text || '🎉'}
        </div>
      )}

      {/* Effects */}
      {showConfetti && (
        <ConfettiBurst
          intensity="maximum"
          onComplete={() => setShowConfetti(false)}
        />
      )}
      {showSparkle && (
        <SparkleOverlay
          type="full_celebration"
          onComplete={() => setShowSparkle(false)}
        />
      )}

      <style>{`
        @keyframes rewardSlideIn {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="rewardSlideIn"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── Prize card content renderer ──

function PrizeCardContent({
  prize,
}: {
  prize: ResolvedReveal['prize']
}) {
  const hasImage = prize.prize_type === 'image' && prize.prize_image_url
  const hasPlatformImage = prize.prize_type === 'platform_image' && prize.prize_asset_key

  return (
    <>
      {/* Prize image — uploaded by mom */}
      {hasImage && (
        <img
          src={prize.prize_image_url!}
          alt={prize.prize_name || 'Prize'}
          style={{
            width: '140px',
            height: '140px',
            objectFit: 'cover',
            borderRadius: 'var(--vibe-radius-card, 0.75rem)',
            border: '1px solid var(--color-border-default)',
          }}
        />
      )}

      {/* Prize image — from platform_assets */}
      {hasPlatformImage && (
        <FeatureIcon
          featureKey={prize.prize_asset_key!}
          fallback={<Gift size={80} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          size={140}
          assetSize={512}
          variant="B"
        />
      )}

      {/* Prize name */}
      {prize.prize_name && (
        <div
          style={{
            fontSize: 'var(--font-size-xl, 1.25rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {prize.prize_name}
        </div>
      )}

      {/* Prize message text */}
      {prize.prize_text && (
        <div
          style={{
            fontSize: 'var(--font-size-base, 1rem)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {prize.prize_text}
        </div>
      )}
    </>
  )
}

// ── CSS reveal component renderer (placeholder for spinner/card_flip/door_open) ──

function CssRevealRenderer({
  cssComponent,
}: {
  cssComponent: string | null
}) {
  // CSS reveals are named components (RandomizerSpinner, CardFlipReveal, DoorOpenReveal).
  // For now, render a generic animation. Phase 4 or later can wire the named components.
  return (
    <div
      data-css-reveal={cssComponent ?? undefined}
      style={{
        width: 'min(80vw, 300px)',
        height: 'min(80vw, 300px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
        animation: 'cssRevealPulse 1.5s ease-in-out infinite',
      }}
    >
      <Gift
        size={64}
        style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.8 }}
      />
      <style>{`
        @keyframes cssRevealPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
