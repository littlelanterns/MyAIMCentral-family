// PRD-10 Screen 4: Widget Configuration — adaptive form per tracker type
// Common fields: title, assigned to, size, goal, unit
// Template-specific fields loaded per tracker type
// Live preview updates as fields change

import { useState, useCallback } from 'react'
import { X, Eye, Save } from 'lucide-react'
import type { WidgetStarterConfig, WidgetSize, CreateWidget, TrackerType } from '@/types/widgets'
import { getTrackerMeta } from '@/types/widgets'

interface WidgetConfigurationProps {
  isOpen: boolean
  onClose: () => void
  starterConfig?: WidgetStarterConfig | null
  editingWidget?: CreateWidget | null
  familyId: string
  memberId: string
  familyMembers: { id: string; display_name: string }[]
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
  // Initialize from starter config or editing widget
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

  // Config fields (merged from default + user edits)
  const [configFields, setConfigFields] = useState<Record<string, unknown>>(defaultConfig)

  const updateField = useCallback((key: string, value: unknown) => {
    setConfigFields(prev => ({ ...prev, [key]: value }))
  }, [])

  const meta = getTrackerMeta(trackerType)

  const handleDeploy = () => {
    const widget: CreateWidget = {
      family_id: familyId,
      family_member_id: assignedTo,
      template_type: trackerType as TrackerType,
      visual_variant: visualVariant ?? null,
      title: title.replace('[Name]', familyMembers.find(m => m.id === assignedTo)?.display_name ?? ''),
      size,
      widget_config: configFields,
      assigned_member_id: assignedTo !== memberId ? assignedTo : undefined,
    }
    onDeploy(widget)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl mx-4"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-default)' }}
        >
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {editingWidget ? 'Edit Widget' : 'Configure Widget'}
          </h2>
          <button onClick={onClose} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Tracker type info */}
          {meta && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                {meta.label}
              </span>
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
            {/* Title */}
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

            {/* Assigned To */}
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

            {/* Size */}
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
            <TemplateSpecificFields
              trackerType={trackerType}
              config={configFields}
              onChange={updateField}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDeploy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              <Eye size={16} />
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
        </div>
      </div>
    </div>
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
