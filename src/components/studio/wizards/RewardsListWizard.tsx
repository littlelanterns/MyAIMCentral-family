/**
 * RewardsListWizard — Phase 3.7 Worker B
 *
 * 4-step wizard: Name & Describe → Add Items → Sharing → Review & Deploy.
 * Creates a `lists` row with `list_type='reward_list'` plus `list_items` rows.
 * Integrates useWizardDraft for save-and-return (Convention 250).
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Gift, Sparkles, Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardDraft } from './useWizardDraft'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useCreateList, useShareList } from '@/hooks/useLists'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
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

const STEPS: WizardStep[] = [
  { key: 'name', title: 'Name It' },
  { key: 'items', title: 'Add Rewards' },
  { key: 'sharing', title: 'Who Gets It' },
  { key: 'review', title: 'Review' },
]

const TIER_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'big', label: 'Big' },
] as const

interface RewardItem {
  id: string
  name: string
  tier: 'small' | 'medium' | 'big' | ''
}

type SharingMode = 'all' | 'specific'

interface WizardState {
  listName: string
  description: string
  items: RewardItem[]
  sharingMode: SharingMode
  selectedMemberIds: string[]
}

const INITIAL_STATE: WizardState = {
  listName: '',
  description: '',
  items: [],
  sharingMode: 'all',
  selectedMemberIds: [],
}

interface RewardsListWizardProps {
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
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Sortable Item Row ────────────────────────────────────────

function SortableRewardRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: RewardItem
  onUpdate: (id: string, field: 'name' | 'tier', value: string) => void
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
        placeholder="Reward name"
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm border"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      />

      <select
        value={item.tier}
        onChange={(e) => onUpdate(item.id, 'tier', e.target.value)}
        className="shrink-0 px-2 py-1.5 rounded-lg text-sm border"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        <option value="">Tier</option>
        {TIER_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

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

// ─── AI Suggestion Card ───────────────────────────────────────

function AISuggestionCard({
  suggestion,
  isSelected,
  onToggle,
  onEditName,
  onEditTier,
}: {
  suggestion: RewardItem
  isSelected: boolean
  onToggle: () => void
  onEditName: (value: string) => void
  onEditTier: (value: string) => void
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all"
      onClick={onToggle}
      style={{
        borderColor: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
        backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
      }}
    >
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
          backgroundColor: isSelected ? 'var(--color-btn-primary-bg)' : 'transparent',
        }}
      >
        {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--color-btn-primary-text)' }} />}
      </div>

      <input
        type="text"
        value={suggestion.name}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onEditName(e.target.value)}
        className="flex-1 min-w-0 px-2 py-1 rounded text-sm bg-transparent border-0 outline-none"
        style={{ color: 'var(--color-text-primary)' }}
      />

      <select
        value={suggestion.tier}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onEditTier(e.target.value)}
        className="shrink-0 px-2 py-1 rounded text-xs border"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <option value="">Tier</option>
        {TIER_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Main Wizard Component ────────────────────────────────────

export function RewardsListWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
}: RewardsListWizardProps) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [deployed, setDeployed] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<RewardItem[]>([])
  const [aiSelectedIds, setAiSelectedIds] = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Draft persistence
  const { draft, saveDraft, clearDraft } = useWizardDraft<WizardState>(
    'rewards_list',
    familyId,
  )
  const draftRestored = useRef(false)

  // Restore draft on mount
  useEffect(() => {
    if (draft && !draftRestored.current) {
      setState(draft)
      draftRestored.current = true
    }
  }, [draft])

  // Auto-save draft on step change and on meaningful content change
  const draftTitle = state.listName || 'Untitled Rewards List'
  const itemCount = state.items.length
  useEffect(() => {
    if (deployed || !isOpen) return
    if (state.listName || itemCount > 0) {
      saveDraft(state, draftTitle)
    }
  }, [step, state.listName, itemCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const createList = useCreateList()
  const shareList = useShareList()

  const childMembers = familyMembers.filter(
    (m) => m.id !== memberId && m.is_active !== false,
  )

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── Handlers ──────────────────────────────────────────────────

  const handleAddItem = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { id: makeId(), name: '', tier: '' }],
    }))
  }, [])

  const handleUpdateItem = useCallback((id: string, field: 'name' | 'tier', value: string) => {
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

  // ── AI Suggestions ────────────────────────────────────────────

  const handleAISuggest = useCallback(async () => {
    setAiLoading(true)
    setAiError('')
    setAiSuggestions([])
    setAiSelectedIds(new Set())

    try {
      const systemPrompt = `You are a helpful assistant for a family rewards system. Suggest 8-10 reward ideas. Return ONLY a JSON array of objects with "name" (string) and "category" (one of "small", "medium", "big"). Small rewards are quick/easy (extra screen time, pick a snack). Medium are moderate (movie night, friend sleepover). Big are special (day trip, new toy). Make them age-appropriate and family-friendly.`

      const context = state.listName
        ? `Suggest rewards for a list called "${state.listName}".${state.description ? ` Context: ${state.description}` : ''}`
        : 'Suggest general family rewards for kids.'

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: context }],
        2048,
        'haiku',
      )

      const parsed = extractJSON<Array<{ name: string; category?: string }>>(response)
      if (parsed && Array.isArray(parsed)) {
        const suggestions = parsed.map((s) => ({
          id: makeId(),
          name: s.name || '',
          tier: (['small', 'medium', 'big'].includes(s.category || '') ? s.category : '') as RewardItem['tier'],
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
  }, [state.listName, state.description])

  const handleAcceptSuggestions = useCallback(() => {
    const accepted = aiSuggestions.filter((s) => aiSelectedIds.has(s.id))
    setState((prev) => ({
      ...prev,
      items: [...prev.items, ...accepted],
    }))
    setAiSuggestions([])
    setAiSelectedIds(new Set())
  }, [aiSuggestions, aiSelectedIds])

  const handleDismissSuggestions = useCallback(() => {
    setAiSuggestions([])
    setAiSelectedIds(new Set())
    setAiError('')
  }, [])

  // ── Deploy ────────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    setIsDeploying(true)
    try {
      const validItems = state.items.filter((i) => i.name.trim())
      if (validItems.length === 0) return

      const newList = await createList.mutateAsync({
        family_id: familyId,
        owner_id: memberId,
        title: state.listName.trim() || 'Untitled Rewards List',
        list_type: 'reward_list',
        default_items: validItems.map((item) => ({
          item_name: item.name.trim(),
          category: item.tier || undefined,
        })),
      })

      // Share with selected members
      const shareTargets =
        state.sharingMode === 'all'
          ? childMembers.map((m) => m.id)
          : state.selectedMemberIds

      for (const mid of shareTargets) {
        try {
          await shareList.mutateAsync({
            listId: newList.id,
            memberId: mid,
            canEdit: false,
            listType: 'reward_list',
          })
        } catch {
          // Non-critical — list was created, sharing is best-effort
        }
      }

      clearDraft()
      setDeployed(true)
    } catch (err) {
      console.error('Rewards list deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }, [state, familyId, memberId, childMembers, createList, shareList, clearDraft])

  // ── Close handling (save-as-draft prompt) ─────────────────────

  const handleClose = useCallback(() => {
    if (deployed) {
      onClose()
      return
    }
    const cur = { ...stateRef.current }
    const domInput = document.querySelector('[data-wizard-name="rewards_list"]') as HTMLInputElement | null
    if (domInput?.value) cur.listName = domInput.value
    const title = cur.listName || 'Untitled Rewards List'
    saveDraft(cur, title)
    onClose()
  }, [deployed, saveDraft, onClose])

  // ── Reset on close ────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      setState(INITIAL_STATE)
      setStep(0)
      setDeployed(false)
      setAiSuggestions([])
      setAiSelectedIds(new Set())
      setAiError('')
      draftRestored.current = false
    }
  }, [isOpen])

  // ── Step validation ───────────────────────────────────────────

  const validItems = state.items.filter((i) => i.name.trim())
  const canAdvance =
    step === 0 ? true : // Name is optional (Convention 255)
    step === 1 ? validItems.length >= 1 :
    step === 2 ? true :
    true

  const canFinish = validItems.length >= 1

  // ── Step content ──────────────────────────────────────────────

  const renderStep = () => {
    if (deployed) {
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            <Gift size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Rewards list created!
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {state.listName || 'Your rewards list'} is ready to use in treasure boxes, spinners, and milestone charts.
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

    switch (step) {
      case 0: // Name & Describe
        return (
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Name Your Rewards List
            </h4>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              What are these rewards for? You can always change this later.
            </p>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                List name
              </label>
              <input
                type="text"
                data-wizard-name="rewards_list"
                value={state.listName}
                onChange={(e) => setState((prev) => ({ ...prev, listName: e.target.value }))}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value
                  if (val !== state.listName) setState((prev) => ({ ...prev, listName: val }))
                }}
                placeholder="e.g., Potty Rewards, Weekend Treat Box"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Description <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
              </label>
              <textarea
                value={state.description}
                onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Any notes about when or how these rewards get used..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
        )

      case 1: // Add Reward Items
        return (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Add the rewards your kids can earn. Tag them as small, medium, or big so treasure boxes and spinners can draw from the right tier.
            </p>

            {/* AI suggest button */}
            {aiSuggestions.length === 0 && (
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center border"
                style={{
                  borderColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-bg)',
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))',
                }}
              >
                <Sparkles size={16} />
                {aiLoading ? 'Thinking...' : 'Let AI suggest rewards'}
              </button>
            )}

            {aiError && (
              <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                {aiError}
              </p>
            )}

            {/* AI suggestions review panel */}
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

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {aiSuggestions.map((s) => (
                    <AISuggestionCard
                      key={s.id}
                      suggestion={s}
                      isSelected={aiSelectedIds.has(s.id)}
                      onToggle={() => {
                        setAiSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(s.id)) next.delete(s.id)
                          else next.add(s.id)
                          return next
                        })
                      }}
                      onEditName={(v) => {
                        setAiSuggestions((prev) =>
                          prev.map((item) => item.id === s.id ? { ...item, name: v } : item),
                        )
                      }}
                      onEditTier={(v) => {
                        setAiSuggestions((prev) =>
                          prev.map((item) =>
                            item.id === s.id ? { ...item, tier: v as RewardItem['tier'] } : item,
                          ),
                        )
                      }}
                    />
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
                    onClick={handleDismissSuggestions}
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

            {/* Existing items list with DnD */}
            {state.items.length > 0 && (
              <div
                className="rounded-lg border divide-y"
                style={{
                  borderColor: 'var(--color-border)',
                  // @ts-expect-error -- CSS custom property
                  '--tw-divide-color': 'var(--color-border)',
                }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={state.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {state.items.map((item) => (
                      <SortableRewardRow
                        key={item.id}
                        item={item}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Add item button */}
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
              Add reward
            </button>

            {state.items.length === 0 && aiSuggestions.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Add at least 1 reward to continue. Tip: use AI suggestions to get started fast.
              </p>
            )}
          </div>
        )

      case 2: // Sharing
        return (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Who can earn from this rewards list? This controls which contracts and treasure boxes can use it.
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
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    All kids
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Anyone in the family can earn these rewards
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
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Specific kids
                  </span>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Only selected members can earn these rewards
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

      case 3: // Review & Deploy
        return (
          <div className="space-y-4">
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  List Name
                </span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                  {state.listName || 'Untitled Rewards List'}
                </p>
              </div>

              {state.description && (
                <div>
                  <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Description
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {state.description}
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Rewards ({validItems.length})
                </span>
                <div className="mt-1 space-y-1">
                  {validItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <Gift size={12} style={{ color: 'var(--color-text-muted)' }} />
                      <span>{item.name}</span>
                      {item.tier && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {item.tier}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Available To
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
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <SetupWizard
      id="rewards-list-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a Rewards List"
      subtitle="Build a list of prizes for treasure boxes, spinners, and milestone charts."
      steps={STEPS}
      currentStep={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
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
