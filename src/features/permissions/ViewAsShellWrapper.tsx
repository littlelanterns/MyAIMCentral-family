import { useEffect, type ReactNode } from 'react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ViewAsBanner } from './ViewAsBanner'
import { useTheme } from '@/lib/theme'
import type { ShellType } from '@/lib/theme'

/**
 * Height of the ViewAsBanner in pixels. Content is pushed down by this
 * amount via padding-top when View As mode is active, so the banner never
 * overlaps page content.
 */
const BANNER_HEIGHT = 40

interface ViewAsShellWrapperProps {
  children: ReactNode
}

/** Map member role + dashboard_mode to shell type */
function memberToShell(role: string, dashboardMode: string | null): ShellType {
  if (role === 'primary_parent') return 'mom'
  if (dashboardMode === 'independent') return 'independent'
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  return 'adult'
}

/**
 * ViewAsShellWrapper — place this inside a shell, wrapping the main content area.
 *
 * When NOT viewing as anyone: renders children unchanged (zero overhead).
 * When viewing as a family member: applies the target member's theme + shell
 * token overrides so mom sees exactly what that member sees, with a persistent
 * View As banner at top (z-45).
 */
export function ViewAsShellWrapper({ children }: ViewAsShellWrapperProps) {
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { setShell, setTheme } = useTheme()

  // When View As starts, apply the target member's theme and shell tokens.
  // When View As ends, the theme persistence hook will restore mom's theme.
  useEffect(() => {
    if (!isViewingAs || !viewingAsMember) return

    // Apply the target member's shell tokens
    const targetShell = memberToShell(viewingAsMember.role, viewingAsMember.dashboard_mode)
    setShell(targetShell)

    // Apply the target member's theme if available
    const prefs = viewingAsMember.theme_preferences as Record<string, string> | null
    if (prefs?.theme) {
      setTheme(prefs.theme as Parameters<typeof setTheme>[0])
    }

    // Cleanup: restore mom's shell tokens when View As ends
    return () => {
      setShell('mom')
    }
  }, [isViewingAs, viewingAsMember?.id])

  if (!isViewingAs) {
    return <>{children}</>
  }

  return (
    <>
      <ViewAsBanner />
      <div style={{ paddingTop: BANNER_HEIGHT }}>
        {children}
      </div>
    </>
  )
}
