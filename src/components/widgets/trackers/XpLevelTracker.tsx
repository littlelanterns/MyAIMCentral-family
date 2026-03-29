// PRD-10: XP & Level tracker — earn XP points, level up with visual shield
// Visual variants: shield_bar (default), character_levelup, rank_badge

import { useMemo } from 'react'
import { Zap, Plus } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

const DEFAULT_THRESHOLDS = [100, 250, 500, 1000, 2000]

export function XpLevelTracker({ widget, dataPoints, onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    level_thresholds?: number[]
    xp_increment?: number
    title?: string
  }

  const thresholds = config.level_thresholds && config.level_thresholds.length > 0
    ? config.level_thresholds
    : DEFAULT_THRESHOLDS
  const xpIncrement = config.xp_increment ?? 10

  const totalXp = useMemo(() => {
    return dataPoints.reduce((sum, dp) => sum + Number(dp.value), 0)
  }, [dataPoints])

  // Determine current level (0-indexed into thresholds)
  const currentLevel = useMemo(() => {
    let level = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (totalXp >= thresholds[i]) {
        level = i + 1
      } else {
        break
      }
    }
    return level
  }, [totalXp, thresholds])

  const isMaxLevel = currentLevel >= thresholds.length

  // XP progress within current level
  const prevThreshold = currentLevel > 0 ? thresholds[currentLevel - 1] : 0
  const nextThreshold = isMaxLevel ? thresholds[thresholds.length - 1] : thresholds[currentLevel]
  const xpInLevel = totalXp - prevThreshold
  const xpNeeded = nextThreshold - prevThreshold
  const progressPercent = isMaxLevel ? 100 : xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0
  const xpRemaining = isMaxLevel ? 0 : nextThreshold - totalXp

  const handleAddXp = () => {
    onRecordData?.(xpIncrement, { xp_increment: xpIncrement })
  }

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 h-full w-full justify-center">
        <ShieldIcon level={currentLevel} size={24} />
        <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Lv.{currentLevel}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {/* Shield with level */}
      <ShieldIcon level={currentLevel} size={64} />

      {/* XP info */}
      <div className="text-center">
        <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Level {currentLevel}
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {totalXp.toLocaleString()} XP total
        </div>
      </div>

      {/* XP progress bar */}
      <div className="w-full max-w-[180px]">
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: 'var(--color-border-default)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--color-accent)',
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            {isMaxLevel ? 'MAX' : `${xpInLevel}/${xpNeeded}`}
          </span>
          {!isMaxLevel && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {xpRemaining} to next
            </span>
          )}
        </div>
      </div>

      {/* +XP button */}
      {onRecordData && (
        <button
          onClick={handleAddXp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{
            background: 'var(--surface-primary)',
            color: 'var(--color-text-on-primary)',
          }}
        >
          <Plus size={12} />
          <span>+{xpIncrement} XP</span>
        </button>
      )}
    </div>
  )
}

// ── Shield SVG Icon ──────────────────────────────────

function ShieldIcon({ level, size }: { level: number; size: number }) {
  const half = size / 2
  const shieldHeight = size * 0.9
  const shieldWidth = size * 0.75

  // Shield path: pointed bottom, rounded top
  const sx = half - shieldWidth / 2
  const ex = half + shieldWidth / 2
  const topY = size * 0.08
  const midY = size * 0.55
  const bottomY = shieldHeight

  const pathD = [
    `M ${sx} ${topY + 8}`,
    `Q ${sx} ${topY}, ${half} ${topY}`,
    `Q ${ex} ${topY}, ${ex} ${topY + 8}`,
    `L ${ex} ${midY}`,
    `Q ${ex} ${bottomY * 0.8}, ${half} ${bottomY}`,
    `Q ${sx} ${bottomY * 0.8}, ${sx} ${midY}`,
    'Z',
  ].join(' ')

  // Font size proportional to shield
  const fontSize = size * 0.32
  const labelSize = size * 0.14

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Shield outline */}
      <path
        d={pathD}
        fill="var(--color-accent)"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
      />

      {/* Inner shield highlight */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-text-on-primary)"
        strokeWidth="1"
        opacity="0.3"
        transform={`translate(${size * 0.03}, ${size * 0.03}) scale(0.92)`}
        style={{ transformOrigin: 'center' }}
      />

      {/* Level number */}
      <text
        x={half}
        y={half + fontSize * 0.15}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="800"
        fill="var(--color-text-on-primary)"
      >
        {level}
      </text>

      {/* XP icon at top */}
      <Zap
        x={half - labelSize / 2}
        y={topY + 2}
        size={labelSize}
        style={{ color: 'var(--color-text-on-primary)' }}
      />
    </svg>
  )
}
