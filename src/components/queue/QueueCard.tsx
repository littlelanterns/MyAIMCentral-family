/**
 * QueueCard (PRD-17 Screen 3)
 *
 * Individual studio_queue item card in the Sort tab.
 * Destination badge (task/list/widget/tracker), source indicator,
 * content, requester note.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { CheckSquare, List, LayoutGrid, BarChart3, Calendar as CalendarIcon } from 'lucide-react'
import { Button, Avatar } from '@/components/shared'
import type { FamilyMember } from '@/hooks/useFamilyMember'

export interface StudioQueueRecord {
  id: string
  family_id: string
  owner_id: string
  destination: string | null
  content: string
  content_details: Record<string, unknown> | null
  source: string | null
  source_reference_id: string | null
  requester_id: string | null
  requester_note: string | null
  batch_id: string | null
  mindsweep_confidence: 'high' | 'medium' | 'low' | null
  mindsweep_event_id: string | null
  created_at: string
}

// DestType: 'task' | 'list' | 'widget' | 'tracker' | string (reserved for future typed routing)

interface DestConfig {
  icon: typeof CheckSquare
  label: string
  bgColor: string
  textColor: string
}

const DEST_CONFIGS: Record<string, DestConfig> = {
  task: {
    icon: CheckSquare,
    label: 'Task',
    bgColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))',
    textColor: 'var(--color-btn-primary-bg)',
  },
  list: {
    icon: List,
    label: 'List',
    bgColor: 'color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-card))',
    textColor: 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text-heading))',
  },
  widget: {
    icon: LayoutGrid,
    label: 'Widget',
    bgColor: 'color-mix(in srgb, var(--color-btn-primary-hover, var(--color-accent)) 15%, var(--color-bg-card))',
    textColor: 'var(--color-btn-primary-hover, var(--color-accent))',
  },
  tracker: {
    icon: BarChart3,
    label: 'Tracker',
    bgColor: 'color-mix(in srgb, var(--color-text-secondary) 15%, var(--color-bg-card))',
    textColor: 'var(--color-text-secondary)',
  },
  calendar: {
    icon: CalendarIcon,
    label: 'Calendar',
    bgColor: 'color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-card))',
    textColor: 'var(--color-accent)',
  },
}

function CalendarSubtypeBadge({ details }: { details: Record<string, unknown> }) {
  const subtype = String(details.calendar_subtype ?? '')
  const events = Array.isArray(details.events) ? details.events : []
  const days = Array.isArray(details.recurrence_days) ? (details.recurrence_days as string[]) : []

  let label = ''
  if (subtype === 'options') {
    label = `${events.length || '?'} dates to choose from`
  } else if (subtype === 'multi_day') {
    const start = formatDateShort(String(details.start_date ?? ''))
    const end = formatDateShort(String(details.end_date ?? ''))
    label = start && end ? `${start} through ${end}` : 'Multi-day event'
  } else if (subtype === 'recurring') {
    const capitalDays = days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3))
    label = capitalDays.length > 0 ? `Repeats on ${capitalDays.join(', ')}` : 'Recurring event'
  } else if (subtype === 'series') {
    label = `${events.length || '?'} events in this series`
  } else if (subtype === 'single' && details.event_title) {
    label = String(details.event_title)
  }

  if (!label) return null

  return (
    <div
      style={{
        fontSize: 'var(--font-size-xs, 0.75rem)',
        color: 'var(--color-btn-primary-bg)',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <CalendarIcon size={14} />
      <span>{label}</span>
    </div>
  )
}

/** Format YYYY-MM-DD to short readable form (e.g. "May 14") */
function formatDateShort(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calendarButtonLabel(item: StudioQueueRecord): string {
  const subtype = String((item.content_details as Record<string, unknown>)?.calendar_subtype ?? 'single')
  switch (subtype) {
    case 'options': return 'Add dates to pick from'
    case 'series': return 'Add all events'
    default: return 'Add to calendar'
  }
}

function getDestConfig(destination: string | null): DestConfig {
  const key = destination?.toLowerCase() ?? 'task'
  return DEST_CONFIGS[key] ?? DEST_CONFIGS['task']
}

function getSourceLabel(source: string | null): string | null {
  if (!source) return null
  const MAP: Record<string, string> = {
    notepad_routed: 'From: Notepad',
    review_route: 'From: Review & Route',
    lila_conversation: 'From: LiLa conversation',
    goal_decomposition: 'From: Goal breakdown',
    manual: 'Added manually',
    mindsweep_auto: 'MindSweep auto-sorted',
    mindsweep_queued: 'MindSweep for review',
    email_forward: 'From: Email',
    share_to_app: 'From: Share',
  }
  if (source.startsWith('meeting_')) return 'From: Meeting'
  return MAP[source] ?? `From: ${source}`
}

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: {
    bg: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
    text: 'var(--color-btn-primary-bg)',
    label: 'High',
  },
  medium: {
    bg: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-card))',
    text: 'color-mix(in srgb, var(--color-accent) 80%, var(--color-text-heading))',
    label: 'Medium',
  },
  low: {
    bg: 'color-mix(in srgb, var(--color-text-secondary) 12%, var(--color-bg-card))',
    text: 'var(--color-text-secondary)',
    label: 'Low',
  },
}

interface QueueCardProps {
  item: StudioQueueRecord
  requesterMember?: FamilyMember
  onConfigure: (item: StudioQueueRecord) => void
  onDismiss: (item: StudioQueueRecord) => void
}

export function QueueCard({ item, requesterMember, onConfigure, onDismiss }: QueueCardProps) {
  const destConfig = getDestConfig(item.destination)
  const DestIcon = destConfig.icon
  const isRequest = item.source === 'member_request'
  const sourceLabel = isRequest ? null : getSourceLabel(item.source)

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '0.75rem' }} className="space-y-2">
        {/* Destination badge + source indicator row */}
        <div className="flex items-center justify-between flex-wrap gap-1.5">
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
                backgroundColor: destConfig.bgColor,
                color: destConfig.textColor,
              }}
            >
              <DestIcon size={11} />
              {destConfig.label}
            </span>
            {item.mindsweep_confidence && CONFIDENCE_STYLES[item.mindsweep_confidence] && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  backgroundColor: CONFIDENCE_STYLES[item.mindsweep_confidence].bg,
                  color: CONFIDENCE_STYLES[item.mindsweep_confidence].text,
                }}
              >
                {CONFIDENCE_STYLES[item.mindsweep_confidence].label}
              </span>
            )}
          </div>
          {sourceLabel && (
            <span
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {sourceLabel}
            </span>
          )}
        </div>

        {/* Request from member */}
        {isRequest && requesterMember && (
          <div className="flex items-center gap-1.5">
            <Avatar
              name={requesterMember.display_name}
              color={requesterMember.member_color ?? undefined}
              size="sm"
            />
            <span
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}
            >
              Request from {requesterMember.display_name}
            </span>
          </div>
        )}

        {/* Content */}
        <p
          style={{
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {item.content}
        </p>

        {/* Calendar subtype summary */}
        {item.destination === 'calendar' && item.content_details != null && typeof item.content_details.calendar_subtype === 'string' && (
          <CalendarSubtypeBadge details={item.content_details} />
        )}

        {/* Requester note */}
        {item.requester_note && (
          <p
            style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            "{item.requester_note}"
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfigure(item)}
          >
            {item.destination === 'list' ? 'Add to list' : item.destination === 'calendar' ? calendarButtonLabel(item) : 'Configure'}
          </Button>
          <Button
            variant={isRequest ? 'destructive' : 'ghost'}
            size="sm"
            onClick={() => onDismiss(item)}
          >
            {isRequest ? 'Decline' : 'Dismiss'}
          </Button>
        </div>
      </div>
    </div>
  )
}
