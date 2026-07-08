/**
 * PRD-42 KitchenCompass — types for recipes / recipe_versions /
 * meal_plan_entries / food_restrictions / meal_feedback / meal_settings /
 * meal_pointers.
 *
 * See prds/daily-life/PRD-42-Meal-Planning.md and
 * claude/dispatch-factory/PRD42.md for the full spec + rulings.
 * food_restrictions has NO is_included_in_ai — always-include inversion
 * (ruling 3 / D-42-4). meal_feedback is celebration-only ('loved'|'liked').
 */

export type RecipeSourceType = 'link' | 'photo' | 'paste' | 'went_well' | 'manual' | 'mindsweep'
export type RecipeEffortLevel = 'quick' | 'standard' | 'project'
export type RecipeRotation = 'favorite' | 'normal' | 'rest' | 'retired'
export type RecipeApprovalStatus = 'approved' | 'suggested'

export interface RecipeIngredient {
  text: string
  quantity: number | null
  unit: string | null
  item: string
  store_category: string | null
  optional: boolean
  scaling_note: string | null
}

export interface RecipeInstructionStep {
  step: number
  text: string
}

export interface Recipe {
  id: string
  family_id: string
  created_by: string
  title: string
  description: string | null
  source_type: RecipeSourceType
  source_url: string | null
  photo_urls: string[]
  ingredients: RecipeIngredient[]
  instructions: RecipeInstructionStep[]
  prep_minutes: number | null
  cook_minutes: number | null
  total_minutes: number | null
  servings_base: number | null
  effort_level: RecipeEffortLevel | null
  equipment_tags: string[]
  tags: string[]
  tradition_tags: string[]
  texture_flavor_tags: string[]
  rotation: RecipeRotation
  approval_status: RecipeApprovalStatus
  times_made: number
  is_included_in_ai: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface RecipeVersion {
  id: string
  recipe_id: string
  family_id: string
  label: string
  scale_factor: number | null
  servings: number | null
  ingredients: RecipeIngredient[]
  notes: string | null
  created_by: string
  created_at: string
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'custom'
export type MealPlanEntryStatus = 'planned' | 'made' | 'skipped' | 'moved'

export interface MealPlanEntry {
  id: string
  family_id: string
  entry_date: string
  meal_slot: MealSlot
  custom_slot_label: string | null
  recipe_id: string | null
  recipe_version_id: string | null
  title_snapshot: string
  status: MealPlanEntryStatus
  made_at: string | null
  cook_member_id: string | null
  kids_helped_member_ids: string[]
  prep_task_id: string | null
  servings_planned: number | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/** Joined shape used on plan views — the entry plus enough recipe context to render a card and scale ingredients for shopping handoff. */
export interface MealPlanEntryWithRecipe extends MealPlanEntry {
  recipe: Pick<Recipe, 'id' | 'title' | 'photo_urls' | 'effort_level' | 'equipment_tags' | 'total_minutes' | 'ingredients' | 'servings_base'> | null
}

export type FoodRestrictionType = 'allergy' | 'intolerance' | 'medical_diet' | 'religious' | 'strong_dislike'
export type FoodRestrictionSeverity = 'life_threatening' | 'avoid' | 'limit'

export interface FoodRestriction {
  id: string
  family_id: string
  member_id: string | null
  restriction_type: FoodRestrictionType
  item: string
  severity: FoodRestrictionSeverity
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type MealFeedbackValue = 'loved' | 'liked'

export interface MealFeedback {
  id: string
  family_id: string
  recipe_id: string
  meal_plan_entry_id: string | null
  member_id: string
  feedback: MealFeedbackValue
  note: string | null
  photo_url: string | null
  acted_by: string | null
  created_at: string
}

export interface MealSettingsUseUpNote {
  text: string
  updated_at: string
}

export interface MealSettings {
  family_id: string
  enabled_slots: MealSlot[]
  default_servings: number | null
  show_on_hub: boolean
  kid_recipe_browsing: boolean
  prep_reminders_enabled: boolean
  prep_reminder_time: string
  connection_prompts_enabled: boolean
  standing_direction: string | null
  nutrition_direction: string | null
  use_up_note: MealSettingsUseUpNote | null
  created_at: string
  updated_at: string
}

export interface MealPointer {
  id: string
  family_id: string
  recipe_id: string | null
  technique_tag: string | null
  text: string
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

/** Result row shape from the match_recipes RPC (semantic search). */
export interface MatchRecipesResult {
  id: string
  title: string
  description: string | null
  effort_level: RecipeEffortLevel | null
  total_minutes: number | null
  rotation: RecipeRotation
  approval_status: RecipeApprovalStatus
  similarity: number
}

/** recipe-extract Edge Function request/response shapes. */
export type RecipeExtractMode = 'link' | 'photo' | 'paste' | 'went_well' | 'scale_assist'

export interface RecipeExtractRequest {
  mode: RecipeExtractMode
  url?: string
  text?: string
  photo_base64?: string[]
  went_well_description?: string
  // scale_assist mode
  ingredients?: RecipeIngredient[]
  scale_factor?: number
}

export interface RecipeExtractResult {
  title: string
  description: string | null
  ingredients: RecipeIngredient[]
  instructions: RecipeInstructionStep[]
  prep_minutes: number | null
  cook_minutes: number | null
  total_minutes: number | null
  servings_base: number | null
  effort_level: RecipeEffortLevel | null
  equipment_tags: string[]
  tags: string[]
  /** Per-field confidence hints for the HITM review card (low-confidence fields get amber-shaded). */
  low_confidence_fields?: string[]
}

export interface RecipeExtractResponse {
  crisis?: boolean
  response?: string
  result?: RecipeExtractResult
  error?: string
}
