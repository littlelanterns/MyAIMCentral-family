-- ============================================================================
-- 100298 — CRITICAL FIX: process_routine_step_completion had zero
--          authorization check
--
-- rls-verifier (dispatched against migration 100296, PRD-24 Point Economy
-- Addendum Slice A2) found and live-proved a cross-tenant state-mutation
-- vulnerability, wrapped in BEGIN...ROLLBACK against real production data,
-- zero residue left: an authenticated member of ANY family could call
-- process_routine_step_completion('<any routine_step_completions.id>') for
-- a completion belonging to a COMPLETELY UNRELATED family and force a real
-- points award AND a real money grant onto that other family's member.
-- Confirmed with a real cross-family probe (Testworth's Sarah -> OurFamily's
-- Helam): a 'stars' step reward moved Helam's gamification_points 30 -> 37,
-- and a 'money' step reward minted a real $25.00 financial_transactions row
-- — both triggered entirely by a stranger with no relationship to that
-- family. The payout always follows the completion row's own member_id
-- (never redirectable to the caller), so this is not a self-enrichment
-- vector, but it is a real unauthorized-mutation vector against any family
-- on the platform.
--
-- Root cause: unlike get_member_day_obligations and calculate_allowance_
-- progress (both rewritten in the immediately-preceding migration 100295,
-- both of which DO gate on "caller is service_role OR a member of the
-- subject's family"), process_routine_step_completion was modeled on
-- award_custom_reward_for_completion's no-explicit-auth-check precedent —
-- but that precedent's safety argument ("the completion row's own RLS-
-- gated creation already bounds the blast radius, and no redirection is
-- possible") does NOT hold here, because nothing about calling this RPC
-- requires the caller to have created or even have RLS visibility into the
-- referenced row; SECURITY DEFINER lookups bypass RLS entirely, and the
-- only requirement was possessing a valid UUID.
--
-- Fix: add the SAME auth gate get_member_day_obligations/
-- calculate_allowance_progress already use, resolved AFTER looking up the
-- task's family_id (an internal SECURITY DEFINER read, not itself a leak)
-- and BEFORE any reward is ever computed or paid. RAISE EXCEPTION on
-- failure, matching the established precedent for authorization failures
-- in this codebase (distinct from the soft 'status':'skipped_*' returns
-- used elsewhere in this same function for legitimate-but-inapplicable
-- cases like an orphaned step). Slice A3's legitimate client call site
-- (a member completing their own or a shared routine's step) always
-- satisfies this — the caller is necessarily a member of the task's family.
--
-- Rest of the function body is BYTE-FOR-BYTE identical to the 100296
-- definition — this is an auth-gate-only patch, nothing else changed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_routine_step_completion(
  p_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion     RECORD;
  v_step           RECORD;
  v_step_label     TEXT;
  v_task           RECORD;
  v_template       RECORD;
  v_step_points    INTEGER;
  v_pt_result      JSONB;
  v_prize_id       UUID;
  v_money_result   JSONB;
  v_required       INTEGER;
  v_done           INTEGER;
  v_newly_complete BOOLEAN := FALSE;
  v_contributor    RECORD;
  v_rc_result      JSONB;
  v_result         JSONB := jsonb_build_object('status', 'processed');
  v_authorized     BOOLEAN := FALSE;
BEGIN
  SELECT rsc.id, rsc.task_id, rsc.step_id, rsc.member_id, rsc.period_date, rsc.instance_number
    INTO v_completion
    FROM public.routine_step_completions rsc
   WHERE rsc.id = p_completion_id;

  IF v_completion.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF v_completion.step_id IS NULL THEN
    -- Orphaned completion (a template edit removed this step) — nothing to pay.
    RETURN jsonb_build_object('status', 'skipped_orphan_step');
  END IF;

  SELECT stp.id, stp.section_id, stp.step_name, stp.display_name_override,
         stp.reward_type, stp.reward_amount, stp.reward_description,
         stp.reward_image_url, stp.reward_image_asset_key, stp.instance_count
    INTO v_step
    FROM public.task_template_steps stp
   WHERE stp.id = v_completion.step_id;

  IF v_step.id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_step_not_found');
  END IF;

  SELECT t.id, t.family_id, t.template_id, t.counts_for_gamification, t.title
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_task_not_found');
  END IF;

  -- ── Authorization gate (100298 fix) — MUST run before any reward is
  -- computed or paid. Same pattern as get_member_day_obligations /
  -- calculate_allowance_progress (migration 100295): service_role, or a
  -- member of the SAME family as the task being completed. ──
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

  SELECT tt.routine_points_mode, tt.routine_step_points, tt.routine_completion_points
    INTO v_template
    FROM public.task_templates tt
   WHERE tt.id = v_task.template_id;

  v_step_label := COALESCE(NULLIF(v_step.display_name_override, ''), v_step.step_name, v_task.title);

  -- ── Per-step points: a step-level 'stars' reward REPLACES the routine's
  -- per-step amount for this step only; otherwise routine_points_mode=
  -- 'per_step' pays the routine-level amount. Independent of
  -- counts_for_gamification=false, which silences BOTH. ──
  IF COALESCE(v_task.counts_for_gamification, true) THEN
    IF v_step.reward_type = 'stars' AND v_step.reward_amount IS NOT NULL THEN
      v_step_points := v_step.reward_amount::integer;
    ELSIF COALESCE(v_template.routine_points_mode, 'none') = 'per_step' THEN
      v_step_points := v_template.routine_step_points;
    END IF;

    IF v_step_points IS NOT NULL AND v_step_points > 0 THEN
      BEGIN
        v_pt_result := public.record_point_transaction(
          v_task.family_id,
          v_completion.member_id,
          v_step_points,
          'earn',
          'routine_step',
          v_completion.step_id,
          'Step: ' || v_step_label,
          format('rsp:%s:%s:%s:%s', v_completion.step_id, v_completion.member_id,
                 v_completion.period_date, v_completion.instance_number),
          NULL
        );
        v_result := v_result || jsonb_build_object('step_points', v_pt_result);
      EXCEPTION WHEN OTHERS THEN
        -- Convention #199: a reward-side failure must never block the
        -- checkmark the client already committed.
        v_result := v_result || jsonb_build_object('step_points_error', SQLERRM);
      END;
    END IF;
  END IF;

  -- ── Per-step prize (privilege / custom / money) — independent of points,
  -- mom sets these per-step regardless of routine_points_mode. ──
  IF v_step.reward_type IN ('privilege', 'custom') THEN
    BEGIN
      INSERT INTO public.earned_prizes (
        family_id, family_member_id, source_type, source_id,
        prize_type, prize_text, prize_name,
        prize_image_url, prize_asset_key,
        visibility, created_by
      ) VALUES (
        v_task.family_id, v_completion.member_id, 'routine_step', v_completion.id,
        CASE
          WHEN v_step.reward_image_url IS NOT NULL AND v_step.reward_image_url <> '' THEN 'image'
          WHEN v_step.reward_image_asset_key IS NOT NULL AND v_step.reward_image_asset_key <> '' THEN 'platform_image'
          ELSE 'text'
        END,
        COALESCE(NULLIF(v_step.reward_description, ''), v_step_label),
        NULLIF(LEFT(BTRIM(COALESCE(NULLIF(v_step.reward_description, ''), v_step_label)), 80), ''),
        NULLIF(v_step.reward_image_url, ''), NULLIF(v_step.reward_image_asset_key, ''),
        'family', v_completion.member_id
      )
      ON CONFLICT (source_id) WHERE source_type = 'routine_step' DO NOTHING
      RETURNING id INTO v_prize_id;
      v_result := v_result || jsonb_build_object('step_prize_id', v_prize_id);
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('step_prize_error', SQLERRM);
    END;

  ELSIF v_step.reward_type = 'money' AND v_step.reward_amount IS NOT NULL THEN
    BEGIN
      v_money_result := public.grant_money(
        p_family_id           := v_task.family_id,
        p_member_id           := v_completion.member_id,
        p_amount              := v_step.reward_amount,
        p_transaction_type    := 'opportunity_earned',
        p_description         := 'Step reward: ' || v_step_label,
        p_source_type         := 'routine_step',
        p_source_reference_id := v_completion.id
      );
      v_result := v_result || jsonb_build_object('step_money', v_money_result);
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('step_money_error', SQLERRM);
    END;
  END IF;

  -- ── Per-completion evaluation (routine_points_mode='per_completion') —
  -- required set read EXCLUSIVELY via get_member_day_obligations
  -- (Convention #271/#278 Rider-2), never inline day math. ──
  IF COALESCE(v_template.routine_points_mode, 'none') = 'per_completion'
     AND COALESCE(v_task.counts_for_gamification, true)
     AND COALESCE(v_template.routine_completion_points, 0) > 0 THEN
    BEGIN
      SELECT COALESCE(SUM(stp2.instance_count), 0) INTO v_required
      FROM (
        SELECT DISTINCT step_id
        FROM public.get_member_day_obligations(v_completion.member_id, v_completion.period_date, v_completion.period_date)
        WHERE task_id = v_task.id AND step_id IS NOT NULL
      ) obligated
      JOIN public.task_template_steps stp2 ON stp2.id = obligated.step_id;

      SELECT COUNT(*) INTO v_done
        FROM public.routine_step_completions rsc2
       WHERE rsc2.task_id = v_task.id
         AND rsc2.period_date = v_completion.period_date;

      v_newly_complete := v_required > 0 AND v_done >= v_required;

      IF v_newly_complete THEN
        -- Every assignee who completed >=1 step today gets the completion
        -- award (contribution-based, never a free-rider award). Re-evaluated
        -- on every step check for the day; idempotency_key makes redundant
        -- attempts for already-awarded contributors silent no-ops, so no
        -- distributed coordination is needed across simultaneous completions.
        FOR v_contributor IN
          SELECT DISTINCT member_id
          FROM public.routine_step_completions
          WHERE task_id = v_task.id AND period_date = v_completion.period_date
        LOOP
          BEGIN
            v_rc_result := public.record_point_transaction(
              v_task.family_id,
              v_contributor.member_id,
              v_template.routine_completion_points,
              'earn',
              'routine_completion',
              v_task.id,
              'Completed: ' || v_task.title,
              format('rcp:%s:%s:%s', v_task.id, v_contributor.member_id, v_completion.period_date),
              NULL
            );
          EXCEPTION WHEN OTHERS THEN
            NULL; -- one contributor's award failing must not block the others
          END;
        END LOOP;
        v_result := v_result || jsonb_build_object('completion_awarded', true, 'required', v_required, 'done', v_done);
      ELSE
        v_result := v_result || jsonb_build_object('completion_awarded', false, 'required', v_required, 'done', v_done);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('completion_error', SQLERRM);
    END;
  END IF;

  RETURN v_result;
END;
$fn$;

COMMENT ON FUNCTION public.process_routine_step_completion IS
  'PRD-24 Point Economy Addendum §5.3/§5.5 (rulings 3, 4). The single payout '
  'point for per-step points, per-completion points, and per-step prizes. '
  '100298: added the family-membership authorization gate (service_role OR '
  'caller is a member of the task''s family) BEFORE any reward computation — '
  'closes a live cross-tenant state-mutation vulnerability found by '
  'rls-verifier against the 100296 body, which had no auth check at all. '
  'Never-throws additive on the REWARD side only (Convention #199) — a '
  'reward-side failure never unwinds the checkmark, but an unauthorized '
  'CALL now raises loudly. Attribution = routine_step_completions.member_id, '
  'never assignee_id (Convention #202/#267 parity, riders 3-4). '
  'per_completion required-set reads get_member_day_obligations exclusively '
  '(Convention #271/#278 Rider-2). NOT wired to any client call site by this '
  'migration — Slice A3 wires useCompleteRoutineStep to call it.';


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_fn_source TEXT;
  v_has_auth_check BOOLEAN;
BEGIN
  SELECT prosrc INTO v_fn_source
  FROM pg_proc
  WHERE proname = 'process_routine_step_completion' AND pronamespace = 'public'::regnamespace;

  v_has_auth_check := v_fn_source LIKE '%Not authorized%'
    AND v_fn_source LIKE '%auth.role() = ''service_role''%';

  RAISE NOTICE 'migration 100298: process_routine_step_completion auth fix applied';
  RAISE NOTICE '  function body contains the authorization gate: %', v_has_auth_check;
END $$;
