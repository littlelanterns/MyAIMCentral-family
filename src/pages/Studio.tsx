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
import type { CustomizedTemplate, DeploymentListItem } from '@/components/studio/CustomizedTemplateCard'
import { RoutineDuplicateDialog } from '@/components/tasks/RoutineDuplicateDialog'
// Worker ROUTINE-PROPAGATION (c4, founder D4 + D6 Thread 1):
//   - Chooser dialog: single duplicate entry point (per Convention #255)
//     "What would you like to do?" → Copy and Customize | Assign Additional Member
//   - Template-only duplicate dialog: independent deep-clone of master,
//     lands in My Customized for editing before assigning.
import { RoutineDuplicateChooserDialog } from '@/components/templates/RoutineDuplicateChooserDialog'
import { RoutineDuplicateTemplateDialog } from '@/components/templates/RoutineDuplicateTemplateDialog'
import { ListDuplicateDialog } from '@/components/templates/ListDuplicateDialog'
import { RoutineDeployModal } from '@/components/templates/RoutineDeployModal'
import type { RoutineDeployTemplate, ActiveDeployment as DeployModalActiveDeployment } from '@/components/templates/RoutineDeployModal'
import type { TabItem } from '@/components/shared'
import {
  TASK_TEMPLATES_BLANK,
  TASK_TEMPLATES_EXAMPLES,
  GUIDED_FORM_TEMPLATES_BLANK,
  GUIDED_FORM_TEMPLATES_EXAMPLES,
  LIST_TEMPLATES_BLANK,
  LIST_TEMPLATES_EXAMPLES,
  LIST_WIZARD_SEEDED,
  RANDOMIZER_TEMPLATE_BLANK,
  GAMIFICATION_TEMPLATES,
  GROWTH_TEMPLATES,
  WIZARD_TEMPLATES,
  PHASE37_WIZARD_TEMPLATES,
  PHASE37_SEEDED_TEMPLATES,
  PHASE38_WIZARD_TEMPLATES,
  PHASE38_SEEDED_TEMPLATES,
} from '@/components/studio/studio-seed-data'
import { ActivityListWizard, type ActivityListWizardPrefill } from '@/components/studio/wizards/ActivityListWizard'
import {
  useWizardDraftList,
  deleteWizardDraftById,
  useMigrateLocalStorageWizardDrafts,
} from '@/components/studio/wizards/useWizardDraft'
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
import { RewardsListWizard } from '@/components/studio/wizards/RewardsListWizard'
import {
  ListRevealAssignmentWizard,
  CONSEQUENCE_SPINNER_PREFILL,
  EXTRA_EARNING_PREFILL,
  EXTRA_HOUSE_JOBS_PREFILL,
  type ListRevealPreFill,
} from '@/components/studio/wizards/ListRevealAssignmentWizard'
import { RepeatedActionChartWizard } from '@/components/studio/wizards/RepeatedActionChartWizard'
import { SharedTaskListWizard } from '@/components/studio/wizards/SharedTaskListWizard'
import { BestIntentionsStarterWizard } from '@/components/studio/wizards/BestIntentionsStarterWizard'
import { NaturalLanguageComposition } from '@/components/studio/NaturalLanguageComposition'
import { isChildMember, isOptInAdult } from '@/lib/members/isChildMember'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { ModalV2 } from '@/components/shared/ModalV2'

// ─────────────────────────────────────────────
// Example prefill content (ST-A, finding F-04) — example cards promised
// pre-filled content their Customize path never loaded.
// ─────────────────────────────────────────────

/** Potty Chart seed initial — shared by Customize and Use-as-is. */
const POTTY_CHART_INITIAL: Record<string, unknown> = {
  chartName: 'Potty Chart',
  actionTaskName: 'Used the potty!',
  showStarChart: true,
  starChartTarget: 50,
  showColoringReveal: true,
  coloringStepCount: 10,
  coloringAutoNext: true,
  milestones: [
    { id: 'seed_m1', type: 'every_nth', count: 5, rewardMode: 'rewards_list', rewardsListId: '', customText: '', presentation: 'treasure_box' },
    { id: 'seed_m2', type: 'on_threshold_cross', count: 50, rewardMode: 'custom_text', rewardsListId: '', customText: 'I DID IT! Shopping trip for big kid underwear!', presentation: 'treasure_box' },
  ],
}

/** Honey-Do seed items — shared by Customize and Use-as-is. */
const HONEY_DO_SEED_ITEMS: Array<{ text: string; bigJob?: boolean }> = [
  { text: 'Fix the leaky faucet', bigJob: true },
  { text: 'Clean out the garage', bigJob: true },
  { text: 'Hang the shelf in the kids\' room' },
  { text: 'Replace the air filter' },
  { text: 'Fix the squeaky door' },
  { text: 'Organize the tool shed', bigJob: true },
  { text: 'Clean the gutters', bigJob: true },
  { text: 'Touch up paint in the hallway' },
]

/** Curriculum Chapter Sequence — the promised 5 sample chapters. */
const CURRICULUM_SEQUENCE_PREFILL = {
  title: 'Curriculum Chapter Sequence',
  items: [
    'Chapter 1: Getting Started',
    'Chapter 2: Building the Basics',
    'Chapter 3: Putting It Together',
    'Chapter 4: Practice and Review',
    'Chapter 5: Show What You Know',
  ],
}

/** Guided-form example mom-section prefills, keyed by seed template id →
 *  section_key → content. Editable in Step 1 of GuidedFormAssignModal. */
const GUIDED_FORM_EXAMPLE_PREFILLS: Record<string, Record<string, string>> = {
  ex_sodas_sibling: {
    situation:
      'Yesterday you and your sibling had a disagreement. That happens in every family — what matters is what we learn from it. Let\'s think it through together. Here\'s what I noticed: [describe what happened in your own words].',
  },
  ex_what_if_friend_pressure: {
    scenario:
      'Imagine a friend dares you to do something you know isn\'t right — maybe breaking a rule, sneaking something, or being unkind to someone. They say everyone else is doing it and you don\'t want to look scared. What would you do?',
  },
  ex_apology_general: {
    intro_note:
      'I\'m not asking you to do this as punishment. I\'m asking because I love you and I know you\'re the kind of person who cares about making things right. Take your time with each question — there are no wrong answers here.',
  },
}

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
      const deploymentsByTemplateId = new Map<string, DeploymentListItem[]>()
      if (templateIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, template_id, assignee_id, recurrence_details, due_date, status, archived_at, counts_for_allowance, counts_for_gamification, counts_for_homework, allowance_points')
          .in('template_id', templateIds)
          .eq('task_type', 'routine')
          .is('archived_at', null)

        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        // Collect unique assignee IDs for member lookup
        const assigneeIds = new Set<string>()
        for (const t of tasks ?? []) {
          if (t.assignee_id) assigneeIds.add(t.assignee_id as string)
        }

        // Fetch member names + colors in one query
        const memberMap = new Map<string, { name: string; color: string }>()
        if (assigneeIds.size > 0) {
          const { data: memberRows } = await supabase
            .from('family_members')
            .select('id, display_name, member_color, assigned_color, calendar_color')
            .in('id', Array.from(assigneeIds))
          for (const m of memberRows ?? []) {
            memberMap.set(m.id as string, {
              name: (m.display_name as string) || 'Unknown',
              color: (m.member_color as string) || (m.assigned_color as string) || (m.calendar_color as string) || '#888',
            })
          }
        }

        for (const t of tasks ?? []) {
          if (!t.template_id) continue
          if (t.status === 'completed' || t.status === 'cancelled') continue
          const details = t.recurrence_details as Record<string, unknown> | null
          const dtstart = (details?.dtstart as string | undefined)?.slice(0, 10) ?? null

          if (dtstart && dtstart > todayStr) {
            const existing = dtstartByTemplateId.get(t.template_id as string)
            if (!existing || dtstart < existing) {
              dtstartByTemplateId.set(t.template_id as string, dtstart)
            }
          }

          // Build deployment list item
          if (t.assignee_id) {
            const member = memberMap.get(t.assignee_id as string)
            // Painted schedules carry the full date range in rdates — including
            // single-date deployments where start === end. Recurring/one-time
            // fall back to the legacy due_date / until path.
            const scheduleType = details?.schedule_type as string | undefined
            let depDtstart: string | null = dtstart
            let endDate: string | null
            if (scheduleType === 'painted') {
              const rdates = ((details?.rdates as string[] | undefined) ?? [])
                .map(d => d.slice(0, 10))
                .sort()
              if (rdates.length > 0) {
                depDtstart = rdates[0]
                endDate = rdates[rdates.length - 1]
              } else {
                endDate = null
              }
            } else {
              endDate = (t.due_date as string | undefined)?.slice(0, 10)
                ?? (details?.until as string | undefined)?.slice(0, 10)
                ?? null
            }
            if (endDate && endDate < todayStr) continue
            const dep: DeploymentListItem = {
              taskId: t.id as string,
              assigneeId: t.assignee_id as string,
              assigneeName: member?.name ?? 'Unknown',
              assigneeColor: member?.color ?? '#888',
              dtstart: depDtstart,
              endDate,
              isScheduled: !!depDtstart && depDtstart > todayStr,
              countsForAllowance: (t.counts_for_allowance as boolean) ?? false,
              countsForGamification: (t.counts_for_gamification as boolean) ?? true,
              countsForHomework: (t.counts_for_homework as boolean) ?? false,
              allowancePoints: (t.allowance_points as number | null) ?? null,
              status: (t.status as string) ?? 'pending',
            }
            const list = deploymentsByTemplateId.get(t.template_id as string) ?? []
            list.push(dep)
            deploymentsByTemplateId.set(t.template_id as string, list)
          }
        }
      }

      const taskResults: CustomizedTemplate[] = (data ?? []).map((row) => {
        const config = (row.config ?? {}) as Record<string, unknown>
        const templateType = mapDbTypeToStudioType(row.task_type as string)
        const deps = deploymentsByTemplateId.get(row.id as string) ?? []
        return {
          id: row.id as string,
          name: (row.title as string) || 'Untitled Template',
          templateType,
          assignedTo: (config.assigned_to_names as string[]) ?? [],
          activeDeployments: deps.length || ((config.active_deployments as number) ?? 0),
          lastDeployedAt: (config.last_deployed_at as string) ?? null,
          createdAt: row.created_at as string,
          nextScheduledStart: dtstartByTemplateId.get(row.id as string) ?? null,
          deployments: deps.length > 0 ? deps : undefined,
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

// STUDIO-EXPERIENCE ST-C: display labels for every wizard_type value the
// server-backed Drafts tab can show. Every Setup Wizard that saves a draft
// must have an entry here.
const WIZARD_TYPE_LABELS: Record<string, string> = {
  rewards_list: 'Rewards List',
  repeated_action_chart: 'Progress Chart',
  list_reveal_assignment: 'Opportunities / Spinner',
  shared_task_list: 'Shared To-Do',
  activity_list: 'Subject Activities',
  star_chart: 'Star Chart',
  get_to_know: 'Get to Know Your Family',
  routine_builder: 'Routine Builder',
  meeting_setup: 'Family Meetings',
  universal_list: 'List',
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export function StudioPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'browse' | 'drafts' | 'customized'>('browse')
  const [draftRefreshKey, setDraftRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [customizedSort, setCustomizedSort] = useState<CustomizedSortKey>('recently_created')
  const [customizedFilter, setCustomizedFilter] = useState<CustomizedFilter>('all')

  // TaskCreationModal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitialType, setModalInitialType] = useState<string>('task')
  const [modalDefaultTitle, setModalDefaultTitle] = useState<string>('')
  // ST-B: NLC task_quick_create memberName resolution preselects the assignee
  const [modalInitialAssigneeId, setModalInitialAssigneeId] = useState<string | undefined>(undefined)
  const [modalPreloadedSections, setModalPreloadedSections] = useState<RoutineSection[] | undefined>(undefined)
  /** When editing an existing routine template, this holds the template ID for UPDATE instead of INSERT */
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  /** When deploying from an existing template, link new task to this template instead of creating a duplicate */
  const [deployFromTemplateId, setDeployFromTemplateId] = useState<string | null>(null)

  // RoutineDeployModal state — lightweight deploy/edit modal for routines
  const [routineDeployOpen, setRoutineDeployOpen] = useState(false)
  const [routineDeployTemplate, setRoutineDeployTemplate] = useState<RoutineDeployTemplate | null>(null)
  const [routineDeployMode, setRoutineDeployMode] = useState<'create' | 'edit'>('create')
  const [routineDeployEditTask, setRoutineDeployEditTask] = useState<DeployModalActiveDeployment | null>(null)

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
  const [listWizardPreset, setListWizardPreset] = useState<string | undefined>(undefined)
  const [rewardsListWizardOpen, setRewardsListWizardOpen] = useState(false)
  const [listRevealWizardOpen, setListRevealWizardOpen] = useState(false)
  const [listRevealPreFill, setListRevealPreFill] = useState<ListRevealPreFill | undefined>(undefined)
  const [listRevealStartKey, setListRevealStartKey] = useState<string | undefined>(undefined)
  const [repeatedActionChartWizardOpen, setRepeatedActionChartWizardOpen] = useState(false)
  const [repeatedActionChartInitial, setRepeatedActionChartInitial] = useState<Record<string, unknown> | undefined>(undefined)
  const [chartStartKey, setChartStartKey] = useState<string | undefined>(undefined)
  const [activityListWizardOpen, setActivityListWizardOpen] = useState(false)
  const [activityListPrefill, setActivityListPrefill] = useState<ActivityListWizardPrefill | undefined>(undefined)
  const [sharedTaskListWizardOpen, setSharedTaskListWizardOpen] = useState(false)
  const [sharedTaskListInitialItems, setSharedTaskListInitialItems] = useState<Array<{ text: string; bigJob?: boolean }> | undefined>(undefined)
  const [sharedTaskListStartKey, setSharedTaskListStartKey] = useState<string | undefined>(undefined)
  // ST-A F-06: the Best Intentions Starter is now a real wizard
  const [bestIntentionsWizardOpen, setBestIntentionsWizardOpen] = useState(false)
  // ST-A F-04: Curriculum Chapter Sequence prefill for SequentialCreatorModal
  const [sequentialPrefill, setSequentialPrefill] = useState<{ title: string; items: string[] } | undefined>(undefined)
  // ST-A F-04: guided-form example mom-section prefill + example title
  const [guidedFormPrefill, setGuidedFormPrefill] = useState<Record<string, string> | undefined>(undefined)
  const [guidedFormExampleTitle, setGuidedFormExampleTitle] = useState<string | undefined>(undefined)
  // ST-B: NLC prefill plumbing for wizards that previously had no prefill props
  const [universalListNLCPrefill, setUniversalListNLCPrefill] = useState<{
    title?: string
    items?: string[]
    listType?: string
    sharingMode?: 'private' | 'specific' | 'family'
    sharedMemberIds?: string[]
  } | undefined>(undefined)
  const [routineBuilderPrefill, setRoutineBuilderPrefill] = useState<{ routineName?: string; description?: string } | undefined>(undefined)
  const [starChartPrefill, setStarChartPrefill] = useState<{ chartName?: string; memberIds?: string[] } | undefined>(undefined)
  const [getToKnowPrefill, setGetToKnowPrefill] = useState<{ memberId?: string } | undefined>(undefined)
  // ST-A F-09: archive requires confirmation (ModalV2, no window.confirm)
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string; isList: boolean } | null>(null)
  const [archiving, setArchiving] = useState(false)
  // ST-C: discarding a draft requires confirmation, same pattern
  const [discardDraftConfirm, setDiscardDraftConfirm] = useState<{ id: string; title: string } | null>(null)
  const [discardingDraft, setDiscardingDraft] = useState(false)
  const toast = useRoutingToast()

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

  const { drafts: wizardDrafts, refresh: refreshWizardDrafts } = useWizardDraftList(family?.id, undefined, draftRefreshKey)

  // STUDIO-EXPERIENCE ST-C: one-time localStorage → wizard_drafts migration
  // (idempotent per family, see useWizardDraft.ts). Never strands a
  // founder-family draft that predates the server-backed table.
  useMigrateLocalStorageWizardDrafts(family?.id, member?.id)

  // STUDIO-EXPERIENCE ST-C: open a wizard type with no prefill (Drafts tab
  // "Resume"). Each wizard's own useWizardDraftChrome sees no skipped
  // reopen-prompt, finds this type's drafts, and offers the picker itself —
  // this function only needs to clear any stale prefill and open the modal.
  const openWizardTypeFresh = useCallback((wizardType: string) => {
    switch (wizardType) {
      case 'rewards_list':
        setRewardsListWizardOpen(true)
        break
      case 'list_reveal_assignment':
        setListRevealPreFill(undefined)
        setListRevealStartKey(undefined)
        setListRevealWizardOpen(true)
        break
      case 'repeated_action_chart':
        setRepeatedActionChartInitial(undefined)
        setChartStartKey(undefined)
        setRepeatedActionChartWizardOpen(true)
        break
      case 'shared_task_list':
        setSharedTaskListInitialItems(undefined)
        setSharedTaskListStartKey(undefined)
        setSharedTaskListWizardOpen(true)
        break
      case 'activity_list':
        setActivityListPrefill(undefined)
        setActivityListWizardOpen(true)
        break
      case 'star_chart':
        setStarChartPrefill(undefined)
        setStarChartWizardOpen(true)
        break
      case 'get_to_know':
        setGetToKnowPrefill(undefined)
        setGetToKnowWizardOpen(true)
        break
      case 'routine_builder':
        setRoutineBuilderPrefill(undefined)
        setRoutineBuilderWizardOpen(true)
        break
      case 'meeting_setup':
        setMeetingSetupWizardOpen(true)
        break
      case 'universal_list':
        setListWizardPreset(undefined)
        setUniversalListNLCPrefill(undefined)
        setListWizardOpen(true)
        break
      default:
        console.warn('[Studio] Unknown wizard type for draft resume:', wizardType)
    }
  }, [])

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
    // ── Example-specific routing (ST-A, F-04) — these examples promise
    // pre-filled content, so they route to the surface that can load it. ──
    if (template.id === 'ex_extra_house_jobs') {
      // "8 real chore jobs + 2 connection items" → board-shaped creation,
      // fully prefilled (was: a blank single-task modal with just a title).
      setListRevealPreFill(EXTRA_HOUSE_JOBS_PREFILL)
      setListRevealStartKey(undefined)
      setListRevealWizardOpen(true)
      return
    }
    if (template.id === 'ex_curriculum_sequence') {
      // "5 sample chapters" → SequentialCreatorModal actually carrying them.
      setSequentialPrefill(CURRICULUM_SEQUENCE_PREFILL)
      setSequentialTemplateId(template.id)
      setSequentialModalOpen(true)
      return
    }

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
      // Seeded list wizard templates carry a preset key derived from their ID
      if (template.id === 'seed_shared_shopping') {
        setListWizardPreset('shared_shopping')
      } else {
        setListWizardPreset(undefined)
      }
      setListWizardOpen(true)
      return
    }
    // Phase 3.8 wizard types
    if (template.templateType === 'activity_list_wizard') {
      if (template.id === 'seed_reading_fun') {
        setActivityListPrefill({
          subjectName: 'Reading Fun',
          displayMode: 'random',
          dailyFloor: 1,
          items: [
            { text: 'Read a chapter book for 20 minutes' },
            { text: 'Listen to an audiobook' },
            { text: 'Read to a younger sibling' },
            { text: 'Visit the library', recurrence: { is_repeatable: true, frequency_min: 1, frequency_max: null, frequency_period: 'week', cooldown_hours: 24, max_instances: null } },
            { text: 'Comic book time' },
            { text: 'Read a non-fiction article' },
            { text: 'Poetry reading' },
            { text: 'Read-aloud with mom' },
          ],
        })
      } else if (template.id === 'seed_homeschool_variety') {
        setActivityListPrefill({
          subjectName: 'Homeschool Variety Pack',
          displayMode: 'browse',
          dailyFloor: 2,
          items: [
            { text: 'Math worksheet' },
            { text: 'Science experiment' },
            { text: 'Art project' },
            { text: 'PE / outdoor play' },
            { text: 'Music practice' },
            { text: 'History reading' },
            { text: 'Writing prompt' },
            { text: 'Geography map work' },
            { text: 'Typing practice' },
            { text: 'Nature journal' },
          ],
        })
      } else {
        setActivityListPrefill(undefined)
      }
      setActivityListWizardOpen(true)
      return
    }
    // Phase 3.7 wizard types
    if (template.templateType === 'rewards_list_wizard') {
      setRewardsListWizardOpen(true)
      return
    }
    if (template.templateType === 'list_reveal_assignment_wizard') {
      if (template.id === 'seed_consequence_spinner') {
        setListRevealPreFill(CONSEQUENCE_SPINNER_PREFILL)
      } else if (template.id === 'seed_extra_earning') {
        setListRevealPreFill(EXTRA_EARNING_PREFILL)
      } else {
        setListRevealPreFill(undefined)
      }
      setListRevealWizardOpen(true)
      return
    }
    if (template.templateType === 'repeated_action_chart_wizard') {
      if (template.isExample && template.id === 'seed_potty_chart') {
        setRepeatedActionChartInitial(POTTY_CHART_INITIAL)
      } else {
        setRepeatedActionChartInitial(undefined)
      }
      setChartStartKey(undefined)
      setRepeatedActionChartWizardOpen(true)
      return
    }
    if (template.templateType === 'shared_task_list_wizard') {
      if (template.isExample && template.id === 'seed_honey_do_list') {
        setSharedTaskListInitialItems(HONEY_DO_SEED_ITEMS)
      } else {
        setSharedTaskListInitialItems(undefined)
      }
      setSharedTaskListStartKey(undefined)
      setSharedTaskListWizardOpen(true)
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
      // ST-A F-06: the card promises a wizard — open the real one.
      setBestIntentionsWizardOpen(true)
      return
    }

    // Widget types from Gamification section (star chart, spinner) → widget config flow
    if (template.templateType.startsWith('widget_')) {
      const trackerType = template.templateType.replace('widget_', '')
      const config = starterConfigs.find(sc => sc.tracker_type === trackerType)
      if (config) {
        handleSelectStarterConfig(config)
      } else if (trackerType === 'randomizer_spinner') {
        // ST-A (Reward Spinner tile, was BROKEN): no DB starter config exists
        // yet (ST-E seeds one), so land on a real spinner configuration via a
        // synthetic in-memory starter config. randomizer_spinner has a real
        // renderer (RandomizerSpinnerTracker), so the deploy is fully live.
        handleSelectStarterConfig({
          id: 'synthetic_randomizer_spinner',
          tracker_type: 'randomizer_spinner',
          visual_variant: 'standard_spinner',
          config_name: 'Reward Spinner',
          description: 'A colorful spinner wheel linked to a randomizer list.',
          category: 'quick_action_tracker',
          default_config: {},
          is_example: false,
          sort_order: 0,
          created_at: '',
          updated_at: '',
        })
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
      // ST-A F-04: example forms carry their promised pre-filled mom sections
      setGuidedFormPrefill(GUIDED_FORM_EXAMPLE_PREFILLS[template.id])
      setGuidedFormExampleTitle(template.isExample ? template.name : undefined)
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

    // Opportunity Board tile → BOARD-shaped creation (ST-A F-05). The card
    // promises a browsable board with per-board member visibility; a single
    // opportunity task is not that. Route to the ListReveal wizard's
    // opportunity flavor (post-OPPORTUNITY-SURFACES, boards are lists with
    // is_opportunity=true).
    if (template.templateType.startsWith('opportunity')) {
      setListRevealPreFill({
        flavor: 'opportunity',
        listName: '',
        listDescription: '',
        items: [],
      })
      setListRevealStartKey(undefined)
      setListRevealWizardOpen(true)
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

  // ST-B: shared memberName → member id resolution, used by every NLC
  // outcome that can extract a person's name (repeated_action_chart,
  // star_chart, get_to_know, gamification_setup, task_quick_create).
  // Case-insensitive full name, first name, or nickname match against the
  // active roster — never invents a match nobody actually has.
  const resolveMemberIdByName = useCallback((name: unknown): string | undefined => {
    if (!name) return undefined
    const wanted = String(name).trim().toLowerCase()
    if (!wanted) return undefined
    const match = familyMembers.find(
      (m) =>
        m.is_active &&
        (m.display_name.toLowerCase() === wanted ||
          m.display_name.toLowerCase().split(' ')[0] === wanted ||
          (m.nicknames ?? []).some((n) => n.toLowerCase() === wanted)),
    )
    return match?.id
  }, [familyMembers])

  const handleNLCOpenWizard = useCallback((
    wizardType:
      | 'rewards_list' | 'repeated_action_chart'
      | 'list_reveal_assignment_opportunity' | 'list_reveal_assignment_draw'
      | 'activity_list_wizard' | 'shared_task_list_wizard'
      | 'universal_list' | 'routine_builder' | 'sequential_creator'
      | 'star_chart' | 'meeting_setup' | 'get_to_know'
      | 'gamification_setup' | 'task_quick_create',
    preFill: Record<string, unknown>,
  ) => {
    if (wizardType === 'activity_list_wizard') {
      const items = preFill.items as string[] | undefined
      const pf: ActivityListWizardPrefill = {
        subjectName: (preFill.subjectName as string) ?? undefined,
        dailyFloor: (preFill.dailyFloor as number) ?? undefined,
        items: items?.map(text => ({ text })),
      }
      setActivityListPrefill(Object.values(pf).some(v => v != null) ? pf : undefined)
      setActivityListWizardOpen(true)
      return
    }
    if (wizardType === 'shared_task_list_wizard') {
      const items = preFill.items as string[] | undefined
      setSharedTaskListInitialItems(items?.map(text => ({ text })))
      setSharedTaskListWizardOpen(true)
      return
    }
    if (wizardType === 'rewards_list') {
      setRewardsListWizardOpen(true)
    } else if (wizardType === 'repeated_action_chart') {
      const initial: Record<string, unknown> = {}
      if (preFill.chartName) initial.chartName = preFill.chartName
      if (preFill.actionTaskName) initial.actionTaskName = preFill.actionTaskName
      // ST-A item 10: NLC extracts memberName ("a potty chart for Ruthie") —
      // resolve it to a member id so the Assign step starts preselected
      // instead of discarding mom's words.
      const matchId = resolveMemberIdByName(preFill.memberName)
      if (matchId) initial.selectedMemberIds = [matchId]
      setRepeatedActionChartInitial(Object.keys(initial).length > 0 ? initial : undefined)
      setChartStartKey(undefined)
      setRepeatedActionChartWizardOpen(true)
    } else if (wizardType === 'list_reveal_assignment_opportunity') {
      const items = preFill.items as Array<{ name: string; amount?: number }> | undefined
      const pf: ListRevealPreFill = {
        flavor: 'opportunity',
        listName: (preFill.listName as string) ?? '',
        listDescription: '',
        items: items
          ? items.map((i, idx) => ({
              id: `nlc-${idx}`,
              name: i.name,
              description: '',
              rewardType: 'money' as const,
              rewardAmount: i.amount ?? 1,
              requireApproval: true,
              isRepeatable: true,
              frequencyPeriod: null,
              cooldownHours: null,
              maxInstances: null,
              sectionName: null,
            }))
          : [],
      }
      setListRevealPreFill(pf)
      setListRevealWizardOpen(true)
    } else if (wizardType === 'list_reveal_assignment_draw') {
      const items = preFill.items as string[] | undefined
      const pf: ListRevealPreFill = {
        flavor: 'draw',
        listName: (preFill.listName as string) ?? '',
        listDescription: '',
        items: items
          ? items.map((name, idx) => ({
              id: `nlc-${idx}`,
              name,
              description: '',
              rewardType: '' as const,
              rewardAmount: null,
              requireApproval: false,
              isRepeatable: true,
              frequencyPeriod: null,
              cooldownHours: null,
              maxInstances: null,
              sectionName: null,
            }))
          : [],
      }
      setListRevealPreFill(pf)
      setListRevealWizardOpen(true)
    } else if (wizardType === 'universal_list') {
      // ST-B: "shared grocery list with my husband" — sharedWithRelationship
      // resolves to a real audience via the same isChildMember/isOptInAdult
      // classification the rest of Studio already uses (never a guess at
      // who "the kids" are). "spouse" is a heuristic: the second adult in
      // the roster (additional_adult) — matches how these families actually
      // use the app (mom = primary_parent, dad = additional_adult).
      const relationship = preFill.sharedWithRelationship as string | undefined
      let sharingMode: 'private' | 'specific' | 'family' | undefined
      let sharedMemberIds: string[] | undefined
      if (relationship === 'spouse') {
        const spouse = familyMembers.find((m) => isOptInAdult(m) && m.role === 'additional_adult')
        sharingMode = 'specific'
        sharedMemberIds = spouse ? [spouse.id] : []
      } else if (relationship === 'kids') {
        sharingMode = 'specific'
        sharedMemberIds = familyMembers.filter(isChildMember).map((m) => m.id)
      } else if (relationship === 'everyone') {
        sharingMode = 'family'
      }
      // Defensive whitelist — never hand an unvalidated model string
      // straight into a DB CHECK-constrained column.
      const VALID_LIST_TYPES = new Set(['shopping', 'wishlist', 'packing', 'expenses', 'todo', 'custom', 'ideas', 'prayer'])
      const rawListType = preFill.listType as string | undefined
      setUniversalListNLCPrefill({
        title: (preFill.title as string) ?? undefined,
        items: (preFill.items as string[]) ?? undefined,
        listType: rawListType && VALID_LIST_TYPES.has(rawListType) ? rawListType : undefined,
        sharingMode,
        sharedMemberIds,
      })
      setListWizardPreset(undefined)
      setListWizardOpen(true)
    } else if (wizardType === 'routine_builder') {
      // Conv 253 §2.9 "description passthrough" — mom's original wording
      // goes straight into the routine wizard's own textarea; the wizard
      // still runs its own AI parse when she continues (Convention #4 HITM
      // — nothing here skips her review of the parsed sections).
      setRoutineBuilderPrefill({
        routineName: (preFill.routineName as string) ?? undefined,
        description: (preFill.description as string) ?? undefined,
      })
      setRoutineBuilderWizardOpen(true)
    } else if (wizardType === 'sequential_creator') {
      const items = preFill.items as string[] | undefined
      setSequentialPrefill({
        title: (preFill.title as string) ?? '',
        items: items ?? [],
      })
      setSequentialTemplateId(null)
      setSequentialModalOpen(true)
    } else if (wizardType === 'star_chart') {
      const matchId = resolveMemberIdByName(preFill.memberName)
      setStarChartPrefill({
        chartName: (preFill.chartName as string) ?? undefined,
        memberIds: matchId ? [matchId] : undefined,
      })
      setStarChartWizardOpen(true)
    } else if (wizardType === 'meeting_setup') {
      // No extractable fields — the wizard bootstraps the whole family's
      // meeting calendar from the roster it already has.
      setMeetingSetupWizardOpen(true)
    } else if (wizardType === 'get_to_know') {
      const matchId = resolveMemberIdByName(preFill.memberName)
      setGetToKnowPrefill({ memberId: matchId })
      setGetToKnowWizardOpen(true)
    } else if (wizardType === 'gamification_setup') {
      const matchId = resolveMemberIdByName(preFill.memberName)
      if (matchId) {
        openGamificationForMember(matchId, 'nlc')
      } else {
        setGamificationPickerAction('gamification_setup')
        setGamificationPickerOpen(true)
      }
    } else if (wizardType === 'task_quick_create') {
      const matchId = resolveMemberIdByName(preFill.memberName)
      if (preFill.title) setModalDefaultTitle(preFill.title as string)
      setModalInitialAssigneeId(matchId)
      setModalInitialType('task')
      setModalOpen(true)
    }
  }, [familyMembers, resolveMemberIdByName, openGamificationForMember])

  // ── Use as-is (ST-A, finding F-13) ───────────────────────────
  // Previously an alias of Customize — two buttons, one behavior. Now a real
  // fast-deploy path: full example content loads and the flow opens at the
  // ONE decision the example can't make for mom (who it's for / who sees it),
  // or at Review when nothing is left to decide. The button only renders on
  // examples that have such a path (StudioTemplate.supportsUseAsIs).
  const handleUseAsIs = useCallback((template: StudioTemplate) => {
    // Routine examples → RoutineDeployModal: pick the kid + dates, deploy.
    // Content comes straight from the seeded DB template, untouched.
    if (template.templateType === 'routine' && template.isExample) {
      supabase
        .from('task_templates')
        .select('id')
        .eq('title', template.name)
        .eq('is_example', true)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data?.id) {
            setRoutineDeployTemplate({ id: data.id as string, name: template.name })
            setRoutineDeployMode('create')
            setRoutineDeployEditTask(null)
            setRoutineDeployOpen(true)
          } else {
            handleCustomize(template)
          }
        })
      return
    }
    if (template.id === 'seed_potty_chart') {
      setRepeatedActionChartInitial(POTTY_CHART_INITIAL)
      setChartStartKey('assign')
      setRepeatedActionChartWizardOpen(true)
      return
    }
    if (template.id === 'seed_consequence_spinner') {
      // Draw flavor: everything is decided — land on Review, one tap deploys.
      setListRevealPreFill(CONSEQUENCE_SPINNER_PREFILL)
      setListRevealStartKey('review')
      setListRevealWizardOpen(true)
      return
    }
    if (template.id === 'seed_extra_earning') {
      setListRevealPreFill(EXTRA_EARNING_PREFILL)
      setListRevealStartKey('sharing')
      setListRevealWizardOpen(true)
      return
    }
    if (template.id === 'ex_extra_house_jobs') {
      setListRevealPreFill(EXTRA_HOUSE_JOBS_PREFILL)
      setListRevealStartKey('sharing')
      setListRevealWizardOpen(true)
      return
    }
    if (template.id === 'seed_honey_do_list') {
      setSharedTaskListInitialItems(HONEY_DO_SEED_ITEMS)
      setSharedTaskListStartKey('sharing')
      setSharedTaskListWizardOpen(true)
      return
    }
    // No dedicated fast path (button shouldn't render for these) — fall back.
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
    () => [...LIST_WIZARD_SEEDED, ...LIST_TEMPLATES_EXAMPLES].filter(t => matchesSearch(t, searchQuery)),
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
    () => [...WIZARD_TEMPLATES, ...PHASE37_WIZARD_TEMPLATES, ...PHASE38_WIZARD_TEMPLATES].filter(t => matchesSearch(t, searchQuery)),
    [searchQuery],
  )
  const phase37SeededFiltered = useMemo(
    () => [...PHASE37_SEEDED_TEMPLATES, ...PHASE38_SEEDED_TEMPLATES].filter(t => matchesSearch(t, searchQuery)),
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
    wizardFiltered.length === 0 &&
    phase37SeededFiltered.length === 0

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
      key: 'drafts',
      label: wizardDrafts.length > 0
        ? `Drafts (${wizardDrafts.length})`
        : 'Drafts',
    },
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
            onChange={key => {
              setActiveTab(key as 'browse' | 'drafts' | 'customized')
              if (key === 'drafts') setDraftRefreshKey(k => k + 1)
            }}
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
          {/* Natural Language Composition — Convention 253. ST-B: stays
              visible even while Studio's search box has text (F-07 —
              a mom typing to search shouldn't lose her other on-ramp). */}
          <NaturalLanguageComposition
            familyMemberNames={familyMembers.filter(m => m.is_active).map(m => m.display_name)}
            onOpenWizard={handleNLCOpenWizard}
            familyId={family?.id}
            memberId={member?.id}
          />

          {noSearchResults ? (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title="No templates match that search"
              description='Try searching for "routine", "shopping", or "SODAS" to find what you need.'
            />
          ) : (
            <>
              {/* 1. Setup Wizards — guided multi-step flows (easiest creation path) */}
              {(wizardFiltered.length > 0 || phase37SeededFiltered.length > 0) && (
                <StudioCategorySection
                  title="Setup Wizards"
                  templates={wizardFiltered}
                  exampleTemplates={phase37SeededFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                  defaultCollapsed={false}
                  showExamplesFirst
                />
              )}

              {/* 2. Task & Chore Templates */}
              {(taskBlanksFiltered.length > 0 || taskExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Task & Chore Templates"
                  templates={taskBlanksFiltered}
                  exampleTemplates={taskExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 3. Guided Forms & Worksheets */}
              {(guidedBlanksFiltered.length > 0 || guidedExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="Guided Forms & Worksheets"
                  templates={guidedBlanksFiltered}
                  exampleTemplates={guidedExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 4. List Templates */}
              {(listBlanksFiltered.length > 0 || listExamplesFiltered.length > 0) && (
                <StudioCategorySection
                  title="List Templates"
                  templates={listBlanksFiltered}
                  exampleTemplates={listExamplesFiltered}
                  onCustomize={handleCustomize}
                  onUseAsIs={handleUseAsIs}
                />
              )}

              {/* 5. Trackers & Widgets — PRD-10 real starter configs */}
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

              {/* 6. Gamification & Rewards — real setup templates */}
              {gamificationFiltered.length > 0 && (
                <StudioCategorySection
                  title="Gamification & Rewards"
                  templates={gamificationFiltered}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
                />
              )}

              {/* 7. Growth & Self-Knowledge */}
              {growthFiltered.length > 0 && (
                <StudioCategorySection
                  title="Growth & Self-Knowledge"
                  templates={growthFiltered}
                  onCustomize={handleCustomize}
                  defaultCollapsed={false}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Drafts tab (STUDIO-EXPERIENCE ST-C — server-backed) ──── */}
      {activeTab === 'drafts' && (
        <div>
          {wizardDrafts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wizardDrafts.map((draft) => {
                return (
                  <div
                    key={draft.id}
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
                        >
                          {draft.title === 'Untitled' ? `Untitled ${WIZARD_TYPE_LABELS[draft.wizardType] ?? 'Wizard'}` : draft.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {WIZARD_TYPE_LABELS[draft.wizardType] ?? draft.wizardType}
                        </p>
                      </div>
                      <span
                        className="text-[10px] rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Draft
                      </span>
                    </div>
                    {draft.lastSaved && (
                      <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                        Last saved {new Date(draft.lastSaved).toLocaleDateString()} at{' '}
                        {new Date(draft.lastSaved).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        data-testid={`wizard-draft-resume-${draft.id}`}
                        onClick={() => openWizardTypeFresh(draft.wizardType)}
                        className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: 'var(--color-btn-primary-bg)',
                          color: 'var(--color-btn-primary-text)',
                        }}
                      >
                        Resume
                      </button>
                      <button
                        data-testid={`wizard-draft-tab-discard-${draft.id}`}
                        onClick={() => setDiscardDraftConfirm({ id: draft.id, title: draft.title || 'Untitled' })}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors"
                        style={{
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'transparent',
                        }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Palette size={32} style={{ color: 'var(--color-text-secondary)' }} />}
              title="No drafts in progress"
              description="Start a wizard from the Browse tab — you can save and come back anytime."
              action={
                <button onClick={() => setActiveTab('browse')} style={{ cursor: 'pointer' }}>Browse Templates</button>
              }
            />
          )}
        </div>
      )}

      {/* ── Discard draft confirmation (ST-C — no window.confirm) ── */}
      {discardDraftConfirm && (
        <ModalV2
          id="studio-discard-draft-confirm"
          isOpen={true}
          onClose={() => setDiscardDraftConfirm(null)}
          title="Discard this draft?"
          type="transient"
          size="sm"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Discard <strong>{discardDraftConfirm.title}</strong>? This can't be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDiscardDraftConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Keep it
              </button>
              <button
                data-testid="wizard-draft-tab-discard-confirm"
                disabled={discardingDraft}
                onClick={async () => {
                  setDiscardingDraft(true)
                  await deleteWizardDraftById(discardDraftConfirm.id)
                  setDiscardingDraft(false)
                  setDiscardDraftConfirm(null)
                  refreshWizardDrafts()
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-error, #dc2626)', color: '#ffffff' }}
              >
                {discardingDraft ? 'Discarding…' : 'Discard'}
              </button>
            </div>
          </div>
        </ModalV2>
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
                    if (t.templateType === 'routine') {
                      setRoutineDeployTemplate({ id: t.id, name: t.name })
                      setRoutineDeployMode('create')
                      setRoutineDeployEditTask(null)
                      setRoutineDeployOpen(true)
                      return
                    }
                    setEditingTemplateId(null)
                    setDeployFromTemplateId(t.id)
                    setModalDefaultTitle(t.name)
                    setModalInitialType(t.templateType as string || 'task')
                    setModalOpen(true)
                  }}
                  onEditDeployment={(t, dep) => {
                    setRoutineDeployTemplate({ id: t.id, name: t.name })
                    setRoutineDeployMode('edit')
                    setRoutineDeployEditTask({
                      taskId: dep.taskId,
                      assigneeId: dep.assigneeId,
                      assigneeDisplayName: dep.assigneeName,
                      assigneeColor: dep.assigneeColor,
                      dtstart: dep.dtstart,
                      endDate: dep.endDate,
                      countsForAllowance: dep.countsForAllowance,
                      countsForGamification: dep.countsForGamification,
                      countsForHomework: dep.countsForHomework,
                      allowancePoints: dep.allowancePoints,
                      status: dep.status,
                    })
                    setRoutineDeployOpen(true)
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
                      // ST-A F-03: the old insert omitted NOT-NULL
                      // template_name (every duplicate failed 23502,
                      // silently), wrote the Studio type string into
                      // task_type, and carried only title+type. Deep-copy
                      // the real row instead, and SAY what happened.
                      void (async () => {
                        const { data: src, error: readError } = await supabase
                          .from('task_templates')
                          .select('*')
                          .eq('id', t.id)
                          .single()
                        if (readError || !src) {
                          toast.show({ message: `Couldn't duplicate "${t.name}". Please try again.`, variant: 'error' })
                          return
                        }
                        const copy = { ...(src as Record<string, unknown>) }
                        delete copy.id
                        delete copy.created_at
                        delete copy.updated_at
                        copy.title = `${t.name} (copy)`
                        copy.template_name = `${t.name} (copy)`
                        copy.family_id = family?.id
                        copy.created_by = member?.id
                        copy.is_system = false
                        copy.is_system_template = false
                        copy.is_example = false
                        copy.usage_count = 0
                        copy.last_deployed_at = null
                        copy.archived_at = null
                        const { error: insertError } = await supabase
                          .from('task_templates')
                          .insert(copy)
                        if (insertError) {
                          console.error('[Studio] Duplicate failed:', insertError)
                          toast.show({ message: `Couldn't duplicate "${t.name}". Please try again.`, variant: 'error' })
                          return
                        }
                        queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family?.id] })
                        toast.show({ message: `Duplicated "${t.name}" — the copy is in My Customized.` })
                      })()
                    }
                  }}
                  onArchive={(t) => {
                    // ST-A F-09: archive confirms first (ModalV2), no reload.
                    setArchiveConfirm({ id: t.id, name: t.name, isList: isListTemplateType(t.templateType) })
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
            setModalInitialAssigneeId(undefined)
          }}
          onSave={handleTaskSaved}
          initialTaskType={modalInitialType}
          defaultTitle={modalDefaultTitle || undefined}
          initialRoutineSections={modalPreloadedSections}
          editMode={!!editingTemplateId}
          editingTemplateId={editingTemplateId}
          deployFromTemplateId={deployFromTemplateId}
          initialAssigneeId={modalInitialAssigneeId}
        />
      )}

      {/* ── Routine Deploy Modal ────────────────────────────── */}
      {routineDeployOpen && routineDeployTemplate && (
        <RoutineDeployModal
          isOpen={routineDeployOpen}
          onClose={() => {
            setRoutineDeployOpen(false)
            setRoutineDeployTemplate(null)
            setRoutineDeployEditTask(null)
          }}
          template={routineDeployTemplate}
          mode={routineDeployMode}
          editingDeployment={routineDeployEditTask}
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
            setSequentialPrefill(undefined)
          }}
          familyId={family.id}
          createdBy={member.id}
          title={sequentialTemplateId === 'ex_reading_list' ? 'Create Reading List' : undefined}
          initialTitle={sequentialPrefill?.title}
          initialItems={sequentialPrefill?.items}
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
          onClose={() => {
            setGuidedFormModalOpen(false)
            setGuidedFormPrefill(undefined)
            setGuidedFormExampleTitle(undefined)
          }}
          initialMomValues={guidedFormPrefill}
          template={{
            id: `studio_${guidedFormSubtype}`,
            family_id: null,
            created_by: null,
            title: guidedFormExampleTitle ?? (guidedFormSubtype === 'sodas' ? 'SODAS' : guidedFormSubtype === 'what_if' ? 'What-If Game' : guidedFormSubtype === 'apology_reflection' ? 'Apology Reflection' : 'Guided Form'),
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
            queryClient.invalidateQueries({
              queryKey: ['task_templates_customized', family?.id],
            })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
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

      {/* ── Widget Configuration Modal (PRD-10).
          key forces a remount per selected config — same always-mounted
          stale-useState bug as Dashboard.tsx (see comment there). ── */}
      <WidgetConfiguration
        key={selectedStarterConfig?.id ?? 'widget-config-idle'}
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
          onClose={() => { setStarChartWizardOpen(false); setStarChartPrefill(undefined); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
          initialChartName={starChartPrefill?.chartName}
          initialMemberIds={starChartPrefill?.memberIds}
        />
      )}

      {getToKnowWizardOpen && family?.id && member?.id && (
        <GetToKnowWizard
          isOpen={getToKnowWizardOpen}
          onClose={() => { setGetToKnowWizardOpen(false); setGetToKnowPrefill(undefined); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
          initialMemberId={getToKnowPrefill?.memberId}
        />
      )}

      {routineBuilderWizardOpen && (
        <RoutineBuilderWizard
          isOpen={routineBuilderWizardOpen}
          onClose={() => { setRoutineBuilderWizardOpen(false); setRoutineBuilderPrefill(undefined); setDraftRefreshKey(k => k + 1) }}
          onAccept={(routineName, sections) => {
            setRoutineBuilderWizardOpen(false)
            setRoutineBuilderPrefill(undefined)
            setDraftRefreshKey(k => k + 1)
            setModalDefaultTitle(routineName)
            setModalPreloadedSections(sections)
            setModalInitialType('routine')
            setModalOpen(true)
          }}
          familyId={family?.id}
          ownerId={member?.id}
          initialRoutineName={routineBuilderPrefill?.routineName}
          initialDescription={routineBuilderPrefill?.description}
        />
      )}

      {meetingSetupWizardOpen && family?.id && member?.id && (
        <MeetingSetupWizard
          isOpen={meetingSetupWizardOpen}
          onClose={() => {
            setMeetingSetupWizardOpen(false)
            setDraftRefreshKey(k => k + 1)
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
          onClose={() => { setListWizardOpen(false); setListWizardPreset(undefined); setUniversalListNLCPrefill(undefined); setDraftRefreshKey(k => k + 1) }}
          initialPreset={listWizardPreset}
          initialTitle={universalListNLCPrefill?.title}
          initialItems={universalListNLCPrefill?.items}
          initialListType={universalListNLCPrefill?.listType}
          initialSharingMode={universalListNLCPrefill?.sharingMode}
          initialSharedMemberIds={universalListNLCPrefill?.sharedMemberIds}
        />
      )}

      {rewardsListWizardOpen && family?.id && member?.id && (
        <RewardsListWizard
          isOpen={rewardsListWizardOpen}
          onClose={() => { setRewardsListWizardOpen(false); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
        />
      )}

      {listRevealWizardOpen && family?.id && member?.id && (
        <ListRevealAssignmentWizard
          isOpen={listRevealWizardOpen}
          onClose={() => { setListRevealWizardOpen(false); setListRevealPreFill(undefined); setListRevealStartKey(undefined); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
          preFill={listRevealPreFill}
          startAtStepKey={listRevealStartKey}
        />
      )}

      {repeatedActionChartWizardOpen && family?.id && member?.id && (
        <RepeatedActionChartWizard
          isOpen={repeatedActionChartWizardOpen}
          onClose={() => { setRepeatedActionChartWizardOpen(false); setRepeatedActionChartInitial(undefined); setChartStartKey(undefined); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
          initialState={repeatedActionChartInitial}
          startAtStepKey={chartStartKey}
        />
      )}

      {sharedTaskListWizardOpen && family?.id && member?.id && (
        <SharedTaskListWizard
          isOpen={sharedTaskListWizardOpen}
          onClose={() => { setSharedTaskListWizardOpen(false); setSharedTaskListInitialItems(undefined); setSharedTaskListStartKey(undefined); setDraftRefreshKey(k => k + 1) }}
          familyId={family.id}
          memberId={member.id}
          familyMembers={familyMembers}
          initialItems={sharedTaskListInitialItems}
          startAtStepKey={sharedTaskListStartKey}
        />
      )}

      {/* ── Best Intentions Starter Wizard (ST-A F-06) ─────────── */}
      {bestIntentionsWizardOpen && family?.id && member?.id && (
        <BestIntentionsStarterWizard
          isOpen={bestIntentionsWizardOpen}
          onClose={() => setBestIntentionsWizardOpen(false)}
          familyId={family.id}
          memberId={member.id}
        />
      )}

      {/* ── Archive Confirmation (ST-A F-09 — no window.confirm, no reload) ── */}
      {archiveConfirm && (
        <ModalV2
          id="studio-archive-confirm"
          isOpen={true}
          onClose={() => setArchiveConfirm(null)}
          title="Archive template?"
          type="transient"
          size="sm"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Archive <strong>{archiveConfirm.name}</strong>? It disappears from My
              Customized but existing deployments keep working. You can bring it
              back later.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setArchiveConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Keep it
              </button>
              <button
                disabled={archiving}
                onClick={async () => {
                  setArchiving(true)
                  const table = archiveConfirm.isList ? 'list_templates' : 'task_templates'
                  const { error } = await supabase
                    .from(table)
                    .update({ archived_at: new Date().toISOString() })
                    .eq('id', archiveConfirm.id)
                  setArchiving(false)
                  if (error) {
                    toast.show({ message: `Couldn't archive "${archiveConfirm.name}". Please try again.`, variant: 'error' })
                    return
                  }
                  toast.show({ message: `Archived "${archiveConfirm.name}".` })
                  setArchiveConfirm(null)
                  queryClient.invalidateQueries({ queryKey: ['task_templates_customized', family?.id] })
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                {archiving ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </ModalV2>
      )}

      {activityListWizardOpen && (
        <ActivityListWizard
          isOpen={activityListWizardOpen}
          onClose={() => { setActivityListWizardOpen(false); setActivityListPrefill(undefined); setDraftRefreshKey(k => k + 1) }}
          prefill={activityListPrefill}
        />
      )}
    </div>
  )
}
