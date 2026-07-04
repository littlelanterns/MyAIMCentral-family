-- Migration: 00000000100279_reward_proposals_update_with_check.sql
-- Build: KIDS-REWARDS-PAGE — Slice 4 correction (same session as 100278)
--
-- Bug: 100278's "reward_proposals_update" policy had no WITH CHECK, so
-- Postgres applied the USING clause to the NEW row as well. The proposer
-- branch requires status IN ('pending','countered') — which is correct for
-- WHICH rows the proposer may act on (USING), but wrong for what the row may
-- BECOME: a kid answering mom's counteroffer writes status='counter_accepted'
-- or 'declined', so the new row failed the check and the response was
-- RLS-blocked (42501). Mom's branch was unaffected (no status predicate).
--
-- Fix: recreate the policy with an explicit WITH CHECK —
--   USING      (unchanged): proposer on own row while it is theirs to act on
--              ('pending' edit/withdraw, 'countered' respond), or primary
--              parent on any row she can see (privacy grant respected).
--   WITH CHECK: proposer may land the row in 'pending' (edits),
--              'counter_accepted' or 'declined' (counter response) — never
--              self-'accepted' (only the processing parent / self-proposal
--              INSERT path reaches accepted); parent branch unchanged.

BEGIN;

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
  )
  WITH CHECK (
    (
      proposer_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
      AND status IN ('pending', 'counter_accepted', 'declined')
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

-- Verification: the policy exists with a with_check expression.
DO $$
DECLARE
  v_with_check TEXT;
BEGIN
  SELECT with_check INTO v_with_check
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'reward_proposals'
     AND policyname = 'reward_proposals_update';
  IF v_with_check IS NULL THEN
    RAISE EXCEPTION 'migration 100279: reward_proposals_update WITH CHECK missing';
  END IF;
  RAISE NOTICE 'migration 100279: reward_proposals_update WITH CHECK in place';
END $$;

COMMIT;
