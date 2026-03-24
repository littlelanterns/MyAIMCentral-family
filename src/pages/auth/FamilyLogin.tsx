import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { lookupFamilyByLoginName, getFamilyLoginMembers } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface LoginMember {
  member_id: string
  display_name: string
  avatar_url: string | null
  login_method: string | null
  member_color: string | null
  dashboard_mode: string | null
}

// Shape returned by the updated verify_member_pin RPC
interface PinVerifyResult {
  success: boolean
  reason?: 'not_found' | 'invalid' | 'locked'
  attempts_remaining?: number
  locked_until?: string
  remaining_seconds?: number
}

type Step = 'family-name' | 'member-select' | 'pin-entry'

export function FamilyLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('family-name')
  const [familyName, setFamilyName] = useState('')
  const [_familyId, setFamilyId] = useState<string | null>(null)
  const [familyDisplayName, setFamilyDisplayName] = useState('')
  const [members, setMembers] = useState<LoginMember[]>([])
  const [selectedMember, setSelectedMember] = useState<LoginMember | null>(null)
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

  async function handleFamilyLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: lookupError } = await lookupFamilyByLoginName(familyName.trim())

    if (lookupError || !data || data.length === 0) {
      setError("We couldn't find a family with that name. Check the spelling and try again.")
      setLoading(false)
      return
    }

    const family = data[0]
    setFamilyId(family.family_id)
    setFamilyDisplayName(family.family_name)

    const { data: memberData } = await getFamilyLoginMembers(family.family_id)

    if (memberData && memberData.length > 0) {
      setMembers(memberData)
      setStep('member-select')
    } else {
      setError('No members found for this family.')
    }

    setLoading(false)
  }

  function handleMemberSelect(member: LoginMember) {
    setSelectedMember(member)
    setPin('')
    setError('')
    setIsLocked(false)
    setLockoutSecondsRemaining(0)
    if (countdownRef.current) clearInterval(countdownRef.current)

    if (member.login_method === 'none') {
      // No auth needed — go directly to dashboard
      // STUB: In full implementation, this creates a session
      navigate('/dashboard')
      return
    }

    setStep('pin-entry')
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
      navigate('/dashboard')
      return
    }

    if (result.reason === 'locked') {
      const seconds = result.remaining_seconds ?? 900
      startLockoutCountdown(seconds)
      // Error message is rendered from lockout state, not the error string
      return
    }

    if (result.reason === 'invalid') {
      const remaining = result.attempts_remaining ?? 0
      if (remaining === 1) {
        setError(`Incorrect PIN. 1 attempt remaining before lockout.`)
      } else if (remaining === 0) {
        // Server will lock on the next attempt — show lockout preemptively
        setError('Incorrect PIN. Your account is now locked.')
      } else {
        setError(`Incorrect PIN. ${remaining} attempts remaining.`)
      }
      return
    }

    if (result.reason === 'not_found') {
      setError('Member not found. Please try again.')
      return
    }

    setError('Incorrect PIN. Please try again.')
  }

  function goBack() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (step === 'pin-entry') {
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
    <div
      className="min-h-svh flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      <div className="max-w-md w-full space-y-6">
        {step !== 'family-name' && (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <h1
          className="text-2xl font-bold text-center"
          style={{ color: 'var(--theme-text)' }}
        >
          Family Login
        </h1>

        {/* Lockout banner — rendered independently of the error string */}
        {isLocked && (
          <div
            className="rounded-lg px-4 py-3 text-sm text-center space-y-1"
            style={{
              backgroundColor: 'var(--theme-warning-surface, #fef3c7)',
              border: '1px solid var(--theme-warning, #f59e0b)',
              color: 'var(--theme-warning-text, #92400e)',
            }}
          >
            <p className="font-medium">Too many incorrect attempts.</p>
            <p>
              Try again in{' '}
              <span className="font-semibold tabular-nums">
                {formatLockoutTime(lockoutSecondsRemaining)}
              </span>
              .
            </p>
            <p className="text-xs" style={{ opacity: 0.75 }}>
              Ask mom to reset your PIN if you need access sooner.
            </p>
          </div>
        )}

        {/* General error message (not shown when locked banner is active) */}
        {error && !isLocked && (
          <p
            className="text-sm text-center"
            style={{ color: 'var(--theme-error)' }}
          >
            {error}
          </p>
        )}

        {/* ── Step: family name ── */}
        {step === 'family-name' && (
          <form onSubmit={handleFamilyLookup} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--theme-text)' }}
              >
                Enter your Family Login Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                placeholder="e.g., TheSmithCrew"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        )}

        {/* ── Step: member select ── */}
        {step === 'member-select' && (
          <div className="space-y-3">
            <p
              className="text-center text-sm"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {familyDisplayName}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {members.map((member) => (
                <button
                  key={member.member_id}
                  onClick={() => handleMemberSelect(member)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-surface)',
                    border: '1px solid var(--theme-border)',
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
                        backgroundColor: member.member_color || 'var(--theme-primary)',
                        color: 'white',
                      }}
                    >
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {member.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: PIN entry ── */}
        {step === 'pin-entry' && selectedMember && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-center" style={{ color: 'var(--theme-text)' }}>
              Hi, {selectedMember.display_name}!
            </p>
            <div>
              <label
                className="block text-sm font-medium mb-1 text-center"
                style={{ color: 'var(--theme-text)' }}
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
                  backgroundColor: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length < 4 || isLocked}
              className="w-full py-3 px-6 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
            <p
              className="text-xs text-center"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Forgot your PIN? Ask mom to reset it.
            </p>
          </form>
        )}

        <p className="text-center text-sm">
          <Link
            to="/auth/sign-in"
            className="underline"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Sign in with email instead
          </Link>
        </p>
      </div>
    </div>
  )
}
