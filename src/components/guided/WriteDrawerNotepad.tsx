/**
 * PRD-25 Phase B: WriteDrawerNotepad — Tab 1
 * Freeform text with voice input, spellcheck coaching, and "Send To..." routing.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Send, Sparkles, Eye } from 'lucide-react'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { SpellCheckOverlay, useSpellCheckOverlay } from './SpellCheckOverlay'
import { SendToGrid } from './SendToGrid'

interface WriteDrawerNotepadProps {
  familyId: string
  memberId: string
  content: string
  onContentChange: (content: string) => void
  onSent: () => void
  coachingEnabled: boolean
  readingSupport: boolean
}

export function WriteDrawerNotepad({
  familyId,
  memberId,
  content,
  onContentChange,
  onSent,
  coachingEnabled,
  readingSupport,
}: WriteDrawerNotepadProps) {
  const [showSendTo, setShowSendTo] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Voice input (reuse existing Whisper-primary hook)
  const voice = useVoiceInput()

  // Spellcheck coaching overlay
  const overlay = useSpellCheckOverlay(coachingEnabled)

  const handleVoiceToggle = useCallback(async () => {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) {
        const newContent = content ? content + '\n' + text : text
        onContentChange(newContent)
      }
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }, [voice, content, onContentChange])

  // Handle double-click/tap on a word to check spelling coaching
  const handleTextInteraction = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value

    // If a word is selected (double-click selects a word)
    if (start !== end) {
      const word = text.slice(start, end).trim()
      if (word.length >= 2) {
        const rect = textarea.getBoundingClientRect()
        // Approximate position based on character position
        const lineHeight = 28
        const charsPerLine = Math.floor(textarea.clientWidth / 10)
        const line = Math.floor(start / charsPerLine)
        const col = start % charsPerLine

        overlay.handleWordTap(word, word, {
          x: rect.left + col * 10,
          y: rect.top + line * lineHeight,
        })
      }
    } else {
      overlay.closeOverlay()
    }
  }, [overlay])

  // Persist content to sessionStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('guided-write-drawer-content', content)
    }, 500)
    return () => clearTimeout(timer)
  }, [content])

  if (showSendTo) {
    return (
      <SendToGrid
        content={content}
        familyId={familyId}
        memberId={memberId}
        onSent={onSent}
        onCancel={() => setShowSendTo(false)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* PRD-25 Phase C: Transparency indicator */}
      <p
        className="flex items-center gap-1.5 text-xs px-4 pt-2"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Eye size={12} />
        Your parent can see what you write
      </p>

      {/* Voice input interim preview */}
      {voice.state === 'recording' && voice.interimText && (
        <div
          className="px-3 py-2 text-sm italic"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          {voice.interimText}
        </div>
      )}

      {/* Main textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => onContentChange(e.target.value)}
          onDoubleClick={handleTextInteraction}
          placeholder="What's on your mind?"
          spellCheck
          className="w-full h-full p-4 resize-none focus:outline-none"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: readingSupport ? '20px' : '18px',
            lineHeight: readingSupport ? 1.8 : 1.6,
            border: 'none',
            minHeight: '200px',
          }}
          aria-label="Write something"
          autoFocus
        />
      </div>

      {/* Coaching tooltip overlay */}
      <SpellCheckOverlay
        coaching={overlay.coaching}
        position={overlay.position}
        isLoading={overlay.isLoading}
        readingSupport={readingSupport}
        onClose={overlay.closeOverlay}
      />

      {/* Character count */}
      {content.length > 100 && (
        <div className="px-4 pb-1 text-right">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {content.length} characters
          </span>
        </div>
      )}

      {/* Footer actions */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {/* Voice input button */}
          {voice.isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={voice.state === 'transcribing'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: voice.state === 'recording'
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: voice.state === 'recording'
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
                minHeight: readingSupport ? '52px' : '44px',
                transform: readingSupport ? 'scale(1.1)' : undefined,
              }}
              aria-label={voice.state === 'recording' ? 'Stop recording' : 'Start voice input'}
            >
              {voice.state === 'recording' ? (
                <>
                  <MicOff size={18} />
                  <span>{formatDuration(voice.duration)}</span>
                </>
              ) : voice.state === 'transcribing' ? (
                <span>Listening...</span>
              ) : (
                <>
                  <Mic size={18} />
                  {readingSupport && <span>Tap to Talk</span>}
                </>
              )}
            </button>
          )}

          {/* Check My Writing button — focuses textarea for double-tap coaching */}
          {coachingEnabled && content.trim() && (
            <button
              onClick={() => textareaRef.current?.focus()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                minHeight: '44px',
              }}
            >
              <Sparkles size={16} />
              <span>Check</span>
            </button>
          )}
        </div>

        {/* Send To button */}
        <button
          onClick={() => setShowSendTo(true)}
          disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: content.trim()
              ? 'var(--surface-primary, var(--color-btn-primary-bg))'
              : 'var(--color-bg-secondary)',
            color: content.trim()
              ? 'var(--color-btn-primary-text)'
              : 'var(--color-text-secondary)',
            minHeight: '44px',
          }}
        >
          <Send size={16} />
          <span>Send To...</span>
        </button>
      </div>
    </div>
  )
}
