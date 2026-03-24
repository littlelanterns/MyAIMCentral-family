/**
 * GuidedFormAssignModal (PRD-09B, specs/studio-seed-templates.md)
 *
 * Two-step modal:
 *   Step 1 — Mom fills her sections (Situation / Scenario / Intro note).
 *            Child sections shown as locked placeholders.
 *   Step 2 — Assign to child(ren). Multi-select. LiLa toggle. Creates:
 *            - tasks row per child (task_type='guided_form')
 *            - guided_form_responses rows: mom's sections pre-filled, child's blank
 *
 * Template record is NEVER modified during assignment.
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState, useCallback } from 'react'
import {
  ArrowRight, ArrowLeft, Users, Sparkles, Check,
  FileText, BookOpen, Heart,
} from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Toggle } from '@/components/shared/Toggle'
import { GuidedFormSectionEditor } from './GuidedFormSectionEditor'
import {
  getSectionsForSubtype,
  getSubtypeLabel,
} from './guidedFormTypes'
import type { GuidedFormTemplate, GuidedFormSubtype } from './guidedFormTypes'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'

// ─── Props ────────────────────────────────────────────────────────

interface GuidedFormAssignModalProps {
  open: boolean
  onClose: () => void
  template: GuidedFormTemplate
  familyId: string
  assigningMemberId: string // mom's member ID
  eligibleChildren: FamilyMember[]
  onAssigned?: (taskIds: string[]) => void
}

// ─── Subtype Icon ────────────────────────────────────────────────

function SubtypeIcon({ subtype }: { subtype: GuidedFormSubtype }) {
  switch (subtype) {
    case 'sodas': return <BookOpen size={16} aria-hidden />
    case 'what_if': return <FileText size={16} aria-hidden />
    case 'apology_reflection': return <Heart size={16} aria-hidden />
    case 'custom': return <FileText size={16} aria-hidden />
  }
}

// ─── Component ───────────────────────────────────────────────────

export function GuidedFormAssignModal({
  open,
  onClose,
  template,
  familyId,
  assigningMemberId,
  eligibleChildren,
  onAssigned,
}: GuidedFormAssignModalProps) {
  const [step, setStep] = useState<1 | 2>(1)

  // Mom's filled values keyed by section_key
  const [momValues, setMomValues] = useState<Record<string, string>>({})

  // Selected children for assignment
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  // LiLa assistance toggle
  const [lilaEnabled, setLilaEnabled] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtype = template.guided_form_subtype
  const sections = subtype === 'custom'
    ? (template.config?.sections ?? [])
    : getSectionsForSubtype(subtype)

  const momSections = sections.filter(s => s.filledBy === 'mom')
  const childSections = sections.filter(s => s.filledBy === 'child')

  // Validate step 1: all required mom sections have content
  const step1Valid = momSections
    .filter(s => s.required)
    .every(s => (momValues[s.key] ?? '').trim().length > 0)

  // Validate step 2: at least one child selected
  const step2Valid = selectedChildIds.length > 0

  function toggleChild(id: string) {
    setSelectedChildIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleAssign = useCallback(async () => {
    setError(null)
    setSubmitting(true)

    try {
      const taskIds: string[] = []

      for (const childId of selectedChildIds) {
        // Create the task record
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .insert({
            family_id: familyId,
            created_by: assigningMemberId,
            assignee_id: childId,
            template_id: template.id,
            title: template.title,
            description: template.description ?? null,
            task_type: 'guided_form',
            status: 'pending',
            source: 'guided_form_assignment',
          })
          .select('id')
          .single()

        if (taskError || !taskData) throw taskError ?? new Error('Failed to create task')

        const taskId = taskData.id
        taskIds.push(taskId)

        // Build response rows: mom's sections (pre-filled) + child's sections (blank)
        const responseRows = sections.map(section => ({
          task_id: taskId,
          family_member_id:
            section.filledBy === 'mom' ? assigningMemberId : childId,
          section_key: section.key,
          section_content: section.filledBy === 'mom'
            ? (momValues[section.key] ?? '')
            : '',
          filled_by: section.filledBy,
          completed_at:
            section.filledBy === 'mom' ? new Date().toISOString() : null,
          lila_enabled: lilaEnabled && section.filledBy === 'child',
        }))

        const { error: responseError } = await supabase
          .from('guided_form_responses')
          .insert(responseRows)

        if (responseError) throw responseError
      }

      onAssigned?.(taskIds)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [
    selectedChildIds, familyId, assigningMemberId, template,
    sections, momValues, lilaEnabled, onAssigned,
  ])

  function handleClose() {
    setStep(1)
    setMomValues({})
    setSelectedChildIds([])
    setLilaEnabled(false)
    setError(null)
    onClose()
  }

  const footerStep1 = (
    <div className="flex justify-between items-center gap-3">
      <Button variant="ghost" size="md" onClick={handleClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        size="md"
        disabled={!step1Valid}
        onClick={() => setStep(2)}
      >
        Next
        <ArrowRight size={16} aria-hidden />
      </Button>
    </div>
  )

  const footerStep2 = (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-center" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
      <div className="flex justify-between items-center gap-3">
        <Button variant="ghost" size="md" onClick={() => setStep(1)}>
          <ArrowLeft size={16} aria-hidden />
          Back
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={submitting}
          disabled={!step2Valid}
          onClick={handleAssign}
        >
          <Check size={16} aria-hidden />
          Assign
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Assign ${getSubtypeLabel(subtype)}`}
      size="lg"
      footer={step === 1 ? footerStep1 : footerStep2}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        <StepDot active={step === 1} done={step > 1} label="Fill your sections" number={1} />
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
        <StepDot active={step === 2} done={false} label="Assign to child" number={2} />
      </div>

      {/* Template header */}
      <div
        className="flex items-center gap-2 mb-5 p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <span style={{ color: 'var(--color-btn-primary-bg)' }}>
          <SubtypeIcon subtype={subtype} />
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {template.title}
          </p>
          {template.description && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {template.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Step 1: Fill mom sections ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Fill in your part of this worksheet. Your child will complete the remaining sections.
          </p>

          {sections.map(section => (
            <div
              key={section.key}
              className="flex flex-col gap-2 pb-4"
              style={{
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <GuidedFormSectionEditor
                section={section}
                value={momValues[section.key] ?? ''}
                onChange={val => setMomValues(prev => ({ ...prev, [section.key]: val }))}
                actingAs="mom"
              />
            </div>
          ))}

          {/* Section summary */}
          <div
            className="rounded-lg p-3 flex gap-3"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <p>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  You fill:
                </span>{' '}
                {momSections.map(s => s.label).join(', ')}
              </p>
              <p>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Child fills:
                </span>{' '}
                {childSections.map(s => s.label).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Assign to children ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users size={16} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Assign to
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Each child gets an independent copy of this assignment.
            </p>

            {eligibleChildren.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No children available. Make sure family members are set up in Settings.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {eligibleChildren.map(child => {
                  const selected = selectedChildIds.includes(child.id)
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child.id)}
                      className="flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        border: `1px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                        backgroundColor: selected
                          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                          : 'var(--color-bg-card)',
                        cursor: 'pointer',
                      }}
                      aria-pressed={selected}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: child.member_color ?? 'var(--color-bg-secondary)',
                          color: 'var(--color-text-on-primary, #fff)',
                        }}
                      >
                        {child.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="text-sm font-medium flex-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {child.display_name}
                      </span>
                      {selected && (
                        <Check size={16} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* LiLa assistance toggle */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
            }}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Allow LiLa assistance
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Child can tap "Ask LiLa" on any section for brainstorming help
              </span>
            </div>
            <Toggle
              checked={lilaEnabled}
              onChange={setLilaEnabled}
              label="Allow LiLa assistance"
              size="sm"
            />
          </div>

          {/* Preview summary */}
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
              What they'll receive
            </p>
            <ul className="flex flex-col gap-0.5">
              {sections.map(s => (
                <li
                  key={s.key}
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {s.filledBy === 'mom' ? '✓ ' : '○ '}
                  {s.label}
                  {s.filledBy === 'mom' ? ' (filled by you)' : ' (child fills)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Step Dot ─────────────────────────────────────────────────────

function StepDot({
  number,
  label,
  active,
  done,
}: {
  number: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
        style={{
          backgroundColor: active || done
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-bg-secondary)',
          color: active || done
            ? 'var(--color-btn-primary-text, #fff)'
            : 'var(--color-text-secondary)',
          border: active ? '2px solid var(--color-btn-primary-bg)' : '2px solid transparent',
        }}
      >
        {done ? <Check size={13} aria-hidden /> : number}
      </div>
      <span
        className="text-[10px] whitespace-nowrap"
        style={{
          color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </span>
    </div>
  )
}
