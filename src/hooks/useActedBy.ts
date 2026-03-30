/**
 * useActedBy — returns the `acted_by` value for View As attribution.
 *
 * When mom is in View As mode, returns her family_member_id.
 * When not in View As, returns null (member acted for themselves).
 *
 * Usage: include `acted_by: actedBy` in any insert/update that
 * should track who performed the action in View As.
 */

import { useViewAs } from '@/lib/permissions/ViewAsProvider'

export function useActedBy(): string | null {
  const { isViewingAs, realViewerId } = useViewAs()
  return isViewingAs ? realViewerId : null
}
