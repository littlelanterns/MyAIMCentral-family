// PRD-43 WishLists §6.3 — item detail / refine sheet. Photo, title, notes,
// price+currency, URL+domain chip, occasion tags, priority, Heart,
// exclude-from-shares (mom/adult only), state controls, attribution.

import { useState, useEffect } from 'react'
import { Heart, EyeOff, Clock, RotateCcw, Trash2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useUpdateWishlistItem, useSetWishlistItemState } from '@/hooks/useWishlists'
import { SUGGESTED_OCCASIONS } from '@/types/wishlists'
import type { ListItem, ListItemPriority } from '@/types/lists'

const PRIORITY_OPTIONS: { key: ListItemPriority; label: string }[] = [
  { key: 'must_have', label: 'Must-Have' },
  { key: 'would_love', label: 'Would Love' },
  { key: 'nice_to_have', label: 'Nice to Have' },
]

interface WishlistItemDetailSheetProps {
  item: ListItem | null
  familyId: string
  memberId: string
  isOpen: boolean
  onClose: () => void
  addedByName?: string | null
  /** Mom/adult refine controls (exclude-from-shares) — false for the kid's own view. */
  canManageSharing?: boolean
  onDelete?: (item: ListItem) => void
  /** Extra actions injected by the caller (motivation bridge, Consider for gift, etc.) — Phase B/A3 slots. */
  extraActions?: React.ReactNode
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--vibe-radius-input, 8px)',
    border: '1px solid var(--color-border, #ddd)', background: 'var(--color-bg-input, var(--color-bg-card))',
    color: 'var(--color-text-primary)', fontSize: '0.9375rem', outline: 'none',
  }
}

function labelStyle(): React.CSSProperties {
  return { display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }
}

export function WishlistItemDetailSheet({
  item, familyId, memberId, isOpen, onClose, addedByName, canManageSharing = false, onDelete, extraActions,
}: WishlistItemDetailSheetProps) {
  const update = useUpdateWishlistItem()
  const setState = useSetWishlistItemState()

  const [content, setContent] = useState('')
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [occasionTags, setOccasionTags] = useState<string[]>([])

  useEffect(() => {
    if (item) {
      setContent(item.content)
      setNotes(item.notes ?? '')
      setPrice(item.price != null ? String(item.price) : '')
      setResourceUrl(item.resource_url ?? '')
      setOccasionTags(item.occasion_tags ?? [])
    }
  }, [item])

  if (!item) return null

  const domain = (() => {
    if (!resourceUrl) return null
    try { return new URL(resourceUrl).hostname.replace(/^www\./, '') } catch { return null }
  })()

  function toggleOccasion(tag: string) {
    setOccasionTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleSave() {
    if (!item) return
    await update.mutateAsync({
      id: item.id,
      familyId,
      memberId,
      content: content.trim() || item.content,
      notes: notes.trim() || null,
      price: price.trim() ? Number(price) : null,
      resource_url: resourceUrl.trim() || null,
      occasion_tags: occasionTags,
    })
    onClose()
  }

  async function handleToggleHeart() {
    if (!item) return
    await update.mutateAsync({ id: item.id, familyId, memberId, is_included_in_ai: !item.is_included_in_ai })
  }

  async function handleToggleExcludeFromShares() {
    if (!item) return
    await update.mutateAsync({ id: item.id, familyId, memberId, excluded_from_shares: !item.excluded_from_shares })
  }

  async function handleSetPriority(priority: ListItemPriority) {
    if (!item) return
    await update.mutateAsync({ id: item.id, familyId, memberId, priority: item.priority === priority ? null : priority })
  }

  async function handleToggleDormant() {
    if (!item) return
    await setState.mutateAsync({ id: item.id, familyId, memberId, state: item.wishlist_state === 'dormant' ? 'active' : 'dormant' })
    onClose()
  }

  return (
    <ModalV2
      id="wishlist-item-detail"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Wish Details"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
          <button
            onClick={handleToggleDormant}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: 'var(--vibe-radius-input, 8px)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {item.wishlist_state === 'dormant' ? <RotateCcw size={14} /> : <Clock size={14} />}
            {item.wishlist_state === 'dormant' ? 'Still want it' : 'Changed my mind'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onDelete && (
              <button
                onClick={() => onDelete(item)}
                aria-label="Delete"
                style={{ padding: '0.5rem', borderRadius: 'var(--vibe-radius-input, 8px)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-error, #e05d5d)', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--vibe-radius-input, 8px)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={update.isPending}
              style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--vibe-radius-input, 8px)', border: 'none', background: 'var(--surface-primary, var(--color-btn-primary-bg))', color: 'var(--color-text-on-primary, #fff)', fontWeight: 600, cursor: 'pointer' }}
            >
              {update.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        {item.image_url && (
          <img src={item.image_url} alt="" style={{ width: '100%', maxHeight: '12rem', objectFit: 'cover', borderRadius: 'var(--vibe-radius-card, 12px)' }} />
        )}

        <div>
          <label style={labelStyle()}>What is it?</label>
          <input type="text" value={content} onChange={(e) => setContent(e.target.value)} style={inputStyle()} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle()}>Price</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" style={inputStyle()} />
          </div>
        </div>

        <div>
          <label style={labelStyle()}>Link {domain && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({domain})</span>}</label>
          <input type="url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." style={inputStyle()} />
        </div>

        <div>
          <label style={labelStyle()}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle(), resize: 'vertical' }} />
        </div>

        <div>
          <label style={labelStyle()}>Occasion</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {SUGGESTED_OCCASIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleOccasion(tag)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem', cursor: 'pointer',
                  border: `1px solid ${occasionTags.includes(tag) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: occasionTags.includes(tag) ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                  color: occasionTags.includes(tag) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle()}>Priority</label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => void handleSetPriority(opt.key)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--vibe-radius-input, 8px)', fontSize: '0.8125rem', cursor: 'pointer',
                  border: `1px solid ${item.priority === opt.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: item.priority === opt.key ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                  color: item.priority === opt.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Let LiLa know about this</span>
          <button onClick={() => void handleToggleHeart()} aria-label="Toggle LiLa context inclusion" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Heart size={20} fill={item.is_included_in_ai ? 'var(--color-accent)' : 'none'} style={{ color: 'var(--color-accent)' }} />
          </button>
        </div>

        {canManageSharing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <EyeOff size={14} /> Never show on share links
            </span>
            <button
              role="switch"
              aria-checked={item.excluded_from_shares}
              onClick={() => void handleToggleExcludeFromShares()}
              style={{
                width: '2.5rem', height: '1.375rem', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative',
                background: item.excluded_from_shares ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
              }}
            >
              <span style={{ position: 'absolute', top: '2px', left: item.excluded_from_shares ? '1.25rem' : '2px', width: '1.125rem', height: '1.125rem', borderRadius: '999px', background: '#fff', transition: 'left 0.15s' }} />
            </button>
          </div>
        )}

        {addedByName && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Added by {addedByName} · {new Date(item.created_at).toLocaleDateString()}
          </p>
        )}

        {extraActions}
      </div>
    </ModalV2>
  )
}
