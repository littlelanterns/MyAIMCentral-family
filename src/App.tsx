import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Welcome } from '@/pages/Welcome'
import { CreateAccount } from '@/pages/auth/CreateAccount'
import { SignIn } from '@/pages/auth/SignIn'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { FamilyLogin } from '@/pages/auth/FamilyLogin'
import { Dashboard } from '@/pages/Dashboard'
import { AuthGuard } from '@/components/AuthGuard'
import { ViewAsProvider } from '@/lib/permissions/ViewAsProvider'
import { ThemeProvider } from '@/lib/theme'
import { ShellProvider } from '@/components/shells/ShellProvider'
import { RoleRouter } from '@/components/shells/RoleRouter'

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

              {/* Protected routes — wrapped in ShellProvider + RoleRouter */}
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <ShellProvider>
                      <RoleRouter>
                        <Dashboard />
                      </RoleRouter>
                    </ShellProvider>
                  </AuthGuard>
                }
              />

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
