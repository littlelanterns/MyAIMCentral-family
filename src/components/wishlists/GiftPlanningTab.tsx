// PRD-43 WishLists §6.4 — Gift Planning tab (mom + gift_planning-granted
// adults only; visibility check happens in the parent page via
// useManagementGrants().giftPlanningLevel, RESTRICTIVE RLS is the DB
// backstop regardless of what the client shows). Per-kid gift-ideas list,
// Considering copies with provenance, claim controls.
//
// Phase A scope: gift_ideas items + claim controls + Consider-for-gift.
// Phase B adds: share-link manager section, gift history section (both
// render as "coming soon" placeholders here for now — the tables already
// exist from the Phase A migration).

import { useState } from 'react'
import { Gift, PlusCircle, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import MemberPillSelector, { type MemberPillItem } from '@/components/shared/MemberPillSelector'
import { WishlistItemCard } from './WishlistItemCard'
import { WishCatchModal } from './WishCatchModal'
import {
  useGiftIdeasItems, useWishlistItems, useConsiderForGift,
  useGiftClaimsForItems, useCreateGiftClaim, useUpdateGiftClaimStatus, useReleaseGiftClaim,
} from '@/hooks/useWishlists'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { ListItem } from '@/types/lists'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface GiftPlanningTabProps {
  familyId: string
  kids: FamilyMember[]
}

export function GiftPlanningTab({ familyId, kids }: GiftPlanningTabProps) {
  const { data: currentMember } = useFamilyMember()
  const [selectedKidId, setSelectedKidId] = useState<string>(kids[0]?.id ?? '')
  const [showWishCatch, setShowWishCatch] = useState(false)
  const [browsingWishlist, setBrowsingWishlist] = useState(false)

  const kidPills: MemberPillItem[] = kids.map((k) => ({
    id: k.id, display_name: k.display_name, assigned_color: k.assigned_color, calendar_color: k.calendar_color, member_color: k.member_color,
  }))
  const selectedKid = kids.find((k) => k.id === selectedKidId)

  const { data: ideaItems = [] } = useGiftIdeasItems(familyId, selectedKidId || undefined)
  const { data: wishlistItems = [] } = useWishlistItems(familyId, selectedKidId || undefined)
  const considerForGift = useConsiderForGift()

  const originalItemIds = ideaItems.filter((i) => i.source_list_item_id).map((i) => i.source_list_item_id as string)
  const { data: claims = [] } = useGiftClaimsForItems(originalItemIds)
  const createClaim = useCreateGiftClaim()
  const updateClaim = useUpdateGiftClaimStatus()
  const releaseClaim = useReleaseGiftClaim()

  async function handleConsiderForGift(item: ListItem) {
    if (!selectedKid || !currentMember) return
    await considerForGift.mutateAsync({
      familyId, ownerId: currentMember.id, subjectMemberId: selectedKid.id, subjectName: selectedKid.display_name, sourceItem: item,
    })
  }

  if (kids.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No children to plan gifts for yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
          Planning gifts for
        </p>
        <MemberPillSelector members={kidPills} selectedIds={selectedKidId ? [selectedKidId] : []} onToggle={setSelectedKidId} variant="compact" showSortToggle={false} />
      </div>

      {selectedKid && (
        <>
          {/* Gift ideas list — mom's hidden notes about this kid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-heading)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Gift size={16} /> Gift Ideas for {selectedKid.display_name}
              </p>
              <button
                onClick={() => setShowWishCatch(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <PlusCircle size={16} /> Capture an idea
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {selectedKid.display_name} never sees this list.
            </p>

            {ideaItems.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--vibe-radius-card, 12px)', background: 'var(--color-bg-secondary)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  When {selectedKid.display_name} mentions something they'd love, catch it here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ideaItems.map((item) => {
                  const claim = item.source_list_item_id ? claims.find((c) => c.list_item_id === item.source_list_item_id) : undefined
                  const sourceStillActive = item.source_list_item_id
                    ? wishlistItems.some((w) => w.id === item.source_list_item_id && w.wishlist_state === 'active')
                    : true
                  return (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {item.source_list_item_id && (
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>
                          From {selectedKid.display_name}'s wishlist
                          {!sourceStillActive && ` · ${selectedKid.display_name} changed their mind about this`}
                        </p>
                      )}
                      <WishlistItemCard
                        item={item}
                        onTap={() => { /* refine handled by parent page's shared detail sheet */ }}
                        showPrice
                      />
                      <div style={{ display: 'flex', gap: '0.375rem', paddingLeft: '0.25rem' }}>
                        {(['reserved', 'purchased', 'given'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              if (!item.source_list_item_id) return
                              if (claim) void updateClaim.mutateAsync({ id: claim.id, status })
                              else void createClaim.mutateAsync({
                                familyId, listItemId: item.source_list_item_id, itemTitleSnapshot: item.content,
                                claimedByMemberId: currentMember?.id ?? '', status,
                              })
                            }}
                            disabled={!item.source_list_item_id}
                            style={{
                              padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', cursor: item.source_list_item_id ? 'pointer' : 'not-allowed',
                              border: `1px solid ${claim?.status === status ? 'var(--color-accent)' : 'var(--color-border)'}`,
                              background: claim?.status === status ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                              color: claim?.status === status ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            }}
                          >
                            {status === 'reserved' ? 'Reserve' : status === 'purchased' ? 'Purchased' : 'Given'}
                          </button>
                        ))}
                        {claim && (
                          <button
                            onClick={() => void releaseClaim.mutateAsync(claim.id)}
                            style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)' }}
                          >
                            Release
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Browse the kid's wishlist to pull items into Considering */}
          <div>
            <button
              onClick={() => setBrowsingWishlist((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {browsingWishlist ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Browse {selectedKid.display_name}'s wishlist
            </button>
            {browsingWishlist && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {wishlistItems.filter((w) => w.wishlist_state === 'active').length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Nothing on their wishlist yet.</p>
                ) : (
                  wishlistItems.filter((w) => w.wishlist_state === 'active').map((item) => {
                    const alreadyConsidering = ideaItems.some((i) => i.source_list_item_id === item.id)
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <WishlistItemCard item={item} onTap={() => {}} showPrice dense />
                        </div>
                        <button
                          onClick={() => void handleConsiderForGift(item)}
                          disabled={alreadyConsidering}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', whiteSpace: 'nowrap',
                            padding: '0.375rem 0.625rem', borderRadius: 'var(--vibe-radius-input, 8px)', border: 'none', cursor: alreadyConsidering ? 'default' : 'pointer',
                            background: alreadyConsidering ? 'var(--color-bg-secondary)' : 'var(--surface-primary, var(--color-btn-primary-bg))',
                            color: alreadyConsidering ? 'var(--color-text-muted)' : 'var(--color-text-on-primary, #fff)',
                          }}
                        >
                          <Sparkles size={12} /> {alreadyConsidering ? 'Considering' : 'Consider for gift'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Phase B sockets */}
          <div style={{ padding: '1rem', borderRadius: 'var(--vibe-radius-card, 12px)', background: 'var(--color-bg-secondary)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Share links for grandma and gift history land in the next update.
            </p>
          </div>
        </>
      )}

      {selectedKid && (
        <WishCatchModal
          isOpen={showWishCatch}
          onClose={() => setShowWishCatch(false)}
          defaultMemberId={selectedKid.id}
          mode="gift_ideas"
          subjectName={selectedKid.display_name}
        />
      )}
    </div>
  )
}
