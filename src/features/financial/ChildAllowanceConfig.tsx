// PRD-28 Screen 2: Per-Child Allowance Configuration
// 8 collapsible sections. All 3 approaches. Dual nav path.

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, Eye, EyeOff, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useAllowanceConfig, useUpsertAllowanceConfig, useStartAllowancePeriod, useActivePeriod } from '@/hooks/useFinancial'
import {
  CALCULATION_APPROACH_LABELS,
  PERIOD_START_DAY_LABELS,
  type AllowanceConfigInput,
  type BonusType,
  type CalculationApproach,
  type PeriodStartDay,
  type RoundingBehavior,
} from '@/types/financial'
import { getMemberColor } from '@/lib/memberColors'
import { GraceDaysManager } from './GraceDaysManager'
import { PreviewThisWeekPanel } from './PreviewThisWeekPanel'
import { BulkConfigureAllowanceModal } from './BulkConfigureAllowanceModal'

export function ChildAllowanceConfigPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { data: family } = useFamily()
  const { data: membersData } = useFamilyMembers(family?.id)
  const members = membersData ?? []
  const { data: config, isLoading } = useAllowanceConfig(memberId)
  const { data: activePeriod } = useActivePeriod(memberId)
  const upsert = useUpsertAllowanceConfig()
  const startPeriod = useStartAllowancePeriod()

  const member = members.find(m => m.id === memberId)
  const memberColor = member ? getMemberColor(member) : 'var(--color-btn-primary-bg)'
  const isIndependent = member?.dashboard_mode === 'independent'

  // Local form state — debounced auto-save
  const [form, setForm] = useState<Partial<AllowanceConfigInput>>({})
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  // Initialize form from config
  useEffect(() => {
    if (config) {
      setForm({
        enabled: config.enabled,
        weekly_amount: config.weekly_amount,
        calculation_approach: config.calculation_approach,
        default_point_value: config.default_point_value,
        minimum_threshold: config.minimum_threshold,
        bonus_threshold: config.bonus_threshold,
        bonus_type: config.bonus_type ?? 'percentage',
        bonus_percentage: config.bonus_percentage,
        bonus_flat_amount: config.bonus_flat_amount ?? 0,
        rounding_behavior: config.rounding_behavior,
        grace_days_enabled: config.grace_days_enabled,
        makeup_window_enabled: config.makeup_window_enabled,
        makeup_window_days: config.makeup_window_days,
        extra_credit_enabled: config.extra_credit_enabled,
        child_can_see_finances: config.child_can_see_finances,
        period_start_day: config.period_start_day,
        calculation_time: config.calculation_time,
        loans_enabled: config.loans_enabled,
        loan_interest_enabled: config.loan_interest_enabled,
        loan_default_interest_rate: config.loan_default_interest_rate,
        loan_interest_period: config.loan_interest_period,
        loan_max_amount: config.loan_max_amount,
      })
    } else if (member) {
      // Defaults for new config
      setForm({
        enabled: true,
        weekly_amount: member.age ? member.age * 1 : 10,
        calculation_approach: 'dynamic',
        default_point_value: 1,
        minimum_threshold: 0,
        bonus_threshold: 90,
        bonus_type: 'flat',
        bonus_percentage: 20,
        bonus_flat_amount: 5,
        rounding_behavior: 'nearest_cent',
        grace_days_enabled: true,
        makeup_window_enabled: false,
        makeup_window_days: 2,
        extra_credit_enabled: false,
        child_can_see_finances: isIndependent,
        period_start_day: 'sunday',
        calculation_time: '23:59:00',
        loans_enabled: false,
        loan_interest_enabled: false,
        loan_default_interest_rate: 0,
        loan_interest_period: 'monthly',
        loan_max_amount: null,
      })
    }
  }, [config, member, isIndependent])

  const autoSave = useCallback((updates: Partial<AllowanceConfigInput>) => {
    const next = { ...form, ...updates }
    setForm(next)

    if (saveTimer) clearTimeout(saveTimer)
    const timer = setTimeout(() => {
      if (!family?.id || !memberId) return
      upsert.mutate({
        family_id: family.id,
        family_member_id: memberId,
        ...next,
      })
    }, 800)
    setSaveTimer(timer)
  }, [form, family?.id, memberId, upsert, saveTimer])

  // Start first period on initial save.
  // Row 9 SCOPE-3.F14: guard against React strict-mode double-fire of the
  // effect. Without !startPeriod.isPending, two back-to-back effect runs can
  // both pass `!activePeriod` before the first mutation settles, producing
  // two active rows. The partial unique index in migration 100163 is the
  // DB-level safeguard; this guard keeps the UI from emitting the doomed
  // second request in the first place.
  useEffect(() => {
    if (
      config?.enabled &&
      !activePeriod &&
      !startPeriod.isPending &&
      family?.id &&
      memberId
    ) {
      startPeriod.mutate({
        familyId: family.id,
        memberId,
        weeklyAmount: config.weekly_amount,
      })
    }
  }, [config?.enabled, activePeriod, family?.id, memberId, startPeriod])

  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
  }

  return (
    <div className="density-comfortable max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/settings/allowance"
          className="p-2 rounded-lg transition-colors hidden md:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
            {member?.display_name ?? 'Child'} — Allowance
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Changes save automatically
          </p>
        </div>
      </div>

      {/* Master toggle */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-bg-card)', border: `2px solid ${memberColor}` }}
      >
        <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Allowance enabled
        </span>
        <ToggleSwitch
          value={form.enabled ?? true}
          onChange={v => autoSave({ enabled: v })}
        />
      </div>

      {/* Section 1: Basic Setup */}
      <CollapsibleSection title="Basic Setup" defaultOpen>
        <div className="space-y-4">
          <NumberInput
            label="Weekly allowance amount"
            prefix="$"
            value={form.weekly_amount ?? 0}
            onChange={v => autoSave({ weekly_amount: v })}
            step={0.5}
            min={0}
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Calculation approach
            </label>
            <div className="space-y-2">
              {(['fixed', 'dynamic', 'points_weighted'] as CalculationApproach[]).map(approach => (
                <label
                  key={approach}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: form.calculation_approach === approach
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)'
                      : 'var(--color-bg-secondary)',
                    border: form.calculation_approach === approach
                      ? '1px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                  }}
                >
                  <input
                    type="radio"
                    name="approach"
                    checked={form.calculation_approach === approach}
                    onChange={() => autoSave({ calculation_approach: approach })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>
                      {CALCULATION_APPROACH_LABELS[approach].label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {CALCULATION_APPROACH_LABELS[approach].description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Points Configuration (Points-Weighted only) */}
      {form.calculation_approach === 'points_weighted' && (
        <CollapsibleSection title="Points Configuration">
          <NumberInput
            label="Default point value per task"
            value={form.default_point_value ?? 1}
            onChange={v => autoSave({ default_point_value: v })}
            min={1}
            max={100}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Override per-task in the task creation modal. Higher points = more impact on allowance.
          </p>
        </CollapsibleSection>
      )}

      {/* Section 4: Bonus & Thresholds */}
      <CollapsibleSection title="Bonus & Thresholds">
        <div className="space-y-4">
          <NumberInput
            label="Minimum threshold (%)"
            value={form.minimum_threshold ?? 0}
            onChange={v => autoSave({ minimum_threshold: v })}
            min={0}
            max={100}
            suffix="%"
          />
          <p className="text-xs -mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Below this %, child earns nothing. 0 = no minimum.
          </p>

          <NumberInput
            label="Bonus threshold (%)"
            value={form.bonus_threshold ?? 90}
            onChange={v => autoSave({ bonus_threshold: v })}
            min={0}
            max={100}
            suffix="%"
          />

          {/* Bonus mode: percentage or flat dollar */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Bonus amount
            </label>
            <div className="flex gap-2 mb-3">
              {([
                { value: 'percentage' as BonusType, label: '% of allowance' },
                { value: 'flat' as BonusType, label: 'Flat $' },
              ]).map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm"
                  style={{
                    backgroundColor: form.bonus_type === opt.value
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                      : 'var(--color-bg-secondary)',
                    border: form.bonus_type === opt.value
                      ? '1px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                    color: form.bonus_type === opt.value
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-text-secondary)',
                    fontWeight: form.bonus_type === opt.value ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="bonus-type"
                    checked={form.bonus_type === opt.value}
                    onChange={() => autoSave({ bonus_type: opt.value })}
                    style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {form.bonus_type === 'flat' ? (
              <NumberInput
                label="Bonus amount"
                prefix="$"
                value={form.bonus_flat_amount ?? 0}
                onChange={v => autoSave({ bonus_flat_amount: v })}
                min={0}
                step={0.5}
              />
            ) : (
              <NumberInput
                label="Bonus percentage"
                value={form.bonus_percentage ?? 20}
                onChange={v => autoSave({ bonus_percentage: v })}
                min={0}
                max={100}
                suffix="% extra"
              />
            )}

            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {form.bonus_type === 'flat'
                ? `Earns an extra $${(form.bonus_flat_amount ?? 0).toFixed(2)} when completing ${form.bonus_threshold ?? 90}%+ of tasks`
                : `Earns ${form.bonus_percentage ?? 20}% extra ($${((form.weekly_amount ?? 0) * (form.bonus_percentage ?? 20) / 100).toFixed(2)}) when completing ${form.bonus_threshold ?? 90}%+ of tasks`
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
              Rounding
            </label>
            <select
              value={form.rounding_behavior ?? 'nearest_cent'}
              onChange={e => autoSave({ rounding_behavior: e.target.value as RoundingBehavior })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="round_up">Round up</option>
              <option value="round_down">Round down</option>
              <option value="nearest_cent">Nearest cent</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 5: Grace Mechanisms */}
      <CollapsibleSection title="Grace Mechanisms">
        <div className="space-y-4">
          <ToggleRow
            label="Grace Days"
            description="Mark specific days when tasks don't count against allowance"
            value={form.grace_days_enabled ?? true}
            onChange={v => autoSave({ grace_days_enabled: v })}
          />
          {/* NEW-GG: live-period day-picker. Only renders when there is an
              active period. Retroactive marking on past periods is filed as
              follow-up NEW-MM per orchestrator 2026-04-24. */}
          {activePeriod && (
            <GraceDaysManager
              periodId={activePeriod.id}
              periodStart={activePeriod.period_start}
              periodEnd={activePeriod.period_end}
              graceDays={(activePeriod.grace_days as string[]) ?? []}
              disabled={!(form.grace_days_enabled ?? true)}
            />
          )}
          {/* NEW-RR: when mom has grace days enabled but no active period
              exists (edge case — config save succeeded but period insert
              failed, or mom just enabled a disabled config), the toggle
              appears on but there's nothing to mark. Surface an inline
              empty-state with a manual "Start period now" CTA instead of
              showing the toggle with no picker below it. */}
          {!activePeriod && (form.grace_days_enabled ?? true) && (
            <div
              data-testid="grace-days-no-period-empty"
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px dashed var(--color-border-default, var(--color-border))',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                Grace days are turned on, but no active allowance period
                exists yet. Tap below to start one now, then come back to
                mark grace days.
              </div>
              <button
                type="button"
                disabled={startPeriod.isPending}
                onClick={() => {
                  if (family?.id && memberId && form.weekly_amount != null) {
                    startPeriod.mutate({
                      familyId: family.id,
                      memberId,
                      weeklyAmount: form.weekly_amount,
                    })
                  }
                }}
                data-testid="grace-days-start-period"
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  background: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary)',
                  border: 'none',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  cursor: startPeriod.isPending ? 'not-allowed' : 'pointer',
                  opacity: startPeriod.isPending ? 0.6 : 1,
                }}
              >
                {startPeriod.isPending ? 'Starting…' : 'Start period now'}
              </button>
            </div>
          )}
          <ToggleRow
            label="Makeup Window"
            description="Extra time after the period ends to complete missed tasks"
            value={form.makeup_window_enabled ?? false}
            onChange={v => autoSave({ makeup_window_enabled: v })}
          />
          {form.makeup_window_enabled && (
            <NumberInput
              label="Makeup window (days)"
              value={form.makeup_window_days ?? 2}
              onChange={v => autoSave({ makeup_window_days: v })}
              min={1}
              max={7}
            />
          )}
          <ToggleRow
            label="Extra Credit"
            description="Allow extra tasks to offset missed ones (capped at 100%)"
            value={form.extra_credit_enabled ?? false}
            onChange={v => autoSave({ extra_credit_enabled: v })}
          />
        </div>
      </CollapsibleSection>

      {/* Section 6: Visibility */}
      <CollapsibleSection title="Visibility">
        <ToggleRow
          label="Child can see financial details"
          description={
            form.child_can_see_finances
              ? 'Shows dollar amounts, balance, and transaction history'
              : 'Shows completion percentage only — no dollar amounts'
          }
          value={form.child_can_see_finances ?? isIndependent}
          onChange={v => autoSave({ child_can_see_finances: v })}
          icon={form.child_can_see_finances ? Eye : EyeOff}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Play mode children always see percentage only, regardless of this setting.
        </p>
      </CollapsibleSection>

      {/* Section 7: Period Configuration */}
      <CollapsibleSection title="Period Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
              Week starts on
            </label>
            <select
              value={form.period_start_day ?? 'sunday'}
              onChange={e => autoSave({ period_start_day: e.target.value as PeriodStartDay })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {Object.entries(PERIOD_START_DAY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Weekly periods only. Biweekly and monthly coming in a future update.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 8: Loan Settings */}
      <CollapsibleSection title="Loan Settings">
        <div className="space-y-4">
          <ToggleRow
            label="Allow loans"
            description="Child can borrow against future earnings"
            value={form.loans_enabled ?? false}
            onChange={v => autoSave({ loans_enabled: v })}
          />
          {form.loans_enabled && (
            <>
              <ToggleRow
                label="Interest enabled"
                description="Charge interest on outstanding loans"
                value={form.loan_interest_enabled ?? false}
                onChange={v => autoSave({ loan_interest_enabled: v })}
              />
              {form.loan_interest_enabled && (
                <>
                  <NumberInput
                    label="Default interest rate"
                    value={form.loan_default_interest_rate ?? 0}
                    onChange={v => autoSave({ loan_default_interest_rate: v })}
                    min={0}
                    max={50}
                    step={0.5}
                    suffix="%"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
                      Interest accrual period
                    </label>
                    <select
                      value={form.loan_interest_period ?? 'monthly'}
                      onChange={e => autoSave({ loan_interest_period: e.target.value as 'weekly' | 'monthly' })}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}
              <NumberInput
                label="Maximum loan amount (optional)"
                prefix="$"
                value={form.loan_max_amount ?? 0}
                onChange={v => autoSave({ loan_max_amount: v || null })}
                min={0}
              />
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Leave at $0 for no maximum.
              </p>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* NEW-FF: Preview This Week panel. PRD-28 L228. Renders at the bottom
          of the config screen, expandable inline. */}
      {memberId && (
        <PreviewThisWeekPanel memberId={memberId} activePeriod={activePeriod} />
      )}

      {/* ALLOWANCE-EDIT-WEEK (2026-04-25): "see full week" page entry. */}
      {memberId && activePeriod && (
        <Link
          to={`/settings/allowance/${memberId}/history`}
          data-testid="open-week-edit-page"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default, var(--color-border))',
          }}
        >
          Edit past days for {member?.display_name ?? 'this child'} →
        </Link>
      )}

      {/* Path X secondary entry: mom is already focused on this kid but
          wants to "while I'm at it, also apply the same thing to the
          others". Bulk modal opens with this kid pre-selected. */}
      {family?.id && (members.filter(m => m.role === 'member' && m.is_active).length > 1) && (
        <>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            data-testid="open-bulk-configure-from-child"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-btn-primary-bg)',
              border: '1px dashed var(--color-btn-primary-bg)',
            }}
          >
            <Users size={16} />
            Apply to other kids too…
          </button>
          <BulkConfigureAllowanceModal
            familyId={family.id}
            isOpen={bulkOpen}
            onClose={() => setBulkOpen(false)}
            initialMemberIds={memberId ? [memberId] : []}
          />
        </>
      )}
    </div>
  )
}

// ── Shared Sub-components ──────────────────────────────────

function CollapsibleSection({ title, defaultOpen = false, children }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        style={{ color: 'var(--color-text-heading)' }}
      >
        {title}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{
        backgroundColor: value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-tertiary)',
        border: value ? 'none' : '1px solid var(--color-border-default, var(--color-border))',
      }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full transition-transform"
        style={{
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          transform: value ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
        }}
      />
    </button>
  )
}

function ToggleRow({ label, description, value, onChange, icon: Icon }: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
  icon?: React.ElementType
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {Icon && <Icon size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />}
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>{label}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</div>
        </div>
      </div>
      <ToggleSwitch value={value} onChange={onChange} />
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max, step, prefix, suffix }: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
        {suffix && <span className="text-sm shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{suffix}</span>}
      </div>
    </div>
  )
}
