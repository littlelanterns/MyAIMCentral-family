/**
 * OpportunityListBrowse — kid-facing browse + claim UI for opportunity lists.
 *
 * Shows available items with reward badges, availability status, and "I'll do this!" button.
 * Used on the Opportunities tab in Tasks.tsx and in list detail view.
 */

import { useState } from 'react'
import { Star, DollarSign, Award, Check, Loader2, ChevronDown, ChevronRight, ExternalLink, Clock, Zap, Layers, Sparkles, CircleDot } from 'lucide-react'
import type { List, ListItem, OpportunitySubtype, OpportunityRewardType } from '@/types/lists'
import { useClaimOpportunityItem, canClaimItem } from '@/hooks/useOpportunityLists'
import { useListItemClaimStatus, type ClaimStatusEntry } from '@/hooks/useListItemClaimStatus'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
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

  const { data: claimStatusMap = {} } = useListItemClaimStatus(list.id)
  const { data: members = [] } = useFamilyMembers(familyId)

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
          claimStatus={claimStatusMap[item.id]}
          members={members}
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

interface FamilyMember {
  id: string
  display_name: string
  assigned_color?: string | null
  member_color?: string | null
}

function OpportunityItemCard({
  item,
  list,
  memberId,
  isClaiming,
  onClaim,
  claimStatus,
  members,
}: {
  item: ListItem
  list: List
  memberId: string
  isClaiming: boolean
  onClaim: () => void
  claimStatus?: ClaimStatusEntry
  members: FamilyMember[]
}) {
  const subtype = item.opportunity_subtype ?? list.default_opportunity_subtype ?? 'one_time'
  const rewardType = item.reward_type ?? list.default_reward_type
  const rewardAmount = item.reward_amount ?? list.default_reward_amount

  const hasItemSpecificReward = item.reward_amount != null && item.reward_amount !== list.default_reward_amount
  const showReward = hasItemSpecificReward
    ? (item.reward_type ?? list.default_reward_type) != null && item.reward_amount != null
    : rewardType != null && rewardAmount != null

  const { canClaim, reason } = canClaimItem(item, list, memberId)

  const isClaimed = !!claimStatus
  const isClaimedByOther = isClaimed && claimStatus.claimerMemberId !== memberId
  const claimerMember = isClaimed
    ? members.find(m => m.id === claimStatus.claimerMemberId)
    : undefined
  const claimerColor = claimerMember ? getMemberColor(claimerMember) : undefined

  const isRepeatable = subtype === 'repeatable'
  const disableButton = isClaimed && !isRepeatable

  return (
    <div
      className="rounded-xl p-3 space-y-2 transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${isClaimed ? (claimerColor ?? 'var(--color-border)') : 'var(--color-border)'}`,
        opacity: isClaimedByOther && !isRepeatable ? 0.75 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              {item.content || item.item_name}
            </p>
            {item.resource_url && (
              <a
                href={item.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                title="Open instructions"
              >
                <ExternalLink size={12} style={{ color: 'var(--color-btn-primary-bg)' }} />
              </a>
            )}
          </div>
          {item.notes && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {item.notes}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Per-item reward badge (show when item-specific or as fallback) */}
            {showReward && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, var(--color-bg-card))',
                  color: 'var(--color-success)',
                }}
              >
                {(rewardType === 'money') && <DollarSign size={10} />}
                {(rewardType === 'points') && <Star size={10} />}
                {(rewardType === 'privilege') && <Award size={10} />}
                {formatReward(rewardType!, rewardAmount!)}
              </span>
            )}

            {/* Category badge */}
            {item.category && (
              <CategoryBadge category={item.category} />
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

            {/* Cooldown indicator */}
            {item.cooldown_hours != null && (
              <CooldownBadge item={item} />
            )}

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

          {/* Claim status indicator */}
          {isClaimed && claimerMember && (
            <div
              className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium"
              style={{ color: claimerColor }}
            >
              <CircleDot size={10} />
              <span>
                {claimStatus.claimerMemberId === memberId
                  ? "You're working on this"
                  : `${claimerMember.display_name} is working on this`}
              </span>
              {claimStatus.status === 'pending_approval' && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px]"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, var(--color-bg-card))',
                    color: 'var(--color-warning)',
                  }}
                >
                  Pending approval
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: claim button */}
        <div className="flex-shrink-0">
          {canClaim && !disableButton ? (
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
            <Tooltip content={disableButton ? `${claimerMember?.display_name ?? 'Someone'} claimed this` : (reason ?? 'Not available')}>
              <span
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {isClaimed ? 'Claimed' : 'Unavailable'}
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Category badge ──────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Zap }> = {
  quick: { label: 'Quick', icon: Zap },
  medium: { label: 'Medium', icon: Layers },
  big: { label: 'Big', icon: Sparkles },
  connection: { label: 'Connection', icon: Star },
}

function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category]
  if (!config) return null

  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card))',
        color: 'var(--color-accent)',
      }}
    >
      <Icon size={9} />
      {config.label}
    </span>
  )
}

// ── Cooldown badge ──────────────────────────────────────────

function CooldownBadge({ item }: { item: ListItem }) {
  const cooldownHours = item.cooldown_hours!
  const lastCompleted = item.last_completed_at
    ? new Date(item.last_completed_at).getTime()
    : null

  if (lastCompleted) {
    const cooldownEnd = lastCompleted + cooldownHours * 60 * 60 * 1000
    const now = Date.now()
    if (now < cooldownEnd) {
      const hoursLeft = Math.ceil((cooldownEnd - now) / (60 * 60 * 1000))
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 12%, var(--color-bg-card))',
            color: 'var(--color-warning)',
          }}
        >
          <Clock size={9} />
          {hoursLeft}h until available
        </span>
      )
    }
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      <Clock size={9} />
      {cooldownHours}h cooldown
    </span>
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
