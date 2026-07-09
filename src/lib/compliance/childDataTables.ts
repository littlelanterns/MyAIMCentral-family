/**
 * childDataTables — the canonical registry of every table carrying a
 * family_members-referencing column, classified per PRD-40's deletion-
 * cascade taxonomy.
 *
 * PRD-40 Convention (CLAUDE.md, "every new child-scoped table MUST be
 * registered in the child_data_tables registry, and its RLS policies MUST
 * include the active-consent check, and it MUST be covered by the scheduled
 * deletion cascade. No exceptions — this is a legal requirement."):
 * this file IS that registry.
 *
 * Derivation method (decision file R-6): walked `information_schema` for
 * every table in `public` and `platform_intelligence` carrying a foreign
 * key to `family_members`, cross-checked against every column matching
 * `%member_id%` (name-pattern search, catches columns that reference
 * family_members without a formal FK constraint — this codebase has many).
 * 171 tables found (170 + `families.primary_parent_id`, caught separately
 * since "primary_parent_id" doesn't match either search pattern).
 *
 * Classification (PRD-40 Cascade Behavior table + decision file §5):
 *   - hard_delete   — the row IS the child's own data ("data about the
 *                     child"). Deleted outright when consent is revoked.
 *   - scrub         — the child appears as a secondary actor/reference on
 *                     a row that fundamentally belongs to someone else, or
 *                     inside a shared array column. The child's reference
 *                     is removed; the row itself is preserved for the
 *                     remaining member(s).
 *   - preserve       — content authored by OTHER family members that merely
 *                     mentions or references the child (siblings' own
 *                     journals, etc.). Never touched by the cascade.
 *   - not_applicable — the member column can never realistically resolve to
 *                     a minor (e.g. always the primary parent, or a
 *                     Special-Adult-only table). No cascade action needed.
 *
 * This is Slice 1 scope: DERIVE and CLASSIFY. The actual cascade SQL that
 * walks this registry and performs the deletes/scrubs is Slice 4
 * (Rights + Lifecycle). Any table added after this registry was written
 * MUST be classified here before it ships — the registry-completeness
 * vitest (tests/coppa-registry-completeness.test.ts) fails CI until it is.
 */

export type CascadeClassification = 'hard_delete' | 'scrub' | 'preserve' | 'not_applicable'

export interface ChildDataTableEntry {
  /** Bare table name (public schema) or "schema.table" for non-public schemas. */
  table: string
  /** Every column on this table that references family_members.id (by FK or by established naming convention). */
  memberColumns: string[]
  classification: CascadeClassification
  /** Rationale, scrub instructions, or dual-classification notes when a table's columns don't share one verdict. */
  notes: string
}

export const CHILD_DATA_TABLES: ChildDataTableEntry[] = [
  // ── Auth & Family (PRD-01, PRD-02) ────────────────────────────────────
  // Note: families.primary_parent_id REFERENCES auth.users(id) directly, NOT
  // family_members — verified against migration 00000000000001 (the original
  // CREATE TABLE). It is deliberately NOT a registry entry.
  { table: 'access_schedules', memberColumns: ['member_id'], classification: 'not_applicable',
    notes: 'Special Adult / co-parent access-window scheduling (Convention: "access_schedules replaces shift_schedules for Special Adult/co-parent access windows"). Adults only in practice; if a row ever targets a minor, treat as hard_delete on next registry review.' },
  { table: 'account_deletions', memberColumns: ['requested_by'], classification: 'not_applicable',
    notes: 'Account-level (not COPPA-child-level) deletion request tracking; requested_by is always the account-holding parent.' },
  { table: 'member_permissions', memberColumns: ['granting_member_id', 'target_member_id', 'granted_to'], classification: 'hard_delete',
    notes: 'Keyed on target_member_id/granted_to = the child the grant is FOR. Whole grant row is specific to this child. granting_member_id is almost always mom — scrub that reference only if it somehow equals the departing child.' },
  { table: 'member_feature_toggles', memberColumns: ['member_id', 'disabled_by'], classification: 'hard_delete',
    notes: 'member_id = whose feature toggle this is — per-child config, hard delete. disabled_by (actor) scrub if it happens to be the departing child acting on a sibling toggle (rare).' },
  { table: 'view_as_sessions', memberColumns: ['viewer_id', 'viewing_as_id'], classification: 'hard_delete',
    notes: 'Addendum (b)(5): rows where viewing_as_id = child are records of the child being inspected — hard delete. view_as_feature_exclusions cascades via its session FK. viewer_id = child is exceedingly rare (children don’t have View-As); scrub if it occurs.' },
  { table: 'view_as_permissions', memberColumns: ['target_member_id', 'viewer_id'], classification: 'hard_delete',
    notes: 'Keyed on target_member_id (permission entries specifically about viewing this child). viewer_id = child is not applicable (children are never viewers).' },
  { table: 'permission_presets', memberColumns: ['created_by'], classification: 'scrub',
    notes: 'Mom-authored in practice. Scrub authorship if ever the departing child; preserve the preset for the family.' },

  // ── Subscription & Monetization (PRD-31) ──────────────────────────────
  { table: 'feature_demand_responses', memberColumns: ['family_member_id', 'actual_voter_id'], classification: 'hard_delete',
    notes: 'The child’s own PlannedExpansionCard vote/note. actual_voter_id is the same person unless a View-As vote-on-behalf occurred; scrub if different.' },
  { table: 'feature_expansion_dismissals', memberColumns: ['family_member_id', 'actual_dismisser_id'], classification: 'hard_delete',
    notes: 'The child’s own dismissal preference.' },
  { table: 'feature_discovery_dismissals', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own permanent dismissal record (Convention: "dismissals are permanent per member").' },
  { table: 'ai_usage_tracking', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Per-row AI usage/cost attributed to this specific child.' },

  // ── LiLa AI System (PRD-05, PRD-41) ────────────────────────────────────
  { table: 'lila_conversations', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Also subject to the 90-day rolling retention sweep independent of consent status (PRD-40 Retention Policy).' },
  { table: 'lila_ethics_rejections', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Decision file R-7/OD-2 explicit: PRD-41 append-only compliance log, hard-deleted for a revoked child under the COPPA carve-out.' },
  { table: 'lila_tool_permissions', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Per-member AI tool grant config. Also carries a context_person_ids UUID[] column (who this member’s AI context includes) — scrub the departing child’s id out of OTHER members’ rows at cascade time.' },
  { table: 'lila_member_preferences', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Per-child AI tone/preference config.' },
  { table: 'ai_output_scans', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Decision file R-7/OD-2 explicit: PRD-41 append-only ethics-scan queue, hard-deleted under the COPPA carve-out.' },

  // ── Personal Growth (PRD-06 to PRD-08) ────────────────────────────────
  { table: 'guiding_stars', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'PRD explicit list item.' },
  { table: 'best_intentions', memberColumns: ['member_id', 'related_member_ids'], classification: 'hard_delete',
    notes: 'Owner row: hard delete on member_id. related_member_ids UUID[] on OTHER members’ rows: scrub the child’s id out.' },
  { table: 'intention_iterations', memberColumns: ['member_id', 'acted_by'], classification: 'hard_delete',
    notes: 'member_id = whose tally entry this is, hard delete. acted_by (View-As/on-behalf actor) scrub if different.' },
  { table: 'self_knowledge', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'PRD explicit list item (InnerWorkings).' },
  { table: 'journal_entries', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'PRD explicit list item. Addendum (c): the export path deliberately does NOT filterKidPrivate() so this is included in mom’s formal review/export even for private-visibility entries.' },
  { table: 'journal_visibility_settings', memberColumns: ['child_member_id', 'parent_member_id'], classification: 'hard_delete',
    notes: 'Keyed on child_member_id — visibility config specific to this child-parent pair.' },
  { table: 'notepad_tabs', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own Smart Notepad tabs.' },
  { table: 'notepad_routing_stats', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Per-member routing frequency stats.' },
  { table: 'reflection_prompts', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own reflection prompt set.' },
  { table: 'reflection_responses', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own reflection answers.' },

  // ── Tasks & Studio (PRD-09A, PRD-09B, PRD-17) ─────────────────────────
  { table: 'task_templates', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored in practice; scrub authorship, preserve template for siblings. Also carries homework_subject_ids UUID[] (references homeschool_subjects, not family_members — not in scope here).' },
  { table: 'tasks', memberColumns: ['assignee_id', 'created_by', 'in_progress_member_id', 'mastery_approved_by'], classification: 'hard_delete',
    notes: 'PRD explicit: "child is assignee or creator." Hard delete keyed on assignee_id. created_by/in_progress_member_id/mastery_approved_by scrub when they reference the child on a task NOT assigned to them.' },
  { table: 'task_assignments', memberColumns: ['family_member_id', 'member_id', 'assigned_by'], classification: 'hard_delete',
    notes: 'Assignment record keyed to this specific child. assigned_by (mom, usually) scrub.' },
  { table: 'task_completions', memberColumns: ['family_member_id', 'member_id', 'acted_by', 'approved_by'], classification: 'hard_delete',
    notes: 'PRD explicit list item. acted_by/approved_by (mom’s approval action) scrub if different from the completer.' },
  { table: 'routine_step_completions', memberColumns: ['family_member_id', 'member_id'], classification: 'hard_delete', notes: 'The child’s own step-completion records.' },
  { table: 'task_claims', memberColumns: ['member_id', 'claimed_by'], classification: 'hard_delete', notes: 'The child’s own opportunity claim.' },
  { table: 'task_segments', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own day-segment config (Build M).' },
  { table: 'studio_queue', memberColumns: ['owner_id', 'requester_id'], classification: 'hard_delete',
    notes: 'Keyed on owner_id (the child’s own queue item). requester_id scrub when a cross-member request targeted the child but is owned by someone else.' },
  { table: 'lists', memberColumns: ['owner_id', 'created_by', 'archive_member_id', 'subject_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on owner_id (child’s own lists) OR subject_member_id (PRD-43 gift-ideas list ABOUT this child — "about the child" rule). created_by/archive_member_id scrub when they reference the child but owner_id points elsewhere.' },
  { table: 'list_items', memberColumns: ['added_by', 'checked_by', 'gift_for', 'in_progress_member_id', 'mastery_approved_by'], classification: 'scrub',
    notes: 'Items on the child’s OWN lists cascade automatically when the parent `lists` row hard-deletes (FK list_id -> lists). This entry covers the child appearing as an ACTOR (checked_by/added_by/in_progress_member_id/mastery_approved_by) or gift-ideas subject (gift_for) on someone ELSE’S list — scrub those references, preserve the item.' },
  { table: 'list_shares', memberColumns: ['member_id', 'shared_with'], classification: 'scrub',
    notes: 'shared_with = child received a share — remove their access row, preserve the share for the original owner and other recipients.' },
  { table: 'list_item_member_tracking', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Per-member completion tracking on a shared list item, specific to this child’s own history.' },
  { table: 'list_templates', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored in practice; scrub authorship, preserve template.' },
  { table: 'guided_form_responses', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own worksheet answers.' },

  // ── Dashboards & Calendar (PRD-14 family) ─────────────────────────────
  { table: 'dashboard_configs', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own dashboard layout config.' },
  { table: 'dashboard_widgets', memberColumns: ['family_member_id', 'assigned_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on family_member_id (child’s own dashboard widget). Also carries multiplayer_participants UUID[] (scrub child’s id out of OTHER members’ multiplayer widgets) and data_source_ids (ambiguous entity type — flag for Slice 4 review, not necessarily member ids).' },
  { table: 'dashboard_widget_folders', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own widget folder.' },
  { table: 'widget_data_points', memberColumns: ['family_member_id', 'recorded_by_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on family_member_id (the tracked child). recorded_by_member_id (e.g. mom logging on the child’s behalf) scrub if different — moot in practice since the whole row already deletes.' },
  { table: 'widget_templates', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own saved widget template.' },
  { table: 'calendar_events', memberColumns: ['created_by', 'approved_by', 'acted_by'], classification: 'scrub',
    notes: 'Events are shared family calendar items, not one child’s exclusive data. Scrub actor references; event preserved for other attendees. event_attendees (below) hard-deletes the child’s OWN attendee row.' },
  { table: 'event_attendees', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'PRD explicit rule: "hard delete child’s attendee rows, keep events."' },
  { table: 'family_overview_configs', memberColumns: ['family_member_id', 'selected_member_ids'], classification: 'scrub',
    notes: 'family_member_id is the viewing mom/adult’s own FO config (not typically a child). selected_member_ids UUID[] includes the child as a viewed column — scrub their id from the array.' },

  // ── Family Hub (PRD-14D) ───────────────────────────────────────────────
  { table: 'family_best_intentions', memberColumns: ['created_by_member_id', 'participating_member_ids'], classification: 'scrub',
    notes: 'Family-wide intention; scrub created_by_member_id (rare, child-authored) and remove child’s id from participating_member_ids UUID[]. Goal preserved for remaining family.' },
  { table: 'family_intention_iterations', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own tally entry on a family intention.' },
  { table: 'countdowns', memberColumns: ['created_by_member_id'], classification: 'scrub', notes: 'Mom-authored in practice; scrub authorship, preserve countdown for family.' },

  // ── Meal Planning / KitchenCompass (PRD-42) ───────────────────────────
  { table: 'recipes', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored in practice; scrub, preserve recipe for family.' },
  { table: 'recipe_versions', memberColumns: ['created_by'], classification: 'scrub', notes: 'Scrub authorship, preserve version.' },
  { table: 'meal_plan_entries', memberColumns: ['cook_member_id', 'created_by', 'kids_helped_member_ids'], classification: 'scrub',
    notes: 'Family meal-plan row; scrub cook_member_id/created_by if the child cooked/planned, remove child’s id from kids_helped_member_ids UUID[]. Entry preserved for the family meal history.' },
  { table: 'food_restrictions', memberColumns: ['member_id', 'created_by'], classification: 'hard_delete', notes: 'member_id = whose dietary/health restriction this is — "about the child" personal health data (D-42-4 always-include). created_by scrub.' },
  { table: 'meal_feedback', memberColumns: ['member_id', 'acted_by'], classification: 'hard_delete', notes: 'The child’s own reaction/feedback on a meal — personal preference data.' },
  { table: 'meal_pointers', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored "how WE do it" note; scrub authorship, preserve pointer.' },

  // ── Victories (PRD-11) ─────────────────────────────────────────────────
  { table: 'victories', memberColumns: ['family_member_id', 'moms_pick_by'], classification: 'hard_delete', notes: 'Hard delete keyed on family_member_id. moms_pick_by is always mom — never the departing child.' },
  { table: 'victory_celebrations', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own celebration narrative.' },
  { table: 'victory_voice_preferences', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own voice preference.' },

  // ── Archives & Context (PRD-13) ────────────────────────────────────────
  { table: 'archive_folders', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own archive folder tree.' },
  { table: 'archive_context_items', memberColumns: ['member_id', 'added_by'], classification: 'hard_delete',
    notes: 'Hard delete keyed on member_id — PRD Cascade rule: "Relationship notes about the child — hard delete." added_by (mom, usually) scrub only if member_id points elsewhere (child added a note about a sibling).' },
  { table: 'archive_member_settings', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own archive settings.' },

  // ── Communication (PRD-15) ─────────────────────────────────────────────
  { table: 'conversation_spaces', memberColumns: ['created_by'], classification: 'scrub', notes: 'Scrub authorship; space preserved for remaining members.' },
  { table: 'conversation_space_members', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Join-table row: the child’s own membership in a space. Hard delete the row, preserve the space and other members.' },
  { table: 'conversation_threads', memberColumns: ['started_by'], classification: 'scrub', notes: 'Scrub actor; thread content preserved for other participants.' },
  { table: 'messages', memberColumns: ['sender_member_id'], classification: 'hard_delete', notes: 'Data collected FROM the child (their own authored PII) — hard delete, not the "sibling content" preserve rule (that rule is for content authored BY OTHERS mentioning the child).' },
  { table: 'message_read_status', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Join-table row: the child’s own read-receipt.' },
  { table: 'member_messaging_permissions', memberColumns: ['member_id', 'can_message_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on member_id (the child’s own permission grants). can_message_member_id scrub when the child is the TARGET of someone else’s permission row.' },
  { table: 'message_coaching_settings', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own coaching toggle.' },
  { table: 'family_requests', memberColumns: ['sender_member_id', 'recipient_member_id', 'processed_by'], classification: 'hard_delete',
    notes: 'Hard delete when EITHER sender_member_id or recipient_member_id is the child — the whole request is from/to this child. processed_by (mom) scrub.' },
  { table: 'notifications', memberColumns: ['recipient_member_id'], classification: 'hard_delete', notes: 'Notifications addressed to this child.' },
  { table: 'notification_preferences', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own preference config.' },
  { table: 'out_of_nest_members', memberColumns: ['invited_by'], classification: 'scrub', notes: 'Out-of-nest members are NOT family_members rows themselves (Convention #142). Scrub invited_by if it was the child (rare, children don’t typically invite); preserve the out-of-nest record.' },

  // ── ThoughtSift (PRD-34) ───────────────────────────────────────────────
  { table: 'board_personas', memberColumns: ['created_by'], classification: 'hard_delete', notes: 'Family-scoped personal_custom personas are literally the child’s own AI-toy creation (Convention #97: these NEVER enter the platform intelligence pipeline anyway) — treat as the child’s own data.' },
  { table: 'board_sessions', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own ThoughtSift session.' },
  { table: 'persona_favorites', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own favorited personas.' },
  { table: 'perspective_lenses', memberColumns: ['created_by'], classification: 'scrub', notes: 'Custom lens; scrub authorship if child-created, preserve lens for family use.' },
  { table: 'platform_intelligence.persona_promotion_queue', memberColumns: ['submitted_by_member_id'], classification: 'scrub',
    notes: 'Platform-level governance table. Per Convention #97, a child’s personal_custom persona should never reach this queue — scrub the submitter reference defensively if it ever does.' },

  // ── BookShelf (PRD-23) ─────────────────────────────────────────────────
  { table: 'bookshelf_items', memberColumns: ['uploaded_by_member_id'], classification: 'scrub', notes: 'Scrub uploader; book preserved for family library (siblings may still be reading it).' },
  { table: 'bookshelf_summaries', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own personal highlight/summary of a book.' },
  { table: 'bookshelf_insights', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own personal insight.' },
  { table: 'bookshelf_declarations', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own declaration.' },
  { table: 'bookshelf_action_steps', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own action step.' },
  { table: 'bookshelf_questions', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own question.' },
  { table: 'bookshelf_discussions', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own BookShelf discussion conversation.' },
  { table: 'bookshelf_collections', memberColumns: ['created_by_member_id'], classification: 'scrub', notes: 'Scrub authorship, preserve collection for family.' },
  { table: 'bookshelf_shares', memberColumns: ['shared_by_member_id', 'shared_with_member_id'], classification: 'scrub',
    notes: 'Scrub whichever reference is the departing child; preserve the row for the remaining party when still meaningful.' },
  { table: 'bookshelf_member_settings', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own BookShelf settings.' },
  { table: 'journal_prompts', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own personal journal prompt (BookShelf-sourced).' },
  { table: 'bookshelf_user_state', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own heart/note/is_included_in_ai state on extractions.' },
  { table: 'bookshelf_search_history', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own search history.' },

  // ── AI Vault (PRD-21A/B/C) ──────────────────────────────────────────────
  { table: 'vault_content_requests', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own content request. Note: "user_id" here genuinely FKs to family_members(id), not auth.users.' },
  { table: 'vault_copy_events', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own copy-event log.' },
  { table: 'vault_first_sightings', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own first-seen tracking.' },
  { table: 'vault_tool_sessions', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own tool session.' },
  { table: 'vault_user_bookmarks', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own bookmarks.' },
  { table: 'vault_user_progress', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own progress tracking.' },
  { table: 'vault_user_visits', memberColumns: ['user_id'], classification: 'hard_delete', notes: 'The child’s own visit log.' },
  { table: 'user_saved_prompts', memberColumns: ['user_id', 'shared_with_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on user_id (the child’s own saved prompt). shared_with_member_id scrub when the child is the recipient of someone ELSE’S saved prompt.' },

  // ── Communication Tools (PRD-21) ───────────────────────────────────────
  { table: 'communication_drafts', memberColumns: ['author_id', 'about_member_id'], classification: 'hard_delete',
    notes: 'Hard delete when EITHER author_id (child’s own draft) or about_member_id (a draft ABOUT this child — "notes about the child" rule) matches the departing child.' },
  { table: 'teaching_skill_history', memberColumns: ['member_id', 'about_member_id'], classification: 'hard_delete',
    notes: 'Hard delete when EITHER member_id (child’s own coaching history) or about_member_id (a coaching record specifically ABOUT this child) matches.' },

  // ── MindSweep (PRD-17B) ────────────────────────────────────────────────
  { table: 'mindsweep_settings', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own MindSweep settings.' },
  { table: 'mindsweep_holding', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own captured-but-unprocessed items.' },
  { table: 'mindsweep_allowed_senders', memberColumns: ['added_by'], classification: 'scrub', notes: 'Family-level allowed-senders list; scrub actor.' },
  { table: 'mindsweep_events', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own sweep event log.' },
  { table: 'mindsweep_approval_patterns', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own learned auto-route pattern.' },

  // ── Infrastructure / Timer (PRD-36) ────────────────────────────────────
  { table: 'time_sessions', memberColumns: ['family_member_id', 'started_by', 'edited_by'], classification: 'hard_delete',
    notes: 'Hard delete keyed on family_member_id (whose timer session). started_by/edited_by scrub if a different actor started/edited on the child’s behalf — moot since the row already deletes when family_member_id = child.' },
  { table: 'timer_configs', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own timer preferences.' },

  // ── Activity, Analytics & Admin (PRD-32) ───────────────────────────────
  { table: 'activity_log_entries', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own activity feed entries.' },
  { table: 'asset_suggestion_misses', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Low-value diagnostic telemetry row tied to a specific member session; hard delete for consistency/simplicity.' },
  { table: 'beta_glitch_reports', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own bug report, if any.' },

  // ── Homeschool / Compliance (PRD-28, PRD-28B) ──────────────────────────
  { table: 'homeschool_configs', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Dual-record pattern (Convention #226): non-NULL family_member_id = per-child override config, specific to this child. NULL rows are family-wide defaults, untouched.' },
  { table: 'homeschool_time_logs', memberColumns: ['family_member_id', 'approved_by'], classification: 'hard_delete', notes: 'PRD explicit personal compliance record. approved_by (mom) scrub.' },

  // ── Meetings (PRD-16) ───────────────────────────────────────────────────
  { table: 'meeting_agenda_items', memberColumns: ['added_by', 'related_member_id'], classification: 'hard_delete',
    notes: 'Hard delete when related_member_id = child (parent_child agenda item specifically about this child — "about the child" rule). added_by scrub when different.' },
  { table: 'meeting_participants', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Join-table row: the child’s own participation record. Hard delete the row, preserve the meeting for others.' },
  { table: 'meeting_schedules', memberColumns: ['created_by', 'related_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on related_member_id (recurring parent_child meeting series about this child). created_by (mom) scrub.' },
  { table: 'meeting_templates', memberColumns: ['created_by', 'default_partner_id'], classification: 'scrub',
    notes: 'Mom-authored template; scrub created_by/default_partner_id, preserve template. Also carries default_participant_ids UUID[] — scrub child’s id out.' },
  { table: 'meetings', memberColumns: ['facilitator_member_id', 'related_member_id', 'started_by'], classification: 'hard_delete',
    notes: 'Hard delete keyed on related_member_id (a meeting series specifically about this child). facilitator_member_id/started_by (mom) scrub.' },

  // ── Gamification (PRD-24 family) ───────────────────────────────────────
  { table: 'gamification_configs', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own gamification config.' },
  { table: 'member_coloring_reveals', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own coloring-reveal progress. earning_segment_ids array references task_segments, not family_members — out of scope here.' },
  { table: 'member_creature_collection', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own earned creature collection.' },
  { table: 'member_page_unlocks', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own sticker-page unlock history.' },
  { table: 'member_sticker_book_state', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own sticker book state.' },
  { table: 'color_reveal_progress', memberColumns: ['revealed_by_member_id'], classification: 'hard_delete', notes: 'The child’s own reveal progress (per-widget zone tracking).' },
  { table: 'coloring_gallery', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own completed-coloring gallery.' },

  // ── Point Economy / PECON ──────────────────────────────────────────────
  { table: 'point_transactions', memberColumns: ['family_member_id', 'acted_by'], classification: 'hard_delete',
    notes: 'Decision file R-7/OD-2 explicit: append-only ledger, hard-deleted for a revoked child under the COPPA carve-out (per-member balance, cannot corrupt siblings). acted_by scrub.' },
  { table: 'reward_shop_purchases', memberColumns: ['family_member_id', 'acted_by', 'processed_by'], classification: 'hard_delete', notes: 'The child’s own purchase/spend record.' },
  { table: 'reward_shop_items', memberColumns: ['created_by', 'audience_member_ids'], classification: 'scrub',
    notes: 'Mom-authored catalog item; scrub created_by, remove child’s id from audience_member_ids UUID[]. Item preserved for other audience members.' },
  { table: 'earned_prizes', memberColumns: ['family_member_id', 'created_by', 'redeemed_by', 'shared_with_member_ids'], classification: 'hard_delete',
    notes: 'Hard delete keyed on family_member_id UNLESS it is NULL (Convention #278 family-level prize — then only scrub the child’s id out of shared_with_member_ids, prize itself preserved). created_by/redeemed_by scrub.' },
  { table: 'reward_proposals', memberColumns: ['proposer_member_id', 'processed_by'], classification: 'hard_delete', notes: 'Hard delete when proposer_member_id = child (self-proposed reward). processed_by (mom) scrub.' },

  // ── Connector Layer / Contracts ────────────────────────────────────────
  { table: 'contracts', memberColumns: ['created_by', 'family_member_id'], classification: 'hard_delete',
    notes: 'Hard delete when family_member_id = child (contract specifically governs this child). NULL family_member_id = family-wide/per-kid-inheritance contract, untouched. created_by (mom) scrub.' },
  { table: 'contract_grant_log', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Decision file R-7/OD-2 explicit append-only ledger carve-out.' },
  { table: 'deed_firings', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Decision file R-7/OD-2 explicit append-only ledger carve-out.' },
  { table: 'deferred_grants', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'A pending grant queued specifically for this child.' },
  { table: 'reward_reveal_attachments', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own reveal attachment.' },
  { table: 'reward_reveals', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored reveal config; scrub authorship, preserve config.' },
  { table: 'reveal_animation_pools', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored pool; scrub authorship, preserve pool.' },
  { table: 'assign_task_godmother_configs', memberColumns: ['specific_member_id'], classification: 'scrub', notes: 'Auto-assignment target config; scrub the reference if the departing child was the specific target — config becomes orphaned/generic, preserved for family contract history.' },
  { table: 'pending_changes', memberColumns: ['created_by', 'affected_member_ids'], classification: 'scrub', notes: 'Mom-authored staged edit; scrub created_by, remove child’s id from affected_member_ids UUID[]. Staged change preserved for other affected members.' },

  // ── Family Goals & Prizes (Convention #278) ────────────────────────────
  { table: 'family_goal_contributions', memberColumns: ['member_id'], classification: 'hard_delete',
    notes: 'Decision file R-7/OD-2 explicit: append-only ledger, hard-deleted for a revoked child under the COPPA carve-out. Deletion MUST trigger a recompute of current_progress on still-active goals (Convention #278 arithmetic) — completed goals and earned family prizes are untouched (celebration permanence, family-level).' },
  { table: 'family_goals', memberColumns: ['created_by', 'participating_member_ids'], classification: 'scrub',
    notes: 'Mom-authored in practice; scrub created_by, remove child’s id from participating_member_ids UUID[]. Goal preserved for remaining participants (Mode B per-member progress recalculated).' },

  // ── Financial / Allowance (PRD-28) ─────────────────────────────────────
  { table: 'financial_transactions', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Convention #223/decision file R-7/OD-2 explicit: append-only ledger, hard-deleted for a revoked child under the COPPA carve-out.' },
  { table: 'allowance_configs', memberColumns: ['family_member_id', 'pool_owner_member_id'], classification: 'hard_delete', notes: 'The child’s own allowance pool config. pool_owner_member_id folds under the same row (self-managed pool ownership stub).' },
  { table: 'allowance_periods', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'PRD explicit list item (matches tasks/task_completions).' },
  { table: 'allowance_dispatch_audit', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Single-child-scoped reconciliation audit row; hard delete with the config.' },
  { table: 'loans', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own loan/balance record — personal financial data.' },
  { table: 'purchase_history', memberColumns: ['purchased_by'], classification: 'scrub', notes: 'Shared shopping-list purchase log; scrub actor, preserve the purchase record for the list/family.' },
  { table: 'gift_claims', memberColumns: ['claimed_by_member_id'], classification: 'scrub', notes: 'Adult-typically claims a gift for a sibling (surprise-safe); scrub claimant reference if the departing child claimed one, preserve the claim record for the gift recipient.' },
  { table: 'gift_history', memberColumns: ['member_id', 'counterparty_member_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on member_id (the child’s own gift-giving/receiving history). counterparty_member_id scrub when the child is only the OTHER party on someone else’s record.' },

  // ── Randomizer / Practice ───────────────────────────────────────────────
  { table: 'randomizer_draws', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own draw record.' },
  { table: 'practice_log', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own practice session log.' },

  // ── Rhythms & Reflections (PRD-18) ─────────────────────────────────────
  { table: 'rhythm_completions', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own rhythm completion record.' },
  { table: 'rhythm_configs', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'The child’s own rhythm configuration.' },

  // ── Safety Monitoring (PRD-30) ──────────────────────────────────────────
  { table: 'safety_flags', memberColumns: ['flagged_member_id', 'reviewed_by'], classification: 'hard_delete', notes: 'The whole point of PRD-30 is monitoring THIS specific child; hard delete their flag records on consent revocation. reviewed_by (mom) scrub.' },
  { table: 'safety_monitoring_configs', memberColumns: ['monitored_member_id', 'created_by'], classification: 'hard_delete', notes: 'The child’s own monitoring toggle.' },
  { table: 'safety_notification_recipients', memberColumns: ['recipient_member_id'], classification: 'hard_delete', notes: 'Rare for a child to be a recipient (typically mom/dad); hard delete if it occurs.' },
  { table: 'safety_pattern_summaries', memberColumns: ['monitored_member_id'], classification: 'hard_delete', notes: 'The child’s own weekly digest summaries.' },
  { table: 'safety_sensitivity_configs', memberColumns: ['monitored_member_id'], classification: 'hard_delete', notes: 'The child’s own per-category sensitivity config.' },

  // ── Special Adults / Shifts ─────────────────────────────────────────────
  { table: 'shift_sessions', memberColumns: ['special_adult_id'], classification: 'not_applicable', notes: 'Special Adults are always adults — not a COPPA-relevant column.' },
  { table: 'special_adult_assignments', memberColumns: ['child_id', 'special_adult_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on child_id — the whole row exists specifically to say "this Special Adult can access this child." special_adult_id is not_applicable (always an adult).' },
  { table: 'mom_self_restrictions', memberColumns: ['target_member_id', 'primary_parent_id'], classification: 'hard_delete',
    notes: 'Hard delete keyed on target_member_id (a restriction specifically about this child). primary_parent_id is always mom, not_applicable.' },
  { table: 'teen_sharing_overrides', memberColumns: ['member_id'], classification: 'hard_delete', notes: 'Designed for teens (13-17) but classified for completeness in case a bracket edge case ever applies.' },

  // ── Visual Schedule ──────────────────────────────────────────────────────
  { table: 'visual_schedule_member_assignments', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own assigned visual-schedule routine.' },
  { table: 'visual_schedule_member_tasks', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'The child’s own visual-schedule task state.' },

  // ── Family Members' emails ──────────────────────────────────────────────
  { table: 'member_emails', memberColumns: ['family_member_id'], classification: 'hard_delete', notes: 'Rare for a child under 13 to have a linked secondary email; hard delete if present.' },

  // ── Relationship & Private Notes ────────────────────────────────────────
  { table: 'relationship_notes', memberColumns: ['author_id', 'person_a_id', 'person_b_id'], classification: 'hard_delete',
    notes: 'PRD explicit rule: "relationship notes about the child — hard delete." Hard delete when EITHER person_a_id or person_b_id is the child. author_id (mom, usually) scrub in the edge case where neither person matches but the child authored the note.' },
  { table: 'private_notes', memberColumns: ['about_member_id', 'author_id'], classification: 'hard_delete',
    notes: 'PRD explicit rule: "relationship notes about the child — hard delete," keyed on about_member_id. author_id (mom, usually) scrub in the edge case where about_member_id points elsewhere.' },

  // ── PRD-40 COPPA compliance infrastructure itself ──────────────────────
  // These 5 tables are the consent/verification AUDIT TRAIL, not ordinary
  // child-scoped feature data. The PRD is explicit that they are the one
  // deliberate exception to the deletion cascade: "Preserved: coppa_consents
  // row itself (with deletion_completed_at and deletion_completion_notes
  // set), parent_verifications row, parent_verification_attempts rows,
  // retention_deletion_log rows. These are audit evidence and are never
  // deleted." Classified 'preserve' — never touched by the Slice-4 cascade,
  // by design, forever. Registered here (rather than exempted from the
  // registry entirely) so the completeness vitest still proves someone made
  // an explicit decision about them, not an oversight.
  { table: 'coppa_consents', memberColumns: ['child_member_id', 'parent_member_id'], classification: 'preserve',
    notes: 'Never hard-deleted, even after deletion_completed_at is set — the row IS the legal evidence of consent and revocation timing. deletion_completed_at + deletion_completion_notes are set in place instead of a delete.' },
  { table: 'parent_verifications', memberColumns: ['parent_member_id'], classification: 'preserve',
    notes: 'Immutable audit trail. No UPDATE/DELETE by anyone, ever, including admin — verification is per-parent and outlives any individual child’s consent lifecycle.' },
  { table: 'parent_verification_attempts', memberColumns: ['parent_member_id', 'verification_id'], classification: 'preserve',
    notes: 'Abuse-detection/support-diagnostics log. Preserved permanently per the PRD schema table (no retention limit specified) — it documents the parent’s verification history, not any one child’s data.' },
  { table: 'retention_deletion_log', memberColumns: ['child_member_id'], classification: 'preserve',
    notes: 'The audit trail OF the deletion cascade itself. Must survive the very deletions it records, or the compliance evidence disappears with the data it was proving got deleted.' },
  { table: 'parental_data_exports', memberColumns: ['child_member_id', 'parent_member_id'], classification: 'preserve',
    notes: 'PRD: this audit ROW expires from the table 90 days after downloaded_at via the Slice-4 retention sweep — a time-based retention rule, not a consent-revocation cascade action. Never touched by the deletion-cascade job itself; excluded from Slice 4’s per-child cascade walk.' },

  // ── Wishlists (PRD-43) ──────────────────────────────────────────────────
  { table: 'wishlist_share_links', memberColumns: ['created_by'], classification: 'scrub', notes: 'Mom-authored share link in practice; scrub authorship, preserve link.' },

  // ── Studio Wizards ───────────────────────────────────────────────────────
  { table: 'wizard_templates', memberColumns: ['original_author_id'], classification: 'scrub', notes: 'Scrub authorship, preserve template for family.' },
]

/** Fast lookup: table name -> its registry entry. Throws in dev if a caller looks up an unregistered table (fail loud, not silent). */
const BY_TABLE = new Map(CHILD_DATA_TABLES.map((e) => [e.table, e]))

export function getChildDataTableEntry(table: string): ChildDataTableEntry | undefined {
  return BY_TABLE.get(table)
}

export function getTablesByClassification(classification: CascadeClassification): ChildDataTableEntry[] {
  return CHILD_DATA_TABLES.filter((e) => e.classification === classification)
}
