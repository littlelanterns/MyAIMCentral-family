/**
 * PRD-25 Phase B: WriteDrawerReflections — Tab 3
 * Today's reflection prompts as cards, using existing useReflections hooks.
 * Visible only when reflections_in_drawer = true in Guided preferences.
 */

import { useState, useCallback } from 'react'
import { Check, Edit3, Volume2, Eye } from 'lucide-react'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { speak } from '@/utils/speak'
import {
  useReflectionPrompts,
  useTodaysResponses,
  useSaveResponse,
  useUpdateResponse,
} from '@/hooks/useReflections'
import type { ReflectionCategory, ReflectionPrompt, ReflectionResponse } from '@/hooks/useReflections'

interface WriteDrawerReflectionsProps {
  familyId: string
  memberId: string
  readingSupport: boolean
  dailyCount: number
}

export function WriteDrawerReflections({
  familyId,
  memberId,
  readingSupport,
  dailyCount,
}: WriteDrawerReflectionsProps) {
  const { data: prompts = [], isLoading: loadingPrompts } = useReflectionPrompts(familyId, memberId)
  const { data: todaysResponses = [], isLoading: loadingResponses } = useTodaysResponses(familyId, memberId)
  const saveResponse = useSaveResponse()
  const updateResponse = useUpdateResponse()

  const answeredCount = todaysResponses.length
  const responseByPrompt = new Map(todaysResponses.map(r => [r.prompt_id, r]))

  // Limit prompts to daily count
  const visiblePrompts = prompts.slice(0, dailyCount)

  if (loadingPrompts || loadingResponses) {
    return <p className="text-sm py-4 px-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
  }

  if (visiblePrompts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No reflection prompts set up yet. Ask your parent to add some!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {/* PRD-25 Phase C: Transparency indicator */}
      <p
        className="flex items-center gap-1.5 text-xs px-1"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Eye size={12} />
        Your parent can see your reflections
      </p>

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          You've reflected on {answeredCount} of {visiblePrompts.length} today
        </p>
        {readingSupport && (
          <ReadAloudButton text={`You've reflected on ${answeredCount} of ${visiblePrompts.length} today`} />
        )}
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${visiblePrompts.length > 0 ? (answeredCount / visiblePrompts.length) * 100 : 0}%`,
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
          }}
        />
      </div>

      {/* Prompt cards */}
      {visiblePrompts.map(prompt => (
        <ReflectionCard
          key={prompt.id}
          prompt={prompt}
          response={responseByPrompt.get(prompt.id)}
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
          onSave={saveResponse.mutateAsync}
          onUpdate={updateResponse.mutateAsync}
        />
      ))}
    </div>
  )
}

// ─── Individual Reflection Card ──────────────────────────────

interface ReflectionCardProps {
  prompt: ReflectionPrompt
  response?: ReflectionResponse
  familyId: string
  memberId: string
  readingSupport: boolean
  onSave: (params: {
    familyId: string
    memberId: string
    promptId: string
    responseText: string
    promptText: string
    category: ReflectionCategory
  }) => Promise<unknown>
  onUpdate: (params: {
    id: string
    memberId: string
    responseText: string
    journalEntryId: string | null
    promptText: string
    category: ReflectionCategory
  }) => Promise<unknown>
}

function ReflectionCard({
  prompt,
  response,
  familyId,
  memberId,
  readingSupport,
  onSave,
  onUpdate,
}: ReflectionCardProps) {
  const [editing, setEditing] = useState(!response)
  const [text, setText] = useState(response?.response_text || '')
  const [saving, setSaving] = useState(false)

  const handleVoiceTranscript = useCallback((text: string) => {
    setText(prev => prev ? prev + ' ' + text : text)
  }, [])

  const handleSave = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      if (response) {
        await onUpdate({
          id: response.id,
          memberId,
          responseText: text.trim(),
          journalEntryId: response.journal_entry_id ?? null,
          promptText: prompt.prompt_text,
          category: prompt.category,
        })
      } else {
        await onSave({
          familyId,
          memberId,
          promptId: prompt.id,
          responseText: text.trim(),
          promptText: prompt.prompt_text,
          category: prompt.category,
        })
      }
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [text, response, familyId, memberId, prompt, onSave, onUpdate])

  return (
    <div
      className="rounded-lg p-4 space-y-2"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Question text */}
      <div className="flex items-start gap-2">
        <p
          className="text-sm font-medium flex-1"
          style={{
            color: 'var(--color-text-heading)',
            fontSize: readingSupport ? '16px' : '14px',
          }}
        >
          {prompt.prompt_text}
        </p>
        {readingSupport && <ReadAloudButton text={prompt.prompt_text} />}
      </div>

      {/* Answer area */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full p-3 rounded-lg resize-none focus:outline-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              fontSize: readingSupport ? '16px' : '14px',
              lineHeight: readingSupport ? 1.8 : 1.6,
              minHeight: '80px',
            }}
          />
          <div className="flex items-center gap-2">
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              minHeight={36}
              buttonClassName="px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ml-auto"
              style={{
                backgroundColor: text.trim()
                  ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                  : 'var(--color-bg-secondary)',
                color: text.trim()
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-secondary)',
                minHeight: '36px',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : response ? (
        <div className="flex items-start gap-2">
          <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
            {response.response_text}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-full flex-shrink-0"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            aria-label="Edit response"
          >
            <Edit3 size={14} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ─── TTS Button ──────────────────────────────────────────────

function ReadAloudButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => speak(text, 0.85)}
      className="p-1 rounded-full shrink-0"
      style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      aria-label="Read aloud"
    >
      <Volume2 size={16} />
    </button>
  )
}
