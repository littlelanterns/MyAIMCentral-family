// PRD-28 Screen 4: Tasks Page → Finances Tab (Mom only)
// Shows: What I Owe summary, per-child WeeklyProgressCard, recent transactions

import { useState } from 'react'
import { DollarSign, Calendar, Plus, ChevronRight, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useFamilyFinancialSummary,
  useFamilyTransactions,
  useActivePeriod,
  useAddGraceDay,
  useCreatePayment,
} from '@/hooks/useFinancial'
// getMemberColor used in TransactionRow via members prop
import { todayLocalIso, localIso } from '@/utils/dates'
import type { ChildFinancialSummary, FinancialTransaction } from '@/types/financial'

export function FinancesTab({ familyId }: { familyId: string }) {
  const { data: summaries = [], isLoading } = useFamilyFinancialSummary(familyId)
  const { data: recentTransactions = [] } = useFamilyTransactions(familyId, 10)
  const { data: members } = useFamilyMembers(familyId)
  const navigate = useNavigate()
  const createPayment = useCreatePayment()

  const totalOwed = summaries.reduce((sum, s) => sum + s.balance, 0)
  const childrenWithBalance = summaries.filter(s => s.balance > 0)

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Loading finances...
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="py-12 text-center space-y-3">
        <DollarSign size={36} className="mx-auto" style={{ color: 'var(--color-text-muted)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          No allowance configured yet
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Set up allowance for your children in Settings.
        </p>
        <Link
          to="/settings/allowance"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Plus size={16} />
          Set Up Allowance
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      {/* What I Owe — top summary */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>
          What I Owe
        </h3>
        <div className="space-y-2">
          {summaries.map(s => (
            <div key={s.memberId} className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-primary)' }}>
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: s.memberColor ?? 'var(--color-text-muted)' }}
                />
                {s.memberName}
              </span>
              <span className="font-medium" style={{
                color: s.balance > 0 ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
              }}>
                {s.balance > 0 ? `$${s.balance.toFixed(2)}` : 'Paid up'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Total: ${totalOwed.toFixed(2)}
          </span>
          {childrenWithBalance.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  for (const child of childrenWithBalance) {
                    await createPayment.mutateAsync({
                      family_id: familyId,
                      family_member_id: child.memberId,
                      amount: child.balance,
                    })
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                Pay All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Per-child weekly progress cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          This Week's Progress
        </h3>
        {summaries
          .filter(s => s.allowanceEnabled)
          .map(summary => (
            <WeeklyProgressCard
              key={summary.memberId}
              summary={summary}
              familyId={familyId}
              navigate={navigate}
            />
          ))}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Recent Transactions
          </h3>
          <Link
            to="/finances/history"
            className="text-xs font-medium"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            View Full History
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
            No transactions yet
          </p>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map(tx => (
              <TransactionRow key={tx.id} tx={tx} members={members ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Weekly Progress Card ────────────────────────────────────

function WeeklyProgressCard({
  summary,
  navigate,
}: {
  summary: ChildFinancialSummary
  familyId: string
  navigate: (path: string) => void
}) {
  const { data: period } = useActivePeriod(summary.memberId)
  const addGraceDay = useAddGraceDay()
  const [showGracePicker, setShowGracePicker] = useState(false)

  const pct = period?.completion_percentage ?? 0
  const assigned = period?.effective_tasks_assigned ?? 0
  const completed = period?.effective_tasks_completed ?? 0
  const estimated = period
    ? (Number(period.base_amount) * Math.min(pct, 100) / 100)
    : 0
  const graceDays = (period?.grace_days as string[]) ?? []

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `2px solid ${summary.memberColor ?? 'var(--color-border)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {summary.memberName}'s Week ({summary.calculationApproach === 'fixed' ? 'Fixed' : summary.calculationApproach === 'points_weighted' ? 'Points' : 'Dynamic'})
        </h4>
        <button
          onClick={() => navigate(`/finances/history?member=${summary.memberId}`)}
          className="p-1 rounded"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        Tasks completed: {completed} of {assigned}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: pct >= 90 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-error)',
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {pct.toFixed(1)}%
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Est. ${estimated.toFixed(2)} of ${Number(summary.weeklyAmount).toFixed(2)}
        </span>
      </div>

      {/* Grace days */}
      {graceDays.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Grace days:</span>
          {graceDays.map(day => (
            <span
              key={day}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              {new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons — Mom only */}
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Mark Grace Day */}
        {period && (
          <div className="relative">
            <button
              onClick={() => setShowGracePicker(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              <Calendar size={12} />
              Mark Grace Day
            </button>

            {/* Grace day date picker */}
            {showGracePicker && (
              <div
                className="absolute left-0 top-full mt-1 z-20 rounded-lg p-3 shadow-lg"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-default, var(--color-border))',
                  minWidth: '220px',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
                    Pick a day ({period.period_start} to {period.period_end})
                  </span>
                  <button onClick={() => setShowGracePicker(false)} className="p-0.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                    <X size={14} />
                  </button>
                </div>
                <GraceDayGrid
                  periodStart={period.period_start as string}
                  periodEnd={period.period_end as string}
                  existingGraceDays={graceDays}
                  onSelect={(date) => {
                    addGraceDay.mutate({ periodId: period.id, date })
                    setShowGracePicker(false)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Assign Makeup Work */}
        <button
          onClick={() => {
            navigate(`/tasks?new=1&type=makeup&assignee=${summary.memberId}`)
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          <Plus size={12} />
          Assign Makeup Work
        </button>
      </div>
    </div>
  )
}

// ── Grace Day Grid ─────────────────────────────────────────
// Shows each day in the period as a tappable button so mom can mark any day, not just today.

function GraceDayGrid({
  periodStart,
  periodEnd,
  existingGraceDays,
  onSelect,
}: {
  periodStart: string
  periodEnd: string
  existingGraceDays: string[]
  onSelect: (date: string) => void
}) {
  const days: { iso: string; label: string; isToday: boolean; isGrace: boolean }[] = []
  const today = todayLocalIso()
  const start = new Date(periodStart + 'T12:00:00')
  const end = new Date(periodEnd + 'T12:00:00')

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = localIso(d)
    days.push({
      iso,
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      isToday: iso === today,
      isGrace: existingGraceDays.includes(iso),
    })
  }

  return (
    <div className="grid grid-cols-4 gap-1">
      {days.map(day => (
        <button
          key={day.iso}
          disabled={day.isGrace}
          onClick={() => onSelect(day.iso)}
          className="px-1.5 py-1.5 rounded text-xs text-center transition-colors"
          style={{
            backgroundColor: day.isGrace
              ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
              : day.isToday
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, transparent)'
                : 'transparent',
            color: day.isGrace
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-text-primary)',
            border: day.isToday
              ? '1px solid var(--color-btn-primary-bg)'
              : '1px solid var(--color-border-default, var(--color-border))',
            opacity: day.isGrace ? 0.6 : 1,
            cursor: day.isGrace ? 'default' : 'pointer',
            fontWeight: day.isGrace ? 600 : 400,
          }}
          title={day.isGrace ? 'Already a grace day' : `Mark ${day.iso} as grace day`}
        >
          {day.label}
        </button>
      ))}
    </div>
  )
}

// ── Transaction Row ─────────────────────────────────────────

function TransactionRow({
  tx,
  members,
}: {
  tx: FinancialTransaction
  members: Array<{ id: string; display_name: string }>
}) {
  const member = members.find(m => m.id === tx.family_member_id)
  const isPositive = tx.amount > 0
  const date = new Date(tx.created_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>{dateStr}</span>
          <span className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
            {member?.display_name}
          </span>
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {tx.description}
        </div>
      </div>
      <span
        className="text-sm font-semibold shrink-0 ml-3"
        style={{ color: isPositive ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
      >
        {isPositive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
      </span>
    </div>
  )
}
