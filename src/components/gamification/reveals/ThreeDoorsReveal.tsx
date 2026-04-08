/**
 * ThreeDoorsReveal — PRD-24 Gamification Foundation
 *
 * Three doors side-by-side. User taps one. Chosen door swings open with CSS
 * 3D perspective rotateY(-110deg). Light spills from behind. Unchosen doors
 * fade out (NEVER open, NEVER reveal — they are decoys, not real options).
 * Terminates into RewardCard + RevealSparkle.
 *
 * Quality target: collectible card game polish. Embossed wood-grain doors,
 * brass handle, brass corner accents, shimmer sweep. Premium prize-show feel,
 * not a generic modal.
 *
 * Phases:
 *   1. PRESENTATION (0.8s) — backdrop fade, doors slide up from bottom with
 *      stagger, brief anticipation wobble, "Pick a door!" label
 *   2. SELECTION — touch-aware lift on hover, tap to select
 *   3. REVEAL (1-2s) — chosen door rotates open from left hinge, light spills
 *      out, unchosen doors fade out (NEVER open)
 *   4. REWARD CARD — RewardCard slides up from chosen door's position
 *
 * Reduced motion: doors appear static, tap immediately shows reward.
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

export interface ThreeDoorsRevealProps {
  /** Reward content to reveal — actual result is decided by caller, server-side */
  content: RevealContent
  /** Called when user taps a door and the reveal animation completes */
  onComplete?: () => void
  /** Called when user dismisses the final RewardCard */
  onDismiss?: () => void
}

type Phase = 'presenting' | 'idle' | 'revealing' | 'rewarded'

const DOOR_INDICES = [0, 1, 2] as const

export function ThreeDoorsReveal({ content, onComplete, onDismiss }: ThreeDoorsRevealProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('presenting')
  const [chosenIndex, setChosenIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const doorRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null])
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  // Shell-aware sizing
  const doorWidth = motion.isPlay ? 140 : motion.isGuided ? 120 : 100
  const doorHeight = Math.round(doorWidth * 1.4)
  const doorGap = motion.isPlay ? 24 : motion.isGuided ? 18 : 14

  // Phase timings (apply shell duration multiplier)
  const slideStaggerMs = Math.round(100 * motion.durationMultiplier)
  const slideDuration = Math.round(550 * motion.durationMultiplier)
  const wobbleDuration = Math.round(300 * motion.durationMultiplier)
  const swingDuration = Math.round(1100 * motion.durationMultiplier)
  const fadeOutDuration = Math.round(400 * motion.durationMultiplier)
  const rewardDelay = swingDuration + Math.round(150 * motion.durationMultiplier)

  // Should this shell wobble during presentation? Skip on Independent/Adult.
  const shouldWobble = !prefersReducedMotion && (motion.isPlay || motion.isGuided)

  // Move from presenting → idle once slide-in (and optional wobble) finishes
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('idle')
      return
    }
    if (phase !== 'presenting') return
    const slideTotal = slideDuration + slideStaggerMs * 2
    const total = shouldWobble ? slideTotal + wobbleDuration + 100 : slideTotal + 100
    const t = setTimeout(() => setPhase('idle'), total)
    return () => clearTimeout(t)
  }, [phase, prefersReducedMotion, slideDuration, slideStaggerMs, wobbleDuration, shouldWobble])

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
    // Capture the chosen door's rect for the RewardCard slide-up origin
    const el = doorRefs.current[idx]
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
      aria-label="Pick a door to reveal your reward"
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
        animation: prefersReducedMotion ? 'none' : 'threeDoors-backdropFade 400ms ease forwards',
        opacity: 0,
      }}
    >
      {/* Doors row */}
      {phase !== 'rewarded' && (
        <div
          style={{
            display: 'flex',
            gap: doorGap,
            perspective: '1200px',
            marginBottom: '2rem',
          }}
        >
          {DOOR_INDICES.map((i) => {
            const isChosen = chosenIndex === i
            const isFading = phase === 'revealing' && !isChosen
            const isSwinging = phase === 'revealing' && isChosen
            const isHovered = hoveredIndex === i && phase === 'idle'

            // Per-door slide-in stagger delay (0, 100, 200ms × multiplier)
            const slideDelay = i * slideStaggerMs
            const wobbleDelay = slideDuration + slideStaggerMs * 2 + 50

            return (
              <button
                key={i}
                ref={(el) => {
                  doorRefs.current[i] = el
                }}
                type="button"
                onClick={() => handleSelect(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(i)}
                onTouchEnd={() => setHoveredIndex(null)}
                disabled={phase !== 'idle'}
                aria-label={`Door ${i + 1}`}
                style={{
                  position: 'relative',
                  width: doorWidth,
                  height: doorHeight,
                  minWidth: motion.touchTargetMin,
                  minHeight: motion.touchTargetMin,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: phase === 'idle' ? 'pointer' : 'default',
                  // Door swings from its left hinge
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  animation: prefersReducedMotion
                    ? 'none'
                    : phase === 'presenting'
                      ? shouldWobble
                        ? `threeDoors-slideUp ${slideDuration}ms ${motion.easing} ${slideDelay}ms backwards, threeDoors-wobble ${wobbleDuration}ms ${motion.easing} ${wobbleDelay}ms`
                        : `threeDoors-slideUp ${slideDuration}ms ${motion.easing} ${slideDelay}ms backwards`
                      : isSwinging
                        ? `threeDoors-swing ${swingDuration}ms cubic-bezier(0.55, 0.06, 0.32, 1) forwards`
                        : isFading
                          ? `threeDoors-fadeOut ${fadeOutDuration}ms ease-out forwards`
                          : 'none',
                  filter: isHovered ? 'brightness(1.1)' : undefined,
                  transform: isHovered ? 'translateY(-4px)' : undefined,
                  transition: 'transform 200ms ' + motion.easing + ', filter 200ms ease',
                  willChange: 'transform, opacity',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* The door surface */}
                <DoorSurface
                  doorWidth={doorWidth}
                  doorHeight={doorHeight}
                  isPlay={motion.isPlay}
                  hasIdleShimmer={!prefersReducedMotion && motion.hasIdleAnimations && phase === 'idle'}
                />

                {/* Light glow behind the door — only visible when door swings open */}
                {isSwinging && (
                  <DoorwayGlow
                    content={content}
                    doorWidth={doorWidth}
                    doorHeight={doorHeight}
                    isPlay={motion.isPlay}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* "Pick a door!" label */}
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
          {motion.isPlay ? 'Pick a door!' : motion.isGuided ? 'Pick a door!' : 'Choose a door'}
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
            entryAnimation="slide-up"
            originRect={originRect ?? undefined}
          />
        </>
      )}

      <style>{`
        @keyframes threeDoors-backdropFade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes threeDoors-slideUp {
          0% {
            opacity: 0;
            transform: translateY(60vh) scale(0.92);
          }
          75% {
            opacity: 1;
          }
          90% {
            transform: translateY(-6px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes threeDoors-wobble {
          0%   { transform: rotateZ(0deg); }
          25%  { transform: rotateZ(-1.5deg); }
          50%  { transform: rotateZ(1.5deg); }
          75%  { transform: rotateZ(-0.8deg); }
          100% { transform: rotateZ(0deg); }
        }
        @keyframes threeDoors-swing {
          0% {
            transform: rotateY(0deg);
          }
          15% {
            transform: rotateY(-8deg);
          }
          100% {
            transform: rotateY(-110deg);
          }
        }
        @keyframes threeDoors-fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.85);
          }
        }
        @keyframes threeDoors-shimmer {
          0%   { transform: translateX(0); opacity: 0; }
          20%  { opacity: 0.7; }
          80%  { opacity: 0.7; }
          100% { transform: translateX(280%); opacity: 0; }
        }
        @keyframes threeDoors-glowPulse {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          30%  { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Door Surface (premium embossed-wood design) ──────────────

interface DoorSurfaceProps {
  doorWidth: number
  doorHeight: number
  isPlay: boolean
  hasIdleShimmer: boolean
}

function DoorSurface({ doorWidth, doorHeight, isPlay, hasIdleShimmer }: DoorSurfaceProps) {
  const innerInset = isPlay ? 10 : 8
  const innerInset2 = isPlay ? 18 : 14
  const handleSize = Math.round(doorWidth * 0.08)

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        backgroundColor: 'var(--color-bg-secondary, #1F2937)',
        backgroundImage:
          'linear-gradient(180deg, color-mix(in srgb, white 8%, transparent) 0%, transparent 35%, transparent 65%, color-mix(in srgb, #000 18%, transparent) 100%), repeating-linear-gradient(180deg, transparent 0px, transparent 6px, color-mix(in srgb, var(--color-accent, #7C6DD8) 6%, transparent) 6px, color-mix(in srgb, var(--color-accent, #7C6DD8) 6%, transparent) 7px)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '3px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 80%, transparent)',
        boxShadow:
          '0 12px 28px -6px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--color-accent, #7C6DD8) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent), inset 0 -3px 6px color-mix(in srgb, #000 25%, transparent)',
        overflow: 'hidden',
      }}
    >
      {/* Inner panel border 1 */}
      <div
        style={{
          position: 'absolute',
          inset: innerInset,
          borderRadius: `calc(var(--vibe-radius-card, 12px) - ${innerInset / 2}px)`,
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 30%, transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Inner panel border 2 */}
      <div
        style={{
          position: 'absolute',
          inset: innerInset2,
          borderRadius: `calc(var(--vibe-radius-card, 12px) - ${innerInset2 / 2}px)`,
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 15%, transparent)',
          pointerEvents: 'none',
          boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 8%, transparent)',
        }}
      />

      {/* Upper recessed panel */}
      <div
        style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          top: '12%',
          height: '32%',
          borderRadius: '4px',
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 25%, transparent)',
          boxShadow:
            'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 0 color-mix(in srgb, white 8%, transparent)',
          pointerEvents: 'none',
        }}
      />
      {/* Lower recessed panel */}
      <div
        style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          top: '52%',
          height: '32%',
          borderRadius: '4px',
          border: '1px solid color-mix(in srgb, var(--color-accent, #7C6DD8) 25%, transparent)',
          boxShadow:
            'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 0 color-mix(in srgb, white 8%, transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Brass handle on the right edge, vertically centered */}
      <div
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          width: handleSize,
          height: handleSize,
          borderRadius: '50%',
          backgroundColor: 'var(--color-sparkle-gold, #D4AF37)',
          border: '1px solid var(--color-sparkle-gold-dark, #B8942A)',
          boxShadow:
            '0 0 6px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 60%, transparent), inset 0 1px 0 var(--color-sparkle-gold-light, #E8C547), inset 0 -1px 0 var(--color-sparkle-gold-dark, #B8942A)',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Brass corner accents — 4 small studs */}
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
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'var(--color-sparkle-gold, #D4AF37)',
            border: '1px solid var(--color-sparkle-gold-dark, #B8942A)',
            boxShadow:
              'inset 0 1px 0 var(--color-sparkle-gold-light, #E8C547), 0 0 3px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent)',
            ...pos,
          }}
        />
      ))}

      {/* Slow shimmer sweep — only when idle animations are enabled */}
      {hasIdleShimmer && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '60%',
            height: '100%',
            background:
              'linear-gradient(115deg, transparent 30%, color-mix(in srgb, white 16%, transparent) 50%, transparent 70%)',
            animation: 'threeDoors-shimmer 4s ease-in-out infinite',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Suppress unused warning for doorHeight prop */}
      <span style={{ position: 'absolute', height: doorHeight, width: 0, opacity: 0 }} />
    </div>
  )
}

// ─── Doorway Glow (light spilling from behind the open door) ──

interface DoorwayGlowProps {
  content: RevealContent
  doorWidth: number
  doorHeight: number
  isPlay: boolean
}

function DoorwayGlow({ content, doorWidth, doorHeight, isPlay }: DoorwayGlowProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        // Sit behind the door surface in 3D space so the door visibly swings AWAY
        // and reveals this glow.
        transform: 'translateZ(-1px)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        backgroundColor: 'var(--color-bg-card, #FFFFFF)',
        border: '2px solid var(--color-sparkle-gold, #D4AF37)',
        boxShadow:
          '0 0 40px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 70%, transparent), inset 0 0 32px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
      }}
    >
      {/* Radial light glow expanding from center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: doorWidth * 1.4,
          height: doorWidth * 1.4,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, var(--color-sparkle-gold, #D4AF37) 0%, color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 40%, transparent) 35%, transparent 70%)',
          opacity: 0,
          transform: 'translate(-50%, -50%) scale(0.4)',
          animation: 'threeDoors-glowPulse 800ms ease-out 100ms forwards',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />

      {/* Reward content preview visible through the open doorway */}
      {content.imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: doorWidth * 0.55,
            height: doorWidth * 0.55,
            borderRadius: 'var(--vibe-radius-card, 12px)',
            backgroundImage: `url(${content.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1.5px solid var(--color-sparkle-gold, #D4AF37)',
            boxShadow: '0 0 12px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 60%, transparent)',
          }}
        />
      ) : (
        <Sparkles
          size={Math.round(doorWidth * 0.4)}
          color="var(--color-sparkle-gold, #D4AF37)"
          fill="var(--color-sparkle-gold, #D4AF37)"
          style={{
            position: 'relative',
            filter: 'drop-shadow(0 0 8px var(--color-sparkle-gold, #D4AF37))',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
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
      {/* Suppress unused warning for doorHeight */}
      <span style={{ position: 'absolute', height: doorHeight, width: 0, opacity: 0 }} />
    </div>
  )
}
