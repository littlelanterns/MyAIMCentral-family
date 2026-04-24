import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useActedBy } from './useActedBy'
import { MEMBER_COLORS } from '@/config/member_colors'
import { todayLocalIso } from '@/utils/dates'
import { useFamilyToday } from './useFamilyToday'

/** Full AIMfM 44-color palette for intention color assignment */
export const INTENTION_COLORS = MEMBER_COLORS.map((c) => c.hex)

export interface BestIntention {
  id: string
  family_id: string
  member_id: string
  statement: string
  description: string | null
  tags: string[] | null
  source: string
  source_reference_id: string | null
  related_member_ids: string[] | null
  tracker_style: 'counter' | 'bar_graph' | 'streak'
  color: string | null
  is_active: boolean
  celebration_count: number
  iteration_count: number
  is_included_in_ai: boolean
  is_private: boolean
  is_shared_with_partner: boolean
  sort_order: number
  archived_at: string | null
  last_reset_at: string | null
  created_at: string
  updated_at: string
}

export interface IntentionIteration {
  id: string
  intention_id: string
  family_id: string
  member_id: string
  victory_reference: string | null
  recorded_at?: string
  day_date: string
  created_at: string
}

// Active intentions (not archived), ordered: active first, then by sort_order
export function useBestIntentions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['best-intentions', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('best_intentions')
        .select('*')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('is_active', { ascending: false })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as BestIntention[]
    },
    enabled: !!memberId,
  })
}

// Archived intentions
export function useArchivedIntentions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['best-intentions-archived', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('best_intentions')
        .select('*')
        .eq('member_id', memberId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) throw error
      return data as BestIntention[]
    },
    enabled: !!memberId,
  })
}

export function useIntentionIterations(intentionId: string | undefined) {
  return useQuery({
    queryKey: ['intention-iterations', intentionId],
    queryFn: async () => {
      if (!intentionId) return []

      const { data, error } = await supabase
        .from('intention_iterations')
        .select('*')
        .eq('intention_id', intentionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as IntentionIteration[]
    },
    enabled: !!intentionId,
  })
}

// Count iterations for a specific intention where day_date = family-today.
// Row 184 NEW-DD Path 2: `today` is now derived server-side via useFamilyToday
// so a misconfigured viewer clock doesn't miss rows. memberId drives the
// family-timezone lookup.
export function useTodaysIterations(
  intentionId: string | undefined,
  memberId: string | undefined,
) {
  const { data: today } = useFamilyToday(memberId)

  return useQuery({
    queryKey: ['intention-iterations-today', intentionId, today],
    queryFn: async () => {
      if (!intentionId || !today) return 0

      const { count, error } = await supabase
        .from('intention_iterations')
        .select('*', { count: 'exact', head: true })
        .eq('intention_id', intentionId)
        .eq('day_date', today)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!intentionId && !!today,
  })
}

/** Pick the next unused color from INTENTION_COLORS, cycling when all are used. */
function pickNextColor(existingColors: (string | null)[]): string {
  const used = new Set(existingColors.filter(Boolean))
  for (const c of INTENTION_COLORS) {
    if (!used.has(c)) return c
  }
  return INTENTION_COLORS[existingColors.length % INTENTION_COLORS.length]
}

export function useCreateBestIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (intention: {
      family_id: string
      member_id: string
      statement: string
      description?: string
      tags?: string[]
      source?: string
      related_member_ids?: string[]
      tracker_style?: 'counter' | 'bar_graph' | 'streak'
      color?: string
    }) => {
      // Auto-assign a color if not provided — query existing intentions' colors
      let color = intention.color
      if (!color) {
        const { data: existing } = await supabase
          .from('best_intentions')
          .select('color')
          .eq('member_id', intention.member_id)
          .is('archived_at', null)
        color = pickNextColor((existing ?? []).map((r: { color: string | null }) => r.color))
      }

      const { data, error } = await supabase
        .from('best_intentions')
        .insert({
          family_id: intention.family_id,
          member_id: intention.member_id,
          statement: intention.statement,
          description: intention.description ?? null,
          tags: intention.tags ?? null,
          source: intention.source ?? 'manual',
          related_member_ids: intention.related_member_ids ?? null,
          tracker_style: intention.tracker_style ?? 'counter',
          color,
        })
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

export function useUpdateBestIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BestIntention> & { id: string }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions-archived', data.member_id] })
    },
  })
}

// Toggle is_active boolean
export function useToggleIntentionActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

// Toggle is_included_in_ai boolean
export function useToggleIntentionAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isIncluded }: { id: string; isIncluded: boolean }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update({ is_included_in_ai: isIncluded })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

// Soft delete: set archived_at
export function useArchiveIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions-archived', data.member_id] })
    },
  })
}

// Restore from archive: clear archived_at
export function useRestoreIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update({ archived_at: null })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions-archived', data.member_id] })
    },
  })
}

// Hard delete: permanently remove intention and its iterations
export function useDeleteIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      // Delete iterations first (FK constraint)
      await supabase
        .from('intention_iterations')
        .delete()
        .eq('intention_id', id)

      const { error } = await supabase
        .from('best_intentions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', memberId] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions-archived', memberId] })
    },
  })
}

// Reorder intentions by updating sort_order for each
export function useReorderIntentions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      // Update each item's sort_order
      const updates = items.map(({ id, sort_order }) =>
        supabase
          .from('best_intentions')
          .update({ sort_order })
          .eq('id', id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find((r) => r.error)
      if (firstError?.error) throw firstError.error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions'] })
    },
  })
}

export function useUpdateIntentionColor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update({ color })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

/** Query all iterations for a member within a date range, grouped for analytics */
export function useAllIntentionIterations(
  memberId: string | undefined,
  intentionIds: string[],
  dateRange: { start: string; end: string },
) {
  return useQuery({
    queryKey: ['intention-iterations-range', memberId, intentionIds, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!memberId || intentionIds.length === 0) return [] as IntentionIteration[]

      const { data, error } = await supabase
        .from('intention_iterations')
        .select('*')
        .eq('member_id', memberId)
        .in('intention_id', intentionIds)
        .gte('day_date', dateRange.start)
        .lte('day_date', dateRange.end)
        .order('day_date', { ascending: true })

      if (error) throw error
      return data as IntentionIteration[]
    },
    enabled: !!memberId && intentionIds.length > 0,
  })
}

export function useLogIteration() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()

  return useMutation({
    mutationFn: async ({
      intentionId,
      familyId,
      memberId,
      victoryReference,
      intentionStatement,
    }: {
      intentionId: string
      familyId: string
      memberId: string
      victoryReference?: string
      intentionStatement?: string
    }) => {
      const today = todayLocalIso()

      const { data, error } = await supabase
        .from('intention_iterations')
        .insert({
          intention_id: intentionId,
          family_id: familyId,
          member_id: memberId,
          victory_reference: victoryReference ?? null,
          day_date: today,
          acted_by: actedBy,
        })
        .select()
        .single()

      if (error) throw error

      // iteration_count is auto-incremented by DB trigger (trg_increment_iteration_count)

      // Activity log entry (fire-and-forget) — enriches data for victory scan
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: 'intention_iterated',
          source_table: 'intention_iterations',
          source_id: data.id,
          source_reference_id: intentionId,
          display_text: intentionStatement ? `Celebrated: ${intentionStatement}` : 'Best Intention celebrated',
          metadata: { intention_id: intentionId },
        })
        .then(({ error: logErr }) => {
          if (logErr) console.warn('activity log insert failed:', logErr.message)
        })

      return data as IntentionIteration
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intention-iterations', data.intention_id] })
      queryClient.invalidateQueries({ queryKey: ['intention-iterations-today', data.intention_id] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions'] })
      queryClient.invalidateQueries({ queryKey: ['intention-iterations-range'] })
    },
  })
}
