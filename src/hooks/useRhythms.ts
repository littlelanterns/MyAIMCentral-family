/**
 * PRD-18: Rhythms hooks (Phase A foundation).
 *
 * Tables: rhythm_configs, rhythm_completions
 *
 * RLS: members manage own; mom reads/writes all family. The default
 * seeding trigger (auto_provision_member_resources) creates the
 * per-role default rhythms on family_members INSERT, with backfill
 * applied in migration 100103.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  type RhythmConfig,
  type RhythmCompletion,
  type RhythmCompletionMetadata,
  type RhythmKey,
  type RhythmStatus,
  type RhythmSection,
  periodForRhythm,
  isRhythmActive,
} from '@/types/rhythms'

// ─── Queries ─────────────────────────────────────────────────

/**
 * All non-archived rhythm configs for a member, ordered by rhythm_key.
 * Disabled rhythms are returned too — Settings page lists them so the
 * user can enable them.
 */
export function useRhythmConfigs(memberId: string | undefined) {
  return useQuery({
    queryKey: ['rhythm-configs', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('rhythm_configs')
        .select('*')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('rhythm_key', { ascending: true })
      if (error) throw error
      return data as RhythmConfig[]
    },
    enabled: !!memberId,
  })
}

/** Single rhythm config for a member by rhythm_key. */
export function useRhythmConfig(
  memberId: string | undefined,
  rhythmKey: RhythmKey | undefined
) {
  return useQuery({
    queryKey: ['rhythm-config', memberId, rhythmKey],
    queryFn: async () => {
      if (!memberId || !rhythmKey) return null
      const { data, error } = await supabase
        .from('rhythm_configs')
        .select('*')
        .eq('member_id', memberId)
        .eq('rhythm_key', rhythmKey)
        .is('archived_at', null)
        .maybeSingle()
      if (error) throw error
      return data as RhythmConfig | null
    },
    enabled: !!memberId && !!rhythmKey,
  })
}

/**
 * Completion record for the current period of a rhythm. Returns null
 * if the user hasn't started the rhythm for this period yet.
 */
export function useRhythmCompletion(
  memberId: string | undefined,
  rhythmKey: RhythmKey | undefined,
  period?: string
) {
  const resolvedPeriod = period ?? (rhythmKey ? periodForRhythm(rhythmKey) : '')
  return useQuery({
    queryKey: ['rhythm-completion', memberId, rhythmKey, resolvedPeriod],
    queryFn: async () => {
      if (!memberId || !rhythmKey) return null
      const { data, error } = await supabase
        .from('rhythm_completions')
        .select('*')
        .eq('member_id', memberId)
        .eq('rhythm_key', rhythmKey)
        .eq('period', resolvedPeriod)
        .maybeSingle()
      if (error) throw error
      return data as RhythmCompletion | null
    },
    enabled: !!memberId && !!rhythmKey,
  })
}

/** All completions for a member for today's date (covers daily rhythms). */
export function useTodaysRhythmCompletions(memberId: string | undefined) {
  const today = periodForRhythm('morning') // YYYY-MM-DD
  return useQuery({
    queryKey: ['rhythm-completions-today', memberId, today],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('rhythm_completions')
        .select('*')
        .eq('member_id', memberId)
        .eq('period', today)
      if (error) throw error
      return data as RhythmCompletion[]
    },
    enabled: !!memberId,
  })
}

// ─── Derived helpers ─────────────────────────────────────────

/**
 * Resolve which rhythm (if any) should be auto-opening right now for a
 * given member based on their configs + the current time. Returns the
 * config of the rhythm that:
 *   1. Is enabled
 *   2. Has auto_open = true
 *   3. Is currently inside its time window
 *   4. Has no completion record yet for this period
 *   5. Is not snoozed past now
 *
 * Returns null if nothing should auto-open.
 *
 * Caller is responsible for separately checking that the user hasn't
 * been auto-opened today (the once-per-period guarantee).
 */
export function pickRhythmToAutoOpen(
  configs: RhythmConfig[],
  todaysCompletions: RhythmCompletion[],
  now: Date = new Date()
): RhythmConfig | null {
  // Daily rhythms first (morning, evening) — periodic rhythms render
  // inline cards inside morning, not as their own modal.
  const candidates = configs.filter(
    c =>
      (c.rhythm_key === 'morning' || c.rhythm_key === 'evening') &&
      c.enabled &&
      c.auto_open &&
      isRhythmActive(c.timing, now)
  )

  for (const config of candidates) {
    const period = periodForRhythm(config.rhythm_key, now)
    const existing = todaysCompletions.find(
      r => r.rhythm_key === config.rhythm_key && r.period === period
    )
    if (!existing) return config
    // Snoozed past now → still considered "needs showing" (card breath glow)
    // but the auto-open should only fire once. Treat snoozed/dismissed as
    // "not auto-opening" so we don't re-pop the modal.
    if (existing.status === 'pending') return config
  }

  return null
}

// ─── Mutations ───────────────────────────────────────────────

/** Create or update a completion record for the current period. */
export function useCompleteRhythm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      rhythmKey: RhythmKey
      period?: string
      metadata?: RhythmCompletionMetadata
    }) => {
      const period = params.period ?? periodForRhythm(params.rhythmKey)
      const { data, error } = await supabase
        .from('rhythm_completions')
        .upsert(
          {
            family_id: params.familyId,
            member_id: params.memberId,
            rhythm_key: params.rhythmKey,
            period,
            status: 'completed' as RhythmStatus,
            metadata: params.metadata ?? {},
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'family_id,member_id,rhythm_key,period' }
        )
        .select()
        .single()
      if (error) throw error
      return data as RhythmCompletion
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rhythm-completion', vars.memberId, vars.rhythmKey] })
      qc.invalidateQueries({ queryKey: ['rhythm-completions-today', vars.memberId] })
    },
  })
}

/** Snooze a rhythm — writes snoozed_until and status='snoozed'. */
export function useSnoozeRhythm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      rhythmKey: RhythmKey
      snoozeMinutes: number
    }) => {
      const period = periodForRhythm(params.rhythmKey)
      const snoozedUntil = new Date(Date.now() + params.snoozeMinutes * 60_000).toISOString()
      const { data, error } = await supabase
        .from('rhythm_completions')
        .upsert(
          {
            family_id: params.familyId,
            member_id: params.memberId,
            rhythm_key: params.rhythmKey,
            period,
            status: 'snoozed' as RhythmStatus,
            snoozed_until: snoozedUntil,
          },
          { onConflict: 'family_id,member_id,rhythm_key,period' }
        )
        .select()
        .single()
      if (error) throw error
      return data as RhythmCompletion
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rhythm-completion', vars.memberId, vars.rhythmKey] })
      qc.invalidateQueries({ queryKey: ['rhythm-completions-today', vars.memberId] })
    },
  })
}

/** Dismiss a rhythm for the current period — collapses to card. */
export function useDismissRhythm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      rhythmKey: RhythmKey
    }) => {
      const period = periodForRhythm(params.rhythmKey)
      const { data, error } = await supabase
        .from('rhythm_completions')
        .upsert(
          {
            family_id: params.familyId,
            member_id: params.memberId,
            rhythm_key: params.rhythmKey,
            period,
            status: 'dismissed' as RhythmStatus,
            dismissed_at: new Date().toISOString(),
          },
          { onConflict: 'family_id,member_id,rhythm_key,period' }
        )
        .select()
        .single()
      if (error) throw error
      return data as RhythmCompletion
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rhythm-completion', vars.memberId, vars.rhythmKey] })
      qc.invalidateQueries({ queryKey: ['rhythm-completions-today', vars.memberId] })
    },
  })
}

/** Update a rhythm config — sections, timing, enabled flag, etc. */
export function useUpdateRhythmConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      configId: string
      memberId: string
      updates: Partial<
        Pick<
          RhythmConfig,
          'enabled' | 'auto_open' | 'sections' | 'timing' | 'reflection_guideline_count' | 'display_name'
        >
      >
    }) => {
      const { data, error } = await supabase
        .from('rhythm_configs')
        .update(params.updates)
        .eq('id', params.configId)
        .select()
        .single()
      if (error) throw error
      return data as RhythmConfig
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rhythm-configs', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['rhythm-config', vars.memberId] })
    },
  })
}

/** Toggle a single section on/off without rewriting the whole sections array. */
export function useToggleRhythmSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      configId: string
      memberId: string
      currentSections: RhythmSection[]
      sectionType: string
      enabled: boolean
    }) => {
      const updated = params.currentSections.map(s =>
        s.section_type === params.sectionType ? { ...s, enabled: params.enabled } : s
      )
      const { error } = await supabase
        .from('rhythm_configs')
        .update({ sections: updated })
        .eq('id', params.configId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['rhythm-configs', vars.memberId] })
    },
  })
}
