/**
 * Build M Sub-phase B — Play Dashboard + Sticker Book
 *
 * Types for the Play Dashboard shell, paper craft icon picker, and the
 * modal queue that Sub-phase D will hook into for creature reveals.
 *
 * Sub-phase B builds the shell + picker. The reveal events here are
 * defined now so the queue surface is in place; Sub-phase D wires the
 * actual reveal modals (CreatureRevealModal + PageUnlockRevealModal).
 */

import type { Task } from './tasks'

/* ─────────────────────────────────────────────────────────────────────
 * Page-level props
 * ───────────────────────────────────────────────────────────────────── */

export interface PlayDashboardProps {
  /** Member id whose dashboard is being rendered (Play role) */
  memberId: string
  /** Family id for queries + RLS */
  familyId: string
  /** True when this dashboard is rendered inside the View As overlay */
  isViewAsOverlay?: boolean
}

/* ─────────────────────────────────────────────────────────────────────
 * Task icon picker (paper craft icons from platform_assets)
 * Soft-reference pattern matching visual_schedule_routine_steps:
 *   tasks.icon_asset_key  → platform_assets.feature_key
 *   tasks.icon_variant    → platform_assets.variant ('A' | 'B' | 'C')
 *
 * Looked up at render time so reseed cycles don't break references.
 * ───────────────────────────────────────────────────────────────────── */

export type TaskIconVariant = 'A' | 'B' | 'C'

export interface TaskIconSuggestion {
  /** platform_assets.feature_key — the stable string key (e.g. 'vs_teeth_top') */
  asset_key: string
  /** platform_assets.variant — defaults to 'B' (clearest paper-craft style) */
  variant: TaskIconVariant
  /** Friendly label for accessibility + browse view */
  display_name: string
  /** Vision-generated description (rich enough for embedding search to grip) */
  description: string
  /** Tag array (JSONB column normalized to string[] in the hook layer) */
  tags: string[]
  /** 128px URL — used by tile grid + picker thumbnails */
  size_128_url: string
  /** 512px URL — used by detail/preview surfaces */
  size_512_url: string
}

export interface TaskIconPickerProps {
  /** Currently selected icon, or null if no icon set yet */
  currentIcon: TaskIconSuggestion | null
  /** Live task title — drives the auto-suggest query */
  taskTitle: string
  /** Optional life area / category — boosts category-relevant matches */
  category?: string | null
  /** Called when mom picks a new icon (or clears the selection with null) */
  onChange: (icon: TaskIconSuggestion | null) => void
  /**
   * True if any selected assignee is a Play member. The picker hides
   * itself when false — adult/independent/guided shells don't render
   * paper-craft tile icons (per CLAUDE.md §16.7 convention).
   */
  assigneeIsPlayMember: boolean
}

/* ─────────────────────────────────────────────────────────────────────
 * Modal queue events (Sub-phase D will consume these)
 *
 * The Play Dashboard maintains a small FIFO queue of reveal events
 * pushed by useCompleteTask's onSuccess (after Sub-phase C wires the
 * gamification RPC). Each event drives one modal in sequence:
 *   - CreatureAwarded → CreatureRevealModal (Mossy Chest video)
 *   - PageUnlocked    → PageUnlockRevealModal (Fairy Door video)
 *
 * Sub-phase B leaves the queue in place but never pushes to it.
 * Sub-phase D wires the modals + the push.
 * ───────────────────────────────────────────────────────────────────── */

export type RevealEvent =
  | {
      type: 'creature_awarded'
      creatureId: string
      creatureName: string
      rarity: 'common' | 'rare' | 'legendary'
      stickerPageId: string | null
      /** Creature image URL for the reveal card (Sub-phase D) */
      creatureImageUrl: string | null
      /** Creature description for the reveal card (Sub-phase D) */
      creatureDescription: string | null
    }
  | {
      type: 'page_unlocked'
      pageId: string
      pageName: string
      sceneName: string
      /** Page thumbnail image URL for the reveal card (Sub-phase D) */
      pageImageUrl: string | null
    }

/* ─────────────────────────────────────────────────────────────────────
 * Sticker book + creature collection shapes
 *
 * Hook returns are kept narrow on purpose — only the columns the UI
 * actually reads. Sub-phase D will extend these as the detail modal
 * needs more fields.
 * ───────────────────────────────────────────────────────────────────── */

export interface StickerBookState {
  /** member_sticker_book_state.id */
  id: string
  family_member_id: string
  active_theme_id: string
  active_page_id: string | null
  page_unlock_interval: number
  is_enabled: boolean
  creatures_earned_total: number
  pages_unlocked_total: number
  /** Joined active page (null when no page unlocked yet — bootstrap is 1) */
  active_page: {
    id: string
    slug: string
    display_name: string
    scene: string
    image_url: string
  } | null
}

export interface MemberCreature {
  /** member_creature_collection.id */
  id: string
  family_member_id: string
  sticker_page_id: string | null
  position_x: number | null
  position_y: number | null
  awarded_at: string
  /** Joined creature definition */
  creature: {
    id: string
    slug: string
    display_name: string
    rarity: 'common' | 'rare' | 'legendary'
    image_url: string
    description: string | null
  }
}

export interface MemberPageUnlock {
  /** member_page_unlocks.id */
  id: string
  family_member_id: string
  unlocked_at: string
  unlocked_trigger_type:
    | 'bootstrap'
    | 'creature_count'
    | 'manual_unlock'
    | 'streak_milestone'
    | 'task_completion'
    | 'tracker_goal'
  creatures_at_unlock: number
  /** Joined sticker page definition */
  page: {
    id: string
    slug: string
    display_name: string
    scene: string
    image_url: string
    sort_order: number
  }
}

/* ─────────────────────────────────────────────────────────────────────
 * Tile grid helpers
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Tasks split into pending vs completed lanes for the grid layout.
 * Pending tiles render in the main grid; completed tiles slide into a
 * compact row below with a celebratory check mark.
 */
export interface PlayTaskGridSections {
  pending: Task[]
  completed: Task[]
}
