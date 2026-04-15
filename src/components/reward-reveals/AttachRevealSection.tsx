/**
 * AttachRevealSection — Collapsible section for adding reward reveals
 * to tasks, widgets, lists, or intentions.
 *
 * Two paths:
 *   1. Inline: configure animation + prize right here
 *   2. Library: pick a named combo from /settings/reward-reveals
 *
 * Renders as a collapsible section matching the existing patterns
 * in TaskCreationModal and WidgetConfiguration.
 */

import { useState, useEffect } from 'react'
import { Gift, ChevronDown, ChevronRight, Library, Plus, X } from 'lucide-react'
import { RevealAnimationPicker } from './RevealAnimationPicker'
import { PrizeContentEditor } from './PrizeContentEditor'
import { CongratulationsMessagePicker } from './CongratulationsMessagePicker'
import { useRewardReveals } from '@/hooks/useRewardReveals'
import type {
  PrizeType,
  PrizeMode,
  AnimationRotation,
  PrizePoolEntry,
  RevealTriggerMode,
} from '@/types/reward-reveals'

export interface RevealAttachmentConfig {
  /** Use an existing library reveal (by ID) or null for inline */
  libraryRevealId: string | null
  // Inline config (used when libraryRevealId is null)
  animationIds: string[]
  animationRotation: AnimationRotation
  prizeMode: PrizeMode
  prizeType: PrizeType
  prizeText: string
  prizeName: string
  prizeImageUrl: string
  prizeAssetKey: string
  prizePool: PrizePoolEntry[]
  // Trigger config
  triggerMode: RevealTriggerMode
  triggerN: number | null
  isRepeating: boolean
}

const DEFAULT_CONFIG: RevealAttachmentConfig = {
  libraryRevealId: null,
  animationIds: [],
  animationRotation: 'sequential',
  prizeMode: 'fixed',
  prizeType: 'text',
  prizeText: '',
  prizeName: '',
  prizeImageUrl: '',
  prizeAssetKey: '',
  prizePool: [],
  triggerMode: 'on_completion',
  triggerN: null,
  isRepeating: true,
}

interface AttachRevealSectionProps {
  /** Current config (null = no reveal attached) */
  value: RevealAttachmentConfig | null
  /** Called when config changes */
  onChange: (config: RevealAttachmentConfig | null) => void
  /** Family ID for queries + image uploads */
  familyId: string
  /** Show trigger mode selector (useful for widgets with "every N") */
  showTriggerConfig?: boolean
  /** Style variant matching the parent's section pattern */
  variant?: 'section-card' | 'collapsible'
}

export function AttachRevealSection({
  value,
  onChange,
  familyId,
  showTriggerConfig = false,
  variant = 'collapsible',
}: AttachRevealSectionProps) {
  const [expanded, setExpanded] = useState(!!value)
  const [mode, setMode] = useState<'none' | 'inline' | 'library'>(
    value ? (value.libraryRevealId ? 'library' : 'inline') : 'none',
  )
  const { data: libraryReveals = [] } = useRewardReveals(familyId)
  const namedReveals = libraryReveals.filter((r) => r.name)

  // When toggling to "none", clear the config
  useEffect(() => {
    if (mode === 'none' && value) {
      onChange(null)
    }
  }, [mode, value, onChange])

  const handleSetInline = () => {
    setMode('inline')
    if (!value) onChange({ ...DEFAULT_CONFIG })
  }

  const handleSetLibrary = (id: string) => {
    setMode('library')
    onChange({
      ...DEFAULT_CONFIG,
      libraryRevealId: id,
    })
  }

  const handleClear = () => {
    setMode('none')
    setExpanded(false)
    onChange(null)
  }

  const update = <K extends keyof RevealAttachmentConfig>(
    key: K,
    val: RevealAttachmentConfig[K],
  ) => {
    if (!value) return
    onChange({ ...value, [key]: val })
  }

  if (variant === 'section-card') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <SectionHeader
          hasReveal={!!value}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onClear={handleClear}
        />
        {expanded && (
          <SectionBody
            mode={mode}
            value={value}
            namedReveals={namedReveals}
            familyId={familyId}
            showTriggerConfig={showTriggerConfig}
            onSetInline={handleSetInline}
            onSetLibrary={handleSetLibrary}
            onClear={handleClear}
            update={update}
          />
        )}
      </div>
    )
  }

  // Collapsible variant (matches WidgetConfiguration pattern)
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border-default)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <Gift size={16} style={{ color: 'var(--color-accent)' }} />
        <span
          className="text-sm font-medium flex-1 text-left"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Reward Reveal
        </span>
        {value && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text-on-primary)',
            }}
          >
            On
          </span>
        )}
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {expanded && (
        <div className="p-3 space-y-4" style={{ background: 'var(--color-bg-primary)' }}>
          <SectionBody
            mode={mode}
            value={value}
            namedReveals={namedReveals}
            familyId={familyId}
            showTriggerConfig={showTriggerConfig}
            onSetInline={handleSetInline}
            onSetLibrary={handleSetLibrary}
            onClear={handleClear}
            update={update}
          />
        </div>
      )}
    </div>
  )
}

// ── Section header for section-card variant ──

function SectionHeader({
  hasReveal,
  expanded,
  onToggle,
  onClear,
}: {
  hasReveal: boolean
  expanded: boolean
  onToggle: () => void
  onClear: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: 1,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
        }}
      >
        <Gift size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
        Reward Reveal
        {hasReveal && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
              fontWeight: 600,
            }}
          >
            Active
          </span>
        )}
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {hasReveal && (
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '0.25rem',
          }}
          aria-label="Remove reward reveal"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ── Section body (shared between both variants) ──

function SectionBody({
  mode,
  value,
  namedReveals,
  familyId,
  showTriggerConfig,
  onSetInline,
  onSetLibrary,
  onClear,
  update,
}: {
  mode: 'none' | 'inline' | 'library'
  value: RevealAttachmentConfig | null
  namedReveals: Array<{ id: string; name: string | null }>
  familyId: string
  showTriggerConfig: boolean
  onSetInline: () => void
  onSetLibrary: (id: string) => void
  onClear: () => void
  update: <K extends keyof RevealAttachmentConfig>(key: K, val: RevealAttachmentConfig[K]) => void
}) {
  if (mode === 'none') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Add a celebration moment when this is completed — a video reveal with a
          prize message, image, or surprise.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onSetInline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
            }}
          >
            <Plus size={14} /> Create new
          </button>
          {namedReveals.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) onSetLibrary(e.target.value)
              }}
              defaultValue=""
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Pick from library ({namedReveals.length})
              </option>
              {namedReveals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'library' && value?.libraryRevealId) {
    const selected = namedReveals.find((r) => r.id === value.libraryRevealId)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            border: '1px solid var(--color-border-accent, var(--color-btn-primary-bg))',
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
          }}
        >
          <Library size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span
            style={{
              flex: 1,
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {selected?.name ?? 'Library reveal'}
          </span>
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '0.25rem',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {showTriggerConfig && (
          <TriggerConfig value={value} update={update} />
        )}
      </div>
    )
  }

  // Inline mode — full configuration
  if (!value) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Animation picker */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Pick a reveal animation
        </label>
        <RevealAnimationPicker
          selectedIds={value.animationIds}
          onSelect={(ids) => update('animationIds', ids)}
          multiSelect={value.animationIds.length > 1}
        />
        {value.animationIds.length > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={value.animationIds.length > 1}
              onChange={(e) => {
                if (!e.target.checked && value.animationIds.length > 1) {
                  update('animationIds', [value.animationIds[0]])
                }
              }}
            />
            Rotate between multiple animations
          </label>
        )}
      </div>

      {/* Prize content */}
      <PrizeContentEditor
        prizeMode={value.prizeMode}
        onPrizeModeChange={(m) => update('prizeMode', m)}
        prizeType={value.prizeType}
        onPrizeTypeChange={(t) => update('prizeType', t)}
        prizeText={value.prizeText}
        onPrizeTextChange={(t) => update('prizeText', t)}
        prizeName={value.prizeName}
        onPrizeNameChange={(n) => update('prizeName', n)}
        prizeImageUrl={value.prizeImageUrl}
        onPrizeImageUrlChange={(u) => update('prizeImageUrl', u)}
        prizeAssetKey={value.prizeAssetKey}
        onPrizeAssetKeyChange={(k) => update('prizeAssetKey', k)}
        prizePool={value.prizePool}
        onPrizePoolChange={(p) => update('prizePool', p)}
        familyId={familyId}
      />

      {/* Message picker */}
      <CongratulationsMessagePicker
        value={value.prizeText}
        onChange={(t) => update('prizeText', t)}
        familyId={familyId}
        prizeName={value.prizeName}
      />

      {/* Trigger config */}
      {showTriggerConfig && (
        <TriggerConfig value={value} update={update} />
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onClear}
        style={{
          alignSelf: 'flex-start',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Remove reward reveal
      </button>
    </div>
  )
}

// ── Trigger config (every_n, on_completion, on_goal) ──

function TriggerConfig({
  value,
  update,
}: {
  value: RevealAttachmentConfig
  update: <K extends keyof RevealAttachmentConfig>(key: K, val: RevealAttachmentConfig[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        When to celebrate
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {([
          { value: 'on_completion' as const, label: 'Every time' },
          { value: 'every_n' as const, label: 'Every N' },
          { value: 'on_goal' as const, label: 'On goal' },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update('triggerMode', opt.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              border:
                value.triggerMode === opt.value
                  ? '1px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
              backgroundColor:
                value.triggerMode === opt.value
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                  : 'transparent',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value.triggerMode === 'every_n' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Celebrate every
          </span>
          <input
            type="number"
            min={2}
            value={value.triggerN ?? 5}
            onChange={(e) => update('triggerN', parseInt(e.target.value) || 5)}
            style={{
              width: '60px',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'center',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            completions
          </span>
        </div>
      )}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={value.isRepeating}
          onChange={(e) => update('isRepeating', e.target.checked)}
        />
        Keep celebrating (repeating)
      </label>
    </div>
  )
}
