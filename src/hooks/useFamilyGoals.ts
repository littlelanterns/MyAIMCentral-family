/**
 * useFamilyGoals — FAMILY-GOALS-PRIZES
 *
 * CRUD for family_goals / family_goal_sources + read-only progress from the
 * append-only family_goal_contributions ledger. Contribution counting and
 * award evaluation happen entirely inside DB triggers (migration 100284) —
 * these hooks never compute progress client-side; they only read the
 * denormalized/aggregated results and invalidate caches after actions the
 * client itself performed (Convention #261 discipline).
 *
 * Query key convention: every key here starts with the literal string
 * 'family-goal' so `invalidateFamilyGoalQueries()` can fuzzy-invalidate all
 * of them (list, active list, progress, sources, candidate tasks) with one
 * predicate — see that function below.
 */

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  FamilyGoal,
  FamilyGoalSource,
  FamilyGoalSourceKind,
  FamilyGoalEarningMode,
  FamilyGoalProgress,
  FamilyGoalCandidateTask,
} from '@/types/family-goals'

// ─── Cache invalidation helper ──────────────────────────────────────────────

/**
 * Invalidates every family-goal-prefixed query key AND the earned_prizes
 * queries the Prize Board reads (a goal completion mints a new earned_prizes
 * row). Called after any client-performed action that could move a goal's
 * progress (logging a family intention tally, completing/approving a task).
 */
export function invalidateFamilyGoalQueries(qc: QueryClient, familyId?: string) {
  qc.invalidateQueries({
    predicate: (query) =>
      typeof query.queryKey[0] === 'string' && (query.queryKey[0] as string).startsWith('family-goal'),
  })
  if (familyId) {
    qc.invalidateQueries({ queryKey: ['earned-prizes', familyId] })
    qc.invalidateQueries({ queryKey: ['earned-prizes-redeemed', familyId] })
  }
}

// ─── Read: all goals (manager view — Active/Completed/Archived groups) ─────

export function useFamilyGoals(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-goals', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('family_goals')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as FamilyGoal[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

// ─── Read: active goals only (Hub section, Prize Board strip) ──────────────

export function useActiveFamilyGoals(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-goals-active', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('family_goals')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'active')
        .is('archived_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as FamilyGoal[]
    },
    enabled: !!familyId,
    staleTime: 15_000,
  })
}

// ─── Read: goals a specific member participates in (My Rewards Family section) ─

export function useFamilyGoalsForMember(familyId: string | undefined, memberId: string | undefined) {
  const { data: goals, ...rest } = useFamilyGoals(familyId)
  const filtered = (goals ?? []).filter(
    (g) => !g.archived_at && g.participating_member_ids.includes(memberId ?? ''),
  )
  return { data: memberId ? filtered : [], ...rest }
}

// ─── Read: per-goal progress (total + per-member breakdown, Mode B display) ─

export function useFamilyGoalProgress(goalId: string | undefined) {
  return useQuery({
    queryKey: ['family-goal-progress', goalId],
    queryFn: async (): Promise<FamilyGoalProgress> => {
      if (!goalId) return { total: 0, perMember: [] }
      const { data, error } = await supabase
        .from('family_goal_contributions')
        .select('member_id')
        .eq('goal_id', goalId)
      if (error) throw error
      const rows = (data ?? []) as { member_id: string }[]
      const counts = new Map<string, number>()
      for (const r of rows) counts.set(r.member_id, (counts.get(r.member_id) ?? 0) + 1)
      return {
        total: rows.length,
        perMember: Array.from(counts.entries()).map(([memberId, count]) => ({ memberId, count })),
      }
    },
    enabled: !!goalId,
    staleTime: 15_000,
  })
}

// ─── Read: sources attached to a goal (edit form pre-population) ───────────

export function useFamilyGoalSources(goalId: string | undefined) {
  return useQuery({
    queryKey: ['family-goal-sources', goalId],
    queryFn: async () => {
      if (!goalId) return []
      const { data, error } = await supabase
        .from('family_goal_sources')
        .select('*')
        .eq('goal_id', goalId)
      if (error) throw error
      return (data ?? []) as FamilyGoalSource[]
    },
    enabled: !!goalId,
  })
}

// ─── Read: candidate tasks for the "What counts" picker ────────────────────
// Active (not completed/archived) tasks assigned to (or shared with) at
// least one of the selected participants. Deliberately lightweight — this is
// a picker, not a full task query.

export function useFamilyGoalCandidateTasks(familyId: string | undefined, participantIds: string[]) {
  return useQuery({
    queryKey: ['family-goal-candidate-tasks', familyId, [...participantIds].sort().join(',')],
    queryFn: async (): Promise<FamilyGoalCandidateTask[]> => {
      if (!familyId || participantIds.length === 0) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, assignee_id, is_shared, task_type')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .or(`assignee_id.in.(${participantIds.join(',')}),is_shared.eq.true`)
        .order('title', { ascending: true })
        .limit(200)
      if (error) throw error
      return (data ?? []) as FamilyGoalCandidateTask[]
    },
    enabled: !!familyId && participantIds.length > 0,
  })
}

// ─── Create ──────────────────────────────────────────────────────────────

export interface CreateFamilyGoalParams {
  familyId: string
  createdBy: string
  title: string
  description?: string | null
  participatingMemberIds: string[]
  earningMode: FamilyGoalEarningMode
  targetCount: number
  startsAt?: string | null
  endsAt?: string | null
  prizeName: string
  prizeText?: string | null
  prizeImageUrl?: string | null
  prizeAssetKey?: string | null
  progressVisible?: boolean
  isIncludedInAi?: boolean
  /** Source rows to attach immediately after create. */
  sources: { sourceKind: FamilyGoalSourceKind; sourceId: string }[]
}

export function useCreateFamilyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: CreateFamilyGoalParams) => {
      const { data: goal, error } = await supabase
        .from('family_goals')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          title: params.title,
          description: params.description ?? null,
          participating_member_ids: params.participatingMemberIds,
          earning_mode: params.earningMode,
          target_count: params.targetCount,
          starts_at: params.startsAt ?? null,
          ends_at: params.endsAt ?? null,
          prize_name: params.prizeName,
          prize_text: params.prizeText ?? null,
          prize_image_url: params.prizeImageUrl ?? null,
          prize_asset_key: params.prizeAssetKey ?? null,
          progress_visible: params.progressVisible ?? true,
          is_included_in_ai: params.isIncludedInAi ?? true,
        })
        .select()
        .single()
      if (error) throw error

      if (params.sources.length > 0) {
        const { error: sourceError } = await supabase.from('family_goal_sources').insert(
          params.sources.map((s) => ({
            family_id: params.familyId,
            goal_id: goal.id,
            source_kind: s.sourceKind,
            source_id: s.sourceId,
          })),
        )
        if (sourceError) throw sourceError
      }

      return goal as FamilyGoal
    },
    onSuccess: (goal) => {
      invalidateFamilyGoalQueries(qc, goal.family_id)
    },
  })
}

// ─── Update (edit — never resets counted progress, Key Decision #11) ──────

export interface UpdateFamilyGoalParams {
  id: string
  familyId: string
  title?: string
  description?: string | null
  participatingMemberIds?: string[]
  earningMode?: FamilyGoalEarningMode
  targetCount?: number
  startsAt?: string | null
  endsAt?: string | null
  prizeName?: string
  prizeText?: string | null
  prizeImageUrl?: string | null
  prizeAssetKey?: string | null
  progressVisible?: boolean
  isIncludedInAi?: boolean
  /** When provided, REPLACES the goal's source set (delete-then-insert). */
  sources?: { sourceKind: FamilyGoalSourceKind; sourceId: string }[]
}

export function useUpdateFamilyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: UpdateFamilyGoalParams) => {
      const updates: Record<string, unknown> = {}
      if (params.title !== undefined) updates.title = params.title
      if (params.description !== undefined) updates.description = params.description
      if (params.participatingMemberIds !== undefined) updates.participating_member_ids = params.participatingMemberIds
      if (params.earningMode !== undefined) updates.earning_mode = params.earningMode
      if (params.targetCount !== undefined) updates.target_count = params.targetCount
      if (params.startsAt !== undefined) updates.starts_at = params.startsAt
      if (params.endsAt !== undefined) updates.ends_at = params.endsAt
      if (params.prizeName !== undefined) updates.prize_name = params.prizeName
      if (params.prizeText !== undefined) updates.prize_text = params.prizeText
      if (params.prizeImageUrl !== undefined) updates.prize_image_url = params.prizeImageUrl
      if (params.prizeAssetKey !== undefined) updates.prize_asset_key = params.prizeAssetKey
      if (params.progressVisible !== undefined) updates.progress_visible = params.progressVisible
      if (params.isIncludedInAi !== undefined) updates.is_included_in_ai = params.isIncludedInAi

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('family_goals').update(updates).eq('id', params.id)
        if (error) throw error
      }

      if (params.sources !== undefined) {
        const { error: delError } = await supabase.from('family_goal_sources').delete().eq('goal_id', params.id)
        if (delError) throw delError
        if (params.sources.length > 0) {
          const { error: insError } = await supabase.from('family_goal_sources').insert(
            params.sources.map((s) => ({
              family_id: params.familyId,
              goal_id: params.id,
              source_kind: s.sourceKind,
              source_id: s.sourceId,
            })),
          )
          if (insError) throw insError
        }
      }

      return { id: params.id, familyId: params.familyId }
    },
    onSuccess: ({ familyId }) => {
      invalidateFamilyGoalQueries(qc, familyId)
    },
  })
}

// ─── Archive (soft — hides everywhere, preserves contribution history) ─────

export function useArchiveFamilyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('family_goals')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', params.id)
      if (error) throw error
      return params
    },
    onSuccess: ({ familyId }) => {
      invalidateFamilyGoalQueries(qc, familyId)
    },
  })
}

// ─── Duplicate from completed (Key Decision #16 — cheap "re-run it") ───────

export function useDuplicateFamilyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { goalId: string; familyId: string; createdBy: string }) => {
      const { data: original, error: readError } = await supabase
        .from('family_goals')
        .select('*')
        .eq('id', params.goalId)
        .single()
      if (readError) throw readError

      const { data: sources, error: sourcesError } = await supabase
        .from('family_goal_sources')
        .select('source_kind, source_id')
        .eq('goal_id', params.goalId)
      if (sourcesError) throw sourcesError

      const { data: created, error: createError } = await supabase
        .from('family_goals')
        .insert({
          family_id: params.familyId,
          created_by: params.createdBy,
          title: original.title,
          description: original.description,
          participating_member_ids: original.participating_member_ids,
          earning_mode: original.earning_mode,
          target_count: original.target_count,
          starts_at: null,
          ends_at: null,
          prize_name: original.prize_name,
          prize_text: original.prize_text,
          prize_image_url: original.prize_image_url,
          prize_asset_key: original.prize_asset_key,
          progress_visible: original.progress_visible,
          is_included_in_ai: original.is_included_in_ai,
        })
        .select()
        .single()
      if (createError) throw createError

      if (sources && sources.length > 0) {
        const { error: insError } = await supabase.from('family_goal_sources').insert(
          sources.map((s: { source_kind: string; source_id: string }) => ({
            family_id: params.familyId,
            goal_id: created.id,
            source_kind: s.source_kind,
            source_id: s.source_id,
          })),
        )
        if (insError) throw insError
      }

      return created as FamilyGoal
    },
    onSuccess: (goal) => {
      invalidateFamilyGoalQueries(qc, goal.family_id)
    },
  })
}
