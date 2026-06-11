// PRD-14C: Family Overview — Mom's aggregated command post.
// Horizontally-swipeable member columns with collapsible sections.

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Check, Star, Trophy, Target, Zap, BarChart3, RefreshCw, BookOpen, GripVertical, Plus } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  useActiveOpportunityClaims,
  type MemberRoutineToday,
  type MemberSequentialSummary,
  type MemberOpportunityClaim,
} from '@/hooks/useFamilyOverviewData'
import { useUnclaimOpportunity } from '@/hooks/useOpportunityLists'
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
import { FinancesTab, type FinanceAccessLevel } from '@/features/financial/FinancesTab'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'
import { MemberSpotCheck } from './MemberSpotCheck'
// FO-COMMAND-CENTER founder feedback 2026-06-10: every column item is
// tap-to-edit — the right editor opens right above the page.
import { useTaskEditor } from '@/hooks/useTaskEditor'
import { TaskEditModal } from '@/components/tasks/TaskEditModal'
import { SequentialDetailModal } from '@/components/tasks/sequential/SequentialDetailModal'
import { WidgetDetailView } from '@/components/widgets/WidgetDetailView'
import { EventCreationModal } from '@/components/calendar/EventCreationModal'
import { useRecordWidgetData } from '@/hooks/useWidgets'
import type { DashboardWidget } from '@/types/widgets'
import type { CalendarEvent, EventAttendee } from '@/types/calendar'
// Build M segments on FO columns (founder ask 2026-06-10): Play/Guided kids'
// tasks group under their day-segment headers; tapping a header opens the
// Day Segments editor (Gamification Settings) for that kid.
import { useTaskSegments } from '@/hooks/useTaskSegments'
import { isSegmentActiveToday } from '@/lib/segments/segmentUtils'
import { GamificationSettingsModal } from '@/components/gamification/settings/GamificationSettingsModal'
// Per-section [+ create] (founder ask 2026-06-10): each section header gets a
// creation entry point pre-targeted at that member.
import { useQueryClient } from '@tanstack/react-query'
import { TaskCreationModal, type CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { SequentialCreatorModal } from '@/components/tasks/sequential/SequentialCreatorModal'
import { CreateBestIntentionModal } from '@/components/intentions/CreateBestIntentionModal'
import { RecordVictoryModal } from '@/components/victories/RecordVictoryModal'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import { useWidgetStarterConfigs, useCreateWidget } from '@/hooks/useWidgets'
import { createTaskFromData } from '@/utils/createTaskFromData'
import type { WidgetStarterConfig, CreateWidget } from '@/types/widgets'
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
  onOverrideToggle,
  dragHandleProps,
  onCreate,
}: {
  sectionKey: FamilyOverviewSectionKey
  collapsed: boolean
  count?: number
  hasOverride?: boolean
  onToggle: () => void
  /** PRD-14C: long-press toggles THIS column's section only (override). */
  onOverrideToggle?: () => void
  /** dnd-kit listeners for the section reorder grip (Universal UX: ⠿ handle). */
  dragHandleProps?: Record<string, unknown>
  /** Founder ask 2026-06-10: [+ create] a new item of this category for this member */
  onCreate?: () => void
}) {
  const meta = SECTION_META[sectionKey]

  // ── Long-press detection (PRD-14C per-column override) ──
  const pressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)
  const pressStart = useRef<{ x: number; y: number } | null>(null)

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    pressStart.current = null
  }
  const startPress = (e: React.PointerEvent) => {
    if (!onOverrideToggle) return
    longPressFired.current = false
    cancelPress()
    pressStart.current = { x: e.clientX, y: e.clientY }
    pressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      pressTimer.current = null
      onOverrideToggle()
    }, 500)
  }
  // Cancel only on real movement (8px slop) — finger tremor shouldn't kill
  // the hold on touch devices.
  const movePress = (e: React.PointerEvent) => {
    if (!pressStart.current) return
    const dx = e.clientX - pressStart.current.x
    const dy = e.clientY - pressStart.current.y
    if (dx * dx + dy * dy > 64) cancelPress()
  }
  const handleClick = () => {
    if (longPressFired.current) {
      // The long-press already toggled the override — swallow the click
      longPressFired.current = false
      return
    }
    onToggle()
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerMove={movePress}
        onContextMenu={(e) => e.preventDefault()}
        data-testid={`section-header-${sectionKey}`}
        className="flex-1 flex items-center gap-1.5 py-1.5 px-2 text-xs font-semibold"
        style={{ color: 'var(--color-text-secondary)', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
        title={onOverrideToggle ? 'Tap: collapse everywhere · Hold: just this column' : undefined}
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
      {onCreate && (
        <button
          onClick={onCreate}
          data-testid={`section-create-${sectionKey}`}
          className="px-1 py-1.5 shrink-0"
          style={{ color: 'var(--color-btn-primary-bg)' }}
          aria-label={`New ${meta.label} item`}
          title={`New ${meta.label.toLowerCase()} for this member`}
        >
          <Plus size={12} />
        </button>
      )}
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          data-testid={`section-drag-${sectionKey}`}
          className="px-1.5 py-1.5 shrink-0"
          style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))', cursor: 'grab', touchAction: 'none' }}
          aria-label={`Reorder ${meta.label} section`}
        >
          <GripVertical size={12} />
        </span>
      )}
    </div>
  )
}

// ─── Sortable section wrapper (global section reorder, persists) ────────────

function SortableSection({
  id,
  children,
}: {
  id: string
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        position: 'relative',
        zIndex: isDragging ? 5 : undefined,
        backgroundColor: isDragging ? 'var(--color-bg-card)' : undefined,
      }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  )
}

// ─── Section: Events ─────────────────────────────────────────────────────────

function EventsSection({
  memberId,
  events,
  onOpenEvent,
}: {
  memberId: string
  events: Array<Record<string, unknown>>
  onOpenEvent?: (event: Record<string, unknown>) => void
}) {
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
        <ItemRow key={ev.id as string} onOpen={onOpenEvent ? () => onOpenEvent(ev) : undefined}>
          <div
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
        </ItemRow>
      ))}
    </div>
  )
}

// ─── ItemRow — tap-to-edit wrapper (founder feedback 2026-06-10) ─────────────
// Wraps a column row in a button when an editor is available; plain div when
// the viewer can't act (view-only dads) or the row has no editor.

function ItemRow({
  onOpen,
  children,
}: {
  onOpen?: () => void
  children: React.ReactNode
}) {
  if (!onOpen) return <>{children}</>
  return (
    <button
      onClick={onOpen}
      className="block w-full text-left rounded transition-colors hover:opacity-80"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

// ─── Section: Tasks ──────────────────────────────────────────────────────────

function TasksSection({
  memberId,
  tasks,
  assignments,
  onComplete,
  onEditTask,
  onOpenSegments,
}: {
  memberId: string
  tasks: Array<Record<string, unknown>>
  assignments: Array<{ task_id: string; family_member_id: string }>
  onComplete: (taskId: string, memberId: string) => void
  onEditTask?: (taskId: string) => void
  /** Mom-only: tap a segment header → that kid's Day Segments editor */
  onOpenSegments?: () => void
}) {
  // Build M segments (founder ask 2026-06-10): when this member has active
  // day segments (Play/Guided kids especially), group their tasks under
  // tappable segment headers — same organizer they see on their dashboard.
  const { data: allSegments = [] } = useTaskSegments(memberId)
  const activeSegments = useMemo(
    () => allSegments.filter(isSegmentActiveToday),
    [allSegments],
  )

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

  // ── Segment-grouped rendering (only when active segments exist) ──
  if (activeSegments.length > 0) {
    const bySegment = new Map<string, typeof sorted>()
    const unsegmented: typeof sorted = []
    for (const t of sorted) {
      const segId = t.task_segment_id as string | null
      if (segId && activeSegments.some((s) => s.id === segId)) {
        const group = bySegment.get(segId) ?? []
        group.push(t)
        bySegment.set(segId, group)
      } else {
        unsegmented.push(t)
      }
    }

    return (
      <div className="px-2 pb-2 space-y-1.5">
        {activeSegments.map((seg) => {
          const segTasks = bySegment.get(seg.id) ?? []
          if (segTasks.length === 0) return null
          const segDone = segTasks.filter((t) => t.status === 'completed').length
          return (
            <div key={seg.id}>
              <ItemRow onOpen={onOpenSegments}>
                <div
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide py-0.5"
                  style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}
                  title={onOpenSegments ? 'Tap to edit day segments' : undefined}
                >
                  <span className="truncate">{seg.segment_name}</span>
                  <span className="ml-auto shrink-0 font-normal normal-case">
                    {segDone}/{segTasks.length}
                  </span>
                </div>
              </ItemRow>
              <div className="space-y-0.5">
                {segTasks.map((t) => (
                  <TaskRow key={t.id as string} t={t} memberId={memberId} onComplete={onComplete} onEditTask={onEditTask} />
                ))}
              </div>
            </div>
          )
        })}
        {unsegmented.length > 0 && (
          <div>
            {bySegment.size > 0 && (
              <div
                className="text-xs font-semibold uppercase tracking-wide py-0.5"
                style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}
              >
                Other
              </div>
            )}
            <div className="space-y-0.5">
              {unsegmented.map((t) => (
                <TaskRow key={t.id as string} t={t} memberId={memberId} onComplete={onComplete} onEditTask={onEditTask} />
              ))}
            </div>
          </div>
        )}
        <div className="text-xs pt-1" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
          {completedCount}/{sorted.length} done
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {sorted.map((t) => (
        <TaskRow key={t.id as string} t={t} memberId={memberId} onComplete={onComplete} onEditTask={onEditTask} />
      ))}
      <div className="text-xs pt-1" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
        {completedCount}/{sorted.length} done
      </div>
    </div>
  )
}

// One task row: checkbox completes, title taps to edit (when permitted)
function TaskRow({
  t,
  memberId,
  onComplete,
  onEditTask,
}: {
  t: Record<string, unknown>
  memberId: string
  onComplete: (taskId: string, memberId: string) => void
  onEditTask?: (taskId: string) => void
}) {
  const isComplete = t.status === 'completed'
  return (
    <div className="flex items-center gap-1.5 text-xs">
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
        className={`truncate ${isComplete ? 'line-through' : ''}`}
        onClick={onEditTask ? () => onEditTask(t.id as string) : undefined}
        role={onEditTask ? 'button' : undefined}
        title={onEditTask ? 'Tap to edit' : undefined}
        style={{
          color: isComplete ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          cursor: onEditTask ? 'pointer' : undefined,
        }}
      >
        {t.title as string}
      </span>
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
  onOpenTracker,
}: {
  memberId: string
  trackers: Array<Record<string, unknown>>
  onOpenTracker?: (widget: Record<string, unknown>) => void
}) {
  const memberTrackers = trackers.filter((w) => w.family_member_id === memberId)

  if (memberTrackers.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {memberTrackers.map((w) => {
        const config = (w.config as Record<string, unknown>) ?? {}
        const label = (w.title as string) || (config.label as string) || (config.title as string) || 'Tracker'
        return (
          <ItemRow key={w.id as string} onOpen={onOpenTracker ? () => onOpenTracker(w) : undefined}>
            <div className="flex items-center gap-1.5 text-xs">
              <BarChart3 size={10} style={{ color: 'var(--color-text-secondary)' }} />
              <span className="truncate" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </span>
            </div>
          </ItemRow>
        )
      })}
    </div>
  )
}

// ─── Section: Opportunities ──────────────────────────────────────────────────

function OpportunitiesSection({
  memberId,
  opportunities,
  claims,
  onEditTask,
  onUnclaim,
}: {
  memberId: string
  opportunities: Array<Record<string, unknown>>
  /** Active claims (claimed/in-progress) — founder ask 2026-06-10 */
  claims: MemberOpportunityClaim[]
  onEditTask?: (taskId: string) => void
  /** Mom returns a claimed opportunity to its board/list */
  onUnclaim?: (claim: MemberOpportunityClaim) => void
}) {
  const memberOpps = opportunities.filter((o) => o.assignee_id === memberId)
  const memberClaims = claims.filter((c) => c.member_id === memberId)

  if (memberOpps.length === 0 && memberClaims.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-0.5 px-2 pb-2">
      {/* Claimed / in progress — visible BEFORE completion */}
      {memberClaims.map((claim) => (
        <div key={`claim-${claim.task_id}`} className="flex items-center gap-1.5 text-xs">
          <Zap size={10} className="shrink-0" style={{ color: 'var(--color-warning, var(--color-btn-primary-bg))' }} />
          <span
            className="truncate"
            onClick={onEditTask ? () => onEditTask(claim.task_id) : undefined}
            role={onEditTask ? 'button' : undefined}
            style={{ color: 'var(--color-text-primary)', cursor: onEditTask ? 'pointer' : undefined }}
            title={onEditTask ? 'Tap to edit' : undefined}
          >
            {claim.title}
          </span>
          <span className="shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            claimed
          </span>
          {onUnclaim && (
            <button
              onClick={() => onUnclaim(claim)}
              data-testid={`unclaim-${claim.task_id}`}
              className="ml-auto shrink-0 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-border)',
              }}
              title="Return this to the opportunity board"
            >
              Return
            </button>
          )}
        </div>
      ))}

      {/* Completed today */}
      {memberOpps.map((opp) => (
        <ItemRow key={opp.id as string} onOpen={onEditTask ? () => onEditTask(opp.id as string) : undefined}>
          <div className="flex items-center gap-1.5 text-xs">
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
        </ItemRow>
      ))}
    </div>
  )
}

// ─── Section: Routines (FO-COMMAND-CENTER) ───────────────────────────────────
// Data comes from get_member_day_obligations (Convention #271) — never re-derive
// "what counts today" inline.

function RoutinesSection({
  routines,
  onEditTask,
}: {
  routines: MemberRoutineToday[]
  onEditTask?: (taskId: string) => void
}) {
  if (routines.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-1 px-2 pb-2">
      {routines.map((r) => {
        const allDone = r.total_steps > 0 && r.done_steps === r.total_steps
        return (
          <ItemRow key={r.task_id} onOpen={onEditTask ? () => onEditTask(r.task_id) : undefined}>
            <div className="flex items-center gap-1.5 text-xs">
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
          </ItemRow>
        )
      })}
    </div>
  )
}

// ─── Section: Sequential (FO-COMMAND-CENTER) ─────────────────────────────────

function SequentialSection({
  items,
  onOpenCollection,
}: {
  items: MemberSequentialSummary[]
  onOpenCollection?: (collectionId: string) => void
}) {
  if (items.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-1.5 px-2 pb-2">
      {items.map((s) => (
        <ItemRow key={s.collection_id} onOpen={onOpenCollection ? () => onOpenCollection(s.collection_id) : undefined}>
          <div className="text-xs">
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
        </ItemRow>
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
  oppClaims,
  onUnclaim,
  onToggleSection,
  onToggleSectionOverride,
  onSectionReorder,
  onCompleteTask,
  onSpotCheck,
  onEditTask,
  onOpenCollection,
  onOpenTracker,
  onOpenEvent,
  onOpenSegments,
  onCreateInSection,
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
  oppClaims: MemberOpportunityClaim[]
  onUnclaim?: (claim: MemberOpportunityClaim) => void
  onToggleSection: (sectionKey: FamilyOverviewSectionKey, memberId: string) => void
  onToggleSectionOverride: (sectionKey: FamilyOverviewSectionKey, memberId: string) => void
  onSectionReorder: (activeKey: string, overKey: string) => void
  onCompleteTask: (taskId: string, memberId: string) => void
  onSpotCheck: (member: FamilyMember) => void
  /** Tap-to-edit handlers — undefined when the viewer is view-only for this member */
  onEditTask?: (taskId: string) => void
  onOpenCollection?: (collectionId: string) => void
  onOpenTracker?: (widget: Record<string, unknown>) => void
  onOpenEvent?: (event: Record<string, unknown>) => void
  /** Mom-only: open this member's Day Segments editor (Gamification Settings) */
  onOpenSegments?: () => void
  /** Mom-only: per-section [+ create] — opens the category's creation modal for this member */
  onCreateInSection?: (sectionKey: FamilyOverviewSectionKey) => void
}) {
  const color = member.calendar_color || getMemberColor(member)

  // Column reorder (PRD-14C: drag column headers left/right; persists)
  const {
    attributes: colAttributes,
    listeners: colListeners,
    setNodeRef: setColumnRef,
    transform: colTransform,
    transition: colTransition,
    isDragging: colDragging,
  } = useSortable({ id: member.id })

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

  // Section drag-and-drop (global reorder — same order in every column).
  // Each column hosts its OWN DndContext (nested under the column-reorder
  // context); ids are namespaced per column so dnd-kit instances don't clash.
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeKey = String(active.id).split('|')[1]
    const overKey = String(over.id).split('|')[1]
    if (activeKey && overKey) onSectionReorder(activeKey, overKey)
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
    } else if (sectionKey === 'opportunities') {
      count =
        oppClaims.filter((c) => c.member_id === member.id).length +
        opportunities.filter((o) => o.assignee_id === member.id).length
    }

    // Sections with a creation flow (founder asks 2026-06-10). Only
    // weekly_completion has no + (it's allowance config, not an item).
    const CREATABLE_SECTIONS: FamilyOverviewSectionKey[] = [
      'events', 'tasks', 'routines', 'sequential', 'opportunities', 'best_intentions', 'trackers', 'victories',
    ]
    const canCreate = !!onCreateInSection && CREATABLE_SECTIONS.includes(sectionKey)

    return (
      <SortableSection key={key} id={`${member.id}|${key}`}>
        {(dragHandleProps) => (
          <>
            <SectionHeader
              sectionKey={sectionKey}
              collapsed={collapsed}
              count={count}
              hasOverride={hasOverride(sectionKey)}
              onToggle={() => onToggleSection(sectionKey, member.id)}
              onOverrideToggle={() => onToggleSectionOverride(sectionKey, member.id)}
              dragHandleProps={dragHandleProps}
              onCreate={canCreate ? () => onCreateInSection(sectionKey) : undefined}
            />
            {!collapsed && renderSectionContent(sectionKey)}
          </>
        )}
      </SortableSection>
    )
  }

  const renderSectionContent = (key: FamilyOverviewSectionKey) => {
    switch (key) {
      case 'events':
        return <EventsSection memberId={member.id} events={events} onOpenEvent={onOpenEvent} />
      case 'tasks':
        return (
          <TasksSection
            memberId={member.id}
            tasks={tasks}
            assignments={assignments}
            onComplete={onCompleteTask}
            onEditTask={onEditTask}
            onOpenSegments={onOpenSegments}
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
        return <RoutinesSection routines={routines} onEditTask={onEditTask} />
      case 'sequential':
        return <SequentialSection items={sequential} onOpenCollection={onOpenCollection} />
      case 'trackers':
        return <TrackersSection memberId={member.id} trackers={trackers} onOpenTracker={onOpenTracker} />
      case 'weekly_completion':
        return <WeeklyCompletionSection memberId={member.id} />
      case 'opportunities':
        return (
          <OpportunitiesSection
            memberId={member.id}
            opportunities={opportunities}
            claims={oppClaims}
            onEditTask={onEditTask}
            onUnclaim={onUnclaim}
          />
        )
      case 'victories':
        return <VictoriesSection memberId={member.id} victories={victories} />
      default:
        return <StubSection label={key} />
    }
  }

  return (
    <div
      ref={setColumnRef}
      className="shrink-0 snap-start rounded-lg overflow-hidden"
      data-testid={`member-column-${member.id}`}
      data-member-name={member.display_name.split(' ')[0]}
      style={{
        width: 'var(--fo-column-width, 280px)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        transform: CSS.Transform.toString(colTransform),
        transition: colTransition,
        opacity: colDragging ? 0.7 : 1,
        zIndex: colDragging ? 10 : undefined,
      }}
    >
      {/* Sticky column header — grip to reorder, tap to spot-check */}
      <div
        className="sticky top-0 z-10 flex items-center px-1 py-2"
        style={{
          borderBottom: `3px solid ${color}`,
          backgroundColor: 'var(--color-bg-card)',
        }}
      >
        <span
          {...colAttributes}
          {...colListeners}
          data-testid={`column-drag-${member.id}`}
          className="px-1 shrink-0"
          style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))', cursor: 'grab', touchAction: 'none' }}
          aria-label={`Reorder ${member.display_name.split(' ')[0]}'s column`}
        >
          <GripVertical size={14} />
        </span>
        <button
          className="flex-1 flex items-center gap-2 pr-2 text-left min-w-0"
          data-testid={`column-header-${member.id}`}
          onClick={() => onSpotCheck(member)}
          aria-label={`Open ${member.display_name.split(' ')[0]}'s items`}
          style={{ cursor: 'pointer' }}
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
      </div>

      {/* Sections — nested DndContext for global section reorder */}
      <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext
          items={sectionOrder.map((k) => `${member.id}|${k}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
            {sectionOrder.map(renderSection)}
          </div>
        </SortableContext>
      </DndContext>
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

  // ── Tap-to-edit editors (founder feedback 2026-06-10) ──
  const taskEditor = useTaskEditor()
  const [seqDetailId, setSeqDetailId] = useState<string | null>(null)
  const [detailWidget, setDetailWidget] = useState<DashboardWidget | null>(null)
  const [editEvent, setEditEvent] = useState<(CalendarEvent & { event_attendees?: EventAttendee[] }) | null>(null)
  const [segmentsMember, setSegmentsMember] = useState<FamilyMember | null>(null)
  const recordData = useRecordWidgetData()

  // ── Per-section [+ create] (founder ask 2026-06-10) ──
  const queryClient = useQueryClient()
  const [createTarget, setCreateTarget] = useState<{ member: FamilyMember; section: FamilyOverviewSectionKey } | null>(null)
  const [trackerStarterConfig, setTrackerStarterConfig] = useState<WidgetStarterConfig | null>(null)
  const { data: starterConfigs = [] } = useWidgetStarterConfigs()
  const createWidget = useCreateWidget()

  const closeCreate = useCallback(() => {
    setCreateTarget(null)
    setTrackerStarterConfig(null)
  }, [])

  const handleCreateTaskSave = useCallback(
    async (data: CreateTaskData) => {
      if (!family?.id || !member?.id) return
      await createTaskFromData(supabase, data, family.id, member.id, allMembers ?? [])
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-assignments-member'] })
      queryClient.invalidateQueries({ queryKey: ['fo-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['fo-routines'] })
      queryClient.invalidateQueries({ queryKey: ['fo-task-assignments'] })
      closeCreate()
    },
    [family?.id, member?.id, allMembers, queryClient, closeCreate]
  )

  const handleDeployWidget = useCallback(
    (widget: CreateWidget) => {
      createWidget.mutate(widget)
      queryClient.invalidateQueries({ queryKey: ['fo-trackers'] })
      closeCreate()
    },
    [createWidget, queryClient, closeCreate]
  )

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

  // ── Finances tab access (founder add-on 2026-06-10): finance-granted dads
  // get the SAME tab, scoped + level-gated per Convention #274. Per-kid row
  // wins (incl. 'none' carve-out); family-wide row covers role='member' kids.
  const grants = useManagementGrants(
    member ? { id: member.id, family_id: member.family_id, role: member.role } : null,
  )
  const financeAccess: FinanceAccessLevel | 'none' = isPrimaryParent ? 'manage' : grants.financeMaxLevel
  const financeMemberIds = useMemo(() => {
    if (isPrimaryParent) return undefined // mom: unscoped
    const kids = (allMembers ?? []).filter((m) => m.role === 'member' && m.is_active && !m.out_of_nest)
    return kids
      .filter((k) => {
        const level = grants.financeLevels[k.id] !== undefined ? grants.financeLevels[k.id] : grants.financeFamilyLevel
        return level !== 'none'
      })
      .map((k) => k.id)
  }, [isPrimaryParent, allMembers, grants.financeLevels, grants.financeFamilyLevel])

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

  const sectionStates = useMemo(() => config?.section_states ?? {}, [config?.section_states])
  const calendarCollapsed = config?.calendar_collapsed ?? false

  // Selected members in column order. Members selected AFTER a custom
  // column_order was saved append at the end (they're missing from the saved
  // array — without the append they'd silently vanish from the columns).
  const selectedMembers = useMemo(() => {
    const memberMap = new Map((allMembers ?? []).map((m) => [m.id, m]))
    const saved = config?.column_order ?? []
    const order = saved.length
      ? [...saved, ...selectedMemberIds.filter((id) => !saved.includes(id))]
      : selectedMemberIds
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
  const { data: oppClaims = [] } = useActiveOpportunityClaims(family?.id, selectedMemberIds)
  const unclaimOpportunity = useUnclaimOpportunity()

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

  // PRD-14C: long-press on a section header toggles JUST that column's
  // section (per-column override). Row-level toggles clear overrides.
  const handleToggleSectionOverride = useCallback(
    (sectionKey: FamilyOverviewSectionKey, targetMemberId: string) => {
      if (!family?.id || !member?.id) return
      const current = sectionStates[sectionKey] ?? { collapsed: false }
      const effective =
        current.overrides?.[targetMemberId] !== undefined
          ? current.overrides[targetMemberId]
          : current.collapsed
      const newStates = {
        ...sectionStates,
        [sectionKey]: {
          ...current,
          overrides: { ...(current.overrides ?? {}), [targetMemberId]: !effective },
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

  // PRD-14C: section order is GLOBAL across columns; persists.
  const handleSectionReorder = useCallback(
    (activeKey: string, overKey: string) => {
      if (!family?.id || !member?.id) return
      const fromIdx = sectionOrder.indexOf(activeKey)
      const toIdx = sectionOrder.indexOf(overKey)
      if (fromIdx === -1 || toIdx === -1) return
      updateConfig.mutate({
        familyId: family.id,
        memberId: member.id,
        sectionOrder: arrayMove(sectionOrder, fromIdx, toIdx),
      })
    },
    [family?.id, member?.id, sectionOrder, updateConfig]
  )

  // PRD-14C: column order — drag column grips left/right; persists.
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!family?.id || !member?.id || !over || active.id === over.id) return
      const ids = selectedMembers.map((m) => m.id)
      const fromIdx = ids.indexOf(String(active.id))
      const toIdx = ids.indexOf(String(over.id))
      if (fromIdx === -1 || toIdx === -1) return
      updateConfig.mutate({
        familyId: family.id,
        memberId: member.id,
        columnOrder: arrayMove(ids, fromIdx, toIdx),
      })
    },
    [family?.id, member?.id, selectedMembers, updateConfig]
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
    // Queue stays mom-scoped (queue RLS is primary_parent family-wide)
    ...(isPrimaryParent
      ? [
          {
            key: 'queue' as const,
            label: `Queue${queueItems.length > 0 ? ` (${queueItems.length})` : ''}`,
            icon: <Inbox size={15} />,
          },
        ]
      : []),
    // Finances: mom OR finance-granted dad (Convention #274, founder add-on
    // 2026-06-10) — scoped + level-gated inside FinancesTab
    ...(financeAccess !== 'none'
      ? [{ key: 'finances' as const, label: 'Finances', icon: <DollarSign size={15} /> }]
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

      {/* ── Finances tab (relocated from Tasks page, founder Q7) — mom full;
            finance-granted dads scoped + level-gated (founder add-on) ── */}
      {activeTab === 'finances' && financeAccess !== 'none' && (
        <FinancesTab
          familyId={family.id}
          filterMemberIds={financeMemberIds}
          accessLevel={financeAccess}
        />
      )}

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

      {/* Member Pill Selector — compact pill bar (founder feedback 2026-06-10:
          match the small pill style used across the app) */}
      <MemberPillSelector
        members={pillMembers}
        selectedIds={selectedMemberIds}
        onToggle={handleToggleMember}
        variant="compact"
      />

      {/* Onboarding Card */}
      {isFirstTime && !onboardingDismissed && (
        <OnboardingCard onDismiss={handleDismissOnboarding} />
      )}

      {/* Member Columns — horizontal DnD for column reorder (PRD-14C) */}
      <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
        <SortableContext items={selectedMembers.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
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
              selectedMembers.map((m) => {
                // Tap-to-edit handlers only for members the viewer may act on
                // (mom, self, or contribute+ grant — Decision 9)
                const canActOnMember =
                  isPrimaryParent ||
                  m.id === member.id ||
                  accessLevelAtLeast(viewableLevels[m.id], 'contribute')
                return (
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
                    oppClaims={oppClaims}
                    onUnclaim={isPrimaryParent ? (claim) => unclaimOpportunity.mutate(claim) : undefined}
                    onToggleSection={handleToggleSection}
                    onToggleSectionOverride={handleToggleSectionOverride}
                    onSectionReorder={handleSectionReorder}
                    onCompleteTask={handleCompleteTask}
                    onSpotCheck={setSpotCheckMember}
                    onEditTask={canActOnMember ? (taskId) => void taskEditor.openEditTaskById(taskId) : undefined}
                    onOpenCollection={canActOnMember ? setSeqDetailId : undefined}
                    onOpenTracker={canActOnMember ? (w) => setDetailWidget(w as unknown as DashboardWidget) : undefined}
                    onOpenEvent={canActOnMember ? (ev) => setEditEvent(ev as unknown as CalendarEvent & { event_attendees?: EventAttendee[] }) : undefined}
                    onOpenSegments={isPrimaryParent ? () => setSegmentsMember(m) : undefined}
                    onCreateInSection={isPrimaryParent ? (section) => setCreateTarget({ member: m, section }) : undefined}
                  />
                )
              })
            )}
          </div>
        </SortableContext>
      </DndContext>

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

      {/* ── Tap-to-edit modals (founder feedback 2026-06-10): the right editor
            opens right above the overview — no page hopping ── */}
      <TaskEditModal editor={taskEditor} />

      {seqDetailId && (
        <SequentialDetailModal
          collectionId={seqDetailId}
          familyId={family.id}
          onClose={() => setSeqDetailId(null)}
        />
      )}

      {detailWidget && (
        <WidgetDetailView
          widget={detailWidget}
          isOpen={!!detailWidget}
          onClose={() => setDetailWidget(null)}
          onRecordData={(v, m) =>
            recordData.mutate({
              family_id: family.id,
              widget_id: detailWidget.id,
              family_member_id: detailWidget.family_member_id ?? member.id,
              value: v,
              metadata: m,
            })
          }
        />
      )}

      {editEvent && (
        <EventCreationModal
          isOpen={!!editEvent}
          onClose={() => setEditEvent(null)}
          initialEvent={editEvent}
        />
      )}

      {/* Day Segments editor (Gamification Settings) — segment header tap */}
      {segmentsMember && (
        <GamificationSettingsModal
          isOpen={!!segmentsMember}
          onClose={() => setSegmentsMember(null)}
          memberId={segmentsMember.id}
          memberName={segmentsMember.display_name.split(' ')[0]}
          familyId={family.id}
        />
      )}

      {/* ── Per-section [+ create] modals (founder ask 2026-06-10) ── */}
      {createTarget && ['tasks', 'routines', 'opportunities'].includes(createTarget.section) && (
        <TaskCreationModal
          isOpen
          onClose={closeCreate}
          onSave={handleCreateTaskSave}
          initialAssigneeId={createTarget.member.id}
          initialTaskType={
            createTarget.section === 'routines'
              ? 'routine'
              : createTarget.section === 'opportunities'
                ? 'opportunity_repeatable'
                : undefined
          }
        />
      )}

      {createTarget?.section === 'sequential' && (
        <SequentialCreatorModal
          isOpen
          onClose={closeCreate}
          familyId={family.id}
          createdBy={member.id}
        />
      )}

      {createTarget?.section === 'events' && (
        <EventCreationModal
          isOpen
          onClose={closeCreate}
          initialAttendeeIds={[createTarget.member.id]}
        />
      )}

      {createTarget?.section === 'best_intentions' && (
        <CreateBestIntentionModal
          familyId={family.id}
          memberId={createTarget.member.id}
          memberName={createTarget.member.display_name.split(' ')[0]}
          onClose={closeCreate}
        />
      )}

      {createTarget?.section === 'victories' && (
        <RecordVictoryModal
          familyId={family.id}
          memberId={createTarget.member.id}
          memberName={createTarget.member.display_name.split(' ')[0]}
          memberDashboardMode={(createTarget.member as unknown as Record<string, unknown>).dashboard_mode as string | null}
          onClose={closeCreate}
        />
      )}

      {createTarget?.section === 'trackers' && !trackerStarterConfig && (
        <WidgetPicker
          isOpen
          onClose={closeCreate}
          starterConfigs={starterConfigs}
          onSelectStarterConfig={(config) => setTrackerStarterConfig(config)}
        />
      )}

      {createTarget?.section === 'trackers' && trackerStarterConfig && (
        <WidgetConfiguration
          isOpen
          onClose={closeCreate}
          starterConfig={trackerStarterConfig}
          familyId={family.id}
          memberId={createTarget.member.id}
          familyMembers={(allMembers ?? []).map((fm) => ({
            id: fm.id,
            display_name: fm.display_name,
            assigned_color: (fm as unknown as Record<string, unknown>).assigned_color as string | null ?? null,
            member_color: (fm as unknown as Record<string, unknown>).member_color as string | null ?? null,
          }))}
          onDeploy={handleDeployWidget}
        />
      )}
    </div>
  )
}
