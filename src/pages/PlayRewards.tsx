/**
 * PlayRewards — Play shell "Fun" tab rewards surface.
 *
 * Originally SCOPE-3.F22 (dedicated /rewards destination). KIDS-REWARDS-PAGE
 * Slice 2 rework: the standalone PrizeBox is replaced by the shared
 * <MyRewards variant="play"> sections component (founder gate Q3 — ONE
 * component across shells), which renders Points, Custom Rewards (playMode:
 * no Redeem, "Ask a grown-up to use it!"), and Victories per mom's section
 * opt-ins. Finances NEVER renders on Play (PRD-28 hard rule — enforced in
 * both the settings resolution and the component).
 *
 * Sticker book (founder eyes-on fix, 2026-06-12): the page previously
 * rendered StickerBookDetailModal INLINE — a full-screen overlay that
 * covered the Play bottom nav and buried every section beneath it. It now
 * renders the tappable PlayStickerBookWidget (same as the dashboard); the
 * full modal opens on tap and CLOSES BACK TO THIS PAGE. Becomes the full
 * Creatures section in Slice 3.
 *
 * View As: uses the EFFECTIVE member so mom sees the same page the kid sees
 * (Convention #39).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { useMyRewardsSettings } from '@/hooks/useMyRewardsSettings'
import { StickerBookDetailModal } from '@/components/play-dashboard/StickerBookDetailModal'
import { PlayStickerBookWidget } from '@/components/play-dashboard/PlayStickerBookWidget'
import { MyRewards } from '@/components/rewards/MyRewards'

export function PlayRewards() {
  const navigate = useNavigate()
  const [bookOpen, setBookOpen] = useState(false)
  const { member, isViewAs } = useEffectiveMember()
  const { data: authMember } = useFamilyMember()
  const memberId = member?.id
  const { data: stickerState, isLoading: stickerLoading } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)
  const { data: settings } = useMyRewardsSettings(memberId ?? null)

  const goHome = () => navigate('/dashboard')

  if (!member || !memberId || stickerLoading) {
    return (
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
          Loading your rewards...
        </div>
      </div>
    )
  }

  // Sticker book disabled (mom hasn't turned on gamification) — still
  // show the other sections, plus a warm empty state for the book.
  const hasStickerBook = stickerState !== null && stickerState !== undefined
  // Sticker book honors the creatures section opt-in (default ON when
  // gamification is enabled — the pre-Slice-2 behavior is unchanged unless
  // mom explicitly turns the section off).
  const showStickerBook = hasStickerBook && (settings?.sections.creatures ?? true)
  const isOwnSession = !isViewAs && authMember?.id === member.id

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1rem',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          padding: '1rem 0',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          My Rewards!
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-secondary)',
            margin: '0.5rem 0 0 0',
          }}
        >
          {creatures.length > 0
            ? `You've collected ${creatures.length} creature${creatures.length === 1 ? '' : 's'}!`
            : 'Start earning creatures to fill your sticker book.'}
        </p>
      </header>

      {showStickerBook && stickerState ? (
        <section aria-label="Sticker book">
          {/* Tappable preview — the full modal opens on tap and closes back
              to this page (it no longer renders inline, which covered the
              bottom nav and every section below it). */}
          <PlayStickerBookWidget
            state={stickerState}
            creatureCount={creatures.length}
            onOpen={() => setBookOpen(true)}
          />
        </section>
      ) : !hasStickerBook ? (
        <section
          aria-label="Sticker book empty state"
          style={{
            padding: '2rem',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card)',
            border: '2px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)' }}>
            Your sticker book is coming soon!
          </div>
        </section>
      ) : null}

      {/* Shared sections — Points / Custom Rewards / Victories per mom's
          opt-ins. Finances only on mom's explicit opt-in (founder amendment
          2026-06-12). */}
      <MyRewards member={member} variant="play" isOwnSession={isOwnSession} />

      {/* Full sticker book — opens over the page, closes back to it */}
      {bookOpen && stickerState && (
        <StickerBookDetailModal
          state={stickerState}
          memberId={memberId}
          onClose={() => setBookOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={goHome}
        style={{
          alignSelf: 'center',
          marginTop: '1rem',
          padding: '1rem 2.5rem',
          fontSize: '1.25rem',
          fontWeight: 600,
          borderRadius: 'var(--vibe-radius-button, 0.75rem)',
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-text-on-primary)',
          border: 'none',
          cursor: 'pointer',
          minHeight: '56px',
          minWidth: '200px',
        }}
      >
        Back to Home
      </button>
    </div>
  )
}
