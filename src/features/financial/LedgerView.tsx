// Phase 3.5 D2 — Full earnings ledger.
// Rendered in three contexts:
//
//   mode='mom-per-kid'  — mom drilling into one kid; shows full ledger
//                         with running balance + Pay button + filters.
//   mode='mom-all-kids' — combined chronological stream; rows tagged with
//                         kid name + member color. No Pay button (mom
//                         switches to per-kid mode to pay).
//   mode='self'         — kid viewing own ledger. Read-only. Respects
//                         the primary pool's child_can_see_finances
//                         toggle. Play shell: $ amounts hidden.
//
// Visibility rules per dispatch:
//   - RLS handles row-level enforcement; this component just respects
//     the toggle for display.
//   - When child_can_see_finances=false on the kid's primary pool,
//     percentages render but $ amounts hide.
//   - Play shell forces $ amounts hidden regardless of toggle.
//   - pool_contribution rows (amount=0) render as informational lines.

import { useMemo, useState } from 'react'
import { Wallet, Filter, ChevronDown } from 'lucide-react'
import {
  useMemberLedger,
  useFamilyLedger,
  useRunningBalance,
} from '@/hooks/useFinancial'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { TRANSACTION_TYPE_LABELS } from '@/types/financial'
import type { FinancialTransaction, TransactionType } from '@/types/financial'

type LedgerMode = 'mom-per-kid' | 'mom-all-kids' | 'self'

type FilterKey = 'all' | 'earnings' | 'payments' | 'adjustments'

/** All-kids view arrangement: grouped per child (default) vs one date stream.
 *  Founder request 2026-06-09: the combined chronological stream reads as
 *  random/overwhelming — give mom the choice, remember it. */
type AllKidsArrangement = 'by_child' | 'by_date'
const ARRANGEMENT_STORAGE_KEY = 'myaim-ledger-allkids-arrangement'

function loadArrangement(): AllKidsArrangement {
  try {
    const stored = localStorage.getItem(ARRANGEMENT_STORAGE_KEY)
    if (stored === 'by_date' || stored === 'by_child') return stored
  } catch { /* ignore */ }
  return 'by_child'
}

/** Rows shown per child before "Show all" in the grouped arrangement. */
const GROUP_PREVIEW_COUNT = 5

const FILTER_TYPES: Record<Exclude<FilterKey, 'all'>, TransactionType[]> = {
  earnings: ['allowance_earned', 'opportunity_earned', 'contract_grant'],
  payments: ['payment_made', 'purchase_deduction'],
  adjustments: ['adjustment', 'loan_issued', 'loan_repayment', 'interest_accrued'],
}

const PAGE_SIZE = 50

export function LedgerView({
  mode,
  familyId,
  memberId,
  hideMoney,
  onPayClick,
  pools,
}: {
  mode: LedgerMode
  familyId: string
  memberId?: string // required for mom-per-kid + self
  hideMoney?: boolean
  onPayClick?: () => void
  /** Optional pool list for the "By Pool" filter dropdown. */
  pools?: { pool_name: string }[]
}) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [poolFilter, setPoolFilter] = useState<string>('all')
  const [showCount, setShowCount] = useState(PAGE_SIZE)
  const [arrangement, setArrangement] = useState<AllKidsArrangement>(loadArrangement)

  function pickArrangement(next: AllKidsArrangement) {
    setArrangement(next)
    try { localStorage.setItem(ARRANGEMENT_STORAGE_KEY, next) } catch { /* ignore */ }
  }

  // Roster — needed up here for the by-child grouping (and reused by rows).
  const { data: rosterMembers = [] } = useFamilyMembers(
    mode === 'mom-all-kids' ? familyId : undefined,
  )

  const { data: balance = 0 } = useRunningBalance(
    mode === 'mom-all-kids' ? undefined : memberId,
  )

  const memberLedger = useMemberLedger(
    mode === 'mom-all-kids' ? undefined : memberId,
    poolFilter !== 'all' ? { poolName: poolFilter } : undefined,
  )
  const familyLedger = useFamilyLedger(
    mode === 'mom-all-kids' ? familyId : undefined,
    poolFilter !== 'all' ? { poolName: poolFilter } : undefined,
  )

  const rawTransactions = mode === 'mom-all-kids'
    ? (familyLedger.data ?? [])
    : (memberLedger.data ?? [])
  const isLoading = mode === 'mom-all-kids' ? familyLedger.isLoading : memberLedger.isLoading

  // For per-kid views, useMemberLedger returns ascending by created_at —
  // walk it forward to compute running balance, then reverse for display.
  // For family ledger, the rows are descending; running balance is per-kid
  // and would require a separate per-kid ascending walk. Keep it simple:
  // family ledger doesn't show running balance.
  const enriched = useMemo(() => {
    if (mode === 'mom-all-kids') {
      return rawTransactions.map(tx => ({ tx, runningAfter: null as number | null }))
    }
    // ascending walk
    let running = 0
    const ascending: { tx: FinancialTransaction; runningAfter: number }[] = []
    for (const tx of rawTransactions) {
      // pool_contribution rows have amount=0 and don't move the balance.
      if (tx.transaction_type !== 'pool_contribution') {
        running += Number(tx.amount)
      }
      ascending.push({ tx, runningAfter: running })
    }
    return ascending.reverse() // newest first
  }, [rawTransactions, mode])

  // Filter
  const filtered = useMemo(() => {
    if (filter === 'all') return enriched
    const allowedTypes = FILTER_TYPES[filter]
    return enriched.filter(({ tx }) => {
      // Always keep pool_contribution rows visible (informational) unless
      // mom is filtering by a specific category — then hide them.
      if (tx.transaction_type === 'pool_contribution') return false
      return allowedTypes.includes(tx.transaction_type)
    })
  }, [enriched, filter])

  const visible = filtered.slice(0, showCount)
  const hasMore = filtered.length > showCount

  // By-child grouping (mom-all-kids only): one section per kid in roster
  // order, newest transactions first inside each section.
  const groupedByChild = useMemo(() => {
    if (mode !== 'mom-all-kids' || arrangement !== 'by_child') return []
    const byMember = new Map<string, FinancialTransaction[]>()
    for (const { tx } of filtered) {
      const list = byMember.get(tx.family_member_id) ?? []
      list.push(tx)
      byMember.set(tx.family_member_id, list)
    }
    const rosterOrder = rosterMembers.filter(m => byMember.has(m.id))
    const knownIds = new Set(rosterOrder.map(m => m.id))
    const orphanIds = [...byMember.keys()].filter(id => !knownIds.has(id))
    return [
      ...rosterOrder.map(m => ({ member: m, transactions: byMember.get(m.id)! })),
      ...orphanIds.map(id => ({ member: undefined, transactions: byMember.get(id)! })),
    ]
  }, [mode, arrangement, filtered, rosterMembers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header: balance + Pay button */}
      {mode !== 'mom-all-kids' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default, var(--color-border))',
          }}
        >
          <Wallet size={18} style={{ color: 'var(--color-accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-heading)' }}>
              Current balance
            </div>
            {!hideMoney && (
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                ${Number(balance).toFixed(2)}
              </div>
            )}
            {hideMoney && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Dollar amounts are hidden in this view.
              </div>
            )}
          </div>
          {mode === 'mom-per-kid' && onPayClick && Number(balance) > 0 && (
            <button
              onClick={onPayClick}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: 'none',
                background: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Pay
            </button>
          )}
        </div>
      )}

      {/* Arrangement toggle — all-kids view only */}
      {mode === 'mom-all-kids' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Arrange:
          </span>
          {([['by_child', 'By child'], ['by_date', 'By date']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => pickArrangement(key)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: arrangement === key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-border-default, var(--color-border))',
                background: arrangement === key
                  ? 'var(--color-btn-primary-bg)'
                  : 'transparent',
                color: arrangement === key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
        {(['all', 'earnings', 'payments', 'adjustments'] as FilterKey[]).map(key => (
          <button
            key={key}
            onClick={() => { setFilter(key); setShowCount(PAGE_SIZE) }}
            style={{
              padding: '0.25rem 0.625rem',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: filter === key
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-border-default, var(--color-border))',
              background: filter === key
                ? 'var(--color-btn-primary-bg)'
                : 'transparent',
              color: filter === key
                ? 'var(--color-btn-primary-text)'
                : 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {key}
          </button>
        ))}

        {pools && pools.length > 1 && (
          <select
            value={poolFilter}
            onChange={e => { setPoolFilter(e.target.value); setShowCount(PAGE_SIZE) }}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border-default, var(--color-border))',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <option value="all">All pools</option>
            {pools.map(p => (
              <option key={p.pool_name} value={p.pool_name}>
                {p.pool_name === 'default' ? 'Main' : p.pool_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Ledger rows */}
      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            border: '1px dashed var(--color-border-default, var(--color-border))',
            borderRadius: 'var(--vibe-radius-input, 8px)',
          }}
        >
          {filter === 'all' ? 'No transactions yet.' : `No ${filter} in this period.`}
        </div>
      ) : mode === 'mom-all-kids' && arrangement === 'by_child' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedByChild.map(({ member, transactions }) => (
            <ChildLedgerSection
              key={member?.id ?? transactions[0].family_member_id}
              member={member}
              transactions={transactions}
              hideMoney={hideMoney}
              familyId={familyId}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {visible.map(({ tx, runningAfter }) => (
            <LedgerRow
              key={tx.id}
              tx={tx}
              runningAfter={runningAfter}
              hideMoney={hideMoney}
              showMember={mode === 'mom-all-kids'}
              familyId={familyId}
            />
          ))}
        </div>
      )}

      {(mode !== 'mom-all-kids' || arrangement === 'by_date') && hasMore && (
        <button
          onClick={() => setShowCount(c => c + PAGE_SIZE)}
          style={{
            padding: '0.5rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            border: '1px solid var(--color-border-default, var(--color-border))',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
          }}
        >
          <ChevronDown size={14} />
          Load more ({filtered.length - showCount} remaining)
        </button>
      )}
    </div>
  )
}

/** One child's section in the by-child arrangement: colored header with the
 *  kid's name + current balance, newest transactions first, previewing the
 *  most recent few with a per-child "Show all" expander. */
function ChildLedgerSection({
  member,
  transactions,
  hideMoney,
  familyId,
}: {
  member: { id: string; display_name: string } | undefined
  transactions: FinancialTransaction[]
  hideMoney?: boolean
  familyId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const color = member ? getMemberColor(member as Parameters<typeof getMemberColor>[0]) : 'var(--color-text-secondary)'

  // Current balance = balance_after on the newest balance-moving row
  // (append-only ledger invariant, Convention #223).
  const latestMoving = transactions.find(tx => tx.transaction_type !== 'pool_contribution')
  const balance = latestMoving ? Number(latestMoving.balance_after) : null

  const shown = expanded ? transactions : transactions.slice(0, GROUP_PREVIEW_COUNT)
  const hiddenCount = transactions.length - GROUP_PREVIEW_COUNT

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingBottom: '0.375rem',
          marginBottom: '0.375rem',
          borderBottom: `2px solid ${color}`,
        }}
      >
        <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '999px', background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: 'var(--font-size-sm)' }}>
          {member?.display_name ?? 'Unknown'}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          ({transactions.length} transaction{transactions.length === 1 ? '' : 's'})
        </span>
        {!hideMoney && balance !== null && (
          <span
            style={{
              marginLeft: 'auto',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-heading)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            ${balance.toFixed(2)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {shown.map(tx => (
          <LedgerRow
            key={tx.id}
            tx={tx}
            runningAfter={null}
            hideMoney={hideMoney}
            showMember={false}
            familyId={familyId}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: '0.25rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            border: '1px solid var(--color-border-default, var(--color-border))',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-xs)',
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Show less' : `Show all ${transactions.length}`}
        </button>
      )}
    </div>
  )
}

function LedgerRow({
  tx,
  runningAfter,
  hideMoney,
  showMember,
  familyId,
}: {
  tx: FinancialTransaction
  runningAfter: number | null
  hideMoney?: boolean
  showMember: boolean
  familyId: string
}) {
  const isPoolContribution = tx.transaction_type === 'pool_contribution'
  const amount = Number(tx.amount)
  const isPositive = amount > 0
  const isZero = amount === 0
  const dateStr = new Date(tx.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Member tag (mom-all-kids mode only).
  const { data: members = [] } = useFamilyMembers(showMember ? familyId : undefined)
  const member = showMember ? members.find(m => m.id === tx.family_member_id) : undefined
  const memberColor = member ? getMemberColor(member) : null

  // Pool contribution rows: lighter, no amount column.
  if (isPoolContribution) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.375rem 0.625rem',
          borderRadius: 'var(--vibe-radius-input, 6px)',
          background: 'transparent',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
          opacity: 0.8,
        }}
      >
        {showMember && member && (
          <span
            style={{
              padding: '0.0625rem 0.375rem',
              borderRadius: '999px',
              background: memberColor ?? 'var(--color-bg-tertiary)',
              color: 'var(--color-text-on-primary, white)',
              fontSize: 'var(--font-size-xs)',
              fontStyle: 'normal',
            }}
          >
            {member.display_name}
          </span>
        )}
        <span style={{ flex: 1 }}>{tx.description}</span>
        {tx.pool_name && (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {tx.pool_name === 'default' ? 'main pool' : `${tx.pool_name} pool`}
          </span>
        )}
        <span>{dateStr}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.625rem',
        borderRadius: 'var(--vibe-radius-input, 6px)',
        background: 'var(--color-bg-tertiary)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      {showMember && member && (
        <span
          style={{
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
            background: memberColor ?? 'var(--color-bg-secondary)',
            color: 'var(--color-text-on-primary, white)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {member.display_name}
        </span>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tx.description}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          <span>{TRANSACTION_TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type}</span>
          {tx.pool_name && tx.pool_name !== 'default' && (
            <span>· {tx.pool_name}</span>
          )}
          <span>· {dateStr}</span>
        </div>
      </div>

      {!hideMoney && (
        <>
          <span
            style={{
              minWidth: '4.5rem',
              textAlign: 'right',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: isZero
                ? 'var(--color-text-muted)'
                : isPositive
                  ? 'var(--color-success, var(--color-text-primary))'
                  : 'var(--color-error, var(--color-text-primary))',
            }}
          >
            {isPositive ? '+' : ''}${amount.toFixed(2)}
          </span>
          {runningAfter !== null && (
            <span
              style={{
                minWidth: '4.5rem',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              ${runningAfter.toFixed(2)}
            </span>
          )}
        </>
      )}
    </div>
  )
}
