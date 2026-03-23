import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { LilaDrawer } from '@/components/lila'
import { NotepadDrawer } from '@/components/notepad'
import { ThemeSelector } from '@/components/ThemeSelector'
import type { LilaConversation } from '@/hooks/useLila'

interface MomShellProps {
  children: ReactNode
}

export function MomShell({ children }: MomShellProps) {
  const [activeConversation, setActiveConversation] = useState<LilaConversation | null>(null)
  const [lilaVisible, setLilaVisible] = useState(true)

  return (
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right) */}
        <div className="fixed top-3 right-12 z-30 flex items-center gap-2">
          <ThemeSelector />
        </div>

        {/* Main content — extra padding for drawers */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16">
          {children}
        </main>

        {/* LiLa bottom drawer with pull tab */}
        {lilaVisible && (
          <LilaDrawer
            conversation={activeConversation}
            onConversationCreated={setActiveConversation}
            onClose={() => setLilaVisible(false)}
          />
        )}
      </div>

      {/* Smart Notepad right drawer with pull tab */}
      <NotepadDrawer />
    </div>
  )
}
