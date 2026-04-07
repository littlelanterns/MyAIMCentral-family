import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil, Route } from 'lucide-react'
import type { ReflectionPrompt, ReflectionResponse, ReflectionCategory } from '@/hooks/useReflections'
import { REFLECTION_CATEGORIES } from '@/hooks/useReflections'

interface ReflectionQuestionCardProps {
  prompt: ReflectionPrompt
  response: ReflectionResponse | undefined
  onSave: (promptId: string, text: string, promptText: string, category: ReflectionCategory) => Promise<void>
  onUpdate: (responseId: string, text: string, journalEntryId: string | null, promptText: string, category: ReflectionCategory) => Promise<void>
  onRoute: () => void
  saving?: boolean
}

export function ReflectionQuestionCard({
  prompt,
  response,
  onSave,
  onUpdate,
  onRoute,
  saving,
}: ReflectionQuestionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isAnswered = !!response
  const categoryLabel = REFLECTION_CATEGORIES.find(c => c.value === prompt.category)?.label ?? prompt.category

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [expanded])

  function handleExpand() {
    if (!isAnswered) {
      setExpanded(!expanded)
      setText('')
    } else {
      setExpanded(!expanded)
    }
  }

  function handleStartEdit() {
    if (response) {
      setText(response.response_text)
      setEditing(true)
    }
  }

  async function handleSave() {
    if (!text.trim()) return
    if (editing && response) {
      await onUpdate(response.id, text.trim(), response.journal_entry_id, prompt.prompt_text, prompt.category)
      setEditing(false)
    } else {
      await onSave(prompt.id, text.trim(), prompt.prompt_text, prompt.category)
    }
    setText('')
    setExpanded(false)
  }

  return (
    <div
      className="rounded-lg transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${isAnswered ? 'var(--color-success, #4b7c66)' : 'var(--color-border)'}`,
      }}
    >
      {/* Header row */}
      <button
        onClick={handleExpand}
        className="w-full text-left p-4 flex items-start gap-3"
        style={{ minHeight: 'unset' }}
      >
        {/* Status indicator */}
        <span
          className="mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: isAnswered
              ? 'var(--color-success, #4b7c66)'
              : 'var(--color-bg-secondary)',
          }}
        >
          {isAnswered && <Check size={12} style={{ color: '#fff' }} />}
        </span>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {prompt.prompt_text}
          </p>
          <span
            className="text-xs mt-1 inline-block px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {expanded
          ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
          : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {isAnswered && !editing ? (
            <>
              <p
                className="text-sm whitespace-pre-wrap pl-8"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {response.response_text}
              </p>
              <div className="flex gap-2 pl-8">
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  onClick={onRoute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <Route size={12} />
                  Route
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write your reflection..."
                rows={3}
                className="w-full rounded-lg p-3 text-sm resize-y"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
              />
              <div className="flex gap-2 justify-end">
                {editing && (
                  <button
                    onClick={() => { setEditing(false); setText('') }}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!text.trim() || saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{
                    background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Save')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
