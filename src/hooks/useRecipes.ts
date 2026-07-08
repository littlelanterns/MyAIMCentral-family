/**
 * useRecipes — PRD-42 KitchenCompass
 *
 * CRUD + search for recipes, recipe_versions, and meal_pointers ("how WE do
 * it" family know-how, D-42-6 rider). Every INSERT into `recipes` here is
 * called ONLY after the client-side HITM review card has been Approved
 * (Convention #4) — this hook layer does not itself gate that; the capture
 * flow components do.
 */

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  Recipe, RecipeVersion, MealPointer, MatchRecipesResult,
  RecipeIngredient, RecipeInstructionStep, RecipeEffortLevel, RecipeRotation, RecipeApprovalStatus,
  RecipeSourceType,
} from '@/types/meals'

export function invalidateRecipeQueries(qc: QueryClient, familyId?: string) {
  qc.invalidateQueries({
    predicate: (query) =>
      typeof query.queryKey[0] === 'string' && (query.queryKey[0] as string).startsWith('recipe'),
  })
  if (familyId) qc.invalidateQueries({ queryKey: ['meal-pointers', familyId] })
}

// ─── Read: Recipe Box list ──────────────────────────────────────────────────

export function useRecipes(familyId: string | undefined) {
  return useQuery({
    queryKey: ['recipes', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Recipe[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) return null
      const { data, error } = await supabase.from('recipes').select('*').eq('id', recipeId).single()
      if (error) throw error
      return data as Recipe
    },
    enabled: !!recipeId,
  })
}

/** Distinct members who've hearted this recipe (kid hearts strip, PRD §6.4). */
export function useRecipeHearts(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe-hearts', recipeId],
    queryFn: async () => {
      if (!recipeId) return []
      const { data, error } = await supabase
        .from('meal_feedback')
        .select('member_id')
        .eq('recipe_id', recipeId)
      if (error) throw error
      return Array.from(new Set((data ?? []).map((r) => r.member_id as string)))
    },
    enabled: !!recipeId,
  })
}

// ─── Read: semantic + keyword search ────────────────────────────────────────

export function useRecipeSemanticSearch(familyId: string | undefined, queryEmbedding: number[] | null) {
  return useQuery({
    queryKey: ['recipe-search', familyId, queryEmbedding],
    queryFn: async () => {
      if (!familyId || !queryEmbedding) return []
      const { data, error } = await supabase.rpc('match_recipes', {
        query_embedding: JSON.stringify(queryEmbedding),
        p_family_id: familyId,
        match_threshold: 0.25,
        match_count: 20,
      })
      if (error) throw error
      return (data ?? []) as MatchRecipesResult[]
    },
    enabled: !!familyId && !!queryEmbedding,
  })
}

// ─── Read: recipe versions ──────────────────────────────────────────────────

export function useRecipeVersions(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe-versions', recipeId],
    queryFn: async () => {
      if (!recipeId) return []
      const { data, error } = await supabase
        .from('recipe_versions')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as RecipeVersion[]
    },
    enabled: !!recipeId,
  })
}

// ─── Read: Family Pointers (recipe-specific + matching technique pointers) ──

export function useRecipePointers(familyId: string | undefined, recipeId: string | undefined) {
  return useQuery({
    queryKey: ['meal-pointers', familyId, recipeId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meal_pointers')
        .select('*')
        .eq('family_id', familyId)
        .eq('recipe_id', recipeId ?? '__none__')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as MealPointer[]
    },
    enabled: !!familyId && !!recipeId,
  })
}

/** All reusable technique pointers for the family (no recipe_id set) — used by Cook View matching. */
export function useTechniquePointers(familyId: string | undefined) {
  return useQuery({
    queryKey: ['meal-pointers-technique', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('meal_pointers')
        .select('*')
        .eq('family_id', familyId)
        .is('recipe_id', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as MealPointer[]
    },
    enabled: !!familyId,
  })
}

// ─── Create ──────────────────────────────────────────────────────────────

export interface CreateRecipeParams {
  familyId: string
  createdBy: string
  title: string
  description?: string | null
  sourceType: RecipeSourceType
  sourceUrl?: string | null
  photoUrls?: string[]
  ingredients: RecipeIngredient[]
  instructions: RecipeInstructionStep[]
  prepMinutes?: number | null
  cookMinutes?: number | null
  totalMinutes?: number | null
  servingsBase?: number | null
  effortLevel?: RecipeEffortLevel | null
  equipmentTags?: string[]
  tags?: string[]
  approvalStatus?: RecipeApprovalStatus
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateRecipeParams) => {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          title: params.title,
          description: params.description ?? null,
          source_type: params.sourceType,
          source_url: params.sourceUrl ?? null,
          photo_urls: params.photoUrls ?? [],
          ingredients: params.ingredients,
          instructions: params.instructions,
          prep_minutes: params.prepMinutes ?? null,
          cook_minutes: params.cookMinutes ?? null,
          total_minutes: params.totalMinutes ?? null,
          servings_base: params.servingsBase ?? null,
          effort_level: params.effortLevel ?? null,
          equipment_tags: params.equipmentTags ?? [],
          tags: params.tags ?? [],
          approval_status: params.approvalStatus ?? 'approved',
        })
        .select()
        .single()
      if (error) throw error
      return data as Recipe
    },
    onSuccess: (recipe) => invalidateRecipeQueries(qc, recipe.family_id),
  })
}

export function useUpdateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; updates: Partial<Recipe> }) => {
      const { error } = await supabase.from('recipes').update(params.updates).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

export function useSetRecipeRotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; rotation: RecipeRotation }) => {
      const { error } = await supabase.from('recipes').update({ rotation: params.rotation }).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

export function useToggleRecipeAiInclusion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; isIncluded: boolean }) => {
      const { error } = await supabase.from('recipes').update({ is_included_in_ai: params.isIncluded }).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

export function useApproveRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase.from('recipes').update({ approval_status: 'approved' }).eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

export function useArchiveRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

export function useIncrementTimesMade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string; currentTimesMade: number }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ times_made: params.currentTimesMade + 1 })
        .eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => invalidateRecipeQueries(qc, familyId),
  })
}

// ─── Recipe versions (scaling) ──────────────────────────────────────────────

export function useSaveRecipeVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      recipeId: string
      familyId: string
      createdBy: string
      label: string
      scaleFactor: number
      servings: number | null
      ingredients: RecipeIngredient[]
      notes?: string | null
    }) => {
      const { data, error } = await supabase
        .from('recipe_versions')
        .insert({
          recipe_id: params.recipeId,
          family_id: params.familyId,
          created_by: params.createdBy,
          label: params.label,
          scale_factor: params.scaleFactor,
          servings: params.servings,
          ingredients: params.ingredients,
          notes: params.notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as RecipeVersion
    },
    onSuccess: (version) => qc.invalidateQueries({ queryKey: ['recipe-versions', version.recipe_id] }),
  })
}

export function useDeleteRecipeVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; recipeId: string }) => {
      const { error } = await supabase.from('recipe_versions').delete().eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ recipeId }) => qc.invalidateQueries({ queryKey: ['recipe-versions', recipeId] }),
  })
}

// ─── Family Pointers ─────────────────────────────────────────────────────────

export function useCreatePointer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      createdBy: string
      recipeId?: string | null
      techniqueTag?: string | null
      text: string
      sortOrder?: number
    }) => {
      const { data, error } = await supabase
        .from('meal_pointers')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          recipe_id: params.recipeId ?? null,
          technique_tag: params.techniqueTag ?? null,
          text: params.text,
          sort_order: params.sortOrder ?? 0,
        })
        .select()
        .single()
      if (error) throw error
      return data as MealPointer
    },
    onSuccess: (pointer) => {
      qc.invalidateQueries({ queryKey: ['meal-pointers', pointer.family_id] })
      qc.invalidateQueries({ queryKey: ['meal-pointers-technique', pointer.family_id] })
    },
  })
}

export function useDeletePointer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase.from('meal_pointers').delete().eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => {
      qc.invalidateQueries({ queryKey: ['meal-pointers', familyId] })
      qc.invalidateQueries({ queryKey: ['meal-pointers-technique', familyId] })
    },
  })
}
