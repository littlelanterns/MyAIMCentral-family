import { useState } from 'react'
import { ArrowLeft, Wand2, Loader2, CheckCircle2, XCircle, SkipForward } from 'lucide-react'
import { RoutingStrip } from '@/components/shared/RoutingStrip'
import {
  useExtractContent,
  useRouteExtractedItem,
  useExtractedItems,
  type NotepadTab,
  type NotepadExtractedItem,
} from '@/hooks/useNotepad'
import { ROUTING_DESTINATIONS } from '@/hooks/useNotepad'

interface NotepadReviewRouteProps {
  tab: NotepadTab
  familyId: string
  onBack: () => void
  onAllRouted: () => void
}

export function NotepadReviewRoute({ tab, familyId, onBack, onAllRouted }: NotepadReviewRouteProps) {
  const extractMutation = useExtractContent()
  const routeItemMutation = useRouteExtractedItem()
  const { data: items = [], isLoading: itemsLoading } = useExtractedItems(tab.id)
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
    await routeItemMutation.mutateAsync({
      id: item.id,
      status: 'routed',
      actual_destination: destination,
    })
    setRoutingItemId(null)

    // Check if all items are now routed/skipped
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
      await routeItemMutation.mutateAsync({
        id: item.id,
        status: 'routed',
        actual_destination: item.suggested_destination || item.routing_destination,
      })
    }
    onAllRouted()
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
          />
        ))}
      </div>

      {/* Bottom actions */}
      {pendingItems.length > 0 && (
        <div className="px-3 py-2 border-t shrink-0 space-y-1.5" style={{ borderColor: 'var(--color-border)' }}>
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
        </div>
      )}

      {pendingItems.length === 0 && (
        <div className="px-3 py-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
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
        </div>
      )}
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

// ─── Extracted Card ──────────────────────────────────────────

function ExtractedCard({ item, isShowingRoutes, onToggleRoutes, onRoute, onSkip }: {
  item: NotepadExtractedItem
  isShowingRoutes: boolean
  onToggleRoutes: () => void
  onRoute: (dest: string, sub?: string) => void
  onSkip: () => void
}) {
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
        <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          {Math.round(item.confidence * 100)}%
        </span>
      </div>

      {/* Content */}
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {item.extracted_content}
      </p>

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
      {!isDone && !isShowingRoutes && (
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
