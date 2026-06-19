/**
 * InfoStickerPageWidget — KIDS-REWARDS-PAGE Slice 3 dashboard "door".
 *
 * A view-only viewport (gate Section 4: "a window, not a toy") showing the
 * member's LAST-VIEWED sticker page with its creatures in their saved
 * positions. Tap → opens the full CreaturePageModal where all the interaction
 * (swipe, place, carry, remove) lives.
 *
 * Member resolution mirrors the other info widgets: View-As target inside the
 * modal, else the widget's pinned member, else the auth user.
 */

import { useState, useMemo } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { useMemberPageUnlocks } from '@/hooks/useMemberPageUnlocks'
import { StickerOverlay } from '@/components/play-dashboard/StickerOverlay'
import { CreaturePageModal } from '@/components/rewards/CreaturePageModal'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoStickerPageWidget({ widget }: Props) {
  const { member: effectiveMember, isViewAs } = useEffectiveMember()
  const memberId = isViewAs
    ? effectiveMember?.id
    : (widget.family_member_id ?? effectiveMember?.id)

  const { data: state } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)
  const { data: unlockedPages = [] } = useMemberPageUnlocks(memberId)
  const [open, setOpen] = useState(false)

  // The page to show in the miniature: last-viewed, else active, else first.
  const page = useMemo(() => {
    const targetId = state?.last_viewed_page_id ?? state?.active_page_id ?? null
    const match = unlockedPages.find(u => u.page.id === targetId)
    return match?.page ?? unlockedPages[0]?.page ?? state?.active_page ?? null
  }, [state, unlockedPages])

  const creaturesOnPage = useMemo(
    () => (page ? creatures.filter(c => c.sticker_page_id === page.id) : []),
    [creatures, page],
  )

  if (!memberId) return null

  return (
    <>
      <button
        type="button"
        onClick={e => {
          // Don't also fire the WidgetCard's open-detail click — the door has
          // exactly one action: open the creature page.
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label="Open my sticker book"
        className="w-full h-full flex flex-col text-left p-0"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Sticker Page
          </span>
          <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>

        {page ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              flex: 1,
              minHeight: 0,
              borderRadius: 'var(--vibe-radius-card, 0.5rem)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <img
              src={page.image_url}
              alt={page.display_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              loading="lazy"
            />
            {/* View-only creatures (no onMove/onTap = not draggable here) */}
            {creaturesOnPage.map(c => (
              <StickerOverlay
                key={c.id}
                imageUrl={c.creature.image_url}
                displayName={c.creature.display_name}
                positionX={c.position_x ?? 0.5}
                positionY={c.position_y ?? 0.5}
                rarity={c.creature.rarity}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-center px-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span className="text-xs">
              Earn creatures to fill your sticker book
            </span>
          </div>
        )}
      </button>

      {open && state && memberId && (
        <CreaturePageModal memberId={memberId} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
