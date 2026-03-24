import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureGuide } from '@/components/shared'

/**
 * PRD-01 Screen 7: Family Login Name Setup
 * - 3-30 characters, letters/numbers/&-_!
 * - Case-insensitive uniqueness (preserved-case display)
 * - Real-time validation as user types
 */

const LOGIN_NAME_REGEX = /^[a-zA-Z0-9&\-_!]{3,30}$/
const MIN_LENGTH = 3
const MAX_LENGTH = 30

export function FamilyLoginNameSetup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const [loginName, setLoginName] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Prefill with existing login name
  useEffect(() => {
    if (family?.family_login_name) {
      setLoginName(family.family_login_name)
      setAvailable(true)
    }
  }, [family?.family_login_name])

  // Debounced uniqueness check
  const checkAvailability = useCallback(
    async (name: string) => {
      if (!name || name.length < MIN_LENGTH || !LOGIN_NAME_REGEX.test(name)) {
        setAvailable(null)
        return
      }

      setChecking(true)
      try {
        const { data } = await supabase.rpc('lookup_family_by_login_name', {
          login_name: name,
        })

        // If found and it's not our own family, it's taken
        if (data && data.length > 0 && data[0].family_id !== family?.id) {
          setAvailable(false)
        } else {
          setAvailable(true)
        }
      } catch {
        setAvailable(null)
      }
      setChecking(false)
    },
    [family?.id],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginName && loginName !== family?.family_login_name) {
        checkAvailability(loginName)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [loginName, checkAvailability, family?.family_login_name])

  function getValidation(): { valid: boolean; message: string } | null {
    if (!loginName) return null
    if (loginName.length < MIN_LENGTH) {
      return { valid: false, message: `At least ${MIN_LENGTH} characters` }
    }
    if (loginName.length > MAX_LENGTH) {
      return { valid: false, message: `Maximum ${MAX_LENGTH} characters` }
    }
    if (!LOGIN_NAME_REGEX.test(loginName)) {
      return { valid: false, message: 'Only letters, numbers, &, -, _, and ! allowed' }
    }
    if (available === false) {
      return { valid: false, message: 'This name is already taken' }
    }
    if (available === true) {
      return { valid: true, message: 'Available!' }
    }
    return null
  }

  async function handleSave() {
    if (!family?.id || !available) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('families')
      .update({ family_login_name: loginName.trim() })
      .eq('id', family.id)

    if (updateError) {
      if (updateError.message.includes('unique') || updateError.message.includes('duplicate')) {
        setError('This name was just taken. Try another.')
        setAvailable(false)
      } else {
        setError('Failed to save. Please try again.')
      }
      setSaving(false)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['family'] })
    setSaved(true)
    setSaving(false)
  }

  const validation = getValidation()

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
        featureKey="family_login_name"
        title="Family Login Name"
        description="This is how your family members sign in from a shared device. They'll enter this name, then pick their profile and enter their PIN."
        bullets={[
          'Case-insensitive for login (TheSmithCrew = thesmithcrew)',
          'Displayed exactly as you type it',
          'Share it with your family so they can log in',
        ]}
      />

      <h1
        className="text-2xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        {family?.family_login_name ? 'Edit Family Login Name' : 'Set Up Family Login'}
      </h1>

      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Your family members will use this name to sign in from any device.
        Choose something memorable that your family will remember.
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
            Family Login Name saved!
          </p>
          <p className="text-sm" style={{ color: 'var(--color-warm-earth)', opacity: 0.7 }}>
            Family members can now sign in at the Family Login page using: <strong>{loginName}</strong>
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white mt-2"
            style={{ backgroundColor: 'var(--color-sage-teal)' }}
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Family Login Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginName}
                onChange={(e) => {
                  setLoginName(e.target.value)
                  setAvailable(null)
                  setSaved(false)
                }}
                maxLength={MAX_LENGTH}
                className="w-full px-4 py-3 pr-10 rounded-xl outline-none text-lg"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: `2px solid ${
                    validation?.valid === true
                      ? 'var(--color-success, #4b7c66)'
                      : validation?.valid === false
                        ? 'var(--color-error, #b25a58)'
                        : 'var(--color-border)'
                  }`,
                  color: 'var(--color-text-primary)',
                }}
                placeholder="e.g., TheSmithCrew"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />}
                {!checking && validation?.valid === true && (
                  <Check size={18} style={{ color: 'var(--color-success, #4b7c66)' }} />
                )}
                {!checking && validation?.valid === false && (
                  <X size={18} style={{ color: 'var(--color-error, #b25a58)' }} />
                )}
              </div>
            </div>
            {validation && (
              <p
                className="text-sm mt-1"
                style={{ color: validation.valid ? 'var(--color-success, #4b7c66)' : 'var(--color-error, #b25a58)' }}
              >
                {validation.message}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
              {loginName.length}/{MAX_LENGTH} characters. Letters, numbers, &amp;, -, _, and ! allowed.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !available || !validation?.valid}
            className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
          >
            {saving ? 'Saving...' : family?.family_login_name ? 'Update Login Name' : 'Set Login Name'}
          </button>
        </div>
      )}
    </div>
  )
}
