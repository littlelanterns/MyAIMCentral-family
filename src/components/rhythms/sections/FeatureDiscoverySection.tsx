/**
 * PRD-18 Phase C Section Type #30 (Enhancement 4): Feature Discovery
 *
 * Activity-log-driven nudge toward a feature the user hasn't meaningfully
 * engaged with in the last 14 days. Appears 2-3 days per week, picked
 * deterministically via date-seeded PRNG.
 *
 * Flow:
 *   1. Frequency gate: pick 3 days of the current ISO week via
 *      pickN(daysOfWeek, 3, rhythmSeed). If today's day-of-week isn't
 *      in the picked set, return null (auto-hide). Same member sees the
 *      same 3 days all week; rotates next week.
 *   2. Candidate query: useFeatureDiscoveryCandidates applies audience +
 *      dismissal + engagement filters.
 *   3. Pick one candidate for the day via pickOne(candidates, rhythmSeed).
 *   4. Render a warm nudge card with headline + tagline + direct action
 *      link + small "Not interested" dismiss.
 *   5. Dismiss → INSERT into feature_discovery_dismissals (permanent per
 *      member). The section re-renders without this candidate.
 *
 * Empty pool: return null (not a "no features to show" card).
 */

import { useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useFeatureDiscoveryCandidates,
  useDismissFeatureDiscovery,
} from '@/hooks/useFeatureDiscovery'
import { rhythmSeed, pickN, pickOne } from '@/lib/rhythm/dateSeedPrng'
import { localWeekIso } from '@/utils/dates'
import type { FeatureDiscoveryCandidate } from '@/types/rhythms'

interface Props {
  familyId: string
  memberId: string
  /** Adult by default; Phase D will fork for teens. */
  audience?: 'adult' | 'teen'
}

const DAYS_PER_WEEK = 3
const DAY_NUMBERS = [0, 1, 2, 3, 4, 5, 6] // Sun..Sat in JS Date.getDay()

export function FeatureDiscoverySection({
  familyId,
  memberId,
  audience = 'adult',
}: Props) {
  // ─── Frequency gate: 3 days per ISO week ────────────────────
  const todayInPickedSet = useMemo(() => {
    const thisWeek = localWeekIso()
    const seed = rhythmSeed(memberId, 'morning:feature_discovery_days', new Date(), thisWeek)
    const pickedDays = pickN(DAY_NUMBERS, DAYS_PER_WEEK, seed)
    const today = new Date().getDay()
    return pickedDays.includes(today)
  }, [memberId])

  const { data: candidates = [] } = useFeatureDiscoveryCandidates(
    todayInPickedSet ? memberId : undefined,
    audience,
  )

  const dismiss = useDismissFeatureDiscovery()

  // Pick today's candidate deterministically from the eligible pool
  const todaysCandidate = useMemo(() => {
    if (!todayInPickedSet || candidates.length === 0) return undefined
    const seed = rhythmSeed(memberId, 'morning:feature_discovery_card')
    return pickOne(candidates, seed)
  }, [todayInPickedSet, candidates, memberId])

  // Auto-hide on non-picked days or empty pool
  if (!todayInPickedSet) return null
  if (!todaysCandidate) return null

  return <FeatureDiscoveryCard candidate={todaysCandidate} familyId={familyId} memberId={memberId} onDismiss={() => {
    void dismiss.mutateAsync({
      familyId,
      memberId,
      featureKey: todaysCandidate.feature_key,
    })
  }} />
}

function FeatureDiscoveryCard({
  candidate,
  onDismiss,
}: {
  candidate: FeatureDiscoveryCandidate
  familyId: string
  memberId: string
  onDismiss: () => void
}) {
  // Look up the Lucide icon by name — fall back to Sparkles if unknown
  const iconSet = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  >
  const Icon = iconSet[candidate.icon_key] ?? iconSet.Sparkles

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 5%, var(--color-bg-card))',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-lg p-2 flex-shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--color-accent-deep) 12%, transparent)',
            color: 'var(--color-accent-deep)',
          }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Something new
          </p>
          <h3
            className="text-sm font-semibold mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {candidate.display_name}
          </h3>
          <p
            className="text-xs mt-1.5 leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {candidate.tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs rounded-md px-3 py-1.5"
          style={{
            color: 'var(--color-text-secondary)',
            background: 'transparent',
          }}
        >
          Not interested
        </button>
        <Link
          to={candidate.action_route}
          className="text-xs font-semibold rounded-md px-3 py-1.5"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {candidate.action_text}
        </Link>
      </div>
    </div>
  )
}
