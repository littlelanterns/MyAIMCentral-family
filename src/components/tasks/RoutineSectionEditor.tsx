/**
 * RoutineSectionEditor (PRD-09A Screen 4)
 *
 * Nested within TaskCreationModal when type=Routine.
 * Sections with [+ Add Section], each section has steps with [+ Add Step].
 * Up/down arrow reorder (sort_order based — no DnD library needed).
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown, Zap, Camera, Edit2, Sparkles } from 'lucide-react'
import { Button, Toggle, BulkAddWithAI } from '@/components/shared'

// ─── Types ───────────────────────────────────────────────────

export interface RoutineStep {
  id: string
  title: string
  notes: string
  showNotes: boolean
  instanceCount: number
  requirePhoto: boolean
  sort_order: number
}

export interface RoutineSection {
  id: string
  name: string
  frequency: SectionFrequency
  customDays: number[] // 0=Su, 1=Mo, ... 6=Sa
  showUntilComplete: boolean
  steps: RoutineStep[]
  sort_order: number
  isEditing: boolean
}

export type SectionFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'mwf' | 't_th' | 'custom'

const FREQ_OPTIONS: { value: SectionFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'mwf', label: 'MWF (Mon, Wed, Fri)' },
  { value: 't_th', label: 'T, Th (Tue, Thu)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom days…' },
]

const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function makeBlankStep(sort_order: number): RoutineStep {
  return {
    id: generateId(),
    title: '',
    notes: '',
    showNotes: false,
    instanceCount: 1,
    requirePhoto: false,
    sort_order,
  }
}

function makeBlankSection(sort_order: number): RoutineSection {
  return {
    id: generateId(),
    name: '',
    frequency: 'daily',
    customDays: [],
    showUntilComplete: false,
    steps: [makeBlankStep(0)],
    sort_order,
    isEditing: true,
  }
}

// ─── Step Row ────────────────────────────────────────────────

interface StepRowProps {
  step: RoutineStep
  isFirst: boolean
  isLast: boolean
  onChange: (step: RoutineStep) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onBreakDown: () => void
}

function StepRow({ step, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown, onBreakDown }: StepRowProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Main step row */}
      <div className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem' }}>
        {/* Checkbox placeholder */}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            border: '1.5px solid var(--color-border)',
            flexShrink: 0,
          }}
        />

        {/* Title input */}
        <input
          type="text"
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          placeholder="Step name…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
          }}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...step, showNotes: !step.showNotes })}
            title="Add notes"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: step.showNotes ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onBreakDown}
            title="Break down this step"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <Zap size={13} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...step, requirePhoto: !step.requirePhoto })}
            title="Require photo on completion"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: step.requirePhoto ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <Camera size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              color: isFirst ? 'var(--color-border)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: isLast ? 'not-allowed' : 'pointer',
              color: isLast ? 'var(--color-border)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove step"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Instance count row */}
      {step.instanceCount > 1 && (
        <div
          style={{
            padding: '0.25rem 0.75rem 0.375rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
            Repeat:
          </span>
          <input
            type="number"
            value={step.instanceCount}
            onChange={(e) => onChange({ ...step, instanceCount: Math.max(1, Number(e.target.value)) })}
            min={1}
            style={{
              width: 48,
              padding: '0.125rem 0.25rem',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              textAlign: 'center',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
            times
          </span>
        </div>
      )}

      {/* Instance count setter when = 1 (inline mini control) */}
      {step.instanceCount === 1 && (
        <button
          type="button"
          onClick={() => onChange({ ...step, instanceCount: 2 })}
          style={{
            display: 'none', // Hidden until user needs it — accessed via context
          }}
        />
      )}

      {/* Expandable notes */}
      {step.showNotes && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <textarea
            value={step.notes}
            onChange={(e) => onChange({ ...step, notes: e.target.value })}
            placeholder="Instructions or notes for this step…"
            rows={2}
            style={{
              width: '100%',
              resize: 'vertical',
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              outline: 'none',
            }}
          />
          <div className="flex items-center gap-3 mt-1.5">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="number"
                value={step.instanceCount}
                onChange={(e) => onChange({ ...step, instanceCount: Math.max(1, Number(e.target.value)) })}
                min={1}
                style={{
                  width: 44,
                  padding: '0.125rem 0.25rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                instances
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section Row ─────────────────────────────────────────────

interface SectionRowProps {
  section: RoutineSection
  isFirst: boolean
  isLast: boolean
  onChange: (section: RoutineSection) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onBreakDown: (stepId: string) => void
}

function SectionRow({ section, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown, onBreakDown }: SectionRowProps) {
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  const updateStep = (stepId: string, updated: RoutineStep) => {
    onChange({ ...section, steps: section.steps.map((s) => (s.id === stepId ? updated : s)) })
  }

  const removeStep = (stepId: string) => {
    onChange({ ...section, steps: section.steps.filter((s) => s.id !== stepId) })
  }

  const addStep = () => {
    const maxOrder = section.steps.reduce((m, s) => Math.max(m, s.sort_order), -1)
    onChange({ ...section, steps: [...section.steps, makeBlankStep(maxOrder + 1)] })
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const idx = section.steps.findIndex((s) => s.id === stepId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === section.steps.length - 1) return
    const newSteps = [...section.steps]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]]
    // Recompute sort_order
    onChange({ ...section, steps: newSteps.map((s, i) => ({ ...s, sort_order: i })) })
  }

  const toggleDay = (day: number) => {
    const days = section.customDays.includes(day)
      ? section.customDays.filter((d) => d !== day)
      : [...section.customDays, day]
    onChange({ ...section, customDays: days })
  }

  const freqLabel = FREQ_OPTIONS.find((f) => f.value === section.frequency)?.label ?? section.frequency

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          {section.isEditing ? (
            <input
              type="text"
              value={section.name}
              onChange={(e) => onChange({ ...section, name: e.target.value })}
              placeholder="Section name…"
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-text-heading)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 600,
              }}
            />
          ) : (
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-heading)' }}>
              {section.name || 'Untitled section'}
            </span>
          )}
          <span
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-secondary)',
              marginLeft: '0.25rem',
            }}
          >
            {freqLabel}
            {section.showUntilComplete ? ' · show until complete' : ''}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...section, isEditing: !section.isEditing })}
            title="Edit section"
            style={{
              padding: '0.25rem',
              background: section.isEditing ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: section.isEditing ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move section up"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              color: isFirst ? 'var(--color-border)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move section down"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: isLast ? 'not-allowed' : 'pointer',
              color: isLast ? 'var(--color-border)' : 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove section"
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '4px',
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Section edit config panel */}
      {section.isEditing && (
        <div
          style={{
            padding: '0.75rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 4%, var(--color-bg-card))',
          }}
          className="space-y-3"
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs, 0.75rem)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '0.375rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Frequency
            </label>
            <select
              value={section.frequency}
              onChange={(e) => onChange({ ...section, frequency: e.target.value as SectionFrequency })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                minHeight: '44px',
                cursor: 'pointer',
              }}
            >
              {FREQ_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {section.frequency === 'custom' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Days
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, idx) => {
                  const active = section.customDays.includes(idx)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                        backgroundColor: active
                          ? 'var(--color-btn-primary-bg)'
                          : 'var(--color-bg-card)',
                        color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-xs, 0.75rem)',
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <Toggle
            checked={section.showUntilComplete}
            onChange={(v) => onChange({ ...section, showUntilComplete: v })}
            label="Show every day until checked off (show-until-complete)"
            size="sm"
          />
        </div>
      )}

      {/* Steps */}
      <div style={{ padding: '0.75rem' }} className="space-y-2">
        {section.steps
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((step, idx) => (
            <StepRow
              key={step.id}
              step={step}
              isFirst={idx === 0}
              isLast={idx === section.steps.length - 1}
              onChange={(updated) => updateStep(step.id, updated)}
              onRemove={() => removeStep(step.id)}
              onMoveUp={() => moveStep(step.id, 'up')}
              onMoveDown={() => moveStep(step.id, 'down')}
              onBreakDown={() => onBreakDown(step.id)}
            />
          ))}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-btn-primary-bg)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 500,
            }}
          >
            <Plus size={13} />
            Add step
          </button>
          <button
            type="button"
            onClick={() => setShowBulkAdd(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 500,
            }}
          >
            <Sparkles size={13} />
            Bulk add
          </button>
        </div>

        {showBulkAdd && (
          <BulkAddWithAI
            title={`Bulk Add Steps — ${section.name || 'Section'}`}
            placeholder="List routine steps one per line. E.g.: Brush teeth, Get dressed, Make bed..."
            hint="Type or paste all steps. AI will parse them into individual routine steps."
            parsePrompt="Parse the following text into individual routine checklist steps. Each step should be a short, actionable item. Return a JSON array of strings."
            onSave={async (parsed) => {
              const maxOrder = section.steps.reduce((m, s) => Math.max(m, s.sort_order), -1)
              const newSteps = parsed
                .filter(i => i.selected)
                .map((item, idx) => ({
                  id: generateId(),
                  title: item.text,
                  notes: '',
                  showNotes: false,
                  instanceCount: 1,
                  requirePhoto: false,
                  sort_order: maxOrder + 1 + idx,
                }))
              onChange({ ...section, steps: [...section.steps, ...newSteps] })
            }}
            onClose={() => setShowBulkAdd(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── RoutineSectionEditor ────────────────────────────────────

interface RoutineSectionEditorProps {
  sections: RoutineSection[]
  onChange: (sections: RoutineSection[]) => void
  /** Placeholder — breaks down a specific step via AI (PRD-09A Task Breaker stub) */
  onBreakDown?: (sectionId: string, stepId: string) => void
}

export function RoutineSectionEditor({ sections, onChange, onBreakDown }: RoutineSectionEditorProps) {
  const addSection = () => {
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), -1)
    onChange([...sections, makeBlankSection(maxOrder + 1)])
  }

  const updateSection = (sectionId: string, updated: RoutineSection) => {
    onChange(sections.map((s) => (s.id === sectionId ? updated : s)))
  }

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((s) => s.id !== sectionId))
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === sectionId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sections.length - 1) return
    const newSections = [...sections]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]]
    onChange(newSections.map((s, i) => ({ ...s, sort_order: i })))
  }

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 600,
            color: 'var(--color-text-heading)',
          }}
        >
          Routine steps
        </span>
        <Button variant="secondary" size="sm" onClick={addSection} type="button">
          <Plus size={14} />
          Add section
        </Button>
      </div>

      {sorted.length === 0 && (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
          }}
        >
          Add sections to organize your routine steps.
        </div>
      )}

      {sorted.map((section, idx) => (
        <SectionRow
          key={section.id}
          section={section}
          isFirst={idx === 0}
          isLast={idx === sorted.length - 1}
          onChange={(updated) => updateSection(section.id, updated)}
          onRemove={() => removeSection(section.id)}
          onMoveUp={() => moveSection(section.id, 'up')}
          onMoveDown={() => moveSection(section.id, 'down')}
          onBreakDown={(stepId) => onBreakDown?.(section.id, stepId)}
        />
      ))}

      {sorted.length > 0 && (
        <button
          type="button"
          onClick={addSection}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.5rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-btn-primary-bg)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
          }}
        >
          <Plus size={14} />
          Add section
        </button>
      )}
    </div>
  )
}
