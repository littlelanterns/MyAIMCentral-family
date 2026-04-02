// PRD-11 Phase 12C: Staggered animated list for DailyCelebration
// Items appear sequentially with slide/fade animation

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface AnimatedListProps {
  items: ReactNode[]
  /** Delay between each item appearing (ms) */
  staggerDelay?: number
  /** Optional icon to show with animation before each item */
  icon?: ReactNode
  /** Called after all items have appeared */
  onComplete?: () => void
  className?: string
}

export function AnimatedList({
  items,
  staggerDelay = 400,
  icon,
  onComplete,
  className = '',
}: AnimatedListProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (items.length === 0) {
      onComplete?.()
      return
    }

    let current = 0
    const interval = setInterval(() => {
      current++
      setVisibleCount(current)
      if (current >= items.length) {
        clearInterval(interval)
        // Give the last animation time to complete
        setTimeout(() => onComplete?.(), 400)
      }
    }, staggerDelay)

    return () => clearInterval(interval)
  }, [items.length, staggerDelay, onComplete])

  return (
    <div className={`animated-list space-y-2 ${className}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="animated-list-item"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
          }}
        >
          <div className="flex items-start gap-2">
            {icon && i < visibleCount && (
              <span className="animated-list-icon flex-shrink-0 mt-0.5" style={{
                animation: 'iconPop 0.3s ease-out forwards',
              }}>
                {icon}
              </span>
            )}
            <div className="flex-1">{item}</div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes iconPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animated-list-item {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .animated-list-icon {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
