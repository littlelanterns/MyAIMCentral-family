/**
 * Admin Console — Personas tab (SCOPE-8b.F3, Wave 1B).
 *
 * Consumes platform_intelligence.persona_promotion_queue via the
 * list_persona_promotion_queue RPC (admin-gated, SECURITY DEFINER).
 *
 * Actions on each pending row:
 *   Approve               → approve_queued_persona RPC (unchanged profile)
 *   Refine & Approve      → approve_queued_persona RPC (refined profile + sources)
 *   Reject                → reject_queued_persona RPC (+ admin_notes)
 *   Defer                 → defer_queued_persona RPC (drops from default view)
 *
 * Per PRD-32 Personas Cross-PRD Impact Addendum + PRD-34 Persona
 * Architecture Addendum §6.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Check, RefreshCw, X, Clock, Edit3, ChevronDown, ChevronRight } from 'lucide-react'

type QueueStatus = 'pending' | 'deferred' | 'approved' | 'refined_and_approved' | 'rejected'

interface QueueRow {
  id: string
  requested_persona_name: string
  submitted_by_family_name: string | null
  submitted_by_member_name: string | null
  promoted_from_personal_id: string | null
  proposed_personality_profile: Record<string, unknown>
  source_references: string[]
  category: string | null
  icon_emoji: string | null
  classifier_confidence: number
  classifier_signals: Record<string, unknown>
  classifier_reasoning: string
  status: QueueStatus
  reviewer_id: string | null
  decided_at: string | null
  admin_notes: string | null
  approved_persona_id: string | null
  created_at: string
}

interface PersonalityProfile {
  traits?: string[]
  philosophies?: string[]
  communication_style?: string
  reasoning_patterns?: string
  characteristic_language?: string[]
  known_for?: string
}

async function callAdminAction(
  action: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return { ok: false, error: 'Not authenticated' }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // Admin actions pass through lila-board-of-directors Edge Function which
  // proxies to the appropriate RPC (admin staff_permissions gate enforced
  // inside the RPC itself). conversation_id is a dummy value — the admin
  // RPCs do not touch lila_conversations.
  const res = await fetch(`${supabaseUrl}/functions/v1/lila-board-of-directors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      conversation_id: '00000000-0000-0000-0000-000000000000',
      action,
      ...payload,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    return { ok: false, error: text || `HTTP ${res.status}` }
  }
  const json = await res.json()
  if (json.error) return { ok: false, error: json.error }
  return { ok: true, data: json }
}

export function PersonasAdminPage() {
  const [filter, setFilter] = useState<QueueStatus>('pending')
  const [hideStale, setHideStale] = useState(true)
  const [rows, setRows] = useState<QueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    const result = await callAdminAction('list_persona_promotion_queue', {
      status: filter,
      hide_stale: filter === 'pending' ? hideStale : false,
    })
    if (!result.ok) {
      setErrorMsg(result.error || 'Failed to load queue')
      setRows([])
    } else {
      const data = result.data as { rows?: QueueRow[] }
      setRows(data.rows || [])
    }
    setLoading(false)
  }, [filter, hideStale])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Persona Review Queue</h2>
        <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Pending personas submitted by families. Approve to add them to the shared library; refine before approval to edit the profile; reject or defer as needed.
        </p>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(['pending', 'deferred', 'approved', 'refined_and_approved', 'rejected'] as QueueStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${filter === s ? 'btn-primary' : ''}`}
            style={{
              color: filter === s ? 'var(--color-btn-primary-text)' : 'var(--theme-text-primary)',
              border: filter === s ? '1px solid transparent' : '1px solid var(--theme-border)',
              backgroundColor: filter === s ? undefined : 'var(--theme-surface)',
            }}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
        {filter === 'pending' && (
          <label className="ml-auto flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--theme-text-muted)' }}>
            <input type="checkbox" checked={hideStale} onChange={e => setHideStale(e.target.checked)} />
            Hide stale (&gt; 30 days)
          </label>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
          {errorMsg}
        </div>
      )}

      {loading && (
        <div className="text-sm italic" style={{ color: 'var(--theme-text-muted)' }}>Loading queue…</div>
      )}

      {!loading && rows.length === 0 && !errorMsg && (
        <div className="rounded-lg p-6 text-sm italic text-center" style={{ backgroundColor: 'var(--theme-surface)', border: '1px dashed var(--theme-border)', color: 'var(--theme-text-muted)' }}>
          No personas in this state.
        </div>
      )}

      {/* Queue rows */}
      <div className="space-y-2">
        {rows.map(row => (
          <QueueRowCard
            key={row.id}
            row={row}
            expanded={expandedId === row.id}
            onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
            busy={busyId === row.id}
            onBusyChange={(b) => setBusyId(b ? row.id : null)}
            onChanged={loadQueue}
          />
        ))}
      </div>
    </div>
  )
}

function QueueRowCard({
  row, expanded, onToggle, busy, onBusyChange, onChanged,
}: {
  row: QueueRow
  expanded: boolean
  onToggle: () => void
  busy: boolean
  onBusyChange: (b: boolean) => void
  onChanged: () => void
}) {
  const [refineMode, setRefineMode] = useState(false)
  const [refinedProfile, setRefinedProfile] = useState<PersonalityProfile>(row.proposed_personality_profile as PersonalityProfile)
  const [refinedSources, setRefinedSources] = useState<string[]>(row.source_references || [])
  const [adminNotes, setAdminNotes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const handleApprove = useCallback(async (wasRefined: boolean) => {
    onBusyChange(true)
    setActionError(null)
    const result = await callAdminAction('approve_queued_persona', {
      queue_id: row.id,
      refined_profile: wasRefined ? refinedProfile : undefined,
      refined_sources: wasRefined ? refinedSources : undefined,
      admin_notes: adminNotes || undefined,
    })
    onBusyChange(false)
    if (!result.ok) setActionError(result.error || 'Approve failed')
    else onChanged()
  }, [row.id, refinedProfile, refinedSources, adminNotes, onBusyChange, onChanged])

  const handleReject = useCallback(async () => {
    if (!adminNotes.trim()) {
      setActionError('Please add notes before rejecting.')
      return
    }
    onBusyChange(true)
    setActionError(null)
    const result = await callAdminAction('reject_queued_persona', {
      queue_id: row.id,
      admin_notes: adminNotes,
    })
    onBusyChange(false)
    if (!result.ok) setActionError(result.error || 'Reject failed')
    else onChanged()
  }, [row.id, adminNotes, onBusyChange, onChanged])

  const handleDefer = useCallback(async () => {
    onBusyChange(true)
    setActionError(null)
    const result = await callAdminAction('defer_queued_persona', { queue_id: row.id })
    onBusyChange(false)
    if (!result.ok) setActionError(result.error || 'Defer failed')
    else onChanged()
  }, [row.id, onBusyChange, onChanged])

  const isPending = row.status === 'pending'
  const ageDays = Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24))
  const profile = row.proposed_personality_profile as PersonalityProfile

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90"
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.requested_persona_name}</span>
            {row.category && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-background)', color: 'var(--theme-text-muted)' }}>
                {row.category}
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {row.submitted_by_family_name || '—'} · {row.submitted_by_member_name || '—'} · {ageDays}d ago · confidence {row.classifier_confidence.toFixed(2)}
          </div>
          {row.classifier_reasoning && (
            <div className="text-xs italic mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>
              {row.classifier_reasoning}
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          {/* Profile detail */}
          <div className="pt-3 space-y-2 text-sm">
            <AdminReviewField label="Known for" value={refineMode ? refinedProfile.known_for || '' : profile.known_for || ''} editing={refineMode} onChange={v => setRefinedProfile(p => ({ ...p, known_for: v }))} />
            <AdminReviewField label="Communication style" value={refineMode ? refinedProfile.communication_style || '' : profile.communication_style || ''} editing={refineMode} multiline onChange={v => setRefinedProfile(p => ({ ...p, communication_style: v }))} />
            <AdminReviewField label="Reasoning patterns" value={refineMode ? refinedProfile.reasoning_patterns || '' : profile.reasoning_patterns || ''} editing={refineMode} multiline onChange={v => setRefinedProfile(p => ({ ...p, reasoning_patterns: v }))} />
            <AdminReviewListField label="Traits" values={refineMode ? refinedProfile.traits || [] : profile.traits || []} editing={refineMode} onChange={v => setRefinedProfile(p => ({ ...p, traits: v }))} />
            <AdminReviewListField label="Philosophies" values={refineMode ? refinedProfile.philosophies || [] : profile.philosophies || []} editing={refineMode} onChange={v => setRefinedProfile(p => ({ ...p, philosophies: v }))} />
            <AdminReviewListField label="Characteristic language" values={refineMode ? refinedProfile.characteristic_language || [] : profile.characteristic_language || []} editing={refineMode} onChange={v => setRefinedProfile(p => ({ ...p, characteristic_language: v }))} />
            <AdminReviewListField label="Source references" values={refineMode ? refinedSources : row.source_references || []} editing={refineMode} onChange={v => setRefinedSources(v)} />
          </div>

          {/* Classifier signals */}
          <details className="text-xs">
            <summary className="cursor-pointer" style={{ color: 'var(--theme-text-muted)' }}>
              Classifier signals
            </summary>
            <pre className="mt-2 overflow-x-auto rounded p-2 text-xs" style={{ backgroundColor: 'var(--theme-background)' }}>
              {JSON.stringify(row.classifier_signals, null, 2)}
            </pre>
          </details>

          {/* Admin notes + action buttons */}
          {isPending && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Admin notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional for approve, required for reject."
                  className="w-full rounded border px-2 py-1 text-sm resize-none"
                  style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
                />
              </div>

              {actionError && (
                <div className="text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>{actionError}</div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleApprove(false)}
                  disabled={busy || refineMode}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 btn-primary"
                  style={{ color: 'var(--color-btn-primary-text)' }}
                >
                  <Check size={12} /> Approve
                </button>
                {!refineMode ? (
                  <button
                    onClick={() => setRefineMode(true)}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)' }}
                  >
                    <Edit3 size={12} /> Refine
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(true)}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)' }}
                  >
                    <Check size={12} /> Refine &amp; Approve
                  </button>
                )}
                <button
                  onClick={handleReject}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)', color: 'var(--color-error, #dc2626)' }}
                >
                  <X size={12} /> Reject
                </button>
                <button
                  onClick={handleDefer}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-background)', color: 'var(--theme-text-muted)' }}
                >
                  <Clock size={12} /> Defer
                </button>
                {refineMode && (
                  <button
                    onClick={() => {
                      setRefineMode(false)
                      setRefinedProfile(row.proposed_personality_profile as PersonalityProfile)
                      setRefinedSources(row.source_references || [])
                    }}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'transparent', color: 'var(--theme-text-muted)' }}
                  >
                    Cancel refine
                  </button>
                )}
                {busy && <RefreshCw size={12} className="animate-spin self-center" />}
              </div>
            </>
          )}

          {!isPending && (
            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Status: <span className="font-medium">{row.status.replace(/_/g, ' ')}</span>
              {row.decided_at && <> · decided {new Date(row.decided_at).toLocaleString()}</>}
              {row.admin_notes && (
                <div className="mt-1 italic">Notes: {row.admin_notes}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdminReviewField({
  label, value, editing, multiline, onChange,
}: { label: string; value: string; editing: boolean; multiline?: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      {editing ? (
        multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
            className="w-full rounded border px-2 py-1 text-sm resize-none"
            style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }} />
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
            style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }} />
        )
      ) : (
        <div className="text-sm" style={{ color: 'var(--theme-text-primary)' }}>
          {value || <span style={{ color: 'var(--theme-text-muted)' }}>—</span>}
        </div>
      )}
    </div>
  )
}

function AdminReviewListField({
  label, values, editing, onChange,
}: { label: string; values: string[]; editing: boolean; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>{label}</div>
      {editing ? (
        <textarea
          value={values.join('\n')}
          onChange={e => onChange(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
          rows={Math.max(values.length, 2)}
          placeholder="One per line"
          className="w-full rounded border px-2 py-1 text-sm resize-none"
          style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}
        />
      ) : (
        <ul className="list-disc list-inside text-sm space-y-0.5" style={{ color: 'var(--theme-text-primary)' }}>
          {values.length > 0 ? values.map((v, i) => <li key={i}>{v}</li>) : <li style={{ color: 'var(--theme-text-muted)' }}>—</li>}
        </ul>
      )}
    </div>
  )
}
