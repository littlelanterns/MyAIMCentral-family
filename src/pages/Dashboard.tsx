import { useState, useRef, useCallback, useEffect } from 'react'
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
import { WidgetPicker } from '@/components/widgets/WidgetPicker'
import { WidgetConfiguration } from '@/components/widgets/WidgetConfiguration'
import { WidgetDetailView } from '@/components/widgets/WidgetDetailView'
import { useWidgets, useWidgetFolders, useWidgetStarterConfigs, useCreateWidget, useDeleteWidget, useUpdateWidget, useRecordWidgetData } from '@/hooks/useWidgets'
import type { DashboardWidget, WidgetStarterConfig, CreateWidget } from '@/types/widgets'

export function Dashboard() {
  const { signOut } = useAuth()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const { shell: _shell } = useShell()
  const { isViewingAs, viewingAsMember, startViewAs, stopViewAs: _stopViewAs } = useViewAs()
  const [perspective, setPerspective] = useState<DashboardView>('personal')
  const navigate = useNavigate()

  // Navigate to /hub when Family Hub perspective is selected
  useEffect(() => {
    if (perspective === 'family_hub') {
      navigate('/hub')
      setPerspective('personal') // Reset so returning to dashboard shows personal view
    }
  }, [perspective, navigate])

  // PRD-10: Widget state
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false)
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false)
  const [selectedStarterConfig, setSelectedStarterConfig] = useState<WidgetStarterConfig | null>(null)
  const [detailWidget, setDetailWidget] = useState<DashboardWidget | null>(null)

  const displayMemberId = (isViewingAs && viewingAsMember?.id) || member?.id
  const displayFamilyId = family?.id

  const { data: widgets = [] } = useWidgets(displayFamilyId, displayMemberId)
  const { data: folders = [] } = useWidgetFolders(displayFamilyId, displayMemberId)
  const { data: starterConfigs = [] } = useWidgetStarterConfigs()
  const createWidget = useCreateWidget()
  const deleteWidget = useDeleteWidget()
  const updateWidget = useUpdateWidget()
  const recordData = useRecordWidgetData()

  // Data points fetched per-widget via detail view; grid shows computed state from widget_config
  const dataPointsByWidget: Record<string, import('@/types/widgets').WidgetDataPoint[]> = {}

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

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  // When viewing as someone, show THEIR name and THEIR data
  const displayMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const otherMembers = familyMembers?.filter((m) => m.id !== member?.id) ?? []
  const hasFamily = otherMembers.length > 0
  const isMom = member?.role === 'primary_parent'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FeatureGuide featureKey="dashboard" />

      {/* Perspective Switcher — Mom only, personal dashboard view */}
      {isMom && !isViewingAs && (
        <PerspectiveSwitcher activeView={perspective} onViewChange={setPerspective} />
      )}

      {/* Header — shows the viewed member's name when in View As mode */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {greeting}, {displayMember?.display_name ?? 'there'}
          </h1>
        </div>
        {!isViewingAs && (
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

      {/* ── PERSONAL DASHBOARD view ── */}
      {(perspective === 'personal' || isViewingAs) && (
        <>
          {/* Family Setup Prompt — PRD-01: Shows when no other family members exist */}
          {isMom && !hasFamily && !isViewingAs && (
            <div
              className="p-5 rounded-xl border-2 border-dashed"
              style={{
                borderColor: 'var(--color-sage-teal, #68a395)',
                backgroundColor: 'var(--color-soft-sage, #d4e3d9)',
              }}
            >
              <div className="flex items-start gap-3">
                <Users size={24} style={{ color: 'var(--color-sage-teal, #68a395)' }} className="mt-0.5 flex-shrink-0" />
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

          {/* Quick Navigation Cards — only on mom's own dashboard, not when viewing as */}
          {!isViewingAs && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NavCard to="/guiding-stars" featureKey="guiding_stars" icon={<Star size={20} />} label="Guiding Stars" color="var(--color-golden-honey, #d6a461)" />
              <NavCard to="/journal" featureKey="journal" icon={<BookOpen size={20} />} label="Journal" color="var(--color-sage-teal, #68a395)" />
              <NavCard to="/tasks" featureKey="tasks" icon={<CheckSquare size={20} />} label="Tasks" color="var(--color-deep-ocean, #2c5d60)" />
              <NavCard to="/lists" featureKey="lists" icon={<List size={20} />} label="Lists" color="var(--color-dusty-rose, #d69a84)" />
              <NavCard to="/inner-workings" featureKey="my_foundation" icon={<Brain size={20} />} label="InnerWorkings" color="var(--color-warm-earth, #5a4033)" />
              <NavCard to="/best-intentions" featureKey="best_intentions" icon={<Sparkles size={20} />} label="Best Intentions" color="var(--color-soft-gold, #f4dcb7)" textColor="var(--color-warm-earth, #5a4033)" />
            </div>
          )}

          {/* Dashboard Tasks Section — shows tasks for the viewed member */}
          {family?.id && displayMember?.id && (
            <MemberTasksSection familyId={family.id} memberId={displayMember.id} />
          )}

          {/* PRD-10: Widget Dashboard Grid */}
          {family?.id && displayMember?.id && (
            <div className="mt-6">
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Trackers & Widgets
              </h2>
              <DashboardGrid
                widgets={widgets}
                folders={folders}
                dataPointsByWidget={dataPointsByWidget}
                onRecordData={handleRecordData}
                onOpenWidgetPicker={() => setWidgetPickerOpen(true)}
                onOpenWidgetDetail={(w) => setDetailWidget(w)}
                onOpenWidgetConfig={() => {}}
                onOpenFolder={() => {}}
                onRemoveWidget={(id) => deleteWidget.mutate({ id, familyId: family!.id })}
                onResizeWidget={(id, size) => updateWidget.mutate({ id, size })}
                canEdit={isMom || !isViewingAs}
                canReorderOnly={false}
              />
            </div>
          )}
        </>
      )}

      {/* ── FAMILY OVERVIEW view — horizontal member carousel ── */}
      {perspective === 'family_overview' && !isViewingAs && isMom && (
        <FamilyOverviewStrip
          members={familyMembers ?? []}
          currentMemberId={member?.id ?? ''}
          familyId={family?.id ?? ''}
          onViewAs={(m) => startViewAs(m, member!.id, family!.id)}
        />
      )}

      {/* Family Hub — navigates to /hub via useEffect above */}

      {/* PRD-10: Widget Picker Modal */}
      <WidgetPicker
        isOpen={widgetPickerOpen}
        onClose={() => setWidgetPickerOpen(false)}
        starterConfigs={starterConfigs}
        onSelectStarterConfig={handleSelectStarterConfig}
      />

      {/* PRD-10: Widget Configuration Modal */}
      <WidgetConfiguration
        isOpen={widgetConfigOpen}
        onClose={() => { setWidgetConfigOpen(false); setSelectedStarterConfig(null) }}
        starterConfig={selectedStarterConfig}
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
      {/* Scrollable member strip */}
      <div className="relative">
        {/* Scroll arrows */}
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
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl snap-start transition-all duration-300 flex-shrink-0 min-w-[100px]"
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

      {/* Selected member detail — their tasks + View As button */}
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

          {/* Their tasks */}
          <div className="p-4">
            <MemberTasksSection familyId={familyId} memberId={selectedMember.id} />
          </div>
        </div>
      )}
    </div>
  )
}

/** Fetches tasks for a specific member and renders DashboardTasksSection */
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
