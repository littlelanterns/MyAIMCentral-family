import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Settings, PartyPopper } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { TimerProvider } from '@/features/timer'
import { useSettings } from '@/components/settings'

interface PlayShellProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', emoji: '🏠', label: 'Home' },
  { path: '/tasks', emoji: '✅', label: 'Tasks' },
  { path: '/victories', emoji: '⭐', label: 'Stars' },
  { path: '/rewards', emoji: '🎮', label: 'Play' },
]

export function PlayShell({ children }: PlayShellProps) {
  const navigate = useNavigate()
  const { openSettings } = useSettings()

  return (
    <TimerProvider>
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
        {/* Prominent Celebrate! button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => navigate('/victories?new=1')}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold transition-transform active:scale-95"
            style={{
              backgroundColor: 'var(--color-victory, #d6a461)',
              color: 'white',
              minHeight: '56px',
            }}
          >
            <PartyPopper size={24} />
            Celebrate!
          </button>
        </div>

        {children}
      </main>

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
    </TimerProvider>
  )
}
