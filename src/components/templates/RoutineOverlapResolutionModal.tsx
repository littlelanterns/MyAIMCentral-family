/**
 * Worker ROUTINE-PROPAGATION (c2.5, founder D5) — overlap resolution
 * modal.
 *
 * Lives under src/components/templates/ (not src/components/tasks/)
 * per founder D6 Thread 1: shared template UI folder for utilities
 * future Worker 2 SHARED-ROUTINES and Worker 3 SHARED-LISTS can reuse.
 *
 * Shown when mom tries to deploy a routine to a family member who
 * already has the same routine active over an overlapping date range.
 * Three options:
 *   - Replace the existing one (archives old, deploys new)
 *   - Keep both, but adjust the dates (closes modal so mom can edit
 *     the date pickers in TaskCreationModal)
 *   - Cancel — let me think about it
 *
 * Plus an "Open existing routine" deep link so mom doesn't have to
 * hunt for the existing deployment.
 *
 * Naming: never uses "kid" or "child". Per founder naming requirement.
 */

import { useMemo } from 'react'
import { CalendarClock, ArrowRight, X } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'
import type { RoutineOverlapCandidate } from '@/lib/templates/detectRoutineOverlap'

export type RoutineOverlapChoice =
  | { kind: 'replace'; existingTaskId: string }
  | { kind: 'adjust' }
  | { kind: 'cancel' }

export interface RoutineOverlapResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  /** All overlapping candidates surfaced by detectRoutineOverlap */
  candidates: RoutineOverlapCandidate[]
  /** New deployment proposed dtstart (YYYY-MM-DD) */
  proposedDtstart: string
  /** New deployment proposed end_date (YYYY-MM-DD or null = ongoing) */
  proposedEndDate: string | null
  /** Master template name for the modal copy */
  templateName: string
  /** Called when mom picks one of the three options */
  onResolve: (choice: RoutineOverlapChoice) => void
  /**
   * Optional deep link callback — called when mom taps "Open existing
   * routine". Caller is responsible for navigation (e.g. close current
   * modal, route to the existing deployment in edit mode with the
   * start-date field highlighted).
   */
  onOpenExistingRoutine?: (existingTaskId: string) => void
}

function formatDate(iso: string | null): string {
  if (!iso) return 'ongoing'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRange(start: string, end: string | null): string {
  if (end === null) return `${formatDate(start)} → ongoing`
  return `${formatDate(start)} → ${formatDate(end)}`
}

export function RoutineOverlapResolutionModal({
  isOpen,
  onClose,
  candidates,
  proposedDtstart,
  proposedEndDate,
  templateName,
  onResolve,
  onOpenExistingRoutine,
}: RoutineOverlapResolutionModalProps) {
  // Group by assignee — when mom is deploying to multiple members, the
  // modal should show one summary block per affected person.
  const byAssignee = useMemo(() => {
    const map = new Map<string, RoutineOverlapCandidate[]>()
    for (const c of candidates) {
      const list = map.get(c.assigneeId) ?? []
      list.push(c)
      map.set(c.assigneeId, list)
    }
    return Array.from(map.entries())
  }, [candidates])

  // Modal copy says "Which days should [Name] actually be working on
  // [Template Name]?" — singular when one assignee, generic when many.
  const headlineName =
    byAssignee.length === 1
      ? byAssignee[0][1][0].assigneeDisplayName
      : 'these family members'

  return (
    <ModalV2
      id="routine-overlap-resolution"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title="Already assigned"
      subtitle={`${templateName} overlaps an active deployment`}
      icon={CalendarClock}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Per-assignee summary */}
        <div className="flex flex-col gap-3">
          {byAssignee.map(([assigneeId, list]) => {
            const first = list[0]
            return (
              <div
                key={assigneeId}
                className="flex flex-col gap-2 px-3 py-3 rounded-lg"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {templateName} is already assigned to{' '}
                  {first.assigneeDisplayName} from{' '}
                  <strong>
                    {formatRange(first.existingDtstart, first.existingEndDate)}
                  </strong>
                  .
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Your new deployment runs{' '}
                  <strong>{formatRange(proposedDtstart, proposedEndDate)}</strong>.
                  Those overlap.
                </div>
                {onOpenExistingRoutine && list.length === 1 && (
                  <button
                    type="button"
                    onClick={() => onOpenExistingRoutine(first.existingTaskId)}
                    className="self-start inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{
                      color: 'var(--color-btn-primary-bg)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem 0',
                    }}
                  >
                    Open existing routine
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Question */}
        <div
          className="text-sm font-medium pt-1"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Which days should {headlineName} actually be working on{' '}
          {templateName}?
        </div>

        {/* Three options as full-width primary/secondary actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => {
              // "Replace the existing one" — only meaningful when there's
              // a single overlapping deployment. When there are many, this
              // archives them all in turn (handled by caller via the
              // candidates list).
              if (candidates.length > 0) {
                onResolve({
                  kind: 'replace',
                  existingTaskId: candidates[0].existingTaskId,
                })
              }
            }}
          >
            Replace the existing one
          </Button>
          <Button
            variant="secondary"
            onClick={() => onResolve({ kind: 'adjust' })}
          >
            Keep both, but adjust the dates
          </Button>
          <Button
            variant="ghost"
            onClick={() => onResolve({ kind: 'cancel' })}
          >
            <X size={14} />
            Cancel — let me think about it
          </Button>
        </div>

        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Past completions on the existing routine stay as-is regardless
          of which option you pick — only future routine days reflect the
          change.
        </p>
      </div>
    </ModalV2>
  )
}
