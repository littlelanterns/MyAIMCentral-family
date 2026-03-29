// PRD-10: Allowance Calculator tracker — links to task completions
// Visual variants: summary_card, fixed_task_grid, dynamic_category_rings, points_list
// Calculates earned allowance based on task completion percentage

import { useMemo } from 'react'
import { Coins, TrendingUp } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

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
