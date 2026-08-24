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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

/**
 * PRD-40 Slice 4 — Screen 8 (Settings -> Privacy & Consent). One row per
 * coppa_consents record for mom's family, joined to the child's current
 * name/avatar/bracket. Mom's real session only (R-10) — RLS on
 * coppa_consents already scopes SELECT to the primary parent; the page that
 * mounts this hook additionally checks useViewAs().isViewingAs.
 */
export interface CoppaConsentRecord {
  id: string
  child_member_id: string
  verification_id: string
  consent_version: string
  acknowledged_sections: string[]
  consented_at: string
  superseded_at: string | null
  revoked_at: string | null
  scheduled_deletion_at: string | null
  deletion_completed_at: string | null
  revocation_reason: string | null
  child_display_name: string
  child_avatar_url: string | null
  child_coppa_age_bracket: 'under_13' | '13_to_17' | 'adult'
  child_is_active: boolean
}

export function useCoppaConsentRecords() {
  const { data: member } = useFamilyMember()
  return useQuery({
    queryKey: ['coppa-consent-records', member?.family_id],
    queryFn: async (): Promise<CoppaConsentRecord[]> => {
      if (!member?.family_id) return []
      const { data, error } = await supabase
        .from('coppa_consents')
        .select(`
          id, child_member_id, verification_id, consent_version, acknowledged_sections,
          consented_at, superseded_at, revoked_at, scheduled_deletion_at, deletion_completed_at,
          revocation_reason,
          family_members!coppa_consents_child_member_id_fkey ( display_name, avatar_url, coppa_age_bracket, is_active )
        `)
        .eq('family_id', member.family_id)
        .order('consented_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => {
        const fm = Array.isArray(row.family_members) ? row.family_members[0] : row.family_members
        return {
          id: row.id,
          child_member_id: row.child_member_id,
          verification_id: row.verification_id,
          consent_version: row.consent_version,
          acknowledged_sections: row.acknowledged_sections,
          consented_at: row.consented_at,
          superseded_at: row.superseded_at,
          revoked_at: row.revoked_at,
          scheduled_deletion_at: row.scheduled_deletion_at,
          deletion_completed_at: row.deletion_completed_at,
          revocation_reason: row.revocation_reason,
          child_display_name: fm?.display_name ?? '(removed member)',
          child_avatar_url: fm?.avatar_url ?? null,
          child_coppa_age_bracket: fm?.coppa_age_bracket ?? 'adult',
          child_is_active: fm?.is_active ?? false,
        } as CoppaConsentRecord
      })
    },
    enabled: !!member?.family_id,
  })
}

export function useRevokeCoppaConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ childMemberId, reason }: { childMemberId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('revoke_coppa_consent', {
        p_child_member_id: childMemberId,
        p_reason: reason ?? null,
      })
      if (error) throw new Error(error.message)
      return data as { success: boolean; consent_id: string; scheduled_deletion_at: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coppa-consent-records'] })
    },
  })
}

export function useUndoCoppaRevocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (childMemberId: string) => {
      const { data, error } = await supabase.rpc('undo_coppa_revocation', {
        p_child_member_id: childMemberId,
      })
      if (error) throw new Error(error.message)
      return data as { success: boolean; consent_id: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coppa-consent-records'] })
    },
  })
}

export interface ExportResult {
  success: boolean
  export_id: string
  download_url: string
  expires_in_seconds: number
  tables_included: number
  photos_included: number
  warnings: string[]
}

// ── PRD-40 Slice 5 — consent-state hook + held-state helpers ────────────────

/**
 * The PRD-02 retrofit hook (PRD-40 L1045):
 * `useCoppaConsent(childMemberId)` → 'active' | 'revoked' | 'superseded' |
 * 'missing' | 'suspended_for_deletion', plus 'not_applicable' for 13+/adult
 * members and `null` while loading. Server twin:
 * supabase/functions/_shared/coppa-consent.ts `getCoppaConsentStatus()` —
 * change both together.
 *
 * Mounted on mom surfaces (RLS on coppa_consents scopes reads to the primary
 * parent; a non-mom session simply reads zero consent rows and resolves via
 * the member's bracket/suspension flags, which every family member can read).
 */
export type CoppaConsentState =
  | 'active'
  | 'revoked'
  | 'superseded'
  | 'missing'
  | 'suspended_for_deletion'
  | 'not_applicable'

export function useCoppaConsent(childMemberId: string | null | undefined) {
  return useQuery({
    queryKey: ['coppa-consent-state', childMemberId],
    queryFn: async (): Promise<CoppaConsentState> => {
      if (!childMemberId) return 'not_applicable'
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('coppa_age_bracket, is_suspended_for_deletion')
        .eq('id', childMemberId)
        .maybeSingle()
      if (memberError) throw memberError
      if (!member) return 'not_applicable'
      if (member.is_suspended_for_deletion) return 'suspended_for_deletion'
      if (member.coppa_age_bracket !== 'under_13') return 'not_applicable'

      const { data: consents, error: consentError } = await supabase
        .from('coppa_consents')
        .select('revoked_at, superseded_at, consented_at')
        .eq('child_member_id', childMemberId)
        .order('consented_at', { ascending: false })
      if (consentError) throw consentError
      if (!consents?.length) return 'missing'
      const active = consents.find((c) => !c.revoked_at && !c.superseded_at)
      if (active) return 'active'
      return consents[0].revoked_at ? 'revoked' : 'superseded'
    },
    enabled: !!childMemberId,
  })
}

/**
 * Held-state copy for a write blocked by the COPPA gates (PRD L548 — the
 * gentle message dad/Special Adults see when acting on an unconsented
 * under-13 child once enforcement is active). Per-surface wiring of this
 * message is deferred until enforcement activation (STUB_REGISTRY, Slice 5):
 * today no surface can reach a blocked state — suspended members are hidden
 * from every roster, and the unconsented-under-13 rule is dormant (R-8).
 */
export const COPPA_HELD_PROFILE_MESSAGE = "This child's profile is not yet set up"

/**
 * R-8 dormancy check: enforcement is active only once a lawyer-approved,
 * non-retired consent template exists. Templates are readable by all
 * authenticated users (audit-replay design, migration 100305).
 */
export function useCoppaEnforcementActive() {
  return useQuery({
    queryKey: ['coppa-enforcement-active'],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('coppa_consent_templates')
        .select('version')
        .not('lawyer_approved_at', 'is', null)
        .is('retired_at', null)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return !!data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * True when a consent state means writes for this member are gated.
 * `enforcementActive` (from useCoppaEnforcementActive) is REQUIRED so no
 * consumer can accidentally show held-state UI for an unconsented under-13
 * member during R-8 dormancy — suspension is the only state that blocks
 * regardless of dormancy.
 */
export function coppaWriteBlocked(
  state: CoppaConsentState | null | undefined,
  enforcementActive: boolean,
): boolean {
  if (state === 'suspended_for_deletion') return true
  if (!enforcementActive) return false
  return state === 'revoked' || state === 'missing' || state === 'superseded'
}

/** Invokes the coppa-export-child-data Edge Function directly (mom's session, R-10 in-code gate). */
export async function requestChildDataExport(childMemberId: string): Promise<ExportResult> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not signed in')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coppa-export-child-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ child_member_id: childMemberId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body?.message || body?.reason || body?.error || `Export failed (${res.status})`)
  return body as ExportResult
}
