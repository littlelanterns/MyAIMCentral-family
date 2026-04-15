// PRD-10: Tally tracker — count anything (books, water, practice sessions)
// Visual variants: progress_bar, donut_ring, star_chart, animated_star_chart,
//   thermometer, coin_jar, bar_chart_history, bubble_fill, tally_marks,
//   pixel_art_grid, garden_growth, fuel_gauge

import { useMemo, useState, useEffect } from 'react'
import { Hash, Plus, Star, Heart, Droplets, Flower2, Zap, Trophy, Smile, Sun, Moon, Gem, Check } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

// ── Sticker icon registry ──────────────────────────────────

export const STICKER_ICONS = [
  { key: 'star', label: 'Stars', icon: Star },
  { key: 'heart', label: 'Hearts', icon: Heart },
  { key: 'droplet', label: 'Water Drops', icon: Droplets },
  { key: 'flower', label: 'Flowers', icon: Flower2 },
  { key: 'zap', label: 'Lightning', icon: Zap },
  { key: 'trophy', label: 'Trophies', icon: Trophy },
  { key: 'smile', label: 'Smileys', icon: Smile },
  { key: 'sun', label: 'Suns', icon: Sun },
  { key: 'moon', label: 'Moons', icon: Moon },
  { key: 'gem', label: 'Gems', icon: Gem },
  { key: 'check', label: 'Checkmarks', icon: Check },
] as const

export type StickerIconKey = typeof STICKER_ICONS[number]['key']

export const STICKER_COLOR_PRESETS = [
  { key: 'rainbow', label: 'Rainbow', colors: ['#f3a6a0', '#f9c396', '#f3d188', '#a8d5a2', '#8dc5e0', '#b8a9d4', '#f0a8c8'] },
  { key: 'warm', label: 'Warm Sunset', colors: ['#f8d6d0', '#f3a6a0', '#f9c396', '#fae49b', '#f3d188'] },
  { key: 'cool', label: 'Cool Ocean', colors: ['#c5e3f0', '#8dc5e0', '#6fa8c9', '#b8a9d4', '#a8d5a2'] },
  { key: 'pink', label: 'Pink Party', colors: ['#fce4ec', '#f8bbd0', '#f48fb1', '#f06292', '#ec407a'] },
  { key: 'gold', label: 'Gold Stars', colors: ['#fdf4db', '#fae49b', '#f3d188', '#d4b063', '#c9a040'] },
  { key: 'green', label: 'Forest', colors: ['#e8f5e9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50'] },
  { key: 'mono', label: 'One Color', colors: ['var(--color-accent)'] },
] as const

export type StickerColorPresetKey = typeof STICKER_COLOR_PRESETS[number]['key']

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

  // Sticker grid variant
  if (variant === 'animated_sticker_grid' || variant === 'sticker_board') {
    const stickerIcon = (config as Record<string, unknown>).sticker_icon as StickerIconKey | undefined
    const stickerColorPreset = (config as Record<string, unknown>).sticker_color_preset as StickerColorPresetKey | undefined
    return (
      <StickerGridVariant
        total={totalValue}
        target={target}
        unit={unit}
        onIncrement={handleIncrement}
        isCompact={isCompact}
        iconKey={stickerIcon ?? 'star'}
        colorPreset={stickerColorPreset ?? 'rainbow'}
      />
    )
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

// ── Sticker Grid sub-variant ──────────────────────────────

function StickerGridVariant({
  total,
  target,
  unit,
  onIncrement,
  isCompact,
  iconKey,
  colorPreset,
}: {
  total: number
  target: number
  unit: string
  onIncrement: () => void
  isCompact?: boolean
  iconKey: StickerIconKey
  colorPreset: StickerColorPresetKey
}) {
  const [justAdded, setJustAdded] = useState<number | null>(null)
  const [prevTotal, setPrevTotal] = useState(total)

  // Detect when a new sticker is added to trigger pop animation
  useEffect(() => {
    if (total > prevTotal && total > 0) {
      setJustAdded(total - 1)
      const timer = setTimeout(() => setJustAdded(null), 600)
      setPrevTotal(total)
      return () => clearTimeout(timer)
    }
    setPrevTotal(total)
  }, [total, prevTotal])

  const IconComponent = STICKER_ICONS.find(s => s.key === iconKey)?.icon ?? Star
  const preset = STICKER_COLOR_PRESETS.find(p => p.key === colorPreset) ?? STICKER_COLOR_PRESETS[0]
  const colors = preset.colors

  const cellCount = target > 0 ? target : 20
  const cols = isCompact ? 5 : cellCount <= 10 ? 5 : cellCount <= 20 ? 5 : 6
  const iconSize = isCompact ? 16 : cellCount > 25 ? 16 : 20

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {total} / {cellCount} {unit}
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

      <div
        className="flex-1 grid gap-1 place-items-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          alignContent: 'center',
        }}
      >
        {Array.from({ length: isCompact ? Math.min(cellCount, 15) : cellCount }, (_, idx) => {
          const filled = idx < total
          const isNew = idx === justAdded
          const color = colors[idx % colors.length]

          return (
            <div
              key={idx}
              className="flex items-center justify-center transition-all"
              style={{
                width: iconSize + 6,
                height: iconSize + 6,
                borderRadius: 'var(--vibe-radius-input, 6px)',
                backgroundColor: filled
                  ? `color-mix(in srgb, ${color} 18%, transparent)`
                  : 'var(--color-bg-secondary)',
                border: filled
                  ? `1.5px solid ${color}`
                  : '1.5px dashed var(--color-border)',
                animation: isNew ? 'stickerPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
                transform: isNew ? 'scale(0)' : undefined,
              }}
            >
              {filled ? (
                <IconComponent
                  size={iconSize}
                  fill={color}
                  stroke={color}
                  strokeWidth={1.5}
                />
              ) : (
                <div
                  style={{
                    width: iconSize * 0.4,
                    height: iconSize * 0.4,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-border)',
                    opacity: 0.3,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {total >= cellCount && cellCount > 0 && (
        <div
          className="text-center text-xs font-semibold mt-2 py-1 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          Goal reached!
        </div>
      )}

      <style>{`
        @keyframes stickerPop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
          75% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
