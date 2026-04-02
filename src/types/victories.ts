// PRD-11: Victory Recorder & Daily Celebration — TypeScript types
// Phase 12A: Core recording, browsing, collection celebration

// ============================================================
// Enums
// ============================================================

export type VictorySource =
  | 'manual'
  | 'task_completed'
  | 'tracker_entry'
  | 'intention_iteration'
  | 'widget_milestone'
  | 'lila_conversation'
  | 'notepad_routed'
  | 'reflection_routed'
  | 'list_item_completed'
  | 'routine_completion'
  | 'reckoning_prompt'
  | 'homeschool_logged'
  | 'plan_completed'
  | 'milestone_completed'
  | 'family_feed'
  | 'bookshelf'

export type VictoryImportance = 'small_win' | 'standard' | 'big_win' | 'major_achievement'

export type MemberType = 'adult' | 'teen' | 'guided' | 'play'

export type CelebrationMode = 'individual' | 'review' | 'collection' | 'monthly'

export type CelebrationPeriod = 'today' | 'this_week' | 'this_month' | 'custom'

// ============================================================
// Table: victories
// ============================================================

export interface Victory {
  id: string
  family_id: string
  family_member_id: string
  description: string
  celebration_text: string | null
  life_area_tag: string | null
  custom_tags: string[]
  source: VictorySource
  source_reference_id: string | null
  recorder_type: string
  member_type: MemberType
  importance: VictoryImportance
  guiding_star_id: string | null
  best_intention_id: string | null
  is_moms_pick: boolean
  moms_pick_note: string | null
  moms_pick_by: string | null
  celebration_voice: string | null
  photo_url: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateVictory {
  family_id: string
  family_member_id: string
  description: string
  life_area_tag?: string | null
  custom_tags?: string[]
  source?: VictorySource
  source_reference_id?: string | null
  member_type: MemberType
  importance?: VictoryImportance
  guiding_star_id?: string | null
  best_intention_id?: string | null
}

export interface UpdateVictory {
  description?: string
  celebration_text?: string | null
  life_area_tag?: string | null
  custom_tags?: string[]
  importance?: VictoryImportance
  guiding_star_id?: string | null
  best_intention_id?: string | null
  is_moms_pick?: boolean
  moms_pick_note?: string | null
  moms_pick_by?: string | null
  archived_at?: string | null
}

// ============================================================
// Table: victory_celebrations
// ============================================================

export interface VictoryCelebration {
  id: string
  family_id: string
  family_member_id: string
  celebration_date: string
  mode: CelebrationMode
  period: CelebrationPeriod | null
  narrative: string
  victory_ids: string[] | null
  victory_count: number
  celebration_voice: string | null
  context_sources: Record<string, unknown>
  created_at: string
}

export interface CreateCelebration {
  family_id: string
  family_member_id: string
  celebration_date?: string
  mode: CelebrationMode
  period?: CelebrationPeriod | null
  narrative: string
  victory_ids?: string[] | null
  victory_count: number
  celebration_voice?: string | null
  context_sources?: Record<string, unknown>
}

// ============================================================
// Table: victory_voice_preferences
// ============================================================

export interface VictoryVoicePreference {
  id: string
  family_id: string
  family_member_id: string
  selected_voice: string
  updated_at: string
}

// ============================================================
// Filter / Query types
// ============================================================

export type VictoryPeriodFilter = 'today' | 'this_week' | 'this_month' | 'all' | 'custom'

export interface VictoryFilters {
  period: VictoryPeriodFilter
  customStart?: string
  customEnd?: string
  lifeAreaTags?: string[]
  specialFilter?: 'best_intentions' | 'guiding_stars' | 'life_lantern' | null
}

// ============================================================
// Edge Function request/response
// ============================================================

export interface CelebrateVictoryRequest {
  family_member_id: string
  mode: 'collection' | 'review' | 'monthly'
  period?: CelebrationPeriod
  victory_ids: string[]
  custom_start?: string
  custom_end?: string
  voice?: string
}

export interface CelebrateVictoryResponse {
  narrative: string
  context_sources: Record<string, unknown>
  model_used: string
  token_count: { input: number; output: number }
}

// ============================================================
// Voice Personalities (Phase 12C)
// ============================================================

export type VoicePersonality =
  // Essential tier (5)
  | 'enthusiastic_coach'
  | 'calm_mentor'
  | 'fun_friend'
  | 'silly_character'
  | 'proud_parent'
  // Full Magic tier (10)
  | 'princess'
  | 'pirate_captain'
  | 'sports_announcer'
  | 'british_nobleman'
  | 'scottish_rogue'
  | 'gen_z_influencer'
  | 'news_reporter'
  | 'wizard'
  | 'superhero'
  | 'astronaut'

export interface VoicePersonalityInfo {
  label: string
  description: string
  tier: 'essential' | 'full_magic'
  defaultFor?: ('guided' | 'play')[]
  sampleLine: string
}

export const VOICE_PERSONALITIES: Record<VoicePersonality, VoicePersonalityInfo> = {
  enthusiastic_coach: {
    label: 'Enthusiastic Coach',
    description: 'Warm, energetic encouragement',
    tier: 'essential',
    defaultFor: ['guided'],
    sampleLine: 'You showed up and gave it everything — that\'s what champions do.',
  },
  calm_mentor: {
    label: 'Calm Mentor',
    description: 'Wise, gentle guidance',
    tier: 'essential',
    sampleLine: 'There\'s something meaningful in what you did today. Take a moment to notice it.',
  },
  fun_friend: {
    label: 'Fun Friend',
    description: 'Casual, warm, relatable',
    tier: 'essential',
    defaultFor: ['play'],
    sampleLine: 'Okay wait, you actually did ALL of that today? That\'s awesome!',
  },
  silly_character: {
    label: 'Silly Character',
    description: 'Playful, goofy, lighthearted',
    tier: 'essential',
    sampleLine: 'Holy moly guacamole! You did so many cool things today!',
  },
  proud_parent: {
    label: 'Proud Parent',
    description: 'Warm parental pride',
    tier: 'essential',
    sampleLine: 'I want you to know — what you did today really matters.',
  },
  pirate_captain: {
    label: 'Pirate Captain',
    description: 'Swashbuckling encouragement',
    tier: 'full_magic',
    sampleLine: 'Shiver me timbers! Ye conquered the day like a true captain!',
  },
  princess: {
    label: 'Princess',
    description: 'Regal warmth and fairy tale grace',
    tier: 'full_magic',
    sampleLine: 'How wonderfully brave of you! The kingdom rejoices at your deeds today.',
  },
  sports_announcer: {
    label: 'Sports Announcer',
    description: 'Exciting play-by-play energy',
    tier: 'full_magic',
    sampleLine: 'AND THEY DO IT! What a performance today, folks — absolutely legendary!',
  },
  british_nobleman: {
    label: 'British Nobleman',
    description: 'Understated elegance and dry wit',
    tier: 'full_magic',
    sampleLine: 'I say, most impressive. One does not see this caliber of effort every day.',
  },
  scottish_rogue: {
    label: 'Scottish Rogue',
    description: 'Hearty, boisterous encouragement',
    tier: 'full_magic',
    sampleLine: 'Ach, ye did grand today! A finer effort I\'ve nae seen in many a moon.',
  },
  gen_z_influencer: {
    label: 'Gen Z Influencer',
    description: 'Current slang, genuine enthusiasm',
    tier: 'full_magic',
    sampleLine: 'No cap, that was literally so fire. You ate and left no crumbs today.',
  },
  news_reporter: {
    label: 'News Reporter',
    description: 'Dramatic, authoritative reporting',
    tier: 'full_magic',
    sampleLine: 'Breaking news tonight — extraordinary achievements reported across the board.',
  },
  wizard: {
    label: 'Wizard',
    description: 'Mystical wisdom and wonder',
    tier: 'full_magic',
    sampleLine: 'The stars foretold great things, and today you proved them right.',
  },
  superhero: {
    label: 'Superhero',
    description: 'Hero narrative and mission focus',
    tier: 'full_magic',
    sampleLine: 'With great power comes great responsibility — and you used yours well today.',
  },
  astronaut: {
    label: 'Astronaut',
    description: 'Calm, confident, mission-oriented',
    tier: 'full_magic',
    sampleLine: 'Mission accomplished. All objectives met. Outstanding work up there today.',
  },
}

export function getDefaultVoice(shell: string): VoicePersonality {
  if (shell === 'play') return 'fun_friend'
  if (shell === 'guided') return 'enthusiastic_coach'
  return 'calm_mentor'
}

// ============================================================
// Quick-add categories (UI only — maps to life_area_tag)
// ============================================================

export const VICTORY_CATEGORIES = [
  { key: 'helped_someone', label: 'Helped Someone', tag: 'community' },
  { key: 'extra_cleaning', label: 'Extra Cleaning', tag: 'home' },
  { key: 'extra_learning', label: 'Extra Learning', tag: 'education' },
  { key: 'creative_project', label: 'Creative Project', tag: 'creativity' },
  { key: 'act_of_kindness', label: 'Act of Kindness', tag: 'character' },
  { key: 'physical_activity', label: 'Physical Activity', tag: 'health' },
  { key: 'custom', label: 'Custom', tag: null },
] as const

export const IMPORTANCE_OPTIONS: { value: VictoryImportance; label: string }[] = [
  { value: 'small_win', label: 'Small Win' },
  { value: 'standard', label: 'Standard' },
  { value: 'big_win', label: 'Big Win' },
  { value: 'major_achievement', label: 'Major Achievement' },
]

// ============================================================
// Activity scan suggestions (Phase 12B)
// ============================================================

export interface VictorySuggestion {
  description: string
  pattern_note?: string
  life_area_tag: string | null
  guiding_star_id: string | null
  best_intention_id: string | null
  source_log_ids: string[]
}

export interface ScanActivityRequest {
  family_member_id: string
  period: 'today' | 'this_week' | 'this_month' | 'custom'
  custom_start?: string
  custom_end?: string
}

export interface ScanActivityResponse {
  suggestions: VictorySuggestion[]
  model_used: string
  token_count: { input: number; output: number }
}

// Source display mapping for victory cards
export const SOURCE_LABELS: Record<VictorySource, string> = {
  manual: 'Recorded manually',
  task_completed: 'Task completed',
  tracker_entry: 'Tracker entry',
  intention_iteration: 'Best Intention celebrated',
  widget_milestone: 'Widget milestone',
  lila_conversation: 'From LiLa conversation',
  notepad_routed: 'From Notepad',
  reflection_routed: 'From Reflection',
  list_item_completed: 'List item completed',
  routine_completion: 'Routine completed',
  reckoning_prompt: 'What Actually Got Done',
  homeschool_logged: 'Homeschool logged',
  plan_completed: 'Plan completed',
  milestone_completed: 'Milestone completed',
  family_feed: 'Family feed',
  bookshelf: 'From BookShelf',
}
