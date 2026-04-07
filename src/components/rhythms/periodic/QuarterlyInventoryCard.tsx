/**
 * PRD-18 Screen 6: Quarterly Inventory Card
 *
 * Renders inline inside the Morning Rhythm modal. Default state: OFF
 * (user opts in via Rhythms Settings). Trigger timing is ~90 days
 * since last LifeLantern check-in, which depends on PRD-12A.
 *
 * Phase B scope: the card renders, sections show stub content
 * ("LifeLantern coming soon"), and the user can mark it done which
 * writes a rhythm_completions row and hides the card for this quarter.
 *
 * When PRD-12A ships, the StaleAreasSection, QuickWinSuggestionSection,
 * and LifeLanternLaunchLinkSection will be replaced with real data.
 */

import { Telescope, Check } from 'lucide-react'
import { useCompleteRhythm } from '@/hooks/useRhythms'
import { localQuarterIso } from '@/utils/dates'

interface Props {
  familyId: string
  memberId: string
  onComplete?: () => void
}

export function QuarterlyInventoryCard({ familyId, memberId, onComplete }: Props) {
  const completeRhythm = useCompleteRhythm()

  const handleMarkDone = async () => {
    await completeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: 'quarterly_inventory',
      period: localQuarterIso(),
      metadata: {},
    })
    onComplete?.()
  }

  const isComplete = completeRhythm.isSuccess

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 6%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <Telescope size={20} style={{ color: 'var(--color-accent-deep)' }} />
        <h2
          className="text-base font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Quarterly Inventory
        </h2>
        <span
          className="text-xs ml-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {localQuarterIso()}
        </span>
      </div>

      <p
        className="text-sm"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Time for a bigger-picture check-in. Every ~90 days, we pause to look at
        your life areas and see what needs attention.
      </p>

      <div
        className="rounded-md p-3 text-xs"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p className="mb-1 font-semibold">Stale areas</p>
        <p>LifeLantern isn't built yet. When it ships, your stale life areas will
        surface here ordered by time since last check-in.</p>
      </div>

      <div
        className="rounded-md p-3 text-xs"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p className="mb-1 font-semibold">Quick win suggestion</p>
        <p>"Start with [most stale area] — usually takes about 10-15 minutes."</p>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleMarkDone}
          disabled={completeRhythm.isPending || isComplete}
          className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {isComplete ? (
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              Marked done
            </span>
          ) : completeRhythm.isPending ? (
            'Saving…'
          ) : (
            'Mark inventory done'
          )}
        </button>
      </div>
    </div>
  )
}
