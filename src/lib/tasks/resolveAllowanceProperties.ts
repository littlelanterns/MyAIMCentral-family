/**
 * Universal allowance property resolution.
 *
 * Single source of truth for resolving counts_for_allowance,
 * allowance_points, and is_extra_credit for any task, regardless of
 * generation path. Three-tier: item → list/collection defaults → fallback.
 */

export interface AllowanceProperties {
  counts_for_allowance: boolean
  allowance_points: number | null
  is_extra_credit: boolean
}

interface ItemWithAllowance {
  counts_for_allowance?: boolean | null
  allowance_points?: number | null
  is_extra_credit?: boolean | null
}

interface ParentAllowanceDefaults {
  counts_for_allowance?: boolean | null
  allowance_points?: number | null
  is_extra_credit?: boolean | null
}

export function resolveAllowanceProperties(
  item?: ItemWithAllowance | null,
  parentDefaults?: ParentAllowanceDefaults | null,
): AllowanceProperties {
  const countsForAllowance =
    item?.counts_for_allowance ??
    parentDefaults?.counts_for_allowance ??
    false

  const allowancePoints =
    item?.allowance_points ??
    parentDefaults?.allowance_points ??
    null

  const isExtraCredit =
    item?.is_extra_credit ??
    parentDefaults?.is_extra_credit ??
    false

  return {
    counts_for_allowance: !!countsForAllowance,
    allowance_points: allowancePoints,
    is_extra_credit: !!isExtraCredit,
  }
}
