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
 * Creatures (Slice 3, 2026-06-12): the sticker book is now the shared
 * Creatures SECTION of <MyRewards> (the swipe-strip CreaturePageFrame), gated
 * by mom's `creatures` section opt-in. The page no longer renders its own
 * PlayStickerBookWidget block — one creature surface, the new §13 interaction.
 *
 * View As: uses the EFFECTIVE member so mom sees the same page the kid sees
 * (Convention #39).
 */

import { useNavigate } from 'react-router-dom'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { MyRewards } from '@/components/rewards/MyRewards'

export function PlayRewards() {
  const navigate = useNavigate()
  const { member, isViewAs } = useEffectiveMember()
  const { data: authMember } = useFamilyMember()
  const memberId = member?.id
  const { data: creatures = [] } = useCreaturesForMember(memberId)

  const goHome = () => navigate('/dashboard')

  if (!member || !memberId) {
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

      {/* Shared sections — Creatures (swipe-strip sticker book) / Coloring /
          Points / Custom Rewards / Victories per mom's opt-ins. Finances only
          on mom's explicit opt-in (founder amendment 2026-06-12). */}
      <MyRewards member={member} variant="play" isOwnSession={isOwnSession} />

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
