-- Migration: 00000000100278_reward_proposals.sql
-- Build: KIDS-REWARDS-PAGE — Slice 4 (Propose-a-Reward + mom/adult self-propose)
-- Gate authority: claude/feature-decisions/KIDS-REWARDS-PAGE-Gate-Decisions.md
--   §5 (Propose-a-Reward), §6 + §11 R4-REVISED (self-propose + adult self-rewards
--   with per-reward visibility), §11 R3 (dedicated reward_proposals table —
--   family_requests has no payload column and can't carry a counter round).
--
-- Contents:
--   1. reward_proposals table — terms JSONB {want_text, want_image_url,
--      want_image_asset_key, will_text, earn_structure: once|streak_n_days|
--      finish_list, params}, one-round counter model (counter_terms +
--      counter_accepted status), created-artifact refs, self-proposal flag.
--   2. RLS — proposer sees/acts on own; primary parent processes kid proposals;
--      an adult's SELF-proposals are hidden from mom under the
--      personal_rewards_privacy grant (query layer, util helper from 100266).
--      Never rendered-then-hidden.
--   3. tasks reward visibility columns (reward_visibility / reward_shared_with)
--      — self-created reward tasks default the earned prize to PRIVATE (§11);
--      kid tasks leave them NULL → 'family' (status quo).
--   4. award_custom_reward_for_completion — visibility snapshot. Rewrite is
--      based on the CURRENT production body (migration 100267 — live reward
--      vocabulary), NOT the superseded 100266 body. Delta: SELECT list adds
--      reward_visibility + reward_shared_with; INSERT snapshots them with
--      family/'{}' fallbacks. Everything else is byte-identical to 100267.
--   5. tasks_source_check gains 'reward_proposal' (22 → 23) so approved
--      proposals carry provenance from the task row back to the proposal.
--
-- Idempotent throughout.

BEGIN;

-- ============================================================================
-- 1. reward_proposals
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reward_proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  proposer_member_id    UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  -- Self-proposal (gate §6/§11): proposer and approver are the same person;
  -- never enters mom's queue; created directly in 'accepted' with artifact refs.
  is_self_proposal      BOOLEAN NOT NULL DEFAULT false,
  -- Lifecycle: pending → (accepted | declined | countered)
  --            countered → (counter_accepted | declined)   [kid's one response]
  --            counter_accepted → accepted                 [mom's prefill-confirm setup]
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'countered', 'counter_accepted', 'accepted', 'declined')),
  -- {want_text, want_image_url, want_image_asset_key, will_text,
  --  earn_structure: 'once'|'streak_n_days'|'finish_list',
  --  params: {days?: number, items?: string[]}}
  terms                 JSONB NOT NULL,
  -- Mom's revised terms (same shape). ONE round (gate §5) — set once, on 'countered'.
  counter_terms         JSONB,
  counter_note          TEXT,
  decline_note          TEXT,
  -- Who processed (approved/countered/declined) — mom for kid proposals,
  -- the proposer themself for self-proposals.
  processed_by          UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  processed_at          TIMESTAMPTZ,
  -- Kid's response to the counter (accept/decline timestamp).
  responded_at          TIMESTAMPTZ,
  -- The artifact mom confirmed into existence at approval (prefill-confirm,
  -- never silent auto-create): 'task' | 'routine' → tasks.id,
  -- 'tracker' → dashboard_widgets.id.
  created_artifact_type TEXT CHECK (created_artifact_type IN ('task', 'routine', 'tracker')),
  created_artifact_id   UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_proposals_family_status
  ON public.reward_proposals(family_id, status);
CREATE INDEX IF NOT EXISTS idx_reward_proposals_proposer
  ON public.reward_proposals(proposer_member_id);

DROP TRIGGER IF EXISTS trg_reward_proposals_updated_at ON public.reward_proposals;
CREATE TRIGGER trg_reward_proposals_updated_at
  BEFORE UPDATE ON public.reward_proposals
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

COMMENT ON TABLE public.reward_proposals IS
  'KIDS-REWARDS-PAGE §5/§6 (R3): kid "Can I have X if I do Y" proposals + mom/adult self-proposals. Dedicated table because family_requests has no payload column and its status model cannot carry the one-round counter. Mom processes kid proposals from the Queue RequestsTab (Convention #66 one-inbox); approval is prefill-confirm into the existing task/tracker/routine creation flow, never silent auto-create.';
COMMENT ON COLUMN public.reward_proposals.terms IS
  '{want_text, want_image_url, want_image_asset_key, will_text, earn_structure: once|streak_n_days|finish_list, params: {days?, items?}}';
COMMENT ON COLUMN public.reward_proposals.counter_terms IS
  'Mom''s revised terms (same shape as terms). One round only (gate §5): kid accepts (→counter_accepted) or declines (→declined). Multi-round negotiation is a registered follow-up.';

-- ============================================================================
-- 2. RLS
-- ============================================================================

ALTER TABLE public.reward_proposals ENABLE ROW LEVEL SECURITY;

-- SELECT:
--   proposer      → own rows always
--   primary parent → kid proposals always (she is the recipient); an adult's
--                    SELF-proposals only when no personal_rewards_privacy grant
--                    (mom-sees-all default, §11 visibility convention)
DROP POLICY IF EXISTS "reward_proposals_select" ON public.reward_proposals;
CREATE POLICY "reward_proposals_select"
  ON public.reward_proposals FOR SELECT
  USING (
    proposer_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = reward_proposals.family_id
          AND fm.role = 'primary_parent'
      )
      AND (
        NOT is_self_proposal
        OR NOT util.personal_rewards_privacy(reward_proposals.proposer_member_id)
      )
    )
  );

-- INSERT: any family member files their OWN proposal only. (Guided+ gating is
-- a UI concern — Play never renders the section; the row itself is harmless.)
DROP POLICY IF EXISTS "reward_proposals_insert" ON public.reward_proposals;
CREATE POLICY "reward_proposals_insert"
  ON public.reward_proposals FOR INSERT
  WITH CHECK (
    proposer_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = reward_proposals.family_id
    )
  );

-- UPDATE:
--   proposer       → own row while it is theirs to act on: 'pending' (edit /
--                    withdraw-decline) or 'countered' (respond to the counter)
--   primary parent → any row she can see (process kid proposals; privacy-granted
--                    self-proposals stay out of reach — same predicate as SELECT)
DROP POLICY IF EXISTS "reward_proposals_update" ON public.reward_proposals;
CREATE POLICY "reward_proposals_update"
  ON public.reward_proposals FOR UPDATE
  USING (
    (
      proposer_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
      AND status IN ('pending', 'countered')
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = reward_proposals.family_id
          AND fm.role = 'primary_parent'
      )
      AND (
        NOT is_self_proposal
        OR NOT util.personal_rewards_privacy(reward_proposals.proposer_member_id)
      )
    )
  );

-- DELETE: proposer withdraws a still-pending proposal; primary parent may
-- clean up anything she can see.
DROP POLICY IF EXISTS "reward_proposals_delete" ON public.reward_proposals;
CREATE POLICY "reward_proposals_delete"
  ON public.reward_proposals FOR DELETE
  USING (
    (
      proposer_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
      AND status = 'pending'
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.family_id = reward_proposals.family_id
          AND fm.role = 'primary_parent'
      )
      AND (
        NOT is_self_proposal
        OR NOT util.personal_rewards_privacy(reward_proposals.proposer_member_id)
      )
    )
  );

-- ============================================================================
-- 3. tasks — per-reward visibility (self-created reward tasks, §11)
--    NULL reward_visibility = 'family' (status quo for every existing task and
--    every kid-directed promise). Self-propose writes 'private' or 'shared'.
-- ============================================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reward_visibility  TEXT,
  ADD COLUMN IF NOT EXISTS reward_shared_with UUID[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_reward_visibility_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_reward_visibility_check
      CHECK (reward_visibility IS NULL OR reward_visibility IN ('family', 'private', 'shared'));
  END IF;
END $$;

COMMENT ON COLUMN public.tasks.reward_visibility IS
  'KIDS-REWARDS-PAGE §11: visibility the earned prize inherits at award time. NULL = family (default — kid promises). Self-propose sets private (default) or shared + reward_shared_with.';
COMMENT ON COLUMN public.tasks.reward_shared_with IS
  'Member ids a shared self-reward prize is visible to (snapshotted into earned_prizes.shared_with_member_ids).';

-- ============================================================================
-- 4. award_custom_reward_for_completion — visibility snapshot
--    BASE BODY: migration 100267 (current production — live reward vocabulary
--    'privilege'/'custom' + PRD-compat values). Do NOT base future rewrites on
--    100266. Delta in this version, marked [S4]:
--      - v_task SELECT adds reward_visibility, reward_shared_with
--      - earned_prizes INSERT snapshots visibility (COALESCE 'family') and
--        shared_with_member_ids (COALESCE '{}')
-- ============================================================================

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

COMMENT ON FUNCTION public.award_custom_reward_for_completion IS
  'KIDS-REWARDS-PAGE Q7: custom reward (privilege/custom + PRD-compat privileges/family_activities) → earned_prizes row. Idempotent (awarded_completion_id). Approval-required tasks award at approval, others at completion. [S4] snapshots tasks.reward_visibility/reward_shared_with (NULL → family) so self-rewards land private by default. Base rewrites on THIS body (supersedes 100267/100266).';

-- ============================================================================
-- 5. tasks_source_check — add 'reward_proposal' (22 → 23)
-- ============================================================================

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal',
    'allowance_makeup',
    'opportunity_list_claim',
    'list_promotion',
    'icon_launcher',
    'activity_list',
    'mindsweep_auto',
    'reward_proposal'
  ));

-- ============================================================================
-- 6. Verification
-- ============================================================================

DO $$
DECLARE
  v_cols INTEGER;
  v_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND (
       (table_name = 'reward_proposals' AND column_name IN
         ('terms', 'counter_terms', 'status', 'is_self_proposal', 'created_artifact_type', 'created_artifact_id'))
       OR (table_name = 'tasks' AND column_name IN ('reward_visibility', 'reward_shared_with'))
     );
  IF v_cols <> 8 THEN
    RAISE EXCEPTION 'migration 100278: column count mismatch (%/8)', v_cols;
  END IF;

  SELECT COUNT(*) INTO v_policies
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'reward_proposals';
  IF v_policies <> 4 THEN
    RAISE EXCEPTION 'migration 100278: expected 4 RLS policies on reward_proposals, found %', v_policies;
  END IF;

  RAISE NOTICE 'migration 100278: reward_proposals + task reward visibility + award RPC visibility snapshot OK';
END $$;

COMMIT;
