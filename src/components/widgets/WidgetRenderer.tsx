// PRD-10: Widget Renderer — dispatches to correct tracker, info, or quick-action component
// Handles three WidgetKinds: tracker, info_display, quick_action

import { useNavigate } from 'react-router-dom'
import { Plus, StickyNote, Sparkles, BarChart3 } from 'lucide-react'
import type { DashboardWidget, WidgetDataPoint } from '@/types/widgets'
import { getWidgetKind } from '@/types/widgets'
import { TallyTracker } from './trackers/TallyTracker'
import { StreakTracker } from './trackers/StreakTracker'
import { PercentageTracker } from './trackers/PercentageTracker'
import { ChecklistTracker } from './trackers/ChecklistTracker'
import { HabitGridTracker } from './trackers/HabitGridTracker'
import { BestIntentionTracker } from './trackers/BestIntentionTracker'
import { BooleanCheckinTracker } from './trackers/BooleanCheckinTracker'
import { SequentialPathTracker } from './trackers/SequentialPathTracker'
import { AchievementBadgeTracker } from './trackers/AchievementBadgeTracker'
import { XpLevelTracker } from './trackers/XpLevelTracker'
import { AllowanceCalculatorTracker } from './trackers/AllowanceCalculatorTracker'
import { LeaderboardTracker } from './trackers/LeaderboardTracker'
import { MoodRatingTracker } from './trackers/MoodRatingTracker'
import { CountdownTracker } from './trackers/CountdownTracker'
import { TimerDurationTracker } from './trackers/TimerDurationTracker'
import { SnapshotComparisonTracker } from './trackers/SnapshotComparisonTracker'
import { RandomizerSpinnerTracker } from './trackers/RandomizerSpinnerTracker'
import { PrivilegeStatusTracker } from './trackers/PrivilegeStatusTracker'
import { PlannedTrackerStub } from './trackers/PlannedTrackerStub'
import { InfoUpcomingTasks, InfoCalendarToday, InfoRecentVictories, InfoGuidingStarsRotation, InfoQuickStats, TodayIsWidget, MenuWidget, JobBoardWidget, InfoFamilyIntention, InfoCountdown } from './info'
import { ListWidget } from './info/ListWidget'

interface WidgetRendererProps {
  widget: DashboardWidget
  dataPoints: WidgetDataPoint[]
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  onUpdateConfig?: (config: Record<string, unknown>) => void
  isCompact?: boolean
  onOpenTrackThis?: () => void
}

export function WidgetRenderer({ widget, dataPoints, onRecordData, onUpdateConfig, isCompact, onOpenTrackThis }: WidgetRendererProps) {
  const kind = getWidgetKind(widget.template_type)

  if (kind === 'info_display') {
    return <InfoWidgetDispatcher widget={widget} isCompact={isCompact} onUpdateConfig={onUpdateConfig} />
  }

  if (kind === 'quick_action') {
    return <QuickActionDispatcher widget={widget} onOpenTrackThis={onOpenTrackThis} />
  }

  // Tracker widgets
  const variant = widget.visual_variant ?? undefined

  switch (widget.template_type) {
    case 'tally':
      return <TallyTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'streak':
      return <StreakTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'percentage':
      return <PercentageTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'checklist':
      return <ChecklistTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'multi_habit_grid':
      return <HabitGridTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'boolean_checkin':
      return <BooleanCheckinTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'sequential_path':
      return <SequentialPathTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'achievement_badge':
      return <AchievementBadgeTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'xp_level':
      return <XpLevelTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'timer_duration':
      return <TimerDurationTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'allowance_calculator':
      return <AllowanceCalculatorTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'leaderboard':
      return <LeaderboardTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'mood_rating':
      return <MoodRatingTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'countdown':
      return <CountdownTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'snapshot_comparison':
      return <SnapshotComparisonTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'best_intention':
      return <BestIntentionTracker widget={widget} isCompact={isCompact} />
    case 'randomizer_spinner':
      return <RandomizerSpinnerTracker widget={widget} dataPoints={dataPoints} onRecordData={onRecordData} variant={variant} isCompact={isCompact} />
    case 'privilege_status':
      return <PrivilegeStatusTracker widget={widget} isCompact={isCompact} />
    default:
      return <PlannedTrackerStub trackerType={widget.template_type} />
  }
}

// ── Info Widget Dispatcher ──────────────────────────────────

function InfoWidgetDispatcher({ widget, isCompact, onUpdateConfig }: { widget: DashboardWidget; isCompact?: boolean; onUpdateConfig?: (config: Record<string, unknown>) => void }) {
  switch (widget.template_type) {
    case 'info_best_intentions':
      return <BestIntentionTracker widget={widget} isCompact={isCompact} />
    case 'info_upcoming_tasks':
      return <InfoUpcomingTasks widget={widget} isCompact={isCompact} />
    case 'info_calendar_today':
      return <InfoCalendarToday widget={widget} isCompact={isCompact} />
    case 'info_recent_victories':
      return <InfoRecentVictories widget={widget} isCompact={isCompact} />
    case 'info_guiding_stars_rotation':
      return <InfoGuidingStarsRotation widget={widget} isCompact={isCompact} />
    case 'info_quick_stats':
      return <InfoQuickStats widget={widget} isCompact={isCompact} />
    case 'info_today_is':
      return <TodayIsWidget widget={widget} isCompact={isCompact} />
    case 'info_hub_menu':
      return <MenuWidget widget={widget} isCompact={isCompact} onUpdateConfig={onUpdateConfig} />
    case 'info_hub_job_board':
      return <JobBoardWidget widget={widget} isCompact={isCompact} />
    case 'info_family_intention':
      return <InfoFamilyIntention widget={widget} isCompact={isCompact} />
    case 'info_countdown':
      return <InfoCountdown widget={widget} isCompact={isCompact} />
    case 'info_list':
      return <ListWidget widget={widget} isCompact={isCompact} />
    default:
      return (
        <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Unknown info widget
        </div>
      )
  }
}

// ── Quick Action Dispatcher ─────────────────────────────────

function QuickActionDispatcher({ widget, onOpenTrackThis }: { widget: DashboardWidget; onOpenTrackThis?: () => void }) {
  const navigate = useNavigate()

  const actions: Record<string, { icon: React.ReactNode; label: string; action: () => void }> = {
    action_add_task: {
      icon: <Plus size={20} />,
      label: 'Add Task',
      action: () => navigate('/tasks?new=1'),
    },
    action_mind_sweep: {
      icon: <StickyNote size={20} />,
      label: 'Mind Sweep',
      action: () => navigate('/notepad'),
    },
    action_add_intention: {
      icon: <Sparkles size={20} />,
      label: 'Add Intention',
      action: () => navigate('/best-intentions?new=1'),
    },
    action_track_this: {
      icon: <BarChart3 size={20} />,
      label: 'Track This',
      action: () => onOpenTrackThis?.(),
    },
  }

  const config = actions[widget.template_type]
  if (!config) return null

  return (
    <button
      onClick={config.action}
      className="w-full h-full flex flex-col items-center justify-center gap-2 transition-colors rounded-lg"
      style={{ background: 'transparent' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        {config.icon}
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {config.label}
      </span>
    </button>
  )
}
