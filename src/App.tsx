import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Welcome } from '@/pages/Welcome'
import { CreateAccount } from '@/pages/auth/CreateAccount'
import { SignIn } from '@/pages/auth/SignIn'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { FamilyLogin } from '@/pages/auth/FamilyLogin'
import { Dashboard } from '@/pages/Dashboard'
import { GuidingStarsPage } from '@/pages/GuidingStars'
import { InnerWorkingsPage } from '@/pages/InnerWorkings'
import { JournalPage } from '@/pages/Journal'
import { TasksPage } from '@/pages/Tasks'
import { ListsPage } from '@/pages/Lists'
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

              {/* Protected routes — AuthGuard + ShellProvider + RoleRouter */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/guiding-stars" element={<ProtectedRoute><GuidingStarsPage /></ProtectedRoute>} />
              <Route path="/inner-workings" element={<ProtectedRoute><InnerWorkingsPage /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />

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
