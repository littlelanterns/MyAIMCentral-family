/**
 * BreathingGlow (PRD-17 Universal Queue)
 *
 * Universal presence indicator for pending items. Replaces numeric badges
 * with a warm, gentle glow animation that says "things are here when you're ready."
 *
 * - 3-second inhale/exhale cycle
 * - Subtle scale 1.0 → 1.05 → 1.0
 * - --color-btn-primary-bg at 30% opacity
 * - No numbers, no dots, no badges
 * - Absence of glow IS the signal that nothing needs attention
 * - Respects prefers-reduced-motion
 */

import type { ReactNode } from 'react'

interface BreathingGlowProps {
  /** Whether the glow is active (pending items exist) */
  active: boolean
  children: ReactNode
  /** Optional className for the wrapper */
  className?: string
}

export function BreathingGlow({ active, children, className = '' }: BreathingGlowProps) {
  return (
    <span
      className={`breathing-glow-wrapper ${active ? 'breathing-glow-active' : ''} ${className}`}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}

      {active && (
        <span
          className="breathing-glow-ring"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`
        .breathing-glow-active {
          animation: breathingScale 3s ease-in-out infinite;
        }

        .breathing-glow-ring {
          animation: breathingGlow 3s ease-in-out infinite;
          border-radius: 9999px;
        }

        @keyframes breathingScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes breathingGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent);
          }
          50% {
            box-shadow: 0 0 8px 3px color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .breathing-glow-active {
            animation: none;
          }
          .breathing-glow-ring {
            animation: none;
            box-shadow: 0 0 6px 2px color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent);
          }
        }
      `}</style>
    </span>
  )
}
