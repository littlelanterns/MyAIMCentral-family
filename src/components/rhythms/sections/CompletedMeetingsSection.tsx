/**
 * PRD-18 Evening Section: Completed Meetings
 *
 * Shows meetings completed in the last 7 days as read-only cards.
 * Auto-hides when no completed meetings exist (returns null).
 * Wired in Phase E (Build P) — replaces the stub from StubSections.tsx.
 */

import { UsersRound, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRecentMeetings } from '@/hooks/useMeetings'
import { MEETING_TYPE_LABELS } from '@/types/meetings'
import type { Meeting } from '@/types/meetings'

interface Props {
  familyId: string
  memberId: string
}

/** Renders a one-line summary snippet, truncated to ~80 chars. */
function summarySnippet(m: Meeting): string {
  if (m.summary) {
    return m.summary.length > 80 ? m.summary.slice(0, 77) + '...' : m.summary
  }
  return 'No summary recorded'
}

/** Friendly label: "Mentor: Jake" or "Couple Meeting" */
function meetingLabel(m: Meeting): string {
  const base = MEETING_TYPE_LABELS[m.meeting_type] ?? 'Meeting'
  if (m.custom_title) return m.custom_title
  return base
}

/** Relative date: "Today", "Yesterday", "3 days ago" */
function relativeDate(isoDate: string | null): string {
  if (!isoDate) return ''
  const completed = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - completed.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

export function CompletedMeetingsSection({ familyId, memberId: _memberId }: Props) {
  // Query last 5 completed meetings — filter to last 7 days client-side
  const { data: recentMeetings = [], isLoading } = useRecentMeetings(familyId, 10)

  if (isLoading) return null

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recent = recentMeetings.filter(m => {
    if (!m.completed_at) return false
    return new Date(m.completed_at) >= sevenDaysAgo
  })

  // Auto-hide when no completed meetings in the last 7 days
  if (recent.length === 0) return null

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <UsersRound size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Recent Meetings
        </h3>
      </div>

      <div className="space-y-2">
        {recent.slice(0, 3).map(m => (
          <div
            key={m.id}
            className="rounded-lg px-3 py-2"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {meetingLabel(m)}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {relativeDate(m.completed_at)}
              </span>
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {summarySnippet(m)}
            </p>
          </div>
        ))}
      </div>

      {recent.length > 3 && (
        <Link
          to="/meetings?tab=history"
          className="flex items-center gap-1 mt-3 text-xs font-medium hover:underline"
          style={{ color: 'var(--color-accent-deep)' }}
        >
          View all meeting history
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  )
}
