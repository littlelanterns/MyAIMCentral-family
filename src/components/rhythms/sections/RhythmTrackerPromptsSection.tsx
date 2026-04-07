/**
 * PRD-18 Phase C Section Type #23 (Enhancement 6): Rhythm Tracker Prompts
 *
 * Renders the member's dashboard widgets whose `config.rhythm_keys`
 * array contains the current rhythm's key. Tapping a widget navigates
 * to the main dashboard where the user can log data using the widget's
 * native entry UI.
 *
 * Phase C ships **link-only rendering** — inline data entry per widget
 * type would require embedding 15+ different entry UIs from PRD-10,
 * which is a separate scope. The section's value is surfacing
 * configured trackers inside the rhythm narrative arc; inline entry
 * is a later polish pass.
 *
 * Auto-hide behavior: returns null when the member has no widgets
 * configured for this rhythm (the default — mom opts in per widget).
 */

import { Link } from 'react-router-dom'
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import { useRhythmTrackerWidgets } from '@/hooks/useRhythmTrackers'

interface Props {
  familyId: string
  memberId: string
  rhythmKey: string
}

const RHYTHM_HEADER_BY_KEY: Record<string, string> = {
  morning: 'Track for morning',
  evening: 'Track for evening',
  weekly_review: 'Weekly tracking',
  monthly_review: 'Monthly tracking',
  quarterly_inventory: 'Quarterly tracking',
}

export function RhythmTrackerPromptsSection({ familyId, memberId, rhythmKey }: Props) {
  const { data: widgets = [], isLoading } = useRhythmTrackerWidgets(
    familyId,
    memberId,
    rhythmKey,
  )

  // Auto-hide while loading or when empty
  if (isLoading || widgets.length === 0) return null

  const headerText = RHYTHM_HEADER_BY_KEY[rhythmKey] ?? 'Track for this rhythm'

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <LayoutDashboard size={16} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {headerText}
        </h3>
      </div>

      <ul className="space-y-1.5">
        {widgets.map(widget => (
          <li key={widget.id}>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span className="flex-1 truncate">{widget.title || 'Untitled tracker'}</span>
              <span
                className="text-xs font-semibold inline-flex items-center gap-1"
                style={{ color: 'var(--color-accent-deep)' }}
              >
                Log now
                <ArrowRight size={12} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
