/**
 * PRD-18 Evening Section #8: Closing Thought
 *
 * One full Guiding Star entry displayed prominently. Date-seeded for
 * deterministic daily rotation. Differs from the morning Guiding Star
 * Rotation: shows the entry larger, no header — a moment of stillness
 * before reflection.
 *
 * Threshold rule (founder decision 2026-04-07): only renders when the
 * member has 5+ active Guiding Stars in the rotation pool. Below 5,
 * the section auto-hides because reading the same 1-3 stars at bedtime
 * feels redundant when the user already saw them in the morning rotation.
 * With 5+, the rotation pool is deep enough that bedtime feels like
 * rediscovery, not repetition. Self-tunes — new users with sparse
 * libraries don't see it; established users with rich libraries do.
 */

import { useGuidingStars } from '@/hooks/useGuidingStars'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

const MIN_POOL_SIZE_FOR_BEDTIME_ROTATION = 5

interface Props {
  memberId: string
}

export function ClosingThoughtSection({ memberId }: Props) {
  const { data: stars = [], isLoading } = useGuidingStars(memberId)

  if (isLoading) return null
  const pool = stars.filter(s => s.is_included_in_ai)
  // Threshold: < 5 active stars → auto-hide. Reading the same 1-3
  // stars at bedtime that the user already saw in the morning would
  // feel like padding. Below the threshold, the section returns null
  // and the modal collapses cleanly without a gap.
  if (pool.length < MIN_POOL_SIZE_FOR_BEDTIME_ROTATION) return null

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
