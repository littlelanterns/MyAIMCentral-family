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
 * Creatures + Coloring sections ship in Slice 3; Propose-a-Reward in Slice 4.
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
  Flame,
  Gift,
  History,
  PartyPopper,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useMyRewardsSettings } from '@/hooks/useMyRewardsSettings'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useRunningBalance, useMemberAllowancePools } from '@/hooks/useFinancial'
import { useEarnedPrizes } from '@/hooks/useRewardReveals'
import { useVictories } from '@/hooks/useVictories'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { PrizeBox } from '@/components/reward-reveals/PrizeBox'
import { RedeemedHistoryModal } from './RedeemedHistoryModal'
import { CelebrationDetailModal } from '@/components/victories/CelebrationDetailModal'
import { CreaturePageFrame } from './CreaturePageFrame'
import { ColoringSection } from './ColoringSection'
import { LedgerView } from '@/features/financial/LedgerView'
import type { Victory } from '@/types/victories'

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

      {sections.victories && (
        <VictoriesSection member={member} variant={variant} />
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
    | (FamilyMember & { gamification_points?: number; current_streak?: number })
    | undefined

  const points = row?.gamification_points ?? 0
  const streak = row?.current_streak ?? 0
  // Per-child currency name — never hardcode (PRD-24 / recon binding rule).
  const currencyName = config?.currency_name?.trim() || 'points'
  const play = variant === 'play'

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
