/**
 * PRD-18 Enhancement 5: Carry Forward Fallback Setting
 *
 * Member-level configuration for what happens to tasks when their
 * due date passes and they're not done. Four options:
 *
 *   Stay         — Task stays on the list indefinitely (ADHD-friendly default)
 *   Roll forward — Task moves to today at midnight
 *   Expire       — Task is cancelled after its due date
 *   Backburner   — Task moves to Backburner list after N days untouched
 *
 * Backburner option reveals a secondary input for the "N days" threshold
 * (default 14). Backlog threshold section below configures the optional
 * gentle sweep prompt that surfaces in the evening rhythm when the user
 * has a large accumulated backlog.
 *
 * Lives inside the Rhythms Settings page below the Active Rhythms list.
 * Mom can configure her own settings or use the member picker to set
 * fallback behavior for any family member.
 */

import { useState, useEffect } from 'react'
import { Archive, Check } from 'lucide-react'
import { useMemberPreferences, useUpdateMemberPreferences } from '@/hooks/useMemberPreferences'
import {
  type CarryForwardFallback,
  type BacklogPromptFrequency,
  DEFAULT_MEMBER_RHYTHM_PREFERENCES,
} from '@/types/rhythms'

interface Props {
  memberId: string
  /** Member's display name — shown in the header for clarity when mom is configuring for someone else. */
  memberName: string
}

interface Option {
  value: CarryForwardFallback
  label: string
  description: string
}

const OPTIONS: Option[] = [
  {
    value: 'stay',
    label: 'Stay',
    description: 'Tasks stay on the list until done or removed. No pressure, no guilt.',
  },
  {
    value: 'roll_forward',
    label: 'Roll forward',
    description: 'Tasks automatically move to today at midnight. Fresh daily list.',
  },
  {
    value: 'expire',
    label: 'Expire',
    description: 'Tasks disappear after their due date. Time-sensitive items only.',
  },
  {
    value: 'backburner',
    label: 'Move to Backburner',
    description: 'Tasks older than N days quietly move to the Backburner list.',
  },
]

export function CarryForwardFallbackSetting({ memberId, memberName }: Props) {
  const { data: prefs, isLoading } = useMemberPreferences(memberId)
  const updatePrefs = useUpdateMemberPreferences()

  // Local state mirrors preferences for smooth editing
  const [fallback, setFallback] = useState<CarryForwardFallback>(
    DEFAULT_MEMBER_RHYTHM_PREFERENCES.carry_forward_fallback
  )
  const [backburnerDays, setBackburnerDays] = useState<number>(
    DEFAULT_MEMBER_RHYTHM_PREFERENCES.carry_forward_backburner_days
  )
  const [backlogThreshold, setBacklogThreshold] = useState<number>(
    DEFAULT_MEMBER_RHYTHM_PREFERENCES.carry_forward_backlog_threshold
  )
  const [backlogFrequency, setBacklogFrequency] = useState<BacklogPromptFrequency>(
    DEFAULT_MEMBER_RHYTHM_PREFERENCES.carry_forward_backlog_prompt_max_frequency
  )
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!prefs) return
    setFallback(prefs.carry_forward_fallback)
    setBackburnerDays(prefs.carry_forward_backburner_days)
    setBacklogThreshold(prefs.carry_forward_backlog_threshold)
    setBacklogFrequency(prefs.carry_forward_backlog_prompt_max_frequency)
  }, [prefs])

  const markDirty = () => {
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    await updatePrefs.mutateAsync({
      memberId,
      updates: {
        carry_forward_fallback: fallback,
        carry_forward_backburner_days: backburnerDays,
        carry_forward_backlog_threshold: backlogThreshold,
        carry_forward_backlog_prompt_max_frequency: backlogFrequency,
      },
    })
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) return null

  return (
    <section>
      <h2
        className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Archive size={12} />
        Carry Forward — {memberName}
      </h2>
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          What happens to tasks when their due date passes and they're not done?
        </p>

        <div className="space-y-2 mb-4">
          {OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-3 p-2 rounded-md cursor-pointer"
              style={{
                background:
                  fallback === opt.value
                    ? 'color-mix(in srgb, var(--color-accent-deep) 8%, transparent)'
                    : 'transparent',
              }}
            >
              <input
                type="radio"
                name="carry-forward-fallback"
                value={opt.value}
                checked={fallback === opt.value}
                onChange={() => {
                  setFallback(opt.value)
                  markDirty()
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {opt.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {opt.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Backburner days (only visible when that option is selected) */}
        {fallback === 'backburner' && (
          <div className="mb-4">
            <label
              className="text-xs font-medium block mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Move to Backburner after how many days untouched?
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={backburnerDays}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!Number.isNaN(v)) {
                  setBackburnerDays(v)
                  markDirty()
                }
              }}
              className="text-sm rounded-md px-3 py-2 w-24"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-input)',
              }}
            />
            <span
              className="ml-2 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              days
            </span>
          </div>
        )}

        {/* Backlog threshold prompt */}
        <div
          className="pt-3 mt-3"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Show a gentle sweep prompt when
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min={1}
              max={100}
              value={backlogThreshold}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!Number.isNaN(v)) {
                  setBacklogThreshold(v)
                  markDirty()
                }
              }}
              className="text-sm rounded-md px-3 py-2 w-20"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-input)',
              }}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              or more tasks are older than 14 days, at most
            </span>
            <select
              value={backlogFrequency}
              onChange={e => {
                setBacklogFrequency(e.target.value as BacklogPromptFrequency)
                markDirty()
              }}
              className="text-sm rounded-md px-2 py-1.5"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-input)',
              }}
            >
              <option value="weekly">once per week</option>
              <option value="daily">once per day</option>
            </select>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-4 flex items-center justify-end gap-3">
          {saved && (
            <span
              className="text-xs inline-flex items-center gap-1"
              style={{ color: 'var(--color-accent-deep)' }}
            >
              <Check size={12} />
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || updatePrefs.isPending}
            className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-40"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {updatePrefs.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  )
}
