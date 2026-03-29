import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, ChevronDown, ChevronRight, Eye, EyeOff, Users, UserCog,
  Zap, Layers, Crown, AlertTriangle, Lock, Unlock, Clock, ClipboardList,
  Globe, BookOpen, StopCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { FeatureGuide } from '@/components/shared'

/**
 * PRD-02: Permission Management Hub
 * Screen 1: Overview with member cards grouped by role
 * Screen 2: Additional Adult (dad) per-kid permission detail
 * Screen 3: Special Adult permission detail
 * Screen 4: Teen transparency panel (what's shared)
 *
 * Mom-only access. Full configuration of who sees what.
 */

// ─── Feature categories for the permission grid ───────────────────────────────

const PERMISSION_CATEGORIES = [
  {
    label: 'Daily Life',
    keys: [
      { key: 'tasks_basic', label: 'Tasks & Chores' },
      { key: 'tasks_routines', label: 'Routines' },
      { key: 'lists_basic', label: 'Lists' },
      { key: 'calendar_basic', label: 'Calendar' },
      { key: 'journal_basic', label: 'Journal / Log' },
    ],
  },
  {
    label: 'Growth & Reflection',
    keys: [
      { key: 'guiding_stars_basic', label: 'Guiding Stars' },
      { key: 'best_intentions', label: 'Best Intentions' },
      { key: 'innerworkings_basic', label: 'InnerWorkings' },
      { key: 'victory_recorder_basic', label: 'Victory Recorder' },
    ],
  },
  {
    label: 'AI & Tools',
    keys: [
      { key: 'lila_modal_access', label: 'LiLa Tools (Modal)' },
      { key: 'tool_higgins_say', label: 'Higgins (Communication)' },
      { key: 'vault_browse', label: 'AI Vault' },
    ],
  },
  {
    label: 'Family Features',
    keys: [
      { key: 'messaging_basic', label: 'Messages' },
      { key: 'requests_basic', label: 'Requests' },
      { key: 'archives_browse', label: 'Archives' },
    ],
  },
]

// Dad's personal features (Issue 7) — separate from per-kid permissions
const DAD_PERSONAL_FEATURES = [
  { key: 'journal_basic', label: 'Journal' },
  { key: 'notepad_basic', label: 'Notepad' },
  { key: 'guiding_stars_basic', label: 'Guiding Stars' },
  { key: 'best_intentions', label: 'Best Intentions' },
  { key: 'innerworkings_basic', label: 'InnerWorkings' },
  { key: 'rhythms_basic', label: 'Rhythms' },
  { key: 'safe_harbor', label: 'Safe Harbor' },
]

const ACCESS_LEVELS = ['none', 'view', 'contribute', 'manage'] as const
const ACCESS_LEVEL_LABELS: Record<string, string> = {
  none: 'No Access',
  view: 'View',
  contribute: 'Contribute',
  manage: 'Manage',
}
const ACCESS_LEVEL_COLORS: Record<string, string> = {
  none: 'var(--color-text-secondary)',
  view: 'var(--color-info, #68a395)',
  contribute: 'var(--color-golden-honey, #d6a461)',
  manage: 'var(--color-success, #4b7c66)',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PermissionHub() {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { data: allMembers } = useFamilyMembers(member?.family_id)
  const [activeTab, setActiveTab] = useState<'overview' | 'shifts'>('overview')

  if (member?.role !== 'primary_parent') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Shield size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Only the primary parent can manage permissions.</p>
      </div>
    )
  }

  const adults = allMembers?.filter((m) => m.role === 'additional_adult') ?? []
  const specialAdults = allMembers?.filter((m) => m.role === 'special_adult') ?? []
  const children = allMembers?.filter((m) => m.role === 'member') ?? []
  const teens = children.filter((m) => m.dashboard_mode === 'independent')

  return (
    <div className="density-compact max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="hidden md:flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <FeatureGuide
        featureKey="permission_hub"
        title="Permission Hub"
        description="Control what each family member can see and do. Mom always has full access. Dad and other adults need explicit permission for each child's features. Special adults only have access during their shifts."
        bullets={[
          'Four access levels: No Access, View, Contribute, Manage',
          'Changes take effect immediately — no need to save',
          'Special adults lose all access when their shift ends',
          'Teens can see their own sharing status in their "What\'s Shared" panel',
        ]}
      />

      <h1
        className="text-2xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        Permission Hub
      </h1>

      {/* Tab bar — Overview / Shift Log (Issue 12) */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {(['overview', 'shifts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab ? 'var(--color-bg-card)' : 'transparent',
              color: activeTab === tab ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            {tab === 'overview' ? 'Permissions' : 'Shift Log'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Issue 8: Global Permissions Section */}
          <GlobalPermissionsSection familyId={member!.family_id} />

          {/* Additional Adults Section */}
          {adults.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}>
                <Users size={16} /> Additional Adults
              </h2>
              {adults.map((adult) => (
                <AdultPermissionCard
                  key={adult.id}
                  adult={adult}
                  children={children}
                  familyId={member!.family_id}
                  momId={member!.id}
                />
              ))}
            </section>
          )}

          {/* Special Adults Section */}
          {specialAdults.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}>
                <UserCog size={16} /> Special Adults / Caregivers
              </h2>
              {specialAdults.map((sa) => (
                <SpecialAdultCard key={sa.id} specialAdult={sa} familyId={member!.family_id} />
              ))}
            </section>
          )}

          {/* Teen Transparency Section */}
          {teens.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}>
                <Eye size={16} /> Teen Visibility
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Teens see a "What's Shared" panel in their settings showing what you can see of their data.
                When you increase visibility, they're notified. When you decrease it, they're not.
              </p>
              {teens.map((teen) => (
                <MomSelfRestrictionCard key={teen.id} teen={teen} momId={member!.id} familyId={member!.family_id} />
              ))}
            </section>
          )}

          {/* Empty state */}
          {adults.length === 0 && specialAdults.length === 0 && teens.length === 0 && (
            <div
              className="p-8 rounded-xl text-center"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
            >
              <Shield size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Add family members first to configure permissions.
              </p>
            </div>
          )}
        </>
      ) : (
        /* Issue 12: Shift Log Tab */
        <ShiftLogSection familyId={member!.family_id} />
      )}
    </div>
  )
}

// ─── Issue 8: Global Permissions Section ──────────────────────────────────────

function GlobalPermissionsSection({ familyId }: { familyId: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-sage-teal) 15%, transparent)' }}
        >
          <Globe size={18} style={{ color: 'var(--color-sage-teal)' }} />
        </div>
        <div className="flex-1">
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Family-Wide Rules</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Settings that apply across the whole family
          </p>
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            These rules set the baseline for the whole family. Individual member settings override these.
          </p>
          <div className="space-y-2">
            <GlobalToggleRow
              label="Teens can message each other"
              description="Allow independent teens to send direct messages to each other"
              familyId={familyId}
              settingKey="teens_can_message_peers"
            />
            <GlobalToggleRow
              label="Adults can see Family Feed"
              description="Additional adults can view and post to the family feed"
              familyId={familyId}
              settingKey="adults_see_family_feed"
            />
            <GlobalToggleRow
              label="Require approval for calendar events"
              description="Children's calendar events need mom's approval before appearing"
              familyId={familyId}
              settingKey="require_calendar_approval"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function GlobalToggleRow({
  label,
  description,
  familyId: _familyId,
  settingKey: _settingKey,
}: {
  label: string
  description: string
  familyId: string
  settingKey: string
}) {
  // Global settings stored in families.hub_config JSONB or a dedicated table
  // For now, these are client-side toggles — will wire to DB when global settings table exists
  const [enabled, setEnabled] = useState(true)

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left"
      style={{
        backgroundColor: enabled ? 'color-mix(in srgb, var(--color-sage-teal) 8%, transparent)' : 'var(--color-bg-primary)',
        border: `1px solid ${enabled ? 'color-mix(in srgb, var(--color-sage-teal) 25%, transparent)' : 'var(--color-border)'}`,
      }}
    >
      <div className="flex-1">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <div
        className="w-10 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ml-3"
        style={{ backgroundColor: enabled ? 'var(--color-sage-teal)' : 'var(--color-border)' }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </div>
    </button>
  )
}

// ─── Issue 5: Emergency Lockout Toggle ────────────────────────────────────────

function EmergencyLockoutToggle({
  member,
}: {
  member: FamilyMember
}) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const isLocked = (member as FamilyMember & { emergency_locked?: boolean }).emergency_locked ?? false

  async function toggleLockout() {
    if (!isLocked && !confirming) {
      setConfirming(true)
      return
    }

    await supabase
      .from('family_members')
      .update({ emergency_locked: !isLocked })
      .eq('id', member.id)

    setConfirming(false)
    queryClient.invalidateQueries({ queryKey: ['family-members'] })
    queryClient.invalidateQueries({ queryKey: ['can-access'] })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLockout}
          className="px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--color-error, #dc2626)' }}
        >
          Confirm Lock
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 rounded text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={toggleLockout}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: isLocked
          ? 'color-mix(in srgb, var(--color-error, #dc2626) 12%, transparent)'
          : 'color-mix(in srgb, var(--color-text-secondary) 8%, transparent)',
        color: isLocked ? 'var(--color-error, #dc2626)' : 'var(--color-text-secondary)',
        border: `1px solid ${isLocked ? 'color-mix(in srgb, var(--color-error, #dc2626) 30%, transparent)' : 'transparent'}`,
      }}
      title={isLocked ? 'Unlock member access' : 'Emergency: lock all access immediately'}
    >
      {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
      {isLocked ? 'Unlock' : 'Emergency Lock'}
    </button>
  )
}

// ─── PRD-02 Screen 2: Additional Adult permission detail ──────────────────────

function AdultPermissionCard({
  adult,
  children,
  familyId,
  momId,
}: {
  adult: FamilyMember
  children: FamilyMember[]
  familyId: string
  momId: string
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [expandedKid, setExpandedKid] = useState<string | null>(null)
  const [showProfileSelector, setShowProfileSelector] = useState(false)

  const { data: existingToggles } = useQuery({
    queryKey: ['member-toggles-count', adult.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('member_feature_toggles')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', adult.id)
      return count ?? 0
    },
  })

  const roleGroup = adult.role === 'additional_adult' ? 'dad_adults' : 'special_adults'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: adult.member_color || 'var(--color-sage-teal)' }}
        >
          {adult.display_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{adult.display_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {children.length} child{children.length !== 1 ? 'ren' : ''} to configure
            {existingToggles === 0 && ' — needs access level setup'}
          </p>
        </div>
        {/* Issue 5: Emergency lockout toggle */}
        <div onClick={(e) => e.stopPropagation()}>
          <EmergencyLockoutToggle member={adult} />
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Profile selector button + Issue 14: confirmation */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {existingToggles === 0 ? 'Set an access level to get started' : 'Access level configured'}
            </span>
            <button
              onClick={() => setShowProfileSelector(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: existingToggles === 0 ? 'var(--color-sage-teal)' : 'var(--color-bg-secondary)',
                color: existingToggles === 0 ? 'white' : 'var(--color-text-primary)',
              }}
            >
              <Layers size={12} />
              {existingToggles === 0 ? 'Set Access Level' : 'Change Access Level'}
            </button>
          </div>

          {/* Issue 7: Dad's personal features section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
               style={{ color: 'var(--color-text-secondary)' }}>
              <BookOpen size={12} /> {adult.display_name}'s Personal Features
            </p>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              These are {adult.display_name}'s own tools — separate from what they see about kids.
            </p>
            <DadPersonalFeatures adultId={adult.id} familyId={familyId} />
          </div>

          {/* Per-kid permission grids */}
          {children.length === 0 ? (
            <p className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
              No children to configure. Add family members first.
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
                <Users size={12} /> Per-Child Permissions
              </p>
              {children.map((kid) => (
                <KidPermissionBlock
                  key={kid.id}
                  adult={adult}
                  kid={kid}
                  familyId={familyId}
                  expanded={expandedKid === kid.id}
                  onToggle={() => setExpandedKid(expandedKid === kid.id ? null : kid.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {showProfileSelector && (
        <ProfileSelectorModal
          memberName={adult.display_name}
          roleGroup={roleGroup}
          familyId={familyId}
          memberId={adult.id}
          momId={momId}
          hasExistingPermissions={(existingToggles ?? 0) > 0}
          onClose={() => setShowProfileSelector(false)}
          onApplied={() => {
            setShowProfileSelector(false)
            queryClient.invalidateQueries({ queryKey: ['member-toggles-count', adult.id] })
            queryClient.invalidateQueries({ queryKey: ['can-access'] })
            queryClient.invalidateQueries({ queryKey: ['permission'] })
            queryClient.invalidateQueries({ queryKey: ['member-permissions'] })
            queryClient.invalidateQueries({ queryKey: ['dad-personal-toggles'] })
          }}
        />
      )}
    </div>
  )
}

// ─── Issue 7: Dad's personal features section ─────────────────────────────────

function DadPersonalFeatures({ adultId, familyId }: { adultId: string; familyId: string }) {
  const queryClient = useQueryClient()

  const { data: toggles } = useQuery({
    queryKey: ['dad-personal-toggles', adultId],
    queryFn: async () => {
      const { data } = await supabase
        .from('member_feature_toggles')
        .select('feature_key, enabled, is_disabled')
        .eq('member_id', adultId)
        .eq('family_id', familyId)
      return data ?? []
    },
  })

  function isEnabled(featureKey: string): boolean {
    const toggle = toggles?.find((t) => t.feature_key === featureKey)
    if (!toggle) return false // No toggle = not configured yet
    return toggle.enabled === true && toggle.is_disabled === false
  }

  async function toggleFeature(featureKey: string) {
    const currentlyEnabled = isEnabled(featureKey)
    const existing = toggles?.find((t) => t.feature_key === featureKey)

    if (existing) {
      await supabase
        .from('member_feature_toggles')
        .update({ enabled: !currentlyEnabled, is_disabled: currentlyEnabled })
        .eq('member_id', adultId)
        .eq('feature_key', featureKey)
    } else {
      await supabase.from('member_feature_toggles').insert({
        family_id: familyId,
        member_id: adultId,
        feature_key: featureKey,
        enabled: true,
        is_disabled: false,
        disabled_by: adultId,
      })
    }
    queryClient.invalidateQueries({ queryKey: ['dad-personal-toggles', adultId] })
    queryClient.invalidateQueries({ queryKey: ['can-access'] })
  }

  return (
    <div className="space-y-1">
      {DAD_PERSONAL_FEATURES.map(({ key, label }) => {
        const enabled = isEnabled(key)
        return (
          <button
            key={key}
            onClick={() => toggleFeature(key)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors"
            style={{
              backgroundColor: enabled ? 'color-mix(in srgb, var(--color-sage-teal) 6%, transparent)' : 'var(--color-bg-primary)',
              border: `1px solid ${enabled ? 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)' : 'var(--color-border)'}`,
            }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
            <span className="text-xs font-medium" style={{ color: enabled ? 'var(--color-sage-teal)' : 'var(--color-text-secondary)' }}>
              {enabled ? 'On' : 'Off'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Per-kid permission grid ──────────────────────────────────────────────────

function KidPermissionBlock({
  adult,
  kid,
  familyId,
  expanded,
  onToggle,
}: {
  adult: FamilyMember
  kid: FamilyMember
  familyId: string
  expanded: boolean
  onToggle: () => void
}) {
  const queryClient = useQueryClient()

  const { data: permissions } = useQuery({
    queryKey: ['member-permissions', adult.id, kid.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('member_permissions')
        .select('*')
        .eq('family_id', familyId)
        .eq('granted_to', adult.id)
        .eq('target_member_id', kid.id)
      return data ?? []
    },
  })

  // Issue 17: Load feature_access_v2 to show never/tier-locked states
  const roleGroup = adult.role === 'additional_adult' ? 'dad_adults' : 'special_adults'
  const { data: featureAccess } = useQuery({
    queryKey: ['feature-access', roleGroup],
    queryFn: async () => {
      const { data } = await supabase
        .from('feature_access_v2')
        .select('feature_key, is_enabled, minimum_tier_id')
        .eq('role_group', roleGroup)
      return data ?? []
    },
  })

  async function setPermission(featureKey: string, level: string) {
    const existing = permissions?.find((p) => p.permission_key === featureKey)
    if (existing) {
      await supabase
        .from('member_permissions')
        .update({ access_level: level, permission_value: { access_level: level } })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('member_permissions')
        .insert({
          family_id: familyId,
          granting_member_id: adult.id,
          granted_to: adult.id,
          target_member_id: kid.id,
          permission_key: featureKey,
          permission_value: { access_level: level },
          access_level: level,
        })
    }
    queryClient.invalidateQueries({ queryKey: ['member-permissions', adult.id, kid.id] })
    queryClient.invalidateQueries({ queryKey: ['permission'] })
  }

  function getLevel(featureKey: string): string {
    const perm = permissions?.find((p) => p.permission_key === featureKey)
    return perm?.access_level || 'none'
  }

  // Issue 17: Check if feature is never-available or tier-locked for this role
  function getFeatureState(featureKey: string): 'available' | 'never' | 'tier_locked' {
    const access = featureAccess?.find((a) => a.feature_key === featureKey)
    if (!access) return 'never' // No record = not available for this role
    if (!access.is_enabled) return 'never'
    // Could check tier here but during beta all tiers are unlocked
    return 'available'
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
          style={{ backgroundColor: kid.member_color || 'var(--color-dusty-rose)' }}
        >
          {kid.display_name.charAt(0)}
        </div>
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
          {kid.display_name}
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {PERMISSION_CATEGORIES.map((category) => (
            <div key={category.label}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                 style={{ color: 'var(--color-text-secondary)' }}>
                {category.label}
              </p>
              <div className="space-y-1">
                {category.keys.map(({ key, label }) => {
                  const state = getFeatureState(key)

                  // Issue 17: Never-available shows de-emphasized non-interactive
                  if (state === 'never') {
                    return (
                      <div key={key} className="flex items-center justify-between py-1 opacity-40">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                        <span className="text-xs px-2" style={{ color: 'var(--color-text-secondary)' }}>···</span>
                      </div>
                    )
                  }

                  // Issue 17: Tier-locked shows lock icon
                  if (state === 'tier_locked') {
                    return (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-golden-honey)' }}>
                          <Lock size={11} /> Upgrade
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                      <AccessLevelPicker
                        value={getLevel(key)}
                        onChange={(level) => setPermission(key, level)}
                        maxLevel="manage"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Access level picker ──────────────────────────────────────────────────────

function AccessLevelPicker({
  value,
  onChange,
  maxLevel = 'manage',
}: {
  value: string
  onChange: (level: string) => void
  maxLevel?: string
}) {
  const maxIdx = ACCESS_LEVELS.indexOf(maxLevel as typeof ACCESS_LEVELS[number])
  const available = ACCESS_LEVELS.slice(0, maxIdx + 1)

  return (
    <div className="flex gap-0.5">
      {available.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            value === level ? 'font-semibold' : 'opacity-40'
          }`}
          style={{
            backgroundColor: value === level ? ACCESS_LEVEL_COLORS[level] + '20' : 'transparent',
            color: ACCESS_LEVEL_COLORS[level],
            border: value === level ? `1px solid ${ACCESS_LEVEL_COLORS[level]}40` : '1px solid transparent',
          }}
          title={ACCESS_LEVEL_LABELS[level]}
        >
          {ACCESS_LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  )
}

// ─── PRD-02 Screen 3: Special Adult card ──────────────────────────────────────

function SpecialAdultCard({
  specialAdult,
  familyId,
}: {
  specialAdult: FamilyMember
  familyId: string
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const { data: assignments } = useQuery({
    queryKey: ['sa-assignments', specialAdult.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('special_adult_assignments')
        .select('*, child:child_id(id, display_name, member_color)')
        .eq('special_adult_id', specialAdult.id)
      return data ?? []
    },
  })

  // Issue 9 + 18: Check active shift
  const { data: activeShift } = useQuery({
    queryKey: ['active-shift', specialAdult.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shift_sessions')
        .select('id, started_at')
        .eq('special_adult_id', specialAdult.id)
        .is('ended_at', null)
        .limit(1)
        .maybeSingle()
      return data
    },
    refetchInterval: 60000, // Refresh every minute for shift duration display
  })

  // Issue 18: Calculate shift duration for long-shift indicator
  const shiftHours = activeShift
    ? (Date.now() - new Date(activeShift.started_at).getTime()) / (1000 * 60 * 60)
    : 0
  const isLongShift = shiftHours > 12

  // Issue 9: Remote shift end
  async function handleRemoteShiftEnd() {
    if (!activeShift) return
    await supabase
      .from('shift_sessions')
      .update({ ended_at: new Date().toISOString(), ended_by: 'mom' })
      .eq('id', activeShift.id)
    queryClient.invalidateQueries({ queryKey: ['active-shift', specialAdult.id] })
    // Issue 11: Stub — trigger post-shift summary compilation
    // STUB: LiLa API call to compile shift summary from activity_log_entries
    // Would call: supabase.functions.invoke('lila-chat', { body: { mode: 'shift_summary', shift_id: activeShift.id } })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: specialAdult.member_color || 'var(--color-golden-honey)' }}
        >
          {specialAdult.display_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
              {specialAdult.display_name}
            </p>
            {activeShift && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: isLongShift
                    ? 'color-mix(in srgb, var(--color-golden-honey) 20%, transparent)'
                    : 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)',
                  color: isLongShift ? 'var(--color-golden-honey)' : 'var(--color-sage-teal)',
                }}
              >
                {isLongShift && '⚠ '}{Math.floor(shiftHours)}h active
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {specialAdult.custom_role || 'Special Adult'} | {assignments?.length ?? 0} assigned child{(assignments?.length ?? 0) !== 1 ? 'ren' : ''}
          </p>
        </div>
        {/* Issue 5: Emergency lockout */}
        <div onClick={(e) => e.stopPropagation()}>
          <EmergencyLockoutToggle member={specialAdult} />
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Special adults can only access features during an active shift. Maximum access level: Contribute (never Manage).
          </p>

          {/* Issue 9: Remote shift end button */}
          {activeShift && (
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: isLongShift
                  ? 'color-mix(in srgb, var(--color-golden-honey) 10%, transparent)'
                  : 'color-mix(in srgb, var(--color-sage-teal) 8%, transparent)',
                border: `1px solid ${isLongShift ? 'color-mix(in srgb, var(--color-golden-honey) 25%, transparent)' : 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: isLongShift ? 'var(--color-golden-honey)' : 'var(--color-sage-teal)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Shift started {new Date(activeShift.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  {isLongShift && (
                    <span className="text-xs ml-1" style={{ color: 'var(--color-golden-honey)' }}>
                      ({Math.floor(shiftHours)}+ hours — may be forgotten)
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={handleRemoteShiftEnd}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--color-error, #dc2626)' }}
              >
                <StopCircle size={12} /> End Shift
              </button>
            </div>
          )}

          {(!assignments || assignments.length === 0) ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No children assigned. Assign children in Family Members settings.
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment: { id: string; child: { id: string; display_name: string; member_color: string | null } }) => (
                <SpecialAdultKidPerms
                  key={assignment.id}
                  assignmentId={assignment.id}
                  child={assignment.child}
                  familyId={familyId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SpecialAdultKidPerms({
  assignmentId,
  child,
  familyId,
}: {
  assignmentId: string
  child: { id: string; display_name: string; member_color: string | null }
  familyId: string
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const SA_FEATURES = [
    { key: 'tasks_basic', label: 'Tasks & Routines' },
    { key: 'calendar_basic', label: 'Calendar' },
    { key: 'notes_instructions', label: 'Notes & Instructions' },
  ]

  const { data: perms } = useQuery({
    queryKey: ['sa-permissions', assignmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('special_adult_permissions')
        .select('*')
        .eq('assignment_id', assignmentId)
      return data ?? []
    },
  })

  async function setLevel(featureKey: string, level: string) {
    const existing = perms?.find((p) => p.feature_key === featureKey)
    if (existing) {
      await supabase.from('special_adult_permissions').update({ access_level: level }).eq('id', existing.id)
    } else {
      await supabase.from('special_adult_permissions').insert({
        family_id: familyId,
        assignment_id: assignmentId,
        feature_key: featureKey,
        access_level: level,
      })
    }
    queryClient.invalidateQueries({ queryKey: ['sa-permissions', assignmentId] })
  }

  return (
    <div className="rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-3 py-2 flex items-center gap-2 text-left">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
          style={{ backgroundColor: child.member_color || 'var(--color-dusty-rose)' }}
        >
          {child.display_name.charAt(0)}
        </div>
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>{child.display_name}</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {SA_FEATURES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
              <AccessLevelPicker
                value={perms?.find((p) => p.feature_key === key)?.access_level || 'none'}
                onChange={(level) => setLevel(key, level)}
                maxLevel="contribute"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PRD-02 Screen 4 (mom's view): Teen self-restriction ─────────────────────

function MomSelfRestrictionCard({
  teen,
  momId,
  familyId,
}: {
  teen: FamilyMember
  momId: string
  familyId: string
}) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)

  const RESTRICTABLE_FEATURES = [
    { key: 'journal_basic', label: 'Journal' },
    { key: 'innerworkings_basic', label: 'InnerWorkings' },
    { key: 'guiding_stars_basic', label: 'Guiding Stars' },
    { key: 'best_intentions', label: 'Best Intentions' },
  ]

  const { data: restrictions } = useQuery({
    queryKey: ['mom-self-restrictions', momId, teen.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('mom_self_restrictions')
        .select('*')
        .eq('family_id', familyId)
        .eq('primary_parent_id', momId)
        .eq('target_member_id', teen.id)
      return data ?? []
    },
  })

  async function toggleRestriction(featureKey: string) {
    const existing = restrictions?.find((r) => r.feature_key === featureKey)
    if (existing) {
      await supabase.from('mom_self_restrictions').delete().eq('id', existing.id)
    } else {
      await supabase.from('mom_self_restrictions').insert({
        family_id: familyId,
        primary_parent_id: momId,
        target_member_id: teen.id,
        feature_key: featureKey,
        restriction_type: 'full',
      })
    }
    queryClient.invalidateQueries({ queryKey: ['mom-self-restrictions', momId, teen.id] })
  }

  const isRestricted = (featureKey: string) =>
    restrictions?.some((r) => r.feature_key === featureKey) ?? false

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-left">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: teen.member_color || 'var(--color-deep-ocean)' }}
        >
          {teen.display_name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{teen.display_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {restrictions?.length ? `${restrictions.length} feature${restrictions.length !== 1 ? 's' : ''} restricted` : 'Full visibility'}
          </p>
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Toggle features off to restrict YOUR visibility into {teen.display_name}'s data.
            {teen.display_name} will be notified when you increase your visibility (turn a feature back on).
          </p>
          {RESTRICTABLE_FEATURES.map(({ key, label }) => {
            const restricted = isRestricted(key)
            return (
              <button
                key={key}
                onClick={() => toggleRestriction(key)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: restricted ? 'var(--color-bg-primary)' : 'color-mix(in srgb, var(--color-sage-teal) 6%, transparent)',
                  border: `1px solid ${restricted ? 'var(--color-border)' : 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)'}`,
                }}
              >
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                <div className="flex items-center gap-1.5">
                  {restricted ? (
                    <>
                      <EyeOff size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Restricted</span>
                    </>
                  ) : (
                    <>
                      <Eye size={14} style={{ color: 'var(--color-sage-teal)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-sage-teal)' }}>Visible</span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Issue 12: Shift Log Section ──────────────────────────────────────────────

function ShiftLogSection({ familyId }: { familyId: string }) {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shift-log', familyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shift_sessions')
        .select('*, caregiver:special_adult_id(display_name, member_color)')
        .eq('family_id', familyId)
        .order('started_at', { ascending: false })
        .limit(50)
      return data ?? []
    },
  })

  if (isLoading) {
    return <p className="text-sm py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading shift history...</p>
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div
        className="p-8 rounded-xl text-center"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
      >
        <ClipboardList size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>No shifts recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {shifts.map((shift: {
        id: string
        started_at: string
        ended_at: string | null
        started_by: string
        ended_by: string | null
        summary_text: string | null
        is_co_parent_session: boolean
        caregiver: { display_name: string; member_color: string | null } | null
      }) => {
        const startDate = new Date(shift.started_at)
        const endDate = shift.ended_at ? new Date(shift.ended_at) : null
        const isActive = !shift.ended_at
        const durationMs = endDate ? endDate.getTime() - startDate.getTime() : Date.now() - startDate.getTime()
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
        const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

        return (
          <div
            key={shift.id}
            className="p-3 rounded-lg"
            style={{
              backgroundColor: isActive ? 'color-mix(in srgb, var(--color-sage-teal) 6%, transparent)' : 'var(--color-bg-card)',
              border: `1px solid ${isActive ? 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)' : 'var(--color-border)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: shift.caregiver?.member_color || 'var(--color-golden-honey)' }}
                >
                  {shift.caregiver?.display_name?.charAt(0) ?? '?'}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                  {shift.caregiver?.display_name ?? 'Unknown'}
                </span>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-sage-teal) 20%, transparent)', color: 'var(--color-sage-teal)' }}>
                    Active
                  </span>
                )}
                {shift.is_co_parent_session && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' }}>
                    Co-Parent
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {durationHours > 0 ? `${durationHours}h ` : ''}{durationMins}m
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              {endDate && ` — ${endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
              {shift.ended_by && ` (ended by ${shift.ended_by})`}
            </div>
            {shift.summary_text && (
              <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                {shift.summary_text}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Profile Selector Modal (Issues 13, 14) ──────────────────────────────────

const PROFILE_OPTIONS = [
  {
    level: 'light',
    label: 'Light',
    icon: Zap,
    description: 'View family logistics. Limited interaction.',
    detail: 'Good for: getting started, building trust',
    color: 'var(--color-info, #68a395)',
  },
  {
    level: 'balanced',
    label: 'Balanced',
    icon: Layers,
    description: 'Most family tools + personal features.',
    detail: 'Good for: active co-parents',
    color: 'var(--color-golden-honey, #d6a461)',
    suggested: true,
  },
  {
    level: 'maximum',
    label: 'Maximum',
    icon: Crown,
    description: 'Everything your plan allows.',
    detail: 'Good for: fully equal partners',
    color: 'var(--color-success, #4b7c66)',
  },
] as const

const SUGGESTED_DEFAULTS: Record<string, string> = {
  dad_adults: 'balanced',
  special_adults: 'light',
  independent_teens: 'balanced',
  guided_kids: 'light',
  play_kids: 'light',
}

function ProfileSelectorModal({
  memberName,
  roleGroup,
  familyId,
  memberId,
  momId: _momId,
  hasExistingPermissions,
  onClose,
  onApplied,
}: {
  memberName: string
  roleGroup: string
  familyId: string
  memberId: string
  momId: string
  hasExistingPermissions: boolean
  onClose: () => void
  onApplied: () => void
}) {
  const suggestedLevel = SUGGESTED_DEFAULTS[roleGroup] ?? 'balanced'
  const [selected, setSelected] = useState(suggestedLevel)
  const [applying, setApplying] = useState(false)
  // Issue 14: Confirmation when changing existing permissions
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleApply() {
    // Issue 14: If there are existing permissions, require confirmation
    if (hasExistingPermissions && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setApplying(true)
    await supabase.rpc('apply_permission_profile', {
      p_family_id: familyId,
      p_member_id: memberId,
      p_role_group: roleGroup,
      p_level: selected,
    })
    setApplying(false)
    onApplied()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 p-6 rounded-2xl space-y-5"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
            Set Access Level for {memberName}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            How much access should {memberName} have?
          </p>
        </div>

        <div className="space-y-2">
          {PROFILE_OPTIONS.map((option) => {
            const isSuggested = option.level === suggestedLevel
            const isSelected = option.level === selected
            const Icon = option.icon

            return (
              <button
                key={option.level}
                onClick={() => { setSelected(option.level); setShowConfirm(false) }}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: isSelected ? option.color + '12' : 'var(--color-bg-primary)',
                  border: `2px solid ${isSelected ? option.color : 'var(--color-border)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: option.color + '20' }}
                  >
                    <Icon size={16} style={{ color: option.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
                        {option.label}
                      </span>
                      {isSuggested && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: option.color + '20', color: option.color }}
                        >
                          Suggested
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                      {option.description}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {option.detail}
                    </p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: isSelected ? option.color : 'var(--color-border)' }}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Issue 14: Confirmation warning when changing existing permissions */}
        {showConfirm && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-golden-honey) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-golden-honey) 30%, transparent)',
              color: 'var(--color-text-primary)',
            }}
          >
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-golden-honey)' }} />
            <div>
              <p className="font-medium">This will reset all of {memberName}'s permissions</p>
              <p className="mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Current per-child settings will be replaced with the {selected} profile defaults. You can adjust individual features after.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: showConfirm ? 'var(--color-golden-honey, #d6a461)' : 'var(--color-sage-teal, #68a395)' }}
          >
            {applying ? 'Applying...' : showConfirm ? 'Yes, Reset & Apply' : 'Apply'}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            You can adjust individual features after applying.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
