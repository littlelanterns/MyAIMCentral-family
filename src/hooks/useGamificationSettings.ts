/**
 * useGamificationSettings — Build M Phase 4
 *
 * Hooks for reading/writing gamification configuration:
 *   - useGamificationConfig: reads gamification_configs for a member
 *   - useUpdateGamificationConfig: writes to gamification_configs
 *   - useUpdateStickerBookEarning: writes earning mode columns on member_sticker_book_state
 *   - useResetStickerBook: clears creatures + pages, resets counters
 *   - useCreateColoringReveal: creates a member_coloring_reveals row
 *   - useDeleteColoringReveal: removes a member_coloring_reveals row
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  CreatureEarningMode,
  PageEarningMode,
  RevealStepCount,
  LineartPreference,
} from '@/types/play-dashboard'

// ── Types ───────────────────────────────────────────────────────────

export interface GamificationConfig {
  id: string
  family_id: string
  family_member_id: string
  enabled: boolean
  currency_name: string
  currency_icon: string
  base_points_per_task: number
  bonus_at_three: number
  bonus_at_five: number
  routine_points_mode: string
  streak_grace_days: number
  streak_schedule_aware: boolean
  streak_pause_enabled: boolean
  streak_paused: boolean
  visualization_mode: string
  created_at: string
  updated_at: string
}

// ── Read gamification_configs ───────────────────────────────────────

export function useGamificationConfig(familyMemberId: string | undefined) {
  return useQuery<GamificationConfig | null>({
    queryKey: ['gamification-config', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return null

      const { data, error } = await supabase
        .from('gamification_configs')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .maybeSingle()

      if (error) {
        console.error('useGamificationConfig query failed:', error)
        return null
      }

      return (data as GamificationConfig) ?? null
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}

// ── Update gamification_configs ─────────────────────────────────────

interface UpdateGamificationConfigInput {
  familyMemberId: string
  familyId: string
  enabled?: boolean
  base_points_per_task?: number
  currency_name?: string
  currency_icon?: string
}

export function useUpdateGamificationConfig() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateGamificationConfigInput) => {
      const { familyMemberId, familyId, ...updates } = input

      // Upsert — the row may not exist yet for newly-enabled members
      const { error } = await supabase
        .from('gamification_configs')
        .upsert(
          {
            family_member_id: familyMemberId,
            family_id: familyId,
            ...updates,
          },
          { onConflict: 'family_member_id' },
        )

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['gamification-config', vars.familyMemberId] })
    },
  })
}

// ── Update earning mode columns on member_sticker_book_state ────────

interface UpdateStickerBookEarningInput {
  familyMemberId: string
  creature_earning_mode?: CreatureEarningMode
  creature_earning_threshold?: number
  creature_earning_counter_resets?: boolean
  creature_earning_segment_ids?: string[]
  creature_roll_chance_per_task?: number
  page_earning_mode?: PageEarningMode
  page_unlock_interval?: number
  page_earning_completion_threshold?: number
  page_earning_tracker_widget_id?: string | null
  page_earning_tracker_threshold?: number
  randomizer_reveal_style?: 'show_upfront' | 'mystery_tap'
}

export function useUpdateStickerBookEarning() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateStickerBookEarningInput) => {
      const { familyMemberId, ...updates } = input

      const { error } = await supabase
        .from('member_sticker_book_state')
        .update(updates)
        .eq('family_member_id', familyMemberId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['sticker-book-state', vars.familyMemberId] })
    },
  })
}

// ── Toggle sticker book enabled/disabled ────────────────────────────

export function useToggleStickerBook() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { familyMemberId: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from('member_sticker_book_state')
        .update({ is_enabled: params.isEnabled })
        .eq('family_member_id', params.familyMemberId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['sticker-book-state', vars.familyMemberId] })
    },
  })
}

// ── Reset sticker book (clear creatures + pages, reset counters) ────

export function useResetStickerBook() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { familyMemberId: string }) => {
      // Delete creatures
      const { error: creaturesError } = await supabase
        .from('member_creature_collection')
        .delete()
        .eq('family_member_id', params.familyMemberId)

      if (creaturesError) throw creaturesError

      // Delete non-bootstrap page unlocks
      const { error: pagesError } = await supabase
        .from('member_page_unlocks')
        .delete()
        .eq('family_member_id', params.familyMemberId)
        .neq('unlocked_trigger_type', 'bootstrap')

      if (pagesError) throw pagesError

      // Reset counters on sticker book state
      const { error: stateError } = await supabase
        .from('member_sticker_book_state')
        .update({
          creatures_earned_total: 0,
          pages_unlocked_total: 1, // bootstrap page remains
          creature_earning_counter: 0,
          page_earning_completion_counter: 0,
        })
        .eq('family_member_id', params.familyMemberId)

      if (stateError) throw stateError
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['sticker-book-state', vars.familyMemberId] })
      qc.invalidateQueries({ queryKey: ['member-creatures', vars.familyMemberId] })
      qc.invalidateQueries({ queryKey: ['member-page-unlocks', vars.familyMemberId] })
    },
  })
}

// ── Create coloring reveal assignment ───────────────────────────────
// Coloring reveals are 1:1 task-linked visual tally counters.
// Each completion of the linked task = one reveal step.
// No earning mode picker — the task link IS the earning source.

interface CreateColoringRevealInput {
  family_id: string
  family_member_id: string
  coloring_image_id: string
  reveal_step_count: RevealStepCount
  earning_source_type: string
  earning_source_id: string
  lineart_preference?: LineartPreference
}

export function useCreateColoringReveal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateColoringRevealInput) => {
      const { data, error } = await supabase
        .from('member_coloring_reveals')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          coloring_image_id: input.coloring_image_id,
          reveal_step_count: input.reveal_step_count,
          earning_source_type: input.earning_source_type,
          earning_source_id: input.earning_source_id,
          earning_mode: 'every_n_completions', // 1:1 with task completion
          earning_threshold: 1,
          lineart_preference: input.lineart_preference ?? 'medium',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['member-coloring-reveals', vars.family_member_id] })
    },
  })
}

// ── Delete coloring reveal ──────────────────────────────────────────

export function useDeleteColoringReveal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { revealId: string; familyMemberId: string }) => {
      const { error } = await supabase
        .from('member_coloring_reveals')
        .update({ is_active: false })
        .eq('id', params.revealId)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['member-coloring-reveals', vars.familyMemberId] })
    },
  })
}

// ── Reset all coloring reveals ──────────────────────────────────────

export function useResetColoringReveals() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { familyMemberId: string }) => {
      const { error } = await supabase
        .from('member_coloring_reveals')
        .update({
          current_step: 0,
          revealed_zone_ids: [],
          earning_counter: 0,
          is_complete: false,
          completed_at: null,
        })
        .eq('family_member_id', params.familyMemberId)
        .eq('is_active', true)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['member-coloring-reveals', vars.familyMemberId] })
    },
  })
}
