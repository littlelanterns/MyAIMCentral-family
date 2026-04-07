/**
 * PRD-18 Screen 4: Weekly Review Card
 *
 * Renders inline inside the Morning Rhythm modal on the configured
 * weekly review day (default Friday). The card includes:
 *
 *   1. Weekly Stats — tasks completed this week, intention iterations,
 *      carry-forward count
 *   2. Top Victories — up to 5 victories from the week, prioritized by
 *      mom_pick then importance then recency
 *   3. Next Week Preview — tasks in the upcoming 7 days
 *   4. Weekly Reflection Prompt — rotating prompt from a frontend
 *      constants array; writes answer directly to journal_entries
 *      with tags=['reflection','weekly_review']
 *   5. Weekly Review Deep Dive — disabled stub pointing at PRD-16
 *
 * Completion: tapping [Mark weekly review done] writes a
 * rhythm_completions row for rhythm_key='weekly_review', period=this_week_iso.
 * Once written, PeriodicCardsSlot hides the card until next week.
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Trophy, Calendar, Sparkles, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useVictories } from '@/hooks/useVictories'
import { useCompleteRhythm } from '@/hooks/useRhythms'
import { rhythmSeed, pickOne } from '@/lib/rhythm/dateSeedPrng'
import { localIso, localWeekIso } from '@/utils/dates'

interface Props {
  familyId: string
  memberId: string
  /** Called after the user marks weekly review done. */
  onComplete?: () => void
}

// ─── Weekly-specific reflection prompts (frontend constants) ─────
//
// Intentionally NOT stored in reflection_prompts. Weekly prompts are a
// small hand-authored pool; answers go into journal_entries with
// tags=['reflection','weekly_review']. No DB seed required.

const WEEKLY_REFLECTION_PROMPTS = [
  'What was the theme of this week?',
  'What will you do differently next week?',
  'What do you want to remember about this week?',
  'What was harder than you expected, and what does that tell you?',
  'Where did you feel most like yourself this week?',
  "What's one thing you learned about yourself this week?",
  'What would you tell a friend who had the week you just had?',
  "What's the biggest thing you're grateful for this week?",
  'What pattern showed up this week that you want to change?',
  "What's something small that went well that you almost missed?",
] as const

// ─── Main component ───────────────────────────────────────────

export function WeeklyReviewCard({ familyId, memberId, onComplete }: Props) {
  const completeRhythm = useCompleteRhythm()

  const weekStart = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - day) // Sunday of current week
    start.setHours(0, 0, 0, 0)
    return start
  }, [])
  const weekStartIso = localIso(weekStart)

  const weekEndIso = localIso(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000))

  // ─── Weekly Stats ───────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['weekly-stats', familyId, memberId, weekStartIso],
    queryFn: async () => {
      const weekStartTs = new Date(weekStart.getTime()).toISOString()

      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .eq('status', 'completed')
        .gte('completed_at', weekStartTs)

      const { count: carryForward } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .in('status', ['pending', 'in_progress'])
        .lt('due_date', weekStartIso)
        .is('archived_at', null)

      const { count: intentionIterations } = await supabase
        .from('intention_iterations')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .gte('created_at', weekStartTs)

      return {
        tasksCompleted: tasksCompleted ?? 0,
        carryForward: carryForward ?? 0,
        intentionIterations: intentionIterations ?? 0,
      }
    },
    enabled: !!familyId && !!memberId,
    staleTime: 5 * 60 * 1000,
  })

  // ─── Top Victories ──────────────────────────────────────────
  const { data: weekVictories = [] } = useVictories(memberId, {
    period: 'this_week',
  })

  const topVictories = useMemo(() => {
    const importanceRank: Record<string, number> = {
      major_achievement: 3,
      big_win: 2,
      standard: 1,
      small_win: 0,
    }
    const sorted = [...weekVictories].sort((a, b) => {
      if (a.is_moms_pick !== b.is_moms_pick) return a.is_moms_pick ? -1 : 1
      const aImp = importanceRank[a.importance] ?? 0
      const bImp = importanceRank[b.importance] ?? 0
      if (aImp !== bImp) return bImp - aImp
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sorted.slice(0, 5)
  }, [weekVictories])

  // ─── Next Week Preview ──────────────────────────────────────
  const { data: nextWeekTasks } = useQuery({
    queryKey: ['next-week-preview', familyId, memberId, weekStartIso],
    queryFn: async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextEnd = new Date()
      nextEnd.setDate(nextEnd.getDate() + 7)
      const startIso = localIso(tomorrow)
      const endIso = localIso(nextEnd)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .in('status', ['pending', 'in_progress'])
        .is('archived_at', null)
        .gte('due_date', startIso)
        .lte('due_date', endIso)
        .order('due_date', { ascending: true })
        .limit(8)

      return (tasks ?? []) as Array<{ id: string; title: string | null; due_date: string | null }>
    },
    enabled: !!familyId && !!memberId,
    staleTime: 5 * 60 * 1000,
  })

  // ─── Weekly Reflection Prompt — date-seeded rotation ────────
  const weeklyPrompt = useMemo(() => {
    const seed = rhythmSeed(memberId, 'weekly_review:prompt', weekStart)
    return (
      pickOne(WEEKLY_REFLECTION_PROMPTS as unknown as string[], seed) ??
      WEEKLY_REFLECTION_PROMPTS[0]
    )
  }, [memberId, weekStart])

  const handleMarkDone = async () => {
    await completeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: 'weekly_review',
      period: localWeekIso(),
      metadata: {},
    })
    onComplete?.()
  }

  const isComplete = completeRhythm.isSuccess

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 6%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <BarChart3 size={20} style={{ color: 'var(--color-accent-deep)' }} />
        <h2
          className="text-base font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Weekly Review
        </h2>
        <span
          className="text-xs ml-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {weekStartIso.slice(5)} – {weekEndIso.slice(5)}
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Tasks done" value={stats.tasksCompleted} />
          <StatTile label="Carry forward" value={stats.carryForward} />
          <StatTile label="Intention taps" value={stats.intentionIterations} />
        </div>
      )}

      {/* Top Victories */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={14} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Top Victories
          </h3>
        </div>
        {topVictories.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
            No victories logged this week yet. There's still time.
          </p>
        ) : (
          <ul className="space-y-1">
            {topVictories.map(v => (
              <li
                key={v.id}
                className="text-xs flex items-start gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Sparkles
                  size={10}
                  style={{
                    color: 'var(--color-accent-deep)',
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <span>{v.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Next Week Preview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Next week
          </h3>
        </div>
        {!nextWeekTasks || nextWeekTasks.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
            No tasks scheduled for next week yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {nextWeekTasks.map(t => (
              <li
                key={t.id}
                className="text-xs flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--color-accent-deep)' }}
                />
                <span className="flex-1 truncate">{t.title ?? '(untitled)'}</span>
                <span
                  className="text-xs shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {t.due_date?.slice(5)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Weekly Reflection Prompt */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Reflect on the week
        </p>
        <WeeklyReflectionInput
          prompt={weeklyPrompt}
          familyId={familyId}
          memberId={memberId}
        />
      </div>

      {/* Deep Dive — stubbed until PRD-16 ships */}
      <div
        className="rounded-md p-2 text-xs"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Want to do a full weekly review? Full meeting-based review is coming with
        Meetings.
      </div>

      {/* Mark done button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleMarkDone}
          disabled={completeRhythm.isPending || isComplete}
          className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {isComplete ? (
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              Marked done
            </span>
          ) : completeRhythm.isPending ? (
            'Saving…'
          ) : (
            'Mark weekly review done'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Weekly Reflection Input ────────────────────────────────

function WeeklyReflectionInput({
  prompt,
  familyId,
  memberId,
}: {
  prompt: string
  familyId: string
  memberId: string
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('journal_entries').insert({
        family_id: familyId,
        member_id: memberId,
        entry_type: 'reflection',
        content: `Weekly Review — ${prompt}\n\n${text.trim()}`,
        tags: ['reflection', 'weekly_review'],
        visibility: 'private',
      })
      if (insertError) throw insertError
      setSaved(true)
      setText('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {prompt}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder="Your thoughts..."
        className="w-full text-sm rounded-md px-3 py-2 resize-y"
        style={{
          backgroundColor: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-input)',
        }}
      />
      {error && (
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--color-danger, #b91c1c)' }}
        >
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-end gap-3">
        {saved && (
          <span
            className="text-xs inline-flex items-center gap-1"
            style={{ color: 'var(--color-accent-deep)' }}
          >
            <Check size={12} />
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-40"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Stat tile sub-component ────────────────────────────────

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-md p-2 text-center"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <p
        className="text-xl font-bold"
        style={{
          color: 'var(--color-accent-deep)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}
