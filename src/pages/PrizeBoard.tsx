import { useState } from 'react'
import { Gift, Check, Loader2, DollarSign, Wallet, ChevronDown, ChevronRight } from 'lucide-react'
import { useEarnedPrizes, useRedeemPrize } from '@/hooks/useEarnedPrizes'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useAllowanceConfigs,
  useCreatePayment,
  useRunningBalance,
  useFinancialTransactions,
} from '@/hooks/useFinancial'
import { getMemberColor } from '@/lib/memberColors'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AllowancePeriod, FinancialTransaction } from '@/types/financial'

type Tab = 'allowance' | 'prizes' | 'balance'

export default function PrizeBoard() {
  const [activeTab, setActiveTab] = useState<Tab>('allowance')
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'allowance', label: 'Allowance', icon: <DollarSign size={16} /> },
    { key: 'prizes', label: 'Prizes', icon: <Gift size={16} /> },
    { key: 'balance', label: 'Balance', icon: <Wallet size={16} /> },
  ]

  return (
    <div className="density-compact p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Gift size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-xl font-semibold">Prize Board</h1>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'allowance' && <AllowanceOwedSection familyId={familyId} />}
      {activeTab === 'prizes' && <PrizesSection familyId={familyId} currentMemberId={currentMember?.id} />}
      {activeTab === 'balance' && <BalanceSection familyId={familyId} />}
    </div>
  )
}

// ============================================================
// Allowance Owed Section
// ============================================================

function AllowanceOwedSection({ familyId }: { familyId: string | undefined }) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const { data: configs = [] } = useAllowanceConfigs(familyId)

  const kidsWithAllowance = members.filter(m => {
    const config = configs.find(c => c.family_member_id === m.id)
    return config?.enabled
  })

  if (!familyId) return null

  if (kidsWithAllowance.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign size={32} />}
        text="No allowance configs enabled. Set up allowance in Settings to track what you owe."
      />
    )
  }

  return (
    <div className="space-y-6">
      {kidsWithAllowance.map(member => (
        <KidAllowanceCard key={member.id} member={member} familyId={familyId} />
      ))}
    </div>
  )
}

function KidAllowanceCard({
  member,
  familyId,
}: {
  member: { id: string; display_name: string; assigned_color?: string | null; member_color?: string | null }
  familyId: string
}) {
  const color = getMemberColor(member)
  const queryClient = useQueryClient()
  const payMutation = useCreatePayment()

  const { data: unpaidPeriods = [], isLoading } = useQuery({
    queryKey: ['unpaid-allowance-periods', member.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowance_periods')
        .select('*')
        .eq('family_member_id', member.id)
        .eq('status', 'calculated')
        .order('period_start', { ascending: false })
      if (error) throw error
      return (data ?? []) as AllowancePeriod[]
    },
  })

  const totalOwed = unpaidPeriods.reduce((sum, p) => sum + Number(p.total_earned), 0)

  const handlePayPeriod = async (period: AllowancePeriod) => {
    try {
      await payMutation.mutateAsync({
        family_id: familyId,
        family_member_id: member.id,
        amount: Number(period.total_earned),
        note: `Allowance for ${formatDateRange(period.period_start, period.period_end)}`,
      })
      await supabase
        .from('allowance_periods')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', period.id)
      queryClient.invalidateQueries({ queryKey: ['unpaid-allowance-periods', member.id] })
    } catch (err) {
      console.warn('Failed to mark period paid:', err)
    }
  }

  const handlePayAll = async () => {
    for (const period of unpaidPeriods) {
      await handlePayPeriod(period)
    }
  }

  if (isLoading) {
    return <Loader2 className="animate-spin mx-auto" size={20} />
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: color }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-medium">{member.display_name}</span>
        {totalOwed > 0 && (
          <span className="ml-auto text-sm font-semibold">${totalOwed.toFixed(2)} owed</span>
        )}
      </div>

      {unpaidPeriods.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-2">
          All caught up! No allowance owed.
        </p>
      ) : (
        <div className="space-y-2">
          {unpaidPeriods.map(period => (
            <PeriodRow key={period.id} period={period} onPay={() => handlePayPeriod(period)} isPaying={payMutation.isPending} />
          ))}

          {unpaidPeriods.length > 1 && (
            <button
              onClick={handlePayAll}
              disabled={payMutation.isPending}
              className="w-full mt-2 px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Pay All (${totalOwed.toFixed(2)})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PeriodRow({
  period,
  onPay,
  isPaying,
}: {
  period: AllowancePeriod
  onPay: () => void
  isPaying: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const details = period.calculation_details as Record<string, unknown> | null

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {formatDateRange(period.period_start, period.period_end)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {Number(period.completion_percentage).toFixed(0)}% completed
            {period.bonus_applied && ' + bonus'}
          </p>
        </div>
        <span className="text-sm font-semibold">${Number(period.total_earned).toFixed(2)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onPay() }}
          disabled={isPaying}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Check size={14} />
          Paid
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border-default)]">
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div>
              <span className="text-[var(--color-text-secondary)]">Tasks completed:</span>{' '}
              {period.effective_tasks_completed}/{period.effective_tasks_assigned}
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">Base amount:</span>{' '}
              ${Number(period.base_amount).toFixed(2)}
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">Calculated:</span>{' '}
              ${Number(period.calculated_amount).toFixed(2)}
            </div>
            {period.bonus_applied && (
              <div>
                <span className="text-[var(--color-text-secondary)]">Bonus:</span>{' '}
                +${Number(period.bonus_amount).toFixed(2)}
              </div>
            )}
            {period.grace_days && period.grace_days.length > 0 && (
              <div className="col-span-2">
                <span className="text-[var(--color-text-secondary)]">Grace days:</span>{' '}
                {period.grace_days.length}
              </div>
            )}
            {period.extra_credit_completed > 0 && (
              <div>
                <span className="text-[var(--color-text-secondary)]">Extra credit:</span>{' '}
                {period.extra_credit_completed} tasks
              </div>
            )}
          </div>
          {details && typeof details === 'object' && Object.keys(details).length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              Calculated {period.calculated_at ? new Date(period.calculated_at).toLocaleDateString() : 'N/A'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Prizes Section (existing, kept as-is)
// ============================================================

function PrizesSection({
  familyId,
  currentMemberId,
}: {
  familyId: string | undefined
  currentMemberId: string | undefined
}) {
  const { data: prizes = [], isLoading } = useEarnedPrizes()
  const { data: members = [] } = useFamilyMembers(familyId)
  const redeemMutation = useRedeemPrize()

  const memberMap = new Map(members.map(m => [m.id, m]))

  const grouped = prizes.reduce<Record<string, typeof prizes>>((acc, prize) => {
    const key = prize.family_member_id
    if (!acc[key]) acc[key] = []
    acc[key].push(prize)
    return acc
  }, {})

  const handleRedeem = (prizeId: string) => {
    if (!currentMemberId) return
    redeemMutation.mutate({ prizeId, redeemedBy: currentMemberId })
  }

  if (isLoading) {
    return <Loader2 className="animate-spin mx-auto" size={20} />
  }

  if (prizes.length === 0) {
    return (
      <EmptyState
        icon={<Gift size={32} />}
        text="No unredeemed prizes. When contracts award prizes, they'll appear here."
      />
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([memberId, memberPrizes]) => {
        const member = memberMap.get(memberId)
        const color = member ? getMemberColor(member) : 'var(--color-accent)'

        return (
          <div key={memberId}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: color }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium">{member?.display_name ?? 'Unknown'}</span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                ({memberPrizes.length} unredeemed)
              </span>
            </div>

            <div className="space-y-2">
              {memberPrizes.map(prize => (
                <div
                  key={prize.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]"
                >
                  {prize.prize_image_url ? (
                    <img src={prize.prize_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]">
                      <Gift size={18} className="opacity-50" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {prize.prize_name ?? prize.prize_text ?? 'Prize'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Earned {new Date(prize.earned_at).toLocaleDateString()}
                      {prize.source_type && ` via ${prize.source_type.replace(/_/g, ' ')}`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeem(prize.id)}
                    disabled={redeemMutation.isPending}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Check size={14} />
                    Redeemed
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Balance Section
// ============================================================

function BalanceSection({ familyId }: { familyId: string | undefined }) {
  const { data: members = [] } = useFamilyMembers(familyId)

  const kids = members.filter(m => m.role === 'member')

  if (!familyId || kids.length === 0) {
    return (
      <EmptyState
        icon={<Wallet size={32} />}
        text="No family members with balance tracking."
      />
    )
  }

  return (
    <div className="space-y-6">
      {kids.map(member => (
        <KidBalanceCard key={member.id} member={member} familyId={familyId} />
      ))}
    </div>
  )
}

function KidBalanceCard({
  member,
  familyId,
}: {
  member: { id: string; display_name: string; assigned_color?: string | null; member_color?: string | null }
  familyId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const color = getMemberColor(member)
  const { data: balance = 0, isLoading: balanceLoading } = useRunningBalance(member.id)
  const { data: transactions = [] } = useFinancialTransactions(member.id, expanded ? { type: 'all' } : undefined)
  const payMutation = useCreatePayment()

  const handlePayBalance = async () => {
    if (balance <= 0) return
    try {
      await payMutation.mutateAsync({
        family_id: familyId,
        family_member_id: member.id,
        amount: balance,
        note: 'Balance payout',
      })
    } catch (err) {
      console.warn('Failed to pay balance:', err)
    }
  }

  const recentTx = transactions.slice(0, 20)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: color }}>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-medium">{member.display_name}</span>
        <span className="ml-auto text-sm font-semibold">
          {balanceLoading ? '...' : `$${Number(balance).toFixed(2)}`}
        </span>
      </div>

      {balance > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
            <Wallet size={18} className="text-[var(--color-accent)] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current balance</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                From allowance, opportunities, and adjustments
              </p>
            </div>
            <button
              onClick={handlePayBalance}
              disabled={payMutation.isPending}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Check size={14} />
              Pay ${Number(balance).toFixed(2)}
            </button>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {expanded ? 'Hide' : 'Show'} recent transactions
          </button>

          {expanded && recentTx.length > 0 && (
            <div className="space-y-1 mt-1">
              {recentTx.map(tx => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)] py-2">
          Balance at $0.00
        </p>
      )}
    </div>
  )
}

function TransactionRow({ tx }: { tx: FinancialTransaction }) {
  const isPositive = Number(tx.amount) > 0
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-[var(--color-bg-tertiary)]">
      <span className="flex-1 truncate">{tx.description}</span>
      <span className={isPositive ? 'text-green-600 font-medium' : 'text-[var(--color-text-secondary)]'}>
        {isPositive ? '+' : ''}${Number(tx.amount).toFixed(2)}
      </span>
      <span className="text-[var(--color-text-secondary)] shrink-0">
        {new Date(tx.created_at).toLocaleDateString()}
      </span>
    </div>
  )
}

// ============================================================
// Shared Components
// ============================================================

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border-default)] p-8 text-center">
      <div className="mx-auto mb-3 opacity-40">{icon}</div>
      <p className="text-[var(--color-text-secondary)]">{text}</p>
    </div>
  )
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`
}
