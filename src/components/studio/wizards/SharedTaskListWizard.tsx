/**
 * SharedTaskListWizard — Phase 3.8 Worker D
 *
 * 5-step wizard: Name → Add Items → Share With → Claim Behavior → Deploy.
 * Creates a shared `lists` row with `list_type='todo'`, `is_shared=true`,
 * plus `list_items` and `list_shares` rows. Stores claim-to-promote config
 * in `lists.schedule_config` JSONB.
 *
 * Integrates useWizardDraft for save-and-return (Convention 250).
 * BulkAddWithAI for item intake (Convention 252).
 * ItemRecurrenceConfig for per-item recurrence (Worker A).
 */

import { useState, useCallback } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  ClipboardList,
  Wrench,
  Info,
} from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardDraft } from './useWizardDraft'
import { ItemRecurrenceConfig, type ItemRecurrenceValue } from '@/components/lists/ItemRecurrenceConfig'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useCreateList, useShareList } from '@/hooks/useLists'
import { supabase } from '@/lib/supabase/client'
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

// ─── Types ───

const STEPS: WizardStep[] = [
  { key: 'name', title: 'Name' },
  { key: 'items', title: 'Items' },
  { key: 'sharing', title: 'Share' },
  { key: 'claim', title: 'Claim' },
  { key: 'deploy', title: 'Deploy' },
]

interface HoneyDoItem {
  id: string
  text: string
  recurrence: ItemRecurrenceValue
  bigJob: boolean
}

interface WizardState {
  listName: string
  description: string
  items: HoneyDoItem[]
  sharedMemberIds: string[]
  claimToPromote: boolean
  requireApprovalOnPromote: boolean
}

const DEFAULT_RECURRENCE: ItemRecurrenceValue = {
  is_repeatable: false,
  frequency_min: null,
  frequency_max: null,
  frequency_period: null,
  cooldown_hours: null,
  max_instances: 1,
}

const INITIAL_STATE: WizardState = {
  listName: '',
  description: '',
  items: [],
  sharedMemberIds: [],
  claimToPromote: true,
  requireApprovalOnPromote: false,
}

interface SharedTaskListWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: Array<{
    id: string
    display_name: string
    role?: string | null
    is_active?: boolean
    calendar_color?: string | null
    assigned_color?: string | null
    member_color?: string | null
  }>
  initialItems?: Array<{ text: string; bigJob?: boolean }>
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Sortable Item Row ───

function SortableItemRow({
  item,
  onUpdate,
  onRemove,
  onRecurrenceChange,
  onBigJobToggle,
}: {
  item: HoneyDoItem
  onUpdate: (id: string, text: string) => void
  onRemove: (id: string) => void
  onRecurrenceChange: (id: string, value: ItemRecurrenceValue) => void
  onBigJobToggle: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={{ ...style, borderColor: 'var(--color-border)' }} className="flex flex-col gap-1 p-2 rounded-lg border mb-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab shrink-0 opacity-50 hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdate(item.id, e.target.value)}
          placeholder="Item name..."
          className="flex-1 text-sm bg-transparent border-none outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />

        <button
          type="button"
          onClick={() => onBigJobToggle(item.id)}
          title={item.bigJob ? 'Big job (Task Breaker offered)' : 'Mark as big job'}
          className="shrink-0 p-1 rounded transition-colors"
          style={{
            color: item.bigJob ? 'var(--color-btn-primary-bg)' : 'var(--color-text-muted)',
            opacity: item.bigJob ? 1 : 0.5,
          }}
        >
          <Wrench size={14} />
        </button>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="shrink-0 p-1 rounded hover:bg-red-50"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="pl-6">
        <ItemRecurrenceConfig
          value={item.recurrence}
          onChange={(v) => onRecurrenceChange(item.id, v)}
          compact
        />
      </div>
    </div>
  )
}

// ─── Main Component ───

export function SharedTaskListWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
  initialItems,
}: SharedTaskListWizardProps) {
  const createList = useCreateList()
  const shareList = useShareList()

  const { draft, saveDraft, clearDraft } = useWizardDraft<WizardState>(
    'shared_task_list',
    familyId,
  )

  const [state, setStateRaw] = useState<WizardState>(() => {
    if (draft) return draft
    if (initialItems?.length) {
      return {
        ...INITIAL_STATE,
        items: initialItems.map((i) => ({
          id: makeId(),
          text: i.text,
          recurrence: DEFAULT_RECURRENCE,
          bigJob: i.bigJob ?? false,
        })),
      }
    }
    return INITIAL_STATE
  })
  const [currentStep, setCurrentStep] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)

  const setState = useCallback((updater: WizardState | ((prev: WizardState) => WizardState)) => {
    setStateRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveDraft(next, next.listName || 'Shared To-Do')
      return next
    })
  }, [saveDraft])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setState((prev) => {
      const oldIndex = prev.items.findIndex((i) => i.id === active.id)
      const newIndex = prev.items.findIndex((i) => i.id === over.id)
      return { ...prev, items: arrayMove(prev.items, oldIndex, newIndex) }
    })
  }, [setState])

  // ─── Item manipulation ───

  const addItem = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { id: makeId(), text: '', recurrence: DEFAULT_RECURRENCE, bigJob: false }],
    }))
  }, [setState])

  const updateItemText = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, text } : i)),
    }))
  }, [setState])

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }))
  }, [setState])

  const updateRecurrence = useCallback((id: string, value: ItemRecurrenceValue) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, recurrence: value } : i)),
    }))
  }, [setState])

  const toggleBigJob = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, bigJob: !i.bigJob } : i)),
    }))
  }, [setState])

  // ─── Bulk AI parse ───

  const handleBulkParse = useCallback(async () => {
    const text = bulkInput.trim()
    if (!text) return
    setIsParsing(true)
    try {
      const prompt = `Parse this list of household tasks/items. Return a JSON array of objects with fields: "text" (the task name). If an item sounds like a big/complex project (would take multiple steps or hours), add "bigJob": true.\n\nInput:\n${text}`
      const response = await sendAIMessage(prompt, [{ role: 'user', content: text }], 2048, 'haiku')
      const parsed = extractJSON<Array<{ text: string; bigJob?: boolean }>>(response)
      if (Array.isArray(parsed)) {
        const newItems: HoneyDoItem[] = parsed
          .filter((p) => p.text?.trim())
          .map((p) => ({
            id: makeId(),
            text: p.text.trim(),
            recurrence: DEFAULT_RECURRENCE,
            bigJob: p.bigJob ?? false,
          }))
        setState((prev) => {
          const existingTexts = new Set(prev.items.map((i) => i.text.toLowerCase().trim()))
          const deduped = newItems.filter((i) => !existingTexts.has(i.text.toLowerCase().trim()))
          return { ...prev, items: [...prev.items, ...deduped] }
        })
        setBulkInput('')
      }
    } catch {
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      setState((prev) => {
        const existingTexts = new Set(prev.items.map((i) => i.text.toLowerCase().trim()))
        const newItems: HoneyDoItem[] = lines
          .filter((l) => !existingTexts.has(l.toLowerCase()))
          .map((l) => ({ id: makeId(), text: l, recurrence: DEFAULT_RECURRENCE, bigJob: false }))
        return { ...prev, items: [...prev.items, ...newItems] }
      })
      setBulkInput('')
    }
    setIsParsing(false)
  }, [bulkInput, setState])

  // ─── Deploy ───

  const handleDeploy = useCallback(async () => {
    if (!familyId || !memberId) return
    setIsDeploying(true)
    try {
      const validItems = state.items.filter((i) => i.text.trim())
      if (validItems.length === 0) return

      const newList = await createList.mutateAsync({
        family_id: familyId,
        owner_id: memberId,
        title: state.listName.trim() || 'Shared To-Do',
        list_type: 'todo',
        is_always_on: false,
      })

      // Mark as shared + store claim config
      await supabase
        .from('lists')
        .update({
          is_shared: true,
          schedule_config: {
            claim_to_promote: state.claimToPromote,
            require_approval_on_promote: state.requireApprovalOnPromote,
          },
        })
        .eq('id', newList.id)

      // Create items
      const itemRows = validItems.map((item, idx) => ({
        list_id: newList.id,
        content: item.text.trim(),
        is_repeatable: item.recurrence.is_repeatable,
        frequency_min: item.recurrence.frequency_min,
        frequency_max: item.recurrence.frequency_max,
        frequency_period: item.recurrence.frequency_period,
        cooldown_hours: item.recurrence.cooldown_hours,
        max_instances: item.recurrence.max_instances,
        notes: item.bigJob ? '[BIG_JOB]' : null,
        sort_order: idx,
      }))
      await supabase.from('list_items').insert(itemRows)

      // Create shares
      for (const mid of state.sharedMemberIds) {
        await shareList.mutateAsync({
          listId: newList.id,
          memberId: mid,
          canEdit: true,
        })
      }

      // Save to wizard_templates for "My Customized"
      await supabase.from('wizard_templates').insert({
        family_id: familyId,
        template_type: 'shared_task_list',
        title: state.listName.trim() || 'Shared To-Do',
        description: state.description || null,
        template_source: 'wizard',
        config: {
          items: validItems.map((i) => ({
            text: i.text,
            bigJob: i.bigJob,
            recurrence: i.recurrence,
          })),
          sharedMemberIds: state.sharedMemberIds,
          claimToPromote: state.claimToPromote,
          requireApprovalOnPromote: state.requireApprovalOnPromote,
        },
        tags: ['shared', 'todo', 'honey_do'],
      })

      clearDraft()
      onClose()
    } catch (err) {
      console.error('[SharedTaskListWizard] deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }, [familyId, memberId, state, createList, shareList, clearDraft, onClose])

  // ─── Navigation ───

  const canAdvance = (() => {
    switch (currentStep) {
      case 0: return true // name is optional
      case 1: return state.items.some((i) => i.text.trim())
      case 2: return state.sharedMemberIds.length > 0
      case 3: return true
      default: return true
    }
  })()

  const canFinish = state.items.some((i) => i.text.trim()) && state.sharedMemberIds.length > 0

  // Adults only for sharing
  const adultMembers = familyMembers.filter(
    (m) => m.id !== memberId && m.is_active !== false &&
      (m.role === 'primary_parent' || m.role === 'additional_adult'),
  )

  // ─── Render steps ───

  function renderStep() {
    switch (currentStep) {
      case 0: return renderNameStep()
      case 1: return renderItemsStep()
      case 2: return renderSharingStep()
      case 3: return renderClaimStep()
      case 4: return renderDeployStep()
      default: return null
    }
  }

  function renderNameStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            List name
          </label>
          <input
            type="text"
            value={state.listName}
            onChange={(e) => setState((prev) => ({ ...prev, listName: e.target.value }))}
            placeholder="Honey-Do List"
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Description (optional)
          </label>
          <textarea
            value={state.description}
            onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Household projects and tasks to share..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>
    )
  }

  function renderItemsStep() {
    return (
      <div className="space-y-3">
        {/* Bulk add area */}
        <div className="space-y-2">
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="Paste or type multiple items, one per line..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            type="button"
            onClick={handleBulkParse}
            disabled={!bulkInput.trim() || isParsing}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {isParsing ? 'Parsing...' : 'Add with AI'}
          </button>
        </div>

        {/* Item list with DnD */}
        {state.items.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={state.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="max-h-[280px] overflow-y-auto">
                {state.items.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateItemText}
                    onRemove={removeItem}
                    onRecurrenceChange={updateRecurrence}
                    onBigJobToggle={toggleBigJob}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Add single item */}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          style={{
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <Plus size={14} />
          Add item
        </button>

        {/* Wrench legend */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Wrench size={12} />
          <span>= Big job (Task Breaker offered when claimed)</span>
        </div>
      </div>
    )
  }

  function renderSharingStep() {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Who will share this list? Everyone on the list can see, claim, and complete items.
        </p>

        {adultMembers.length > 0 ? (
          <MemberPillSelector
            members={adultMembers}
            selectedIds={state.sharedMemberIds}
            onToggle={(memberId: string) => setState((prev) => ({
              ...prev,
              sharedMemberIds: prev.sharedMemberIds.includes(memberId)
                ? prev.sharedMemberIds.filter((id) => id !== memberId)
                : [...prev.sharedMemberIds, memberId],
            }))}
          />
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
            No other adult family members found. Add an additional adult in Family Settings first.
          </p>
        )}

        {state.sharedMemberIds.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--color-text-warning, var(--color-text-muted))' }}>
            Select at least one person to share with.
          </p>
        )}
      </div>
    )
  }

  function renderClaimStep() {
    return (
      <div className="space-y-5">
        {/* Claim-to-promote toggle */}
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            When someone claims an item:
          </p>

          <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer" style={{
            borderColor: state.claimToPromote ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
            backgroundColor: state.claimToPromote ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, transparent)' : 'transparent',
          }}>
            <input
              type="radio"
              name="claimBehavior"
              checked={state.claimToPromote}
              onChange={() => setState((prev) => ({ ...prev, claimToPromote: true }))}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Add to their task list
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Claiming creates a personal task linked back to this list. Completing the task checks it off for everyone.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer" style={{
            borderColor: !state.claimToPromote ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
            backgroundColor: !state.claimToPromote ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, transparent)' : 'transparent',
          }}>
            <input
              type="radio"
              name="claimBehavior"
              checked={!state.claimToPromote}
              onChange={() => setState((prev) => ({ ...prev, claimToPromote: false }))}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Just mark as claimed
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Shows &quot;[Name] is on it&quot; but doesn&apos;t create a separate task.
              </p>
            </div>
          </label>
        </div>

        {/* Approval toggle */}
        {state.claimToPromote && (
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Require approval when completed?
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Promoted tasks need mom&apos;s sign-off before checking off the shared item.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, requireApprovalOnPromote: !prev.requireApprovalOnPromote }))}
              className="shrink-0 w-10 h-6 rounded-full transition-colors relative"
              style={{
                backgroundColor: state.requireApprovalOnPromote
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-tertiary, var(--color-bg-secondary))',
              }}
            >
              <div
                className="w-4 h-4 rounded-full absolute top-1 transition-transform"
                style={{
                  backgroundColor: 'var(--color-bg-primary, white)',
                  transform: state.requireApprovalOnPromote ? 'translateX(20px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderDeployStep() {
    const validItems = state.items.filter((i) => i.text.trim())
    const sharedNames = familyMembers
      .filter((m) => state.sharedMemberIds.includes(m.id))
      .map((m) => m.display_name)

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              {state.listName || 'Shared To-Do'}
            </h4>
          </div>

          <div className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <p><strong>{validItems.length}</strong> item{validItems.length !== 1 ? 's' : ''}</p>
            <p>Shared with: <strong>{sharedNames.join(', ') || 'nobody'}</strong></p>
            <p>
              Claim behavior:{' '}
              <strong>
                {state.claimToPromote ? 'Add to personal tasks' : 'Mark as claimed'}
              </strong>
            </p>
            {state.claimToPromote && state.requireApprovalOnPromote && (
              <p>Approval required on completion</p>
            )}
            {validItems.some((i) => i.bigJob) && (
              <p>
                <Wrench size={12} className="inline mr-1" />
                {validItems.filter((i) => i.bigJob).length} item{validItems.filter((i) => i.bigJob).length !== 1 ? 's' : ''} marked as big jobs
              </p>
            )}
          </div>
        </div>

        {!canFinish && (
          <div className="flex items-center gap-2 text-xs p-2 rounded" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <Info size={14} />
            <span>Add at least one item and share with at least one person to deploy.</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <SetupWizard
      id="shared-task-list-wizard"
      isOpen={isOpen}
      onClose={onClose}
      title="Create a Shared To-Do"
      subtitle="A shared list where family members claim and complete items"
      steps={STEPS}
      currentStep={currentStep}
      onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
      onNext={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onFinish={handleDeploy}
      finishLabel="Create"
      canAdvance={canAdvance}
      canFinish={canFinish}
      isFinishing={isDeploying}
    >
      {renderStep()}
    </SetupWizard>
  )
}
