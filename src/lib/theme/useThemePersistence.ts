import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
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
 * When View As is active, reads/writes the VIEWED member's row (fresh DB fetch).
 * When not in View As, reads/writes the logged-in member's row.
 *
 * PRD-03 — Theme Persistence
 */
export function useThemePersistence(): void {
  const { data: member } = useFamilyMember()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { theme, vibe, colorMode, gradientEnabled, fontScale, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale } = useTheme()

  const targetMemberId = isViewingAs ? viewingAsMember?.id : member?.id

  // Track which member we last loaded for
  const loadedForRef = useRef<string | null>(null)
  // Suppress persist while we're applying DB values
  const applyingRef = useRef(false)

  // Load from DB — fresh fetch every time target member changes
  useEffect(() => {
    if (!targetMemberId) return
    if (loadedForRef.current === targetMemberId) return

    loadedForRef.current = targetMemberId
    applyingRef.current = true

    supabase
      .from('family_members')
      .select('theme_preferences')
      .eq('id', targetMemberId)
      .single()
      .then(({ data }) => {
        const prefs = data?.theme_preferences as Partial<ThemePreferences> | null
        if (prefs) {
          if (prefs.theme) setTheme(prefs.theme as Parameters<typeof setTheme>[0])
          if (prefs.vibe) setVibe(prefs.vibe as Parameters<typeof setVibe>[0])
          if (prefs.colorMode) setColorMode(prefs.colorMode as Parameters<typeof setColorMode>[0])
          if (typeof prefs.gradientEnabled === 'boolean') setGradientEnabled(prefs.gradientEnabled)
          if (prefs.fontScale) setFontScale(prefs.fontScale as Parameters<typeof setFontScale>[0])
        }
        // Allow persist after a tick so the DB values settle
        setTimeout(() => { applyingRef.current = false }, 100)
      })
  }, [targetMemberId, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale])

  // Reset loaded state when member changes so we re-fetch
  useEffect(() => {
    return () => { loadedForRef.current = null }
  }, [targetMemberId])

  // Debounced persist — writes to the target member's row
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!targetMemberId || !loadedForRef.current || applyingRef.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const prefs: ThemePreferences = {
        theme, vibe, colorMode, gradientEnabled, fontScale,
      }
      await supabase
        .from('family_members')
        .update({ theme_preferences: prefs })
        .eq('id', targetMemberId)
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [targetMemberId, theme, vibe, colorMode, gradientEnabled, fontScale])
}
