import { useState, useMemo, useEffect } from 'react'
import { Gift, Check, Loader2, DollarSign, Wallet, ChevronDown, ChevronRight, Users, ImagePlus, Undo2, History, UserRound } from 'lucide-react'
import {
  useEarnedPrizes,
  useRedeemPrize,
  useRecentlyRedeemedPrizes,
  useUnredeemPrize,
  useUpdatePrizeImage,
  type EarnedPrize as EarnedPrizeRow,
} from '@/hooks/useEarnedPrizes'
import { useEarnedPrizes as useMemberEarnedPrizes } from '@/hooks/useRewardReveals'
import { RewardImagePicker } from '@/components/rewards/RewardImagePicker'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import { PrizeBox } from '@/components/reward-reveals/PrizeBox'
import { RedeemedHistoryModal } from '@/components/rewards/RedeemedHistoryModal'
import { SelfProposeSection } from '@/components/rewards/SelfProposeSection'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useAllowanceConfigs,
  useMemberAllowancePools,
} from '@/hooks/useFinancial'
import { getMemberColor } from '@/lib/memberColors'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import type { AllowancePeriod } from '@/types/financial'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useViewableMembers, accessLevelAtLeast } from '@/hooks/useViewableMembers'
import { LedgerView } from '@/features/financial/LedgerView'
import { PaymentModal } from '@/features/financial/FinancialModals'
import { FamilyGoalsStrip } from '@/components/rewards/FamilyGoalsStrip'
import { FamilyGoalManager } from '@/components/rewards/FamilyGoalManager'

/** FAMILY-GOALS-PRIZES: sentinel grouping key for ownerless Family Prizes
 *  (earned_prizes.family_member_id = NULL, migration 100284). Never collides
 *  with a real member UUID. */
const FAMILY_GROUP_KEY = '__family__'

/**
 * KIDS-REWARDS-PAGE Slice 5 — Prizes tab arrangement (mirrors the Balance
 * tab's LedgerView "By child / By date" toggle, founder request 2026-06-09
 * pattern reused here per the Slice 5 gate). Persists across sessions.
 */
type PrizesArrangement = 'by_kid' | 'by_date'
const PRIZES_ARRANGEMENT_STORAGE_KEY = 'myaim-prizeboard-prizes-arrangement'

function loadPrizesArrangement(): PrizesArrangement {
  try {
    const stored = localStorage.getItem(PRIZES_ARRANGEMENT_STORAGE_KEY)
    if (stored === 'by_date' || stored === 'by_kid') return stored
  } catch { /* ignore */ }
  return 'by_kid'
}

type Tab = 'allowance' | 'prizes' | 'balance'

export default function PrizeBoard() {
  const [activeTab, setActiveTab] = useState<Tab>('allowance')
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id

  // PERMISSIONS-WIRING (founder Decision 2, 2026-06-09): granted adults see
  // this page scoped by their per-kid financial_tracking level —
  // view = balances/ledger, contribute = + Mark Paid, manage = + Allowance
  // tab (period ops). Mom sees everything (manage for all).
  const { viewableLevels, isMom } = useViewableMembers('financial_tracking')
  const isAdditionalAdult = currentMember?.role === 'additional_adult'
  // ALLOWANCE-RECONCILIATION: check the role directly too — useViewableMembers
  // resolves async, and its briefly-false isMom used to bounce mom off the
  // Allowance tab onto Prizes on slow loads (the redirect effect below never
  // flips back).
  const isMomRole = currentMember?.role === 'primary_parent'
  const canSeeAllowanceTab =
    isMomRole ||
    isMom ||
    (isAdditionalAdult &&
      Object.entries(viewableLevels).some(
        ([id, level]) => id !== currentMember?.id && level === 'manage',
      ))

  // If the Allowance tab isn't available to this viewer, land on Prizes.
  useEffect(() => {
    if (!canSeeAllowanceTab && activeTab === 'allowance' && currentMember) {
      setActiveTab('prizes')
    }
  }, [canSeeAllowanceTab, activeTab, currentMember])

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    ...(canSeeAllowanceTab
      ? [{ key: 'allowance' as Tab, label: 'Allowance', icon: <DollarSign size={16} /> }]
      : []),
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
  const { viewableLevels, isMom } = useViewableMembers('financial_tracking')

  const isParentRole = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'

  const kidsWithAllowance = members.filter(m => {
    const config = configs.find(c => c.family_member_id === m.id)
    if (!config?.enabled) return false
    if (!isParentRole) return m.id === currentMember?.id
    // PERMISSIONS-WIRING: the Allowance tab is period management — granted
    // adults only see kids they hold a MANAGE-level finance grant for
    // (founder Decision 2). Mom sees all.
    if (!isMom) return viewableLevels[m.id] === 'manage'
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

  const [payTarget, setPayTarget] = useState<{ groups: PeriodGroup[]; amount: number; note: string; periodIds: string[] } | null>(null)

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

  // ALLOWANCE-RECONCILIATION (2026-07-07): period settlement now happens
  // INSIDE useCreatePayment via the settle_calculated_allowance_periods RPC
  // (explicit ids passed below), so the payment and the period close can
  // never diverge again. The old client-side close-after-payment here left
  // periods 'calculated' whenever the payment path threw (e.g. balance
  // already $0) — and the other payment surfaces never closed periods at all.
  const openPayForGroup = (group: PeriodGroup) => {
    setPayTarget({
      groups: [group],
      amount: group.total_earned,
      note: `Allowance for ${formatDateRange(group.period_start, group.period_end)}`,
      periodIds: group.pools.map(p => p.id),
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
      periodIds: groupedPeriods.flatMap(g => g.pools.map(p => p.id)),
    })
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
        settlePeriodIds={payTarget?.periodIds}
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
// Prizes Section — per-kid prizes + arrangement toggle + mom's own pill
// (KIDS-REWARDS-PAGE Slice 5, 2026-07-05)
// ============================================================

function PrizesSection({
  familyId,
  currentMemberId,
}: {
  familyId: string | undefined
  currentMemberId: string | undefined
}) {
  const { data: currentMember } = useFamilyMember()
  const { data: prizes = [], isLoading } = useEarnedPrizes()
  const { data: redeemedPrizes = [] } = useRecentlyRedeemedPrizes()
  const { data: members = [] } = useFamilyMembers(familyId)
  const { viewableIds, isMom } = useViewableMembers('financial_tracking')
  const redeemMutation = useRedeemPrize()
  const unredeemMutation = useUnredeemPrize()
  const updateImageMutation = useUpdatePrizeImage()
  const [showRedeemed, setShowRedeemed] = useState(false)
  const [editingImagePrize, setEditingImagePrize] = useState<EarnedPrizeRow | null>(null)
  const [arrangement, setArrangement] = useState<PrizesArrangement>(loadPrizesArrangement)
  const [managerOpen, setManagerOpen] = useState(false)

  const memberMap = new Map(members.map(m => [m.id, m]))
  const primaryParent = members.find(m => m.role === 'primary_parent')
  const isMomViewer = currentMember?.role === 'primary_parent'

  function pickArrangement(next: PrizesArrangement) {
    setArrangement(next)
    try { localStorage.setItem(PRIZES_ARRANGEMENT_STORAGE_KEY, next) } catch { /* ignore */ }
  }

  // PERMISSIONS-WIRING: granted adults see only their granted kids' prizes.
  // FAMILY-GOALS-PRIZES: a Family Prize (family_member_id=NULL) is never
  // kid-specific — it's visible to anyone with Prize Board access at all,
  // regardless of which kids they're individually granted (Rider 1 audit fix:
  // viewableIds.has(null) was silently false, hiding family prizes from every
  // granted adult).
  const scopedPrizes = isMom
    ? prizes
    : prizes.filter(p => p.family_member_id === null || viewableIds.has(p.family_member_id))
  const scopedRedeemed = isMom
    ? redeemedPrizes
    : redeemedPrizes.filter(p => p.family_member_id === null || viewableIds.has(p.family_member_id))

  // KIDS-REWARDS-PAGE Slice 5 / R4-REVISED: mom's own self-proposed rewards
  // never mix into "what's owed to others" — her own pill below is their
  // only home on this page (summary strip, both arrangements, and recently
  // redeemed all exclude her row). Family prizes (family_member_id=NULL) are
  // NOT excluded here — null !== primaryParent?.id, so they flow through and
  // render in their own "Family" group per Build Item 4.
  const visiblePrizes = scopedPrizes.filter(p => p.family_member_id !== primaryParent?.id)
  const visibleRedeemed = scopedRedeemed.filter(p => p.family_member_id !== primaryParent?.id)

  const grouped = visiblePrizes.reduce<Record<string, typeof prizes>>((acc, prize) => {
    const key = prize.family_member_id ?? FAMILY_GROUP_KEY
    if (!acc[key]) acc[key] = []
    acc[key].push(prize)
    return acc
  }, {})

  const byDate = useMemo(
    () => [...visiblePrizes].sort(
      (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime(),
    ),
    [visiblePrizes],
  )

  // Summary strip math EXCLUDES family prizes from the "kids" framing (mirrors
  // how mom's self-rewards are excluded) — a family prize isn't "waiting for
  // a kid." Surfaced instead as a separate addendum below.
  const kidPrizesOnly = visiblePrizes.filter(p => p.family_member_id !== null)
  const familyPrizesCount = (grouped[FAMILY_GROUP_KEY] ?? []).length
  const kidsWithPrizes = new Set(kidPrizesOnly.map(p => p.family_member_id)).size

  const handleRedeem = (prize: EarnedPrizeRow) => {
    if (!currentMemberId) return
    redeemMutation.mutate({ prizeId: prize.id, redeemedBy: currentMemberId, memberId: prize.family_member_id })
  }

  if (isLoading) {
    return <Loader2 className="animate-spin mx-auto" size={20} />
  }

  const nothingOwed = visiblePrizes.length === 0 && visibleRedeemed.length === 0

  return (
    <div className="space-y-6">
      {/* KIDS-REWARDS-PAGE Slice 5 / R4-REVISED: mom's own-rewards entry
          point. Always visible for her, independent of whether anything is
          owed to the kids below. */}
      {isMomViewer && currentMember && <MyOwnRewardsPill member={currentMember} />}

      {/* FAMILY-GOALS-PRIZES: active goals strip + manager door (Build Item 4/6).
          Hidden when no goals exist except a quiet [+ Family goal] affordance
          for mom (handled inside FamilyGoalsStrip itself). */}
      {familyId && (
        <FamilyGoalsStrip
          familyId={familyId}
          isMom={isMomViewer}
          onManage={() => setManagerOpen(true)}
        />
      )}

      {nothingOwed ? (
        <EmptyState
          icon={<Gift size={32} />}
          text="No unredeemed prizes. When contracts award prizes, they'll appear here."
        />
      ) : (
        <>
          {/* Summary strip — prizes/privileges only, never dollar amounts */}
          <div
            data-testid="prizes-summary-strip"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Gift size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
            {visiblePrizes.length === 0 ? (
              <span>All caught up — no prizes waiting to be given out.</span>
            ) : kidPrizesOnly.length === 0 ? (
              <span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{familyPrizesCount}</strong>{' '}
                family prize{familyPrizesCount === 1 ? '' : 's'} ready to redeem
              </span>
            ) : (
              <span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{kidPrizesOnly.length}</strong>{' '}
                prize{kidPrizesOnly.length === 1 ? '' : 's'} waiting across{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>{kidsWithPrizes}</strong>{' '}
                kid{kidsWithPrizes === 1 ? '' : 's'}
                {familyPrizesCount > 0 && (
                  <> · +{familyPrizesCount} family prize{familyPrizesCount === 1 ? '' : 's'}</>
                )}
              </span>
            )}
          </div>

          {/* Arrangement toggle — mirrors the Balance tab's By child/By date pattern */}
          {visiblePrizes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-text-secondary)]">Arrange:</span>
              {([['by_kid', 'By kid'], ['by_date', 'By date']] as const).map(([key, label]) => (
                <button
                  key={key}
                  data-testid={`prizes-arrangement-${key}`}
                  onClick={() => pickArrangement(key)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={{
                    borderColor: arrangement === key ? 'var(--color-btn-primary-bg)' : 'var(--color-border-default)',
                    backgroundColor: arrangement === key ? 'var(--color-btn-primary-bg)' : 'transparent',
                    color: arrangement === key ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {arrangement === 'by_kid' ? (
            <div className="space-y-6" data-testid="prizes-by-kid-list">
              {Object.entries(grouped)
                // FAMILY-GOALS-PRIZES: Family group leads — a shared win reads
                // as a celebration, not a footnote.
                .sort(([a], [b]) => (a === FAMILY_GROUP_KEY ? -1 : b === FAMILY_GROUP_KEY ? 1 : 0))
                .map(([memberId, memberPrizes]) => {
                const isFamily = memberId === FAMILY_GROUP_KEY
                const member = isFamily ? undefined : memberMap.get(memberId)
                const color = isFamily
                  ? 'var(--color-btn-primary-bg)'
                  : member ? getMemberColor(member) : 'var(--color-accent)'

                return (
                  <div key={memberId} data-testid={isFamily ? 'prizes-family-group' : undefined}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: color }}>
                      {isFamily ? (
                        <Users size={14} style={{ color }} />
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      )}
                      <span className="font-medium">{isFamily ? 'Family' : (member?.display_name ?? 'Unknown')}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        ({memberPrizes.length} unredeemed)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {memberPrizes.map(prize => (
                        <PrizeOwedRow
                          key={prize.id}
                          prize={prize}
                          onEditImage={() => setEditingImagePrize(prize)}
                          onRedeem={() => handleRedeem(prize)}
                          isRedeeming={redeemMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            visiblePrizes.length > 0 && (
              <div className="space-y-2" data-testid="prizes-by-date-list">
                {byDate.map(prize => {
                  const isFamily = prize.family_member_id === null
                  const member = isFamily ? undefined : memberMap.get(prize.family_member_id as string)
                  const color = isFamily
                    ? 'var(--color-btn-primary-bg)'
                    : member ? getMemberColor(member) : 'var(--color-accent)'
                  return (
                    <PrizeOwedRow
                      key={prize.id}
                      prize={prize}
                      onEditImage={() => setEditingImagePrize(prize)}
                      onRedeem={() => handleRedeem(prize)}
                      isRedeeming={redeemMutation.isPending}
                      memberTag={
                        isFamily
                          ? { name: 'Family', color }
                          : member ? { name: member.display_name, color } : undefined
                      }
                    />
                  )
                })}
              </div>
            )
          )}

          {/* KIDS-REWARDS-PAGE Q2: recently redeemed with mom-only Un-redeem (clean reset) */}
          {visibleRedeemed.length > 0 && (
            <div>
              <button
                onClick={() => setShowRedeemed(!showRedeemed)}
                className="text-sm text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
              >
                {showRedeemed
                  ? 'Hide recently redeemed'
                  : `Recently redeemed (${visibleRedeemed.length})`}
              </button>

              {showRedeemed && (
                <div className="space-y-2 mt-3 opacity-80">
                  {visibleRedeemed.map(prize => {
                    const isFamily = prize.family_member_id === null
                    const member = isFamily ? undefined : memberMap.get(prize.family_member_id as string)
                    return (
                      <div
                        key={prize.id}
                        data-testid={`redeemed-row-${prize.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]"
                      >
                        <PrizeThumb prize={prize} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {prize.prize_name ?? prize.prize_text ?? 'Prize'}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {isFamily ? 'Family' : (member?.display_name ?? 'Unknown')} · Redeemed{' '}
                            {prize.redeemed_at ? new Date(prize.redeemed_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => unredeemMutation.mutate({ prizeId: prize.id, memberId: prize.family_member_id })}
                          disabled={unredeemMutation.isPending}
                          data-testid="unredeem-button"
                          aria-label={`Un-redeem: ${prize.prize_name ?? prize.prize_text ?? 'Prize'}`}
                          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                          <Undo2 size={14} />
                          Un-redeem
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit-image modal (three-mode picker) */}
      {editingImagePrize && familyId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit prize picture"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setEditingImagePrize(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[var(--color-border-default)] p-5 space-y-4"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <p className="font-semibold text-[var(--color-text-primary)]">
              Picture for "{editingImagePrize.prize_name ?? editingImagePrize.prize_text ?? 'Prize'}"
            </p>
            <RewardImagePicker
              value={{
                imageUrl: editingImagePrize.prize_image_url,
                imageAssetKey: editingImagePrize.prize_asset_key,
              }}
              onChange={img => {
                updateImageMutation.mutate({
                  prizeId: editingImagePrize.id,
                  memberId: editingImagePrize.family_member_id,
                  imageUrl: img.imageUrl,
                  imageAssetKey: img.imageAssetKey,
                })
                setEditingImagePrize({
                  ...editingImagePrize,
                  prize_image_url: img.imageUrl,
                  prize_asset_key: img.imageAssetKey,
                })
              }}
              familyId={familyId}
              suggestText={editingImagePrize.prize_text ?? editingImagePrize.prize_name ?? ''}
            />
            <button
              onClick={() => setEditingImagePrize(null)}
              className="w-full px-3 py-2 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* FAMILY-GOALS-PRIZES: manager door #1 (Build Item 6 has door #2, Hub Settings) */}
      {familyId && isMomViewer && (
        <FamilyGoalManager isOpen={managerOpen} onClose={() => setManagerOpen(false)} familyId={familyId} />
      )}
    </div>
  )
}

/** One owed-prize row. Shows a member color/name tag when `memberTag` is
 *  passed (By date arrangement); omitted in By kid arrangement where the
 *  group header already carries that context. */
function PrizeOwedRow({
  prize,
  memberTag,
  onEditImage,
  onRedeem,
  isRedeeming,
}: {
  prize: EarnedPrizeRow
  memberTag?: { name: string; color: string }
  onEditImage: () => void
  onRedeem: () => void
  isRedeeming: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
      <PrizeThumb prize={prize} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {memberTag && (
            <span
              className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: memberTag.color, color: 'var(--color-text-on-primary, #fff)' }}
            >
              {memberTag.name}
            </span>
          )}
          <p className="font-medium truncate">
            {prize.prize_name ?? prize.prize_text ?? 'Prize'}
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Earned {new Date(prize.earned_at).toLocaleDateString()}
          {prize.source_type && ` via ${prize.source_type.replace(/_/g, ' ')}`}
        </p>
      </div>

      {/* KIDS-REWARDS-PAGE Q5c: edit-image-later */}
      <button
        onClick={onEditImage}
        title="Edit picture"
        aria-label="Edit picture"
        className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md text-sm border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:opacity-80 transition-opacity"
      >
        <ImagePlus size={14} />
      </button>

      <button
        onClick={onRedeem}
        disabled={isRedeeming}
        aria-label={`Mark redeemed: ${prize.prize_name ?? prize.prize_text ?? 'Prize'}`}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Check size={14} />
        Redeemed
      </button>
    </div>
  )
}

/**
 * Mom's own-rewards pill (KIDS-REWARDS-PAGE Slice 5 / R4-REVISED). Mom's own
 * self-proposed rewards are excluded from the general "what I owe others"
 * views above — this is their only home on the Prize Board. Reuses the exact
 * same building blocks as MyRewards.tsx's Custom Rewards section: PrizeBox
 * (self-redeem), the click-in Previously Redeemed history, and the
 * negotiation-collapsed self-propose screen (SelfProposeSection) whose own
 * doc comment named this exact pill as its Slice 5 entry point.
 */
function MyOwnRewardsPill({ member }: { member: FamilyMember }) {
  const [expanded, setExpanded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { data: myPrizes = [] } = useMemberEarnedPrizes(member.id)
  const redeemedCount = myPrizes.filter(p => p.redeemed_at).length

  return (
    <div
      data-testid="prizes-me-pill"
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        padding: '1rem',
      }}
    >
      <button
        type="button"
        data-testid="prizes-me-pill-toggle"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
          }}
        >
          <UserRound size={14} />
          Me
        </span>
        <span style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>
          My Own Rewards
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          <PrizeBox
            memberId={member.id}
            currentMemberId={member.id}
            canRedeem={false}
            selfRedeem
            variant="fun"
            hideRedeemed
          />

          {redeemedCount > 0 && (
            <button
              type="button"
              data-testid="prizes-me-history-button"
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2 rounded-full"
              style={{
                padding: '0.5rem 1rem',
                minHeight: '40px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              <History size={16} />
              Previously redeemed ({redeemedCount})
            </button>
          )}

          <SelfProposeSection member={member} isOwnSession />
        </div>
      )}

      {historyOpen && (
        <RedeemedHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          memberId={member.id}
          memberName={member.display_name}
          familyId={member.family_id}
        />
      )}
    </div>
  )
}

/** Thumbnail honoring all three image modes (upload / platform asset / none) */
function PrizeThumb({ prize }: { prize: EarnedPrizeRow }) {
  if (prize.prize_image_url) {
    return <img src={prize.prize_image_url} alt="" className="w-10 h-10 rounded object-cover" />
  }
  if (prize.prize_asset_key) {
    // PlatformAssetImage, not FeatureIcon: prize pictures are content (any
    // category, any vibe), not themed nav icons (KIDS-REWARDS-PAGE 2026-06-12)
    return (
      <PlatformAssetImage
        assetKey={prize.prize_asset_key}
        size={40}
        assetSize={128}
        variant="B"
        fallback={
          <div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]">
            <Gift size={18} className="opacity-50" />
          </div>
        }
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]">
      <Gift size={18} className="opacity-50" />
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
  const { viewableIds, viewableLevels, isMom: viewerIsMom } = useViewableMembers('financial_tracking')

  const isMom = currentMember?.role === 'primary_parent'
  const isAdditionalAdult = currentMember?.role === 'additional_adult'
  const isParentRole = isMom || isAdditionalAdult
  const isPlay = currentMember?.dashboard_mode === 'play'

  // PERMISSIONS-WIRING: granted adults see only granted kids' balances.
  const kids = useMemo(
    () => members.filter(m => m.role === 'member' && (viewerIsMom || viewableIds.has(m.id))),
    [members, viewerIsMom, viewableIds],
  )

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
    <ParentBalanceView
      familyId={familyId}
      kids={kids}
      // Mark Paid requires contribute+ on the kid (mom is manage for all).
      payableKidIds={new Set(
        kids
          .filter(k => viewerIsMom || accessLevelAtLeast(viewableLevels[k.id], 'contribute'))
          .map(k => k.id),
      )}
    />
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
  payableKidIds,
}: {
  familyId: string
  kids: FamilyMember[]
  /** Kids the viewer may record payments for (contribute+ finance level). */
  payableKidIds: Set<string>
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
          // Pay button only when the viewer holds contribute+ for this kid
          onPayClick={payableKidIds.has(selectedKid.id) ? () => setPaymentOpen(true) : undefined}
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
