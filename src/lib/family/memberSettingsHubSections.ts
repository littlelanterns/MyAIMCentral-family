/**
 * MEMBER-SETTINGS-HUB (2026-09-07) — pure section-applicability logic,
 * extracted out of the React component so it's directly unit-testable.
 * Governs which of the hub's 9 sections show their real editor vs a
 * one-line "not applicable" note, per `family_members.role`.
 *
 * Kept intentionally dumb: Profile, Login & Access, Permissions & Features,
 * Gamification & Rewards, and Theme & Appearance apply to every non-mom role
 * shown in the hub (mirrors the existing MemberRow behavior — those buttons
 * already render unconditionally for every member type today). Only
 * Allowance, Homework, Safety Monitoring, and Privacy & Consent branch by
 * role, matching their existing single-purpose settings surfaces elsewhere
 * in the app (ChildAllowanceConfig is kid-only, SafetyMonitoringSettingsSection
 * only monitors 'member'/'additional_adult', PrivacyConsentPage is COPPA/
 * under-13-only).
 */

export type HubMemberRole = 'primary_parent' | 'additional_adult' | 'special_adult' | 'member' | 'family'

export type SafetyApplicability = 'kid' | 'adult' | 'none'

export interface MemberSectionApplicability {
  /** True for `role === 'member'` — drives Allowance/Homework/Privacy copy & branching. */
  isKidRole: boolean
  /** Allowance & Finances — real ChildAllowanceConfigInner vs a note. */
  allowanceApplicable: boolean
  /** Privacy & Consent — real MemberPrivacyConsentCard vs a note. */
  privacyApplicable: boolean
  /** Safety Monitoring — 'kid'/'adult' render the real toggle+sensitivity UI, 'none' renders a note. */
  safety: SafetyApplicability
  /** Safety Monitoring — only additional_adult also gets the "receives alerts" recipient toggle. */
  safetyShowsRecipientToggle: boolean
}

export function getMemberSectionApplicability(role: string): MemberSectionApplicability {
  const isKid = role === 'member'
  const isAdultish = role === 'additional_adult'
  const isSpecialAdult = role === 'special_adult'

  return {
    isKidRole: isKid,
    allowanceApplicable: isKid,
    privacyApplicable: isKid,
    safety: isSpecialAdult ? 'none' : isKid ? 'kid' : isAdultish ? 'adult' : 'none',
    safetyShowsRecipientToggle: isAdultish,
  }
}
