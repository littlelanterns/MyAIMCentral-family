import { useEffect, useState } from 'react'
import { X, Bookmark, BookmarkCheck, Sparkles, ArrowLeft, Plus } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useVaultDetail } from '../hooks/useVaultDetail'
import { useVaultBookmarks } from '../hooks/useVaultBookmarks'
import type { VaultItem } from '../hooks/useVaultBrowse'
import { TutorialDetail } from './detail/TutorialDetail'
import { AIToolDetail } from './detail/AIToolDetail'
import { PromptPackDetail } from './detail/PromptPackDetail'
import { CurationDetail } from './detail/CurationDetail'
import { WorkflowDetail } from './detail/WorkflowDetail'
import { SkillDetail } from './detail/SkillDetail'
import { MemberAssignmentModal } from './MemberAssignmentModal'

interface Props {
  itemId: string | null
  memberId: string | null
  onClose: () => void
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

/**
 * VaultDetailView (PRD-21A Screen 2).
 * Desktop: large modal overlay (doesn't navigate away from browse).
 * Mobile: full-screen view with back button.
 */
export function VaultDetailView({ itemId, memberId, onClose }: Props) {
  const { item, promptEntries, collectionItems, loading, updateProgress } = useVaultDetail(itemId, memberId)
  const { isBookmarked, toggleBookmark } = useVaultBookmarks(memberId)
  const [isMobile, setIsMobile] = useState(false)
  const [showToolboxModal, setShowToolboxModal] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!itemId) return null

  const bookmarked = item ? isBookmarked(item.id) : false

  const renderContent = () => {
    if (loading || !item) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-btn-primary-bg)' }} />
        </div>
      )
    }

    switch (item.content_type) {
      case 'tutorial':
        return <TutorialDetail item={item} memberId={memberId} updateProgress={updateProgress} />
      case 'ai_tool':
        return <AIToolDetail item={item} memberId={memberId} />
      case 'prompt_pack':
        return <PromptPackDetail item={item} entries={promptEntries} memberId={memberId} />
      case 'curation':
        return <CurationDetail item={item} children={collectionItems} memberId={memberId} />
      case 'workflow':
        return <WorkflowDetail item={item} memberId={memberId} />
      case 'skill':
        return <SkillDetail item={item} memberId={memberId} />
      default:
        return <p style={{ color: 'var(--color-text-secondary)' }}>Unknown content type</p>
    }
  }

  // Header bar
  const header = item ? (
    <div className="flex items-start gap-3 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
      {isMobile && (
        <button onClick={onClose} className="p-1 -ml-1 shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
          >
            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-medium"
            style={{ color: DIFFICULTY_COLORS[item.difficulty] || 'var(--color-text-secondary)' }}
          >
            {item.difficulty}
          </span>
          {item.estimated_minutes && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              ~{item.estimated_minutes}min
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-heading)' }}>
          {item.detail_title || item.display_title}
        </h2>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* +Add to AI Toolbox — only for ai_tool and skill types (PRD-21A) */}
        {(item.content_type === 'ai_tool' || item.content_type === 'skill') && (
          <button
            onClick={() => setShowToolboxModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            title="Add to AI Toolbox"
          >
            <Plus size={12} /> Toolbox
          </button>
        )}
        <button
          onClick={() => toggleBookmark(item.id)}
          className="p-1.5 rounded-full"
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          style={{ color: bookmarked ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
        >
          {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
        {!isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  ) : null

  const toolboxModal = (
    <MemberAssignmentModal
      open={showToolboxModal}
      onClose={() => setShowToolboxModal(false)}
      item={item}
    />
  )

  // Mobile: full-screen
  if (isMobile) {
    return createPortal(
      <>
        <div
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          {header}
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
        {toolboxModal}
      </>,
      document.body,
    )
  }

  // Desktop: modal overlay
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-8 lg:inset-y-8 lg:left-[10%] lg:right-[10%] z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {header}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
      {toolboxModal}
    </>,
    document.body,
  )
}
