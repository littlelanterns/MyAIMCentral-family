/**
 * useFamilyBestIntentions — PRD-14D Family Hub
 *
 * CRUD for family_best_intentions + family_intention_iterations.
 * Family-level intentions with per-member tally tracking.
 * Separate from personal best_intentions (PRD-06).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso } from '@/utils/dates'
import { useFamilyToday } from './useFamilyToday'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FamilyBestIntention {
  id: string
  family_id: string
  created_by_member_id: string
  title: string
  description: string | null
  participating_member_ids: string[]
  require_pin_to_tally: boolean
  is_active: boolean
  is_included_in_ai: boolean
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilyIntentionIteration {
  id: string
  family_id: string
  intention_id: string
  member_id: string
  day_date: string
  created_at: string
}

// ─── Read active intentions ─────────────────────────────────────────────────

export function useFamilyBestIntentions(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-best-intentions', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('family_best_intentions')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as FamilyBestIntention[]
    },
    enabled: !!familyId,
  })
}

// ─── Read ALL intentions (including inactive, for settings) ─────────────────

export function useAllFamilyBestIntentions(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-best-intentions-all', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('family_best_intentions')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as FamilyBestIntention[]
    },
    enabled: !!familyId,
  })
}

// ─── Create intention ───────────────────────────────────────────────────────

export function useCreateFamilyBestIntention() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      createdByMemberId: string
      title: string
      description?: string
      participatingMemberIds: string[]
      requirePinToTally?: boolean
    }) => {
      const { data, error } = await supabase
        .from('family_best_intentions')
        .insert({
          family_id: params.familyId,
          created_by_member_id: params.createdByMemberId,
          title: params.title,
          description: params.description ?? null,
          participating_member_ids: params.participatingMemberIds,
          require_pin_to_tally: params.requirePinToTally ?? false,
        })
        .select()
        .single()
      if (error) throw error
      return data as FamilyBestIntention
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['family-best-intentions', data.family_id] })
      qc.invalidateQueries({ queryKey: ['family-best-intentions-all', data.family_id] })
    },
  })
}

// ─── Update intention ───────────────────────────────────────────────────────

export function useUpdateFamilyBestIntention() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      familyId: string
      title?: string
      description?: string | null
      participatingMemberIds?: string[]
      requirePinToTally?: boolean
      isActive?: boolean
      isIncludedInAi?: boolean
      sortOrder?: number
    }) => {
      const updates: Record<string, unknown> = {}
      if (params.title !== undefined) updates.title = params.title
      if (params.description !== undefined) updates.description = params.description
      if (params.participatingMemberIds !== undefined) updates.participating_member_ids = params.participatingMemberIds
      if (params.requirePinToTally !== undefined) updates.require_pin_to_tally = params.requirePinToTally
      if (params.isActive !== undefined) updates.is_active = params.isActive
      if (params.isIncludedInAi !== undefined) updates.is_included_in_ai = params.isIncludedInAi
      if (params.sortOrder !== undefined) updates.sort_order = params.sortOrder

      const { data, error } = await supabase
        .from('family_best_intentions')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      return data as FamilyBestIntention
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['family-best-intentions', data.family_id] })
      qc.invalidateQueries({ queryKey: ['family-best-intentions-all', data.family_id] })
    },
  })
}

// ─── Archive intention ──────────────────────────────────────────────────────

export function useArchiveFamilyBestIntention() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('family_best_intentions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['family-best-intentions', vars.familyId] })
      qc.invalidateQueries({ queryKey: ['family-best-intentions-all', vars.familyId] })
    },
  })
}

// ─── Today's iterations (tallies) ───────────────────────────────────────────

// Row 184 NEW-DD Path 2: `memberId` drives server-side family-timezone lookup
// via useFamilyToday so viewing-device clock misconfiguration doesn't hide rows.
// Any valid family member id resolves to the family's timezone.
export function useTodayFamilyIterations(
  familyId: string | undefined,
  memberId: string | undefined,
) {
  const { data: today } = useFamilyToday(memberId)

  return useQuery({
    queryKey: ['family-intention-iterations', familyId, today],
    queryFn: async () => {
      if (!familyId || !today) return []
      const { data, error } = await supabase
        .from('family_intention_iterations')
        .select('*')
        .eq('family_id', familyId)
        .eq('day_date', today)
      if (error) throw error
      return (data ?? []) as FamilyIntentionIteration[]
    },
    enabled: !!familyId && !!today,
    refetchInterval: 30_000,
  })
}

// ─── Log a tally ────────────────────────────────────────────────────────────

export function useLogFamilyIntentionTally() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      intentionId: string
      memberId: string
    }) => {
      const { data, error } = await supabase
        .from('family_intention_iterations')
        .insert({
          family_id: params.familyId,
          intention_id: params.intentionId,
          member_id: params.memberId,
          day_date: todayLocalIso(),
        })
        .select()
        .single()
      if (error) throw error
      return data as FamilyIntentionIteration
    },
    onMutate: async (vars) => {
      // Optimistic update: add a fake iteration to the cache
      const today = todayLocalIso()
      const key = ['family-intention-iterations', vars.familyId, today]
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<FamilyIntentionIteration[]>(key) ?? []
      const optimistic: FamilyIntentionIteration = {
        id: crypto.randomUUID(),
        family_id: vars.familyId,
        intention_id: vars.intentionId,
        member_id: vars.memberId,
        day_date: today,
        created_at: new Date().toISOString(),
      }
      qc.setQueryData(key, [...prev, optimistic])
      return { prev, key }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev)
    },
    onSettled: (_data, _err, vars) => {
      const today = todayLocalIso()
      qc.invalidateQueries({ queryKey: ['family-intention-iterations', vars.familyId, today] })
    },
  })
}
