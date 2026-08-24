import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Key, UserPlus, Users, Eye, EyeOff, Settings2, Mail, LinkIcon, Cake, LayoutDashboard, Sparkles, Image as ImageIcon, Check, LogIn, AtSign } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureGuide, ModalV2 } from '@/components/shared'
import { GuidedManagementScreen } from '@/components/guided'
import { GamificationSettingsModal } from '@/components/gamification/settings'
import { MEMBER_COLORS } from '@/config/member_colors'
import { QRCodeSVG } from 'qrcode.react'
import { CoppaConsentFlow } from '@/components/coppa/CoppaConsentFlow'
import { CoppaAcknowledgeModal } from '@/components/coppa/CoppaAcknowledgeModal'
import { CoppaDormantCard } from '@/components/coppa/CoppaDormantCard'
import { BRACKET_LABELS, CONSENT_SECTION_KEYS, type CoppaAgeBracket } from '@/lib/coppa/brackets'
import {
  useActiveConsentTemplate,
  useParentVerification,
  fetchActiveConsentTemplate,
  fetchParentVerification,
  fetchIsFoundingFamily,
  commitConsentedMembers,
  type CoppaConsentTemplate,
  type ParentVerification,
} from '@/lib/coppa/useCoppaGate'

// PRD-40 Slice 3 (Flows: "Member edit action (age bracket change)"):
// changing a member's bracket TO under_13 is treated as an add-under-13
// event and routes through the consent gate before anything is written.
// The gate state carries the RESOLVED template/verification (fetched
// imperatively at gate time — never from possibly-still-loading hook state).
type CoppaEditGateState =
  | { kind: 'none' }
  | { kind: 'dormant'; memberName: string }
  | { kind: 'acknowledge'; memberId: string; memberName: string; pendingUpdates: Record<string, unknown>; template: CoppaConsentTemplate; verification: ParentVerification }
  | { kind: 'consent_flow'; memberId: string; memberName: string; pendingUpdates: Record<string, unknown>; template: CoppaConsentTemplate }

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
  const [pictureModal, setPictureModal] = useState<string | null>(null)
  const [inviteModal, setInviteModal] = useState<string | null>(null)
  const [loginModal, setLoginModal] = useState<string | null>(null)
  const { data: consentTemplate } = useActiveConsentTemplate()
  const { data: parentVerification } = useParentVerification()
  const [coppaGate, setCoppaGate] = useState<CoppaEditGateState>({ kind: 'none' })

  const isPrimaryParent = member?.role === 'primary_parent'
  if (!isPrimaryParent) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p style={{ color: 'var(--color-text-secondary)' }}>Only the primary parent can manage family members.</p>
      </div>
    )
  }

  const otherMembers = allMembers?.filter((m) => m.id !== member?.id) ?? []

  // PRD-40: shared tail of both consented-edit paths — the RPC writes the
  // bracket + consent row atomically; the rest of mom's edits apply after.
  async function applyConsentedEdit(
    memberId: string,
    pendingUpdates: Record<string, unknown>,
    template: CoppaConsentTemplate,
    verificationId: string,
    ackSections: string[],
  ) {
    await commitConsentedMembers({
      verification_id: verificationId,
      consent_version: template.version,
      acknowledged_sections: ackSections,
      members: [],
      existing_member_ids: [memberId],
    })
    const rest = { ...pendingUpdates }
    delete rest.coppa_age_bracket
    if (Object.keys(rest).length > 0) {
      await supabase.from('family_members').update(rest).eq('id', memberId)
    }
    await queryClient.invalidateQueries({ queryKey: ['family-members'] })
    setEditingId(null)
  }

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
              onOpenPicture={() => setPictureModal(m.id)}
              onOpenInvite={() => setInviteModal(m.id)}
              onOpenLogin={() => setLoginModal(m.id)}
              onSave={async (updates) => {
                await supabase.from('family_members').update(updates).eq('id', m.id)
                await queryClient.invalidateQueries({ queryKey: ['family-members'] })
                setEditingId(null)
              }}
              onUnder13Transition={async (updates) => {
                // PRD-40: bracket changing TO under_13 = add-under-13 event.
                // Resolve gate inputs imperatively (hook state may be loading).
                try {
                  const template = consentTemplate !== undefined ? consentTemplate : await fetchActiveConsentTemplate()
                  const founding = family ? !!family.is_founding_family : await fetchIsFoundingFamily(m.family_id)
                  if (!template || (!template.lawyer_approved_at && !founding)) {
                    setCoppaGate({ kind: 'dormant', memberName: m.display_name })
                    return
                  }
                  const verification =
                    parentVerification !== undefined ? parentVerification : await fetchParentVerification(member.id)
                  if (verification) {
                    setCoppaGate({ kind: 'acknowledge', memberId: m.id, memberName: m.display_name, pendingUpdates: updates, template, verification })
                  } else {
                    setCoppaGate({ kind: 'consent_flow', memberId: m.id, memberName: m.display_name, pendingUpdates: updates, template })
                  }
                } catch (err) {
                  console.error('COPPA gate check failed:', err)
                }
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

      {/* Picture Login Modal */}
      {pictureModal && (
        <PictureModal
          memberId={pictureModal}
          memberName={allMembers?.find((m) => m.id === pictureModal)?.display_name ?? ''}
          onClose={() => {
            setPictureModal(null)
            queryClient.invalidateQueries({ queryKey: ['family-members'] })
          }}
        />
      )}

      {/* Set Login Modal (TEEN-CRED) */}
      {loginModal && (
        <SetLoginModal
          memberId={loginModal}
          memberName={allMembers?.find((m) => m.id === loginModal)?.display_name ?? ''}
          hasFullLogin={allMembers?.find((m) => m.id === loginModal)?.auth_method === 'full_login'}
          onClose={() => setLoginModal(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['family-members'] })}
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

      {/* ── PRD-40 Slice 3: consent gate for edit-to-under-13 ── */}
      {coppaGate.kind === 'dormant' && (
        <CoppaDormantCard
          isOpen
          childNames={[coppaGate.memberName]}
          otherCount={0}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onContinueWithoutThem={() => setCoppaGate({ kind: 'none' })}
        />
      )}
      {coppaGate.kind === 'consent_flow' && (
        <CoppaConsentFlow
          isOpen
          template={coppaGate.template}
          childNames={[coppaGate.memberName]}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onVerified={async (verificationId, ackSections) => {
            await applyConsentedEdit(coppaGate.memberId, coppaGate.pendingUpdates, coppaGate.template, verificationId, ackSections)
            await queryClient.invalidateQueries({ queryKey: ['coppa-parent-verification'] })
          }}
          onDone={() => setCoppaGate({ kind: 'none' })}
        />
      )}
      {coppaGate.kind === 'acknowledge' && (
        <CoppaAcknowledgeModal
          isOpen
          childName={coppaGate.memberName}
          verifiedAtLabel={new Date(coppaGate.verification.verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          template={coppaGate.template}
          onCancel={() => setCoppaGate({ kind: 'none' })}
          onAcknowledge={async () => {
            const gate = coppaGate
            setCoppaGate({ kind: 'none' })
            try {
              await applyConsentedEdit(gate.memberId, gate.pendingUpdates, gate.template, gate.verification.id, [...CONSENT_SECTION_KEYS])
            } catch (err) {
              console.error('COPPA consented edit failed:', err)
            }
          }}
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
  onOpenPicture,
  onOpenInvite,
  onOpenLogin,
  onSave,
  onUnder13Transition,
}: {
  member: { id: string; family_id: string; display_name: string; role: string; dashboard_mode: string | null; member_color: string | null; age: number | null; date_of_birth: string | null; relationship: string | null; custom_role: string | null; auth_method: string | null; login_username?: string | null; coppa_age_bracket?: CoppaAgeBracket | null }
  isEditing: boolean
  onToggleEdit: () => void
  onOpenPin: () => void
  onOpenPicture: () => void
  onOpenInvite: () => void
  /** TEEN-CRED: peer action to Set PIN / Set Picture Login. */
  onOpenLogin: () => void
  onSave: (updates: Record<string, unknown>) => Promise<void>
  /** PRD-40: bracket changed TO under_13 — parent routes through the consent gate. */
  onUnder13Transition: (updates: Record<string, unknown>) => void
}) {
  const [name, setName] = useState(member.display_name)
  const [mode, setMode] = useState(member.dashboard_mode || 'guided')
  const [dob, setDob] = useState(member.date_of_birth || '')
  const [color, setColor] = useState(member.member_color || '')
  const [bracket, setBracket] = useState<CoppaAgeBracket>(member.coppa_age_bracket ?? 'adult')
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
            onClick={onOpenPicture}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Set Picture Login"
          >
            <ImageIcon size={16} />
          </button>
          <button
            onClick={onOpenLogin}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Set Login"
          >
            <LogIn size={16} />
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
          {/* PRD-40: age-bracket selector (children only) + R-14 transition nudge */}
          {member.role === 'member' && (
            <div data-testid="coppa-bracket-selector-edit">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Age bracket</label>
              <div className="flex flex-wrap gap-3">
                {(['under_13', '13_to_17', 'adult'] as const).map((b) => (
                  <label key={b} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)', minHeight: '28px' }}>
                    <input
                      type="radio"
                      name={`bracket-edit-${member.id}`}
                      value={b}
                      checked={bracket === b}
                      onChange={() => setBracket(b)}
                      style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                    />
                    {BRACKET_LABELS[b]}
                  </label>
                ))}
              </div>
              {(() => {
                // R-14: members bracketed under_13 without a DOB never
                // auto-transition — show a gentle nudge when the static age
                // (or an entered birthday) suggests they're 13+ now.
                const effectiveAge = dob ? calculateAge(dob) : member.age
                const showNudge = bracket === 'under_13' && effectiveAge != null && effectiveAge >= 13
                return showNudge ? (
                  <p className="mt-1.5 text-xs" data-testid="coppa-age-nudge" style={{ color: 'var(--color-text-secondary)' }}>
                    {name || member.display_name} looks like they may be 13 or older now — you can
                    update their age bracket above.
                  </p>
                ) : null
              })()}
            </div>
          )}
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
                const updates: Record<string, unknown> = {
                  display_name: name.trim(),
                  dashboard_mode: mode,
                  date_of_birth: dob || null,
                  member_color: color,
                  assigned_color: color,
                  age,
                  coppa_age_bracket: bracket,
                }
                // PRD-40: transitioning TO under_13 is an add-under-13 event —
                // route through the consent gate, never a bare update.
                const wasUnder13 = (member.coppa_age_bracket ?? 'adult') === 'under_13'
                if (bracket === 'under_13' && !wasUnder13) {
                  setSaving(false)
                  onUnder13Transition(updates)
                  return
                }
                await onSave(updates)
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

/**
 * Picture Login setup (Founder Decision 13 — Family-Auth-Two-Door Phase 4).
 * Mom picks the kid's ONE secret picture (never a sequence). At login the
 * kid taps their picture among decoys; verification is server-side with the
 * same lockout as PINs. Mom can also switch this member to "no login needed"
 * here — safe because every device already passed the family password door.
 */
function PictureModal({ memberId, memberName, onClose }: { memberId: string; memberName: string; onClose: () => void }) {
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
function SetLoginModal({
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
