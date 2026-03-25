// PRD-17 + PRD-09A: Studio Queue hooks
// The studio_queue table (PRD-17) is the authoritative task intake — NOT task_queue.
// These hooks filter by destination='task' for the Tasks page Queue tab,
// but also expose the full queue for other consumers.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { StudioQueueItem, DismissQueueItem } from '@/types/tasks'

// ============================================================
// useStudioQueueItems — list pending queue items
// destination is optional; pass 'task' for the Tasks Queue tab
// ============================================================

export function useStudioQueueItems(
  familyId: string | undefined,
  destination?: string,
  /** Pass memberId + role for role-based scoping. Mom sees all; others see own items. */
  scopeOptions?: { memberId?: string; role?: string },
) {
  return useQuery({
    queryKey: ['studio-queue', familyId, destination, scopeOptions?.memberId, scopeOptions?.role],
    queryFn: async () => {
      if (!familyId) return []

      let query = supabase
        .from('studio_queue')
        .select('*')
        .eq('family_id', familyId)
        .is('processed_at', null)
        .is('dismissed_at', null)
        .order('created_at', { ascending: true })

      if (destination) {
        query = query.eq('destination', destination)
      }

      // Role-based filtering (PRD-02 visibility rules)
      if (scopeOptions?.role && scopeOptions.memberId) {
        if (scopeOptions.role === 'member') {
          // Teens (role='member') only see their own items
          query = query.eq('owner_id', scopeOptions.memberId)
        } else if (scopeOptions.role === 'additional_adult') {
          // Dad/additional adults see own items (full permission check requires member_permissions query)
          query = query.eq('owner_id', scopeOptions.memberId)
        }
        // primary_parent (mom) sees all — no additional filter
        // special_adult scoping would go here when shifts are implemented
      }

      const { data, error } = await query
      if (error) throw error
      return data as StudioQueueItem[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useTaskQueueItems — shorthand for task destination
// ============================================================

export function useTaskQueueItems(familyId: string | undefined) {
  return useStudioQueueItems(familyId, 'task')
}

// ============================================================
// useStudioQueueCount — badge count (pending, not dismissed)
// destination-aware
// ============================================================

export function useStudioQueueCount(
  familyId: string | undefined,
  destination?: string,
) {
  return useQuery({
    queryKey: ['studio-queue-count', familyId, destination],
    queryFn: async () => {
      if (!familyId) return 0

      let query = supabase
        .from('studio_queue')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .is('processed_at', null)
        .is('dismissed_at', null)

      if (destination) {
        query = query.eq('destination', destination)
      }

      const { count, error } = await query
      if (error) throw error
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 30_000,   // refresh every 30s for badge freshness
  })
}

// ============================================================
// useTaskQueueCount — shorthand for task badge
// ============================================================

export function useTaskQueueCount(familyId: string | undefined) {
  return useStudioQueueCount(familyId, 'task')
}

// ============================================================
// useStudioQueueBatchItems — items grouped by batch_id
// Returns a Map<batch_id | 'no_batch', StudioQueueItem[]>
// ============================================================

export function useStudioQueueBatched(
  familyId: string | undefined,
  destination?: string,
) {
  const { data: items, ...rest } = useStudioQueueItems(familyId, destination)

  const batched = (() => {
    if (!items) return undefined
    const map = new Map<string, StudioQueueItem[]>()

    for (const item of items) {
      const key = item.batch_id ?? `single_${item.id}`
      const existing = map.get(key) ?? []
      map.set(key, [...existing, item])
    }

    return map
  })()

  return { batched, raw: items, ...rest }
}

// ============================================================
// useProcessQueueItem — mark a queue item as processed
// (called after the item is successfully promoted to a task)
// ============================================================

export function useProcessQueueItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      familyId: _familyId,
    }: {
      id: string
      familyId: string
    }) => {
      const { data, error } = await supabase
        .from('studio_queue')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, family_id, destination')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count', data.family_id] })
    },
  })
}

// ============================================================
// useProcessQueueBatch — mark multiple items processed atomically
// Used by "Process All" flow in the Queue tab
// ============================================================

export function useProcessQueueBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      familyId,
    }: {
      ids: string[]
      familyId: string
    }) => {
      const { data, error } = await supabase
        .from('studio_queue')
        .update({ processed_at: new Date().toISOString() })
        .in('id', ids.length === 0 ? [''] : ids)
        .select('id')

      if (error) throw error
      return { data: ids.length === 0 ? [] : (data ?? []), familyId }
    },
    onSuccess: ({ familyId }) => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue', familyId] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count', familyId] })
    },
  })
}

// ============================================================
// useDismissQueueItem — dismiss without promoting
// ============================================================

export function useDismissQueueItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      familyId: _familyId,
      dismiss_note,
    }: DismissQueueItem & { familyId: string }) => {
      const { data, error } = await supabase
        .from('studio_queue')
        .update({
          dismissed_at: new Date().toISOString(),
          dismiss_note: dismiss_note ?? null,
        })
        .eq('id', id)
        .select('id, family_id, destination')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // data.family_id used for cache invalidation; familyId param unused
      queryClient.invalidateQueries({ queryKey: ['studio-queue', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count', data.family_id] })
    },
  })
}

// ============================================================
// useEnqueueTask — add an item to the studio_queue with destination='task'
// Used by: Smart Notepad "Send to Tasks", LiLa, Review & Route, etc.
// ============================================================

export function useEnqueueTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      familyId,
      ownerId,
      content,
      source,
      contentDetails,
      sourceReferenceId,
      structureFlag,
      batchId,
      requesterId,
      requesterNote,
    }: {
      familyId: string
      ownerId: string
      content: string
      source: string
      contentDetails?: Record<string, unknown> | null
      sourceReferenceId?: string | null
      structureFlag?: string | null
      batchId?: string | null
      requesterId?: string | null
      requesterNote?: string | null
    }) => {
      const { data, error } = await supabase
        .from('studio_queue')
        .insert({
          family_id: familyId,
          owner_id: ownerId,
          destination: 'task',
          content,
          source,
          content_details: contentDetails ?? null,
          source_reference_id: sourceReferenceId ?? null,
          structure_flag: structureFlag ?? 'single',
          batch_id: batchId ?? null,
          requester_id: requesterId ?? null,
          requester_note: requesterNote ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as StudioQueueItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['studio-queue-count', data.family_id] })
    },
  })
}

// Re-export types for convenience
export type { StudioQueueItem, DismissQueueItem } from '@/types/tasks'
