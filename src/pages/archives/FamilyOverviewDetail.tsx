/**
 * FamilyOverviewDetail — PRD-13
 * Screen 3: Family Overview Card Detail page.
 * Shows family-level context organized into 4 expandable sections,
 * family guiding stars, and stubs for family vision + meeting notes.
 * Accessed via /archives/family-overview.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  HeartOff,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Compass,
  BookHeart,
  Sparkles,
  Check,
  X,
  Star,
  MessageSquare,
  Eye,
  Settings,
  TreePine,
} from 'lucide-react'
import {
  Card,
  Badge,
  LoadingSpinner,
  EmptyState,
  FeatureGuide,
  Tooltip,
} from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useFamilyOverview,
  useFaithPreferences,
  useCreateArchiveContextItem,
  useUpdateArchiveContextItem,
  useArchiveContextItem,
  useToggleArchiveItemAI,
  useToggleAggregatedAI,
  useUpdateArchiveFolder,
} from '@/hooks/useArchives'
import type { ArchiveContextItem, FamilyOverviewSection } from '@/types/archives'
import { FaithPreferencesModal } from './FaithPreferencesModal'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_META: Record<string, { icon: typeof Users; description: string }> = {
  'Family Personality': {
    icon: Users,
    description: 'Values, communication style, conflict approach, decision-making, financial philosophy',
  },
  'Rhythms & Routines': {
    icon: Clock,
    description: 'Morning rhythms, bedtime, weekends, traditions, seasonal patterns',
  },
  'Current Focus': {
    icon: Compass,
    description: 'Season of life, recent changes, current challenges, recent wins',
  },
  'Faith & Values': {
    icon: BookHeart,
    description: 'Faith preferences, spiritual practices, values context',
  },
  'Out of Nest': {
    icon: TreePine,
    description: 'Adult children, their spouses, grandchildren, and extended family context',
  },
}

// ---------------------------------------------------------------------------
// Source badge labels
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Record<string, string> = {
  lila_detected: 'LiLa detected',
  review_route: 'Review & Route',
  list_shared: 'Shared list',
  manual: '',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single context item row */
function ContextItemRow({
  item,
  onToggleAI,
  onArchive,
  onUpdateContent,
}: {
  item: ArchiveContextItem
  onToggleAI: (included: boolean) => void
  onArchive: () => void
  onUpdateContent: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.context_value)

  const handleSave = () => {
    if (editValue.trim() && editValue !== item.context_value) {
      onUpdateContent(editValue.trim())
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditValue(item.context_value)
    setEditing(false)
  }

  const sourceLabel = SOURCE_LABELS[item.source] || ''

  return (
    <div
      className="flex items-start gap-2 py-2 px-1 group"
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}
    >
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              autoFocus
              className="flex-1 text-sm rounded px-2 py-1 outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <button onClick={handleSave} className="p-1 rounded" style={{ color: 'var(--color-success)' }}>
              <Check size={14} />
            </button>
            <button onClick={handleCancel} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <Tooltip content="Click to edit">
          <button
            onClick={() => setEditing(true)}
            className="text-left text-sm w-full hover:underline"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.context_field && (
              <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                {item.context_field}:{' '}
              </span>
            )}
            {item.context_value}
          </button>
          </Tooltip>
        )}

        {sourceLabel && (
          <span
            className="inline-flex items-center gap-1 text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Sparkles size={8} />
            {sourceLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        <Tooltip content={item.is_included_in_ai ? 'Included in LiLa context' : 'Excluded from LiLa context'}>
        <button
          onClick={() => onToggleAI(!item.is_included_in_ai)}
          className="p-1.5 rounded transition-colors"
          style={{
            color: item.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
          }}
        >
          {item.is_included_in_ai ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
        </button>
        </Tooltip>

        <Tooltip content="Archive this item">
        <button
          onClick={onArchive}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Trash2 size={14} />
        </button>
        </Tooltip>
      </div>
    </div>
  )
}

/** Expandable section for a family overview folder */
function OverviewSection({
  section,
  familyId,
  isFaithSection,
  onOpenFaithPreferences,
}: {
  section: FamilyOverviewSection
  familyId: string
  isFaithSection: boolean
  onOpenFaithPreferences: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const toggleItemAI = useToggleArchiveItemAI()
  const archiveItem = useArchiveContextItem()
  const updateItem = useUpdateArchiveContextItem()
  const createItem = useCreateArchiveContextItem()
  const updateFolder = useUpdateArchiveFolder()
  const [addingItem, setAddingItem] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')

  const faithPrefs = useFaithPreferences(isFaithSection ? familyId : undefined)

  const meta = SECTION_META[section.folder.folder_name] ?? {
    icon: Users,
    description: '',
  }
  const Icon = meta.icon

  const activeCount = section.items.filter((i) => i.is_included_in_ai).length
  const totalCount = section.items.length

  const handleToggleFolderAI = () => {
    updateFolder.mutate({
      id: section.folder.id,
      familyId,
      is_included_in_ai: !section.folder.is_included_in_ai,
    })
  }

  const handleAddItem = () => {
    if (!newItemValue.trim()) return
    createItem.mutate({
      family_id: familyId,
      folder_id: section.folder.id,
      context_value: newItemValue.trim(),
    })
    setNewItemValue('')
    setAddingItem(false)
  }

  // Faith summary line
  const faithSummary = useMemo(() => {
    if (!isFaithSection || !faithPrefs.data) return null
    const fp = faithPrefs.data
    const parts: string[] = []
    if (fp.faith_tradition) parts.push(fp.faith_tradition)
    if (fp.denomination) parts.push(fp.denomination)
    if (parts.length === 0) return null
    return parts.join(' — ')
  }, [isFaithSection, faithPrefs.data])

  return (
    <Card variant="flat" padding="none">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' }}
        >
          <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {section.folder.folder_name}
            </h3>
            {totalCount > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {activeCount}/{totalCount} active
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {meta.description}
          </p>
        </div>

        {/* Category-level heart toggle */}
        <Tooltip content={
            section.folder.is_included_in_ai
              ? 'Category included in LiLa — click to exclude all'
              : 'Category excluded from LiLa — click to include all'
          }>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFolderAI()
          }}
          className="p-1.5 rounded transition-colors shrink-0"
          style={{
            color: section.folder.is_included_in_ai
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-text-secondary)',
          }}
        >
          {section.folder.is_included_in_ai ? (
            <Heart size={16} fill="currentColor" />
          ) : (
            <HeartOff size={16} />
          )}
        </button>
        </Tooltip>

        <div className="shrink-0">
          {expanded ? (
            <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Faith section extras */}
          {isFaithSection && (
            <div className="mb-3 space-y-2">
              {faithSummary && (
                <div
                  className="flex items-center gap-2 p-2.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-bg-secondary) 80%, transparent)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <BookHeart size={14} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
                  {faithSummary}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenFaithPreferences()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                  color: 'var(--color-btn-primary-bg)',
                  border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
                }}
              >
                <Settings size={12} />
                {faithPrefs.data ? 'Edit Faith Preferences' : 'Set Up Faith Preferences'}
              </button>
            </div>
          )}

          {/* Items */}
          {section.items.length === 0 ? (
            <p className="text-xs py-3" style={{ color: 'var(--color-text-secondary)' }}>
              No context items yet. Add items to help LiLa understand your family better.
            </p>
          ) : (
            <div>
              {section.items.map((item) => (
                <ContextItemRow
                  key={item.id}
                  item={item}
                  onToggleAI={(included) =>
                    toggleItemAI.mutate({ id: item.id, folderId: section.folder.id, included })
                  }
                  onArchive={() =>
                    archiveItem.mutate({ id: item.id, folderId: section.folder.id })
                  }
                  onUpdateContent={(value) =>
                    updateItem.mutate({ id: item.id, context_value: value })
                  }
                />
              ))}
            </div>
          )}

          {/* Inline add */}
          {addingItem ? (
            <div className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem()
                  if (e.key === 'Escape') { setAddingItem(false); setNewItemValue('') }
                }}
                placeholder="Add a context item..."
                autoFocus
                className="flex-1 text-sm rounded px-2 py-1.5 outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <button onClick={handleAddItem} className="p-1.5 rounded" style={{ color: 'var(--color-success)' }}>
                <Check size={14} />
              </button>
              <button
                onClick={() => { setAddingItem(false); setNewItemValue('') }}
                className="p-1.5 rounded"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="flex items-center gap-1.5 mt-2 text-xs font-medium py-1.5 px-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              <Plus size={12} />
              Add item
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

/** Family Guiding Stars row with heart toggle */
function GuidingStarRow({
  star,
  onToggleAI,
}: {
  star: { id: string; content: string; entry_type: string | null; is_included_in_ai: boolean }
  onToggleAI: (included: boolean) => void
}) {
  return (
    <div
      className="flex items-start gap-2 py-2 px-1 group"
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}
    >
      <Star size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-btn-primary-bg)' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {star.content}
        </p>
        {star.entry_type && (
          <Badge variant="default" size="sm" className="mt-0.5">
            {star.entry_type.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>
      <Tooltip content={star.is_included_in_ai ? 'Included in LiLa context' : 'Excluded from LiLa context'}>
      <button
        onClick={() => onToggleAI(!star.is_included_in_ai)}
        className="p-1.5 rounded transition-colors shrink-0 opacity-70 group-hover:opacity-100"
        style={{
          color: star.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
        }}
      >
        {star.is_included_in_ai ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
      </button>
      </Tooltip>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function FamilyOverviewDetail() {
  const navigate = useNavigate()
  const { data: family, isLoading: familyLoading } = useFamily()
  const { data: member, isLoading: memberLoading } = useFamilyMember()
  const familyId = family?.id

  const { data: overview, isLoading: overviewLoading } = useFamilyOverview(familyId)
  const toggleAggregatedAI = useToggleAggregatedAI()

  const [faithModalOpen, setFaithModalOpen] = useState(false)

  const isLoading = familyLoading || memberLoading || overviewLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!family || !overview) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <EmptyState
          icon={<Users size={32} />}
          title="Family not found"
          description="Unable to load family data."
        />
      </div>
    )
  }

  const sections = overview.sections ?? []
  const familyStars = overview.familyStars ?? []

  return (
    <PermissionGate featureKey="archives_browse">
      <div className="density-compact max-w-3xl mx-auto space-y-6 pb-24">
        {/* FeatureGuide */}
        <FeatureGuide featureKey="archives" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/archives')}
            className="p-2 rounded-lg transition-colors hidden md:flex"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Back to Archives"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Family Overview
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              What LiLa knows about your family as a whole.
            </p>
          </div>
        </div>

        {/* Family name card */}
        <Card variant="flat" padding="lg">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' }}
            >
              <Users size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
            </div>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                {family.family_name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {sections.reduce((sum, s) => sum + s.items.length, 0) + familyStars.length} context items
              </p>
            </div>
          </div>
        </Card>

        {/* 4 Expandable Sections */}
        <div>
          <h2
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Family Context
          </h2>

          {sections.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No family context sections"
              description="Context sections will be created automatically. Try adding some family context items."
            />
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <OverviewSection
                  key={section.folder.id}
                  section={section}
                  familyId={familyId!}
                  isFaithSection={section.folder.folder_name === 'Faith & Values'}
                  onOpenFaithPreferences={() => setFaithModalOpen(true)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Family Guiding Stars */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Family Guiding Stars
            </h2>
            <button
              onClick={() => navigate('/guiding-stars?scope=family')}
              className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              Manage
            </button>
          </div>

          {familyStars.length === 0 ? (
            <Card variant="flat" padding="md">
              <div className="text-center py-4">
                <Star
                  size={24}
                  className="mx-auto mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No family-level Guiding Stars yet.
                </p>
                <button
                  onClick={() => navigate('/guiding-stars?scope=family')}
                  className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                    color: 'var(--color-btn-primary-bg)',
                  }}
                >
                  Add Family Stars
                </button>
              </div>
            </Card>
          ) : (
            <Card variant="flat" padding="md">
              {familyStars.map((star: { id: string; content: string; entry_type: string | null; is_included_in_ai: boolean }) => (
                <GuidingStarRow
                  key={star.id}
                  star={star}
                  onToggleAI={(included) =>
                    toggleAggregatedAI.mutate({
                      sourceTable: 'guiding_stars',
                      id: star.id,
                      memberId: member?.id ?? '',
                      included,
                    })
                  }
                />
              ))}
            </Card>
          )}
        </div>

        {/* Family Vision Statement — STUB */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3 py-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}
            >
              <Eye size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Family Vision Statement
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Family Vision Quest — coming soon
              </p>
            </div>
            <Badge variant="default" size="sm">Planned</Badge>
          </div>
        </Card>

        {/* Family Meeting Notes — STUB */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3 py-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}
            >
              <MessageSquare size={18} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Family Meeting Notes
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Meeting Notes routing — coming soon
              </p>
            </div>
            <Badge variant="default" size="sm">Planned</Badge>
          </div>
        </Card>

        {/* Bottom buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              // STUB: Opens LiLa with family context pre-loaded
              navigate('/lila')
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Sparkles size={16} />
            Build with LiLa
          </button>

          <button
            onClick={() => navigate('/archives/export?scope=family')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-btn-primary-bg)',
              border: '1px solid var(--color-border)',
            }}
          >
            Export
          </button>
        </div>

        {/* Faith Preferences Modal */}
        <FaithPreferencesModal
          open={faithModalOpen}
          onClose={() => setFaithModalOpen(false)}
          familyId={familyId!}
        />
      </div>
    </PermissionGate>
  )
}
