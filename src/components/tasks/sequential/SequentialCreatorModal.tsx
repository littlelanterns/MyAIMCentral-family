/**
 * SequentialCreatorModal (PRD-09A/09B Studio Intelligence Phase 1)
 *
 * Single source of truth for sequential collection creation. Wraps the
 * existing SequentialCreator component in a ModalV2 shell, adds an
 * assignee picker (which SequentialCreator doesn't provide), and calls
 * useCreateSequentialCollection to produce a real sequential_collections
 * row plus the N child task rows.
 *
 * Used from Studio, Tasks page, and Lists page. Before this modal existed,
 * all three entry points opened TaskCreationModal with initialTaskType=
 * 'sequential', which silently created a broken single-row task with no
 * children and no sequential_collections entry.
 *
 * No assignee-picker UI in SequentialCreator itself — kept there focused on
 * content. The deployment context (who gets it) belongs on the wrapper.
 */

import { useState, useMemo, useCallback } from 'react'
import { ModalV2 } from '@/components/shared'
import {
  SequentialCreator,
  type SequentialCreateData,
  type SequentialCreateDefaults,
  type SequentialCreatorDraftValue,
} from './SequentialCreator'
import { useCreateSequentialCollection } from '@/hooks/useSequentialCollections'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useAssignableMembers } from '@/hooks/useAssignableMembers'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { useWizardDraftChrome } from '@/components/studio/wizards/useWizardDraftChrome'
import { WizardDraftReopenPrompt, WizardDraftClosePrompt } from '@/components/studio/wizards/WizardDraftPrompts'

interface SequentialCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  /** member who is pressing Save — creator of the collection */
  createdBy: string
  /** Optional default assignee. If omitted, mom picks from a compact list. */
  defaultAssigneeId?: string
  /** Called after successful save with the new collection id. */
  onSaved?: (collectionId: string) => void
  /** Build J: optional preset advancement defaults (e.g. Reading List template) */
  initialDefaults?: Partial<SequentialCreateDefaults>
  /** Build J: optional modal title override (e.g. "Create Reading List") */
  title?: string
  /** ST-A (F-04): pre-filled collection title for example templates */
  initialTitle?: string
  /** ST-A (F-04): pre-filled item names for example templates — editable */
  initialItems?: string[]
}

export function SequentialCreatorModal({
  isOpen,
  onClose,
  familyId,
  createdBy,
  defaultAssigneeId,
  onSaved,
  initialDefaults,
  title: modalTitleOverride,
  initialTitle,
  initialItems,
}: SequentialCreatorModalProps) {
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const createCollection = useCreateSequentialCollection()
  const [error, setError] = useState<string | null>(null)

  // RR-DEPLOY-SCOPING: limit to who the current member may assign tasks to
  // (DB mirrors via util.task_assign_allowed WITH CHECK, migration 100262).
  const { assignableIds } = useAssignableMembers()

  // Prefer children for assignment (typical case). Fall back to any active member.
  const assignableMembers = useMemo<FamilyMember[]>(() => {
    const scoped = familyMembers.filter(m => m.is_active && assignableIds.has(m.id))
    const children = scoped.filter(m => m.role === 'member')
    if (children.length > 0) return children
    return scoped
  }, [familyMembers, assignableIds])

  // ── STUDIO-EXPERIENCE ST-C.2 — save-and-return ──────────────────────
  // Draft-relevant state lives HERE (the wrapper), not inside
  // SequentialCreator, so it can flow through useWizardDraftChrome the
  // same way the 10 Setup Wizards do. `assigneeId` is wrapper-only state;
  // `creatorValue` is the lifted controlled value handed down to
  // SequentialCreator (see that component's doc comment).
  const [assigneeId, setAssigneeId] = useState<string | null>(defaultAssigneeId ?? null)
  const defaultCreatorValue = useCallback(
    (): SequentialCreatorDraftValue => ({
      title: initialTitle ?? '',
      rawText: initialItems?.length ? initialItems.join('\n') : '',
      defaultAdvancementMode: initialDefaults?.defaultAdvancementMode ?? 'complete',
      defaultPracticeTarget: initialDefaults?.defaultPracticeTarget ?? 5,
      defaultRequireApproval: initialDefaults?.defaultRequireApproval ?? true,
      defaultRequireEvidence: initialDefaults?.defaultRequireEvidence ?? false,
      defaultTrackDuration: initialDefaults?.defaultTrackDuration ?? false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [creatorValue, setCreatorValue] = useState<SequentialCreatorDraftValue>(defaultCreatorValue)

  interface SequentialDraftState {
    assigneeId: string | null
    creatorValue: SequentialCreatorDraftValue
  }
  const draftState: SequentialDraftState = { assigneeId, creatorValue }
  const applyDraftState = useCallback((next: SequentialDraftState) => {
    setAssigneeId(next.assigneeId)
    setCreatorValue(next.creatorValue)
  }, [])

  const draftChrome = useWizardDraftChrome<SequentialDraftState>({
    wizardType: 'sequential_creator',
    familyId,
    memberId: createdBy,
    isOpen,
    state: draftState,
    setState: applyDraftState,
    getTitle: () => creatorValue.title.trim() || 'Untitled Sequential Collection',
    hasContent: () => creatorValue.title.trim().length > 0 || creatorValue.rawText.trim().length > 0,
    skipReopenPrompt: !!(initialTitle || (initialItems && initialItems.length > 0)),
    onRealClose: onClose,
  })

  const resetCreatorState = useCallback(() => {
    setAssigneeId(defaultAssigneeId ?? null)
    setCreatorValue(defaultCreatorValue())
  }, [defaultAssigneeId, defaultCreatorValue])

  async function handleSave(data: SequentialCreateData) {
    setError(null)
    if (!assigneeId) {
      setError('Pick who this collection is for before saving.')
      return
    }
    try {
      const result = await createCollection.mutateAsync({
        collection: {
          family_id: familyId,
          template_id: null,
          title: data.title,
          active_count: data.activeCount,
          promotion_timing: data.promotionTiming,
          allow_out_of_order: data.allowOutOfOrder,
          life_area_tag: (data.lifeAreaTag as any) ?? null,
          life_area_tags: (data.lifeAreaTag ? [data.lifeAreaTag] : []) as any,
          reward_per_item_type: null,
          reward_per_item_amount: null,
          default_advancement_mode: data.defaultAdvancementMode,
          default_practice_target: data.defaultPracticeTarget,
          default_require_approval: data.defaultRequireApproval,
          default_require_evidence: data.defaultRequireEvidence,
          default_track_duration: data.defaultTrackDuration,
        },
        items: data.items,
        assigneeId,
        createdBy,
        victoryFlagged: data.victoryFlagged,
        countsForHomework: data.countsForHomework,
        homeworkSubjectIds: data.homeworkSubjectIds,
      })
      onSaved?.(result.collection.id)
      await draftChrome.onDeploySuccess()
      setError(null)
      setAssigneeId(defaultAssigneeId ?? null)
      onClose()
    } catch (err) {
      console.error('[SequentialCreatorModal] Failed to create collection:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  return (
    <>
    <ModalV2
      id="sequential-creator"
      isOpen={isOpen}
      onClose={draftChrome.requestClose}
      type="transient"
      title={modalTitleOverride ?? 'New Sequential Collection'}
      size="md"
    >
      <div className="flex flex-col gap-3">
        {/* Assignee picker — the one thing SequentialCreator doesn't collect */}
        {assignableMembers.length > 0 && (
          <div className="px-4 pt-3">
            <label
              className="text-xs font-medium block mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Who is this for?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {assignableMembers.map(m => {
                const selected = assigneeId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAssigneeId(m.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: selected
                        ? getMemberColor(m)
                        : 'var(--color-bg-secondary)',
                      color: selected
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-primary)',
                      border: selected
                        ? '1px solid transparent'
                        : `1px solid ${getMemberColor(m)}`,
                    }}
                  >
                    {m.display_name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div
            className="mx-4 px-3 py-2 rounded-lg text-xs"
            style={{
              background: 'color-mix(in srgb, var(--color-error, #dc2626) 10%, transparent)',
              color: 'var(--color-error, #dc2626)',
              border: '1px solid color-mix(in srgb, var(--color-error, #dc2626) 30%, transparent)',
            }}
          >
            {error}
          </div>
        )}

        <SequentialCreator
          familyId={familyId}
          memberId={createdBy}
          onSave={handleSave}
          onCancel={draftChrome.requestClose}
          initialDefaults={initialDefaults}
          initialTitle={initialTitle}
          initialItems={initialItems}
          value={creatorValue}
          onValueChange={setCreatorValue}
          onSaveDraft={draftChrome.chromeProps.onSaveAndComeBack}
          isSavingDraft={draftChrome.chromeProps.isSavingDraft}
        />

        {createCollection.isPending && (
          <div
            className="px-4 pb-3 text-xs text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Creating collection…
          </div>
        )}
      </div>
    </ModalV2>

    <WizardDraftReopenPrompt
      isOpen={draftChrome.chromeProps.showReopenPrompt}
      drafts={draftChrome.chromeProps.pendingDrafts}
      onContinue={draftChrome.chromeProps.onContinueDraft}
      onStartFresh={() => {
        resetCreatorState()
        draftChrome.chromeProps.onStartFresh()
      }}
    />
    <WizardDraftClosePrompt
      isOpen={draftChrome.chromeProps.showClosePrompt}
      isSaving={draftChrome.chromeProps.isSavingDraft}
      onSaveAndClose={draftChrome.chromeProps.onConfirmSaveAndClose}
      onDiscardAndClose={async () => {
        await draftChrome.chromeProps.onConfirmDiscardAndClose()
        resetCreatorState()
      }}
      onKeepWorking={draftChrome.chromeProps.onCancelClosePrompt}
    />
    </>
  )
}
