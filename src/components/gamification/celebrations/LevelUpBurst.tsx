/**
 * LevelUpBurst — PRD-24 Gamification Foundation
 *
 * Triggered on level threshold crossing. Non-blocking overlay that auto-dismisses.
 *
 * Shell variations:
 *   Play        → full-width sparkle bar (12-16 particles), bouncy center badge, 2.0s
 *   Guided      → sparkle bar (8-10 particles, faster), smaller badge, 1.5s
 *   Independent → sparkle bar (6 particles, fastest), small badge, 1.0s
 *   Adult/Mom   → toast in top-right corner only, no sparkle bar, 2.5s
 *
 * Reduced motion: toast only for ALL shells, 2s display, no animation.
 */

import { useEffect } from 'react'
import { Sparkles, Star } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'

export interface LevelUpBurstProps {
  /** New level number */
  newLevel: number
  /** Called when the burst auto-dismisses */
  onComplete?: () => void
}

interface ShellLevelUpConfig {
  particleCount: number
  sparkleBarDurationMs: number
  autoDismissMs: number
  badgeFontPx: number
  badgePaddingX: number
  badgePaddingY: number
}

function getConfig(motion: ReturnType<typeof useShellAwareMotion>): ShellLevelUpConfig {
  if (motion.isPlay) {
    return {
      particleCount: 14,
      sparkleBarDurationMs: 1200 * motion.durationMultiplier,
      autoDismissMs: 2000,
      badgeFontPx: 28,
      badgePaddingX: 32,
      badgePaddingY: 20,
    }
  }
  if (motion.isGuided) {
    return {
      particleCount: 9,
      sparkleBarDurationMs: 800 * motion.durationMultiplier,
      autoDismissMs: 1500,
      badgeFontPx: 22,
      badgePaddingX: 26,
      badgePaddingY: 16,
    }
  }
  if (motion.isIndependent) {
    return {
      particleCount: 6,
      sparkleBarDurationMs: 500 * motion.durationMultiplier,
      autoDismissMs: 1000,
      badgeFontPx: 18,
      badgePaddingX: 22,
      badgePaddingY: 14,
    }
  }
  // Adult / Mom — toast only
  return {
    particleCount: 0,
    sparkleBarDurationMs: 0,
    autoDismissMs: 2500,
    badgeFontPx: 14,
    badgePaddingX: 16,
    badgePaddingY: 10,
  }
}

export function LevelUpBurst({ newLevel, onComplete }: LevelUpBurstProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()
  const config = getConfig(motion)

  // Force toast-only for reduced motion regardless of shell
  const showToastOnly = prefersReducedMotion || motion.isAdult
  const totalDurationMs = prefersReducedMotion ? 2000 : config.autoDismissMs

  // Single mount-time auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, totalDurationMs)
    return () => clearTimeout(timer)
  }, [totalDurationMs, onComplete])

  // ─── Toast variant (Adult, Mom, or reduced motion) ──────────
  if (showToastOnly) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 70,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: `${config.badgePaddingY}px ${config.badgePaddingX}px`,
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-heading)',
          fontSize: config.badgeFontPx,
          fontWeight: 700,
          borderRadius: 'var(--vibe-radius-card)',
          border: '1.5px solid var(--color-sparkle-gold)',
          boxShadow:
            '0 12px 32px -8px rgba(0,0,0,0.25), 0 0 0 1px color-mix(in srgb, var(--color-sparkle-gold) 30%, transparent)',
          opacity: 0,
          willChange: 'transform, opacity',
          animation: prefersReducedMotion
            ? 'levelUp-toastFade 2000ms ease forwards'
            : 'levelUp-toastSlide 2500ms ease forwards',
          pointerEvents: 'none',
        }}
      >
        <Star
          size={Math.round(config.badgeFontPx * 1.1)}
          color="var(--color-sparkle-gold)"
          fill="var(--color-sparkle-gold)"
          strokeWidth={1.5}
        />
        <span>Level {newLevel}</span>

        <style>{`
          @keyframes levelUp-toastSlide {
            0%   { opacity: 0; transform: translateX(120%); }
            8%   { opacity: 1; transform: translateX(0); }
            85%  { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(120%); }
          }
          @keyframes levelUp-toastFade {
            0%   { opacity: 0; }
            10%  { opacity: 1; }
            85%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // ─── Animated path: sparkle bar + center badge (Play / Guided / Independent) ──
  // Build particles with staggered delays so they traverse the bar in a wave
  const particles = Array.from({ length: config.particleCount }, (_, i) => ({
    index: i,
    delayMs: (i / config.particleCount) * (config.sparkleBarDurationMs * 0.4),
    sizePx: motion.isPlay ? 8 : motion.isGuided ? 6 : 5,
    offsetY: (i % 3) * 4 - 4, // small vertical jitter
  }))

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Horizontal sparkle bar — single line of particles traversing left → right */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 0,
        }}
      >
        {particles.map((p) => (
          <div
            key={p.index}
            style={{
              position: 'absolute',
              left: 0,
              top: p.offsetY,
              width: p.sizePx,
              height: p.sizePx,
              marginLeft: -p.sizePx / 2,
              marginTop: -p.sizePx / 2,
              borderRadius: '50%',
              background: 'var(--color-sparkle-gold)',
              boxShadow:
                '0 0 8px var(--color-sparkle-gold), 0 0 14px var(--color-sparkle-gold-light)',
              opacity: 0,
              willChange: 'transform, opacity',
              animation: `levelUp-particleSweep ${config.sparkleBarDurationMs}ms ${motion.easing} ${p.delayMs}ms forwards`,
            }}
          />
        ))}
      </div>

      {/* Center "Level X!" badge */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: `${config.badgePaddingY}px ${config.badgePaddingX}px`,
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-heading)',
          fontSize: config.badgeFontPx,
          fontWeight: 800,
          borderRadius: 'var(--vibe-radius-card)',
          border: '2px solid var(--color-sparkle-gold)',
          boxShadow:
            '0 16px 40px -8px rgba(0,0,0,0.35), 0 0 24px color-mix(in srgb, var(--color-sparkle-gold) 50%, transparent), inset 0 1px 0 color-mix(in srgb, white 12%, transparent)',
          opacity: 0,
          willChange: 'transform, opacity',
          animation: `levelUp-badgePop ${config.autoDismissMs}ms ${motion.easing} forwards`,
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <Sparkles
          size={Math.round(config.badgeFontPx * 1.1)}
          color="var(--color-sparkle-gold)"
          strokeWidth={1.8}
        />
        <span>Level {newLevel}!</span>
        <Sparkles
          size={Math.round(config.badgeFontPx * 1.1)}
          color="var(--color-sparkle-gold)"
          strokeWidth={1.8}
        />
      </div>

      <style>{`
        @keyframes levelUp-particleSweep {
          0% {
            opacity: 0;
            transform: translateX(-50px) scale(0.6);
          }
          5% {
            opacity: 1;
          }
          50% {
            opacity: 1;
            transform: translateX(50vw) scale(1);
          }
          95% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(calc(100vw + 50px)) scale(0.7);
          }
        }
        @keyframes levelUp-badgePop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          18% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          30% {
            transform: translate(-50%, -50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
        }
      `}</style>
    </div>
  )
}
