-- ============================================================================
-- PRD-01 REPAIR MIGRATION
-- Fixes audit findings for Auth & Family Setup
-- ============================================================================
-- Issues addressed:
--   1. handle_new_user trigger: dashboard_mode NULL → 'adult'
--   2. Column renames: login_method → auth_method, visual_password → visual_password_config
--   3. feature_access_v2 documented as correct (no change needed)
--   12. member_emails table (PRD-22 cross-PRD requirement)
--   13. account_deletions table (PRD-22 cross-PRD requirement)
-- ============================================================================

-- ============================================================================
-- SECTION 1: Rename login_method → auth_method
-- ============================================================================

-- Drop the existing CHECK constraint first (constraint name may vary)
DO $$ BEGIN
  -- Try dropping known constraint names
  ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_login_method_check;
  ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_auth_method_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Rename the column
ALTER TABLE public.family_members
  RENAME COLUMN login_method TO auth_method;

-- Map old values to new BEFORE adding CHECK constraint
UPDATE public.family_members SET auth_method = 'full_login' WHERE auth_method = 'email';
UPDATE public.family_members SET auth_method = 'pin' WHERE auth_method = 'visual';
UPDATE public.family_members SET auth_method = 'pin' WHERE auth_method IS NOT NULL AND auth_method NOT IN ('full_login', 'pin', 'visual_password', 'none');

-- Now add the CHECK constraint (all rows should be valid)
ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_auth_method_check
  CHECK (auth_method IN ('full_login', 'pin', 'visual_password', 'none'));

-- ============================================================================
-- SECTION 2: Rename visual_password → visual_password_config
-- ============================================================================

ALTER TABLE public.family_members
  RENAME COLUMN visual_password TO visual_password_config;

-- ============================================================================
-- SECTION 3: Fix handle_new_user trigger — dashboard_mode = 'adult'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Mom');
  user_tz := COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Chicago');

  -- Create family
  INSERT INTO public.families (primary_parent_id, family_name, timezone)
  VALUES (NEW.id, user_name || '''s Family', user_tz)
  RETURNING id INTO new_family_id;

  -- Create primary parent member with PRD-01 required defaults
  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled, in_household
  )
  VALUES (
    new_family_id, NEW.id, user_name, 'primary_parent',
    'adult',        -- PRD-01: must be 'adult', NOT NULL
    'self',         -- PRD-01: relationship = 'self' for primary parent
    'full_login',   -- PRD-01: auth_method = 'full_login' (renamed from login_method='email')
    true, true
  )
  RETURNING id INTO new_member_id;

  -- Create subscription (Essential tier default)
  SELECT id INTO tier_id FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;

  IF tier_id IS NOT NULL THEN
    INSERT INTO public.family_subscriptions (family_id, tier_id, status)
    VALUES (new_family_id, tier_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: Fix get_family_login_members — use auth_method column name
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_family_login_members(UUID);

CREATE OR REPLACE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  auth_method TEXT,
  member_color TEXT,
  dashboard_mode TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fm.id,
    fm.display_name,
    fm.avatar_url,
    fm.auth_method,
    fm.member_color,
    fm.dashboard_mode
  FROM public.family_members fm
  WHERE fm.family_id = p_family_id
    AND fm.is_active = true
    AND fm.dashboard_enabled = true
  ORDER BY
    CASE fm.role
      WHEN 'primary_parent' THEN 1
      WHEN 'additional_adult' THEN 2
      WHEN 'special_adult' THEN 3
      WHEN 'member' THEN
        CASE fm.dashboard_mode
          WHEN 'adult' THEN 4
          WHEN 'independent' THEN 5
          WHEN 'guided' THEN 6
          WHEN 'play' THEN 7
          ELSE 8
        END
      ELSE 9
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: Fix accept_family_invite — use auth_method column name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_member RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  -- Find the member with this token
  SELECT * INTO v_member
  FROM public.family_members
  WHERE invite_token = p_token
    AND invite_status = 'pending'
    AND (invite_expires_at IS NULL OR invite_expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_or_expired_token');
  END IF;

  -- Link the auth user to this family member
  UPDATE public.family_members
  SET
    user_id = v_user_id,
    invite_status = 'accepted',
    auth_method = 'full_login',
    invite_token = NULL
  WHERE id = v_member.id;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member.id,
    'family_id', v_member.family_id,
    'display_name', v_member.display_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 6: Create member_emails table (PRD-22 cross-PRD requirement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_me2_member ON public.member_emails(family_member_id);
CREATE INDEX IF NOT EXISTS idx_me2_email ON public.member_emails(email);

ALTER TABLE public.member_emails ENABLE ROW LEVEL SECURITY;

-- Member can manage own emails
CREATE POLICY "member_emails_own_read" ON public.member_emails
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "member_emails_own_insert" ON public.member_emails
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- Primary parent can read children's emails
CREATE POLICY "member_emails_parent_read" ON public.member_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.families f ON f.id = fm.family_id
      WHERE fm.id = member_emails.family_member_id
        AND f.primary_parent_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 7: Create account_deletions table (PRD-22 cross-PRD requirement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id),
  requested_by UUID NOT NULL REFERENCES public.family_members(id),
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('family', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  grace_period_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ad_family ON public.account_deletions(family_id);
CREATE INDEX IF NOT EXISTS idx_ad_status ON public.account_deletions(status);
CREATE INDEX IF NOT EXISTS idx_ad_scheduled ON public.account_deletions(scheduled_for)
  WHERE status = 'pending';

ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;

-- Primary parent can manage
CREATE POLICY "account_deletions_parent_manage" ON public.account_deletions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.families
      WHERE id = account_deletions.family_id
        AND primary_parent_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 8: process_expired_deletions function (daily scheduled job)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_expired_deletions()
RETURNS void AS $$
DECLARE
  v_deletion RECORD;
BEGIN
  -- Find all pending deletions past their scheduled date
  FOR v_deletion IN
    SELECT * FROM public.account_deletions
    WHERE status = 'pending'
      AND scheduled_for <= now()
  LOOP
    IF v_deletion.deletion_type = 'family' THEN
      -- Family deletion: deactivate all members, mark family inactive
      UPDATE public.family_members
      SET is_active = false
      WHERE family_id = v_deletion.family_id;

      -- Note: actual hard deletion of data is a future enhancement.
      -- For now, soft-deactivate.
    ELSIF v_deletion.deletion_type = 'member' THEN
      -- Member deletion: deactivate only the requesting member
      UPDATE public.family_members
      SET is_active = false
      WHERE id = v_deletion.requested_by;
    END IF;

    -- Mark deletion as completed
    UPDATE public.account_deletions
    SET status = 'completed', completed_at = now()
    WHERE id = v_deletion.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily execution via pg_cron (if available)
-- Note: pg_cron scheduling must be done via Supabase dashboard or
-- a separate migration that runs with superuser privileges.
-- SELECT cron.schedule('process-expired-deletions', '0 3 * * *',
--   'SELECT public.process_expired_deletions()');

-- ============================================================================
-- SECTION 9: Fix existing primary_parent records with NULL dashboard_mode
-- ============================================================================

UPDATE public.family_members
SET dashboard_mode = 'adult'
WHERE role = 'primary_parent'
  AND dashboard_mode IS NULL;
