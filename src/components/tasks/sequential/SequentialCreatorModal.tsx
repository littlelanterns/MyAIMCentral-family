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

import { useState, useMemo } from 'react'
import { ModalV2 } from '@/components/shared'
import { SequentialCreator, type SequentialCreateData, type SequentialCreateDefaults } from './SequentialCreator'
import { useCreateSequentialCollection } from '@/hooks/useSequentialCollections'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'

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
}

export function SequentialCreatorModal({
  isOpen,
  onClose,
  familyId,
  createdBy,
  defaultAssigneeId,
  onSaved,
  initialDefaults,
  title,
}: SequentialCreatorModalProps) {
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const createCollection = useCreateSequentialCollection()
  const [assigneeId, setAssigneeId] = useState<string | null>(defaultAssigneeId ?? null)
  const [error, setError] = useState<string | null>(null)

  // Prefer children for assignment (typical case). Fall back to any active member.
  const assignableMembers = useMemo<FamilyMember[]>(() => {
    const children = familyMembers.filter(m => m.role === 'member' && m.is_active)
    if (children.length > 0) return children
    return familyMembers.filter(m => m.is_active)
  }, [familyMembers])

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
          life_area_tag: (data.lifeAreaTag as any) ?? null,
          reward_per_item_type: null,
          reward_per_item_amount: null,
          // Build J: advancement defaults flow through from the creator form
          default_advancement_mode: data.defaultAdvancementMode,
          default_practice_target: data.defaultPracticeTarget,
          default_require_approval: data.defaultRequireApproval,
          default_require_evidence: data.defaultRequireEvidence,
          default_track_duration: data.defaultTrackDuration,
        },
        // Build J: items carry optional per-item metadata from curriculum-parse.
        // When metadata is absent the hook uses collection-level defaults.
        items: data.items,
        assigneeId,
        createdBy,
      })
      onSaved?.(result.collection.id)
      handleClose()
    } catch (err) {
      console.error('[SequentialCreatorModal] Failed to create collection:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  function handleClose() {
    setError(null)
    setAssigneeId(defaultAssigneeId ?? null)
    onClose()
  }

  return (
    <ModalV2
      id="sequential-creator"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      title={title ?? 'New Sequential Collection'}
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
          onCancel={handleClose}
          initialDefaults={initialDefaults}
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
  )
}
