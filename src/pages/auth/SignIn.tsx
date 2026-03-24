import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/supabase/auth'

export function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-svh flex items-center justify-center p-8"
         style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm p-3 rounded-lg"
               style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                placeholder="Your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--color-text-secondary)' }}
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
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link
            to="/auth/forgot-password"
            className="text-sm underline block"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Forgot Password?
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            New here?{' '}
            <Link to="/auth/create-account" className="underline" style={{ color: 'var(--color-btn-primary-bg)' }}>
              Create an Account
            </Link>
          </p>
          <Link
            to="/auth/family-login"
            className="text-sm underline block"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Family Member Login
          </Link>
        </div>
      </div>
    </div>
  )
}
