/**
 * Permission check hook — returns true for all features during beta.
 * Infrastructure is in place for tier gating (Phase 38).
 */
export function useCanAccess(_featureKey: string, _memberId?: string): boolean {
  // STUB: During beta, all features are unlocked
  // Phase 38 wires this to feature_access_v2 + member_feature_toggles
  return true
}
