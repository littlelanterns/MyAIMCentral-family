/**
 * PRD-09A: Fetch routine template sections + steps for rendering.
 * Returns sections with their steps (including linked-step metadata).
 * Consumed by RoutineStepChecklist for the child/adult daily view.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TaskTemplateStep } from '@/types/tasks'

export interface RoutineSection {
  id: string
  title: string
  sort_order: number
  frequency_rule: string | null
  frequency_days: number[] | null
  show_until_complete: boolean
  steps: TaskTemplateStep[]
}

export function useRoutineTemplateSteps(templateId: string | undefined) {
  return useQuery({
    queryKey: ['routine-template-steps', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      if (!templateId) return []

      // Fetch sections
      const { data: sections, error: secError } = await supabase
        .from('task_template_sections')
        .select('id, title, sort_order, frequency_rule, frequency_days, show_until_complete')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })

      if (secError) throw secError
      if (!sections?.length) return []

      // Fetch all steps for these sections in one query
      const sectionIds = sections.map(s => s.id)
      const { data: steps, error: stepError } = await supabase
        .from('task_template_steps')
        .select('id, section_id, title, sort_order, step_type, linked_source_id, linked_source_type, display_name_override, step_notes, instance_count, require_photo')
        .in('section_id', sectionIds)
        .order('sort_order', { ascending: true })

      if (stepError) throw stepError

      // Group steps by section
      const stepsBySection = new Map<string, TaskTemplateStep[]>()
      for (const step of (steps ?? [])) {
        const list = stepsBySection.get(step.section_id) ?? []
        list.push(step as TaskTemplateStep)
        stepsBySection.set(step.section_id, list)
      }

      const result: RoutineSection[] = sections.map(sec => ({
        id: sec.id,
        title: sec.title ?? '',
        sort_order: sec.sort_order,
        frequency_rule: sec.frequency_rule ?? null,
        frequency_days: sec.frequency_days ?? null,
        steps: stepsBySection.get(sec.id) ?? [],
      }))

      return result
    },
    staleTime: 5 * 60 * 1000, // 5 min — template steps rarely change
  })
}
