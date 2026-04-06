-- ============================================================================
-- PRD-09A/09B Fixes:
--   1. Server-side cron job for task claim lock expiration (hourly)
--   2. Auto-provision Backburner & Ideas lists for new members
-- ============================================================================

-- ============================================================
-- Fix 1: Expire overdue task claims via pg_cron
-- Existing client-side useExpireOverdueClaims is kept as backup.
-- Cron runs hourly to catch expired claims.
-- Uses status='released' to match existing client-side behavior.
-- No grace period (matches existing client-side logic).
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_overdue_task_claims()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.task_claims
  SET status = 'released',
      released = true,
      released_at = now()
  WHERE status = 'claimed'
    AND completed = false
    AND released = false
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

-- Schedule hourly (claims can expire at any time, not just midnight)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove if already scheduled (idempotent)
    BEGIN
      PERFORM cron.unschedule('expire-overdue-task-claims');
    EXCEPTION WHEN OTHERS THEN
      -- Job doesn't exist yet, that's fine
    END;

    PERFORM cron.schedule(
      'expire-overdue-task-claims',
      '0 * * * *',
      'SELECT public.expire_overdue_task_claims()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping claim expiration scheduling';
END;
$outer$;

-- ============================================================
-- Fix 2: Auto-provision Backburner & Ideas lists for new members
-- Updated auto_provision_member_resources trigger to create
-- system Backburner and Ideas lists for non-Guided/Play members.
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_provision_member_resources()
RETURNS TRIGGER AS $$
DECLARE
  dash_type TEXT;
BEGIN
  -- 1. Create personal archive folder
  INSERT INTO public.archive_folders (family_id, member_id, folder_name, folder_type)
  VALUES (NEW.family_id, NEW.id, NEW.display_name || '''s Archives', 'family_member')
  ON CONFLICT DO NOTHING;

  -- 2. Create dashboard_config if member has a dashboard
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

  -- 3. Create Backburner & Ideas lists for non-Guided/Play members
  IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
    -- Backburner list (idempotent: skip if already exists)
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

    -- Ideas list (idempotent: skip if already exists)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: Create Backburner & Ideas lists for existing eligible members
-- who don't already have them
INSERT INTO public.lists (family_id, owner_id, title, list_type)
SELECT fm.family_id, fm.id, 'Backburner', 'backburner'
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.lists l
    WHERE l.family_id = fm.family_id
      AND l.owner_id = fm.id
      AND l.list_type = 'backburner'
      AND l.archived_at IS NULL
  );

INSERT INTO public.lists (family_id, owner_id, title, list_type)
SELECT fm.family_id, fm.id, 'Ideas', 'ideas'
FROM public.family_members fm
WHERE (fm.dashboard_mode IS NULL OR fm.dashboard_mode NOT IN ('guided', 'play'))
  AND fm.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.lists l
    WHERE l.family_id = fm.family_id
      AND l.owner_id = fm.id
      AND l.list_type = 'ideas'
      AND l.archived_at IS NULL
  );
