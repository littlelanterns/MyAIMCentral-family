/**
 * isChildMember — the ONE member-classification predicate for "is this a kid"
 * (STUDIO-EXPERIENCE ST-A, finding F-20).
 *
 * Before this helper existed, creation surfaces disagreed:
 *   - MeetingSetupWizard keyed on `relationship === 'child'` alone, so any
 *     member added by a path that skipped `relationship` (NULL) silently
 *     lost every kid step of the wizard with zero messaging.
 *   - Most other wizards/pickers keyed on role/dashboard_mode and included
 *     Special Adults or mom in kid-facing audiences (S1 leak).
 *
 * The predicate: a member is a child when
 *   - active, not out-of-nest, not the hidden `role='family'` identity, AND
 *   - `relationship === 'child'` (authoritative when set), OR
 *   - relationship is missing/unset AND the member carries the kid signature
 *     (role 'member' or a kid dashboard_mode) — the fallback that keeps
 *     members added outside FamilySetup from silently vanishing.
 *
 * Special Adults (`role === 'special_adult'` or `relationship === 'special'`)
 * are NEVER children, regardless of any other field.
 */

export interface ChildClassifiableMember {
  id: string
  role?: string | null
  relationship?: string | null
  dashboard_mode?: string | null
  is_active?: boolean
  out_of_nest?: boolean
}

const KID_DASHBOARD_MODES = new Set(['independent', 'guided', 'play'])

export function isChildMember(m: ChildClassifiableMember): boolean {
  if (m.is_active === false) return false
  if (m.out_of_nest === true) return false
  // Hard exclusions — never children no matter what else is set
  if (m.role === 'family') return false
  if (m.role === 'special_adult' || m.relationship === 'special') return false
  if (m.role === 'primary_parent' || m.role === 'additional_adult') return false
  if (m.relationship === 'spouse' || m.relationship === 'self') return false

  // Authoritative positive signal
  if (m.relationship === 'child') return true

  // Fallback for members missing `relationship` (added outside FamilySetup):
  // role 'member' or a kid-shaped dashboard mode reads as a child.
  if (m.role === 'member') return true
  if (m.dashboard_mode && KID_DASHBOARD_MODES.has(m.dashboard_mode)) return true

  return false
}

/**
 * Adult members eligible to be optionally added to a kid-default audience
 * (mom / additional adults). Special Adults are deliberately excluded —
 * kids' earning boards must never surface to caregivers by default or by
 * opt-in (STUDIO-EXPERIENCE ST-A rider (b)).
 */
export function isOptInAdult(m: ChildClassifiableMember): boolean {
  if (m.is_active === false || m.out_of_nest === true) return false
  return m.role === 'primary_parent' || m.role === 'additional_adult'
}
