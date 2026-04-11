/**
 * PRD-18 Phase C Section Type #29 (Enhancement 3): Morning Insight
 *
 * "Something to think about" — a morning growth question paired with
 * semantic search results from the family's BookShelf library.
 *
 * Flow:
 *   1. Pick one question from the 20-question adult pool via
 *      date-seeded PRNG so the same member sees the same question
 *      all day, rotates at midnight.
 *   2. Generate an embedding for the QUESTION TEXT (passive matches)
 *      via generate-query-embedding Edge Function.
 *   3. Call match_book_extractions RPC to get 1-2 passively-matched
 *      extractions. Render as clickable cards.
 *   4. User optionally types a response.
 *   5. On debounced input change, re-generate embedding from the
 *      user's response and re-call the RPC for 2-3 active matches.
 *      Active matches replace passive matches.
 *   6. Each card links to /bookshelf/book/:bookLibraryId so the user
 *      can open the full extraction context.
 *
 * Empty BookShelf handling: query bookshelf_items count. If 0 items,
 * skip the embedding call entirely and render a single warm onboarding
 * card instead of extraction results.
 *
 * Phase D (Enhancement 7): teen audience wired — the 15 teen-specific
 * questions are seeded in morning_insight_questions with audience='teen'
 * and rendered via the same infrastructure by passing audience='teen'
 * through the renderer chain.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Brain, Volume2, BookOpen, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useMorningInsightQuestions } from '@/hooks/useMorningInsightQuestions'
import { rhythmSeed, pickOne } from '@/lib/rhythm/dateSeedPrng'
import type { MorningInsightAudience, MorningInsightMatch } from '@/types/rhythms'

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
  /**
   * Question pool audience. Phase D (Enhancement 7) passes 'teen' for
   * Independent teen morning rhythms. Defaults to 'adult' for safety.
   */
  audience?: MorningInsightAudience
}

const DEBOUNCE_MS = 350
const PASSIVE_MATCH_COUNT = 2
const ACTIVE_MATCH_COUNT = 3

export function MorningInsightSection({
  familyId,
  memberId,
  readingSupport,
  audience = 'adult',
}: Props) {
  const { data: questions = [], isLoading: questionsLoading } =
    useMorningInsightQuestions(audience, familyId)

  // Pick today's question deterministically
  const todaysQuestion = useMemo(() => {
    if (questions.length === 0) return null
    const seed = rhythmSeed(memberId, 'morning:insight_question')
    return pickOne(questions, seed) ?? questions[0]
  }, [questions, memberId])

  // Check BookShelf emptiness once per session
  const { data: hasBookshelfItems } = useQuery({
    queryKey: ['bookshelf-has-items', familyId],
    queryFn: async (): Promise<boolean> => {
      const { count } = await supabase
        .from('bookshelf_items')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .is('archived_at', null)
      return (count ?? 0) > 0
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 10,
  })

  // Passive match query — fires when the question is known and BookShelf non-empty
  const { data: passiveMatches = [], isLoading: passiveLoading } = useQuery({
    queryKey: ['morning-insight-passive', memberId, todaysQuestion?.id],
    queryFn: async (): Promise<MorningInsightMatch[]> => {
      if (!todaysQuestion || !hasBookshelfItems) return []
      return await searchBookExtractions(
        familyId,
        memberId,
        todaysQuestion.question_text,
        PASSIVE_MATCH_COUNT,
      )
    },
    enabled: !!todaysQuestion && hasBookshelfItems === true,
    staleTime: 1000 * 60 * 30,
  })

  // Active (user response) match query — debounced
  const [userResponse, setUserResponse] = useState('')
  const [debouncedResponse, setDebouncedResponse] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedResponse(userResponse.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [userResponse])

  const { data: activeMatches = [], isFetching: activeFetching } = useQuery({
    queryKey: ['morning-insight-active', memberId, debouncedResponse],
    queryFn: async (): Promise<MorningInsightMatch[]> => {
      if (!debouncedResponse || debouncedResponse.length < 5) return []
      if (!hasBookshelfItems) return []
      return await searchBookExtractions(
        familyId,
        memberId,
        debouncedResponse,
        ACTIVE_MATCH_COUNT,
      )
    },
    enabled: !!debouncedResponse && hasBookshelfItems === true,
    staleTime: 1000 * 60 * 5,
  })

  const displayedMatches = debouncedResponse && activeMatches.length > 0
    ? activeMatches
    : passiveMatches

  const readAloudQuestion = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (!todaysQuestion) return
    const utter = new SpeechSynthesisUtterance(todaysQuestion.question_text)
    window.speechSynthesis.speak(utter)
  }, [todaysQuestion])

  if (questionsLoading || !todaysQuestion) return null

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <Brain size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold flex-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Something to think about
        </h3>
        {readingSupport && (
          <button
            type="button"
            onClick={readAloudQuestion}
            aria-label="Read aloud"
            className="p-1 rounded-md"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>

      <p
        className="text-base leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {todaysQuestion.question_text}
      </p>

      <textarea
        value={userResponse}
        onChange={e => setUserResponse(e.target.value)}
        placeholder="What comes to mind?"
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-sm resize-y"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      />

      {/* Match results — silent when nothing surfaces. Never show a
          dead-end "nothing yet" message; the user is often being
          vulnerable here and we don't punish an empty return. */}
      {hasBookshelfItems === false ? (
        <EmptyBookShelfNudge />
      ) : (passiveLoading || activeFetching) && displayedMatches.length === 0 ? (
        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Loader2 size={14} className="animate-spin" />
          Finding passages that relate…
        </div>
      ) : displayedMatches.length > 0 ? (
        <div className="space-y-2 pt-1">
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {debouncedResponse && activeMatches.length > 0
              ? 'From your library, related to your response:'
              : 'From your library:'}
          </p>
          {displayedMatches.map(match => (
            <ExtractionCard key={match.extraction_id} match={match} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EmptyBookShelfNudge() {
  return (
    <Link
      to="/bookshelf"
      className="block rounded-lg p-3 transition-colors"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px dashed var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start gap-2">
        <BookOpen size={16} style={{ color: 'var(--color-accent-deep)', marginTop: 2 }} />
        <div>
          <p
            className="text-xs font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Add a book you love
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Upload a book to your BookShelf and we'll surface passages here that
            relate to what you're thinking about.
          </p>
          <p
            className="text-xs mt-1 font-semibold"
            style={{ color: 'var(--color-accent-deep)' }}
          >
            Open BookShelf →
          </p>
        </div>
      </div>
    </Link>
  )
}

function ExtractionCard({ match }: { match: MorningInsightMatch }) {
  return (
    <Link
      to={`/bookshelf/book/${match.book_library_id}`}
      className="block rounded-lg p-3 transition-colors"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <p
        className="text-xs font-semibold"
        style={{ color: 'var(--color-accent-deep)' }}
      >
        {match.book_title}
      </p>
      {match.section_title && (
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {match.section_title}
        </p>
      )}
      <p
        className="text-xs mt-1.5 leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {match.item_text.length > 200
          ? `${match.item_text.slice(0, 200)}…`
          : match.item_text}
      </p>
      <p
        className="text-xs mt-1.5 font-semibold"
        style={{ color: 'var(--color-accent-deep)' }}
      >
        See in BookShelf →
      </p>
    </Link>
  )
}

/**
 * Call generate-query-embedding + match_book_extractions in sequence.
 * Returns empty array on any failure so the UI degrades gracefully.
 */
async function searchBookExtractions(
  familyId: string,
  memberId: string,
  text: string,
  matchCount: number,
): Promise<MorningInsightMatch[]> {
  try {
    const embedResp = await supabase.functions.invoke('generate-query-embedding', {
      body: {
        text,
        family_id: familyId,
        member_id: memberId,
        feature_key: 'rhythm_morning_insight',
      },
    })

    if (embedResp.error) return []
    const embedding = (embedResp.data as { embedding?: number[] } | null)?.embedding
    if (!embedding) return []

    const { data, error } = await supabase.rpc('match_book_extractions', {
      query_embedding: embedding,
      p_family_id: familyId,
      p_member_id: memberId,
      match_threshold: 0.3,
      match_count: matchCount,
    })

    if (error || !data) return []

    return (data as Array<Record<string, unknown>>).map(row => ({
      extraction_id: row.id as string,
      book_library_id: row.book_library_id as string,
      book_title: (row.book_title as string) ?? 'Untitled',
      extraction_type: (row.extraction_type as string) ?? '',
      content_type: (row.content_type as string | null) ?? null,
      item_text: (row.item_text as string) ?? '',
      section_title: (row.section_title as string | null) ?? null,
      section_index: (row.section_index as number | null) ?? null,
      is_key_point: Boolean(row.is_key_point),
      is_hearted: Boolean(row.is_hearted),
      similarity: (row.similarity as number) ?? 0,
    }))
  } catch {
    return []
  }
}
