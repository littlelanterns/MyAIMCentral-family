import type { ReactNode } from 'react'
import { AuthGuard } from './AuthGuard'
import { ShellProvider } from './shells/ShellProvider'
import { RoleRouter } from './shells/RoleRouter'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Wraps a page in AuthGuard + ShellProvider + RoleRouter.
 * Use this for all authenticated routes so the shell system is active.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <AuthGuard>
      <ShellProvider>
        <RoleRouter>
          {children}
        </RoleRouter>
      </ShellProvider>
    </AuthGuard>
  )
}

/**
 * Auth-only wrapper — no shell chrome. Used for standalone layouts
 * like the Tablet Hub (/hub) that need auth but render their own layout.
 */
export function ProtectedRouteNoShell({ children }: ProtectedRouteProps) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}
