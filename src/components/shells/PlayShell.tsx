import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Trophy, Gift } from 'lucide-react'

interface PlayShellProps {
  children: ReactNode
}

export function PlayShell({ children }: PlayShellProps) {
  const navItems = [
    { path: '/dashboard', icon: <Home size={28} />, label: '🏠' },
    { path: '/tasks', icon: <CheckSquare size={28} />, label: '✅' },
    { path: '/victories', icon: <Trophy size={28} />, label: '🌟' },
    { path: '/rewards', icon: <Gift size={28} />, label: '🎁' },
  ]

  return (
    <div
      className="flex flex-col min-h-svh"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Main content — extra padding for big touch targets */}
      <main className="flex-1 p-6 pb-24">
        {children}
      </main>

      {/* Big bottom navigation for little fingers */}
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
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[64px] transition-transform active:scale-95"
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
              color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
            })}
          >
            {item.icon}
            <span className="text-lg">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
