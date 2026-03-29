/**
 * useSmartDraw — Frequency-aware draw engine for Randomizer lists
 *
 * Respects per-item frequency rules:
 * - frequency_max: cap on draws per period
 * - frequency_min: priority weighting for under-served items (3× weight)
 * - cooldown_hours: minimum time between completions
 * - max_instances (lifetime_max): total completions ever allowed
 * - pool_mode: 'shared' uses list_items fields, 'individual' uses list_item_member_tracking
 *
 * Spec: specs/smart-lists-reveal-mechanics-spec.md
 */

import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { ListItem, ListItemMemberTracking, PoolMode } from '@/types/lists'

// ─── Types ────────────────────────────────────────────────

export interface SmartDrawOptions {
  listId: string
  memberId: string
  poolMode: PoolMode
  count?: number
}

export interface SmartDrawResult {
  items: ListItem[]
  exhausted: boolean
  nextAvailableAt: string | null // earliest time an item becomes available again
}

// ─── Member tracking query ────────────────────────────────

export function useListItemMemberTracking(listId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['list-item-member-tracking', listId, memberId],
    queryFn: async () => {
      if (!listId || !memberId) return []

      // Get all tracking for this member's items in this list
      const { data, error } = await supabase
        .from('list_item_member_tracking')
        .select('*')
        .eq('family_member_id', memberId)

      if (error) throw error

      // Filter to items in this list (join not available, so we do client-side)
      // This is acceptable because tracking rows are sparse
      return (data ?? []) as ListItemMemberTracking[]
    },
    enabled: !!listId && !!memberId,
  })
}

// ─── Eligibility check ───────────────────────────────────

interface TrackingData {
  last_completed_at: string | null
  period_completion_count: number
  lifetime_completion_count: number
}

function getTrackingForItem(
  item: ListItem,
  poolMode: PoolMode,
  memberTracking: ListItemMemberTracking[],
): TrackingData {
  if (poolMode === 'shared') {
    return {
      last_completed_at: item.last_completed_at,
      period_completion_count: item.period_completion_count,
      lifetime_completion_count: item.completed_instances,
    }
  }

  const mt = memberTracking.find(t => t.list_item_id === item.id)
  if (!mt) {
    return { last_completed_at: null, period_completion_count: 0, lifetime_completion_count: 0 }
  }
  return {
    last_completed_at: mt.last_completed_at,
    period_completion_count: mt.period_completion_count,
    lifetime_completion_count: mt.lifetime_completion_count,
  }
}

function isItemEligible(item: ListItem, tracking: TrackingData): boolean {
  if (!item.is_available) return false

  // Lifetime cap (max_instances serves as lifetime_max)
  if (item.max_instances != null && tracking.lifetime_completion_count >= item.max_instances) {
    return false
  }

  // Period cap
  if (item.frequency_max != null && tracking.period_completion_count >= item.frequency_max) {
    return false
  }

  // Cooldown check
  if (item.cooldown_hours != null && tracking.last_completed_at) {
    const cooldownEnd = new Date(tracking.last_completed_at)
    cooldownEnd.setHours(cooldownEnd.getHours() + item.cooldown_hours)
    if (new Date() < cooldownEnd) return false
  }

  return true
}

function getItemWeight(item: ListItem, tracking: TrackingData): number {
  // Under-served items (below frequency_min) get 3× weight
  if (item.frequency_min != null && tracking.period_completion_count < item.frequency_min) {
    return 3
  }
  return 1
}

function getNextAvailableTime(
  items: ListItem[],
  poolMode: PoolMode,
  memberTracking: ListItemMemberTracking[],
): string | null {
  let earliest: Date | null = null

  for (const item of items) {
    if (!item.is_available) continue

    const tracking = getTrackingForItem(item, poolMode, memberTracking)

    // Check if item is on cooldown
    if (item.cooldown_hours != null && tracking.last_completed_at) {
      const cooldownEnd = new Date(tracking.last_completed_at)
      cooldownEnd.setHours(cooldownEnd.getHours() + item.cooldown_hours)
      if (new Date() < cooldownEnd) {
        if (!earliest || cooldownEnd < earliest) earliest = cooldownEnd
      }
    }
  }

  return earliest?.toISOString() ?? null
}

// ─── Weighted random selection ───────────────────────────

function weightedRandomSelect<T>(items: T[], weights: number[], count: number): T[] {
  if (items.length === 0) return []

  const selected: T[] = []
  const remaining = [...items]
  const remainingWeights = [...weights]

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const currentTotal = remainingWeights.reduce((sum, w) => sum + w, 0)
    let random = Math.random() * currentTotal
    let selectedIndex = 0

    for (let j = 0; j < remainingWeights.length; j++) {
      random -= remainingWeights[j]
      if (random <= 0) {
        selectedIndex = j
        break
      }
    }

    selected.push(remaining[selectedIndex])
    remaining.splice(selectedIndex, 1)
    remainingWeights.splice(selectedIndex, 1)
  }

  return selected
}

// ─── Main hook ───────────────────────────────────────────

export function useSmartDraw(
  items: ListItem[],
  poolMode: PoolMode,
  _memberId: string | undefined,
  memberTracking: ListItemMemberTracking[],
) {
  const eligibleItems = useMemo(() => {
    return items.filter(item => {
      const tracking = getTrackingForItem(item, poolMode, memberTracking)
      return isItemEligible(item, tracking)
    })
  }, [items, poolMode, memberTracking])

  const draw = useCallback((count = 1): SmartDrawResult => {
    if (eligibleItems.length === 0) {
      return {
        items: [],
        exhausted: true,
        nextAvailableAt: getNextAvailableTime(items, poolMode, memberTracking),
      }
    }

    const weights = eligibleItems.map(item => {
      const tracking = getTrackingForItem(item, poolMode, memberTracking)
      return getItemWeight(item, tracking)
    })

    const selected = weightedRandomSelect(eligibleItems, weights, count)

    return {
      items: selected,
      exhausted: false,
      nextAvailableAt: null,
    }
  }, [eligibleItems, items, poolMode, memberTracking])

  return {
    draw,
    eligibleCount: eligibleItems.length,
    totalCount: items.length,
    exhausted: eligibleItems.length === 0,
    nextAvailableAt: eligibleItems.length === 0
      ? getNextAvailableTime(items, poolMode, memberTracking)
      : null,
  }
}

// ─── Completion hook ─────────────────────────────────────

export function useSmartDrawCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listItemId,
      memberId,
      listId,
      poolMode,
    }: {
      listItemId: string
      memberId: string
      listId: string
      poolMode: PoolMode
    }) => {
      const now = new Date().toISOString()

      if (poolMode === 'shared') {
        // Update directly on list_items
        const { data: item, error: fetchErr } = await supabase
          .from('list_items')
          .select('completed_instances, period_completion_count, max_instances, cooldown_hours')
          .eq('id', listItemId)
          .single()

        if (fetchErr || !item) throw fetchErr ?? new Error('Item not found')

        const newLifetime = (item.completed_instances ?? 0) + 1
        const newPeriod = (item.period_completion_count ?? 0) + 1

        const updates: Record<string, unknown> = {
          completed_instances: newLifetime,
          period_completion_count: newPeriod,
          last_completed_at: now,
        }

        // Set cooldown
        if (item.cooldown_hours) {
          const nextAvail = new Date()
          nextAvail.setHours(nextAvail.getHours() + item.cooldown_hours)
          updates.next_available_at = nextAvail.toISOString()
        }

        // Check lifetime cap
        if (item.max_instances != null && newLifetime >= item.max_instances) {
          updates.is_available = false
        }

        const { error: updateErr } = await supabase
          .from('list_items')
          .update(updates)
          .eq('id', listItemId)

        if (updateErr) throw updateErr
      } else {
        // Individual pool: upsert list_item_member_tracking
        const { data: existing } = await supabase
          .from('list_item_member_tracking')
          .select('*')
          .eq('list_item_id', listItemId)
          .eq('family_member_id', memberId)
          .maybeSingle()

        if (existing) {
          const { error } = await supabase
            .from('list_item_member_tracking')
            .update({
              last_completed_at: now,
              period_completion_count: existing.period_completion_count + 1,
              lifetime_completion_count: existing.lifetime_completion_count + 1,
            })
            .eq('id', existing.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('list_item_member_tracking')
            .insert({
              list_item_id: listItemId,
              family_member_id: memberId,
              last_completed_at: now,
              period_completion_count: 1,
              lifetime_completion_count: 1,
            })

          if (error) throw error
        }
      }

      return { listId, listItemId }
    },
    onSuccess: ({ listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
      queryClient.invalidateQueries({ queryKey: ['list-item-member-tracking'] })
    },
  })
}
