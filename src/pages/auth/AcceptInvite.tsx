/*
 * AcceptInvite — /auth/accept-invite?token=xxx
 *
 * PRD-01: Invite acceptance flow for family members.
 * Handles both new-user signup and existing-user sign-in paths.
 * After auth, calls accept_family_invite RPC to link the auth.user
 * to the pending family_members row (bypasses RLS — SECURITY DEFINER).
 *
 * ============================================================
 * MIGRATION NEEDED: supabase/migrations/00000000000022_accept_invite_rpc.sql
 * ============================================================
 *
 * -- RPC: accept_family_invite
 * -- Called after auth signup/signin to link the authenticated user
 * -- to the pending family_member row identified by the invite token.
 * -- SECURITY DEFINER: runs as the function owner, bypassing RLS.
 * -- The RLS on family_members only allows primary_parent to UPDATE,
 * -- so we must use SECURITY DEFINER here for the invitee to self-link.
 *
 * CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token TEXT)
 * RETURNS JSONB AS $$
 * DECLARE
 *   v_member RECORD;
 * BEGIN
 *   SELECT * INTO v_member FROM public.family_members
 *   WHERE invite_token = p_token
 *     AND invite_status = 'pending'
 *     AND (invite_expires_at IS NULL OR invite_expires_at > now());
 *
 *   IF NOT FOUND THEN
 *     RETURN jsonb_build_object('success', false, 'reason', 'invalid_or_expired');
 *   END IF;
 *
 *   -- Guard: do not overwrite an already-linked user_id
 *   IF v_member.user_id IS NOT NULL THEN
 *     RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
 *   END IF;
 *
 *   UPDATE public.family_members
 *   SET user_id        = auth.uid(),
 *       invite_status  = 'accepted',
 *       auth_method    = 'full_login',
 *       invite_token   = NULL
 *   WHERE id = v_member.id;
 *
 *   RETURN jsonb_build_object(
 *     'success',      true,
 *     'member_id',    v_member.id,
 *     'family_id',    v_member.family_id,
 *     'display_name', v_member.display_name
 *   );
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * -- Restrict execution to authenticated users only
 * REVOKE ALL ON FUNCTION public.accept_family_invite(TEXT) FROM PUBLIC;
 * GRANT EXECUTE ON FUNCTION public.accept_family_invite(TEXT) TO authenticated;
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { FeatureGuide } from '@/components/shared'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'

// ── Types ────────────────────────────────────────────────────────────────────

interface InviteRecord {
  id: string
  family_id: string
  display_name: string
  role: string
  invite_expires_at: string | null
  families: {
    family_name: string
  }
}

type TokenState =
  | { status: 'loading' }
  | { status: 'valid'; member: InviteRecord }
  | { status: 'invalid'; reason: 'no_token' | 'expired' | 'already_used' | 'not_found' }

type AuthPath = 'new_user' | 'existing_user'

// ── Component ─────────────────────────────────────────────────────────────────

export function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [tokenState, setTokenState] = useState<TokenState>({ status: 'loading' })
  const [authPath, setAuthPath] = useState<AuthPath>('new_user')

  // New-user form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Existing-user form state
  const [existingEmail, setExistingEmail] = useState('')
  const [existingPassword, setExistingPassword] = useState('')
  const [showExistingPassword, setShowExistingPassword] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // ── Token validation on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setTokenState({ status: 'invalid', reason: 'no_token' })
      return
    }

    async function validateToken() {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, family_id, display_name, role, invite_expires_at, families(family_name)')
        .eq('invite_token', token)
        .single()

      if (error || !data) {
        setTokenState({ status: 'invalid', reason: 'not_found' })
        return
      }

      const member = data as unknown as InviteRecord

      // Check status — the token may exist but already be accepted or expired
      const { data: statusCheck } = await supabase
        .from('family_members')
        .select('invite_status, invite_expires_at')
        .eq('invite_token', token)
        .single()

      if (!statusCheck) {
        setTokenState({ status: 'invalid', reason: 'not_found' })
        return
      }

      if (statusCheck.invite_status === 'accepted') {
        setTokenState({ status: 'invalid', reason: 'already_used' })
        return
      }

      if (statusCheck.invite_status === 'expired') {
        setTokenState({ status: 'invalid', reason: 'expired' })
        return
      }

      if (
        statusCheck.invite_expires_at &&
        new Date(statusCheck.invite_expires_at) < new Date()
      ) {
        setTokenState({ status: 'invalid', reason: 'expired' })
        return
      }

      setTokenState({ status: 'valid', member })
    }

    validateToken()
  }, [token])

  // ── After auth: call the RPC to link user to family_member ───────────────

  async function linkUserToInvite(): Promise<boolean> {
    const { data, error } = await supabase.rpc('accept_family_invite', {
      p_token: token,
    })

    if (error) {
      setErrors({ form: 'Something went wrong linking your account. Please try again.' })
      return false
    }

    const result = data as { success: boolean; reason?: string; display_name?: string }

    if (!result.success) {
      if (result.reason === 'already_accepted') {
        setTokenState({ status: 'invalid', reason: 'already_used' })
        return false
      }
      if (result.reason === 'invalid_or_expired') {
        setTokenState({ status: 'invalid', reason: 'expired' })
        return false
      }
      setErrors({ form: 'Unable to accept this invite. Please contact your family admin.' })
      return false
    }

    return true
  }

  // ── New user: sign up then link ───────────────────────────────────────────

  async function handleNewUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    const displayName =
      tokenState.status === 'valid' ? tokenState.member.display_name : 'Family Member'

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setErrors({ email: 'An account with this email already exists. Sign in instead.' })
      } else {
        setErrors({ form: signUpError.message })
      }
      setLoading(false)
      return
    }

    if (!signUpData.user) {
      setErrors({ form: 'Account creation failed. Please try again.' })
      setLoading(false)
      return
    }

    const linked = await linkUserToInvite()
    if (!linked) {
      setLoading(false)
      return
    }

    setSuccessMessage(`Welcome, ${displayName}! Redirecting to your dashboard...`)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  // ── Existing user: sign in then link ─────────────────────────────────────

  async function handleExistingUserSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!existingEmail.trim()) newErrors.existingEmail = 'Email is required'
    if (!existingPassword) newErrors.existingPassword = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: existingEmail,
      password: existingPassword,
    })

    if (signInError || !signInData.user) {
      setErrors({ existingForm: 'Invalid email or password. Please try again.' })
      setLoading(false)
      return
    }

    const linked = await linkUserToInvite()
    if (!linked) {
      setLoading(false)
      return
    }

    const displayName =
      tokenState.status === 'valid' ? tokenState.member.display_name : 'Family Member'

    setSuccessMessage(`Welcome, ${displayName}! Redirecting to your dashboard...`)
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  // ── Password strength helper ──────────────────────────────────────────────

  function passwordStrength(pw: string): { label: string; color: string } {
    if (pw.length < 8) return { label: 'Weak', color: AUTH_COLORS.error }
    if (pw.length < 12) return { label: 'Medium', color: 'var(--color-warning, #b99c34)' }
    return { label: 'Strong', color: 'var(--color-success, #4b7c66)' }
  }

  const strength = password ? passwordStrength(password) : null

  // ── Shared style helpers ──────────────────────────────────────────────────

  const inputStyle = (hasError?: boolean) => ({
    backgroundColor: AUTH_COLORS.card,
    border: `1px solid ${hasError ? AUTH_COLORS.error : AUTH_COLORS.border}`,
    color: AUTH_COLORS.text,
  })

  // ── Render: loading ───────────────────────────────────────────────────────

  if (tokenState.status === 'loading') {
    return (
      <AuthPageLayout>
        <p style={{ color: AUTH_COLORS.textMuted }}>
          Validating your invite link...
        </p>
      </AuthPageLayout>
    )
  }

  // ── Render: invalid token ─────────────────────────────────────────────────

  if (tokenState.status === 'invalid') {
    const messages: Record<typeof tokenState.reason, { heading: string; body: string }> = {
      no_token: {
        heading: 'Invalid invite link',
        body: 'This link is missing the invite token. Ask mom to generate a new invite link from Family Members in Settings.',
      },
      not_found: {
        heading: 'Invalid invite link',
        body: 'This invite link is not valid. Ask mom to generate a new invite link from Family Members in Settings.',
      },
      expired: {
        heading: 'This invite has expired',
        body: 'Invite links are valid for 7 days. Ask mom to generate a new invite link from Family Members in Settings.',
      },
      already_used: {
        heading: 'This invite has already been accepted',
        body: 'This invite link has already been used. If you need access, sign in to your existing account.',
      },
    }

    const msg = messages[tokenState.reason]

    return (
      <AuthPageLayout>
        <div className="max-w-md w-full space-y-4">
          <div
            className="flex items-start gap-3 rounded-xl p-5"
            style={{
              backgroundColor: AUTH_COLORS.card,
              border: `1px solid ${AUTH_COLORS.error}`,
            }}
          >
            <AlertCircle
              size={22}
              className="shrink-0 mt-0.5"
              style={{ color: AUTH_COLORS.error }}
            />
            <div>
              <p
                className="font-semibold mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                {msg.heading}
              </p>
              <p
                className="text-sm"
                style={{ color: AUTH_COLORS.textMuted }}
              >
                {msg.body}
              </p>
            </div>
          </div>
          {tokenState.reason === 'already_used' && (
            <a
              href="/auth/sign-in"
              className="block w-full text-center py-3 px-6 rounded-lg font-medium"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              Sign In
            </a>
          )}
        </div>
      </AuthPageLayout>
    )
  }

  // ── Render: success ───────────────────────────────────────────────────────

  if (successMessage) {
    return (
      <AuthPageLayout>
        <div
          className="flex items-center gap-3 rounded-xl p-5 max-w-md w-full"
          style={{
            backgroundColor: AUTH_COLORS.card,
            border: `1px solid ${AUTH_COLORS.success}`,
          }}
        >
          <CheckCircle
            size={22}
            className="shrink-0"
            style={{ color: AUTH_COLORS.success }}
          />
          <p style={{ color: AUTH_COLORS.text }}>
            {successMessage}
          </p>
        </div>
      </AuthPageLayout>
    )
  }

  // ── Render: valid invite ──────────────────────────────────────────────────

  const { member } = tokenState
  const familyName = member.families?.family_name ?? 'Your family'

  return (
    <AuthPageLayout>
      <div className="max-w-md w-full space-y-6">

        {/* FeatureGuide */}
        <FeatureGuide
          featureKey="accept_invite"
          title="You've been invited!"
          description="Create an account or sign in to join your family on MyAIM Central."
        />

        {/* Invite header */}
        <div className="text-center space-y-2">
          <h1
            className="text-2xl font-bold"
            style={{
              color: AUTH_COLORS.text,
              fontFamily: 'var(--font-heading)',
            }}
          >
            You're invited to join
          </h1>
          <p
            className="text-lg font-semibold"
            style={{ color: AUTH_COLORS.primary }}
          >
            {familyName}
          </p>
          <p
            className="text-sm"
            style={{ color: AUTH_COLORS.textMuted }}
          >
            Joining as{' '}
            <span style={{ color: AUTH_COLORS.text }}>
              {member.display_name}
            </span>
          </p>
        </div>

        {/* Path toggle */}
        <div
          className="flex rounded-lg p-1 gap-1"
          style={{ backgroundColor: AUTH_COLORS.bgSecondary }}
        >
          <button
            type="button"
            onClick={() => { setAuthPath('new_user'); setErrors({}) }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
            style={
              authPath === 'new_user'
                ? {
                    backgroundColor: AUTH_COLORS.card,
                    color: AUTH_COLORS.text,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }
                : {
                    color: AUTH_COLORS.textMuted,
                  }
            }
          >
            <UserPlus size={15} />
            New Account
          </button>
          <button
            type="button"
            onClick={() => { setAuthPath('existing_user'); setErrors({}) }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
            style={
              authPath === 'existing_user'
                ? {
                    backgroundColor: AUTH_COLORS.card,
                    color: AUTH_COLORS.text,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }
                : {
                    color: AUTH_COLORS.textMuted,
                  }
            }
          >
            <LogIn size={15} />
            I Have an Account
          </button>
        </div>

        {/* ── NEW USER FORM ────────────────────────────────────────────────── */}
        {authPath === 'new_user' && (
          <form onSubmit={handleNewUserSubmit} className="space-y-4">
            <p
              className="text-sm"
              style={{ color: AUTH_COLORS.textMuted }}
            >
              Create a new MyAIM Central account to join {familyName}.
            </p>

            {errors.form && (
              <p
                className="text-sm p-3 rounded-lg"
                style={{
                  backgroundColor: AUTH_COLORS.bgSecondary,
                  color: AUTH_COLORS.error,
                }}
              >
                {errors.form}
              </p>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={inputStyle(!!errors.email)}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: AUTH_COLORS.textMuted }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: AUTH_COLORS.textMuted }}
              >
                At least 8 characters
              </p>
              {strength && (
                <p className="text-sm mt-0.5" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              )}
              {errors.password && (
                <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={inputStyle(!!errors.confirmPassword)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              {loading ? 'Creating Account...' : `Create Account & Join ${familyName}`}
            </button>
          </form>
        )}

        {/* ── EXISTING USER FORM ───────────────────────────────────────────── */}
        {authPath === 'existing_user' && (
          <form onSubmit={handleExistingUserSubmit} className="space-y-4">
            <p
              className="text-sm"
              style={{ color: AUTH_COLORS.textMuted }}
            >
              Sign in to your existing account to accept this invite.
            </p>

            {errors.existingForm && (
              <p
                className="text-sm p-3 rounded-lg"
                style={{
                  backgroundColor: AUTH_COLORS.bgSecondary,
                  color: AUTH_COLORS.error,
                }}
              >
                {errors.existingForm}
              </p>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Email
              </label>
              <input
                type="email"
                value={existingEmail}
                onChange={(e) => setExistingEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={inputStyle(!!errors.existingEmail)}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {errors.existingEmail && (
                <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>
                  {errors.existingEmail}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showExistingPassword ? 'text' : 'password'}
                  value={existingPassword}
                  onChange={(e) => setExistingPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                  style={inputStyle(!!errors.existingPassword)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowExistingPassword(!showExistingPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: AUTH_COLORS.textMuted }}
                  aria-label={showExistingPassword ? 'Hide password' : 'Show password'}
                >
                  {showExistingPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.existingPassword && (
                <p className="text-sm mt-1" style={{ color: AUTH_COLORS.error }}>
                  {errors.existingPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-medium transition-opacity disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              {loading ? 'Signing In...' : `Sign In & Join ${familyName}`}
            </button>

            <p
              className="text-center text-sm"
              style={{ color: AUTH_COLORS.textMuted }}
            >
              Forgot your password?{' '}
              <a
                href="/auth/forgot-password"
                className="underline"
                style={{ color: AUTH_COLORS.primary }}
              >
                Reset it here
              </a>
            </p>
          </form>
        )}
      </div>
    </AuthPageLayout>
  )
}
