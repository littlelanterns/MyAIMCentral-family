import { Info } from 'lucide-react'
import type { FrequencyPeriod } from '@/types/lists'

export interface ItemRecurrenceValue {
  is_repeatable: boolean
  frequency_min: number | null
  frequency_max: number | null
  frequency_period: FrequencyPeriod | null
  cooldown_hours: number | null
  max_instances: number | null
  reset_mode?: 'cooldown' | 'chore_cycle'
}

type RecurrenceMode = 'one_time' | 'recurring' | 'always'
type ResetSubMode = 'chore_cycle' | 'cooldown'

interface ItemRecurrenceConfigProps {
  value: ItemRecurrenceValue
  onChange: (value: ItemRecurrenceValue) => void
  compact?: boolean
}

const CHORE_CYCLE_PERIODS: { value: FrequencyPeriod; label: string }[] = [
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
]

const PERIOD_HOURS: Record<FrequencyPeriod, number> = {
  day: 24,
  week: 168,
  month: 720,
}

function deriveMode(value: ItemRecurrenceValue): RecurrenceMode {
  if (!value.is_repeatable || value.max_instances === 1) return 'one_time'
  if (value.cooldown_hours || value.frequency_period || value.reset_mode) return 'recurring'
  return 'always'
}

function deriveResetSubMode(value: ItemRecurrenceValue): ResetSubMode {
  if (value.reset_mode === 'chore_cycle') return 'chore_cycle'
  return 'cooldown'
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
        reset_mode: undefined,
      }
    case 'recurring': {
      const subMode = prev.reset_mode ?? 'cooldown'
      if (subMode === 'chore_cycle') {
        return {
          is_repeatable: true,
          frequency_min: prev.frequency_min ?? 1,
          frequency_max: prev.frequency_max,
          frequency_period: prev.frequency_period ?? 'week',
          cooldown_hours: prev.cooldown_hours,
          max_instances: null,
          reset_mode: 'chore_cycle',
        }
      }
      const period = prev.frequency_period ?? 'week'
      return {
        is_repeatable: true,
        frequency_min: prev.frequency_min ?? 1,
        frequency_max: prev.frequency_max,
        frequency_period: period,
        cooldown_hours: prev.cooldown_hours ?? PERIOD_HOURS[period],
        max_instances: null,
        reset_mode: 'cooldown',
      }
    }
    case 'always':
      return {
        is_repeatable: true,
        frequency_min: null,
        frequency_max: null,
        frequency_period: null,
        cooldown_hours: null,
        max_instances: null,
        reset_mode: undefined,
      }
  }
}

export function ItemRecurrenceConfig({ value, onChange, compact = true }: ItemRecurrenceConfigProps) {
  const mode = deriveMode(value)
  const resetSubMode = deriveResetSubMode(value)

  function handleModeChange(newMode: RecurrenceMode) {
    if (newMode === mode) return
    onChange(buildValue(newMode, value))
  }

  function handleResetSubModeChange(newSubMode: ResetSubMode) {
    if (newSubMode === resetSubMode) return
    if (newSubMode === 'chore_cycle') {
      onChange({
        ...value,
        reset_mode: 'chore_cycle',
        frequency_period: value.frequency_period ?? 'week',
        cooldown_hours: value.cooldown_hours,
      })
    } else {
      const period = value.frequency_period ?? 'week'
      onChange({
        ...value,
        reset_mode: 'cooldown',
        frequency_period: null,
        cooldown_hours: value.cooldown_hours ?? PERIOD_HOURS[period],
      })
    }
  }

  const pillClass =
    'px-2.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer border'

  return (
    <div className={compact ? 'flex items-start gap-2 flex-wrap' : 'space-y-2'}>
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

      {/* Recurring details — two sub-mode picker */}
      {mode === 'recurring' && (
        <div className="w-full space-y-2 mt-1">
          {/* Reset mode toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>Resets:</span>
            <div className="inline-flex rounded-full border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              {(['chore_cycle', 'cooldown'] as const).map((sm) => (
                <button
                  key={sm}
                  type="button"
                  onClick={() => handleResetSubModeChange(sm)}
                  className="px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: resetSubMode === sm ? 'var(--color-btn-primary-bg)' : 'transparent',
                    color: resetSubMode === sm ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: 'none',
                  }}
                >
                  {sm === 'chore_cycle' ? 'Chore Cycle' : 'Rolling Cooldown'}
                </button>
              ))}
            </div>
          </div>

          {resetSubMode === 'chore_cycle' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Period:</span>
                <select
                  value={value.frequency_period ?? 'week'}
                  onChange={(e) => {
                    onChange({
                      ...value,
                      frequency_period: e.target.value as FrequencyPeriod,
                    })
                  }}
                  className="px-1.5 py-0.5 rounded text-[11px]"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {CHORE_CYCLE_PERIODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Min gap:</span>
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
              <div className="flex items-start gap-1 px-0.5">
                <span
                  className="shrink-0 mt-0.5"
                  title="Available again at the start of each chore week. Set your family's chore week start day in Settings → Family Management."
                >
                  <Info size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                </span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--color-text-tertiary)' }}>
                  Available again at the start of each chore week. Set your chore week start in Settings.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Cooldown:</span>
                <input
                  type="number"
                  min={0}
                  value={value.cooldown_hours ?? ''}
                  onChange={(e) => onChange({ ...value, cooldown_hours: e.target.value ? Number(e.target.value) : null })}
                  className="w-14 px-1.5 py-0.5 rounded text-[11px] text-center"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="168"
                />
                <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>hours</span>
              </div>
              <div className="flex items-start gap-1 px-0.5">
                <span
                  className="shrink-0 mt-0.5"
                  title="Available again after this many hours from the last completion. Good for preventing back-to-back completions."
                >
                  <Info size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                </span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--color-text-tertiary)' }}>
                  Available again after this many hours from the last completion.
                </span>
              </div>
            </div>
          )}
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
