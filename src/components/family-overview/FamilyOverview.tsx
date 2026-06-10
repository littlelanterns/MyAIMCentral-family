// PRD-14C: Family Overview — Mom's aggregated command post.
// Horizontally-swipeable member columns with collapsible sections.

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Check, Star, Trophy, Target, Zap, BarChart3, RefreshCw, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/memberColors'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useFamilyOverviewConfig,
  useUpdateFamilyOverviewConfig,
  mergeSectionOrder,
  FAMILY_OVERVIEW_SECTION_KEYS,
  type FamilyOverviewSectionKey,
  type SectionCollapseState,
} from '@/hooks/useFamilyOverviewConfig'
import {
  useTodayEventsForMembers,
  useTodayTasksForMembers,
  useTaskAssignmentsForMembers,
  useBestIntentionsForMembers,
  useTodayIterationsForMembers,
  useTrackersForMembers,
  useTodayOpportunityCompletions,
  useTodayRoutinesForMembers,
  useSequentialForMembers,
  useTodayVictoriesForMembers,
  type MemberRoutineToday,
  type MemberSequentialSummary,
} from '@/hooks/useFamilyOverviewData'
import { useSearchParams } from 'react-router-dom'
import { useActivePeriod, useLiveAllowanceProgress, type GraceDayEntry } from '@/hooks/useFinancial'
import { useCompleteTask, useTasksWithPendingApprovals, type Task } from '@/hooks/useTasks'
import { useViewableMembers, accessLevelAtLeast } from '@/hooks/useViewableMembers'
import { useQuery } from '@tanstack/react-query'
import { Tabs, useRoutingToast, FeatureGuide, type TabItem } from '@/components/shared'
import { LayoutGrid, ClipboardCheck, Inbox, DollarSign } from 'lucide-react'
import {
  PendingApprovalsSection,
  filterVisiblePendingApprovals,
} from '@/components/tasks/PendingApprovalsSection'
import { SortTab } from '@/components/queue/SortTab'
import { FinancesTab } from '@/features/financial/FinancesTab'
import { MemberSpotCheck } from './MemberSpotCheck'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import PendingItemsBar from './PendingItemsBar'
import type { FamilyMember } from '@/hooks/useFamilyMember'

// ─── FO page tabs (FO-COMMAND-CENTER relocations) ───────────────────────────

type FamilyOverviewTab = 'overview' | 'approvals' | 'queue' | 'finances'

/** Pending studio_queue count for the Queue tab badge (RLS scopes non-mom). */
function usePendingQueueCount(familyId: string | undefined, memberId: string | undefined, role?: string) {
  return useQuery({
    queryKey: ['studio_queue', familyId, memberId, role],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      let query = supabase
        .from('studio_queue')
        .select('id, owner_id')
        .eq('family_id', familyId)
        .is('processed_at', null)
        .is('dismissed_at', null)
      if (role === 'member' || role === 'additional_adult' || role === 'special_adult') {
        query = query.eq('owner_id', memberId)
      }
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && !!memberId,
  })
}

// ─── Section metadata ────────────────────────────────────────────────────────

const SECTION_META: Record<FamilyOverviewSectionKey, { label: string; icon: React.ReactNode }> = {
  events: { label: "Today's Events", icon: <Calendar size={14} /> },
  tasks: { label: "Today's Tasks", icon: <Check size={14} /> },
  routines: { label: 'Routines', icon: <RefreshCw size={14} /> },
  sequential: { label: 'Sequential', icon: <BookOpen size={14} /> },
  opportunities: { label: 'Opportunities', icon: <Zap size={14} /> },
  best_intentions: { label: 'Best Intentions', icon: <Star size={14} /> },
  trackers: { label: 'Active Trackers', icon: <BarChart3 size={14} /> },
  weekly_completion: { label: 'Weekly Completion', icon: <Target size={14} /> },
  victories: { label: 'Victories', icon: <Trophy size={14} /> },
}

// ─── Column Section Header ───────────────────────────────────────────────────

function SectionHeader({
  sectionKey,
  collapsed,
  count,
  hasOverride,
  onToggle,
}: {
  sectionKey: FamilyOverviewSectionKey
  collapsed: boolean
  count?: number
  hasOverride?: boolean
  onToggle: () => void
}) {
  const meta = SECTION_META[sectionKey]
  return (
    <button
      onClick={onToggle}
      data-testid={`section-header-${sectionKey}`}
      className="w-full flex items-center gap-1.5 py-1.5 px-2 text-xs font-semibold"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      {meta.icon}
      <span>{meta.label}</span>
      {count !== undefined && (
        <span
          className="ml-auto text-xs font-normal"
          style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}
        >
          {count}
        </span>
      )}
      {hasOverride && (
        <span
          className="w-1.5 h-1.5 rounded-full ml-1"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
        />
      )}
    </button>
  )
}

// ─── Section: Events ─────────────────────────────────────────────────────────

function EventsSection({ memberId, events }: { memberId: string; events: Array<Record<string, unknown>> }) {
  const memberEvents = events.filter((ev) => {
    if (ev.created_by === memberId) return true
    const attendees = (ev.event_attendees as Array<{ family_member_id: string }>) ?? []
    return attendees.some((a) => a.family_member_id === memberId)
  })

  if (memberEvents.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-1 px-2 pb-2">
      {memberEvents.map((ev) => (
        <div
          key={ev.id as string}
          className="flex items-start gap-1.5 text-xs"
          style={{
            color: 'var(--color-text-primary)',
            opacity: ev.status === 'pending_approval' ? 0.5 : 1,
          }}
        >
          {!!ev.start_time && (
            <span className="shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
              {formatTime(ev.start_time as string)}
            </span>
          )}
          <span className="truncate">{ev.title as string}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Section: Tasks ──────────────────────────────────────────────────────────

function TasksSection({
  memberId,
  tasks,
  assignments,
  onComplete,
}: {
  memberId: string
  tasks: Array<Record<string, unknown>>
  assignments: Array<{ task_id: string; family_member_id: string }>
  onComplete: (taskId: string, memberId: string) => void
}) {
  // Tasks assigned to this member via task_assignments or legacy assignee_id
  const assignedTaskIds = new Set(
    assignments.filter((a) => a.family_member_id === memberId).map((a) => a.task_id)
  )
  const memberTasks = tasks.filter(
    (t) => assignedTaskIds.has(t.id as string) || t.assignee_id === memberId
  )

  // Sort: incomplete first, then completed
  const sorted = [...memberTasks].sort((a, b) => {
    const aComplete = a.status === 'completed'
    const bComplete = b.status === 'completed'
    if (aComplete !== bComplete) return aComplete ? 1 : -1
    return (a.sort_order as number) - (b.sort_order as number)
  })

  const completedCount = sorted.filter((t) => t.status === 'completed').length

  if (sorted.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {sorted.map((t) => {
        const isComplete = t.status === 'completed'
        return (
          <div key={t.id as string} className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                if (!isComplete) onComplete(t.id as string, memberId)
              }}
              data-testid={`task-checkbox-${t.id}`}
              className="shrink-0 w-4 h-4 rounded border flex items-center justify-center"
              style={{
                borderColor: isComplete ? 'var(--color-btn-primary-bg)' : 'var(--color-border-default)',
                backgroundColor: isComplete ? 'var(--color-btn-primary-bg)' : 'transparent',
              }}
              disabled={isComplete}
            >
              {isComplete && <Check size={10} style={{ color: 'var(--color-text-on-primary, #fff)' }} />}
            </button>
            <span
              className={isComplete ? 'line-through' : ''}
              style={{
                color: isComplete ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              }}
            >
              {t.title as string}
            </span>
          </div>
        )
      })}
      <div className="text-xs pt-1" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
        {completedCount}/{sorted.length} done
      </div>
    </div>
  )
}

// ─── Section: Best Intentions ────────────────────────────────────────────────

function BestIntentionsSection({
  memberId,
  intentions,
  iterationCounts,
}: {
  memberId: string
  intentions: Array<Record<string, unknown>>
  iterationCounts: Map<string, number>
}) {
  const memberIntentions = intentions.filter((i) => i.member_id === memberId)

  if (memberIntentions.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {memberIntentions.map((intention) => {
        const count = iterationCounts.get(intention.id as string) ?? 0
        return (
          <div key={intention.id as string} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: (intention.color as string) || 'var(--color-btn-primary-bg)' }}
            />
            <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
              {intention.statement as string}
            </span>
            <span
              className="ml-auto shrink-0 font-medium"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              x{count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section: Trackers ───────────────────────────────────────────────────────

function TrackersSection({
  memberId,
  trackers,
}: {
  memberId: string
  trackers: Array<Record<string, unknown>>
}) {
  const memberTrackers = trackers.filter((w) => w.family_member_id === memberId)

  if (memberTrackers.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {memberTrackers.map((w) => {
        const config = (w.config as Record<string, unknown>) ?? {}
        const label = (config.label as string) || (config.title as string) || 'Tracker'
        return (
          <div key={w.id as string} className="flex items-center gap-1.5 text-xs">
            <BarChart3 size={10} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section: Opportunities ──────────────────────────────────────────────────

function OpportunitiesSection({
  memberId,
  opportunities,
}: {
  memberId: string
  opportunities: Array<Record<string, unknown>>
}) {
  const memberOpps = opportunities.filter((o) => o.assignee_id === memberId)

  if (memberOpps.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {memberOpps.map((opp) => (
        <div key={opp.id as string} className="flex items-center gap-1.5 text-xs">
          <Check size={10} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
            {opp.title as string}
          </span>
          {opp.points_override != null && (
            <span className="ml-auto text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {opp.points_override as number} pts
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Section: Routines (FO-COMMAND-CENTER) ───────────────────────────────────
// Data comes from get_member_day_obligations (Convention #271) — never re-derive
// "what counts today" inline.

function RoutinesSection({ routines }: { routines: MemberRoutineToday[] }) {
  if (routines.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-1 px-2 pb-2">
      {routines.map((r) => {
        const allDone = r.total_steps > 0 && r.done_steps === r.total_steps
        return (
          <div key={r.task_id} className="flex items-center gap-1.5 text-xs">
            <RefreshCw
              size={10}
              style={{ color: allDone ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
            />
            <span
              className={`truncate ${allDone ? 'line-through' : ''}`}
              style={{ color: allDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
            >
              {r.title}
            </span>
            <span
              className="ml-auto shrink-0 font-medium"
              style={{ color: allDone ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
            >
              {r.done_steps}/{r.total_steps}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section: Sequential (FO-COMMAND-CENTER) ─────────────────────────────────

function SequentialSection({ items }: { items: MemberSequentialSummary[] }) {
  if (items.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-1.5 px-2 pb-2">
      {items.map((s) => (
        <div key={s.collection_id} className="text-xs">
          <div className="flex items-center gap-1.5">
            <BookOpen size={10} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {s.collection_title}
            </span>
            <span className="ml-auto shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
              {s.completed_count}/{s.total_items}
            </span>
          </div>
          {s.current_item_title && (
            <div className="pl-4 truncate" style={{ color: 'var(--color-text-secondary)' }}>
              Next: {s.current_item_title}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Section: Victories (FO-COMMAND-CENTER — wired, was stub) ────────────────

function VictoriesSection({
  memberId,
  victories,
}: {
  memberId: string
  victories: Array<Record<string, unknown>>
}) {
  const memberVictories = victories.filter((v) => v.family_member_id === memberId)

  if (memberVictories.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {memberVictories.map((v) => (
        <div key={v.id as string} className="flex items-start gap-1.5 text-xs">
          <Trophy size={10} className="shrink-0 mt-0.5" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span style={{ color: 'var(--color-text-primary)' }}>
            {(v.description as string) || (v.celebration_text as string)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Section: Weekly Completion (FO-COMMAND-CENTER — wired, was stub) ────────
// PRD-14C Section 5: completion percentage + on-track payout. Reads the live
// allowance progress RPC (PRD-28) for the member's default pool active period.

function WeeklyCompletionSection({ memberId }: { memberId: string }) {
  const { data: period } = useActivePeriod(memberId)
  const { data: progress } = useLiveAllowanceProgress(
    memberId,
    period?.period_start,
    period?.period_end,
    (period?.grace_days as GraceDayEntry[] | undefined) ?? undefined,
  )

  if (!period) {
    return (
      <div className="px-2 pb-2 text-xs" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
        (no allowance period)
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="px-2 pb-2 text-xs" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
        …
      </div>
    )
  }

  return (
    <div className="px-2 pb-2 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {Math.round(progress.completion_percentage)}%
        </span>
        {/* Progress bar */}
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, progress.completion_percentage))}%`,
              backgroundColor: 'var(--color-btn-primary-bg)',
            }}
          />
        </div>
      </div>
      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        ${progress.total_earned.toFixed(2)} on track
        {progress.bonus_applied && ' · bonus!'}
      </div>
    </div>
  )
}

// ─── Stub sections ───────────────────────────────────────────────────────────

function StubSection({ label }: { label: string }) {
  return (
    <div className="px-2 pb-2 text-xs italic" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
      {label} — Coming soon
    </div>
  )
}

function EmptySection() {
  return (
    <div className="px-2 pb-2 text-xs" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
      (none today)
    </div>
  )
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'p' : 'a'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, '0')}${suffix}`
}

// ─── Member Column ───────────────────────────────────────────────────────────

function MemberColumn({
  member,
  sectionOrder,
  sectionStates,
  events,
  tasks,
  assignments,
  intentions,
  iterationCounts,
  trackers,
  opportunities,
  routines,
  sequential,
  victories,
  onToggleSection,
  onCompleteTask,
  onSpotCheck,
}: {
  member: FamilyMember
  sectionOrder: string[]
  sectionStates: Record<string, SectionCollapseState>
  events: Array<Record<string, unknown>>
  tasks: Array<Record<string, unknown>>
  assignments: Array<{ task_id: string; family_member_id: string }>
  intentions: Array<Record<string, unknown>>
  iterationCounts: Map<string, number>
  trackers: Array<Record<string, unknown>>
  opportunities: Array<Record<string, unknown>>
  routines: MemberRoutineToday[]
  sequential: MemberSequentialSummary[]
  victories: Array<Record<string, unknown>>
  onToggleSection: (sectionKey: FamilyOverviewSectionKey, memberId: string) => void
  onCompleteTask: (taskId: string, memberId: string) => void
  onSpotCheck: (member: FamilyMember) => void
}) {
  const color = member.calendar_color || getMemberColor(member)

  const isSectionCollapsed = (key: FamilyOverviewSectionKey) => {
    const state = sectionStates[key]
    if (!state) return false
    const override = state.overrides?.[member.id]
    return override !== undefined ? override : state.collapsed
  }

  const hasOverride = (key: FamilyOverviewSectionKey) => {
    const state = sectionStates[key]
    return state?.overrides?.[member.id] !== undefined
  }

  const renderSection = (key: string) => {
    const sectionKey = key as FamilyOverviewSectionKey
    if (!FAMILY_OVERVIEW_SECTION_KEYS.includes(sectionKey)) {
      return <StubSection key={key} label={key} />
    }

    const collapsed = isSectionCollapsed(sectionKey)

    // Count for badge
    let count: number | undefined
    if (sectionKey === 'tasks') {
      const assignedIds = new Set(assignments.filter((a) => a.family_member_id === member.id).map((a) => a.task_id))
      count = tasks.filter((t) => assignedIds.has(t.id as string) || t.assignee_id === member.id).length
    } else if (sectionKey === 'events') {
      count = events.filter((ev) => {
        if (ev.created_by === member.id) return true
        return ((ev.event_attendees as Array<{ family_member_id: string }>) ?? []).some((a) => a.family_member_id === member.id)
      }).length
    } else if (sectionKey === 'routines') {
      count = routines.length
    } else if (sectionKey === 'sequential') {
      count = sequential.length
    } else if (sectionKey === 'victories') {
      count = victories.filter((v) => v.family_member_id === member.id).length
    }

    return (
      <div key={key}>
        <SectionHeader
          sectionKey={sectionKey}
          collapsed={collapsed}
          count={count}
          hasOverride={hasOverride(sectionKey)}
          onToggle={() => onToggleSection(sectionKey, member.id)}
        />
        {!collapsed && renderSectionContent(sectionKey)}
      </div>
    )
  }

  const renderSectionContent = (key: FamilyOverviewSectionKey) => {
    switch (key) {
      case 'events':
        return <EventsSection memberId={member.id} events={events} />
      case 'tasks':
        return (
          <TasksSection
            memberId={member.id}
            tasks={tasks}
            assignments={assignments}
            onComplete={onCompleteTask}
          />
        )
      case 'best_intentions':
        return (
          <BestIntentionsSection
            memberId={member.id}
            intentions={intentions}
            iterationCounts={iterationCounts}
          />
        )
      case 'routines':
        return <RoutinesSection routines={routines} />
      case 'sequential':
        return <SequentialSection items={sequential} />
      case 'trackers':
        return <TrackersSection memberId={member.id} trackers={trackers} />
      case 'weekly_completion':
        return <WeeklyCompletionSection memberId={member.id} />
      case 'opportunities':
        return <OpportunitiesSection memberId={member.id} opportunities={opportunities} />
      case 'victories':
        return <VictoriesSection memberId={member.id} victories={victories} />
      default:
        return <StubSection label={key} />
    }
  }

  return (
    <div
      className="shrink-0 snap-start rounded-lg overflow-hidden"
      data-testid={`member-column-${member.id}`}
      data-member-name={member.display_name.split(' ')[0]}
      style={{
        width: 'var(--fo-column-width, 280px)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* Sticky column header — tap to spot-check (FO-COMMAND-CENTER) */}
      <button
        className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 w-full text-left"
        data-testid={`column-header-${member.id}`}
        onClick={() => onSpotCheck(member)}
        aria-label={`Open ${member.display_name.split(' ')[0]}'s items`}
        style={{
          borderBottom: `3px solid ${color}`,
          backgroundColor: 'var(--color-bg-card)',
          cursor: 'pointer',
        }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)' }}
        >
          {member.display_name.charAt(0)}
        </span>
        <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {member.display_name.split(' ')[0]}
        </span>
        <ChevronRight size={14} className="ml-auto shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
      </button>

      {/* Sections */}
      <div className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
        {sectionOrder.map(renderSection)}
      </div>
    </div>
  )
}

// ─── Onboarding Card ─────────────────────────────────────────────────────────

function OnboardingCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
      }}
    >
      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
        This is your Family Overview. Once your family starts using MyAIM, you'll see
        everyone's activity here at a glance. Start by assigning some tasks or creating calendar events.
      </p>
      <button
        onClick={onDismiss}
        className="mt-2 text-xs font-medium"
        style={{ color: 'var(--color-btn-primary-bg)' }}
      >
        Got it
      </button>
    </div>
  )
}

// ─── Calendar Section ────────────────────────────────────────────────────────

function FamilyOverviewCalendar({
  selectedMemberIds,
  collapsed,
  onToggleCollapse,
}: {
  selectedMemberIds: string[]
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { data: events } = useTodayEventsForMembers(selectedMemberIds)
  const { data: family } = useFamily()
  const { data: allMembers } = useFamilyMembers(family?.id)

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const memberColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of allMembers ?? []) {
      map.set(m.id, m.calendar_color || getMemberColor(m))
    }
    return map
  }, [allMembers])

  return (
    <div
      className="rounded-lg mb-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <button
        onClick={onToggleCollapse}
        data-testid="fo-calendar-toggle"
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <Calendar size={14} />
        <span>Family Calendar</span>
        <span className="ml-auto text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>
          {todayStr}
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {(!events || events.length === 0) ? (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No events today for selected members
            </p>
          ) : (
            <div className="space-y-1">
              {events.map((ev) => {
                const color = memberColorMap.get(ev.created_by as string) || 'var(--color-text-secondary)'
                return (
                  <div
                    key={ev.id as string}
                    className="flex items-center gap-2 text-xs"
                    style={{ opacity: ev.status === 'pending_approval' ? 0.5 : 1 }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {ev.start_time && (
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {formatTime(ev.start_time as string)}
                      </span>
                    )}
                    <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {ev.title as string}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FamilyOverview() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: allMembers } = useFamilyMembers(family?.id)
  const { data: config } = useFamilyOverviewConfig(family?.id, member?.id)
  const updateConfig = useUpdateFamilyOverviewConfig()
  const completeTask = useCompleteTask()
  const routingToast = useRoutingToast()

  // ── FO-COMMAND-CENTER: page tabs + relocated surfaces ──
  const [foSearchParams, setFoSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<FamilyOverviewTab>(() => {
    const param = foSearchParams.get('fotab')
    return param === 'approvals' || param === 'queue' || param === 'finances' ? param : 'overview'
  })
  useEffect(() => {
    // Consume the deep-link param (relocated /tasks?tab=finances links etc.)
    if (foSearchParams.get('fotab')) {
      const next = new URLSearchParams(foSearchParams)
      next.delete('fotab')
      setFoSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [spotCheckMember, setSpotCheckMember] = useState<FamilyMember | null>(null)
  const isPrimaryParent = member?.role === 'primary_parent'

  // PERMISSIONS-WIRING scoping for the relocated Approvals surface
  const { viewableIds, viewableLevels } = useViewableMembers(
    'tasks_basic',
    member ? { id: member.id, family_id: member.family_id, role: member.role } : null,
  )
  const canActOnTask = useCallback(
    (task: Task): boolean => {
      if (isPrimaryParent) return true
      if (!task.assignee_id || task.assignee_id === member?.id) return true
      return accessLevelAtLeast(viewableLevels[task.assignee_id], 'contribute')
    },
    [isPrimaryParent, member?.id, viewableLevels],
  )

  const { data: pendingApprovalTasks = [] } = useTasksWithPendingApprovals(family?.id)
  const visiblePendingApprovals = useMemo(
    () => filterVisiblePendingApprovals(pendingApprovalTasks, isPrimaryParent, member?.id, viewableIds),
    [pendingApprovalTasks, isPrimaryParent, member?.id, viewableIds],
  )

  const { data: queueItems = [] } = usePendingQueueCount(family?.id, member?.id, member?.role)

  // ── Dad's scoped view: granted-permission member list ──
  // FO-COMMAND-CENTER Phase 4: replaced the stale pre-leak-pass
  // `view_as_permissions` read with `useViewableMembers` — the same
  // member_permissions-backed scoping the rest of the platform uses
  // (mom → all; additional_adult → self + granted; others → self).

  const isMom = isPrimaryParent

  const availableMembers = useMemo(() => {
    if (!allMembers) return []
    const active = allMembers.filter((m) => m.is_active && !m.out_of_nest)
    if (isMom) return active // mom sees all
    return active.filter((m) => viewableIds.has(m.id))
  }, [allMembers, isMom, viewableIds])

  // ── Derived state ──

  const isFirstTime = !config || config.selected_member_ids.length === 0
  const onboardingDismissed = (config?.preferences as Record<string, unknown>)?.onboarding_dismissed === true

  // First-time default: all children selected (within permission scope)
  const selectedMemberIds = useMemo(() => {
    if (config && config.selected_member_ids.length > 0) {
      // Filter saved selection by current permissions
      const availableIds = new Set(availableMembers.map((m) => m.id))
      return config.selected_member_ids.filter((id) => availableIds.has(id))
    }
    return availableMembers
      .filter((m) => m.role === 'member')
      .map((m) => m.id)
  }, [config, availableMembers])

  // mergeSectionOrder: saved orders predating the routines/sequential keys
  // gain them at their canonical positions (read-time, never rewrites the row)
  const sectionOrder = useMemo(() => {
    if (config && config.section_order.length > 0) return mergeSectionOrder(config.section_order)
    return [...FAMILY_OVERVIEW_SECTION_KEYS]
  }, [config])

  const sectionStates = config?.section_states ?? {}
  const calendarCollapsed = config?.calendar_collapsed ?? false

  // Selected members in column order
  const selectedMembers = useMemo(() => {
    const memberMap = new Map((allMembers ?? []).map((m) => [m.id, m]))
    const order = config?.column_order?.length ? config.column_order : selectedMemberIds
    return order.filter((id) => selectedMemberIds.includes(id)).map((id) => memberMap.get(id)).filter(Boolean) as FamilyMember[]
  }, [allMembers, selectedMemberIds, config?.column_order])

  // ── Data queries (batch for all selected members) ──

  const { data: events = [] } = useTodayEventsForMembers(selectedMemberIds)
  const { data: tasks = [] } = useTodayTasksForMembers(selectedMemberIds)
  const { data: assignments = [] } = useTaskAssignmentsForMembers(selectedMemberIds)
  const { data: intentions = [] } = useBestIntentionsForMembers(selectedMemberIds)
  const { data: iterations = [] } = useTodayIterationsForMembers(selectedMemberIds)
  const { data: trackers = [] } = useTrackersForMembers(family?.id, selectedMemberIds)
  const { data: opportunities = [] } = useTodayOpportunityCompletions(family?.id, selectedMemberIds)
  const { data: routinesByMember = {} } = useTodayRoutinesForMembers(selectedMemberIds)
  const { data: sequentialByMember = {} } = useSequentialForMembers(family?.id, selectedMemberIds)
  const { data: victories = [] } = useTodayVictoriesForMembers(family?.id, selectedMemberIds)

  // Map iteration counts per intention
  const iterationCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const iter of iterations) {
      const key = (iter as Record<string, unknown>).intention_id as string
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [iterations])

  // ── Handlers ──

  const handleToggleMember = useCallback(
    (memberId: string) => {
      if (!family?.id || !member?.id) return
      const newIds = selectedMemberIds.includes(memberId)
        ? selectedMemberIds.filter((id) => id !== memberId)
        : [...selectedMemberIds, memberId]
      updateConfig.mutate({
        familyId: family.id,
        memberId: member.id,
        selectedMemberIds: newIds,
      })
    },
    [family?.id, member?.id, selectedMemberIds, updateConfig]
  )

  const handleToggleCalendar = useCallback(() => {
    if (!family?.id || !member?.id) return
    updateConfig.mutate({
      familyId: family.id,
      memberId: member.id,
      calendarCollapsed: !calendarCollapsed,
    })
  }, [family?.id, member?.id, calendarCollapsed, updateConfig])

  const handleToggleSection = useCallback(
    (sectionKey: FamilyOverviewSectionKey, _memberId: string) => {
      if (!family?.id || !member?.id) return
      // Row-level toggle (all columns)
      const current = sectionStates[sectionKey] ?? { collapsed: false }
      const newStates = {
        ...sectionStates,
        [sectionKey]: {
          ...current,
          collapsed: !current.collapsed,
          // Clear overrides when row-level toggles
          overrides: {},
        },
      }
      updateConfig.mutate({
        familyId: family.id,
        memberId: member.id,
        sectionStates: newStates,
      })
    },
    [family?.id, member?.id, sectionStates, updateConfig]
  )

  const handleCompleteTask = useCallback(
    (taskId: string, targetMemberId: string) => {
      // PERMISSIONS-WIRING Decision 9: view-only grants see, never act.
      if (
        !isPrimaryParent &&
        targetMemberId !== member?.id &&
        !accessLevelAtLeast(viewableLevels[targetMemberId], 'contribute')
      ) {
        routingToast.show({
          message: "You have view-only access to this family member's tasks.",
          variant: 'error',
        })
        return
      }
      completeTask.mutate({ taskId, memberId: targetMemberId })
    },
    [completeTask, isPrimaryParent, member?.id, viewableLevels, routingToast]
  )

  const handleDismissOnboarding = useCallback(() => {
    if (!family?.id || !member?.id) return
    updateConfig.mutate({
      familyId: family.id,
      memberId: member.id,
      preferences: { ...((config?.preferences as Record<string, unknown>) ?? {}), onboarding_dismissed: true },
    })
  }, [family?.id, member?.id, config?.preferences, updateConfig])

  // ── Column width ──

  const containerRef = useRef<HTMLDivElement>(null)
  const [columnWidth, setColumnWidth] = useState(280)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      // Mobile: 1 col. Tablet: 2-3. Desktop: 3-5.
      const cols = w < 600 ? 1 : w < 900 ? 2 : w < 1200 ? 3 : Math.min(5, selectedMembers.length)
      const gap = (cols - 1) * 12
      setColumnWidth(Math.floor((w - gap) / Math.max(cols, 1)))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [selectedMembers.length])

  // ── Render ──

  if (!family?.id || !member?.id) return null

  // Dad with no permitted children
  if (!isMom && availableMembers.length <= 1) {
    return (
      <div className="text-sm py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        <p>No family members are available in your overview.</p>
        <p className="mt-1">Contact {(allMembers ?? []).find((m) => m.role === 'primary_parent')?.display_name ?? 'Mom'} to adjust permissions.</p>
      </div>
    )
  }

  const pillMembers = availableMembers.map((m) => ({
    id: m.id,
    display_name: m.display_name,
    calendar_color: m.calendar_color,
    assigned_color: m.assigned_color,
    member_color: m.member_color,
  }))

  // ── FO-COMMAND-CENTER page tabs ──
  const pageTabs: TabItem[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
    {
      key: 'approvals',
      label: `Approvals${visiblePendingApprovals.length > 0 ? ` (${visiblePendingApprovals.length})` : ''}`,
      icon: <ClipboardCheck size={15} />,
    },
    // Queue + Finances stay mom-scoped (queue RLS is primary_parent family-wide;
    // Finances parity with the prior Tasks-page gating)
    ...(isPrimaryParent
      ? [
          {
            key: 'queue' as const,
            label: `Queue${queueItems.length > 0 ? ` (${queueItems.length})` : ''}`,
            icon: <Inbox size={15} />,
          },
          { key: 'finances' as const, label: 'Finances', icon: <DollarSign size={15} /> },
        ]
      : []),
  ]

  return (
    <div className="space-y-3 density-compact" data-testid="family-overview">
      {/* FO-COMMAND-CENTER: command center tabs (relocated from Tasks page) */}
      <Tabs
        tabs={pageTabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as FamilyOverviewTab)}
      />

      {/* ── Approvals tab (relocated PendingApprovalsSection, mastery fork intact) ── */}
      {activeTab === 'approvals' && (
        visiblePendingApprovals.length > 0 ? (
          <PendingApprovalsSection
            tasks={visiblePendingApprovals}
            familyMembers={allMembers ?? []}
            approverId={member.id}
            canActOnTask={canActOnTask}
          />
        ) : (
          <div className="text-sm py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            <p>Nothing waiting for approval.</p>
            <p className="mt-1">When someone submits work for review, it will appear here.</p>
          </div>
        )
      )}

      {/* ── Queue tab (relocated studio_queue decision inbox — full SortTab) ── */}
      {activeTab === 'queue' && isPrimaryParent && <SortTab />}

      {/* ── Finances tab (relocated from Tasks page, founder Q7) ── */}
      {activeTab === 'finances' && isPrimaryParent && <FinancesTab familyId={family.id} />}

      {activeTab === 'overview' && (
        <>
      {/* Feature Guide — page identity changed materially (Convention #14) */}
      <FeatureGuide
        featureKey="family_overview"
        title="Family Overview — Your Command Center"
        description="Everything that needs your eyes in one place: every kid's day at a glance, approvals, the decision queue, and family finances."
        bullets={[
          'Swipe through member columns — tasks, routines, sequential progress, victories, and more per kid',
          "Tap a member's name to spot-check their items and edit right there",
          'Approvals, Queue, and Finances tabs handle everything waiting on you',
          'Pick which sections show with the section headers; your setup is remembered',
        ]}
      />

      {/* Pending Items Bar */}
      <PendingItemsBar familyId={family.id} />

      {/* Family Calendar */}
      <FamilyOverviewCalendar
        selectedMemberIds={selectedMemberIds}
        collapsed={calendarCollapsed}
        onToggleCollapse={handleToggleCalendar}
      />

      {/* Member Pill Selector */}
      <MemberPillSelector
        members={pillMembers}
        selectedIds={selectedMemberIds}
        onToggle={handleToggleMember}
      />

      {/* Onboarding Card */}
      {isFirstTime && !onboardingDismissed && (
        <OnboardingCard onDismiss={handleDismissOnboarding} />
      )}

      {/* Member Columns */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={
          {
            '--fo-column-width': `${columnWidth}px`,
            scrollbarWidth: 'thin',
          } as React.CSSProperties
        }
      >
        {selectedMembers.length === 0 ? (
          <div className="text-sm py-8 text-center w-full" style={{ color: 'var(--color-text-secondary)' }}>
            Select family members above to see their activity
          </div>
        ) : (
          selectedMembers.map((m) => (
            <MemberColumn
              key={m.id}
              member={m}
              sectionOrder={sectionOrder}
              sectionStates={sectionStates}
              events={events as Array<Record<string, unknown>>}
              tasks={tasks as Array<Record<string, unknown>>}
              assignments={assignments as Array<{ task_id: string; family_member_id: string }>}
              intentions={intentions as Array<Record<string, unknown>>}
              iterationCounts={iterationCounts}
              trackers={trackers as Array<Record<string, unknown>>}
              opportunities={opportunities as Array<Record<string, unknown>>}
              routines={routinesByMember[m.id] ?? []}
              sequential={sequentialByMember[m.id] ?? []}
              victories={victories as Array<Record<string, unknown>>}
              onToggleSection={handleToggleSection}
              onCompleteTask={handleCompleteTask}
              onSpotCheck={setSpotCheckMember}
            />
          ))
        )}
      </div>

      {/* Mobile dot indicators */}
      {selectedMembers.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden" data-testid="fo-dot-indicators">
          {selectedMembers.map((m) => (
            <span
              key={m.id}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: m.calendar_color || getMemberColor(m),
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}
        </>
      )}

      {/* ── Member spot-check (FO-COMMAND-CENTER deep view, founder Q4) ── */}
      {spotCheckMember && (
        <MemberSpotCheck
          member={spotCheckMember}
          familyId={family.id}
          viewerId={member.id}
          viewerIsPrimaryParent={isPrimaryParent}
          canAct={
            isPrimaryParent ||
            spotCheckMember.id === member.id ||
            accessLevelAtLeast(viewableLevels[spotCheckMember.id], 'contribute')
          }
          onClose={() => setSpotCheckMember(null)}
        />
      )}
    </div>
  )
}
