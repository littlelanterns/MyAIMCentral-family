// PRD-10: Mood Rating tracker — scale-based daily check-in
// Visual variants: emoji_row_trend, color_gradient, weather_metaphor, number_scale
// Uses Lucide icons (NOT emoji) per convention

import { useMemo } from 'react'
import { Frown, Annoyed, Meh, Smile, Laugh } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'
import { todayLocalIso, localIso } from '@/utils/dates'


const MOOD_ICONS = [
  { Icon: Frown, label: 'Rough' },
  { Icon: Annoyed, label: 'Low' },
  { Icon: Meh, label: 'Okay' },
  { Icon: Smile, label: 'Good' },
  { Icon: Laugh, label: 'Great' },
]

function getTodayStr(): string {
  return todayLocalIso()
}

function getLast7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(localIso(d))
  }
  return days
}

export function MoodRatingTracker({
  dataPoints,
  onRecordData,
  isCompact,
}: TrackerProps) {
  const todayStr = getTodayStr()

  // Today's mood = most recent data point for today
  const todayMood = useMemo(() => {
    const todayPoints = dataPoints
      .filter(dp => dp.recorded_date === todayStr)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

    return todayPoints.length > 0 ? Math.round(todayPoints[0].value) : null
  }, [dataPoints, todayStr])

  // Last 7 days trend data
  const trendData = useMemo(() => {
    const days = getLast7Days()
    const dayMap = new Map<string, number>()

    // Build a map of date -> latest mood value
    for (const dp of dataPoints) {
      const date = dp.recorded_date
      const existing = dayMap.get(date)
      if (!existing || new Date(dp.recorded_at) > new Date(existing)) {
        dayMap.set(date, Math.round(dp.value))
      }
    }

    // Return array of { date, value } for last 7 days (skip missing days)
    return days
      .map(date => ({ date, value: dayMap.get(date) ?? null }))
      .filter((d): d is { date: string; value: number } => d.value !== null)
  }, [dataPoints])

  const handleSelectMood = (rating: number) => {
    onRecordData?.(rating, { value_type: 'mood' })
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-3">
      {/* Face row */}
      <div className="flex items-center gap-2">
        {MOOD_ICONS.map(({ Icon, label }, idx) => {
          const rating = idx + 1
          const isSelected = todayMood === rating

          return (
            <button
              key={rating}
              onClick={() => onRecordData && handleSelectMood(rating)}
              disabled={!onRecordData}
              title={label}
              className="relative p-1 rounded-full transition-all duration-200"
              style={{
                background: isSelected
                  ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                  : 'transparent',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <Icon
                size={isCompact ? 20 : 26}
                stroke={isSelected ? 'var(--color-accent)' : 'var(--color-text-tertiary)'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                fill={isSelected ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'none'}
              />
            </button>
          )
        })}
      </div>

      {/* Selected mood label */}
      {todayMood && (
        <div className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
          {MOOD_ICONS[todayMood - 1]?.label ?? 'Recorded'}
        </div>
      )}

      {/* No mood yet prompt */}
      {!todayMood && onRecordData && (
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          How are you feeling?
        </div>
      )}

      {/* Mini 7-day trend line (non-compact only) */}
      {!isCompact && trendData.length >= 2 && (
        <MiniTrendLine data={trendData} />
      )}
    </div>
  )
}

// ── Mini SVG trend line ─────────────────────────────────────

function MiniTrendLine({ data }: { data: { date: string; value: number }[] }) {
  const width = 120
  const height = 32
  const padding = 4

  if (data.length < 2) return null

  const chartW = width - padding * 2
  const chartH = height - padding * 2

  // Map values 1-5 to y coordinates (inverted: higher mood = higher on chart)
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartW
    const y = padding + chartH - ((d.value - 1) / 4) * chartH
    return { x, y, value: d.value }
  })

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <div className="w-full flex justify-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Trend line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots at each data point */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill="var(--color-accent)"
          />
        ))}
      </svg>
    </div>
  )
}
