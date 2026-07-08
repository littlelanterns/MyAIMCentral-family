-- ============================================================================
-- PRD-30: Safety Monitoring — SM-A Detection Foundation
-- ============================================================================
-- Two-layer detection pipeline for privately alerting parents when a
-- monitored family member's LiLa conversation contains concerning patterns
-- (self-harm, abuse, sexual/predatory content, substance, eating disorder,
-- bullying, profanity, other). Layer 1 = keyword/phrase matching (every
-- message). Layer 2 = Haiku conversation classification (per-conversation,
-- 30 min quiet). PRD-30 watches the MEMBER's input; PRD-41 (shipped) watches
-- LiLa's output — disjoint by content direction, nothing double-scanned.
--
-- Architecture deviation from PRD wording (founder-approved D1, feature
-- decision file claude/feature-decisions/PRD-30-Safety-Monitoring.md): both
-- layers run via a POLLED sweep (safety-classify Edge Function, cron every
-- minute), not request-path hooks. Zero retrofit of the 14 lila_messages
-- writer functions. lila_messages.safety_scanned + lila_conversations.
-- safety_scanned already exist (migration 7), dormant, polling-shaped —
-- this migration wires them plus adds the two missing bookshelf columns.
--
-- 7 new tables:
--   1. safety_monitoring_configs   — per-member monitoring toggle
--   2. safety_sensitivity_configs  — per-member per-category threshold
--   3. safety_notification_recipients — who gets alerted
--   4. safety_flags                — the flag records (polymorphic
--      conversation ref + column-level content guard, per founder ruling
--      2026-07-06 mirroring PRD-41's lila_ethics_rejections pattern — see
--      migration 100286 for the identical guard shape)
--   5. safety_keywords              — platform-level curated keyword library
--   6. safety_resources             — platform-level curated crisis/support
--      resources
--   7. safety_pattern_summaries     — weekly digest rows (generation logic
--      ships in SM-C; table + RLS ship here per the PRD's schema list)
--
-- Idempotent: safe to re-run (IF NOT EXISTS / DO $$ EXCEPTION guards).
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. safety_monitoring_configs — per-member monitoring toggle.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_monitoring_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  monitored_member_id   UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID REFERENCES public.family_members(id),
  UNIQUE (family_id, monitored_member_id)
);

CREATE INDEX IF NOT EXISTS idx_smc_family_active
  ON public.safety_monitoring_configs (family_id, is_active);

DO $$ BEGIN
  CREATE TRIGGER trg_smc_updated_at
    BEFORE UPDATE ON public.safety_monitoring_configs
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.safety_monitoring_configs ENABLE ROW LEVEL SECURITY;

-- Primary parent CRUD only. No other member can access (Screen 1 —
-- primary-parent-only Settings section; PRD-30 §Visibility & Permissions).
DO $$ BEGIN
  CREATE POLICY "smc_mom_all" ON public.safety_monitoring_configs
    FOR ALL TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    ) WITH CHECK (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. safety_sensitivity_configs — per member, per category threshold.
--    Absence of a row for a member+category means "use the shell-type
--    default" (computed in code — see _shared/safety-classify-match.ts
--    resolveDefaultSensitivity). Locked categories (self_harm, abuse,
--    sexual_predatory) are ALWAYS High at the pipeline layer regardless of
--    any stored row (Key PRD Decision #3) — enforced in code, not by a DB
--    trigger, so a stored row for a locked category (if one ever exists)
--    is simply ignored by the sweep, never trusted.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_sensitivity_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  monitored_member_id   UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  category              TEXT NOT NULL CHECK (category IN (
                           'self_harm', 'abuse', 'sexual_predatory', 'substance',
                           'eating_disorder', 'bullying', 'profanity', 'other'
                         )),
  sensitivity           TEXT NOT NULL DEFAULT 'high' CHECK (sensitivity IN ('low', 'medium', 'high')),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, monitored_member_id, category)
);

DO $$ BEGIN
  CREATE TRIGGER trg_ssc_updated_at
    BEFORE UPDATE ON public.safety_sensitivity_configs
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.safety_sensitivity_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "ssc_mom_all" ON public.safety_sensitivity_configs
    FOR ALL TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    ) WITH CHECK (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. safety_notification_recipients — who receives safety alerts.
--    Mom is auto-created (always active, in_app) by the auto-provision
--    trigger extension below. Dad rows are created later by mom via
--    Settings (SM-B) — no auto-provision for additional_adult recipients.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_notification_recipients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  recipient_member_id     UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  notification_channels   TEXT[] NOT NULL DEFAULT '{in_app}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_id, recipient_member_id)
);

ALTER TABLE public.safety_notification_recipients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "snr_mom_all" ON public.safety_notification_recipients
    FOR ALL TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    ) WITH CHECK (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "snr_recipient_select_own" ON public.safety_notification_recipients
    FOR SELECT TO authenticated USING (
      recipient_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. safety_flags — the flag records.
--    Deviations from the PRD's literal schema (feature decision file
--    §Database Changes Required):
--      (a) polymorphic conversation ref (conversation_table + conversation_id,
--          both nullable) instead of a NOT NULL FK -> lila_conversations, so
--          bookshelf discussions can flag too, and a future non-conversation
--          crisis event (SM-C's D5 wiring) can flag with conversation_id NULL.
--      (b) surface TEXT NOT NULL (Edge Function / tool name — PRD-41 shape).
--      (c) is_safe_harbor BOOLEAN DEFAULT false — defensive flag (J5;
--          Convention #6), excluded from any future aggregation.
--      (d) column-level content guard on context_snippet, matched_keywords,
--          classification_reasoning (all three CAN contain the member's own
--          words). Mirrors migration 100286's lila_ethics_rejections guard
--          exactly — see that file's comment for the full rationale. The
--          frozen lila_conversation kid-privacy carve-out (pending attorney
--          advice) must never be side-doored through a flag detail API
--          response, even though no UI (yet) would render it.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_flags (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                 UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  flagged_member_id         UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  conversation_table        TEXT CHECK (conversation_table IN ('lila_conversations', 'bookshelf_discussions')),
  conversation_id           UUID,
  surface                   TEXT NOT NULL,
  category                  TEXT NOT NULL CHECK (category IN (
                               'self_harm', 'abuse', 'sexual_predatory', 'substance',
                               'eating_disorder', 'bullying', 'profanity', 'other'
                             )),
  severity                  TEXT NOT NULL CHECK (severity IN ('concern', 'warning', 'critical')),
  detection_layer           TEXT NOT NULL CHECK (detection_layer IN ('keyword', 'classification', 'both')),
  context_snippet           JSONB NOT NULL DEFAULT '[]'::jsonb, -- CONTENT-BEARING — column-guarded below
  matched_keywords          TEXT[] NOT NULL DEFAULT '{}',       -- CONTENT-BEARING — column-guarded below
  classification_reasoning  TEXT,                                -- CONTENT-BEARING — column-guarded below
  conversation_starter      TEXT, -- content-free by construction (J2/D2) — never guarded
  resource_ids              UUID[] NOT NULL DEFAULT '{}',
  status                    TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'dismissed')),
  reviewed_at                TIMESTAMPTZ,
  reviewed_by                UUID REFERENCES public.family_members(id),
  is_safe_harbor             BOOLEAN NOT NULL DEFAULT false,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sf_member_created
  ON public.safety_flags (family_id, flagged_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sf_status
  ON public.safety_flags (family_id, status);
CREATE INDEX IF NOT EXISTS idx_sf_dedup_window
  ON public.safety_flags (family_id, flagged_member_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sf_family_created
  ON public.safety_flags (family_id, created_at DESC);

ALTER TABLE public.safety_flags ENABLE ROW LEVEL SECURITY;

-- SELECT: mom + active granted recipients. Flagged member CANNOT access —
-- no policy exists for the flagged member's own row visibility at all.
DO $$ BEGIN
  CREATE POLICY "sf_select_recipients" ON public.safety_flags
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (
        SELECT 1 FROM public.safety_notification_recipients snr
        JOIN public.family_members fm ON fm.id = snr.recipient_member_id
        WHERE snr.family_id = safety_flags.family_id
          AND fm.user_id = auth.uid()
          AND snr.is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE: primary parent only (status/reviewed_at/reviewed_by — PRD
-- "Primary parent can update status"). No recipient update path yet.
DO $$ BEGIN
  CREATE POLICY "sf_update_mom" ON public.safety_flags
    FOR UPDATE TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    ) WITH CHECK (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT: service role only (safety-classify Edge Function). No policy for
-- authenticated at all — service role bypasses RLS; there is intentionally
-- no client insert path (mirrors lila_ethics_rejections, migration 100286).
-- NO DELETE policy exists at all — flags are permanent (Key PRD Decision #8).

-- ── Column-level content guard (mirrors migration 100286 exactly) ───────
REVOKE SELECT ON public.safety_flags FROM authenticated, anon;
GRANT SELECT (
  id, family_id, flagged_member_id, conversation_table, conversation_id,
  surface, category, severity, detection_layer, conversation_starter,
  resource_ids, status, reviewed_at, reviewed_by, is_safe_harbor, created_at
) ON public.safety_flags TO authenticated;

COMMENT ON COLUMN public.safety_flags.context_snippet IS
  'CONTENT-BEARING — service-role-only via column REVOKE. Never exposed to authenticated/anon via PostgREST. Feature decision file §J2/D2: no side-door around the frozen lila_conversation kid-privacy carve-out. Unlock = GRANT + UI change if attorney advice later opens conversation content to parents.';
COMMENT ON COLUMN public.safety_flags.matched_keywords IS
  'CONTENT-BEARING — service-role-only via column REVOKE. The matched keywords ARE the member''s own words. See context_snippet comment.';
COMMENT ON COLUMN public.safety_flags.classification_reasoning IS
  'CONTENT-BEARING — service-role-only via column REVOKE. Haiku''s Layer 2 reasoning may quote the conversation. See context_snippet comment.';

-- ──────────────────────────────────────────────────────────────────────────
-- 5. safety_keywords — platform-level curated keyword/phrase library.
--    Locked down entirely (no SELECT for authenticated/anon at all) —
--    unlike safety_resources, this list must never be readable by a client
--    session: a monitored teen who can enumerate the exact trigger phrases
--    could trivially evade Layer 1. Service-role only (the safety-classify
--    sweep). Future PRD-32 admin console adds a staff-gated read/write path.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_keywords (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword        TEXT NOT NULL UNIQUE,
  category       TEXT NOT NULL CHECK (category IN (
                    'self_harm', 'abuse', 'sexual_predatory', 'substance',
                    'eating_disorder', 'bullying', 'profanity', 'other'
                  )),
  base_severity  TEXT NOT NULL DEFAULT 'concern' CHECK (base_severity IN ('concern', 'warning', 'critical')),
  is_phrase      BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sk_category_active
  ON public.safety_keywords (category, is_active);

DO $$ BEGIN
  CREATE TRIGGER trg_sk_updated_at
    BEFORE UPDATE ON public.safety_keywords
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.safety_keywords ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.safety_keywords FROM authenticated, anon;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. safety_resources — platform-level curated crisis/support resources.
--    Readable by any authenticated family member viewing a flag detail
--    (Screen 3, SM-B) — not sensitive, just curated hotline/website info.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category       TEXT NOT NULL CHECK (category IN (
                    'self_harm', 'abuse', 'sexual_predatory', 'substance',
                    'eating_disorder', 'bullying', 'profanity', 'other'
                  )),
  resource_name  TEXT NOT NULL,
  resource_type  TEXT NOT NULL CHECK (resource_type IN ('hotline', 'website', 'article', 'book')),
  resource_value TEXT NOT NULL,
  description    TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sr_category_active_order
  ON public.safety_resources (category, is_active, display_order);

DO $$ BEGIN
  CREATE TRIGGER trg_sr_updated_at
    BEFORE UPDATE ON public.safety_resources
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.safety_resources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "sr_select_active" ON public.safety_resources
    FOR SELECT TO authenticated USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. safety_pattern_summaries — weekly digest rows.
--    Table + RLS ship here (PRD schema list); the generation cron/logic
--    ships in SM-C (build item 13) to avoid registering a cron job that
--    points at a not-yet-deployed function.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.safety_pattern_summaries (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  monitored_member_id    UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  period_start           DATE NOT NULL,
  period_end             DATE NOT NULL,
  summary_data           JSONB NOT NULL,
  narrative              TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sps_member_period
  ON public.safety_pattern_summaries (family_id, monitored_member_id, period_end DESC);

ALTER TABLE public.safety_pattern_summaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "sps_select_recipients" ON public.safety_pattern_summaries
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (
        SELECT 1 FROM public.safety_notification_recipients snr
        JOIN public.family_members fm ON fm.id = snr.recipient_member_id
        WHERE snr.family_id = safety_pattern_summaries.family_id
          AND fm.user_id = auth.uid()
          AND snr.is_active = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- INSERT: service role only (weekly digest job, SM-C). No client write path.

-- ──────────────────────────────────────────────────────────────────────────
-- 8. bookshelf_discussion_messages.safety_scanned + bookshelf_discussions.
--    safety_scanned — the J4 coverage closure (bookshelf-discuss persists
--    outside lila_messages; the pipeline could never see it without these).
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.bookshelf_discussion_messages
  ADD COLUMN IF NOT EXISTS safety_scanned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bdm_safety
  ON public.bookshelf_discussion_messages (discussion_id, safety_scanned)
  WHERE safety_scanned = false;

ALTER TABLE public.bookshelf_discussions
  ADD COLUMN IF NOT EXISTS safety_scanned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bdi_safety_pending
  ON public.bookshelf_discussions (family_member_id, safety_scanned)
  WHERE safety_scanned = false;

-- ──────────────────────────────────────────────────────────────────────────
-- 9. auto_provision_member_resources() extension.
--    Base: the CURRENT production definition from migration 00000000100165
--    (verified via grep across every migration that has ever replaced this
--    function — 100165 is the latest). Every non-safety branch below is
--    reproduced VERBATIM from that migration; only section 6 (safety
--    monitoring provisioning) is new. The role='family' shadow row is
--    already skipped at the TRIGGER level (migration 100254's
--    `WHEN (NEW.role <> 'family')`), so this function body never sees it —
--    no additional guard needed here for that case.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  dash_type        TEXT;
  root_folder_id   UUID;
  v_woodland_id    UUID;
  v_first_page_id  UUID;
  v_primary_parent_id UUID;
  category_names TEXT[] := ARRAY[
    'Preferences',
    'Schedule & Activities',
    'Personality & Traits',
    'Interests & Hobbies',
    'School & Learning',
    'Health & Medical',
    'General'
  ];
  cat_name TEXT;
  cat_sort INTEGER := 0;
BEGIN
  -- ============================================================
  -- 1. ARCHIVE PROVISIONING (restored from 100035 per Convention #77)
  --    Creates: member_root folder, 7 system category subfolders,
  --             wishlist folder, archive_member_settings record.
  -- ============================================================

  -- 1a. Create member_root archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type, is_system)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'member_root', true)
  RETURNING id INTO root_folder_id;

  -- 1b. Create 7 system category subfolders
  FOREACH cat_name IN ARRAY category_names LOOP
    INSERT INTO public.archive_folders (
      family_id, member_id, folder_name, folder_type,
      parent_folder_id, is_system, sort_order
    )
    VALUES (
      NEW.family_id, NEW.id, cat_name, 'system_category',
      root_folder_id, true, cat_sort
    );
    cat_sort := cat_sort + 1;
  END LOOP;

  -- 1c. Create wishlist folder
  INSERT INTO public.archive_folders (
    family_id, member_id, folder_name, folder_type,
    parent_folder_id, is_system, sort_order
  )
  VALUES (
    NEW.family_id, NEW.id, 'Wishlist', 'wishlist',
    root_folder_id, true, cat_sort
  );

  -- 1d. Create archive_member_settings record
  INSERT INTO public.archive_member_settings (family_id, member_id)
  VALUES (NEW.family_id, NEW.id)
  ON CONFLICT (family_id, member_id) DO NOTHING;

  -- ============================================================
  -- 2. dashboard_config (unchanged from 100165)
  -- ============================================================
  IF NEW.dashboard_enabled IS NOT false THEN
    IF NEW.dashboard_mode = 'play' THEN
      dash_type := 'play';
    ELSIF NEW.dashboard_mode = 'guided' THEN
      dash_type := 'guided';
    ELSE
      dash_type := 'personal';
    END IF;

    INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
    VALUES (NEW.family_id, NEW.id, dash_type)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================
  -- 3. Backburner & Ideas lists for non-Guided/Play members
  --    (unchanged from 100165)
  -- ============================================================
  IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'backburner'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.lists
      WHERE family_id = NEW.family_id
        AND owner_id = NEW.id
        AND list_type = 'ideas'
        AND archived_at IS NULL
    ) THEN
      INSERT INTO public.lists (family_id, owner_id, title, list_type)
      VALUES (NEW.family_id, NEW.id, 'Ideas', 'ideas');
    END IF;
  END IF;

  -- ============================================================
  -- 4. Seed default rhythm_configs based on role / dashboard_mode
  --    (unchanged from 100165)
  -- ============================================================
  IF NEW.dashboard_mode = 'play' THEN
    -- Play: morning only (simplified sections)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"routine_checklist","enabled":true,"order":2,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'guided' THEN
    -- Guided: morning rhythm — 3 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning', 'default', true,
      '[
        {"section_type":"encouraging_message","enabled":true,"order":1,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    -- Guided: mini evening rhythm — 5 sections
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening', 'default', true, true,
      '[
        {"section_type":"guided_day_highlights","enabled":true,"order":1,"config":{}},
        {"section_type":"guided_pride_reflection","enabled":true,"order":2,"config":{}},
        {"section_type":"guided_reflections","enabled":true,"order":3,"config":{}},
        {"section_type":"guided_tomorrow_lookahead","enabled":true,"order":4,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSIF NEW.dashboard_mode = 'independent' THEN
    -- Phase D (Build N): Independent Teen tailored rhythms (Enhancement 7)
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Check-in', 'default', true, 2,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{"framingText":"You said this matters to you:"}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":3,"config":{"scope":"member"}},
        {"section_type":"on_the_horizon","enabled":true,"order":4,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":5,"config":{"audience":"teen"}},
        {"section_type":"feature_discovery","enabled":true,"order":6,"config":{"audience":"teen"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       reflection_guideline_count, section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Check-in', 'default', true, 2, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{"variant":"teen"}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{"title":"What went right today"}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":3,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":4,"config":{"collapsed_by_default":true,"audience":"teen"}},
        {"section_type":"reflections","enabled":true,"order":5,"config":{}},
        {"section_type":"closing_thought","enabled":true,"order":6,"config":{"framingText":"Something you believe:"}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":7,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":8,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  ELSE
    -- Adult (dashboard_mode IS NULL or 'personal')
    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'morning', 'Morning Rhythm', 'default', true,
      '[
        {"section_type":"guiding_star_rotation","enabled":true,"order":1,"config":{}},
        {"section_type":"morning_priorities_recall","enabled":true,"order":2,"config":{}},
        {"section_type":"best_intentions_focus","enabled":true,"order":3,"config":{}},
        {"section_type":"calendar_preview","enabled":true,"order":4,"config":{}},
        {"section_type":"on_the_horizon","enabled":true,"order":5,"config":{"lookahead_days":7,"max_items":5}},
        {"section_type":"morning_insight","enabled":true,"order":6,"config":{}},
        {"section_type":"brain_dump","enabled":true,"order":7,"config":{}},
        {"section_type":"feature_discovery","enabled":true,"order":8,"config":{}},
        {"section_type":"periodic_cards_slot","enabled":true,"order":9,"config":{}}
      ]'::jsonb,
      '{"start_hour":5,"end_hour":12,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled,
       section_order_locked, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'evening', 'Evening Rhythm', 'default', true, true,
      '[
        {"section_type":"evening_greeting","enabled":true,"order":1,"config":{}},
        {"section_type":"accomplishments_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"completed_meetings","enabled":true,"order":3,"config":{}},
        {"section_type":"milestone_celebrations","enabled":true,"order":4,"config":{}},
        {"section_type":"carry_forward","enabled":false,"order":5,"config":{}},
        {"section_type":"evening_tomorrow_capture","enabled":true,"order":6,"config":{}},
        {"section_type":"mindsweep_lite","enabled":true,"order":7,"config":{"collapsed_by_default":true}},
        {"section_type":"closing_thought","enabled":true,"order":8,"config":{}},
        {"section_type":"from_your_library","enabled":true,"order":9,"config":{}},
        {"section_type":"before_close_the_day","enabled":true,"order":10,"config":{}},
        {"section_type":"reflections","enabled":true,"order":11,"config":{}},
        {"section_type":"rhythm_tracker_prompts","enabled":true,"order":12,"config":{}},
        {"section_type":"close_my_day","enabled":true,"order":13,"config":{}}
      ]'::jsonb,
      '{"start_hour":18,"end_hour":24,"trigger_type":"time_window"}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'weekly_review', 'Weekly Review', 'default', true,
      '[
        {"section_type":"weekly_stats","enabled":true,"order":1,"config":{}},
        {"section_type":"top_victories","enabled":true,"order":2,"config":{}},
        {"section_type":"next_week_preview","enabled":true,"order":3,"config":{}},
        {"section_type":"weekly_reflection_prompt","enabled":true,"order":4,"config":{}},
        {"section_type":"weekly_review_deep_dive","enabled":true,"order":5,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"weekly","day_of_week":5}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'monthly_review', 'Monthly Review', 'default', false,
      '[
        {"section_type":"month_at_a_glance","enabled":true,"order":1,"config":{}},
        {"section_type":"highlight_reel","enabled":true,"order":2,"config":{}},
        {"section_type":"reports_link","enabled":true,"order":3,"config":{}},
        {"section_type":"monthly_review_deep_dive","enabled":true,"order":4,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"monthly","day_of_month":1}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

    INSERT INTO public.rhythm_configs
      (family_id, member_id, rhythm_key, display_name, rhythm_type, enabled, sections, timing)
    VALUES (
      NEW.family_id, NEW.id,
      'quarterly_inventory', 'Quarterly Inventory', 'default', false,
      '[
        {"section_type":"stale_areas","enabled":true,"order":1,"config":{}},
        {"section_type":"quick_win_suggestion","enabled":true,"order":2,"config":{}},
        {"section_type":"lifelantern_launch_link","enabled":true,"order":3,"config":{}}
      ]'::jsonb,
      '{"trigger_type":"lifelantern_staleness","interval_days":90}'::jsonb
    )
    ON CONFLICT (family_id, member_id, rhythm_key) DO NOTHING;

  END IF;

  -- ============================================================
  -- 5. BUILD M ADDITIONS — gamification + sticker book provisioning
  --    (unchanged from 100165)
  -- ============================================================

  -- 5a. Insert gamification_configs with shell-appropriate defaults
  INSERT INTO public.gamification_configs (
    family_id, family_member_id,
    enabled, base_points_per_task, currency_name, currency_icon
  ) VALUES (
    NEW.family_id, NEW.id,
    CASE WHEN NEW.dashboard_mode IN ('play', 'guided') THEN true ELSE false END,
    CASE WHEN NEW.dashboard_mode = 'play' THEN 1 ELSE 10 END,
    CASE WHEN NEW.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
    '⭐'
  )
  ON CONFLICT (family_member_id) DO NOTHING;

  -- 5b. Insert member_sticker_book_state with Woodland Felt as default theme
  SELECT id INTO v_woodland_id
    FROM public.gamification_themes
   WHERE theme_slug = 'woodland_felt'
   LIMIT 1;

  IF v_woodland_id IS NOT NULL THEN
    INSERT INTO public.member_sticker_book_state (
      family_id, family_member_id, active_theme_id
    ) VALUES (
      NEW.family_id, NEW.id, v_woodland_id
    )
    ON CONFLICT (family_member_id) DO NOTHING;

    -- 5c. Bootstrap first sticker page unlock (sort_order=1 for Woodland Felt)
    SELECT id INTO v_first_page_id
      FROM public.gamification_sticker_pages
     WHERE theme_id = v_woodland_id
       AND is_active = true
     ORDER BY sort_order
     LIMIT 1;

    IF v_first_page_id IS NOT NULL THEN
      INSERT INTO public.member_page_unlocks (
        family_id, family_member_id, sticker_page_id, unlocked_trigger_type
      ) VALUES (
        NEW.family_id, NEW.id, v_first_page_id, 'bootstrap'
      )
      ON CONFLICT (family_member_id, sticker_page_id) DO NOTHING;

      UPDATE public.member_sticker_book_state
         SET active_page_id = v_first_page_id
       WHERE family_member_id = NEW.id
         AND active_page_id IS NULL;
    END IF;
  END IF;

  -- ============================================================
  -- 6. PRD-30 ADDITIONS — safety monitoring provisioning (NEW).
  --    Key PRD Decision #1: children monitored ON by default (opt-out);
  --    additional_adult monitoring OFF by default (opt-in). Mom
  --    (primary_parent) is NEVER monitored — no config row for her, ever
  --    (Key PRD Decision #2). Special adults are not monitorable (PRD
  --    §Visibility & Permissions — "they don't use LiLa"). role='family'
  --    shadow rows never reach this function body (trigger-level guard,
  --    migration 100254).
  -- ============================================================

  IF NEW.role = 'member' THEN
    SELECT id INTO v_primary_parent_id
      FROM public.family_members
     WHERE family_id = NEW.family_id AND role = 'primary_parent'
     LIMIT 1;

    INSERT INTO public.safety_monitoring_configs (family_id, monitored_member_id, is_active, created_by)
    VALUES (NEW.family_id, NEW.id, true, COALESCE(v_primary_parent_id, NEW.id))
    ON CONFLICT (family_id, monitored_member_id) DO NOTHING;

  ELSIF NEW.role = 'additional_adult' THEN
    SELECT id INTO v_primary_parent_id
      FROM public.family_members
     WHERE family_id = NEW.family_id AND role = 'primary_parent'
     LIMIT 1;

    INSERT INTO public.safety_monitoring_configs (family_id, monitored_member_id, is_active, created_by)
    VALUES (NEW.family_id, NEW.id, false, COALESCE(v_primary_parent_id, NEW.id))
    ON CONFLICT (family_id, monitored_member_id) DO NOTHING;

  ELSIF NEW.role = 'primary_parent' THEN
    -- Mom always receives safety alerts (Key PRD Decision — "Mom's own
    -- alert receipt is always on and locked"). This branch fires on the
    -- family's very first member insert (mom's own row) since the trigger
    -- only excludes role='family', not role='primary_parent'.
    INSERT INTO public.safety_notification_recipients (family_id, recipient_member_id, is_active, notification_channels)
    VALUES (NEW.family_id, NEW.id, true, '{in_app}')
    ON CONFLICT (family_id, recipient_member_id) DO NOTHING;
  END IF;
  -- role = 'special_adult' -> no config, no recipient row (not monitorable,
  -- no safety monitoring visibility per PRD §Visibility & Permissions).

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.auto_provision_member_resources() IS
  'Restores full archive provisioning (100165) + adds PRD-30 safety monitoring provisioning (section 6): child members (role=member) auto-monitored ON, additional_adult auto-provisioned OFF (opt-in), primary_parent auto-added as a safety notification recipient. Every prior branch (archives, dashboard_config, backburner/ideas lists, rhythm_configs, gamification/sticker book) reproduced verbatim from 100165.';

-- ──────────────────────────────────────────────────────────────────────────
-- 10. Backfill for existing families' members (idempotent — the trigger
--     extension above only fires on NEW inserts going forward).
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.safety_monitoring_configs (family_id, monitored_member_id, is_active, created_by)
SELECT
  fm.family_id,
  fm.id,
  true,
  COALESCE(
    (SELECT pp.id FROM public.family_members pp WHERE pp.family_id = fm.family_id AND pp.role = 'primary_parent' LIMIT 1),
    fm.id
  )
FROM public.family_members fm
WHERE fm.role = 'member'
ON CONFLICT (family_id, monitored_member_id) DO NOTHING;

INSERT INTO public.safety_monitoring_configs (family_id, monitored_member_id, is_active, created_by)
SELECT
  fm.family_id,
  fm.id,
  false,
  COALESCE(
    (SELECT pp.id FROM public.family_members pp WHERE pp.family_id = fm.family_id AND pp.role = 'primary_parent' LIMIT 1),
    fm.id
  )
FROM public.family_members fm
WHERE fm.role = 'additional_adult'
ON CONFLICT (family_id, monitored_member_id) DO NOTHING;

INSERT INTO public.safety_notification_recipients (family_id, recipient_member_id, is_active, notification_channels)
SELECT fm.family_id, fm.id, true, '{in_app}'
FROM public.family_members fm
WHERE fm.role = 'primary_parent'
ON CONFLICT (family_id, recipient_member_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- 11. safety_keywords seed — 86 rows across 8 categories. Includes every
--     phrase in _shared/crisis-detection.ts's CRISIS_KEYWORDS at
--     base_severity='critical' (Key PRD Decision #12 — "guarantees crisis
--     language in any persisted conversation always produces a Critical
--     flag"), mapped into PRD-30's 8-category taxonomy (self_harm/abuse
--     entries keep their natural category; the 4 "harm to others" entries
--     map to 'other', the only reasonable catch-all — a child threatening
--     violence toward someone else doesn't fit self_harm/abuse's victim
--     framing). Authored TOGETHER with the vitest corpus
--     (tests/safety-classify-match.test.ts) so the two are born calibrated
--     — every violation-corpus phrase below has a matching test assertion,
--     and the benign contrast set is checked against every row for false
--     positives. Deliberately OMITS the PRD-mentioned "sh" slang
--     abbreviation for self-harm — a 2-character bare-word match is a
--     false-positive magnet (documented judgment call).
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.safety_keywords (keyword, category, base_severity, is_phrase, notes) VALUES
-- self_harm (locked) — CRISIS_KEYWORDS sourced, all critical
('suicide', 'self_harm', 'critical', false, 'CRISIS_KEYWORDS'),
('suicidal', 'self_harm', 'critical', false, 'CRISIS_KEYWORDS'),
('kill myself', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('want to die', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('wish i was dead', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('wish i were dead', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('don''t want to be alive', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('do not want to be alive', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('don''t want to live', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('do not want to live', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('end my life', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('end it all', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('better off dead', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('no reason to live', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('can''t go on', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('cannot go on', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('take my own life', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('self-harm', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('self harm', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('cutting myself', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('hurting myself', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('hurt myself', 'self_harm', 'critical', true, 'CRISIS_KEYWORDS'),
('unalive', 'self_harm', 'critical', false, 'slang variant'),
('unaliving', 'self_harm', 'critical', false, 'slang variant'),
-- abuse (locked) — CRISIS_KEYWORDS sourced (critical) + additional (mixed)
('being abused', 'abuse', 'critical', true, 'CRISIS_KEYWORDS'),
('abusing me', 'abuse', 'critical', true, 'CRISIS_KEYWORDS'),
('hits me', 'abuse', 'critical', true, 'CRISIS_KEYWORDS'),
('hitting me', 'abuse', 'critical', true, 'CRISIS_KEYWORDS'),
('molest', 'abuse', 'critical', false, 'CRISIS_KEYWORDS'),
('molested', 'abuse', 'critical', false, 'CRISIS_KEYWORDS'),
('molesting', 'abuse', 'critical', false, 'CRISIS_KEYWORDS'),
('scared of my dad', 'abuse', 'warning', true, NULL),
('scared of my mom', 'abuse', 'warning', true, NULL),
('afraid to go home', 'abuse', 'critical', true, NULL),
('locks me in my room', 'abuse', 'warning', true, NULL),
('punches me', 'abuse', 'critical', true, NULL),
-- sexual_predatory (locked) — grooming pattern indicators
('send pics', 'sexual_predatory', 'warning', true, NULL),
('don''t tell anyone', 'sexual_predatory', 'warning', true, 'grooming pattern'),
('our secret', 'sexual_predatory', 'warning', true, 'grooming pattern'),
('inappropriate photo', 'sexual_predatory', 'critical', true, NULL),
('groomed', 'sexual_predatory', 'warning', false, NULL),
('grooming', 'sexual_predatory', 'warning', false, NULL),
('meet in person', 'sexual_predatory', 'concern', true, NULL),
('how old are you', 'sexual_predatory', 'concern', true, NULL),
-- substance (adjustable)
('overdose', 'substance', 'critical', false, 'CRISIS_KEYWORDS'),
('getting high', 'substance', 'warning', true, NULL),
('get drunk', 'substance', 'concern', true, NULL),
('vaping', 'substance', 'concern', false, NULL),
('vape', 'substance', 'concern', false, NULL),
('weed', 'substance', 'concern', false, NULL),
('drugs at the party', 'substance', 'warning', true, NULL),
('pressuring me to drink', 'substance', 'warning', true, NULL),
('pills to get high', 'substance', 'critical', true, NULL),
-- eating_disorder (adjustable) — CRISIS_KEYWORDS trio + additional
('eating disorder', 'eating_disorder', 'critical', true, 'CRISIS_KEYWORDS'),
('starving myself', 'eating_disorder', 'critical', true, 'CRISIS_KEYWORDS'),
('purging', 'eating_disorder', 'critical', false, 'CRISIS_KEYWORDS'),
('pro-ana', 'eating_disorder', 'critical', false, NULL),
('haven''t eaten in days', 'eating_disorder', 'warning', true, NULL),
('counting calories obsessively', 'eating_disorder', 'warning', true, NULL),
('hate my body', 'eating_disorder', 'concern', true, NULL),
('binge and purge', 'eating_disorder', 'critical', true, NULL),
-- bullying (adjustable)
('bullying me', 'bullying', 'warning', true, NULL),
('everyone hates me at school', 'bullying', 'warning', true, NULL),
('nobody likes me', 'bullying', 'concern', true, NULL),
('they made fun of me', 'bullying', 'concern', true, NULL),
('cyberbullying', 'bullying', 'warning', false, NULL),
('threatened me online', 'bullying', 'warning', true, NULL),
('excluded me from the group', 'bullying', 'concern', true, NULL),
-- profanity (adjustable) — all concern, lowest severity tier
('fuck', 'profanity', 'concern', false, NULL),
('shit', 'profanity', 'concern', false, NULL),
('bitch', 'profanity', 'concern', false, NULL),
('asshole', 'profanity', 'concern', false, NULL),
('damn it', 'profanity', 'concern', true, NULL),
-- other (adjustable) — includes CRISIS_KEYWORDS "harm to others" set
('running away', 'other', 'warning', true, NULL),
('want to run away', 'other', 'warning', true, NULL),
('nobody would notice if i was gone', 'other', 'critical', true, NULL),
('feel so alone', 'other', 'concern', true, NULL),
('giving up on everything', 'other', 'warning', true, NULL),
('hate my life', 'other', 'concern', true, NULL),
('stopped caring about anything', 'other', 'warning', true, NULL),
('kill him', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)'),
('kill her', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)'),
('kill them', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)'),
('going to kill', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)'),
('want to hurt', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)'),
('going to hurt', 'other', 'critical', true, 'CRISIS_KEYWORDS (harm to others)')
ON CONFLICT (keyword) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- 12. safety_resources seed — curated, verified resources per category.
--     Numbers/URLs verified as of this migration's authorship (2026-07-07).
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.safety_resources (category, resource_name, resource_type, resource_value, description, display_order) VALUES
('self_harm', '988 Suicide & Crisis Lifeline', 'hotline', '988', 'Call or text 988, 24/7, for anyone in suicidal crisis or emotional distress.', 0),
('self_harm', 'Crisis Text Line', 'hotline', 'Text HOME to 741741', 'Free, 24/7 crisis support over text message.', 1),
('self_harm', 'Self-Injury Outreach & Support', 'website', 'https://sioutreach.org', 'Information and resources on self-harm for parents and teens.', 2),
('abuse', 'National Domestic Violence Hotline', 'hotline', '1-800-799-7233', '24/7 confidential support for anyone affected by domestic violence.', 0),
('abuse', 'Childhelp National Child Abuse Hotline', 'hotline', '1-800-422-4453', '24/7 crisis intervention and resources for child abuse concerns.', 1),
('sexual_predatory', 'National Sexual Assault Hotline (RAINN)', 'hotline', '1-800-656-4673', '24/7 confidential support from RAINN.', 0),
('sexual_predatory', 'NCMEC CyberTipline', 'website', 'https://report.cybertip.org', 'Report suspected online enticement or exploitation of a child.', 1),
('substance', 'SAMHSA National Helpline', 'hotline', '1-800-662-4357', 'Free, confidential, 24/7 treatment referral for substance use.', 0),
('substance', 'Partnership to End Addiction', 'website', 'https://drugfree.org', 'Guidance for parents talking with teens about substance use.', 1),
('eating_disorder', 'National Eating Disorders Association Helpline', 'hotline', '1-800-931-2237', 'Support, resources, and treatment options for eating disorders.', 0),
('eating_disorder', 'NEDA Screening Tool', 'website', 'https://www.nationaleatingdisorders.org/screening-tool', 'A free, confidential screening tool for eating disorder concerns.', 1),
('bullying', 'StopBullying.gov', 'website', 'https://www.stopbullying.gov', 'Federal guidance on preventing and responding to bullying.', 0),
('bullying', 'Cyberbullying Research Center', 'website', 'https://cyberbullying.org', 'Research-backed resources for parents on cyberbullying.', 1),
('profanity', 'Common Sense Media — Talking About Language', 'article', 'https://www.commonsensemedia.org', 'Age-appropriate guidance for talking with kids about language and media.', 0),
('other', '988 Suicide & Crisis Lifeline', 'hotline', '988', 'Call or text 988, 24/7 — appropriate for any concerning behavioral change.', 0),
('other', 'Child Mind Institute', 'website', 'https://childmind.org', 'Guidance for parents on behavioral and emotional changes in children.', 1)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- 13. Feature keys + tier gating.
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('safety_monitoring_basic', 'Safety Monitoring — Basic', 'Layer 1 keyword-based detection, flag review, and curated resources for monitored family members.', 'PRD-30'),
  ('safety_monitoring_ai', 'Safety Monitoring — AI Classification', 'Layer 2 Haiku conversation classification, conversation-starter suggestions, and weekly pattern summaries.', 'PRD-30')
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('safety_monitoring_basic', 'mom'),
  ('safety_monitoring_basic', 'dad_adults'),
  ('safety_monitoring_ai', 'mom'),
  ('safety_monitoring_ai', 'dad_adults')
) AS fk(feature_key, role_group)
CROSS JOIN LATERAL (
  SELECT id FROM public.subscription_tiers
   WHERE slug = (CASE WHEN fk.feature_key = 'safety_monitoring_ai' THEN 'full_magic' ELSE 'enhanced' END)
) AS st(id)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- 14. Cron: safety-classify every minute (Convention #246). The weekly
--     digest job registers in SM-C alongside the function that consumes it
--     (avoids a dangling cron pointing at an undeployed Edge Function).
-- ──────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'safety-classify') THEN
    PERFORM cron.unschedule('safety-classify');
  END IF;
END $$;

SELECT cron.schedule(
  'safety-classify',
  '* * * * *', -- every minute, offset from embed/validate-ai-output by virtue
               -- of independent non-blocking pg_net calls (same reasoning as
               -- migration 100286's validate-ai-output cron comment)
  $cron$
  SELECT util.invoke_edge_function('safety-classify');
  $cron$
);

-- ──────────────────────────────────────────────────────────────────────────
-- 15. Verification block.
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_tables INTEGER;
  v_keyword_count INTEGER;
  v_guarded_cols INTEGER;
  v_granted_cols INTEGER;
  v_backfill_member_configs INTEGER;
  v_backfill_recipients INTEGER;
  v_total_members INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables
    FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN (
       'safety_monitoring_configs', 'safety_sensitivity_configs',
       'safety_notification_recipients', 'safety_flags', 'safety_keywords',
       'safety_resources', 'safety_pattern_summaries'
     );
  IF v_tables <> 7 THEN
    RAISE EXCEPTION 'migration 100289: expected 7 new tables, found %', v_tables;
  END IF;

  SELECT COUNT(*) INTO v_keyword_count FROM public.safety_keywords WHERE is_active = true;
  IF v_keyword_count < 50 THEN
    RAISE EXCEPTION 'migration 100289: expected >= 50 active safety_keywords, found %', v_keyword_count;
  END IF;

  -- Column guard on safety_flags — mirrors migration 100286's verification.
  SELECT COUNT(*) INTO v_guarded_cols
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'safety_flags'
    AND column_name IN ('context_snippet', 'matched_keywords', 'classification_reasoning')
    AND grantee IN ('authenticated', 'anon')
    AND privilege_type = 'SELECT';
  IF v_guarded_cols > 0 THEN
    RAISE EXCEPTION 'migration 100289: column guard violated on safety_flags — % SELECT grants to authenticated/anon on content-bearing columns', v_guarded_cols;
  END IF;

  SELECT COUNT(*) INTO v_granted_cols
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'safety_flags'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT'
    AND column_name NOT IN ('context_snippet', 'matched_keywords', 'classification_reasoning');
  IF v_granted_cols < 16 THEN
    RAISE EXCEPTION 'migration 100289: expected 16 authenticated-granted columns on safety_flags, found %', v_granted_cols;
  END IF;

  -- safety_keywords must be entirely unreadable via PostgREST.
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'safety_keywords'
      AND grantee IN ('authenticated', 'anon')
  ) THEN
    RAISE EXCEPTION 'migration 100289: safety_keywords has grants to authenticated/anon — must be service-role-only';
  END IF;

  -- Backfill sanity: every existing role='member' has a config row.
  SELECT COUNT(*) INTO v_total_members FROM public.family_members WHERE role = 'member';
  SELECT COUNT(*) INTO v_backfill_member_configs
    FROM public.safety_monitoring_configs smc
    JOIN public.family_members fm ON fm.id = smc.monitored_member_id AND fm.role = 'member';
  IF v_backfill_member_configs <> v_total_members THEN
    RAISE EXCEPTION 'migration 100289: backfill incomplete — % of % role=member family_members have a safety_monitoring_configs row', v_backfill_member_configs, v_total_members;
  END IF;

  SELECT COUNT(*) INTO v_backfill_recipients
    FROM public.safety_notification_recipients snr
    JOIN public.family_members fm ON fm.id = snr.recipient_member_id AND fm.role = 'primary_parent';
  IF v_backfill_recipients = 0 AND EXISTS (SELECT 1 FROM public.family_members WHERE role = 'primary_parent') THEN
    RAISE EXCEPTION 'migration 100289: backfill incomplete — no primary_parent safety_notification_recipients rows created';
  END IF;

  RAISE NOTICE 'PRD-30 SM-A migration verified: 7 tables, % active keywords, column guard intact (% granted / 3 guarded), backfill covers % monitored children + % mom recipients.',
    v_keyword_count, v_granted_cols, v_backfill_member_configs, v_backfill_recipients;
END $$;
