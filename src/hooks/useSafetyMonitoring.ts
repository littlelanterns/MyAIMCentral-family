/**
 * PRD-30 Safety Monitoring — client data hooks (SM-B mom surfaces).
 *
 * Live table reality (SM-A, migration 00000000100289):
 *  - safety_flags is COLUMN-GUARDED: context_snippet / matched_keywords /
 *    classification_reasoning are REVOKEd from authenticated — every query
 *    against this table below uses an explicit column list, never `select('*')`
 *    (a `*` request hard-errors 42501 even for mom).
 *  - safety_keywords is entirely unreadable from the client (service-role only).
 *  - RLS: mom (primary_parent) has full CRUD on configs; flags/summaries are
 *    readable by mom + active safety_notification_recipients; flag status
 *    updates are mom-only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { SafetyCategory, SafetySensitivity, SafetySeverity, SafetyFlagStatus } from '@/lib/safety/categoryLabels'

interface RecipientScopeMember {
  id: string
  family_id: string
  role: string
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SafetyMonitoringConfigRow {
  id: string
  family_id: string
  monitored_member_id: string
  is_active: boolean
}

export interface SafetySensitivityConfigRow {
  id: string
  monitored_member_id: string
  category: SafetyCategory
  sensitivity: SafetySensitivity
}

export interface SafetyNotificationRecipientRow {
  id: string
  family_id: string
  recipient_member_id: string
  is_active: boolean
  notification_channels: string[]
}

// Non-content columns only — context_snippet/matched_keywords/
// classification_reasoning are DB-column-guarded and never requested here.
const SAFE_FLAG_COLUMNS =
  'id, family_id, flagged_member_id, conversation_table, conversation_id, surface, category, severity, detection_layer, conversation_starter, resource_ids, status, reviewed_at, reviewed_by, is_safe_harbor, created_at'

export interface SafetyFlagRow {
  id: string
  family_id: string
  flagged_member_id: string
  conversation_table: 'lila_conversations' | 'bookshelf_discussions' | null
  conversation_id: string | null
  surface: string
  category: SafetyCategory
  severity: SafetySeverity
  detection_layer: 'keyword' | 'classification' | 'both'
  conversation_starter: string | null
  resource_ids: string[]
  status: SafetyFlagStatus
  reviewed_at: string | null
  reviewed_by: string | null
  is_safe_harbor: boolean
  created_at: string
}

export interface SafetyResourceRow {
  id: string
  category: SafetyCategory
  resource_name: string
  resource_type: 'hotline' | 'website' | 'article' | 'book'
  resource_value: string
  description: string | null
  display_order: number
}

// ── Monitoring configs (Screen 1) ───────────────────────────────────────────

/**
 * PRD-30 J5/D4 — the teen disclosure row. A monitored member may read their
 * OWN safety_monitoring_configs row (migration 00000000100299's additive
 * self-select policy) — this is the disclosure itself, not a leak: knowing
 * you're monitored is what "not hidden surveillance" means. Everything else
 * about safety monitoring (sensitivity, flags, keywords) stays fully
 * invisible to the monitored member.
 */
export function useOwnMonitoringStatus(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['safety-own-monitoring-status', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return false
      const { data, error } = await supabase
        .from('safety_monitoring_configs')
        .select('is_active')
        .eq('family_id', familyId)
        .eq('monitored_member_id', memberId)
        .maybeSingle()
      if (error) return false
      return !!data?.is_active
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useMonitoringConfigs(familyId: string | undefined) {
  return useQuery({
    queryKey: ['safety-monitoring-configs', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('safety_monitoring_configs')
        .select('id, family_id, monitored_member_id, is_active')
        .eq('family_id', familyId)
      if (error) throw error
      return (data ?? []) as SafetyMonitoringConfigRow[]
    },
    enabled: !!familyId,
  })
}

export function useUpdateMonitoringConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean; familyId: string }) => {
      const { error } = await supabase.from('safety_monitoring_configs').update({ is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-monitoring-configs', vars.familyId] })
      queryClient.invalidateQueries({ queryKey: ['safety-flag-counts'] })
    },
  })
}

// ── Sensitivity configs (Screen 2) ──────────────────────────────────────────

export function useSensitivityConfigs(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['safety-sensitivity-configs', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []
      const { data, error } = await supabase
        .from('safety_sensitivity_configs')
        .select('id, monitored_member_id, category, sensitivity')
        .eq('family_id', familyId)
        .eq('monitored_member_id', memberId)
      if (error) throw error
      return (data ?? []) as SafetySensitivityConfigRow[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useUpsertSensitivityConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      category: SafetyCategory
      sensitivity: SafetySensitivity
    }) => {
      const { error } = await supabase.from('safety_sensitivity_configs').upsert(
        {
          family_id: params.familyId,
          monitored_member_id: params.memberId,
          category: params.category,
          sensitivity: params.sensitivity,
        },
        { onConflict: 'family_id,monitored_member_id,category' },
      )
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-sensitivity-configs', vars.familyId, vars.memberId] })
    },
  })
}

export function useResetSensitivityConfigs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; memberId: string }) => {
      const { error } = await supabase
        .from('safety_sensitivity_configs')
        .delete()
        .eq('family_id', params.familyId)
        .eq('monitored_member_id', params.memberId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-sensitivity-configs', vars.familyId, vars.memberId] })
    },
  })
}

// ── Notification recipients (Screen 1 — who gets alerted) ──────────────────

export function useNotificationRecipients(familyId: string | undefined) {
  return useQuery({
    queryKey: ['safety-notification-recipients', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('safety_notification_recipients')
        .select('id, family_id, recipient_member_id, is_active, notification_channels')
        .eq('family_id', familyId)
      if (error) throw error
      return (data ?? []) as SafetyNotificationRecipientRow[]
    },
    enabled: !!familyId,
  })
}

/** Is the given member (default: the signed-in auth member; pass
 * `forMember` for View-As / effective-member scoping) an active
 * safety_notification_recipient? Mom is always a recipient (auto-
 * provisioned); dad only if mom granted it in Settings. */
export function useIsSafetyRecipient(forMember?: RecipientScopeMember | null) {
  const { data: authMember } = useFamilyMember()
  const member = forMember ?? authMember
  const isMom = member?.role === 'primary_parent'
  const query = useQuery({
    queryKey: ['safety-is-recipient', member?.family_id, member?.id],
    queryFn: async () => {
      if (!member) return false
      const { data, error } = await supabase
        .from('safety_notification_recipients')
        .select('id')
        .eq('family_id', member.family_id)
        .eq('recipient_member_id', member.id)
        .eq('is_active', true)
        .maybeSingle()
      if (error) return false
      return !!data
    },
    enabled: !!member && !isMom,
  })
  return {
    isRecipient: isMom || !!query.data,
    isLoading: isMom ? false : query.isLoading,
  }
}

export function useUpsertRecipient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      familyId: string
      recipientMemberId: string
      isActive: boolean
      channels?: string[]
    }) => {
      const { error } = await supabase.from('safety_notification_recipients').upsert(
        {
          family_id: params.familyId,
          recipient_member_id: params.recipientMemberId,
          is_active: params.isActive,
          notification_channels: params.channels ?? ['in_app'],
        },
        { onConflict: 'family_id,recipient_member_id' },
      )
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-notification-recipients', vars.familyId] })
      queryClient.invalidateQueries({ queryKey: ['safety-is-recipient'] })
    },
  })
}

// ── Flags — history (Screen 4) + detail (Screen 3) ──────────────────────────

export interface SafetyFlagFilters {
  memberId?: string
  category?: SafetyCategory
  includeDismissed?: boolean
}

const FLAG_PAGE_SIZE = 20

export function useSafetyFlags(familyId: string | undefined, filters: SafetyFlagFilters, page = 0) {
  return useQuery({
    queryKey: ['safety-flags', familyId, filters, page],
    queryFn: async () => {
      if (!familyId) return { rows: [] as SafetyFlagRow[], total: 0 }
      let query = supabase
        .from('safety_flags')
        .select(SAFE_FLAG_COLUMNS, { count: 'exact' })
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
      if (filters.memberId) query = query.eq('flagged_member_id', filters.memberId)
      if (filters.category) query = query.eq('category', filters.category)
      if (!filters.includeDismissed) query = query.neq('status', 'dismissed')
      const from = page * FLAG_PAGE_SIZE
      const to = from + FLAG_PAGE_SIZE - 1
      const { data, error, count } = await query.range(from, to)
      if (error) throw error
      return { rows: (data ?? []) as unknown as SafetyFlagRow[], total: count ?? 0 }
    },
    enabled: !!familyId,
  })
}

export function useSafetyFlag(flagId: string | undefined) {
  return useQuery({
    queryKey: ['safety-flag', flagId],
    queryFn: async () => {
      if (!flagId) return null
      const { data, error } = await supabase
        .from('safety_flags')
        .select(SAFE_FLAG_COLUMNS)
        .eq('id', flagId)
        .single()
      if (error) throw error
      return data as unknown as SafetyFlagRow
    },
    enabled: !!flagId,
  })
}

export function useUpdateFlagStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { flagId: string; status: 'acknowledged' | 'dismissed'; reviewerId: string }) => {
      const { error } = await supabase
        .from('safety_flags')
        .update({ status: params.status, reviewed_at: new Date().toISOString(), reviewed_by: params.reviewerId })
        .eq('id', params.flagId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-flags'] })
      queryClient.invalidateQueries({ queryKey: ['safety-flag', vars.flagId] })
      queryClient.invalidateQueries({ queryKey: ['safety-flag-counts'] })
    },
  })
}

// ── Resources (Screen 3) ────────────────────────────────────────────────────

export function useSafetyResources(category: SafetyCategory | undefined) {
  return useQuery({
    queryKey: ['safety-resources', category],
    queryFn: async () => {
      if (!category) return []
      const { data, error } = await supabase
        .from('safety_resources')
        .select('id, category, resource_name, resource_type, resource_value, description, display_order')
        .eq('category', category)
        .order('display_order')
      if (error) throw error
      return (data ?? []) as SafetyResourceRow[]
    },
    enabled: !!category,
  })
}

// ── Family Overview column section (Screen 5) ───────────────────────────────

export interface MemberSafetySummary {
  monitored: boolean
  newCount: number
  highestSeverity: SafetySeverity | null
}

/** For each of `memberIds`: is monitoring active, how many 'new' flags, and
 * the highest severity among them. Used by the FO safety_monitoring column
 * section. Returns an empty map (never throws) when the viewer cannot read
 * safety_flags at all (RLS resolves to zero rows for non-recipients). */
export function useSafetyFlagCountsForMembers(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['safety-flag-counts', familyId, memberIds],
    queryFn: async () => {
      const map = new Map<string, MemberSafetySummary>()
      if (!familyId || memberIds.length === 0) return map

      const { data: configs } = await supabase
        .from('safety_monitoring_configs')
        .select('monitored_member_id, is_active')
        .eq('family_id', familyId)
        .in('monitored_member_id', memberIds)
      for (const c of configs ?? []) {
        map.set(c.monitored_member_id, { monitored: c.is_active, newCount: 0, highestSeverity: null })
      }

      const { data: flags } = await supabase
        .from('safety_flags')
        .select('flagged_member_id, severity')
        .eq('family_id', familyId)
        .eq('status', 'new')
        .in('flagged_member_id', memberIds)
      for (const f of flags ?? []) {
        const entry = map.get(f.flagged_member_id) ?? { monitored: true, newCount: 0, highestSeverity: null }
        entry.newCount += 1
        const sev = f.severity as SafetySeverity
        if (!entry.highestSeverity || rank(sev) > rank(entry.highestSeverity)) entry.highestSeverity = sev
        map.set(f.flagged_member_id, entry)
      }
      return map
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

function rank(s: SafetySeverity): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1
}

// ── Weekly pattern digest (SM-C — Build Item 13) ────────────────────────────

export interface SafetyPatternSummaryRow {
  id: string
  family_id: string
  monitored_member_id: string
  period_start: string
  period_end: string
  summary_data: {
    category_counts: Record<SafetyCategory, number>
    total_flags: number
    severity_breakdown: Record<'concern' | 'warning' | 'critical', number>
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  narrative: string | null
  created_at: string
}

/** Latest weekly summary per monitored member (part of the flag history
 * surface — PRD §Flows "Weekly summary ... digest view"). RLS scopes this
 * to mom + active safety_notification_recipients, same as safety_flags. */
export function useLatestSafetyPatternSummaries(familyId: string | undefined) {
  return useQuery({
    queryKey: ['safety-pattern-summaries', familyId],
    queryFn: async () => {
      if (!familyId) return [] as SafetyPatternSummaryRow[]
      const { data, error } = await supabase
        .from('safety_pattern_summaries')
        .select('id, family_id, monitored_member_id, period_start, period_end, summary_data, narrative, created_at')
        .eq('family_id', familyId)
        .order('period_end', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as unknown as SafetyPatternSummaryRow[]
      // One row per member — most recent period_end only (sorted above).
      const latestByMember = new Map<string, SafetyPatternSummaryRow>()
      for (const row of rows) {
        if (!latestByMember.has(row.monitored_member_id)) latestByMember.set(row.monitored_member_id, row)
      }
      return Array.from(latestByMember.values())
    },
    enabled: !!familyId,
  })
}
