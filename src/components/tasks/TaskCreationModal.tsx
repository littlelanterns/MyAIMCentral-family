/**
 * TaskCreationModal (PRD-09A Screen 3, PRD-17 Screen 7 & 8)
 *
 * REDESIGNED: Linear, full-width, section-card form following
 * specs/TaskCreationModal-Redesign-Spec.md exactly.
 *
 * Uses ModalV2 (persistent, lg) with gradient header.
 * Section cards, radio buttons with descriptions, checkbox assignment rows.
 * Quick Mode toggle, TaskBreaker preview, expandable "Types Explained".
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText, Layers, Users, Calendar, AlertCircle, Gift, ChevronDown, ChevronUp,
  CheckSquare, RotateCcw, Star, TrendingUp, ListChecks, X, GripVertical, Sparkles, RefreshCw,
} from 'lucide-react'
import { Button, ModalV2, Toggle, Tooltip } from '@/components/shared'
import { UniversalScheduler, PickDatesAssigneeEditor } from '@/components/scheduling'
import { getMemberColor } from '@/lib/memberColors'
import { RoutineSectionEditor } from './RoutineSectionEditor'
import { TaskBreaker } from './TaskBreaker'
import type { BrokenTask } from './TaskBreaker'
import { DurationPicker } from './DurationPicker'
import { LifeAreaTagPicker } from './LifeAreaTagPicker'
import type { TaskType, OpportunitySubType } from './TaskTypeSelector'
import type { IncompleteAction } from './IncompleteActionSelector'
import type { RewardConfigData, RewardType } from './RewardConfig'
import type { MemberAssignment } from './AssignmentSelector'
import type { RoutineSection } from './RoutineSectionEditor'
import type { SchedulerOutput } from '@/components/scheduling/types'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useCanAccess } from '@/lib/permissions/useCanAccess'
import { useHomeschoolSubjects } from '@/hooks/useHomeschool'
import { TaskIconPicker } from './TaskIconPicker'
import { AttachRevealSection } from '@/components/reward-reveals/AttachRevealSection'
import { BulkAddWithAI } from '@/components/shared/BulkAddWithAI'
import type { ParsedBulkItem } from '@/components/shared/BulkAddWithAI'
import { useTaskIconSuggestions } from '@/hooks/useTaskIconSuggestions'
import type { TaskIconSuggestion } from '@/types/play-dashboard'
// Worker ROUTINE-PROPAGATION (c2.5, founder D5): pre-check overlap
// against existing routine deployments before save. The DB trigger
// is the backstop; this is the warm UI path so mom never sees a raw
// 23-class Postgres error.
import {
  detectRoutineOverlap,
  type RoutineOverlapCandidate,
} from '@/lib/templates/detectRoutineOverlap'
import {
  RoutineOverlapResolutionModal,
  type RoutineOverlapChoice,
} from '@/components/templates/RoutineOverlapResolutionModal'
// Worker ROUTINE-PROPAGATION (c3, founder D3): master-template edit
// confirmation. When mom saves an edit to a routine template that is
// currently deployed to N family members, surface the count + names
// so she knows exactly who is affected. Past completions stay as-is.
import {
  getActiveTemplateDeployments,
  distinctAssigneeNames,
  formatNameList,
  type ActiveDeployment,
} from '@/lib/templates/getActiveTemplateDeployments'
import { MasterTemplateEditConfirmationModal } from '@/components/templates/MasterTemplateEditConfirmationModal'
// Worker ROUTINE-PROPAGATION (c6): post-save success toasts. Reuses
// the existing RoutingToastProvider — no new toast infrastructure.
// Anti-panic UX: every routine-template save path now confirms what
// actually happened so mom doesn't have to wonder.
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { fetchFamilyToday } from '@/hooks/useFamilyToday'
import { supabase } from '@/lib/supabase/client'

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
  title: string
  description: string
  durationEstimate: string
  customDuration: string
  lifeAreaTag: string
  customLifeArea: string
  imageUrl?: string
  taskType: TaskType
  opportunitySubType?: OpportunitySubType
  maxCompletions?: string
  claimLockDuration?: string
  claimLockUnit?: string
  routineSections?: RoutineSection[]
  assignments: MemberAssignment[]
  wholeFamily: boolean
  /** When 2+ assigned: 'any' = shared task (anyone can complete), 'each' = individual copies */
  assignMode: 'any' | 'each'
  rotationEnabled: boolean
  rotationFrequency: string
  schedule: SchedulerOutput | null
  incompleteAction: IncompleteAction
  reward: RewardConfigData
  // List task type fields
  listSource?: 'existing' | 'new' | 'image'
  linkedListId?: string
  listDeliveryMode?: 'checklist' | 'batch' | 'sequential'
  newListName?: string
  newListItems?: string[]
  /** Due date for one-time tasks (YYYY-MM-DD) */
  dueDate?: string
  /**
   * Worker ROUTINE-PROPAGATION (c2, founder D2): scheduled start date for
   * routines. When set, the deployed task's recurrence_details.dtstart is
   * written to this value so recurringTaskFilter hides the routine until
   * the date arrives. When undefined, buildTaskScheduleFields falls back
   * to familyToday (today in the family's timezone) so the routine is
   * active immediately.
   */
  startDate?: string
  /** Quick schedule mode selected in the modal */
  scheduleMode?: 'one_time' | 'daily' | 'weekly' | 'custom'
  /** Weekday numbers for weekly recurrence (0=Sun, 1=Mon, ..., 6=Sat) */
  weeklyDays?: number[]
  saveAsTemplate: boolean
  templateName: string
  /** When true, saves only the routine template (task_templates + sections + steps)
   *  without creating any task rows. Used for "Save to Studio" flow. */
  templateOnly?: boolean
  /** When editing an existing template, this ID triggers UPDATE instead of INSERT */
  editingTemplateId?: string | null
  /** When deploying from Studio, link to existing template without creating/modifying it */
  deployFromTemplateId?: string | null
  sourceQueueItemId?: string
  sourceBatchIds?: string[]
  /** Source feature that created this task (e.g. 'bookshelf', 'notepad_routed') */
  source?: string
  /** ID of the specific item that created this task (e.g. bookshelf_action_steps.id) */
  sourceReferenceId?: string
  /** Task Breaker AI-generated subtasks to create as child tasks after parent is saved */
  taskBreakerSubtasks?: BrokenTask[]
  /** Detail level used for Task Breaker generation */
  taskBreakerLevel?: 'quick' | 'detailed' | 'granular'
  /**
   * Build M Sub-phase B (PRD-24+PRD-26): paper-craft icon for Play tile rendering.
   * Soft reference to platform_assets — written to tasks.icon_asset_key /
   * tasks.icon_variant. Only set when at least one assignee is a Play member;
   * NULL otherwise. The picker auto-suggests the top match if mom never
   * interacts with it.
   */
  iconAssetKey?: string | null
  iconVariant?: 'A' | 'B' | 'C' | null
  // PRD-28: Task-level tracking flags
  countsForAllowance?: boolean
  countsForHomework?: boolean
  countsForGamification?: boolean
  allowancePoints?: number | null
  // PRD-28 NEW-EE: Extra credit designation (gated by countsForAllowance=true)
  isExtraCredit?: boolean
  // PRD-28: Per-task subject assignment for auto time logging on completion
  homeworkSubjectIds?: string[]
  // Reward Reveals: attached celebration config
  rewardRevealConfig?: import('@/components/reward-reveals/AttachRevealSection').RevealAttachmentConfig | null
}

interface TaskCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: CreateTaskData) => void
  queueItem?: StudioQueueItem
  mode?: 'quick' | 'full'
  batchMode?: 'group' | 'sequential'
  batchItems?: StudioQueueItem[]
  initialTaskType?: string
  /** Pre-fill title (e.g. from BookShelf action step) */
  defaultTitle?: string
  /** Pre-fill description (e.g. from BookShelf extraction) */
  defaultDescription?: string
  /** Track which source item created this task (e.g. bookshelf extraction ID) */
  sourceReferenceId?: string
  /** When true, modal shows "Edit Task" header and save button says "Save Changes" */
  editMode?: boolean
  /** PRD-28: Pre-configure as makeup work (task_type='makeup', counts_for_allowance=true, counts_for_gamification=false) */
  makeupConfig?: { assigneeId: string } | null
  /** Pre-loaded routine sections from a saved template (Studio Deploy/Edit) */
  initialRoutineSections?: RoutineSection[]
  /** When editing an existing routine template, pass its ID to UPDATE instead of INSERT */
  editingTemplateId?: string | null
  /** Existing task field values to hydrate on edit — prevents resetting to defaults */
  editTaskValues?: {
    incompleteAction?: string
    lifeAreaTag?: string
    durationEstimate?: string
    dueDate?: string
    requireApproval?: boolean
    victoryFlagged?: boolean
    countsForAllowance?: boolean
    countsForHomework?: boolean
    countsForGamification?: boolean
    isExtraCredit?: boolean
    recurrenceRule?: string
    recurrenceDetails?: Record<string, unknown> | null
    /** Worker ROUTINE-PROPAGATION (c2): hydrate the "Schedule to start later"
     *  toggle from an existing task. Read by callers from
     *  recurrence_details.dtstart on the live tasks row. */
    startDate?: string
  } | null
  /** When deploying from Studio, pass the source template ID to link (not duplicate) */
  deployFromTemplateId?: string | null
}

// ─── Defaults ────────────────────────────────────────────────

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
    opportunitySubType: 'repeatable',
    maxCompletions: '',
    claimLockDuration: '',
    claimLockUnit: 'hours',
    assignments: queueItem?.requester_id
      ? [{ memberId: queueItem.requester_id, copyMode: 'individual' }]
      : [],
    wholeFamily: false,
    assignMode: 'each',
    rotationEnabled: false,
    rotationFrequency: 'weekly',
    schedule: null,
    incompleteAction: 'auto_reschedule',
    reward: defaultReward(),
    listSource: 'new',
    listDeliveryMode: 'checklist',
    newListName: '',
    newListItems: [],
    saveAsTemplate: false,
    templateName: '',
    sourceQueueItemId: queueItem?.id,
    // PRD-28: default tracking flags
    countsForAllowance: false,
    countsForHomework: false,
    countsForGamification: true, // default checked — preserves current behavior
    isExtraCredit: false, // NEW-EE: opt-in only, gated by countsForAllowance
    homeworkSubjectIds: [],
  }
}

// ─── Constants ───────────────────────────────────────────────

const TASK_TYPES_GRID: {
  key: TaskType
  label: string
  description: string
  icon: React.ComponentType<{ size: number }>
}[] = [
  { key: 'task', label: 'Task', description: 'One-time or recurring responsibility', icon: CheckSquare },
  { key: 'routine', label: 'Routine', description: 'Multi-step checklist — paste a schedule and AI sorts it by day', icon: RotateCcw },
  { key: 'opportunity' as TaskType, label: 'Opportunity', description: 'Optional — earn rewards, no pressure', icon: Star },
  { key: 'habit', label: 'Habit', description: 'Track consistency over time', icon: TrendingUp },
]

const LIST_TYPE = {
  key: 'list' as TaskType,
  label: 'List',
  description: 'Assign a checklist or ordered series of items',
  icon: ListChecks,
}

const LIST_DELIVERY_MODES = [
  { key: 'checklist' as const, label: 'Checklist', description: 'Assign as one task with a checklist (all items visible, check off as you go)' },
  { key: 'batch' as const, label: 'Batch', description: 'Each item becomes its own task (all assigned at once as individual tasks)' },
  { key: 'sequential' as const, label: 'Sequential', description: 'Items drip-feed 1-2 at a time (next item appears when the current one is done)' },
]

const OPP_SUBTYPES: { value: OpportunitySubType; label: string; description: string }[] = [
  {
    value: 'repeatable',
    label: 'Repeatable',
    description: 'Can be done multiple times (optionally cap total completions)',
  },
  {
    value: 'claimable',
    label: 'Claimable Job',
    description: 'Locks to the first person who claims it for a set window of time',
  },
  {
    value: 'capped',
    label: 'Capped',
    description: 'Limited total completions across all family members (requires a max)',
  },
]

const INCOMPLETE_OPTIONS: {
  key: IncompleteAction
  label: string
  description: string
}[] = [
  { key: 'fresh_reset', label: 'Auto-Disappear', description: 'Task vanishes if not done; fresh start each day' },
  { key: 'auto_reschedule', label: 'Auto-Reschedule', description: 'Moves to next available day' },
  { key: 'drop_after_date', label: 'Drop After Date', description: 'Disappears after a specific date passes' },
  { key: 'reassign_until_complete', label: 'Reassign Until Done', description: 'Keeps reassigning until someone completes it' },
  { key: 'require_decision', label: 'Ask Me', description: 'Goes to your review queue for a manual decision' },
  { key: 'escalate_to_parent', label: 'Escalate', description: 'Flags for parent review' },
]

type ScheduleMode = 'one_time' | 'daily' | 'weekly' | 'custom'

const SCHEDULE_OPTIONS: { key: ScheduleMode; label: string; description: string }[] = [
  { key: 'one_time', label: 'One-Time', description: 'Something that needs to be done once' },
  { key: 'daily', label: 'Daily', description: 'Repeats every day (like morning routines)' },
  { key: 'weekly', label: 'Weekly', description: 'Repeats on specific days each week' },
  { key: 'custom', label: 'Custom', description: 'Define your own schedule' },
]

// ─── Helpers ─────────────────────────────────────────────────

function sourceLabel(source?: string): string | null {
  if (!source) return null
  if (source === 'member_request') return 'Request from member'
  if (source === 'meeting_action') return 'From meeting'
  if (source === 'notepad_routed') return 'From Notepad'
  if (source === 'review_route') return 'From Review & Route'
  if (source === 'lila_conversation') return 'From LiLa'
  if (source === 'goal_decomposition') return 'From goal breakdown'
  return `From: ${source}`
}

// ─── Sub-components ──────────────────────────────────────────

/** Section card wrapper per the design system Rule 4 */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionCardStyle}>
      {children}
    </div>
  )
}

function SectionHeading({ icon: Icon, children }: { icon: React.ComponentType<{ size: number }>; children: React.ReactNode }) {
  return (
    <h3 style={sectionHeadingStyle}>
      <Icon size={18} />
      {children}
    </h3>
  )
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-xs, 0.75rem)',
      marginTop: '0.25rem',
      marginBottom: 0,
    }}>
      {children}
    </p>
  )
}

/** Radio button with description (Rule 7) */
function RadioOption<T extends string>({
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  name: string
  value: T
  checked: boolean
  onChange: (v: T) => void
  label: string
  description: string
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0.375rem 0',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        style={{ accentColor: 'var(--color-btn-primary-bg)', marginTop: '0.2rem', flexShrink: 0 }}
      />
      <span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}> — {description}</span>
      </span>
    </label>
  )
}

/** Day-of-week chips for weekly schedule */
function DayChips({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const labels = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
  return (
    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
      {labels.map((label, idx) => {
        const active = days.includes(idx)
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(active ? days.filter((d) => d !== idx) : [...days, idx])}
            className="btn-chip"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 400,
              fontSize: 'var(--font-size-xs, 0.75rem)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────

const sectionCardStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--vibe-radius-card, 12px)',
  padding: '1.25rem',
  marginBottom: '0.75rem',
}

const sectionHeadingStyle: React.CSSProperties = {
  color: 'var(--color-btn-primary-bg)',
  fontFamily: 'var(--font-heading)',
  fontSize: '1.1rem',
  fontWeight: 600,
  margin: '0 0 0.75rem 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  lineHeight: 1.3,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--vibe-radius-input, 8px)',
  backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm, 0.875rem)',
  outline: 'none',
}

// ─── Main Modal ──────────────────────────────────────────────

export function TaskCreationModal({
  isOpen,
  onClose,
  onSave,
  queueItem,
  mode: initialMode,
  batchMode,
  batchItems,
  initialTaskType,
  defaultTitle,
  defaultDescription,
  sourceReferenceId,
  editMode,
  makeupConfig,
  initialRoutineSections,
  editingTemplateId,
  editTaskValues,
  deployFromTemplateId,
}: TaskCreationModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: familyMembers = [] } = useFamilyMembers(currentMember?.family_id)
  const homeworkTrackingEnabled = useCanAccess('homeschool_subjects')
  const { data: homeschoolSubjects } = useHomeschoolSubjects(currentMember?.family_id)

  const [data, setData] = useState<CreateTaskData>(() => {
    const d = defaultTaskData(queueItem)
    // PRD-09A/09B Studio Intelligence Phase 1: sequential creation has its own
    // modal (SequentialCreatorModal). If a caller still passes 'sequential',
    // ignore it so we don't poison the state; that caller should be fixed.
    if (initialTaskType && initialTaskType !== 'sequential') {
      d.taskType = initialTaskType as TaskType
    } else if (initialTaskType === 'sequential') {
      console.warn(
        '[TaskCreationModal] initialTaskType="sequential" is no longer supported. ' +
        'Use SequentialCreatorModal instead.',
      )
    }
    if (defaultTitle) d.title = defaultTitle
    if (defaultDescription) d.description = defaultDescription
    if (sourceReferenceId) d.sourceReferenceId = sourceReferenceId
    if (initialRoutineSections?.length) d.routineSections = initialRoutineSections
    // Hydrate existing task values on edit so we don't reset them to defaults
    if (editTaskValues) {
      if (editTaskValues.incompleteAction) d.incompleteAction = editTaskValues.incompleteAction as typeof d.incompleteAction
      if (editTaskValues.lifeAreaTag) d.lifeAreaTag = editTaskValues.lifeAreaTag
      if (editTaskValues.durationEstimate) d.durationEstimate = editTaskValues.durationEstimate
      if (editTaskValues.dueDate) d.dueDate = editTaskValues.dueDate
      // Worker ROUTINE-PROPAGATION (c2): hydrate startDate from existing
      // recurrence_details.dtstart so editing a scheduled-to-start-later
      // routine preserves the start date.
      if (editTaskValues.startDate) d.startDate = editTaskValues.startDate
      if (editTaskValues.requireApproval !== undefined) d.reward.requireApproval = editTaskValues.requireApproval
      if (editTaskValues.victoryFlagged !== undefined) d.reward.flagAsVictory = editTaskValues.victoryFlagged
      if (editTaskValues.countsForAllowance !== undefined) d.countsForAllowance = editTaskValues.countsForAllowance
      if (editTaskValues.countsForHomework !== undefined) d.countsForHomework = editTaskValues.countsForHomework
      if (editTaskValues.countsForGamification !== undefined) d.countsForGamification = editTaskValues.countsForGamification
      if (editTaskValues.isExtraCredit !== undefined) d.isExtraCredit = editTaskValues.isExtraCredit
    }
    // When deploying from an existing template, link (don't duplicate)
    if (deployFromTemplateId) d.deployFromTemplateId = deployFromTemplateId
    return d
  })
  // PRD-28: Apply makeup work pre-configuration
  useEffect(() => {
    if (makeupConfig && isOpen) {
      setData(prev => ({
        ...prev,
        taskType: 'makeup' as TaskType,
        countsForAllowance: true,
        countsForGamification: false,
        assignments: [{ memberId: makeupConfig.assigneeId, copyMode: 'individual' as const }],
      }))
    }
  }, [makeupConfig, isOpen])

  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'quick' | 'full'>(initialMode ?? 'full')
  // Worker ROUTINE-PROPAGATION (c2): "Schedule to start later" toggle
  // for routines. Off by default (silent default = today). When on,
  // reveals the date picker and writes data.startDate.
  const [enableStartLater, setEnableStartLater] = useState<boolean>(
    !!editTaskValues?.startDate,
  )
  // Worker ROUTINE-PROPAGATION (c2.5): overlap modal state. When the
  // pre-check finds existing deployments overlapping the proposed
  // dates, we stash the resolved finalData and the candidates list,
  // then render the resolution modal. On user choice we either archive
  // the existing rows + proceed, or abort.
  const [overlapState, setOverlapState] = useState<{
    candidates: RoutineOverlapCandidate[]
    pendingFinalData: CreateTaskData
    proposedDtstart: string
    proposedEndDate: string | null
  } | null>(null)
  // Worker ROUTINE-PROPAGATION (c3): master-template edit confirmation
  // state. Holds the deployments list + the pending finalData while
  // the modal is up.
  const [editConfirmState, setEditConfirmState] = useState<{
    deployments: ActiveDeployment[]
    pendingFinalData: CreateTaskData
  } | null>(null)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('one_time')
  const [quickDays, setQuickDays] = useState<number[]>([])
  const [quickDate, setQuickDate] = useState('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [showTypesExplained, setShowTypesExplained] = useState(false)
  const [showTaskBreaker, setShowTaskBreaker] = useState(false)
  const [showTaskBreakerPanel, setShowTaskBreakerPanel] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [listFreeformText, setListFreeformText] = useState('')
  const routineSectionRef = useRef<HTMLDivElement>(null)
  // Build M Sub-phase B: Play tile icon picker selection. Stored as the
  // full TaskIconSuggestion so the picker can render the current state;
  // synced into data.iconAssetKey/iconVariant on save.
  const [selectedIcon, setSelectedIcon] = useState<TaskIconSuggestion | null>(null)

  // Batch state
  const [batchIndex, setBatchIndex] = useState(0)
  const activeBatchItem = batchMode === 'sequential' && batchItems ? batchItems[batchIndex] : undefined
  const batchTotal = batchItems?.length ?? 0

  // Re-init on queue item change (NOT on routine section load — that's handled separately)
  useEffect(() => {
    const d = defaultTaskData(queueItem ?? activeBatchItem)
    // Phase 1 guard: same sequential skip as the initial useState, applied here
    // so later re-inits from a new queue item don't re-poison state.
    if (initialTaskType && initialTaskType !== 'sequential') {
      d.taskType = initialTaskType as TaskType
    }
    if (defaultTitle) d.title = defaultTitle
    if (defaultDescription) d.description = defaultDescription
    // Hydrate existing task values on edit
    if (editTaskValues) {
      if (editTaskValues.incompleteAction) d.incompleteAction = editTaskValues.incompleteAction as typeof d.incompleteAction
      if (editTaskValues.lifeAreaTag) d.lifeAreaTag = editTaskValues.lifeAreaTag
      if (editTaskValues.durationEstimate) d.durationEstimate = editTaskValues.durationEstimate
      if (editTaskValues.dueDate) d.dueDate = editTaskValues.dueDate
      // Worker ROUTINE-PROPAGATION (c2): hydrate startDate from existing
      // recurrence_details.dtstart so editing a scheduled-to-start-later
      // routine preserves the start date.
      if (editTaskValues.startDate) d.startDate = editTaskValues.startDate
      if (editTaskValues.requireApproval !== undefined) d.reward.requireApproval = editTaskValues.requireApproval
      if (editTaskValues.victoryFlagged !== undefined) d.reward.flagAsVictory = editTaskValues.victoryFlagged
      if (editTaskValues.countsForAllowance !== undefined) d.countsForAllowance = editTaskValues.countsForAllowance
      if (editTaskValues.countsForHomework !== undefined) d.countsForHomework = editTaskValues.countsForHomework
      if (editTaskValues.countsForGamification !== undefined) d.countsForGamification = editTaskValues.countsForGamification
      if (editTaskValues.isExtraCredit !== undefined) d.isExtraCredit = editTaskValues.isExtraCredit
    }
    if (deployFromTemplateId) d.deployFromTemplateId = deployFromTemplateId
    setData(d)
    setScheduleMode('one_time')
    setQuickDays([])
    setQuickDate('')
    setShowScheduler(false)
    setShowTypesExplained(false)
    setShowTaskBreaker(false)
    setShowTaskBreakerPanel(false)
    setSelectedIcon(null)
  }, [queueItem?.id, activeBatchItem?.id, initialTaskType, defaultTitle, defaultDescription, editTaskValues, deployFromTemplateId])

  // Merge routine sections when they arrive (async load) without resetting the rest of the form
  useEffect(() => {
    if (initialRoutineSections?.length) {
      setData(prev => ({ ...prev, routineSections: initialRoutineSections }))
    }
  }, [initialRoutineSections])

  // Build M Sub-phase B: detect whether any selected assignee is a Play
  // member. Drives the conditional rendering of TaskIconPicker. If
  // wholeFamily is on, we check all active members. Mom + dad are never
  // Play members so this is a simple inclusion check.
  const assigneeIsPlayMember = (() => {
    const memberIds = data.wholeFamily
      ? familyMembers.filter(m => m.is_active).map(m => m.id)
      : data.assignments.map(a => a.memberId).filter((id): id is string => !!id)
    if (memberIds.length === 0) return false
    return familyMembers.some(
      m => memberIds.includes(m.id) && m.dashboard_mode === 'play',
    )
  })()

  // Auto-suggestion results for Play icons — used as fallback when mom doesn't
  // manually pick an icon. The top result is written to the task at save time.
  const { results: iconAutoSuggestions } = useTaskIconSuggestions(
    data.title,
    data.lifeAreaTag,
    assigneeIsPlayMember,
  )

  const update = <K extends keyof CreateTaskData>(key: K, val: CreateTaskData[K]) =>
    setData((d) => ({ ...d, [key]: val }))

  // Worker ROUTINE-PROPAGATION (c6): toast helper. Wraps useRoutingToast
  // so save sites can call showToast(message) without remembering the
  // {message, onDismiss} shape.
  //
  // Worker ROUTINE-SAVE-FIX (c2): added showErrorToast for the catch
  // blocks below. Error toasts use the 'error' variant (red border,
  // alert icon, 10s dwell time) so mom has time to read what went wrong.
  const routingToast = useRoutingToast()
  const showToast = useCallback(
    (message: string) => {
      routingToast.show({ message })
    },
    [routingToast],
  )
  const showErrorToast = useCallback(
    (message: string) => {
      routingToast.show({ message, variant: 'error' })
    },
    [routingToast],
  )

  const handleSave = useCallback(async () => {
    if (!data.title.trim()) return
    setLoading(true)
    try {
      // Synthesize schedule state into the data object before saving.
      // Build M Sub-phase B: also sync the selected paper-craft icon.
      // Only set when at least one assignee is a Play member; cleared
      // otherwise so non-Play tasks don't carry stale icon refs.
      const finalData: CreateTaskData = {
        ...data,
        scheduleMode,
        editingTemplateId: editingTemplateId ?? undefined,
        // For routines, preserve the "Run until" dueDate set by the routine duration picker.
        // For other task types, derive from the schedule mode radio buttons.
        dueDate: data.taskType === 'routine'
          ? data.dueDate || undefined
          : scheduleMode === 'one_time' ? quickDate || undefined : undefined,
        // Worker ROUTINE-PROPAGATION (c2): when "Schedule to start later"
        // is OFF, leave startDate undefined so buildTaskScheduleFields
        // silently falls back to familyToday (today in family timezone).
        // When ON, write the picked date so dtstart is persisted.
        startDate: data.taskType === 'routine' && enableStartLater
          ? data.startDate || undefined
          : undefined,
        weeklyDays: scheduleMode === 'weekly' ? quickDays : undefined,
        // Use mom's manual pick, or fall back to the top auto-suggestion
        iconAssetKey: assigneeIsPlayMember
          ? (selectedIcon?.asset_key ?? iconAutoSuggestions[0]?.asset_key ?? null)
          : null,
        iconVariant: assigneeIsPlayMember
          ? (selectedIcon?.variant ?? iconAutoSuggestions[0]?.variant ?? null)
          : null,
      }

      // Worker ROUTINE-PROPAGATION (c3, founder D3): when mom is editing
      // an existing master template (editingTemplateId set), pre-check
      // active deployments. If 1+ are affected, surface the
      // confirmation modal naming each family member before saving.
      // Past completions are preserved (keyed by step_id) so we just
      // need mom's eyes-on confirmation that propagating is intended.
      if (
        editingTemplateId &&
        finalData.taskType === 'routine' &&
        finalData.routineSections &&
        finalData.routineSections.length > 0
      ) {
        const deployments = await getActiveTemplateDeployments(
          supabase,
          editingTemplateId,
        )
        if (deployments.length > 0) {
          setEditConfirmState({
            deployments,
            pendingFinalData: finalData,
          })
          setLoading(false)
          return
        }
        // 0 deployments — fall through to normal save (toast added in c6)
      }

      // Worker ROUTINE-PROPAGATION (c2.5, founder D5): pre-check
      // overlap with existing routine deployments BEFORE handing off
      // to the consuming page's onSave. Skip when:
      //   - not a routine (overlap rule is routine-specific)
      //   - editing master template (templateOnly path doesn't insert
      //     a task row)
      //   - editing an existing deployment via editingTemplateId path
      //     (the existing tasks row IS the row being updated; the
      //     trigger excludes it via TG_OP UPDATE check)
      //   - no family_id available (e.g. modal opened without auth)
      //   - no assignees picked (no rows to insert anyway)
      if (
        finalData.taskType === 'routine' &&
        !finalData.templateOnly &&
        !editingTemplateId &&
        currentMember?.family_id
      ) {
        const proposedAssigneeIds = finalData.wholeFamily
          ? familyMembers.filter(m => m.is_active).map(m => m.id)
          : finalData.assignments
              .map(a => a.memberId)
              .filter((id): id is string => !!id)

        const targetTemplateId =
          finalData.deployFromTemplateId ?? finalData.editingTemplateId ?? null

        if (proposedAssigneeIds.length > 0 && targetTemplateId) {
          const proposedDtstart = finalData.startDate
            ? finalData.startDate
            : await fetchFamilyToday(currentMember.id)
          const proposedEndDate = finalData.dueDate || null

          const candidates = await detectRoutineOverlap(supabase, {
            familyId: currentMember.family_id,
            templateId: targetTemplateId,
            assigneeIds: proposedAssigneeIds,
            newDtstart: proposedDtstart,
            newEndDate: proposedEndDate,
          })

          if (candidates.length > 0) {
            // Stash and surface the resolution modal. handleSave returns
            // here; the modal's onResolve callback will re-enter the
            // save path with the appropriate side effect (archive
            // existing for 'replace', or abort for 'cancel'/'adjust').
            setOverlapState({
              candidates,
              pendingFinalData: finalData,
              proposedDtstart,
              proposedEndDate,
            })
            setLoading(false)
            return
          }
        }
      }

      await onSave(finalData)

      // Worker ROUTINE-PROPAGATION (c6): post-save toast. Anti-panic
      // UX — never silently succeed. Variants by save context:
      //   - master template edit, 0 deployments: "Template saved."
      //   - deploy from Studio template: "Routine assigned to [Names]."
      //   - new routine save: "Routine created." / "Routine assigned to [Names]."
      //   - any other task type: "Task saved."
      // (1+ deployment edit path emits its own toast via handleEditConfirm.)
      if (finalData.taskType === 'routine') {
        if (editingTemplateId) {
          showToast('Template saved.')
        } else {
          const assigneeIds = finalData.wholeFamily
            ? familyMembers.filter(m => m.is_active).map(m => m.id)
            : finalData.assignments
                .map(a => a.memberId)
                .filter((id): id is string => !!id)
          const names = assigneeIds
            .map(id => familyMembers.find(m => m.id === id)?.display_name)
            .filter((n): n is string => !!n)
          if (names.length > 0) {
            showToast(`Routine assigned to ${formatNameList(names)}.`)
          } else {
            showToast('Routine saved to Studio.')
          }
        }
      } else if (finalData.templateOnly) {
        showToast('Template saved.')
      } else {
        showToast('Task saved.')
      }

      if (batchMode === 'sequential' && batchItems && batchIndex < batchItems.length - 1) {
        setBatchIndex((i) => i + 1)
      } else {
        onClose()
      }
    } catch (err) {
      // Worker ROUTINE-SAVE-FIX (c2): surface save failures so mom isn't
      // left wondering whether her edits saved. Modal stays open — her
      // edits are preserved in component state — so she can retry or
      // copy her changes elsewhere before closing.
      console.error('Routine save failed:', err)
      showErrorToast("Couldn't save changes. Please try again or contact support.")
    } finally {
      setLoading(false)
    }
  }, [
    data,
    onSave,
    onClose,
    batchMode,
    batchItems,
    batchIndex,
    scheduleMode,
    quickDate,
    quickDays,
    assigneeIsPlayMember,
    selectedIcon,
    enableStartLater,
    editingTemplateId,
    currentMember?.id,
    currentMember?.family_id,
    familyMembers,
    iconAutoSuggestions,
    showToast,
    showErrorToast,
  ])

  const handleSaveToStudio = useCallback(async () => {
    if (!data.title.trim()) return
    if (!data.routineSections || data.routineSections.length === 0) return
    setLoading(true)
    try {
      const finalData: CreateTaskData = {
        ...data,
        templateOnly: true,
        editingTemplateId: editingTemplateId ?? undefined,
      }

      // Worker ROUTINE-PROPAGATION (c3): Save to Studio also propagates
      // master-template structural edits to active deployments. Same
      // confirmation modal as the regular save path.
      if (editingTemplateId) {
        const deployments = await getActiveTemplateDeployments(
          supabase,
          editingTemplateId,
        )
        if (deployments.length > 0) {
          setEditConfirmState({
            deployments,
            pendingFinalData: finalData,
          })
          setLoading(false)
          return
        }
      }

      await onSave(finalData)
      // Worker ROUTINE-PROPAGATION (c6): Save-to-Studio toast for the
      // 0-deployments path. Master-edit-with-deployments path emits
      // its own toast via handleEditConfirm.
      showToast('Template saved.')
      onClose()
    } catch (err) {
      // Worker ROUTINE-SAVE-FIX (c2): same contract as handleSave —
      // surface the error and keep the modal open so mom can retry
      // without losing her work.
      console.error('Routine save failed:', err)
      showErrorToast("Couldn't save changes. Please try again or contact support.")
    } finally {
      setLoading(false)
    }
  }, [data, onSave, onClose, editingTemplateId, showToast, showErrorToast])

  const toggleMember = (id: string) => {
    const exists = data.assignments.some((a) => a.memberId === id)
    const next = exists
      ? data.assignments.filter((a) => a.memberId !== id)
      : [...data.assignments, { memberId: id, copyMode: 'individual' as const }]
    setData((d) => ({ ...d, assignments: next, wholeFamily: false }))
  }

  const toggleFamily = () => {
    setData((d) => ({ ...d, wholeFamily: !d.wholeFamily, assignments: [] }))
  }

  const setAssignMode = (mode: 'any' | 'each') => {
    setData((d) => ({ ...d, assignMode: mode }))
  }

  const hasUnsavedChanges = data.title.trim().length > 0 || data.description.trim().length > 0

  const srcLabel = sourceLabel(queueItem?.source)

  // Assignable members — includes mom (self-assign for personal tasks)
  const assignableMembers = familyMembers.filter((m) => m.is_active)

  // ─── Quick Mode ─────────────────────────────────────────────

  const quickModeContent = (
    <div className="density-comfortable" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Task name */}
      <input
        type="text"
        value={data.title}
        onChange={(e) => update('title', e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        style={{ ...inputStyle, fontSize: '1rem', fontWeight: 500 }}
      />

      {/* Assign */}
      <SectionCard>
        <SectionHeading icon={Users}>Who's Responsible?</SectionHeading>
        {renderAssignmentRows()}
      </SectionCard>

      {/* Build M Sub-phase B: Play tile icon picker (Play assignees only) */}
      {assigneeIsPlayMember && (
        <TaskIconPicker
          currentIcon={selectedIcon}
          taskTitle={data.title}
          category={data.lifeAreaTag || null}
          onChange={setSelectedIcon}
          assigneeIsPlayMember={assigneeIsPlayMember}
        />
      )}

      {/* Simple schedule */}
      <SectionCard>
        <SectionHeading icon={Calendar}>When?</SectionHeading>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="quick-schedule"
              checked={scheduleMode === 'one_time'}
              onChange={() => setScheduleMode('one_time')}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>One-Time</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="quick-schedule"
              checked={scheduleMode === 'weekly'}
              onChange={() => setScheduleMode('weekly')}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>Recurring</span>
          </label>
        </div>
        {scheduleMode === 'one_time' && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Due date (optional)
            </label>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              {quickDate && (
                <button
                  type="button"
                  onClick={() => setQuickDate('')}
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                    padding: '0.375rem 0.625rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <HelperText>Leave blank to just add it to the list — no pressure.</HelperText>
          </div>
        )}
        {scheduleMode === 'weekly' && (
          <DayChips days={quickDays} onChange={setQuickDays} />
        )}
      </SectionCard>

      {/* Full mode link */}
      <button
        type="button"
        onClick={() => setViewMode('full')}
        className="btn-inline"
        style={{
          color: 'var(--color-btn-primary-bg)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem 0',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'left',
        }}
      >
        Full mode →
      </button>
    </div>
  )

  // ─── Assignment rows (shared between Quick and Full) ────────

  function renderAssignmentRows() {
    const selectedCount = data.wholeFamily ? assignableMembers.length : data.assignments.length
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {assignableMembers.map((m) => {
            const selected = data.wholeFamily || data.assignments.some((a) => a.memberId === m.id)
            const color = getMemberColor(m)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (data.wholeFamily) {
                    // Switching from Everyone to individual selection — select all except this one
                    const others = assignableMembers.filter(x => x.id !== m.id)
                    setData(d => ({ ...d, wholeFamily: false, assignments: others.map(x => ({ memberId: x.id, copyMode: 'individual' as const })) }))
                  } else {
                    toggleMember(m.id)
                  }
                }}
                className="rounded-full text-xs font-semibold transition-all duration-150"
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: selected ? color : 'transparent',
                  color: selected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                  border: `2px solid ${color}`,
                  cursor: 'pointer',
                  minHeight: 'unset',
                  lineHeight: 1.2,
                  opacity: selected ? 1 : 0.7,
                }}
              >
                {m.display_name.split(' ')[0]}
              </button>
            )
          })}
          {/* Everyone toggle */}
          <button
            type="button"
            onClick={toggleFamily}
            className="rounded-full text-xs font-semibold transition-all duration-150"
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: data.wholeFamily ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: data.wholeFamily ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
              border: '2px solid var(--color-btn-primary-bg)',
              cursor: 'pointer',
              minHeight: 'unset',
              lineHeight: 1.2,
              opacity: data.wholeFamily ? 1 : 0.7,
            }}
          >
            Everyone
          </button>
        </div>

        {/* Any / Each toggle — appears when 2+ people selected */}
        {selectedCount >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Tooltip
              content={data.assignMode === 'any'
                ? '"Any" means one shared task — whoever does it first gets credit. Great for chores where you just need someone to do it.'
                : '"Each" means every person gets their own independent copy. Each person completes it on their own.'}
              position="top"
              maxWidth={280}
            >
              <div
                className="flex rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <button
                  type="button"
                  onClick={() => setAssignMode('any')}
                  className="text-xs font-medium px-3 py-1"
                  style={{
                    background: data.assignMode === 'any' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                    color: data.assignMode === 'any' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: 'none', minHeight: 'unset', cursor: 'pointer',
                  }}
                >
                  Any of them
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('each')}
                  className="text-xs font-medium px-3 py-1"
                  style={{
                    background: data.assignMode === 'each' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                    color: data.assignMode === 'each' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: 'none', minHeight: 'unset', cursor: 'pointer',
                  }}
                >
                  Each of them
                </button>
              </div>
            </Tooltip>
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {data.assignMode === 'any'
                ? 'Shared — anyone can check it off'
                : 'Individual — each gets their own copy'}
            </span>
          </div>
        )}

        {/* Rotation toggle — visible for routines/tasks, disabled until 2+ people assigned */}
        {(data.taskType === 'routine' || data.taskType === 'task') && (
          <div style={{ marginTop: '0.625rem' }}>
            <Tooltip
              content="Automatically rotate who's responsible on a schedule. Assign 2 or more people to enable rotation."
              position="top"
              maxWidth={260}
              disabled={selectedCount >= 2}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: selectedCount >= 2 ? 1 : 0.5,
                  cursor: selectedCount >= 2 ? 'pointer' : 'default',
                }}
                onClick={selectedCount >= 2 ? () => setData(d => ({ ...d, rotationEnabled: !d.rotationEnabled, ...(!d.rotationEnabled ? { assignMode: 'any' as const } : {}) })) : undefined}
              >
                <RefreshCw size={14} style={{ color: data.rotationEnabled && selectedCount >= 2 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }} />
                <input
                  type="checkbox"
                  checked={data.rotationEnabled && selectedCount >= 2}
                  disabled={selectedCount < 2}
                  onChange={(e) => setData(d => ({ ...d, rotationEnabled: e.target.checked, ...(e.target.checked ? { assignMode: 'any' as const } : {}) }))}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <span style={{
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  color: selectedCount >= 2 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: 500,
                }}>
                  Rotate weekly
                </span>
                {selectedCount < 2 && (
                  <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    (assign 2+ people)
                  </span>
                )}
              </div>
            </Tooltip>

            {/* Rotation frequency picker — visible when rotation is on */}
            {data.rotationEnabled && selectedCount >= 2 && (
              <div style={{ marginTop: '0.375rem', paddingLeft: '2.125rem' }}>
                <select
                  value={data.rotationFrequency}
                  onChange={(e) => setData(d => ({ ...d, rotationFrequency: e.target.value }))}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: 'var(--font-size-xs, 0.75rem)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="weekly">Every week</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Every month</option>
                </select>
                <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Each person takes a turn, then it passes to the next
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Full Mode ──────────────────────────────────────────────

  const fullModeContent = (
    <div className="density-comfortable" style={{ display: 'flex', flexDirection: 'column', gap: '0rem' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            overflow: 'hidden',
          }}
        >
          {(['quick', 'full'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className="btn-inline"
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: 'var(--font-size-xs)',
                fontWeight: viewMode === m ? 600 : 400,
                background: viewMode === m
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
                color: viewMode === m ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Task Name (not in a card) */}
      <input
        type="text"
        value={data.title}
        onChange={(e) => update('title', e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        style={{
          ...inputStyle,
          fontSize: '1rem',
          fontWeight: 500,
          padding: '0.75rem',
          marginBottom: '0.75rem',
        }}
      />

      {/* 2. Task Type */}
      <SectionCard>
        <SectionHeading icon={Layers}>Task Type</SectionHeading>

        {/* 2x2 toggle grid + full-width List row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {TASK_TYPES_GRID.map((tt) => {
            const active = data.taskType === tt.key
            const TypeIcon = tt.icon
            return (
              <button
                key={tt.key}
                type="button"
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    taskType: tt.key,
                    incompleteAction: tt.key === 'routine' ? 'fresh_reset' : 'auto_reschedule',
                  }))
                  // Auto-scroll to the routine section editor when Routine is selected.
                  // Delay enough for React to render the section editor before scrolling.
                  if (tt.key === 'routine') {
                    setTimeout(() => {
                      routineSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }, 300)
                  }
                }}
                className="btn-inline"
                style={{
                  padding: '0.75rem',
                  border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  background: active
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.25rem',
                }}>
                  <TypeIcon size={14} />
                  {tt.label}
                </div>
                <div style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  lineHeight: 1.3,
                }}>
                  {tt.description}
                </div>
              </button>
            )
          })}
        </div>
        {/* List — full-width 5th button */}
        {(() => {
          const active = data.taskType === LIST_TYPE.key
          const LIcon = LIST_TYPE.icon
          return (
            <button
              type="button"
              onClick={() => setData((d) => ({
                ...d,
                taskType: LIST_TYPE.key,
                incompleteAction: 'auto_reschedule',
              }))}
              className="btn-inline"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                borderRadius: 'var(--vibe-radius-input, 8px)',
                background: active
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-primary)',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                marginBottom: '0.25rem',
              }}>
                <LIcon size={14} />
                {LIST_TYPE.label}
              </div>
              <div style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                lineHeight: 1.3,
              }}>
                {LIST_TYPE.description}
              </div>
            </button>
          )
        })()}

        {/* Opportunity sub-type selector — inline expansion when Opportunity selected */}
        {data.taskType === 'opportunity' && (
          <div
            style={{
              marginTop: '0.25rem',
              marginBottom: '0.5rem',
              padding: '1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Opportunity type
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {OPP_SUBTYPES.map(({ value, label, description }) => {
                const selected = (data.opportunitySubType ?? 'repeatable') === value
                return (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      backgroundColor: selected
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                        : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="opp-subtype"
                      value={value}
                      checked={selected}
                      onChange={() => update('opportunitySubType', value)}
                      style={{ accentColor: 'var(--color-btn-primary-bg)', marginTop: '0.2rem', flexShrink: 0 }}
                    />
                    <span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{label}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: 'var(--font-size-xs)' }}> — {description}</span>
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Repeatable: optional max completions per period */}
            {(data.opportunitySubType ?? 'repeatable') === 'repeatable' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.25rem',
                }}>
                  Max completions <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(blank = unlimited)</span>
                </label>
                <input
                  type="number"
                  value={data.maxCompletions ?? ''}
                  onChange={(e) => update('maxCompletions', e.target.value)}
                  placeholder="Unlimited"
                  min={1}
                  style={{ ...inputStyle, width: 120 }}
                />
              </div>
            )}

            {/* Claimable: lock duration + unit */}
            {data.opportunitySubType === 'claimable' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.375rem',
                }}>
                  Claim lock duration
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={data.claimLockDuration ?? ''}
                    onChange={(e) => update('claimLockDuration', e.target.value)}
                    placeholder="4"
                    min={1}
                    style={{ ...inputStyle, width: 80 }}
                  />
                  <select
                    value={data.claimLockUnit ?? 'hours'}
                    onChange={(e) => update('claimLockUnit', e.target.value)}
                    style={{
                      padding: '0.625rem 0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm, 0.875rem)',
                      minHeight: '44px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs, 0.75rem)', marginTop: '0.25rem', marginBottom: 0 }}>
                  How long the job stays locked to whoever claims it first
                </p>
              </div>
            )}

            {/* Capped: required max completions total */}
            {data.opportunitySubType === 'capped' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: '0.25rem',
                }}>
                  Maximum completions <span style={{ color: 'var(--color-accent-deep, var(--color-btn-primary-bg))', fontWeight: 400 }}>(required)</span>
                </label>
                <input
                  type="number"
                  value={data.maxCompletions ?? ''}
                  onChange={(e) => update('maxCompletions', e.target.value)}
                  placeholder="5"
                  required
                  min={1}
                  style={{ ...inputStyle, width: 120 }}
                />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs, 0.75rem)', marginTop: '0.25rem', marginBottom: 0 }}>
                  Total completions allowed across all family members
                </p>
              </div>
            )}

            {/* Bulk Add Opportunities button */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setShowBulkAdd(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  color: 'var(--color-btn-primary-bg)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Sparkles size={14} />
                Bulk Add with AI
              </button>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs, 0.75rem)', marginTop: '0.25rem', marginBottom: 0 }}>
                Paste a list of opportunities and AI will parse them into individual items
              </p>
            </div>
          </div>
        )}

        {/* Types Explained expandable (Rule 8) */}
        <button
          type="button"
          onClick={() => setShowTypesExplained(!showTypesExplained)}
          className="btn-inline"
          style={{
            color: 'var(--color-btn-primary-bg)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          What's the difference?
          {showTypesExplained ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTypesExplained && (
          <div style={{
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            padding: '1rem',
            marginTop: '0.5rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Tasks</strong> are one-time or recurring responsibilities. Take out the trash, return library books, call the dentist.
            </p>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Routines</strong> are multi-step checklists with sections on different schedules — daily, weekly, or custom. Build once, deploy to any child. Resets fresh each period.
            </p>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Opportunities</strong> are optional jobs kids can browse and claim to earn rewards. No pressure, no guilt.
            </p>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Habits</strong> track consistency over time. Focus on showing up, not perfection.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Lists</strong> are assigned checklists or ordered sequences. Packing lists, monthly call lists, curriculum chapters that drip-feed one at a time. Choose how items are delivered — all at once, each as its own task, or one by one in order.
            </p>
          </div>
        )}

        {/* Routine section editor (appears when routine is selected) */}
        {data.taskType === 'routine' && (
          <div ref={routineSectionRef} style={{ marginTop: '0.75rem' }}>
            <RoutineSectionEditor
              sections={data.routineSections ?? []}
              onChange={(sections) => update('routineSections', sections)}
              familyId={currentMember?.family_id}
            />
          </div>
        )}

        {/* List sub-section (appears when list is selected) */}
        {data.taskType === 'list' && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Decision 1: Which list? */}
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                List Source
              </p>

              {/* Source radio options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <RadioOption
                  name="list-source"
                  value="existing"
                  checked={data.listSource === 'existing'}
                  onChange={(v) => update('listSource', v as 'existing' | 'new' | 'image')}
                  label="Choose an existing list"
                  description="Pick from your family's lists"
                />
                <RadioOption
                  name="list-source"
                  value="new"
                  checked={data.listSource === 'new'}
                  onChange={(v) => update('listSource', v as 'existing' | 'new' | 'image')}
                  label="Create a new list"
                  description="Type, paste, or brain dump items"
                />
                <RadioOption
                  name="list-source"
                  value="image"
                  checked={data.listSource === 'image'}
                  onChange={(v) => update('listSource', v as 'existing' | 'new' | 'image')}
                  label="Import from image"
                  description="Upload a photo of a list or curriculum"
                />
              </div>

              {/* Existing list picker */}
              {data.listSource === 'existing' && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <HelperText>Select from your family's lists (coming soon — create a new list below for now)</HelperText>
                </div>
              )}

              {/* New list creation */}
              {data.listSource === 'new' && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <input
                    type="text"
                    value={data.newListName ?? ''}
                    onChange={(e) => update('newListName', e.target.value)}
                    placeholder="List name (e.g., Monthly phone calls)"
                    style={{ ...inputStyle, marginBottom: '0.5rem' }}
                  />
                  <textarea
                    value={listFreeformText}
                    onChange={(e) => setListFreeformText(e.target.value)}
                    placeholder="Type or paste items, one per line — or brain dump a paragraph and use Smart Parse"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 80, marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = listFreeformText
                          .split('\n')
                          .map(l => l.replace(/^[-*•]\s*/, '').trim())
                          .filter(l => l.length > 0)
                        update('newListItems', lines)
                      }}
                      className="btn-inline"
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                      }}
                    >
                      Split into items
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Stub: AI parse — for now fallback to line split
                        const lines = listFreeformText
                          .split('\n')
                          .map(l => l.replace(/^[-*•]\s*/, '').trim())
                          .filter(l => l.length > 0)
                        update('newListItems', lines)
                      }}
                      className="btn-inline"
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                        border: '1px solid var(--color-btn-primary-bg)',
                        borderRadius: 'var(--vibe-radius-input, 8px)',
                        color: 'var(--color-btn-primary-bg)',
                        fontSize: 'var(--font-size-xs)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Sparkles size={12} />
                      Smart Parse
                    </button>
                  </div>

                  {/* Parsed items list */}
                  {(data.newListItems?.length ?? 0) > 0 && (
                    <div style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      padding: '0.75rem',
                    }}>
                      <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        Items ({data.newListItems!.length}):
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {data.newListItems!.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <GripVertical size={12} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const items = [...(data.newListItems ?? [])]
                                items[idx] = e.target.value
                                update('newListItems', items)
                              }}
                              style={{
                                ...inputStyle,
                                padding: '0.375rem 0.5rem',
                                fontSize: 'var(--font-size-xs)',
                                flex: 1,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const items = [...(data.newListItems ?? [])]
                                items.splice(idx, 1)
                                update('newListItems', items)
                              }}
                              className="btn-inline"
                              style={{
                                padding: '0.25rem',
                                color: 'var(--color-text-secondary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => update('newListItems', [...(data.newListItems ?? []), ''])}
                        className="btn-inline"
                        style={{
                          color: 'var(--color-btn-primary-bg)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.375rem 0',
                          fontSize: 'var(--font-size-xs)',
                          marginTop: '0.25rem',
                        }}
                      >
                        + Add item
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Image import stub */}
              {data.listSource === 'image' && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <HelperText>Image import coming soon — use "Create a new list" to type or paste items for now.</HelperText>
                </div>
              )}
            </div>

            {/* Decision 2: Delivery mode */}
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Delivery Mode
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {LIST_DELIVERY_MODES.map(mode => (
                  <RadioOption
                    key={mode.key}
                    name="list-delivery"
                    value={mode.key}
                    checked={data.listDeliveryMode === mode.key}
                    onChange={(v) => update('listDeliveryMode', v as 'checklist' | 'batch' | 'sequential')}
                    label={mode.label}
                    description={mode.description}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 3. Task Basics — hidden for routines and lists (they have their own content sections) */}
      {data.taskType !== 'routine' && data.taskType !== 'list' && (
      <SectionCard>
        <SectionHeading icon={FileText}>Task Basics</SectionHeading>

        {/* Description */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label
            style={{ display: 'block', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}
          >
            Description & Instructions
          </label>
          <textarea
            value={data.description}
            onChange={(e) => {
              update('description', e.target.value)
              if (e.target.value.length >= 30 && !showTaskBreaker) setShowTaskBreaker(true)
            }}
            placeholder="Describe what needs to be done..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
          <HelperText>Describe what needs to be done. TaskBreaker can turn this into step-by-step subtasks.</HelperText>
        </div>

        {/* TaskBreaker AI Preview */}
        {showTaskBreaker && (
          <div
            style={{
              background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              padding: '1rem',
              marginBottom: '0.75rem',
            }}
          >
            {showTaskBreakerPanel ? (
              <TaskBreaker
                taskTitle={data.title}
                taskDescription={data.description}
                lifeAreaTag={data.lifeAreaTag}
                onApply={(subtasks) => {
                  setData(d => ({ ...d, taskBreakerSubtasks: subtasks }))
                  setShowTaskBreakerPanel(false)
                }}
                onCancel={() => setShowTaskBreakerPanel(false)}
              />
            ) : data.taskBreakerSubtasks && data.taskBreakerSubtasks.length > 0 ? (
              <>
                <div style={{ color: 'var(--color-btn-primary-bg)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  TaskBreaker AI
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0 0 0.5rem' }}>
                  {data.taskBreakerSubtasks.length} subtasks will be created when you save.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {data.taskBreakerSubtasks.map((st, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.375rem 0.5rem', borderRadius: '6px',
                      background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)',
                    }}>
                      <span style={{ color: 'var(--color-text-secondary)', width: '1.25rem', textAlign: 'center' }}>{i + 1}</span>
                      <span style={{ flex: 1 }}>{st.title}</span>
                      {st.suggestedAssigneeName && (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>{st.suggestedAssigneeName}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowTaskBreakerPanel(true)}>
                    Redo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setData(d => ({ ...d, taskBreakerSubtasks: undefined }))}>
                    Clear Subtasks
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ color: 'var(--color-btn-primary-bg)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                  TaskBreaker AI
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0 0 0.625rem' }}>
                  Based on your description, TaskBreaker can create smart subtasks...
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="primary" size="sm" onClick={() => setShowTaskBreakerPanel(true)}>
                    Generate Subtasks
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Duration */}
        <div style={{ marginBottom: '0.75rem' }}>
          <DurationPicker
            value={data.durationEstimate}
            onChange={(v) => update('durationEstimate', v)}
            customValue={data.customDuration}
            onCustomChange={(v) => update('customDuration', v)}
          />
          <HelperText>Set a time limit only if needed (like 30 minutes of reading practice)</HelperText>
        </div>

        {/* Life Area */}
        <div>
          <LifeAreaTagPicker
            value={data.lifeAreaTag}
            onChange={(v) => update('lifeAreaTag', v)}
            customValue={data.customLifeArea}
            onCustomChange={(v) => update('customLifeArea', v)}
          />
          <HelperText>Optional — helps organize tasks by area of life</HelperText>
        </div>
      </SectionCard>
      )}

      {/* 4. Who's Responsible */}
      <SectionCard>
        <SectionHeading icon={Users}>Who's Responsible?</SectionHeading>
        {data.taskType === 'routine' && (
          <HelperText>
            Pick who to assign this routine to now, or skip and use "Save to Studio" to assign later.
          </HelperText>
        )}
        {renderAssignmentRows()}
      </SectionCard>

      {/* Build M Sub-phase B: Play tile icon picker (Play assignees only) */}
      {assigneeIsPlayMember && (
        <TaskIconPicker
          currentIcon={selectedIcon}
          taskTitle={data.title}
          category={data.lifeAreaTag || null}
          onChange={setSelectedIcon}
          assigneeIsPlayMember={assigneeIsPlayMember}
        />
      )}

      {/* 5. Schedule — routines get a simplified version since sections handle day frequency */}
      {data.taskType === 'routine' ? (
        <SectionCard>
          <SectionHeading icon={Calendar}>How Long Should This Run?</SectionHeading>
          <HelperText>
            Each section above already controls which days its steps appear. This sets when the whole routine starts and stops.
          </HelperText>

          {/* Worker ROUTINE-PROPAGATION (c2, founder D2):
              "Schedule to start later" toggle. Off by default — routine
              starts today silently. On — reveals date picker; routine is
              scheduled but hidden from the dashboard until that date.
              Hidden when editing master template — start dates only
              apply to deployed task rows, not the master. */}
          {!editingTemplateId && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <Toggle
                checked={enableStartLater}
                onChange={(checked) => {
                  setEnableStartLater(checked)
                  if (!checked) update('startDate', undefined)
                }}
                label="Schedule to start later"
                size="sm"
              />
              {enableStartLater && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '2.5rem' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Starts on
                  </span>
                  <input
                    type="date"
                    value={data.startDate || ''}
                    onChange={(e) => update('startDate', e.target.value || undefined)}
                    style={{ ...inputStyle, flex: 1, maxWidth: '180px' }}
                  />
                </div>
              )}
              {enableStartLater && (
                <HelperText>
                  Routine appears on the dashboard starting on this date. Until then it stays scheduled but out of sight.
                </HelperText>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="routine-duration"
                  checked={!data.dueDate}
                  onChange={() => update('dueDate', undefined)}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Ongoing</span>
              </label>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Runs until you stop it
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="routine-duration"
                  checked={!!data.dueDate}
                  onChange={() => update('dueDate', '')}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>Run until</span>
              </label>
              {data.dueDate !== undefined && (
                <input
                  type="date"
                  value={data.dueDate || ''}
                  onChange={(e) => update('dueDate', e.target.value)}
                  style={{ ...inputStyle, flex: 1, maxWidth: '180px' }}
                />
              )}
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <SectionHeading icon={Calendar}>How Often?</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {SCHEDULE_OPTIONS.map((opt) => (
              <RadioOption
                key={opt.key}
                name="schedule"
                value={opt.key}
                checked={scheduleMode === opt.key}
                onChange={(v) => {
                  setScheduleMode(v)
                  if (v === 'custom') setShowScheduler(true)
                  else setShowScheduler(false)
                }}
                label={opt.label}
                description={opt.description}
              />
            ))}
          </div>

          {/* Contextual pickers */}
          {scheduleMode === 'one_time' && (
            <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                Due date (optional)
              </label>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {quickDate && (
                  <button
                    type="button"
                    onClick={() => setQuickDate('')}
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                      padding: '0.375rem 0.625rem',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <HelperText>Leave blank to just add it to the list — no pressure.</HelperText>
            </div>
          )}
          {scheduleMode === 'weekly' && (
            <div style={{ paddingLeft: '1.5rem' }}>
              <DayChips days={quickDays} onChange={setQuickDays} />
            </div>
          )}
          {scheduleMode === 'custom' && showScheduler && (
            <div style={{ marginTop: '0.75rem' }}>
              <UniversalScheduler
                value={data.schedule}
                onChange={(v) => update('schedule', v)}
                showTimeDefault={false}
                compactMode
              />
              {data.schedule?.schedule_type === 'painted' && (() => {
                const selectedIds = data.wholeFamily
                  ? assignableMembers.map(m => m.id)
                  : data.assignments.map(a => a.memberId).filter((id): id is string => !!id)
                const selectedMembers = assignableMembers.filter(m => selectedIds.includes(m.id))
                if (selectedMembers.length < 2 || !data.schedule?.rdates?.length) return null
                return (
                  <div style={{ marginTop: '0.75rem' }}>
                    <PickDatesAssigneeEditor
                      paintedDates={data.schedule.rdates}
                      assigneeMap={data.schedule.assignee_map ?? {}}
                      members={selectedMembers}
                      instantiationMode={data.schedule.instantiation_mode ?? 'per_assignee_instance'}
                      dispatch={(action) => {
                        const schedule = data.schedule
                        if (!schedule) return
                        if (action.type === 'SET_INSTANTIATION_MODE') {
                          update('schedule', { ...schedule, instantiation_mode: action.mode })
                        } else if (action.type === 'SET_ASSIGNEE_MAP') {
                          update('schedule', { ...schedule, assignee_map: Object.keys(action.map).length > 0 ? action.map : null })
                        } else if (action.type === 'SET_DATE_ASSIGNEES') {
                          const newMap = { ...(schedule.assignee_map ?? {}) }
                          if (action.memberIds.length === 0) {
                            delete newMap[action.date]
                          } else {
                            newMap[action.date] = action.memberIds
                          }
                          update('schedule', { ...schedule, assignee_map: Object.keys(newMap).length > 0 ? newMap : null })
                        }
                      }}
                    />
                  </div>
                )
              })()}
              <HelperText>For complex schedules like "every other Wednesday" or "first Monday of each month"</HelperText>
            </div>
          )}
        </SectionCard>
      )}

      {/* 6. If Not Completed — hidden for routines (routines handle this per-section via frequency rules + show_until_complete) */}
      {data.taskType !== 'routine' && (
        <SectionCard>
          <SectionHeading icon={AlertCircle}>What happens if not completed?</SectionHeading>
          <HelperText>What should happen when the scheduled time passes and the task isn't done?</HelperText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', marginTop: '0.5rem' }}>
            {INCOMPLETE_OPTIONS.map((opt) => (
              <RadioOption
                key={opt.key}
                name="incomplete"
                value={opt.key}
                checked={data.incompleteAction === opt.key}
                onChange={(v) => update('incompleteAction', v)}
                label={opt.label}
                description={opt.description}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 7. Rewards & Tracking */}
      <SectionCard>
        <SectionHeading icon={Gift}>Rewards & Completion Tracking</SectionHeading>

        {/* Reward type */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>
            Reward Type
          </label>
          <select
            value={data.reward.rewardType || 'none'}
            onChange={(e) => {
              const v = e.target.value === 'none' ? '' : e.target.value
              update('reward', { ...data.reward, rewardType: v as RewardType })
            }}
            style={inputStyle}
          >
            <option value="none">None</option>
            <option value="stars">Stars</option>
            <option value="points">Points</option>
            <option value="money">Money</option>
            <option value="privilege">Special Privilege</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Amount — only when reward type set */}
        {data.reward.rewardType && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>
              Reward Amount
            </label>
            <input
              type="text"
              value={data.reward.rewardAmount}
              onChange={(e) => update('reward', { ...data.reward, rewardAmount: e.target.value })}
              placeholder="e.g., 10"
              style={inputStyle}
            />
            <HelperText>How much does completing this task earn?</HelperText>
          </div>
        )}

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={data.reward.requireApproval}
              onChange={(e) => update('reward', { ...data.reward, requireApproval: e.target.checked })}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Require parent approval before reward
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={data.reward.trackAsWidget}
              onChange={(e) => update('reward', { ...data.reward, trackAsWidget: e.target.checked })}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Track this task as a dashboard widget
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={data.reward.flagAsVictory}
              onChange={(e) => update('reward', { ...data.reward, flagAsVictory: e.target.checked })}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Flag completion as a Victory
          </label>

          {/* PRD-28: Task-level tracking flags */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={data.countsForAllowance ?? false}
              onChange={(e) => {
                update('countsForAllowance', e.target.checked)
                // NEW-EE: Extra credit requires allowance participation. Unticking
                // allowance clears the extra-credit flag.
                if (!e.target.checked) update('isExtraCredit', false)
              }}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Count toward allowance pool
          </label>
          {/* PRD-28 NEW-QQ partial (2026-04-24): allowance_points per-task
              override for the Points-Weighted calculation approach. Field
              was already supported end-to-end (tasks.allowance_points column
              since 100134, type carries through to createTaskFromData at
              line 103) but no UI ever exposed it. Visible only when this
              task counts toward allowance AND mom knows Points-Weighted is
              enabled for the assignee. Defaults to null (falls back to the
              config's default_point_value on the RPC side). */}
          {data.countsForAllowance && (
            <div
              style={{
                marginLeft: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <label
                htmlFor="allowance-points-input"
                title="Per-task weight override for the Points-Weighted allowance approach. Leave blank to use the child's default point value (set in their allowance config). Heavier chores = higher numbers; easy chores = 1-2 points. Ignored if the child isn't on Points-Weighted."
                style={{
                  color: 'var(--color-text-primary)',
                  cursor: 'help',
                }}
              >
                Weight (points)
              </label>
              <input
                id="allowance-points-input"
                type="number"
                min={1}
                max={100}
                step={1}
                placeholder="use default"
                data-testid="allowance-points-input"
                value={data.allowancePoints ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  update('allowancePoints', raw === '' ? null : Number(raw))
                }}
                style={{
                  width: '5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  border: '1px solid var(--color-border-default, var(--color-border))',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                (Points-Weighted only — blank uses the child's default)
              </span>
            </div>
          )}
          {/* PRD-28 NEW-EE: Extra Credit — gated by countsForAllowance. Disabled
              visually when not applicable. Tooltip explains the constraint. */}
          <label
            title={data.countsForAllowance
              ? 'When checked, this task counts toward the numerator of the allowance % but NOT the denominator. Capped at 100%. Enable Extra Credit per-child in allowance settings.'
              : 'Turn on "Count toward allowance pool" first.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: data.countsForAllowance ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)',
              color: data.countsForAllowance ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              marginLeft: '1.5rem',
              opacity: data.countsForAllowance ? 1 : 0.6,
            }}
          >
            <input
              type="checkbox"
              disabled={!data.countsForAllowance}
              checked={data.isExtraCredit ?? false}
              onChange={(e) => update('isExtraCredit', e.target.checked)}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Extra credit task
          </label>
          {homeworkTrackingEnabled && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={data.countsForHomework ?? false}
                  onChange={(e) => {
                    update('countsForHomework', e.target.checked)
                    if (!e.target.checked) update('homeworkSubjectIds', [])
                  }}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                Count toward homework tracking
              </label>
              {data.countsForHomework && homeschoolSubjects && homeschoolSubjects.length > 0 && (
                <div style={{ marginLeft: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {homeschoolSubjects.map(s => {
                    const selected = (data.homeworkSubjectIds ?? []).includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const current = data.homeworkSubjectIds ?? []
                          update('homeworkSubjectIds', selected
                            ? current.filter(id => id !== s.id)
                            : [...current, s.id]
                          )
                        }}
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '999px',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 500,
                          backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                          color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                          border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <input
              type="checkbox"
              checked={data.countsForGamification ?? true}
              onChange={(e) => update('countsForGamification', e.target.checked)}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            Count toward gamification points
          </label>
        </div>

        {/* Bonus config — visible only when reward is set */}
        {data.reward.rewardType && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>
                Bonus Threshold
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="number"
                  value={data.reward.bonusThreshold}
                  onChange={(e) => update('reward', { ...data.reward, bonusThreshold: e.target.value })}
                  style={{ ...inputStyle, width: 80 }}
                />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>%</span>
              </div>
              <HelperText>What completion percentage triggers a bonus?</HelperText>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 'var(--font-size-sm)', marginBottom: '0.25rem' }}>
                Bonus Amount
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="number"
                  value={data.reward.bonusPercentage}
                  onChange={(e) => update('reward', { ...data.reward, bonusPercentage: e.target.value })}
                  style={{ ...inputStyle, width: 80 }}
                />
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>%</span>
              </div>
              <HelperText>How much extra on top of the base reward?</HelperText>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 8. Reward Reveal */}
      {currentMember?.family_id && (
        <SectionCard>
          <AttachRevealSection
            value={data.rewardRevealConfig ?? null}
            onChange={(config) => update('rewardRevealConfig', config)}
            familyId={currentMember.family_id}
            showTriggerConfig={data.taskType !== 'task'}
            variant="section-card"
          />
        </SectionCard>
      )}

      {/* 9. Studio library info */}
      {data.taskType === 'routine' && (
        <div style={{
          padding: '0.625rem 0.75rem',
          marginBottom: '0.5rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
          border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
        }}>
          <p style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Routines are automatically saved to your <strong style={{ color: 'var(--color-text-primary)' }}>Studio library</strong>.
            You can redeploy them to other kids anytime from Studio &rarr; My Customized.
            {(data.assignments.length === 0 && !data.wholeFamily) &&
              ' Or use "Save to Studio" below to save this routine without assigning it yet.'
            }
          </p>
        </div>
      )}
    </div>
  )

  // ─── Footer ─────────────────────────────────────────────────

  const hasRoutineSections = data.taskType === 'routine' && (data.routineSections?.length ?? 0) > 0
  const hasAssignees = data.assignments.length > 0 || data.wholeFamily

  const footer = (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
      <Button variant="ghost" onClick={onClose} type="button">
        Cancel
      </Button>
      {/* Save to Studio — routine templates only, when there are sections to save */}
      {hasRoutineSections && !editMode && (
        <Tooltip
          content="Save this routine to your Studio library without assigning it to anyone yet. Deploy it later from Studio &rarr; My Customized."
          position="top"
          maxWidth={280}
        >
          <span style={{ display: 'inline-flex' }}>
            <Button
              variant="secondary"
              onClick={handleSaveToStudio}
              loading={loading}
              disabled={!data.title.trim()}
            >
              Save to Studio
            </Button>
          </span>
        </Tooltip>
      )}
      <Button
        variant="primary"
        onClick={handleSave}
        loading={loading}
        disabled={!data.title.trim() || (!editMode && hasRoutineSections && !hasAssignees)}
      >
        {editMode
          ? 'Save Changes'
          : batchMode === 'sequential' && batchIndex < batchTotal - 1
            ? 'Save & Next'
            : hasRoutineSections
              ? 'Assign & Create'
              : 'Create Task'}
      </Button>
    </div>
  )

  // ─── Master-template edit confirmation handler (c3) ─────────
  // When mom confirms the edit, archive the modal state and re-enter
  // the save path with the stashed finalData. Cancel just closes.
  const handleEditConfirm = useCallback(async () => {
    const stash = editConfirmState
    if (!stash) return
    setLoading(true)
    try {
      await onSave(stash.pendingFinalData)
      // Worker ROUTINE-PROPAGATION (c6): post-confirm toast naming
      // every affected family member. "Saved — updated 3 active
      // routines: Ruthie, Mosiah, and Gideon."
      const names = distinctAssigneeNames(stash.deployments)
      const count = names.length
      const routineWord = count === 1 ? 'routine' : 'routines'
      const nameList = formatNameList(names)
      showToast(
        nameList
          ? `Saved — updated ${count} active ${routineWord}: ${nameList}.`
          : `Saved — updated ${count} active ${routineWord}.`,
      )
      setEditConfirmState(null)
      if (
        batchMode === 'sequential' &&
        batchItems &&
        batchIndex < batchItems.length - 1
      ) {
        setBatchIndex(i => i + 1)
      } else {
        onClose()
      }
    } catch (err) {
      // Worker ROUTINE-SAVE-FIX (c2): post-confirm save failure. Keep
      // editConfirmState as-is so mom can either retry the modal Update
      // button OR cancel out and adjust her edits — either path stays
      // discoverable instead of vanishing silently.
      console.error('Routine save failed:', err)
      showErrorToast("Couldn't save changes. Please try again or contact support.")
    } finally {
      setLoading(false)
    }
  }, [editConfirmState, onSave, onClose, batchMode, batchItems, batchIndex, showToast, showErrorToast])

  const handleEditCancel = useCallback(() => {
    setEditConfirmState(null)
  }, [])

  // ─── Overlap resolution handler ─────────────────────────────
  // Worker ROUTINE-PROPAGATION (c2.5, founder D5): when mom picks one
  // of the three options in the resolution modal, apply the side
  // effect (archive existing or noop) and then re-enter the save path
  // with the stashed finalData.
  const handleOverlapResolve = useCallback(
    async (choice: RoutineOverlapChoice) => {
      const stash = overlapState
      if (!stash) return

      if (choice.kind === 'cancel' || choice.kind === 'adjust') {
        // Both close the modal but leave TaskCreationModal open so mom
        // can think or adjust the date pickers. No save.
        setOverlapState(null)
        return
      }

      if (choice.kind === 'replace') {
        // Archive every existing overlapping deployment (one row per
        // candidate, may be multiple if mom is deploying to several
        // family members and each had an overlap), then proceed with
        // the original save.
        setLoading(true)
        try {
          const idsToArchive = Array.from(
            new Set(stash.candidates.map(c => c.existingTaskId)),
          )
          if (idsToArchive.length > 0) {
            const { error: archiveError } = await supabase
              .from('tasks')
              .update({ archived_at: new Date().toISOString() })
              .in('id', idsToArchive)
            if (archiveError) {
              console.error(
                '[TaskCreationModal] Failed to archive overlapping deployments:',
                archiveError,
              )
              setOverlapState(null)
              setLoading(false)
              return
            }
          }
          await onSave(stash.pendingFinalData)
          // Worker ROUTINE-PROPAGATION (c6): replace-then-save toast.
          // Names the assignee whose existing deployment was replaced.
          const replacedNames = Array.from(
            new Set(stash.candidates.map(c => c.assigneeDisplayName)),
          )
          const replacedNameList = formatNameList(replacedNames)
          showToast(
            replacedNameList
              ? `Replaced previous deployment for ${replacedNameList}.`
              : 'Routine saved.',
          )
          setOverlapState(null)
          if (
            batchMode === 'sequential' &&
            batchItems &&
            batchIndex < batchItems.length - 1
          ) {
            setBatchIndex(i => i + 1)
          } else {
            onClose()
          }
        } finally {
          setLoading(false)
        }
      }
    },
    [overlapState, onSave, onClose, batchMode, batchItems, batchIndex, showToast],
  )

  // ─── Render ─────────────────────────────────────────────────

  return (
    <>
    <ModalV2
      id={editMode ? 'task-edit' : 'task-create'}
      isOpen={isOpen}
      onClose={onClose}
      type="persistent"
      size="lg"
      title={editMode ? 'Edit task' : makeupConfig ? 'Assign Makeup Work' : 'New task'}
      subtitle={srcLabel ?? undefined}
      icon={CheckSquare}
      hasUnsavedChanges={hasUnsavedChanges}
      footer={footer}
      batchProgress={
        batchMode === 'sequential' && batchTotal > 1
          ? { current: batchIndex + 1, total: batchTotal }
          : undefined
      }
    >
      {viewMode === 'quick' ? quickModeContent : fullModeContent}

      {/* Bulk Add overlay for opportunities */}
      {showBulkAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 60%, transparent)' }}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl shadow-xl"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <BulkAddWithAI
              title="Bulk Add Opportunities"
              placeholder={`Paste a list of opportunity jobs, one per line. For example:\n\nVacuum the living room - $2\nWash the car - $5\nOrganize the pantry - $3\nWeed the front flower bed - $4`}
              hint="AI will parse each item as a separate opportunity. Include reward amounts if you like."
              parsePrompt={`Parse these opportunity/chore items into a structured list. Each item should be a separate job that a child can claim and complete for a reward. Extract the item name and any dollar amounts mentioned. Return JSON: { "items": [{ "text": "item name", "selected": true, "metadata": { "reward": "$2" } }] }`}
              onSave={async (items: ParsedBulkItem[]) => {
                const selected = items.filter(i => i.selected)
                for (const item of selected) {
                  const taskData: CreateTaskData = {
                    ...data,
                    title: item.text,
                    description: '',
                  }
                  // Apply reward if parsed from text
                  const reward = item.metadata?.reward as string | undefined
                  if (reward) {
                    const amount = parseFloat(reward.replace(/[^0-9.]/g, ''))
                    if (!isNaN(amount)) {
                      taskData.reward = {
                        ...data.reward,
                        rewardType: 'money' as RewardType,
                        rewardAmount: String(amount),
                      }
                    }
                  }
                  await onSave(taskData)
                }
                setShowBulkAdd(false)
              }}
              onClose={() => setShowBulkAdd(false)}
            />
          </div>
        </div>
      )}
    </ModalV2>

    {/* Worker ROUTINE-PROPAGATION (c2.5): routine overlap resolution.
        Renders as a sibling to the main modal so it floats above when
        the pre-check finds an overlap. */}
    {overlapState && (
      <RoutineOverlapResolutionModal
        isOpen={!!overlapState}
        onClose={() => setOverlapState(null)}
        candidates={overlapState.candidates}
        proposedDtstart={overlapState.proposedDtstart}
        proposedEndDate={overlapState.proposedEndDate}
        templateName={overlapState.pendingFinalData.title}
        onResolve={handleOverlapResolve}
      />
    )}

    {/* Worker ROUTINE-PROPAGATION (c3): master-template edit
        confirmation. Fires when mom edits a routine template that has
        active deployments. */}
    {editConfirmState && (
      <MasterTemplateEditConfirmationModal
        isOpen={!!editConfirmState}
        onClose={handleEditCancel}
        affectedNames={distinctAssigneeNames(editConfirmState.deployments)}
        affectedCount={distinctAssigneeNames(editConfirmState.deployments).length}
        templateName={editConfirmState.pendingFinalData.title}
        onConfirm={handleEditConfirm}
        onCancel={handleEditCancel}
      />
    )}
    </>
  )
}
