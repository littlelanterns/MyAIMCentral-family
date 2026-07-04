/**
 * useRewardProposals — KIDS-REWARDS-PAGE Slice 4 (gate §5/§6, ruling R3).
 *
 * CRUD + lifecycle mutations for reward_proposals, following the useRequests
 * pattern (notifications on every lifecycle event, queue-badge invalidation).
 *
 * Visibility is enforced by RLS (migration 100278) — proposer sees own,
 * primary parent sees kid proposals (+ adults' self-proposals unless the
 * personal_rewards_privacy grant hides them). These hooks never rely on
 * client filtering for privacy.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { createNotification } from '@/utils/createNotification'
import type {
  ProposalArtifactType,
  ProposalTerms,
  RewardProposal,
  RewardProposalWithProposer,
} from '@/types/rewardProposals'

function invalidateProposalKeys(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['reward-proposals-mine'] })
  qc.invalidateQueries({ queryKey: ['reward-proposals-parent'] })
  qc.invalidateQueries({ queryKey: ['queue-badge-proposals'] })
}

// ─── My proposals (kid list + counter responses; excludes self-proposals) ────

export function useMyRewardProposals(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ['reward-proposals-mine', memberId],
    queryFn: async (): Promise<RewardProposal[]> => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reward_proposals')
        .select('*')
        .eq('proposer_member_id', memberId)
        .eq('is_self_proposal', false)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as RewardProposal[]
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

// ─── My self-proposals (adult "promise yourself" history — gate §6/§11) ──────

export function useMySelfProposals(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ['reward-proposals-mine', memberId, 'self'],
    queryFn: async (): Promise<RewardProposal[]> => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('reward_proposals')
        .select('*')
        .eq('proposer_member_id', memberId)
        .eq('is_self_proposal', true)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as RewardProposal[]
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

// ─── Parent queue: proposals waiting on mom (pending + counter_accepted) ─────

export function usePendingProposalsForParent(
  familyId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['reward-proposals-parent', familyId],
    queryFn: async (): Promise<RewardProposalWithProposer[]> => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('reward_proposals')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_self_proposal', false)
        .in('status', ['pending', 'counter_accepted'])
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!data || data.length === 0) return []

      const proposerIds = [...new Set(data.map(p => p.proposer_member_id))]
      const { data: members } = await supabase
        .from('family_members')
        .select('id, display_name, avatar_url, assigned_color, member_color')
        .in('id', proposerIds)
      const memberMap = new Map(members?.map(m => [m.id, m]) ?? [])

      return (data as RewardProposal[]).map(p => {
        const proposer = memberMap.get(p.proposer_member_id)
        return {
          ...p,
          proposer_display_name: proposer?.display_name,
          proposer_avatar_url: proposer?.avatar_url ?? null,
          proposer_assigned_color: proposer?.assigned_color ?? null,
          proposer_member_color: proposer?.member_color ?? null,
        }
      })
    },
    enabled: !!familyId && enabled,
    staleTime: 30_000,
  })
}

// ─── Create (kid submit → pending, notify mom) ───────────────────────────────

export function useCreateRewardProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      familyId,
      proposerId,
      proposerName,
      terms,
    }: {
      familyId: string
      proposerId: string
      proposerName: string
      terms: ProposalTerms
    }) => {
      const { data, error } = await supabase
        .from('reward_proposals')
        .insert({
          family_id: familyId,
          proposer_member_id: proposerId,
          is_self_proposal: false,
          status: 'pending',
          terms,
        })
        .select('id')
        .single()
      if (error) throw error

      // Notify mom (her queue is the decision inbox — Convention #66)
      const { data: mom } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('role', 'primary_parent')
        .limit(1)
        .maybeSingle()
      if (mom?.id) {
        await createNotification({
          family_id: familyId,
          recipient_member_id: mom.id,
          notification_type: 'reward_proposal_received',
          category: 'requests',
          title: `${proposerName} proposed a deal`,
          body: `"${terms.want_text}" if: ${terms.will_text}`,
          source_type: 'reward_proposal',
          source_reference_id: data.id,
          action_url: '/queue?tab=requests',
        })
      }
      return data
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Accept (mom's prefill-confirm finalized → artifact refs stamped) ────────

export function useAcceptRewardProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposal,
      processedBy,
      processorName,
      artifactType,
      artifactId,
    }: {
      proposal: RewardProposal
      processedBy: string
      processorName: string
      artifactType: ProposalArtifactType
      artifactId: string | null
    }) => {
      const { error } = await supabase
        .from('reward_proposals')
        .update({
          status: 'accepted',
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
          created_artifact_type: artifactType,
          created_artifact_id: artifactId,
        })
        .eq('id', proposal.id)
      if (error) throw error

      await createNotification({
        family_id: proposal.family_id,
        recipient_member_id: proposal.proposer_member_id,
        notification_type: 'reward_proposal_outcome',
        category: 'requests',
        title: `Deal! ${processorName} said yes`,
        body: `"${(proposal.counter_terms ?? proposal.terms).want_text}" is on — go earn it!`,
        source_type: 'reward_proposal',
        source_reference_id: proposal.id,
        action_url: '/my-rewards',
      })
      return { proposalId: proposal.id }
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Counter (mom's revised terms — ONE round, gate §5) ──────────────────────

export function useCounterRewardProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposal,
      counterTerms,
      counterNote,
      processedBy,
      processorName,
    }: {
      proposal: RewardProposal
      counterTerms: ProposalTerms
      counterNote?: string
      processedBy: string
      processorName: string
    }) => {
      const { error } = await supabase
        .from('reward_proposals')
        .update({
          status: 'countered',
          counter_terms: counterTerms,
          counter_note: counterNote?.trim() || null,
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)
      if (error) throw error

      await createNotification({
        family_id: proposal.family_id,
        recipient_member_id: proposal.proposer_member_id,
        notification_type: 'reward_proposal_countered',
        category: 'requests',
        title: `${processorName} made a counteroffer`,
        body: `"${counterTerms.want_text}" if: ${counterTerms.will_text} — accept or decline on your rewards page`,
        source_type: 'reward_proposal',
        source_reference_id: proposal.id,
        action_url: '/my-rewards',
      })
      return { proposalId: proposal.id }
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Decline (mom declines a proposal) ───────────────────────────────────────

export function useDeclineRewardProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposal,
      declineNote,
      processedBy,
      processorName,
    }: {
      proposal: RewardProposal
      declineNote?: string
      processedBy: string
      processorName: string
    }) => {
      const { error } = await supabase
        .from('reward_proposals')
        .update({
          status: 'declined',
          decline_note: declineNote?.trim() || null,
          processed_by: processedBy,
          processed_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)
      if (error) throw error

      await createNotification({
        family_id: proposal.family_id,
        recipient_member_id: proposal.proposer_member_id,
        notification_type: 'reward_proposal_outcome',
        category: 'requests',
        title: `Not this time`,
        body: declineNote?.trim()
          ? `${processorName} declined: "${declineNote.trim()}"`
          : `${processorName} declined your proposal — you can always pitch a new one!`,
        source_type: 'reward_proposal',
        source_reference_id: proposal.id,
        action_url: '/my-rewards',
      })
      return { proposalId: proposal.id }
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Kid responds to the counter (accept → counter_accepted / decline) ───────

export function useRespondToCounter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      proposal,
      accept,
      responderName,
    }: {
      proposal: RewardProposal
      accept: boolean
      responderName: string
    }) => {
      const { error } = await supabase
        .from('reward_proposals')
        .update({
          status: accept ? 'counter_accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', proposal.id)
        .eq('status', 'countered') // guard: only a live counter can be answered
      if (error) throw error

      // Tell mom the outcome — an accepted counter returns to her queue for setup
      if (proposal.processed_by) {
        await createNotification({
          family_id: proposal.family_id,
          recipient_member_id: proposal.processed_by,
          notification_type: 'reward_proposal_counter_response',
          category: 'requests',
          title: accept
            ? `${responderName} accepted your counteroffer`
            : `${responderName} passed on your counteroffer`,
          body: accept
            ? `"${proposal.counter_terms?.want_text ?? ''}" — set it up from your queue`
            : `The proposal is closed.`,
          source_type: 'reward_proposal',
          source_reference_id: proposal.id,
          action_url: accept ? '/queue?tab=requests' : undefined,
        })
      }
      return { proposalId: proposal.id, accepted: accept }
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Self-propose (gate §6/§11): one shot, recorded AFTER the artifact saves ─
// Negotiation collapsed — proposer and approver are the same person, so the
// row is born 'accepted' with artifact refs. Inserting only after the creation
// modal saves means a cancelled setup leaves no orphaned proposal.

export function useCreateSelfProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      familyId,
      proposerId,
      terms,
      artifactType,
      artifactId,
    }: {
      familyId: string
      proposerId: string
      terms: ProposalTerms
      artifactType: ProposalArtifactType
      artifactId: string | null
    }) => {
      const { data, error } = await supabase
        .from('reward_proposals')
        .insert({
          family_id: familyId,
          proposer_member_id: proposerId,
          is_self_proposal: true,
          status: 'accepted',
          terms,
          processed_by: proposerId,
          processed_at: new Date().toISOString(),
          created_artifact_type: artifactType,
          created_artifact_id: artifactId,
        })
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}

// ─── Withdraw (proposer deletes own still-pending proposal) ──────────────────

export function useWithdrawRewardProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ proposalId }: { proposalId: string }) => {
      const { error } = await supabase
        .from('reward_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('status', 'pending')
      if (error) throw error
      return { proposalId }
    },
    onSuccess: () => invalidateProposalKeys(qc),
  })
}
