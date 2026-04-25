// PRD-28 Path X — Bulk Configure Allowance Modal
//
// Worker ALLOWANCE-COMPLETE Row 4 (generalized NEW-SS).
//
// Founder request 2026-04-24: "I'd also really like if there was a section
// for 'Apply to All Selected' where you can bulk configure each kid for
// multiple things, not just grace. Because it would have been nice to go
// in and set allowance schedules for all of them at the same time, set
// the bonus ones at the same time, and set grace at the same time."
//
// Flow:
//   1. Mom opens modal from AllowanceSettingsPage (primary) or
//      ChildAllowanceConfig (secondary).
//   2. Member pill picker at top — Convention #119 compact colored pills.
//      Each-mode only (bulk configure is per-kid by definition).
//   3. Sections for each field group (Schedule, Bonus, Grace Settings,
//      Makeup / Extra Credit). Each field has a "Apply to selected?"
//      checkbox defaulting to OFF — ONLY checked fields submit on save.
//      Protects mom from accidentally overwriting settings she's
//      personalized per-kid.
//   4. Separate "Mark grace days for selected" section uses the existing
//      useAddGraceDay hook (one call per selected member) since grace day
//      marks write to allowance_periods, not allowance_configs.
//   5. "Save selected" button at bottom fires useBulkUpsertAllowanceConfig
//      + fan-out useAddGraceDay calls as appropriate.
//
// Per founder Q1 for Row 7 (NEW-TT per-day grace mode): this modal does
// NOT expose mode selection yet. When Row 7 lands, the grace-day-marking
// section will get a mode picker for multi-member marks.

import { useMemo, useState } from 'react'
import { X, CheckSquare, Square } from 'lucide-react'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useAllowanceConfigs,
  useBulkUpsertAllowanceConfig,
  useAddGraceDay,
  type GraceDayEntry,
  type GraceDayMode,
  normalizeGraceDayEntry,
} from '@/hooks/useFinancial'
import { supabase } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/memberColors'
import { GraceDayCalendar } from './GraceDayCalendar'
import type {
  AllowanceConfigInput,
  BonusType,
  PeriodStartDay,
  RoundingBehavior,
} from '@/types/financial'
import { PERIOD_START_DAY_LABELS } from '@/types/financial'

interface BulkGraceDraft {
  date: string
  mode: GraceDayMode
}

interface BulkConfigureAllowanceModalProps {
  familyId: string
  isOpen: boolean
  onClose: () => void
  /** Seed selection — e.g. when opened from a per-child config, that
   *  child's ID can pre-select so mom starts with at least one kid. */
  initialMemberIds?: string[]
}

interface ApplyableField<T> {
  applied: boolean
  value: T
}

interface BulkForm {
  // Schedule
  period_start_day: ApplyableField<PeriodStartDay>
  calculation_time: ApplyableField<string>
  // Bonus
  bonus_threshold: ApplyableField<number>
  bonus_type: ApplyableField<BonusType>
  bonus_percentage: ApplyableField<number>
  bonus_flat_amount: ApplyableField<number>
  rounding_behavior: ApplyableField<RoundingBehavior>
  // Grace / Makeup / Extra Credit toggles
  grace_days_enabled: ApplyableField<boolean>
  makeup_window_enabled: ApplyableField<boolean>
  makeup_window_days: ApplyableField<number>
  extra_credit_enabled: ApplyableField<boolean>
  // Grace day marking (per-period, fan-out). Calendar picker version
  // (GRACE-CALENDAR 2026-04-25): draft state holds {date, mode} pairs
  // so mom can mark Skip vs Keep credit per-day in the bulk modal,
  // matching the per-child surface.
  grace_days_to_mark: ApplyableField<BulkGraceDraft[]>
}

const DEFAULT_FORM: BulkForm = {
  period_start_day: { applied: false, value: 'sunday' },
  calculation_time: { applied: false, value: '23:59:00' },
  bonus_threshold: { applied: false, value: 90 },
  bonus_type: { applied: false, value: 'flat' },
  bonus_percentage: { applied: false, value: 20 },
  bonus_flat_amount: { applied: false, value: 5 },
  rounding_behavior: { applied: false, value: 'nearest_cent' },
  grace_days_enabled: { applied: false, value: true },
  makeup_window_enabled: { applied: false, value: false },
  makeup_window_days: { applied: false, value: 2 },
  extra_credit_enabled: { applied: false, value: false },
  grace_days_to_mark: { applied: false, value: [] },
}

export function BulkConfigureAllowanceModal({
  familyId,
  isOpen,
  onClose,
  initialMemberIds = [],
}: BulkConfigureAllowanceModalProps) {
  const { data: membersData } = useFamilyMembers(familyId)
  const members = membersData ?? []
  const { data: configs } = useAllowanceConfigs(familyId)
  const bulkUpsert = useBulkUpsertAllowanceConfig()
  const addGraceDay = useAddGraceDay()

  // Filter to kids (role = 'member') who have allowance-eligible state.
  const eligibleKids = useMemo(
    () => members.filter(m => m.role === 'member' && m.is_active),
    [members],
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialMemberIds),
  )
  const [form, setForm] = useState<BulkForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Reference period for the calendar — pick the active period of the
  // first selected kid (any of them works since all 4 founder kids share
  // a Sun→Sat period today; if mom expands to staggered periods, this
  // picks the widest-range one for safety).
  const [referencePeriod, setReferencePeriod] = useState<{
    period_start: string
    period_end: string
  } | null>(null)
  useMemo(() => {
    if (selectedIds.size === 0) {
      setReferencePeriod(null)
      return
    }
    // Fire async fetch outside useMemo (intentional — useMemo here is
    // a side-effect dispatcher, not a memoizer; cheap fan-out, only
    // re-runs when selection changes).
    void (async () => {
      const firstId = Array.from(selectedIds)[0]
      const { data: period } = await supabase
        .from('allowance_periods')
        .select('period_start, period_end')
        .eq('family_member_id', firstId)
        .in('status', ['active', 'makeup_window'])
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (period) {
        setReferencePeriod({
          period_start: period.period_start as string,
          period_end: period.period_end as string,
        })
      } else {
        setReferencePeriod(null)
      }
    })()
  }, [selectedIds])
  const [submitResult, setSubmitResult] = useState<{
    configSuccess: number
    configFailed: number
    graceSuccess: number
    graceFailed: number
    errors: string[]
  } | null>(null)

  if (!isOpen) return null

  const toggleMember = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setAllMembers = (all: boolean) => {
    setSelectedIds(all ? new Set(eligibleKids.map(k => k.id)) : new Set())
  }

  const updateField = <K extends keyof BulkForm>(
    key: K,
    patch: Partial<BulkForm[K]>,
  ) => {
    setForm(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch } as BulkForm[K],
    }))
  }

  const appliedFieldCount = Object.values(form).filter(f => f.applied).length

  const handleSave = async () => {
    if (selectedIds.size === 0 || appliedFieldCount === 0) return

    setSubmitting(true)
    const result = {
      configSuccess: 0,
      configFailed: 0,
      graceSuccess: 0,
      graceFailed: 0,
      errors: [] as string[],
    }

    // Part 1: build per-member config upsert rows for applied fields.
    const configFields: Partial<AllowanceConfigInput> = {}
    if (form.period_start_day.applied) configFields.period_start_day = form.period_start_day.value
    if (form.calculation_time.applied) configFields.calculation_time = form.calculation_time.value
    if (form.bonus_threshold.applied) configFields.bonus_threshold = form.bonus_threshold.value
    if (form.bonus_type.applied) configFields.bonus_type = form.bonus_type.value
    if (form.bonus_percentage.applied) configFields.bonus_percentage = form.bonus_percentage.value
    if (form.bonus_flat_amount.applied) configFields.bonus_flat_amount = form.bonus_flat_amount.value
    if (form.rounding_behavior.applied) configFields.rounding_behavior = form.rounding_behavior.value
    if (form.grace_days_enabled.applied) configFields.grace_days_enabled = form.grace_days_enabled.value
    if (form.makeup_window_enabled.applied) configFields.makeup_window_enabled = form.makeup_window_enabled.value
    if (form.makeup_window_days.applied) configFields.makeup_window_days = form.makeup_window_days.value
    if (form.extra_credit_enabled.applied) configFields.extra_credit_enabled = form.extra_credit_enabled.value

    if (Object.keys(configFields).length > 0) {
      // Read existing configs so upsert merge behavior is predictable and
      // we can write correct base rows if any member has no config yet.
      const existingById = new Map(
        (configs ?? []).map(c => [c.family_member_id, c]),
      )
      const rows: AllowanceConfigInput[] = []
      for (const memberId of selectedIds) {
        const existing = existingById.get(memberId)
        rows.push({
          family_id: familyId,
          family_member_id: memberId,
          // For missing configs, supply mandatory base fields. For existing
          // configs, upsert merges so we only need to ship the applied
          // fields + the FK keys — but passing existing values is safe
          // and keeps the DB return shape stable.
          enabled: existing?.enabled ?? true,
          weekly_amount: existing?.weekly_amount ?? 10,
          calculation_approach: existing?.calculation_approach ?? 'dynamic',
          ...configFields,
        })
      }
      try {
        await bulkUpsert.mutateAsync(rows)
        result.configSuccess = rows.length
      } catch (err) {
        result.configFailed = rows.length
        result.errors.push(`bulk upsert failed: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }

    // Part 2: grace day marking — fan-out per-member addGraceDay call.
    // Each member's active period is looked up; if none exists, the mark
    // is skipped for that member (surfaced as a fail in the result).
    if (form.grace_days_to_mark.applied) {
      // Dedupe by date (last mode wins if mom toggled the same date twice
      // — the calendar shouldn't allow this but defend against it anyway).
      const draftMap = new Map<string, GraceDayMode>()
      for (const draft of form.grace_days_to_mark.value) {
        if (draft.date) draftMap.set(draft.date, draft.mode)
      }
      const drafts = Array.from(draftMap.entries()).map(([date, mode]) => ({ date, mode }))

      if (drafts.length > 0) {
        for (const memberId of selectedIds) {
          // Look up each member's active period ONCE, then fan out across all
          // selected dates. Avoids N×D round trips when picking 5 days for 4 kids.
          const { data: period } = await supabase
            .from('allowance_periods')
            .select('id')
            .eq('family_member_id', memberId)
            .in('status', ['active', 'makeup_window'])
            .order('period_start', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!period) {
            result.graceFailed += drafts.length
            const member = members.find(m => m.id === memberId)
            result.errors.push(`no active period for ${member?.display_name ?? memberId}`)
            continue
          }

          for (const draft of drafts) {
            try {
              await addGraceDay.mutateAsync({
                periodId: period.id,
                date: draft.date,
                mode: draft.mode,
              })
              result.graceSuccess++
            } catch (err) {
              result.graceFailed++
              result.errors.push(`grace mark failed for ${draft.date}: ${err instanceof Error ? err.message : 'unknown'}`)
            }
          }
        }
      }
    }

    setSubmitResult(result)
    setSubmitting(false)
  }

  const toDatetimeInputValue = (hhmmss: string) => {
    // `calculation_time` is TIME string — return as HH:MM for <input type="time">.
    return hhmmss.slice(0, 5)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk Configure Allowance"
      data-testid="bulk-configure-allowance-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--color-text-primary) 40%, transparent)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border-default, var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--font-size-lg)',
                fontWeight: 700,
                color: 'var(--color-text-heading)',
              }}
            >
              Bulk Configure Allowance
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Select kids, pick which fields to update, hit save. Only fields you
              tick "Apply" will change — everything else stays as you had it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {/* Member Picker — Convention #119 compact colored pills */}
          <section style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-heading)',
                }}
              >
                Apply changes to
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAllMembers(true)}
                  style={pillStyleUnselected}
                  data-testid="bulk-select-all"
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setAllMembers(false)}
                  style={pillStyleUnselected}
                  data-testid="bulk-select-none"
                >
                  None
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {eligibleKids.map(kid => {
                const selected = selectedIds.has(kid.id)
                const color = getMemberColor(kid)
                return (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => toggleMember(kid.id)}
                    data-testid={`bulk-member-pill-${kid.id}`}
                    aria-pressed={selected}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: selected ? color : 'transparent',
                      color: selected
                        ? 'var(--color-text-on-primary)'
                        : 'var(--color-text-primary)',
                      border: `2px solid ${color}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {kid.display_name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              {selectedIds.size} of {eligibleKids.length} selected
            </p>
          </section>

          {/* Schedule */}
          <Section title="Schedule">
            <ApplyRow
              label="Week starts on"
              applied={form.period_start_day.applied}
              onApplyChange={v => updateField('period_start_day', { applied: v })}
            >
              <select
                value={form.period_start_day.value}
                onChange={e =>
                  updateField('period_start_day', { value: e.target.value as PeriodStartDay })
                }
                style={selectStyle}
              >
                {Object.entries(PERIOD_START_DAY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </ApplyRow>
            <ApplyRow
              label="Calculation time"
              applied={form.calculation_time.applied}
              onApplyChange={v => updateField('calculation_time', { applied: v })}
            >
              <input
                type="time"
                value={toDatetimeInputValue(form.calculation_time.value)}
                onChange={e =>
                  updateField('calculation_time', { value: `${e.target.value}:00` })
                }
                style={inputStyle}
              />
            </ApplyRow>
          </Section>

          {/* Bonus */}
          <Section title="Bonus & Thresholds">
            <ApplyRow
              label="Bonus threshold (%)"
              applied={form.bonus_threshold.applied}
              onApplyChange={v => updateField('bonus_threshold', { applied: v })}
            >
              <input
                type="number"
                min={0}
                max={100}
                value={form.bonus_threshold.value}
                onChange={e => updateField('bonus_threshold', { value: Number(e.target.value) })}
                style={{ ...inputStyle, width: '5rem' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Bonus type"
              applied={form.bonus_type.applied}
              onApplyChange={v => updateField('bonus_type', { applied: v })}
            >
              <select
                value={form.bonus_type.value}
                onChange={e => updateField('bonus_type', { value: e.target.value as BonusType })}
                style={selectStyle}
              >
                <option value="percentage">% of allowance</option>
                <option value="flat">Flat $</option>
              </select>
            </ApplyRow>
            <ApplyRow
              label="Bonus percentage"
              applied={form.bonus_percentage.applied}
              onApplyChange={v => updateField('bonus_percentage', { applied: v })}
            >
              <input
                type="number"
                min={0}
                max={100}
                value={form.bonus_percentage.value}
                onChange={e =>
                  updateField('bonus_percentage', { value: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: '5rem' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Bonus flat amount ($)"
              applied={form.bonus_flat_amount.applied}
              onApplyChange={v => updateField('bonus_flat_amount', { applied: v })}
            >
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.bonus_flat_amount.value}
                onChange={e =>
                  updateField('bonus_flat_amount', { value: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: '5rem' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Rounding"
              applied={form.rounding_behavior.applied}
              onApplyChange={v => updateField('rounding_behavior', { applied: v })}
            >
              <select
                value={form.rounding_behavior.value}
                onChange={e =>
                  updateField('rounding_behavior', { value: e.target.value as RoundingBehavior })
                }
                style={selectStyle}
              >
                <option value="round_up">Round up</option>
                <option value="round_down">Round down</option>
                <option value="nearest_cent">Nearest cent</option>
              </select>
            </ApplyRow>
          </Section>

          {/* Grace Settings */}
          <Section title="Grace Settings">
            <ApplyRow
              label="Grace days enabled"
              applied={form.grace_days_enabled.applied}
              onApplyChange={v => updateField('grace_days_enabled', { applied: v })}
            >
              <input
                type="checkbox"
                checked={form.grace_days_enabled.value}
                onChange={e => updateField('grace_days_enabled', { value: e.target.checked })}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Mark grace days"
              applied={form.grace_days_to_mark.applied}
              onApplyChange={v => updateField('grace_days_to_mark', { applied: v })}
              helperText="Tap days to cycle Skip → Keep credit → Unmarked. Fan-outs across each selected kid's active period on Save."
            >
              {/* The ApplyRow's children render alongside the label; for
                  the calendar we want it BELOW the row instead. Render
                  null here and the calendar drops in just under via the
                  conditional block. */}
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {form.grace_days_to_mark.value.length === 0
                  ? 'no days marked'
                  : `${form.grace_days_to_mark.value.length} day${form.grace_days_to_mark.value.length === 1 ? '' : 's'} marked`}
              </span>
            </ApplyRow>
            {form.grace_days_to_mark.applied && (
              <div style={{ marginTop: '-0.25rem', paddingLeft: '1.625rem' }}>
                {referencePeriod ? (
                  <GraceDayCalendar
                    periodStart={referencePeriod.period_start}
                    periodEnd={referencePeriod.period_end}
                    graceDays={form.grace_days_to_mark.value as GraceDayEntry[]}
                    onChange={(next) => {
                      // Calendar gives us full new state; convert to BulkGraceDraft[]
                      const drafts: BulkGraceDraft[] = next.map(entry => {
                        const norm = normalizeGraceDayEntry(entry)
                        return { date: norm.date, mode: norm.mode }
                      })
                      updateField('grace_days_to_mark', { value: drafts })
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      background: 'var(--color-bg-secondary)',
                      border: '1px dashed var(--color-border-default, var(--color-border))',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {selectedIds.size === 0
                      ? 'Pick at least one kid above to load the calendar.'
                      : 'No active period for the first selected kid — calendar unavailable.'}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Makeup + Extra Credit */}
          <Section title="Makeup & Extra Credit">
            <ApplyRow
              label="Makeup window enabled"
              applied={form.makeup_window_enabled.applied}
              onApplyChange={v => updateField('makeup_window_enabled', { applied: v })}
            >
              <input
                type="checkbox"
                checked={form.makeup_window_enabled.value}
                onChange={e => updateField('makeup_window_enabled', { value: e.target.checked })}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Makeup window days"
              applied={form.makeup_window_days.applied}
              onApplyChange={v => updateField('makeup_window_days', { applied: v })}
            >
              <input
                type="number"
                min={1}
                max={7}
                value={form.makeup_window_days.value}
                onChange={e =>
                  updateField('makeup_window_days', { value: Number(e.target.value) })
                }
                style={{ ...inputStyle, width: '4rem' }}
              />
            </ApplyRow>
            <ApplyRow
              label="Extra credit enabled"
              applied={form.extra_credit_enabled.applied}
              onApplyChange={v => updateField('extra_credit_enabled', { applied: v })}
            >
              <input
                type="checkbox"
                checked={form.extra_credit_enabled.value}
                onChange={e => updateField('extra_credit_enabled', { value: e.target.checked })}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
            </ApplyRow>
          </Section>

          {submitResult && (
            <div
              data-testid="bulk-submit-result"
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default, var(--color-border))',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {submitResult.errors.length === 0 ? 'Saved' : 'Saved with issues'}
              </div>
              {submitResult.configSuccess > 0 && (
                <div>Config: {submitResult.configSuccess} kids updated</div>
              )}
              {submitResult.graceSuccess > 0 && (
                <div>Grace day: marked for {submitResult.graceSuccess} kids</div>
              )}
              {submitResult.configFailed > 0 && (
                <div style={{ color: 'var(--color-text-muted)' }}>
                  Config failed: {submitResult.configFailed}
                </div>
              )}
              {submitResult.graceFailed > 0 && (
                <div style={{ color: 'var(--color-text-muted)' }}>
                  Grace mark failed: {submitResult.graceFailed}
                </div>
              )}
              {submitResult.errors.length > 0 && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}>
                    Details
                  </summary>
                  <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: 'var(--font-size-xs)' }}>
                    {submitResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--color-border-default, var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {selectedIds.size} kid{selectedIds.size === 1 ? '' : 's'} × {appliedFieldCount} field
            {appliedFieldCount === 1 ? '' : 's'} to apply
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={buttonSecondaryStyle}
              data-testid="bulk-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                submitting ||
                selectedIds.size === 0 ||
                appliedFieldCount === 0
              }
              data-testid="bulk-save"
              style={{
                ...buttonPrimaryStyle,
                opacity:
                  submitting || selectedIds.size === 0 || appliedFieldCount === 0
                    ? 0.5
                    : 1,
                cursor:
                  submitting || selectedIds.size === 0 || appliedFieldCount === 0
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {submitting ? 'Saving…' : 'Save selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Local helpers ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: '1.25rem',
        padding: '0.75rem',
        borderRadius: 'var(--vibe-radius-card, 10px)',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default, var(--color-border))',
      }}
    >
      <h4
        style={{
          margin: '0 0 0.625rem 0',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-heading)',
        }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {children}
      </div>
    </section>
  )
}

function ApplyRow({
  label,
  applied,
  onApplyChange,
  children,
  helperText,
}: {
  label: string
  applied: boolean
  onApplyChange: (v: boolean) => void
  children: React.ReactNode
  helperText?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: applied ? 1 : 0.6,
      }}
    >
      <button
        type="button"
        onClick={() => onApplyChange(!applied)}
        aria-label={`Apply ${label}`}
        aria-pressed={applied}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: applied ? 'var(--color-btn-primary-bg)' : 'var(--color-text-muted)',
        }}
      >
        {applied ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>
      <div style={{ flex: 1 }}>
        <label
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </label>
        {helperText && (
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {helperText}
          </div>
        )}
      </div>
      <div style={{ pointerEvents: applied ? 'auto' : 'none' }}>
        {children}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--vibe-radius-input, 6px)',
  border: '1px solid var(--color-border-default, var(--color-border))',
  backgroundColor: 'var(--color-bg-card)',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

const pillStyleUnselected: React.CSSProperties = {
  padding: '0.25rem 0.625rem',
  borderRadius: '999px',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 500,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-default, var(--color-border))',
}

const buttonPrimaryStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--vibe-radius-input, 6px)',
  background: 'var(--color-btn-primary-bg)',
  color: 'var(--color-text-on-primary)',
  border: 'none',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
}

const buttonSecondaryStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--vibe-radius-input, 6px)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-default, var(--color-border))',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
}
