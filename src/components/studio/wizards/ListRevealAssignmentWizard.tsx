/**
 * ListRevealAssignmentWizard — Phase 3.7 Worker D
 *
 * Two-flavor wizard:
 *   Opportunity: kids browse a list, claim items, earn money/points/rewards
 *   Draw: spin/reveal picks from list, result assigned as task
 *
 * Composes contracts under the hood for automatic reward delivery.
 * Integrates useWizardDraft for save-and-return (Convention 250).
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Sparkles, Plus, Trash2, GripVertical, DollarSign, Star,
  Trophy, Shuffle, CheckCircle2, AlertCircle,
  Users, Zap, Gift, ClipboardList, Film,
} from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardDraft } from './useWizardDraft'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import type { RevealAttachmentConfig } from '@/components/reward-reveals/AttachRevealSection'
import { useCreateContract } from '@/hooks/useContracts'
import { useRevealAnimations } from '@/hooks/useRewardReveals'
import { useShareList } from '@/hooks/useLists'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import type { OpportunityRewardType, FrequencyPeriod } from '@/types/lists'
import { ItemRecurrenceConfig, type ItemRecurrenceValue } from '@/components/lists/ItemRecurrenceConfig'
import type { GodmotherType, PresentationMode } from '@/types/contracts'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Types ─────────────────────────────────────────────────────

type WizardFlavor = 'opportunity' | 'draw'
type PersonPickMode = 'person_first' | 'draw_first'

interface ListItemDraft {
  id: string
  name: string
  description: string
  rewardType: OpportunityRewardType | ''
  rewardAmount: number | null
  requireApproval: boolean
  // Per-item recurrence (Phase 3.8)
  isRepeatable: boolean
  frequencyPeriod: FrequencyPeriod | null
  cooldownHours: number | null
  maxInstances: number | null
  sectionName: string | null
}

interface WizardState {
  flavor: WizardFlavor | null
  listName: string
  listDescription: string
  items: ListItemDraft[]
  // Opportunity-specific
  claimLockHours: number
  maxCompletionsPerItem: number | null
  approvalRequired: boolean
  // Draw-specific
  revealConfig: RevealAttachmentConfig | null
  personPickMode: PersonPickMode
  momCanSkip: boolean
  kidCanSkip: boolean
  deployTarget: 'standalone' | 'dashboard'
  // Shared
  sharingMode: 'all' | 'specific'
  selectedMemberIds: string[]
}

const INITIAL_STATE: WizardState = {
  flavor: null,
  listName: '',
  listDescription: '',
  items: [],
  claimLockHours: 2,
  maxCompletionsPerItem: null,
  approvalRequired: true,
  revealConfig: null,
  personPickMode: 'person_first',
  momCanSkip: true,
  kidCanSkip: false,
  deployTarget: 'standalone',
  sharingMode: 'all',
  selectedMemberIds: [],
}

const OPPORTUNITY_STEPS: WizardStep[] = [
  { key: 'flavor', title: 'Pick a Type' },
  { key: 'items', title: 'Add Items & Rewards' },
  { key: 'sharing', title: 'Who Can Browse' },
  { key: 'rules', title: 'Claim Rules' },
  { key: 'review', title: 'Review' },
]

const DRAW_STEPS: WizardStep[] = [
  { key: 'flavor', title: 'Pick a Type' },
  { key: 'items', title: 'Add Items' },
  { key: 'reveal', title: 'Pick a Reveal' },
  { key: 'person_pick', title: 'Who Gets It' },
  { key: 'skip_rules', title: 'Skip Rules' },
  { key: 'target', title: 'Where It Lives' },
  { key: 'review', title: 'Review' },
]

const REWARD_TYPE_OPTIONS: Array<{ value: OpportunityRewardType; label: string; icon: typeof DollarSign }> = [
  { value: 'money', label: 'Money ($)', icon: DollarSign },
  { value: 'points', label: 'Points', icon: Star },
  { value: 'privilege', label: 'Privilege', icon: Trophy },
  { value: 'custom', label: 'Custom', icon: Gift },
]

// ─── Seeded template pre-fill configs ──────────────────────────

export interface ListRevealPreFill {
  flavor: WizardFlavor
  listName: string
  listDescription: string
  items: ListItemDraft[]
  // Opportunity-specific
  claimLockHours?: number
  approvalRequired?: boolean
  // Draw-specific
  personPickMode?: PersonPickMode
  kidCanSkip?: boolean
  deployTarget?: 'standalone' | 'dashboard'
}

export const CONSEQUENCE_SPINNER_PREFILL: ListRevealPreFill = {
  flavor: 'draw',
  listName: 'Consequences',
  listDescription: 'Fair, pre-decided consequences the whole family agrees on.',
  items: [
    { id: 'c1', name: 'Wash the dishes', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c2', name: 'Clean the bathroom mirror', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c3', name: 'Vacuum the living room', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c4', name: 'Write a kind note to each family member', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c5', name: '10 minutes of reading', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c6', name: 'Organize the shoe rack', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c7', name: 'Wipe down kitchen counters', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
    { id: 'c8', name: 'Help with dinner prep', description: '', rewardType: '', rewardAmount: null, requireApproval: false, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: null },
  ],
  personPickMode: 'person_first',
  kidCanSkip: false,
  deployTarget: 'standalone',
}

export const EXTRA_EARNING_PREFILL: ListRevealPreFill = {
  flavor: 'opportunity',
  listName: 'Extra Earning Opportunities',
  listDescription: 'Bonus jobs kids can claim for money.',
  items: [
    { id: 'e1', name: 'Wash the car', description: '', rewardType: 'money', rewardAmount: 10, requireApproval: true, isRepeatable: true, frequencyPeriod: 'week', cooldownHours: 168, maxInstances: null, sectionName: 'Weekly Jobs' },
    { id: 'e2', name: 'Mow the lawn', description: '', rewardType: 'money', rewardAmount: 15, requireApproval: true, isRepeatable: true, frequencyPeriod: 'week', cooldownHours: 168, maxInstances: null, sectionName: 'Weekly Jobs' },
    { id: 'e3', name: 'Organize the pantry', description: '', rewardType: 'money', rewardAmount: 8, requireApproval: true, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: 'Anytime Jobs' },
    { id: 'e4', name: 'Deep clean bedroom', description: '', rewardType: 'money', rewardAmount: 5, requireApproval: true, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: 'Anytime Jobs' },
    { id: 'e5', name: 'Help with laundry', description: '', rewardType: 'money', rewardAmount: 5, requireApproval: true, isRepeatable: true, frequencyPeriod: null, cooldownHours: null, maxInstances: null, sectionName: 'Anytime Jobs' },
    { id: 'e6', name: 'Weed the garden', description: '', rewardType: 'money', rewardAmount: 12, requireApproval: true, isRepeatable: true, frequencyPeriod: 'week', cooldownHours: 168, maxInstances: null, sectionName: 'Weekly Jobs' },
  ],
  claimLockHours: 24,
  approvalRequired: true,
}

// ─── Helpers ───────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatDollars(n: number | null): string {
  if (n == null) return ''
  return `$${n.toFixed(2)}`
}

// ─── Sortable Item Row (Step 2) ────────────────────────────────

function SortableItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: ListItemDraft
  onUpdate: (id: string, field: keyof ListItemDraft, value: string | number | null | boolean) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg"
      {...attributes}
    >
      <button
        type="button"
        className="cursor-grab touch-none shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <input
        type="text"
        value={item.name}
        onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
        placeholder="Item name"
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm border"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      />

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 p-1 rounded transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Per-Item Reward Config Row (Step 3 — NEW-WW) ──────────────

function RewardConfigRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: ListItemDraft
  onUpdate: (id: string, field: keyof ListItemDraft, value: string | number | null | boolean) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="shrink-0 p-1 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-muted)' }}
            title="Remove item"
          >
            <Trash2 size={14} />
          </button>
        )}
        <span
          className="text-sm font-medium flex-1 min-w-0 truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {item.name || 'Unnamed item'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={item.rewardType}
          onChange={(e) => onUpdate(item.id, 'rewardType', e.target.value)}
          className="px-2 py-1.5 rounded-lg text-xs border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">No reward</option>
          {REWARD_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(item.rewardType === 'money' || item.rewardType === 'points') && (
          <input
            type="number"
            value={item.rewardAmount ?? ''}
            onChange={(e) => onUpdate(item.id, 'rewardAmount', e.target.value ? Number(e.target.value) : null)}
            placeholder={item.rewardType === 'money' ? '$0.00' : '0'}
            min={0}
            step={item.rewardType === 'money' ? 0.01 : 1}
            className="w-20 px-2 py-1.5 rounded-lg text-xs border text-right"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        )}

        <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={item.requireApproval}
            onChange={(e) => onUpdate(item.id, 'requireApproval', e.target.checked)}
            className="rounded"
          />
          Approve
        </label>
      </div>
    </div>
  )
}

// ─── Main Wizard ───────────────────────────────────────────────

interface ListRevealAssignmentWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: Array<{
    id: string
    display_name: string
    is_active?: boolean
    calendar_color?: string | null
    assigned_color?: string | null
    member_color?: string | null
  }>
  preFill?: ListRevealPreFill
}

export function ListRevealAssignmentWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
  preFill,
}: ListRevealAssignmentWizardProps) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [deployed, setDeployed] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const stateRef = useRef(state)
  stateRef.current = state

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<ListItemDraft[]>([])
  const [aiSelectedIds, setAiSelectedIds] = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Bulk paste
  const [bulkInput, setBulkInput] = useState('')
  const [isBulkParsing, setIsBulkParsing] = useState(false)
  const [showBulkInput, setShowBulkInput] = useState(false)

  // Draft persistence
  const { draft, saveDraft, clearDraft } = useWizardDraft<WizardState>(
    'list_reveal_assignment',
    familyId,
  )
  const draftRestored = useRef(false)
  const preFillApplied = useRef(false)

  // Reveal animations for draw picker
  const { data: revealAnimations = [] } = useRevealAnimations()

  // Mutations
  const createContract = useCreateContract()
  const shareList = useShareList()
  const queryClient = useQueryClient()

  const childMembers = familyMembers.filter(
    (m) => m.id !== memberId && m.is_active !== false,
  )

  const steps = state.flavor === 'draw' ? DRAW_STEPS : OPPORTUNITY_STEPS

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Restore draft on mount (lower priority than preFill)
  useEffect(() => {
    if (preFill && !preFillApplied.current) {
      setState({
        ...INITIAL_STATE,
        flavor: preFill.flavor,
        listName: preFill.listName,
        listDescription: preFill.listDescription,
        items: preFill.items.map((i) => ({ ...i, id: makeId() })),
        claimLockHours: preFill.claimLockHours ?? 2,
        approvalRequired: preFill.approvalRequired ?? true,
        personPickMode: preFill.personPickMode ?? 'person_first',
        kidCanSkip: preFill.kidCanSkip ?? false,
        deployTarget: preFill.deployTarget ?? 'standalone',
      })
      preFillApplied.current = true
      setStep(1) // skip flavor selection since preFill sets it
      return
    }
    if (draft && !draftRestored.current && !preFill) {
      setState(draft)
      draftRestored.current = true
    }
  }, [draft, preFill])

  // Auto-save draft on step change and on meaningful content change
  const draftTitle = state.listName || 'Untitled List'
  const itemCount = state.items.length
  useEffect(() => {
    if (deployed || !isOpen) return
    if (state.listName || itemCount > 0) {
      saveDraft(state, draftTitle)
    }
  }, [step, state.listName, itemCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Item handlers ────────────────────────────────────────────

  const handleAddItem = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, {
        id: makeId(),
        name: '',
        description: '',
        rewardType: prev.flavor === 'opportunity' ? 'money' : '' as OpportunityRewardType | '',
        rewardAmount: null,
        requireApproval: prev.flavor === 'opportunity',
        isRepeatable: true,
        frequencyPeriod: null,
        cooldownHours: null,
        maxInstances: null,
        sectionName: null,
      }],
    }))
  }, [])

  const handleUpdateItem = useCallback((id: string, field: keyof ListItemDraft, value: string | number | null | boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setState((prev) => {
      const oldIndex = prev.items.findIndex((i) => i.id === active.id)
      const newIndex = prev.items.findIndex((i) => i.id === over.id)
      return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) }
    })
  }, [])

  // Bulk-set reward type/amount across all items
  const handleBulkSetReward = useCallback((type: OpportunityRewardType, amount: number | null) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        rewardType: type,
        rewardAmount: amount,
        requireApproval: type === 'money',
      })),
    }))
  }, [])

  const handleRecurrenceChange = useCallback((id: string, val: ItemRecurrenceValue) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? {
          ...item,
          isRepeatable: val.is_repeatable,
          frequencyPeriod: val.frequency_period,
          cooldownHours: val.cooldown_hours,
          maxInstances: val.max_instances,
        } : item,
      ),
    }))
  }, [])

  const handleMemberToggle = useCallback((id: string) => {
    setState((prev) => {
      const ids = prev.selectedMemberIds.includes(id)
        ? prev.selectedMemberIds.filter((mid) => mid !== id)
        : [...prev.selectedMemberIds, id]
      return { ...prev, selectedMemberIds: ids }
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    setState((prev) => {
      const allSelected = childMembers.length > 0 && prev.selectedMemberIds.length === childMembers.length
      return {
        ...prev,
        sharingMode: allSelected ? 'specific' : 'all',
        selectedMemberIds: allSelected ? [] : childMembers.map((m) => m.id),
      }
    })
  }, [childMembers])

  // ── AI Suggestions ───────────────────────────────────────────

  const handleAISuggest = useCallback(async () => {
    setAiLoading(true)
    setAiError('')
    setAiSuggestions([])
    setAiSelectedIds(new Set())

    try {
      const isOpportunity = state.flavor === 'opportunity'
      const systemPrompt = isOpportunity
        ? `You are helping a mom set up an opportunity board for her kids. Suggest 8 household jobs kids can earn from. Return ONLY a JSON array of objects with "name" (string) and "amount" (number, dollars). Range from $1 to $20. Age-appropriate, household-focused.`
        : `You are helping a mom set up a consequence/activity spinner. Suggest 8 items for the spinner. Return ONLY a JSON array of objects with "name" (string). Age-appropriate, constructive consequences or fun activities. Never punitive or shaming.`

      const context = state.listName
        ? `List name: "${state.listName}".${state.listDescription ? ` Context: ${state.listDescription}` : ''}`
        : isOpportunity ? 'Suggest household jobs for a family opportunity board.' : 'Suggest items for a family consequence spinner.'

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: context }],
        2048,
        'haiku',
      )

      const parsed = extractJSON<Array<{ name: string; amount?: number }>>(response)
      if (parsed && Array.isArray(parsed)) {
        const suggestions: ListItemDraft[] = parsed.map((s) => ({
          id: makeId(),
          name: s.name || '',
          description: '',
          rewardType: isOpportunity ? 'money' as OpportunityRewardType : '' as OpportunityRewardType | '',
          rewardAmount: s.amount ?? null,
          requireApproval: isOpportunity,
          isRepeatable: true,
          frequencyPeriod: null,
          cooldownHours: null,
          maxInstances: null,
          sectionName: null,
        }))
        setAiSuggestions(suggestions)
        setAiSelectedIds(new Set(suggestions.map((s) => s.id)))
      } else {
        setAiError('Could not parse suggestions. Try again?')
      }
    } catch {
      setAiError('AI suggestions failed. You can add items manually.')
    } finally {
      setAiLoading(false)
    }
  }, [state.flavor, state.listName, state.listDescription])

  const handleAcceptSuggestions = useCallback(() => {
    const accepted = aiSuggestions.filter((s) => aiSelectedIds.has(s.id))
    setState((prev) => ({
      ...prev,
      items: [...prev.items, ...accepted],
    }))
    setAiSuggestions([])
    setAiSelectedIds(new Set())
  }, [aiSuggestions, aiSelectedIds])

  // ── Bulk Paste + AI Parse ───────────────────────────────────

  const handleBulkParse = useCallback(async () => {
    if (!bulkInput.trim()) return
    setIsBulkParsing(true)
    setAiError('')

    try {
      const isOpportunity = state.flavor === 'opportunity'
      const systemPrompt = isOpportunity
        ? `You parse a mom's pasted list of earning opportunities / chores for kids into structured items.

For each item, return a JSON object with:
- "name": the cleaned-up task/job name (strip bullets, numbering, dashes)
- "amount": dollar amount if mentioned ($5, 5$, 15 dollars → 15), or null
- "description": any extra notes that are NOT timing/frequency info
- "is_repeatable": boolean. true if the job can be done more than once. false if it's a one-time job.
- "frequency_period": "day", "week", or "month" — how often the job resets. null if one-time or unlimited.
- "cooldown_hours": minimum hours between completions (e.g., weekly → 168, monthly → 720, biweekly → 336). null if one-time or unlimited.
- "max_instances": 1 for one-time jobs, null for repeatable jobs.

Frequency detection rules:
- "(can happen weekly)" or "weekly" → is_repeatable: true, frequency_period: "week", cooldown_hours: 168
- "(once)" or "one-time" → is_repeatable: false, max_instances: 1
- "(monthly)" or "once a month" → is_repeatable: true, frequency_period: "month", cooldown_hours: 720
- "(every two weeks)" or "biweekly" → is_repeatable: true, frequency_period: "week", cooldown_hours: 336
- "(daily)" or "every day" → is_repeatable: true, frequency_period: "day", cooldown_hours: 24
- No timing mentioned → is_repeatable: true, frequency_period: null, cooldown_hours: null, max_instances: null (anytime)
- Strip timing info from the name and description — it goes into the structured fields above

Other rules:
- Section headers / category headers → skip them, use as context
- Grid/range patterns like "Drawer 1A through 3E" → EXPAND into individual items
- Items with multiple price tiers (e.g., "Mow lawn $10 front / $15 back") → separate items with own amounts

Return ONLY a JSON array. No markdown, no preamble.`
        : `You parse a mom's pasted list of consequences or activities for a spinner/draw into structured items.

For each item, return a JSON object with:
- "name": the cleaned-up activity name (strip bullets, numbering, dashes)
- "description": any extra notes
- "is_repeatable": boolean. true unless explicitly one-time.
- "frequency_period": "day", "week", or "month" if timing is mentioned, else null.
- "cooldown_hours": minimum hours between draws. null if unlimited.
- "max_instances": 1 for one-time items, null for repeatable.

Rules:
- Section headers → skip, use as context
- Grid/range patterns → EXPAND into individual items
- Keep the tone constructive — never add punitive language
- Strip timing info from the name — it goes into the structured fields

Return ONLY a JSON array. No markdown, no preamble.`

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: bulkInput }],
        4096,
        'haiku',
      )

      type BulkParsedItem = {
        name: string
        amount?: number | null
        description?: string
        is_repeatable?: boolean
        frequency_period?: FrequencyPeriod | null
        cooldown_hours?: number | null
        max_instances?: number | null
      }

      const parsed = extractJSON<BulkParsedItem[]>(response)
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        const newItems: ListItemDraft[] = parsed
          .filter((p) => p.name && p.name.trim())
          .map((p) => {
            const isOneTime = p.max_instances === 1 || p.is_repeatable === false
            const fp = isOneTime ? null : (p.frequency_period as FrequencyPeriod | null) ?? null
            const cd = isOneTime ? null : p.cooldown_hours ?? null

            let sectionName: string | null = null
            if (isOpportunity) {
              if (isOneTime) sectionName = 'One-Time Jobs'
              else if (fp === 'day') sectionName = 'Daily Jobs'
              else if (fp === 'week' && cd && cd > 168) sectionName = 'Every Two Weeks'
              else if (fp === 'week') sectionName = 'Weekly Jobs'
              else if (fp === 'month') sectionName = 'Monthly Jobs'
              else sectionName = 'Anytime Jobs'
            }

            return {
              id: makeId(),
              name: p.name.trim(),
              description: p.description?.trim() || '',
              rewardType: (isOpportunity && p.amount != null ? 'money' : '') as OpportunityRewardType | '',
              rewardAmount: p.amount ?? null,
              requireApproval: isOpportunity,
              isRepeatable: !isOneTime,
              frequencyPeriod: fp,
              cooldownHours: cd,
              maxInstances: isOneTime ? 1 : (p.max_instances ?? null),
              sectionName,
            }
          })
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...newItems],
        }))
        setBulkInput('')
        setShowBulkInput(false)
      } else {
        setAiError('Could not parse your list. Try reformatting or adding items manually.')
      }
    } catch {
      setAiError('Parsing failed. You can add items manually instead.')
    } finally {
      setIsBulkParsing(false)
    }
  }, [bulkInput, state.flavor])

  // ── Deploy ───────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    setIsDeploying(true)
    setDeployError('')
    try {
      const validItems = state.items.filter((i) => i.name.trim())
      if (validItems.length === 0) return

      const isOpportunity = state.flavor === 'opportunity'

      // 1. Create the list
      const listPayload: Record<string, unknown> = {
        family_id: familyId,
        owner_id: memberId,
        title: state.listName.trim() || (isOpportunity ? 'Earning Opportunities' : 'Spinner List'),
        list_type: isOpportunity ? 'todo' : 'randomizer',
        description: state.listDescription || null,
        is_opportunity: isOpportunity,
        is_shared: true,
      }

      if (isOpportunity) {
        listPayload.default_opportunity_subtype = 'claimable'
        listPayload.default_claim_lock_duration = state.claimLockHours
        listPayload.default_claim_lock_unit = 'hours'
        listPayload.default_reward_type = 'money'
      }

      if (!isOpportunity) {
        listPayload.draw_mode = 'focused'
        listPayload.max_active_draws = 1
      }

      const { data: newList, error: listError } = await supabase
        .from('lists')
        .insert(listPayload)
        .select()
        .single()

      if (listError) throw listError
      const listId = newList.id as string

      // 2. Create list items
      const itemRows = validItems.map((item, idx) => {
        const row: Record<string, unknown> = {
          list_id: listId,
          content: item.name.trim(),
          notes: item.description || null,
          section_name: item.sectionName || null,
          sort_order: idx,
          is_repeatable: item.isRepeatable,
          is_available: true,
          frequency_period: item.frequencyPeriod,
          cooldown_hours: item.cooldownHours,
          max_instances: item.maxInstances,
        }
        if (isOpportunity && item.rewardType) {
          row.reward_type = item.rewardType
          row.reward_amount = item.rewardAmount
          row.opportunity_subtype = 'claimable'
          row.claim_lock_duration = state.claimLockHours
          row.claim_lock_unit = 'hours'
        }
        return row
      })

      const { error: itemsError } = await supabase
        .from('list_items')
        .insert(itemRows)

      if (itemsError) {
        console.warn('List items insert warning:', itemsError)
      }

      // 3. Share with selected members
      const shareTargets = state.sharingMode === 'all'
        ? childMembers.map((m) => m.id)
        : state.selectedMemberIds

      for (const mid of shareTargets) {
        try {
          await shareList.mutateAsync({
            listId,
            memberId: mid,
            canEdit: false,
          })
        } catch {
          // Non-critical
        }
      }

      // 4. Create contracts
      if (isOpportunity) {
        // Per-item contracts for items with rewards
        for (const item of validItems) {
          if (!item.rewardType) continue

          const godmother: GodmotherType =
            item.rewardType === 'money' ? 'money_godmother' :
            item.rewardType === 'points' ? 'points_godmother' :
            'custom_reward_godmother'

          const presentation: PresentationMode = item.rewardType === 'money' ? 'toast' : 'toast'

          try {
            await createContract.mutateAsync({
              family_id: familyId,
              created_by: memberId,
              status: 'active',
              source_type: 'list_item_completion',
              source_id: listId,
              source_category: 'opportunity_wizard',
              family_member_id: null,
              if_pattern: 'every_time',
              if_n: null,
              if_floor: null,
              if_window_kind: null,
              if_window_starts_at: null,
              if_window_ends_at: null,
              if_calendar_pattern: null,
              if_offset: 0,
              godmother_type: godmother,
              godmother_config_id: null,
              payload_amount: item.rewardAmount,
              payload_text: item.rewardType === 'privilege' || item.rewardType === 'custom' ? item.name : null,
              payload_config: null,
              stroke_of: 'immediate',
              stroke_of_time: null,
              recurrence_details: null,
              inheritance_level: 'family_default',
              override_mode: 'replace',
              presentation_mode: presentation,
              presentation_config: null,
            })
          } catch (err) {
            console.warn('Contract creation warning:', err)
          }
        }

        // Allowance registration contract
        try {
          await createContract.mutateAsync({
            family_id: familyId,
            created_by: memberId,
            status: 'active',
            source_type: 'list_item_completion',
            source_id: listId,
            source_category: 'opportunity_wizard',
            family_member_id: null,
            if_pattern: 'every_time',
            if_n: null,
            if_floor: null,
            if_window_kind: null,
            if_window_starts_at: null,
            if_window_ends_at: null,
            if_calendar_pattern: null,
            if_offset: 0,
            godmother_type: 'allowance_godmother',
            godmother_config_id: null,
            payload_amount: null,
            payload_text: null,
            payload_config: null,
            stroke_of: 'immediate',
            stroke_of_time: null,
            recurrence_details: null,
            inheritance_level: 'family_default',
            override_mode: 'replace',
            presentation_mode: 'silent',
            presentation_config: null,
          })
        } catch {
          // Non-critical
        }
      } else {
        // Draw flavor: assign_task_godmother contract
        try {
          await createContract.mutateAsync({
            family_id: familyId,
            created_by: memberId,
            status: 'active',
            source_type: 'randomizer_drawn',
            source_id: listId,
            source_category: 'draw_wizard',
            family_member_id: null,
            if_pattern: 'every_time',
            if_n: null,
            if_floor: null,
            if_window_kind: null,
            if_window_starts_at: null,
            if_window_ends_at: null,
            if_calendar_pattern: null,
            if_offset: 0,
            godmother_type: 'assign_task_godmother',
            godmother_config_id: null,
            payload_amount: null,
            payload_text: null,
            payload_config: {
              person_pick_mode: state.personPickMode,
              kid_can_skip: state.kidCanSkip,
            },
            stroke_of: 'immediate',
            stroke_of_time: null,
            recurrence_details: null,
            inheritance_level: 'family_default',
            override_mode: 'replace',
            presentation_mode: state.revealConfig ? 'reveal_animation' : 'toast',
            presentation_config: state.revealConfig ? {
              reveal: state.revealConfig,
            } : null,
          })
        } catch (err) {
          console.warn('Draw contract creation warning:', err)
        }
      }

      // 5. Save wizard_templates row
      try {
        await supabase.from('wizard_templates').insert({
          family_id: familyId,
          created_by: memberId,
          wizard_type: 'list_reveal_assignment',
          template_name: state.listName.trim() || (isOpportunity ? 'Earning Opportunities' : 'Spinner List'),
          config: {
            flavor: state.flavor,
            list_id: listId,
            deploy_target: isOpportunity ? 'lists' : state.deployTarget,
          },
        })
      } catch {
        // Non-critical
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['lists', familyId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', familyId] })

      clearDraft()
      setDeployed(true)
    } catch (err) {
      console.error('Wizard deploy failed:', err)
      setDeployError('Something went wrong. Please try again.')
    } finally {
      setIsDeploying(false)
    }
  }, [state, familyId, memberId, childMembers, createContract, shareList, clearDraft, queryClient])

  // ── Close handling ───────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (deployed) {
      onClose()
      return
    }
    const cur = stateRef.current
    const title = cur.listName || 'Untitled List'
    saveDraft(cur, title)
    onClose()
  }, [deployed, saveDraft, onClose])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setState(INITIAL_STATE)
      setStep(0)
      setDeployed(false)
      setDeployError('')
      setAiSuggestions([])
      setAiSelectedIds(new Set())
      setAiError('')
      draftRestored.current = false
      preFillApplied.current = false
    }
  }, [isOpen])

  // ── Validation ───────────────────────────────────────────────

  const validItems = state.items.filter((i) => i.name.trim())

  const canAdvance = (() => {
    const currentStepKey = steps[step]?.key
    if (currentStepKey === 'flavor') return state.flavor !== null
    if (currentStepKey === 'items') return validItems.length >= 1
    return true
  })()

  const canFinish = validItems.length >= 1

  // ── Step rendering ───────────────────────────────────────────

  const renderStep = () => {
    if (deployed) {
      const isOpportunity = state.flavor === 'opportunity'
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            {isOpportunity
              ? <DollarSign size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
              : <Shuffle size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {isOpportunity ? 'Opportunity board deployed!' : 'Spinner deployed!'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {isOpportunity
              ? `${state.listName || 'Your opportunity board'} is live. Kids can start browsing and claiming jobs.`
              : `${state.listName || 'Your spinner'} is ready. Use it from the Lists page.`}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done
          </button>
        </div>
      )
    }

    const currentStepKey = steps[step]?.key

    // ── Step: Flavor Selection ──────────────────────────────────
    if (currentStepKey === 'flavor') {
      return (
        <div className="space-y-4">
          <h4
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Choose Your Setup Type
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            What kind of list are you creating?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opportunity tile */}
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, flavor: 'opportunity' }))}
              className="text-left p-5 rounded-xl border-2 transition-all"
              style={{
                borderColor: state.flavor === 'opportunity' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.flavor === 'opportunity'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
                >
                  <DollarSign size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
                </div>
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
                >
                  Opportunities
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Kids browse and earn. Claim jobs for money, points, or rewards.
              </p>
            </button>

            {/* Draw tile */}
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, flavor: 'draw' }))}
              className="text-left p-5 rounded-xl border-2 transition-all"
              style={{
                borderColor: state.flavor === 'draw' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.flavor === 'draw'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
                >
                  <Shuffle size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
                </div>
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
                >
                  Draw
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Spin or reveal, assign result. Great for consequences or activity pickers.
              </p>
            </button>
          </div>
        </div>
      )
    }

    // ── Step: Add Items ─────────────────────────────────────────
    if (currentStepKey === 'items') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              List name
            </label>
            <input
              type="text"
              value={state.listName}
              onChange={(e) => setState((prev) => ({ ...prev, listName: e.target.value }))}
              placeholder={state.flavor === 'opportunity' ? 'e.g., Extra Earning Opportunities' : 'e.g., Consequences'}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {state.flavor === 'opportunity'
              ? 'What can kids earn from? Add jobs or tasks.'
              : 'What goes in the draw? Add items for the spinner.'}
          </p>

          {/* Bulk paste + AI suggest buttons */}
          {aiSuggestions.length === 0 && !showBulkInput && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkInput(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center border"
                style={{
                  borderColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-bg)',
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))',
                }}
              >
                <ClipboardList size={16} />
                Bulk Add with AI
              </button>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center border"
                style={{
                  borderColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-bg)',
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))',
                }}
              >
                <Sparkles size={16} />
                {aiLoading ? 'Thinking...' : 'Let AI suggest items'}
              </button>
            </div>
          )}

          {/* Bulk paste panel */}
          {showBulkInput && (
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{
                borderColor: 'var(--color-btn-primary-bg)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 3%, var(--color-bg-primary))',
              }}
            >
              <span
                className="text-sm font-medium flex items-center gap-1.5"
                style={{ color: 'var(--color-text-heading)' }}
              >
                <ClipboardList size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
                Bulk Add with AI
              </span>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {state.flavor === 'opportunity'
                  ? 'Paste items with dollar amounts. AI extracts names, prices, and notes.'
                  : 'Paste items for the spinner. One per line, or any format — AI figures it out.'}
              </p>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={state.flavor === 'opportunity'
                  ? 'e.g.\nWash the car $10\nOrganize pantry $5 (can happen weekly)\nMow the lawn - front $10 / back $15'
                  : 'e.g.\nWash the dishes\nVacuum the living room\n10 minutes of reading\nWrite a kind note to each family member'}
                rows={6}
                className="w-full px-3 py-2 rounded-lg text-sm border resize-y"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkParse}
                  disabled={isBulkParsing || !bulkInput.trim()}
                  className="flex-1 flex items-center gap-2 justify-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  <Sparkles size={14} />
                  {isBulkParsing ? 'Parsing...' : 'Add to list'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBulkInput(false); setBulkInput('') }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {aiError && (
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              {aiError}
            </p>
          )}

          {/* AI suggestions panel */}
          {aiSuggestions.length > 0 && (
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{
                borderColor: 'var(--color-btn-primary-bg)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 3%, var(--color-bg-primary))',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
                  AI Suggestions — pick the ones you like
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {aiSelectedIds.size} selected
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {aiSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all"
                    onClick={() => {
                      setAiSelectedIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(s.id)) next.delete(s.id)
                        else next.add(s.id)
                        return next
                      })
                    }}
                    style={{
                      borderColor: aiSelectedIds.has(s.id) ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                      backgroundColor: aiSelectedIds.has(s.id)
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-primary))'
                        : 'var(--color-bg-primary)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: aiSelectedIds.has(s.id) ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                        backgroundColor: aiSelectedIds.has(s.id) ? 'var(--color-btn-primary-bg)' : 'transparent',
                      }}
                    >
                      {aiSelectedIds.has(s.id) && <CheckCircle2 size={14} style={{ color: 'var(--color-btn-primary-text)' }} />}
                    </div>
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                    {s.rewardAmount != null && (
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDollars(s.rewardAmount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcceptSuggestions}
                  disabled={aiSelectedIds.size === 0}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  Add {aiSelectedIds.size} to list
                </button>
                <button
                  type="button"
                  onClick={() => { setAiSuggestions([]); setAiSelectedIds(new Set()); setAiError('') }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Bulk-set controls (opportunity only) */}
          {state.flavor === 'opportunity' && state.items.some((i) => i.name.trim()) && (
            <div
              className="flex flex-wrap items-center gap-2 p-3 rounded-lg border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Set all to:
              </span>
              <button type="button" onClick={() => handleBulkSetReward('money', 5)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>$5 each</button>
              <button type="button" onClick={() => handleBulkSetReward('money', 10)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>$10 each</button>
              <button type="button" onClick={() => handleBulkSetReward('points', 10)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>10 pts each</button>
            </div>
          )}

          {/* Items list with DnD */}
          {state.items.length > 0 && (
            <div
              className="rounded-lg border divide-y"
              style={{
                borderColor: 'var(--color-border)',
                // @ts-expect-error -- CSS custom property
                '--tw-divide-color': 'var(--color-border)',
              }}
            >
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={state.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {state.items.map((item) => (
                    <div key={item.id}>
                      <SortableItemRow
                        item={item}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                      />
                      {state.flavor === 'opportunity' && item.name.trim() && (
                        <div className="px-8 pb-2 space-y-1.5">
                          <RewardConfigRow
                            item={item}
                            onUpdate={handleUpdateItem}
                          />
                          <ItemRecurrenceConfig
                            value={{
                              is_repeatable: item.isRepeatable,
                              frequency_min: null,
                              frequency_max: null,
                              frequency_period: item.frequencyPeriod,
                              cooldown_hours: item.cooldownHours,
                              max_instances: item.maxInstances,
                            }}
                            onChange={(val) => handleRecurrenceChange(item.id, val)}
                          />
                        </div>
                      )}
                      {state.flavor === 'draw' && item.name.trim() && (
                        <div className="px-8 pb-2">
                          <ItemRecurrenceConfig
                            value={{
                              is_repeatable: item.isRepeatable,
                              frequency_min: null,
                              frequency_max: null,
                              frequency_period: item.frequencyPeriod,
                              cooldown_hours: item.cooldownHours,
                              max_instances: item.maxInstances,
                            }}
                            onChange={(val) => handleRecurrenceChange(item.id, val)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          >
            <Plus size={16} />
            Add item
          </button>
        </div>
      )
    }

    // rewards step removed — merged into items step above

    // ── Step: Sharing / Who Can Browse (Opportunity) ────────────
    if (currentStepKey === 'sharing') {
      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Which kids can see and claim these opportunities?
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: state.sharingMode === 'all' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.sharingMode === 'all' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
              }}
            >
              <input
                type="radio"
                name="sharing"
                checked={state.sharingMode === 'all'}
                onChange={() => setState((prev) => ({ ...prev, sharingMode: 'all' }))}
                className="shrink-0"
              />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>All kids</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Every kid in the family can browse and claim
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: state.sharingMode === 'specific' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.sharingMode === 'specific' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
              }}
            >
              <input
                type="radio"
                name="sharing"
                checked={state.sharingMode === 'specific'}
                onChange={() => setState((prev) => ({ ...prev, sharingMode: 'specific' }))}
                className="shrink-0 mt-1"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Specific kids</span>
                <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Only selected members can see these
                </p>
                {state.sharingMode === 'specific' && (
                  <MemberPillSelector
                    members={childMembers}
                    selectedIds={state.selectedMemberIds}
                    onToggle={handleMemberToggle}
                    showEveryone
                    onToggleAll={handleToggleAll}
                    showSortToggle={false}
                  />
                )}
              </div>
            </label>
          </div>
        </div>
      )
    }

    // ── Step: Claim Rules (Opportunity) ─────────────────────────
    if (currentStepKey === 'rules') {
      return (
        <div className="space-y-5">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            How do claims and approvals work?
          </p>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Claim lock duration
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
              How long a kid holds a claimed job before it auto-releases
            </p>
            <select
              value={state.claimLockHours}
              onChange={(e) => setState((prev) => ({ ...prev, claimLockHours: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={8}>8 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.approvalRequired}
                onChange={(e) => setState((prev) => ({ ...prev, approvalRequired: e.target.checked }))}
                className="rounded"
              />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Approval required for payout
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Mom approves before money or points credit
                </p>
              </div>
            </label>
          </div>
        </div>
      )
    }

    // ── Step: Reveal Animation (Draw) ──────────────────────────
    if (currentStepKey === 'reveal') {
      const selectedAnimId = state.revealConfig?.animationIds?.[0] ?? null
      const cssFirst = [...revealAnimations].sort((a, b) => {
        if (a.reveal_type === 'css' && b.reveal_type !== 'css') return -1
        if (a.reveal_type !== 'css' && b.reveal_type === 'css') return 1
        return a.sort_order - b.sort_order
      })

      const handlePickAnim = (animId: string) => {
        const anim = revealAnimations.find((a) => a.id === animId)
        if (!anim) return
        if (selectedAnimId === animId) {
          setState((prev) => ({ ...prev, revealConfig: null }))
          return
        }
        setState((prev) => ({
          ...prev,
          revealConfig: {
            libraryRevealId: null,
            animationIds: [animId],
            animationRotation: 'sequential',
            prizeMode: 'fixed',
            prizeType: 'text',
            prizeText: '',
            prizeName: '',
            prizeImageUrl: '',
            prizeAssetKey: '',
            prizePool: [],
            triggerMode: 'on_completion' as const,
            triggerN: null,
            isRepeating: true,
          },
        }))
      }

      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            How should the drawn item be revealed? Pick a style.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cssFirst.map((anim) => {
              const isSelected = selectedAnimId === anim.id
              const isCSS = anim.reveal_type === 'css'
              return (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => handlePickAnim(anim.id)}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center"
                  style={{
                    borderColor: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 rounded-full p-0.5"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--color-btn-primary-text)' }} />
                    </div>
                  )}
                  {anim.thumbnail_url ? (
                    <img
                      src={anim.thumbnail_url}
                      alt={anim.display_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                    >
                      {isCSS ? <Sparkles size={24} style={{ color: 'var(--color-btn-primary-bg)' }} /> : <Film size={24} style={{ color: 'var(--color-text-muted)' }} />}
                    </div>
                  )}
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {anim.display_name}
                  </span>
                </button>
              )
            })}
          </div>

          {!selectedAnimId && (
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Optional — skip if you want the result to appear without an animation.
            </p>
          )}
        </div>
      )
    }

    // ── Step: Person-Pick Config (Draw) ─────────────────────────
    if (currentStepKey === 'person_pick') {
      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            When the draw fires, who gets the result?
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, personPickMode: 'person_first' }))}
              className="w-full text-left p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: state.personPickMode === 'person_first' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.personPickMode === 'person_first'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  Person first
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Pick the kid, then spin. Best for consequences — mom picks who, then the wheel decides what.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, personPickMode: 'draw_first' }))}
              className="w-full text-left p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: state.personPickMode === 'draw_first' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.personPickMode === 'draw_first'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  Draw first
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Spin first, then assign. Best for activities — see the result, then decide who does it.
              </p>
            </button>
          </div>

          {/* Who is eligible */}
          <div className="pt-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Who can be assigned?
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
                style={{
                  borderColor: state.sharingMode === 'all' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                  backgroundColor: state.sharingMode === 'all' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
                }}
              >
                <input type="radio" name="draw_sharing" checked={state.sharingMode === 'all'} onChange={() => setState((prev) => ({ ...prev, sharingMode: 'all' }))} className="shrink-0" />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>All kids</span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer"
                style={{
                  borderColor: state.sharingMode === 'specific' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                  backgroundColor: state.sharingMode === 'specific' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
                }}
              >
                <input type="radio" name="draw_sharing" checked={state.sharingMode === 'specific'} onChange={() => setState((prev) => ({ ...prev, sharingMode: 'specific' }))} className="shrink-0 mt-1" />
                <div className="flex-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Specific kids</span>
                  {state.sharingMode === 'specific' && (
                    <div className="mt-2">
                      <MemberPillSelector
                        members={childMembers}
                        selectedIds={state.selectedMemberIds}
                        onToggle={handleMemberToggle}
                        showEveryone
                        onToggleAll={handleToggleAll}
                        showSortToggle={false}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      )
    }

    // ── Step: Skip Rules (Draw) ─────────────────────────────────
    if (currentStepKey === 'skip_rules') {
      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Can the result be skipped? Skipped items go back to the pool.
          </p>

          <div className="space-y-3">
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            >
              <input type="checkbox" checked disabled className="rounded opacity-50" />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mom can skip</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Always enabled</p>
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-primary)' }}
            >
              <input
                type="checkbox"
                checked={state.kidCanSkip}
                onChange={(e) => setState((prev) => ({ ...prev, kidCanSkip: e.target.checked }))}
                className="rounded"
              />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Kid can skip</span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Kid can re-spin if they don&apos;t like the result
                </p>
              </div>
            </label>
          </div>
        </div>
      )
    }

    // ── Step: Deploy Target (Draw) ──────────────────────────────
    if (currentStepKey === 'target') {
      return (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Where does this spinner live?
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, deployTarget: 'standalone' }))}
              className="w-full text-left p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: state.deployTarget === 'standalone' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.deployTarget === 'standalone'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Lists page
              </span>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Accessible from the Lists page as a randomizer list
              </p>
            </button>

            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, deployTarget: 'dashboard' }))}
              className="w-full text-left p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: state.deployTarget === 'dashboard' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.deployTarget === 'dashboard'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))'
                  : 'var(--color-bg-card)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Dashboard widget
              </span>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                A tappable card on the kid&apos;s dashboard
              </p>
            </button>

            <div
              className="w-full text-left p-4 rounded-lg border opacity-50"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Routine step
              </span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
                Coming soon
              </span>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Link into a routine as a linked step
              </p>
            </div>
          </div>
        </div>
      )
    }

    // ── Step: Review & Deploy ───────────────────────────────────
    if (currentStepKey === 'review') {
      const isOpportunity = state.flavor === 'opportunity'
      const totalEarnings = isOpportunity
        ? state.items.filter((i) => i.rewardType === 'money' && i.rewardAmount).reduce((sum, i) => sum + (i.rewardAmount ?? 0), 0)
        : 0

      return (
        <div className="space-y-4">
          <div
            className="rounded-lg border p-4 space-y-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <div>
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                {isOpportunity ? 'Opportunity Board' : 'Spinner'}
              </span>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                {state.listName || (isOpportunity ? 'Earning Opportunities' : 'Spinner List')}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Items ({validItems.length})
              </span>
              <div className="mt-1 space-y-1">
                {validItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {isOpportunity ? <DollarSign size={12} style={{ color: 'var(--color-text-muted)' }} /> : <Shuffle size={12} style={{ color: 'var(--color-text-muted)' }} />}
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.rewardAmount != null && item.rewardType === 'money' && (
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDollars(item.rewardAmount)}
                      </span>
                    )}
                    {item.rewardType === 'points' && item.rewardAmount != null && (
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        {item.rewardAmount} pts
                      </span>
                    )}
                  </div>
                ))}
                {validItems.length > 8 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    +{validItems.length - 8} more
                  </p>
                )}
              </div>
            </div>

            {isOpportunity && totalEarnings > 0 && (
              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Total Potential Earnings
                </span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  {formatDollars(totalEarnings)}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                {isOpportunity ? 'Available To' : 'Can Be Assigned To'}
              </span>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {state.sharingMode === 'all'
                  ? 'All kids'
                  : state.selectedMemberIds.length === 0
                    ? 'No one selected yet'
                    : state.selectedMemberIds
                        .map((id) => familyMembers.find((m) => m.id === id)?.display_name?.split(' ')[0])
                        .filter(Boolean)
                        .join(', ')}
              </p>
            </div>

            {isOpportunity && (
              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Claim Lock
                </span>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {state.claimLockHours} hour{state.claimLockHours !== 1 ? 's' : ''}
                  {state.approvalRequired ? ' — approval required' : ''}
                </p>
              </div>
            )}

            {!isOpportunity && (
              <>
                <div>
                  <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Person Pick
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {state.personPickMode === 'person_first' ? 'Pick person, then spin' : 'Spin first, then assign'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Skip
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    Mom: always | Kid: {state.kidCanSkip ? 'yes' : 'no'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Lives On
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {state.deployTarget === 'standalone' ? 'Lists page' : 'Dashboard widget'}
                  </p>
                </div>
              </>
            )}
          </div>

          {deployError && (
            <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <AlertCircle size={16} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{deployError}</p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <SetupWizard
      id="list-reveal-assignment-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title={
        state.flavor === 'opportunity'
          ? 'Extra Earning Opportunities'
          : state.flavor === 'draw'
            ? 'Consequence Spinner / Activity Draw'
            : 'Opportunities or Spinner'
      }
      subtitle={
        state.flavor === 'opportunity'
          ? 'Create a board where kids can claim jobs and earn rewards.'
          : state.flavor === 'draw'
            ? 'Build a spinner or reveal that picks from your list.'
            : 'Pick a flavor to get started.'
      }
      steps={steps}
      currentStep={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
      onFinish={handleDeploy}
      finishLabel="Deploy"
      canAdvance={canAdvance}
      canFinish={canFinish}
      isFinishing={isDeploying}
      hideNav={deployed}
    >
      {renderStep()}
    </SetupWizard>
  )
}
