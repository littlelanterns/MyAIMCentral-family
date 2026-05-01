/**
 * StudyGuideModal (PRD-23 — Reworked)
 * Generates Teen + Kid reading levels by backfilling guided_text and
 * independent_text columns on existing extraction rows via Sonnet.
 * No child picker, no detail level — family-wide, one-click generate.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Loader2, GraduationCap, Check, AlertTriangle, BookOpen } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'

interface StudyGuideModalProps {
  isOpen: boolean
  onClose: () => void
  bookshelfItemId: string
  bookTitle: string
  onComplete: () => void
  onNavigateToGuide?: (bookshelfItemId: string, audience: string) => void
}

interface GenerateResult {
  items_updated: number
  sections_processed: number
}

export function StudyGuideModal({
  isOpen, onClose, bookshelfItemId, bookTitle, onComplete, onNavigateToGuide,
}: StudyGuideModalProps) {
  const { data: currentMember } = useFamilyMember()
  const [generating, setGenerating] = useState(false)
  const [generatingPhase, setGeneratingPhase] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!currentMember) return
    setGenerating(true)
    setError(null)
    setResult(null)
    setGeneratingPhase('Reading book text and generating Teen + Kid versions...')

    phaseTimerRef.current = setTimeout(() => {
      setGeneratingPhase('Processing sections with Sonnet — this may take 1-3 minutes for longer books...')
    }, 5000)

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookshelf-study-guide`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookshelf_item_id: bookshelfItemId,
            family_id: currentMember.family_id,
            member_id: currentMember.id,
          }),
        },
      )

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        const errMsg = (data as { error?: string; message?: string }).error
          || (data as { error?: string; message?: string }).message
          || 'Failed to generate study guide'
        throw new Error(errMsg)
      }

      const data = await resp.json() as GenerateResult & { message?: string }

      if (data.items_updated === 0 && data.message) {
        setResult(data)
      } else if (data.items_updated === 0) {
        setError('No extractions needed updating. The book may already have Teen and Kid versions, or no extractions exist yet.')
      } else {
        setResult(data)
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate study guide')
    } finally {
      setGenerating(false)
      setGeneratingPhase(null)
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current)
        phaseTimerRef.current = null
      }
    }
  }, [currentMember, bookshelfItemId, onComplete])

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <ModalV2
      id="study-guide-modal"
      isOpen={isOpen}
      onClose={handleClose}
      title="Generate Study Guide"
      type="transient"
      size="sm"
    >
      <div className="p-4 space-y-4">
        {/* Book info */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <GraduationCap size={16} className="text-[var(--color-accent)]" />
          <span>
            Generate Teen and Kid reading levels for{' '}
            <strong className="text-[var(--color-text-primary)]">{bookTitle}</strong>
          </span>
        </div>

        {!result && !generating && !error && (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            This will read the book text and create age-adapted versions of every extraction.
            For longer books this may take 1-3 minutes. You can browse the Teen and Kid
            versions from the audience toggle on any book page.
          </p>
        )}

        {/* Generation progress */}
        {generating && generatingPhase && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-tertiary)]">
            <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">{generatingPhase}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-tertiary)]">
            <AlertTriangle size={16} className="text-[var(--color-error)] mt-0.5 shrink-0" />
            <span className="text-sm text-[var(--color-text-primary)]">{error}</span>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-tertiary)]">
              <Check size={16} className="text-green-600 shrink-0" />
              <span className="text-sm text-[var(--color-text-primary)]">
                {result.items_updated > 0
                  ? `Updated ${result.items_updated} items across ${result.sections_processed} sections`
                  : 'All items already have Teen and Kid versions'}
              </span>
            </div>
            {onNavigateToGuide && result.items_updated > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigateToGuide(bookshelfItemId, 'independent')}
                  className="flex items-center gap-2 flex-1 px-4 py-2.5 text-sm rounded-lg text-white justify-center"
                  style={{ background: 'var(--surface-primary)' }}
                >
                  <BookOpen size={14} />
                  View Teen Level
                </button>
                <button
                  onClick={() => onNavigateToGuide(bookshelfItemId, 'guided')}
                  className="flex items-center gap-2 flex-1 px-4 py-2.5 text-sm rounded-lg text-white justify-center"
                  style={{ background: 'var(--surface-primary)' }}
                >
                  <BookOpen size={14} />
                  View Kid Level
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
              style={{ background: 'var(--surface-primary)' }}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <GraduationCap size={14} />
                  Generate Study Guide
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </ModalV2>
  )
}
