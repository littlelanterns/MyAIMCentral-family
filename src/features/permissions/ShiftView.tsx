/**
 * ShiftView — PRD-02 Screen 6
 *
 * Shown to special_adult role members. Lets them start/end shifts and view
 * recent activity logged during the active shift.
 *
 * Three render modes:
 *  1. always_on  — co-parent; skip shift controls, show "Always On" badge + activity.
 *  2. on shift   — active time_session with source_type='shift'; show timer + activity.
 *  3. off shift  — no active session; show next-window info + Start Shift button.
 *
 * Shift tracking uses time_sessions with:
 *   timer_mode       = 'clock'
 *   source_type      = 'shift'
 *   is_standalone    = true
 *   standalone_label = 'Shift'
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CircleDot,
  Clock,
  CalendarClock,
  CheckCircle2,
  StickyNote,
  ListChecks,
  Loader2,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useAccessSchedules, getNextOccurrence } from '@/lib/scheduling'
import { FeatureGuide } from '@/components/shared'
import type { ScheduleWindow } from '@/lib/scheduling'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShiftSession {
  id: string
  family_id: string
  family_member_id: string
  started_at: string
  ended_at: string | null
  source_type: string | null
}

interface ActivityEntry {
  id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ShiftViewProps {
  /** Defaults to the authenticated member when omitted. */
  memberId?: string
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const shiftKeys = {
  activeShift: (memberId: string) => ['shift-active', memberId] as const,
  recentActivity: (memberId: string, shiftStart: string) =>
    ['shift-activity', memberId, shiftStart] as const,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format elapsed seconds as "Xh Ym", "Ym", or "Xs". */
function formatElapsed(seconds: number): string {
  if (seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** Format an ISO timestamp to "3:00 PM". */
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** Format a ScheduleWindow start into a friendly string. */
function fmtNextWindow(window: ScheduleWindow): string {
  const now = new Date()
  const start = window.start

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const timePart = fmtTime(start.toISOString())
  if (isSameDay(start, now)) return `Today at ${timePart}`
  if (isSameDay(start, tomorrow)) return `Tomorrow at ${timePart}`
  return (
    start.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) +
    ` at ${timePart}`
  )
}

/** Human-readable label for an activity_log_entries event_type. */
function labelForEvent(
  eventType: string,
  metadata: Record<string, unknown> | null,
): string {
  switch (eventType) {
    case 'task_completed':
      return `Completed task${metadata?.title ? `: ${String(metadata.title)}` : ''}`
    case 'task_created':
      return `Added task${metadata?.title ? `: ${String(metadata.title)}` : ''}`
    case 'journal_created':
      return 'Added a journal entry'
    case 'note_created':
    case 'notepad_created':
      return 'Added a note'
    case 'victory_recorded':
      return 'Recorded a victory'
    case 'list_item_checked':
      return `Checked off${metadata?.content ? `: ${String(metadata.content)}` : ' a list item'}`
    case 'trackable_event_logged':
      return `Logged event${metadata?.category ? `: ${String(metadata.category)}` : ''}`
    case 'routine_step_completed':
      return `Completed routine step${metadata?.title ? `: ${String(metadata.title)}` : ''}`
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

// ---------------------------------------------------------------------------
// Live elapsed tick hook
// ---------------------------------------------------------------------------

/** Returns seconds elapsed since startedAt, updated every second. */
function useElapsedSeconds(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState<number>(() =>
    startedAt ? (Date.now() - new Date(startedAt).getTime()) / 1000 : 0,
  )

  const startedAtRef = useRef(startedAt)
  useEffect(() => {
    startedAtRef.current = startedAt
  }, [startedAt])

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }
    const tick = () => {
      if (startedAtRef.current) {
        setElapsed((Date.now() - new Date(startedAtRef.current).getTime()) / 1000)
      }
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [startedAt])

  return elapsed
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AlwaysOnBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: 'var(--color-success-soft, #d1fae5)',
        color: 'var(--color-success, #059669)',
      }}
    >
      <BadgeCheck size={13} />
      Always On
    </span>
  )
}

// ── Icon for an activity event type ──────────────────────────────────────────

function ActivityIcon({ eventType }: { eventType: string }) {
  const style: React.CSSProperties = {
    color: 'var(--color-text-muted, #6b7280)',
    flexShrink: 0,
  }
  if (eventType.includes('task') || eventType.includes('routine')) {
    return <ListChecks size={13} style={style} />
  }
  if (eventType.includes('note') || eventType.includes('journal')) {
    return <StickyNote size={13} style={style} />
  }
  if (eventType.includes('victory')) {
    return <CheckCircle2 size={13} style={style} />
  }
  return <CircleDot size={13} style={style} />
}

// ── Active shift card ─────────────────────────────────────────────────────────

function ActiveShiftCard({
  shiftSession,
  onEnd,
  isEnding,
}: {
  shiftSession: ShiftSession
  onEnd: () => void
  isEnding: boolean
}) {
  const elapsed = useElapsedSeconds(shiftSession.started_at)

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface, #fff)',
        border: '2px solid var(--color-success, #059669)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Pulsing green dot */}
          <span className="relative flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: 'var(--color-success, #059669)' }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: 'var(--color-success, #059669)' }}
            />
          </span>
          <span
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-primary, #111827)' }}
          >
            On Shift
          </span>
        </div>

        {/* Live duration */}
        <div className="text-right">
          <p
            className="text-lg font-bold tabular-nums"
            style={{ color: 'var(--color-text-primary, #111827)' }}
          >
            {formatElapsed(elapsed)}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Started {fmtTime(shiftSession.started_at)}
          </p>
        </div>
      </div>

      {/* End Shift button */}
      <button
        onClick={onEnd}
        disabled={isEnding}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: 'var(--color-error-soft, #fee2e2)',
          color: 'var(--color-error, #dc2626)',
          opacity: isEnding ? 0.6 : 1,
        }}
      >
        {isEnding ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
        {isEnding ? 'Ending shift…' : 'End Shift'}
      </button>
    </div>
  )
}

// ── Off-shift waiting card ────────────────────────────────────────────────────

function OffShiftCard({
  nextWindow,
  hasSchedules,
  onStart,
  isStarting,
}: {
  nextWindow: ScheduleWindow | null
  hasSchedules: boolean
  onStart: () => void
  isStarting: boolean
}) {
  return (
    <div
      className="rounded-xl p-6 text-center space-y-4"
      style={{
        backgroundColor: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Icon */}
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
      >
        <Clock size={26} style={{ color: 'var(--color-text-muted, #6b7280)' }} />
      </div>

      {/* Headline */}
      <div className="space-y-1.5">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          Not On Shift
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary, #374151)' }}>
          You'll have access to family features during your scheduled shifts.
        </p>
      </div>

      {/* Next shift info — only when schedules exist */}
      {hasSchedules && nextWindow && (
        <div
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5"
          style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
        >
          <CalendarClock size={15} style={{ color: 'var(--color-text-muted, #6b7280)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary, #374151)' }}>
            Next shift:{' '}
            <span className="font-medium">{fmtNextWindow(nextWindow)}</span>
          </span>
        </div>
      )}

      {/* Start Shift button */}
      <button
        onClick={onStart}
        disabled={isStarting}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: 'var(--color-btn-primary-bg, #68a395)',
          color: 'var(--color-btn-primary-text, #fff)',
          opacity: isStarting ? 0.6 : 1,
        }}
      >
        {isStarting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CircleDot size={16} />
        )}
        {isStarting ? 'Starting shift…' : 'Start Shift'}
      </button>
    </div>
  )
}

// ── Activity log panel ────────────────────────────────────────────────────────

function ShiftActivity({
  memberId,
  shiftStartedAt,
}: {
  memberId: string
  /** ISO string — activity is filtered to >= this timestamp. Null = no filter (always-on). */
  shiftStartedAt: string | null
}) {
  const { data: entries, isLoading, error } = useQuery({
    queryKey: shiftKeys.recentActivity(memberId, shiftStartedAt ?? 'all'),
    queryFn: async (): Promise<ActivityEntry[]> => {
      let query = supabase
        .from('activity_log_entries')
        .select('id, event_type, created_at, metadata')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (shiftStartedAt) {
        query = query.gte('created_at', shiftStartedAt)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ActivityEntry[]
    },
    enabled: !!memberId,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <Loader2
          size={20}
          className="mx-auto animate-spin"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
        style={{
          backgroundColor: 'var(--color-error-soft, #fee2e2)',
          color: 'var(--color-error, #dc2626)',
        }}
      >
        <AlertCircle size={14} />
        Could not load activity log
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm py-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
        No activity logged yet during this shift.
      </p>
    )
  }

  return (
    <ul className="space-y-2.5">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start gap-2.5">
          <span className="mt-0.5">
            <ActivityIcon eventType={entry.event_type} />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm leading-snug"
              style={{ color: 'var(--color-text-primary, #111827)' }}
            >
              {labelForEvent(entry.event_type, entry.metadata)}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-muted, #6b7280)' }}
            >
              {fmtTime(entry.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Activity section wrapper (shared between always-on and on-shift views)
// ---------------------------------------------------------------------------

function ActivitySection({
  memberId,
  shiftStartedAt,
  label,
}: {
  memberId: string
  shiftStartedAt: string | null
  label: string
}) {
  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h2
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted, #6b7280)' }}
      >
        {label}
      </h2>
      <ShiftActivity memberId={memberId} shiftStartedAt={shiftStartedAt} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ShiftView({ memberId: memberIdProp }: ShiftViewProps) {
  const { data: currentMember } = useFamilyMember()
  const queryClient = useQueryClient()

  const targetMemberId = memberIdProp ?? currentMember?.id
  const familyId = currentMember?.family_id

  // ------ Access schedules -------------------------------------------------

  const { data: schedules, isLoading: schedulesLoading } = useAccessSchedules(targetMemberId)

  const isAlwaysOn =
    schedules?.some((s) => s.schedule_type === 'always_on' && s.is_active) ?? false

  const hasSchedules = (schedules?.length ?? 0) > 0

  const nextWindow: ScheduleWindow | null =
    !isAlwaysOn && schedules ? getNextOccurrence(schedules, new Date()) : null

  // ------ Active shift query -----------------------------------------------

  const { data: activeShift, isLoading: shiftLoading } = useQuery({
    queryKey: shiftKeys.activeShift(targetMemberId ?? ''),
    queryFn: async (): Promise<ShiftSession | null> => {
      if (!targetMemberId) return null

      const { data, error } = await supabase
        .from('time_sessions')
        .select('id, family_id, family_member_id, started_at, ended_at, source_type')
        .eq('family_member_id', targetMemberId)
        .eq('source_type', 'shift')
        .is('ended_at', null)
        .is('deleted_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return (data ?? null) as ShiftSession | null
    },
    enabled: !!targetMemberId,
    refetchInterval: 10_000,
  })

  // ------ Start shift mutation ---------------------------------------------

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!targetMemberId || !familyId) throw new Error('No member or family')

      const { data, error } = await supabase
        .from('time_sessions')
        .insert({
          family_id: familyId,
          family_member_id: targetMemberId,
          started_by: targetMemberId,
          timer_mode: 'clock',
          source_type: 'shift',
          is_standalone: true,
          standalone_label: 'Shift',
          started_at: new Date().toISOString(),
          ended_at: null,
          task_id: null,
          widget_id: null,
          list_item_id: null,
          source_reference_id: null,
          pomodoro_config: null,
          countdown_target_minutes: null,
          auto_paused: false,
          edited: false,
          edited_by: null,
          edited_at: null,
          original_timestamps: null,
          edit_reason: null,
          deleted_at: null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shiftKeys.activeShift(targetMemberId ?? ''),
      })
    },
  })

  // ------ End shift mutation -----------------------------------------------

  const endMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from('time_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', shiftId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: shiftKeys.activeShift(targetMemberId ?? ''),
      })
      if (activeShift) {
        queryClient.invalidateQueries({
          queryKey: shiftKeys.recentActivity(
            targetMemberId ?? '',
            activeShift.started_at,
          ),
        })
      }
    },
  })

  // ------ Handlers ---------------------------------------------------------

  const handleStart = useCallback(() => {
    startMutation.mutate()
  }, [startMutation])

  const handleEnd = useCallback(() => {
    if (activeShift) endMutation.mutate(activeShift.id)
  }, [activeShift, endMutation])

  // ------ Loading ----------------------------------------------------------

  if (schedulesLoading || shiftLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        />
      </div>
    )
  }

  // ------ Render -----------------------------------------------------------

  return (
    <div className="space-y-6 max-w-lg">
      {/* Feature guide */}
      <FeatureGuide featureKey="shift_view" />

      {/* Error banners */}
      {startMutation.isError && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-error-soft, #fee2e2)',
            color: 'var(--color-error, #dc2626)',
          }}
        >
          <AlertCircle size={15} />
          Could not start shift. Please try again.
        </div>
      )}
      {endMutation.isError && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'var(--color-error-soft, #fee2e2)',
            color: 'var(--color-error, #dc2626)',
          }}
        >
          <AlertCircle size={15} />
          Could not end shift. Please try again.
        </div>
      )}

      {/* ── Mode 1: Always On (co-parent) ── */}
      {isAlwaysOn ? (
        <>
          <div
            className="flex items-center gap-3 rounded-xl p-5"
            style={{
              backgroundColor: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-success-soft, #d1fae5)' }}
            >
              <BadgeCheck size={22} style={{ color: 'var(--color-success, #059669)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary, #111827)' }}
                >
                  Full Access
                </span>
                <AlwaysOnBadge />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
                You have continuous access — no shift tracking needed.
              </p>
            </div>
          </div>

          {targetMemberId && (
            <ActivitySection
              memberId={targetMemberId}
              shiftStartedAt={null}
              label="Recent Activity"
            />
          )}
        </>
      ) : activeShift ? (
        /* ── Mode 2: On Shift ── */
        <>
          <ActiveShiftCard
            shiftSession={activeShift}
            onEnd={handleEnd}
            isEnding={endMutation.isPending}
          />

          {targetMemberId && (
            <ActivitySection
              memberId={targetMemberId}
              shiftStartedAt={activeShift.started_at}
              label="This Shift's Activity"
            />
          )}
        </>
      ) : (
        /* ── Mode 3: Not On Shift ── */
        <OffShiftCard
          nextWindow={nextWindow}
          hasSchedules={hasSchedules}
          onStart={handleStart}
          isStarting={startMutation.isPending}
        />
      )}
    </div>
  )
}

export default ShiftView
