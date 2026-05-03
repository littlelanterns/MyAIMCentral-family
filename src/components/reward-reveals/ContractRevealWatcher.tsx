import { useEffect, useCallback, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { usePendingReveals, isRevealAnimationMode } from '@/hooks/usePendingReveals'
import { useRewardRevealQueue } from './RewardRevealProvider'
import type { RevealAnimation, ResolvedReveal } from '@/types/reward-reveals'
import type { PendingReveal } from '@/types/contracts'

interface ContractRevealWatcherProps {
  memberId: string | undefined
  familyId: string | undefined
}

export function ContractRevealWatcher({ memberId, familyId }: ContractRevealWatcherProps) {
  const { activeReveal, dismissReveal } = usePendingReveals(memberId)
  const { queueReveal } = useRewardRevealQueue()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const processedRef = useRef<Set<string>>(new Set())

  const { data: animations } = useQuery({
    queryKey: ['reveal-animations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reveal_animations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      return (data ?? []) as RevealAnimation[]
    },
    staleTime: 5 * 60_000,
  })

  const handleColoringAdvance = useCallback(
    async (mid: string) => {
      const { data: activeReveals } = await supabase
        .from('member_coloring_reveals')
        .select('id')
        .eq('family_member_id', mid)
        .eq('is_active', true)
        .eq('is_complete', false)
        .limit(1)
        .single()

      if (activeReveals?.id) {
        await supabase.rpc('advance_coloring_reveal', { p_reveal_id: activeReveals.id })
      }
    },
    [],
  )

  useEffect(() => {
    if (!activeReveal || !memberId || !familyId) return
    if (processedRef.current.has(activeReveal.id)) return
    processedRef.current.add(activeReveal.id)

    if (activeReveal.presentation_mode === 'toast') {
      const godmotherLabel = activeReveal.godmother_type.replace(/_godmother$/, '').replace(/_/g, ' ')
      setToastMessage(activeReveal.metadata?.payload_text as string ?? `Reward earned: ${godmotherLabel}`)
      const timer = setTimeout(() => {
        setToastMessage(null)
        dismissReveal()
      }, 4000)
      return () => clearTimeout(timer)
    }

    if (activeReveal.presentation_mode === 'coloring_advance') {
      handleColoringAdvance(memberId).then(() => dismissReveal())
      return
    }

    if (isRevealAnimationMode(activeReveal.presentation_mode) && animations?.length) {
      const anim = activeReveal.animation_slug
        ? animations.find((a) => a.slug === activeReveal.animation_slug)
        : animations[0]

      if (anim) {
        const resolved = buildSyntheticReveal(anim, activeReveal)
        queueReveal(resolved, memberId, familyId)
      }
      dismissReveal()
      return
    }

    dismissReveal()
  }, [activeReveal, memberId, familyId, animations, queueReveal, dismissReveal, handleColoringAdvance])

  if (!toastMessage) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg"
      style={{
        background: 'var(--color-accent-deep)',
        color: 'var(--color-text-on-primary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {toastMessage}
    </div>
  )
}

function buildSyntheticReveal(animation: RevealAnimation, pending: PendingReveal): ResolvedReveal {
  return {
    attachment: {
      id: pending.id,
      family_id: '',
      reward_reveal_id: '',
      source_type: 'task',
      source_id: 'contract-grant',
      family_member_id: null,
      is_repeating: false,
      reveal_trigger_mode: 'on_completion',
      reveal_trigger_n: null,
      times_revealed: 0,
      last_revealed_at: null,
      is_active: true,
      created_at: pending.created_at,
      updated_at: pending.created_at,
    },
    reveal: {
      id: '',
      family_id: '',
      created_by: '',
      name: 'Contract Reward',
      animation_ids: [animation.id],
      animation_rotation: 'sequential',
      prize_mode: 'fixed',
      prize_type: 'celebration_only',
      prize_text: pending.metadata?.payload_text as string ?? null,
      prize_name: null,
      prize_image_url: null,
      prize_asset_key: null,
      prize_pool: [],
      prize_randomizer_list_id: null,
      is_active: true,
      created_at: pending.created_at,
      updated_at: pending.created_at,
    },
    animation,
    prize: {
      prize_type: 'celebration_only',
      prize_text: pending.metadata?.payload_text as string ?? null,
      prize_name: null,
      prize_image_url: null,
      prize_asset_key: null,
    },
  }
}
