/**
 * OpportunitySettingsPanel — configures opportunity defaults for a list.
 *
 * Appears in the list detail settings area when is_opportunity=true.
 * Controls: default subtype, default reward, default claim lock, pool mode.
 */

import { Star, DollarSign, Clock, GraduationCap } from 'lucide-react'
import type { OpportunitySubtype, OpportunityRewardType, ClaimLockUnit, AdvancementMode } from '@/types/lists'

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
  /** Build J advancement mode defaults (optional — for mastery-enabled opportunity lists) */
  defaultAdvancementMode?: AdvancementMode | null
  defaultPracticeTarget?: number | null
  defaultRequireApproval?: boolean | null
  onDefaultAdvancementModeChange?: (v: AdvancementMode) => void
  onDefaultPracticeTargetChange?: (v: number | null) => void
  onDefaultRequireApprovalChange?: (v: boolean) => void
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
  defaultAdvancementMode,
  defaultPracticeTarget,
  defaultRequireApproval,
  onDefaultAdvancementModeChange,
  onDefaultPracticeTargetChange,
  onDefaultRequireApprovalChange,
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

      {/* Advancement / mastery settings (Build J infrastructure) */}
      {onDefaultAdvancementModeChange && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={12} style={{ color: 'var(--color-text-heading)' }} />
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Completion mode
            </label>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            For skills that need practice or mastery approval before marking done.
          </p>
          <div className="space-y-1">
            {([
              { value: 'complete' as AdvancementMode, label: 'Simple', desc: 'one-and-done completion' },
              { value: 'practice_count' as AdvancementMode, label: 'Practice', desc: 'must practice N times before done' },
              { value: 'mastery' as AdvancementMode, label: 'Mastery', desc: 'practice + you approve when ready' },
            ]).map(opt => (
              <label
                key={opt.value}
                className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                style={{
                  backgroundColor: (defaultAdvancementMode ?? 'complete') === opt.value
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                    : 'transparent',
                  border: `1px solid ${(defaultAdvancementMode ?? 'complete') === opt.value ? 'var(--color-btn-primary-bg)' : 'transparent'}`,
                }}
              >
                <input
                  type="radio"
                  name="advancement-mode"
                  value={opt.value}
                  checked={(defaultAdvancementMode ?? 'complete') === opt.value}
                  onChange={() => onDefaultAdvancementModeChange(opt.value)}
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

          {/* Practice target (for practice_count mode) */}
          {(defaultAdvancementMode === 'practice_count' || defaultAdvancementMode === 'mastery') && onDefaultPracticeTargetChange && (
            <div className="flex items-center gap-2 pl-6">
              <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Practice {defaultAdvancementMode === 'mastery' ? 'before submitting' : 'to complete'}:
              </label>
              <input
                type="number"
                min={1}
                value={defaultPracticeTarget ?? ''}
                onChange={e => onDefaultPracticeTargetChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="5"
                className="w-16 px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>times</span>
            </div>
          )}

          {/* Require approval toggle (for mastery mode) */}
          {defaultAdvancementMode === 'mastery' && onDefaultRequireApprovalChange && (
            <label className="flex items-center gap-2 pl-6 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultRequireApproval ?? true}
                onChange={e => onDefaultRequireApprovalChange(e.target.checked)}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Require your approval before marking mastered
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  )
}
