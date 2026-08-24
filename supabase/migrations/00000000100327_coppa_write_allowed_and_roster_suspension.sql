-- ============================================================================
-- Migration: PRD-40 Slice 5 — util.coppa_write_allowed() + roster suspension
-- ============================================================================
-- The enforcement primitive every COPPA RESTRICTIVE write gate delegates to
-- (the gates themselves are the GENERATED migration 100328), plus the
-- server-side "hides from dashboards" rule for suspended members on the two
-- pre-auth roster RPCs.
--
-- THE INERTNESS INVARIANT (the whole point of this slice's design):
--   - 13+/adult members:                unaffected (fast path, one PK lookup)
--   - consented under-13 members:       unaffected (active-consent EXISTS hits
--                                       the uq_cc_active_per_child partial index)
--   - under-13 members WITHOUT consent: unaffected TODAY — ruling R-8
--                                       dormancy: while no coppa_consent_templates
--                                       row has lawyer_approved_at set, valid
--                                       consent legally cannot exist, so the
--                                       unconsented-under-13 rule is dormant.
--                                       This is what keeps the founder's own
--                                       under-13 kids (6 members, zero consent
--                                       rows, founding-family posture)
--                                       byte-identically unaffected until the
--                                       Slice-6 backfill ceremony + attorney
--                                       approval. SEQUENCING NOTE FOR SLICE 6:
--                                       the backfill ceremony MUST precede
--                                       populating lawyer_approved_at — the
--                                       moment an approved template exists,
--                                       enforcement is live for every
--                                       unconsented under-13 member.
--   - suspended members (is_suspended_for_deletion): writes BLOCKED — active
--     immediately, dormancy does not apply. Suspension only ever comes from
--     the Slice-4 revoke_coppa_consent RPC (which requires an existing
--     consent), so zero production members carry it today; blocking is the
--     PRD Screen-9 grace-period contract ("blocks all data writes").
--
-- Convention #280 note: this SECURITY DEFINER function takes a bare member
-- id but is a read-only BOOLEAN PREDICATE — it mutates nothing and grants
-- nothing. It MUST be executable by `authenticated` because RESTRICTIVE
-- policy expressions evaluate it as the row-writing user. Information
-- exposed: "is this UUID an unconsented-under-13 or suspended member" —
-- requires already knowing the UUID (not enumerable), and the alternative
-- (auth-gating) would break every gated table's RLS. rls-verifier is asked
-- to probe this boundary explicitly.
--
-- Idempotent throughout.
-- Build file: .claude/rules/current-builds/PRD-40-coppa.md (Slice 5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. util.coppa_write_allowed(p_member_id) — the enforcement predicate
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION util.coppa_write_allowed(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bracket TEXT;
  v_suspended BOOLEAN;
BEGIN
  -- NULL subject column (task with no assignee, family-level prize/contract
  -- row, …) — never a child-subject write. Pass.
  IF p_member_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT fm.coppa_age_bracket, fm.is_suspended_for_deletion
    INTO v_bracket, v_suspended
    FROM public.family_members fm
   WHERE fm.id = p_member_id;

  -- Defensive: id doesn't resolve to a family_members row (should not happen
  -- for registry subject columns, all of which reference family_members).
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Revocation grace (PRD Screen 9): all data writes stop. Checked FIRST and
  -- unconditionally — suspension is set only via revoke_coppa_consent, which
  -- itself required a consent to exist, so this branch never fires under
  -- pure dormancy.
  IF v_suspended THEN
    RETURN false;
  END IF;

  IF v_bracket IS DISTINCT FROM 'under_13' THEN
    RETURN true;
  END IF;

  -- R-8 dormancy: no lawyer-approved, non-retired template ⇒ the consent
  -- framework is dormant and the unconsented-under-13 rule is suspended.
  -- (coppa_consent_templates has 1-2 rows; this EXISTS is trivial.)
  IF NOT EXISTS (
    SELECT 1 FROM public.coppa_consent_templates t
     WHERE t.lawyer_approved_at IS NOT NULL
       AND t.retired_at IS NULL
  ) THEN
    RETURN true;
  END IF;

  -- Enforcement active: an under-13 write requires an active consent row
  -- (served by the uq_cc_active_per_child partial unique index, migration
  -- 100305).
  RETURN EXISTS (
    SELECT 1 FROM public.coppa_consents c
     WHERE c.child_member_id = p_member_id
       AND c.revoked_at IS NULL
       AND c.superseded_at IS NULL
  );
EXCEPTION WHEN OTHERS THEN
  -- FAIL-OPEN, LOUDLY. This predicate runs inside the WITH CHECK of ~264
  -- RESTRICTIVE policies across ~132 tables — an unexpected error here
  -- failing CLOSED would be a platform-wide write outage. The COPPA
  -- protections do not rest solely on this predicate (held-state UI, Edge
  -- checks, and the consent flow are the primary controls); a fail-open bug
  -- is detectable by the rls-verifier probes, a fail-closed bug is an
  -- outage. Nothing in the body above can throw against the current schema —
  -- this guard exists for future schema drift only.
  RAISE WARNING 'util.coppa_write_allowed(%) failed open: %', p_member_id, SQLERRM;
  RETURN true;
END;
$$;

COMMENT ON FUNCTION util.coppa_write_allowed(UUID) IS
  'PRD-40 Slice 5: COPPA write-gate predicate. FALSE only for suspended-for-deletion members (always) and unconsented under-13 members (once a lawyer-approved consent template exists — R-8 dormancy until then). NULL/unknown ids pass. Twin logic: supabase/functions/_shared/coppa-consent.ts (change both together).';

REVOKE ALL ON FUNCTION util.coppa_write_allowed(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION util.coppa_write_allowed(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.coppa_write_allowed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION util.coppa_write_allowed(UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. get_family_login_members — suspended members hidden from the choice
--    screen / hub tiles ("hides from dashboards", PRD family_members contract).
--    Body copied from the live definition (migration 100251) + ONE new
--    predicate. Pre-apply step re-verifies the live body via
--    pg_get_functiondef (TEEN-CRED lesson: never assume the migration file
--    is still the live truth).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_family_login_members(p_family_id UUID)
RETURNS TABLE(
  member_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  auth_method TEXT,
  member_color TEXT,
  dashboard_mode TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller must be authenticated AND belong to this family
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = p_family_id AND f.primary_parent_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = p_family_id
      AND fm.user_id = auth.uid()
      AND fm.is_active = true
  ) THEN
    RETURN;
  END IF;

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
    -- PRD-40 Slice 5: suspended-for-deletion members are hidden from every
    -- roster surface during the revocation grace window.
    AND fm.is_suspended_for_deletion = false
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
$$;

-- ----------------------------------------------------------------------------
-- 3. verify_family_login — same suspension filter on the post-password
--    roster payload. Body copied from the live definition (migration 100257)
--    + ONE new predicate; same pre-apply live-body verification applies.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_family_login(p_login_name TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_family RECORD;
  v_failed INTEGER;
  v_members JSONB;
BEGIN
  SELECT f.id, f.family_name, f.family_password_hash,
         f.family_password_failed_attempts, f.family_password_locked_until
  INTO v_family
  FROM public.families f
  WHERE f.family_login_name_lower = lower(coalesce(p_login_name, ''));

  IF v_family.id IS NULL OR v_family.family_password_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid');
  END IF;

  IF v_family.family_password_locked_until IS NOT NULL
     AND v_family.family_password_locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'remaining_seconds',
      EXTRACT(EPOCH FROM (v_family.family_password_locked_until - now()))::integer
    );
  END IF;

  IF v_family.family_password_hash = crypt(coalesce(p_password, ''), v_family.family_password_hash) THEN
    UPDATE public.families
    SET family_password_failed_attempts = 0,
        family_password_locked_until = NULL
    WHERE id = v_family.id;

    SELECT coalesce(jsonb_agg(m), '[]'::jsonb) INTO v_members
    FROM (
      SELECT
        fm.id AS member_id,
        fm.display_name,
        fm.avatar_url,
        fm.auth_method,
        fm.member_color,
        fm.dashboard_mode,
        fm.role
      FROM public.family_members fm
      WHERE fm.family_id = v_family.id
        AND fm.is_active = true
        AND fm.dashboard_enabled = true
        -- PRD-40 Slice 5: suspended-for-deletion members are hidden from
        -- every roster surface during the revocation grace window.
        AND fm.is_suspended_for_deletion = false
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
        END
    ) m;

    RETURN jsonb_build_object(
      'success', true,
      'family_id', v_family.id,
      'family_name', v_family.family_name,
      'members', v_members
    );
  END IF;

  v_failed := coalesce(v_family.family_password_failed_attempts, 0) + 1;

  IF v_failed >= 5 THEN
    UPDATE public.families
    SET family_password_failed_attempts = v_failed,
        family_password_locked_until = now() + interval '15 minutes'
    WHERE id = v_family.id;
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'locked',
      'remaining_seconds', 900
    );
  END IF;

  UPDATE public.families
  SET family_password_failed_attempts = v_failed
  WHERE id = v_family.id;

  RETURN jsonb_build_object('success', false, 'reason', 'invalid');
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Verification block (runs at apply time; raises on failure)
-- ----------------------------------------------------------------------------
DO $verify$
DECLARE
  v_ok BOOLEAN;
BEGIN
  -- 4a. Function exists, is SECURITY DEFINER, and anon cannot execute it.
  SELECT p.prosecdef INTO v_ok
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'util' AND p.proname = 'coppa_write_allowed';
  IF v_ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'coppa_write_allowed missing or not SECURITY DEFINER';
  END IF;
  IF has_function_privilege('anon', 'util.coppa_write_allowed(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'coppa_write_allowed must not be executable by anon';
  END IF;
  IF NOT has_function_privilege('authenticated', 'util.coppa_write_allowed(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'coppa_write_allowed must be executable by authenticated (policy expressions)';
  END IF;

  -- 4b. NULL passes.
  IF util.coppa_write_allowed(NULL) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'coppa_write_allowed(NULL) must be true';
  END IF;

  -- 4c. Unknown id passes (defensive branch).
  IF util.coppa_write_allowed('00000000-0000-0000-0000-000000000000'::uuid) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'coppa_write_allowed(unknown id) must be true';
  END IF;

  -- 4d. INERTNESS: under R-8 dormancy (no lawyer-approved template), EVERY
  -- existing member — including every under-13 member with zero consent
  -- rows — must pass. If an approved template already exists at apply time,
  -- this check is skipped (enforcement is then legitimately live).
  IF NOT EXISTS (
    SELECT 1 FROM public.coppa_consent_templates t
    WHERE t.lawyer_approved_at IS NOT NULL AND t.retired_at IS NULL
  ) THEN
    IF EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.is_suspended_for_deletion = false
        AND util.coppa_write_allowed(fm.id) = false
    ) THEN
      RAISE EXCEPTION 'INERTNESS VIOLATION: a non-suspended member is write-blocked under dormancy';
    END IF;
  END IF;

  -- 4e. Both roster RPCs carry the suspension predicate.
  IF pg_get_functiondef('public.get_family_login_members(uuid)'::regprocedure)
       NOT LIKE '%is_suspended_for_deletion = false%' THEN
    RAISE EXCEPTION 'get_family_login_members missing suspension filter';
  END IF;
  IF pg_get_functiondef('public.verify_family_login(text,text)'::regprocedure)
       NOT LIKE '%is_suspended_for_deletion = false%' THEN
    RAISE EXCEPTION 'verify_family_login missing suspension filter';
  END IF;

  RAISE NOTICE 'migration 100327 verification passed';
END $verify$;
