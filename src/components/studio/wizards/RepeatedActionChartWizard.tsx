/**
 * RepeatedActionChartWizard — Phase 3.7 Worker C
 *
 * 6-step wizard: Name the Chart → Pick the Action → Chart Display →
 * Milestones & Rewards → Assign to Kid → Review & Deploy.
 *
 * Composes contracts via the connector layer to track a repeated action
 * (potty trips, piano practice, reading chapters) with visual progress
 * (star chart widget, coloring reveal, or both) and milestone rewards.
 *
 * Uses Build M linear-advance shape for coloring reveals.
 * PRD-24B sequential/gradual/random strategies are roadmap — see SCOPE-2.F62.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Star, Palette, Trophy,
  Plus, Trash2,
} from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardDraft } from './useWizardDraft'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import { useCreateWidget } from '@/hooks/useWidgets'
import { useCreateColoringReveal } from '@/hooks/useGamificationSettings'
import { useColoringRevealLibrary } from '@/hooks/useColoringReveals'
import { supabase } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ContractSourceType, GodmotherType, ContractIfPattern, PresentationMode } from '@/types/contracts'
import type { RevealStepCount } from '@/types/play-dashboard'

// ─── Types ─────────────────────────────────────────────────────

type ActionSource = 'task_completion' | 'routine_step' | 'custom'

interface MilestoneConfig {
  id: string
  type: 'every_nth' | 'on_threshold_cross'
  count: number
  rewardMode: 'rewards_list' | 'custom_text'
  rewardsListId: string
  customText: string
  presentation: PresentationMode
}

interface WizardState {
  chartName: string
  description: string
  actionSource: ActionSource
  actionTaskName: string
  showStarChart: boolean
  starChartTarget: number
  showColoringReveal: boolean
  coloringImageSlug: string
  coloringStepCount: number
  coloringAutoNext: boolean
  milestones: MilestoneConfig[]
  selectedMemberIds: string[]
}

const INITIAL_STATE: WizardState = {
  chartName: '',
  description: '',
  actionSource: 'task_completion',
  actionTaskName: '',
  showStarChart: true,
  starChartTarget: 50,
  showColoringReveal: false,
  coloringImageSlug: '',
  coloringStepCount: 10,
  coloringAutoNext: true,
  milestones: [],
  selectedMemberIds: [],
}

const STEPS: WizardStep[] = [
  { key: 'name', title: 'Name It' },
  { key: 'action', title: 'Pick Action' },
  { key: 'display', title: 'Chart Display' },
  { key: 'milestones', title: 'Milestones' },
  { key: 'assign', title: 'Assign' },
  { key: 'review', title: 'Review' },
]

const STEP_COUNT_OPTIONS = [5, 10, 15, 20, 30, 50] as const

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Rewards list picker hook ──────────────────────────────────

function useRewardsLists(familyId: string) {
  return useQuery({
    queryKey: ['reward-lists', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('id, title')
        .eq('family_id', familyId)
        .eq('list_type', 'reward_list')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) return []
      return data ?? []
    },
    enabled: !!familyId,
    staleTime: 30_000,
  })
}

function useDefaultThemeId() {
  return useQuery({
    queryKey: ['default-gamification-theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gamification_themes')
        .select('id')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error || !data) return null
      return data.id as string
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Props ─────────────────────────────────────────────────────

interface RepeatedActionChartWizardProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  familyMembers: Array<{
    id: string
    display_name: string
    is_active?: boolean
    calendar_color?: string | null
    assigned_color?: string | null
    member_color?: string | null
  }>
  initialState?: Partial<WizardState>
}

// ─── Main Wizard Component ─────────────────────────────────────

export function RepeatedActionChartWizard({
  isOpen,
  onClose,
  familyId,
  memberId,
  familyMembers,
  initialState,
}: RepeatedActionChartWizardProps) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>({ ...INITIAL_STATE, ...initialState })
  const [deployed, setDeployed] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const { draft, saveDraft, clearDraft } = useWizardDraft<WizardState>(
    'repeated_action_chart',
    familyId,
  )
  const draftRestored = useRef(false)

  const createWidget = useCreateWidget()
  const createColoringReveal = useCreateColoringReveal()
  const qc = useQueryClient()

  const { data: themeId } = useDefaultThemeId()
  const { data: coloringLibrary } = useColoringRevealLibrary(themeId ?? undefined)
  const { data: rewardsLists } = useRewardsLists(familyId)

  const childMembers = familyMembers.filter(
    (m) => m.id !== memberId && m.is_active !== false,
  )

  // Restore draft on mount
  useEffect(() => {
    if (draft && !draftRestored.current && !initialState) {
      setState(draft)
      draftRestored.current = true
    }
  }, [draft, initialState])

  // Auto-save draft on step change and on meaningful content change
  const draftTitle = state.chartName || 'Untitled Progress Chart'
  useEffect(() => {
    if (deployed || !isOpen) return
    if (state.chartName || state.actionTaskName) {
      saveDraft(state, draftTitle)
    }
  }, [step, state.chartName, state.actionTaskName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setState({ ...INITIAL_STATE, ...initialState })
      setStep(0)
      setDeployed(false)
      draftRestored.current = false
    }
  }, [isOpen, initialState])

  // ── Handlers ──────────────────────────────────────────────────

  const handleAddMilestone = useCallback((type: MilestoneConfig['type']) => {
    setState((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          id: makeId(),
          type,
          count: type === 'every_nth' ? 5 : prev.starChartTarget,
          rewardMode: 'custom_text',
          rewardsListId: '',
          customText: '',
          presentation: 'treasure_box',
        },
      ],
    }))
  }, [])

  const handleUpdateMilestone = useCallback((id: string, updates: Partial<MilestoneConfig>) => {
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    }))
  }, [])

  const handleRemoveMilestone = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }))
  }, [])

  const handleMemberToggle = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedMemberIds: prev.selectedMemberIds.includes(id)
        ? prev.selectedMemberIds.filter((mid) => mid !== id)
        : [...prev.selectedMemberIds, id],
    }))
  }, [])

  const handleToggleAll = useCallback(() => {
    setState((prev) => {
      const allSelected = childMembers.length > 0 && prev.selectedMemberIds.length === childMembers.length
      return {
        ...prev,
        selectedMemberIds: allSelected ? [] : childMembers.map((m) => m.id),
      }
    })
  }, [childMembers])

  // ── Deploy ────────────────────────────────────────────────────

  const handleDeploy = useCallback(async () => {
    if (state.selectedMemberIds.length === 0) return
    setIsDeploying(true)

    try {
      for (const kidId of state.selectedMemberIds) {
        const kidName = familyMembers.find((m) => m.id === kidId)?.display_name?.split(' ')[0] ?? 'Child'

        // 1. Create the tracked task
        const taskTitle = state.actionTaskName || state.chartName || 'Completed action'
        const { data: task, error: taskErr } = await supabase
          .from('tasks')
          .insert({
            family_id: familyId,
            created_by: memberId,
            assignee_id: kidId,
            title: taskTitle,
            task_type: 'task',
            status: 'active',
            source: 'studio',
            counts_for_gamification: false,
            counts_for_allowance: false,
          })
          .select('id')
          .single()
        if (taskErr || !task) {
          console.error('Failed to create tracked task:', taskErr)
          continue
        }

        // Also insert task_assignment
        await supabase.from('task_assignments').insert({
          task_id: task.id,
          member_id: kidId,
          assigned_by: memberId,
          family_member_id: kidId,
        })

        const sourceType: ContractSourceType = 'task_completion'
        const sourceId = task.id

        // 2. Star chart widget + contract
        let widgetId: string | null = null
        if (state.showStarChart) {
          try {
            const widget = await createWidget.mutateAsync({
              family_id: familyId,
              family_member_id: kidId,
              template_type: 'tally',
              visual_variant: 'star_chart',
              title: `${state.chartName || taskTitle} - ${kidName}`,
              size: 'medium',
              widget_config: {
                target: state.starChartTarget,
                icon: 'star',
                source_task_id: task.id,
              },
              assigned_member_id: kidId,
            })
            widgetId = widget.id

            // Contract: every completion → tally the star chart
            await supabase.from('contracts').insert({
              family_id: familyId,
              created_by: memberId,
              status: 'active',
              source_type: sourceType,
              source_id: sourceId,
              family_member_id: kidId,
              if_pattern: 'every_time' as ContractIfPattern,
              if_offset: 0,
              godmother_type: 'widget_data_point_godmother' as GodmotherType,
              payload_config: { widget_id: widgetId, value: 1 },
              stroke_of: 'immediate',
              inheritance_level: 'kid_override',
              override_mode: 'replace',
              presentation_mode: 'toast' as PresentationMode,
            })
          } catch (err) {
            console.error('Failed to create star chart widget:', err)
          }
        }

        // 3. Coloring reveal + contract
        if (state.showColoringReveal && state.coloringImageSlug) {
          const image = coloringLibrary?.find((i) => i.slug === state.coloringImageSlug)
          if (image) {
            try {
              await createColoringReveal.mutateAsync({
                family_id: familyId,
                family_member_id: kidId,
                coloring_image_id: image.id,
                reveal_step_count: state.coloringStepCount as RevealStepCount,
                earning_source_type: 'task',
                earning_source_id: task.id,
              })

              // Contract: every completion → advance one coloring zone
              await supabase.from('contracts').insert({
                family_id: familyId,
                created_by: memberId,
                status: 'active',
                source_type: sourceType,
                source_id: sourceId,
                family_member_id: kidId,
                if_pattern: 'every_time' as ContractIfPattern,
                if_offset: 0,
                godmother_type: 'coloring_reveal_godmother' as GodmotherType,
                payload_config: {
                  auto_init_image_slug: state.coloringImageSlug,
                  auto_init_step_count: state.coloringStepCount,
                  grant_fresh_on_complete: state.coloringAutoNext,
                },
                stroke_of: 'immediate',
                inheritance_level: 'kid_override',
                override_mode: 'replace',
                presentation_mode: 'coloring_advance' as PresentationMode,
              })
            } catch (err) {
              console.error('Failed to create coloring reveal:', err)
            }
          }
        }

        // 4. Milestone contracts
        for (const milestone of state.milestones) {
          const godmotherType: GodmotherType =
            milestone.rewardMode === 'rewards_list' ? 'prize_godmother' : 'custom_reward_godmother'

          const payloadConfig: Record<string, unknown> = {}
          if (milestone.rewardMode === 'rewards_list' && milestone.rewardsListId) {
            payloadConfig.prize_list_id = milestone.rewardsListId
          }
          if (milestone.rewardMode === 'custom_text' && milestone.customText) {
            payloadConfig.reward_text = milestone.customText
          }

          await supabase.from('contracts').insert({
            family_id: familyId,
            created_by: memberId,
            status: 'active',
            source_type: sourceType,
            source_id: sourceId,
            family_member_id: kidId,
            if_pattern: milestone.type as ContractIfPattern,
            if_n: milestone.count,
            if_offset: 0,
            godmother_type: godmotherType,
            payload_config: payloadConfig,
            payload_text: milestone.rewardMode === 'custom_text' ? milestone.customText : null,
            stroke_of: 'immediate',
            inheritance_level: 'kid_override',
            override_mode: 'replace',
            presentation_mode: milestone.presentation,
          })
        }

        // 5. Save wizard template record
        await supabase.from('wizard_templates').insert({
          family_id: familyId,
          created_by: memberId,
          wizard_type: 'repeated_action_chart',
          title: state.chartName || taskTitle,
          config: {
            ...state,
            deployed_task_id: task.id,
            deployed_widget_id: widgetId,
            deployed_for_member: kidId,
          },
        })
      }

      clearDraft()
      setDeployed(true)
      qc.invalidateQueries({ queryKey: ['contracts'] })
    } catch (err) {
      console.error('Repeated action chart deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }, [
    state, familyId, memberId, familyMembers, childMembers,
    createWidget, createColoringReveal, coloringLibrary,
    clearDraft, qc,
  ])

  // ── Close handling ────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (deployed) {
      onClose()
      return
    }
    const cur = stateRef.current
    const title = cur.chartName || 'Untitled Progress Chart'
    saveDraft(cur, title)
    onClose()
  }, [deployed, saveDraft, onClose])

  // ── Step validation ───────────────────────────────────────────

  const canAdvance =
    step === 0 ? true :
    step === 1 ? true :
    step === 2 ? (state.showStarChart || state.showColoringReveal) :
    step === 3 ? true :
    step === 4 ? state.selectedMemberIds.length >= 1 :
    true

  const canFinish = state.selectedMemberIds.length >= 1 && (state.showStarChart || state.showColoringReveal)

  // ── Step content ──────────────────────────────────────────────

  const renderStep = () => {
    if (deployed) {
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' }}
          >
            <Star size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Chart deployed!
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {state.chartName || 'Your progress chart'} is active. Each time the action is completed, the chart updates automatically.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Done
          </button>
        </div>
      )
    }

    switch (step) {
      case 0: // Name the Chart
        return (
          <div className="space-y-4">
            <h4
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Name Your Progress Chart
            </h4>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              What are you tracking? Give it a name your child will recognize.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Chart name
              </label>
              <input
                type="text"
                value={state.chartName}
                onChange={(e) => setState((prev) => ({ ...prev, chartName: e.target.value }))}
                placeholder="e.g., Potty Chart, Piano Practice, Reading Stars"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Description <span className="font-normal" style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
              </label>
              <textarea
                value={state.description}
                onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Any notes about what counts as a completion..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
        )

      case 1: // Pick the Action
        return (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              What triggers each mark on the chart? A task that appears on the kid's dashboard is the simplest option.
            </p>

            {/* Task completion (default) */}
            <label
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: state.actionSource === 'task_completion' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.actionSource === 'task_completion' ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
              }}
            >
              <input
                type="radio"
                name="actionSource"
                checked={state.actionSource === 'task_completion'}
                onChange={() => setState((prev) => ({ ...prev, actionSource: 'task_completion' }))}
                className="shrink-0 mt-1"
              />
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Task on their dashboard
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Creates a tappable task. Each tap = one mark on the chart.
                </p>
                {state.actionSource === 'task_completion' && (
                  <input
                    type="text"
                    value={state.actionTaskName}
                    onChange={(e) => setState((prev) => ({ ...prev, actionTaskName: e.target.value }))}
                    placeholder="e.g., Used the potty!, Practiced piano"
                    className="w-full mt-2 px-3 py-1.5 rounded-lg text-sm border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                )}
              </div>
            </label>

            {/* Routine step — stub for now */}
            <label
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all opacity-50"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
              }}
            >
              <input type="radio" name="actionSource" disabled className="shrink-0 mt-1" />
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Existing routine step
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  Coming soon — link to a step in an existing routine.
                </p>
              </div>
            </label>
          </div>
        )

      case 2: // Chart Display
        return (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              How should progress look? Pick one or both.
            </p>

            {/* Star chart toggle */}
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{
                borderColor: state.showStarChart ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.showStarChart ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
              }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.showStarChart}
                  onChange={(e) => setState((prev) => ({ ...prev, showStarChart: e.target.checked }))}
                  className="shrink-0"
                />
                <div className="flex items-center gap-2">
                  <Star size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Star Chart Widget
                  </span>
                </div>
              </label>
              {state.showStarChart && (
                <div className="pl-8">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Target count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={state.starChartTarget}
                    onChange={(e) => setState((prev) => ({
                      ...prev,
                      starChartTarget: Math.max(1, parseInt(e.target.value) || 1),
                    }))}
                    className="w-24 px-3 py-1.5 rounded-lg text-sm border"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    A star widget on the dashboard tracking progress to {state.starChartTarget}.
                  </p>
                </div>
              )}
            </div>

            {/* Coloring reveal toggle */}
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{
                borderColor: state.showColoringReveal ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: state.showColoringReveal ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-primary))' : 'var(--color-bg-primary)',
              }}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.showColoringReveal}
                  onChange={(e) => setState((prev) => ({ ...prev, showColoringReveal: e.target.checked }))}
                  className="shrink-0"
                />
                <div className="flex items-center gap-2">
                  <Palette size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Coloring Reveal
                  </span>
                </div>
              </label>
              {state.showColoringReveal && (
                <div className="pl-8 space-y-3">
                  {/* Image picker */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Pick an image
                    </label>
                    {coloringLibrary && coloringLibrary.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        {coloringLibrary.map((img) => (
                          <button
                            key={img.slug}
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, coloringImageSlug: img.slug }))}
                            className="rounded-lg border-2 p-1 transition-all aspect-square flex items-center justify-center text-xs"
                            style={{
                              borderColor: state.coloringImageSlug === img.slug ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                              backgroundColor: state.coloringImageSlug === img.slug
                                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-primary))'
                                : 'var(--color-bg-primary)',
                              color: 'var(--color-text-secondary)',
                            }}
                            title={img.display_name}
                          >
                            <span className="truncate">{img.display_name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Loading coloring library...
                      </p>
                    )}
                  </div>

                  {/* Step count */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Actions per page
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STEP_COUNT_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setState((prev) => ({ ...prev, coloringStepCount: n }))}
                          className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                          style={{
                            borderColor: state.coloringStepCount === n ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                            backgroundColor: state.coloringStepCount === n ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-primary)',
                            color: state.coloringStepCount === n ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {state.coloringStepCount} actions to complete one coloring page.
                      {state.starChartTarget > 0 && ` That's ${Math.ceil(state.starChartTarget / state.coloringStepCount)} pages across ${state.starChartTarget} total.`}
                    </p>
                  </div>

                  {/* Auto-start next */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.coloringAutoNext}
                      onChange={(e) => setState((prev) => ({ ...prev, coloringAutoNext: e.target.checked }))}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                      Automatically start a new page when one finishes
                    </span>
                  </label>
                </div>
              )}
            </div>

            {!state.showStarChart && !state.showColoringReveal && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Pick at least one display option to continue.
              </p>
            )}
          </div>
        )

      case 3: // Milestones & Rewards
        return (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Set up celebrations at milestones. These are optional — the chart works without them.
            </p>

            {state.milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                rewardsLists={rewardsLists ?? []}
                onUpdate={(updates) => handleUpdateMilestone(milestone.id, updates)}
                onRemove={() => handleRemoveMilestone(milestone.id)}
              />
            ))}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddMilestone('every_nth')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                <Plus size={14} />
                Every N times
              </button>
              <button
                type="button"
                onClick={() => handleAddMilestone('on_threshold_cross')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                <Plus size={14} />
                At a specific count
              </button>
            </div>

            {state.milestones.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                No milestones yet. Add one to celebrate progress, or skip this step.
              </p>
            )}
          </div>
        )

      case 4: // Assign to Kid
        return (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Who is this chart for? Each child gets their own independent chart.
            </p>
            <MemberPillSelector
              members={childMembers}
              selectedIds={state.selectedMemberIds}
              onToggle={handleMemberToggle}
              showEveryone
              onToggleAll={handleToggleAll}
              showSortToggle={false}
            />
            {state.selectedMemberIds.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Pick at least one child to continue.
              </p>
            )}
          </div>
        )

      case 5: // Review & Deploy
        return (
          <div className="space-y-4">
            <div
              className="rounded-lg border p-4 space-y-3"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <ReviewRow label="Chart Name" value={state.chartName || 'Untitled Progress Chart'} />
              <ReviewRow label="Action" value={state.actionTaskName || state.chartName || 'Complete action'} />

              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Visual Trackers
                </span>
                <div className="mt-1 space-y-1">
                  {state.showStarChart && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      <Star size={12} style={{ color: 'var(--color-text-muted)' }} />
                      <span>Star chart (target: {state.starChartTarget})</span>
                    </div>
                  )}
                  {state.showColoringReveal && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      <Palette size={12} style={{ color: 'var(--color-text-muted)' }} />
                      <span>
                        Coloring reveal ({state.coloringStepCount} per page
                        {state.coloringImageSlug && `, ${state.coloringImageSlug.replace(/_/g, ' ')}`})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {state.milestones.length > 0 && (
                <div>
                  <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Milestones ({state.milestones.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {state.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        <Trophy size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <span>
                          {m.type === 'every_nth' ? `Every ${m.count}` : `At ${m.count}`}
                          {' — '}
                          {m.rewardMode === 'custom_text'
                            ? (m.customText || 'celebration')
                            : 'from rewards list'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
                  Assigned To
                </span>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {state.selectedMemberIds
                    .map((id) => familyMembers.find((m) => m.id === id)?.display_name?.split(' ')[0])
                    .filter(Boolean)
                    .join(', ') || 'No one selected'}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <SetupWizard
      id="repeated-action-chart-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Up a Progress Chart"
      subtitle="Track a repeated action with stars, coloring reveals, and milestone celebrations."
      steps={STEPS}
      currentStep={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onFinish={handleDeploy}
      finishLabel="Deploy"
      canAdvance={canAdvance}
      canFinish={canFinish}
      isFinishing={isDeploying}
      hideNav={deployed}
    >
      {renderStep()}
    </SetupWizard>
  )
}

// ─── Milestone Card Sub-Component ──────────────────────────────

function MilestoneCard({
  milestone,
  rewardsLists,
  onUpdate,
  onRemove,
}: {
  milestone: MilestoneConfig
  rewardsLists: Array<{ id: string; title: string }>
  onUpdate: (updates: Partial<MilestoneConfig>) => void
  onRemove: () => void
}) {
  return (
    <div
      className="rounded-lg border p-3 space-y-3"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium flex items-center gap-1.5"
          style={{ color: 'var(--color-text-heading)' }}
        >
          <Trophy size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
          {milestone.type === 'every_nth' ? 'Recurring milestone' : 'One-time milestone'}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {milestone.type === 'every_nth' ? 'Every' : 'At'}
        </span>
        <input
          type="number"
          min={1}
          value={milestone.count}
          onChange={(e) => onUpdate({ count: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-20 px-2 py-1 rounded-lg text-sm border"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {milestone.type === 'every_nth' ? 'completions' : 'total completions'}
        </span>
      </div>

      {/* Reward type */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ rewardMode: 'custom_text' })}
            className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: milestone.rewardMode === 'custom_text' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
              backgroundColor: milestone.rewardMode === 'custom_text' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-primary)',
              color: milestone.rewardMode === 'custom_text' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            }}
          >
            Custom reward
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ rewardMode: 'rewards_list' })}
            className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: milestone.rewardMode === 'rewards_list' ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
              backgroundColor: milestone.rewardMode === 'rewards_list' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-primary)',
              color: milestone.rewardMode === 'rewards_list' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            }}
          >
            From rewards list
          </button>
        </div>

        {milestone.rewardMode === 'custom_text' && (
          <input
            type="text"
            value={milestone.customText}
            onChange={(e) => onUpdate({ customText: e.target.value })}
            placeholder="e.g., Shopping trip for big girl underwear!"
            className="w-full px-3 py-1.5 rounded-lg text-sm border"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        )}

        {milestone.rewardMode === 'rewards_list' && (
          <select
            value={milestone.rewardsListId}
            onChange={(e) => onUpdate({ rewardsListId: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-sm border"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="">Pick a rewards list...</option>
            {rewardsLists.map((list) => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Presentation mode */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Celebration style
        </label>
        <select
          value={milestone.presentation}
          onChange={(e) => onUpdate({ presentation: e.target.value as PresentationMode })}
          className="w-full px-3 py-1.5 rounded-lg text-sm border"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="treasure_box">Treasure box reveal</option>
          <option value="reveal_animation">Animation reveal</option>
          <option value="toast">Toast notification</option>
          <option value="silent">Silent (no celebration)</option>
        </select>
      </div>
    </div>
  )
}

// ─── Review row helper ─────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
        {value}
      </p>
    </div>
  )
}
