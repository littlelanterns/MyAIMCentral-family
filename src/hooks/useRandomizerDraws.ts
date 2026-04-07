/**
 * Build J — PRD-09A/09B Randomizer Draws
 *
 * Query + mutation helpers for the `randomizer_draws` table.
 * Used by:
 *   - Focused/Buffet draw modes for active-slot management
 *   - Surprise Me auto-draw on routine instance generation
 *
 * Surprise Me is deterministic per day via the UNIQUE partial index:
 *   (list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'
 * Refreshing the page returns the same row for the same day — that's the feature.
 *
 * Smart-draw weighting (3× for under-frequency-min items, cooldown exclusion,
 * lifetime cap) is reused from `useSmartDraw` for Surprise Me selection.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  RandomizerDraw,
  RandomizerDrawStatus,
} from '@/types/tasks'
import type { ListItem, PoolMode, ListItemMemberTracking } from '@/types/lists'

// ─── Query: active draws for a member on a list ─────────────────────

export function useRandomizerDraws(
  listId: string | undefined,
  memberId: string | undefined,
  status?: RandomizerDrawStatus | RandomizerDrawStatus[],
) {
  return useQuery({
    queryKey: ['randomizer-draws', listId, memberId, status],
    queryFn: async () => {
      if (!listId || !memberId) return []

      let query = supabase
        .from('randomizer_draws')
        .select('*')
        .eq('list_id', listId)
        .eq('family_member_id', memberId)
        .order('drawn_at', { ascending: false })

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status)
        } else {
          query = query.eq('status', status)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as RandomizerDraw[]
    },
    enabled: !!listId && !!memberId,
  })
}

// ─── Query: pending mastery submissions on a list ──────────────────

export function useRandomizerPendingMastery(listId: string | undefined) {
  return useQuery({
    queryKey: ['randomizer-pending-mastery', listId],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('advancement_mode', 'mastery')
        .eq('mastery_status', 'submitted')
        .order('mastery_submitted_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as ListItem[]
    },
    enabled: !!listId,
  })
}

// ─── Mutation: manually draw an item (Focused / Buffet modes) ──────

export interface ManualDrawParams {
  listId: string
  listItemId: string
  familyMemberId: string
}

export function useManualDraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ManualDrawParams): Promise<RandomizerDraw> => {
      const { data, error } = await supabase
        .from('randomizer_draws')
        .insert({
          list_id: params.listId,
          list_item_id: params.listItemId,
          family_member_id: params.familyMemberId,
          draw_source: 'manual',
          status: 'active',
        })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to create draw')
      return data as RandomizerDraw
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['randomizer-draws', params.listId] })
    },
  })
}

// ─── Mutation: release a draw (cancel without completing) ──────────

export function useReleaseDraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      drawId,
      listId,
    }: {
      drawId: string
      listId: string
    }) => {
      const { error } = await supabase
        .from('randomizer_draws')
        .update({ status: 'released', completed_at: new Date().toISOString() })
        .eq('id', drawId)
      if (error) throw error
      return { drawId, listId }
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: ['randomizer-draws', listId] })
    },
  })
}

// ─── Mutation: mark a draw completed (non-mastery flow) ────────────

export function useCompleteDraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      drawId,
      listId,
    }: {
      drawId: string
      listId: string
    }) => {
      const { error } = await supabase
        .from('randomizer_draws')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', drawId)
      if (error) throw error
      return { drawId, listId }
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: ['randomizer-draws', listId] })
    },
  })
}

// ─── Surprise Me — deterministic auto-draw per day ──────────────────
//
// Ensures exactly one auto-draw exists for (list_id, family_member_id,
// routine_instance_date). On first call for a day, selects an item via
// smart-draw weighting and writes the row. Subsequent calls for the same
// day return the existing row.
//
// This is called by linked routine steps with step_type='linked_randomizer'
// on a list where draw_mode='surprise'.

interface SurpriseMeParams {
  listId: string
  familyMemberId: string
  routineInstanceDate: string  // YYYY-MM-DD
  // Pre-fetched eligible items + pool mode + tracking, so this hook doesn't
  // need to re-implement smart-draw logic. Caller computes weights via
  // useSmartDraw.
  eligibleItems: ListItem[]
  poolMode: PoolMode
  memberTracking: ListItemMemberTracking[]
}

function getWeight(
  item: ListItem,
  poolMode: PoolMode,
  memberTracking: ListItemMemberTracking[],
): number {
  // Under-served items (below frequency_min) get 3× weight
  let periodCount = 0
  if (poolMode === 'shared') {
    periodCount = item.period_completion_count
  } else {
    const mt = memberTracking.find(t => t.list_item_id === item.id)
    periodCount = mt?.period_completion_count ?? 0
  }
  if (item.frequency_min != null && periodCount < item.frequency_min) {
    return 3
  }
  return 1
}

function weightedPick(items: ListItem[], weights: number[]): ListItem | null {
  if (items.length === 0) return null
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export function useSurpriseMeAutoDraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SurpriseMeParams): Promise<RandomizerDraw | null> => {
      // 1. Check if a Surprise Me draw already exists for this day
      const { data: existing } = await supabase
        .from('randomizer_draws')
        .select('*')
        .eq('list_id', params.listId)
        .eq('family_member_id', params.familyMemberId)
        .eq('routine_instance_date', params.routineInstanceDate)
        .eq('draw_source', 'auto_surprise')
        .maybeSingle()

      if (existing) return existing as RandomizerDraw

      // 2. No draw yet — select via smart-draw weighting
      if (params.eligibleItems.length === 0) return null

      const weights = params.eligibleItems.map(item =>
        getWeight(item, params.poolMode, params.memberTracking),
      )
      const winner = weightedPick(params.eligibleItems, weights)
      if (!winner) return null

      // 3. Write the draw row. The UNIQUE partial index prevents dupes under
      //    concurrent reads; we handle conflict by re-fetching.
      const { data: inserted, error: insertErr } = await supabase
        .from('randomizer_draws')
        .insert({
          list_id: params.listId,
          list_item_id: winner.id,
          family_member_id: params.familyMemberId,
          draw_source: 'auto_surprise',
          routine_instance_date: params.routineInstanceDate,
          status: 'active',
        })
        .select()
        .single()

      if (insertErr) {
        // Unique-violation fallback: another tab beat us to it. Fetch and return.
        const { data: raced } = await supabase
          .from('randomizer_draws')
          .select('*')
          .eq('list_id', params.listId)
          .eq('family_member_id', params.familyMemberId)
          .eq('routine_instance_date', params.routineInstanceDate)
          .eq('draw_source', 'auto_surprise')
          .maybeSingle()
        return (raced as RandomizerDraw) ?? null
      }

      return inserted as RandomizerDraw
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ['randomizer-draws', params.listId] })
    },
  })
}

// ─── Count active draws on a list (for Focused/Buffet slot display) ─

export function useActiveDrawCount(listId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['randomizer-draws-count', listId, memberId],
    queryFn: async () => {
      if (!listId || !memberId) return 0
      const { count, error } = await supabase
        .from('randomizer_draws')
        .select('id', { count: 'exact', head: true })
        .eq('list_id', listId)
        .eq('family_member_id', memberId)
        .eq('status', 'active')

      if (error) throw error
      return count ?? 0
    },
    enabled: !!listId && !!memberId,
  })
}
