/**
 * StudyGuideModal (PRD-23)
 * Generates age-adapted study guides from a book's key-point extractions.
 * Mom selects child + detail level → calls bookshelf-study-guide Edge Function.
 */
import { useState, useCallback } from 'react'
import { Loader2, GraduationCap, Check } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'

interface StudyGuideModalProps {
  isOpen: boolean
  onClose: () => void
  bookshelfItemId: string
  bookTitle: string
  onComplete: () => void
}

const DETAIL_LEVELS = [
  { value: 'brief', label: 'Brief', description: '1-2 sentences per item' },
  { value: 'standard', label: 'Standard', description: '2-3 sentences, clear explanations' },
  { value: 'detailed', label: 'Detailed', description: '3-4 sentences with examples' },
] as const

export function StudyGuideModal({
  isOpen, onClose, bookshelfItemId, bookTitle, onComplete,
}: StudyGuideModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(currentMember?.family_id)

  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [detailLevel, setDetailLevel] = useState<'brief' | 'standard' | 'detailed'>('standard')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ items_created: number; target_member: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAdult = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'

  // Mom/adults see children to pick from; children see "For myself" option
  const children = isAdult
    ? members.filter(m => m.role === 'member' && m.id !== currentMember?.id)
    : []

  // Auto-select self for non-adult members
  const [autoSelectedSelf] = useState(() => !isAdult ? currentMember?.id ?? null : null)
  const effectiveSelectedChild = isAdult ? selectedChild : (autoSelectedSelf || currentMember?.id || null)

  const handleGenerate = useCallback(async () => {
    if (!effectiveSelectedChild || !currentMember) return
    setGenerating(true)
    setError(null)
    setResult(null)

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
        throw new Error((data as { error?: string }).error || 'Failed to generate study guide')
      }

      const data = await resp.json() as { items_created: number; target_member: string }
      setResult(data)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate study guide')
    } finally {
      setGenerating(false)
    }
  }, [effectiveSelectedChild, currentMember, bookshelfItemId, detailLevel, onComplete])

  const handleClose = () => {
    setResult(null)
    setError(null)
    setSelectedChild(null)
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${selectedChild === child.id
                        ? 'text-white'
                        : 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                      }`}
                    style={selectedChild === child.id ? {
                      backgroundColor: child.assigned_color || 'var(--color-accent)',
                    } : {
                      borderColor: child.assigned_color || undefined,
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

        {/* Error */}
        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}

        {/* Success */}
        {result && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-tertiary)]">
            <Check size={16} className="text-green-600" />
            <span className="text-sm text-[var(--color-text-primary)]">
              Created {result.items_created} study guide items for {result.target_member}
            </span>
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
