-- ============================================================================
-- Migration 100162 — list_approved_personas RPC for Board of Directors UI
--
-- PostgREST does not expose platform_intelligence schema, so the browser can't
-- directly SELECT from platform_intelligence.board_personas. This RPC bridges
-- the gap: SECURITY DEFINER, authenticated-only, returns the Tier-3 approved
-- shared cache with the same shape the UI expects.
--
-- All Tier-3 predicates enforced in the query (Convention #258).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.list_approved_personas()
RETURNS TABLE (
  id UUID,
  persona_name TEXT,
  persona_type TEXT,
  personality_profile JSONB,
  category TEXT,
  icon_emoji TEXT,
  is_public BOOLEAN,
  usage_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
  SELECT
    id,
    persona_name,
    persona_type,
    personality_profile,
    category,
    icon_emoji,
    is_public,
    usage_count,
    created_at
  FROM platform_intelligence.board_personas
  WHERE is_public = true
    AND family_id IS NULL
    AND content_policy_status = 'approved'
  ORDER BY usage_count DESC, persona_name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.list_approved_personas() TO authenticated, service_role;
