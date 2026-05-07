import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Contract } from '@/types/contracts'

export interface SourceName {
  source_id: string
  title: string
  kind: 'list' | 'task_template' | 'unknown'
}

/**
 * Resolves contract source_ids to human-readable titles.
 * Looks up `lists.title` for list-based contracts and `task_templates.title`
 * for task-template-based contracts.
 *
 * Used by RewardRules page to group contracts under the list/template that
 * spawned them (e.g. "Extra Earning List" instead of 18 anonymous list_item rows).
 */
export function useContractSourceNames(
  familyId: string | undefined,
  contracts: Contract[],
) {
  const sourceIds = Array.from(
    new Set(
      contracts
        .map((c) => c.source_id)
        .filter((id): id is string => Boolean(id)),
    ),
  )

  return useQuery({
    queryKey: ['contract-source-names', familyId, sourceIds.sort().join(',')],
    queryFn: async () => {
      if (!familyId || sourceIds.length === 0) return new Map<string, SourceName>()
      const map = new Map<string, SourceName>()

      const [listsRes, templatesRes] = await Promise.all([
        supabase
          .from('lists')
          .select('id, title, list_type')
          .eq('family_id', familyId)
          .in('id', sourceIds),
        supabase
          .from('task_templates')
          .select('id, title, template_name')
          .eq('family_id', familyId)
          .in('id', sourceIds),
      ])

      for (const row of listsRes.data ?? []) {
        map.set(row.id, {
          source_id: row.id,
          title: row.title || 'Untitled list',
          kind: 'list',
        })
      }
      for (const row of templatesRes.data ?? []) {
        map.set(row.id, {
          source_id: row.id,
          title: row.title || row.template_name || 'Untitled template',
          kind: 'task_template',
        })
      }

      return map
    },
    enabled: !!familyId,
    staleTime: 60_000,
  })
}
