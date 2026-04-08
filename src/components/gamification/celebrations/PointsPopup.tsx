/**
 * PointsPopup — PRD-24 Gamification Foundation
 *
 * Brief floating "+N points" text that rises and fades. Fires on every task
 * completion, so it must be cheap and clean up perfectly. Single mount-time
 * timeout, all motion via CSS keyframes, no RAF, no recurring particles.
 *
 * Shell variations:
 *   Play        → 24px, 1.2s × multiplier, bouncy easing, 3 trailing sparkles
 *   Guided      → 18px, 1.0s × multiplier, ease-out
 *   Independent → 14px, 0.6s × multiplier, ease-out
 *   Adult/Mom   → 12px, 0.5s × multiplier, ease
 *
 * Reduced motion: static text fades over 1s. No float, no trail.
 */

import { useEffect, type ReactNode } from 'react'
import { Star } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'

export interface PointsPopupProps {
  /** Number of points awarded */
  points: number
  /** Origin position in viewport coordinates */
  origin: { x: number; y: number }
  /** Optional custom currency icon (defaults to Star). Component is a Lucide icon ReactNode. */
  currencyIcon?: ReactNode
  /** Called when fade completes and component should unmount */
  onComplete?: () => void
}

export function PointsPopup({ points, origin, currencyIcon, onComplete }: PointsPopupProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  // Shell-aware sizing/timing
  const fontSize = motion.isPlay
    ? 24
    : motion.isGuided
      ? 18
      : motion.isIndependent
        ? 14
        : 12

  const baseDurationMs = motion.isPlay
    ? 1200
    : motion.isGuided
      ? 1000
      : motion.isIndependent
        ? 600
        : 500

  const durationMs = baseDurationMs * motion.durationMultiplier
  const easing = motion.isPlay ? motion.easing : motion.isAdult ? 'ease' : 'ease-out'

  // Reduced motion uses a fixed 1s static fade
  const totalMs = prefersReducedMotion ? 1000 : durationMs
  // Float distance scales with motion config
  const floatDistance = 80 * motion.scaleMultiplier

  // Single cleanup timeout — fires onComplete when the animation finishes
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, totalMs + 50) // small buffer past the keyframe end
    return () => clearTimeout(timer)
  }, [totalMs, onComplete])

  const icon = currencyIcon ?? (
    <Star
      size={Math.round(fontSize * 0.95)}
      color="var(--color-sparkle-gold)"
      fill="var(--color-sparkle-gold)"
      strokeWidth={1.5}
    />
  )

  // ─── Reduced motion fallback ────────────────────────────────
  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: origin.x,
          top: origin.y,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize,
          fontWeight: 700,
          color: 'var(--color-sparkle-gold)',
          textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 80,
          willChange: 'opacity',
          opacity: 0,
          animation: 'pointsPopup-staticFade 1000ms ease-out forwards',
        }}
      >
        <span>+{points}</span>
        {icon}
        <style>{`
          @keyframes pointsPopup-staticFade {
            0%   { opacity: 0; }
            15%  { opacity: 1; }
            70%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // ─── Animated path ───────────────────────────────────────────
  // Trail particles only on Play (3 small sparkles)
  const trailParticles = motion.isPlay
    ? [
        { dx: -8, dy: 14, delayMs: 80, sizePx: 5 },
        { dx: 9, dy: 10, delayMs: 160, sizePx: 4 },
        { dx: -3, dy: 22, delayMs: 240, sizePx: 6 },
      ]
    : []

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: origin.x,
        top: origin.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 80,
      }}
    >
      {/* Main +N text */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize,
          fontWeight: 700,
          color: 'var(--color-sparkle-gold)',
          textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          willChange: 'transform, opacity',
          opacity: 0,
          animation: `pointsPopup-rise ${durationMs}ms ${easing} forwards`,
          ['--rise-distance' as string]: `-${floatDistance}px`,
        } as React.CSSProperties}
      >
        <span>+{points}</span>
        {icon}
      </div>

      {/* Play-only trailing sparkles */}
      {trailParticles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.sizePx,
            height: p.sizePx,
            marginLeft: -p.sizePx / 2,
            marginTop: -p.sizePx / 2,
            borderRadius: '50%',
            background: 'var(--color-sparkle-gold-light)',
            boxShadow: '0 0 6px var(--color-sparkle-gold)',
            opacity: 0,
            willChange: 'transform, opacity',
            animation: `pointsPopup-sparkle ${durationMs}ms ${motion.easing} ${p.delayMs}ms forwards`,
            ['--sparkle-dx' as string]: `${p.dx}px`,
            ['--sparkle-dy' as string]: `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes pointsPopup-rise {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.85);
          }
          15% {
            opacity: 1;
            transform: translate(0, ${(-floatDistance * 0.1).toFixed(1)}px) scale(1.05);
          }
          70% {
            opacity: 1;
            transform: translate(0, ${(-floatDistance * 0.7).toFixed(1)}px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(0, var(--rise-distance)) scale(0.95);
          }
        }
        @keyframes pointsPopup-sparkle {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.5);
          }
          25% {
            opacity: 1;
            transform: translate(calc(var(--sparkle-dx) * 0.4), calc(var(--sparkle-dy) * 0.4)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--sparkle-dx), var(--sparkle-dy)) scale(0.6);
          }
        }
      `}</style>
    </div>
  )
}
