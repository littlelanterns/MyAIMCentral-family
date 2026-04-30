/**
 * Universal categorization property resolution.
 *
 * Single source of truth for resolving life_area_tags, icon_asset_key,
 * and icon_variant for any task, regardless of generation path.
 * Three-tier: item → parent/collection → fallback.
 */

export interface CategorizationProperties {
  life_area_tags: string[]
  icon_asset_key: string | null
  icon_variant: string | null
}

interface ItemWithCategorization {
  life_area_tags?: string[] | null
  life_area_tag?: string | null
  icon_asset_key?: string | null
  icon_variant?: string | null
}

interface ParentCategorizationDefaults {
  life_area_tags?: string[] | null
  life_area_tag?: string | null
  icon_asset_key?: string | null
  icon_variant?: string | null
}

export function resolveCategorizationProperties(
  item?: ItemWithCategorization | null,
  parentDefaults?: ParentCategorizationDefaults | null,
): CategorizationProperties {
  const lifeAreaTags =
    nonEmpty(item?.life_area_tags) ??
    singleToArray(item?.life_area_tag) ??
    nonEmpty(parentDefaults?.life_area_tags) ??
    singleToArray(parentDefaults?.life_area_tag) ??
    []

  const iconAssetKey =
    item?.icon_asset_key ??
    parentDefaults?.icon_asset_key ??
    null

  const iconVariant =
    item?.icon_variant ??
    parentDefaults?.icon_variant ??
    null

  return {
    life_area_tags: lifeAreaTags,
    icon_asset_key: iconAssetKey,
    icon_variant: iconVariant,
  }
}

function nonEmpty(arr?: string[] | null): string[] | null {
  return arr && arr.length > 0 ? arr : null
}

function singleToArray(val?: string | null): string[] | null {
  return val ? [val] : null
}
