// PRD-28 Sub-phase B: Homework subject config + time logging hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso } from '@/utils/dates'
import type {
  HomeschoolSubject,
  HomeschoolConfig,
  HomeschoolTimeLog,
  ResolvedHomeschoolConfig,
  TimeAllocationMode,
} from '@/types/homeschool'

// ============================================================
// Subjects
// ============================================================

export function useHomeschoolSubjects(familyId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: ['homeschool-subjects', familyId, includeArchived],
    queryFn: async () => {
      if (!familyId) return []
      let query = supabase
        .from('homeschool_subjects')
        .select('*')
        .eq('family_id', familyId)
        .order('sort_order', { ascending: true })
      if (!includeArchived) {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as HomeschoolSubject[]
    },
    enabled: !!familyId,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { family_id: string; name: string; icon_key?: string; default_weekly_hours?: number | null }) => {
      const { data, error } = await supabase
        .from('homeschool_subjects')
        .insert({
          family_id: input.family_id,
          name: input.name,
          icon_key: input.icon_key ?? null,
          default_weekly_hours: input.default_weekly_hours ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as HomeschoolSubject
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-subjects', data.family_id] })
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      familyId: string
      updates: Partial<Pick<HomeschoolSubject, 'name' | 'default_weekly_hours' | 'icon_key' | 'sort_order'>>
    }) => {
      const { error } = await supabase
        .from('homeschool_subjects')
        .update(input.updates)
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-subjects', vars.familyId] })
    },
  })
}

export function useArchiveSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('homeschool_subjects')
        .update({ is_active: false })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-subjects', vars.familyId] })
    },
  })
}

export function useReorderSubjects() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; orderedIds: string[] }) => {
      const updates = input.orderedIds.map((id, index) =>
        supabase.from('homeschool_subjects').update({ sort_order: index }).eq('id', id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find(r => r.error)
      if (firstError?.error) throw firstError.error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-subjects', vars.familyId] })
    },
  })
}

// ============================================================
// Configs — family-first, per-child override
// ============================================================

export function useHomeschoolFamilyConfig(familyId: string | undefined) {
  return useQuery({
    queryKey: ['homeschool-config-family', familyId],
    queryFn: async () => {
      if (!familyId) return null
      const { data, error } = await supabase
        .from('homeschool_configs')
        .select('*')
        .eq('family_id', familyId)
        .is('family_member_id', null)
        .maybeSingle()
      if (error) throw error
      return data as HomeschoolConfig | null
    },
    enabled: !!familyId,
  })
}

export function useHomeschoolChildConfig(memberId: string | undefined) {
  return useQuery({
    queryKey: ['homeschool-config-child', memberId],
    queryFn: async () => {
      if (!memberId) return null
      const { data, error } = await supabase
        .from('homeschool_configs')
        .select('*')
        .eq('family_member_id', memberId)
        .maybeSingle()
      if (error) throw error
      return data as HomeschoolConfig | null
    },
    enabled: !!memberId,
  })
}

/** Resolves child override → family default → system default */
export function useResolvedHomeschoolConfig(familyId: string | undefined, memberId: string | undefined) {
  const { data: familyConfig } = useHomeschoolFamilyConfig(familyId)
  const { data: childConfig } = useHomeschoolChildConfig(memberId)

  const resolved: ResolvedHomeschoolConfig = {
    time_allocation_mode: childConfig?.time_allocation_mode ?? familyConfig?.time_allocation_mode ?? 'full',
    allow_subject_overlap: childConfig?.allow_subject_overlap ?? familyConfig?.allow_subject_overlap ?? true,
    subject_hour_overrides: {
      ...(familyConfig?.subject_hour_overrides ?? {}),
      ...(childConfig?.subject_hour_overrides ?? {}),
    },
    school_year_start: childConfig?.school_year_start ?? familyConfig?.school_year_start ?? null,
    school_year_end: childConfig?.school_year_end ?? familyConfig?.school_year_end ?? null,
    term_breaks: (childConfig?.term_breaks?.length ? childConfig.term_breaks : familyConfig?.term_breaks) ?? [],
  }

  return { resolved, familyConfig, childConfig, isLoading: familyConfig === undefined || childConfig === undefined }
}

export function useUpsertHomeschoolConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      family_id: string
      family_member_id?: string | null // null/undefined = family-wide default
      time_allocation_mode?: TimeAllocationMode
      allow_subject_overlap?: boolean
      subject_hour_overrides?: Record<string, number>
      school_year_start?: string | null
      school_year_end?: string | null
      term_breaks?: Array<{ name: string; start_date: string; end_date: string }>
    }) => {
      const row: Record<string, unknown> = {
        family_id: input.family_id,
        family_member_id: input.family_member_id ?? null,
      }
      if (input.time_allocation_mode !== undefined) row.time_allocation_mode = input.time_allocation_mode
      if (input.allow_subject_overlap !== undefined) row.allow_subject_overlap = input.allow_subject_overlap
      if (input.subject_hour_overrides !== undefined) row.subject_hour_overrides = input.subject_hour_overrides
      if (input.school_year_start !== undefined) row.school_year_start = input.school_year_start
      if (input.school_year_end !== undefined) row.school_year_end = input.school_year_end
      if (input.term_breaks !== undefined) row.term_breaks = input.term_breaks

      const { data, error } = await supabase
        .from('homeschool_configs')
        .upsert(row, {
          onConflict: input.family_member_id ? 'family_member_id' : 'family_id',
        })
        .select()
        .single()
      if (error) throw error
      return data as HomeschoolConfig
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-config-family', data.family_id] })
      if (data.family_member_id) {
        queryClient.invalidateQueries({ queryKey: ['homeschool-config-child', data.family_member_id] })
      }
    },
  })
}

// ============================================================
// Time Logs
// ============================================================

export function useHomeschoolTimeLogs(
  memberId: string | undefined,
  dateRange?: { start: string; end: string },
  subjectId?: string,
) {
  return useQuery({
    queryKey: ['homeschool-time-logs', memberId, dateRange, subjectId],
    queryFn: async () => {
      if (!memberId) return []
      let query = supabase
        .from('homeschool_time_logs')
        .select('*')
        .eq('family_member_id', memberId)
        .order('log_date', { ascending: false })
      if (dateRange) {
        query = query.gte('log_date', dateRange.start).lte('log_date', dateRange.end)
      }
      if (subjectId) {
        query = query.eq('subject_id', subjectId)
      }
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as HomeschoolTimeLog[]
    },
    enabled: !!memberId,
  })
}

export function useDailySummary(memberId: string | undefined, date?: string) {
  const targetDate = date ?? todayLocalIso()
  return useQuery({
    queryKey: ['homeschool-daily-summary', memberId, targetDate],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!memberId) return {}
      const { data, error } = await supabase
        .from('homeschool_time_logs')
        .select('subject_id, minutes_logged')
        .eq('family_member_id', memberId)
        .eq('log_date', targetDate)
        .eq('status', 'confirmed')
      if (error) throw error
      // Aggregate by subject
      const bySubject: Record<string, number> = {}
      for (const row of (data ?? [])) {
        bySubject[row.subject_id] = (bySubject[row.subject_id] ?? 0) + row.minutes_logged
      }
      return bySubject
    },
    enabled: !!memberId,
  })
}

export function useWeeklySummary(memberId: string | undefined, weekStart?: string) {
  // Default to this Monday
  const start = weekStart ?? getWeekStart(todayLocalIso())
  const end = addDays(start, 6)
  return useQuery({
    queryKey: ['homeschool-weekly-summary', memberId, start],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!memberId) return {}
      const { data, error } = await supabase
        .from('homeschool_time_logs')
        .select('subject_id, minutes_logged')
        .eq('family_member_id', memberId)
        .gte('log_date', start)
        .lte('log_date', end)
        .eq('status', 'confirmed')
      if (error) throw error
      const bySubject: Record<string, number> = {}
      for (const row of (data ?? [])) {
        bySubject[row.subject_id] = (bySubject[row.subject_id] ?? 0) + row.minutes_logged
      }
      return bySubject
    },
    enabled: !!memberId,
  })
}

export function useSchoolYearSummary(memberId: string | undefined, familyId: string | undefined) {
  const { resolved } = useResolvedHomeschoolConfig(familyId, memberId)
  const start = resolved.school_year_start
  const end = resolved.school_year_end

  return useQuery({
    queryKey: ['homeschool-school-year-summary', memberId, start, end],
    queryFn: async () => {
      if (!memberId || !start || !end) return {}
      const { data, error } = await supabase
        .from('homeschool_time_logs')
        .select('subject_id, minutes_logged')
        .eq('family_member_id', memberId)
        .gte('log_date', start)
        .lte('log_date', end)
        .eq('status', 'confirmed')
      if (error) throw error
      const bySubject: Record<string, number> = {}
      for (const row of (data ?? [])) {
        bySubject[row.subject_id] = (bySubject[row.subject_id] ?? 0) + row.minutes_logged
      }
      return bySubject
    },
    enabled: !!memberId && !!start && !!end,
  })
}

// ============================================================
// Log Learning — main action hook
// ============================================================

export function useLogLearning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      family_id: string
      family_member_id: string
      description: string
      minutes: number
      subject_ids: string[]
      allocation_mode: TimeAllocationMode
      source: 'child_report' | 'manual_entry' | 'timer_session'
      source_reference_id?: string | null
      status: 'pending' | 'confirmed'
    }) => {
      const rows = input.subject_ids.length > 0
        ? allocateMinutes(input.minutes, input.subject_ids, input.allocation_mode)
        : [{ subject_id: input.subject_ids[0], minutes: input.minutes }]

      // If no subjects selected, we still want to log — use the first subject or skip
      if (input.subject_ids.length === 0) {
        return { logIds: [], totalMinutes: input.minutes }
      }

      const inserts = rows.map(r => ({
        family_id: input.family_id,
        family_member_id: input.family_member_id,
        subject_id: r.subject_id,
        log_date: todayLocalIso(),
        minutes_logged: r.minutes,
        allocation_mode_used: input.allocation_mode,
        source: input.source,
        source_reference_id: input.source_reference_id ?? null,
        status: input.status,
        description: input.description,
      }))

      const { data, error } = await supabase
        .from('homeschool_time_logs')
        .insert(inserts)
        .select('id')
      if (error) throw error
      return { logIds: (data ?? []).map(r => r.id), totalMinutes: input.minutes }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-time-logs', vars.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-daily-summary', vars.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-weekly-summary', vars.family_member_id] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-school-year-summary', vars.family_member_id] })
    },
  })
}

export function useApproveTimeLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ logId, approverId, memberId }: { logId: string; approverId: string; memberId: string }) => {
      const { error } = await supabase
        .from('homeschool_time_logs')
        .update({
          status: 'confirmed',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', logId)
      if (error) throw error
      return { memberId }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-time-logs', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-daily-summary', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-weekly-summary', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['family-requests'] })
    },
  })
}

export function useRejectTimeLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ logId, memberId }: { logId: string; memberId: string }) => {
      const { error } = await supabase
        .from('homeschool_time_logs')
        .update({ status: 'rejected' })
        .eq('id', logId)
      if (error) throw error
      return { memberId }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['homeschool-time-logs', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-daily-summary', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['homeschool-weekly-summary', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['family-requests'] })
    },
  })
}

// ============================================================
// Helpers
// ============================================================

/** Allocate total minutes across subjects based on allocation mode */
function allocateMinutes(
  totalMinutes: number,
  subjectIds: string[],
  mode: TimeAllocationMode,
): Array<{ subject_id: string; minutes: number }> {
  if (subjectIds.length === 0) return []
  if (subjectIds.length === 1) {
    return [{ subject_id: subjectIds[0], minutes: totalMinutes }]
  }
  switch (mode) {
    case 'full':
      // Each subject gets the full session time
      return subjectIds.map(id => ({ subject_id: id, minutes: totalMinutes }))
    case 'strict': {
      // Divide equally — integer division with remainder distributed to first subjects
      const base = Math.floor(totalMinutes / subjectIds.length)
      const remainder = totalMinutes % subjectIds.length
      return subjectIds.map((id, i) => ({
        subject_id: id,
        minutes: base + (i < remainder ? 1 : 0),
      }))
    }
    case 'weighted':
      // Without per-subject targets, fall back to equal split
      // When targets exist, the caller should pass pre-calculated per-subject minutes
      return allocateMinutes(totalMinutes, subjectIds, 'strict')
    default:
      return subjectIds.map(id => ({ subject_id: id, minutes: totalMinutes }))
  }
}

function getWeekStart(dateIso: string): string {
  const d = new Date(dateIso + 'T00:00:00')
  const day = d.getDay()
  // Monday = start of week (ISO)
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
