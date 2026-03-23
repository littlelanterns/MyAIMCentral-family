import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type TaskType = 'task' | 'routine' | 'opportunity' | 'habit'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused'
export type TaskPriority = 'now' | 'next' | 'optional' | 'someday'

export interface Task {
  id: string
  family_id: string
  created_by: string
  assignee_id: string | null
  template_id: string | null
  title: string
  description: string | null
  task_type: TaskType
  status: TaskStatus
  priority: TaskPriority | null
  due_date: string | null
  due_time: string | null
  life_area_tag: string | null
  points_override: number | null
  related_plan_id: string | null
  source: string
  recurrence_details: unknown
  created_at: string
  updated_at: string
}

export interface TaskCompletion {
  id: string
  task_id: string
  member_id: string
  completed_at: string
  evidence: unknown
  approved_by: string | null
  approval_status: 'pending' | 'approved' | 'rejected' | null
}

export function useTasks(familyId: string | undefined, filters?: {
  status?: TaskStatus
  assigneeId?: string
  taskType?: TaskType
}) {
  return useQuery({
    queryKey: ['tasks', familyId, filters],
    queryFn: async () => {
      if (!familyId) return []

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.assigneeId) query = query.eq('assignee_id', filters.assigneeId)
      if (filters?.taskType) query = query.eq('task_type', filters.taskType)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Task[]
    },
    enabled: !!familyId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: {
      family_id: string
      created_by: string
      title: string
      task_type: TaskType
      status?: TaskStatus
      priority?: TaskPriority
      assignee_id?: string
      description?: string
      due_date?: string
      source?: string
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ status: 'pending', source: 'manual', ...task })
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

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
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
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, memberId, evidence }: {
      taskId: string
      memberId: string
      evidence?: unknown
    }) => {
      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          member_id: memberId,
          evidence: evidence ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskCompletion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
