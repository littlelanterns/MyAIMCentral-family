/**
 * TaskEditModal — the TaskCreationModal edit-mode instance with its prop
 * mapping in ONE place.
 *
 * FO-COMMAND-CENTER (2026-06-10): extracted from Tasks.tsx so the Family
 * Overview spot-check view mounts the identical edit modal (founder Q4).
 * The editTaskId prop is the checkbox-honesty identity signal (2026-05-25) —
 * do not replace it with the inline editTaskValues object.
 */

import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { TaskEditor } from '@/hooks/useTaskEditor'

export function TaskEditModal({ editor }: { editor: TaskEditor }) {
  const { editingTask, editRoutineSections, saveEditTask, closeEditor } = editor
  if (!editingTask) return null

  return (
    <TaskCreationModal
      isOpen={true}
      onClose={closeEditor}
      onSave={saveEditTask}
      editMode
      initialTaskType={editingTask.task_type}
      defaultTitle={editingTask.title}
      defaultDescription={editingTask.description ?? ''}
      initialRoutineSections={editRoutineSections}
      editingTemplateId={editingTask.template_id ?? undefined}
      // Checkbox-honesty fix (2026-05-25): stable identity signal that
      // distinguishes a real edit-target swap from parent-render noise.
      editTaskId={editingTask.id}
      editTaskValues={{
        incompleteAction: editingTask.incomplete_action ?? undefined,
        lifeAreaTag: editingTask.life_area_tags?.[0] ?? editingTask.life_area_tag ?? undefined,
        durationEstimate: editingTask.duration_estimate ?? undefined,
        dueDate: editingTask.due_date ?? undefined,
        requireApproval: editingTask.require_approval ?? undefined,
        victoryFlagged: editingTask.victory_flagged ?? undefined,
        trackProgress: editingTask.track_progress ?? undefined,
        trackDuration: editingTask.track_duration ?? undefined,
        countsForAllowance: editingTask.counts_for_allowance ?? undefined,
        countsForHomework: editingTask.counts_for_homework ?? undefined,
        countsForGamification: editingTask.counts_for_gamification ?? undefined,
        // KIDS-REWARDS-PAGE Q5c: hydrate the custom-reward promise fields so
        // edit-save never silently nulls them (checkbox-honesty class).
        rewardDescription: editingTask.reward_description ?? undefined,
        rewardImageUrl: editingTask.reward_image_url ?? undefined,
        rewardImageAssetKey: editingTask.reward_image_asset_key ?? undefined,
      }}
    />
  )
}
