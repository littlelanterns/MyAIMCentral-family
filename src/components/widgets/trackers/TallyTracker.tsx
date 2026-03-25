// PRD-10: Tally tracker — count anything (books, water, practice sessions)
// Visual variants: progress_bar, donut_ring, star_chart, animated_star_chart,
//   thermometer, coin_jar, bar_chart_history, bubble_fill, tally_marks,
//   pixel_art_grid, garden_growth, fuel_gauge

import { useMemo } from 'react'
import { Hash, Plus, Star } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

export function TallyTracker({ widget, dataPoints, onRecordData, variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    target_number?: number
    measurement_unit?: string
    title?: string
  }
  const target = config.target_number ?? 0
  const unit = config.measurement_unit ?? 'items'

  const totalValue = useMemo(() => {
    return dataPoints.reduce((sum, dp) => sum + Number(dp.value), 0)
  }, [dataPoints])

  const percentage = target > 0 ? Math.min((totalValue / target) * 100, 100) : 0

  const handleIncrement = () => {
    onRecordData?.(1, { unit })
  }

  // Star chart variant
  if (variant === 'star_chart' || variant === 'animated_star_chart') {
    return <StarChartVariant total={totalValue} target={target} unit={unit} onIncrement={handleIncrement} isCompact={isCompact} />
  }

  // Donut ring variant
  if (variant === 'donut_ring') {
    return <DonutVariant total={totalValue} target={target} percentage={percentage} unit={unit} onIncrement={handleIncrement} isCompact={isCompact} />
  }

  // Default: progress bar
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <Hash size={14} />
          <span>{unit}</span>
        </div>
        {!isCompact && onRecordData && (
          <button
            onClick={handleIncrement}
            className="p-1 rounded-full transition-colors"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {totalValue}
          {target > 0 && (
            <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
              {' '}/ {target}
            </span>
          )}
        </div>

        {target > 0 && (
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: 'var(--surface-primary)',
              }}
            />
          </div>
        )}
      </div>

      {isCompact && onRecordData && (
        <button
          onClick={handleIncrement}
          className="mt-1 p-1 rounded-full self-end transition-colors"
          style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  )
}

// ── Star Chart sub-variant ──────────────────────────────────

function StarChartVariant({
  total,
  target,
  unit,
  onIncrement,
  isCompact,
}: {
  total: number
  target: number
  unit: string
  onIncrement: () => void
  isCompact?: boolean
}) {
  const starsPerRow = 5
  const starCount = target > 0 ? target : 20
  const rows = Math.ceil(starCount / starsPerRow)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {total} / {starCount} {unit}
        </span>
        {onIncrement && (
          <button
            onClick={onIncrement}
            className="p-1 rounded-full transition-colors"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            <Plus size={isCompact ? 12 : 14} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center gap-0.5">
        {Array.from({ length: isCompact ? Math.min(rows, 3) : rows }, (_, rowIdx) => (
          <div key={rowIdx} className="flex gap-0.5 justify-center">
            {Array.from({ length: starsPerRow }, (_, colIdx) => {
              const starIdx = rowIdx * starsPerRow + colIdx
              if (starIdx >= starCount) return null
              const filled = starIdx < total
              return (
                <Star
                  key={starIdx}
                  size={isCompact ? 14 : 18}
                  fill={filled ? 'var(--color-accent)' : 'none'}
                  stroke={filled ? 'var(--color-accent)' : 'var(--color-border-default)'}
                  className={filled ? 'transition-all duration-300' : ''}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut Ring sub-variant ──────────────────────────────────

function DonutVariant({
  total,
  target,
  percentage,
  unit,
  onIncrement,
  isCompact,
}: {
  total: number
  target: number
  percentage: number
  unit: string
  onIncrement: () => void
  isCompact?: boolean
}) {
  const size = isCompact ? 60 : 80
  const strokeWidth = isCompact ? 6 : 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center h-full justify-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-default)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="text-center">
        <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {total}{target > 0 ? `/${target}` : ''}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{unit}</div>
      </div>
      {onIncrement && (
        <button
          onClick={onIncrement}
          className="p-1 rounded-full transition-colors"
          style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
        >
          <Plus size={isCompact ? 12 : 14} />
        </button>
      )}
    </div>
  )
}
