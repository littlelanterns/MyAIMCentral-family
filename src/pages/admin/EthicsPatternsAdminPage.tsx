/**
 * Admin Console — Ethics Patterns tab (PRD-41 §Admin Governance).
 *
 * Curates platform_intelligence.ethics_pattern_library through the staff-gated
 * SECURITY DEFINER RPCs (migration 100290): admin_list_ethics_patterns,
 * admin_ethics_pattern_counts, admin_approve_ethics_pattern,
 * admin_retire_ethics_pattern, admin_edit_ethics_pattern.
 *
 * Governance flow (Convention #258 three-tier shape):
 *   production_candidate (harvested by validate-ai-output, Tier-2 confirmed,
 *   NEVER from an under-13 or Safe-Harbor surface) → admin review →
 *   Approve → active | Edit & Approve → active (re-embeds) | Discard → retired.
 *
 * This is a PLATFORM governance surface (super-admin / staff only), not a
 * family-facing one — the no-side-door mom-facing ruling (LiLa Response Log)
 * does not apply here; curating a pattern library requires seeing the text.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Check, RefreshCw, X, Edit3, Save } from 'lucide-react'

type PatternStatus = 'candidate' | 'active' | 'retired'

const CATEGORIES = ['force', 'coercion', 'manipulation', 'shame_based_control', 'withholding_affection'] as const
type Category = (typeof CATEGORIES)[number]

interface PatternRow {
  id: string
  category: string
  direction: string
  pattern_text: string
  source: string
  status: string
  has_embedding: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

interface CountRow {
  status: string
  category: string
  n: number
}

const CATEGORY_LABEL: Record<Category, string> = {
  force: 'Force',
  coercion: 'Coercion',
  manipulation: 'Manipulation',
  shame_based_control: 'Shame-based control',
  withholding_affection: 'Withholding affection',
}

export function EthicsPatternsAdminPage() {
  const [candidates, setCandidates] = useState<PatternRow[]>([])
  const [active, setActive] = useState<PatternRow[]>([])
  const [counts, setCounts] = useState<CountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editCategory, setEditCategory] = useState<Category>('manipulation')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [candRes, activeRes, countRes] = await Promise.all([
        supabase.rpc('admin_list_ethics_patterns', { p_status: 'candidate' }),
        supabase.rpc('admin_list_ethics_patterns', { p_status: 'active' }),
        supabase.rpc('admin_ethics_pattern_counts'),
      ])
      if (candRes.error) throw candRes.error
      if (activeRes.error) throw activeRes.error
      if (countRes.error) throw countRes.error
      setCandidates((candRes.data ?? []) as PatternRow[])
      setActive((activeRes.data ?? []) as PatternRow[])
      setCounts((countRes.data ?? []) as CountRow[])
    } catch (err) {
      setError((err as Error).message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (fn: () => PromiseLike<{ error: unknown }>, id: string) => {
    setBusyId(id)
    try {
      const { error: rpcErr } = await fn()
      if (rpcErr) throw rpcErr
      await load()
    } catch (err) {
      setError((err as Error).message || 'Action failed')
    } finally {
      setBusyId(null)
      setEditId(null)
    }
  }

  const approve = (id: string) =>
    run(() => supabase.rpc('admin_approve_ethics_pattern', { p_id: id }), id)
  const retire = (id: string) =>
    run(() => supabase.rpc('admin_retire_ethics_pattern', { p_id: id }), id)
  const saveEdit = (id: string, approveToo: boolean) =>
    run(
      () =>
        supabase.rpc('admin_edit_ethics_pattern', {
          p_id: id,
          p_pattern_text: editText,
          p_category: editCategory,
          p_approve: approveToo,
        }),
      id,
    )

  const beginEdit = (row: PatternRow) => {
    setEditId(row.id)
    setEditText(row.pattern_text)
    setEditCategory((CATEGORIES as readonly string[]).includes(row.category) ? (row.category as Category) : 'manipulation')
  }

  const countFor = (status: PatternStatus) =>
    counts.filter(c => c.status === status).reduce((s, c) => s + Number(c.n), 0)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Ethics Patterns
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Curate the Tier-1 exemplar corpus. Approve, refine, or discard production candidates.
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

      {/* Ops strip — counts only */}
      <div className="flex gap-3 flex-wrap">
        {(['candidate', 'active', 'retired'] as PatternStatus[]).map(s => (
          <div
            key={s}
            className="rounded-lg px-4 py-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
          >
            <div className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              {countFor(s)}
            </div>
            <div className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: 'var(--color-error-bg, #fdecea)', color: 'var(--color-error, #b3261e)' }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
      ) : (
        <>
          {/* Candidate queue */}
          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Candidate queue ({candidates.length})
            </h2>
            {candidates.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                No candidates awaiting review.
              </p>
            ) : (
              <ul className="space-y-2">
                {candidates.map(row => (
                  <li
                    key={row.id}
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
                  >
                    {editId === row.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          className="w-full rounded p-2 text-sm"
                          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                        />
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as Category)}
                          className="rounded p-1.5 text-xs"
                          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(row.id, true)}
                            disabled={busyId === row.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
                          >
                            <Save size={13} /> Save & Approve
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                          >
                            {CATEGORY_LABEL[(row.category as Category)] ?? row.category} · {row.direction}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
                            {row.source}
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                          {row.pattern_text}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve(row.id)}
                            disabled={busyId === row.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
                          >
                            <Check size={13} /> Approve
                          </button>
                          <button
                            onClick={() => beginEdit(row)}
                            disabled={busyId === row.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                          >
                            <Edit3 size={13} /> Edit & Approve
                          </button>
                          <button
                            onClick={() => retire(row.id)}
                            disabled={busyId === row.id}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <X size={13} /> Discard
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Active exemplars per category */}
          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
              Active exemplars ({active.length})
            </h2>
            {CATEGORIES.map(cat => {
              const rows = active.filter(r => r.category === cat)
              if (rows.length === 0) return null
              return (
                <div key={cat} className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {CATEGORY_LABEL[cat]} ({rows.length})
                  </div>
                  <ul className="space-y-1">
                    {rows.map(row => (
                      <li
                        key={row.id}
                        className="flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
                      >
                        <span style={{ color: 'var(--color-text-primary)' }}>
                          <span className="text-xs mr-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {row.direction}
                          </span>
                          {row.pattern_text}
                          {!row.has_embedding && (
                            <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                              (embedding pending)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => retire(row.id)}
                          disabled={busyId === row.id}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded shrink-0"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <X size={12} /> Retire
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}
