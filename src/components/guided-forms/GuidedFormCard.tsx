/**
 * GuidedFormCard (PRD-09B)
 *
 * Dashboard card for a child's guided form assignment.
 * Shows: form name, progress ("2 of 5 sections complete"), and a [Continue] button.
 * Tapping opens GuidedFormFillView.
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState } from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import { GuidedFormFillView } from './GuidedFormFillView'
import { getSubtypeLabel } from './guidedFormTypes'
import type { GuidedFormTemplate, GuidedFormResponseMap } from './guidedFormTypes'

// ─── Props ────────────────────────────────────────────────────────

interface GuidedFormCardProps {
  template: GuidedFormTemplate
  taskId: string
  childMemberId: string
  responses: GuidedFormResponseMap
  lilaEnabled: boolean
  onCompleted?: () => void
}

// ─── Component ───────────────────────────────────────────────────

export function GuidedFormCard({
  template,
  taskId,
  childMemberId,
  responses,
  lilaEnabled,
  onCompleted,
}: GuidedFormCardProps) {
  const [fillOpen, setFillOpen] = useState(false)

  const subtype = template.guided_form_subtype

  // Calculate progress synchronously — getSubtionsForSubtype is a pure function
  // We need a synchronous import approach here, so we call dynamically at render.
  // For dashboard cards we compute progress from responses directly.

  const childSectionKeys = Object.values(responses)
    .filter(r => r.filled_by === 'child')
    .map(r => r.section_key)

  const completedChildKeys = childSectionKeys.filter(
    key => (responses[key]?.section_content ?? '').trim().length > 0
  )

  const totalChild = childSectionKeys.length
  const completedChild = completedChildKeys.length

  const isComplete = totalChild > 0 && completedChild === totalChild

  return (
    <>
      <button
        type="button"
        onClick={() => setFillOpen(true)}
        className="w-full text-left rounded-xl p-4 flex items-center gap-3 transition-all"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
          }}
        >
          <FileText size={20} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-heading)' }}>
            {template.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {getSubtypeLabel(subtype)}
          </p>

          {/* Progress bar */}
          {totalChild > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {isComplete
                    ? 'Completed'
                    : `${completedChild} of ${totalChild} sections filled`}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: totalChild > 0
                      ? `${(completedChild / totalChild) * 100}%`
                      : '0%',
                    backgroundColor: isComplete
                      ? 'var(--color-success, #22c55e)'
                      : 'var(--color-btn-primary-bg)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <ChevronRight
          size={18}
          aria-hidden
          style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
        />
      </button>

      <GuidedFormFillView
        open={fillOpen}
        onClose={() => setFillOpen(false)}
        template={template}
        taskId={taskId}
        childMemberId={childMemberId}
        initialResponses={responses}
        lilaEnabled={lilaEnabled}
        onSubmitted={() => {
          setFillOpen(false)
          onCompleted?.()
        }}
      />
    </>
  )
}
