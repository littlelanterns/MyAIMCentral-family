/**
 * MyAIM Central — Design System Tokens (PRD-03)
 * Three-layer color system: Brand → Extended Palette → Semantic Tokens
 */

// Layer 1: Primary Brand Colors
export const brand = {
  warmCream: '#fff4ec',
  warmEarth: '#5a4033',
  sageTeal: '#68a395',
  softSage: '#d4e3d9',
  goldenHoney: '#d6a461',
  dustyRose: '#d69a84',
  softGold: '#f4dcb7',
  deepOcean: '#2c5d60',
} as const

// Universal status colors (consistent across all themes)
export const status = {
  success: '#4b7c66',
  warning: '#b99c34',
  error: '#b25a58',
  info: '#68a395',
  pending: '#f9c396',
  victory: '#d6a461',
} as const

// Shell scaling tokens
export type ShellType = 'mom' | 'adult' | 'independent' | 'guided' | 'play'

export const shellScaling: Record<ShellType, {
  radiusMultiplier: number
  spacingMultiplier: number
  animationSpeed: string
  fontScale: number
}> = {
  mom: { radiusMultiplier: 1, spacingMultiplier: 1, animationSpeed: '250ms', fontScale: 1 },
  adult: { radiusMultiplier: 0.9, spacingMultiplier: 0.95, animationSpeed: '200ms', fontScale: 1 },
  independent: { radiusMultiplier: 0.85, spacingMultiplier: 0.9, animationSpeed: '200ms', fontScale: 1 },
  guided: { radiusMultiplier: 1.2, spacingMultiplier: 1.1, animationSpeed: '300ms', fontScale: 1.05 },
  play: { radiusMultiplier: 1.5, spacingMultiplier: 1.2, animationSpeed: '400ms', fontScale: 1.1 },
}

// Vibe definitions
export type VibeKey = 'classic' | 'modern' | 'nautical' | 'cozy'

export interface VibeConfig {
  name: string
  fontHeading: string
  fontBody: string
  radiusCard: string
  radiusInput: string
  radiusModal: string
  shadowColor: string
  shadowSpread: string
  spacingDensity: number
  decorationLevel: 'none' | 'subtle' | 'prominent'
}

export const vibes: Record<VibeKey, VibeConfig> = {
  classic: {
    name: 'Classic MyAIM',
    fontHeading: "'The Seasons', Georgia, serif",
    fontBody: "'HK Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    radiusCard: '12px',
    radiusInput: '8px',
    radiusModal: '16px',
    shadowColor: 'rgba(90, 64, 51, 0.08)',
    shadowSpread: '12px',
    spacingDensity: 1,
    decorationLevel: 'subtle',
  },
  modern: {
    name: 'Clean & Modern',
    fontHeading: "'HK Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontBody: "'HK Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    radiusCard: '8px',
    radiusInput: '4px',
    radiusModal: '8px',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowSpread: '8px',
    spacingDensity: 0.9,
    decorationLevel: 'none',
  },
  nautical: {
    name: 'Nautical',
    fontHeading: "Georgia, 'Times New Roman', serif",
    fontBody: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    radiusCard: '10px',
    radiusInput: '6px',
    radiusModal: '12px',
    shadowColor: 'rgba(44, 93, 96, 0.1)',
    shadowSpread: '10px',
    spacingDensity: 0.95,
    decorationLevel: 'subtle',
  },
  cozy: {
    name: 'Cozy Journal',
    fontHeading: "'Caveat', 'Comic Sans MS', cursive",
    fontBody: "'HK Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    radiusCard: '18px',
    radiusInput: '10px',
    radiusModal: '20px',
    shadowColor: 'rgba(90, 64, 51, 0.06)',
    shadowSpread: '16px',
    spacingDensity: 1.1,
    decorationLevel: 'prominent',
  },
}

// Theme definitions
export type ThemeKey =
  // Original 9
  | 'classic' | 'sage_garden' | 'rose_gold' | 'ocean_depth'
  | 'golden_hour' | 'lavender_fields' | 'earth_tones' | 'sunset_coral'
  | 'mint_fresh'
  // Warm & Cozy (8 new)
  | 'honey_linen' | 'warm_sunset' | 'dusty_blush' | 'earthy_comfort'
  | 'champagne' | 'hearthstone' | 'timber_iron'
  // Cool & Calm (7)
  | 'ocean_breeze' | 'forest_calm' | 'sage_cream' | 'pine_stone'
  | 'coastal_slate' | 'teal_storm' | 'lavender_dreams'
  // Bold & Rich (7)
  | 'captains_quarters' | 'inkwell_bronze' | 'evening_indigo'
  | 'plum_electric' | 'midnight_berry' | 'sunset_blaze'
  // Soft & Light (5)
  | 'peach_garden' | 'berry_soft' | 'morning_mist' | 'petal_honey' | 'cloud_nine'
  // Bright & Fun (6)
  | 'sunshine_day' | 'garden_party' | 'ocean_adventure'
  | 'berry_bright' | 'minty_fresh' | 'peachy_keen'

export interface ThemeColors {
  name: string
  family: string
  light: {
    bgPrimary: string
    bgSecondary: string
    bgCard: string
    bgNav: string
    bgInput: string
    textPrimary: string
    textSecondary: string
    textHeading: string
    btnPrimaryBg: string
    btnPrimaryText: string
    btnPrimaryHover: string
    btnSecondaryBg: string
    btnSecondaryText: string
    btnSecondaryBorder: string
    border: string
    borderFocus: string
    accent: string
    accentDeep: string
    textOnPrimary: string
    borderDefault: string
  }
  dark: {
    bgPrimary: string
    bgSecondary: string
    bgCard: string
    bgNav: string
    bgInput: string
    textPrimary: string
    textSecondary: string
    textHeading: string
    btnPrimaryBg: string
    btnPrimaryText: string
    btnPrimaryHover: string
    btnSecondaryBg: string
    btnSecondaryText: string
    btnSecondaryBorder: string
    border: string
    borderFocus: string
    accent: string
    accentDeep: string
    textOnPrimary: string
    borderDefault: string
  }
}

export const themes: Record<ThemeKey, ThemeColors> = {

  // ─── Original 9 themes (with accentDeep, textOnPrimary, borderDefault added) ───

  classic: {
    name: 'Classic MyAIM',
    family: 'Brand',
    light: {
      bgPrimary: '#fff4ec', bgSecondary: '#d4e3d9', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#5a4033', textSecondary: '#7a6a5f',
      textHeading: '#5a4033', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#2c5d60', btnSecondaryBg: 'transparent', btnSecondaryText: '#5a4033',
      btnSecondaryBorder: '#d4e3d9', border: '#d4e3d9', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#c4d4cc',
    },
    dark: {
      bgPrimary: '#1a1412', bgSecondary: '#2a2420', bgCard: '#322c28', bgNav: '#1e3a3c',
      bgInput: '#2a2420', textPrimary: '#f0e6dc', textSecondary: '#b0a69c',
      textHeading: '#f4dcb7', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#f0e6dc',
      btnSecondaryBorder: '#4a4440', border: '#4a4440', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5a5450',
    },
  },
  sage_garden: {
    name: 'Sage Garden',
    family: 'Sage',
    light: {
      bgPrimary: '#f2f5f3', bgSecondary: '#d8e3da', bgCard: '#ffffff', bgNav: '#5e7164',
      bgInput: '#ffffff', textPrimary: '#2d3a32', textSecondary: '#5e7164',
      textHeading: '#355f50', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#355f50', btnSecondaryBg: 'transparent', btnSecondaryText: '#2d3a32',
      btnSecondaryBorder: '#aebfb4', border: '#d8e3da', borderFocus: '#4b7c66', accent: '#889a8d',
      accentDeep: '#5e7164', textOnPrimary: '#ffffff', borderDefault: '#c8d4cc',
    },
    dark: {
      bgPrimary: '#141a16', bgSecondary: '#1e2a22', bgCard: '#243028', bgNav: '#1a2e24',
      bgInput: '#1e2a22', textPrimary: '#d8e3da', textSecondary: '#889a8d',
      textHeading: '#aebfb4', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#d8e3da',
      btnSecondaryBorder: '#3a4a40', border: '#3a4a40', borderFocus: '#4b7c66', accent: '#889a8d',
      accentDeep: '#5e7164', textOnPrimary: '#ffffff', borderDefault: '#4a5a50',
    },
  },
  rose_gold: {
    name: 'Rose Gold',
    family: 'Pink',
    light: {
      bgPrimary: '#fef6f4', bgSecondary: '#fce8e3', bgCard: '#ffffff', bgNav: '#8e4e4a',
      bgInput: '#ffffff', textPrimary: '#4a2a28', textSecondary: '#8e4e4a',
      textHeading: '#8e4e4a', btnPrimaryBg: '#b4716d', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#8e4e4a', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a2a28',
      btnSecondaryBorder: '#f5c1ba', border: '#fce8e3', borderFocus: '#b4716d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#ecd8d4',
    },
    dark: {
      bgPrimary: '#1a1214', bgSecondary: '#2a1e20', bgCard: '#322428', bgNav: '#3a2228',
      bgInput: '#2a1e20', textPrimary: '#f5e0dc', textSecondary: '#c08a86',
      textHeading: '#f5c1ba', btnPrimaryBg: '#b4716d', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#c88480', btnSecondaryBg: 'transparent', btnSecondaryText: '#f5e0dc',
      btnSecondaryBorder: '#4a3438', border: '#4a3438', borderFocus: '#b4716d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5a4448',
    },
  },
  ocean_depth: {
    name: 'Ocean Depth',
    family: 'Teal',
    light: {
      bgPrimary: '#f0f6f4', bgSecondary: '#d7eae2', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#1a3a3c', textSecondary: '#4a7a7e',
      textHeading: '#2c5d60', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#2c5d60', btnSecondaryBg: 'transparent', btnSecondaryText: '#1a3a3c',
      btnSecondaryBorder: '#a8cfc8', border: '#d7eae2', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#c4dcd8',
    },
    dark: {
      bgPrimary: '#0e1a1c', bgSecondary: '#162628', bgCard: '#1e3032', bgNav: '#142224',
      bgInput: '#162628', textPrimary: '#d7eae2', textSecondary: '#7aaba4',
      textHeading: '#a8cfc8', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#d7eae2',
      btnSecondaryBorder: '#2c4a4e', border: '#2c4a4e', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3c5a5e',
    },
  },
  golden_hour: {
    name: 'Golden Hour',
    family: 'Gold',
    light: {
      bgPrimary: '#fdfaf2', bgSecondary: '#fdf4db', bgCard: '#ffffff', bgNav: '#8c6b3f',
      bgInput: '#ffffff', textPrimary: '#4a3a20', textSecondary: '#8c6b3f',
      textHeading: '#6a5030', btnPrimaryBg: '#d4b063', btnPrimaryText: '#4a3a20',
      btnPrimaryHover: '#c49a4e', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a3a20',
      btnSecondaryBorder: '#f3d188', border: '#fdf4db', borderFocus: '#d4b063', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#4a3a20', borderDefault: '#ede4cb',
    },
    dark: {
      bgPrimary: '#1a1610', bgSecondary: '#2a2418', bgCard: '#322c1e', bgNav: '#2a2010',
      bgInput: '#2a2418', textPrimary: '#f4e8d0', textSecondary: '#c4a878',
      textHeading: '#f3d188', btnPrimaryBg: '#d4b063', btnPrimaryText: '#1a1610',
      btnPrimaryHover: '#e0c070', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4e8d0',
      btnSecondaryBorder: '#4a4030', border: '#4a4030', borderFocus: '#d4b063', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#1a1610', borderDefault: '#5a5040',
    },
  },
  lavender_fields: {
    name: 'Lavender Fields',
    family: 'Purple',
    light: {
      bgPrimary: '#f8f4fa', bgSecondary: '#e9daec', bgCard: '#ffffff', bgNav: '#5d3e60',
      bgInput: '#ffffff', textPrimary: '#3a2a3c', textSecondary: '#805a82',
      textHeading: '#5d3e60', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5d3e60', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a2a3c',
      btnSecondaryBorder: '#d2b9d7', border: '#e9daec', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#d9cadc',
    },
    dark: {
      bgPrimary: '#181418', bgSecondary: '#241e26', bgCard: '#2e2630', bgNav: '#261e28',
      bgInput: '#241e26', textPrimary: '#e4d8e6', textSecondary: '#a88aac',
      textHeading: '#d2b9d7', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#946e96', btnSecondaryBg: 'transparent', btnSecondaryText: '#e4d8e6',
      btnSecondaryBorder: '#443a46', border: '#443a46', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#544a56',
    },
  },
  earth_tones: {
    name: 'Earth Tones',
    family: 'Brown',
    light: {
      bgPrimary: '#f8f2ee', bgSecondary: '#e5d5ca', bgCard: '#ffffff', bgNav: '#4e3426',
      bgInput: '#ffffff', textPrimary: '#3a2a1e', textSecondary: '#6f4f3a',
      textHeading: '#4e3426', btnPrimaryBg: '#6f4f3a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#4e3426', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a2a1e',
      btnSecondaryBorder: '#c8ad9d', border: '#e5d5ca', borderFocus: '#6f4f3a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#d5c5ba',
    },
    dark: {
      bgPrimary: '#161210', bgSecondary: '#241e1a', bgCard: '#2e2622', bgNav: '#201814',
      bgInput: '#241e1a', textPrimary: '#e5d5ca', textSecondary: '#a08878',
      textHeading: '#c8ad9d', btnPrimaryBg: '#6f4f3a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#836350', btnSecondaryBg: 'transparent', btnSecondaryText: '#e5d5ca',
      btnSecondaryBorder: '#443a34', border: '#443a34', borderFocus: '#6f4f3a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#544a44',
    },
  },
  sunset_coral: {
    name: 'Sunset Coral',
    family: 'Orange',
    light: {
      bgPrimary: '#fef8f2', bgSecondary: '#fde3c7', bgCard: '#ffffff', bgNav: '#8a4a25',
      bgInput: '#ffffff', textPrimary: '#4a2a14', textSecondary: '#8a4a25',
      textHeading: '#6a3a1a', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#8a4a25', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a2a14',
      btnSecondaryBorder: '#f9c396', border: '#fde3c7', borderFocus: '#b86432', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#edd3b7',
    },
    dark: {
      bgPrimary: '#1a1410', bgSecondary: '#2a2018', bgCard: '#322820', bgNav: '#2a1c10',
      bgInput: '#2a2018', textPrimary: '#f4dcc8', textSecondary: '#c49060',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#cc7844', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4dcc8',
      btnSecondaryBorder: '#4a3828', border: '#4a3828', borderFocus: '#b86432', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5a4838',
    },
  },
  mint_fresh: {
    name: 'Mint Fresh',
    family: 'Green',
    light: {
      bgPrimary: '#f4faf6', bgSecondary: '#dcefe3', bgCard: '#ffffff', bgNav: '#355f50',
      bgInput: '#ffffff', textPrimary: '#1a3a2a', textSecondary: '#4b7c66',
      textHeading: '#355f50', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#355f50', btnSecondaryBg: 'transparent', btnSecondaryText: '#1a3a2a',
      btnSecondaryBorder: '#b2d3c0', border: '#dcefe3', borderFocus: '#4b7c66', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#cce5d8',
    },
    dark: {
      bgPrimary: '#101a14', bgSecondary: '#1a2a20', bgCard: '#223028', bgNav: '#142820',
      bgInput: '#1a2a20', textPrimary: '#dcefe3', textSecondary: '#80b498',
      textHeading: '#b2d3c0', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#dcefe3',
      btnSecondaryBorder: '#2a4a38', border: '#2a4a38', borderFocus: '#4b7c66', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3a5a48',
    },
  },

  // ─── Warm & Cozy (8 new) ───

  honey_linen: {
    name: 'Honey Linen',
    family: 'Gold',
    light: {
      bgPrimary: '#fdf9f0', bgSecondary: '#fdf4db', bgCard: '#ffffff', bgNav: '#8c6b3f',
      bgInput: '#ffffff', textPrimary: '#4a3a18', textSecondary: '#8c6b3f',
      textHeading: '#6a5028', btnPrimaryBg: '#d4b063', btnPrimaryText: '#4a3a18',
      btnPrimaryHover: '#c49a4e', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a3a18',
      btnSecondaryBorder: '#f3d188', border: '#fdf4db', borderFocus: '#d4b063', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#4a3a18', borderDefault: '#ede4c8',
    },
    dark: {
      bgPrimary: '#1c1810', bgSecondary: '#2c2618', bgCard: '#342e1e', bgNav: '#2a2010',
      bgInput: '#2c2618', textPrimary: '#f4eccc', textSecondary: '#c4a870',
      textHeading: '#f3d188', btnPrimaryBg: '#d4b063', btnPrimaryText: '#1c1810',
      btnPrimaryHover: '#e0c070', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4e8cc',
      btnSecondaryBorder: '#4c4228', border: '#4c4228', borderFocus: '#d4b063', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#1c1810', borderDefault: '#5c5238',
    },
  },
  warm_sunset: {
    name: 'Warm Sunset',
    family: 'Orange',
    light: {
      bgPrimary: '#fff6ee', bgSecondary: '#fde3c7', bgCard: '#ffffff', bgNav: '#8a4a25',
      bgInput: '#ffffff', textPrimary: '#3e2210', textSecondary: '#8a4a25',
      textHeading: '#6a3818', btnPrimaryBg: '#f9c396', btnPrimaryText: '#3e2210',
      btnPrimaryHover: '#e8af80', btnSecondaryBg: 'transparent', btnSecondaryText: '#3e2210',
      btnSecondaryBorder: '#f9c396', border: '#fde3c7', borderFocus: '#b86432', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#3e2210', borderDefault: '#edd8ba',
    },
    dark: {
      bgPrimary: '#1c1610', bgSecondary: '#2c2218', bgCard: '#342a1e', bgNav: '#2c1e10',
      bgInput: '#2c2218', textPrimary: '#f4ddc8', textSecondary: '#c49060',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#cc7844', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4ddc8',
      btnSecondaryBorder: '#4c3a28', border: '#4c3a28', borderFocus: '#b86432', accent: '#f3d188',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5c4a38',
    },
  },
  dusty_blush: {
    name: 'Dusty Blush',
    family: 'Pink',
    light: {
      bgPrimary: '#fdf6f4', bgSecondary: '#fce8e3', bgCard: '#ffffff', bgNav: '#8e4e4a',
      bgInput: '#ffffff', textPrimary: '#4a2e2c', textSecondary: '#b4716d',
      textHeading: '#8e4e4a', btnPrimaryBg: '#f5c1ba', btnPrimaryText: '#4a2e2c',
      btnPrimaryHover: '#e8ada6', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a2e2c',
      btnSecondaryBorder: '#f5c1ba', border: '#fce8e3', borderFocus: '#b4716d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#4a2e2c', borderDefault: '#edd8d4',
    },
    dark: {
      bgPrimary: '#1c1418', bgSecondary: '#2c2024', bgCard: '#342830', bgNav: '#3c2428',
      bgInput: '#2c2024', textPrimary: '#f0dcd8', textSecondary: '#c49090',
      textHeading: '#f5c1ba', btnPrimaryBg: '#b4716d', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#c88480', btnSecondaryBg: 'transparent', btnSecondaryText: '#f0dcd8',
      btnSecondaryBorder: '#4c3840', border: '#4c3840', borderFocus: '#b4716d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5c4850',
    },
  },
  earthy_comfort: {
    name: 'Earthy Comfort',
    family: 'Brown',
    light: {
      bgPrimary: '#f9f4f0', bgSecondary: '#e5d5ca', bgCard: '#ffffff', bgNav: '#6f4f3a',
      bgInput: '#ffffff', textPrimary: '#3a2418', textSecondary: '#6f4f3a',
      textHeading: '#4e3426', btnPrimaryBg: '#c8ad9d', btnPrimaryText: '#3a2418',
      btnPrimaryHover: '#b89a88', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a2418',
      btnSecondaryBorder: '#c8ad9d', border: '#e5d5ca', borderFocus: '#6f4f3a', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#3a2418', borderDefault: '#d5c5b8',
    },
    dark: {
      bgPrimary: '#181410', bgSecondary: '#28201a', bgCard: '#32281e', bgNav: '#241c14',
      bgInput: '#28201a', textPrimary: '#ecddd0', textSecondary: '#a08878',
      textHeading: '#c8ad9d', btnPrimaryBg: '#6f4f3a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#836350', btnSecondaryBg: 'transparent', btnSecondaryText: '#ecddd0',
      btnSecondaryBorder: '#483c34', border: '#483c34', borderFocus: '#6f4f3a', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#ffffff', borderDefault: '#584c44',
    },
  },
  champagne: {
    name: 'Champagne',
    family: 'Gold',
    light: {
      bgPrimary: '#fffdf5', bgSecondary: '#fdf4db', bgCard: '#ffffff', bgNav: '#8c6b3f',
      bgInput: '#ffffff', textPrimary: '#4a3c20', textSecondary: '#8c6b3f',
      textHeading: '#6c5430', btnPrimaryBg: '#f3d188', btnPrimaryText: '#4a3c20',
      btnPrimaryHover: '#e8c070', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a3c20',
      btnSecondaryBorder: '#f3d188', border: '#fdf4db', borderFocus: '#d4b063', accent: '#b4716d',
      accentDeep: '#8e4e4a', textOnPrimary: '#4a3c20', borderDefault: '#eee4c8',
    },
    dark: {
      bgPrimary: '#1c1a12', bgSecondary: '#2c2a1c', bgCard: '#363020', bgNav: '#2a2412',
      bgInput: '#2c2a1c', textPrimary: '#f4eccc', textSecondary: '#c4ac78',
      textHeading: '#f3d188', btnPrimaryBg: '#d4b063', btnPrimaryText: '#1c1a12',
      btnPrimaryHover: '#e0c070', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4eccc',
      btnSecondaryBorder: '#4c4630', border: '#4c4630', borderFocus: '#d4b063', accent: '#b4716d',
      accentDeep: '#8e4e4a', textOnPrimary: '#1c1a12', borderDefault: '#5c5640',
    },
  },
  hearthstone: {
    name: 'Hearthstone',
    family: 'Brown',
    light: {
      bgPrimary: '#f8f0ea', bgSecondary: '#e5d5ca', bgCard: '#ffffff', bgNav: '#4e3426',
      bgInput: '#ffffff', textPrimary: '#321e14', textSecondary: '#6f4f3a',
      textHeading: '#4e3426', btnPrimaryBg: '#4e3426', btnPrimaryText: '#f4e0d0',
      btnPrimaryHover: '#3e2818', btnSecondaryBg: 'transparent', btnSecondaryText: '#321e14',
      btnSecondaryBorder: '#c8ad9d', border: '#e5d5ca', borderFocus: '#6f4f3a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#f4e0d0', borderDefault: '#d4c4b8',
    },
    dark: {
      bgPrimary: '#140e0a', bgSecondary: '#221810', bgCard: '#2c2018', bgNav: '#1c1208',
      bgInput: '#221810', textPrimary: '#ecd8c8', textSecondary: '#a08878',
      textHeading: '#c8ad9d', btnPrimaryBg: '#6f4f3a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#836350', btnSecondaryBg: 'transparent', btnSecondaryText: '#ecd8c8',
      btnSecondaryBorder: '#423430', border: '#423430', borderFocus: '#6f4f3a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#524440',
    },
  },
  timber_iron: {
    name: 'Timber Iron',
    family: 'Brown',
    light: {
      bgPrimary: '#f6f2ee', bgSecondary: '#e0d4c8', bgCard: '#ffffff', bgNav: '#3a3830',
      bgInput: '#ffffff', textPrimary: '#2c2820', textSecondary: '#6a6258',
      textHeading: '#3a3830', btnPrimaryBg: '#6a6258', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#4a4840', btnSecondaryBg: 'transparent', btnSecondaryText: '#2c2820',
      btnSecondaryBorder: '#c4b8ac', border: '#e0d4c8', borderFocus: '#6a6258', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#ffffff', borderDefault: '#d0c4b8',
    },
    dark: {
      bgPrimary: '#161412', bgSecondary: '#26221e', bgCard: '#302c28', bgNav: '#1e1c18',
      bgInput: '#26221e', textPrimary: '#e4dcd4', textSecondary: '#948a80',
      textHeading: '#c4b8ac', btnPrimaryBg: '#6a6258', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#807870', btnSecondaryBg: 'transparent', btnSecondaryText: '#e4dcd4',
      btnSecondaryBorder: '#46423e', border: '#46423e', borderFocus: '#6a6258', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#ffffff', borderDefault: '#56524e',
    },
  },

  // ─── Cool & Calm (7) ───

  ocean_breeze: {
    name: 'Ocean Breeze',
    family: 'Teal',
    light: {
      bgPrimary: '#f2f9f8', bgSecondary: '#d7eae2', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#1a3a3c', textSecondary: '#68a395',
      textHeading: '#2c5d60', btnPrimaryBg: '#a8cfc8', btnPrimaryText: '#1a3a3c',
      btnPrimaryHover: '#8abfb8', btnSecondaryBg: 'transparent', btnSecondaryText: '#1a3a3c',
      btnSecondaryBorder: '#a8cfc8', border: '#d7eae2', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#1a3a3c', borderDefault: '#c4dcd8',
    },
    dark: {
      bgPrimary: '#0c1a1c', bgSecondary: '#162428', bgCard: '#1e2e30', bgNav: '#102022',
      bgInput: '#162428', textPrimary: '#d0e8e4', textSecondary: '#7aaba4',
      textHeading: '#a8cfc8', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#d0e8e4',
      btnSecondaryBorder: '#2a484c', border: '#2a484c', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3a585c',
    },
  },
  forest_calm: {
    name: 'Forest Calm',
    family: 'Green',
    light: {
      bgPrimary: '#f2f6f3', bgSecondary: '#dcefe3', bgCard: '#ffffff', bgNav: '#355f50',
      bgInput: '#ffffff', textPrimary: '#1c3028', textSecondary: '#4b7c66',
      textHeading: '#355f50', btnPrimaryBg: '#b2d3c0', btnPrimaryText: '#1c3028',
      btnPrimaryHover: '#9cc0ac', btnSecondaryBg: 'transparent', btnSecondaryText: '#1c3028',
      btnSecondaryBorder: '#b2d3c0', border: '#dcefe3', borderFocus: '#4b7c66', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#1c3028', borderDefault: '#cce4d8',
    },
    dark: {
      bgPrimary: '#0e1812', bgSecondary: '#18281e', bgCard: '#20302a', bgNav: '#142a1e',
      bgInput: '#18281e', textPrimary: '#d4eadd', textSecondary: '#80b498',
      textHeading: '#b2d3c0', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#d4eadd',
      btnSecondaryBorder: '#284a38', border: '#284a38', borderFocus: '#4b7c66', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#385a48',
    },
  },
  sage_cream: {
    name: 'Sage Cream',
    family: 'Sage',
    light: {
      bgPrimary: '#f8f9f6', bgSecondary: '#d8e3da', bgCard: '#ffffff', bgNav: '#889a8d',
      bgInput: '#ffffff', textPrimary: '#2e3830', textSecondary: '#889a8d',
      textHeading: '#5e7164', btnPrimaryBg: '#aebfb4', btnPrimaryText: '#2e3830',
      btnPrimaryHover: '#98aaa0', btnSecondaryBg: 'transparent', btnSecondaryText: '#2e3830',
      btnSecondaryBorder: '#aebfb4', border: '#d8e3da', borderFocus: '#889a8d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#2e3830', borderDefault: '#c8d4cc',
    },
    dark: {
      bgPrimary: '#141a16', bgSecondary: '#1e2822', bgCard: '#26302a', bgNav: '#1a2620',
      bgInput: '#1e2822', textPrimary: '#dce6de', textSecondary: '#889a8d',
      textHeading: '#aebfb4', btnPrimaryBg: '#5e7164', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#728680', btnSecondaryBg: 'transparent', btnSecondaryText: '#dce6de',
      btnSecondaryBorder: '#3a4a3e', border: '#3a4a3e', borderFocus: '#889a8d', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#4a5a4e',
    },
  },
  pine_stone: {
    name: 'Pine Stone',
    family: 'Green',
    light: {
      bgPrimary: '#f2f5f2', bgSecondary: '#d4e0d8', bgCard: '#ffffff', bgNav: '#355f50',
      bgInput: '#ffffff', textPrimary: '#20302a', textSecondary: '#4a6860',
      textHeading: '#355f50', btnPrimaryBg: '#4a6860', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#38544c', btnSecondaryBg: 'transparent', btnSecondaryText: '#20302a',
      btnSecondaryBorder: '#9abcb0', border: '#d4e0d8', borderFocus: '#4a6860', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#c4d0cc',
    },
    dark: {
      bgPrimary: '#101812', bgSecondary: '#1a2820', bgCard: '#20301e', bgNav: '#14261e',
      bgInput: '#1a2820', textPrimary: '#cce0d8', textSecondary: '#78a098',
      textHeading: '#9abcb0', btnPrimaryBg: '#4a6860', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e8078', btnSecondaryBg: 'transparent', btnSecondaryText: '#cce0d8',
      btnSecondaryBorder: '#2a4038', border: '#2a4038', borderFocus: '#4a6860', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3a5048',
    },
  },
  coastal_slate: {
    name: 'Coastal Slate',
    family: 'Blue',
    light: {
      bgPrimary: '#f2f5f7', bgSecondary: '#c8d1d6', bgCard: '#ffffff', bgNav: '#2f3e48',
      bgInput: '#ffffff', textPrimary: '#1e2c38', textSecondary: '#4a5f6a',
      textHeading: '#2f3e48', btnPrimaryBg: '#4a5f6a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#2f3e48', btnSecondaryBg: 'transparent', btnSecondaryText: '#1e2c38',
      btnSecondaryBorder: '#7d98a5', border: '#c8d1d6', borderFocus: '#4a5f6a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#b8c2ca',
    },
    dark: {
      bgPrimary: '#0e1418', bgSecondary: '#181e24', bgCard: '#202830', bgNav: '#141c24',
      bgInput: '#181e24', textPrimary: '#c8d4dc', textSecondary: '#7090a0',
      textHeading: '#7d98a5', btnPrimaryBg: '#4a5f6a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e7a88', btnSecondaryBg: 'transparent', btnSecondaryText: '#c8d4dc',
      btnSecondaryBorder: '#2c3840', border: '#2c3840', borderFocus: '#4a5f6a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3c4850',
    },
  },
  teal_storm: {
    name: 'Teal Storm',
    family: 'Teal',
    light: {
      bgPrimary: '#f0f7f6', bgSecondary: '#d7eae2', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#142830', textSecondary: '#2c5d60',
      textHeading: '#2c5d60', btnPrimaryBg: '#2c5d60', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#1a4044', btnSecondaryBg: 'transparent', btnSecondaryText: '#142830',
      btnSecondaryBorder: '#68a395', border: '#d7eae2', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#c4d8d4',
    },
    dark: {
      bgPrimary: '#081416', bgSecondary: '#121e20', bgCard: '#1a282c', bgNav: '#0e1c20',
      bgInput: '#121e20', textPrimary: '#c8e0dc', textSecondary: '#5a9090',
      textHeading: '#a8cfc8', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#c8e0dc',
      btnSecondaryBorder: '#1e3a3e', border: '#1e3a3e', borderFocus: '#68a395', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#2e4a4e',
    },
  },
  lavender_dreams: {
    name: 'Lavender Dreams',
    family: 'Purple',
    light: {
      bgPrimary: '#faf6fc', bgSecondary: '#e9daec', bgCard: '#ffffff', bgNav: '#805a82',
      bgInput: '#ffffff', textPrimary: '#3e2a42', textSecondary: '#9e78a0',
      textHeading: '#6c4c70', btnPrimaryBg: '#d2b9d7', btnPrimaryText: '#3e2a42',
      btnPrimaryHover: '#bea0c4', btnSecondaryBg: 'transparent', btnSecondaryText: '#3e2a42',
      btnSecondaryBorder: '#d2b9d7', border: '#e9daec', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#3e2a42', borderDefault: '#dacadd',
    },
    dark: {
      bgPrimary: '#161018', bgSecondary: '#221a26', bgCard: '#2c2230', bgNav: '#201828',
      bgInput: '#221a26', textPrimary: '#e8daec', textSecondary: '#a888ac',
      textHeading: '#d2b9d7', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#946e96', btnSecondaryBg: 'transparent', btnSecondaryText: '#e8daec',
      btnSecondaryBorder: '#3e2e42', border: '#3e2e42', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#4e3e54',
    },
  },

  // ─── Bold & Rich (7) ───

  captains_quarters: {
    name: "Captain's Quarters",
    family: 'Blue',
    light: {
      bgPrimary: '#f0f2f4', bgSecondary: '#c8d1d6', bgCard: '#ffffff', bgNav: '#2f3e48',
      bgInput: '#ffffff', textPrimary: '#141c24', textSecondary: '#3a4e5c',
      textHeading: '#2f3e48', btnPrimaryBg: '#2f3e48', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#1e2c38', btnSecondaryBg: 'transparent', btnSecondaryText: '#141c24',
      btnSecondaryBorder: '#7d98a5', border: '#c8d1d6', borderFocus: '#4a5f6a', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#ffffff', borderDefault: '#b8c2ca',
    },
    dark: {
      bgPrimary: '#0a1018', bgSecondary: '#141e28', bgCard: '#1c2830', bgNav: '#0e1820',
      bgInput: '#141e28', textPrimary: '#c0ccd8', textSecondary: '#607888',
      textHeading: '#7d98a5', btnPrimaryBg: '#4a5f6a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e7a88', btnSecondaryBg: 'transparent', btnSecondaryText: '#c0ccd8',
      btnSecondaryBorder: '#243038', border: '#243038', borderFocus: '#4a5f6a', accent: '#b86432',
      accentDeep: '#8a4a25', textOnPrimary: '#ffffff', borderDefault: '#344048',
    },
  },
  inkwell_bronze: {
    name: 'Inkwell Bronze',
    family: 'Blue',
    light: {
      bgPrimary: '#f0f2f6', bgSecondary: '#c8d1d6', bgCard: '#ffffff', bgNav: '#1e2c38',
      bgInput: '#ffffff', textPrimary: '#101820', textSecondary: '#3a4e5c',
      textHeading: '#1e2c38', btnPrimaryBg: '#1e2c38', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#101820', btnSecondaryBg: 'transparent', btnSecondaryText: '#101820',
      btnSecondaryBorder: '#7d98a5', border: '#c8d1d6', borderFocus: '#4a5f6a', accent: '#c8ad9d',
      accentDeep: '#6f4f3a', textOnPrimary: '#ffffff', borderDefault: '#b8c2cc',
    },
    dark: {
      bgPrimary: '#090e14', bgSecondary: '#131820', bgCard: '#1a2028', bgNav: '#0c1218',
      bgInput: '#131820', textPrimary: '#bcc8d4', textSecondary: '#5a7080',
      textHeading: '#7d98a5', btnPrimaryBg: '#3a4e5c', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#4e6070', btnSecondaryBg: 'transparent', btnSecondaryText: '#bcc8d4',
      btnSecondaryBorder: '#202830', border: '#202830', borderFocus: '#4a5f6a', accent: '#c8ad9d',
      accentDeep: '#6f4f3a', textOnPrimary: '#ffffff', borderDefault: '#303840',
    },
  },
  evening_indigo: {
    name: 'Evening Indigo',
    family: 'Blue',
    light: {
      bgPrimary: '#f2f2f8', bgSecondary: '#c8cce0', bgCard: '#ffffff', bgNav: '#2c2e4a',
      bgInput: '#ffffff', textPrimary: '#18183a', textSecondary: '#404268',
      textHeading: '#2c2e4a', btnPrimaryBg: '#404268', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#2c2e50', btnSecondaryBg: 'transparent', btnSecondaryText: '#18183a',
      btnSecondaryBorder: '#8890b8', border: '#c8cce0', borderFocus: '#404268', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#b8bcd0',
    },
    dark: {
      bgPrimary: '#0c0c14', bgSecondary: '#161820', bgCard: '#1e1e2c', bgNav: '#12121e',
      bgInput: '#161820', textPrimary: '#c4c8dc', textSecondary: '#6870a0',
      textHeading: '#8890b8', btnPrimaryBg: '#404268', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#565880', btnSecondaryBg: 'transparent', btnSecondaryText: '#c4c8dc',
      btnSecondaryBorder: '#262838', border: '#262838', borderFocus: '#404268', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#363848',
    },
  },
  plum_electric: {
    name: 'Plum Electric',
    family: 'Purple',
    light: {
      bgPrimary: '#f6f0fa', bgSecondary: '#e4d0ec', bgCard: '#ffffff', bgNav: '#5d3e60',
      bgInput: '#ffffff', textPrimary: '#30183a', textSecondary: '#805a82',
      textHeading: '#5d3e60', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5d3e60', btnSecondaryBg: 'transparent', btnSecondaryText: '#30183a',
      btnSecondaryBorder: '#c0a0c8', border: '#e4d0ec', borderFocus: '#805a82', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#ffffff', borderDefault: '#d4c0dc',
    },
    dark: {
      bgPrimary: '#120c18', bgSecondary: '#1e1426', bgCard: '#281a30', bgNav: '#1a1022',
      bgInput: '#1e1426', textPrimary: '#ead4f0', textSecondary: '#a878b0',
      textHeading: '#d2b9d7', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#946e96', btnSecondaryBg: 'transparent', btnSecondaryText: '#ead4f0',
      btnSecondaryBorder: '#3a2840', border: '#3a2840', borderFocus: '#805a82', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#ffffff', borderDefault: '#4a3850',
    },
  },
  midnight_berry: {
    name: 'Midnight Berry',
    family: 'Purple',
    light: {
      bgPrimary: '#f8f0f4', bgSecondary: '#ecd4e0', bgCard: '#ffffff', bgNav: '#4e2840',
      bgInput: '#ffffff', textPrimary: '#280e20', textSecondary: '#7a4060',
      textHeading: '#4e2840', btnPrimaryBg: '#7a4060', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#4e2840', btnSecondaryBg: 'transparent', btnSecondaryText: '#280e20',
      btnSecondaryBorder: '#c08aac', border: '#ecd4e0', borderFocus: '#7a4060', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#dcc4d4',
    },
    dark: {
      bgPrimary: '#100810', bgSecondary: '#1e1020', bgCard: '#281828', bgNav: '#1c0e1a',
      bgInput: '#1e1020', textPrimary: '#e8d0e0', textSecondary: '#9a6888',
      textHeading: '#c08aac', btnPrimaryBg: '#7a4060', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#904e76', btnSecondaryBg: 'transparent', btnSecondaryText: '#e8d0e0',
      btnSecondaryBorder: '#38202e', border: '#38202e', borderFocus: '#7a4060', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#48303e',
    },
  },
  sunset_blaze: {
    name: 'Sunset Blaze',
    family: 'Orange',
    light: {
      bgPrimary: '#fff4ec', bgSecondary: '#fde3c7', bgCard: '#ffffff', bgNav: '#8a4a25',
      bgInput: '#ffffff', textPrimary: '#3a1e08', textSecondary: '#b86432',
      textHeading: '#8a4a25', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#8a4a25', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a1e08',
      btnSecondaryBorder: '#f9c396', border: '#fde3c7', borderFocus: '#b86432', accent: '#b25a58',
      accentDeep: '#8e3e3c', textOnPrimary: '#ffffff', borderDefault: '#edd8b8',
    },
    dark: {
      bgPrimary: '#160e06', bgSecondary: '#281a0c', bgCard: '#342212', bgNav: '#1e1008',
      bgInput: '#281a0c', textPrimary: '#f8e0c8', textSecondary: '#c89060',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#d07848', btnSecondaryBg: 'transparent', btnSecondaryText: '#f8e0c8',
      btnSecondaryBorder: '#4a3020', border: '#4a3020', borderFocus: '#b86432', accent: '#b25a58',
      accentDeep: '#8e3e3c', textOnPrimary: '#ffffff', borderDefault: '#5a4030',
    },
  },

  // ─── Soft & Light (5) ───

  peach_garden: {
    name: 'Peach Garden',
    family: 'Orange',
    light: {
      bgPrimary: '#fff9f4', bgSecondary: '#fde3c7', bgCard: '#ffffff', bgNav: '#b86432',
      bgInput: '#ffffff', textPrimary: '#4a2e18', textSecondary: '#b86432',
      textHeading: '#8a4a25', btnPrimaryBg: '#fde3c7', btnPrimaryText: '#4a2e18',
      btnPrimaryHover: '#f9c396', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a2e18',
      btnSecondaryBorder: '#f9c396', border: '#fde3c7', borderFocus: '#b86432', accent: '#b4716d',
      accentDeep: '#8e4e4a', textOnPrimary: '#4a2e18', borderDefault: '#edd8c0',
    },
    dark: {
      bgPrimary: '#1c1612', bgSecondary: '#2c2218', bgCard: '#342a1e', bgNav: '#2a1e10',
      bgInput: '#2c2218', textPrimary: '#f4e4d4', textSecondary: '#c49878',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#cc7844', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4e4d4',
      btnSecondaryBorder: '#4c3828', border: '#4c3828', borderFocus: '#b86432', accent: '#b4716d',
      accentDeep: '#8e4e4a', textOnPrimary: '#ffffff', borderDefault: '#5c4838',
    },
  },
  berry_soft: {
    name: 'Berry Soft',
    family: 'Purple',
    light: {
      bgPrimary: '#faf4f8', bgSecondary: '#ecd4e4', bgCard: '#ffffff', bgNav: '#805a82',
      bgInput: '#ffffff', textPrimary: '#3a1e38', textSecondary: '#9e78a0',
      textHeading: '#6c4c70', btnPrimaryBg: '#ecd4e4', btnPrimaryText: '#3a1e38',
      btnPrimaryHover: '#d8bece', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a1e38',
      btnSecondaryBorder: '#d2b9d7', border: '#ecd4e4', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#3a1e38', borderDefault: '#dcc8d8',
    },
    dark: {
      bgPrimary: '#180e18', bgSecondary: '#261824', bgCard: '#30202e', bgNav: '#221422',
      bgInput: '#261824', textPrimary: '#ecdce8', textSecondary: '#a878aa',
      textHeading: '#d2b9d7', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#946e96', btnSecondaryBg: 'transparent', btnSecondaryText: '#ecdce8',
      btnSecondaryBorder: '#3e2c3e', border: '#3e2c3e', borderFocus: '#805a82', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#4e3c4e',
    },
  },
  morning_mist: {
    name: 'Morning Mist',
    family: 'Sage',
    light: {
      bgPrimary: '#f6f8f7', bgSecondary: '#d8e3da', bgCard: '#ffffff', bgNav: '#889a8d',
      bgInput: '#ffffff', textPrimary: '#2c3830', textSecondary: '#7a9480',
      textHeading: '#5e7164', btnPrimaryBg: '#d8e3da', btnPrimaryText: '#2c3830',
      btnPrimaryHover: '#c4d0c8', btnSecondaryBg: 'transparent', btnSecondaryText: '#2c3830',
      btnSecondaryBorder: '#aebfb4', border: '#d8e3da', borderFocus: '#889a8d', accent: '#7d98a5',
      accentDeep: '#4a5f6a', textOnPrimary: '#2c3830', borderDefault: '#c8d4cc',
    },
    dark: {
      bgPrimary: '#121a14', bgSecondary: '#1c2820', bgCard: '#24302c', bgNav: '#1a2820',
      bgInput: '#1c2820', textPrimary: '#d8e6da', textSecondary: '#809890',
      textHeading: '#aebfb4', btnPrimaryBg: '#5e7164', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#728678', btnSecondaryBg: 'transparent', btnSecondaryText: '#d8e6da',
      btnSecondaryBorder: '#384a3e', border: '#384a3e', borderFocus: '#889a8d', accent: '#7d98a5',
      accentDeep: '#4a5f6a', textOnPrimary: '#ffffff', borderDefault: '#485a4e',
    },
  },
  petal_honey: {
    name: 'Petal Honey',
    family: 'Pink',
    light: {
      bgPrimary: '#fff8f6', bgSecondary: '#fce8e3', bgCard: '#ffffff', bgNav: '#b4716d',
      bgInput: '#ffffff', textPrimary: '#4a2c2a', textSecondary: '#c08080',
      textHeading: '#8e4e4a', btnPrimaryBg: '#fce8e3', btnPrimaryText: '#4a2c2a',
      btnPrimaryHover: '#f5d4cc', btnSecondaryBg: 'transparent', btnSecondaryText: '#4a2c2a',
      btnSecondaryBorder: '#f5c1ba', border: '#fce8e3', borderFocus: '#b4716d', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#4a2c2a', borderDefault: '#eed8d4',
    },
    dark: {
      bgPrimary: '#1a1214', bgSecondary: '#2a1e20', bgCard: '#32262a', bgNav: '#3a2226',
      bgInput: '#2a1e20', textPrimary: '#f0dcd8', textSecondary: '#be8888',
      textHeading: '#f5c1ba', btnPrimaryBg: '#b4716d', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#c88480', btnSecondaryBg: 'transparent', btnSecondaryText: '#f0dcd8',
      btnSecondaryBorder: '#4a3438', border: '#4a3438', borderFocus: '#b4716d', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#5a4448',
    },
  },
  cloud_nine: {
    name: 'Cloud Nine',
    family: 'Blue',
    light: {
      bgPrimary: '#f6f9fc', bgSecondary: '#d0d8e4', bgCard: '#ffffff', bgNav: '#4a5f6a',
      bgInput: '#ffffff', textPrimary: '#20303c', textSecondary: '#5a7888',
      textHeading: '#2f3e48', btnPrimaryBg: '#d0d8e4', btnPrimaryText: '#20303c',
      btnPrimaryHover: '#bcc6d4', btnSecondaryBg: 'transparent', btnSecondaryText: '#20303c',
      btnSecondaryBorder: '#7d98a5', border: '#d0d8e4', borderFocus: '#4a5f6a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#20303c', borderDefault: '#c0cad4',
    },
    dark: {
      bgPrimary: '#0e141a', bgSecondary: '#181e28', bgCard: '#202830', bgNav: '#141c24',
      bgInput: '#181e28', textPrimary: '#c4d4e0', textSecondary: '#6888a0',
      textHeading: '#7d98a5', btnPrimaryBg: '#4a5f6a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e7a88', btnSecondaryBg: 'transparent', btnSecondaryText: '#c4d4e0',
      btnSecondaryBorder: '#2a3840', border: '#2a3840', borderFocus: '#4a5f6a', accent: '#d6a461',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#3a4850',
    },
  },

  // ─── Bright & Fun (6) ───

  sunshine_day: {
    name: 'Sunshine Day',
    family: 'Yellow',
    light: {
      bgPrimary: '#fffdf0', bgSecondary: '#fff6d5', bgCard: '#ffffff', bgNav: '#8a7220',
      bgInput: '#ffffff', textPrimary: '#3a2e08', textSecondary: '#8a7220',
      textHeading: '#6a5418', btnPrimaryBg: '#fae49b', btnPrimaryText: '#3a2e08',
      btnPrimaryHover: '#f0d480', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a2e08',
      btnSecondaryBorder: '#fae49b', border: '#fff6d5', borderFocus: '#b99c34', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#3a2e08', borderDefault: '#eeeac0',
    },
    dark: {
      bgPrimary: '#181408', bgSecondary: '#282010', bgCard: '#302818', bgNav: '#201c08',
      bgInput: '#282010', textPrimary: '#f4eecc', textSecondary: '#b8a458',
      textHeading: '#fae49b', btnPrimaryBg: '#b99c34', btnPrimaryText: '#181408',
      btnPrimaryHover: '#ccac44', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4eecc',
      btnSecondaryBorder: '#483e18', border: '#483e18', borderFocus: '#b99c34', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#181408', borderDefault: '#584e28',
    },
  },
  garden_party: {
    name: 'Garden Party',
    family: 'Green',
    light: {
      bgPrimary: '#f4fcf6', bgSecondary: '#dcefe3', bgCard: '#ffffff', bgNav: '#4b7c66',
      bgInput: '#ffffff', textPrimary: '#1a3824', textSecondary: '#4b7c66',
      textHeading: '#355f50', btnPrimaryBg: '#b2d3c0', btnPrimaryText: '#1a3824',
      btnPrimaryHover: '#9cc0ac', btnSecondaryBg: 'transparent', btnSecondaryText: '#1a3824',
      btnSecondaryBorder: '#b2d3c0', border: '#dcefe3', borderFocus: '#4b7c66', accent: '#f5c1ba',
      accentDeep: '#b4716d', textOnPrimary: '#1a3824', borderDefault: '#cce4d4',
    },
    dark: {
      bgPrimary: '#0c1c14', bgSecondary: '#162a1e', bgCard: '#1e3228', bgNav: '#122c20',
      bgInput: '#162a1e', textPrimary: '#d4ecdc', textSecondary: '#7ab898',
      textHeading: '#b2d3c0', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#d4ecdc',
      btnSecondaryBorder: '#264a38', border: '#264a38', borderFocus: '#4b7c66', accent: '#f5c1ba',
      accentDeep: '#b4716d', textOnPrimary: '#ffffff', borderDefault: '#365a48',
    },
  },
  ocean_adventure: {
    name: 'Ocean Adventure',
    family: 'Teal',
    light: {
      bgPrimary: '#eef8f8', bgSecondary: '#d7eae2', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#0e2830', textSecondary: '#2c5d60',
      textHeading: '#2c5d60', btnPrimaryBg: '#a8cfc8', btnPrimaryText: '#0e2830',
      btnPrimaryHover: '#8abfb8', btnSecondaryBg: 'transparent', btnSecondaryText: '#0e2830',
      btnSecondaryBorder: '#a8cfc8', border: '#d7eae2', borderFocus: '#68a395', accent: '#fae49b',
      accentDeep: '#b99c34', textOnPrimary: '#0e2830', borderDefault: '#c4dcd8',
    },
    dark: {
      bgPrimary: '#081416', bgSecondary: '#101e22', bgCard: '#182428', bgNav: '#0c1c20',
      bgInput: '#101e22', textPrimary: '#c4e0dc', textSecondary: '#5a9898',
      textHeading: '#a8cfc8', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#c4e0dc',
      btnSecondaryBorder: '#1c3c40', border: '#1c3c40', borderFocus: '#68a395', accent: '#fae49b',
      accentDeep: '#b99c34', textOnPrimary: '#ffffff', borderDefault: '#2c4c50',
    },
  },
  berry_bright: {
    name: 'Berry Bright',
    family: 'Pink',
    light: {
      bgPrimary: '#fff4f4', bgSecondary: '#f8d6d0', bgCard: '#ffffff', bgNav: '#b25a58',
      bgInput: '#ffffff', textPrimary: '#3a1416', textSecondary: '#b25a58',
      textHeading: '#8e3e3c', btnPrimaryBg: '#f3a6a0', btnPrimaryText: '#3a1416',
      btnPrimaryHover: '#e09090', btnSecondaryBg: 'transparent', btnSecondaryText: '#3a1416',
      btnSecondaryBorder: '#f3a6a0', border: '#f8d6d0', borderFocus: '#b25a58', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#3a1416', borderDefault: '#ecc8c4',
    },
    dark: {
      bgPrimary: '#18100e', bgSecondary: '#281a18', bgCard: '#30201e', bgNav: '#221414',
      bgInput: '#281a18', textPrimary: '#f4dcd8', textSecondary: '#c08888',
      textHeading: '#f3a6a0', btnPrimaryBg: '#b25a58', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#c46e6c', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4dcd8',
      btnSecondaryBorder: '#483028', border: '#483028', borderFocus: '#b25a58', accent: '#d4b063',
      accentDeep: '#8c6b3f', textOnPrimary: '#ffffff', borderDefault: '#584038',
    },
  },
  minty_fresh: {
    name: 'Minty Fresh',
    family: 'Green',
    light: {
      bgPrimary: '#f2faf6', bgSecondary: '#dcefe3', bgCard: '#ffffff', bgNav: '#4b7c66',
      bgInput: '#ffffff', textPrimary: '#143020', textSecondary: '#4b7c66',
      textHeading: '#355f50', btnPrimaryBg: '#dcefe3', btnPrimaryText: '#143020',
      btnPrimaryHover: '#c8e2d4', btnSecondaryBg: 'transparent', btnSecondaryText: '#143020',
      btnSecondaryBorder: '#b2d3c0', border: '#dcefe3', borderFocus: '#4b7c66', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#143020', borderDefault: '#cce4d8',
    },
    dark: {
      bgPrimary: '#0c1a12', bgSecondary: '#16261c', bgCard: '#1e3028', bgNav: '#122a1c',
      bgInput: '#16261c', textPrimary: '#d0ecdc', textSecondary: '#7ab898',
      textHeading: '#b2d3c0', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#d0ecdc',
      btnSecondaryBorder: '#244a36', border: '#244a36', borderFocus: '#4b7c66', accent: '#68a395',
      accentDeep: '#2c5d60', textOnPrimary: '#ffffff', borderDefault: '#345a46',
    },
  },
  peachy_keen: {
    name: 'Peachy Keen',
    family: 'Orange',
    light: {
      bgPrimary: '#fff8f4', bgSecondary: '#fde3c7', bgCard: '#ffffff', bgNav: '#b86432',
      bgInput: '#ffffff', textPrimary: '#402010', textSecondary: '#b86432',
      textHeading: '#8a4a25', btnPrimaryBg: '#fde3c7', btnPrimaryText: '#402010',
      btnPrimaryHover: '#f9d0b0', btnSecondaryBg: 'transparent', btnSecondaryText: '#402010',
      btnSecondaryBorder: '#f9c396', border: '#fde3c7', borderFocus: '#b86432', accent: '#b25a58',
      accentDeep: '#8e3e3c', textOnPrimary: '#402010', borderDefault: '#edd4b8',
    },
    dark: {
      bgPrimary: '#1a1410', bgSecondary: '#2a2018', bgCard: '#342a1e', bgNav: '#2c1e0e',
      bgInput: '#2a2018', textPrimary: '#f4dece', textSecondary: '#c89868',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#cc7844', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4dece',
      btnSecondaryBorder: '#4a3828', border: '#4a3828', borderFocus: '#b86432', accent: '#b25a58',
      accentDeep: '#8e3e3c', textOnPrimary: '#ffffff', borderDefault: '#5a4838',
    },
  },
}
