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
  VictoriesPage, CalendarPage, TrackersPage, LifeLanternPage,
  FamilyContextPage, ArchivesPage, MorningRhythmPage, EveningReviewPage, SettingsPage,
} from '@/pages/placeholder'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ViewAsProvider } from '@/lib/permissions/ViewAsProvider'
import { ThemeProvider } from '@/lib/theme'

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
        <ViewAsProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Welcome />} />
              <Route path="/auth/create-account" element={<CreateAccount />} />
              <Route path="/auth/sign-in" element={<SignIn />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/family-login" element={<FamilyLogin />} />
              <Route path="/auth/accept-invite" element={<AcceptInvite />} />

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
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><StudioPage /></ProtectedRoute>} />
              <Route path="/victories" element={<ProtectedRoute><VictoriesPage /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/trackers" element={<ProtectedRoute><TrackersPage /></ProtectedRoute>} />
              <Route path="/life-lantern" element={<ProtectedRoute><LifeLanternPage /></ProtectedRoute>} />
              <Route path="/family-context" element={<ProtectedRoute><FamilyContextPage /></ProtectedRoute>} />
              <Route path="/archives" element={<ProtectedRoute><ArchivesPage /></ProtectedRoute>} />
              <Route path="/rhythms/morning" element={<ProtectedRoute><MorningRhythmPage /></ProtectedRoute>} />
              <Route path="/rhythms/evening" element={<ProtectedRoute><EveningReviewPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Welcome />} />
            </Routes>
          </BrowserRouter>
        </ViewAsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
