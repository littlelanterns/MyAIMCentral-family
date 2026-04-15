/**
 * RoutineSectionEditor (PRD-09A Screen 4)
 *
 * Nested within TaskCreationModal when type=Routine.
 * Sections with [+ Add Section], each section has steps with [+ Add Step].
 * Up/down arrow reorder (sort_order based — no DnD library needed).
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown, Zap, Camera, Edit2, Sparkles, MessageSquareText, Link2, BookOpen, Shuffle, Repeat } from 'lucide-react'
import { Button, Toggle, BulkAddWithAI, Tooltip } from '@/components/shared'
import { RoutineBrainDump } from './RoutineBrainDump'
import { LinkedSourcePicker } from './sequential/LinkedSourcePicker'
import type { StepType, LinkedSourceType } from '@/types/tasks'

// ─── Types ───────────────────────────────────────────────────

export interface RoutineStep {
  id: string
  title: string
  notes: string
  showNotes: boolean
  instanceCount: number
  requirePhoto: boolean
  sort_order: number
  // Build J: linked step columns. Static steps (the default) keep their title
  // as-entered. Linked steps dynamically render content from an external source.
  step_type: StepType
  linked_source_id: string | null
  linked_source_type: LinkedSourceType | null
  display_name_override: string | null
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
    // Build J: default to static. Mom switches to linked via the UI.
    step_type: 'static',
    linked_source_id: null,
    linked_source_type: null,
    display_name_override: null,
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

const LINKED_TYPE_ICONS: Record<LinkedSourceType, typeof BookOpen> = {
  sequential_collection: BookOpen,
  randomizer_list: Shuffle,
  recurring_task: Repeat,
}

const LINKED_TYPE_LABELS: Record<LinkedSourceType, string> = {
  sequential_collection: 'Sequential list',
  randomizer_list: 'Randomizer',
  recurring_task: 'Recurring task',
}

function StepRow({ step, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown, onBreakDown }: StepRowProps) {
  const isLinked = step.step_type !== 'static'
  const LinkedIcon = step.linked_source_type ? LINKED_TYPE_ICONS[step.linked_source_type] : Link2

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: `1px solid ${isLinked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        backgroundColor: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Build J: Linked step banner (shown on linked steps only) */}
      {isLinked && (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5"
          style={{
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <LinkedIcon size={11} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
            Linked → {step.linked_source_type ? LINKED_TYPE_LABELS[step.linked_source_type] : 'source'}
          </span>
          <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
            pulls today's content
          </span>
        </div>
      )}

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

        {/* Title input — for linked steps, this is the optional display name override */}
        <input
          type="text"
          value={isLinked ? (step.display_name_override ?? step.title) : step.title}
          onChange={(e) => {
            if (isLinked) {
              onChange({ ...step, display_name_override: e.target.value, title: e.target.value })
            } else {
              onChange({ ...step, title: e.target.value })
            }
          }}
          placeholder={isLinked ? 'Display name (e.g. Math, Reading)…' : 'Step name…'}
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
          <Tooltip content="Add notes">
          <button
            type="button"
            onClick={() => onChange({ ...step, showNotes: !step.showNotes })}
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
          </Tooltip>
          <Tooltip content="Break down this step">
          <button
            type="button"
            onClick={onBreakDown}
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
          </Tooltip>
          <Tooltip content="Require photo on completion">
          <button
            type="button"
            onClick={() => onChange({ ...step, requirePhoto: !step.requirePhoto })}
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
          </Tooltip>
          <Tooltip content="Move up">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
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
          </Tooltip>
          <Tooltip content="Move down">
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
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
          </Tooltip>
          <Tooltip content="Remove step">
          <button
            type="button"
            onClick={onRemove}
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
          </Tooltip>
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
  /** Build J: family id for the linked source picker */
  familyId?: string
}

function SectionRow({ section, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown, onBreakDown, familyId }: SectionRowProps) {
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  // Build J: linked source picker modal state
  const [showLinkedPicker, setShowLinkedPicker] = useState(false)
  const [pendingLinkedStepId, setPendingLinkedStepId] = useState<string | null>(null)

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

  // Build J: add a blank linked step (type defaults to linked_sequential;
  // the picker modal opens immediately to let mom choose the source).
  const addLinkedStep = () => {
    const maxOrder = section.steps.reduce((m, s) => Math.max(m, s.sort_order), -1)
    const newStep: RoutineStep = {
      ...makeBlankStep(maxOrder + 1),
      step_type: 'linked_sequential',
      // title stays empty until mom picks a source; picker fills display_name_override
    }
    onChange({ ...section, steps: [...section.steps, newStep] })
    setPendingLinkedStepId(newStep.id)
    setShowLinkedPicker(true)
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
          <Tooltip content="Edit section">
          <button
            type="button"
            onClick={() => onChange({ ...section, isEditing: !section.isEditing })}
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
          </Tooltip>
          <Tooltip content="Move section up">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
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
          </Tooltip>
          <Tooltip content="Move section down">
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
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
          </Tooltip>
          <Tooltip content="Remove section">
          <button
            type="button"
            onClick={onRemove}
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
          </Tooltip>
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
              onChange={(e) => {
                const freq = e.target.value as SectionFrequency
                // Auto-enable showUntilComplete when switching away from daily.
                // Non-daily sections should carry forward by default — a Monday
                // section that wasn't completed should persist until it's done.
                const autoEnable = freq !== 'daily' && section.frequency === 'daily'
                  ? { showUntilComplete: true }
                  : {}
                onChange({ ...section, frequency: freq, ...autoEnable })
              }}
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

        <div className="flex items-center gap-3 flex-wrap">
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
          {/* Build J: Add linked step — opens LinkedSourcePicker */}
          {familyId && (
            <button
              type="button"
              onClick={addLinkedStep}
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
              <Link2 size={13} />
              Add linked step
            </button>
          )}
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
              const newSteps: RoutineStep[] = parsed
                .filter(i => i.selected)
                .map((item, idx) => ({
                  id: generateId(),
                  title: item.text,
                  notes: '',
                  showNotes: false,
                  instanceCount: 1,
                  requirePhoto: false,
                  sort_order: maxOrder + 1 + idx,
                  // Build J: bulk add creates static steps by default
                  step_type: 'static',
                  linked_source_id: null,
                  linked_source_type: null,
                  display_name_override: null,
                }))
              onChange({ ...section, steps: [...section.steps, ...newSteps] })
            }}
            onClose={() => setShowBulkAdd(false)}
          />
        )}

        {/* Build J: Linked source picker modal */}
        {showLinkedPicker && familyId && (
          <LinkedSourcePicker
            isOpen={showLinkedPicker}
            onClose={() => {
              // If mom cancels without picking, remove the blank linked step
              if (pendingLinkedStepId) {
                const pending = section.steps.find(s => s.id === pendingLinkedStepId)
                if (pending && !pending.linked_source_id) {
                  onChange({
                    ...section,
                    steps: section.steps.filter(s => s.id !== pendingLinkedStepId),
                  })
                }
              }
              setShowLinkedPicker(false)
              setPendingLinkedStepId(null)
            }}
            familyId={familyId}
            onSelect={({ source_id, source_type, source_name }) => {
              if (!pendingLinkedStepId) return
              // Map source_type to the step_type enum value
              const stepType: StepType =
                source_type === 'sequential_collection' ? 'linked_sequential'
                : source_type === 'randomizer_list' ? 'linked_randomizer'
                : 'linked_task'

              onChange({
                ...section,
                steps: section.steps.map(s =>
                  s.id === pendingLinkedStepId
                    ? {
                        ...s,
                        step_type: stepType,
                        linked_source_id: source_id,
                        linked_source_type: source_type,
                        display_name_override: source_name,
                        title: source_name,
                      }
                    : s,
                ),
              })
              setShowLinkedPicker(false)
              setPendingLinkedStepId(null)
            }}
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
  /** Build J: family id required for the Linked Source Picker. If omitted,
   *  the [Add linked step] button is hidden. */
  familyId?: string
}

export function RoutineSectionEditor({ sections, onChange, onBreakDown, familyId }: RoutineSectionEditorProps) {
  const [showBrainDump, setShowBrainDump] = useState(false)

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

      {/* Brain dump overlay */}
      {showBrainDump && (
        <RoutineBrainDump
          appendMode={sections.length > 0}
          onAccept={(newSections) => {
            if (sections.length > 0) {
              // Append mode: add new sections after existing ones
              const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), -1)
              const adjusted = newSections.map((s, i) => ({ ...s, sort_order: maxOrder + 1 + i }))
              onChange([...sections, ...adjusted])
            } else {
              onChange(newSections)
            }
            setShowBrainDump(false)
          }}
          onClose={() => setShowBrainDump(false)}
        />
      )}

      {sorted.length === 0 && !showBrainDump && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Primary option: AI sort */}
          <button
            type="button"
            onClick={() => setShowBrainDump(true)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              border: '2px solid var(--color-btn-primary-bg)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              flexShrink: 0,
              marginTop: '0.125rem',
            }}>
              <Sparkles size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                Paste your schedule and let AI organize it
              </div>
              <div style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                Describe or paste your routine however it makes sense to you. AI will sort everything into the right sections by day and frequency.
              </div>
            </div>
          </button>

          {/* Secondary option: manual build */}
          <button
            type="button"
            onClick={addSection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Plus size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-primary)' }}>
                Build sections manually
              </div>
              <div style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                Create each section and add steps one at a time
              </div>
            </div>
          </button>
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
          familyId={familyId}
        />
      ))}

      {sorted.length > 0 && (
        <div className="flex items-center gap-3">
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
          {!showBrainDump && (
            <button
              type="button"
              onClick={() => setShowBrainDump(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 500,
              }}
            >
              <MessageSquareText size={14} />
              Describe more to AI
            </button>
          )}
        </div>
      )}
    </div>
  )
}
