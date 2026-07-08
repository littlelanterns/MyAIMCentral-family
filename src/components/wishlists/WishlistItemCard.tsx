// PRD-43 WishLists — image-forward item card shared across shell renders.
// dnd-kit ⠿ handle for reorder (universal drag-to-reorder convention).

import { Gift, Heart, GripVertical, Clock } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ListItem } from '@/types/lists'

const PRIORITY_LABEL: Record<string, string> = {
  must_have: 'Must-Have',
  would_love: 'Would Love',
  nice_to_have: 'Nice to Have',
}

interface WishlistItemCardProps {
  item: ListItem
  addedByName?: string | null
  claimIndicator?: 'reserved' | 'purchased' | 'given' | null
  claimLabel?: string | null
  showPrice?: boolean
  showBalanceDistance?: string | null
  onTap: () => void
  onToggleHeart?: () => void
  draggable?: boolean
  dense?: boolean
}

export function WishlistItemCard({
  item, addedByName, claimIndicator, claimLabel, showPrice = true, showBalanceDistance,
  onTap, onToggleHeart, draggable = false, dense = false,
}: WishlistItemCardProps) {
  const sortable = useSortable({ id: item.id, disabled: !draggable })
  const style = draggable
    ? { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }
    : undefined

  return (
    <div
      ref={draggable ? sortable.setNodeRef : undefined}
      style={{
        ...style,
        display: 'flex', gap: '0.75rem', padding: dense ? '0.5rem' : '0.75rem',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        background: 'var(--color-bg-card, #fff)',
        border: '1px solid var(--color-border, #eee)',
        opacity: item.wishlist_state === 'dormant' ? 0.6 : 1,
      }}
    >
      {draggable && (
        <button
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label="Drag to reorder"
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'grab', touchAction: 'none', padding: 0, alignSelf: 'center' }}
        >
          <GripVertical size={16} />
        </button>
      )}

      <button
        onClick={onTap}
        style={{
          width: dense ? '3rem' : '4rem', height: dense ? '3rem' : '4rem', flexShrink: 0,
          borderRadius: 'var(--vibe-radius-input, 8px)', overflow: 'hidden', border: 'none',
          background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        {item.image_url
          ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Gift size={20} style={{ color: 'var(--color-text-muted)' }} />}
      </button>

      <button onClick={onTap} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minWidth: 0 }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.content}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
          {showPrice && item.price != null && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              {item.currency ?? 'USD'} {item.price.toFixed(2)}
            </span>
          )}
          {showBalanceDistance && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent)' }}>{showBalanceDistance}</span>
          )}
          {item.priority && PRIORITY_LABEL[item.priority] && (
            <span
              style={{
                fontSize: '0.6875rem', padding: '0.0625rem 0.375rem', borderRadius: '999px',
                background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
              }}
            >
              {PRIORITY_LABEL[item.priority]}
            </span>
          )}
          {item.wishlist_state === 'dormant' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={11} /> Maybe later
            </span>
          )}
        </div>
        {addedByName && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {addedByName} added this
          </p>
        )}
        {claimIndicator && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '0.125rem', fontWeight: 500 }}>
            {claimIndicator === 'reserved' && 'Reserved'}
            {claimIndicator === 'purchased' && 'Purchased'}
            {claimIndicator === 'given' && 'Given'}
            {claimLabel ? ` — ${claimLabel}` : ''}
          </p>
        )}
      </button>

      {onToggleHeart && (
        <button
          onClick={onToggleHeart}
          aria-label={item.is_included_in_ai ? 'Remove from LiLa context' : 'Include in LiLa context'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: '0.125rem' }}
        >
          <Heart
            size={16}
            fill={item.is_included_in_ai ? 'var(--color-accent)' : 'none'}
            style={{ color: 'var(--color-accent)' }}
          />
        </button>
      )}
    </div>
  )
}
