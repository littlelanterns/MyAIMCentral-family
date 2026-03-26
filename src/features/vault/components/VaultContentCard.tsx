import { useState } from 'react'
import { Bookmark, BookmarkCheck, Lock, Sparkles } from 'lucide-react'
import type { VaultItem } from '../hooks/useVaultBrowse'
import { useVaultBookmarks } from '../hooks/useVaultBookmarks'

interface Props {
  item: VaultItem
  memberId: string | null
  showProgress?: boolean
  onSelect?: (item: VaultItem) => void
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tutorial: 'Tutorial',
  ai_tool: 'AI Tool',
  prompt_pack: 'Prompt Pack',
  curation: 'Curation',
  workflow: 'Workflow',
  skill: 'Skill',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'var(--color-success, #22c55e)',
  intermediate: 'var(--color-warning, #f59e0b)',
  advanced: 'var(--color-error, #ef4444)',
}

export function VaultContentCard({ item, memberId, showProgress, onSelect }: Props) {
  const { isBookmarked, toggleBookmark } = useVaultBookmarks(memberId)
  const bookmarked = isBookmarked(item.id)

  // NEW badge: show if first_seen_at is within new_badge_duration_days
  const isNew = (() => {
    if (!item.first_seen_at) return false
    const seen = new Date(item.first_seen_at).getTime()
    const duration = (item.new_badge_duration_days || 30) * 24 * 60 * 60 * 1000
    return Date.now() - seen < duration
  })()

  // Tier lock check (during beta, everything is unlocked)
  const isLocked = false // Will be: !userTierIncludes(item.allowed_tiers)

  const handleClick = () => {
    if (onSelect) onSelect(item)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleBookmark(item.id)
  }

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
            onContextMenu={e => e.preventDefault()}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }} />
          </div>
        )}

        {/* Tier lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)', opacity: 0.6 }}>
            <Lock size={24} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        )}

        {/* Content type badge (top-left) */}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
          style={{
            backgroundColor: 'rgba(0,0,0,0.65)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
          }}
        >
          {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
        </span>

        {/* NEW badge (top-right alongside difficulty) */}
        <div className="absolute top-2 right-2 flex gap-1">
          {isNew && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              NEW
            </span>
          )}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: DIFFICULTY_COLORS[item.difficulty] || '#fff',
            }}
          >
            {item.difficulty}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3
          className="text-sm font-semibold leading-tight line-clamp-2"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {item.display_title}
        </h3>

        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {item.short_description}
        </p>

        {/* Progress bar */}
        {showProgress && item.progress_status === 'in_progress' && typeof item.progress_percent === 'number' && (
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${item.progress_percent}%`,
                backgroundColor: 'var(--color-btn-primary-bg)',
              }}
            />
          </div>
        )}

        {/* Bottom row: time + bookmark */}
        <div className="flex items-center justify-between mt-2">
          {item.estimated_minutes ? (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              ~{item.estimated_minutes}min
            </span>
          ) : <span />}
          <button
            onClick={handleBookmark}
            className="p-1 -mr-1 rounded-full transition-colors"
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {bookmarked ? (
              <BookmarkCheck size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
            ) : (
              <Bookmark size={14} style={{ color: 'var(--color-text-secondary)' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
