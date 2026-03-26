import { useState, useCallback, type ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { useAutoCollapse } from '@/hooks/useAutoCollapse'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { QuickTasks, QuickTasksNotepadBridgeProvider } from './QuickTasks'
import { LilaDrawer, LilaConversationHistory, LilaContextSettings, LilaAvatar, LilaModal } from '@/components/lila'
import { ToolLauncherProvider } from '@/components/lila/ToolLauncherProvider'
import { NotepadDrawer, NotepadProvider, useNotepadContext } from '@/components/notepad'
import { ThemeSelector } from '@/components/ThemeSelector'
import { TimerProvider } from '@/features/timer'
import { RoutingToastProvider } from '@/components/shared'
import { ViewAsShellWrapper } from '@/features/permissions'
import { useTheme } from '@/lib/theme'
import { useSettings } from '@/components/settings'
import type { LilaConversation } from '@/hooks/useLila'
import { assembleContext, createContextSnapshot } from '@/lib/ai/context-assembly'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'

interface MomShellProps {
  children: ReactNode
}

export function MomShell({ children }: MomShellProps) {
  const [activeConversation, setActiveConversation] = useState<LilaConversation | null>(null)
  const [_lilaVisible, setLilaVisible] = useState(true)
  const [lilaMode, setLilaMode] = useState<string | undefined>(undefined)
  const [showHistory, setShowHistory] = useState(false)
  const [showContextSettings, setShowContextSettings] = useState(false)
  const [showExpandedModal, setShowExpandedModal] = useState(false)
  const { gradientEnabled } = useTheme()
  const { openSettings } = useSettings()
  const { mainRef, quickTasksAutoCollapsed } = useAutoCollapse()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()

  const handleRefreshContext = useCallback(async () => {
    if (!currentFamily?.id || !currentMember?.id || !activeConversation?.id) return
    const bundle = await assembleContext(currentFamily.id, currentMember.id, currentMember.role)
    const snapshot = createContextSnapshot(bundle)
    await supabase
      .from('lila_conversations')
      .update({ context_snapshot: snapshot })
      .eq('id', activeConversation.id)
  }, [currentFamily?.id, currentMember?.id, currentMember?.role, activeConversation?.id])

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
    // Open in expanded modal for better readability
    setShowExpandedModal(true)
  }

  return (
    <TimerProvider>
    <RoutingToastProvider>
    <NotepadProvider>
    <ToolLauncherProvider>
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
      <div ref={mainRef} className="flex-1 flex flex-col min-w-0">
        {/* Floating buttons (top-right) — desktop: full row, mobile: icons only */}
        <div className="fixed top-3 right-3 md:right-12 z-30 flex items-center gap-1.5 md:gap-2">
          {/* LiLa mode buttons — icon-only circles, always visible */}
          <div className="flex items-center gap-1.5">
            <FloatingLilaButton avatarKey="happy_to_help" label="Help" tooltip="Customer support & troubleshooting" onClick={() => handleFloatingButton('help')} />
            <FloatingLilaButton avatarKey="your_guide" label="Assist" tooltip="Feature guidance & onboarding" onClick={() => handleFloatingButton('assist')} />
            <FloatingLilaButton avatarKey="smart_ai" label="Optimizer" tooltip="Craft better prompts for any AI" onClick={() => handleFloatingButton('optimizer')} />
          </div>
          {/* Theme + Settings — always visible, compact on mobile */}
          <ThemeSelector />
          <button
            onClick={openSettings}
            className="p-2 rounded-full hover:scale-110 transition-all duration-200"
            style={{
              background: 'transparent',
              color: 'var(--color-btn-primary-bg, #68a395)',
              minHeight: 'unset',
            }}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Spacer for fixed FAB bar on mobile */}
        <div className="h-12 md:h-0" />

        {/* QuickTasks strip — wired to NotepadProvider via bridge */}
        <NotepadBridgedQuickTasks forceCollapsed={quickTasksAutoCollapsed} />

        {/* Main content — padding-bottom accounts for bottom nav on mobile + LiLa drawer */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-16">
          {children}
        </main>

        {/* LiLa bottom drawer — always mounted to preserve conversation state.
            Hidden behind overlays when history/context settings are open. */}
        <div style={{ display: _lilaVisible && !showHistory && !showContextSettings ? undefined : 'none' }}>
          <LilaDrawer
            conversation={activeConversation}
            onConversationCreated={setActiveConversation}
            onClose={() => setLilaVisible(false)}
            initialMode={lilaMode}
            onHistoryOpen={() => setShowHistory(true)}
            onContextSettingsOpen={() => setShowContextSettings(true)}
            onExpandToModal={() => setShowExpandedModal(true)}
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

        {/* Expanded LiLa modal — fullscreen conversation view */}
        {showExpandedModal && activeConversation && (
          <LilaModal
            modeKey={activeConversation.guided_mode || activeConversation.mode || 'general'}
            onClose={() => setShowExpandedModal(false)}
            existingConversation={activeConversation}
          />
        )}

        {/* Context Settings overlay */}
        {showContextSettings && (
          <div
            className="fixed bottom-14 md:bottom-0 left-0 right-0 z-30 md:left-[220px]"
            style={{ height: 'min(70vh, 500px)', backgroundColor: 'var(--color-bg-card)', borderTop: '2px solid var(--color-border)' }}
          >
            <LilaContextSettings
              onClose={() => setShowContextSettings(false)}
              hasActiveConversation={!!activeConversation}
              onRefreshContext={handleRefreshContext}
            />
          </div>
        )}
      </div>
      </ViewAsShellWrapper>

      {/* Smart Notepad right drawer — desktop pull tab, mobile hidden (accessible via More menu) */}
      <NotepadDrawer />

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
    </ToolLauncherProvider>
    </NotepadProvider>
    </RoutingToastProvider>
    </TimerProvider>
  )
}

/**
 * NotepadBridgedQuickTasks
 *
 * Lives inside NotepadProvider's tree so it can call useNotepadContext()
 * safely, then passes openNotepad down to QuickTasks via the bridge provider.
 */
function NotepadBridgedQuickTasks({ forceCollapsed }: { forceCollapsed?: boolean }) {
  const { openNotepad } = useNotepadContext()
  return (
    <QuickTasksNotepadBridgeProvider openNotepad={openNotepad}>
      <QuickTasks forceCollapsed={forceCollapsed} />
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
        className="flex items-center justify-center rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
        style={{
          width: '36px',
          height: '36px',
          background: 'var(--surface-primary, var(--color-btn-primary-bg))',
          border: 'none',
          minHeight: 'unset',
          padding: 0,
        }}
        aria-label={`${label} — ${tooltip}`}
        title={label}
      >
        <LilaAvatar avatarKey={avatarKey} size={22} />
      </button>

      {/* Speech bubble tooltip on hover — desktop only */}
      {hovered && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-50 animate-fadeIn pointer-events-none"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text, #fff)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
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
          <span className="font-semibold">{label}</span>
          <span className="opacity-75"> — {tooltip}</span>
        </div>
      )}
    </div>
  )
}
