import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Welcome } from '@/pages/Welcome'
import { CreateAccount } from '@/pages/auth/CreateAccount'
import { SignIn } from '@/pages/auth/SignIn'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { FamilyLogin } from '@/pages/auth/FamilyLogin'
import { AcceptInvite } from '@/pages/auth/AcceptInvite'
import { Dashboard } from '@/pages/Dashboard'
import { FamilySetup } from '@/pages/FamilySetup'
import { FamilyLoginNameSetup } from '@/pages/FamilyLoginNameSetup'
import { FamilyMembers } from '@/pages/FamilyMembers'
import { PermissionHub } from '@/pages/PermissionHub'
import { GuidingStarsPage } from '@/pages/GuidingStars'
import { BestIntentionsPage } from '@/pages/BestIntentions'
import { InnerWorkingsPage } from '@/pages/InnerWorkings'
import { JournalPage } from '@/pages/Journal'
import { TasksPage } from '@/pages/Tasks'
import { ListsPage } from '@/pages/Lists'
import { StudioPage } from '@/pages/Studio'
import { DevPreview } from '@/pages/DevPreview'
import {
  VictoriesPage, TrackersPage, LifeLanternPage,
  FamilyContextPage, MorningRhythmPage, EveningReviewPage,
  MessagesPage, SafeHarborPage, MeetingsPage, BigPlansPage,
  ThoughtSiftPage, FamilyFeedPage, NotepadPage,
} from '@/pages/placeholder'
import { CalendarPage } from '@/components/calendar'
import { LanternsPathPage } from '@/pages/LanternsPath'
import { SettingsPage } from '@/pages/SettingsPage'
import { FamilyFeedsStub } from '@/pages/FamilyFeedsStub'
import { ReflectionsPage } from '@/pages/ReflectionsPage'
import { BookShelfPage } from '@/pages/BookShelfPage'
import { JournalPromptsPage } from '@/components/bookshelf/JournalPromptsPage'
import { ArchivesPage } from '@/pages/archives/ArchivesPage'
import { MemberArchiveDetail } from '@/pages/archives/MemberArchiveDetail'
import { FamilyOverviewDetail } from '@/pages/archives/FamilyOverviewDetail'
import { PrivacyFilteredPage } from '@/pages/archives/PrivacyFilteredPage'
import { ContextExportPage } from '@/pages/archives/ContextExportPage'
import { HubPage } from '@/pages/Hub'
import { VaultBrowsePage, PersonalPromptLibraryPage } from '@/features/vault'
import { ProtectedRoute, ProtectedRouteNoShell } from '@/components/ProtectedRoute'
import { ViewAsProvider } from '@/lib/permissions/ViewAsProvider'
import { ThemeProvider } from '@/lib/theme'
import { SettingsProvider } from '@/components/settings'
import { ModalManagerProvider } from '@/contexts/ModalManagerContext'
import { MinimizedPillBar } from '@/components/shared/MinimizedPillBar'
import { PlannedExpansionCard } from '@/components/shared'

/** PRD-14E stub — TV Mode route placeholder */
function HubTvStub() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <PlannedExpansionCard featureKey="family_hub_tv_route" />
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModalManagerProvider>
        <ViewAsProvider>
          <BrowserRouter>
          <SettingsProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Welcome />} />
              <Route path="/auth/create-account" element={<CreateAccount />} />
              <Route path="/auth/sign-in" element={<SignIn />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/family-login" element={<FamilyLogin />} />
              <Route path="/auth/accept-invite" element={<AcceptInvite />} />

              {/* Hub — standalone tablet/family display (no shell chrome) */}
              <Route path="/hub" element={<ProtectedRouteNoShell><HubPage /></ProtectedRouteNoShell>} />
              {/* Hub TV Mode — PRD-14E stub */}
              <Route path="/hub/tv" element={<ProtectedRouteNoShell><HubTvStub /></ProtectedRouteNoShell>} />

              {/* Dev preview — browse without auth */}
              <Route path="/preview/*" element={<DevPreview />} />

              {/* Protected routes — AuthGuard + ShellProvider + RoleRouter */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/family-setup" element={<ProtectedRoute><FamilySetup /></ProtectedRoute>} />
              <Route path="/family-login-name" element={<ProtectedRoute><FamilyLoginNameSetup /></ProtectedRoute>} />
              <Route path="/family-members" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
              <Route path="/permissions" element={<ProtectedRoute><PermissionHub /></ProtectedRoute>} />
              <Route path="/guiding-stars" element={<ProtectedRoute><GuidingStarsPage /></ProtectedRoute>} />
              <Route path="/best-intentions" element={<ProtectedRoute><BestIntentionsPage /></ProtectedRoute>} />
              <Route path="/inner-workings" element={<ProtectedRoute><InnerWorkingsPage /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/journal/reflections" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/journal/commonplace" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/journal/gratitude" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/journal/kid-quips" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><StudioPage /></ProtectedRoute>} />
              <Route path="/victories" element={<ProtectedRoute><VictoriesPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/trackers" element={<ProtectedRoute><TrackersPage /></ProtectedRoute>} />
              <Route path="/life-lantern" element={<ProtectedRoute><LifeLanternPage /></ProtectedRoute>} />
              <Route path="/family-context" element={<ProtectedRoute><FamilyContextPage /></ProtectedRoute>} />
              <Route path="/archives" element={<ProtectedRoute><ArchivesPage /></ProtectedRoute>} />
              <Route path="/archives/member/:memberId" element={<ProtectedRoute><MemberArchiveDetail /></ProtectedRoute>} />
              <Route path="/archives/family-overview" element={<ProtectedRoute><FamilyOverviewDetail /></ProtectedRoute>} />
              <Route path="/archives/privacy-filtered" element={<ProtectedRoute><PrivacyFilteredPage /></ProtectedRoute>} />
              <Route path="/archives/export" element={<ProtectedRoute><ContextExportPage /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><VaultBrowsePage /></ProtectedRoute>} />
              <Route path="/vault/my-prompts" element={<ProtectedRoute><PersonalPromptLibraryPage /></ProtectedRoute>} />
              <Route path="/reflections" element={<ProtectedRoute><ReflectionsPage /></ProtectedRoute>} />
              <Route path="/rhythms/morning" element={<ProtectedRoute><MorningRhythmPage /></ProtectedRoute>} />
              <Route path="/rhythms/evening" element={<ProtectedRoute><EveningReviewPage /></ProtectedRoute>} />
              <Route path="/lanterns-path" element={<ProtectedRoute><LanternsPathPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/feeds" element={<ProtectedRoute><FamilyFeedsStub /></ProtectedRoute>} />
              <Route path="/bookshelf" element={<ProtectedRoute><BookShelfPage /></ProtectedRoute>} />
              <Route path="/bookshelf/prompts" element={<ProtectedRoute><JournalPromptsPage /></ProtectedRoute>} />

              {/* Placeholder routes for unbuilt features — shows Coming Soon card instead of kicking out */}
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/safe-harbor" element={<ProtectedRoute><SafeHarborPage /></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
              <Route path="/bigplans" element={<ProtectedRoute><BigPlansPage /></ProtectedRoute>} />
              <Route path="/thoughtsift" element={<ProtectedRoute><ThoughtSiftPage /></ProtectedRoute>} />
              <Route path="/family-feed" element={<ProtectedRoute><FamilyFeedPage /></ProtectedRoute>} />
              <Route path="/notepad" element={<ProtectedRoute><NotepadPage /></ProtectedRoute>} />

              {/* Catch-all — redirect to dashboard if authenticated, welcome if not */}
              <Route path="*" element={<Welcome />} />
            </Routes>
          </SettingsProvider>
          </BrowserRouter>
        </ViewAsProvider>
        <MinimizedPillBar />
        </ModalManagerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
