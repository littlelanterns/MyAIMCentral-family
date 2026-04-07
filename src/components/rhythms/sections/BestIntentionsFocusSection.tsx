/**
 * PRD-18 Section Type #2: Best Intentions Focus
 *
 * 2-3 active best intentions with tap-to-celebrate checkmarks.
 * Tapping increments via useLogIteration (writes intention_iterations
 * + activity log). Auto-hides if member has no active intentions.
 *
 * Framing: "Today, remember to..."
 */

import { Heart } from 'lucide-react'
import { useBestIntentions, useLogIteration, useTodaysIterations } from '@/hooks/useBestIntentions'

interface Props {
  familyId: string
  memberId: string
  /** How many active intentions to surface. Default 3. */
  count?: number
}

export function BestIntentionsFocusSection({ familyId, memberId, count = 3 }: Props) {
  const { data: intentions = [], isLoading } = useBestIntentions(memberId)
  const logIteration = useLogIteration()

  if (isLoading) return null

  const active = intentions.filter(i => i.is_active).slice(0, count)
  if (active.length === 0) return null

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Heart size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Today, remember to...
        </h3>
      </div>

      <ul className="space-y-2">
        {active.map(intention => (
          <IntentionRow
            key={intention.id}
            intentionId={intention.id}
            statement={intention.statement}
            color={intention.color}
            onTap={() =>
              logIteration.mutate({
                intentionId: intention.id,
                familyId,
                memberId,
                intentionStatement: intention.statement,
              })
            }
          />
        ))}
      </ul>
    </div>
  )
}

function IntentionRow({
  intentionId,
  statement,
  color,
  onTap,
}: {
  intentionId: string
  statement: string
  color: string | null
  onTap: () => void
}) {
  const { data: todaysCount = 0 } = useTodaysIterations(intentionId)

  return (
    <li>
      <button
        type="button"
        onClick={onTap}
        className="w-full flex items-center gap-3 text-left rounded-lg p-2 transition-colors hover:bg-opacity-50"
        style={{
          backgroundColor: 'transparent',
        }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: color ?? 'var(--color-accent-deep)',
            color: 'var(--color-text-on-primary)',
          }}
        >
          {todaysCount > 0 ? todaysCount : '✓'}
        </span>
        <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {statement}
        </span>
      </button>
    </li>
  )
}
