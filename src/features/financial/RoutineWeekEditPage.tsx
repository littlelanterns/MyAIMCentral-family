// PRD-28 ALLOWANCE-EDIT-WEEK (2026-04-25) — Mom's see-full-week page
// for any kid's routine completions.
//
// Founder ask 2026-04-25: "I do like a see full week page where I can
// go in and edit/change things, it would also be good, as say my kids
// finished up their chore just after midnight, and I wanted to let
// them have credit anyway."
//
// Display rules (no backend changes — purely a presentation layer):
//   - Each day in the active period gets a row.
//   - Per row: every routine task's section that's scheduled for that
//     day's DOW renders as a card. Steps from sections NOT scheduled
//     that day don't appear (so the 26/11 messy raw count never
//     surfaces — only the 11 actually-scheduled steps for the day).
//   - Numerator (checked) is the count of scheduled steps that have a
//     row in routine_step_completions for that exact (step_id, day).
//     Always ≤ denominator by construction.
//   - Mom-only edit: tap a step's checkbox to toggle. Adding a check
//     for a past day passes completed_at = past-day-noon-UTC so the
//     period_date trigger derives the right date.
//
// Entry: Settings → Allowance & Finances → [child] config page →
// "Edit past days" link. Also linked from AllowanceSettingsPage's
// per-kid summary card.

import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamilyToday } from '@/hooks/useFamilyToday'
import {
  useCompleteRoutineStep,
  useUncompleteRoutineStep,
} from '@/hooks/useTaskCompletions'
import { getMemberColor } from '@/lib/memberColors'
import {
  useRoutineWeekView,
  useAllowancePeriods,
  type RoutineWeekDay,
  type RoutineWeekDayCell,
} from './useRoutineWeekView'

export function RoutineWeekEditPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { data: family } = useFamily()
  const { data: membersData } = useFamilyMembers(family?.id)
  const members = membersData ?? []
  const member = members.find(m => m.id === memberId)
  const memberColor = member ? getMemberColor(member) : 'var(--color-btn-primary-bg)'

  // Mom-only — refuse render if caller isn't primary_parent.
  // (Convention #245 sync roster check.)
  const callerIsPrimaryParent = useMemo(() => {
    const me = members.find(m => m.user_id === family?.primary_parent_id)
    return me?.role === 'primary_parent' || family?.primary_parent_id === me?.id
  }, [members, family])

  const { data: today } = useFamilyToday(memberId)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const { data: periods = [] } = useAllowancePeriods(memberId)
  const { data: weekView, isLoading } = useRoutineWeekView(memberId, today ?? '', selectedPeriodId)

  const currentPeriodIndex = useMemo(() => {
    if (!weekView?.period_id || periods.length === 0) return 0
    const idx = periods.findIndex(p => p.id === weekView.period_id)
    return idx >= 0 ? idx : 0
  }, [weekView?.period_id, periods])

  const canGoNewer = currentPeriodIndex > 0
  const canGoOlder = currentPeriodIndex < periods.length - 1

  const goNewer = () => {
    if (!canGoNewer) return
    const newer = periods[currentPeriodIndex - 1]
    setSelectedPeriodId(newer.id)
  }
  const goOlder = () => {
    if (!canGoOlder) return
    const older = periods[currentPeriodIndex + 1]
    setSelectedPeriodId(older.id)
  }

  const completeStep = useCompleteRoutineStep()
  const uncompleteStep = useUncompleteRoutineStep()
  const queryClient = useQueryClient()

  if (isLoading || !today) {
    return (
      <div className="density-comfortable max-w-3xl mx-auto px-4 py-6">
        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!callerIsPrimaryParent) {
    return (
      <div className="density-comfortable max-w-2xl mx-auto px-4 py-6">
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--vibe-radius-card, 12px)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default, var(--color-border))',
            color: 'var(--color-text-muted)',
          }}
        >
          Only the primary parent can edit past-day routine checks.
        </div>
      </div>
    )
  }

  if (!weekView) {
    return (
      <div className="density-comfortable max-w-3xl mx-auto px-4 py-6">
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--vibe-radius-card, 12px)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default, var(--color-border))',
            color: 'var(--color-text-muted)',
          }}
        >
          No routines found for {member?.display_name ?? 'this child'}.
        </div>
      </div>
    )
  }

  const memberMap = new Map(members.map(m => [m.id, m]))

  const refreshWeekView = () => {
    // The shared completion hooks don't know about this page's query key.
    // Invalidate it ourselves after every write so the new state lands.
    queryClient.invalidateQueries({ queryKey: ['routine-week-view', memberId] })
  }

  const handleToggle = async (
    cell: RoutineWeekDayCell,
    step: RoutineWeekDayCell['steps'][number],
    dayIso: string,
  ) => {
    if (!memberId) return
    try {
      if (step.is_checked && step.completion_id) {
        await uncompleteStep.mutateAsync({
          taskId: cell.task_id,
          stepId: step.step_id,
          memberId: step.completed_by_member_id ?? memberId,
          periodDate: dayIso,
        })
      } else {
        // Set completed_at to noon UTC on the requested day so the
        // migration 100157 trigger derives period_date = dayIso in any
        // standard timezone (no edge-case wraparound).
        await completeStep.mutateAsync({
          task_id: cell.task_id,
          step_id: step.step_id,
          member_id: memberId,
          period_date: dayIso, // overridden by trigger; passing for type contract
          completed_at: `${dayIso}T12:00:00Z`,
        })
      }
      refreshWeekView()
    } catch (err) {
      console.error('[RoutineWeekEditPage] toggle failed:', err)
      // Refresh anyway so display reflects DB truth (in case the write
      // partially succeeded then the read failed, etc.).
      refreshWeekView()
    }
  }

  const periodTotalScheduled = weekView.days.reduce((sum, d) => sum + d.total_scheduled, 0)
  const periodTotalChecked = weekView.days.reduce((sum, d) => sum + d.total_checked, 0)

  return (
    <div className="density-comfortable max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/settings/allowance/${memberId}`}
          className="p-2 rounded-lg transition-colors hidden md:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {member?.display_name ?? 'Child'} — Edit Past Days
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {weekView.period_start} → {weekView.period_end} ·{' '}
            {periodTotalChecked}/{periodTotalScheduled} steps complete
          </p>
        </div>
      </div>

      {/* Period navigation */}
      {periods.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={goOlder}
            disabled={!canGoOlder}
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border-default, var(--color-border))',
              background: canGoOlder ? 'var(--color-bg-secondary)' : 'transparent',
              color: canGoOlder ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              cursor: canGoOlder ? 'pointer' : 'not-allowed',
              opacity: canGoOlder ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Previous period"
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            {weekView?.period_start} → {weekView?.period_end}
            {periods[currentPeriodIndex]?.status === 'active' && ' (current)'}
            {periods[currentPeriodIndex]?.status === 'calculated' && ' (closed)'}
          </span>
          <button
            onClick={goNewer}
            disabled={!canGoNewer}
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border-default, var(--color-border))',
              background: canGoNewer ? 'var(--color-bg-secondary)' : 'transparent',
              color: canGoNewer ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              cursor: canGoNewer ? 'pointer' : 'not-allowed',
              opacity: canGoNewer ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Next period"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Helper banner */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          background: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.4,
        }}
      >
        Tap any step's checkbox to toggle credit for that day. Adding a check
        on a past day attributes it to that day in the database, so kids who
        finished just after midnight can still get credit. Future days are
        disabled.
      </div>

      {/* Per-day blocks */}
      {weekView.days.map(day => (
        <DayBlock
          key={day.iso}
          day={day}
          memberColor={memberColor}
          onToggle={handleToggle}
          pending={completeStep.isPending || uncompleteStep.isPending}
          viewedMemberId={memberId ?? ''}
          memberMap={memberMap}
        />
      ))}
    </div>
  )
}

// ── Day block ─────────────────────────────────────────────

function DayBlock({
  day,
  memberColor,
  onToggle,
  pending,
  viewedMemberId,
  memberMap,
}: {
  day: RoutineWeekDay
  memberColor: string
  onToggle: (
    cell: RoutineWeekDayCell,
    step: RoutineWeekDayCell['steps'][number],
    dayIso: string,
  ) => void
  pending: boolean
  viewedMemberId: string
  memberMap: Map<string, { id: string; display_name: string; assigned_color: string | null; member_color: string | null }>
}) {
  const dayLabel = day.is_today ? 'Today' : day.weekday
  const dateLabel = day.iso.slice(5).replace('-', '/')

  return (
    <section
      data-testid={`week-edit-day-${day.iso}`}
      style={{
        borderRadius: 'var(--vibe-radius-card, 12px)',
        background: 'var(--color-bg-card)',
        border: `2px solid ${day.is_today ? memberColor : 'var(--color-border-default, var(--color-border))'}`,
        padding: '0.875rem 1rem',
        opacity: day.is_future ? 0.55 : 1,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: day.cells.length > 0 ? '0.625rem' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-heading)',
            }}
          >
            {dayLabel}
          </h3>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {dateLabel}
            {day.is_future && ' (future)'}
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {day.total_checked} / {day.total_scheduled}
        </span>
      </header>

      {day.cells.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          No routines scheduled this day.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {day.cells.map(cell => (
            <CellBlock
              key={`${cell.task_id}-${cell.section_id}`}
              cell={cell}
              dayIso={day.iso}
              isFuture={day.is_future}
              onToggle={onToggle}
              pending={pending}
              viewedMemberId={viewedMemberId}
              memberMap={memberMap}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CellBlock({
  cell,
  dayIso,
  isFuture,
  onToggle,
  pending,
  viewedMemberId,
  memberMap,
}: {
  cell: RoutineWeekDayCell
  dayIso: string
  isFuture: boolean
  onToggle: (
    cell: RoutineWeekDayCell,
    step: RoutineWeekDayCell['steps'][number],
    dayIso: string,
  ) => void
  pending: boolean
  viewedMemberId: string
  memberMap: Map<string, { id: string; display_name: string; assigned_color: string | null; member_color: string | null }>
}) {
  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--vibe-radius-input, 8px)',
        padding: '0.625rem 0.75rem',
        border: '1px solid var(--color-border-default, var(--color-border))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.375rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-heading)',
            }}
          >
            {cell.task_title}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {cell.section_name}
          </div>
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {cell.checked_count} / {cell.scheduled_count}
        </span>
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        {cell.steps.map(step => {
          const completedByOther = step.completed_by_member_id && step.completed_by_member_id !== viewedMemberId
          const completerMember = step.completed_by_member_id ? memberMap.get(step.completed_by_member_id) : undefined
          const completerColor = completerMember ? getMemberColor(completerMember) : undefined
          return (
            <li key={step.step_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={step.is_checked}
                disabled={isFuture || pending}
                onChange={() => onToggle(cell, step, dayIso)}
                data-testid={`week-edit-step-${dayIso}-${step.step_id}`}
                style={{
                  accentColor: completedByOther && completerColor ? completerColor : 'var(--color-btn-primary-bg)',
                  cursor: isFuture || pending ? 'not-allowed' : 'pointer',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: step.is_checked
                    ? 'var(--color-text-muted)'
                    : 'var(--color-text-primary)',
                  textDecoration: step.is_checked ? 'line-through' : 'none',
                }}
              >
                {step.step_name}
              </span>
              {completedByOther && completerMember && (
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: completerColor,
                    fontWeight: 500,
                  }}
                >
                  {completerMember.display_name}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
