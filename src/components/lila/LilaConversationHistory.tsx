import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, Archive, Trash2, Pencil, Users } from 'lucide-react'
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
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from './LilaAvatar'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

/**
 * Conversation History — PRD-05
 * List of past conversations with search, date range filter, status filter, mode filter,
 * rename, archive, delete, swipe-left actions, and long-press context menu.
 * Mom also sees a "Family" tab for other members' conversations.
 */

type DateRange = 'all' | 'today' | 'week' | 'month'
type ViewTab = 'mine' | 'family'

interface LilaConversationHistoryProps {
  onConversationSelect: (conv: LilaConversation) => void
  onClose: () => void
}

function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date()
  switch (range) {
    case 'today': {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'month': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      d.setHours(0, 0, 0, 0)
      return d
    }
    default:
      return null
  }
}

export function LilaConversationHistory({ onConversationSelect, onClose }: LilaConversationHistoryProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const isMom = member?.role === 'primary_parent'
  const [viewTab, setViewTab] = useState<ViewTab>('mine')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | undefined>(undefined)
  const [modeFilter, setModeFilter] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const { data: conversations = [] } = useConversationHistory(member?.id, {
    search: search || undefined,
    status: statusFilter,
    modeKey: modeFilter,
  })
  const { data: familyConversations = [] } = useFamilyConversations(
    isMom ? family?.id : undefined,
    isMom ? member?.id : undefined,
  )
  const archiveConversation = useArchiveConversation()
  const deleteConversation = useDeleteConversation()
  const renameConversation = useRenameConversation()

  // Client-side date filtering
  const filteredConversations = useMemo(() => {
    const cutoff = getDateRangeStart(dateRange)
    const source = viewTab === 'family' ? familyConversations : conversations
    if (!cutoff) return source
    return source.filter(c => new Date(c.updated_at) >= cutoff)
  }, [conversations, familyConversations, dateRange, viewTab])

  function handleRename(conv: LilaConversation) {
    if (editTitle.trim() && member) {
      renameConversation.mutate({ id: conv.id, title: editTitle.trim(), memberId: member.id })
    }
    setEditingId(null)
  }

  const isEmpty = filteredConversations.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Conversation History
        </h3>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
          Back
        </button>
      </div>

      {/* Mine / Family tabs — mom only (PRD-05 §Visibility) */}
      {isMom && (
        <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setViewTab('mine')}
            className="flex-1 py-2 text-xs font-medium text-center border-b-2 transition-colors"
            style={{
              borderColor: viewTab === 'mine' ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: viewTab === 'mine' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            My Conversations
          </button>
          <button
            onClick={() => setViewTab('family')}
            className="flex-1 py-2 text-xs font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-1"
            style={{
              borderColor: viewTab === 'family' ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: viewTab === 'family' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            <Users size={12} />
            Family
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Date range filter */}
      <div className="px-4 pt-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
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

      {/* Status + mode filter chips — only for "mine" tab */}
      {viewTab === 'mine' && (
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          <FilterChip label="All" active={!statusFilter} onClick={() => setStatusFilter(undefined)} />
          <FilterChip label="Active" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
          <FilterChip label="Archived" active={statusFilter === 'archived'} onClick={() => setStatusFilter('archived')} />
          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />
          <FilterChip
            label="Help"
            active={modeFilter === 'help'}
            onClick={() => setModeFilter(modeFilter === 'help' ? undefined : 'help')}
          />
          <FilterChip
            label="Assist"
            active={modeFilter === 'assist'}
            onClick={() => setModeFilter(modeFilter === 'assist' ? undefined : 'assist')}
          />
          <FilterChip
            label="General"
            active={modeFilter === 'general'}
            onClick={() => setModeFilter(modeFilter === 'general' ? undefined : 'general')}
          />
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            {viewTab === 'family'
              ? 'No family conversations to show.'
              : search || dateRange !== 'all'
                ? 'No conversations match your filters.'
                : 'No conversations yet.'}
          </p>
        )}

        {filteredConversations.map(conv => (
          <ConversationRow
            key={conv.id}
            conv={conv}
            isEditing={editingId === conv.id}
            editTitle={editTitle}
            isFamilyView={viewTab === 'family'}
            memberName={(conv as any).family_members?.display_name}
            onSelect={() => !editingId && onConversationSelect(conv)}
            onStartRename={() => {
              setEditingId(conv.id)
              setEditTitle(conv.title || '')
            }}
            onEditTitleChange={setEditTitle}
            onRename={() => handleRename(conv)}
            onArchive={() => member && archiveConversation.mutate({ id: conv.id, memberId: member.id })}
            onDelete={() => member && deleteConversation.mutate({ id: conv.id, memberId: member.id })}
          />
        ))}
      </div>
    </div>
  )
}

/** Single conversation row with swipe-left and long-press support (PRD-05 §Screen 2) */
function ConversationRow({
  conv,
  isEditing,
  editTitle,
  isFamilyView,
  memberName,
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
  onSelect: () => void
  onStartRename: () => void
  onEditTitleChange: (v: string) => void
  onRename: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [swipedOpen, setSwipedOpen] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => setSwipedOpen(true),
    onSwipeRight: () => setSwipedOpen(false),
    threshold: 50,
    mobileOnly: false,
  })

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowContextMenu(true)
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const avatarKey = getAvatarKeyForMode(conv.mode || 'general')
  const modeLabel = getModeDisplayName(conv.mode, conv.guided_subtype)

  return (
    <div className="relative overflow-hidden">
      {/* Swipe-revealed actions */}
      {swipedOpen && (
        <div className="absolute right-0 top-0 bottom-0 flex items-stretch z-10">
          {conv.status === 'active' && (
            <button
              onClick={() => { onArchive(); setSwipedOpen(false) }}
              className="px-4 flex items-center text-xs font-medium"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
            >
              <Archive size={14} />
            </button>
          )}
          <button
            onClick={() => { onDelete(); setSwipedOpen(false) }}
            className="px-4 flex items-center text-xs font-medium"
            style={{ backgroundColor: 'var(--color-error, #dc2626)', color: '#fff' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Main row */}
      <div
        ref={swipeRef}
        className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer hover:opacity-90 transition-all"
        style={{
          borderColor: 'var(--color-border)',
          transform: swipedOpen ? 'translateX(-100px)' : 'translateX(0)',
          transition: 'transform 200ms ease-out',
        }}
        onClick={() => { if (!isEditing && !showContextMenu) onSelect() }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(true) }}
      >
        <LilaAvatar avatarKey={avatarKey} size={16} className="mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Archived
              </span>
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

        {/* Desktop action buttons (visible on non-touch) */}
        {!isFamilyView && (
          <div className="hidden md:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Tooltip content="Rename">
            <button
              onClick={onStartRename}
              className="p-1 rounded hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Pencil size={12} />
            </button>
            </Tooltip>
            {conv.status === 'active' && (
              <Tooltip content="Archive">
              <button
                onClick={onArchive}
                className="p-1 rounded hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Archive size={12} />
              </button>
              </Tooltip>
            )}
            <Tooltip content="Delete">
            <button
              onClick={onDelete}
              className="p-1 rounded hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Trash2 size={12} />
            </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Long-press context menu (PRD-05 §Screen 2 Interactions) */}
      {showContextMenu && !isFamilyView && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
          <div
            className="absolute right-4 top-2 z-50 rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <ContextMenuItem
              icon={Pencil}
              label="Rename"
              onClick={() => { onStartRename(); setShowContextMenu(false) }}
            />
            {conv.status === 'active' && (
              <ContextMenuItem
                icon={Archive}
                label="Archive"
                onClick={() => { onArchive(); setShowContextMenu(false) }}
              />
            )}
            <ContextMenuItem
              icon={Trash2}
              label="Delete"
              onClick={() => { onDelete(); setShowContextMenu(false) }}
              danger
            />
          </div>
        </>
      )}
    </div>
  )
}

function ContextMenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:opacity-80"
      style={{ color: danger ? 'var(--color-error, #dc2626)' : 'var(--color-text-primary)' }}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${active ? 'btn-primary' : ''}`}
      style={{
        backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
        color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
      }}
    >
      {label}
    </button>
  )
}
