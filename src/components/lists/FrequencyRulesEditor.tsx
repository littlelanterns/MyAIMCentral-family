/**
 * FrequencyRulesEditor — Inline editor for per-item frequency rules
 *
 * Shows a compact pill summary when collapsed, expands to full editor on tap.
 * Used on Randomizer list items to configure how often an item can surface.
 *
 * Spec: specs/smart-lists-reveal-mechanics-spec.md Part 3.1
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react'
import type { FrequencyPeriod } from '@/types/lists'

export interface FrequencyRules {
  frequency_min: number | null
  frequency_max: number | null
  frequency_period: FrequencyPeriod | null
  cooldown_hours: number | null
  lifetime_max: number | null  // maps to max_instances on list_items
  reward_amount: number | null
}

interface FrequencyRulesEditorProps {
  value: FrequencyRules
  onChange: (rules: FrequencyRules) => void
  compact?: boolean
}

const PERIOD_OPTIONS: { value: FrequencyPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

function formatFrequencySummary(rules: FrequencyRules): string {
  const parts: string[] = []

  if (rules.frequency_min != null && rules.frequency_period) {
    parts.push(`${rules.frequency_min}+×/${rules.frequency_period.charAt(0)}`)
  }
  if (rules.frequency_max != null && rules.frequency_period) {
    parts.push(`≤${rules.frequency_max}×/${rules.frequency_period.charAt(0)}`)
  }
  if (rules.cooldown_hours != null) {
    parts.push(`${rules.cooldown_hours}h cooldown`)
  }
  if (rules.lifetime_max != null) {
    parts.push(`${rules.lifetime_max} total`)
  }
  if (rules.reward_amount != null) {
    parts.push(`$${rules.reward_amount}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'unlimited'
}

export function FrequencyRulesEditor({
  value,
  onChange,
  compact = true,
}: FrequencyRulesEditorProps) {
  const [expanded, setExpanded] = useState(!compact)

  function update(patch: Partial<FrequencyRules>) {
    onChange({ ...value, ...patch })
  }

  const summary = formatFrequencySummary(value)
  const hasRules = summary !== 'unlimited'

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors"
        style={{
          backgroundColor: hasRules
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
            : 'var(--color-bg-secondary)',
          color: hasRules
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-text-secondary)',
          border: `1px solid ${hasRules ? 'color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)' : 'var(--color-border)'}`,
          cursor: 'pointer',
        }}
      >
        {summary}
        <ChevronDown size={10} />
      </button>
    )
  }

  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Frequency Rules
        </span>
        {compact && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="p-0.5 rounded"
            style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }}
          >
            <ChevronUp size={14} />
          </button>
        )}
      </div>

      {/* At least / no more than */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>At least</span>
          <input
            type="number"
            min={0}
            value={value.frequency_min ?? ''}
            onChange={e => update({
              frequency_min: e.target.value ? parseInt(e.target.value) : null,
              frequency_period: value.frequency_period ?? 'week',
            })}
            placeholder="—"
            className="w-14 px-2 py-1 rounded text-xs text-center"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>times per</span>
          <select
            value={value.frequency_period ?? ''}
            onChange={e => update({ frequency_period: (e.target.value || null) as FrequencyPeriod | null })}
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">—</option>
            {PERIOD_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No more than</span>
          <input
            type="number"
            min={0}
            value={value.frequency_max ?? ''}
            onChange={e => update({
              frequency_max: e.target.value ? parseInt(e.target.value) : null,
              frequency_period: value.frequency_period ?? 'week',
            })}
            placeholder="—"
            className="w-14 px-2 py-1 rounded text-xs text-center"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>times per</span>
          <select
            value={value.frequency_period ?? ''}
            onChange={e => update({ frequency_period: (e.target.value || null) as FrequencyPeriod | null })}
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">—</option>
            {PERIOD_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cooldown */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cooldown:</span>
        <input
          type="number"
          min={0}
          value={value.cooldown_hours ?? ''}
          onChange={e => update({ cooldown_hours: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="—"
          className="w-14 px-2 py-1 rounded text-xs text-center"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>hours after completion</span>
      </div>

      {/* Lifetime limit */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Lifetime limit:</span>
        <input
          type="number"
          min={0}
          value={value.lifetime_max ?? ''}
          onChange={e => update({ lifetime_max: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="∞"
          className="w-14 px-2 py-1 rounded text-xs text-center"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>total (blank = unlimited)</span>
      </div>

      {/* Reward */}
      <div className="flex items-center gap-2">
        <DollarSign size={12} style={{ color: 'var(--color-text-secondary)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Reward:</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={value.reward_amount ?? ''}
          onChange={e => update({ reward_amount: e.target.value ? parseFloat(e.target.value) : null })}
          placeholder="—"
          className="w-20 px-2 py-1 rounded text-xs text-center"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Compact summary pill (read-only) ────────────────────

export function FrequencyBadge({ rules }: { rules: FrequencyRules }) {
  const summary = formatFrequencySummary(rules)
  if (summary === 'unlimited') return null

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
        color: 'var(--color-btn-primary-bg)',
      }}
    >
      {summary}
    </span>
  )
}
