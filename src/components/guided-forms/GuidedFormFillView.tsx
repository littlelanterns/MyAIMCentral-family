/**
 * GuidedFormFillView (PRD-09B, specs/studio-seed-templates.md)
 *
 * What the child sees when completing an assigned guided form:
 * - Full-screen form, one section at a time
 * - Mom's sections shown as read-only context
 * - Child's sections are editable
 * - [Next] / [Back] navigation
 * - LiLa help button per section when enabled
 * - [Submit] when all child sections filled
 * - Print button for paper worksheet
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ArrowLeft, ArrowRight, Printer, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { GuidedFormSectionEditor } from './GuidedFormSectionEditor'
import { getSectionsForSubtype, getSubtypeLabel } from './guidedFormTypes'
import type { GuidedFormTemplate, GuidedFormResponseMap } from './guidedFormTypes'
import { supabase } from '@/lib/supabase/client'

// ─── Props ────────────────────────────────────────────────────────

interface GuidedFormFillViewProps {
  open: boolean
  onClose: () => void
  template: GuidedFormTemplate
  taskId: string
  childMemberId: string
  /** Pre-loaded responses keyed by section_key */
  initialResponses: GuidedFormResponseMap
  /** Whether mom allowed LiLa help for this assignment */
  lilaEnabled: boolean
  onSubmitted?: () => void
}

// ─── Component ───────────────────────────────────────────────────

export function GuidedFormFillView({
  open,
  onClose,
  template,
  taskId,
  childMemberId,
  initialResponses,
  lilaEnabled,
  onSubmitted,
}: GuidedFormFillViewProps) {
  const subtype = template.guided_form_subtype
  const sections = subtype === 'custom'
    ? (template.config?.sections ?? [])
    : getSectionsForSubtype(subtype)

  // Track editable values for child sections
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    sections.forEach(s => {
      initial[s.key] = initialResponses[s.key]?.section_content ?? ''
    })
    return initial
  })

  const [currentIdx, setCurrentIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSection = sections[currentIdx]

  // Child sections that must be filled before submitting
  const childSections = useMemo(
    () => sections.filter(s => s.filledBy === 'child'),
    [sections]
  )

  const completedChildCount = childSections.filter(
    s => (values[s.key] ?? '').trim().length > 0
  ).length

  const allChildFilled = completedChildCount === childSections.length

  const canGoNext = currentIdx < sections.length - 1
  const canGoBack = currentIdx > 0

  const handleSubmit = useCallback(async () => {
    setError(null)
    setSubmitting(true)

    try {
      const now = new Date().toISOString()

      // Update guided_form_responses for child's sections
      const updates = childSections.map(section => ({
        task_id: taskId,
        family_member_id: childMemberId,
        section_key: section.key,
        section_content: values[section.key] ?? '',
        filled_by: 'child' as const,
        completed_at: now,
      }))

      for (const row of updates) {
        const { error: upsertError } = await supabase
          .from('guided_form_responses')
          .upsert(
            { ...row },
            { onConflict: 'task_id,section_key' }
          )
        if (upsertError) throw upsertError
      }

      // Mark the task as completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)

      if (taskError) throw taskError

      setSubmitted(true)
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [taskId, childMemberId, childSections, values, onSubmitted])

  const handlePrint = () => {
    window.print()
  }

  // Auto-save child value to DB on blur (best-effort)
  const handleSectionBlur = useCallback(async (sectionKey: string) => {
    if (currentSection?.filledBy !== 'child') return
    const content = values[sectionKey] ?? ''
    if (!content.trim()) return

    await supabase
      .from('guided_form_responses')
      .upsert(
        {
          task_id: taskId,
          family_member_id: childMemberId,
          section_key: sectionKey,
          section_content: content,
          filled_by: 'child',
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'task_id,section_key' }
      )
      .then(() => {/* fire and forget */})
  }, [taskId, childMemberId, values, currentSection])

  if (!open) return null

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-main)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={18} aria-hidden />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {getSubtypeLabel(subtype)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {template.title}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          aria-label="Print worksheet"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '0.25rem',
          }}
        >
          <Printer size={18} aria-hidden />
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div
        className="flex-shrink-0 px-4 py-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Section {currentIdx + 1} of {sections.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {completedChildCount} of {childSections.length} your sections filled
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((currentIdx + 1) / sections.length) * 100}%`,
              backgroundColor: 'var(--color-btn-primary-bg)',
            }}
          />
        </div>
      </div>

      {/* ── Section tabs (pills) ── */}
      <div
        className="flex gap-1.5 px-4 py-2 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {sections.map((s, i) => {
          const isCurrent = i === currentIdx
          const isFilled =
            s.filledBy === 'mom'
              ? true
              : (values[s.key] ?? '').trim().length > 0

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: isCurrent
                  ? 'var(--color-btn-primary-bg)'
                  : isFilled
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                color: isCurrent
                  ? 'var(--color-btn-primary-text, #fff)'
                  : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {s.label.split('—')[0].trim()}
            </button>
          )
        })}
      </div>

      {/* ── Section body ── */}
      {submitted ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <CheckCircle
            size={56}
            style={{ color: 'var(--color-btn-primary-bg)' }}
            aria-hidden
          />
          <p className="text-lg font-semibold text-center" style={{ color: 'var(--color-text-heading)' }}>
            All done!
          </p>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Your work has been submitted. Your parent will review it soon.
          </p>
          <Button variant="primary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {currentSection && (
              <div
                onBlur={() => handleSectionBlur(currentSection.key)}
              >
                <GuidedFormSectionEditor
                  section={currentSection}
                  value={values[currentSection.key] ?? ''}
                  onChange={val =>
                    setValues(prev => ({ ...prev, [currentSection.key]: val }))
                  }
                  actingAs="child"
                  lilaEnabled={lilaEnabled}
                  onLilaHelp={() => {
                    // TODO: open LiLa modal with section context (PRD-05 wiring)
                    console.log('LiLa help requested for section:', currentSection.key)
                  }}
                  readOnly={currentSection.filledBy === 'mom'}
                />
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            )}
          </div>

          {/* ── Footer navigation ── */}
          <div
            className="flex-shrink-0 p-4 flex items-center justify-between gap-3"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <Button
              variant="secondary"
              size="md"
              disabled={!canGoBack}
              onClick={() => setCurrentIdx(i => i - 1)}
            >
              <ArrowLeft size={16} aria-hidden />
              Back
            </Button>

            {canGoNext ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentIdx(i => i + 1)}
              >
                Next
                <ArrowRight size={16} aria-hidden />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                disabled={!allChildFilled}
                loading={submitting}
                onClick={handleSubmit}
              >
                <CheckCircle size={16} aria-hidden />
                Submit
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )

  return createPortal(content, document.body)
}
