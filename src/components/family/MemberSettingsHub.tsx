import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  User, KeyRound, ShieldCheck, Wallet, Sparkles, GraduationCap,
  ShieldAlert, Lock, Palette, Eye, ChevronDown, ChevronUp, ExternalLink,
  Key, Image as ImageIcon, LogIn, Mail, Settings2,
} from 'lucide-react'
import { ModalV2, FeatureGuide } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import type { Family } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { getMemberColor } from '@/lib/memberColors'
import { MemberProfileEditor } from './MemberProfileEditor'
import { PinModal, PictureModal, SetLoginModal, InviteModal } from './MemberLoginModals'
import { GamificationSettingsModal } from '@/components/gamification/settings'
import { ChildAllowanceConfigInner } from '@/features/financial/ChildAllowanceConfig'
import { MemberPrivacyConsentCard } from '@/pages/PrivacyConsentPage'
import { useMonitoringConfigs, useUpdateMonitoringConfig, useNotificationRecipients, useUpsertRecipient } from '@/hooks/useSafetyMonitoring'
import { SafetySensitivityModal } from '@/components/safety/SafetySensitivityModal'
import { getMemberSectionApplicability, type SafetyApplicability } from '@/lib/family/memberSettingsHubSections'

/**
 * MEMBER-SETTINGS-HUB (2026-09-07) — founder-directed person-first settings
 * navigation. "Click on the name, access each of their areas — allowance,
 * homework, gamification, etc. — as well as edit pin/password, all from just
 * their name." A LAUNCHER, not a second set of editors: every section below
 * mounts the SAME editor component/modal the rest of the app already uses
 * for that concern, scoped to `targetMember`. Every existing topic-direction
 * surface (Allowance page, Manage Members & PINs, Permission Hub, Safety
 * Monitoring settings) stays exactly as it is — this is a second door into
 * the same rooms, not a new set of rooms.
 *
 * Mom-only (only ever mounted from FamilyMembers.tsx, which is itself behind
 * <MomOnlyRoute>). The "View as" button navigates to /dashboard before
 * starting the session — /family-members is itself mom-only, and
 * MomOnlyRoute reacts to the GLOBAL isViewingAs flag (useEffectiveMember is
 * not scoped to ViewAsModal's own subtree), so starting View-As while still
 * on this route would immediately flip MomOnlyRoute's guard to blocked for
 * the very page hosting the button, and RoleRouter/ViewAsModal would never
 * mount. Landing on /dashboard first is the same host every other View-As
 * entry point in the app already uses. Exiting View-As returns mom to her
 * own Dashboard (not back into the hub — navigating away unmounts
 * FamilyMembers.tsx and its hubMemberId state, same as leaving any other
 * page would). The hub's own `isOpen={!isViewingAs}` wiring still guards
 * against ever rendering the hub UI stacked underneath the overlay in the
 * brief window before that navigation completes.
 */

type SectionKey =
  | 'profile' | 'login' | 'permissions' | 'allowance' | 'gamification'
  | 'homework' | 'safety' | 'privacy' | 'theme'

interface MemberSettingsHubProps {
  targetMember: FamilyMember
  mom: FamilyMember
  family: Family
  onClose: () => void
  onSaveProfile: (updates: Record<string, unknown>) => Promise<void>
  onUnder13Transition: (updates: Record<string, unknown>) => void
  /** Refresh the family-members list after Login & Access actions (PIN/Picture/Login) save. */
  onInvalidate: () => void
}

const SECTION_META: { key: SectionKey; label: string; icon: React.ComponentType<{ size: number }> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'login', label: 'Login & Access', icon: KeyRound },
  { key: 'permissions', label: 'Permissions & Features', icon: ShieldCheck },
  { key: 'allowance', label: 'Allowance & Finances', icon: Wallet },
  { key: 'gamification', label: 'Gamification & Rewards', icon: Sparkles },
  { key: 'homework', label: 'Homework / Homeschool', icon: GraduationCap },
  { key: 'safety', label: 'Safety Monitoring', icon: ShieldAlert },
  { key: 'privacy', label: 'Privacy & Consent', icon: Lock },
  { key: 'theme', label: 'Theme & Appearance', icon: Palette },
]

export function MemberSettingsHub({
  targetMember, mom, family, onClose, onSaveProfile, onUnder13Transition, onInvalidate,
}: MemberSettingsHubProps) {
  const { isViewingAs, startViewAs } = useViewAs()
  const navigate = useNavigate()
  // Convention-style collapsible accordion: default open on Profile only;
  // expanding one section does not auto-collapse others (matches the
  // Sidebar Collapsible Sections convention).
  const [open, setOpen] = useState<Set<SectionKey>>(new Set(['profile']))
  const toggleSection = (key: SectionKey) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [pinOpen, setPinOpen] = useState(false)
  const [pictureOpen, setPictureOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [gamificationOpen, setGamificationOpen] = useState(false)

  const memberColor = getMemberColor(targetMember)
  const applicability = getMemberSectionApplicability(targetMember.role)

  return (
    <ModalV2
      id={`member-settings-hub-${targetMember.id}`}
      isOpen={!isViewingAs}
      onClose={onClose}
      type="persistent"
      // Founder ruling (2026-09-07): the X button here means fully done —
      // no pill left behind. Only the backdrop click (and the separate —
      // minimize button) send the hub to the pill bar. This is scoped to
      // the hub specifically, not a platform-wide default — see
      // ModalV2Props.closeButtonBehavior.
      closeButtonBehavior="close"
      size="xl"
      title={`${targetMember.display_name}'s Settings`}
      subtitle="Everything about this family member, in one place"
      icon={User}
      footer={
        <button
          type="button"
          onClick={async () => {
            // /family-members sits behind <MomOnlyRoute>, which re-evaluates
            // on the GLOBAL isViewingAs flag (useEffectiveMember is not
            // scoped to ViewAsModal's own subtree) — so starting a View-As
            // session while still on this route flips MomOnlyRoute's guard
            // to blocked for the very page we're standing on, and
            // RoleRouter/ViewAsModal never gets a chance to mount. Navigate
            // to /dashboard FIRST (not mom-only, the same host every other
            // View-As entry point in the app already uses) so the overlay
            // actually renders.
            navigate('/dashboard')
            await startViewAs(targetMember, mom.id, family.id, { origin: 'mom_viewing' })
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
        >
          <Eye size={14} /> View as {targetMember.display_name}
        </button>
      }
    >
      <div className="density-tight space-y-4">
        <FeatureGuide featureKey="member_settings_hub" />

        {/* Header strip: avatar + name + role, echoing the modal title on
            wider screens where the ModalV2 header may be minimized to a pill. */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white shrink-0"
            style={{ backgroundColor: memberColor }}
          >
            {targetMember.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate" style={{ color: 'var(--color-text-heading)' }}>{targetMember.display_name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {targetMember.role === 'additional_adult' ? 'Adult'
                : targetMember.role === 'special_adult' ? (targetMember.custom_role || 'Special Adult')
                : (targetMember.dashboard_mode ?? 'guided')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {SECTION_META.map(({ key, label, icon: Icon }) => (
            <SectionAccordion
              key={key}
              icon={Icon}
              label={label}
              isOpen={open.has(key)}
              onToggle={() => toggleSection(key)}
            >
              {key === 'profile' && (
                <MemberProfileEditor
                  member={targetMember}
                  onSave={onSaveProfile}
                  onUnder13Transition={onUnder13Transition}
                />
              )}

              {key === 'login' && (
                <div className="space-y-2">
                  <LaunchRow icon={Key} label="Set PIN" onClick={() => setPinOpen(true)} />
                  <LaunchRow icon={ImageIcon} label="Set Picture Login" onClick={() => setPictureOpen(true)} />
                  <LaunchRow icon={LogIn} label="Set Login (email/username + password)" onClick={() => setLoginOpen(true)} />
                  <LaunchRow icon={Mail} label="Send Invite" onClick={() => setInviteOpen(true)} />
                </div>
              )}

              {key === 'permissions' && <PermissionsSummarySection member={targetMember} />}

              {key === 'allowance' && (
                applicability.allowanceApplicable ? (
                  <ChildAllowanceConfigInner memberId={targetMember.id} />
                ) : (
                  <NotApplicableNote text="Allowance isn't configured for adults or special adults." />
                )
              )}

              {key === 'gamification' && (
                <LaunchRow icon={Sparkles} label="Open Gamification Settings" onClick={() => setGamificationOpen(true)} />
              )}

              {key === 'homework' && (
                <NotApplicableNote
                  text={applicability.isKidRole
                    ? "Homework & Homeschool has a family-wide config plus optional per-child overrides, but there's no dedicated per-child editor here yet. Head to your homeschool settings to adjust hours and subjects."
                    : "Homework & Homeschool settings apply to kids, not adults."}
                />
              )}

              {key === 'safety' && (
                <MemberSafetySection
                  member={targetMember}
                  familyId={family.id}
                  safety={applicability.safety}
                  showsRecipientToggle={applicability.safetyShowsRecipientToggle}
                />
              )}

              {key === 'privacy' && (
                applicability.privacyApplicable ? (
                  <MemberPrivacyConsentCard memberId={targetMember.id} memberName={targetMember.display_name} />
                ) : (
                  <NotApplicableNote text="Privacy & Consent (COPPA) applies to children under 13." />
                )
              )}

              {key === 'theme' && (
                <NotApplicableNote text={`Members choose their own theme and appearance when they're logged in — there isn't a way to set it on ${targetMember.display_name}'s behalf yet.`} />
              )}
            </SectionAccordion>
          ))}
        </div>
      </div>

      {pinOpen && (
        <PinModal memberId={targetMember.id} memberName={targetMember.display_name} onClose={() => { setPinOpen(false); onInvalidate() }} />
      )}
      {pictureOpen && (
        <PictureModal memberId={targetMember.id} memberName={targetMember.display_name} onClose={() => { setPictureOpen(false); onInvalidate() }} />
      )}
      {loginOpen && (
        <SetLoginModal
          memberId={targetMember.id}
          memberName={targetMember.display_name}
          hasFullLogin={targetMember.auth_method === 'full_login'}
          onClose={() => setLoginOpen(false)}
          onSaved={onInvalidate}
        />
      )}
      {inviteOpen && (
        <InviteModal memberId={targetMember.id} memberName={targetMember.display_name} familyId={family.id} onClose={() => setInviteOpen(false)} />
      )}
      <GamificationSettingsModal
        isOpen={gamificationOpen}
        onClose={() => setGamificationOpen(false)}
        memberId={targetMember.id}
        memberName={targetMember.display_name}
        familyId={targetMember.family_id}
      />
    </ModalV2>
  )
}

function SectionAccordion({
  icon: Icon, label, isOpen, onToggle, children,
}: {
  icon: React.ComponentType<{ size: number }>
  label: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 p-3 text-left"
        style={{ background: 'transparent', border: 'none' }}
        data-testid={`hub-section-toggle-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      >
        <Icon size={16} />
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>{label}</span>
        {isOpen ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  )
}

function LaunchRow({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size: number }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
        color: 'var(--color-btn-primary-bg)',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 25%, transparent)',
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function NotApplicableNote({ text }: { text: string }) {
  return (
    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
  )
}

/**
 * Read-only summary of member_feature_toggles for this member + a deep link
 * to the real Permission Hub (/permissions) for actual editing. This is
 * deliberately NOT a re-implementation of the Permission Hub's grid — that
 * page's write logic (grants, tier gating, per-role sections) is the
 * existing editor; this section is a glance + a launcher to it.
 */
function PermissionsSummarySection({ member }: { member: FamilyMember }) {
  const { data } = useQuery({
    queryKey: ['member-settings-hub-permissions-summary', member.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_feature_toggles')
        .select('feature_key, enabled, is_disabled')
        .eq('member_id', member.id)
      if (error) throw error
      return data ?? []
    },
  })
  const total = data?.length ?? 0
  const disabledCount = data?.filter((r) => r.enabled === false || r.is_disabled === true).length ?? 0

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {total === 0
          ? `${member.display_name} has no custom permission overrides — they follow the default access for their role.`
          : `${disabledCount} of ${total} feature${total === 1 ? '' : 's'} customized for ${member.display_name} (turned off or overridden).`}
      </p>
      <Link
        to="/permissions"
        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
      >
        <span className="flex items-center gap-1.5"><Settings2 size={14} /> Open full Permission Hub</span>
        <ExternalLink size={14} style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }} />
      </Link>
    </div>
  )
}

/**
 * This member's slice of Settings → Safety Monitoring: the same
 * `useMonitoringConfigs`/`useUpdateMonitoringConfig` hooks, same
 * `SafetySensitivityModal`, filtered to one member. Dad additionally gets
 * the "receives alerts" recipient toggle, since that setting genuinely is
 * about him specifically.
 */
function MemberSafetySection({
  member, familyId, safety, showsRecipientToggle,
}: { member: FamilyMember; familyId: string; safety: SafetyApplicability; showsRecipientToggle: boolean }) {
  const { data: configs = [] } = useMonitoringConfigs(familyId)
  const { data: recipients = [] } = useNotificationRecipients(familyId)
  const updateConfig = useUpdateMonitoringConfig()
  const upsertRecipient = useUpsertRecipient()
  const [sensitivityOpen, setSensitivityOpen] = useState(false)

  if (safety === 'none') {
    return <NotApplicableNote text="Safety monitoring applies to kids and other adults, not special adults." />
  }

  const cfg = configs.find((c) => c.monitored_member_id === member.id)
  const isActive = cfg?.is_active ?? false
  const recipient = recipients.find((r) => r.recipient_member_id === member.id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Monitored</span>
        <HubToggle
          checked={isActive}
          onChange={(v) => cfg && updateConfig.mutate({ id: cfg.id, isActive: v, familyId })}
        />
      </div>
      {isActive && (
        <button
          type="button"
          onClick={() => setSensitivityOpen(true)}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--color-btn-primary-bg)', background: 'transparent', border: 'none' }}
        >
          <Settings2 size={12} /> Sensitivity settings
        </button>
      )}
      {showsRecipientToggle && (
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Receives alerts</span>
          <HubToggle
            checked={!!recipient?.is_active}
            onChange={(v) => upsertRecipient.mutate({ familyId, recipientMemberId: member.id, isActive: v })}
          />
        </div>
      )}
      <Link to="/safety-flags" className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        View Flag History →
      </Link>
      {sensitivityOpen && (
        <SafetySensitivityModal
          isOpen
          onClose={() => setSensitivityOpen(false)}
          familyId={familyId}
          memberId={member.id}
          memberName={member.display_name}
          dashboardMode={member.dashboard_mode}
        />
      )}
    </div>
  )
}

function HubToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{
        backgroundColor: checked ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        minHeight: 'unset',
      }}
      aria-pressed={checked}
    >
      <span
        className="inline-block h-4 w-4 rounded-full transition-transform"
        style={{
          backgroundColor: checked ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(22px)' : 'translateX(4px)',
        }}
      />
    </button>
  )
}
