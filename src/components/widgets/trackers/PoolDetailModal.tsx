// Phase 3.5: Per-pool detail breakdown modal
// Accessible from AllowanceCalculatorTracker by tapping a pool row

import { X, Pause, TrendingUp } from 'lucide-react'
import type { AllowanceConfig } from '@/types/financial'
import type { LiveAllowanceProgress } from '@/hooks/useFinancial'

const formatDollars = (val: number) => `$${val.toFixed(2)}`

interface PoolDetailModalProps {
  pool: AllowanceConfig
  progress: LiveAllowanceProgress | null
  allPoolProgress: Array<{ pool: AllowanceConfig; progress: LiveAllowanceProgress | null }>
  showMoney: boolean
  onClose: () => void
}

export function PoolDetailModal({
  pool,
  progress,
  allPoolProgress,
  showMoney,
  onClose,
}: PoolDetailModalProps) {
  const pct = Math.round(progress?.completion_percentage ?? 0)
  const earned = progress?.total_earned ?? 0
  const isMeasurement = pool.payout_mode === 'measurement_only'
  const isPaused = pool.pool_status === 'paused'

  const payingPools = allPoolProgress.filter(
    pp => pp.pool.pool_status === 'active' && pp.pool.payout_mode !== 'measurement_only',
  )
  const totalWeight = payingPools.reduce((s, pp) => s + (pp.pool.pool_weight ?? 1), 0)
  const thisWeight = pool.pool_weight ?? 1
  const weightPct = totalWeight > 0 ? Math.round((thisWeight / totalWeight) * 100) : 0

  let displayCompleted = 0
  let displayAvailable = 0
  let displayNoun = 'tasks'
  if (progress && progress.raw_steps_available > 0) {
    displayCompleted = progress.raw_steps_completed + progress.nonroutine_tasks_completed
    displayAvailable = progress.raw_steps_available + progress.nonroutine_tasks_total
    displayNoun = 'steps'
  } else if (progress && progress.nonroutine_tasks_total > 0) {
    displayCompleted = progress.nonroutine_tasks_completed
    displayAvailable = progress.nonroutine_tasks_total
    displayNoun = 'tasks'
  } else if (progress) {
    displayCompleted = Math.round(progress.effective_tasks_completed)
    displayAvailable = Math.round(progress.effective_tasks_assigned)
    displayNoun = 'tasks'
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${pool.pool_name} pool detail`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--color-text-primary) 40%, transparent)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border-default, var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-2">
            <h2 style={{
              margin: 0,
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'var(--color-text-heading)',
            }}>
              {pool.pool_name === 'default' ? 'Main Pool' : pool.pool_name}
            </h2>
            {isPaused && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-muted)',
              }}>
                <Pause size={10} /> Paused
              </span>
            )}
            {isMeasurement && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-muted)',
              }}>
                No payout
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem' }}>
          {/* Big percentage */}
          <div className="text-center mb-4">
            <div className="text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>
              {pct}%
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {displayCompleted} / {displayAvailable} {displayNoun} completed
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden mb-4" style={{ background: 'var(--color-border-default)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: isPaused ? 'var(--color-text-muted)' : 'var(--surface-primary)',
              }}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {showMoney && !isMeasurement && (
              <StatCard label="Earned" value={formatDollars(earned)} />
            )}
            {showMoney && !isMeasurement && (
              <StatCard label="Base amount" value={formatDollars(pool.weekly_amount)} />
            )}
            {!isMeasurement && (
              <StatCard label="Weight" value={`${weightPct}% of total`} />
            )}
            <StatCard
              label="Approach"
              value={pool.calculation_approach === 'points_weighted' ? 'Points' : 'Dynamic'}
            />
            {progress?.bonus_applied && (
              <div className="col-span-2 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{
                background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                color: 'var(--color-accent)',
              }}>
                <TrendingUp size={14} />
                Bonus earned! {showMoney && !isMeasurement && `+${formatDollars(progress.bonus_amount)}`}
              </div>
            )}
          </div>

          {/* Extra credit / numerator boost */}
          {progress && (progress.extra_credit_completed > 0 || progress.numerator_boost_total > 0) && (
            <div className="mb-4 space-y-1">
              {progress.extra_credit_completed > 0 && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Extra credit tasks</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{progress.extra_credit_completed}</span>
                </div>
              )}
              {progress.numerator_boost_total > 0 && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Above & beyond boost</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>+{progress.numerator_boost_total.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Thresholds */}
          <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {pool.minimum_threshold > 0 && (
              <div className="flex justify-between">
                <span>Minimum threshold</span>
                <span style={{ color: pct >= pool.minimum_threshold ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                  {pool.minimum_threshold}% {pct >= pool.minimum_threshold ? '(met)' : '(not met)'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Bonus threshold</span>
              <span style={{ color: pct >= pool.bonus_threshold ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                {pool.bonus_threshold}% {pct >= pool.bonus_threshold ? '(met)' : `(need ${pool.bonus_threshold - pct}% more)`}
              </span>
            </div>
            {pool.overage_cap > 100 && (
              <div className="flex justify-between">
                <span>Max percentage</span>
                <span>{pool.overage_cap}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-default, var(--color-border))',
    }}>
      <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  )
}
