/**
 * PRD-09A: Routine Step Checklist — renders sections + steps for a routine task.
 *
 * Reusable by GuidedActiveTasksSection (child dashboard), TaskCard (adult/teen),
 * and PlayTaskTileGrid (Play shell). Handles:
 *   - Static steps: simple checkbox
 *   - Linked sequential: shows active item from the collection with practice/mastery controls
 *   - Linked randomizer: shows today's drawn item with practice/mastery controls
 *   - Linked task: shows the linked task's current status
 *
 * Uses existing orphan hooks: useRoutineStepCompletions, useCompleteRoutineStep,
 * useUncompleteRoutineStep from useTaskCompletions.ts.
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Check, Layers, Shuffle, Link2, ExternalLink, ChevronDown, ChevronRight,
  Pencil, Plus, Trash2, Camera,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useRoutineTemplateSteps, type RoutineSection } from '@/hooks/useRoutineTemplateSteps'
import {
  useRoutineStepCompletions,
  useRoutineStepCompletionsThisWeek,
  useSharedRoutineStepCompletions,
  useSharedRoutineStepCompletionsThisWeek,
  useCompleteRoutineStep,
  useUncompleteRoutineStep,
} from '@/hooks/useTaskCompletions'
import { todayLocalIso } from '@/utils/dates'
import { useLogPractice } from '@/hooks/usePractice'
import { useFamily } from '@/hooks/useFamily'
import { DurationPromptModal } from './DurationPromptModal'
import { SharedWithHeader } from '@/components/shared/SharedWithHeader'
import { getMemberColor } from '@/lib/memberColors'
import { LinkifyText } from '@/utils/LinkifyText'
import type { TaskTemplateStep } from '@/types/tasks'

interface LinkedSourceTracking {
  trackProgress: boolean
  trackDuration: boolean
}

// ─── Linked content resolvers ───────────────────────────────

function LinkedSequentialContent({ sourceId, onTrackingResolved }: { sourceId: string; onTrackingResolved?: (t: LinkedSourceTracking) => void }) {
  const [data, setData] = useState<{ title: string; resourceUrl?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('tasks')
        .select('title, resource_url, track_progress, track_duration')
        .eq('sequential_collection_id', sourceId)
        .eq('sequential_is_active', true)
        .limit(1)
        .single()
        .then(({ data: row }) => {
          if (row) {
            setData({ title: row.title, resourceUrl: row.resource_url ?? undefined })
            onTrackingResolved?.({
              trackProgress: row.track_progress ?? false,
              trackDuration: row.track_duration ?? false,
            })
          }
        })
    })
  }

  if (!data) {
    return (
      <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
        Loading...
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Layers size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.title}
      </span>
      {data.resourceUrl && (
        <a
          href={data.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={10} style={{ color: 'var(--color-text-secondary)' }} />
        </a>
      )}
    </div>
  )
}

function LinkedRandomizerContent({ sourceId, memberId }: { sourceId: string; memberId: string }) {
  const [data, setData] = useState<{ itemName: string; resourceUrl?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    import('@/lib/supabase/client').then(({ supabase }) => {
      const today = todayLocalIso()
      supabase
        .from('randomizer_draws')
        .select('list_items!inner(content, resource_url)')
        .eq('list_id', sourceId)
        .eq('family_member_id', memberId)
        .eq('routine_instance_date', today)
        .in('status', ['active', 'drawn'])
        .limit(1)
        .single()
        .then(({ data: row }) => {
          const item = (row as unknown as { list_items: { content: string; resource_url: string | null } })?.list_items
          if (item?.content) setData({ itemName: item.content, resourceUrl: item.resource_url ?? undefined })
        })
    })
  }

  if (!data) {
    return (
      <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
        Drawing...
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Shuffle size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.itemName}
      </span>
      {data.resourceUrl && (
        <a
          href={data.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={10} style={{ color: 'var(--color-text-secondary)' }} />
        </a>
      )}
    </div>
  )
}

function LinkedTaskContent({ sourceId }: { sourceId: string }) {
  const [data, setData] = useState<{ title: string; status: string; resourceUrl?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('tasks')
        .select('title, status, resource_url')
        .eq('id', sourceId)
        .single()
        .then(({ data: row }) => {
          if (row) setData({ title: row.title, status: row.status, resourceUrl: row.resource_url ?? undefined })
        })
    })
  }

  if (!data) return null

  return (
    <div className="flex items-center gap-1.5">
      <Link2 size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.title}
      </span>
      {data.resourceUrl && (
        <a
          href={data.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={10} style={{ color: 'var(--color-text-secondary)' }} />
        </a>
      )}
    </div>
  )
}

// ─── Step Row ───────────────────────────────────────────────

interface StepCompleterInfo {
  memberId: string
  memberName: string
  memberColor: string
}

function InstanceCheckbox({
  checked,
  onToggle,
  disabled,
  borderColor,
  bgColor,
  checkColor,
}: {
  checked: boolean
  onToggle: () => void
  disabled: boolean
  borderColor: string
  bgColor: string
  checkColor: string
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="shrink-0 flex items-center justify-center rounded transition-colors"
      style={{
        width: '18px',
        height: '18px',
        border: `1.5px solid ${checked ? borderColor : 'var(--color-border)'}`,
        backgroundColor: checked ? bgColor : 'transparent',
        minHeight: 'unset',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {checked && <Check size={12} style={{ color: checkColor }} />}
    </button>
  )
}

function StepRow({
  step,
  taskId: _taskId,
  memberId,
  isCompleted,
  onToggle,
  toggling,
  onTrackingResolved,
  completedByOther,
  readOnly,
  completedInstances,
  onToggleInstance,
  sharedInstanceCompleters,
  isMom,
  onReattribute,
  assignees,
}: {
  step: TaskTemplateStep
  taskId: string
  memberId: string
  isCompleted: boolean
  onToggle: () => void
  toggling: boolean
  onTrackingResolved?: (stepId: string, t: LinkedSourceTracking) => void
  completedByOther?: StepCompleterInfo | null
  readOnly?: boolean
  completedInstances?: Set<number>
  onToggleInstance?: (instanceNumber: number, isCompleted: boolean) => void
  sharedInstanceCompleters?: Map<number, StepCompleterInfo>
  isMom?: boolean
  onReattribute?: (fromMemberId: string, toMemberId: string) => void
  assignees?: { id: string; display_name: string; assigned_color: string | null; member_color: string | null }[]
}) {
  const isLinked = step.step_type !== 'static' && step.step_type != null
  const displayName = step.display_name_override || step.title
  const isDisabled = toggling || readOnly
  const instanceCount = step.instance_count ?? 1
  const isMultiInstance = instanceCount > 1
  const [showReattribute, setShowReattribute] = useState(false)

  const checkboxBorderColor = completedByOther
    ? completedByOther.memberColor
    : isCompleted
      ? 'var(--color-btn-primary-bg)'
      : 'var(--color-border)'

  const checkboxBgColor = completedByOther
    ? 'color-mix(in srgb, ' + completedByOther.memberColor + ' 15%, transparent)'
    : isCompleted
      ? 'var(--color-btn-primary-bg)'
      : 'transparent'

  const doneCount = completedInstances?.size ?? 0
  const allInstancesDone = doneCount >= instanceCount

  return (
    <div
      className="flex items-start gap-2 py-1.5 group"
      style={{ opacity: toggling ? 0.5 : 1 }}
    >
      {/* Checkbox — single instance (default) */}
      {!isMultiInstance && (
        <button
          onClick={onToggle}
          disabled={isDisabled}
          className="shrink-0 mt-0.5 flex items-center justify-center rounded transition-colors"
          style={{
            width: '18px',
            height: '18px',
            border: `1.5px solid ${checkboxBorderColor}`,
            backgroundColor: checkboxBgColor,
            minHeight: 'unset',
            cursor: isDisabled ? 'default' : 'pointer',
          }}
        >
          {(isCompleted || completedByOther) && (
            <Check
              size={12}
              style={{
                color: completedByOther
                  ? completedByOther.memberColor
                  : 'var(--color-btn-primary-text)',
              }}
            />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        {/* Step title + require_photo + completer attribution */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className="text-xs leading-snug"
            style={{
              color: (isCompleted || completedByOther || allInstancesDone) ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              textDecoration: (isCompleted || completedByOther || allInstancesDone) ? 'line-through' : 'none',
            }}
          >
            {displayName}
          </span>
          {step.require_photo && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] leading-none"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Add a photo"
            >
              <Camera size={10} />
              <span className="hidden sm:inline">Add a photo</span>
            </span>
          )}
          {completedByOther && (
            <span className="relative inline-flex items-center">
              <button
                onClick={isMom && onReattribute && assignees ? () => setShowReattribute(!showReattribute) : undefined}
                className="text-[10px] leading-none"
                style={{
                  color: completedByOther.memberColor,
                  cursor: isMom && onReattribute ? 'pointer' : 'default',
                  minHeight: 'unset',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textDecoration: isMom && onReattribute ? 'underline dotted' : 'none',
                }}
              >
                done by {completedByOther.memberName}
              </button>
              {showReattribute && assignees && (
                <div
                  className="absolute left-0 top-full mt-1 z-10 flex flex-wrap gap-1 p-1.5 rounded-lg shadow-md"
                  style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                >
                  {assignees.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onReattribute!(completedByOther.memberId, a.id)
                        setShowReattribute(false)
                      }}
                      disabled={a.id === completedByOther.memberId}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-opacity"
                      style={{
                        backgroundColor: a.id === completedByOther.memberId
                          ? getMemberColor(a)
                          : `color-mix(in srgb, ${getMemberColor(a)} 15%, transparent)`,
                        color: a.id === completedByOther.memberId
                          ? '#fff'
                          : getMemberColor(a),
                        border: `1px solid ${getMemberColor(a)}`,
                        minHeight: 'unset',
                        opacity: a.id === completedByOther.memberId ? 0.6 : 1,
                      }}
                    >
                      {a.display_name}
                    </button>
                  ))}
                </div>
              )}
            </span>
          )}
        </div>

        {/* step_notes */}
        {step.step_notes && (
          <div
            className="text-xs italic mt-0.5"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}
          >
            <LinkifyText text={step.step_notes} />
          </div>
        )}

        {/* Multi-instance checkboxes */}
        {isMultiInstance && onToggleInstance && (() => {
          const hasShared = sharedInstanceCompleters && sharedInstanceCompleters.size > 0
          const totalDone = hasShared ? sharedInstanceCompleters.size : doneCount
          const allDone = totalDone >= instanceCount

          return (
            <div className="flex items-center gap-1 mt-1">
              {instanceCount <= 5 ? (
                Array.from({ length: instanceCount }, (_, i) => i + 1).map(n => {
                  const myDone = completedInstances?.has(n) ?? false
                  const otherCompleter = hasShared && !myDone ? sharedInstanceCompleters.get(n) : undefined
                  const isDone = myDone || !!otherCompleter
                  const color = otherCompleter
                    ? otherCompleter.memberColor
                    : 'var(--color-btn-primary-bg)'
                  return (
                    <InstanceCheckbox
                      key={n}
                      checked={isDone}
                      onToggle={() => onToggleInstance(n, isDone)}
                      disabled={toggling || (!!otherCompleter && !isMom)}
                      borderColor={color}
                      bgColor={otherCompleter
                        ? `color-mix(in srgb, ${color} 15%, transparent)`
                        : color}
                      checkColor={otherCompleter ? color : 'var(--color-btn-primary-text)'}
                    />
                  )
                })
              ) : (
                <>
                  <InstanceCheckbox
                    checked={totalDone > 0}
                    onToggle={() => {
                      if (allDone) {
                        for (let n = instanceCount; n >= 1; n--) {
                          if (completedInstances?.has(n)) onToggleInstance(n, true)
                        }
                      } else {
                        // Find next unclaimed instance
                        let next = doneCount + 1
                        if (hasShared) {
                          for (let n = 1; n <= instanceCount; n++) {
                            if (!sharedInstanceCompleters.has(n) && !(completedInstances?.has(n))) {
                              next = n
                              break
                            }
                          }
                        }
                        onToggleInstance(next, false)
                      }
                    }}
                    disabled={toggling || (allDone && !isMom)}
                    borderColor="var(--color-btn-primary-bg)"
                    bgColor={allDone ? 'var(--color-btn-primary-bg)' : 'color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)'}
                    checkColor="var(--color-btn-primary-text)"
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {totalDone}/{instanceCount}
                  </span>
                </>
              )}
            </div>
          )
        })()}

        {/* Linked content — shows the active item from the source */}
        {isLinked && !isCompleted && !completedByOther && (
          <div className="mt-0.5 ml-0.5">
            {step.step_type === 'linked_sequential' && step.linked_source_id && (
              <LinkedSequentialContent
                sourceId={step.linked_source_id}
                onTrackingResolved={onTrackingResolved ? (t) => onTrackingResolved(step.id, t) : undefined}
              />
            )}
            {step.step_type === 'linked_randomizer' && step.linked_source_id && (
              <LinkedRandomizerContent sourceId={step.linked_source_id} memberId={memberId} />
            )}
            {step.step_type === 'linked_task' && step.linked_source_id && (
              <LinkedTaskContent sourceId={step.linked_source_id} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section Group ──────────────────────────────────────────

function SectionGroup({
  section,
  taskId,
  memberId,
  completedStepIds,
  onToggleStep,
  togglingStepId,
  canEdit,
  onStepsChanged,
  onTrackingResolved,
  stepCompleterMap,
  isMom,
  instancesByStep,
  onToggleInstance,
  sharedInstancesByStep,
  onReattribute,
  assignees,
}: {
  section: RoutineSection
  taskId: string
  memberId: string
  completedStepIds: Set<string>
  onToggleStep: (stepId: string, completed: boolean) => void
  togglingStepId: string | null
  canEdit: boolean
  onStepsChanged: () => void
  onTrackingResolved?: (stepId: string, t: LinkedSourceTracking) => void
  stepCompleterMap?: Map<string, StepCompleterInfo>
  isMom?: boolean
  instancesByStep?: Map<string, Set<number>>
  onToggleInstance?: (stepId: string, instanceNumber: number, isCompleted: boolean) => void
  sharedInstancesByStep?: Map<string, Map<number, StepCompleterInfo>>
  onReattribute?: (stepId: string, fromMemberId: string, toMemberId: string) => void
  assignees?: { id: string; display_name: string; assigned_color: string | null; member_color: string | null }[]
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editSteps, setEditSteps] = useState<{ id: string; title: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const completedCount = section.steps.filter(s => completedStepIds.has(s.id)).length
  const totalCount = section.steps.length

  const isActiveToday = isSectionActiveToday(section, completedStepIds)
  if (!isActiveToday) return null

  const startEditing = () => {
    setEditSteps(section.steps.map(s => ({ id: s.id, title: s.display_name_override || s.title })))
    setEditing(true)
    setExpanded(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      // Update existing steps
      for (const step of editSteps) {
        const original = section.steps.find(s => s.id === step.id)
        if (original && (original.title !== step.title)) {
          await supabase.from('task_template_steps')
            .update({ title: step.title, step_name: step.title })
            .eq('id', step.id)
        }
      }
      // Delete removed steps
      const editIds = new Set(editSteps.map(s => s.id))
      for (const step of section.steps) {
        if (!editIds.has(step.id)) {
          await supabase.from('task_template_steps').delete().eq('id', step.id)
        }
      }
      onStepsChanged()
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const addStep = async () => {
    if (!newStepTitle.trim()) return
    setSaving(true)
    try {
      const maxOrder = Math.max(0, ...section.steps.map(s => s.sort_order ?? 0))
      await supabase.from('task_template_steps').insert({
        section_id: section.id,
        title: newStepTitle.trim(),
        step_name: newStepTitle.trim(),
        sort_order: maxOrder + 1,
      })
      setNewStepTitle('')
      onStepsChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 w-full py-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 text-left"
          style={{ minHeight: 'unset' }}
        >
          {expanded
            ? <ChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
            : <ChevronRight size={12} style={{ color: 'var(--color-text-secondary)' }} />
          }
          <span
            className="text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {section.title}
          </span>
        </button>
        <span
          className="text-[10px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {completedCount}/{totalCount}
        </span>
        {canEdit && !editing && (
          <button
            onClick={startEditing}
            className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
            style={{ minHeight: 'unset', color: 'var(--color-text-secondary)' }}
            title="Edit steps"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {expanded && !editing && (
        <div className="pl-1">
          {section.steps.map(step => {
            const otherCompleter = stepCompleterMap?.get(step.id)
            const myCompletion = completedStepIds.has(step.id)
            const isMulti = (step.instance_count ?? 1) > 1
            const sharedInstances = sharedInstancesByStep?.get(step.id)
            const allInstancesClaimed = isMulti && sharedInstances && sharedInstances.size >= (step.instance_count ?? 1)
            const isReadOnly = isMulti
              ? (!!allInstancesClaimed && !isMom)
              : (!!otherCompleter && !isMom)

            return (
              <StepRow
                key={step.id}
                step={step}
                taskId={taskId}
                memberId={memberId}
                isCompleted={myCompletion && !otherCompleter}
                onToggle={() => onToggleStep(step.id, myCompletion || !!otherCompleter)}
                toggling={togglingStepId === step.id}
                onTrackingResolved={onTrackingResolved}
                completedByOther={otherCompleter}
                readOnly={isReadOnly}
                completedInstances={instancesByStep?.get(step.id)}
                onToggleInstance={onToggleInstance ? (n, done) => onToggleInstance(step.id, n, done) : undefined}
                sharedInstanceCompleters={sharedInstances}
                isMom={isMom}
                onReattribute={onReattribute ? (from, to) => onReattribute(step.id, from, to) : undefined}
                assignees={assignees}
              />
            )
          })}
        </div>
      )}

      {/* Inline edit mode */}
      {expanded && editing && (
        <div className="pl-1 space-y-1 py-1">
          {editSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1.5">
              <input
                type="text"
                value={step.title}
                onChange={e => {
                  const next = [...editSteps]
                  next[idx] = { ...step, title: e.target.value }
                  setEditSteps(next)
                }}
                className="flex-1 text-xs px-2 py-1 rounded"
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  minHeight: 'unset',
                }}
              />
              <button
                onClick={() => setEditSteps(editSteps.filter((_, i) => i !== idx))}
                className="p-0.5 rounded"
                style={{ minHeight: 'unset', color: 'var(--color-text-secondary)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {/* Add new step inline */}
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={newStepTitle}
              onChange={e => setNewStepTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addStep() }}
              placeholder="Add a step..."
              className="flex-1 text-xs px-2 py-1 rounded"
              style={{
                border: '1px dashed var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                minHeight: 'unset',
              }}
            />
            <button
              onClick={addStep}
              disabled={!newStepTitle.trim()}
              className="p-0.5 rounded"
              style={{ minHeight: 'unset', color: 'var(--color-btn-primary-bg)', opacity: newStepTitle.trim() ? 1 : 0.3 }}
            >
              <Plus size={14} />
            </button>
          </div>
          {/* Save / Cancel */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={saveEdits}
              disabled={saving}
              className="text-[11px] font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[11px] px-2 py-0.5 rounded"
              style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Check if a routine section should display today based on its frequency rule.
 *
 * @param section          The routine section with frequency config
 * @param completedStepIds Step IDs completed TODAY (for rendering checkmarks)
 * @param weekCompletedStepIds Step IDs completed any day THIS WEEK (Mon→today).
 *   Used by show_until_complete to determine if a carry-forward section is done.
 *   Falls back to completedStepIds when not provided (backward compat).
 * @param routineActiveDays Union of all sections' frequency_days for the whole
 *   routine. show_until_complete only carries forward to days within this range,
 *   preventing Mon-Sat sections from bleeding into Sunday (or vice versa).
 */
export function isSectionActiveToday(
  section: RoutineSection,
  completedStepIds: Set<string>,
  weekCompletedStepIds?: Set<string>,
  routineActiveDays?: Set<number>,
): boolean {
  if (!section.frequency_rule || section.frequency_rule === 'daily') return true

  const today = new Date().getDay() // 0=Sun, 6=Sat

  // If the routine has a known active-day range and today is outside it,
  // show_until_complete does NOT carry forward. The section only shows on
  // its explicitly scheduled day(s).
  const todayInRoutineRange = !routineActiveDays || routineActiveDays.has(today)

  // Weekdays = Mon-Fri (days 1-5)
  if (section.frequency_rule === 'weekdays') {
    const isWeekday = today >= 1 && today <= 5
    if (isWeekday) return true
    if (section.show_until_complete && todayInRoutineRange) {
      const doneSet = weekCompletedStepIds ?? completedStepIds
      const allDone = section.steps.every(s => doneSet.has(s.id))
      return !allDone
    }
    return false
  }

  const days = section.frequency_days?.map(Number) ?? []

  if (section.frequency_rule === 'custom' && days.length) {
    const isScheduledToday = days.includes(today)
    if (isScheduledToday) return true

    if (section.show_until_complete && todayInRoutineRange) {
      const doneSet = weekCompletedStepIds ?? completedStepIds
      const allDone = section.steps.every(s => doneSet.has(s.id))
      if (allDone) return false

      const todayNorm = today === 0 ? 7 : today
      const hasPassedScheduledDay = days.some(d => {
        const dNorm = d === 0 ? 7 : d
        return todayNorm > dNorm
      })
      return hasPassedScheduledDay
    }
    return false
  }

  if (section.frequency_rule === 'specific_days' && days.length) {
    return days.includes(today)
  }

  return true
}

/**
 * Derive the union of all frequency_days across a routine's sections.
 * Used to bound show_until_complete carry-forward to the routine's active range.
 */
export function deriveRoutineActiveDays(sections: RoutineSection[]): Set<number> {
  const days = new Set<number>()
  for (const s of sections) {
    if (!s.frequency_rule || s.frequency_rule === 'daily') {
      // daily = all 7 days, so no bounding effect
      return new Set([0, 1, 2, 3, 4, 5, 6])
    }
    if (s.frequency_rule === 'weekdays') {
      for (let d = 1; d <= 5; d++) days.add(d)
    }
    if (s.frequency_days) {
      for (const d of s.frequency_days) days.add(Number(d))
    }
  }
  return days
}

// ─── Main Component ─────────────────────────────────────────

function useTaskAssignees(taskId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['task-assignees', taskId],
    queryFn: async () => {
      if (!taskId) return []
      const { data, error } = await supabase
        .from('task_assignments')
        .select('family_member_id, family_members!inner(id, display_name, assigned_color, member_color)')
        .eq('task_id', taskId)
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []).map(row => {
        const fm = row.family_members as unknown as {
          id: string; display_name: string; assigned_color: string | null; member_color: string | null
        }
        return fm
      })
    },
    enabled: !!taskId && enabled,
    staleTime: 5 * 60 * 1000,
  })
}

interface RoutineStepChecklistProps {
  taskId: string
  templateId: string
  memberId: string
  compact?: boolean
  isShared?: boolean
}

export function RoutineStepChecklist({ taskId, templateId, memberId, compact, isShared }: RoutineStepChecklistProps) {
  const shared = isShared ?? false
  const { data: sections, isLoading } = useRoutineTemplateSteps(templateId)
  const { data: completions } = useRoutineStepCompletions(taskId, memberId)
  const { data: weekCompletions } = useRoutineStepCompletionsThisWeek(taskId, memberId)
  const { data: sharedCompletions } = useSharedRoutineStepCompletions(taskId, shared)
  const { data: sharedWeekCompletions } = useSharedRoutineStepCompletionsThisWeek(taskId, shared)
  const { data: assignees } = useTaskAssignees(taskId, shared)
  const completeStep = useCompleteRoutineStep()
  const uncompleteStep = useUncompleteRoutineStep()
  const logPractice = useLogPractice()
  const { data: family } = useFamily()
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null)
  const [stepTrackingMap, setStepTrackingMap] = useState<Record<string, LinkedSourceTracking>>({})
  const [durationPromptStepId, setDurationPromptStepId] = useState<string | null>(null)
  const { data: currentMember } = useFamilyMember()
  const queryClient = useQueryClient()
  const isMom = currentMember?.role === 'primary_parent'
  const canEdit = shared
    ? isMom
    : (isMom || currentMember?.role === 'additional_adult')
  const refreshSteps = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['routine-template-steps', templateId] })
  }, [queryClient, templateId])

  const stepCompleterMap = useMemo(() => {
    if (!shared || !sharedCompletions) return undefined
    const map = new Map<string, StepCompleterInfo>()
    for (const c of sharedCompletions) {
      if (!c.step_id) continue
      const completerId = c.family_member_id ?? c.member_id
      if (completerId === memberId) continue
      if (map.has(c.step_id)) continue
      const fm = assignees?.find(a => a.id === completerId)
      map.set(c.step_id, {
        memberId: completerId,
        memberName: fm?.display_name ?? 'Someone',
        memberColor: fm ? getMemberColor(fm) : '#6B7280',
      })
    }
    return map
  }, [shared, sharedCompletions, memberId, assignees])

  // For shared multi-instance steps: step_id → instance_number → completer info (all members)
  const sharedInstancesByStep = useMemo(() => {
    if (!shared || !sharedCompletions) return undefined
    const map = new Map<string, Map<number, StepCompleterInfo>>()
    for (const c of sharedCompletions) {
      if (!c.step_id) continue
      const completerId = c.family_member_id ?? c.member_id
      const instanceNum = c.instance_number ?? 1
      let stepMap = map.get(c.step_id)
      if (!stepMap) {
        stepMap = new Map()
        map.set(c.step_id, stepMap)
      }
      if (!stepMap.has(instanceNum)) {
        const fm = assignees?.find(a => a.id === completerId)
        stepMap.set(instanceNum, {
          memberId: completerId,
          memberName: fm?.display_name ?? 'Someone',
          memberColor: fm ? getMemberColor(fm) : '#6B7280',
        })
      }
    }
    return map
  }, [shared, sharedCompletions, assignees])

  const instancesByStep = useMemo(() => {
    const map = new Map<string, Set<number>>()
    for (const c of (completions ?? [])) {
      if (c.step_id) {
        const set = map.get(c.step_id) ?? new Set<number>()
        set.add(c.instance_number ?? 1)
        map.set(c.step_id, set)
      }
    }
    return map
  }, [completions])

  const routineActiveDays = useMemo(() => deriveRoutineActiveDays(sections ?? []), [sections])

  if (isLoading) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Loading steps...
      </div>
    )
  }

  if (!sections?.length) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        No steps configured
      </div>
    )
  }

  // Today's completions — used for rendering checkmarks on steps.
  // Migration 100177 (Convention #259): step_id is NULL on completions whose
  // step was deleted by a structural template edit. Filter NULLs out so the
  // Set<string> contract holds — orphan completions can't match any live step.
  const completedStepIds = new Set(
    (completions ?? [])
      .map(c => c.step_id)
      .filter((id): id is string => id !== null),
  )
  const weekSource = shared ? sharedWeekCompletions : weekCompletions
  const weekCompletedStepIds = new Set(
    (weekSource ?? [])
      .map(c => c.step_id)
      .filter((id): id is string => id !== null),
  )

  async function handleToggleInstance(stepId: string, instanceNumber: number, isCurrentlyCompleted: boolean) {
    setTogglingStepId(stepId)
    try {
      if (isCurrentlyCompleted) {
        await uncompleteStep.mutateAsync({
          taskId,
          stepId,
          memberId,
          instanceNumber,
        })
      } else {
        await completeStep.mutateAsync({
          task_id: taskId,
          step_id: stepId,
          member_id: memberId,
          period_date: todayLocalIso(),
          instance_number: instanceNumber,
        })
      }
    } catch (err) {
      console.error('Failed to toggle instance:', err)
    } finally {
      setTogglingStepId(null)
    }
  }

  async function handleToggleStep(stepId: string, isCurrentlyCompleted: boolean) {
    const otherCompleter = stepCompleterMap?.get(stepId)
    const uncompleteTarget = otherCompleter && isMom ? otherCompleter.memberId : memberId

    setTogglingStepId(stepId)
    try {
      if (isCurrentlyCompleted) {
        await uncompleteStep.mutateAsync({
          taskId,
          stepId,
          memberId: uncompleteTarget,
        })
      } else {
        await completeStep.mutateAsync({
          task_id: taskId,
          step_id: stepId,
          member_id: memberId,
          period_date: todayLocalIso(),
        })

        // Daily Progress Marking: for linked steps, also write to practice_log.
        if (family?.id) {
          const step = (sections ?? []).flatMap(s => s.steps).find(s => s.id === stepId)
          if (step && step.step_type !== 'static' && step.linked_source_id) {
            const tracking = stepTrackingMap[stepId]
            if (tracking?.trackDuration) {
              setDurationPromptStepId(stepId)
            } else {
              logPractice.mutate({
                familyId: family.id,
                familyMemberId: memberId,
                sourceType: 'routine_step',
                sourceId: stepId,
                durationMinutes: null,
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle step:', err)
    } finally {
      setTogglingStepId(null)
    }
  }

  function handleDurationSubmit(durationMinutes: number | null) {
    if (!durationPromptStepId || !family?.id) return
    logPractice.mutate({
      familyId: family.id,
      familyMemberId: memberId,
      sourceType: 'routine_step',
      sourceId: durationPromptStepId,
      durationMinutes,
    })
    setDurationPromptStepId(null)
  }

  async function handleReattribute(stepId: string, fromMemberId: string, toMemberId: string) {
    if (fromMemberId === toMemberId) return
    setTogglingStepId(stepId)
    try {
      await uncompleteStep.mutateAsync({ taskId, stepId, memberId: fromMemberId })
      await completeStep.mutateAsync({
        task_id: taskId,
        step_id: stepId,
        member_id: toMemberId,
        period_date: todayLocalIso(),
      })
    } catch (err) {
      console.error('Failed to reattribute step:', err)
    } finally {
      setTogglingStepId(null)
    }
  }

  const activeSections = sections.filter(
    s =>
      s.steps.length > 0 &&
      isSectionActiveToday(s, completedStepIds, weekCompletedStepIds, routineActiveDays),
  )
  const showHeaders = !compact || activeSections.length > 1

  if (activeSections.length === 0) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        No steps for today
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {shared && assignees && assignees.length > 0 && (
        <SharedWithHeader members={assignees} currentMemberId={memberId} />
      )}

      {activeSections.map(section => (
        showHeaders ? (
          <SectionGroup
            key={section.id}
            section={section}
            taskId={taskId}
            memberId={memberId}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
            togglingStepId={togglingStepId}
            canEdit={!!canEdit}
            onStepsChanged={refreshSteps}
            onTrackingResolved={(stepId, t) => setStepTrackingMap(prev => ({ ...prev, [stepId]: t }))}
            stepCompleterMap={stepCompleterMap}
            isMom={isMom}
            instancesByStep={instancesByStep}
            onToggleInstance={handleToggleInstance}
            sharedInstancesByStep={sharedInstancesByStep}
            onReattribute={isMom && shared ? handleReattribute : undefined}
            assignees={assignees}
          />
        ) : (
          <div key={section.id}>
            {section.steps.map(step => {
              const otherCompleter = stepCompleterMap?.get(step.id)
              const myCompletion = completedStepIds.has(step.id)
              const isMulti = (step.instance_count ?? 1) > 1
              const sharedInstances = sharedInstancesByStep?.get(step.id)
              const allInstancesClaimed = isMulti && sharedInstances && sharedInstances.size >= (step.instance_count ?? 1)
              const isReadOnly = isMulti
                ? (!!allInstancesClaimed && !isMom)
                : (!!otherCompleter && !isMom)
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  taskId={taskId}
                  memberId={memberId}
                  isCompleted={myCompletion && !otherCompleter}
                  onToggle={() => handleToggleStep(step.id, myCompletion || !!otherCompleter)}
                  toggling={togglingStepId === step.id}
                  onTrackingResolved={(stepId, t) => setStepTrackingMap(prev => ({ ...prev, [stepId]: t }))}
                  completedByOther={otherCompleter}
                  readOnly={isReadOnly}
                  completedInstances={instancesByStep.get(step.id)}
                  onToggleInstance={(n, done) => handleToggleInstance(step.id, n, done)}
                  sharedInstanceCompleters={sharedInstances}
                  isMom={isMom}
                  onReattribute={isMom && shared ? (from, to) => handleReattribute(step.id, from, to) : undefined}
                  assignees={assignees}
                />
              )
            })}
          </div>
        )
      ))}

      {/* View this week link for shared routines (mom only) */}
      {shared && isMom && (
        <a
          href={`/settings/allowance/${memberId}/history`}
          className="text-[10px] mt-1 self-end hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          View this week →
        </a>
      )}

      {/* Daily Progress Marking: duration prompt for linked steps */}
      <DurationPromptModal
        isOpen={!!durationPromptStepId}
        onClose={() => setDurationPromptStepId(null)}
        onSubmit={handleDurationSubmit}
      />
    </div>
  )
}
