/**
 * TreasureBoxIdle — PRD-24 Gamification Foundation
 *
 * 1×1 dashboard widget rendering a treasure box with three states:
 *   locked        — progress ring around the box, breathing idle, optional shimmer
 *   transitioning — shake + gold flash + sparkle burst, then calls onTransitionComplete
 *   unlocked      — gold-tinted box, bouncing idle, gold ring pulse, tappable
 *
 * Glow = actionable in MyAIM. Locked has NO glow; unlocked DOES.
 *
 * Reduced motion: all states render statically. Transitioning fires
 * onTransitionComplete after 100ms so the parent state machine still flows.
 */

import { useEffect, useRef } from 'react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'
import { RevealSparkle } from '../shared/RevealSparkle'

export type TreasureBoxState = 'locked' | 'unlocked' | 'transitioning'

export interface TreasureBoxIdleProps {
  /** Image URL for the box illustration */
  imageUrl: string
  /** Current state */
  state: TreasureBoxState
  /** Progress percentage 0-100, only relevant in 'locked' state */
  progressPercent?: number
  /** For 'locked': numerator/denominator label like "7/10 tasks" */
  progressLabel?: string
  /** Called after the locked → unlocked transition completes */
  onTransitionComplete?: () => void
  /** Called when user taps the box (only callable in 'unlocked' state) */
  onTap?: () => void
}

const RING_RADIUS = 46
const RING_STROKE = 4
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function TreasureBoxIdle({
  imageUrl,
  state,
  progressPercent = 0,
  progressLabel,
  onTransitionComplete,
  onTap,
}: TreasureBoxIdleProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  // Transitioning timer — single timeout, cleaned on unmount
  const transitionTimerRef = useRef<number | null>(null)
  const transitionDurationMs = prefersReducedMotion
    ? 100
    : Math.round(800 * motion.durationMultiplier)

  useEffect(() => {
    if (state !== 'transitioning') return

    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current)
    }
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      onTransitionComplete?.()
    }, transitionDurationMs)

    return () => {
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }
    }
  }, [state, transitionDurationMs, onTransitionComplete])

  // Cleanup on unmount in case timer is still running
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }
    }
  }, [])

  // ─── Ring math ──────────────────────────────────────────────
  const clampedPercent = Math.max(0, Math.min(100, progressPercent))
  // When unlocked or transitioning, ring should be fully filled
  const effectivePercent = state === 'locked' ? clampedPercent : 100
  const dashOffset = RING_CIRCUMFERENCE - (effectivePercent / 100) * RING_CIRCUMFERENCE

  // Ring color: accent in locked, gold in unlocked/transitioning
  const ringColor =
    state === 'locked' ? 'var(--color-accent)' : 'var(--color-sparkle-gold)'

  // Idle animation flags
  const idleEnabled = motion.hasIdleAnimations && !prefersReducedMotion
  const showShimmer = idleEnabled && motion.isPlay && state === 'locked'
  const showOrbitParticles = idleEnabled && motion.isPlay && state === 'unlocked'

  // ─── Idle animation name selection ──────────────────────────
  let boxIdleAnimation = 'none'
  if (idleEnabled) {
    if (state === 'locked') {
      boxIdleAnimation = 'treasureBox-breathe 3s ease-in-out infinite'
    } else if (state === 'unlocked') {
      const bounceName = motion.isPlay
        ? 'treasureBox-bouncePlay'
        : motion.isIndependent
          ? 'treasureBox-bounceSubtle'
          : 'treasureBox-bounceStandard'
      boxIdleAnimation = `${bounceName} 2s ease-in-out infinite`
    }
  }

  // Shake during transition (skip when reduced motion)
  if (state === 'transitioning' && !prefersReducedMotion) {
    boxIdleAnimation = `treasureBox-shake ${transitionDurationMs * 0.5}ms ease-in-out forwards, treasureBox-flash ${transitionDurationMs * 0.6}ms ease-out forwards`
  }

  // ─── Sparkle burst origin (center of widget) ────────────────
  const widgetRef = useRef<HTMLDivElement>(null)
  const burstOriginRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (state === 'transitioning' && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect()
      burstOriginRef.current = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      }
    }
  }, [state])

  // ─── Render ─────────────────────────────────────────────────
  const isInteractive = state === 'unlocked'
  const Wrapper = isInteractive ? 'button' : 'div'

  return (
    <div
      ref={widgetRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        minWidth: 80,
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Wrapper
        type={isInteractive ? 'button' : undefined}
        onClick={isInteractive ? onTap : undefined}
        aria-label={
          state === 'unlocked'
            ? 'Open treasure box'
            : state === 'transitioning'
              ? 'Treasure box unlocking'
              : `Treasure box, ${progressLabel ?? `${clampedPercent}%`}`
        }
        disabled={isInteractive ? false : undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: isInteractive ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          willChange: 'transform',
          animation: boxIdleAnimation,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* SVG progress ring overlay */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            stroke="color-mix(in srgb, var(--color-accent) 30%, transparent)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            style={{
              transition: prefersReducedMotion
                ? 'none'
                : 'stroke-dashoffset 500ms ease, stroke 300ms ease',
            }}
          />
        </svg>

        {/* Pulse glow ring (unlocked only) */}
        {state === 'unlocked' && !prefersReducedMotion && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '8%',
              borderRadius: '50%',
              pointerEvents: 'none',
              willChange: 'box-shadow',
              animation: 'treasureBox-ringPulse 3s ease-in-out infinite',
            }}
          />
        )}

        {/* The box image itself */}
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: 'relative',
            width: '70%',
            height: '70%',
            objectFit: 'contain',
            filter:
              state === 'unlocked'
                ? 'drop-shadow(0 0 20px var(--color-sparkle-gold))'
                : state === 'transitioning'
                  ? 'drop-shadow(0 0 24px var(--color-sparkle-gold))'
                  : undefined,
            transition: prefersReducedMotion ? 'none' : 'filter 300ms ease',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Shimmer sweep — Play locked only */}
        {showShimmer && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: '-50%',
              width: '60%',
              height: '100%',
              background:
                'linear-gradient(115deg, transparent 30%, color-mix(in srgb, white 22%, transparent) 50%, transparent 70%)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
              willChange: 'transform, opacity',
              animation: 'treasureBox-shimmer 6s ease-in-out infinite',
            }}
          />
        )}

        {/* Orbit particles — Play unlocked only */}
        {showOrbitParticles && (
          <>
            {[0, 120, 240].map((angleDeg, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 6,
                  height: 6,
                  marginLeft: -3,
                  marginTop: -3,
                  borderRadius: '50%',
                  background: 'var(--color-sparkle-gold)',
                  boxShadow: '0 0 6px var(--color-sparkle-gold-light)',
                  pointerEvents: 'none',
                  willChange: 'transform',
                  animation: `treasureBox-orbit 4s linear infinite`,
                  animationDelay: `${(i * 4) / 3}s`,
                  ['--orbit-start' as string]: `${angleDeg}deg`,
                } as React.CSSProperties}
              />
            ))}
          </>
        )}
      </Wrapper>

      {/* Progress label below box (locked state) */}
      {state === 'locked' && progressLabel && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            pointerEvents: 'none',
          }}
        >
          {progressLabel}
        </div>
      )}

      {/* "Ready to open!" label below box (unlocked state) */}
      {state === 'unlocked' && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-sparkle-gold)',
            pointerEvents: 'none',
          }}
        >
          {motion.isPlay ? 'Open me!' : 'Ready to open!'}
        </div>
      )}

      {/* Sparkle burst during transition (skipped on reduced motion) */}
      {state === 'transitioning' && !prefersReducedMotion && burstOriginRef.current && (
        <RevealSparkle
          mode="burst"
          origin={burstOriginRef.current}
          palette="goldAccent"
          baseCount={10}
          baseRadius={70}
          baseDuration={transitionDurationMs}
        />
      )}

      <style>{`
        @keyframes treasureBox-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
        @keyframes treasureBox-bouncePlay {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes treasureBox-bounceStandard {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes treasureBox-bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        @keyframes treasureBox-shake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-3px); }
          40%  { transform: translateX(3px); }
          60%  { transform: translateX(-3px); }
          80%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        @keyframes treasureBox-flash {
          0%   { box-shadow: 0 0 0 0 var(--color-sparkle-gold); }
          40%  { box-shadow: 0 0 24px 6px var(--color-sparkle-gold); }
          100% { box-shadow: 0 0 0 0 var(--color-sparkle-gold); }
        }
        @keyframes treasureBox-shimmer {
          0%   { transform: translateX(0); opacity: 0; }
          15%  { opacity: 0.9; }
          50%  { opacity: 0.9; }
          80%  { transform: translateX(280%); opacity: 0; }
          100% { transform: translateX(280%); opacity: 0; }
        }
        @keyframes treasureBox-ringPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-sparkle-gold) 0%, transparent);
          }
          50% {
            box-shadow: 0 0 16px 4px color-mix(in srgb, var(--color-sparkle-gold) 60%, transparent);
          }
        }
        @keyframes treasureBox-orbit {
          0% {
            transform: rotate(var(--orbit-start)) translateY(-52px) rotate(calc(-1 * var(--orbit-start)));
          }
          100% {
            transform: rotate(calc(var(--orbit-start) + 360deg)) translateY(-52px) rotate(calc(-1 * (var(--orbit-start) + 360deg)));
          }
        }
      `}</style>
    </div>
  )
}
