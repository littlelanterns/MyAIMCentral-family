// PRD-11 Phase 12C: Full-screen confetti explosion
// CSS keyframe animations for tablet performance
// Supports prefers-reduced-motion

import { useEffect, useState } from 'react'

interface ConfettiBurstProps {
  intensity: 'moderate' | 'maximum'
  onComplete?: () => void
  /** Extra CSS class names */
  className?: string
}

interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
  angle: number
  delay: number
  duration: number
  shape: 'circle' | 'square' | 'strip'
}

const COLORS = [
  'var(--color-sparkle-gold, #D4AF37)',
  'var(--color-sparkle-gold-light, #E8C547)',
  'var(--color-sparkle-gold-dark, #B8942A)',
  'var(--color-btn-primary-bg, #7C6DD8)',
  'var(--color-accent-warm, #E8845C)',
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A8E6CF',
  '#FF8A80',
]

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function buildParticles(intensity: 'moderate' | 'maximum'): ConfettiParticle[] {
  const count = intensity === 'moderate' ? 40 : 80
  const shapes: ConfettiParticle['shape'][] = ['circle', 'square', 'strip']

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(10, 90),
    y: randomBetween(-20, -5),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: randomBetween(4, 10),
    angle: randomBetween(-40, 40),
    delay: randomBetween(0, intensity === 'moderate' ? 400 : 200),
    duration: randomBetween(1500, 3000),
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }))
}

export function ConfettiBurst({ intensity, onComplete, className = '' }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setParticles(buildParticles(intensity))
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 3200)
    return () => clearTimeout(timer)
  }, [intensity, onComplete])

  if (!visible) return null

  return (
    <div
      className={`confetti-burst-container ${className}`}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => {
        const shapeStyle: React.CSSProperties =
          p.shape === 'strip'
            ? { width: p.size * 0.4, height: p.size * 2.5, borderRadius: 2 }
            : p.shape === 'square'
              ? { width: p.size, height: p.size, borderRadius: 1 }
              : { width: p.size, height: p.size, borderRadius: '50%' }

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              ...shapeStyle,
              opacity: 0,
              animation: `confettiFall ${p.duration}ms ease-out ${p.delay}ms forwards`,
              transform: `rotate(${p.angle}deg)`,
              willChange: 'transform, opacity',
            }}
          />
        )
      })}

      <style>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(calc(100vh + 20px)) rotate(720deg) scale(0.5);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .confetti-burst-container * {
            animation: confettiFadeOnly 1s ease-out forwards !important;
          }
        }

        @keyframes confettiFadeOnly {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
