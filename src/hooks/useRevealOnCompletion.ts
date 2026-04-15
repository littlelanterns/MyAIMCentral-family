/**
 * useRevealOnCompletion — Lightweight hook for wiring reward reveals
 * into any completion flow.
 *
 * Returns a `checkAndQueueReveal` function that components call in their
 * completion handler's onSuccess. It checks for attached reveals,
 * resolves the animation + prize, and pushes onto the RewardRevealProvider
 * queue.
 *
 * Usage:
 *   const checkAndQueueReveal = useRevealOnCompletion()
 *
 *   completeTask.mutate(params, {
 *     onSuccess: async (data) => {
 *       // existing logic...
 *       await checkAndQueueReveal({
 *         sourceType: 'task',
 *         sourceId: data.task.id,
 *         memberId: data.completion.family_member_id,
 *         familyId: data.task.family_id,
 *         completionCount: data.completionCount ?? 1,
 *       })
 *     }
 *   })
 *
 * The function is async but non-blocking — failures are caught and
 * logged, never preventing the underlying completion from succeeding.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useRewardRevealQueue } from '@/components/reward-reveals/RewardRevealProvider'
import {
  checkRevealTrigger,
  useRevealAnimations,
} from '@/hooks/useRewardReveals'
import type { RevealSourceType, RevealAnimation } from '@/types/reward-reveals'

interface CheckRevealParams {
  sourceType: RevealSourceType
  sourceId: string
  memberId: string
  familyId: string
  /** Total completion count including this one (for every_n triggers) */
  completionCount?: number
}

export function useRevealOnCompletion() {
  const { queueReveal } = useRewardRevealQueue()
  const { data: animations } = useRevealAnimations()

  // Keep animations in a ref so the callback always has the latest
  const animationsRef = useRef<RevealAnimation[]>([])
  useEffect(() => {
    if (animations) animationsRef.current = animations
  }, [animations])

  return useCallback(
    async ({
      sourceType,
      sourceId,
      memberId,
      familyId,
      completionCount = 1,
    }: CheckRevealParams) => {
      try {
        const anims = animationsRef.current
        if (anims.length === 0) return // Library not loaded yet

        const resolved = await checkRevealTrigger(
          sourceType,
          sourceId,
          memberId,
          completionCount,
          anims,
        )

        if (resolved) {
          queueReveal(resolved, memberId, familyId)
        }
      } catch (err) {
        // Reward reveals are additive — never block the completion
        console.warn('[useRevealOnCompletion] check failed (non-blocking):', err)
      }
    },
    [queueReveal],
  )
}
