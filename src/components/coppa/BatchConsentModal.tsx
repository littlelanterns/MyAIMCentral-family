/**
 * PRD-40 COPPA — Batch Consent Modal (founder-ordered, 2026-09-07).
 *
 * "Set up consent for several children at once" from the Family Members
 * page. This is a thin orchestration layer over machinery that already
 * exists and is already proven: `commit_consented_members` already takes a
 * `members` array and an `existing_member_ids` array and commits a whole
 * batch atomically (migration 100315); `CoppaConsentFlow` already renders
 * its five disclosure sections and the $1 verification ONCE regardless of
 * how many `childNames` are passed; `CoppaAcknowledgeModal` already knows
 * how to run sequentially over a batch via its `progress` prop (see
 * FamilySetup.tsx's `CoppaGateState` for the exact pattern this mirrors).
 *
 * This component adds the one piece that didn't exist: a multi-select
 * ENTRY POINT for EXISTING members (FamilySetup's held-pending path only
 * covers members being added for the first time). Eligible members are
 * scoped tightly on purpose — `role === 'member'` (children only;
 * `existing_member_ids` in the RPC rejects anything else) AND
 * `coppa_age_bracket === 'under_13'` (never offer a 13+ child here — the
 * RPC unconditionally sets the bracket to under_13 for every id it
 * receives, so including an older child would silently downgrade them)
 * AND no currently-active consent record (nothing to do for them). All
 * eligible members are pre-checked, since every one of them genuinely
 * needs consent set up.
 *
 * R-8/R-10 semantics are identical to every other COPPA surface: renders
 * nothing inside View-As, and the dormant-block card is the same shared
 * component non-founding families hit everywhere else.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { ShieldCheck, Loader } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import MemberPillSelector, { type MemberPillItem } from '@/components/shared/MemberPillSelector'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { CONSENT_SECTION_KEYS } from '@/lib/coppa/brackets'
import {
  useActiveConsentTemplate,
  useParentVerification,
  useCoppaConsentRecords,
  fetchActiveConsentTemplate,
  fetchParentVerification,
  fetchIsFoundingFamily,
  commitConsentedMembers,
  type CoppaConsentTemplate,
  type ParentVerification,
} from '@/lib/coppa/useCoppaGate'
import { CoppaConsentFlow } from './CoppaConsentFlow'
import { CoppaAcknowledgeModal } from './CoppaAcknowledgeModal'
import { CoppaDormantCard } from './CoppaDormantCard'

interface BatchCandidate {
  id: string
  display_name: string
  role: string
  coppa_age_bracket: 'under_13' | '13_to_17' | 'adult'
  member_color?: string | null
  assigned_color?: string | null
  calendar_color?: string | null
}

type BatchGateState =
  | { kind: 'select' }
  | { kind: 'dormant'; names: string[] }
  | { kind: 'consent_flow'; selected: BatchCandidate[]; template: CoppaConsentTemplate }
  | {
      kind: 'acknowledge'
      selected: BatchCandidate[]
      index: number
      template: CoppaConsentTemplate
      verification: ParentVerification
    }

export interface BatchConsentModalProps {
  isOpen: boolean
  onClose: () => void
  /** Non-mom family members already loaded by the caller (useFamilyMembers). */
  allMembers: BatchCandidate[]
  /** Called after a successful batch commit — the caller invalidates queries. */
  onCommitted: () => void | Promise<void>
}

function formatVerifiedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

export function BatchConsentModal({ isOpen, onClose, allMembers, onCommitted }: BatchConsentModalProps) {
  const { isViewingAs } = useViewAs()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: consentTemplate } = useActiveConsentTemplate()
  const { data: parentVerification } = useParentVerification()
  const { data: consentRecords } = useCoppaConsentRecords()

  const [gate, setGate] = useState<BatchGateState>({ kind: 'select' })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const activelyConsentedIds = useMemo(
    () =>
      new Set(
        (consentRecords ?? [])
          .filter((r) => !r.revoked_at && !r.superseded_at)
          .map((r) => r.child_member_id),
      ),
    [consentRecords],
  )

  const eligible = useMemo(
    () =>
      allMembers.filter(
        (m) => m.role === 'member' && m.coppa_age_bracket === 'under_13' && !activelyConsentedIds.has(m.id),
      ),
    [allMembers, activelyConsentedIds],
  )

  // Reset to the picker + pre-check every eligible member each time the
  // modal opens. Waits for consentRecords to resolve before pre-checking so
  // a slow query can't wrongly pre-select an already-consented child.
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false
      return
    }
    setGate({ kind: 'select' })
    setError('')
    if (initializedRef.current) return
    if (consentRecords === undefined) return
    setSelectedIds(eligible.map((m) => m.id))
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, consentRecords])

  if (isViewingAs) return null // R-10 — never inside View-As scope
  if (!isOpen) return null

  function toggleId(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.length === eligible.length ? [] : eligible.map((m) => m.id)))
  }

  async function commitBatch(
    selected: BatchCandidate[],
    template: CoppaConsentTemplate,
    verificationId: string,
    ackSections: string[],
  ) {
    await commitConsentedMembers({
      verification_id: verificationId,
      consent_version: template.version,
      acknowledged_sections: ackSections,
      members: [],
      existing_member_ids: selected.map((m) => m.id),
    })
    await onCommitted()
  }

  async function handleContinue() {
    if (!member?.family_id || selectedIds.length === 0) return
    const selected = eligible.filter((m) => selectedIds.includes(m.id))
    setChecking(true)
    setError('')
    try {
      // Resolve gate inputs imperatively — hook state may still be loading
      // (the same discipline every other COPPA gate site follows).
      const template = consentTemplate !== undefined ? consentTemplate : await fetchActiveConsentTemplate()
      const founding = family ? !!family.is_founding_family : await fetchIsFoundingFamily(member.family_id)

      if (!template || (!template.lawyer_approved_at && !founding)) {
        setGate({ kind: 'dormant', names: selected.map((m) => m.display_name) })
        return
      }

      const verification =
        parentVerification !== undefined ? parentVerification : await fetchParentVerification(member.id)

      if (verification) {
        setGate({ kind: 'acknowledge', selected, index: 0, template, verification })
      } else {
        setGate({ kind: 'consent_flow', selected, template })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setChecking(false)
    }
  }

  const pillItems: MemberPillItem[] = eligible.map((m) => ({
    id: m.id,
    display_name: m.display_name,
    calendar_color: m.calendar_color,
    assigned_color: m.assigned_color,
    member_color: m.member_color,
  }))

  return (
    <>
      {gate.kind === 'select' && (
        <ModalV2
          id="coppa-batch-consent-select"
          isOpen
          onClose={onClose}
          type="transient"
          size="md"
          title="Set Up Under-13 Consent"
          icon={ShieldCheck}
        >
          <div className="density-comfortable space-y-4" data-testid="coppa-batch-consent-select">
            {eligible.length === 0 ? (
              <>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  Every child under 13 already has active consent on file — there&rsquo;s nothing
                  to set up right now.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium"
                    style={{
                      background: 'var(--surface-primary)',
                      color: 'var(--color-text-on-primary)',
                      minHeight: 'var(--touch-target-min, 44px)',
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  Pick which kids under 13 you&rsquo;re setting up consent for. You&rsquo;ll read
                  the disclosures once, verify once, then acknowledge for each child.
                </p>
                <MemberPillSelector
                  members={pillItems}
                  selectedIds={selectedIds}
                  onToggle={toggleId}
                  showEveryone
                  onToggleAll={toggleAll}
                  showSortToggle={false}
                  variant="compact"
                />
                {error && (
                  <p className="text-sm" role="alert" style={{ color: 'var(--color-error, var(--color-text-primary))' }}>
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={checking}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                      minHeight: 'var(--touch-target-min, 44px)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="coppa-batch-consent-continue"
                    onClick={handleContinue}
                    disabled={selectedIds.length === 0 || checking}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    style={{
                      background: 'var(--surface-primary)',
                      color: 'var(--color-text-on-primary)',
                      minHeight: 'var(--touch-target-min, 44px)',
                    }}
                  >
                    {checking && <Loader size={16} className="animate-spin" />}
                    Continue ({selectedIds.length}) &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalV2>
      )}

      {gate.kind === 'dormant' && (
        <CoppaDormantCard
          isOpen
          childNames={gate.names}
          otherCount={0}
          onCancel={() => setGate({ kind: 'select' })}
          onContinueWithoutThem={() => setGate({ kind: 'select' })}
        />
      )}

      {gate.kind === 'consent_flow' && (
        <CoppaConsentFlow
          isOpen
          template={gate.template}
          childNames={gate.selected.map((m) => m.display_name)}
          onCancel={() => setGate({ kind: 'select' })}
          onVerified={async (verificationId, ackSections) => {
            await commitBatch(gate.selected, gate.template, verificationId, ackSections)
          }}
          onDone={() => {
            setGate({ kind: 'select' })
            onClose()
          }}
        />
      )}

      {gate.kind === 'acknowledge' && (
        <CoppaAcknowledgeModal
          isOpen
          childName={gate.selected[gate.index].display_name}
          verifiedAtLabel={formatVerifiedDate(gate.verification.verified_at)}
          template={gate.template}
          progress={{ current: gate.index + 1, total: gate.selected.length }}
          onCancel={() => setGate({ kind: 'select' })}
          onAcknowledge={async () => {
            if (gate.index + 1 < gate.selected.length) {
              setGate({ ...gate, index: gate.index + 1 })
              return
            }
            const { selected, template, verification } = gate
            try {
              await commitBatch(selected, template, verification.id, [...CONSENT_SECTION_KEYS])
              setGate({ kind: 'select' })
              onClose()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
              setGate({ kind: 'select' })
            }
          }}
        />
      )}
    </>
  )
}
