/**
 * PrivacyFilteredPage — PRD-13
 * Screen 5: /archives/privacy-filtered
 * Shows all privacy-filtered context items grouped by member.
 * These items are NEVER included in LiLa conversations for other
 * family members — a hard system boundary, not a preference.
 * Mom can still toggle is_included_in_ai for her own LiLa context.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Lock,
  Heart,
  HeartOff,
  Plus,
  ArrowRightFromLine,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Badge,
  LoadingSpinner,
  EmptyState,
  Modal,
  Select,
  Tooltip,
} from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  usePrivacyFiltered,
  useMoveToArchive,
  useToggleArchiveItemAI,
  useCreateArchiveContextItem,
  type PrivacyFilteredGroup,
} from '@/hooks/useArchives'
import type { ArchiveContextItem } from '@/types/archives'
import { supabase } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: string }) {
  const label =
    source === 'lila_detected'
      ? 'AI auto-routed'
      : source === 'manual'
        ? 'Manually added'
        : source === 'review_route'
          ? 'Review & Route'
          : source

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {label}
    </span>
  )
}

function PrivacyFilteredItem({
  item,
  onToggleAI,
  onMoveToArchive,
}: {
  item: ArchiveContextItem
  onToggleAI: (id: string, folderId: string, included: boolean) => void
  onMoveToArchive: (itemId: string) => void
}) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.context_value}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <SourceBadge source={item.source} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content={
              item.is_included_in_ai
                ? 'Included in your LiLa context -- click to exclude'
                : 'Excluded from your LiLa context -- click to include'
            }>
          <button
            onClick={() =>
              onToggleAI(item.id, item.folder_id, !item.is_included_in_ai)
            }
            className="p-1.5 rounded transition-colors"
            style={{
              color: item.is_included_in_ai
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-text-secondary)',
            }}
          >
            {item.is_included_in_ai ? (
              <Heart size={16} fill="currentColor" />
            ) : (
              <HeartOff size={16} />
            )}
          </button>
          </Tooltip>

          <Tooltip content="Move to Archive">
          <button
            onClick={() => onMoveToArchive(item.id)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowRightFromLine size={16} />
          </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function MemberGroup({
  group,
  onToggleAI,
  onMoveToArchive,
}: {
  group: PrivacyFilteredGroup
  onToggleAI: (id: string, folderId: string, included: boolean) => void
  onMoveToArchive: (itemId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full py-2"
      >
        {expanded ? (
          <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {group.member_name}
        </h3>
        <Badge variant="default" size="sm">
          {group.items.length}
        </Badge>
      </button>

      {expanded && (
        <div className="space-y-2 ml-6">
          {group.items.map((item) => (
            <PrivacyFilteredItem
              key={item.id}
              item={item}
              onToggleAI={onToggleAI}
              onMoveToArchive={onMoveToArchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Item Form
// ---------------------------------------------------------------------------

function AddPrivacyItemForm({
  open,
  onClose,
  familyId,
  members,
}: {
  open: boolean
  onClose: () => void
  familyId: string
  members: Array<{ id: string; display_name: string }>
}) {
  const [selectedMember, setSelectedMember] = useState('')
  const [content, setContent] = useState('')
  const createItem = useCreateArchiveContextItem()

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: m.display_name,
  }))

  async function handleSave() {
    if (!selectedMember || !content.trim()) return

    // Find or create a General folder for this member
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id')
      .eq('family_id', familyId)
      .eq('member_id', selectedMember)
      .eq('folder_type', 'system_category')
      .eq('folder_name', 'General')
      .limit(1)

    let folderId = folders?.[0]?.id

    if (!folderId) {
      // Create the General folder
      const { data: newFolder } = await supabase
        .from('archive_folders')
        .insert({
          family_id: familyId,
          member_id: selectedMember,
          folder_name: 'General',
          folder_type: 'system_category',
        })
        .select('id')
        .single()

      folderId = newFolder?.id
    }

    if (!folderId) return

    await createItem.mutateAsync({
      family_id: familyId,
      folder_id: folderId,
      member_id: selectedMember,
      context_value: content.trim(),
      is_privacy_filtered: true,
      source: 'manual',
    })

    setSelectedMember('')
    setContent('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Privacy Filtered Item" size="sm">
      <div className="space-y-4">
        <Select
          label="Family Member"
          value={selectedMember}
          onChange={setSelectedMember}
          options={memberOptions}
          placeholder="Select a member..."
          required
        />

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            placeholder="Enter the sensitive context item..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedMember || !content.trim() || createItem.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {createItem.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Confirm Move Modal
// ---------------------------------------------------------------------------

function ConfirmMoveModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title="Move to Archive" size="sm">
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          This will move the item out of Privacy Filtered and into the member's
          General archive folder. Other family members with access may be able to
          see this item. Are you sure?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {isPending ? 'Moving...' : 'Move to Archive'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function PrivacyFilteredPage() {
  const navigate = useNavigate()
  const { isLoading: memberLoading } = useFamilyMember()
  const { data: family, isLoading: familyLoading } = useFamily()
  const familyId = family?.id

  const { data: allMembers = [] } = useFamilyMembers(familyId)
  const { data: groups = [], isLoading: groupsLoading } = usePrivacyFiltered(familyId)
  const moveToArchive = useMoveToArchive()
  const toggleAI = useToggleArchiveItemAI()

  const [showAddForm, setShowAddForm] = useState(false)
  const [moveTarget, setMoveTarget] = useState<string | null>(null)

  const activeMembers = useMemo(
    () =>
      allMembers
        .filter((m) => m.is_active)
        .map((m) => ({ id: m.id, display_name: m.display_name })),
    [allMembers],
  )

  const isLoading = memberLoading || familyLoading || groupsLoading

  function handleToggleAI(id: string, folderId: string, included: boolean) {
    toggleAI.mutate({ id, folderId, included })
  }

  function handleMoveToArchive(itemId: string) {
    setMoveTarget(itemId)
  }

  async function confirmMove() {
    if (!moveTarget || !familyId) return

    // Find the item to get the member_id
    const item = groups
      .flatMap((g) => g.items)
      .find((i) => i.id === moveTarget)

    if (!item?.member_id) return

    // Find the member's General folder
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id')
      .eq('family_id', familyId)
      .eq('member_id', item.member_id)
      .eq('folder_name', 'General')
      .limit(1)

    const folderId = folders?.[0]?.id
    if (!folderId) return

    await moveToArchive.mutateAsync({ itemId: moveTarget, folderId })
    setMoveTarget(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <PermissionGate featureKey="archives_browse">
      <div
        className="max-w-3xl mx-auto space-y-6 pb-24"
      >
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

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Lock size={20} style={{ color: 'var(--color-text-secondary)' }} />
              <h1
                className="text-2xl font-bold"
                style={{
                  color: 'var(--color-text-heading)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Privacy Filtered
              </h1>
            </div>
          </div>

          <Badge variant="default" size="sm">
            {totalItems} items
          </Badge>
        </div>

        {/* Explanation */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-bg-secondary) 80%, transparent)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex gap-3">
            <Lock
              size={16}
              className="shrink-0 mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Items here are sensitive context visible only to you. They are never
              included in LiLa conversations for other family members, regardless
              of any toggle settings. This is a hard system boundary -- not a
              preference.
            </p>
          </div>
        </div>

        {/* Grouped Items */}
        {groups.length === 0 ? (
          <EmptyState
            icon={<Lock size={32} />}
            title="No privacy-filtered items"
            description="Items marked as privacy-filtered will appear here, visible only to you."
          />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <MemberGroup
                key={group.member_id}
                group={group}
                onToggleAI={handleToggleAI}
                onMoveToArchive={handleMoveToArchive}
              />
            ))}
          </div>
        )}

        {/* Add Item Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
          aria-label="Add privacy-filtered item"
        >
          <Plus size={24} />
        </button>

        {/* Add Form Modal */}
        {familyId && (
          <AddPrivacyItemForm
            open={showAddForm}
            onClose={() => setShowAddForm(false)}
            familyId={familyId}
            members={activeMembers}
          />
        )}

        {/* Confirm Move Modal */}
        <ConfirmMoveModal
          open={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          onConfirm={confirmMove}
          isPending={moveToArchive.isPending}
        />
      </div>
    </PermissionGate>
  )
}
