-- ============================================================================
-- PRD-41: LiLa Runtime Ethics Enforcement — Phase 3
-- SAFETY-BETA-GATE Slice E
--
-- Two concerns, both additive + idempotent:
--   1. feature_key_registry seed: 'lila_ethics_log' (registry-only, tier
--      deferred — mirrors the family_goals / my_rewards_page precedent;
--      useCanAccess() returns true during beta per Convention #10, and this
--      surface's real gate is a mom-only Settings section + <PermissionGate>).
--   2. Admin pattern-library curation RPCs (PRD-32 admin governance) —
--      platform_intelligence.ethics_pattern_library is not PostgREST-exposed,
--      so the minimal admin curation screen reaches it through these
--      staff-gated SECURITY DEFINER RPCs (candidate queue approve/edit/discard,
--      active-list retire, ops counts). Mirrors the persona-promotion admin
--      governance shape (Convention #258).
--
-- The mom-facing LiLa Response Log reads public.lila_ethics_rejections directly
-- via PostgREST — its mom-only SELECT policy + column-level content guard both
-- already shipped in migration 100286. NO new table or policy is needed here.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. feature_key_registry seed — 'lila_ethics_log'
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
SELECT
  'lila_ethics_log',
  'LiLa Response Log',
  'A mom-only Settings view of every time LiLa gently redirected an ask or withdrew a response because it drifted toward pressure, guilt, shame, threat, or affection-as-leverage. Shows the surface, a plain-language category, and when — never the conversation content itself.',
  'PRD-41 (SAFETY-BETA-GATE Slice E)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_key_registry WHERE feature_key = 'lila_ethics_log'
);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Admin curation RPCs (staff-gated SECURITY DEFINER).
--    Standard admin gate: EXISTS row in public.staff_permissions for auth.uid()
--    (the established admin-RPC pattern, migration 100039 lineage).
-- ──────────────────────────────────────────────────────────────────────────

-- 2a. List patterns by status (candidate / active / retired). Never returns
--     embeddings (large + irrelevant to curation).
CREATE OR REPLACE FUNCTION public.admin_list_ethics_patterns(p_status TEXT)
RETURNS TABLE (
  id UUID,
  category TEXT,
  direction TEXT,
  pattern_text TEXT,
  source TEXT,
  status TEXT,
  has_embedding BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_status NOT IN ('candidate', 'active', 'retired') THEN
    RAISE EXCEPTION 'invalid status: %', p_status;
  END IF;

  RETURN QUERY
  SELECT
    epl.id, epl.category, epl.direction, epl.pattern_text, epl.source,
    epl.status, (epl.embedding IS NOT NULL) AS has_embedding, epl.notes,
    epl.created_at, epl.updated_at
  FROM platform_intelligence.ethics_pattern_library epl
  WHERE epl.status = p_status
  ORDER BY epl.created_at DESC;
END;
$fn$;

-- 2b. Ops-strip counts (per status; per category within active). Counts only,
--     no pattern text — the ops strip is a dashboard, not a content view.
CREATE OR REPLACE FUNCTION public.admin_ethics_pattern_counts()
RETURNS TABLE (
  status TEXT,
  category TEXT,
  n BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT epl.status, epl.category, COUNT(*) AS n
  FROM platform_intelligence.ethics_pattern_library epl
  GROUP BY epl.status, epl.category
  ORDER BY epl.status, epl.category;
END;
$fn$;

-- 2c. Approve a candidate → active. Only candidates may be approved.
CREATE OR REPLACE FUNCTION public.admin_approve_ethics_pattern(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE platform_intelligence.ethics_pattern_library
  SET status = 'active'
  WHERE id = p_id AND status = 'candidate';
END;
$fn$;

-- 2d. Retire a pattern (candidate → retired = discard, OR active → retired =
--     pull from the live Tier-1 corpus). match_ethics_patterns only reads
--     status='active', so retiring an active pattern removes it from scoring
--     immediately.
CREATE OR REPLACE FUNCTION public.admin_retire_ethics_pattern(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE platform_intelligence.ethics_pattern_library
  SET status = 'retired'
  WHERE id = p_id AND status IN ('candidate', 'active');
END;
$fn$;

-- 2e. Edit-and-approve a candidate: correct the text/category, blank the
--     embedding (so the embed cron re-generates it against the corrected
--     text), and set active in one step. Editing an active pattern re-embeds
--     it too. Only candidate/active rows are editable (never a retired one).
CREATE OR REPLACE FUNCTION public.admin_edit_ethics_pattern(
  p_id UUID,
  p_pattern_text TEXT,
  p_category TEXT,
  p_approve BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $fn$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_category NOT IN ('force', 'coercion', 'manipulation', 'shame_based_control', 'withholding_affection') THEN
    RAISE EXCEPTION 'invalid category: %', p_category;
  END IF;

  IF length(trim(p_pattern_text)) < 4 THEN
    RAISE EXCEPTION 'pattern_text too short';
  END IF;

  UPDATE platform_intelligence.ethics_pattern_library
  SET
    pattern_text = p_pattern_text,
    category = p_category,
    embedding = NULL, -- force re-embed against the corrected text
    status = CASE WHEN p_approve THEN 'active' ELSE status END
  WHERE id = p_id AND status IN ('candidate', 'active');
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.admin_list_ethics_patterns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ethics_pattern_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_ethics_pattern(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_retire_ethics_pattern(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_edit_ethics_pattern(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- 2f. Make 'ethics_admin' a grantable staff role so the Admin Console
--     "Ethics Patterns" tab's permissionType hint (AdminLayout ADMIN_TABS) is
--     a real, assignable permission_type. Per-tab gating is not yet enforced
--     (any staff row sees every tab), but this keeps the value legal for when
--     it is. Idempotent: only rewrites the CHECK if it doesn't already list
--     ethics_admin; drops by the constraint's discovered name (not a guessed
--     one) so it works regardless of auto-generated naming.
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'staff_permissions' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%permission_type%'
    AND pg_get_constraintdef(c.oid) NOT ILIKE '%ethics_admin%'
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.staff_permissions DROP CONSTRAINT %I', v_conname);
    ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_permission_type_check
      CHECK (permission_type = ANY (ARRAY[
        'super_admin', 'vault_admin', 'moderation_admin', 'system_admin',
        'analytics_admin', 'feedback_admin', 'persona_admin', 'ethics_admin'
      ]));
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Verification block.
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_key_count INTEGER;
  v_fn_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_key_count FROM public.feature_key_registry WHERE feature_key = 'lila_ethics_log';
  IF v_key_count <> 1 THEN
    RAISE EXCEPTION 'lila_ethics_log feature key not seeded (found %)', v_key_count;
  END IF;

  SELECT COUNT(*) INTO v_fn_count
  FROM pg_proc
  WHERE proname IN (
    'admin_list_ethics_patterns', 'admin_ethics_pattern_counts',
    'admin_approve_ethics_pattern', 'admin_retire_ethics_pattern',
    'admin_edit_ethics_pattern'
  );
  IF v_fn_count < 5 THEN
    RAISE EXCEPTION 'Expected 5 admin curation RPCs, found %', v_fn_count;
  END IF;

  RAISE NOTICE 'PRD-41 Phase 3 migration verified: lila_ethics_log feature key + % admin curation RPCs.', v_fn_count;
END $$;
