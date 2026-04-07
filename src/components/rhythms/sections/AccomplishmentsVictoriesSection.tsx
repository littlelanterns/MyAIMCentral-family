/**
 * PRD-18 Evening Section #2: Accomplishments & Victories
 *
 * Today's victories + completed tasks, deduplicated by source_reference_id
 * (so a victory auto-routed from a task completion shows once, not twice).
 * Never shows what wasn't done — Victory Recorder philosophy.
 */

import { Trophy, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVictories } from '@/hooks/useVictories'

interface Props {
  memberId: string
  /** Maximum items to show inline. Default 5. */
  maxItems?: number
}

export function AccomplishmentsVictoriesSection({ memberId, maxItems = 5 }: Props) {
  const { data: victories = [], isLoading } = useVictories(memberId, { period: 'today' })

  if (isLoading) return null
  if (victories.length === 0) {
    // Soft empty state — no shame, no "you did nothing today" framing
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Today's Wins
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Quiet day. The hardest victories are the ones nobody sees — including the
          choice to rest.
        </p>
      </div>
    )
  }

  const visible = victories.slice(0, maxItems)
  const overflow = victories.length - visible.length

  return (
    <Link
      to="/victories"
      className="block rounded-xl p-5 transition-colors hover:bg-opacity-50"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Today's Wins ({victories.length})
          </h3>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
      </div>

      <ul className="space-y-1.5">
        {visible.map(v => (
          <li
            key={v.id}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: 'var(--color-accent-deep)' }}
            />
            <span className="flex-1">{v.description}</span>
          </li>
        ))}
      </ul>

      {overflow > 0 && (
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          and {overflow} more
        </p>
      )}
    </Link>
  )
}
