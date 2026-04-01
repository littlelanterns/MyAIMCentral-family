import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Trophy, BarChart3, Settings, PenLine } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { LilaModalTrigger } from '@/components/lila'
import { TimerProvider } from '@/features/timer'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useSettings } from '@/components/settings'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { WriteDrawerProvider, useWriteDrawer } from '@/hooks/useWriteDrawer'
import { WriteDrawer } from '@/components/guided/WriteDrawer'

interface GuidedShellProps {
  children: ReactNode
}

/** Nav items that use NavLink routing */
const routeNavItems = [
  { path: '/dashboard', icon: <Home size={22} />, label: 'Home' },
  { path: '/tasks', icon: <CheckSquare size={22} />, label: 'Tasks' },
  // "Write" is handled separately as a drawer trigger (not a route)
  { path: '/victories', icon: <Trophy size={22} />, label: 'Victories' },
  { path: '/trackers', icon: <BarChart3 size={22} />, label: 'Progress' },
]

export function GuidedShell({ children }: GuidedShellProps) {
  return (
    <WriteDrawerProvider>
      <TimerProvider>
        <GuidedShellInner>{children}</GuidedShellInner>
      </TimerProvider>
    </WriteDrawerProvider>
  )
}

function GuidedShellInner({ children }: { children: ReactNode }) {
  const { data: member } = useFamilyMember()
  const { openSettings } = useSettings()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { openDrawer } = useWriteDrawer()

  // Show the viewed-as member's name when in View As mode
  const displayMember = isViewingAs && viewingAsMember ? viewingAsMember : member

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div>
          <h1
            className="text-lg font-medium"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
          >
            {greeting}, {displayMember?.display_name || 'Friend'}!
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Write something">
            <button
              onClick={() => openDrawer('notepad')}
              className="p-2 rounded-full"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <PenLine size={20} />
            </button>
          </Tooltip>
          <LilaModalTrigger modeKey="guided_communication_coach" label="LiLa" />
          <button
            onClick={openSettings}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Write Drawer — slides from right */}
      <WriteDrawer />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t py-2 z-20"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {routeNavItems.map((item, idx) => {
          // Insert Write button after Tasks (index 1)
          const elements = []
          elements.push(
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
              style={({ isActive }) => ({
                color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
              })}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </NavLink>
          )

          if (idx === 1) {
            // Write button — opens drawer instead of navigating
            elements.push(
              <WriteNavButton key="write" />
            )
          }

          return elements
        })}
      </nav>
    </div>
  )
}

/** Write button in bottom nav — opens drawer instead of routing */
function WriteNavButton() {
  const { openDrawer, isOpen } = useWriteDrawer()

  // PRD-25 Phase C: Unread message badge placeholder — wired when PRD-15 is built
  const unreadCount = 0

  return (
    <button
      onClick={() => openDrawer('notepad')}
      className="relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
      style={{
        color: isOpen ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
        background: 'transparent',
      }}
    >
      <PenLine size={22} />
      <span className="text-xs">Write</span>
      {unreadCount > 0 && (
        <span
          className="absolute top-0.5 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
