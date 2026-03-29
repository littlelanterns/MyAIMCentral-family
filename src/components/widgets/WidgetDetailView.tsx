// PRD-10 Screen 7: Widget Detail View
// Full-size rendering + interaction controls + history analytics
// Uses ModalV2 with type="transient", size="lg"

import { useState, useMemo, useCallback } from 'react'
import {
  Settings, Trash2, Clock, Plus, Minus, BarChart3, TrendingUp,
  Hash, CircleCheck, Smile, Flame, Hourglass,
} from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'
import { WidgetRenderer } from './WidgetRenderer'
import { useWidgetData } from '@/hooks/useWidgets'
import { ModalV2, Button } from '@/components/shared'

interface WidgetDetailViewProps {
  widget: DashboardWidget
  isOpen: boolean
  onClose: () => void
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  onEdit?: () => void
  onRemove?: () => void
}

const HISTORY_RANGES = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: 'All time', days: 365 },
] as const

type ChartMode = 'bar' | 'line' | 'both'

// Types that have their own interactive controls built into WidgetRenderer
const SELF_INTERACTIVE_TYPES = new Set([
  'checklist', 'multi_habit_grid', 'sequential_path',
  'achievement_badge', 'xp_level', 'allowance_calculator',
  'leaderboard', 'timer_duration', 'snapshot_comparison',
  'color_reveal', 'gameboard',
])

export function WidgetDetailView({
  widget,
  isOpen,
  onClose,
  onRecordData,
  onEdit,
  onRemove,
}: WidgetDetailViewProps) {
  const [historyRange, setHistoryRange] = useState(30)
  const [chartMode, setChartMode] = useState<ChartMode>('bar')
  const [customValue, setCustomValue] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)

  const { data: dataPoints = [] } = useWidgetData(widget.id, { days: historyRange })

  // Compute analytics
  const analytics = useMemo(() => {
    if (dataPoints.length === 0) return null
    const values = dataPoints.map(dp => Number(dp.value))
    const total = values.reduce((sum, v) => sum + v, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    return { total, average, max, min, count: dataPoints.length }
  }, [dataPoints])

  // Group data points by date for the chart
  const chartData = useMemo(() => {
    const grouped = new Map<string, number>()
    for (const dp of dataPoints) {
      const dateKey = dp.recorded_date ?? dp.recorded_at.split('T')[0]
      grouped.set(dateKey, (grouped.get(dateKey) ?? 0) + Number(dp.value))
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }))
  }, [dataPoints])

  const handleRecordCustom = useCallback(() => {
    const val = parseFloat(customValue)
    if (!isNaN(val) && onRecordData) {
      onRecordData(val)
      setCustomValue('')
    }
  }, [customValue, onRecordData])

  const handleRemove = useCallback(() => {
    onRemove?.()
    onClose()
  }, [onRemove, onClose])

  const showTypeSpecificControls = !SELF_INTERACTIVE_TYPES.has(widget.template_type)

  return (
    <ModalV2
      id={`widget-detail-${widget.id}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={widget.title}
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {onRemove && (
              !confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: 'var(--color-error, #ef4444)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  Remove from Dashboard
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Are you sure?
                  </span>
                  <button
                    onClick={handleRemove}
                    className="text-xs font-medium px-2.5 py-1 rounded"
                    style={{
                      background: 'var(--color-error, #ef4444)',
                      color: 'var(--color-bg-card, #fff)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="text-xs font-medium px-2.5 py-1 rounded"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>
          <div>
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <Settings size={14} />
                Edit Widget
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ─── A. Full-size Widget Rendering ────────────────────────── */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            minHeight: 180,
          }}
        >
          <WidgetRenderer
            widget={widget}
            dataPoints={dataPoints}
            onRecordData={onRecordData}
            isCompact={false}
          />
        </div>

        {/* ─── B. Interaction Controls ──────────────────────────────── */}
        {showTypeSpecificControls && onRecordData && (
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <TypeSpecificControls
              trackerType={widget.template_type}
              onRecordData={onRecordData}
              customValue={customValue}
              onCustomValueChange={setCustomValue}
              onRecordCustom={handleRecordCustom}
            />
          </div>
        )}

        {/* ─── C. History Section ───────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              History
            </span>
          </div>

          {/* Time frame selector pills */}
          <div className="flex gap-1.5 mb-4">
            {HISTORY_RANGES.map(range => (
              <button
                key={range.days}
                onClick={() => setHistoryRange(range.days)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: historyRange === range.days
                    ? 'var(--surface-primary)'
                    : 'var(--color-bg-secondary)',
                  color: historyRange === range.days
                    ? 'var(--color-text-on-primary)'
                    : 'var(--color-text-secondary)',
                  border: historyRange === range.days
                    ? 'none'
                    : '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Chart type toggle */}
          <div className="flex gap-1 mb-3">
            {([
              { mode: 'bar' as const, icon: BarChart3, label: 'Bar' },
              { mode: 'line' as const, icon: TrendingUp, label: 'Line' },
              { mode: 'both' as const, icon: BarChart3, label: 'Both' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: chartMode === mode
                    ? 'var(--color-bg-tertiary, var(--color-bg-secondary))'
                    : 'transparent',
                  color: chartMode === mode
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Chart area */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              minHeight: 160,
            }}
          >
            {chartData.length > 0 ? (
              <MiniChart data={chartData} mode={chartMode} />
            ) : (
              <div
                className="flex flex-col items-center justify-center py-6 gap-2"
              >
                <BarChart3 size={28} style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No data for this period
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Record your first entry to see trends here.
                </p>
              </div>
            )}
          </div>

          {/* Summary stats */}
          {analytics && (
            <div
              className="grid grid-cols-2 gap-3 mt-3"
            >
              <StatCard label="Total" value={formatStat(analytics.total)} />
              <StatCard label="Average" value={formatStat(analytics.average)} />
              <StatCard label="Data Points" value={String(analytics.count)} />
              <StatCard label="Best" value={formatStat(analytics.max)} />
            </div>
          )}
        </div>
      </div>
    </ModalV2>
  )
}

// ─── Type-Specific Interaction Controls ───────────────────────────────

function TypeSpecificControls({
  trackerType,
  onRecordData,
  customValue,
  onCustomValueChange,
  onRecordCustom,
}: {
  trackerType: string
  onRecordData: (value: number, metadata?: Record<string, unknown>) => void
  customValue: string
  onCustomValueChange: (v: string) => void
  onRecordCustom: () => void
}) {
  switch (trackerType) {
    case 'tally':
      return <TallyControls onRecordData={onRecordData} customValue={customValue} onCustomValueChange={onCustomValueChange} onRecordCustom={onRecordCustom} />
    case 'boolean_checkin':
      return <BooleanControls onRecordData={onRecordData} />
    case 'mood_rating':
      return <MoodControls onRecordData={onRecordData} />
    case 'streak':
      return <StreakControls onRecordData={onRecordData} />
    case 'countdown':
      return <CountdownInfo />
    case 'percentage':
      return <PercentageControls onRecordData={onRecordData} customValue={customValue} onCustomValueChange={onCustomValueChange} onRecordCustom={onRecordCustom} />
    default:
      return <FallbackControls customValue={customValue} onCustomValueChange={onCustomValueChange} onRecordCustom={onRecordCustom} />
  }
}

function TallyControls({
  onRecordData,
  customValue,
  onCustomValueChange,
  onRecordCustom,
}: {
  onRecordData: (value: number) => void
  customValue: string
  onCustomValueChange: (v: string) => void
  onRecordCustom: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Hash size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Record
        </span>
      </div>

      {/* Quick +1 button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRecordData(1)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          +1
        </button>

        <button
          onClick={() => onRecordData(-1)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          <Minus size={16} />
          -1
        </button>
      </div>

      {/* Custom amount */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={customValue}
          onChange={(e) => onCustomValueChange(e.target.value)}
          placeholder="Custom amount"
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') onRecordCustom() }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onRecordCustom}
          disabled={!customValue || isNaN(parseFloat(customValue))}
        >
          Record
        </Button>
      </div>
    </div>
  )
}

function BooleanControls({ onRecordData }: { onRecordData: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <CircleCheck size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Check In
        </span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onRecordData(1)}
          className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Yes, done today
        </button>
        <button
          onClick={() => onRecordData(0)}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          Not today
        </button>
      </div>
    </div>
  )
}

function MoodControls({ onRecordData }: { onRecordData: (v: number, metadata?: Record<string, unknown>) => void }) {
  const moods = [
    { value: 1, icon: '1', label: 'Awful' },
    { value: 2, icon: '2', label: 'Low' },
    { value: 3, icon: '3', label: 'Okay' },
    { value: 4, icon: '4', label: 'Good' },
    { value: 5, icon: '5', label: 'Great' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Smile size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          How are you feeling?
        </span>
      </div>
      <div className="flex justify-between gap-2">
        {moods.map(mood => (
          <button
            key={mood.value}
            onClick={() => onRecordData(mood.value, { mood_label: mood.label })}
            className="flex flex-col items-center gap-1 flex-1 py-3 rounded-lg transition-colors"
            style={{
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            <span className="text-lg font-bold" style={{ color: 'var(--color-accent, var(--color-text-primary))' }}>
              {mood.icon}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StreakControls({ onRecordData }: { onRecordData: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Flame size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Streak
        </span>
      </div>
      <button
        onClick={() => onRecordData(1)}
        className="w-full py-3 rounded-lg text-sm font-semibold transition-colors"
        style={{
          background: 'var(--surface-primary)',
          color: 'var(--color-text-on-primary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Log Today
      </button>
    </div>
  )
}

function CountdownInfo() {
  return (
    <div className="flex items-center gap-2 py-2">
      <Hourglass size={14} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Countdown trackers update automatically based on the target date.
      </span>
    </div>
  )
}

function PercentageControls({
  onRecordData,
  customValue,
  onCustomValueChange,
  onRecordCustom,
}: {
  onRecordData: (value: number) => void
  customValue: string
  onCustomValueChange: (v: string) => void
  onRecordCustom: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Hash size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Record Percentage
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[25, 50, 75, 100].map(pct => (
          <button
            key={pct}
            onClick={() => onRecordData(pct)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {pct}%
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          value={customValue}
          onChange={(e) => onCustomValueChange(e.target.value)}
          placeholder="Custom %"
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') onRecordCustom() }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onRecordCustom}
          disabled={!customValue || isNaN(parseFloat(customValue))}
        >
          Record
        </Button>
      </div>
    </div>
  )
}

function FallbackControls({
  customValue,
  onCustomValueChange,
  onRecordCustom,
}: {
  customValue: string
  onCustomValueChange: (v: string) => void
  onRecordCustom: () => void
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        Record Value
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={customValue}
          onChange={(e) => onCustomValueChange(e.target.value)}
          placeholder="Enter a value"
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') onRecordCustom() }}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={onRecordCustom}
          disabled={!customValue || isNaN(parseFloat(customValue))}
        >
          Record
        </Button>
      </div>
    </div>
  )
}

// ─── Inline Mini Chart (CSS-only, no external chart lib) ──────────────

function MiniChart({ data, mode }: { data: { date: string; value: number }[]; mode: ChartMode }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const chartHeight = 120

  // Show last N entries to prevent overcrowding
  const displayData = data.length > 30 ? data.slice(-30) : data

  return (
    <div>
      {/* Chart */}
      <div
        className="relative flex items-end gap-px"
        style={{ height: chartHeight }}
      >
        {displayData.map((d, i) => {
          const heightPct = (d.value / maxValue) * 100
          const barWidth = `${100 / displayData.length}%`

          return (
            <div
              key={d.date}
              className="relative flex flex-col items-center justify-end"
              style={{ width: barWidth, height: '100%' }}
            >
              {/* Bar */}
              {(mode === 'bar' || mode === 'both') && (
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(heightPct, 2)}%`,
                    background: 'var(--surface-primary)',
                    opacity: mode === 'both' ? 0.5 : 0.8,
                    minHeight: '2px',
                    maxWidth: '24px',
                    margin: '0 auto',
                  }}
                  title={`${formatDateShort(d.date)}: ${d.value}`}
                />
              )}

              {/* Line dot */}
              {(mode === 'line' || mode === 'both') && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '6px',
                    height: '6px',
                    background: 'var(--color-accent, var(--color-btn-primary-bg))',
                    bottom: `${Math.max(heightPct, 2)}%`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2,
                  }}
                />
              )}

              {/* Line segment connecting to next point */}
              {(mode === 'line' || mode === 'both') && i < displayData.length - 1 && (
                <LineSegment
                  fromPct={(d.value / maxValue) * 100}
                  toPct={(displayData[i + 1].value / maxValue) * 100}
                  chartHeight={chartHeight}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Date labels (show first, middle, last) */}
      {displayData.length > 0 && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {formatDateShort(displayData[0].date)}
          </span>
          {displayData.length > 2 && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatDateShort(displayData[Math.floor(displayData.length / 2)].date)}
            </span>
          )}
          {displayData.length > 1 && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatDateShort(displayData[displayData.length - 1].date)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function LineSegment({ fromPct, toPct, chartHeight }: { fromPct: number; toPct: number; chartHeight: number }) {
  // Approximate the connecting line between two bar chart points using a rotated div
  const fromY = chartHeight * (1 - Math.max(fromPct, 2) / 100)
  const toY = chartHeight * (1 - Math.max(toPct, 2) / 100)
  const dy = toY - fromY
  const angle = Math.atan2(dy, 1) * (180 / Math.PI)

  return (
    <div
      className="absolute"
      style={{
        bottom: `${Math.max(fromPct, 2)}%`,
        left: '50%',
        width: '100%',
        height: '2px',
        background: 'var(--color-accent, var(--color-btn-primary-bg))',
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        opacity: 0.6,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatStat(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
