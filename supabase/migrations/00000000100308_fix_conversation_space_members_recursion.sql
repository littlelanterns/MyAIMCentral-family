-- ─────────────────────────────────────────────────────────────────────────────
-- 00000000100308_fix_conversation_space_members_recursion.sql
--
-- P0 fix: "infinite recursion detected in policy for relation
-- conversation_space_members" (42P17) on EVERY multi-row membership INSERT
-- into conversation_space_members — since migration 100108, for EVERY
-- session type (mom, dad, kid, family-shadow — confirmed live against
-- Casey's own real login, not just a family-shadow session).
--
-- Found while building FDWA (family-device write audit, migration 100306)
-- — the new csm_family_device policy doesn't cause this; the migration
-- 100306 "Ask Mom" chat-bootstrap E2E probe simply exposed a pre-existing
-- landmine that had never been exercised by a two-row batch insert before.
--
-- The cycle: csm_insert_admin_or_parent's third OR branch ("inserter is
-- already an admin in this space") subqueries conversation_space_members
-- (aliased csm2) from WITHIN a policy ON conversation_space_members itself.
-- Evaluating that subquery re-enters the table's own RLS, which re-evaluates
-- the SAME policy, which re-subqueries the table again — infinite loop.
-- Exact same bug CLASS as migration 100265 (tasks↔task_assignments
-- recursion), just self-referential within one table instead of two.
--
-- Fix: the established SECURITY DEFINER helper pattern (util.is_family_
-- shadow_of / util.task_in_shadow_family precedent, migration 100265's own
-- comment: "never let two tables' policies subquery each other inline" —
-- applies equally to a table subquerying itself). The helper's internal
-- read of conversation_space_members runs as the function owner, so the
-- table's own RLS is not re-entered and the loop disappears. Semantics are
-- IDENTICAL to the old inline subquery: "the caller is already an admin
-- member of this space."
--
-- Idempotent: CREATE OR REPLACE + DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION util.is_space_admin(p_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_space_members csm2
    JOIN public.family_members fm ON fm.id = csm2.family_member_id
    WHERE csm2.space_id = p_space_id
      AND fm.user_id = auth.uid()
      AND csm2.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION util.is_space_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.is_space_admin(UUID) TO authenticated;

COMMENT ON FUNCTION util.is_space_admin(UUID) IS
  'True when the caller is already an admin member of the given conversation space. SECURITY DEFINER so policy evaluation does not re-enter conversation_space_members RLS — breaks the self-referencing recursion in csm_insert_admin_or_parent (fix 100308, same class as tasks↔task_assignments fix 100265).';

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
    -- OR the inserter is already an admin in this space (subsequent adds) —
    -- rewritten onto util.is_space_admin() to break the self-referencing
    -- recursion (fix 100308). Semantics unchanged from migration 100108.
    OR util.is_space_admin(conversation_space_members.space_id)
  );

COMMENT ON POLICY "csm_insert_admin_or_parent" ON public.conversation_space_members IS
  'Rebuilt on util.is_space_admin() in 100308 to break the self-referencing RLS recursion in the third OR branch. Same three-branch semantics as migration 100108 (space creator / primary_parent / existing space admin).';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'util' AND p.proname = 'is_space_admin'
  ) THEN
    RAISE EXCEPTION '[100308] util.is_space_admin function missing after migration';
  END IF;
  RAISE NOTICE '[100308] conversation_space_members recursion fix applied — OK';
END
$$;

COMMIT;
