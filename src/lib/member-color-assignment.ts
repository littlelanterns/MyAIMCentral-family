/**
 * Member Color Auto-Assignment (PRD-03)
 *
 * When a new family member is added without an assigned_color,
 * this picks the next unused color from the brand palette,
 * then falls back to the full member colors palette.
 */

import { brand } from '@/lib/theme/tokens'
import { MEMBER_COLORS } from '@/config/member_colors'

// Preferred assignment order: distinctive, spaced-out colors first
const ASSIGNMENT_ORDER = [
  brand.sageTeal,
  brand.goldenHoney,
  brand.dustyRose,
  brand.deepOcean,
  brand.softGold,
  brand.warmEarth,
  brand.softSage,
  brand.warmCream,
  // Then distinctive member colors from each hue family
  '#4b7c66',  // Forest Sage (Green)
  '#805a82',  // Vintage Plum (Purple)
  '#b86432',  // Burnt Sienna (Orange)
  '#7d98a5',  // Coastal Blue (Blue)
  '#b4716d',  // Muted Berry (Pink)
  '#b25a58',  // Rustic Rose (Red)
  '#c8ad9d',  // Cinnamon Milk (Brown)
  '#b99c34',  // Mustard Grove (Yellow)
  // Then remaining member colors
  ...MEMBER_COLORS.map(c => c.hex),
]

// Deduplicate while preserving order
const UNIQUE_ASSIGNMENT_ORDER = [...new Set(ASSIGNMENT_ORDER)]

/**
 * Returns the next unused color for a new family member.
 * @param usedColors - hex colors already assigned to existing family members
 */
export function getNextMemberColor(usedColors: string[]): string {
  const used = new Set(usedColors.map(c => c.toLowerCase()))

  for (const color of UNIQUE_ASSIGNMENT_ORDER) {
    if (!used.has(color.toLowerCase())) {
      return color
    }
  }

  // All colors used — return the first brand color (extremely unlikely with 44+ colors)
  return brand.sageTeal
}
