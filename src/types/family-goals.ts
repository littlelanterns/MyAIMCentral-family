/**
 * FAMILY-GOALS-PRIZES — types for family_goals / family_goal_sources /
 * family_goal_contributions.
 *
 * See claude/feature-decisions/Family-Goals-And-Prizes.md for the full spec.
 * NEVER routed through contracts/deed_firings/godmothers (Key Decision #2).
 */

export type FamilyGoalEarningMode = 'shared_counter' | 'each_member'
export type FamilyGoalStatus = 'active' | 'completed' | 'expired' | 'archived'
export type FamilyGoalSourceKind = 'family_intention' | 'task'

export interface FamilyGoal {
  id: string
  family_id: string
  created_by: string
  title: string
  description: string | null
  participating_member_ids: string[]
  earning_mode: FamilyGoalEarningMode
  target_count: number
  starts_at: string | null
  ends_at: string | null
  prize_name: string
  prize_text: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
  progress_visible: boolean
  is_included_in_ai: boolean
  status: FamilyGoalStatus
  current_progress: number
  completed_at: string | null
  earned_prize_id: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilyGoalSource {
  id: string
  family_id: string
  goal_id: string
  source_kind: FamilyGoalSourceKind
  source_id: string
  created_at: string
}

export interface FamilyGoalContribution {
  id: string
  family_id: string
  goal_id: string
  member_id: string
  source_kind: FamilyGoalSourceKind
  source_ref_id: string
  contributed_at: string
  created_at: string
}

export interface FamilyGoalMemberProgress {
  memberId: string
  count: number
}

export interface FamilyGoalProgress {
  total: number
  perMember: FamilyGoalMemberProgress[]
}

/** Lightweight candidate task shape for the "What counts" task picker. */
export interface FamilyGoalCandidateTask {
  id: string
  title: string
  assignee_id: string | null
  is_shared: boolean | null
  task_type: string
}
