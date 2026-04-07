/**
 * PRD-18 Section Type #1: Guiding Star Rotation
 *
 * One rotating Guiding Star entry, selected deterministically by date so
 * the same star shows all day. Auto-hides if member has no entries with
 * is_included_in_ai = true.
 *
 * Framing: "Remember who you are." (morning) / "Something you believe:" (closing)
 */

import { Sparkles } from 'lucide-react'
import { useGuidingStars } from '@/hooks/useGuidingStars'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

interface Props {
  memberId: string
  rhythmKey: string
  framingText?: string
  /** Restrict rotation to specific entry types (e.g. only scripture_quote) */
  entryTypeFilter?: ('value' | 'declaration' | 'scripture_quote' | 'vision')[]
}

export function GuidingStarRotationSection({
  memberId,
  rhythmKey,
  framingText = 'Remember who you are.',
  entryTypeFilter,
}: Props) {
  const { data: stars = [], isLoading } = useGuidingStars(memberId)

  if (isLoading) return null

  // Filter to AI-included entries (the same set LiLa uses)
  let pool = stars.filter(s => s.is_included_in_ai)
  if (entryTypeFilter && entryTypeFilter.length > 0) {
    pool = pool.filter(s => entryTypeFilter.includes(s.entry_type))
  }

  // Auto-hide if empty
  if (pool.length === 0) return null

  const seed = rhythmSeed(memberId, `${rhythmKey}:guiding_star`, new Date())
  const star = pickOne(pool, seed)
  if (!star) return null

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start gap-3">
        <Sparkles
          size={20}
          className="mt-0.5 flex-shrink-0"
          style={{ color: 'var(--color-accent-deep)' }}
        />
        <div className="flex-1">
          <p
            className="text-base leading-relaxed italic"
            style={{ color: 'var(--color-text-primary)' }}
          >
            "{star.content}"
          </p>
          {framingText && (
            <p
              className="mt-2 text-xs uppercase tracking-wide"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {framingText}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
