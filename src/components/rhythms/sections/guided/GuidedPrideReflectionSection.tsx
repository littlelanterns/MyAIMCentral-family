/**
 * PRD-18 Mini Evening Rhythm for Guided — Pride Reflection
 *
 * Rotating wording: 6 different framings of the same "what are you
 * proud of?" question, picked deterministically by date so the same
 * kid sees the same wording all day, a different one tomorrow. Keeps
 * the section from feeling like a nightly script.
 *
 * The selected wording is saved INTO the journal entry content so the
 * historical record always shows which version of the question the
 * kid answered. Tags stay constant (`pride`) so mom can filter all
 * pride reflections regardless of which wording was used.
 *
 * Writes directly to journal_entries with:
 *   - entry_type = 'reflection'
 *   - tags = ['reflection', 'guided_evening', 'pride']
 *   - visibility = 'shared_parents' (mom can see via View As + journal RLS)
 *
 * Reading Support: Volume2 icon reads the active wording aloud.
 */

import { useState } from 'react'
import { Heart, Volume2, Check } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { pickOne, rhythmSeed } from '@/lib/rhythm/dateSeedPrng'

const PRIDE_PROMPTS = [
  "Is there anything you're proud of yourself for today?",
  "What's something you did today that made you feel good about yourself?",
  "What's a moment from today you want to remember?",
  "Was there a time today when you tried hard at something?",
  "What's something kind of awesome you did today?",
  "Did anything happen today that you're glad about?",
] as const

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

function useSavePrideReflection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { familyId: string; memberId: string; promptText: string; text: string }) => {
      const content = `**${params.promptText}**\n\n${params.text}`
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          family_id: params.familyId,
          member_id: params.memberId,
          entry_type: 'reflection',
          content,
          tags: ['reflection', 'guided_evening', 'pride'],
          visibility: 'shared_parents',
          is_included_in_ai: true,
        })
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['journal-entries', vars.memberId] })
    },
  })
}

export function GuidedPrideReflectionSection({ familyId, memberId, readingSupport }: Props) {
  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const save = useSavePrideReflection()

  // Date-seeded rotation: same kid sees same wording all day, different tomorrow.
  const promptText =
    pickOne([...PRIDE_PROMPTS], rhythmSeed(memberId, 'evening:pride', new Date()))
    ?? PRIDE_PROMPTS[0]

  const handleSave = async () => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    await save.mutateAsync({ familyId, memberId, promptText, text: trimmed })
    setText('')
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 4000)
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
        <Heart size={22} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-base font-semibold flex-1"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {promptText}
        </h3>
        {readingSupport && (
          <button
            type="button"
            onClick={() => speak(promptText)}
            className="rounded-md p-1"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Read prompt aloud"
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Anything counts. Big or small."
        rows={3}
        className="w-full text-base rounded-lg p-3 resize-none focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-input)',
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <span
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {savedAt ? (
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              Saved to your journal
            </span>
          ) : (
            ''
          )}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={text.trim().length === 0 || save.isPending}
          className="text-base font-semibold rounded-md px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
            minHeight: 48,
          }}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
