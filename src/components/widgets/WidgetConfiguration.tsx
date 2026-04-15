// PRD-10 Screen 4: Widget Configuration — ModalV2 with adaptive form per tracker type
// Common fields: title, assigned to, size, goal, unit
// Template-specific fields loaded per tracker type
// Multiplayer configuration section for supported types

import { useState, useCallback } from 'react'
import { LayoutDashboard, Save, Settings, Users, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { AttachRevealSection, type RevealAttachmentConfig } from '@/components/reward-reveals/AttachRevealSection'
import { ModalV2 } from '@/components/shared'
import type { WidgetStarterConfig, WidgetSize, CreateWidget, TrackerType, MultiplayerMode, MultiplayerVisualStyle } from '@/types/widgets'
import { getTrackerMeta, MULTIPLAYER_TRACKER_TYPES } from '@/types/widgets'
import { SYSTEM_RHYTHM_KEYS_FOR_WIDGETS } from '@/types/rhythms'
import { getMemberColor } from '@/lib/memberColors'

interface WidgetConfigurationProps {
  isOpen: boolean
  onClose: () => void
  starterConfig?: WidgetStarterConfig | null
  editingWidget?: CreateWidget | null
  familyId: string
  memberId: string
  familyMembers: { id: string; display_name: string; assigned_color?: string | null; member_color?: string | null }[]
  onDeploy: (widget: CreateWidget) => void
  onSaveAsTemplate?: (widget: CreateWidget) => void
}

export function WidgetConfiguration({
  isOpen,
  onClose,
  starterConfig,
  editingWidget,
  familyId,
  memberId,
  familyMembers,
  onDeploy,
  onSaveAsTemplate,
}: WidgetConfigurationProps) {
  const defaultConfig = starterConfig?.default_config ?? editingWidget?.widget_config ?? {}

  const [title, setTitle] = useState(
    editingWidget?.title
    ?? (defaultConfig as Record<string, string>).title
    ?? starterConfig?.config_name
    ?? ''
  )
  const [size, setSize] = useState<WidgetSize>(editingWidget?.size ?? 'medium')
  const [assignedTo, setAssignedTo] = useState(editingWidget?.assigned_member_id ?? memberId)
  const [trackerType] = useState<string>(
    editingWidget?.template_type ?? starterConfig?.tracker_type ?? 'tally'
  )
  const [visualVariant] = useState<string | undefined>(
    editingWidget?.visual_variant ?? starterConfig?.visual_variant ?? undefined
  )
  const [configFields, setConfigFields] = useState<Record<string, unknown>>(defaultConfig)

  // Multiplayer state
  const supportsMultiplayer = MULTIPLAYER_TRACKER_TYPES.includes(trackerType as TrackerType)
  const [mpEnabled, setMpEnabled] = useState(false)
  const [mpParticipants, setMpParticipants] = useState<string[]>([])
  const [mpMode, setMpMode] = useState<MultiplayerMode>('both')
  const [mpVisualStyle, setMpVisualStyle] = useState<MultiplayerVisualStyle>('colored_bars')
  const [mpSharedTarget, setMpSharedTarget] = useState<number | null>(null)
  const [mpExpanded, setMpExpanded] = useState(false)

  // PRD-18 Phase C Enhancement 6: Rhythm surfacing
  // rhythm_keys lives inside widget_config as a TEXT[] sub-field.
  // Mom picks which rhythms this tracker should appear in. Default: [].
  const initialRhythmKeys =
    (defaultConfig as { rhythm_keys?: string[] }).rhythm_keys ?? []
  const [rhythmKeys, setRhythmKeys] = useState<string[]>(initialRhythmKeys)
  const [rhythmsExpanded, setRhythmsExpanded] = useState(initialRhythmKeys.length > 0)

  const toggleRhythmKey = (key: string) => {
    setRhythmKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Reward Reveal config
  const [revealConfig, setRevealConfig] = useState<RevealAttachmentConfig | null>(null)

  const updateField = useCallback((key: string, value: unknown) => {
    setConfigFields(prev => ({ ...prev, [key]: value }))
  }, [])

  const meta = getTrackerMeta(trackerType)

  const toggleParticipant = (id: string) => {
    setMpParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const selectAllParticipants = () => {
    if (mpParticipants.length === familyMembers.length) {
      setMpParticipants([])
    } else {
      setMpParticipants(familyMembers.map(m => m.id))
    }
  }

  const handleDeploy = () => {
    const widget: CreateWidget = {
      family_id: familyId,
      family_member_id: assignedTo,
      template_type: trackerType as TrackerType,
      visual_variant: visualVariant ?? null,
      title: title.replace('[Name]', familyMembers.find(m => m.id === assignedTo)?.display_name ?? ''),
      size,
      widget_config: {
        ...configFields,
        // PRD-18 Phase C Enhancement 6: rhythm_keys surfaces this tracker
        // in the selected rhythms' "Rhythm Tracker Prompts" section.
        ...(rhythmKeys.length > 0 ? { rhythm_keys: rhythmKeys } : {}),
        ...(mpEnabled ? {
          multiplayer_enabled: true,
          multiplayer_participants: mpParticipants,
          multiplayer_mode: mpMode,
          multiplayer_visual_style: mpVisualStyle,
          multiplayer_shared_target: mpSharedTarget,
        } : {}),
      },
      assigned_member_id: assignedTo !== memberId ? assignedTo : undefined,
    }
    onDeploy(widget)
    onClose()
  }

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={handleDeploy}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        <LayoutDashboard size={16} />
        Deploy to Dashboard
      </button>
      {onSaveAsTemplate && (
        <button
          onClick={() => {
            onSaveAsTemplate({
              family_id: familyId,
              family_member_id: memberId,
              template_type: trackerType as TrackerType,
              visual_variant: visualVariant,
              title,
              size,
              widget_config: configFields,
              assigned_member_id: assignedTo !== memberId ? assignedTo : undefined,
            })
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <Save size={16} />
          Save as Template
        </button>
      )}
    </div>
  )

  return (
    <ModalV2
      id="widget-configuration"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={editingWidget ? 'Edit Widget' : 'Configure Widget'}
      icon={Settings}
      footer={footer}
    >
      <div className="p-4 space-y-5">
        {/* Tracker type info */}
        {meta && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>{meta.label}</span>
            {visualVariant && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
              >
                {visualVariant.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Common fields */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Title</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Assigned To</span>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              {familyMembers.map(m => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Size</span>
            <div className="flex gap-2 mt-1">
              {(['small', 'medium', 'large'] as WidgetSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: size === s ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                    color: size === s ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                    border: size === s ? 'none' : '1px solid var(--color-border-default)',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Template-specific fields */}
          <TemplateSpecificFields trackerType={trackerType} config={configFields} onChange={updateField} />
        </div>

        {/* Multiplayer Configuration */}
        {supportsMultiplayer && (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border-default)' }}
          >
            <button
              onClick={() => setMpExpanded(!mpExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2.5"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <Users size={16} style={{ color: 'var(--color-accent)' }} />
              <span className="text-sm font-medium flex-1 text-left" style={{ color: 'var(--color-text-primary)' }}>
                Multiplayer
              </span>
              {mpEnabled && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
                  ON
                </span>
              )}
              {mpExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {mpExpanded && (
              <div className="p-3 space-y-4" style={{ background: 'var(--color-bg-primary)' }}>
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Enable Multiplayer</span>
                  <button
                    onClick={() => setMpEnabled(!mpEnabled)}
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ background: mpEnabled ? 'var(--color-accent)' : 'var(--color-bg-tertiary)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                      style={{
                        background: 'var(--color-bg-primary)',
                        left: mpEnabled ? '22px' : '2px',
                      }}
                    />
                  </button>
                </div>

                {mpEnabled && (
                  <>
                    {/* Participants — colored pill selector */}
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Participants</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <button
                          onClick={selectAllParticipants}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{
                            background: mpParticipants.length === familyMembers.length ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                            color: mpParticipants.length === familyMembers.length ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border-default)',
                          }}
                        >
                          Everyone
                        </button>
                        {familyMembers.map(m => {
                          const isSelected = mpParticipants.includes(m.id)
                          const color = getMemberColor(m)
                          return (
                            <button
                              key={m.id}
                              onClick={() => toggleParticipant(m.id)}
                              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                              style={{
                                background: isSelected ? color : 'transparent',
                                color: isSelected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                                border: `2px solid ${color}`,
                              }}
                            >
                              {m.display_name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Mode — radio cards */}
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Mode</span>
                      <div className="space-y-1.5 mt-1.5">
                        {([
                          { value: 'collaborative' as MultiplayerMode, label: 'Collaborative', desc: 'Work together toward a shared goal' },
                          { value: 'competitive' as MultiplayerMode, label: 'Competitive', desc: 'See who\'s doing the most' },
                          { value: 'both' as MultiplayerMode, label: 'Both', desc: 'Shared goal + individual tracking', recommended: true },
                        ]).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setMpMode(opt.value)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                            style={{
                              background: mpMode === opt.value ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-primary))' : 'var(--color-bg-secondary)',
                              border: mpMode === opt.value ? '2px solid var(--color-accent)' : '1px solid var(--color-border-default)',
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: mpMode === opt.value ? 'var(--color-accent)' : 'var(--color-border-default)' }}
                            >
                              {mpMode === opt.value && (
                                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                                {opt.label}
                                {opt.recommended && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{opt.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Style */}
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Visual Style</span>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        {([
                          { value: 'colored_bars' as MultiplayerVisualStyle, label: 'Colored Bars' },
                          { value: 'colored_segments' as MultiplayerVisualStyle, label: 'Stacked Segments' },
                          { value: 'colored_markers' as MultiplayerVisualStyle, label: 'Colored Markers' },
                          { value: 'colored_stars' as MultiplayerVisualStyle, label: 'Colored Stars' },
                        ]).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setMpVisualStyle(opt.value)}
                            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center"
                            style={{
                              background: mpVisualStyle === opt.value ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                              color: mpVisualStyle === opt.value ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                              border: mpVisualStyle === opt.value ? 'none' : '1px solid var(--color-border-default)',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shared Target (collaborative/both) */}
                    {(mpMode === 'collaborative' || mpMode === 'both') && (
                      <label className="block">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Shared Target (optional)</span>
                        <input
                          type="number"
                          value={mpSharedTarget ?? ''}
                          onChange={e => setMpSharedTarget(e.target.value ? Number(e.target.value) : null)}
                          placeholder="Combined goal"
                          className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-default)',
                          }}
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* PRD-18 Phase C Enhancement 6: Show in Rhythms */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--color-border-default)' }}
        >
          <button
            onClick={() => setRhythmsExpanded(!rhythmsExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2.5"
            style={{ background: 'var(--color-bg-secondary)' }}
          >
            <Clock size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-medium flex-1 text-left" style={{ color: 'var(--color-text-primary)' }}>
              Show in Rhythms
            </span>
            {rhythmKeys.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-primary)' }}>
                {rhythmKeys.length}
              </span>
            )}
            {rhythmsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {rhythmsExpanded && (
            <div className="p-3 space-y-3" style={{ background: 'var(--color-bg-primary)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                This tracker will appear in the rhythms you check. It still lives on the dashboard too — rhythms are a quick entry point.
              </p>
              <div className="space-y-1.5">
                {SYSTEM_RHYTHM_KEYS_FOR_WIDGETS.map(rhythm => {
                  const checked = rhythmKeys.includes(rhythm.key)
                  return (
                    <label
                      key={rhythm.key}
                      className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
                      style={{
                        background: checked
                          ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-secondary))'
                          : 'var(--color-bg-secondary)',
                        border: checked
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border-default)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRhythmKey(rhythm.key)}
                        className="accent-current"
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                        {rhythm.label}
                      </span>
                    </label>
                  )
                })}
                <p
                  className="text-xs px-3 py-1.5 italic"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Custom rhythms (coming soon)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reward Reveal — celebrate every N data points */}
        <AttachRevealSection
          value={revealConfig}
          onChange={setRevealConfig}
          familyId={familyId}
          showTriggerConfig
          variant="collapsible"
        />
      </div>
    </ModalV2>
  )
}

// ── Template-specific fields ────────────────────────────────

function TemplateSpecificFields({
  trackerType,
  config,
  onChange,
}: {
  trackerType: string
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  switch (trackerType) {
    case 'tally':
      return (
        <div className="space-y-3">
          <NumberField label="Target Goal" field="target_number" config={config} onChange={onChange} />
          <TextField label="Unit" field="measurement_unit" config={config} onChange={onChange} placeholder="books, glasses, sessions..." />
        </div>
      )
    case 'streak':
      return (
        <div className="space-y-3">
          <SelectField label="Grace Period" field="grace_period" config={config} onChange={onChange}
            options={[{ value: '0', label: 'Strict (no missed days)' }, { value: '1', label: '1 day grace period' }]}
          />
        </div>
      )
    case 'percentage':
      return (
        <div className="space-y-3">
          <NumberField label="Goal Percentage" field="goal_percentage" config={config} onChange={onChange} />
        </div>
      )
    case 'checklist':
      return (
        <div className="space-y-3">
          <TextAreaField label="Checklist Items (one per line)" field="checklist_items" config={config} onChange={onChange} />
        </div>
      )
    case 'multi_habit_grid':
      return (
        <div className="space-y-3">
          <TextAreaField label="Habits to Track (one per line)" field="default_habits" config={config} onChange={onChange} />
          <SelectField label="Grid Size" field="grid_size" config={config} onChange={onChange}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
          />
        </div>
      )
    case 'boolean_checkin':
      return (
        <div className="space-y-3">
          <SelectField label="Check-In Frequency" field="frequency" config={config} onChange={onChange}
            options={[{ value: 'daily', label: 'Every day' }, { value: 'weekdays', label: 'Weekdays only' }, { value: 'custom', label: 'Specific days' }]}
          />
        </div>
      )
    case 'sequential_path':
      return (
        <div className="space-y-3">
          <TextAreaField label="Steps (one per line)" field="steps" config={config} onChange={onChange} />
          <TextField label="Prize at End (optional)" field="prize_label" config={config} onChange={onChange} placeholder="e.g. Pizza party!" />
        </div>
      )
    case 'achievement_badge':
      return (
        <div className="space-y-3">
          <TextAreaField label="Badge Names (one per line)" field="badge_names" config={config} onChange={onChange} />
          <TextAreaField label="Unlock Criteria (one per line, matching badges)" field="badge_criteria" config={config} onChange={onChange} />
        </div>
      )
    case 'xp_level':
      return (
        <div className="space-y-3">
          <TextField label="Level Thresholds (comma-separated)" field="level_thresholds_text" config={config} onChange={(k, v) => {
            onChange(k, v)
            const nums = String(v).split(',').map(n => Number(n.trim())).filter(n => !isNaN(n) && n > 0)
            onChange('level_thresholds', nums)
          }} placeholder="100, 250, 500, 1000" />
          <NumberField label="XP per Tap" field="xp_increment" config={config} onChange={onChange} />
        </div>
      )
    case 'allowance_calculator':
      return (
        <div className="space-y-3">
          <NumberField label="Base Allowance Amount ($)" field="base_amount" config={config} onChange={onChange} />
          <SelectField label="Pay Period" field="calculation_period" config={config} onChange={onChange}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Biweekly' }, { value: 'monthly', label: 'Monthly' }]}
          />
          <SelectField label="Calculation Method" field="calculation_method" config={config} onChange={onChange}
            options={[{ value: 'percentage', label: '% of completion' }, { value: 'fixed_per_task', label: 'Fixed per task' }, { value: 'points_weighted', label: 'Points-weighted' }]}
          />
          <NumberField label="Total Tasks per Period" field="total_tasks_per_period" config={config} onChange={onChange} />
          <NumberField label="Bonus Threshold (%)" field="bonus_threshold_display" config={config} onChange={(k, v) => {
            onChange(k, v)
            onChange('bonus_threshold', Number(v) / 100)
          }} />
        </div>
      )
    case 'leaderboard':
      return (
        <div className="space-y-3">
          <SelectField label="Ranked Metric" field="metric_source" config={config} onChange={onChange}
            options={[
              { value: 'tasks_completed', label: 'Tasks Completed' },
              { value: 'points', label: 'Points Earned' },
              { value: 'streak_days', label: 'Streak Days' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          <SelectField label="Period" field="period" config={config} onChange={onChange}
            options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
          />
        </div>
      )
    case 'mood_rating':
      return (
        <div className="space-y-3">
          <SelectField label="Scale Type" field="scale_type" config={config} onChange={onChange}
            options={[{ value: '1-5', label: '5-point (faces)' }, { value: '1-10', label: '10-point numeric' }, { value: 'custom', label: 'Custom labels' }]}
          />
          <SelectField label="Frequency" field="frequency" config={config} onChange={onChange}
            options={[{ value: 'once_daily', label: 'Once per day' }, { value: 'multiple', label: 'Multiple per day' }]}
          />
        </div>
      )
    case 'countdown':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Target Date</span>
            <input
              type="date"
              value={String(config.target_date ?? '')}
              onChange={e => onChange('target_date', e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            />
          </label>
          <TextField label="Emoji (optional)" field="emoji" config={config} onChange={onChange} placeholder="e.g. 🏖 🎂 🎄" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Recurring Annually</span>
            <button
              onClick={() => onChange('recurring_annually', !config.recurring_annually)}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background: config.recurring_annually ? 'var(--color-accent)' : 'var(--color-bg-tertiary)' }}
            >
              <div
                className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                style={{
                  background: 'var(--color-bg-primary)',
                  left: config.recurring_annually ? '22px' : '2px',
                }}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Show &quot;Today is the day!&quot;</span>
            <button
              onClick={() => onChange('show_on_target_day', config.show_on_target_day === false ? true : false)}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background: config.show_on_target_day !== false ? 'var(--color-accent)' : 'var(--color-bg-tertiary)' }}
            >
              <div
                className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                style={{
                  background: 'var(--color-bg-primary)',
                  left: config.show_on_target_day !== false ? '22px' : '2px',
                }}
              />
            </button>
          </div>
          <TextField label="Message at Zero" field="title_at_zero" config={config} onChange={onChange} placeholder="Today is the day!" />
        </div>
      )
    case 'timer_duration':
      return (
        <div className="space-y-3">
          <SelectField label="Unit" field="unit" config={config} onChange={onChange}
            options={[{ value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }]}
          />
          <NumberField label="Goal per Period" field="goal_per_period" config={config} onChange={onChange} />
          <SelectField label="Reset Period" field="reset_period" config={config} onChange={onChange}
            options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
          />
          <SelectField label="Timer Mode" field="timer_mode" config={config} onChange={onChange}
            options={[{ value: 'manual', label: 'Manual entry only' }, { value: 'start_stop', label: 'Start/Stop timer' }, { value: 'both', label: 'Both' }]}
          />
        </div>
      )
    case 'snapshot_comparison':
      return (
        <div className="space-y-3">
          <TextField label="Metric Name" field="metric_name" config={config} onChange={onChange} placeholder="Typing speed, Weight, Score..." />
          <TextField label="Unit" field="unit" config={config} onChange={onChange} placeholder="WPM, lbs, points..." />
          <SelectField label="Snapshot Frequency" field="snapshot_frequency" config={config} onChange={onChange}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]}
          />
        </div>
      )
    case 'privilege_status':
      return (
        <div className="space-y-3">
          <NumberField label="Red Zone (below %)" field="red_threshold" config={config} onChange={onChange} />
          <NumberField label="Yellow Zone (below %)" field="yellow_threshold" config={config} onChange={onChange} />
          <TextField label="Red Zone Description" field="red_description" config={config} onChange={onChange} placeholder="What applies when below the red threshold..." />
          <TextField label="Yellow Zone Description" field="yellow_description" config={config} onChange={onChange} placeholder="What applies in the yellow zone..." />
          <TextField label="Green Zone Description" field="green_description" config={config} onChange={onChange} placeholder="What applies when at or above the yellow threshold..." />
          <SelectField label="Calculate completion using..." field="fallback_calculation_mode" config={config} onChange={onChange}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'this_week', label: 'This week' },
              { value: 'rolling_7', label: 'Rolling 7 days' },
              { value: 'this_month', label: 'This month' },
              { value: 'rolling_30', label: 'Rolling 30 days' },
            ]}
          />
        </div>
      )
    default:
      return null
  }
}

// ── Field components ────────────────────────────────────────

function NumberField({ label, field, config, onChange }: {
  label: string; field: string; config: Record<string, unknown>; onChange: (k: string, v: unknown) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <input
        type="number"
        value={String(config[field] ?? '')}
        onChange={e => onChange(field, e.target.value ? Number(e.target.value) : null)}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      />
    </label>
  )
}

function TextField({ label, field, config, onChange, placeholder }: {
  label: string; field: string; config: Record<string, unknown>; onChange: (k: string, v: unknown) => void; placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <input
        type="text"
        value={String(config[field] ?? '')}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      />
    </label>
  )
}

function SelectField({ label, field, config, onChange, options }: {
  label: string; field: string; config: Record<string, unknown>; onChange: (k: string, v: unknown) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <select
        value={String(config[field] ?? options[0]?.value ?? '')}
        onChange={e => onChange(field, e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function TextAreaField({ label, field, config, onChange }: {
  label: string; field: string; config: Record<string, unknown>; onChange: (k: string, v: unknown) => void
}) {
  const value = Array.isArray(config[field])
    ? (config[field] as string[]).join('\n')
    : String(config[field] ?? '')

  return (
    <label className="block">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <textarea
        value={value}
        onChange={e => {
          const lines = e.target.value.split('\n').filter(l => l.trim())
          onChange(field, lines)
        }}
        rows={4}
        className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      />
    </label>
  )
}
