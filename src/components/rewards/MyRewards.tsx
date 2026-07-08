/**
 * MyRewards — KIDS-REWARDS-PAGE Slice 2. The shared sections component behind
 * the member-facing rewards surface (founder gate Q3: ONE component).
 *
 * Hosts:
 *   - /my-rewards (MyRewardsPage) — Guided / Independent / Adult, variant='standard'
 *   - /rewards (PlayRewards)      — Play shell, variant='play' (56px targets,
 *                                   NO finances ever, no Redeem button)
 *
 * Sections (mom opt-in per kid via my_rewards_sections — Q1):
 *   Points          — per-child currency (gamification_configs.currency_name,
 *                     NEVER hardcoded) + streak
 *   Custom Rewards  — PrizeBox cards (kid-final self-redeem per Q2 on own
 *                     session) + click-in Previously Redeemed history (Pillar 4)
 *   Victories       — tappable celebration record (gate Section 7, default OFF)
 *   Finances        — ONE owed number from calculate_running_balance — the SAME
 *                     source the Balance page uses, so the two surfaces
 *                     reconcile by construction (Convention #271 dashboard-truth)
 *                     — with a tap-through to LedgerView mode='self'.
 *                     Play: mom OPT-IN, default OFF (founder amendment
 *                     2026-06-12 — amends PRD-28's "never on Play" for this
 *                     surface into a per-kid mom choice).
 *
 *   Creatures/Coloring   — Slice 3 sections (sticker book frame + gallery)
 *   Propose-a-Reward     — Slice 4 (gate §5/§6): kid pitch → mom's Queue
 *                          RequestsTab; adults get the self-propose screen.
 *                          Guided+ only — never rendered on the Play variant.
 *
 * View As correctness: the host page passes the EFFECTIVE member
 * (useEffectiveMember). Self-redeem is offered only on the member's own real
 * auth session (isOwnSession) — redeem_own_prize is earner-auth-only, so a
 * mom-session View As must not offer a button that would fail.
 */

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  History,
  Lock,
  PartyPopper,
  Sparkles,
  Star,
  Store,
  Undo2,
  Users,
  Wallet,
} from 'lucide-react'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useMyRewardsSettings } from '@/hooks/useMyRewardsSettings'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useMemberStreak } from '@/hooks/useMemberStreak'
import { useMemberPointsToday } from '@/hooks/useMemberPointsToday'
import { useRunningBalance, useMemberAllowancePools } from '@/hooks/useFinancial'
import { useEarnedPrizes } from '@/hooks/useRewardReveals'
import {
  useRewardShopItemsForMember,
  useMemberRewardShopPurchases,
  usePurchaseRewardShopItem,
  useCancelRewardShopPurchase,
  useMemberCompletionPercentage,
} from '@/hooks/useRewardShop'
import type { RewardShopItem } from '@/types/reward-shop'
import { ModalV2 } from '@/components/shared/ModalV2'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import {
  useEarnedPrizes as useFamilyEarnedPrizes,
  useRecentlyRedeemedPrizes as useFamilyRecentlyRedeemedPrizes,
} from '@/hooks/useEarnedPrizes'
import type { EarnedPrize as RewardRevealsEarnedPrize } from '@/types/reward-reveals'
import { useFamilyGoalsForMember, useFamilyGoalProgress } from '@/hooks/useFamilyGoals'
import { useVictories } from '@/hooks/useVictories'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { PrizeBox } from '@/components/reward-reveals/PrizeBox'
import { RedeemedHistoryModal } from './RedeemedHistoryModal'
import { CelebrationDetailModal } from '@/components/victories/CelebrationDetailModal'
import { CreaturePageFrame } from './CreaturePageFrame'
import { ColoringSection } from './ColoringSection'
import { ProposeRewardSection } from './ProposeRewardSection'
import { SelfProposeSection } from './SelfProposeSection'
import { LedgerView } from '@/features/financial/LedgerView'
import type { Victory } from '@/types/victories'
import type { FamilyGoal } from '@/types/family-goals'

export interface MyRewardsProps {
  /** The data subject — the EFFECTIVE member (View As aware at the host page). */
  member: FamilyMember
  variant: 'standard' | 'play'
  /**
   * True only when the viewer IS this member on their own real auth session
   * (not View As, not a mom-session hub dip-in). Gates kid-final self-redeem.
   */
  isOwnSession: boolean
}

export function MyRewards({ member, variant, isOwnSession }: MyRewardsProps) {
  const { data: settings } = useMyRewardsSettings(member.id)

  if (!settings) return null
  const sections = settings.sections

  return (
    <div className="space-y-4" data-testid="my-rewards-sections">
      {sections.points && (
        <PointsSection member={member} variant={variant} />
      )}

      {sections.creatures && (
        <CreaturesSection member={member} variant={variant} />
      )}

      {sections.coloring && (
        <ColoringSection memberId={member.id} variant={variant} />
      )}

      {sections.custom_rewards && (
        <CustomRewardsSection
          member={member}
          variant={variant}
          isOwnSession={isOwnSession}
        />
      )}

      {/* FAMILY-GOALS-PRIZES Build Item 7: goals this member participates in
          + earned unredeemed family prizes (FD-2). */}
      {sections.family && (
        <FamilySection member={member} variant={variant} />
      )}

      {/* PECON-SHOP §7.4/§7.5: Reward Shop — Buy / progress-toward-cost /
          gate-progress states. Play gets a picture-shelf variant with no
          gate math shown and every purchase mom-approved. */}
      {sections.shop && (
        <ShopSection member={member} variant={variant} />
      )}

      {sections.victories && (
        <VictoriesSection member={member} variant={variant} />
      )}

      {/* Propose-a-Reward (Slice 4, gate §5/§6): Guided+ only — never on Play.
          Kids pitch mom a deal (→ her Queue RequestsTab); adults get the
          negotiation-collapsed self-propose screen (§11 — any adult). */}
      {sections.propose && variant !== 'play' && (
        member.role === 'member' ? (
          <ProposeRewardSection
            member={member}
            variant={variant}
            isOwnSession={isOwnSession}
          />
        ) : (
          <SelfProposeSection member={member} isOwnSession={isOwnSession} />
        )
      )}

      {/* Play money: mom opt-in, default OFF (founder amendment 2026-06-12).
          The resolved value defaults false for Play and true only on mom's
          explicit override. */}
      {sections.finances && (
        <FinancesSection member={member} variant={variant} />
      )}
    </div>
  )
}

// ── Section shell ───────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  testId,
  play,
  hideHeader = false,
  children,
}: {
  title: string
  icon: React.ReactNode
  testId: string
  play: boolean
  /** When the child renders its own header (PrizeBox's "My Prize Box"),
   *  skip the section header to avoid a double-title stack. */
  hideHeader?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      data-testid={testId}
      aria-label={title}
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        padding: play ? '1.25rem' : '1rem',
      }}
    >
      {!hideHeader && (
        <div
          className="flex items-center gap-2 mb-3"
          style={{
            fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-text-heading)',
          }}
        >
          <span style={{ color: 'var(--color-btn-primary-bg)', display: 'inline-flex' }}>
            {icon}
          </span>
          {title}
        </div>
      )}
      {children}
    </section>
  )
}

// ── Points & streak ─────────────────────────────────────────────────

function PointsSection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  const { data: config } = useGamificationConfig(member.id)
  // Read live stats from the family roster query — Build M's gamification
  // hooks invalidate ['family-members', familyId] on every award (Convention
  // #202), so this stays fresh without a parallel stats query.
  const { data: members = [] } = useFamilyMembers(member.family_id)
  const row = members.find(m => m.id === member.id) as
    | (FamilyMember & { gamification_points?: number })
    | undefined

  const points = row?.gamification_points ?? 0
  // CLIENT-DATE-REMEDIATION revised W4: family_members.current_streak has been
  // dead since migration 100221 dropped the RPC that wrote it — read the live
  // computed streak instead (see useMemberStreak.ts).
  const { data: memberStreak } = useMemberStreak(member.id)
  const streak = memberStreak?.currentStreak ?? 0
  // Per-child currency name — never hardcode (PRD-24 / recon binding rule).
  const currencyName = config?.currency_name?.trim() || 'points'
  const play = variant === 'play'
  // PRD-24 Point Economy Addendum §5.6 (rider 2): daily points goal — renders
  // NOTHING when unset (neutral-primitive law). Never framed as a miss.
  const dailyGoal = config?.daily_points_goal ?? null
  const { data: pointsToday } = useMemberPointsToday(dailyGoal != null ? member.id : undefined)

  return (
    <SectionCard title="My Points" icon={<Star size={play ? 24 : 18} />} testId="mr-section-points" play={play}>
      <div className="flex items-center gap-4 flex-wrap">
        <div
          data-testid="mr-points-value"
          style={{
            fontSize: play ? '2.25rem' : '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-heading)',
            lineHeight: 1,
          }}
        >
          {points}
          <span
            style={{
              fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginLeft: '0.5rem',
            }}
          >
            {currencyName}
          </span>
        </div>

        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
              border:
                '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
              color: 'var(--color-btn-primary-bg)',
              fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
              fontWeight: 700,
            }}
          >
            <Flame size={play ? 20 : 16} />
            {streak}-day streak
          </div>
        )}
      </div>

      {/* PRD-24 Point Economy Addendum §5.6: "7/10 today" warm progress —
          absent entirely when mom hasn't set a goal. Never shows a miss. */}
      {dailyGoal != null && dailyGoal > 0 && (
        <div className="mt-3" data-testid="mr-daily-goal-progress">
          <div
            className="flex items-center justify-between mb-1"
            style={{ fontSize: play ? 'var(--font-size-sm)' : 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
          >
            <span>{Math.min(pointsToday ?? 0, dailyGoal)}/{dailyGoal} today</span>
          </div>
          <div
            style={{
              height: play ? 12 : 8,
              borderRadius: 999,
              backgroundColor: 'var(--color-bg-secondary)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round(((pointsToday ?? 0) / dailyGoal) * 100))}%`,
                background: 'var(--surface-primary)',
                borderRadius: 999,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ── Creatures (the swipe-strip sticker book frame — Slice 3) ────────

function CreaturesSection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  const { data: stickerState } = useStickerBookState(member.id)
  const play = variant === 'play'

  // No sticker book (gamification off / no row) → warm empty state.
  if (!stickerState) {
    return (
      <SectionCard
        title="My Creatures"
        icon={<Sparkles size={play ? 24 : 18} />}
        testId="mr-section-creatures"
        play={play}
      >
        <p className="text-sm py-1" style={{ color: 'var(--color-text-secondary)' }}>
          Your creatures will live here once your sticker book is turned on.
        </p>
      </SectionCard>
    )
  }

  return (
    <section data-testid="mr-section-creatures" aria-label="My Creatures">
      <CreaturePageFrame memberId={member.id} variant={variant} />
    </section>
  )
}

// ── Custom rewards (PrizeBox + click-in history) ────────────────────

function CustomRewardsSection({
  member,
  variant,
  isOwnSession,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
  isOwnSession: boolean
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const { data: prizes = [] } = useEarnedPrizes(member.id)
  const redeemedCount = prizes.filter(p => p.redeemed_at).length
  const play = variant === 'play'

  return (
    <SectionCard
      title="My Prize Box"
      icon={<Gift size={play ? 24 : 18} />}
      testId="mr-section-custom"
      play={play}
      hideHeader // PrizeBox renders its own "My Prize Box" header + count badge
    >
      <PrizeBox
        memberId={member.id}
        currentMemberId={member.id}
        canRedeem={false}
        selfRedeem={isOwnSession && !play}
        playMode={play}
        variant="fun"
        hideRedeemed
      />

      {redeemedCount > 0 && (
        <button
          type="button"
          data-testid="mr-history-button"
          onClick={() => setHistoryOpen(true)}
          className="mt-3 flex items-center gap-2 rounded-full"
          style={{
            padding: play ? '0.75rem 1.25rem' : '0.5rem 1rem',
            minHeight: play ? '56px' : '40px',
            fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
            fontWeight: 600,
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <History size={play ? 20 : 16} />
          Previously redeemed ({redeemedCount})
        </button>
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
    </SectionCard>
  )
}

// ── Family (goals this member participates in + earned family prizes) ──
// FAMILY-GOALS-PRIZES Build Item 7. FD-2: a participant sees a family goal
// on their own My Rewards page — membership in participating_member_ids for
// in-flight goals, shared_with_member_ids (participant snapshot) for earned
// prizes. Mom's own Me view is included (she's just another member here).

function FamilySection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const { data: goals = [] } = useFamilyGoalsForMember(member.family_id, member.id)
  const activeGoals = goals.filter((g) => g.status === 'active')
  // Family-scoped (not member-scoped) — correct regardless of View As, since
  // View As never crosses a family boundary.
  const { data: allPrizes = [] } = useFamilyEarnedPrizes()
  const myFamilyPrizes = allPrizes.filter(
    (p) => p.source_type === 'family_goal' && (p.shared_with_member_ids ?? []).includes(member.id),
  )
  const { data: allRedeemed = [] } = useFamilyRecentlyRedeemedPrizes()
  const myRedeemedFamilyPrizes = allRedeemed.filter(
    (p) => p.source_type === 'family_goal' && (p.shared_with_member_ids ?? []).includes(member.id),
  )
  const play = variant === 'play'

  if (activeGoals.length === 0 && myFamilyPrizes.length === 0) {
    return (
      <SectionCard title="Family Goals" icon={<Users size={play ? 24 : 18} />} testId="mr-section-family" play={play}>
        <p className="text-sm py-1" style={{ color: 'var(--color-text-secondary)' }}>
          No family goals in progress right now.
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Family Goals" icon={<Users size={play ? 24 : 18} />} testId="mr-section-family" play={play}>
      <div className="space-y-3">
        {activeGoals.map((goal) => (
          <FamilyGoalMemberRow key={goal.id} goal={goal} memberId={member.id} play={play} />
        ))}

        {myFamilyPrizes.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Family prizes ready
            </p>
            {myFamilyPrizes.map((prize) => (
              <div
                key={prize.id}
                data-testid={`mr-family-prize-${prize.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <Gift size={play ? 20 : 16} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {prize.prize_name ?? prize.prize_text ?? 'Family Prize'}
                </span>
              </div>
            ))}
          </div>
        )}

        {myRedeemedFamilyPrizes.length > 0 && (
          <button
            type="button"
            data-testid="mr-family-history-button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 rounded-full"
            style={{
              padding: play ? '0.75rem 1.25rem' : '0.5rem 1rem',
              minHeight: play ? '56px' : '40px',
              fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
              fontWeight: 600,
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            <History size={play ? 20 : 16} />
            Previously redeemed ({myRedeemedFamilyPrizes.length})
          </button>
        )}
      </div>

      {historyOpen && (
        <RedeemedHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          memberId={member.id}
          memberName={member.display_name}
          familyId={member.family_id}
          additionalRedeemed={myRedeemedFamilyPrizes as unknown as RewardRevealsEarnedPrize[]}
        />
      )}
    </SectionCard>
  )
}

function FamilyGoalMemberRow({
  goal,
  memberId,
  play,
}: {
  goal: FamilyGoal
  memberId: string
  play: boolean
}) {
  const { data: progress } = useFamilyGoalProgress(goal.id)
  const myCount = progress?.perMember.find((p) => p.memberId === memberId)?.count ?? 0
  const familyTotal = progress?.total ?? goal.current_progress

  return (
    <div
      data-testid={`mr-family-goal-${goal.id}`}
      className="rounded-lg px-3 py-2.5"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <p
        className="font-medium"
        style={{ fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}
      >
        {goal.title}
      </p>
      {goal.progress_visible ? (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {goal.earning_mode === 'each_member'
            ? `You: ${myCount} / ${goal.target_count}`
            : `You: ${myCount} · Family: ${familyTotal}/${goal.target_count}`}
        </p>
      ) : (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {goal.prize_name}
        </p>
      )}
    </div>
  )
}

// ── Reward Shop (PECON-SHOP §7.4/§7.5) ──────────────────────────────

function ShopSection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  const play = variant === 'play'
  const { data: members = [] } = useFamilyMembers(member.family_id)
  const row = members.find((m) => m.id === member.id) as (FamilyMember & { gamification_points?: number }) | undefined
  const balance = row?.gamification_points ?? 0

  const { data: allItems = [] } = useRewardShopItemsForMember(member.id)
  // Play NEVER shows gated items (addendum §7.5 — "no gate math shown").
  const items = play ? allItems.filter((i) => !i.unlock_rule) : allItems
  const { data: purchases = [] } = useMemberRewardShopPurchases(member.id)
  const pendingPurchases = purchases.filter((p) => p.status === 'pending')

  const hasGatedItem = items.some((i) => i.unlock_rule)
  const { data: completionPct } = useMemberCompletionPercentage(member.id, hasGatedItem)

  const purchaseItem = usePurchaseRewardShopItem()
  const cancelPurchase = useCancelRewardShopPurchase()

  const [confirmItem, setConfirmItem] = useState<RewardShopItem | null>(null)
  const [resultBanner, setResultBanner] = useState<{ item: RewardShopItem; pending: boolean } | null>(null)

  const handleConfirmBuy = async () => {
    if (!confirmItem) return
    const item = confirmItem
    try {
      const result = await purchaseItem.mutateAsync({ itemId: item.id, memberId: member.id, familyId: member.family_id })
      setConfirmItem(null)
      if (result.status === 'auto_approved' || result.status === 'pending') {
        setResultBanner({ item, pending: result.status === 'pending' })
        setTimeout(() => setResultBanner(null), 3500)
      }
    } catch {
      setConfirmItem(null)
    }
  }

  if (items.length === 0 && pendingPurchases.length === 0) {
    return (
      <SectionCard title="Reward Shop" icon={<Store size={play ? 24 : 18} />} testId="mr-section-shop" play={play}>
        <p className="text-sm py-1" style={{ color: 'var(--color-text-secondary)' }}>
          Nothing in the shop yet — ask a grown-up to add some rewards!
        </p>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="Reward Shop" icon={<Store size={play ? 24 : 18} />} testId="mr-section-shop" play={play}>
      {resultBanner && (
        <div
          data-testid="mr-shop-result-banner"
          className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          <PartyPopper size={play ? 20 : 16} />
          <span className="text-sm font-semibold">
            {resultBanner.pending ? `Sent to a grown-up — ${resultBanner.item.name} is waiting for approval!` : `You got ${resultBanner.item.name}!`}
          </span>
        </div>
      )}

      {pendingPurchases.length > 0 && (
        <div className="space-y-2 mb-3">
          {pendingPurchases.map((p) => (
            <div
              key={p.id}
              data-testid={`mr-shop-pending-${p.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <Clock size={play ? 18 : 14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Waiting for mom — {p.item_name} ({p.points_cost} pts set aside)
              </span>
              <button
                type="button"
                data-testid={`mr-shop-take-back-${p.id}`}
                onClick={() => cancelPurchase.mutate({ purchaseId: p.id, familyId: member.family_id, memberId: member.id })}
                disabled={cancelPurchase.isPending}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <Undo2 size={12} /> Take it back
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={play ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {items.map((item) => {
          const gatePct = item.unlock_rule ? completionPct ?? 0 : null
          const gateMet = gatePct === null || gatePct >= (item.unlock_rule?.threshold ?? 0)
          const affordable = balance >= item.point_cost
          const alreadyPending = pendingPurchases.some((p) => p.store_item_id === item.id)
          return (
            <ShopItemCard
              key={item.id}
              item={item}
              play={play}
              balance={balance}
              affordable={affordable}
              gateMet={gateMet}
              gatePct={gatePct}
              disabled={alreadyPending || purchaseItem.isPending}
              onBuy={() => setConfirmItem(item)}
            />
          )
        })}
      </div>

      {confirmItem && (
        <ModalV2
          id="shop-confirm-purchase"
          isOpen={true}
          onClose={() => setConfirmItem(null)}
          type="transient"
          size="sm"
          title={play ? 'Trade for this?' : 'Confirm purchase'}
          icon={Store}
          footer={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                data-testid="mr-shop-confirm-buy"
                onClick={handleConfirmBuy}
                disabled={purchaseItem.isPending}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  minHeight: play ? '56px' : '44px',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: 'none',
                  background: 'var(--surface-primary)',
                  color: 'var(--color-text-on-primary)',
                  fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: purchaseItem.isPending ? 0.6 : 1,
                }}
              >
                {purchaseItem.isPending ? 'Trading...' : play ? "Let's do it!" : 'Buy it'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                style={{
                  padding: '0.625rem 1rem',
                  minHeight: play ? '56px' : '44px',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          }
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-heading)' }}>
              {confirmItem.name}
            </p>
            <p
              className="flex items-center gap-1.5"
              style={{ fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-btn-primary-bg)' }}
            >
              <Star size={play ? 22 : 18} /> {confirmItem.point_cost}
            </p>
            {(play || confirmItem.requires_approval) && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                A grown-up will need to say yes first.
              </p>
            )}
          </div>
        </ModalV2>
      )}
    </SectionCard>
  )
}

function ShopItemCard({
  item,
  play,
  balance,
  affordable,
  gateMet,
  gatePct,
  disabled,
  onBuy,
}: {
  item: RewardShopItem
  play: boolean
  balance: number
  affordable: boolean
  gateMet: boolean
  gatePct: number | null
  disabled: boolean
  onBuy: () => void
}) {
  const pointsShort = Math.max(0, item.point_cost - balance)

  return (
    <div
      data-testid={`mr-shop-item-${item.id}`}
      className={play ? 'flex flex-col items-center text-center gap-2 p-3 rounded-xl' : 'flex items-center gap-3 p-3 rounded-lg'}
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className={play ? 'w-full aspect-square rounded-lg object-cover' : 'w-10 h-10 rounded object-cover shrink-0'}
        />
      ) : item.image_asset_key ? (
        <PlatformAssetImage
          assetKey={item.image_asset_key}
          size={play ? 96 : 40}
          assetSize={128}
          variant="B"
          fallback={<Gift size={play ? 28 : 18} className="opacity-50" />}
        />
      ) : (
        <div
          className={play ? 'w-full aspect-square rounded-lg flex items-center justify-center' : 'w-10 h-10 rounded flex items-center justify-center shrink-0'}
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <Gift size={play ? 28 : 18} className="opacity-50" />
        </div>
      )}

      <div className={play ? 'w-full' : 'flex-1 min-w-0'}>
        <p className="font-medium truncate" style={{ fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
          {item.name}
        </p>
        <p className="flex items-center gap-1 justify-center-safe" style={{ fontSize: play ? 'var(--font-size-sm)' : 'var(--font-size-xs)', color: 'var(--color-btn-primary-bg)', fontWeight: 700 }}>
          <Star size={play ? 16 : 13} /> {item.point_cost}
        </p>

        {!gateMet && !play && (
          <div className="mt-1.5">
            <p className="flex items-center gap-1 mb-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <Lock size={11} /> Unlocks at {item.unlock_rule?.threshold}%+ weeks — you're at {Math.round(gatePct ?? 0)}%!
            </p>
            <div style={{ height: 6, borderRadius: 999, backgroundColor: 'var(--color-bg-tertiary)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(((gatePct ?? 0) / (item.unlock_rule?.threshold ?? 100)) * 100))}%`,
                  background: 'var(--surface-primary)',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        )}

        {gateMet && !affordable && (
          <p className="mt-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {pointsShort} more to go!
          </p>
        )}
      </div>

      <button
        type="button"
        data-testid={`mr-shop-buy-${item.id}`}
        onClick={onBuy}
        disabled={disabled || !gateMet || !affordable}
        className={play ? 'w-full' : 'shrink-0'}
        style={{
          padding: play ? '0.75rem' : '0.5rem 0.875rem',
          minHeight: play ? '56px' : '36px',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          border: 'none',
          background: !gateMet || !affordable ? 'var(--color-bg-tertiary)' : 'var(--surface-primary)',
          color: !gateMet || !affordable ? 'var(--color-text-secondary)' : 'var(--color-text-on-primary)',
          fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
          fontWeight: 700,
          cursor: disabled || !gateMet || !affordable ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {!gateMet ? 'Locked' : !affordable ? 'Not yet' : play ? 'Trade!' : 'Buy'}
      </button>
    </div>
  )
}

// ── Victories (celebration record) ──────────────────────────────────

const VICTORY_PREVIEW_COUNT = 8

function VictoriesSection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  const { data: victories = [] } = useVictories(member.id, { period: 'all' })
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<Victory | null>(null)
  const play = variant === 'play'

  const visible = showAll ? victories : victories.slice(0, VICTORY_PREVIEW_COUNT)

  return (
    <SectionCard
      title="My Victories"
      icon={<PartyPopper size={play ? 24 : 18} />}
      testId="mr-section-victories"
      play={play}
    >
      {victories.length === 0 ? (
        <p
          className="text-sm py-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Your victories will show up here — every win counts!
        </p>
      ) : (
        <div className="space-y-1.5">
          {visible.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelected(v)}
              className="w-full flex items-center gap-3 rounded-lg text-left"
              style={{
                padding: play ? '0.875rem' : '0.625rem 0.75rem',
                minHeight: play ? '56px' : '44px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <PartyPopper
                size={play ? 22 : 16}
                style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }}
              />
              <span
                className="flex-1 min-w-0 truncate"
                style={{
                  fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {v.description}
              </span>
              <span
                className="shrink-0"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {new Date(v.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}

          {victories.length > VICTORY_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium"
              style={{
                color: 'var(--color-btn-primary-bg)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem 0',
              }}
            >
              {showAll ? 'Show fewer' : `Show all (${victories.length})`}
            </button>
          )}
        </div>
      )}

      {selected && (
        <CelebrationDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          victory={selected}
        />
      )}
    </SectionCard>
  )
}

// ── Finances (ONE owed number — Convention #271) ────────────────────

function FinancesSection({
  member,
  variant,
}: {
  member: FamilyMember
  variant: 'standard' | 'play'
}) {
  // SAME source as the Balance page (useRunningBalance →
  // calculate_running_balance RPC). The owed number and the Balance page can
  // never disagree because they are the same query — Convention #271.
  const { data: balance = 0 } = useRunningBalance(member.id)
  const { data: pools = [] } = useMemberAllowancePools(member.id)
  const [showDetails, setShowDetails] = useState(false)
  const play = variant === 'play'

  const amount = Number(balance)

  return (
    <SectionCard title="My Money" icon={<Wallet size={play ? 24 : 18} />} testId="mr-section-finances" play={play}>
      <div className="space-y-3">
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Money owed to you
          </p>
          <p
            data-testid="my-rewards-owed"
            data-amount={amount.toFixed(2)}
            style={{
              fontSize: play ? '2.5rem' : '2rem',
              fontWeight: 800,
              color: 'var(--color-text-heading)',
              lineHeight: 1.2,
            }}
          >
            ${amount.toFixed(2)}
          </p>
        </div>

        <button
          type="button"
          data-testid="mr-finances-details"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{
            color: 'var(--color-btn-primary-bg)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            minHeight: play ? '56px' : undefined,
          }}
        >
          {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {showDetails ? 'Hide the details' : 'See the details'}
        </button>

        {showDetails && (
          <div
            className="pt-2"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {/* Mom turned this section on — money is intentionally visible
                here, so the breakdown shows dollar amounts too (Q1: one
                switch of intent; the surfaces never disagree). */}
            <LedgerView
              mode="self"
              familyId={member.family_id}
              memberId={member.id}
              hideMoney={false}
              pools={pools.map(p => ({ pool_name: p.pool_name }))}
            />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
