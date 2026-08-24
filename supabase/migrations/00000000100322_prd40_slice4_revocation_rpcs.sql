-- ============================================================================
-- PRD-40: COPPA Compliance — Slice 4 (Rights + Lifecycle), Part 1
-- ============================================================================
-- Two SECURITY DEFINER RPCs implementing Screen 9 (Revocation Flow):
--   1. revoke_coppa_consent(child_member_id, reason) — atomically sets
--      coppa_consents.revoked_at/scheduled_deletion_at/revocation_reason AND
--      family_members.is_suspended_for_deletion = true, in one transaction.
--      The 14-day grace period math (revoked_at + interval '14 days') is
--      server-derived (Convention #257 discipline extended to TIMESTAMPTZ
--      math — never client-computed).
--   2. undo_coppa_revocation(child_member_id) — the mirror: clears the three
--      revocation fields + is_suspended_for_deletion, ONLY while still inside
--      the grace window (deletion_completed_at IS NULL). Once the cascade has
--      run, undo is impossible — matches the PRD's "after that, deletion is
--      permanent and cannot be undone."
--
-- Why two RPCs instead of relying on the existing coppa_consents column-level
-- GRANT (migration 100305) plus a direct family_members UPDATE: the two
-- writes (coppa_consents + family_members) must happen ATOMICALLY — a mom
-- session doing them as two separate client calls could revoke consent but
-- fail to suspend the member (or vice versa) on a network hiccup, leaving an
-- inconsistent state Screen 8 would render incorrectly. SECURITY DEFINER +
-- one transaction removes that failure mode entirely.
--
-- Authorization (Convention #280, from birth — the 100298/100300/100315
-- standing law): resolved BEFORE any read or write. Mom's REAL session only
-- (R-10) — caller must be authenticated AND an active family_members row
-- with role='primary_parent'. Family-shadow sessions (role='family') and
-- member-shadow sessions both fail this check. View-As does not change
-- auth.uid(), so "unavailable inside View-As" stays a frontend-layer
-- restriction (Slice 4's UI gates on ViewAsProvider, same as Slice 3).
--
-- Type-to-confirm (PRD Screen 9 Step 2) is a FRONTEND-only UX gate — the
-- child's name match happens in the React component before this RPC is ever
-- called. The RPC does not re-verify the typed name (it has no way to know
-- what mom typed; the gate's purpose is slowing mom down, not authorization).
--
-- Idempotent: safe to re-run (CREATE OR REPLACE, DO $$ EXCEPTION guards).
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. revoke_coppa_consent
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.revoke_coppa_consent(p_child_member_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid              UUID;
  v_parent_member_id UUID;
  v_family_id        UUID;
  v_child_family     UUID;
  v_consent_id       UUID;
  v_scheduled_for    TIMESTAMPTZ;
BEGIN
  -- ── Authorization gate FIRST (Convention #280 / R-10) ──────────────────
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fm.id, fm.family_id INTO v_parent_member_id, v_family_id
  FROM public.family_members fm
  WHERE fm.user_id = v_uid
    AND fm.role = 'primary_parent'
    AND fm.is_active = true
  LIMIT 1;

  IF v_parent_member_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- ── Target must be an active under-13 child in the caller's own family ─
  SELECT fm.family_id INTO v_child_family
  FROM public.family_members fm
  WHERE fm.id = p_child_member_id AND fm.is_active = true;

  IF v_child_family IS NULL OR v_child_family <> v_family_id THEN
    RAISE EXCEPTION 'invalid_member: child not found in your family';
  END IF;

  -- ── Must have an active consent to revoke ───────────────────────────────
  SELECT cc.id INTO v_consent_id
  FROM public.coppa_consents cc
  WHERE cc.child_member_id = p_child_member_id
    AND cc.revoked_at IS NULL
    AND cc.superseded_at IS NULL
  LIMIT 1;

  IF v_consent_id IS NULL THEN
    RAISE EXCEPTION 'no_active_consent: nothing to revoke for this child';
  END IF;

  v_scheduled_for := now() + interval '14 days';

  UPDATE public.coppa_consents
  SET revoked_at = now(),
      scheduled_deletion_at = v_scheduled_for,
      revocation_reason = p_reason
  WHERE id = v_consent_id;

  UPDATE public.family_members
  SET is_suspended_for_deletion = true
  WHERE id = p_child_member_id;

  -- In-app confirmation (OD-3: email lands once PRD-30 SM-C's shared sender
  -- exists; until then this in-app notification is the confirmation channel
  -- — category 'privacy' per decision file R-4, normal priority, never
  -- DND-bypassing per Convention #143's severity-tiered precedent).
  INSERT INTO public.notifications (family_id, recipient_member_id, notification_type, category, title, body, priority)
  SELECT v_family_id, v_parent_member_id, 'coppa_consent_revoked', 'privacy',
    'Consent revoked',
    'You revoked consent for ' || fm.display_name || '. Their data will be permanently deleted on ' ||
      to_char(v_scheduled_for, 'FMMonth FMDD, YYYY') || ' unless you undo this in Settings -> Privacy & Consent.',
    'normal'
  FROM public.family_members fm WHERE fm.id = p_child_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'consent_id', v_consent_id,
    'revoked_at', now(),
    'scheduled_deletion_at', v_scheduled_for
  );
END;
$$;

COMMENT ON FUNCTION public.revoke_coppa_consent(UUID, TEXT) IS
  'PRD-40 Slice 4, Screen 9 Step 2. Atomically revokes a child''s COPPA consent (14-day grace) and suspends the member. Mom''s real session only (R-10).';

REVOKE EXECUTE ON FUNCTION public.revoke_coppa_consent(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_coppa_consent(UUID, TEXT) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. undo_coppa_revocation
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.undo_coppa_revocation(p_child_member_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid              UUID;
  v_parent_member_id UUID;
  v_family_id        UUID;
  v_child_family     UUID;
  v_consent_id       UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fm.id, fm.family_id INTO v_parent_member_id, v_family_id
  FROM public.family_members fm
  WHERE fm.user_id = v_uid
    AND fm.role = 'primary_parent'
    AND fm.is_active = true
  LIMIT 1;

  IF v_parent_member_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fm.family_id INTO v_child_family
  FROM public.family_members fm
  WHERE fm.id = p_child_member_id AND fm.is_active = true;

  IF v_child_family IS NULL OR v_child_family <> v_family_id THEN
    RAISE EXCEPTION 'invalid_member: child not found in your family';
  END IF;

  -- Must be revoked AND still inside the grace window (deletion_completed_at
  -- IS NULL). Once the cascade has run, this row is permanently NOT FOUND —
  -- matches the PRD's "after that, deletion is permanent and cannot be undone."
  SELECT cc.id INTO v_consent_id
  FROM public.coppa_consents cc
  WHERE cc.child_member_id = p_child_member_id
    AND cc.revoked_at IS NOT NULL
    AND cc.deletion_completed_at IS NULL
  ORDER BY cc.revoked_at DESC
  LIMIT 1;

  IF v_consent_id IS NULL THEN
    RAISE EXCEPTION 'no_revocation_to_undo: nothing pending, or the grace window has already closed';
  END IF;

  UPDATE public.coppa_consents
  SET revoked_at = NULL,
      scheduled_deletion_at = NULL,
      revocation_reason = NULL
  WHERE id = v_consent_id;

  UPDATE public.family_members
  SET is_suspended_for_deletion = false
  WHERE id = p_child_member_id;

  INSERT INTO public.notifications (family_id, recipient_member_id, notification_type, category, title, body, priority)
  SELECT v_family_id, v_parent_member_id, 'coppa_revocation_undone', 'privacy',
    'Revocation undone',
    fm.display_name || '''s data is safe -- nothing was deleted, and their consent is active again.',
    'normal'
  FROM public.family_members fm WHERE fm.id = p_child_member_id;

  RETURN jsonb_build_object('success', true, 'consent_id', v_consent_id);
END;
$$;

COMMENT ON FUNCTION public.undo_coppa_revocation(UUID) IS
  'PRD-40 Slice 4, Screen 9 Undo. Reverses an in-grace-period revocation atomically. Fails once the deletion cascade has run (deletion_completed_at set) or once the grace window has closed. Mom''s real session only (R-10).';

REVOKE EXECUTE ON FUNCTION public.undo_coppa_revocation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_coppa_revocation(UUID) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Notification type additions — documented, not CHECK-constrained
--    (decision file R-4 confirmed notifications.category is a bare TEXT
--    column with no CHECK; same for notification_type). No schema change
--    needed. Recorded here for discoverability.
-- ──────────────────────────────────────────────────────────────────────────

-- New notification_type values used by this migration + Slice 4's Edge
-- Functions, category='privacy' throughout:
--   coppa_consent_revoked, coppa_revocation_undone (this file)
--   coppa_export_ready (coppa-export-child-data Edge Function)
--   coppa_deletion_completed (coppa-deletion-cascade Edge Function)
--   coppa_age_transition (age-transition daily job — deferred, see progress log)

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Verification block.
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_revoke_ok BOOLEAN;
  v_undo_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'revoke_coppa_consent' AND p.prosecdef
  ) INTO v_revoke_ok;
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'undo_coppa_revocation' AND p.prosecdef
  ) INTO v_undo_ok;

  IF NOT v_revoke_ok THEN
    RAISE EXCEPTION 'revoke_coppa_consent missing or not SECURITY DEFINER';
  END IF;
  IF NOT v_undo_ok THEN
    RAISE EXCEPTION 'undo_coppa_revocation missing or not SECURITY DEFINER';
  END IF;
  IF has_function_privilege('anon', 'public.revoke_coppa_consent(uuid, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'revoke_coppa_consent must not be executable by anon';
  END IF;
  IF has_function_privilege('anon', 'public.undo_coppa_revocation(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'undo_coppa_revocation must not be executable by anon';
  END IF;

  RAISE NOTICE '[100319] revoke_coppa_consent + undo_coppa_revocation created and gated.';
END $$;

COMMIT;
