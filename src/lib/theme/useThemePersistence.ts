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

interface UseThemePersistenceOptions {
  /**
   * Called when a persist write fails (RLS block, network error, or the
   * update_member_appearance RPC returning a non-'ok' status). FDWA —
   * writes here used to fail completely silently (no catch block at all).
   */
  onError?: (message: string) => void
}

/**
 * Syncs theme preferences bidirectionally with Supabase.
 *
 * Either location can set a member's theme — View As or the member's
 * own session. Whichever was most recent wins; both persist to the
 * member's DB row.
 *
 * Writes route through the update_member_appearance RPC (FDWA, 2026-07-09)
 * rather than a raw UPDATE — no self-update RLS policy on family_members has
 * ever existed, so a direct .update() silently failed for every non-mom
 * session (not just family devices). The RPC is gated owner / primary_parent
 * / family-shadow and touches ONLY theme_preferences/layout_preferences.
 *
 * PRD-03 — Theme Persistence
 */
export function useThemePersistence(options?: UseThemePersistenceOptions): void {
  const { data: member } = useFamilyMember()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { theme, vibe, colorMode, gradientEnabled, fontScale, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale } = useTheme()

  // View As targets the viewed member; normal session targets the logged-in member
  const targetMemberId = isViewingAs ? viewingAsMember?.id : member?.id

  // Track which member we last loaded for
  const loadedForRef = useRef<string | null>(null)
  // Suppress persist while we're applying DB values
  const applyingRef = useRef(false)
  // Track latest values for flush-on-unmount
  const latestRef = useRef({ theme, vibe, colorMode, gradientEnabled, fontScale })
  latestRef.current = { theme, vibe, colorMode, gradientEnabled, fontScale }
  const targetRef = useRef(targetMemberId)
  targetRef.current = targetMemberId
  // Stable ref so debounce/unmount closures always call the latest callback
  const onErrorRef = useRef(options?.onError)
  onErrorRef.current = options?.onError

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
        // If target changed while fetching, discard stale result
        if (loadedForRef.current !== targetMemberId) {
          applyingRef.current = false
          return
        }
        const prefs = data?.theme_preferences as Partial<ThemePreferences> | null
        if (prefs && Object.keys(prefs).length > 0) {
          if (prefs.theme) setTheme(prefs.theme as Parameters<typeof setTheme>[0])
          if (prefs.vibe) setVibe(prefs.vibe as Parameters<typeof setVibe>[0])
          if (prefs.colorMode) setColorMode(prefs.colorMode as Parameters<typeof setColorMode>[0])
          if (typeof prefs.gradientEnabled === 'boolean') setGradientEnabled(prefs.gradientEnabled)
          if (prefs.fontScale) setFontScale(prefs.fontScale as Parameters<typeof setFontScale>[0])
        } else {
          // No saved preferences — apply defaults so we don't inherit
          // another member's theme from localStorage on a shared device
          setTheme('classic' as Parameters<typeof setTheme>[0])
          setVibe('classic' as Parameters<typeof setVibe>[0])
          setColorMode('system' as Parameters<typeof setColorMode>[0])
          setGradientEnabled(true)
          setFontScale('default' as Parameters<typeof setFontScale>[0])
        }
        // Allow persist after a tick so the DB values settle
        setTimeout(() => { applyingRef.current = false }, 100)
      })
  }, [targetMemberId, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale])

  // Reset loaded state when target member changes so we re-fetch
  useEffect(() => {
    return () => { loadedForRef.current = null }
  }, [targetMemberId])

  // Debounced persist — writes to the target member's row
  const persistRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!targetMemberId || !loadedForRef.current || applyingRef.current) return

    if (persistRef.current) clearTimeout(persistRef.current)

    persistRef.current = setTimeout(async () => {
      persistRef.current = null
      const prefs: ThemePreferences = {
        theme, vibe, colorMode, gradientEnabled, fontScale,
      }
      await persistThemePreferences(targetMemberId, prefs, onErrorRef.current)
    }, 500)

    return () => {
      if (persistRef.current) clearTimeout(persistRef.current)
    }
  }, [targetMemberId, theme, vibe, colorMode, gradientEnabled, fontScale])

  // Flush any pending persist on unmount so changes aren't lost
  // (e.g. user changes theme then navigates before debounce fires)
  useEffect(() => {
    return () => {
      if (persistRef.current) {
        clearTimeout(persistRef.current)
        persistRef.current = null
        const id = targetRef.current
        if (id) {
          const prefs: ThemePreferences = { ...latestRef.current }
          void persistThemePreferences(id, prefs, onErrorRef.current)
        }
      }
    }
  }, [])
}

/**
 * Writes theme_preferences via update_member_appearance (FDWA, 2026-07-09) —
 * never a raw .update(), which silently no-ops for every non-mom session
 * (no self-update RLS policy on family_members has ever existed). Reports
 * failures via console.error (always) and the optional onError callback
 * (when a banner surface is available) — never swallowed.
 */
async function persistThemePreferences(
  memberId: string,
  prefs: ThemePreferences,
  onError?: (message: string) => void,
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('update_member_appearance', {
      p_member_id: memberId,
      p_theme_preferences: prefs,
      p_layout_preferences: null,
    })
    if (error) throw error
    const status = (data as { status?: string } | null)?.status
    if (status !== 'ok') {
      throw new Error(`update_member_appearance returned status "${status}"`)
    }
  } catch (err) {
    console.error('[useThemePersistence] failed to save theme preferences:', err)
    onError?.('Your theme changes might not be saved. Check your connection and try again.')
  }
}
