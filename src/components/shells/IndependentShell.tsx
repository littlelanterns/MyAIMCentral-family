import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Settings } from 'lucide-react'
import { LilaModalTrigger } from '@/components/lila'

interface IndependentShellProps {
  children: ReactNode
}

/**
 * Independent Shell — PRD-04/05
 * Teens get permission-gated LiLa modal access (no drawer).
 */
export function IndependentShell({ children }: IndependentShellProps) {
  return (
    <div className="flex min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="fixed top-3 right-3 z-30 flex items-center gap-2">
          <LilaModalTrigger modeKey="higgins_say" label="LiLa" />
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

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
