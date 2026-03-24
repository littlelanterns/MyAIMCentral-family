-- ============================================================================
-- Family Setup Remediation
-- - Enable pgcrypto for server-side PIN hashing
-- - Create archive_folders table (needed for auto-provisioning; full feature in Phase 13)
-- - Create hash_member_pin RPC (replaces plain-text PIN storage)
-- - Create auto-provision trigger on family_members INSERT
--   (creates archive folder + dashboard_config for each new member)
-- ============================================================================

-- ============================================================
-- Enable pgcrypto for password/PIN hashing
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- archive_folders table (PRD-13, created early for auto-provisioning)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.archive_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.archive_folders(id),
  folder_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_af_family ON public.archive_folders(family_id);
CREATE INDEX IF NOT EXISTS idx_af_parent ON public.archive_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_af_member ON public.archive_folders(member_id);

CREATE TRIGGER trg_af_updated_at
  BEFORE UPDATE ON public.archive_folders
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE public.archive_folders ENABLE ROW LEVEL SECURITY;

-- RLS: Family members can read own family. Primary parent can manage.
CREATE POLICY "af_select_own_family" ON public.archive_folders
  FOR SELECT USING (
    family_id = public.get_my_family_id()
  );

CREATE POLICY "af_manage_primary_parent" ON public.archive_folders
  FOR ALL USING (
    family_id IN (SELECT id FROM public.families WHERE primary_parent_id = auth.uid())
  );

-- ============================================================
-- hash_member_pin RPC — hashes and stores a PIN using pgcrypto
-- ============================================================
CREATE OR REPLACE FUNCTION public.hash_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  caller_family_id UUID;
  member_family_id UUID;
BEGIN
  -- Verify caller is primary parent of the member's family
  SELECT family_id INTO caller_family_id
  FROM public.families
  WHERE primary_parent_id = auth.uid();

  SELECT family_id INTO member_family_id
  FROM public.family_members
  WHERE id = p_member_id;

  IF caller_family_id IS NULL OR caller_family_id != member_family_id THEN
    RAISE EXCEPTION 'Only the primary parent can set PINs';
  END IF;

  -- Validate PIN format: exactly 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;

  -- Hash with pgcrypto bf (bcrypt) and store
  UPDATE public.family_members
  SET pin_hash = crypt(p_pin, gen_salt('bf', 8)),
      login_method = 'pin'
  WHERE id = p_member_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Update verify_member_pin to work with pgcrypto hashes
-- (Already uses crypt() comparison — just ensure it works)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM public.family_members
  WHERE id = p_member_id AND is_active = true;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  -- pgcrypto: crypt(input, stored_hash) re-hashes with the same salt
  -- and returns the same hash if the input matches
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Auto-provision resources when a new family member is created
-- Creates: archive folder + dashboard_config
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS TRIGGER AS $$
DECLARE
  dash_type TEXT;
BEGIN
  -- 1. Create personal archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'family_member');

  -- 2. Create dashboard_config if member has a dashboard
  IF NEW.dashboard_enabled IS NOT false THEN
    -- Determine dashboard type from dashboard_mode
    IF NEW.dashboard_mode = 'play' THEN
      dash_type := 'play';
    ELSIF NEW.dashboard_mode = 'guided' THEN
      dash_type := 'guided';
    ELSE
      dash_type := 'personal';
    END IF;

    -- Only create if one doesn't already exist
    INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
    VALUES (NEW.family_id, NEW.id, dash_type)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_fm_auto_provision
  AFTER INSERT ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.auto_provision_member_resources();

-- ============================================================
-- Also create archive folder + dashboard_config for existing
-- primary parents who don't have them yet
-- ============================================================
INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
SELECT fm.family_id, fm.id, fm.display_name || '''s Archives', 'family_member'
FROM public.family_members fm
WHERE NOT EXISTS (
  SELECT 1 FROM public.archive_folders af
  WHERE af.member_id = fm.id AND af.folder_type = 'family_member'
);

INSERT INTO public.dashboard_configs (family_id, family_member_id, dashboard_type)
SELECT fm.family_id, fm.id, 'personal'
FROM public.family_members fm
WHERE fm.role = 'primary_parent'
  AND NOT EXISTS (
    SELECT 1 FROM public.dashboard_configs dc
    WHERE dc.family_member_id = fm.id
  );
