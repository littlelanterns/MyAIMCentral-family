import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, Info, ChevronLeft, ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useSafetyFlags, type SafetyFlagFilters, type SafetyFlagRow } from '@/hooks/useSafetyMonitoring'
import { SafetyFlagDetailModal } from '@/components/safety/SafetyFlagDetailModal'
import {
  CATEGORY_LIST,
  CATEGORY_DISPLAY_LABEL,
  surfaceLabel,
  type SafetySeverity,
} from '@/lib/safety/categoryLabels'
import { localWeekIso } from '@/utils/dates'

/**
 * PRD-30 Screen 4 — flag history. Canonical route: /safety-flags. Gated by
 * <SafetyRecipientRoute> (mom + granted dad only). Reads ?flag=<id> for
 * notification tap-through (opens Screen 3 over the history) and ?member=<id>
 * for FO deep-link ("Review →" from a member's column).
 */

const SEVERITY_ICON: Record<SafetySeverity, typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  concern: Info,
}
const SEVERITY_COLOR: Record<SafetySeverity, string> = {
  critical: 'var(--color-error, #dc2626)',
  warning: 'var(--color-warning, #d97706)',
  concern: 'var(--color-text-secondary)',
}

function bucketFor(createdAt: string): 'This Week' | 'Last Week' | 'Earlier' {
  const created = new Date(createdAt)
  const thisWeek = localWeekIso(new Date())
  const lastWeek = localWeekIso(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const flagWeek = localWeekIso(created)
  if (flagWeek === thisWeek) return 'This Week'
  if (flagWeek === lastWeek) return 'Last Week'
  return 'Earlier'
}

export function SafetyFlagsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: mom } = useFamilyMember()
  const familyId = mom?.family_id
  const { data: allMembers = [] } = useFamilyMembers(familyId)
  const monitorable = allMembers.filter((m) => m.role === 'member' || m.role === 'additional_adult')

  const [memberId, setMemberId] = useState<string>(searchParams.get('member') ?? '')
  const [category, setCategory] = useState<string>('')
  const [includeDismissed, setIncludeDismissed] = useState(false)
  const [page, setPage] = useState(0)
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(searchParams.get('flag'))

  const filters: SafetyFlagFilters = useMemo(
    () => ({
      memberId: memberId || undefined,
      category: (category || undefined) as SafetyFlagFilters['category'],
      includeDismissed,
    }),
    [memberId, category, includeDismissed],
  )

  // Filter changes reset pagination to page 0.
  useEffect(() => { setPage(0) }, [filters.memberId, filters.category, filters.includeDismissed])

  const { data, isLoading } = useSafetyFlags(familyId, filters, page)
  // Load More accumulates: each page's rows are appended (never dropped).
  // Page resets to 0 whenever the filter set changes (effect above), which
  // re-seeds accumulated from scratch on the next data arrival.
  const [accumulated, setAccumulated] = useState<SafetyFlagRow[]>([])
  useEffect(() => {
    if (!data) return
    setAccumulated((prev) => (page === 0 ? data.rows : [...prev, ...data.rows]))
  }, [data, page])
  const rows = accumulated
  const total = data?.total ?? 0

  // Once the flag param has been consumed to open the detail modal, drop it
  // from the URL so re-navigating (or closing) doesn't keep re-triggering it.
  useEffect(() => {
    if (searchParams.get('flag') && selectedFlagId) {
      const next = new URLSearchParams(searchParams)
      next.delete('flag')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nameFor = (id: string) => allMembers.find((m) => m.id === id)?.display_name ?? 'Family member'

  const grouped = useMemo(() => {
    const groups: Record<string, SafetyFlagRow[]> = { 'This Week': [], 'Last Week': [], Earlier: [] }
    for (const row of rows) groups[bucketFor(row.created_at)].push(row)
    return groups
  }, [rows])

  return (
    <div className="density-compact max-w-2xl mx-auto pb-12 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          Safety Flag History
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={memberId}
          onChange={(e) => { setMemberId(e.target.value); setPage(0) }}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          data-testid="safety-history-filter-member"
        >
          <option value="">All members</option>
          {monitorable.map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0) }}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          data-testid="safety-history-filter-category"
        >
          <option value="">All categories</option>
          {CATEGORY_LIST.map((c) => (
            <option key={c} value={c}>{CATEGORY_DISPLAY_LABEL[c]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setIncludeDismissed((v) => !v); setPage(0) }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            background: includeDismissed ? 'var(--surface-primary)' : 'var(--color-bg-card)',
            color: includeDismissed ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          data-testid="safety-history-toggle-dismissed"
        >
          {includeDismissed ? 'Showing dismissed' : 'Show dismissed'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} style={{ color: 'var(--color-text-secondary)' }} />}
          title="No flags — that's a good week"
          description="When something concerning comes up in a monitored conversation, it'll show up here with a gentle way to bring it up."
        />
      ) : (
        <div className="space-y-5">
          {(['This Week', 'Last Week', 'Earlier'] as const).map((bucket) =>
            grouped[bucket].length === 0 ? null : (
              <div key={bucket}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {bucket}
                </p>
                <div className="space-y-1.5">
                  {grouped[bucket].map((flag) => {
                    const Icon = SEVERITY_ICON[flag.severity]
                    const color = SEVERITY_COLOR[flag.severity]
                    const dismissed = flag.status === 'dismissed'
                    return (
                      <button
                        key={flag.id}
                        type="button"
                        onClick={() => setSelectedFlagId(flag.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-left"
                        style={{
                          backgroundColor: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border)',
                          opacity: dismissed ? 0.55 : 1,
                        }}
                        data-testid={`safety-flag-row-${flag.id}`}
                      >
                        <Icon size={16} style={{ color }} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {nameFor(flag.flagged_member_id)} — {CATEGORY_DISPLAY_LABEL[flag.category]}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {surfaceLabel(flag.surface)} ·{' '}
                            {new Date(flag.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {dismissed ? ' · Dismissed' : flag.status === 'acknowledged' ? ' · Acknowledged' : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ),
          )}
          {rows.length < total && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              Load More
            </button>
          )}
        </div>
      )}

      {selectedFlagId && (
        <SafetyFlagDetailModal
          isOpen
          onClose={() => setSelectedFlagId(null)}
          flagId={selectedFlagId}
          memberName={
            rows.find((r) => r.id === selectedFlagId)
              ? nameFor(rows.find((r) => r.id === selectedFlagId)!.flagged_member_id)
              : undefined
          }
        />
      )}
    </div>
  )
}
