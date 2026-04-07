/**
 * PRD-25 Phase B: Spell Check Overlay
 * Shows coaching tooltips when a user taps a misspelled word.
 * Uses browser spellcheck to detect misspellings, then the 3-tier coaching hook
 * to provide kid-friendly teaching explanations.
 */

import { useState, useCallback } from 'react'
import { X, Volume2 } from 'lucide-react'
import { useSpellCheckCoaching, type SpellCoachingResult } from '@/hooks/useSpellCheckCoaching'
import { speak } from '@/utils/speak'

interface SpellCheckOverlayProps {
  /** Visible coaching tooltip state */
  coaching: SpellCoachingResult | null
  /** Position of the tooltip */
  position: { x: number; y: number } | null
  /** Whether coaching is loading */
  isLoading: boolean
  /** Reading Support enabled — show TTS icon */
  readingSupport: boolean
  /** Close the tooltip */
  onClose: () => void
}

export function SpellCheckOverlay({
  coaching,
  position,
  isLoading,
  readingSupport,
  onClose,
}: SpellCheckOverlayProps) {
  if (!position || (!coaching && !isLoading)) return null

  return (
    <div
      className="fixed z-50 px-3 py-2 rounded-lg shadow-lg max-w-xs"
      style={{
        left: Math.min(position.x, window.innerWidth - 280),
        top: position.y + 8,
        backgroundColor: 'var(--color-accent-deep, var(--color-bg-card))',
        color: 'var(--color-text-on-primary, var(--color-text-primary))',
        border: '1px solid var(--color-border-default, var(--color-border))',
        borderRadius: 'var(--vibe-radius-input, 8px)',
      }}
    >
      {isLoading ? (
        <p className="text-sm">Looking that up...</p>
      ) : coaching ? (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">
              <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{coaching.misspelling}</span>
              {' '}
              <span>{coaching.correction}</span>
            </p>
            <button
              onClick={onClose}
              className="p-0.5 rounded-full shrink-0"
              style={{ background: 'transparent', color: 'inherit', minHeight: 'unset' }}
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-start gap-1.5">
            <p className="text-xs leading-relaxed" style={{ opacity: 0.9 }}>
              {coaching.explanation}
            </p>
            {readingSupport && (
              <button
                onClick={() => speak(coaching.explanation, 0.85)}
                className="p-0.5 rounded-full shrink-0 mt-0.5"
                style={{ background: 'transparent', color: 'inherit', minHeight: 'unset' }}
                aria-label="Read aloud"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Hook to manage spellcheck coaching tooltip state.
 * Attach to a textarea's contextmenu/click handler to detect tapped misspelled words.
 */
export function useSpellCheckOverlay(coachingEnabled: boolean) {
  const { getCoaching } = useSpellCheckCoaching()
  const [coaching, setCoaching] = useState<SpellCoachingResult | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleWordTap = useCallback(async (
    word: string,
    correction: string,
    rect: { x: number; y: number },
  ) => {
    if (!coachingEnabled) {
      // Show standard correction only (no coaching explanation)
      setCoaching({
        misspelling: word,
        correction,
        explanation: '',
        source: 'seed',
      })
      setPosition(rect)
      return
    }

    setPosition(rect)
    setIsLoading(true)
    setCoaching(null)

    const result = await getCoaching(word, correction)
    setCoaching(result)
    setIsLoading(false)
  }, [coachingEnabled, getCoaching])

  const closeOverlay = useCallback(() => {
    setCoaching(null)
    setPosition(null)
    setIsLoading(false)
  }, [])

  return {
    coaching,
    position,
    isLoading,
    handleWordTap,
    closeOverlay,
  }
}
