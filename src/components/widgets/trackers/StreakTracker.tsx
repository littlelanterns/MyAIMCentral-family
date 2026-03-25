// PRD-10: Streak tracker — consecutive day tracking
// Visual variants: flame_counter, chain_links, mountain_climb, growing_tree
// Convention: grace_period configurable (0 or 1 day)

import { useMemo } from 'react'
import { Flame, Plus } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function StreakTracker({ widget, dataPoints, onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    grace_period?: number
    celebration_at_milestones?: number[]
  }
  const milestones = config.celebration_at_milestones ?? [7, 14, 30, 60, 100]

  // Calculate current streak from data points
  const { currentStreak, longestStreak, todayCompleted } = useMemo(() => {
    if (dataPoints.length === 0) return { currentStreak: 0, longestStreak: 0, todayCompleted: false }

    const today = new Date().toISOString().split('T')[0]
    const dates = [...new Set(dataPoints.map(dp => dp.recorded_date))].sort().reverse()

    const todayDone = dates[0] === today
    let streak = 0
    let checkDate = new Date()
    if (!todayDone) {
      // If grace_period = 1, we can still count yesterday
      if (config.grace_period === 1) {
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    const dateSet = new Set(dates)
    let longestSeen = 0
    let currentRun = 0

    // Walk backwards through dates to find current streak
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dateSet.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate longest streak (simple scan)
    const sortedDates = [...dates].sort()
    for (const d of sortedDates) {
      const prev = new Date(d)
      prev.setDate(prev.getDate() - 1)
      const prevStr = prev.toISOString().split('T')[0]
      if (dateSet.has(prevStr)) {
        currentRun++
      } else {
        currentRun = 1
      }
      longestSeen = Math.max(longestSeen, currentRun)
    }

    return { currentStreak: streak, longestStreak: Math.max(longestSeen, streak), todayCompleted: todayDone }
  }, [dataPoints, config.grace_period])

  const nextMilestone = milestones.find(m => m > currentStreak) ?? milestones[milestones.length - 1]

  const handleLogToday = () => {
    onRecordData?.(1, { type: 'streak_check_in' })
  }

  // Determine flame intensity
  const flameIntensity = currentStreak >= 30 ? 'high' : currentStreak >= 7 ? 'medium' : 'low'

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2">
      {/* Flame icon with theme-aware coloring */}
      <div
        className={`relative ${flameIntensity === 'high' ? 'animate-pulse' : ''}`}
      >
        <Flame
          size={isCompact ? 28 : 40}
          fill={currentStreak > 0 ? 'var(--color-accent)' : 'none'}
          stroke={currentStreak > 0 ? 'var(--color-accent)' : 'var(--color-border-default)'}
          strokeWidth={currentStreak > 0 ? 1.5 : 2}
        />
      </div>

      {/* Streak number */}
      <div className="text-center">
        <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {currentStreak}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {currentStreak === 1 ? 'day' : 'days'}
        </div>
      </div>

      {/* Longest streak (non-compact only) */}
      {!isCompact && longestStreak > currentStreak && (
        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Best: {longestStreak} days
        </div>
      )}

      {/* Next milestone */}
      {!isCompact && currentStreak > 0 && nextMilestone > currentStreak && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Next milestone: {nextMilestone} days
        </div>
      )}

      {/* Empty state */}
      {currentStreak === 0 && (
        <div className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Start your streak!
        </div>
      )}

      {/* Check-in button */}
      {onRecordData && !todayCompleted && (
        <button
          onClick={handleLogToday}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
        >
          <Plus size={12} />
          Log today
        </button>
      )}

      {todayCompleted && (
        <div className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
          Today done!
        </div>
      )}
    </div>
  )
}
