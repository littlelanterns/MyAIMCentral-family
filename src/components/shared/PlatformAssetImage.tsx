/**
 * PlatformAssetImage — KIDS-REWARDS-PAGE Slice 1 (founder addition 2026-06-12)
 *
 * Renders a platform_assets image by feature_key, for CONTENT images
 * (prize cards, reward previews) as opposed to THEMED UI icons.
 *
 * Why not <FeatureIcon>? FeatureIcon is the vibe-aware nav/feature icon:
 * it only resolves category='app_icon' rows AND only in illustrated vibes
 * (classic). A prize picture is content the kid earned — it must render in
 * every theme and from every asset category (visual_schedule, login_avatar,
 * app_icon). Before this component existed, platform_image prizes silently
 * fell back to the Gift icon outside the classic vibe.
 *
 * Resolution: any-category lookup by feature_key; prefers the requested
 * variant, falls back to whichever variant exists (login_avatar assets only
 * have variant A).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type PlatformAssetSize = 32 | 128 | 512

interface PlatformAssetImageProps {
  assetKey: string
  /** Shown while loading or when the key resolves to nothing */
  fallback: React.ReactNode
  /** Pixel size for the rendered img (default 24) */
  size?: number
  /** Asset resolution to fetch — 32, 128, or 512 (default 128) */
  assetSize?: PlatformAssetSize
  /** Preferred variant — falls back to any available (default B) */
  variant?: 'A' | 'B' | 'C'
  className?: string
}

export function PlatformAssetImage({
  assetKey,
  fallback,
  size = 24,
  assetSize = 128,
  variant = 'B',
  className = '',
}: PlatformAssetImageProps) {
  const { data: url } = useQuery({
    queryKey: ['platform-asset-image', assetKey, assetSize],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_assets')
        .select('variant, size_32_url, size_128_url, size_512_url')
        .eq('feature_key', assetKey)
        .eq('status', 'active')
      if (error || !data || data.length === 0) return null

      const row = data.find((r) => r.variant === variant) ?? data[0]
      const sizeKey = `size_${assetSize}_url` as 'size_32_url' | 'size_128_url' | 'size_512_url'
      return (row[sizeKey] as string | null) ?? row.size_128_url ?? null
    },
    enabled: !!assetKey,
    staleTime: 30 * 60_000,
    retry: false,
  })

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-sm ${className}`}
        style={{ objectFit: 'contain' }}
      />
    )
  }

  return <>{fallback}</>
}
