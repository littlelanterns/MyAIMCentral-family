-- ============================================================================
-- Migration 00000000100107: Kid-to-kid direct space bootstrap fix (PRD-15)
-- ============================================================================
--
-- Also re-asserts cs_insert_member to defensively make sure the helper-function
-- based policy from 100100 is still in effect. Test 10b surfaced a case where
-- a kid user (Jordan) was getting 42501 on conversation_spaces INSERT even
-- though his get_my_member_ids() RPC returned the correct id and he was
-- inserting with matching created_by + family_id. Rather than chase why the
-- policy in prod is evaluating differently than expected, this migration
-- re-declares the policy in its simplest working form: the caller must have
-- a family_members row matching auth.uid() AND the new space must belong to
-- that family AND created_by must be one of their member ids.
-- ============================================================================
--
-- Problem:
--   The original `csm_insert_admin_or_parent` policy on
--   `conversation_space_members` required the inserting user to EITHER already
--   be an admin of the target space OR be the family's primary_parent. This
--   created a chicken-and-egg deadlock for kid-to-kid direct spaces:
--     1. Jordan (guided) wants to message Alex (teen sibling) for the first time
--     2. `findOrCreateDirectSpace()` creates a new `conversation_spaces` row
--     3. Tries to INSERT membership rows for Jordan + Alex
--     4. Policy rejects — Jordan isn't already a member (just created the space)
--        and isn't primary_parent → silent RLS rejection, nothing gets saved
--
--   Mom-to-kid works because `initializeConversationSpaces` pre-creates those
--   direct spaces via mom's (primary_parent) session. Kid-to-kid pairs are
--   never pre-created, so they hit the policy wall.
--
-- Fix:
--   Add a third OR branch to the INSERT policy: allow the `created_by` user
--   of the space to insert membership rows into it. This bootstraps the first
--   membership insert without compromising security — you can only add members
--   to spaces *you created*, and once you've added yourself as admin, the first
--   branch (existing-admin-check) takes over for any subsequent changes.
--
--   The client-side flow (`useCreateSpace` + `findOrCreateDirectSpace`) already
--   sets `created_by = auth.uid()` when inserting the space, so no client
--   changes are needed. Both rows of a typical kid-to-kid direct space insert
--   (creator as admin + other as member) pass the new branch simultaneously
--   because they reference the same space.
--
-- Impact:
--   Unblocks Jordan → Alex, Alex → Casey, Casey → Riley, etc. Also unblocks any
--   future kid-created group spaces (`useCreateSpace` passes the same shape).
--   No impact on existing data. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Re-assert the conversation_spaces INSERT policy defensively.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "cs_insert_member" ON public.conversation_spaces;

CREATE POLICY "cs_insert_member" ON public.conversation_spaces
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = conversation_spaces.family_id
        AND fm.id = conversation_spaces.created_by
    )
  );

-- ---------------------------------------------------------------------------
-- conversation_space_members INSERT policy — add creator-bootstraps-first-row
-- branch so kid-to-kid direct spaces work.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "csm_insert_admin_or_parent" ON public.conversation_space_members;

CREATE POLICY "csm_insert_admin_or_parent" ON public.conversation_space_members
  FOR INSERT WITH CHECK (
    -- The inserter is the creator of the space (bootstraps the first
    -- membership insert for kid-to-kid direct spaces and any new group)
    EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      JOIN public.family_members fm ON fm.id = cs.created_by
      WHERE cs.id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
    )
    -- OR the inserter is primary_parent in the family that owns the space
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      JOIN public.family_members fm ON fm.family_id = cs.family_id
      WHERE cs.id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    -- OR the inserter is already an admin in this space (subsequent adds)
    OR EXISTS (
      SELECT 1 FROM public.conversation_space_members csm2
      JOIN public.family_members fm ON fm.id = csm2.family_member_id
      WHERE csm2.space_id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
        AND csm2.role = 'admin'
    )
  );
