import { useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { Toast } from '@/components/shared'
import { ReflectionQuestionCard } from './ReflectionQuestionCard'
import {
  useReflectionPrompts,
  useTodaysResponses,
  useSaveResponse,
  useUpdateResponse,
} from '@/hooks/useReflections'
import type { ReflectionCategory } from '@/hooks/useReflections'

interface ReflectionsTodayTabProps {
  familyId: string
  memberId: string
}

export function ReflectionsTodayTab({ familyId, memberId }: ReflectionsTodayTabProps) {
  const { data: prompts = [], isLoading: loadingPrompts } = useReflectionPrompts(familyId, memberId)
  const { data: todaysResponses = [], isLoading: loadingResponses } = useTodaysResponses(familyId, memberId)
  const saveResponse = useSaveResponse()
  const updateResponse = useUpdateResponse()

  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const answeredCount = todaysResponses.length

  const handleSave = useCallback(async (
    promptId: string,
    text: string,
    promptText: string,
    category: ReflectionCategory,
  ) => {
    await saveResponse.mutateAsync({ familyId, memberId, promptId, responseText: text, promptText, category })
  }, [familyId, memberId, saveResponse])

  const handleUpdate = useCallback(async (
    responseId: string,
    text: string,
    journalEntryId: string | null,
    promptText: string,
    category: ReflectionCategory,
  ) => {
    await updateResponse.mutateAsync({ id: responseId, memberId, responseText: text, journalEntryId, promptText, category })
  }, [memberId, updateResponse])

  const handleRoute = useCallback(() => {
    setToastMsg('Victory Recorder coming soon')
  }, [])

  if (loadingPrompts || loadingResponses) {
    return <p className="text-sm py-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
  }

  if (prompts.length === 0) {
    return (
      <div
        className="p-8 rounded-lg text-center"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No reflection prompts yet. Check the Manage tab to set up your questions.
        </p>
      </div>
    )
  }

  // Build a lookup for today's responses by prompt_id
  const responseByPrompt = new Map(todaysResponses.map(r => [r.prompt_id, r]))

  return (
    <div className="space-y-3">
      {prompts.map(prompt => (
        <ReflectionQuestionCard
          key={prompt.id}
          prompt={prompt}
          response={responseByPrompt.get(prompt.id)}
          onSave={handleSave}
          onUpdate={handleUpdate}
          onRoute={handleRoute}
          saving={saveResponse.isPending || updateResponse.isPending}
        />
      ))}

      {/* Soft progress */}
      <p
        className="text-center text-xs pt-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Reflected on {answeredCount} today
      </p>

      {toastMsg && (
        <Toast variant="info" message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  )
}
