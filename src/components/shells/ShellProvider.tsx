import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { useThemePersistence } from '@/lib/theme/useThemePersistence'
import { SessionWarning } from '@/components/shared/SessionWarning'
import { AppearanceErrorBanner } from '@/components/shared/AppearanceErrorBanner'
import type { ShellType } from '@/lib/theme'

interface ShellContextType {
  shell: ShellType
  role: string | null
  memberId: string | null
  memberName: string | null
}

const ShellContext = createContext<ShellContextType>({
  shell: 'mom',
  role: null,
  memberId: null,
  memberName: null,
})

export function useShell() {
  return useContext(ShellContext)
}

/**
 * FDWA (2026-07-09) — a single cross-shell surface for "a preference write
 * silently failed" (theme, sidebar layout, etc). useThemePersistence is
 * called here, above where RoutingToastProvider mounts (inside Mom/Adult
 * shells only, and not at all in Independent/Guided/Play) — so descendants
 * that write to family_members appearance columns (e.g. Sidebar's
 * useSidebarPersistence) report into THIS context instead, which every
 * shell inherits regardless of RoutingToastProvider mounting.
 */
interface AppearanceErrorContextType {
  reportError: (message: string) => void
}

const AppearanceErrorContext = createContext<AppearanceErrorContextType | null>(null)

/** Safe to call outside ShellProvider (e.g. tests) — falls back to a no-op. */
export function useAppearanceError(): AppearanceErrorContextType {
  const ctx = useContext(AppearanceErrorContext)
  if (!ctx) return { reportError: () => {} }
  return ctx
}

/**
 * Shell routing: PRD-01 Founder Ruling
 * Role = structural identity (4 values). Dashboard mode = experience shell.
 * primary_parent always gets MomShell (no dashboard_mode needed).
 * All others use dashboard_mode to determine shell.
 *
 * Exported so View-As consumers (useEffectiveShell) can derive a target
 * member's shell without duplicating the mapping. Single source of truth
 * for role × dashboard_mode → ShellType.
 */
export function getShellForMember(role: string, dashboardMode: string | null): ShellType {
  if (role === 'primary_parent') return 'mom'
  if (dashboardMode === 'independent') return 'independent'
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  // additional_adult, special_adult, or member with 'adult' dashboard_mode
  return 'adult'
}

interface ShellProviderProps {
  children: ReactNode
}

export function ShellProvider({ children }: ShellProviderProps) {
  const { data: member } = useFamilyMember()
  const { showWarning, secondsRemaining, dismissWarning } = useSessionTimeout()
  const [appearanceError, setAppearanceError] = useState<string | null>(null)

  // Sync theme preferences with Supabase (PRD-03). onError surfaces via the
  // banner below (FDWA — silent failure is the bug class this exists to kill).
  useThemePersistence({ onError: setAppearanceError })

  const reportAppearanceError = useCallback((message: string) => {
    setAppearanceError(message)
  }, [])

  const shell = member ? getShellForMember(member.role, member.dashboard_mode) : 'mom'

  return (
    <ShellContext.Provider
      value={{
        shell,
        role: member?.role ?? null,
        memberId: member?.id ?? null,
        memberName: member?.display_name ?? null,
      }}
    >
      <AppearanceErrorContext.Provider value={{ reportError: reportAppearanceError }}>
        {showWarning && (
          <SessionWarning
            secondsRemaining={secondsRemaining}
            onDismiss={dismissWarning}
          />
        )}
        {appearanceError && (
          <AppearanceErrorBanner
            message={appearanceError}
            onDismiss={() => setAppearanceError(null)}
          />
        )}
        {children}
      </AppearanceErrorContext.Provider>
    </ShellContext.Provider>
  )
}
