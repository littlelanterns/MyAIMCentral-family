import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Settings } from 'lucide-react'
import { LilaDrawer } from '@/components/lila'
import type { LilaConversation } from '@/hooks/useLila'

interface MomShellProps {
  children: ReactNode
}

export function MomShell({ children }: MomShellProps) {
  const [activeConversation, setActiveConversation] = useState<LilaConversation | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(true)

  return (
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right) */}
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
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

        {/* Main content — extra bottom padding for LiLa drawer trigger */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16">
          {children}
        </main>

        {/* LiLa bottom drawer */}
        {drawerVisible && (
          <LilaDrawer
            conversation={activeConversation}
            onConversationCreated={setActiveConversation}
            onClose={() => setDrawerVisible(false)}
          />
        )}
      </div>

      {/* STUB: Smart Notepad right drawer — Phase 09 */}
    </div>
  )
}
