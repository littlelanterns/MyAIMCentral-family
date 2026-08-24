/**
 * PRD-40 Slice 4 — Screen 8: Privacy & Consent (Settings).
 *
 * Mom's verification history + per-child consent management. R-10: mom's
 * real session only — renders a blocked notice inside View-As scope (the
 * consent/revocation/export actions are not available there, per decision
 * file R-10) and is otherwise only reachable via a mom-only Settings row
 * behind <MomOnlyRoute>.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldCheck, Clock, Download, RotateCcw, AlertTriangle, Loader, ChevronDown } from 'lucide-react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import {
  useParentVerification, useCoppaConsentRecords, useUndoCoppaRevocation,
  requestChildDataExport, type CoppaConsentRecord,
} from '@/lib/coppa/useCoppaGate'
import { BRACKET_LABELS } from '@/lib/coppa/brackets'
import { CoppaRevocationModal } from '@/components/coppa/CoppaRevocationModal'
import { ConsentReplayModal } from '@/components/coppa/ConsentReplayModal'

export function PrivacyConsentPage() {
  const navigate = useNavigate()
  const { isViewingAs } = useViewAs()
  const { data: verification } = useParentVerification()
  const { data: records = [], isLoading } = useCoppaConsentRecords()
  // Revocation modal lives at PAGE level, not nested inside ActiveRow — found
  // live during the Convention #277 eyes-on tour (2026-08-24): the moment
  // revoke_coppa_consent succeeds, the query invalidates and the record
  // moves from `activeConsented` to `revokedInGrace`. ActiveRow (and any
  // modal nested inside it) UNMOUNTS the instant that reclassification
  // happens, closing the modal via React unmount before mom ever sees the
  // "Consent Revoked... scheduled for [date]" success screen — the exact
  // reassurance the PRD's Screen 9 Step 3 exists to provide. Owning the
  // modal at the page keeps it mounted across the record's partition change.
  const [revoking, setRevoking] = useState<{ childMemberId: string; childName: string } | null>(null)

  if (isViewingAs) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-2">
        <AlertTriangle size={32} style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Privacy & Consent isn't available while viewing as another family member.
        </p>
      </div>
    )
  }

  const active = records.filter((r) => r.child_is_active && r.child_coppa_age_bracket === 'under_13' && !r.superseded_at)
  const revokedInGrace = active.filter((r) => r.revoked_at && !r.deletion_completed_at)
  const activeConsented = active.filter((r) => !r.revoked_at)
  const agedOut = records.filter((r) => r.superseded_at || r.child_coppa_age_bracket !== 'under_13')

  return (
    <div className="density-tight max-w-2xl mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hidden md:flex"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          Privacy & Consent
        </h1>
      </div>

      {/* Parental verification */}
      <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Your Parental Verification</p>
        {verification ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-success, #3d9a5c)' }} />
            <span>Verified on {new Date(verification.verified_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No verification on file yet.</p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}

      {!isLoading && revokedInGrace.length > 0 && (
        <Section title="Pending Deletion">
          {revokedInGrace.map((r) => <RevokedRow key={r.id} record={r} />)}
        </Section>
      )}

      {!isLoading && (
        <Section title="Children Under 13">
          {activeConsented.length === 0 ? (
            <p className="text-sm px-1" style={{ color: 'var(--color-text-secondary)' }}>
              No children under 13 currently have active consent on file.
            </p>
          ) : (
            activeConsented.map((r) => (
              <ActiveRow key={r.id} record={r} onRequestRevoke={() => setRevoking({ childMemberId: r.child_member_id, childName: r.child_display_name })} />
            ))
          )}
        </Section>
      )}

      {!isLoading && agedOut.length > 0 && (
        <Section title="Children Who Aged Out of COPPA (13+)">
          {agedOut.map((r) => <AgedOutRow key={r.id} record={r} />)}
        </Section>
      )}

      {revoking && (
        <CoppaRevocationModal
          isOpen={true}
          onClose={() => setRevoking(null)}
          childMemberId={revoking.childMemberId}
          childName={revoking.childName}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--color-text-tertiary)' }}>{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Avatar({ record }: { record: CoppaConsentRecord }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
    >
      {record.child_avatar_url ? (
        <img src={record.child_avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        record.child_display_name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

function ActiveRow({ record, onRequestRevoke }: { record: CoppaConsentRecord; onRequestRevoke: () => void }) {
  const [replayOpen, setReplayOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const toast = useRoutingToast()

  async function handleExport() {
    setExporting(true)
    try {
      const result = await requestChildDataExport(record.child_member_id)
      toast.show({ message: `Export ready — download link sent to your notifications (${result.tables_included} record types).` })
    } catch (err) {
      toast.show({ message: err instanceof Error ? err.message : 'Export failed. Please try again.', variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-3">
        <Avatar record={record} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>{record.child_display_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Consent given: {new Date(record.consented_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-success, #3d9a5c) 15%, transparent)', color: 'var(--color-success, #3d9a5c)' }}
          >
            Active
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setReplayOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          Review what I consented to
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', opacity: exporting ? 0.7 : 1 }}
        >
          {exporting ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
          Export {record.child_display_name}'s Data
        </button>
        <button
          onClick={onRequestRevoke}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: 'transparent', color: 'var(--color-error, #d64545)', border: '1px solid var(--color-error, #d64545)' }}
        >
          Revoke consent & delete data
        </button>
      </div>
      <ConsentReplayModal isOpen={replayOpen} onClose={() => setReplayOpen(false)} consentVersion={record.consent_version} childName={record.child_display_name} />
    </div>
  )
}

function RevokedRow({ record }: { record: CoppaConsentRecord }) {
  const undo = useUndoCoppaRevocation()
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-error, #d64545)' }}>
      <div className="flex items-center gap-3">
        <Avatar record={record} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>{record.child_display_name}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-error, #d64545)' }}>
            <Clock size={12} />
            Deletion scheduled: {record.scheduled_deletion_at ? new Date(record.scheduled_deletion_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>
      {undo.isError && (
        <p className="text-xs" style={{ color: 'var(--color-error, #d64545)' }}>
          {undo.error instanceof Error ? undo.error.message : 'Could not undo. Please try again.'}
        </p>
      )}
      <button
        onClick={() => undo.mutate(record.child_member_id)}
        disabled={undo.isPending}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', border: 'none', opacity: undo.isPending ? 0.7 : 1 }}
      >
        {undo.isPending ? <Loader size={12} className="animate-spin" /> : <RotateCcw size={12} />}
        Undo Revocation
      </button>
    </div>
  )
}

function AgedOutRow({ record }: { record: CoppaConsentRecord }) {
  const [replayOpen, setReplayOpen] = useState(false)
  return (
    <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', opacity: 0.85 }}>
      <div className="flex items-center gap-3">
        <Avatar record={record} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>{record.child_display_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Original consent: {new Date(record.consented_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            Superseded (child is now 13+)
          </span>
        </div>
      </div>
      <button
        onClick={() => setReplayOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
      >
        <ChevronDown size={12} />
        View original consent record
      </button>
      <ConsentReplayModal isOpen={replayOpen} onClose={() => setReplayOpen(false)} consentVersion={record.consent_version} childName={record.child_display_name} />
    </div>
  )
}

// Exposed for the eyes-on tour / bracket label reuse if needed later.
export { BRACKET_LABELS }
