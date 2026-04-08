/**
 * StreakFire — PRD-24 Gamification Foundation
 *
 * Renders on/near a streak widget. Triggered when task completion extends the
 * streak. Three things happen:
 *   1. The flame icon scales/colors based on streak length
 *   2. The counter number animates (old slides up + fades, new slides in)
 *   3. On a flare, the flame pops + 2-3 spark particles emit + (21+) sparkles
 *
 * The `flare` prop is controlled — false→true triggers the flare animation
 * via internal state, then resets and calls onFlareComplete.
 *
 * Reduced motion: number swaps instantly, no flare, no idle, no particles.
 */

import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'

export interface StreakFireProps {
  /** Current streak count */
  streak: number
  /** True triggers a flare animation (after a streak increment) */
  flare?: boolean
  /** Called after the flare animation completes (300ms × multiplier) */
  onFlareComplete?: () => void
}

interface StreakTier {
  scaleMultiplier: number
  color: string
  emitGoldSparkles: boolean
}

function getStreakTier(streak: number): StreakTier {
  if (streak >= 21) {
    return {
      scaleMultiplier: 1.4,
      color: 'var(--color-victory)',
      emitGoldSparkles: true,
    }
  }
  if (streak >= 14) {
    return {
      scaleMultiplier: 1.3,
      color: 'color-mix(in srgb, var(--color-sparkle-gold) 50%, var(--color-victory))',
      emitGoldSparkles: false,
    }
  }
  if (streak >= 7) {
    return {
      scaleMultiplier: 1.15,
      color: 'color-mix(in srgb, var(--color-sparkle-gold) 70%, var(--color-accent))',
      emitGoldSparkles: false,
    }
  }
  return {
    scaleMultiplier: 1.0,
    color: 'var(--color-sparkle-gold)',
    emitGoldSparkles: false,
  }
}

export function StreakFire({ streak, flare = false, onFlareComplete }: StreakFireProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const tier = getStreakTier(streak)
  const baseFlameSize = 24
  const flameSize = Math.round(baseFlameSize * tier.scaleMultiplier * motion.scaleMultiplier)

  // Flare animation state — runs when `flare` flips false→true
  const [isFlaring, setIsFlaring] = useState(false)
  const flareDurationMs = Math.round(200 * motion.durationMultiplier)
  const flareTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return
    if (!flare) return

    setIsFlaring(true)
    if (flareTimerRef.current !== null) {
      clearTimeout(flareTimerRef.current)
    }
    flareTimerRef.current = window.setTimeout(() => {
      setIsFlaring(false)
      flareTimerRef.current = null
      onFlareComplete?.()
    }, flareDurationMs)

    return () => {
      if (flareTimerRef.current !== null) {
        clearTimeout(flareTimerRef.current)
        flareTimerRef.current = null
      }
    }
  }, [flare, flareDurationMs, onFlareComplete, prefersReducedMotion])

  // Cleanup on unmount in case the component dies mid-flare
  useEffect(() => {
    return () => {
      if (flareTimerRef.current !== null) {
        clearTimeout(flareTimerRef.current)
        flareTimerRef.current = null
      }
    }
  }, [])

  // Counter animation: track previous streak so we can render the slide-out
  const prevStreakRef = useRef<number>(streak)
  const [animatingFromStreak, setAnimatingFromStreak] = useState<number | null>(null)
  const counterTimerRef = useRef<number | null>(null)
  const counterDurationMs = Math.round(250 * motion.durationMultiplier)

  useEffect(() => {
    if (prefersReducedMotion) {
      prevStreakRef.current = streak
      return
    }
    if (prevStreakRef.current !== streak) {
      setAnimatingFromStreak(prevStreakRef.current)
      prevStreakRef.current = streak

      if (counterTimerRef.current !== null) {
        clearTimeout(counterTimerRef.current)
      }
      counterTimerRef.current = window.setTimeout(() => {
        setAnimatingFromStreak(null)
        counterTimerRef.current = null
      }, counterDurationMs + 50)
    }
  }, [streak, counterDurationMs, prefersReducedMotion])

  // Cleanup counter timer on unmount
  useEffect(() => {
    return () => {
      if (counterTimerRef.current !== null) {
        clearTimeout(counterTimerRef.current)
        counterTimerRef.current = null
      }
    }
  }, [])

  // Idle animation flag
  const idleEnabled =
    motion.hasIdleAnimations && !prefersReducedMotion && (motion.isPlay || motion.isGuided)
  const idleAnimationName = motion.isPlay
    ? 'streakFire-idleSway'
    : motion.isGuided
      ? 'streakFire-idlePulse'
      : ''

  // Spark particles — emit when flaring (always 2-3, gold sparkles only at 21+)
  const sparkParticles = isFlaring
    ? [
        { dx: -10, dy: -22, delayMs: 0, sizePx: 5 },
        { dx: 10, dy: -24, delayMs: 30, sizePx: 5 },
        { dx: 0, dy: -28, delayMs: 60, sizePx: 6 },
      ]
    : []

  const goldSparkles =
    isFlaring && tier.emitGoldSparkles
      ? [
          { dx: -16, dy: -16, delayMs: 20, sizePx: 7 },
          { dx: 18, dy: -14, delayMs: 50, sizePx: 6 },
          { dx: -2, dy: -36, delayMs: 90, sizePx: 8 },
        ]
      : []

  // ─── Reduced motion fallback ────────────────────────────────
  if (prefersReducedMotion) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Flame
          size={flameSize}
          color={tier.color}
          fill={tier.color}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span
          style={{
            fontSize: Math.max(14, Math.round(flameSize * 0.7)),
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {streak}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {/* Flame container — relative positioning anchors the spark particles */}
      <div
        style={{
          position: 'relative',
          width: flameSize,
          height: flameSize,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform',
          animation: isFlaring
            ? `streakFire-flare ${flareDurationMs}ms ${motion.easing} forwards`
            : idleEnabled
              ? `${idleAnimationName} ${motion.isPlay ? '3s' : '4s'} ease-in-out infinite`
              : 'none',
        }}
      >
        <Flame
          size={flameSize}
          color={tier.color}
          fill={tier.color}
          strokeWidth={1.5}
          aria-hidden="true"
          style={{
            filter: isFlaring
              ? `drop-shadow(0 0 8px ${tier.color})`
              : tier.scaleMultiplier > 1
                ? `drop-shadow(0 0 4px ${tier.color})`
                : undefined,
          }}
        />

        {/* Spark particles — emit upward + outward from flame tip */}
        {sparkParticles.map((p, i) => (
          <div
            key={`spark-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '20%',
              width: p.sizePx,
              height: p.sizePx,
              marginLeft: -p.sizePx / 2,
              marginTop: -p.sizePx / 2,
              borderRadius: '50%',
              background: 'var(--color-sparkle-gold-light)',
              boxShadow: '0 0 6px var(--color-sparkle-gold)',
              opacity: 0,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
              animation: `streakFire-spark ${flareDurationMs * 1.6}ms ${motion.easing} ${p.delayMs}ms forwards`,
              ['--spark-dx' as string]: `${p.dx}px`,
              ['--spark-dy' as string]: `${p.dy}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Gold sparkles — only at 21+ streak */}
        {goldSparkles.map((p, i) => (
          <div
            key={`gold-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '20%',
              width: p.sizePx,
              height: p.sizePx,
              marginLeft: -p.sizePx / 2,
              marginTop: -p.sizePx / 2,
              borderRadius: '50%',
              background: 'var(--color-sparkle-gold)',
              boxShadow: '0 0 10px var(--color-sparkle-gold-light)',
              opacity: 0,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
              animation: `streakFire-gold ${flareDurationMs * 2}ms ${motion.easing} ${p.delayMs}ms forwards`,
              ['--gold-dx' as string]: `${p.dx}px`,
              ['--gold-dy' as string]: `${p.dy}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Counter */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          height: Math.round(flameSize * 0.85),
          minWidth: Math.round(flameSize * 0.6),
          overflow: 'hidden',
          fontSize: Math.max(14, Math.round(flameSize * 0.7)),
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1,
        }}
      >
        {/* Outgoing previous number */}
        {animatingFromStreak !== null && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              willChange: 'transform, opacity',
              animation: `streakFire-counterOut ${counterDurationMs}ms ${motion.easing} forwards`,
            }}
          >
            {animatingFromStreak}
          </span>
        )}
        {/* Current number */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            willChange: 'transform, opacity',
            animation:
              animatingFromStreak !== null
                ? `streakFire-counterIn ${counterDurationMs}ms ${motion.easing} forwards`
                : 'none',
          }}
        >
          {streak}
        </span>
      </div>

      <style>{`
        @keyframes streakFire-flare {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes streakFire-idleSway {
          0%, 100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
        @keyframes streakFire-idlePulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
        @keyframes streakFire-spark {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.6);
          }
          20% {
            opacity: 1;
            transform: translate(calc(var(--spark-dx) * 0.3), calc(var(--spark-dy) * 0.3)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--spark-dx), var(--spark-dy)) scale(0.4);
          }
        }
        @keyframes streakFire-gold {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.5);
          }
          25% {
            opacity: 1;
            transform: translate(calc(var(--gold-dx) * 0.4), calc(var(--gold-dy) * 0.4)) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--gold-dx), var(--gold-dy)) scale(0.5);
          }
        }
        @keyframes streakFire-counterOut {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-100%); }
        }
        @keyframes streakFire-counterIn {
          0%   { opacity: 0; transform: translateY(100%); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
