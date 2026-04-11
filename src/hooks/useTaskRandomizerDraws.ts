/**
 * useTaskRandomizerDraws — Build M Phase 6
 *
 * For tasks with `linked_list_id` (randomizer-linked), fetches today's
 * deterministic auto-draw. Returns a map of taskId → drawn item name
 * so the tile grid can render mystery tap or show-upfront variants.
 *
 * On first call for a day, triggers auto-draws for lists that don't
 * have one yet. Subsequent calls return cached draws.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso } from '@/utils/dates'
import type { Task } from '@/types/tasks'

export interface TaskRandomizerDraw {
  listId: string
  drawId: string
  listItemId: string
  itemName: string
}

/**
 * Query existing auto-surprise draws for today, joined with list_items
 * to get the item name. Returns a map keyed by list_id.
 */
export function useTaskRandomizerDraws(
  tasks: Task[],
  memberId: string | undefined,
) {
  const today = todayLocalIso()

  // Extract unique linked_list_ids
  const linkedListIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of tasks) {
      if (t.linked_list_id) ids.add(t.linked_list_id)
    }
    return Array.from(ids)
  }, [tasks])

  // Query existing draws for today
  const { data: draws, isLoading } = useQuery({
    queryKey: ['task-randomizer-draws', memberId, today, linkedListIds],
    queryFn: async () => {
      if (!memberId || linkedListIds.length === 0) return []

      const { data, error } = await supabase
        .from('randomizer_draws')
        .select('id, list_id, list_item_id, status, list_items!inner(content)')
        .in('list_id', linkedListIds)
        .eq('family_member_id', memberId)
        .eq('routine_instance_date', today)
        .eq('draw_source', 'auto_surprise')

      if (error) {
        console.warn('useTaskRandomizerDraws query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!memberId && linkedListIds.length > 0,
    staleTime: 60_000,
  })

  // Build a map: listId → draw info
  const drawMap = useMemo(() => {
    const map: Record<string, TaskRandomizerDraw> = {}
    if (!draws) return map

    for (const row of draws) {
      const itemData = row.list_items as unknown as { content: string } | null
      map[row.list_id] = {
        listId: row.list_id,
        drawId: row.id,
        listItemId: row.list_item_id,
        itemName: itemData?.content ?? 'Activity',
      }
    }
    return map
  }, [draws])

  // Build the final map: taskId → draw info (for convenience)
  const taskDrawMap = useMemo(() => {
    const map: Record<string, TaskRandomizerDraw> = {}
    for (const task of tasks) {
      if (task.linked_list_id && drawMap[task.linked_list_id]) {
        map[task.id] = drawMap[task.linked_list_id]
      }
    }
    return map
  }, [tasks, drawMap])

  // Auto-trigger draws for lists missing today's draw
  const missingListIds = useMemo(() => {
    if (isLoading || !draws) return []
    const existingListIds = new Set(draws.map(d => d.list_id))
    return linkedListIds.filter(id => !existingListIds.has(id))
  }, [linkedListIds, draws, isLoading])

  useAutoDrawMissing(missingListIds, memberId, today)

  return { taskDrawMap, isLoading }
}

// ── Auto-draw trigger for lists missing today's draw ─────────────────

function useAutoDrawMissing(
  missingListIds: string[],
  memberId: string | undefined,
  today: string,
) {
  const queryClient = useQueryClient()
  const triggeredRef = useRef(new Set<string>())

  const autoDrawMutation = useMutation({
    mutationFn: async ({ listId }: { listId: string }) => {
      if (!memberId) return null

      // Fetch eligible items for this list
      const { data: items } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('is_available', true)

      if (!items || items.length === 0) return null

      // Simple weighted pick (3× for under-frequency-min)
      const weights = items.map(item => {
        if (item.frequency_min != null && item.period_completion_count < item.frequency_min) {
          return 3
        }
        return 1
      })
      const total = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      let winner = items[items.length - 1]
      for (let i = 0; i < items.length; i++) {
        r -= weights[i]
        if (r <= 0) { winner = items[i]; break }
      }

      // Insert with conflict handling (UNIQUE partial index)
      const { data: inserted, error } = await supabase
        .from('randomizer_draws')
        .insert({
          list_id: listId,
          list_item_id: winner.id,
          family_member_id: memberId,
          draw_source: 'auto_surprise',
          routine_instance_date: today,
          status: 'active',
        })
        .select()
        .maybeSingle()

      if (error) {
        // Race condition — another tab drew first. That's fine.
        console.warn('Auto-draw insert conflict (expected if concurrent):', error.message)
      }
      return inserted
    },
    onSuccess: () => {
      // Refetch draws so the map updates
      queryClient.invalidateQueries({ queryKey: ['task-randomizer-draws'] })
    },
  })

  useEffect(() => {
    if (!memberId || missingListIds.length === 0) return

    for (const listId of missingListIds) {
      if (triggeredRef.current.has(listId)) continue
      triggeredRef.current.add(listId)
      autoDrawMutation.mutate({ listId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingListIds, memberId])
}
