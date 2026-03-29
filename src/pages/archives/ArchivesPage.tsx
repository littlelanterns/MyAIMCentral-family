/**
 * ArchivesPage — PRD-13 + PRD-13B
 * Main Archives landing page (Screen 1).
 * Grid view (default on desktop): Bublup-style square cards.
 * List view (default on mobile): Existing card layout.
 * Expanded FAB: Add for a Person, Voice Dump, Bulk Add & Sort.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Heart,
  HeartOff,
  Lock,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  Users,
  Clock,
  Compass,
  BookHeart,
  LayoutGrid,
  List,
  Mic,
  FileText,
  UserPlus,
  X,
} from 'lucide-react'
import {
  FeatureGuide,
  Card,
  Badge,
  Avatar,
  RoleBadge,
  LoadingSpinner,
  EmptyState,
  Tooltip,
} from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import { useToggleMemberPersonLevel } from '@/hooks/useArchives'
import { supabase } from '@/lib/supabase/client'
import { getOptimalColumnCount } from '@/lib/utils/gridColumns'
import { ArchiveMemberCard } from '@/components/archives/ArchiveMemberCard'
import { VoiceDumpModal } from '@/components/archives/VoiceDumpModal'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import { BulkAddSortModal } from '@/components/archives/BulkAddSortModal'
import { CropPreviewModal } from '@/components/archives/CropPreviewModal'

// ---------------------------------------------------------------------------
// Hooks — archive data queries (kept from original)
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

      const { data: folders } = await supabase
        .from('archive_folders')
        .select('id')
        .eq('family_id', familyId)
        .is('member_id', null)

      const folderIds = folders?.map(f => f.id) ?? []

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
  isIncludedInAI: boolean
}

function useArchiveMemberStats(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['archive-member-stats', familyId, memberIds],
    queryFn: async (): Promise<MemberArchiveStats[]> => {
      if (!familyId || memberIds.length === 0) return []

      // Fetch member settings for person-level AI toggle
      const { data: settings } = await supabase
        .from('archive_member_settings')
        .select('member_id, is_included_in_ai')
        .eq('family_id', familyId)

      const settingsMap = new Map(
        (settings ?? []).map((s: { member_id: string; is_included_in_ai: boolean }) => [s.member_id, s.is_included_in_ai]),
      )

      const stats: MemberArchiveStats[] = []

      for (const memberId of memberIds) {
        const [skTotal, skIncluded, gsTotal, aciTotal, aciIncluded] = await Promise.all([
          supabase
            .from('self_knowledge')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .is('archived_at', null),
          supabase
            .from('self_knowledge')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .eq('is_included_in_ai', true)
            .is('archived_at', null),
          supabase
            .from('guiding_stars')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .is('archived_at', null),
          supabase
            .from('archive_context_items')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .is('archived_at', null),
          supabase
            .from('archive_context_items')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .eq('is_included_in_ai', true)
            .is('archived_at', null),
        ])

        const total = (skTotal.count ?? 0) + (gsTotal.count ?? 0) + (aciTotal.count ?? 0)
        const included = (skIncluded.count ?? 0) + (gsTotal.count ?? 0) + (aciIncluded.count ?? 0)

        stats.push({
          memberId,
          totalInsights: total,
          includedInsights: included,
          isIncludedInAI: settingsMap.get(memberId) ?? true,
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
// View mode hook
// ---------------------------------------------------------------------------

type ViewMode = 'grid' | 'list'
const STORAGE_KEY = 'archives-view-mode'

function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'grid'
    } catch {
      return 'grid'
    }
  })

  const set = useCallback((newMode: ViewMode) => {
    setMode(newMode)
    try {
      localStorage.setItem(STORAGE_KEY, newMode)
    } catch { /* noop */ }
  }, [])

  return [mode, set]
}

// ---------------------------------------------------------------------------
// Responsive column count
// ---------------------------------------------------------------------------

function useResponsiveColumns(totalCards: number) {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxCols = width >= 1024 ? 5 : width >= 768 ? 3 : 2
  const isMobile = width < 768

  return {
    columns: getOptimalColumnCount(totalCards, maxCols),
    isMobile,
  }
}

// ---------------------------------------------------------------------------
// List view sub-components (from original ArchivesPage)
// ---------------------------------------------------------------------------

function MemberArchiveListCard({
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
  const isIncluded = stats?.isIncludedInAI ?? true

  return (
    <Card variant="interactive" padding="md" onClick={onNavigate}>
      <div className="flex items-start gap-3">
        <Avatar
          name={member.display_name}
          src={member.avatar_url}
          color={member.assigned_color || member.member_color || undefined}
          size="md"
        />
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
        </div>
        <Tooltip content={isIncluded ? 'Included in AI context — click to exclude' : 'Excluded from AI context — click to include'}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAI() }}
          className="p-1.5 rounded transition-colors flex-shrink-0"
          style={{ color: isIncluded ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
        >
          {isIncluded ? <Heart size={18} fill="currentColor" /> : <HeartOff size={18} />}
        </button>
        </Tooltip>
      </div>
    </Card>
  )
}

function FamilyOverviewListCard({
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
  const { data: currentMember, isLoading: memberLoading } = useFamilyMember()
  const { data: family, isLoading: familyLoading } = useFamily()
  const familyId = family?.id

  const { data: allMembers = [], isLoading: membersLoading } = useFamilyMembers(familyId)
  const { data: oonMembers = [] } = useOutOfNestMembers(familyId)
  const { data: privacyCount = 0 } = usePrivacyFilteredCount(familyId)
  const { data: overview } = useFamilyOverview(familyId)

  const householdMembers = useMemo(
    () => allMembers.filter((m) => m.is_active && m.in_household !== false && !m.out_of_nest),
    [allMembers],
  )
  const memberIds = useMemo(() => householdMembers.map((m) => m.id), [householdMembers])
  const { data: memberStats = [] } = useArchiveMemberStats(familyId, memberIds)

  // View mode
  const [viewMode, setViewMode] = useViewMode()

  // Responsive columns
  const totalGridCards = householdMembers.length
  const { columns, isMobile } = useResponsiveColumns(totalGridCards)
  const oonColumns = useResponsiveColumns(oonMembers.length)

  // Avatar upload + crop state
  const avatarUpload = useAvatarUpload(familyId)
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null)
  const [uploadingFamily, setUploadingFamily] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropTargetMemberId, setCropTargetMemberId] = useState<string | null>(null) // null = family photo
  const [cropMemberName, setCropMemberName] = useState('')

  // Person-level AI toggle
  const togglePersonLevel = useToggleMemberPersonLevel()

  // OON section collapse
  const [oonExpanded, setOonExpanded] = useState(false)

  // FAB state
  const [fabExpanded, setFabExpanded] = useState(false)
  const [voiceDumpOpen, setVoiceDumpOpen] = useState(false)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [bulkAddInitialText, setBulkAddInitialText] = useState('')

  const isLoading = memberLoading || familyLoading || membersLoading

  function getStats(memberId: string) {
    return memberStats.find((s) => s.memberId === memberId)
  }

  function handleToggleMemberAI(memberId: string) {
    if (!familyId) return
    const stats = getStats(memberId)
    const current = stats?.isIncludedInAI ?? true
    togglePersonLevel.mutate({ familyId, memberId, included: !current })
  }

  // File select → open crop modal (not direct upload)
  function handleMemberFileSelect(memberId: string, memberName: string, file: File) {
    setCropTargetMemberId(memberId)
    setCropMemberName(memberName)
    setCropFile(file)
    setCropModalOpen(true)
  }

  // Called when crop is confirmed
  async function handleCropConfirm(croppedBlob: Blob) {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })

    if (cropTargetMemberId) {
      setUploadingMemberId(cropTargetMemberId)
      await avatarUpload.uploadMemberAvatar(cropTargetMemberId, file)
      setUploadingMemberId(null)
    } else {
      setUploadingFamily(true)
      await avatarUpload.uploadFamilyPhoto(file)
      setUploadingFamily(false)
    }

    setCropModalOpen(false)
    setCropFile(null)
  }

  function handleVoiceTranscript(text: string) {
    setBulkAddInitialText(text)
    setBulkAddOpen(true)
  }

  // View mode — grid everywhere by default, toggle always available
  const effectiveView = viewMode

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

          <div className="flex items-center gap-2">
            {/* Grid/List toggle — hidden on mobile */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <Tooltip content="Grid view">
                <button
                  onClick={() => setViewMode('grid')}
                  className="p-2 transition-colors"
                  style={{
                    backgroundColor: effectiveView === 'grid' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)' : 'transparent',
                    color: effectiveView === 'grid' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  }}
                >
                  <LayoutGrid size={16} />
                </button>
                </Tooltip>
                <Tooltip content="List view">
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 transition-colors"
                  style={{
                    backgroundColor: effectiveView === 'list' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)' : 'transparent',
                    color: effectiveView === 'list' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  }}
                >
                  <List size={16} />
                </button>
                </Tooltip>
              </div>

            <Tooltip content="Export Context">
            <button
              onClick={() => navigate('/archives/export')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
            </Tooltip>
          </div>
        </div>

        {/* ============================================================= */}
        {/* GRID VIEW */}
        {/* ============================================================= */}
        {effectiveView === 'grid' && (
          <>
            {/* Member grid */}
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: isMobile ? '8px' : '12px',
                  }}
                >
                  {/* Family Overview — hidden until content is crafted */}

                  {/* Member cards */}
                  {householdMembers.map((m) => {
                    const stats = getStats(m.id)
                    return (
                      <ArchiveMemberCard
                        key={m.id}
                        name={m.display_name}
                        avatarUrl={m.avatar_url}
                        memberColor={m.assigned_color || m.member_color || undefined}
                        role={m.role as 'primary_parent' | 'additional_adult' | 'special_adult' | 'member'}
                        includedInsights={stats?.includedInsights ?? 0}
                        totalInsights={stats?.totalInsights ?? 0}
                        isIncludedInAI={stats?.isIncludedInAI ?? true}
                        onNavigate={() => navigate(`/archives/member/${m.id}`)}
                        onToggleAI={() => handleToggleMemberAI(m.id)}
                        onFileSelect={(file) => handleMemberFileSelect(m.id, m.display_name, file)}
                        uploading={uploadingMemberId === m.id}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {/* Out of Nest grid */}
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
                  <div
                    className="mt-3"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${oonColumns.columns}, 1fr)`,
                      gap: isMobile ? '8px' : '12px',
                    }}
                  >
                    {oonMembers.map((m) => (
                      <ArchiveMemberCard
                        key={m.id}
                        name={m.name}
                        avatarUrl={m.avatar_url}
                        memberColor={undefined}
                        includedInsights={0}
                        totalInsights={0}
                        isIncludedInAI={false}
                        isFamilyOverview={false}
                        insightLabel={m.relationship}
                        onNavigate={() => navigate(`/archives/out-of-nest/${m.id}`)}
                        onToggleAI={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ============================================================= */}
        {/* LIST VIEW */}
        {/* ============================================================= */}
        {effectiveView === 'list' && (
          <>
            {/* Family Overview Card */}
            {family && overview && (
              <FamilyOverviewListCard
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
                    <MemberArchiveListCard
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
          </>
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

        {/* ============================================================= */}
        {/* EXPANDED FAB */}
        {/* ============================================================= */}

        {/* Backdrop when FAB expanded */}
        {fabExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setFabExpanded(false)}
          />
        )}

        {/* FAB options (shown when expanded) */}
        {fabExpanded && (
          <div className="fixed bottom-36 right-4 md:bottom-22 md:right-6 z-50 flex flex-col items-end gap-2.5">
            {/* Option A: Add for a Person */}
            <button
              onClick={() => {
                setFabExpanded(false)
                navigate('/archives/add')
              }}
              className="flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span>Add for a Person</span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <UserPlus size={18} />
              </div>
            </button>

            {/* Option B: Voice Dump — hidden behind feature flag */}
            {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (
            <button
              onClick={() => {
                setFabExpanded(false)
                setVoiceDumpOpen(true)
              }}
              className="flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span>Voice Dump</span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <Mic size={18} />
              </div>
            </button>
            )}

            {/* Option C: Bulk Add & Sort */}
            <button
              onClick={() => {
                setFabExpanded(false)
                setBulkAddInitialText('')
                setBulkAddOpen(true)
              }}
              className="flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-card, #ffffff)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span>Bulk Add & Sort</span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <FileText size={18} />
              </div>
            </button>
          </div>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
          aria-label={fabExpanded ? 'Close menu' : 'Add context'}
        >
          {fabExpanded ? <X size={24} /> : <Plus size={24} />}
        </button>

        {/* Voice Dump Modal */}
        <VoiceDumpModal
          open={voiceDumpOpen}
          onClose={() => setVoiceDumpOpen(false)}
          onTranscriptReady={handleVoiceTranscript}
        />

        {/* Bulk Add & Sort Modal */}
        {familyId && currentMember && (
          <BulkAddSortModal
            open={bulkAddOpen}
            onClose={() => { setBulkAddOpen(false); setBulkAddInitialText('') }}
            familyId={familyId}
            momMemberId={currentMember.id}
            familyMembers={householdMembers.map((m) => ({
              id: m.id,
              display_name: m.display_name,
              role: m.role,
            }))}
            initialText={bulkAddInitialText}
          />
        )}

        {/* Crop Preview Modal */}
        <CropPreviewModal
          open={cropModalOpen}
          onClose={() => { setCropModalOpen(false); setCropFile(null) }}
          imageFile={cropFile}
          onCropConfirm={handleCropConfirm}
          memberName={cropMemberName}
          uploading={!!uploadingMemberId || uploadingFamily}
        />
      </div>
    </PermissionGate>
  )
}
