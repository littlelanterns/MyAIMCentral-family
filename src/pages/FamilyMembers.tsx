import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Key, UserPlus, Users, Settings2, Mail, Cake, LayoutDashboard, Sparkles, Image as ImageIcon, LogIn, ShieldCheck, ChevronRight } from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureGuide } from '@/components/shared'
import { GuidedManagementScreen } from '@/components/guided'
import { GamificationSettingsModal } from '@/components/gamification/settings'
import { BatchConsentModal } from '@/components/coppa/BatchConsentModal'
import { type CoppaAgeBracket } from '@/lib/coppa/brackets'
import { MemberProfileEditor } from '@/components/family/MemberProfileEditor'
import { MemberSettingsHub } from '@/components/family/MemberSettingsHub'
import { PictureModal, SetLoginModal, PinModal, InviteModal } from '@/components/family/MemberLoginModals'
import { useMemberSaveAndConsentGate } from '@/hooks/useMemberSaveAndConsentGate'

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
  const [batchConsentOpen, setBatchConsentOpen] = useState(false)
  // MEMBER-SETTINGS-HUB: person-first launcher (2026-09-07) — clicking a
  // member's name/row opens their hub. Same save/consent-gate machinery as
  // the inline "Edit" pencil below (shared with Settings → Family Management's
  // roster preview too) — see useMemberSaveAndConsentGate.
  const [hubMemberId, setHubMemberId] = useState<string | null>(null)
  const { handleSaveMember, handleUnder13Transition, gateModals } = useMemberSaveAndConsentGate({
    momId: member?.id,
    isFoundingFamily: family?.is_founding_family,
    onSaved: () => setEditingId(null),
  })

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
          {otherMembers.some((m) => m.role === 'member') && (
            <button
              type="button"
              onClick={() => setBatchConsentOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              <ShieldCheck size={16} /> Set Up Under-13 Consent
            </button>
          )}
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
              onOpenHub={() => setHubMemberId(m.id)}
              onOpenPin={() => setPinModal(m.id)}
              onOpenPicture={() => setPictureModal(m.id)}
              onOpenInvite={() => setInviteModal(m.id)}
              onOpenLogin={() => setLoginModal(m.id)}
              onSave={(updates) => handleSaveMember(m.id, updates)}
              onUnder13Transition={(updates) => handleUnder13Transition(m.id, m.display_name, m.family_id, updates)}
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

      {/* ── PRD-40: batch consent setup for several existing children ── */}
      <BatchConsentModal
        isOpen={batchConsentOpen}
        onClose={() => setBatchConsentOpen(false)}
        allMembers={otherMembers.map((m) => ({
          id: m.id,
          display_name: m.display_name,
          role: m.role,
          coppa_age_bracket: m.coppa_age_bracket ?? 'adult',
          member_color: m.member_color,
          assigned_color: m.assigned_color,
          calendar_color: m.calendar_color,
        }))}
        onCommitted={async () => {
          await queryClient.invalidateQueries({ queryKey: ['family-members'] })
          await queryClient.invalidateQueries({ queryKey: ['coppa-consent-records'] })
          await queryClient.invalidateQueries({ queryKey: ['coppa-parent-verification'] })
        }}
      />

      {/* ── PRD-40 Slice 3: consent gate for edit-to-under-13 (shared) ── */}
      {gateModals}

      {/* ── MEMBER-SETTINGS-HUB: click a member's name/row to open ── */}
      {hubMemberId && (() => {
        const target = allMembers?.find((m) => m.id === hubMemberId)
        if (!target || !member || !family) return null
        return (
          <MemberSettingsHub
            targetMember={target}
            mom={member}
            family={family}
            onClose={() => setHubMemberId(null)}
            onSaveProfile={(updates) => handleSaveMember(target.id, updates)}
            onUnder13Transition={(updates) => handleUnder13Transition(target.id, target.display_name, target.family_id, updates)}
            onInvalidate={() => queryClient.invalidateQueries({ queryKey: ['family-members'] })}
          />
        )
      })()}
    </div>
  )
}

function MemberRow({
  member,
  isEditing,
  onToggleEdit,
  onOpenHub,
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
  /** MEMBER-SETTINGS-HUB: open the person-first settings hub for this member. */
  onOpenHub: () => void
  onOpenPin: () => void
  onOpenPicture: () => void
  onOpenInvite: () => void
  /** TEEN-CRED: peer action to Set PIN / Set Picture Login. */
  onOpenLogin: () => void
  onSave: (updates: Record<string, unknown>) => Promise<void>
  /** PRD-40: bracket changed TO under_13 — parent routes through the consent gate. */
  onUnder13Transition: (updates: Record<string, unknown>) => void
}) {
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
        <button
          type="button"
          onClick={onOpenHub}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          style={{ background: 'transparent', border: 'none', padding: 0, minHeight: 'unset' }}
          data-testid={`member-hub-open-${member.id}`}
          title={`Open ${member.display_name}'s settings`}
        >
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
              {(() => {
                // Display-only: derive from date_of_birth (same math the edit
                // modal uses) so the list never shows a stale age snapshot.
                // Falls back to the static column only when there's no DOB to
                // compute from. Never writes member.age.
                const displayAge = member.date_of_birth ? calculateAge(member.date_of_birth) : member.age
                return displayAge != null ? ` | Age ${displayAge}` : ''
              })()}
              {member.date_of_birth && (
                <span className="inline-flex items-center gap-0.5">
                  <Cake size={10} /> {formatBirthday(member.date_of_birth)}
                </span>
              )}
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 hidden sm:block" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }} />
        </button>
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
          <div className="pt-3">
            <MemberProfileEditor
              member={member}
              onSave={onSave}
              onUnder13Transition={onUnder13Transition}
              onCancel={onToggleEdit}
            />
          </div>
          {/* PRD-25: Manage Dashboard button for Guided members */}
          {member.dashboard_mode === 'guided' && (
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

