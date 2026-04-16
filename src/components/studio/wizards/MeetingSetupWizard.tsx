/**
 * MeetingSetupWizard — Guided setup for family meetings.
 *
 * Helps mom bootstrap her entire family meeting calendar in one sitting.
 * The system knows the roster and birthdays, so it makes smart suggestions.
 *
 * Sections:
 *   1. Family Council (day picker, toggle kid agenda access)
 *   2. 1:1 Time with Kids (bulk: pick kids → timing → parent assignment → label)
 *   3. Couple Meeting (if additional_adult exists)
 *   4. Review matrix → confirm → batch create schedules + calendar events
 *
 * Uses existing SetupWizard shell, meeting_schedules table, and calendar_events.
 * No new database tables needed.
 */

import { useState, useCallback, useMemo } from 'react'
import {
  UsersRound, Heart, Check, CheckCircle2,
} from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useUpsertMeetingSchedule } from '@/hooks/useMeetings'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { localIso } from '@/utils/dates'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { RRule, type Weekday } from 'rrule'

// ── Types ──────────────────────────────────────────────────────

type TimingMode = 'birthday' | 'same_day' | 'ordinal_weekday'
type OneOnOneFrequency = 'weekly' | 'biweekly' | 'monthly'
type ParentMode = 'just_me' | 'alternate' | 'both'
type MeetingLabel = 'Date' | 'Check-in' | '1:1 Time' | 'Mentor Meeting' | string

const FREQUENCY_OPTIONS: Array<{ value: OneOnOneFrequency; label: string; desc: string }> = [
  { value: 'monthly', label: 'Monthly', desc: 'Once a month — a great starting point' },
  { value: 'biweekly', label: 'Every other week', desc: 'Twice a month — more frequent connection' },
  { value: 'weekly', label: 'Weekly', desc: 'Every week — maximum connection time' },
]

interface ChildScheduleRow {
  memberId: string
  name: string
  birthday: string | null       // ISO date string from date_of_birth
  birthdayDay: number | null    // day of month (1-31) derived from birthday
  dayOfMonth: number            // resolved day of month to use
  ordinalWeek: number           // 1-4 (1st, 2nd, 3rd, 4th)
  ordinalDayOfWeek: number      // 0=Mon..6=Sun (rrule convention)
  parentMode: ParentMode
  label: MeetingLabel
  enabled: boolean
}

const ORDINAL_LABELS = ['1st', '2nd', '3rd', '4th'] as const
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const RRULE_DAYS: Weekday[] = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU]

const LABEL_OPTIONS: MeetingLabel[] = ['Date', 'Check-in', '1:1 Time', 'Mentor Meeting']

function getBirthdayDay(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob + 'T12:00:00')  // avoid timezone shift
  return d.getDate()
}

// ── Steps ──────────────────────────────────────────────────────

function buildSteps(hasAdult: boolean, hasKids: boolean): WizardStep[] {
  const steps: WizardStep[] = []
  steps.push({ key: 'intro', title: 'Welcome' })
  if (hasKids) {
    steps.push({ key: 'family_council', title: 'Family Meeting', optional: true })
    steps.push({ key: 'pick_kids', title: 'Pick Kids' })
    steps.push({ key: 'timing', title: 'Timing' })
    steps.push({ key: 'parents', title: 'Who' })
    steps.push({ key: 'labels', title: 'Name It' })
  }
  if (hasAdult) {
    steps.push({ key: 'couple', title: 'Couple', optional: true })
  }
  steps.push({ key: 'review', title: 'Review' })
  return steps
}

// ── Component ──────────────────────────────────────────────────

interface MeetingSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: FamilyMember[]
}

export function MeetingSetupWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
}: MeetingSetupWizardProps) {
  // ── Derived data ──
  const kids = useMemo(
    () => familyMembers.filter(m =>
      m.is_active && m.relationship === 'child' && !m.out_of_nest
    ),
    [familyMembers],
  )
  const additionalAdult = useMemo(
    () => familyMembers.find(m =>
      m.is_active && m.role === 'additional_adult'
    ),
    [familyMembers],
  )

  const hasKids = kids.length > 0
  const hasAdult = !!additionalAdult

  const steps = useMemo(() => buildSteps(hasAdult, hasKids), [hasAdult, hasKids])
  const [step, setStep] = useState(0)

  // ── Family Council state ──
  const [wantFamilyCouncil, setWantFamilyCouncil] = useState(false)
  const [councilDay, setCouncilDay] = useState(6) // Sunday
  const [councilKidsCanAdd, setCouncilKidsCanAdd] = useState(true)

  // ── 1:1 Time state ──
  const [childRows, setChildRows] = useState<ChildScheduleRow[]>(() =>
    kids.map(k => {
      const bDay = getBirthdayDay(k.date_of_birth)
      return {
        memberId: k.id,
        name: k.display_name,
        birthday: k.date_of_birth,
        birthdayDay: bDay,
        dayOfMonth: bDay ?? 15,
        ordinalWeek: 1,
        ordinalDayOfWeek: 4, // Friday
        parentMode: 'just_me',
        label: '1:1 Time',
        enabled: true,
      }
    }),
  )
  const [oneOnOneFrequency, setOneOnOneFrequency] = useState<OneOnOneFrequency>('monthly')
  const [timingMode, setTimingMode] = useState<TimingMode>('birthday')
  const [sameDayValue, setSameDayValue] = useState(15)
  const [ordinalWeek, setOrdinalWeek] = useState(1)
  const [ordinalDayOfWeek, setOrdinalDayOfWeek] = useState(4) // Friday
  const [parentMode, setParentMode] = useState<ParentMode>('just_me')
  const [globalLabel, setGlobalLabel] = useState<MeetingLabel>('1:1 Time')
  const [customLabelText, setCustomLabelText] = useState('')

  // ── Couple state ──
  const [wantCouple, setWantCouple] = useState(false)
  const [coupleDay, setCoupleDay] = useState(5) // Saturday
  const [coupleFrequency, setCoupleFrequency] = useState<'weekly' | 'biweekly'>('weekly')

  // ── Deploy ──
  const upsertSchedule = useUpsertMeetingSchedule()
  const qc = useQueryClient()
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)

  // ── Helpers ──

  const selectedKids = childRows.filter(r => r.enabled)

  const resolvedLabel = globalLabel === 'custom' ? customLabelText : globalLabel

  /** Update all enabled child rows when bulk timing/parent/label changes */
  const syncChildRows = useCallback(() => {
    setChildRows(prev => prev.map(r => {
      if (!r.enabled) return r
      let dayOfMonth = r.dayOfMonth
      if (timingMode === 'birthday') dayOfMonth = r.birthdayDay ?? 15
      else if (timingMode === 'same_day') dayOfMonth = sameDayValue
      return {
        ...r,
        dayOfMonth,
        ordinalWeek,
        ordinalDayOfWeek,
        parentMode,
        label: resolvedLabel,
      }
    }))
  }, [timingMode, sameDayValue, ordinalWeek, ordinalDayOfWeek, parentMode, resolvedLabel])

  const toggleChild = (id: string) => {
    setChildRows(prev => prev.map(r => r.memberId === id ? { ...r, enabled: !r.enabled } : r))
  }

  const selectAllKids = () => setChildRows(prev => prev.map(r => ({ ...r, enabled: true })))

  const updateChildRow = (id: string, patch: Partial<ChildScheduleRow>) => {
    setChildRows(prev => prev.map(r => r.memberId === id ? { ...r, ...patch } : r))
  }

  // ── Navigation ──

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleNext = () => {
    // Sync bulk settings to child rows when leaving timing/parents/labels steps
    const currentKey = steps[step]?.key
    if (currentKey === 'timing' || currentKey === 'parents' || currentKey === 'labels') {
      syncChildRows()
    }
    if (step < steps.length - 1) setStep(s => s + 1)
  }

  const canAdvance = (() => {
    const key = steps[step]?.key
    if (key === 'pick_kids') return selectedKids.length > 0
    return true
  })()

  // ── Deploy logic ──

  /** Create a calendar event and add attendees so it shows on each person's calendar */
  const createCalendarEventWithAttendees = async (
    eventData: Record<string, unknown>,
    attendeeIds: string[],
  ) => {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert(eventData)
      .select('id')
      .single()
    if (error || !event) {
      console.warn('[MeetingSetupWizard] calendar insert:', error?.message)
      return
    }
    // Add attendees so the event shows on each person's calendar
    if (attendeeIds.length > 0) {
      await supabase.from('event_attendees').insert(
        attendeeIds.map(mid => ({
          event_id: event.id,
          family_member_id: mid,
          attendee_role: 'attendee',
          response_status: 'accepted',
        })),
      )
    }
  }

  const handleFinish = async () => {
    setIsDeploying(true)
    try {
      // Sync one final time
      syncChildRows()

      const schedulePromises: Promise<unknown>[] = []

      // 1. Family Council
      if (wantFamilyCouncil) {
        const dtstart = getNextWeekday(councilDay)
        const rruleStr = new RRule({
          freq: RRule.WEEKLY,
          byweekday: [RRULE_DAYS[councilDay]],
          dtstart,
        }).toString()

        schedulePromises.push(
          upsertSchedule.mutateAsync({
            family_id: familyId,
            meeting_type: 'family_council',
            template_id: null,
            related_member_id: null,
            recurrence_rule: 'weekly',
            recurrence_details: { rrule: rruleStr, dtstart: dtstart.toISOString() },
            next_due_date: dtstart.toISOString(),
            last_completed_date: null,
            calendar_event_id: null,
            is_active: true,
            created_by: memberId,
          }),
        )

        // Create calendar event for family council — all active family members as attendees
        const allMemberIds = familyMembers.filter(m => m.is_active).map(m => m.id)
        schedulePromises.push(
          createCalendarEventWithAttendees({
            family_id: familyId,
            created_by: memberId,
            title: 'Family Council',
            event_date: localIso(dtstart),
            start_time: '18:00',
            end_time: '19:00',
            is_all_day: false,
            recurrence_rule: 'weekly',
            recurrence_details: { rrule: rruleStr, dtstart: dtstart.toISOString() },
            source_type: 'meeting_schedule',
            status: 'approved',
            is_included_in_ai: true,
          }, allMemberIds),
        )
      }

      // 2. 1:1 Time with kids
      for (const row of childRows) {
        if (!row.enabled) continue

        const childLabel = `${row.label} with ${row.name}`

        // Build RRULE based on selected frequency
        const buildOneOnOneRRule = (dtstart: Date, interval = 1): string => {
          if (oneOnOneFrequency === 'weekly') {
            return new RRule({
              freq: RRule.WEEKLY,
              interval,
              byweekday: [RRULE_DAYS[row.ordinalDayOfWeek]],
              dtstart,
            }).toString()
          }
          if (oneOnOneFrequency === 'biweekly') {
            return new RRule({
              freq: RRule.WEEKLY,
              interval: interval * 2,
              byweekday: [RRULE_DAYS[row.ordinalDayOfWeek]],
              dtstart,
            }).toString()
          }
          // Monthly
          const base = buildMonthlyRRule(dtstart, row, timingMode)
          if (interval > 1) return base.replace('FREQ=MONTHLY', `FREQ=MONTHLY;INTERVAL=${interval}`)
          return base
        }

        const getStartDate = (): Date => {
          if (oneOnOneFrequency === 'weekly' || oneOnOneFrequency === 'biweekly') {
            return getNextWeekday(row.ordinalDayOfWeek)
          }
          return getNextMonthlyDate(row.dayOfMonth, timingMode === 'ordinal_weekday' ? row : null)
        }

        const recRule = oneOnOneFrequency === 'weekly' ? 'weekly' : oneOnOneFrequency === 'biweekly' ? 'biweekly' : 'monthly'

        if (row.parentMode === 'alternate' && additionalAdult) {
          // Two schedules at double the interval, offset
          const dtMom = getStartDate()
          const dtDad = new Date(dtMom)
          if (oneOnOneFrequency === 'weekly') dtDad.setDate(dtDad.getDate() + 7)
          else if (oneOnOneFrequency === 'biweekly') dtDad.setDate(dtDad.getDate() + 14)
          else dtDad.setMonth(dtDad.getMonth() + 1)

          for (const [parent, dt] of [[memberId, dtMom], [additionalAdult.id, dtDad]] as const) {
            const rruleStr = buildOneOnOneRRule(dt as Date, 2)

            schedulePromises.push(
              upsertSchedule.mutateAsync({
                family_id: familyId,
                meeting_type: 'parent_child',
                template_id: null,
                related_member_id: row.memberId,
                recurrence_rule: recRule,
                recurrence_details: {
                  rrule: rruleStr,
                  dtstart: (dt as Date).toISOString(),
                  custom_title: childLabel,
                  parent_id: parent,
                },
                next_due_date: (dt as Date).toISOString(),
                last_completed_date: null,
                calendar_event_id: null,
                is_active: true,
                created_by: memberId,
              }),
            )

            schedulePromises.push(
              createCalendarEventWithAttendees({
                family_id: familyId,
                created_by: memberId,
                title: childLabel,
                event_date: localIso(dt as Date),
                is_all_day: oneOnOneFrequency === 'monthly',
                recurrence_rule: recRule,
                recurrence_details: {
                  rrule: rruleStr,
                  dtstart: (dt as Date).toISOString(),
                },
                source_type: 'meeting_schedule',
                status: 'approved',
                is_included_in_ai: true,
              }, [parent as string, row.memberId]),
            )
          }
        } else {
          // Single schedule (just_me or both)
          const dt = getStartDate()
          const rrule = buildOneOnOneRRule(dt)

          schedulePromises.push(
            upsertSchedule.mutateAsync({
              family_id: familyId,
              meeting_type: 'parent_child',
              template_id: null,
              related_member_id: row.memberId,
              recurrence_rule: recRule,
              recurrence_details: {
                rrule,
                dtstart: dt.toISOString(),
                custom_title: childLabel,
              },
              next_due_date: dt.toISOString(),
              last_completed_date: null,
              calendar_event_id: null,
              is_active: true,
              created_by: memberId,
            }),
          )

          // Calendar event with parent(s) + child as attendees
          const attendees = row.parentMode === 'both' && additionalAdult
            ? [memberId, additionalAdult.id, row.memberId]
            : [memberId, row.memberId]

          schedulePromises.push(
            createCalendarEventWithAttendees({
              family_id: familyId,
              created_by: memberId,
              title: childLabel,
              event_date: localIso(dt),
              is_all_day: oneOnOneFrequency === 'monthly',
              recurrence_rule: recRule,
              recurrence_details: { rrule, dtstart: dt.toISOString() },
              source_type: 'meeting_schedule',
              status: 'approved',
              is_included_in_ai: true,
            }, attendees),
          )
        }
      }

      // 3. Couple meeting
      if (wantCouple && additionalAdult) {
        const dt = getNextWeekday(coupleDay)
        const freq = coupleFrequency === 'biweekly' ? 'biweekly' : 'weekly'
        const interval = coupleFrequency === 'biweekly' ? 2 : 1
        const rruleStr = new RRule({
          freq: RRule.WEEKLY,
          interval,
          byweekday: [RRULE_DAYS[coupleDay]],
          dtstart: dt,
        }).toString()

        schedulePromises.push(
          upsertSchedule.mutateAsync({
            family_id: familyId,
            meeting_type: 'couple',
            template_id: null,
            related_member_id: null,
            recurrence_rule: freq,
            recurrence_details: { rrule: rruleStr, dtstart: dt.toISOString() },
            next_due_date: dt.toISOString(),
            last_completed_date: null,
            calendar_event_id: null,
            is_active: true,
            created_by: memberId,
          }),
        )

        schedulePromises.push(
          createCalendarEventWithAttendees({
            family_id: familyId,
            created_by: memberId,
            title: 'Couple Check-in',
            event_date: localIso(dt),
            start_time: '20:00',
            end_time: '21:00',
            is_all_day: false,
            recurrence_rule: freq,
            recurrence_details: { rrule: rruleStr, dtstart: dt.toISOString() },
            source_type: 'meeting_schedule',
            status: 'approved',
            is_included_in_ai: true,
          }, [memberId, additionalAdult.id]), // Both parents
        )
      }

      await Promise.all(schedulePromises)
      qc.invalidateQueries({ queryKey: ['meeting-schedules', familyId] })
      qc.invalidateQueries({ queryKey: ['calendar-events'] })
      setDeployed(true)
    } catch (err) {
      console.error('[MeetingSetupWizard] Deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }

  // ── Render steps ──────────────────────────────────────────────

  const currentKey = steps[step]?.key

  const renderStep = () => {
    switch (currentKey) {
      case 'intro':
        return <IntroStep />

      case 'family_council':
        return (
          <FamilyCouncilStep
            enabled={wantFamilyCouncil}
            onToggle={setWantFamilyCouncil}
            day={councilDay}
            onDayChange={setCouncilDay}
            kidsCanAdd={councilKidsCanAdd}
            onKidsCanAddChange={setCouncilKidsCanAdd}
          />
        )

      case 'pick_kids':
        return (
          <PickKidsStep
            rows={childRows}
            onToggle={toggleChild}
            onSelectAll={selectAllKids}
            familyMembers={familyMembers}
          />
        )

      case 'timing':
        return (
          <TimingStep
            frequency={oneOnOneFrequency}
            onFrequencyChange={setOneOnOneFrequency}
            mode={timingMode}
            onModeChange={setTimingMode}
            sameDayValue={sameDayValue}
            onSameDayChange={setSameDayValue}
            ordinalWeek={ordinalWeek}
            onOrdinalWeekChange={setOrdinalWeek}
            ordinalDayOfWeek={ordinalDayOfWeek}
            onOrdinalDayChange={setOrdinalDayOfWeek}
            rows={childRows.filter(r => r.enabled)}
          />
        )

      case 'parents':
        return hasAdult ? (
          <ParentStep
            mode={parentMode}
            onModeChange={setParentMode}
            adultName={additionalAdult?.display_name ?? 'Partner'}
          />
        ) : null

      case 'labels':
        return (
          <LabelStep
            label={globalLabel}
            onLabelChange={setGlobalLabel}
            customText={customLabelText}
            onCustomChange={setCustomLabelText}
          />
        )

      case 'couple':
        return hasAdult ? (
          <CoupleStep
            enabled={wantCouple}
            onToggle={setWantCouple}
            day={coupleDay}
            onDayChange={setCoupleDay}
            frequency={coupleFrequency}
            onFrequencyChange={setCoupleFrequency}
            adultName={additionalAdult?.display_name ?? 'Partner'}
          />
        ) : null

      case 'review':
        return deployed ? (
          <DeployedStep onClose={onClose} />
        ) : (
          <ReviewStep
            wantCouncil={wantFamilyCouncil}
            councilDay={councilDay}
            childRows={childRows.filter(r => r.enabled)}
            timingMode={timingMode}
            wantCouple={wantCouple}
            coupleDay={coupleDay}
            coupleFrequency={coupleFrequency}
            adultName={additionalAdult?.display_name}
            familyMembers={familyMembers}
            onEditChild={updateChildRow}
          />
        )

      default:
        return null
    }
  }

  return (
    <SetupWizard
      id="meeting-setup-wizard"
      isOpen={isOpen}
      onClose={onClose}
      title="Set Up Family Meetings"
      subtitle="Let's build your rhythm of connection"
      steps={steps}
      currentStep={step}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={handleFinish}
      finishLabel={deployed ? 'Done' : 'Create All Meetings'}
      canAdvance={canAdvance}
      canFinish={!isDeploying}
      isFinishing={isDeploying}
      hideNav={deployed}
    >
      {renderStep()}
    </SetupWizard>
  )
}

// ── Step Components ─────────────────────────────────────────────

function IntroStep() {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}
      >
        <div className="flex items-start gap-3">
          <UsersRound size={24} style={{ color: 'var(--color-accent-deep)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Regular family meetings and 1:1 time are the highest-impact things you can schedule.
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              This wizard will help you set up recurring meetings for your whole family in a few minutes.
              We'll suggest smart scheduling based on your family — you can always change everything later.
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        You can skip any section that doesn't fit your family right now.
      </p>
    </div>
  )
}

// ── Family Council Step ─────────────────────────────────────────

function FamilyCouncilStep({
  enabled, onToggle, day, onDayChange, kidsCanAdd, onKidsCanAddChange,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
  day: number
  onDayChange: (d: number) => void
  kidsCanAdd: boolean
  onKidsCanAddChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        A regular time where the whole family sits down, reviews the week, and everyone gets a voice.
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onToggle(e.target.checked)}
          className="w-5 h-5 rounded"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Yes, I want a weekly Family Council
        </span>
      </label>

      {enabled && (
        <div className="space-y-3 pl-8">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              What day?
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => onDayChange(i)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: day === i ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                    color: day === i ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: `1px solid ${day === i ? 'transparent' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={kidsCanAdd}
              onChange={e => onKidsCanAddChange(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Let kids (Guided and up) add their own agenda items
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

// ── Pick Kids Step ──────────────────────────────────────────────

function PickKidsStep({
  rows, onToggle, onSelectAll, familyMembers,
}: {
  rows: ChildScheduleRow[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  familyMembers: FamilyMember[]
}) {
  const allSelected = rows.every(r => r.enabled)

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Who would you like to schedule regular 1:1 time with?
      </p>

      <button
        onClick={onSelectAll}
        className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
        style={{
          backgroundColor: allSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
          color: allSelected ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
          border: `1px solid ${allSelected ? 'transparent' : 'var(--color-border-subtle)'}`,
        }}
      >
        {allSelected ? '✓ All Selected' : 'Select All'}
      </button>

      <div className="space-y-2">
        {rows.map(row => {
          const fm = familyMembers.find(m => m.id === row.memberId)
          const color = fm ? getMemberColor(fm) : 'var(--color-text-muted)'
          const birthdayLabel = row.birthdayDay
            ? `Birthday: ${row.birthday ? new Date(row.birthday + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
            : 'No birthday set'

          return (
            <button
              key={row.memberId}
              onClick={() => onToggle(row.memberId)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left"
              style={{
                backgroundColor: row.enabled ? 'var(--color-bg-secondary)' : 'transparent',
                border: `2px solid ${row.enabled ? color : 'var(--color-border-subtle)'}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: color, color: '#fff' }}
              >
                {row.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {row.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {birthdayLabel}
                </p>
              </div>
              {row.enabled && (
                <CheckCircle2 size={20} style={{ color, flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Timing Step ─────────────────────────────────────────────────

function TimingStep({
  frequency, onFrequencyChange,
  mode, onModeChange, sameDayValue, onSameDayChange,
  ordinalWeek, onOrdinalWeekChange, ordinalDayOfWeek, onOrdinalDayChange,
  rows,
}: {
  frequency: OneOnOneFrequency
  onFrequencyChange: (f: OneOnOneFrequency) => void
  mode: TimingMode
  onModeChange: (m: TimingMode) => void
  sameDayValue: number
  onSameDayChange: (d: number) => void
  ordinalWeek: number
  onOrdinalWeekChange: (w: number) => void
  ordinalDayOfWeek: number
  onOrdinalDayChange: (d: number) => void
  rows: ChildScheduleRow[]
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        How often and when? You can always change this later.
      </p>

      {/* Frequency picker */}
      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
          How often?
        </label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFrequencyChange(opt.value)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: frequency === opt.value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                color: frequency === opt.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: `1px solid ${frequency === opt.value ? 'transparent' : 'var(--color-border-subtle)'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {FREQUENCY_OPTIONS.find(o => o.value === frequency)?.desc}
        </p>
      </div>

      {/* Day/date picker — only for monthly and biweekly */}
      <div>
        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
          {frequency === 'weekly' ? 'What day of the week?' : 'When in the month?'}
        </label>

      {/* Weekly: simple day-of-week picker */}
      {frequency === 'weekly' && (
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => { onModeChange('ordinal_weekday'); onOrdinalDayChange(i) }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: ordinalDayOfWeek === i ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                color: ordinalDayOfWeek === i ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: `1px solid ${ordinalDayOfWeek === i ? 'transparent' : 'var(--color-border-subtle)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Biweekly/Monthly: date-based options */}
      {frequency !== 'weekly' && (
        <div className="space-y-2">
          {/* Birthday option */}
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
            style={{
              backgroundColor: mode === 'birthday' ? 'var(--color-bg-secondary)' : 'transparent',
              border: `1px solid ${mode === 'birthday' ? 'var(--color-accent-deep)' : 'var(--color-border-subtle)'}`,
            }}
          >
            <input type="radio" name="timing" checked={mode === 'birthday'} onChange={() => onModeChange('birthday')} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Their birthday date each month</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {rows.map(r => `${r.name} → ${r.birthdayDay ? `${ordinalSuffix(r.birthdayDay)}` : '15th'}`).join(', ')}
              </p>
            </div>
          </label>

          {/* Same day option */}
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
            style={{
              backgroundColor: mode === 'same_day' ? 'var(--color-bg-secondary)' : 'transparent',
              border: `1px solid ${mode === 'same_day' ? 'var(--color-accent-deep)' : 'var(--color-border-subtle)'}`,
            }}
          >
            <input type="radio" name="timing" checked={mode === 'same_day'} onChange={() => onModeChange('same_day')} className="mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Same day for everyone</p>
              {mode === 'same_day' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>The</span>
                  <select value={sameDayValue} onChange={e => onSameDayChange(Number(e.target.value))} className="rounded-md px-2 py-1 text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (<option key={d} value={d}>{ordinalSuffix(d)}</option>))}
                  </select>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>of each {frequency === 'biweekly' ? 'period' : 'month'}</span>
                </div>
              )}
            </div>
          </label>

          {/* Ordinal weekday option */}
          <label
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
            style={{
              backgroundColor: mode === 'ordinal_weekday' ? 'var(--color-bg-secondary)' : 'transparent',
              border: `1px solid ${mode === 'ordinal_weekday' ? 'var(--color-accent-deep)' : 'var(--color-border-subtle)'}`,
            }}
          >
            <input type="radio" name="timing" checked={mode === 'ordinal_weekday'} onChange={() => onModeChange('ordinal_weekday')} className="mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>A specific weekday each month</p>
              {mode === 'ordinal_weekday' && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <select value={ordinalWeek} onChange={e => onOrdinalWeekChange(Number(e.target.value))} className="rounded-md px-2 py-1 text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                    {ORDINAL_LABELS.map((label, i) => (<option key={i} value={i + 1}>{label}</option>))}
                  </select>
                  <select value={ordinalDayOfWeek} onChange={e => onOrdinalDayChange(Number(e.target.value))} className="rounded-md px-2 py-1 text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                    {DAY_LABELS.map((label, i) => (<option key={i} value={i}>{label}</option>))}
                  </select>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>of each month</span>
                </div>
              )}
            </div>
          </label>
        </div>
      )}
      </div>
    </div>
  )
}

// ── Parent Step ─────────────────────────────────────────────────

function ParentStep({
  mode, onModeChange, adultName,
}: {
  mode: ParentMode
  onModeChange: (m: ParentMode) => void
  adultName: string
}) {
  const options: Array<{ value: ParentMode; label: string; desc: string }> = [
    { value: 'just_me', label: 'Just me', desc: 'I\'ll have 1:1 time with each child every month.' },
    { value: 'alternate', label: `Alternate with ${adultName}`, desc: `We'll take turns — each parent gets every other month with each child.` },
    { value: 'both', label: 'Both of us together', desc: 'We\'ll meet with each child together as a team.' },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Who's having this 1:1 time?
      </p>

      <div className="space-y-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
            style={{
              backgroundColor: mode === opt.value ? 'var(--color-bg-secondary)' : 'transparent',
              border: `1px solid ${mode === opt.value ? 'var(--color-accent-deep)' : 'var(--color-border-subtle)'}`,
            }}
          >
            <input
              type="radio"
              name="parent"
              checked={mode === opt.value}
              onChange={() => onModeChange(opt.value)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{opt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Label Step ──────────────────────────────────────────────────

function LabelStep({
  label, onLabelChange, customText, onCustomChange,
}: {
  label: MeetingLabel
  onLabelChange: (l: MeetingLabel) => void
  customText: string
  onCustomChange: (t: string) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        What do you want to call these? The system tracks them the same way — this is just the label your family sees.
      </p>

      <div className="flex flex-wrap gap-2">
        {LABEL_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => onLabelChange(opt)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: label === opt ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
              color: label === opt ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${label === opt ? 'transparent' : 'var(--color-border-subtle)'}`,
            }}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={() => onLabelChange('custom')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: !LABEL_OPTIONS.includes(label) ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
            color: !LABEL_OPTIONS.includes(label) ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            border: `1px solid ${!LABEL_OPTIONS.includes(label) ? 'transparent' : 'var(--color-border-subtle)'}`,
          }}
        >
          Custom...
        </button>
      </div>

      {!LABEL_OPTIONS.includes(label) && (
        <input
          type="text"
          value={customText}
          onChange={e => onCustomChange(e.target.value)}
          placeholder="e.g., Special Time, Outing, Date Night..."
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      )}

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        You can override the label for individual kids on the review screen.
      </p>
    </div>
  )
}

// ── Couple Step ─────────────────────────────────────────────────

function CoupleStep({
  enabled, onToggle, day, onDayChange, frequency, onFrequencyChange, adultName,
}: {
  enabled: boolean
  onToggle: (v: boolean) => void
  day: number
  onDayChange: (d: number) => void
  frequency: 'weekly' | 'biweekly'
  onFrequencyChange: (f: 'weekly' | 'biweekly') => void
  adultName: string
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        A regular check-in with {adultName} — even 20 minutes makes a difference.
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onToggle(e.target.checked)}
          className="w-5 h-5 rounded"
        />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Yes, set up a couple check-in
        </span>
      </label>

      {enabled && (
        <div className="space-y-3 pl-8">
          <div className="flex items-center gap-3">
            <select
              value={frequency}
              onChange={e => onFrequencyChange(e.target.value as 'weekly' | 'biweekly')}
              className="rounded-md px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="weekly">Every week</option>
              <option value="biweekly">Every other week</option>
            </select>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>on</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => onDayChange(i)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: day === i ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                  color: day === i ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  border: `1px solid ${day === i ? 'transparent' : 'var(--color-border-subtle)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Review Step ─────────────────────────────────────────────────

function ReviewStep({
  wantCouncil, councilDay, childRows, timingMode,
  wantCouple, coupleDay, coupleFrequency, adultName,
  familyMembers, onEditChild: _onEditChild,
}: {
  wantCouncil: boolean
  councilDay: number
  childRows: ChildScheduleRow[]
  timingMode: TimingMode
  wantCouple: boolean
  coupleDay: number
  coupleFrequency: 'weekly' | 'biweekly'
  adultName: string | undefined
  familyMembers: FamilyMember[]
  onEditChild?: (id: string, patch: Partial<ChildScheduleRow>) => void
}) {
  const nothingSelected = !wantCouncil && childRows.length === 0 && !wantCouple

  if (nothingSelected) {
    return (
      <div className="text-center py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No meetings selected yet. Go back to pick what you'd like to set up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Here's everything that will be created. Tap any row to adjust.
      </p>

      {/* Family Council */}
      {wantCouncil && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <UsersRound size={16} style={{ color: 'var(--color-accent-deep)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Family Council
            </span>
          </div>
          <p className="text-xs mt-1 pl-6" style={{ color: 'var(--color-text-muted)' }}>
            Every {DAY_LABELS[councilDay]} · Everyone invited
          </p>
        </div>
      )}

      {/* 1:1 Kids */}
      {childRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            1:1 Time ({childRows.length} kid{childRows.length !== 1 ? 's' : ''})
          </p>
          {childRows.map(row => {
            const fm = familyMembers.find(m => m.id === row.memberId)
            const color = fm ? getMemberColor(fm) : 'var(--color-text-muted)'

            let dateLabel: string
            if (timingMode === 'ordinal_weekday') {
              dateLabel = `${ORDINAL_LABELS[row.ordinalWeek - 1]} ${DAY_LABELS[row.ordinalDayOfWeek]} of each month`
            } else {
              dateLabel = `${ordinalSuffix(row.dayOfMonth)} of each month`
            }

            const parentLabel = row.parentMode === 'alternate'
              ? 'Alternating mom/dad'
              : row.parentMode === 'both'
                ? 'Both parents'
                : 'Mom'

            return (
              <div
                key={row.memberId}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--color-bg-secondary)', border: `1px solid ${color}30` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: color, color: '#fff' }}
                  >
                    {row.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {row.label} with {row.name}
                  </span>
                </div>
                <p className="text-xs mt-1 pl-8" style={{ color: 'var(--color-text-muted)' }}>
                  {dateLabel} · {parentLabel}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Couple */}
      {wantCouple && adultName && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Heart size={16} style={{ color: 'var(--color-accent-deep)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Couple Check-in with {adultName}
            </span>
          </div>
          <p className="text-xs mt-1 pl-6" style={{ color: 'var(--color-text-muted)' }}>
            {coupleFrequency === 'biweekly' ? 'Every other' : 'Every'} {DAY_LABELS[coupleDay]}
          </p>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        All schedules will appear on your calendar. You can change any of these later in about 10 seconds from the Meetings page.
      </p>
    </div>
  )
}

// ── Deployed Success Step ───────────────────────────────────────

function DeployedStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-6 space-y-4">
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <Check size={32} style={{ color: 'var(--color-accent-deep)' }} />
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          Your family meetings are set up!
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Everything's on your calendar. You can adjust schedules, customize agendas, and start
          meetings anytime from the Meetings page.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-6 py-2 rounded-lg text-sm font-semibold"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        Go to Meetings
      </button>
    </div>
  )
}

// ── Utility functions ───────────────────────────────────────────

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getNextWeekday(dayIndex: number): Date {
  // dayIndex: 0=Monday..6=Sunday
  const now = new Date()
  const jsDay = ((dayIndex + 1) % 7) // Convert Mon=0..Sun=6 to JS Sun=0..Sat=6
  const diff = (jsDay - now.getDay() + 7) % 7
  const next = new Date(now)
  next.setDate(now.getDate() + (diff === 0 ? 7 : diff))
  next.setHours(12, 0, 0, 0)
  return next
}

function getNextMonthlyDate(
  dayOfMonth: number,
  ordinal: { ordinalWeek: number; ordinalDayOfWeek: number } | null,
): Date {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 12, 0, 0)

  if (ordinal) {
    // For ordinal weekday, compute the Nth weekday of the current or next month
    const target = computeOrdinalWeekday(now.getFullYear(), now.getMonth(), ordinal.ordinalWeek, ordinal.ordinalDayOfWeek)
    if (target && target > now) return target
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return computeOrdinalWeekday(nextMonth.getFullYear(), nextMonth.getMonth(), ordinal.ordinalWeek, ordinal.ordinalDayOfWeek) ?? thisMonth
  }

  // For fixed day of month
  if (thisMonth > now) return thisMonth
  return new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth, 12, 0, 0)
}

function computeOrdinalWeekday(year: number, month: number, ordinalWeek: number, dayOfWeek: number): Date {
  // dayOfWeek: 0=Mon..6=Sun
  const jsDay = ((dayOfWeek + 1) % 7) // Convert to JS day (Sun=0..Sat=6)
  const first = new Date(year, month, 1)
  const firstDay = first.getDay()
  let dayNum = 1 + ((jsDay - firstDay + 7) % 7) + (ordinalWeek - 1) * 7
  // Cap at month end
  const lastDay = new Date(year, month + 1, 0).getDate()
  if (dayNum > lastDay) dayNum = lastDay
  return new Date(year, month, dayNum, 12, 0, 0)
}

function buildMonthlyRRule(
  dtstart: Date,
  row: ChildScheduleRow,
  timingMode: TimingMode,
): string {
  if (timingMode === 'ordinal_weekday') {
    return new RRule({
      freq: RRule.MONTHLY,
      byweekday: [RRULE_DAYS[row.ordinalDayOfWeek].nth(row.ordinalWeek)],
      dtstart,
    }).toString()
  }
  // Fixed day of month
  return new RRule({
    freq: RRule.MONTHLY,
    bymonthday: [row.dayOfMonth],
    dtstart,
  }).toString()
}
