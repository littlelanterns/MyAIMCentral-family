/**
 * coloringImageUrl — Build M Phase 3
 *
 * Derives Supabase Storage URLs for coloring library images from
 * the image slug + file type. The `coloring_reveal_library` table
 * stores only the slug; all image URLs are computed at runtime.
 *
 * Storage layout:
 *   gamification-assets/woodland-felt/coloring-library/{slug}/{file}.png
 */

const CDN_BASE =
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets'

export type ColoringImageFile =
  | 'color'
  | 'grayscale'
  | 'lineart_simple'
  | 'lineart_medium'
  | 'lineart_complex'
  | 'grid_preview'

export function coloringImageUrl(
  slug: string,
  file: ColoringImageFile,
): string {
  return `${CDN_BASE}/woodland-felt/coloring-library/${slug}/${file}.png`
}

export function lineartUrlForPreference(
  slug: string,
  preference: 'simple' | 'medium' | 'complex',
): string {
  return coloringImageUrl(slug, `lineart_${preference}` as ColoringImageFile)
}
