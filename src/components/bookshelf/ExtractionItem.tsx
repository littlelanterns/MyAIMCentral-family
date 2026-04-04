/**
 * Layer 3: ExtractionItem (PRD-23)
 * Generic wrapper for extraction items with heart, note, delete, Apply This actions.
 * Uses slot pattern for type-specific rendering.
 * Heart is optimistic — toggles immediately, no page refetch.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Heart, StickyNote, Trash2, Sparkles, Sparkle } from 'lucide-react'
import type { ExtractionType } from '@/lib/extractionActions'

/** Heart color uses the error semantic token (warm red) */
const HEART_COLOR = 'var(--color-error, #b25a58)'

interface ExtractionItemProps {
  id: string
  extractionType: ExtractionType
  text: string
  isHearted: boolean
  isKeyPoint: boolean
  isFromGoDeeper: boolean
  userNote: string | null
  sentIndicators?: ReactNode
  borderColorClass?: string
  isDeleting: boolean
  isEditing: boolean
  isNoting: boolean
  showApplyThis: boolean
  renderMeta?: () => ReactNode
  renderText?: () => ReactNode
  onHeart: (type: ExtractionType, id: string, hearted: boolean) => void
  onNoteToggle: (id: string | null) => void
  onNoteSave: (type: ExtractionType, id: string, note: string) => void
  onDelete: (type: ExtractionType, id: string) => void
  onApplyThisToggle: (id: string | null) => void
  applyThisContent?: ReactNode
}

export function ExtractionItem({
  id, extractionType, text, isHearted: propHearted, isKeyPoint, isFromGoDeeper, userNote,
  sentIndicators, borderColorClass = 'border-l-[var(--color-border-default)]',
  isDeleting, isNoting, showApplyThis,
  renderMeta, renderText, onHeart, onNoteToggle, onNoteSave,
  onDelete, onApplyThisToggle, applyThisContent,
}: ExtractionItemProps) {
  // Optimistic heart state — updates instantly, no page refetch needed
  const [localHearted, setLocalHearted] = useState(propHearted)
  const [heartPulse, setHeartPulse] = useState(false)
  const [noteText, setNoteText] = useState(userNote || '')
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // Sync with prop if parent data reloads
  useEffect(() => { setLocalHearted(propHearted) }, [propHearted])

  useEffect(() => {
    if (isNoting && noteRef.current) noteRef.current.focus()
  }, [isNoting])

  useEffect(() => { setNoteText(userNote || '') }, [userNote])

  const handleHeart = () => {
    const newValue = !localHearted
    setLocalHearted(newValue) // instant
    setHeartPulse(true)
    setTimeout(() => setHeartPulse(false), 300)
    onHeart(extractionType, id, localHearted) // fire DB update (background)
  }

  const handleNoteSave = () => {
    onNoteSave(extractionType, id, noteText)
  }

  return (
    <div
      className={`relative border-l-4 ${borderColorClass} rounded-lg p-3 transition-all duration-300
        ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100'}
      `}
      style={localHearted ? { backgroundColor: 'color-mix(in srgb, var(--color-error, #b25a58) 5%, transparent)' } : undefined}
    >
      {/* Go Deeper sparkle indicator */}
      {isFromGoDeeper && (
        <Sparkle
          size={14}
          className="absolute top-2 right-2"
          style={{ color: HEART_COLOR }}
          fill="currentColor"
        />
      )}

      {/* Meta line (type badge, content_type, etc.) */}
      {renderMeta && <div className="mb-1.5">{renderMeta()}</div>}

      {/* Main text */}
      <div className="text-sm text-[var(--color-text-primary)] leading-relaxed">
        {renderText ? renderText() : text}
      </div>

      {/* Sent indicators */}
      {sentIndicators && (
        <div className="mt-1.5 text-xs italic text-[var(--color-text-tertiary)]">
          {sentIndicators}
        </div>
      )}

      {/* Existing note display */}
      {userNote && !isNoting && (
        <div className="mt-2 px-2 py-1.5 rounded text-xs italic bg-[color-mix(in_srgb,var(--color-surface-tertiary)_60%,transparent)] text-[var(--color-text-secondary)]">
          {userNote}
        </div>
      )}

      {/* Note editing inline */}
      {isNoting && (
        <div className="mt-2">
          <textarea
            ref={noteRef}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onBlur={handleNoteSave}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setNoteText(userNote || '')
                onNoteToggle(null)
              }
            }}
            rows={2}
            placeholder="Add a note..."
            className="w-full px-2 py-1.5 text-xs rounded border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 mt-2">
        <button
          onClick={handleHeart}
          className={`p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] transition-transform duration-200 ${heartPulse ? 'scale-125' : 'scale-100'}`}
          title={localHearted ? 'Remove from hearted' : 'Heart this'}
        >
          <Heart
            size={16}
            style={localHearted ? { color: HEART_COLOR } : undefined}
            className={localHearted ? 'fill-current' : 'text-[var(--color-text-tertiary)]'}
          />
        </button>

        <button
          onClick={() => onNoteToggle(isNoting ? null : id)}
          className={`p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] ${isNoting ? 'bg-[var(--color-surface-tertiary)]' : ''}`}
          title="Add a note"
        >
          <StickyNote
            size={16}
            className={userNote ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}
          />
        </button>

        <button
          onClick={() => onDelete(extractionType, id)}
          className="p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)]"
          title="Remove"
        >
          <Trash2 size={16} className="text-[var(--color-text-tertiary)]" />
        </button>

        <button
          onClick={() => onApplyThisToggle(showApplyThis ? null : id)}
          className={`p-1.5 rounded-md hover:bg-[var(--color-surface-tertiary)] ${showApplyThis ? 'bg-[var(--color-surface-tertiary)]' : ''}`}
          title="Apply This"
        >
          <Sparkles size={16} className="text-[var(--color-text-tertiary)]" />
        </button>

        {isKeyPoint && (
          <span className="ml-auto text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)] opacity-60">
            Key point
          </span>
        )}
      </div>

      {/* Apply This sheet */}
      {showApplyThis && applyThisContent}
    </div>
  )
}
