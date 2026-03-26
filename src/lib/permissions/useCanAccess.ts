/**
 * PRD-02 + PRD-31: Three-layer feature access check
 * Layer 1: Tier threshold (feature_access_v2)
 * Layer 2: Member toggle (member_feature_toggles)
 * Layer 3: Founding family override (bypasses Layer 1 only)
 *
 * Returns { allowed, blockedBy, upgradeTier?, loading }
 */

export type BlockedBy = 'none' | 'tier' | 'toggle' | 'never'

export interface CanAccessResult {
  allowed: boolean
  blockedBy: BlockedBy
  upgradeTier?: string
  loading: boolean
}

export function useCanAccess(_featureKey: string, _memberId?: string): CanAccessResult {
  // BETA: All features unlocked. Convention #10 — useCanAccess returns true for everything.
  // When subscription billing goes live, restore the RPC check below.
  return { allowed: true, blockedBy: 'none', loading: false }
}
