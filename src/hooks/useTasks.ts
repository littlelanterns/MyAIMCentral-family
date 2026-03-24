// PRD-09A: Tasks, Routines & Opportunities — core task hook
// Covers CRUD for the `tasks` table with full PRD-09A field support.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  Task,
  CreateTask,
  UpdateTask,
  TaskWithAssignments,
  TaskFilters,
  TasksByView,
  TaskViewSection,
  TaskStatus,
  TaskType,
  TaskViewType,
  EisenhowerQuadrant,
  KanbanStatus,
  MoscowCategory,
  ImpactEffort,
  ImportanceLevel,
  AbcdeCategory,
} from '@/types/tasks'

// ============================================================
// useTasks — list tasks with optional filters
// ============================================================

export function useTasks(familyId: string | undefined, filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', familyId, filters],
    queryFn: async () => {
      if (!familyId) return []

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)   // exclude soft-deleted by default

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      if (filters?.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId)
      }

      if (filters?.taskType) {
        if (Array.isArray(filters.taskType)) {
          query = query.in('task_type', filters.taskType)
        } else {
          query = query.eq('task_type', filters.taskType)
        }
      }

      if (filters?.dueDateStart) {
        query = query.gte('due_date', filters.dueDateStart)
      }

      if (filters?.dueDateEnd) {
        query = query.lte('due_date', filters.dueDateEnd)
      }

      if (filters?.lifeAreaTag) {
        query = query.eq('life_area_tag', filters.lifeAreaTag)
      }

      if (filters?.archived === true) {
        // override to show archived only
        query = supabase
          .from('tasks')
          .select('*')
          .eq('family_id', familyId)
          .not('archived_at', 'is', null)
      }

      const { data, error } = await query.order('sort_order').order('created_at', { ascending: false })
      if (error) throw error
      return data as Task[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useTask — single task with assignments and recent completions
// ============================================================

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(*),
          task_completions(
            id, member_id, family_member_id, completed_at, period_date,
            completion_note, photo_url, approved_by, approved_at,
            approval_status, rejected, rejection_note
          )
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error
      return data as TaskWithAssignments
    },
    enabled: !!taskId,
  })
}

// ============================================================
// useCreateTask — insert a new task
// ============================================================

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: CreateTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          status: 'pending',
          source: 'manual',
          sort_order: 0,
          focus_time_seconds: 0,
          big_rock: false,
          sequential_is_active: false,
          is_shared: false,
          incomplete_action: 'auto_reschedule',
          require_approval: false,
          victory_flagged: false,
          time_tracking_enabled: false,
          kanban_status: 'to_do',
          ...task,
        })
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
    },
  })
}

// ============================================================
// useUpdateTask — update a task
// ============================================================

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTask & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
    },
  })
}

// ============================================================
// useCompleteTask — mark a task complete (or pending_approval)
// ============================================================

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      memberId,
      periodDate,
      completionNote,
      photoUrl,
      requireApproval,
    }: {
      taskId: string
      memberId: string
      periodDate?: string
      completionNote?: string | null
      photoUrl?: string | null
      requireApproval?: boolean
    }) => {
      const resolvedDate = periodDate ?? new Date().toISOString().split('T')[0]

      // 1. Insert completion record
      const { data: completion, error: compError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          member_id: memberId,
          family_member_id: memberId,
          period_date: resolvedDate,
          completion_note: completionNote ?? null,
          photo_url: photoUrl ?? null,
          rejected: false,
          approval_status: requireApproval ? 'pending' : null,
        })
        .select()
        .single()

      if (compError) throw compError

      // 2. Update task status on the task record itself
      const newStatus: TaskStatus = requireApproval ? 'pending_approval' : 'completed'
      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: requireApproval ? null : new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single()

      if (taskError) throw taskError

      return { completion, task: updatedTask as Task }
    },
    onSuccess: ({ task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
      queryClient.invalidateQueries({ queryKey: ['task-completions', task.id] })
    },
  })
}

// ============================================================
// useArchiveTask — soft-delete
// ============================================================

export function useArchiveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
    },
  })
}

// ============================================================
// useTasksByView — returns tasks grouped for the specified view
// ============================================================

export function useTasksByView(
  familyId: string | undefined,
  assigneeId: string | undefined,
  viewType: TaskViewType,
) {
  return useQuery({
    queryKey: ['tasks-by-view', familyId, assigneeId, viewType],
    queryFn: async () => {
      if (!familyId || !assigneeId) return null

      // Fetch all active tasks for this assignee
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .not('status', 'in', '("completed","cancelled")')

      // For 'by_member' view, fetch all family tasks without assignee filter
      if (viewType !== 'by_member') {
        // Include tasks where this member is the legacy assignee_id
        // OR where they have a task_assignment record
        // For simplicity here we filter by assignee_id (main assignee);
        // useTaskAssignments handles multi-assignee display
        query = query.or(`assignee_id.eq.${assigneeId}`)
      }

      const { data: tasks, error } = await query.order('sort_order').order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error

      const allTasks = tasks as Task[]

      return buildTasksByView(allTasks, viewType)
    },
    enabled: !!familyId && !!assigneeId,
  })
}

// ============================================================
// buildTasksByView — pure function: group/sort tasks per framework
// ============================================================

function buildTasksByView(tasks: Task[], viewType: TaskViewType): TasksByView {
  switch (viewType) {
    case 'simple_list': {
      return {
        view: viewType,
        sections: [{ key: 'all', label: 'Tasks', tasks: [...tasks].sort((a, b) => a.sort_order - b.sort_order) }],
      }
    }

    case 'eisenhower': {
      const quadrantOrder: EisenhowerQuadrant[] = ['do_now', 'schedule', 'delegate', 'eliminate']
      const labels: Record<EisenhowerQuadrant, string> = {
        do_now: 'Do Now (Urgent & Important)',
        schedule: 'Schedule (Important, Not Urgent)',
        delegate: 'Delegate (Urgent, Not Important)',
        eliminate: 'Eliminate (Neither)',
      }
      const sections: TaskViewSection[] = quadrantOrder.map((q) => ({
        key: q,
        label: labels[q],
        tasks: tasks.filter((t) => t.eisenhower_quadrant === q),
      }))
      const unplaced = tasks.filter((t) => !t.eisenhower_quadrant)
      if (unplaced.length > 0) {
        sections.push({ key: 'unplaced', label: 'Unplaced', tasks: unplaced })
      }
      return { view: viewType, sections }
    }

    case 'eat_the_frog': {
      const sorted = [...tasks].sort((a, b) => {
        if (a.frog_rank === null && b.frog_rank === null) return 0
        if (a.frog_rank === null) return 1
        if (b.frog_rank === null) return -1
        return a.frog_rank - b.frog_rank
      })
      const frog = sorted.filter((t) => t.frog_rank === 1)
      const rest = sorted.filter((t) => t.frog_rank !== 1)
      return {
        view: viewType,
        sections: [
          { key: 'frog', label: 'The Frog (Do First)', tasks: frog, maxItems: 1 },
          { key: 'rest', label: 'Remaining Tasks', tasks: rest },
        ],
      }
    }

    case 'one_three_five': {
      const bigTasks = tasks.filter((t) => t.importance_level === 'critical_1')
      const medTasks = tasks.filter((t) => t.importance_level === 'important_3')
      const smallTasks = tasks.filter((t) => t.importance_level === 'small_5')
      const unplaced = tasks.filter((t) => !t.importance_level)
      const sections: TaskViewSection[] = [
        { key: 'critical_1', label: '1 Big Task', tasks: bigTasks.slice(0, 1), maxItems: 1 },
        { key: 'important_3', label: '3 Medium Tasks', tasks: medTasks.slice(0, 3), maxItems: 3 },
        { key: 'small_5', label: '5 Small Tasks', tasks: smallTasks.slice(0, 5), maxItems: 5 },
      ]
      const overflow = [
        ...bigTasks.slice(1),
        ...medTasks.slice(3),
        ...smallTasks.slice(5),
        ...unplaced,
      ]
      if (overflow.length > 0) {
        sections.push({ key: 'overflow', label: 'Not Today', tasks: overflow })
      }
      return { view: viewType, sections }
    }

    case 'big_rocks': {
      const rocks = tasks.filter((t) => t.big_rock)
      const gravel = tasks.filter((t) => !t.big_rock)
      return {
        view: viewType,
        sections: [
          { key: 'rocks', label: 'Big Rocks', tasks: rocks },
          { key: 'gravel', label: 'Gravel (Everything Else)', tasks: gravel },
        ],
      }
    }

    case 'ivy_lee': {
      const ranked = [...tasks]
        .filter((t) => t.ivy_lee_rank !== null)
        .sort((a, b) => (a.ivy_lee_rank ?? 99) - (b.ivy_lee_rank ?? 99))
        .slice(0, 6)
      const unranked = tasks.filter((t) => t.ivy_lee_rank === null)
      const sections: TaskViewSection[] = [
        { key: 'top6', label: "Today's Top 6", tasks: ranked, maxItems: 6 },
      ]
      if (unranked.length > 0) {
        sections.push({ key: 'later', label: 'Not Today', tasks: unranked })
      }
      return { view: viewType, sections }
    }

    case 'by_category': {
      const byTag: Record<string, Task[]> = {}
      const noTag: Task[] = []
      for (const task of tasks) {
        if (task.life_area_tag) {
          byTag[task.life_area_tag] = [...(byTag[task.life_area_tag] ?? []), task]
        } else {
          noTag.push(task)
        }
      }
      const sections: TaskViewSection[] = Object.entries(byTag).map(([tag, tagTasks]) => ({
        key: tag,
        label: tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        tasks: tagTasks,
      }))
      if (noTag.length > 0) {
        sections.push({ key: 'uncategorized', label: 'Uncategorized', tasks: noTag })
      }
      return { view: viewType, sections }
    }

    case 'abcde': {
      const catOrder: AbcdeCategory[] = ['a', 'b', 'c', 'd', 'e']
      const labels: Record<AbcdeCategory, string> = {
        a: 'A — Must Do (Serious Consequences)',
        b: 'B — Should Do (Mild Consequences)',
        c: 'C — Nice to Do',
        d: 'D — Delegate',
        e: 'E — Eliminate',
      }
      const sections: TaskViewSection[] = catOrder.map((cat) => ({
        key: cat,
        label: labels[cat],
        tasks: tasks.filter((t) => t.abcde_category === cat),
      }))
      const unplaced = tasks.filter((t) => !t.abcde_category)
      if (unplaced.length > 0) {
        sections.push({ key: 'unplaced', label: 'Unplaced', tasks: unplaced })
      }
      return { view: viewType, sections }
    }

    case 'kanban': {
      const colOrder: KanbanStatus[] = ['to_do', 'in_progress', 'done']
      const labels: Record<KanbanStatus, string> = {
        to_do: 'To Do',
        in_progress: 'In Progress',
        done: 'Done',
      }
      return {
        view: viewType,
        sections: colOrder.map((col) => ({
          key: col,
          label: labels[col],
          tasks: tasks.filter((t) => (t.kanban_status ?? 'to_do') === col),
        })),
      }
    }

    case 'moscow': {
      const catOrder: MoscowCategory[] = ['must', 'should', 'could', 'wont']
      const labels: Record<MoscowCategory, string> = {
        must: 'Must Do',
        should: 'Should Do',
        could: 'Could Do',
        wont: "Won't Do (This Cycle)",
      }
      const sections: TaskViewSection[] = catOrder.map((cat) => ({
        key: cat,
        label: labels[cat],
        tasks: tasks.filter((t) => t.moscow_category === cat),
      }))
      const unplaced = tasks.filter((t) => !t.moscow_category)
      if (unplaced.length > 0) {
        sections.push({ key: 'unplaced', label: 'Unplaced', tasks: unplaced })
      }
      return { view: viewType, sections }
    }

    case 'impact_effort': {
      const quadOrder: ImpactEffort[] = [
        'high_impact_low_effort',
        'high_impact_high_effort',
        'low_impact_low_effort',
        'low_impact_high_effort',
      ]
      const labels: Record<ImpactEffort, string> = {
        high_impact_low_effort: 'Quick Wins (High Impact, Low Effort)',
        high_impact_high_effort: 'Major Projects (High Impact, High Effort)',
        low_impact_low_effort: 'Fill-Ins (Low Impact, Low Effort)',
        low_impact_high_effort: 'Thankless Tasks (High Effort, Low Impact)',
      }
      const sections: TaskViewSection[] = quadOrder.map((q) => ({
        key: q,
        label: labels[q],
        tasks: tasks.filter((t) => t.impact_effort === q),
      }))
      const unplaced = tasks.filter((t) => !t.impact_effort)
      if (unplaced.length > 0) {
        sections.push({ key: 'unplaced', label: 'Unplaced', tasks: unplaced })
      }
      return { view: viewType, sections }
    }

    case 'now_next_optional': {
      const today = new Date().toISOString().split('T')[0]
      const oneWeekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      // "Now" = required tasks due today or overdue
      const nowTasks = tasks.filter((t) => {
        const isOpportunity = t.task_type.startsWith('opportunity')
        return !isOpportunity && t.due_date !== null && t.due_date <= today
      })
      // "Next" = required tasks due this week but not today
      const nextTasks = tasks.filter((t) => {
        const isOpportunity = t.task_type.startsWith('opportunity')
        return !isOpportunity && t.due_date !== null && t.due_date > today && t.due_date <= oneWeekOut
      })
      // "Optional" = all active opportunities
      const optionalTasks = tasks.filter((t) => t.task_type.startsWith('opportunity'))
      // Remaining required tasks beyond this week
      const futureRequired = tasks.filter((t) => {
        const isOpportunity = t.task_type.startsWith('opportunity')
        return !isOpportunity && (t.due_date === null || t.due_date > oneWeekOut)
      })
      return {
        view: viewType,
        sections: [
          { key: 'now', label: 'Now', tasks: nowTasks },
          { key: 'next', label: 'Next (This Week)', tasks: nextTasks },
          { key: 'optional', label: 'Optional (Opportunities)', tasks: optionalTasks },
          ...(futureRequired.length > 0
            ? [{ key: 'future', label: 'Later', tasks: futureRequired }]
            : []),
        ],
      }
    }

    case 'by_member': {
      // Group by assignee_id — mom/family-overview view
      const byMember: Record<string, Task[]> = {}
      for (const task of tasks) {
        const assignee = task.assignee_id ?? 'unassigned'
        byMember[assignee] = [...(byMember[assignee] ?? []), task]
      }
      return {
        view: viewType,
        sections: Object.entries(byMember).map(([memberId, memberTasks]) => ({
          key: memberId,
          label: memberId === 'unassigned' ? 'Unassigned' : memberId, // caller resolves name from member data
          tasks: memberTasks,
        })),
      }
    }

    default: {
      return {
        view: viewType,
        sections: [{ key: 'all', label: 'Tasks', tasks }],
      }
    }
  }
}

// ============================================================
// useApproveTaskCompletion — parent approves a pending_approval task
// ============================================================

export function useApproveTaskCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      completionId,
      taskId,
      approvedById,
    }: {
      completionId: string
      taskId: string
      approvedById: string
    }) => {
      // 1. Update the completion record
      const { error: compError } = await supabase
        .from('task_completions')
        .update({
          approved_by: approvedById,
          approved_at: new Date().toISOString(),
          approval_status: 'approved',
        })
        .eq('id', completionId)

      if (compError) throw compError

      // 2. Update the task status to completed
      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (taskError) throw taskError
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
    },
  })
}

// ============================================================
// useRejectTaskCompletion — parent rejects, returns to pending
// ============================================================

export function useRejectTaskCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      completionId,
      taskId,
      rejectionNote,
    }: {
      completionId: string
      taskId: string
      rejectionNote?: string | null
    }) => {
      const { error: compError } = await supabase
        .from('task_completions')
        .update({
          rejected: true,
          rejection_note: rejectionNote ?? null,
          approval_status: 'rejected',
        })
        .eq('id', completionId)

      if (compError) throw compError

      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'pending', completed_at: null })
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (taskError) throw taskError
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
    },
  })
}

// ============================================================
// useUpdateTaskViewMetadata — update framework placement fields in bulk
// Used by drag-and-drop within view frameworks
// ============================================================

export function useUpdateTaskViewMetadata() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      metadata,
    }: {
      taskId: string
      metadata: Partial<Pick<Task,
        | 'eisenhower_quadrant'
        | 'frog_rank'
        | 'importance_level'
        | 'big_rock'
        | 'ivy_lee_rank'
        | 'abcde_category'
        | 'moscow_category'
        | 'impact_effort'
        | 'kanban_status'
        | 'sort_order'
      >>
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(metadata)
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Optimistic invalidation for smooth drag-and-drop
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
    },
  })
}

// ============================================================
// useTasksWithPendingApprovals — shorthand for approval queue
// ============================================================

export function useTasksWithPendingApprovals(familyId: string | undefined) {
  return useTasks(familyId, { status: 'pending_approval' })
}

// Re-export types for convenience
export type { Task, CreateTask, UpdateTask, TaskFilters, TasksByView } from '@/types/tasks'
