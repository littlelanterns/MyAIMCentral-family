import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { verifyFamilyLogin } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'
import { PicturePasswordGrid } from '@/components/auth/PicturePasswordGrid'

interface LoginMember {
  member_id: string
  display_name: string
  avatar_url: string | null
  auth_method: string | null
  member_color: string | null
  dashboard_mode: string | null
  role?: string | null
}

// Shape returned by the updated verify_member_pin RPC
interface PinVerifyResult {
  success: boolean
  reason?: 'not_found' | 'invalid' | 'locked'
  attempts_remaining?: number
  locked_until?: string
  remaining_seconds?: number
}

type Step = 'family-name' | 'member-select' | 'pin-entry' | 'visual-password'

export function FamilyLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('family-name')
  const [familyName, setFamilyName] = useState('')
  // The family door (Family-Auth-Two-Door Phase 2): family login name +
  // family password are verified together, server-side. The member roster
  // is only released on a verified password — never before.
  const [familyPassword, setFamilyPassword] = useState('')
  const [_familyId, setFamilyId] = useState<string | null>(null)
  const [familyDisplayName, setFamilyDisplayName] = useState('')
  const [members, setMembers] = useState<LoginMember[]>([])
  const [selectedMember, setSelectedMember] = useState<LoginMember | null>(null)
  // True when the device holds a Family identity session (the umbrella).
  // The Hub tile only renders when this is established.
  const [familySessionActive, setFamilySessionActive] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Lockout state
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clear the countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  function startLockoutCountdown(seconds: number) {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setIsLocked(true)
    setLockoutSecondsRemaining(seconds)

    countdownRef.current = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          setIsLocked(false)
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function formatLockoutTime(seconds: number): string {
    if (seconds >= 60) {
      const mins = Math.ceil(seconds / 60)
      return `${mins} minute${mins !== 1 ? 's' : ''}`
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  /**
   * Establish the Family identity session (the device umbrella).
   * Tries direct sign-in first; on failure runs the self-healing
   * family_door_sync (creates/aligns the shadow account — gated server-side
   * by the actual family password) and retries once.
   */
  async function establishFamilySession(fId: string, password: string): Promise<boolean> {
    const email = `${fId}@family.myaimcentral.app`

    const first = await supabase.auth.signInWithPassword({ email, password })
    if (!first.error) return true

    const { data: syncData, error: syncError } = await supabase.functions.invoke(
      'family-auth-admin',
      { body: { action: 'family_door_sync', login_name: familyName.trim(), password } },
    )
    if (syncError || !syncData?.success) {
      console.warn('family_door_sync failed:', syncError?.message ?? JSON.stringify(syncData))
      return false
    }

    const retry = await supabase.auth.signInWithPassword({ email, password })
    if (retry.error) {
      console.warn('family session sign-in failed after sync:', retry.error.message)
      return false
    }
    return true
  }

  async function handleFamilyLookup(e: React.FormEvent) {
    e.preventDefault()

    if (isLocked) return

    setLoading(true)
    setError('')

    const { data, error: verifyError } = await verifyFamilyLogin(
      familyName.trim(),
      familyPassword,
    )

    if (verifyError || !data) {
      setLoading(false)
      setError('Something went wrong. Please try again.')
      return
    }

    if (data.success) {
      setFamilyId(data.family_id ?? null)
      setFamilyDisplayName(data.family_name ?? '')

      // Device umbrella: sign in as the Family identity. The Hub tile only
      // shows when this succeeds; member tiles work either way.
      const sessionOk = data.family_id
        ? await establishFamilySession(data.family_id, familyPassword)
        : false
      setFamilySessionActive(sessionOk)
      setFamilyPassword('')

      setLoading(false)

      if (data.members && data.members.length > 0) {
        setMembers(data.members)
        setStep('member-select')
      } else {
        setError('No members found for this family.')
      }
      return
    }

    setLoading(false)

    if (data.reason === 'locked') {
      startLockoutCountdown(data.remaining_seconds ?? 900)
      return
    }

    // Generic by design: never reveals whether the family name exists
    setError("That family name and password didn't match. Check both and try again, or ask mom for help.")
  }

  function handleMemberSelect(member: LoginMember) {
    setSelectedMember(member)
    setPin('')
    setError('')
    setIsLocked(false)
    setLockoutSecondsRemaining(0)
    if (countdownRef.current) clearInterval(countdownRef.current)

    // Founder Decision 5: the family password NEVER opens mom's command
    // center. The primary parent (and any full-login adult) signs in with
    // their own email credentials.
    if (member.role === 'primary_parent' || member.auth_method === 'full_login') {
      navigate('/auth/sign-in')
      return
    }

    if (member.auth_method === 'none') {
      // No personal gate (mom's choice) — safe because the device already
      // passed the family door. Under a family session the kid lands on the
      // Hub and taps their avatar; without one, legacy dashboard navigation.
      navigate(familySessionActive ? '/hub' : '/dashboard')
      return
    }

    if (member.auth_method === 'visual_password') {
      // Single-picture password (Founder Decision 13) — verified server-side
      // by PicturePasswordGrid; on success the kid gets a real session.
      setStep('visual-password')
      return
    }

    setStep('pin-entry')
  }

  function handleHubSelect() {
    // This device becomes a family device — it rests on the Hub.
    navigate('/hub')
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isLocked) return

    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.rpc('verify_member_pin', {
      p_member_id: selectedMember!.member_id,
      p_pin: pin,
    })

    setLoading(false)
    setPin('')

    if (verifyError) {
      setError('Something went wrong. Please try again.')
      return
    }

    const result = data as PinVerifyResult

    if (result.success) {
      // PIN verified — now create a real Supabase auth session
      // PIN members have auth accounts with email: {member_id}@pin.myaimcentral.app
      const pinEmail = `${selectedMember!.member_id}@pin.myaimcentral.app`
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pinEmail,
        password: pin,
      })

      if (signInError) {
        // If sign-in fails (account not created yet), still navigate
        // but the session won't persist — mom may need to re-set the PIN
        console.warn('PIN auth session failed:', signInError.message)
      }

      navigate('/dashboard')
      return
    }

    if (result.reason === 'locked') {
      const seconds = result.remaining_seconds ?? 900
      startLockoutCountdown(seconds)
      return
    }

    if (result.reason === 'invalid') {
      setError('Incorrect PIN. Please try again, or ask mom to reset it.')
      return
    }

    if (result.reason === 'not_found') {
      setError('No PIN has been set for this member. Ask the family admin to set one in Settings.')
      return
    }

    setError('Incorrect PIN. Please try again, or ask mom to reset it.')
  }

  function goBack() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (step === 'pin-entry' || step === 'visual-password') {
      setStep('member-select')
      setSelectedMember(null)
      setPin('')
      setError('')
      setIsLocked(false)
      setLockoutSecondsRemaining(0)
    } else if (step === 'member-select') {
      setStep('family-name')
      setFamilyId(null)
      setMembers([])
      setError('')
    }
  }

  return (
    <AuthPageLayout>
      <div className="max-w-md w-full space-y-6">
        {step !== 'family-name' && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm"
            style={{ color: AUTH_COLORS.textMuted }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <h1
          className="text-2xl font-bold text-center"
          style={{ color: AUTH_COLORS.text, fontFamily: 'var(--font-heading)' }}
        >
          Family Login
        </h1>

        {/* Lockout banner */}
        {isLocked && (
          <div
            className="rounded-lg px-4 py-3 text-sm text-center space-y-1"
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
            }}
          >
            <p className="font-medium">Too many tries!</p>
            <p>
              You can try again in{' '}
              <span className="font-semibold tabular-nums">
                {formatLockoutTime(lockoutSecondsRemaining)}
              </span>
              .
            </p>
            <p className="text-xs" style={{ opacity: 0.75 }}>
              {step === 'family-name'
                ? 'Ask mom for help getting in.'
                : 'Ask mom to reset your PIN if you need help getting in.'}
            </p>
          </div>
        )}

        {/* General error message */}
        {error && !isLocked && (
          <p className="text-sm text-center" style={{ color: AUTH_COLORS.error }}>
            {error}
          </p>
        )}

        {/* Step: family door — name + family password verified together */}
        {step === 'family-name' && (
          <form onSubmit={handleFamilyLookup} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Family Login Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: AUTH_COLORS.card,
                  border: `1px solid ${AUTH_COLORS.border}`,
                  color: AUTH_COLORS.text,
                }}
                placeholder="e.g., TheSmithCrew"
                required
                autoFocus
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Family Password
              </label>
              <input
                type="password"
                value={familyPassword}
                onChange={(e) => setFamilyPassword(e.target.value)}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg outline-none disabled:opacity-40"
                style={{
                  backgroundColor: AUTH_COLORS.card,
                  border: `1px solid ${AUTH_COLORS.border}`,
                  color: AUTH_COLORS.text,
                }}
                placeholder="Your family's shared password"
                required
              />
              <p className="text-xs mt-1" style={{ color: AUTH_COLORS.textMuted }}>
                Set by mom in Settings. You only need this once per device.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || isLocked || !familyName || !familyPassword}
              className="w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step: choice screen — Hub tile + member tiles.
            What gets tapped decides what this device becomes:
            Hub = family device resting on the Hub; a name = that member's
            personal device. */}
        {step === 'member-select' && (
          <div className="space-y-3">
            <p className="text-center text-sm" style={{ color: AUTH_COLORS.textMuted }}>
              {familyDisplayName}
            </p>

            {familySessionActive && (
              <button
                onClick={handleHubSelect}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                  color: '#ffffff',
                }}
              >
                <Home size={22} />
                <span className="font-medium">Family Hub</span>
                <span className="text-xs opacity-80">— shared family screen</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => (
                <button
                  key={member.member_id}
                  onClick={() => handleMemberSelect(member)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg transition-colors"
                  style={{
                    backgroundColor: AUTH_COLORS.card,
                    border: `1px solid ${AUTH_COLORS.border}`,
                  }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
                      style={{
                        backgroundColor: member.member_color || AUTH_COLORS.primary,
                        color: 'white',
                      }}
                    >
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium" style={{ color: AUTH_COLORS.text }}>
                    {member.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: PIN entry */}
        {step === 'pin-entry' && selectedMember && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-center" style={{ color: AUTH_COLORS.text }}>
              Hi, {selectedMember.display_name}!
            </p>
            <div>
              <label
                className="block text-sm font-medium mb-1 text-center"
                style={{ color: AUTH_COLORS.text }}
              >
                Enter your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={isLocked}
                className="w-full px-3 py-4 rounded-lg outline-none text-center text-2xl tracking-widest disabled:opacity-40"
                style={{
                  backgroundColor: AUTH_COLORS.card,
                  border: `1px solid ${AUTH_COLORS.border}`,
                  color: AUTH_COLORS.text,
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length < 4 || isLocked}
              className="w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
            <p className="text-xs text-center" style={{ color: AUTH_COLORS.textMuted }}>
              Forgot your PIN? Ask mom to reset it.
            </p>
          </form>
        )}

        {/* Step: Picture Password — single picture among decoys, verified
            server-side. A correct tap mints a real session (personal device). */}
        {step === 'visual-password' && selectedMember && (
          <div className="space-y-4">
            <p className="text-center" style={{ color: AUTH_COLORS.text }}>
              Hi, {selectedMember.display_name}!
            </p>
            <PicturePasswordGrid
              memberId={selectedMember.member_id}
              mode="session"
              onSuccess={() => navigate('/dashboard')}
              onEmailLoginRequired={() => navigate('/auth/sign-in')}
            />
            <p className="text-xs text-center" style={{ color: AUTH_COLORS.textMuted }}>
              Can&apos;t remember? Ask mom to reset your picture.
            </p>
          </div>
        )}

        <p className="text-center text-sm">
          <Link
            to="/auth/sign-in"
            className="underline"
            style={{ color: AUTH_COLORS.textMuted }}
          >
            Sign in with email instead
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  )
}
