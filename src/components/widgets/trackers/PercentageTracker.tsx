// PRD-10: Percentage tracker — completion percentage display
// Visual variants: donut_ring, progress_bar, responsibility_gauge, battery,
//   donut_completion, thermometer
// Used for chore completion → allowance wiring (PRD-28 stub)

import { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'
import { todayLocalIso } from '@/utils/dates'

export function PercentageTracker({ widget, dataPoints, onRecordData: _onRecordData, variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    goal_percentage?: number
    calculation_source?: string
    connect_to_allowance?: boolean
  }
  const goal = config.goal_percentage ?? 100

  // Latest percentage value (most recent 'set' type data point)
  const currentPercentage = useMemo(() => {
    const setPoints = dataPoints.filter(dp => dp.value_type === 'percentage' || dp.value_type === 'set')
    if (setPoints.length > 0) {
      return Number(setPoints[setPoints.length - 1].value)
    }
    // Fall back to computing from boolean data points
    const today = todayLocalIso()
    const todayPoints = dataPoints.filter(dp => dp.recorded_date === today)
    if (todayPoints.length === 0) return 0
    const completed = todayPoints.filter(dp => Number(dp.value) > 0).length
    return Math.round((completed / todayPoints.length) * 100)
  }, [dataPoints])

  const progressRatio = Math.min(currentPercentage / goal, 1)

  // Donut variant
  if (variant === 'donut_ring' || variant === 'donut_completion') {
    return <DonutPercentage percentage={currentPercentage} goal={goal} isCompact={isCompact} />
  }

  // Battery variant
  if (variant === 'battery') {
    return <BatteryPercentage percentage={currentPercentage} goal={goal} isCompact={isCompact} />
  }

  // Thermometer meter variant
  if (variant === 'thermometer') {
    return <ThermometerPercentage percentage={currentPercentage} goal={goal} isCompact={isCompact} />
  }

  // Responsibility gauge variant
  if (variant === 'responsibility_gauge') {
    return <ResponsibilityGauge percentage={currentPercentage} isCompact={isCompact} />
  }

  // Default: horizontal progress bar
  return (
    <div className="flex flex-col h-full justify-center gap-2">
      <div className="flex items-center justify-between">
        <PieChart size={14} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {currentPercentage}%
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border-default)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progressRatio * 100}%`,
            background: currentPercentage >= goal
              ? 'var(--color-accent)'
              : 'var(--surface-primary)',
          }}
        />
      </div>

      {!isCompact && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Goal: {goal}%
        </div>
      )}
    </div>
  )
}

// ── Donut sub-variant ───────────────────────────────────────

function DonutPercentage({ percentage, goal, isCompact }: { percentage: number; goal: number; isCompact?: boolean }) {
  const size = isCompact ? 64 : 88
  const strokeWidth = isCompact ? 7 : 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(percentage / goal, 1)
  const offset = circumference - ratio * circumference

  return (
    <div className="flex flex-col items-center h-full justify-center gap-1">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--color-border-default)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={percentage >= goal ? 'var(--color-accent)' : 'var(--color-accent)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {percentage}%
          </span>
        </div>
      </div>
      {!isCompact && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          of {goal}% goal
        </div>
      )}
    </div>
  )
}

// ── Battery sub-variant ─────────────────────────────────────

function BatteryPercentage({ percentage, goal, isCompact }: { percentage: number; goal: number; isCompact?: boolean }) {
  const ratio = Math.min(percentage / goal, 1)
  const height = isCompact ? 48 : 72

  return (
    <div className="flex flex-col items-center h-full justify-center gap-2">
      <div
        className="relative rounded-md border-2 overflow-hidden"
        style={{
          width: isCompact ? 28 : 36,
          height,
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Battery cap */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-t-sm"
          style={{
            width: isCompact ? 12 : 16,
            height: 4,
            background: 'var(--color-border-default)',
          }}
        />
        {/* Fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700"
          style={{
            height: `${ratio * 100}%`,
            background: ratio > 0.6 ? 'var(--color-accent)' : ratio > 0.3 ? 'var(--color-warning, orange)' : 'var(--color-error, red)',
          }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {percentage}%
      </span>
    </div>
  )
}

// ── Thermometer Meter sub-variant ──────────────────────────

function ThermometerPercentage({ percentage, goal, isCompact }: { percentage: number; goal: number; isCompact?: boolean }) {
  const ratio = Math.min(percentage / goal, 1)
  const svgHeight = isCompact ? 80 : 130
  const svgWidth = isCompact ? 40 : 56

  // Tube dimensions
  const tubeWidth = isCompact ? 16 : 22
  const tubeX = (svgWidth - tubeWidth) / 2
  const bulbRadius = tubeWidth * 0.7
  const tubeTop = 8
  const tubeBottom = svgHeight - bulbRadius - 6
  const tubeHeight = tubeBottom - tubeTop
  const fillHeight = tubeHeight * ratio

  // Tick marks
  const ticks = [0, 25, 50, 75, 100]
  const tickX = tubeX - 4
  const goalTick = goal !== 100 ? goal : null

  return (
    <div className="flex flex-col items-center h-full justify-center gap-1">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Tube background */}
        <rect
          x={tubeX}
          y={tubeTop}
          width={tubeWidth}
          height={tubeHeight}
          rx={tubeWidth / 2}
          fill="var(--color-surface-secondary)"
          stroke="var(--color-border-default)"
          strokeWidth={1.5}
        />

        {/* Tube fill from bottom */}
        {fillHeight > 0 && (
          <rect
            x={tubeX + 1.5}
            y={tubeBottom - fillHeight}
            width={tubeWidth - 3}
            height={fillHeight}
            rx={(tubeWidth - 3) / 2}
            fill="var(--color-accent)"
            className="transition-all duration-700"
          />
        )}

        {/* Bulb at bottom */}
        <circle
          cx={svgWidth / 2}
          cy={tubeBottom + bulbRadius * 0.3}
          r={bulbRadius}
          fill={ratio > 0 ? 'var(--color-accent)' : 'var(--color-surface-secondary)'}
          stroke="var(--color-border-default)"
          strokeWidth={1.5}
          className="transition-all duration-700"
        />

        {/* Tick marks on the left side */}
        {ticks.map(tick => {
          const y = tubeBottom - (tick / 100) * tubeHeight
          return (
            <g key={tick}>
              <line
                x1={tickX - 3}
                y1={y}
                x2={tickX}
                y2={y}
                stroke="var(--color-text-secondary)"
                strokeWidth={1}
                opacity={0.5}
              />
              {!isCompact && (
                <text
                  x={tickX - 5}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--color-text-secondary)"
                  fontSize={8}
                  opacity={0.6}
                >
                  {tick}%
                </text>
              )}
            </g>
          )
        })}

        {/* Goal line with star marker */}
        {goalTick != null && (
          <g>
            <line
              x1={tubeX + tubeWidth + 2}
              y1={tubeBottom - (goalTick / 100) * tubeHeight}
              x2={tubeX + tubeWidth + 8}
              y2={tubeBottom - (goalTick / 100) * tubeHeight}
              stroke="var(--color-accent)"
              strokeWidth={1.5}
            />
            {/* Star marker */}
            <polygon
              points={starPoints(tubeX + tubeWidth + 13, tubeBottom - (goalTick / 100) * tubeHeight, 5)}
              fill="var(--color-accent)"
            />
          </g>
        )}
      </svg>

      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {percentage}%
      </span>
      {!isCompact && (
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Goal: {goal}%
        </span>
      )}
    </div>
  )
}

/** Generate SVG polygon points for a 5-pointed star */
function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4
    const angle = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

// ── Responsibility Gauge sub-variant ───────────────────────

function ResponsibilityGauge({ percentage, isCompact }: { percentage: number; isCompact?: boolean }) {
  const svgSize = isCompact ? 80 : 140
  const cx = svgSize / 2
  const cy = isCompact ? svgSize * 0.55 : svgSize * 0.52
  const radius = isCompact ? 30 : 54
  const strokeWidth = isCompact ? 8 : 12

  // Semicircular arc from 180deg (left) to 0deg (right)
  const startAngle = Math.PI // 180 degrees
  const endAngle = 0 // 0 degrees
  const totalAngle = startAngle - endAngle // PI radians
  const arcLength = totalAngle * radius

  // Needle angle: percentage maps from 180deg (0%) to 0deg (100%)
  const clampedPct = Math.min(Math.max(percentage, 0), 100)
  const needleAngle = startAngle - (clampedPct / 100) * totalAngle

  // Zone boundaries (as fractions of the arc)
  const zones = [
    { start: 0, end: 0.4, color: 'var(--color-error, #ef4444)' },       // 0-40%
    { start: 0.4, end: 0.7, color: 'var(--color-warning, #f59e0b)' },    // 40-70%
    { start: 0.7, end: 1.0, color: 'var(--color-accent)' },              // 70-100%
  ]

  // Arc path builder
  const arcPath = (startFrac: number, endFrac: number) => {
    const a1 = startAngle - startFrac * totalAngle
    const a2 = startAngle - endFrac * totalAngle
    const x1 = cx + radius * Math.cos(a1)
    const y1 = cy - radius * Math.sin(a1)
    const x2 = cx + radius * Math.cos(a2)
    const y2 = cy - radius * Math.sin(a2)
    const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`
  }

  // Needle endpoint
  const needleLength = radius - strokeWidth / 2 - 4
  const needleX = cx + needleLength * Math.cos(needleAngle)
  const needleY = cy - needleLength * Math.sin(needleAngle)

  // Suppress unused variable warning
  void arcLength

  return (
    <div className="flex flex-col items-center h-full justify-center">
      <svg
        width={svgSize}
        height={isCompact ? svgSize * 0.65 : svgSize * 0.6}
        viewBox={`0 0 ${svgSize} ${isCompact ? svgSize * 0.65 : svgSize * 0.6}`}
      >
        {/* Background arc */}
        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="var(--color-border-default)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored zone arcs */}
        {zones.map((zone, i) => (
          <path
            key={i}
            d={arcPath(zone.start, zone.end)}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap={i === 0 || i === zones.length - 1 ? 'round' : 'butt'}
            opacity={0.85}
          />
        ))}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="var(--color-text-primary)"
          strokeWidth={isCompact ? 1.5 : 2.5}
          strokeLinecap="round"
          className="transition-all duration-700"
        />

        {/* Center pivot dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isCompact ? 3 : 5}
          fill="var(--color-text-primary)"
        />
      </svg>

      {/* Large percentage number below the arc */}
      <div
        className={`font-bold ${isCompact ? 'text-lg -mt-1' : 'text-2xl -mt-2'}`}
        style={{ color: 'var(--color-text-primary)' }}
      >
        {percentage}%
      </div>
    </div>
  )
}
