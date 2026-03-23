import type { ReactNode } from 'react'
import { useCanAccess } from './useCanAccess'

interface PermissionGateProps {
  featureKey: string
  memberId?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only if the current user has access to the feature.
 * During beta, all features are unlocked.
 */
export function PermissionGate({ featureKey, memberId, children, fallback = null }: PermissionGateProps) {
  const hasAccess = useCanAccess(featureKey, memberId)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
