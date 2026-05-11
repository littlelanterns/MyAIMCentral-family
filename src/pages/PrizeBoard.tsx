import { useState, useMemo, useEffect } from 'react'
import { Gift, Check, Loader2, DollarSign, Wallet, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { useEarnedPrizes, useRedeemPrize } from '@/hooks/useEarnedPrizes'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useAllowanceConfigs,
  useMemberAllowancePools,
} from '@/hooks/useFinancial'
import { getMemberColor } from '@/lib/memberColors'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AllowancePeriod } from '@/types/financial'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { LedgerView } from '@/features/financial/LedgerView'
import { PaymentModal } from '@/features/financial/FinancialModals'

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

      {activeTab === 'allowance' && <AllowanceOwedSection familyId={familyId} currentMember={currentMember ?? null} />}
      {activeTab === 'prizes' && <PrizesSection familyId={familyId} currentMemberId={currentMember?.id} />}
      {activeTab === 'balance' && <BalanceSection familyId={familyId} currentMember={currentMember ?? null} />}
    </div>
  )
}

// ============================================================
// Allowance Owed Section
// ============================================================

function AllowanceOwedSection({ familyId, currentMember }: { familyId: string | undefined; currentMember: FamilyMember | null }) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const { data: configs = [] } = useAllowanceConfigs(familyId)

  const isParentRole = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'

  const kidsWithAllowance = members.filter(m => {
    const config = configs.find(c => c.family_member_id === m.id)
    if (!config?.enabled) return false
    if (!isParentRole) return m.id === currentMember?.id
    return true
  })

  if (!familyId) return null

  if (kidsWithAllowance.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign size={32} />}
        text={isParentRole
          ? "No allowance configs enabled. Set up allowance in Settings to track what you owe."
          : "No allowance set up for you yet."
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {kidsWithAllowance.map(member => (
        <KidAllowanceCard key={member.id} member={member} familyId={familyId} isMom={isParentRole} />
      ))}
    </div>
  )
}

type PeriodGroup = {
  period_start: string
  period_end: string
  pools: AllowancePeriod[]
  total_earned: number
  combined_percentage: number | null
}

function KidAllowanceCard({
  member,
  familyId,
  isMom = true,
}: {
  member: { id: string; display_name: string; assigned_color?: string | null; member_color?: string | null }
  familyId: string
  isMom?: boolean
}) {
  const color = getMemberColor(member)
  const queryClient = useQueryClient()

  const [payTarget, setPayTarget] = useState<{ groups: PeriodGroup[]; amount: number; note: string } | null>(null)

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

  const groupedPeriods = useMemo(() => {
    const map = new Map<string, AllowancePeriod[]>()
    for (const p of unpaidPeriods) {
      const key = `${p.period_start}|${p.period_end}`
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return Array.from(map.entries())
      .map(([key, pools]) => {
        const [period_start, period_end] = key.split('|')
        return {
          period_start,
          period_end,
          pools,
          total_earned: pools.reduce((s, p) => s + Number(p.total_earned), 0),
          combined_percentage: pools.find(p => p.combined_percentage != null)?.combined_percentage ?? null,
        }
      })
      .sort((a, b) => b.period_start.localeCompare(a.period_start))
  }, [unpaidPeriods])

  const totalOwed = groupedPeriods.reduce((sum, g) => sum + g.total_earned, 0)

  const openPayForGroup = (group: PeriodGroup) => {
    setPayTarget({
      groups: [group],
      amount: group.total_earned,
      note: `Allowance for ${formatDateRange(group.period_start, group.period_end)}`,
    })
  }

  const openPayAll = () => {
    const dateRanges = groupedPeriods.map(g => formatDateRange(g.period_start, g.period_end))
    setPayTarget({
      groups: groupedPeriods,
      amount: totalOwed,
      note: dateRanges.length <= 2
        ? `Allowance for ${dateRanges.join(' & ')}`
        : `Allowance for ${dateRanges.length} periods`,
    })
  }

  const handlePaymentComplete = async () => {
    if (!payTarget) return
    try {
      const ids = payTarget.groups.flatMap(g => g.pools.map(p => p.id))
      await supabase
        .from('allowance_periods')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .in('id', ids)
      queryClient.invalidateQueries({ queryKey: ['unpaid-allowance-periods', member.id] })
    } catch (err) {
      console.warn('Failed to mark period(s) closed:', err)
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

      {groupedPeriods.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-2">
          All caught up! No allowance owed.
        </p>
      ) : (
        <div className="space-y-2">
          {groupedPeriods.map(group => (
            <PeriodGroupRow
              key={`${group.period_start}|${group.period_end}`}
              group={group}
              onPay={isMom ? () => openPayForGroup(group) : undefined}
              isPaying={false}
            />
          ))}

          {isMom && groupedPeriods.length > 1 && (
            <button
              onClick={openPayAll}
              className="w-full mt-2 px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity"
            >
              Pay All (${totalOwed.toFixed(2)})
            </button>
          )}
        </div>
      )}

      <PaymentModal
        isOpen={payTarget !== null}
        onClose={() => setPayTarget(null)}
        familyId={familyId}
        memberId={member.id}
        memberName={member.display_name}
        suggestedAmount={payTarget?.amount}
        suggestedNote={payTarget?.note}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}

/**
 * Phase 3.5 D-gap-3 — period group row.
 * Shows ONE row per (period_start, period_end) for the kid, with a
 * combined-percentage subtitle and an expandable per-pool breakdown
 * underneath. Single-pool kids will see exactly one pool in the breakdown
 * (the default pool); multi-pool kids see N pools with their individual
 * percentages, weights, and earned amounts.
 */
function PeriodGroupRow({
  group,
  onPay,
  isPaying,
}: {
  group: {
    period_start: string
    period_end: string
    pools: AllowancePeriod[]
    total_earned: number
    combined_percentage: number | null
  }
  onPay?: () => void
  isPaying: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isMultiPool = group.pools.length > 1

  // Display combined % when present (multi-pool); fallback to the single
  // pool's completion % for single-pool members.
  const displayPercentage = group.combined_percentage != null
    ? group.combined_percentage
    : group.pools[0]?.completion_percentage ?? 0

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {formatDateRange(group.period_start, group.period_end)}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {Number(displayPercentage).toFixed(0)}% completed
            {isMultiPool && ` · ${group.pools.length} pools`}
          </p>
        </div>
        <span className="text-sm font-semibold">${group.total_earned.toFixed(2)}</span>
        {onPay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPay() }}
            disabled={isPaying}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Check size={14} />
            Paid
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border-default)] space-y-2">
          {group.pools.map(p => (
            <div
              key={p.id}
              className="text-xs rounded p-2"
              style={{
                background: 'color-mix(in srgb, var(--color-bg-tertiary) 40%, transparent)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  {p.pool_name === 'default' ? 'Main pool' : p.pool_name}
                </span>
                <span className="font-semibold">${Number(p.total_earned).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[var(--color-text-secondary)]">
                <span>{p.effective_tasks_completed}/{p.effective_tasks_assigned} tasks</span>
                <span>{Number(p.completion_percentage).toFixed(0)}%</span>
                <span>Base ${Number(p.base_amount).toFixed(2)}</span>
                {p.bonus_applied && (
                  <span>Bonus +${Number(p.bonus_amount).toFixed(2)}</span>
                )}
                {p.grace_days && p.grace_days.length > 0 && (
                  <span>{p.grace_days.length} grace day{p.grace_days.length === 1 ? '' : 's'}</span>
                )}
                {p.extra_credit_completed > 0 && (
                  <span>+{p.extra_credit_completed} extra credit</span>
                )}
              </div>
            </div>
          ))}
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
// Balance Section — Phase 3.5 D2: full ledger + PaymentModal wiring
// ============================================================

function BalanceSection({
  familyId,
  currentMember,
}: {
  familyId: string | undefined
  currentMember: FamilyMember | null
}) {
  const { data: members = [] } = useFamilyMembers(familyId)

  const isMom = currentMember?.role === 'primary_parent'
  const isAdditionalAdult = currentMember?.role === 'additional_adult'
  const isParentRole = isMom || isAdditionalAdult
  const isPlay = currentMember?.dashboard_mode === 'play'

  const kids = useMemo(() => members.filter(m => m.role === 'member'), [members])

  if (!familyId || !currentMember) {
    return (
      <EmptyState
        icon={<Wallet size={32} />}
        text="Loading…"
      />
    )
  }

  // Kid viewing their own ledger.
  if (!isParentRole) {
    return (
      <KidSelfBalanceView
        familyId={familyId}
        member={currentMember}
        isPlay={isPlay}
      />
    )
  }

  // Mom / Adult viewing.
  if (kids.length === 0) {
    return (
      <EmptyState
        icon={<Wallet size={32} />}
        text="No family members with balance tracking."
      />
    )
  }

  return (
    <ParentBalanceView familyId={familyId} kids={kids} />
  )
}

// ── Kid viewing their own ledger ────────────────────────────────

function KidSelfBalanceView({
  familyId,
  member,
  isPlay,
}: {
  familyId: string
  member: FamilyMember
  isPlay: boolean
}) {
  const color = getMemberColor(member)
  const { data: pools = [] } = useMemberAllowancePools(member.id)
  const primaryPool = pools.find(p => p.pool_name === 'default') ?? pools[0]
  // Convention: Play shell forces $ amounts hidden. Otherwise respect
  // the primary pool's child_can_see_finances toggle. If no pool exists,
  // default to hidden (most conservative).
  const hideMoney = isPlay
    || !primaryPool
    || !primaryPool.child_can_see_finances

  return (
    <div>
      <div
        className="flex items-center gap-2 mb-3 pb-2 border-b"
        style={{ borderColor: color }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium">{member.display_name} — your ledger</span>
      </div>

      <LedgerView
        mode="self"
        familyId={familyId}
        memberId={member.id}
        hideMoney={hideMoney}
        pools={pools.map(p => ({ pool_name: p.pool_name }))}
      />
    </div>
  )
}

// ── Mom / Adult parent view ─────────────────────────────────────

function ParentBalanceView({
  familyId,
  kids,
}: {
  familyId: string
  kids: FamilyMember[]
}) {
  type ViewMode = 'per-kid' | 'all-kids'
  const [view, setView] = useState<ViewMode>('per-kid')
  const [selectedKidId, setSelectedKidId] = useState<string>(kids[0]?.id ?? '')
  const [paymentOpen, setPaymentOpen] = useState(false)

  // Reset selected kid if the kids list changes and the current selection
  // isn't there anymore (rare — happens after archive/unarchive).
  useEffect(() => {
    if (kids.length > 0 && !kids.find(k => k.id === selectedKidId)) {
      setSelectedKidId(kids[0].id)
    }
  }, [kids, selectedKidId])

  const selectedKid = kids.find(k => k.id === selectedKidId)
  const { data: pools = [] } = useMemberAllowancePools(
    view === 'per-kid' ? selectedKidId : undefined,
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* View toggle: per-kid vs all-kids */}
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        <button
          onClick={() => setView('per-kid')}
          style={pillStyle(view === 'per-kid')}
        >
          Per kid
        </button>
        <button
          onClick={() => setView('all-kids')}
          style={pillStyle(view === 'all-kids')}
        >
          <Users size={12} style={{ display: 'inline-block', marginRight: '0.25rem', verticalAlign: '-2px' }} />
          All kids
        </button>
      </div>

      {/* Kid selector pill bar — per-kid mode only */}
      {view === 'per-kid' && (
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {kids.map(kid => {
            const color = getMemberColor(kid)
            const isSelected = kid.id === selectedKidId
            return (
              <button
                key={kid.id}
                onClick={() => setSelectedKidId(kid.id)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  border: '2px solid',
                  borderColor: color,
                  background: isSelected ? color : 'transparent',
                  color: isSelected
                    ? 'var(--color-text-on-primary, white)'
                    : 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {kid.display_name}
              </button>
            )
          })}
        </div>
      )}

      {/* Ledger */}
      {view === 'per-kid' && selectedKid ? (
        <LedgerView
          mode="mom-per-kid"
          familyId={familyId}
          memberId={selectedKid.id}
          onPayClick={() => setPaymentOpen(true)}
          pools={pools.map(p => ({ pool_name: p.pool_name }))}
        />
      ) : view === 'all-kids' ? (
        <LedgerView
          mode="mom-all-kids"
          familyId={familyId}
        />
      ) : null}

      {/* Payment modal — wired here per Task 1 */}
      {selectedKid && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          familyId={familyId}
          memberId={selectedKid.id}
          memberName={selectedKid.display_name}
        />
      )}
    </div>
  )
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    border: '1px solid',
    borderColor: active
      ? 'var(--color-btn-primary-bg)'
      : 'var(--color-border-default, var(--color-border))',
    background: active
      ? 'var(--color-btn-primary-bg)'
      : 'transparent',
    color: active
      ? 'var(--color-btn-primary-text)'
      : 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 500,
    cursor: 'pointer',
  }
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
