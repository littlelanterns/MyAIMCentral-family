import { useState, useCallback } from 'react'
import { Button } from '@/components/shared'
import { useCreateContract, useUpdateContract } from '@/hooks/useContracts'
import {
  ArrowLeft, CheckCircle, List, Target, Activity, Clock, Calendar, Gift, Shuffle,
  DollarSign, Star, Trophy, Wand2, ListPlus, BellOff, Bell, Sparkles, Box, Palette, Eye,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import type {
  Contract, ContractSourceType, ContractIfPattern, GodmotherType,
  StrokeOf, PresentationMode, InheritanceLevel, OverrideMode,
} from '@/types/contracts'

interface ContractFormProps {
  contract: Contract | null
  familyId: string
  memberId: string
  members: Array<{ id: string; display_name: string; role: string }>
  onClose: () => void
}

const SOURCE_TYPE_OPTIONS: Array<{ value: ContractSourceType; icon: React.ReactNode; label: string }> = [
  { value: 'task_completion', icon: <CheckCircle size={18} />, label: 'Task Completion' },
  { value: 'routine_step_completion', icon: <CheckCircle size={18} />, label: 'Routine Step' },
  { value: 'list_item_completion', icon: <List size={18} />, label: 'List Item' },
  { value: 'intention_iteration', icon: <Target size={18} />, label: 'Intention Iteration' },
  { value: 'widget_data_point', icon: <Activity size={18} />, label: 'Widget Data Point' },
  { value: 'tracker_widget_event', icon: <Activity size={18} />, label: 'Tracker Event' },
  { value: 'time_session_ended', icon: <Clock size={18} />, label: 'Time Session' },
  { value: 'scheduled_occurrence_active', icon: <Calendar size={18} />, label: 'Scheduled Occurrence' },
  { value: 'opportunity_claimed', icon: <Gift size={18} />, label: 'Opportunity Claimed' },
  { value: 'randomizer_drawn', icon: <Shuffle size={18} />, label: 'Randomizer Drawn' },
]

const IF_PATTERN_OPTIONS: Array<{ value: ContractIfPattern; label: string; description: string }> = [
  { value: 'every_time', label: 'Every time', description: 'Always fires' },
  { value: 'every_nth', label: 'Every Nth time', description: 'Fires on multiples of N' },
  { value: 'on_threshold_cross', label: 'When total reaches...', description: 'Fires once when count hits N' },
  { value: 'above_daily_floor', label: 'More than N per day', description: 'Fires after N completions in a day' },
  { value: 'above_window_floor', label: 'More than N per period', description: 'Fires after N in a window' },
  { value: 'within_date_range', label: 'Within date range', description: 'Only active during a date window' },
  { value: 'streak', label: 'On a streak of N days', description: 'Fires when streak reaches N' },
  { value: 'calendar', label: 'On matching calendar days', description: 'Coming soon' },
]

const GODMOTHER_OPTIONS: Array<{ value: GodmotherType; icon: React.ReactNode; label: string; payloadType: 'amount' | 'text' | 'config' | 'none' }> = [
  { value: 'allowance_godmother', icon: <DollarSign size={18} />, label: 'Allowance', payloadType: 'config' },
  { value: 'numerator_godmother', icon: <DollarSign size={18} />, label: 'Numerator Boost', payloadType: 'amount' },
  { value: 'money_godmother', icon: <DollarSign size={18} />, label: 'Grant Money', payloadType: 'amount' },
  { value: 'points_godmother', icon: <Star size={18} />, label: 'Grant Points', payloadType: 'amount' },
  { value: 'prize_godmother', icon: <Gift size={18} />, label: 'Prize', payloadType: 'text' },
  { value: 'victory_godmother', icon: <Trophy size={18} />, label: 'Victory', payloadType: 'text' },
  { value: 'family_victory_godmother', icon: <Trophy size={18} />, label: 'Family Victory', payloadType: 'none' },
  { value: 'custom_reward_godmother', icon: <Wand2 size={18} />, label: 'Custom Reward', payloadType: 'text' },
  { value: 'assign_task_godmother', icon: <ListPlus size={18} />, label: 'Assign Task', payloadType: 'config' },
  { value: 'recognition_godmother', icon: <Eye size={18} />, label: 'Recognition Only', payloadType: 'none' },
]

const STROKE_OF_OPTIONS: Array<{ value: StrokeOf; label: string }> = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'end_of_day', label: 'End of day' },
  { value: 'end_of_week', label: 'End of week' },
  { value: 'end_of_period', label: 'End of allowance period' },
  { value: 'at_specific_time', label: 'At a specific time' },
  { value: 'custom', label: 'Custom schedule (coming soon)' },
]

const PRESENTATION_OPTIONS: Array<{ value: PresentationMode; icon: React.ReactNode; label: string }> = [
  { value: 'silent', icon: <BellOff size={18} />, label: 'Silent' },
  { value: 'toast', icon: <Bell size={18} />, label: 'Toast notification' },
  { value: 'reveal_animation', icon: <Sparkles size={18} />, label: 'Reveal animation' },
  { value: 'treasure_box', icon: <Box size={18} />, label: 'Treasure box' },
  { value: 'coloring_advance', icon: <Palette size={18} />, label: 'Coloring advance' },
]

interface FormState {
  source_type: ContractSourceType
  source_id: string | null
  source_category: string
  family_member_id: string | null
  if_pattern: ContractIfPattern
  if_n: string
  if_floor: string
  if_window_kind: 'day' | 'week' | 'month'
  if_offset: string
  if_window_starts_at: string
  if_window_ends_at: string
  godmother_type: GodmotherType
  payload_amount: string
  payload_text: string
  stroke_of: StrokeOf
  stroke_of_time: string
  presentation_mode: PresentationMode
  presentation_config: Record<string, unknown>
  override_mode: OverrideMode
}

function contractToFormState(c: Contract | null): FormState {
  if (!c) return {
    source_type: 'task_completion',
    source_id: null,
    source_category: '',
    family_member_id: null,
    if_pattern: 'every_time',
    if_n: '',
    if_floor: '',
    if_window_kind: 'day',
    if_offset: '0',
    if_window_starts_at: '',
    if_window_ends_at: '',
    godmother_type: 'points_godmother',
    payload_amount: '',
    payload_text: '',
    stroke_of: 'immediate',
    stroke_of_time: '',
    presentation_mode: 'silent',
    presentation_config: {},
    override_mode: 'replace',
  }
  return {
    source_type: c.source_type,
    source_id: c.source_id,
    source_category: c.source_category ?? '',
    family_member_id: c.family_member_id,
    if_pattern: c.if_pattern,
    if_n: c.if_n !== null ? String(c.if_n) : '',
    if_floor: c.if_floor !== null ? String(c.if_floor) : '',
    if_window_kind: c.if_window_kind ?? 'day',
    if_offset: String(c.if_offset),
    if_window_starts_at: c.if_window_starts_at?.split('T')[0] ?? '',
    if_window_ends_at: c.if_window_ends_at?.split('T')[0] ?? '',
    godmother_type: c.godmother_type,
    payload_amount: c.payload_amount !== null ? String(c.payload_amount) : '',
    payload_text: c.payload_text ?? '',
    stroke_of: c.stroke_of,
    stroke_of_time: c.stroke_of_time ?? '',
    presentation_mode: c.presentation_mode,
    presentation_config: c.presentation_config ?? {},
    override_mode: c.override_mode,
  }
}

export function ContractForm({ contract, familyId, memberId, members, onClose }: ContractFormProps) {
  const [form, setForm] = useState<FormState>(() => contractToFormState(contract))
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['deed', 'if', 'godmother', 'timing', 'presentation']),
  )
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const isEditing = !!contract

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleSection = (s: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const deriveInheritanceLevel = (): InheritanceLevel => {
    if (form.source_id) return 'deed_override'
    if (form.family_member_id) return 'kid_override'
    return 'family_default'
  }

  const selectedGodmother = GODMOTHER_OPTIONS.find((g) => g.value === form.godmother_type)

  const handleSave = async () => {
    const inheritanceLevel = deriveInheritanceLevel()
    const payload = {
      family_id: familyId,
      created_by: memberId,
      status: 'active' as const,
      source_type: form.source_type,
      source_id: form.source_id || null,
      source_category: form.source_category || null,
      family_member_id: form.family_member_id || null,
      if_pattern: form.if_pattern,
      if_n: form.if_n ? parseInt(form.if_n) : null,
      if_floor: form.if_floor ? parseInt(form.if_floor) : null,
      if_window_kind: form.if_pattern === 'above_window_floor' ? form.if_window_kind : null,
      if_window_starts_at: form.if_window_starts_at ? new Date(form.if_window_starts_at).toISOString() : null,
      if_window_ends_at: form.if_window_ends_at ? new Date(form.if_window_ends_at).toISOString() : null,
      if_calendar_pattern: null,
      if_offset: parseInt(form.if_offset) || 0,
      godmother_type: form.godmother_type,
      godmother_config_id: null,
      payload_amount: form.payload_amount ? parseFloat(form.payload_amount) : null,
      payload_text: form.payload_text || null,
      payload_config: null,
      stroke_of: form.stroke_of,
      stroke_of_time: form.stroke_of === 'at_specific_time' ? form.stroke_of_time || null : null,
      recurrence_details: null,
      inheritance_level: inheritanceLevel,
      override_mode: form.override_mode,
      presentation_mode: form.presentation_mode,
      presentation_config: Object.keys(form.presentation_config).length > 0 ? form.presentation_config : null,
    }

    if (isEditing) {
      await updateContract.mutateAsync({ id: contract.id, ...payload })
    } else {
      await createContract.mutateAsync(payload)
    }
    onClose()
  }

  const SectionHeader = ({ id, title }: { id: string; title: string }) => {
    const expanded = expandedSections.has(id)
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center gap-2 py-2 text-sm font-medium"
        style={{ color: 'var(--color-text-heading)' }}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={onClose}
        className="flex items-center gap-1 text-sm mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} /> Back to contracts
      </button>

      <h2
        className="text-lg font-semibold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
      >
        {isEditing ? 'Edit Contract' : 'New Contract'}
      </h2>

      <div className="space-y-3">
        {/* Section 1: Deed */}
        <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
          <SectionHeader id="deed" title="When this happens" />
          {expandedSections.has('deed') && (
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Source Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => set('source_type', opt.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors"
                      style={{
                        borderColor: form.source_type === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)',
                        background: form.source_type === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Category filter (optional)
                </label>
                <input
                  value={form.source_category}
                  onChange={(e) => set('source_category', e.target.value)}
                  placeholder="e.g., chores, school"
                  className="w-full rounded-lg px-3 py-2 text-sm border"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  For which family member? (empty = all)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => set('family_member_id', null)}
                    className="px-3 py-1.5 rounded-full text-sm border"
                    style={{
                      borderColor: form.family_member_id === null ? 'var(--color-accent)' : 'var(--color-border-default)',
                      background: form.family_member_id === null ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Everyone
                  </button>
                  {members.filter((m) => m.role !== 'primary_parent').map((m) => (
                    <button
                      key={m.id}
                      onClick={() => set('family_member_id', m.id)}
                      className="px-3 py-1.5 rounded-full text-sm border"
                      style={{
                        borderColor: form.family_member_id === m.id ? 'var(--color-accent)' : 'var(--color-border-default)',
                        background: form.family_member_id === m.id ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {m.display_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: IF pattern */}
        <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
          <SectionHeader id="if" title="If this condition is met" />
          {expandedSections.has('if') && (
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                {IF_PATTERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => opt.value !== 'calendar' && set('if_pattern', opt.value)}
                    className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left"
                    style={{
                      borderColor: form.if_pattern === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)',
                      background: form.if_pattern === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                      color: 'var(--color-text-primary)',
                      opacity: opt.value === 'calendar' ? 0.5 : 1,
                    }}
                    disabled={opt.value === 'calendar'}
                  >
                    <div>
                      <span className="font-medium">{opt.label}</span>
                      <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>{opt.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pattern-specific fields */}
              {(form.if_pattern === 'every_nth' || form.if_pattern === 'on_threshold_cross' || form.if_pattern === 'streak') && (
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>N</label>
                  <input
                    type="number"
                    min="1"
                    value={form.if_n}
                    onChange={(e) => set('if_n', e.target.value)}
                    className="w-32 rounded-lg px-3 py-2 text-sm border"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              )}
              {(form.if_pattern === 'above_daily_floor' || form.if_pattern === 'above_window_floor') && (
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Floor</label>
                    <input
                      type="number"
                      min="0"
                      value={form.if_floor}
                      onChange={(e) => set('if_floor', e.target.value)}
                      className="w-24 rounded-lg px-3 py-2 text-sm border"
                      style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                    />
                  </div>
                  {form.if_pattern === 'above_window_floor' && (
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Per</label>
                      <select
                        value={form.if_window_kind}
                        onChange={(e) => set('if_window_kind', e.target.value as 'day' | 'week' | 'month')}
                        className="rounded-lg px-3 py-2 text-sm border"
                        style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              {form.if_pattern === 'within_date_range' && (
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>From</label>
                    <input
                      type="date"
                      value={form.if_window_starts_at}
                      onChange={(e) => set('if_window_starts_at', e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm border"
                      style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>To</label>
                    <input
                      type="date"
                      value={form.if_window_ends_at}
                      onChange={(e) => set('if_window_ends_at', e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm border"
                      style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Skip the first N occurrences (default 0)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.if_offset}
                  onChange={(e) => set('if_offset', e.target.value)}
                  className="w-24 rounded-lg px-3 py-2 text-sm border"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Godmother */}
        <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
          <SectionHeader id="godmother" title="Then do this" />
          {expandedSections.has('godmother') && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-1.5">
                {GODMOTHER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('godmother_type', opt.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors"
                    style={{
                      borderColor: form.godmother_type === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)',
                      background: form.godmother_type === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
              {selectedGodmother?.payloadType === 'amount' && (
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.payload_amount}
                    onChange={(e) => set('payload_amount', e.target.value)}
                    className="w-32 rounded-lg px-3 py-2 text-sm border"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              )}
              {selectedGodmother?.payloadType === 'text' && (
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
                  <input
                    value={form.payload_text}
                    onChange={(e) => set('payload_text', e.target.value)}
                    placeholder="Victory description, prize text, etc."
                    className="w-full rounded-lg px-3 py-2 text-sm border"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              )}
              {selectedGodmother?.payloadType === 'config' && (
                <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-accent) 5%, transparent)', color: 'var(--color-text-secondary)' }}>
                  Advanced configuration for this godmother type. Use the inline amount/text fields for simple cases.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 4: Timing */}
        <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
          <SectionHeader id="timing" title="When to grant" />
          {expandedSections.has('timing') && (
            <div className="space-y-2 mt-2">
              {STROKE_OF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => opt.value !== 'custom' && set('stroke_of', opt.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left"
                  style={{
                    borderColor: form.stroke_of === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)',
                    background: form.stroke_of === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    opacity: opt.value === 'custom' ? 0.5 : 1,
                  }}
                  disabled={opt.value === 'custom'}
                >
                  {opt.label}
                </button>
              ))}
              {form.stroke_of === 'at_specific_time' && (
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Time</label>
                  <input
                    type="time"
                    value={form.stroke_of_time}
                    onChange={(e) => set('stroke_of_time', e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm border"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 5: Presentation */}
        <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
          <SectionHeader id="presentation" title="How the kid sees it" />
          {expandedSections.has('presentation') && (
            <div className="space-y-2 mt-2">
              {PRESENTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set('presentation_mode', opt.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left"
                  style={{
                    borderColor: form.presentation_mode === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)',
                    background: form.presentation_mode === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Inheritance (only if not family_default) */}
        {(form.family_member_id || form.source_id) && (
          <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)' }}>
            <SectionHeader id="inheritance" title="Inheritance & Override" />
            {expandedSections.has('inheritance') && (
              <div className="space-y-3 mt-2">
                <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-accent) 5%, transparent)', color: 'var(--color-text-secondary)' }}>
                  This contract is a <strong>{deriveInheritanceLevel().replace('_', ' ')}</strong>.
                  {deriveInheritanceLevel() !== 'family_default' && (
                    <> Choose how it interacts with broader contracts.</>
                  )}
                </div>
                <div className="space-y-1.5">
                  {(['replace', 'add', 'remove'] as OverrideMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => set('override_mode', mode)}
                      className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left"
                      style={{
                        borderColor: form.override_mode === mode ? 'var(--color-accent)' : 'var(--color-border-default)',
                        background: form.override_mode === mode ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <div>
                        <span className="font-medium capitalize">{mode}</span>
                        <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {mode === 'replace' && 'This contract replaces the family default for this context.'}
                          {mode === 'add' && 'This contract adds to the family default (both fire).'}
                          {mode === 'remove' && 'This contract blocks the family default for this context.'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={createContract.isPending || updateContract.isPending}
        >
          {isEditing ? 'Save Changes' : 'Create Contract'}
        </Button>
      </div>
    </div>
  )
}
