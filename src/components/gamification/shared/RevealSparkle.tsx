/**
 * RevealSparkle — PRD-24 Gamification Foundation
 *
 * Theme-aware particle system for reveal animations. This is INTENTIONALLY
 * separate from SparkleOverlay (convention #46: SparkleOverlay is exclusively
 * for victory celebrations in the Play shell, gold-only).
 *
 * RevealSparkle adapts to the current theme via --color-accent variants and
 * supports four modes:
 *
 *   burst   — radial burst from origin (default for reveal completions)
 *   shower  — falling from above (rain of particles for big rewards)
 *   trail   — follows a path between two points (handoff animations)
 *   sync    — burst timed to start at a delay (for video/animation sync)
 *
 * Particle counts auto-scale via useShellAwareMotion().particleMultiplier.
 * Respects prefers-reduced-motion with a brief static glow fallback.
 */

import { useEffect, useRef } from 'react'
import { useShellAwareMotion } from './useShellAwareMotion'
import { useReducedMotion } from './useReducedMotion'
import {
  buildRadialParticles,
  buildShowerParticles,
  getParticleCount,
  PARTICLE_PALETTES,
  type ParticlePaletteKey,
} from './particleHelpers'

export type RevealSparkleMode = 'burst' | 'shower' | 'trail' | 'sync'

export interface RevealSparkleProps {
  /** Animation mode */
  mode?: RevealSparkleMode
  /** Origin point in viewport coordinates (for burst/trail/sync). Defaults to viewport center. */
  origin?: { x: number; y: number }
  /** Target point for trail mode */
  target?: { x: number; y: number }
  /** Color palette key. Default 'accent' (theme-aware). Use 'gold' for treasure contexts. */
  palette?: ParticlePaletteKey
  /** Base particle count BEFORE shell multiplier. Default 16. */
  baseCount?: number
  /** Base burst radius (px) BEFORE shell multiplier. Default 120. */
  baseRadius?: number
  /** Base duration (ms) BEFORE shell multiplier. Default 900. */
  baseDuration?: number
  /** For 'sync' mode: delay before particles start (ms). Default 0. */
  syncDelay?: number
  /** Z-index. Default 100. */
  zIndex?: number
  /** Called when animation finishes */
  onComplete?: () => void
}

export function RevealSparkle({
  mode = 'burst',
  origin,
  target,
  palette = 'accent',
  baseCount = 16,
  baseRadius = 120,
  baseDuration = 900,
  syncDelay = 0,
  zIndex = 100,
  onComplete,
}: RevealSparkleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const colors = PARTICLE_PALETTES[palette]

  // Apply shell multipliers
  const particleCount = getParticleCount(baseCount, motion.particleMultiplier, { min: 5 })
  const radius = baseRadius * motion.scaleMultiplier
  const duration = baseDuration * motion.durationMultiplier

  // Default origin: center of viewport
  const ox = origin?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)
  const oy = origin?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)

  // Pre-build particles once
  const radialParticlesRef = useRef(
    mode === 'burst' || mode === 'trail' || mode === 'sync'
      ? buildRadialParticles({
          count: particleCount,
          minDistance: radius * 0.45,
          maxDistance: radius,
          minSize: motion.isPlay ? 5 : 3,
          maxSize: motion.isPlay ? 11 : 7,
          minDelay: 0,
          maxDelay: duration * 0.25,
          minDuration: duration * 0.7,
          maxDuration: duration,
          colors,
          shapes: motion.isPlay ? ['circle', 'square', 'star'] : ['circle'],
        })
      : [],
  )

  const showerParticlesRef = useRef(
    mode === 'shower'
      ? buildShowerParticles({
          count: particleCount,
          minX: 15,
          maxX: 85,
          minStartY: -10,
          maxStartY: -2,
          minSize: motion.isPlay ? 5 : 3,
          maxSize: motion.isPlay ? 12 : 7,
          minDelay: 0,
          maxDelay: duration * 0.5,
          minDuration: duration * 1.2,
          maxDuration: duration * 1.6,
          driftMax: 40,
          colors,
          shapes: motion.isPlay ? ['circle', 'square'] : ['circle'],
        })
      : [],
  )

  // Cleanup timer
  useEffect(() => {
    const total = mode === 'shower' ? duration * 1.8 : duration + 200
    const timer = setTimeout(() => onComplete?.(), total + syncDelay)
    return () => clearTimeout(timer)
  }, [duration, mode, onComplete, syncDelay])

  if (prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: ox,
            top: oy,
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, ' + colors[0] + ' 0%, transparent 70%)',
            opacity: 0,
            animation: 'revealSparkleStaticFade 600ms ease-out forwards',
          }}
        />
        <style>{`
          @keyframes revealSparkleStaticFade {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            30%  { opacity: 0.6; }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
          }
        `}</style>
      </div>
    )
  }

  // Trail mode renders a center burst at origin AND a small directional emit toward target
  if (mode === 'trail' && target) {
    const dx = target.x - ox
    const dy = target.y - oy
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex,
          overflow: 'hidden',
        }}
      >
        {radialParticlesRef.current.map((p) => {
          // Bias trail particles toward the target direction (50% randomness, 50% directional)
          const biasedTx = (p.tx * 0.5) + (dx * 0.5 * (p.duration / duration))
          const biasedTy = (p.ty * 0.5) + (dy * 0.5 * (p.duration / duration))
          const shapeRadius = p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '1px'
          return (
            <div
              key={p.index}
              style={{
                position: 'absolute',
                left: ox,
                top: oy,
                width: p.size,
                height: p.size,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: p.color,
                borderRadius: shapeRadius,
                opacity: 0,
                willChange: 'transform, opacity',
                animation: `revealSparkleTrail ${p.duration}ms ${motion.easing} ${p.delay}ms forwards`,
                // CSS custom properties consumed by the keyframe
                ['--tx' as string]: `${biasedTx}px`,
                ['--ty' as string]: `${biasedTy}px`,
              } as React.CSSProperties}
            />
          )
        })}
        <style>{`
          @keyframes revealSparkleTrail {
            0%   { transform: translate(0, 0) scale(1); opacity: 1; }
            70%  { opacity: 0.7; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // Shower mode
  if (mode === 'shower') {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex,
          overflow: 'hidden',
        }}
      >
        {showerParticlesRef.current.map((p) => {
          const shapeStyle: React.CSSProperties =
            p.shape === 'square'
              ? { width: p.size, height: p.size, borderRadius: '2px' }
              : p.shape === 'strip'
                ? { width: p.size * 0.4, height: p.size * 2.2, borderRadius: 1 }
                : { width: p.size, height: p.size, borderRadius: '50%' }

          return (
            <div
              key={p.index}
              style={{
                position: 'absolute',
                left: `${p.xPercent}%`,
                top: `${p.startYPercent}%`,
                background: p.color,
                opacity: 0,
                willChange: 'transform, opacity',
                animation: `revealSparkleShower ${p.duration}ms ease-in ${p.delay}ms forwards`,
                ['--drift' as string]: `${p.drift}px`,
                ['--rot-end' as string]: `${p.rotationEnd}deg`,
                transform: `rotate(${p.rotationStart}deg)`,
                ...shapeStyle,
              } as React.CSSProperties}
            />
          )
        })}
        <style>{`
          @keyframes revealSparkleShower {
            0%   { opacity: 0; transform: translate(0, 0) rotate(0deg); }
            10%  { opacity: 1; }
            85%  { opacity: 1; }
            100% {
              opacity: 0;
              transform: translate(var(--drift), calc(100vh + 40px)) rotate(var(--rot-end));
            }
          }
        `}</style>
      </div>
    )
  }

  // Burst + sync (default)
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex,
        overflow: 'hidden',
      }}
    >
      {/* Center glow ring */}
      <div
        style={{
          position: 'absolute',
          left: ox,
          top: oy,
          transform: 'translate(-50%, -50%)',
          width: motion.isPlay ? 60 : 40,
          height: motion.isPlay ? 60 : 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
          opacity: 0,
          willChange: 'transform, opacity',
          animation: `revealSparkleGlow ${duration}ms ${motion.easing} ${syncDelay}ms forwards`,
        }}
      />

      {/* Radial particles */}
      {radialParticlesRef.current.map((p) => {
        const shapeRadius =
          p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0'
        const isStar = p.shape === 'star'

        return (
          <div
            key={p.index}
            style={{
              position: 'absolute',
              left: ox,
              top: oy,
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: isStar ? 'transparent' : p.color,
              borderRadius: shapeRadius,
              opacity: 0,
              transform: p.shape === 'square' ? 'rotate(45deg)' : undefined,
              willChange: 'transform, opacity',
              animation: `revealSparkleFly ${p.duration}ms ${motion.easing} ${p.delay + syncDelay}ms forwards`,
              ['--tx' as string]: `${p.tx}px`,
              ['--ty' as string]: `${p.ty}px`,
              boxShadow: isStar ? `0 0 ${p.size}px ${p.color}` : undefined,
            } as React.CSSProperties}
          />
        )
      })}

      <style>{`
        @keyframes revealSparkleGlow {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          30%  { opacity: 0.9; }
          70%  { opacity: 0.5; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.2); }
        }
        @keyframes revealSparkleFly {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          70%  { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
