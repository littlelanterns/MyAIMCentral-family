/**
 * BatchCard (PRD-17 Screen 3)
 *
 * Grouped card for multiple studio_queue items sharing a batch_id.
 * Actions: Send as group, Process all (sequential), Expand, Dismiss.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { Layers, CheckSquare } from 'lucide-react'
import { Button } from '@/components/shared'
import type { StudioQueueRecord } from './QueueCard'

interface BatchCardProps {
  items: StudioQueueRecord[]
  /** Called with batch mode 'group' — opens Task Creation Modal with batch settings */
  onSendAsGroup: (items: StudioQueueRecord[]) => void
  /** Called with batch mode 'sequential' — steps through each item one at a time */
  onProcessAll: (items: StudioQueueRecord[]) => void
  /** Expands the batch into individual cards */
  onExpand: (batchId: string) => void
  onDismissAll: (items: StudioQueueRecord[]) => void
}

function getSourceLabel(source: string | null): string {
  if (!source) return 'Queue'
  const MAP: Record<string, string> = {
    notepad_routed: 'Brain dump',
    review_route: 'Review & Route',
    lila_conversation: 'LiLa conversation',
    meeting_action: 'Meeting',
    goal_decomposition: 'Goal breakdown',
  }
  return MAP[source] ?? source
}

export function BatchCard({ items, onSendAsGroup, onProcessAll, onExpand, onDismissAll }: BatchCardProps) {
  if (items.length === 0) return null

  const batchId = items[0].batch_id ?? items[0].id
  const source = getSourceLabel(items[0].source)
  const destLabel = items[0].destination ?? 'task'

  // Show first 3 content previews
  const previews = items.slice(0, 3).map((i) => i.content)
  const remaining = items.length - 3

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '0.75rem' }} className="space-y-2.5">
        {/* Batch header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.625rem',
                borderRadius: '9999px',
                fontSize: 'var(--font-size-xs, 0.75rem)',
                fontWeight: 600,
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              <CheckSquare size={11} />
              {destLabel.charAt(0).toUpperCase() + destLabel.slice(1)}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: 'var(--font-size-xs, 0.75rem)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <Layers size={10} />
              {items.length} grouped
            </span>
          </div>
          <span
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-secondary)',
            }}
          >
            From: {source}
          </span>
        </div>

        {/* Content previews */}
        <div className="space-y-0.5">
          {previews.map((text, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 'var(--font-size-sm, 0.875rem)',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.375rem',
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '0.1rem' }}>·</span>
              <span>{text}</span>
            </div>
          ))}
          {remaining > 0 && (
            <div
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                color: 'var(--color-text-secondary)',
                paddingLeft: '1rem',
              }}
            >
              +{remaining} more
            </div>
          )}
        </div>

        {/* Batch actions */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSendAsGroup(items)}
          >
            Send as group
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onProcessAll(items)}
          >
            Process all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpand(batchId)}
          >
            Expand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismissAll(items)}
          >
            Dismiss all
          </Button>
        </div>
      </div>
    </div>
  )
}
