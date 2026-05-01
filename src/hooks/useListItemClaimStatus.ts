/**
 * useListItemClaimStatus — maps list item IDs to their active claim status.
 *
 * Queries tasks where source='opportunity_list_claim' and source_reference_id
 * matches a list item in the given list. Returns a map of listItemId → claimer info.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface ClaimStatusEntry {
  claimerMemberId: string
  status: 'pending' | 'in_progress' | 'pending_approval'
  taskId: string
}

export function useListItemClaimStatus(listId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['list-item-claim-status', listId],
    queryFn: async (): Promise<Record<string, ClaimStatusEntry>> => {
      if (!listId) return {}

      const { data: items } = await supabase
        .from('list_items')
        .select('id')
        .eq('list_id', listId)

      if (!items || items.length === 0) return {}

      const itemIds = items.map(i => i.id)

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, assignee_id, status, source_reference_id')
        .eq('source', 'opportunity_list_claim')
        .in('source_reference_id', itemIds)
        .in('status', ['pending', 'in_progress', 'pending_approval'])

      if (error) throw error
      if (!tasks) return {}

      const statusMap: Record<string, ClaimStatusEntry> = {}
      for (const task of tasks) {
        if (task.source_reference_id && task.assignee_id) {
          statusMap[task.source_reference_id] = {
            claimerMemberId: task.assignee_id,
            status: task.status as ClaimStatusEntry['status'],
            taskId: task.id,
          }
        }
      }
      return statusMap
    },
    enabled: !!listId && enabled,
    staleTime: 30_000,
  })
}
