// PRD-10: Multi-habit grid tracker — bullet-journal style monthly grid
// Visual variants: bujo_monthly_grid, classic_grid, color_coded_grid, sticker_board
// Each row = a habit, each column = a day. Tap cell to mark done.

import React, { useMemo } from 'react'
import { Grid3x3 } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function HabitGridTracker({ widget, dataPoints, onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    default_habits?: string[]
    grid_size?: 'weekly' | 'monthly'
  }
  const habits = config.default_habits ?? ['Habit 1', 'Habit 2', 'Habit 3']
  const gridSize = config.grid_size ?? 'monthly'

  // Generate date columns for current period
  const { dates, monthLabel } = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    if (gridSize === 'weekly') {
      // Current week (Mon-Sun)
      const dayOfWeek = now.getDay() || 7 // Monday = 1
      const monday = new Date(now)
      monday.setDate(now.getDate() - dayOfWeek + 1)
      const days: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        days.push(d.toISOString().split('T')[0])
      }
      return { dates: days, monthLabel: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` }
    }

    // Monthly: all days of current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d).toISOString().split('T')[0])
    }
    const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return { dates: days, monthLabel: label }
  }, [gridSize])

  // Build completion map: { "habitIdx:date" -> true }
  const completionMap = useMemo(() => {
    const map = new Set<string>()
    for (const dp of dataPoints) {
      const habitIdx = (dp.metadata as { habit_index?: number })?.habit_index
      if (habitIdx !== undefined && Number(dp.value) > 0) {
        map.add(`${habitIdx}:${dp.recorded_date}`)
      }
    }
    return map
  }, [dataPoints])

  const handleToggle = (habitIdx: number, date: string) => {
    if (!onRecordData) return
    const key = `${habitIdx}:${date}`
    const isChecked = completionMap.has(key)
    onRecordData(isChecked ? 0 : 1, {
      habit_index: habitIdx,
      habit_name: habits[habitIdx],
      date,
      type: 'habit_grid_toggle',
    })
  }

  // In compact mode, show limited columns
  const visibleDates = isCompact ? dates.slice(-7) : dates
  const visibleHabits = isCompact ? habits.slice(0, 3) : habits
  const cellSize = isCompact ? 10 : 14

  return (
    <div className="flex flex-col h-full gap-1">
      {!isCompact && (
        <div className="flex items-center gap-1.5 mb-1">
          <Grid3x3 size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {monthLabel}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="grid gap-px" style={{ gridTemplateColumns: `auto repeat(${visibleDates.length}, ${cellSize}px)` }}>
          {/* Header row: day numbers */}
          <div /> {/* empty cell for habit label column */}
          {visibleDates.map(date => {
            const day = new Date(date + 'T12:00:00').getDate()
            return (
              <div
                key={date}
                className="flex items-center justify-center text-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: isCompact ? 6 : 8,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {day}
              </div>
            )
          })}

          {/* Habit rows */}
          {visibleHabits.map((habit, habitIdx) => (
            <React.Fragment key={habitIdx}>
              <div
                className="truncate pr-1 flex items-center"
                style={{
                  fontSize: isCompact ? 8 : 10,
                  color: 'var(--color-text-primary)',
                  maxWidth: isCompact ? 50 : 80,
                }}
              >
                {habit}
              </div>
              {visibleDates.map(date => {
                const filled = completionMap.has(`${habitIdx}:${date}`)
                const isToday = date === new Date().toISOString().split('T')[0]
                return (
                  <button
                    key={date}
                    onClick={() => handleToggle(habitIdx, date)}
                    disabled={!onRecordData}
                    className="rounded-sm transition-all"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: filled
                        ? 'var(--color-accent)'
                        : isToday
                        ? 'var(--color-accent-light, rgba(var(--color-accent-rgb, 0,0,0), 0.1))'
                        : 'var(--color-border-default)',
                      opacity: filled ? 1 : 0.4,
                    }}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {isCompact && habits.length > 3 && (
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontSize: 8 }}>
          +{habits.length - 3} habits
        </span>
      )}
    </div>
  )
}
