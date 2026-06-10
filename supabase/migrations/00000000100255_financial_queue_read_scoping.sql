-- ============================================================================
-- 00000000100255_financial_queue_read_scoping.sql
-- ============================================================================
-- Role-scoping leak pass (2026-06-09, founder-approved).
--
-- PRD-02 model (founder re-confirmed): mom sees all; everyone else sees ONLY
-- their own data unless mom grants more. Two tables had family-wide SELECT
-- policies that let ANY family member (additional_adult, special_adult, kids
-- on PIN personal-device sessions) read every member's rows:
--
--   1. financial_transactions ("ft_family_read", migration 100134) — dad or
--      any kid hitting /finances/history could pick ANY child and read their
--      entire money ledger. Financial data is a hard privacy boundary
--      (Convention #225); read scoping belongs at the RLS layer, not just UI.
--   2. loans ("loans_family_read", migration 100134) — same exposure.
--   3. studio_queue ("sq_select_family", migration 100120) — additional_adult
--      and special_adult could read the WHOLE family queue, including mom's
--      unprocessed MindSweep/Notepad captures, via the Review Queue modal.
--
-- New shape:
--   - financial_transactions / loans SELECT: primary_parent sees family-wide;
--     every other member sees only rows where family_member_id is their own
--     member row. (Kid-facing LedgerView mode='self' keeps working; the
--     child_can_see_finances toggle remains the app-layer display gate.)
--   - studio_queue SELECT/UPDATE/DELETE: family-wide path narrowed to
--     primary_parent only. Own-rows path (owner_id = caller) unchanged, so
--     dad/teens still process their own queues. INSERT policy is NOT touched —
--     the cross-member MindSweep routing path (adults insert FOR any member,
--     migration 100120 fix) is a write capability and stays.
--
-- Edge Functions use the service role and bypass RLS — no impact.
-- Idempotent: DROP POLICY IF EXISTS + CREATE. Safe to re-run.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. financial_transactions — SELECT scoping
-- ============================================================================

DROP POLICY IF EXISTS "ft_family_read" ON public.financial_transactions;
DROP POLICY IF EXISTS "ft_scoped_read" ON public.financial_transactions;

CREATE POLICY "ft_scoped_read" ON public.financial_transactions
  FOR SELECT USING (
    -- Mom: all rows in her family
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    -- Everyone else: own rows only
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "ft_scoped_read" ON public.financial_transactions IS
  'Financial ledger read scoping (2026-06-09 leak pass). Primary parent reads family-wide; all other members read only their own transactions. Replaces family-wide ft_family_read.';

-- ============================================================================
-- 2. loans — SELECT scoping
-- ============================================================================

DROP POLICY IF EXISTS "loans_family_read" ON public.loans;
DROP POLICY IF EXISTS "loans_scoped_read" ON public.loans;

CREATE POLICY "loans_scoped_read" ON public.loans
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "loans_scoped_read" ON public.loans IS
  'Loan read scoping (2026-06-09 leak pass). Primary parent reads family-wide; all other members read only their own loans. Replaces family-wide loans_family_read.';

-- ============================================================================
-- 3. studio_queue — narrow family-wide read/update/delete to primary_parent
-- ============================================================================
-- INSERT policy "sq_insert_adult_or_self" intentionally untouched (adults may
-- still route queue items TO any family member — MindSweep cross-member fix).

DROP POLICY IF EXISTS "sq_select_family" ON public.studio_queue;
CREATE POLICY "sq_select_family"
  ON public.studio_queue
  FOR SELECT
  USING (
    -- Path A: primary parent sees the whole family queue (Review Queue modal)
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role = 'primary_parent'
    )
    OR
    -- Path B: any member sees their own items
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_select_family" ON public.studio_queue IS
  'Studio queue read access (2026-06-09 leak pass). Primary parent sees all family queue rows; everyone else (additional_adult, special_adult, members) sees only their own. Cross-member INSERT capability unchanged.';

DROP POLICY IF EXISTS "sq_update_adult_or_self" ON public.studio_queue;
CREATE POLICY "sq_update_adult_or_self"
  ON public.studio_queue
  FOR UPDATE
  USING (
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role = 'primary_parent'
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
        AND caller.role = 'primary_parent'
    )
    OR
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_update_adult_or_self" ON public.studio_queue IS
  'Studio queue update (2026-06-09 leak pass). Primary parent updates any family row; everyone else updates only their own.';

DROP POLICY IF EXISTS "sq_delete_adult_or_self" ON public.studio_queue;
CREATE POLICY "sq_delete_adult_or_self"
  ON public.studio_queue
  FOR DELETE
  USING (
    family_id IN (
      SELECT caller.family_id
      FROM public.family_members caller
      WHERE caller.user_id = auth.uid()
        AND caller.role = 'primary_parent'
    )
    OR
    owner_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "sq_delete_adult_or_self" ON public.studio_queue IS
  'Studio queue delete (2026-06-09 leak pass). Primary parent deletes any family row; everyone else deletes only their own.';

-- ============================================================================
-- 4. Verification NOTICE
-- ============================================================================

DO $$
DECLARE
  v_ft INTEGER;
  v_loans INTEGER;
  v_sq INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ft FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'financial_transactions' AND policyname = 'ft_scoped_read';
  SELECT COUNT(*) INTO v_loans FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'loans' AND policyname = 'loans_scoped_read';
  SELECT COUNT(*) INTO v_sq FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'studio_queue';

  RAISE NOTICE '[100253] ft_scoped_read present: % | loans_scoped_read present: % | studio_queue policies: % (expected 4)', v_ft, v_loans, v_sq;

  IF v_ft <> 1 OR v_loans <> 1 OR v_sq <> 4 THEN
    RAISE WARNING '[100253] Policy counts unexpected — check pg_policies manually.';
  END IF;
END
$$;

COMMIT;
