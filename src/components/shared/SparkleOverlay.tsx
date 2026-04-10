import { useEffect, useRef } from 'react'

interface SparkleOverlayProps {
  type: 'quick_burst' | 'full_celebration'
  /** X,Y coordinates to burst from (relative to viewport) */
  origin?: { x: number; y: number }
  /** Called when animation completes */
  onComplete?: () => void
}

interface Particle {
  angle: number
  distance: number
  size: number
  delay: number
  shade: string
  shape: 'circle' | 'square'
  duration: number
}

const GOLD_SHADES = [
  'var(--color-sparkle-gold, #D4AF37)',
  'var(--color-sparkle-gold-light, #E8C547)',
  'var(--color-sparkle-gold-dark, #B8942A)',
] as const

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildParticles(type: 'quick_burst' | 'full_celebration'): Particle[] {
  const count =
    type === 'quick_burst'
      ? Math.floor(randomBetween(8, 13))
      : Math.floor(randomBetween(16, 25))

  const maxRadius = type === 'quick_burst' ? 80 : 150
  const baseDuration = type === 'quick_burst' ? 800 : 1600

  return Array.from({ length: count }, () => ({
    angle: randomBetween(0, 360),
    distance: randomBetween(maxRadius * 0.4, maxRadius),
    size: type === 'quick_burst' ? randomBetween(4, 8) : randomBetween(5, 12),
    delay: randomBetween(0, type === 'quick_burst' ? 120 : 300),
    shade: randomItem(GOLD_SHADES),
    shape:
      type === 'full_celebration' && Math.random() > 0.5
        ? ('square' as const)
        : ('circle' as const),
    duration: randomBetween(baseDuration * 0.7, baseDuration),
  }))
}

export function SparkleOverlay({ type, origin, onComplete }: SparkleOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Default origin: center of viewport
  const ox = origin?.x ?? window.innerWidth / 2
  const oy = origin?.y ?? window.innerHeight / 2

  const particles = useRef<Particle[]>(buildParticles(type)).current
  const ringDuration = type === 'quick_burst' ? 700 : 1400
  const totalDuration = type === 'quick_burst' ? 800 : 1600

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete?.()
    }, totalDuration + 100)

    return () => clearTimeout(timeout)
  }, [onComplete, totalDuration])

  if (prefersReducedMotion) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
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
            background: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
            animation: 'fadeIn 0.3s ease forwards',
          }}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Expanding gold ring */}
      <div
        style={{
          position: 'absolute',
          left: ox,
          top: oy,
          transform: 'translate(-50%, -50%)',
          width: type === 'quick_burst' ? 60 : 100,
          height: type === 'quick_burst' ? 60 : 100,
          borderRadius: '50%',
          border: `3px solid ${GOLD_SHADES[0]}`,
          opacity: 0,
          animation: `sparkleRingExpand ${ringDuration}ms ease-out forwards`,
        }}
      />

      {/* Second ring for full celebration */}
      {type === 'full_celebration' && (
        <div
          style={{
            position: 'absolute',
            left: ox,
            top: oy,
            transform: 'translate(-50%, -50%)',
            width: 140,
            height: 140,
            borderRadius: '50%',
            border: `2px solid ${GOLD_SHADES[1]}`,
            opacity: 0,
            animation: `sparkleRingExpand ${ringDuration * 1.2}ms ease-out 200ms forwards`,
          }}
        />
      )}

      {/* Particles */}
      {particles.map((p, i) => {
        const radians = (p.angle * Math.PI) / 180
        const tx = Math.cos(radians) * p.distance
        const ty = Math.sin(radians) * p.distance

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ox,
              top: oy,
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              background: p.shade,
              opacity: 0,
              transform: p.shape === 'square' ? 'rotate(45deg)' : undefined,
              animation: `sparkleParticleFly ${p.duration}ms ease-out ${p.delay}ms forwards`,
              // CSS custom property for the translate endpoint
              ['--tx' as any]: `${tx}px`,
              ['--ty' as any]: `${ty}px`,
            }}
          />
        )
      })}

      {/* Inline keyframes injected once via a style tag */}
      <style>{`
        @keyframes sparkleRingExpand {
          0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0.9; }
          60%  { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
        @keyframes sparkleParticleFly {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          70%  { opacity: 0.8; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
