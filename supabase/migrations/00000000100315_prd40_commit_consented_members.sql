-- ══════════════════════════════════════════════════════════════════════════
-- PRD-40 COPPA — Slice 3: commit_consented_members RPC (ruling R-13)
--
-- The PRD's Screen 5 says the Stripe webhook "commits the family_members
-- rows that were held in memory" — impossible literally (held rows live in
-- client component state). Ruling R-13: the webhook's job is
-- parent_verifications + attempt logging ONLY. After the client observes
-- the verification row (polling), it calls THIS RPC, which atomically:
--   1. inserts the held family_members rows (whole batch — under-13 AND
--      13+ siblings commit together, per PRD Edge Case "Bulk add with a
--      mix of ages"),
--   2. inserts one coppa_consents row per under-13 child, linked to the
--      verification,
--   3. optionally converts EXISTING members to under_13 (the member-edit
--      "bracket changed to under_13" path, PRD Flows row 3) with their own
--      consent rows,
-- and returns the new member ids so the client resumes the existing
-- post-insert pipeline (hash_member_pin → ensure_pin_shadow_account →
-- auto_provision_member_resources trigger, which fires on INSERT here
-- exactly as it does on the direct-insert path).
--
-- This RPC is the ONLY insert path into coppa_consents — the table has no
-- client INSERT policy BY DESIGN (migration 100305; a bare .insert() 42501s).
--
-- Authorization (Convention #280, from birth — the 100298/100300 standing
-- law): resolved BEFORE any read or write. Mom's REAL session only (R-10):
--   - caller must be authenticated (auth.uid() not null),
--   - caller must be an active family_members row with role='primary_parent'.
-- Family-shadow sessions (role='family', Convention #273) and member shadow
-- sessions (role='member' etc.) fail the primary_parent check. View-As does
-- not change auth.uid(), so "unavailable inside View-As" is a frontend-layer
-- restriction (this slice's UI gates on ViewAsProvider), consistent with the
-- migration 100305 / create-coppa-verification-intent posture.
-- NO service_role branch on purpose — nothing server-side ever needs to
-- commit held members; tests use a real mom session.
--
-- Dormancy gate (R-8, server-side mirror of the UI rule): while the consent
-- template has lawyer_approved_at IS NULL, only founding families
-- (families.is_founding_family) may record consent against it — consent
-- captured against unapproved text is not valid consent for real users.
--
-- Convention #257: consented_at defaults to now() server-side; ip/user_agent
-- are derived from PostgREST request headers server-side, never
-- client-supplied.
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.commit_consented_members(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid                 UUID;
  v_parent_member_id    UUID;
  v_family_id           UUID;
  v_is_founding         BOOLEAN;
  v_verification_id     UUID;
  v_consent_version     TEXT;
  v_ack_sections        TEXT[];
  v_members             JSONB;
  v_existing_ids        UUID[];
  v_required_sections   TEXT[] := ARRAY['what_we_collect','how_lila_uses','who_sees_it','your_rights','parent_affirmation'];
  v_section             TEXT;
  v_lawyer_approved_at  TIMESTAMPTZ;
  v_member              JSONB;
  v_under13_count       INTEGER := 0;
  v_headers             JSONB;
  v_ip                  TEXT;
  v_user_agent          TEXT;
  v_new_member_ids      UUID[] := '{}';
  v_new_members_out     JSONB := '[]'::jsonb;
  v_consent_ids         UUID[] := '{}';
  v_id                  UUID;
  v_consent_id          UUID;
  v_name                TEXT;
  v_role                TEXT;
  v_mode                TEXT;
  v_rel                 TEXT;
  v_bracket             TEXT;
  v_dob                 DATE;
  v_age                 INTEGER;
  v_color               TEXT;
  v_custom_role         TEXT;
  v_existing_id         UUID;
  v_existing_family     UUID;
  v_existing_role       TEXT;
BEGIN
  -- ── Authorization gate FIRST (Convention #280) ─────────────────────────
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

  SELECT f.is_founding_family INTO v_is_founding
  FROM public.families f WHERE f.id = v_family_id;

  -- ── Parse + validate payload ───────────────────────────────────────────
  v_verification_id := (p_payload->>'verification_id')::UUID;
  v_consent_version := p_payload->>'consent_version';
  v_members         := COALESCE(p_payload->'members', '[]'::jsonb);
  v_existing_ids    := COALESCE(
    (SELECT array_agg((e)::UUID) FROM jsonb_array_elements_text(COALESCE(p_payload->'existing_member_ids','[]'::jsonb)) e),
    '{}'::UUID[]
  );

  SELECT COALESCE(array_agg(e), '{}'::TEXT[]) INTO v_ack_sections
  FROM jsonb_array_elements_text(COALESCE(p_payload->'acknowledged_sections','[]'::jsonb)) e;

  IF v_verification_id IS NULL OR v_consent_version IS NULL THEN
    RAISE EXCEPTION 'invalid_payload: verification_id and consent_version are required';
  END IF;
  IF jsonb_typeof(v_members) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid_payload: members must be an array';
  END IF;
  IF jsonb_array_length(v_members) > 30 THEN
    RAISE EXCEPTION 'invalid_payload: too many members in one batch';
  END IF;
  IF jsonb_array_length(v_members) = 0 AND cardinality(v_existing_ids) = 0 THEN
    RAISE EXCEPTION 'invalid_payload: nothing to commit';
  END IF;

  -- All five section keys must have been acknowledged (PRD coppa_consents
  -- spec: "Must contain all required sections at the time of the
  -- consent_version").
  FOREACH v_section IN ARRAY v_required_sections LOOP
    IF NOT (v_section = ANY(v_ack_sections)) THEN
      RAISE EXCEPTION 'invalid_payload: acknowledged_sections is missing %', v_section;
    END IF;
  END LOOP;

  -- ── Verification row: must be the caller's own, and active ─────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.parent_verifications pv
    WHERE pv.id = v_verification_id
      AND pv.parent_member_id = v_parent_member_id
      AND pv.revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'verification_not_active';
  END IF;

  -- ── Template: must exist. Mid-flow retirement is fine (the consent
  --    references the version mom actually saw — PRD edge case), but the
  --    R-8 dormancy gate applies: unapproved text is only consentable by
  --    founding families. ────────────────────────────────────────────────
  SELECT t.lawyer_approved_at INTO v_lawyer_approved_at
  FROM public.coppa_consent_templates t WHERE t.version = v_consent_version;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_consent_version';
  END IF;
  IF v_lawyer_approved_at IS NULL AND COALESCE(v_is_founding, false) = false THEN
    RAISE EXCEPTION 'consent_text_not_approved';
  END IF;

  -- ── Validate each new member + count under-13s ─────────────────────────
  FOR v_member IN SELECT * FROM jsonb_array_elements(v_members) LOOP
    v_name    := btrim(COALESCE(v_member->>'display_name',''));
    v_role    := v_member->>'role';
    v_mode    := v_member->>'dashboard_mode';
    v_rel     := v_member->>'relationship';
    v_bracket := v_member->>'coppa_age_bracket';

    IF v_name = '' THEN
      RAISE EXCEPTION 'invalid_member: display_name is required';
    END IF;
    IF v_role NOT IN ('additional_adult','special_adult','member') THEN
      RAISE EXCEPTION 'invalid_member: role % is not allowed', COALESCE(v_role,'(null)');
    END IF;
    IF v_mode NOT IN ('adult','independent','guided','play') THEN
      RAISE EXCEPTION 'invalid_member: dashboard_mode % is not allowed', COALESCE(v_mode,'(null)');
    END IF;
    IF v_rel NOT IN ('spouse','child','special') THEN
      RAISE EXCEPTION 'invalid_member: relationship % is not allowed', COALESCE(v_rel,'(null)');
    END IF;
    IF v_bracket NOT IN ('under_13','13_to_17','adult') THEN
      RAISE EXCEPTION 'invalid_member: coppa_age_bracket % is not allowed', COALESCE(v_bracket,'(null)');
    END IF;
    IF v_bracket = 'under_13' THEN
      v_under13_count := v_under13_count + 1;
    END IF;
  END LOOP;

  -- ── Validate existing members (member-edit → under_13 path) ────────────
  FOREACH v_existing_id IN ARRAY v_existing_ids LOOP
    SELECT fm.family_id, fm.role INTO v_existing_family, v_existing_role
    FROM public.family_members fm WHERE fm.id = v_existing_id AND fm.is_active = true;
    IF v_existing_family IS NULL OR v_existing_family <> v_family_id THEN
      RAISE EXCEPTION 'invalid_member: existing member not found in your family';
    END IF;
    IF v_existing_role NOT IN ('member') THEN
      RAISE EXCEPTION 'invalid_member: only child members can be marked under 13';
    END IF;
    v_under13_count := v_under13_count + 1;
  END LOOP;

  IF v_under13_count = 0 THEN
    -- This RPC exists for consent-gated commits only. Batches with no
    -- under-13 member use the ordinary direct-insert path (mom's own RLS).
    RAISE EXCEPTION 'no_consent_needed';
  END IF;

  -- ── Server-derived request metadata (audit evidence) ───────────────────
  BEGIN
    v_headers    := current_setting('request.headers', true)::jsonb;
    v_ip         := COALESCE(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip');
    v_user_agent := v_headers->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL; v_user_agent := NULL;
  END;

  -- ── Atomic commit: members + consents in one transaction ───────────────
  FOR v_member IN SELECT * FROM jsonb_array_elements(v_members) LOOP
    v_name        := btrim(v_member->>'display_name');
    v_role        := v_member->>'role';
    v_mode        := v_member->>'dashboard_mode';
    v_rel         := v_member->>'relationship';
    v_bracket     := v_member->>'coppa_age_bracket';
    v_color       := v_member->>'member_color';
    v_custom_role := NULLIF(btrim(COALESCE(v_member->>'custom_role','')), '');
    v_dob         := NULL;
    v_age         := NULL;
    BEGIN
      v_dob := (v_member->>'date_of_birth')::DATE;
    EXCEPTION WHEN OTHERS THEN v_dob := NULL;
    END;
    IF v_dob IS NOT NULL THEN
      v_age := date_part('year', age(v_dob))::INTEGER;
    ELSE
      BEGIN
        v_age := (v_member->>'age')::INTEGER;
      EXCEPTION WHEN OTHERS THEN v_age := NULL;
      END;
    END IF;

    INSERT INTO public.family_members (
      family_id, display_name, role, dashboard_mode, relationship,
      date_of_birth, age, member_color, custom_role,
      in_household, dashboard_enabled, auth_method, is_active,
      coppa_age_bracket
    ) VALUES (
      v_family_id, v_name, v_role, v_mode, v_rel,
      v_dob, v_age, v_color, v_custom_role,
      true, true, 'pin', true,
      v_bracket
    ) RETURNING id INTO v_id;

    v_new_member_ids := v_new_member_ids || v_id;
    v_new_members_out := v_new_members_out || jsonb_build_object(
      'id', v_id,
      'display_name', v_name,
      'date_of_birth', v_dob,
      'coppa_age_bracket', v_bracket
    );

    IF v_bracket = 'under_13' THEN
      INSERT INTO public.coppa_consents (
        family_id, child_member_id, parent_member_id, verification_id,
        consent_version, acknowledged_sections, ip_address, user_agent
      ) VALUES (
        v_family_id, v_id, v_parent_member_id, v_verification_id,
        v_consent_version, v_ack_sections, v_ip, v_user_agent
      ) RETURNING id INTO v_consent_id;
      v_consent_ids := v_consent_ids || v_consent_id;
    END IF;
  END LOOP;

  FOREACH v_existing_id IN ARRAY v_existing_ids LOOP
    UPDATE public.family_members
    SET coppa_age_bracket = 'under_13'
    WHERE id = v_existing_id AND family_id = v_family_id;

    -- Idempotent per child: if an active consent already exists (uq_cc_
    -- active_per_child), keep it — do not double-insert.
    IF NOT EXISTS (
      SELECT 1 FROM public.coppa_consents cc
      WHERE cc.child_member_id = v_existing_id
        AND cc.revoked_at IS NULL AND cc.superseded_at IS NULL
    ) THEN
      BEGIN
        INSERT INTO public.coppa_consents (
          family_id, child_member_id, parent_member_id, verification_id,
          consent_version, acknowledged_sections, ip_address, user_agent
        ) VALUES (
          v_family_id, v_existing_id, v_parent_member_id, v_verification_id,
          v_consent_version, v_ack_sections, v_ip, v_user_agent
        ) RETURNING id INTO v_consent_id;
        v_consent_ids := v_consent_ids || v_consent_id;
      EXCEPTION WHEN unique_violation THEN
        NULL; -- concurrent consent for the same child: the existing one wins
      END;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'members', v_new_members_out,
    'member_ids', to_jsonb(v_new_member_ids),
    'consent_ids', to_jsonb(v_consent_ids)
  );
END;
$$;

COMMENT ON FUNCTION public.commit_consented_members(JSONB) IS
  'PRD-40 Slice 3 (ruling R-13). Atomically commits held-pending family_members rows plus their coppa_consents rows after parental verification. Mom''s real session only (R-10, Convention #280 gate in-body). The sole insert path into coppa_consents.';

-- In-body gate is the authorization; EXECUTE stays with authenticated only.
REVOKE EXECUTE ON FUNCTION public.commit_consented_members(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commit_consented_members(JSONB) TO authenticated, service_role;

-- ── Verification block ────────────────────────────────────────────────────
DO $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'commit_consented_members' AND p.prosecdef
  ) INTO v_ok;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'commit_consented_members missing or not SECURITY DEFINER';
  END IF;
  IF has_function_privilege('anon', 'public.commit_consented_members(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'commit_consented_members must not be executable by anon';
  END IF;
END $$;
