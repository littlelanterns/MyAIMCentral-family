/**
 * StickerBookDetailModal — Build M Sub-phase D
 *
 * Full-screen modal showing the active sticker book page as a background
 * image with creature stickers absolutely positioned at their stored
 * coordinates (position_x, position_y from member_creature_collection).
 *
 * Layout:
 *   - Header: theme name + page name + creature count
 *   - Tabs: "Current page" / "All pages"
 *   - Current page tab: page image with StickerOverlay creatures
 *   - All pages tab: scrollable grid of unlocked pages; tap switches view
 *
 * Opened by:
 *   - Tapping PlayStickerBookWidget on dashboard (direct open)
 *   - Tapping "See my new page!" on PageUnlockRevealModal
 *
 * Deferred (not in this build):
 *   - Drag-to-reposition creatures
 *   - Per-page creature filtering beyond current page
 *   - Mom management / curation UI
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { X, BookOpen } from 'lucide-react'
import { useCreaturesForMember, useMoveCreature } from '@/hooks/useCreaturesForMember'
import { useMemberPageUnlocks } from '@/hooks/useMemberPageUnlocks'
import { StickerOverlay } from './StickerOverlay'
import type { StickerBookState, MemberCreature, MemberPageUnlock } from '@/types/play-dashboard'

interface StickerBookDetailModalProps {
  /** Sticker book state (from useStickerBookState) */
  state: StickerBookState
  /** Member id for creature + page queries */
  memberId: string
  /** Called to close the modal */
  onClose: () => void
  /** Optional: page id to open to (from PageUnlockRevealModal) */
  initialPageId?: string | null
}

type TabView = 'current' | 'all'

export function StickerBookDetailModal({
  state,
  memberId,
  onClose,
  initialPageId,
}: StickerBookDetailModalProps) {
  const { data: allCreatures = [] } = useCreaturesForMember(memberId)
  const { data: unlockedPages = [] } = useMemberPageUnlocks(memberId)
  const moveCreature = useMoveCreature(memberId)

  const [activeTab, setActiveTab] = useState<TabView>('current')

  // If initialPageId was provided (from PageUnlockRevealModal), start on that
  // page. Otherwise use the active page from the sticker book state.
  const [viewingPageId, setViewingPageId] = useState<string | null>(
    initialPageId ?? state.active_page_id,
  )

  // Resolve the currently viewed page definition from unlocked pages
  const viewingPage = useMemo(() => {
    if (!viewingPageId) return state.active_page
    const match = unlockedPages.find(u => u.page.id === viewingPageId)
    return match?.page ?? state.active_page
  }, [viewingPageId, unlockedPages, state.active_page])

  // Creatures assigned to the currently viewed page
  const creaturesOnPage = useMemo(
    () =>
      allCreatures.filter(
        c => c.sticker_page_id === viewingPageId || c.sticker_page_id === viewingPage?.id,
      ),
    [allCreatures, viewingPageId, viewingPage],
  )

  const handlePageSelect = useCallback((pageUnlock: MemberPageUnlock) => {
    setViewingPageId(pageUnlock.page.id)
    setActiveTab('current')
  }, [])

  // Move a creature within the current page
  const handleCreatureMove = useCallback(
    (creatureCollectionId: string, newX: number, newY: number) => {
      moveCreature.mutate({ creatureCollectionId, positionX: newX, positionY: newY })
    },
    [moveCreature],
  )

  // Move a creature to an adjacent page (edge-drop)
  const handleCreaturePageMove = useCallback(
    (creatureCollectionId: string, direction: 'left' | 'right') => {
      if (!viewingPage) return
      const sorted = [...unlockedPages].sort((a, b) => a.page.sort_order - b.page.sort_order)
      const currentIdx = sorted.findIndex(u => u.page.id === viewingPage.id)
      const targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1
      const target = sorted[targetIdx]
      if (!target) return

      // Place creature on the opposite side of the new page
      const newX = direction === 'left' ? 0.85 : 0.15
      const newY = 0.5

      moveCreature.mutate({
        creatureCollectionId,
        positionX: newX,
        positionY: newY,
        newPageId: target.page.id,
      })

      // Auto-navigate to the target page
      setViewingPageId(target.page.id)
    },
    [viewingPage, unlockedPages, moveCreature],
  )

  // Sorted pages for edge zone adjacency detection
  const sortedPages = useMemo(
    () => [...unlockedPages].sort((a, b) => a.page.sort_order - b.page.sort_order),
    [unlockedPages],
  )

  const currentPageIdx = useMemo(
    () => (viewingPage ? sortedPages.findIndex(u => u.page.id === viewingPage.id) : -1),
    [viewingPage, sortedPages],
  )

  const hasPrevPage = currentPageIdx > 0
  const hasNextPage = currentPageIdx >= 0 && currentPageIdx < sortedPages.length - 1
  const prevPageName = hasPrevPage ? sortedPages[currentPageIdx - 1].page.scene : null
  const nextPageName = hasNextPage ? sortedPages[currentPageIdx + 1].page.scene : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Sticker Book"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary, #fff)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--color-btn-primary-bg)" aria-hidden="true" />
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              My Sticker Book
            </div>
            {viewingPage && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {viewingPage.scene} — {creaturesOnPage.length} creature
                {creaturesOnPage.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sticker book"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          flexShrink: 0,
        }}
      >
        <TabButton
          label="Current page"
          active={activeTab === 'current'}
          onClick={() => setActiveTab('current')}
        />
        <TabButton
          label={`All pages (${unlockedPages.length})`}
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {activeTab === 'current' ? (
          <CurrentPageView
            page={viewingPage}
            creatures={creaturesOnPage}
            onCreatureMove={handleCreatureMove}
            onCreaturePageMove={handleCreaturePageMove}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
            prevPageName={prevPageName}
            nextPageName={nextPageName}
          />
        ) : (
          <AllPagesView
            unlockedPages={unlockedPages}
            viewingPageId={viewingPage?.id ?? null}
            onSelect={handlePageSelect}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Tab button ─────────────────────────────────────────────────── */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.625rem 0.5rem',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
        borderBottom: active
          ? '2px solid var(--color-btn-primary-bg)'
          : '2px solid transparent',
        backgroundColor: 'transparent',
        border: 'none',
        borderBottomStyle: 'solid',
        borderBottomWidth: '2px',
        borderBottomColor: active ? 'var(--color-btn-primary-bg)' : 'transparent',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Edge zone threshold — drop within this range triggers cross-page move */
const EDGE_ZONE = 0.08

/* ─── Current page view ──────────────────────────────────────────── */

function CurrentPageView({
  page,
  creatures,
  onCreatureMove,
  onCreaturePageMove,
  hasPrevPage,
  hasNextPage,
  prevPageName,
  nextPageName,
}: {
  page: { id: string; slug: string; display_name: string; scene: string; image_url: string } | null
  creatures: MemberCreature[]
  onCreatureMove: (creatureCollectionId: string, newX: number, newY: number) => void
  onCreaturePageMove: (creatureCollectionId: string, direction: 'left' | 'right') => void
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPageName: string | null
  nextPageName: string | null
}) {
  const [anyDragging, setAnyDragging] = useState(false)
  // Track which creature is being dragged so we can route edge drops
  const draggingCreatureIdRef = useRef<string | null>(null)

  if (!page) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '2rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          fontSize: 'var(--font-size-base)',
        }}
      >
        Complete tasks to start collecting creatures and unlock your first page!
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* Page background image */}
      <img
        src={page.image_url}
        alt={page.display_name}
        style={{
          width: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />

      {/* Left edge zone — visible when dragging + adjacent page exists */}
      {anyDragging && hasPrevPage && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${EDGE_ZONE * 100}%`,
            background: 'linear-gradient(to right, color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 5,
            animation: 'edgeZonePulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-btn-primary-text, #fff)',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              letterSpacing: '0.05em',
            }}
          >
            {prevPageName}
          </div>
        </div>
      )}

      {/* Right edge zone */}
      {anyDragging && hasNextPage && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${EDGE_ZONE * 100}%`,
            background: 'linear-gradient(to left, color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 5,
            animation: 'edgeZonePulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-btn-primary-text, #fff)',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              letterSpacing: '0.05em',
            }}
          >
            {nextPageName}
          </div>
        </div>
      )}

      {/* Creature stickers positioned on top */}
      {creatures.map(c => (
        <StickerOverlay
          key={c.id}
          imageUrl={c.creature.image_url}
          displayName={c.creature.display_name}
          positionX={c.position_x ?? 0.5}
          positionY={c.position_y ?? 0.5}
          rarity={c.creature.rarity}
          onMove={(newX, newY) => {
            // Check edge zones for cross-page drop
            if (newX <= EDGE_ZONE && hasPrevPage) {
              onCreaturePageMove(c.id, 'left')
            } else if (newX >= 1 - EDGE_ZONE && hasNextPage) {
              onCreaturePageMove(c.id, 'right')
            } else {
              onCreatureMove(c.id, newX, newY)
            }
          }}
          onDragStateChange={isDragging => {
            if (isDragging) draggingCreatureIdRef.current = c.id
            else draggingCreatureIdRef.current = null
            setAnyDragging(isDragging)
          }}
        />
      ))}

      {/* Empty state overlay when page has no creatures yet */}
      {creatures.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--vibe-radius-card, 0.75rem)',
              backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'center',
            }}
          >
            No creatures on this page yet — keep completing tasks!
          </div>
        </div>
      )}

      <style>{`
        @keyframes edgeZonePulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="edgeZonePulse"] { animation: none !important; opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}

/* ─── All pages grid view ────────────────────────────────────────── */

function AllPagesView({
  unlockedPages,
  viewingPageId,
  onSelect,
}: {
  unlockedPages: MemberPageUnlock[]
  viewingPageId: string | null
  onSelect: (unlock: MemberPageUnlock) => void
}) {
  if (unlockedPages.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '2rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          fontSize: 'var(--font-size-base)',
        }}
      >
        No pages unlocked yet — keep collecting creatures!
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '0.75rem',
        padding: '1rem',
      }}
    >
      {unlockedPages.map(unlock => {
        const isActive = unlock.page.id === viewingPageId
        return (
          <button
            key={unlock.id}
            type="button"
            onClick={() => onSelect(unlock)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
              padding: '0.5rem',
              borderRadius: 'var(--vibe-radius-card, 0.75rem)',
              border: isActive
                ? '2px solid var(--color-btn-primary-bg)'
                : '1px solid var(--color-border)',
              backgroundColor: isActive
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                : 'var(--color-bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <img
                src={unlock.page.image_url}
                alt={unlock.page.display_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-text-primary)',
              }}
            >
              {unlock.page.scene}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              {unlock.page.display_name}
            </div>
          </button>
        )
      })}
    </div>
  )
}
