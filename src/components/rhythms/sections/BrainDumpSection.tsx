/**
 * PRD-18 Section Type #8: Brain Dump / Capture
 *
 * Lightweight Smart Notepad embed for rhythm modals. Writes a
 * notepad_tabs row with source_type='rhythm_capture' on save. The
 * full Notepad routing strip lives on the standalone /notepad page —
 * inside a rhythm we keep this minimal: just capture the thought,
 * route later if desired.
 *
 * Phase A simplification: textarea + save button. The full embedded
 * Notepad mini-component (with routing chips) may replace this in
 * Phase B if Tenise wants the in-rhythm routing experience.
 *
 * Framing: "Anything on your mind?" (morning) — caller can override.
 */

import { useState } from 'react'
import { PenLine, Check } from 'lucide-react'
import { useCreateNotepadTab } from '@/hooks/useNotepad'

interface Props {
  familyId: string
  memberId: string
  rhythmKey: string
  framingText?: string
  /** Called after successful save with the created notepad_tabs.id */
  onSaved?: (tabId: string) => void
}

export function BrainDumpSection({
  familyId,
  memberId,
  rhythmKey,
  framingText = 'Anything on your mind?',
  onSaved,
}: Props) {
  const [content, setContent] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const createTab = useCreateNotepadTab()

  const handleSave = async () => {
    const trimmed = content.trim()
    if (trimmed.length === 0) return

    const tab = await createTab.mutateAsync({
      family_id: familyId,
      member_id: memberId,
      content: trimmed,
      source_type: 'rhythm_capture',
      source_reference_id: undefined, // Phase B: link to rhythm_completion id
    })
    setContent('')
    setSavedAt(Date.now())
    onSaved?.(tab.id)
    // Clear the saved indicator after a few seconds
    setTimeout(() => setSavedAt(null), 3000)
    void rhythmKey // suppress unused — preserved for Phase B context metadata
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <PenLine size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          {framingText}
        </h3>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Drop a thought here. It'll save to your notepad."
        rows={3}
        className="w-full text-sm rounded-lg p-3 resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-input)',
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {savedAt ? (
            <span className="inline-flex items-center gap-1">
              <Check size={12} />
              Saved to your notepad
            </span>
          ) : (
            'Saves to your Smart Notepad'
          )}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={content.trim().length === 0 || createTab.isPending}
          className="text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {createTab.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
