// PRD-28 Screen 5: Per-Child Transaction History
// Full-screen ledger with filter tabs (All/Allowance/Jobs/Payments/Loans), date range

import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFinancialTransactions, useRunningBalance, useLoans } from '@/hooks/useFinancial'
import { getMemberColor } from '@/lib/memberColors'
import { TRANSACTION_TYPE_LABELS, type TransactionType } from '@/types/financial'

type FilterTab = 'all' | 'allowance' | 'jobs' | 'payments' | 'loans'

const FILTER_TAB_TYPES: Record<FilterTab, TransactionType[] | null> = {
  all: null,
  allowance: ['allowance_earned'],
  jobs: ['opportunity_earned'],
  payments: ['payment_made', 'purchase_deduction'],
  loans: ['loan_issued', 'loan_repayment', 'interest_accrued'],
}

export function TransactionHistoryPage() {
  const [searchParams] = useSearchParams()
  const initialMemberId = searchParams.get('member')
  const { data: family } = useFamily()
  const { data: membersData } = useFamilyMembers(family?.id)
  const members = membersData ?? []
  const children = members.filter(m => m.role === 'member' && m.is_active)

  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId ?? children[0]?.id ?? '')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filterTypes = FILTER_TAB_TYPES[activeFilter]
  const { data: transactions = [] } = useFinancialTransactions(
    selectedMemberId || undefined,
    filterTypes ? { type: filterTypes[0] } : undefined,
  )
  const { data: balance } = useRunningBalance(selectedMemberId || undefined)
  const { data: loans = [] } = useLoans(selectedMemberId || undefined)

  const selectedMember = children.find(m => m.id === selectedMemberId)

  // Client-side filter for multi-type filters
  const filteredTransactions = useMemo(() => {
    if (!filterTypes) return transactions
    return transactions.filter(tx => filterTypes.includes(tx.transaction_type))
  }, [transactions, filterTypes])

  const activeLoans = loans.filter(l => l.status === 'active')

  return (
    <div className="density-comfortable max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/tasks?tab=finances"
          className="p-2 rounded-lg transition-colors hidden md:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
            {selectedMember?.display_name ?? 'Financial'} History
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Balance: ${(balance ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Member picker (if multiple children) */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map(child => {
            const color = getMemberColor(child)
            const isActive = child.id === selectedMemberId
            return (
              <button
                key={child.id}
                onClick={() => setSelectedMemberId(child.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive ? color : 'transparent',
                  color: isActive ? 'white' : color,
                  border: `2px solid ${color}`,
                }}
              >
                {child.display_name}
              </button>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['all', 'allowance', 'jobs', 'payments', 'loans'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: activeFilter === tab
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-bg-secondary)',
              color: activeFilter === tab
                ? 'var(--color-btn-primary-text)'
                : 'var(--color-text-secondary)',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Active Loans section (visible when loans filter active or always if loans exist) */}
      {(activeFilter === 'loans' || activeFilter === 'all') && activeLoans.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
            Loans Outstanding
          </h3>
          {activeLoans.map(loan => (
            <div key={loan.id} className="text-sm space-y-1 mb-3 last:mb-0">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-primary)' }}>
                  ${Number(loan.original_amount).toFixed(2)} borrowed{' '}
                  {new Date(loan.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  ${Number(loan.remaining_balance).toFixed(2)} remaining
                </span>
              </div>
              {loan.interest_rate > 0 && (
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Interest: {loan.interest_rate}%/{loan.interest_period}
                  {loan.total_interest_accrued > 0 && ` ($${Number(loan.total_interest_accrued).toFixed(2)} total)`}
                </div>
              )}
              {loan.repayment_mode === 'auto_deduct' && loan.auto_deduct_amount && (
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Auto-deduct: ${Number(loan.auto_deduct_amount).toFixed(2)}/week from allowance
                </div>
              )}
              {loan.reason && (
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {loan.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-1">
        {filteredTransactions.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            No transactions found
          </p>
        ) : (
          filteredTransactions.map(tx => (
            <TransactionDetailRow key={tx.id} tx={tx} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Transaction Detail Row ──────────────────────────────────

function TransactionDetailRow({ tx }: { tx: { id: string; transaction_type: TransactionType; amount: number; description: string; note: string | null; created_at: string; metadata: Record<string, unknown> } }) {
  const isPositive = tx.amount > 0
  const date = new Date(tx.created_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const typeLabel = TRANSACTION_TYPE_LABELS[tx.transaction_type]

  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>{dateStr}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {typeLabel}
            </span>
          </div>
          <div className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>
            {tx.description}
          </div>
          {tx.note && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {tx.note}
            </div>
          )}
        </div>
        <span
          className="text-sm font-semibold shrink-0 ml-3"
          style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
        >
          {isPositive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
