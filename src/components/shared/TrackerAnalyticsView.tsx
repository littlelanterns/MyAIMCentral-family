/**
 * TrackerAnalyticsView — Reusable Analytics Chart Component
 *
 * Renders bar, line, or combined charts using recharts.
 * Consumes the --color-chart-* CSS variables for series coloring.
 * Supports time frame switching, chart type toggling, goal lines,
 * average lines, totals, and compact mode for widget cards.
 *
 * Zero hardcoded colors — all theme-aware via CSS custom properties.
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

// ---------- palette ----------

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
]

const CHART_COLOR_FALLBACKS = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
]

// ---------- types ----------

export interface TrackerAnalyticsDataSeries {
  id: string
  label: string
  color: string
  dataPoints: { date: string; value: number }[]
}

export interface TrackerAnalyticsViewProps {
  dataSeries: TrackerAnalyticsDataSeries[]
  timeFrame: 'day' | 'week' | 'month' | 'custom'
  customRange?: { start: string; end: string }
  onTimeFrameChange?: (tf: 'day' | 'week' | 'month' | 'custom') => void
  chartType: 'bar' | 'line' | 'both'
  onChartTypeChange?: (ct: 'bar' | 'line' | 'both') => void
  showAverage?: boolean
  showTotal?: boolean
  goalLine?: number
  compact?: boolean
}

// ---------- helpers ----------

/** Resolve a CSS variable to a hex fallback for SVG rendering */
function resolveColor(color: string, index: number): string {
  // If it's already a hex/rgb color, use it directly
  if (!color || !color.startsWith('var(')) {
    return color || CHART_COLOR_FALLBACKS[index % CHART_COLOR_FALLBACKS.length]
  }
  // For CSS variables, try to resolve from the DOM; fall back to the known palette
  if (typeof window !== 'undefined') {
    const varName = color.replace(/^var\(/, '').replace(/\)$/, '')
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
    if (resolved) return resolved
  }
  return CHART_COLOR_FALLBACKS[index % CHART_COLOR_FALLBACKS.length]
}

function formatDateLabel(dateStr: string, timeFrame: 'day' | 'week' | 'month' | 'custom'): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr

  if (timeFrame === 'day') {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  if (timeFrame === 'week') {
    return d.toLocaleDateString(undefined, { weekday: 'short' })
  }
  if (timeFrame === 'month') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  // custom — show short month + day
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ---------- sub-components ----------

interface PillGroupProps<T extends string> {
  options: { value: T; label: string }[]
  active: T
  onChange: (v: T) => void
}

function PillGroup<T extends string>({ options, active, onChange }: PillGroupProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: active === o.value ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
            color: active === o.value ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
            border: active === o.value ? 'none' : '1px solid var(--color-border-default)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---------- tooltip ----------

interface CustomTooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: CustomTooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-default)',
        color: 'var(--color-text-primary)',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------- legend ----------

interface CustomLegendPayloadEntry {
  value: string
  color: string
}

interface CustomLegendProps {
  payload?: CustomLegendPayloadEntry[]
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------- main component ----------

export function TrackerAnalyticsView({
  dataSeries,
  timeFrame,
  onTimeFrameChange,
  chartType,
  onChartTypeChange,
  showAverage = false,
  showTotal = false,
  goalLine,
  compact = false,
}: TrackerAnalyticsViewProps) {
  // Resolve series colors for SVG
  const resolvedSeries = useMemo(
    () =>
      dataSeries.map((s, i) => ({
        ...s,
        resolvedColor: resolveColor(
          s.color || CHART_COLORS[i % CHART_COLORS.length],
          i,
        ),
      })),
    [dataSeries],
  )

  // Merge all data points into a single array keyed by date
  const mergedData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>()

    for (const series of resolvedSeries) {
      for (const dp of series.dataPoints) {
        if (!dateMap.has(dp.date)) {
          dateMap.set(dp.date, {
            date: dp.date,
            dateLabel: formatDateLabel(dp.date, timeFrame),
          })
        }
        const row = dateMap.get(dp.date)!
        row[series.id] = dp.value
      }
    }

    // Sort by date ascending
    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    )
  }, [resolvedSeries, timeFrame])

  // Calculate average across all series and all visible data points
  const averageValue = useMemo(() => {
    if (!showAverage) return 0
    let sum = 0
    let count = 0
    for (const series of resolvedSeries) {
      for (const dp of series.dataPoints) {
        sum += dp.value
        count++
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) / 100 : 0
  }, [resolvedSeries, showAverage])

  // Calculate total
  const totalValue = useMemo(() => {
    if (!showTotal) return 0
    let sum = 0
    for (const series of resolvedSeries) {
      for (const dp of series.dataPoints) {
        sum += dp.value
      }
    }
    return Math.round(sum * 100) / 100
  }, [resolvedSeries, showTotal])

  // Check if there is any data at all
  const hasData = resolvedSeries.some((s) => s.dataPoints.length > 0)

  // Shared axis and reference elements
  const gridColor = 'var(--color-border-default)'
  const tickStyle = { fill: 'var(--color-text-secondary)', fontSize: compact ? 10 : 12 }
  const chartHeight = compact ? 120 : 280
  const xTickInterval = compact ? Math.max(0, Math.floor(mergedData.length / 4) - 1) : 0

  // Build the inner chart elements (bars/lines) for reuse across chart types
  function renderBars() {
    return resolvedSeries.map((s) => (
      <Bar
        key={s.id}
        dataKey={s.id}
        name={s.label}
        fill={s.resolvedColor}
        radius={[2, 2, 0, 0]}
        maxBarSize={compact ? 16 : 32}
      />
    ))
  }

  function renderLines() {
    return resolvedSeries.map((s) => (
      <Line
        key={s.id}
        type="monotone"
        dataKey={s.id}
        name={s.label}
        stroke={s.resolvedColor}
        strokeWidth={2}
        dot={compact ? false : { r: 3, fill: s.resolvedColor }}
        activeDot={{ r: 5 }}
      />
    ))
  }

  function renderReferenceLines() {
    return (
      <>
        {goalLine != null && (
          <ReferenceLine
            y={goalLine}
            stroke="var(--color-text-secondary)"
            strokeDasharray="6 3"
            label={compact ? undefined : { value: `Goal: ${goalLine}`, fill: 'var(--color-text-secondary)', fontSize: 11, position: 'right' }}
          />
        )}
        {showAverage && averageValue > 0 && (
          <ReferenceLine
            y={averageValue}
            stroke="var(--color-text-tertiary, var(--color-text-secondary))"
            strokeDasharray="4 4"
            label={compact ? undefined : { value: `Avg: ${averageValue}`, fill: 'var(--color-text-secondary)', fontSize: 11, position: 'left' }}
          />
        )}
      </>
    )
  }

  function renderChart() {
    const commonProps = {
      data: mergedData,
      margin: compact
        ? { top: 4, right: 4, bottom: 0, left: -16 }
        : { top: 8, right: 16, bottom: 4, left: 0 },
    }

    const xAxisProps = {
      dataKey: 'dateLabel' as const,
      tick: tickStyle,
      tickLine: false,
      axisLine: false,
      interval: xTickInterval,
    }

    const yAxisProps = {
      tick: tickStyle,
      tickLine: false,
      axisLine: false,
      width: compact ? 28 : 40,
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <RechartsTooltip content={<CustomTooltip />} />
          {!compact && <Legend content={<CustomLegend />} />}
          {renderReferenceLines()}
          {renderBars()}
        </BarChart>
      )
    }

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <RechartsTooltip content={<CustomTooltip />} />
          {!compact && <Legend content={<CustomLegend />} />}
          {renderReferenceLines()}
          {renderLines()}
        </LineChart>
      )
    }

    // 'both' — ComposedChart with bars + line overlay
    return (
      <ComposedChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <RechartsTooltip content={<CustomTooltip />} />
        {!compact && <Legend content={<CustomLegend />} />}
        {renderReferenceLines()}
        {renderBars()}
        {renderLines()}
      </ComposedChart>
    )
  }

  // ---------- render ----------

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Controls row */}
      {(onTimeFrameChange || onChartTypeChange) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onTimeFrameChange && (
            <PillGroup
              options={[
                { value: 'day' as const, label: 'Day' },
                { value: 'week' as const, label: 'Week' },
                { value: 'month' as const, label: 'Month' },
              ]}
              active={timeFrame}
              onChange={onTimeFrameChange}
            />
          )}
          {onChartTypeChange && (
            <PillGroup
              options={[
                { value: 'bar' as const, label: 'Bar' },
                { value: 'line' as const, label: 'Line' },
                { value: 'both' as const, label: 'Both' },
              ]}
              active={chartType}
              onChange={onChartTypeChange}
            />
          )}
        </div>
      )}

      {/* Chart or empty state */}
      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center gap-2"
          style={{
            height: chartHeight,
            color: 'var(--color-text-secondary)',
          }}
        >
          <BarChart3 size={compact ? 20 : 28} />
          <span className={compact ? 'text-xs' : 'text-sm'}>No data yet</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderChart()}
        </ResponsiveContainer>
      )}

      {/* Total display (hidden in compact mode) */}
      {showTotal && hasData && !compact && (
        <div
          className="text-sm font-medium text-right pr-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Total: {totalValue}
        </div>
      )}
    </div>
  )
}
