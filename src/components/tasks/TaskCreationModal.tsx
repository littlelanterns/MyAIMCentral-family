/**
 * TaskCreationModal (PRD-09A Screen 3, PRD-17 Screen 7 & 8)
 *
 * REDESIGNED: Compact two-column layout. No Quick/Full toggle.
 * No collapsible accordion sections. Everything above the fold.
 * Feels like filling out a sticky note, not completing a form.
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/shared'
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

const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: 'task', label: 'Task' },
  { key: 'routine', label: 'Routine' },
  { key: 'opportunity' as TaskType, label: 'Opportunity' },
  { key: 'habit', label: 'Habit' },
]

const INCOMPLETE_OPTIONS: { key: IncompleteAction; label: string }[] = [
  { key: 'auto_reschedule', label: 'Auto-reschedule' },
  { key: 'fresh_reset', label: 'Fresh reset' },
  { key: 'drop_after_date', label: 'Drop after date' },
  { key: 'reassign_until_complete', label: 'Reassign until done' },
  { key: 'require_decision', label: 'Ask me' },
  { key: 'escalate_to_parent', label: 'Escalate' },
]

// ─── Inline "More" expandable ───────────────────────────────

function MoreSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm flex items-center gap-1"
        style={{ color: 'var(--color-btn-primary-bg)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {label} <ChevronDown size={14} />
      </button>
    )
  }
  return <div className="space-y-3 pt-1">{children}</div>
}

// ─── Source label ────────────────────────────────────────────

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

// ─── Compact pill selector ──────────────────────────────────

function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all"
            style={{
              border: `1px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: active
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Member chip selector ───────────────────────────────────

function MemberChips({
  members,
  selected,
  wholeFamily,
  onToggleMember,
  onToggleFamily,
}: {
  members: Array<{ id: string; display_name: string }>
  selected: MemberAssignment[]
  wholeFamily: boolean
  onToggleMember: (id: string) => void
  onToggleFamily: () => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={onToggleFamily}
        className="px-2 py-0.5 rounded-full text-xs"
        style={{
          border: `1px solid ${wholeFamily ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
          backgroundColor: wholeFamily
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
            : 'var(--color-bg-secondary)',
          color: wholeFamily ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
          fontWeight: wholeFamily ? 600 : 400,
          cursor: 'pointer',
        }}
      >
        Everyone
      </button>
      {members.map((m) => {
        const active = selected.some((a) => a.memberId === m.id)
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggleMember(m.id)}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              border: `1px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: active
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                : 'var(--color-bg-secondary)',
              color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {m.display_name}
          </button>
        )
      })}
    </div>
  )
}

// ─── Compact day chips for quick schedule ────────────────────

function DayChips({
  days,
  onChange,
}: {
  days: number[]
  onChange: (days: number[]) => void
}) {
  const labels = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
  return (
    <div className="flex gap-1">
      {labels.map((label, idx) => {
        const active = days.includes(idx)
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(active ? days.filter((d) => d !== idx) : [...days, idx])}
            className="rounded-full text-xs flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────

export function TaskCreationModal({
  isOpen,
  onClose,
  onSave,
  queueItem,
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
  const [showScheduler, setShowScheduler] = useState(false)
  const [quickDays, setQuickDays] = useState<number[]>([])
  const [quickDate, setQuickDate] = useState('')

  // Batch state
  const [batchIndex, setBatchIndex] = useState(0)
  const activeBatchItem = batchMode === 'sequential' && batchItems ? batchItems[batchIndex] : undefined
  const batchTotal = batchItems?.length ?? 0

  // Re-init on queue item change
  useEffect(() => {
    const d = defaultTaskData(queueItem ?? activeBatchItem)
    if (initialTaskType) d.taskType = initialTaskType as TaskType
    setData(d)
    setShowScheduler(false)
    setQuickDays([])
    setQuickDate('')
  }, [queueItem?.id, activeBatchItem?.id, initialTaskType])

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
  const srcLabel = sourceLabel(queueItem?.source)

  const update = <K extends keyof CreateTaskData>(key: K, val: CreateTaskData[K]) =>
    setData((d) => ({ ...d, [key]: val }))

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

  // Batch progress bar
  const batchProgress = batchMode === 'sequential' && batchTotal > 1 ? (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((batchIndex + 1) / batchTotal) * 100}%`,
            backgroundColor: 'var(--color-btn-primary-bg)',
          }}
        />
      </div>
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {batchIndex + 1} of {batchTotal}
      </span>
    </div>
  ) : null

  // Section label style
  const sLabel: React.CSSProperties = {
    fontSize: 'var(--font-size-xs, 0.75rem)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginBottom: 4,
  }

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 55, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      role="dialog"
      aria-modal="true"
      aria-label="Create task"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-bg-overlay, rgba(0,0,0,0.5))' }}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, centered on desktop */}
      <div
        className="relative flex flex-col w-full md:max-w-lg md:mb-auto md:mt-auto"
        style={{
          maxHeight: '92dvh',
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--vibe-radius-card, 16px) var(--vibe-radius-card, 16px) 0 0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-heading)', margin: 0 }}>
              New task
            </h2>
            {srcLabel && (
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{srcLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center rounded-lg"
            style={{
              background: 'var(--color-bg-secondary)',
              border: 'none',
              cursor: 'pointer',
              padding: '0.375rem',
              color: 'var(--color-text-secondary)',
              minHeight: 36,
              minWidth: 36,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {batchProgress}

          {/* Task name — full width */}
          <input
            type="text"
            value={data.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            className="w-full text-base font-medium"
            style={{
              padding: '0.625rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              minHeight: 44,
            }}
          />

          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* WHO */}
            <div>
              <div style={sLabel}>Who</div>
              <MemberChips
                members={familyMembers.map((m) => ({ id: m.id, display_name: m.display_name }))}
                selected={data.assignments}
                wholeFamily={data.wholeFamily}
                onToggleMember={toggleMember}
                onToggleFamily={toggleFamily}
              />
            </div>

            {/* TYPE */}
            <div>
              <div style={sLabel}>Type</div>
              <PillSelect
                options={TASK_TYPES}
                value={data.taskType}
                onChange={(v) => setData((d) => ({
                  ...d,
                  taskType: v,
                  incompleteAction: v === 'routine' ? 'fresh_reset' : 'auto_reschedule',
                }))}
              />
            </div>

            {/* WHEN */}
            <div>
              <div style={sLabel}>When</div>
              {!showScheduler ? (
                <div className="space-y-1.5">
                  <DayChips days={quickDays} onChange={setQuickDays} />
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.5rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      backgroundColor: 'var(--color-bg-input)',
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-xs, 0.75rem)',
                      minHeight: 32,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScheduler(true)}
                    className="text-xs"
                    style={{ color: 'var(--color-btn-primary-bg)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    More options...
                  </button>
                </div>
              ) : (
                <UniversalScheduler
                  value={data.schedule}
                  onChange={(v) => update('schedule', v)}
                  showTimeDefault={false}
                  compactMode
                />
              )}
            </div>

            {/* IF NOT DONE */}
            <div>
              <div style={sLabel}>If not done</div>
              <select
                value={data.incompleteAction}
                onChange={(e) => update('incompleteAction', e.target.value as IncompleteAction)}
                style={{
                  width: '100%',
                  padding: '0.375rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  minHeight: 36,
                  cursor: 'pointer',
                }}
              >
                {INCOMPLETE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* REWARD */}
            <div>
              <div style={sLabel}>Reward</div>
              <select
                value={data.reward.rewardType || 'none'}
                onChange={(e) => {
                  const v = e.target.value === 'none' ? '' : e.target.value
                  update('reward', { ...data.reward, rewardType: v as RewardType })
                }}
                style={{
                  width: '100%',
                  padding: '0.375rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  minHeight: 36,
                  cursor: 'pointer',
                }}
              >
                <option value="none">None</option>
                <option value="stars">Stars</option>
                <option value="money">Money</option>
                <option value="privilege">Privilege</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* FLAGS */}
            <div>
              <div style={sLabel}>Flags</div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={data.reward.trackAsWidget}
                    onChange={(e) => update('reward', { ...data.reward, trackAsWidget: e.target.checked })}
                    style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                  />
                  Track time
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={data.reward.flagAsVictory}
                    onChange={(e) => update('reward', { ...data.reward, flagAsVictory: e.target.checked })}
                    style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                  />
                  Victory on complete
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={data.reward.requireApproval}
                    onChange={(e) => update('reward', { ...data.reward, requireApproval: e.target.checked })}
                    style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                  />
                  Require approval
                </label>
              </div>
            </div>
          </div>

          {/* Routine sections — shown inline when type=routine */}
          {isRoutine && (
            <div>
              <div style={sLabel}>Routine steps</div>
              <RoutineSectionEditor
                sections={data.routineSections ?? []}
                onChange={(sections) => update('routineSections', sections)}
              />
            </div>
          )}

          {/* More → expandable for rare fields */}
          <MoreSection label="More options →">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Description
              </label>
              <textarea
                value={data.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Optional details..."
                rows={2}
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
                  minHeight: '60px',
                }}
              />
            </div>
            <LifeAreaTagPicker
              value={data.lifeAreaTag}
              onChange={(v) => update('lifeAreaTag', v)}
              customValue={data.customLifeArea}
              onCustomChange={(v) => update('customLifeArea', v)}
            />
            <DurationPicker
              value={data.durationEstimate}
              onChange={(v) => update('durationEstimate', v)}
              customValue={data.customDuration}
              onCustomChange={(v) => update('customDuration', v)}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.saveAsTemplate}
                onChange={(e) => update('saveAsTemplate', e.target.checked)}
                id="save-template"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <label htmlFor="save-template" className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                Save as reusable template
              </label>
            </div>
            {data.saveAsTemplate && (
              <input
                type="text"
                value={data.templateName}
                onChange={(e) => update('templateName', e.target.value)}
                placeholder="Template name"
                className="w-full text-sm"
                style={{
                  padding: '0.375rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  minHeight: 36,
                }}
              />
            )}
          </MoreSection>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
            disabled={!data.title.trim()}
            fullWidth
          >
            {batchMode === 'sequential' && batchIndex < batchTotal - 1
              ? 'Save & next'
              : 'Save task'}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
