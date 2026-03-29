// PRD-10: Widget Renderer — dispatches to correct tracker type component
// Widgets are portable: render identically regardless of host dashboard.
// Props: themeTokens via CSS vars, widgetConfig, dataSource.

import type { DashboardWidget, WidgetDataPoint } from '@/types/widgets'
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
import { PlannedTrackerStub } from './trackers/PlannedTrackerStub'

interface WidgetRendererProps {
  widget: DashboardWidget
  dataPoints: WidgetDataPoint[]
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  isCompact?: boolean // true when rendered in folder or small size
}

export function WidgetRenderer({ widget, dataPoints, onRecordData, isCompact }: WidgetRendererProps) {
  const variant = widget.visual_variant ?? undefined

  switch (widget.template_type) {
    case 'tally':
      return (
        <TallyTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'streak':
      return (
        <StreakTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'percentage':
      return (
        <PercentageTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'checklist':
      return (
        <ChecklistTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'multi_habit_grid':
      return (
        <HabitGridTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'boolean_checkin':
      return (
        <BooleanCheckinTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'sequential_path':
      return (
        <SequentialPathTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'achievement_badge':
      return (
        <AchievementBadgeTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'xp_level':
      return (
        <XpLevelTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'timer_duration':
      return (
        <TimerDurationTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'allowance_calculator':
      return (
        <AllowanceCalculatorTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'leaderboard':
      return (
        <LeaderboardTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'mood_rating':
      return (
        <MoodRatingTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'countdown':
      return (
        <CountdownTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'snapshot_comparison':
      return (
        <SnapshotComparisonTracker
          widget={widget}
          dataPoints={dataPoints}
          onRecordData={onRecordData}
          variant={variant}
          isCompact={isCompact}
        />
      )
    case 'best_intention':
      return (
        <BestIntentionTracker
          widget={widget}
          isCompact={isCompact}
        />
      )
    default:
      return <PlannedTrackerStub trackerType={widget.template_type} />
  }
}
