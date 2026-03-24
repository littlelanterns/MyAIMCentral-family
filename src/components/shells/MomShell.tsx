import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { QuickTasks, QuickTasksNotepadBridgeProvider } from './QuickTasks'
import { LilaDrawer, LilaConversationHistory, LilaContextSettings, LilaAvatar } from '@/components/lila'
import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'
import { ThemeSelector } from '@/components/ThemeSelector'
import { TimerProvider } from '@/features/timer'
import { ViewAsShellWrapper } from '@/features/permissions'
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
  const navigate = useNavigate()
  const { gradientEnabled } = useTheme()

  function handleFloatingButton(mode: string) {
    setLilaMode(mode)
    setActiveConversation(null)
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
    <TimerProvider>
    <NotepadProvider>
    <div
      className="flex min-h-svh"
      style={{
        background: gradientEnabled
          ? 'var(--gradient-background, var(--color-bg-primary))'
          : 'var(--color-bg-primary)',
      }}
    >
      <Sidebar />

      <ViewAsShellWrapper>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right) — desktop: full row, mobile: icons only */}
        <div className="fixed top-3 right-3 md:right-12 z-30 flex items-center gap-1.5 md:gap-2">
          {/* LiLa mode buttons — hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <FloatingLilaButton avatarKey="happy_to_help" label="Help" tooltip="Customer support, troubleshooting, and FAQ" onClick={() => handleFloatingButton('help')} />
            <FloatingLilaButton avatarKey="your_guide" label="Assist" tooltip="Feature guidance, tips, and onboarding" onClick={() => handleFloatingButton('assist')} />
            <FloatingLilaButton avatarKey="smart_ai" label="Optimizer" tooltip="Craft better prompts for any AI tool" onClick={() => handleFloatingButton('optimizer')} />
          </div>
          {/* Theme + Settings — always visible, compact on mobile */}
          <ThemeSelector />
          <button
            onClick={() => navigate('/family-members')}
            className="p-2 rounded-full hover:scale-110 transition-all duration-200"
            style={{
              background: 'transparent',
              color: 'var(--color-btn-primary-bg, #68a395)',
              minHeight: 'unset',
            }}
            title="Family settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* QuickTasks strip — wired to NotepadProvider via bridge */}
        <div className="mt-0 pt-0">
          <NotepadBridgedQuickTasks />
        </div>

        {/* Main content — padding-bottom accounts for bottom nav on mobile + LiLa drawer */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-16">
          {children}
        </main>

        {/* LiLa bottom drawer — always mounted to preserve conversation state.
            Hidden behind overlays when history/context settings are open. */}
        <div style={{ display: showHistory || showContextSettings ? 'none' : undefined }}>
          <LilaDrawer
            conversation={activeConversation}
            onConversationCreated={setActiveConversation}
            onClose={() => setLilaVisible(false)}
            initialMode={lilaMode}
            onHistoryOpen={() => setShowHistory(true)}
            onContextSettingsOpen={() => setShowContextSettings(true)}
          />
        </div>

        {/* Conversation History overlay */}
        {showHistory && (
          <div
            className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 md:left-[220px]"
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
            className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 md:left-[220px]"
            style={{ height: 'min(70vh, 500px)', backgroundColor: 'var(--color-bg-card)', borderTop: '2px solid var(--color-border)' }}
          >
            <LilaContextSettings onClose={() => setShowContextSettings(false)} />
          </div>
        )}
      </div>
      </ViewAsShellWrapper>

      {/* Smart Notepad right drawer — desktop pull tab, mobile hidden (accessible via More menu) */}
      <NotepadDrawer />

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
    </NotepadProvider>
    </TimerProvider>
  )
}

/**
 * NotepadBridgedQuickTasks
 *
 * Lives inside NotepadProvider's tree so it can call useNotepadContext()
 * safely, then passes openNotepad down to QuickTasks via the bridge provider.
 */
function NotepadBridgedQuickTasks() {
  const { openNotepad } = useNotepadContext()
  return (
    <QuickTasksNotepadBridgeProvider openNotepad={openNotepad}>
      <QuickTasks />
    </QuickTasksNotepadBridgeProvider>
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
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
          minHeight: 'unset',
        }}
      >
        <LilaAvatar avatarKey={avatarKey} size={18} />
        {label}
      </button>

      {/* Speech bubble tooltip on hover */}
      {hovered && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 animate-fadeIn"
          style={{
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text, #fff)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {/* Arrow pointing up */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid var(--color-btn-primary-bg)',
            }}
          />
          {tooltip}
        </div>
      )}
    </div>
  )
}
