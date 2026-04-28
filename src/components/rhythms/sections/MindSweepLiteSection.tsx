/**
 * PRD-18 Phase C Section Type #28 (Enhancement 2): MindSweep-Lite
 *
 * Mini embedded version of PRD-17B MindSweep inside the evening rhythm.
 *
 * Key decisions:
 *   - Reuses the existing `mindsweep-sort` Edge Function (NOT a new
 *     simplified "lite" classifier). Gets Haiku classification across
 *     all 11+ destinations that full MindSweep supports.
 *   - The "Lite" part is the UX: collapsed expandable, text-only input,
 *     batched commit on Close My Day (no mid-flow routing).
 *   - Adds one disposition unique to this context: `release` (frontend-
 *     only override that creates no record).
 *
 * Flow:
 *   1. Section is collapsed by default. On high-task days (>= 8 task
 *      completions today) it auto-expands with a gentle prompt.
 *   2. User types freeform text into a textarea.
 *   3. User taps [Parse]. We call mindsweep-sort with source_channel
 *      'rhythm_evening', aggressiveness 'always_ask' (so nothing
 *      auto-routes), input_type 'text'. The function returns
 *      classifications for each extracted item.
 *   4. For each returned item, we stage it in RhythmMetadataContext with
 *      text + disposition + classifier_suggested (both pointing to
 *      Haiku's suggestion initially).
 *   5. User sees items as pills with disposition tags. Tapping a tag
 *      opens a dropdown to override the disposition, including the
 *      "Release" escape hatch.
 *   6. On Close My Day, commitMindSweepLite writes all non-release
 *      items to their destinations with source='rhythm_mindsweep_lite'
 *      attribution. Release items stay in metadata as audit only.
 *
 * Privacy: Per CLAUDE.md convention #6, the mindsweep-sort auth pattern
 * already respects the family_id/member_id passed in the request body.
 * Items routed to 'journal' use visibility='private' (not shared_parents)
 * so this stays a personal brain-dump surface.
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
  DISPOSITION_DISPLAY_NAMES,
  DISPOSITION_PICK_ORDER,
  type MindSweepLiteDisposition,
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
 * Client-side working copy of a staged MindSweep-Lite item. We keep a
 * stable client-side key for React rendering; on stage, we strip it.
 */
interface WorkingItem extends StagedMindSweepLiteItem {
  key: number
}

/** Auto-expand when today's task completion count exceeds this. */
const HIGH_TASK_THRESHOLD = 8

/** Map mindsweep-sort destination string → our disposition enum. */
function normalizeDestination(dest: string): MindSweepLiteDisposition {
  // mindsweep-sort returns: task, list, calendar, journal, victory,
  // guiding_stars, best_intentions, backburner, innerworkings, archives, recipe
  switch (dest) {
    case 'task':
    case 'list':
    case 'calendar':
    case 'journal':
    case 'victory':
    case 'guiding_stars':
    case 'best_intentions':
    case 'backburner':
    case 'innerworkings':
    case 'archives':
    case 'recipe':
      return dest
    default:
      // Unknown destination — fall back to task as safe default
      return 'task'
  }
}

export function MindSweepLiteSection({
  familyId,
  memberId,
  readingSupport,
  collapsedByDefault = true,
}: Props) {
  const { stageMindSweepItems } = useRhythmMetadataStaging()

  // ─── Family members (for cross-member detection) ───────────
  // Build L.1: feeds mindsweep-sort's detectCrossMember so the
  // classifier can recognize delegation language like "ask Tenise"
  // and return cross_member_id + cross_member_action='suggest_route'
  // which we promote to disposition='family_request' below.
  // Excludes the current member — "ask myself" shouldn't delegate.
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

  // ─── Auto-expand heuristic ─────────────────────────────────
  // Query today's task_completed activity log count. If >= threshold,
  // the section auto-expands with a gentle prompt.
  const { data: todayTaskCount = 0 } = useQuery({
    queryKey: ['rhythm-mindsweep-autoexpand', memberId, todayLocalIso()],
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
  const [items, setItems] = useState<WorkingItem[]>([])
  const [nextKey, setNextKey] = useState(1)
  const [openDropdownKey, setOpenDropdownKey] = useState<number | null>(null)

  // Re-evaluate auto-expand when count changes
  useEffect(() => {
    if (shouldAutoExpand) setExpanded(true)
  }, [shouldAutoExpand])

  // Stage items whenever they change
  useEffect(() => {
    const toStage: StagedMindSweepLiteItem[] = items
      .filter(i => i.text.trim().length > 0)
      .map(i => ({
        text: i.text,
        disposition: i.disposition,
        classifier_suggested: i.classifier_suggested,
        classifier_confidence: i.classifier_confidence,
        destination_detail: i.destination_detail,
        recipient_member_id: i.recipient_member_id,
        recipient_name: i.recipient_name,
        trackProgress: i.trackProgress,
        trackDuration: i.trackDuration,
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

      // Append new items to any existing ones (Parse again behavior)
      // Build L.1: cross-member detection promotes actionable items to
      // disposition='family_request' so mom's "ask Dad" / "remind Sarah"
      // flow directly into the PRD-15 requests pipeline on Close My Day.
      let key = nextKey
      const newItems: WorkingItem[] = results.map(r => {
        const classifierDestination = normalizeDestination(r.destination)
        const isActionableCrossMember =
          r.cross_member_action === 'suggest_route' && !!r.cross_member_id
        const disposition: MindSweepLiteDisposition = isActionableCrossMember
          ? 'family_request'
          : classifierDestination
        const recipient_member_id = isActionableCrossMember
          ? (r.cross_member_id ?? null)
          : null
        const recipient_name = recipient_member_id
          ? memberNameLookup.get(recipient_member_id) ?? r.cross_member ?? null
          : null
        return {
          key: key++,
          text: r.extracted_text,
          disposition,
          // classifier_suggested stays as what the destination classifier
          // would have picked (task/calendar/etc.) — the cross-member
          // promotion is a UX-layer decision, not a classification.
          classifier_suggested: classifierDestination,
          classifier_confidence: r.confidence,
          destination_detail: r.destination_detail ?? null,
          recipient_member_id,
          recipient_name,
          trackProgress: false,
          trackDuration: false,
        }
      })
      setItems(prev => [...prev, ...newItems])
      setNextKey(key)
      setRawText('')
    } catch (err) {
      setParseError(
        err instanceof Error
          ? `Parsing hit a snag: ${err.message}`
          : 'Parsing hit a snag. Want to try again?',
      )
    } finally {
      setParsing(false)
    }
  }, [rawText, familyId, memberId, nextKey, familyMemberNames, memberNameLookup])

  const handleAddManualItem = () => {
    setItems(prev => [
      ...prev,
      {
        key: nextKey,
        text: '',
        disposition: 'task',
        classifier_suggested: 'task',
        trackProgress: false,
        trackDuration: false,
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

  const handleUpdateDisposition = (
    key: number,
    disposition: MindSweepLiteDisposition,
  ) => {
    setItems(prev =>
      prev.map(i => {
        if (i.key !== key) return i
        // When switching OFF family_request, clear recipient. When
        // switching TO family_request without an existing recipient,
        // auto-select the first available member (mom can change it
        // with the inline picker below the item).
        if (i.disposition === 'family_request' && disposition !== 'family_request') {
          return { ...i, disposition, recipient_member_id: null, recipient_name: null }
        }
        if (disposition === 'family_request' && !i.recipient_member_id && familyMemberNames.length > 0) {
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
    const utter = new SpeechSynthesisUtterance('Something on your mind?')
    window.speechSynthesis.speak(utter)
  }, [])

  const headerLabel = useMemo(() => {
    if (shouldAutoExpand && !items.length && !rawText) {
      return 'Busy day — want to clear your head before bed?'
    }
    return 'Something on your mind?'
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
        Dump whatever's looping. We'll sort it — you can override anything,
        and "Release" creates no record if you just want to name and let it go.
      </p>

      <textarea
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        placeholder="I need to call the dentist tomorrow. Worried about the girls' screen time..."
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
              Parsing…
            </>
          ) : (
            <>
              <Wand2 size={14} />
              {items.length > 0 ? 'Parse again' : 'Parse'}
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
            const isFamilyRequest = item.disposition === 'family_request'
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
                      {DISPOSITION_DISPLAY_NAMES[item.disposition]}
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
                        {DISPOSITION_PICK_ORDER.map(opt => {
                          // Hide family_request option if there are no
                          // other family members — nothing to delegate to.
                          if (opt === 'family_request' && familyMemberNames.length === 0) {
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
                              {DISPOSITION_DISPLAY_NAMES[opt]}
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
                {isFamilyRequest && familyMemberNames.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 pl-1">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Send to:
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

                {/* Track toggles — only for task disposition */}
                {item.disposition === 'task' && (
                  <div className="flex items-center gap-3 mt-1 pl-1">
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={item.trackProgress ?? false}
                        onChange={() => setItems(prev => prev.map(i => i.key === item.key ? { ...i, trackProgress: !i.trackProgress } : i))}
                        style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                      />
                      Multi-day
                    </label>
                    <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={item.trackDuration ?? false}
                        onChange={() => setItems(prev => prev.map(i => i.key === item.key ? { ...i, trackDuration: !i.trackDuration } : i))}
                        style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                      />
                      Track time
                    </label>
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
          These will be created when you Close My Day.
        </p>
      )}
    </div>
  )
}
