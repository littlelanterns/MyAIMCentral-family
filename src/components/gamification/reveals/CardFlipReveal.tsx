/**
 * CardFlipReveal — PRD-24 Gamification Foundation (THE SHOWPIECE)
 *
 * Three face-down cards in a horizontal row. User taps one. It flips with
 * 3D perspective. Unchosen cards fade out (NEVER flip, NEVER reveal — they
 * are decoys, not real options). Terminates into RewardCard + RevealSparkle.
 *
 * Quality target: collectible card game quality. Foil-embossed feel via
 * layered borders, diamond motif, slow shimmer sweep. Premium trading card,
 * not a playing card.
 *
 * Phases:
 *   1. PRESENTATION (0.8s) — backdrop fade, cards deal in from top-right with
 *      stagger, brief shimmer, "Pick a card!" label, gentle floating idle
 *   2. SELECTION — touch-aware lift on hover, tap to select
 *   3. REVEAL (0.8-1.2s) — chosen card flips rotateY(0→180), midpoint flash,
 *      unchosen cards fade out (NEVER flip)
 *   4. REWARD CARD — RewardCard expands from flipped position
 *
 * Reduced motion: cards appear static, tap immediately shows reward.
 */

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'
import { RevealSparkle } from '../shared/RevealSparkle'
import { RewardCard } from '../shared/RewardCard'

export interface RevealContent {
  title: string
  description?: string
  imageUrl?: string
  pointValue?: number
}

export interface CardFlipRevealProps {
  /** Reward content to reveal — actual result is decided by caller, server-side */
  content: RevealContent
  /** Called when user taps a card and the flip animation completes */
  onComplete?: () => void
  /** Called when user dismisses the final RewardCard */
  onDismiss?: () => void
}

type Phase = 'presenting' | 'idle' | 'selecting' | 'revealing' | 'rewarded'

const CARD_INDICES = [0, 1, 2] as const

export function CardFlipReveal({ content, onComplete, onDismiss }: CardFlipRevealProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('presenting')
  const [chosenIndex, setChosenIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null])
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  // Shell-aware sizing
  const cardWidth = motion.isPlay ? 140 : motion.isGuided ? 120 : 100
  const cardHeight = motion.isPlay ? 196 : motion.isGuided ? 168 : 140
  const cardGap = motion.isPlay ? 24 : motion.isGuided ? 18 : 14

  // Phase timings (apply shell duration multiplier)
  const dealStaggerMs = Math.round(150 * motion.durationMultiplier)
  const dealDuration = Math.round(550 * motion.durationMultiplier)
  const flipDuration = Math.round(800 * motion.durationMultiplier)
  const fadeOutDuration = Math.round(400 * motion.durationMultiplier)
  const rewardDelay = flipDuration + Math.round(200 * motion.durationMultiplier)

  // Move from presenting → idle once dealing animation finishes
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('idle')
      return
    }
    if (phase !== 'presenting') return
    const total = dealDuration + dealStaggerMs * 2 + 200
    const t = setTimeout(() => setPhase('idle'), total)
    return () => clearTimeout(t)
  }, [phase, prefersReducedMotion, dealDuration, dealStaggerMs])

  // After reveal completes, transition to rewarded
  useEffect(() => {
    if (phase !== 'revealing') return
    const t = setTimeout(() => {
      setPhase('rewarded')
      onComplete?.()
    }, rewardDelay)
    return () => clearTimeout(t)
  }, [phase, rewardDelay, onComplete])

  function handleSelect(idx: number) {
    if (phase !== 'idle') return
    setChosenIndex(idx)
    // Capture the chosen card's rect for the RewardCard expand origin
    const el = cardRefs.current[idx]
    if (el) setOriginRect(el.getBoundingClientRect())
    setPhase(prefersReducedMotion ? 'rewarded' : 'revealing')
    if (prefersReducedMotion) onComplete?.()
  }

  function handleDismiss() {
    onDismiss?.()
  }

  // ─── Reduced motion fallback ────────────────────────────────
  if (prefersReducedMotion && phase === 'rewarded') {
    return (
      <RewardCard
        title={content.title}
        description={content.description}
        imageUrl={content.imageUrl}
        pointValue={content.pointValue}
        onDismiss={handleDismiss}
        entryAnimation="fade"
      />
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Pick a card to reveal your reward"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 105,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: prefersReducedMotion ? 'none' : 'cardFlipBackdropFade 400ms ease forwards',
        opacity: 0,
      }}
    >
      {/* Cards row */}
      {phase !== 'rewarded' && (
        <div
          style={{
            display: 'flex',
            gap: cardGap,
            perspective: '1000px',
            marginBottom: '2rem',
          }}
        >
          {CARD_INDICES.map((i) => {
            const isChosen = chosenIndex === i
            const isFading = phase === 'revealing' && !isChosen
            const isFlipping = phase === 'revealing' && isChosen
            const isHovered = hoveredIndex === i && phase === 'idle'

            // Per-card deal stagger delay (0, 1, 2 -> 0, 150, 300ms)
            const dealDelay = i * dealStaggerMs

            return (
              <button
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                type="button"
                onClick={() => handleSelect(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
                onTouchEnd={() => setHoveredIndex(null)}
                disabled={phase !== 'idle'}
                aria-label={`Card ${i + 1}`}
                style={{
                  position: 'relative',
                  width: cardWidth,
                  height: cardHeight,
                  minWidth: motion.touchTargetMin,
                  minHeight: motion.touchTargetMin,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: phase === 'idle' ? 'pointer' : 'default',
                  transformStyle: 'preserve-3d',
                  // Animations: deal in, then idle float, then either flip or fade
                  animation: prefersReducedMotion
                    ? 'none'
                    : phase === 'presenting'
                      ? `cardFlipDealIn ${dealDuration}ms ${motion.easing} ${dealDelay}ms backwards`
                      : isFlipping
                        ? `cardFlipFlip ${flipDuration}ms ${motion.easing} forwards`
                        : isFading
                          ? `cardFlipFadeOut ${fadeOutDuration}ms ease-out forwards`
                          : phase === 'idle' && !isHovered
                            ? `cardFlipFloat 3s ease-in-out infinite ${i * 400}ms`
                            : 'none',
                  transform: isHovered ? 'translateY(-6px) scale(1.03)' : undefined,
                  transition: 'transform 200ms ' + motion.easing,
                  willChange: 'transform, opacity',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Card BACK (visible initially) */}
                <CardBack motion={motion} cardWidth={cardWidth} cardHeight={cardHeight} />

                {/* Card FRONT (the reward face — only visible after flip) */}
                <CardFront
                  content={content}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  isPlay={motion.isPlay}
                />
              </button>
            )
          })}
        </div>
      )}

      {/* "Pick a card!" label */}
      {phase !== 'rewarded' && (
        <div
          style={{
            color: 'var(--color-bg-card, #FFFFFF)',
            fontSize: motion.isPlay ? '1.5rem' : motion.isGuided ? '1.25rem' : '1.125rem',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            opacity: phase === 'idle' ? 1 : 0,
            transition: 'opacity 400ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={motion.isPlay ? 24 : 20} />
          {motion.isPlay ? 'Pick a card!' : motion.isGuided ? 'Pick a card!' : 'Choose a card'}
          <Sparkles size={motion.isPlay ? 24 : 20} />
        </div>
      )}

      {/* Reward card */}
      {phase === 'rewarded' && (
        <>
          <RevealSparkle
            mode="burst"
            origin={
              originRect
                ? { x: originRect.x + originRect.width / 2, y: originRect.y + originRect.height / 2 }
                : undefined
            }
            palette="goldAccent"
            baseCount={20}
          />
          <RewardCard
            title={content.title}
            description={content.description}
            imageUrl={content.imageUrl}
            pointValue={content.pointValue}
            onDismiss={handleDismiss}
            entryAnimation="expand"
            originRect={originRect ?? undefined}
          />
        </>
      )}

      <style>{`
        @keyframes cardFlipBackdropFade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes cardFlipDealIn {
          0% {
            opacity: 0;
            transform: translate(80vw, -60vh) rotate(25deg) scale(0.8);
          }
          70% {
            opacity: 1;
          }
          85% {
            transform: translate(0, -8px) rotate(-2deg) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }
        @keyframes cardFlipFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes cardFlipFlip {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          50% {
            transform: rotateY(90deg) scale(1.05);
          }
          100% {
            transform: rotateY(180deg) scale(1.08);
          }
        }
        @keyframes cardFlipFadeOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.85);
          }
        }
      `}</style>
    </div>
  )
}

// ─── Card Back (premium foil-embossed design) ─────────────────

interface CardBackProps {
  motion: ReturnType<typeof useShellAwareMotion>
  cardWidth: number
  cardHeight: number
}

function CardBack({ motion, cardWidth, cardHeight }: CardBackProps) {
  const innerInset = motion.isPlay ? 10 : 8
  const innerInset2 = motion.isPlay ? 18 : 14

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        backgroundColor: 'var(--color-bg-secondary, #1F2937)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '2px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 80%, transparent)',
        boxShadow:
          '0 8px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--color-accent, #7C6DD8) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 15%, transparent)',
        overflow: 'hidden',
      }}
    >
      {/* Inner border 1 */}
      <div
        style={{
          position: 'absolute',
          inset: innerInset,
          borderRadius: `calc(var(--vibe-radius-card, 12px) - ${innerInset / 2}px)`,
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 30%, transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Inner border 2 */}
      <div
        style={{
          position: 'absolute',
          inset: innerInset2,
          borderRadius: `calc(var(--vibe-radius-card, 12px) - ${innerInset2 / 2}px)`,
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 15%, transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Center diamond outer */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: cardWidth * 0.55,
          height: cardWidth * 0.55,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          backgroundColor: 'color-mix(in srgb, var(--color-accent, #7C6DD8) 15%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 40%, transparent)',
          borderRadius: '4px',
        }}
      />
      {/* Center diamond inner */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: cardWidth * 0.32,
          height: cardWidth * 0.32,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          backgroundColor: 'color-mix(in srgb, var(--color-accent, #7C6DD8) 20%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 50%, transparent)',
          borderRadius: '3px',
        }}
      />
      {/* Center sparkle motif */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'color-mix(in srgb, var(--color-accent, #7C6DD8) 70%, white)',
          opacity: 0.85,
          filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--color-accent, #7C6DD8) 60%, transparent))',
        }}
      >
        <Sparkles size={Math.round(cardWidth * 0.18)} strokeWidth={1.5} />
      </div>

      {/* Corner accents — 4 small crosses */}
      {[
        { top: 6, left: 6 },
        { top: 6, right: 6 },
        { bottom: 6, left: 6 },
        { bottom: 6, right: 6 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            ...pos,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 3,
              width: 8,
              height: 2,
              backgroundColor: 'color-mix(in srgb, var(--color-accent, #7C6DD8) 60%, transparent)',
              borderRadius: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 3,
              top: 0,
              width: 2,
              height: 8,
              backgroundColor: 'color-mix(in srgb, var(--color-accent, #7C6DD8) 60%, transparent)',
              borderRadius: 1,
            }}
          />
        </div>
      ))}

      {/* Slow shimmer sweep */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-50%',
          width: '60%',
          height: '100%',
          background:
            'linear-gradient(115deg, transparent 30%, color-mix(in srgb, white 18%, transparent) 50%, transparent 70%)',
          animation: 'cardBackShimmer 4s ease-in-out infinite',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />

      {/* Bottom face guarantees: only visible when card is rotated 180° */}
      <span style={{ position: 'absolute', width: 0, height: 0 }}>
        <style>{`
          @keyframes cardBackShimmer {
            0%   { transform: translateX(0); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.9; }
            100% { transform: translateX(280%); opacity: 0; }
          }
        `}</style>
      </span>

      {/* Card height reference (unused — keeps lint quiet about cardHeight prop) */}
      <span style={{ position: 'absolute', height: cardHeight, width: 0, opacity: 0 }} />
    </div>
  )
}

// ─── Card Front (the reward face — back of the 3D rotation) ───

interface CardFrontProps {
  content: RevealContent
  cardWidth: number
  cardHeight: number
  isPlay: boolean
}

function CardFront({ content, cardWidth, cardHeight, isPlay }: CardFrontProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        backgroundColor: 'var(--color-bg-card, #FFFFFF)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '2px solid var(--color-sparkle-gold, #D4AF37)',
        boxShadow:
          '0 12px 32px -4px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent), inset 0 0 24px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 18%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        gap: '0.5rem',
        overflow: 'hidden',
      }}
    >
      {content.imageUrl ? (
        <div
          style={{
            width: cardWidth * 0.6,
            height: cardWidth * 0.6,
            borderRadius: 'var(--vibe-radius-card, 12px)',
            backgroundImage: `url(${content.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1.5px solid var(--color-sparkle-gold, #D4AF37)',
          }}
        />
      ) : (
        <Sparkles
          size={Math.round(cardWidth * 0.4)}
          color="var(--color-sparkle-gold, #D4AF37)"
          fill="var(--color-sparkle-gold, #D4AF37)"
        />
      )}
      <div
        style={{
          fontSize: isPlay ? '0.875rem' : '0.75rem',
          fontWeight: 700,
          textAlign: 'center',
          color: 'var(--color-text-heading, #1F2937)',
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {content.title}
      </div>
      {/* Suppress unused warning for cardHeight */}
      <span style={{ position: 'absolute', height: cardHeight, width: 0, opacity: 0 }} />
    </div>
  )
}
