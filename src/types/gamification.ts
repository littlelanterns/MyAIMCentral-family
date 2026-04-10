/**
 * Build M Sub-phase C — Gamification Pipeline Result Types
 *
 * These mirror the JSONB payload returned by the SECURITY DEFINER RPC
 * `public.roll_creature_for_completion(p_task_completion_id uuid)` defined
 * in migration 00000000100115_play_dashboard_sticker_book.sql.
 *
 * The RPC has several early-return branches (error, disabled, already
 * processed, skipped by completion_type, sticker book disabled, roll
 * failed, no creature found) plus a full success branch. We model all of
 * them as one flat, all-optional interface because the consumer just
 * checks a few flags and uses the data that's present.
 *
 * Narrowing is done via the helper functions at the bottom of this file,
 * not via a discriminated union — a union would force every consumer to
 * write guard ladders even when they only care about one outcome.
 *
 * Sub-phase C wires this in `useCompleteTask`, `useApproveCompletion`,
 * `useApproveTaskCompletion`, and `useApproveMasterySubmission`.
 * Sub-phase D consumes the `creature` + `page` fields for reveal modals.
 */

/** Creature award payload (present when creature_awarded === true) */
export interface GamificationCreatureAward {
  id: string
  slug: string
  display_name: string
  rarity: 'common' | 'rare' | 'legendary'
  description: string | null
  image_url: string | null
}

/** Page unlock payload (present when page_unlocked === true) */
export interface GamificationPageUnlock {
  id: string
  slug: string
  display_name: string
  scene: string | null
  season: string | null
  image_url: string | null
}

/**
 * Flat, all-optional shape. The RPC's early-return branches populate
 * a subset of these fields; the full-success branch populates most.
 *
 * Branches (each returns at most the fields listed):
 *
 *   - Error                         → { error }
 *   - Gamification disabled          → { gamification_disabled }
 *   - Idempotent re-fire             → { already_processed, new_point_total, new_streak }
 *   - Skipped by completion_type     → { skipped_completion_type }
 *   - Sticker book disabled / roll   → { points_awarded, new_point_total, creature_awarded:false,
 *     failed / theme empty               creature:null, page_unlocked:false, page:null,
 *                                        streak_updated, new_streak, streak_milestone }
 *   - Full success (creature won)    → all fields populated, creature non-null,
 *                                      page non-null iff page_unlocked
 */
export interface GamificationResult {
  // Error / skip paths
  error?: 'task_completion_not_found' | 'task_not_found' | 'family_member_not_found'
  gamification_disabled?: boolean
  already_processed?: boolean
  skipped_completion_type?: string

  // Success path (any branch past Step 3 populates these)
  points_awarded?: number
  new_point_total?: number
  creature_awarded?: boolean
  creature?: GamificationCreatureAward | null
  page_unlocked?: boolean
  page?: GamificationPageUnlock | null
  streak_updated?: boolean
  new_streak?: number
  streak_milestone?: number | null

  // Phase 1 earning strategy additions
  segment_completed?: { segment_id: string; segment_name: string } | null
  coloring_reveals_advanced?: Array<{
    reveal_id: string
    new_step: number
    total_steps: number
    is_complete: boolean
    image_slug: string
  }>
}

/* ─────────────────────────────────────────────────────────────────────
 * Narrowing helpers
 * Consumers: PlayDashboard modal queue, hook onSuccess handlers.
 * ───────────────────────────────────────────────────────────────────── */

/** True when the RPC actually awarded points (any non-skip branch). */
export function gamificationDidAwardPoints(
  r: GamificationResult | null | undefined,
): boolean {
  if (!r) return false
  if (r.error || r.gamification_disabled || r.already_processed) return false
  if (r.skipped_completion_type) return false
  return typeof r.points_awarded === 'number' && r.points_awarded > 0
}

/** True when a creature was rolled, picked, and saved to the member's collection. */
export function gamificationDidAwardCreature(
  r: GamificationResult | null | undefined,
): r is GamificationResult & { creature: GamificationCreatureAward } {
  return !!r && r.creature_awarded === true && !!r.creature
}

/** True when a sticker page was unlocked this turn. */
export function gamificationDidUnlockPage(
  r: GamificationResult | null | undefined,
): r is GamificationResult & { page: GamificationPageUnlock } {
  return !!r && r.page_unlocked === true && !!r.page
}
