/**
 * Admin Console — COPPA tab (PRD-40 Screen 10: Admin Verification Log).
 *
 * Compliance-audit surface: per-family verification/consent status,
 * revocations in grace, the deletion-cascade log (row COUNTS only — never
 * conversation content, the no-side-door rule), and consent-template
 * version management.
 *
 * Everything reads through the coppa_admin-gated SECURITY DEFINER RPCs
 * (migration 100330): admin_coppa_overview, admin_coppa_family_detail,
 * admin_coppa_stamp_readiness, admin_stamp_consent_template. A staff
 * member WITHOUT the coppa_admin permission_type sees an access card —
 * the server refuses, the page reports it honestly.
 *
 * THE STAMP UI IS HARD-DISABLED behind the sequencing law (R-9): recording
 * attorney approval on a template is the platform enforcement switch —
 * the moment a non-retired template carries lawyer_approved_at, every
 * unconsented under-13 member platform-wide is write-blocked
 * (util.coppa_write_allowed, migration 100327). The button stays disabled
 * while admin_coppa_stamp_readiness() reports blockers, and the RPC
 * re-checks server-side regardless (the UI check is a courtesy; the RPC
 * check is the law).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  RefreshCw, ShieldAlert, ShieldCheck, ChevronDown, ChevronRight, Lock,
  FileCheck2, AlertTriangle, Archive,
} from 'lucide-react'
import { FeatureGuide } from '@/components/shared/FeatureGuide'

interface OverviewRow {
  family_id: string
  family_name: string
  parent_member_id: string | null
  parent_name: string | null
  verified_at: string | null
  verification_method: string | null
  stripe_payment_intent_id: string | null
  verification_revoked_at: string | null
  under_13_members: number
  unconsented_under_13: number
  active_consents: number
  revoked_consents: number
  superseded_consents: number
  pending_deletions: number
  completed_deletions: number
  failed_attempts: number
  last_attempt_at: string | null
}

interface FamilyDetail {
  family: { id: string; family_name: string; is_founding_family: boolean } | null
  verifications: Array<{
    id: string; parent_name: string | null; verification_method: string
    stripe_payment_intent_id: string | null; amount_charged_cents: number
    verified_at: string; revoked_at: string | null
  }>
  consents: Array<{
    id: string; child_name: string | null; child_bracket: string | null
    consent_version: string; acknowledged_sections: string[]
    consented_at: string; revoked_at: string | null; revocation_reason: string | null
    superseded_at: string | null; scheduled_deletion_at: string | null
    deletion_completed_at: string | null; deletion_completion_notes: Record<string, unknown> | null
  }>
  attempts: Array<{
    status: string; failure_reason: string | null
    stripe_payment_intent_id: string | null; attempted_at: string
  }>
  deletion_log: Array<{
    child_name: string | null; source_table: string
    deletion_trigger: string; row_count: number; executed_at: string
  }>
  exports: Array<{
    child_name: string | null; requested_at: string
    completed_at: string | null; downloaded_at: string | null
  }>
}

interface StampReadiness {
  unconsented_under_13: number
  blockers: Array<{ family_name: string; member_name: string }>
  ready: boolean
}

interface TemplateRow {
  version: string
  published_at: string
  retired_at: string | null
  lawyer_approved_at: string | null
  lawyer_name: string | null
  notes: string | null
}

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export function CoppaAdminPage() {
  const [rows, setRows] = useState<OverviewRow[]>([])
  const [readiness, setReadiness] = useState<StampReadiness | null>(null)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notAuthorized, setNotAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters (client-side — the whole compliance log is small)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [onlyRevocations, setOnlyRevocations] = useState(false)
  const [onlyFailedAttempts, setOnlyFailedAttempts] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Detail expansion
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null)
  const [detail, setDetail] = useState<FamilyDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Stamp form
  const [stampVersion, setStampVersion] = useState<string | null>(null)
  const [lawyerName, setLawyerName] = useState('')
  const [stampBusy, setStampBusy] = useState(false)
  const [retireBusy, setRetireBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, readinessRes, templatesRes] = await Promise.all([
        supabase.rpc('admin_coppa_overview'),
        supabase.rpc('admin_coppa_stamp_readiness'),
        supabase.from('coppa_consent_templates')
          .select('version, published_at, retired_at, lawyer_approved_at, lawyer_name, notes')
          .order('published_at', { ascending: false }),
      ])
      if (overviewRes.error) {
        if (overviewRes.error.message?.includes('not authorized')) {
          setNotAuthorized(true)
          return
        }
        throw overviewRes.error
      }
      if (readinessRes.error) throw readinessRes.error
      if (templatesRes.error) throw templatesRes.error
      setNotAuthorized(false)
      setRows((overviewRes.data ?? []) as OverviewRow[])
      setReadiness(readinessRes.data as StampReadiness)
      setTemplates((templatesRes.data ?? []) as TemplateRow[])
    } catch (err) {
      setError((err as Error).message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleDetail = async (familyId: string) => {
    if (expandedFamilyId === familyId) {
      setExpandedFamilyId(null)
      setDetail(null)
      return
    }
    setExpandedFamilyId(familyId)
    setDetail(null)
    setDetailLoading(true)
    try {
      const { data, error: rpcErr } = await supabase.rpc('admin_coppa_family_detail', { p_family_id: familyId })
      if (rpcErr) throw rpcErr
      setDetail(data as FamilyDetail)
    } catch (err) {
      setError((err as Error).message || 'Failed to load family record')
    } finally {
      setDetailLoading(false)
    }
  }

  const stamp = async (version: string) => {
    setStampBusy(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('admin_stamp_consent_template', {
        p_version: version,
        p_lawyer_name: lawyerName,
      })
      if (rpcErr) throw rpcErr
      setStampVersion(null)
      setLawyerName('')
      await load()
    } catch (err) {
      setError((err as Error).message || 'Stamp failed')
    } finally {
      setStampBusy(false)
    }
  }

  const retire = async (version: string) => {
    if (!window.confirm(`Retire template version ${version}? Existing consents keep referencing it; no new consent can use it.`)) return
    setRetireBusy(version)
    setError(null)
    try {
      const { error: updErr } = await supabase
        .from('coppa_consent_templates')
        .update({ retired_at: new Date().toISOString() })
        .eq('version', version)
      if (updErr) throw updErr
      await load()
    } catch (err) {
      setError((err as Error).message || 'Retire failed')
    } finally {
      setRetireBusy(null)
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        if (!r.family_name?.toLowerCase().includes(q) && !r.parent_name?.toLowerCase().includes(q)) return false
      }
      if (methodFilter && r.verification_method !== methodFilter) return false
      if (onlyRevocations && r.revoked_consents === 0) return false
      if (onlyFailedAttempts && r.failed_attempts === 0) return false
      if (dateFrom && (!r.verified_at || r.verified_at < dateFrom)) return false
      if (dateTo && (!r.verified_at || r.verified_at > `${dateTo}T23:59:59Z`)) return false
      return true
    })
  }, [rows, search, methodFilter, onlyRevocations, onlyFailedAttempts, dateFrom, dateTo])

  if (notAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <ShieldAlert size={36} className="mx-auto" style={{ color: 'var(--color-text-secondary)' }} />
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          COPPA admin access required
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          This compliance log requires the <code>coppa_admin</code> staff permission. Your admin account
          doesn&apos;t carry it — ask the platform owner to grant it in <code>staff_permissions</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6" data-testid="coppa-admin-page">
      <FeatureGuide featureKey="coppa_admin_log" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            COPPA Verification Log
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Compliance audit: parental verifications, per-child consents, revocations, and deletion records.
            Counts and metadata only — never conversation content.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'var(--color-error-bg, #fdecea)', color: 'var(--color-error, #b3261e)' }}
          data-testid="coppa-admin-error"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
      ) : (
        <>
          {/* ── Enforcement status / sequencing-law banner ─────────────────── */}
          {readiness && (
            <div
              className="rounded-lg p-3 flex items-start gap-2 text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
              data-testid="stamp-readiness-banner"
            >
              {readiness.ready ? (
                <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success, #3d9a5c)' }} />
              ) : (
                <Lock size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
              )}
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  {readiness.ready
                    ? 'Sequencing law satisfied — template approval is unblocked.'
                    : `Template approval is BLOCKED: ${readiness.unconsented_under_13} unconsented under-13 member(s).`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Recording attorney approval on a template is the platform enforcement switch — every
                  unconsented under-13 member is write-blocked the moment it lands. The founder backfill
                  ceremony must complete first (R-9).
                </p>
                {!readiness.ready && readiness.blockers.length > 0 && (
                  <ul className="text-xs mt-1 list-disc pl-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {readiness.blockers.map((b, i) => (
                      <li key={i}>{b.member_name} — {b.family_name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Filters ─────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search family or parent…"
              className="rounded-lg px-3 py-1.5"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
              data-testid="coppa-admin-search"
            />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-lg px-2 py-1.5"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
            >
              <option value="">Any method</option>
              <option value="stripe_charge">Stripe charge</option>
              <option value="id_check">ID check</option>
              <option value="knowledge_based">Knowledge-based</option>
              <option value="subscription_payment">Subscription payment</option>
            </select>
            <label className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={onlyRevocations} onChange={(e) => setOnlyRevocations(e.target.checked)} />
              Has revocations
            </label>
            <label className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={onlyFailedAttempts} onChange={(e) => setOnlyFailedAttempts(e.target.checked)} />
              Has failed attempts
            </label>
            <label className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              Verified from
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="rounded px-1.5 py-1"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }} />
              to
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="rounded px-1.5 py-1"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }} />
            </label>
          </div>

          {/* ── Overview table ─────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Families ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                No families match the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--color-border-default)' }}>
                <table className="w-full text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                      <th className="text-left px-3 py-2 font-medium">Family</th>
                      <th className="text-left px-3 py-2 font-medium">Parent</th>
                      <th className="text-left px-3 py-2 font-medium">Verified</th>
                      <th className="text-left px-3 py-2 font-medium">Method</th>
                      <th className="text-right px-3 py-2 font-medium">Under 13</th>
                      <th className="text-right px-3 py-2 font-medium">Unconsented</th>
                      <th className="text-right px-3 py-2 font-medium">Active</th>
                      <th className="text-right px-3 py-2 font-medium">Revoked</th>
                      <th className="text-right px-3 py-2 font-medium">Superseded</th>
                      <th className="text-right px-3 py-2 font-medium">Failed attempts</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <FamilyRow
                        key={r.family_id}
                        row={r}
                        expanded={expandedFamilyId === r.family_id}
                        detail={expandedFamilyId === r.family_id ? detail : null}
                        detailLoading={expandedFamilyId === r.family_id && detailLoading}
                        onToggle={() => toggleDetail(r.family_id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Template version management ────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Consent template versions
            </h2>
            <ul className="space-y-2">
              {templates.map((t) => (
                <li
                  key={t.version}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
                  data-testid={`template-${t.version}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                      v{t.version}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      published {fmtDate(t.published_at)}
                    </span>
                    {t.retired_at ? (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        Retired {fmtDate(t.retired_at)}
                      </span>
                    ) : t.lawyer_approved_at ? (
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-success, #3d9a5c)' }}>
                        <FileCheck2 size={12} /> Attorney-approved {fmtDate(t.lawyer_approved_at)} ({t.lawyer_name})
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        <AlertTriangle size={12} /> Awaiting attorney approval — DORMANT
                      </span>
                    )}
                  </div>
                  {t.notes && (
                    <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {t.notes}
                    </p>
                  )}
                  {!t.retired_at && !t.lawyer_approved_at && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {stampVersion === t.version ? (
                        <>
                          <input
                            value={lawyerName}
                            onChange={(e) => setLawyerName(e.target.value)}
                            placeholder="Reviewing attorney's name"
                            className="rounded-lg px-3 py-1.5 text-xs"
                            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                            data-testid="lawyer-name-input"
                          />
                          <button
                            onClick={() => stamp(t.version)}
                            disabled={!readiness?.ready || stampBusy || lawyerName.trim().length === 0}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                            style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
                            data-testid="stamp-confirm-button"
                          >
                            <FileCheck2 size={13} /> Record attorney approval
                          </button>
                          <button
                            onClick={() => { setStampVersion(null); setLawyerName('') }}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setStampVersion(t.version)}
                          disabled={!readiness?.ready}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                          title={readiness?.ready
                            ? 'Record attorney approval — activates COPPA enforcement platform-wide'
                            : 'Blocked by the sequencing law — the founder backfill ceremony must complete first'}
                          data-testid={`stamp-open-${t.version}`}
                        >
                          {readiness?.ready ? <FileCheck2 size={13} /> : <Lock size={13} />}
                          Record attorney approval
                        </button>
                      )}
                      <button
                        onClick={() => retire(t.version)}
                        disabled={retireBusy === t.version}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <Archive size={13} /> Retire
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              New template versions are authored as migrations/seat operations, never typed here — the
              disclosure text is legal copy. Approval activates enforcement; there is no undo short of
              retiring the version.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function FamilyRow({
  row, expanded, detail, detailLoading, onToggle,
}: {
  row: OverviewRow
  expanded: boolean
  detail: FamilyDetail | null
  detailLoading: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr style={{ borderTop: '1px solid var(--color-border-default)' }} data-testid={`family-row-${row.family_id}`}>
        <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-text-heading)' }}>{row.family_name}</td>
        <td className="px-3 py-2">{row.parent_name ?? '—'}</td>
        <td className="px-3 py-2">
          {row.verified_at ? fmtDate(row.verified_at) : '—'}
          {row.verification_revoked_at && (
            <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>(revoked)</span>
          )}
        </td>
        <td className="px-3 py-2">{row.verification_method ?? '—'}</td>
        <td className="px-3 py-2 text-right">{row.under_13_members}</td>
        <td className="px-3 py-2 text-right" style={row.unconsented_under_13 > 0 ? { color: 'var(--color-error, #b3261e)', fontWeight: 600 } : undefined}>
          {row.unconsented_under_13}
        </td>
        <td className="px-3 py-2 text-right">{row.active_consents}</td>
        <td className="px-3 py-2 text-right">{row.revoked_consents}{row.pending_deletions > 0 && <span style={{ color: 'var(--color-text-secondary)' }}> ({row.pending_deletions} pending deletion)</span>}</td>
        <td className="px-3 py-2 text-right">{row.superseded_consents}</td>
        <td className="px-3 py-2 text-right">{row.failed_attempts}</td>
        <td className="px-3 py-2 text-right">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
            data-testid={`view-record-${row.family_id}`}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Full record
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={11} className="px-3 py-3" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            {detailLoading || !detail ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Loading full record…</p>
            ) : (
              <div className="space-y-3 text-xs" data-testid="family-detail">
                <DetailSection title={`Verifications (${detail.verifications.length})`}>
                  {detail.verifications.map((v) => (
                    <p key={v.id}>
                      {v.parent_name ?? 'Unknown parent'} · {v.verification_method} · ${(v.amount_charged_cents / 100).toFixed(2)} ·
                      {' '}{fmtDate(v.verified_at)} · {v.stripe_payment_intent_id ?? 'no intent id'}
                      {v.revoked_at && ` · REVOKED ${fmtDate(v.revoked_at)}`}
                    </p>
                  ))}
                </DetailSection>
                <DetailSection title={`Consents (${detail.consents.length})`}>
                  {detail.consents.map((c) => (
                    <p key={c.id}>
                      {c.child_name ?? 'Removed child'} ({c.child_bracket ?? '—'}) · v{c.consent_version} · consented {fmtDate(c.consented_at)}
                      {c.superseded_at && ` · superseded ${fmtDate(c.superseded_at)}`}
                      {c.revoked_at && ` · revoked ${fmtDate(c.revoked_at)}${c.revocation_reason ? ` (${c.revocation_reason})` : ''}`}
                      {c.scheduled_deletion_at && !c.deletion_completed_at && ` · deletion scheduled ${fmtDate(c.scheduled_deletion_at)}`}
                      {c.deletion_completed_at && ` · deletion completed ${fmtDate(c.deletion_completed_at)}`}
                    </p>
                  ))}
                </DetailSection>
                <DetailSection title={`Verification attempts (${detail.attempts.length})`}>
                  {detail.attempts.map((a, i) => (
                    <p key={i}>
                      {a.status} · {fmtDate(a.attempted_at)}
                      {a.failure_reason && ` · ${a.failure_reason}`}
                    </p>
                  ))}
                </DetailSection>
                <DetailSection title={`Deletion log (${detail.deletion_log.length}) — row counts only`}>
                  {detail.deletion_log.map((d, i) => (
                    <p key={i}>
                      {d.child_name ?? 'Removed child'} · {d.source_table} · {d.row_count} row(s) · {d.deletion_trigger} · {fmtDate(d.executed_at)}
                    </p>
                  ))}
                </DetailSection>
                <DetailSection title={`Data exports (${detail.exports.length})`}>
                  {detail.exports.map((e, i) => (
                    <p key={i}>
                      {e.child_name ?? 'Removed child'} · requested {fmtDate(e.requested_at)}
                      {e.completed_at && ` · completed ${fmtDate(e.completed_at)}`}
                      {e.downloaded_at && ` · downloaded ${fmtDate(e.downloaded_at)}`}
                    </p>
                  ))}
                </DetailSection>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div>
      <p className="font-semibold mb-0.5" style={{ color: 'var(--color-text-heading)' }}>{title}</p>
      {hasChildren ? (
        <div className="space-y-0.5" style={{ color: 'var(--color-text-primary)' }}>{children}</div>
      ) : (
        <p style={{ color: 'var(--color-text-secondary)' }}>None.</p>
      )}
    </div>
  )
}
