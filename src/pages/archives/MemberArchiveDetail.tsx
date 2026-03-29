/**
 * MemberArchiveDetail — PRD-13
 * Screen 2: Individual member archive detail page.
 * Shows person-level AI toggle, auto-generated overview card,
 * context folders with item-level toggles, and aggregated
 * source sections (InnerWorkings, Guiding Stars, Best Intentions).
 */

import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  HeartOff,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderPlus,
  MoreVertical,
  Pencil,
  Check,
  X,
  Filter,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import {
  Card,
  Badge,
  Avatar,
  RoleBadge,
  LoadingSpinner,
  EmptyState,
  Modal,
  FeatureGuide,
  Tooltip,
} from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { getOptimalColumnCount } from '@/lib/utils/gridColumns'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useArchiveFolders,
  useArchiveContextItems,
  useArchiveMemberSettings,
  useArchiveAggregation,
  useCreateArchiveFolder,
  useCreateArchiveContextItem,
  useUpdateArchiveContextItem,
  useArchiveContextItem,
  useToggleArchiveItemAI,
  useToggleMemberPersonLevel,
  useToggleAggregatedAI,
  useUpdateArchiveFolder,
  type AggregatedSourceGroup,
  type ArchiveFolderNode,
} from '@/hooks/useArchives'
import type { ArchiveContextItem } from '@/types/archives'

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ---------------------------------------------------------------------------
// Source badge label
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

/** Single context item row inside a folder */
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
      {/* Content */}
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

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
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

/** Collapsible folder group */
function FolderGroup({
  folder,
  familyId,
  memberId,
  depth,
  childFolders,
  lilaFilterActive,
}: {
  folder: ArchiveFolderNode
  familyId: string
  memberId: string
  depth: number
  childFolders: ArchiveFolderNode[]
  lilaFilterActive: boolean
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const { data: items = [], isLoading } = useArchiveContextItems(folder.id)
  const toggleItemAI = useToggleArchiveItemAI()
  const archiveItem = useArchiveContextItem()
  const updateItem = useUpdateArchiveContextItem()
  const updateFolder = useUpdateArchiveFolder()
  const createItem = useCreateArchiveContextItem()
  const [addingItem, setAddingItem] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.folder_name)

  // Filter items if LiLa filter is active
  const displayItems = useMemo(() => {
    if (!lilaFilterActive) return items
    return items.filter((i) => i.source === 'lila_detected')
  }, [items, lilaFilterActive])

  const activeCount = items.filter((i) => i.is_included_in_ai).length
  const totalCount = items.length

  const handleToggleFolderAI = () => {
    updateFolder.mutate({
      id: folder.id,
      familyId,
      is_included_in_ai: !folder.is_included_in_ai,
    })
  }

  const handleAddItem = () => {
    if (!newItemValue.trim()) return
    createItem.mutate({
      family_id: familyId,
      folder_id: folder.id,
      member_id: memberId,
      context_value: newItemValue.trim(),
    })
    setNewItemValue('')
    setAddingItem(false)
  }

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== folder.folder_name) {
      updateFolder.mutate({ id: folder.id, familyId, folder_name: renameValue.trim() })
    }
    setRenaming(false)
  }

  const handleDeleteFolder = async () => {
    // Soft delete: just set parent to null and move items. For now, simple delete via update
    // STUB: Full folder deletion with item reassignment — wires to PRD-13
    setShowMenu(false)
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      {/* Folder header */}
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer"
        style={{ backgroundColor: expanded ? 'color-mix(in srgb, var(--color-bg-secondary) 60%, transparent)' : 'transparent' }}
      >
        <button onClick={() => setExpanded(!expanded)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          {expanded ? (
            <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          )}

          {renaming ? (
            <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') { setRenaming(false); setRenameValue(folder.folder_name) }
                }}
                autoFocus
                className="flex-1 text-sm rounded px-2 py-0.5 outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <button onClick={handleRename} className="p-0.5" style={{ color: 'var(--color-success)' }}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
                {folder.folder_name}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                {activeCount}/{totalCount}
              </span>
            </>
          )}
        </button>

        {/* Category-level heart toggle */}
        <Tooltip content={folder.is_included_in_ai ? 'Folder included in LiLa' : 'Folder excluded from LiLa'}>
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleFolderAI() }}
          className="p-1 rounded transition-colors flex-shrink-0"
          style={{
            color: folder.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
          }}
        >
          {folder.is_included_in_ai ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
        </button>
        </Tooltip>

        {/* Overflow menu for custom folders */}
        {!folder.is_system && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-lg shadow-lg py-1 min-w-[120px]"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => { setRenaming(true); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:opacity-80"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    <Pencil size={12} /> Rename
                  </button>
                  <button
                    onClick={handleDeleteFolder}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:opacity-80"
                    style={{ color: 'var(--color-error, #ef4444)' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="pl-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : displayItems.length === 0 ? (
            <p className="text-xs py-3 px-2" style={{ color: 'var(--color-text-secondary)' }}>
              {lilaFilterActive ? 'No LiLa-detected items in this folder.' : 'No items yet.'}
            </p>
          ) : (
            <div>
              {displayItems.map((item) => (
                <ContextItemRow
                  key={item.id}
                  item={item}
                  onToggleAI={(included) =>
                    toggleItemAI.mutate({ id: item.id, folderId: folder.id, included })
                  }
                  onArchive={() => archiveItem.mutate({ id: item.id, folderId: folder.id })}
                  onUpdateContent={(value) =>
                    updateItem.mutate({ id: item.id, context_value: value })
                  }
                />
              ))}
            </div>
          )}

          {/* Add item button */}
          {!lilaFilterActive && (
            <div className="py-2 px-1">
              {addingItem ? (
                <div className="flex items-center gap-1.5">
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
                  <button
                    onClick={handleAddItem}
                    className="p-1.5 rounded"
                    style={{ color: 'var(--color-btn-primary-bg)' }}
                    disabled={!newItemValue.trim()}
                  >
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
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-btn-primary-bg)' }}
                >
                  <Plus size={12} /> Add item
                </button>
              )}
            </div>
          )}

          {/* Nested child folders */}
          {childFolders.map((child) => (
            <FolderGroup
              key={child.id}
              folder={child}
              familyId={familyId}
              memberId={memberId}
              depth={depth + 1}
              childFolders={child.children}
              lilaFilterActive={lilaFilterActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Aggregated source section (InnerWorkings, Guiding Stars, Best Intentions) */
function AggregatedSourceSection({ group }: { group: AggregatedSourceGroup }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const toggleAI = useToggleAggregatedAI()

  // Group entries by category if present
  const categorized = useMemo(() => {
    const map = new Map<string, typeof group.entries>()
    for (const entry of group.entries) {
      const cat = entry.category || 'Uncategorized'
      const list = map.get(cat) || []
      list.push(entry)
      map.set(cat, list)
    }
    return Array.from(map.entries())
  }, [group.entries])

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        {expanded ? (
          <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {group.source_label}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {group.included_count}/{group.total}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(group.view_link)
          }}
          className="ml-auto flex items-center gap-1 text-xs hover:underline"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          View <ExternalLink size={10} />
        </button>
      </button>

      {expanded && (
        <div className="pl-2 space-y-1">
          {categorized.map(([category, entries]) => (
            <div key={category}>
              {categorized.length > 1 && (
                <p className="text-xs font-medium py-1 px-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {category}
                </p>
              )}
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 py-1.5 px-1 group"
                  style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}
                >
                  <p className="flex-1 text-sm min-w-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {entry.content}
                  </p>

                  {entry.category && (
                    <Badge variant="default" size="sm">
                      {entry.category}
                    </Badge>
                  )}

                  <Tooltip content={entry.is_included_in_ai ? 'Included in LiLa context' : 'Excluded from LiLa context'}>
                  <button
                    onClick={() =>
                      toggleAI.mutate({
                        sourceTable: entry.source_table as 'self_knowledge' | 'guiding_stars' | 'best_intentions',
                        id: entry.id,
                        memberId: '', // memberId resolved by invalidation
                        included: !entry.is_included_in_ai,
                      })
                    }
                    className="p-1 rounded transition-colors flex-shrink-0 opacity-70 group-hover:opacity-100"
                    style={{
                      color: entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {entry.is_included_in_ai ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
                  </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FolderGridWrapper — desktop 3-col grid, mobile single column
// ---------------------------------------------------------------------------

function FolderGridWrapper({
  system,
  custom,
  familyId,
  memberId,
  lilaFilter,
}: {
  system: ArchiveFolderNode[]
  custom: ArchiveFolderNode[]
  familyId: string
  memberId: string
  lilaFilter: boolean
}) {
  const allFolders = [...system, ...custom]
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isDesktop = width >= 1024
  const cols = isDesktop ? getOptimalColumnCount(allFolders.length, 3) : 1

  if (!isDesktop) {
    // Single column — original layout
    return (
      <div className="space-y-1">
        {system.map((folder) => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            familyId={familyId}
            memberId={memberId}
            depth={0}
            childFolders={folder.children}
            lilaFilterActive={lilaFilter}
          />
        ))}
        {custom.map((folder) => (
          <FolderGroup
            key={folder.id}
            folder={folder}
            familyId={familyId}
            memberId={memberId}
            depth={0}
            childFolders={folder.children}
            lilaFilterActive={lilaFilter}
          />
        ))}
      </div>
    )
  }

  // Desktop grid
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '12px',
        alignItems: 'start',
      }}
    >
      {allFolders.map((folder) => (
        <FolderGroup
          key={folder.id}
          folder={folder}
          familyId={familyId}
          memberId={memberId}
          depth={0}
          childFolders={folder.children}
          lilaFilterActive={lilaFilter}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function MemberArchiveDetail() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { data: family } = useFamily()
  const familyId = family?.id

  // All family members to find the target member
  const { data: allMembers = [], isLoading: membersLoading } = useFamilyMembers(familyId)
  const targetMember = useMemo(
    () => allMembers.find((m) => m.id === memberId),
    [allMembers, memberId],
  )

  // Archive data
  const { data: folderData, isLoading: foldersLoading } = useArchiveFolders(familyId, memberId)
  const { data: memberSettings, isLoading: settingsLoading } = useArchiveMemberSettings(familyId, memberId)
  const { data: aggregatedGroups = [], isLoading: aggLoading } = useArchiveAggregation(familyId, memberId)

  // Mutations
  const togglePersonLevel = useToggleMemberPersonLevel()
  const createFolder = useCreateArchiveFolder()

  // Local state
  const [lilaFilter, setLilaFilter] = useState(false)
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showSnoozeExplanation, setShowSnoozeExplanation] = useState(false)

  const isLoading = membersLoading || foldersLoading || settingsLoading || aggLoading

  // Compute counts
  const folders = folderData?.folders ?? []
  const tree = folderData?.tree ?? []

  // System folders first, then custom
  const systemFolders = useMemo(
    () => tree.filter((f) => f.is_system && f.folder_type !== 'member_root'),
    [tree],
  )
  const customFolders = useMemo(
    () => tree.filter((f) => !f.is_system && f.folder_type !== 'member_root'),
    [tree],
  )

  // If top-level nodes are member_root type, dig into their children
  const rootFolders = useMemo(() => {
    const memberRoots = tree.filter((f) => f.folder_type === 'member_root')
    if (memberRoots.length > 0) {
      // Flatten the children of root folders
      const children = memberRoots.flatMap((r) => r.children)
      const sys = children.filter((f) => f.is_system)
      const cust = children.filter((f) => !f.is_system)
      return { system: sys, custom: cust }
    }
    return { system: systemFolders, custom: customFolders }
  }, [tree, systemFolders, customFolders])

  // Total insight count across folders and aggregated sources
  const totalContextItems = useMemo(() => {
    const aggTotal = aggregatedGroups.reduce((sum, g) => sum + g.total, 0)
    return folders.length + aggTotal // Rough count: folders + aggregated entries
  }, [folders, aggregatedGroups])

  const includedContextItems = useMemo(() => {
    const aggIncluded = aggregatedGroups.reduce((sum, g) => sum + g.included_count, 0)
    return aggIncluded
  }, [aggregatedGroups])

  // Person-level AI toggle
  const isPersonIncluded = memberSettings?.is_included_in_ai ?? true

  const handleTogglePersonLevel = () => {
    if (!familyId || !memberId) return
    const newValue = !isPersonIncluded
    if (!newValue) {
      setShowSnoozeExplanation(true)
      setTimeout(() => setShowSnoozeExplanation(false), 4000)
    }
    togglePersonLevel.mutate({ familyId, memberId, included: newValue })
  }

  // Create new folder
  const handleCreateFolder = () => {
    if (!familyId || !memberId || !newFolderName.trim()) return

    // Find the member_root folder to nest under
    const memberRoot = folders.find((f) => f.folder_type === 'member_root')

    createFolder.mutate({
      family_id: familyId,
      member_id: memberId,
      folder_name: newFolderName.trim(),
      parent_folder_id: memberRoot?.id ?? null,
      folder_type: 'custom',
    })
    setNewFolderName('')
    setNewFolderModalOpen(false)
  }

  // Overview card
  const overviewContent = memberSettings?.overview_card_content
  const overviewUpdatedAt = memberSettings?.overview_card_updated_at

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!targetMember) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <EmptyState
          icon={<ArrowLeft size={32} />}
          title="Member not found"
          description="This family member could not be found."
          action={
            <button
              onClick={() => navigate('/archives')}
              className="text-sm font-medium underline"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              Back to Archives
            </button>
          }
        />
      </div>
    )
  }

  return (
    <PermissionGate featureKey="archives_browse">
      <div className="density-compact max-w-3xl mx-auto space-y-6 pb-24">
        <FeatureGuide featureKey="archives_browse" />

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

          <Avatar
            name={targetMember.display_name}
            src={targetMember.avatar_url}
            color={targetMember.assigned_color || targetMember.member_color || undefined}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-xl font-bold truncate"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                {targetMember.display_name}
              </h1>
              <RoleBadge role={targetMember.role} size="sm" />
              {targetMember.out_of_nest && (
                <Badge variant="default" size="sm">Out of Nest</Badge>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Gleaning context from {includedContextItems} of {totalContextItems} insights
            </p>
          </div>
        </div>

        {/* Person-level master toggle */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePersonLevel}
              className="p-2.5 rounded-xl transition-colors"
              style={{
                backgroundColor: isPersonIncluded
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                  : 'var(--color-bg-secondary)',
                color: isPersonIncluded ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              }}
              aria-label={isPersonIncluded ? 'Person included in LiLa context' : 'Person excluded from LiLa context'}
            >
              {isPersonIncluded ? <Heart size={24} fill="currentColor" /> : <HeartOff size={24} />}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {isPersonIncluded ? 'LiLa is using this context' : 'Context snoozed'}
              </p>
              {showSnoozeExplanation && !isPersonIncluded && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  This will snooze all {targetMember.display_name}&apos;s context from LiLa without changing item states.
                </p>
              )}
              {isPersonIncluded && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Toggle off to snooze all of {targetMember.display_name}&apos;s context from LiLa
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Auto-Generated Overview Card */}
        {overviewContent ? (
          <Card variant="raised" padding="md">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  Overview
                </h3>
              </div>

              <div className="space-y-1.5">
                {overviewContent.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {line}
                  </p>
                ))}
              </div>

              {overviewUpdatedAt && (
                <p className="text-[10px] pt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Last updated {relativeTime(overviewUpdatedAt)}
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card variant="flat" padding="md">
            <div className="flex items-center gap-3">
              <Lightbulb size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Overview Card
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  LiLa will generate a summary once there is enough context.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* LiLa-detected filter + New Folder button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLilaFilter(!lilaFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: lilaFilter
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                : 'var(--color-bg-secondary)',
              color: lilaFilter ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              border: lilaFilter ? '1px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
            }}
          >
            <Filter size={12} />
            Recently Added by LiLa
          </button>

          <button
            onClick={() => setNewFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: 'var(--color-btn-primary-bg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <FolderPlus size={12} />
            New Folder
          </button>
        </div>

        {/* Context Folders */}
        <div>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Context Folders
          </h2>

          {rootFolders.system.length === 0 && rootFolders.custom.length === 0 ? (
            <EmptyState
              icon={<FolderPlus size={28} />}
              title="No folders yet"
              description="Create a folder to start organizing context."
            />
          ) : (
            <FolderGridWrapper
              system={rootFolders.system}
              custom={rootFolders.custom}
              familyId={familyId!}
              memberId={memberId!}
              lilaFilter={lilaFilter}
            />
          )}
        </div>

        {/* Aggregated Source Sections */}
        {aggregatedGroups.length > 0 && (
          <div>
            <h2
              className="text-base font-semibold mb-2"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Context Sources
            </h2>

            <div className="space-y-3">
              {aggregatedGroups.map((group) => (
                <AggregatedSourceSection key={group.source_table} group={group} />
              ))}
            </div>
          </div>
        )}

        {/* LifeLantern stub */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                LifeLantern
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Coming soon — life area assessments will feed context here.
              </p>
            </div>
          </div>
        </Card>

        {/* Shared Lists stub */}
        <Card variant="flat" padding="md">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Shared Lists
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Coming soon — lists shared to archive will appear here.
              </p>
            </div>
          </div>
        </Card>

        {/* New Folder Modal */}
        <Modal
          open={newFolderModalOpen}
          onClose={() => { setNewFolderModalOpen(false); setNewFolderName('') }}
          title="New Folder"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setNewFolderModalOpen(false); setNewFolderName('') }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                  opacity: newFolderName.trim() ? 1 : 0.5,
                }}
              >
                Create
              </button>
            </div>
          }
        >
          <div className="py-2">
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Folder name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
              }}
              placeholder="e.g. Medical History, Special Interests..."
              autoFocus
              className="w-full text-sm rounded-lg px-3 py-2 outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>
        </Modal>
      </div>
    </PermissionGate>
  )
}
