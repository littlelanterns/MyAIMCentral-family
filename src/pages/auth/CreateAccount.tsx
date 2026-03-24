import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'

export function CreateAccount() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tosAccepted, setTosAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function getPasswordStrength(pw: string): { label: string; color: string } {
    if (pw.length < 8) return { label: 'Weak', color: 'var(--color-error, #b25a58)' }
    if (pw.length < 12) return { label: 'Medium', color: 'var(--color-warning, #b99c34)' }
    return { label: 'Strong', color: 'var(--color-success, #4b7c66)' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!displayName.trim()) newErrors.displayName = 'Name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!tosAccepted) newErrors.tos = 'You must accept the Terms of Service'

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
        setErrors({ form: 'Something went wrong. Please try again.' })
      }
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  const strength = password ? getPasswordStrength(password) : null

  return (
    <div
      className="min-h-svh flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-bg-primary, var(--theme-background))' }}
    >
      <div className="max-w-md w-full space-y-6">
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: 'var(--color-text-heading, var(--theme-text))', fontFamily: 'var(--font-heading)' }}
        >
          Create Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p
              className="text-sm p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary, var(--theme-surface))',
                color: 'var(--color-error, var(--theme-error))',
              }}
            >
              {errors.form}
            </p>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary, var(--theme-text))' }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--color-bg-card, var(--theme-surface))',
                border: `1px solid ${errors.displayName ? 'var(--color-error, #b25a58)' : 'var(--color-border, var(--theme-border))'}`,
                color: 'var(--color-text-primary, var(--theme-text))',
              }}
              placeholder="What should we call you?"
            />
            {errors.displayName && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error, #b25a58)' }}>
                {errors.displayName}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary, var(--theme-text))' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--color-bg-card, var(--theme-surface))',
                border: `1px solid ${errors.email ? 'var(--color-error, #b25a58)' : 'var(--color-border, var(--theme-border))'}`,
                color: 'var(--color-text-primary, var(--theme-text))',
              }}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error, #b25a58)' }}>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary, var(--theme-text))' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-card, var(--theme-surface))',
                  border: `1px solid ${errors.password ? 'var(--color-error, #b25a58)' : 'var(--color-border, var(--theme-border))'}`,
                  color: 'var(--color-text-primary, var(--theme-text))',
                }}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
            >
              At least 8 characters
            </p>
            {strength && (
              <p className="text-sm mt-0.5" style={{ color: strength.color }}>
                {strength.label}
              </p>
            )}
            {errors.password && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error, #b25a58)' }}>
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary, var(--theme-text))' }}
            >
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--color-bg-card, var(--theme-surface))',
                border: `1px solid ${errors.confirmPassword ? 'var(--color-error, #b25a58)' : 'var(--color-border, var(--theme-border))'}`,
                color: 'var(--color-text-primary, var(--theme-text))',
              }}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error, #b25a58)' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              className="mt-1 rounded"
            />
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-primary, var(--theme-text))' }}
            >
              I agree to the{' '}
              <a href="/terms" className="underline" style={{ color: 'var(--color-btn-primary-bg, var(--theme-primary))' }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline" style={{ color: 'var(--color-btn-primary-bg, var(--theme-primary))' }}>
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.tos && (
            <p className="text-sm" style={{ color: 'var(--color-error, #b25a58)' }}>
              {errors.tos}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg, var(--theme-primary))',
              color: 'var(--color-btn-primary-text, #fff)',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p
          className="text-center text-sm"
          style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
        >
          Already have an account?{' '}
          <Link
            to="/auth/sign-in"
            className="underline"
            style={{ color: 'var(--color-btn-primary-bg, var(--theme-primary))' }}
          >
            Sign In
          </Link>
        </p>

        <p
          className="text-center text-xs"
          style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
        >
          Joining a family? Use your invite link instead.
        </p>
      </div>
    </div>
  )
}
