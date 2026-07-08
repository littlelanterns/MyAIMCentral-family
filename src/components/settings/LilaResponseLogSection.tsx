import { useState } from 'react'
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useEthicsLog,
  ETHICS_LOG_PAGE_SIZE,
  type EthicsRejectionCategory,
  type EthicsRejectionRow,
} from '@/hooks/useEthicsLog'

/**
 * PRD-41 — LiLa Response Log (mom-only Settings section).
 *
 * Every row is a moment LiLa gently redirected an ask or adjusted a response
 * so it stayed kind. Shows the surface, a PLAIN-LANGUAGE category, direction,
 * who it involved, and when — NEVER the conversation content (that column is
 * DB-guarded; this UI never requests or renders it — founder ruling
 * 2026-07-06, no side-door around the frozen kid-privacy carve-out).
 */

// Plain-language labels — mirror _shared/ethics-guard.ts
// ETHICS_CATEGORY_PLAIN_LABEL. The mom NEVER sees the raw enum.
const CATEGORY_LABEL: Record<EthicsRejectionCategory, string> = {
  force: 'a pressure-based ask',
  coercion: 'a threat-based ask',
  manipulation: 'a guilt-based framing',
  shame_based_control: 'a shame-based framing',
  withholding_affection: 'affection used as leverage',
  crisis_output: 'a safety-sensitive moment',
}

// Human-friendly surface names. Falls back to a title-cased slug.
const SURFACE_LABEL: Record<string, string> = {
  'lila-chat': 'a LiLa chat',
  'lila-message-respond': 'a family message reply',
  'bookshelf-discuss': 'a BookShelf discussion',
  'lila-cyrano': 'a Cyrano note',
  'lila-higgins-say': 'a Higgins coaching chat',
  'lila-higgins-navigate': 'a Higgins coaching chat',
  'lila-mediator': 'a Mediator session',
  'lila-quality-time': 'a Love Language tool',
  'lila-gifts': 'a Love Language tool',
  'lila-observe-serve': 'a Love Language tool',
  'lila-words-affirmation': 'a Love Language tool',
  'lila-gratitude': 'a Love Language tool',
  'lila-perspective-shifter': 'a Perspective Shifter session',
  'lila-decision-guide': 'a Decision Guide session',
  'lila-board-of-directors': 'a Board of Directors session',
  'lila-translator': 'a Translator request',
  'message-coach': 'a message being written',
  'mindsweep-sort': 'a MindSweep capture',
  'ai-parse': 'a bulk-add or sort',
}

function surfaceLabel(surface: string): string {
  return (
    SURFACE_LABEL[surface] ||
    'a ' + surface.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  )
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function LilaResponseLogSection() {
  const [page, setPage] = useState(0)
  const { data: member } = useFamilyMember()
  const { data: members } = useFamilyMembers(member?.family_id)
  const { data, isLoading } = useEthicsLog(page)

  const nameFor = (memberId: string | null): string | null => {
    if (!memberId) return null
    const m = members?.find(x => x.id === memberId)
    return m?.display_name ?? null
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / ETHICS_LOG_PAGE_SIZE))

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        When an ask or a reply drifted toward pressure, guilt, shame, a threat,
        or affection used as leverage, LiLa gently steered it back to kindness.
        Here's when that happened and where — never the words themselves.
      </p>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} style={{ color: 'var(--color-text-secondary)' }} />}
          title="Nothing to show yet"
          description="When LiLa gently redirects an ask or softens a response to keep it kind, it'll appear here — just what kind of moment it was and where, never the conversation itself."
        />
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((row: EthicsRejectionRow) => {
              const who = nameFor(row.member_id)
              const label = CATEGORY_LABEL[row.category]
              const where = surfaceLabel(row.surface)
              const lead =
                row.direction === 'input'
                  ? `LiLa gently redirected ${label}`
                  : `LiLa softened a response that leaned toward ${label}`
              return (
                <li
                  key={row.id}
                  className="rounded-lg p-3 text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface-2, var(--color-bg-secondary))',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  <div style={{ color: 'var(--color-text-primary)' }}>
                    {lead}
                    {who ? (
                      <>
                        {' '}in {who}'s {where.replace(/^an? /, '')}
                      </>
                    ) : (
                      <> in {where}</>
                    )}
                    .
                  </div>
                  <div
                    className="mt-1 text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {formatWhen(row.created_at)}
                  </div>
                </li>
              )
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded disabled:opacity-40"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft size={14} /> Newer
              </button>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded disabled:opacity-40"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Older <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
