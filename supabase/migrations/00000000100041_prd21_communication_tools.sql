-- ============================================================================
-- PRD-21: Communication & Relationship Tools — Phase 21-A
-- Creates: communication_drafts, teaching_skill_history, private_notes,
--          relationship_notes tables
-- Modifies: archive_context_items (is_negative_preference),
--           archive_member_settings (display_name_aliases),
--           lila_guided_modes (container_preference → 'modal' for 8 tools)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 1: PRD-19 Guard Tables
-- These tables are defined in PRD-19 but needed NOW by PRD-21 tools for
-- context loading. Create them if they don't exist.
-- ────────────────────────────────────────────────────────────────────────────

-- private_notes — Mom's private notes about family members
-- CRITICAL PRIVACY: NEVER visible to about_member_id
CREATE TABLE IF NOT EXISTS public.private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  about_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT private_notes_not_self CHECK (author_id != about_member_id)
);

CREATE INDEX IF NOT EXISTS idx_pn_family ON public.private_notes(family_id);
CREATE INDEX IF NOT EXISTS idx_pn_about ON public.private_notes(about_member_id);
CREATE INDEX IF NOT EXISTS idx_pn_author ON public.private_notes(author_id);

ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Author can manage own. Mom can read all. NEVER visible to about_member_id.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'private_notes' AND policyname = 'private_notes_select') THEN
    CREATE POLICY private_notes_select ON public.private_notes FOR SELECT USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = private_notes.family_id
          AND user_id = auth.uid()
          AND role = 'primary_parent'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'private_notes' AND policyname = 'private_notes_insert') THEN
    CREATE POLICY private_notes_insert ON public.private_notes FOR INSERT WITH CHECK (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'private_notes' AND policyname = 'private_notes_update') THEN
    CREATE POLICY private_notes_update ON public.private_notes FOR UPDATE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'private_notes' AND policyname = 'private_notes_delete') THEN
    CREATE POLICY private_notes_delete ON public.private_notes FOR DELETE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- relationship_notes — Author-scoped notes about a relationship pair
CREATE TABLE IF NOT EXISTS public.relationship_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  person_a_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_included_in_ai BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rn_family ON public.relationship_notes(family_id);
CREATE INDEX IF NOT EXISTS idx_rn_author ON public.relationship_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_rn_pair ON public.relationship_notes(person_a_id, person_b_id);

ALTER TABLE public.relationship_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_notes' AND policyname = 'relationship_notes_select') THEN
    CREATE POLICY relationship_notes_select ON public.relationship_notes FOR SELECT USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = relationship_notes.family_id
          AND user_id = auth.uid()
          AND role = 'primary_parent'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_notes' AND policyname = 'relationship_notes_insert') THEN
    CREATE POLICY relationship_notes_insert ON public.relationship_notes FOR INSERT WITH CHECK (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_notes' AND policyname = 'relationship_notes_update') THEN
    CREATE POLICY relationship_notes_update ON public.relationship_notes FOR UPDATE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'relationship_notes' AND policyname = 'relationship_notes_delete') THEN
    CREATE POLICY relationship_notes_delete ON public.relationship_notes FOR DELETE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- updated_at triggers for guard tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pn_updated_at') THEN
    CREATE TRIGGER trg_pn_updated_at BEFORE UPDATE ON public.private_notes
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rn_updated_at') THEN
    CREATE TRIGGER trg_rn_updated_at BEFORE UPDATE ON public.relationship_notes
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Column Additions
-- ────────────────────────────────────────────────────────────────────────────

-- Veto memory: negative preferences on archive context items
ALTER TABLE public.archive_context_items
  ADD COLUMN IF NOT EXISTS is_negative_preference BOOLEAN NOT NULL DEFAULT false;

-- Name resolution: display name aliases on member settings
ALTER TABLE public.archive_member_settings
  ADD COLUMN IF NOT EXISTS display_name_aliases TEXT[] NOT NULL DEFAULT '{}';

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 3: PRD-21 Tables
-- ────────────────────────────────────────────────────────────────────────────

-- communication_drafts — Unified Cyrano + Higgins Say draft storage
CREATE TABLE IF NOT EXISTS public.communication_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  about_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  tool_mode TEXT NOT NULL CHECK (tool_mode IN ('cyrano', 'higgins_say')),
  raw_input TEXT NOT NULL,
  crafted_version TEXT NOT NULL,
  final_version TEXT,
  teaching_skill TEXT,
  teaching_note TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'saved_for_later', 'discarded')),
  sent_at TIMESTAMPTZ,
  sent_via TEXT,
  lila_conversation_id UUID REFERENCES public.lila_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cd_family_author_status
  ON public.communication_drafts(family_id, author_id, status);
CREATE INDEX IF NOT EXISTS idx_cd_family_author_tool
  ON public.communication_drafts(family_id, author_id, tool_mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cd_about_member
  ON public.communication_drafts(family_id, about_member_id);

ALTER TABLE public.communication_drafts ENABLE ROW LEVEL SECURITY;

-- RLS: Author can CRUD own. Mom can READ all family drafts.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_drafts' AND policyname = 'communication_drafts_select') THEN
    CREATE POLICY communication_drafts_select ON public.communication_drafts FOR SELECT USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = communication_drafts.family_id
          AND user_id = auth.uid()
          AND role = 'primary_parent'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_drafts' AND policyname = 'communication_drafts_insert') THEN
    CREATE POLICY communication_drafts_insert ON public.communication_drafts FOR INSERT WITH CHECK (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_drafts' AND policyname = 'communication_drafts_update') THEN
    CREATE POLICY communication_drafts_update ON public.communication_drafts FOR UPDATE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communication_drafts' AND policyname = 'communication_drafts_delete') THEN
    CREATE POLICY communication_drafts_delete ON public.communication_drafts FOR DELETE USING (
      author_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cd_updated_at') THEN
    CREATE TRIGGER trg_cd_updated_at BEFORE UPDATE ON public.communication_drafts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- teaching_skill_history — Tracks skill rotation for Cyrano + both Higgins modes
CREATE TABLE IF NOT EXISTS public.teaching_skill_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  tool_mode TEXT NOT NULL CHECK (tool_mode IN ('cyrano', 'higgins_say', 'higgins_navigate')),
  skill_key TEXT NOT NULL,
  about_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  lila_conversation_id UUID REFERENCES public.lila_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tsh_member_tool
  ON public.teaching_skill_history(member_id, tool_mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tsh_family_member
  ON public.teaching_skill_history(family_id, member_id);

ALTER TABLE public.teaching_skill_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teaching_skill_history' AND policyname = 'teaching_skill_history_select') THEN
    CREATE POLICY teaching_skill_history_select ON public.teaching_skill_history FOR SELECT USING (
      member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_id = teaching_skill_history.family_id
          AND user_id = auth.uid()
          AND role = 'primary_parent'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teaching_skill_history' AND policyname = 'teaching_skill_history_insert') THEN
    CREATE POLICY teaching_skill_history_insert ON public.teaching_skill_history FOR INSERT WITH CHECK (
      member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Guided Mode Updates
-- Set container_preference = 'modal' for all 8 PRD-21 tools
-- Update opening messages with rotating variants
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.lila_guided_modes
SET container_preference = 'modal'
WHERE mode_key IN (
  'quality_time', 'gifts', 'observe_serve', 'words_affirmation',
  'gratitude', 'cyrano', 'higgins_say', 'higgins_navigate'
);

-- Opening messages for Cyrano
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "What do you want to say to your partner? Give me the raw version — I''ll help you say it the way they''ll actually hear it.",
  "Got something on your mind about your partner? Don''t worry about how it sounds — just tell me what you''re feeling, and we''ll craft it together."
]'::jsonb
WHERE mode_key = 'cyrano';

-- Opening messages for Higgins Say
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Who are you trying to talk to, and what do you want to say? Give me the honest version — we''ll find the right words together.",
  "Communication is a skill, not a talent. Tell me the situation, and we''ll find the right words."
]'::jsonb
WHERE mode_key = 'higgins_say';

-- Opening messages for Higgins Navigate
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Tell me what''s going on. I''m listening — no rush to get to solutions yet.",
  "Hard conversations start with the person having them. What''s the situation?"
]'::jsonb
WHERE mode_key = 'higgins_navigate';

-- Opening messages for Quality Time
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Who are you thinking about? Tell me their name and I''ll look at what I know about them — we''ll find time together that''ll actually mean something.",
  "Quality time isn''t about the activity. It''s about the attention. Who do you have in mind?"
]'::jsonb
WHERE mode_key = 'quality_time';

-- Opening messages for Gifts
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Gift-giving is really about paying attention. Who are you shopping for? I''ll look at what I know about them.",
  "The best gifts aren''t found — they''re noticed. Who''s on your mind?"
]'::jsonb
WHERE mode_key = 'gifts';

-- Opening messages for Observe & Serve
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Acts of service land when they target what someone actually needs — not what you''d want done for you. Who are you thinking about?",
  "Service is love made visible. The best acts are the ones nobody asked for but everyone needed. Who have you been watching?"
]'::jsonb
WHERE mode_key = 'observe_serve';

-- Opening messages for Words of Affirmation
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Affirmations land when they''re specific and true. Generic praise bounces off. Who do you want to encourage?",
  "The compliment they''ll remember isn''t ''you''re amazing.'' It''s the one that proves you were paying attention. Who are you thinking about?"
]'::jsonb
WHERE mode_key = 'words_affirmation';

-- Opening messages for Gratitude
UPDATE public.lila_guided_modes
SET opening_messages = '[
  "Gratitude is a practice, not a feeling. Who or what do you want to start with?",
  "Unexpressed gratitude feels like ingratitude to the recipient. Let''s give that thought somewhere to go."
]'::jsonb
WHERE mode_key = 'gratitude';

-- ────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Feature key registration (idempotent)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('ai_toolbox_browse', 'AI Toolbox', 'Browse AI Toolbox sidebar', 'PRD-21')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================================
-- END PRD-21 Phase 21-A Migration
-- ============================================================================
