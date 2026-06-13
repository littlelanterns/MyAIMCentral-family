import { useEffect, useRef, useMemo, useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useTheme } from '@/lib/theme'
import type { ShellType } from '@/lib/theme'
import { ViewAsBanner } from './ViewAsBanner'
import { ViewAsTimeoutWarningBanner } from './ViewAsTimeoutWarningBanner'
import { ErrorBoundary } from '@/components/shared'
import { SettingsProvider } from '@/components/settings'
import { MomShell } from '@/components/shells/MomShell'
import { AdultShell } from '@/components/shells/AdultShell'
import { IndependentShell } from '@/components/shells/IndependentShell'
import { GuidedShell } from '@/components/shells/GuidedShell'
import { PlayShell } from '@/components/shells/PlayShell'
import { getSidebarSections } from '@/components/shells/Sidebar'
import { getShellForMember } from '@/components/shells/ShellProvider'
import { useResolvedFeatureAccess } from '@/hooks/useResolvedFeatureAccess'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'

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
import { BookShelfPage } from '@/pages/BookShelfPage'
import { ArchivesPage } from '@/pages/archives/ArchivesPage'
import { MemberArchiveDetail } from '@/pages/archives/MemberArchiveDetail'
import { FamilyOverviewDetail } from '@/pages/archives/FamilyOverviewDetail'
import { VaultBrowsePage, PersonalPromptLibraryPage } from '@/features/vault'
import { ReflectionsPage } from '@/pages/ReflectionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { JournalPromptsPage } from '@/components/bookshelf/JournalPromptsPage'
import {
  VictoriesPage, TrackersPage, MorningRhythmPage, EveningReviewPage,
  LifeLanternPage, FamilyContextPage,
  BigPlansPage, FamilyFeedPage, NotepadPage,
} from '@/pages/placeholder'
import { MessagesPage } from '@/pages/MessagesPage'
import { MeetingsPage } from '@/pages/MeetingsPage'
import { MyRewardsPage } from '@/pages/MyRewardsPage'
import { PlayRewards } from '@/pages/PlayRewards'
import { ShoppingModePage } from '@/pages/ShoppingMode'
import { RhythmsSettingsPage } from '@/pages/RhythmsSettingsPage'
import { FamilyFeedsStub } from '@/pages/FamilyFeedsStub'
import PrizeBoard from '@/pages/PrizeBoard'
import ContractsPage from '@/pages/ContractsPage'
import { useShowMyRewards } from '@/hooks/useShowMyRewards'

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

/** Map paths to page components — must stay in sync with App.tsx routes */
function renderPage(path: string): ReactNode {
  // Strip query params
  const clean = path.split('?')[0]

  // Dynamic routes (prefix matching)
  if (clean.startsWith('/archives/member/')) return <MemberArchiveDetail />

  switch (clean) {
    case '/dashboard': return <Dashboard isViewAsOverlay />

    // Personal Growth
    case '/guiding-stars': return <GuidingStarsPage />
    case '/best-intentions': return <BestIntentionsPage />
    case '/inner-workings': return <InnerWorkingsPage />
    case '/journal':
    case '/journal/reflections':
    case '/journal/commonplace':
    case '/journal/gratitude':
    case '/journal/kid-quips':
      return <JournalPage />
    case '/reflections': return <ReflectionsPage />
    case '/life-lantern': return <LifeLanternPage />
    case '/lanterns-path': return <LanternsPathPage />

    // Plan & Do
    case '/tasks': return <TasksPage />
    case '/lists': return <ListsPage />
    case '/shopping-mode': return <ShoppingModePage />
    case '/my-rewards': return <MyRewardsPage />
    // Play shell "Fun" tab (KIDS-REWARDS-PAGE Slice 2 eyes-on fix — was
    // unmapped, so every Play nav tap fell through to the dashboard)
    case '/rewards': return <PlayRewards />
    case '/studio': return <StudioPage />
    case '/prize-board': return <PrizeBoard />
    case '/contracts': return <ContractsPage />
    case '/calendar': return <CalendarPage />
    case '/victories': return <VictoriesPage />
    case '/trackers': return <TrackersPage />
    case '/bigplans': return <BigPlansPage />
    case '/notepad': return <NotepadPage />

    // Family
    case '/family-context': return <FamilyContextPage />
    case '/archives': return <ArchivesPage />
    case '/archives/family-overview': return <FamilyOverviewDetail />
    case '/messages': return <MessagesPage />
    case '/meetings': return <MeetingsPage />
    // '/safe-harbor' removed 2026-06-09 — PRD-20 backburnered (PRIVACY_ROUTE_MAP entry kept as defensive gate)
    case '/feeds': return <FamilyFeedsStub />
    case '/family-feed': return <FamilyFeedPage />

    // AI & Tools
    case '/vault': return <VaultBrowsePage />
    case '/vault/my-prompts': return <PersonalPromptLibraryPage />
    case '/bookshelf': return <BookShelfPage />
    case '/bookshelf/prompts': return <JournalPromptsPage />

    // Rhythms
    case '/rhythms/settings': return <RhythmsSettingsPage />
    case '/rhythms/morning': return <MorningRhythmPage />
    case '/rhythms/evening': return <EveningReviewPage />

    // Settings
    case '/settings': return <SettingsPage />

    default: return <Dashboard isViewAsOverlay />
  }
}

// ─── Privacy-protected route mapping ────────────────────────
// Routes mapped to feature keys that may be excluded from View As sessions.
// When a feature key is in excludedFeatures, its route renders a blocked message.
const PRIVACY_ROUTE_MAP: Record<string, string> = {
  '/safe-harbor': 'safe_harbor',
}

function PrivacyBlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
      >
        <Lock size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        Private Feature
      </h2>
      <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
        This feature is private and not available in View As mode. The family member can access it by logging in directly.
      </p>
    </div>
  )
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
  const { isViewingAs, viewingAsMember, stopViewAs, excludedFeatures } = useViewAs()
  const { theme, vibe, colorMode, gradientEnabled, fontScale, setTheme, setVibe, setColorMode, setGradientEnabled, setFontScale, setShell } = useTheme()

  const [currentPath, setCurrentPath] = useState('/dashboard')

  // Match the rendered shell's sidebar: the per-child "My Rewards" entry is
  // gated by preferences.show_my_rewards on the View-As target (data subject).
  // Without threading this through, the modal's allowedPaths would redirect
  // /my-rewards to /dashboard even though Sidebar.tsx renders the entry.
  const showMyRewards = useShowMyRewards(viewingAsMember?.id)

  // Derive the modal's shell from the SAME role-aware mapping the sidebar
  // uses (getShellForMember). The previous inline derivation keyed on
  // dashboard_mode ONLY, which disagreed with the sidebar for a
  // primary_parent target (role → 'mom', but a non-null dashboard_mode like
  // 'adult' fell through to 'adult'). That mismatch made allowedPaths exclude
  // mom-only routes the sidebar still rendered (Studio, Prize Board,
  // RewardRules), so clicking them silently bounced to /dashboard. Single
  // source of truth fixes the disagreement.
  const targetShell: ShellType = useMemo(() => {
    if (!viewingAsMember) return 'mom'
    return getShellForMember(viewingAsMember.role, viewingAsMember.dashboard_mode)
  }, [viewingAsMember])

  // PERMISSIONS-WIRING (2026-06-09): allowedPaths must mirror the rendered
  // sidebar's per-member toggle filtering + management grants, or granted
  // entries (e.g. Studio for a granted dad target) would render in the
  // sidebar and silently bounce here.
  const { isEnabled } = useResolvedFeatureAccess(viewingAsMember)
  const grants = useManagementGrants(viewingAsMember)

  // Build allowed routes from the target shell's sidebar sections
  const allowedPaths = useMemo(() => {
    const managementAccess =
      viewingAsMember?.role === 'additional_adult'
        ? {
            studio: grants.studioLevel !== 'none',
            prizeBoard: grants.financeMaxLevel !== 'none',
            rewardRules: grants.rewardRulesLevel !== 'none',
          }
        : undefined
    const sections = getSidebarSections(targetShell, { showMyRewards, isFeatureEnabled: isEnabled, managementAccess })
    const paths = new Set<string>(['/dashboard', '/settings'])
    for (const section of sections) {
      for (const item of section.items) {
        paths.add(item.path.split('?')[0])
      }
    }
    // Play shell has NO sidebar (getSidebarSections returns []) — its
    // purpose-built bottom nav is the navigation map. Without these, every
    // Play nav tap bounced to /dashboard inside the modal (founder eyes-on
    // 2026-06-12, KIDS-REWARDS-PAGE Slice 2).
    if (targetShell === 'play') {
      // Home + Fun only (founder 2026-06-12). Stars retired (Victories on the
      // Fun page); Tasks retired (Play kids complete on the dashboard via
      // PlayTaskTileGrid — no standalone adult Tasks page for Play).
      paths.add('/rewards')
    }
    return paths
  }, [targetShell, showMyRewards, isEnabled, viewingAsMember?.role, grants.studioLevel, grants.financeMaxLevel, grants.rewardRulesLevel])

  const navigate = useCallback((path: string) => {
    const cleanPath = path.split('?')[0]
    if (allowedPaths.has(cleanPath)) {
      setCurrentPath(path)
    } else {
      setCurrentPath('/dashboard')
    }
  }, [allowedPaths])

  // Reset to dashboard when switching members
  useEffect(() => {
    if (isViewingAs) setCurrentPath('/dashboard')
  }, [viewingAsMember?.id])

  const savedThemeRef = useRef<{
    theme: string; vibe: string; colorMode: string
    gradientEnabled: boolean; fontScale: string; shell: string
  } | null>(null)

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
          // Creates a containing block so position:fixed elements inside
          // shells (bottom navs, floating buttons) stay within the modal
          // bounds instead of escaping to the viewport.
          transform: 'translateZ(0)',
        }}
      >
        {/* View As banner pinned to top */}
        <div className="shrink-0" style={{ zIndex: 2, position: 'relative' }}>
          <ViewAsBanner />
          {/* Inactivity warning — mounted only here (inside the open modal) so
              its idle timers arm exactly while the modal is visible (Conv. #39). */}
          <ViewAsTimeoutWarningBanner />
        </div>

        {/* Shell + page content — scrollable area.
            Wrapped in an ErrorBoundary so a render-time throw inside the kid's
            view (e.g. a duplicate-mount assumption like the NotificationBell
            realtime collision) degrades to a friendly fallback instead of
            black-screening the whole app. The ViewAsBanner above stays OUTSIDE
            the boundary so Exit/Return-to-Hub remains usable even if the inner
            content fails; the fallback also offers its own Exit affordance. */}
        <div className="flex-1 overflow-y-auto">
          <ErrorBoundary
            // Re-mount the boundary (clearing its error state) when the
            // View-As target or the current page changes, so navigating away
            // from a crashed view recovers automatically.
            key={`${viewingAsMember.id}:${currentPath.split('?')[0]}`}
            action={
              <button
                type="button"
                onClick={() => stopViewAs()}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                Exit View As
              </button>
            }
          >
            <ViewAsNavContext.Provider value={{ currentPath, navigate }}>
              <SettingsProvider>
                <ShellWrapper shell={targetShell}>
                  {(() => {
                    const cleanPath = currentPath.split('?')[0]
                    const featureKey = PRIVACY_ROUTE_MAP[cleanPath]
                    if (featureKey && excludedFeatures.includes(featureKey)) {
                      return <PrivacyBlockedPage />
                    }
                    return renderPage(currentPath)
                  })()}
                </ShellWrapper>
              </SettingsProvider>
            </ViewAsNavContext.Provider>
          </ErrorBoundary>
        </div>
      </div>
    </>
  )
}
