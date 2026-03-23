import type { ReactNode } from 'react'
import { useCanAccess } from './useCanAccess'
import { usePermission } from './usePermission'

interface PermissionGateProps {
  featureKey: string
  targetMemberId?: string
  memberId?: string
  requireLevel?: 'view' | 'contribute' | 'manage'
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only if the current user has access to the feature.
 * Checks both tier gating (useCanAccess) and role-based permissions (usePermission).
 */
export function PermissionGate({
  featureKey,
  targetMemberId,
  memberId,
  requireLevel = 'view',
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasTierAccess = useCanAccess(featureKey, memberId)
  const { allowed, level, loading } = usePermission(featureKey, targetMemberId)

  if (loading) return null

  if (!hasTierAccess) return <>{fallback}</>

  // If no target member specified, tier access is sufficient
  if (!targetMemberId) return <>{children}</>

  // Check role-based permission level
  if (!allowed) return <>{fallback}</>

  const levelHierarchy = ['none', 'view', 'contribute', 'manage']
  const hasRequiredLevel = levelHierarchy.indexOf(level) >= levelHierarchy.indexOf(requireLevel)

  if (!hasRequiredLevel) return <>{fallback}</>

  return <>{children}</>
}
