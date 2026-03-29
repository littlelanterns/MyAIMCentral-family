// PRD-10: Boolean Check-In tracker — one yes/no per day
// Visual variants: simple_toggle (default), calendar_dots, stamp_card, heatmap

import { useMemo } from 'react'
import { CircleCheck, Circle, CalendarDays } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function BooleanCheckinTracker({ widget, dataPoints, onRecordData, variant, isCompact }: TrackerProps) {
  const _config = widget.widget_config as {
    title?: string
  }

  const today = new Date().toISOString().slice(0, 10)

  const isDoneToday = useMemo(() => {
    return dataPoints.some(dp => dp.recorded_date === today && Number(dp.value) === 1)
  }, [dataPoints, today])

  const handleToggle = () => {
    if (isDoneToday) {
      onRecordData?.(0, { value_type: 'boolean' })
    } else {
      onRecordData?.(1, { value_type: 'boolean' })
    }
  }

  if (variant === 'calendar_dots') {
    return (
      <CalendarDotsVariant
        dataPoints={dataPoints}
        isDoneToday={isDoneToday}
        onToggle={handleToggle}
        isCompact={isCompact}
        hasRecordData={!!onRecordData}
      />
    )
  }

  // Default: simple_toggle
  if (isCompact) {
    return (
      <button
        onClick={onRecordData ? handleToggle : undefined}
        className="flex items-center gap-1.5 h-full w-full justify-center"
        style={{ color: isDoneToday ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
      >
        {isDoneToday ? <CircleCheck size={16} /> : <Circle size={16} />}
        <span className="text-xs font-medium">
          {isDoneToday ? 'Done' : 'Not yet'}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <button
        onClick={onRecordData ? handleToggle : undefined}
        className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300"
        style={{
          background: isDoneToday
            ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
            : 'var(--color-surface-secondary)',
          border: `2px solid ${isDoneToday ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
        }}
      >
        {isDoneToday ? (
          <CircleCheck
            size={40}
            style={{ color: 'var(--color-accent)' }}
            className="transition-all duration-300"
          />
        ) : (
          <Circle
            size={40}
            style={{ color: 'var(--color-text-secondary)' }}
            className="transition-all duration-300"
          />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: isDoneToday ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
        >
          {isDoneToday ? 'Done today!' : 'Not yet'}
        </span>
      </button>

      <StreakDisplay dataPoints={dataPoints} />
    </div>
  )
}

// ── Streak display helper ──────────────────────────────────

function StreakDisplay({ dataPoints }: { dataPoints: TrackerProps['dataPoints'] }) {
  const streak = useMemo(() => {
    const completedDates = new Set(
      dataPoints
        .filter(dp => Number(dp.value) === 1)
        .map(dp => dp.recorded_date)
    )

    let count = 0
    const d = new Date()
    // Check from today backwards
    while (true) {
      const dateStr = d.toISOString().slice(0, 10)
      if (completedDates.has(dateStr)) {
        count++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }, [dataPoints])

  if (streak <= 0) return null

  return (
    <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
      {streak} day streak
    </div>
  )
}

// ── Calendar Dots variant ──────────────────────────────────

function CalendarDotsVariant({
  dataPoints,
  isDoneToday,
  onToggle,
  isCompact,
  hasRecordData,
}: {
  dataPoints: TrackerProps['dataPoints']
  isDoneToday: boolean
  onToggle: () => void
  isCompact?: boolean
  hasRecordData: boolean
}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayStr = today.toISOString().slice(0, 10)

  const completedDates = useMemo(() => {
    return new Set(
      dataPoints
        .filter(dp => Number(dp.value) === 1)
        .map(dp => dp.recorded_date)
    )
  }, [dataPoints])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const monthName = today.toLocaleString('default', { month: 'long' })

  if (isCompact) {
    const completedThisMonth = Array.from(completedDates).filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length
    return (
      <div className="flex items-center gap-1.5 h-full w-full justify-center">
        <CalendarDays size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {completedThisMonth}/{daysInMonth}
        </span>
      </div>
    )
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        {monthName} {year}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {dayLabels.map((label, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isCompleted = completedDates.has(dateStr)
          const isToday = dateStr === todayStr

          return (
            <button
              key={day}
              onClick={isToday && hasRecordData ? onToggle : undefined}
              disabled={!isToday || !hasRecordData}
              className="flex items-center justify-center rounded-full text-[10px] transition-all duration-200"
              style={{
                aspectRatio: '1',
                background: isCompleted
                  ? 'var(--color-accent)'
                  : isToday
                    ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                    : 'transparent',
                color: isCompleted
                  ? 'var(--color-text-on-primary)'
                  : isToday
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                border: isToday && !isCompleted
                  ? '1.5px solid var(--color-accent)'
                  : '1.5px solid transparent',
                opacity: day > today.getDate() ? 0.3 : 1,
                cursor: isToday && hasRecordData ? 'pointer' : 'default',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Today toggle at bottom */}
      {hasRecordData && (
        <button
          onClick={onToggle}
          className="mt-1.5 flex items-center justify-center gap-1 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            background: isDoneToday
              ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
              : 'var(--color-surface-secondary)',
            color: isDoneToday ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          {isDoneToday ? <CircleCheck size={12} /> : <Circle size={12} />}
          {isDoneToday ? 'Done today' : 'Mark today'}
        </button>
      )}
    </div>
  )
}
