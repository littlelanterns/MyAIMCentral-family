import type { ReactNode } from 'react'
import { useCanAccess } from './useCanAccess'
import { usePermission } from './usePermission'
import { Lock, ArrowUpCircle } from 'lucide-react'

interface PermissionGateProps {
  featureKey: string
  targetMemberId?: string
  memberId?: string
  requireLevel?: 'view' | 'contribute' | 'manage'
  children: ReactNode
  fallback?: ReactNode
  /** Shown when blocked by subscription tier — offers upgrade info */
  tierFallback?: ReactNode
  /** Shown when blocked by mom's toggle — shows "ask mom" message */
  toggleFallback?: ReactNode
}

/**
 * PRD-02 + PRD-31: Three-layer permission gate
 * Resolution order:
 * 1. useCanAccess (tier + toggle + founding) → tierFallback or toggleFallback
 * 2. usePermission (role-based per-member) → fallback
 * 3. All pass → children
 */
export function PermissionGate({
  featureKey,
  targetMemberId,
  memberId,
  requireLevel = 'view',
  children,
  fallback = null,
  tierFallback,
  toggleFallback,
}: PermissionGateProps) {
  const access = useCanAccess(featureKey, memberId)
  const { allowed: roleAllowed, level, loading: roleLoading } = usePermission(featureKey, targetMemberId)

  if (access.loading || roleLoading) return null

  // Layer 1+2: Tier and toggle check
  if (!access.allowed) {
    if (access.blockedBy === 'tier' && tierFallback) return <>{tierFallback}</>
    if (access.blockedBy === 'toggle' && toggleFallback) return <>{toggleFallback}</>
    if (access.blockedBy === 'never') return <>{fallback}</>

    // Default tier/toggle fallbacks if specific ones not provided
    if (access.blockedBy === 'tier') {
      return <>{tierFallback ?? fallback ?? <UpgradePrompt upgradeTier={access.upgradeTier} />}</>
    }
    if (access.blockedBy === 'toggle') {
      return <>{toggleFallback ?? fallback ?? <AskMomMessage />}</>
    }

    return <>{fallback}</>
  }

  // If no target member, tier access is sufficient
  if (!targetMemberId) return <>{children}</>

  // Layer 3: Role-based permission check
  if (!roleAllowed) return <>{fallback}</>

  const levelHierarchy = ['none', 'view', 'contribute', 'manage']
  const hasRequiredLevel = levelHierarchy.indexOf(level) >= levelHierarchy.indexOf(requireLevel)

  if (!hasRequiredLevel) return <>{fallback}</>

  return <>{children}</>
}

/** Default tier-blocked fallback */
function UpgradePrompt({ upgradeTier }: { upgradeTier?: string }) {
  return (
    <div
      className="p-4 rounded-xl text-center opacity-75"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <ArrowUpCircle size={24} className="mx-auto mb-2" style={{ color: 'var(--color-golden-honey, #d6a461)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
        Available on {upgradeTier ? upgradeTier.replace('_', ' ') : 'a higher'} plan
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        Upgrade to unlock this feature
      </p>
    </div>
  )
}

/** Default toggle-blocked fallback */
function AskMomMessage() {
  return (
    <div
      className="p-4 rounded-xl text-center opacity-60"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <Lock size={20} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        This feature hasn't been enabled for you yet
      </p>
    </div>
  )
}
