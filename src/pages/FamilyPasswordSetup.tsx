import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { setFamilyPassword } from '@/lib/supabase/auth'
import { useFamily } from '@/hooks/useFamily'
import { FeatureGuide } from '@/components/shared'

/**
 * Family-Auth-Two-Door Phase 2: Family Password setup / change.
 * The family password is the second door — family login name + this
 * password let family devices in. Hashing is server-side (set_family_password
 * RPC, bcrypt). Plain text never persists; the hash never reaches the browser.
 * Mom's authenticated session IS the recovery path (no reset email).
 */

const MIN_LENGTH = 8

export function checkPasswordStrength(pwd: string): { valid: boolean; message: string } | null {
  if (!pwd) return null
  if (pwd.length < MIN_LENGTH) {
    return { valid: false, message: `At least ${MIN_LENGTH} characters` }
  }
  if (!/[a-zA-Z]/.test(pwd)) {
    return { valid: false, message: 'Include at least one letter' }
  }
  if (!/[0-9]/.test(pwd)) {
    return { valid: false, message: 'Include at least one number' }
  }
  return { valid: true, message: 'Looks good!' }
}

export function FamilyPasswordSetup() {
  const navigate = useNavigate()
  const { data: family } = useFamily()
  const [isSet, setIsSet] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Is a family password already set? (boolean check only — the hash itself
  // is never fetched to the browser)
  useEffect(() => {
    if (!family?.id) return
    let cancelled = false
    supabase
      .from('families')
      .select('id')
      .eq('id', family.id)
      .not('family_password_hash', 'is', null)
      .then(({ data }) => {
        if (!cancelled) setIsSet(!!data && data.length > 0)
      })
    return () => {
      cancelled = true
    }
  }, [family?.id])

  const validation = checkPasswordStrength(password)
  const confirmValidation =
    confirm.length === 0 ? null : confirm === password
      ? { valid: true, message: 'Passwords match' }
      : { valid: false, message: "Passwords don't match yet" }
  const canSave = validation?.valid === true && confirm === password && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')

    const { data, error: rpcError } = await setFamilyPassword(password)

    setSaving(false)

    if (rpcError || !data?.success) {
      if (data?.reason === 'weak_password') {
        setError('That password needs at least 8 characters with a letter and a number.')
      } else if (data?.reason === 'not_authorized') {
        setError('Only the family admin can set the family password.')
      } else {
        setError('Failed to save. Please try again.')
      }
      return
    }

    setSaved(true)
    setIsSet(true)
    setPassword('')
    setConfirm('')
  }

  const inputStyle = (v: { valid: boolean } | null) => ({
    backgroundColor: 'var(--color-bg-card)',
    border: `2px solid ${
      v?.valid === true
        ? 'var(--color-success, #4b7c66)'
        : v?.valid === false
          ? 'var(--color-error, #b25a58)'
          : 'var(--color-border)'
    }`,
    color: 'var(--color-text-primary)',
  })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <FeatureGuide
        featureKey="family_password"
        title="Family Password"
        description="The family password protects your family's login. On a new device, your family enters the family login name AND this password — only then do member names appear. They only need it once per device."
        bullets={[
          'A real password: at least 8 characters with a letter and a number',
          'Changing it signs every family device out — your remote kill switch for a lost device',
          'Only you can set or change it; your email login is the recovery path',
        ]}
      />

      <h1
        className="text-2xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        {isSet ? 'Change Family Password' : 'Set Your Family Password'}
      </h1>

      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {isSet
          ? 'Setting a new password takes effect right away. Devices using family login will need the new password next time they sign in.'
          : 'Family login stays locked until you set this. Pick something your family can remember but strangers can’t guess.'}
      </p>

      {error && (
        <p
          className="text-sm p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error, #b25a58)' }}
        >
          {error}
        </p>
      )}

      {saved ? (
        <div
          className="p-6 rounded-xl text-center space-y-3"
          style={{
            backgroundColor: 'var(--color-soft-sage, #d4e3d9)',
            border: '1px solid var(--color-sage-teal, #68a395)',
          }}
        >
          <Check size={32} className="mx-auto" style={{ color: 'var(--color-sage-teal)' }} />
          <p className="font-semibold" style={{ color: 'var(--color-warm-earth)' }}>
            Family password saved!
          </p>
          <p className="text-sm" style={{ color: 'var(--color-warm-earth)', opacity: 0.7 }}>
            Share it with your family — they&apos;ll enter it once per device along with your
            family login name.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white mt-2"
            style={{ backgroundColor: 'var(--color-sage-teal)' }}
          >
            Back to Settings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isSet ? 'New Family Password' : 'Family Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setSaved(false)
                }}
                className="w-full px-4 py-3 pr-10 rounded-xl outline-none text-lg"
                style={inputStyle(validation)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-tertiary)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validation && (
              <p
                className="text-xs mt-1"
                style={{
                  color: validation.valid
                    ? 'var(--color-success, #4b7c66)'
                    : 'var(--color-error, #b25a58)',
                }}
              >
                {validation.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-lg"
              style={inputStyle(confirmValidation)}
              autoComplete="new-password"
            />
            {confirmValidation && (
              <p
                className="text-xs mt-1"
                style={{
                  color: confirmValidation.valid
                    ? 'var(--color-success, #4b7c66)'
                    : 'var(--color-error, #b25a58)',
                }}
              >
                {confirmValidation.message}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 px-6 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg, var(--color-sage-teal))' }}
          >
            {saving ? 'Saving...' : isSet ? 'Change Password' : 'Set Family Password'}
          </button>
        </div>
      )}
    </div>
  )
}
