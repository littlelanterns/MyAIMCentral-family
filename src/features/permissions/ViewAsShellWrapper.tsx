import type { ReactNode } from 'react'

interface ViewAsShellWrapperProps {
  children: ReactNode
}

/**
 * ViewAsShellWrapper — previously handled shell/theme swapping for View As.
 *
 * View As is now a full-screen modal overlay (PRD-02 Screen 5) rendered
 * by ViewAsModal in RoleRouter. This wrapper is now a simple passthrough
 * to avoid breaking MomShell's component tree.
 */
export function ViewAsShellWrapper({ children }: ViewAsShellWrapperProps) {
  return <>{children}</>
}
