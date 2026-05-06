// PRD-10 / Phase 3.5: Allowance Calculator tracker — multi-pool aware
// Single pool: renders identically to pre-3.5 behavior
// Multiple pools: per-pool mini progress bars + combined percentage/payout

import { useMemo, useState } from 'react'
import { Coins, TrendingUp, Pause } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'
import {
  useAllowanceConfig,
  useActivePeriod,
  useLiveAllowanceProgress,
  useMemberAllowancePools,
  useActivePeriods,
} from '@/hooks/useFinancial'
import type { GraceDayEntry, LiveAllowanceProgress } from '@/hooks/useFinancial'
import type { AllowanceConfig as DBAllowanceConfig } from '@/types/financial'
import { useFamilyToday } from '@/hooks/useFamilyToday'
import { isoDayOfWeek, isoDaysFrom } from '@/utils/dates'
import { PoolDetailModal } from './PoolDetailModal'

interface WidgetAllowanceConfig {
  base_amount?: number
  calculation_period?: 'weekly' | 'biweekly' | 'monthly'
  calculation_method?: 'percentage' | 'fixed_per_task' | 'points_weighted'
  bonus_threshold?: number
  bonus_percentage?: number
  total_tasks_per_period?: number
  view_mode?: 'period' | 'today'
}

function getPeriodStartIso(
  todayIso: string,
  period: 'weekly' | 'biweekly' | 'monthly',
): string {
  if (period === 'weekly') {
    const dow = isoDayOfWeek(todayIso)
    return isoDaysFrom(todayIso, -dow)
  }
  if (period === 'biweekly') {
    const dow = isoDayOfWeek(todayIso)
    return isoDaysFrom(todayIso, -dow - 7)
  }
  const [y, m] = todayIso.split('-')
  return `${y}-${m}-01`
}

const formatDollars = (val: number) => `$${val.toFixed(2)}`

function SinglePoolView({
  widget,
  dataPoints,
  isCompact,
}: TrackerProps) {
  const config = widget.widget_config as WidgetAllowanceConfig
  const baseAmount = config.base_amount ?? 10
  const period = config.calculation_period ?? 'weekly'
  const bonusThreshold = config.bonus_threshold ?? 0.85
  const bonusPercentage = config.bonus_percentage ?? 0.2

  const memberId = widget.assigned_member_id ?? widget.family_member_id
  const { data: realConfig } = useAllowanceConfig(memberId)
  const { data: activePeriod } = useActivePeriod(realConfig?.enabled ? memberId : undefined)
  const { data: familyToday } = useFamilyToday(memberId)

  const [viewMode, setViewMode] = useState<'period' | 'today'>(
    config.view_mode ?? 'period',
  )

  const gracePayload = (activePeriod?.grace_days as GraceDayEntry[] | undefined) ?? undefined
  const rpcStart = viewMode === 'today' ? (familyToday ?? activePeriod?.period_start) : activePeriod?.period_start
  const rpcEnd = viewMode === 'today' ? (familyToday ?? activePeriod?.period_end) : activePeriod?.period_end
  const { data: liveProgress } = useLiveAllowanceProgress(
    realConfig?.enabled ? memberId : undefined,
    rpcStart,
    rpcEnd,
    gracePayload,
  )
  const usePrd28Data = !!realConfig?.enabled && !!activePeriod

  const { completed, totalPossible, percentage, earnedAmount, bonusEarned } = useMemo(() => {
    const periodStartIso = familyToday
      ? getPeriodStartIso(familyToday, period)
      : '1970-01-01'
    const periodStartMs = new Date(periodStartIso + 'T00:00:00Z').getTime()
    const periodPoints = dataPoints.filter(dp => {
      const dpDate = new Date(dp.recorded_at)
      return dpDate.getTime() >= periodStartMs
    })
    const completedCount = periodPoints.filter(dp => dp.value === 1).length
    const totalCount = config.total_tasks_per_period ?? Math.max(periodPoints.length, 1)
    const pct = totalCount > 0 ? completedCount / totalCount : 0
    let earned = baseAmount * pct
    let bonus = false
    if (pct >= bonusThreshold) {
      earned += baseAmount * bonusPercentage
      bonus = true
    }
    return {
      completed: completedCount,
      totalPossible: totalCount,
      percentage: pct,
      earnedAmount: earned,
      bonusEarned: bonus,
    }
  }, [dataPoints, period, baseAmount, bonusThreshold, bonusPercentage, config.total_tasks_per_period, familyToday])

  const percentDisplay = Math.round(percentage * 100)

  if (usePrd28Data) {
    const prd28Earned = liveProgress?.total_earned ?? activePeriod.total_earned
    const prd28Pct = Math.round(liveProgress?.completion_percentage ?? activePeriod.completion_percentage)
    const prd28BonusApplied = liveProgress?.bonus_applied ?? activePeriod.bonus_applied

    let displayCompleted: number
    let displayAvailable: number
    let displayNoun: string
    if (liveProgress && liveProgress.raw_steps_available > 0) {
      displayCompleted = liveProgress.raw_steps_completed + liveProgress.nonroutine_tasks_completed
      displayAvailable = liveProgress.raw_steps_available + liveProgress.nonroutine_tasks_total
      displayNoun = 'steps'
    } else if (liveProgress && liveProgress.nonroutine_tasks_total > 0) {
      displayCompleted = liveProgress.nonroutine_tasks_completed
      displayAvailable = liveProgress.nonroutine_tasks_total
      displayNoun = 'tasks'
    } else {
      displayCompleted = Math.round(liveProgress?.effective_tasks_completed ?? activePeriod.effective_tasks_completed)
      displayAvailable = Math.round(liveProgress?.effective_tasks_assigned ?? activePeriod.effective_tasks_assigned)
      displayNoun = 'tasks'
    }

    const showMoney = realConfig.child_can_see_finances && viewMode === 'period'

    if (isCompact) {
      return (
        <div className="flex flex-col h-full items-center justify-center gap-1">
          <Coins size={20} style={{ color: 'var(--color-accent)' }} />
          <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {showMoney ? formatDollars(Number(prd28Earned)) : `${prd28Pct}%`}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {showMoney ? `${prd28Pct}% done` : viewMode === 'today' ? 'today' : 'completion'}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {viewMode === 'today' ? 'Today' : 'This Week'}
            </span>
          </div>
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{displayCompleted}</span>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/ {displayAvailable} {displayNoun}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(prd28Pct, 100)}%`, background: 'var(--surface-primary)' }} />
        </div>
        <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex justify-between">
            <span>Completion</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{prd28Pct}%</span>
          </div>
          {showMoney && (
            <div className="flex justify-between">
              <span>Earned</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{formatDollars(Number(prd28Earned))}</span>
            </div>
          )}
        </div>
        {prd28BonusApplied && viewMode === 'period' && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
            <TrendingUp size={12} />
            Bonus earned!
          </div>
        )}
        <div className="mt-auto flex items-baseline justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {showMoney ? 'Earned' : 'Progress'}
          </span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
            {showMoney ? formatDollars(Number(prd28Earned)) : `${prd28Pct}%`}
          </span>
        </div>
      </div>
    )
  }

  if (isCompact) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-1">
        <Coins size={20} style={{ color: 'var(--color-accent)' }} />
        <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatDollars(earnedAmount)}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {percentDisplay}% done
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2">
        <Coins size={18} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {period === 'weekly' ? 'This Week' : period === 'biweekly' ? 'This Pay Period' : 'This Month'}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{completed}</span>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/ {totalPossible} tasks</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percentDisplay, 100)}%`, background: 'var(--surface-primary)' }} />
      </div>
      <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="flex justify-between">
          <span>Completion</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{percentDisplay}%</span>
        </div>
        <div className="flex justify-between">
          <span>{formatDollars(baseAmount)} x {percentDisplay}%</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{formatDollars(baseAmount * percentage)}</span>
        </div>
      </div>
      {bonusEarned && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
          <TrendingUp size={12} />
          +{Math.round(bonusPercentage * 100)}% bonus!
        </div>
      )}
      <div className="mt-auto flex items-baseline justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Earned</span>
        <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{formatDollars(earnedAmount)}</span>
      </div>
    </div>
  )
}

function PoolProgressRow({
  pool,
  progress,
  showMoney,
  isMeasurementOnly,
  onClick,
}: {
  pool: DBAllowanceConfig
  progress: LiveAllowanceProgress | null
  showMoney: boolean
  isMeasurementOnly: boolean
  onClick: () => void
}) {
  const pct = Math.round(progress?.completion_percentage ?? 0)
  const earned = progress?.total_earned ?? 0
  const isPaused = pool.pool_status === 'paused'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      style={{
        padding: '0.375rem 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        opacity: isPaused ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {pool.pool_name === 'default' ? 'Main' : pool.pool_name}
          </span>
          {isPaused && <Pause size={10} style={{ color: 'var(--color-text-muted)' }} />}
          {isMeasurementOnly && (
            <span className="text-[9px] px-1 py-0.5 rounded" style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
            }}>
              Tracked
            </span>
          )}
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {showMoney && !isMeasurementOnly ? formatDollars(earned) : `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: isPaused
              ? 'var(--color-text-muted)'
              : 'var(--surface-primary)',
          }}
        />
      </div>
    </button>
  )
}

function useMultiPoolProgress(
  pools: DBAllowanceConfig[],
  memberId: string | undefined,
  viewMode: 'period' | 'today',
  familyToday: string | undefined,
) {
  const activePools = pools.filter(p => p.pool_status !== 'archived')
  const { data: allPeriods } = useActivePeriods(memberId)
  const periodByPool = useMemo(() => {
    const map = new Map<string, { period_start: string; period_end: string; grace_days: GraceDayEntry[] }>()
    for (const p of (allPeriods ?? [])) {
      if (!map.has(p.pool_name)) {
        map.set(p.pool_name, {
          period_start: p.period_start,
          period_end: p.period_end,
          grace_days: (p.grace_days as GraceDayEntry[]) ?? [],
        })
      }
    }
    return map
  }, [allPeriods])

  const progressQueries: Array<{
    pool: DBAllowanceConfig
    periodStart: string | undefined
    periodEnd: string | undefined
    graceDays: GraceDayEntry[] | undefined
  }> = activePools.map(pool => {
    const period = periodByPool.get(pool.pool_name)
    const start = viewMode === 'today' ? familyToday : period?.period_start
    const end = viewMode === 'today' ? familyToday : period?.period_end
    return {
      pool,
      periodStart: start,
      periodEnd: end,
      graceDays: period?.grace_days,
    }
  })

  const p0 = progressQueries[0]
  const p1 = progressQueries[1]
  const p2 = progressQueries[2]
  const p3 = progressQueries[3]
  const p4 = progressQueries[4]

  const { data: d0 } = useLiveAllowanceProgress(
    p0 ? memberId : undefined, p0?.periodStart, p0?.periodEnd, p0?.graceDays, p0?.pool.pool_name,
  )
  const { data: d1 } = useLiveAllowanceProgress(
    p1 ? memberId : undefined, p1?.periodStart, p1?.periodEnd, p1?.graceDays, p1?.pool.pool_name,
  )
  const { data: d2 } = useLiveAllowanceProgress(
    p2 ? memberId : undefined, p2?.periodStart, p2?.periodEnd, p2?.graceDays, p2?.pool.pool_name,
  )
  const { data: d3 } = useLiveAllowanceProgress(
    p3 ? memberId : undefined, p3?.periodStart, p3?.periodEnd, p3?.graceDays, p3?.pool.pool_name,
  )
  const { data: d4 } = useLiveAllowanceProgress(
    p4 ? memberId : undefined, p4?.periodStart, p4?.periodEnd, p4?.graceDays, p4?.pool.pool_name,
  )

  const results = [d0, d1, d2, d3, d4]
  const poolProgress: Array<{ pool: DBAllowanceConfig; progress: LiveAllowanceProgress | null }> = activePools.map((pool, i) => ({
    pool,
    progress: results[i] ?? null,
  }))

  return poolProgress
}

function MultiPoolView({ widget, isCompact }: { widget: TrackerProps['widget']; isCompact?: boolean }) {
  const config = widget.widget_config as WidgetAllowanceConfig
  const memberId = widget.assigned_member_id ?? widget.family_member_id
  const { data: pools } = useMemberAllowancePools(memberId)
  const { data: defaultConfig } = useAllowanceConfig(memberId)
  const { data: familyToday } = useFamilyToday(memberId)

  const [viewMode, setViewMode] = useState<'period' | 'today'>(config.view_mode ?? 'period')
  const [detailPool, setDetailPool] = useState<DBAllowanceConfig | null>(null)

  const activePools = useMemo(
    () => (pools ?? []).filter(p => p.pool_status !== 'archived' && p.enabled),
    [pools],
  )

  const poolProgress = useMultiPoolProgress(activePools, memberId, viewMode, familyToday ?? undefined)

  const showMoney = defaultConfig?.child_can_see_finances && viewMode === 'period'

  const combined = useMemo(() => {
    const payingPools = poolProgress.filter(
      pp => pp.pool.pool_status === 'active' && pp.pool.payout_mode !== 'measurement_only',
    )
    if (payingPools.length === 0) return { pct: 0, earned: 0 }
    const totalWeight = payingPools.reduce((s, pp) => s + (pp.pool.pool_weight ?? 1), 0)
    let weightedPct = 0
    let totalEarned = 0
    for (const pp of payingPools) {
      const w = (pp.pool.pool_weight ?? 1) / totalWeight
      const pct = pp.progress?.completion_percentage ?? 0
      weightedPct += pct * w
      totalEarned += pp.progress?.total_earned ?? 0
    }
    return { pct: Math.round(weightedPct), earned: totalEarned }
  }, [poolProgress])

  if (isCompact) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-1">
        <Coins size={20} style={{ color: 'var(--color-accent)' }} />
        <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {showMoney ? formatDollars(combined.earned) : `${combined.pct}%`}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {activePools.length} pools
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={18} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {viewMode === 'today' ? 'Today' : 'This Week'}
          </span>
        </div>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      <div className="flex flex-col gap-0.5">
        {poolProgress.map(({ pool, progress }) => (
          <PoolProgressRow
            key={pool.id}
            pool={pool}
            progress={progress}
            showMoney={!!showMoney}
            isMeasurementOnly={pool.payout_mode === 'measurement_only'}
            onClick={() => setDetailPool(pool)}
          />
        ))}
      </div>

      <div
        className="mt-auto pt-2 flex items-baseline justify-between"
        style={{ borderTop: '1px solid var(--color-border-default, var(--color-border))' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {showMoney ? 'Combined' : 'Overall'}
        </span>
        <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
          {showMoney ? formatDollars(combined.earned) : `${combined.pct}%`}
        </span>
      </div>

      {detailPool && (
        <PoolDetailModal
          pool={detailPool}
          progress={poolProgress.find(pp => pp.pool.id === detailPool.id)?.progress ?? null}
          allPoolProgress={poolProgress}
          showMoney={!!showMoney}
          onClose={() => setDetailPool(null)}
        />
      )}
    </div>
  )
}

function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: 'period' | 'today'
  setViewMode: (m: 'period' | 'today') => void
}) {
  return (
    <div
      role="group"
      aria-label="Allowance view toggle"
      data-testid="allowance-view-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--color-bg-secondary)',
        borderRadius: '999px',
        padding: '2px',
        border: '1px solid var(--color-border-default, var(--color-border))',
      }}
    >
      {(['today', 'period'] as const).map(mode => (
        <button
          key={mode}
          type="button"
          data-testid={`allowance-view-toggle-${mode}`}
          onClick={() => setViewMode(mode)}
          aria-pressed={viewMode === mode}
          style={{
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: viewMode === mode ? 'var(--color-btn-primary-bg)' : 'transparent',
            color: viewMode === mode
              ? 'var(--color-text-on-primary)'
              : 'var(--color-text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          {mode === 'today' ? 'Today' : 'Week'}
        </button>
      ))}
    </div>
  )
}

export function AllowanceCalculatorTracker(props: TrackerProps) {
  const memberId = props.widget.assigned_member_id ?? props.widget.family_member_id
  const { data: pools } = useMemberAllowancePools(memberId)

  const activePools = useMemo(
    () => (pools ?? []).filter(p => p.pool_status !== 'archived' && p.enabled),
    [pools],
  )

  if (activePools.length > 1) {
    return <MultiPoolView widget={props.widget} isCompact={props.isCompact} />
  }

  return <SinglePoolView {...props} />
}
