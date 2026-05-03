import { useEffect, useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { PendingReveal, PresentationMode } from '@/types/contracts'

export function usePendingReveals(memberId: string | undefined) {
  const queryClient = useQueryClient()
  const [activeReveal, setActiveReveal] = useState<PendingReveal | null>(null)

  const { data: pendingReveals = [] } = useQuery({
    queryKey: ['pending-reveals', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('contract_grant_log')
        .select('id, presentation_mode, animation_slug, godmother_type, metadata, created_at')
        .eq('family_member_id', memberId)
        .eq('status', 'granted')
        .not('presentation_mode', 'eq', 'silent')
        .is('revealed_at', null)
        .order('created_at', { ascending: true })
      if (error) {
        console.warn('usePendingReveals query failed:', error)
        return []
      }
      return (data ?? []) as PendingReveal[]
    },
    enabled: !!memberId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!memberId) return
    const channel = supabase
      .channel(`pending-reveals-${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contract_grant_log',
          filter: `family_member_id=eq.${memberId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (
            row.status === 'granted' &&
            row.presentation_mode &&
            row.presentation_mode !== 'silent' &&
            !row.revealed_at
          ) {
            queryClient.invalidateQueries({ queryKey: ['pending-reveals', memberId] })
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId, queryClient])

  useEffect(() => {
    if (pendingReveals.length > 0 && !activeReveal) {
      setActiveReveal(pendingReveals[0])
    }
  }, [pendingReveals, activeReveal])

  const markRevealed = useCallback(
    async (grantLogId: string) => {
      await supabase
        .from('contract_grant_log')
        .update({ revealed_at: new Date().toISOString() })
        .eq('id', grantLogId)
      setActiveReveal(null)
      queryClient.invalidateQueries({ queryKey: ['pending-reveals', memberId] })
    },
    [memberId, queryClient],
  )

  const dismissReveal = useCallback(() => {
    if (activeReveal) {
      markRevealed(activeReveal.id)
    }
  }, [activeReveal, markRevealed])

  return {
    pendingReveals,
    activeReveal,
    markRevealed,
    dismissReveal,
    hasPendingReveals: pendingReveals.length > 0,
  }
}

export function isRevealAnimationMode(mode: PresentationMode | null): boolean {
  return mode === 'reveal_animation' || mode === 'treasure_box'
}
