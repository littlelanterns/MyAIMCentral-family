// PRD-43 WishLists — Gift Planning & In-Store Capture. Hooks for the
// canonical per-member wishlist, mom's hidden gift-ideas lists, and gift
// claims. Phase A scope: wishlist item CRUD, gift_ideas lazy-create,
// Considering-copy with provenance, claim controls (Reserve/Purchased/Given).
// Phase B adds wishlist_share_links + gift_history hooks.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { List, ListItem, WishlistItemState } from '@/types/lists'
import type { GiftClaim, GiftClaimStatus } from '@/types/wishlists'

// ─── The canonical per-member wishlist ─────────────────────────────────────

/** Finds the member's canonical wishlist, lazily creating one if it doesn't exist yet. */
export function useEnsureWishlist() {
  return useMutation({
    mutationFn: async ({ familyId, memberId }: { familyId: string; memberId: string }): Promise<List> => {
      const { data: existing, error: findErr } = await supabase
        .from('lists')
        .select('*')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'wishlist')
        .is('archived_at', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (findErr) throw findErr
      if (existing) return existing as List

      const { data: created, error: createErr } = await supabase
        .from('lists')
        .insert({
          family_id: familyId,
          owner_id: memberId,
          title: 'My Wish List',
          list_type: 'wishlist',
          is_included_in_ai: true,
        })
        .select()
        .single()
      if (createErr) throw createErr
      return created as List
    },
  })
}

/** All active + dormant wishlist items for a member's canonical wishlist (received items excluded by default). */
export function useWishlistItems(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist-items', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data: list } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'wishlist')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()
      if (!list) return []

      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .is('archived_at', null)
        .neq('wishlist_state', 'received')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export interface CreateWishlistItemInput {
  familyId: string
  memberId: string
  addedBy: string
  content: string
  imageUrl?: string | null
  resourceUrl?: string | null
  price?: number | null
  currency?: string | null
  notes?: string | null
}

/**
 * WishCatch's core save (PRD §6.1). The 5-second capture contract: nothing
 * blocks on this call returning — the caller has already shown the item in
 * the UI optimistically before this resolves. Ensures the wishlist exists,
 * then inserts with wishlist_state='active' + is_included_in_ai=true +
 * added_by attribution, always.
 */
export function useCreateWishlistItem() {
  const queryClient = useQueryClient()
  const ensureWishlist = useEnsureWishlist()

  return useMutation({
    mutationFn: async (input: CreateWishlistItemInput): Promise<ListItem> => {
      const list = await ensureWishlist.mutateAsync({ familyId: input.familyId, memberId: input.memberId })

      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: list.id,
          content: input.content,
          image_url: input.imageUrl ?? null,
          resource_url: input.resourceUrl ?? null,
          price: input.price ?? null,
          currency: input.currency ?? 'USD',
          notes: input.notes ?? null,
          wishlist_state: 'active',
          is_included_in_ai: true,
          added_by: input.addedBy,
          sort_order: 0,
        })
        .select()
        .single()
      if (error) throw error
      return data as ListItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items', variables.familyId, variables.memberId] })
    },
  })
}

/** Generic wishlist item field update (refine sheet: title/notes/price/URL/occasion/priority/Heart/state/exclude). */
export function useUpdateWishlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id, familyId, memberId, ...updates
    }: { id: string; familyId: string; memberId: string } & Partial<ListItem>) => {
      const { error } = await supabase.from('list_items').update(updates).eq('id', id)
      if (error) throw error
      return { familyId, memberId }
    },
    onSuccess: ({ familyId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items', familyId, memberId] })
      queryClient.invalidateQueries({ queryKey: ['gift-ideas-items'] })
    },
  })
}

/** "Changed my mind" → dormant (reversible, celebration-only copy, never deletes). */
export function useSetWishlistItemState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId, memberId, state }: { id: string; familyId: string; memberId: string; state: WishlistItemState }) => {
      const { error } = await supabase.from('list_items').update({ wishlist_state: state }).eq('id', id)
      if (error) throw error
      return { familyId, memberId }
    },
    onSuccess: ({ familyId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items', familyId, memberId] })
    },
  })
}

export function useReorderWishlistItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ items }: { items: { id: string; sort_order: number }[]; familyId: string; memberId: string }) => {
      await Promise.all(items.map(({ id, sort_order }) => supabase.from('list_items').update({ sort_order }).eq('id', id)))
      return items
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items', variables.familyId, variables.memberId] })
    },
  })
}

/** Dormant items for a member's wishlist ("maybe-later pile", reversible). */
export function useDormantWishlistItems(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist-items-dormant', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data: list } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('owner_id', memberId)
        .eq('list_type', 'wishlist')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()
      if (!list) return []
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .eq('wishlist_state', 'dormant')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!familyId && !!memberId,
  })
}

// ─── Mom's hidden gift-ideas list (§6.4) ────────────────────────────────────

/** Finds mom's gift-ideas list for a subject member, lazily creating one on first use. */
export function useEnsureGiftIdeasList() {
  return useMutation({
    mutationFn: async ({
      familyId, ownerId, subjectMemberId, subjectName,
    }: { familyId: string; ownerId: string; subjectMemberId: string; subjectName: string }): Promise<List> => {
      const { data: existing, error: findErr } = await supabase
        .from('lists')
        .select('*')
        .eq('family_id', familyId)
        .eq('subject_member_id', subjectMemberId)
        .eq('list_type', 'gift_ideas')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()
      if (findErr) throw findErr
      if (existing) return existing as List

      const { data: created, error: createErr } = await supabase
        .from('lists')
        .insert({
          family_id: familyId,
          owner_id: ownerId,
          subject_member_id: subjectMemberId,
          title: `Gift Ideas for ${subjectName}`,
          list_type: 'gift_ideas',
        })
        .select()
        .single()
      if (createErr) throw createErr
      return created as List
    },
  })
}

export function useGiftIdeasItems(familyId: string | undefined, subjectMemberId: string | undefined) {
  return useQuery({
    queryKey: ['gift-ideas-items', familyId, subjectMemberId],
    queryFn: async () => {
      if (!familyId || !subjectMemberId) return []
      const { data: list } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('subject_member_id', subjectMemberId)
        .eq('list_type', 'gift_ideas')
        .is('archived_at', null)
        .limit(1)
        .maybeSingle()
      if (!list) return []
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!familyId && !!subjectMemberId,
  })
}

/** Mom's WishCatch capture directly into a kid's gift-ideas list (own idea, not copied from the kid's list). */
export function useCreateGiftIdeaItem() {
  const queryClient = useQueryClient()
  const ensureList = useEnsureGiftIdeasList()

  return useMutation({
    mutationFn: async (input: {
      familyId: string; ownerId: string; subjectMemberId: string; subjectName: string
      content: string; imageUrl?: string | null; resourceUrl?: string | null
      price?: number | null; currency?: string | null; notes?: string | null
    }): Promise<ListItem> => {
      const list = await ensureList.mutateAsync({
        familyId: input.familyId, ownerId: input.ownerId,
        subjectMemberId: input.subjectMemberId, subjectName: input.subjectName,
      })
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: list.id,
          content: input.content,
          image_url: input.imageUrl ?? null,
          resource_url: input.resourceUrl ?? null,
          price: input.price ?? null,
          currency: input.currency ?? 'USD',
          notes: input.notes ?? null,
          added_by: input.ownerId,
          sort_order: 0,
        })
        .select()
        .single()
      if (error) throw error
      return data as ListItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gift-ideas-items', variables.familyId, variables.subjectMemberId] })
    },
  })
}

/**
 * "Consider for gift" (§6.4) — copies a wishlist item into the subject's
 * gift-ideas list as a SNAPSHOT (source_list_item_id provenance). The kid may
 * later edit/dormant their original; mom's considering-copy persists
 * independently.
 */
export function useConsiderForGift() {
  const queryClient = useQueryClient()
  const ensureList = useEnsureGiftIdeasList()

  return useMutation({
    mutationFn: async (input: {
      familyId: string; ownerId: string; subjectMemberId: string; subjectName: string
      sourceItem: ListItem
    }): Promise<ListItem> => {
      const list = await ensureList.mutateAsync({
        familyId: input.familyId, ownerId: input.ownerId,
        subjectMemberId: input.subjectMemberId, subjectName: input.subjectName,
      })
      const { data, error } = await supabase
        .from('list_items')
        .insert({
          list_id: list.id,
          content: input.sourceItem.content,
          image_url: input.sourceItem.image_url,
          resource_url: input.sourceItem.resource_url,
          price: input.sourceItem.price,
          currency: input.sourceItem.currency ?? 'USD',
          notes: input.sourceItem.notes,
          occasion_tags: input.sourceItem.occasion_tags,
          added_by: input.ownerId,
          source_list_item_id: input.sourceItem.id,
          sort_order: 0,
        })
        .select()
        .single()
      if (error) throw error
      return data as ListItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gift-ideas-items', variables.familyId, variables.subjectMemberId] })
    },
  })
}

/** True if any Considering-copy already references this source wishlist item (duplicate-Consider guard for the UI). */
export function useIsConsideredForGift(familyId: string | undefined, sourceItemId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist-item-considered', familyId, sourceItemId],
    queryFn: async () => {
      if (!familyId || !sourceItemId) return false
      const { count, error } = await supabase
        .from('list_items')
        .select('id', { count: 'exact', head: true })
        .eq('source_list_item_id', sourceItemId)
        .is('archived_at', null)
      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!familyId && !!sourceItemId,
  })
}

// ─── Gift claims (§5.2, §6.4, §6.5) ─────────────────────────────────────────

/** Claims for a set of list_item ids (the original wishlist items, never the Considering copies). */
export function useGiftClaimsForItems(itemIds: string[]) {
  return useQuery({
    queryKey: ['gift-claims', ...itemIds.slice().sort()],
    queryFn: async () => {
      if (itemIds.length === 0) return [] as GiftClaim[]
      const { data, error } = await supabase
        .from('gift_claims')
        .select('*')
        .in('list_item_id', itemIds)
        .is('released_at', null)
      if (error) throw error
      return data as GiftClaim[]
    },
    enabled: itemIds.length > 0,
  })
}

export function useCreateGiftClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      familyId: string; listItemId: string; itemTitleSnapshot: string
      claimedByMemberId: string; status?: GiftClaimStatus
    }) => {
      const { data, error } = await supabase
        .from('gift_claims')
        .insert({
          family_id: input.familyId,
          list_item_id: input.listItemId,
          item_title_snapshot: input.itemTitleSnapshot,
          claimed_by_member_id: input.claimedByMemberId,
          status: input.status ?? 'reserved',
        })
        .select()
        .single()
      if (error) throw error
      return data as GiftClaim
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-claims'] })
    },
  })
}

export function useUpdateGiftClaimStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GiftClaimStatus }) => {
      const { error } = await supabase.from('gift_claims').update({ status }).eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-claims'] })
    },
  })
}

export function useReleaseGiftClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gift_claims').update({ released_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-claims'] })
    },
  })
}
