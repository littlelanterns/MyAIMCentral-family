/**
 * useEffectiveMember — returns the "data subject" for the current render.
 *
 * Inside a View-As modal scope, the data subject is the target (the kid
 * mom is viewing as). Outside the modal scope, the data subject IS the
 * auth user — so this hook falls back to `useFamilyMember()`.
 *
 * This hook does NOT replace `useFamilyMember()`. The split is deliberate:
 *
 *   - `useFamilyMember()`   = the AUTH USER. The human whose `auth.uid()`
 *                             is logged in. Owns the audit trail,
 *                             triggers RLS, attribution writes. 119
 *                             existing callers depend on this contract.
 *   - `useEffectiveMember()` = the DATA SUBJECT. The member whose data
 *                              the UI should render. Same as the auth
 *                              user when not in View-As.
 *
 * Workers 3 and 4 migrate page-level call sites one at a time. Mass
 * rewriting `useFamilyMember()` to return the effective member would
 * silently change auth-user semantics across the codebase.
 *
 * Migration-point note: when per-kid Supabase auth lands, every family
 * member will have their own `auth.uid()` and the data-subject vs
 * auth-user split will collapse for kid sessions. The call sites that
 * use this hook will be no-ops at that point — the hook's return value
 * will just match `useFamilyMember()` always. Build with that horizon
 * in mind.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { useFamilyMember, type FamilyMember } from './useFamilyMember'
import { useViewAs, type ViewAsOrigin } from '@/lib/permissions/ViewAsProvider'

export interface UseEffectiveMemberResult {
  /**
   * The data subject for the current render. Inside View-As scope this
   * is the target; outside, the auth user. `null` only when the auth
   * user is itself not yet loaded.
   */
  member: FamilyMember | null
  /** True when inside an active View-As session. */
  isViewAs: boolean
  /** Origin of the active session, or `null` when not in View-As. */
  origin: ViewAsOrigin | null
  /**
   * The real viewer's family_member_id (always mom for both flows
   * today). Use this for write-attribution patterns like `acted_by`
   * when you need to record who PRESSED THE BUTTONS, not whose data
   * was being rendered.
   */
  realViewerId: string | null
}

export function useEffectiveMember(): UseEffectiveMemberResult {
  const { data: authMember = null } = useFamilyMember()
  const { isViewingAs, viewingAsMember, origin, realViewerId } = useViewAs()

  // Fallback safety: even inside the modal scope, if the View-As target
  // hasn't booted yet for any reason, return the auth user. We never
  // want a consumer to receive `undefined` when the modal is mounting.
  const member: FamilyMember | null = isViewingAs && viewingAsMember
    ? viewingAsMember
    : authMember

  return {
    member,
    isViewAs: isViewingAs,
    origin,
    realViewerId,
  }
}
