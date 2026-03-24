/**
 * RewardConfig (PRD-09A Section 6)
 *
 * Reward and tracking configuration for tasks.
 * Reward type, amount, bonus threshold, approval, widget tracking, victory flag.
 * Reward transaction processing deferred to PRD-24.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { Input, Select, Toggle } from '@/components/shared'

export type RewardType = '' | 'stars' | 'points' | 'money' | 'privileges' | 'family_activities'

export interface RewardConfigData {
  rewardType: RewardType
  rewardAmount: string
  bonusThreshold: string
  bonusPercentage: string
  requireApproval: boolean
  trackAsWidget: boolean
  flagAsVictory: boolean
}

interface RewardConfigProps {
  value: RewardConfigData
  onChange: (value: RewardConfigData) => void
}

const REWARD_TYPE_OPTIONS = [
  { value: '', label: 'No reward' },
  { value: 'stars', label: 'Stars' },
  { value: 'points', label: 'Points' },
  { value: 'money', label: 'Money / Allowance' },
  { value: 'privileges', label: 'Privileges' },
  { value: 'family_activities', label: 'Family Activities' },
]

export function RewardConfig({ value, onChange }: RewardConfigProps) {
  const update = (patch: Partial<RewardConfigData>) => onChange({ ...value, ...patch })
  const hasReward = !!value.rewardType

  return (
    <div className="space-y-4">
      {/* Reward type */}
      <Select
        label="Reward type"
        value={value.rewardType}
        onChange={(v) => update({ rewardType: v as RewardType })}
        options={REWARD_TYPE_OPTIONS}
      />

      {/* Reward amount — only when reward type selected */}
      {hasReward && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount per completion"
            type="number"
            value={value.rewardAmount}
            onChange={(e) => update({ rewardAmount: e.target.value })}
            placeholder="10"
            min={0}
          />
          <div className="space-y-1">
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              Bonus threshold
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={value.bonusThreshold}
                onChange={(e) => update({ bonusThreshold: e.target.value })}
                placeholder="85"
                min={0}
                max={100}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  minHeight: '44px',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>%</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>=</span>
              <input
                type="number"
                value={value.bonusPercentage}
                onChange={(e) => update({ bonusPercentage: e.target.value })}
                placeholder="20"
                min={0}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  minHeight: '44px',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>% bonus</span>
            </div>
          </div>
        </div>
      )}

      {/* Approval requirement */}
      {hasReward && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Toggle
            checked={value.requireApproval}
            onChange={(v) => update({ requireApproval: v })}
            label="Require parent approval before reward releases"
          />
        </div>
      )}

      {/* Tracking options */}
      <div
        style={{
          padding: '0.75rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
        className="space-y-3"
      >
        <Toggle
          checked={value.trackAsWidget}
          onChange={(v) => update({ trackAsWidget: v })}
          label="View and track progress as a dashboard widget"
        />
        <Toggle
          checked={value.flagAsVictory}
          onChange={(v) => update({ flagAsVictory: v })}
          label="Flag completions as victories"
        />
      </div>
    </div>
  )
}
