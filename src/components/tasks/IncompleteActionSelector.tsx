/**
 * IncompleteActionSelector (PRD-09A Section 5)
 *
 * Radio selection for what happens when a task isn't completed.
 * Six options with descriptions.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

export type IncompleteAction =
  | 'fresh_reset'
  | 'auto_reschedule'
  | 'drop_after_date'
  | 'reassign_until_complete'
  | 'require_decision'
  | 'escalate_to_parent'

const OPTIONS: { value: IncompleteAction; label: string; description: string; default_for?: string }[] = [
  {
    value: 'fresh_reset',
    label: 'Fresh Reset',
    description: 'Resets clean each period. History recorded, nothing carries forward.',
    default_for: 'routine',
  },
  {
    value: 'auto_reschedule',
    label: 'Auto-Reschedule',
    description: 'Moves to next day or period automatically.',
    default_for: 'task',
  },
  {
    value: 'drop_after_date',
    label: 'Drop After Date',
    description: 'Disappears if not completed by a specified date.',
  },
  {
    value: 'reassign_until_complete',
    label: 'Reassign Until Complete',
    description: 'Keeps appearing until done.',
  },
  {
    value: 'require_decision',
    label: 'Require Decision',
    description: 'Prompts you to decide: reschedule, dismiss, or reassign.',
  },
  {
    value: 'escalate_to_parent',
    label: 'Escalate to Parent',
    description: 'Flags for parent attention if not completed by a configurable time.',
  },
]

interface IncompleteActionSelectorProps {
  value: IncompleteAction
  onChange: (value: IncompleteAction) => void
}

export function IncompleteActionSelector({ value, onChange }: IncompleteActionSelectorProps) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: `1px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: selected
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              cursor: 'pointer',
              transition: 'all var(--vibe-transition, 0.15s ease)',
            }}
          >
            <input
              type="radio"
              name="incomplete-action"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              style={{ marginTop: '3px', accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  fontWeight: 500,
                  color: 'var(--color-text-heading)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                {option.label}
                {option.default_for && (
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs, 0.75rem)',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 400,
                    }}
                  >
                    (default for {option.default_for}s)
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.125rem',
                }}
              >
                {option.description}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
