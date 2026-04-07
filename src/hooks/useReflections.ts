import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso } from '@/utils/dates'

// ─── Types ───────────────────────────────────────────────────

export type ReflectionCategory =
  | 'gratitude_joy' | 'growth_accountability' | 'identity_purpose'
  | 'relationships_service' | 'curiosity_discovery' | 'daily_life' | 'custom'

export type ReflectionSource = 'default' | 'custom' | 'lila_dynamic'

export interface ReflectionPrompt {
  id: string
  family_id: string
  member_id: string
  prompt_text: string
  original_text: string | null
  category: ReflectionCategory
  source: ReflectionSource
  is_ephemeral: boolean
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface ReflectionResponse {
  id: string
  family_id: string
  member_id: string
  prompt_id: string
  response_text: string
  response_date: string
  source_context: 'reflections_page' | 'evening_rhythm'
  journal_entry_id: string | null
  routed_destinations: Record<string, unknown>
  created_at: string
}

export interface ReflectionResponseWithPrompt extends ReflectionResponse {
  reflection_prompts: Pick<ReflectionPrompt, 'prompt_text' | 'category'>
}

export const REFLECTION_CATEGORIES: { value: ReflectionCategory; label: string }[] = [
  { value: 'gratitude_joy', label: 'Gratitude & Joy' },
  { value: 'growth_accountability', label: 'Growth & Accountability' },
  { value: 'identity_purpose', label: 'Identity & Purpose' },
  { value: 'relationships_service', label: 'Relationships & Service' },
  { value: 'curiosity_discovery', label: 'Curiosity & Discovery' },
  { value: 'daily_life', label: 'Daily Life' },
  { value: 'custom', label: 'Custom' },
]

const CATEGORY_TAGS: Record<ReflectionCategory, string[]> = {
  gratitude_joy: ['reflection', 'gratitude'],
  growth_accountability: ['reflection', 'growth'],
  identity_purpose: ['reflection', 'identity'],
  relationships_service: ['reflection', 'relationships'],
  curiosity_discovery: ['reflection', 'curiosity'],
  daily_life: ['reflection', 'daily'],
  custom: ['reflection'],
}

// ─── Default Prompts ─────────────────────────────────────────

interface DefaultPrompt {
  prompt_text: string
  category: ReflectionCategory
  sort_order: number
}

const DEFAULT_PROMPTS: DefaultPrompt[] = [
  // Gratitude & Joy (8)
  { prompt_text: 'What am I grateful for today?', category: 'gratitude_joy', sort_order: 1 },
  { prompt_text: 'What did I love about today?', category: 'gratitude_joy', sort_order: 2 },
  { prompt_text: 'What was a moment that inspired awe, wonder, or joy?', category: 'gratitude_joy', sort_order: 3 },
  { prompt_text: 'What made me laugh today?', category: 'gratitude_joy', sort_order: 4 },
  { prompt_text: 'What brought you joy recently?', category: 'gratitude_joy', sort_order: 5 },
  { prompt_text: 'What are you looking forward to?', category: 'gratitude_joy', sort_order: 6 },
  { prompt_text: 'What small moment today might I have overlooked that was actually a gift?', category: 'gratitude_joy', sort_order: 7 },
  { prompt_text: 'Who made my day better, and do they know it?', category: 'gratitude_joy', sort_order: 8 },

  // Growth & Accountability (7)
  { prompt_text: 'What obstacle did I face today, and what did I do to overcome it?', category: 'growth_accountability', sort_order: 9 },
  { prompt_text: 'How well did I attend to my duties today?', category: 'growth_accountability', sort_order: 10 },
  { prompt_text: 'Where did I fall short today, and what would I do differently?', category: 'growth_accountability', sort_order: 11 },
  { prompt_text: 'What goal did I make progress on?', category: 'growth_accountability', sort_order: 12 },
  { prompt_text: 'What did I do today that was hard but right?', category: 'growth_accountability', sort_order: 13 },
  { prompt_text: 'What did I avoid today that I know I need to face?', category: 'growth_accountability', sort_order: 14 },
  { prompt_text: 'What pattern did I notice in myself today?', category: 'growth_accountability', sort_order: 15 },

  // Identity & Purpose (4)
  { prompt_text: 'How did I move toward my divine identity or life purpose today?', category: 'identity_purpose', sort_order: 16 },
  { prompt_text: 'What would my future self thank me for today?', category: 'identity_purpose', sort_order: 17 },
  { prompt_text: 'When did I feel most like the person I\'m becoming?', category: 'identity_purpose', sort_order: 18 },
  { prompt_text: 'Which of my Guiding Stars showed up in my actions today?', category: 'identity_purpose', sort_order: 19 },

  // Relationships & Service (5)
  { prompt_text: 'What was a moment that made me appreciate another family member?', category: 'relationships_service', sort_order: 20 },
  { prompt_text: 'How did I serve today?', category: 'relationships_service', sort_order: 21 },
  { prompt_text: 'Who needed me today, and was I there?', category: 'relationships_service', sort_order: 22 },
  { prompt_text: 'What conversation today mattered most?', category: 'relationships_service', sort_order: 23 },
  { prompt_text: 'How did I make someone feel safe or seen?', category: 'relationships_service', sort_order: 24 },

  // Curiosity & Discovery (3)
  { prompt_text: 'What was something interesting I learned or discovered?', category: 'curiosity_discovery', sort_order: 25 },
  { prompt_text: 'What question is still on my mind from today?', category: 'curiosity_discovery', sort_order: 26 },
  { prompt_text: 'What did I see differently today than I would have a year ago?', category: 'curiosity_discovery', sort_order: 27 },

  // Kids-Specific (5)
  { prompt_text: 'What was the best part of your day?', category: 'daily_life', sort_order: 28 },
  { prompt_text: 'Was there a moment you were brave today?', category: 'daily_life', sort_order: 29 },
  { prompt_text: 'Did you help someone today? How?', category: 'daily_life', sort_order: 30 },
  { prompt_text: 'What\'s something you tried that was hard?', category: 'daily_life', sort_order: 31 },
  { prompt_text: 'If you could do one thing over, what would it be?', category: 'daily_life', sort_order: 32 },
]

// ─── Lazy Seed ───────────────────────────────────────────────

async function seedDefaultPrompts(familyId: string, memberId: string) {
  const rows = DEFAULT_PROMPTS.map(p => ({
    family_id: familyId,
    member_id: memberId,
    prompt_text: p.prompt_text,
    category: p.category,
    source: 'default' as const,
    sort_order: p.sort_order,
  }))
  const { error } = await supabase.from('reflection_prompts').insert(rows)
  if (error) throw error
}

// Local-date bug fix (2026-04-07, beta_glitch_reports 8dc4b2bd): all date
// strings in this file use `todayLocalIso()` from @/utils/dates. NEVER use
// `new Date().toISOString().split('T')[0]` — returns UTC, causes off-by-one
// bugs for users in negative-offset timezones during late-evening writes.

// ─── Queries ─────────────────────────────────────────────────

export function useReflectionPrompts(familyId: string | undefined, memberId: string | undefined) {
  const seededRef = useRef(false)

  return useQuery({
    queryKey: ['reflection-prompts', memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      const { data, error } = await supabase
        .from('reflection_prompts')
        .select('*')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (error) throw error

      // Lazy seed: if member has zero prompts, seed defaults
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true
        await seedDefaultPrompts(familyId, memberId)

        const { data: seeded, error: seedErr } = await supabase
          .from('reflection_prompts')
          .select('*')
          .eq('member_id', memberId)
          .is('archived_at', null)
          .order('sort_order', { ascending: true })

        if (seedErr) throw seedErr
        return seeded as ReflectionPrompt[]
      }

      return data as ReflectionPrompt[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useArchivedPrompts(memberId: string | undefined) {
  return useQuery({
    queryKey: ['reflection-prompts-archived', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reflection_prompts')
        .select('*')
        .eq('member_id', memberId)
        .not('archived_at', 'is', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as ReflectionPrompt[]
    },
    enabled: !!memberId,
  })
}

export function useTodaysResponses(familyId: string | undefined, memberId: string | undefined) {
  const today = todayLocalIso()
  return useQuery({
    queryKey: ['reflection-responses-today', memberId, today],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data, error } = await supabase
        .from('reflection_responses')
        .select('*')
        .eq('member_id', memberId)
        .eq('response_date', today)
      if (error) throw error
      return data as ReflectionResponse[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function usePastResponses(memberId: string | undefined, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['reflection-responses-past', memberId, limit, offset],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reflection_responses')
        .select('*, reflection_prompts!inner(prompt_text, category)')
        .eq('member_id', memberId)
        .order('response_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) throw error
      return data as ReflectionResponseWithPrompt[]
    },
    enabled: !!memberId,
  })
}

// ─── Mutations ───────────────────────────────────────────────

export function useSaveResponse() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      promptId: string
      responseText: string
      promptText: string
      category: ReflectionCategory
    }) => {
      const { familyId, memberId, promptId, responseText, promptText, category } = params
      const today = todayLocalIso()

      // 1. Create journal entry first
      const journalContent = `**${promptText}**\n\n${responseText}`
      const tags = CATEGORY_TAGS[category] || ['reflection']

      const { data: journalEntry, error: journalErr } = await supabase
        .from('journal_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          entry_type: 'reflection',
          content: journalContent,
          tags,
          visibility: 'private',
          is_included_in_ai: true,
        })
        .select('id')
        .single()

      if (journalErr) throw journalErr

      // 2. Create reflection response
      const { data, error } = await supabase
        .from('reflection_responses')
        .insert({
          family_id: familyId,
          member_id: memberId,
          prompt_id: promptId,
          response_text: responseText,
          response_date: today,
          journal_entry_id: journalEntry.id,
        })
        .select()
        .single()

      if (error) throw error

      // 3. Fire-and-forget activity log
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: 'reflection_completed',
          source_table: 'reflection_responses',
          source_id: data.id,
          metadata: { prompt_category: category },
        })
        .then(({ error: logErr }) => {
          if (logErr) console.warn('activity log insert failed:', logErr.message)
        })

      return data as ReflectionResponse
    },
    onSuccess: (_data, vars) => {
      const today = todayLocalIso()
      qc.invalidateQueries({ queryKey: ['reflection-responses-today', vars.memberId, today] })
      qc.invalidateQueries({ queryKey: ['reflection-responses-past', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['journal-entries', vars.memberId] })
    },
  })
}

export function useUpdateResponse() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      memberId: string
      responseText: string
      journalEntryId: string | null
      promptText: string
      category: ReflectionCategory
    }) => {
      const { id, responseText, journalEntryId, promptText, category } = params

      // Update response
      const { error } = await supabase
        .from('reflection_responses')
        .update({ response_text: responseText })
        .eq('id', id)

      if (error) throw error

      // Update linked journal entry if it exists
      if (journalEntryId) {
        const journalContent = `**${promptText}**\n\n${responseText}`
        const tags = CATEGORY_TAGS[category] || ['reflection']
        await supabase
          .from('journal_entries')
          .update({ content: journalContent, tags })
          .eq('id', journalEntryId)
      }
    },
    onSuccess: (_data, vars) => {
      const today = todayLocalIso()
      qc.invalidateQueries({ queryKey: ['reflection-responses-today', vars.memberId, today] })
      qc.invalidateQueries({ queryKey: ['reflection-responses-past', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['journal-entries', vars.memberId] })
    },
  })
}

export function useAddCustomPrompt() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      promptText: string
      category: ReflectionCategory
    }) => {
      // Get max sort_order for this member
      const { data: existing } = await supabase
        .from('reflection_prompts')
        .select('sort_order')
        .eq('member_id', params.memberId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

      const { data, error } = await supabase
        .from('reflection_prompts')
        .insert({
          family_id: params.familyId,
          member_id: params.memberId,
          prompt_text: params.promptText,
          category: params.category,
          source: 'custom',
          sort_order: nextOrder,
        })
        .select()
        .single()

      if (error) throw error
      return data as ReflectionPrompt
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
    },
  })
}

export function useUpdatePrompt() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      memberId: string
      promptText: string
      currentPromptText: string
      currentOriginalText: string | null
      isDefault: boolean
    }) => {
      const updates: Record<string, unknown> = { prompt_text: params.promptText }

      // For defaults: preserve original_text on first edit
      if (params.isDefault && !params.currentOriginalText) {
        updates.original_text = params.currentPromptText
      }

      const { error } = await supabase
        .from('reflection_prompts')
        .update(updates)
        .eq('id', params.id)

      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
    },
  })
}

export function useArchivePrompt() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('reflection_prompts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['reflection-prompts-archived', vars.memberId] })
    },
  })
}

export function useRestorePrompt() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('reflection_prompts')
        .update({ archived_at: null })
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['reflection-prompts-archived', vars.memberId] })
    },
  })
}

export function useDeletePrompt() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('reflection_prompts')
        .delete()
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['reflection-prompts-archived', vars.memberId] })
    },
  })
}

export function useRestoreOriginalWording() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; memberId: string; originalText: string }) => {
      const { error } = await supabase
        .from('reflection_prompts')
        .update({ prompt_text: params.originalText, original_text: null })
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
    },
  })
}

// ─── Reorder helper ──────────────────────────────────────────

export function useReorderPrompts() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { memberId: string; updates: { id: string; sort_order: number }[] }) => {
      // Batch update sort_orders
      for (const u of params.updates) {
        const { error } = await supabase
          .from('reflection_prompts')
          .update({ sort_order: u.sort_order })
          .eq('id', u.id)
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reflection-prompts', vars.memberId] })
    },
  })
}

// ─── Convenience: get effective member for View As ───────────

export function useEffectiveReflectionsMember() {
  // Uses the standard hook pattern — ViewAsProvider swaps the member context
  // so useFamilyMember already returns the viewed-as member
  // No special logic needed here
  return null
}
