/**
 * FeatureIcon — Renders an illustrated paper craft image (classic vibe)
 * or falls back to a Lucide icon (all other vibes / missing asset).
 *
 * Usage:
 *   <FeatureIcon featureKey="tasks_basic" fallback={<CheckSquare size={24} />} size={24} />
 */

import { useFeatureIcon, type AssetSize } from '@/lib/assets'

interface FeatureIconProps {
  featureKey: string
  /** Lucide icon element to show when no illustrated asset is available */
  fallback: React.ReactNode
  /** Pixel size for both the img and the fallback icon (default 24) */
  size?: number
  /** Asset resolution to fetch — 32, 128, or 512 (default 128) */
  assetSize?: AssetSize
  className?: string
}

export function FeatureIcon({
  featureKey,
  fallback,
  size = 24,
  assetSize = 128,
  className = '',
}: FeatureIconProps) {
  const url = useFeatureIcon(featureKey, assetSize)

  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-sm ${className}`}
      />
    )
  }

  return <>{fallback}</>
}
