/**
 * Tier-based feature access check.
 * Three-layer check: tier threshold + member toggle + founding override.
 *
 * During beta, returns true for everything (all tiers unlocked).
 * Phase 38 wires this to feature_access_v2 + member_feature_toggles + founding check.
 */
export function useCanAccess(_featureKey: string, _memberId?: string): boolean {
  // During beta: all features unlocked
  // Full implementation checks:
  // 1. family.is_founding_family && subscription.status === 'active' → true
  // 2. feature_access_v2 for (feature_key, role_group, minimum_tier_id)
  // 3. member_feature_toggles for specific member disable
  return true
}
