/**
 * SessionHistory — PRD-36
 *
 * Displays completed (and running) timer sessions for a member, grouped by
 * date. Mom (primary_parent) gets inline editing and soft-delete controls
 * plus an "Add manual session" button. All other roles see read-only rows.
 *
 * Soft-deleted sessions (deleted_at IS NOT NULL) are excluded in the query.
 */

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  Timer,
  Hourglass,
  Play,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useTimerActions } from './useTimer'
import type { TimeSession, TimerMode, AddManualSessionOptions } from './types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SessionHistoryProps {
  /** When provided, only sessions linked to this task are shown. */
  taskId?: string
  /** Defaults to the authenticated member when omitted. */
  memberId?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a duration (in seconds) as "Xh Ym" or "Ym Zs". */
function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Format a timestamp to a short time string (e.g. "9:42 AM"). */
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** Return a group label for a given ISO date string relative to today. */
function groupLabel(iso: string): string {
  const sessionDate = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(sessionDate, today)) return 'Today'
  if (sameDay(sessionDate, yesterday)) return 'Yesterday'
  return sessionDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

/** Label for a timer mode. */
function modeLabel(mode: TimerMode): string {
  switch (mode) {
    case 'clock': return 'Clock'
    case 'pomodoro_focus': return 'Focus'
    case 'pomodoro_break': return 'Break'
    case 'stopwatch': return 'Stopwatch'
    case 'countdown': return 'Countdown'
  }
}

/** Icon for a timer mode. */
function ModeIcon({ mode, size = 16 }: { mode: TimerMode; size?: number }) {
  const style: React.CSSProperties = { color: 'var(--color-text-muted, #6b7280)' }
  switch (mode) {
    case 'clock': return <Clock size={size} style={style} />
    case 'pomodoro_focus': return <Play size={size} style={style} />
    case 'pomodoro_break': return <ChevronDown size={size} style={style} />
    case 'stopwatch': return <Timer size={size} style={style} />
    case 'countdown': return <Hourglass size={size} style={style} />
  }
}

/** Convert a datetime-local input value to an ISO timestamp string. */
function localToISO(localValue: string): string {
  if (!localValue) return ''
  return new Date(localValue).toISOString()
}

/** Convert an ISO string to a value compatible with datetime-local input. */
function isoToLocal(iso: string): string {
  // "YYYY-MM-DDTHH:MM" — strip seconds & timezone
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const sessionKeys = {
  list: (memberId: string, taskId?: string) =>
    ['time-sessions', memberId, taskId ?? 'all'] as const,
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---- Inline editor for a single session row --------------------------------

interface InlineEditorProps {
  session: TimeSession
  onSave: (startedAt: string, endedAt: string, reason: string) => Promise<void>
  onCancel: () => void
}

function InlineEditor({ session, onSave, onCancel }: InlineEditorProps) {
  const [startedAt, setStartedAt] = useState(isoToLocal(session.started_at))
  const [endedAt, setEndedAt] = useState(session.ended_at ? isoToLocal(session.ended_at) : '')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!startedAt) { setError('Start time is required'); return }
    const startISO = localToISO(startedAt)
    const endISO = endedAt ? localToISO(endedAt) : session.ended_at ?? ''
    if (endISO && new Date(endISO) <= new Date(startISO)) {
      setError('End time must be after start time')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(startISO, endISO, reason)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div
      className="mt-2 rounded-lg p-3 space-y-2"
      style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Start time
          </span>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              color: 'var(--color-text-primary, #111827)',
              backgroundColor: 'var(--color-surface, #fff)',
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            End time
          </span>
          <input
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              color: 'var(--color-text-primary, #111827)',
              backgroundColor: 'var(--color-surface, #fff)',
            }}
          />
        </label>
      </div>
      <input
        type="text"
        placeholder="Reason for edit (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border px-2 py-1 text-sm"
        style={{
          borderColor: 'var(--color-border, #e5e7eb)',
          color: 'var(--color-text-primary, #111827)',
          backgroundColor: 'var(--color-surface, #fff)',
        }}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg, #68a395)',
            color: 'var(--color-btn-primary-text, #fff)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Check size={12} />
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity"
          style={{
            backgroundColor: 'var(--color-surface, #fff)',
            color: 'var(--color-text-muted, #6b7280)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---- Add manual session form -----------------------------------------------

interface AddManualFormProps {
  onAdd: (opts: AddManualSessionOptions) => Promise<void>
  onClose: () => void
  taskId?: string
}

const MANUAL_MODES: { value: TimerMode; label: string }[] = [
  { value: 'clock', label: 'Clock' },
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'pomodoro_focus', label: 'Focus (Pomodoro)' },
  { value: 'countdown', label: 'Countdown' },
]

function AddManualForm({ onAdd, onClose, taskId }: AddManualFormProps) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [mode, setMode] = useState<TimerMode>('clock')
  const [startedAt, setStartedAt] = useState(isoToLocal(hourAgo.toISOString()))
  const [endedAt, setEndedAt] = useState(isoToLocal(now.toISOString()))
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!startedAt || !endedAt) { setError('Both start and end time are required'); return }
    const startISO = localToISO(startedAt)
    const endISO = localToISO(endedAt)
    if (new Date(endISO) <= new Date(startISO)) {
      setError('End time must be after start time')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onAdd({ mode, startedAt: startISO, endedAt: endISO, taskId, standaloneLabel: label || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
      setSaving(false)
    }
  }

  return (
    <div
      className="mb-4 rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: 'var(--color-surface-raised, #f9fafb)',
        border: '1px solid var(--color-border, #e5e7eb)',
      }}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>
        Add Manual Session
      </h3>

      <div className="space-y-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
          Mode
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as TimerMode)}
          className="w-full rounded-md border px-2 py-1.5 text-sm"
          style={{
            borderColor: 'var(--color-border, #e5e7eb)',
            color: 'var(--color-text-primary, #111827)',
            backgroundColor: 'var(--color-surface, #fff)',
          }}
        >
          {MANUAL_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Start time
          </label>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              color: 'var(--color-text-primary, #111827)',
              backgroundColor: 'var(--color-surface, #fff)',
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            End time
          </label>
          <input
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              color: 'var(--color-text-primary, #111827)',
              backgroundColor: 'var(--color-surface, #fff)',
            }}
          />
        </div>
      </div>

      {!taskId && (
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Label (optional)
          </label>
          <input
            type="text"
            placeholder="What were you working on?"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-sm"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              color: 'var(--color-text-primary, #111827)',
              backgroundColor: 'var(--color-surface, #fff)',
            }}
          />
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-error, #dc2626)' }}>
          <AlertCircle size={12} />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg, #68a395)',
            color: 'var(--color-btn-primary-text, #fff)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Plus size={14} />
          {saving ? 'Adding…' : 'Add Session'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            color: 'var(--color-text-muted, #6b7280)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---- Single session row ----------------------------------------------------

interface SessionRowProps {
  session: TimeSession
  isMom: boolean
  onEdit: (id: string, startedAt: string, endedAt: string, reason: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function SessionRow({ session, isMom, onEdit, onDelete }: SessionRowProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const durationSec = session.ended_at
    ? (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
    : null

  const handleSave = async (startedAt: string, endedAt: string, reason: string) => {
    await onEdit(session.id, startedAt, endedAt, reason)
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(session.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const label = session.standalone_label ?? modeLabel(session.timer_mode)

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #e5e7eb)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mode icon */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
        >
          <ModeIcon mode={session.timer_mode} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {label}
            </span>
            {session.edited && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={{
                  backgroundColor: 'var(--color-surface-raised, #f9fafb)',
                  color: 'var(--color-text-muted, #6b7280)',
                }}
              >
                edited
              </span>
            )}
            {!session.ended_at && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-success-soft, #d1fae5)',
                  color: 'var(--color-success, #059669)',
                }}
              >
                running
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
              {fmtTime(session.started_at)}
              {session.ended_at && ` → ${fmtTime(session.ended_at)}`}
            </span>
            {durationSec !== null && (
              <>
                <span style={{ color: 'var(--color-border, #e5e7eb)' }}>·</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary, #374151)' }}
                >
                  {formatDuration(durationSec)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mom controls */}
        {isMom && !confirmDelete && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-md p-1.5 transition-colors"
              style={{ color: 'var(--color-text-muted, #6b7280)' }}
              title="Edit session"
              aria-label="Edit session"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-md p-1.5 transition-colors"
              style={{ color: 'var(--color-text-muted, #6b7280)' }}
              title="Delete session"
              aria-label="Delete session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        {isMom && confirmDelete && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
              Delete?
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-error, #dc2626)',
                color: '#fff',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-2 py-1 text-xs font-medium"
              style={{
                color: 'var(--color-text-muted, #6b7280)',
                border: '1px solid var(--color-border, #e5e7eb)',
              }}
            >
              No
            </button>
          </div>
        )}
      </div>

      {editing && (
        <InlineEditor
          session={session}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SessionHistory({ taskId, memberId }: SessionHistoryProps) {
  const { data: currentMember } = useFamilyMember()
  const { editSession, deleteSession, addManualSession } = useTimerActions()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)

  const targetMemberId = memberId ?? currentMember?.id
  const isMom = currentMember?.role === 'primary_parent'

  // ---- Query --------------------------------------------------------------

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: sessionKeys.list(targetMemberId ?? '', taskId),
    queryFn: async (): Promise<TimeSession[]> => {
      if (!targetMemberId) return []

      let query = supabase
        .from('time_sessions')
        .select('*')
        .eq('family_member_id', targetMemberId)
        .is('deleted_at', null)
        .order('started_at', { ascending: false })

      if (taskId) {
        query = query.eq('task_id', taskId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as TimeSession[]
    },
    enabled: !!targetMemberId,
  })

  // ---- Actions ------------------------------------------------------------

  const handleEdit = useCallback(
    async (id: string, startedAt: string, endedAt: string, reason: string) => {
      await editSession(id, { started_at: startedAt, ended_at: endedAt, edit_reason: reason || undefined })
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(targetMemberId ?? '', taskId) })
    },
    [editSession, queryClient, targetMemberId, taskId]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSession(id)
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(targetMemberId ?? '', taskId) })
    },
    [deleteSession, queryClient, targetMemberId, taskId]
  )

  const handleAdd = useCallback(
    async (opts: AddManualSessionOptions) => {
      await addManualSession(opts)
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(targetMemberId ?? '', taskId) })
    },
    [addManualSession, queryClient, targetMemberId, taskId]
  )

  // ---- Group sessions by date ---------------------------------------------

  const grouped: { label: string; sessions: TimeSession[] }[] = []
  if (sessions) {
    const seen = new Map<string, TimeSession[]>()
    for (const s of sessions) {
      const lbl = groupLabel(s.started_at)
      if (!seen.has(lbl)) seen.set(lbl, [])
      seen.get(lbl)!.push(s)
    }
    for (const [lbl, items] of seen.entries()) {
      grouped.push({ label: lbl, sessions: items })
    }
  }

  // ---- Render -------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
          Loading sessions…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-error, #dc2626)' }}>
          <AlertCircle size={16} />
          Could not load session history
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row with "Add manual session" for Mom */}
      {isMom && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>
            Session History
          </h2>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: showAddForm
                ? 'var(--color-surface-raised, #f9fafb)'
                : 'var(--color-btn-primary-bg, #68a395)',
              color: showAddForm
                ? 'var(--color-text-secondary, #374151)'
                : 'var(--color-btn-primary-text, #fff)',
              border: showAddForm ? '1px solid var(--color-border, #e5e7eb)' : 'none',
            }}
          >
            <Plus size={12} />
            Add manual session
          </button>
        </div>
      )}

      {/* Add manual session form */}
      {showAddForm && (
        <AddManualForm
          onAdd={handleAdd}
          onClose={() => setShowAddForm(false)}
          taskId={taskId}
        />
      )}

      {/* Empty state */}
      {grouped.length === 0 && (
        <div
          className="rounded-xl py-12 text-center"
          style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
        >
          <Clock
            size={32}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-text-muted, #6b7280)', opacity: 0.4 }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary, #374151)' }}>
            No timer sessions yet
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            Start a timer to begin tracking your time
          </p>
        </div>
      )}

      {/* Grouped session rows */}
      {grouped.map(({ label, sessions: groupSessions }) => {
        // Compute total for this group
        const totalSec = groupSessions.reduce((sum, s) => {
          if (!s.ended_at) return sum
          return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000
        }, 0)

        return (
          <div key={label} className="space-y-2">
            {/* Date heading */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted, #6b7280)' }}
              >
                {label}
              </span>
              {totalSec > 0 && (
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary, #374151)' }}>
                  {formatDuration(totalSec)} total
                </span>
              )}
            </div>

            {/* Session rows */}
            <div className="space-y-1.5">
              {groupSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isMom={isMom}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SessionHistory
