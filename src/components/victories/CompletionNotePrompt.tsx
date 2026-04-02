// PRD-11 Phase 12B: CompletionNotePrompt
// Non-blocking toast that appears when a task is marked complete.
// Auto-dismisses after 8 seconds. Expands to textarea on tap.
// Enriches activity log data for the Haiku victory scan.

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageSquare, Send } from 'lucide-react'

interface CompletionNotePromptProps {
  taskTitle: string
  taskId: string
  onSaveNote: (taskId: string, note: string) => void
  onDismiss: () => void
}

export function CompletionNotePrompt({
  taskTitle,
  taskId,
  onSaveNote,
  onDismiss,
}: CompletionNotePromptProps) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [dismissing, setDismissing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-dismiss after 8 seconds (only when not expanded)
  useEffect(() => {
    if (!expanded) {
      timerRef.current = setTimeout(() => {
        setDismissing(true)
        setTimeout(onDismiss, 300) // fade-out animation
      }, 8000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [expanded, onDismiss])

  const handleExpand = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setExpanded(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  const handleSave = useCallback(() => {
    if (note.trim()) {
      onSaveNote(taskId, note.trim())
    }
    onDismiss()
  }, [note, taskId, onSaveNote, onDismiss])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }, [handleSave])

  return (
    <div
      className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 max-w-sm w-full rounded-xl shadow-xl transition-all duration-300 ${
        dismissing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        background: 'var(--color-surface-secondary, var(--color-bg-secondary))',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <MessageSquare size={16} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {taskTitle}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        </button>
      </div>

      {expanded ? (
        /* Expanded: textarea + save */
        <div className="px-4 pb-3 space-y-2">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How did it go? Any thoughts worth keeping?"
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none"
            style={{
              background: 'var(--color-surface-primary, var(--color-bg-primary))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onDismiss}
              className="text-xs px-3 py-1.5 rounded-md transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{
                background: 'var(--color-sparkle-gold, #D4AF37)',
                color: '#fff',
              }}
            >
              <Send size={12} />
              Save
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed: tap to expand */
        <button
          onClick={handleExpand}
          className="w-full px-4 pb-3 text-left"
        >
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Add a note?
          </span>
          {/* Progress bar showing auto-dismiss countdown */}
          <div
            className="mt-2 h-0.5 rounded-full overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--color-border-default) 30%, transparent)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: 'var(--color-sparkle-gold, #D4AF37)',
                animation: 'completionNoteCountdown 8s linear forwards',
              }}
            />
          </div>
        </button>
      )}

      {/* Countdown animation keyframes */}
      <style>{`
        @keyframes completionNoteCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
