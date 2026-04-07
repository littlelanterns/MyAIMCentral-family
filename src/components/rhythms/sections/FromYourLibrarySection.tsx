/**
 * PRD-18 Evening Section #9: From Your Library
 *
 * One rotating Scripture/Quote entry from guiding_stars where
 * entry_type = 'scripture_quote'. Auto-hides if no scripture/quote
 * entries exist.
 */

import { BookOpen } from 'lucide-react'
import { useGuidingStars } from '@/hooks/useGuidingStars'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

interface Props {
  memberId: string
}

export function FromYourLibrarySection({ memberId }: Props) {
  const { data: stars = [], isLoading } = useGuidingStars(memberId)

  if (isLoading) return null
  const pool = stars.filter(s => s.is_included_in_ai && s.entry_type === 'scripture_quote')
  if (pool.length === 0) return null

  const seed = rhythmSeed(memberId, 'evening:from_your_library', new Date())
  const entry = pickOne(pool, seed)
  if (!entry) return null

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          From your library
        </h3>
      </div>
      <p
        className="text-base leading-relaxed italic"
        style={{ color: 'var(--color-text-primary)' }}
      >
        "{entry.content}"
      </p>
      {entry.category && (
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          — {entry.category}
        </p>
      )}
    </div>
  )
}
