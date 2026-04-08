/**
 * PRD-18 Phase D Enhancement 7: MindSweep-Lite (TEEN variant)
 *
 * Sibling of MindSweepLiteSection, purpose-built for Independent teens.
 * Shares ONLY:
 *   - RhythmMetadataContext staging (stageMindSweepItems)
 *   - The existing mindsweep-sort Edge Function call (platform-level,
 *     teen-agnostic)
 *   - The auto-expand heuristic (high-task day query)
 *   - commitMindSweepLite on Close My Day (via rhythm modal)
 *
 * Diverges from adult in UX + vocabulary:
 *   - 5-option teen disposition dropdown (Schedule / Ask someone /
 *     Journal about it / Talk to someone / Let it go) instead of
 *     adult's 13-option full destination set
 *   - Teen copy throughout ("Anything looping?" / "Whatever's stuck...")
 *   - Cross-member detection AUTO-suggests 'talk_to_someone' (PRIVATE
 *     self-reminder), NEVER 'family_request' — see founder rule below
 *   - Teen can MANUALLY OVERRIDE to 'family_request' (Build N.2) when
 *     they want the item to actually go out as a real request through
 *     PRD-15's family_requests table
 *   - Manual [+ Add item] defaults to 'journal' disposition (teens are
 *     more likely to dump journal-worthy content)
 *
 * FOUNDER-CRITICAL RULE (Phase D sign-off 2026-04-07, refined 2026-04-07
 * for Build N.2):
 *   The CLASSIFIER never auto-suggests `family_request` for teens. Cross-
 *   member references default to `talk_to_someone` (PRIVATE journal note
 *   the teen sees themselves). The teen must consciously override to
 *   `family_request` to escalate from "I'll remember to bring this up"
 *   to "send this to mom right now." This preserves the privacy-first
 *   default — no teen gets accidentally auto-routed into sending mom a
 *   notification just because they typed "mom" in their brain dump.
 *
 *   Build N.2 added `family_request` as a TEEN OPT-IN disposition (the
 *   user explicitly chose to surface this in the rhythm flow). It uses
 *   the existing adult `commitMindSweepLite` `case 'family_request'`
 *   from Build L.1 — no fork, no new commit case, no schema change.
 *
 *   The original founder-critical rule still stands:
 *     `talk_to_someone` NEVER reaches `family_request` code paths.
 *   These are two separate dispositions with two separate behaviors.
 *
 *   This is enforced by:
 *   1. The translator maps cross_member_action='suggest_route' to
 *      'talk_to_someone', NEVER to 'family_request'
 *   2. TEEN_DISPOSITION_PICK_ORDER does include 'family_request'
 *      (Build N.2) but the recipient picker is required and the
 *      label is "Send to:" not "Remind yourself to talk to:"
 *   3. commitMindSweepLite has TWO separate cases:
 *        case 'talk_to_someone' → journal_entries (private)
 *        case 'family_request'  → family_requests (outbound)
 *      They never share routing logic.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Wand2,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Volume2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useRhythmMetadataStaging } from '../RhythmMetadataContext'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  TEEN_DISPOSITION_DISPLAY_NAMES,
  TEEN_DISPOSITION_PICK_ORDER,
  type MindSweepLiteDisposition,
  type TeenDisposition,
} from '@/types/rhythms'
import type {
  MindSweepSortRequest,
  MindSweepSortResult,
  FamilyMemberName,
} from '@/types/mindsweep'
import type { StagedMindSweepLiteItem } from '@/lib/rhythm/commitMindSweepLite'
import { todayLocalIso } from '@/utils/dates'

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
  /** Initial collapsed state from section config. Defaults to true. */
  collapsedByDefault?: boolean
}

/**
 * Teen working item — narrows disposition to TeenDisposition so
 * TypeScript guarantees we never construct a family_request item.
 */
interface TeenWorkingItem {
  key: number
  text: string
  disposition: TeenDisposition
  classifier_suggested: MindSweepLiteDisposition
  classifier_confidence?: string
  destination_detail?: Record<string, unknown> | null
  recipient_member_id?: string | null
  recipient_name?: string | null
}

/** Auto-expand when today's task completion count exceeds this. */
const HIGH_TASK_THRESHOLD = 8

/**
 * Translate the adult destination returned by mindsweep-sort into
 * the teen 5-option vocabulary. This happens at display time only
 * — the Edge Function stays platform-level and teen-agnostic.
 *
 * Mapping rationale:
 *   - task/calendar → 'task' (teens see "Schedule"; the date is in
 *     destination_detail and carries through to commit)
 *   - journal/innerworkings/best_intentions/guiding_stars/victory/
 *     archives/list/backburner/recipe → 'journal' ("Journal about it")
 *     Teens don't think in list/archive vocabulary. When in doubt,
 *     route to journal — it's a valid place for anything.
 *   - cross_member_action='suggest_route' → 'talk_to_someone'
 *     (overrides whatever the classifier picked because the
 *     recipient presence is the stronger signal). NEVER promotes to
 *     'family_request' — that's a deliberate teen-override-only
 *     escalation per the founder-critical rule. Privacy-first default.
 *   - release (user override, never suggested) → 'release'
 *   - family_request from classifier output: shouldn't happen because
 *     mindsweep-sort never returns 'family_request' as a destination
 *     (the adult section also constructs that disposition only via
 *     frontend cross-member promotion). Defensive default to 'journal'.
 */
function adultDestinationToTeenDisposition(
  dest: MindSweepLiteDisposition,
  crossMemberAction?: string | null,
): TeenDisposition {
  if (crossMemberAction === 'suggest_route') return 'talk_to_someone'
  switch (dest) {
    case 'task':
    case 'calendar':
      return 'task'
    case 'release':
      return 'release'
    // Everything else maps to 'journal' — the teen catch-all
    case 'journal':
    case 'innerworkings':
    case 'best_intentions':
    case 'guiding_stars':
    case 'victory':
    case 'archives':
    case 'list':
    case 'backburner':
    case 'recipe':
    case 'family_request': // defensive: classifier doesn't emit this
    case 'talk_to_someone': // defensive: classifier doesn't emit this
    default:
      return 'journal'
  }
}

export function MindSweepLiteTeenSection({
  familyId,
  memberId,
  readingSupport,
  collapsedByDefault = true,
}: Props) {
  const { stageMindSweepItems } = useRhythmMetadataStaging()

  // Family roster — same cross-member detection mechanism as adults,
  // but the classifier's cross_member_id gets translated to
  // 'talk_to_someone' instead of 'family_request' downstream.
  const { data: allFamilyMembers = [] } = useFamilyMembers(familyId)
  const familyMemberNames: FamilyMemberName[] = useMemo(
    () =>
      allFamilyMembers
        .filter(m => m.id !== memberId && m.is_active)
        .map(m => ({
          id: m.id,
          display_name: m.display_name,
          nicknames: m.nicknames ?? [],
        })),
    [allFamilyMembers, memberId],
  )
  const memberNameLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of allFamilyMembers) map.set(m.id, m.display_name)
    return map
  }, [allFamilyMembers])

  // Auto-expand on high-task days (same threshold as adult version)
  const { data: todayTaskCount = 0 } = useQuery({
    queryKey: ['rhythm-mindsweep-autoexpand-teen', memberId, todayLocalIso()],
    queryFn: async (): Promise<number> => {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('activity_log_entries')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', memberId)
        .eq('event_type', 'task_completed')
        .gte('created_at', startOfToday.toISOString())
      return count ?? 0
    },
    staleTime: 1000 * 60 * 5,
  })

  const shouldAutoExpand = todayTaskCount >= HIGH_TASK_THRESHOLD
  const [expanded, setExpanded] = useState(!collapsedByDefault || shouldAutoExpand)
  const [rawText, setRawText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [items, setItems] = useState<TeenWorkingItem[]>([])
  const [nextKey, setNextKey] = useState(1)
  const [openDropdownKey, setOpenDropdownKey] = useState<number | null>(null)

  useEffect(() => {
    if (shouldAutoExpand) setExpanded(true)
  }, [shouldAutoExpand])

  // Stage items for the Close My Day commit. Teens widen the local
  // TeenDisposition back to MindSweepLiteDisposition for the shared
  // staging type — the narrowing is purely a UI-layer guarantee.
  useEffect(() => {
    const toStage: StagedMindSweepLiteItem[] = items
      .filter(i => i.text.trim().length > 0)
      .map(i => ({
        text: i.text,
        disposition: i.disposition as MindSweepLiteDisposition,
        classifier_suggested: i.classifier_suggested,
        classifier_confidence: i.classifier_confidence,
        destination_detail: i.destination_detail,
        recipient_member_id: i.recipient_member_id,
        recipient_name: i.recipient_name,
      }))
    stageMindSweepItems(toStage)
  }, [items, stageMindSweepItems])

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return
    setParsing(true)
    setParseError(null)

    try {
      const requestBody: MindSweepSortRequest = {
        items: [{ content: rawText.trim(), content_type: 'text' }],
        family_id: familyId,
        member_id: memberId,
        aggressiveness: 'always_ask',
        always_review_rules: [],
        custom_review_rules: [],
        source_channel: 'rhythm_evening',
        input_type: 'text',
        family_member_names: familyMemberNames,
      }

      const response = await supabase.functions.invoke('mindsweep-sort', {
        body: requestBody,
      })

      if (response.error) throw response.error

      const data = response.data as {
        results?: MindSweepSortResult[]
      } | null

      const results = data?.results ?? []
      if (results.length === 0) {
        setParseError('Nothing to parse — try adding more detail?')
        setParsing(false)
        return
      }

      let key = nextKey
      const newItems: TeenWorkingItem[] = results.map(r => {
        const classifierDestination = (r.destination as MindSweepLiteDisposition) ?? 'journal'
        const teenDisposition = adultDestinationToTeenDisposition(
          classifierDestination,
          r.cross_member_action,
        )
        // Preserve cross-member recipient if detected — shown inline
        // as "Remind yourself to talk to: [Name]" below the item.
        const recipient_member_id =
          teenDisposition === 'talk_to_someone' && r.cross_member_id
            ? r.cross_member_id
            : null
        const recipient_name = recipient_member_id
          ? memberNameLookup.get(recipient_member_id) ?? r.cross_member ?? null
          : null
        return {
          key: key++,
          text: r.extracted_text,
          disposition: teenDisposition,
          classifier_suggested: classifierDestination,
          classifier_confidence: r.confidence,
          destination_detail: r.destination_detail ?? null,
          recipient_member_id,
          recipient_name,
        }
      })
      setItems(prev => [...prev, ...newItems])
      setNextKey(key)
      setRawText('')
    } catch (err) {
      setParseError(
        err instanceof Error
          ? `Parsing hit a snag: ${err.message}`
          : 'Parsing hit a snag. Try again?',
      )
    } finally {
      setParsing(false)
    }
  }, [rawText, familyId, memberId, nextKey, familyMemberNames, memberNameLookup])

  const handleAddManualItem = () => {
    // Teen default: 'journal' (not 'task' like adults). Teens manually
    // adding items are more likely to be journaling than scheduling.
    setItems(prev => [
      ...prev,
      {
        key: nextKey,
        text: '',
        disposition: 'journal',
        classifier_suggested: 'journal',
      },
    ])
    setNextKey(k => k + 1)
  }

  const handleRemoveItem = (key: number) => {
    setItems(prev => prev.filter(i => i.key !== key))
    if (openDropdownKey === key) setOpenDropdownKey(null)
  }

  const handleUpdateItemText = (key: number, text: string) => {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, text } : i)))
  }

  // Both `talk_to_someone` and `family_request` carry a recipient.
  // Switching off either one clears recipient; switching on either
  // without a recipient auto-picks the first family member (teen can
  // change via the picker UI rendered below the item).
  const RECIPIENT_DISPOSITIONS: TeenDisposition[] = ['talk_to_someone', 'family_request']
  const handleUpdateDisposition = (key: number, disposition: TeenDisposition) => {
    setItems(prev =>
      prev.map(i => {
        if (i.key !== key) return i
        const wasRecipient = RECIPIENT_DISPOSITIONS.includes(i.disposition)
        const becomesRecipient = RECIPIENT_DISPOSITIONS.includes(disposition)
        // Recipient → non-recipient: clear the picked person
        if (wasRecipient && !becomesRecipient) {
          return { ...i, disposition, recipient_member_id: null, recipient_name: null }
        }
        // Non-recipient → recipient (or recipient → other recipient
        // type that arrived without a recipient set): auto-pick first
        if (becomesRecipient && !i.recipient_member_id && familyMemberNames.length > 0) {
          const first = familyMemberNames[0]
          return {
            ...i,
            disposition,
            recipient_member_id: first.id,
            recipient_name: first.display_name,
          }
        }
        return { ...i, disposition }
      }),
    )
    setOpenDropdownKey(null)
  }

  const handleUpdateRecipient = (key: number, recipientId: string) => {
    const recipient = allFamilyMembers.find(m => m.id === recipientId)
    setItems(prev =>
      prev.map(i =>
        i.key === key
          ? {
              ...i,
              recipient_member_id: recipientId,
              recipient_name: recipient?.display_name ?? null,
            }
          : i,
      ),
    )
  }

  const readAloudHeader = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const utter = new SpeechSynthesisUtterance('Anything looping?')
    window.speechSynthesis.speak(utter)
  }, [])

  const headerLabel = useMemo(() => {
    if (shouldAutoExpand && !items.length && !rawText) {
      return "Rough day? Dump what's in your head."
    }
    return 'Anything looping?'
  }, [shouldAutoExpand, items.length, rawText])

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl p-4 flex items-center gap-3 transition-colors text-left"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <Wand2 size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <span
          className="text-sm flex-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {headerLabel}
        </span>
        <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
      </button>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <Wand2 size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold flex-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {headerLabel}
        </h3>
        {readingSupport && (
          <button
            type="button"
            onClick={readAloudHeader}
            aria-label="Read aloud"
            className="p-1 rounded-md"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Volume2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="p-1 rounded-md"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Collapse"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Whatever's stuck in your head. Venting counts. Tap any tag to change it.
        Need to actually ask someone something? Tap a tag and pick "Ask someone."
        "Let it go" creates nothing — just naming it is enough.
      </p>

      <textarea
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        placeholder="I said something weird in English class. Need to finish the lab report by Friday..."
        rows={4}
        className="w-full px-3 py-2 rounded-lg text-sm resize-y"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
        }}
      />

      {parseError && (
        <div
          className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-danger, #b91c1c) 8%, transparent)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
        >
          <AlertCircle size={14} style={{ color: 'var(--color-danger, #b91c1c)', flexShrink: 0, marginTop: 1 }} />
          <span>{parseError}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !rawText.trim()}
          className="text-xs font-semibold rounded-md px-3 py-1.5 inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {parsing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sorting…
            </>
          ) : (
            <>
              <Wand2 size={14} />
              {items.length > 0 ? 'Sort again' : 'Sort it'}
            </>
          )}
        </button>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleAddManualItem}
            className="text-xs rounded-md px-3 py-1.5 inline-flex items-center gap-1.5"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <Plus size={14} />
            Add item
          </button>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2 pt-2">
          {items.map(item => {
            const isTalkToSomeone = item.disposition === 'talk_to_someone'
            const isFamilyRequest = item.disposition === 'family_request'
            const hasRecipient = isTalkToSomeone || isFamilyRequest
            // Two distinct framings for the recipient picker:
            //   talk_to_someone → "Remind yourself to talk to:" (private)
            //   family_request  → "Send to:" (outbound)
            // The label difference is the user's primary signal that
            // family_request actually leaves the teen's private space.
            const recipientLabel = isFamilyRequest
              ? 'Send to:'
              : 'Remind yourself to talk to:'
            return (
              <li
                key={item.key}
                className="rounded-lg p-2"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={item.text}
                    onChange={e => handleUpdateItemText(item.key, e.target.value)}
                    placeholder="(blank — add text or remove)"
                    className="flex-1 bg-transparent text-sm px-1 py-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownKey(openDropdownKey === item.key ? null : item.key)
                      }
                      className="text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                      style={{
                        background:
                          item.disposition === 'release'
                            ? 'color-mix(in srgb, var(--color-text-secondary) 15%, transparent)'
                            : 'color-mix(in srgb, var(--color-accent-deep) 12%, transparent)',
                        color:
                          item.disposition === 'release'
                            ? 'var(--color-text-secondary)'
                            : 'var(--color-accent-deep)',
                      }}
                    >
                      {TEEN_DISPOSITION_DISPLAY_NAMES[item.disposition]}
                      <ChevronDown size={12} />
                    </button>
                    {openDropdownKey === item.key && (
                      <div
                        className="absolute right-0 top-full mt-1 rounded-lg shadow-lg z-20 min-w-40"
                        style={{
                          background: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border-default)',
                        }}
                      >
                        {TEEN_DISPOSITION_PICK_ORDER.map(opt => {
                          // Hide recipient-bearing dispositions when no
                          // other family members exist — nothing to
                          // reference for talk_to_someone, no one to
                          // route to for family_request. Solo-mom-and-
                          // teen edge case (rare but real).
                          if (
                            (opt === 'talk_to_someone' || opt === 'family_request') &&
                            familyMemberNames.length === 0
                          ) {
                            return null
                          }
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleUpdateDisposition(item.key, opt)}
                              className="w-full text-left text-xs px-3 py-1.5"
                              style={{
                                color: 'var(--color-text-primary)',
                                background:
                                  item.disposition === opt
                                    ? 'color-mix(in srgb, var(--color-accent-deep) 10%, transparent)'
                                    : 'transparent',
                              }}
                            >
                              {TEEN_DISPOSITION_DISPLAY_NAMES[opt]}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.key)}
                    className="p-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                    aria-label="Remove item"
                  >
                    <X size={14} />
                  </button>
                </div>
                {hasRecipient && familyMemberNames.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 pl-1">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {recipientLabel}
                    </span>
                    <select
                      value={item.recipient_member_id ?? ''}
                      onChange={e => handleUpdateRecipient(item.key, e.target.value)}
                      className="text-xs rounded-md px-2 py-1"
                      style={{
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border-default)',
                      }}
                    >
                      {familyMemberNames.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {items.length > 0 && (
        <p
          className="text-xs pt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {items.some(i => i.disposition === 'family_request')
            ? "These get saved when you close your day. Anything tagged \u201cAsk someone\u201d goes out as a real request — everything else stays just yours."
            : "These get saved when you close your day. Nothing goes out — it's all yours."}
        </p>
      )}
    </div>
  )
}
