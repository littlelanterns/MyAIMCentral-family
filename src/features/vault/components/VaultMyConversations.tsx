/**
 * VaultMyConversations — AI tool conversation history within the Vault
 *
 * Shows past AI tool conversations for the current member with search,
 * date filters, and the ability to resume (continue) past conversations.
 * Mom also sees a "Family" tab for viewing family members' conversations.
 */

import { useState, useMemo } from 'react'
import { Search, Archive, Trash2, Pencil, Users, MessageSquare } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useConversationHistory,
  useFamilyConversations,
  useArchiveConversation,
  useDeleteConversation,
  useRenameConversation,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from '@/components/lila/LilaAvatar'
import { useToolLauncher } from '@/components/lila/ToolLauncherProvider'

type DateRange = 'all' | 'today' | 'week' | 'month'
type ViewTab = 'mine' | 'family'

function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date()
  switch (range) {
    case 'today': { const d = new Date(now); d.setHours(0, 0, 0, 0); return d }
    case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d }
    case 'month': { const d = new Date(now); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d }
    default: return null
  }
}

// Only show conversations that came from tools (guided_mode is set)
function isToolConversation(conv: LilaConversation): boolean {
  return !!(conv.guided_mode || conv.guided_subtype)
}

export function VaultMyConversations() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const isMom = member?.role === 'primary_parent'
  const { resumeConversation } = useToolLauncher()

  const [viewTab, setViewTab] = useState<ViewTab>('mine')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const { data: allConversations = [] } = useConversationHistory(member?.id, {
    search: search || undefined,
  })
  const { data: familyConversations = [] } = useFamilyConversations(
    isMom ? family?.id : undefined,
    isMom ? member?.id : undefined,
  )
  const archiveConversation = useArchiveConversation()
  const deleteConversation = useDeleteConversation()
  const renameConversation = useRenameConversation()

  // Filter to tool conversations only + date range
  const filteredConversations = useMemo(() => {
    const cutoff = getDateRangeStart(dateRange)
    const source = viewTab === 'family' ? familyConversations : allConversations
    return source
      .filter(isToolConversation)
      .filter(c => !cutoff || new Date(c.updated_at) >= cutoff)
  }, [allConversations, familyConversations, dateRange, viewTab])

  function handleRename(conv: LilaConversation) {
    if (editTitle.trim() && member) {
      renameConversation.mutate({ id: conv.id, title: editTitle.trim(), memberId: member.id })
    }
    setEditingId(null)
  }

  function handleSelect(conv: LilaConversation) {
    if (editingId) return
    resumeConversation(conv)
  }

  const isEmpty = filteredConversations.length === 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={20} style={{ color: 'var(--color-text-secondary)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          My Conversations
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        Your past AI tool conversations. Tap any conversation to continue where you left off.
      </p>

      {/* Mine / Family tabs — mom only */}
      {isMom && (
        <div className="flex border-b mb-3" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setViewTab('mine')}
            className="flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors"
            style={{
              borderColor: viewTab === 'mine' ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: viewTab === 'mine' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            Mine
          </button>
          <button
            onClick={() => setViewTab('family')}
            className="flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-1"
            style={{
              borderColor: viewTab === 'family' ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: viewTab === 'family' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            <Users size={14} />
            Family
          </button>
        </div>
      )}

      {/* Search + date filter row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-input, var(--color-bg-primary))',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="px-3 py-2 rounded-lg text-sm outline-none shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-input, var(--color-bg-primary))',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>

      {/* Conversation list */}
      {isEmpty ? (
        <div className="text-center py-12">
          <MessageSquare size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {search || dateRange !== 'all'
              ? 'No conversations match your filters.'
              : 'No tool conversations yet. Try one of the AI tools!'}
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {filteredConversations.map((conv, i) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              isEditing={editingId === conv.id}
              editTitle={editTitle}
              isFamilyView={viewTab === 'family'}
              memberName={(conv as any).family_members?.display_name}
              isLast={i === filteredConversations.length - 1}
              onSelect={() => handleSelect(conv)}
              onStartRename={() => { setEditingId(conv.id); setEditTitle(conv.title || '') }}
              onEditTitleChange={setEditTitle}
              onRename={() => handleRename(conv)}
              onArchive={() => member && archiveConversation.mutate({ id: conv.id, memberId: member.id })}
              onDelete={() => member && deleteConversation.mutate({ id: conv.id, memberId: member.id })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ConversationRow({
  conv,
  isEditing,
  editTitle,
  isFamilyView,
  memberName,
  isLast,
  onSelect,
  onStartRename,
  onEditTitleChange,
  onRename,
  onArchive,
  onDelete,
}: {
  conv: LilaConversation
  isEditing: boolean
  editTitle: string
  isFamilyView: boolean
  memberName?: string
  isLast: boolean
  onSelect: () => void
  onStartRename: () => void
  onEditTitleChange: (v: string) => void
  onRename: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const avatarKey = getAvatarKeyForMode(conv.mode || 'general')
  const modeLabel = getModeDisplayName(conv.mode, conv.guided_subtype)

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-90 ${isLast ? '' : 'border-b'}`}
      style={{ borderColor: 'var(--color-border)' }}
      onClick={() => !isEditing && onSelect()}
    >
      <LilaAvatar avatarKey={avatarKey} size={16} className="mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-1.5 py-0.5 rounded text-xs"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
          >
            {modeLabel}
          </span>
          {isFamilyView && memberName && (
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {memberName}
            </span>
          )}
          {conv.status === 'archived' && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Archived</span>
          )}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onBlur={onRename}
            onKeyDown={(e) => e.key === 'Enter' && onRename()}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 w-full text-sm px-1 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            autoFocus
          />
        ) : (
          <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>
            {conv.title || 'Untitled conversation'}
          </p>
        )}

        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {new Date(conv.updated_at).toLocaleDateString()} &middot; {conv.message_count} messages
        </p>
      </div>

      {/* Desktop action buttons */}
      {!isFamilyView && (
        <div className="hidden md:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Rename">
            <button onClick={onStartRename} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
              <Pencil size={12} />
            </button>
          </Tooltip>
          {conv.status === 'active' && (
            <Tooltip content="Archive">
              <button onClick={onArchive} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                <Archive size={12} />
              </button>
            </Tooltip>
          )}
          <Tooltip content="Delete">
            <button onClick={onDelete} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
              <Trash2 size={12} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
