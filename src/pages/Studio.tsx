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
 * 4. Trackers & Widgets — PRD-10 real starter configs (35+ tracker types)
 * 5. Gamification & Rewards — Setup, Segments, Coloring Reveals, Reward Reveals, Star Chart, Spinner
 * 6. Growth & Self-Knowledge — Get to Know Your Family, Best Intentions Starter
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
import { Tabs, FeatureGuide, FeatureIcon, EmptyState, LoadingSpinner } from '@/components/shared'
import { StudioCategorySection } from '@/components/studio/StudioCategorySection'
import { StudioSearch } from '@/components/studio/StudioSearch'
import { CustomizedTemplateCard } from '@/components/studio/CustomizedTemplateCard'
import type { StudioTemplate } from '@/components/studio/StudioTemplateCard'
import type { CustomizedTemplate } from '@/components/studio/CustomizedTemplateCard'
import { RoutineDuplicateDialog } from '@/components/tasks/RoutineDuplicateDialog'
// Worker ROUTINE-PROPAGATION (c4, founder D4 + D6 Thread 1):
//   - Chooser dialog: single duplicate entry point (per Convention #255)
//     "What would you like to do?" → Copy and Customize | Assign Additional Member
//   - Template-only duplicate dialog: independent deep-clone of master,
//     lands in My Customized for editing before assigning.
import { RoutineDuplicateChooserDialog } from '@/components/templates/RoutineDuplicateChooserDialog'
import { RoutineDuplicateTemplateDialog } from '@/components/templates/RoutineDuplicateTemplateDialog'
import { ListDuplicateDialog } from '@/components/templates/ListDuplicateDialog'
import type { TabItem } from '@/components/shared'
import {
  TASK_TEMPLATES_BLANK,
  TASK_TEMPLATES_EXAMPLES,
  GUIDED_FORM_TEMPLATES_BLANK,
  GUIDED_FORM_TEMPLATES_EXAMPLES,
  LIST_TEMPLATES_BLANK,
  LIST_TEMPLATES_EXAMPLES,
  RANDOMIZER_TEMPLATE_BLANK,
  GAMIFICATION_TEMPLATES,
  GROWTH_TEMPLATES,
  WIZARD_TEMPLATES,
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
import { GamificationSettingsModal } from '@/components/gamification/settings'
import { StarChartWizard } from '@/components/studio/wizards/StarChartWizard'
import { GetToKnowWizard } from '@/components/studio/wizards/GetToKnowWizard'
import { RoutineBuilderWizard } from '@/components/studio/wizards/RoutineBuilderWizard'
import { MeetingSetupWizard } from '@/components/studio/wizards/MeetingSetupWizard'
import { UniversalListWizard } from '@/components/studio/wizards/UniversalListWizard'

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

      // Worker ROUTINE-PROPAGATION (c5): pull active deployments per
      // template so we can compute the earliest future dtstart for the
      // "Scheduled to start" badge. Single round-trip — fetch all
      // active routine tasks for this family that reference any of
      // these templates, then group by template_id.
      const templateIds = (data ?? []).map(r => r.id as string)
      const dtstartByTemplateId = new Map<string, string | null>()
      if (templateIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('template_id, recurrence_details, status, archived_at')
          .in('template_id', templateIds)
          .eq('task_type', 'routine')
          .is('archived_at', null)

        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        for (const t of tasks ?? []) {
          if (!t.template_id) continue
          if (t.status === 'completed' || t.status === 'cancelled') continue
          const details = t.recurrence_details as Record<string, unknown> | null
          const dtstart = (details?.dtstart as string | undefined)?.slice(0, 10)
          if (!dtstart || dtstart <= todayStr) continue
          // Track earliest future dtstart per template so the badge
          // says when the next scheduled deployment kicks in.
          const existing = dtstartByTemplateId.get(t.template_id as string)
          if (!existing || dtstart < existing) {
            dtstartByTemplateId.set(t.template_id as string, dtstart)
          }
        }
      }

      const taskResults: CustomizedTemplate[] = (data ?? []).map((row) => {
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
          nextScheduledStart: dtstartByTemplateId.get(row.id as string) ?? null,
        }
      })

      const { data: listTpls } = await supabase
        .from('list_templates')
        .select('id, title, list_type, usage_count, last_deployed_at, created_at')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      const listResults: CustomizedTemplate[] = (listTpls ?? []).map((row) => {
        const listTypeMap: Record<string, string> = {
          shopping: 'list_shopping',
          wishlist: 'list_wishlist',
          packing: 'list_packing',
          expenses: 'list_expenses',
          todo: 'list_todo',
          custom: 'list_custom',
          randomizer: 'randomizer',
        }
        return {
          id: row.id as string,
          name: (row.title as string) || 'Untitled List Template',
          templateType: (listTypeMap[row.list_type as string] ?? 'list_custom') as CustomizedTemplate['templateType'],
          assignedTo: [],
          activeDeployments: (row.usage_count as number) ?? 0,
          lastDeployedAt: row.last_deployed_at as string | null,
          createdAt: row.created_at as string,
          nextScheduledStart: null,
        }
      })

      return [...taskResults, ...listResults]
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
// Tracker types that have real renderers in WidgetRenderer.tsx
// Anything NOT in this set renders as PlannedTrackerStub ("Coming soon")
// and should be hidden from Studio until its renderer is built.
// ─────────────────────────────────────────────

const FUNCTIONAL_TRACKER_TYPES = new Set([
  'tally', 'streak', 'percentage', 'checklist', 'multi_habit_grid',
  'boolean_checkin', 'sequential_path', 'achievement_badge', 'xp_level',
  'timer_duration', 'allowance_calculator', 'leaderboard', 'mood_rating',
  'countdown', 'snapshot_comparison', 'best_intention', 'randomizer_spinner',
  'privilege_status', 'log_learning',
])

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

function isListTemplateType(t: string): boolean {
  return t.startsWith('list_') || t === 'randomizer'
}

function listTemplateTypeToListType(t: string): string {
  const map: Record<string, string> = {
    list_shopping: 'shopping',
    list_wishlist: 'wishlist',
    list_packing: 'packing',
    list_expenses: 'expenses',
    list_todo: 'todo',
    list_custom: 'custom',
    randomizer: 'randomizer',
  }
  return map[t] ?? 'custom'
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

  // Routine duplication dialog state — used by the existing
  // clone-and-deploy flow (RoutineDuplicateDialog).
  const [duplicateRoutine, setDuplicateRoutine] = useState<{ id: string; name: string } | null>(null)
  // Worker ROUTINE-PROPAGATION (c4, founder D4): chooser + clone-as-
  // template state. The chooser fires first; based on mom's choice we
  // open either RoutineDuplicateTemplateDialog (Copy and Customize) or
  // the existing RoutineDuplicateDialog (Assign Additional Member).
  const [duplicateChooser, setDuplicateChooser] = useState<{ id: string; name: string } | null>(null)
  const [duplicateAsTemplate, setDuplicateAsTemplate] = useState<{ id: string; name: string } | null>(null)
  const [duplicateListTemplate, setDuplicateListTemplate] = useState<{ id: string; name: string } | null>(null)

  // GuidedFormAssignModal state
  const [guidedFormModalOpen, setGuidedFormModalOpen] = useState(false)
  const [guidedFormSubtype, setGuidedFormSubtype] = useState<string>('custom')

  // Gamification modal state
  const [gamificationModalOpen, setGamificationModalOpen] = useState(false)
  const [gamificationMemberId, setGamificationMemberId] = useState<string | null>(null)
  const [gamificationMemberName, setGamificationMemberName] = useState('')
  // Member picker for gamification (picks child, then opens the settings modal)
  const [gamificationPickerOpen, setGamificationPickerOpen] = useState(false)
  const [gamificationPickerAction, setGamificationPickerAction] = useState<string>('')

  // Setup Wizard state
  const [starChartWizardOpen, setStarChartWizardOpen] = useState(false)
  const [getToKnowWizardOpen, setGetToKnowWizardOpen] = useState(false)
  const [routineBuilderWizardOpen, setRoutineBuilderWizardOpen] = useState(false)
  const [meetingSetupWizardOpen, setMeetingSetupWizardOpen] = useState(false)
  const [listWizardOpen, setListWizardOpen] = useState(false)

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

  // ── Gamification member picker handler ──────────────────────
  const openGamificationForMember = useCallback((memberId: string, _action: string) => {
    const m = familyMembers.find(fm => fm.id === memberId)
    if (!m || !family?.id) return
    setGamificationMemberId(memberId)
    setGamificationMemberName(m.display_name)
    setGamificationPickerOpen(false)
    setGamificationModalOpen(true)
  }, [familyMembers, family?.id])

  const handleCustomize = useCallback((template: StudioTemplate) => {
    // ── Setup Wizard routing (by template ID, takes priority) ──
    if (template.id === 'studio_star_chart') {
      setStarChartWizardOpen(true)
      return
    }
    if (template.id === 'studio_get_to_know') {
      setGetToKnowWizardOpen(true)
      return
    }
    if (template.templateType === 'routine_builder_wizard') {
      setRoutineBuilderWizardOpen(true)
      return
    }
    if (template.templateType === 'meeting_setup_wizard') {
      setMeetingSetupWizardOpen(true)
      return
    }
    if (template.templateType === 'list_wizard') {
      setListWizardOpen(true)
      return
    }

    // Gamification templates → open member picker then GamificationSettingsModal
    if (template.templateType.startsWith('gamification_') || template.templateType === 'reward_reveal') {
      if (template.templateType === 'reward_reveal') {
        navigate('/settings/reward-reveals')
        return
      }
      // Open member picker for gamification setup
      setGamificationPickerAction(template.templateType)
      setGamificationPickerOpen(true)
      return
    }

    // Growth templates → navigate to the feature (best_intentions still navigates away)
    if (template.templateType === 'self_knowledge_wizard') {
      // Handled by ID check above for studio_get_to_know; fallback for future templates
      setGetToKnowWizardOpen(true)
      return
    }
    if (template.templateType === 'best_intentions_wizard') {
      navigate('/guiding-stars?tab=intentions')
      return
    }

    // Widget types from Gamification section (star chart, spinner) → widget config flow
    if (template.templateType.startsWith('widget_')) {
      const trackerType = template.templateType.replace('widget_', '')
      const config = starterConfigs.find(sc => sc.tracker_type === trackerType)
      if (config) {
        handleSelectStarterConfig(config)
      } else {
        // No starter config exists — open the widget picker filtered
        setWidgetPickerOpen(true)
      }
      return
    }

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
      if (template.isExample) {
        supabase
          .from('list_templates')
          .select('id')
          .eq('title', template.name)
          .eq('is_example', true)
          .is('family_id', null)
          .limit(1)
          .single()
          .then(({ data: dbTpl }) => {
            if (dbTpl?.id) {
              navigate(`/lists?create=${listType}&template=${dbTpl.id}`)
            } else {
              navigate(`/lists?create=${listType}`)
            }
          })
      } else {
        navigate(`/lists?create=${listType}`)
      }
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
      // For example templates, pre-fill the title so the modal isn't blank
      if (template.isExample) {
        setModalDefaultTitle(template.name)
      }
      // For routine examples that have sections in the DB, load them
      if (taskType === 'routine' && template.isExample) {
        // Look up the DB template by matching the seed template name
        const dbLookup = async () => {
          const { data } = await supabase
            .from('task_templates')
            .select('id')
            .eq('title', template.name)
            .eq('is_example', true)
            .limit(1)
            .single()
          if (data?.id) {
            loadRoutineTemplate(data.id, template.name)
            return
          }
          // Fallback: open modal without pre-loaded sections
          setModalInitialType(taskType)
          setModalOpen(true)
        }
        dbLookup()
        return
      }
      setModalInitialType(taskType)
      setModalOpen(true)
    }
  }, [navigate, loadRoutineTemplate])

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
  const gamificationFiltered = useMemo(
    () => GAMIFICATION_TEMPLATES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const growthFiltered = useMemo(
    () => GROWTH_TEMPLATES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const wizardFiltered = useMemo(
    () => WIZARD_TEMPLATES.filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )

  const noSearchResults =
    searchQuery.trim() &&
    taskBlanksFiltered.length === 0 &&
    taskExamplesFiltered.length === 0 &&
    guidedBlanksFiltered.length === 0 &&
    guidedExamplesFiltered.length === 0 &&
    listBlanksFiltered.length === 0 &&
    listExamplesFiltered.length === 0 &&
    gamificationFiltered.length === 0 &&
    growthFiltered.length === 0 &&
    wizardFiltered.length === 0

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
              {/* Filter to only show tracker types that have real renderers (not PlannedTrackerStub) */}
              {(
                <StudioCategorySection
                  title="Trackers & Widgets"
                  templates={starterConfigs.filter(sc => FUNCTIONAL_TRACKER_TYPES.has(sc.tracker_type)).map(sc => ({
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

              {/* 5. Gamification & Rewards — real setup templates */}
              {gamificationFiltered.length > 0 && (
                <StudioCategorySection
                  title="Gamification & Rewards"
                  templates={gamificationFiltered}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
                />
              )}

              {/* 6. Growth & Self-Knowledge */}
              {growthFiltered.length > 0 && (
                <StudioCategorySection
                  title="Growth & Self-Knowledge"
                  templates={growthFiltered}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
                />
              )}

              {/* 7. Setup Wizards — guided multi-step flows */}
              {wizardFiltered.length > 0 && (
                <StudioCategorySection
                  title="Setup Wizards"
                  templates={wizardFiltered}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
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
                    if (isListTemplateType(t.templateType)) {
                      const listType = listTemplateTypeToListType(t.templateType)
                      navigate(`/lists?create=${listType}&template=${t.id}`)
                      return
                    }
                    setEditingTemplateId(null)
                    setDeployFromTemplateId(t.id)
                    if (t.templateType === 'routine') {
                      loadRoutineTemplate(t.id, t.name)
                    } else {
                      setModalDefaultTitle(t.name)
                      setModalInitialType(t.templateType as string || 'task')
                      setModalOpen(true)
                    }
                  }}
                  onEdit={(t) => {
                    if (isListTemplateType(t.templateType)) {
                      const listType = listTemplateTypeToListType(t.templateType)
                      navigate(`/lists?create=${listType}&template=${t.id}`)
                      return
                    }
                    setEditingTemplateId(t.id)
                    if (t.templateType === 'routine') {
                      loadRoutineTemplate(t.id, t.name)
                    } else {
                      setModalDefaultTitle(t.name)
                      setModalInitialType(t.templateType as string || 'task')
                      setModalOpen(true)
                    }
                  }}
                  onDuplicate={(t) => {
                    if (isListTemplateType(t.templateType)) {
                      setDuplicateListTemplate({ id: t.id, name: t.name })
                      return
                    }
                    if (t.templateType === 'routine') {
                      setDuplicateChooser({ id: t.id, name: t.name })
                    } else {
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
                    if (isListTemplateType(t.templateType)) {
                      await supabase
                        .from('list_templates')
                        .update({ archived_at: new Date().toISOString() })
                        .eq('id', t.id)
                      queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family?.id] })
                      return
                    }
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

      {/* ── Routine Duplicate Chooser (c4, founder D4) ─────────── */}
      {/* Single duplicate entry point per Convention #255. Mom picks:
          Copy and Customize → RoutineDuplicateTemplateDialog
          Assign Additional Member → RoutineDuplicateDialog (existing) */}
      {duplicateChooser && (
        <RoutineDuplicateChooserDialog
          isOpen={true}
          onClose={() => setDuplicateChooser(null)}
          templateName={duplicateChooser.name}
          onChoice={(choice) => {
            const stash = duplicateChooser
            setDuplicateChooser(null)
            if (!stash) return
            if (choice === 'copy_template') {
              setDuplicateAsTemplate(stash)
            } else if (choice === 'assign_member') {
              setDuplicateRoutine(stash)
            }
          }}
        />
      )}

      {/* ── Routine Duplicate as Template (c4, "Copy and Customize") ── */}
      {duplicateAsTemplate && (
        <RoutineDuplicateTemplateDialog
          isOpen={true}
          onClose={() => setDuplicateAsTemplate(null)}
          sourceTemplateId={duplicateAsTemplate.id}
          sourceTemplateName={duplicateAsTemplate.name}
          familyId={family?.id ?? ''}
          createdBy={member?.id ?? ''}
          onDuplicated={() => {
            setDuplicateAsTemplate(null)
            queryClient.invalidateQueries({
              queryKey: ['task_templates_customized', family?.id],
            })
          }}
        />
      )}

      {/* ── Routine Duplicate Dialog ("Assign Additional Member") ─── */}
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

      {/* ── List Duplicate Dialog ───���──────────────────────────── */}
      {duplicateListTemplate && (
        <ListDuplicateDialog
          isOpen={true}
          onClose={() => setDuplicateListTemplate(null)}
          sourceTemplateId={duplicateListTemplate.id}
          sourceTemplateName={duplicateListTemplate.name}
          familyId={family?.id ?? ''}
          createdBy={member?.id ?? ''}
          onDuplicated={() => {
            setDuplicateListTemplate(null)
            queryClient.invalidateQueries({
              queryKey: ['task_templates_customized', family?.id],
            })
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

      {/* ── Gamification Member Picker ─────────────────────────── */}
      {gamificationPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 60%, transparent)' }}
          onClick={() => setGamificationPickerOpen(false)}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Choose a family member
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Who are you setting this up for?
            </p>
            <div className="flex flex-wrap gap-2">
              {familyMembers
                .filter(m => m.is_active && m.id !== member?.id)
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => openGamificationForMember(m.id, gamificationPickerAction)}
                    className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: `var(--member-color-${(m as unknown as Record<string, unknown>).assigned_color_token ?? ''}, var(--color-bg-secondary))`,
                      color: 'var(--color-text-primary)',
                      border: '2px solid var(--color-border)',
                    }}
                  >
                    {m.display_name}
                  </button>
                ))}
              {/* Mom can also set up gamification for herself */}
              {member && (
                <button
                  onClick={() => openGamificationForMember(member.id, gamificationPickerAction)}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-border)',
                  }}
                >
                  {member.display_name} (me)
                </button>
              )}
            </div>
            <button
              onClick={() => setGamificationPickerOpen(false)}
              className="mt-4 w-full text-sm py-2 rounded-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Gamification Settings Modal ─────────────────────────── */}
      {gamificationMemberId && family?.id && (
        <GamificationSettingsModal
          isOpen={gamificationModalOpen}
          onClose={() => { setGamificationModalOpen(false); setGamificationMemberId(null) }}
          memberId={gamificationMemberId}
          memberName={gamificationMemberName}
          familyId={family.id}
        />
      )}

      {/* ── Setup Wizards ───────────────────────────────────────── */}
      {starChartWizardOpen && family?.id && member?.id && (
        <StarChartWizard
          isOpen={starChartWizardOpen}
          onClose={() => setStarChartWizardOpen(false)}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
        />
      )}

      {getToKnowWizardOpen && family?.id && member?.id && (
        <GetToKnowWizard
          isOpen={getToKnowWizardOpen}
          onClose={() => setGetToKnowWizardOpen(false)}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
        />
      )}

      {routineBuilderWizardOpen && (
        <RoutineBuilderWizard
          isOpen={routineBuilderWizardOpen}
          onClose={() => setRoutineBuilderWizardOpen(false)}
          onAccept={(routineName, sections) => {
            setRoutineBuilderWizardOpen(false)
            setModalDefaultTitle(routineName)
            setModalPreloadedSections(sections)
            setModalInitialType('routine')
            setModalOpen(true)
          }}
        />
      )}

      {meetingSetupWizardOpen && family?.id && member?.id && (
        <MeetingSetupWizard
          isOpen={meetingSetupWizardOpen}
          onClose={() => {
            setMeetingSetupWizardOpen(false)
            // Navigate to meetings page after wizard closes (if they completed it)
          }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
        />
      )}

      {listWizardOpen && (
        <UniversalListWizard
          isOpen={listWizardOpen}
          onClose={() => setListWizardOpen(false)}
        />
      )}
    </div>
  )
}
