/**
 * DurationPicker (PRD-09A)
 *
 * Duration estimate dropdown for the Task Creation Modal.
 * Options: 5min through full-day + custom.
 * Uses the Select shared component.
 */

import { Select } from '@/components/shared'

export const DURATION_OPTIONS = [
  { value: '', label: 'No estimate' },
  { value: '5min', label: '5 minutes' },
  { value: '10min', label: '10 minutes' },
  { value: '15min', label: '15 minutes' },
  { value: '30min', label: '30 minutes' },
  { value: '45min', label: '45 minutes' },
  { value: '1hr', label: '1 hour' },
  { value: '1.5hr', label: '1.5 hours' },
  { value: '2hr', label: '2 hours' },
  { value: 'half-day', label: 'Half day' },
  { value: 'full-day', label: 'Full day' },
  { value: 'custom', label: 'Custom…' },
]

interface DurationPickerProps {
  value: string
  onChange: (value: string) => void
  customValue?: string
  onCustomChange?: (value: string) => void
}

export function DurationPicker({ value, onChange, customValue = '', onCustomChange }: DurationPickerProps) {
  return (
    <div className="space-y-2">
      <Select
        label="Duration estimate"
        value={value}
        onChange={onChange}
        options={DURATION_OPTIONS}
        placeholder="No estimate"
      />
      {value === 'custom' && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          placeholder="e.g. 2.5 hours, 3 days…"
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            backgroundColor: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            minHeight: '44px',
          }}
        />
      )}
    </div>
  )
}
