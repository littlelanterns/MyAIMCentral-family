// PRD-10: Snapshot Comparison tracker — periodic snapshots with personal bests
// Visual variant: record_board (S/M) — personal records display
// Data engine: periodic snapshots with delta/growth calculations

import { useMemo, useState } from 'react'
import { ArrowLeftRight, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function SnapshotComparisonTracker({ widget, dataPoints, onRecordData, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    metric_name?: string
    unit?: string
    snapshot_frequency?: 'weekly' | 'monthly' | 'quarterly'
  }

  const metricName = config.metric_name ?? 'Value'
  const unit = config.unit ?? ''

  // Sort data points chronologically
  const sorted = useMemo(() => {
    return [...dataPoints].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
  }, [dataPoints])

  // Compute records
  const records = useMemo(() => {
    if (sorted.length === 0) return null

    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    const best = sorted.reduce((max, dp) => (Number(dp.value) > Number(max.value) ? dp : max), sorted[0])

    const firstVal = Number(first.value)
    const latestVal = Number(latest.value)
    const delta = latestVal - firstVal
    const percentGrowth = firstVal !== 0 ? ((delta / Math.abs(firstVal)) * 100) : 0

    return { first, latest, best, delta, percentGrowth }
  }, [sorted])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const formatValue = (val: number) => {
    const display = Number.isInteger(val) ? String(val) : val.toFixed(1)
    return unit ? `${display} ${unit}` : display
  }

  // Compact view
  if (isCompact) {
    return (
      <div className="flex flex-col h-full justify-center items-center gap-1">
        <ArrowLeftRight size={16} style={{ color: 'var(--color-accent)' }} />
        {records ? (
          <>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {formatValue(Number(records.latest.value))}
            </span>
            <GrowthIndicator delta={records.delta} percentGrowth={records.percentGrowth} size="small" />
          </>
        ) : (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            No data yet
          </span>
        )}
      </div>
    )
  }

  return (
    <RecordBoard
      records={records}
      metricName={metricName}
      formatDate={formatDate}
      formatValue={formatValue}
      onRecordData={onRecordData}
    />
  )
}

// ── Growth indicator ───────────────────────────────────────

function GrowthIndicator({
  delta,
  percentGrowth,
  size = 'normal',
}: {
  delta: number
  percentGrowth: number
  size?: 'small' | 'normal'
}) {
  const iconSize = size === 'small' ? 12 : 14
  const textClass = size === 'small' ? 'text-xs' : 'text-sm'

  if (delta > 0) {
    return (
      <div className={`flex items-center gap-0.5 ${textClass} font-medium`} style={{ color: 'var(--color-accent)' }}>
        <TrendingUp size={iconSize} />
        <span>+{percentGrowth.toFixed(1)}%</span>
      </div>
    )
  }
  if (delta < 0) {
    return (
      <div className={`flex items-center gap-0.5 ${textClass} font-medium`} style={{ color: 'var(--color-error, #ef4444)' }}>
        <TrendingDown size={iconSize} />
        <span>{percentGrowth.toFixed(1)}%</span>
      </div>
    )
  }
  return (
    <div className={`flex items-center gap-0.5 ${textClass} font-medium`} style={{ color: 'var(--color-text-secondary)' }}>
      <Minus size={iconSize} />
      <span>No change</span>
    </div>
  )
}

// ── Record Board sub-variant ───────────────────────────────

function RecordBoard({
  records,
  metricName,
  formatDate,
  formatValue,
  onRecordData,
}: {
  records: {
    first: { value: number; recorded_at: string }
    latest: { value: number; recorded_at: string }
    best: { value: number; recorded_at: string }
    delta: number
    percentGrowth: number
  } | null
  metricName: string
  formatDate: (d: string) => string
  formatValue: (v: number) => string
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
}) {
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = () => {
    const num = parseFloat(inputValue)
    if (!isNaN(num) && onRecordData) {
      onRecordData(num, { value_type: 'set' })
      setInputValue('')
      setShowInput(false)
    }
  }

  if (!records) {
    return (
      <div className="flex flex-col h-full justify-center items-center gap-3">
        <ArrowLeftRight size={24} style={{ color: 'var(--color-text-secondary)' }} />
        <div className="text-center">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {metricName}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Add your first snapshot
          </div>
        </div>
        {onRecordData && (
          <SnapshotInput
            showInput={showInput}
            setShowInput={setShowInput}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    )
  }

  const cards = [
    { label: 'First Record', value: formatValue(Number(records.first.value)), date: formatDate(records.first.recorded_at) },
    { label: 'Personal Best', value: formatValue(Number(records.best.value)), date: formatDate(records.best.recorded_at) },
    { label: 'Latest', value: formatValue(Number(records.latest.value)), date: formatDate(records.latest.recorded_at) },
  ]

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ArrowLeftRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {metricName}
          </span>
        </div>
        {onRecordData && (
          <button
            onClick={() => setShowInput(!showInput)}
            className="p-1 rounded-full transition-colors"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Record cards */}
      <div className="flex-1 grid grid-cols-2 gap-1.5">
        {cards.map(card => (
          <div
            key={card.label}
            className="rounded-md p-2 flex flex-col justify-center"
            style={{ background: 'var(--color-surface-secondary)' }}
          >
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {card.label}
            </div>
            <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {card.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {card.date}
            </div>
          </div>
        ))}
        {/* Growth card */}
        <div
          className="rounded-md p-2 flex flex-col justify-center"
          style={{ background: 'var(--color-surface-secondary)' }}
        >
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Growth
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {records.delta >= 0 ? '+' : ''}{formatValue(records.delta)}
          </div>
          <GrowthIndicator delta={records.delta} percentGrowth={records.percentGrowth} size="small" />
        </div>
      </div>

      {/* Snapshot input */}
      {showInput && onRecordData && (
        <SnapshotInput
          showInput={showInput}
          setShowInput={setShowInput}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ── Snapshot Input ──────────────────────────────────────────

function SnapshotInput({
  showInput,
  setShowInput: _setShowInput,
  inputValue,
  setInputValue,
  onSubmit,
}: {
  showInput: boolean
  setShowInput: (v: boolean) => void
  inputValue: string
  setInputValue: (v: string) => void
  onSubmit: () => void
}) {
  if (!showInput) return null

  return (
    <div className="flex gap-1.5 items-center">
      <input
        type="number"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder="Value"
        className="flex-1 px-2 py-1 text-sm rounded-md"
        style={{
          background: 'var(--color-surface-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
        autoFocus
      />
      <button
        onClick={onSubmit}
        className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Save
      </button>
    </div>
  )
}
