import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useShell } from '@/components/shells/ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { PerspectiveSwitcher } from '@/components/shells/PerspectiveSwitcher'
import type { DashboardView } from '@/components/shells/PerspectiveSwitcher'
import { DashboardTasksSection } from '@/components/tasks/DashboardTasksSection'
import { FeatureGuide } from '@/components/shared'
import { useTasks } from '@/hooks/useTasks'
import { LogOut, Users, Star, BookOpen, CheckSquare, List, Brain, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { DashboardGrid } from '@/components/widgets/DashboardGrid'
import { FolderOverlayModal } from '@/components/widgets/FolderOverlayModal'
import { CalendarWidget } from '@/components/calendar'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import { WidgetDetailView } from '@/components/widgets/WidgetDetailView'
import { TrackThisModal } from '@/components/widgets/TrackThisModal'
import { useWidgets, useWidgetFolders, useWidgetStarterConfigs, useCreateWidget, useDeleteWidget, useUpdateWidget, useRecordWidgetData, useUpdateDashboardLayout } from '@/hooks/useWidgets'
import { useDashboardConfig, useUpdateDashboardConfig } from '@/hooks/useDashboardConfig'
import type { DashboardWidget, WidgetStarterConfig, CreateWidget, DashboardWidgetFolder, InfoDisplayType, QuickActionType } from '@/types/widgets'
import { DashboardSectionWrapper, getSections, updateSection, reorderSections } from '@/components/dashboard'
import type { SectionKey, SectionConfig } from '@/components/dashboard'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase/client'
import { PlannedExpansionCard } from '@/components/shared'

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
  const navigate = useNavigate()

  // Navigate to /hub when Family Hub perspective is selected (mom only — others see inline stub)
  useEffect(() => {
    if (perspective === 'family_hub' && member?.role === 'primary_parent') {
      navigate('/hub')
      setPerspective('personal')
    }
  }, [perspective, navigate, member?.role])

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

  const { data: widgets = [] } = useWidgets(displayFamilyId, displayMemberId)
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

  useEffect(() => {
    if (isViewAsOverlay) { setStartersChecked(true); return } // never auto-deploy in View As
    if (!displayFamilyId || !displayMemberId || startersChecked) return
    if (!dashboardConfig) return // wait for config to load
    const prefs = dashboardConfig.preferences as Record<string, unknown> | null
    if (prefs?.starters_deployed) { setStartersChecked(true); return }
    if (widgets.length > 0) { setStartersChecked(true); return }

    // Auto-deploy starter widgets
    async function deployStarters() {
      const starterWidgets: CreateWidget[] = []

      // Check if member has Guiding Stars
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

      // Check if member has Best Intentions
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

      // Always deploy Today's Victories
      starterWidgets.push({
        family_id: displayFamilyId!,
        family_member_id: displayMemberId!,
        template_type: 'info_recent_victories',
        title: "Today's Victories",
        size: 'small',
      })

      for (const w of starterWidgets) {
        createWidget.mutate(w)
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
    }

    deployStarters()
    setStartersChecked(true)
  }, [displayFamilyId, displayMemberId, dashboardConfig, widgets.length, startersChecked])

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

            {/* Quick Navigation Cards */}
            {!isViewAsOverlay && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                <NavCard to="/guiding-stars" featureKey="guiding_stars" icon={<Star size={20} />} label="Guiding Stars" color="var(--color-golden-honey, #d6a461)" />
                <NavCard to="/journal" featureKey="journal" icon={<BookOpen size={20} />} label="Journal" color="var(--color-sage-teal, #68a395)" />
                <NavCard to="/tasks" featureKey="tasks" icon={<CheckSquare size={20} />} label="Tasks" color="var(--color-deep-ocean, #2c5d60)" />
                <NavCard to="/lists" featureKey="lists" icon={<List size={20} />} label="Lists" color="var(--color-dusty-rose, #d69a84)" />
                <NavCard to="/inner-workings" featureKey="my_foundation" icon={<Brain size={20} />} label="InnerWorkings" color="var(--color-warm-earth, #5a4033)" />
                <NavCard to="/best-intentions" featureKey="best_intentions" icon={<Sparkles size={20} />} label="Best Intentions" color="var(--color-soft-gold, #f4dcb7)" textColor="var(--color-warm-earth, #5a4033)" />
              </div>
            )}
          </>
        )

      case 'calendar':
        return <CalendarWidget />

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

  // Sortable section IDs for dnd-kit
  const sortableSectionIds = activeSections
    .filter(s => s.key !== 'greeting') // greeting is pinned, not sortable
    .map(s => `section-${s.key}`)

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="density-compact max-w-4xl mx-auto space-y-4" style={{ padding: '1.25rem 1rem' }}>
      <FeatureGuide featureKey="dashboard" />

      {/* Perspective Switcher — shown on main page, hidden in View As overlay */}
      {!isViewAsOverlay && (
        <PerspectiveSwitcher activeView={perspective} onViewChange={setPerspective} />
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

      {/* ── FAMILY OVERVIEW view ── */}
      {perspective === 'family_overview' && !isViewAsOverlay && (
        <FamilyOverviewStrip
          members={familyMembers ?? []}
          currentMemberId={member?.id ?? ''}
          familyId={family?.id ?? ''}
          onViewAs={(m) => startViewAs(m, member!.id, family!.id)}
        />
      )}

      {/* ── HUB view (non-mom: inline PlannedExpansionCard) ── */}
      {perspective === 'family_hub' && !isMom && !isViewAsOverlay && (
        <PlannedExpansionCard featureKey="family_hub" />
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
        familyMembers={(familyMembers ?? []).map(m => ({ id: m.id, display_name: m.display_name, assigned_color: (m as unknown as Record<string, unknown>).assigned_color as string | null ?? null }))}
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

// ─── Family Overview: horizontal member carousel ──────────

interface FamilyOverviewStripProps {
  members: Array<{ id: string; display_name: string; role: string; member_color?: string | null }>
  currentMemberId: string
  familyId: string
  onViewAs: (member: any) => void
}

function FamilyOverviewStrip({ members, currentMemberId, familyId, onViewAs }: FamilyOverviewStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const otherMembers = members.filter(m => m.id !== currentMemberId)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  function handleMemberClick(m: typeof members[0]) {
    setSelectedMemberId(m.id === selectedMemberId ? null : m.id)
  }

  const selectedMember = members.find(m => m.id === selectedMemberId)

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hidden md:flex items-center justify-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hidden md:flex items-center justify-center"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <ChevronRight size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2 md:px-8 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {otherMembers.map((m) => {
            const isSelected = selectedMemberId === m.id
            const color = m.member_color || 'var(--color-btn-primary-bg)'
            return (
              <button
                key={m.id}
                onClick={() => handleMemberClick(m)}
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl snap-start transition-all duration-300 shrink-0 min-w-25"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, var(--color-bg-card)))`
                    : 'var(--color-bg-card)',
                  border: `2px solid ${isSelected ? color : 'var(--color-border)'}`,
                  boxShadow: isSelected
                    ? `0 4px 16px color-mix(in srgb, ${color} 30%, transparent)`
                    : '0 1px 4px rgba(0,0,0,0.05)',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : `color-mix(in srgb, ${color} 15%, var(--color-bg-card))`,
                    color: isSelected ? 'var(--color-text-on-primary, #fff)' : color,
                    border: `2px solid ${isSelected ? 'rgba(255,255,255,0.5)' : color}`,
                  }}
                >
                  {m.display_name.charAt(0)}
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{
                    color: isSelected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-heading)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {m.display_name}
                </span>
                <span
                  className="text-[10px] capitalize"
                  style={{
                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)',
                  }}
                >
                  {m.role === 'additional_adult' ? 'Adult' : m.role === 'primary_parent' ? 'Mom' : m.role}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedMember && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `2px solid ${selectedMember.member_color || 'var(--color-btn-primary-bg)'}`,
            background: 'var(--color-bg-card)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${selectedMember.member_color || 'var(--color-btn-primary-bg)'}20, transparent)`,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h3
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              {selectedMember.display_name}'s Dashboard
            </h3>
            <button
              onClick={() => onViewAs(selectedMember)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: selectedMember.member_color || 'var(--color-btn-primary-bg)',
                color: 'var(--color-text-on-primary, #fff)',
              }}
            >
              View As {selectedMember.display_name}
            </button>
          </div>
          <div className="p-4">
            <MemberTasksSection familyId={familyId} memberId={selectedMember.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function MemberTasksSection({ familyId, memberId }: { familyId: string; memberId: string }) {
  const { data: tasks = [] } = useTasks(familyId, { assigneeId: memberId })
  return (
    <DashboardTasksSection
      tasks={tasks}
      familyId={familyId}
      memberId={memberId}
    />
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

function NavCard({
  to,
  featureKey,
  icon,
  label,
  color,
  textColor,
}: {
  to: string
  featureKey: string
  icon: React.ReactNode
  label: string
  color: string
  textColor?: string
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: color + '15',
        border: `1px solid ${color}30`,
        color: textColor || color,
      }}
    >
      <FeatureIcon featureKey={featureKey} fallback={icon} size={48} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
