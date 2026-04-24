// PRD-28 NEW-FF — "Preview This Week" panel (Worker B1b)
//
// PRD-28 §Screen 2 L228: "'Preview This Week' button at bottom shows a
// real-time calculation preview based on current task completion data."
//
// Inline expand/collapse panel — not a modal. Keeps config context
// visible while mom inspects the forecast. Values come from
// `calculate_allowance_progress` RPC via useLiveAllowanceProgress —
// same single source of truth as the live widget and the
// calculate-allowance-period cron. Grace days passed through (NEW-GG)
// so forecast reflects currently-marked grace days.

import { useState } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useLiveAllowanceProgress } from '@/hooks/useFinancial'
import { useQueryClient } from '@tanstack/react-query'
import type { AllowancePeriod } from '@/types/financial'

interface PreviewThisWeekPanelProps {
  memberId: string
  activePeriod: AllowancePeriod | null | undefined
}

export function PreviewThisWeekPanel({ memberId, activePeriod }: PreviewThisWeekPanelProps) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const graceDays = (activePeriod?.grace_days as string[]) ?? []
  const {
    data: progress,
    isFetching,
    refetch,
  } = useLiveAllowanceProgress(
    memberId,
    activePeriod?.period_start,
    activePeriod?.period_end,
    graceDays,
  )

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['live-allowance-progress', memberId] })
    refetch()
  }

  if (!activePeriod) {
    return (
      <div
        data-testid="preview-this-week-panel"
        className="rounded-xl"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-default, var(--color-border))',
          padding: '1rem',
          marginTop: '1.5rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
        }}
      >
        No active allowance period. Start a period to preview this week.
      </div>
    )
  }

  return (
    <div
      data-testid="preview-this-week-panel"
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default, var(--color-border))',
        marginTop: '1.5rem',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-testid="preview-this-week-toggle"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        style={{
          color: 'var(--color-text-heading)',
          backgroundColor: open ? 'var(--color-bg-secondary)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {open ? <Eye size={16} /> : <EyeOff size={16} />}
          Preview This Week
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 400 }}>
          {open ? 'Hide' : 'Show current forecast'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '1rem' }}>
          {isFetching && !progress ? (
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Calculating…
            </div>
          ) : progress ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <PreviewRow
                  label="Completion"
                  value={`${progress.completion_percentage.toFixed(1)}%`}
                  sub={`${Math.round(progress.effective_tasks_completed)} / ${Math.round(progress.effective_tasks_assigned)} effective tasks`}
                />
                <PreviewRow
                  label="Base amount"
                  value={`$${progress.base_amount.toFixed(2)}`}
                  sub="Weekly amount from config"
                />
                <PreviewRow
                  label="Calculated"
                  value={`$${progress.calculated_amount.toFixed(2)}`}
                  sub={`Base × ${progress.completion_percentage.toFixed(1)}%`}
                />
                {progress.bonus_applied && (
                  <PreviewRow
                    label="Bonus"
                    value={`+ $${progress.bonus_amount.toFixed(2)}`}
                    sub={`At or above ${progress.bonus_threshold}% threshold`}
                    highlight
                  />
                )}
                {progress.extra_credit_completed > 0 && (
                  <PreviewRow
                    label="Extra credit"
                    value={`${progress.extra_credit_completed} task${progress.extra_credit_completed === 1 ? '' : 's'}`}
                    sub="Contributes to numerator only, capped at 100%"
                  />
                )}
                {graceDays.length > 0 && (
                  <PreviewRow
                    label="Grace days"
                    value={`${graceDays.length} day${graceDays.length === 1 ? '' : 's'}`}
                    sub="Excluded from denominator + numerator"
                  />
                )}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border-default, var(--color-border))',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <PreviewRow
                    label="Total forecast"
                    value={`$${progress.total_earned.toFixed(2)}`}
                    sub="What this week would pay out if it closed right now"
                    highlight
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>
                  Live forecast. Final calculation runs at the configured calculation time.
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  data-testid="preview-this-week-refresh"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.625rem',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border-default, var(--color-border))',
                    fontSize: 'var(--font-size-xs)',
                    cursor: isFetching ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Could not load progress. Tap refresh to retry.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PreviewRow({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
      <div>
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: highlight ? 600 : 500,
            color: highlight ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: highlight ? 'var(--font-size-base)' : 'var(--font-size-sm)',
          fontWeight: highlight ? 700 : 500,
          color: highlight ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}
