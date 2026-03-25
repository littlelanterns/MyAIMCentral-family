/**
 * ArchivesPage — PRD-13
 * Main Archives landing page (Screen 1).
 * Shows family overview card, per-member archive cards with
 * person-level heart toggles, Out of Nest section, and
 * Privacy Filtered summary.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart,
  HeartOff,
  Lock,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Archive,
  Users,
  Fingerprint,
  Clock,
  Compass,
  BookHeart,
} from 'lucide-react'
import { FeatureGuide, Card, Badge, Avatar, RoleBadge, LoadingSpinner, EmptyState } from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Hooks — archive data queries
// ---------------------------------------------------------------------------

interface ArchiveOverview {
  totalItems: number
  familyPersonality: number
  rhythmsRoutines: number
  currentFocus: number
  faithValues: number
}

function useFamilyOverview(familyId: string | undefined) {
  return useQuery({
    queryKey: ['archive-family-overview', familyId],
    queryFn: async (): Promise<ArchiveOverview> => {
      if (!familyId) return { totalItems: 0, familyPersonality: 0, rhythmsRoutines: 0, currentFocus: 0, faithValues: 0 }

      // Get family folders first
      const { data: folders } = await supabase
        .from('archive_folders')
        .select('id')
        .eq('family_id', familyId)
        .is('member_id', null)

      const folderIds = folders?.map(f => f.id) ?? []

      // Count archive context items in family-level folders
      let totalItems = 0
      if (folderIds.length > 0) {
        const { count } = await supabase
          .from('archive_context_items')
          .select('id', { count: 'exact', head: true })
          .eq('is_included_in_ai', true)
          .in('folder_id', folderIds)
          .is('archived_at', null)
        totalItems = count ?? 0
      }

      // Check faith preferences
      const { data: faithData } = await supabase
        .from('faith_preferences')
        .select('id')
        .eq('family_id', familyId)
        .maybeSingle()

      return {
        totalItems,
        familyPersonality: 0,
        rhythmsRoutines: 0,
        currentFocus: 0,
        faithValues: faithData ? 1 : 0,
      }
    },
    enabled: !!familyId,
  })
}

interface MemberArchiveStats {
  memberId: string
  totalInsights: number
  includedInsights: number
  folderCounts: Record<string, number>
}

function useArchiveMemberStats(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['archive-member-stats', familyId, memberIds],
    queryFn: async (): Promise<MemberArchiveStats[]> => {
      if (!familyId || memberIds.length === 0) return []

      const stats: MemberArchiveStats[] = []

      for (const memberId of memberIds) {
        // Count self_knowledge entries
        const { count: totalSK } = await supabase
          .from('self_knowledge')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('member_id', memberId)
          .is('archived_at', null)

        const { count: includedSK } = await supabase
          .from('self_knowledge')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('member_id', memberId)
          .eq('is_included_in_ai', true)
          .is('archived_at', null)

        // Count guiding stars
        const { count: totalGS } = await supabase
          .from('guiding_stars')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('member_id', memberId)
          .is('archived_at', null)

        // Count archive folders
        const { data: folders } = await supabase
          .from('archive_folders')
          .select('id, folder_type')
          .eq('family_id', familyId)
          .eq('member_id', memberId)

        const folderCounts: Record<string, number> = {}
        if (folders) {
          for (const f of folders) {
            const type = f.folder_type || 'general'
            folderCounts[type] = (folderCounts[type] || 0) + 1
          }
        }

        const total = (totalSK ?? 0) + (totalGS ?? 0)
        const included = (includedSK ?? 0) + (totalGS ?? 0)

        stats.push({
          memberId,
          totalInsights: total,
          includedInsights: included,
          folderCounts,
        })
      }

      return stats
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

function useOutOfNestMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ['out-of-nest-members', familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('out_of_nest_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId,
  })
}

function usePrivacyFilteredCount(familyId: string | undefined) {
  return useQuery({
    queryKey: ['privacy-filtered-count', familyId],
    queryFn: async () => {
      if (!familyId) return 0

      // Count archive_context_items with is_privacy_filtered = true
      const { count } = await supabase
        .from('archive_context_items')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('is_privacy_filtered', true)
        .is('archived_at', null)

      return count ?? 0
    },
    enabled: !!familyId,
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Family Overview preview card */
function FamilyOverviewCard({
  familyName,
  overview,
  onClick,
}: {
  familyName: string
  overview: ArchiveOverview
  onClick: () => void
}) {
  const sections = [
    { label: 'Family Personality', count: overview.familyPersonality, icon: Users },
    { label: 'Rhythms & Routines', count: overview.rhythmsRoutines, icon: Clock },
    { label: 'Current Focus', count: overview.currentFocus, icon: Compass },
    { label: 'Faith & Values', count: overview.faithValues, icon: BookHeart },
  ]

  return (
    <Card variant="interactive" padding="lg" onClick={onClick}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              {familyName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Family context: {overview.totalItems} items active
            </p>
          </div>
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' }}
          >
            <Users size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.label}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <Icon size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {section.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {section.count} items
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/** Member archive card */
function MemberArchiveCard({
  member,
  stats,
  onNavigate,
  onToggleAI,
}: {
  member: FamilyMember
  stats: MemberArchiveStats | undefined
  onNavigate: () => void
  onToggleAI: () => void
}) {
  const totalInsights = stats?.totalInsights ?? 0
  const includedInsights = stats?.includedInsights ?? 0
  const folderTypes = stats?.folderCounts ?? {}
  const folderPreview = Object.entries(folderTypes).slice(0, 3)

  // Person-level AI inclusion — for now derived from whether they have included items
  const isIncluded = includedInsights > 0

  return (
    <Card variant="interactive" padding="md" onClick={onNavigate}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          name={member.display_name}
          src={member.avatar_url}
          color={member.assigned_color || member.member_color || undefined}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {member.display_name}
            </h3>
            <RoleBadge role={member.role} size="sm" />
          </div>

          <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            {totalInsights > 0
              ? `Gleaning context from ${includedInsights} of ${totalInsights} insights`
              : 'No context items yet'}
          </p>

          {/* Folder category previews */}
          {folderPreview.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {folderPreview.map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {type} ({count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Heart toggle — stop propagation so card click does not fire */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleAI()
          }}
          className="p-1.5 rounded transition-colors flex-shrink-0"
          title={
            isIncluded
              ? 'Included in AI context — click to exclude'
              : 'Excluded from AI context — click to include'
          }
          style={{
            color: isIncluded
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-text-secondary)',
          }}
        >
          {isIncluded ? (
            <Heart size={18} fill="currentColor" />
          ) : (
            <HeartOff size={18} />
          )}
        </button>
      </div>
    </Card>
  )
}

/** Out of Nest member card (simpler) */
function OutOfNestCard({
  member,
  onClick,
}: {
  member: { id: string; name: string; relationship: string; avatar_url?: string | null }
  onClick: () => void
}) {
  return (
    <Card variant="interactive" padding="md" onClick={onClick}>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} src={member.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
            {member.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {member.relationship}
          </p>
        </div>
        <Badge variant="default" size="sm">Out of Nest</Badge>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function ArchivesPage() {
  const navigate = useNavigate()
  const { data: member, isLoading: memberLoading } = useFamilyMember()
  const { data: family, isLoading: familyLoading } = useFamily()
  const familyId = family?.id

  const { data: allMembers = [], isLoading: membersLoading } = useFamilyMembers(familyId)
  const { data: oonMembers = [] } = useOutOfNestMembers(familyId)
  const { data: privacyCount = 0 } = usePrivacyFilteredCount(familyId)

  // Filter in-household members (not out_of_nest)
  const householdMembers = useMemo(
    () => allMembers.filter((m) => m.is_active && m.in_household !== false && !m.out_of_nest),
    [allMembers],
  )

  const memberIds = useMemo(() => householdMembers.map((m) => m.id), [householdMembers])

  const { data: overview } = useFamilyOverview(familyId)
  const { data: memberStats = [] } = useArchiveMemberStats(familyId, memberIds)

  // OON section collapse
  const [oonExpanded, setOonExpanded] = useState(false)

  const isLoading = memberLoading || familyLoading || membersLoading

  // Stat lookup helper
  function getStats(memberId: string) {
    return memberStats.find((s) => s.memberId === memberId)
  }

  // Person-level AI toggle — STUB: full implementation needs a per-member toggle on archive_member_settings
  function handleToggleMemberAI(_memberId: string) {
    // STUB: Toggle is_included_in_ai at person level — wires to PRD-13
    // Will update archive_member_settings or a dedicated toggle column
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <PermissionGate featureKey="archives_browse">
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        {/* FeatureGuide */}
        <FeatureGuide featureKey="archives" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Archives
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Everything LiLa knows about your family.
            </p>
          </div>

          <button
            onClick={() => navigate('/archives/export')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-btn-primary-bg)',
              border: '1px solid var(--color-border)',
            }}
            title="Export Context"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Family Overview Card */}
        {family && overview && (
          <FamilyOverviewCard
            familyName={family.family_name}
            overview={overview}
            onClick={() => navigate('/archives/family-overview')}
          />
        )}

        {/* Member Archive Cards */}
        <div>
          <h2
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Family Members
          </h2>

          {householdMembers.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No family members yet"
              description="Add family members to start building their context archive."
            />
          ) : (
            <div className="space-y-3">
              {householdMembers.map((m) => (
                <MemberArchiveCard
                  key={m.id}
                  member={m}
                  stats={getStats(m.id)}
                  onNavigate={() => navigate(`/archives/member/${m.id}`)}
                  onToggleAI={() => handleToggleMemberAI(m.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Out of Nest Section */}
        {oonMembers.length > 0 && (
          <div>
            <button
              onClick={() => setOonExpanded((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium w-full"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {oonExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Out of Nest ({oonMembers.length})
            </button>

            {oonExpanded && (
              <div className="mt-3 space-y-2">
                {oonMembers.map((m) => (
                  <OutOfNestCard
                    key={m.id}
                    member={m}
                    onClick={() => navigate(`/archives/out-of-nest/${m.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Privacy Filtered Section */}
        <div
          className="p-4 rounded-xl cursor-pointer transition-colors"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/archives/privacy-filtered')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate('/archives/privacy-filtered')
            }
          }}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-bg-secondary) 80%, transparent)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}
            >
              <Lock size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Privacy Filtered
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {privacyCount} items — never included in AI context for other members
              </p>
            </div>
            <Badge variant="default" size="sm">{privacyCount}</Badge>
          </div>
        </div>

        {/* FAB — Add Context */}
        <button
          onClick={() => navigate('/archives/add')}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
          aria-label="Add context item"
        >
          <Plus size={24} />
        </button>
      </div>
    </PermissionGate>
  )
}
