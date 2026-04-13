// PRD-10: Widget & Tracker type definitions

// ============================================================
// Tracker Types — the data engines (17 total, 6 in Phase A)
// ============================================================

export type TrackerType =
  | 'tally'
  | 'streak'
  | 'percentage'
  | 'checklist'
  | 'multi_habit_grid'
  | 'boolean_checkin'
  | 'sequential_path'
  | 'achievement_badge'
  | 'xp_level'
  | 'allowance_calculator'
  | 'leaderboard'
  | 'mood_rating'
  | 'countdown'
  | 'timer_duration'
  | 'snapshot_comparison'
  | 'color_reveal'
  | 'gameboard'
  | 'randomizer_spinner'
  | 'privilege_status'

// Phase A tracker types
export type PhaseATrackerType = 'tally' | 'streak' | 'percentage' | 'checklist' | 'multi_habit_grid'

// Phase B-1 tracker types
export type PhaseBTrackerType =
  | 'boolean_checkin' | 'sequential_path' | 'achievement_badge'
  | 'xp_level' | 'allowance_calculator' | 'leaderboard'
  | 'mood_rating' | 'countdown' | 'timer_duration' | 'snapshot_comparison'

// ============================================================
// Visual Variants — how each tracker type renders
// ============================================================

export type VisualVariant =
  | 'progress_bar' | 'donut_ring' | 'star_chart' | 'animated_star_chart'
  | 'thermometer' | 'coin_jar' | 'bar_chart_history' | 'bubble_fill'
  | 'tally_marks' | 'pixel_art_grid' | 'garden_growth' | 'fuel_gauge'
  | 'flame_counter' | 'chain_links' | 'mountain_climb' | 'growing_tree'
  | 'classic_grid' | 'color_coded_grid' | 'sticker_board'
  | 'standard_checklist' | 'card_stack'
  | 'responsibility_gauge' | 'battery'
  | 'winding_path' | 'mastery_path' | 'staircase' | 'game_board' | 'skill_tree' | 'map_journey'
  | 'badge_wall' | 'trophy_shelf' | 'sticker_album'
  | 'shield_bar' | 'character_levelup' | 'rank_badge'
  | 'summary_card' | 'fixed_task_grid' | 'dynamic_category_rings' | 'points_list'
  | 'classic_leaderboard' | 'podium' | 'race_track'
  | 'emoji_row_trend' | 'color_gradient' | 'weather_metaphor'
  | 'big_number' | 'calendar_tearaway' | 'advent_calendar'
  | 'stopwatch_bar' | 'clock_fill' | 'time_bar_chart'
  | 'before_after_card' | 'trend_line' | 'record_board'
  | 'standard_reveal' | 'mosaic_reveal' | 'spotlight_reveal'
  | 'road_trip' | 'space_route' | 'garden_path' | 'castle_quest' | 'ocean_voyage' | 'custom_path'
  | 'bujo_monthly_grid' | 'animated_sticker_grid' | 'progress_bar_multi'
  | 'colored_bars_competitive' | 'year_in_pixels_weekly' | 'donut_completion'
  // Phase B-1 additions
  | 'simple_toggle' | 'calendar_dots' | 'stamp_card' | 'heatmap'
  | 'number_scale'
  | string // Allow future variants without type errors

// ============================================================
// Widget Sizes
// ============================================================

export type WidgetSize = 'small' | 'medium' | 'large'

// ============================================================
// Value Types for data points
// ============================================================

export type ValueType = 'increment' | 'set' | 'boolean' | 'mood' | 'percentage'

// ============================================================
// Data Source Types
// ============================================================

export type DataSourceType = 'tasks' | 'routines' | 'trackable_events' | 'manual' | 'best_intentions' | 'guiding_stars' | 'calculated'

// ============================================================
// View Mode
// ============================================================

export type ViewMode = 'default' | 'family' | 'personal'

// ============================================================
// Widget Categories (for template library)
// ============================================================

export type WidgetCategory =
  | 'routine_trackers'
  | 'goal_pursuit'
  | 'progress_visualizers'
  | 'reward_allowance'
  | 'achievement_recognition'
  | 'reflection_insight'
  | 'family_social'
  | 'skill_tracking'
  | 'quick_action_tracker'

// ============================================================
// Database Record Types
// ============================================================

export interface DashboardWidget {
  id: string
  family_id: string
  family_member_id: string
  template_type: TrackerType | string
  visual_variant: VisualVariant | null
  title: string
  size: WidgetSize
  position_x: number
  position_y: number
  folder_id: string | null
  sort_order: number
  widget_config: Record<string, unknown>
  data_source_type: DataSourceType | null
  data_source_ids: string[]
  assigned_member_id: string | null
  is_active: boolean
  is_on_dashboard: boolean
  is_included_in_ai: boolean
  multiplayer_enabled: boolean
  multiplayer_participants: string[]
  multiplayer_config: Record<string, unknown>
  linked_widget_id: string | null
  view_mode: ViewMode
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface DashboardWidgetFolder {
  id: string
  family_id: string
  family_member_id: string
  name: string
  position_x: number
  position_y: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface WidgetDataPoint {
  id: string
  family_id: string
  widget_id: string
  family_member_id: string
  recorded_at: string
  recorded_date: string
  value: number
  value_type: ValueType
  metadata: Record<string, unknown>
  recorded_by_member_id: string | null
  created_at: string
}

export interface WidgetTemplate {
  id: string
  family_id: string | null
  family_member_id: string | null
  template_type: TrackerType | string
  category: WidgetCategory | string
  name: string
  description: string | null
  default_config: Record<string, unknown>
  thumbnail_config: Record<string, unknown>
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface WidgetStarterConfig {
  id: string
  tracker_type: string
  visual_variant: string
  config_name: string
  description: string | null
  category: string | null
  default_config: Record<string, unknown>
  is_example: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================================
// Create / Update Types
// ============================================================

export interface CreateWidget {
  family_id: string
  family_member_id: string
  template_type: TrackerType | string
  visual_variant?: string | null
  title: string
  size?: WidgetSize
  position_x?: number
  position_y?: number
  folder_id?: string | null
  widget_config?: Record<string, unknown>
  data_source_type?: DataSourceType | null
  data_source_ids?: string[]
  assigned_member_id?: string | null
}

export interface UpdateWidget {
  title?: string
  size?: WidgetSize
  position_x?: number
  position_y?: number
  folder_id?: string | null
  sort_order?: number
  widget_config?: Record<string, unknown>
  is_on_dashboard?: boolean
  is_included_in_ai?: boolean
  visual_variant?: string | null
  archived_at?: string | null
}

export interface CreateWidgetDataPoint {
  family_id: string
  widget_id: string
  family_member_id: string
  value: number
  value_type?: ValueType
  metadata?: Record<string, unknown>
  recorded_by_member_id?: string | null
}

// ============================================================
// Grid layout types
// ============================================================

export interface GridPosition {
  x: number
  y: number
  w: number
  h: number
}

export type LayoutMode = 'auto' | 'manual'

// Size to grid dimensions mapping
export const WIDGET_SIZE_MAP: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 1 },
  large: { w: 2, h: 2 },
}

// ============================================================
// Tracker type metadata
// ============================================================

export interface TrackerTypeMeta {
  type: TrackerType
  label: string
  description: string
  icon: string // Lucide icon name
  defaultVariant: string
  availableVariants: string[]
  category: WidgetCategory
  supportsMultiplayer: boolean
  phaseA: boolean
}

export const TRACKER_TYPE_REGISTRY: TrackerTypeMeta[] = [
  {
    type: 'tally',
    label: 'Tally Counter',
    description: 'Count anything — books read, glasses of water, piano practice sessions.',
    icon: 'Hash',
    defaultVariant: 'progress_bar',
    availableVariants: ['progress_bar', 'donut_ring', 'star_chart', 'animated_star_chart', 'thermometer', 'coin_jar', 'bar_chart_history', 'bubble_fill', 'tally_marks', 'pixel_art_grid', 'garden_growth', 'fuel_gauge'],
    category: 'progress_visualizers',
    supportsMultiplayer: true,
    phaseA: true,
  },
  {
    type: 'streak',
    label: 'Streak Counter',
    description: 'Track consecutive days of success. Build momentum and celebrate milestones.',
    icon: 'Flame',
    defaultVariant: 'flame_counter',
    availableVariants: ['flame_counter', 'chain_links', 'mountain_climb', 'growing_tree'],
    category: 'routine_trackers',
    supportsMultiplayer: false,
    phaseA: true,
  },
  {
    type: 'percentage',
    label: 'Completion Tracker',
    description: 'Track percentage completion — chores done, goals reached, habits maintained.',
    icon: 'PieChart',
    defaultVariant: 'donut_ring',
    availableVariants: ['donut_ring', 'progress_bar', 'responsibility_gauge', 'battery', 'donut_completion'],
    category: 'progress_visualizers',
    supportsMultiplayer: true,
    phaseA: true,
  },
  {
    type: 'checklist',
    label: 'Daily Checklist',
    description: 'A simple daily checklist with checkboxes. Resets each day.',
    icon: 'CheckSquare',
    defaultVariant: 'standard_checklist',
    availableVariants: ['standard_checklist', 'card_stack'],
    category: 'routine_trackers',
    supportsMultiplayer: false,
    phaseA: true,
  },
  {
    type: 'multi_habit_grid',
    label: 'Habit Grid',
    description: 'Bullet-journal style monthly grid. Each row is a habit, each column is a day.',
    icon: 'Grid3x3',
    defaultVariant: 'bujo_monthly_grid',
    availableVariants: ['classic_grid', 'color_coded_grid', 'sticker_board', 'bujo_monthly_grid'],
    category: 'routine_trackers',
    supportsMultiplayer: false,
    phaseA: true,
  },
  // Phase B types (stubs)
  {
    type: 'boolean_checkin',
    label: 'Daily Check-In',
    description: 'Simple yes/no daily check-in. Did you do the thing today?',
    icon: 'CircleCheck',
    defaultVariant: 'simple_toggle',
    availableVariants: ['simple_toggle', 'calendar_dots', 'stamp_card', 'heatmap'],
    category: 'reflection_insight',
    supportsMultiplayer: true,
    phaseA: false,
  },
  {
    type: 'sequential_path',
    label: 'Step Path',
    description: 'Ordered steps that unlock one at a time. Perfect for skill building.',
    icon: 'Footprints',
    defaultVariant: 'staircase',
    availableVariants: ['winding_path', 'mastery_path', 'staircase', 'skill_tree', 'map_journey'],
    category: 'skill_tracking',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'achievement_badge',
    label: 'Badge Wall',
    description: 'Collect badges and achievements. Display your accomplishments.',
    icon: 'Award',
    defaultVariant: 'badge_wall',
    availableVariants: ['badge_wall', 'trophy_shelf', 'sticker_album'],
    category: 'achievement_recognition',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'xp_level',
    label: 'XP & Level',
    description: 'Earn XP and level up. Visual progress toward the next level.',
    icon: 'Zap',
    defaultVariant: 'shield_bar',
    availableVariants: ['shield_bar', 'character_levelup', 'rank_badge'],
    category: 'achievement_recognition',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'allowance_calculator',
    label: 'Allowance Calculator',
    description: 'Track chore completion and calculate allowance earnings.',
    icon: 'Coins',
    defaultVariant: 'summary_card',
    availableVariants: ['summary_card', 'fixed_task_grid', 'dynamic_category_rings', 'points_list'],
    category: 'reward_allowance',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'leaderboard',
    label: 'Family Leaderboard',
    description: 'See who\'s leading in any metric. Friendly family competition.',
    icon: 'Trophy',
    defaultVariant: 'classic_leaderboard',
    availableVariants: ['classic_leaderboard', 'podium', 'race_track'],
    category: 'family_social',
    supportsMultiplayer: true,
    phaseA: false,
  },
  {
    type: 'mood_rating',
    label: 'Mood Check-In',
    description: 'Daily mood or energy rating on a 1-5 scale. See patterns over time.',
    icon: 'Smile',
    defaultVariant: 'emoji_row_trend',
    availableVariants: ['emoji_row_trend', 'color_gradient', 'weather_metaphor', 'number_scale'],
    category: 'reflection_insight',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'countdown',
    label: 'Countdown',
    description: 'Count down to a special date or event.',
    icon: 'Hourglass',
    defaultVariant: 'big_number',
    availableVariants: ['big_number', 'calendar_tearaway', 'advent_calendar'],
    category: 'reward_allowance',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'timer_duration',
    label: 'Time Tracker',
    description: 'Track time spent on activities. See totals by category.',
    icon: 'Clock',
    defaultVariant: 'time_bar_chart',
    availableVariants: ['stopwatch_bar', 'clock_fill', 'time_bar_chart'],
    category: 'routine_trackers',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'snapshot_comparison',
    label: 'Before & After',
    description: 'Track progress with periodic snapshots. See how far you\'ve come.',
    icon: 'ArrowLeftRight',
    defaultVariant: 'before_after_card',
    availableVariants: ['before_after_card', 'trend_line', 'record_board'],
    category: 'goal_pursuit',
    supportsMultiplayer: false,
    phaseA: false,
  },
  {
    type: 'color_reveal',
    label: 'Color Reveal',
    description: 'Reveal a beautiful image one color zone at a time as you earn achievements.',
    icon: 'Palette',
    defaultVariant: 'standard_reveal',
    availableVariants: ['standard_reveal', 'mosaic_reveal', 'spotlight_reveal'],
    category: 'goal_pursuit',
    supportsMultiplayer: true,
    phaseA: false,
  },
  {
    type: 'gameboard',
    label: 'Game Board',
    description: 'Move your game piece along a themed path. Special spaces add surprise.',
    icon: 'Gamepad2',
    defaultVariant: 'road_trip',
    availableVariants: ['road_trip', 'space_route', 'garden_path', 'castle_quest', 'ocean_voyage', 'custom_path'],
    category: 'goal_pursuit',
    supportsMultiplayer: true,
    phaseA: false,
  },
  {
    type: 'randomizer_spinner',
    label: 'Spinner',
    description: 'Spin a linked randomizer list and assign the result. Consequence spinner, activity picker, reward wheel.',
    icon: 'RotateCw',
    defaultVariant: 'standard_spinner',
    availableVariants: ['standard_spinner'],
    category: 'quick_action_tracker',
    supportsMultiplayer: false,
    phaseA: true,
  },
  {
    type: 'privilege_status',
    label: 'Privilege Status',
    description: 'Color-zone display (Red/Yellow/Green) based on task completion percentage. Mom sets thresholds and descriptions. Visibility only — never blocks anything.',
    icon: 'Shield',
    defaultVariant: 'color_zone',
    availableVariants: ['color_zone'],
    category: 'reward_allowance',
    supportsMultiplayer: false,
    phaseA: true,
  },
]

// Quick lookup
export function getTrackerMeta(type: TrackerType | string): TrackerTypeMeta | undefined {
  return TRACKER_TYPE_REGISTRY.find(t => t.type === type)
}

export function getPhaseATrackers(): TrackerTypeMeta[] {
  return TRACKER_TYPE_REGISTRY.filter(t => t.phaseA)
}

// ============================================================
// Widget Kind — separates tracker engines from display-only widgets
// ============================================================

export type WidgetKind = 'tracker' | 'info_display' | 'quick_action'

// Info Display widget types — read-only cards pulling from other features
export type InfoDisplayType =
  | 'info_best_intentions'
  | 'info_upcoming_tasks'
  | 'info_calendar_today'
  | 'info_recent_victories'
  | 'info_guiding_stars_rotation'
  | 'info_quick_stats'
  | 'info_today_is'
  | 'info_hub_menu'
  | 'info_hub_job_board'
  | 'info_family_intention'
  | 'info_countdown'
  | 'info_list'

// Quick Action widget types — single-tap shortcut buttons
export type QuickActionType =
  | 'action_add_task'
  | 'action_mind_sweep'
  | 'action_add_intention'
  | 'action_track_this'

export function getWidgetKind(templateType: string): WidgetKind {
  if (templateType.startsWith('info_')) return 'info_display'
  if (templateType.startsWith('action_')) return 'quick_action'
  return 'tracker'
}

// Info widget metadata for picker
export interface InfoWidgetMeta {
  type: InfoDisplayType
  label: string
  description: string
  icon: string
  defaultSize: WidgetSize
}

export const INFO_WIDGET_REGISTRY: InfoWidgetMeta[] = [
  {
    type: 'info_best_intentions',
    label: 'Best Intentions',
    description: 'All active intentions with today\'s count and tap-to-celebrate.',
    icon: 'Heart',
    defaultSize: 'medium',
  },
  {
    type: 'info_upcoming_tasks',
    label: 'Upcoming Tasks',
    description: 'Next tasks due, sorted by date.',
    icon: 'CheckSquare',
    defaultSize: 'medium',
  },
  {
    type: 'info_calendar_today',
    label: 'Calendar Today',
    description: 'Today\'s events at a glance.',
    icon: 'Calendar',
    defaultSize: 'medium',
  },
  {
    type: 'info_recent_victories',
    label: 'Recent Victories',
    description: 'Latest victories and celebrations.',
    icon: 'Trophy',
    defaultSize: 'medium',
  },
  {
    type: 'info_guiding_stars_rotation',
    label: 'Guiding Stars',
    description: 'Rotates through your active Guiding Stars.',
    icon: 'Star',
    defaultSize: 'small',
  },
  {
    type: 'info_quick_stats',
    label: 'Quick Stats',
    description: 'Task completion %, active streaks, widgets tracked.',
    icon: 'BarChart3',
    defaultSize: 'small',
  },
  {
    type: 'info_today_is',
    label: 'Today Is...',
    description: 'Discover fun and quirky holidays the whole family can celebrate today.',
    icon: 'PartyPopper',
    defaultSize: 'medium',
  },
  {
    type: 'info_hub_menu',
    label: 'Dinner Menu',
    description: 'Let everyone know what\'s for dinner tonight.',
    icon: 'UtensilsCrossed',
    defaultSize: 'medium',
  },
  {
    type: 'info_hub_job_board',
    label: 'Job Board',
    description: 'Post extra chores or opportunities kids can claim for rewards.',
    icon: 'ClipboardList',
    defaultSize: 'medium',
  },
  {
    type: 'info_family_intention',
    label: 'Family Intentions',
    description: 'Your tally and the family total for each shared intention.',
    icon: 'Heart',
    defaultSize: 'medium',
  },
  {
    type: 'info_countdown',
    label: 'Countdowns',
    description: 'Days until upcoming family events and milestones.',
    icon: 'Hourglass',
    defaultSize: 'small',
  },
  {
    type: 'info_list',
    label: 'Pinned List',
    description: 'Pin any list to your dashboard. Reference lists show as accordions.',
    icon: 'BookOpen',
    defaultSize: 'medium',
  },
]

// ============================================================
// "Great for Family Hub" widget recommendations
// ============================================================

export interface HubWidgetRecommendation {
  templateType: string // tracker type or info widget type
  label: string
  hubDescription: string
  icon: string
  kind: WidgetKind
}

export const HUB_WIDGET_RECOMMENDATIONS: HubWidgetRecommendation[] = [
  {
    templateType: 'countdown',
    label: 'Countdown',
    hubDescription: 'Count down to birthdays, vacations, and holidays together',
    icon: 'Hourglass',
    kind: 'tracker',
  },
  {
    templateType: 'info_today_is',
    label: 'Today Is...',
    hubDescription: 'Discover fun and quirky holidays the whole family can celebrate',
    icon: 'PartyPopper',
    kind: 'info_display',
  },
  {
    templateType: 'info_hub_menu',
    label: 'Dinner Menu',
    hubDescription: 'Let everyone know what\'s for dinner tonight',
    icon: 'UtensilsCrossed',
    kind: 'info_display',
  },
  {
    templateType: 'info_hub_job_board',
    label: 'Job Board',
    hubDescription: 'Post extra chores or opportunities kids can claim',
    icon: 'ClipboardList',
    kind: 'info_display',
  },
  {
    templateType: 'info_best_intentions',
    label: 'Family Best Intentions',
    hubDescription: 'Practice being the family you want to be together',
    icon: 'Heart',
    kind: 'info_display',
  },
  {
    templateType: 'tally',
    label: 'Family Reading Challenge',
    hubDescription: 'Track your family\'s reading goal as a team',
    icon: 'BookOpen',
    kind: 'tracker',
  },
]

export interface QuickActionMeta {
  type: QuickActionType
  label: string
  description: string
  icon: string
}

export const QUICK_ACTION_REGISTRY: QuickActionMeta[] = [
  { type: 'action_add_task', label: 'Quick Add Task', description: 'Opens task creation', icon: 'Plus' },
  { type: 'action_mind_sweep', label: 'Quick Mind Sweep', description: 'Opens notepad for capture', icon: 'StickyNote' },
  { type: 'action_add_intention', label: 'Quick Add Intention', description: 'Add a Best Intention', icon: 'Sparkles' },
  { type: 'action_track_this', label: 'Track This', description: 'Start tracking something new', icon: 'BarChart3' },
]

// ============================================================
// Daily Holiday type (for Today Is... widget)
// ============================================================

export interface DailyHoliday {
  id: string
  name: string
  description: string | null
  date_month: number
  date_day: number
  date_type: 'fixed' | 'floating'
  floating_rule: string | null
  tags: string[]
  is_kid_friendly: boolean
  silliness_score: number
  obscurity_score: number
  is_excluded: boolean
  source: string | null
  created_at: string
}

// ============================================================
// Multiplayer Configuration Types
// ============================================================

export type MultiplayerMode = 'collaborative' | 'competitive' | 'both'

export type MultiplayerVisualStyle =
  | 'colored_bars'
  | 'colored_segments'
  | 'colored_markers'
  | 'colored_stars'

export interface MultiplayerConfig {
  enabled: boolean
  participants: string[]
  mode: MultiplayerMode
  visualStyle: MultiplayerVisualStyle
  sharedTarget?: number
}

// Tracker types that support multiplayer
export const MULTIPLAYER_TRACKER_TYPES: TrackerType[] = [
  'tally', 'streak', 'percentage', 'boolean_checkin',
  'multi_habit_grid', 'mood_rating', 'timer_duration', 'xp_level',
]
