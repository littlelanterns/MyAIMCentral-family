/**
 * Reward Shop types — PRD-24 Point Economy Addendum §8.2/§8.3 (PECON-SHOP).
 * Mirrors migration 00000000100302_reward_shop.sql exactly.
 */

export type RewardShopLimitPeriod = 'day' | 'week' | 'month'

export interface RewardShopUnlockRule {
  type: 'completion_pct'
  threshold: number
  /** v1 supports only 'week' (a trailing 7-day window at the family-local day). */
  window: 'week'
}

export interface RewardShopItem {
  id: string
  family_id: string
  created_by: string | null
  name: string
  description: string | null
  image_url: string | null
  image_asset_key: string | null
  point_cost: number
  requires_approval: boolean
  /** Empty array = every gamification-enabled kid (addendum §6.1). */
  audience_member_ids: string[]
  limit_per_member: number | null
  limit_period: RewardShopLimitPeriod | null
  unlock_rule: RewardShopUnlockRule | null
  notes_to_kid: string | null
  sort_order: number
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type RewardShopPurchaseStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'auto_approved'

export interface RewardShopPurchase {
  id: string
  family_id: string
  store_item_id: string | null
  family_member_id: string
  /** Snapshot at purchase time — survives item edit/archive. */
  item_name: string
  points_cost: number
  status: RewardShopPurchaseStatus
  decline_note: string | null
  processed_by: string | null
  processed_at: string | null
  spend_transaction_id: string | null
  refund_transaction_id: string | null
  earned_prize_id: string | null
  acted_by: string | null
  created_at: string
  updated_at: string
}

/** Shape returned by purchase_reward_shop_item() — union of every status branch. */
export interface PurchaseRewardShopItemResult {
  status:
    | 'auto_approved'
    | 'pending'
    | 'not_found'
    | 'item_unavailable'
    | 'not_in_audience'
    | 'gate_not_met'
    | 'limit_reached'
    | 'insufficient_balance'
    | 'error'
  purchase_id?: string
  balance_after?: number
  error_message?: string
  completion_percentage?: number
  threshold?: number
  points_needed?: number
}

export interface ResolveRewardShopPurchaseResult {
  status: 'approved' | 'declined' | 'not_found' | 'already_resolved' | 'error'
  prize_id?: string
  current_status?: RewardShopPurchaseStatus
  error_message?: string
}

export interface CancelRewardShopPurchaseResult {
  status: 'cancelled' | 'not_found' | 'already_resolved'
  current_status?: RewardShopPurchaseStatus
}

/** Purchase joined with its item's picture, for surfaces that render the image (Queue card). */
export interface RewardShopPurchaseWithItem extends RewardShopPurchase {
  reward_shop_items: { image_url: string | null; image_asset_key: string | null } | null
}
