-- PRD-17B: MindSweep — AI auto-sort intelligence layer
-- 5 new tables, feature keys, classify_by_embedding RPC, FK on studio_queue

-- ============================================================
-- 1. mindsweep_settings (per-member configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mindsweep_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  aggressiveness TEXT NOT NULL DEFAULT 'always_ask'
    CHECK (aggressiveness IN ('always_ask', 'trust_obvious', 'full_autopilot')),
  always_review_rules JSONB NOT NULL DEFAULT '["emotional_children","relationship_dynamics","behavioral_notes","financial"]',
  custom_review_rules JSONB NOT NULL DEFAULT '[]',
  auto_sweep_shared BOOLEAN NOT NULL DEFAULT false,
  auto_sweep_time TIME NOT NULL DEFAULT '20:00',
  email_process_immediately BOOLEAN NOT NULL DEFAULT true,
  high_accuracy_voice BOOLEAN NOT NULL DEFAULT false,
  digest_morning BOOLEAN NOT NULL DEFAULT true,
  digest_evening BOOLEAN NOT NULL DEFAULT true,
  digest_weekly BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id)
);

CREATE INDEX IF NOT EXISTS idx_ms_family ON public.mindsweep_settings(family_id);
CREATE INDEX IF NOT EXISTS idx_ms_member ON public.mindsweep_settings(member_id);

CREATE TRIGGER trg_ms_updated_at
  BEFORE UPDATE ON public.mindsweep_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.mindsweep_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ms_manage_own ON public.mindsweep_settings
  FOR ALL USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY ms_select_parent ON public.mindsweep_settings
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );


-- ============================================================
-- 2. mindsweep_holding (server-side staging queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mindsweep_holding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('voice_short','voice_long','text','scan_extracted','link','email')),
  source_channel TEXT NOT NULL
    CHECK (source_channel IN ('quick_capture','routing_strip','share_to_app','email_forward','lila_conversation')),
  audio_blob_local BOOLEAN NOT NULL DEFAULT false,
  link_url TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  sweep_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mh_family_member ON public.mindsweep_holding(family_id, member_id);
CREATE INDEX IF NOT EXISTS idx_mh_unprocessed ON public.mindsweep_holding(family_id, member_id)
  WHERE processed_at IS NULL;

ALTER TABLE public.mindsweep_holding ENABLE ROW LEVEL SECURITY;

CREATE POLICY mh_manage_own ON public.mindsweep_holding
  FOR ALL USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );


-- ============================================================
-- 3. mindsweep_allowed_senders (whitelisted emails)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mindsweep_allowed_senders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES public.family_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_mas_family ON public.mindsweep_allowed_senders(family_id);
CREATE INDEX IF NOT EXISTS idx_mas_email ON public.mindsweep_allowed_senders(email_address);

ALTER TABLE public.mindsweep_allowed_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY mas_manage_parent ON public.mindsweep_allowed_senders
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY mas_read_adult ON public.mindsweep_allowed_senders
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('primary_parent','additional_adult')
    )
  );


-- ============================================================
-- 4. mindsweep_events (sweep event tracking / analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mindsweep_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  source_channel TEXT NOT NULL
    CHECK (source_channel IN ('routing_strip','quick_capture','share_to_app','email_forward','auto_sweep')),
  input_type TEXT NOT NULL
    CHECK (input_type IN ('voice','text','image','link','email','mixed')),
  raw_content_preview TEXT,
  items_extracted INTEGER NOT NULL DEFAULT 0,
  items_auto_routed INTEGER NOT NULL DEFAULT 0,
  items_queued INTEGER NOT NULL DEFAULT 0,
  items_direct_routed INTEGER NOT NULL DEFAULT 0,
  aggressiveness_at_time TEXT NOT NULL DEFAULT 'always_ask',
  processing_cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_me_family_member ON public.mindsweep_events(family_id, member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_me_family_created ON public.mindsweep_events(family_id, created_at DESC);

ALTER TABLE public.mindsweep_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY me_read_own ON public.mindsweep_events
  FOR SELECT USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY me_read_parent ON public.mindsweep_events
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

CREATE POLICY me_insert_own ON public.mindsweep_events
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );


-- ============================================================
-- 5. mindsweep_approval_patterns (data collection for Phase 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mindsweep_approval_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  content_category TEXT NOT NULL,
  action_taken TEXT NOT NULL
    CHECK (action_taken IN ('approved_unchanged','approved_edited','rerouted','dismissed')),
  suggested_destination TEXT,
  actual_destination TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_family_member ON public.mindsweep_approval_patterns(family_id, member_id, content_category);

ALTER TABLE public.mindsweep_approval_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY map_read_own ON public.mindsweep_approval_patterns
  FOR SELECT USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Service role inserts on approval actions (via Edge Function)
CREATE POLICY map_insert_service ON public.mindsweep_approval_patterns
  FOR INSERT WITH CHECK (true);


-- ============================================================
-- 6. FK on studio_queue.mindsweep_event_id -> mindsweep_events
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sq_mindsweep_event'
  ) THEN
    ALTER TABLE public.studio_queue
      ADD CONSTRAINT fk_sq_mindsweep_event
      FOREIGN KEY (mindsweep_event_id) REFERENCES public.mindsweep_events(id);
  END IF;
END $$;

-- FK on mindsweep_holding.sweep_event_id -> mindsweep_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_mh_sweep_event'
  ) THEN
    ALTER TABLE public.mindsweep_holding
      ADD CONSTRAINT fk_mh_sweep_event
      FOREIGN KEY (sweep_event_id) REFERENCES public.mindsweep_events(id);
  END IF;
END $$;


-- ============================================================
-- 7. classify_by_embedding RPC
--    Searches across all embedded tables for a family, returns
--    the best semantic match with destination mapping.
-- ============================================================
CREATE OR REPLACE FUNCTION public.classify_by_embedding(
  query_embedding halfvec(1536),
  p_family_id UUID,
  match_threshold FLOAT DEFAULT 0.85,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  source_table TEXT,
  source_id UUID,
  content_preview TEXT,
  destination TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY

  -- Guiding Stars -> guiding_stars destination
  SELECT
    'guiding_stars'::TEXT AS source_table,
    gs.id AS source_id,
    LEFT(gs.content, 100)::TEXT AS content_preview,
    'guiding_stars'::TEXT AS destination,
    (1 - (gs.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.guiding_stars gs
  WHERE gs.family_id = p_family_id
    AND gs.archived_at IS NULL
    AND gs.embedding IS NOT NULL
    AND (1 - (gs.embedding <=> query_embedding))::FLOAT >= match_threshold

  UNION ALL

  -- Best Intentions -> best_intentions destination
  SELECT
    'best_intentions'::TEXT,
    bi.id,
    LEFT(bi.statement, 100)::TEXT,
    'best_intentions'::TEXT,
    (1 - (bi.embedding <=> query_embedding))::FLOAT
  FROM public.best_intentions bi
  WHERE bi.family_id = p_family_id
    AND bi.archived_at IS NULL
    AND bi.embedding IS NOT NULL
    AND (1 - (bi.embedding <=> query_embedding))::FLOAT >= match_threshold

  UNION ALL

  -- Self Knowledge -> innerworkings destination
  SELECT
    'self_knowledge'::TEXT,
    sk.id,
    LEFT(sk.content, 100)::TEXT,
    'innerworkings'::TEXT,
    (1 - (sk.embedding <=> query_embedding))::FLOAT
  FROM public.self_knowledge sk
  WHERE sk.family_id = p_family_id
    AND sk.archived_at IS NULL
    AND sk.embedding IS NOT NULL
    AND (1 - (sk.embedding <=> query_embedding))::FLOAT >= match_threshold

  UNION ALL

  -- Journal Entries -> journal destination
  SELECT
    'journal_entries'::TEXT,
    je.id,
    LEFT(je.content, 100)::TEXT,
    'journal'::TEXT,
    (1 - (je.embedding <=> query_embedding))::FLOAT
  FROM public.journal_entries je
  WHERE je.family_id = p_family_id
    AND je.embedding IS NOT NULL
    AND (1 - (je.embedding <=> query_embedding))::FLOAT >= match_threshold

  UNION ALL

  -- Archive Context Items -> archives destination
  SELECT
    'archive_context_items'::TEXT,
    aci.id,
    LEFT(aci.context_value, 100)::TEXT,
    'archives'::TEXT,
    (1 - (aci.embedding <=> query_embedding))::FLOAT
  FROM public.archive_context_items aci
  WHERE aci.family_id = p_family_id
    AND aci.archived_at IS NULL
    AND aci.embedding IS NOT NULL
    AND (1 - (aci.embedding <=> query_embedding))::FLOAT >= match_threshold

  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;


-- ============================================================
-- 8. Feature keys for MindSweep
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('mindsweep_manual', 'MindSweep Manual', 'Always Ask mode — sort and suggest, user reviews all', 'PRD-17B'),
  ('mindsweep_auto', 'MindSweep Auto', 'Trust the Obvious + Full Autopilot auto-routing', 'PRD-17B'),
  ('mindsweep_email', 'MindSweep Email', 'Email forwarding intake channel', 'PRD-17B'),
  ('mindsweep_share', 'MindSweep Share', 'Share-to-app intake channel', 'PRD-17B'),
  ('mindsweep_pwa', 'MindSweep PWA', 'Quick-capture PWA at /sweep', 'PRD-17B'),
  ('mindsweep_digest', 'MindSweep Digest', 'MindSweep summary in Rhythms', 'PRD-17B'),
  ('mindsweep_learning', 'MindSweep Learning', 'Approval pattern analysis and auto-approval', 'PRD-17B')
ON CONFLICT (feature_key) DO NOTHING;

-- Tier assignments (all return true during beta)
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, rg.role_group, st.id, true
FROM (VALUES
  ('mindsweep_manual', 'mom'),
  ('mindsweep_manual', 'dad_adults'),
  ('mindsweep_manual', 'independent_teens'),
  ('mindsweep_auto', 'mom'),
  ('mindsweep_auto', 'dad_adults'),
  ('mindsweep_email', 'mom'),
  ('mindsweep_share', 'mom'),
  ('mindsweep_share', 'dad_adults'),
  ('mindsweep_share', 'independent_teens'),
  ('mindsweep_pwa', 'mom'),
  ('mindsweep_pwa', 'dad_adults'),
  ('mindsweep_pwa', 'independent_teens'),
  ('mindsweep_digest', 'mom'),
  ('mindsweep_digest', 'dad_adults'),
  ('mindsweep_learning', 'mom')
) AS fk(feature_key, role_group)
CROSS JOIN LATERAL (SELECT role_group) AS rg(role_group)
CROSS JOIN public.subscription_tiers st
WHERE st.slug = CASE
  WHEN fk.feature_key IN ('mindsweep_manual') THEN 'essential'
  WHEN fk.feature_key IN ('mindsweep_share', 'mindsweep_pwa', 'mindsweep_digest') THEN 'enhanced'
  WHEN fk.feature_key IN ('mindsweep_auto', 'mindsweep_email', 'mindsweep_learning') THEN 'full-magic'
  ELSE 'essential'
END
ON CONFLICT DO NOTHING;
