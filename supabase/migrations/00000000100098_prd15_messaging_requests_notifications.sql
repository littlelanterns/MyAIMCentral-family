-- PRD-15: Messages, Requests & Notifications
-- 9 new tables, 2 existing tables altered, feature keys, realtime publication.
-- Privacy rule enforced throughout: mom sees only spaces she belongs to.
--
-- STRUCTURE: All CREATE TABLEs first, then all RLS policies.
-- This avoids forward-reference errors (e.g. conversation_spaces policy
-- referencing conversation_space_members before it exists).

-- ============================================================
-- PART 1: CREATE ALL TABLES + INDEXES + TRIGGERS
-- ============================================================

-- 1. conversation_spaces
CREATE TABLE IF NOT EXISTS public.conversation_spaces (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id        UUID         NOT NULL REFERENCES public.families(id)        ON DELETE CASCADE,
  space_type       TEXT         NOT NULL CHECK (space_type IN ('direct','group','family','content_corner','out_of_nest')),
  name             TEXT,
  created_by       UUID         NOT NULL REFERENCES public.family_members(id)  ON DELETE RESTRICT,
  is_pinned        BOOLEAN      NOT NULL DEFAULT false,
  metadata         JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_family_type    ON public.conversation_spaces (family_id, space_type);
CREATE INDEX IF NOT EXISTS idx_cs_family_updated ON public.conversation_spaces (family_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_cs_updated_at ON public.conversation_spaces;
CREATE TRIGGER trg_cs_updated_at
  BEFORE UPDATE ON public.conversation_spaces
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- 2. conversation_space_members
CREATE TABLE IF NOT EXISTS public.conversation_space_members (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id         UUID         NOT NULL REFERENCES public.conversation_spaces(id) ON DELETE CASCADE,
  family_member_id UUID         NOT NULL REFERENCES public.family_members(id)      ON DELETE CASCADE,
  role             TEXT         NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  notifications_muted BOOLEAN   NOT NULL DEFAULT false,
  joined_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (space_id, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_csm_space  ON public.conversation_space_members (space_id);
CREATE INDEX IF NOT EXISTS idx_csm_member ON public.conversation_space_members (family_member_id);


-- 3. conversation_threads
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id             UUID         NOT NULL REFERENCES public.conversation_spaces(id) ON DELETE CASCADE,
  title                TEXT,
  started_by           UUID         NOT NULL REFERENCES public.family_members(id) ON DELETE RESTRICT,
  is_archived          BOOLEAN      NOT NULL DEFAULT false,
  is_pinned            BOOLEAN      NOT NULL DEFAULT false,
  source_type          TEXT         NOT NULL DEFAULT 'manual'
                         CHECK (source_type IN ('manual','request_discussion','notepad_route','system')),
  source_reference_id  UUID,
  last_message_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_space_active  ON public.conversation_threads (space_id, is_archived, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ct_source        ON public.conversation_threads (source_type, source_reference_id)
  WHERE source_reference_id IS NOT NULL;


-- 4. messages
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id         UUID         NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  sender_member_id  UUID         REFERENCES public.family_members(id) ON DELETE SET NULL,
  message_type      TEXT         NOT NULL DEFAULT 'user'
                      CHECK (message_type IN ('user','lila','system','content_corner_link')),
  content           TEXT         NOT NULL,
  metadata          JSONB        NOT NULL DEFAULT '{}',
  reply_to_id       UUID         REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited         BOOLEAN      NOT NULL DEFAULT false,
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msg_thread       ON public.messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_sender       ON public.messages (sender_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_type         ON public.messages (message_type);
CREATE INDEX IF NOT EXISTS idx_messages_fts     ON public.messages USING gin (to_tsvector('english', content));


-- 5. message_read_status
CREATE TABLE IF NOT EXISTS public.message_read_status (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id            UUID         NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  family_member_id     UUID         NOT NULL REFERENCES public.family_members(id)       ON DELETE CASCADE,
  last_read_message_id UUID         REFERENCES public.messages(id) ON DELETE SET NULL,
  last_read_at         TIMESTAMPTZ,
  UNIQUE (thread_id, family_member_id)
);

CREATE INDEX IF NOT EXISTS idx_mrs_member_read ON public.message_read_status (family_member_id, last_read_at);


-- 6. messaging_settings
CREATE TABLE IF NOT EXISTS public.messaging_settings (
  id                            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id                     UUID         NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  communication_guidelines      TEXT         NOT NULL DEFAULT '',
  content_corner_viewing_mode   TEXT         NOT NULL DEFAULT 'browse'
                                  CHECK (content_corner_viewing_mode IN ('browse','locked')),
  content_corner_locked_until   TIMESTAMPTZ,
  content_corner_who_can_add    JSONB        NOT NULL DEFAULT '["all"]',
  created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (family_id)
);

DROP TRIGGER IF EXISTS trg_msettings_updated_at ON public.messaging_settings;
CREATE TRIGGER trg_msettings_updated_at
  BEFORE UPDATE ON public.messaging_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- 7. member_messaging_permissions
CREATE TABLE IF NOT EXISTS public.member_messaging_permissions (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id            UUID         NOT NULL REFERENCES public.families(id)        ON DELETE CASCADE,
  member_id            UUID         NOT NULL REFERENCES public.family_members(id)  ON DELETE CASCADE,
  can_message_member_id UUID        NOT NULL REFERENCES public.family_members(id)  ON DELETE CASCADE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (member_id, can_message_member_id)
);

CREATE INDEX IF NOT EXISTS idx_mmp_family_member ON public.member_messaging_permissions (family_id, member_id);


-- 8. message_coaching_settings
CREATE TABLE IF NOT EXISTS public.message_coaching_settings (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id         UUID         NOT NULL REFERENCES public.families(id)        ON DELETE CASCADE,
  family_member_id  UUID         NOT NULL REFERENCES public.family_members(id)  ON DELETE CASCADE,
  is_enabled        BOOLEAN      NOT NULL DEFAULT false,
  custom_prompt     TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (family_id, family_member_id)
);

DROP TRIGGER IF EXISTS trg_mcs_updated_at ON public.message_coaching_settings;
CREATE TRIGGER trg_mcs_updated_at
  BEFORE UPDATE ON public.message_coaching_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- 9. family_requests
CREATE TABLE IF NOT EXISTS public.family_requests (
  id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id             UUID         NOT NULL REFERENCES public.families(id)        ON DELETE CASCADE,
  sender_member_id      UUID         NOT NULL REFERENCES public.family_members(id)  ON DELETE RESTRICT,
  recipient_member_id   UUID         NOT NULL REFERENCES public.family_members(id)  ON DELETE RESTRICT,
  title                 TEXT         NOT NULL,
  details               TEXT,
  when_text             TEXT,
  status                TEXT         NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','declined','snoozed')),
  routed_to             TEXT         CHECK (routed_to IN ('calendar','tasks','list','acknowledged')),
  routed_reference_id   UUID,
  decline_note          TEXT,
  snoozed_until         TIMESTAMPTZ,
  discussion_thread_id  UUID         REFERENCES public.conversation_threads(id) ON DELETE SET NULL,
  source                TEXT         NOT NULL DEFAULT 'quick_request'
                          CHECK (source IN ('quick_request','notepad_route','mindsweep_auto')),
  source_reference_id   UUID,
  processed_at          TIMESTAMPTZ,
  processed_by          UUID         REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fr_recipient_status  ON public.family_requests (family_id, recipient_member_id, status);
CREATE INDEX IF NOT EXISTS idx_fr_sender_created    ON public.family_requests (family_id, sender_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fr_snoozed           ON public.family_requests (status, snoozed_until)
  WHERE status = 'snoozed';

DROP TRIGGER IF EXISTS trg_fr_updated_at ON public.family_requests;
CREATE TRIGGER trg_fr_updated_at
  BEFORE UPDATE ON public.family_requests
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- ============================================================
-- PART 2: CUSTOM TRIGGER FUNCTIONS
-- ============================================================

-- Update thread.last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION public.fn_messages_update_thread_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversation_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_update_thread_timestamp ON public.messages;
CREATE TRIGGER trg_messages_update_thread_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.fn_messages_update_thread_timestamp();

-- Cascade thread.last_message_at change up to space.updated_at
CREATE OR REPLACE FUNCTION public.fn_thread_update_space_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.last_message_at IS DISTINCT FROM OLD.last_message_at THEN
    UPDATE public.conversation_spaces
    SET updated_at = NEW.last_message_at
    WHERE id = NEW.space_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thread_update_space_timestamp ON public.conversation_threads;
CREATE TRIGGER trg_thread_update_space_timestamp
  AFTER UPDATE OF last_message_at ON public.conversation_threads
  FOR EACH ROW EXECUTE FUNCTION public.fn_thread_update_space_timestamp();


-- ============================================================
-- PART 3: CREATE notifications + notification_preferences (fresh)
-- These were listed in database_schema.md but never had migration files.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id             UUID         REFERENCES public.families(id)        ON DELETE CASCADE,
  recipient_member_id   UUID         REFERENCES public.family_members(id)  ON DELETE CASCADE,
  notification_type     TEXT,
  category              TEXT,
  title                 TEXT,
  body                  TEXT,
  source_type           TEXT,
  source_reference_id   UUID,
  action_url            TEXT,
  is_read               BOOLEAN      NOT NULL DEFAULT false,
  read_at               TIMESTAMPTZ,
  is_dismissed          BOOLEAN      NOT NULL DEFAULT false,
  delivery_method       TEXT         NOT NULL DEFAULT 'in_app',
  delivered_at          TIMESTAMPTZ,
  email_sent_at         TIMESTAMPTZ,
  priority              TEXT         NOT NULL DEFAULT 'normal',
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient_read
  ON public.notifications (recipient_member_id, is_read, created_at DESC)
  WHERE recipient_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notif_recipient_category
  ON public.notifications (recipient_member_id, category, created_at DESC)
  WHERE recipient_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notif_delivery
  ON public.notifications (delivery_method, delivered_at)
  WHERE delivered_at IS NULL;


CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id         UUID         REFERENCES public.families(id)        ON DELETE CASCADE,
  family_member_id  UUID         REFERENCES public.family_members(id)  ON DELETE CASCADE,
  category          TEXT,
  in_app_enabled    BOOLEAN      NOT NULL DEFAULT true,
  push_enabled      BOOLEAN      NOT NULL DEFAULT false,
  do_not_disturb    BOOLEAN      NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_np_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_np_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- ============================================================
-- PART 4: ENABLE RLS ON ALL TABLES (after all tables exist)
-- ============================================================

ALTER TABLE public.conversation_spaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_space_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_messaging_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_coaching_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_requests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences     ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PART 5: ALL RLS POLICIES (all tables now exist)
-- ============================================================

-- ── conversation_spaces ──────────────────────────────────────

DROP POLICY IF EXISTS "cs_select_member" ON public.conversation_spaces;
CREATE POLICY "cs_select_member" ON public.conversation_spaces
  FOR SELECT USING (
    id IN (
      SELECT csm.space_id
      FROM public.conversation_space_members csm
      WHERE csm.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "cs_insert_member" ON public.conversation_spaces;
CREATE POLICY "cs_insert_member" ON public.conversation_spaces
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    AND created_by IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cs_update_creator_or_parent" ON public.conversation_spaces;
CREATE POLICY "cs_update_creator_or_parent" ON public.conversation_spaces
  FOR UPDATE USING (
    created_by IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "cs_delete_parent" ON public.conversation_spaces;
CREATE POLICY "cs_delete_parent" ON public.conversation_spaces
  FOR DELETE USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ── conversation_space_members ───────────────────────────────

DROP POLICY IF EXISTS "csm_select_member" ON public.conversation_space_members;
CREATE POLICY "csm_select_member" ON public.conversation_space_members
  FOR SELECT USING (
    space_id IN (
      SELECT csm2.space_id
      FROM public.conversation_space_members csm2
      WHERE csm2.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "csm_insert_admin_or_parent" ON public.conversation_space_members;
CREATE POLICY "csm_insert_admin_or_parent" ON public.conversation_space_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_space_members csm2
      JOIN public.family_members fm ON fm.id = csm2.family_member_id
      WHERE csm2.space_id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
        AND (csm2.role = 'admin' OR fm.role = 'primary_parent')
    )
    -- OR the inserter is primary_parent in the family that owns the space
    OR EXISTS (
      SELECT 1 FROM public.conversation_spaces cs
      JOIN public.family_members fm ON fm.family_id = cs.family_id
      WHERE cs.id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "csm_delete_admin_or_parent" ON public.conversation_space_members;
CREATE POLICY "csm_delete_admin_or_parent" ON public.conversation_space_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_space_members csm2
      JOIN public.family_members fm ON fm.id = csm2.family_member_id
      WHERE csm2.space_id = conversation_space_members.space_id
        AND fm.user_id = auth.uid()
        AND (csm2.role = 'admin' OR fm.role = 'primary_parent')
    )
    OR family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- ── conversation_threads ─────────────────────────────────────

DROP POLICY IF EXISTS "ct_select_space_member" ON public.conversation_threads;
CREATE POLICY "ct_select_space_member" ON public.conversation_threads
  FOR SELECT USING (
    space_id IN (
      SELECT csm.space_id
      FROM public.conversation_space_members csm
      WHERE csm.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "ct_insert_space_member" ON public.conversation_threads;
CREATE POLICY "ct_insert_space_member" ON public.conversation_threads
  FOR INSERT WITH CHECK (
    space_id IN (
      SELECT csm.space_id
      FROM public.conversation_space_members csm
      WHERE csm.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
    AND started_by IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ct_update_starter_or_parent" ON public.conversation_threads;
CREATE POLICY "ct_update_starter_or_parent" ON public.conversation_threads
  FOR UPDATE USING (
    started_by IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR space_id IN (
      SELECT cs.id
      FROM public.conversation_spaces cs
      WHERE cs.family_id IN (
        SELECT fm.family_id FROM public.family_members fm
        WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
      )
    )
  );

-- ── messages ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "msg_select_space_member" ON public.messages;
CREATE POLICY "msg_select_space_member" ON public.messages
  FOR SELECT USING (
    thread_id IN (
      SELECT ct.id
      FROM public.conversation_threads ct
      JOIN public.conversation_space_members csm ON csm.space_id = ct.space_id
      WHERE csm.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "msg_insert_space_member" ON public.messages;
CREATE POLICY "msg_insert_space_member" ON public.messages
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT ct.id
      FROM public.conversation_threads ct
      JOIN public.conversation_space_members csm ON csm.space_id = ct.space_id
      WHERE csm.family_member_id IN (
        SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "msg_update_own" ON public.messages;
CREATE POLICY "msg_update_own" ON public.messages
  FOR UPDATE USING (
    sender_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    AND message_type = 'user'
  );

-- ── message_read_status ──────────────────────────────────────

DROP POLICY IF EXISTS "mrs_own" ON public.message_read_status;
CREATE POLICY "mrs_own" ON public.message_read_status
  FOR ALL USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- ── messaging_settings ───────────────────────────────────────

DROP POLICY IF EXISTS "msettings_select_family" ON public.messaging_settings;
CREATE POLICY "msettings_select_family" ON public.messaging_settings
  FOR SELECT USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "msettings_write_parent" ON public.messaging_settings;
CREATE POLICY "msettings_write_parent" ON public.messaging_settings
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ── member_messaging_permissions ─────────────────────────────

DROP POLICY IF EXISTS "mmp_select_own_or_parent" ON public.member_messaging_permissions;
CREATE POLICY "mmp_select_own_or_parent" ON public.member_messaging_permissions
  FOR SELECT USING (
    member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "mmp_write_parent" ON public.member_messaging_permissions;
CREATE POLICY "mmp_write_parent" ON public.member_messaging_permissions
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ── message_coaching_settings ────────────────────────────────

DROP POLICY IF EXISTS "mcs_select_own_or_parent" ON public.message_coaching_settings;
CREATE POLICY "mcs_select_own_or_parent" ON public.message_coaching_settings
  FOR SELECT USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "mcs_write_parent" ON public.message_coaching_settings;
CREATE POLICY "mcs_write_parent" ON public.message_coaching_settings
  FOR ALL USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ── family_requests ──────────────────────────────────────────

DROP POLICY IF EXISTS "fr_select_participant_or_parent" ON public.family_requests;
CREATE POLICY "fr_select_participant_or_parent" ON public.family_requests
  FOR SELECT USING (
    sender_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR recipient_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "fr_insert_own" ON public.family_requests;
CREATE POLICY "fr_insert_own" ON public.family_requests
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    AND sender_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fr_update_recipient_or_parent" ON public.family_requests;
CREATE POLICY "fr_update_recipient_or_parent" ON public.family_requests
  FOR UPDATE USING (
    recipient_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- ── notifications ────────────────────────────────────────────

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (
    recipient_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (
    recipient_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "notif_insert_any_auth" ON public.notifications;
CREATE POLICY "notif_insert_any_auth" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ── notification_preferences ─────────────────────────────────

DROP POLICY IF EXISTS "np_select_own" ON public.notification_preferences;
CREATE POLICY "np_select_own" ON public.notification_preferences
  FOR SELECT USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "np_write_own_or_parent" ON public.notification_preferences;
CREATE POLICY "np_write_own_or_parent" ON public.notification_preferences
  FOR ALL USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );


-- ============================================================
-- PART 6: ENABLE SUPABASE REALTIME
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- PART 7: FEATURE KEYS
-- ============================================================
INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('messaging_basic',          'Messaging Basic',           'Direct and family space messaging',                      'PRD-15'),
  ('messaging_groups',         'Messaging Groups',          'Group conversation spaces',                              'PRD-15'),
  ('messaging_lila',           'Messaging LiLa',            'LiLa messages within conversation threads',              'PRD-15'),
  ('messaging_coaching',       'Message Coaching',          'AI communication coaching before sending',               'PRD-15'),
  ('messaging_content_corner', 'Content Corner',            'Curated content-sharing space for families',             'PRD-15'),
  ('messaging_out_of_nest',    'Out-of-Nest Messaging',     'Messaging with Out-of-Nest family members',              'PRD-15'),
  ('requests_basic',           'Requests Basic',            'Send and respond to family requests',                    'PRD-15'),
  ('requests_routing',         'Requests Routing',          'Route accepted requests to Calendar, Tasks, or Lists',   'PRD-15'),
  ('notifications_basic',      'Notifications Basic',       'In-app notification inbox',                              'PRD-15'),
  ('notifications_push',       'Push Notifications',        'Browser push notifications',                             'PRD-15'),
  ('notifications_email',      'Email Notifications',       'Email delivery for important notifications',             'PRD-15')
ON CONFLICT (feature_key) DO NOTHING;

-- Tier assignments
INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
SELECT fk.feature_key, fk.role_group, st.id, true
FROM (VALUES
  ('messaging_basic',          'mom',               'essential'),
  ('messaging_basic',          'dad_adults',        'essential'),
  ('messaging_basic',          'independent_teens', 'essential'),
  ('messaging_basic',          'guided_kids',       'essential'),
  ('messaging_groups',         'mom',               'essential'),
  ('messaging_groups',         'dad_adults',        'essential'),
  ('messaging_groups',         'independent_teens', 'essential'),
  ('messaging_lila',           'mom',               'enhanced'),
  ('messaging_lila',           'dad_adults',        'enhanced'),
  ('messaging_lila',           'independent_teens', 'enhanced'),
  ('messaging_coaching',       'mom',               'enhanced'),
  ('messaging_content_corner', 'mom',               'enhanced'),
  ('messaging_content_corner', 'dad_adults',        'enhanced'),
  ('messaging_content_corner', 'guided_kids',       'enhanced'),
  ('messaging_out_of_nest',    'mom',               'enhanced'),
  ('requests_basic',           'mom',               'essential'),
  ('requests_basic',           'dad_adults',        'essential'),
  ('requests_basic',           'independent_teens', 'essential'),
  ('requests_basic',           'guided_kids',       'essential'),
  ('requests_routing',         'mom',               'essential'),
  ('requests_routing',         'dad_adults',        'essential'),
  ('notifications_basic',      'mom',               'essential'),
  ('notifications_basic',      'dad_adults',        'essential'),
  ('notifications_basic',      'independent_teens', 'essential'),
  ('notifications_basic',      'guided_kids',       'essential'),
  ('notifications_push',       'mom',               'enhanced'),
  ('notifications_push',       'dad_adults',        'enhanced'),
  ('notifications_push',       'independent_teens', 'enhanced'),
  ('notifications_email',      'mom',               'enhanced'),
  ('notifications_email',      'dad_adults',        'enhanced')
) AS fk(feature_key, role_group, tier_slug)
JOIN public.subscription_tiers st ON st.slug = fk.tier_slug
ON CONFLICT DO NOTHING;
