/**
 * PRD-18 Section Type #27 (Enhancement 1): Evening Tomorrow Capture
 *
 * Conversational tomorrow capture with fuzzy task matching. Rotating
 * prompt header (4 framings, date-seeded PRNG — same prompt all day
 * for the same member, rotates at midnight).
 *
 * Behavior:
 *   - 3 text inputs by default + [+ Add more] button (no hard cap)
 *   - Debounced 350ms fuzzy match against member's active tasks
 *   - On match: inline "Did you mean [Task Title]?" confirmation card
 *     - [Yes, that's it] → stores matchedTaskId, marks for priority='now' bump
 *     - [No, create new] → ignores match, treats as new task
 *   - NO writes happen mid-flow — all state is in memory
 *   - On Close My Day, the modal's handleComplete reads the staged
 *     items from RhythmMetadataContext and calls commitTomorrowCapture
 *     to execute the batched writes
 *
 * Overflow handling at 6+ items:
 *   - Gentle focus picker appears: "That's a full day! Want to pick
 *     your top 3 to focus on, or should we pick by due date?"
 *   - [Pick top 3] → checkboxes, user picks 3
 *   - [Auto by due date] → first 3 in insertion order (fallback)
 *   - All items still become real tasks on commit; only the 3
 *     focus_selected items surface in Morning Priorities Recall
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { Sparkles, Plus, Check, X, Circle, CheckCircle2, Star } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useRhythmMetadataStaging } from '../RhythmMetadataContext'
import { fuzzyMatchTask } from '@/lib/rhythm/fuzzyMatchTask'
import { rhythmSeed, pickOne } from '@/lib/rhythm/dateSeedPrng'
import { EVENING_TOMORROW_CAPTURE_PROMPTS } from '@/types/rhythms'
import type { StagedPriorityItem } from '@/lib/rhythm/commitTomorrowCapture'

interface Props {
  familyId: string
  memberId: string
}

interface InputRow {
  /** Stable client-side ID for React keys. */
  key: number
  text: string
  matchedTaskId: string | null
  matchedTaskTitle: string | null
  /** True once the user has explicitly confirmed or dismissed the match. */
  matchResolved: boolean
  focusSelected: boolean
}

const DEFAULT_ROW_COUNT = 3
const OVERFLOW_THRESHOLD = 6
const DEBOUNCE_MS = 350

export function EveningTomorrowCaptureSection({ familyId, memberId }: Props) {
  const { stagePriorityItems } = useRhythmMetadataStaging()

  // Load member's active tasks for fuzzy matching. Small result set —
  // filtered in-hook to pending/in_progress for this member.
  const { data: allTasks = [] } = useTasks(familyId, {
    assigneeId: memberId,
    status: ['pending', 'in_progress'],
  })

  // Shape tasks for the matcher — we only need id + title
  const taskCandidates = useMemo(
    () => allTasks.map(t => ({ id: t.id, title: t.title ?? '' })),
    [allTasks]
  )

  // Pick today's rotating prompt — deterministic via date-seeded PRNG
  const { promptText, promptIndex } = useMemo(() => {
    const seed = rhythmSeed(memberId, 'evening:tomorrow_capture')
    const prompt =
      pickOne(EVENING_TOMORROW_CAPTURE_PROMPTS as unknown as string[], seed) ??
      EVENING_TOMORROW_CAPTURE_PROMPTS[0]
    const idx = (EVENING_TOMORROW_CAPTURE_PROMPTS as readonly string[]).indexOf(prompt)
    return { promptText: prompt, promptIndex: idx >= 0 ? idx : 0 }
  }, [memberId])

  // Input rows state
  const [rows, setRows] = useState<InputRow[]>(() =>
    Array.from({ length: DEFAULT_ROW_COUNT }, (_, i) => ({
      key: i,
      text: '',
      matchedTaskId: null,
      matchedTaskTitle: null,
      matchResolved: false,
      focusSelected: true, // default all to focus until overflow triggers
    }))
  )

  // Overflow focus picker state
  const [overflowMode, setOverflowMode] = useState<
    'none' | 'prompt' | 'picking' | 'resolved'
  >('none')

  const nextKey = useRef(DEFAULT_ROW_COUNT)

  // ─── Stage to RhythmMetadataContext whenever rows change ──────
  useEffect(() => {
    const staged: StagedPriorityItem[] = rows
      .filter(r => r.text.trim().length > 0)
      .map(r => ({
        text: r.text,
        matchedTaskId: r.matchedTaskId,
        matchedTaskTitle: r.matchedTaskTitle,
        focusSelected: r.focusSelected,
        promptVariantIndex: promptIndex,
      }))
    // stagePriorityItems is a stable ref-backed callback; we convert
    // the StagedPriorityItem shape to the RhythmPriorityItem shape
    // by adding created_task_id=null and renaming matched fields.
    stagePriorityItems(
      staged.map(s => ({
        text: s.text,
        matched_task_id: s.matchedTaskId,
        matched_task_title: s.matchedTaskTitle,
        created_task_id: null, // populated at commit time
        focus_selected: s.focusSelected,
        prompt_variant_index: s.promptVariantIndex,
      }))
    )
  }, [rows, promptIndex, stagePriorityItems])

  // ─── Overflow detection ───────────────────────────────────────
  const populatedCount = rows.filter(r => r.text.trim().length > 0).length
  useEffect(() => {
    if (populatedCount >= OVERFLOW_THRESHOLD && overflowMode === 'none') {
      setOverflowMode('prompt')
    }
  }, [populatedCount, overflowMode])

  // ─── Debounced fuzzy match per row ────────────────────────────
  useEffect(() => {
    const timers: Record<number, ReturnType<typeof setTimeout>> = {}

    rows.forEach((row, idx) => {
      // Only match if text is meaningful AND user hasn't already
      // resolved the row (confirmed or dismissed)
      if (row.matchResolved || row.text.trim().length < 3) return

      timers[idx] = setTimeout(() => {
        const match = fuzzyMatchTask(row.text, taskCandidates)
        if (match && match.task.id !== row.matchedTaskId) {
          setRows(current =>
            current.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    matchedTaskId: match.task.id,
                    matchedTaskTitle: match.task.title,
                  }
                : r
            )
          )
        }
      }, DEBOUNCE_MS)
    })

    return () => {
      Object.values(timers).forEach(t => clearTimeout(t))
    }
    // Intentionally depend on text + resolved state per row — not on the
    // full rows array identity, which would retrigger on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map(r => `${r.text}|${r.matchResolved}`).join('|'), taskCandidates])

  // ─── Row handlers ─────────────────────────────────────────────
  const updateRowText = (index: number, text: string) => {
    setRows(current =>
      current.map((r, i) => {
        if (i !== index) return r
        // If the user is clearing or substantially changing the text,
        // reset match state so it can re-match
        const shouldResetMatch = text.trim().length < 3 || text !== r.text
        return {
          ...r,
          text,
          matchedTaskId: shouldResetMatch ? null : r.matchedTaskId,
          matchedTaskTitle: shouldResetMatch ? null : r.matchedTaskTitle,
          matchResolved: false,
        }
      })
    )
  }

  const confirmMatch = (index: number) => {
    setRows(current =>
      current.map((r, i) => (i === index ? { ...r, matchResolved: true } : r))
    )
  }

  const dismissMatch = (index: number) => {
    setRows(current =>
      current.map((r, i) =>
        i === index
          ? {
              ...r,
              matchedTaskId: null,
              matchedTaskTitle: null,
              matchResolved: true,
            }
          : r
      )
    )
  }

  const addRow = () => {
    setRows(current => [
      ...current,
      {
        key: nextKey.current++,
        text: '',
        matchedTaskId: null,
        matchedTaskTitle: null,
        matchResolved: false,
        focusSelected: true,
      },
    ])
  }

  const removeRow = (index: number) => {
    setRows(current => {
      const next = current.filter((_, i) => i !== index)
      // Ensure at least one row remains
      if (next.length === 0) {
        return [
          {
            key: nextKey.current++,
            text: '',
            matchedTaskId: null,
            matchedTaskTitle: null,
            matchResolved: false,
            focusSelected: true,
          },
        ]
      }
      return next
    })
  }

  // ─── Overflow picker handlers ─────────────────────────────────
  const autoPickByOrder = () => {
    // Auto-select the first 3 populated rows (by insertion order)
    let pickedCount = 0
    setRows(current =>
      current.map(r => {
        if (r.text.trim().length === 0) return { ...r, focusSelected: false }
        const shouldPick = pickedCount < 3
        if (shouldPick) pickedCount++
        return { ...r, focusSelected: shouldPick }
      })
    )
    setOverflowMode('resolved')
  }

  const enterPickMode = () => {
    // Clear all focus selections and let the user manually pick 3
    setRows(current =>
      current.map(r => ({ ...r, focusSelected: false }))
    )
    setOverflowMode('picking')
  }

  const togglePick = (index: number) => {
    setRows(current => {
      const selectedCount = current.filter(r => r.focusSelected).length
      return current.map((r, i) => {
        if (i !== index) return r
        if (r.focusSelected) return { ...r, focusSelected: false }
        // Only allow if fewer than 3 already picked
        if (selectedCount >= 3) return r
        return { ...r, focusSelected: true }
      })
    })
  }

  const finishPicking = () => setOverflowMode('resolved')
  const dismissOverflowPrompt = () => setOverflowMode('resolved')

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {promptText}
        </h3>
      </div>

      {/* Overflow prompt — gentle focus picker */}
      {overflowMode === 'prompt' && (
        <div
          className="rounded-lg p-3 mb-3 text-sm"
          style={{
            background: 'color-mix(in srgb, var(--color-accent-deep) 8%, transparent)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p className="mb-2">
            That's a full day! Want to pick your top 3 to focus on, or should we pick by
            due date?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enterPickMode}
              className="text-xs font-semibold rounded-md px-3 py-1.5"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              Pick top 3
            </button>
            <button
              type="button"
              onClick={autoPickByOrder}
              className="text-xs rounded-md px-3 py-1.5"
              style={{
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              Auto by order
            </button>
            <button
              type="button"
              onClick={dismissOverflowPrompt}
              className="text-xs rounded-md px-3 py-1.5"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
            >
              Keep all
            </button>
          </div>
        </div>
      )}

      {/* Rows */}
      <ul className="space-y-2">
        {rows.map((row, idx) => (
          <li key={row.key}>
            <RowEditor
              row={row}
              isPickingMode={overflowMode === 'picking'}
              onTextChange={text => updateRowText(idx, text)}
              onConfirmMatch={() => confirmMatch(idx)}
              onDismissMatch={() => dismissMatch(idx)}
              onTogglePick={() => togglePick(idx)}
              onRemove={() => removeRow(idx)}
            />
          </li>
        ))}
      </ul>

      {/* Picking-mode confirmation bar */}
      {overflowMode === 'picking' && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {rows.filter(r => r.focusSelected).length} / 3 picked
          </p>
          <button
            type="button"
            onClick={finishPicking}
            disabled={rows.filter(r => r.focusSelected).length === 0}
            className="text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-40"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done picking
          </button>
        </div>
      )}

      {/* Add more */}
      {overflowMode !== 'picking' && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Plus size={14} />
          Add more
        </button>
      )}
    </div>
  )
}

// ─── RowEditor — single input row with match confirmation ───────

interface RowEditorProps {
  row: InputRow
  isPickingMode: boolean
  onTextChange: (text: string) => void
  onConfirmMatch: () => void
  onDismissMatch: () => void
  onTogglePick: () => void
  onRemove: () => void
}

function RowEditor({
  row,
  isPickingMode,
  onTextChange,
  onConfirmMatch,
  onDismissMatch,
  onTogglePick,
  onRemove,
}: RowEditorProps) {
  const showMatchCard =
    row.matchedTaskId !== null && !row.matchResolved && row.text.trim().length >= 3
  const matchConfirmed = row.matchedTaskId !== null && row.matchResolved

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {isPickingMode && (
          <button
            type="button"
            onClick={onTogglePick}
            disabled={row.text.trim().length === 0}
            className="flex-shrink-0 disabled:opacity-30"
            aria-label={row.focusSelected ? 'Unpick' : 'Pick'}
          >
            {row.focusSelected ? (
              <CheckCircle2
                size={20}
                style={{ color: 'var(--color-accent-deep)' }}
              />
            ) : (
              <Circle size={20} style={{ color: 'var(--color-text-secondary)' }} />
            )}
          </button>
        )}

        <input
          type="text"
          value={row.text}
          onChange={e => onTextChange(e.target.value)}
          placeholder="Something for tomorrow..."
          className="flex-1 text-sm rounded-md px-3 py-2"
          style={{
            background: 'var(--color-bg-input)',
            color: 'var(--color-text-primary)',
            border: `1px solid ${
              matchConfirmed
                ? 'var(--color-accent-deep)'
                : 'var(--color-border-input)'
            }`,
          }}
        />

        {matchConfirmed && (
          <Star
            size={14}
            style={{
              color: 'var(--color-accent-deep)',
              flexShrink: 0,
            }}
          />
        )}

        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 opacity-50 hover:opacity-100"
          aria-label="Remove"
        >
          <X size={14} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {showMatchCard && (
        <div
          className="rounded-md px-3 py-2 ml-2 text-xs"
          style={{
            background: 'color-mix(in srgb, var(--color-accent-deep) 6%, transparent)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <p style={{ color: 'var(--color-text-primary)' }}>
            Did you mean: <span className="font-semibold">{row.matchedTaskTitle}</span>?
          </p>
          <div className="flex gap-2 mt-1.5">
            <button
              type="button"
              onClick={onConfirmMatch}
              className="inline-flex items-center gap-1 text-xs font-semibold rounded px-2 py-1"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Check size={12} />
              Yes, that's it
            </button>
            <button
              type="button"
              onClick={onDismissMatch}
              className="text-xs rounded px-2 py-1"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              No, create new
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
