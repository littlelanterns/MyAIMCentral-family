-- ============================================================================
-- 00000000100120_studio_queue_rls_fix.sql
-- ============================================================================
-- Root-cause fix for silent MindSweep cross-member routing failures.
--
-- Discovered 2026-04-08: a founder sweep (event flyer with kid names visible)
-- classified successfully, mindsweep_events recorded items_queued=1, and the
-- UI toast said "1 item sent to queue" — but studio_queue had zero pending
-- rows for the family. Investigation showed the mindsweep-sort classifier
-- detected a kid name via cross_member_action='suggest_route', and
-- queueForReview in useMindSweep.ts set owner_id = <kid's member_id> to
-- route the item to that member's queue. The RLS policy "sq_manage_own"
-- requires owner_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
-- which resolves ONLY to the caller's own member row. Mom cannot insert
-- a studio_queue row with a different member's owner_id even though she is
-- the primary parent of the family. Insert silently blocked, counter lied.
--
-- Two fixes happen together:
--   1. This migration: loosen RLS to allow adults (primary_parent,
--      additional_adult, special_adult) to insert studio_queue rows for
--      ANY member in their family. This matches the pattern just established
--      in 00000000100119 for task_completions.
--   2. Code-side (separate commit): queueForReview + routeDirectly throw on
--      insert failure instead of silently swallowing, so counters don't lie.
--
-- The existing "sq_manage_own" policy is replaced by a more explicit trio:
--   - sq_select_family (SELECT)   — any family member can see own/family rows
--   - sq_insert_adult_or_self (INSERT) — adults insert any family member,
--                                         members insert their own
--   - sq_update_adult_or_self (UPDATE) — adults update any family member,
--                                         members update their own
--   - sq_delete_adult_or_self (DELETE) — same pattern
--
-- Teens (role='member') only see/modify their own items. The cross-member
-- routing path is primarily mom → kid (mom swept an item that belongs on
-- a kid's queue), though additional_adult and special_adult also get this
-- capability since they might sweep on behalf of the family.
--
-- All existing data stays. No row changes. Just policy replacement.
-- Idempotent: safe to re-run. Uses DROP POLICY IF EXISTS.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. studio_queue — replace sq_manage_own and sq_select_parent
-- ============================================================================

DROP POLICY IF EXISTS "sq_manage_own" ON public.studio_queue;
DROP POLICY IF EXISTS "sq_select_parent" ON public.studio_queue;

-- SELECT: any family member can read studio_queue rows where they are the
-- owner, and adults can read all family rows (so mom can see everyone's
-- queue for the Review Queue modal).
CREATE POLICY "sq_select_family"
  ON public.studio_queue
  FOR SELECT
  USING (
    -- Path A: adults seeing their whole family's queue
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
    )
    OR
    -- Path B: any member seeing their own items
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_select_family" ON public.studio_queue IS
  'Studio queue read access. Adults (primary_parent, additional_adult, special_adult) see all family queue rows. Members see only their own.';

-- INSERT: adults can insert for any family member in their family (the
-- cross-member MindSweep routing path). Members can only insert for
-- themselves. WITH CHECK runs at INSERT time against the NEW row.
CREATE POLICY "sq_insert_adult_or_self"
  ON public.studio_queue
  FOR INSERT
  WITH CHECK (
    -- Path A: adults routing to any member in their family
    owner_id IN (
      SELECT target.id
      FROM public.family_members target
      WHERE target.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid()
          AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
      )
    )
    OR
    -- Path B: any member inserting for themselves
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_insert_adult_or_self" ON public.studio_queue IS
  'Studio queue insert. Adults can insert queue items for any member in their family (cross-member MindSweep routing, queue creation on behalf of kids). Members can insert their own. Fix for silent MindSweep cross-member routing failure discovered 2026-04-08.';

-- UPDATE: adults can update any family queue row (mark processed/dismissed,
-- edit content). Members can update their own.
CREATE POLICY "sq_update_adult_or_self"
  ON public.studio_queue
  FOR UPDATE
  USING (
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
    )
    OR
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
    )
    OR
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_update_adult_or_self" ON public.studio_queue IS
  'Studio queue update. Adults can mark any family queue row as processed/dismissed. Members can update their own.';

-- DELETE: adults can delete any family queue row. Members can delete their own.
-- Current codebase uses soft-delete via dismissed_at, but an explicit DELETE
-- policy is needed for any admin/cleanup flows that may land later.
CREATE POLICY "sq_delete_adult_or_self"
  ON public.studio_queue
  FOR DELETE
  USING (
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role IN ('primary_parent', 'additional_adult', 'special_adult')
    )
    OR
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_delete_adult_or_self" ON public.studio_queue IS
  'Studio queue delete. Adults can hard-delete any family queue row. Members can delete their own. Soft-delete via dismissed_at is the normal path; this policy covers admin/cleanup.';


-- ============================================================================
-- 2. Verification NOTICE
-- ============================================================================

DO $$
DECLARE
  v_sq_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_sq_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_queue';

  RAISE NOTICE '[100120] studio_queue now has % policies (expected 4: select, insert, update, delete)', v_sq_policies;

  IF v_sq_policies <> 4 THEN
    RAISE WARNING '[100120] Expected 4 policies on studio_queue, got %. Check pg_policies manually.', v_sq_policies;
  END IF;
END
$$;

COMMIT;
