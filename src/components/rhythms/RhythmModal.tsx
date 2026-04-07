/**
 * PRD-18: RhythmModal
 *
 * Single modal component used for both Morning Rhythm and Evening Rhythm
 * (and future custom rhythms). The rhythm config drives which sections
 * render via SectionRendererSwitch.
 *
 * Behavior:
 *   - Auto-opens once per period via the dashboard mount logic (see
 *     RhythmDashboardCard) — this component just renders when isOpen.
 *   - Non-blocking: tap outside or X button → dismissNoAction (collapses
 *     to dashboard card without writing a completion record).
 *   - [Start/Close My Day] writes a 'completed' completion record.
 *   - [Snooze ▾] writes 'snoozed' status with snoozed_until timestamp.
 *   - [Dismiss for today] writes 'dismissed' status.
 *
 * Section sequence comes from rhythm_configs.sections (ordered JSONB).
 * Evening rhythm has section_order_locked=true so the order is fixed.
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, X, ChevronDown, Archive } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ModalV2 } from '@/components/shared/ModalV2'
import { SectionRendererSwitch } from './sections/SectionRendererSwitch'
import {
  useCompleteRhythm,
  useSnoozeRhythm,
  useDismissRhythm,
  useRhythmCompletion,
} from '@/hooks/useRhythms'
import type { RhythmConfig, RhythmSection } from '@/types/rhythms'
import { RhythmMetadataProvider, useRhythmMetadataStaging } from './RhythmMetadataContext'
import { commitTomorrowCapture, type StagedPriorityItem } from '@/lib/rhythm/commitTomorrowCapture'
import { commitMindSweepLite } from '@/lib/rhythm/commitMindSweepLite'
import { supabase } from '@/lib/supabase/client'

interface Props {
  config: RhythmConfig
  familyId: string
  memberId: string
  isOpen: boolean
  onClose: () => void
  /** Reading Support flag (Guided shell preference). Forwarded to sections. */
  readingSupport?: boolean
}

export function RhythmModal(props: Props) {
  // Provide the metadata staging context around the inner component so
  // section components can stage data for the Close My Day commit.
  return (
    <RhythmMetadataProvider>
      <RhythmModalInner {...props} />
    </RhythmMetadataProvider>
  )
}

function RhythmModalInner({ config, familyId, memberId, isOpen, onClose, readingSupport }: Props) {
  const isMorning = config.rhythm_key === 'morning'
  const isEvening = config.rhythm_key === 'evening'
  const completeRhythm = useCompleteRhythm()
  const snoozeRhythm = useSnoozeRhythm()
  const dismissRhythm = useDismissRhythm()
  // Read the current period's completion (daily rhythms only) so the
  // backlog prompt banner can check metadata.backlog_prompt_pending.
  const { data: currentCompletion } = useRhythmCompletion(
    memberId,
    config.rhythm_key === 'morning' || config.rhythm_key === 'evening' ? config.rhythm_key : undefined
  )
  const { readStagedMetadata, readStagedMindSweepItems } = useRhythmMetadataStaging()
  const queryClient = useQueryClient()
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)
  const snoozeMenuRef = useRef<HTMLDivElement>(null)

  // Close snooze dropdown on outside click
  useEffect(() => {
    if (!showSnoozeMenu) return
    function handler(e: MouseEvent) {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSnoozeMenu])

  // Sort sections by order, filter to enabled
  const orderedSections: RhythmSection[] = [...config.sections]
    .sort((a, b) => a.order - b.order)
    .filter(s => s.enabled)

  const handleComplete = async () => {
    setCommitError(null)
    let finalMetadata = readStagedMetadata()

    // Evening rhythm: commit any staged priority_items to the DB
    // (bump matched tasks to priority='now', insert new rhythm_priority
    // tasks for unmatched items, enrich with created_task_id). Throws
    // on write failure — we catch, show a toast, and DO NOT write the
    // completion so the user can retry without losing staged state.
    if (isEvening && finalMetadata.priority_items && finalMetadata.priority_items.length > 0) {
      try {
        const stagedItems: StagedPriorityItem[] = finalMetadata.priority_items.map(p => ({
          text: p.text,
          matchedTaskId: p.matched_task_id,
          matchedTaskTitle: p.matched_task_title ?? null,
          focusSelected: p.focus_selected ?? true,
          promptVariantIndex: p.prompt_variant_index ?? 0,
        }))
        const enriched = await commitTomorrowCapture({
          familyId,
          memberId,
          items: stagedItems,
        })
        finalMetadata = { ...finalMetadata, priority_items: enriched }
        // Invalidate tasks cache so Morning Priorities Recall sees the
        // new/bumped tasks next time it queries.
        queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
      } catch (err) {
        setCommitError(
          err instanceof Error
            ? err.message
            : 'Something went wrong saving your priorities. Try again?'
        )
        return
      }
    }

    // Phase C: Evening rhythm MindSweep-Lite commit. Unlike Tomorrow
    // Capture, this NEVER throws — per-item failures are recorded as
    // commit_error in metadata and the completion still writes. Mom's
    // thoughts aren't lost to a transient write failure.
    if (isEvening) {
      const stagedMindSweep = readStagedMindSweepItems()
      if (stagedMindSweep.length > 0) {
        const enrichedMindSweep = await commitMindSweepLite({
          familyId,
          memberId,
          items: stagedMindSweep,
        })
        finalMetadata = { ...finalMetadata, mindsweep_items: enrichedMindSweep }
        // Invalidate caches for destinations that may have received new rows
        queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
        queryClient.invalidateQueries({ queryKey: ['victories'] })
        queryClient.invalidateQueries({ queryKey: ['guiding-stars'] })
        queryClient.invalidateQueries({ queryKey: ['best-intentions'] })
        queryClient.invalidateQueries({ queryKey: ['studio-queue'] })
      }
    }

    await completeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
      metadata: finalMetadata,
    })

    // Invalidate the morning recall query so tomorrow morning reads
    // the just-written completion.
    queryClient.invalidateQueries({
      queryKey: ['rhythm-last-evening-completion', familyId, memberId],
    })

    onClose()
  }

  const handleSnooze = async (minutes: number) => {
    await snoozeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
      snoozeMinutes: minutes,
    })
    setShowSnoozeMenu(false)
    onClose()
  }

  const handleDismissForToday = async () => {
    await dismissRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
    })
    setShowSnoozeMenu(false)
    onClose()
  }

  const HeaderIcon = isMorning ? Sun : Moon
  const actionLabel = isMorning ? 'Start My Day' : 'Close My Day'

  return (
    <ModalV2
      id={`rhythm-${config.rhythm_key}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={config.display_name}
      icon={HeaderIcon}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm rounded-md px-3 py-2 transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            <X size={16} className="inline mr-1" />
            Close
          </button>

          <div className="flex items-center gap-2 relative">
            <div ref={snoozeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSnoozeMenu(v => !v)}
                className="text-sm rounded-md px-3 py-2 inline-flex items-center gap-1 transition-colors"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                Snooze
                <ChevronDown size={14} />
              </button>
              {showSnoozeMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 rounded-lg shadow-lg overflow-hidden min-w-44 z-50"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  <SnoozeMenuItem onClick={() => handleSnooze(30)}>
                    Remind me in 30 min
                  </SnoozeMenuItem>
                  <SnoozeMenuItem onClick={() => handleSnooze(60)}>
                    Remind me in 1 hour
                  </SnoozeMenuItem>
                  <SnoozeMenuItem onClick={handleDismissForToday}>
                    Dismiss for today
                  </SnoozeMenuItem>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={completeRhythm.isPending}
              className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {completeRhythm.isPending ? 'Saving…' : actionLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {commitError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--color-danger, #b91c1c) 10%, transparent)',
              border: '1px solid var(--color-danger, #b91c1c)',
              color: 'var(--color-text-primary)',
            }}
          >
            {commitError}
          </div>
        )}
        {isEvening && currentCompletion?.metadata?.backlog_prompt_pending && (
          <BacklogPromptBanner
            completionId={currentCompletion.id}
            taskCount={currentCompletion.metadata.backlog_prompt_task_count ?? 0}
          />
        )}
        {orderedSections.map(section => (
          <SectionRendererSwitch
            key={section.section_type}
            section={section}
            rhythmKey={config.rhythm_key}
            familyId={familyId}
            memberId={memberId}
            reflectionCount={config.reflection_guideline_count}
            readingSupport={readingSupport}
          />
        ))}
      </div>
    </ModalV2>
  )
}

// ─── Backlog Prompt Banner ───────────────────────────────────
//
// Rendered at the top of the evening rhythm modal when the carry
// forward midnight job detected an accumulated backlog. Shows a
// gentle "want to do a quick sweep?" prompt with two options:
//   [Start Sweep]  → link to /tasks filtered by overdue
//   [Not now]      → dismiss the banner for this period
//
// Dismiss writes metadata.last_backlog_prompt_at = NOW() and clears
// metadata.backlog_prompt_pending. The cron's weekly-frequency check
// then skips this member for the next week. "Start Sweep" also
// records last_backlog_prompt_at so the prompt doesn't re-fire after
// the user takes action.

function BacklogPromptBanner({
  completionId,
  taskCount,
}: {
  completionId: string
  taskCount: number
}) {
  const queryClient = useQueryClient()
  const [dismissing, setDismissing] = useState(false)

  const markHandled = async (): Promise<void> => {
    setDismissing(true)
    const { data: current } = await supabase
      .from('rhythm_completions')
      .select('metadata')
      .eq('id', completionId)
      .single()

    const existing = (current?.metadata ?? {}) as Record<string, unknown>
    const merged = {
      ...existing,
      backlog_prompt_pending: false,
      last_backlog_prompt_at: new Date().toISOString(),
    }

    await supabase
      .from('rhythm_completions')
      .update({ metadata: merged })
      .eq('id', completionId)

    // Force the modal's currentCompletion query to refetch so the
    // banner hides immediately.
    queryClient.invalidateQueries({ queryKey: ['rhythm-completion'] })
    setDismissing(false)
  }

  return (
    <div
      className="rounded-lg p-4 flex items-start gap-3"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 8%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <Archive
        size={18}
        style={{ color: 'var(--color-accent-deep)', flexShrink: 0, marginTop: 2 }}
      />
      <div className="flex-1">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          You have {taskCount} things that have been sitting for a while. Want to do
          a quick sweep?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            to="/tasks?filter=overdue"
            onClick={() => {
              void markHandled()
            }}
            className="text-xs font-semibold rounded-md px-3 py-1.5"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Start sweep
          </Link>
          <button
            type="button"
            onClick={markHandled}
            disabled={dismissing}
            className="text-xs rounded-md px-3 py-1.5 disabled:opacity-50"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

function SnoozeMenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-opacity-50"
      style={{
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </button>
  )
}
