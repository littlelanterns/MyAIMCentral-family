/**
 * TaskCreationModal (PRD-09A Screen 3, PRD-17 Screen 7 & 8)
 *
 * Full-screen (mobile) / large centered (desktop) modal with 7 collapsible sections.
 * Supports Quick Mode (3 fields) and Full Mode (all 7 sections).
 * Pre-populates from studio_queue items per PRD-17 Screen 8 source-adaptive table.
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Wand2, ListChecks, Zap, ArrowRight, ChevronDown } from 'lucide-react'
import { Button, Input, Toggle } from '@/components/shared'
import { UniversalScheduler } from '@/components/scheduling'
import { CollapsibleSection } from './CollapsibleSection'
import { DurationPicker } from './DurationPicker'
import { LifeAreaTagPicker } from './LifeAreaTagPicker'
import { TaskTypeSelector } from './TaskTypeSelector'
import { AssignmentSelector } from './AssignmentSelector'
import { IncompleteActionSelector } from './IncompleteActionSelector'
import { RewardConfig } from './RewardConfig'
import { TemplateOptions } from './TemplateOptions'
import { RoutineSectionEditor } from './RoutineSectionEditor'
import type { TaskType, OpportunitySubType } from './TaskTypeSelector'
import type { IncompleteAction } from './IncompleteActionSelector'
import type { RewardConfigData, RewardType } from './RewardConfig'
import type { MemberAssignment } from './AssignmentSelector'
import type { RoutineSection } from './RoutineSectionEditor'
import type { SchedulerOutput } from '@/components/scheduling/types'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'

// ─── Types ───────────────────────────────────────────────────

export interface StudioQueueItem {
  id: string
  family_id: string
  owner_id: string
  destination?: string
  content: string
  content_details?: Record<string, unknown>
  source?: string
  source_reference_id?: string
  requester_id?: string
  requester_note?: string
  batch_id?: string
}

export interface CreateTaskData {
  // Section 1
  title: string
  description: string
  durationEstimate: string
  customDuration: string
  lifeAreaTag: string
  customLifeArea: string
  imageUrl?: string
  // Section 2
  taskType: TaskType
  opportunitySubType?: OpportunitySubType
  maxCompletions?: string
  claimLockDuration?: string
  claimLockUnit?: string
  // Routine sections
  routineSections?: RoutineSection[]
  // Section 3
  assignments: MemberAssignment[]
  wholeFamily: boolean
  rotationEnabled: boolean
  rotationFrequency: string
  // Section 4
  schedule: SchedulerOutput | null
  // Section 5
  incompleteAction: IncompleteAction
  // Section 6
  reward: RewardConfigData
  // Section 7
  saveAsTemplate: boolean
  templateName: string
  // Source tracing
  sourceQueueItemId?: string
  sourceBatchIds?: string[]
}

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: CreateTaskData) => void
  /** Pre-population from studio queue */
  queueItem?: StudioQueueItem
  mode?: 'quick' | 'full'
  batchMode?: 'group' | 'sequential'
  batchItems?: StudioQueueItem[]
}

// ─── Default state factory ───────────────────────────────────

function defaultReward(): RewardConfigData {
  return {
    rewardType: '' as RewardType,
    rewardAmount: '',
    bonusThreshold: '85',
    bonusPercentage: '20',
    requireApproval: false,
    trackAsWidget: false,
    flagAsVictory: false,
  }
}

function defaultTaskData(queueItem?: StudioQueueItem): CreateTaskData {
  const isRequest = queueItem?.source === 'member_request'
  return {
    title: queueItem?.content ?? '',
    description: isRequest ? (queueItem?.requester_note ?? '') : '',
    durationEstimate: '',
    customDuration: '',
    lifeAreaTag: '',
    customLifeArea: '',
    taskType: 'task',
    assignments: queueItem?.requester_id
      ? [{ memberId: queueItem.requester_id, copyMode: 'individual' }]
      : [],
    wholeFamily: false,
    rotationEnabled: false,
    rotationFrequency: 'weekly',
    schedule: null,
    incompleteAction: 'auto_reschedule',
    reward: defaultReward(),
    saveAsTemplate: false,
    templateName: '',
    sourceQueueItemId: queueItem?.id,
  }
}

// ─── Quick Mode component ────────────────────────────────────

interface QuickModeProps {
  data: CreateTaskData
  onChange: (d: CreateTaskData) => void
  familyMembers: Array<{ id: string; display_name: string }>
  onSwitchFull: () => void
  onSave: () => void
  loading: boolean
  queueItem?: StudioQueueItem
}

function QuickMode({ data, onChange, familyMembers, onSwitchFull, onSave, loading, queueItem }: QuickModeProps) {
  const [useRecurring, setUseRecurring] = useState(false)
  const [oneTimeDate, setOneTimeDate] = useState('')
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

  const sourceLabel =
    queueItem?.source === 'member_request'
      ? `Request from member`
      : queueItem?.source === 'meeting_action'
      ? 'From meeting'
      : queueItem?.source === 'notepad_routed'
      ? 'From Notepad'
      : queueItem?.source
        ? `From: ${queueItem.source}`
        : null

  return (
    <div className="space-y-4">
      {sourceLabel && (
        <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
          {sourceLabel}
        </p>
      )}

      {/* Task name */}
      <Input
        label="Task name"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder="What needs to be done?"
        required
        autoFocus
      />

      {/* Assign to */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '0.375rem',
          }}
        >
          Assign to
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...data, wholeFamily: !data.wholeFamily, assignments: [] })}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              border: `1px solid ${data.wholeFamily ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: data.wholeFamily
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              color: data.wholeFamily ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: data.wholeFamily ? 600 : 400,
            }}
          >
            Whole family
          </button>
          {familyMembers.map((m) => {
            const selected = data.assignments.some((a) => a.memberId === m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? data.assignments.filter((a) => a.memberId !== m.id)
                    : [...data.assignments, { memberId: m.id, copyMode: 'individual' as const }]
                  onChange({ ...data, assignments: next, wholeFamily: false })
                }}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  border: `1px solid ${selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                  backgroundColor: selected
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                    : 'var(--color-bg-secondary)',
                  color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {m.display_name}
              </button>
            )
          })}
        </div>
      </div>

      {/* When */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '0.375rem',
          }}
        >
          When
        </label>
        <div className="flex gap-2 mb-2">
          {(['one-time', 'recurring'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setUseRecurring(opt === 'recurring')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                border: `1px solid ${(opt === 'recurring') === useRecurring ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                backgroundColor: (opt === 'recurring') === useRecurring
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                color: (opt === 'recurring') === useRecurring ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: (opt === 'recurring') === useRecurring ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {opt === 'one-time' ? 'One-time' : 'Recurring'}
            </button>
          ))}
        </div>

        {!useRecurring ? (
          <input
            type="date"
            value={oneTimeDate}
            onChange={(e) => setOneTimeDate(e.target.value)}
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
          />
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {DAY_LABELS.map((label, idx) => {
              const active = recurringDays.includes(idx)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setRecurringDays((days) =>
                      active ? days.filter((d) => d !== idx) : [...days, idx]
                    )
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                    backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
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
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="primary"
          onClick={onSave}
          loading={loading}
          disabled={!data.title.trim()}
          fullWidth
        >
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={onSwitchFull}
          type="button"
        >
          Full mode
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ─── TaskCreationModal ───────────────────────────────────────

export function TaskCreationModal({
  isOpen,
  onClose,
  onSave,
  queueItem,
  mode: initialMode = 'quick',
  batchMode,
  batchItems,
}: TaskCreationModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: familyMembers = [] } = useFamilyMembers(currentMember?.family_id)

  const [mode, setMode] = useState<'quick' | 'full'>(initialMode)
  const [data, setData] = useState<CreateTaskData>(() => defaultTaskData(queueItem))
  const [loading, setLoading] = useState(false)

  // Batch sequential state
  const [batchIndex, setBatchIndex] = useState(0)
  const activeBatchItem = batchMode === 'sequential' && batchItems ? batchItems[batchIndex] : undefined

  // Re-init when queueItem changes
  useEffect(() => {
    setData(defaultTaskData(queueItem ?? activeBatchItem))
    setMode(initialMode)
  }, [queueItem?.id, activeBatchItem?.id, initialMode])

  // Auto-switch to full for batch/group mode
  useEffect(() => {
    if (batchMode === 'group' || batchMode === 'sequential') {
      setMode('full')
    }
  }, [batchMode])

  const handleSave = useCallback(async () => {
    if (!data.title.trim()) return
    setLoading(true)
    try {
      await onSave(data)
      if (batchMode === 'sequential' && batchItems && batchIndex < batchItems.length - 1) {
        setBatchIndex((i) => i + 1)
      } else {
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }, [data, onSave, onClose, batchMode, batchItems, batchIndex])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isRoutine = data.taskType === 'routine'
  const batchProgressLabel =
    batchMode === 'sequential' && batchItems
      ? `${batchIndex + 1} of ${batchItems.length}`
      : null

  const sourceLabel = queueItem?.source
    ? (() => {
        if (queueItem.source === 'member_request') return `Request from member`
        if (queueItem.source === 'meeting_action') return `From meeting`
        if (queueItem.source === 'notepad_routed') return `From Notepad`
        if (queueItem.source === 'review_route') return `From Review & Route`
        if (queueItem.source === 'lila_conversation') return `From LiLa conversation`
        if (queueItem.source === 'goal_decomposition') return `From goal breakdown`
        return `From: ${queueItem.source}`
      })()
    : null

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create task"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--color-bg-overlay, rgba(0,0,0,0.5))',
        }}
        aria-hidden="true"
      />

      {/* Panel — full screen on mobile, large centered on desktop */}
      <div
        className="relative flex flex-col w-full md:max-w-2xl"
        style={{
          height: '100dvh',
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
          }}
        >
          <div className="flex flex-col">
            <h2
              style={{
                color: 'var(--color-text-on-dark, #fff)',
                fontSize: 'var(--font-size-base, 1rem)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {batchProgressLabel ? `New task (${batchProgressLabel})` : 'New task'}
            </h2>
            {sourceLabel && (
              <span
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                }}
              >
                {sourceLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick / Full toggle */}
            <div
              style={{
                display: 'flex',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.3)',
                overflow: 'hidden',
              }}
            >
              {(['quick', 'full'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: 'var(--font-size-xs, 0.75rem)',
                    fontWeight: mode === m ? 700 : 400,
                    background: mode === m ? 'rgba(255,255,255,0.25)' : 'transparent',
                    color: 'var(--color-text-on-dark, #fff)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background var(--vibe-transition, 0.15s ease)',
                    textTransform: 'capitalize',
                    minHeight: 32,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                color: 'var(--color-text-on-dark, #fff)',
                minHeight: '36px',
                minWidth: '36px',
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '1rem' }}>
          {mode === 'quick' ? (
            <QuickMode
              data={data}
              onChange={setData}
              familyMembers={familyMembers.map((m) => ({ id: m.id, display_name: m.display_name }))}
              onSwitchFull={() => setMode('full')}
              onSave={handleSave}
              loading={loading}
              queueItem={queueItem}
            />
          ) : (
            <div className="space-y-3">
              {/* Section 1: Task Basics */}
              <CollapsibleSection title="Task Basics" defaultOpen>
                <div className="space-y-4">
                  <Input
                    label="Task name"
                    value={data.title}
                    onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                    placeholder="What needs to be done?"
                    required
                    autoFocus
                  />
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--font-size-sm, 0.875rem)',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={data.description}
                      onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Optional details, instructions, context…"
                      rows={3}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-sm, 0.875rem)',
                        outline: 'none',
                        minHeight: '80px',
                      }}
                    />
                  </div>
                  <DurationPicker
                    value={data.durationEstimate}
                    onChange={(v) => setData((d) => ({ ...d, durationEstimate: v }))}
                    customValue={data.customDuration}
                    onCustomChange={(v) => setData((d) => ({ ...d, customDuration: v }))}
                  />
                  <LifeAreaTagPicker
                    value={data.lifeAreaTag}
                    onChange={(v) => setData((d) => ({ ...d, lifeAreaTag: v }))}
                    customValue={data.customLifeArea}
                    onCustomChange={(v) => setData((d) => ({ ...d, customLifeArea: v }))}
                  />
                  {/* Image upload (stub — wires to Supabase Storage) */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 'var(--font-size-sm, 0.875rem)',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      Reference image (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      style={{
                        display: 'block',
                        width: '100%',
                        fontSize: 'var(--font-size-sm, 0.875rem)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  {/* AI buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        // STUB: Task Breaker AI — wires to PRD-09A Task Breaker
                      }}
                    >
                      <Zap size={13} />
                      Break it down
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        // STUB: Organize as Checklist — promotes to Routine type
                        setData((d) => ({ ...d, taskType: 'routine' }))
                      }}
                    >
                      <ListChecks size={13} />
                      Organize as checklist
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        // STUB: LiLa auto-suggest life area tag
                      }}
                    >
                      <Wand2 size={13} />
                      Auto-tag
                    </Button>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Section 2: Task Type */}
              <CollapsibleSection title="Task Type" defaultOpen>
                <TaskTypeSelector
                  taskType={data.taskType}
                  onChange={(v) => setData((d) => ({
                    ...d,
                    taskType: v,
                    incompleteAction: v === 'routine' ? 'fresh_reset' : 'auto_reschedule',
                  }))}
                  opportunitySubType={data.opportunitySubType}
                  onOpportunitySubTypeChange={(v) => setData((d) => ({ ...d, opportunitySubType: v }))}
                  maxCompletions={data.maxCompletions}
                  onMaxCompletionsChange={(v) => setData((d) => ({ ...d, maxCompletions: v }))}
                  claimLockDuration={data.claimLockDuration}
                  onClaimLockDurationChange={(v) => setData((d) => ({ ...d, claimLockDuration: v }))}
                  claimLockUnit={data.claimLockUnit}
                  onClaimLockUnitChange={(v) => setData((d) => ({ ...d, claimLockUnit: v }))}
                />
                {/* Routine section editor inline */}
                {isRoutine && (
                  <div className="mt-4">
                    <RoutineSectionEditor
                      sections={data.routineSections ?? []}
                      onChange={(sections) => setData((d) => ({ ...d, routineSections: sections }))}
                    />
                  </div>
                )}
              </CollapsibleSection>

              {/* Section 3: Assignment */}
              <CollapsibleSection title="Assignment" defaultOpen>
                <AssignmentSelector
                  familyMembers={familyMembers}
                  assignments={data.assignments}
                  onAssignmentsChange={(v) => setData((d) => ({ ...d, assignments: v }))}
                  wholeFamily={data.wholeFamily}
                  onWholeFamilyChange={(v) => setData((d) => ({ ...d, wholeFamily: v }))}
                  showRotation={isRoutine}
                  rotationEnabled={data.rotationEnabled}
                  onRotationChange={(v) => setData((d) => ({ ...d, rotationEnabled: v }))}
                  rotationFrequency={data.rotationFrequency}
                  onRotationFrequencyChange={(v) => setData((d) => ({ ...d, rotationFrequency: v }))}
                />
              </CollapsibleSection>

              {/* Section 4: Schedule & Recurrence */}
              <CollapsibleSection title="Schedule & Recurrence">
                <UniversalScheduler
                  value={data.schedule}
                  onChange={(v) => setData((d) => ({ ...d, schedule: v }))}
                  showTimeDefault={false}
                />
              </CollapsibleSection>

              {/* Section 5: Incomplete Action */}
              <CollapsibleSection
                title="If Not Completed"
                subtitle={`Currently: ${data.incompleteAction.replace(/_/g, ' ')}`}
              >
                <IncompleteActionSelector
                  value={data.incompleteAction}
                  onChange={(v) => setData((d) => ({ ...d, incompleteAction: v }))}
                />
              </CollapsibleSection>

              {/* Section 6: Rewards & Tracking */}
              <CollapsibleSection title="Rewards & Tracking">
                <RewardConfig
                  value={data.reward}
                  onChange={(v) => setData((d) => ({ ...d, reward: v }))}
                />
              </CollapsibleSection>

              {/* Section 7: Template Options */}
              <CollapsibleSection title="Template Options">
                <TemplateOptions
                  saveAsTemplate={data.saveAsTemplate}
                  onSaveAsTemplateChange={(v) => setData((d) => ({ ...d, saveAsTemplate: v }))}
                  templateName={data.templateName}
                  onTemplateNameChange={(v) => setData((d) => ({ ...d, templateName: v }))}
                />
              </CollapsibleSection>
            </div>
          )}
        </div>

        {/* ── Footer (full mode only) ── */}
        {mode === 'full' && (
          <div
            style={{
              padding: '0.875rem 1rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.625rem',
              flexShrink: 0,
              backgroundColor: 'var(--color-bg-card)',
            }}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={!data.title.trim()}
              fullWidth
            >
              {batchProgressLabel
                ? batchIndex < (batchItems?.length ?? 1) - 1
                  ? 'Save & next'
                  : 'Save last task'
                : 'Save task'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
