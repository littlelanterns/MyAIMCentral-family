/**
 * Universal reward property resolution.
 *
 * Single source of truth for resolving reward_type, reward_amount,
 * points_override, and victory_flagged for any task, regardless of
 * generation path. Three-tier: item → list/collection defaults → fallback.
 */

export interface RewardProperties {
  reward_type: string | null
  reward_amount: number | null
  points_override: number | null
  victory_flagged: boolean
}

interface ItemWithReward {
  reward_type?: string | null
  reward_amount?: number | null
  points_override?: number | null
  victory_flagged?: boolean | null
}

interface ParentRewardDefaults {
  default_reward_type?: string | null
  default_reward_amount?: number | null
  reward_per_item_type?: string | null
  reward_per_item_amount?: number | null
  victory_mode?: string | null
}

export function resolveRewardProperties(
  item?: ItemWithReward | null,
  parentDefaults?: ParentRewardDefaults | null,
): RewardProperties {
  const rewardType =
    item?.reward_type ??
    parentDefaults?.default_reward_type ??
    parentDefaults?.reward_per_item_type ??
    null

  const rewardAmount =
    item?.reward_amount ??
    parentDefaults?.default_reward_amount ??
    parentDefaults?.reward_per_item_amount ??
    null

  const pointsOverride =
    item?.points_override ??
    (rewardType === 'points' && rewardAmount != null ? rewardAmount : null)

  const victoryFlagged =
    item?.victory_flagged ??
    (parentDefaults?.victory_mode === 'item_completed' ||
      parentDefaults?.victory_mode === 'both') ??
    false

  return {
    reward_type: rewardType,
    reward_amount: rewardAmount,
    points_override: pointsOverride,
    victory_flagged: !!victoryFlagged,
  }
}
