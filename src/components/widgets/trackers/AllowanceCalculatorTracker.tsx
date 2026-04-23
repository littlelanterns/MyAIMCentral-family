// PRD-10: Allowance Calculator tracker — links to task completions
// Visual variants: summary_card, fixed_task_grid, dynamic_category_rings, points_list
// Calculates earned allowance based on task completion percentage

import { useMemo } from 'react'
import { Coins, TrendingUp } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'
import { useAllowanceConfig, useActivePeriod, useLiveAllowanceProgress } from '@/hooks/useFinancial'

interface AllowanceConfig {
  base_amount?: number
  calculation_period?: 'weekly' | 'biweekly' | 'monthly'
  calculation_method?: 'percentage' | 'fixed_per_task' | 'points_weighted'
  bonus_threshold?: number
  bonus_percentage?: number
  total_tasks_per_period?: number
}

function getPeriodStartDate(period: 'weekly' | 'biweekly' | 'monthly'): Date {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'weekly') {
    const day = start.getDay()
    start.setDate(start.getDate() - day) // Sunday start
  } else if (period === 'biweekly') {
    const day = start.getDay()
    start.setDate(start.getDate() - day - 7)
  } else {
    start.setDate(1) // First of month
  }

  start.setHours(0, 0, 0, 0)
  return start
}

export function AllowanceCalculatorTracker({
  widget,
  dataPoints,
  isCompact,
}: TrackerProps) {
  const config = widget.widget_config as AllowanceConfig
  const baseAmount = config.base_amount ?? 10
  const period = config.calculation_period ?? 'weekly'
  const bonusThreshold = config.bonus_threshold ?? 0.85
  const bonusPercentage = config.bonus_percentage ?? 0.2

  // PRD-28: Try to read real allowance data when config exists
  const memberId = widget.assigned_member_id ?? widget.family_member_id
  const { data: realConfig } = useAllowanceConfig(memberId)
  const { data: activePeriod } = useActivePeriod(realConfig?.enabled ? memberId : undefined)
  // Live frequency-day-aware tally for the current period. Recomputes on each
  // routine_step_completion invalidation (see useTaskCompletions for the
  // invalidation key). Until the period closes, these live values beat the
  // stored columns on allowance_periods (which are only written at close).
  const { data: liveProgress } = useLiveAllowanceProgress(
    realConfig?.enabled ? memberId : undefined,
    activePeriod?.period_start,
    activePeriod?.period_end,
  )
  const usePrd28Data = !!realConfig?.enabled && !!activePeriod

  // Fallback: existing dataPoints-based calculation (always computed to satisfy hook rules)
  const { completed, totalPossible, percentage, earnedAmount, bonusEarned } = useMemo(() => {
    const periodStart = getPeriodStartDate(period)

    // Filter data points for current period
    const periodPoints = dataPoints.filter(dp => {
      const dpDate = new Date(dp.recorded_at)
      return dpDate >= periodStart
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
  }, [dataPoints, period, baseAmount, bonusThreshold, bonusPercentage, config.total_tasks_per_period])

  const formatDollars = (val: number) => `$${val.toFixed(2)}`
  const percentDisplay = Math.round(percentage * 100)

  // PRD-28: When real allowance data exists, render live progress if available,
  // otherwise fall back to the stored period columns (used after the period has
  // been closed by the calculate-allowance-period Edge Function).
  if (usePrd28Data) {
    const prd28Earned = liveProgress?.total_earned ?? activePeriod.total_earned
    const prd28Pct = Math.round(liveProgress?.completion_percentage ?? activePeriod.completion_percentage)
    const prd28BonusApplied = liveProgress?.bonus_applied ?? activePeriod.bonus_applied

    // Display numerator/denominator: prefer raw step counts when routines
    // exist (what kids actually check off), fall back to whole-task counts
    // for pools with only non-routine tasks, fall back again to rounded
    // pro-rated pool fractions when live progress hasn't resolved yet.
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

    // Money visibility is a mom-controlled setting (`child_can_see_finances`
    // on allowance_configs). Play shell previously hid money regardless; mom
    // asked for this to be a single setting so kids can see what's going on.
    const showMoney = realConfig.child_can_see_finances

    if (isCompact) {
      return (
        <div className="flex flex-col h-full items-center justify-center gap-1">
          <Coins size={20} style={{ color: 'var(--color-accent)' }} />
          <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {showMoney ? formatDollars(Number(prd28Earned)) : `${prd28Pct}%`}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {showMoney ? `${prd28Pct}% done` : 'completion'}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-center gap-2">
          <Coins size={18} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>This Week</span>
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
        {prd28BonusApplied && (
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

  // Fallback rendering for families without allowance configured
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

  // Full summary_card variant
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Coins size={18} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {period === 'weekly' ? 'This Week' : period === 'biweekly' ? 'This Pay Period' : 'This Month'}
        </span>
      </div>

      {/* Task completion summary */}
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {completed}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          / {totalPossible} tasks
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentDisplay, 100)}%`,
            background: 'var(--surface-primary)',
          }}
        />
      </div>

      {/* Calculation breakdown */}
      <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="flex justify-between">
          <span>Completion</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{percentDisplay}%</span>
        </div>
        <div className="flex justify-between">
          <span>{formatDollars(baseAmount)} x {percentDisplay}%</span>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {formatDollars(baseAmount * percentage)}
          </span>
        </div>
      </div>

      {/* Bonus indicator */}
      {bonusEarned && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          <TrendingUp size={12} />
          +{Math.round(bonusPercentage * 100)}% bonus!
        </div>
      )}

      {/* Total earned */}
      <div className="mt-auto flex items-baseline justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Earned
        </span>
        <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
          {formatDollars(earnedAmount)}
        </span>
      </div>
    </div>
  )
}
