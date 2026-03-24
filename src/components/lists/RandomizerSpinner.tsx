/**
 * RandomizerSpinner (PRD-09B)
 *
 * CSS animation for the Randomizer draw sequence.
 * Cycles through item names rapidly then slows to reveal the winner.
 * Respects prefers-reduced-motion.
 *
 * Props:
 *   items       — pool of items to flash through
 *   finalItem   — the revealed winner (shown after animation)
 *   spinning    — true = animate; false = show final result
 *   duration    — animation duration in ms (default 2400)
 *
 * Zero hardcoded hex colors. No emoji (adult interfaces).
 */

import { useEffect, useState, useRef } from 'react'
import { Shuffle } from 'lucide-react'

interface RandomizerSpinnerProps {
  items: string[]
  finalItem: string | null
  spinning: boolean
  duration?: number
}

// Reduced-motion detection hook
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function RandomizerSpinner({
  items,
  finalItem,
  spinning,
  duration = 2400,
}: RandomizerSpinnerProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [displayText, setDisplayText] = useState<string>('—')
  const intervalRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!spinning || items.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!spinning && finalItem) setDisplayText(finalItem)
      return
    }

    if (reducedMotion) {
      // Skip animation entirely — show result immediately
      if (finalItem) setDisplayText(finalItem)
      return
    }

    startRef.current = Date.now()

    function tick() {
      const elapsed = Date.now() - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Start at 80ms between flips, slow to 300ms as we near the end
      const intervalMs = 80 + Math.pow(progress, 2) * 220

      const randomItem = items[Math.floor(Math.random() * items.length)]
      setDisplayText(randomItem)

      if (elapsed >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        if (finalItem) setDisplayText(finalItem)
        return
      }

      // Re-schedule with progressive slowdown
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = window.setInterval(tick, intervalMs)
    }

    intervalRef.current = window.setInterval(tick, 80)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [spinning, items, finalItem, duration, reducedMotion])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Spinner visual */}
      <div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: '260px',
          height: '120px',
          background: spinning
            ? 'linear-gradient(135deg, var(--color-btn-primary-bg) 0%, var(--color-accent, var(--color-btn-primary-bg)) 100%)'
            : 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
          border: `2px solid ${spinning ? 'var(--color-btn-primary-bg)' : 'var(--color-btn-primary-bg)'}`,
          transition: 'background 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Animated shimmer overlay during spin */}
        {spinning && !reducedMotion && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
              animation: 'shimmerSlide 0.8s ease-in-out infinite',
            }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center gap-1 px-4">
          {spinning ? (
            <Shuffle
              size={18}
              aria-hidden
              style={{ color: 'var(--color-btn-primary-text, #fff)', opacity: 0.7 }}
            />
          ) : null}
          <p
            className="text-center font-bold leading-tight"
            style={{
              color: spinning
                ? 'var(--color-btn-primary-text, #fff)'
                : 'var(--color-btn-primary-bg)',
              fontSize: displayText.length > 24 ? '0.875rem' : '1.125rem',
              transition: spinning ? 'none' : 'color 0.3s ease, font-size 0.2s ease',
            }}
          >
            {displayText}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes shimmerSlide { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  )
}
