/**
 * OpportunitySettingsPanel — configures opportunity defaults for a list.
 *
 * Appears in the list detail settings area when is_opportunity=true.
 * Controls: default subtype, default reward, default claim lock, pool mode.
 */

import { Star, DollarSign, Clock } from 'lucide-react'
import type { OpportunitySubtype, OpportunityRewardType, ClaimLockUnit } from '@/types/lists'

interface OpportunitySettingsPanelProps {
  defaultSubtype: OpportunitySubtype | null
  defaultRewardType: OpportunityRewardType | null
  defaultRewardAmount: number | null
  defaultClaimLockDuration: number | null
  defaultClaimLockUnit: ClaimLockUnit | null
  onDefaultSubtypeChange: (v: OpportunitySubtype) => void
  onDefaultRewardTypeChange: (v: OpportunityRewardType | null) => void
  onDefaultRewardAmountChange: (v: number | null) => void
  onDefaultClaimLockDurationChange: (v: number | null) => void
  onDefaultClaimLockUnitChange: (v: ClaimLockUnit | null) => void
}

const SUBTYPE_OPTIONS: { value: OpportunitySubtype; label: string; desc: string }[] = [
  { value: 'one_time', label: 'One-time', desc: 'One person claims it, done forever' },
  { value: 'claimable', label: 'Claimable', desc: 'One at a time with a lock timer' },
  { value: 'repeatable', label: 'Repeatable', desc: 'Available weekly/monthly, multiple people' },
]

const REWARD_TYPE_OPTIONS: { value: OpportunityRewardType; label: string }[] = [
  { value: 'money', label: 'Money' },
  { value: 'points', label: 'Points' },
  { value: 'privilege', label: 'Privilege' },
  { value: 'custom', label: 'Custom' },
]

export function OpportunitySettingsPanel({
  defaultSubtype,
  defaultRewardType,
  defaultRewardAmount,
  defaultClaimLockDuration,
  defaultClaimLockUnit,
  onDefaultSubtypeChange,
  onDefaultRewardTypeChange,
  onDefaultRewardAmountChange,
  onDefaultClaimLockDurationChange,
  onDefaultClaimLockUnitChange,
}: OpportunitySettingsPanelProps) {
  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Star size={14} style={{ color: 'var(--color-warning)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Opportunity Defaults
        </span>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        Set defaults for new items. Individual items can override these.
      </p>

      {/* Default subtype */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Item type
        </label>
        <div className="space-y-1">
          {SUBTYPE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: defaultSubtype === opt.value
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                  : 'transparent',
                border: `1px solid ${defaultSubtype === opt.value ? 'var(--color-btn-primary-bg)' : 'transparent'}`,
              }}
            >
              <input
                type="radio"
                name="opportunity-subtype"
                value={opt.value}
                checked={defaultSubtype === opt.value}
                onChange={() => onDefaultSubtypeChange(opt.value)}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  {opt.label}
                </span>
                <span className="text-[11px] ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                  — {opt.desc}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Default reward */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <DollarSign size={12} style={{ color: 'var(--color-text-heading)' }} />
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Default reward
          </label>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={defaultRewardType ?? ''}
            onChange={e => onDefaultRewardTypeChange(e.target.value ? e.target.value as OpportunityRewardType : null)}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">None</option>
            {REWARD_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {defaultRewardType && (
            <input
              type="number"
              min={0}
              step={defaultRewardType === 'money' ? 0.25 : 1}
              value={defaultRewardAmount ?? ''}
              onChange={e => onDefaultRewardAmountChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={defaultRewardType === 'money' ? '$0.00' : '0'}
              className="w-24 px-2 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          )}
        </div>
      </div>

      {/* Claim lock (only for claimable subtype) */}
      {defaultSubtype === 'claimable' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: 'var(--color-text-heading)' }} />
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Claim lock duration
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={defaultClaimLockDuration ?? ''}
              onChange={e => onDefaultClaimLockDurationChange(e.target.value ? Number(e.target.value) : null)}
              placeholder="4"
              className="w-20 px-2 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <select
              value={defaultClaimLockUnit ?? 'hours'}
              onChange={e => onDefaultClaimLockUnitChange(e.target.value as ClaimLockUnit)}
              className="px-2 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
