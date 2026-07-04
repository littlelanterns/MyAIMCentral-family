/**
 * Reward proposal types — KIDS-REWARDS-PAGE Slice 4 (gate §5/§6, ruling R3).
 *
 * A proposal is "Can I have [want] if I do [will]?" — a kid pitches mom, or a
 * mom/adult promises themself (is_self_proposal). Dedicated `reward_proposals`
 * table (R3): family_requests has no payload column and its status model
 * cannot carry the one-round counter.
 *
 * Lifecycle:
 *   pending          → mom approves (prefill-confirm) → accepted
 *                    → mom declines                   → declined
 *                    → mom counters (ONE round, §5)   → countered
 *   countered        → kid accepts                    → counter_accepted
 *                    → kid declines                   → declined
 *   counter_accepted → mom sets it up (prefill-confirm from counter_terms)
 *                                                     → accepted
 *
 * Approval is NEVER silent auto-create: 'accepted' is only reached through
 * mom (or the self-proposer) confirming the prefilled creation flow, which
 * stamps created_artifact_type/id.
 */

export type ProposalEarnStructure = 'once' | 'streak_n_days' | 'finish_list'

export type ProposalStatus =
  | 'pending'
  | 'countered'
  | 'counter_accepted'
  | 'accepted'
  | 'declined'

export type ProposalArtifactType = 'task' | 'routine' | 'tracker'

export interface ProposalTerms {
  /** The reward — "a popsicle" */
  want_text: string
  /** Three-mode reward image (RewardImagePicker): mom/kid upload URL */
  want_image_url: string | null
  /** Three-mode reward image: platform_assets feature_key */
  want_image_asset_key: string | null
  /** The commitment — "practice piano" */
  will_text: string
  /** Guided structure (§5): once → task, streak_n_days → streak tracker,
   *  finish_list → routine checklist */
  earn_structure: ProposalEarnStructure
  params: {
    /** streak_n_days: how many days in a row */
    days?: number
    /** finish_list: the list of things to finish */
    items?: string[]
  }
}

export interface RewardProposal {
  id: string
  family_id: string
  proposer_member_id: string
  is_self_proposal: boolean
  status: ProposalStatus
  terms: ProposalTerms
  counter_terms: ProposalTerms | null
  counter_note: string | null
  decline_note: string | null
  processed_by: string | null
  processed_at: string | null
  responded_at: string | null
  created_artifact_type: ProposalArtifactType | null
  created_artifact_id: string | null
  created_at: string
  updated_at: string
}

/** Parent-queue shape — proposer info joined for the card header. */
export interface RewardProposalWithProposer extends RewardProposal {
  proposer_display_name?: string
  proposer_avatar_url?: string | null
  proposer_assigned_color?: string | null
  proposer_member_color?: string | null
}

/**
 * The terms currently on the table: mom's counter REPLACES the kid's terms
 * (gate §5 — "Mom's counter replaces the terms").
 */
export function activeProposalTerms(p: RewardProposal): ProposalTerms {
  return p.counter_terms ?? p.terms
}

export const EARN_STRUCTURE_LABELS: Record<ProposalEarnStructure, string> = {
  once: 'Do one thing',
  streak_n_days: 'Do it every day',
  finish_list: 'Finish a list of things',
}

/** Human summary of the commitment side, e.g. "Practice piano — 7 days in a row". */
export function describeCommitment(terms: ProposalTerms): string {
  switch (terms.earn_structure) {
    case 'streak_n_days':
      return `${terms.will_text} — ${terms.params.days ?? '?'} days in a row`
    case 'finish_list':
      return `Finish: ${(terms.params.items ?? []).join(', ')}`
    default:
      return terms.will_text
  }
}
