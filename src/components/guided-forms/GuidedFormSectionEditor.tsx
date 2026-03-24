/**
 * GuidedFormSectionEditor (PRD-09B)
 *
 * Renders a single section of a guided form template for mom to fill (during
 * assignment) or for a child to fill (during completion).
 *
 * - Mom's sections: rich textarea, unlocked
 * - Child's sections: shown as locked placeholder text in the assignment flow
 * - LiLa help button shown only when lilaEnabled=true and role='child'
 *
 * Zero hardcoded hex colors. All icons Lucide React. Mobile-first.
 */

import { useId } from 'react'
import { Lock, Sparkles } from 'lucide-react'

export type SectionFilledBy = 'mom' | 'child'

export interface GuidedFormSection {
  key: string
  label: string
  prompt: string
  filledBy: SectionFilledBy
  required?: boolean
  multiItem?: boolean // e.g. Options in SODAS — child lists multiple items
}

interface GuidedFormSectionEditorProps {
  section: GuidedFormSection
  value: string
  onChange: (value: string) => void
  /** 'mom' = assignment flow; 'child' = fill flow */
  actingAs: 'mom' | 'child'
  lilaEnabled?: boolean
  onLilaHelp?: () => void
  readOnly?: boolean
  showLabel?: boolean
}

export function GuidedFormSectionEditor({
  section,
  value,
  onChange,
  actingAs,
  lilaEnabled = false,
  onLilaHelp,
  readOnly = false,
  showLabel = true,
}: GuidedFormSectionEditorProps) {
  const inputId = useId()

  const isLocked =
    !readOnly &&
    actingAs === 'mom' &&
    section.filledBy === 'child'

  const isEditable =
    !readOnly &&
    !isLocked &&
    ((actingAs === 'mom' && section.filledBy === 'mom') ||
      (actingAs === 'child' && section.filledBy === 'child'))

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={isEditable ? inputId : undefined}
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {section.label}
            {section.required && (
              <span style={{ color: 'var(--color-error)' }} aria-hidden> *</span>
            )}
          </label>

          {isLocked && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Lock size={12} aria-hidden />
              Child fills this
            </span>
          )}

          {lilaEnabled && actingAs === 'child' && section.filledBy === 'child' && onLilaHelp && (
            <button
              type="button"
              onClick={onLilaHelp}
              className="flex items-center gap-1 text-xs font-medium"
              style={{
                color: 'var(--color-btn-primary-bg)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
              }}
            >
              <Sparkles size={12} aria-hidden />
              Ask LiLa
            </button>
          )}
        </div>
      )}

      <p
        className="text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {section.prompt}
      </p>

      {isLocked ? (
        <div
          className="rounded-md px-3 py-2 text-sm"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-secondary)',
            minHeight: '80px',
          }}
        >
          Your child will fill this section in when they receive the assignment.
        </div>
      ) : readOnly ? (
        <div
          className="rounded-md px-3 py-2 text-sm whitespace-pre-wrap"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            minHeight: '60px',
          }}
        >
          {value || <span style={{ color: 'var(--color-text-secondary)' }}>(not filled)</span>}
        </div>
      ) : (
        <textarea
          id={inputId}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={section.multiItem ? 5 : 3}
          placeholder={
            section.multiItem
              ? 'List each option on its own line...'
              : 'Type here...'
          }
          style={{
            width: '100%',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            padding: '0.625rem 0.75rem',
            fontSize: '0.875rem',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color var(--vibe-transition, 0.2s ease)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--color-btn-primary-bg)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        />
      )}
    </div>
  )
}
