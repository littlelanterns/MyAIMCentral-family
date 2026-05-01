import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  PendingChange,
  PendingChangeSourceType,
  CreatePendingChangeInput,
} from '@/types/pendingChanges'
import { useFamily } from './useFamily'
import { useFamilyMember } from './useFamilyMember'
import { applyPendingChanges } from '@/lib/pendingChanges/applyPendingChanges'

export function usePendingChangesForSource(
  sourceType: PendingChangeSourceType | undefined,
  sourceId: string | undefined,
) {
  return useQuery({
    queryKey: ['pending-changes', sourceType, sourceId],
    queryFn: async () => {
      if (!sourceType || !sourceId) return []
      const { data, error } = await supabase
        .from('pending_changes')
        .select('*')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .is('applied_at', null)
        .is('cancelled_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as PendingChange[]
    },
    enabled: !!sourceType && !!sourceId,
  })
}

export function usePendingChangesForFamily() {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: ['pending-changes', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('pending_changes')
        .select('*')
        .eq('family_id', familyId)
        .is('applied_at', null)
        .is('cancelled_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as PendingChange[]
    },
    enabled: !!familyId,
  })
}

export function useCreatePendingChange() {
  const queryClient = useQueryClient()
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()

  return useMutation({
    mutationFn: async (input: CreatePendingChangeInput) => {
      if (!family?.id || !member?.id) throw new Error('Missing family or member context')
      const { data, error } = await supabase
        .from('pending_changes')
        .insert({
          family_id: family.id,
          created_by: member.id,
          source_type: input.source_type,
          source_id: input.source_id,
          change_category: input.change_category,
          change_payload: input.change_payload,
          trigger_mode: input.trigger_mode,
          trigger_at: input.trigger_at ?? null,
          affected_deployment_ids: input.affected_deployment_ids ?? null,
          affected_member_ids: input.affected_member_ids ?? null,
          batch_id: input.batch_id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as PendingChange
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['pending-changes', input.source_type, input.source_id] })
      queryClient.invalidateQueries({ queryKey: ['pending-changes', family?.id] })
    },
  })
}

export function useUpdatePendingChangePayload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, change_payload }: { id: string; change_payload: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('pending_changes')
        .update({ change_payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PendingChange
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-changes', data.source_type, data.source_id] })
      queryClient.invalidateQueries({ queryKey: ['pending-changes', data.family_id] })
    },
  })
}

export function useCancelPendingChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pending_changes')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PendingChange
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-changes', data.source_type, data.source_id] })
      queryClient.invalidateQueries({ queryKey: ['pending-changes', data.family_id] })
    },
  })
}

export function useApplyPendingChanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sourceType,
      sourceId,
      batchId,
    }: {
      sourceType?: PendingChangeSourceType
      sourceId?: string
      batchId?: string
    }) => {
      let query = supabase
        .from('pending_changes')
        .select('*')
        .is('applied_at', null)
        .is('cancelled_at', null)
        .order('created_at', { ascending: true })

      if (batchId) {
        query = query.eq('batch_id', batchId)
      } else if (sourceType && sourceId) {
        query = query.eq('source_type', sourceType).eq('source_id', sourceId)
      } else {
        throw new Error('Must provide either sourceType+sourceId or batchId')
      }

      const { data: changes, error: fetchError } = await query
      if (fetchError) throw fetchError
      if (!changes || changes.length === 0) return []

      const typedChanges = changes as PendingChange[]
      await applyPendingChanges(typedChanges)

      const ids = typedChanges.map(c => c.id)
      const { error: markError } = await supabase
        .from('pending_changes')
        .update({ applied_at: new Date().toISOString() })
        .in('id', ids)
      if (markError) throw markError

      return typedChanges
    },
    onSuccess: (applied) => {
      if (applied.length === 0) return

      const first = applied[0]
      queryClient.invalidateQueries({ queryKey: ['pending-changes', first.source_type, first.source_id] })
      queryClient.invalidateQueries({ queryKey: ['pending-changes', first.family_id] })

      const sourceTypes = new Set(applied.map(c => c.source_type))
      for (const st of sourceTypes) {
        if (st.startsWith('routine')) {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
          queryClient.invalidateQueries({ queryKey: ['routine-template-steps'] })
        } else if (st === 'list' || st === 'list_item') {
          queryClient.invalidateQueries({ queryKey: ['lists'] })
          queryClient.invalidateQueries({ queryKey: ['list-items'] })
        } else if (st.startsWith('sequential')) {
          queryClient.invalidateQueries({ queryKey: ['sequential-collections'] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }
      }
    },
  })
}
