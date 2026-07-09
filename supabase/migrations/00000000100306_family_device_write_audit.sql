-- ============================================================================
-- 00000000100306_family_device_write_audit.sql
-- ============================================================================
-- Build: FDWA (Family-Device Write Audit — Remaining Tables), 2026-07-09
-- Founder-approved 2026-07-04 (claude/dispatch-factory/FDWA.md, rulings 1-6;
-- D-FDWA-1/2/3 all RESOLVED). Sequencing pair with PINR (personal-device
-- timeout -> PIN/picture relock, dispatched alongside this build).
--
-- Migration 100262 restored family-shadow-session write access to 8 tables
-- (tasks/lists/hub-tally domain) but explicitly filed the rest as a follow-up
-- ("journal, victories, widgets, practice_log, messages, ..."). This migration
-- closes that follow-up: 19 additional tables/surfaces where a kid's action on
-- the family tablet silently did nothing (theme changes, widget reorder,
-- tracker taps, Guided worksheets, journal Send-To, practice logs, timer
-- starts, reflections, rhythm check-ins, reward proposals, messaging,
-- notepad, mindsweep capture, family requests) — plus two related regression-
-- class gaps:
--
--   (a) family_members has NO self-update policy for ANY role — only
--       fm_update_primary_parent exists. theme_preferences/layout_preferences
--       writes (useThemePersistence.ts, Sidebar.tsx useSidebarPersistence)
--       have ALWAYS silently failed for every non-mom session, even on their
--       own real logins (not just family devices) — a platform-wide bug
--       hiding since the theme system shipped (PRD-03). Fixed via a NARROW
--       SECURITY DEFINER RPC (update_member_appearance), NOT a blanket
--       self-update policy — a blanket policy would expose
--       gamification_points/current_streak/pin_hash/role/etc. to client
--       UPDATE, violating Convention #198 (points only ever move through
--       record_point_transaction / the ledger choke point).
--
--   (b) redeem_own_prize() (migration 100266) is missing the family-shadow
--       branch its two siblings from the same era (place_member_creature,
--       set_member_last_viewed_page — migration 100275; consume_
--       opportunity_list_item — migration 100280) already have. Edited
--       against the CURRENT production body (confirmed via full-repo grep:
--       100266 is the ONLY CREATE OR REPLACE FUNCTION for this RPC; it has
--       never been redefined since — 100284's mention is a comment only).
--
-- Amended scope (founder ruling 2026-07-04, D-FDWA-2): ALL FOUR conditional
-- tables are INCLUDED — family_requests, messages (+ conversation_threads +
-- conversation_spaces + conversation_space_members, needed for the message-
-- thread creation chain), notepad_tabs (+ notepad_extracted_items), and
-- mindsweep_holding. Teens PIN-verified on a family device get full feature
-- use; attribution stays app-layer (Convention #39/#276 documented
-- limitation, unchanged by this migration) — the acting member's identity is
-- enforced by the client UI (View As member_session / PIN-verified), not by
-- this RLS layer, which only admits the shadow SESSION. PINR (dispatched
-- alongside this build) mitigates the walk-away risk with PIN/picture relock
-- on personal-device timeout.
--
-- Capability discipline: every new "<table>_family_device" policy grants
-- ONLY the commands (SELECT/INSERT/UPDATE/DELETE) that ALREADY exist for
-- SOME non-service-role caller on that table today (verified per-table
-- against the live policy set before writing this file). Append-only tables
-- (widget_data_points: no UPDATE/DELETE policy exists for anyone) and
-- tables with no DELETE policy today (time_sessions, messages,
-- conversation_threads, conversation_spaces, conversation_space_members,
-- family_requests) do NOT get a new DELETE capability introduced here.
--
-- Pattern: exact 100262 additive shape — DROP POLICY IF EXISTS / CREATE
-- POLICY with util.is_family_shadow_of(family_id) (direct column) or a join
-- through the table's existing family-scoping path (list_id/tab_id/thread_id
-- -> space_id -> conversation_spaces.family_id) for tables with no direct
-- family_id column. util.is_family_shadow_of() already exists (100262) —
-- reused as-is, no new helper functions for the RLS half.
--
-- Idempotent: DROP POLICY IF EXISTS / CREATE OR REPLACE FUNCTION throughout.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. widget_data_points — append-only (no UPDATE/DELETE policy exists for
--    anyone). Two new policies (SELECT + INSERT) to match that shape exactly.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "wdp_select_family_device" ON public.widget_data_points;
CREATE POLICY "wdp_select_family_device" ON public.widget_data_points
  FOR SELECT
  USING (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "wdp_insert_family_device" ON public.widget_data_points;
CREATE POLICY "wdp_insert_family_device" ON public.widget_data_points
  FOR INSERT
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. practice_log — FOR ALL (existing practice_log_manage_own is FOR ALL;
--    all four commands already exist for the owning member).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "practice_log_family_device" ON public.practice_log;
CREATE POLICY "practice_log_family_device" ON public.practice_log
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 3. journal_entries — FOR ALL (existing je_manage_own is FOR ALL).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "journal_entries_family_device" ON public.journal_entries;
CREATE POLICY "journal_entries_family_device" ON public.journal_entries
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 4. guided_form_responses — FOR ALL (existing split select/insert/update/
--    delete_own policies together already cover all four commands for the
--    owning member; FOR ALL here doesn't exceed that ceiling).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "gfr_family_device" ON public.guided_form_responses;
CREATE POLICY "gfr_family_device" ON public.guided_form_responses
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 5. dashboard_widgets — FOR ALL (existing dw_select/_insert/_update/_delete
--    already cover all four commands for the owning member).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "dw_family_device" ON public.dashboard_widgets;
CREATE POLICY "dw_family_device" ON public.dashboard_widgets
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 6. dashboard_configs — FOR ALL (existing dc_manage_own is FOR ALL).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "dc_family_device" ON public.dashboard_configs;
CREATE POLICY "dc_family_device" ON public.dashboard_configs
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 7. guiding_stars — FOR ALL (existing gs_manage_own is FOR ALL). Covers
--    child-created Guiding Stars on a family device.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "gs_family_device" ON public.guiding_stars;
CREATE POLICY "gs_family_device" ON public.guiding_stars
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 8. best_intentions — FOR ALL (existing bi_manage_own is FOR ALL). Covers
--    child-created Best Intentions on a family device (Convention #127).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bi_family_device" ON public.best_intentions;
CREATE POLICY "bi_family_device" ON public.best_intentions
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 9. self_knowledge — FOR ALL (existing sk_manage_own is FOR ALL).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "sk_family_device" ON public.self_knowledge;
CREATE POLICY "sk_family_device" ON public.self_knowledge
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 10. reflection_responses — FOR ALL (existing rr_manage_own is FOR ALL).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rr_family_device" ON public.reflection_responses;
CREATE POLICY "rr_family_device" ON public.reflection_responses
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 11. rhythm_completions — FOR ALL (existing rhythm_completions_manage_own
--     is FOR ALL).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rhythm_completions_family_device" ON public.rhythm_completions;
CREATE POLICY "rhythm_completions_family_device" ON public.rhythm_completions
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 12. randomizer_draws — no direct family_id column; join via list_id ->
--     public.lists.family_id (mirrors the table's own existing _read_parent/
--     _read_adults policies, which use the same join). FOR ALL (existing
--     randomizer_draws_manage_own is FOR ALL for the owning member).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "randomizer_draws_family_device" ON public.randomizer_draws;
CREATE POLICY "randomizer_draws_family_device" ON public.randomizer_draws
  FOR ALL
  USING (
    list_id IN (SELECT l.id FROM public.lists l WHERE util.is_family_shadow_of(l.family_id))
  )
  WITH CHECK (
    list_id IN (SELECT l.id FROM public.lists l WHERE util.is_family_shadow_of(l.family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 13. time_sessions — SELECT/INSERT/UPDATE only (no DELETE policy exists for
--     any non-primary-parent caller today — ts_manage_primary_parent is the
--     only FOR ALL and it's mom-only; useTimer.ts confirmed to never call
--     .delete() client-side, soft-delete via deleted_at is the real pattern).
--     Three separate policies to avoid granting a new DELETE capability.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ts_select_family_device" ON public.time_sessions;
CREATE POLICY "ts_select_family_device" ON public.time_sessions
  FOR SELECT
  USING (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "ts_insert_family_device" ON public.time_sessions;
CREATE POLICY "ts_insert_family_device" ON public.time_sessions
  FOR INSERT
  WITH CHECK (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "ts_update_family_device" ON public.time_sessions;
CREATE POLICY "ts_update_family_device" ON public.time_sessions
  FOR UPDATE
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 14. reward_proposals — FOR ALL (existing reward_proposals_select/_insert/
--     _update/_delete already cover all four commands for the proposer).
--     NOTE: migration 100278's own verification block asserts
--     COUNT(*)=4 policies on this table — that RAISE EXCEPTION is embedded
--     in 100278's own DO block and only fires when 100278 itself is applied;
--     it does not re-run on this migration, so adding a 5th policy here is
--     safe and does not need that check updated.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "reward_proposals_family_device" ON public.reward_proposals;
CREATE POLICY "reward_proposals_family_device" ON public.reward_proposals
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 15. conversation_spaces — the ROOT of the messaging chain (a new thread
--     requires an existing conversation_spaces row; conversation_threads has
--     no family_id of its own). SELECT/INSERT/UPDATE only — no DELETE
--     (cs_delete_parent is mom-only today; deleting an entire space is a
--     materially bigger action than what this build's silent-failure list
--     calls for, so that capability is deliberately NOT extended here).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cs_select_family_device" ON public.conversation_spaces;
CREATE POLICY "cs_select_family_device" ON public.conversation_spaces
  FOR SELECT
  USING (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "cs_insert_family_device" ON public.conversation_spaces;
CREATE POLICY "cs_insert_family_device" ON public.conversation_spaces
  FOR INSERT
  WITH CHECK (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "cs_update_family_device" ON public.conversation_spaces;
CREATE POLICY "cs_update_family_device" ON public.conversation_spaces
  FOR UPDATE
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 16. conversation_space_members — no family_id column; join via space_id ->
--     conversation_spaces.family_id. This is the bootstrap gate for adding
--     members to a brand-new space (findOrCreateDirectSpace /
--     useCreateSpace both INSERT here immediately after creating the space
--     row). SELECT/INSERT/UPDATE only — no DELETE (csm_delete_admin_or_parent
--     is admin/mom-only today; "leave space" for a family-device kid is out
--     of this build's scope).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "csm_select_family_device" ON public.conversation_space_members;
CREATE POLICY "csm_select_family_device" ON public.conversation_space_members
  FOR SELECT
  USING (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

DROP POLICY IF EXISTS "csm_insert_family_device" ON public.conversation_space_members;
CREATE POLICY "csm_insert_family_device" ON public.conversation_space_members
  FOR INSERT
  WITH CHECK (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

DROP POLICY IF EXISTS "csm_update_family_device" ON public.conversation_space_members;
CREATE POLICY "csm_update_family_device" ON public.conversation_space_members
  FOR UPDATE
  USING (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  )
  WITH CHECK (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 17. conversation_threads — no family_id column; join via space_id ->
--     conversation_spaces.family_id. SELECT/INSERT/UPDATE only — no DELETE
--     (none exists today for any non-service-role caller; archiving is done
--     via UPDATE is_archived, already covered).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ct_select_family_device" ON public.conversation_threads;
CREATE POLICY "ct_select_family_device" ON public.conversation_threads
  FOR SELECT
  USING (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

DROP POLICY IF EXISTS "ct_insert_family_device" ON public.conversation_threads;
CREATE POLICY "ct_insert_family_device" ON public.conversation_threads
  FOR INSERT
  WITH CHECK (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

DROP POLICY IF EXISTS "ct_update_family_device" ON public.conversation_threads;
CREATE POLICY "ct_update_family_device" ON public.conversation_threads
  FOR UPDATE
  USING (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  )
  WITH CHECK (
    space_id IN (SELECT cs.id FROM public.conversation_spaces cs WHERE util.is_family_shadow_of(cs.family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 18. messages — no family_id column; two-hop join via thread_id ->
--     conversation_threads.space_id -> conversation_spaces.family_id.
--     SELECT/INSERT/UPDATE only — no DELETE (none exists today for anyone).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "msg_select_family_device" ON public.messages;
CREATE POLICY "msg_select_family_device" ON public.messages
  FOR SELECT
  USING (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      JOIN public.conversation_spaces cs ON cs.id = ct.space_id
      WHERE util.is_family_shadow_of(cs.family_id)
    )
  );

DROP POLICY IF EXISTS "msg_insert_family_device" ON public.messages;
CREATE POLICY "msg_insert_family_device" ON public.messages
  FOR INSERT
  WITH CHECK (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      JOIN public.conversation_spaces cs ON cs.id = ct.space_id
      WHERE util.is_family_shadow_of(cs.family_id)
    )
  );

DROP POLICY IF EXISTS "msg_update_family_device" ON public.messages;
CREATE POLICY "msg_update_family_device" ON public.messages
  FOR UPDATE
  USING (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      JOIN public.conversation_spaces cs ON cs.id = ct.space_id
      WHERE util.is_family_shadow_of(cs.family_id)
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT ct.id FROM public.conversation_threads ct
      JOIN public.conversation_spaces cs ON cs.id = ct.space_id
      WHERE util.is_family_shadow_of(cs.family_id)
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 19. notepad_tabs — FOR ALL (existing nt_manage_own is FOR ALL, the only
--     policy on this table).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nt_family_device" ON public.notepad_tabs;
CREATE POLICY "nt_family_device" ON public.notepad_tabs
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 20. notepad_extracted_items — family_id column is nullable/not reliably
--     backfilled (added post-hoc via a remediation batch). Join via tab_id ->
--     notepad_tabs.family_id instead (NOT NULL, FK'd) — mirrors the table's
--     own existing nei_manage_via_tab policy shape. FOR ALL.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nei_family_device" ON public.notepad_extracted_items;
CREATE POLICY "nei_family_device" ON public.notepad_extracted_items
  FOR ALL
  USING (
    tab_id IN (SELECT nt.id FROM public.notepad_tabs nt WHERE util.is_family_shadow_of(nt.family_id))
  )
  WITH CHECK (
    tab_id IN (SELECT nt.id FROM public.notepad_tabs nt WHERE util.is_family_shadow_of(nt.family_id))
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 21. mindsweep_holding — FOR ALL (existing mh_manage_own is FOR ALL, the
--     only policy on this table).
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "mh_family_device" ON public.mindsweep_holding;
CREATE POLICY "mh_family_device" ON public.mindsweep_holding
  FOR ALL
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 22. family_requests — SELECT/INSERT/UPDATE only (no DELETE policy exists
--     for anyone today — status-based lifecycle, not hard delete). Covers
--     "Ask Mom" style outbound requests initiated from a family device.
-- ────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "fr_select_family_device" ON public.family_requests;
CREATE POLICY "fr_select_family_device" ON public.family_requests
  FOR SELECT
  USING (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "fr_insert_family_device" ON public.family_requests;
CREATE POLICY "fr_insert_family_device" ON public.family_requests
  FOR INSERT
  WITH CHECK (util.is_family_shadow_of(family_id));

DROP POLICY IF EXISTS "fr_update_family_device" ON public.family_requests;
CREATE POLICY "fr_update_family_device" ON public.family_requests
  FOR UPDATE
  USING (util.is_family_shadow_of(family_id))
  WITH CHECK (util.is_family_shadow_of(family_id));

-- ────────────────────────────────────────────────────────────────────────────
-- 23. family_members appearance — NARROW SECURITY DEFINER RPC (D-FDWA-1).
--     A blanket self-update policy is FORBIDDEN — it would expose
--     gamification_points/current_streak/pin_hash/role/etc. to client
--     UPDATE. This RPC touches ONLY theme_preferences/layout_preferences,
--     gated owner (own row) OR primary_parent OR family-shadow session —
--     the exact 100275 can_arrange_member_stickers shape. Fixes the
--     family-device case AND the universal non-mom self-theme bug (no
--     self-update policy of ANY kind has ever existed on family_members).
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_member_appearance(
  p_member_id UUID,
  p_theme_preferences JSONB DEFAULT NULL,
  p_layout_preferences JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, util
AS $fn$
DECLARE
  v_family_id UUID;
BEGIN
  SELECT family_id INTO v_family_id
    FROM public.family_members
   WHERE id = p_member_id;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF NOT (
    -- Owner: this is the caller's own member row
    EXISTS (
      SELECT 1 FROM public.family_members fm
       WHERE fm.id = p_member_id
         AND fm.user_id = auth.uid()
    )
    OR
    -- Primary parent (covers View As)
    EXISTS (
      SELECT 1 FROM public.families f
       WHERE f.id = v_family_id
         AND f.primary_parent_id = auth.uid()
    )
    OR
    -- Family-shadow session (family tablet) — app layer enforces which
    -- effective member is acting (Convention #39/#276)
    util.is_family_shadow_of(v_family_id)
  ) THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  -- NULL param = leave that column untouched (theme and layout writes are
  -- debounced independently on the client and must not clobber each other)
  UPDATE public.family_members
     SET theme_preferences = COALESCE(p_theme_preferences, theme_preferences),
         layout_preferences = COALESCE(p_layout_preferences, layout_preferences)
   WHERE id = p_member_id;

  RETURN jsonb_build_object('status', 'ok');
END;
$fn$;

REVOKE ALL ON FUNCTION public.update_member_appearance(UUID, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_member_appearance(UUID, JSONB, JSONB) TO authenticated;

COMMENT ON FUNCTION public.update_member_appearance IS
  'FDWA (2026-07-09): self-service (or primary-parent / family-shadow) UPDATE of theme_preferences/layout_preferences ONLY on family_members. No self-update RLS policy of any kind existed before this — theme/layout writes silently failed for every non-mom session, not just family devices. Pass NULL for a param to leave that column untouched. Never widen this RPC to touch other columns (gamification_points/pin_hash/role/etc. must stay mom-only via the untouched fm_update_primary_parent policy and the record_point_transaction ledger choke point, Convention #198/#280).';

-- ────────────────────────────────────────────────────────────────────────────
-- 24. redeem_own_prize() — add the family-shadow branch its siblings
--     (place_member_creature, set_member_last_viewed_page — 100275;
--     consume_opportunity_list_item — 100280) already have. Edited against
--     the CURRENT production body (migration 100266; confirmed via
--     repo-wide grep this is the ONLY CREATE OR REPLACE FUNCTION for this
--     RPC — never redefined since; 100284's mention of it is a comment
--     only, not a redefinition). ONLY the caller-resolution predicate
--     changes; every other line is byte-identical to 100266.
--
--     Why this shape works without a new p_acting_member_id parameter: the
--     prize row itself already fixes WHICH member the redeem is for
--     (v_prize.family_member_id) — same shape as place_member_creature's
--     can_arrange_member_stickers(v_row.family_id, v_row.family_member_id).
--     The RPC's job is "is this caller allowed to act for that member,"
--     not "which member is calling" — attribution stays app-layer per
--     ruling 5 (the client only ever passes the prize_id of a prize
--     belonging to the currently PIN-verified kid on that device).
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.redeem_own_prize(p_prize_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_prize        RECORD;
  v_caller       RECORD;
  v_mom_id       UUID;
  v_display      TEXT;
BEGIN
  SELECT * INTO v_prize FROM public.earned_prizes WHERE id = p_prize_id;
  IF v_prize.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Caller must be THE EARNER (own prize only) — either via their own real
  -- session (fm.user_id = auth.uid()) OR a family-shadow session for this
  -- family (FDWA — app layer enforces which kid is redeeming). Parents
  -- redeem via the normal UPDATE policy on the Prize Board — this RPC is
  -- the kid/self path.
  SELECT fm.id, fm.role, fm.display_name INTO v_caller
    FROM public.family_members fm
   WHERE fm.family_id = v_prize.family_id
     AND fm.id = v_prize.family_member_id
     AND (
       fm.user_id = auth.uid()
       OR util.is_family_shadow_of(v_prize.family_id)
     )
   LIMIT 1;

  IF v_caller.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_allowed');
  END IF;

  UPDATE public.earned_prizes
     SET redeemed_at = now(),
         redeemed_by = v_caller.id
   WHERE id = p_prize_id
     AND redeemed_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'already_redeemed');
  END IF;

  -- Quiet fire-and-forget notification to mom (dad-payment-notification pattern).
  -- Skip when mom redeems her own prize. Never fails the redeem.
  BEGIN
    IF v_caller.role <> 'primary_parent' THEN
      SELECT fm.id INTO v_mom_id
        FROM public.family_members fm
       WHERE fm.family_id = v_prize.family_id
         AND fm.role = 'primary_parent'
       LIMIT 1;

      IF v_mom_id IS NOT NULL THEN
        v_display := COALESCE(NULLIF(v_prize.prize_name, ''), NULLIF(v_prize.prize_text, ''), 'a reward');
        INSERT INTO public.notifications (
          family_id, recipient_member_id,
          notification_type, category,
          title, body,
          source_type, source_reference_id,
          action_url, priority
        ) VALUES (
          v_prize.family_id, v_mom_id,
          'prize_redeemed', 'gamification',
          format('%s used a reward', v_caller.display_name),
          v_display,
          'earned_prize', v_prize.id,
          '/prize-board', 'normal'
        );
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- notification is additive, never load-bearing
  END;

  RETURN jsonb_build_object(
    'status', 'redeemed',
    'prize_id', v_prize.id,
    'redeemed_by', v_caller.id
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.redeem_own_prize(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_own_prize(UUID) TO authenticated;

COMMENT ON FUNCTION public.redeem_own_prize IS
  'KIDS-REWARDS-PAGE Q2: kid-final self-redeem. Earner-only, redeem fields only, quiet mom notification. Un-redeem is a parent UPDATE (clears redeemed_at/redeemed_by) via the normal policy. FDWA (2026-07-09): added the family-shadow branch its siblings (place_member_creature/consume_opportunity_list_item) already had — a kid redeeming on the family tablet was previously silently blocked (fm.user_id never matches the shared shadow account).';

-- ────────────────────────────────────────────────────────────────────────────
-- 25. Verification
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Expected 35: 15 single FOR-ALL policies (practice_log, journal_entries,
  -- guided_form_responses, dashboard_widgets, dashboard_configs, guiding_stars,
  -- best_intentions, self_knowledge, reflection_responses, rhythm_completions,
  -- randomizer_draws, reward_proposals, notepad_tabs, notepad_extracted_items,
  -- mindsweep_holding) + 2 (widget_data_points: select+insert) +
  -- 3x6 (time_sessions, conversation_spaces, conversation_space_members,
  -- conversation_threads, messages, family_requests: select+insert+update
  -- each) = 15 + 2 + 18 = 35.
  SELECT COUNT(*) INTO v_count FROM pg_policies
   WHERE schemaname = 'public' AND policyname LIKE '%_family_device%'
     AND tablename IN (
       'widget_data_points','practice_log','journal_entries','guided_form_responses',
       'dashboard_widgets','dashboard_configs','guiding_stars','best_intentions',
       'self_knowledge','reflection_responses','rhythm_completions','randomizer_draws',
       'time_sessions','reward_proposals','conversation_spaces','conversation_space_members',
       'conversation_threads','messages','notepad_tabs','notepad_extracted_items',
       'mindsweep_holding','family_requests'
     );
  IF v_count <> 35 THEN
    RAISE EXCEPTION '[100306] expected 35 family-device additive policies, found %', v_count;
  END IF;
  RAISE NOTICE '[100306] family-device additive policies created: % (expected 35 — OK)', v_count;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_member_appearance'
  ) THEN
    RAISE EXCEPTION '[100306] update_member_appearance function missing after migration';
  END IF;

  RAISE NOTICE '[100306] update_member_appearance + redeem_own_prize shadow branch: OK';
END
$$;

COMMIT;
