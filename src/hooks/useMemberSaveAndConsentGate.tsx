import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { CoppaConsentFlow } from '@/components/coppa/CoppaConsentFlow'
import { CoppaAcknowledgeModal } from '@/components/coppa/CoppaAcknowledgeModal'
import { CoppaDormantCard } from '@/components/coppa/CoppaDormantCard'
import { CONSENT_SECTION_KEYS } from '@/lib/coppa/brackets'
import {
  useActiveConsentTemplate,
  useParentVerification,
  fetchActiveConsentTemplate,
  fetchParentVerification,
  fetchIsFoundingFamily,
  commitConsentedMembers,
  type CoppaConsentTemplate,
  type ParentVerification,
} from '@/lib/coppa/useCoppaGate'

/**
 * MEMBER-SETTINGS-HUB (2026-09-07) — extracted from FamilyMembers.tsx so a
 * SECOND launch point (Settings → Family Management's roster preview) can
 * save a member's profile edits and route a bracket-change-to-under_13
 * through the EXACT SAME consent gate, without forking the gate's state
 * machine. One implementation, N callers.
 *
 * PRD-40 Slice 3 (Flows: "Member edit action (age bracket change)"):
 * changing a member's bracket TO under_13 is treated as an add-under-13
 * event and routes through the consent gate before anything is written.
 * The gate state carries the RESOLVED template/verification (fetched
 * imperatively at gate time — never from possibly-still-loading hook state).
 */
type CoppaEditGateState =
  | { kind: 'none' }
  | { kind: 'dormant'; memberName: string }
  | { kind: 'acknowledge'; memberId: string; memberName: string; pendingUpdates: Record<string, unknown>; template: CoppaConsentTemplate; verification: ParentVerification }
  | { kind: 'consent_flow'; memberId: string; memberName: string; pendingUpdates: Record<string, unknown>; template: CoppaConsentTemplate }

export interface UseMemberSaveAndConsentGateOptions {
  /** The signed-in mom's own family_members.id (used for a cold parent-verification lookup). */
  momId: string | undefined
  /** family.is_founding_family, when already loaded (avoids a redundant fetch). */
  isFoundingFamily: boolean | undefined
  /** Fires after a successful save (either path) — callers use this to reset any local "editing" toggle state. Optional; the shared query-cache invalidation always runs regardless. */
  onSaved?: () => void
}

export function useMemberSaveAndConsentGate({ momId, isFoundingFamily, onSaved }: UseMemberSaveAndConsentGateOptions) {
  const queryClient = useQueryClient()
  const { data: consentTemplate } = useActiveConsentTemplate()
  const { data: parentVerification } = useParentVerification()
  const [coppaGate, setCoppaGate] = useState<CoppaEditGateState>({ kind: 'none' })

  // PRD-40: shared tail of both consented-edit paths — the RPC writes the
  // bracket + consent row atomically; the rest of mom's edits apply after.
  async function applyConsentedEdit(
    memberId: string,
    pendingUpdates: Record<string, unknown>,
    template: CoppaConsentTemplate,
    verificationId: string,
    ackSections: string[],
  ) {
    await commitConsentedMembers({
      verification_id: verificationId,
      consent_version: template.version,
      acknowledged_sections: ackSections,
      members: [],
      existing_member_ids: [memberId],
    })
    const rest = { ...pendingUpdates }
    delete rest.coppa_age_bracket
    if (Object.keys(rest).length > 0) {
      await supabase.from('family_members').update(rest).eq('id', memberId)
    }
    await queryClient.invalidateQueries({ queryKey: ['family-members'] })
    onSaved?.()
  }

  async function handleSaveMember(memberId: string, updates: Record<string, unknown>) {
    await supabase.from('family_members').update(updates).eq('id', memberId)
    await queryClient.invalidateQueries({ queryKey: ['family-members'] })
    onSaved?.()
  }

  async function handleUnder13Transition(
    targetMemberId: string,
    targetMemberName: string,
    targetFamilyId: string,
    updates: Record<string, unknown>,
  ) {
    // PRD-40: bracket changing TO under_13 = add-under-13 event.
    // Resolve gate inputs imperatively (hook state may be loading).
    try {
      const template = consentTemplate !== undefined ? consentTemplate : await fetchActiveConsentTemplate()
      const founding = isFoundingFamily !== undefined ? isFoundingFamily : await fetchIsFoundingFamily(targetFamilyId)
      if (!template || (!template.lawyer_approved_at && !founding)) {
        setCoppaGate({ kind: 'dormant', memberName: targetMemberName })
        return
      }
      const verification =
        parentVerification !== undefined ? parentVerification : (momId ? await fetchParentVerification(momId) : undefined)
      if (verification) {
        setCoppaGate({ kind: 'acknowledge', memberId: targetMemberId, memberName: targetMemberName, pendingUpdates: updates, template, verification })
      } else {
        setCoppaGate({ kind: 'consent_flow', memberId: targetMemberId, memberName: targetMemberName, pendingUpdates: updates, template })
      }
    } catch (err) {
      console.error('COPPA gate check failed:', err)
    }
  }

  const gateModals = (
    <>
      {coppaGate.kind === 'dormant' && (
        <CoppaDormantCard
          isOpen
          childNames={[coppaGate.memberName]}
          otherCount={0}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onContinueWithoutThem={() => setCoppaGate({ kind: 'none' })}
        />
      )}
      {coppaGate.kind === 'consent_flow' && (
        <CoppaConsentFlow
          isOpen
          template={coppaGate.template}
          childNames={[coppaGate.memberName]}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onVerified={async (verificationId, ackSections) => {
            await applyConsentedEdit(coppaGate.memberId, coppaGate.pendingUpdates, coppaGate.template, verificationId, ackSections)
            await queryClient.invalidateQueries({ queryKey: ['coppa-parent-verification'] })
          }}
          onDone={() => setCoppaGate({ kind: 'none' })}
        />
      )}
      {coppaGate.kind === 'acknowledge' && (
        <CoppaAcknowledgeModal
          isOpen
          childName={coppaGate.memberName}
          verifiedAtLabel={new Date(coppaGate.verification.verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          template={coppaGate.template}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onAcknowledge={async () => {
            const gate = coppaGate
            setCoppaGate({ kind: 'none' })
            try {
              await applyConsentedEdit(gate.memberId, gate.pendingUpdates, gate.template, gate.verification.id, [...CONSENT_SECTION_KEYS])
            } catch (err) {
              console.error('COPPA consented edit failed:', err)
            }
          }}
        />
      )}
    </>
  )

  return { handleSaveMember, handleUnder13Transition, gateModals }
}
