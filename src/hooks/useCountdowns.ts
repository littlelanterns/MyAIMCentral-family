/**
 * useCountdowns — PRD-14D Family Hub
 *
 * CRUD for countdowns table. Simple countdown events displayed on the Hub.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Countdown {
  id: string
  family_id: string
  created_by_member_id: string
  title: string
  emoji: string | null
  target_date: string
  show_on_target_day: boolean
  is_active: boolean
  recurring_annually: boolean
  created_at: string
  updated_at: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function daysUntil(targetDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Read active countdowns ─────────────────────────────────────────────────

export function useCountdowns(familyId: string | undefined) {
  return useQuery({
    queryKey: ['countdowns', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('target_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Countdown[]
    },
    enabled: !!familyId,
  })
}

// ─── Filter to visible countdowns (hide past unless show_on_target_day) ─────

export function useVisibleCountdowns(familyId: string | undefined) {
  const { data: countdowns, ...rest } = useCountdowns(familyId)

  const visible = (countdowns ?? []).filter((cd) => {
    const days = daysUntil(cd.target_date)
    if (days > 0) return true // Future — always show
    if (days === 0 && cd.show_on_target_day) return true // Today — show if configured
    return false // Past — hide
  })

  return { data: visible, ...rest }
}

// ─── Create countdown ───────────────────────────────────────────────────────

export function useCreateCountdown() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      createdByMemberId: string
      title: string
      emoji?: string
      targetDate: string
      showOnTargetDay?: boolean
      recurringAnnually?: boolean
    }) => {
      const { data, error } = await supabase
        .from('countdowns')
        .insert({
          family_id: params.familyId,
          created_by_member_id: params.createdByMemberId,
          title: params.title,
          emoji: params.emoji ?? null,
          target_date: params.targetDate,
          show_on_target_day: params.showOnTargetDay ?? true,
          recurring_annually: params.recurringAnnually ?? false,
        })
        .select()
        .single()
      if (error) throw error
      return data as Countdown
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['countdowns', data.family_id] })
    },
  })
}

// ─── Update countdown ───────────────────────────────────────────────────────

export function useUpdateCountdown() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      familyId: string
      title?: string
      emoji?: string | null
      targetDate?: string
      showOnTargetDay?: boolean
      isActive?: boolean
      recurringAnnually?: boolean
    }) => {
      const updates: Record<string, unknown> = {}
      if (params.title !== undefined) updates.title = params.title
      if (params.emoji !== undefined) updates.emoji = params.emoji
      if (params.targetDate !== undefined) updates.target_date = params.targetDate
      if (params.showOnTargetDay !== undefined) updates.show_on_target_day = params.showOnTargetDay
      if (params.isActive !== undefined) updates.is_active = params.isActive
      if (params.recurringAnnually !== undefined) updates.recurring_annually = params.recurringAnnually

      const { data, error } = await supabase
        .from('countdowns')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single()
      if (error) throw error
      return data as Countdown
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['countdowns', data.family_id] })
    },
  })
}

// ─── Delete countdown ───────────────────────────────────────────────────────

export function useDeleteCountdown() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('countdowns')
        .delete()
        .eq('id', params.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['countdowns', vars.familyId] })
    },
  })
}
