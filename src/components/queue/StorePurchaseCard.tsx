/**
 * StorePurchaseCard — PRD-24 Point Economy Addendum §6.3.
 *
 * A pending Reward Shop purchase rendered inside the Queue RequestsTab
 * (Convention #66 one-inbox rule — own table, own card, exactly like
 * ProposalCard/reward_proposals: reward_shop_purchases has no place in
 * family_requests, same reasoning as R3).
 *
 * Kid avatar + name, item image + name, cost, kid's balance after,
 * [Approve] [Not this time + note].
 */

import { useState } from 'react'
import { Check, ChevronDown, Gift, User } from 'lucide-react'
import { getMemberColor } from '@/lib/memberColors'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import type { RewardShopPurchase } from '@/types/reward-shop'

interface StorePurchaseCardProps {
  purchase: RewardShopPurchase
  member: { display_name: string; avatar_url?: string | null; assigned_color?: string | null; member_color?: string | null; gamification_points?: number | null } | undefined
  itemImageUrl?: string | null
  itemImageAssetKey?: string | null
  onApprove: (purchase: RewardShopPurchase) => void
  onDecline: (purchase: RewardShopPurchase, note?: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const actionButtonBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--vibe-radius-input, 8px)',
  border: 'none',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
}

export function StorePurchaseCard({
  purchase,
  member,
  itemImageUrl,
  itemImageAssetKey,
  onApprove,
  onDecline,
}: StorePurchaseCardProps) {
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const avatarColor = getMemberColor(member ?? {})
  const balanceAfter = (member?.gamification_points ?? 0) - purchase.points_cost

  return (
    <div
      data-testid="store-purchase-card"
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 30%, var(--color-border))',
        background: 'var(--color-bg-card)',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%', background: avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {member?.avatar_url ? (
            <img src={member.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <User size={14} style={{ color: 'var(--color-text-on-primary, #fff)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            {member?.display_name ?? 'Family Member'}
          </span>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem',
              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-btn-primary-bg)',
            }}
          >
            <Gift size={12} /> Wants to buy from the Reward Shop
          </span>
        </div>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {timeAgo(purchase.created_at)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {itemImageUrl ? (
          <img
            src={itemImageUrl}
            alt=""
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--vibe-radius-card, 8px)', border: '1px solid var(--color-border)', flexShrink: 0 }}
          />
        ) : itemImageAssetKey ? (
          <PlatformAssetImage assetKey={itemImageAssetKey} size={48} assetSize={128} variant="B" fallback={null} />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-heading)' }}>
            {purchase.item_name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            {purchase.points_cost} points — {balanceAfter} left after
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
        <button
          data-testid="store-purchase-approve"
          onClick={() => onApprove(purchase)}
          style={{ ...actionButtonBase, background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))', color: 'var(--color-btn-primary-bg)' }}
        >
          <Check size={14} /> Approve
        </button>

        <div style={{ position: 'relative' }}>
          <button
            data-testid="store-purchase-decline-open"
            onClick={() => setDeclineOpen(!declineOpen)}
            style={{ ...actionButtonBase, background: 'color-mix(in srgb, var(--color-btn-primary-hover) 8%, var(--color-bg-card))', color: 'var(--color-text-secondary)' }}
          >
            Not this time <ChevronDown size={14} />
          </button>
          {declineOpen && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '0.25rem',
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                zIndex: 10, minWidth: '220px', padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Decline with note (points refund automatically):
              </div>
              <textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Optional: a kind word about why"
                rows={2}
                style={{
                  width: '100%', padding: '0.5rem', borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg-input, var(--color-bg-card))',
                  color: 'var(--color-text-primary)', fontSize: '0.8125rem', resize: 'none', outline: 'none', marginBottom: '0.5rem',
                }}
              />
              <button
                data-testid="store-purchase-decline-confirm"
                onClick={() => {
                  setDeclineOpen(false)
                  onDecline(purchase, declineNote.trim() || undefined)
                  setDeclineNote('')
                }}
                style={{ ...actionButtonBase, width: '100%', background: 'color-mix(in srgb, var(--color-btn-primary-hover) 12%, var(--color-bg-card))', color: 'var(--color-text-primary)' }}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
