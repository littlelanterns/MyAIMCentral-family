/**
 * CreaturePageFrame — KIDS-REWARDS-PAGE Slice 3 (founder gate §13).
 *
 * ONE self-contained frame holding:
 *   - a horizontal SWIPE STRIP of the member's unlocked backgrounds (the hero),
 *     each rendering the creatures placed on it at their saved positions;
 *   - an unplaced-creatures SCROLLBAR at the BOTTOM OF THE FRAME (not the page),
 *     hideable via the shared <PullTab orientation="bottom"> so a finished
 *     scene becomes the full hero.
 *
 * Two coexisting gestures (the phone-home-screen metaphor):
 *   - SWIPE / chevrons = NAVIGATE between backgrounds (hands empty).
 *   - DRAG-TO-EDGE = carry a creature to the adjacent background mid-move.
 *
 * Two placement gestures from the tray, BOTH supported:
 *   (a) touch-select-then-place — tap a tray creature to select it, then tap a
 *       spot on the background to drop it there;
 *   (b) drag-and-drop — pull a creature up from the tray onto the background
 *       (drag near the left/right edge to flip to another background first).
 *
 * Remove-from-page = tap a placed creature → "Return to tray" (sticker_page_id
 * = NULL). Theme-scoped from the start (reads member_sticker_book_state
 * .active_theme_id; filters backgrounds + creatures by theme_id) so the future
 * background/character-set picker slots in above the strip with zero rework
 * (gate §13 "prepare for now, build later").
 *
 * Reuses: StickerOverlay (drag + 0–1 coords + the new onTap/selected props),
 * useMoveCreature (newPageId incl. null), useMemberPageUnlocks,
 * useCreaturesForMember, useStickerBookState (+ useSetLastViewedPage).
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Undo2, Hand } from 'lucide-react'
import { PullTab } from '@/components/shared/PullTab'
import { StickerOverlay } from '@/components/play-dashboard/StickerOverlay'
import { useCreaturesForMember, useMoveCreature } from '@/hooks/useCreaturesForMember'
import { useMemberPageUnlocks } from '@/hooks/useMemberPageUnlocks'
import {
  useStickerBookState,
  useSetLastViewedPage,
} from '@/hooks/useStickerBookState'
import type { MemberCreature } from '@/types/play-dashboard'

interface CreaturePageFrameProps {
  memberId: string
  variant?: 'standard' | 'play'
  /** When the frame is the hero of a full-screen modal, give the scene more height. */
  tall?: boolean
  /** Open directly to this background (e.g. from a "see my new page" unlock). */
  initialPageId?: string | null
}

/** Drop within this fraction of a horizontal edge → carry to the adjacent page. */
const EDGE_ZONE = 0.08
/** A tray-drag starts only once the pointer is pulled UP toward the scene by this much. */
const TRAY_DRAG_START_DY = -12
/** While tray-dragging, holding the ghost within this many px of an edge flips the page. */
const EDGE_FLIP_PX = 44
/** Minimum gap between automatic edge-flips so it doesn't rapid-cycle. */
const EDGE_FLIP_THROTTLE_MS = 650
/** Horizontal swipe distance (px) on the background that counts as a page change. */
const SWIPE_THRESHOLD_PX = 50

function clamp01(v: number): number {
  return Math.max(0.02, Math.min(0.98, v))
}

export function CreaturePageFrame({
  memberId,
  variant = 'standard',
  tall = false,
  initialPageId = null,
}: CreaturePageFrameProps) {
  const { data: state } = useStickerBookState(memberId)
  const { data: unlockedPages = [] } = useMemberPageUnlocks(memberId)
  const { data: allCreatures = [] } = useCreaturesForMember(memberId)
  const moveCreature = useMoveCreature(memberId)
  const setLastViewed = useSetLastViewedPage(memberId)

  const play = variant === 'play'
  const activeThemeId = state?.active_theme_id ?? null

  // ── Theme-scoped pages + creatures (gate §13 "prepare for now") ──────────
  const pages = useMemo(
    () =>
      unlockedPages
        .filter(u => !activeThemeId || u.page.theme_id === activeThemeId)
        .sort((a, b) => a.page.sort_order - b.page.sort_order),
    [unlockedPages, activeThemeId],
  )

  const themeCreatures = useMemo(
    () =>
      allCreatures.filter(c => !activeThemeId || c.creature.theme_id === activeThemeId),
    [allCreatures, activeThemeId],
  )

  const unplaced = useMemo(
    () => themeCreatures.filter(c => c.sticker_page_id === null),
    [themeCreatures],
  )

  // ── Swipe position (restored from last_viewed_page_id) ───────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current || pages.length === 0) return
    const target =
      initialPageId ?? state?.last_viewed_page_id ?? state?.active_page_id ?? null
    const idx = target ? pages.findIndex(p => p.page.id === target) : -1
    setCurrentIndex(idx >= 0 ? idx : 0)
    initRef.current = true
  }, [pages, initialPageId, state?.last_viewed_page_id, state?.active_page_id])

  // Keep index in range if the page set shrinks.
  useEffect(() => {
    if (pages.length > 0 && currentIndex > pages.length - 1) {
      setCurrentIndex(pages.length - 1)
    }
  }, [pages.length, currentIndex])

  const currentPage = pages[currentIndex]?.page ?? null
  const creaturesOnPage = useMemo(
    () => themeCreatures.filter(c => currentPage && c.sticker_page_id === currentPage.id),
    [themeCreatures, currentPage],
  )

  const goToIndex = useCallback(
    (i: number) => {
      if (pages.length === 0) return
      const clamped = Math.max(0, Math.min(pages.length - 1, i))
      setCurrentIndex(clamped)
      const pageId = pages[clamped]?.page.id
      if (pageId && pageId !== state?.last_viewed_page_id) {
        setLastViewed.mutate(pageId)
      }
    },
    [pages, state?.last_viewed_page_id, setLastViewed],
  )

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < pages.length - 1

  // ── Selection state (gesture A + remove) ─────────────────────────────────
  const [selectedUnplacedId, setSelectedUnplacedId] = useState<string | null>(null)
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null)
  const [trayOpen, setTrayOpen] = useState(true)
  const [anyDragging, setAnyDragging] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)

  // ── On-page creature move (with drag-to-edge cross-page carry) ───────────
  const handleCreatureMove = useCallback(
    (creature: MemberCreature, newX: number, newY: number) => {
      // Drop in an edge zone → carry to the adjacent background (gate §13).
      if (newX <= EDGE_ZONE && hasPrev) {
        const target = pages[currentIndex - 1]
        moveCreature.mutate({
          creatureCollectionId: creature.id,
          positionX: 0.85,
          positionY: newY,
          newPageId: target.page.id,
        })
        goToIndex(currentIndex - 1)
        return
      }
      if (newX >= 1 - EDGE_ZONE && hasNext) {
        const target = pages[currentIndex + 1]
        moveCreature.mutate({
          creatureCollectionId: creature.id,
          positionX: 0.15,
          positionY: newY,
          newPageId: target.page.id,
        })
        goToIndex(currentIndex + 1)
        return
      }
      moveCreature.mutate({
        creatureCollectionId: creature.id,
        positionX: newX,
        positionY: newY,
      })
    },
    [hasPrev, hasNext, pages, currentIndex, moveCreature, goToIndex],
  )

  const handleRemoveFromPage = useCallback(
    (creatureId: string) => {
      moveCreature.mutate({
        creatureCollectionId: creatureId,
        positionX: 0.5,
        positionY: 0.5,
        newPageId: null,
      })
      setSelectedPlacedId(null)
    },
    [moveCreature],
  )

  // ── Place a tray creature at a point on the current page ─────────────────
  const placeAt = useCallback(
    (creatureCollectionId: string, clientX: number, clientY: number) => {
      const rect = heroRef.current?.getBoundingClientRect()
      if (!rect || !currentPage) return
      const x = clamp01((clientX - rect.left) / rect.width)
      const y = clamp01((clientY - rect.top) / rect.height)
      moveCreature.mutate({
        creatureCollectionId,
        positionX: x,
        positionY: y,
        newPageId: currentPage.id,
      })
      setSelectedUnplacedId(null)
    },
    [currentPage, moveCreature],
  )

  // ── Gesture A: tap the selected tray creature onto the scene ─────────────
  const suppressClickRef = useRef(false)
  const handleHeroClick = useCallback(
    (e: React.MouseEvent) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      // A click that lands on a creature is handled by the overlay itself.
      const onCreature = (e.target as HTMLElement).closest('[data-creature-overlay]')
      if (onCreature) return
      if (selectedUnplacedId) {
        placeAt(selectedUnplacedId, e.clientX, e.clientY)
        return
      }
      // Tapping empty scene clears any placed-creature selection.
      if (selectedPlacedId) setSelectedPlacedId(null)
    },
    [selectedUnplacedId, selectedPlacedId, placeAt],
  )

  // ── Swipe navigation on the background (touch) ───────────────────────────
  const swipeRef = useRef<{ x: number; y: number; onCreature: boolean } | null>(null)
  const handleHeroTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    const onCreature = !!(e.target as HTMLElement).closest('[data-creature-overlay]')
    swipeRef.current = { x: t.clientX, y: t.clientY, onCreature }
  }, [])
  const handleHeroTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = swipeRef.current
      swipeRef.current = null
      if (!start || start.onCreature) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
        suppressClickRef.current = true // a swipe is not a place-tap
        if (dx < 0 && hasNext) goToIndex(currentIndex + 1)
        else if (dx > 0 && hasPrev) goToIndex(currentIndex - 1)
      }
    },
    [currentIndex, hasNext, hasPrev, goToIndex],
  )

  // ── Gesture B: pointer-drag a creature from the tray onto the scene ───────
  const [ghost, setGhost] = useState<{
    creatureId: string
    imageUrl: string
    x: number
    y: number
  } | null>(null)
  const dragRef = useRef<{
    creatureId: string
    imageUrl: string
    startX: number
    startY: number
    started: boolean
    lastFlip: number
  } | null>(null)

  const handleTrayPointerDown = useCallback(
    (e: React.PointerEvent, c: MemberCreature) => {
      // Left mouse / touch / pen only.
      if (e.button !== undefined && e.button !== 0) return
      dragRef.current = {
        creatureId: c.id,
        imageUrl: c.creature.image_url,
        startX: e.clientX,
        startY: e.clientY,
        started: false,
        lastFlip: 0,
      }
    },
    [],
  )

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (!d.started) {
        // Only an UPWARD pull toward the scene starts a drag; sideways stays a
        // tray scroll (gate §13: the tray scrolls side-to-side).
        if (dy < TRAY_DRAG_START_DY && Math.abs(dy) >= Math.abs(dx)) {
          d.started = true
          setSelectedUnplacedId(null)
          setGhost({ creatureId: d.creatureId, imageUrl: d.imageUrl, x: e.clientX, y: e.clientY })
        } else if (Math.abs(dx) > 14) {
          // Committed to a horizontal scroll — abandon the drag candidate.
          dragRef.current = null
          return
        } else {
          return
        }
      }
      e.preventDefault()
      setGhost(g => (g ? { ...g, x: e.clientX, y: e.clientY } : g))

      // Drag-to-edge flip while carrying a tray creature.
      const rect = heroRef.current?.getBoundingClientRect()
      if (rect && e.clientY >= rect.top - 40 && e.clientY <= rect.bottom + 40) {
        const now = Date.now()
        if (now - d.lastFlip > EDGE_FLIP_THROTTLE_MS) {
          if (e.clientX <= rect.left + EDGE_FLIP_PX && hasPrev) {
            d.lastFlip = now
            goToIndex(currentIndex - 1)
          } else if (e.clientX >= rect.right - EDGE_FLIP_PX && hasNext) {
            d.lastFlip = now
            goToIndex(currentIndex + 1)
          }
        }
      }
    }
    function onUp(e: PointerEvent) {
      const d = dragRef.current
      dragRef.current = null
      if (!d) return
      if (d.started) {
        const rect = heroRef.current?.getBoundingClientRect()
        if (
          rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          placeAt(d.creatureId, e.clientX, e.clientY)
        }
        setGhost(null)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [currentIndex, hasPrev, hasNext, goToIndex, placeAt])

  // ── Empty state: no unlocked backgrounds yet ─────────────────────────────
  if (!state) return null

  const heroMinHeight = tall ? '60vh' : play ? '320px' : '260px'

  return (
    <div
      data-testid="creature-page-frame"
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header: page name + position dots (set-picker slot lives here) ── */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: play ? '0.75rem 1rem' : '0.625rem 0.875rem' }}
      >
        <div
          style={{
            fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-text-heading)',
            minWidth: 0,
          }}
          className="truncate"
        >
          {currentPage ? currentPage.scene : 'My Creatures'}
        </div>
        {pages.length > 1 && (
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {pages.map((p, i) => (
              <span
                key={p.id}
                style={{
                  width: i === currentIndex ? 9 : 7,
                  height: i === currentIndex ? 9 : 7,
                  borderRadius: '9999px',
                  backgroundColor:
                    i === currentIndex
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-border)',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Hero: the swipe-strip viewport ─────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1 }}>
        {pages.length === 0 || !currentPage ? (
          <div
            style={{
              minHeight: heroMinHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
            }}
          >
            Keep earning to unlock your first background — then your creatures
            have a home!
          </div>
        ) : (
          <>
            <div
              ref={heroRef}
              data-testid="creature-hero"
              onClick={handleHeroClick}
              onTouchStart={handleHeroTouchStart}
              onTouchEnd={handleHeroTouchEnd}
              style={{
                position: 'relative',
                width: '100%',
                minHeight: heroMinHeight,
                cursor: selectedUnplacedId ? 'copy' : 'default',
              }}
            >
              <img
                src={currentPage.image_url}
                alt={currentPage.display_name}
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
              />

              {/* Edge zone hints while dragging (on-page or tray drag) */}
              {(anyDragging || ghost) && hasPrev && <EdgeHint side="left" />}
              {(anyDragging || ghost) && hasNext && <EdgeHint side="right" />}

              {creaturesOnPage.map(c => (
                <StickerOverlay
                  key={c.id}
                  imageUrl={c.creature.image_url}
                  displayName={c.creature.display_name}
                  positionX={c.position_x ?? 0.5}
                  positionY={c.position_y ?? 0.5}
                  rarity={c.creature.rarity}
                  selected={selectedPlacedId === c.id}
                  onMove={(nx, ny) => handleCreatureMove(c, nx, ny)}
                  onTap={() =>
                    setSelectedPlacedId(prev => (prev === c.id ? null : c.id))
                  }
                  onDragStateChange={setAnyDragging}
                />
              ))}

              {/* Place-here hint when a tray creature is selected */}
              {selectedUnplacedId && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.4rem 0.875rem',
                      borderRadius: '9999px',
                      backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 92%, transparent)',
                      border: '1px solid var(--color-btn-primary-bg)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <Hand size={14} />
                    Tap where you want it
                  </div>
                </div>
              )}
            </div>

            {/* Prev / Next chevrons (click + desktop; swipe is the touch path) */}
            {hasPrev && (
              <NavButton
                side="left"
                play={play}
                onClick={() => goToIndex(currentIndex - 1)}
              />
            )}
            {hasNext && (
              <NavButton
                side="right"
                play={play}
                onClick={() => goToIndex(currentIndex + 1)}
              />
            )}

            {/* Selected placed creature → Return to tray */}
            {selectedPlacedId && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <button
                  type="button"
                  data-testid="creature-remove-from-page"
                  onClick={() => handleRemoveFromPage(selectedPlacedId)}
                  style={{
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: play ? '0.75rem 1.25rem' : '0.5rem 1rem',
                    minHeight: play ? '56px' : '40px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-text-on-primary, #fff)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: play ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  }}
                >
                  <Undo2 size={play ? 20 : 16} />
                  Return to tray
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Tray (bottom of the FRAME) + its pull tab ──────────────────── */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: trayOpen ? 0 : '-1px',
          }}
        >
          <PullTab
            orientation="bottom"
            label={trayOpen ? 'Hide creature tray' : 'Show creature tray'}
            onClick={() => setTrayOpen(o => !o)}
            width={play ? 150 : 130}
            height={play ? 26 : 22}
          >
            <span
              style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {trayOpen ? <ChevronLeft size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />}
              {unplaced.length} to place
            </span>
          </PullTab>
        </div>

        {trayOpen && (
          <div
            data-testid="creature-tray"
            style={{
              borderTop: '1px solid var(--color-border)',
              padding: play ? '0.75rem' : '0.625rem',
              display: 'flex',
              gap: play ? '0.75rem' : '0.5rem',
              overflowX: 'auto',
              overflowY: 'hidden',
              touchAction: 'pan-x',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'center',
              minHeight: play ? 88 : 72,
            }}
          >
            {unplaced.length === 0 ? (
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  padding: '0.5rem',
                }}
              >
                Every creature is on a page — nice work!
              </div>
            ) : (
              unplaced.map(c => (
                <TrayCreature
                  key={c.id}
                  creature={c}
                  play={play}
                  selected={selectedUnplacedId === c.id}
                  dragging={ghost?.creatureId === c.id}
                  onSelectToggle={() =>
                    setSelectedUnplacedId(prev => (prev === c.id ? null : c.id))
                  }
                  onPointerDown={e => handleTrayPointerDown(e, c)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating ghost while dragging from the tray (gesture B) */}
      {ghost && (
        <img
          src={ghost.imageUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: ghost.x,
            top: ghost.y,
            width: 56,
            height: 56,
            transform: 'translate(-50%, -50%) scale(1.1)',
            pointerEvents: 'none',
            zIndex: 100,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))',
          }}
        />
      )}
    </div>
  )
}

// ── Tray creature button (gesture A select + gesture B drag handle) ───────
function TrayCreature({
  creature,
  play,
  selected,
  dragging,
  onSelectToggle,
  onPointerDown,
}: {
  creature: MemberCreature
  play: boolean
  selected: boolean
  dragging: boolean
  onSelectToggle: () => void
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const size = play ? 64 : 52
  return (
    <button
      type="button"
      data-testid="tray-creature"
      data-creature-id={creature.id}
      aria-label={`${creature.creature.display_name}${selected ? ' (selected)' : ''}`}
      aria-pressed={selected}
      onPointerDown={onPointerDown}
      onClick={onSelectToggle}
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        padding: 4,
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        border: selected
          ? '2px solid var(--color-btn-primary-bg)'
          : '1px solid var(--color-border)',
        backgroundColor: selected
          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
          : 'var(--color-bg-secondary)',
        cursor: 'grab',
        opacity: dragging ? 0.35 : 1,
        touchAction: 'pan-x',
      }}
    >
      <img
        src={creature.creature.image_url}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
        loading="lazy"
      />
    </button>
  )
}

// ── Edge zone hint while dragging ─────────────────────────────────────────
function EdgeHint({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        [side]: 0,
        top: 0,
        bottom: 0,
        width: `${EDGE_ZONE * 100}%`,
        background:
          side === 'left'
            ? 'linear-gradient(to right, color-mix(in srgb, var(--color-btn-primary-bg) 35%, transparent), transparent)'
            : 'linear-gradient(to left, color-mix(in srgb, var(--color-btn-primary-bg) 35%, transparent), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}

// ── Prev/Next chevron ─────────────────────────────────────────────────────
function NavButton({
  side,
  play,
  onClick,
}: {
  side: 'left' | 'right'
  play: boolean
  onClick: () => void
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  const dim = play ? 48 : 40
  return (
    <button
      type="button"
      data-testid={`creature-nav-${side}`}
      aria-label={side === 'left' ? 'Previous background' : 'Next background'}
      onClick={onClick}
      style={{
        position: 'absolute',
        [side]: '0.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        width: dim,
        height: dim,
        borderRadius: '9999px',
        border: 'none',
        backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 85%, transparent)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-text-primary)',
        zIndex: 6,
      }}
    >
      <Icon size={play ? 26 : 22} />
    </button>
  )
}
