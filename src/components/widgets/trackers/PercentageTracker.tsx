// PRD-10: Percentage tracker — completion percentage display
// Visual variants: donut_ring, progress_bar, responsibility_gauge, battery, donut_completion
// Used for chore completion → allowance wiring (PRD-28 stub)

import { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function PercentageTracker({ widget, dataPoints, onRecordData: _onRecordData, variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    goal_percentage?: number
    calculation_source?: string
    connect_to_allowance?: boolean
  }
  const goal = config.goal_percentage ?? 100

  // Latest percentage value (most recent 'set' type data point)
  const currentPercentage = useMemo(() => {
    const setPoints = dataPoints.filter(dp => dp.value_type === 'percentage' || dp.value_type === 'set')
    if (setPoints.length > 0) {
      return Number(setPoints[setPoints.length - 1].value)
    }
    // Fall back to computing from boolean data points
    const today = new Date().toISOString().split('T')[0]
    const todayPoints = dataPoints.filter(dp => dp.recorded_date === today)
    if (todayPoints.length === 0) return 0
    const completed = todayPoints.filter(dp => Number(dp.value) > 0).length
    return Math.round((completed / todayPoints.length) * 100)
  }, [dataPoints])

  const progressRatio = Math.min(currentPercentage / goal, 1)

  // Donut variant
  if (variant === 'donut_ring' || variant === 'donut_completion') {
    return <DonutPercentage percentage={currentPercentage} goal={goal} isCompact={isCompact} />
  }

  // Battery variant
  if (variant === 'battery') {
    return <BatteryPercentage percentage={currentPercentage} goal={goal} isCompact={isCompact} />
  }

  // Default: horizontal progress bar
  return (
    <div className="flex flex-col h-full justify-center gap-2">
      <div className="flex items-center justify-between">
        <PieChart size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {currentPercentage}%
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressRatio * 100}%`,
            background: currentPercentage >= goal
              ? 'var(--color-accent)'
              : 'var(--surface-primary)',
          }}
        />
      </div>

      {!isCompact && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Goal: {goal}%
        </div>
      )}
    </div>
  )
}

// ── Donut sub-variant ───────────────────────────────────────

function DonutPercentage({ percentage, goal, isCompact }: { percentage: number; goal: number; isCompact?: boolean }) {
  const size = isCompact ? 64 : 88
  const strokeWidth = isCompact ? 7 : 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(percentage / goal, 1)
  const offset = circumference - ratio * circumference

  return (
    <div className="flex flex-col items-center h-full justify-center gap-1">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--color-border-default)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={percentage >= goal ? 'var(--color-accent)' : 'var(--color-accent)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {percentage}%
          </span>
        </div>
      </div>
      {!isCompact && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          of {goal}% goal
        </div>
      )}
    </div>
  )
}

// ── Battery sub-variant ─────────────────────────────────────

function BatteryPercentage({ percentage, goal, isCompact }: { percentage: number; goal: number; isCompact?: boolean }) {
  const ratio = Math.min(percentage / goal, 1)
  const height = isCompact ? 48 : 72

  return (
    <div className="flex flex-col items-center h-full justify-center gap-2">
      <div
        className="relative rounded-md border-2 overflow-hidden"
        style={{
          width: isCompact ? 28 : 36,
          height,
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Battery cap */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-t-sm"
          style={{
            width: isCompact ? 12 : 16,
            height: 4,
            background: 'var(--color-border-default)',
          }}
        />
        {/* Fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700"
          style={{
            height: `${ratio * 100}%`,
            background: ratio > 0.6 ? 'var(--color-accent)' : ratio > 0.3 ? 'var(--color-warning, orange)' : 'var(--color-error, red)',
          }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {percentage}%
      </span>
    </div>
  )
}
