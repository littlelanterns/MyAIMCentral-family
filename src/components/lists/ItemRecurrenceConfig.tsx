import type { FrequencyPeriod } from '@/types/lists'

export interface ItemRecurrenceValue {
  is_repeatable: boolean
  frequency_min: number | null
  frequency_max: number | null
  frequency_period: FrequencyPeriod | null
  cooldown_hours: number | null
  max_instances: number | null
}

type RecurrenceMode = 'one_time' | 'recurring' | 'always'

interface ItemRecurrenceConfigProps {
  value: ItemRecurrenceValue
  onChange: (value: ItemRecurrenceValue) => void
  compact?: boolean
}

const PERIOD_OPTIONS: { value: FrequencyPeriod; label: string }[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
]

function deriveMode(value: ItemRecurrenceValue): RecurrenceMode {
  if (!value.is_repeatable || value.max_instances === 1) return 'one_time'
  if (value.cooldown_hours || value.frequency_period) return 'recurring'
  return 'always'
}

function buildValue(mode: RecurrenceMode, prev: ItemRecurrenceValue): ItemRecurrenceValue {
  switch (mode) {
    case 'one_time':
      return {
        is_repeatable: false,
        frequency_min: null,
        frequency_max: null,
        frequency_period: null,
        cooldown_hours: null,
        max_instances: 1,
      }
    case 'recurring':
      return {
        is_repeatable: true,
        frequency_min: prev.frequency_min ?? 1,
        frequency_max: prev.frequency_max,
        frequency_period: prev.frequency_period ?? 'week',
        cooldown_hours: prev.cooldown_hours ?? 24,
        max_instances: null,
      }
    case 'always':
      return {
        is_repeatable: true,
        frequency_min: null,
        frequency_max: null,
        frequency_period: null,
        cooldown_hours: null,
        max_instances: null,
      }
  }
}

export function ItemRecurrenceConfig({ value, onChange, compact = true }: ItemRecurrenceConfigProps) {
  const mode = deriveMode(value)

  function handleModeChange(newMode: RecurrenceMode) {
    if (newMode === mode) return
    onChange(buildValue(newMode, value))
  }

  const pillClass =
    'px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer border'

  return (
    <div className={compact ? 'flex items-center gap-2 flex-wrap' : 'space-y-2'}>
      {/* Mode segmented pills */}
      <div className="inline-flex rounded-full border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        {(['one_time', 'recurring', 'always'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={pillClass}
            style={{
              backgroundColor: mode === m ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: mode === m ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              borderColor: 'transparent',
              borderRadius: 0,
            }}
          >
            {m === 'one_time' ? 'One-time' : m === 'recurring' ? 'Recurring' : 'Always'}
          </button>
        ))}
      </div>

      {/* Recurring details */}
      {mode === 'recurring' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>every</span>
          <select
            value={value.frequency_period ?? 'week'}
            onChange={(e) => onChange({ ...value, frequency_period: e.target.value as FrequencyPeriod })}
            className="px-1.5 py-0.5 rounded text-[11px]"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>cooldown</span>
          <input
            type="number"
            min={0}
            value={value.cooldown_hours ?? ''}
            onChange={(e) => onChange({ ...value, cooldown_hours: e.target.value ? Number(e.target.value) : null })}
            className="w-12 px-1.5 py-0.5 rounded text-[11px] text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            placeholder="hrs"
          />
          <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>hrs</span>
        </div>
      )}
    </div>
  )
}

export const DEFAULT_RECURRENCE_VALUE: ItemRecurrenceValue = {
  is_repeatable: true,
  frequency_min: null,
  frequency_max: null,
  frequency_period: null,
  cooldown_hours: null,
  max_instances: null,
}
