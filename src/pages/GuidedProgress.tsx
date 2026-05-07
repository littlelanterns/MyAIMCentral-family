/**
 * Guided Progress Page
 *
 * Bottom-nav "Progress" home for Guided members. Currently surfaces the
 * member's Sticker Book when enabled (Build M / PRD-24+PRD-26 + tap to
 * open the existing Play StickerBookDetailModal) and a warm placeholder
 * for the rest of PRD-25 + PRD-10 progress hub work.
 *
 * Tracked for follow-up: full progress hub redesign with streak history,
 * earnings recap, and custom trackers (PRD-25 Phase D / PRD-10).
 */

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { PlayStickerBookWidget } from '@/components/play-dashboard/PlayStickerBookWidget'
import { StickerBookDetailModal } from '@/components/play-dashboard/StickerBookDetailModal'

export function GuidedProgress() {
  const { data: member } = useFamilyMember()
  const memberId = member?.id

  const { data: stickerBookState } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)

  const [stickerBookOpen, setStickerBookOpen] = useState(false)

  const hasStickerBook = !!stickerBookState

  return (
    <div className="density-comfortable max-w-md mx-auto px-4 py-6 space-y-6">
      {hasStickerBook && (
        <section
          aria-label="My Sticker Book"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            My Sticker Book
          </h2>
          <PlayStickerBookWidget
            state={stickerBookState}
            creatureCount={creatures.length}
            onOpen={() => setStickerBookOpen(true)}
          />
        </section>
      )}

      <section className="text-center space-y-4 py-6">
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <BarChart3 size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          {hasStickerBook ? 'More coming soon' : 'My Progress'}
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {hasStickerBook
            ? 'Streaks, achievements, and your own trackers are on the way!'
            : "Your progress page is coming soon! This is where you'll see your streaks, achievements, and how far you've come."}
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Keep doing your best — every day counts!
        </p>
      </section>

      {stickerBookOpen && hasStickerBook && memberId && (
        <StickerBookDetailModal
          state={stickerBookState}
          memberId={memberId}
          onClose={() => setStickerBookOpen(false)}
        />
      )}
    </div>
  )
}
