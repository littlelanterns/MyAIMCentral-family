/**
 * RewardCard — PRD-24 Gamification Foundation
 *
 * The shared "here's what you got" display card. ALL reveal types
 * (CardFlip, ThreeDoors, SpinnerWheel, ScratchOff) terminate into this.
 *
 * Theme-aware via CSS custom properties. Shell-aware text sizing and
 * dismiss timing. Three entry animations: 'expand' (scales up from
 * originRect), 'slide-up' (rises from below), 'fade' (opacity only).
 *
 * Reduced-motion: appears instantly with no animation.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Star, X } from 'lucide-react'
import { useShellAwareMotion } from './useShellAwareMotion'
import { useReducedMotion } from './useReducedMotion'

export interface RewardCardProps {
  /** Reward title — what they earned */
  title: string
  /** Optional longer description */
  description?: string
  /** Optional reward illustration */
  imageUrl?: string
  /** Optional point value to display "+10 ⭐" */
  pointValue?: number
  /** Optional currency icon node (defaults to Star) */
  currencyIcon?: ReactNode
  /** Called when user dismisses the card */
  onDismiss?: () => void
  /** Entry animation. Default 'expand' */
  entryAnimation?: 'expand' | 'slide-up' | 'fade'
  /** For 'expand' — viewport rect to scale up from. Falls back to viewport center. */
  originRect?: DOMRect | { x: number; y: number; width: number; height: number }
  /** Z-index. Default 105 (above RevealSparkle at 100). */
  zIndex?: number
  /** If true, renders inline without backdrop. Default false (modal mode). */
  inline?: boolean
}

export function RewardCard({
  title,
  description,
  imageUrl,
  pointValue,
  currencyIcon,
  onDismiss,
  entryAnimation = 'expand',
  originRect,
  zIndex = 105,
  inline = false,
}: RewardCardProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()
  const [canDismiss, setCanDismiss] = useState(motion.skipDelay === 0)

  // Enforce skip delay so the user can't dismiss before the celebration
  // is visually established. Play shell waits longest (1s).
  useEffect(() => {
    if (motion.skipDelay > 0) {
      const t = setTimeout(() => setCanDismiss(true), motion.skipDelay)
      return () => clearTimeout(t)
    }
  }, [motion.skipDelay])

  // Shell-aware sizing
  const titleSize = motion.isPlay ? '1.875rem' : motion.isGuided ? '1.5rem' : '1.25rem'
  const descSize = motion.isPlay ? '1.125rem' : motion.isGuided ? '1rem' : '0.9375rem'
  const pointsSize = motion.isPlay ? '1.5rem' : motion.isGuided ? '1.25rem' : '1.125rem'
  const cardPadding = motion.isPlay ? '2rem' : motion.isGuided ? '1.75rem' : '1.5rem'
  const cardMaxWidth = motion.isPlay ? '420px' : motion.isGuided ? '380px' : '340px'

  // Pre-compute origin transforms for 'expand' animation
  let originStyle: React.CSSProperties = {}
  if (entryAnimation === 'expand' && originRect) {
    const ox = originRect.x + originRect.width / 2
    const oy = originRect.y + originRect.height / 2
    originStyle = {
      ['--origin-x' as string]: `${ox}px`,
      ['--origin-y' as string]: `${oy}px`,
    } as React.CSSProperties
  }

  // Animation timing
  const entryDuration = prefersReducedMotion ? 0 : Math.round(450 * motion.durationMultiplier)
  const animationName =
    prefersReducedMotion
      ? 'none'
      : entryAnimation === 'expand'
        ? 'rewardCardExpand'
        : entryAnimation === 'slide-up'
          ? 'rewardCardSlideUp'
          : 'rewardCardFade'

  const cardContent = (
    <div
      role="dialog"
      aria-label={`Reward: ${title}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: motion.isPlay ? '1.25rem' : '1rem',
        padding: cardPadding,
        backgroundColor: 'var(--color-bg-card, #FFFFFF)',
        border: '2px solid var(--color-accent, #7C6DD8)',
        borderRadius: 'var(--vibe-radius-modal, 16px)',
        boxShadow:
          '0 20px 60px -10px color-mix(in srgb, var(--color-accent, #7C6DD8) 35%, transparent), 0 8px 24px -4px rgba(0,0,0,0.18)',
        maxWidth: cardMaxWidth,
        width: 'calc(100% - 2rem)',
        textAlign: 'center',
        animation: `${animationName} ${entryDuration}ms ${motion.easing} forwards`,
        willChange: 'transform, opacity',
        ...originStyle,
      }}
    >
      {/* Dismiss X button */}
      {onDismiss && (
        <button
          type="button"
          onClick={() => canDismiss && onDismiss()}
          aria-label="Dismiss reward"
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: motion.touchTargetMin,
            height: motion.touchTargetMin,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            color: 'var(--color-text-secondary, #6B7280)',
            cursor: canDismiss ? 'pointer' : 'default',
            opacity: canDismiss ? 1 : 0.3,
            transition: 'opacity 250ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (canDismiss)
              e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--color-accent, #7C6DD8) 12%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <X size={motion.isPlay ? 24 : 20} />
        </button>
      )}

      {/* Reward image */}
      {imageUrl && (
        <div
          style={{
            width: motion.isPlay ? 140 : motion.isGuided ? 120 : 100,
            height: motion.isPlay ? 140 : motion.isGuided ? 120 : 100,
            borderRadius: 'var(--vibe-radius-card, 12px)',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 35%, transparent)',
            animation: prefersReducedMotion
              ? 'none'
              : `rewardCardImagePop ${Math.round(500 * motion.durationMultiplier)}ms ${motion.easing} ${Math.round(150 * motion.durationMultiplier)}ms backwards`,
          }}
        />
      )}

      {/* "You earned" label */}
      <div
        style={{
          fontSize: motion.isPlay ? '1rem' : '0.875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-accent, #7C6DD8)',
        }}
      >
        You earned
      </div>

      {/* Title */}
      <h2
        style={{
          margin: 0,
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--color-text-heading, #1F2937)',
        }}
      >
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: descSize,
            lineHeight: 1.5,
            color: 'var(--color-text-secondary, #6B7280)',
          }}
        >
          {description}
        </p>
      )}

      {/* Point value */}
      {typeof pointValue === 'number' && pointValue > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: motion.isPlay ? '0.625rem 1.25rem' : '0.5rem 1rem',
            backgroundColor:
              'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card, #FFFFFF))',
            border: '1.5px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 40%, transparent)',
            borderRadius: 'var(--vibe-radius-input, 999px)',
            fontSize: pointsSize,
            fontWeight: 700,
            color: 'var(--color-sparkle-gold-dark, #B8942A)',
          }}
        >
          {currencyIcon ?? (
            <Star
              size={motion.isPlay ? 24 : 20}
              fill="var(--color-sparkle-gold, #D4AF37)"
              color="var(--color-sparkle-gold, #D4AF37)"
            />
          )}
          +{pointValue}
        </div>
      )}

      {/* Confirm button */}
      {onDismiss && (
        <button
          type="button"
          onClick={() => canDismiss && onDismiss()}
          disabled={!canDismiss}
          style={{
            marginTop: '0.5rem',
            minHeight: motion.touchTargetMin,
            padding: motion.isPlay ? '0.875rem 2rem' : '0.75rem 1.75rem',
            background: 'var(--surface-primary, var(--color-btn-primary-bg, #7C6DD8))',
            color: 'var(--color-btn-primary-text, #FFFFFF)',
            border: 'none',
            borderRadius: 'var(--vibe-radius-input, 999px)',
            fontSize: motion.isPlay ? '1.125rem' : '1rem',
            fontWeight: 600,
            cursor: canDismiss ? 'pointer' : 'default',
            opacity: canDismiss ? 1 : 0.5,
            transition: 'opacity 250ms ease, transform 150ms ease',
          }}
          onMouseDown={(e) => {
            if (canDismiss) e.currentTarget.style.transform = 'scale(0.97)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {motion.isPlay ? 'Yay!' : motion.isGuided ? 'Awesome!' : 'Got it'}
        </button>
      )}
    </div>
  )

  if (inline) {
    return (
      <>
        {cardContent}
        <RewardCardKeyframes />
      </>
    )
  }

  return (
    <div
      role="presentation"
      onClick={() => canDismiss && onDismiss?.()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: prefersReducedMotion
          ? 'none'
          : `rewardCardBackdropFade ${entryDuration}ms ease forwards`,
        padding: '1rem',
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>{cardContent}</div>
      <RewardCardKeyframes />
    </div>
  )
}

function RewardCardKeyframes() {
  return (
    <style>{`
      @keyframes rewardCardExpand {
        0%   { opacity: 0; transform: scale(0.4); }
        60%  { opacity: 1; transform: scale(1.04); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes rewardCardSlideUp {
        0%   { opacity: 0; transform: translateY(40px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes rewardCardFade {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes rewardCardImagePop {
        0%   { opacity: 0; transform: scale(0.6); }
        60%  { opacity: 1; transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes rewardCardBackdropFade {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
    `}</style>
  )
}
