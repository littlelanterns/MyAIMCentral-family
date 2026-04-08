-- ============================================================================
-- 00000000100120_feature_expansion_dismissals.sql
-- ============================================================================
-- Adds per-member dismissal of PlannedExpansionCard surfaces.
--
-- Problem: PRD-32A shipped with no way to get rid of a PlannedExpansionCard.
-- Once rendered, the card was visible forever — regardless of whether mom
-- had voted, toggled notify-me, or simply decided she wasn't interested.
-- Cards accumulated on every page they were placed (Play Dashboard,
-- Studio, InnerWorkings, etc.) with no exit.
--
-- Design:
--   Separate small table `feature_expansion_dismissals` with one row
--   per (family_member_id, feature_key). Mom (or any member) can dismiss
--   a planned-expansion card at any point — before voting, after voting,
--   or without ever engaging. The card component checks this table on
--   mount and returns null if a dismissal exists.
--
--   Why a separate table instead of adding `dismissed_at` to
--   `feature_demand_responses`:
--   1. The vote column is BOOLEAN NOT NULL — no way to "dismiss without
--      voting" via that table without loosening the constraint, which
--      would break PRD-32A analytics queries that assume vote is present
--   2. feature_demand_responses has INSERT + SELECT RLS but no UPDATE
--      policy — adding a column would also require loosening RLS
--   3. Conceptually distinct: dismissal is presence preference, voting
--      is demand signal. Separating keeps both clean.
--
-- Idempotent: CREATE IF NOT EXISTS + DROP POLICY IF EXISTS pattern.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.feature_expansion_dismissals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  feature_key      TEXT NOT NULL,
  dismissed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Track whether mom dismissed while in View As (audit attribution,
  -- same pattern as feature_demand_responses)
  dismissed_via_view_as BOOLEAN NOT NULL DEFAULT false,
  actual_dismisser_id   UUID REFERENCES public.family_members(id),
  CONSTRAINT feature_expansion_dismissals_unique_member_key
    UNIQUE (family_member_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_fed_member_feature
  ON public.feature_expansion_dismissals (family_member_id, feature_key);

CREATE INDEX IF NOT EXISTS idx_fed_family
  ON public.feature_expansion_dismissals (family_id);

ALTER TABLE public.feature_expansion_dismissals ENABLE ROW LEVEL SECURITY;

-- SELECT: members can read their own dismissals + mom can read any
-- dismissal in her family (for admin/support surfaces later)
DROP POLICY IF EXISTS "fed_select_own_or_parent" ON public.feature_expansion_dismissals;
CREATE POLICY "fed_select_own_or_parent"
  ON public.feature_expansion_dismissals
  FOR SELECT
  USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR
    family_id IN (
      SELECT fm.family_id
      FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- INSERT: any member can dismiss for themselves. Primary parents can
-- dismiss for any family member (supports the View As pattern — mom in
-- View As as Ruthie dismisses Ruthie's card).
DROP POLICY IF EXISTS "fed_insert_own_or_parent" ON public.feature_expansion_dismissals;
CREATE POLICY "fed_insert_own_or_parent"
  ON public.feature_expansion_dismissals
  FOR INSERT
  WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR
    family_member_id IN (
      SELECT target.id
      FROM public.family_members target
      WHERE target.family_id IN (
        SELECT caller.family_id
        FROM public.family_members caller
        WHERE caller.user_id = auth.uid() AND caller.role = 'primary_parent'
      )
    )
  );

-- DELETE: members can un-dismiss their own. Primary parents can
-- un-dismiss for any family member. Supports the "I changed my mind,
-- show me that card again" flow via a future admin surface.
DROP POLICY IF EXISTS "fed_delete_own_or_parent" ON public.feature_expansion_dismissals;
CREATE POLICY "fed_delete_own_or_parent"
  ON public.feature_expansion_dismissals
  FOR DELETE
  USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR
    family_id IN (
      SELECT fm.family_id
      FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

COMMENT ON TABLE public.feature_expansion_dismissals IS
  'Build M Sub-phase B: per-member dismissal of PlannedExpansionCard surfaces. PRD-32A originally shipped with no way to close a planned-expansion card — this table fixes that. One row per (family_member_id, feature_key). Cards check this table on mount and return null when a dismissal exists.';

COMMIT;

DO $$
DECLARE
  v_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'feature_expansion_dismissals';
  RAISE NOTICE '[100120] feature_expansion_dismissals created with % policies (expected 3: select, insert, delete)', v_policies;
END
$$;
