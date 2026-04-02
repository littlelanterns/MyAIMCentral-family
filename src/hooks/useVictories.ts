// PRD-11: Victory Recorder — CRUD hook with period/life-area filtering
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type {
  Victory,
  CreateVictory,
  UpdateVictory,
  VictoryFilters,
  VictoryPeriodFilter,
} from '@/types/victories'

function getPeriodRange(period: VictoryPeriodFilter, customStart?: string, customEnd?: string) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  switch (period) {
    case 'today': {
      return { start: `${todayStr}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    }
    case 'this_week': {
      const day = now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - day)
      return {
        start: `${weekStart.toISOString().slice(0, 10)}T00:00:00`,
        end: `${todayStr}T23:59:59.999`,
      }
    }
    case 'this_month': {
      const monthStart = `${todayStr.slice(0, 7)}-01`
      return { start: `${monthStart}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    }
    case 'custom': {
      if (customStart && customEnd) {
        return { start: `${customStart}T00:00:00`, end: `${customEnd}T23:59:59.999` }
      }
      return null
    }
    case 'all':
    default:
      return null
  }
}

export function useVictories(memberId: string | undefined, filters: VictoryFilters) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['victories', memberId, filters],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      let query = supabase
        .from('victories')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      // Period filter
      const range = getPeriodRange(filters.period, filters.customStart, filters.customEnd)
      if (range) {
        query = query.gte('created_at', range.start).lte('created_at', range.end)
      }

      // Life area filter (multi-select)
      if (filters.lifeAreaTags && filters.lifeAreaTags.length > 0) {
        query = query.in('life_area_tag', filters.lifeAreaTags)
      }

      // Special filter: only victories connected to GS or BI
      if (filters.specialFilter === 'guiding_stars') {
        query = query.not('guiding_star_id', 'is', null)
      } else if (filters.specialFilter === 'best_intentions') {
        query = query.not('best_intention_id', 'is', null)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Victory[]
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useVictoryCount(memberId: string | undefined, period: VictoryPeriodFilter) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['victory-count', memberId, period],
    queryFn: async () => {
      if (!memberId || !familyId) return 0

      let query = supabase
        .from('victories')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)

      const range = getPeriodRange(period)
      if (range) {
        query = query.gte('created_at', range.start).lte('created_at', range.end)
      }

      const { count, error } = await query
      if (error) throw error
      return count ?? 0
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useRecentVictories(memberId: string | undefined, limit = 5) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['recent-victories', memberId, limit],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      const { data, error } = await supabase
        .from('victories')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data ?? []) as Victory[]
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useLifeAreaBreakdown(memberId: string | undefined, period: VictoryPeriodFilter) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['victory-life-areas', memberId, period],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      let query = supabase
        .from('victories')
        .select('life_area_tag')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)
        .not('life_area_tag', 'is', null)

      const range = getPeriodRange(period)
      if (range) {
        query = query.gte('created_at', range.start).lte('created_at', range.end)
      }

      const { data, error } = await query
      if (error) throw error

      // Count by tag, sorted by frequency
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const tag = (row as { life_area_tag: string }).life_area_tag
        counts[tag] = (counts[tag] || 0) + 1
      }

      return Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useCreateVictory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateVictory) => {
      const { data, error } = await supabase
        .from('victories')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          description: input.description,
          life_area_tag: input.life_area_tag ?? null,
          custom_tags: input.custom_tags ?? [],
          source: input.source ?? 'manual',
          source_reference_id: input.source_reference_id ?? null,
          member_type: input.member_type,
          importance: input.importance ?? 'standard',
          guiding_star_id: input.guiding_star_id ?? null,
          best_intention_id: input.best_intention_id ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Victory
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', data.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['recent-victories', data.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['victory-life-areas', data.family_member_id] })
    },
  })
}

export function useUpdateVictory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId, updates }: { id: string; memberId: string; updates: UpdateVictory }) => {
      const { data, error } = await supabase
        .from('victories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...(data as Victory), memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['recent-victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-life-areas', data.memberId] })
    },
  })
}

export function useArchiveVictory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('victories')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['recent-victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-life-areas', data.memberId] })
    },
  })
}

export function useArchivedVictories(memberId: string | undefined) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['victories-archived', memberId],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      const { data, error } = await supabase
        .from('victories')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as Victory[]
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useUnarchiveVictory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('victories')
        .update({ archived_at: null })
        .eq('id', id)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victories-archived', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['recent-victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-life-areas', data.memberId] })
    },
  })
}

export function useDeleteVictory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('victories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victories-archived', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['recent-victories', data.memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-life-areas', data.memberId] })
    },
  })
}

export function useToggleMomsPick() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      memberId,
      isMomsPick,
      note,
      pickedBy,
    }: {
      id: string
      memberId: string
      isMomsPick: boolean
      note?: string | null
      pickedBy?: string | null
    }) => {
      const { error } = await supabase
        .from('victories')
        .update({
          is_moms_pick: isMomsPick,
          moms_pick_note: isMomsPick ? (note ?? null) : null,
          moms_pick_by: isMomsPick ? (pickedBy ?? null) : null,
        })
        .eq('id', id)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['victories', data.memberId] })
    },
  })
}
