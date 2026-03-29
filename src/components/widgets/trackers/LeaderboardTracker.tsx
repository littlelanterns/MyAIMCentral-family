// PRD-10: Leaderboard tracker — multi-member ranking
// Visual variants: classic_leaderboard, podium, race_track
// Collaborative framing: "Team Standings" not "Competition"

import { useMemo } from 'react'
import { Crown, Trophy } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

interface LeaderboardConfig {
  participants?: string[]
  participant_names?: Record<string, string>
  participant_colors?: Record<string, string>
  metric_source?: string
  period?: 'daily' | 'weekly' | 'monthly'
}

interface RankedMember {
  memberId: string
  name: string
  color: string
  score: number
  rank: number
}

function getPeriodStart(period: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'weekly') {
    const day = start.getDay()
    start.setDate(start.getDate() - day)
  } else if (period === 'monthly') {
    start.setDate(1)
  }

  start.setHours(0, 0, 0, 0)
  return start
}

const DEFAULT_COLORS = [
  'var(--color-accent)',
  'var(--color-accent-deep)',
  'var(--color-text-secondary)',
  'var(--color-border-default)',
  'var(--color-text-tertiary)',
]

export function LeaderboardTracker({
  widget,
  dataPoints,
  isCompact,
}: TrackerProps) {
  const config = widget.widget_config as LeaderboardConfig
  const period = config.period ?? 'weekly'
  const participantNames = config.participant_names ?? {}
  const participantColors = config.participant_colors ?? {}

  const rankings: RankedMember[] = useMemo(() => {
    const periodStart = getPeriodStart(period)

    // Filter to current period
    const periodPoints = dataPoints.filter(dp => {
      const dpDate = new Date(dp.recorded_at)
      return dpDate >= periodStart
    })

    // Group by member_id from metadata
    const memberScores = new Map<string, number>()

    for (const dp of periodPoints) {
      const memberId = (dp.metadata?.member_id as string) ?? dp.family_member_id
      const current = memberScores.get(memberId) ?? 0
      memberScores.set(memberId, current + Number(dp.value))
    }

    // Include participants with zero scores
    const participants = config.participants ?? []
    for (const pid of participants) {
      if (!memberScores.has(pid)) {
        memberScores.set(pid, 0)
      }
    }

    // Sort descending and rank
    const sorted = Array.from(memberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([memberId, score], idx) => ({
        memberId,
        name: participantNames[memberId] ?? 'Member',
        color: participantColors[memberId] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        score,
        rank: idx + 1,
      }))

    return sorted
  }, [dataPoints, period, config.participants, participantNames, participantColors])

  const displayRankings = isCompact ? rankings.slice(0, 3) : rankings

  if (rankings.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 text-center">
        <Trophy size={24} style={{ color: 'var(--color-text-tertiary)' }} />
        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          No participants yet
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      {!isCompact && (
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Team Standings
          </span>
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month'}
          </span>
        </div>
      )}

      {/* Rankings list */}
      <div className="flex flex-col gap-1.5 flex-1">
        {displayRankings.map((member) => (
          <div
            key={member.memberId}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{
              background: member.rank === 1
                ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                : 'transparent',
              borderLeft: `3px solid ${member.color}`,
            }}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-5">
              {member.rank === 1 ? (
                <Crown size={isCompact ? 14 : 16} style={{ color: 'var(--color-accent)' }} />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {member.rank}
                </span>
              )}
            </div>

            {/* Name */}
            <span
              className={`flex-1 truncate ${isCompact ? 'text-xs' : 'text-sm'} font-medium`}
              style={{ color: 'var(--color-text-primary)' }}
            >
              {member.name}
            </span>

            {/* Score */}
            <span
              className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold tabular-nums`}
              style={{ color: member.rank === 1 ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
            >
              {member.score}
            </span>
          </div>
        ))}
      </div>

      {/* Show "and X more" in compact if truncated */}
      {isCompact && rankings.length > 3 && (
        <div className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          +{rankings.length - 3} more
        </div>
      )}
    </div>
  )
}
