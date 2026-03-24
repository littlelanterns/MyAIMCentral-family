// PRD-09A: Sequential Collections — CRUD, progress tracking, and promotion

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  SequentialCollection,
  CreateSequentialCollection,
  Task,
} from '@/types/tasks'

// ============================================================
// useSequentialCollections — list all sequential collections for a family
// ============================================================

export function useSequentialCollections(familyId: string | undefined) {
  return useQuery({
    queryKey: ['sequential-collections', familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('sequential_collections')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SequentialCollection[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useSequentialCollection — single collection with its tasks
// Tasks are fetched separately from the collections table because
// sequential items are stored as individual task records with
// sequential_collection_id and sequential_position set.
// ============================================================

export function useSequentialCollection(collectionId: string | undefined) {
  return useQuery({
    queryKey: ['sequential-collection', collectionId],
    queryFn: async () => {
      if (!collectionId) return null

      // Fetch the collection record
      const { data: collection, error: collError } = await supabase
        .from('sequential_collections')
        .select('*')
        .eq('id', collectionId)
        .single()

      if (collError) throw collError

      // Fetch all tasks belonging to this collection, ordered by position
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('sequential_collection_id', collectionId)
        .order('sequential_position', { ascending: true })

      if (taskError) throw taskError

      return {
        collection: collection as SequentialCollection,
        tasks: tasks as Task[],
        completedCount: (tasks as Task[]).filter((t) => t.status === 'completed').length,
        activeTask: (tasks as Task[]).find((t) => t.sequential_is_active) ?? null,
      }
    },
    enabled: !!collectionId,
  })
}

// ============================================================
// useCreateSequentialCollection — create collection + task items
// ============================================================

export function useCreateSequentialCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collection,
      items, // Array of task titles/content to create as sequential tasks
      assigneeId,
      createdBy,
    }: {
      collection: Omit<CreateSequentialCollection, 'task_ids' | 'current_index' | 'total_items'>
      items: Array<{ title: string; description?: string | null; url?: string | null }>
      assigneeId: string
      createdBy: string
    }) => {
      // 1. Create the collection record
      const { data: newCollection, error: collError } = await supabase
        .from('sequential_collections')
        .insert({
          ...collection,
          current_index: 0,
          task_ids: [],   // legacy field; actual tasks use sequential_collection_id FK
          total_items: items.length,
          active_count: collection.active_count ?? 1,
          promotion_timing: collection.promotion_timing ?? 'immediate',
        })
        .select()
        .single()

      if (collError) throw collError

      const col = newCollection as SequentialCollection

      // 2. Create individual task records for each item
      const taskInserts = items.map((item, index) => ({
        family_id: col.family_id,
        created_by: createdBy,
        assignee_id: assigneeId,
        title: item.title,
        description: item.description ?? null,
        task_type: 'sequential' as const,
        status: 'pending' as const,
        source: 'template_deployed' as const,
        source_reference_id: col.id,
        sequential_collection_id: col.id,
        sequential_position: index,
        sequential_is_active: index < (collection.active_count ?? 1),
        life_area_tag: collection.life_area_tag ?? null,
        focus_time_seconds: 0,
        sort_order: index,
        big_rock: false,
        is_shared: false,
        incomplete_action: 'fresh_reset' as const,
        require_approval: false,
        victory_flagged: false,
        time_tracking_enabled: false,
        kanban_status: 'to_do' as const,
        // Store URL in image_url as a general-purpose external URL field
        // (dedicated url field may be added post-MVP)
        image_url: item.url ?? null,
      }))

      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .insert(taskInserts)
        .select('id')

      if (taskError) throw taskError

      // 3. Update the collection's task_ids (legacy field) with the new task IDs
      const taskIds = (tasks as { id: string }[]).map((t) => t.id)
      const { error: updateError } = await supabase
        .from('sequential_collections')
        .update({ task_ids: taskIds })
        .eq('id', col.id)

      if (updateError) throw updateError

      return { collection: col, taskIds }
    },
    onSuccess: ({ collection }) => {
      queryClient.invalidateQueries({ queryKey: ['sequential-collections', collection.family_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', collection.family_id] })
    },
  })
}

// ============================================================
// useUpdateSequentialCollection
// ============================================================

export function useUpdateSequentialCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<SequentialCollection> & { id: string }) => {
      const { data, error } = await supabase
        .from('sequential_collections')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SequentialCollection
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequential-collections', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['sequential-collection', data.id] })
    },
  })
}

// ============================================================
// usePromoteNextSequentialItem — advance to the next item after completion
// Called automatically by the completion flow for sequential tasks.
// ============================================================

export function usePromoteNextSequentialItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      completedTask,
      collection,
    }: {
      completedTask: Task
      collection: SequentialCollection
    }) => {
      if (!completedTask.sequential_collection_id || completedTask.sequential_position === null) {
        return null
      }

      const nextPosition = completedTask.sequential_position + 1

      // Check if there's a next item
      const { data: nextTask, error: findError } = await supabase
        .from('tasks')
        .select('id, sequential_position')
        .eq('sequential_collection_id', completedTask.sequential_collection_id)
        .eq('sequential_position', nextPosition)
        .single()

      if (findError || !nextTask) {
        // No next item — collection complete
        const { error: finalizeError } = await supabase
          .from('sequential_collections')
          .update({ current_index: nextPosition })
          .eq('id', completedTask.sequential_collection_id)

        if (finalizeError) throw finalizeError
        return null
      }

      // Activate the next task
      const { error: activateError } = await supabase
        .from('tasks')
        .update({ sequential_is_active: true, status: 'pending' })
        .eq('id', (nextTask as { id: string }).id)

      if (activateError) throw activateError

      // Deactivate the completed task (keep it as completed, just not active)
      const { error: deactivateError } = await supabase
        .from('tasks')
        .update({ sequential_is_active: false })
        .eq('id', completedTask.id)

      if (deactivateError) throw deactivateError

      // Update collection's current_index
      const { error: collError } = await supabase
        .from('sequential_collections')
        .update({ current_index: nextPosition })
        .eq('id', completedTask.sequential_collection_id)

      if (collError) throw collError

      return {
        nextTaskId: (nextTask as { id: string }).id,
        collectionId: completedTask.sequential_collection_id,
        familyId: collection.family_id,
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['sequential-collection', data.collectionId] })
        queryClient.invalidateQueries({ queryKey: ['sequential-collections', data.familyId] })
        queryClient.invalidateQueries({ queryKey: ['tasks', data.familyId] })
      }
    },
  })
}

// ============================================================
// useRedeploySequentialCollection — reset progress for a new assignee
// ============================================================

export function useRedeploySequentialCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      collectionId,
      newAssigneeId,
      familyId,
      createdBy,
    }: {
      collectionId: string
      newAssigneeId: string
      familyId: string
      createdBy: string
    }) => {
      // Fetch the collection
      const { data: collection, error: collError } = await supabase
        .from('sequential_collections')
        .select('*')
        .eq('id', collectionId)
        .single()

      if (collError) throw collError
      const col = collection as SequentialCollection

      // Fetch all tasks from the collection as a template
      const { data: sourceTasks, error: taskError } = await supabase
        .from('tasks')
        .select('title, description, sequential_position, life_area_tag, image_url')
        .eq('sequential_collection_id', collectionId)
        .order('sequential_position')

      if (taskError) throw taskError
      if (!sourceTasks || sourceTasks.length === 0) return null

      // Create a new collection for the new assignee
      const { data: newCollection, error: newCollError } = await supabase
        .from('sequential_collections')
        .insert({
          family_id: familyId,
          template_id: col.template_id,
          title: col.title,
          total_items: col.total_items,
          active_count: col.active_count,
          promotion_timing: col.promotion_timing,
          life_area_tag: col.life_area_tag,
          reward_per_item_type: col.reward_per_item_type,
          reward_per_item_amount: col.reward_per_item_amount,
          current_index: 0,
          task_ids: [],
        })
        .select()
        .single()

      if (newCollError) throw newCollError
      const newCol = newCollection as SequentialCollection

      // Create tasks for the new assignee
      const taskInserts = (sourceTasks as Array<{
        title: string
        description: string | null
        sequential_position: number
        life_area_tag: string | null
        image_url: string | null
      }>).map((t, index) => ({
        family_id: familyId,
        created_by: createdBy,
        assignee_id: newAssigneeId,
        title: t.title,
        description: t.description,
        task_type: 'sequential' as const,
        status: 'pending' as const,
        source: 'template_deployed' as const,
        source_reference_id: newCol.id,
        sequential_collection_id: newCol.id,
        sequential_position: t.sequential_position,
        sequential_is_active: index < col.active_count,
        life_area_tag: t.life_area_tag,
        image_url: t.image_url,
        focus_time_seconds: 0,
        sort_order: t.sequential_position,
        big_rock: false,
        is_shared: false,
        incomplete_action: 'fresh_reset' as const,
        require_approval: false,
        victory_flagged: false,
        time_tracking_enabled: false,
        kanban_status: 'to_do' as const,
      }))

      const { data: newTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(taskInserts)
        .select('id')

      if (insertError) throw insertError

      const taskIds = (newTasks as { id: string }[]).map((t) => t.id)
      await supabase
        .from('sequential_collections')
        .update({ task_ids: taskIds })
        .eq('id', newCol.id)

      return { collection: newCol, taskCount: taskIds.length, familyId }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['sequential-collections', data.familyId] })
        queryClient.invalidateQueries({ queryKey: ['tasks', data.familyId] })
      }
    },
  })
}

// Re-export types for convenience
export type { SequentialCollection } from '@/types/tasks'
