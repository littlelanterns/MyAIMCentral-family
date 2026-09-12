-- ============================================================================
-- PRD-40 Slice 5 — COPPA write-gate ROLLBACK (GENERATED — the single
-- documented DROP path for every coppa_write_gate_* policy).
-- Regenerate with:  npm run coppa:gates
-- Does NOT drop util.coppa_write_allowed (harmless standalone predicate) or
-- touch the roster-suspension filters (migration 100327) — those are
-- hand-reverted if ever needed.
-- Apply via:  supabase db query --linked -f scripts/coppa-write-gates-rollback.sql
-- (founder-gated, like every production-touching action).
-- ============================================================================
DO $do$
BEGIN
  IF to_regclass('public.activity_log_entries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.activity_log_entries';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.activity_log_entries';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.ai_output_scans') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.ai_output_scans';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.ai_output_scans';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.ai_usage_tracking') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.ai_usage_tracking';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.ai_usage_tracking';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.allowance_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.allowance_dispatch_audit') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_dispatch_audit';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_dispatch_audit';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.allowance_periods') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_periods';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_periods';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.archive_context_items') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_context_items';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_context_items';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.archive_folders') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_folders';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_folders';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.archive_member_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_member_settings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_member_settings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.asset_suggestion_misses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.asset_suggestion_misses';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.asset_suggestion_misses';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.best_intentions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.best_intentions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.best_intentions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.beta_glitch_reports') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.beta_glitch_reports';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.beta_glitch_reports';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.board_personas') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.board_personas';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.board_personas';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.board_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.board_sessions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.board_sessions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_action_steps') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_action_steps';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_action_steps';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_declarations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_declarations';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_declarations';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_discussions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_discussions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_discussions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_insights') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_insights';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_insights';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_member_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_member_settings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_member_settings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_questions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_questions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_questions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_search_history') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_search_history';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_search_history';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_summaries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_summaries';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_summaries';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_user_state') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_user_state';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_user_state';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.color_reveal_progress') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.color_reveal_progress';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.color_reveal_progress';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.coloring_gallery') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.coloring_gallery';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.coloring_gallery';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.communication_drafts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.communication_drafts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.communication_drafts';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.contract_grant_log') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.contract_grant_log';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.contract_grant_log';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.contracts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.contracts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.contracts';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.conversation_space_members') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.conversation_space_members';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.conversation_space_members';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.dashboard_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.dashboard_widget_folders') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_widget_folders';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_widget_folders';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.dashboard_widgets') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_widgets';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_widgets';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.deed_firings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.deed_firings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.deed_firings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.deferred_grants') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.deferred_grants';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.deferred_grants';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.earned_prizes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.earned_prizes';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.earned_prizes';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.event_attendees') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.event_attendees';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.event_attendees';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.family_goal_contributions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_goal_contributions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_goal_contributions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.family_intention_iterations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_intention_iterations';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_intention_iterations';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.family_requests') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_requests';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_requests';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.feature_demand_responses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_demand_responses';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_demand_responses';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.feature_discovery_dismissals') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_discovery_dismissals';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_discovery_dismissals';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.feature_expansion_dismissals') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_expansion_dismissals';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_expansion_dismissals';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.financial_transactions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.financial_transactions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.financial_transactions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.food_restrictions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.food_restrictions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.food_restrictions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.gamification_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.gamification_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.gamification_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.gift_history') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.gift_history';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.gift_history';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.guided_form_responses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.guided_form_responses';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.guided_form_responses';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.guiding_stars') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.guiding_stars';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.guiding_stars';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.homeschool_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.homeschool_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.homeschool_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.homeschool_time_logs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.homeschool_time_logs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.homeschool_time_logs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.intention_iterations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.intention_iterations';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.intention_iterations';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.journal_entries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_entries';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_entries';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.journal_prompts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_prompts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_prompts';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.journal_visibility_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_visibility_settings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_visibility_settings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.lila_conversations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_conversations';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_conversations';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.lila_ethics_rejections') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_ethics_rejections';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_ethics_rejections';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.lila_member_preferences') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_member_preferences';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_member_preferences';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.lila_tool_permissions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_tool_permissions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_tool_permissions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.list_item_member_tracking') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.list_item_member_tracking';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.list_item_member_tracking';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.lists') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lists';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lists';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.loans') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.loans';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.loans';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.meal_feedback') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meal_feedback';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meal_feedback';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.meeting_agenda_items') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_agenda_items';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_agenda_items';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.meeting_participants') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_participants';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_participants';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.meeting_schedules') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_schedules';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_schedules';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.meetings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meetings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meetings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_coloring_reveals') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_coloring_reveals';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_coloring_reveals';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_creature_collection') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_creature_collection';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_creature_collection';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_emails') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_emails';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_emails';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_feature_toggles') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_feature_toggles';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_feature_toggles';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_messaging_permissions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_messaging_permissions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_messaging_permissions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_page_unlocks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_page_unlocks';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_page_unlocks';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_permissions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_permissions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_permissions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.member_sticker_book_state') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_sticker_book_state';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_sticker_book_state';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.message_coaching_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.message_coaching_settings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.message_coaching_settings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.message_read_status') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.message_read_status';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.message_read_status';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.messages';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.messages';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_approval_patterns') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_approval_patterns';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_approval_patterns';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_events') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_events';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_events';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_holding') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_holding';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_holding';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_settings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_settings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.mom_self_restrictions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mom_self_restrictions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mom_self_restrictions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.notepad_routing_stats') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notepad_routing_stats';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notepad_routing_stats';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.notepad_tabs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notepad_tabs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notepad_tabs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.notification_preferences') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notification_preferences';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notifications';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notifications';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.persona_favorites') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.persona_favorites';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.persona_favorites';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.point_transactions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.point_transactions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.point_transactions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.practice_log') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.practice_log';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.practice_log';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.private_notes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.private_notes';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.private_notes';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.randomizer_draws') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.randomizer_draws';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.randomizer_draws';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.reflection_prompts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reflection_prompts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reflection_prompts';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.reflection_responses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reflection_responses';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reflection_responses';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.relationship_notes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.relationship_notes';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.relationship_notes';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.reward_proposals') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_proposals';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_proposals';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.reward_reveal_attachments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_reveal_attachments';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_reveal_attachments';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.reward_shop_purchases') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_shop_purchases';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_shop_purchases';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.rhythm_completions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.rhythm_completions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.rhythm_completions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.rhythm_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.rhythm_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.rhythm_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.routine_step_completions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.routine_step_completions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.routine_step_completions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.safety_flags') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_flags';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_flags';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.safety_monitoring_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_monitoring_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_monitoring_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.safety_notification_recipients') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_notification_recipients';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_notification_recipients';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.safety_pattern_summaries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_pattern_summaries';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_pattern_summaries';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.safety_sensitivity_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_sensitivity_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_sensitivity_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.self_knowledge') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.self_knowledge';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.self_knowledge';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.special_adult_assignments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.special_adult_assignments';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.special_adult_assignments';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.studio_queue') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.studio_queue';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.studio_queue';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.task_assignments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_assignments';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_assignments';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.task_claims') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_claims';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_claims';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.task_completions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_completions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_completions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.task_segments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_segments';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_segments';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.tasks';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.tasks';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.teaching_skill_history') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.teaching_skill_history';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.teaching_skill_history';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.teen_sharing_overrides') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.teen_sharing_overrides';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.teen_sharing_overrides';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.time_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.time_sessions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.time_sessions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.timer_configs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.timer_configs';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.timer_configs';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.user_saved_prompts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.user_saved_prompts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.user_saved_prompts';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_content_requests') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_content_requests';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_content_requests';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_copy_events') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_copy_events';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_copy_events';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_first_sightings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_first_sightings';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_first_sightings';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_tool_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_tool_sessions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_tool_sessions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_user_bookmarks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_bookmarks';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_bookmarks';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_user_progress') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_progress';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_progress';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.vault_user_visits') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_visits';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_visits';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.victories') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victories';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victories';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.victory_celebrations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victory_celebrations';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victory_celebrations';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.victory_voice_preferences') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victory_voice_preferences';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victory_voice_preferences';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.view_as_permissions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.view_as_permissions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.view_as_permissions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.view_as_sessions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.view_as_sessions';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.view_as_sessions';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.visual_schedule_member_assignments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.visual_schedule_member_assignments';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.visual_schedule_member_assignments';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.visual_schedule_member_tasks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.visual_schedule_member_tasks';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.visual_schedule_member_tasks';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.widget_data_points') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.widget_data_points';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.widget_data_points';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.widget_templates') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.widget_templates';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.widget_templates';
  END IF;
END $do$;
DO $do$
BEGIN
  IF to_regclass('public.wizard_drafts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.wizard_drafts';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.wizard_drafts';
  END IF;
END $do$;

DO $verify$
DECLARE v_left INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_left FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('coppa_write_gate_ins', 'coppa_write_gate_upd');
  IF v_left <> 0 THEN
    RAISE EXCEPTION 'coppa write-gate rollback: % gate policies still present', v_left;
  END IF;
  RAISE NOTICE 'coppa write-gate rollback complete — 0 gate policies remain';
END $verify$;
