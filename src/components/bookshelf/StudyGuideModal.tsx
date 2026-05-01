/**
 * StudyGuideModal (PRD-23)
 * Generates age-adapted study guides from a book's key-point extractions.
 * Mom selects child + detail level → calls bookshelf-study-guide Edge Function.
 * View As aware: when mom views as a child, auto-targets that child.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, GraduationCap, Check, AlertTriangle, BookOpen } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/memberColors'

interface StudyGuideModalProps {
  isOpen: boolean
  onClose: () => void
  bookshelfItemId: string
  bookTitle: string
  /** When View As is active, pre-select this child */
  viewAsTargetId?: string
  onComplete: () => void
  onNavigateToGuide?: (bookshelfItemId: string, audienceKey: string) => void
}

interface GenerateResult {
  items_created: number
  target_member: string
  audience_key: string
}

const DETAIL_LEVELS = [
  { value: 'brief', label: 'Brief', description: '1-2 sentences per item' },
  { value: 'standard', label: 'Standard', description: '2-3 sentences, clear explanations' },
  { value: 'detailed', label: 'Detailed', description: '3-4 sentences with examples' },
] as const

export function StudyGuideModal({
  isOpen, onClose, bookshelfItemId, bookTitle, viewAsTargetId, onComplete, onNavigateToGuide,
}: StudyGuideModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(currentMember?.family_id)

  const [selectedChild, setSelectedChild] = useState<string | null>(viewAsTargetId ?? null)
  const [detailLevel, setDetailLevel] = useState<'brief' | 'standard' | 'detailed'>('standard')
  const [generating, setGenerating] = useState(false)
  const [generatingPhase, setGeneratingPhase] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAdult = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'

  const children = isAdult
    ? members.filter(m => m.role === 'member' && m.id !== currentMember?.id)
    : []

  const autoSelectedSelf = !isAdult ? currentMember?.id ?? null : null
  const effectiveSelectedChild = isAdult ? selectedChild : (autoSelectedSelf || currentMember?.id || null)

  useEffect(() => {
    if (viewAsTargetId && isAdult) {
      setSelectedChild(viewAsTargetId)
    }
  }, [viewAsTargetId, isAdult])

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
    }
  }, [])

  const selectedChildName = effectiveSelectedChild
    ? members.find(m => m.id === effectiveSelectedChild)?.display_name ?? 'this child'
    : ''

  const handleGenerate = useCallback(async () => {
    if (!effectiveSelectedChild || !currentMember) return
    setGenerating(true)
    setError(null)
    setResult(null)
    setGeneratingPhase(`Generating study guide for ${selectedChildName}...`)

    phaseTimerRef.current = setTimeout(() => {
      setGeneratingPhase('This usually takes 15-30 seconds...')
    }, 3000)

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
            target_member_id: effectiveSelectedChild,
            family_id: currentMember.family_id,
            member_id: currentMember.id,
            detail_level: detailLevel,
          }),
        }
      )

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        const errMsg = (data as { error?: string; message?: string }).error
          || (data as { error?: string; message?: string }).message
          || 'Failed to generate study guide'
        throw new Error(errMsg)
      }

      const data = await resp.json() as GenerateResult

      if (data.items_created === 0) {
        setError('No key points found for this book. Try running Go Deeper first to mark important passages.')
        return
      }

      setResult(data)
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
  }, [effectiveSelectedChild, currentMember, bookshelfItemId, detailLevel, onComplete, selectedChildName])

  const handleClose = () => {
    setResult(null)
    setError(null)
    setSelectedChild(viewAsTargetId ?? null)
    setDetailLevel('standard')
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
          <span>Create an age-adapted version of <strong className="text-[var(--color-text-primary)]">{bookTitle}</strong></span>
        </div>

        {/* Child picker — only shown for adults; children auto-target themselves */}
        {isAdult ? (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
              For which child?
            </label>
            {children.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                No child members in this family yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    disabled={generating}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${selectedChild === child.id
                        ? 'text-white'
                        : 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                      }`}
                    style={selectedChild === child.id ? {
                      backgroundColor: getMemberColor(child),
                    } : {
                      borderColor: getMemberColor(child),
                    }}
                  >
                    {child.display_name}
                    {child.age ? ` (${child.age})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            This will create a simplified version of the book&apos;s key points just for you.
          </p>
        )}

        {/* Detail level */}
        {!result && (
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
              Detail level
            </label>
            <div className="space-y-1.5">
              {DETAIL_LEVELS.map(level => (
                <label
                  key={level.value}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                    ${detailLevel === level.value
                      ? 'bg-[var(--color-surface-tertiary)]'
                      : 'hover:bg-[var(--color-surface-secondary)]'
                    }`}
                >
                  <input
                    type="radio"
                    name="detail_level"
                    value={level.value}
                    checked={detailLevel === level.value}
                    onChange={() => setDetailLevel(level.value)}
                    disabled={generating}
                    className="accent-[var(--color-accent)]"
                  />
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{level.label}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{level.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
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
                Created {result.items_created} study guide items for {result.target_member}
              </span>
            </div>
            {onNavigateToGuide && (
              <button
                onClick={() => onNavigateToGuide(bookshelfItemId, result.audience_key)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm rounded-lg text-white justify-center"
                style={{ background: 'var(--surface-primary)' }}
              >
                <BookOpen size={14} />
                View Study Guide
              </button>
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
              disabled={!effectiveSelectedChild || generating}
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
