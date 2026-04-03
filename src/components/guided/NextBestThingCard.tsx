/**
 * PRD-25: Next Best Thing suggestion card
 * Shows deterministic suggestion with AI glaze text.
 * [Do This] navigates, [Something Else] cycles.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, Sparkles, Coffee, Volume2 } from 'lucide-react'
import { useNBTGlaze } from '@/hooks/useNBTGlaze'
import { speak } from '@/utils/speak'
import type { NBTSuggestion } from '@/types/guided-dashboard'

interface NextBestThingCardProps {
  suggestion: NBTSuggestion | null
  onAdvance: () => void
  isEmpty: boolean
  isLoading: boolean
  memberName: string
  streakCount: number
  familyId?: string
  memberId?: string
  readingSupport: boolean
  totalSuggestions: number
  currentIndex: number
}

export function NextBestThingCard({
  suggestion,
  onAdvance,
  isEmpty,
  isLoading,
  memberName,
  streakCount,
  familyId,
  memberId,
  readingSupport,
  totalSuggestions,
  currentIndex,
}: NextBestThingCardProps) {
  const navigate = useNavigate()

  const { glazeText, isLoading: glazeLoading } = useNBTGlaze(
    suggestion?.id ?? null,
    suggestion?.title ?? null,
    suggestion?.type ?? null,
    memberName,
    streakCount,
    familyId,
    memberId,
    suggestion?.pointValue,
  )

  // Empty state
  if (isEmpty) {
    return (
      <div
        className="p-5 rounded-xl text-center space-y-2"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Coffee
          size={32}
          className="mx-auto"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Nothing on the list right now. Enjoy your free time!
        </p>
      </div>
    )
  }

  // Loading state
  if (isLoading || !suggestion) {
    return (
      <div
        className="p-5 rounded-xl animate-pulse"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="h-4 rounded w-3/4 mb-2"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        />
      </div>
    )
  }

  const displayText = glazeText || `Up next: ${suggestion.title}`
  const isLastSuggestion = currentIndex === totalSuggestions - 1

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Suggestion header */}
      <div className="flex items-start gap-3">
        <Sparkles
          size={20}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--color-accent-warm, var(--color-btn-primary-bg))' }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {suggestion.title}
          </p>
          <p
            className="text-xs mt-0.5 transition-opacity"
            style={{
              color: 'var(--color-text-secondary)',
              opacity: glazeLoading ? 0.5 : 1,
            }}
          >
            {glazeLoading ? 'Thinking...' : displayText}
          </p>
          {suggestion.subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {suggestion.subtitle}
            </p>
          )}
        </div>
        {readingSupport && (
          <button
            onClick={() => speak(displayText)}
            className="reading-support-tts p-1 rounded-full shrink-0"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => suggestion.navigateTo && navigate(suggestion.navigateTo)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Do This
          <ArrowRight size={16} />
        </button>
        {totalSuggestions > 1 && (
          <button
            onClick={onAdvance}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <RefreshCw size={14} />
            {isLastSuggestion ? 'Start Over' : 'Something Else'}
          </button>
        )}
      </div>
    </div>
  )
}
