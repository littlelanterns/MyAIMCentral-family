import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '@/lib/supabase/auth'

export function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await signIn(email, password)

    if (authError) {
      // Security-conscious: never reveal whether email exists
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-8"
         style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--theme-text)' }}>
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm" style={{ color: 'var(--theme-error)' }}>{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link
            to="/auth/forgot-password"
            className="text-sm underline block"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Forgot Password?
          </Link>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            New here?{' '}
            <Link to="/auth/create-account" className="underline" style={{ color: 'var(--theme-primary)' }}>
              Create an Account
            </Link>
          </p>
          <Link
            to="/auth/family-login"
            className="text-sm underline block"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Family Member Login
          </Link>
        </div>
      </div>
    </div>
  )
}
