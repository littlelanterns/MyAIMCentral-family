/**
 * AIMfM Compatible Color Palette — Member Colors
 * Source: AIMfM_Compatible_Color_Palette.xlsm
 * All 44 colors available for family member color assignment.
 */

export interface MemberColor {
  hex: string
  name: string
  hue: string
}

export const MEMBER_COLORS: MemberColor[] = [
  // Red
  { hex: '#f8d6d0', name: 'Light Blush', hue: 'Red' },
  { hex: '#f3a6a0', name: 'Coral Pink', hue: 'Red' },
  { hex: '#b25a58', name: 'Rustic Rose', hue: 'Red' },
  { hex: '#8e3e3c', name: 'Deep Brick', hue: 'Red' },
  // Orange
  { hex: '#fde3c7', name: 'Soft Apricot', hue: 'Orange' },
  { hex: '#f9c396', name: 'Peach Nectar', hue: 'Orange' },
  { hex: '#b86432', name: 'Burnt Sienna', hue: 'Orange' },
  { hex: '#8a4a25', name: 'Chestnut Clay', hue: 'Orange' },
  // Yellow
  { hex: '#fdf4db', name: 'Champagne Linen', hue: 'Yellow' },
  { hex: '#f3d188', name: 'Honey Butter', hue: 'Yellow' },
  { hex: '#d4b063', name: 'Golden Wheat', hue: 'Yellow' },
  { hex: '#8c6b3f', name: 'Burnished Bronze', hue: 'Yellow' },
  { hex: '#fff6d5', name: 'Buttercream', hue: 'Yellow' },
  { hex: '#fae49b', name: 'Sunbeam Gold', hue: 'Yellow' },
  { hex: '#b99c34', name: 'Mustard Grove', hue: 'Yellow' },
  { hex: '#8a7220', name: 'Ochre Earth', hue: 'Yellow' },
  // Green
  { hex: '#d8e3da', name: 'Silver Sage', hue: 'Green' },
  { hex: '#aebfb4', name: 'Misty Eucalyptus', hue: 'Green' },
  { hex: '#889a8d', name: 'Dusty Sage', hue: 'Green' },
  { hex: '#5e7164', name: 'Weathered Pine', hue: 'Green' },
  { hex: '#dcefe3', name: 'Misty Mint', hue: 'Green' },
  { hex: '#b2d3c0', name: 'Herb Garden', hue: 'Green' },
  { hex: '#4b7c66', name: 'Forest Sage', hue: 'Green' },
  { hex: '#355f50', name: 'Pine Shadow', hue: 'Green' },
  // Teal
  { hex: '#d7eae2', name: 'Seafoam', hue: 'Teal' },
  { hex: '#a8cfc8', name: 'Cool Sage', hue: 'Teal' },
  { hex: '#68a395', name: 'AIMfM Sage Teal', hue: 'Teal' },
  { hex: '#2c5d60', name: 'Deep Ocean', hue: 'Teal' },
  // Blue
  { hex: '#c8d1d6', name: 'Storm Cloud', hue: 'Blue' },
  { hex: '#7d98a5', name: 'Coastal Blue', hue: 'Blue' },
  { hex: '#4a5f6a', name: 'Evening Indigo', hue: 'Blue' },
  { hex: '#2f3e48', name: 'Inkwell', hue: 'Blue' },
  // Purple
  { hex: '#e9daec', name: 'Lilac Whisper', hue: 'Purple' },
  { hex: '#d2b9d7', name: 'Mauve Fog', hue: 'Purple' },
  { hex: '#805a82', name: 'Vintage Plum', hue: 'Purple' },
  { hex: '#5d3e60', name: 'Eggplant Night', hue: 'Purple' },
  // Brown
  { hex: '#e5d5ca', name: 'Pale Mocha', hue: 'Brown' },
  { hex: '#c8ad9d', name: 'Cinnamon Milk', hue: 'Brown' },
  { hex: '#6f4f3a', name: 'Coffee Bean', hue: 'Brown' },
  { hex: '#4e3426', name: 'Dark Walnut', hue: 'Brown' },
  // Pink
  { hex: '#fce8e3', name: 'Petal Blush', hue: 'Pink' },
  { hex: '#f5c1ba', name: 'Rose Dust', hue: 'Pink' },
  { hex: '#b4716d', name: 'Muted Berry', hue: 'Pink' },
  { hex: '#8e4e4a', name: 'Mulberry Clay', hue: 'Pink' },
]

/**
 * Returns a color that contrasts well as text on this background.
 * Light colors get dark text, dark colors get white text.
 */
export function getContrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 150 ? '#3d2e22' : '#ffffff'
}
