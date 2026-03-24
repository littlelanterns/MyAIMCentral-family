import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { LilaDrawer, LilaConversationHistory, LilaContextSettings, LilaAvatar } from '@/components/lila'
import { NotepadDrawer } from '@/components/notepad'
import { ThemeSelector } from '@/components/ThemeSelector'
import { useTheme } from '@/lib/theme'
import type { LilaConversation } from '@/hooks/useLila'

interface MomShellProps {
  children: ReactNode
}

export function MomShell({ children }: MomShellProps) {
  const [activeConversation, setActiveConversation] = useState<LilaConversation | null>(null)
  const [lilaVisible, setLilaVisible] = useState(true)
  const [lilaMode, setLilaMode] = useState<string | undefined>(undefined)
  const [showHistory, setShowHistory] = useState(false)
  const [showContextSettings, setShowContextSettings] = useState(false)
  const { gradientEnabled } = useTheme()

  function handleFloatingButton(mode: string) {
    setLilaMode(mode)
    setActiveConversation(null) // Start new conversation in this mode
    setLilaVisible(true)
    setShowHistory(false)
    setShowContextSettings(false)
  }

  function handleHistorySelect(conv: LilaConversation) {
    setActiveConversation(conv)
    setLilaMode(conv.mode || 'general')
    setShowHistory(false)
  }

  return (
    <div
      className="flex min-h-svh"
      style={{
        background: gradientEnabled
          ? 'var(--gradient-background, var(--color-bg-primary))'
          : 'var(--color-bg-primary)',
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right): Theme + three LiLa modes (PRD-05) */}
        <div className="fixed top-3 right-12 z-30 flex items-center gap-2">
          <FloatingLilaButton avatarKey="happy_to_help" label="Help" tooltip="Customer support, troubleshooting, and FAQ" onClick={() => handleFloatingButton('help')} />
          <FloatingLilaButton avatarKey="your_guide" label="Assist" tooltip="Feature guidance, tips, and onboarding" onClick={() => handleFloatingButton('assist')} />
          <FloatingLilaButton avatarKey="smart_ai" label="Optimizer" tooltip="Craft better prompts for any AI tool" onClick={() => handleFloatingButton('optimizer')} />
          <ThemeSelector />
        </div>

        {/* Main content — extra padding for drawers */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16">
          {children}
        </main>

        {/* LiLa bottom drawer with pull tab */}
        {lilaVisible && !showHistory && !showContextSettings && (
          <LilaDrawer
            conversation={activeConversation}
            onConversationCreated={setActiveConversation}
            onClose={() => setLilaVisible(false)}
            initialMode={lilaMode}
            onHistoryOpen={() => setShowHistory(true)}
            onContextSettingsOpen={() => setShowContextSettings(true)}
          />
        )}

        {/* Conversation History overlay (replaces drawer content) */}
        {showHistory && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 md:left-[220px]"
            style={{ height: 'min(70vh, 500px)', backgroundColor: 'var(--color-bg-card)', borderTop: '2px solid var(--color-border)' }}
          >
            <LilaConversationHistory
              onConversationSelect={handleHistorySelect}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {/* Context Settings overlay */}
        {showContextSettings && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 md:left-[220px]"
            style={{ height: 'min(70vh, 500px)', backgroundColor: 'var(--color-bg-card)', borderTop: '2px solid var(--color-border)' }}
          >
            <LilaContextSettings onClose={() => setShowContextSettings(false)} />
          </div>
        )}
      </div>

      {/* Smart Notepad right drawer with pull tab */}
      <NotepadDrawer />
    </div>
  )
}

function FloatingLilaButton({
  avatarKey,
  label,
  tooltip,
  onClick,
}: {
  avatarKey: string
  label: string
  tooltip: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-btn-primary-bg)',
        color: 'var(--color-btn-primary-text)',
        minHeight: 'unset',
      }}
      title={tooltip}
    >
      <LilaAvatar avatarKey={avatarKey} size={18} />
      {label}
    </button>
  )
}
