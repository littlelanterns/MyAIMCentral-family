// PRD-09A: Task Templates, Sections, and Steps — CRUD hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  TaskTemplate,
  CreateTaskTemplate,
  UpdateTaskTemplate,
  TaskTemplateSection,
  CreateTaskTemplateSection,
  TaskTemplateStep,
  CreateTaskTemplateStep,
  TemplateType,
} from '@/types/tasks'

// ============================================================
// useTaskTemplates — list all templates for a family
// ============================================================

export function useTaskTemplates(
  familyId: string | undefined,
  filters?: {
    templateType?: TemplateType
    createdBy?: string
    includeArchived?: boolean
    isSystem?: boolean
  },
) {
  return useQuery({
    queryKey: ['task-templates', familyId, filters],
    queryFn: async () => {
      if (!familyId) return []

      let query = supabase
        .from('task_templates')
        .select('*')
        .eq('family_id', familyId)

      if (!filters?.includeArchived) {
        query = query.is('archived_at', null)
      }

      if (filters?.templateType) {
        query = query.eq('template_type', filters.templateType)
      }

      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy)
      }

      if (filters?.isSystem !== undefined) {
        query = query.eq('is_system', filters.isSystem)
      }

      const { data, error } = await query.order('template_name')
      if (error) throw error
      return data as TaskTemplate[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useTaskTemplate — single template with sections and steps
// ============================================================

export function useTaskTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['task-template', templateId],
    queryFn: async () => {
      if (!templateId) return null

      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          task_template_sections(
            *,
            task_template_steps(*)
          )
        `)
        .eq('id', templateId)
        .single()

      if (error) throw error

      // Sort sections and steps by sort_order
      if (data?.task_template_sections) {
        data.task_template_sections.sort((a: TaskTemplateSection, b: TaskTemplateSection) =>
          a.sort_order - b.sort_order
        )
        for (const section of data.task_template_sections) {
          if (section.task_template_steps) {
            section.task_template_steps.sort((a: TaskTemplateStep, b: TaskTemplateStep) =>
              a.sort_order - b.sort_order
            )
          }
        }
      }

      return data as TaskTemplate & {
        task_template_sections: (TaskTemplateSection & {
          task_template_steps: TaskTemplateStep[]
        })[]
      }
    },
    enabled: !!templateId,
  })
}

// ============================================================
// useCreateTaskTemplate
// ============================================================

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: CreateTaskTemplate) => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          is_system: false,
          usage_count: 0,
          default_bonus_threshold: 85,
          require_approval: false,
          incomplete_action: 'auto_reschedule',
          sequential_active_count: 1,
          sequential_promotion: 'immediate',
          display_mode: 'collapsed',
          ...template,
          // Ensure template_name and title are consistent
          title: template.template_name ?? (template as { title?: string }).title ?? template.template_name,
          template_name: template.template_name,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskTemplate
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates', data.family_id] })
    },
  })
}

// ============================================================
// useUpdateTaskTemplate
// ============================================================

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateTaskTemplate & { id: string }) => {
      // Keep title in sync with template_name if it changes
      const payload: Record<string, unknown> = { ...updates }
      if (updates.template_name) {
        payload['title'] = updates.template_name
      }

      const { data, error } = await supabase
        .from('task_templates')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TaskTemplate
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['task-template', data.id] })
    },
  })
}

// ============================================================
// useArchiveTaskTemplate — soft delete
// ============================================================

export function useArchiveTaskTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from('task_templates')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', templateId)
        .select('id, family_id')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates', data.family_id] })
    },
  })
}

// ============================================================
// useDeployTemplate — create task instances from a template
// Bumps usage_count and sets last_deployed_at on the template.
// ============================================================

export function useDeployTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      template,
      deployConfig,
    }: {
      template: TaskTemplate
      deployConfig: {
        familyId: string
        createdBy: string
        assigneeIds: string[]   // create one task per assignee (individual copies)
        dueDate?: string | null
        recurrenceDetails?: Record<string, unknown> | null
        rotationConfig?: {
          members: string[]
          period: 'weekly' | 'biweekly' | 'monthly' | 'custom'
        } | null
      }
    }) => {
      const taskInserts = deployConfig.assigneeIds.map((assigneeId) => ({
        family_id: deployConfig.familyId,
        created_by: deployConfig.createdBy,
        assignee_id: assigneeId,
        template_id: template.id,
        title: template.template_name,
        description: template.description,
        task_type: template.template_type === 'opportunity_repeatable' ||
                   template.template_type === 'opportunity_claimable' ||
                   template.template_type === 'opportunity_capped'
          ? template.template_type
          : template.template_type,
        status: 'pending' as const,
        due_date: deployConfig.dueDate ?? null,
        life_area_tag: template.life_area_tag,
        duration_estimate: template.duration_estimate,
        incomplete_action: template.incomplete_action,
        require_approval: template.require_approval,
        max_completions: template.max_completions,
        claim_lock_duration: template.claim_lock_duration,
        claim_lock_unit: template.claim_lock_unit,
        image_url: template.image_url,
        source: 'template_deployed' as const,
        source_reference_id: template.id,
        recurrence_details: deployConfig.recurrenceDetails ?? null,
        focus_time_seconds: 0,
        sort_order: 0,
        big_rock: false,
        sequential_is_active: false,
        is_shared: false,
        victory_flagged: false,
        time_tracking_enabled: false,
        kanban_status: 'to_do' as const,
      }))

      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .insert(taskInserts)
        .select()

      if (taskError) throw taskError

      // Bump usage_count on the template
      const { error: templateError } = await supabase
        .from('task_templates')
        .update({
          usage_count: template.usage_count + 1,
          last_deployed_at: new Date().toISOString(),
        })
        .eq('id', template.id)

      if (templateError) throw templateError

      return tasks
    },
    onSuccess: (_, { template, deployConfig }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', deployConfig.familyId] })
      queryClient.invalidateQueries({ queryKey: ['task-templates', deployConfig.familyId] })
      queryClient.invalidateQueries({ queryKey: ['task-template', template.id] })
    },
  })
}

// ============================================================
// Template Sections CRUD
// ============================================================

export function useTemplateSections(templateId: string | undefined) {
  return useQuery({
    queryKey: ['template-sections', templateId],
    queryFn: async () => {
      if (!templateId) return []

      const { data, error } = await supabase
        .from('task_template_sections')
        .select('*, task_template_steps(*)')
        .eq('template_id', templateId)
        .order('sort_order')

      if (error) throw error

      // Sort steps within each section
      for (const section of data ?? []) {
        if (section.task_template_steps) {
          section.task_template_steps.sort((a: TaskTemplateStep, b: TaskTemplateStep) =>
            a.sort_order - b.sort_order
          )
        }
      }

      return data as (TaskTemplateSection & { task_template_steps: TaskTemplateStep[] })[]
    },
    enabled: !!templateId,
  })
}

export function useCreateTemplateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (section: CreateTaskTemplateSection) => {
      const { data, error } = await supabase
        .from('task_template_sections')
        .insert({
          show_until_complete: false,
          frequency_rule: 'daily',
          ...section,
          title: section.section_name,
          section_name: section.section_name,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskTemplateSection
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', data.template_id] })
      queryClient.invalidateQueries({ queryKey: ['task-template', data.template_id] })
    },
  })
}

export function useUpdateTemplateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      templateId,
      ...updates
    }: Partial<TaskTemplateSection> & { id: string; templateId: string }) => {
      const payload: Record<string, unknown> = { ...updates }
      if (updates.section_name) {
        payload['title'] = updates.section_name
      }

      const { data, error } = await supabase
        .from('task_template_sections')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, templateId } as TaskTemplateSection & { templateId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', data.template_id] })
      queryClient.invalidateQueries({ queryKey: ['task-template', data.template_id] })
    },
  })
}

export function useDeleteTemplateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      const { error } = await supabase
        .from('task_template_sections')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { templateId }
    },
    onSuccess: ({ templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', templateId] })
      queryClient.invalidateQueries({ queryKey: ['task-template', templateId] })
    },
  })
}

// ============================================================
// Template Steps CRUD
// ============================================================

export function useCreateTemplateStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (step: CreateTaskTemplateStep & { templateId: string }) => {
      const { templateId, ...stepData } = step
      const { data, error } = await supabase
        .from('task_template_steps')
        .insert({
          instance_count: 1,
          require_photo: false,
          ...stepData,
          title: stepData.step_name,
          step_name: stepData.step_name,
        })
        .select()
        .single()

      if (error) throw error
      return { ...data, templateId } as TaskTemplateStep & { templateId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', (data as { section_id: string }).section_id] })
      queryClient.invalidateQueries({ queryKey: ['task-template', data.templateId] })
    },
  })
}

export function useUpdateTemplateStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      sectionId,
      templateId,
      ...updates
    }: Partial<TaskTemplateStep> & { id: string; sectionId: string; templateId: string }) => {
      const payload: Record<string, unknown> = { ...updates }
      if (updates.step_name) {
        payload['title'] = updates.step_name
      }

      const { data, error } = await supabase
        .from('task_template_steps')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, sectionId, templateId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', data.sectionId] })
      queryClient.invalidateQueries({ queryKey: ['task-template', data.templateId] })
    },
  })
}

export function useDeleteTemplateStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      sectionId,
      templateId,
    }: {
      id: string
      sectionId: string
      templateId: string
    }) => {
      const { error } = await supabase
        .from('task_template_steps')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { sectionId, templateId }
    },
    onSuccess: ({ sectionId, templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['template-sections', sectionId] })
      queryClient.invalidateQueries({ queryKey: ['task-template', templateId] })
    },
  })
}

// Re-export types for convenience
export type { TaskTemplate, TaskTemplateSection, TaskTemplateStep } from '@/types/tasks'
