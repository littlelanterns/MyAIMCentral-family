/**
 * PlayRewards — SCOPE-3.F22 fix
 *
 * Dedicated "Fun" / rewards surface for Play shell. Tapped from the
 * 🎮 Fun bottom-nav tab. Renders a focused view of the kid's sticker
 * book + earned prizes so Rewards stands on its own as a destination,
 * not just "the home page's sticker book widget in disguise."
 *
 * Thin by design:
 *   - Reuses PlayStickerBookWidget and StickerBookDetailModal state
 *     machinery so the look matches what they already see on the
 *     dashboard.
 *   - Reuses PrizeBox for earned-but-unredeemed prizes.
 *   - No new business logic. No new DB queries beyond what those
 *     components already do.
 *
 * Routing: `/rewards` — registered in App.tsx. Rendered inside
 * PlayShell via ProtectedRoute → RoleRouter. The audit finding
 * (SCOPE-3.F22) was that /rewards was unrouted; this is the
 * registered surface.
 */

import { useNavigate } from 'react-router-dom'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { StickerBookDetailModal } from '@/components/play-dashboard/StickerBookDetailModal'
import { PrizeBox } from '@/components/reward-reveals/PrizeBox'

export function PlayRewards() {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const memberId = member?.id
  const { data: stickerState, isLoading: stickerLoading } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)

  const goHome = () => navigate('/dashboard')

  if (!memberId || stickerLoading) {
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
  // show prizes if they exist, plus a warm empty state for the book.
  const hasStickerBook = stickerState !== null && stickerState !== undefined

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

      {hasStickerBook && stickerState ? (
        <section aria-label="Sticker book">
          <StickerBookDetailModal
            state={stickerState}
            memberId={memberId}
            onClose={goHome}
          />
        </section>
      ) : (
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
      )}

      <section aria-label="Earned prizes">
        <PrizeBox
          memberId={memberId}
          currentMemberId={memberId}
          canRedeem={false}
          variant="fun"
        />
      </section>

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
