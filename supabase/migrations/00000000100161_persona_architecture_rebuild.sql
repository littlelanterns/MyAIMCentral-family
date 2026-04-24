-- ============================================================================
-- Migration 100161 — PRD-34 Persona Architecture Rebuild (Wave 1B, Row 11)
--
-- Implements CLAUDE.md Convention #258 and PRD-34 Persona Architecture Addendum:
--   Tier 1 — public.board_personas, personal_custom only, RLS-isolated to family
--   Tier 2 — platform_intelligence.persona_promotion_queue (admin review)
--   Tier 3 — platform_intelligence.board_personas, approved shared cache
--
-- This migration is idempotent: DO $$ EXCEPTION blocks and NOT EXISTS guards.
--
-- Also lands: SCOPE-8b.F3 admin staff_permission, and context_sources widening
-- for the board_of_directors guided mode (Convention #247 / #248 category-1
-- invariant alignment).
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Create platform_intelligence.board_personas (Tier 3 approved shared cache)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_intelligence.board_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_name TEXT NOT NULL,
  persona_type TEXT NOT NULL
    CHECK (persona_type IN ('system_preloaded', 'community_generated')),
  personality_profile JSONB NOT NULL DEFAULT '{}',
  source_references TEXT[] NOT NULL DEFAULT '{}',
  bookshelf_enriched BOOLEAN NOT NULL DEFAULT false,
  category TEXT CHECK (category IN (
    'historical', 'literary', 'faith_leader', 'thinker',
    'business', 'parenting', 'custom'
  )),
  icon_emoji TEXT,
  content_policy_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (content_policy_status IN ('approved')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  family_id UUID,  -- MUST be NULL at Tier 3 (enforced below)
  created_by UUID,  -- NULL for platform-owned; may reference a family_member for audit
  usage_count INTEGER NOT NULL DEFAULT 0,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT board_personas_tier3_invariant
    CHECK (is_public = true AND family_id IS NULL AND content_policy_status = 'approved')
);

DO $$ BEGIN
  CREATE TRIGGER trg_pi_board_personas_updated_at
    BEFORE UPDATE ON platform_intelligence.board_personas
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE platform_intelligence.board_personas ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read Tier 3 (it's the public shared cache).
-- INSERT/UPDATE/DELETE: service role only (admin-approve path via Edge Function
-- uses service role). PostgREST does not expose platform_intelligence schema,
-- so direct client writes are not reachable regardless.
DO $$ BEGIN
  CREATE POLICY "pi_board_personas_read" ON platform_intelligence.board_personas
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_pi_board_personas_name
  ON platform_intelligence.board_personas
  USING gin(to_tsvector('english', persona_name));

CREATE INDEX IF NOT EXISTS idx_pi_board_personas_name_lower
  ON platform_intelligence.board_personas (lower(persona_name));

CREATE INDEX IF NOT EXISTS idx_pi_board_personas_category
  ON platform_intelligence.board_personas (persona_type, category);

CREATE INDEX IF NOT EXISTS idx_pi_board_personas_embedding
  ON platform_intelligence.board_personas
  USING hnsw(embedding halfvec_cosine_ops);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Add platform_persona_id to board_session_personas + persona_favorites
--    (two-column FK-preserving polymorphism per founder answer #1)
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.board_session_personas
    ADD COLUMN platform_persona_id UUID
      REFERENCES platform_intelligence.board_personas(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.board_session_personas
    ALTER COLUMN persona_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.persona_favorites
    ADD COLUMN platform_persona_id UUID
      REFERENCES platform_intelligence.board_personas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.persona_favorites
    ALTER COLUMN persona_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Id-stable data migration: copy seeded + community_generated rows
--    from public → platform_intelligence, then rewrite FK refs, then delete
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO platform_intelligence.board_personas (
  id, persona_name, persona_type, personality_profile, source_references,
  bookshelf_enriched, category, icon_emoji, content_policy_status,
  is_public, family_id, created_by, usage_count, embedding,
  created_at, updated_at
)
SELECT
  id, persona_name, persona_type, personality_profile, source_references,
  bookshelf_enriched, category, icon_emoji, 'approved'::text,
  true, NULL::uuid, NULL::uuid, usage_count, embedding,
  created_at, updated_at
FROM public.board_personas
WHERE persona_type IN ('system_preloaded', 'community_generated')
  AND is_public = true
  AND content_policy_status = 'approved'
ON CONFLICT (id) DO NOTHING;

-- Rewrite board_session_personas refs for migrated ids
UPDATE public.board_session_personas bsp
SET platform_persona_id = bsp.persona_id, persona_id = NULL
WHERE bsp.persona_id IN (
  SELECT id FROM platform_intelligence.board_personas
)
AND bsp.platform_persona_id IS NULL;

-- Rewrite persona_favorites refs for migrated ids
UPDATE public.persona_favorites pf
SET platform_persona_id = pf.persona_id, persona_id = NULL
WHERE pf.persona_id IN (
  SELECT id FROM platform_intelligence.board_personas
)
AND pf.platform_persona_id IS NULL;

-- Delete migrated rows from public.board_personas
DELETE FROM public.board_personas
WHERE persona_type IN ('system_preloaded', 'community_generated')
  AND id IN (SELECT id FROM platform_intelligence.board_personas);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Two-column FK invariant CHECK on board_session_personas + persona_favorites
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.board_session_personas
    ADD CONSTRAINT board_session_personas_persona_xor CHECK (
      (persona_id IS NOT NULL AND platform_persona_id IS NULL)
      OR (persona_id IS NULL AND platform_persona_id IS NOT NULL)
      OR (is_prayer_seat = true AND persona_id IS NULL AND platform_persona_id IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.persona_favorites
    ADD CONSTRAINT persona_favorites_persona_xor CHECK (
      (persona_id IS NOT NULL AND platform_persona_id IS NULL)
      OR (persona_id IS NULL AND platform_persona_id IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Partial UNIQUE indexes to keep (member,persona) uniqueness across both cols
CREATE UNIQUE INDEX IF NOT EXISTS idx_persona_favorites_public_unique
  ON public.persona_favorites (member_id, persona_id)
  WHERE persona_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_persona_favorites_platform_unique
  ON public.persona_favorites (member_id, platform_persona_id)
  WHERE platform_persona_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Tighten public.board_personas to Tier 1 only (personal_custom)
-- ──────────────────────────────────────────────────────────────────────────

-- Drop the broad persona_type CHECK and replace with personal_custom only
DO $$ BEGIN
  ALTER TABLE public.board_personas
    DROP CONSTRAINT IF EXISTS board_personas_persona_type_check;
END $$;

DO $$ BEGIN
  ALTER TABLE public.board_personas
    ADD CONSTRAINT board_personas_persona_type_check
    CHECK (persona_type = 'personal_custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table-level CHECK: Tier 1 invariant
DO $$ BEGIN
  ALTER TABLE public.board_personas
    ADD CONSTRAINT board_personas_tier1_invariant CHECK (
      persona_type = 'personal_custom'
      AND is_public = false
      AND family_id IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drop legacy RLS policies so we can replace them
DROP POLICY IF EXISTS "board_personas_public_read" ON public.board_personas;
DROP POLICY IF EXISTS "board_personas_personal_read" ON public.board_personas;
DROP POLICY IF EXISTS "board_personas_personal_write" ON public.board_personas;
DROP POLICY IF EXISTS "board_personas_personal_update" ON public.board_personas;
DROP POLICY IF EXISTS "board_personas_service_insert" ON public.board_personas;

-- Tier 1 RLS: family-scoped only, is_public and family_id immutable
CREATE POLICY "board_personas_t1_read" ON public.board_personas
  FOR SELECT TO authenticated USING (
    family_id IN (
      SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "board_personas_t1_insert" ON public.board_personas
  FOR INSERT TO authenticated WITH CHECK (
    persona_type = 'personal_custom'
    AND is_public = false
    AND family_id IS NOT NULL
    AND created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    AND family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND id = board_personas.created_by
    )
  );

-- UPDATE allowed for creator or family primary parent; is_public and family_id immutable
-- (enforced via CHECK above, which blocks any update that flips them).
CREATE POLICY "board_personas_t1_update" ON public.board_personas
  FOR UPDATE TO authenticated USING (
    created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = board_personas.family_id
        AND user_id = auth.uid()
        AND role = 'primary_parent'
    )
  );

CREATE POLICY "board_personas_t1_delete" ON public.board_personas
  FOR DELETE TO authenticated USING (
    created_by IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = board_personas.family_id
        AND user_id = auth.uid()
        AND role = 'primary_parent'
    )
  );

-- Drop the HNSW embedding index on public side — Tier 3 cache lookups run
-- against platform_intelligence only; personal personas aren't cached.
DROP INDEX IF EXISTS idx_board_personas_embedding;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Create platform_intelligence.persona_promotion_queue (Tier 2)
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_intelligence.persona_promotion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_persona_name TEXT NOT NULL,
  submitted_by_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  submitted_by_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  promoted_from_personal_id UUID REFERENCES public.board_personas(id) ON DELETE SET NULL,
  proposed_personality_profile JSONB NOT NULL DEFAULT '{}',
  source_references TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  icon_emoji TEXT,
  classifier_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  classifier_signals JSONB NOT NULL DEFAULT '{}',
  classifier_reasoning TEXT NOT NULL DEFAULT '',
  content_policy_pre_screen_status TEXT NOT NULL DEFAULT 'passed',
  embedding halfvec(1536),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'refined_and_approved', 'rejected', 'deferred')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  admin_notes TEXT,
  approved_persona_id UUID REFERENCES platform_intelligence.board_personas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_persona_promotion_queue_updated_at
    BEFORE UPDATE ON platform_intelligence.persona_promotion_queue
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE platform_intelligence.persona_promotion_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access (persona_admin or super_admin)
DO $$ BEGIN
  CREATE POLICY "persona_promotion_queue_admin_read" ON platform_intelligence.persona_promotion_queue
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.staff_permissions
        WHERE user_id = auth.uid()
          AND permission_type IN ('persona_admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "persona_promotion_queue_admin_update" ON platform_intelligence.persona_promotion_queue
    FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.staff_permissions
        WHERE user_id = auth.uid()
          AND permission_type IN ('persona_admin', 'super_admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_persona_promotion_queue_status
  ON platform_intelligence.persona_promotion_queue (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_promotion_queue_embedding
  ON platform_intelligence.persona_promotion_queue
  USING hnsw(embedding halfvec_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_persona_promotion_queue_name
  ON platform_intelligence.persona_promotion_queue
  USING gin(to_tsvector('english', requested_persona_name));

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Extend staff_permissions CHECK to include 'persona_admin' (SCOPE-8b.F3)
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE public.staff_permissions
    DROP CONSTRAINT IF EXISTS staff_permissions_permission_type_check;
END $$;

DO $$ BEGIN
  ALTER TABLE public.staff_permissions
    ADD CONSTRAINT staff_permissions_permission_type_check
    CHECK (permission_type IN (
      'super_admin', 'vault_admin', 'moderation_admin', 'system_admin',
      'analytics_admin', 'feedback_admin', 'persona_admin'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Update lila_guided_modes for board_of_directors context_sources
--    (Convention #247 + #248 category-1 invariant alignment)
-- ──────────────────────────────────────────────────────────────────────────
UPDATE public.lila_guided_modes
SET context_sources = '{guiding_stars,self_knowledge,best_intentions,archive_context_items,relationship_notes}'::text[]
WHERE mode_key = 'board_of_directors';

-- ──────────────────────────────────────────────────────────────────────────
-- 9. RPCs (security-critical, SECURITY DEFINER, search_path locked)
-- ──────────────────────────────────────────────────────────────────────────

-- 9a. Tier-3 cache lookup (replaces the name-ilike client query)
CREATE OR REPLACE FUNCTION public.lookup_approved_persona(p_name TEXT)
RETURNS SETOF platform_intelligence.board_personas
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
  SELECT *
  FROM platform_intelligence.board_personas
  WHERE lower(persona_name) = lower(p_name)
    AND is_public = true
    AND family_id IS NULL
    AND content_policy_status = 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_approved_persona(TEXT) TO authenticated, service_role;

-- 9b. Embedding pre-screen near-miss query (tiered UX per addendum §4)
CREATE OR REPLACE FUNCTION public.prescreen_approved_persona_by_embedding(
  p_embedding halfvec(1536),
  p_threshold NUMERIC DEFAULT 0.88
)
RETURNS TABLE (
  id UUID,
  persona_name TEXT,
  persona_type TEXT,
  personality_profile JSONB,
  category TEXT,
  icon_emoji TEXT,
  similarity NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
  SELECT
    bp.id,
    bp.persona_name,
    bp.persona_type,
    bp.personality_profile,
    bp.category,
    bp.icon_emoji,
    (1 - (bp.embedding <=> p_embedding))::numeric AS similarity
  FROM platform_intelligence.board_personas bp
  WHERE bp.embedding IS NOT NULL
    AND bp.is_public = true
    AND bp.family_id IS NULL
    AND bp.content_policy_status = 'approved'
    AND (1 - (bp.embedding <=> p_embedding)) >= p_threshold
  ORDER BY bp.embedding <=> p_embedding ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.prescreen_approved_persona_by_embedding(halfvec, NUMERIC) TO authenticated, service_role;

-- 9c. Admin approve (writes Tier-3 row, updates queue row atomically)
CREATE OR REPLACE FUNCTION public.approve_queued_persona(
  p_queue_id UUID,
  p_refined_profile JSONB DEFAULT NULL,
  p_refined_sources TEXT[] DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL,
  p_was_refined BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_queue_row platform_intelligence.persona_promotion_queue%ROWTYPE;
  v_new_persona_id UUID;
  v_profile JSONB;
  v_sources TEXT[];
BEGIN
  -- Admin gate
  SELECT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid()
      AND permission_type IN ('persona_admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized: persona_admin or super_admin required';
  END IF;

  SELECT * INTO v_queue_row
  FROM platform_intelligence.persona_promotion_queue
  WHERE id = p_queue_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue row not found or not pending';
  END IF;

  v_profile := COALESCE(p_refined_profile, v_queue_row.proposed_personality_profile);
  v_sources := COALESCE(p_refined_sources, v_queue_row.source_references);

  INSERT INTO platform_intelligence.board_personas (
    persona_name, persona_type, personality_profile, source_references,
    bookshelf_enriched, category, icon_emoji, content_policy_status,
    is_public, family_id, created_by, usage_count
  ) VALUES (
    v_queue_row.requested_persona_name,
    'community_generated',
    v_profile,
    v_sources,
    false,
    v_queue_row.category,
    v_queue_row.icon_emoji,
    'approved',
    true,
    NULL,
    NULL,
    0
  ) RETURNING id INTO v_new_persona_id;

  UPDATE platform_intelligence.persona_promotion_queue
  SET status = CASE WHEN p_was_refined THEN 'refined_and_approved' ELSE 'approved' END,
      reviewer_id = auth.uid(),
      decided_at = now(),
      admin_notes = p_admin_notes,
      approved_persona_id = v_new_persona_id
  WHERE id = p_queue_id;

  RETURN v_new_persona_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_queued_persona(UUID, JSONB, TEXT[], TEXT, BOOLEAN) TO authenticated, service_role;

-- 9d. Admin reject
CREATE OR REPLACE FUNCTION public.reject_queued_persona(
  p_queue_id UUID,
  p_admin_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid()
      AND permission_type IN ('persona_admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE platform_intelligence.persona_promotion_queue
  SET status = 'rejected',
      reviewer_id = auth.uid(),
      decided_at = now(),
      admin_notes = p_admin_notes
  WHERE id = p_queue_id AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_queued_persona(UUID, TEXT) TO authenticated, service_role;

-- 9e. Admin defer
CREATE OR REPLACE FUNCTION public.defer_queued_persona(p_queue_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid()
      AND permission_type IN ('persona_admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE platform_intelligence.persona_promotion_queue
  SET status = 'deferred',
      reviewer_id = auth.uid(),
      decided_at = now()
  WHERE id = p_queue_id AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.defer_queued_persona(UUID) TO authenticated, service_role;

-- 9f. Admin list queue (joins family + member + personal-copy context)
CREATE OR REPLACE FUNCTION public.list_persona_promotion_queue(
  p_status TEXT DEFAULT 'pending',
  p_hide_stale BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  requested_persona_name TEXT,
  submitted_by_family_name TEXT,
  submitted_by_member_name TEXT,
  promoted_from_personal_id UUID,
  proposed_personality_profile JSONB,
  source_references TEXT[],
  category TEXT,
  icon_emoji TEXT,
  classifier_confidence NUMERIC,
  classifier_signals JSONB,
  classifier_reasoning TEXT,
  status TEXT,
  reviewer_id UUID,
  decided_at TIMESTAMPTZ,
  admin_notes TEXT,
  approved_persona_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = platform_intelligence, public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid()
      AND permission_type IN ('persona_admin', 'super_admin')
  ) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.requested_persona_name,
    f.family_name AS submitted_by_family_name,
    fm.display_name AS submitted_by_member_name,
    q.promoted_from_personal_id,
    q.proposed_personality_profile,
    q.source_references,
    q.category,
    q.icon_emoji,
    q.classifier_confidence,
    q.classifier_signals,
    q.classifier_reasoning,
    q.status,
    q.reviewer_id,
    q.decided_at,
    q.admin_notes,
    q.approved_persona_id,
    q.created_at
  FROM platform_intelligence.persona_promotion_queue q
  LEFT JOIN public.families f ON f.id = q.submitted_by_family_id
  LEFT JOIN public.family_members fm ON fm.id = q.submitted_by_member_id
  WHERE q.status = p_status
    AND (NOT p_hide_stale OR q.status != 'pending' OR q.created_at > now() - INTERVAL '30 days')
  ORDER BY q.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_persona_promotion_queue(TEXT, BOOLEAN) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 10. Regression fixtures (Layer A — SQL invariants, addendum §8)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_bad_personal_public INT;
  v_bad_t3_family INT;
  v_bad_t3_unapproved INT;
  v_bad_approved_no_persona INT;
BEGIN
  -- No personal_custom row is ever public
  SELECT COUNT(*) INTO v_bad_personal_public
  FROM public.board_personas
  WHERE persona_type = 'personal_custom' AND is_public = true;
  IF v_bad_personal_public > 0 THEN
    RAISE EXCEPTION 'Invariant violation: % personal_custom rows have is_public=true', v_bad_personal_public;
  END IF;

  -- No Tier-3 row has a family reference
  SELECT COUNT(*) INTO v_bad_t3_family
  FROM platform_intelligence.board_personas
  WHERE family_id IS NOT NULL;
  IF v_bad_t3_family > 0 THEN
    RAISE EXCEPTION 'Invariant violation: % Tier-3 rows have family_id IS NOT NULL', v_bad_t3_family;
  END IF;

  -- All Tier-3 rows are approved
  SELECT COUNT(*) INTO v_bad_t3_unapproved
  FROM platform_intelligence.board_personas
  WHERE content_policy_status != 'approved';
  IF v_bad_t3_unapproved > 0 THEN
    RAISE EXCEPTION 'Invariant violation: % Tier-3 rows are not approved', v_bad_t3_unapproved;
  END IF;

  -- Approved queue rows have an approved_persona_id
  SELECT COUNT(*) INTO v_bad_approved_no_persona
  FROM platform_intelligence.persona_promotion_queue
  WHERE status IN ('approved', 'refined_and_approved') AND approved_persona_id IS NULL;
  IF v_bad_approved_no_persona > 0 THEN
    RAISE EXCEPTION 'Invariant violation: % approved queue rows have NULL approved_persona_id', v_bad_approved_no_persona;
  END IF;
END $$;
