/**
 * PRD-18: Rhythms & Reflections — TypeScript types
 *
 * Tables: rhythm_configs, rhythm_completions, feature_discovery_dismissals,
 *         morning_insight_questions
 *
 * Phase A scope: foundation only. Enhancement section types are stubbed
 * here so the registry has the right keys; actual rendering of those
 * sections lands in Phase B/C/D.
 */

// ─── Rhythm keys ─────────────────────────────────────────────

export type RhythmKey =
  | 'morning'
  | 'evening'
  | 'weekly_review'
  | 'monthly_review'
  | 'quarterly_inventory'
  | string // custom slug

export type RhythmType = 'default' | 'custom' | 'template_activated'

export type RhythmStatus = 'pending' | 'completed' | 'dismissed' | 'snoozed'

export type MoodTriage = 'course_correcting' | 'smooth_sailing' | 'rough_waters'

// ─── Section types ───────────────────────────────────────────

/**
 * Every rhythm section has a section_type key that maps to a renderer
 * component. New section types require only a new component + registry
 * entry — no migration. Phase A ships the core renderers; Phase B/C/D
 * enhancement sections stub here and fill in later.
 */
export type RhythmSectionType =
  // Morning core (Phase A)
  | 'guiding_star_rotation'
  | 'best_intentions_focus'
  | 'task_preview'
  | 'calendar_preview'
  | 'brain_dump'
  | 'periodic_cards_slot'
  // Morning Phase B+
  | 'morning_priorities_recall' // Phase B (Enhancement 1)
  | 'on_the_horizon' // Phase B (Enhancement 8)
  // Morning Phase C+
  | 'morning_insight' // Phase C (Enhancement 3)
  | 'feature_discovery' // Phase C (Enhancement 4)

  // Evening core (Phase A) — fixed sequence
  | 'evening_greeting'
  | 'accomplishments_victories'
  | 'completed_meetings'
  | 'milestone_celebrations'
  | 'carry_forward'
  | 'evening_tomorrow_capture' // Phase A stub, Phase B real (Enhancement 1)
  | 'mindsweep_lite' // Phase A stub, Phase C real (Enhancement 2)
  | 'closing_thought'
  | 'from_your_library'
  | 'before_close_the_day'
  | 'reflections'
  | 'rhythm_tracker_prompts' // Phase A stub, Phase C real (Enhancement 6)
  | 'close_my_day'

  // Weekly Review (Phase B)
  | 'weekly_stats'
  | 'top_victories'
  | 'next_week_preview'
  | 'weekly_reflection_prompt'
  | 'weekly_review_deep_dive'

  // Monthly Review (Phase B)
  | 'month_at_a_glance'
  | 'highlight_reel'
  | 'reports_link'
  | 'monthly_review_deep_dive'

  // Quarterly Inventory (Phase B)
  | 'stale_areas'
  | 'quick_win_suggestion'
  | 'lifelantern_launch_link'

  // Kid templates
  | 'encouraging_message'
  | 'routine_checklist'

  // Guided evening rhythm (PRD-18 Phase A addition — kid-framed mini check-in)
  | 'guided_day_highlights'
  | 'guided_pride_reflection'
  | 'guided_tomorrow_lookahead'
  | 'guided_reflections'

// ─── Section config (lives inside rhythm_configs.sections JSONB) ──

export interface RhythmSection {
  section_type: RhythmSectionType
  enabled: boolean
  order: number
  config: Record<string, unknown>
}

// ─── Rhythm timing (lives inside rhythm_configs.timing JSONB) ─────

export type RhythmTriggerType =
  | 'time_window' // start_hour + end_hour
  | 'weekly' // day_of_week
  | 'monthly' // day_of_month
  | 'lifelantern_staleness' // interval_days since last LifeLantern check-in
  | 'custom'

export interface RhythmTiming {
  trigger_type: RhythmTriggerType
  start_hour?: number // 0-23
  end_hour?: number // 0-24 (24 = midnight)
  day_of_week?: number // 0=Sunday … 6=Saturday
  day_of_month?: number // 1-31
  interval_days?: number
}

// ─── rhythm_configs row ──────────────────────────────────────

export interface RhythmConfig {
  id: string
  family_id: string
  member_id: string
  rhythm_key: RhythmKey
  display_name: string
  rhythm_type: RhythmType
  enabled: boolean
  sections: RhythmSection[]
  section_order_locked: boolean
  timing: RhythmTiming
  auto_open: boolean
  reflection_guideline_count: number
  source_template_id: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ─── rhythm_completions row + metadata ───────────────────────

/**
 * Tomorrow Capture priority items — staged in rhythm_completions.metadata
 * during the evening rhythm session. Phase B (Enhancement 1) populates
 * via EveningTomorrowCaptureSection → fuzzy match → batched commit on
 * Close My Day. Morning Priorities Recall reads from this array.
 *
 * Fields:
 *   text                  the exact text mom typed
 *   matched_task_id       existing task row ID if fuzzy match was confirmed
 *   matched_task_title    snapshot of the matched task's title at time of match
 *                         (for morning recall display — survives if task
 *                         is later renamed)
 *   created_task_id       new task row ID if this was not a match
 *   focus_selected        true if mom picked this as one of her top 3
 *                         focus items when overflow (6+) triggered the
 *                         focus picker. Morning recall shows ONLY rows
 *                         where focus_selected=true when overflow existed;
 *                         if no overflow, focus_selected is true for all.
 *   prompt_variant_index  which of the 4 rotating prompt framings was
 *                         shown when this item was captured. Morning
 *                         recall can reflect it back ("Last night you
 *                         said you wanted to get these done:") matching
 *                         the tense of the evening prompt.
 */
export interface RhythmPriorityItem {
  text: string
  matched_task_id: string | null
  matched_task_title?: string | null
  created_task_id: string | null
  focus_selected?: boolean
  prompt_variant_index?: number
}

/**
 * MindSweep-Lite items — staged in rhythm_completions.metadata during
 * the evening rhythm session. Records are committed on Close My Day.
 * Phase A: empty array. Phase C (Enhancement 2) populates.
 */
export type MindSweepLiteDisposition =
  | 'schedule'
  | 'delegate'
  | 'note'
  | 'backburner'
  | 'release'
  // Teen variants (Phase D)
  | 'journal_about_it'
  | 'talk_to_someone'
  | 'let_it_go'

export interface RhythmMindSweepItem {
  text: string
  disposition: MindSweepLiteDisposition
  created_record_id: string | null
  created_record_type: 'task' | 'list_item' | 'notepad_tab' | 'message' | null
}

/**
 * Backlog prompt state (Enhancement 5) — when the carry-forward midnight
 * job detects a member has ≥ carry_forward_backlog_threshold tasks older
 * than 14 days, it marks the next pending evening completion so the
 * evening rhythm can surface a gentle "want to do a quick sweep?" banner.
 *
 * last_backlog_prompt_at is read by the job to enforce max once-per-week
 * frequency (or whatever the member preference says).
 */
export interface RhythmCompletionMetadata {
  priority_items?: RhythmPriorityItem[]
  mindsweep_items?: RhythmMindSweepItem[]
  brain_dump_notepad_tab_id?: string
  backlog_prompt_pending?: boolean
  backlog_prompt_task_count?: number
  last_backlog_prompt_at?: string
}

export interface RhythmCompletion {
  id: string
  family_id: string
  member_id: string
  rhythm_key: RhythmKey
  period: string // YYYY-MM-DD / YYYY-W## / YYYY-MM / YYYY-Q#
  status: RhythmStatus
  mood_triage: MoodTriage | null
  snoozed_until: string | null
  metadata: RhythmCompletionMetadata
  completed_at: string | null
  dismissed_at: string | null
  created_at: string
}

// ─── Feature Discovery dismissals (Phase C) ───────────────────

export interface FeatureDiscoveryDismissal {
  id: string
  family_id: string
  member_id: string
  feature_key: string
  dismissed_at: string
}

// ─── Morning Insight questions (Phase C) ──────────────────────

export type MorningInsightAudience = 'adult' | 'teen'

export interface MorningInsightQuestion {
  id: string
  family_id: string | null // NULL = system default
  audience: MorningInsightAudience
  category: string
  question_text: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// ─── Period helpers ──────────────────────────────────────────

/** Build a period identifier from a Date for the given rhythm key. */
export function periodForRhythm(rhythmKey: RhythmKey, date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (rhythmKey) {
    case 'morning':
    case 'evening':
      return `${year}-${month}-${day}`
    case 'weekly_review': {
      // ISO week number
      const d = new Date(Date.UTC(year, date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
    }
    case 'monthly_review':
      return `${year}-${month}`
    case 'quarterly_inventory': {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      return `${year}-Q${quarter}`
    }
    default:
      // Custom rhythms default to daily
      return `${year}-${month}-${day}`
  }
}

// ─── Phase B: Carry Forward fallback (Enhancement 5) ─────────

export type CarryForwardFallback =
  | 'stay'
  | 'roll_forward'
  | 'expire'
  | 'backburner'

export type BacklogPromptFrequency = 'weekly' | 'daily'

/**
 * Member-level rhythm preferences — stored inside the existing
 * family_members.preferences JSONB column. No schema migration
 * required. Defaults are enforced at read time (not via DEFAULT).
 *
 *   carry_forward_fallback              default 'stay'
 *   carry_forward_backburner_days       default 14
 *   carry_forward_backlog_threshold     default 10
 *   carry_forward_backlog_prompt_max_frequency  default 'weekly'
 */
export interface MemberRhythmPreferences {
  carry_forward_fallback?: CarryForwardFallback
  carry_forward_backburner_days?: number
  carry_forward_backlog_threshold?: number
  carry_forward_backlog_prompt_max_frequency?: BacklogPromptFrequency
}

export const DEFAULT_MEMBER_RHYTHM_PREFERENCES: Required<MemberRhythmPreferences> = {
  carry_forward_fallback: 'stay',
  carry_forward_backburner_days: 14,
  carry_forward_backlog_threshold: 10,
  carry_forward_backlog_prompt_max_frequency: 'weekly',
}

// ─── Phase B: Tomorrow Capture rotating prompts (Enhancement 1) ──

/**
 * The 4 rotating prompt framings for Evening Tomorrow Capture.
 * Date-seeded PRNG picks one per member per day. Order matters
 * only for the index — the actual selection is deterministic via
 * rhythmSeed(memberId, 'evening:tomorrow_capture', date).
 */
export const EVENING_TOMORROW_CAPTURE_PROMPTS = [
  'What do you want to get done tomorrow?',
  "What's on your mind for tomorrow?",
  'Anything you want to remember for tomorrow?',
  'What would make tomorrow feel like a good day?',
] as const

// ─── Phase B: On the Horizon config (Enhancement 8) ──────────

/**
 * Per-member lookahead configuration for the On the Horizon
 * section. Stored in rhythm_configs.sections[section_type='on_the_horizon'].config.
 * Defaults applied at read time.
 */
export interface OnTheHorizonConfig {
  lookahead_days?: number  // default 7, range 3-14
  max_items?: number       // default 5, range 3-10
}

export const DEFAULT_ON_THE_HORIZON_CONFIG: Required<OnTheHorizonConfig> = {
  lookahead_days: 7,
  max_items: 5,
}

// ─── Helpers ─────────────────────────────────────────────────

/** Determine if the current time is inside a rhythm's active window. */
export function isRhythmActive(timing: RhythmTiming, now: Date = new Date()): boolean {
  if (timing.trigger_type === 'time_window') {
    if (timing.start_hour == null || timing.end_hour == null) return true
    const hour = now.getHours()
    if (timing.start_hour <= timing.end_hour) {
      return hour >= timing.start_hour && hour < timing.end_hour
    }
    // Wraps midnight
    return hour >= timing.start_hour || hour < timing.end_hour
  }
  if (timing.trigger_type === 'weekly') {
    return timing.day_of_week == null ? true : now.getDay() === timing.day_of_week
  }
  if (timing.trigger_type === 'monthly') {
    return timing.day_of_month == null ? true : now.getDate() === timing.day_of_month
  }
  // lifelantern_staleness handled at query time, not a time-of-day check
  return true
}
