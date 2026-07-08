// PRD-43 WishLists — /wishlists. One canonical route, viewer-appropriate
// render per shell (§6.2). Gift Planning tab visibility is a client-side
// convenience check (useManagementGrants) — RESTRICTIVE RLS is the real
// backstop regardless of what this component decides to show.

import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Gift, PlusCircle, Heart, DollarSign, Clock, RotateCcw, ImageIcon,
} from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'
import { useAllowanceConfig, useRunningBalance } from '@/hooks/useFinancial'
import {
  useWishlistItems, useDormantWishlistItems, useSetWishlistItemState, useReorderWishlistItems,
  useUpdateWishlistItem,
} from '@/hooks/useWishlists'
import { WishCatchModal } from '@/components/wishlists/WishCatchModal'
import { WishlistItemCard } from '@/components/wishlists/WishlistItemCard'
import { WishlistItemDetailSheet } from '@/components/wishlists/WishlistItemDetailSheet'
import { GiftPlanningTab } from '@/components/wishlists/GiftPlanningTab'
import { FeatureGuide } from '@/components/shared'
import type { ListItem } from '@/types/lists'

type MomAdultTab = 'family' | 'gift_planning'

export function WishListsPage() {
  const { member } = useEffectiveMember()
  const { data: family } = useFamily()
  const { data: allMembers = [] } = useFamilyMembers(family?.id)
  const grants = useManagementGrants(member)
  const [searchParams] = useSearchParams()
  const deepLinkedMemberId = searchParams.get('member')

  const [showCapture, setShowCapture] = useState(false)

  if (!member || !family) {
    return <div className="density-comfortable max-w-3xl mx-auto p-4" />
  }

  const isMomOrAdult = member.role === 'primary_parent' || member.role === 'additional_adult'
  const isTeen = member.dashboard_mode === 'independent'
  const isGuided = member.dashboard_mode === 'guided'
  const isPlay = member.dashboard_mode === 'play'
  const canPlanGifts = grants.giftPlanningLevel !== 'none'

  return (
    <div className="density-comfortable max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>WishLists</h1>
        {!isPlay && (
          <button
            onClick={() => setShowCapture(true)}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <PlusCircle size={18} /> Capture
          </button>
        )}
      </div>

      <FeatureGuide featureKey="wishlists_basic" />

      {isMomOrAdult && (
        <MomAdultWishlistSurface
          familyId={family.id}
          viewerId={member.id}
          allMembers={allMembers}
          canPlanGifts={canPlanGifts}
          deepLinkedMemberId={deepLinkedMemberId}
        />
      )}
      {isTeen && <IndependentWishlistSurface familyId={family.id} member={member} />}
      {isGuided && <GuidedWishlistSurface familyId={family.id} member={member} />}
      {isPlay && <PlayWishlistSurface familyId={family.id} member={member} />}
      {member.role === 'special_adult' && (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          WishLists isn't part of your view.
        </p>
      )}

      <WishCatchModal isOpen={showCapture} onClose={() => setShowCapture(false)} defaultMemberId={member.id} />
    </div>
  )
}

// ─── Mom / Adult: person tabs + Gift Planning ──────────────────────────────

function MomAdultWishlistSurface({
  familyId, viewerId, allMembers, canPlanGifts, deepLinkedMemberId,
}: { familyId: string; viewerId: string; allMembers: FamilyMember[]; canPlanGifts: boolean; deepLinkedMemberId?: string | null }) {
  const [activeTab, setActiveTab] = useState<MomAdultTab>('family')
  const [selectedPersonId, setSelectedPersonId] = useState<string>(deepLinkedMemberId || viewerId)

  const kids = allMembers.filter((m) => m.role === 'member')
  const viewablePeople = allMembers.filter((m) => m.role !== 'special_adult')
  const selectedPerson = viewablePeople.find((m) => m.id === selectedPersonId) ?? viewablePeople[0]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <TabButton active={activeTab === 'family'} onClick={() => setActiveTab('family')}>Family</TabButton>
        {canPlanGifts && (
          <TabButton active={activeTab === 'gift_planning'} onClick={() => setActiveTab('gift_planning')}>
            Gift Planning
          </TabButton>
        )}
      </div>

      {activeTab === 'family' && (
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {viewablePeople.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  border: `1px solid ${selectedPersonId === p.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: selectedPersonId === p.id ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
                  color: selectedPersonId === p.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {p.id === viewerId ? 'Me' : p.display_name}
              </button>
            ))}
          </div>
          {selectedPerson && (
            <AdultOwnedWishlistView
              familyId={familyId}
              subject={selectedPerson}
              viewerId={viewerId}
              hideClaimsFromSelf={selectedPersonId === viewerId}
            />
          )}
        </div>
      )}

      {activeTab === 'gift_planning' && canPlanGifts && (
        <GiftPlanningTab familyId={familyId} kids={kids} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium"
      style={{
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        background: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function AdultOwnedWishlistView({
  familyId, subject, viewerId, hideClaimsFromSelf: _hideClaimsFromSelf,
}: { familyId: string; subject: FamilyMember; viewerId: string; hideClaimsFromSelf: boolean }) {
  const { data: items = [] } = useWishlistItems(familyId, subject.id)
  const update = useUpdateWishlistItem()
  const [detailItem, setDetailItem] = useState<ListItem | null>(null)
  const isOwnList = subject.id === viewerId

  const active = items.filter((i) => i.wishlist_state !== 'dormant')

  if (active.length === 0) {
    return (
      <EmptyState
        text={isOwnList
          ? 'Your wish list is ready! When you spot something you love, it goes here.'
          : `${subject.display_name}'s wish list is empty right now.`}
      />
    )
  }

  return (
    <>
      <div className="space-y-2">
        {active.map((item) => (
          <WishlistItemCard
            key={item.id}
            item={item}
            onTap={() => setDetailItem(item)}
            onToggleHeart={() => void update.mutateAsync({ id: item.id, familyId, memberId: subject.id, is_included_in_ai: !item.is_included_in_ai })}
          />
        ))}
      </div>
      <WishlistItemDetailSheet
        item={detailItem}
        familyId={familyId}
        memberId={subject.id}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        canManageSharing
      />
    </>
  )
}

// ─── Independent (teen): full control ──────────────────────────────────────

function IndependentWishlistSurface({ familyId, member }: { familyId: string; member: FamilyMember }) {
  const { data: items = [] } = useWishlistItems(familyId, member.id)
  const { data: dormantItems = [] } = useDormantWishlistItems(familyId, member.id)
  const { data: config } = useAllowanceConfig(member.id)
  const { data: balance } = useRunningBalance(config?.enabled && config?.child_can_see_finances ? member.id : undefined)
  const reorder = useReorderWishlistItems()
  const setState = useSetWishlistItemState()
  const update = useUpdateWishlistItem()
  const [detailItem, setDetailItem] = useState<ListItem | null>(null)
  const [showDormant, setShowDormant] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const canSeeBalance = !!config?.enabled && !!config?.child_can_see_finances

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(items, oldIndex, newIndex)
    void reorder.mutateAsync({
      items: reordered.map((it, idx) => ({ id: it.id, sort_order: idx })),
      familyId, memberId: member.id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, familyId, member.id])

  const balanceChip = useCallback((price: number | null) => {
    if (!canSeeBalance || price == null || balance == null) return null
    const away = price - balance
    return away > 0 ? `$${away.toFixed(2)} away` : 'You can afford this!'
  }, [canSeeBalance, balance])

  return (
    <div className="space-y-4">
      {canSeeBalance && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-heading)' }}
        >
          <DollarSign size={16} /> You have ${(balance ?? 0).toFixed(2)}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState text="Your wish list is ready! When you spot something you love, it goes here." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  draggable
                  onTap={() => setDetailItem(item)}
                  onToggleHeart={() => void update.mutateAsync({ id: item.id, familyId, memberId: member.id, is_included_in_ai: !item.is_included_in_ai })}
                  showBalanceDistance={balanceChip(item.price)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <button
          onClick={() => setShowDormant((v) => !v)}
          className="text-sm flex items-center gap-1.5"
          style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Clock size={14} /> Maybe later ({dormantItems.length})
        </button>
        {showDormant && dormantItems.length > 0 && (
          <div className="space-y-2 mt-2">
            {dormantItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1"><WishlistItemCard item={item} onTap={() => setDetailItem(item)} dense /></div>
                <button
                  onClick={() => void setState.mutateAsync({ id: item.id, familyId, memberId: member.id, state: 'active' })}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                  <RotateCcw size={12} /> Still want it
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <WishlistItemDetailSheet
        item={detailItem}
        familyId={familyId}
        memberId={member.id}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  )
}

// ─── Guided: simplified ─────────────────────────────────────────────────────

function GuidedWishlistSurface({ familyId, member }: { familyId: string; member: FamilyMember }) {
  const { data: items = [] } = useWishlistItems(familyId, member.id)
  const setState = useSetWishlistItemState()

  if (items.length === 0) {
    return <EmptyState text="Your wish list is ready! When you spot something you love, it goes here." />
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Gift size={24} style={{ color: 'var(--color-text-muted)' }} />}
          </div>
          <p className="flex-1 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.content}</p>
          <button
            onClick={() => void setState.mutateAsync({ id: item.id, familyId, memberId: member.id, state: item.wishlist_state === 'dormant' ? 'active' : 'dormant' })}
            aria-label="Changed my mind"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            <Heart size={20} fill={item.wishlist_state === 'dormant' ? 'none' : 'var(--color-accent)'} style={{ color: 'var(--color-accent)' }} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Play: picture grid, zero prices ────────────────────────────────────────

function PlayWishlistSurface({ familyId, member }: { familyId: string; member: FamilyMember }) {
  const { data: items = [] } = useWishlistItems(familyId, member.id)

  if (items.length === 0) {
    return <EmptyState text="When you find something you love, ask a grown-up to add it here!" />
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-3"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={28} style={{ color: 'var(--color-text-muted)' }} />}
          </div>
          <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>{item.content}</p>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center rounded-2xl" style={{ background: 'var(--color-bg-secondary)' }}>
      <Gift size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.5rem' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </div>
  )
}
