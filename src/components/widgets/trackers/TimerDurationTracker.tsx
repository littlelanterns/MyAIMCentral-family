// PRD-10: Timer Duration tracker — log time spent on activities
// Visual variants: stopwatch_bar (S/M default), time_bar_chart (M/L)
// Data engine: logs time durations with period-based aggregation

import { useMemo, useState } from 'react'
import { Clock, Plus, Timer } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function TimerDurationTracker({ widget, dataPoints, onRecordData, variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    unit?: 'minutes' | 'hours'
    goal_per_period?: number
    timer_mode?: 'manual' | 'start_stop' | 'both'
    reset_period?: 'daily' | 'weekly' | 'monthly'
  }

  const unit = config.unit ?? 'minutes'
  const goalPerPeriod = config.goal_per_period ?? 0
  const resetPeriod = config.reset_period ?? 'daily'

  // Get period boundaries
  const periodBounds = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (resetPeriod === 'daily') {
      start.setHours(0, 0, 0, 0)
    } else if (resetPeriod === 'weekly') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
    }
    return { start: start.toISOString(), end: now.toISOString() }
  }, [resetPeriod])

  // Filter data points by current period
  const periodPoints = useMemo(() => {
    return dataPoints.filter(dp => dp.recorded_at >= periodBounds.start)
  }, [dataPoints, periodBounds])

  // Today's date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Today's total
  const todayTotal = useMemo(() => {
    return periodPoints
      .filter(dp => dp.recorded_date === todayStr)
      .reduce((sum, dp) => sum + Number(dp.value), 0)
  }, [periodPoints, todayStr])

  // Period total
  const periodTotal = useMemo(() => {
    return periodPoints.reduce((sum, dp) => sum + Number(dp.value), 0)
  }, [periodPoints])

  const progressRatio = goalPerPeriod > 0 ? Math.min(periodTotal / goalPerPeriod, 1) : 0

  const formatTime = (minutes: number) => {
    if (unit === 'hours') {
      const hrs = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
    }
    return `${minutes}m`
  }

  if (variant === 'time_bar_chart') {
    return (
      <TimeBarChart
        dataPoints={dataPoints}
        goalPerPeriod={goalPerPeriod}
        unit={unit}
        formatTime={formatTime}
        isCompact={isCompact}
      />
    )
  }

  // Default: stopwatch_bar
  return (
    <StopwatchBar
      todayTotal={todayTotal}
      periodTotal={periodTotal}
      goalPerPeriod={goalPerPeriod}
      progressRatio={progressRatio}
      resetPeriod={resetPeriod}
      unit={unit}
      formatTime={formatTime}
      onRecordData={onRecordData}
      isCompact={isCompact}
    />
  )
}

// ── Stopwatch Bar sub-variant ──────────────────────────────

function StopwatchBar({
  todayTotal,
  periodTotal,
  goalPerPeriod,
  progressRatio,
  resetPeriod,
  formatTime,
  onRecordData,
  isCompact,
}: {
  todayTotal: number
  periodTotal: number
  goalPerPeriod: number
  progressRatio: number
  resetPeriod: string
  unit: string
  formatTime: (m: number) => string
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  isCompact?: boolean
}) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const quickAddAmounts = [5, 10, 15, 30]

  const handleQuickAdd = (minutes: number) => {
    onRecordData?.(minutes, { value_type: 'increment' })
    setShowQuickAdd(false)
  }

  if (isCompact) {
    return (
      <div className="flex flex-col h-full justify-center items-center gap-1">
        <Timer size={16} style={{ color: 'var(--color-accent)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatTime(todayTotal)}
        </span>
        {goalPerPeriod > 0 && (
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressRatio * 100}%`, background: 'var(--surface-primary)' }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Today
          </span>
        </div>
        {onRecordData && (
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="p-1 rounded-full transition-colors"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Today's total */}
      <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {formatTime(todayTotal)}
      </div>

      {/* Progress bar toward period goal */}
      {goalPerPeriod > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressRatio * 100}%`,
                background: progressRatio >= 1 ? 'var(--color-accent)' : 'var(--surface-primary)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{formatTime(periodTotal)} {resetPeriod}</span>
            <span>Goal: {formatTime(goalPerPeriod)}</span>
          </div>
        </div>
      )}

      {/* Quick-add buttons */}
      {showQuickAdd && onRecordData && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {quickAddAmounts.map(amt => (
            <button
              key={amt}
              onClick={() => handleQuickAdd(amt)}
              className="px-2 py-1 text-xs font-medium rounded-md transition-colors"
              style={{
                background: 'var(--color-surface-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              +{amt}m
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Time Bar Chart sub-variant ─────────────────────────────

function TimeBarChart({
  dataPoints,
  goalPerPeriod,
  formatTime,
  isCompact,
}: {
  dataPoints: Array<{ recorded_date: string; value: number }>
  goalPerPeriod: number
  unit: string
  formatTime: (m: number) => string
  isCompact?: boolean
}) {
  // Build last 7 days of data
  const chartData = useMemo(() => {
    const days: Array<{ date: string; label: string; total: number; isToday: boolean }> = []
    const today = new Date()
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayTotal = dataPoints
        .filter(dp => dp.recorded_date === dateStr)
        .reduce((sum, dp) => sum + Number(dp.value), 0)

      days.push({
        date: dateStr,
        label: dayLabels[d.getDay()],
        total: dayTotal,
        isToday: i === 0,
      })
    }
    return days
  }, [dataPoints])

  const maxVal = useMemo(() => {
    const dataMax = Math.max(...chartData.map(d => d.total), 1)
    return goalPerPeriod > 0 ? Math.max(dataMax, goalPerPeriod) : dataMax
  }, [chartData, goalPerPeriod])

  if (isCompact) {
    const todayData = chartData.find(d => d.isToday)
    return (
      <div className="flex flex-col h-full justify-center items-center gap-1">
        <Clock size={16} style={{ color: 'var(--color-accent)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatTime(todayData?.total ?? 0)}
        </span>
      </div>
    )
  }

  const chartHeight = 120
  const barWidth = 24
  const chartWidth = chartData.length * (barWidth + 8) + 8
  const labelHeight = 18

  return (
    <div className="flex flex-col h-full gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Clock size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          This Week
        </span>
      </div>

      <div className="flex-1 flex items-end justify-center overflow-hidden">
        <svg
          width="100%"
          height={chartHeight + labelHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight + labelHeight}`}
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Goal line */}
          {goalPerPeriod > 0 && (
            <line
              x1={0}
              y1={chartHeight - (goalPerPeriod / maxVal) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - (goalPerPeriod / maxVal) * chartHeight}
              stroke="var(--color-accent)"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.6}
            />
          )}

          {/* Bars */}
          {chartData.map((day, i) => {
            const barHeight = maxVal > 0 ? (day.total / maxVal) * chartHeight : 0
            const x = i * (barWidth + 8) + 8
            const y = chartHeight - barHeight

            return (
              <g key={day.date}>
                {/* Bar background */}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={chartHeight}
                  rx={4}
                  fill="var(--color-border-default)"
                  opacity={0.3}
                />
                {/* Bar fill */}
                {barHeight > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill={day.isToday ? 'var(--color-accent)' : 'var(--surface-primary)'}
                    opacity={day.isToday ? 1 : 0.7}
                  />
                )}
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + labelHeight - 2}
                  textAnchor="middle"
                  fill={day.isToday ? 'var(--color-accent)' : 'var(--color-text-secondary)'}
                  fontSize={10}
                  fontWeight={day.isToday ? 700 : 400}
                >
                  {day.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
