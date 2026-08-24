-- ============================================================================
-- Migration: PRD-40 Slice 5 — COPPA RESTRICTIVE write gates (GENERATED)
-- ============================================================================
-- ⚠ GENERATED FILE — do not hand-edit. Regenerate with:  npm run coppa:gates
-- Generator:  scripts/coppa-write-gates.ts
-- Source:     src/lib/compliance/childDataTables.ts (hard_delete class)
--             supabase/functions/_shared/coppa-cascade-plan.ts (subject cols)
-- Drift pin:  tests/coppa-write-gates-consistency.test.ts
-- Rollback:   scripts/coppa-write-gates-rollback.sql (single documented DROP
--             path — drops every gate policy, leaves util.coppa_write_allowed
--             in place)
--
-- Each gated table gains two AS RESTRICTIVE policies (they AND onto the
-- existing permissive policies; they can only ever NARROW access):
--   coppa_write_gate_ins: FOR INSERT WITH CHECK (util.coppa_write_allowed(<subject cols>))
--   coppa_write_gate_upd: FOR UPDATE USING (true) WITH CHECK (same)
--     (USING (true) — deliberately no row-visibility restriction: mom must
--      still SEE and manage a suspended child's existing rows; only NEW
--      row-values naming the child as data subject are gated.)
-- SELECT and DELETE are deliberately ungated: reading and REMOVING a child's
-- data are never "collection"; the revocation grace period must leave mom
-- able to review, and the cascade able to delete.
--
-- util.coppa_write_allowed (migration 100327) is inert today for every
-- production member: zero suspended members exist, and R-8 dormancy holds
-- until a lawyer-approved consent template exists. SECURITY DEFINER write
-- paths (RPCs, triggers owned by postgres) and service-role Edge Functions
-- BYPASS RLS and therefore these gates — the Edge-layer check in
-- supabase/functions/_shared/coppa-consent.ts is the companion gate for
-- those paths (PRD-40 "defense in depth" — here the layers are inverted:
-- RLS gates client writes, the Edge check gates service-role writes).
--
-- 134 gated tables, 268 policies.
-- Idempotent throughout (DROP POLICY IF EXISTS + CREATE, table-existence
-- guarded).
-- ============================================================================

-- activity_log_entries (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.activity_log_entries') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.activity_log_entries absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.activity_log_entries';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.activity_log_entries AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.activity_log_entries';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.activity_log_entries AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- ai_output_scans (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.ai_output_scans') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.ai_output_scans absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.ai_output_scans';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.ai_output_scans AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.ai_output_scans';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.ai_output_scans AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- ai_usage_tracking (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.ai_usage_tracking') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.ai_usage_tracking absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.ai_usage_tracking';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.ai_usage_tracking AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.ai_usage_tracking';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.ai_usage_tracking AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- allowance_configs (subject: family_member_id, pool_owner_member_id)
DO $do$
BEGIN
  IF to_regclass('public.allowance_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.allowance_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.allowance_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(pool_owner_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.allowance_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(pool_owner_member_id))';
  END IF;
END $do$;

-- allowance_dispatch_audit (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.allowance_dispatch_audit') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.allowance_dispatch_audit absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_dispatch_audit';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.allowance_dispatch_audit AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_dispatch_audit';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.allowance_dispatch_audit AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- allowance_periods (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.allowance_periods') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.allowance_periods absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.allowance_periods';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.allowance_periods AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.allowance_periods';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.allowance_periods AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- archive_context_items (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.archive_context_items') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.archive_context_items absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_context_items';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.archive_context_items AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_context_items';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.archive_context_items AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- archive_folders (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.archive_folders') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.archive_folders absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_folders';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.archive_folders AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_folders';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.archive_folders AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- archive_member_settings (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.archive_member_settings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.archive_member_settings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.archive_member_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.archive_member_settings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.archive_member_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.archive_member_settings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- asset_suggestion_misses (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.asset_suggestion_misses') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.asset_suggestion_misses absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.asset_suggestion_misses';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.asset_suggestion_misses AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.asset_suggestion_misses';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.asset_suggestion_misses AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- best_intentions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.best_intentions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.best_intentions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.best_intentions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.best_intentions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.best_intentions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.best_intentions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- beta_glitch_reports (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.beta_glitch_reports') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.beta_glitch_reports absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.beta_glitch_reports';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.beta_glitch_reports AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.beta_glitch_reports';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.beta_glitch_reports AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- board_personas (subject: created_by)
DO $do$
BEGIN
  IF to_regclass('public.board_personas') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.board_personas absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.board_personas';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.board_personas AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(created_by))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.board_personas';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.board_personas AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(created_by))';
  END IF;
END $do$;

-- board_sessions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.board_sessions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.board_sessions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.board_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.board_sessions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.board_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.board_sessions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- bookshelf_action_steps (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_action_steps') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_action_steps absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_action_steps';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_action_steps AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_action_steps';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_action_steps AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_declarations (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_declarations') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_declarations absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_declarations';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_declarations AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_declarations';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_declarations AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_discussions (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_discussions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_discussions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_discussions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_discussions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_discussions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_discussions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_insights (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_insights') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_insights absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_insights';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_insights AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_insights';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_insights AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_member_settings (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_member_settings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_member_settings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_member_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_member_settings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_member_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_member_settings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_questions (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_questions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_questions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_questions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_questions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_questions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_questions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_search_history (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_search_history') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_search_history absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_search_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_search_history AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_search_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_search_history AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- bookshelf_summaries (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_summaries') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_summaries absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_summaries';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_summaries AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_summaries';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_summaries AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- bookshelf_user_state (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.bookshelf_user_state') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.bookshelf_user_state absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.bookshelf_user_state';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.bookshelf_user_state AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.bookshelf_user_state';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.bookshelf_user_state AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- color_reveal_progress (subject: revealed_by_member_id)
DO $do$
BEGIN
  IF to_regclass('public.color_reveal_progress') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.color_reveal_progress absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.color_reveal_progress';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.color_reveal_progress AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(revealed_by_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.color_reveal_progress';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.color_reveal_progress AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(revealed_by_member_id))';
  END IF;
END $do$;

-- coloring_gallery (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.coloring_gallery') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.coloring_gallery absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.coloring_gallery';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.coloring_gallery AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.coloring_gallery';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.coloring_gallery AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- communication_drafts (subject: author_id, about_member_id)
DO $do$
BEGIN
  IF to_regclass('public.communication_drafts') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.communication_drafts absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.communication_drafts';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.communication_drafts AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(author_id) AND util.coppa_write_allowed(about_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.communication_drafts';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.communication_drafts AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(author_id) AND util.coppa_write_allowed(about_member_id))';
  END IF;
END $do$;

-- contract_grant_log (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.contract_grant_log') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.contract_grant_log absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.contract_grant_log';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.contract_grant_log AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.contract_grant_log';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.contract_grant_log AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- contracts (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.contracts') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.contracts absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.contracts';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.contracts AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.contracts';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.contracts AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- conversation_space_members (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.conversation_space_members') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.conversation_space_members absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.conversation_space_members';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.conversation_space_members AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.conversation_space_members';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.conversation_space_members AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- dashboard_configs (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.dashboard_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.dashboard_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.dashboard_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.dashboard_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- dashboard_widget_folders (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.dashboard_widget_folders') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.dashboard_widget_folders absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_widget_folders';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.dashboard_widget_folders AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_widget_folders';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.dashboard_widget_folders AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- dashboard_widgets (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.dashboard_widgets') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.dashboard_widgets absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.dashboard_widgets';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.dashboard_widgets AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.dashboard_widgets';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.dashboard_widgets AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- deed_firings (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.deed_firings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.deed_firings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.deed_firings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.deed_firings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.deed_firings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.deed_firings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- deferred_grants (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.deferred_grants') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.deferred_grants absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.deferred_grants';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.deferred_grants AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.deferred_grants';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.deferred_grants AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- earned_prizes (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.earned_prizes') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.earned_prizes absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.earned_prizes';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.earned_prizes AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.earned_prizes';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.earned_prizes AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- event_attendees (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.event_attendees') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.event_attendees absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.event_attendees';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.event_attendees AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.event_attendees';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.event_attendees AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- family_goal_contributions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.family_goal_contributions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.family_goal_contributions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_goal_contributions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.family_goal_contributions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_goal_contributions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.family_goal_contributions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- family_intention_iterations (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.family_intention_iterations') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.family_intention_iterations absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_intention_iterations';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.family_intention_iterations AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_intention_iterations';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.family_intention_iterations AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- family_requests (subject: sender_member_id, recipient_member_id)
DO $do$
BEGIN
  IF to_regclass('public.family_requests') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.family_requests absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.family_requests';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.family_requests AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(sender_member_id) AND util.coppa_write_allowed(recipient_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.family_requests';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.family_requests AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(sender_member_id) AND util.coppa_write_allowed(recipient_member_id))';
  END IF;
END $do$;

-- feature_demand_responses (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.feature_demand_responses') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.feature_demand_responses absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_demand_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.feature_demand_responses AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_demand_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.feature_demand_responses AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- feature_discovery_dismissals (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.feature_discovery_dismissals') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.feature_discovery_dismissals absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_discovery_dismissals';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.feature_discovery_dismissals AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_discovery_dismissals';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.feature_discovery_dismissals AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- feature_expansion_dismissals (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.feature_expansion_dismissals') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.feature_expansion_dismissals absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.feature_expansion_dismissals';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.feature_expansion_dismissals AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.feature_expansion_dismissals';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.feature_expansion_dismissals AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- financial_transactions (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.financial_transactions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.financial_transactions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.financial_transactions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.financial_transactions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.financial_transactions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.financial_transactions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- food_restrictions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.food_restrictions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.food_restrictions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.food_restrictions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.food_restrictions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.food_restrictions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.food_restrictions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- gamification_configs (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.gamification_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.gamification_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.gamification_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.gamification_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.gamification_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.gamification_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- gift_history (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.gift_history') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.gift_history absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.gift_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.gift_history AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.gift_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.gift_history AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- guided_form_responses (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.guided_form_responses') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.guided_form_responses absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.guided_form_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.guided_form_responses AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.guided_form_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.guided_form_responses AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- guiding_stars (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.guiding_stars') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.guiding_stars absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.guiding_stars';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.guiding_stars AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.guiding_stars';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.guiding_stars AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- homeschool_configs (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.homeschool_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.homeschool_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.homeschool_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.homeschool_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.homeschool_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.homeschool_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- homeschool_time_logs (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.homeschool_time_logs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.homeschool_time_logs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.homeschool_time_logs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.homeschool_time_logs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.homeschool_time_logs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.homeschool_time_logs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- intention_iterations (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.intention_iterations') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.intention_iterations absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.intention_iterations';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.intention_iterations AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.intention_iterations';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.intention_iterations AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- journal_entries (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.journal_entries') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.journal_entries absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_entries';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.journal_entries AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_entries';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.journal_entries AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- journal_prompts (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.journal_prompts') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.journal_prompts absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.journal_prompts AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.journal_prompts AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- journal_visibility_settings (subject: child_member_id)
DO $do$
BEGIN
  IF to_regclass('public.journal_visibility_settings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.journal_visibility_settings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.journal_visibility_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.journal_visibility_settings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(child_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.journal_visibility_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.journal_visibility_settings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(child_member_id))';
  END IF;
END $do$;

-- lila_conversations (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.lila_conversations') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.lila_conversations absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_conversations';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.lila_conversations AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_conversations';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.lila_conversations AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- lila_ethics_rejections (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.lila_ethics_rejections') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.lila_ethics_rejections absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_ethics_rejections';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.lila_ethics_rejections AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_ethics_rejections';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.lila_ethics_rejections AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- lila_member_preferences (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.lila_member_preferences') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.lila_member_preferences absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_member_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.lila_member_preferences AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_member_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.lila_member_preferences AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- lila_tool_permissions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.lila_tool_permissions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.lila_tool_permissions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lila_tool_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.lila_tool_permissions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lila_tool_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.lila_tool_permissions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- list_item_member_tracking (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.list_item_member_tracking') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.list_item_member_tracking absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.list_item_member_tracking';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.list_item_member_tracking AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.list_item_member_tracking';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.list_item_member_tracking AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- lists (subject: owner_id, subject_member_id)
DO $do$
BEGIN
  IF to_regclass('public.lists') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.lists absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.lists';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.lists AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(owner_id) AND util.coppa_write_allowed(subject_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.lists';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.lists AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(owner_id) AND util.coppa_write_allowed(subject_member_id))';
  END IF;
END $do$;

-- loans (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.loans') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.loans absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.loans';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.loans AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.loans';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.loans AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- meal_feedback (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.meal_feedback') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.meal_feedback absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meal_feedback';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.meal_feedback AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meal_feedback';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.meal_feedback AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- meeting_agenda_items (subject: related_member_id)
DO $do$
BEGIN
  IF to_regclass('public.meeting_agenda_items') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.meeting_agenda_items absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_agenda_items';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.meeting_agenda_items AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(related_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_agenda_items';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.meeting_agenda_items AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(related_member_id))';
  END IF;
END $do$;

-- meeting_participants (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.meeting_participants') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.meeting_participants absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_participants';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.meeting_participants AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_participants';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.meeting_participants AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- meeting_schedules (subject: related_member_id)
DO $do$
BEGIN
  IF to_regclass('public.meeting_schedules') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.meeting_schedules absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meeting_schedules';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.meeting_schedules AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(related_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meeting_schedules';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.meeting_schedules AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(related_member_id))';
  END IF;
END $do$;

-- meetings (subject: related_member_id)
DO $do$
BEGIN
  IF to_regclass('public.meetings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.meetings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.meetings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.meetings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(related_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.meetings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.meetings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(related_member_id))';
  END IF;
END $do$;

-- member_coloring_reveals (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_coloring_reveals') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_coloring_reveals absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_coloring_reveals';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_coloring_reveals AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_coloring_reveals';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_coloring_reveals AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- member_creature_collection (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_creature_collection') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_creature_collection absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_creature_collection';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_creature_collection AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_creature_collection';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_creature_collection AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- member_emails (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_emails') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_emails absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_emails';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_emails AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_emails';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_emails AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- member_feature_toggles (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_feature_toggles') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_feature_toggles absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_feature_toggles';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_feature_toggles AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_feature_toggles';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_feature_toggles AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- member_messaging_permissions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_messaging_permissions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_messaging_permissions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_messaging_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_messaging_permissions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_messaging_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_messaging_permissions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- member_page_unlocks (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_page_unlocks') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_page_unlocks absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_page_unlocks';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_page_unlocks AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_page_unlocks';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_page_unlocks AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- member_permissions (subject: target_member_id, granted_to)
DO $do$
BEGIN
  IF to_regclass('public.member_permissions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_permissions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_permissions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(target_member_id) AND util.coppa_write_allowed(granted_to))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_permissions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(target_member_id) AND util.coppa_write_allowed(granted_to))';
  END IF;
END $do$;

-- member_sticker_book_state (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.member_sticker_book_state') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.member_sticker_book_state absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.member_sticker_book_state';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.member_sticker_book_state AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.member_sticker_book_state';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.member_sticker_book_state AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- message_coaching_settings (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.message_coaching_settings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.message_coaching_settings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.message_coaching_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.message_coaching_settings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.message_coaching_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.message_coaching_settings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- message_read_status (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.message_read_status') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.message_read_status absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.message_read_status';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.message_read_status AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.message_read_status';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.message_read_status AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- messages (subject: sender_member_id)
DO $do$
BEGIN
  IF to_regclass('public.messages') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.messages absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.messages';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.messages AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(sender_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.messages';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.messages AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(sender_member_id))';
  END IF;
END $do$;

-- mindsweep_approval_patterns (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_approval_patterns') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.mindsweep_approval_patterns absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_approval_patterns';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.mindsweep_approval_patterns AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_approval_patterns';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.mindsweep_approval_patterns AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- mindsweep_events (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_events') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.mindsweep_events absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_events';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.mindsweep_events AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_events';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.mindsweep_events AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- mindsweep_holding (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_holding') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.mindsweep_holding absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_holding';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.mindsweep_holding AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_holding';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.mindsweep_holding AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- mindsweep_settings (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.mindsweep_settings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.mindsweep_settings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mindsweep_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.mindsweep_settings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mindsweep_settings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.mindsweep_settings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- mom_self_restrictions (subject: target_member_id)
DO $do$
BEGIN
  IF to_regclass('public.mom_self_restrictions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.mom_self_restrictions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.mom_self_restrictions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.mom_self_restrictions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(target_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.mom_self_restrictions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.mom_self_restrictions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(target_member_id))';
  END IF;
END $do$;

-- notepad_routing_stats (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.notepad_routing_stats') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.notepad_routing_stats absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notepad_routing_stats';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.notepad_routing_stats AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notepad_routing_stats';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.notepad_routing_stats AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- notepad_tabs (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.notepad_tabs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.notepad_tabs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notepad_tabs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.notepad_tabs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notepad_tabs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.notepad_tabs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- notification_preferences (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.notification_preferences') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.notification_preferences absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notification_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.notification_preferences AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notification_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.notification_preferences AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- notifications (subject: recipient_member_id)
DO $do$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.notifications absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.notifications';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.notifications AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(recipient_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.notifications';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.notifications AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(recipient_member_id))';
  END IF;
END $do$;

-- persona_favorites (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.persona_favorites') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.persona_favorites absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.persona_favorites';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.persona_favorites AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.persona_favorites';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.persona_favorites AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- point_transactions (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.point_transactions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.point_transactions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.point_transactions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.point_transactions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.point_transactions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.point_transactions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- practice_log (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.practice_log') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.practice_log absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.practice_log';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.practice_log AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.practice_log';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.practice_log AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- private_notes (subject: about_member_id)
DO $do$
BEGIN
  IF to_regclass('public.private_notes') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.private_notes absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.private_notes';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.private_notes AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(about_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.private_notes';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.private_notes AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(about_member_id))';
  END IF;
END $do$;

-- randomizer_draws (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.randomizer_draws') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.randomizer_draws absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.randomizer_draws';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.randomizer_draws AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.randomizer_draws';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.randomizer_draws AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- reflection_prompts (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.reflection_prompts') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.reflection_prompts absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reflection_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.reflection_prompts AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reflection_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.reflection_prompts AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- reflection_responses (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.reflection_responses') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.reflection_responses absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reflection_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.reflection_responses AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reflection_responses';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.reflection_responses AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- relationship_notes (subject: person_a_id, person_b_id)
DO $do$
BEGIN
  IF to_regclass('public.relationship_notes') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.relationship_notes absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.relationship_notes';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.relationship_notes AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(person_a_id) AND util.coppa_write_allowed(person_b_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.relationship_notes';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.relationship_notes AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(person_a_id) AND util.coppa_write_allowed(person_b_id))';
  END IF;
END $do$;

-- reward_proposals (subject: proposer_member_id)
DO $do$
BEGIN
  IF to_regclass('public.reward_proposals') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.reward_proposals absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_proposals';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.reward_proposals AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(proposer_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_proposals';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.reward_proposals AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(proposer_member_id))';
  END IF;
END $do$;

-- reward_reveal_attachments (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.reward_reveal_attachments') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.reward_reveal_attachments absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_reveal_attachments';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.reward_reveal_attachments AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_reveal_attachments';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.reward_reveal_attachments AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- reward_shop_purchases (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.reward_shop_purchases') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.reward_shop_purchases absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.reward_shop_purchases';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.reward_shop_purchases AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.reward_shop_purchases';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.reward_shop_purchases AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- rhythm_completions (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.rhythm_completions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.rhythm_completions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.rhythm_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.rhythm_completions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.rhythm_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.rhythm_completions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- rhythm_configs (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.rhythm_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.rhythm_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.rhythm_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.rhythm_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.rhythm_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.rhythm_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- routine_step_completions (subject: family_member_id, member_id)
DO $do$
BEGIN
  IF to_regclass('public.routine_step_completions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.routine_step_completions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.routine_step_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.routine_step_completions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.routine_step_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.routine_step_completions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- safety_flags (subject: flagged_member_id)
DO $do$
BEGIN
  IF to_regclass('public.safety_flags') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.safety_flags absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_flags';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.safety_flags AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(flagged_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_flags';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.safety_flags AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(flagged_member_id))';
  END IF;
END $do$;

-- safety_monitoring_configs (subject: monitored_member_id)
DO $do$
BEGIN
  IF to_regclass('public.safety_monitoring_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.safety_monitoring_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_monitoring_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.safety_monitoring_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_monitoring_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.safety_monitoring_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
  END IF;
END $do$;

-- safety_notification_recipients (subject: recipient_member_id)
DO $do$
BEGIN
  IF to_regclass('public.safety_notification_recipients') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.safety_notification_recipients absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_notification_recipients';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.safety_notification_recipients AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(recipient_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_notification_recipients';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.safety_notification_recipients AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(recipient_member_id))';
  END IF;
END $do$;

-- safety_pattern_summaries (subject: monitored_member_id)
DO $do$
BEGIN
  IF to_regclass('public.safety_pattern_summaries') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.safety_pattern_summaries absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_pattern_summaries';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.safety_pattern_summaries AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_pattern_summaries';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.safety_pattern_summaries AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
  END IF;
END $do$;

-- safety_sensitivity_configs (subject: monitored_member_id)
DO $do$
BEGIN
  IF to_regclass('public.safety_sensitivity_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.safety_sensitivity_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.safety_sensitivity_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.safety_sensitivity_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.safety_sensitivity_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.safety_sensitivity_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(monitored_member_id))';
  END IF;
END $do$;

-- self_knowledge (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.self_knowledge') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.self_knowledge absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.self_knowledge';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.self_knowledge AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.self_knowledge';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.self_knowledge AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- special_adult_assignments (subject: child_id)
DO $do$
BEGIN
  IF to_regclass('public.special_adult_assignments') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.special_adult_assignments absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.special_adult_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.special_adult_assignments AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(child_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.special_adult_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.special_adult_assignments AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(child_id))';
  END IF;
END $do$;

-- studio_queue (subject: owner_id)
DO $do$
BEGIN
  IF to_regclass('public.studio_queue') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.studio_queue absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.studio_queue';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.studio_queue AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(owner_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.studio_queue';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.studio_queue AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(owner_id))';
  END IF;
END $do$;

-- task_assignments (subject: family_member_id, member_id)
DO $do$
BEGIN
  IF to_regclass('public.task_assignments') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.task_assignments absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.task_assignments AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.task_assignments AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- task_claims (subject: member_id, claimed_by)
DO $do$
BEGIN
  IF to_regclass('public.task_claims') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.task_claims absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_claims';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.task_claims AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id) AND util.coppa_write_allowed(claimed_by))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_claims';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.task_claims AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id) AND util.coppa_write_allowed(claimed_by))';
  END IF;
END $do$;

-- task_completions (subject: family_member_id, member_id)
DO $do$
BEGIN
  IF to_regclass('public.task_completions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.task_completions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.task_completions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_completions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.task_completions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id) AND util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- task_segments (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.task_segments') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.task_segments absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.task_segments';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.task_segments AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.task_segments';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.task_segments AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- tasks (subject: assignee_id)
DO $do$
BEGIN
  IF to_regclass('public.tasks') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.tasks absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.tasks';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.tasks AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(assignee_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.tasks';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.tasks AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(assignee_id))';
  END IF;
END $do$;

-- teaching_skill_history (subject: member_id, about_member_id)
DO $do$
BEGIN
  IF to_regclass('public.teaching_skill_history') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.teaching_skill_history absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.teaching_skill_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.teaching_skill_history AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id) AND util.coppa_write_allowed(about_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.teaching_skill_history';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.teaching_skill_history AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id) AND util.coppa_write_allowed(about_member_id))';
  END IF;
END $do$;

-- teen_sharing_overrides (subject: member_id)
DO $do$
BEGIN
  IF to_regclass('public.teen_sharing_overrides') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.teen_sharing_overrides absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.teen_sharing_overrides';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.teen_sharing_overrides AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.teen_sharing_overrides';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.teen_sharing_overrides AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(member_id))';
  END IF;
END $do$;

-- time_sessions (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.time_sessions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.time_sessions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.time_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.time_sessions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.time_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.time_sessions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- timer_configs (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.timer_configs') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.timer_configs absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.timer_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.timer_configs AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.timer_configs';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.timer_configs AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- user_saved_prompts (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.user_saved_prompts') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.user_saved_prompts absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.user_saved_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.user_saved_prompts AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.user_saved_prompts';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.user_saved_prompts AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_content_requests (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_content_requests') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_content_requests absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_content_requests';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_content_requests AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_content_requests';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_content_requests AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_copy_events (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_copy_events') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_copy_events absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_copy_events';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_copy_events AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_copy_events';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_copy_events AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_first_sightings (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_first_sightings') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_first_sightings absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_first_sightings';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_first_sightings AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_first_sightings';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_first_sightings AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_tool_sessions (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_tool_sessions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_tool_sessions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_tool_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_tool_sessions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_tool_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_tool_sessions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_user_bookmarks (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_user_bookmarks') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_user_bookmarks absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_bookmarks';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_user_bookmarks AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_bookmarks';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_user_bookmarks AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_user_progress (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_user_progress') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_user_progress absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_progress';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_user_progress AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_progress';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_user_progress AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- vault_user_visits (subject: user_id)
DO $do$
BEGIN
  IF to_regclass('public.vault_user_visits') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.vault_user_visits absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.vault_user_visits';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.vault_user_visits AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(user_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.vault_user_visits';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.vault_user_visits AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(user_id))';
  END IF;
END $do$;

-- victories (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.victories') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.victories absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victories';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.victories AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victories';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.victories AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- victory_celebrations (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.victory_celebrations') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.victory_celebrations absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victory_celebrations';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.victory_celebrations AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victory_celebrations';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.victory_celebrations AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- victory_voice_preferences (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.victory_voice_preferences') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.victory_voice_preferences absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.victory_voice_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.victory_voice_preferences AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.victory_voice_preferences';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.victory_voice_preferences AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- view_as_permissions (subject: target_member_id)
DO $do$
BEGIN
  IF to_regclass('public.view_as_permissions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.view_as_permissions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.view_as_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.view_as_permissions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(target_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.view_as_permissions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.view_as_permissions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(target_member_id))';
  END IF;
END $do$;

-- view_as_sessions (subject: viewing_as_id)
DO $do$
BEGIN
  IF to_regclass('public.view_as_sessions') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.view_as_sessions absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.view_as_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.view_as_sessions AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(viewing_as_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.view_as_sessions';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.view_as_sessions AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(viewing_as_id))';
  END IF;
END $do$;

-- visual_schedule_member_assignments (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.visual_schedule_member_assignments') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.visual_schedule_member_assignments absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.visual_schedule_member_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.visual_schedule_member_assignments AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.visual_schedule_member_assignments';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.visual_schedule_member_assignments AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- visual_schedule_member_tasks (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.visual_schedule_member_tasks') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.visual_schedule_member_tasks absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.visual_schedule_member_tasks';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.visual_schedule_member_tasks AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.visual_schedule_member_tasks';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.visual_schedule_member_tasks AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- widget_data_points (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.widget_data_points') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.widget_data_points absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.widget_data_points';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.widget_data_points AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.widget_data_points';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.widget_data_points AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- widget_templates (subject: family_member_id)
DO $do$
BEGIN
  IF to_regclass('public.widget_templates') IS NULL THEN
    RAISE NOTICE 'coppa write gates: public.widget_templates absent — skipped';
  ELSE
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_ins ON public.widget_templates';
    EXECUTE 'CREATE POLICY coppa_write_gate_ins ON public.widget_templates AS RESTRICTIVE FOR INSERT WITH CHECK (util.coppa_write_allowed(family_member_id))';
    EXECUTE 'DROP POLICY IF EXISTS coppa_write_gate_upd ON public.widget_templates';
    EXECUTE 'CREATE POLICY coppa_write_gate_upd ON public.widget_templates AS RESTRICTIVE FOR UPDATE USING (true) WITH CHECK (util.coppa_write_allowed(family_member_id))';
  END IF;
END $do$;

-- ============================================================================
-- Verification (runs at apply time; raises on failure)
-- ============================================================================
DO $verify$
DECLARE
  v_expected INTEGER := 268;
  v_actual INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_actual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('coppa_write_gate_ins', 'coppa_write_gate_upd');
  IF v_actual <> v_expected THEN
    RAISE EXCEPTION 'coppa write gates: expected % policies, found %', v_expected, v_actual;
  END IF;
  RAISE NOTICE 'coppa write gates: % policies in place across % tables', v_actual, v_expected / 2;
END $verify$;
