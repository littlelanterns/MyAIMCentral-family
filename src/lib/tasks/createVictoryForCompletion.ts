import { supabase } from '@/lib/supabase/client'
import { createVictoryForDeed } from '@/lib/victories/createVictoryForDeed'
import type { MemberType } from '@/types/victories'

function dashboardModeToMemberType(dashboardMode: string | null | undefined): MemberType {
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  if (dashboardMode === 'independent') return 'teen'
  return 'adult'
}

async function insertVictoryIfNotExists(params: {
  familyId: string
  memberId: string
  taskTitle: string
  taskId: string
  lifeAreaTags: string[]
  memberType: MemberType
}) {
  await createVictoryForDeed({
    familyId: params.familyId,
    memberId: params.memberId,
    description: params.taskTitle,
    source: 'task_completed',
    sourceReferenceId: params.taskId,
    lifeAreaTags: params.lifeAreaTags,
  })
}

/**
 * Fire-and-forget victory creation for a completed task with victory_flagged=true.
 *
 * Single-completer: creates one victory for the completing member.
 * Shared tasks: creates one victory per participating member (all approved/null completions).
 * Idempotent: checks for existing victory before inserting.
 */
export async function createVictoryForCompletion(params: {
  task: { id: string; title: string; victory_flagged?: boolean; is_shared?: boolean; family_id: string; life_area_tags?: string[] | null }
  completerId: string
  familyId: string
}): Promise<void> {
  const { task, completerId, familyId } = params

  if (!task.victory_flagged) return

  try {
    const lifeAreaTags = task.life_area_tags ?? []

    if (task.is_shared) {
      const { data: completions } = await supabase
        .from('task_completions')
        .select('family_member_id')
        .eq('task_id', task.id)
        .or('approval_status.is.null,approval_status.eq.approved')

      const memberIds = new Set<string>()
      if (completions) {
        for (const c of completions) {
          if (c.family_member_id) memberIds.add(c.family_member_id)
        }
      }
      memberIds.add(completerId)

      const { data: members } = await supabase
        .from('family_members')
        .select('id, dashboard_mode')
        .in('id', [...memberIds])

      const memberMap = new Map<string, MemberType>()
      if (members) {
        for (const m of members) {
          memberMap.set(m.id, dashboardModeToMemberType(m.dashboard_mode))
        }
      }

      await Promise.all(
        [...memberIds].map(mid =>
          insertVictoryIfNotExists({
            familyId,
            memberId: mid,
            taskTitle: task.title,
            taskId: task.id,
            lifeAreaTags: lifeAreaTags,
            memberType: memberMap.get(mid) ?? 'adult',
          }),
        ),
      )
    } else {
      const { data: memberRow } = await supabase
        .from('family_members')
        .select('dashboard_mode')
        .eq('id', completerId)
        .single()

      const memberType = dashboardModeToMemberType(memberRow?.dashboard_mode)

      await insertVictoryIfNotExists({
        familyId,
        memberId: completerId,
        taskTitle: task.title,
        taskId: task.id,
        lifeAreaTags: lifeAreaTags,
        memberType,
      })
    }
  } catch (err) {
    console.warn('[victory] createVictoryForCompletion failed (non-blocking):', err)
  }
}
