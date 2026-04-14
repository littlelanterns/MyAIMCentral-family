/**
 * OpportunityListBrowse — kid-facing browse + claim UI for opportunity lists.
 *
 * Shows available items with reward badges, availability status, and "I'll do this!" button.
 * Used on the Opportunities tab in Tasks.tsx and in list detail view.
 */

import { useState } from 'react'
import { Star, DollarSign, Award, Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import type { List, ListItem, OpportunitySubtype, OpportunityRewardType } from '@/types/lists'
import { useClaimOpportunityItem, canClaimItem } from '@/hooks/useOpportunityLists'
import { Tooltip } from '@/components/shared'

interface OpportunityListBrowseProps {
  list: List
  items: ListItem[]
  memberId: string
  familyId: string
  createdBy: string
  /** Compact mode for embedding inside the Opportunities tab (no header) */
  compact?: boolean
}

export function OpportunityListBrowse({
  list,
  items,
  memberId,
  familyId,
  createdBy,
}: OpportunityListBrowseProps) {
  const claimItem = useClaimOpportunityItem()
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  async function handleClaim(item: ListItem) {
    setClaimingItemId(item.id)
    setClaimError(null)

    try {
      await claimItem.mutateAsync({
        listItem: item,
        list,
        memberId,
        familyId,
        createdBy,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed'
      if (msg === 'ITEM_ALREADY_CLAIMED') {
        setClaimError('Someone already claimed this!')
      } else if (msg === 'COOLDOWN_ACTIVE') {
        setClaimError('You need to wait before claiming this again')
      } else {
        setClaimError(msg)
      }
    } finally {
      setClaimingItemId(null)
    }
  }

  const availableItems = items.filter(i => i.is_available)
  const completedItems = items.filter(i => !i.is_available)

  if (availableItems.length === 0 && completedItems.length === 0) {
    return (
      <div className="text-center py-6">
        <Star size={24} style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          No opportunities available right now
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {claimError && (
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-bg-card))',
            color: 'var(--color-danger)',
            border: '1px solid var(--color-danger)',
          }}
        >
          {claimError}
        </div>
      )}

      {/* Available items */}
      {availableItems.map(item => (
        <OpportunityItemCard
          key={item.id}
          item={item}
          list={list}
          memberId={memberId}
          isClaiming={claimingItemId === item.id}
          onClaim={() => handleClaim(item)}
        />
      ))}

      {/* Completed items (collapsed) */}
      {completedItems.length > 0 && (
        <CompletedItemsSection items={completedItems} />
      )}
    </div>
  )
}

// ── Individual item card ──────────────────────────────────

function OpportunityItemCard({
  item,
  list,
  memberId,
  isClaiming,
  onClaim,
}: {
  item: ListItem
  list: List
  memberId: string
  isClaiming: boolean
  onClaim: () => void
}) {
  const subtype = item.opportunity_subtype ?? list.default_opportunity_subtype ?? 'one_time'
  const rewardType = item.reward_type ?? list.default_reward_type
  const rewardAmount = item.reward_amount ?? list.default_reward_amount

  const { canClaim, reason } = canClaimItem(item, list, memberId)

  return (
    <div
      className="rounded-xl p-3 space-y-2 transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {item.content || item.item_name}
          </p>
          {item.notes && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {item.notes}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Reward badge */}
            {rewardType && rewardAmount != null && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, var(--color-bg-card))',
                  color: 'var(--color-success)',
                }}
              >
                {rewardType === 'money' && <DollarSign size={10} />}
                {rewardType === 'points' && <Star size={10} />}
                {rewardType === 'privilege' && <Award size={10} />}
                {formatReward(rewardType, rewardAmount)}
              </span>
            )}

            {/* Subtype badge */}
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {subtypeLabel(subtype as OpportunitySubtype)}
            </span>

            {/* Mastery indicator */}
            {item.advancement_mode === 'mastery' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                  color: 'var(--color-btn-primary-bg)',
                }}
              >
                Mastery
              </span>
            )}

            {/* Practice progress */}
            {item.advancement_mode === 'practice_count' && item.practice_target && (
              <span
                className="text-[10px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {item.practice_count}/{item.practice_target} practices
              </span>
            )}
          </div>
        </div>

        {/* Right: claim button */}
        <div className="flex-shrink-0">
          {canClaim ? (
            <button
              onClick={onClaim}
              disabled={isClaiming}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {isClaiming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "I'll do this!"
              )}
            </button>
          ) : (
            <Tooltip content={reason ?? 'Not available'}>
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Claimed
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Completed items collapsed section ─────────────────────

function CompletedItemsSection({ items }: { items: ListItem[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs py-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Check size={12} />
        {items.length} completed
      </button>
      {expanded && (
        <div className="space-y-1 mt-1 pl-5">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 py-1 opacity-60"
            >
              <Check size={12} style={{ color: 'var(--color-success)' }} />
              <span className="text-xs line-through" style={{ color: 'var(--color-text-secondary)' }}>
                {item.content || item.item_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────

function subtypeLabel(subtype: OpportunitySubtype): string {
  switch (subtype) {
    case 'one_time': return 'One-time'
    case 'claimable': return 'Claimable'
    case 'repeatable': return 'Repeatable'
    default: return subtype
  }
}

function formatReward(type: OpportunityRewardType, amount: number): string {
  switch (type) {
    case 'money': return `$${amount.toFixed(2)}`
    case 'points': return `${amount} pts`
    case 'privilege': return 'Privilege'
    case 'custom': return `${amount}`
    default: return `${amount}`
  }
}
