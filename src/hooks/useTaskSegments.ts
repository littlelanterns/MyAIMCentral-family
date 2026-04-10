/**
 * useTaskSegments — Build M Phase 1 + Phase 2
 *
 * Phase 1: reads `task_segments` for a single member, ordered by sort_order.
 * Phase 2: CRUD mutations (create, update, delete, reorder) + task assignment.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TaskSegment } from '@/types/play-dashboard'

// ── Query ────────────────────────────────────────────────────────────

export function useTaskSegments(familyMemberId: string | undefined) {
  return useQuery<TaskSegment[]>({
    queryKey: ['task-segments', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return []

      const { data, error } = await supabase
        .from('task_segments')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('useTaskSegments query failed:', error)
        return []
      }

      return (data ?? []) as TaskSegment[]
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}

// ── Create ───────────────────────────────────────────────────────────

interface CreateSegmentInput {
  family_id: string
  family_member_id: string
  segment_name: string
  icon_key?: string | null
  day_filter?: number[] | null
  sort_order?: number
}

export function useCreateSegment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSegmentInput) => {
      const { data, error } = await supabase
        .from('task_segments')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          segment_name: input.segment_name,
          icon_key: input.icon_key ?? null,
          day_filter: input.day_filter ?? null,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskSegment
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['task-segments', vars.family_member_id] })
    },
  })
}

// ── Update ───────────────────────────────────────────────────────────

interface UpdateSegmentInput {
  id: string
  family_member_id: string
  segment_name?: string
  icon_key?: string | null
  sort_order?: number
  day_filter?: number[] | null
  creature_earning_enabled?: boolean
  segment_complete_celebration?: boolean
  randomizer_reveal_style?: 'show_upfront' | 'mystery_tap'
}

export function useUpdateSegment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateSegmentInput) => {
      const { id, family_member_id: _, ...updates } = input
      const { data, error } = await supabase
        .from('task_segments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TaskSegment
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['task-segments', vars.family_member_id] })
    },
  })
}

// ── Delete (soft: is_active = false + clear task assignments) ────────

interface DeleteSegmentInput {
  id: string
  family_member_id: string
}

export function useDeleteSegment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteSegmentInput) => {
      // Clear task_segment_id on any tasks assigned to this segment
      const { error: clearError } = await supabase
        .from('tasks')
        .update({ task_segment_id: null })
        .eq('task_segment_id', input.id)

      if (clearError) throw clearError

      // Soft-delete the segment
      const { error } = await supabase
        .from('task_segments')
        .update({ is_active: false })
        .eq('id', input.id)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['task-segments', vars.family_member_id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ── Reorder (batch sort_order update) ────────────────────────────────

interface ReorderSegmentsInput {
  family_member_id: string
  /** Ordered list of segment IDs — index becomes the new sort_order */
  orderedIds: string[]
}

export function useReorderSegments() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReorderSegmentsInput) => {
      // Optimistic: we update sort_order = index for each ID
      const updates = input.orderedIds.map((id, index) =>
        supabase
          .from('task_segments')
          .update({ sort_order: index })
          .eq('id', id),
      )
      const results = await Promise.all(updates)
      const firstError = results.find(r => r.error)
      if (firstError?.error) throw firstError.error
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['task-segments', input.family_member_id] })
      const prev = qc.getQueryData<TaskSegment[]>(['task-segments', input.family_member_id])

      if (prev) {
        const reordered = input.orderedIds
          .map((id, idx) => {
            const seg = prev.find(s => s.id === id)
            return seg ? { ...seg, sort_order: idx } : null
          })
          .filter(Boolean) as TaskSegment[]

        qc.setQueryData(['task-segments', input.family_member_id], reordered)
      }

      return { prev }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['task-segments', vars.family_member_id], ctx.prev)
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['task-segments', vars.family_member_id] })
    },
  })
}

// ── Assign task to segment ───────────────────────────────────────────

interface AssignTaskToSegmentInput {
  taskId: string
  segmentId: string | null
  familyId: string
}

export function useAssignTaskToSegment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: AssignTaskToSegmentInput) => {
      const { error } = await supabase
        .from('tasks')
        .update({ task_segment_id: input.segmentId })
        .eq('id', input.taskId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-segments', vars.familyId] })
    },
  })
}
