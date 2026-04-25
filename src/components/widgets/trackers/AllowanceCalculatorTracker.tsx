// PRD-10: Allowance Calculator tracker — links to task completions
// Visual variants: summary_card, fixed_task_grid, dynamic_category_rings, points_list
// Calculates earned allowance based on task completion percentage

import { useMemo, useState } from 'react'
import { Coins, TrendingUp } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'
import { useAllowanceConfig, useActivePeriod, useLiveAllowanceProgress } from '@/hooks/useFinancial'
import { useFamilyToday } from '@/hooks/useFamilyToday'
import { isoDayOfWeek, isoDaysFrom } from '@/utils/dates'

interface AllowanceConfig {
  base_amount?: number
  calculation_period?: 'weekly' | 'biweekly' | 'monthly'
  calculation_method?: 'percentage' | 'fixed_per_task' | 'points_weighted'
  bonus_threshold?: number
  bonus_percentage?: number
  total_tasks_per_period?: number
  // NEW-OO (2026-04-24): optional persisted view mode. When present,
  // overrides the default starting state. Mom configures via the widget
  // edit surface (future polish); for now, the tap-toggle handles the
  // in-session swap and localState preserves it across remounts.
  view_mode?: 'period' | 'today'
}

/**
 * Returns the period-start ISO date (YYYY-MM-DD) anchored to a server-derived
 * `todayIso`. Convention #257: no device-clock reads. Caller passes the family
 * today string from `useFamilyToday(memberId)`.
 */
function getPeriodStartIso(
  todayIso: string,
  period: 'weekly' | 'biweekly' | 'monthly',
): string {
  if (period === 'weekly') {
    const dow = isoDayOfWeek(todayIso) // 0=Sun..6=Sat → Sunday-start week
    return isoDaysFrom(todayIso, -dow)
  }
  if (period === 'biweekly') {
    const dow = isoDayOfWeek(todayIso)
    return isoDaysFrom(todayIso, -dow - 7)
  }
  // monthly → first of this month
  const [y, m] = todayIso.split('-')
  return `${y}-${m}-01`
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
  // Row 9 SCOPE-3.F14 / Convention #257: server-derived family today for the
  // legacy-fallback code path below. Prop-drill into getPeriodStartIso so no
  // client-clock read ever happens.
  const { data: familyToday } = useFamilyToday(memberId)

  // NEW-OO (2026-04-24): Today vs Period toggle. Single view at a time.
  // Default: 'period' (weekly tally — matches pre-OO behavior). When mom
  // taps to 'today', we narrow the RPC window to familyToday..familyToday
  // so she sees what kid completed today vs "how much of the week is
  // done." Persisted only in component state for now — no widget_config
  // write on tap. An explicit config lever can land later if founder
  // wants a default override per widget.
  const [viewMode, setViewMode] = useState<'period' | 'today'>(
    config.view_mode ?? 'period',
  )
  // Live frequency-day-aware tally for the current window. Recomputes on
  // each routine_step_completion invalidation (see useTaskCompletions for
  // the invalidation key). Until the period closes, these live values
  // beat the stored columns on allowance_periods.
  //
  // NEW-UU (2026-04-24): 4th arg `graceDays` MUST be passed. Omitting it
  // makes useLiveAllowanceProgress send p_grace_days=null to the RPC so
  // any marked grace days have zero widget effect.
  const gracePayload = (activePeriod?.grace_days as string[] | undefined) ?? undefined
  // Today view uses a 1-day window starting at familyToday. Period view
  // uses the full active-period window. Both pass grace_days — for a
  // today window that happens to be a grace day, the RPC correctly
  // returns 0/0 → 100% per PRD-28 L977 semantics.
  const rpcStart = viewMode === 'today' ? (familyToday ?? activePeriod?.period_start) : activePeriod?.period_start
  const rpcEnd = viewMode === 'today' ? (familyToday ?? activePeriod?.period_end) : activePeriod?.period_end
  const { data: liveProgress } = useLiveAllowanceProgress(
    realConfig?.enabled ? memberId : undefined,
    rpcStart,
    rpcEnd,
    gracePayload,
  )
  const usePrd28Data = !!realConfig?.enabled && !!activePeriod

  // Fallback: existing dataPoints-based calculation (always computed to satisfy hook rules).
  // Until familyToday resolves, fall back to an epoch-far-past cutoff so the
  // memo returns stable values without causing a device-clock leak.
  const { completed, totalPossible, percentage, earnedAmount, bonusEarned } = useMemo(() => {
    const periodStartIso = familyToday
      ? getPeriodStartIso(familyToday, period)
      : '1970-01-01'
    const periodStartMs = new Date(periodStartIso + 'T00:00:00Z').getTime()

    // Filter data points for current period (TIMESTAMPTZ compare via UTC-ms).
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {viewMode === 'today' ? 'Today' : 'This Week'}
            </span>
          </div>
          {/* NEW-OO: Today/Period segmented toggle. Two positions, single
              view at a time. */}
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
                  color:
                    viewMode === mode
                      ? 'var(--color-text-on-primary)'
                      : 'var(--color-text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'today' ? 'Today' : 'Week'}
              </button>
            ))}
          </div>
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
