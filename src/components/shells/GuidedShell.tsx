import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, BookOpen, Trophy, BarChart3, Settings } from 'lucide-react'
import { LilaModalTrigger } from '@/components/lila'

interface GuidedShellProps {
  children: ReactNode
}

export function GuidedShell({ children }: GuidedShellProps) {
  const navItems = [
    { path: '/dashboard', icon: <Home size={22} />, label: 'Home' },
    { path: '/tasks', icon: <CheckSquare size={22} />, label: 'Tasks' },
    { path: '/journal', icon: <BookOpen size={22} />, label: 'Journal' },
    { path: '/victories', icon: <Trophy size={22} />, label: 'Victories' },
    { path: '/trackers', icon: <BarChart3 size={22} />, label: 'Progress' },
  ]

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <h1
          className="text-lg font-medium"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
        >
          MyAIM
        </h1>
        <div className="flex items-center gap-2">
          <LilaModalTrigger modeKey="guided_communication_coach" label="LiLa" />
          <button className="p-2 rounded-full" style={{ color: 'var(--color-text-secondary)' }}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t py-2 z-20"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px]"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
            })}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
