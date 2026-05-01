import { supabase } from '@/lib/supabase/client'
import type { PendingChange } from '@/types/pendingChanges'

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = target[key]
    if (
      sv && tv &&
      typeof sv === 'object' && !Array.isArray(sv) &&
      typeof tv === 'object' && !Array.isArray(tv)
    ) {
      result[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>,
      )
    } else {
      result[key] = sv
    }
  }
  return result
}

function mergePendingPayloads(changes: PendingChange[]): Record<string, unknown> {
  let merged: Record<string, unknown> = {}
  for (const c of changes) {
    merged = deepMerge(merged, c.change_payload)
  }
  return merged
}

export async function applyPendingChanges(changes: PendingChange[]): Promise<void> {
  if (changes.length === 0) return

  const delta = mergePendingPayloads(changes)
  const sourceType = changes[0].source_type
  const sourceId = changes[0].source_id

  switch (sourceType) {
    case 'routine_template': {
      if (delta.sections) {
        const { error } = await supabase.rpc('update_routine_template_atomic', {
          p_template_id: sourceId,
          p_title: (delta.title as string) ?? undefined,
          p_description: (delta.description as string) ?? undefined,
          p_sections: delta.sections,
        })
        if (error) throw new Error(`Atomic routine rewrite failed: ${error.message}`)
      } else {
        const { error } = await supabase
          .from('task_templates')
          .update(delta)
          .eq('id', sourceId)
        if (error) throw new Error(`Routine template update failed: ${error.message}`)
      }
      break
    }

    case 'routine_section': {
      const { error } = await supabase
        .from('task_template_sections')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`Routine section update failed: ${error.message}`)
      break
    }

    case 'routine_step': {
      const { error } = await supabase
        .from('task_template_steps')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`Routine step update failed: ${error.message}`)
      break
    }

    case 'list': {
      const { error } = await supabase
        .from('lists')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`List update failed: ${error.message}`)
      break
    }

    case 'list_item': {
      const { error } = await supabase
        .from('list_items')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`List item update failed: ${error.message}`)
      break
    }

    case 'sequential_collection': {
      const { error } = await supabase
        .from('sequential_collections')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`Sequential collection update failed: ${error.message}`)
      break
    }

    case 'sequential_item': {
      const { error } = await supabase
        .from('tasks')
        .update(delta)
        .eq('id', sourceId)
      if (error) throw new Error(`Sequential item update failed: ${error.message}`)
      break
    }

    default:
      throw new Error(`Unknown source_type: ${sourceType}`)
  }
}
