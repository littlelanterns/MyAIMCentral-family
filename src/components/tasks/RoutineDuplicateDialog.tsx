/**
 * PRD-09A: Routine Duplication Dialog
 *
 * Deep-copies a routine template (template + sections + steps) for another child.
 * Linked steps (sequential/randomizer/task sources) surface for review:
 *   - "Same source" — shares the source across children (shared progress)
 *   - "Pick different" — opens LinkedSourcePicker for a new source
 *
 * Entry points: Studio "My Customized" Duplicate button, Tasks routines tab.
 */

import { useState, useMemo } from 'react'
import { Copy, Layers, Shuffle, Link2, Check, Loader2 } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useRoutineTemplateSteps } from '@/hooks/useRoutineTemplateSteps'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { LinkedSourcePicker } from '@/components/tasks/sequential/LinkedSourcePicker'
import { supabase } from '@/lib/supabase/client'
import type { TaskTemplateStep, LinkedSourceType } from '@/types/tasks'
import { resolveAllowanceProperties } from '@/lib/tasks/resolveAllowanceProperties'
import { resolveHomeworkProperties } from '@/lib/tasks/resolveHomeworkProperties'
import { resolveCategorizationProperties } from '@/lib/tasks/resolveCategorizationProperties'
import { resolveRewardProperties } from '@/lib/tasks/resolveRewardProperties'
// Worker ROUTINE-PROPAGATION (c4, founder D6 Thread 1): deep-clone is
// now a shared primitive under src/lib/templates/. Both this clone-
// and-deploy dialog and the new clone-as-template dialog
// (RoutineDuplicateTemplateDialog) call it.
import { cloneRoutineTemplate } from '@/lib/templates/cloneRoutineTemplate'
// Worker ROUTINE-PROPAGATION (c6): post-duplicate success toast.
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'

interface RoutineDuplicateDialogProps {
  isOpen: boolean
  onClose: () => void
  /** The source template to duplicate */
  templateId: string
  templateName: string
  familyId: string
  createdBy: string
  onDuplicated?: () => void
}

interface LinkedStepResolution {
  stepId: string
  stepTitle: string
  originalSourceId: string
  originalSourceType: LinkedSourceType
  originalSourceName: string
  /** Resolved source — defaults to original, changed by picker */
  resolvedSourceId: string
  resolvedSourceType: LinkedSourceType
  resolvedSourceName: string
}

const SOURCE_TYPE_ICONS = {
  sequential_collection: Layers,
  randomizer_list: Shuffle,
  recurring_task: Link2,
} as const

const SOURCE_TYPE_LABELS = {
  sequential_collection: 'Sequential',
  randomizer_list: 'Randomizer',
  recurring_task: 'Task',
} as const

export function RoutineDuplicateDialog({
  isOpen,
  onClose,
  templateId,
  templateName,
  familyId,
  createdBy,
  onDuplicated,
}: RoutineDuplicateDialogProps) {
  const { data: sections, isLoading: loadingSections } = useRoutineTemplateSteps(templateId)
  const { data: familyMembers } = useFamilyMembers(familyId)
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerForStepId, setPickerForStepId] = useState<string | null>(null)
  const routingToast = useRoutingToast()

  // Find linked steps that need resolution
  const linkedSteps = useMemo<LinkedStepResolution[]>(() => {
    if (!sections) return []
    const results: LinkedStepResolution[] = []
    for (const sec of sections) {
      for (const step of sec.steps) {
        if (step.step_type !== 'static' && step.linked_source_id && step.linked_source_type) {
          results.push({
            stepId: step.id,
            stepTitle: step.display_name_override || step.title,
            originalSourceId: step.linked_source_id,
            originalSourceType: step.linked_source_type,
            originalSourceName: step.display_name_override || step.title,
            resolvedSourceId: step.linked_source_id,
            resolvedSourceType: step.linked_source_type,
            resolvedSourceName: step.display_name_override || step.title,
          })
        }
      }
    }
    return results
  }, [sections])

  const [resolutions, setResolutions] = useState<Map<string, LinkedStepResolution>>(new Map())

  // Initialize resolutions from linkedSteps
  const getResolution = (stepId: string): LinkedStepResolution | undefined => {
    return resolutions.get(stepId) ?? linkedSteps.find(ls => ls.stepId === stepId)
  }

  function handleSourcePicked(stepId: string, sourceId: string, sourceType: LinkedSourceType, sourceName: string) {
    setResolutions(prev => {
      const next = new Map(prev)
      const existing = getResolution(stepId)
      if (existing) {
        next.set(stepId, {
          ...existing,
          resolvedSourceId: sourceId,
          resolvedSourceType: sourceType,
          resolvedSourceName: sourceName,
        })
      }
      return next
    })
    setPickerForStepId(null)
  }

  const activeMembers = (familyMembers ?? []).filter(m => m.is_active)

  async function handleDuplicate() {
    if (!targetMemberId || !sections) return
    setSaving(true)
    setError(null)

    try {
      // Build linkedStepResolutions only for steps mom actually changed
      // — preserves the existing behavior where unchanged linked steps
      // share progress with the source.
      const resolutions = sections
        .flatMap(sec =>
          sec.steps.map((step: TaskTemplateStep) => {
            const r = getResolution(step.id)
            if (!r) return null
            // Skip when mom did not actually change the source.
            if (r.resolvedSourceId === r.originalSourceId) return null
            return {
              sourceStepId: step.id,
              resolvedSourceId: r.resolvedSourceId,
              resolvedSourceType: r.resolvedSourceType,
              resolvedSourceName: r.resolvedSourceName,
            }
          }),
        )
        .filter((r): r is NonNullable<typeof r> => r !== null)

      // 1. Deep-clone the template via the shared utility.
      const cloned = await cloneRoutineTemplate(supabase, {
        sourceTemplateId: templateId,
        newTitle: `${templateName} (copy)`,
        familyId,
        createdBy,
        linkedStepResolutions: resolutions,
      })

      // 2. Read the source template's capability fields for snapshot.
      const { data: tmpl } = await supabase
        .from('task_templates')
        .select('life_area_tag, life_area_tags, require_approval, incomplete_action, image_url, counts_for_allowance, counts_for_homework, counts_for_gamification, allowance_points, homework_subject_ids, is_extra_credit, default_reward_type, default_reward_amount')
        .eq('id', templateId)
        .single()

      const allowance = resolveAllowanceProperties(tmpl)
      const homework = resolveHomeworkProperties(tmpl)
      const categorization = resolveCategorizationProperties(tmpl)
      const reward = resolveRewardProperties(null, tmpl)

      // 3. Create the task with full capability snapshot at deploy time.
      const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
        family_id: familyId,
        created_by: createdBy,
        assignee_id: targetMemberId,
        template_id: cloned.newTemplateId,
        title: `${templateName} (copy)`,
        task_type: 'routine',
        status: 'pending',
        source: 'template_deployed',
        require_approval: tmpl?.require_approval ?? false,
        incomplete_action: tmpl?.incomplete_action ?? 'fresh_reset',
        victory_flagged: reward.victory_flagged,
        counts_for_allowance: allowance.counts_for_allowance,
        allowance_points: allowance.allowance_points,
        is_extra_credit: allowance.is_extra_credit,
        counts_for_homework: homework.counts_for_homework,
        homework_subject_ids: homework.homework_subject_ids,
        counts_for_gamification: tmpl?.counts_for_gamification ?? true,
        life_area_tag: tmpl?.life_area_tag ?? null,
        life_area_tags: categorization.life_area_tags,
        points_override: reward.points_override,
      }).select('id').single()

      if (taskError) throw taskError

      if (newTask && reward.reward_type && reward.reward_amount != null) {
        await supabase.from('task_rewards').insert({
          task_id: newTask.id,
          reward_type: reward.reward_type,
          reward_value: { amount: reward.reward_amount },
        })
      }

      // Worker ROUTINE-PROPAGATION (c6): post-duplicate success toast.
      // Names the assignee.
      const targetName =
        activeMembers.find(m => m.id === targetMemberId)?.display_name ??
        'family member'
      routingToast.show({
        message: `Duplicated to ${targetName}.`,
      })

      onDuplicated?.()
      onClose()
    } catch (err) {
      console.error('Routine duplication failed:', err)
      setError('Failed to duplicate routine. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ModalV2
        isOpen={isOpen}
        onClose={onClose}
        title="Duplicate Routine"
        type="transient"
        size="md"
        id="routine-duplicate-dialog"
      >
        <div className="p-4 flex flex-col gap-4">
          {/* Source routine */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Copy size={14} style={{ color: 'var(--color-text-secondary)' }} />
            {templateName}
          </div>

          {/* Target member picker */}
          <div>
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Duplicate for:
            </label>
            <div className="flex flex-wrap gap-2">
              {activeMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => setTargetMemberId(m.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: targetMemberId === m.id
                      ? `var(--member-color-${m.assigned_color ?? 'sage'}, var(--color-btn-primary-bg))`
                      : 'var(--color-bg-secondary)',
                    color: targetMemberId === m.id
                      ? 'var(--color-btn-primary-text)'
                      : 'var(--color-text-primary)',
                    border: `1.5px solid ${targetMemberId === m.id ? 'transparent' : 'var(--color-border)'}`,
                    minHeight: 'unset',
                  }}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* Linked step resolution */}
          {linkedSteps.length > 0 && (
            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Linked content — which sources should the copy use?
              </label>
              <div className="flex flex-col gap-2">
                {linkedSteps.map(ls => {
                  const resolution = getResolution(ls.stepId)
                  const SourceIcon = SOURCE_TYPE_ICONS[ls.originalSourceType] ?? Link2
                  const sourceLabel = SOURCE_TYPE_LABELS[ls.originalSourceType] ?? 'Source'
                  const isChanged = resolution && resolution.resolvedSourceId !== ls.originalSourceId

                  return (
                    <div
                      key={ls.stepId}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <SourceIcon size={14} style={{ color: 'var(--color-text-secondary)' }} />
                      <div className="flex-1 min-w-0">
                        <span style={{ color: 'var(--color-text-primary)' }}>
                          {ls.stepTitle}
                        </span>
                        <span
                          className="block text-[10px]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {sourceLabel}: {resolution?.resolvedSourceName ?? ls.originalSourceName}
                          {isChanged && ' (changed)'}
                        </span>
                      </div>
                      <button
                        onClick={() => setPickerForStepId(ls.stepId)}
                        className="shrink-0 px-2 py-1 rounded text-[10px] font-medium"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          minHeight: 'unset',
                        }}
                      >
                        Change
                      </button>
                    </div>
                  )
                })}
              </div>
              <p
                className="text-[10px] mt-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                "Same source" means both children share progress on the same list. "Change" picks a different source.
              </p>
            </div>
          )}

          {loadingSections && (
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Loading routine structure...
            </p>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--color-error, #e55)' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleDuplicate}
            disabled={!targetMemberId || saving || loadingSections}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Check size={16} />
                Duplicate Routine
              </>
            )}
          </button>
        </div>
      </ModalV2>

      {/* Linked source picker for re-resolving a specific step */}
      {pickerForStepId && (
        <LinkedSourcePicker
          isOpen={true}
          onClose={() => setPickerForStepId(null)}
          familyId={familyId}
          onSelect={({ source_id, source_type, source_name }) => {
            handleSourcePicked(pickerForStepId, source_id, source_type, source_name)
          }}
        />
      )}
    </>
  )
}
