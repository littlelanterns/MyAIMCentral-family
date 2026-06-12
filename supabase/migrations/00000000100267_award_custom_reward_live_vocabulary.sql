-- Migration: 00000000100267_award_custom_reward_live_vocabulary.sql
-- Build: KIDS-REWARDS-PAGE — Slice 1 correction (same session as 100266)
--
-- Ground-truth finding: the LIVE reward-type vocabulary written by
-- TaskCreationModal Section 7 and OpportunityListBrowse is
-- 'privilege' / 'custom' — NOT the PRD-language 'privileges' /
-- 'family_activities' that RewardConfig.tsx declared but never shipped
-- (the component is type-only; the modal renders its own inline Section 7).
--
-- award_custom_reward_for_completion (100266) filtered on the PRD values and
-- would have skipped every real promise. This replaces the function with the
-- full accepted set: live values first, PRD values kept for forward compat.
--
-- Also hardens the description fallback: 'custom' opportunity items
-- historically displayed their reward via the amount field, so reward_value
-- ->> 'description' and the task title remain the fallback chain.

BEGIN;

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

  SELECT t.id, t.family_id, t.title, t.created_by, t.require_approval,
         t.reward_description, t.reward_image_url, t.reward_image_asset_key
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'task_not_found');
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

  INSERT INTO public.earned_prizes (
    family_id, family_member_id,
    source_type, source_id,
    prize_type, prize_text, prize_name,
    prize_image_url, prize_asset_key,
    visibility, created_by, awarded_completion_id
  ) VALUES (
    v_task.family_id, v_completion.earner_id,
    'task_completion', v_task.id,
    v_prize_type, v_desc, NULLIF(LEFT(BTRIM(v_desc), 80), ''),
    NULLIF(v_task.reward_image_url, ''), NULLIF(v_task.reward_image_asset_key, ''),
    'family', v_task.created_by, v_completion.id
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

COMMENT ON FUNCTION public.award_custom_reward_for_completion IS
  'KIDS-REWARDS-PAGE Q7: custom reward (privilege/custom + PRD-compat privileges/family_activities) → earned_prizes row. Idempotent (awarded_completion_id). Approval-required tasks award at approval, others at completion.';

COMMIT;
