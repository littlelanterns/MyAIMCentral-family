/**
 * Archives & Context types — PRD-13
 */

// ---------- Database row types ----------

export interface ArchiveFolder {
  id: string
  family_id: string
  member_id: string | null
  folder_name: string
  parent_folder_id: string | null
  folder_type: ArchiveFolderType
  icon: string | null
  color_hex: string | null
  description: string | null
  is_system: boolean
  is_included_in_ai: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ArchiveFolderType = 'member_root' | 'family_overview' | 'system_category' | 'wishlist' | 'custom'

export interface ArchiveContextItem {
  id: string
  family_id: string
  folder_id: string
  member_id: string | null
  context_field: string | null
  context_value: string
  context_type: ArchiveContextType
  is_included_in_ai: boolean
  is_privacy_filtered: boolean
  source: ArchiveItemSource
  source_conversation_id: string | null
  source_reference_id: string | null
  added_by: string | null
  usage_count: number
  last_used_at: string | null
  link_url: string | null
  price_range: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type ArchiveContextType =
  | 'preference' | 'schedule' | 'personality' | 'interest'
  | 'academic' | 'medical' | 'wishlist_item'
  | 'family_personality' | 'family_rhythm' | 'family_focus'
  | 'faith_context' | 'meeting_note' | 'general'

export type ArchiveItemSource = 'manual' | 'lila_detected' | 'review_route' | 'list_shared'

export interface ArchiveMemberSettings {
  id: string
  family_id: string
  member_id: string
  is_included_in_ai: boolean
  overview_card_content: string | null
  overview_card_updated_at: string | null
  physical_description?: string | null
  reference_photos?: string[] | null
  created_at: string
  updated_at: string
}

export interface FaithPreferences {
  id: string
  family_id: string
  faith_tradition: string | null
  denomination: string | null
  observances: string[]
  sacred_texts: string[]
  prioritize_tradition: boolean
  include_comparative: boolean
  include_secular: boolean
  educational_only: boolean
  use_our_terminology: boolean
  respect_but_dont_assume: boolean
  avoid_conflicting: boolean
  acknowledge_diversity: boolean
  minority_views: boolean
  diversity_notes: string | null
  special_instructions: string | null
  relevance_setting: FaithRelevanceSetting
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

export type FaithRelevanceSetting = 'automatic' | 'always' | 'manual'

export interface ContextLearningDismissal {
  id: string
  family_id: string
  content_hash: string
  conversation_id: string | null
  dismissed_at: string
}

// ---------- UI / derived types ----------

/** Aggregated source entry shown on an Archive member card */
export interface AggregatedContextEntry {
  id: string
  content: string
  source_table: string
  source_feature: string
  category?: string
  is_included_in_ai: boolean
  /** Link to navigate to the source feature */
  view_link: string
}

/** Summary counts for an Archive member card */
export interface ArchiveMemberSummary {
  member_id: string
  display_name: string
  role: string
  avatar_url: string | null
  is_included_in_ai: boolean
  total_insights: number
  active_insights: number
  folder_previews: Array<{ folder_name: string; active_count: number; total_count: number }>
  is_out_of_nest?: boolean
}

/** Family Overview section */
export interface FamilyOverviewSection {
  folder: ArchiveFolder
  items: ArchiveContextItem[]
  aggregated: AggregatedContextEntry[]
}

// ---------- Constants ----------

export const SYSTEM_FOLDER_NAMES = [
  'Preferences',
  'Schedule & Activities',
  'Personality & Traits',
  'Interests & Hobbies',
  'School & Learning',
  'Health & Medical',
  'General',
] as const

export const FAMILY_OVERVIEW_SECTIONS = [
  'Family Personality',
  'Rhythms & Routines',
  'Current Focus',
  'Faith & Values',
] as const

export const FAITH_TRADITIONS = [
  'Catholic',
  'Protestant',
  'Orthodox',
  'LDS',
  'Jewish',
  'Muslim',
  'Hindu',
  'Buddhist',
  'Non-religious',
  'Spiritual but not religious',
  'Prefer not to specify',
  'Other',
] as const

/** Maps context_type to suggested folder name */
export const CONTEXT_TYPE_FOLDER_MAP: Record<string, string> = {
  preference: 'Preferences',
  schedule: 'Schedule & Activities',
  personality: 'Personality & Traits',
  interest: 'Interests & Hobbies',
  academic: 'School & Learning',
  medical: 'Health & Medical',
  general: 'General',
}

export const CONTEXT_TYPE_LABELS: Record<ArchiveContextType, string> = {
  preference: 'Preference',
  schedule: 'Schedule',
  personality: 'Personality',
  interest: 'Interest',
  academic: 'Academic',
  medical: 'Medical',
  wishlist_item: 'Wishlist',
  family_personality: 'Family Personality',
  family_rhythm: 'Family Rhythm',
  family_focus: 'Family Focus',
  faith_context: 'Faith',
  meeting_note: 'Meeting Note',
  general: 'General',
}
