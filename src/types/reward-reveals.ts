// Reward Reveals — Universal Celebration System types

// ============================================================
// Enums
// ============================================================

export type PrizeType = 'text' | 'image' | 'platform_image' | 'randomizer' | 'celebration_only'
export type PrizeMode = 'fixed' | 'sequential' | 'random'
export type AnimationRotation = 'sequential' | 'random'

export type RevealSourceType =
  | 'task'
  | 'widget'
  | 'list'
  | 'intention'
  | 'sequential_collection'
  | 'sequential_interval'
  | 'mastery'

export type RevealTriggerMode = 'on_completion' | 'every_n' | 'on_goal'
export type RevealType = 'video' | 'css'
export type MessageCategory = 'general' | 'milestone' | 'streak' | 'completion' | 'effort'

// ============================================================
// reveal_animations (already exists — read-only reference)
// ============================================================

export interface RevealAnimation {
  id: string
  slug: string
  display_name: string
  description: string | null
  style_category: string
  reveal_type: RevealType
  video_url: string | null
  css_component: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// ============================================================
// reward_reveals
// ============================================================

/** A single prize entry in a prize_pool array */
export interface PrizePoolEntry {
  prize_type: PrizeType
  prize_text: string | null
  prize_name: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
}

export interface RewardReveal {
  id: string
  family_id: string
  created_by: string
  name: string | null
  animation_ids: string[]
  animation_rotation: AnimationRotation
  prize_mode: PrizeMode
  prize_type: PrizeType
  prize_text: string | null
  prize_name: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
  prize_randomizer_list_id: string | null
  prize_pool: PrizePoolEntry[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RewardRevealInput {
  family_id: string
  created_by: string
  name?: string | null
  animation_ids: string[]
  animation_rotation?: AnimationRotation
  prize_mode?: PrizeMode
  prize_type: PrizeType
  prize_text?: string | null
  prize_name?: string | null
  prize_image_url?: string | null
  prize_asset_key?: string | null
  prize_randomizer_list_id?: string | null
  prize_pool?: PrizePoolEntry[] | null
}

// ============================================================
// reward_reveal_attachments
// ============================================================

export interface RewardRevealAttachment {
  id: string
  family_id: string
  reward_reveal_id: string
  source_type: RevealSourceType
  source_id: string
  family_member_id: string | null
  is_repeating: boolean
  reveal_trigger_mode: RevealTriggerMode
  reveal_trigger_n: number | null
  times_revealed: number
  last_revealed_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AttachRevealInput {
  family_id: string
  reward_reveal_id: string
  source_type: RevealSourceType
  source_id: string
  family_member_id?: string | null
  is_repeating?: boolean
  reveal_trigger_mode?: RevealTriggerMode
  reveal_trigger_n?: number | null
}

// ============================================================
// congratulations_messages
// ============================================================

export interface CongratulationsMessage {
  id: string
  message_text: string
  category: MessageCategory
  is_system: boolean
  family_id: string | null
  sort_order: number
  created_at: string
}

// ============================================================
// Resolved reveal — what useCheckRevealTrigger returns
// ============================================================

/** The fully resolved reveal ready to display */
export interface ResolvedReveal {
  attachment: RewardRevealAttachment
  reveal: RewardReveal
  /** The specific animation to play (resolved from rotation) */
  animation: RevealAnimation
  /** The specific prize to show (resolved from pool/fixed) */
  prize: ResolvedPrize
}

export interface ResolvedPrize {
  prize_type: PrizeType
  prize_text: string | null
  /** Prize name with {reward} already substituted into prize_text */
  prize_name: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
}

// ============================================================
// earned_prizes (Prize Box)
// ============================================================

export interface EarnedPrize {
  id: string
  family_id: string
  family_member_id: string
  reward_reveal_id: string | null
  attachment_id: string | null
  source_type: string
  source_id: string
  prize_type: PrizeType
  prize_text: string | null
  prize_name: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
  animation_slug: string | null
  earned_at: string
  redeemed_at: string | null
  redeemed_by: string | null
  created_at: string
}

export interface EarnedPrizeInput {
  family_id: string
  family_member_id: string
  reward_reveal_id?: string | null
  attachment_id?: string | null
  source_type: string
  source_id: string
  prize_type: PrizeType
  prize_text?: string | null
  prize_name?: string | null
  prize_image_url?: string | null
  prize_asset_key?: string | null
  animation_slug?: string | null
}
