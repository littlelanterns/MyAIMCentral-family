-- ============================================================================
-- Migration: PRD-40 Slice 6 — /admin/coppa RPCs + the lawyer_approved_at
--            STAMP GUARD (the sequencing law, encoded in code)
-- ============================================================================
-- Screen 10 (Admin Verification Log) needs cross-family reads that RLS
-- deliberately does not give staff on family_members/families (staff can read
-- the COPPA tables directly per migration 100305, but NOT resolve family or
-- member names). These SECURITY DEFINER RPCs assemble the compliance log
-- server-side, gated on staff_permissions.permission_type = 'coppa_admin'
-- (R-3; stricter than the any-staff table RLS on purpose — the RPCs are what
-- add name resolution, so they carry the narrower gate).
--
-- THE STAMP GUARD (the load-bearing part of this migration):
-- populating coppa_consent_templates.lawyer_approved_at is the PLATFORM
-- ENFORCEMENT SWITCH — the moment any non-retired template row carries a
-- non-NULL lawyer_approved_at, util.coppa_write_allowed()'s R-8 dormancy
-- branch (migration 100327) closes and every unconsented under-13 member is
-- write-blocked platform-wide, instantly. The SEQUENCING LAW (Slice-5
-- record, .claude/rules/current-builds/PRD-40-coppa.md): the founder
-- backfill ceremony MUST precede the stamp. This migration encodes that law
-- in code, not docs:
--
--   1. admin_stamp_consent_template() REFUSES while ANY member exists for
--      whom the stamp would flip util.coppa_write_allowed() from true to
--      false (under_13 + not suspended + no active consent). The predicate
--      below mirrors migration 100327's post-dormancy branch EXACTLY —
--      change one, change the other.
--   2. The direct-UPDATE side door is CLOSED via column-level privileges:
--      authenticated (even a coppa_admin staff session) can no longer set
--      lawyer_approved_at/lawyer_name by a bare .update() — the RLS policy
--      cct_admin_update from 100305 remains, but the column grant beneath
--      it now excludes those two columns (the coppa_consents column-grant
--      idiom, 100305 §4). Same for INSERT: a new version row cannot be
--      born pre-approved.
--
-- NOTE ON WHO CAN STAMP: only the guarded RPC (or service_role, which
-- bypasses grants — service_role is seat/founder-operated by definition and
-- covered by the production-touch gate).
--
-- Rulings: R-3 (fourth ADMIN_TABS row, coppa_admin), R-9 (ceremony before
-- stamp), R-10-class gating, Convention #280 (auth gate resolved before any
-- read/write in every SECURITY DEFINER function).
-- Build file: .claude/rules/current-builds/PRD-40-coppa.md (Slice 6)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Column-level guard on coppa_consent_templates — close the direct-stamp
--    side door. Staff keep legitimate template ops: INSERT new versions
--    (born unapproved), retire versions, edit notes.
-- ----------------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.coppa_consent_templates FROM authenticated;
GRANT INSERT (
  version, published_at,
  section_what_we_collect, section_how_lila_uses, section_who_sees_it,
  section_your_rights, section_parent_affirmation,
  notes
) ON public.coppa_consent_templates TO authenticated;
GRANT UPDATE (retired_at, notes) ON public.coppa_consent_templates TO authenticated;

COMMENT ON COLUMN public.coppa_consent_templates.lawyer_approved_at IS
  'THE PLATFORM ENFORCEMENT SWITCH. Settable ONLY via admin_stamp_consent_template() (migration 100330), which enforces the sequencing law: zero unconsented under-13 members may exist before any template is stamped approved (founder backfill ceremony first — R-9). Column-level grants exclude this column from direct authenticated INSERT/UPDATE.';

-- ----------------------------------------------------------------------------
-- 2. admin_coppa_overview() — Screen 10 table rows, one per family with any
--    COPPA surface area (a verification, a consent, an attempt, or an
--    under-13 member). Counts + metadata only; none of the read tables carry
--    conversation content, and this function never joins one that does
--    (the no-side-door rule, Convention #282 lineage).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_coppa_overview()
RETURNS TABLE (
  family_id UUID,
  family_name TEXT,
  parent_member_id UUID,
  parent_name TEXT,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  stripe_payment_intent_id TEXT,
  verification_revoked_at TIMESTAMPTZ,
  under_13_members BIGINT,
  unconsented_under_13 BIGINT,
  active_consents BIGINT,
  revoked_consents BIGINT,
  superseded_consents BIGINT,
  pending_deletions BIGINT,
  completed_deletions BIGINT,
  failed_attempts BIGINT,
  last_attempt_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- Convention #280: gate resolved before any read.
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid() AND permission_type = 'coppa_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.family_name,
    COALESCE(pv.parent_member_id, pp.id),
    COALESCE(pvm.display_name, pp.display_name),
    pv.verified_at,
    pv.verification_method,
    pv.stripe_payment_intent_id,
    pv.revoked_at,
    (SELECT COUNT(*) FROM public.family_members fm
      WHERE fm.family_id = f.id AND fm.coppa_age_bracket = 'under_13' AND fm.role <> 'family'),
    (SELECT COUNT(*) FROM public.family_members fm
      WHERE fm.family_id = f.id AND fm.coppa_age_bracket = 'under_13' AND fm.role <> 'family'
        AND fm.is_suspended_for_deletion = false
        AND NOT EXISTS (
          SELECT 1 FROM public.coppa_consents c
          WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
        )),
    (SELECT COUNT(*) FROM public.coppa_consents c
      WHERE c.family_id = f.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL),
    (SELECT COUNT(*) FROM public.coppa_consents c
      WHERE c.family_id = f.id AND c.revoked_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.coppa_consents c
      WHERE c.family_id = f.id AND c.superseded_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.coppa_consents c
      WHERE c.family_id = f.id AND c.revoked_at IS NOT NULL AND c.deletion_completed_at IS NULL),
    (SELECT COUNT(*) FROM public.coppa_consents c
      WHERE c.family_id = f.id AND c.deletion_completed_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.parent_verification_attempts a
      WHERE a.family_id = f.id AND a.status <> 'succeeded'),
    (SELECT MAX(a.attempted_at) FROM public.parent_verification_attempts a
      WHERE a.family_id = f.id)
  FROM public.families f
  LEFT JOIN LATERAL (
    SELECT v.* FROM public.parent_verifications v
    WHERE v.family_id = f.id
    ORDER BY (v.revoked_at IS NULL) DESC, v.verified_at DESC
    LIMIT 1
  ) pv ON true
  LEFT JOIN public.family_members pvm ON pvm.id = pv.parent_member_id
  LEFT JOIN LATERAL (
    SELECT m.id, m.display_name FROM public.family_members m
    WHERE m.family_id = f.id AND m.role = 'primary_parent'
    LIMIT 1
  ) pp ON true
  WHERE pv.id IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.coppa_consents c WHERE c.family_id = f.id)
     OR EXISTS (SELECT 1 FROM public.parent_verification_attempts a WHERE a.family_id = f.id)
     OR EXISTS (SELECT 1 FROM public.family_members fm
                 WHERE fm.family_id = f.id AND fm.coppa_age_bracket = 'under_13' AND fm.role <> 'family')
  ORDER BY f.family_name;
END;
$fn$;

COMMENT ON FUNCTION public.admin_coppa_overview() IS
  'PRD-40 Screen 10: per-family COPPA compliance overview (counts + verification metadata only, never content). Gate: staff_permissions.permission_type = coppa_admin.';

-- ----------------------------------------------------------------------------
-- 3. admin_coppa_family_detail(p_family_id) — "View Full Record".
--    Consents (with child name/bracket), verifications, attempts, the
--    deletion-cascade log (row COUNTS per table — never content), and export
--    audit metadata.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_coppa_family_detail(p_family_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid() AND permission_type = 'coppa_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'family', (SELECT jsonb_build_object('id', f.id, 'family_name', f.family_name, 'is_founding_family', f.is_founding_family)
                 FROM public.families f WHERE f.id = p_family_id),
    'verifications', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'parent_name', m.display_name, 'verification_method', v.verification_method,
        'stripe_payment_intent_id', v.stripe_payment_intent_id, 'amount_charged_cents', v.amount_charged_cents,
        'verified_at', v.verified_at, 'revoked_at', v.revoked_at
      ) ORDER BY v.verified_at DESC)
      FROM public.parent_verifications v
      LEFT JOIN public.family_members m ON m.id = v.parent_member_id
      WHERE v.family_id = p_family_id
    ), '[]'::jsonb),
    'consents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'child_name', cm.display_name, 'child_bracket', cm.coppa_age_bracket,
        'consent_version', c.consent_version, 'acknowledged_sections', c.acknowledged_sections,
        'consented_at', c.consented_at, 'revoked_at', c.revoked_at, 'revocation_reason', c.revocation_reason,
        'superseded_at', c.superseded_at, 'scheduled_deletion_at', c.scheduled_deletion_at,
        'deletion_completed_at', c.deletion_completed_at, 'deletion_completion_notes', c.deletion_completion_notes
      ) ORDER BY c.consented_at DESC)
      FROM public.coppa_consents c
      LEFT JOIN public.family_members cm ON cm.id = c.child_member_id
      WHERE c.family_id = p_family_id
    ), '[]'::jsonb),
    'attempts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'status', a.status, 'failure_reason', a.failure_reason,
        'stripe_payment_intent_id', a.stripe_payment_intent_id, 'attempted_at', a.attempted_at
      ) ORDER BY a.attempted_at DESC)
      FROM public.parent_verification_attempts a
      WHERE a.family_id = p_family_id
    ), '[]'::jsonb),
    'deletion_log', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'child_name', dm.display_name, 'source_table', d.source_table,
        'deletion_trigger', d.deletion_trigger, 'row_count', d.row_count, 'executed_at', d.executed_at
      ) ORDER BY d.executed_at DESC)
      FROM public.retention_deletion_log d
      LEFT JOIN public.family_members dm ON dm.id = d.child_member_id
      WHERE d.family_id = p_family_id
    ), '[]'::jsonb),
    'exports', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'child_name', em.display_name, 'requested_at', e.requested_at,
        'completed_at', e.completed_at, 'downloaded_at', e.downloaded_at
      ) ORDER BY e.requested_at DESC)
      FROM public.parental_data_exports e
      LEFT JOIN public.family_members em ON em.id = e.child_member_id
      WHERE e.family_id = p_family_id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

COMMENT ON FUNCTION public.admin_coppa_family_detail(UUID) IS
  'PRD-40 Screen 10 "View Full Record": consents/verifications/attempts/deletion-log counts + metadata for one family. Never content — the deletion log carries per-table row counts only. Gate: coppa_admin.';

-- ----------------------------------------------------------------------------
-- 4. admin_coppa_stamp_readiness() — the sequencing-law counter the admin UI
--    renders (the stamp button stays hard-disabled while blockers exist).
--    Mirrors util.coppa_write_allowed()'s post-dormancy branch EXACTLY.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_coppa_stamp_readiness()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_blockers JSONB;
  v_count BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid() AND permission_type = 'coppa_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT COUNT(*), COALESCE(jsonb_agg(jsonb_build_object(
           'family_name', f.family_name, 'member_name', fm.display_name
         ) ORDER BY f.family_name, fm.display_name), '[]'::jsonb)
    INTO v_count, v_blockers
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
   WHERE fm.coppa_age_bracket = 'under_13'
     AND fm.role <> 'family'
     AND fm.is_suspended_for_deletion = false
     AND NOT EXISTS (
       SELECT 1 FROM public.coppa_consents c
       WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
     );

  RETURN jsonb_build_object(
    'unconsented_under_13', v_count,
    'blockers', v_blockers,
    'ready', v_count = 0
  );
END;
$fn$;

COMMENT ON FUNCTION public.admin_coppa_stamp_readiness() IS
  'PRD-40 sequencing law counter: members for whom stamping a template approved would flip util.coppa_write_allowed() false. ready=true only when zero exist (founder backfill ceremony complete). Gate: coppa_admin.';

-- ----------------------------------------------------------------------------
-- 5. admin_stamp_consent_template(p_version, p_lawyer_name) — THE GUARDED
--    ENFORCEMENT SWITCH. The only client-reachable path that can populate
--    lawyer_approved_at (column grants above close the direct path).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_stamp_consent_template(
  p_version TEXT,
  p_lawyer_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_row public.coppa_consent_templates%ROWTYPE;
  v_blocking BIGINT;
  v_stamped_at TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid() AND permission_type = 'coppa_admin'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_lawyer_name IS NULL OR length(trim(p_lawyer_name)) = 0 THEN
    RAISE EXCEPTION 'lawyer_name_required';
  END IF;

  SELECT * INTO v_row FROM public.coppa_consent_templates WHERE version = p_version;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'template_not_found: %', p_version;
  END IF;
  IF v_row.retired_at IS NOT NULL THEN
    RAISE EXCEPTION 'template_retired: %', p_version;
  END IF;
  IF v_row.lawyer_approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'template_already_approved: %', p_version;
  END IF;

  -- THE SEQUENCING LAW (R-9 + Slice-5 record). Predicate mirrors
  -- util.coppa_write_allowed() (migration 100327) exactly: stamping while
  -- any of these members exist would write-block them platform-wide the
  -- instant this transaction commits.
  SELECT COUNT(*) INTO v_blocking
    FROM public.family_members fm
   WHERE fm.coppa_age_bracket = 'under_13'
     AND fm.role <> 'family'
     AND fm.is_suspended_for_deletion = false
     AND NOT EXISTS (
       SELECT 1 FROM public.coppa_consents c
       WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
     );

  IF v_blocking > 0 THEN
    RAISE EXCEPTION 'sequencing_law_blocked: % unconsented under-13 member(s) exist. The founder backfill ceremony (R-9) must complete before any consent template is stamped approved — stamping is the platform enforcement switch and would write-block those members instantly.', v_blocking;
  END IF;

  v_stamped_at := now();
  UPDATE public.coppa_consent_templates
     SET lawyer_approved_at = v_stamped_at,
         lawyer_name = trim(p_lawyer_name)
   WHERE version = p_version;

  RETURN jsonb_build_object(
    'success', true,
    'version', p_version,
    'lawyer_approved_at', v_stamped_at,
    'lawyer_name', trim(p_lawyer_name)
  );
END;
$fn$;

COMMENT ON FUNCTION public.admin_stamp_consent_template(TEXT, TEXT) IS
  'PRD-40: records attorney approval on a consent-template version — THE PLATFORM ENFORCEMENT SWITCH. Refuses while any unconsented, non-suspended under-13 member exists (sequencing law: founder backfill ceremony first, R-9). Gate: coppa_admin. The only client-reachable write path to lawyer_approved_at (column grants exclude it from direct INSERT/UPDATE).';

-- ----------------------------------------------------------------------------
-- 6. EXECUTE grants — authenticated only (in-body gate does the real work),
--    never anon/PUBLIC. service_role for seat-run probes.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_coppa_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_coppa_family_detail(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_coppa_stamp_readiness() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_stamp_consent_template(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_coppa_overview() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_coppa_family_detail(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_coppa_stamp_readiness() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_stamp_consent_template(TEXT, TEXT) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 7. Self-verification
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_fn TEXT;
  v_count BIGINT;
BEGIN
  FOR v_fn IN SELECT unnest(ARRAY[
    'admin_coppa_overview()',
    'admin_coppa_family_detail(uuid)',
    'admin_coppa_stamp_readiness()',
    'admin_stamp_consent_template(text,text)'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.oid = ('public.' || v_fn)::regprocedure
        AND p.prosecdef
    ) THEN
      RAISE EXCEPTION '[100330] % missing or not SECURITY DEFINER', v_fn;
    END IF;
    IF has_function_privilege('anon', ('public.' || v_fn)::regprocedure, 'EXECUTE') THEN
      RAISE EXCEPTION '[100330] anon can EXECUTE %', v_fn;
    END IF;
  END LOOP;

  -- Column-guard asserts: the enforcement-switch columns are unreachable by
  -- direct authenticated writes; legitimate template ops remain.
  IF has_column_privilege('authenticated', 'public.coppa_consent_templates', 'lawyer_approved_at', 'UPDATE') THEN
    RAISE EXCEPTION '[100330] authenticated can still UPDATE lawyer_approved_at directly — side door open';
  END IF;
  IF has_column_privilege('authenticated', 'public.coppa_consent_templates', 'lawyer_approved_at', 'INSERT') THEN
    RAISE EXCEPTION '[100330] authenticated can INSERT lawyer_approved_at directly — side door open';
  END IF;
  IF has_column_privilege('authenticated', 'public.coppa_consent_templates', 'lawyer_name', 'UPDATE') THEN
    RAISE EXCEPTION '[100330] authenticated can still UPDATE lawyer_name directly — side door open';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.coppa_consent_templates', 'retired_at', 'UPDATE') THEN
    RAISE EXCEPTION '[100330] authenticated lost legitimate retired_at UPDATE — template retirement broken';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.coppa_consent_templates', 'notes', 'UPDATE') THEN
    RAISE EXCEPTION '[100330] authenticated lost legitimate notes UPDATE';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.coppa_consent_templates', 'version', 'INSERT') THEN
    RAISE EXCEPTION '[100330] authenticated lost legitimate new-version INSERT';
  END IF;

  -- Sequencing-law counter status at apply time (informational, never an
  -- assert — the count legitimately reaches 0 after the ceremony).
  SELECT COUNT(*) INTO v_count
    FROM public.family_members fm
   WHERE fm.coppa_age_bracket = 'under_13'
     AND fm.role <> 'family'
     AND fm.is_suspended_for_deletion = false
     AND NOT EXISTS (
       SELECT 1 FROM public.coppa_consents c
       WHERE c.child_member_id = fm.id AND c.revoked_at IS NULL AND c.superseded_at IS NULL
     );
  RAISE NOTICE '[100330] sequencing-law counter: % unconsented under-13 member(s) — stamp guard %',
    v_count, CASE WHEN v_count > 0 THEN 'REFUSES (expected until the ceremony)' ELSE 'is open (ceremony complete)' END;

  RAISE NOTICE '[100330] admin COPPA RPCs + stamp guard verified.';
END $$;
