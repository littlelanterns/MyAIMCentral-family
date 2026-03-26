import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'

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
    if (pw.length < 8) return { label: 'Weak', color: AUTH_COLORS.error }
    if (pw.length < 12) return { label: 'Medium', color: AUTH_COLORS.warning }
    return { label: 'Strong', color: AUTH_COLORS.success }
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

  const inputStyle = (hasError?: boolean) => ({
    backgroundColor: AUTH_COLORS.card,
    border: `1px solid ${hasError ? AUTH_COLORS.error : AUTH_COLORS.border}`,
    color: AUTH_COLORS.text,
  })

  return (
    <AuthPageLayout>
      <div className="max-w-md w-full space-y-6">
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: AUTH_COLORS.text, fontFamily: 'var(--font-heading)' }}
        >
          Create Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p
              className="text-sm p-3 rounded-lg"
              style={{ backgroundColor: AUTH_COLORS.bgSecondary, color: AUTH_COLORS.error }}
            >
              {errors.form}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: AUTH_COLORS.text }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={inputStyle(!!errors.displayName)}
              placeholder="What should we call you?"
            />
            {errors.displayName && (
              <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: AUTH_COLORS.text }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={inputStyle(!!errors.email)}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>{errors.email}</p>
            )}
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
                style={inputStyle(!!errors.password)}
                placeholder="Create a password"
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
            <p className="text-xs mt-1" style={{ color: AUTH_COLORS.textMuted }}>
              At least 8 characters
            </p>
            {strength && (
              <p className="text-sm mt-0.5" style={{ color: strength.color }}>{strength.label}</p>
            )}
            {errors.password && (
              <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: AUTH_COLORS.text }}>
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={inputStyle(!!errors.confirmPassword)}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>{errors.confirmPassword}</p>
            )}
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              className="mt-1 rounded"
            />
            <span className="text-sm" style={{ color: AUTH_COLORS.text }}>
              I agree to the{' '}
              <a href="/terms" className="underline" style={{ color: AUTH_COLORS.primary }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline" style={{ color: AUTH_COLORS.primary }}>
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.tos && (
            <p className="text-sm" style={{ color: AUTH_COLORS.error }}>{errors.tos}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
              color: '#ffffff',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: AUTH_COLORS.textMuted }}>
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="underline" style={{ color: AUTH_COLORS.primary }}>
            Sign In
          </Link>
        </p>

        <p className="text-center text-xs" style={{ color: AUTH_COLORS.textMuted }}>
          Joining a family? Use your invite link instead.
        </p>
      </div>
    </AuthPageLayout>
  )
}
