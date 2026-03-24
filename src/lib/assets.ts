import { supabase } from './supabase/client'

export type AssetCategory =
  | 'app_icon'
  | 'vault_thumbnail'
  | 'visual_schedule'
  | 'login_avatar'

export type AssetSize = 512 | 128 | 32

// Get a specific asset by feature key and variant
export async function getAsset(
  featureKey: string,
  category: AssetCategory,
  variant: 'A' | 'B' | 'C' = 'A',
  size: AssetSize = 512
) {
  const { data } = await supabase
    .from('platform_assets')
    .select('*')
    .eq('feature_key', featureKey)
    .eq('category', category)
    .eq('variant', variant)
    .single()

  if (!data) return null

  const sizeKey = `size_${size}_url` as keyof typeof data
  return data[sizeKey] as string
}

// Get all variants for a feature
export async function getAssetVariants(
  featureKey: string,
  category: AssetCategory,
  size: AssetSize = 512
) {
  const { data } = await supabase
    .from('platform_assets')
    .select('*')
    .eq('feature_key', featureKey)
    .eq('category', category)
    .order('variant')

  if (!data) return []

  const sizeKey = `size_${size}_url` as keyof (typeof data)[0]
  return data.map(row => ({
    variant: row.variant,
    url: row[sizeKey] as string,
    description: row.description,
    tags: row.tags
  }))
}

// Find best matching asset by semantic tags
export async function findAssetByTags(
  searchTags: string[],
  category: AssetCategory,
  size: AssetSize = 128
) {
  const { data } = await supabase
    .from('platform_assets')
    .select('*')
    .eq('category', category)
    .contains('tags', searchTags)
    .limit(1)
    .single()

  if (!data) return null

  const sizeKey = `size_${size}_url` as keyof typeof data
  return data[sizeKey] as string
}

// Get illustrated icon for current vibe.
// Returns null if vibe does not use illustrated icons — caller falls back to Lucide.
export async function getFeatureIcon(
  featureKey: string,
  currentVibe: string,
  preferredVariant: 'A' | 'B' | 'C' = 'A',
  size: AssetSize = 128
): Promise<string | null> {
  const illustratedVibes = ['classic_myaim']

  if (!illustratedVibes.includes(currentVibe)) {
    return null
  }

  return getAsset(featureKey, 'app_icon', preferredVariant, size)
}
