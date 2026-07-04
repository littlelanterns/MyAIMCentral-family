/**
 * ProposalArtifactCreator — KIDS-REWARDS-PAGE Slice 4 (gate §5/§6).
 *
 * The prefill-confirm launcher shared by mom's Approve flow (Queue
 * RequestsTab) and the adult self-propose screen. Opens the appropriate
 * EXISTING creation flow prefilled from the proposal terms — NEVER silent
 * auto-create (founder decision):
 *
 *   once           → TaskCreationModal (task) — reward Section 7 pre-seeded
 *                     with reward_type='privilege' + description + image (Q5)
 *   finish_list    → TaskCreationModal (routine) — one show-until-complete
 *                     checklist section built from the proposed items
 *   streak_n_days  → WidgetConfiguration (streak tracker) — synthetic starter
 *                     config carrying goal_days + prize_label + prize image
 *                     (G1/R2: promise recorded now; goal-reached firing is the
 *                     registered follow-up)
 *
 * The confirmer can adjust anything in the modal (due dates, approval,
 * schedule, values) before saving — that IS the confirm step. On save we
 * report the created artifact back so the caller can stamp the proposal
 * (accepted + created_artifact_type/id).
 *
 * Task/routine outcomes flow through the Slice 1 award pipeline untouched
 * (task_rewards reward_type='privilege' → award_custom_reward_for_completion).
 */

import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { RoutineSection } from '@/components/tasks/RoutineSectionEditor'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import type { CreateWidget, WidgetStarterConfig } from '@/types/widgets'
import { useCreateWidget } from '@/hooks/useWidgets'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { createTaskFromData } from '@/utils/createTaskFromData'
import type { ProposalArtifactType, ProposalTerms } from '@/types/rewardProposals'

export interface ProposalArtifactCreatorProps {
  terms: ProposalTerms
  familyId: string
  /** Who earns the reward — the kid on approve, the proposer on self-propose. */
  assigneeId: string
  /** Who is confirming/creating — mom on approve, the adult on self-propose. */
  creatorId: string
  /** Provenance: written to tasks.source_reference_id (source='reward_proposal'). */
  proposalId?: string
  /** Kid deals default require_approval ON (mom can uncheck in the modal). */
  requireApprovalDefault?: boolean
  /** §11 self-reward visibility. Omit for kid deals (NULL → 'family'). */
  rewardVisibility?: 'private' | 'shared'
  rewardSharedWith?: string[]
  onCreated: (artifactType: ProposalArtifactType, artifactId: string | null) => Promise<void> | void
  onClose: () => void
}

export function ProposalArtifactCreator({
  terms,
  familyId,
  assigneeId,
  creatorId,
  proposalId,
  requireApprovalDefault = false,
  rewardVisibility,
  rewardSharedWith,
  onCreated,
  onClose,
}: ProposalArtifactCreatorProps) {
  const queryClient = useQueryClient()
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const createWidget = useCreateWidget()

  const initialReward = useMemo(
    () => ({
      rewardType: 'privilege' as const,
      rewardDescription: terms.want_text,
      rewardImageUrl: terms.want_image_url,
      rewardImageAssetKey: terms.want_image_asset_key,
      requireApproval: requireApprovalDefault,
    }),
    [terms, requireApprovalDefault],
  )

  // finish_list → one show-until-complete checklist section from the items
  const routineSections = useMemo<RoutineSection[] | undefined>(() => {
    if (terms.earn_structure !== 'finish_list') return undefined
    const items = (terms.params.items ?? []).map(i => i.trim()).filter(Boolean)
    return [
      {
        id: crypto.randomUUID(),
        name: terms.will_text || 'The list',
        frequency: 'daily',
        customDays: [],
        showUntilComplete: true,
        steps: items.map((item, i) => ({
          id: crypto.randomUUID(),
          title: item,
          notes: '',
          showNotes: false,
          instanceCount: 1,
          requirePhoto: false,
          sort_order: i,
          step_type: 'static' as const,
          linked_source_id: null,
          linked_source_type: null,
          display_name_override: null,
        })),
        sort_order: 0,
        isEditing: false,
      },
    ]
  }, [terms])

  const handleTaskSave = async (data: CreateTaskData) => {
    data.source = 'reward_proposal'
    if (proposalId) data.sourceReferenceId = proposalId
    if (rewardVisibility) {
      data.rewardVisibility = rewardVisibility
      data.rewardSharedWith = rewardSharedWith ?? []
    }
    const result = await createTaskFromData(supabase, data, familyId, creatorId, familyMembers)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task-assignments-member'] })
    // Record what was ACTUALLY confirmed (the confirmer may flip the type)
    await onCreated(data.taskType === 'routine' ? 'routine' : 'task', result.taskIds[0] ?? null)
    onClose()
  }

  // streak_n_days → synthetic starter config for the streak tracker
  const streakStarter = useMemo<WidgetStarterConfig | null>(() => {
    if (terms.earn_structure !== 'streak_n_days') return null
    const days = terms.params.days ?? 7
    return {
      id: `proposal-${proposalId ?? 'self'}`,
      tracker_type: 'streak',
      visual_variant: 'flame_counter',
      config_name: `${terms.will_text} — ${days} days in a row`,
      description: null,
      category: null,
      default_config: {
        goal_days: days,
        prize_label: terms.want_text,
        prize_image_url: terms.want_image_url,
        prize_image_asset_key: terms.want_image_asset_key,
      },
      is_example: false,
      sort_order: 0,
      created_at: '',
      updated_at: '',
    }
  }, [terms, proposalId])

  const handleWidgetDeploy = async (widget: CreateWidget) => {
    try {
      const created = await createWidget.mutateAsync(widget)
      await onCreated('tracker', created.id)
    } catch (err) {
      console.error('[ProposalArtifactCreator] tracker deploy failed:', err)
    }
    onClose()
  }

  if (terms.earn_structure === 'streak_n_days') {
    return (
      <WidgetConfiguration
        key={`proposal-widget-${proposalId ?? 'self'}`}
        isOpen={true}
        onClose={onClose}
        starterConfig={streakStarter}
        familyId={familyId}
        memberId={assigneeId}
        familyMembers={familyMembers.map(m => ({
          id: m.id,
          display_name: m.display_name,
          assigned_color: m.assigned_color,
          member_color: m.member_color,
        }))}
        onDeploy={handleWidgetDeploy}
      />
    )
  }

  return (
    <TaskCreationModal
      key={`proposal-task-${proposalId ?? 'self'}`}
      isOpen={true}
      onClose={onClose}
      onSave={handleTaskSave}
      mode="full"
      initialTaskType={terms.earn_structure === 'finish_list' ? 'routine' : 'task'}
      defaultTitle={terms.will_text}
      initialAssigneeId={assigneeId}
      initialReward={initialReward}
      initialRoutineSections={routineSections}
    />
  )
}
