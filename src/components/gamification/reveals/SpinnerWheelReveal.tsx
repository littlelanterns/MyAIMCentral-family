/**
 * SpinnerWheelReveal — PRD-24 Gamification Foundation
 *
 * Large spinner wheel centered in modal. User taps to spin. Wheel decelerates
 * dramatically over 3-4s to land on a predetermined result (the result is
 * whatever `props.content` is — the visual is theater). Terminates into
 * RewardCard + RevealSparkle.
 *
 * Quality target: collectible card game polish. Brass-rimmed wheel, generic
 * category icons (no FOMO from competing rewards), brass center hub, sharp
 * pointer. Premium prize-show feel.
 *
 * Phases:
 *   1. PRESENTATION (0.5s) — backdrop fade, wheel scale-up, pointer pulse,
 *      "Tap to Spin!" label
 *   2. SPIN (3-4s, tap-activated) — wheel accelerates instantly then
 *      decelerates with cubic-bezier, lands on segment 0
 *   3. RESULT (0.5s) — winning segment glows, RevealSparkle burst
 *   4. REWARD CARD — RewardCard expands from wheel center
 *
 * Reduced motion: wheel appears static with winning segment pre-highlighted,
 * "Reveal" button shows the reward.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Sparkles, Star, Gift, Heart, Trophy, Award, Crown, Gem } from 'lucide-react'
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

export interface SpinnerWheelSegment {
  /** Optional Lucide icon node — if omitted, a default rotates in */
  icon?: ReactNode
  /** Optional label (currently used for aria only) */
  label?: string
}

export interface SpinnerWheelRevealProps {
  /** Reward content to reveal — actual result is decided by caller, server-side */
  content: RevealContent
  /** Number of wheel segments. Default 8. */
  segmentCount?: 6 | 8 | 12
  /** Optional override segment definitions (icons). Length should match segmentCount. */
  segments?: SpinnerWheelSegment[]
  /** Called when user taps the wheel and the spin completes */
  onComplete?: () => void
  /** Called when user dismisses the final RewardCard */
  onDismiss?: () => void
}

type Phase = 'presenting' | 'idle' | 'spinning' | 'result' | 'rewarded'

// Default generic icons — these are CATEGORY symbols, not specific rewards.
// Avoiding FOMO: kid never sees "I could have gotten X instead".
const DEFAULT_ICON_POOL = [Sparkles, Star, Gift, Heart, Trophy, Award, Crown, Gem] as const

const VIEWBOX_SIZE = 400
const CENTER = VIEWBOX_SIZE / 2

export function SpinnerWheelReveal({
  content,
  segmentCount = 8,
  segments,
  onComplete,
  onDismiss,
}: SpinnerWheelRevealProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('presenting')
  const [rotation, setRotation] = useState(0)
  const [spinTransition, setSpinTransition] = useState<string>('none')
  const wheelRef = useRef<HTMLDivElement>(null)
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  // Shell-aware sizing — wheel diameter capped at 90vw
  const baseDiameter = motion.isPlay ? 320 : motion.isGuided ? 280 : 240
  const wheelDiameter = `min(${baseDiameter}px, 90vw)`

  // Phase timings
  const presentDuration = Math.round(300 * motion.durationMultiplier)
  // Per-shell deceleration: Play is most dramatic, Adult is fastest
  const spinDurationMs = motion.isPlay
    ? Math.round(4000 * motion.durationMultiplier)
    : motion.isGuided
      ? Math.round(3500 * motion.durationMultiplier)
      : Math.round(3000 * motion.durationMultiplier)
  const spinEasing = motion.isPlay
    ? 'cubic-bezier(0.15, 0.80, 0.30, 1.00)'
    : motion.isGuided
      ? 'cubic-bezier(0.20, 0.75, 0.35, 1.00)'
      : 'cubic-bezier(0.25, 0.70, 0.40, 1.00)'
  const resultPulseDuration = Math.round(500 * motion.durationMultiplier)
  const rewardDelay = resultPulseDuration + Math.round(150 * motion.durationMultiplier)

  // Build segment metadata (angle math + icon assignment) once.
  const segmentData = useMemo(() => {
    const sliceDeg = 360 / segmentCount
    return Array.from({ length: segmentCount }, (_, i) => {
      const startAngle = i * sliceDeg
      const endAngle = startAngle + sliceDeg
      const midAngle = startAngle + sliceDeg / 2
      // Path: M center → L startEdge → A radius → Z (close)
      const r = CENTER - 4 // small inset for outer rim
      const startRad = ((startAngle - 90) * Math.PI) / 180
      const endRad = ((endAngle - 90) * Math.PI) / 180
      const x1 = CENTER + r * Math.cos(startRad)
      const y1 = CENTER + r * Math.sin(startRad)
      const x2 = CENTER + r * Math.cos(endRad)
      const y2 = CENTER + r * Math.sin(endRad)
      const largeArc = sliceDeg > 180 ? 1 : 0
      const path = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

      // Icon midpoint (for placement)
      const iconRad = ((midAngle - 90) * Math.PI) / 180
      const iconR = r * 0.62
      const iconX = CENTER + iconR * Math.cos(iconRad)
      const iconY = CENTER + iconR * Math.sin(iconRad)

      // 3-color cycle
      const colorIndex = i % 3
      const fill =
        colorIndex === 0
          ? 'var(--color-accent, #7C6DD8)'
          : colorIndex === 1
            ? 'color-mix(in srgb, var(--color-accent, #7C6DD8) 50%, var(--color-bg-card, #FFFFFF))'
            : 'var(--color-bg-secondary, #1F2937)'

      // Use override icon if provided, else default rotation
      const overrideIcon = segments?.[i]?.icon
      const DefaultIcon = DEFAULT_ICON_POOL[i % DEFAULT_ICON_POOL.length]

      return {
        index: i,
        path,
        fill,
        midAngle,
        iconX,
        iconY,
        overrideIcon,
        DefaultIcon,
        label: segments?.[i]?.label,
      }
    })
  }, [segmentCount, segments])

  // Pointer is fixed at the top (0° in screen-space, which is -90° in our SVG math).
  // We want the WINNING segment (index 0) to land under the pointer.
  // Segment 0 is centered at midAngle = sliceDeg/2 (e.g. 22.5° for 8 segments).
  // To land segment 0 at top, we need to rotate the wheel by -midAngle (or 360-midAngle).
  const winningOffsetDeg = useMemo(() => {
    const sliceDeg = 360 / segmentCount
    return -(sliceDeg / 2)
  }, [segmentCount])

  // Move from presenting → idle once scale-up finishes
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase('idle')
      return
    }
    if (phase !== 'presenting') return
    const total = presentDuration + 500 // include pointer pulse + label fade
    const t = setTimeout(() => setPhase('idle'), total)
    return () => clearTimeout(t)
  }, [phase, prefersReducedMotion, presentDuration])

  // Spin → result transition
  useEffect(() => {
    if (phase !== 'spinning') return
    const t = setTimeout(() => {
      setPhase('result')
    }, spinDurationMs)
    return () => clearTimeout(t)
  }, [phase, spinDurationMs])

  // Result → rewarded transition
  useEffect(() => {
    if (phase !== 'result') return
    const t = setTimeout(() => {
      // Capture wheel center for RewardCard expand origin
      const el = wheelRef.current
      if (el) setOriginRect(el.getBoundingClientRect())
      setPhase('rewarded')
      onComplete?.()
    }, rewardDelay)
    return () => clearTimeout(t)
  }, [phase, rewardDelay, onComplete])

  function handleSpin() {
    if (phase !== 'idle') return
    if (prefersReducedMotion) {
      // Skip spin entirely — show reward immediately
      const el = wheelRef.current
      if (el) setOriginRect(el.getBoundingClientRect())
      setPhase('rewarded')
      onComplete?.()
      return
    }
    // Compute target rotation: 5+ full spins + offset to land on segment 0
    const fullSpins = 5 + Math.random() * 1.5 // 5.0 - 6.5 spins
    const target = 360 * fullSpins + winningOffsetDeg
    setSpinTransition(`transform ${spinDurationMs}ms ${spinEasing}`)
    setRotation(target)
    setPhase('spinning')
  }

  function handleDismiss() {
    onDismiss?.()
  }

  // Icon size based on wheel and segment count
  const iconSize = motion.isPlay ? 28 : motion.isGuided ? 24 : 20

  return (
    <div
      role="dialog"
      aria-label="Spin the wheel to reveal your reward"
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
        animation: prefersReducedMotion ? 'none' : 'spinnerWheel-backdropFade 400ms ease forwards',
        opacity: 0,
      }}
    >
      {/* Wheel + pointer container */}
      {phase !== 'rewarded' && (
        <div
          ref={wheelRef}
          style={{
            position: 'relative',
            width: wheelDiameter,
            aspectRatio: '1 / 1',
            marginBottom: '2rem',
            animation: prefersReducedMotion
              ? 'none'
              : `spinnerWheel-scaleIn ${presentDuration}ms ${motion.easing} forwards`,
            opacity: prefersReducedMotion ? 1 : 0,
            transform: prefersReducedMotion ? 'scale(1)' : 'scale(0)',
            willChange: 'transform, opacity',
          }}
        >
          {/* Pointer arrow at top, pointing down */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: -8,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '24px solid var(--color-sparkle-gold, #D4AF37)',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
              animation: prefersReducedMotion
                ? 'none'
                : `spinnerWheel-pointerPulse 400ms ${motion.easing} ${presentDuration}ms backwards`,
              zIndex: 3,
            }}
          />

          {/* The spinning wheel */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotate(${rotation}deg)`,
              transition: spinTransition,
              willChange: 'transform',
              filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.5))',
            }}
          >
            <button
              type="button"
              onClick={handleSpin}
              disabled={phase !== 'idle'}
              aria-label={phase === 'idle' ? 'Tap to spin the wheel' : 'Wheel'}
              style={{
                position: 'absolute',
                inset: 0,
                padding: 0,
                background: 'transparent',
                border: 'none',
                cursor: phase === 'idle' ? 'pointer' : 'default',
                borderRadius: '50%',
                WebkitTapHighlightColor: 'transparent',
                minWidth: motion.touchTargetMin,
                minHeight: motion.touchTargetMin,
              }}
            >
              <svg
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                }}
              >
                {/* Outer rim */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={CENTER - 2}
                  fill="none"
                  stroke="var(--color-accent-deep, #5B4BB0)"
                  strokeWidth={6}
                />

                {/* Segments */}
                {segmentData.map((seg) => {
                  const isWinner = phase === 'result' && seg.index === 0
                  return (
                    <g key={seg.index}>
                      <path
                        d={seg.path}
                        fill={seg.fill}
                        stroke="color-mix(in srgb, var(--color-accent-deep, #5B4BB0) 70%, transparent)"
                        strokeWidth={1.5}
                        style={{
                          filter: isWinner
                            ? 'brightness(1.4) drop-shadow(0 0 12px var(--color-sparkle-gold, #D4AF37))'
                            : undefined,
                          transition: 'filter 300ms ease',
                        }}
                      />
                      {/* Icon centered in segment */}
                      <foreignObject
                        x={seg.iconX - iconSize / 2}
                        y={seg.iconY - iconSize / 2}
                        width={iconSize}
                        height={iconSize}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-btn-primary-text, #FFFFFF)',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                          }}
                        >
                          {seg.overrideIcon ?? <seg.DefaultIcon size={iconSize} strokeWidth={2} />}
                        </div>
                      </foreignObject>
                    </g>
                  )
                })}

                {/* Inner rim accent */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={CENTER - 8}
                  fill="none"
                  stroke="color-mix(in srgb, var(--color-accent-deep, #5B4BB0) 40%, transparent)"
                  strokeWidth={1}
                />

                {/* Center hub */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={26}
                  fill="var(--color-sparkle-gold, #D4AF37)"
                  stroke="var(--color-sparkle-gold-dark, #B8942A)"
                  strokeWidth={3}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                  }}
                />
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={18}
                  fill="none"
                  stroke="var(--color-sparkle-gold-light, #E8C547)"
                  strokeWidth={1.5}
                />
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={6}
                  fill="var(--color-sparkle-gold-dark, #B8942A)"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Label */}
      {phase !== 'rewarded' && (
        <div
          style={{
            color: 'var(--color-bg-card, #FFFFFF)',
            fontSize: motion.isPlay ? '1.5rem' : motion.isGuided ? '1.25rem' : '1.125rem',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            opacity: phase === 'idle' || phase === 'presenting' ? 1 : 0,
            transition: 'opacity 400ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={motion.isPlay ? 24 : 20} />
          {prefersReducedMotion
            ? motion.isPlay
              ? 'Tap to Reveal!'
              : 'Tap to reveal'
            : motion.isPlay
              ? 'Tap to Spin!'
              : motion.isGuided
                ? 'Tap to Spin!'
                : 'Tap to spin'}
          <Sparkles size={motion.isPlay ? 24 : 20} />
        </div>
      )}

      {/* Reduced motion: explicit Reveal button below the wheel */}
      {prefersReducedMotion && phase === 'idle' && (
        <button
          type="button"
          onClick={handleSpin}
          style={{
            marginTop: '1rem',
            minHeight: motion.touchTargetMin,
            padding: '0.75rem 1.75rem',
            background: 'var(--surface-primary, var(--color-btn-primary-bg, #7C6DD8))',
            color: 'var(--color-btn-primary-text, #FFFFFF)',
            border: 'none',
            borderRadius: 'var(--vibe-radius-input, 999px)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reveal
        </button>
      )}

      {/* Reward card */}
      {phase === 'rewarded' && (
        <>
          <RevealSparkle
            mode="burst"
            origin={
              originRect
                ? {
                    x: originRect.x + originRect.width / 2,
                    y: originRect.y + originRect.height / 2,
                  }
                : undefined
            }
            palette="goldAccent"
            baseCount={18}
          />
          <RewardCard
            title={content.title}
            description={content.description}
            imageUrl={content.imageUrl}
            pointValue={content.pointValue}
            onDismiss={handleDismiss}
            entryAnimation={prefersReducedMotion ? 'fade' : 'expand'}
            originRect={originRect ?? undefined}
          />
        </>
      )}

      <style>{`
        @keyframes spinnerWheel-backdropFade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes spinnerWheel-scaleIn {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          70% {
            opacity: 1;
            transform: scale(1.04);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes spinnerWheel-pointerPulse {
          0%   { transform: translateX(-50%) scale(1); }
          50%  { transform: translateX(-50%) scale(1.15); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
