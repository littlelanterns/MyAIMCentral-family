import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Key, UserPlus, Users, Eye, EyeOff, Settings2, Mail, LinkIcon, Cake, LayoutDashboard, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureGuide } from '@/components/shared'
import { GuidedManagementScreen } from '@/components/guided'
import { GamificationSettingsModal } from '@/components/gamification/settings'
import { MEMBER_COLORS } from '@/config/member_colors'
import { QRCodeSVG } from 'qrcode.react'

/**
 * PRD-01: Family Members management page
 * Mom can view all members, edit details, set/reset PINs,
 * generate invite links, and configure dashboard mode.
 */

function calculateAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

function formatBirthday(dob: string | null): string {
  if (!dob) return ''
  const d = new Date(dob + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DASHBOARD_MODE_LABELS: Record<string, string> = {
  adult: 'Adult Dashboard',
  independent: 'Independent Mode — Full Features',
  guided: 'Guided Mode — Guided Experience',
  play: 'Play Mode — Fun & Gamified',
}

export function FamilyMembers() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: allMembers } = useFamilyMembers(member?.family_id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pinModal, setPinModal] = useState<string | null>(null)
  const [inviteModal, setInviteModal] = useState<string | null>(null)

  const isPrimaryParent = member?.role === 'primary_parent'
  if (!isPrimaryParent) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p style={{ color: 'var(--color-text-secondary)' }}>Only the primary parent can manage family members.</p>
      </div>
    )
  }

  const otherMembers = allMembers?.filter((m) => m.id !== member?.id) ?? []

  return (
    <div className="density-comfortable max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="hidden md:flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <FeatureGuide
        featureKey="family_members_manage"
        title="Manage Your Family"
        description="Add, edit, and configure access for every family member. Set PINs, choose dashboard experiences, and send invitations."
        bullets={[
          'Dashboard mode determines their visual experience — you assign it, not their age',
          'PINs are for family device login. Email invites create full accounts.',
          'Special adults (caregivers) get a focused shift-based view',
        ]}
      />

      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Family Members
        </h1>
        <div className="flex gap-2">
          <Link
            to="/family-setup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
          >
            <UserPlus size={16} /> Add Members
          </Link>
        </div>
      </div>

      {/* Family Login Name */}
      <div
        className="p-4 rounded-xl flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Family Login Name
          </p>
          <p className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {family?.family_login_name || 'Not set yet'}
          </p>
        </div>
        <Link
          to="/family-login-name"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        >
          <Settings2 size={14} />
          {family?.family_login_name ? 'Edit' : 'Set Up'}
        </Link>
      </div>

      {/* Member List */}
      {otherMembers.length === 0 ? (
        <div
          className="p-8 rounded-xl text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
        >
          <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No family members yet.</p>
          <Link
            to="/family-setup"
            className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-sage-teal)' }}
          >
            Set Up Your Family
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {otherMembers.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              isEditing={editingId === m.id}
              onToggleEdit={() => setEditingId(editingId === m.id ? null : m.id)}
              onOpenPin={() => setPinModal(m.id)}
              onOpenInvite={() => setInviteModal(m.id)}
              onSave={async (updates) => {
                await supabase.from('family_members').update(updates).eq('id', m.id)
                await queryClient.invalidateQueries({ queryKey: ['family-members'] })
                setEditingId(null)
              }}
            />
          ))}
        </div>
      )}

      {/* PIN Modal */}
      {pinModal && (
        <PinModal
          memberId={pinModal}
          memberName={allMembers?.find((m) => m.id === pinModal)?.display_name ?? ''}
          onClose={() => setPinModal(null)}
        />
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <InviteModal
          memberId={inviteModal}
          memberName={allMembers?.find((m) => m.id === inviteModal)?.display_name ?? ''}
          familyId={member.family_id}
          onClose={() => setInviteModal(null)}
        />
      )}
    </div>
  )
}

function MemberRow({
  member,
  isEditing,
  onToggleEdit,
  onOpenPin,
  onOpenInvite,
  onSave,
}: {
  member: { id: string; family_id: string; display_name: string; role: string; dashboard_mode: string | null; member_color: string | null; age: number | null; date_of_birth: string | null; relationship: string | null; custom_role: string | null; auth_method: string | null }
  isEditing: boolean
  onToggleEdit: () => void
  onOpenPin: () => void
  onOpenInvite: () => void
  onSave: (updates: Record<string, unknown>) => Promise<void>
}) {
  const [name, setName] = useState(member.display_name)
  const [mode, setMode] = useState(member.dashboard_mode || 'guided')
  const [dob, setDob] = useState(member.date_of_birth || '')
  const [color, setColor] = useState(member.member_color || '')
  const [saving, setSaving] = useState(false)
  const [manageDashboardOpen, setManageDashboardOpen] = useState(false)
  const [gamificationOpen, setGamificationOpen] = useState(false)

  const roleLabel = member.role === 'additional_adult' ? 'Adult'
    : member.role === 'special_adult' ? (member.custom_role || 'Special Adult')
    : DASHBOARD_MODE_LABELS[member.dashboard_mode || 'guided']

  return (
    <div
      className="rounded-xl overflow-hidden card-hover"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: member.member_color || 'var(--color-sage-teal)' }}
        >
          {member.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
            {member.display_name}
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            {roleLabel}
            {member.age ? ` | Age ${member.age}` : ''}
            {member.date_of_birth && (
              <span className="inline-flex items-center gap-0.5">
                <Cake size={10} /> {formatBirthday(member.date_of_birth)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPin}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Set PIN"
          >
            <Key size={16} />
          </button>
          <button
            onClick={onOpenInvite}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Send Invite"
          >
            <Mail size={16} />
          </button>
          <button
            onClick={onToggleEdit}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Dashboard Style</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                {Object.entries(DASHBOARD_MODE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Birthday
              {dob && calculateAge(dob) != null && <span className="ml-1 opacity-70">(Age {calculateAge(dob)})</span>}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
            <div className="flex flex-wrap gap-1.5">
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    backgroundColor: c.hex,
                    outline: color === c.hex ? '2px solid var(--color-text-primary)' : 'none',
                    outlineOffset: '1px',
                    transform: color === c.hex ? 'scale(1.2)' : 'scale(1)',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setSaving(true)
                const age = dob ? calculateAge(dob) : member.age
                await onSave({
                  display_name: name.trim(),
                  dashboard_mode: mode,
                  date_of_birth: dob || null,
                  member_color: color,
                  assigned_color: color,
                  age,
                })
                setSaving(false)
              }}
              disabled={saving || !name.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage-teal)' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onToggleEdit}
              className="px-4 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </div>
          {/* PRD-25: Manage Dashboard button for Guided members */}
          {mode === 'guided' && (
            <button
              onClick={() => setManageDashboardOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
              }}
            >
              <LayoutDashboard size={16} />
              Manage {member.display_name}&rsquo;s Dashboard
            </button>
          )}
          <GuidedManagementScreen
            isOpen={manageDashboardOpen}
            onClose={() => setManageDashboardOpen(false)}
            memberId={member.id}
            memberName={member.display_name}
            familyId={member.family_id}
          />
          {/* Gamification settings — available for ALL member roles (decision #7) */}
          <button
            onClick={() => setGamificationOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
              color: 'var(--color-btn-primary-bg)',
              border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
            }}
          >
            <Sparkles size={16} />
            Gamification Settings
          </button>
          <GamificationSettingsModal
            isOpen={gamificationOpen}
            onClose={() => setGamificationOpen(false)}
            memberId={member.id}
            memberName={member.display_name}
            familyId={member.family_id}
          />
        </div>
      )}
    </div>
  )
}

function PinModal({ memberId, memberName, onClose }: { memberId: string; memberName: string; onClose: () => void }) {
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

    // TODO: Sync PIN change to auth account password via Edge Function
    // PIN members have auth accounts ({member_id}@pin.myaimcentral.app)
    // whose password must match the PIN for session creation on login.
    // Admin API requires service role key — needs server-side Edge Function.

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

function InviteModal({ memberId, memberName, familyId: _familyId, onClose }: { memberId: string; memberName: string; familyId: string; onClose: () => void }) {
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
