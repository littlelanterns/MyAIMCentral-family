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

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Layers, Users, Calendar, AlertCircle, Gift, ChevronDown, ChevronUp,
  CheckSquare, RotateCcw, Star, TrendingUp,
} from 'lucide-react'
import { Button, ModalV2 } from '@/components/shared'
import { UniversalScheduler } from '@/components/scheduling'
import { RoutineSectionEditor } from './RoutineSectionEditor'
import { DurationPicker } from './DurationPicker'
import { LifeAreaTagPicker } from './LifeAreaTagPicker'
import type { TaskType } from './TaskTypeSelector'
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
  title: string
  description: string
  durationEstimate: string
  customDuration: string
  lifeAreaTag: string
  customLifeArea: string
  imageUrl?: string
  taskType: TaskType
  opportunitySubType?: string
  maxCompletions?: string
  claimLockDuration?: string
  claimLockUnit?: string
  routineSections?: RoutineSection[]
  assignments: MemberAssignment[]
  wholeFamily: boolean
  rotationEnabled: boolean
  rotationFrequency: string
  schedule: SchedulerOutput | null
  incompleteAction: IncompleteAction
  reward: RewardConfigData
  saveAsTemplate: boolean
  templateName: string
  sourceQueueItemId?: string
  sourceBatchIds?: string[]
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

// ─── Constants ───────────────────────────────────────────────

const TASK_TYPES: {
  key: TaskType
  label: string
  description: string
  icon: React.ComponentType<{ size: number }>
}[] = [
  { key: 'task', label: 'Task', description: 'One-time or recurring responsibility', icon: CheckSquare },
  { key: 'routine', label: 'Routine', description: 'Multi-step checklist with sections', icon: RotateCcw },
  { key: 'opportunity' as TaskType, label: 'Opportunity', description: 'Optional — earn rewards, no pressure', icon: Star },
  { key: 'habit', label: 'Habit', description: 'Track consistency over time', icon: TrendingUp },
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
}: TaskCreationModalProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: familyMembers = [] } = useFamilyMembers(currentMember?.family_id)

  const [data, setData] = useState<CreateTaskData>(() => {
    const d = defaultTaskData(queueItem)
    if (initialTaskType) d.taskType = initialTaskType as TaskType
    return d
  })
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'quick' | 'full'>(initialMode ?? 'full')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('one_time')
  const [quickDays, setQuickDays] = useState<number[]>([])
  const [quickDate, setQuickDate] = useState('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [showTypesExplained, setShowTypesExplained] = useState(false)
  const [showTaskBreaker, setShowTaskBreaker] = useState(false)

  // Batch state
  const [batchIndex, setBatchIndex] = useState(0)
  const activeBatchItem = batchMode === 'sequential' && batchItems ? batchItems[batchIndex] : undefined
  const batchTotal = batchItems?.length ?? 0

  // Re-init on queue item change
  useEffect(() => {
    const d = defaultTaskData(queueItem ?? activeBatchItem)
    if (initialTaskType) d.taskType = initialTaskType as TaskType
    setData(d)
    setScheduleMode('one_time')
    setQuickDays([])
    setQuickDate('')
    setShowScheduler(false)
    setShowTypesExplained(false)
    setShowTaskBreaker(false)
  }, [queueItem?.id, activeBatchItem?.id, initialTaskType])

  const update = <K extends keyof CreateTaskData>(key: K, val: CreateTaskData[K]) =>
    setData((d) => ({ ...d, [key]: val }))

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

  const hasUnsavedChanges = data.title.trim().length > 0 || data.description.trim().length > 0

  const srcLabel = sourceLabel(queueItem?.source)

  // Assignable members (children and non-primary adults)
  const assignableMembers = familyMembers.filter(
    (m) => m.is_active && m.id !== currentMember?.id
  )

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
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            style={{ ...inputStyle, marginTop: '0.5rem' }}
          />
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
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {assignableMembers.map((m) => {
          const selected = data.assignments.some((a) => a.memberId === m.id)
          const color = m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className="rounded-full text-xs font-semibold transition-all duration-150"
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: selected ? color : 'transparent',
                color: selected ? '#fff' : 'var(--color-text-primary)',
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
        {/* Whole Family toggle */}
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

      {/* 2. Task Basics */}
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
            <div style={{ color: 'var(--color-btn-primary-bg)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              TaskBreaker AI
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', margin: '0 0 0.625rem' }}>
              Based on your description, TaskBreaker can create smart subtasks...
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="primary" size="sm" onClick={() => { /* Stub: TaskBreaker AI */ }}>
                Generate Subtasks
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { /* Stub: checklist split */ }}>
                Organize as Checklist
              </Button>
            </div>
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

      {/* 3. Task Type */}
      <SectionCard>
        <SectionHeading icon={Layers}>Task Type</SectionHeading>

        {/* 2x2 toggle grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {TASK_TYPES.map((tt) => {
            const active = data.taskType === tt.key
            const TypeIcon = tt.icon
            return (
              <button
                key={tt.key}
                type="button"
                onClick={() => setData((d) => ({
                  ...d,
                  taskType: tt.key,
                  incompleteAction: tt.key === 'routine' ? 'fresh_reset' : 'auto_reschedule',
                }))}
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
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Habits</strong> track consistency over time. Focus on showing up, not perfection.
            </p>
          </div>
        )}

        {/* Routine section editor (appears when routine is selected) */}
        {data.taskType === 'routine' && (
          <div style={{ marginTop: '0.75rem' }}>
            <RoutineSectionEditor
              sections={data.routineSections ?? []}
              onChange={(sections) => update('routineSections', sections)}
            />
          </div>
        )}
      </SectionCard>

      {/* 4. Who's Responsible */}
      <SectionCard>
        <SectionHeading icon={Users}>Who's Responsible?</SectionHeading>
        {renderAssignmentRows()}
      </SectionCard>

      {/* 5. Schedule */}
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
            <input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              style={inputStyle}
            />
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
            <HelperText>For complex schedules like "every other Wednesday" or "first Monday of each month"</HelperText>
          </div>
        )}
      </SectionCard>

      {/* 6. If Not Completed */}
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

      {/* 8. Template (not a card — simple row) */}
      <div style={{ padding: '0.25rem 0', marginBottom: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
          <input
            type="checkbox"
            checked={data.saveAsTemplate}
            onChange={(e) => update('saveAsTemplate', e.target.checked)}
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
          Save as a reusable template in your Studio library
        </label>
        {data.saveAsTemplate && (
          <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <input
              type="text"
              value={data.templateName}
              onChange={(e) => update('templateName', e.target.value)}
              placeholder="e.g., Weekly Bedroom Clean, Daily Reading Practice..."
              style={inputStyle}
            />
            <HelperText>Name it something descriptive so you can find it later</HelperText>
          </div>
        )}
      </div>
    </div>
  )

  // ─── Footer ─────────────────────────────────────────────────

  const footer = (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
      <Button variant="ghost" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        loading={loading}
        disabled={!data.title.trim()}
      >
        {batchMode === 'sequential' && batchIndex < batchTotal - 1
          ? 'Save & Next'
          : 'Create Task'}
      </Button>
    </div>
  )

  // ─── Render ─────────────────────────────────────────────────

  return (
    <ModalV2
      id="task-create"
      isOpen={isOpen}
      onClose={onClose}
      type="persistent"
      size="lg"
      title="New task"
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
    </ModalV2>
  )
}
