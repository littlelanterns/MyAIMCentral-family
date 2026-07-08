/**
 * useFoodProfiles — PRD-42 KitchenCompass
 *
 * food_restrictions (hard safety constraints — always-include inversion,
 * D-42-4, no is_included_in_ai column, never gated behind any toggle) and
 * meal_settings (one row per family, auto-provisioned).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { FoodRestriction, FoodRestrictionType, FoodRestrictionSeverity, MealSettings, MealSlot } from '@/types/meals'

// ─── food_restrictions ──────────────────────────────────────────────────────

export function useFoodRestrictions(familyId: string | undefined) {
  return useQuery({
    queryKey: ['food-restrictions', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('food_restrictions')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as FoodRestriction[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

export interface CreateFoodRestrictionParams {
  familyId: string
  createdBy: string
  memberId: string | null
  restrictionType: FoodRestrictionType
  item: string
  severity: FoodRestrictionSeverity
  notes?: string | null
}

export function useCreateFoodRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateFoodRestrictionParams) => {
      const { data, error } = await supabase
        .from('food_restrictions')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          member_id: params.memberId,
          restriction_type: params.restrictionType,
          item: params.item,
          severity: params.severity,
          notes: params.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as FoodRestriction
    },
    onSuccess: (row) => qc.invalidateQueries({ queryKey: ['food-restrictions', row.family_id] }),
  })
}

export function useUpdateFoodRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; updates: Partial<FoodRestriction> }) => {
      const { error } = await supabase.from('food_restrictions').update(params.updates).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => qc.invalidateQueries({ queryKey: ['food-restrictions', familyId] }),
  })
}

export function useDeleteFoodRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase.from('food_restrictions').delete().eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => qc.invalidateQueries({ queryKey: ['food-restrictions', familyId] }),
  })
}

// ─── meal_settings ───────────────────────────────────────────────────────────

export function useMealSettings(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meal-settings', familyId],
    queryFn: async () => {
      if (!familyId) return null
      const { data, error } = await supabase.from('meal_settings').select('*').eq('family_id', familyId).single()
      if (error) throw error
      return data as MealSettings
    },
    enabled: !!familyId,
    staleTime: 30_000,
  })
}

export function useUpdateMealSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; updates: Partial<MealSettings> }) => {
      const { error } = await supabase.from('meal_settings').update(params.updates).eq('family_id', params.familyId)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => qc.invalidateQueries({ queryKey: ['meal-settings', familyId] }),
  })
}

export function useAddMealSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; currentSlots: MealSlot[]; slot: MealSlot }) => {
      if (params.currentSlots.includes(params.slot)) return params
      const { error } = await supabase
        .from('meal_settings')
        .update({ enabled_slots: [...params.currentSlots, params.slot] })
        .eq('family_id', params.familyId)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => qc.invalidateQueries({ queryKey: ['meal-settings', familyId] }),
  })
}
