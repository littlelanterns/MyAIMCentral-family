import { useState, useCallback, useMemo } from 'react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardProgress } from './useWizardProgress'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { ItemRecurrenceConfig, DEFAULT_RECURRENCE_VALUE, type ItemRecurrenceValue } from '@/components/lists/ItemRecurrenceConfig'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { BulkAddWithAI, type ParsedBulkItem } from '@/components/shared/BulkAddWithAI'
import {
  GripVertical, Plus, Trash2, Shuffle, List, ArrowRight, BookOpen,
  Sparkles, Info,
} from 'lucide-react'
import type { GodmotherType, ContractIfPattern } from '@/types/contracts'

// ─── State ───

export type ActivityDisplayMode = 'random' | 'browse' | 'sequential_browse'
type RewardScope = 'per_subject' | 'combined'
type RewardType = 'points' | 'creatures' | 'pages'

interface ActivityItem {
  id: string
  text: string
  recurrence: ItemRecurrenceValue
}

interface ActivityWizardState {
  subjectName: string
  description: string
  iconAssetKey: string | null
  iconVariant: string | null
  items: ActivityItem[]
  displayMode: ActivityDisplayMode
  dailyFloor: number
  rewardScope: RewardScope
  rewardType: RewardType
  rewardThreshold: number
  assignedMemberIds: string[]
}

const INITIAL_STATE: ActivityWizardState = {
  subjectName: '',
  description: '',
  iconAssetKey: null,
  iconVariant: null,
  items: [],
  displayMode: 'random',
  dailyFloor: 2,
  rewardScope: 'per_subject',
  rewardType: 'creatures',
  rewardThreshold: 5,
  assignedMemberIds: [],
}

const STEPS: WizardStep[] = [
  { key: 'name', title: 'Subject' },
  { key: 'items', title: 'Activities' },
  { key: 'mode', title: 'Display' },
  { key: 'daily', title: 'Daily Goal' },
  { key: 'rewards', title: 'Rewards', optional: true },
  { key: 'assign', title: 'Assign' },
]

export interface ActivityListWizardPrefill {
  subjectName?: string
  items?: Array<{ text: string; recurrence?: ItemRecurrenceValue }>
  displayMode?: ActivityDisplayMode
  dailyFloor?: number
}

interface ActivityListWizardProps {
  isOpen: boolean
  onClose: () => void
  prefill?: ActivityListWizardPrefill
}

export function ActivityListWizard({ isOpen, onClose, prefill }: ActivityListWizardProps) {
  const familyQuery = useFamily()
  const memberQuery = useFamilyMember()
  const family = familyQuery.data
  const member = memberQuery.data
  const membersQuery = useFamilyMembers(family?.id)
  const familyMembers = membersQuery.data ?? []
  const queryClient = useQueryClient()
  const [isDeploying, setIsDeploying] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)

  const initialState = useMemo((): ActivityWizardState => {
    if (!prefill) return INITIAL_STATE
    return {
      ...INITIAL_STATE,
      subjectName: prefill.subjectName ?? '',
      items: (prefill.items ?? []).map((item, i) => ({
        id: `prefill-${i}`,
        text: item.text,
        recurrence: item.recurrence ?? DEFAULT_RECURRENCE_VALUE,
      })),
      displayMode: prefill.displayMode ?? 'random',
      dailyFloor: prefill.dailyFloor ?? 2,
    }
  }, [prefill])

  const {
    state, setState, currentStep, setCurrentStep, clearProgress,
  } = useWizardProgress<ActivityWizardState>({
    wizardId: 'activity_list',
    familyId: family?.id ?? '',
    initialState,
  })

  const assignableMembers = useMemo(
    () => familyMembers.filter((m: FamilyMember) =>
      m.role !== 'primary_parent' && m.is_active && !m.out_of_nest
    ),
    [familyMembers],
  )

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 0: return state.subjectName.trim().length > 0
      case 1: return state.items.length > 0
      default: return true
    }
  }, [currentStep, state])

  const canFinish = state.assignedMemberIds.length > 0

  // ── Item management ────────────────────────────────────────

  const [newItemText, setNewItemText] = useState('')

  const addItem = useCallback((text: string) => {
    if (!text.trim()) return
    setState(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: text.trim(),
        recurrence: DEFAULT_RECURRENCE_VALUE,
      }],
    }))
  }, [setState])

  const removeItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
    }))
  }, [setState])

  const updateItemRecurrence = useCallback((id: string, recurrence: ItemRecurrenceValue) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, recurrence } : i),
    }))
  }, [setState])

  const handleBulkSave = useCallback(async (parsed: ParsedBulkItem[]) => {
    const selected = parsed.filter(p => p.selected)
    setState(prev => ({
      ...prev,
      items: [
        ...prev.items,
        ...selected.map((p, i) => ({
          id: `bulk-${Date.now()}-${i}`,
          text: p.text,
          recurrence: DEFAULT_RECURRENCE_VALUE,
        })),
      ],
    }))
    setShowBulkAdd(false)
  }, [setState])

  // ── Deploy ─────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    if (!family?.id || !member?.id) return
    setIsDeploying(true)

    try {
      const { data: listRow, error: listErr } = await supabase
        .from('lists')
        .insert({
          family_id: family.id,
          owner_id: member.id,
          title: state.subjectName,
          list_type: 'custom',
          description: state.description || null,
          is_shared: state.assignedMemberIds.length > 0,
          draw_mode: state.displayMode === 'random' ? 'focused' : null,
          tags: ['activity_list'],
        })
        .select()
        .single()
      if (listErr || !listRow) throw listErr ?? new Error('Failed to create list')

      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i]
        await supabase.from('list_items').insert({
          list_id: listRow.id,
          content: item.text,
          sort_order: i,
          is_repeatable: item.recurrence.is_repeatable,
          frequency_min: item.recurrence.frequency_min,
          frequency_max: item.recurrence.frequency_max,
          frequency_period: item.recurrence.frequency_period,
          cooldown_hours: item.recurrence.cooldown_hours,
          max_instances: item.recurrence.max_instances,
        })
      }

      for (const memberId of state.assignedMemberIds) {
        await supabase.from('list_shares').insert({
          list_id: listRow.id,
          shared_with: memberId,
          member_id: memberId,
          permission: 'view',
          can_edit: false,
        })
      }

      // Create contracts for daily floor + reward earning
      const godmotherType: GodmotherType =
        state.rewardType === 'points' ? 'points_godmother' :
        state.rewardType === 'creatures' ? 'creature_godmother' :
        'page_unlock_godmother'

      for (const memberId of state.assignedMemberIds) {
        // Daily floor contract
        await supabase.from('contracts').insert({
          family_id: family.id,
          created_by: member.id,
          status: 'active',
          source_type: 'list_item_completion',
          source_id: listRow.id,
          source_category: 'activity_list',
          family_member_id: memberId,
          if_pattern: 'above_daily_floor' as ContractIfPattern,
          if_n: null,
          if_floor: state.dailyFloor,
          if_window_kind: 'day',
          if_offset: 0,
          godmother_type: 'allowance_godmother' as GodmotherType,
          payload_amount: null,
          stroke_of: 'immediate',
          inheritance_level: 'kid_override',
          override_mode: 'replace',
          presentation_mode: 'silent',
        })

        // Reward threshold contract (every Nth completion)
        await supabase.from('contracts').insert({
          family_id: family.id,
          created_by: member.id,
          status: 'active',
          source_type: 'list_item_completion',
          source_id: state.rewardScope === 'per_subject' ? listRow.id : null,
          source_category: state.rewardScope === 'combined' ? 'activity_list' : null,
          family_member_id: memberId,
          if_pattern: 'every_nth' as ContractIfPattern,
          if_n: state.rewardThreshold,
          if_floor: null,
          if_window_kind: null,
          if_offset: 0,
          godmother_type: godmotherType,
          payload_amount: state.rewardType === 'points' ? 10 : 1,
          stroke_of: 'immediate',
          inheritance_level: 'kid_override',
          override_mode: 'replace',
          presentation_mode: 'toast',
        })

        // Create icon_launcher widget on member's dashboard
        const maxSort = await supabase
          .from('dashboard_widgets')
          .select('sort_order')
          .eq('family_member_id', memberId)
          .eq('is_active', true)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single()
        const nextSort = ((maxSort.data?.sort_order as number) ?? 0) + 1

        await supabase.from('dashboard_widgets').insert({
          family_id: family.id,
          family_member_id: memberId,
          template_type: 'icon_launcher',
          title: state.subjectName,
          size: 'small',
          position_x: 0,
          position_y: 0,
          sort_order: nextSort,
          widget_config: {
            linked_list_id: listRow.id,
            icon_asset_key: state.iconAssetKey,
            icon_variant: state.iconVariant,
            display_label: state.subjectName,
            display_mode: state.displayMode,
          },
          is_active: true,
          is_on_dashboard: true,
          is_included_in_ai: false,
          multiplayer_enabled: false,
          multiplayer_participants: [],
          multiplayer_config: {},
          data_source_ids: [],
          view_mode: 'default',
        })
      }

      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      clearProgress()
      onClose()
    } catch (err) {
      console.error('[ActivityListWizard] Deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }, [family?.id, member?.id, state, queryClient, clearProgress, onClose])

  // ── Icon search ────────────────────────────────────────────

  const [iconSearch, setIconSearch] = useState('')
  const [iconResults, setIconResults] = useState<Array<{
    id: string; feature_key: string; variant: string | null;
    size_128_url: string | null; display_name: string | null
  }>>([])
  const [iconLoading, setIconLoading] = useState(false)

  const searchIcons = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIconResults([])
      return
    }
    setIconLoading(true)
    const { data } = await supabase
      .from('platform_assets')
      .select('id, feature_key, variant, size_128_url, display_name')
      .or(`feature_key.ilike.%${query}%,display_name.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(20)
    setIconResults(data ?? [])
    setIconLoading(false)
  }, [])

  // ── Render steps ───────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      case 0: return renderNameStep()
      case 1: return renderItemsStep()
      case 2: return renderModeStep()
      case 3: return renderDailyStep()
      case 4: return renderRewardsStep()
      case 5: return renderAssignStep()
      default: return null
    }
  }

  function renderNameStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Subject Name
          </label>
          <input
            type="text"
            value={state.subjectName}
            onChange={e => setState(prev => ({ ...prev, subjectName: e.target.value }))}
            placeholder="e.g., Reading Fun, Math Practice, PE"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Description <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={state.description}
            onChange={e => setState(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What activities are in this subject?"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Dashboard Icon <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
          </label>
          <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--color-text-muted)' }}>
            This icon appears on the child's dashboard tile. Search by keyword.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={iconSearch}
              onChange={e => {
                setIconSearch(e.target.value)
                searchIcons(e.target.value)
              }}
              placeholder='Type "reading", "math", "sports"...'
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          {iconLoading && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Searching...</p>
          )}
          {iconResults.length > 0 && (
            <div className="grid grid-cols-6 gap-2 mt-2 max-h-40 overflow-y-auto p-1">
              {iconResults.map(icon => {
                const isSelected = state.iconAssetKey === icon.feature_key && state.iconVariant === icon.variant
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setState(prev => ({
                      ...prev,
                      iconAssetKey: icon.feature_key,
                      iconVariant: icon.variant,
                    }))}
                    className="w-14 h-14 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      border: isSelected ? '2px solid var(--color-btn-primary-bg)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)' : 'var(--color-bg-card)',
                    }}
                    title={icon.display_name ?? icon.feature_key}
                  >
                    {icon.size_128_url ? (
                      <img src={icon.size_128_url} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <BookOpen size={24} style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {state.iconAssetKey && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Selected: {state.iconAssetKey}
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, iconAssetKey: null, iconVariant: null }))}
                className="ml-2 underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Clear
              </button>
            </p>
          )}
        </div>
      </div>
    )
  }

  function renderItemsStep() {
    return (
      <div className="space-y-3">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Add activities one at a time or bulk-paste a list.
        </p>

        {/* Bulk add button */}
        <button
          type="button"
          onClick={() => setShowBulkAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
            color: 'var(--color-btn-primary-bg)',
            border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)',
          }}
        >
          <Sparkles size={13} />
          Paste or describe activities (AI organizes)
        </button>

        {/* Manual add */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newItemText.trim()) {
                addItem(newItemText)
                setNewItemText('')
              }
            }}
            placeholder="Add an activity..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newItemText.trim()) {
                addItem(newItemText)
                setNewItemText('')
              }
            }}
            disabled={!newItemText.trim()}
            className="px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Item list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {state.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border p-2.5"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <GripVertical size={14} style={{ color: 'var(--color-text-muted)' }} className="shrink-0" />
                <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded hover:bg-red-50"
                >
                  <Trash2 size={13} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
              <div className="mt-1.5 ml-6">
                <ItemRecurrenceConfig
                  value={item.recurrence}
                  onChange={(val) => updateItemRecurrence(item.id, val)}
                  compact
                />
              </div>
            </div>
          ))}
        </div>

        {state.items.length === 0 && (
          <p className="text-center text-xs py-4" style={{ color: 'var(--color-text-muted)' }}>
            No activities yet. Add some above or paste a list.
          </p>
        )}

        {/* Bulk add modal */}
        {showBulkAdd && (
          <BulkAddWithAI
            title="Add Activities"
            placeholder="Paste or describe activities, one per line or as a paragraph..."
            hint="AI will parse your text into individual activities."
            parsePrompt={`Parse the following text into a list of activity items for a "${state.subjectName || 'subject'}" activity list. Return JSON: {"items": [{"text": "activity name"}]}.`}
            onSave={handleBulkSave}
            onClose={() => setShowBulkAdd(false)}
            modelTier="haiku"
          />
        )}
      </div>
    )
  }

  function renderModeStep() {
    const modes: Array<{ value: ActivityDisplayMode; icon: typeof Shuffle; title: string; desc: string }> = [
      { value: 'random', icon: Shuffle, title: 'Random', desc: 'Surprise Me! draws one activity at random.' },
      { value: 'browse', icon: List, title: 'Browse', desc: 'Let me pick from the full list.' },
      { value: 'sequential_browse', icon: ArrowRight, title: 'Sequential with Browse', desc: 'Drip one at a time, but allow browsing ahead.' },
    ]

    return (
      <div className="space-y-3">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          How should activities be presented to the child?
        </p>
        {modes.map(m => {
          const Icon = m.icon
          const selected = state.displayMode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setState(prev => ({ ...prev, displayMode: m.value }))}
              className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: selected
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)'
                  : 'var(--color-bg-card)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: selected
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                    : 'var(--color-bg-secondary)',
                }}
              >
                <Icon size={18} style={{ color: selected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-muted)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>{m.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{m.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  function renderDailyStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            How many activities per day are required?
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={state.dailyFloor}
            onChange={e => setState(prev => ({ ...prev, dailyFloor: Math.max(1, Number(e.target.value) || 1) }))}
            className="w-20 mt-2 px-3 py-2 rounded-lg text-sm text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)' }}
        >
          <Info size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            First {state.dailyFloor} {state.dailyFloor === 1 ? 'activity is' : 'activities are'} required.
            After that, extras earn bonus rewards!
          </p>
        </div>
      </div>
    )
  }

  function renderRewardsStep() {
    return (
      <div className="space-y-4">
        {/* Scope */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            How should rewards work?
          </label>
          <div className="mt-2 space-y-2">
            {([
              { value: 'per_subject' as RewardScope, label: 'Per-subject', desc: 'Each subject has its own reward counter.' },
              { value: 'combined' as RewardScope, label: 'Combined', desc: 'All subjects share one reward counter.' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(prev => ({ ...prev, rewardScope: opt.value }))}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border text-left"
                style={{
                  borderColor: state.rewardScope === opt.value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                  backgroundColor: state.rewardScope === opt.value
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)'
                    : 'transparent',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: state.rewardScope === opt.value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)' }}
                >
                  {state.rewardScope === opt.value && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-btn-primary-bg)' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reward type */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Reward type</label>
          <div className="flex gap-2 mt-2">
            {([
              { value: 'points' as RewardType, label: 'Points' },
              { value: 'creatures' as RewardType, label: 'Creatures' },
              { value: 'pages' as RewardType, label: 'Pages' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(prev => ({ ...prev, rewardType: opt.value }))}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: state.rewardType === opt.value ? 'var(--color-btn-primary-bg)' : 'transparent',
                  color: state.rewardType === opt.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  borderColor: state.rewardType === opt.value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Threshold */}
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Every how many completions earn a reward?
          </label>
          <input
            type="number"
            min={1}
            value={state.rewardThreshold}
            onChange={e => setState(prev => ({ ...prev, rewardThreshold: Math.max(1, Number(e.target.value) || 5) }))}
            className="w-20 mt-2 px-3 py-2 rounded-lg text-sm text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Every {state.rewardThreshold} completions = 1 {state.rewardType === 'points' ? '10-point bonus' : state.rewardType === 'creatures' ? 'creature' : 'page unlock'}.
          </p>
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          You can change this anytime in Settings {'→'} [child name] {'→'} Gamification.
        </p>
      </div>
    )
  }

  function renderAssignStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Which kids get this activity list?
          </label>
          <div className="mt-3">
            <MemberPillSelector
              members={assignableMembers}
              selectedIds={state.assignedMemberIds}
              onToggle={(id) => {
                setState(prev => ({
                  ...prev,
                  assignedMemberIds: prev.assignedMemberIds.includes(id)
                    ? prev.assignedMemberIds.filter(m => m !== id)
                    : [...prev.assignedMemberIds, id],
                }))
              }}
              showEveryone={assignableMembers.length > 1}
              onToggleAll={() => {
                setState(prev => ({
                  ...prev,
                  assignedMemberIds: prev.assignedMemberIds.length === assignableMembers.length
                    ? []
                    : assignableMembers.map(m => m.id),
                }))
              }}
            />
          </div>
        </div>

        {state.assignedMemberIds.length > 0 && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              What happens on deploy:
            </p>
            <ul className="text-xs mt-1 space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Creates "{state.subjectName}" activity list shared with {state.assignedMemberIds.length} {state.assignedMemberIds.length === 1 ? 'member' : 'members'}</li>
              <li>• Adds a tappable icon tile to each kid's dashboard</li>
              <li>• Sets up daily requirement ({state.dailyFloor}/day) + reward contracts</li>
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <SetupWizard
      id="activity-list-wizard"
      isOpen={isOpen}
      onClose={onClose}
      title="Set Up Subject Activities"
      subtitle={state.subjectName || undefined}
      steps={STEPS}
      currentStep={currentStep}
      onBack={() => setCurrentStep(Math.max(0, currentStep - 1))}
      onNext={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
      onFinish={handleDeploy}
      finishLabel="Deploy"
      canAdvance={canAdvance}
      canFinish={canFinish}
      isFinishing={isDeploying}
    >
      {renderStep()}
    </SetupWizard>
  )
}
