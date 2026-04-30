/**
 * CurriculumParseModal — Build J (PRD-09A/09B Linked Steps, Enhancement E)
 *
 * Paste curriculum text — badge requirements, chapter lists, scope-and-sequence
 * documents, syllabi — and LiLa structures it into a list of items with
 * suggested advancement modes, URLs auto-detected, required flags, prerequisite
 * notes.
 *
 * Human-in-the-Mix: nothing flows into the creator until mom reviews and
 * approves. Each item is editable: title, notes, URL, advancement mode,
 * practice target, required flag. Mom can drop items she doesn't want.
 *
 * Calls the dedicated `curriculum-parse` Edge Function (Haiku). Same UX
 * pattern as RoutineBrainDump — paste, parse, review, accept.
 */

import { useState, useCallback } from 'react'
import {
  X,
  Loader,
  Sparkles,
  Trash2,
  Star,
  Check,
  ExternalLink,
  Info,
} from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import type { AdvancementMode } from '@/types/tasks'

// ─── Types ──────────────────────────────────────────────

export interface CurriculumParseItem {
  title: string
  notes: string | null
  resource_url: string | null
  is_required: boolean
  suggested_advancement_mode: AdvancementMode
  suggested_practice_target: number | null
  suggested_require_approval: boolean | null
  prerequisite_note: string | null
  sort_order: number
}

export interface CurriculumParseMetadata {
  source_name: string | null
  total_required: number | null
  pick_n_of_m: { n: number; m: number; required_count: number | null } | null
}

interface CurriculumParseModalProps {
  isOpen: boolean
  onClose: () => void
  /** 'sequential' | 'randomizer' — shapes the AI suggestions */
  listType: 'sequential' | 'randomizer'
  /** Mom accepts the parsed items — caller handles writing them to the source. */
  onAccept: (items: CurriculumParseItem[], metadata: CurriculumParseMetadata | null) => void
  /** Optional subject area hint passed to the AI */
  defaultSubjectArea?: string
  /** Optional target level hint passed to the AI */
  defaultTargetLevel?: string
  /** family_id + member_id for cost logging */
  familyId: string
  memberId: string
}

// ─── Component ──────────────────────────────────────────

export function CurriculumParseModal({
  isOpen,
  onClose,
  listType,
  onAccept,
  defaultSubjectArea,
  defaultTargetLevel,
  familyId,
  memberId,
}: CurriculumParseModalProps) {
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [rawText, setRawText] = useState('')
  const [subjectArea, setSubjectArea] = useState(defaultSubjectArea ?? '')
  const [targetLevel, setTargetLevel] = useState(defaultTargetLevel ?? '')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<CurriculumParseItem[]>([])
  const [metadata, setMetadata] = useState<CurriculumParseMetadata | null>(null)

  const resetAll = () => {
    setStep('input')
    setRawText('')
    setSubjectArea(defaultSubjectArea ?? '')
    setTargetLevel(defaultTargetLevel ?? '')
    setParsing(false)
    setError(null)
    setItems([])
    setMetadata(null)
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return
    setParsing(true)
    setError(null)

    try {
      // Call the dedicated curriculum-parse Edge Function directly.
      // We go through supabase.functions.invoke for auth + CORS handling.
      const { data, error: fnError } = await supabase.functions.invoke('curriculum-parse', {
        body: {
          raw_text: rawText.trim(),
          list_type: listType,
          context: {
            subject_area: subjectArea.trim() || undefined,
            target_level: targetLevel.trim() || undefined,
          },
          family_id: familyId,
          member_id: memberId,
        },
      })

      if (fnError) {
        setError(fnError.message ?? 'Failed to parse curriculum')
        setParsing(false)
        return
      }

      if (!data?.items || !Array.isArray(data.items)) {
        setError('AI returned an unexpected response. Try again or check the text.')
        setParsing(false)
        return
      }

      // Edge Function returns `url`; map to `resource_url` to match renamed column
      setItems((data.items as Array<Record<string, unknown>>).map(raw => ({
        ...raw,
        resource_url: (raw.url as string | null) ?? (raw.resource_url as string | null) ?? null,
      })) as CurriculumParseItem[])
      setMetadata((data.detected_metadata as CurriculumParseMetadata | null) ?? null)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong parsing the curriculum')
    } finally {
      setParsing(false)
    }
  }, [rawText, subjectArea, targetLevel, listType, familyId, memberId])

  const updateItem = (index: number, patch: Partial<CurriculumParseItem>) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i + 1 })))
  }

  const handleAccept = () => {
    if (items.length === 0) return
    onAccept(items, metadata)
    resetAll()
  }

  return (
    <ModalV2
      id="curriculum-parse"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      title={step === 'input' ? 'Paste curriculum' : 'Review parsed items'}
      icon={Sparkles}
      size="lg"
    >
      {step === 'input' && (
        <div className="flex flex-col gap-4 p-4">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Paste a block of curriculum text — badge requirements, a chapter list, a syllabus,
            a scope-and-sequence. LiLa will structure it into items with suggested advancement
            modes. You review every item before anything saves.
          </p>

          {/* Optional context */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Subject area (optional)
              </label>
              <input
                type="text"
                value={subjectArea}
                onChange={e => setSubjectArea(e.target.value)}
                placeholder="e.g. Math, Life Skills"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Level (optional)
              </label>
              <input
                type="text"
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
                placeholder="e.g. Level 3, Grade 6"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
          </div>

          {/* Curriculum text */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Curriculum text
            </label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={10}
              placeholder={`Paste your curriculum here. For example:

Chapter 1: Introduction to Fractions
Chapter 2: Adding Fractions — practice 10 problems
Chapter 3: Subtracting Fractions
* Chapter 4: Mixed Numbers (REQUIRED)
Chapter 5: Multiplying Fractions — demonstrate mastery

Or a badge requirement list, lesson plan, TOC, etc.`}
              className="w-full px-3 py-2 rounded-lg text-sm resize-vertical"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                minHeight: 200,
              }}
            />
          </div>

          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'color-mix(in srgb, var(--color-error, #dc2626) 10%, transparent)',
                color: 'var(--color-error, #dc2626)',
                border: '1px solid color-mix(in srgb, var(--color-error, #dc2626) 30%, transparent)',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleParse}
              disabled={parsing || !rawText.trim()}
              className="flex-1"
            >
              {parsing ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Parsing…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Parse curriculum
                </>
              )}
            </Button>
            <Button variant="secondary" size="md" onClick={handleClose} disabled={parsing}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
          {metadata && (metadata.source_name || metadata.total_required || metadata.pick_n_of_m) && (
            <div
              className="px-3 py-2.5 rounded-lg flex items-start gap-2"
              style={{
                background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
              }}
            >
              <Info
                size={14}
                style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0, marginTop: 2 }}
              />
              <div className="flex-1 text-xs" style={{ color: 'var(--color-text-primary)' }}>
                {metadata.source_name && (
                  <div className="font-semibold">{metadata.source_name}</div>
                )}
                {metadata.total_required != null && (
                  <div>{metadata.total_required} required of {items.length}</div>
                )}
                {metadata.pick_n_of_m && (
                  <div className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Note: detected a "pick {metadata.pick_n_of_m.n} of {metadata.pick_n_of_m.m}" pattern.
                    The list will still be created flat — pick-N selection logic is a future feature.
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Review each item. Edit titles, adjust advancement modes, or drop items you don't want.
            Nothing is saved until you click "Create collection."
          </p>

          {/* Items list */}
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-1"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => updateItem(idx, { title: e.target.value })}
                      placeholder="Item title"
                      className="w-full px-2 py-1.5 rounded text-sm font-medium"
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-heading)',
                        border: '1px solid var(--color-border)',
                      }}
                    />

                    {item.notes && (
                      <input
                        type="text"
                        value={item.notes}
                        onChange={e => updateItem(idx, { notes: e.target.value })}
                        placeholder="Notes (optional)"
                        className="w-full px-2 py-1 rounded text-xs"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                    )}

                    {/* URL — shown when AI detected one; editable */}
                    {item.resource_url && (
                      <div className="flex items-center gap-1.5">
                        <ExternalLink size={11} style={{ color: 'var(--color-btn-primary-bg)' }} />
                        <input
                          type="url"
                          value={item.resource_url}
                          onChange={e => updateItem(idx, { resource_url: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 px-2 py-1 rounded text-xs"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                      </div>
                    )}

                    {/* Prerequisite note — shown when AI detected one */}
                    {item.prerequisite_note && (
                      <div
                        className="text-xs px-2 py-1 rounded italic"
                        style={{
                          background: 'color-mix(in srgb, var(--color-warning, #eab308) 10%, transparent)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Note: {item.prerequisite_note}
                      </div>
                    )}

                    {/* Advancement mode + practice target */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['complete', 'practice_count', 'mastery'] as AdvancementMode[]).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateItem(idx, { suggested_advancement_mode: mode })}
                          className="px-2 py-1 rounded-full text-[10px] font-medium transition-colors"
                          style={{
                            background: item.suggested_advancement_mode === mode
                              ? 'var(--color-btn-primary-bg)'
                              : 'var(--color-bg-secondary)',
                            color: item.suggested_advancement_mode === mode
                              ? 'var(--color-btn-primary-text)'
                              : 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {mode === 'complete' ? 'Complete' : mode === 'practice_count' ? 'Practice N' : 'Mastery'}
                        </button>
                      ))}

                      {item.suggested_advancement_mode === 'practice_count' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={item.suggested_practice_target ?? 5}
                            onChange={e => updateItem(idx, { suggested_practice_target: parseInt(e.target.value, 10) || 1 })}
                            className="w-14 px-2 py-1 rounded text-xs text-center"
                            style={{
                              background: 'var(--color-bg-secondary)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                            }}
                          />
                          <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                            times
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItem(idx, { is_required: !item.is_required })}
                      className="p-1 rounded"
                      aria-label={item.is_required ? 'Mark as optional' : 'Mark as required'}
                      style={{
                        color: item.is_required
                          ? 'var(--color-warning, #eab308)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      <Star size={14} fill={item.is_required ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 rounded"
                      style={{ color: 'var(--color-text-secondary)' }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div
              className="px-3 py-6 rounded-lg text-xs text-center"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              All items removed. Go back to edit the source text.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 sticky bottom-0" style={{ background: 'var(--color-bg-card)' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setStep('input')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAccept}
              disabled={items.length === 0}
              className="flex-1"
            >
              <Check size={14} />
              Use these {items.length} {items.length === 1 ? 'item' : 'items'}
            </Button>
            <Button variant="secondary" size="md" onClick={handleClose}>
              <X size={14} />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </ModalV2>
  )
}
