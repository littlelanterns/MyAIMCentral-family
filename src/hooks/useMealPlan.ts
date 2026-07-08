/**
 * useMealPlan — PRD-42 KitchenCompass
 *
 * CRUD for meal_plan_entries: This Week plan surface, drag-drop persistence,
 * mark-made + follow-up strip (leftovers / kids-helped / homeschool minutes /
 * victory — PRD §12.1-3 fold-ins), and the send-to-shopping-list handoff.
 *
 * `entry_date` is a user-chosen PLANNING date — deliberately exempt from
 * Convention #257 trigger derivation (it is not "today"). Reads that need
 * "today/tonight" go through `useFamilyToday` at the call site, not here.
 */

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { fetchFamilyToday } from '@/hooks/useFamilyToday'
import type { MealPlanEntry, MealPlanEntryWithRecipe, MealSlot, RecipeIngredient } from '@/types/meals'

export function invalidateMealPlanQueries(qc: QueryClient, familyId?: string) {
  qc.invalidateQueries({
    predicate: (query) =>
      typeof query.queryKey[0] === 'string' && (query.queryKey[0] as string).startsWith('meal-plan'),
  })
  if (familyId) qc.invalidateQueries({ queryKey: ['recipes', familyId] })
}

// ─── Read: entries for a date range (week/day/month views) ─────────────────

export function useMealPlanEntries(familyId: string | undefined, startDate: string | undefined, endDate: string | undefined) {
  return useQuery({
    queryKey: ['meal-plan-entries', familyId, startDate, endDate],
    queryFn: async () => {
      if (!familyId || !startDate || !endDate) return []
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .select('*, recipe:recipes(id, title, photo_urls, effort_level, equipment_tags, total_minutes, ingredients, servings_base)')
        .eq('family_id', familyId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as MealPlanEntryWithRecipe[]
    },
    enabled: !!familyId && !!startDate && !!endDate,
    staleTime: 10_000,
  })
}

export function useMealPlanEntry(entryId: string | undefined) {
  return useQuery({
    queryKey: ['meal-plan-entry', entryId],
    queryFn: async () => {
      if (!entryId) return null
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .select('*, recipe:recipes(id, title, photo_urls, effort_level, equipment_tags, total_minutes, ingredients, instructions, servings_base)')
        .eq('id', entryId)
        .single()
      if (error) throw error
      return data as unknown as MealPlanEntryWithRecipe
    },
    enabled: !!entryId,
  })
}

// ─── Create ──────────────────────────────────────────────────────────────

export interface CreateMealPlanEntryParams {
  familyId: string
  createdBy: string
  entryDate: string
  mealSlot: MealSlot
  customSlotLabel?: string | null
  recipeId?: string | null
  recipeVersionId?: string | null
  titleSnapshot: string
  servingsPlanned?: number | null
  cookMemberId?: string | null
  notes?: string | null
}

export function useCreateMealPlanEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateMealPlanEntryParams) => {
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          entry_date: params.entryDate,
          meal_slot: params.mealSlot,
          custom_slot_label: params.customSlotLabel ?? null,
          recipe_id: params.recipeId ?? null,
          recipe_version_id: params.recipeVersionId ?? null,
          title_snapshot: params.titleSnapshot,
          servings_planned: params.servingsPlanned ?? null,
          cook_member_id: params.cookMemberId ?? null,
          notes: params.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as MealPlanEntry
    },
    onSuccess: (entry) => invalidateMealPlanQueries(qc, entry.family_id),
  })
}

// ─── Move (drag-drop persistence) ───────────────────────────────────────────

export function useMoveMealPlanEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; entryDate: string; mealSlot: MealSlot }) => {
      const { error } = await supabase
        .from('meal_plan_entries')
        .update({ entry_date: params.entryDate, meal_slot: params.mealSlot })
        .eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

// ─── Update (full — entry sheet edits) ──────────────────────────────────────

export function useUpdateMealPlanEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; updates: Partial<MealPlanEntry> }) => {
      const { error } = await supabase.from('meal_plan_entries').update(params.updates).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

// ─── Mark made / didn't happen / assign cook / kids helped ─────────────────
// These fields are updatable by any adult (or a teen who's the entry's cook)
// without the meal_planning grant — enforced by the field-scoped BEFORE
// UPDATE trigger (enforce_meal_plan_entry_edit_scope, migration 100291).

export function useMarkMealMade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; recipeId: string | null; currentTimesMade?: number }) => {
      const { error } = await supabase
        .from('meal_plan_entries')
        .update({ status: 'made', made_at: new Date().toISOString() })
        .eq('id', params.id)
      if (error) throw error

      if (params.recipeId) {
        const { data: recipe } = await supabase.from('recipes').select('times_made').eq('id', params.recipeId).single()
        if (recipe) {
          await supabase.from('recipes').update({ times_made: (recipe.times_made ?? 0) + 1 }).eq('id', params.recipeId)
        }
      }
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

export function useMarkMealDidntHappen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase.from('meal_plan_entries').update({ status: 'skipped' }).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

export function useAssignCook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; cookMemberId: string | null }) => {
      const { error } = await supabase.from('meal_plan_entries').update({ cook_member_id: params.cookMemberId }).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

export function useSetKidsHelped() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; kidsHelpedMemberIds: string[] }) => {
      const { error } = await supabase
        .from('meal_plan_entries')
        .update({ kids_helped_member_ids: params.kidsHelpedMemberIds })
        .eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

/** Follow-up strip: "Plan leftovers tomorrow?" — creates a freeform next-day entry. */
export function useCreateLeftoverEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; createdBy: string; sourceTitle: string; nextDate: string; mealSlot: MealSlot }) => {
      const { data, error } = await supabase
        .from('meal_plan_entries')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          entry_date: params.nextDate,
          meal_slot: params.mealSlot,
          title_snapshot: `Leftovers: ${params.sourceTitle}`,
        })
        .select()
        .single()
      if (error) throw error
      return data as MealPlanEntry
    },
    onSuccess: (entry) => invalidateMealPlanQueries(qc, entry.family_id),
  })
}

/**
 * Follow-up strip: "Kids helped?" → optional homeschool minutes prompt
 * (PRD §12.1 — cooking counts for homeschool, home-ec subject, event-log
 * write / numerator, never an inline obligations derivation).
 */
const HOME_EC_SUBJECT_NAME = 'Home Economics'

/** Finds the family's "Home Economics" homeschool_subjects row, creating it on first use. */
async function findOrCreateHomeEcSubject(familyId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('homeschool_subjects')
    .select('id')
    .eq('family_id', familyId)
    .ilike('name', HOME_EC_SUBJECT_NAME)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('homeschool_subjects')
    .insert({ family_id: familyId, name: HOME_EC_SUBJECT_NAME, icon_key: 'ChefHat' })
    .select('id')
    .single()
  if (error) throw error
  return created.id
}

export function useLogCookingHomeschoolMinutes() {
  return useMutation({
    mutationFn: async (params: { familyId: string; memberId: string; minutes: number; description: string; approvedBy?: string | null }) => {
      const [logDate, subjectId] = await Promise.all([
        fetchFamilyToday(params.memberId),
        findOrCreateHomeEcSubject(params.familyId),
      ])
      const { error } = await supabase.from('homeschool_time_logs').insert({
        family_id: params.familyId,
        family_member_id: params.memberId,
        subject_id: subjectId,
        log_date: logDate,
        minutes_logged: params.minutes,
        allocation_mode_used: 'full',
        source: 'manual_entry',
        description: params.description,
        status: params.approvedBy ? 'confirmed' : 'pending',
        approved_by: params.approvedBy ?? null,
        approved_at: params.approvedBy ? new Date().toISOString() : null,
      })
      if (error) throw error
    },
  })
}

/** First-solo-dinner / cooking-milestone Victory (PRD §12.3, source='meal_made'). */
export function useCreateMealVictory() {
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      memberType: 'adult' | 'teen' | 'guided' | 'play' | 'child'
      description: string
      celebrationText?: string | null
      sourceReferenceId: string
    }) => {
      const { error } = await supabase.from('victories').insert({
        family_id: params.familyId,
        family_member_id: params.memberId,
        member_type: params.memberType,
        description: params.description,
        celebration_text: params.celebrationText ?? null,
        life_area_tag: 'family',
        source: 'meal_made',
        source_reference_id: params.sourceReferenceId,
      })
      if (error) throw error
    },
  })
}

export function useDeleteMealPlanEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase.from('meal_plan_entries').delete().eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateMealPlanQueries(qc, familyId),
  })
}

// ─── Send to shopping list ───────────────────────────────────────────────────
// Multiplies each entry's ingredients by servings_planned/servings_base and
// writes through the EXISTING list_items pipeline (ruling 2 — no parallel
// grocery machinery). Provenance goes in list_items.notes.

export interface ShoppingHandoffIngredient extends RecipeIngredient {
  scaledQuantity: number | null
  sourceRecipeTitle: string
  sourceEntryDate: string
}

export function useSendIngredientsToShoppingList() {
  return useMutation({
    mutationFn: async (params: { listId: string; items: ShoppingHandoffIngredient[] }) => {
      if (params.items.length === 0) return { count: 0 }
      const { error } = await supabase.from('list_items').insert(
        params.items.map((item) => ({
          list_id: params.listId,
          content: item.item,
          item_name: item.item,
          quantity: item.scaledQuantity,
          quantity_unit: item.unit,
          category: item.store_category,
          notes: `for ${item.sourceRecipeTitle} · ${item.sourceEntryDate}`,
        })),
      )
      if (error) throw error
      return { count: params.items.length }
    },
  })
}
