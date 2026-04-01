// PRD-14C: Family Overview — Mom's aggregated command post.
// Horizontally-swipeable member columns with collapsible sections.

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Check, Star, Trophy, Target, Zap, BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useFamilyOverviewConfig,
  useUpdateFamilyOverviewConfig,
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
} from '@/hooks/useFamilyOverviewData'
import { useCompleteTask } from '@/hooks/useTasks'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import PendingItemsBar from './PendingItemsBar'
import type { FamilyMember } from '@/hooks/useFamilyMember'

// ─── Section metadata ────────────────────────────────────────────────────────

const SECTION_META: Record<FamilyOverviewSectionKey, { label: string; icon: React.ReactNode }> = {
  events: { label: "Today's Events", icon: <Calendar size={14} /> },
  tasks: { label: "Today's Tasks", icon: <Check size={14} /> },
  best_intentions: { label: 'Best Intentions', icon: <Star size={14} /> },
  trackers: { label: 'Active Trackers', icon: <BarChart3 size={14} /> },
  weekly_completion: { label: 'Weekly Completion', icon: <Target size={14} /> },
  opportunities: { label: 'Opportunities', icon: <Zap size={14} /> },
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
            <span className="flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
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
              className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center"
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
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: (intention.color as string) || 'var(--color-btn-primary-bg)' }}
            />
            <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
              {intention.statement as string}
            </span>
            <span
              className="ml-auto flex-shrink-0 font-medium"
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
  onToggleSection,
  onCompleteTask,
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
  onToggleSection: (sectionKey: FamilyOverviewSectionKey, memberId: string) => void
  onCompleteTask: (taskId: string, memberId: string) => void
}) {
  const color = member.calendar_color || member.assigned_color || member.member_color || 'var(--color-btn-primary-bg)'

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
      case 'trackers':
        return <TrackersSection memberId={member.id} trackers={trackers} />
      case 'weekly_completion':
        return <StubSection label="Weekly Completion" />
      case 'opportunities':
        return <OpportunitiesSection memberId={member.id} opportunities={opportunities} />
      case 'victories':
        return <StubSection label="Victories" />
      default:
        return <StubSection label={key} />
    }
  }

  return (
    <div
      className="flex-shrink-0 snap-start rounded-lg overflow-hidden"
      data-testid={`member-column-${member.id}`}
      data-member-name={member.display_name.split(' ')[0]}
      style={{
        width: 'var(--fo-column-width, 280px)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* Sticky column header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2"
        data-testid={`column-header-${member.id}`}
        style={{
          borderBottom: `3px solid ${color}`,
          backgroundColor: 'var(--color-bg-card)',
        }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)' }}
        >
          {member.display_name.charAt(0)}
        </span>
        <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {member.display_name.split(' ')[0]}
        </span>
      </div>

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
      map.set(m.id, m.calendar_color || m.assigned_color || 'var(--color-btn-primary-bg)')
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
                      className="w-2 h-2 rounded-full flex-shrink-0"
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

  // ── Dad's scoped view: permission-gated member list ──

  const isMom = member?.role === 'primary_parent'
  const [permittedMemberIds, setPermittedMemberIds] = useState<Set<string> | null>(null)

  useEffect(() => {
    if (!member || !family) return
    if (isMom) {
      setPermittedMemberIds(null) // null = no filtering (mom sees all)
      return
    }
    // Non-mom: load view_as_permissions to determine visible children
    supabase
      .from('view_as_permissions')
      .select('target_member_id')
      .eq('family_id', family.id)
      .eq('viewer_id', member.id)
      .eq('enabled', true)
      .then(({ data }) => {
        if (data) {
          // Dad can see permitted children + himself
          const ids = new Set(data.map((r: { target_member_id: string }) => r.target_member_id))
          ids.add(member.id)
          setPermittedMemberIds(ids)
        } else {
          setPermittedMemberIds(new Set([member.id]))
        }
      })
  }, [member?.id, family?.id, isMom])

  // Members available for pill selection (permission-filtered for dad)
  const availableMembers = useMemo(() => {
    if (!allMembers) return []
    const active = allMembers.filter((m) => m.is_active && !m.out_of_nest)
    if (permittedMemberIds === null) return active // mom sees all
    return active.filter((m) => permittedMemberIds.has(m.id))
  }, [allMembers, permittedMemberIds])

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

  const sectionOrder = useMemo(() => {
    if (config && config.section_order.length > 0) return config.section_order
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
      completeTask.mutate({ taskId, memberId: targetMemberId })
    },
    [completeTask]
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

  return (
    <div className="space-y-3 density-compact" data-testid="family-overview">
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
              onToggleSection={handleToggleSection}
              onCompleteTask={handleCompleteTask}
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
                backgroundColor: m.calendar_color || m.assigned_color || 'var(--color-text-secondary)',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
