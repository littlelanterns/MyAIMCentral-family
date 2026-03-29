// PRD-10: Achievement Badge tracker — collect badges and display accomplishments
// Visual variants: badge_wall (default), trophy_shelf, sticker_album

import { useMemo, useState } from 'react'
import { Award, Lock, Star, Target, Zap } from 'lucide-react'
import type { TrackerProps } from './TrackerProps'

interface BadgeDefinition {
  name: string
  icon: string
  criteria: string
}

const DEFAULT_BADGES: BadgeDefinition[] = [
  { name: 'First Step', icon: 'Star', criteria: 'Complete your first task' },
  { name: 'On a Roll', icon: 'Zap', criteria: 'Complete 5 tasks in a row' },
  { name: 'Champion', icon: 'Target', criteria: 'Complete all weekly goals' },
]

// Map icon string names to Lucide components
const ICON_MAP: Record<string, typeof Star> = {
  Star,
  Zap,
  Target,
  Award,
}

function getBadgeIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Award
}

export function AchievementBadgeTracker({ widget, dataPoints, onRecordData: _onRecordData, variant: _variant, isCompact }: TrackerProps) {
  const config = widget.widget_config as {
    badges?: BadgeDefinition[]
  }

  const badges = config.badges && config.badges.length > 0 ? config.badges : DEFAULT_BADGES

  const earnedBadges = useMemo(() => {
    const earned = new Map<number, string>() // badge_index → earned date
    for (const dp of dataPoints) {
      const badgeIndex = dp.metadata?.badge_index
      if (typeof badgeIndex === 'number' && badgeIndex >= 0 && badgeIndex < badges.length) {
        earned.set(badgeIndex, dp.recorded_date)
      }
    }
    return earned
  }, [dataPoints, badges.length])

  const earnedCount = earnedBadges.size

  const [selectedBadge, setSelectedBadge] = useState<number | null>(null)

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 h-full w-full justify-center">
        <Award size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {earnedCount} of {badges.length} earned
        </span>
        {/* Mini badge icons */}
        <div className="flex gap-0.5">
          {badges.slice(0, 5).map((badge, i) => {
            const isEarned = earnedBadges.has(i)
            const IconComponent = getBadgeIcon(badge.icon)
            return (
              <IconComponent
                key={i}
                size={10}
                style={{
                  color: isEarned ? 'var(--color-accent)' : 'var(--color-border-default)',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <Award size={14} />
          <span>{earnedCount} of {badges.length} earned</span>
        </div>
      </div>

      {/* Badge grid */}
      <div className="flex-1 grid grid-cols-3 gap-2 content-start">
        {badges.map((badge, i) => {
          const isEarned = earnedBadges.has(i)
          const earnedDate = earnedBadges.get(i)
          const IconComponent = getBadgeIcon(badge.icon)
          const isSelected = selectedBadge === i

          return (
            <button
              key={i}
              onClick={() => setSelectedBadge(isSelected ? null : i)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200"
              style={{
                background: isSelected
                  ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                  : isEarned
                    ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
                    : 'var(--color-surface-secondary)',
                border: isSelected
                  ? '1.5px solid var(--color-accent)'
                  : '1.5px solid transparent',
              }}
            >
              {/* Badge circle */}
              <div
                className="flex items-center justify-center rounded-full transition-all duration-300"
                style={{
                  width: 36,
                  height: 36,
                  background: isEarned
                    ? 'var(--color-accent)'
                    : 'var(--color-border-default)',
                  opacity: isEarned ? 1 : 0.4,
                }}
              >
                {isEarned ? (
                  <IconComponent size={18} style={{ color: 'var(--color-text-on-primary)' }} />
                ) : (
                  <Lock size={14} style={{ color: 'var(--color-text-secondary)' }} />
                )}
              </div>

              {/* Badge name */}
              <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{
                  color: isEarned ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  opacity: isEarned ? 1 : 0.6,
                }}
              >
                {isEarned ? badge.name : '???'}
              </span>

              {/* Earned date (shown when selected) */}
              {isSelected && isEarned && earnedDate && (
                <span className="text-[8px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(earnedDate)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail panel when a badge is selected */}
      {selectedBadge !== null && (
        <BadgeDetail
          badge={badges[selectedBadge]}
          isEarned={earnedBadges.has(selectedBadge)}
          earnedDate={earnedBadges.get(selectedBadge)}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  )
}

// ── Badge Detail Panel ──────────────────────────────────

function BadgeDetail({
  badge,
  isEarned,
  earnedDate,
  onClose: _onClose,
}: {
  badge: BadgeDefinition
  isEarned: boolean
  earnedDate?: string
  onClose: () => void
}) {
  const IconComponent = getBadgeIcon(badge.icon)

  return (
    <div
      className="mt-2 p-2.5 rounded-lg flex items-center gap-2.5"
      style={{
        background: isEarned
          ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
          : 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 32,
          height: 32,
          background: isEarned ? 'var(--color-accent)' : 'var(--color-border-default)',
        }}
      >
        {isEarned ? (
          <IconComponent size={16} style={{ color: 'var(--color-text-on-primary)' }} />
        ) : (
          <Lock size={12} style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {isEarned ? badge.name : 'Locked Badge'}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          {isEarned
            ? `Earned ${earnedDate ? formatDate(earnedDate) : ''}`
            : badge.criteria
          }
        </div>
      </div>
    </div>
  )
}

// ── Date formatting helper ──────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
