/**
 * coppa-cascade-plan — the EXECUTABLE mirror of src/lib/compliance/childDataTables.ts.
 *
 * childDataTables.ts (the frontend registry, PRD-40 Slice 1) classifies every
 * member-referencing table as hard_delete / scrub / preserve / not_applicable
 * and records the RATIONALE in free-text notes. This file is the Slice-4
 * EXECUTION plan derived from that same classification — it can't import the
 * frontend TS file directly (this runs in Deno, that runs in the Vite/browser
 * build), so it is a deliberate, test-guarded twin (same pattern as Convention
 * #271's SQL/TS Layer-1-predicate mirror: change one, change the other, the
 * consistency test — tests/coppa-cascade-plan-consistency.test.ts — must still
 * pass).
 *
 * Generic execution algorithm (coppa-deletion-cascade/index.ts):
 *   1. For every table, first process `hardDeleteColumns`: DELETE FROM table
 *      WHERE col = child_id, for EACH column (a match on ANY of these columns
 *      deletes the whole row — this is "the row IS the child's own data").
 *   2. For SURVIVING rows (not caught by step 1), process `scrubScalarColumns`:
 *      UPDATE table SET col = NULL WHERE col = child_id. If that raises a
 *      not-null violation (Postgres 23502 via PostgREST error.code), REASSIGN
 *      to the family's primary_parent (mom) instead of deleting the row.
 *      (Deleting the row on a not-null violation was the original design —
 *      found live to be a real correctness bug, 2026-08-24: `tasks.created_by`
 *      is NOT NULL, so a sibling's OWN task was hard-deleted outright instead
 *      of scrubbed. Reassign-to-mom is safe for authorship/actor columns
 *      because it never destroys a third party's legitimate content while
 *      still removing the child's id from the row.)
 *   3. For `scrubArrayColumns`: UPDATE table SET col = array_remove(col,
 *      child_id) WHERE child_id = ANY(col).
 *   4. `special` tables (earned_prizes, contracts) get bespoke handling in
 *      the cascade function — their hard-delete trigger is CONDITIONAL on a
 *      column being NON-NULL (family-level rows with a NULL owner must never
 *      be deleted, only scrubbed), which the generic column-match algorithm
 *      cannot express.
 *
 * `preserve` and `not_applicable` classified tables are absent from this
 * plan entirely — they are never touched by the cascade, by design.
 *
 * Some tables carry EXTRA scrub columns here that are NOT listed in
 * childDataTables.ts's `memberColumns` array, because that array is what the
 * frontend completeness vitest walks for TABLE-level detection (via
 * information_schema / migration parsing) — it doesn't need to be an
 * exhaustive column enumeration for every documented nuance. Each such
 * addition below cites the childDataTables.ts note it comes from.
 */

export interface CascadeTableSpec {
  /** Bare table name (public schema) or "schema.table" for non-public schemas. */
  table: string
  /** ANY match on these columns deletes the whole row. Processed FIRST. */
  hardDeleteColumns: string[]
  /** Processed on rows that survive step 1: null column, or delete row on a not-null violation. */
  scrubScalarColumns: string[]
  /** Processed on rows that survive step 1: array_remove(col, child_id). */
  scrubArrayColumns: string[]
}

/** Bespoke tables whose hard-delete trigger is CONDITIONAL, not a plain column match. */
export type SpecialTable = 'earned_prizes' | 'contracts'

export const SPECIAL_TABLES: SpecialTable[] = ['earned_prizes', 'contracts']

export const CASCADE_PLAN: CascadeTableSpec[] = [
  // ── Auth & Family (PRD-01, PRD-02) ────────────────────────────────────
  { table: 'member_permissions', hardDeleteColumns: ['target_member_id', 'granted_to'], scrubScalarColumns: ['granting_member_id'], scrubArrayColumns: [] },
  { table: 'member_feature_toggles', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['disabled_by'], scrubArrayColumns: [] },
  { table: 'view_as_sessions', hardDeleteColumns: ['viewing_as_id'], scrubScalarColumns: ['viewer_id'], scrubArrayColumns: [] },
  { table: 'view_as_permissions', hardDeleteColumns: ['target_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'permission_presets', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },

  // ── Subscription & Monetization (PRD-31) ──────────────────────────────
  { table: 'feature_demand_responses', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['actual_voter_id'], scrubArrayColumns: [] },
  { table: 'feature_expansion_dismissals', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['actual_dismisser_id'], scrubArrayColumns: [] },
  { table: 'feature_discovery_dismissals', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'ai_usage_tracking', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── LiLa AI System (PRD-05, PRD-41) — lila_conversations/lila_messages are
  //    ALSO the 90-day rolling retention target (R-12); this hard-delete
  //    entry additionally covers immediate consent-revocation deletion. ────
  { table: 'lila_conversations', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'lila_ethics_rejections', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  // context_person_ids UUID[] — extra column, note: "scrub the departing
  // child's id out of OTHER members' rows" (childDataTables.ts lila_tool_permissions).
  { table: 'lila_tool_permissions', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: ['context_person_ids'] },
  { table: 'lila_member_preferences', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'ai_output_scans', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Personal Growth (PRD-06 to PRD-08) ────────────────────────────────
  { table: 'guiding_stars', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'best_intentions', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: ['related_member_ids'] },
  { table: 'intention_iterations', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['acted_by'], scrubArrayColumns: [] },
  { table: 'self_knowledge', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  // Export path (Convention #279-pattern rationale, addendum §(c)) deliberately
  // does NOT filterKidPrivate() — but the DELETION cascade still hard-deletes
  // ALL of the child's journal entries regardless of visibility, per the PRD's
  // explicit list.
  { table: 'journal_entries', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'journal_visibility_settings', hardDeleteColumns: ['child_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'notepad_tabs', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'wizard_drafts', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'notepad_routing_stats', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'reflection_prompts', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'reflection_responses', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Tasks & Studio (PRD-09A, PRD-09B, PRD-17) ─────────────────────────
  { table: 'task_templates', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'tasks', hardDeleteColumns: ['assignee_id'], scrubScalarColumns: ['created_by', 'in_progress_member_id', 'mastery_approved_by'], scrubArrayColumns: [] },
  { table: 'task_assignments', hardDeleteColumns: ['family_member_id', 'member_id'], scrubScalarColumns: ['assigned_by'], scrubArrayColumns: [] },
  { table: 'task_completions', hardDeleteColumns: ['family_member_id', 'member_id'], scrubScalarColumns: ['acted_by', 'approved_by'], scrubArrayColumns: [] },
  { table: 'routine_step_completions', hardDeleteColumns: ['family_member_id', 'member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'task_claims', hardDeleteColumns: ['member_id', 'claimed_by'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'task_segments', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'studio_queue', hardDeleteColumns: ['owner_id'], scrubScalarColumns: ['requester_id'], scrubArrayColumns: [] },
  { table: 'lists', hardDeleteColumns: ['owner_id', 'subject_member_id'], scrubScalarColumns: ['created_by', 'archive_member_id'], scrubArrayColumns: [] },
  // list_items on the child's OWN lists cascade automatically via the `lists`
  // hard-delete (FK list_id -> lists, ON DELETE CASCADE). This entry covers
  // the child as ACTOR on someone ELSE's list only.
  { table: 'list_items', hardDeleteColumns: [], scrubScalarColumns: ['added_by', 'checked_by', 'gift_for', 'in_progress_member_id', 'mastery_approved_by'], scrubArrayColumns: [] },
  { table: 'list_shares', hardDeleteColumns: [], scrubScalarColumns: ['member_id', 'shared_with'], scrubArrayColumns: [] },
  { table: 'list_item_member_tracking', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'list_templates', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'guided_form_responses', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Dashboards & Calendar (PRD-14 family) ─────────────────────────────
  { table: 'dashboard_configs', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  // multiplayer_participants UUID[] — extra column, note: "scrub child's id
  // out of OTHER members' multiplayer widgets" (childDataTables.ts dashboard_widgets).
  // data_source_ids is EXPLICITLY excluded (childDataTables.ts flags it
  // "ambiguous entity type") — never touched here.
  { table: 'dashboard_widgets', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['assigned_member_id'], scrubArrayColumns: ['multiplayer_participants'] },
  { table: 'dashboard_widget_folders', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'widget_data_points', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['recorded_by_member_id'], scrubArrayColumns: [] },
  { table: 'widget_templates', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'calendar_events', hardDeleteColumns: [], scrubScalarColumns: ['created_by', 'approved_by', 'acted_by'], scrubArrayColumns: [] },
  { table: 'event_attendees', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'family_overview_configs', hardDeleteColumns: [], scrubScalarColumns: ['family_member_id'], scrubArrayColumns: ['selected_member_ids'] },

  // ── Family Hub (PRD-14D) ───────────────────────────────────────────────
  { table: 'family_best_intentions', hardDeleteColumns: [], scrubScalarColumns: ['created_by_member_id'], scrubArrayColumns: ['participating_member_ids'] },
  { table: 'family_intention_iterations', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'countdowns', hardDeleteColumns: [], scrubScalarColumns: ['created_by_member_id'], scrubArrayColumns: [] },

  // ── Meal Planning / KitchenCompass (PRD-42) ───────────────────────────
  { table: 'recipes', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'recipe_versions', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'meal_plan_entries', hardDeleteColumns: [], scrubScalarColumns: ['cook_member_id', 'created_by'], scrubArrayColumns: ['kids_helped_member_ids'] },
  { table: 'food_restrictions', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'meal_feedback', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['acted_by'], scrubArrayColumns: [] },
  { table: 'meal_pointers', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },

  // ── Victories (PRD-11) ─────────────────────────────────────────────────
  { table: 'victories', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['moms_pick_by'], scrubArrayColumns: [] },
  { table: 'victory_celebrations', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'victory_voice_preferences', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Archives & Context (PRD-13) ────────────────────────────────────────
  { table: 'archive_folders', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'archive_context_items', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['added_by'], scrubArrayColumns: [] },
  { table: 'archive_member_settings', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Communication (PRD-15) ─────────────────────────────────────────────
  { table: 'conversation_spaces', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'conversation_space_members', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'conversation_threads', hardDeleteColumns: [], scrubScalarColumns: ['started_by'], scrubArrayColumns: [] },
  { table: 'messages', hardDeleteColumns: ['sender_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'message_read_status', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'member_messaging_permissions', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['can_message_member_id'], scrubArrayColumns: [] },
  { table: 'message_coaching_settings', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'family_requests', hardDeleteColumns: ['sender_member_id', 'recipient_member_id'], scrubScalarColumns: ['processed_by'], scrubArrayColumns: [] },
  { table: 'notifications', hardDeleteColumns: ['recipient_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'notification_preferences', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'out_of_nest_members', hardDeleteColumns: [], scrubScalarColumns: ['invited_by'], scrubArrayColumns: [] },

  // ── ThoughtSift (PRD-34) ───────────────────────────────────────────────
  { table: 'board_personas', hardDeleteColumns: ['created_by'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'board_sessions', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'persona_favorites', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'perspective_lenses', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'platform_intelligence.persona_promotion_queue', hardDeleteColumns: [], scrubScalarColumns: ['submitted_by_member_id'], scrubArrayColumns: [] },

  // ── BookShelf (PRD-23) ─────────────────────────────────────────────────
  { table: 'bookshelf_items', hardDeleteColumns: [], scrubScalarColumns: ['uploaded_by_member_id'], scrubArrayColumns: [] },
  { table: 'bookshelf_summaries', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_insights', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_declarations', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_action_steps', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_questions', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_discussions', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_collections', hardDeleteColumns: [], scrubScalarColumns: ['created_by_member_id'], scrubArrayColumns: [] },
  { table: 'bookshelf_shares', hardDeleteColumns: [], scrubScalarColumns: ['shared_by_member_id', 'shared_with_member_id'], scrubArrayColumns: [] },
  { table: 'bookshelf_member_settings', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'journal_prompts', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_user_state', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'bookshelf_search_history', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── AI Vault (PRD-21A/B/C) ──────────────────────────────────────────────
  { table: 'vault_content_requests', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_copy_events', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_first_sightings', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_tool_sessions', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_user_bookmarks', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_user_progress', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'vault_user_visits', hardDeleteColumns: ['user_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'user_saved_prompts', hardDeleteColumns: ['user_id'], scrubScalarColumns: ['shared_with_member_id'], scrubArrayColumns: [] },

  // ── Communication Tools (PRD-21) ───────────────────────────────────────
  { table: 'communication_drafts', hardDeleteColumns: ['author_id', 'about_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'teaching_skill_history', hardDeleteColumns: ['member_id', 'about_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── MindSweep (PRD-17B) ────────────────────────────────────────────────
  { table: 'mindsweep_settings', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'mindsweep_holding', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'mindsweep_allowed_senders', hardDeleteColumns: [], scrubScalarColumns: ['added_by'], scrubArrayColumns: [] },
  { table: 'mindsweep_events', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'mindsweep_approval_patterns', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Infrastructure / Timer (PRD-36) ────────────────────────────────────
  { table: 'time_sessions', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['started_by', 'edited_by'], scrubArrayColumns: [] },
  { table: 'timer_configs', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Activity, Analytics & Admin (PRD-32) ───────────────────────────────
  { table: 'activity_log_entries', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'asset_suggestion_misses', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'beta_glitch_reports', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Homeschool / Compliance (PRD-28, PRD-28B) ──────────────────────────
  { table: 'homeschool_configs', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'homeschool_time_logs', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['approved_by'], scrubArrayColumns: [] },

  // ── Meetings (PRD-16) ───────────────────────────────────────────────────
  { table: 'meeting_agenda_items', hardDeleteColumns: ['related_member_id'], scrubScalarColumns: ['added_by'], scrubArrayColumns: [] },
  { table: 'meeting_participants', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'meeting_schedules', hardDeleteColumns: ['related_member_id'], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  // default_participant_ids UUID[] — extra column, childDataTables.ts note:
  // "Also carries default_participant_ids UUID[] — scrub child's id out."
  { table: 'meeting_templates', hardDeleteColumns: [], scrubScalarColumns: ['created_by', 'default_partner_id'], scrubArrayColumns: ['default_participant_ids'] },
  { table: 'meetings', hardDeleteColumns: ['related_member_id'], scrubScalarColumns: ['facilitator_member_id', 'started_by'], scrubArrayColumns: [] },

  // ── Gamification (PRD-24 family) ───────────────────────────────────────
  { table: 'gamification_configs', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'member_coloring_reveals', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'member_creature_collection', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'member_page_unlocks', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'member_sticker_book_state', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'color_reveal_progress', hardDeleteColumns: ['revealed_by_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'coloring_gallery', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Point Economy / PECON — append-only ledger, OD-2 carve-out ─────────
  { table: 'point_transactions', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['acted_by'], scrubArrayColumns: [] },
  { table: 'reward_shop_purchases', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: ['acted_by', 'processed_by'], scrubArrayColumns: [] },
  { table: 'reward_shop_items', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: ['audience_member_ids'] },
  // earned_prizes handled by the SPECIAL 'earned_prizes' bespoke branch —
  // NOT listed here (its hard-delete trigger is conditional on family_member_id
  // being non-NULL; the generic algorithm can't express that).
  { table: 'reward_proposals', hardDeleteColumns: ['proposer_member_id'], scrubScalarColumns: ['processed_by'], scrubArrayColumns: [] },

  // ── Connector Layer / Contracts — append-only ledgers, OD-2 carve-out ──
  // contracts handled by the SPECIAL 'contracts' bespoke branch — NOT listed
  // here (family_member_id IS NULL means family-wide/inherited, untouched).
  { table: 'contract_grant_log', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'deed_firings', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'deferred_grants', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'reward_reveal_attachments', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'reward_reveals', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'reveal_animation_pools', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },
  { table: 'assign_task_godmother_configs', hardDeleteColumns: [], scrubScalarColumns: ['specific_member_id'], scrubArrayColumns: [] },
  { table: 'pending_changes', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: ['affected_member_ids'] },

  // ── Family Goals & Prizes (Convention #278) — append-only, OD-2 carve-out.
  //    family_goal_contributions deletion MUST trigger evaluate_family_goal_award()
  //    recompute on every still-active goal touched — handled explicitly in
  //    the cascade function (not expressible generically). ───────────────
  { table: 'family_goal_contributions', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'family_goals', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: ['participating_member_ids'] },

  // ── Financial / Allowance (PRD-28) — append-only ledger, OD-2 carve-out ─
  { table: 'financial_transactions', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'allowance_configs', hardDeleteColumns: ['family_member_id', 'pool_owner_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'allowance_periods', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'allowance_dispatch_audit', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'loans', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'purchase_history', hardDeleteColumns: [], scrubScalarColumns: ['purchased_by'], scrubArrayColumns: [] },
  { table: 'gift_claims', hardDeleteColumns: [], scrubScalarColumns: ['claimed_by_member_id'], scrubArrayColumns: [] },
  { table: 'gift_history', hardDeleteColumns: ['member_id'], scrubScalarColumns: ['counterparty_member_id'], scrubArrayColumns: [] },

  // ── Randomizer / Practice ───────────────────────────────────────────────
  { table: 'randomizer_draws', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'practice_log', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Rhythms & Reflections (PRD-18) ─────────────────────────────────────
  { table: 'rhythm_completions', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'rhythm_configs', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Safety Monitoring (PRD-30) ──────────────────────────────────────────
  { table: 'safety_flags', hardDeleteColumns: ['flagged_member_id'], scrubScalarColumns: ['reviewed_by'], scrubArrayColumns: [] },
  { table: 'safety_monitoring_configs', hardDeleteColumns: ['monitored_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'safety_notification_recipients', hardDeleteColumns: ['recipient_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'safety_pattern_summaries', hardDeleteColumns: ['monitored_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'safety_sensitivity_configs', hardDeleteColumns: ['monitored_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Special Adults / Shifts ─────────────────────────────────────────────
  { table: 'special_adult_assignments', hardDeleteColumns: ['child_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'mom_self_restrictions', hardDeleteColumns: ['target_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'teen_sharing_overrides', hardDeleteColumns: ['member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Visual Schedule ──────────────────────────────────────────────────────
  { table: 'visual_schedule_member_assignments', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },
  { table: 'visual_schedule_member_tasks', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Family Members' emails ──────────────────────────────────────────────
  { table: 'member_emails', hardDeleteColumns: ['family_member_id'], scrubScalarColumns: [], scrubArrayColumns: [] },

  // ── Relationship & Private Notes ────────────────────────────────────────
  { table: 'relationship_notes', hardDeleteColumns: ['person_a_id', 'person_b_id'], scrubScalarColumns: ['author_id'], scrubArrayColumns: [] },
  { table: 'private_notes', hardDeleteColumns: ['about_member_id'], scrubScalarColumns: ['author_id'], scrubArrayColumns: [] },

  // ── Wishlists (PRD-43) ──────────────────────────────────────────────────
  { table: 'wishlist_share_links', hardDeleteColumns: [], scrubScalarColumns: ['created_by'], scrubArrayColumns: [] },

  // ── Studio Wizards ───────────────────────────────────────────────────────
  { table: 'wizard_templates', hardDeleteColumns: [], scrubScalarColumns: ['original_author_id'], scrubArrayColumns: [] },

  // Note: shift_sessions, access_schedules, account_deletions (not_applicable)
  // and coppa_consents / parent_verifications / parent_verification_attempts /
  // retention_deletion_log / parental_data_exports (preserve) are intentionally
  // ABSENT — never touched by the cascade, by design (childDataTables.ts).
]

/** Fast lookup: table name -> its plan entry. */
const BY_TABLE = new Map(CASCADE_PLAN.map((e) => [e.table, e]))

export function getCascadePlanEntry(table: string): CascadeTableSpec | undefined {
  return BY_TABLE.get(table)
}
