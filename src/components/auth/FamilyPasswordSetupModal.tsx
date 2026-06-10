import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { supabase } from '@/lib/supabase/client'
import { setFamilyPassword } from '@/lib/supabase/auth'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { checkPasswordStrength } from '@/pages/FamilyPasswordSetup'

/**
 * Family-Auth-Two-Door Phase 2: forced one-time family password setup.
 *
 * Founder decision (2026-06-09): existing moms set a family password the
 * next time they log in. This modal appears for the primary parent when no
 * family password exists yet, and cannot be dismissed without setting one.
 * Family login stays locked for the family until this is done.
 *
 * Mounted in MomShell only (the primary parent's shell).
 */
export function FamilyPasswordSetupModal() {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isMom = member?.role === 'primary_parent'

  // Boolean check only — the hash itself is never fetched to the browser
  useEffect(() => {
    if (!family?.id || !isMom) return
    let cancelled = false
    supabase
      .from('families')
      .select('id')
      .eq('id', family.id)
      .not('family_password_hash', 'is', null)
      .then(({ data }) => {
        if (!cancelled) setNeedsSetup(!data || data.length === 0)
      })
    return () => {
      cancelled = true
    }
  }, [family?.id, isMom])

  if (!isMom || !needsSetup) return null

  const validation = checkPasswordStrength(password)
  const matches = confirm.length > 0 && confirm === password
  const canSave = validation?.valid === true && matches && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')

    const { data, error: rpcError } = await setFamilyPassword(password)

    setSaving(false)

    if (rpcError || !data?.success) {
      setError(
        data?.reason === 'weak_password'
          ? 'Needs at least 8 characters with a letter and a number.'
          : 'Failed to save. Please try again.',
      )
      return
    }

    setNeedsSetup(false)
  }

  return (
    <Modal
      open
      onClose={() => {}}
      disableBackdropClose
      size="sm"
      title="Set Your Family Password"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <Lock size={18} style={{ color: 'var(--color-brand, var(--color-sage-teal))' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            We&apos;ve added a security upgrade: family login now needs a family password
            before member names appear. Set yours to unlock family login — your family
            enters it once per device.
          </p>
        </div>

        {error && (
          <p
            className="text-sm p-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-error, #b25a58)' }}
          >
            {error}
          </p>
        )}

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Family Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            autoComplete="new-password"
          />
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
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            autoComplete="new-password"
          />
          {confirm.length > 0 && !matches && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-error, #b25a58)' }}>
              Passwords don&apos;t match yet
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-2.5 px-4 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-btn-primary-bg, var(--color-sage-teal))' }}
        >
          {saving ? 'Saving...' : 'Set Family Password'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          You can change it anytime in Settings → Family Password.
        </p>
      </div>
    </Modal>
  )
}
