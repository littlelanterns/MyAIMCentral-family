/**
 * PRD-40 Slice 5 — COPPA consent checks for Edge Functions.
 *
 * TWIN DISCIPLINE: the `allowed` decision here mirrors
 * `util.coppa_write_allowed(uuid)` (migration 100327) line for line —
 * change one, change the other (the same rule as the
 * childDataTables/cascade-plan twin, tests/coppa-cascade-plan-consistency).
 * The RLS gates cover CLIENT writes; service-role Edge Functions BYPASS RLS,
 * so THIS module is the only gate on those paths — PRD-40's "defense in
 * depth" with the layers inverted.
 *
 * The decision ladder (identical to the SQL predicate):
 *   1. No member id            → allowed (not a member-subject action)
 *   2. Unknown member id       → allowed (defensive)
 *   3. is_suspended_for_deletion → BLOCKED, always (Screen-9 revocation
 *      grace: "blocks all data writes") — dormancy does not apply
 *   4. bracket != under_13     → allowed
 *   5. R-8 dormancy (no lawyer-approved, non-retired consent template)
 *                              → allowed (valid consent legally cannot exist
 *      yet; the founder's own under-13 kids ride this branch today)
 *   6. else                    → allowed only with an ACTIVE coppa_consents
 *      row (revoked_at IS NULL AND superseded_at IS NULL)
 *
 * Error posture: FAIL-OPEN, LOUDLY (console.error). Same rationale as the
 * SQL predicate's exception guard — the primary protections (held-state UI,
 * consent flow, RLS gates) do not rest on this check alone, and a transient
 * DB error must never take LiLa down for every family.
 */

// deno-lint-ignore no-explicit-any
type AnySupabase = any

export type CoppaConsentStatus =
  | 'active'
  | 'revoked'
  | 'superseded'
  | 'missing'
  | 'suspended_for_deletion'
  | 'not_applicable'

export interface CoppaCheckResult {
  allowed: boolean
  status: CoppaConsentStatus
}

/** Friendly member-facing copy for a blocked AI call (PRD "gentle" rule). */
export const COPPA_AI_BLOCKED_MESSAGE =
  "I can't chat right now — this profile isn't fully set up yet. " +
  'A grown-up can finish setting things up in Settings.'

/** Friendly copy for a blocked write by another family member (PRD L548). */
export const COPPA_HELD_PROFILE_MESSAGE = "This child's profile is not yet set up"

/** R-8 dormancy: enforcement is active only once a lawyer-approved, non-retired template exists. */
export async function isCoppaEnforcementActive(supabase: AnySupabase): Promise<boolean> {
  const { data, error } = await supabase
    .from('coppa_consent_templates')
    .select('version')
    .not('lawyer_approved_at', 'is', null)
    .is('retired_at', null)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return !!data
}

/**
 * The PRD-02 retrofit status ladder (useCoppaConsent's server twin):
 * 'active' | 'revoked' | 'superseded' | 'missing' | 'suspended_for_deletion',
 * plus 'not_applicable' for 13+/adult members.
 */
export async function getCoppaConsentStatus(
  supabase: AnySupabase,
  memberId: string,
): Promise<CoppaConsentStatus> {
  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .select('coppa_age_bracket, is_suspended_for_deletion')
    .eq('id', memberId)
    .maybeSingle()
  if (memberError) throw memberError
  if (!member) return 'not_applicable'
  if (member.is_suspended_for_deletion) return 'suspended_for_deletion'
  if (member.coppa_age_bracket !== 'under_13') return 'not_applicable'

  const { data: consents, error: consentError } = await supabase
    .from('coppa_consents')
    .select('revoked_at, superseded_at, consented_at')
    .eq('child_member_id', memberId)
    .order('consented_at', { ascending: false })
  if (consentError) throw consentError
  if (!consents?.length) return 'missing'
  const active = consents.find(
    (c: { revoked_at: string | null; superseded_at: string | null }) =>
      !c.revoked_at && !c.superseded_at,
  )
  if (active) return 'active'
  return consents[0].revoked_at ? 'revoked' : 'superseded'
}

/**
 * The write/AI-call gate. `prefetchedMember` lets callers that already
 * loaded the member row skip one query (lila-chat piggybacks its existing
 * member select).
 */
export async function checkCoppaWriteAllowed(
  supabase: AnySupabase,
  memberId: string | null | undefined,
  prefetchedMember?: { coppa_age_bracket: string; is_suspended_for_deletion: boolean } | null,
): Promise<CoppaCheckResult> {
  try {
    if (!memberId) return { allowed: true, status: 'not_applicable' }

    let member = prefetchedMember
    if (!member) {
      const { data, error } = await supabase
        .from('family_members')
        .select('coppa_age_bracket, is_suspended_for_deletion')
        .eq('id', memberId)
        .maybeSingle()
      if (error) throw error
      member = data
    }
    if (!member) return { allowed: true, status: 'not_applicable' }

    if (member.is_suspended_for_deletion) {
      return { allowed: false, status: 'suspended_for_deletion' }
    }
    if (member.coppa_age_bracket !== 'under_13') {
      return { allowed: true, status: 'not_applicable' }
    }

    // R-8 dormancy — inert until a lawyer-approved template exists.
    if (!(await isCoppaEnforcementActive(supabase))) {
      return { allowed: true, status: 'missing' }
    }

    const { data: active, error } = await supabase
      .from('coppa_consents')
      .select('id')
      .eq('child_member_id', memberId)
      .is('revoked_at', null)
      .is('superseded_at', null)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (active) return { allowed: true, status: 'active' }

    const status = await getCoppaConsentStatus(supabase, memberId)
    return { allowed: false, status }
  } catch (err) {
    console.error(`[coppa-consent] check failed open for member ${memberId}:`, err)
    return { allowed: true, status: 'not_applicable' }
  }
}
