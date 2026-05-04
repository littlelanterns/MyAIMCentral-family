/**
 * ShoppingListSettings — PRD-09B Living Shopping List
 *
 * Collapsible settings panel for always-on shopping lists.
 * Configures list-level defaults and per-section overrides for:
 *   - Checked item visibility (hours before moving to Recently Purchased)
 *   - Purchase history retention (days before items leave Recently Purchased)
 *   - Auto-archive (days before items are soft-archived by the cron job)
 */

import { useState } from 'react'
import { Settings2, ChevronDown, ChevronRight } from 'lucide-react'
import { useUpdateList, useListSectionSettings, useUpsertListSectionSettings } from '@/hooks/useLists'
import type { List, ListSectionSettings } from '@/types/lists'

interface Props {
  list: List
  familyId: string
  sectionNames: string[]
}

const VISIBILITY_OPTIONS = [
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day' },
  { value: 48, label: '2 days' },
  { value: 72, label: '3 days' },
  { value: 168, label: '1 week' },
]

const HISTORY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

const ARCHIVE_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
]

export function ShoppingListSettings({ list, familyId, sectionNames }: Props) {
  const [open, setOpen] = useState(false)
  const updateList = useUpdateList()
  const { data: sectionSettings = [] } = useListSectionSettings(list.id)
  const upsertSettings = useUpsertListSectionSettings()

  function getSectionSetting(sectionName: string): ListSectionSettings | undefined {
    return sectionSettings.find(s => s.section_name === sectionName)
  }

  function handleListDefault(field: 'default_checked_visibility_hours' | 'default_purchase_history_days' | 'default_auto_archive_days', value: number) {
    updateList.mutate({ id: list.id, [field]: value })
  }

  function handleSectionOverride(
    sectionName: string,
    field: 'checked_visibility_hours' | 'purchase_history_days' | 'auto_archive_days',
    value: number | null,
  ) {
    upsertSettings.mutate({
      familyId,
      listId: list.id,
      sectionName,
      updates: { [field]: value },
    })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-1 py-1 text-xs font-medium transition-colors"
        style={{ color: open ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
      >
        <Settings2 size={14} />
        List Settings
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {open && (
        <div
          className="rounded-lg p-3 space-y-4 mt-1"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          {/* List-level defaults */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-heading)' }}>
              List Defaults
            </p>

            <SettingRow
              label="Checked item visibility"
              helpText="How long checked items stay visible before moving to Recently Purchased"
              value={list.default_checked_visibility_hours ?? 48}
              options={VISIBILITY_OPTIONS}
              onChange={(v) => handleListDefault('default_checked_visibility_hours', v)}
            />

            <SettingRow
              label="Purchase history"
              helpText="How long items stay in Recently Purchased"
              value={list.default_purchase_history_days ?? 30}
              options={HISTORY_OPTIONS}
              onChange={(v) => handleListDefault('default_purchase_history_days', v)}
            />

            <SettingRow
              label="Auto-archive after"
              helpText="Items older than this are cleaned up automatically"
              value={list.default_auto_archive_days ?? 90}
              options={ARCHIVE_OPTIONS}
              onChange={(v) => handleListDefault('default_auto_archive_days', v)}
            />
          </div>

          {/* Per-section overrides */}
          {sectionNames.length > 0 && (
            <div className="space-y-2.5 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-heading)' }}>
                Section Overrides
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                Override defaults for specific store sections
              </p>

              {sectionNames.map(name => {
                const setting = getSectionSetting(name)
                return (
                  <SectionOverrideRow
                    key={name}
                    sectionName={name}
                    setting={setting}
                    listDefaults={{
                      visibility: list.default_checked_visibility_hours ?? 48,
                      history: list.default_purchase_history_days ?? 30,
                      archive: list.default_auto_archive_days ?? 90,
                    }}
                    onOverride={handleSectionOverride}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────

function SettingRow({ label, helpText, value, options, onChange }: {
  label: string
  helpText: string
  value: number
  options: { value: number; label: string }[]
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{helpText}</p>
      </div>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="px-2 py-1 rounded text-xs shrink-0"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function SectionOverrideRow({ sectionName, setting, listDefaults, onOverride }: {
  sectionName: string
  setting: ListSectionSettings | undefined
  listDefaults: { visibility: number; history: number; archive: number }
  onOverride: (sectionName: string, field: 'checked_visibility_hours' | 'purchase_history_days' | 'auto_archive_days', value: number | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasOverrides = setting && (
    setting.checked_visibility_hours != null ||
    setting.purchase_history_days != null ||
    setting.auto_archive_days != null
  )

  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span className="text-xs font-medium flex-1" style={{ color: 'var(--color-text-heading)' }}>
          {sectionName}
        </span>
        {hasOverrides && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
            custom
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 pl-4">
          <OverrideSelect
            label="Visibility"
            value={setting?.checked_visibility_hours ?? null}
            defaultValue={listDefaults.visibility}
            options={VISIBILITY_OPTIONS}
            onChange={(v) => onOverride(sectionName, 'checked_visibility_hours', v)}
          />
          <OverrideSelect
            label="History"
            value={setting?.purchase_history_days ?? null}
            defaultValue={listDefaults.history}
            options={HISTORY_OPTIONS}
            onChange={(v) => onOverride(sectionName, 'purchase_history_days', v)}
          />
          <OverrideSelect
            label="Auto-archive"
            value={setting?.auto_archive_days ?? null}
            defaultValue={listDefaults.archive}
            options={ARCHIVE_OPTIONS}
            onChange={(v) => onOverride(sectionName, 'auto_archive_days', v)}
          />
        </div>
      )}
    </div>
  )
}

function OverrideSelect({ label, value, defaultValue, options, onChange }: {
  label: string
  value: number | null
  defaultValue: number
  options: { value: number; label: string }[]
  onChange: (value: number | null) => void
}) {
  const defaultLabel = options.find(o => o.value === defaultValue)?.label ?? String(defaultValue)

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={e => {
          const raw = e.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
        className="px-1.5 py-0.5 rounded text-[10px] shrink-0"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: value != null ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <option value="">List default ({defaultLabel})</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
