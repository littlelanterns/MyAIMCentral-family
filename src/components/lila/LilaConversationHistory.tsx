import { useState, useMemo } from 'react'
import { Search, Archive, Trash2, Pencil } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useConversationHistory,
  useArchiveConversation,
  useDeleteConversation,
  useRenameConversation,
} from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from './LilaAvatar'

/**
 * Conversation History — PRD-05
 * List of past conversations with search, date range filter, status filter, mode filter,
 * rename, archive, and delete.
 * Accessible from drawer header (mom) or as a standalone panel.
 */

type DateRange = 'all' | 'today' | 'week' | 'month'

interface LilaConversationHistoryProps {
  onConversationSelect: (conv: LilaConversation) => void
  onClose: () => void
}

/** Returns the start of a date range as an ISO string, or null for 'all'. */
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
  const archiveConversation = useArchiveConversation()
  const deleteConversation = useDeleteConversation()
  const renameConversation = useRenameConversation()

  // Client-side date filtering — applied on top of the server query
  const filteredConversations = useMemo(() => {
    const cutoff = getDateRangeStart(dateRange)
    if (!cutoff) return conversations
    return conversations.filter(c => new Date(c.updated_at) >= cutoff)
  }, [conversations, dateRange])

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

      {/* Status + mode filter chips */}
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

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            {search || dateRange !== 'all'
              ? 'No conversations match your filters.'
              : 'No conversations yet.'}
          </p>
        )}

        {filteredConversations.map(conv => {
          const avatarKey = getAvatarKeyForMode(conv.mode || 'general')
          const modeLabel = getModeDisplayName(conv.mode, conv.guided_subtype)
          const isEditing = editingId === conv.id

          return (
            <div
              key={conv.id}
              className="flex items-start gap-3 px-4 py-3 border-b cursor-pointer hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--color-border)' }}
              onClick={() => !isEditing && onConversationSelect(conv)}
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
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(conv)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(conv)}
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

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setEditingId(conv.id)
                    setEditTitle(conv.title || '')
                  }}
                  className="p-1 rounded hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title="Rename"
                >
                  <Pencil size={12} />
                </button>
                {conv.status === 'active' && (
                  <button
                    onClick={() => member && archiveConversation.mutate({ id: conv.id, memberId: member.id })}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title="Archive"
                  >
                    <Archive size={12} />
                  </button>
                )}
                <button
                  onClick={() => member && deleteConversation.mutate({ id: conv.id, memberId: member.id })}
                  className="p-1 rounded hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
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
