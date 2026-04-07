/**
 * PRD-09A Screen 6: Sequential collection creation flow.
 * Manual input (type items per line), URL list, or Image/OCR (placeholder).
 */

import { useState } from 'react'
import { List, Link, Camera, Sparkles, GraduationCap, BookOpen } from 'lucide-react'
import { BulkAddWithAI, Toggle } from '@/components/shared'
import { CurriculumParseModal } from '@/components/studio/CurriculumParseModal'
import type { CurriculumParseItem } from '@/components/studio/CurriculumParseModal'
import type { AdvancementMode } from '@/types/tasks'

interface SequentialCreatorProps {
  familyId: string
  /** Build J: creator member id for Edge Function cost logging */
  memberId?: string
  onSave: (data: SequentialCreateData) => void
  onCancel: () => void
  /** Build J: optional initial defaults (used by Reading List template) */
  initialDefaults?: Partial<SequentialCreateDefaults>
}

export interface SequentialCreateDefaults {
  defaultAdvancementMode: AdvancementMode
  defaultPracticeTarget: number | null
  defaultRequireApproval: boolean
  defaultRequireEvidence: boolean
  defaultTrackDuration: boolean
}

/** A single sequential item — just a title for manual entry, or with metadata
 *  from curriculum-parse (advancement mode suggestions + URL + practice target). */
export interface SequentialCreateItem {
  title: string
  description?: string | null
  url?: string | null
  advancement_mode?: AdvancementMode
  practice_target?: number | null
  require_mastery_approval?: boolean
  require_mastery_evidence?: boolean
  track_duration?: boolean
}

export interface SequentialCreateData extends SequentialCreateDefaults {
  title: string
  items: SequentialCreateItem[]
  inputMethod: 'manual' | 'url' | 'image'
  lifeAreaTag?: string
  promotionTiming: 'immediate' | 'next_day' | 'manual'
  activeCount: number
}

export function SequentialCreator({
  familyId,
  memberId,
  onSave,
  onCancel,
  initialDefaults,
}: SequentialCreatorProps) {
  const [title, setTitle] = useState('')
  const [inputMethod, setInputMethod] = useState<'manual' | 'url' | 'image'>('manual')
  const [rawText, setRawText] = useState('')
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showCurriculumParse, setShowCurriculumParse] = useState(false)
  // Build J: when mom accepts curriculum-parsed items, they're cached here
  // with full per-item metadata (advancement mode, URL, practice target).
  // At save time, these take precedence over rawText items to preserve the
  // AI's suggestions. Cleared on any rawText edit to avoid stale state.
  const [parsedItems, setParsedItems] = useState<SequentialCreateItem[] | null>(null)
  const [promotionTiming, setPromotionTiming] = useState<'immediate' | 'next_day' | 'manual'>(
    initialDefaults?.defaultTrackDuration || initialDefaults?.defaultAdvancementMode === 'mastery'
      ? 'manual'
      : 'immediate',
  )
  const [activeCount, setActiveCount] = useState(1)

  // Build J: advancement defaults (collection-level bulk-set-then-override)
  const [defaultAdvancementMode, setDefaultAdvancementMode] = useState<AdvancementMode>(
    initialDefaults?.defaultAdvancementMode ?? 'complete',
  )
  const [defaultPracticeTarget, setDefaultPracticeTarget] = useState<number | null>(
    initialDefaults?.defaultPracticeTarget ?? 5,
  )
  const [defaultRequireApproval, setDefaultRequireApproval] = useState<boolean>(
    initialDefaults?.defaultRequireApproval ?? true,
  )
  const [defaultRequireEvidence, setDefaultRequireEvidence] = useState<boolean>(
    initialDefaults?.defaultRequireEvidence ?? false,
  )
  const [defaultTrackDuration, setDefaultTrackDuration] = useState<boolean>(
    initialDefaults?.defaultTrackDuration ?? false,
  )

  // Manual textarea items (one per line). These are used when parsedItems
  // is null — i.e. mom typed items by hand or used the simple BulkAddWithAI.
  const manualItems: SequentialCreateItem[] = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => ({ title: line }))

  const effectiveItems: SequentialCreateItem[] = parsedItems ?? manualItems
  const itemCount = effectiveItems.length

  function handleSave() {
    if (!title.trim() || effectiveItems.length === 0) return
    onSave({
      title: title.trim(),
      items: effectiveItems,
      inputMethod,
      promotionTiming,
      activeCount,
      defaultAdvancementMode,
      defaultPracticeTarget: defaultAdvancementMode === 'practice_count' ? defaultPracticeTarget : null,
      defaultRequireApproval,
      defaultRequireEvidence,
      defaultTrackDuration,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
        New Sequential Collection
      </h3>

      {/* Title */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Collection Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Saxon Math 5 — Chapters"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Input method */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Input Method
        </label>
        <div className="flex gap-2">
          {([
            { key: 'manual' as const, label: 'Type Items', icon: List },
            { key: 'url' as const, label: 'URL List', icon: Link },
            { key: 'image' as const, label: 'Image/OCR', icon: Camera },
          ]).map(m => (
            <button
              key={m.key}
              onClick={() => setInputMethod(m.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: inputMethod === m.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: inputMethod === m.key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
                border: `1px solid ${inputMethod === m.key ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items textarea */}
      {(inputMethod === 'manual' || inputMethod === 'url') && (
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {inputMethod === 'manual' ? 'Items (one per line)' : 'URLs (one per line)'}
          </label>
          <textarea
            value={rawText}
            onChange={e => {
              setRawText(e.target.value)
              // Clear curriculum-parsed items when mom manually edits the textarea
              // so we don't ship stale metadata alongside modified titles.
              if (parsedItems) setParsedItems(null)
            }}
            rows={8}
            placeholder={
              inputMethod === 'manual'
                ? 'Chapter 1 — Introduction\nChapter 2 — Place Value\nChapter 3 — Addition'
                : 'https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...'
            }
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          {itemCount > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} detected
              {parsedItems && ' (from curriculum parse — per-item advancement preserved)'}
            </p>
          )}
        </div>
      )}

      {inputMethod === 'image' && (
        <div
          className="flex flex-col items-center gap-2 py-8 rounded-lg"
          style={{ background: 'var(--color-bg-secondary)', border: '2px dashed var(--color-border)' }}
        >
          <Camera size={24} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Image/OCR parsing coming soon — use manual input for now
          </p>
        </div>
      )}

      {/* AI Bulk Parse button (simple list) */}
      <button
        type="button"
        onClick={() => setShowBulkAdd(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full justify-center"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-btn-primary-bg)',
          border: '1px dashed var(--color-border)',
        }}
      >
        <Sparkles size={14} />
        Paste a table of contents or syllabus — AI will parse it
      </button>

      {/* Build J: Curriculum Parse button (advanced — suggests advancement modes + URLs) */}
      <button
        type="button"
        onClick={() => setShowCurriculumParse(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full justify-center"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-btn-primary-bg)',
          border: '1px dashed var(--color-border)',
        }}
      >
        <BookOpen size={14} />
        Paste curriculum — LiLa suggests advancement modes
      </button>

      {showBulkAdd && (
        <BulkAddWithAI
          title="AI Parse — Sequential Items"
          placeholder={'Paste a table of contents, syllabus, chapter list, or lesson plan. E.g.:\n\nChapter 1: Introduction to Place Value\nChapter 2: Addition & Subtraction Strategies\nChapter 3: Multiplication Concepts\n\nOr paste URLs, video titles, or any ordered content.'}
          hint="AI will extract ordered items and preserve their sequence. Works with chapter lists, syllabi, video playlists, and more."
          parsePrompt='Parse the following text into an ordered list of sequential items (chapters, lessons, steps, etc.). Preserve the original order. Remove numbering prefixes but keep the descriptive text. Return a JSON array of strings: ["item1", "item2", ...].'
          onSave={async (parsed) => {
            const newItems = parsed.filter(i => i.selected).map(i => i.text)
            if (newItems.length > 0) {
              // Append to existing rawText
              const existing = rawText.trim()
              setRawText(existing ? existing + '\n' + newItems.join('\n') : newItems.join('\n'))
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}

      {/* Build J: Curriculum Parse modal (dedicated curriculum-parse Edge Function) */}
      {showCurriculumParse && memberId && (
        <CurriculumParseModal
          isOpen={showCurriculumParse}
          onClose={() => setShowCurriculumParse(false)}
          listType="sequential"
          familyId={familyId}
          memberId={memberId}
          onAccept={(incoming: CurriculumParseItem[]) => {
            // Store the parsed items with full per-item metadata so they flow
            // through to handleSave with their AI-suggested advancement modes,
            // URLs, and practice targets intact. The textarea still reflects
            // the titles for mom's reference, but the authoritative data is
            // in parsedItems state until mom manually edits the textarea.
            const enriched: SequentialCreateItem[] = incoming.map(item => ({
              title: item.title,
              description: item.notes ?? null,
              url: item.url ?? null,
              advancement_mode: item.suggested_advancement_mode,
              practice_target: item.suggested_practice_target,
              require_mastery_approval: item.suggested_require_approval ?? undefined,
            }))
            setParsedItems(enriched)
            setRawText(incoming.map(i => i.title).join('\n'))
            setShowCurriculumParse(false)
          }}
        />
      )}

      {/* Promotion timing */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          When next item activates
        </label>
        <div className="flex gap-2">
          {([
            { key: 'immediate' as const, label: 'Immediately' },
            { key: 'next_day' as const, label: 'Next day' },
            { key: 'manual' as const, label: 'Manual' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setPromotionTiming(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: promotionTiming === t.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: promotionTiming === t.key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active count */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Active items at once
        </label>
        <input
          type="number"
          min={1}
          max={5}
          value={activeCount}
          onChange={e => setActiveCount(parseInt(e.target.value) || 1)}
          className="w-20 px-3 py-1.5 rounded-lg text-sm text-center"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Build J: Advancement defaults section — bulk-set-then-override pattern */}
      <div
        className="pt-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <label
            className="text-xs font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Advancement defaults
          </label>
        </div>
        <p
          className="text-xs mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          How each item advances. Applies to every item by default — you can override any item individually later.
        </p>

        {/* Mode selector */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {([
            { key: 'complete' as const, label: 'Complete once' },
            { key: 'practice_count' as const, label: 'Practice N times' },
            { key: 'mastery' as const, label: 'Mastery' },
          ]).map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => setDefaultAdvancementMode(m.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: defaultAdvancementMode === m.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: defaultAdvancementMode === m.key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Practice target — only shown for practice_count */}
        {defaultAdvancementMode === 'practice_count' && (
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Default practice target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={defaultPracticeTarget ?? 5}
                onChange={e => setDefaultPracticeTarget(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-1.5 rounded-lg text-sm text-center"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                practices before the next item unlocks
              </span>
            </div>
          </div>
        )}

        {/* Approval — only shown for mastery */}
        {defaultAdvancementMode === 'mastery' && (
          <div className="mb-2">
            <Toggle
              checked={defaultRequireApproval}
              onChange={setDefaultRequireApproval}
              label="Require mom approval when child submits for mastery"
              size="sm"
            />
          </div>
        )}

        {/* Evidence — only shown for mastery */}
        {defaultAdvancementMode === 'mastery' && (
          <div className="mb-2">
            <Toggle
              checked={defaultRequireEvidence}
              onChange={setDefaultRequireEvidence}
              label="Require photo or note on mastery submission"
              size="sm"
            />
          </div>
        )}

        {/* Duration tracking — shown always (Essential-tier feature) */}
        <div className="mb-1">
          <Toggle
            checked={defaultTrackDuration}
            onChange={setDefaultTrackDuration}
            label="Prompt for duration on each practice (how long?)"
            size="sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || effectiveItems.length === 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Create Collection ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
