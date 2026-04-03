/**
 * SortTab (PRD-17 Screen 3)
 *
 * Shows studio_queue items where processed_at IS NULL and dismissed_at IS NULL.
 * Handles individual cards, batch cards, source ordering.
 * Opens TaskCreationModal pre-populated per source-adaptive table (PRD-17 Screen 8).
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { EmptyState, useRoutingToast } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { QueueCard } from './QueueCard'
import { BatchCard } from './BatchCard'
import { ListPickerModal } from './ListPickerModal'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { StudioQueueRecord } from './QueueCard'
import type { CreateTaskData, StudioQueueItem } from '@/components/tasks/TaskCreationModal'

// ─── Dismiss Modal ────────────────────────────────────────────

interface DismissConfirmProps {
  item: StudioQueueRecord | null
  onConfirm: (note: string) => void
  onCancel: () => void
}

function DismissConfirm({ item, onConfirm, onCancel }: DismissConfirmProps) {
  const [note, setNote] = useState('')
  if (!item) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={onCancel}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
        }}
        className="space-y-3"
      >
        <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-base, 1rem)', color: 'var(--color-text-heading)', margin: 0 }}>
          {item.source === 'member_request' ? 'Decline request' : 'Dismiss item'}
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-secondary)', margin: 0 }}>
          {item.content}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={item.source === 'member_request' ? 'Optional note to the requester…' : 'Optional reason…'}
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
          }}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              backgroundColor: 'var(--color-error, #b25a58)',
              color: 'var(--color-text-on-primary, #fff)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {item.source === 'member_request' ? 'Decline' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SortTab ─────────────────────────────────────────────────

export function SortTab() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()
  const routingToast = useRoutingToast()
  const { data: familyMembers = [] } = useFamilyMembers(currentMember?.family_id)

  // Studio queue query
  const { data: queueItems = [], isLoading } = useQuery({
    queryKey: ['studio-queue', currentMember?.family_id],
    queryFn: async () => {
      if (!currentMember?.family_id) return []
      const { data, error } = await supabase
        .from('studio_queue')
        .select('*')
        .eq('family_id', currentMember.family_id)
        .is('processed_at', null)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as StudioQueueRecord[]
    },
    enabled: !!currentMember?.family_id,
  })

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { error } = await supabase
        .from('studio_queue')
        .update({ dismissed_at: new Date().toISOString(), dismiss_note: note || null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
    },
  })

  // Mark processed mutation
  const processedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('studio_queue')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
    },
  })

  // Modal state
  const [configItem, setConfigItem] = useState<StudioQueueRecord | null>(null)
  const [batchMode, setBatchMode] = useState<'group' | 'sequential' | undefined>()
  const [batchItems, setBatchItems] = useState<StudioQueueRecord[]>([])
  const [dismissTarget, setDismissTarget] = useState<StudioQueueRecord | null>(null)
  // List picker state — opens when destination='list'
  const [listPickerItems, setListPickerItems] = useState<StudioQueueRecord[]>([])
  // Track which batch_ids have been expanded (rendered as individual cards)
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set())

  // Sort and group items per PRD-17 Screen 3 ordering rules
  const { individualItems, groupedBatches } = useMemo(() => {
    const memberRequests: StudioQueueRecord[] = []
    const meetingActions: StudioQueueRecord[] = []
    const others: StudioQueueRecord[] = []

    for (const item of queueItems) {
      if (item.source === 'member_request') memberRequests.push(item)
      else if (item.source === 'meeting_action') meetingActions.push(item)
      else others.push(item)
    }

    const sortedAll = [...memberRequests, ...meetingActions, ...others]

    // Group by batch_id (excluding expanded batches)
    const batches = new Map<string, StudioQueueRecord[]>()
    const individuals: StudioQueueRecord[] = []

    for (const item of sortedAll) {
      if (item.batch_id && !expandedBatchIds.has(item.batch_id)) {
        const group = batches.get(item.batch_id) ?? []
        group.push(item)
        batches.set(item.batch_id, group)
      } else {
        individuals.push(item)
      }
    }

    return { individualItems: individuals, groupedBatches: batches }
  }, [queueItems, expandedBatchIds])

  const memberById = useMemo(() => {
    const map = new Map(familyMembers.map((m) => [m.id, m]))
    return map
  }, [familyMembers])

  // Convert StudioQueueRecord to StudioQueueItem for TaskCreationModal
  const toQueueItem = (r: StudioQueueRecord): StudioQueueItem => ({
    id: r.id,
    family_id: r.family_id,
    owner_id: r.owner_id,
    destination: r.destination ?? undefined,
    content: r.content,
    content_details: r.content_details ?? undefined,
    source: r.source ?? undefined,
    source_reference_id: r.source_reference_id ?? undefined,
    requester_id: r.requester_id ?? undefined,
    requester_note: r.requester_note ?? undefined,
    batch_id: r.batch_id ?? undefined,
  })

  const handleConfigure = (item: StudioQueueRecord) => {
    if (item.destination === 'list') {
      setListPickerItems([item])
      return
    }
    setBatchMode(undefined)
    setBatchItems([])
    setConfigItem(item)
  }

  const handleSendAsGroup = (items: StudioQueueRecord[]) => {
    // If list destination, open list picker for all batch items
    if (items[0]?.destination === 'list') {
      setListPickerItems(items)
      return
    }
    setBatchMode('group')
    setBatchItems(items)
    setConfigItem(items[0])
  }

  const handleProcessAll = (items: StudioQueueRecord[]) => {
    // List items: add all to same list via picker
    if (items[0]?.destination === 'list') {
      setListPickerItems(items)
      return
    }
    setBatchMode('sequential')
    setBatchItems(items)
    setConfigItem(items[0])
  }

  const handleExpand = (batchId: string) => {
    setExpandedBatchIds((prev) => new Set([...prev, batchId]))
  }

  const handleDismissAll = (items: StudioQueueRecord[]) => {
    items.forEach((item) => {
      dismissMutation.mutate({ id: item.id, note: '' })
    })
  }

  const handleSaveTask = async (_taskData: CreateTaskData) => {
    // Mark the configured item(s) as processed
    const itemsToProcess = batchMode === 'group' && batchItems.length > 0
      ? batchItems
      : configItem ? [configItem] : []

    for (const item of itemsToProcess) {
      processedMutation.mutate(item.id)
    }

    // Show undo toast
    if (itemsToProcess.length > 0) {
      const label = itemsToProcess.length === 1
        ? `"${itemsToProcess[0].content.slice(0, 40)}${itemsToProcess[0].content.length > 40 ? '...' : ''}" created as task`
        : `${itemsToProcess.length} items created as tasks`

      routingToast.show({
        message: label,
        onUndo: () => {
          // Reverse: un-process items (set processed_at back to null)
          for (const item of itemsToProcess) {
            supabase
              .from('studio_queue')
              .update({ processed_at: null })
              .eq('id', item.id)
              .then(() => queryClient.invalidateQueries({ queryKey: ['studio-queue'] }))
          }
        },
      })
    }
  }

  const totalItems = queueItems.length

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
        Loading queue…
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <EmptyState
          icon={<Inbox size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
          title="Nothing to sort right now."
          description="Items from brain dumps, meetings, LiLa, and requests will appear here when they arrive."
        />
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '0.75rem' }} className="space-y-3">
        {/* Batch cards first */}
        {Array.from(groupedBatches.entries()).map(([batchId, items]) => (
          <BatchCard
            key={batchId}
            items={items}
            onSendAsGroup={handleSendAsGroup}
            onProcessAll={handleProcessAll}
            onExpand={handleExpand}
            onDismissAll={handleDismissAll}
          />
        ))}

        {/* Individual cards */}
        {individualItems.map((item) => (
          <QueueCard
            key={item.id}
            item={item}
            requesterMember={item.requester_id ? memberById.get(item.requester_id) : undefined}
            onConfigure={handleConfigure}
            onDismiss={(i) => setDismissTarget(i)}
          />
        ))}
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={!!configItem}
        onClose={() => {
          setConfigItem(null)
          setBatchMode(undefined)
          setBatchItems([])
        }}
        onSave={handleSaveTask}
        queueItem={configItem ? toQueueItem(configItem) : undefined}
        mode="quick"
        batchMode={batchMode}
        batchItems={batchItems.map(toQueueItem)}
      />

      {/* Dismiss confirmation */}
      <DismissConfirm
        item={dismissTarget}
        onConfirm={(note) => {
          if (dismissTarget) {
            dismissMutation.mutate({ id: dismissTarget.id, note })
            setDismissTarget(null)
          }
        }}
        onCancel={() => setDismissTarget(null)}
      />

      {/* List picker — opens when destination='list' */}
      <ListPickerModal
        isOpen={listPickerItems.length > 0}
        onClose={() => setListPickerItems([])}
        items={listPickerItems}
        onComplete={(_listId, listTitle) => {
          // Mark all list picker items as processed
          for (const item of listPickerItems) {
            processedMutation.mutate(item.id)
          }
          const label = listPickerItems.length === 1
            ? `Added to "${listTitle}"`
            : `${listPickerItems.length} items added to "${listTitle}"`
          routingToast.show({
            message: label,
            onUndo: () => {
              for (const item of listPickerItems) {
                supabase
                  .from('studio_queue')
                  .update({ processed_at: null })
                  .eq('id', item.id)
                  .then(() => queryClient.invalidateQueries({ queryKey: ['studio-queue'] }))
              }
            },
          })
          setListPickerItems([])
        }}
      />
    </>
  )
}
