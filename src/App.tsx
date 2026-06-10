import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import { FamilyPasswordSetup } from '@/pages/FamilyPasswordSetup'
import { FamilyMembers } from '@/pages/FamilyMembers'
import { PermissionHub } from '@/pages/PermissionHub'
import { GuidingStarsPage } from '@/pages/GuidingStars'
import { BestIntentionsPage } from '@/pages/BestIntentions'
import { InnerWorkingsPage } from '@/pages/InnerWorkings'
import { JournalPage } from '@/pages/Journal'
import { TasksPage } from '@/pages/Tasks'
import { ListsPage } from '@/pages/Lists'
import { ShoppingModePage } from '@/pages/ShoppingMode'
import { StudioPage } from '@/pages/Studio'
import { DevPreview } from '@/pages/DevPreview'
import { GamificationShowcase } from '@/components/gamification/demo/GamificationShowcase'
import {
  VictoriesPage, TrackersPage, LifeLanternPage,
  FamilyContextPage,
  BigPlansPage,
  ThoughtSiftPage, FamilyFeedPage, NotepadPage,
} from '@/pages/placeholder'
import { RhythmsSettingsPage } from '@/pages/RhythmsSettingsPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { MeetingsPage } from '@/pages/MeetingsPage'
import { MessagesSpacePage } from '@/pages/MessagesSpacePage'
import { MessagesThreadPage } from '@/pages/MessagesThreadPage'
import { CalendarPage } from '@/components/calendar'
import { LanternsPathPage } from '@/pages/LanternsPath'
import { SettingsPage } from '@/pages/SettingsPage'
import { FamilyFeedsStub } from '@/pages/FamilyFeedsStub'
import { ReflectionsPage } from '@/pages/ReflectionsPage'
import { BookShelfPage } from '@/pages/BookShelfPage'
import { MindSweepCapture } from '@/pages/MindSweepCapture'
import { AllowanceSettingsPage } from '@/features/financial/AllowanceSettingsPage'
import { ChildAllowanceConfigPage } from '@/features/financial/ChildAllowanceConfig'
import { RoutineWeekEditPage } from '@/features/financial/RoutineWeekEditPage'
import { TransactionHistoryPage } from '@/features/financial/TransactionHistory'
import { HomeworkSettingsPage } from '@/features/financial/HomeworkSettingsPage'
import { GamificationSettingsPage } from '@/pages/GamificationSettingsPage'
import { RewardRevealLibrary } from '@/components/reward-reveals/RewardRevealLibrary'
import { PlayRewards } from '@/pages/PlayRewards'
import PrizeBoard from '@/pages/PrizeBoard'
import ContractsPage from '@/pages/ContractsPage'
import { JournalPromptsPage } from '@/components/bookshelf/JournalPromptsPage'
import { ArchivesPage } from '@/pages/archives/ArchivesPage'
import { MemberArchiveDetail } from '@/pages/archives/MemberArchiveDetail'
import { FamilyOverviewDetail } from '@/pages/archives/FamilyOverviewDetail'
import { PrivacyFilteredPage } from '@/pages/archives/PrivacyFilteredPage'
import { ContextExportPage } from '@/pages/archives/ContextExportPage'
import { HubPage } from '@/pages/Hub'
import { VaultBrowsePage, PersonalPromptLibraryPage } from '@/features/vault'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { ApprovalsPlaceholder } from '@/pages/admin/ApprovalsPlaceholder'
import { PersonasAdminPage } from '@/pages/admin/PersonasAdminPage'
import { AdminGate } from '@/components/AdminGate'
import { ProtectedRoute, ProtectedRouteNoShell } from '@/components/ProtectedRoute'
import { MomOnlyRoute } from '@/lib/permissions'
import { MyRewardsPage } from '@/pages/MyRewardsPage'
import { ViewAsProvider } from '@/lib/permissions/ViewAsProvider'
import { ThemeProvider } from '@/lib/theme'
import { SettingsProvider } from '@/components/settings'
import { ModalManagerProvider } from '@/contexts/ModalManagerContext'
import { MinimizedPillBar } from '@/components/shared/MinimizedPillBar'
import { PlannedExpansionCard } from '@/components/shared'
import { GlitchReporterFAB } from '@/components/beta/GlitchReporterFAB'
import { DiagnosticCaptureInit } from '@/components/beta/DiagnosticCaptureInit'

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
              {/* MindSweep quick-capture PWA — PRD-17B */}
              <Route path="/sweep" element={<ProtectedRouteNoShell><MindSweepCapture /></ProtectedRouteNoShell>} />

              {/* Dev preview — browse without auth */}
              <Route path="/preview/*" element={<DevPreview />} />

              {/* Gamification visual test page — PRD-24 foundation acceptance test */}
              <Route path="/dev/gamification" element={<ProtectedRoute><GamificationShowcase /></ProtectedRoute>} />

              {/* Protected routes — AuthGuard + ShellProvider + RoleRouter */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              {/* Mom-only management surfaces — <MomOnlyRoute> is the SECONDARY
                  backstop (Convention #39). Primary enforcement is sidebar
                  invisibility (Worker 2). These block only inside a View-As
                  session whose data subject is not the primary parent. */}
              <Route path="/family-setup" element={<MomOnlyRoute><FamilySetup /></MomOnlyRoute>} />
              <Route path="/family-login-name" element={<MomOnlyRoute><FamilyLoginNameSetup /></MomOnlyRoute>} />
              <Route path="/family-password" element={<MomOnlyRoute><FamilyPasswordSetup /></MomOnlyRoute>} />
              <Route path="/family-members" element={<MomOnlyRoute><FamilyMembers /></MomOnlyRoute>} />
              <Route path="/permissions" element={<MomOnlyRoute><PermissionHub /></MomOnlyRoute>} />
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
              <Route path="/shopping-mode" element={<ProtectedRoute><ShoppingModePage /></ProtectedRoute>} />
              <Route path="/studio" element={<MomOnlyRoute><StudioPage /></MomOnlyRoute>} />
              <Route path="/victories" element={<ProtectedRoute><VictoriesPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/trackers" element={<ProtectedRoute><TrackersPage /></ProtectedRoute>} />
              <Route path="/life-lantern" element={<ProtectedRoute><LifeLanternPage /></ProtectedRoute>} />
              <Route path="/family-context" element={<ProtectedRoute><FamilyContextPage /></ProtectedRoute>} />
              <Route path="/archives" element={<ProtectedRoute><ArchivesPage /></ProtectedRoute>} />
              <Route path="/archives/member/:memberId" element={<ProtectedRoute><MemberArchiveDetail /></ProtectedRoute>} />
              <Route path="/archives/family-overview" element={<MomOnlyRoute><FamilyOverviewDetail /></MomOnlyRoute>} />
              <Route path="/archives/privacy-filtered" element={<MomOnlyRoute><PrivacyFilteredPage /></MomOnlyRoute>} />
              <Route path="/archives/export" element={<MomOnlyRoute><ContextExportPage /></MomOnlyRoute>} />
              <Route path="/vault" element={<ProtectedRoute><VaultBrowsePage /></ProtectedRoute>} />
              <Route path="/vault/my-prompts" element={<ProtectedRoute><PersonalPromptLibraryPage /></ProtectedRoute>} />
              <Route path="/reflections" element={<ProtectedRoute><ReflectionsPage /></ProtectedRoute>} />
              {/* PRD-18: rhythm experiences live in the auto-open modal + dashboard
                  card. Old placeholder routes redirect to dashboard. Settings is the
                  one standalone surface for rhythm configuration. */}
              <Route path="/rhythms/morning" element={<Navigate to="/dashboard" replace />} />
              <Route path="/rhythms/evening" element={<Navigate to="/dashboard" replace />} />
              <Route path="/rhythms" element={<Navigate to="/rhythms/settings" replace />} />
              <Route path="/rhythms/settings" element={<ProtectedRoute><RhythmsSettingsPage /></ProtectedRoute>} />
              <Route path="/lanterns-path" element={<ProtectedRoute><LanternsPathPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              {/* PRD-28: Allowance & Financial routes */}
              <Route path="/settings/allowance" element={<MomOnlyRoute><AllowanceSettingsPage /></MomOnlyRoute>} />
              <Route path="/settings/allowance/:memberId" element={<MomOnlyRoute><ChildAllowanceConfigPage /></MomOnlyRoute>} />
              <Route path="/settings/allowance/:memberId/history" element={<MomOnlyRoute><RoutineWeekEditPage /></MomOnlyRoute>} />
              {/* PRD-28: Homework tracking route */}
              <Route path="/settings/homework" element={<MomOnlyRoute><HomeworkSettingsPage /></MomOnlyRoute>} />
              {/* PRD-24/PRD-26: Gamification settings */}
              <Route path="/settings/gamification" element={<MomOnlyRoute><GamificationSettingsPage /></MomOnlyRoute>} />
              {/* Reward Reveals library */}
              <Route path="/settings/reward-reveals" element={<MomOnlyRoute><RewardRevealLibrary /></MomOnlyRoute>} />
              {/* SCOPE-3.F22: Play shell "Fun" tab — dedicated rewards surface */}
              <Route path="/rewards" element={<ProtectedRoute><PlayRewards /></ProtectedRoute>} />
              {/* Kid-facing rewards surface (stub) — visibility gated per-child by
                  preferences.show_my_rewards (founder Q2a). NOT mom-only. */}
              <Route path="/my-rewards" element={<ProtectedRoute><MyRewardsPage /></ProtectedRoute>} />
              {/* Phase 3: Mom-facing prize IOU board — mom-only (Convention #39) */}
              <Route path="/prize-board" element={<MomOnlyRoute><PrizeBoard /></MomOnlyRoute>} />
              <Route path="/contracts" element={<MomOnlyRoute><ContractsPage /></MomOnlyRoute>} />
              <Route path="/finances/history" element={<ProtectedRoute><TransactionHistoryPage /></ProtectedRoute>} />
              <Route path="/feeds" element={<ProtectedRoute><FamilyFeedsStub /></ProtectedRoute>} />
              <Route path="/bookshelf" element={<ProtectedRoute><BookShelfPage /></ProtectedRoute>} />
              <Route path="/bookshelf/prompts" element={<ProtectedRoute><JournalPromptsPage /></ProtectedRoute>} />

              {/* Messages (PRD-15 Phase D) */}
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/messages/space/:spaceId" element={<ProtectedRoute><MessagesSpacePage /></ProtectedRoute>} />
              <Route path="/messages/thread/:threadId" element={<ProtectedRoute><MessagesThreadPage /></ProtectedRoute>} />

              <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />

              {/* Admin Console — SCOPE-2.F48 minimum-scope shell.
                  AdminGate = AuthGuard + hardcoded-super-admin email OR
                  staff_permissions row. No family-shell chrome per PRD-32. */}
              <Route path="/admin" element={<AdminGate><AdminLayout /></AdminGate>}>
                <Route index element={<Navigate to="approvals" replace />} />
                <Route path="approvals" element={<ApprovalsPlaceholder />} />
                <Route path="personas" element={<PersonasAdminPage />} />
              </Route>

              {/* Placeholder routes for unbuilt features — shows Coming Soon card instead of kicking out */}
              {/* /safe-harbor route removed 2026-06-09 — Safe Harbor (PRD-20) backburnered by founder decision */}
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
        <GlitchReporterFAB />
        <DiagnosticCaptureInit />
        </ModalManagerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
