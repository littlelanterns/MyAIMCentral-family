/**
 * Universal Timer Hooks (PRD-36)
 *
 * Provides data access and mutation hooks for the Universal Timer feature.
 * All hooks scope queries to the authenticated member's family.
 */

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { TimeSession, TimerConfig, TimerMode, PomodoroConfig } from './types'

// ---------------------------------------------------------------------------
// Query key factory — keeps cache keys consistent across invalidations
// ---------------------------------------------------------------------------

const timerKeys = {
  activeTimers: (familyId: string) => ['active-timers', familyId] as const,
  timerConfig: (memberId: string) => ['timer-config', memberId] as const,
}

// ---------------------------------------------------------------------------
// useActiveTimers
// ---------------------------------------------------------------------------

/**
 * Returns all time sessions that are currently running (ended_at IS NULL,
 * deleted_at IS NULL) for the authenticated member's family.
 *
 * Refetches every 5 seconds to stay in sync with other devices / family members.
 */
export function useActiveTimers() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: timerKeys.activeTimers(familyId ?? ''),
    queryFn: async (): Promise<TimeSession[]> => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('time_sessions')
        .select('*')
        .eq('family_id', familyId)
        .is('ended_at', null)
        .is('deleted_at', null)
        .order('started_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as TimeSession[]
    },
    enabled: !!familyId,
    refetchInterval: 5_000,
  })
}

// ---------------------------------------------------------------------------
// useTimerConfig
// ---------------------------------------------------------------------------

/**
 * Returns the timer_configs row for the given member (defaults to the
 * authenticated member when memberId is omitted).
 *
 * Returns null when no config row exists yet; the UI should fall back to
 * DEFAULT_POMODORO_CONFIG and the TimerConfig defaults in that case.
 */
export function useTimerConfig(memberId?: string) {
  const { data: currentMember } = useFamilyMember()
  const targetMemberId = memberId ?? currentMember?.id

  return useQuery({
    queryKey: timerKeys.timerConfig(targetMemberId ?? ''),
    queryFn: async (): Promise<TimerConfig | null> => {
      if (!targetMemberId) return null

      const { data, error } = await supabase
        .from('timer_configs')
        .select('*')
        .eq('family_member_id', targetMemberId)
        .maybeSingle()

      if (error) throw error
      return (data ?? null) as TimerConfig | null
    },
    enabled: !!targetMemberId,
  })
}

// ---------------------------------------------------------------------------
// useTimerActions
// ---------------------------------------------------------------------------

/** Options accepted by startTimer(). */
export interface StartTimerOptions {
  mode: TimerMode
  taskId?: string
  widgetId?: string
  listItemId?: string
  sourceType?: string
  sourceReferenceId?: string
  isStandalone?: boolean
  standaloneLabel?: string
  pomodoroConfig?: PomodoroConfig
  countdownTargetMinutes?: number
}

/** Options accepted by addManualSession(). */
export interface AddManualSessionOptions {
  mode: TimerMode
  startedAt: string
  endedAt: string
  taskId?: string
  standaloneLabel?: string
}

/** Shape returned by useTimerActions(). */
export interface TimerActions {
  startTimer: (opts: StartTimerOptions) => Promise<TimeSession>
  stopTimer: (sessionId: string) => Promise<void>
  pauseTimer: (sessionId: string) => Promise<void>
  editSession: (
    sessionId: string,
    updates: { started_at?: string; ended_at?: string; edit_reason?: string }
  ) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  addManualSession: (opts: AddManualSessionOptions) => Promise<void>
}

/**
 * Returns an object of async action functions for creating and mutating
 * timer sessions. All write operations invalidate the active-timers query
 * so the UI reflects changes immediately.
 */
export function useTimerActions(): TimerActions {
  const { data: member } = useFamilyMember()
  const queryClient = useQueryClient()

  const invalidateActive = () => {
    if (member?.family_id) {
      queryClient.invalidateQueries({
        queryKey: timerKeys.activeTimers(member.family_id),
      })
    }
  }

  // ---- startTimer --------------------------------------------------------

  const startTimer = async (opts: StartTimerOptions): Promise<TimeSession> => {
    if (!member) throw new Error('No authenticated family member')

    const insert = {
      family_id: member.family_id,
      family_member_id: member.id,
      started_by: member.id,
      timer_mode: opts.mode,
      started_at: new Date().toISOString(),
      ended_at: null,
      task_id: opts.taskId ?? null,
      widget_id: opts.widgetId ?? null,
      list_item_id: opts.listItemId ?? null,
      source_type: opts.sourceType ?? null,
      source_reference_id: opts.sourceReferenceId ?? null,
      is_standalone: opts.isStandalone ?? false,
      standalone_label: opts.standaloneLabel ?? null,
      pomodoro_config: opts.pomodoroConfig ?? null,
      countdown_target_minutes: opts.countdownTargetMinutes ?? null,
      auto_paused: false,
      edited: false,
      edited_by: null,
      edited_at: null,
      original_timestamps: null,
      edit_reason: null,
      deleted_at: null,
    }

    const { data, error } = await supabase
      .from('time_sessions')
      .insert(insert)
      .select()
      .single()

    if (error) throw error

    invalidateActive()
    return data as TimeSession
  }

  // ---- stopTimer ---------------------------------------------------------

  const stopTimer = async (sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from('time_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) throw error
    invalidateActive()
  }

  // ---- pauseTimer --------------------------------------------------------

  const pauseTimer = async (sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from('time_sessions')
      .update({
        ended_at: new Date().toISOString(),
        auto_paused: true,
      })
      .eq('id', sessionId)

    if (error) throw error
    invalidateActive()
  }

  // ---- editSession -------------------------------------------------------

  const editSession = async (
    sessionId: string,
    updates: { started_at?: string; ended_at?: string; edit_reason?: string }
  ): Promise<void> => {
    if (!member) throw new Error('No authenticated family member')

    // Fetch the current session so we can preserve original_timestamps.
    const { data: current, error: fetchError } = await supabase
      .from('time_sessions')
      .select('started_at, ended_at, original_timestamps')
      .eq('id', sessionId)
      .single()

    if (fetchError) throw fetchError

    // Only capture original_timestamps once (on first edit).
    const originalTimestamps =
      current.original_timestamps ??
      ({ started_at: current.started_at, ended_at: current.ended_at } as {
        started_at: string
        ended_at: string
      })

    const { error: updateError } = await supabase
      .from('time_sessions')
      .update({
        ...updates,
        edited: true,
        edited_by: member.id,
        edited_at: new Date().toISOString(),
        original_timestamps: originalTimestamps,
      })
      .eq('id', sessionId)

    if (updateError) throw updateError
    invalidateActive()
  }

  // ---- deleteSession -----------------------------------------------------

  const deleteSession = async (sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from('time_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) throw error
    invalidateActive()
  }

  // ---- addManualSession --------------------------------------------------

  const addManualSession = async (opts: AddManualSessionOptions): Promise<void> => {
    if (!member) throw new Error('No authenticated family member')

    const started = new Date(opts.startedAt)
    const ended = new Date(opts.endedAt)
    const durationMinutes = Math.round((ended.getTime() - started.getTime()) / 60_000)

    const insert = {
      family_id: member.family_id,
      family_member_id: member.id,
      started_by: member.id,
      timer_mode: opts.mode,
      started_at: opts.startedAt,
      ended_at: opts.endedAt,
      duration_minutes: durationMinutes,
      task_id: opts.taskId ?? null,
      widget_id: null,
      list_item_id: null,
      source_type: null,
      source_reference_id: null,
      is_standalone: !opts.taskId,
      standalone_label: opts.standaloneLabel ?? null,
      pomodoro_config: null,
      countdown_target_minutes: null,
      auto_paused: false,
      edited: false,
      edited_by: null,
      edited_at: null,
      original_timestamps: null,
      edit_reason: null,
      deleted_at: null,
    }

    const { error } = await supabase.from('time_sessions').insert(insert)
    if (error) throw error
    invalidateActive()
  }

  return {
    startTimer,
    stopTimer,
    pauseTimer,
    editSession,
    deleteSession,
    addManualSession,
  }
}

// ---------------------------------------------------------------------------
// useTimerTick
// ---------------------------------------------------------------------------

/** Per-session tick state. */
export interface SessionTick {
  /** Seconds elapsed since started_at. */
  elapsed: number
  /** For countdown mode: seconds remaining until target. Null for other modes. */
  remaining: number | null
}

/**
 * Runs a 1-second interval and returns a Map from session ID to live tick
 * state (elapsed seconds and, for countdown mode, remaining seconds).
 *
 * The interval is set up once on mount and cleaned up on unmount. Passing a
 * new activeSessions array does NOT create additional intervals — the latest
 * sessions array is always captured via a ref.
 */
export function useTimerTick(activeSessions: TimeSession[]): Map<string, SessionTick> {
  const [ticks, setTicks] = useState<Map<string, SessionTick>>(() =>
    computeTicks(activeSessions)
  )

  // Keep a ref to the latest sessions so the interval closure always has
  // the most recent data without needing to be re-created.
  const sessionsRef = useRef(activeSessions)
  useEffect(() => {
    sessionsRef.current = activeSessions
  }, [activeSessions])

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(computeTicks(sessionsRef.current))
    }, 1_000)

    return () => clearInterval(interval)
  }, []) // intentionally empty — single interval for the lifetime of the hook

  return ticks
}

/**
 * Pure helper: computes the current tick state for each session.
 * Extracted so it can be called both on initial render and inside the interval.
 */
function computeTicks(sessions: TimeSession[]): Map<string, SessionTick> {
  const now = Date.now()
  const map = new Map<string, SessionTick>()

  for (const session of sessions) {
    const elapsed = (now - new Date(session.started_at).getTime()) / 1_000

    let remaining: number | null = null
    if (
      session.timer_mode === 'countdown' &&
      session.countdown_target_minutes != null
    ) {
      remaining = session.countdown_target_minutes * 60 - elapsed
    }

    map.set(session.id, { elapsed, remaining })
  }

  return map
}
