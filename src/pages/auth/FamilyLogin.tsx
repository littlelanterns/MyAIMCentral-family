import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { lookupFamilyByLoginName, getFamilyLoginMembers } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { AuthPageLayout, AUTH_COLORS } from '@/components/auth/AuthPageLayout'

interface LoginMember {
  member_id: string
  display_name: string
  avatar_url: string | null
  auth_method: string | null
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

interface VisualPasswordImage {
  id: string
  display_name: string
  url: string
}

type Step = 'family-name' | 'member-select' | 'pin-entry' | 'visual-password'

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

  // Visual password state
  const [visualImages, setVisualImages] = useState<VisualPasswordImage[]>([])
  const [visualSequence, setVisualSequence] = useState<string[]>([])

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

    if (member.auth_method === 'none') {
      navigate('/dashboard')
      return
    }

    if (member.auth_method === 'visual_password') {
      loadVisualImages()
      setVisualSequence([])
      setStep('visual-password')
      return
    }

    setStep('pin-entry')
  }

  async function loadVisualImages() {
    const { data } = await supabase
      .from('platform_assets')
      .select('id, display_name, size_128_url')
      .eq('category', 'login_avatar')
      .eq('status', 'active')
      .order('display_name')

    if (data && data.length > 0) {
      setVisualImages(
        data.map((a) => ({
          id: a.id,
          display_name: a.display_name || 'Image',
          url: a.size_128_url || a.size_128_url,
        })),
      )
    }
  }

  function handleVisualImageTap(imageId: string) {
    setVisualSequence((prev) => {
      const next = [...prev, imageId]
      if (next.length >= 4) {
        verifyVisualPassword(next)
      }
      return next
    })
    setError('')
  }

  async function verifyVisualPassword(sequence: string[]) {
    if (!selectedMember) return
    setLoading(true)
    setError('')

    const { data: memberData } = await supabase
      .from('family_members')
      .select('visual_password_config')
      .eq('id', selectedMember.member_id)
      .single()

    setLoading(false)

    if (!memberData?.visual_password_config) {
      setError('Visual password is not set up yet. Ask mom to set it up for you.')
      setVisualSequence([])
      return
    }

    const config = memberData.visual_password_config as { sequence: string[] }
    const correctSequence = config.sequence || []

    if (
      sequence.length === correctSequence.length &&
      sequence.every((id, i) => id === correctSequence[i])
    ) {
      navigate('/dashboard')
    } else {
      setError('That wasn\'t right. Try tapping the pictures in the right order!')
      setVisualSequence([])
    }
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
      setVisualSequence([])
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
              Ask mom to reset your PIN if you need help getting in.
            </p>
          </div>
        )}

        {/* General error message */}
        {error && !isLocked && (
          <p className="text-sm text-center" style={{ color: AUTH_COLORS.error }}>
            {error}
          </p>
        )}

        {/* Step: family name */}
        {step === 'family-name' && (
          <form onSubmit={handleFamilyLookup} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: AUTH_COLORS.text }}
              >
                Enter your Family Login Name
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AUTH_COLORS.primary} 0%, ${AUTH_COLORS.accent} 100%)`,
                color: '#ffffff',
              }}
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step: member select */}
        {step === 'member-select' && (
          <div className="space-y-3">
            <p className="text-center text-sm" style={{ color: AUTH_COLORS.textMuted }}>
              {familyDisplayName}
            </p>
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

        {/* Step: Visual Password */}
        {step === 'visual-password' && selectedMember && (
          <div className="space-y-4">
            <p className="text-center" style={{ color: AUTH_COLORS.text }}>
              Hi, {selectedMember.display_name}!
            </p>
            <p className="text-center text-sm" style={{ color: AUTH_COLORS.textMuted }}>
              Tap your pictures in the right order
            </p>

            {/* Selected sequence indicator */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: visualSequence[i] ? AUTH_COLORS.primary : AUTH_COLORS.border,
                    backgroundColor: visualSequence[i] ? AUTH_COLORS.primary : 'transparent',
                  }}
                >
                  {visualSequence[i] && (
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Image grid */}
            {visualImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {visualImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleVisualImageTap(img.id)}
                    disabled={loading || visualSequence.length >= 4}
                    className="aspect-square rounded-xl overflow-hidden transition-transform active:scale-95 disabled:opacity-40"
                    style={{
                      border: visualSequence.includes(img.id)
                        ? `3px solid ${AUTH_COLORS.primary}`
                        : `2px solid ${AUTH_COLORS.border}`,
                      backgroundColor: AUTH_COLORS.card,
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.display_name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm py-4" style={{ color: AUTH_COLORS.textMuted }}>
                Visual password images are not available yet. Ask mom to set them up.
              </p>
            )}

            <button
              onClick={() => setVisualSequence([])}
              disabled={visualSequence.length === 0}
              className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-30"
              style={{
                backgroundColor: AUTH_COLORS.card,
                border: `1px solid ${AUTH_COLORS.border}`,
                color: AUTH_COLORS.text,
              }}
            >
              Start Over
            </button>
            <p className="text-xs text-center" style={{ color: AUTH_COLORS.textMuted }}>
              Can't remember? Ask mom to reset your picture password.
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
