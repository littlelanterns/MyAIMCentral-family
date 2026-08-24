/**
 * PRD-40 Slice 3 — COPPA consent-gate data hooks.
 *
 * Read-side plumbing for the FamilySetup / FamilyMembers save gates:
 *   - the active consent template (versioned disclosure text),
 *   - mom's active parent verification (webhook-written, never
 *     client-asserted — ruling R-13),
 *   - a polling helper Screen 5 uses to observe the webhook landing.
 *
 * All of this is mom-real-session territory (R-10): the RLS on these
 * tables already scopes reads to the primary parent, and the UI mounts
 * these hooks only on mom-only surfaces outside View-As scope.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export interface CoppaConsentTemplate {
  version: string
  published_at: string
  retired_at: string | null
  section_what_we_collect: string
  section_how_lila_uses: string
  section_who_sees_it: string
  section_your_rights: string
  section_parent_affirmation: string
  lawyer_approved_at: string | null
}

export interface ParentVerification {
  id: string
  parent_member_id: string
  verified_at: string
  stripe_payment_intent_id: string | null
  revoked_at: string | null
}

/**
 * The current (most recently published, non-retired) consent template.
 * `lawyer_approved_at === null` means the flow is DORMANT for non-founding
 * families (ruling R-8) — the caller decides between the consent flow and
 * the warm "almost ready" block card based on this + `is_founding_family`.
 */
export function useActiveConsentTemplate() {
  return useQuery({
    queryKey: ['coppa-consent-template'],
    queryFn: async (): Promise<CoppaConsentTemplate | null> => {
      const { data, error } = await supabase
        .from('coppa_consent_templates')
        .select('version, published_at, retired_at, section_what_we_collect, section_how_lila_uses, section_who_sees_it, section_your_rights, section_parent_affirmation, lawyer_approved_at')
        .is('retired_at', null)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as CoppaConsentTemplate | null) ?? null
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Imperative variant for save-time gate decisions. The gate must NEVER
 * branch on still-loading hook state (a slow template fetch would send a
 * founding mom to the dormant card) — save handlers call these when the
 * hook data hasn't resolved yet.
 */
export async function fetchActiveConsentTemplate(): Promise<CoppaConsentTemplate | null> {
  const { data, error } = await supabase
    .from('coppa_consent_templates')
    .select('version, published_at, retired_at, section_what_we_collect, section_how_lila_uses, section_who_sees_it, section_your_rights, section_parent_affirmation, lawyer_approved_at')
    .is('retired_at', null)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as CoppaConsentTemplate | null) ?? null
}

export async function fetchParentVerification(parentMemberId: string): Promise<ParentVerification | null> {
  const { data, error } = await supabase
    .from('parent_verifications')
    .select('id, parent_member_id, verified_at, stripe_payment_intent_id, revoked_at')
    .eq('parent_member_id', parentMemberId)
    .is('revoked_at', null)
    .maybeSingle()
  if (error) throw error
  return (data as ParentVerification | null) ?? null
}

export async function fetchIsFoundingFamily(familyId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('families')
    .select('is_founding_family')
    .eq('id', familyId)
    .single()
  if (error) throw error
  return !!data?.is_founding_family
}

/** Mom's active (non-revoked) parent verification, if any. */
export function useParentVerification() {
  const { data: member } = useFamilyMember()
  return useQuery({
    queryKey: ['coppa-parent-verification', member?.id],
    queryFn: async (): Promise<ParentVerification | null> => {
      if (!member?.id) return null
      const { data, error } = await supabase
        .from('parent_verifications')
        .select('id, parent_member_id, verified_at, stripe_payment_intent_id, revoked_at')
        .eq('parent_member_id', member.id)
        .is('revoked_at', null)
        .maybeSingle()
      if (error) throw error
      return (data as ParentVerification | null) ?? null
    },
    enabled: !!member?.id && member.role === 'primary_parent',
  })
}

/**
 * Screen 5 polling: after `stripe.confirmPayment` succeeds, the webhook
 * writes `parent_verifications` server-side. The client observes that row
 * appearing (by payment intent id) and only then calls
 * `commit_consented_members` (R-13). Returns the verification row or null.
 */
export async function pollForVerification(
  paymentIntentId: string,
  { timeoutMs = 45000, intervalMs = 2000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<ParentVerification | null> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { data, error } = await supabase
      .from('parent_verifications')
      .select('id, parent_member_id, verified_at, stripe_payment_intent_id, revoked_at')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .is('revoked_at', null)
      .maybeSingle()
    if (!error && data) return data as ParentVerification
    if (Date.now() >= deadline) return null
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

/** Payload member shape for `commit_consented_members` (mirrors the RPC). */
export interface CommitMemberInput {
  display_name: string
  role: 'additional_adult' | 'special_adult' | 'member'
  dashboard_mode: 'adult' | 'independent' | 'guided' | 'play'
  relationship: 'spouse' | 'child' | 'special'
  date_of_birth: string | null
  age: number | null
  member_color: string
  custom_role: string | null
  coppa_age_bracket: 'under_13' | '13_to_17' | 'adult'
}

export interface CommitResult {
  success: boolean
  members: Array<{ id: string; display_name: string; date_of_birth: string | null; coppa_age_bracket: string }>
  member_ids: string[]
  consent_ids: string[]
}

/**
 * The ONLY write path into coppa_consents (the table has no client INSERT
 * policy by design — migration 100305). Atomically inserts the held
 * members + their consent rows and returns the new ids so the caller can
 * resume the PIN/shadow-account pipeline.
 */
export async function commitConsentedMembers(payload: {
  verification_id: string
  consent_version: string
  acknowledged_sections: string[]
  members: CommitMemberInput[]
  existing_member_ids?: string[]
}): Promise<CommitResult> {
  const { data, error } = await supabase.rpc('commit_consented_members', {
    p_payload: payload,
  })
  if (error) throw new Error(error.message)
  return data as CommitResult
}
