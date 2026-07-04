/**
 * PlayOpportunitySection — OPPORTUNITY-SURFACES scope (c), founder-approved 2026-07-02
 *
 * Play kids' first opportunity surface: boards they're eligible for render as
 * banner + big tap-to-claim tiles directly on the PlayDashboard.
 *
 * Design rules (per the approved mini pre-build summary):
 *   - Only claimable-RIGHT-NOW items show (canClaimItem true + not actively
 *     claimed by anyone). Cooldowns, sibling claims, and consumed items are
 *     simply invisible — no status complexity for pre-readers.
 *   - The whole section disappears when there's nothing to offer.
 *   - Tile imagery follows the Build M platform-asset pattern (auto-matched
 *     paper-craft icons via usePlayTaskIcons tag matching against the item
 *     name). Lucide is chrome only (banner Star, reward badges).
 *   - Tap → big friendly confirm → useClaimOpportunityItem (the same
 *     claim→task bridge every other shell uses) → the bridge task appears in
 *     the kid's task grid. A stray tap must never lock a job away from
 *     siblings, hence the confirm step.
 *   - View As: memberId is the kid, createdBy is the real viewer.
 *   - MONEY amounts are hidden by default and gated on the SAME per-kid
 *     money opt-in as the Fun page (Slice 2 founder amendment —
 *     my_rewards_sections.finances, Play default OFF). One switch of intent,
 *     the two surfaces never disagree. Stars aren't money — always shown.
 *     (Founder ruling 2026-07-02.)
 */

import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import {
  useOpportunityLists,
  useOpportunityItems,
  useClaimOpportunityItem,
  canClaimItem,
} from '@/hooks/useOpportunityLists'
import { useListItemClaimStatus } from '@/hooks/useListItemClaimStatus'
import { useCalendarSettings } from '@/hooks/useCalendarEvents'
import { usePlayTaskIcons } from '@/hooks/usePlayTaskIcons'
import { useMyRewardsSettings } from '@/hooks/useMyRewardsSettings'
import type { List, ListItem } from '@/types/lists'
import type { Task } from '@/types/tasks'

interface PlayOpportunitySectionProps {
  familyId: string
  memberId: string
  /** Real viewer id — differs from memberId inside View As */
  createdBy: string
}

export function PlayOpportunitySection({ familyId, memberId, createdBy }: PlayOpportunitySectionProps) {
  // Eligibility-scoped: eligible_members null/empty = everyone, else must
  // contain this kid (same rule as every other shell).
  const { data: boards = [] } = useOpportunityLists(familyId, memberId)
  // Money visibility rides the SAME per-kid opt-in as the Fun page money
  // section (Play default OFF; mom flips my_rewards_sections.finances).
  const { data: rewardsSettings } = useMyRewardsSettings(memberId)
  const showMoney = rewardsSettings?.sections.finances === true

  if (boards.length === 0) return null

  return (
    <>
      {boards.map(board => (
        <PlayOpportunityBoard
          key={board.id}
          board={board}
          familyId={familyId}
          memberId={memberId}
          createdBy={createdBy}
          showMoney={showMoney}
        />
      ))}
    </>
  )
}

// ── One board: banner + claimable tiles ──────────────────────────────────────

function PlayOpportunityBoard({
  board,
  familyId,
  memberId,
  createdBy,
  showMoney,
}: {
  board: List
  familyId: string
  memberId: string
  createdBy: string
  /** Per-kid money opt-in (Slice 2 switch) — dollar amounts hidden when false */
  showMoney: boolean
}) {
  const { data: items = [] } = useOpportunityItems(board.id)
  const { data: claimStatusMap = {} } = useListItemClaimStatus(board.id)
  const { data: calSettings } = useCalendarSettings()
  const claimItem = useClaimOpportunityItem()

  const [confirmItem, setConfirmItem] = useState<ListItem | null>(null)
  const [phase, setPhase] = useState<'confirm' | 'claiming' | 'success' | 'error'>('confirm')
  const [errorMsg, setErrorMsg] = useState('')

  // Claimable RIGHT NOW: available, passes claim rules, not held by anyone
  const claimable = useMemo(
    () =>
      items.filter(
        i =>
          !claimStatusMap[i.id] &&
          canClaimItem(i, board, memberId, {
            choreCycleStartDay: calSettings?.chore_cycle_start_day ?? null,
            weekStartDay: calSettings?.week_start_day ?? 0,
          }).canClaim,
      ),
    [items, claimStatusMap, board, memberId, calSettings],
  )

  // Icon resolution: shim items through the existing batch tag-matcher —
  // it only reads id/title/icon fields, so a minimal pseudo-task suffices.
  const iconTasks = useMemo(
    () =>
      claimable.map(
        i =>
          ({
            id: i.id,
            title: i.content || i.item_name || 'Job',
            icon_asset_key: null,
            icon_variant: null,
            life_area_tags: i.life_area_tags ?? null,
            life_area_tag: null,
          }) as unknown as Task,
      ),
    [claimable],
  )
  const { iconUrls } = usePlayTaskIcons(iconTasks)

  if (claimable.length === 0) return null

  const closeConfirm = () => {
    setConfirmItem(null)
    setPhase('confirm')
    setErrorMsg('')
  }

  async function handleYes() {
    if (!confirmItem) return
    setPhase('claiming')
    try {
      await claimItem.mutateAsync({
        listItem: confirmItem,
        list: board,
        memberId,
        familyId,
        createdBy,
      })
      setPhase('success')
      setTimeout(closeConfirm, 1800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setErrorMsg(
        msg === 'ITEM_ALREADY_CLAIMED'
          ? 'Someone got it first!'
          : msg === 'COOLDOWN_ACTIVE'
            ? 'Not ready yet — try again later!'
            : "That didn't work. Ask a grown-up!",
      )
      setPhase('error')
    }
  }

  return (
    <section data-testid={`play-opp-board-${board.id}`}>
      {/* Board banner — segment-banner styling, Star is chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          borderRadius: 'var(--vibe-radius-card, 0.75rem) var(--vibe-radius-card, 0.75rem) 0 0',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
        }}
      >
        <span style={{ color: 'var(--color-warning, var(--color-btn-primary-bg))', display: 'inline-flex', flexShrink: 0 }}>
          <Star size={20} />
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            flex: 1,
          }}
        >
          {board.title}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {claimable.length} to pick from
        </span>
      </div>

      {/* Claimable tiles */}
      <div
        style={{
          padding: '0.75rem',
          borderRadius: '0 0 var(--vibe-radius-card, 0.75rem) var(--vibe-radius-card, 0.75rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderTop: 'none',
        }}
      >
        <div className="play-tile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
          {claimable.map(item => (
            <PlayOpportunityTile
              key={item.id}
              item={item}
              board={board}
              iconUrl={iconUrls[item.id] ?? null}
              showMoney={showMoney}
              onTap={() => {
                setPhase('confirm')
                setErrorMsg('')
                setConfirmItem(item)
              }}
            />
          ))}
        </div>
      </div>

      {/* Tap-to-claim confirm overlay */}
      {confirmItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Claim this job?"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 45%, transparent)',
          }}
          onClick={phase === 'claiming' ? undefined : closeConfirm}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: 'var(--vibe-radius-card, 1rem)',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            {phase === 'success' ? (
              <>
                <span
                  role="status"
                  style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}
                >
                  It&apos;s yours!
                </span>
                <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' }}>
                  Look in your list!
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Want to do this job?
                </span>
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {confirmItem.content || confirmItem.item_name}
                </span>
                {formatPlayReward(confirmItem, board, showMoney) && (
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-success, var(--color-text-secondary))' }}>
                    {formatPlayReward(confirmItem, board, showMoney)}
                  </span>
                )}
                {phase === 'error' && (
                  <span role="alert" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger, var(--color-text-secondary))' }}>
                    {errorMsg}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <button
                    type="button"
                    data-testid="play-opp-claim-no"
                    onClick={closeConfirm}
                    disabled={phase === 'claiming'}
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: 'var(--vibe-radius-input, 0.75rem)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Not now
                  </button>
                  <button
                    type="button"
                    data-testid="play-opp-claim-yes"
                    onClick={handleYes}
                    disabled={phase === 'claiming'}
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: 'var(--vibe-radius-input, 0.75rem)',
                      background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                      color: 'var(--color-btn-primary-text)',
                      border: 'none',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: phase === 'claiming' ? 0.6 : 1,
                    }}
                  >
                    {phase === 'claiming' ? 'One sec…' : 'Yes!'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Tile ──────────────────────────────────────────────────────────────────────

function PlayOpportunityTile({
  item,
  board,
  iconUrl,
  showMoney,
  onTap,
}: {
  item: ListItem
  board: List
  iconUrl: string | null
  showMoney: boolean
  onTap: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const title = item.content || item.item_name || 'Job'
  const reward = formatPlayReward(item, board, showMoney)

  return (
    <button
      type="button"
      data-testid={`play-opp-tile-${item.id}`}
      onClick={onTap}
      aria-label={`${title}${reward ? ` — ${reward}` : ''}`}
      className="play-task-tile"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '0.5rem',
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
        cursor: 'pointer',
        minHeight: '140px',
        transition: 'transform 0.15s ease',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--vibe-radius-card, 0.75rem)',
          backgroundColor: 'var(--color-bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {iconUrl && !imageFailed ? (
          <img
            src={iconUrl}
            alt=""
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            loading="lazy"
          />
        ) : (
          <span
            style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0.25rem' }}
            aria-hidden="true"
          >
            Job
          </span>
        )}
      </div>

      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '100%',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: reward ? 1 : 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {title}
      </span>

      {reward && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--color-success, var(--color-text-secondary))',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {reward}
        </span>
      )}
    </button>
  )
}

// ── Reward copy ───────────────────────────────────────────────────────────────

function formatPlayReward(item: ListItem, board: List, showMoney: boolean): string | null {
  const rewardType = item.reward_type ?? board.default_reward_type
  const rewardAmount = item.reward_amount ?? board.default_reward_amount
  if (!rewardType) return null
  switch (rewardType) {
    case 'money':
      // Dollar amounts ride the per-kid money opt-in (Slice 2 switch, Play
      // default OFF). Stars aren't money — always shown.
      return showMoney && rewardAmount != null ? `Earn $${rewardAmount.toFixed(2)}` : null
    case 'points':
      return rewardAmount != null ? `Earn ${rewardAmount} stars` : null
    case 'privilege':
    case 'custom':
      return 'Special prize!'
    default:
      return null
  }
}
