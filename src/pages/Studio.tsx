/**
 * Studio Page — PRD-09B Screen 1
 *
 * Template workshop. Browse blank formats + examples organized by category.
 * Two tabs: Browse Templates (the shelf) | My Customized (mom's library)
 *
 * Categories:
 * 1. Task & Chore Templates — Simple Task, Routine, Opportunity Board, Sequential Collection
 * 2. Guided Forms & Worksheets — Guided Form, SODAS, What-If, Apology Reflection
 * 3. List Templates — Shopping, Wishlist, Packing, Expense Tracker, To-Do, Custom, Randomizer
 * 4. Trackers & Widgets — PlannedExpansionCard (PRD-10)
 * 5. Tools — PlannedExpansionCard (future PRDs)
 * 6. Gamification Systems — PlannedExpansionCard (PRD-24)
 *
 * System templates have is_system_template=true, family_id=NULL in the DB.
 * Example templates have is_example=true and are labeled with a badge.
 *
 * [Customize] on task/routine/opportunity/sequential/guided_form types → opens TaskCreationModal
 * [Customize] on list types → opens ListCreationModal (logs + closes if not yet available)
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Palette, Filter, ArrowUpDown } from 'lucide-react'
import { Tabs, PlannedExpansionCard, FeatureGuide, FeatureIcon, EmptyState, LoadingSpinner } from '@/components/shared'
import { StudioCategorySection } from '@/components/studio/StudioCategorySection'
import { StudioSearch } from '@/components/studio/StudioSearch'
import { CustomizedTemplateCard } from '@/components/studio/CustomizedTemplateCard'
import type { StudioTemplate } from '@/components/studio/StudioTemplateCard'
import type { CustomizedTemplate } from '@/components/studio/CustomizedTemplateCard'
import { RoutineDuplicateDialog } from '@/components/tasks/RoutineDuplicateDialog'
import type { TabItem } from '@/components/shared'
import {
  TASK_TEMPLATES_BLANK,
  TASK_TEMPLATES_EXAMPLES,
  GUIDED_FORM_TEMPLATES_BLANK,
  GUIDED_FORM_TEMPLATES_EXAMPLES,
  LIST_TEMPLATES_BLANK,
  LIST_TEMPLATES_EXAMPLES,
  RANDOMIZER_TEMPLATE_BLANK,
} from '@/components/studio/studio-seed-data'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { RoutineSection } from '@/components/tasks/RoutineSectionEditor'
import { SequentialCreatorModal } from '@/components/tasks/sequential/SequentialCreatorModal'
import { GuidedFormAssignModal } from '@/components/guided-forms/GuidedFormAssignModal'
import { getSectionsForSubtype } from '@/components/guided-forms/guidedFormTypes'
import type { GuidedFormSubtype as GFSubtype } from '@/components/guided-forms/guidedFormTypes'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { createTaskFromData } from '@/utils/createTaskFromData'
import { useWidgetStarterConfigs } from '@/hooks/useWidgets'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import { useCreateWidget } from '@/hooks/useWidgets'
import type { WidgetStarterConfig, CreateWidget } from '@/types/widgets'

// ─────────────────────────────────────────────
// My Customized data loader
// ─────────────────────────────────────────────

function useCustomizedTemplates(familyId: string | undefined) {
  return useQuery({
    queryKey: ['task_templates_customized', familyId],
    queryFn: async (): Promise<CustomizedTemplate[]> => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('task_templates')
        .select('id, title, task_type, config, created_at')
        .eq('family_id', familyId)
        .eq('is_system', false)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Studio] Failed to load customized templates:', error)
        return []
      }

      return (data ?? []).map((row) => {
        const config = (row.config ?? {}) as Record<string, unknown>
        const templateType = mapDbTypeToStudioType(row.task_type as string)
        return {
          id: row.id as string,
          name: (row.title as string) || 'Untitled Template',
          templateType,
          assignedTo: (config.assigned_to_names as string[]) ?? [],
          activeDeployments: (config.active_deployments as number) ?? 0,
          lastDeployedAt: (config.last_deployed_at as string) ?? null,
          createdAt: row.created_at as string,
        }
      })
    },
    enabled: !!familyId,
  })
}

function mapDbTypeToStudioType(dbType: string): StudioTemplate['templateType'] {
  const map: Record<string, StudioTemplate['templateType']> = {
    task: 'task',
    routine: 'routine',
    opportunity: 'opportunity_claimable',
    sequential: 'sequential',
    guided_form: 'guided_form',
    randomizer: 'randomizer',
  }
  return map[dbType] ?? 'task'
}

// ─────────────────────────────────────────────
// Template → task type mapping for TaskCreationModal
// ─────────────────────────────────────────────

function studioTypeToTaskType(t: StudioTemplate['templateType']): string | null {
  if (t === 'task') return 'task'
  if (t === 'routine') return 'routine'
  if (t === 'opportunity_claimable' || t === 'opportunity_repeatable' || t === 'opportunity_capped') return 'opportunity'
  if (t === 'sequential') return 'sequential'
  if (t.startsWith('guided_form')) return 'guided_form'
  return null // list types handled separately
}

// ─────────────────────────────────────────────
// Search filtering helper
// ─────────────────────────────────────────────

function matchesSearch(tpl: StudioTemplate, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    tpl.name.toLowerCase().includes(q) ||
    tpl.tagline.toLowerCase().includes(q) ||
    tpl.description.toLowerCase().includes(q) ||
    tpl.exampleUseCases.some(uc => uc.toLowerCase().includes(q))
  )
}

// ─────────────────────────────────────────────
// My Customized sort & filter state
// ─────────────────────────────────────────────

type CustomizedSortKey = 'name' | 'last_deployed' | 'most_used' | 'recently_created'
type CustomizedFilter = 'all' | 'assigned' | 'unassigned'

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export function StudioPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'browse' | 'customized'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [customizedSort, setCustomizedSort] = useState<CustomizedSortKey>('recently_created')
  const [customizedFilter, setCustomizedFilter] = useState<CustomizedFilter>('all')

  // TaskCreationModal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialType, setModalInitialType] = useState<string>('task')
  const [modalDefaultTitle, setModalDefaultTitle] = useState<string>('')
  const [modalPreloadedSections, setModalPreloadedSections] = useState<RoutineSection[] | undefined>(undefined)
  /** When editing an existing routine template, this holds the template ID for UPDATE instead of INSERT */
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  /** When deploying from an existing template, link new task to this template instead of creating a duplicate */
  const [deployFromTemplateId, setDeployFromTemplateId] = useState<string | null>(null)

  // SequentialCreatorModal state (Phase 1: replaces sequential route through TaskCreationModal)
  const [sequentialModalOpen, setSequentialModalOpen] = useState(false)
  // Build J: Reading List template opens SequentialCreatorModal with mastery + duration tracking presets
  const [sequentialTemplateId, setSequentialTemplateId] = useState<string | null>(null)

  // Routine duplication dialog state
  const [duplicateRoutine, setDuplicateRoutine] = useState<{ id: string; name: string } | null>(null)

  // GuidedFormAssignModal state
  const [guidedFormModalOpen, setGuidedFormModalOpen] = useState(false)
  const [guidedFormSubtype, setGuidedFormSubtype] = useState<string>('custom')

  // Widget / Tracker state (PRD-10)
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false)
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false)
  const [selectedStarterConfig, setSelectedStarterConfig] = useState<WidgetStarterConfig | null>(null)
  const { data: starterConfigs = [] } = useWidgetStarterConfigs()
  const createWidget = useCreateWidget()

  const handleSelectStarterConfig = useCallback((config: WidgetStarterConfig) => {
    setSelectedStarterConfig(config)
    setWidgetPickerOpen(false)
    setWidgetConfigOpen(true)
  }, [])

  const handleDeployWidget = useCallback((widget: CreateWidget) => {
    createWidget.mutate(widget)
    setWidgetConfigOpen(false)
    setSelectedStarterConfig(null)
  }, [createWidget])

  const {
    data: customizedTemplates = [],
    isLoading: customizedLoading,
  } = useCustomizedTemplates(family?.id)

  // ── Load routine template sections + steps from DB ─────────
  const loadRoutineTemplate = useCallback(async (templateId: string, templateName: string) => {
    const { data: sections } = await supabase
      .from('task_template_sections')
      .select('id, title, section_name, frequency_rule, frequency_days, show_until_complete, sort_order')
      .eq('template_id', templateId)
      .order('sort_order')

    if (!sections?.length) {
      // No sections — just open the modal with the type and title
      setModalDefaultTitle(templateName)
      setModalInitialType('routine')
      setModalOpen(true)
      return
    }

    const routineSections: RoutineSection[] = []
    for (const sec of sections) {
      const { data: steps } = await supabase
        .from('task_template_steps')
        .select('id, title, step_name, step_notes, instance_count, require_photo, sort_order, step_type, linked_source_id, linked_source_type, display_name_override')
        .eq('section_id', sec.id)
        .order('sort_order')

      // Map frequency_rule back to SectionFrequency
      let frequency: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'mwf' | 't_th' | 'custom' = 'daily'
      const days = (sec.frequency_days as number[]) ?? []
      if (sec.frequency_rule === 'custom') {
        // Check if it maps to a named frequency
        const sorted = [...days].sort().join(',')
        if (sorted === '1,2,3,4,5') frequency = 'weekdays'
        else if (sorted === '1,3,5') frequency = 'mwf'
        else if (sorted === '2,4') frequency = 't_th'
        else frequency = 'custom'
      } else {
        frequency = (sec.frequency_rule as typeof frequency) ?? 'daily'
      }

      routineSections.push({
        id: sec.id,
        name: sec.section_name ?? sec.title ?? '',
        frequency,
        customDays: days.map(Number),
        showUntilComplete: sec.show_until_complete ?? false,
        sort_order: sec.sort_order ?? 0,
        isEditing: false,
        steps: (steps ?? []).map(st => ({
          id: st.id,
          title: st.title ?? st.step_name ?? '',
          notes: st.step_notes ?? '',
          showNotes: !!(st.step_notes),
          instanceCount: st.instance_count ?? 1,
          requirePhoto: st.require_photo ?? false,
          sort_order: st.sort_order ?? 0,
          step_type: (st.step_type as 'static' | 'linked_sequential' | 'linked_randomizer' | 'linked_task') ?? 'static',
          linked_source_id: st.linked_source_id ?? null,
          linked_source_type: st.linked_source_type ?? null,
          display_name_override: st.display_name_override ?? null,
        })),
      })
    }

    setModalDefaultTitle(templateName)
    setModalPreloadedSections(routineSections)
    setModalInitialType('routine')
    setModalOpen(true)
  }, [])

  // ── Customize handler ────────────────────────────────────────

  const handleCustomize = useCallback((template: StudioTemplate) => {
    // Guided Forms → open GuidedFormAssignModal
    if (template.templateType.startsWith('guided_form')) {
      const subtypeMap: Record<string, string> = {
        guided_form: 'custom',
        guided_form_sodas: 'sodas',
        guided_form_what_if: 'what_if',
        guided_form_apology_reflection: 'apology_reflection',
      }
      setGuidedFormSubtype(subtypeMap[template.templateType] ?? 'custom')
      setGuidedFormModalOpen(true)
      return
    }

    // List types → navigate to Lists page with the create modal pre-triggered
    if (template.templateType.startsWith('list_') || template.templateType === 'randomizer') {
      const listTypeMap: Record<string, string> = {
        list_shopping: 'shopping',
        list_wishlist: 'wishlist',
        list_packing: 'packing',
        list_expenses: 'expenses',
        list_todo: 'todo',
        list_custom: 'custom',
        randomizer: 'randomizer',
      }
      const listType = listTypeMap[template.templateType] ?? 'custom'
      navigate(`/lists?create=${listType}`)
      return
    }

    // Sequential Collection → open SequentialCreatorModal (Phase 1 — not TaskCreationModal).
    // Build J: Track which template is opening so the modal can apply preset defaults
    // (e.g., Reading List → mastery + duration tracking).
    if (template.templateType === 'sequential') {
      setSequentialTemplateId(template.id)
      setSequentialModalOpen(true)
      return
    }

    // Other task types → open TaskCreationModal
    const taskType = studioTypeToTaskType(template.templateType)
    if (taskType) {
      setModalInitialType(taskType)
      setModalOpen(true)
    }
  }, [navigate])

  const handleUseAsIs = useCallback((template: StudioTemplate) => {
    handleCustomize(template)
  }, [handleCustomize])

  const handleTaskSaved = useCallback(async (data: CreateTaskData) => {
    if (!family?.id || !member?.id) return
    await createTaskFromData(supabase, data, family.id, member.id, familyMembers)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['task-assignments-member'] })
    queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family.id] })
    setModalOpen(false)
  }, [family?.id, member?.id, familyMembers, queryClient])

  // ── Search filtering ─────────────────────────────────────────

  const taskBlanksFiltered = useMemo(
    () => TASK_TEMPLATES_BLANK.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const taskExamplesFiltered = useMemo(
    () => TASK_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const guidedBlanksFiltered = useMemo(
    () => GUIDED_FORM_TEMPLATES_BLANK.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const guidedExamplesFiltered = useMemo(
    () => GUIDED_FORM_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const listBlanksFiltered = useMemo(
    () => [...LIST_TEMPLATES_BLANK, RANDOMIZER_TEMPLATE_BLANK].filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const listExamplesFiltered = useMemo(
    () => LIST_TEMPLATES_EXAMPLES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )

  const noSearchResults =
    searchQuery.trim() &&
    taskBlanksFiltered.length === 0 &&
    taskExamplesFiltered.length === 0 &&
    guidedBlanksFiltered.length === 0 &&
    guidedExamplesFiltered.length === 0 &&
    listBlanksFiltered.length === 0 &&
    listExamplesFiltered.length === 0

  // ── Customized tab: sort + filter ────────────────────────────

  const filteredCustomized = useMemo(() => {
    let list = [...customizedTemplates]
    if (customizedFilter === 'assigned') {
      list = list.filter(t => t.assignedTo.length > 0 || t.activeDeployments > 0)
    } else if (customizedFilter === 'unassigned') {
      list = list.filter(t => t.assignedTo.length === 0 && t.activeDeployments === 0)
    }
    switch (customizedSort) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'last_deployed':
        list.sort((a, b) => {
          const aD = a.lastDeployedAt ? new Date(a.lastDeployedAt).getTime() : 0
          const bD = b.lastDeployedAt ? new Date(b.lastDeployedAt).getTime() : 0
          return bD - aD
        })
        break
      case 'recently_created':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    return list
  }, [customizedTemplates, customizedFilter, customizedSort])

  // ── Tab items ────────────────────────────────────────────────

  const tabs: TabItem[] = [
    { key: 'browse', label: 'Browse Templates' },
    {
      key: 'customized',
      label: customizedTemplates.length > 0
        ? `My Customized (${customizedTemplates.length})`
        : 'My Customized',
    },
  ]

  // ─────────────────────────────────────────────────────────────

  return (
    <div
      className="density-compact max-w-4xl mx-auto px-4 py-6"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FeatureIcon featureKey="studio" fallback={<Palette size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="w-10! h-10! md:w-36! md:h-36!" assetSize={512} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Studio
          </h1>
        </div>
        <p className="text-sm ml-10" style={{ color: 'var(--color-text-secondary)' }}>
          Templates, Trackers &amp; Widgets
        </p>
      </div>

      {/* ── Feature Guide ───────────────────────────────────── */}
      <FeatureGuide featureKey="studio" />

      {/* ── Tabs + Search ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <Tabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={key => setActiveTab(key as 'browse' | 'customized')}
          />
        </div>
        {activeTab === 'browse' && (
          <div className="sm:w-64">
            <StudioSearch value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}
      </div>

      {/* ── Browse Templates tab ─────────────────────────────── */}
      {activeTab === 'browse' && (
        <div>
          {noSearchResults ? (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title="No templates match that search"
              description='Try searching for "routine", "shopping", or "SODAS" to find what you need.'
            />
          ) : (
            <>
              {/* 1. Task & Chore Templates */}
              {(taskBlanksFiltered.length > 0 || taskExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Task & Chore Templates"
                  templates={taskBlanksFiltered}
                  exampleTemplates={taskExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 2. Guided Forms & Worksheets */}
              {(guidedBlanksFiltered.length > 0 || guidedExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Guided Forms & Worksheets"
                  templates={guidedBlanksFiltered}
                  exampleTemplates={guidedExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 3. List Templates */}
              {(listBlanksFiltered.length > 0 || listExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="List Templates"
                  templates={listBlanksFiltered}
                  exampleTemplates={listExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 4. Trackers & Widgets — PRD-10 real starter configs */}
              {!searchQuery && (
                <StudioCategorySection
                  title="Trackers & Widgets"
                  templates={starterConfigs.map(sc => ({
                    id: sc.id,
                    name: sc.config_name,
                    tagline: sc.description?.slice(0, 80) ?? '',
                    description: sc.description ?? '',
                    templateType: `widget_${sc.tracker_type}` as any,
                    isExample: sc.is_example,
                    exampleUseCases: [],
                    // Phase 1 capability_tags — baseline for widgets; Phase 2
                    // will replace with per-tracker-type tags when widget
                    // starter configs grow their own capability metadata.
                    capability_tags: [
                      'dashboard_display', 'at_a_glance', 'progress_visual',
                      sc.tracker_type as string,
                    ],
                    categoryLabel: sc.category ?? 'Trackers & Widgets',
                  }))}
                  onCustomize={(t) => {
                    const config = starterConfigs.find(sc => sc.id === t.id)
                    if (config) handleSelectStarterConfig(config)
                  }}
                  defaultCollapsed={false}
                />
              )}

              {/* 5. Gamification Systems — PlannedExpansionCard */}
              {!searchQuery && (
                <StudioCategorySection
                  title="Gamification Systems"
                  templates={[]}
                  plannedContent={<PlannedExpansionCard featureKey="studio_gamification" />}
                  onCustomize={handleCustomize}
                  defaultCollapsed={true}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── My Customized tab ────────────────────────────────── */}
      {activeTab === 'customized' && (
        <div>
          {/* Sort & filter controls */}
          {customizedTemplates.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5">
                <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
                {(['all', 'assigned', 'unassigned'] as CustomizedFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setCustomizedFilter(f)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize"
                    style={{
                      backgroundColor: customizedFilter === f
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-bg-secondary)',
                      color: customizedFilter === f
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'Unassigned'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <select
                  value={customizedSort}
                  onChange={e => setCustomizedSort(e.target.value as CustomizedSortKey)}
                  className="text-xs rounded-lg px-2 py-1 border outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="recently_created">Recently Created</option>
                  <option value="name">Name A–Z</option>
                  <option value="last_deployed">Last Deployed</option>
                </select>
              </div>
            </div>
          )}

          {customizedLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredCustomized.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomized.map(tpl => (
                <CustomizedTemplateCard
                  key={tpl.id}
                  template={tpl}
                  onDeploy={(t) => {
                    setEditingTemplateId(null) // Deploy = create new task from template, don't edit the template
                    setDeployFromTemplateId(t.id) // Link new task to existing template — no duplicate
                    if (t.templateType === 'routine') {
                      loadRoutineTemplate(t.id, t.name)
                    } else {
                      setModalDefaultTitle(t.name)
                      setModalInitialType(t.templateType as string || 'task')
                      setModalOpen(true)
                    }
                  }}
                  onEdit={(t) => {
                    setEditingTemplateId(t.id) // Edit = update existing template
                    if (t.templateType === 'routine') {
                      loadRoutineTemplate(t.id, t.name)
                    } else {
                      setModalDefaultTitle(t.name)
                      setModalInitialType(t.templateType as string || 'task')
                      setModalOpen(true)
                    }
                  }}
                  onDuplicate={(t) => {
                    if (t.templateType === 'routine') {
                      // Routines get the deep-copy dialog with linked step resolution
                      setDuplicateRoutine({ id: t.id, name: t.name })
                    } else {
                      // Non-routines: shallow copy (template row only)
                      supabase.from('task_templates').insert({
                        family_id: family?.id,
                        created_by: member?.id,
                        title: `${t.name} (copy)`,
                        task_type: t.templateType,
                        is_system: false,
                      }).then(({ error }) => {
                        if (!error) window.location.reload()
                      })
                    }
                  }}
                  onArchive={async (t) => {
                    await supabase
                      .from('task_templates')
                      .update({ archived_at: new Date().toISOString() })
                      .eq('id', t.id)
                    window.location.reload()
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title={
                customizedFilter !== 'all'
                  ? 'No templates match that filter'
                  : "You haven't customized any templates yet"
              }
              description={
                customizedFilter !== 'all'
                  ? 'Try removing the filter to see all your templates.'
                  : 'Browse the Templates tab, tap [Customize] on any format, and build your first template. It will appear here.'
              }
              action={
                customizedFilter === 'all'
                  ? <button onClick={() => setActiveTab('browse')} style={{ cursor: 'pointer' }}>Browse Templates</button>
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* ── Task Creation Modal ──────────────────────────────── */}
      {modalOpen && (
        <TaskCreationModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setModalDefaultTitle('')
            setModalPreloadedSections(undefined)
            setEditingTemplateId(null)
            setDeployFromTemplateId(null)
          }}
          onSave={handleTaskSaved}
          initialTaskType={modalInitialType}
          defaultTitle={modalDefaultTitle || undefined}
          initialRoutineSections={modalPreloadedSections}
          editMode={!!editingTemplateId}
          editingTemplateId={editingTemplateId}
          deployFromTemplateId={deployFromTemplateId}
        />
      )}

      {/* ── Sequential Creator Modal (PRD-09A/09B Studio Intelligence Phase 1) ─ */}
      {/* Build J: Reading List template opens with mastery + duration tracking presets */}
      {sequentialModalOpen && family?.id && member?.id && (
        <SequentialCreatorModal
          isOpen={sequentialModalOpen}
          onClose={() => {
            setSequentialModalOpen(false)
            setSequentialTemplateId(null)
          }}
          familyId={family.id}
          createdBy={member.id}
          title={sequentialTemplateId === 'ex_reading_list' ? 'Create Reading List' : undefined}
          initialDefaults={
            sequentialTemplateId === 'ex_reading_list'
              ? {
                  defaultAdvancementMode: 'mastery',
                  defaultRequireApproval: true,
                  defaultRequireEvidence: false,
                  defaultTrackDuration: true,
                }
              : undefined
          }
        />
      )}

      {/* ── Guided Form Assign Modal ──────────────────────────── */}
      {guidedFormModalOpen && (
        <GuidedFormAssignModal
          open={guidedFormModalOpen}
          onClose={() => setGuidedFormModalOpen(false)}
          template={{
            id: `studio_${guidedFormSubtype}`,
            family_id: null,
            created_by: null,
            title: guidedFormSubtype === 'sodas' ? 'SODAS' : guidedFormSubtype === 'what_if' ? 'What-If Game' : guidedFormSubtype === 'apology_reflection' ? 'Apology Reflection' : 'Guided Form',
            description: null,
            template_type: 'guided_form',
            guided_form_subtype: guidedFormSubtype as GFSubtype,
            config: { sections: getSectionsForSubtype(guidedFormSubtype as GFSubtype) },
            is_system: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          familyId={family?.id ?? ''}
          assigningMemberId={member?.id ?? ''}
          eligibleChildren={familyMembers.filter(m => m.id !== member?.id)}
        />
      )}

      {/* ── Routine Duplicate Dialog ────────────────────────────── */}
      {duplicateRoutine && (
        <RoutineDuplicateDialog
          isOpen={true}
          onClose={() => setDuplicateRoutine(null)}
          templateId={duplicateRoutine.id}
          templateName={duplicateRoutine.name}
          familyId={family?.id ?? ''}
          createdBy={member?.id ?? ''}
          onDuplicated={() => {
            setDuplicateRoutine(null)
            window.location.reload()
          }}
        />
      )}

      {/* ── Widget Picker Modal (PRD-10) ────────────────────────── */}
      <WidgetPicker
        isOpen={widgetPickerOpen}
        onClose={() => setWidgetPickerOpen(false)}
        starterConfigs={starterConfigs}
        onSelectStarterConfig={handleSelectStarterConfig}
      />

      {/* ── Widget Configuration Modal (PRD-10) ─────────────────── */}
      <WidgetConfiguration
        isOpen={widgetConfigOpen}
        onClose={() => { setWidgetConfigOpen(false); setSelectedStarterConfig(null) }}
        starterConfig={selectedStarterConfig}
        familyId={family?.id ?? ''}
        memberId={member?.id ?? ''}
        familyMembers={familyMembers.map(m => ({ id: m.id, display_name: m.display_name }))}
        onDeploy={handleDeployWidget}
      />
    </div>
  )
}
