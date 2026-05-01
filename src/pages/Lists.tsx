/**
 * Lists Page — PRD-09B Screen 2 + 3 + 4
 * Full reference collection management surface.
 * Types: Shopping, Wishlist, Expenses, Packing, To-Do, Custom, Randomizer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  List as ListIcon, Plus, ShoppingCart, Gift, Luggage, DollarSign,
  CheckSquare, Pencil, X, ExternalLink, ChevronDown, ChevronRight,
  ArrowRight, ArrowUpRight, RotateCcw, Archive, ArchiveRestore, Trash2, Loader2, Save,
  Clock, Lightbulb, Heart, HeartOff, GripVertical, LayoutGrid, List,
  Share2, UserCheck, Check, Wand2, BookOpen, Tag, UserMinus, Undo2, Trophy, Star, Camera,
} from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase/client'
import { getMemberColor } from '@/lib/memberColors'
import { SharedWithHeader } from '@/components/shared/SharedWithHeader'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import {
  useLists, useList, useListItems, useCreateList, useCreateListItem,
  useToggleListItem, useDeleteListItem, useUpdateListItem, useUpdateList,
  useUncheckAllItems, usePromoteListItem, useArchiveList, useDeleteList, useRestoreList,
  useReorderListItems, useSaveListAsTemplate,
  useListShares, useShareList, useUnshareList, useSharedListIds, useClaimListItem, useDuplicateListForMembers,
  useUpdateSharePermission, useHideSharedList, useUnhideSharedList, useHiddenSharedLists,
} from '@/hooks/useLists'
import { FeatureGuide, FeatureIcon, BulkAddWithAI, Tooltip } from '@/components/shared'
import { useCreateVictory } from '@/hooks/useVictories'
import { Sparkles, Settings2 } from 'lucide-react'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import type { ListItem, ListType, ListShare, List as ListData, VictoryMode } from '@/types/lists'
import { Randomizer } from '@/components/lists/Randomizer'
import { FrequencyRulesEditor, type FrequencyRules } from '@/components/lists/FrequencyRulesEditor'
import { PoolModeSelector } from '@/components/lists/PoolModeSelector'
import { DrawModeSelector } from '@/components/lists/DrawModeSelector'
import { useRandomizerPendingMastery } from '@/hooks/useRandomizerDraws'
import { useApproveMasterySubmission, useRejectMasterySubmission } from '@/hooks/usePractice'
import { BulkAddWithFrequency } from '@/components/lists/BulkAddWithFrequency'
import { ReferenceListView } from '@/components/lists/ReferenceListView'
import { OpportunitySettingsPanel } from '@/components/lists/OpportunitySettingsPanel'
import { TrackingDefaultsPanel } from '@/components/lists/TrackingDefaultsPanel'
import { SmartImportModal } from '@/components/lists/SmartImportModal'
import { ListImageImportModal } from '@/components/lists/ListImageImportModal'
import {
  SequentialCollectionCard,
} from '@/components/tasks/sequential/SequentialCollectionView'
import { SequentialCreatorModal } from '@/components/tasks/sequential/SequentialCreatorModal'
import { useSequentialCollections } from '@/hooks/useSequentialCollections'
import { isDateActive, type SchedulerOutput } from '@/components/scheduling'
import { todayLocalIso } from '@/utils/dates'
import { usePendingChangesForSource, useApplyPendingChanges, useCreatePendingChange } from '@/hooks/usePendingChanges'
import { PendingChangesBadge } from '@/components/templates/PendingChangesBadge'
import { NowNextChoiceModal } from '@/components/shared/NowNextChoiceModal'
import { classifyChangeCategory } from '@/lib/pendingChanges/classifyChangeCategory'
import type { NowNextTiming } from '@/components/shared/NowNextChoiceModal'

// ── Victory mode selector ──────────────────────────────────
const VICTORY_MODE_OPTIONS: { value: VictoryMode; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No victory tracking' },
  { value: 'item_completed', label: 'Per item', description: 'Victory for each flagged item' },
  { value: 'list_completed', label: 'All done', description: 'Victory when list is complete' },
  { value: 'both', label: 'Both', description: 'Per item + all done' },
]

function VictoryModeSelector({ mode, onChange }: { mode: VictoryMode; onChange: (m: VictoryMode) => void }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Trophy size={14} style={{ color: mode !== 'none' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>Celebrate</span>
      <div className="flex gap-1 ml-auto">
        {VICTORY_MODE_OPTIONS.map(opt => (
          <Tooltip key={opt.value} content={opt.description}>
            <button
              onClick={() => onChange(opt.value)}
              className="px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={{
                backgroundColor: mode === opt.value ? 'var(--color-btn-primary-bg)' : 'transparent',
                color: mode === opt.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: mode === opt.value ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {opt.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

// ── Type config ────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: typeof ListIcon; label: string; description: string; isSystem?: boolean }> = {
  shopping: { icon: ShoppingCart, label: 'Shopping', description: 'Quantities, aisle, store grouping' },
  wishlist: { icon: Gift, label: 'Wishlist', description: 'URLs, prices, gift recipient' },
  packing: { icon: Luggage, label: 'Packing', description: 'Category sections, progress bar' },
  expenses: { icon: DollarSign, label: 'Expenses', description: 'Amounts, categories, totals' },
  todo: { icon: CheckSquare, label: 'To-Do', description: 'Checkboxes, promotable to tasks' },
  custom: { icon: Pencil, label: 'Custom', description: 'Flexible — you define the format' },
  simple: { icon: ListIcon, label: 'Simple', description: 'Basic checklist' },
  checklist: { icon: CheckSquare, label: 'Checklist', description: 'Check items off' },
  randomizer: { icon: RotateCcw, label: 'Randomizer', description: 'Draw random items' },
  backburner: { icon: Clock, label: 'Backburner', description: 'Someday/maybe — park it for later', isSystem: true },
  ideas: { icon: Lightbulb, label: 'Ideas', description: 'Capture raw ideas before they become anything', isSystem: true },
  prayer: { icon: Heart, label: 'Prayer', description: 'Ongoing prayer items and intentions' },
  reference: { icon: BookOpen, label: 'Reference', description: 'Save info to look up later — steps, numbers, instructions' },
  // Meta-type: NOT a real ListType — routed to SequentialCreatorModal on click.
  // Sequential collections live in sequential_collections + tasks, not the lists table,
  // but are surfaced here alongside lists per PRD-09A/09B Studio Intelligence Phase 1.
  sequential: { icon: BookOpen, label: 'Sequential Collection', description: 'Ordered items that feed one at a time' },
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'wishlist', label: 'Wishlists' },
  { key: 'reference', label: 'Reference' },
  { key: 'packing', label: 'Packing' },
  { key: 'todo', label: 'To-Do' },
  { key: 'backburner', label: 'Backburner' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'custom', label: 'Custom' },
  { key: 'shared', label: 'Shared' },
  { key: 'archived', label: 'Archived' },
]

// ── View mode persistence ─────────────────────────────────

type ViewMode = 'grid' | 'list'

function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('lists-view-mode') as ViewMode) || 'grid'
    } catch {
      return 'grid'
    }
  })

  const set = useCallback((newMode: ViewMode) => {
    setMode(newMode)
    try { localStorage.setItem('lists-view-mode', newMode) } catch { /* noop */ }
  }, [])

  return [mode, set]
}

// ── Main page ──────────────────────────────────────────────

export function ListsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: allLists = [], isLoading } = useLists(family?.id)
  const { data: sharedListIds = [] } = useSharedListIds(isViewingAs ? activeMember?.id : undefined)
  // PRD-09A/09B Studio Intelligence Phase 1: surface sequential collections on the Lists page
  // alongside regular lists. Cross-surface visibility (also available on Tasks → Sequential tab).
  const { data: sequentialCollections = [] } = useSequentialCollections(family?.id)
  const createList = useCreateList()
  const restoreList = useRestoreList()
  const deleteList = useDeleteList()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { data: hiddenShares = [] } = useHiddenSharedLists(activeMember?.id)
  const unhideSharedList = useUnhideSharedList()

  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useViewMode()
  const [filter, setFilter] = useState('all')
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedSequentialId, setSelectedSequentialId] = useState<string | null>(null)
  const [createType, setCreateType] = useState<ListType | null>(null)
  const [createTitle, setCreateTitle] = useState('')
  // Template hydration — when creating from a DB template
  const [createFromTemplateId, setCreateFromTemplateId] = useState<string | null>(null)
  // Sequential creation modal (replaces the broken TaskCreationModal sequential path)
  const [sequentialModalOpen, setSequentialModalOpen] = useState(false)
  // Smart Import modal — AI sorts pasted items into correct lists
  const [smartImportOpen, setSmartImportOpen] = useState(false)
  const [smartImportPreloadText, setSmartImportPreloadText] = useState('')
  const [smartImportPreloadSource, setSmartImportPreloadSource] = useState('')
  // Image Import modal — OCR → items
  const [imageImportOpen, setImageImportOpen] = useState(false)

  // Handle ?create=<type>&template=<id> URL params from Studio navigation
  useEffect(() => {
    const createParam = searchParams.get('create')
    const templateParam = searchParams.get('template')
    if (createParam) {
      setCreateType(createParam as ListType)
      setShowCreate(true)
      if (templateParam) {
        setCreateFromTemplateId(templateParam)
        supabase
          .from('list_templates')
          .select('title')
          .eq('id', templateParam)
          .single()
          .then(({ data: tpl }) => {
            if (tpl?.title) setCreateTitle(tpl.title as string)
          })
      }
      setSearchParams({}, { replace: true })
    }
  }, [])

  // When viewing as another member, show only their owned + shared-with lists.
  // In mom's normal view, hide other members' auto-provisioned system lists
  // (Ideas, Backburner) — each member gets their own via auto_provision_member_resources.
  const SYSTEM_LIST_TYPES = new Set(['ideas', 'backburner'])
  const lists = isViewingAs && activeMember
    ? allLists.filter(l => l.owner_id === activeMember.id || sharedListIds.includes(l.id))
    : allLists.filter(l =>
        !SYSTEM_LIST_TYPES.has(l.list_type) || l.owner_id === member?.id
      )

  // Filter lists
  const activeLists = lists.filter(l => !l.archived_at)
  const archivedLists = lists.filter(l => !!l.archived_at)

  // Compute available tags from all active lists
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    activeLists.forEach(l => {
      if (l.tags) l.tags.forEach(t => tags.add(t))
    })
    return [...tags].sort()
  }, [activeLists])

  const hasSecondaryFilters = selectedPeople.size > 0 || selectedTags.size > 0

  // Apply type filter first
  let filtered = filter === 'all'
    ? activeLists
    : filter === 'shared'
      ? activeLists.filter(l => l.is_shared)
      : filter === 'archived'
        ? archivedLists
        : activeLists.filter(l => l.list_type === filter)

  // Apply tags filter (AND — list must have ALL selected tags)
  if (selectedTags.size > 0) {
    filtered = filtered.filter(l =>
      l.tags && [...selectedTags].every(t => l.tags.includes(t))
    )
  }

  async function handleCreate() {
    if (!member || !family || !createTitle.trim() || !createType) return

    let templateItems: import('@/types/lists').ListTemplateItem[] | undefined
    if (createFromTemplateId) {
      const { data: tpl } = await supabase
        .from('list_templates')
        .select('default_items')
        .eq('id', createFromTemplateId)
        .single()
      if (tpl?.default_items) {
        templateItems = tpl.default_items as import('@/types/lists').ListTemplateItem[]
      }
    }

    const result = await createList.mutateAsync({
      family_id: family.id,
      owner_id: member.id,
      title: createTitle.trim(),
      list_type: createType,
      template_id: createFromTemplateId ?? undefined,
      default_items: templateItems,
    })
    setCreateTitle('')
    setCreateType(null)
    setCreateFromTemplateId(null)
    setShowCreate(false)
    setSelectedListId(result.id)
  }

  // If a list is selected, show detail view
  if (selectedListId) {
    return (
      <ListDetailView
        listId={selectedListId}
        onBack={() => setSelectedListId(null)}
      />
    )
  }

  // If a sequential collection is selected, show it in a back-button wrapper
  // (reuses SequentialCollectionCard — user taps the card header to expand items).
  if (selectedSequentialId) {
    const coll = sequentialCollections.find(c => c.id === selectedSequentialId)
    if (!coll) {
      // Collection disappeared — bounce back.
      setSelectedSequentialId(null)
    } else {
      return (
        <div className="density-compact max-w-3xl mx-auto space-y-3 p-4">
          <button
            onClick={() => setSelectedSequentialId(null)}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            Back to lists
          </button>
          <SequentialCollectionCard collection={coll} />
        </div>
      )
    }
  }

  return (
    <div className="density-compact max-w-3xl mx-auto space-y-4">
      <FeatureGuide featureKey="lists_detail" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="lists" fallback={<ListIcon size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="w-10! h-10! md:w-36! md:h-36!" assetSize={512} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
            Lists
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid/List toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <Tooltip content="Grid view">
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 transition-colors"
              style={{
                backgroundColor: viewMode === 'grid'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                  : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              }}
            >
              <LayoutGrid size={16} />
            </button>
            </Tooltip>
            <Tooltip content="List view">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 transition-colors"
              style={{
                backgroundColor: viewMode === 'list'
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                  : 'transparent',
                color: viewMode === 'list' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              }}
            >
              <List size={16} />
            </button>
            </Tooltip>
          </div>
          <Tooltip content="Import from photo — OCR reads text from images">
            <button
              onClick={() => setImageImportOpen(true)}
              className="p-2 rounded-lg"
              style={{ color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-btn-primary-bg)' }}
            >
              <Camera size={16} />
            </button>
          </Tooltip>
          <Tooltip content="AI sorts pasted items into your lists">
            <button
              onClick={() => { setSmartImportPreloadText(''); setSmartImportPreloadSource(''); setSmartImportOpen(true) }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-btn-primary-bg)' }}
            >
              <Wand2 size={14} />
              Smart Import
            </button>
          </Tooltip>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            <Plus size={16} />
            New List
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: filter === tab.key ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: filter === tab.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === tab.key ? 'transparent' : 'var(--color-border)'}`,
            }}
          >
            {tab.label}
            {tab.key === 'archived' && archivedLists.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: filter === 'archived' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  color: filter === 'archived' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                  opacity: filter === 'archived' ? 1 : 0.7,
                }}
              >
                {archivedLists.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={12} style={{ color: 'var(--color-text-secondary)' }} />
          {allTags.map(tag => {
            const active = selectedTags.has(tag)
            return (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev => {
                  const next = new Set(prev)
                  if (next.has(tag)) next.delete(tag)
                  else next.add(tag)
                  return next
                })}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                  color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                  border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
                }}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Clear secondary filters */}
      {hasSecondaryFilters && (
        <button
          onClick={() => { setSelectedPeople(new Set()); setSelectedTags(new Set()) }}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          Clear filters
        </button>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          {!createType ? (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>What kind of list?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {/* PRD-09A/09B Studio Intelligence Phase 1: added 'randomizer' (missing) and
                    'sequential' (meta-type, routes to SequentialCreatorModal) to the grid. */}
                {(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'reference', 'ideas', 'prayer', 'backburner', 'randomizer', 'sequential', 'custom'] as const).map(type => {
                  const cfg = TYPE_CONFIG[type]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (type === 'sequential') {
                          // Sequential collections don't live in the lists table — open the
                          // SequentialCreatorModal instead of the simple list-name flow.
                          setShowCreate(false)
                          setSequentialModalOpen(true)
                        } else {
                          setCreateType(type as ListType)
                        }
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                    >
                      <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>{cfg.label}</span>
                      <span className="text-[10px] text-center" style={{ color: 'var(--color-text-secondary)' }}>{cfg.description}</span>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setShowCreate(false)} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                New {TYPE_CONFIG[createType]?.label ?? 'List'}
              </p>
              {createFromTemplateId && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Creating from template — items will be pre-filled.
                </p>
              )}
              <input
                type="text"
                placeholder="List name"
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setCreateType(null); setCreateFromTemplateId(null); setShowCreate(false) }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={!createTitle.trim()}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : filtered.length === 0 && !(filter === 'all' && sequentialCollections.length > 0) ? (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          {filter === 'archived' ? (
            <>
              <Archive size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
              <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No archived lists</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Lists you archive will appear here. You can restore or permanently delete them.
              </p>
            </>
          ) : (
            <>
              <ListIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
              <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No lists yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Create one to start organizing — shopping, packing, wishlists, and more.
              </p>
            </>
          )}
        </div>
      ) : filter === 'archived' ? (
        /* Archived lists view */
        <div className="space-y-2">
          {filtered.map(list => {
            const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
            const Icon = cfg.icon
            const isConfirming = confirmDeleteId === list.id
            return (
              <div
                key={list.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', opacity: 0.85 }}
              >
                <div className="flex items-center gap-3 p-4">
                  <Icon size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{list.title}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {cfg.label} · Archived {list.archived_at ? new Date(list.archived_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <Tooltip content="Restore">
                    <button
                      onClick={() => restoreList.mutate(list.id)}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--color-btn-primary-bg)' }}
                    >
                      <ArchiveRestore size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete permanently">
                    <button
                      onClick={() => setConfirmDeleteId(isConfirming ? null : list.id)}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--color-text-error, #ef4444)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </Tooltip>
                </div>
                {isConfirming && (
                  <div className="px-4 pb-3 flex items-center gap-2 justify-end" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span className="text-xs flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Delete permanently? This cannot be undone.
                    </span>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                    <button
                      onClick={() => { deleteList.mutate(list.id); setConfirmDeleteId(null) }}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Hidden shared lists — recoverable */}
          {hiddenShares.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--color-text-secondary)' }}>
                Hidden shared lists
              </p>
              {hiddenShares.map((share: { id: string; lists: ListData | null }) => {
                const hiddenList = share.lists as ListData | null
                if (!hiddenList) return null
                const hCfg = TYPE_CONFIG[hiddenList.list_type] ?? TYPE_CONFIG.custom
                const HIcon = hCfg.icon
                return (
                  <div
                    key={share.id}
                    className="rounded-lg overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', opacity: 0.85 }}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <HIcon size={18} style={{ color: 'var(--color-text-secondary)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{hiddenList.title}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {hCfg.label} · Shared with you
                        </p>
                      </div>
                      <Tooltip content="Show again">
                        <button
                          onClick={() => unhideSharedList.mutate({ shareId: share.id })}
                          disabled={unhideSharedList.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                          style={{ color: 'var(--color-btn-primary-bg)' }}
                        >
                          <Undo2 size={14} /> Unhide
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Sequential collections (only on 'all' filter — cross-surface visibility per PRD-09A/09B Phase 1) */}
          {filter === 'all' && sequentialCollections.map(coll => (
            <button
              key={`seq-${coll.id}`}
              onClick={() => setSelectedSequentialId(coll.id)}
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl text-center transition-all hover:-translate-y-0.5 hover:shadow-md aspect-square relative"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                boxShadow: '2px 3px 8px rgba(0, 0, 0, 0.06)',
              }}
            >
              <span
                className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{
                  background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                  color: 'var(--color-btn-primary-bg)',
                }}
              >
                Sequential
              </span>
              <BookOpen size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />
              <p className="font-medium text-sm leading-tight truncate w-full" style={{ color: 'var(--color-text-heading)' }}>{coll.title}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {coll.current_index}/{coll.total_items}
              </p>
            </button>
          ))}
          {filtered.map(list => {
            const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
            const Icon = cfg.icon
            const scheduleActive = list.schedule_config
              ? isDateActive(list.schedule_config as unknown as SchedulerOutput, todayLocalIso())
              : false
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl text-center transition-all hover:-translate-y-0.5 hover:shadow-md aspect-square relative"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '2px 3px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                {list.schedule_config && (
                  <span
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{
                      background: scheduleActive
                        ? 'color-mix(in srgb, var(--color-success, #4caf50) 15%, transparent)'
                        : 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                      color: scheduleActive
                        ? 'var(--color-success, #4caf50)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {scheduleActive ? 'Active today' : 'Scheduled'}
                  </span>
                )}
                <Icon size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <p className="font-medium text-sm leading-tight truncate w-full" style={{ color: 'var(--color-text-heading)' }}>{list.title}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {cfg.label}{list.is_shared ? ' · Shared' : ''}
                  </p>
                  <PendingChangesBadge sourceType="list" sourceId={list.id} />
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Sequential collections in list view */}
          {filter === 'all' && sequentialCollections.map(coll => (
            <button
              key={`seq-${coll.id}`}
              onClick={() => setSelectedSequentialId(coll.id)}
              className="w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all hover:-translate-y-px hover:shadow-sm"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <BookOpen size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{coll.title}</p>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
                    style={{
                      background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                      color: 'var(--color-btn-primary-bg)',
                    }}
                  >
                    Sequential
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {coll.current_index}/{coll.total_items} complete
                </p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          ))}
          {filtered.map(list => {
            const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
            const Icon = cfg.icon
            const scheduleActive = list.schedule_config
              ? isDateActive(list.schedule_config as unknown as SchedulerOutput, todayLocalIso())
              : false
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all hover:-translate-y-px hover:shadow-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{list.title}</p>
                    {list.schedule_config && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
                        style={{
                          background: scheduleActive
                            ? 'color-mix(in srgb, var(--color-success, #4caf50) 15%, transparent)'
                            : 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                          color: scheduleActive
                            ? 'var(--color-success, #4caf50)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {scheduleActive ? 'Active today' : 'Scheduled'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {cfg.label} {list.is_shared ? ' · Shared' : ''}
                    </p>
                    <PendingChangesBadge sourceType="list" sourceId={list.id} />
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            )
          })}
        </div>
      )}

      {/* SequentialCreatorModal (PRD-09A/09B Studio Intelligence Phase 1) */}
      {sequentialModalOpen && family?.id && member?.id && (
        <SequentialCreatorModal
          isOpen={sequentialModalOpen}
          onClose={() => setSequentialModalOpen(false)}
          familyId={family.id}
          createdBy={member.id}
        />
      )}

      {/* Smart Import Modal — AI sorts pasted items into correct lists */}
      {smartImportOpen && family?.id && member?.id && (
        <SmartImportModal
          isOpen={smartImportOpen}
          onClose={() => { setSmartImportOpen(false); setSmartImportPreloadText(''); setSmartImportPreloadSource('') }}
          familyId={family.id}
          memberId={member.id}
          existingLists={activeLists}
          initialText={smartImportPreloadText}
          initialSource={smartImportPreloadSource}
        />
      )}

      {/* Image Import Modal — OCR photo → items */}
      {imageImportOpen && family?.id && member?.id && (
        <ListImageImportModal
          isOpen={imageImportOpen}
          onClose={() => setImageImportOpen(false)}
          familyId={family.id}
          memberId={member.id}
          onTextExtracted={(text, source) => {
            setImageImportOpen(false)
            setSmartImportPreloadText(text)
            setSmartImportPreloadSource(source)
            setSmartImportOpen(true)
          }}
        />
      )}
    </div>
  )
}

// ── Bulk Add Helpers (context-aware per list type) ────────

function getBulkAddPlaceholder(listType: string): string {
  switch (listType) {
    case 'shopping': return 'Paste a recipe, ingredient list, or just type items one per line...'
    case 'wishlist': return 'Paste gift ideas, product names, or links one per line...'
    case 'expenses': return 'Paste expenses one per line. E.g.: "Groceries $45" or "Gas 32.50"...'
    case 'packing': return 'Paste packing items one per line. Add a section name like "Clothing:" on its own line...'
    case 'todo': return 'Paste to-do items one per line...'
    default: return 'Paste items one per line. AI will parse them for you...'
  }
}

function getBulkAddHint(listType: string): string {
  switch (listType) {
    case 'shopping': return 'Works with recipes, grocery lists, and brain dumps. AI detects quantities and store names.'
    case 'wishlist': return 'Paste product names, URLs, or wishlists from other apps.'
    case 'expenses': return 'Include amounts with items. AI extracts prices automatically.'
    case 'packing': return 'Use "Category:" headers to group items into sections.'
    default: return 'Paste any text and AI will parse it into individual items.'
  }
}

function getBulkAddCategories(listType: string, sections: string[]): { value: string; label: string }[] | undefined {
  if (listType === 'shopping') {
    // Always return an array for shopping to enable category-aware parsing.
    // Existing sections are included; AI can also detect new store names.
    return sections.map(s => ({ value: s, label: s }))
  }
  if (listType === 'packing') {
    const cats = sections.map(s => ({ value: s, label: s }))
    if (cats.length > 0) return cats
  }
  return undefined
}

function getBulkAddPrompt(listType: string): string {
  const base = 'Parse the following text into individual list items. Return a JSON array.'
  switch (listType) {
    case 'shopping':
      return `${base} Parse natural-language shopping lists, even conversational ones. Rules:

1. STORES: Detect store names mentioned in the text (e.g., "from Mama Jeans", "at Sam's Club", "from Aldi"). Use them as the "category" to group items by store.
2. STORE CONTINUITY: Items between store mentions belong to the most recently mentioned store. For example, "From Sam's we need eggs, we need milk, we need cheese. From Aldi we need pizza" means eggs, milk, AND cheese all belong to Sam's because they appear after "From Sam's" and before "From Aldi." Only switch stores when a new store is explicitly named.
3. QUANTITIES: Keep quantities with the item (e.g., "12 bags of chocolate chips" stays as "12 bags of chocolate chips"). Keep the full quantity in the text.
4. NOTES: If the text mentions special instructions for an item (e.g., "needs to stay cold", "Gideon's choice", "whatever dips you wanted"), put them in a "note" field.
5. MULTI-STORE ITEMS: If an item could come from multiple stores (e.g., "birthday cake from either Nothing Bundt Cake, Hy-Vee, or Sam's"), set category to "" and put the store options in the "note" field (e.g., "Could get from: Nothing Bundt Cake, Hy-Vee, or Sam's").
6. VAGUE ITEMS: Keep vague descriptions as-is (e.g., "an assortment of produce" stays as one item, don't split).
7. UNCLEAR: If something is ambiguous (could be a store name, an errand, not clearly a list item), add "unclear": true.

Return objects: [{"text": "item name", "category": "Store Name", "note": "optional note"}, ...].
If no store is detected for an item, use "" as category. Never invent store names.`
    case 'wishlist':
      return `${base} Each item should be a product name or gift idea. Keep descriptions concise. Return ["item1", "item2", ...].`
    case 'expenses':
      return `${base} Each item should include the expense description. Return ["item1", "item2", ...].`
    case 'packing':
      return `${base} If section headers are detected (lines ending with ":"), use them as categories. Return [{"text": "item", "category": "section"}, ...]. If no sections detected, return ["item1", ...].`
    default:
      return `${base} Each item should be a discrete item from the text. Return ["item1", "item2", ...].`
  }
}

// ── Randomizer Detail View ───────────────────────────────

function RandomizerDetailView({
  list,
  items,
  memberId,
  familyMembers,
  isOwnerOrParent,
  myShare,
  onHide,
  onBack,
}: {
  list: ListData
  items: ListItem[]
  memberId: string
  familyMembers: FamilyMember[]
  isOwnerOrParent: boolean
  myShare?: ListShare
  onHide: () => void
  onBack: () => void
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [savedAsTemplate, setSavedAsTemplate] = useState(false)
  const updateList = useUpdateList()
  const createItem = useCreateListItem()
  const updateItem = useUpdateListItem()
  const deleteItem = useDeleteListItem()
  const archiveList = useArchiveList()
  const deleteListMut = useDeleteList()
  const saveAsTemplate = useSaveListAsTemplate()
  const { data: family } = useFamily()
  const [newItemText, setNewItemText] = useState('')

  const poolMode = list.pool_mode ?? 'individual'

  async function handleAddItem() {
    if (!newItemText.trim()) return
    await createItem.mutateAsync({
      list_id: list.id,
      content: newItemText.trim(),
      sort_order: items.length,
    })
    setNewItemText('')
  }

  function handleFrequencyChange(itemId: string, rules: FrequencyRules) {
    updateItem.mutate({
      id: itemId,
      listId: list.id,
      frequency_min: rules.frequency_min,
      frequency_max: rules.frequency_max,
      frequency_period: rules.frequency_period,
      cooldown_hours: rules.cooldown_hours,
      max_instances: rules.lifetime_max,
      reward_amount: rules.reward_amount,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronDown size={20} className="rotate-90" />
        </button>
        <RotateCcw size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          {list.title}
        </h1>
        {isOwnerOrParent && (
          <>
            <Tooltip content={savedAsTemplate ? 'Saved!' : 'Make Reusable'}>
              <button
                onClick={async () => {
                  if (!family || !memberId || savedAsTemplate) return
                  await saveAsTemplate.mutateAsync({ familyId: family.id, createdBy: memberId, title: list.title, listType: list.list_type, items })
                  setSavedAsTemplate(true)
                  setTimeout(() => setSavedAsTemplate(false), 3000)
                }}
                disabled={saveAsTemplate.isPending || savedAsTemplate}
                className="p-1.5 rounded-lg"
                style={{ color: savedAsTemplate ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
              >
                <Save size={16} />
              </button>
            </Tooltip>
            <Tooltip content="Pool settings">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg"
                style={{ color: showSettings ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
              >
                <Settings2 size={16} />
              </button>
            </Tooltip>
          </>
        )}
        {isOwnerOrParent ? (
          <>
            <Tooltip content="Archive">
              <button onClick={() => { archiveList.mutate(list.id); onBack() }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                <Archive size={16} />
              </button>
            </Tooltip>
            <Tooltip content="Delete permanently">
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </>
        ) : myShare && (
          <Tooltip content="Leave shared list">
            <button onClick={onHide} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
              <UserMinus size={16} />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && isOwnerOrParent && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-text-error, #ef4444)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Permanently delete "{list.title}"?
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            This will delete the list and all its items. This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={() => { deleteListMut.mutate(list.id); onBack() }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="space-y-3">
          <PoolModeSelector
            poolMode={poolMode}
            eligibleMembers={list.eligible_members}
            allMembers={familyMembers}
            onPoolModeChange={(mode) => updateList.mutate({ id: list.id, pool_mode: mode })}
            onEligibleMembersChange={(members) => updateList.mutate({ id: list.id, eligible_members: members })}
          />

          {/* Build J: Draw mode selector (randomizer-only) */}
          <DrawModeSelector
            drawMode={(list.draw_mode ?? 'focused') as 'focused' | 'buffet' | 'surprise'}
            maxActiveDraws={list.max_active_draws ?? 1}
            onDrawModeChange={(mode) => updateList.mutate({ id: list.id, draw_mode: mode })}
            onMaxActiveDrawsChange={(n) => updateList.mutate({ id: list.id, max_active_draws: n })}
          />

          {/* Opportunity toggle */}
          <label className="flex items-center gap-2 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={list.is_opportunity ?? false}
              onChange={async (e) => {
                await updateList.mutateAsync({
                  id: list.id,
                  is_opportunity: e.target.checked,
                  ...(!e.target.checked ? {
                    default_opportunity_subtype: null,
                    default_reward_type: null,
                    default_reward_amount: null,
                  } : {
                    default_opportunity_subtype: 'repeatable' as const,
                  }),
                })
              }}
              style={{ accentColor: 'var(--color-warning)' }}
            />
            <Star size={14} style={{ color: list.is_opportunity ? 'var(--color-warning)' : 'var(--color-text-secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Optional (opportunity)
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              — kids choose to claim, not assigned
            </span>
          </label>

          {list.is_opportunity && (
            <OpportunitySettingsPanel
              defaultSubtype={list.default_opportunity_subtype ?? 'repeatable'}
              defaultRewardType={list.default_reward_type ?? null}
              defaultRewardAmount={list.default_reward_amount ?? null}
              defaultClaimLockDuration={list.default_claim_lock_duration ?? null}
              defaultClaimLockUnit={list.default_claim_lock_unit ?? null}
              onDefaultSubtypeChange={(v) => updateList.mutate({ id: list.id, default_opportunity_subtype: v })}
              onDefaultRewardTypeChange={(v) => updateList.mutate({ id: list.id, default_reward_type: v })}
              onDefaultRewardAmountChange={(v) => updateList.mutate({ id: list.id, default_reward_amount: v })}
              onDefaultClaimLockDurationChange={(v) => updateList.mutate({ id: list.id, default_claim_lock_duration: v })}
              onDefaultClaimLockUnitChange={(v) => updateList.mutate({ id: list.id, default_claim_lock_unit: v })}
              defaultAdvancementMode={list.default_advancement_mode}
              defaultPracticeTarget={list.default_practice_target}
              defaultRequireApproval={list.default_require_approval}
              onDefaultAdvancementModeChange={(v) => updateList.mutate({ id: list.id, default_advancement_mode: v })}
              onDefaultPracticeTargetChange={(v) => updateList.mutate({ id: list.id, default_practice_target: v })}
              onDefaultRequireApprovalChange={(v) => updateList.mutate({ id: list.id, default_require_approval: v })}
            />
          )}

          {/* Daily Progress Marking — list-level tracking defaults */}
          <TrackingDefaultsPanel
            defaultTrackProgress={list.default_track_progress ?? false}
            defaultTrackDuration={list.default_track_duration ?? false}
            onDefaultTrackProgressChange={(v) => updateList.mutate({ id: list.id, default_track_progress: v })}
            onDefaultTrackDurationChange={(v) => updateList.mutate({ id: list.id, default_track_duration: v })}
          />

          {/* Per-item frequency rules */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Item Frequency Rules
            </span>
            {items.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Add items first, then configure frequency rules.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-xs flex-1 pt-1" style={{ color: 'var(--color-text-primary)' }}>
                      {item.item_name || item.content}
                    </span>
                    <FrequencyRulesEditor
                      value={{
                        frequency_min: item.frequency_min,
                        frequency_max: item.frequency_max,
                        frequency_period: item.frequency_period,
                        cooldown_hours: item.cooldown_hours,
                        lifetime_max: item.max_instances,
                        reward_amount: item.reward_amount,
                      }}
                      onChange={(rules) => handleFrequencyChange(item.id, rules)}
                      compact
                    />
                    <button
                      onClick={() => deleteItem.mutate({ id: item.id, listId: list.id })}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:opacity-100"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build J: Randomizer mastery approval queue (mom only) */}
      {isOwnerOrParent && (
        <RandomizerMasteryApprovalInline
          listId={list.id}
          approverId={memberId}
          familyMembers={familyMembers}
        />
      )}

      {/* Randomizer draw area */}
      <Randomizer
        listId={list.id}
        listTitle={list.title}
        familyId={list.family_id}
        assigningMemberId={memberId}
        items={items}
        eligibleMembers={familyMembers}
        poolMode={poolMode}
        drawMode={list.draw_mode}
        maxActiveDraws={list.max_active_draws}
        isOpportunity={list.is_opportunity ?? false}
      />

      {/* Add item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddItem()}
          placeholder="Add an item to the pool..."
          className="flex-1 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
        </button>
        <Tooltip content="Bulk add with AI frequency suggestions">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Bulk</span>
          </button>
        </Tooltip>
      </div>

      {/* Bulk add with frequency suggestions */}
      {showBulkAdd && (
        <BulkAddWithFrequency
          listId={list.id}
          listTitle={list.title}
          existingItemCount={items.length}
          onSave={async (parsed) => {
            for (const item of parsed) {
              const { data: created } = await supabase
                .from('list_items')
                .insert({
                  list_id: list.id,
                  content: item.text,
                  section_name: item.category || undefined,
                  sort_order: items.length,
                  frequency_min: item.frequency.frequency_min,
                  frequency_max: item.frequency.frequency_max,
                  frequency_period: item.frequency.frequency_period,
                  cooldown_hours: item.frequency.cooldown_hours,
                  max_instances: item.frequency.lifetime_max,
                  reward_amount: item.frequency.reward_amount,
                })
                .select('id')
                .single()

              if (!created) continue
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}
    </div>
  )
}

// ── List Detail View ──────────────────────────────────────

function ListDetailView({ listId, onBack }: { listId: string; onBack: () => void }) {
  const { data: list } = useList(listId)
  const { data: items = [], isLoading } = useListItems(listId)
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const createItem = useCreateListItem()
  const toggleItem = useToggleListItem()
  const deleteItem = useDeleteListItem()
  const updateItem = useUpdateListItem()
  const updateList = useUpdateList()
  const uncheckAll = useUncheckAllItems()
  const promoteItem = usePromoteListItem()
  const archiveList = useArchiveList()
  const deleteList = useDeleteList()
  const reorderItems = useReorderListItems()
  const saveAsTemplate = useSaveListAsTemplate()
  const [savedAsTemplate, setSavedAsTemplate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: familyMembers = [] } = useFamilyMembers(list?.family_id)
  const { data: shares = [] } = useListShares(listId)
  const shareList = useShareList()
  const unshareList = useUnshareList()
  const updateSharePermission = useUpdateSharePermission()
  const hideSharedList = useHideSharedList()
  const [showShareModal, setShowShareModal] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const claimItem = useClaimListItem()
  const duplicateForMembers = useDuplicateListForMembers()
  const { data: pendingChanges = [] } = usePendingChangesForSource('list', listId)
  const applyPendingChanges = useApplyPendingChanges()
  const createPendingChange = useCreatePendingChange()
  const [applyingPending, setApplyingPending] = useState(false)

  // Now/Next staging for shared list edits
  const isSharedList = !!(list?.is_shared && shares.length > 0)
  const [nowNextPending, setNowNextPending] = useState<{
    updates: Record<string, unknown>
    changedFields: string[]
    sourceType: 'list' | 'list_item'
    sourceId: string
  } | null>(null)

  const sharedMemberNames: string[] = isSharedList
    ? shares.map(s => familyMembers.find(fm => fm.id === s.member_id)?.display_name).filter((n): n is string => !!n)
    : []

  function handleSharedListEdit(
    sourceId: string,
    sourceType: 'list' | 'list_item',
    updates: Record<string, unknown>,
    changedFields: string[],
  ) {
    const category = classifyChangeCategory(changedFields)
    if (isSharedList && category !== 'display') {
      setNowNextPending({ updates, changedFields, sourceType, sourceId })
    } else {
      if (sourceType === 'list') updateList.mutate({ id: sourceId, ...updates })
      else updateItem.mutate({ id: sourceId, listId, ...updates } as Parameters<typeof updateItem.mutate>[0])
    }
  }

  async function handleNowNextConfirm(timing: NowNextTiming) {
    if (!nowNextPending) return
    const { updates, changedFields, sourceType, sourceId } = nowNextPending
    if (timing === 'now') {
      if (sourceType === 'list') updateList.mutate({ id: sourceId, ...updates })
      else updateItem.mutate({ id: sourceId, listId, ...updates } as Parameters<typeof updateItem.mutate>[0])
    } else {
      await createPendingChange.mutateAsync({
        source_type: sourceType,
        source_id: sourceId,
        change_category: classifyChangeCategory(changedFields),
        change_payload: updates as Record<string, unknown>,
        trigger_mode: 'manual_apply',
        affected_member_ids: shares.map(s => s.member_id).filter((id): id is string => !!id),
      })
    }
    setNowNextPending(null)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [newItemText, setNewItemText] = useState('')
  const [newItemSection, setNewItemSection] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [_showAddSection, _setShowAddSection] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [localItems, setLocalItems] = useState<ListItem[] | null>(null)
  const [showOrganize, setShowOrganize] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const [organizePreview, setOrganizePreview] = useState<Record<string, string[]> | null>(null)
  const [organizeMapping, setOrganizeMapping] = useState<Map<string, string> | null>(null)
  const [organizeError, setOrganizeError] = useState<string | null>(null)
  const createVictory = useCreateVictory()
  const queryClient = useQueryClient()
  const [victoryCreated, setVictoryCreated] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Sync local items when server items change (and no drag in progress)
  useEffect(() => {
    if (items.length > 0 || localItems !== null) {
      setLocalItems(items)
    }
  }, [items])

  const displayItems = localItems ?? items
  const sharedMemberIds = new Set(shares.map(s => s.member_id).filter(Boolean))

  if (!list) return null

  // ── Permission model ───────────────────────────────────
  // isOwnerOrParent: can Archive, Delete, Share, Save-as-Template
  // canEdit: can add/edit/delete items (owner, parent, or shared-with-edit)
  const isOwner = list.owner_id === member?.id
  const isPrimaryParent = member?.role === 'primary_parent'
  const isOwnerOrParent = isOwner || isPrimaryParent
  const myShare = shares.find(s => s.member_id === member?.id)
  const canEdit = list.is_shared
    ? isPrimaryParent
    : (isOwnerOrParent || myShare?.permission === 'edit' || myShare?.can_edit === true)

  function getCheckerProps(item: ListItem) {
    if (!list?.is_shared || !item.checked || !item.checked_by) return {}
    if (item.checked_by === member?.id) return {}
    const checker = familyMembers.find(m => m.id === item.checked_by)
    return {
      checkerName: checker?.display_name ?? 'Someone',
      checkerColor: checker ? getMemberColor(checker) : '#6B7280',
      canUncheck: isPrimaryParent,
    }
  }

  function getClaimProps(item: ListItem) {
    if (!list?.is_shared || item.checked) return {}
    if (!item.in_progress_member_id) return { onClaimToggle: () => claimItem.mutate({ id: item.id, listId, memberId: member?.id ?? '' }) }
    if (item.in_progress_member_id === member?.id) return {
      claimedByMe: true,
      onClaimToggle: () => claimItem.mutate({ id: item.id, listId, memberId: null }),
    }
    const claimer = familyMembers.find(m => m.id === item.in_progress_member_id)
    return {
      claimerName: claimer?.display_name ?? 'Someone',
      claimerColor: claimer ? getMemberColor(claimer) : '#6B7280',
      onClaimToggle: isPrimaryParent ? () => claimItem.mutate({ id: item.id, listId, memberId: null }) : undefined,
    }
  }

  // "Leave shared list" — soft-hides the share so user can recover later
  async function handleLeaveSharedList() {
    if (!myShare) return
    await hideSharedList.mutateAsync({ shareId: myShare.id })
    onBack()
  }

  // Confirm leave dialog (renders as overlay in any branch)
  const leaveConfirmDialog = confirmLeave && !isOwnerOrParent && myShare && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-sm rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Leave this shared list?</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          It will be hidden from your Lists page. You can bring it back anytime from the Archived tab.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setConfirmLeave(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button
            onClick={handleLeaveSharedList}
            disabled={hideSharedList.isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            {hideSharedList.isPending ? 'Hiding...' : 'Leave List'}
          </button>
        </div>
      </div>
    </div>
  )

  if (list.list_type === 'randomizer') {
    return (
      <>
        {leaveConfirmDialog}
        <RandomizerDetailView
          list={list}
          items={items}
          memberId={member?.id ?? ''}
          familyMembers={familyMembers}
          isOwnerOrParent={isOwnerOrParent}
          myShare={myShare}
          onHide={() => setConfirmLeave(true)}
          onBack={onBack}
        />
      </>
    )
  }

  // ── Reference list detail view ─────────────────────────
  if (list.list_type === 'reference') {
    const refCfg = TYPE_CONFIG.reference
    const RefIcon = refCfg.icon
    return (
      <>
      {leaveConfirmDialog}
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
            <ChevronDown size={20} className="rotate-90" />
          </button>
          <RefIcon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
            {list.title}
          </h1>
          <div className="flex items-center gap-1.5">
            {isOwnerOrParent && (
              <Tooltip content="Share with family">
                <button onClick={() => setShowShareModal(true)} className="p-1.5 rounded-lg relative" style={{ color: shares.length > 0 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}>
                  <Share2 size={16} />
                  {shares.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                      {shares.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip content="Bulk add">
                <button onClick={() => setShowBulkAdd(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  <Wand2 size={16} />
                </button>
              </Tooltip>
            )}
            {isOwnerOrParent ? (
              <>
                <Tooltip content="Archive">
                  <button onClick={() => { archiveList.mutate(listId); onBack() }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    <Archive size={16} />
                  </button>
                </Tooltip>
                <Tooltip content="Delete permanently">
                  <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                    <Trash2 size={16} />
                  </button>
                </Tooltip>
              </>
            ) : myShare && (
              <Tooltip content="Leave shared list">
                <button onClick={() => setConfirmLeave(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  <UserMinus size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {list.is_shared && shares.length > 0 && (
          <SharedWithHeader
            members={familyMembers.filter(m => shares.some(s => s.member_id === m.id))}
            currentMemberId={member?.id}
          />
        )}

        {/* Tags display */}
        {list.tags && list.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {list.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)', color: 'var(--color-btn-primary-bg)' }}>
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Shared with indicator */}
        {shares.length > 0 && (
          <div className="flex items-center gap-1.5 px-1">
            <UserCheck size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Shared with {shares.map(s => {
                const m = familyMembers.find(fm => fm.id === s.member_id)
                return m?.display_name ?? 'someone'
              }).join(', ')}
            </span>
          </div>
        )}

        {/* Reference content in card */}
        <div className="rounded-xl overflow-hidden p-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <ReferenceListView listId={listId} canEdit={canEdit} />
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>Delete this list permanently?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button onClick={() => { deleteList.mutate(listId); onBack() }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        )}

        {/* Share modal */}
        {showShareModal && (
          <ShareListModal
            familyMembers={familyMembers}
            currentMemberId={member?.id ?? ''}
            sharedMemberIds={sharedMemberIds}
            shares={shares}
            onToggle={handleToggleShare}
            onUpdatePermission={handleUpdatePermission}
            isPending={shareList.isPending || unshareList.isPending}
            onClose={() => setShowShareModal(false)}
            sourceList={list}
            items={items}
            familyId={list.family_id}
            onDuplicateForMembers={async (memberIds) => {
              await duplicateForMembers.mutateAsync({ sourceList: list, items, memberIds, familyId: list.family_id })
            }}
          />
        )}

        {/* AI Bulk Add */}
        {showBulkAdd && (
          <BulkAddWithAI
            title={`Bulk Add — ${list.title}`}
            placeholder="Paste reference content here — headings become sections, bullet points become items"
            hint="Headings or bold lines become section names. Items underneath become list items. Sub-lines or parenthetical notes become item notes."
            categories={[...new Set(items.map(i => i.section_name).filter(Boolean) as string[])].map(s => ({ value: s, label: s }))}
            parsePrompt="Parse the following text into a structured reference list. Identify section headers (bold text, lines ending with ':', or lines that introduce a group of bullets) as section_name values. For each section, the bullet points or numbered items beneath it are list items. If an item has a sub-line, parenthetical, or detail line immediately after it, treat that as the item's notes field. Return JSON array: [{text: string, category?: string, metadata?: {note?: string}, selected: boolean}]"
            onSave={async (parsed) => {
              for (const item of parsed.filter(i => i.selected)) {
                const note = typeof item.metadata?.note === 'string' ? item.metadata.note : undefined
                await createItem.mutateAsync({
                  list_id: listId,
                  content: item.text,
                  section_name: item.category || undefined,
                  notes: note,
                  sort_order: items.length,
                })
              }
            }}
            onClose={() => setShowBulkAdd(false)}
          />
        )}
      </div>
      </>
    )
  }

  const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
  const Icon = cfg.icon
  const isShopping = list.list_type === 'shopping'

  // Group items by section
  const sections = new Map<string, ListItem[]>()
  const unsectioned: ListItem[] = []
  displayItems.forEach(item => {
    if (item.section_name) {
      if (!sections.has(item.section_name)) sections.set(item.section_name, [])
      sections.get(item.section_name)!.push(item)
    } else {
      unsectioned.push(item)
    }
  })

  const totalItems = items.length
  const checkedItems = items.filter(i => i.checked).length
  const totalPrice = items.reduce((sum, i) => sum + (i.price ?? 0), 0)

  async function addItem() {
    if (!newItemText.trim()) return
    await createItem.mutateAsync({
      list_id: listId,
      content: newItemText.trim(),
      section_name: newItemSection || undefined,
      sort_order: items.length,
    })
    setNewItemText('')
  }

  async function handlePromote(item: ListItem) {
    if (!family || !member) return
    await promoteItem.mutateAsync({
      itemId: item.id,
      content: item.content || item.item_name || '',
      familyId: family.id,
      memberId: member.id,
      listId,
    })
  }

  function getMemberType() {
    if (!member) return 'adult' as const
    if (member.dashboard_mode === 'guided') return 'guided' as const
    if (member.dashboard_mode === 'play') return 'play' as const
    if (member.dashboard_mode === 'independent') return 'teen' as const
    return 'adult' as const
  }

  // Victory creation on item check — handles per-item and per-list modes
  function handleToggle(item: ListItem) {
    const isChecking = !item.checked
    toggleItem.mutate(
      { id: item.id, checked: isChecking, listId, checkedBy: member?.id, familyId: family?.id ?? undefined, itemContent: item.content || item.item_name || undefined },
      {
        onSuccess: async () => {
          if (!isChecking || !list || !family || !member) return
          const mode = list.victory_mode ?? 'none'
          if (mode === 'none') return

          const memberType = getMemberType()
          const doPerItem = (mode === 'item_completed' || mode === 'both') && item.victory_flagged
          const doListComplete = mode === 'list_completed' || mode === 'both'

          // Per-item victory (idempotent: check for existing victory with same source_reference_id)
          if (doPerItem) {
            const { data: existing } = await supabase
              .from('victories')
              .select('id')
              .eq('family_id', family.id)
              .eq('source', 'list_item_completed')
              .eq('source_reference_id', item.id)
              .limit(1)
            if (!existing || existing.length === 0) {
              createVictory.mutate({
                family_id: family.id,
                family_member_id: member.id,
                description: item.content || item.item_name || 'List item completed',
                source: 'list_item_completed',
                source_reference_id: item.id,
                member_type: memberType,
                importance: 'small_win',
              })
            }
          }

          // Per-list victory (all items checked)
          if (doListComplete && !victoryCreated) {
            const uncheckedCount = items.filter(i => !i.checked && i.id !== item.id).length
            if (uncheckedCount === 0 && items.length > 0) {
              createVictory.mutate({
                family_id: family.id,
                family_member_id: member.id,
                description: `Completed ${list.title}!`,
                source: 'list_completed',
                source_reference_id: list.id,
                member_type: memberType,
                importance: 'standard',
              })
              setVictoryCreated(true)
              setShowCelebration(true)
              setTimeout(() => setShowCelebration(false), 4000)
            }
          }
        },
      }
    )
  }

  // When victory mode changes, auto-flag/unflag all items
  async function handleVictoryModeChange(newMode: VictoryMode) {
    handleSharedListEdit(listId, 'list', { victory_mode: newMode }, ['victory_mode'])
    const shouldFlag = newMode === 'item_completed' || newMode === 'both'
    // Bulk update all items' victory_flagged
    if (items.length > 0) {
      await Promise.all(
        items.map(item =>
          supabase.from('list_items').update({ victory_flagged: shouldFlag }).eq('id', item.id)
        )
      )
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    }
  }

  function handleDragEnd(event: DragEndEvent, scopedItems: ListItem[]) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = scopedItems.findIndex(i => i.id === active.id)
    const newIndex = scopedItems.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(scopedItems, oldIndex, newIndex)

    // Optimistic update: replace items in local state
    setLocalItems(prev => {
      if (!prev) return prev
      const updated = [...prev]
      reordered.forEach((item, idx) => {
        const globalIdx = updated.findIndex(i => i.id === item.id)
        if (globalIdx !== -1) {
          updated[globalIdx] = { ...updated[globalIdx], sort_order: idx }
        }
      })
      return updated
    })

    // Persist to DB
    reorderItems.mutate(
      reordered.map((item, idx) => ({ id: item.id, sort_order: idx }))
    )
  }

  async function handleToggleShare(memberId: string) {
    const existing = shares.find(s => s.member_id === memberId)
    if (existing) {
      await unshareList.mutateAsync({ shareId: existing.id, listId })
    } else {
      await shareList.mutateAsync({ listId, memberId, listType: list?.list_type })
    }
  }

  async function handleUpdatePermission(shareId: string, permission: 'view' | 'edit') {
    await updateSharePermission.mutateAsync({ shareId, permission })
  }

  async function handleOrganize(storeNames: string) {
    if (items.length === 0) return
    setOrganizing(true)
    setOrganizePreview(null)
    setOrganizeMapping(null)
    setOrganizeError(null)

    try {
      const itemNames = items.map(i => i.content || i.item_name || '').filter(Boolean)
      const existingSections = Array.from(sections.keys())
      const storesHint = storeNames.trim()
        ? storeNames.split(',').map(s => s.trim()).filter(Boolean)
        : existingSections.length > 0
          ? existingSections
          : []

      const storeInstruction = storesHint.length > 0
        ? `Group by these stores/sections: ${storesHint.join(', ')}`
        : 'Group by logical store sections (e.g., Produce, Dairy, Meat, Frozen, Pantry, Household, Pharmacy)'

      const response = await sendAIMessage(
        `You are organizing a shopping list. ${storeInstruction}.
Return ONLY a JSON object where each key is a section/store name and each value is an array of item names from the list.
Every item must appear exactly once. Do not add items not in the list. Do not rename items.
Example: {"Produce": ["Bananas", "Spinach"], "Dairy": ["Milk", "Cheese"]}`,
        [{ role: 'user', content: itemNames.join('\n') }],
        2048,
        'haiku',
      )

      const parsed = extractJSON<Record<string, string[]>>(response)
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        setOrganizePreview(parsed)

        // Build item → section mapping (fuzzy match: trim + case-insensitive)
        const mapping = new Map<string, string>()
        for (const [section, sectionItems] of Object.entries(parsed)) {
          for (const itemName of sectionItems) {
            const needle = itemName.toLowerCase().trim()
            const match = items.find(i =>
              (i.content || i.item_name || '').toLowerCase().trim() === needle
            )
            if (match) mapping.set(match.id, section)
          }
        }
        setOrganizeMapping(mapping)
      } else {
        setOrganizeError('AI could not organize the items. Try entering store names.')
      }
    } catch (err) {
      setOrganizeError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setOrganizing(false)
    }
  }

  async function applyOrganization() {
    if (!organizeMapping) return
    setOrganizing(true)
    try {
      for (const [itemId, section] of organizeMapping) {
        await updateItem.mutateAsync({ id: itemId, listId, section_name: section })
      }
      setOrganizePreview(null)
      setOrganizeMapping(null)
      setShowOrganize(false)
    } catch {
      // Silently fail
    } finally {
      setOrganizing(false)
    }
  }

  function moveItemToSection(itemId: string, newSection: string) {
    updateItem.mutate({ id: itemId, listId, section_name: newSection || null })
  }

  // ── Apply Pending Changes banner ────────────────────────
  const pendingCount = pendingChanges.length
  const pendingBanner = pendingCount > 0 && isOwnerOrParent ? (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
      style={{
        background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
        border: '1px solid var(--color-btn-primary-bg)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          Staged for this list. Apply when ready.
        </p>
      </div>
      <button
        onClick={async () => {
          setApplyingPending(true)
          try {
            await applyPendingChanges.mutateAsync({ sourceType: 'list', sourceId: listId })
          } finally {
            setApplyingPending(false)
          }
        }}
        disabled={applyingPending}
        className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-text)',
        }}
      >
        {applyingPending ? 'Applying...' : 'Apply now'}
      </button>
    </div>
  ) : null

  // ── Compact shopping list item row ─────────────────────
  const allSectionNames = Array.from(sections.keys())

  function ShoppingItemRow({ item }: { item: ListItem }) {
    const label = item.content || item.item_name || ''
    const qty = item.quantity ? `${item.quantity}${item.quantity_unit ? ' ' + item.quantity_unit : ''}` : null
    const [editing, setEditing] = useState(false)
    const [editText, setEditText] = useState(label)
    const [editNotes, setEditNotes] = useState(item.notes || '')

    function openEdit() {
      setEditText(label)
      setEditNotes(item.notes || '')
      setEditing(true)
    }

    function commitEdit() {
      const trimmedText = editText.trim()
      const trimmedNotes = editNotes.trim()
      const changes: Record<string, unknown> = {}
      if (trimmedText && trimmedText !== label) changes.content = trimmedText
      if (trimmedNotes !== (item.notes || '')) changes.notes = trimmedNotes || null
      if (Object.keys(changes).length > 0) {
        updateItem.mutate({ id: item.id, listId, ...changes })
      }
      setEditing(false)
    }

    if (editing) {
      return (
        <div className="py-1.5 px-1 space-y-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
              placeholder="Item name"
              className="flex-1 px-2 py-1 rounded text-sm"
              style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', outline: 'none' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
              placeholder="Add a note (e.g., without corn syrup)"
              className="flex-1 px-2 py-1 rounded text-xs"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', outline: 'none' }}
            />
            <button onClick={commitEdit} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
              Done
            </button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 rounded text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
          </div>
          {/* Per-item tracking overrides */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Progress:
              <select
                value={item.track_progress === null ? '' : item.track_progress ? 'on' : 'off'}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : e.target.value === 'on'
                  updateItem.mutate({ id: item.id, listId, track_progress: val })
                }}
                className="px-1 py-0.5 rounded text-[11px]"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Use list default</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Duration:
              <select
                value={item.track_duration === null || item.track_duration === undefined ? '' : item.track_duration ? 'on' : 'off'}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : e.target.value === 'on'
                  updateItem.mutate({ id: item.id, listId, track_duration: val })
                }}
                className="px-1 py-0.5 rounded text-[11px]"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Use list default</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
          </div>
        </div>
      )
    }

    const inlineChecker = getCheckerProps(item)
    const inlineClaim = getClaimProps(item)
    const inlineBorderColor = inlineChecker.checkerColor ?? (item.checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)')
    const inlineBgColor = inlineChecker.checkerColor
      ? `color-mix(in srgb, ${inlineChecker.checkerColor} 15%, transparent)`
      : (item.checked ? 'var(--color-btn-primary-bg)' : 'transparent')
    const inlineCheckColor = inlineChecker.checkerColor ?? 'var(--color-btn-primary-text)'
    const inlineToggleDisabled = item.checked && inlineChecker.canUncheck === false

    return (
      <div
        className="flex items-center gap-2 py-1 px-1 group"
        style={{ opacity: item.checked ? 0.5 : 1 }}
      >
        <button
          onClick={() => handleToggle(item)}
          disabled={inlineToggleDisabled}
          className="shrink-0"
          style={{ cursor: inlineToggleDisabled ? 'default' : 'pointer' }}
        >
          <div
            className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors"
            style={{
              borderColor: inlineBorderColor,
              backgroundColor: inlineBgColor,
            }}
          >
            {item.checked && <Check size={10} style={{ color: inlineCheckColor }} />}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm truncate ${item.checked ? 'line-through' : ''}`} style={{ color: 'var(--color-text-primary)' }}>
              {label}
              {qty && <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>{qty}</span>}
            </span>
            {inlineChecker.checkerName && (
              <span className="text-[10px] shrink-0" style={{ color: inlineChecker.checkerColor ?? 'var(--color-text-secondary)' }}>
                by {inlineChecker.checkerName}
              </span>
            )}
            {!item.checked && inlineClaim.claimerName && !inlineClaim.claimedByMe && (
              <span className="inline-flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: inlineClaim.claimerColor ?? 'var(--color-text-secondary)' }}>
                <Loader2 size={9} className="animate-spin" />
                {inlineClaim.claimerName}
              </span>
            )}
            {!item.checked && inlineClaim.claimedByMe && inlineClaim.onClaimToggle && (
              <button
                onClick={(e) => { e.stopPropagation(); inlineClaim.onClaimToggle!() }}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium shrink-0"
                style={{ color: 'var(--color-btn-primary-bg)', background: 'none', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer' }}
              >
                on it ✕
              </button>
            )}
            {!item.checked && !inlineClaim.claimerName && !inlineClaim.claimedByMe && inlineClaim.onClaimToggle && (
              <button
                onClick={(e) => { e.stopPropagation(); inlineClaim.onClaimToggle!() }}
                className="text-[10px] opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity shrink-0"
                style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer' }}
              >
                I'm on it
              </button>
            )}
          </div>
          {item.notes && (
            <span className="text-[11px] italic block whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              {item.notes}
            </span>
          )}
        </div>
        {/* Pencil to edit */}
        <button
          onClick={openEdit}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Edit item"
        >
          <Pencil size={12} />
        </button>
        {/* Move to section */}
        {allSectionNames.length > 1 && (
          <select
            value={item.section_name || ''}
            onChange={e => { e.stopPropagation(); moveItemToSection(item.id, e.target.value) }}
            className="text-[10px] px-1 py-0 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 max-w-20"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            title="Move to section"
          >
            <option value="">Unsorted</option>
            {allSectionNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button
          onClick={() => deleteItem.mutate({ id: item.id, listId })}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  // ── Render: Shopping compact layout ────────────────────
  if (isShopping) {
    return (
      <>
      {leaveConfirmDialog}
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
            <ChevronDown size={20} className="rotate-90" />
          </button>
          <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
            {list.title}
          </h1>
          <div className="flex items-center gap-1.5">
            {isOwnerOrParent && (
              <>
                <Tooltip content="Share with family">
                  <button onClick={() => setShowShareModal(true)} className="p-1.5 rounded-lg relative" style={{ color: shares.length > 0 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}>
                    <Share2 size={16} />
                    {shares.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                        {shares.length}
                      </span>
                    )}
                  </button>
                </Tooltip>
                <Tooltip content={savedAsTemplate ? 'Saved!' : 'Make Reusable'}>
                  <button
                    onClick={async () => {
                      if (!family || !member || !list || savedAsTemplate) return
                      await saveAsTemplate.mutateAsync({ familyId: family.id, createdBy: member.id, title: list.title, listType: list.list_type, items })
                      setSavedAsTemplate(true)
                      setTimeout(() => setSavedAsTemplate(false), 3000)
                    }}
                    disabled={saveAsTemplate.isPending || savedAsTemplate}
                    className="p-1.5 rounded-lg" style={{ color: savedAsTemplate ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
                  ><Save size={16} /></button>
                </Tooltip>
              </>
            )}
            {canEdit && (
              <Tooltip content="Uncheck all">
                <button onClick={() => uncheckAll.mutate(listId)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><RotateCcw size={16} /></button>
              </Tooltip>
            )}
            {isOwnerOrParent ? (
              <>
                <Tooltip content="Archive">
                  <button onClick={() => { archiveList.mutate(listId); onBack() }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><Archive size={16} /></button>
                </Tooltip>
                <Tooltip content="Delete permanently">
                  <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><Trash2 size={16} /></button>
                </Tooltip>
              </>
            ) : myShare && (
              <Tooltip content="Leave shared list">
                <button onClick={() => setConfirmLeave(true)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}><UserMinus size={16} /></button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && isOwnerOrParent && (
          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-text-error, #ef4444)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Permanently delete "{list.title}"?
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              This will delete the list and all its items. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button
                onClick={() => { deleteList.mutate(listId); onBack() }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Shared with indicator */}
        {shares.length > 0 && (
          <div className="flex items-center gap-1.5 px-1">
            <UserCheck size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Shared with {shares.map(s => {
                const m = familyMembers.find(fm => fm.id === s.member_id)
                return m?.display_name ?? 'someone'
              }).join(', ')}
            </span>
          </div>
        )}

        {pendingBanner}

        {/* Victory mode selector */}
        {isOwnerOrParent && (
          <VictoryModeSelector
            mode={list.victory_mode ?? 'none'}
            onChange={handleVictoryModeChange}
          />
        )}

        {/* Single-card compact list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          {/* Progress bar inside card */}
          {totalItems > 0 && (
            <div className="flex items-center gap-3 px-4 pt-3 pb-1">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(checkedItems / totalItems) * 100}%`, backgroundColor: 'var(--color-btn-primary-bg)' }} />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{checkedItems}/{totalItems}</span>
            </div>
          )}

          {/* Sectioned items */}
          <div className="px-3 pb-3 pt-1">
            {Array.from(sections.entries()).map(([sectionName, sectionItems]) => {
              const sorted = sectionItems.sort((a, b) => a.sort_order - b.sort_order)
              const sectionChecked = sorted.filter(i => i.checked).length
              return (
                <div key={sectionName} className="mt-2 first:mt-0">
                  <div className="flex items-center gap-2 py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-btn-primary-bg)' }}>
                      {sectionName}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {sectionChecked}/{sorted.length}
                    </span>
                  </div>
                  {sorted.map(item => <ShoppingItemRow key={item.id} item={item} />)}
                </div>
              )
            })}

            {/* Unsectioned items */}
            {unsectioned.length > 0 && (
              <div className={sections.size > 0 ? 'mt-2' : ''}>
                {sections.size > 0 && (
                  <div className="flex items-center gap-2 py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Other</span>
                  </div>
                )}
                {unsectioned.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <ShoppingItemRow key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Empty state inside card */}
            {items.length === 0 && !isLoading && (
              <div className="py-6 text-center">
                <ShoppingCart size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Start adding items below
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add item (with section picker for shopping) */}
        <div className="space-y-2 pb-20 md:pb-0">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1.5">
              <input
                type="text"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="Add an item..."
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              {(() => {
                // For wishlists, always show section selector with suggested sections
                const wishlistSuggestions = list.list_type === 'wishlist' ? ['Want', 'Need', 'Saving For'] : []
                const allSections = new Set([...Array.from(sections.keys()), ...wishlistSuggestions])
                return allSections.size > 0 ? (
                  <select
                    value={newItemSection}
                    onChange={e => setNewItemSection(e.target.value)}
                    className="px-2 py-2 rounded-lg text-xs max-w-30"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    <option value="">No section</option>
                    {Array.from(allSections).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : null
              })()}
            </div>
            <button
              onClick={addItem}
              disabled={!newItemText.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            ><Plus size={16} /></button>
          </div>
          <div className="flex gap-2">
            <Tooltip content="Bulk add items with AI">
              <button
                onClick={() => setShowBulkAdd(true)}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
              >
                <Sparkles size={14} />
                Bulk Add
              </button>
            </Tooltip>
            {items.length >= 3 && (
              <Tooltip content="Organize by store with AI">
                <button
                  onClick={() => setShowOrganize(true)}
                  disabled={organizing}
                  className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
                >
                  <Wand2 size={14} />
                  Organize
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Organize with AI modal */}
        {showOrganize && (
          <OrganizeModal
            items={items}
            existingSections={Array.from(sections.keys())}
            preview={organizePreview}
            organizing={organizing}
            error={organizeError}
            onOrganize={handleOrganize}
            onApply={applyOrganization}
            onClose={() => { setShowOrganize(false); setOrganizePreview(null); setOrganizeMapping(null); setOrganizeError(null) }}
          />
        )}

        {/* Share modal */}
        {showShareModal && (
          <ShareListModal
            familyMembers={familyMembers}
            currentMemberId={member?.id ?? ''}
            sharedMemberIds={sharedMemberIds}
            shares={shares}
            onToggle={handleToggleShare}
            onUpdatePermission={handleUpdatePermission}
            isPending={shareList.isPending || unshareList.isPending}
            onClose={() => setShowShareModal(false)}
            sourceList={list}
            items={items}
            familyId={list.family_id}
            onDuplicateForMembers={async (memberIds) => {
              await duplicateForMembers.mutateAsync({ sourceList: list, items, memberIds, familyId: list.family_id })
            }}
          />
        )}

        {/* AI Bulk Add Modal */}
        {showBulkAdd && (
          <BulkAddWithAI
            title={`Bulk Add — ${list.title}`}
            placeholder={getBulkAddPlaceholder(list.list_type as string)}
            hint={getBulkAddHint(list.list_type as string)}
            categories={getBulkAddCategories(list.list_type as string, Array.from(sections.keys()))}
            parsePrompt={getBulkAddPrompt(list.list_type as string)}
            onSave={async (parsed) => {
              for (const item of parsed.filter(i => i.selected)) {
                const note = typeof item.metadata?.note === 'string' ? item.metadata.note : undefined
                await createItem.mutateAsync({
                  list_id: listId,
                  content: item.text,
                  section_name: item.category || undefined,
                  notes: note,
                  sort_order: items.length,
                })
              }
            }}
            onClose={() => setShowBulkAdd(false)}
          />
        )}
      </div>
      <NowNextChoiceModal
        isOpen={!!nowNextPending}
        onClose={() => setNowNextPending(null)}
        title="Update shared list?"
        itemName={list.title || list.list_name || 'List'}
        affectedNames={sharedMemberNames}
        affectedCount={sharedMemberNames.length}
        defaultTiming={nowNextPending ? (classifyChangeCategory(nowNextPending.changedFields) === 'display' ? 'now' : 'next') : 'next'}
        nextCycleDate={null}
        onConfirm={handleNowNextConfirm}
        onCancel={() => setNowNextPending(null)}
      />
      </>
    )
  }

  // ── Render: Standard layout (non-shopping) ─────────────
  return (
    <>
    {leaveConfirmDialog}
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronDown size={20} className="rotate-90" />
        </button>
        <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          {list.title}
        </h1>
        <div className="flex items-center gap-1.5">
          {isOwnerOrParent && (
            <>
              <Tooltip content={list.is_included_in_ai ? 'LiLa uses this list as context' : 'Include in LiLa context'}>
                <button
                  onClick={() => updateList.mutate({ id: listId, is_included_in_ai: !list.is_included_in_ai })}
                  className="p-1.5 rounded-lg"
                >
                  {list.is_included_in_ai
                    ? <Heart size={16} fill="var(--color-accent)" style={{ color: 'var(--color-accent)' }} />
                    : <HeartOff size={16} style={{ color: 'var(--color-text-secondary)' }} />}
                </button>
              </Tooltip>
              <Tooltip content="Share with family">
                <button onClick={() => setShowShareModal(true)} className="p-1.5 rounded-lg relative" style={{ color: shares.length > 0 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}>
                  <Share2 size={16} />
                  {shares.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[8px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
                      {shares.length}
                    </span>
                  )}
                </button>
              </Tooltip>
              <Tooltip content={savedAsTemplate ? 'Saved!' : 'Make Reusable'}>
                <button
                  onClick={async () => {
                    if (!family || !member || !list || savedAsTemplate) return
                    await saveAsTemplate.mutateAsync({
                      familyId: family.id,
                      createdBy: member.id,
                      title: list.title,
                      listType: list.list_type,
                      items,
                    })
                    setSavedAsTemplate(true)
                    setTimeout(() => setSavedAsTemplate(false), 3000)
                  }}
                  disabled={saveAsTemplate.isPending || savedAsTemplate}
                  className="p-1.5 rounded-lg text-xs"
                  style={{ color: savedAsTemplate ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
                >
                  <Save size={16} />
                </button>
              </Tooltip>
            </>
          )}
          {canEdit && (
            <Tooltip content="Uncheck all">
              <button
                onClick={() => uncheckAll.mutate(listId)}
                className="p-1.5 rounded-lg text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <RotateCcw size={16} />
              </button>
            </Tooltip>
          )}
          {isOwnerOrParent ? (
            <>
              <Tooltip content="Archive">
                <button
                  onClick={() => { archiveList.mutate(listId); onBack() }}
                  className="p-1.5 rounded-lg text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Archive size={16} />
                </button>
              </Tooltip>
              <Tooltip content="Delete permanently">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            </>
          ) : myShare && (
            <Tooltip content="Leave shared list">
              <button onClick={() => setConfirmLeave(true)} className="p-1.5 rounded-lg text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <UserMinus size={16} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && isOwnerOrParent && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '2px solid var(--color-text-error, #ef4444)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Permanently delete "{list.title}"?
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            This will delete the list and all its items. This cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={() => { deleteList.mutate(listId); onBack() }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Shared with indicator */}
      {shares.length > 0 && (
        <div className="flex items-center gap-1.5 px-1">
          <UserCheck size={12} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Shared with {shares.map(s => {
              const m = familyMembers.find(fm => fm.id === s.member_id)
              return m?.display_name ?? 'someone'
            }).join(', ')}
          </span>
        </div>
      )}

      {pendingBanner}

      {/* Victory mode selector */}
      {isOwnerOrParent && (
        <VictoryModeSelector
          mode={list.victory_mode ?? 'none'}
          onChange={handleVictoryModeChange}
        />
      )}

      {/* Opportunity toggle + settings */}
      {isOwnerOrParent && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={list.is_opportunity ?? false}
              onChange={async (e) => {
                await updateList.mutateAsync({
                  id: listId,
                  is_opportunity: e.target.checked,
                  ...(!e.target.checked ? {
                    default_opportunity_subtype: null,
                    default_reward_type: null,
                    default_reward_amount: null,
                    default_claim_lock_duration: null,
                    default_claim_lock_unit: null,
                  } : {
                    default_opportunity_subtype: 'claimable' as const,
                  }),
                })
              }}
              style={{ accentColor: 'var(--color-warning)' }}
            />
            <Star size={14} style={{ color: list.is_opportunity ? 'var(--color-warning)' : 'var(--color-text-secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
              This is an opportunity list
            </span>
          </label>
          {list.is_opportunity && (
            <OpportunitySettingsPanel
              defaultSubtype={list.default_opportunity_subtype ?? 'claimable'}
              defaultRewardType={list.default_reward_type ?? null}
              defaultRewardAmount={list.default_reward_amount ?? null}
              defaultClaimLockDuration={list.default_claim_lock_duration ?? null}
              defaultClaimLockUnit={list.default_claim_lock_unit ?? null}
              onDefaultSubtypeChange={(v) => updateList.mutate({ id: listId, default_opportunity_subtype: v })}
              onDefaultRewardTypeChange={(v) => updateList.mutate({ id: listId, default_reward_type: v })}
              onDefaultRewardAmountChange={(v) => updateList.mutate({ id: listId, default_reward_amount: v })}
              onDefaultClaimLockDurationChange={(v) => updateList.mutate({ id: listId, default_claim_lock_duration: v })}
              onDefaultClaimLockUnitChange={(v) => updateList.mutate({ id: listId, default_claim_lock_unit: v })}
              defaultAdvancementMode={list.default_advancement_mode}
              defaultPracticeTarget={list.default_practice_target}
              defaultRequireApproval={list.default_require_approval}
              onDefaultAdvancementModeChange={(v) => updateList.mutate({ id: listId, default_advancement_mode: v })}
              onDefaultPracticeTargetChange={(v) => updateList.mutate({ id: listId, default_practice_target: v })}
              onDefaultRequireApprovalChange={(v) => updateList.mutate({ id: listId, default_require_approval: v })}
            />
          )}

          {/* Daily Progress Marking — list-level tracking defaults */}
          <TrackingDefaultsPanel
            defaultTrackProgress={list.default_track_progress ?? false}
            defaultTrackDuration={list.default_track_duration ?? false}
            onDefaultTrackProgressChange={(v) => handleSharedListEdit(listId, 'list', { default_track_progress: v }, ['default_track_progress'])}
            onDefaultTrackDurationChange={(v) => handleSharedListEdit(listId, 'list', { default_track_duration: v }, ['default_track_duration'])}
          />
        </div>
      )}

      {/* Progress */}
      {totalItems > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(checkedItems / totalItems) * 100}%`, backgroundColor: 'var(--color-btn-primary-bg)' }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {checkedItems}/{totalItems}
          </span>
        </div>
      )}

      {/* Victory celebration banner */}
      {showCelebration && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium animate-pulse"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)', color: 'var(--color-btn-primary-bg)' }}>
          <Trophy size={16} />
          <span>All done! Victory recorded!</span>
        </div>
      )}

      {/* Price total for wishlists/expenses */}
      {(list.list_type === 'wishlist' || list.list_type === 'expenses') && totalPrice > 0 && (
        <div className="text-right text-sm font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
          Total: ${totalPrice.toFixed(2)}
        </div>
      )}

      {/* Items by section */}
      {Array.from(sections.entries()).map(([sectionName, sectionItems]) => {
        const sorted = sectionItems.sort((a, b) => a.sort_order - b.sort_order)
        return (
          <div key={sectionName}>
            <p className="text-xs font-semibold uppercase tracking-wider px-1 pb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {sectionName}
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, sorted)}>
              <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {sorted.map(item => (
                    <SortableListItemRow
                      key={item.id}
                      item={item}
                      listType={list.list_type}
                      onToggle={() => handleToggle(item)}
                      onDelete={() => deleteItem.mutate({ id: item.id, listId })}
                      onPromote={() => handlePromote(item)}
                      isEditing={editingId === item.id}
                      onEdit={() => setEditingId(editingId === item.id ? null : item.id)}
                      showVictoryFlag={isOwnerOrParent}
                      onToggleVictoryFlag={() => updateItem.mutate({ id: item.id, listId, victory_flagged: !item.victory_flagged })}
                      {...getCheckerProps(item)}
                      {...getClaimProps(item)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )
      })}

      {/* Unsectioned items */}
      {unsectioned.length > 0 && (() => {
        const sorted = unsectioned.sort((a, b) => a.sort_order - b.sort_order)
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, sorted)}>
            <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {sorted.map(item => (
                  <SortableListItemRow
                    key={item.id}
                    item={item}
                    listType={list.list_type}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => deleteItem.mutate({ id: item.id, listId })}
                    onPromote={() => handlePromote(item)}
                    isEditing={editingId === item.id}
                    onEdit={() => setEditingId(editingId === item.id ? null : item.id)}
                    showVictoryFlag={isOwnerOrParent}
                    onToggleVictoryFlag={() => updateItem.mutate({ id: item.id, listId, victory_flagged: !item.victory_flagged })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )
      })()}

      {/* Empty state */}
      {items.length === 0 && !isLoading && (
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Icon size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This list is ready for items! Start adding below.
          </p>
        </div>
      )}

      {/* Add item */}
      <div className="space-y-2 pb-20 md:pb-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Add an item..."
            className="flex-1 px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={addItem}
            disabled={!newItemText.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Bulk add items with AI">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-btn-primary-bg)', border: '1px solid var(--color-border)' }}
          >
            <Sparkles size={14} />
            Bulk Add
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <ShareListModal
          familyMembers={familyMembers}
          currentMemberId={member?.id ?? ''}
          sharedMemberIds={sharedMemberIds}
          onToggle={handleToggleShare}
          isPending={shareList.isPending || unshareList.isPending}
          onClose={() => setShowShareModal(false)}
          sourceList={list}
          items={items}
          familyId={list.family_id}
          onDuplicateForMembers={async (memberIds) => {
            await duplicateForMembers.mutateAsync({ sourceList: list, items, memberIds, familyId: list.family_id })
          }}
        />
      )}

      {/* AI Bulk Add Modal */}
      {showBulkAdd && (
        <BulkAddWithAI
          title={`Bulk Add — ${list.title}`}
          placeholder={getBulkAddPlaceholder(list.list_type as string)}
          hint={getBulkAddHint(list.list_type as string)}
          categories={getBulkAddCategories(list.list_type as string, Array.from(sections.keys()))}
          parsePrompt={getBulkAddPrompt(list.list_type as string)}
          onSave={async (parsed) => {
            for (const item of parsed.filter(i => i.selected)) {
              const note = typeof item.metadata?.note === 'string' ? item.metadata.note : undefined
              await createItem.mutateAsync({
                list_id: listId,
                content: item.text,
                section_name: item.category || undefined,
                notes: note,
                sort_order: items.length,
              })
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}
    </div>
    <NowNextChoiceModal
      isOpen={!!nowNextPending}
      onClose={() => setNowNextPending(null)}
      title="Update shared list?"
      itemName={list.title || list.list_name || 'List'}
      affectedNames={sharedMemberNames}
      affectedCount={sharedMemberNames.length}
      defaultTiming={nowNextPending ? (classifyChangeCategory(nowNextPending.changedFields) === 'display' ? 'now' : 'next') : 'next'}
      nextCycleDate={null}
      onConfirm={handleNowNextConfirm}
      onCancel={() => setNowNextPending(null)}
    />
    </>
  )
}

// ── Organize with AI Modal ───────────────────────────────

function OrganizeModal({
  items,
  existingSections,
  preview,
  organizing,
  error,
  onOrganize,
  onApply,
  onClose,
}: {
  items: ListItem[]
  existingSections: string[]
  preview: Record<string, string[]> | null
  organizing: boolean
  error: string | null
  onOrganize: (stores: string) => Promise<void>
  onApply: () => Promise<void>
  onClose: () => void
}) {
  const [storeInput, setStoreInput] = useState(existingSections.join(', '))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Wand2 size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Organize by Store</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-error, #c44) 10%, transparent)', color: 'var(--color-error, #c44)' }}>
              {error}
            </div>
          )}
          {!preview ? (
            <>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                AI will sort your {items.length} items into store sections. Enter store names or leave blank for auto-grouping by category.
              </p>
              <input
                type="text"
                value={storeInput}
                onChange={e => setStoreInput(e.target.value)}
                placeholder="e.g. Mama Jeans, Sam's, Aldi (or leave blank)"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onOrganize(storeInput)}
                  disabled={organizing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                >
                  {organizing && <Loader2 size={14} className="animate-spin" />}
                  {organizing ? 'Organizing...' : 'Organize'}
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Preview — drag items between sections after applying, or re-organize with different stores.
              </p>
              <div className="space-y-2 max-h-100 overflow-y-auto">
                {Object.entries(preview).map(([section, sectionItems]) => (
                  <div key={section}>
                    <div className="flex items-center gap-2 py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-btn-primary-bg)' }}>
                        {section}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {sectionItems.length} items
                      </span>
                    </div>
                    <div className="pl-2">
                      {sectionItems.map((name, i) => (
                        <p key={i} className="text-sm py-0.5" style={{ color: 'var(--color-text-primary)' }}>
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onApply}
                  disabled={organizing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                >
                  {organizing && <Loader2 size={14} className="animate-spin" />}
                  {organizing ? 'Applying...' : 'Apply'}
                </button>
                <button
                  onClick={() => onOrganize(storeInput)}
                  disabled={organizing}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  Re-organize
                </button>
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Share List Modal ─────────────────────────────────────

function ShareListModal({
  familyMembers,
  currentMemberId,
  sharedMemberIds,
  shares,
  onToggle,
  onUpdatePermission,
  isPending,
  onClose,
  onDuplicateForMembers,
}: {
  familyMembers: FamilyMember[]
  currentMemberId: string
  sharedMemberIds: Set<string | null>
  shares?: ListShare[]
  onToggle: (memberId: string) => Promise<void>
  onUpdatePermission?: (shareId: string, permission: 'view' | 'edit') => Promise<void>
  isPending: boolean
  onClose: () => void
  sourceList?: unknown
  items?: unknown
  familyId?: unknown
  onDuplicateForMembers?: (memberIds: string[]) => Promise<void>
}) {
  const otherMembers = familyMembers.filter(m => m.id !== currentMemberId)
  const [shareMode, setShareMode] = useState<'shared' | 'individual'>('shared')
  const [selectedForCopy, setSelectedForCopy] = useState<Set<string>>(new Set())
  const [copying, setCopying] = useState(false)

  function toggleCopySelection(memberId: string) {
    setSelectedForCopy(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  async function handleCreateCopies() {
    if (!onDuplicateForMembers || selectedForCopy.size === 0) return
    setCopying(true)
    try {
      await onDuplicateForMembers([...selectedForCopy])
      onClose()
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-sm rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>Share List</h3>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}><X size={16} /></button>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {shareMode === 'shared'
            ? 'Everyone sees the same list and can check items off.'
            : 'Each person gets their own copy with the same items.'}
        </p>
        {onDuplicateForMembers && (
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setShareMode('shared')}
              className="flex-1 text-xs py-1.5 font-medium transition-colors"
              style={{
                backgroundColor: shareMode === 'shared' ? 'var(--color-btn-primary-bg)' : 'transparent',
                color: shareMode === 'shared' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              }}
            >
              Shared list
            </button>
            <button
              onClick={() => setShareMode('individual')}
              className="flex-1 text-xs py-1.5 font-medium transition-colors"
              style={{
                backgroundColor: shareMode === 'individual' ? 'var(--color-btn-primary-bg)' : 'transparent',
                color: shareMode === 'individual' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              }}
            >
              Individual copies
            </button>
          </div>
        )}
        {otherMembers.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>No other family members to share with.</p>
        ) : (
          <div className="space-y-2">
            {/* Member toggle pills */}
            <div className="flex flex-wrap gap-2">
              {shareMode === 'shared' ? (
                <>
                  {otherMembers.length > 1 && (() => {
                    const allShared = otherMembers.every(m => sharedMemberIds.has(m.id))
                    return (
                      <button
                        onClick={async () => {
                          for (const m of otherMembers) {
                            const isShared = sharedMemberIds.has(m.id)
                            if (allShared ? isShared : !isShared) await onToggle(m.id)
                          }
                        }}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: allShared ? 'var(--color-btn-primary-bg)' : 'transparent',
                          color: allShared ? 'var(--color-btn-primary-text, #fff)' : 'var(--color-text-primary)',
                          border: `2px solid ${allShared ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                        }}
                      >
                        {allShared && <Check size={12} />}
                        Everyone
                      </button>
                    )
                  })()}
                  {otherMembers.map(m => {
                    const isShared = sharedMemberIds.has(m.id)
                    const color = getMemberColor(m)
                    return (
                      <button
                        key={m.id}
                        onClick={() => onToggle(m.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: isShared ? color : 'transparent',
                          color: isShared ? 'var(--color-text-on-primary, #fff)' : color,
                          border: `2px solid ${color}`,
                        }}
                      >
                        {isShared && <Check size={12} />}
                        {m.display_name}
                      </button>
                    )
                  })}
                </>
              ) : (
                <>
                  {otherMembers.length > 1 && (
                    <button
                      onClick={() => {
                        const allSelected = otherMembers.every(m => selectedForCopy.has(m.id))
                        setSelectedForCopy(allSelected ? new Set() : new Set(otherMembers.map(m => m.id)))
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        backgroundColor: otherMembers.every(m => selectedForCopy.has(m.id)) ? 'var(--color-btn-primary-bg)' : 'transparent',
                        color: otherMembers.every(m => selectedForCopy.has(m.id)) ? 'var(--color-btn-primary-text, #fff)' : 'var(--color-text-primary)',
                        border: `2px solid ${otherMembers.every(m => selectedForCopy.has(m.id)) ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                      }}
                    >
                      {otherMembers.every(m => selectedForCopy.has(m.id)) && <Check size={12} />}
                      Everyone
                    </button>
                  )}
                  {otherMembers.map(m => {
                    const isSel = selectedForCopy.has(m.id)
                    const color = getMemberColor(m)
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleCopySelection(m.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={{
                          backgroundColor: isSel ? color : 'transparent',
                          color: isSel ? 'var(--color-text-on-primary, #fff)' : color,
                          border: `2px solid ${color}`,
                        }}
                      >
                        {isSel && <Check size={12} />}
                        {m.display_name}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* Permission toggles for shared members (shared mode only) */}
            {shareMode === 'shared' && shares && onUpdatePermission && shares.length > 0 && (
              <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Permissions
                </p>
                {shares.map(share => {
                  const m = familyMembers.find(fm => fm.id === share.member_id)
                  if (!m) return null
                  const perm = share.permission ?? (share.can_edit ? 'edit' : 'view')
                  return (
                    <div key={share.id} className="flex items-center justify-between py-0.5">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {m.display_name}
                      </span>
                      <select
                        value={perm}
                        onChange={e => onUpdatePermission(share.id, e.target.value as 'view' | 'edit')}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="view">Can view</option>
                        <option value="edit">Can edit</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          {shareMode === 'individual' && selectedForCopy.size > 0 ? (
            <button
              onClick={handleCreateCopies}
              disabled={copying}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {copying ? 'Creating...' : `Create ${selectedForCopy.size} ${selectedForCopy.size === 1 ? 'Copy' : 'Copies'}`}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sortable List Item Row (wrapper) ──────────────────────

interface ListItemRowProps {
  item: ListItem
  listType: string
  onToggle: () => void
  onDelete: () => void
  onPromote: () => void
  isEditing: boolean
  onEdit: () => void
  showVictoryFlag?: boolean
  onToggleVictoryFlag?: () => void
  dragHandleProps?: Record<string, unknown>
  checkerName?: string | null
  checkerColor?: string | null
  canUncheck?: boolean
  claimedByMe?: boolean
  claimerName?: string | null
  claimerColor?: string | null
  onClaimToggle?: () => void
}

function SortableListItemRow(props: Omit<ListItemRowProps, 'dragHandleProps'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ListItemRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// ── List Item Row ──────────────────────────────────────────

function ListItemRow({
  item,
  listType,
  onToggle,
  onDelete,
  onPromote,
  isEditing: _isEditing,
  onEdit: _onEdit,
  showVictoryFlag,
  onToggleVictoryFlag,
  dragHandleProps,
  checkerName,
  checkerColor,
  canUncheck,
  claimedByMe,
  claimerName,
  claimerColor,
  onClaimToggle,
}: ListItemRowProps) {
  const isTodo = listType === 'todo'
  const isWishlist = listType === 'wishlist'
  const isExpense = listType === 'expenses'
  const isShopping = listType === 'shopping'

  const isCheckedByOther = item.checked && checkerName != null
  const checkBorderColor = isCheckedByOther && checkerColor
    ? checkerColor
    : item.checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'
  const checkBgColor = isCheckedByOther && checkerColor
    ? `color-mix(in srgb, ${checkerColor} 15%, transparent)`
    : item.checked ? 'var(--color-btn-primary-bg)' : 'transparent'
  const checkIconColor = isCheckedByOther && checkerColor
    ? checkerColor
    : 'var(--color-btn-primary-text)'
  const toggleDisabled = item.checked && canUncheck === false

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2 rounded-lg group transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        opacity: item.checked ? 0.6 : 1,
      }}
    >
      {/* Drag handle */}
      {dragHandleProps && (
        <button
          {...dragHandleProps}
          className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <GripVertical size={16} />
        </button>
      )}

      {/* Checkbox */}
      <button onClick={onToggle} disabled={toggleDisabled} className="mt-0.5 shrink-0" style={{ cursor: toggleDisabled ? 'default' : 'pointer' }}>
        <div
          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: checkBorderColor,
            backgroundColor: checkBgColor,
          }}
        >
          {item.checked && <CheckSquare size={12} style={{ color: checkIconColor }} />}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <p
            className={`text-sm ${item.checked ? 'line-through' : ''}`}
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.content || item.item_name}
          </p>
          {isCheckedByOther && (
            <span className="text-[10px]" style={{ color: checkerColor ?? 'var(--color-text-secondary)' }}>
              by {checkerName}
            </span>
          )}
          {!item.checked && claimerName && !claimedByMe && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px]"
              style={{ color: claimerColor ?? 'var(--color-text-secondary)' }}
            >
              <Loader2 size={9} className="animate-spin" />
              {claimerName} is on it
            </span>
          )}
          {!item.checked && claimedByMe && onClaimToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaimToggle() }}
              className="inline-flex items-center gap-0.5 text-[10px] font-medium"
              style={{ color: 'var(--color-btn-primary-bg)', background: 'none', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer' }}
            >
              <Loader2 size={9} className="animate-spin" />
              I'm on it ✕
            </button>
          )}
          {!item.checked && !claimerName && !claimedByMe && onClaimToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaimToggle() }}
              className="text-[10px] opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
              style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer' }}
            >
              I'm on it
            </button>
          )}
        </div>

        {/* Type-specific fields */}
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {isShopping && item.quantity && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              x{item.quantity} {item.quantity_unit ?? ''}
            </span>
          )}
          {isWishlist && item.resource_url && (
            <a
              href={item.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-0.5 hover:underline"
              style={{ color: 'var(--color-btn-primary-bg)' }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={10} /> Link
            </a>
          )}
          {(isWishlist || isExpense) && item.price != null && (
            <span className="text-xs font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
              ${item.price.toFixed(2)}
            </span>
          )}
          {item.promoted_to_task && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              <ArrowUpRight size={10} />
              Promoted
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs italic whitespace-pre-wrap mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {item.notes}
          </p>
        )}
      </div>

      {/* Victory flag + Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {showVictoryFlag && onToggleVictoryFlag && (
          <Tooltip content={item.victory_flagged ? 'Victory enabled' : 'Enable victory'}>
            <button onClick={onToggleVictoryFlag} className="p-1 rounded transition-colors" style={{ color: item.victory_flagged ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)', opacity: item.victory_flagged ? 1 : 0.4 }}>
              <Trophy size={12} />
            </button>
          </Tooltip>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isTodo && !item.promoted_to_task && (
            <button onClick={onPromote} className="p-1 rounded" title="Promote to task" style={{ color: 'var(--color-btn-primary-bg)' }}>
              <ArrowRight size={14} />
            </button>
          )}
          <button onClick={onDelete} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Build J: Randomizer Mastery Approval Inline ───────────────────
// Shows pending mastery submissions on a randomizer list so mom can
// approve/reject without leaving the list detail view. Sequential
// mastery approvals live in the global PendingApprovalsSection on
// Tasks.tsx; randomizer mastery approvals live here per-list.

interface RandomizerMasteryApprovalInlineProps {
  listId: string
  approverId: string
  familyMembers: { id: string; display_name: string }[]
}

function RandomizerMasteryApprovalInline({
  listId,
  approverId,
  familyMembers,
}: RandomizerMasteryApprovalInlineProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  const { data: pending = [] } = useRandomizerPendingMastery(listId)
  const approve = useApproveMasterySubmission()
  const reject = useRejectMasterySubmission()

  if (pending.length === 0) return null

  const memberName = (id: string | null | undefined) => {
    if (!id) return 'Unknown'
    return familyMembers.find(m => m.id === id)?.display_name ?? 'Unknown'
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '2px solid var(--color-warning, var(--color-btn-primary-bg))',
        backgroundColor: 'var(--color-bg-card)',
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-warning, var(--color-btn-primary-bg)) 10%, var(--color-bg-card))',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Clock size={16} style={{ color: 'var(--color-warning, var(--color-btn-primary-bg))' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Mastery Submissions ({pending.length})
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {pending.map((item) => {
          const submittedBy = memberName(item.mastery_approved_by ?? item.checked_by ?? null)
          const practiceCount = item.practice_count ?? 0
          const title = item.item_name ?? item.content
          return (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
                    {title}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Submitted for mastery · {practiceCount} practice{practiceCount === 1 ? '' : 's'} logged
                  {submittedBy !== 'Unknown' && ` by ${submittedBy}`}
                </p>
              </div>

              {rejectingId === item.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={e => setRejectionNote(e.target.value)}
                    placeholder="Reason (optional)"
                    className="px-2 py-1 rounded text-xs w-36"
                    style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      await reject.mutateAsync({
                        sourceType: 'randomizer_item',
                        sourceId: item.id,
                        rejectionNote: rejectionNote || null,
                      })
                      setRejectingId(null)
                      setRejectionNote('')
                    }}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
                    disabled={reject.isPending}
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectionNote('') }}
                    className="text-xs px-2 py-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Tooltip content="Approve mastery">
                    <button
                      onClick={async () => {
                        await approve.mutateAsync({
                          sourceType: 'randomizer_item',
                          sourceId: item.id,
                          approverId,
                        })
                      }}
                      disabled={approve.isPending}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--color-success, #22c55e)', color: '#fff' }}
                    >
                      <Check size={14} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Reject (child keeps practicing)">
                    <button
                      onClick={() => setRejectingId(item.id)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--color-text-error, #ef4444)', color: '#fff' }}
                    >
                      <X size={14} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
