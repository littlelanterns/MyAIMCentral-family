/**
 * StarChartAnimation — PRD-24 Gamification Widget Animation
 *
 * A star flies from a task completion button to its destination grid slot in
 * a Star Chart widget. Settles with a bounce. Counter updates with the new
 * number sliding in. If the chart is complete, every slot pulses simultaneously
 * (staggered) and a full celebration plays.
 *
 * Quality target: collectible card game polish — natural toss, not robotic
 * translation. Match CardFlipReveal's bar.
 *
 * Phases:
 *   1. FLIGHT      — star travels from origin → target slot
 *                    Play: parabolic arc with peak above midpoint, wobble + sparkle trail
 *                    Guided: gentler arc, no wobble
 *                    Independent / Adult: straight line
 *   2. LANDING     — bounce scale 1.0 → 1.2 → 1.0 + sparkle burst at slot
 *   3. COUNTER     — old number slides up + fades, new number slides in (if starCount provided)
 *   4. CHART CELEBRATION — only if isChartComplete: ghost grid of stars pulses
 *      with stagger, then a full victory sparkle burst from chart center
 *   5. COMPLETE
 *
 * Reduced motion fallback: star appears instantly at target, counter swaps
 * instantly, chart-complete shows a static gold border for 1.5s — but every
 * callback still fires on the same timeline so consumer flow is preserved.
 */

import { useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'
import { RevealSparkle } from '../shared/RevealSparkle'

// ─── Types ──────────────────────────────────────────────────────

type RectLike = DOMRect | { x: number; y: number; width: number; height: number }

export interface StarChartAnimationProps {
  /** Viewport rect of the task card / button where the star originates */
  originRect: RectLike
  /** Viewport rect of the destination grid slot in the Star Chart widget */
  targetSlotRect: RectLike
  /** True triggers the full chart-complete celebration after the flight lands */
  isChartComplete?: boolean
  /** New star count to animate the counter to */
  starCount?: number
  /** Total grid slots, for context */
  totalSlots?: number
  /** Called after the star settles in the grid slot */
  onFlightComplete?: () => void
  /** Called after the chart-complete celebration finishes (only if isChartComplete) */
  onCelebrationComplete?: () => void
}

type Phase = 'flying' | 'landing' | 'counter' | 'chart-celebration' | 'complete'

interface Point {
  x: number
  y: number
}

// ─── Helpers ────────────────────────────────────────────────────

function rectCenter(rect: RectLike): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

/** Quadratic bezier interpolation: B(t) = (1-t)²P0 + 2(1-t)t·P1 + t²P2 */
function quadBezier(t: number, p0: Point, p1: Point, p2: Point): Point {
  const inv = 1 - t
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
  }
}

/** Ease-out cubic — feels like natural physics deceleration on landing */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// ─── Component ──────────────────────────────────────────────────

export function StarChartAnimation({
  originRect,
  targetSlotRect,
  isChartComplete = false,
  starCount,
  totalSlots = 10,
  onFlightComplete,
  onCelebrationComplete,
}: StarChartAnimationProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('flying')
  const starRef = useRef<HTMLDivElement>(null)
  const trailContainerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const trailEmitTimerRef = useRef<number | null>(null)

  // ─── Geometry ────────────────────────────────────────────────
  const origin = rectCenter(originRect)
  const target = rectCenter(targetSlotRect)

  // Parabolic arc peak depends on shell. Play arches highest, Guided gentler,
  // Independent/Adult fly straight (control point on the line).
  const midpoint: Point = {
    x: (origin.x + target.x) / 2,
    y: (origin.y + target.y) / 2,
  }
  const peakOffset = motion.isPlay
    ? 80 * motion.scaleMultiplier
    : motion.isGuided
      ? 40 * motion.scaleMultiplier
      : 0
  const controlPoint: Point = {
    x: midpoint.x,
    y: midpoint.y - peakOffset,
  }

  // ─── Sizing & timing ─────────────────────────────────────────
  const starSize = Math.round(28 * motion.scaleMultiplier)
  const flightDurationMs = Math.round(600 * motion.durationMultiplier)
  const bounceDurationMs = Math.round(200 * motion.durationMultiplier)
  const counterSlideMs = Math.round(250 * motion.durationMultiplier)
  const burstDurationMs = Math.round(700 * motion.durationMultiplier)
  const ghostPulseDurationMs = Math.round(300 * motion.durationMultiplier)
  const ghostStaggerMs = Math.round(50 * motion.durationMultiplier)

  // ─── Cleanup helper ──────────────────────────────────────────
  function clearAllTimers() {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (trailEmitTimerRef.current !== null) {
      window.clearInterval(trailEmitTimerRef.current)
      trailEmitTimerRef.current = null
    }
  }

  function scheduleTimer(fn: () => void, delay: number) {
    const id = window.setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  // ─── Reduced-motion fast-path ────────────────────────────────
  // Star appears instantly at target. Callbacks still fire on the same
  // timeline so consuming code's flow is preserved.
  useEffect(() => {
    if (!prefersReducedMotion) return

    // Position star at target immediately
    if (starRef.current) {
      starRef.current.style.transform = `translate(${target.x - starSize / 2}px, ${target.y - starSize / 2}px)`
      starRef.current.style.opacity = '1'
    }

    // Mirror the animated timeline
    scheduleTimer(() => {
      setPhase('landing')
      onFlightComplete?.()
    }, flightDurationMs)

    if (isChartComplete) {
      const celebrationDelay = flightDurationMs + bounceDurationMs + counterSlideMs
      scheduleTimer(() => {
        setPhase('chart-celebration')
      }, celebrationDelay)

      // Static gold border holds for 1.5s, then complete
      scheduleTimer(() => {
        setPhase('complete')
        onCelebrationComplete?.()
      }, celebrationDelay + 1500)
    } else {
      scheduleTimer(() => {
        setPhase('complete')
      }, flightDurationMs + bounceDurationMs + counterSlideMs)
    }

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion])

  // ─── Animated flight (RAF loop) ──────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'flying') return

    const startTime = performance.now()
    const useArc = motion.isPlay || motion.isGuided

    function frame(now: number) {
      const elapsed = now - startTime
      const linearT = Math.min(1, elapsed / flightDurationMs)
      const t = easeOutCubic(linearT)

      let pos: Point
      if (useArc) {
        pos = quadBezier(t, origin, controlPoint, target)
      } else {
        // Straight line for Independent / Adult
        pos = {
          x: origin.x + (target.x - origin.x) * t,
          y: origin.y + (target.y - origin.y) * t,
        }
      }

      const el = starRef.current
      if (el) {
        // Subtle wobble rotation only on Play
        const wobble = motion.hasIdleAnimations
          ? Math.sin(elapsed / 60) * 10
          : 0
        el.style.transform = `translate(${pos.x - starSize / 2}px, ${pos.y - starSize / 2}px) rotate(${wobble}deg)`
        el.style.opacity = '1'
      }

      if (linearT < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        rafRef.current = null
        setPhase('landing')
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefersReducedMotion])

  // ─── Trailing sparkle emit (Play only) ───────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'flying') return
    if (!motion.isPlay) return

    // Emit a trailing particle every ~80ms during flight
    const emitInterval = 80
    let emitCount = 0
    const maxEmits = Math.ceil(flightDurationMs / emitInterval)

    function emitTrailParticle() {
      const container = trailContainerRef.current
      const star = starRef.current
      if (!container || !star) return

      // Read star's current transform position
      const starTransform = star.style.transform
      const match = starTransform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
      if (!match) return
      const sx = parseFloat(match[1]) + starSize / 2
      const sy = parseFloat(match[2]) + starSize / 2

      const particle = document.createElement('div')
      const size = 4 + Math.random() * 4
      particle.style.cssText = `
        position: absolute;
        left: ${sx - size / 2}px;
        top: ${sy - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: var(--color-sparkle-gold-light, #E8C547);
        box-shadow: 0 0 6px var(--color-sparkle-gold, #D4AF37);
        opacity: 0.9;
        pointer-events: none;
        will-change: transform, opacity;
        animation: starChart-trailFade 600ms ease-out forwards;
      `
      container.appendChild(particle)
      // Remove after animation
      window.setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle)
      }, 700)

      emitCount++
      if (emitCount >= maxEmits && trailEmitTimerRef.current !== null) {
        window.clearInterval(trailEmitTimerRef.current)
        trailEmitTimerRef.current = null
      }
    }

    trailEmitTimerRef.current = window.setInterval(emitTrailParticle, emitInterval)
    return () => {
      if (trailEmitTimerRef.current !== null) {
        window.clearInterval(trailEmitTimerRef.current)
        trailEmitTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefersReducedMotion])

  // ─── Landing → counter → (celebration | complete) ────────────
  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'landing') return

    onFlightComplete?.()

    // Hold landing for the bounce, then move to counter (if applicable) or celebration
    scheduleTimer(() => {
      if (starCount !== undefined) {
        setPhase('counter')
      } else if (isChartComplete) {
        setPhase('chart-celebration')
      } else {
        setPhase('complete')
      }
    }, bounceDurationMs)

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'counter') return

    scheduleTimer(() => {
      if (isChartComplete) {
        setPhase('chart-celebration')
      } else {
        setPhase('complete')
      }
    }, counterSlideMs * 2 + 50)

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'chart-celebration') return

    // Total celebration time = ghost stagger ramp + final pulse + burst
    const ghostTotal = ghostStaggerMs * totalSlots + ghostPulseDurationMs
    const totalCelebration = ghostTotal + burstDurationMs

    scheduleTimer(() => {
      setPhase('complete')
      onCelebrationComplete?.()
    }, totalCelebration)

    return clearAllTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prefersReducedMotion])

  // ─── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return clearAllTimers
  }, [])

  // ─── Ghost grid positions (for chart-complete celebration) ────
  // Compute a 5-column grid of slot positions centered on the target slot.
  // We don't have access to the real chart DOM — these are conceptual stars
  // overlaid in roughly the chart area.
  const ghostStars: Point[] = (() => {
    if (!isChartComplete || phase !== 'chart-celebration') return []
    const cols = Math.min(5, totalSlots)
    const rows = Math.ceil(totalSlots / cols)
    const slotSize = Math.max(targetSlotRect.width, targetSlotRect.height)
    const spacing = slotSize * 1.2
    // Center grid on target slot center
    const gridWidth = (cols - 1) * spacing
    const gridHeight = (rows - 1) * spacing
    const startX = target.x - gridWidth / 2
    const startY = target.y - gridHeight / 2

    const points: Point[] = []
    for (let i = 0; i < totalSlots; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      points.push({
        x: startX + col * spacing,
        y: startY + row * spacing,
      })
    }
    return points
  })()

  // ─── Counter rendering ───────────────────────────────────────
  const counterPos: Point = {
    x: target.x,
    y: target.y - 16 - targetSlotRect.height / 2,
  }
  const showCounter = phase === 'counter' || phase === 'chart-celebration' || phase === 'complete'
  const oldCount = starCount !== undefined ? Math.max(0, starCount - 1) : null

  // ─── Static-fallback gold border (reduced motion + chart complete) ───
  const showStaticGoldBorder =
    prefersReducedMotion && isChartComplete && phase === 'chart-celebration'

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
        overflow: 'hidden',
      }}
    >
      {/* ─── Trailing sparkle container (Play shell only) ─── */}
      {motion.isPlay && phase === 'flying' && (
        <div
          ref={trailContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ─── The flying star ─── */}
      {(phase === 'flying' || phase === 'landing') && (
        <div
          ref={starRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: starSize,
            height: starSize,
            opacity: 0,
            willChange: 'transform, opacity',
            // Bounce animation only fires on landing phase
            animation:
              phase === 'landing' && !prefersReducedMotion
                ? `starChart-bounce ${bounceDurationMs}ms ${motion.easing} forwards`
                : undefined,
            transformOrigin: 'center center',
            // Static positioning at target during reduced-motion landing
            transform:
              prefersReducedMotion && phase === 'landing'
                ? `translate(${target.x - starSize / 2}px, ${target.y - starSize / 2}px)`
                : undefined,
            color: 'var(--color-sparkle-gold, #D4AF37)',
            filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 70%, transparent))',
          }}
        >
          <Star
            size={starSize}
            fill="var(--color-sparkle-gold, #D4AF37)"
            color="var(--color-sparkle-gold, #D4AF37)"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* ─── Landing sparkle burst ─── */}
      {phase === 'landing' && !prefersReducedMotion && (
        <RevealSparkle
          mode="burst"
          origin={target}
          palette="goldAccent"
          baseCount={10}
          baseRadius={70}
          baseDuration={burstDurationMs}
        />
      )}

      {/* ─── Counter (slides up + replaces) ─── */}
      {showCounter && starCount !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: counterPos.x,
            top: counterPos.y,
            transform: 'translate(-50%, -100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'relative',
              minWidth: 36,
              height: 24,
              padding: '2px 8px',
              borderRadius: 'var(--vibe-radius-card, 12px)',
              backgroundColor: 'var(--color-bg-card, #FFFFFF)',
              border: '1.5px solid var(--color-sparkle-gold, #D4AF37)',
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.25), 0 0 0 1px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: 0,
              willChange: 'transform, opacity',
              animation: prefersReducedMotion
                ? 'starChart-counterFadeStatic 200ms ease forwards'
                : `starChart-counterChipIn ${counterSlideMs}ms ${motion.easing} forwards`,
            }}
          >
            <Star
              size={12}
              fill="var(--color-sparkle-gold, #D4AF37)"
              color="var(--color-sparkle-gold, #D4AF37)"
              strokeWidth={1.5}
              style={{ marginRight: 2 }}
            />
            {/* Old number sliding up + out */}
            {oldCount !== null && phase === 'counter' && !prefersReducedMotion && (
              <span
                style={{
                  position: 'absolute',
                  left: 22,
                  top: '50%',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-text-heading, #1F2937)',
                  willChange: 'transform, opacity',
                  animation: `starChart-counterSlideOut ${counterSlideMs}ms ${motion.easing} forwards`,
                }}
              >
                {oldCount}
              </span>
            )}
            {/* New number sliding in */}
            <span
              style={{
                position: 'absolute',
                left: 22,
                top: '50%',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-text-heading, #1F2937)',
                willChange: 'transform, opacity',
                animation: prefersReducedMotion
                  ? 'starChart-counterStaticIn 0ms forwards'
                  : phase === 'counter'
                    ? `starChart-counterSlideIn ${counterSlideMs}ms ${motion.easing} ${counterSlideMs * 0.6}ms forwards`
                    : 'starChart-counterStaticIn 0ms forwards',
              }}
            >
              {starCount}
            </span>
          </div>
        </div>
      )}

      {/* ─── Chart celebration: ghost grid pulse + final burst ─── */}
      {phase === 'chart-celebration' && !prefersReducedMotion && (
        <>
          {ghostStars.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x - starSize / 2,
                top: p.y - starSize / 2,
                width: starSize,
                height: starSize,
                color: 'var(--color-sparkle-gold, #D4AF37)',
                filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 70%, transparent))',
                opacity: 0,
                willChange: 'transform, opacity',
                animation: `starChart-ghostPulse ${ghostPulseDurationMs}ms ${motion.easing} ${i * ghostStaggerMs}ms forwards`,
                transformOrigin: 'center center',
              }}
            >
              <Star
                size={starSize}
                fill="var(--color-sparkle-gold, #D4AF37)"
                color="var(--color-sparkle-gold, #D4AF37)"
                strokeWidth={1.5}
              />
            </div>
          ))}
          {/* Final victory burst from chart center, fired after the ghost stagger */}
          <DelayedBurst
            origin={target}
            delay={ghostStaggerMs * totalSlots + ghostPulseDurationMs * 0.5}
            duration={burstDurationMs}
          />
        </>
      )}

      {/* ─── Reduced-motion gold border (chart complete) ─── */}
      {showStaticGoldBorder && (
        <div
          style={{
            position: 'absolute',
            left: target.x - targetSlotRect.width * 3,
            top: target.y - targetSlotRect.height * 3,
            width: targetSlotRect.width * 6,
            height: targetSlotRect.height * 6,
            border: '3px solid var(--color-sparkle-gold, #D4AF37)',
            borderRadius: 'var(--vibe-radius-card, 12px)',
            boxShadow:
              '0 0 24px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 60%, transparent), inset 0 0 16px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent)',
            opacity: 0,
            animation: 'starChart-staticBorderFade 1500ms ease forwards',
          }}
        />
      )}

      {/* ─── Inline keyframes ─── */}
      <style>{`
        @keyframes starChart-bounce {
          0%   { transform: translate(${target.x - starSize / 2}px, ${target.y - starSize / 2}px) scale(1); }
          50%  { transform: translate(${target.x - starSize / 2}px, ${target.y - starSize / 2}px) scale(1.2); }
          100% { transform: translate(${target.x - starSize / 2}px, ${target.y - starSize / 2}px) scale(1); }
        }
        @keyframes starChart-trailFade {
          0%   { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
        @keyframes starChart-counterChipIn {
          0%   { opacity: 0; transform: translate(-50%, -100%) translateY(8px) scale(0.85); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: translate(-50%, -100%) translateY(0) scale(1); }
        }
        @keyframes starChart-counterFadeStatic {
          0%   { opacity: 0; transform: translate(-50%, -100%); }
          100% { opacity: 1; transform: translate(-50%, -100%); }
        }
        @keyframes starChart-counterSlideOut {
          0%   { transform: translateY(-50%) translateY(0); opacity: 1; }
          100% { transform: translateY(-50%) translateY(-12px); opacity: 0; }
        }
        @keyframes starChart-counterSlideIn {
          0%   { transform: translateY(-50%) translateY(12px); opacity: 0; }
          100% { transform: translateY(-50%) translateY(0); opacity: 1; }
        }
        @keyframes starChart-counterStaticIn {
          0%   { transform: translateY(-50%); opacity: 1; }
          100% { transform: translateY(-50%); opacity: 1; }
        }
        @keyframes starChart-ghostPulse {
          0%   { opacity: 0; transform: scale(1); }
          15%  { opacity: 1; transform: scale(1); }
          50%  { opacity: 1; transform: scale(1.1); }
          85%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes starChart-staticBorderFade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── DelayedBurst — fires a victory RevealSparkle after a delay ───

interface DelayedBurstProps {
  origin: Point
  delay: number
  duration: number
}

function DelayedBurst({ origin, delay, duration }: DelayedBurstProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delay)
    return () => window.clearTimeout(t)
  }, [delay])

  if (!show) return null
  return (
    <RevealSparkle
      mode="burst"
      origin={origin}
      palette="victory"
      baseCount={30}
      baseRadius={180}
      baseDuration={duration}
    />
  )
}
