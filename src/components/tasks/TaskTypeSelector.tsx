/**
 * TaskTypeSelector (PRD-09A Section 2)
 *
 * Radio-based task type selection with sub-type configuration
 * for Opportunity tasks (Repeatable / Claimable / Capped).
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { CheckSquare, RefreshCcw, Star, Repeat } from 'lucide-react'
import { Input } from '@/components/shared'

export type TaskType = 'task' | 'routine' | 'opportunity' | 'habit' | 'list' | 'makeup'
export type OpportunitySubType = 'repeatable' | 'claimable' | 'capped'

interface TaskTypeSelectorProps {
  taskType: TaskType
  onChange: (type: TaskType) => void
  opportunitySubType?: OpportunitySubType
  onOpportunitySubTypeChange?: (sub: OpportunitySubType) => void
  maxCompletions?: string
  onMaxCompletionsChange?: (v: string) => void
  claimLockDuration?: string
  onClaimLockDurationChange?: (v: string) => void
  claimLockUnit?: string
  onClaimLockUnitChange?: (v: string) => void
}

const TASK_TYPES: { value: TaskType; label: string; description: string; icon: typeof CheckSquare }[] = [
  {
    value: 'task',
    label: 'Task',
    description: 'Standard one-time or recurring to-do',
    icon: CheckSquare,
  },
  {
    value: 'routine',
    label: 'Routine',
    description: 'Recurring checklist with sections and steps',
    icon: RefreshCcw,
  },
  {
    value: 'opportunity',
    label: 'Opportunity',
    description: 'Optional bonus task kids can choose to do',
    icon: Star,
  },
  {
    value: 'habit',
    label: 'Habit',
    description: 'Daily tracked behavior with streak monitoring',
    icon: Repeat,
  },
]

const OPP_SUBTYPES: { value: OpportunitySubType; label: string; description: string }[] = [
  {
    value: 'repeatable',
    label: 'Repeatable',
    description: 'Can be completed multiple times (optionally capped)',
  },
  {
    value: 'claimable',
    label: 'Claimable Job',
    description: 'Locks to one person for a set time after claiming',
  },
  {
    value: 'capped',
    label: 'Capped',
    description: 'Limited total completions (required limit)',
  },
]

export function TaskTypeSelector({
  taskType,
  onChange,
  opportunitySubType = 'repeatable',
  onOpportunitySubTypeChange,
  maxCompletions = '',
  onMaxCompletionsChange,
  claimLockDuration = '',
  onClaimLockDurationChange,
  claimLockUnit = 'hours',
  onClaimLockUnitChange,
}: TaskTypeSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Task type radio cards */}
      <div className="grid grid-cols-2 gap-2">
        {TASK_TYPES.map(({ value, label, description, icon: Icon }) => {
          const selected = taskType === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: `2px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                backgroundColor: selected
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--vibe-transition, 0.15s ease)',
              }}
              aria-pressed={selected}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Icon
                  size={14}
                  style={{ color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-heading)',
                  }}
                >
                  {label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}
              >
                {description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Opportunity sub-type config */}
      {taskType === 'opportunity' && (
        <div
          style={{
            padding: '0.875rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Opportunity type
          </p>
          <div className="space-y-2">
            {OPP_SUBTYPES.map(({ value, label, description }) => {
              const selected = opportunitySubType === value
              return (
                <label
                  key={value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.625rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    backgroundColor: selected
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="opp-subtype"
                    value={value}
                    checked={selected}
                    onChange={() => onOpportunitySubTypeChange?.(value)}
                    style={{ marginTop: '3px', accentColor: 'var(--color-btn-primary-bg)' }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 500, color: 'var(--color-text-heading)' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                      {description}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Sub-type specific fields */}
          {(opportunitySubType === 'repeatable') && (
            <div className="mt-3">
              <Input
                label="Max completions (blank = unlimited)"
                type="number"
                value={maxCompletions}
                onChange={(e) => onMaxCompletionsChange?.(e.target.value)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
          )}

          {opportunitySubType === 'claimable' && (
            <div className="mt-3 space-y-2">
              <div
                style={{
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                Claim lock duration
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={claimLockDuration}
                  onChange={(e) => onClaimLockDurationChange?.(e.target.value)}
                  placeholder="4"
                  min={1}
                  className="flex-1"
                />
                <select
                  value={claimLockUnit}
                  onChange={(e) => onClaimLockUnitChange?.(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    backgroundColor: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    minHeight: '44px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          )}

          {opportunitySubType === 'capped' && (
            <div className="mt-3">
              <Input
                label="Maximum completions (required)"
                type="number"
                value={maxCompletions}
                onChange={(e) => onMaxCompletionsChange?.(e.target.value)}
                placeholder="5"
                required
                min={1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
