import { useState, useEffect } from 'react'
import { AtSign, Check, Eye, EyeOff, LinkIcon, LogIn, Mail } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabase/client'
import { ModalV2 } from '@/components/shared/ModalV2'

/**
 * MEMBER-SETTINGS-HUB (2026-09-07): extracted from FamilyMembers.tsx so both
 * the Family Management page AND the Member Settings Hub can mount these
 * exact same login-credential editors — one implementation, two launch
 * points. No logic changed in this extraction.
 */

/**
 * Picture Login setup (Founder Decision 13 — Family-Auth-Two-Door Phase 4).
 * Mom picks the kid's ONE secret picture (never a sequence). At login the
 * kid taps their picture among decoys; verification is server-side with the
 * same lockout as PINs. Mom can also switch this member to "no login needed"
 * here — safe because every device already passed the family password door.
 */
export function PictureModal({ memberId, memberName, onClose }: { memberId: string; memberName: string; onClose: () => void }) {
  const [assets, setAssets] = useState<{ id: string; display_name: string | null; size_128_url: string | null }[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('platform_assets')
      .select('id, display_name, size_128_url')
      .eq('category', 'login_avatar')
      .eq('status', 'active')
      .order('display_name')
      .then(({ data }) => {
        if (!cancelled) setAssets(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setError('')

    const { data, error: fnError } = await supabase.functions.invoke('family-auth-admin', {
      body: { action: 'set_member_picture', member_id: memberId, asset_id: selected },
    })

    setSaving(false)

    if (fnError || !data?.success) {
      setError('Failed to save. Please try again.')
      return
    }

    setSaved(true)
  }

  async function handleNoLogin() {
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase
      .from('family_members')
      .update({ auth_method: 'none', visual_password_config: null })
      .eq('id', memberId)
    setSaving(false)
    if (updateError) {
      setError('Failed to save. Please try again.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 p-6 rounded-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
          {saved ? 'Picture Set!' : `Picture Login for ${memberName}`}
        </h2>

        {saved ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {memberName} will tap this picture to log in. At login it appears mixed in
              with other pictures — only they know which one is theirs.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Pick {memberName}&apos;s secret picture — their PIN equivalent. Choose one
              they&apos;ll remember (and keep it just between you two).
            </p>

            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

            {!assets ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
                Loading pictures...
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {assets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className="relative aspect-square rounded-lg overflow-hidden transition-transform active:scale-95"
                    style={{
                      border: selected === a.id
                        ? '3px solid var(--color-sage-teal, #68a395)'
                        : '2px solid var(--color-border)',
                    }}
                  >
                    {a.size_128_url ? (
                      <img src={a.size_128_url} alt={a.display_name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{a.display_name}</span>
                    )}
                    {selected === a.id && (
                      <span
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
                      >
                        <Check size={12} color="#fff" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!selected || saving}
              className="w-full py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              {saving ? 'Saving...' : 'Set as Their Picture'}
            </button>

            <button
              onClick={handleNoLogin}
              disabled={saving}
              className="w-full py-2 rounded-lg text-sm disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              No login needed for {memberName}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              "No login" is safe on family devices — they already passed the family password.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const CRED_REASON_MESSAGES: Record<string, string> = {
  weak_password: 'Password must be at least 8 characters with a letter and a number.',
  invalid_email: 'Enter a valid email address.',
  invalid_username: 'Username must be 3-20 lowercase letters, numbers, or underscores.',
  invalid_format: 'Username must be 3-20 lowercase letters, numbers, or underscores.',
  email_taken: 'That email is already in use by another account.',
  username_taken: 'That username is already taken. Try another one.',
  already_has_credentials: 'This member already has login credentials — use Reset Password instead.',
  not_authorized: "You don't have permission to do that.",
  not_full_login: "This member doesn't have login credentials set yet.",
  rate_limited: 'Too many checks — wait a moment and try again.',
}

function credReasonMessage(reason: string | undefined): string {
  return (reason && CRED_REASON_MESSAGES[reason]) || 'Something went wrong. Please try again.'
}

/**
 * Set Login (TEEN-CRED, 2026-08-23) — mom types real Door 3 credentials for
 * a member directly (email+password, or username+password for members with
 * no real email) instead of generating an invite link and waiting. Produces
 * the exact same end-state as accept_family_invite: auth_method='full_login'.
 * No COPPA age-bracket gate here — matches Set PIN's posture exactly (PRD-40
 * Slice 5 is where under-13 enforcement, if any, would land for this
 * surface — not invented here).
 */
export function SetLoginModal({
  memberId,
  memberName,
  hasFullLogin,
  onClose,
  onSaved,
}: {
  memberId: string
  memberName: string
  hasFullLogin: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [credMode, setCredMode] = useState<'email' | 'username'>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedWith, setSavedWith] = useState('')
  const [error, setError] = useState('')

  const passwordValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  // Live availability feedback, debounced — mirrors the rate-limited
  // check_username_available action (mom-gated, 20/60s).
  useEffect(() => {
    if (hasFullLogin || credMode !== 'username') return
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setUsernameStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const { data, error: fnError } = await supabase.functions.invoke('family-auth-admin', {
        body: { action: 'check_username_available', username: trimmed },
      })
      if (fnError || !data?.success) {
        setUsernameStatus('idle')
        return
      }
      setUsernameStatus(data.available ? 'available' : 'taken')
    }, 500)
    return () => clearTimeout(timer)
  }, [username, credMode, hasFullLogin])

  async function handleCreate() {
    setError('')
    if (!passwordValid) {
      setError(credReasonMessage('weak_password'))
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }
    if (credMode === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(credReasonMessage('invalid_email'))
      return
    }
    if (credMode === 'username') {
      const trimmed = username.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
        setError(credReasonMessage('invalid_username'))
        return
      }
      if (usernameStatus === 'taken') {
        setError(credReasonMessage('username_taken'))
        return
      }
    }

    setSaving(true)
    const { data, error: fnError } = await supabase.functions.invoke('family-auth-admin', {
      body: {
        action: 'set_member_credentials',
        member_id: memberId,
        mode: credMode,
        email: credMode === 'email' ? email.trim() : undefined,
        username: credMode === 'username' ? username.trim().toLowerCase() : undefined,
        password,
      },
    })
    setSaving(false)

    if (fnError) {
      setError('Something went wrong. Please try again.')
      return
    }
    if (!data?.success) {
      setError(credReasonMessage(data?.reason))
      return
    }

    setSavedWith(credMode === 'email' ? email.trim() : username.trim().toLowerCase())
    setSaved(true)
    onSaved()
  }

  async function handleReset() {
    setError('')
    if (!passwordValid) {
      setError(credReasonMessage('weak_password'))
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    const { data, error: fnError } = await supabase.functions.invoke('family-auth-admin', {
      body: { action: 'reset_member_credentials', member_id: memberId, password },
    })
    setSaving(false)

    if (fnError) {
      setError('Something went wrong. Please try again.')
      return
    }
    if (!data?.success) {
      setError(credReasonMessage(data?.reason))
      return
    }

    setSaved(true)
    onSaved()
  }

  return (
    <ModalV2
      id={`set-login-${memberId}`}
      isOpen
      onClose={onClose}
      type="transient"
      size="sm"
      title={saved ? 'Login Set!' : hasFullLogin ? `Reset Password for ${memberName}` : `Set Login for ${memberName}`}
      icon={LogIn}
    >
      <div className="density-comfortable space-y-4" data-testid="set-login-modal">
        {saved ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {hasFullLogin ? (
                <>{memberName}&rsquo;s password has been updated.</>
              ) : credMode === 'username' ? (
                <>
                  {memberName} signs in with the username <strong>{savedWith}</strong> and the password you just set.
                </>
              ) : (
                <>
                  {memberName} signs in with the email <strong>{savedWith}</strong> and the password you just set.
                </>
              )}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              Done
            </button>
          </div>
        ) : hasFullLogin ? (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {memberName} already signs in with their own credentials. Set a new password below — this
              won&rsquo;t change how they log in, just what they type.
            </p>
            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
            <PasswordFields
              password={password}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              onPassword={setPassword}
              onConfirmPassword={setConfirmPassword}
              onToggleShow={() => setShowPassword((s) => !s)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={saving || !passwordValid || !passwordsMatch}
                className="flex-1 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-sage-teal)' }}
              >
                {saving ? 'Saving...' : 'Reset Password'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Type real login credentials for {memberName} right now, instead of sending an invite link and
              waiting for them to sign up.
            </p>
            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setCredMode('email')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium"
                style={{
                  backgroundColor: credMode === 'email' ? 'var(--color-sage-teal)' : 'var(--color-bg-primary)',
                  color: credMode === 'email' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                <Mail size={14} /> Email
              </button>
              <button
                type="button"
                onClick={() => setCredMode('username')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium"
                style={{
                  backgroundColor: credMode === 'username' ? 'var(--color-sage-teal)' : 'var(--color-bg-primary)',
                  color: credMode === 'username' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                <AtSign size={14} /> Username
              </button>
            </div>

            {credMode === 'email' ? (
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder="teen@example.com"
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  placeholder="e.g., ruthie2026"
                  autoFocus
                  maxLength={20}
                />
                {usernameStatus === 'checking' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Checking…</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-success, #16a34a)' }}>
                    <Check size={12} /> Available
                  </p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>Already taken</p>
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    3-20 lowercase letters, numbers, or underscores
                  </p>
                )}
              </div>
            )}

            <PasswordFields
              password={password}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              onPassword={setPassword}
              onConfirmPassword={setConfirmPassword}
              onToggleShow={() => setShowPassword((s) => !s)}
            />

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={
                  saving ||
                  !passwordValid ||
                  !passwordsMatch ||
                  (credMode === 'username' && (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'idle'))
                }
                className="flex-1 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-sage-teal)' }}
              >
                {saving ? 'Saving...' : 'Set Login'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </ModalV2>
  )
}

function PasswordFields({
  password,
  confirmPassword,
  showPassword,
  onPassword,
  onConfirmPassword,
  onToggleShow,
}: {
  password: string
  confirmPassword: string
  showPassword: boolean
  onPassword: (v: string) => void
  onConfirmPassword: (v: string) => void
  onToggleShow: () => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            placeholder="At least 8 characters, a letter and a number"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Confirm password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => onConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          placeholder="Type it again"
        />
      </div>
    </div>
  )
}

export function PinModal({ memberId, memberName, onClose }: { memberId: string; memberName: string; onClose: () => void }) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (pin.length !== 4) return
    setSaving(true)
    setError('')

    // Server-side PIN hashing via pgcrypto RPC — never store plain text
    const { error: hashError } = await supabase.rpc('hash_member_pin', {
      p_member_id: memberId,
      p_pin: pin,
    })

    if (hashError) {
      setError('Failed to save PIN. ' + (hashError.message || ''))
      setSaving(false)
      return
    }

    // Sync the PIN to the member's shadow auth account
    // ({member_id}@pin.myaimcentral.app) so PIN login creates a real session.
    // Creates the account if it doesn't exist yet (fixes the long-standing
    // gap where verify_member_pin succeeded but no session could be made).
    const { data: syncData, error: syncError } = await supabase.functions.invoke(
      'family-auth-admin',
      { body: { action: 'ensure_pin_shadow_account', member_id: memberId, pin } },
    )
    if (syncError || !syncData?.success) {
      setError(
        'PIN saved, but the login account sync failed — this member may not be able to ' +
          'sign in on their own device. Try setting the PIN again.',
      )
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 p-6 rounded-2xl space-y-4"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
          {saved ? 'PIN Set!' : `Set PIN for ${memberName}`}
        </h2>

        {saved ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {memberName} can now log in with this PIN on the Family Login screen.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {error && <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                4-digit PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl outline-none text-center text-2xl tracking-[0.5em]"
                  style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                PRD-01: Default is birthday mm/dd if set. You can always reset it here.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || pin.length !== 4}
                className="flex-1 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-sage-teal)' }}
              >
                {saving ? 'Saving...' : 'Set PIN'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function InviteModal({ memberId, memberName, familyId: _familyId, onClose }: { memberId: string; memberName: string; familyId: string; onClose: () => void }) {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function generateLink() {
    setLoading(true)
    // Generate a unique invite token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('family_members')
      .update({
        invite_token: token,
        invite_expires_at: expiresAt,
        invite_status: 'pending',
      })
      .eq('id', memberId)

    const link = `${window.location.origin}/auth/accept-invite?token=${token}`
    setInviteLink(link)
    setLoading(false)
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 p-6 rounded-2xl space-y-4"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
          Invite {memberName}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Generate a link to share with {memberName}. They'll create their own login to access MyAIM from their own device.
        </p>

        {inviteLink ? (
          <div className="space-y-3">
            {/* PRD-01: QR code display for invite links */}
            <div className="flex justify-center py-2">
              <QRCodeSVG
                value={inviteLink}
                size={160}
                level="M"
                bgColor="transparent"
                fgColor="var(--color-text-primary)"
              />
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Show this QR code or share the link below
            </p>
            <div
              className="p-3 rounded-lg text-xs break-all"
              style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
            >
              {inviteLink}
            </div>
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              <LinkIcon size={16} />
              {copied ? 'Copied!' : 'Copy Link to Share'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Link expires in 7 days.
            </p>
          </div>
        ) : (
          <button
            onClick={generateLink}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-sage-teal)' }}
          >
            <Mail size={16} />
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
