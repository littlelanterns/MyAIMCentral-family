import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, ChevronDown, ChevronRight, Eye, EyeOff, Users, UserCog, Zap, Layers, Crown } from 'lucide-react'
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

// Feature categories for the permission grid
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

export function PermissionHub() {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { data: allMembers } = useFamilyMembers(member?.family_id)

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
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-sm"
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
    </div>
  )
}

/**
 * PRD-02 Screen 2: Additional Adult permission detail
 * Per-kid expandable cards with per-feature access level controls
 */
function AdultPermissionCard({
  adult,
  children,
  familyId,
  momId: _momId,
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

  // Check if member has any toggles (to determine if profile selector should auto-show)
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
        <div className="flex-1">
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{adult.display_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {children.length} child{children.length !== 1 ? 'ren' : ''} to configure
            {existingToggles === 0 && ' — needs access level setup'}
          </p>
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Profile selector button */}
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

          {children.length === 0 ? (
            <p className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
              No children to configure. Add family members first.
            </p>
          ) : (
            children.map((kid) => (
              <KidPermissionBlock
                key={kid.id}
                adult={adult}
                kid={kid}
                familyId={familyId}
                expanded={expandedKid === kid.id}
                onToggle={() => setExpandedKid(expandedKid === kid.id ? null : kid.id)}
              />
            ))
          )}
        </div>
      )}

      {showProfileSelector && (
        <ProfileSelectorModal
          memberName={adult.display_name}
          roleGroup={roleGroup}
          familyId={familyId}
          memberId={adult.id}
          onClose={() => setShowProfileSelector(false)}
          onApplied={() => {
            setShowProfileSelector(false)
            queryClient.invalidateQueries({ queryKey: ['member-toggles-count', adult.id] })
            queryClient.invalidateQueries({ queryKey: ['can-access'] })
            queryClient.invalidateQueries({ queryKey: ['permission'] })
          }}
        />
      )}
    </div>
  )
}

/**
 * Per-kid permission grid for an additional adult
 */
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

  // Load current permissions for this adult + kid
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

  async function setPermission(featureKey: string, level: string) {
    // Upsert: find existing or create new
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
          granting_member_id: adult.id, // legacy column
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

  return (
    <div
      className="rounded-lg overflow-hidden mt-2"
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
                {category.keys.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                    <AccessLevelPicker
                      value={getLevel(key)}
                      onChange={(level) => setPermission(key, level)}
                      maxLevel="manage"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Compact access level selector
 */
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

/**
 * PRD-02 Screen 3: Special Adult permission card
 * Shows assigned kids + feature access (max: contribute, never manage)
 */
function SpecialAdultCard({
  specialAdult,
  familyId,
}: {
  specialAdult: FamilyMember
  familyId: string
}) {
  const [expanded, setExpanded] = useState(false)

  // Load assignments
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
        <div className="flex-1">
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {specialAdult.display_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {specialAdult.custom_role || 'Special Adult'} | {assignments?.length ?? 0} assigned child{(assignments?.length ?? 0) !== 1 ? 'ren' : ''}
          </p>
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Special adults can only access features during an active shift. Maximum access level: Contribute (never Manage).
          </p>

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

/**
 * PRD-02 Screen 4 (mom's view): Self-restriction controls for teen privacy
 * Mom can restrict her OWN visibility into a teen's features
 */
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
      // Remove restriction — mom CAN see this feature for this teen
      await supabase.from('mom_self_restrictions').delete().eq('id', existing.id)
    } else {
      // Add restriction — mom CANNOT see this feature for this teen
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
                  backgroundColor: restricted ? 'var(--color-bg-primary)' : 'var(--color-sage-teal)10',
                  border: `1px solid ${restricted ? 'var(--color-border)' : 'var(--color-sage-teal)30'}`,
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

/**
 * PRD-31 Permission Matrix Addendum: Profile Selector Modal
 * Light / Balanced / Maximum access level selection
 */

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
  onClose,
  onApplied,
}: {
  memberName: string
  roleGroup: string
  familyId: string
  memberId: string
  onClose: () => void
  onApplied: () => void
}) {
  const suggestedLevel = SUGGESTED_DEFAULTS[roleGroup] ?? 'balanced'
  const [selected, setSelected] = useState(suggestedLevel)
  const [applying, setApplying] = useState(false)
  const [, setConfirmReset] = useState(false) // confirmReset value unused; setter wired to UI

  async function handleApply() {
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
                onClick={() => { setSelected(option.level); setConfirmReset(false) }}
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

        <div className="space-y-2">
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
          >
            {applying ? 'Applying...' : 'Apply'}
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
