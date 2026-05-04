import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useShell } from '@/components/shells/ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { PerspectiveSwitcher } from '@/components/shells/PerspectiveSwitcher'
import type { DashboardView } from '@/components/shells/PerspectiveSwitcher'
import { DashboardTasksSection } from '@/components/tasks/DashboardTasksSection'
import { FeatureGuide } from '@/components/shared'
import { useTasks, type Task } from '@/hooks/useTasks'
import { useLogPractice } from '@/hooks/usePractice'
import { DurationPromptModal } from '@/components/tasks/DurationPromptModal'
import { useRoutingToast } from '@/components/shared'
import { LogOut, Users } from 'lucide-react'
import { QueueBadge } from '@/components/queue/QueueBadge'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import { DashboardGrid } from '@/components/widgets/DashboardGrid'
import { FolderOverlayModal } from '@/components/widgets/FolderOverlayModal'
import { CalendarWidget } from '@/components/calendar'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import { WidgetDetailView } from '@/components/widgets/WidgetDetailView'
import { TrackThisModal } from '@/components/widgets/TrackThisModal'
import { useQueryClient } from '@tanstack/react-query'
import { useWidgets, useWidgetFolders, useWidgetStarterConfigs, useCreateWidget, useDeleteWidget, useUpdateWidget, useRecordWidgetData, useUpdateDashboardLayout } from '@/hooks/useWidgets'
import { useDashboardConfig, useUpdateDashboardConfig } from '@/hooks/useDashboardConfig'
import type { DashboardWidget, WidgetStarterConfig, CreateWidget, DashboardWidgetFolder, InfoDisplayType, QuickActionType } from '@/types/widgets'
import { DashboardSectionWrapper, getSections, updateSection, reorderSections } from '@/components/dashboard'
import type { SectionKey, SectionConfig } from '@/components/dashboard'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase/client'
import FamilyOverview from '@/components/family-overview/FamilyOverview'
import { FamilyHub } from '@/components/hub/FamilyHub'
import { GuidedDashboard } from '@/pages/GuidedDashboard'
import { PlayDashboard } from '@/pages/PlayDashboard'
import { RhythmDashboardCard } from '@/components/rhythms/RhythmDashboardCard'
import { ColorRevealTallyWidget } from '@/components/coloring-reveal/ColorRevealTallyWidget'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useArchiveExpiredRoutines } from '@/hooks/useArchiveExpiredRoutines'

interface DashboardProps {
  /** When true, this instance is inside the ViewAsModal overlay */
  isViewAsOverlay?: boolean
}

export function Dashboard({ isViewAsOverlay }: DashboardProps = {}) {
  const { signOut } = useAuth()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const { shell: _shell } = useShell()
  const { isViewingAs, viewingAsMember, startViewAs, stopViewAs: _stopViewAs } = useViewAs()
  const [perspective, setPerspective] = useState<DashboardView>('personal')
  // PRD-14D: Hub renders INLINE on perspective tab — no navigation to /hub

  // PRD-10: Widget state
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false)
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false)
  const [selectedStarterConfig, setSelectedStarterConfig] = useState<WidgetStarterConfig | null>(null)
  const [detailWidget, setDetailWidget] = useState<DashboardWidget | null>(null)
  const [openFolder, setOpenFolder] = useState<DashboardWidgetFolder | null>(null)
  const [trackThisOpen, setTrackThisOpen] = useState(false)

  // When isViewAsOverlay=true (inside ViewAsModal), show the viewed member's data.
  // When false (main page underneath), always show mom's own data.
  const displayMemberId = (isViewAsOverlay && viewingAsMember?.id) || member?.id
  const displayFamilyId = family?.id
  useArchiveExpiredRoutines(displayFamilyId)

  const queryClient = useQueryClient()
  const { data: widgets = [], isLoading: widgetsLoading } = useWidgets(displayFamilyId, displayMemberId)
  const { data: folders = [] } = useWidgetFolders(displayFamilyId, displayMemberId)
  const { data: starterConfigs = [] } = useWidgetStarterConfigs()
  const createWidget = useCreateWidget()
  const deleteWidget = useDeleteWidget()
  const updateWidget = useUpdateWidget()
  const recordData = useRecordWidgetData()
  const updateLayout = useUpdateDashboardLayout()

  // PRD-10/14: Dashboard config
  const { data: dashboardConfig } = useDashboardConfig(displayFamilyId, displayMemberId, 'personal')
  const updateDashboardConfig = useUpdateDashboardConfig()

  // PRD-17: Queue pending counts for badge (PRD-15: filtered by recipient for requests)
  const pendingCounts = usePendingCounts(displayFamilyId, displayMemberId)

  // Build M Phase 5: Coloring reveal tally widgets for gamification opt-in
  const { data: gamConfig } = useGamificationConfig(displayMemberId)
  const { data: colorReveals = [] } = useMemberColoringReveals(
    gamConfig?.enabled ? displayMemberId : undefined,
  )
  const taskLinkedReveals = useMemo(
    () => colorReveals.filter(r => r.earning_source_id && !r.is_complete && r.is_active),
    [colorReveals],
  )
  // Fetch tasks for linked reveals (lightweight — only when reveals exist)
  const { data: revealLinkedTasks = [] } = useTasks(
    taskLinkedReveals.length > 0 ? displayFamilyId : undefined,
    { assigneeId: displayMemberId },
  )

  // ─── PRD-14: Section system ────────────────────────────────

  const sections = useMemo(
    () => getSections(dashboardConfig?.layout),
    [dashboardConfig?.layout]
  )

  // Local optimistic sections state for immediate UI feedback
  const [localSections, setLocalSections] = useState<SectionConfig[] | null>(null)
  const activeSections = localSections ?? sections

  // Edit mode for sections (triggered by long-press)
  const [isSectionEditMode, setIsSectionEditMode] = useState(false)
  const sectionLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const saveSections = useCallback((updated: SectionConfig[]) => {
    if (!displayFamilyId || !displayMemberId) return
    const currentLayout = (dashboardConfig?.layout ?? {}) as Record<string, unknown>
    updateDashboardConfig.mutate({
      familyId: displayFamilyId,
      memberId: displayMemberId,
      dashboardType: 'personal',
      layout: { ...currentLayout, sections: updated },
    })
  }, [dashboardConfig?.layout, displayFamilyId, displayMemberId, updateDashboardConfig])

  const handleToggleCollapse = useCallback((key: SectionKey) => {
    const current = localSections ?? sections
    const section = current.find(s => s.key === key)
    if (!section) return
    const updated = updateSection(current, key, { collapsed: !section.collapsed })
    setLocalSections(updated)
    saveSections(updated)
  }, [localSections, sections, saveSections])

  const handleToggleVisibility = useCallback((key: SectionKey) => {
    const current = localSections ?? sections
    const section = current.find(s => s.key === key)
    if (!section) return
    const updated = updateSection(current, key, { visible: !section.visible })
    setLocalSections(updated)
    saveSections(updated)
  }, [localSections, sections, saveSections])

  const handleSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeKey = String(active.id).replace('section-', '') as SectionKey
    const overKey = String(over.id).replace('section-', '') as SectionKey
    const current = localSections ?? sections
    const updated = reorderSections(current, activeKey, overKey)
    setLocalSections(updated)
    saveSections(updated)
    // Switch to manual layout mode on first reorder
    if (dashboardConfig?.layout_mode !== 'manual') {
      handleLayoutModeChange('manual')
    }
  }, [localSections, sections, saveSections, dashboardConfig?.layout_mode])

  const handleSectionLongPressStart = useCallback(() => {
    if (isViewingAs && member?.role !== 'primary_parent') return
    sectionLongPressTimer.current = setTimeout(() => {
      setIsSectionEditMode(true)
    }, 600)
  }, [isViewingAs, member?.role])

  const handleSectionLongPressEnd = useCallback(() => {
    if (sectionLongPressTimer.current) {
      clearTimeout(sectionLongPressTimer.current)
      sectionLongPressTimer.current = null
    }
  }, [])

  // Sync local sections when DB data arrives
  useEffect(() => {
    setLocalSections(null)
  }, [dashboardConfig?.layout])

  // ─── PRD-14: Guiding Stars greeting rotation ──────────────

  const [guidingStars, setGuidingStars] = useState<Array<{ id: string; content: string }>>([])
  const [activeStarIndex, setActiveStarIndex] = useState(0)
  const [starFading, setStarFading] = useState(false)
  const starTimerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (!displayFamilyId || !displayMemberId) return
    supabase
      .from('guiding_stars')
      .select('id, content')
      .eq('family_id', displayFamilyId)
      .eq('member_id', displayMemberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setGuidingStars(data) })
  }, [displayFamilyId, displayMemberId])

  const rotationInterval = ((dashboardConfig?.preferences as Record<string, unknown> | null)?.greeting_rotation_interval_seconds as number) || 30

  useEffect(() => {
    if (guidingStars.length <= 1) return
    starTimerRef.current = setInterval(() => {
      setStarFading(true)
      setTimeout(() => {
        setActiveStarIndex(prev => (prev + 1) % guidingStars.length)
        setStarFading(false)
      }, 400) // fade out duration
    }, rotationInterval * 1000)
    return () => clearInterval(starTimerRef.current)
  }, [guidingStars.length, rotationInterval])

  // ─── PRD-14: Starter widget auto-deploy ────────────────────

  const [startersChecked, setStartersChecked] = useState(false)

  // Ref to prevent concurrent deploys — survives across renders unlike state
  const deployingRef = useRef(false)

  useEffect(() => {
    if (isViewAsOverlay) { setStartersChecked(true); return }
    if (!displayFamilyId || !displayMemberId || startersChecked) return
    if (!dashboardConfig) return
    if (widgetsLoading) return
    const prefs = dashboardConfig.preferences as Record<string, unknown> | null
    if (prefs?.starters_deployed) { setStartersChecked(true); return }
    if (widgets.length > 0) { setStartersChecked(true); return }
    // Guard against concurrent runs
    if (deployingRef.current) return
    deployingRef.current = true
    setStartersChecked(true) // Set immediately to prevent any re-trigger

    async function deployStarters() {
      // Double-check DB to prevent duplicates if flag wasn't persisted
      const { count: existingCount } = await supabase
        .from('dashboard_widgets')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', displayFamilyId!)
        .eq('family_member_id', displayMemberId!)
        .is('archived_at', null)
        .eq('is_on_dashboard', true)

      if ((existingCount ?? 0) > 0) {
        deployingRef.current = false
        return
      }

      const starterWidgets: CreateWidget[] = []

      const { count: gsCount } = await supabase
        .from('guiding_stars')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', displayFamilyId!)
        .eq('member_id', displayMemberId!)
        .is('archived_at', null)

      if ((gsCount ?? 0) > 0) {
        starterWidgets.push({
          family_id: displayFamilyId!,
          family_member_id: displayMemberId!,
          template_type: 'info_guiding_stars_rotation',
          title: 'Guiding Stars',
          size: 'small',
        })
      }

      const { count: biCount } = await supabase
        .from('best_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', displayFamilyId!)
        .eq('member_id', displayMemberId!)
        .eq('is_active', true)
        .is('archived_at', null)

      if ((biCount ?? 0) > 0) {
        starterWidgets.push({
          family_id: displayFamilyId!,
          family_member_id: displayMemberId!,
          template_type: 'info_best_intentions',
          title: 'Best Intentions',
          size: 'medium',
        })
      }

      starterWidgets.push({
        family_id: displayFamilyId!,
        family_member_id: displayMemberId!,
        template_type: 'info_recent_victories',
        title: "Today's Victories",
        size: 'small',
      })

      // Insert sequentially with await to avoid race conditions
      for (const w of starterWidgets) {
        await supabase.from('dashboard_widgets').insert({
          ...w,
          size: w.size ?? 'medium',
          position_x: 0,
          position_y: 0,
          widget_config: {},
          data_source_ids: [],
        })
      }

      // Mark starters as deployed
      const currentLayout = (dashboardConfig?.layout ?? {}) as Record<string, unknown>
      const currentPrefs = (dashboardConfig?.preferences ?? {}) as Record<string, unknown>
      updateDashboardConfig.mutate({
        familyId: displayFamilyId!,
        memberId: displayMemberId!,
        dashboardType: 'personal',
        layout: { ...currentLayout, sections: sections },
        preferences: { ...currentPrefs, starters_deployed: true },
      })

      // Refresh widget list
      queryClient.invalidateQueries({ queryKey: ['widgets', displayFamilyId, displayMemberId] })
      deployingRef.current = false
    }

    deployStarters()
  }, [displayFamilyId, displayMemberId, dashboardConfig, widgetsLoading, startersChecked])

  // ─── Responsive grid columns ───────────────────────────────

  useEffect(() => {
    const savedCols = dashboardConfig?.preferences?.grid_columns
    if (savedCols) {
      document.documentElement.style.setProperty('--grid-cols', String(savedCols))
      return
    }
    function applyResponsiveCols() {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        document.documentElement.style.setProperty('--grid-cols', '4')
      } else if (window.matchMedia('(min-width: 768px)').matches) {
        document.documentElement.style.setProperty('--grid-cols', '3')
      } else {
        document.documentElement.style.setProperty('--grid-cols', '2')
      }
    }
    applyResponsiveCols()
    window.addEventListener('resize', applyResponsiveCols)
    return () => window.removeEventListener('resize', applyResponsiveCols)
  }, [dashboardConfig?.preferences?.grid_columns])

  // ─── Widget handlers ───────────────────────────────────────

  const dataPointsByWidget: Record<string, import('@/types/widgets').WidgetDataPoint[]> = {}

  const handleSelectStarterConfig = useCallback((config: WidgetStarterConfig) => {
    setSelectedStarterConfig(config)
    setWidgetPickerOpen(false)
    setWidgetConfigOpen(true)
  }, [])

  const handleAddInfoWidget = useCallback((type: InfoDisplayType) => {
    if (!displayFamilyId || !displayMemberId) return
    const sizeMap: Record<string, 'small' | 'medium'> = {
      info_guiding_stars_rotation: 'small',
      info_quick_stats: 'small',
    }
    const labelMap: Record<string, string> = {
      info_best_intentions: 'Best Intentions',
      info_upcoming_tasks: 'Upcoming Tasks',
      info_calendar_today: 'Calendar Today',
      info_recent_victories: 'Recent Victories',
      info_guiding_stars_rotation: 'Guiding Stars',
      info_quick_stats: 'Quick Stats',
    }
    createWidget.mutate({
      family_id: displayFamilyId,
      family_member_id: displayMemberId,
      template_type: type,
      title: labelMap[type] ?? type,
      size: sizeMap[type] ?? 'medium',
    })
    setWidgetPickerOpen(false)
  }, [createWidget, displayFamilyId, displayMemberId])

  const handleAddQuickAction = useCallback((type: QuickActionType) => {
    if (!displayFamilyId || !displayMemberId) return
    const labelMap: Record<string, string> = {
      action_add_task: 'Quick Add Task',
      action_mind_sweep: 'Quick Mind Sweep',
      action_add_intention: 'Quick Add Intention',
      action_track_this: 'Track This',
    }
    createWidget.mutate({
      family_id: displayFamilyId,
      family_member_id: displayMemberId,
      template_type: type,
      title: labelMap[type] ?? type,
      size: 'small',
    })
    setWidgetPickerOpen(false)
  }, [createWidget, displayFamilyId, displayMemberId])

  const handleDeployWidget = useCallback((widget: CreateWidget) => {
    createWidget.mutate(widget)
    setWidgetConfigOpen(false)
    setSelectedStarterConfig(null)
  }, [createWidget])

  const handleUpdateLayout = useCallback(
    (updates: { id: string; position_x: number; position_y: number; sort_order: number }[]) => {
      updateLayout.mutate(updates)
    },
    [updateLayout]
  )

  const handleLayoutModeChange = useCallback(
    (mode: 'auto' | 'manual') => {
      if (!displayFamilyId || !displayMemberId) return
      updateDashboardConfig.mutate({
        familyId: displayFamilyId,
        memberId: displayMemberId,
        dashboardType: 'personal',
        layoutMode: mode,
      })
    },
    [updateDashboardConfig, displayFamilyId, displayMemberId]
  )

  const handleRecordData = useCallback((widgetId: string, value: number, metadata?: Record<string, unknown>) => {
    if (!displayFamilyId || !displayMemberId) return
    recordData.mutate({
      family_id: displayFamilyId,
      widget_id: widgetId,
      family_member_id: displayMemberId,
      value,
      metadata,
    })
  }, [recordData, displayFamilyId, displayMemberId])

  // ─── Derived state ─────────────────────────────────────────

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const displayMember = isViewAsOverlay && viewingAsMember ? viewingAsMember : member
  const otherMembers = familyMembers?.filter((m) => m.id !== member?.id) ?? []
  const hasFamily = otherMembers.length > 0
  const isMom = member?.role === 'primary_parent'

  const currentStar = guidingStars[activeStarIndex]

  // ─── Section content renderers ─────────────────────────────

  function renderSectionContent(key: SectionKey) {
    switch (key) {
      case 'greeting':
        return (
          <>
            {/* Greeting header — never collapsible */}
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-display, var(--font-heading))' }}
                >
                  {greeting}, {displayMember?.display_name ?? 'there'}
                </h1>
                {/* PRD-14: Rotating Guiding Stars declaration */}
                {currentStar && (
                  <p
                    className="text-sm mt-1 transition-opacity duration-400"
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-body, var(--font-sans))',
                      fontStyle: 'italic',
                      opacity: starFading ? 0 : 1,
                    }}
                  >
                    "{currentStar.content}"
                  </p>
                )}
              </div>
              {!isViewAsOverlay && (
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              )}
            </div>

            {/* Family Setup Prompt */}
            {isMom && !hasFamily && !isViewAsOverlay && (
              <div
                className="p-5 rounded-xl border-2 border-dashed mt-3"
                style={{
                  borderColor: 'var(--color-sage-teal, #68a395)',
                  backgroundColor: 'var(--color-soft-sage, #d4e3d9)',
                }}
              >
                <div className="flex items-start gap-3">
                  <Users size={24} style={{ color: 'var(--color-sage-teal, #68a395)' }} className="mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-warm-earth, #5a4033)' }}>
                      Tell us about your family
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-warm-earth, #5a4033)', opacity: 0.7 }}>
                      Describe your family in your own words, and we'll set up everyone's accounts.
                      Or add members one at a time.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/family-setup"
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                        style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
                      >
                        Set Up My Family
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nav cards removed — redundant with sidebar navigation */}
          </>
        )

      // PRD-18: rhythm cards render OUTSIDE the section loop at position 0
      // (above the greeting section). See the JSX below for direct rendering.
      // They're truly auto-managed — never appear in the user's saved layout,
      // never reorderable, never hideable. The card itself self-hides when
      // outside its time window AND has no completion record.

      case 'calendar':
        return <CalendarWidget personalMemberId={displayMemberId} />

      case 'active_tasks':
        return family?.id && displayMember?.id ? (
          <MemberTasksSection familyId={family.id} memberId={displayMember.id} />
        ) : null

      case 'widget_grid':
        return family?.id && displayMember?.id ? (
          <DashboardGrid
            widgets={widgets}
            folders={folders}
            dataPointsByWidget={dataPointsByWidget}
            onRecordData={handleRecordData}
            onOpenWidgetPicker={() => setWidgetPickerOpen(true)}
            onOpenWidgetDetail={(w) => setDetailWidget(w)}
            onOpenWidgetConfig={(w) => {
              const starter: WidgetStarterConfig = {
                id: w.id,
                tracker_type: w.template_type,
                visual_variant: w.visual_variant ?? '',
                config_name: w.title,
                description: null,
                category: null,
                default_config: w.widget_config,
                is_example: false,
                sort_order: 0,
                created_at: w.created_at,
                updated_at: w.updated_at,
              }
              setSelectedStarterConfig(starter)
              setWidgetConfigOpen(true)
            }}
            onOpenFolder={(folder) => setOpenFolder(folder)}
            onRemoveWidget={(id) => deleteWidget.mutate({ id, familyId: family!.id })}
            onResizeWidget={(id, size) => updateWidget.mutate({ id, size })}
            onUpdateLayout={handleUpdateLayout}
            canEdit={isMom || !isViewAsOverlay}
            canReorderOnly={false}
            layoutMode={dashboardConfig?.layout_mode ?? 'auto'}
            onLayoutModeChange={handleLayoutModeChange}
          />
        ) : null

      default:
        return null
    }
  }

  // Sortable section IDs for dnd-kit — greeting is pinned, not sortable.
  // Rhythm cards render outside this loop entirely (PRD-18 auto-managed).
  const sortableSectionIds = activeSections
    .filter(s => s.key !== 'greeting')
    .map(s => `section-${s.key}`)

  // ─── PRD-25: Route Guided members to GuidedDashboard ──────
  const memberDashboardMode = (displayMember as Record<string, unknown> | undefined)?.dashboard_mode as string | undefined
  const isGuidedMember = memberDashboardMode === 'guided'
  const isPlayMember = memberDashboardMode === 'play'

  if (isGuidedMember) {
    return <GuidedDashboard isViewAsOverlay={isViewAsOverlay} />
  }

  // ─── PRD-26 (Build M Sub-phase B): Route Play members to PlayDashboard ──
  if (isPlayMember && displayMember?.id && family?.id) {
    return (
      <PlayDashboard
        memberId={displayMember.id}
        familyId={family.id}
        isViewAsOverlay={isViewAsOverlay}
      />
    )
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="density-compact max-w-4xl mx-auto space-y-4" style={{ padding: '1.25rem 1rem' }}>
      <FeatureGuide featureKey="dashboard" />

      {/* Perspective Switcher — shown on main page, hidden in View As overlay */}
      {!isViewAsOverlay && (
        <div className="flex items-center justify-between gap-3">
          <PerspectiveSwitcher activeView={perspective} onViewChange={setPerspective} />
          {/* PRD-17: Queue badge — opens Review Queue modal */}
          {member?.role === 'primary_parent' && (
            <QueueBadge
              count={pendingCounts.total}
              label="Review"
              compact
            />
          )}
        </div>
      )}

      {/* ── PERSONAL DASHBOARD view ── */}
      {perspective === 'personal' && (
        <div
          onPointerDown={handleSectionLongPressStart}
          onPointerUp={handleSectionLongPressEnd}
          onPointerLeave={handleSectionLongPressEnd}
          className="space-y-4"
        >
          {/* Section edit mode banner */}
          {isSectionEditMode && (
            <div
              className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 rounded-lg"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <span className="text-sm font-medium">Editing layout — drag to reorder</span>
              <button
                onClick={() => setIsSectionEditMode(false)}
                className="px-3 py-1 rounded-lg text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Render sections in data-driven order */}
          <DndContext
            sensors={sectionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext items={sortableSectionIds} strategy={verticalListSortingStrategy}>
              {/* PRD-18: rhythm cards render at position 0, above all other
                  sections. Auto-managed — never appear in the user's saved
                  layout, never reorderable, never hideable. Each card self-
                  hides when outside its time window AND has no completion. */}
              {family?.id && displayMember?.id && (
                <>
                  <RhythmDashboardCard
                    familyId={family.id}
                    memberId={displayMember.id}
                    rhythmKey="morning"
                  />
                  {/* Adults + independents only — guided/play kids render
                      their own evening rhythm card inside GuidedDashboard. */}
                  {memberDashboardMode !== 'guided' && memberDashboardMode !== 'play' && (
                    <RhythmDashboardCard
                      familyId={family.id}
                      memberId={displayMember.id}
                      rhythmKey="evening"
                    />
                  )}
                </>
              )}

              {/* Build M Phase 5: Coloring reveal tally widgets (gamification opt-in) */}
              {taskLinkedReveals.map(reveal => (
                <ColorRevealTallyWidget
                  key={reveal.id}
                  reveal={reveal}
                  linkedTask={revealLinkedTasks.find(t => t.id === reveal.earning_source_id)}
                  memberId={displayMemberId ?? ''}
                />
              ))}

              {activeSections.map((section) => {
                // Greeting: always rendered, no wrapper needed for collapse/edit
                if (section.key === 'greeting') {
                  if (!section.visible && !isSectionEditMode) return null
                  return (
                    <div key={section.key}>
                      {renderSectionContent('greeting')}
                    </div>
                  )
                }

                return (
                  <DashboardSectionWrapper
                    key={section.key}
                    sectionKey={section.key}
                    collapsed={section.collapsed}
                    visible={section.visible}
                    isEditMode={isSectionEditMode}
                    onToggleCollapse={() => handleToggleCollapse(section.key)}
                    onToggleVisibility={() => handleToggleVisibility(section.key)}
                  >
                    {renderSectionContent(section.key)}
                  </DashboardSectionWrapper>
                )
              })}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ── FAMILY OVERVIEW view (PRD-14C) ── */}
      {perspective === 'family_overview' && !isViewAsOverlay && (
        <FamilyOverview />
      )}

      {/* ── HUB view: inline FamilyHub for all roles ── */}
      {perspective === 'family_hub' && !isViewAsOverlay && (
        <FamilyHub context="tab" />
      )}

      {/* ── VIEW AS tab: inline member picker ── */}
      {perspective === 'view_as' && !isViewAsOverlay && (
        <ViewAsMemberPills
          members={familyMembers ?? []}
          currentMemberId={member?.id ?? ''}
          onSelect={(m) => startViewAs(m, member!.id, family!.id)}
        />
      )}

      {/* PRD-10: Widget Picker Modal */}
      <WidgetPicker
        isOpen={widgetPickerOpen}
        onClose={() => setWidgetPickerOpen(false)}
        starterConfigs={starterConfigs}
        onSelectStarterConfig={handleSelectStarterConfig}
        onAddInfoWidget={handleAddInfoWidget}
        onAddQuickAction={handleAddQuickAction}
        onOpenTrackThis={() => { setWidgetPickerOpen(false); setTrackThisOpen(true) }}
      />

      {/* PRD-10: Widget Configuration Modal */}
      <WidgetConfiguration
        isOpen={widgetConfigOpen}
        onClose={() => { setWidgetConfigOpen(false); setSelectedStarterConfig(null) }}
        starterConfig={selectedStarterConfig}
        familyId={family?.id ?? ''}
        memberId={member?.id ?? ''}
        familyMembers={(familyMembers ?? []).map(m => ({ id: m.id, display_name: m.display_name, assigned_color: (m as unknown as Record<string, unknown>).assigned_color as string | null ?? null, member_color: (m as unknown as Record<string, unknown>).member_color as string | null ?? null }))}
        onDeploy={handleDeployWidget}
      />

      {/* PRD-10 B-2: Track This Modal */}
      <TrackThisModal
        isOpen={trackThisOpen}
        onClose={() => setTrackThisOpen(false)}
        familyId={family?.id ?? ''}
        memberId={member?.id ?? ''}
        familyMembers={(familyMembers ?? []).map(m => ({ id: m.id, display_name: m.display_name }))}
        onDeploy={handleDeployWidget}
      />

      {/* PRD-10: Widget Detail View Modal */}
      {detailWidget && (
        <WidgetDetailView
          widget={detailWidget}
          isOpen={!!detailWidget}
          onClose={() => setDetailWidget(null)}
          onRecordData={(v, m) => handleRecordData(detailWidget.id, v, m)}
          onEdit={() => {}}
          onRemove={() => {
            deleteWidget.mutate({ id: detailWidget.id, familyId: family!.id })
            setDetailWidget(null)
          }}
        />
      )}

      {/* PRD-10: Folder Overlay Modal */}
      <FolderOverlayModal
        isOpen={!!openFolder}
        onClose={() => setOpenFolder(null)}
        folder={openFolder}
        widgets={openFolder ? widgets.filter(w => w.folder_id === openFolder.id) : []}
        dataPointsByWidget={dataPointsByWidget}
        onRecordData={handleRecordData}
        onOpenWidgetDetail={(w) => { setOpenFolder(null); setDetailWidget(w) }}
        onRemoveWidget={(id) => { deleteWidget.mutate({ id, familyId: family!.id }); setOpenFolder(null) }}
        onResizeWidget={(id, size) => updateWidget.mutate({ id, size })}
      />
    </div>
  )
}

function MemberTasksSection({ familyId, memberId }: { familyId: string; memberId: string }) {
  const { data: tasks = [] } = useTasks(familyId, { assigneeId: memberId })
  const logPractice = useLogPractice()
  const routingToast = useRoutingToast()
  const [durationTask, setDurationTask] = useState<Task | null>(null)

  const handleWorkedOnThis = useCallback((task: Task) => {
    if (task.track_duration) {
      setDurationTask(task)
    } else {
      logPractice.mutate({
        familyId,
        familyMemberId: memberId,
        sourceType: 'task',
        sourceId: task.id,
        durationMinutes: null,
      }, {
        onSuccess: () => routingToast.show({ message: `Session logged for "${task.title}"` }),
      })
    }
  }, [familyId, memberId, logPractice, routingToast])

  return (
    <>
      <DashboardTasksSection
        tasks={tasks}
        familyId={familyId}
        memberId={memberId}
        onWorkedOnThis={handleWorkedOnThis}
      />
      <DurationPromptModal
        isOpen={!!durationTask}
        onClose={() => setDurationTask(null)}
        onSubmit={(mins) => {
          if (!durationTask) return
          const taskTitle = durationTask.title
          logPractice.mutate({
            familyId,
            familyMemberId: memberId,
            sourceType: 'task',
            sourceId: durationTask.id,
            durationMinutes: mins,
          }, {
            onSuccess: () => {
              const durationText = mins ? ` (${mins >= 60 ? `${Math.round(mins / 60)} hr` : `${mins} min`})` : ''
              routingToast.show({ message: `Session logged for "${taskTitle}"${durationText}` })
            },
          })
          setDurationTask(null)
        }}
        taskTitle={durationTask?.title}
      />
    </>
  )
}

/** PRD-14D: Inline member picker for View As tab — colored pill buttons */
function ViewAsMemberPills({
  members,
  currentMemberId,
  onSelect,
}: {
  members: Array<{ id: string; display_name: string; role: string; member_color?: string | null; is_active?: boolean; out_of_nest?: boolean }>
  currentMemberId: string
  onSelect: (member: any) => void
}) {
  const pickable = members.filter(
    m => m.id !== currentMemberId && m.is_active !== false && !m.out_of_nest
  )

  return (
    <div className="space-y-4">
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Choose a family member to see their dashboard experience:
      </p>
      <div className="flex flex-wrap gap-2">
        {pickable.map(m => {
          const color = m.member_color || 'var(--color-btn-primary-bg)'
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 15%, var(--color-bg-card))`,
                border: `2px solid ${color}`,
                color: color,
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: color,
                  color: 'var(--color-text-on-primary, #fff)',
                }}
              >
                {m.display_name.charAt(0)}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {m.display_name}
              </span>
            </button>
          )
        })}
      </div>
      {pickable.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No family members to view as. Add members from Settings.
        </p>
      )}
    </div>
  )
}

