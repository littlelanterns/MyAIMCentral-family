-- ============================================================================
-- PERMISSIONS-WIRING follow-on (founder-approved 2026-06-09):
-- TRUE FAMILY-WIDE financial_tracking grant.
--
-- Mom can grant dad finance/Prize Board access for the WHOLE family with one
-- row: member_permissions(target_member_id IS NULL, permission_key =
-- 'financial_tracking'). Semantics:
--   - Covers every kid (role='member') in the family — including kids added
--     later, automatically.
--   - A PER-KID row always wins for that kid, in both directions (a kid set
--     to 'manage' exceeds a family-wide 'view'; a kid set to 'none' is carved
--     out of a family-wide 'manage').
--
-- Implementation: one SECURITY DEFINER helper computes the calling
-- additional_adult's EFFECTIVE level for a given kid (per-kid row → else
-- family-wide row → else 'none'); the three finance policies from migration
-- 100260 are recreated on top of it. Mom/own-row paths unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION util.finance_grant_level(p_kid UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT fm.id, fm.family_id
    FROM public.family_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.role = 'additional_adult'
    LIMIT 1
  )
  SELECT COALESCE(
    -- 1. Per-kid row wins (any level, including an explicit 'none' carve-out)
    (SELECT COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
     FROM public.member_permissions mp, me
     WHERE mp.granted_to = me.id
       AND mp.family_id = me.family_id
       AND mp.permission_key = 'financial_tracking'
       AND mp.target_member_id = p_kid
     LIMIT 1),
    -- 2. Family-wide fallback — applies to KIDS in the adult's family only
    (SELECT COALESCE(mp.access_level, mp.permission_value->>'access_level', 'none')
     FROM public.member_permissions mp
     JOIN me ON mp.granted_to = me.id AND mp.family_id = me.family_id
     JOIN public.family_members kid
       ON kid.id = p_kid
      AND kid.family_id = me.family_id
      AND kid.role = 'member'
     WHERE mp.permission_key = 'financial_tracking'
       AND mp.target_member_id IS NULL
     LIMIT 1),
    'none'
  );
$$;

REVOKE ALL ON FUNCTION util.finance_grant_level(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.finance_grant_level(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- Recreate the three granted-path policies on the helper
-- ----------------------------------------------------------------------------

-- financial_transactions SELECT
DROP POLICY IF EXISTS "ft_scoped_read" ON public.financial_transactions;
CREATE POLICY "ft_scoped_read" ON public.financial_transactions
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
    OR
    util.finance_grant_level(family_member_id) <> 'none'
  );

-- loans SELECT (write stays mom-only)
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
    OR
    util.finance_grant_level(family_member_id) <> 'none'
  );

-- financial_transactions INSERT (append-only preserved: no UPDATE/DELETE)
DROP POLICY IF EXISTS "ft_parent_insert" ON public.financial_transactions;
CREATE POLICY "ft_parent_insert" ON public.financial_transactions
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
    OR
    (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
          AND fm.role = 'additional_adult'
      )
      AND util.finance_grant_level(family_member_id) IN ('contribute', 'manage')
    )
  );

-- allowance_periods UPDATE (Allowance tab period ops — manage only)
DROP POLICY IF EXISTS "ap_granted_manage_update" ON public.allowance_periods;
CREATE POLICY "ap_granted_manage_update" ON public.allowance_periods
  FOR UPDATE USING (
    util.finance_grant_level(family_member_id) = 'manage'
  )
  WITH CHECK (
    util.finance_grant_level(family_member_id) = 'manage'
  );
