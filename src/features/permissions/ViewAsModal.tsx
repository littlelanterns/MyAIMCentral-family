import { useEffect, useRef, useMemo, useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useTheme } from '@/lib/theme'
import type { ShellType } from '@/lib/theme'
import { ViewAsBanner } from './ViewAsBanner'
import { SettingsProvider } from '@/components/settings'
import { MomShell } from '@/components/shells/MomShell'
import { AdultShell } from '@/components/shells/AdultShell'
import { IndependentShell } from '@/components/shells/IndependentShell'
import { GuidedShell } from '@/components/shells/GuidedShell'
import { PlayShell } from '@/components/shells/PlayShell'

// Page imports
import { Dashboard } from '@/pages/Dashboard'
import { GuidingStarsPage } from '@/pages/GuidingStars'
import { BestIntentionsPage } from '@/pages/BestIntentions'
import { InnerWorkingsPage } from '@/pages/InnerWorkings'
import { JournalPage } from '@/pages/Journal'
import { TasksPage } from '@/pages/Tasks'
import { ListsPage } from '@/pages/Lists'
import { StudioPage } from '@/pages/Studio'
import { CalendarPage } from '@/components/calendar'
import { LanternsPathPage } from '@/pages/LanternsPath'
import { BookShelfStub } from '@/pages/BookShelfStub'
import { ArchivesPage } from '@/pages/archives/ArchivesPage'
import { VaultBrowsePage } from '@/features/vault'
import {
  VictoriesPage, TrackersPage, MorningRhythmPage, EveningReviewPage,
} from '@/pages/placeholder'

// ─── Simple state-based navigation for the modal ─────────────
// Avoids nested Router issues entirely. Sidebar/nav links call
// viewAsNavigate() instead of the real router's navigate().

interface ViewAsNavContextType {
  currentPath: string
  navigate: (path: string) => void
}

const ViewAsNavContext = createContext<ViewAsNavContextType>({
  currentPath: '/dashboard',
  navigate: () => {},
})

export function useViewAsNav() {
  return useContext(ViewAsNavContext)
}

/** Map paths to page components */
function renderPage(path: string): ReactNode {
  // Strip query params
  const clean = path.split('?')[0]
  switch (clean) {
    case '/dashboard': return <Dashboard isViewAsOverlay />
    case '/guiding-stars': return <GuidingStarsPage />
    case '/best-intentions': return <BestIntentionsPage />
    case '/inner-workings': return <InnerWorkingsPage />
    case '/journal':
    case '/journal/reflections':
    case '/journal/commonplace':
    case '/journal/gratitude':
    case '/journal/kid-quips':
      return <JournalPage />
    case '/tasks': return <TasksPage />
    case '/lists': return <ListsPage />
    case '/studio': return <StudioPage />
    case '/victories': return <VictoriesPage />
    case '/calendar': return <CalendarPage />
    case '/trackers': return <TrackersPage />
    case '/bookshelf': return <BookShelfStub />
    case '/archives': return <ArchivesPage />
    case '/vault': return <VaultBrowsePage />
    case '/rhythms/morning': return <MorningRhythmPage />
    case '/rhythms/evening': return <EveningReviewPage />
    case '/lanterns-path': return <LanternsPathPage />
    default: return <Dashboard isViewAsOverlay />
  }
}

// ─── Shell wrapper ───────────────────────────────────────────

function ShellWrapper({ shell, children }: { shell: ShellType; children: ReactNode }) {
  switch (shell) {
    case 'mom': return <MomShell>{children}</MomShell>
    case 'adult': return <AdultShell>{children}</AdultShell>
    case 'independent': return <IndependentShell>{children}</IndependentShell>
    case 'guided': return <GuidedShell>{children}</GuidedShell>
    case 'play': return <PlayShell>{children}</PlayShell>
    default: return <MomShell>{children}</MomShell>
  }
}

// ─── ViewAsModal ─────────────────────────────────────────────

export function ViewAsModal() {
  const { isViewingAs, viewingAsMember, stopViewAs } = useViewAs()
  const { theme, vibe, colorMode, gradientEnabled, fontScale, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale, setShell } = useTheme()

  const [currentPath, setCurrentPath] = useState('/dashboard')

  const navigate = useCallback((path: string) => {
    setCurrentPath(path)
  }, [])

  // Reset to dashboard when switching members
  useEffect(() => {
    if (isViewingAs) setCurrentPath('/dashboard')
  }, [viewingAsMember?.id])

  const savedThemeRef = useRef<{
    theme: string; vibe: string; colorMode: string
    gradientEnabled: boolean; fontScale: string; shell: string
  } | null>(null)

  const targetShell: ShellType = useMemo(() => {
    if (!viewingAsMember) return 'mom'
    const dm = viewingAsMember.dashboard_mode as string | null
    if (dm === 'play') return 'play'
    if (dm === 'guided') return 'guided'
    if (dm === 'independent') return 'independent'
    if (dm === 'adult') return 'adult'
    return 'mom'
  }, [viewingAsMember])

  // Apply target member's theme on enter
  useEffect(() => {
    if (!isViewingAs || !viewingAsMember) return
    if (!savedThemeRef.current) {
      savedThemeRef.current = { theme, vibe, colorMode, gradientEnabled, fontScale, shell: 'mom' }
    }
    const prefs = viewingAsMember.theme_preferences as Record<string, unknown> | null
    if (prefs) {
      if (prefs.theme) setTheme(prefs.theme as Parameters<typeof setTheme>[0])
      if (prefs.vibe) setVibe(prefs.vibe as Parameters<typeof setVibe>[0])
      if (prefs.colorMode) setColorMode(prefs.colorMode as Parameters<typeof setColorMode>[0])
      if (typeof prefs.gradientEnabled === 'boolean') setGradientEnabled(prefs.gradientEnabled)
      if (prefs.fontScale) setFontScale(prefs.fontScale as Parameters<typeof setFontScale>[0])
    }
    setShell(targetShell)
  }, [isViewingAs, viewingAsMember?.id, targetShell])

  // Restore mom's theme on exit
  useEffect(() => {
    if (!isViewingAs && savedThemeRef.current) {
      const saved = savedThemeRef.current
      setTheme(saved.theme as Parameters<typeof setTheme>[0])
      setVibe(saved.vibe as Parameters<typeof setVibe>[0])
      setColorMode(saved.colorMode as Parameters<typeof setColorMode>[0])
      setGradientEnabled(saved.gradientEnabled)
      setFontScale(saved.fontScale as Parameters<typeof setFontScale>[0])
      setShell(saved.shell as Parameters<typeof setShell>[0])
      savedThemeRef.current = null
    }
  }, [isViewingAs])

  // Lock body scroll
  useEffect(() => {
    if (isViewingAs) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isViewingAs])

  if (!isViewingAs || !viewingAsMember) return null

  return (
    <>
      {/* Backdrop — click to exit */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={() => stopViewAs()}
        style={{
          zIndex: 54,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal — full shell experience */}
      <div
        className="fixed flex flex-col overflow-hidden"
        style={{
          zIndex: 55,
          top: '1.5rem',
          left: '1.5rem',
          right: '1.5rem',
          bottom: '1.5rem',
          borderRadius: 'var(--vibe-radius-card, 16px)',
          backgroundColor: 'var(--color-bg-primary)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '2px solid var(--color-golden-honey, #d6a461)',
        }}
      >
        {/* View As banner pinned to top */}
        <div className="shrink-0" style={{ zIndex: 2, position: 'relative' }}>
          <ViewAsBanner />
        </div>

        {/* Shell + page content with state-based navigation.
            transform: translateZ(0) creates a new containing block so that
            fixed-position elements inside the shell (floating buttons, etc.)
            position relative to this container, not the viewport. */}
        <div className="flex-1 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
          <ViewAsNavContext.Provider value={{ currentPath, navigate }}>
            <SettingsProvider>
              <ShellWrapper shell={targetShell}>
                {renderPage(currentPath)}
              </ShellWrapper>
            </SettingsProvider>
          </ViewAsNavContext.Provider>
        </div>
      </div>
    </>
  )
}
