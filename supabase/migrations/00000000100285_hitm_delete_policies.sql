-- ============================================================
-- 00000000100285 — HITM-CLOSURE: missing DELETE policies
--
-- Found by the HITM-CLOSURE Playwright pin (2026-07-06): clicking Reject on a
-- Board of Directors advisor reply deleted ZERO rows. Root cause is platform-
-- wide and pre-existing:
--
--   1. lila_messages has only SELECT + INSERT policies (migration 000007).
--      Every Convention #55 Reject/Regenerate client-side delete — in
--      ToolConversationModal, LilaDrawer, LilaModal, and the new
--      BoardOfDirectorsModal handlers — has silently affected 0 rows since
--      the PRD-05 build. Reject appeared to work only until the next
--      refetch; Regenerate DUPLICATED the assistant reply instead of
--      replacing it.
--   2. bookshelf_discussion_messages has only SELECT + INSERT + service_role.
--      The new BookShelf discussion Reject needs owner delete.
--   3. bookshelf_discussions has no DELETE policy at all — the discussion
--      "Delete" button in BookDiscussionModal has been silently broken the
--      same way.
--
-- All three policies are OWNER-scoped (the member whose conversation /
-- discussion it is), matching the existing INSERT policies' shape. Mom's
-- family-wide visibility (lm_select_via_conversation) deliberately does NOT
-- extend to deletes — HITM Reject is the conversation owner's action.
-- Safe Harbor rows are unaffected (owner-scope already covers them; no
-- cross-member reach is added).
--
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.
-- ============================================================

-- 1. lila_messages — owner may delete messages in their own conversations
DROP POLICY IF EXISTS "lm_delete_own" ON public.lila_messages;
CREATE POLICY "lm_delete_own" ON public.lila_messages
  FOR DELETE TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.lila_conversations
      WHERE member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );

-- 2. bookshelf_discussion_messages — owner may delete messages in their own discussions
DROP POLICY IF EXISTS "bdm_delete_via_discussion" ON public.bookshelf_discussion_messages;
CREATE POLICY "bdm_delete_via_discussion" ON public.bookshelf_discussion_messages
  FOR DELETE TO authenticated
  USING (
    discussion_id IN (
      SELECT id FROM public.bookshelf_discussions
      WHERE family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    )
  );

-- 3. bookshelf_discussions — owner may delete their own discussions
--    (messages cascade via the existing FK)
DROP POLICY IF EXISTS "bdi_delete_own" ON public.bookshelf_discussions;
CREATE POLICY "bdi_delete_own" ON public.bookshelf_discussions
  FOR DELETE TO authenticated
  USING (
    family_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
  );
