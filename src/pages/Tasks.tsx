/**
 * Tasks Page — PRD-09A Screen 1
 *
 * Full management surface for all task-type items.
 * This is NOT the daily active view (that's on the Dashboard as DashboardTasksSection).
 * This is where mom configures, assigns, and oversees the family task system.
 *
 * 5 tabs:
 * - My Tasks: All task-type items created by this user
 * - Routines: Filtered to routine-type
 * - Opportunities: Filtered to opportunity types
 * - Sequential: Sequential collections with progress
 * - Queue(N): studio_queue items waiting to be configured
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  CheckSquare,
  Plus,
  Star,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Layers,
  ListPlus,
} from 'lucide-react'
import { Tabs, Button, Badge, EmptyState, SparkleOverlay, FeatureGuide, FeatureIcon, LoadingSpinner } from '@/components/shared'
import { useTasks, useArchiveTask, fetchSharedTaskIds } from '@/hooks/useTasks'
import { useSubmitMastery, useLogPractice } from '@/hooks/usePractice'
// FO-COMMAND-CENTER: edit flow shared with the Family Overview spot-check;
// approvals/queue/finances surfaces relocated to the FO command center.
import { useTaskEditor } from '@/hooks/useTaskEditor'
import { TaskEditModal } from '@/components/tasks/TaskEditModal'
import { ViewCarousel, type TaskViewKey } from '@/components/tasks/ViewCarousel'
import { ViewRenderer, PLANNED_VIEWS } from '@/components/tasks/DashboardTasksSection'
import {
  TaskViewInclusionPills,
  useTaskViewInclusion,
  applyTaskTypeInclusion,
} from '@/components/tasks/TaskViewInclusionControl'
import { useShell } from '@/components/shells/ShellProvider'
import { useNavigate } from 'react-router-dom'
import { DurationPromptModal } from '@/components/tasks/DurationPromptModal'
import { useRoutingToast } from '@/components/shared'
import { SoftClaimCrossClaimModal, SoftClaimDoneBlockedModal } from '@/components/tasks/SoftClaimWarningModal'
import { checkSoftClaimAuthorization, checkSoftClaimCrossClaim } from '@/lib/tasks/softClaim'
import { useCreateRequest } from '@/hooks/useRequests'
import { MasterySubmissionModal } from '@/components/tasks/sequential/MasterySubmissionModal'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useArchiveExpiredRoutines } from '@/hooks/useArchiveExpiredRoutines'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useViewableMembers, accessLevelAtLeast } from '@/hooks/useViewableMembers'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskCompletion } from '@/components/tasks/useTaskCompletion'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import { SequentialDetailModal } from '@/components/tasks/sequential/SequentialDetailModal'
import { CompletionNotePrompt } from '@/components/victories/CompletionNotePrompt'
import { BulkAddWithAI, type ParsedBulkItem } from '@/components/shared/BulkAddWithAI'
import { ModalV2 } from '@/components/shared/ModalV2'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { Task } from '@/hooks/useTasks'
import type { TabItem } from '@/components/shared'
import { QueueBadge } from '@/components/queue/QueueBadge'
import { createTaskFromData } from '@/utils/createTaskFromData'
import { filterTasksForToday } from '@/lib/tasks/recurringTaskFilter'
import { useTaskSegments } from '@/hooks/useTaskSegments'
import { useSegmentCompletionStatus } from '@/hooks/useSegmentCompletionStatus'
import { useTaskRandomizerDraws } from '@/hooks/useTaskRandomizerDraws'
import { SegmentHeader } from '@/components/segments/SegmentHeader'
import { isSegmentActiveToday, groupTasksBySegment } from '@/lib/segments/segmentUtils'
import { useSearchParams } from 'react-router-dom'
import { useOpportunityLists, useOpportunityItems } from '@/hooks/useOpportunityLists'
import { OpportunityListBrowse } from '@/components/lists/OpportunityListBrowse'
import type { List as ListData } from '@/types/lists'

// ─────────────────────────────────────────────
// Studio Queue hook (lightweight, inline)
// ─────────────────────────────────────────────
function useStudioQueue(familyId: string | undefined, memberId: string | undefined, role?: string) {
  return useQuery({
    queryKey: ['studio_queue', familyId, memberId, role],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      let query = supabase
        .from('studio_queue')
        .select('*')
        .eq('family_id', familyId)
        .is('processed_at', null)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })

      // Role-based scoping: mom (primary_parent) sees all, others see own items
      if (role === 'member' || role === 'additional_adult' || role === 'special_adult') {
        query = query.eq('owner_id', memberId)
      }
      // primary_parent sees all — no owner filter

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && !!memberId,
  })
}

// ─────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────
// FO-COMMAND-CENTER (2026-06-10): the Tasks page is now purely personal.
// Routines / Opportunities / Sequential / Queue / Finances tabs relocated to
// the Family Overview command center. Guided members keep their two tabs.
type TaskTab = 'my_tasks' | 'opportunities'
type SortOrder = 'name' | 'recently_created'
type FilterStatus = 'all' | 'active' | 'completed' | 'archived'

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────
export function TasksPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { member: activeMember, isViewAs: isViewingAs } = useEffectiveMember()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const { shell } = useShell()
  const navigate = useNavigate()
  useArchiveExpiredRoutines(family?.id)
  const { data: allTasks = [], isLoading } = useTasks(family?.id)

  // Fetch task_assignments for the active member (for shared task visibility)
  const { data: mySharedTaskIds = [] } = useQuery({
    queryKey: ['task-assignments-member', activeMember?.id],
    queryFn: () => fetchSharedTaskIds(activeMember!.id),
    enabled: !!activeMember?.id,
  })
  const myAssignedTaskIds = useMemo(() => new Set(mySharedTaskIds), [mySharedTaskIds])
  const { data: queueItems = [] } = useStudioQueue(family?.id, member?.id, member?.role)
  const [activeTab, setActiveTab] = useState<TaskTab>('my_tasks')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recently_created')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [showFilters, setShowFilters] = useState(false)
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  // FO-COMMAND-CENTER Q6: the 13 prioritization views live on the Tasks page
  const [activeView, setActiveView] = useState<TaskViewKey>('simple_list')
  // FO-COMMAND-CENTER Q2 hybrid: persisted default + session override pills
  const inclusion = useTaskViewInclusion(family?.id, activeMember?.id)
  // Q2: tapping the next sequential item's card opens the full collection
  const [sequentialDetail, setSequentialDetail] = useState<Task | null>(null)
  // FO-COMMAND-CENTER: edit flow shared with the Family Overview spot-check
  const editor = useTaskEditor()
  const [guidedNewTask, setGuidedNewTask] = useState('')
  const [guidedCreating, setGuidedCreating] = useState(false)
  const [completedTask, setCompletedTask] = useState<Task | null>(null)
  // Build J: mastery submission modal state
  const [masterySubmissionTask, setMasterySubmissionTask] = useState<Task | null>(null)
  const submitMastery = useSubmitMastery()
  const archiveTask = useArchiveTask()

  // Daily Progress Marking: "Worked on this today" state
  const [durationPromptTask, setDurationPromptTask] = useState<Task | null>(null)
  const logPractice = useLogPractice()
  const routingToast = useRoutingToast()

  // Soft-claim modal state
  const [crossClaimTask, setCrossClaimTask] = useState<{ task: Task; holderName: string | null } | null>(null)
  const [doneBlockedTask, setDoneBlockedTask] = useState<{ task: Task; holderName: string | null } | null>(null)
  const createRequest = useCreateRequest()
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null)
  // PRD-28: makeup work URL params (?new=1&type=makeup&assignee=X)
  const [searchParams, setSearchParams] = useSearchParams()
  const [makeupConfig, setMakeupConfig] = useState<{ assigneeId: string } | null>(null)

  // FO-COMMAND-CENTER: the page is always scoped to OWN items now (founder
  // vision 2026-06-09 — "the task page should just be my page"). Family
  // spot-checking lives on the Family Overview command center.
  useEffect(() => {
    if (searchParams.get('new') === '1' && searchParams.get('type') === 'makeup') {
      const assigneeId = searchParams.get('assignee')
      if (assigneeId) {
        setMakeupConfig({ assigneeId })
        setShowCreateModal(true)
        // Clean URL params
        setSearchParams({}, { replace: true })
      }
    } else if (searchParams.get('tab') === 'finances') {
      // Legacy deep link — Finances relocated to the Family Overview (founder Q7)
      navigate('/dashboard?view=family_overview&fotab=finances', { replace: true })
    } else if (searchParams.get('member')) {
      // Legacy ViewAs "Manage Tasks" deep link — spot-checking lives on FO now
      navigate('/dashboard?view=family_overview', { replace: true })
    }
  }, [searchParams])

  const { toggle, isCompleting } = useTaskCompletion({
    memberId: member?.id ?? '',
    familyId: family?.id ?? '',
    isPrimaryParent: member?.role === 'primary_parent',
    onSparkle: (origin) => {
      setSparkleOrigin(origin ?? null)
      setTimeout(() => setSparkleOrigin(null), 1000)
    },
    onComplete: (task) => setCompletedTask(task),
  })

  const queryClient = useQueryClient()

  // Role detection for UI filtering
  const isGuidedMember = activeMember?.dashboard_mode === 'guided'
  // PRD-02 read scoping (2026-06-09 leak pass): mom sees all; additional_adult
  // sees self + member_permissions grants; everyone else sees self only.
  // Scoped to the EFFECTIVE member so View-As shows what the member would see.
  const isEffectiveMom = activeMember?.role === 'primary_parent'
  const { viewableLevels } = useViewableMembers(
    'tasks_basic',
    activeMember ? { id: activeMember.id, family_id: activeMember.family_id, role: activeMember.role } : null,
  )

  /**
   * PERMISSIONS-WIRING (founder Decision 9, 2026-06-09): 'view' grants mean
   * SEE ONLY. A granted adult may act on a kid's task only at contribute+.
   * Mom and self always act.
   */
  const canActOnTask = useCallback(
    (task: Task): boolean => {
      if (isEffectiveMom) return true
      if (!task.assignee_id || task.assignee_id === activeMember?.id) return true
      return accessLevelAtLeast(viewableLevels[task.assignee_id], 'contribute')
    },
    [isEffectiveMom, activeMember?.id, viewableLevels],
  )

  // Guided quick-create: simple title-only task, assigned to self
  const handleGuidedCreate = useCallback(async () => {
    const title = guidedNewTask.trim()
    if (!title || !family?.id || !member?.id || !activeMember?.id) return
    setGuidedCreating(true)
    await supabase.from('tasks').insert({
      family_id: family.id,
      created_by: activeMember.id,
      assignee_id: activeMember.id,
      title,
      task_type: 'task',
      status: 'pending',
      source: 'manual',
    })
    setGuidedNewTask('')
    setGuidedCreating(false)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [guidedNewTask, family?.id, member?.id, activeMember?.id, queryClient])

  // Bulk AI quick-add: brain dump → individual task records
  const handleBulkSave = useCallback(async (items: ParsedBulkItem[]) => {
    if (!family?.id || !activeMember?.id) return
    const rows = items.map(item => ({
      family_id: family.id,
      created_by: activeMember.id,
      assignee_id: activeMember.id,
      title: item.text,
      task_type: 'task' as const,
      status: 'pending' as const,
      source: 'manual' as const,
    }))
    const { error } = await supabase.from('tasks').insert(rows)
    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [family?.id, activeMember?.id, queryClient])

  const handleCreateTask = useCallback(
    async (data: CreateTaskData) => {
      if (!family?.id || !member?.id) {
        console.error('Cannot create task: family or member not loaded')
        return
      }
      await createTaskFromData(supabase, data, family.id, member.id, familyMembers ?? [])
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-assignments-member'] })
      queryClient.invalidateQueries({ queryKey: ['studio_queue'] })
      setShowCreateModal(false)
    },
    [family?.id, member?.id, familyMembers, queryClient]
  )

  // ── Daily Progress Marking: "Worked on this today" ──
  const resolveHolderName = useCallback((holderId: string | null) => {
    if (!holderId || !familyMembers) return null
    return familyMembers.find(m => m.id === holderId)?.display_name ?? null
  }, [familyMembers])

  const handleWorkedOnThis = useCallback((task: Task) => {
    if (!member?.id || !family?.id) return

    const crossClaim = checkSoftClaimCrossClaim({
      taskInProgressMemberId: task.in_progress_member_id,
      callerId: member.id,
      holderDisplayName: resolveHolderName(task.in_progress_member_id),
    })

    if (crossClaim.isCrossClaim) {
      setCrossClaimTask({ task, holderName: crossClaim.holderName })
      return
    }

    if (task.track_duration) {
      setDurationPromptTask(task)
    } else {
      logPractice.mutate({
        familyId: family.id,
        familyMemberId: member.id,
        sourceType: 'task',
        sourceId: task.id,
        durationMinutes: null,
      }, {
        onSuccess: () => routingToast.show({ message: `Session logged for "${task.title}"` }),
      })
    }
  }, [member?.id, family?.id, logPractice, resolveHolderName, routingToast])

  const toggleWithSoftClaim = useCallback(
    (task: Task, origin?: { x: number; y: number }, extras?: { completionNote?: string | null; photoUrl?: string | null }) => {
      // PERMISSIONS-WIRING: view-only grants cannot complete/uncomplete.
      if (!canActOnTask(task)) {
        routingToast.show({
          message: "You have view-only access to this family member's tasks.",
          variant: 'error',
        })
        return
      }
      if (task.track_progress && task.status !== 'completed' && member?.id) {
        const result = checkSoftClaimAuthorization({
          taskTrackProgress: true,
          taskInProgressMemberId: task.in_progress_member_id,
          taskCreatedBy: task.created_by,
          callerId: member.id,
          callerIsPrimaryParent: member.role === 'primary_parent',
          holderDisplayName: resolveHolderName(task.in_progress_member_id),
        })
        if (!result.allowed) {
          setDoneBlockedTask({ task, holderName: result.holderName })
          return
        }
      }
      toggle(task, origin, extras)
    },
    [toggle, member?.id, member?.role, resolveHolderName, canActOnTask, routingToast],
  )

  const handleCrossClaimProceed = useCallback(() => {
    if (!crossClaimTask || !member?.id || !family?.id) return
    const task = crossClaimTask.task
    setCrossClaimTask(null)
    if (task.track_duration) {
      setDurationPromptTask(task)
    } else {
      logPractice.mutate({
        familyId: family.id,
        familyMemberId: member.id,
        sourceType: 'task',
        sourceId: task.id,
        durationMinutes: null,
      })
    }
  }, [crossClaimTask, member?.id, family?.id, logPractice])

  const handleDurationSubmit = useCallback((durationMinutes: number | null) => {
    if (!durationPromptTask || !member?.id || !family?.id) return
    const taskTitle = durationPromptTask.title
    logPractice.mutate({
      familyId: family.id,
      familyMemberId: member.id,
      sourceType: 'task',
      sourceId: durationPromptTask.id,
      durationMinutes,
    }, {
      onSuccess: () => {
        const durationText = durationMinutes ? ` (${durationMinutes >= 60 ? `${Math.round(durationMinutes / 60)} hr` : `${durationMinutes} min`})` : ''
        routingToast.show({ message: `Session logged for "${taskTitle}"${durationText}` })
      },
    })
    setDurationPromptTask(null)
  }, [durationPromptTask, member?.id, family?.id, logPractice, routingToast])

  // ── Edit existing task — shared flow (useTaskEditor / TaskEditModal).
  // FO-COMMAND-CENTER: extracted so the Family Overview spot-check mounts the
  // identical edit modal. One save path (atomic RPC), two mount points.
  const openEditTask = editor.openEditTask

  // ── Tab definitions ──
  // Guided members get only My Tasks + Opportunities (PRD-25 Phase C)
  // Guided members keep their two-tab experience (PRD-25 Phase C). Everyone
  // else gets the purely personal page — no tabs (FO-COMMAND-CENTER).
  const tabs: TabItem[] = [
    { key: 'my_tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
    { key: 'opportunities', label: 'Opportunities', icon: <Star size={15} /> },
  ]

  // ── Personal task scope (memoized) ──
  // FO-COMMAND-CENTER: own items ONLY for every role, including mom — assigned
  // to me, created by me (unassigned), shared with me, or soft-claim-held by me
  // (Daily Progress Marking §4.5).
  const displayTasks = useMemo(() => {
    const myId = activeMember?.id
    if (!myId) return []

    let filtered = allTasks.filter(
      (t) =>
        t.assignee_id === myId ||
        (!t.assignee_id && t.created_by === myId) ||
        myAssignedTaskIds.has(t.id) ||
        t.in_progress_member_id === myId
    )

    if (isGuidedMember) {
      // Guided tabs: My Tasks (task/habit) or Opportunities
      filtered =
        activeTab === 'opportunities'
          ? filtered.filter((t) => t.task_type.startsWith('opportunity'))
          : filtered.filter((t) => t.task_type === 'task' || t.task_type === 'habit')
    } else {
      // FO-COMMAND-CENTER Q2 hybrid: persisted default + session override pills
      // decide whether routines/opportunities/sequential join the views.
      // Sequential inclusion = next active item only.
      filtered = applyTaskTypeInclusion(filtered, inclusion.effective)
    }

    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && !t.archived_at)
        // Hide recurring tasks not scheduled for today (RRULE day-of-week filter)
        filtered = filterTasksForToday(filtered)
        break
      case 'completed':
        filtered = filtered.filter((t) => t.status === 'completed')
        filtered = [...filtered].sort((a, b) => {
          const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
          const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
          return bDate - aDate
        })
        break
      case 'archived':
        filtered = filtered.filter((t) => t.archived_at)
        break
    }

    switch (sortOrder) {
      case 'name':
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'recently_created':
        filtered = [...filtered].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
    }

    return filtered
  }, [allTasks, activeMember?.id, activeTab, filterStatus, sortOrder, myAssignedTaskIds, isGuidedMember, inclusion.effective])

  // Q2: sequential next-item cards open the full collection ("see the entire
  // list or complete early"); everything else opens the normal edit modal.
  const handleOpenTask = useCallback(
    (task: Task) => {
      if (task.task_type === 'sequential') {
        setSequentialDetail(task)
        return
      }
      void openEditTask(task)
    },
    [openEditTask]
  )

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Sparkle overlay */}
      {sparkleOrigin && (
        <SparkleOverlay
          type="quick_burst"
          origin={sparkleOrigin}
          onComplete={() => setSparkleOrigin(null)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="tasks" fallback={<CheckSquare size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="w-10! h-10! md:w-36! md:h-36!" assetSize={512} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {isViewingAs ? `${activeMember?.display_name}'s Tasks` : 'Tasks'}
          </h1>
          {/* PRD-17: Queue badge → opens Review Queue modal Sort tab */}
          <QueueBadge
            count={queueItems.length}
            defaultTab="sort"
            compact
          />
        </div>
        {!isGuidedMember ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowBulkAdd(true)}>
              <ListPlus size={16} />
              <span className="hidden sm:inline">Bulk Add</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => {
            const input = document.getElementById('guided-quick-add')
            if (input) input.focus()
          }}>
            <Plus size={16} />
            Add
          </Button>
        )}
      </div>

      {/* ── Feature Guide (hidden for Guided members) ── */}
      {!isGuidedMember && (
        <div className="pb-4">
          <FeatureGuide
            featureKey="tasks_management_page"
            title="My Tasks"
            description="Your personal task space — your items, seen through your favorite prioritization lens. Family-wide management lives on the Family Overview command center."
            bullets={[
              'Switch between prioritization views to see your day through different lenses',
              'Include routines, opportunities, or sequential items right alongside your tasks',
              'Sequential items show just the next thing to do — tap one to see the whole list',
              'Spot-check the kids, approvals, and the queue from Dashboard → Family Overview',
            ]}
          />
        </div>
      )}

      {/* ── Tabs — Guided members only (My Tasks / Opportunities, PRD-25) ── */}
      {isGuidedMember && (
        <Tabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TaskTab)}
        />
      )}

      {/* ── Guided quick-add input ── */}
      {isGuidedMember && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleGuidedCreate() }}
          className="flex items-center gap-2 py-3"
        >
          <input
            id="guided-quick-add"
            type="text"
            value={guidedNewTask}
            onChange={(e) => setGuidedNewTask(e.target.value)}
            placeholder="Add something to do..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleGuidedCreate}
            disabled={!guidedNewTask.trim() || guidedCreating}
          >
            {guidedCreating ? 'Adding...' : 'Save'}
          </Button>
        </form>
      )}

      {/* FO-COMMAND-CENTER: member pill bar removed — the Tasks page is purely
          personal; spot-checking other members lives on Family Overview. */}

      {/* ── Inclusion pills + view carousel (FO-COMMAND-CENTER Q2 + Q6) ── */}
      {!isGuidedMember && (
        <div className="space-y-2 py-2">
          <TaskViewInclusionPills
            inclusion={inclusion.effective}
            isOverridden={inclusion.isOverridden}
            onToggle={inclusion.togglType}
            onSaveDefault={inclusion.saveAsDefault}
          />
          <ViewCarousel shell={shell} activeView={activeView} onViewChange={setActiveView} />
        </div>
      )}

      {/* ── Filter bar — hidden for Guided members ── */}
      {!isGuidedMember && (
        <div className="flex items-center gap-2 py-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: showFilters ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: showFilters ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Filter size={14} />
            Filter
          </button>

          {/* Status pills */}
          {(['active', 'completed', 'all'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-2.5 py-1 rounded-full capitalize whitespace-nowrap"
              style={{
                backgroundColor: filterStatus === s ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: filterStatus === s ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {s}
            </button>
          ))}

          {/* Sort */}
          <button
            onClick={() => {
              const orders: SortOrder[] = ['recently_created', 'name']
              const idx = orders.indexOf(sortOrder)
              setSortOrder(orders[(idx + 1) % orders.length])
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg ml-auto"
            style={{
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
            }}
          >
            <ArrowUpDown size={12} />
            {sortOrder.replace(/_/g, ' ')}
          </button>
        </div>
      )}

      {/* ── Tab Content ── */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="min-h-75"
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : isGuidedMember && activeTab === 'opportunities' ? (
          <OpportunitiesTab tasks={displayTasks} onToggle={toggleWithSoftClaim} isCompleting={isCompleting} onCreate={() => setShowCreateModal(true)} familyId={family?.id} memberId={activeMember?.id} createdBy={member?.id} />
        ) : displayTasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={36} />}
            title={isGuidedMember ? 'No tasks for today!' : 'No tasks yet'}
            description={
              isGuidedMember
                ? 'Nothing to do right now! Use the box above to add something.'
                : 'Create a task to get started, or browse Studio templates for inspiration.'
            }
            action={
              isGuidedMember ? undefined : (
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                    <Plus size={14} />
                    Create
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => {}}>
                    <Layers size={14} />
                    Browse Templates
                  </Button>
                </div>
              )
            }
          />
        ) : isGuidedMember || activeView === 'simple_list' ? (
          // Simple List keeps the segment-aware TaskList (Build M Phase 5
          // segment grouping is a Tasks-page feature the views don't replicate)
          <TaskList
            tasks={displayTasks}
            onToggle={toggleWithSoftClaim}
            isCompleting={isCompleting}
            showType
            onEditTask={handleOpenTask}
            onDelete={setConfirmDeleteTask}
            onSubmitMastery={(task) => setMasterySubmissionTask(task)}
            onWorkedOnThis={handleWorkedOnThis}
            segmentMemberId={activeMember?.id}
          />
        ) : (
          // FO-COMMAND-CENTER Q6: the prioritization views, on the Tasks page
          <ViewRenderer
            viewKey={activeView}
            tasks={displayTasks}
            onToggle={toggleWithSoftClaim}
            isCompleting={isCompleting}
            onEdit={handleOpenTask}
            onWorkedOnThis={handleWorkedOnThis}
            shell={shell}
            isPlanned={PLANNED_VIEWS.has(activeView)}
          />
        )}
      </div>

      {/* TaskCreationModal — Create */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setMakeupConfig(null) }}
        onSave={handleCreateTask}
        makeupConfig={makeupConfig}
      />

      {/* Q2: full-collection view for a tapped sequential next-item */}
      {sequentialDetail?.sequential_collection_id && (
        <SequentialDetailModal
          collectionId={sequentialDetail.sequential_collection_id}
          familyId={family?.id}
          onClose={() => setSequentialDetail(null)}
        />
      )}

      {/* Build J: MasterySubmissionModal — child submits a mastery item for review */}
      {masterySubmissionTask && family?.id && activeMember?.id && (
        <MasterySubmissionModal
          isOpen={true}
          onClose={() => setMasterySubmissionTask(null)}
          itemTitle={masterySubmissionTask.title}
          requireEvidence={
            (masterySubmissionTask as unknown as { require_mastery_evidence?: boolean }).require_mastery_evidence ?? false
          }
          practiceCount={
            (masterySubmissionTask as unknown as { practice_count?: number }).practice_count ?? 0
          }
          pending={submitMastery.isPending}
          onSubmit={async ({ evidenceUrl, evidenceNote }) => {
            await submitMastery.mutateAsync({
              familyId: family.id,
              familyMemberId: activeMember.id,
              sourceType: 'sequential_task',
              sourceId: masterySubmissionTask.id,
              evidenceUrl,
              evidenceNote,
            })
            setMasterySubmissionTask(null)
          }}
        />
      )}

      {/* Daily Progress Marking: Duration prompt */}
      <DurationPromptModal
        isOpen={!!durationPromptTask}
        onClose={() => setDurationPromptTask(null)}
        onSubmit={handleDurationSubmit}
        taskTitle={durationPromptTask?.title}
      />

      {/* Soft-claim warning modals */}
      <SoftClaimCrossClaimModal
        isOpen={!!crossClaimTask}
        onClose={() => setCrossClaimTask(null)}
        onProceed={handleCrossClaimProceed}
        holderName={crossClaimTask?.holderName ?? null}
      />
      <SoftClaimDoneBlockedModal
        isOpen={!!doneBlockedTask}
        onClose={() => setDoneBlockedTask(null)}
        onAskMom={() => {
          if (doneBlockedTask && family?.id && activeMember?.id) {
            const primaryParent = familyMembers?.find(m => m.role === 'primary_parent')
            if (primaryParent) {
              createRequest.mutate({
                familyId: family.id,
                senderId: activeMember.id,
                senderName: activeMember.display_name,
                data: {
                  title: `Can I mark "${doneBlockedTask.task.title}" as done?`,
                  recipient_member_id: primaryParent.id,
                  details: doneBlockedTask.holderName
                    ? `${doneBlockedTask.holderName} has been working on this. I'd like to mark it complete.`
                    : undefined,
                  source: 'task_soft_claim',
                  source_reference_id: doneBlockedTask.task.id,
                },
              })
            }
          }
          setDoneBlockedTask(null)
        }}
        holderName={doneBlockedTask?.holderName ?? null}
      />

      {/* TaskCreationModal — Edit (shared instance, FO-COMMAND-CENTER) */}
      <TaskEditModal editor={editor} />

      {/* Bulk AI Quick Add modal */}
      {showBulkAdd && (
        <ModalV2
          id="bulk-add-tasks"
          isOpen
          onClose={() => setShowBulkAdd(false)}
          type="transient"
          size="md"
          title="Bulk Add Tasks"
          icon={ListPlus}
        >
          <BulkAddWithAI
            title="Brain Dump"
            placeholder={"Type or paste your tasks here — any format works:\n\n- Take out the trash\n- Call the dentist on Monday\n- Buy birthday present for Sarah\n- Clean out the garage\n- Schedule car maintenance\n- Meal prep for the week"}
            hint="Dump everything on your mind. One per line, a paragraph, a messy list — AI will sort it out into individual tasks."
            parsePrompt="You are a task extraction assistant. Parse the user's text into individual actionable tasks. Each task should be a clear, standalone to-do item. If the user wrote paragraphs, extract the implied tasks. Remove any duplicates. Keep task titles concise (under 80 characters) but preserve the meaning."
            onSave={handleBulkSave}
            onClose={() => setShowBulkAdd(false)}
            modelTier="haiku"
          />
        </ModalV2>
      )}

      {/* CompletionNotePrompt — non-blocking toast after task completion */}
      {completedTask && (
        <CompletionNotePrompt
          taskTitle={completedTask.title}
          taskId={completedTask.id}
          onSaveNote={async (taskId, note) => {
            await supabase
              .from('task_completions')
              .update({ completion_note: note })
              .eq('task_id', taskId)
              .eq('member_id', member?.id ?? '')
              .order('completed_at', { ascending: false })
              .limit(1)
          }}
          onDismiss={() => setCompletedTask(null)}
        />
      )}

      {/* Themed delete confirmation — replaces window.confirm() */}
      {confirmDeleteTask && (
        <ModalV2
          id="confirm-delete-task"
          isOpen
          onClose={() => setConfirmDeleteTask(null)}
          type="transient"
          size="sm"
          title="Archive Task"
        >
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)', marginBottom: '1rem' }}>
              Archive <strong>"{confirmDeleteTask.title}"</strong>? It will be hidden from your task list but can be restored later.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteTask(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  archiveTask.mutate(confirmDeleteTask.id)
                  setConfirmDeleteTask(null)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-error, #dc2626)', color: '#fff' }}
              >
                Archive
              </button>
            </div>
          </div>
        </ModalV2>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// TaskList sub-component
// ─────────────────────────────────────────────
interface TaskListProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
  showType?: boolean
  onEditTask?: (task: Task) => void
  onDelete?: (task: Task) => void
  /** Build J: open mastery submission modal for a sequential mastery task */
  onSubmitMastery?: (task: Task) => void
  /** Daily Progress Marking: "Worked on this today" handler */
  onWorkedOnThis?: (task: Task) => void
  /** Build M Phase 5: member ID for segment grouping */
  segmentMemberId?: string
}

function TaskList({ tasks, onToggle, isCompleting, showType: _showType, onEditTask, onDelete, onSubmitMastery, onWorkedOnThis, segmentMemberId }: TaskListProps) {
  const { data: ffamily } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(ffamily?.id)
  const [collapsedSegments, setCollapsedSegments] = useState<Set<string>>(new Set())

  // Build M Phase 5: segment grouping for Adult/Independent
  const { data: allSegments } = useTaskSegments(segmentMemberId)
  const activeSegments = useMemo(
    () => (allSegments ?? []).filter(isSegmentActiveToday),
    [allSegments],
  )
  const hasSegments = activeSegments.length > 0
  const { segmentGroups, unsegmentedTasks: unsegmented } = useMemo(
    () => groupTasksBySegment(activeSegments, tasks),
    [activeSegments, tasks],
  )
  const segmentStatus = useSegmentCompletionStatus(activeSegments, tasks)

  // Phase 6: fetch today's randomizer draws for tasks with linked_list_id
  const { taskDrawMap } = useTaskRandomizerDraws(tasks, segmentMemberId)

  const toggleSegmentCollapse = useCallback((segId: string) => {
    setCollapsedSegments(prev => {
      const next = new Set(prev)
      if (next.has(segId)) next.delete(segId)
      else next.add(segId)
      return next
    })
  }, [])

  // Build member lookup for assignee pills
  const memberLookup = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    for (const m of familyMembers) {
      map[m.id] = {
        name: m.display_name?.split(' ')[0] ?? m.display_name ?? '',
        color: m.assigned_color || m.member_color || '#6B7280',
      }
    }
    return map
  }, [familyMembers])

  const renderTaskRow = (task: Task) => {
    const draw = taskDrawMap[task.id]
    const assignee = task.assignee_id ? memberLookup[task.assignee_id] : null
    return (
    <div key={task.id}>
      <TaskCard
        task={task}
        isCompleting={isCompleting(task.id)}
        onToggle={onToggle}
        onEdit={onEditTask ? (t) => onEditTask(t) : undefined}
        onDelete={onDelete}
        onSubmitMastery={onSubmitMastery}
        onWorkedOnThis={task.track_progress && onWorkedOnThis ? () => onWorkedOnThis(task) : undefined}
        drawSubtitle={draw?.itemName ?? null}
        assigneeName={assignee?.name ?? null}
        assigneeColor={assignee?.color ?? null}
      />
    </div>
  )}

  // ── Segment-grouped rendering (Build M Phase 5) ──────────────
  if (hasSegments) {
    return (
      <div className="space-y-3 py-2">
        {segmentGroups.map(({ segment, tasks: segTasks }) => {
          const status = segmentStatus[segment.id]
          return (
            <SegmentHeader
              key={segment.id}
              name={segment.segment_name}
              iconKey={segment.icon_key}
              completedCount={status?.completed ?? 0}
              totalCount={status?.total ?? segTasks.length}
              isCollapsed={collapsedSegments.has(segment.id)}
              onToggleCollapse={() => toggleSegmentCollapse(segment.id)}
            >
              <div className="space-y-2 mt-1">
                {segTasks.map(renderTaskRow)}
              </div>
            </SegmentHeader>
          )
        })}

        {unsegmented.length > 0 && (
          <div className="space-y-2">
            {segmentGroups.length > 0 && (
              <div
                className="text-xs font-medium uppercase tracking-wider py-2 px-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Other Tasks
              </div>
            )}
            {unsegmented.map(renderTaskRow)}
          </div>
        )}
      </div>
    )
  }

  // ── Flat rendering (no segments) ─────────────────────────────
  return (
    <div className="space-y-2 py-2">
      {tasks.map(renderTaskRow)}
    </div>
  )
}

// ─────────────────────────────────────────────
// OpportunitiesTab sub-component (Guided members)
// ─────────────────────────────────────────────
interface OpportunitiesTabProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
  onCreate: () => void
  familyId: string | undefined
  memberId: string | undefined
  createdBy: string | undefined
}

function OpportunitiesTab({ tasks, onToggle, isCompleting, onCreate, familyId, memberId, createdBy }: OpportunitiesTabProps) {
  const { data: opportunityLists = [] } = useOpportunityLists(familyId, memberId)

  const hasStandaloneTasks = tasks.length > 0
  const hasOpportunityLists = opportunityLists.length > 0

  if (!hasStandaloneTasks && !hasOpportunityLists) {
    return (
      <EmptyState
        icon={<Star size={36} />}
        title="No opportunities yet"
        description="Create repeatable tasks, claimable jobs, or opportunity lists for your family members to earn rewards."
        action={
          <Button variant="primary" size="sm" onClick={onCreate}>
            <Plus size={14} />
            Create Opportunity
          </Button>
        }
      />
    )
  }

  // Group standalone tasks by sub-type
  const repeatable = tasks.filter((t) => t.task_type === 'opportunity_repeatable')
  const claimable = tasks.filter((t) => t.task_type === 'opportunity_claimable')
  const capped = tasks.filter((t) => t.task_type === 'opportunity_capped')

  return (
    <div className="space-y-4 py-2">
      {/* Opportunity lists (primary — the list IS the board) */}
      {opportunityLists.map(list => (
        <OpportunityListCard
          key={list.id}
          list={list}
          memberId={memberId ?? ''}
          familyId={familyId ?? ''}
          createdBy={createdBy ?? ''}
        />
      ))}

      {/* Standalone opportunity tasks (backward compat) */}
      {repeatable.length > 0 && (
        <OpportunityGroup label="Repeatable Tasks" tasks={repeatable} onToggle={onToggle} isCompleting={isCompleting} />
      )}
      {claimable.length > 0 && (
        <OpportunityGroup label="Claimable Job Board" tasks={claimable} onToggle={onToggle} isCompleting={isCompleting} />
      )}
      {capped.length > 0 && (
        <OpportunityGroup label="Capped Opportunities" tasks={capped} onToggle={onToggle} isCompleting={isCompleting} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// OpportunityListCard — expandable card for an opportunity list
// ─────────────────────────────────────────────
function OpportunityListCard({
  list,
  memberId,
  familyId,
  createdBy,
}: {
  list: ListData
  memberId: string
  familyId: string
  createdBy: string
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: items = [] } = useOpportunityItems(expanded ? list.id : undefined)
  const availableCount = items.filter(i => i.is_available).length

  const rewardType = list.default_reward_type
  const rewardAmount = list.default_reward_amount

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center gap-2 text-left"
        style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}
      >
        <Star size={14} style={{ color: 'var(--color-warning)' }} />
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-heading)' }}>
          {list.title}
        </span>
        {rewardType && rewardAmount != null && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, var(--color-bg-card))',
              color: 'var(--color-success)',
            }}
          >
            {rewardType === 'money' ? `$${rewardAmount}` : `${rewardAmount} pts`}/item
          </span>
        )}
        {expanded ? (
          <Badge variant="default" size="sm">{availableCount} available</Badge>
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} className={expanded ? 'rotate-180' : ''} />
        )}
      </button>
      {expanded && (
        <div className="p-3" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <OpportunityListBrowse
            list={list}
            items={items}
            memberId={memberId}
            familyId={familyId}
            createdBy={createdBy}
            compact
          />
        </div>
      )}
    </div>
  )
}

interface OpportunityGroupProps {
  label: string
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
}

function OpportunityGroup({ label, tasks, onToggle, isCompleting }: OpportunityGroupProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}
      >
        <Star size={14} style={{ color: 'var(--color-warning)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {label}
        </span>
        <Badge variant="default" size="sm">{tasks.length}</Badge>
      </div>
      <div className="p-3 space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isCompleting={isCompleting(task.id)}
            onToggle={onToggle}
            compact
          />
        ))}
      </div>
    </div>
  )
}

// Sequential tab now uses <SequentialCollectionView> directly (see render block
// above). The prior inline SequentialTab sub-component and its standalone-task
// fallback path were removed as part of PRD-09A/09B Studio Intelligence Phase 1.
// Standalone sequential tasks without a parent collection are no longer a valid
// state: every sequential item is created through useCreateSequentialCollection,
// which guarantees a parent row plus N child tasks.
