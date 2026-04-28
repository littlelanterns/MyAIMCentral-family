/**
 * TrackingDefaultsPanel — list-level defaults for progress + duration tracking.
 *
 * Appears in the list detail settings area for ALL list types.
 * Individual items can override via per-item tri-state toggles.
 */

import { Activity } from 'lucide-react'

interface TrackingDefaultsPanelProps {
  defaultTrackProgress: boolean
  defaultTrackDuration: boolean
  onDefaultTrackProgressChange: (v: boolean) => void
  onDefaultTrackDurationChange: (v: boolean) => void
}

export function TrackingDefaultsPanel({
  defaultTrackProgress,
  defaultTrackDuration,
  onDefaultTrackProgressChange,
  onDefaultTrackDurationChange,
}: TrackingDefaultsPanelProps) {
  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Activity size={14} style={{ color: 'var(--color-text-heading)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Progress Tracking Defaults
        </span>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        Apply to new items and tasks generated from this list. Individual items can override.
      </p>

      <label
        className="flex items-center gap-2 cursor-pointer"
        style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-primary)' }}
      >
        <input
          type="checkbox"
          checked={defaultTrackProgress}
          onChange={(e) => onDefaultTrackProgressChange(e.target.checked)}
          style={{ accentColor: 'var(--color-btn-primary-bg)' }}
        />
        Items track daily progress (multi-day)
      </label>

      <label
        className="flex items-center gap-2 cursor-pointer"
        style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-primary)' }}
      >
        <input
          type="checkbox"
          checked={defaultTrackDuration}
          onChange={(e) => onDefaultTrackDurationChange(e.target.checked)}
          style={{ accentColor: 'var(--color-btn-primary-bg)' }}
        />
        Items track time spent
      </label>
    </div>
  )
}
