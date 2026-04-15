import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Settings, PartyPopper } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { TimerProvider } from '@/features/timer'
import { RewardRevealProvider } from '@/components/reward-reveals/RewardRevealProvider'
import { useSettings } from '@/components/settings'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { DailyCelebration } from '@/components/victories/DailyCelebration'

interface PlayShellProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', emoji: '🏠', label: 'Home' },
  { path: '/tasks', emoji: '✅', label: 'Tasks' },
  { path: '/victories', emoji: '⭐', label: 'Stars' },
  // PRD-26 / Build M Sub-phase B: rename "Play" → "Fun" so the bottom-nav
  // label doesn't collide with the shell name. Path stays `/rewards` so
  // existing routing isn't disturbed; relabel only.
  { path: '/rewards', emoji: '🎮', label: 'Fun' },
]

export function PlayShell({ children }: PlayShellProps) {
  const { openSettings } = useSettings()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const [showCelebration, setShowCelebration] = useState(false)

  return (
    <TimerProvider>
    <RewardRevealProvider>
    <div
      className="flex flex-col min-h-svh"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Simple header with parent-locked Settings */}
      <header className="flex items-center justify-end px-4 py-2">
        <Tooltip content="Settings (parent only)">
        <button
          onClick={openSettings}
          className="p-2 rounded-full min-h-[56px] min-w-[56px] flex items-center justify-center"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none' }}
        >
          <Settings size={24} />
        </button>
        </Tooltip>
      </header>

      {/* Main content — extra padding for big touch targets */}
      <main className="flex-1 p-6 pb-24">
        {/* Prominent Celebrate! button — launches DailyCelebration overlay */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowCelebration(true)}
            className="celebrate-play-btn w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-xl font-bold transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-sparkle-gold, #D4AF37), var(--color-sparkle-gold-light, #E8C547))',
              color: 'white',
              minHeight: '56px',
              border: 'none',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 35%, transparent)',
            }}
          >
            <PartyPopper size={28} />
            Celebrate!
          </button>
        </div>

        {children}

        {/* DailyCelebration overlay */}
        {showCelebration && member?.id && family?.id && (
          <DailyCelebration
            shell="play"
            memberId={member.id}
            familyId={family.id}
            memberName={member.display_name ?? 'Friend'}
            onClose={() => setShowCelebration(false)}
          />
        )}
      </main>

      {/* Bouncy idle animation for Celebrate button */}
      <style>{`
        .celebrate-play-btn {
          animation: celebratePulse 2s ease-in-out infinite;
        }
        @keyframes celebratePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @media (prefers-reduced-motion: reduce) {
          .celebrate-play-btn { animation: none; }
        }
      `}</style>

      {/* Big bottom navigation for little fingers — emoji icons with text labels */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t py-3 z-20"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[64px] min-h-[56px] justify-center transition-transform active:scale-95"
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
              color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
            })}
          >
            <span className="text-2xl leading-none" aria-hidden="true">{item.emoji}</span>
            <span className="text-xs font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
    </RewardRevealProvider>
    </TimerProvider>
  )
}
