import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/supabase/auth'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'
import { useAuth } from '@/hooks/useAuth'

export function SignIn() {
  const navigate = useNavigate()
  const { user: existingUser, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already authenticated, redirect to dashboard. This must come AFTER
  // the hook calls above — early returns before hooks violate rules-of-hooks.
  if (!authLoading && existingUser) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await signIn(email, password)

      if (authError) {
        // PRD-01: Never reveal whether an email exists. Always show generic message.
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      if (data?.user) {
        navigate('/dashboard')
      } else {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout>
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center"
            style={{ color: AUTH_COLORS.text, fontFamily: 'var(--font-heading)' }}>
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm p-3 rounded-lg"
               style={{ backgroundColor: AUTH_COLORS.bgSecondary, color: AUTH_COLORS.error }}>
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: AUTH_COLORS.text }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: AUTH_COLORS.card,
                border: `1px solid ${AUTH_COLORS.border}`,
                color: AUTH_COLORS.text,
              }}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: AUTH_COLORS.text }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                style={{
                  backgroundColor: AUTH_COLORS.card,
                  border: `1px solid ${AUTH_COLORS.border}`,
                  color: AUTH_COLORS.text,
                }}
                placeholder="Your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                style={{ color: AUTH_COLORS.textMuted }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
              color: '#ffffff',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link
            to="/auth/forgot-password"
            className="text-sm underline block"
            style={{ color: AUTH_COLORS.textMuted }}
          >
            Forgot Password?
          </Link>
          <p className="text-sm" style={{ color: AUTH_COLORS.textMuted }}>
            New here?{' '}
            <Link to="/auth/create-account" className="underline" style={{ color: AUTH_COLORS.primary }}>
              Create an Account
            </Link>
          </p>
          <Link
            to="/auth/family-login"
            className="text-sm underline block"
            style={{ color: AUTH_COLORS.textMuted }}
          >
            Family Member Login
          </Link>
        </div>
      </div>
    </AuthPageLayout>
  )
}
