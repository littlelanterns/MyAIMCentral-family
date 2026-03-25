import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Settings } from 'lucide-react'
import { LilaModalTrigger } from '@/components/lila'
import { TimerProvider } from '@/features/timer'
import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'
import { QuickTasks, QuickTasksNotepadBridgeProvider } from './QuickTasks'
import { useSettings } from '@/components/settings'

interface AdultShellProps {
  children: ReactNode
}

/**
 * Adult Shell — PRD-04/05
 * Dad/additional adults get permission-gated LiLa modal access (no drawer).
 */
export function AdultShell({ children }: AdultShellProps) {
  const { openSettings } = useSettings()

  return (
    <TimerProvider>
    <NotepadProvider>
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
          <LilaModalTrigger modeKey="higgins_say" label="LiLa" />
          <button
            onClick={openSettings}
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

        <AdultNotepadBridgedQuickTasks />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <NotepadDrawer />
    </div>
    </NotepadProvider>
    </TimerProvider>
  )
}

function AdultNotepadBridgedQuickTasks() {
  const { openNotepad } = useNotepadContext()
  return (
    <QuickTasksNotepadBridgeProvider openNotepad={openNotepad}>
      <QuickTasks />
    </QuickTasksNotepadBridgeProvider>
  )
}
