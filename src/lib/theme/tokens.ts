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
  | 'classic' | 'sage_garden' | 'rose_gold' | 'ocean_depth'
  | 'golden_hour' | 'lavender_fields' | 'earth_tones' | 'sunset_coral'
  | 'mint_fresh'

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
  }
}

export const themes: Record<ThemeKey, ThemeColors> = {
  classic: {
    name: 'Classic MyAIM',
    family: 'Brand',
    light: {
      bgPrimary: '#fff4ec', bgSecondary: '#d4e3d9', bgCard: '#ffffff', bgNav: '#2c5d60',
      bgInput: '#ffffff', textPrimary: '#5a4033', textSecondary: '#7a6a5f',
      textHeading: '#5a4033', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#2c5d60', btnSecondaryBg: 'transparent', btnSecondaryText: '#5a4033',
      btnSecondaryBorder: '#d4e3d9', border: '#d4e3d9', borderFocus: '#68a395', accent: '#d6a461',
    },
    dark: {
      bgPrimary: '#1a1412', bgSecondary: '#2a2420', bgCard: '#322c28', bgNav: '#1e3a3c',
      bgInput: '#2a2420', textPrimary: '#f0e6dc', textSecondary: '#b0a69c',
      textHeading: '#f4dcb7', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#f0e6dc',
      btnSecondaryBorder: '#4a4440', border: '#4a4440', borderFocus: '#68a395', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#141a16', bgSecondary: '#1e2a22', bgCard: '#243028', bgNav: '#1a2e24',
      bgInput: '#1e2a22', textPrimary: '#d8e3da', textSecondary: '#889a8d',
      textHeading: '#aebfb4', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#d8e3da',
      btnSecondaryBorder: '#3a4a40', border: '#3a4a40', borderFocus: '#4b7c66', accent: '#889a8d',
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
    },
    dark: {
      bgPrimary: '#1a1214', bgSecondary: '#2a1e20', bgCard: '#322428', bgNav: '#3a2228',
      bgInput: '#2a1e20', textPrimary: '#f5e0dc', textSecondary: '#c08a86',
      textHeading: '#f5c1ba', btnPrimaryBg: '#b4716d', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#c88480', btnSecondaryBg: 'transparent', btnSecondaryText: '#f5e0dc',
      btnSecondaryBorder: '#4a3438', border: '#4a3438', borderFocus: '#b4716d', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#0e1a1c', bgSecondary: '#162628', bgCard: '#1e3032', bgNav: '#142224',
      bgInput: '#162628', textPrimary: '#d7eae2', textSecondary: '#7aaba4',
      textHeading: '#a8cfc8', btnPrimaryBg: '#68a395', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#7ab5a7', btnSecondaryBg: 'transparent', btnSecondaryText: '#d7eae2',
      btnSecondaryBorder: '#2c4a4e', border: '#2c4a4e', borderFocus: '#68a395', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#1a1610', bgSecondary: '#2a2418', bgCard: '#322c1e', bgNav: '#2a2010',
      bgInput: '#2a2418', textPrimary: '#f4e8d0', textSecondary: '#c4a878',
      textHeading: '#f3d188', btnPrimaryBg: '#d4b063', btnPrimaryText: '#1a1610',
      btnPrimaryHover: '#e0c070', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4e8d0',
      btnSecondaryBorder: '#4a4030', border: '#4a4030', borderFocus: '#d4b063', accent: '#b86432',
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
    },
    dark: {
      bgPrimary: '#181418', bgSecondary: '#241e26', bgCard: '#2e2630', bgNav: '#261e28',
      bgInput: '#241e26', textPrimary: '#e4d8e6', textSecondary: '#a88aac',
      textHeading: '#d2b9d7', btnPrimaryBg: '#805a82', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#946e96', btnSecondaryBg: 'transparent', btnSecondaryText: '#e4d8e6',
      btnSecondaryBorder: '#443a46', border: '#443a46', borderFocus: '#805a82', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#161210', bgSecondary: '#241e1a', bgCard: '#2e2622', bgNav: '#201814',
      bgInput: '#241e1a', textPrimary: '#e5d5ca', textSecondary: '#a08878',
      textHeading: '#c8ad9d', btnPrimaryBg: '#6f4f3a', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#836350', btnSecondaryBg: 'transparent', btnSecondaryText: '#e5d5ca',
      btnSecondaryBorder: '#443a34', border: '#443a34', borderFocus: '#6f4f3a', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#1a1410', bgSecondary: '#2a2018', bgCard: '#322820', bgNav: '#2a1c10',
      bgInput: '#2a2018', textPrimary: '#f4dcc8', textSecondary: '#c49060',
      textHeading: '#f9c396', btnPrimaryBg: '#b86432', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#cc7844', btnSecondaryBg: 'transparent', btnSecondaryText: '#f4dcc8',
      btnSecondaryBorder: '#4a3828', border: '#4a3828', borderFocus: '#b86432', accent: '#d6a461',
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
    },
    dark: {
      bgPrimary: '#101a14', bgSecondary: '#1a2a20', bgCard: '#223028', bgNav: '#142820',
      bgInput: '#1a2a20', textPrimary: '#dcefe3', textSecondary: '#80b498',
      textHeading: '#b2d3c0', btnPrimaryBg: '#4b7c66', btnPrimaryText: '#ffffff',
      btnPrimaryHover: '#5e9478', btnSecondaryBg: 'transparent', btnSecondaryText: '#dcefe3',
      btnSecondaryBorder: '#2a4a38', border: '#2a4a38', borderFocus: '#4b7c66', accent: '#d6a461',
    },
  },
}
