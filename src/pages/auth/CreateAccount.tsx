import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '@/lib/supabase/auth'

export function CreateAccount() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function getPasswordStrength(pw: string): { label: string; color: string } {
    if (pw.length < 8) return { label: 'Too short', color: 'var(--theme-error)' }
    if (pw.length < 12) return { label: 'Medium', color: 'var(--theme-warning)' }
    return { label: 'Strong', color: 'var(--theme-success)' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!displayName.trim()) newErrors.displayName = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    const { error } = await signUp(email, password, displayName.trim())

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ email: 'An account with this email already exists. Sign in instead?' })
      } else {
        setErrors({ form: error.message })
      }
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  const strength = password ? getPasswordStrength(password) : null

  return (
    <div className="min-h-svh flex items-center justify-center p-8"
         style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--theme-text)' }}>
          Create Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm" style={{ color: 'var(--theme-error)' }}>{errors.form}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--theme-surface)',
                border: `1px solid ${errors.displayName ? 'var(--theme-error)' : 'var(--theme-border)'}`,
                color: 'var(--theme-text)',
              }}
              placeholder="What should we call you?"
            />
            {errors.displayName && (
              <p className="text-sm mt-1" style={{ color: 'var(--theme-error)' }}>{errors.displayName}</p>
            )}
          </div>

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
                border: `1px solid ${errors.email ? 'var(--theme-error)' : 'var(--theme-border)'}`,
                color: 'var(--theme-text)',
              }}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm mt-1" style={{ color: 'var(--theme-error)' }}>{errors.email}</p>
            )}
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
                border: `1px solid ${errors.password ? 'var(--theme-error)' : 'var(--theme-border)'}`,
                color: 'var(--theme-text)',
              }}
              placeholder="At least 8 characters"
            />
            {strength && (
              <p className="text-sm mt-1" style={{ color: strength.color }}>{strength.label}</p>
            )}
            {errors.password && (
              <p className="text-sm mt-1" style={{ color: 'var(--theme-error)' }}>{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--theme-surface)',
                border: `1px solid ${errors.confirmPassword ? 'var(--theme-error)' : 'var(--theme-border)'}`,
                color: 'var(--theme-text)',
              }}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-sm mt-1" style={{ color: 'var(--theme-error)' }}>{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="underline" style={{ color: 'var(--theme-primary)' }}>
            Sign In
          </Link>
        </p>

        <p className="text-center text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Joining a family? Use your invite link instead.
        </p>
      </div>
    </div>
  )
}
