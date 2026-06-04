import { useEffect, useCallback, useState, useId } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { PendingReveal, PresentationMode } from '@/types/contracts'

export function usePendingReveals(memberId: string | undefined) {
  const queryClient = useQueryClient()
  const [activeReveal, setActiveReveal] = useState<PendingReveal | null>(null)
  // Stable per-hook-instance id. ContractRevealWatcher mounts in every shell, so
  // View-As (which mounts the target's shell while the viewer's shell is live)
  // double-mounts this hook. Supabase reuses a channel by exact topic name, so a
  // shared `pending-reveals-${memberId}` topic causes the second instance to grab
  // an already-subscribed channel and call `.on()` after `.subscribe()` →
  // "cannot add postgres_changes callbacks after subscribe()" → black screen.
  const instanceId = useId()

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
    // No polling — Realtime subscription below invalidates this query on INSERT.
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!memberId) return
    // `.on('postgres_changes', ...)` MUST be registered before `.subscribe()`.
    const channel = supabase
      .channel(`pending-reveals-${memberId}:${instanceId}`)
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
      // removeChannel both unsubscribes and removes the channel from the client
      // registry so a remount creates a fresh channel rather than reusing a
      // stale (still-subscribed) one.
      supabase.removeChannel(channel)
    }
  }, [memberId, instanceId, queryClient])

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
