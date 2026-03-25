/**
 * Visual Schedule Helpers
 *
 * Query and manage visual schedule routines, steps, and assignments.
 * System routines are pre-built (10 defaults). When assigned to a family,
 * a copy is created so mom can customize steps without affecting the template.
 */

import { supabase } from './supabase/client'

// Get all system routines (pre-built)
export async function getSystemRoutines() {
  const { data } = await supabase
    .from('visual_schedule_routines')
    .select(`
      *,
      steps:visual_schedule_routine_steps(
        *
      )
    `)
    .eq('is_system_routine', true)
    .eq('is_active', true)
    .order('sort_order')

  return data || []
}

// Get routines assigned to a specific family member
export async function getMemberRoutines(familyMemberId: string) {
  const { data } = await supabase
    .from('visual_schedule_member_assignments')
    .select(`
      *,
      routine:visual_schedule_routines(
        *,
        steps:visual_schedule_routine_steps(
          *
        )
      )
    `)
    .eq('family_member_id', familyMemberId)
    .order('display_order')

  return data || []
}

// Search visual schedule assets by tags (for image picker)
export async function searchVisualScheduleAssets(
  searchQuery: string,
  variant: 'A' | 'B' | 'C' = 'B'
) {
  const tags = searchQuery.toLowerCase().split(' ').filter(Boolean)

  const { data } = await supabase
    .from('platform_assets')
    .select('*')
    .eq('category', 'visual_schedule')
    .eq('variant', variant)
    .contains('tags', tags)
    .limit(20)

  return data || []
}

// Assign a routine to a family member
// Creates a family copy of system routines automatically
export async function assignRoutineToMember(
  routineId: string,
  familyMemberId: string,
  familyId: string
) {
  // Check if this is a system routine
  const { data: routine } = await supabase
    .from('visual_schedule_routines')
    .select('*, steps:visual_schedule_routine_steps(*)')
    .eq('id', routineId)
    .single()

  if (!routine) return null

  let targetRoutineId = routineId

  // If system routine, create a family copy so mom can customize
  if (routine.is_system_routine) {
    const { data: familyCopy } = await supabase
      .from('visual_schedule_routines')
      .insert({
        family_id: familyId,
        routine_key: routine.routine_key,
        display_name: routine.display_name,
        description: routine.description,
        icon_asset_key: routine.icon_asset_key,
        icon_variant: routine.icon_variant,
        is_system_routine: false,
      })
      .select()
      .single()

    if (!familyCopy) return null
    targetRoutineId = familyCopy.id

    // Copy the steps
    const steps = (routine.steps as Array<Record<string, unknown>>).map((step) => ({
      routine_id: targetRoutineId,
      step_order: step.step_order,
      asset_key: step.asset_key,
      variant: step.variant,
      custom_label: step.custom_label,
    }))

    await supabase.from('visual_schedule_routine_steps').insert(steps)
  }

  // Create the assignment
  const { data } = await supabase
    .from('visual_schedule_member_assignments')
    .insert({
      family_member_id: familyMemberId,
      routine_id: targetRoutineId,
    })
    .select()
    .single()

  return data
}
