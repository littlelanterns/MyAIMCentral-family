import { useState } from 'react'
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
  const [attempts, setAttempts] = useState(0)

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
    setError('')

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

    if (attempts >= 5) {
      setError('Too many attempts. Please wait 5 minutes or ask mom to reset your PIN.')
      return
    }

    setLoading(true)
    setError('')

    // STUB: PIN verification will use a server-side function
    // For now, stub the verification — full implementation in Phase 02
    let data: boolean | null = null
    let verifyError: { message: string } | null = null

    try {
      const result = await supabase.rpc('verify_member_pin', {
        p_member_id: selectedMember!.member_id,
        p_pin: pin,
      })
      data = result.data
      verifyError = result.error
    } catch {
      verifyError = { message: 'PIN verification not yet available' }
    }

    if (verifyError || !data) {
      setAttempts((a) => a + 1)
      setError('Incorrect PIN. Please try again, or ask mom to reset it.')
      setPin('')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  function goBack() {
    if (step === 'pin-entry') {
      setStep('member-select')
      setSelectedMember(null)
      setPin('')
      setError('')
    } else if (step === 'member-select') {
      setStep('family-name')
      setFamilyId(null)
      setMembers([])
      setError('')
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-8"
         style={{ backgroundColor: 'var(--theme-background)' }}>
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

        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--theme-text)' }}>
          Family Login
        </h1>

        {error && (
          <p className="text-sm text-center" style={{ color: 'var(--theme-error)' }}>{error}</p>
        )}

        {step === 'family-name' && (
          <form onSubmit={handleFamilyLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
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

        {step === 'member-select' && (
          <div className="space-y-3">
            <p className="text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
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
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    {member.display_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'pin-entry' && selectedMember && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-center" style={{ color: 'var(--theme-text)' }}>
              Hi, {selectedMember.display_name}!
            </p>
            <div>
              <label className="block text-sm font-medium mb-1 text-center" style={{ color: 'var(--theme-text)' }}>
                Enter your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-4 rounded-lg outline-none text-center text-2xl tracking-widest"
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
              disabled={loading || pin.length < 4}
              className="w-full py-3 px-6 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--theme-text-muted)' }}>
              Forgot your PIN? Ask mom to reset it.
            </p>
          </form>
        )}

        <p className="text-center text-sm">
          <Link to="/auth/sign-in" className="underline" style={{ color: 'var(--theme-text-muted)' }}>
            Sign in with email instead
          </Link>
        </p>
      </div>
    </div>
  )
}
