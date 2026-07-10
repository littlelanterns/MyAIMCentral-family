-- ============================================================================
-- 100312 — RPC-EXECUTE SWEEP: remaining leaf functions from the 2026-07-09
--          adversarial safety-stack review (SAFETY_STACK_ADVERSARIAL_REVIEW.md
--          WORKSTREAM 2), scheduled follow-up to migrations 100310/100311.
--
-- Territory: supabase/migrations/ + tests/ only, per seat direction. No
-- Edge Function or frontend code touched — client-caller analysis below is
-- read-only evidence (grep across src/ and supabase/functions/), not a
-- rewrite of any call site.
--
-- Three shapes used, matching the exact precedents already proven live in
-- migrations 100298 (process_routine_step_completion), 100300 (godmother
-- lockdown), and 100311 (grant_money / apply_permission_profile):
--
--   GROUP A — in-body family-membership authorization gate (has a real
--   client caller; a blanket revoke would break the UI). Gate resolves
--   AFTER the read needed to determine the target's family_id, BEFORE any
--   write. `RAISE EXCEPTION 'Not authorized'` on failure. Additionally
--   REVOKEs the (unused) `anon` grant as defense-in-depth — no legitimate
--   caller is ever unauthenticated for these two, so closing the grant-level
--   door costs nothing and narrows the attack surface even if the in-body
--   gate were ever bypassed by a future refactor.
--     - advance_coloring_reveal(UUID)              — client caller:
--       src/components/reward-reveals/ContractRevealWatcher.tsx:45. Also
--       called internally by execute_coloring_reveal_godmother (migration
--       100228; the internal caller is NOT roll_creature_for_completion,
--       which was DROPPED entirely by migration 100221 — that stale
--       reference was caught and corrected before this migration shipped).
--       execute_coloring_reveal_godmother is itself locked to service_role
--       -only EXECUTE (migration 100300's godmother lockdown), reached via
--       an authenticated client session's direct INSERT into deed_firings →
--       the SECURITY DEFINER trg_deed_firing_dispatch trigger →
--       dispatch_godmothers → execute_coloring_reveal_godmother (all
--       SECURITY DEFINER; proven live end-to-end in migration 100300's own
--       verification pass). auth.uid()/auth.role() are GUC-based and
--       unaffected by nested SECURITY DEFINER role switches, so this new
--       gate sees the REAL end user (authenticated, not service_role) for
--       that call path and correctly passes on the family-membership check
--       — matching the LEGIT-MOM/LEGIT-DAD precedent proven for
--       process_routine_step_completion in migration 100298's verification.
--       (A server-side/cron-triggered deed-firing path, if one exists, would
--       run under a true service_role session and short-circuit the gate's
--       first branch instead — also safe.)
--     - award_custom_reward_for_completion(UUID)    — client caller:
--       src/lib/connector/awardCustomReward.ts:43 (awardCustomRewardForCompletion,
--       called from 4 completion/approval hooks). Bounded reward (read from
--       task_rewards, never caller-supplied), idempotent, approval-respecting
--       — the review judged a same-family gate sufficient here.
--
--   GROUP B — service-role-only revoke (no legitimate client caller —
--   verified by grep across src/ and supabase/functions/: every call site
--   found uses a service-role Edge Function client or a SECURITY DEFINER
--   trigger, both unaffected by revoking PUBLIC/anon/authenticated). Same
--   `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ...
--   TO service_role;` shape as migration 100310.
--     - award_starter_creature(UUID) — only caller is trg_award_starter_creature
--       (SECURITY DEFINER trigger) + the migration 100276 one-time backfill.
--       migration 100276 revoked FROM anon explicitly but never revoked FROM
--       PUBLIC — the function's birth-time default PUBLIC grant survived
--       untouched, which is why anon could still reach it (confirmed live:
--       raw ACL carried a bare `=X/postgres` PUBLIC entry). This migration
--       closes that specific gap.
--     - dispatch_single_grant(UUID) — only caller:
--       supabase/functions/evaluate-deferred-contracts/index.ts (service-role
--       client, confirmed).
--     - delete_book_extractions_by_audience(UUID, TEXT) — no live client or
--       Edge Function caller found (grepped repo-wide); the bookshelf-study-guide
--       Edge Function's actual call sites are update_book_extraction_youth_text
--       only. Registered as wired in claude/feature-decisions/PRD-23-...md but
--       the delete-by-audience call site was not found live — locked down
--       regardless since it is unused and unauthenticated-writable.
--     - insert_book_chunks(UUID, JSONB) — only caller:
--       supabase/functions/bookshelf-process/index.ts (service-role, confirmed).
--     - insert_book_extractions(UUID, JSONB, TEXT) — only caller:
--       supabase/functions/bookshelf-extract/index.ts (service-role, confirmed).
--     - insert_book_extractions_study_guide(UUID, TEXT, JSONB) — no live
--       caller found anywhere (grepped repo-wide) — appears superseded by the
--       update_book_extraction_youth_text UPDATE-based pattern
--       bookshelf-study-guide actually uses today. Locked down as dead,
--       unauthenticated-writable code.
--     - update_book_cache_embedding(UUID, TEXT),
--       update_book_chunk_embedding(UUID, TEXT),
--       update_book_extraction_embedding(UUID, TEXT) — only caller:
--       supabase/functions/embed/index.ts (service-role, confirmed; embed
--       also independently gates its own HTTP entry on the service-role
--       bearer token per its own code, so this is defense-in-depth on top of
--       an already-authenticated Edge Function).
--     - update_book_extraction_key_points(UUID[], BOOLEAN) — only caller:
--       supabase/functions/bookshelf-key-points/index.ts (service-role,
--       confirmed).
--     - update_book_extraction_youth_text(UUID, TEXT, TEXT) — only caller:
--       supabase/functions/bookshelf-study-guide/index.ts (service-role,
--       confirmed).
--     - set_bookshelf_item_library_id(UUID, UUID, TEXT, INTEGER) — only
--       caller: supabase/functions/bookshelf-process/index.ts (service-role,
--       confirmed).
--     - upsert_book_library(TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, JSONB, TEXT)
--       — found by the tests/rpc-grant-audit.test.ts pin during authoring
--       (not in the review's original enumerated list — the review's live
--       probing focused on the ~15 it named, this one slipped through). Only
--       caller: supabase/functions/bookshelf-process/index.ts (service-role,
--       confirmed). Writes into the SHARED platform_intelligence.book_library
--       cache with no per-family scoping — an unauthenticated caller could
--       spam-insert fake book entries into the platform-wide library.
--
--   GROUP C — anon-only revoke, `authenticated` stays (the write target is
--   platform_intelligence.book_extractions, the SHARED cross-family platform
--   book cache with no family_id column at all — there is no per-family
--   membership check that can be meaningfully applied here; the correct
--   authorization boundary for this shared-cache architecture is simply
--   "must be a real authenticated platform user," matching the exact
--   pattern migration 100113 already proved correct for
--   increment_vault_view_count, `REVOKE ... FROM anon, PUBLIC; GRANT ... TO
--   authenticated;`). Both have real client callers in
--   src/lib/extractionActions.ts (BookShelf custom-insight edit UI, mom-facing).
--     - create_custom_extraction(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
--     - update_extraction_text(UUID, TEXT, TEXT)
--
--   ALREADY CLOSED, NO ACTION (re-verified live before writing this
--   migration, listed here only so this file is a complete record of the
--   review's WORKSTREAM 2 table):
--     - grant_points, update_ethics_pattern_embedding,
--       insert_ethics_pattern_candidate — REVOKEd to service_role-only by
--       migration 100310. Confirmed live: anon=false, authenticated=false,
--       service_role=true.
--     - grant_money, apply_permission_profile — in-body gates added by
--       migration 100311. Confirmed live: gate present in prosrc, both
--       still authenticated-reachable at the grant layer (gate is the
--       defense, matching this migration's Group A precedent).
--     - increment_vault_view_count — already anon=false / authenticated=true
--       since its own migration 100113 (correctly revoked FROM anon, PUBLIC
--       at creation, unlike award_starter_creature's later, incomplete
--       revoke). No action needed.
--
-- ── grant_money amount-tamper hardening (dispatch item 2) ─────────────────
-- Migration 100311 closed the CRITICAL unauthenticated/cross-tenant vector
-- but explicitly left the narrower same-family risk open: both real client
-- callers (src/hooks/useTasks.ts useCompleteTask, and
-- src/components/tasks/useTaskCompletion.ts) read the reward amount from
-- task_rewards via a CLIENT-SIDE Supabase select, then pass that number as
-- grant_money's p_amount RPC parameter — the read happens in the browser,
-- so the number is still attacker-editable in devtools between the read and
-- the RPC call. Neither caller is server-side (both fire from ordinary
-- browser sessions, not an Edge Function), so the "if all remaining callers
-- are already server-side, document and gate accordingly" escape hatch does
-- NOT apply here.
--
-- This migration ships the SERVER-COMPUTED replacement,
-- grant_money_for_task_completion(p_task_completion_id UUID) — mirrors
-- award_custom_reward_for_completion's shape exactly (accepts a completion
-- id, reads the reward from task_rewards INSIDE the function body, never
-- trusts a caller-supplied amount, AND enforces the same Q7 approval-timing
-- rule — require_approval tasks pay out only at mom's approval, never at
-- raw completion, since financial_transactions is append-only with no
-- reversal path) and reuses grant_money's own tested balance-calc/
-- idempotent-insert logic via an internal call, matching the
-- p_transaction_type='opportunity_earned' / p_source_type='task_completion'
-- / p_source_reference_id=<completion id> shape both existing call sites
-- already send, so the uq_financial_transactions_forward_per_completion
-- partial unique index (migration 100174) continues to provide the exact
-- same idempotency guarantee unchanged.
--
-- NOT WIRED to either client call site in this migration — doing so
-- requires editing src/hooks/useTasks.ts and
-- src/components/tasks/useTaskCompletion.ts, both explicitly out of this
-- worker's territory (frontend files; a shared dev server is running
-- Playwright suites against them this session). The new RPC is
-- auth-gated-from-birth and safe to sit unused; wiring the two call sites
-- over to it (removing the client-side amount computation entirely) is a
-- flagged, explicit follow-up for a dedicated frontend-territory session.
-- Until that follow-up lands, the residual same-family amount-tamper risk
-- on the OLD grant_money path remains open, exactly as migration 100311
-- documented.
--
-- Idempotent throughout: REVOKE/GRANT/CREATE OR REPLACE are all safe to
-- re-run.
-- ============================================================================


-- ============================================================================
-- GROUP A — in-body authorization gates
-- ============================================================================

-- ── advance_coloring_reveal ────────────────────────────────────────────────
-- Logic body is BYTE-FOR-BYTE identical to the live definition read directly
-- via pg_get_functiondef before authoring this migration — the only addition
-- is the gate block, inserted immediately after the reveal lookup (the first
-- read that establishes v_reveal.family_id) and before any further logic.

CREATE OR REPLACE FUNCTION public.advance_coloring_reveal(p_reveal_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_reveal      RECORD;
  v_library     RECORD;
  v_new_step    INTEGER;
  v_step_key    TEXT;
  v_new_zone_ids INTEGER[];
  v_seq         JSONB;
  v_is_complete BOOLEAN := false;
  v_authorized  BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_reveal FROM public.member_coloring_reveals WHERE id = p_reveal_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'reveal_not_found');
  END IF;

  -- Authorization gate (100312) — MUST run before any state is read further
  -- or written. Family-membership, not caller-identity — matches the
  -- LEGIT-MOM/LEGIT-DAD "mom or a sibling acting on another member's behalf"
  -- shape already proven correct for process_routine_step_completion.
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = v_reveal.family_id
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_reveal.is_complete THEN
    RETURN jsonb_build_object('already_complete', true);
  END IF;

  SELECT * INTO v_library FROM public.coloring_reveal_library WHERE id = v_reveal.coloring_image_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'library_image_not_found');
  END IF;

  v_new_step := v_reveal.current_step + 1;
  v_step_key := v_reveal.reveal_step_count::text;

  -- Get the reveal_sequences for this step count
  v_seq := v_library.reveal_sequences -> v_step_key;
  IF v_seq IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_step_count', 'step_key', v_step_key);
  END IF;

  -- reveal_sequences[step_key] is an array of arrays; 0-based index
  -- v_new_step is 1-based, so access index (v_new_step - 1)
  SELECT ARRAY(
    SELECT (value)::integer
    FROM jsonb_array_elements(v_seq -> (v_new_step - 1))
  ) INTO v_new_zone_ids;

  IF v_new_zone_ids IS NULL THEN
    RETURN jsonb_build_object('error', 'step_out_of_range', 'step', v_new_step, 'max', v_reveal.reveal_step_count);
  END IF;

  v_is_complete := v_new_step >= v_reveal.reveal_step_count;

  UPDATE public.member_coloring_reveals
     SET current_step = v_new_step,
         revealed_zone_ids = revealed_zone_ids || v_new_zone_ids,
         is_complete = v_is_complete,
         completed_at = CASE WHEN v_is_complete THEN now() ELSE completed_at END
   WHERE id = p_reveal_id;

  RETURN jsonb_build_object(
    'advanced', true,
    'new_step', v_new_step,
    'total_steps', v_reveal.reveal_step_count,
    'newly_revealed_zone_ids', to_jsonb(v_new_zone_ids),
    'is_complete', v_is_complete,
    'image_slug', v_library.slug
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.advance_coloring_reveal(UUID) FROM PUBLIC, anon;

COMMENT ON FUNCTION public.advance_coloring_reveal IS
  'Build M coloring-reveal step advancer. 100312: added the family-membership '
  'authorization gate (service_role OR caller is a family_members row in the '
  'same family as the reveal) BEFORE any further read/write, plus an explicit '
  'REVOKE FROM anon as defense-in-depth. No other logic changes — body is '
  'otherwise byte-for-byte identical to the migration 100126 definition.';


-- ── award_custom_reward_for_completion ─────────────────────────────────────
-- Logic body is BYTE-FOR-BYTE identical to the live definition read directly
-- via pg_get_functiondef before authoring this migration — the only addition
-- is the gate block, inserted immediately after the task lookup (the first
-- read that establishes v_task.family_id) and before the reward-type checks.

CREATE OR REPLACE FUNCTION public.award_custom_reward_for_completion(p_task_completion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion   RECORD;
  v_task         RECORD;
  v_reward       RECORD;
  v_desc         TEXT;
  v_prize_type   TEXT;
  v_prize_id     UUID;
  v_authorized   BOOLEAN := FALSE;
BEGIN
  SELECT tc.id, tc.task_id, tc.approval_status, tc.completion_type,
         COALESCE(tc.family_member_id, tc.member_id) AS earner_id
    INTO v_completion
    FROM public.task_completions tc
   WHERE tc.id = p_task_completion_id;

  IF v_completion.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  -- Practice / mastery-submit rows never award (Convention #200 parity)
  IF v_completion.completion_type IN ('practice', 'mastery_submit') THEN
    RETURN jsonb_build_object('status', 'skipped_completion_type');
  END IF;

  -- Idempotency: one prize per completion
  IF EXISTS (
    SELECT 1 FROM public.earned_prizes ep
    WHERE ep.awarded_completion_id = v_completion.id
  ) THEN
    RETURN jsonb_build_object('status', 'already_awarded');
  END IF;

  -- [S4] + reward_visibility, reward_shared_with
  SELECT t.id, t.family_id, t.title, t.created_by, t.require_approval,
         t.reward_description, t.reward_image_url, t.reward_image_asset_key,
         t.reward_visibility, t.reward_shared_with
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'task_not_found');
  END IF;

  -- Authorization gate (100312) — MUST run before any reward-type check or
  -- earned_prizes write. Family-membership, matching the same shape proven
  -- correct across process_routine_step_completion / grant_money /
  -- apply_permission_profile / advance_coloring_reveal.
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = v_task.family_id
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT tr.reward_type, tr.reward_value INTO v_reward
    FROM public.task_rewards tr
   WHERE tr.task_id = v_task.id
   LIMIT 1;

  -- Live vocabulary: 'privilege' / 'custom'. PRD-language values kept for
  -- forward compatibility.
  IF v_reward.reward_type IS NULL
     OR v_reward.reward_type NOT IN ('privilege', 'custom', 'privileges', 'family_activities') THEN
    RETURN jsonb_build_object('status', 'skipped_reward_type');
  END IF;

  -- Q7 timing rule: approval-required items award at mom's APPROVAL only.
  IF COALESCE(v_task.require_approval, false)
     AND COALESCE(v_completion.approval_status, 'pending') <> 'approved' THEN
    RETURN jsonb_build_object('status', 'skipped_pending_approval');
  END IF;

  IF v_completion.earner_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_no_member');
  END IF;

  v_desc := COALESCE(
    NULLIF(v_task.reward_description, ''),
    NULLIF(v_reward.reward_value ->> 'description', ''),
    v_task.title
  );

  v_prize_type := CASE
    WHEN v_task.reward_image_url IS NOT NULL AND v_task.reward_image_url <> '' THEN 'image'
    WHEN v_task.reward_image_asset_key IS NOT NULL AND v_task.reward_image_asset_key <> '' THEN 'platform_image'
    ELSE 'text'
  END;

  -- [S4] visibility snapshot: NULL → 'family' (status quo); self-rewards carry
  -- 'private'/'shared' from the task promise (§11 — enforced by the 100266
  -- earned_prizes RLS at read time, never rendered-then-hidden).
  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, shared_with_member_ids,
    created_by, awarded_completion_id
  ) VALUES (
    v_task.family_id, v_completion.earner_id,
    'task_completion', v_task.id,
    v_prize_type, v_desc, NULLIF(LEFT(BTRIM(v_desc), 80), ''),
    NULLIF(v_task.reward_image_url, ''), NULLIF(v_task.reward_image_asset_key, ''),
    COALESCE(v_task.reward_visibility, 'family'), COALESCE(v_task.reward_shared_with, '{}'),
    v_task.created_by, v_completion.id
  )
  ON CONFLICT (awarded_completion_id) WHERE awarded_completion_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_prize_id;

  IF v_prize_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_awarded');
  END IF;

  RETURN jsonb_build_object('status', 'awarded', 'prize_id', v_prize_id);
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.award_custom_reward_for_completion(UUID) FROM PUBLIC, anon;

COMMENT ON FUNCTION public.award_custom_reward_for_completion IS
  'KIDS-REWARDS-PAGE Q7 custom-reward awarder. 100312: added the '
  'family-membership authorization gate (service_role OR caller is a '
  'family_members row in the completion''s task''s family) BEFORE any '
  'reward-type check or earned_prizes write, plus an explicit REVOKE FROM '
  'anon as defense-in-depth. No other logic changes — body is otherwise '
  'byte-for-byte identical to the migration 100278 definition.';


-- ============================================================================
-- GROUP A (new) — server-computed sibling for grant_money
-- ============================================================================
-- Closes the residual same-family amount-tamper vector documented in
-- migration 100311. NOT wired to any client call site by this migration —
-- see the header comment. Auth-gated from birth (Convention #280).

CREATE OR REPLACE FUNCTION public.grant_money_for_task_completion(p_task_completion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion RECORD;
  v_task       RECORD;
  v_reward     RECORD;
  v_amount     DECIMAL(10,2);
  v_authorized BOOLEAN := FALSE;
  v_result     JSONB;
BEGIN
  SELECT tc.id, tc.task_id, tc.approval_status,
         COALESCE(tc.family_member_id, tc.member_id) AS earner_id
    INTO v_completion
    FROM public.task_completions tc
   WHERE tc.id = p_task_completion_id;

  IF v_completion.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT t.id, t.family_id, t.title, t.task_type, t.require_approval
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'task_not_found');
  END IF;

  -- Authorization gate — MUST run before any reward read or grant_money
  -- call. Family-membership, same shape as every sibling gate in this file.
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = v_task.family_id
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_task.task_type IS NULL OR v_task.task_type NOT LIKE 'opportunity%' THEN
    RETURN jsonb_build_object('status', 'skipped_task_type');
  END IF;

  -- Q7 timing rule (mirrors award_custom_reward_for_completion exactly):
  -- approval-required completions pay out only at mom's APPROVAL, never at
  -- raw completion. financial_transactions is append-only (Convention #223)
  -- — there is no reversal path once a grant lands, so this MUST run before
  -- any reward read, not just before the write.
  IF COALESCE(v_task.require_approval, false)
     AND COALESCE(v_completion.approval_status, 'pending') <> 'approved' THEN
    RETURN jsonb_build_object('status', 'skipped_pending_approval');
  END IF;

  IF v_completion.earner_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_no_member');
  END IF;

  SELECT tr.reward_type, tr.reward_value INTO v_reward
    FROM public.task_rewards tr
   WHERE tr.task_id = v_task.id
   LIMIT 1;

  IF v_reward.reward_type IS DISTINCT FROM 'money' THEN
    RETURN jsonb_build_object('status', 'skipped_reward_type');
  END IF;

  -- SERVER-COMPUTED amount — read from task_rewards inside this function
  -- body. NEVER a caller-supplied parameter. This is the whole point of
  -- this function's existence.
  v_amount := (v_reward.reward_value ->> 'amount')::DECIMAL(10,2);

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RETURN jsonb_build_object('status', 'skipped_invalid_amount');
  END IF;

  -- Delegates to grant_money for the actual balance-calc + idempotent
  -- insert. grant_money's own family-membership gate (migration 100311)
  -- re-checks the same caller/family and passes harmlessly (auth.uid()/
  -- auth.role() are GUC-based and read the real end user regardless of this
  -- function's SECURITY DEFINER context, matching the exact nested-call
  -- reasoning already proven for advance_coloring_reveal /
  -- execute_coloring_reveal_godmother above).
  v_result := public.grant_money(
    v_task.family_id,
    v_completion.earner_id,
    v_amount,
    'opportunity_earned',
    'Completed: ' || COALESCE(v_task.title, ''),
    'task_completion',
    p_task_completion_id,
    NULL,
    '{}'::jsonb
  );

  RETURN v_result;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.grant_money_for_task_completion(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.grant_money_for_task_completion(UUID) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_money_for_task_completion(UUID) TO service_role;

COMMENT ON FUNCTION public.grant_money_for_task_completion IS
  '100312: server-computed replacement for the client-side amount-supplying '
  'grant_money call pattern in src/hooks/useTasks.ts and '
  'src/components/tasks/useTaskCompletion.ts. Reads the reward amount from '
  'task_rewards inside the function body — never trusts a caller-supplied '
  'amount. NOT YET WIRED to either client call site (frontend edit is out '
  'of this migration''s territory) — see migration header comment. Matches '
  'the p_transaction_type=''opportunity_earned''/p_source_type=''task_completion''/ '
  'p_source_reference_id=<completion id> shape both existing call sites '
  'already send, so uq_financial_transactions_forward_per_completion '
  '(migration 100174) continues to provide identical idempotency once wired.';


-- ============================================================================
-- GROUP B — service-role-only lockdown (no legitimate client caller)
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.award_starter_creature(UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.award_starter_creature(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.dispatch_single_grant(UUID) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.dispatch_single_grant(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_book_extractions_by_audience(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.delete_book_extractions_by_audience(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_book_chunks(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_book_chunks(UUID, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_book_extractions(UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_book_extractions(UUID, JSONB, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_book_extractions_study_guide(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_book_extractions_study_guide(UUID, TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_book_cache_embedding(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_book_cache_embedding(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_book_chunk_embedding(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_book_chunk_embedding(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_book_extraction_embedding(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_book_extraction_embedding(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_book_extraction_key_points(UUID[], BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_book_extraction_key_points(UUID[], BOOLEAN) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_book_extraction_youth_text(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_book_extraction_youth_text(UUID, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.set_bookshelf_item_library_id(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_bookshelf_item_library_id(UUID, UUID, TEXT, INTEGER) TO service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_book_library(TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.upsert_book_library(TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, JSONB, TEXT) TO service_role;


-- ============================================================================
-- GROUP C — anon-only revoke (shared platform book cache; authenticated
--           stays, matching the increment_vault_view_count / migration
--           100113 precedent)
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.create_custom_extraction(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_custom_extraction(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_extraction_text(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.update_extraction_text(UUID, TEXT, TEXT) TO authenticated;


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_advance_gate    BOOLEAN;
  v_reward_gate     BOOLEAN;
  v_new_rpc_exists  BOOLEAN;
  v_group_b_locked  BOOLEAN;
  v_group_c_state   BOOLEAN;
BEGIN
  SELECT prosrc LIKE '%Not authorized%' AND prosrc LIKE '%auth.role() = ''service_role''%'
    INTO v_advance_gate
  FROM pg_proc WHERE proname = 'advance_coloring_reveal' AND pronamespace = 'public'::regnamespace;

  SELECT prosrc LIKE '%Not authorized%' AND prosrc LIKE '%auth.role() = ''service_role''%'
    INTO v_reward_gate
  FROM pg_proc WHERE proname = 'award_custom_reward_for_completion' AND pronamespace = 'public'::regnamespace;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'grant_money_for_task_completion' AND pronamespace = 'public'::regnamespace
  ) INTO v_new_rpc_exists;

  SELECT bool_and(
    NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) INTO v_group_b_locked
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'award_starter_creature', 'dispatch_single_grant',
      'delete_book_extractions_by_audience', 'insert_book_chunks',
      'insert_book_extractions', 'insert_book_extractions_study_guide',
      'update_book_cache_embedding', 'update_book_chunk_embedding',
      'update_book_extraction_embedding', 'update_book_extraction_key_points',
      'update_book_extraction_youth_text', 'set_bookshelf_item_library_id',
      'upsert_book_library'
    );

  SELECT bool_and(
    NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) INTO v_group_c_state
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('create_custom_extraction', 'update_extraction_text');

  RAISE NOTICE 'migration 100312: RPC-EXECUTE sweep applied';
  RAISE NOTICE '  advance_coloring_reveal gate present: %', v_advance_gate;
  RAISE NOTICE '  award_custom_reward_for_completion gate present: %', v_reward_gate;
  RAISE NOTICE '  grant_money_for_task_completion created: %', v_new_rpc_exists;
  RAISE NOTICE '  Group B (13 fns) all service_role-only: %', v_group_b_locked;
  RAISE NOTICE '  Group C (2 fns) anon closed / authenticated open: %', v_group_c_state;
END $$;
