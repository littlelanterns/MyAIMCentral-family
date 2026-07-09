-- ─────────────────────────────────────────────────────────────────────────────
-- 00000000100309_fix_csm_delete_recursion.sql
--
-- P0 fix: "infinite recursion detected in policy for relation
-- conversation_space_members" (42P17) on DELETE — the second half of the
-- same bug class fixed for INSERT in migration 100308.
--
-- Found by the rls-verifier live-verification pass on migration 100306
-- (see RLS-VERIFICATION.md "Migration 100306 — FDWA Family-Device Write
-- Audit") — independently reproduced against a real primary_parent (mom)
-- session, confirming it is role-independent and predates both 100306 and
-- 100308. Not a security leak (fails CLOSED — nothing is ever deleted), but
-- it means "leave a conversation" throws an unhandled DB error for every
-- role in production today.
--
-- The cycle: csm_delete_admin_or_parent's first OR branch ("caller is an
-- admin of this space") subqueries conversation_space_members (aliased
-- csm2) from WITHIN a policy ON conversation_space_members itself — same
-- self-referencing pattern as the INSERT policy's third branch (100308) and
-- the tasks↔task_assignments cross-table cycle (100265).
--
-- Fix: reuse the SAME util.is_space_admin() helper migration 100308 already
-- created for this exact check (SECURITY DEFINER, so the internal read of
-- conversation_space_members runs as the function owner and does not
-- re-enter the table's own RLS). Semantics are IDENTICAL to the old inline
-- subquery: "the caller is already an admin member of this space."
--
-- Idempotent: DROP POLICY IF EXISTS / CREATE POLICY.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DROP POLICY IF EXISTS "csm_delete_admin_or_parent" ON public.conversation_space_members;

CREATE POLICY "csm_delete_admin_or_parent" ON public.conversation_space_members
  FOR DELETE USING (
    -- Space admin can remove — rewritten onto util.is_space_admin() to
    -- break the self-referencing recursion (fix 100309). Same semantics as
    -- migration 100100's inline subquery.
    util.is_space_admin(space_id)
    -- OR primary_parent
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      WHERE cs.id = conversation_space_members.space_id
        AND public.is_primary_parent_of(cs.family_id)
    )
    -- OR removing yourself
    OR family_member_id = ANY(public.get_my_member_ids())
  );

COMMENT ON POLICY "csm_delete_admin_or_parent" ON public.conversation_space_members IS
  'Rebuilt on util.is_space_admin() in 100309 to break the self-referencing RLS recursion in the first OR branch — same fix pattern as 100308 (INSERT). Same three-branch semantics as migration 100100 (space admin / primary_parent / removing self).';

DO $$
BEGIN
  RAISE NOTICE '[100309] conversation_space_members DELETE recursion fix applied — OK';
END
$$;

COMMIT;
