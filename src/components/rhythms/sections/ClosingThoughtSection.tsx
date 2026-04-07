/**
 * PRD-18 Evening Section #8: Closing Thought
 *
 * One full Guiding Star entry displayed prominently. Date-seeded for
 * deterministic daily rotation. Auto-hides if member has no entries.
 *
 * Differs from morning Guiding Star Rotation: shows the entry larger,
 * with no header — it's a moment of stillness before reflection.
 */

import { useGuidingStars } from '@/hooks/useGuidingStars'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

interface Props {
  memberId: string
}

export function ClosingThoughtSection({ memberId }: Props) {
  const { data: stars = [], isLoading } = useGuidingStars(memberId)

  if (isLoading) return null
  const pool = stars.filter(s => s.is_included_in_ai)
  if (pool.length === 0) return null

  const seed = rhythmSeed(memberId, 'evening:closing_thought', new Date())
  const star = pickOne(pool, seed)
  if (!star) return null

  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <p
        className="text-lg leading-relaxed italic"
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        "{star.content}"
      </p>
    </div>
  )
}
