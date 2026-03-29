import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { themes, vibes, brand, status, shellScaling } from './tokens'
import type { ThemeKey, VibeKey, ShellType, ThemeColors, VibeConfig } from './tokens'
import { applyShellTokens } from './shellTokens'

type ColorMode = 'light' | 'dark' | 'system'
type FontScale = 'small' | 'default' | 'large' | 'extra-large'

interface ThemeContextType {
  theme: ThemeKey
  vibe: VibeKey
  colorMode: ColorMode
  effectiveColorMode: 'light' | 'dark'
  gradientEnabled: boolean
  fontScale: FontScale
  shell: ShellType
  setTheme: (theme: ThemeKey) => void
  setVibe: (vibe: VibeKey) => void
  setColorMode: (mode: ColorMode) => void
  setGradientEnabled: (enabled: boolean) => void
  setFontScale: (scale: FontScale) => void
  setShell: (shell: ShellType) => void
  themeConfig: ThemeColors
  vibeConfig: VibeConfig
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

function getSystemColorMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTokens(
  themeKey: ThemeKey,
  vibeKey: VibeKey,
  isDark: boolean,
  gradientEnabled: boolean,
  shell: ShellType,
  fontScale: FontScale,
) {
  const theme = themes[themeKey]
  const vibe = vibes[vibeKey]
  const colors = isDark ? theme.dark : theme.light
  const scale = shellScaling[shell]
  const root = document.documentElement

  // Color tokens
  root.style.setProperty('--color-bg-primary', colors.bgPrimary)
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--color-bg-card', colors.bgCard)
  root.style.setProperty('--color-bg-nav', colors.bgNav)
  root.style.setProperty('--color-bg-input', colors.bgInput)
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-text-heading', colors.textHeading)
  root.style.setProperty('--color-btn-primary-bg', colors.btnPrimaryBg)
  root.style.setProperty('--color-btn-primary-text', colors.btnPrimaryText)
  root.style.setProperty('--color-btn-primary-hover', colors.btnPrimaryHover)
  root.style.setProperty('--color-btn-secondary-bg', colors.btnSecondaryBg)
  root.style.setProperty('--color-btn-secondary-text', colors.btnSecondaryText)
  root.style.setProperty('--color-btn-secondary-border', colors.btnSecondaryBorder)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-border-focus', colors.borderFocus)
  root.style.setProperty('--color-accent', colors.accent)
  // Semantic tooltip / overlay / border tokens
  root.style.setProperty('--color-accent-deep', colors.accentDeep)
  root.style.setProperty('--color-text-on-primary', colors.textOnPrimary)
  root.style.setProperty('--color-border-default', colors.borderDefault)
  root.style.setProperty('--font-size-xs', '0.75rem')

  // Legacy tokens (backward compat with Phase 00-02 components)
  root.style.setProperty('--theme-primary', colors.btnPrimaryBg)
  root.style.setProperty('--theme-primary-hover', colors.btnPrimaryHover)
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-background', colors.bgPrimary)
  root.style.setProperty('--theme-surface', colors.bgSecondary)
  root.style.setProperty('--theme-text', colors.textPrimary)
  root.style.setProperty('--theme-text-muted', colors.textSecondary)
  root.style.setProperty('--theme-border', colors.border)

  // Status tokens (universal)
  root.style.setProperty('--color-success', status.success)
  root.style.setProperty('--color-warning', status.warning)
  root.style.setProperty('--color-error', status.error)
  root.style.setProperty('--color-info', status.info)
  root.style.setProperty('--color-pending', status.pending)
  root.style.setProperty('--color-victory', status.victory)
  root.style.setProperty('--theme-success', status.success)
  root.style.setProperty('--theme-warning', status.warning)
  root.style.setProperty('--theme-error', status.error)

  // Vibe tokens
  const rm = scale.radiusMultiplier
  root.style.setProperty('--vibe-radius-card', `calc(${vibe.radiusCard} * ${rm})`)
  root.style.setProperty('--vibe-radius-input', `calc(${vibe.radiusInput} * ${rm})`)
  root.style.setProperty('--vibe-radius-modal', `calc(${vibe.radiusModal} * ${rm})`)
  root.style.setProperty('--vibe-shadow-color', vibe.shadowColor)
  root.style.setProperty('--vibe-shadow-spread', vibe.shadowSpread)
  root.style.setProperty('--vibe-spacing-density', String(vibe.spacingDensity * scale.spacingMultiplier))
  root.style.setProperty('--vibe-transition', scale.animationSpeed + ' ease')

  // Font tokens
  root.style.setProperty('--font-heading', vibe.fontHeading)
  root.style.setProperty('--font-body', vibe.fontBody)
  root.style.setProperty('--heading-scale', String(vibe.headingScale))

  // Gradient tokens + --surface-primary for consistent gradient toggle
  // Rule: buttons, nav, active chips, selected states use --surface-primary
  // Cards, inputs, backgrounds: never gradient (too noisy)
  if (gradientEnabled) {
    const gradientPrimary = `linear-gradient(135deg, ${colors.btnPrimaryBg} 0%, ${colors.accent} 100%)`
    root.style.setProperty('--gradient-primary', gradientPrimary)
    root.style.setProperty('--gradient-background', `linear-gradient(135deg, ${colors.bgPrimary} 0%, ${colors.bgSecondary} 100%)`)
    root.style.setProperty('--gradient-card', `linear-gradient(135deg, ${colors.bgCard} 0%, ${colors.bgSecondary} 100%)`)
    root.style.setProperty('--surface-primary', gradientPrimary)
    root.style.setProperty('--surface-nav', `linear-gradient(135deg, ${colors.bgNav} 0%, ${colors.btnPrimaryBg} 100%)`)
    root.classList.add('gradient-on')
    root.classList.remove('gradient-off')
  } else {
    root.style.removeProperty('--gradient-primary')
    root.style.removeProperty('--gradient-background')
    root.style.removeProperty('--gradient-card')
    root.style.setProperty('--surface-primary', colors.btnPrimaryBg)
    root.style.setProperty('--surface-nav', colors.bgNav)
    root.classList.add('gradient-off')
    root.classList.remove('gradient-on')
  }

  // Brand color tokens
  root.style.setProperty('--color-sage-teal', brand.sageTeal)
  root.style.setProperty('--color-warm-earth', brand.warmEarth)
  root.style.setProperty('--color-golden-honey', brand.goldenHoney)
  root.style.setProperty('--color-dusty-rose', brand.dustyRose)
  root.style.setProperty('--color-soft-sage', brand.softSage)
  root.style.setProperty('--color-warm-cream', brand.warmCream)
  root.style.setProperty('--color-deep-ocean', brand.deepOcean)
  root.style.setProperty('--color-soft-gold', brand.softGold)

  // Transition tokens
  root.style.setProperty('--transition-fast', '150ms ease')
  root.style.setProperty('--transition-normal', '250ms ease')
  root.style.setProperty('--transition-slow', '400ms ease')

  // Radius tokens (resolved from vibe + shell)
  root.style.setProperty('--radius-card', `calc(${vibe.radiusCard} * ${scale.radiusMultiplier})`)
  root.style.setProperty('--radius-input', `calc(${vibe.radiusInput} * ${scale.radiusMultiplier})`)
  root.style.setProperty('--radius-modal', `calc(${vibe.radiusModal} * ${scale.radiusMultiplier})`)

  // Font family tokens
  root.style.setProperty('--font-heading', vibe.fontHeading)
  root.style.setProperty('--font-body', vibe.fontBody)

  // Font scale — set directly on root to avoid Tailwind CSS cascade issues
  const fontSizeMap: Record<string, string> = {
    'small': '14px',
    'default': '16px',
    'large': '18px',
    'extra-large': '20px',
  }
  root.style.fontSize = fontSizeMap[fontScale] || '16px'

  // Scrollbar colors derive from --color-bg-secondary, --color-btn-primary-bg,
  // --gradient-primary, and --color-accent — all already set above. No extra vars needed.

  // Layout tokens
  root.style.setProperty('--spacing-xs', '0.25rem')
  root.style.setProperty('--spacing-sm', '0.5rem')
  root.style.setProperty('--spacing-md', '1rem')
  root.style.setProperty('--spacing-lg', '1.5rem')
  root.style.setProperty('--spacing-xl', '2rem')
  root.style.setProperty('--shadow-sm', `0 1px 2px ${vibe.shadowColor}`)
  root.style.setProperty('--shadow-md', `0 2px ${vibe.shadowSpread} ${vibe.shadowColor}`)
  root.style.setProperty('--shadow-lg', `0 4px calc(${vibe.shadowSpread} * 2) ${vibe.shadowColor}`)
  root.style.setProperty('--touch-target-min', '44px')
  root.style.setProperty('--nav-height', '56px')
  root.style.setProperty('--sidebar-width', '240px')

  // Shell-specific token overrides (font-size-base, touch-target-min, etc.)
  applyShellTokens(shell)
}

interface ThemeProviderProps {
  children: ReactNode
  defaultShell?: ShellType
}

export function ThemeProvider({ children, defaultShell = 'mom' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeKey>(() =>
    (localStorage.getItem('myaim-theme') as ThemeKey) || 'classic'
  )
  const [vibe, setVibeState] = useState<VibeKey>(() =>
    (localStorage.getItem('myaim-vibe') as VibeKey) || 'classic'
  )
  const [colorMode, setColorModeState] = useState<ColorMode>(() =>
    (localStorage.getItem('myaim-color-mode') as ColorMode) || 'system'
  )
  const [gradientEnabled, setGradientEnabledState] = useState<boolean>(() =>
    localStorage.getItem('myaim-gradient') !== 'false'
  )
  const [fontScale, setFontScaleState] = useState<FontScale>(() =>
    (localStorage.getItem('myaim-font-scale') as FontScale) || 'default'
  )
  const [shell, setShell] = useState<ShellType>(defaultShell)
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(getSystemColorMode)

  const effectiveColorMode = colorMode === 'system' ? systemMode : colorMode

  // Listen for system color scheme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Apply tokens whenever anything changes
  useEffect(() => {
    applyTokens(theme, vibe, effectiveColorMode === 'dark', gradientEnabled, shell, fontScale)
  }, [theme, vibe, effectiveColorMode, gradientEnabled, shell, fontScale])

  const setTheme = useCallback((t: ThemeKey) => {
    setThemeState(t)
    localStorage.setItem('myaim-theme', t)
  }, [])

  const setVibe = useCallback((v: VibeKey) => {
    setVibeState(v)
    localStorage.setItem('myaim-vibe', v)
  }, [])

  const setColorMode = useCallback((m: ColorMode) => {
    setColorModeState(m)
    localStorage.setItem('myaim-color-mode', m)
  }, [])

  const setGradientEnabled = useCallback((g: boolean) => {
    setGradientEnabledState(g)
    localStorage.setItem('myaim-gradient', String(g))
  }, [])

  const setFontScale = useCallback((s: FontScale) => {
    setFontScaleState(s)
    localStorage.setItem('myaim-font-scale', s)
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme, vibe, colorMode, effectiveColorMode, gradientEnabled, fontScale, shell,
        setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale, setShell,
        themeConfig: themes[theme],
        vibeConfig: vibes[vibe],
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
