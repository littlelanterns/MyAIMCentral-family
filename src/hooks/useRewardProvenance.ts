/**
 * useRewardProvenance — KIDS-REWARDS-PAGE Slice 2 (gate Q6, recon Section 4).
 *
 * Resolves human-readable "how they earned it" labels for earned_prizes rows
 * by batch-joining source_type/source_id against the live provenance targets
 * (build-file Section 8 finding #9 — final source_type vocabulary):
 *
 *   'task_completion' | 'task' | 'sequential_task' → tasks.title
 *   'intention_iteration'                          → best_intentions.statement
 *   'randomizer_item'                              → list_items.item_name/content
 *   'contract_grant'                               → "a reward rule"
 *
 * Returns a Record<prizeId, label> where label is the SOURCE phrase (the UI
 * renders it as "Earned by: {label}"). Prizes whose source can't be resolved
 * (deleted task, unknown type) simply have no entry — the UI omits the line
 * rather than showing something wrong.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { EarnedPrize } from '@/types/reward-reveals'

const TASK_SOURCE_TYPES = new Set(['task_completion', 'task', 'sequential_task'])

export function useRewardProvenance(prizes: EarnedPrize[]) {
  // Stable key: the set of (type, id) pairs that need resolving.
  const pairKey = prizes
    .map(p => `${p.source_type}:${p.source_id}`)
    .sort()
    .join('|')

  return useQuery({
    queryKey: ['reward-provenance', pairKey],
    queryFn: async (): Promise<Record<string, string>> => {
      const taskIds = new Set<string>()
      const intentionIds = new Set<string>()
      const listItemIds = new Set<string>()

      for (const p of prizes) {
        if (!p.source_id) continue
        if (TASK_SOURCE_TYPES.has(p.source_type)) taskIds.add(p.source_id)
        else if (p.source_type === 'intention_iteration') intentionIds.add(p.source_id)
        else if (p.source_type === 'randomizer_item') listItemIds.add(p.source_id)
      }

      const [tasksRes, intentionsRes, itemsRes] = await Promise.all([
        taskIds.size > 0
          ? supabase.from('tasks').select('id, title').in('id', [...taskIds])
          : Promise.resolve({ data: [] as { id: string; title: string | null }[], error: null }),
        intentionIds.size > 0
          ? supabase.from('best_intentions').select('id, statement').in('id', [...intentionIds])
          : Promise.resolve({ data: [] as { id: string; statement: string | null }[], error: null }),
        listItemIds.size > 0
          ? supabase
              .from('list_items')
              .select('id, item_name, content')
              .in('id', [...listItemIds])
          : Promise.resolve({
              data: [] as { id: string; item_name: string | null; content: string | null }[],
              error: null,
            }),
      ])

      const taskTitles = new Map(
        (tasksRes.data ?? []).map(t => [t.id, t.title ?? null]),
      )
      const intentionStatements = new Map(
        (intentionsRes.data ?? []).map(i => [i.id, i.statement ?? null]),
      )
      const itemNames = new Map(
        (itemsRes.data ?? []).map(li => [li.id, li.item_name ?? li.content ?? null]),
      )

      const result: Record<string, string> = {}
      for (const p of prizes) {
        let label: string | null = null
        if (TASK_SOURCE_TYPES.has(p.source_type)) {
          label = taskTitles.get(p.source_id) ?? null
        } else if (p.source_type === 'intention_iteration') {
          label = intentionStatements.get(p.source_id) ?? null
        } else if (p.source_type === 'randomizer_item') {
          label = itemNames.get(p.source_id) ?? null
        } else if (p.source_type === 'contract_grant') {
          label = 'a reward rule'
        }
        if (label) result[p.id] = label
      }
      return result
    },
    enabled: prizes.length > 0,
    staleTime: 60_000,
  })
}
