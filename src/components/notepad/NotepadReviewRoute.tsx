import { useState } from 'react'
import { ArrowLeft, Wand2, Loader2, CheckCircle2, XCircle, SkipForward, Pencil, Save, StickyNote } from 'lucide-react'
import { RoutingStrip } from '@/components/shared/RoutingStrip'
import { useNotepadContext } from './NotepadContext'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  useExtractContent,
  useRouteExtractedItem,
  useExtractedItems,
  useCreateNotepadTab,
  useRouteContent,
  type NotepadTab,
  type NotepadExtractedItem,
  ROUTING_DESTINATIONS,
} from '@/hooks/useNotepad'

interface NotepadReviewRouteProps {
  tab: NotepadTab
  familyId: string
  onBack: () => void
  onAllRouted: () => void
}

export function NotepadReviewRoute({ tab, familyId, onBack, onAllRouted }: NotepadReviewRouteProps) {
  const extractMutation = useExtractContent()
  const routeItemMutation = useRouteExtractedItem()
  const routeContent = useRouteContent()
  const createTab = useCreateNotepadTab()
  const { data: items = [], isLoading: itemsLoading } = useExtractedItems(tab.id)
  const { setView, setActiveTabId } = useNotepadContext()
  const [hasExtracted, setHasExtracted] = useState(false)
  const [routingItemId, setRoutingItemId] = useState<string | null>(null)

  const pendingItems = items.filter(i => i.status === 'pending')
  const routedCount = items.filter(i => i.status === 'routed').length

  async function handleExtract() {
    if (!tab.content?.trim()) return
    await extractMutation.mutateAsync({
      tabId: tab.id,
      familyId,
      content: tab.content,
    })
    setHasExtracted(true)
  }

  async function handleRouteItem(item: NotepadExtractedItem, destination: string, _subType?: string) {
    let referenceId: string | undefined

    // Create actual records at the destination
    switch (destination) {
      case 'victory': {
        const { data, error } = await supabase
          .from('victories')
          .insert({
            family_id: familyId,
            family_member_id: tab.member_id,
            description: item.extracted_content,
            source: 'notepad_routed',
            source_reference_id: item.id,
            member_type: 'adult',
            importance: 'standard',
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
      case 'journal':
      case 'quick_note': {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            family_id: familyId,
            member_id: tab.member_id,
            entry_type: destination === 'quick_note' ? 'quick_note' : (_subType || 'journal_entry'),
            content: item.extracted_content,
            visibility: 'private',
            tags: [],
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
      case 'guiding_stars': {
        const { data, error } = await supabase
          .from('guiding_stars')
          .insert({
            family_id: familyId,
            member_id: tab.member_id,
            content: item.extracted_content,
            source: 'manual',
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
      case 'best_intentions': {
        const { data, error } = await supabase
          .from('best_intentions')
          .insert({
            family_id: familyId,
            member_id: tab.member_id,
            statement: item.extracted_content,
            source: 'manual',
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
      case 'innerworkings': {
        const { data, error } = await supabase
          .from('self_knowledge')
          .insert({
            family_id: familyId,
            member_id: tab.member_id,
            category: _subType || 'general',
            content: item.extracted_content,
            source_type: 'manual',
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
      default: {
        // Tasks, lists, calendar, track, agenda, message, optimizer — deposit to studio_queue
        const { data, error } = await supabase
          .from('studio_queue')
          .insert({
            family_id: familyId,
            owner_id: tab.member_id,
            destination: destination === 'tasks' ? 'task' : destination,
            content: item.extracted_content,
            source: 'review_route',
            source_reference_id: item.id,
            structure_flag: _subType || null,
          })
          .select('id')
          .single()
        if (!error && data) referenceId = data.id
        break
      }
    }

    await routeItemMutation.mutateAsync({
      id: item.id,
      status: 'routed',
      actual_destination: destination,
      routed_reference_id: referenceId,
    })
    setRoutingItemId(null)

    const remainingPending = pendingItems.filter(i => i.id !== item.id)
    if (remainingPending.length === 0) {
      onAllRouted()
    }
  }

  async function handleSkipItem(item: NotepadExtractedItem) {
    await routeItemMutation.mutateAsync({
      id: item.id,
      status: 'skipped',
    })
  }

  async function handleRouteAll() {
    for (const item of pendingItems) {
      const dest = item.suggested_destination || item.routing_destination
      await handleRouteItem(item, dest)
    }
    onAllRouted()
  }

  // Issue #5: Edit in Notepad — creates new tab with item content
  function handleEditInNotepad(item: NotepadExtractedItem) {
    createTab.mutate({
      family_id: familyId,
      member_id: tab.member_id,
      title: 'Editing from Review',
      content: item.extracted_content,
    }, {
      onSuccess: (newTab) => {
        setActiveTabId(newTab.id)
        setView('editor')
      },
    })
  }

  // Issue #6: Save Only — saves content as journal_entry without routing extracted items
  function handleSaveOnly() {
    routeContent.mutate({
      tab,
      destination: 'journal' as any,
      subType: 'journal_entry',
      familyId,
    }, {
      onSuccess: () => onAllRouted(),
    })
  }

  // ─── Pre-extraction state ──────────────────────────────────
  if (!hasExtracted && items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <Wand2 size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            LiLa will analyze your content and extract individual items for routing to different destinations.
          </p>
          <button
            onClick={handleExtract}
            disabled={extractMutation.isPending || !(tab.content?.trim())}
            className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {extractMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              'Extract Items'
            )}
          </button>
          {extractMutation.isError && (
            <p className="text-xs" style={{ color: 'var(--color-error, #e53e3e)' }}>
              Extraction failed. Try again?
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Loading state ─────────────────────────────────────────
  if (extractMutation.isPending || itemsLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Analyzing content...
          </p>
        </div>
      </div>
    )
  }

  // ─── Empty extraction ──────────────────────────────────────
  if (hasExtracted && items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <Header onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            No discrete items found to extract. Try using "Send to..." to route the full content.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              minHeight: 'unset',
            }}
          >
            Back to Notepad
          </button>
        </div>
      </div>
    )
  }

  // ─── Review cards ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <Header onBack={onBack} />

      <div className="px-3 py-2 text-xs flex items-center justify-between" style={{ color: 'var(--color-text-secondary)' }}>
        <span>LiLa found {items.length} items</span>
        {routedCount > 0 && <span>{routedCount} routed</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
        {items.map(item => (
          <ExtractedCard
            key={item.id}
            item={item}
            isShowingRoutes={routingItemId === item.id}
            onToggleRoutes={() => setRoutingItemId(routingItemId === item.id ? null : item.id)}
            onRoute={(dest, sub) => handleRouteItem(item, dest, sub)}
            onSkip={() => handleSkipItem(item)}
            onEditInNotepad={() => handleEditInNotepad(item)}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-2 border-t shrink-0 space-y-1.5" style={{ borderColor: 'var(--color-border)' }}>
        {pendingItems.length > 0 && (
          <button
            onClick={handleRouteAll}
            disabled={routeItemMutation.isPending}
            className="btn-primary w-full py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Route All {pendingItems.length} Pending
          </button>
        )}

        {pendingItems.length === 0 && (
          <button
            onClick={onAllRouted}
            className="btn-primary w-full py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done
          </button>
        )}

        {/* Issue #6: Save Only button */}
        <button
          onClick={handleSaveOnly}
          disabled={routeContent.isPending}
          className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            minHeight: 'unset',
          }}
        >
          <Save size={12} />
          Save Only (no routing)
        </button>
      </div>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        onClick={onBack}
        className="p-1"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      >
        <ArrowLeft size={16} />
      </button>
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
        Review &amp; Route
      </span>
    </div>
  )
}

// ─── Extracted Card (with inline editing — Issue #4) ─────────

function ExtractedCard({ item, isShowingRoutes, onToggleRoutes, onRoute, onSkip, onEditInNotepad }: {
  item: NotepadExtractedItem
  isShowingRoutes: boolean
  onToggleRoutes: () => void
  onRoute: (dest: string, sub?: string) => void
  onSkip: () => void
  onEditInNotepad: () => void
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.extracted_content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const isRouted = item.status === 'routed'
  const isSkipped = item.status === 'skipped'
  const isDone = isRouted || isSkipped

  const suggestedDest = item.suggested_destination || item.routing_destination
  const destInfo = ROUTING_DESTINATIONS.find(d => d.key === suggestedDest)
  const actualDest = item.actual_destination
    ? ROUTING_DESTINATIONS.find(d => d.key === item.actual_destination)
    : null

  const typeLabels: Record<string, string> = {
    action_item: 'Task',
    reflection: 'Reflection',
    revelation: 'Insight',
    value: 'Value',
    victory: 'Victory',
    trackable: 'Trackable',
    meeting_followup: 'Follow-up',
    list_item: 'List item',
    general: 'Note',
  }

  async function handleSaveEdit() {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === item.extracted_content) {
      setIsEditing(false)
      return
    }

    // Optimistic: update local ref immediately so routing uses the new text
    item.extracted_content = trimmed
    setIsEditing(false)

    // Persist to DB
    setIsSavingEdit(true)
    try {
      const { error } = await supabase
        .from('notepad_extracted_items')
        .update({ extracted_content: trimmed })
        .eq('id', item.id)
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['extracted-items', item.tab_id] })
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: isDone ? 'var(--color-bg-secondary)' : 'var(--color-bg-card, #fff)',
        border: isDone ? 'none' : '1px solid var(--color-border)',
        opacity: isDone ? 0.7 : 1,
      }}
    >
      {/* Header: type badge + confidence */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {typeLabels[item.item_type] || 'Note'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            {Math.round(item.confidence * 100)}%
          </span>
          {/* Edit in Notepad button (Issue #5) */}
          {!isDone && (
            <button
              onClick={onEditInNotepad}
              className="p-0.5 rounded"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              title="Edit in Notepad"
            >
              <StickyNote size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Content — inline editable (Issue #4) */}
      {isEditing ? (
        <div className="mb-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2 text-sm rounded resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-focus, var(--color-btn-primary-bg))',
              outline: 'none',
            }}
            rows={3}
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="px-2 py-1 rounded text-[10px] font-medium disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              {isSavingEdit ? '...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditText(item.extracted_content); setIsEditing(false) }}
              className="px-2 py-1 rounded text-[10px]"
              style={{
                color: 'var(--color-text-secondary)',
                background: 'transparent',
                minHeight: 'unset',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm mb-2 cursor-pointer hover:opacity-80"
          style={{ color: 'var(--color-text-primary)' }}
          onClick={() => !isDone && setIsEditing(true)}
          title={isDone ? undefined : 'Click to edit'}
        >
          {editText}
          {!isDone && (
            <Pencil
              size={10}
              className="inline ml-1 opacity-40"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          )}
        </p>
      )}

      {/* Status badges for done items */}
      {isRouted && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-btn-primary-bg)' }}>
          <CheckCircle2 size={12} />
          <span>Routed to {actualDest?.label || destInfo?.label || suggestedDest}</span>
        </div>
      )}
      {isSkipped && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <XCircle size={12} />
          <span>Skipped</span>
        </div>
      )}

      {/* Actions for pending items */}
      {!isDone && !isShowingRoutes && !isEditing && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRoute(suggestedDest)}
            className="btn-primary flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
              minHeight: 'unset',
            }}
          >
            {destInfo?.label || suggestedDest}
          </button>
          <button
            onClick={onToggleRoutes}
            className="px-2 py-1.5 rounded text-xs"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              minHeight: 'unset',
            }}
          >
            Change
          </button>
          <button
            onClick={onSkip}
            className="p-1.5 rounded"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              minHeight: 'unset',
            }}
            title="Skip"
          >
            <SkipForward size={14} />
          </button>
        </div>
      )}

      {/* Inline routing grid */}
      {!isDone && isShowingRoutes && (
        <RoutingStrip
          context="review_route_card"
          onRoute={onRoute}
          onCancel={onToggleRoutes}
        />
      )}
    </div>
  )
}
