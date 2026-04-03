/**
 * BookDiscussionModal (PRD-23)
 * Full-featured modal for discussing books with LiLa.
 * Supports audience switching, discussion history, action chips, copy.
 * Uses ModalV2 persistent type for minimization.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Send, Copy, Clock, Trash2, MessageSquare, Target, HelpCircle, CheckSquare, BarChart3, Users } from 'lucide-react'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useBookDiscussions } from '@/hooks/useBookDiscussions'
import type { DiscussionType, DiscussionAudience, BookShelfDiscussion } from '@/types/bookshelf'

const DISCUSSION_TYPE_LABELS: Record<DiscussionType, string> = {
  discuss: 'Open Discussion',
  generate_goals: 'Generate Goals',
  generate_questions: 'Generate Questions',
  generate_tasks: 'Generate Tasks',
  generate_tracker: 'Tracker Ideas',
}

const AUDIENCE_LABELS: Record<DiscussionAudience, string> = {
  personal: 'Personal',
  family: 'Family',
  teen: 'Teen',
  spouse: 'Spouse',
  children: 'Children',
}

const DISCUSSION_TYPE_ICONS: Record<DiscussionType, typeof MessageSquare> = {
  discuss: MessageSquare,
  generate_goals: Target,
  generate_questions: HelpCircle,
  generate_tasks: CheckSquare,
  generate_tracker: BarChart3,
}

interface BookDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  bookTitles: string[]
  bookshelfItemIds: string[]
  discussionType?: DiscussionType
  initialAudience?: DiscussionAudience
  existingDiscussionId?: string
  /** Map of bookshelf_item_id → title for history display */
  bookTitleMap?: Record<string, string>
}

export function BookDiscussionModal({
  isOpen, onClose, bookTitles, bookshelfItemIds,
  discussionType = 'discuss', initialAudience = 'personal',
  existingDiscussionId, bookTitleMap,
}: BookDiscussionModalProps) {
  const {
    discussions, activeDiscussion, messages, loading, sending, error,
    fetchDiscussions, startDiscussion, sendMessage, continueDiscussion,
    updateAudience, copyToClipboard, deleteDiscussion, closeDiscussion,
  } = useBookDiscussions()

  const [audience, setAudience] = useState<DiscussionAudience>(initialAudience)
  const [inputText, setInputText] = useState('')
  const [started, setStarted] = useState(!!existingDiscussionId)
  const [showHistory, setShowHistory] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleVoiceTranscript = useCallback((text: string) => {
    setInputText(prev => prev ? prev + ' ' + text : text)
  }, [])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  // Fetch discussions on mount
  useEffect(() => {
    if (isOpen) fetchDiscussions()
  }, [isOpen, fetchDiscussions])

  // Load existing discussion
  useEffect(() => {
    if (existingDiscussionId && isOpen) {
      setStarted(true)
      continueDiscussion(existingDiscussionId)
    }
  }, [existingDiscussionId, isOpen, continueDiscussion])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Close history on outside click
  useEffect(() => {
    if (!showHistory) return
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showHistory])

  const handleBegin = useCallback(() => {
    setStarted(true)
    startDiscussion(bookshelfItemIds, discussionType, audience)
  }, [bookshelfItemIds, discussionType, audience, startDiscussion])

  const handleSend = useCallback(async () => {
    if (!activeDiscussion || !inputText.trim() || sending) return
    const content = inputText.trim()
    setInputText('')
    await sendMessage(activeDiscussion.id, content)
    inputRef.current?.focus()
  }, [activeDiscussion, inputText, sending, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleAudienceChange = useCallback((newAudience: DiscussionAudience) => {
    setAudience(newAudience)
    if (activeDiscussion) {
      updateAudience(activeDiscussion.id, newAudience)
    }
  }, [activeDiscussion, updateAudience])

  const handleCopyAll = useCallback(async () => {
    await copyToClipboard()
    setToast('Copied to clipboard')
    setTimeout(() => setToast(null), 2500)
  }, [copyToClipboard])

  const handleSwitchDiscussion = useCallback((disc: BookShelfDiscussion) => {
    setAudience(disc.audience)
    setStarted(true)
    continueDiscussion(disc.id)
    setShowHistory(false)
  }, [continueDiscussion])

  const handleDeleteDiscussion = useCallback(async (id: string) => {
    await deleteDiscussion(id)
  }, [deleteDiscussion])

  const handleClose = useCallback(() => {
    closeDiscussion()
    setStarted(false)
    setInputText('')
    setShowHistory(false)
    onClose()
  }, [closeDiscussion, onClose])

  const TypeIcon = DISCUSSION_TYPE_ICONS[discussionType]
  const titleText = bookTitles.length === 1 ? bookTitles[0] : `${bookTitles.length} Books`

  // Filter history to relevant discussions (or show all)
  const historyDiscussions = useMemo(() => discussions, [discussions])

  return (
    <ModalV2
      id="book-discussion-modal"
      isOpen={isOpen}
      onClose={handleClose}
      title={titleText}
      type="persistent"
      size="lg"
    >
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        {/* Header controls */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border-default)] shrink-0">
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]">
            <TypeIcon size={11} />
            {DISCUSSION_TYPE_LABELS[discussionType]}
          </span>

          <select
            className="text-xs px-2 py-1 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)]"
            value={audience}
            onChange={e => handleAudienceChange(e.target.value as DiscussionAudience)}
          >
            {(Object.entries(AUDIENCE_LABELS) as [DiscussionAudience, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <div className="flex-1" />

          {/* History button */}
          {historyDiscussions.length > 0 && (
            <div className="relative" ref={historyRef}>
              <button
                type="button"
                onClick={() => setShowHistory(v => !v)}
                className="p-1.5 rounded hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]"
                title="Past discussions"
              >
                <Clock size={16} />
              </button>
              {showHistory && (
                <div className="absolute right-0 top-full mt-1 z-50 w-72 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] shadow-lg">
                  <div className="sticky top-0 px-3 py-2 text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]">
                    Past Discussions
                  </div>
                  {historyDiscussions.map(disc => {
                    const isCurrent = disc.id === activeDiscussion?.id
                    const bookNames = bookTitleMap
                      ? disc.bookshelf_item_ids.map(id => bookTitleMap[id] || 'Unknown').join(', ')
                      : null
                    return (
                      <div key={disc.id} className={`flex items-center gap-1 px-3 py-2 border-b border-[var(--color-border-default)] last:border-b-0 ${isCurrent ? 'bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]' : 'hover:bg-[var(--color-surface-secondary)]'}`}>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleSwitchDiscussion(disc)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                            {disc.title || 'Untitled'}
                          </div>
                          {bookNames && (
                            <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{bookNames}</div>
                          )}
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">
                            {AUDIENCE_LABELS[disc.audience]} · {new Date(disc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleDeleteDiscussion(disc.id) }}
                            className="p-1 rounded hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] shrink-0"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && (
            <div className="text-center text-sm text-[var(--color-text-tertiary)] py-8">Loading conversation...</div>
          )}

          {!loading && !started && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Users size={32} className="text-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs">
                Choose your audience and discussion type, then begin. LiLa will tailor the conversation accordingly.
              </p>
              <button
                type="button"
                onClick={handleBegin}
                className="px-6 py-2 rounded-lg text-sm font-medium text-[var(--color-text-on-primary)] bg-[var(--surface-primary)]"
              >
                Begin Discussion
              </button>
            </div>
          )}

          {!loading && started && messages.length === 0 && !sending && !error && (
            <div
              className="rounded-xl px-4 py-3 text-sm space-y-2 mx-auto max-w-md"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <p>Ask a question about {bookTitles.length === 1
                ? `"${bookTitles[0]}"`
                : bookTitles.map(t => `"${t}"`).join(', ')
              } and LiLa will draw from the content to answer.</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Try something like: <span className="italic">&ldquo;What are the main ideas in {bookTitles.length === 1 ? 'this book' : 'these books'}?&rdquo;</span>
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`text-sm leading-relaxed whitespace-pre-wrap rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] ml-8 text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-surface-secondary)] mr-8 text-[var(--color-text-primary)]'
              }`}
            >
              {msg.content}
            </div>
          ))}

          {sending && (
            <div className="flex gap-1 px-3 py-2 mr-8">
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-xs text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 border-t border-[var(--color-border-default)] px-4 py-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              disabled={sending || !activeDiscussion}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
            />
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={sending || !activeDiscussion}
              size={16}
              label={false}
              showInterim={false}
              buttonClassName="p-2"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !inputText.trim() || !activeDiscussion}
              className="p-2 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={messages.length === 0}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] disabled:opacity-40"
            >
              <Copy size={10} />
              Copy All
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[var(--color-surface-tertiary)] text-xs text-[var(--color-text-primary)] shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </ModalV2>
  )
}
