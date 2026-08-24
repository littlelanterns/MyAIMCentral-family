-- ============================================================================
-- Migration: PRD-40 Slice 5 — COPPA age-transition daily job (R-2 / R-14)
-- ============================================================================
-- PRD Key Decision 18: "Age transitions (child turns 13) detected by daily
-- job, not real-time. Consent is marked superseded; data is retained; mom is
-- notified. No data deletion on age transition."
--
-- Scope rules (rulings R-2 + R-14):
--   - Only members WITH a date_of_birth auto-transition. Members bracketed
--     under_13 without a DOB never auto-transition — the Screen-8 / member-
--     edit nudge (Slice 3/4) is their path; mom edits the bracket.
--   - The 13th birthday is computed at the FAMILY's timezone (Convention
--     #257 discipline — never a server-UTC date).
--   - Suspended-for-deletion members are SKIPPED: their lifecycle is the
--     Slice-4 deletion path; if mom undoes the revocation, the next daily
--     run picks them up.
--   - REVERSE drift (bracket says 13+/adult but DOB says under 13) is
--     DETECTED and reported to mom, never auto-downgraded — an automatic
--     downgrade could suddenly write-block a member once enforcement is
--     active (R-8), which is mom's call, not a cron's.
--
-- First-run impact statement (for the founder-gated apply): transitions fire
-- only for members whose bracket is under_13 AND whose DOB already shows ≥13
-- at their family's local date — i.e. any child who crossed their 13th
-- birthday since the Slice-1 backfill (2026-07-08). Each transition flips
-- the bracket to 13_to_17, supersedes any active consent row (none exist in
-- production today), and writes ONE normal-priority in-app notification to
-- mom (category 'privacy' — R-4; never DND-bypassing). No data is deleted.
--
-- Convention #280: SECURITY DEFINER, MUTATING — EXECUTE revoked from
-- PUBLIC/anon/authenticated; cron-invocation (postgres) + service_role only.
-- Convention #246 note: this is a direct-SQL cron (advance_task_rotations /
-- expire_overdue_task_claims precedent) — no Edge Function, no Vault secret,
-- no deploy needed.
--
-- Idempotent throughout. The job itself is self-idempotent: once a member
-- transitions, they no longer match the predicate.
-- Build file: .claude/rules/current-builds/PRD-40-coppa.md (Slice 5)
-- ============================================================================

CREATE OR REPLACE FUNCTION util.coppa_reconcile_age_brackets()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member RECORD;
  v_mom_id UUID;
  v_transitioned UUID[] := '{}';
  v_reverse_drift UUID[] := '{}';
BEGIN
  -- ── Aging out: under_13 members whose 13th birthday has passed at the
  --    family's local date ────────────────────────────────────────────────
  FOR v_member IN
    SELECT fm.id, fm.family_id, fm.display_name
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
    WHERE fm.coppa_age_bracket = 'under_13'
      AND fm.is_suspended_for_deletion = false
      AND fm.is_active = true
      AND fm.date_of_birth IS NOT NULL
      AND (fm.date_of_birth + INTERVAL '13 years')
            <= (now() AT TIME ZONE COALESCE(NULLIF(f.timezone, ''), 'America/Chicago'))::date
  LOOP
    UPDATE public.family_members
       SET coppa_age_bracket = '13_to_17'
     WHERE id = v_member.id;

    -- Consent no longer applies — superseded, never revoked/deleted
    -- (PRD Decision 18: data is retained).
    UPDATE public.coppa_consents
       SET superseded_at = now()
     WHERE child_member_id = v_member.id
       AND revoked_at IS NULL
       AND superseded_at IS NULL;

    SELECT fm2.id INTO v_mom_id
    FROM public.family_members fm2
    WHERE fm2.family_id = v_member.family_id
      AND fm2.role = 'primary_parent'
      AND fm2.is_active = true
    LIMIT 1;

    IF v_mom_id IS NOT NULL THEN
      INSERT INTO public.notifications
        (family_id, recipient_member_id, notification_type, category,
         title, body, source_type, source_reference_id, action_url, priority)
      VALUES
        (v_member.family_id, v_mom_id, 'coppa_age_transition', 'privacy',
         v_member.display_name || ' turned 13',
         'COPPA rules no longer apply to ' || v_member.display_name ||
           '''s profile. All of their data is kept exactly as it is — nothing changes unless you want it to. You can review this any time in Settings.',
         'family_members', v_member.id, '/settings/privacy-consent', 'normal');
    END IF;

    v_transitioned := v_transitioned || v_member.id;
  END LOOP;

  -- ── Reverse drift detection: bracket says 13+/adult but the DOB says the
  --    member is still under 13. Report to mom (deduped), never auto-act. ──
  FOR v_member IN
    SELECT fm.id, fm.family_id, fm.display_name
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
    WHERE fm.coppa_age_bracket <> 'under_13'
      AND fm.role = 'member'
      AND fm.is_active = true
      AND fm.is_suspended_for_deletion = false
      AND fm.date_of_birth IS NOT NULL
      AND (fm.date_of_birth + INTERVAL '13 years')
            > (now() AT TIME ZONE COALESCE(NULLIF(f.timezone, ''), 'America/Chicago'))::date
  LOOP
    SELECT fm2.id INTO v_mom_id
    FROM public.family_members fm2
    WHERE fm2.family_id = v_member.family_id
      AND fm2.role = 'primary_parent'
      AND fm2.is_active = true
    LIMIT 1;

    IF v_mom_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.recipient_member_id = v_mom_id
        AND n.notification_type = 'coppa_bracket_review'
        AND n.source_reference_id = v_member.id
    ) THEN
      INSERT INTO public.notifications
        (family_id, recipient_member_id, notification_type, category,
         title, body, source_type, source_reference_id, action_url, priority)
      VALUES
        (v_member.family_id, v_mom_id, 'coppa_bracket_review', 'privacy',
         'Quick check on ' || v_member.display_name || '''s age setting',
         v_member.display_name || '''s birth date suggests they are under 13, but their profile is set to 13 or older. Want to take a look? You can adjust it in Family Members.',
         'family_members', v_member.id, '/family-members', 'normal');
    END IF;

    v_reverse_drift := v_reverse_drift || v_member.id;
  END LOOP;

  RETURN jsonb_build_object(
    'transitioned', to_jsonb(v_transitioned),
    'reverse_drift_detected', to_jsonb(v_reverse_drift),
    'ran_at', now()
  );
END;
$$;

COMMENT ON FUNCTION util.coppa_reconcile_age_brackets() IS
  'PRD-40 Slice 5 (R-2/R-14): daily 13th-birthday transition (under_13 -> 13_to_17, consent superseded, mom notified) + reverse bracket/DOB drift detection (report-only, never auto-downgrade). Family-timezone dates. Cron: coppa-age-transition.';

REVOKE ALL ON FUNCTION util.coppa_reconcile_age_brackets() FROM PUBLIC;
REVOKE ALL ON FUNCTION util.coppa_reconcile_age_brackets() FROM anon;
REVOKE ALL ON FUNCTION util.coppa_reconcile_age_brackets() FROM authenticated;
GRANT EXECUTE ON FUNCTION util.coppa_reconcile_age_brackets() TO service_role;

-- ----------------------------------------------------------------------------
-- Cron registration — daily at 06:20 UTC (offset from the :00/:05/:15/:20/:25
-- hourly families). Direct-SQL job, no Edge Function involved.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coppa-age-transition') THEN
    PERFORM cron.unschedule('coppa-age-transition');
  END IF;
END $$;

SELECT cron.schedule(
  'coppa-age-transition',
  '20 6 * * *',
  $cron$ SELECT util.coppa_reconcile_age_brackets(); $cron$
);

-- ----------------------------------------------------------------------------
-- Verification block
-- ----------------------------------------------------------------------------
DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'util' AND p.proname = 'coppa_reconcile_age_brackets' AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'coppa_reconcile_age_brackets missing or not SECURITY DEFINER';
  END IF;
  IF has_function_privilege('authenticated', 'util.coppa_reconcile_age_brackets()', 'EXECUTE') THEN
    RAISE EXCEPTION 'coppa_reconcile_age_brackets must not be executable by authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coppa-age-transition' AND active) THEN
    RAISE EXCEPTION 'coppa-age-transition cron job not registered';
  END IF;
  RAISE NOTICE 'migration 100329 verification passed';
END $verify$;
