/**
 * AudienceToggle (PRD-23 Study Guide Rework)
 * Segmented control for switching between Adult / Teen / Kid reading levels.
 * Display-only — no data query change. ExtractionContent reads the active
 * level and picks the right text column (text / independent_text / guided_text).
 */
import type { AudienceLevel } from './ExtractionBrowser'

interface AudienceToggleProps {
  activeAudience: AudienceLevel
  onChange: (level: AudienceLevel) => void
}

const LEVELS: { value: AudienceLevel; label: string }[] = [
  { value: 'adult', label: 'Adult' },
  { value: 'independent', label: 'Teen' },
  { value: 'guided', label: 'Kid' },
]

export function AudienceToggle({ activeAudience, onChange }: AudienceToggleProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
        Reading Level
      </span>
      <div className="inline-flex rounded-lg border border-[var(--color-border-default)] overflow-hidden">
        {LEVELS.map(level => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              activeAudience === level.value
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  )
}
