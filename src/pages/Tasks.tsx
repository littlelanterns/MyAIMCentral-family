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

import { useState, useCallback, useMemo } from 'react'
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Star,
  BookOpen,
  Inbox,
  Filter,
  ArrowUpDown,
  X,
  ChevronDown,
  Layers,
  Users,
  Check,
  Clock,
  ListPlus,
} from 'lucide-react'
import { Tabs, Button, Badge, EmptyState, SparkleOverlay, FeatureGuide, FeatureIcon, LoadingSpinner, Tooltip } from '@/components/shared'
import { useTasks, useTasksWithPendingApprovals, useApproveTaskCompletion, useRejectTaskCompletion, fetchSharedTaskIds } from '@/hooks/useTasks'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskCompletion } from '@/components/tasks/useTaskCompletion'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import { SequentialCollectionView } from '@/components/tasks/sequential/SequentialCollectionView'
import { SequentialCreatorModal } from '@/components/tasks/sequential/SequentialCreatorModal'
import { CompletionNotePrompt } from '@/components/victories/CompletionNotePrompt'
import { BulkAddWithAI, type ParsedBulkItem } from '@/components/shared/BulkAddWithAI'
import { ModalV2 } from '@/components/shared/ModalV2'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { Task } from '@/hooks/useTasks'
import type { TabItem } from '@/components/shared'
import { QueueBadge } from '@/components/queue/QueueBadge'
import { createTaskFromData } from '@/utils/createTaskFromData'

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
type TaskTab = 'my_tasks' | 'routines' | 'opportunities' | 'sequential' | 'queue'
type SortOrder = 'name' | 'last_deployed' | 'most_assigned' | 'recently_created'
type FilterStatus = 'all' | 'active' | 'completed' | 'unassigned' | 'archived'

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────
export function TasksPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const { data: allTasks = [], isLoading } = useTasks(family?.id)
  const { data: pendingApprovalTasks = [] } = useTasksWithPendingApprovals(family?.id)

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
  const [filterMemberId, _setFilterMemberId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sequentialModalOpen, setSequentialModalOpen] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [guidedNewTask, setGuidedNewTask] = useState('')
  const [guidedCreating, setGuidedCreating] = useState(false)
  const [completedTask, setCompletedTask] = useState<Task | null>(null)

  const { toggle, isCompleting } = useTaskCompletion({
    memberId: member?.id ?? '',
    familyId: family?.id ?? '',
    onSparkle: (origin) => {
      setSparkleOrigin(origin ?? null)
      setTimeout(() => setSparkleOrigin(null), 1000)
    },
    onComplete: (task) => setCompletedTask(task),
  })

  const queryClient = useQueryClient()

  // Guided member detection — simplified UI
  const isGuidedMember = activeMember?.dashboard_mode === 'guided'

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

  // ── Edit existing task ──
  const handleEditTask = useCallback(
    async (data: CreateTaskData) => {
      if (!editingTask) return

      const { error } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description || null,
          life_area_tag: data.lifeAreaTag || null,
          duration_estimate: data.durationEstimate || null,
          incomplete_action: data.incompleteAction,
          require_approval: data.reward?.requireApproval ?? false,
          victory_flagged: data.reward?.flagAsVictory ?? false,
        })
        .eq('id', editingTask.id)

      if (error) {
        console.error('Failed to update task:', error)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditingTask(null)
    },
    [editingTask, queryClient]
  )

  // ── Tab definitions ──
  // Guided members get only My Tasks + Opportunities (PRD-25 Phase C)
  const tabs: TabItem[] = isGuidedMember
    ? [
        { key: 'my_tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
        { key: 'opportunities', label: 'Opportunities', icon: <Star size={15} /> },
      ]
    : [
        { key: 'my_tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
        { key: 'routines', label: 'Routines', icon: <RefreshCw size={15} /> },
        { key: 'opportunities', label: 'Opportunities', icon: <Star size={15} /> },
        { key: 'sequential', label: 'Sequential', icon: <BookOpen size={15} /> },
        {
          key: 'queue',
          label: `Queue${queueItems.length > 0 ? ` (${queueItems.length})` : ''}`,
          icon: <Inbox size={15} />,
        },
      ]

  // ── Filter tasks for each tab (memoized) ──
  const displayTasks = useMemo(() => {
    let filtered = allTasks

    const myId = activeMember?.id
    if (myId && activeTab !== 'queue') {
      filtered = filtered.filter(
        (t) =>
          t.assignee_id === myId ||
          (!t.assignee_id && t.created_by === myId) ||
          myAssignedTaskIds.has(t.id)
      )
    }

    switch (activeTab) {
      case 'my_tasks':
        filtered = filtered.filter((t) => t.task_type === 'task' || t.task_type === 'habit')
        break
      case 'routines':
        filtered = filtered.filter((t) => t.task_type === 'routine')
        break
      case 'opportunities':
        filtered = filtered.filter(
          (t) =>
            t.task_type === 'opportunity_repeatable' ||
            t.task_type === 'opportunity_claimable' ||
            t.task_type === 'opportunity_capped'
        )
        break
      case 'sequential':
        filtered = filtered.filter((t) => t.task_type === 'sequential')
        break
      default:
        break
    }

    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && !t.archived_at)
        break
      case 'completed':
        filtered = filtered.filter((t) => t.status === 'completed')
        filtered = [...filtered].sort((a, b) => {
          const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
          const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
          return bDate - aDate
        })
        break
      case 'unassigned':
        filtered = filtered.filter((t) => !t.assignee_id)
        break
      case 'archived':
        filtered = filtered.filter((t) => t.archived_at)
        break
    }

    if (filterMemberId) {
      filtered = filtered.filter((t) => t.assignee_id === filterMemberId)
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
  }, [allTasks, activeMember?.id, activeTab, filterStatus, filterMemberId, sortOrder, myAssignedTaskIds])

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
            title="Task Management"
            description="Create, configure, and deploy tasks across your family. This is your system headquarters — the daily active view lives on each member's dashboard."
            bullets={[
              'Create tasks, routines, and opportunities once — deploy to multiple members',
              'Routines auto-reset each period (no guilt for yesterday)',
              'Opportunities let kids earn rewards by claiming available jobs',
              'Queue collects drafts from Notepad, LiLa, and meeting action items',
            ]}
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TaskTab)}
      />

      {/* ── Pending Approvals ── */}
      {pendingApprovalTasks.length > 0 && (
        <PendingApprovalsSection
          tasks={pendingApprovalTasks}
          familyMembers={familyMembers ?? []}
          approverId={member?.id ?? ''}
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

      {/* ── Filter bar (below tabs) — hidden for Guided members ── */}
      {activeTab !== 'queue' && !isGuidedMember && (
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
          {(['active', 'completed', 'all', 'unassigned'] as FilterStatus[]).map((s) => (
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
              const orders: SortOrder[] = ['recently_created', 'name', 'most_assigned', 'last_deployed']
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
        ) : activeTab === 'queue' ? (
          <QueueTab queueItems={queueItems} />
        ) : activeTab === 'opportunities' ? (
          <OpportunitiesTab tasks={displayTasks} onToggle={toggle} isCompleting={isCompleting} onCreate={() => setShowCreateModal(true)} />
        ) : activeTab === 'sequential' ? (
          family?.id ? (
            <SequentialCollectionView
              familyId={family.id}
              onCreateCollection={() => setSequentialModalOpen(true)}
            />
          ) : null
        ) : displayTasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={36} />}
            title={
              isGuidedMember
                ? 'No tasks for today!'
                : activeTab === 'routines'
                  ? 'No routines yet'
                  : 'No tasks yet'
            }
            description={
              isGuidedMember
                ? 'Nothing to do right now! Use the box above to add something.'
                : activeTab === 'routines'
                  ? 'Create a routine template to build daily, weekly, or custom checklists.'
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
        ) : (
          <TaskList
            tasks={displayTasks}
            onToggle={toggle}
            isCompleting={isCompleting}
            showType={activeTab === 'my_tasks'}
            onEditTask={setEditingTask}
          />
        )}
      </div>

      {/* TaskCreationModal — Create */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateTask}
      />

      {/* SequentialCreatorModal — Phase 1 replacement for sequential creation */}
      {sequentialModalOpen && family?.id && activeMember?.id && (
        <SequentialCreatorModal
          isOpen={sequentialModalOpen}
          onClose={() => setSequentialModalOpen(false)}
          familyId={family.id}
          createdBy={activeMember.id}
        />
      )}

      {/* TaskCreationModal — Edit */}
      {editingTask && (
        <TaskCreationModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
          defaultTitle={editingTask.title}
          defaultDescription={editingTask.description ?? ''}
        />
      )}

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
}

function TaskList({ tasks, onToggle, isCompleting, showType: _showType, onEditTask }: TaskListProps) {
  const { data: fmember } = useFamilyMember()
  const { data: ffamily } = useFamily()
  const qc = useQueryClient()
  const [deployingTaskId, setDeployingTaskId] = useState<string | null>(null)
  const { data: familyMembers = [] } = useQuery({
    queryKey: ['family-members-for-deploy', ffamily?.id],
    queryFn: async () => {
      if (!ffamily?.id) return []
      const { data } = await supabase
        .from('family_members')
        .select('id, display_name, role')
        .eq('family_id', ffamily.id)
        .eq('is_active', true)
        .order('display_name')
      return data ?? []
    },
    enabled: !!ffamily?.id,
  })

  async function handleDeploy(taskId: string, memberId: string, _memberName: string) {
    // Update the task assignee
    await supabase.from('tasks').update({ assignee_id: memberId }).eq('id', taskId)

    // Create assignment record
    await supabase.from('task_assignments').insert({
      task_id: taskId,
      member_id: memberId,
      assigned_by: fmember?.id,
    })

    qc.invalidateQueries({ queryKey: ['tasks'] })
    setDeployingTaskId(null)
  }

  async function handleDeployAll(taskId: string) {
    // Deploy to every non-mom member: create a copy task for each
    const kids = familyMembers.filter(m => m.id !== fmember?.id)
    for (const kid of kids) {
      await handleDeploy(taskId, kid.id, kid.display_name)
    }
  }

  // Close dropdown when clicking outside
  function handleBackdropClick() {
    if (deployingTaskId) setDeployingTaskId(null)
  }

  return (
    <div className="space-y-2 py-2">
      {/* Invisible backdrop to close dropdown */}
      {deployingTaskId && (
        <div className="fixed inset-0 z-40" onClick={handleBackdropClick} />
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          className="group"
          style={{
            position: 'relative',
            zIndex: deployingTaskId === task.id ? 50 : 'auto',
          }}
        >
          <TaskCard
            task={task}
            isCompleting={isCompleting(task.id)}
            onToggle={onToggle}
            onEdit={onEditTask ? (t) => onEditTask(t) : undefined}
            onDelete={() => {}}
          />

          {/* Deploy button — always visible, not just on hover for clarity */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ zIndex: deployingTaskId === task.id ? 51 : 1 }}
          >
            <div className="relative">
              <button
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setDeployingTaskId(deployingTaskId === task.id ? null : task.id)
                }}
              >
                {task.assignee_id ? 'Reassign' : 'Deploy'}
                <ChevronDown size={10} />
              </button>

              {/* Member picker dropdown — positioned above sibling cards */}
              {deployingTaskId === task.id && (
                <div
                  className="absolute right-0 top-full mt-1 min-w-50 rounded-lg shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    zIndex: 52,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  }}
                >
                  <p
                    className="px-3 py-2 text-xs font-medium"
                    style={{
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    Assign to...
                  </p>

                  {/* Whole Family option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeployAll(task.id)
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors"
                    style={{
                      color: 'var(--color-btn-primary-bg)',
                      borderBottom: '1px solid var(--color-border)',
                      background: 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))',
                    }}
                  >
                    <Users size={16} />
                    Whole Family
                  </button>

                  {/* Individual members */}
                  {familyMembers
                    .filter(m => m.id !== fmember?.id)
                    .map(m => (
                    <button
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeploy(task.id, m.id, m.display_name)
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                      style={{
                        color: 'var(--color-text-primary)',
                        borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))',
                          color: 'var(--color-btn-primary-bg)',
                        }}
                      >
                        {m.display_name.charAt(0)}
                      </span>
                      {m.display_name}
                      {task.assignee_id === m.id && (
                        <span className="ml-auto text-[10px] opacity-60">current</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// QueueTab sub-component
// ─────────────────────────────────────────────
interface StudioQueueItem {
  id: string
  content: string
  source: string
  requester_id?: string | null
  batch_id?: string | null
  created_at: string
  destination?: string | null
}

interface QueueTabProps {
  queueItems: StudioQueueItem[]
}

function QueueTab({ queueItems }: QueueTabProps) {
  const queryClient = useQueryClient()
  const { data: _member } = useFamilyMember()
  const { data: _family } = useFamily()

  const dismissItem = async (itemId: string) => {
    await supabase
      .from('studio_queue')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', itemId)
    queryClient.invalidateQueries({ queryKey: ['studio_queue'] })
  }

  if (queueItems.length === 0) {
    return (
      <EmptyState
        icon={<Inbox size={36} />}
        title="Queue is clear"
        description="Draft tasks from your Notepad, LiLa conversations, and meeting action items will appear here."
      />
    )
  }

  // Group by batch_id
  const batches = new Map<string, StudioQueueItem[]>()
  const singles: StudioQueueItem[] = []

  queueItems.forEach((item) => {
    if (item.batch_id) {
      if (!batches.has(item.batch_id)) batches.set(item.batch_id, [])
      batches.get(item.batch_id)!.push(item)
    } else {
      singles.push(item)
    }
  })

  return (
    <div className="space-y-3 py-2">
      {/* Singles */}
      {singles.map((item) => (
        <QueueItemCard key={item.id} item={item} onDismiss={dismissItem} />
      ))}

      {/* Batches */}
      {Array.from(batches.entries()).map(([batchId, items]) => (
        <div
          key={batchId}
          className="rounded-xl overflow-hidden"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <QueueItemCard item={item} onDismiss={dismissItem} borderless />
            </div>
          ))}

          {/* Batch footer */}
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {items.length} items from same source
            </span>
            <button
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Apply to All
              <ChevronDown size={10} className="inline ml-1" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

interface QueueItemCardProps {
  item: StudioQueueItem
  onDismiss: (id: string) => void
  borderless?: boolean
}

function QueueItemCard({ item, onDismiss, borderless = false }: QueueItemCardProps) {
  const timeAgo = (() => {
    const diff = Date.now() - new Date(item.created_at).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  })()

  const sourceLabel = (() => {
    switch (item.source) {
      case 'notepad_routed': return 'Notepad'
      case 'lila_conversation': return 'LiLa'
      case 'meeting_action': return 'Meeting'
      case 'review_route': return 'Review & Route'
      case 'member_request': return 'Task Request'
      default: return item.source ?? 'Manual'
    }
  })()

  return (
    <div
      className="flex items-start gap-3 p-3"
      style={borderless ? {} : {
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 0.5rem)',
      }}
    >
      <Inbox size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {item.content}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          From: {sourceLabel} · {timeAgo}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="text-xs px-2.5 py-1 rounded-lg font-medium"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Configure
        </button>
        <button
          onClick={() => onDismiss(item.id)}
          className="p-1 rounded opacity-50 hover:opacity-100"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// OpportunitiesTab sub-component
// ─────────────────────────────────────────────
interface OpportunitiesTabProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
  onCreate: () => void
}

function OpportunitiesTab({ tasks, onToggle, isCompleting, onCreate }: OpportunitiesTabProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Star size={36} />}
        title="No opportunities yet"
        description="Create repeatable tasks, claimable jobs, or individual opportunity lists for your family members to earn rewards."
        action={
          <Button variant="primary" size="sm" onClick={onCreate}>
            <Plus size={14} />
            Create Opportunity
          </Button>
        }
      />
    )
  }

  // Group by sub-type
  const repeatable = tasks.filter((t) => t.task_type === 'opportunity_repeatable')
  const claimable = tasks.filter((t) => t.task_type === 'opportunity_claimable')
  const capped = tasks.filter((t) => t.task_type === 'opportunity_capped')

  return (
    <div className="space-y-4 py-2">
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

// ─────────────────────────────────────────────
// PendingApprovalsSection sub-component
// ─────────────────────────────────────────────
interface PendingApprovalsSectionProps {
  tasks: Task[]
  familyMembers: { id: string; display_name: string }[]
  approverId: string
}

function PendingApprovalsSection({ tasks, familyMembers, approverId }: PendingApprovalsSectionProps) {
  const approveCompletion = useApproveTaskCompletion()
  const rejectCompletion = useRejectTaskCompletion()
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  // Fetch pending completions for these tasks
  const taskIds = tasks.map(t => t.id)
  const { data: pendingCompletions = [] } = useQuery({
    queryKey: ['pending-completions', taskIds],
    queryFn: async () => {
      if (taskIds.length === 0) return []
      const { data, error } = await supabase
        .from('task_completions')
        .select('id, task_id, member_id, completed_at, approval_status')
        .in('task_id', taskIds)
        .eq('approval_status', 'pending')
      if (error) throw error
      return data ?? []
    },
    enabled: taskIds.length > 0,
  })

  const memberName = (id: string | null | undefined) => {
    if (!id) return 'Unknown'
    return familyMembers.find(m => m.id === id)?.display_name ?? 'Unknown'
  }

  async function handleApprove(task: Task) {
    const completion = pendingCompletions.find(c => c.task_id === task.id)
    if (!completion) return

    await approveCompletion.mutateAsync({
      completionId: completion.id,
      taskId: task.id,
      approvedById: approverId,
    })
  }

  async function handleReject(task: Task) {
    const completion = pendingCompletions.find(c => c.task_id === task.id)
    if (!completion) return

    await rejectCompletion.mutateAsync({
      completionId: completion.id,
      taskId: task.id,
      rejectionNote: rejectionNote || null,
    })
    setRejectingTaskId(null)
    setRejectionNote('')
  }

  return (
    <div
      className="rounded-xl overflow-hidden my-3"
      style={{ border: '2px solid var(--color-warning, var(--color-btn-primary-bg))', backgroundColor: 'var(--color-bg-card)' }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning, var(--color-btn-primary-bg)) 10%, var(--color-bg-card))', borderBottom: '1px solid var(--color-border)' }}
      >
        <Clock size={16} style={{ color: 'var(--color-warning, var(--color-btn-primary-bg))' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Pending Approvals ({tasks.length})
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {tasks.map((task) => {
          const completion = pendingCompletions.find(c => c.task_id === task.id)
          const completedBy = completion ? memberName(completion.member_id) : null
          const completedAt = completion ? new Date(completion.completed_at).toLocaleDateString() : null

          return (
            <div key={task.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
                  {task.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {completedBy && `Completed by ${completedBy}`}
                  {completedAt && ` · ${completedAt}`}
                </p>
              </div>

              {rejectingTaskId === task.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={e => setRejectionNote(e.target.value)}
                    placeholder="Reason (optional)"
                    className="px-2 py-1 rounded text-xs w-36"
                    style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleReject(task)}
                  />
                  <button
                    onClick={() => handleReject(task)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-error, #ef4444)', color: '#fff' }}
                    disabled={rejectCompletion.isPending}
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => { setRejectingTaskId(null); setRejectionNote('') }}
                    className="text-xs px-2 py-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Tooltip content="Approve">
                  <button
                    onClick={() => handleApprove(task)}
                    disabled={approveCompletion.isPending}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-success, #22c55e)', color: '#fff' }}
                  >
                    <Check size={14} />
                  </button>
                  </Tooltip>
                  <Tooltip content="Reject">
                  <button
                    onClick={() => setRejectingTaskId(task.id)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-error, #ef4444)', color: '#fff' }}
                  >
                    <X size={14} />
                  </button>
                  </Tooltip>
                </div>
              )}
            </div>
          )
        })}
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
