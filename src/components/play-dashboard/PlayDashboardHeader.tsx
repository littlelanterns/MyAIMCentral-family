/**
 * PlayDashboardHeader — Build M Sub-phase B
 *
 * Big friendly greeting + 3 stat pills (points / streak / creature count)
 * for the Play Dashboard. The pills are READ-ONLY this build — Sub-phase
 * C wires the gamification write path that actually increments these.
 *
 * No emoji in the layout itself (per CLAUDE.md §16 Play tile rule). The
 * "stars" pill uses a Lucide Star icon — that's the currency icon, not a
 * task tile, so it stays. The "streak" pill uses Flame. Creature count
 * uses Sparkles. These are header chrome, not tile content.
 */

import { Star, Flame, Sparkles } from 'lucide-react'

interface PlayDashboardHeaderProps {
  memberName: string
  points: number
  streak: number
  creatureCount: number
  currencyName: string
}

export function PlayDashboardHeader({
  memberName,
  points,
  streak,
  creatureCount,
  currencyName,
}: PlayDashboardHeaderProps) {
  const greeting = greetingForTimeOfDay()
  const firstName = memberName.split(' ')[0]

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          {greeting}, {firstName}!
        </h1>
        <p
          style={{
            margin: '0.25rem 0 0 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Here's what's happening today.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <StatPill
          icon={<Star size={16} />}
          value={points}
          label={currencyName}
        />
        <StatPill
          icon={<Flame size={16} />}
          value={streak}
          label={streak === 1 ? 'day streak' : 'days streak'}
        />
        <StatPill
          icon={<Sparkles size={16} />}
          value={creatureCount}
          label={creatureCount === 1 ? 'creature' : 'creatures'}
        />
      </div>
    </div>
  )
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    >
      <span
        style={{
          color: 'var(--color-btn-primary-bg)',
          display: 'inline-flex',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function greetingForTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Hi there'
  return 'Good evening'
}
