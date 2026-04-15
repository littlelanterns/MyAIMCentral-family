// Reward Reveals — Universal Celebration System hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  RewardReveal,
  RewardRevealInput,
  RewardRevealAttachment,
  AttachRevealInput,
  RevealAnimation,
  CongratulationsMessage,
  RevealSourceType,
  ResolvedReveal,
  ResolvedPrize,
  PrizePoolEntry,
  EarnedPrize,
  EarnedPrizeInput,
} from '@/types/reward-reveals'

// ============================================================
// Reveal Animations (read-only library)
// ============================================================

export function useRevealAnimations() {
  return useQuery({
    queryKey: ['reveal-animations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reveal_animations')
        .select('*')
        .eq('is_active', true)
        .order('style_category')
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as RevealAnimation[]
    },
    staleTime: 1000 * 60 * 30, // 30 min — platform data, rarely changes
  })
}

// ============================================================
// Reward Reveals (family CRUD)
// ============================================================

export function useRewardReveals(familyId: string | undefined) {
  return useQuery({
    queryKey: ['reward-reveals', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_reveals')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as RewardReveal[]
    },
    enabled: !!familyId,
  })
}

export function useRewardReveal(id: string | undefined) {
  return useQuery({
    queryKey: ['reward-reveal', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('reward_reveals')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as RewardReveal
    },
    enabled: !!id,
  })
}

export function useCreateRewardReveal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RewardRevealInput) => {
      const { data, error } = await supabase
        .from('reward_reveals')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as RewardReveal
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reward-reveals', data.family_id] })
    },
  })
}

export function useUpdateRewardReveal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<RewardRevealInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('reward_reveals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RewardReveal
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reward-reveals', data.family_id] })
      qc.invalidateQueries({ queryKey: ['reward-reveal', data.id] })
    },
  })
}

export function useDeleteRewardReveal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('reward_reveals')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      return { id, familyId }
    },
    onSuccess: ({ familyId }) => {
      qc.invalidateQueries({ queryKey: ['reward-reveals', familyId] })
    },
  })
}

// ============================================================
// Reward Reveal Attachments
// ============================================================

export function useRewardRevealAttachments(
  sourceType: RevealSourceType | undefined,
  sourceId: string | undefined,
) {
  return useQuery({
    queryKey: ['reward-reveal-attachments', sourceType, sourceId],
    queryFn: async () => {
      if (!sourceType || !sourceId) return []
      const { data, error } = await supabase
        .from('reward_reveal_attachments')
        .select('*')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []) as RewardRevealAttachment[]
    },
    enabled: !!sourceType && !!sourceId,
  })
}

export function useAttachReveal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AttachRevealInput) => {
      const { data, error } = await supabase
        .from('reward_reveal_attachments')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as RewardRevealAttachment
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ['reward-reveal-attachments', data.source_type, data.source_id],
      })
    },
  })
}

export function useDetachReveal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      sourceType,
      sourceId,
    }: {
      id: string
      sourceType: RevealSourceType
      sourceId: string
    }) => {
      const { error } = await supabase
        .from('reward_reveal_attachments')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      return { sourceType, sourceId }
    },
    onSuccess: ({ sourceType, sourceId }) => {
      qc.invalidateQueries({
        queryKey: ['reward-reveal-attachments', sourceType, sourceId],
      })
    },
  })
}

/** Increment times_revealed and set last_revealed_at after a reveal fires */
export function useRecordRevealFired() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      // Read current value, increment, write back
      const { data: current, error: readErr } = await supabase
        .from('reward_reveal_attachments')
        .select('times_revealed, source_type, source_id')
        .eq('id', attachmentId)
        .single()
      if (readErr) throw readErr

      const { error } = await supabase
        .from('reward_reveal_attachments')
        .update({
          times_revealed: (current.times_revealed ?? 0) + 1,
          last_revealed_at: new Date().toISOString(),
        })
        .eq('id', attachmentId)
      if (error) throw error
      return current as { source_type: string; source_id: string }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ['reward-reveal-attachments', data.source_type, data.source_id],
      })
    },
  })
}

// ============================================================
// Congratulations Messages
// ============================================================

export function useCongratulationsMessages(familyId?: string | null) {
  return useQuery({
    queryKey: ['congratulations-messages', familyId ?? 'system'],
    queryFn: async () => {
      let query = supabase
        .from('congratulations_messages')
        .select('*')
        .order('category')
        .order('sort_order')

      if (familyId) {
        // System + this family's custom messages
        query = query.or(`is_system.eq.true,family_id.eq.${familyId}`)
      } else {
        query = query.eq('is_system', true)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as CongratulationsMessage[]
    },
    staleTime: 1000 * 60 * 10, // 10 min
  })
}

// ============================================================
// Check Reveal Trigger — the core "should a reveal fire?" logic
// ============================================================

/**
 * Checks whether a reward reveal should fire for a given source completion.
 *
 * @param sourceType - what was completed
 * @param sourceId - the completed item's ID
 * @param memberId - the family member who completed it
 * @param completionCount - how many times this source has been completed
 *                          (for every_n mode: total completions including this one)
 * @param animations - the full animation library (pass from useRevealAnimations)
 *
 * Returns null if no reveal should fire, or a ResolvedReveal if one should.
 */
export function useCheckRevealTrigger(
  sourceType: RevealSourceType | undefined,
  sourceId: string | undefined,
  memberId: string | undefined,
  completionCount: number,
  animations: RevealAnimation[],
) {
  return useQuery({
    queryKey: [
      'check-reveal-trigger',
      sourceType,
      sourceId,
      memberId,
      completionCount,
    ],
    queryFn: async (): Promise<ResolvedReveal | null> => {
      if (!sourceType || !sourceId) return null

      // Find active attachments for this source
      const { data: attachments, error: attErr } = await supabase
        .from('reward_reveal_attachments')
        .select('*')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('is_active', true)
      if (attErr) throw attErr
      if (!attachments || attachments.length === 0) return null

      // Filter to attachments matching this member (or all-member attachments)
      const matching = (attachments as RewardRevealAttachment[]).filter(
        (a) => a.family_member_id === null || a.family_member_id === memberId,
      )
      if (matching.length === 0) return null

      // Check each attachment's trigger condition
      for (const attachment of matching) {
        if (!shouldTrigger(attachment, completionCount)) continue

        // Non-repeating and already fired? Skip.
        if (!attachment.is_repeating && attachment.times_revealed > 0) continue

        // Load the reveal config
        const { data: reveal, error: revErr } = await supabase
          .from('reward_reveals')
          .select('*')
          .eq('id', attachment.reward_reveal_id)
          .eq('is_active', true)
          .single()
        if (revErr || !reveal) continue

        const revealData = reveal as RewardReveal
        const animation = resolveAnimation(
          revealData,
          attachment.times_revealed,
          animations,
        )
        if (!animation) continue

        const prize = resolvePrize(revealData, attachment.times_revealed)

        return {
          attachment,
          reveal: revealData,
          animation,
          prize,
        }
      }

      return null
    },
    enabled: !!sourceType && !!sourceId && animations.length > 0,
    staleTime: 0, // Always re-check
    gcTime: 0,
  })
}

// ============================================================
// Internal helpers
// ============================================================

function shouldTrigger(
  attachment: RewardRevealAttachment,
  completionCount: number,
): boolean {
  switch (attachment.reveal_trigger_mode) {
    case 'on_completion':
      return true
    case 'every_n': {
      const n = attachment.reveal_trigger_n
      if (!n || n <= 0) return false
      return completionCount > 0 && completionCount % n === 0
    }
    case 'on_goal':
      // on_goal fires once when the goal threshold is met
      // The caller is responsible for only calling this at goal-met time
      return true
    default:
      return false
  }
}

function resolveAnimation(
  reveal: RewardReveal,
  timesRevealed: number,
  animations: RevealAnimation[],
): RevealAnimation | null {
  if (!reveal.animation_ids || reveal.animation_ids.length === 0) return null

  let animationId: string
  if (reveal.animation_ids.length === 1) {
    animationId = reveal.animation_ids[0]
  } else if (reveal.animation_rotation === 'random') {
    const idx = Math.floor(Math.random() * reveal.animation_ids.length)
    animationId = reveal.animation_ids[idx]
  } else {
    // sequential rotation
    const idx = timesRevealed % reveal.animation_ids.length
    animationId = reveal.animation_ids[idx]
  }

  return animations.find((a) => a.id === animationId) ?? null
}

function resolvePrize(
  reveal: RewardReveal,
  timesRevealed: number,
): ResolvedPrize {
  if (reveal.prize_mode === 'fixed' || !reveal.prize_pool || reveal.prize_pool.length === 0) {
    return {
      prize_type: reveal.prize_type,
      prize_text: substituteReward(reveal.prize_text, reveal.prize_name),
      prize_name: reveal.prize_name,
      prize_image_url: reveal.prize_image_url,
      prize_asset_key: reveal.prize_asset_key,
    }
  }

  const pool = reveal.prize_pool as PrizePoolEntry[]
  let entry: PrizePoolEntry

  if (reveal.prize_mode === 'random') {
    const idx = Math.floor(Math.random() * pool.length)
    entry = pool[idx]
  } else {
    // sequential
    const idx = timesRevealed % pool.length
    entry = pool[idx]
  }

  return {
    prize_type: entry.prize_type,
    prize_text: substituteReward(entry.prize_text, entry.prize_name),
    prize_name: entry.prize_name,
    prize_image_url: entry.prize_image_url,
    prize_asset_key: entry.prize_asset_key,
  }
}

/** Replace {reward} placeholder with the actual prize name */
function substituteReward(
  text: string | null | undefined,
  rewardName: string | null | undefined,
): string | null {
  if (!text) return null
  if (!rewardName) return text.replace(/\{reward\}/gi, '')
  return text.replace(/\{reward\}/gi, rewardName)
}

// ============================================================
// Earned Prizes (Prize Box)
// ============================================================

/** All earned prizes for a member — unredeemed first, then redeemed */
export function useEarnedPrizes(memberId: string | undefined) {
  return useQuery({
    queryKey: ['earned-prizes', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('earned_prizes')
        .select('*')
        .eq('family_member_id', memberId)
        .order('earned_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as EarnedPrize[]
    },
    enabled: !!memberId,
  })
}

/** Unredeemed prize count for badge display */
export function useUnredeemedPrizeCount(memberId: string | undefined) {
  return useQuery({
    queryKey: ['earned-prizes-unredeemed-count', memberId],
    queryFn: async () => {
      if (!memberId) return 0
      const { count, error } = await supabase
        .from('earned_prizes')
        .select('*', { count: 'exact', head: true })
        .eq('family_member_id', memberId)
        .is('redeemed_at', null)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!memberId,
  })
}

/** Record a prize as earned (called when a reveal fires) */
export function useRecordEarnedPrize() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EarnedPrizeInput) => {
      const { data, error } = await supabase
        .from('earned_prizes')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as EarnedPrize
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['earned-prizes', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['earned-prizes-unredeemed-count', data.family_member_id] })
    },
  })
}

/** Mark a prize as redeemed (mom taps "Mark Redeemed") */
export function useRedeemPrize() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      prizeId,
      redeemedBy,
      memberId,
    }: {
      prizeId: string
      redeemedBy: string
      memberId: string
    }) => {
      const { data, error } = await supabase
        .from('earned_prizes')
        .update({
          redeemed_at: new Date().toISOString(),
          redeemed_by: redeemedBy,
        })
        .eq('id', prizeId)
        .select()
        .single()
      if (error) throw error
      return { ...data, memberId } as EarnedPrize & { memberId: string }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['earned-prizes', data.memberId] })
      qc.invalidateQueries({ queryKey: ['earned-prizes-unredeemed-count', data.memberId] })
    },
  })
}

// ============================================================
// Imperative reveal check — call from completion hook onSuccess
// ============================================================

/**
 * Check if a reveal should fire for a given source completion.
 * This is the imperative version of useCheckRevealTrigger — call it
 * from mutation onSuccess callbacks where hooks can't be used.
 *
 * Returns the resolved reveal or null.
 */
export async function checkRevealTrigger(
  sourceType: RevealSourceType,
  sourceId: string,
  memberId: string,
  completionCount: number,
  animations: RevealAnimation[],
): Promise<ResolvedReveal | null> {
  // Find active attachments for this source
  const { data: attachments, error: attErr } = await supabase
    .from('reward_reveal_attachments')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('is_active', true)
  if (attErr || !attachments || attachments.length === 0) return null

  // Filter to attachments matching this member (or all-member attachments)
  const matching = (attachments as RewardRevealAttachment[]).filter(
    (a) => a.family_member_id === null || a.family_member_id === memberId,
  )
  if (matching.length === 0) return null

  for (const attachment of matching) {
    if (!shouldTrigger(attachment, completionCount)) continue
    if (!attachment.is_repeating && attachment.times_revealed > 0) continue

    const { data: reveal, error: revErr } = await supabase
      .from('reward_reveals')
      .select('*')
      .eq('id', attachment.reward_reveal_id)
      .eq('is_active', true)
      .single()
    if (revErr || !reveal) continue

    const revealData = reveal as RewardReveal
    const animation = resolveAnimation(revealData, attachment.times_revealed, animations)
    if (!animation) continue

    const prize = resolvePrize(revealData, attachment.times_revealed)

    return { attachment, reveal: revealData, animation, prize }
  }

  return null
}
