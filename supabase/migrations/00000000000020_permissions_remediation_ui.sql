-- ============================================================================
-- Permissions Remediation — PRD-02 UI Gaps
-- PIN lockout (server-side), default permission auto-creation
-- ============================================================================

-- ── PIN Lockout columns ───────────────────────────────────────────────

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- ── Replace verify_member_pin with JSONB-returning version ────────────
-- Old: returned BOOLEAN
-- New: returns JSONB with success/reason/attempts_remaining/locked_until
-- Must DROP first because return type changed
DROP FUNCTION IF EXISTS public.verify_member_pin(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_member_pin(p_member_id UUID, p_pin TEXT)
RETURNS JSONB AS $$
DECLARE
  stored_hash TEXT;
  failed_count INTEGER;
  lock_time TIMESTAMPTZ;
  is_valid BOOLEAN;
BEGIN
  SELECT pin_hash, pin_failed_attempts, pin_locked_until
  INTO stored_hash, failed_count, lock_time
  FROM public.family_members
  WHERE id = p_member_id AND is_active = true;

  IF stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF lock_time IS NOT NULL AND lock_time > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'locked_until', lock_time,
      'remaining_seconds', EXTRACT(EPOCH FROM (lock_time - now()))::integer
    );
  END IF;

  is_valid := stored_hash = crypt(p_pin, stored_hash);

  IF is_valid THEN
    UPDATE public.family_members
    SET pin_failed_attempts = 0, pin_locked_until = NULL
    WHERE id = p_member_id;
    RETURN jsonb_build_object('success', true);
  ELSE
    failed_count := COALESCE(failed_count, 0) + 1;
    IF failed_count >= 5 THEN
      UPDATE public.family_members
      SET pin_failed_attempts = failed_count,
          pin_locked_until = now() + interval '15 minutes'
      WHERE id = p_member_id;
      RETURN jsonb_build_object(
        'success', false, 'reason', 'locked',
        'locked_until', (now() + interval '15 minutes'),
        'remaining_seconds', 900
      );
    ELSE
      UPDATE public.family_members
      SET pin_failed_attempts = failed_count
      WHERE id = p_member_id;
      RETURN jsonb_build_object(
        'success', false, 'reason', 'invalid',
        'attempts_remaining', 5 - failed_count
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Default permission auto-creation for additional adults ────────────
-- Uses role='member' (4-value model from schema remediation batch 2)

CREATE OR REPLACE FUNCTION public.auto_create_adult_permissions()
RETURNS TRIGGER AS $$
DECLARE
  v_primary_parent_id UUID;
BEGIN
  IF NEW.role = 'additional_adult' THEN
    SELECT id INTO v_primary_parent_id
    FROM public.family_members
    WHERE family_id = NEW.family_id
      AND role = 'primary_parent'
      AND is_active = true
    LIMIT 1;

    IF v_primary_parent_id IS NULL THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      NEW.family_id,
      v_primary_parent_id,
      NEW.id,
      child.id,
      feat.key,
      'view'
    FROM public.family_members child
    CROSS JOIN (VALUES
      ('tasks_basic'), ('calendar_basic'), ('messaging_basic'),
      ('lists_basic'), ('victory_recorder_basic'), ('family_hub')
    ) AS feat(key)
    WHERE child.family_id = NEW.family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fm_auto_permissions ON public.family_members;
CREATE TRIGGER trg_fm_auto_permissions
  AFTER INSERT ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_adult_permissions();

-- ============================================================================
-- Done
-- ============================================================================
