/**
 * RewardRevealProvider — Global context for queuing reward reveals.
 *
 * Wraps the shell so any completion hook can push a ResolvedReveal onto
 * the queue. The provider renders the RewardRevealModal for the current
 * item and advances on dismiss. Also records earned prizes + increments
 * times_revealed automatically.
 *
 * Usage in a shell:
 *   <RewardRevealProvider>
 *     <MomShell>...</MomShell>
 *   </RewardRevealProvider>
 *
 * Usage in a hook's onSuccess:
 *   const { queueReveal } = useRewardRevealQueue()
 *   // after completion:
 *   const resolved = await checkRevealTrigger(...)
 *   if (resolved) queueReveal(resolved, memberId)
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { RewardRevealModal } from './RewardRevealModal'
import {
  useRecordRevealFired,
  useRecordEarnedPrize,
} from '@/hooks/useRewardReveals'
import type { ResolvedReveal } from '@/types/reward-reveals'

interface QueuedReveal {
  reveal: ResolvedReveal
  memberId: string
  familyId: string
}

interface RewardRevealContextValue {
  /** Push a resolved reveal onto the display queue */
  queueReveal: (reveal: ResolvedReveal, memberId: string, familyId: string) => void
}

const RewardRevealContext = createContext<RewardRevealContextValue>({
  queueReveal: () => {},
})

export function useRewardRevealQueue() {
  return useContext(RewardRevealContext)
}

export function RewardRevealProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedReveal[]>([])
  const recordFired = useRecordRevealFired()
  const recordEarned = useRecordEarnedPrize()

  const queueReveal = useCallback(
    (reveal: ResolvedReveal, memberId: string, familyId: string) => {
      setQueue((q) => [...q, { reveal, memberId, familyId }])
    },
    [],
  )

  const currentItem = queue[0] ?? null

  const handleRevealed = useCallback(() => {
    if (!currentItem) return
    const { reveal, memberId, familyId } = currentItem
    const { attachment, prize, animation } = reveal

    // Record that the reveal fired (increment times_revealed)
    recordFired.mutate(attachment.id)

    // Record the earned prize (Prize Box) — skip celebration_only
    if (prize.prize_type !== 'celebration_only') {
      recordEarned.mutate({
        family_id: familyId,
        family_member_id: memberId,
        reward_reveal_id: reveal.reveal.id,
        attachment_id: attachment.id,
        source_type: attachment.source_type,
        source_id: attachment.source_id,
        prize_type: prize.prize_type,
        prize_text: prize.prize_text,
        prize_name: prize.prize_name,
        prize_image_url: prize.prize_image_url,
        prize_asset_key: prize.prize_asset_key,
        animation_slug: animation.slug,
      })
    }
  }, [currentItem, recordFired, recordEarned])

  const advanceQueue = useCallback(() => {
    setQueue((q) => q.slice(1))
  }, [])

  return (
    <RewardRevealContext.Provider value={{ queueReveal }}>
      {children}
      {currentItem && (
        <RewardRevealModal
          reveal={currentItem.reveal}
          onClose={advanceQueue}
          onRevealed={handleRevealed}
        />
      )}
    </RewardRevealContext.Provider>
  )
}
