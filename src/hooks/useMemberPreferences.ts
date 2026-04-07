/**
 * PRD-18 Phase B: useMemberPreferences
 *
 * Read and update a family member's preferences JSONB. Used by the
 * Rhythms Settings page to configure carry forward fallback behavior
 * and backlog threshold. The preferences JSONB is append-merged on
 * update — partial updates only touch the keys they specify.
 *
 * Storage location: family_members.preferences JSONB (default '{}').
 * No schema migration required — the column already exists since
 * migration 00000000000009.
 *
 * Phase B sub-fields:
 *   carry_forward_fallback              'stay' | 'roll_forward' | 'expire' | 'backburner'
 *   carry_forward_backburner_days       number (default 14)
 *   carry_forward_backlog_threshold     number (default 10)
 *   carry_forward_backlog_prompt_max_frequency  'weekly' | 'daily'
 *
 * Defaults are applied at READ time via DEFAULT_MEMBER_RHYTHM_PREFERENCES
 * so the UI can show a filled-in form even for brand new members whose
 * preferences JSONB is still `{}`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  type MemberRhythmPreferences,
  DEFAULT_MEMBER_RHYTHM_PREFERENCES,
} from '@/types/rhythms'

/**
 * Load a member's rhythm preferences with defaults applied.
 * Returns a Required<MemberRhythmPreferences> — never partial.
 */
export function useMemberPreferences(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-preferences', memberId],
    queryFn: async () => {
      if (!memberId) return DEFAULT_MEMBER_RHYTHM_PREFERENCES
      const { data, error } = await supabase
        .from('family_members')
        .select('preferences')
        .eq('id', memberId)
        .maybeSingle()
      if (error) throw error
      const stored = (data?.preferences ?? {}) as MemberRhythmPreferences
      return {
        ...DEFAULT_MEMBER_RHYTHM_PREFERENCES,
        ...stored,
      }
    },
    enabled: !!memberId,
  })
}

/**
 * Update a member's rhythm preferences. Performs a JSONB merge so
 * other keys inside preferences (set by other features) are preserved.
 *
 * Usage:
 *   updatePrefs.mutate({ memberId, updates: { carry_forward_fallback: 'roll_forward' } })
 */
export function useUpdateMemberPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      memberId: string
      updates: Partial<MemberRhythmPreferences>
    }) => {
      // Read current preferences, merge the updates, write back. We do
      // this application-side rather than with a SQL `||` operator
      // because PostgREST doesn't support it cleanly from the JS client.
      const { data: current, error: readError } = await supabase
        .from('family_members')
        .select('preferences')
        .eq('id', params.memberId)
        .single()
      if (readError) throw readError

      const existing = (current?.preferences ?? {}) as Record<string, unknown>
      const merged = { ...existing, ...params.updates }

      const { error: writeError } = await supabase
        .from('family_members')
        .update({ preferences: merged })
        .eq('id', params.memberId)
      if (writeError) throw writeError

      return merged
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['member-preferences', vars.memberId] })
      // Also invalidate any family_member queries that might show the
      // row — the preferences field is part of the standard select.
      qc.invalidateQueries({ queryKey: ['family-member'] })
      qc.invalidateQueries({ queryKey: ['family-members'] })
    },
  })
}
