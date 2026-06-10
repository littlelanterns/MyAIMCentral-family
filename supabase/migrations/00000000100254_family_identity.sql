-- ============================================================================
-- Migration: Family identity (Family-Auth-Two-Door, Phase 3 foundation)
-- ============================================================================
-- Founder Decision 12 (2026-06-09): each family gets a FIRST-CLASS "Family"
-- identity — a per-family shadow auth account ({family_id}@family.myaimcentral.app)
-- plus a hidden family_members row with role='family'. This is deliberate
-- architecture, not an RLS workaround: the Family identity gets its own
-- permission scope, and future hub configuration (mom adding hub widgets,
-- hub theming) hangs off this identity rather than mom's account.
--
-- The hidden row makes every existing family-scoped RLS policy work for the
-- family session without a policy rewrite (get_my_family_id() resolves via
-- family_members.user_id = auth.uid()).
--
-- Hidden-row guards in this migration:
--   (a) role CHECK constraint gains 'family'
--   (b) auto-provision trigger skips role='family' (no archive folders,
--       no dashboard_config, no rhythms, no sticker book for the identity row)
--   (c) handle_new_user skips @family.myaimcentral.app auth accounts
--       (no phantom family creation — mirrors the @pin skip)
--   (d) dashboard_enabled=false keeps it out of get_family_login_members /
--       verify_family_login member tiles (both filter dashboard_enabled=true)
--   App-layer roster sweeps (member pickers etc.) are handled in code.
--
-- The shadow auth account itself is created by the family-auth-admin Edge
-- Function (service role) — auth.users writes cannot happen from SQL here.
--
-- Idempotent throughout.
-- Build file: .claude/rules/current-builds/family-auth-two-door.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. role CHECK constraint gains 'family'
-- ----------------------------------------------------------------------------
ALTER TABLE public.family_members
  DROP CONSTRAINT IF EXISTS family_members_role_check;

ALTER TABLE public.family_members
  ADD CONSTRAINT family_members_role_check
  CHECK (role IN ('primary_parent', 'additional_adult', 'special_adult', 'member', 'family'));

-- ----------------------------------------------------------------------------
-- 2. Auto-provision trigger skips the family identity row
--    (guard at trigger level — function body untouched)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_fm_auto_provision ON public.family_members;
CREATE TRIGGER trg_fm_auto_provision
  AFTER INSERT ON public.family_members
  FOR EACH ROW
  WHEN (NEW.role <> 'family')
  EXECUTE FUNCTION public.auto_provision_member_resources();

-- ----------------------------------------------------------------------------
-- 3. handle_new_user skips @family shadow accounts (mirrors @pin skip)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_member_id UUID;
  tier_id UUID;
  user_name TEXT;
  user_tz TEXT;
BEGIN
  -- Skip auto-family creation for shadow auth accounts:
  -- {member_id}@pin.myaimcentral.app (member PIN sessions) and
  -- {family_id}@family.myaimcentral.app (family identity sessions)
  IF NEW.email LIKE '%@pin.myaimcentral.app'
     OR NEW.email LIKE '%@family.myaimcentral.app' THEN
    RETURN NEW;
  END IF;

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
    'adult',
    'self',
    'full_login',
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

-- ----------------------------------------------------------------------------
-- 4. ensure_family_member_identity — idempotent upsert of the hidden row.
--    Called by the family-auth-admin Edge Function (service role only) after
--    it creates/finds the shadow auth account.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_family_member_identity(
  p_family_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT id INTO v_member_id
  FROM public.family_members
  WHERE family_id = p_family_id AND role = 'family'
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    -- Keep the auth linkage current (kill-switch rotations keep the same
    -- auth user, but repair drift if the account was ever recreated)
    UPDATE public.family_members
    SET user_id = p_user_id, is_active = true
    WHERE id = v_member_id AND (user_id IS DISTINCT FROM p_user_id OR is_active = false);
    RETURN v_member_id;
  END IF;

  INSERT INTO public.family_members (
    family_id, user_id, display_name, role, dashboard_mode,
    relationship, auth_method, dashboard_enabled, in_household, is_active
  )
  VALUES (
    p_family_id, p_user_id, 'Family', 'family', 'adult',
    'family', NULL, false, false, true
  )
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

-- Service role only — never callable from clients
REVOKE EXECUTE ON FUNCTION public.ensure_family_member_identity(UUID, UUID) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.ensure_family_member_identity(UUID, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 5. admin_set_family_password — service-only hash writer for the
--    family-auth-admin Edge Function (which is the canonical set/change path:
--    it updates the hash AND rotates the shadow auth account in one step).
--    The public set_family_password RPC remains for transitional clients but
--    new code should call the Edge Function.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_family_password(
  p_family_id UUID,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Strength: min 8 chars, at least one letter and one number
  IF p_password IS NULL
     OR length(p_password) < 8
     OR p_password !~ '[a-zA-Z]'
     OR p_password !~ '[0-9]' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'weak_password');
  END IF;

  UPDATE public.families
  SET family_password_hash = crypt(p_password, gen_salt('bf')),
      family_password_failed_attempts = 0,
      family_password_locked_until = NULL,
      updated_at = now()
  WHERE id = p_family_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'family_not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_family_password(UUID, TEXT) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.admin_set_family_password(UUID, TEXT) TO service_role;
