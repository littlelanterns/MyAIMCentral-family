import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

/**
 * PRD-41 — LiLa Response Log (mom-only).
 *
 * Reads public.lila_ethics_rejections. Two guardrails are enforced at the DB
 * layer, not here:
 *   1. RLS: only the family's primary_parent can SELECT (migration 100286).
 *   2. Column guard: content_excerpt + tier2_reasoning have SELECT REVOKEd
 *      from authenticated (migration 100286) — PostgREST will not return them
 *      even if requested. We NEVER select them here either (belt + suspenders,
 *      and it makes the no-excerpt promise legible in the code).
 *
 * The founder ruling 2026-07-06 (no side-door): this surface shows the
 * surface, a plain-language category, direction, and when — never the
 * conversation content itself.
 */

export type EthicsRejectionCategory =
  | 'force'
  | 'coercion'
  | 'manipulation'
  | 'shame_based_control'
  | 'withholding_affection'
  | 'crisis_output'

export interface EthicsRejectionRow {
  id: string
  family_id: string
  member_id: string | null
  surface: string
  mode_key: string | null
  direction: 'input' | 'output'
  tier: 0 | 1 | 2
  category: EthicsRejectionCategory
  action: 'reframed' | 'replaced' | 'retracted' | 'logged_only'
  created_at: string
}

// Non-content columns ONLY — content_excerpt / tier2_reasoning are never
// requested (and are DB-column-guarded regardless).
const SAFE_COLUMNS =
  'id, family_id, member_id, surface, mode_key, direction, tier, category, action, created_at'

const PAGE_SIZE = 20

export function useEthicsLog(page = 0) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id
  const isMom = member?.role === 'primary_parent'

  return useQuery({
    queryKey: ['ethics-log', familyId, page],
    enabled: !!familyId && isMom,
    queryFn: async () => {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error, count } = await supabase
        .from('lila_ethics_rejections')
        .select(SAFE_COLUMNS, { count: 'exact' })
        .eq('family_id', familyId!)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return {
        rows: (data ?? []) as EthicsRejectionRow[],
        total: count ?? 0,
        pageSize: PAGE_SIZE,
      }
    },
  })
}

export const ETHICS_LOG_PAGE_SIZE = PAGE_SIZE
