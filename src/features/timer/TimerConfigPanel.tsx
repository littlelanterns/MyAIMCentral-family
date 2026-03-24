/**
 * TimerConfigPanel — PRD-36
 *
 * Per-member timer configuration panel, used inside Settings.
 * Loads (or creates on first edit) the timer_configs row for the given member.
 * All fields auto-save with a 500ms debounce.
 *
 * Props: { memberId: string }
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useTimerConfig } from './useTimer'
import { VisualTimer } from './VisualTimers'
import { FeatureGuide } from '@/components/shared'
import type { TimerConfig, VisualTimerStyle } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimerConfigPanelProps {
  memberId: string
}

/** Partial update payload for the timer_configs row. */
type ConfigUpdate = Partial<
  Omit<TimerConfig, 'id' | 'family_id' | 'family_member_id' | 'created_at' | 'updated_at'>
>

type WorkingConfig = Omit<TimerConfig, 'id' | 'family_id' | 'family_member_id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISUAL_STYLES: { value: VisualTimerStyle; label: string }[] = [
  { value: 'sand_timer',  label: 'Sand Timer'  },
  { value: 'hourglass',   label: 'Hourglass'   },
  { value: 'thermometer', label: 'Thermometer' },
  { value: 'arc',         label: 'Arc Ring'    },
  { value: 'filling_jar', label: 'Filling Jar' },
]

const DEFAULT_CONFIG: WorkingConfig = {
  timer_visible: true,
  idle_reminder_minutes: 120,
  idle_repeat_minutes: 60,
  auto_pause_minutes: 0,
  pomodoro_focus_minutes: 25,
  pomodoro_short_break_minutes: 5,
  pomodoro_long_break_minutes: 15,
  pomodoro_intervals_before_long: 4,
  pomodoro_break_required: false,
  can_start_standalone: true,
  visual_timer_style: 'sand_timer',
  show_time_as_numbers: true,
  bubble_position: { x: 'right', y: 'bottom' },
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted, #6b7280)' }}
      >
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="h-px" style={{ backgroundColor: 'var(--color-border, #e5e7eb)' }} />
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none"
        style={{
          backgroundColor: checked
            ? 'var(--color-btn-primary-bg, #68a395)'
            : 'var(--color-surface-raised, #e5e7eb)',
        }}
      >
        <span
          className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  )
}

interface NumberFieldProps {
  label: string
  description?: string
  value: number
  min?: number
  max?: number
  unit?: string
  /** Shown when value === 0 instead of "0 <unit>" */
  zeroLabel?: string
  onChange: (v: number) => void
}

function NumberField({ label, description, value, min = 0, max = 999, unit = 'min', zeroLabel, onChange }: NumberFieldProps) {
  const display = value === 0 && zeroLabel ? zeroLabel : `${value} ${unit}`
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-base font-bold"
          style={{
            backgroundColor: 'var(--color-surface-raised, #f9fafb)',
            color: 'var(--color-text-secondary, #374151)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span
          className="min-w-[64px] text-center text-sm font-medium tabular-nums"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          {display}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-base font-bold"
          style={{
            backgroundColor: 'var(--color-surface-raised, #f9fafb)',
            color: 'var(--color-text-secondary, #374151)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visual style picker
// ---------------------------------------------------------------------------

function VisualStylePicker({ value, onChange }: { value: VisualTimerStyle; onChange: (v: VisualTimerStyle) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
        Visual timer style
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
        Shown instead of clock digits in Play mode and when "Show numbers" is off
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        {VISUAL_STYLES.map(({ value: sv, label }) => {
          const selected = value === sv
          return (
            <button
              key={sv}
              onClick={() => onChange(sv)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all"
              style={{
                border: selected
                  ? '2px solid var(--color-btn-primary-bg, #68a395)'
                  : '2px solid var(--color-border, #e5e7eb)',
                backgroundColor: selected
                  ? 'var(--color-surface-raised, #f0fdf4)'
                  : 'var(--color-surface, #fff)',
                minWidth: 72,
              }}
              aria-pressed={selected}
              aria-label={`${label} visual style`}
            >
              <VisualTimer style={sv} progress={0.6} size={60} showNumbers={false} />
              <span
                className="text-xs font-medium text-center leading-tight"
                style={{
                  color: selected
                    ? 'var(--color-btn-primary-bg, #68a395)'
                    : 'var(--color-text-muted, #6b7280)',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium"
      style={{
        color:
          state === 'saving'
            ? 'var(--color-text-muted, #6b7280)'
            : state === 'saved'
            ? 'var(--color-success, #059669)'
            : 'var(--color-error, #dc2626)',
      }}
    >
      {state === 'saving' && <span>Saving…</span>}
      {state === 'saved' && <><Check size={12} /><span>Saved</span></>}
      {state === 'error'  && <><AlertCircle size={12} /><span>Save failed</span></>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TimerConfigPanel({ memberId }: TimerConfigPanelProps) {
  const { data: currentMember } = useFamilyMember()
  const { data: serverConfig, isLoading } = useTimerConfig(memberId)
  const queryClient = useQueryClient()

  const [local, setLocal] = useState<WorkingConfig>(DEFAULT_CONFIG)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configIdRef = useRef<string | null>(null)

  // Hydrate local state from server once loaded
  useEffect(() => {
    if (!serverConfig) return
    configIdRef.current = serverConfig.id
    setLocal({
      timer_visible:                 serverConfig.timer_visible,
      idle_reminder_minutes:         serverConfig.idle_reminder_minutes,
      idle_repeat_minutes:           serverConfig.idle_repeat_minutes,
      auto_pause_minutes:            serverConfig.auto_pause_minutes,
      pomodoro_focus_minutes:        serverConfig.pomodoro_focus_minutes,
      pomodoro_short_break_minutes:  serverConfig.pomodoro_short_break_minutes,
      pomodoro_long_break_minutes:   serverConfig.pomodoro_long_break_minutes,
      pomodoro_intervals_before_long: serverConfig.pomodoro_intervals_before_long,
      pomodoro_break_required:       serverConfig.pomodoro_break_required,
      can_start_standalone:          serverConfig.can_start_standalone,
      visual_timer_style:            serverConfig.visual_timer_style,
      show_time_as_numbers:          serverConfig.show_time_as_numbers,
      bubble_position:               serverConfig.bubble_position,
    })
  }, [serverConfig])

  // ---- Upsert mutation ---------------------------------------------------

  const upsertMutation = useMutation({
    mutationFn: async (patch: ConfigUpdate) => {
      if (!currentMember) throw new Error('No authenticated member')

      if (configIdRef.current) {
        const { error } = await supabase
          .from('timer_configs')
          .update(patch)
          .eq('id', configIdRef.current)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('timer_configs')
          .insert({
            family_id: currentMember.family_id,
            family_member_id: memberId,
            ...DEFAULT_CONFIG,
            ...patch,
          })
          .select('id')
          .single()
        if (error) throw error
        configIdRef.current = (data as { id: string }).id
      }
    },
    onSuccess: () => {
      setSaveState('saved')
      queryClient.invalidateQueries({ queryKey: ['timer-config', memberId] })
      setTimeout(() => setSaveState('idle'), 2000)
    },
    onError: () => {
      setSaveState('error')
    },
  })

  // ---- Debounced save ----------------------------------------------------

  const debounceSave = useCallback(
    (patch: ConfigUpdate) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSaveState('saving')
      debounceRef.current = setTimeout(() => {
        upsertMutation.mutate(patch)
      }, 500)
    },
    [upsertMutation]
  )

  // ---- Field setter -------------------------------------------------------

  const set = useCallback(
    (key: keyof WorkingConfig, value: WorkingConfig[keyof WorkingConfig]) => {
      setLocal((prev) => ({ ...prev, [key]: value }))
      debounceSave({ [key]: value } as ConfigUpdate)
    },
    [debounceSave]
  )

  // ---- Loading -----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
          Loading timer settings…
        </p>
      </div>
    )
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-6 pb-6">
      <FeatureGuide
        featureKey="timer_config"
        title="Universal Timer Settings"
        description="Customize how the timer works for this family member. Changes save automatically."
        bullets={[
          'Visual timer styles are shown in Play mode instead of clock digits',
          'Set idle reminders to stay on track during long tasks',
          'Pomodoro settings configure the focus and break cycle lengths',
        ]}
      />

      <div className="flex items-center justify-end">
        <SaveIndicator state={saveState} />
      </div>

      {/* ---- General -------------------------------------------------- */}
      <Section title="General">
        <ToggleRow
          label="Timer visible"
          description="Show the floating timer bubble for this member"
          checked={local.timer_visible}
          onChange={(v) => set('timer_visible', v)}
        />
        <ToggleRow
          label="Can start standalone timer"
          description="Allow starting a timer without linking it to a task or widget"
          checked={local.can_start_standalone}
          onChange={(v) => set('can_start_standalone', v)}
        />
      </Section>

      <Divider />

      {/* ---- Idle reminders ------------------------------------------- */}
      <Section title="Idle Reminders">
        <NumberField
          label="Idle reminder"
          description="Show a reminder if the timer has been running this long without interaction"
          value={local.idle_reminder_minutes}
          min={0}
          max={480}
          unit="min"
          zeroLabel="Off"
          onChange={(v) => set('idle_reminder_minutes', v)}
        />
        {local.idle_reminder_minutes > 0 && (
          <NumberField
            label="Repeat reminder every"
            value={local.idle_repeat_minutes}
            min={5}
            max={120}
            unit="min"
            onChange={(v) => set('idle_repeat_minutes', v)}
          />
        )}
        <NumberField
          label="Auto-pause after"
          description="Automatically pause the timer after this many minutes of inactivity (0 = off)"
          value={local.auto_pause_minutes}
          min={0}
          max={480}
          unit="min"
          zeroLabel="Off"
          onChange={(v) => set('auto_pause_minutes', v)}
        />
      </Section>

      <Divider />

      {/* ---- Pomodoro ------------------------------------------------- */}
      <Section title="Pomodoro">
        <NumberField
          label="Focus duration"
          value={local.pomodoro_focus_minutes}
          min={1}
          max={90}
          unit="min"
          onChange={(v) => set('pomodoro_focus_minutes', v)}
        />
        <NumberField
          label="Short break"
          value={local.pomodoro_short_break_minutes}
          min={1}
          max={30}
          unit="min"
          onChange={(v) => set('pomodoro_short_break_minutes', v)}
        />
        <NumberField
          label="Long break"
          value={local.pomodoro_long_break_minutes}
          min={1}
          max={60}
          unit="min"
          onChange={(v) => set('pomodoro_long_break_minutes', v)}
        />
        <NumberField
          label="Sessions before long break"
          description="How many focus sessions before the long break kicks in"
          value={local.pomodoro_intervals_before_long}
          min={1}
          max={10}
          unit="sessions"
          onChange={(v) => set('pomodoro_intervals_before_long', v)}
        />
        <ToggleRow
          label="Break required"
          description="Lock the timer until the break is completed (recommended for Guided and Play members)"
          checked={local.pomodoro_break_required}
          onChange={(v) => set('pomodoro_break_required', v)}
        />
      </Section>

      <Divider />

      {/* ---- Visual style --------------------------------------------- */}
      <Section title="Visual Timer">
        <ToggleRow
          label="Show time as numbers"
          description="Display elapsed or remaining time as digits. When off, only the visual timer is shown."
          checked={local.show_time_as_numbers}
          onChange={(v) => set('show_time_as_numbers', v)}
        />
        <VisualStylePicker
          value={local.visual_timer_style}
          onChange={(v) => set('visual_timer_style', v)}
        />
      </Section>
    </div>
  )
}

export default TimerConfigPanel
