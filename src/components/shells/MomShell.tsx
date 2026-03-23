import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Settings } from 'lucide-react'

interface MomShellProps {
  children: ReactNode
}

export function MomShell({ children }: MomShellProps) {
  return (
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right) */}
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
          {/* STUB: LiLa Help, Assist, Optimizer avatars — Phase 06 */}
          <button
            className="p-2 rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)',
              boxShadow: 'var(--shadow-sm)',
            }}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* STUB: LiLa bottom drawer — Phase 06 */}
      </div>

      {/* STUB: Smart Notepad right drawer — Phase 09 */}
    </div>
  )
}
