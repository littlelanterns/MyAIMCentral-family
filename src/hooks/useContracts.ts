import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Contract, ContractStatus } from '@/types/contracts'

export function useContracts(familyId: string | undefined) {
  return useQuery({
    queryKey: ['contracts', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('family_id', familyId)
        .in('status', ['active', 'recently_deleted'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Contract[]
    },
    enabled: !!familyId,
    staleTime: 30_000,
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'archived_at'>) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single()
      if (error) throw error
      return data as Contract
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.family_id] })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Contract> & { id: string; family_id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Contract
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.family_id] })
    },
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'recently_deleted' as ContractStatus, deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.familyId] })
    },
  })
}

export function useRestoreContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'active' as ContractStatus, deleted_at: null })
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.familyId] })
    },
  })
}

export function useArchiveContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'archived' as ContractStatus, archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.familyId] })
    },
  })
}
