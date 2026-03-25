import { useState, useEffect } from 'react'
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

// Vibes that use illustrated paper craft icons
const ILLUSTRATED_VIBES = ['classic']

// Get illustrated icon for current vibe
// Returns null if vibe doesn't use illustrated icons — caller falls back to Lucide
export async function getFeatureIcon(
  featureKey: string,
  currentVibe: string,
  preferredVariant: 'A' | 'B' | 'C' = 'A',
  size: AssetSize = 128
): Promise<string | null> {
  if (!ILLUSTRATED_VIBES.includes(currentVibe)) {
    return null
  }

  return getAsset(featureKey, 'app_icon', preferredVariant, size)
}

// Batch-fetch illustrated icons for multiple feature keys at once.
// Returns a map of featureKey → URL (or null if missing).
// Used by sidebar/nav to avoid N+1 queries on mount.
export async function getFeatureIcons(
  featureKeys: string[],
  currentVibe: string,
  preferredVariant: 'A' | 'B' | 'C' = 'A',
  size: AssetSize = 128
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {}
  for (const key of featureKeys) {
    result[key] = null
  }

  if (!ILLUSTRATED_VIBES.includes(currentVibe)) {
    return result
  }

  const { data } = await supabase
    .from('platform_assets')
    .select('feature_key, size_512_url, size_128_url, size_32_url')
    .eq('category', 'app_icon')
    .eq('variant', preferredVariant)
    .in('feature_key', featureKeys)

  if (!data) return result

  const sizeKey = `size_${size}_url` as 'size_512_url' | 'size_128_url' | 'size_32_url'
  for (const row of data) {
    result[row.feature_key] = (row[sizeKey] as string) || null
  }

  return result
}

// ─── React Hook ─────────────────────────────────────────────
// Single-feature hook for page headers, cards, etc.
// Returns the illustrated URL or null (caller renders Lucide fallback).
// Requires ThemeProvider in the tree — import { useTheme } from '@/lib/theme'.

import { useTheme } from './theme'

export function useFeatureIcon(
  featureKey: string,
  size: AssetSize = 128,
  variant: 'A' | 'B' | 'C' = 'A'
): string | null {
  const { vibe } = useTheme()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getFeatureIcon(featureKey, vibe, variant, size).then(result => {
      if (!cancelled) setUrl(result)
    })
    return () => { cancelled = true }
  }, [featureKey, vibe, variant, size])

  return url
}
