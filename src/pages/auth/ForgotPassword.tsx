import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '@/lib/supabase/auth'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await resetPassword(email)

    // Always show success — never reveal whether email exists
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <AuthPageLayout>
      <div className="max-w-md w-full space-y-6">
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: AUTH_COLORS.text, fontFamily: 'var(--font-heading)' }}
        >
          Reset Your Password
        </h1>

        {submitted ? (
          <div className="text-center space-y-4">
            <p style={{ color: AUTH_COLORS.text }}>
              If an account exists with this email, you'll receive a reset link.
            </p>
            <Link
              to="/auth/sign-in"
              className="inline-block py-2 px-6 rounded-lg font-medium"
              style={{
                backgroundColor: AUTH_COLORS.card,
                border: `1px solid ${AUTH_COLORS.border}`,
                color: AUTH_COLORS.text,
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-sm" style={{ color: AUTH_COLORS.textMuted }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                  color: '#ffffff',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-sm">
              <Link to="/auth/sign-in" className="underline" style={{ color: AUTH_COLORS.textMuted }}>
                Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthPageLayout>
  )
}
