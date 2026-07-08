/**
 * useRewardShop — PRD-24 Point Economy Addendum §6/§8.2-8.3 (PECON-SHOP).
 *
 * Data layer for the Reward Shop: catalog CRUD (mom + reward_rules-granted
 * adults), the purchase/resolve/cancel RPCs, and the completion-percentage
 * unlock-gate readout. Every mutation that can move `gamification_points`
 * routes through the server-side RPCs — this file never touches
 * `point_transactions` or `family_members.gamification_points` directly
 * (Convention #280 choke-point discipline).
 */

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  RewardShopItem,
  RewardShopPurchase,
  RewardShopPurchaseWithItem,
  RewardShopUnlockRule,
  PurchaseRewardShopItemResult,
  ResolveRewardShopPurchaseResult,
  CancelRewardShopPurchaseResult,
} from '@/types/reward-shop'

// ─── Cache invalidation ─────────────────────────────────────────────────────

/**
 * Invalidates every reward-shop-prefixed query key plus the balance/points/
 * earned-prizes surfaces a purchase, approval, decline, or cancel can move.
 * `earned-prizes` is keyed by familyId in useEarnedPrizes.ts and by memberId
 * in useRewardReveals.ts — both shapes are invalidated so neither cache goes
 * stale regardless of which surface reads it next.
 */
export function invalidateRewardShopQueries(
  qc: QueryClient,
  opts: { familyId?: string; memberId?: string } = {},
) {
  qc.invalidateQueries({
    predicate: (query) =>
      typeof query.queryKey[0] === 'string' && (query.queryKey[0] as string).startsWith('reward-shop'),
  })
  qc.invalidateQueries({ queryKey: ['family-members'] })
  qc.invalidateQueries({ queryKey: ['family-member'] })
  if (opts.memberId) {
    qc.invalidateQueries({ queryKey: ['member-points-today', opts.memberId] })
    qc.invalidateQueries({ queryKey: ['earned-prizes', opts.memberId] })
    qc.invalidateQueries({ queryKey: ['earned-prizes-unredeemed-count', opts.memberId] })
  }
  if (opts.familyId) {
    qc.invalidateQueries({ queryKey: ['earned-prizes', opts.familyId] })
    qc.invalidateQueries({ queryKey: ['earned-prizes-redeemed', opts.familyId] })
  }
}

// ─── Catalog — management read (mom / reward_rules-granted adult) ─────────

/** Full catalog incl. inactive/archived — for the Prize Board Shop tab manager. */
export function useRewardShopItemsAll(familyId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-items-all', familyId],
    queryFn: async (): Promise<RewardShopItem[]> => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_shop_items')
        .select('*')
        .eq('family_id', familyId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as RewardShopItem[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

// ─── Catalog — kid-visible read (RLS already scopes to active + audience) ──

export function useRewardShopItemsForMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-items-member', memberId],
    queryFn: async (): Promise<RewardShopItem[]> => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reward_shop_items')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as RewardShopItem[]
    },
    enabled: !!memberId,
    staleTime: 15_000,
  })
}

// ─── Catalog — create / update / archive ───────────────────────────────────

export interface RewardShopItemInput {
  familyId: string
  createdBy: string
  name: string
  description?: string | null
  imageUrl?: string | null
  imageAssetKey?: string | null
  pointCost: number
  requiresApproval: boolean
  audienceMemberIds: string[]
  limitPerMember?: number | null
  limitPeriod?: 'day' | 'week' | 'month' | null
  unlockRule?: RewardShopUnlockRule | null
  notesToKid?: string | null
  sortOrder?: number
}

export function useCreateRewardShopItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RewardShopItemInput) => {
      const { data, error } = await supabase
        .from('reward_shop_items')
        .insert({
          family_id: input.familyId,
          created_by: input.createdBy,
          name: input.name,
          description: input.description ?? null,
          image_url: input.imageUrl ?? null,
          image_asset_key: input.imageAssetKey ?? null,
          point_cost: input.pointCost,
          requires_approval: input.requiresApproval,
          audience_member_ids: input.audienceMemberIds,
          limit_per_member: input.limitPerMember ?? null,
          limit_period: input.limitPeriod ?? null,
          unlock_rule: input.unlockRule ?? null,
          notes_to_kid: input.notesToKid ?? null,
          sort_order: input.sortOrder ?? 0,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as RewardShopItem
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reward-shop-items-all', data.family_id] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'reward-shop-items-member' })
    },
  })
}

export function useUpdateRewardShopItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { itemId: string; familyId: string; updates: Partial<RewardShopItemInput> }) => {
      const patch: Record<string, unknown> = {}
      const u = params.updates
      if (u.name !== undefined) patch.name = u.name
      if (u.description !== undefined) patch.description = u.description
      if (u.imageUrl !== undefined) patch.image_url = u.imageUrl
      if (u.imageAssetKey !== undefined) patch.image_asset_key = u.imageAssetKey
      if (u.pointCost !== undefined) patch.point_cost = u.pointCost
      if (u.requiresApproval !== undefined) patch.requires_approval = u.requiresApproval
      if (u.audienceMemberIds !== undefined) patch.audience_member_ids = u.audienceMemberIds
      if (u.limitPerMember !== undefined) patch.limit_per_member = u.limitPerMember
      if (u.limitPeriod !== undefined) patch.limit_period = u.limitPeriod
      if (u.unlockRule !== undefined) patch.unlock_rule = u.unlockRule
      if (u.notesToKid !== undefined) patch.notes_to_kid = u.notesToKid
      if (u.sortOrder !== undefined) patch.sort_order = u.sortOrder

      const { error } = await supabase
        .from('reward_shop_items')
        .update(patch)
        .eq('id', params.itemId)
      if (error) throw error
      return params
    },
    onSuccess: (params) => {
      qc.invalidateQueries({ queryKey: ['reward-shop-items-all', params.familyId] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'reward-shop-items-member' })
    },
  })
}

export function useToggleRewardShopItemActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { itemId: string; familyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('reward_shop_items')
        .update({ is_active: params.isActive })
        .eq('id', params.itemId)
      if (error) throw error
      return params
    },
    onSuccess: (params) => {
      qc.invalidateQueries({ queryKey: ['reward-shop-items-all', params.familyId] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'reward-shop-items-member' })
    },
  })
}

export function useArchiveRewardShopItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { itemId: string; familyId: string }) => {
      const { error } = await supabase
        .from('reward_shop_items')
        .update({ archived_at: new Date().toISOString(), is_active: false })
        .eq('id', params.itemId)
      if (error) throw error
      return params
    },
    onSuccess: (params) => {
      qc.invalidateQueries({ queryKey: ['reward-shop-items-all', params.familyId] })
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'reward-shop-items-member' })
    },
  })
}

// ─── Purchases — read ───────────────────────────────────────────────────────

/** A member's own purchases — pending strip + history on My Rewards. */
export function useMemberRewardShopPurchases(memberId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-purchases-member', memberId],
    queryFn: async (): Promise<RewardShopPurchase[]> => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reward_shop_purchases')
        .select('*')
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as RewardShopPurchase[]
    },
    enabled: !!memberId,
    staleTime: 10_000,
  })
}

/** All pending purchases for a family — Queue card + Shop tab pending strip. */
export function usePendingRewardShopPurchases(familyId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-purchases-pending', familyId],
    queryFn: async (): Promise<RewardShopPurchase[]> => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_shop_purchases')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as RewardShopPurchase[]
    },
    enabled: !!familyId,
    staleTime: 10_000,
  })
}

/** Pending purchases joined with item pictures — Queue RequestsTab card. */
export function usePendingRewardShopPurchasesWithItem(familyId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-purchases-pending-with-item', familyId],
    queryFn: async (): Promise<RewardShopPurchaseWithItem[]> => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_shop_purchases')
        .select('*, reward_shop_items(image_url, image_asset_key)')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as RewardShopPurchaseWithItem[]
    },
    enabled: !!familyId,
    staleTime: 10_000,
  })
}

/** Full purchase history for a family — Shop tab history list. */
export function useRewardShopPurchaseHistory(familyId: string | undefined) {
  return useQuery({
    queryKey: ['reward-shop-purchases-history', familyId],
    queryFn: async (): Promise<RewardShopPurchase[]> => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_shop_purchases')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as RewardShopPurchase[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

// ─── Purchases — write (via RPC only) ──────────────────────────────────────

export function usePurchaseRewardShopItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { itemId: string; memberId: string; familyId: string; actedBy?: string | null }) => {
      const { data, error } = await supabase.rpc('purchase_reward_shop_item', {
        p_item_id: params.itemId,
        p_member_id: params.memberId,
        p_acted_by: params.actedBy ?? null,
      })
      if (error) throw error
      return { ...(data as PurchaseRewardShopItemResult), familyId: params.familyId, memberId: params.memberId }
    },
    onSuccess: (result) => {
      invalidateRewardShopQueries(qc, { familyId: result.familyId, memberId: result.memberId })
    },
  })
}

export function useResolveRewardShopPurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      purchaseId: string
      action: 'approve' | 'decline'
      declineNote?: string
      processedBy: string
      familyId: string
      memberId: string
    }) => {
      const { data, error } = await supabase.rpc('resolve_reward_shop_purchase', {
        p_purchase_id: params.purchaseId,
        p_action: params.action,
        p_decline_note: params.declineNote ?? null,
        p_processed_by: params.processedBy,
      })
      if (error) throw error
      return { ...(data as ResolveRewardShopPurchaseResult), familyId: params.familyId, memberId: params.memberId }
    },
    onSuccess: (result) => {
      invalidateRewardShopQueries(qc, { familyId: result.familyId, memberId: result.memberId })
    },
  })
}

export function useCancelRewardShopPurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { purchaseId: string; familyId: string; memberId: string }) => {
      const { data, error } = await supabase.rpc('cancel_reward_shop_purchase', {
        p_purchase_id: params.purchaseId,
      })
      if (error) throw error
      return { ...(data as CancelRewardShopPurchaseResult), familyId: params.familyId, memberId: params.memberId }
    },
    onSuccess: (result) => {
      invalidateRewardShopQueries(qc, { familyId: result.familyId, memberId: result.memberId })
    },
  })
}

// ─── Unlock-gate percentage (rolling 7-day window, addendum §6.4) ──────────

function localIsoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Client-side day math here is DISPLAY-ONLY (a progress bar's rough shape
 * while the item list loads) — the actual gate enforcement re-derives the
 * family-local window server-side inside purchase_reward_shop_item via
 * public.family_today(), never trusting this client date (Convention #257).
 */
export function useMemberCompletionPercentage(memberId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['reward-shop-completion-pct', memberId],
    queryFn: async (): Promise<number> => {
      if (!memberId) return 100
      const { data, error } = await supabase.rpc('member_completion_percentage', {
        p_member_id: memberId,
        p_period_start: localIsoDaysAgo(6),
        p_period_end: localIsoDaysAgo(0),
      })
      if (error) throw error
      return (data as number) ?? 100
    },
    enabled: enabled && !!memberId,
    staleTime: 60_000,
  })
}
