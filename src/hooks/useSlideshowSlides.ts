/**
 * useSlideshowSlides — PRD-14D Phase B
 *
 * CRUD for slideshow_slides table.
 * Also generates auto-slides from family-level Guiding Stars when enabled.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export type SlideType = 'image_photo' | 'image_word_art' | 'text' | 'guiding_star_auto'

export interface SlideshowSlide {
  id: string
  family_id: string
  slide_type: SlideType
  image_url: string | null
  text_body: string | null
  source_guiding_star_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// ─── Read active slides ─────────────────────────────────────────────────────

export function useSlideshowSlides(familyId: string | undefined) {
  return useQuery({
    queryKey: ['slideshow-slides', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('slideshow_slides')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as SlideshowSlide[]
    },
    enabled: !!familyId,
  })
}

// ─── Read ALL slides (for settings management) ─────────────────────────────

export function useAllSlideshowSlides(familyId: string | undefined) {
  return useQuery({
    queryKey: ['slideshow-slides-all', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('slideshow_slides')
        .select('*')
        .eq('family_id', familyId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as SlideshowSlide[]
    },
    enabled: !!familyId,
  })
}

// ─── Create slide ───────────────────────────────────────────────────────────

export function useCreateSlideshowSlide() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      slideType: SlideType
      imageUrl?: string
      textBody?: string
      sourceGuidingStarId?: string
      sortOrder?: number
    }) => {
      const { data, error } = await supabase
        .from('slideshow_slides')
        .insert({
          family_id: params.familyId,
          slide_type: params.slideType,
          image_url: params.imageUrl ?? null,
          text_body: params.textBody ?? null,
          source_guiding_star_id: params.sourceGuidingStarId ?? null,
          sort_order: params.sortOrder ?? 0,
        })
        .select()
        .single()
      if (error) throw error
      return data as SlideshowSlide
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['slideshow-slides', data.family_id] })
      qc.invalidateQueries({ queryKey: ['slideshow-slides-all', data.family_id] })
    },
  })
}

// ─── Update slide ───────────────────────────────────────────────────────────

export function useUpdateSlideshowSlide() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      familyId: string
      textBody?: string
      sortOrder?: number
      isActive?: boolean
    }) => {
      const updates: Record<string, unknown> = {}
      if (params.textBody !== undefined) updates.text_body = params.textBody
      if (params.sortOrder !== undefined) updates.sort_order = params.sortOrder
      if (params.isActive !== undefined) updates.is_active = params.isActive

      const { data, error } = await supabase
        .from('slideshow_slides')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      return data as SlideshowSlide
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['slideshow-slides', data.family_id] })
      qc.invalidateQueries({ queryKey: ['slideshow-slides-all', data.family_id] })
    },
  })
}

// ─── Delete slide ───────────────────────────────────────────────────────────

export function useDeleteSlideshowSlide() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('slideshow_slides')
        .delete()
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['slideshow-slides', vars.familyId] })
      qc.invalidateQueries({ queryKey: ['slideshow-slides-all', vars.familyId] })
    },
  })
}

// ─── Guiding Stars for auto-feed ────────────────────────────────────────────

export interface GuidingStar {
  id: string
  content: string
  title: string | null
  entry_type: string
}

export function useFamilyGuidingStars(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-guiding-stars-slideshow', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('guiding_stars')
        .select('id, content, title, entry_type')
        .eq('family_id', familyId)
        .eq('owner_type', 'family')
        .eq('is_included_in_ai', true)
        .is('archived_at', null)
      if (error) throw error
      return (data ?? []) as GuidingStar[]
    },
    enabled: !!familyId,
  })
}
