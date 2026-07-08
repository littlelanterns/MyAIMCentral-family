-- ============================================================================
-- PRD-30 Safety Monitoring — SM-B addition: monitored-member self-read policy
-- ============================================================================
-- SM-A's safety_monitoring_configs RLS (migration 00000000100289) grants
-- ALL access to the primary_parent only — a monitored teen cannot read even
-- their own row. That's correct for the config-EDITING surface (Screen 1 is
-- primary-parent-only by addendum ruling), but it also blocks the teen
-- disclosure row (feature decision file J5/D4): "a standing disclosure row
-- in the teen What's Shared panel ... always present when monitoring is
-- active for that teen." Knowing THAT you are monitored is the disclosure
-- itself (Convention: "this is not hidden surveillance — it's disclosed as
-- a safety net") — it is the flag CONTENT that must stay hidden, never the
-- on/off state of monitoring.
--
-- This migration adds one narrow, ADDITIVE SELECT policy: a member may read
-- ONLY their own safety_monitoring_configs row (is_active + metadata, no
-- other member's row, no write access). It does not touch the existing
-- smc_mom_all policy (primary parent keeps full CRUD) and grants nothing on
-- safety_sensitivity_configs, safety_notification_recipients, safety_flags,
-- safety_keywords, or safety_resources — those stay exactly as SM-A left
-- them (flags/keywords remain fully invisible to the monitored member).
--
-- Idempotent: safe to re-run.
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY "smc_self_select" ON public.safety_monitoring_configs
    FOR SELECT TO authenticated USING (
      monitored_member_id IN (SELECT id FROM public.family_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Verification ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'safety_monitoring_configs'
     AND policyname = 'smc_self_select';
  IF v_policy_count <> 1 THEN
    RAISE EXCEPTION 'migration 100299: smc_self_select policy not found after creation';
  END IF;
  RAISE NOTICE 'PRD-30 SM-B migration verified: monitored-member self-read policy on safety_monitoring_configs in place.';
END $$;
