import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useTheme } from './ThemeProvider'

interface ThemePreferences {
  theme: string
  vibe: string
  colorMode: string
  gradientEnabled: boolean
  fontScale: string
}

/**
 * Syncs theme preferences bidirectionally with Supabase.
 *
 * - On mount: loads theme prefs from family_members.theme_preferences JSONB.
 *   If DB value exists and differs from localStorage, DB wins.
 * - On theme/vibe/colorMode/gradient/fontScale change: debounces 1 second,
 *   then persists to family_members.theme_preferences.
 *
 * PRD-03 — Theme Persistence
 */
export function useThemePersistence(): void {
  const { data: member } = useFamilyMember()
  const { theme, vibe, colorMode, gradientEnabled, fontScale, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale } = useTheme()

  // Track whether we've done the initial load from DB yet
  const loadedFromDb = useRef(false)

  // Load from DB on mount (once we have member data)
  useEffect(() => {
    if (!member || loadedFromDb.current) return

    const prefs = member.theme_preferences as Partial<ThemePreferences> | null
    if (!prefs) {
      loadedFromDb.current = true
      return
    }

    // DB is source of truth — apply any values that exist
    if (prefs.theme && prefs.theme !== theme) {
      setTheme(prefs.theme as Parameters<typeof setTheme>[0])
    }
    if (prefs.vibe && prefs.vibe !== vibe) {
      setVibe(prefs.vibe as Parameters<typeof setVibe>[0])
    }
    if (prefs.colorMode && prefs.colorMode !== colorMode) {
      setColorMode(prefs.colorMode as Parameters<typeof setColorMode>[0])
    }
    if (typeof prefs.gradientEnabled === 'boolean' && prefs.gradientEnabled !== gradientEnabled) {
      setGradientEnabled(prefs.gradientEnabled)
    }
    if (prefs.fontScale && prefs.fontScale !== fontScale) {
      setFontScale(prefs.fontScale as Parameters<typeof setFontScale>[0])
    }

    loadedFromDb.current = true
    // Intentionally run only on initial member load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member])

  // Debounced persist on preference change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Don't persist until we've resolved the initial DB load
    if (!member || !loadedFromDb.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const prefs: ThemePreferences = {
        theme,
        vibe,
        colorMode,
        gradientEnabled,
        fontScale,
      }

      await supabase
        .from('family_members')
        .update({ theme_preferences: prefs })
        .eq('id', member.id)
      // Fire-and-forget: errors are non-fatal; localStorage already has the value
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [member, theme, vibe, colorMode, gradientEnabled, fontScale])
}
