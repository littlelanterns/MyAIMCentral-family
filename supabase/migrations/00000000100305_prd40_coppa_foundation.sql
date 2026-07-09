-- ============================================================================
-- PRD-40: COPPA Compliance & Parental Verification — Slice 1 Foundation
-- ============================================================================
-- Schema, immutability RLS, and template seed for the platform's first real
-- deletion-cascade / consent-audit machinery. Zero UI, zero Stripe, zero
-- cascade logic in this migration — those are Slices 2-5. See
-- claude/feature-decisions/PRD-40-COPPA-Compliance.md (rulings R-1..R-14)
-- and prds/addenda/PRD-40-Two-Door-Auth-Addendum.md for the authority chain.
--
-- 6 tables (PRD Data Schema section):
--   1. coppa_consent_templates    — versioned disclosure text, immutable once
--      published. Seeded here with version 1.0.0, lawyer_approved_at NULL —
--      the literal dormancy gate (Convention #247-style: the flow is inert
--      for real users until a human lawyer approves).
--   2. parent_verifications       — one row per parent verification event.
--      Immutable audit trail. No UPDATE/DELETE by anyone, ever.
--   3. coppa_consents             — one row per child consent event, linked
--      to a parent verification. Mom can UPDATE only the revocation fields
--      (enforced via column-level GRANT, mirroring the migration 100286/
--      100289 content-guard pattern). Never DELETEd — deletion_completed_at
--      is set instead; the row is permanent audit evidence.
--   4. parent_verification_attempts — every verification attempt (success or
--      failure), used for rate limiting (5/hr, 20/day, application-layer).
--   5. parental_data_exports      — background export job records. INSERT
--      is service-role only in this slice (the request Edge Function/RPC
--      that enforces the 1-per-7-days rate limit is Slice 4 scope).
--   6. retention_deletion_log     — audit trail for every automated deletion
--      (rolling retention, consent revocation, storage cleanup, admin
--      manual). Admin-SELECT / service-INSERT only.
--
-- Plus 1 shared-infrastructure table (decision file §3.3, PRD-31 inherits):
--   7. stripe_webhook_events      — router-level Stripe event dedup log.
--      Built here because Slice 1 owns the base schema pass; consumed by
--      Slice 2 (the actual stripe-webhook-handler Edge Function). Service-
--      role only — never read by any client.
--
-- 2 new family_members columns: coppa_age_bracket, is_suspended_for_deletion.
--
-- Deviation from the PRD's literal "New enum: X" language: this migration
-- uses TEXT + CHECK constraints for verification_method / coppa_age_bracket /
-- verification_attempt_status, NOT native Postgres ENUM types. Every prior
-- migration in this codebase uses the TEXT+CHECK idiom (never a native
-- CREATE TYPE ... AS ENUM) specifically because CHECK constraints can be
-- ALTERed idempotently later (see the staff_permissions.permission_type
-- extension below, precedent: migration 100290) whereas native enum types
-- require ALTER TYPE ... ADD VALUE outside a transaction block. Consistency
-- with the rest of the schema wins here.
--
-- R-10 (two-door session rule): every RLS policy below keys off
-- `role = 'primary_parent' AND user_id = auth.uid()`, which is naturally
-- unreachable by family-shadow sessions (role='family') and member-shadow
-- sessions (role='member'/'additional_adult'). View-As does NOT change
-- auth.uid() (mom's real session stays authenticated underneath the modal),
-- so "COPPA is unavailable inside View-As" is a FRONTEND-layer restriction
-- that Slice 3 must implement — RLS alone cannot distinguish "mom acting as
-- herself" from "mom viewing through the View-As overlay". Noted here so
-- Slice 3 doesn't assume RLS already covers it.
--
-- Idempotent: safe to re-run (IF NOT EXISTS / DO $$ EXCEPTION guards).
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 0. staff_permissions.permission_type CHECK extension — 'coppa_admin'.
--    Same idempotent pattern as migration 100290 (drops by the constraint's
--    discovered name, not a guessed one, so it works regardless of naming).
--    Screen 10 (Admin COPPA Verification Log) uses the standard admin gate
--    (EXISTS row in staff_permissions for auth.uid(), no per-permission-type
--    discrimination at RLS level — matches every other admin table in this
--    schema) — this just makes 'coppa_admin' a legal, assignable value for
--    when per-tab gating is enforced.
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'staff_permissions' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%permission_type%'
    AND pg_get_constraintdef(c.oid) NOT ILIKE '%coppa_admin%'
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.staff_permissions DROP CONSTRAINT %I', v_conname);
    ALTER TABLE public.staff_permissions ADD CONSTRAINT staff_permissions_permission_type_check
      CHECK (permission_type = ANY (ARRAY[
        'super_admin', 'vault_admin', 'moderation_admin', 'system_admin',
        'analytics_admin', 'feedback_admin', 'persona_admin', 'ethics_admin',
        'coppa_admin'
      ]));
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. family_members new columns.
--    coppa_age_bracket defaults 'adult' for safety (PRD: "must be explicitly
--    set to under_13 to trigger consent flow"). is_suspended_for_deletion is
--    the 14-day revocation grace-period flag (Screen 9) — blocks writes,
--    hides from dashboards. Both columns are additive; backfill runs below.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS coppa_age_bracket TEXT NOT NULL DEFAULT 'adult'
    CHECK (coppa_age_bracket IN ('under_13', '13_to_17', 'adult')),
  ADD COLUMN IF NOT EXISTS is_suspended_for_deletion BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.family_members.coppa_age_bracket IS
  'PRD-40. Canonical under-13 source platform-wide (decision file R-2) — computeIsUnder13() in _shared/ethics-guard.ts reads this first, falling back to date_of_birth/age only when unset. Distinct from birthday (optional) and dashboard_mode (readiness-based).';
COMMENT ON COLUMN public.family_members.is_suspended_for_deletion IS
  'PRD-40 Screen 9. Set during the 14-day revocation grace period. Blocks all data writes (Slice 5 enforcement via util.coppa_write_allowed), hides the member from dashboards. Cleared on Undo Revocation.';

CREATE INDEX IF NOT EXISTS idx_fm_coppa_under13
  ON public.family_members (family_id, coppa_age_bracket)
  WHERE coppa_age_bracket = 'under_13';

-- ──────────────────────────────────────────────────────────────────────────
-- 2. coppa_consent_templates — versioned disclosure text. Created FIRST
--    because coppa_consents.consent_version FK-references it.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coppa_consent_templates (
  version                       TEXT PRIMARY KEY,
  published_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at                    TIMESTAMPTZ,
  section_what_we_collect       TEXT NOT NULL,
  section_how_lila_uses         TEXT NOT NULL,
  section_who_sees_it           TEXT NOT NULL,
  section_your_rights           TEXT NOT NULL,
  section_parent_affirmation    TEXT NOT NULL,
  lawyer_approved_at            TIMESTAMPTZ,
  lawyer_name                   TEXT,
  notes                         TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coppa_consent_templates IS
  'PRD-40. Rows are immutable once published — retirement is via retired_at, never UPDATE of the section_* text. A materially different version is a NEW semver row, never an edit of an existing one. No real user consent may reference a version whose lawyer_approved_at IS NULL (the literal dormancy gate, decision file R-8/OD-4).';

ALTER TABLE public.coppa_consent_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the text version they consented to
-- (audit replay, Screen 8's "Review what I consented to").
DO $$ BEGIN
  CREATE POLICY "cct_select_all" ON public.coppa_consent_templates
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admin (staff_permissions) can INSERT or UPDATE (retire / set
-- lawyer_approved_at). No DELETE policy exists at all — never removable.
DO $$ BEGIN
  CREATE POLICY "cct_admin_write" ON public.coppa_consent_templates
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cct_admin_update" ON public.coppa_consent_templates
    FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. parent_verifications — one row per parent verification event.
--    Immutable audit trail. No UPDATE/DELETE policy exists for ANYONE,
--    including admin — matches lila_ethics_rejections/safety_flags INSERT-
--    only precedent (migrations 100286/100289).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parent_verifications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_member_id            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  verification_method         TEXT NOT NULL CHECK (verification_method IN (
                                 'stripe_charge', 'id_check', 'knowledge_based', 'subscription_payment'
                               )),
  stripe_payment_intent_id    TEXT,
  stripe_customer_id          TEXT,
  amount_charged_cents        INTEGER NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  verified_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address                  TEXT,
  user_agent                  TEXT,
  revoked_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_verifications IS
  'PRD-40. Immutable audit trail — no UPDATE, no DELETE, by anyone, ever (including admin). Verification is per-parent, not per-child: one row establishes mom as verified for all current and future under-13 children.';

CREATE INDEX IF NOT EXISTS idx_pv_family ON public.parent_verifications (family_id);
CREATE INDEX IF NOT EXISTS idx_pv_parent ON public.parent_verifications (parent_member_id);

-- At most one active verification per parent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pv_active_per_parent
  ON public.parent_verifications (parent_member_id)
  WHERE revoked_at IS NULL;

-- Webhook idempotency (decision file §3.3 / PRD Convention: duplicate Stripe
-- events for the same payment_intent.id must not create duplicate rows).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pv_stripe_payment_intent
  ON public.parent_verifications (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

DO $$ BEGIN
  CREATE TRIGGER trg_pv_updated_at
    BEFORE UPDATE ON public.parent_verifications
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.parent_verifications ENABLE ROW LEVEL SECURITY;

-- SELECT: primary parent, own family only. Admin, all families.
DO $$ BEGIN
  CREATE POLICY "pv_select_mom" ON public.parent_verifications
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- No client INSERT/UPDATE/DELETE policy exists at all — service role only
-- (the Stripe webhook handler, Slice 2, and the founder backfill, Slice 6).

-- ──────────────────────────────────────────────────────────────────────────
-- 4. coppa_consents — one row per child consent event.
--    Mom can UPDATE only revocation fields — enforced via column-level GRANT
--    (mirrors the migration 100286/100289 content-guard pattern: broad RLS
--    check + narrow column privileges is the established idiom for "some
--    fields writable, most are not" in this schema).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coppa_consents (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_member_id              UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  parent_member_id            UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  verification_id             UUID NOT NULL REFERENCES public.parent_verifications(id) ON DELETE RESTRICT,
  consent_version              TEXT NOT NULL REFERENCES public.coppa_consent_templates(version) ON DELETE RESTRICT,
  acknowledged_sections        TEXT[] NOT NULL,
  consented_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_at                 TIMESTAMPTZ,
  revoked_at                    TIMESTAMPTZ,
  scheduled_deletion_at         TIMESTAMPTZ,
  deletion_completed_at         TIMESTAMPTZ,
  deletion_completion_notes     JSONB,
  revocation_reason             TEXT,
  ip_address                    TEXT,
  user_agent                    TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coppa_consents IS
  'PRD-40. Per-child consent record. Never hard-deleted, even after deletion_completed_at is set — the row itself is the legal evidence of consent and revocation timing (Convention text: "coppa_consents rows are preserved even after deletion completion").';
COMMENT ON COLUMN public.coppa_consents.deletion_completion_notes IS
  'Populated by the Slice-4 deletion cascade job with per-table row counts and any warnings (e.g. "Skipped 2 sibling journal entries mentioning [Child Name]"). NULL until the cascade actually runs.';

CREATE INDEX IF NOT EXISTS idx_cc_family ON public.coppa_consents (family_id);

CREATE INDEX IF NOT EXISTS idx_cc_active_lookup
  ON public.coppa_consents (family_id, child_member_id)
  WHERE revoked_at IS NULL AND superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cc_scheduled_deletion
  ON public.coppa_consents (scheduled_deletion_at)
  WHERE deletion_completed_at IS NULL;

-- At most one active consent per child.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cc_active_per_child
  ON public.coppa_consents (child_member_id)
  WHERE revoked_at IS NULL AND superseded_at IS NULL;

DO $$ BEGIN
  CREATE TRIGGER trg_cc_updated_at
    BEFORE UPDATE ON public.coppa_consents
    FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.coppa_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cc_select_mom" ON public.coppa_consents
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE: RLS scopes to mom's own family; column-level GRANT (below) further
-- restricts WHICH columns she can actually change. consented_at,
-- consent_version, acknowledged_sections, and every audit field stay
-- immutable to her regardless of what she sends in the request body.
DO $$ BEGIN
  CREATE POLICY "cc_update_mom_own_family" ON public.coppa_consents
    FOR UPDATE TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    ) WITH CHECK (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- No DELETE policy exists at all — never removable by anyone.

-- Column-level privilege guard: REVOKE the blanket UPDATE grant PostgREST
-- assumes, then GRANT UPDATE on only the three revocation fields. SELECT
-- stays fully open (all columns readable per the "mom sees everything she
-- consented to" rule — nothing content-sensitive lives on this table the
-- way it does on safety_flags/lila_ethics_rejections).
REVOKE UPDATE ON public.coppa_consents FROM authenticated;
GRANT UPDATE (revoked_at, scheduled_deletion_at, revocation_reason)
  ON public.coppa_consents TO authenticated;

COMMENT ON COLUMN public.coppa_consents.revoked_at IS
  'One of the three columns authenticated (mom) may UPDATE via column-level GRANT. See table comment.';

-- ──────────────────────────────────────────────────────────────────────────
-- 5. parent_verification_attempts — every attempt, success or failure.
--    Rate-limiting source (5/hr, 20/day per parent, application-layer).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parent_verification_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_member_id         UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  attempt_type             TEXT NOT NULL CHECK (attempt_type IN ('stripe_charge')),
  status                   TEXT NOT NULL CHECK (status IN (
                              'succeeded', 'failed_declined', 'failed_network', 'failed_other'
                            )),
  stripe_payment_intent_id TEXT,
  failure_reason           TEXT,
  ip_address               TEXT,
  user_agent               TEXT,
  verification_id          UUID REFERENCES public.parent_verifications(id) ON DELETE SET NULL,
  attempted_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_verification_attempts IS
  'PRD-40. Abuse-detection + support-diagnostics log. verification_id set only when status=succeeded. Rate limit (5/hr, 20/day per parent) enforced application-layer against this table by the Slice-2 verification-intent Edge Function.';

CREATE INDEX IF NOT EXISTS idx_pva_family_time
  ON public.parent_verification_attempts (family_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pva_parent_status_time
  ON public.parent_verification_attempts (parent_member_id, status, attempted_at DESC);

ALTER TABLE public.parent_verification_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pva_select_mom" ON public.parent_verification_attempts
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- INSERT: service role only (the verification-intent Edge Function logs
-- every attempt server-side). No client write path.

-- ──────────────────────────────────────────────────────────────────────────
-- 6. parental_data_exports — background export job records.
--    INSERT is service-role only in THIS slice — the request path (rate-
--    limited to 1/child/7days) is a Slice-4 Edge Function/RPC, not a bare
--    client INSERT.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parental_data_exports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_member_id   UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  parent_member_id  UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  archive_path      TEXT,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  downloaded_at     TIMESTAMPTZ,
  ip_address        TEXT
);

COMMENT ON TABLE public.parental_data_exports IS
  'PRD-40 Parental Access Rights → Export. archive_path/completed_at NULL = still processing. Rate limit: 1 export per child per 7 days (Slice-4 Edge Function enforces against requested_at). Signed download URLs expire in 7 days; this audit row expires from the table 90 days after downloaded_at (retention sweep, Slice 4).';

CREATE INDEX IF NOT EXISTS idx_pde_family_child_time
  ON public.parental_data_exports (family_id, child_member_id, requested_at DESC);

ALTER TABLE public.parental_data_exports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pde_select_mom" ON public.parental_data_exports
    FOR SELECT TO authenticated USING (
      family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'primary_parent')
      OR EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- INSERT/UPDATE: service role only. The export-request RPC (Slice 4) runs
-- SECURITY DEFINER and enforces the rate limit before inserting.

-- ──────────────────────────────────────────────────────────────────────────
-- 7. retention_deletion_log — audit trail for every automated deletion.
--    Admin-SELECT / service-INSERT only. Mom never sees this table directly
--    (her view is coppa_consents.deletion_completion_notes, per-child).
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.retention_deletion_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_member_id     UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  source_table        TEXT NOT NULL,
  deletion_trigger    TEXT NOT NULL CHECK (deletion_trigger IN (
                         'rolling_retention', 'consent_revocation', 'storage_cleanup', 'admin_manual'
                       )),
  row_count           INTEGER NOT NULL,
  oldest_deleted_at   TIMESTAMPTZ,
  newest_deleted_at   TIMESTAMPTZ,
  job_run_id          UUID NOT NULL,
  executed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.retention_deletion_log IS
  'PRD-40 Retention Policy. Written by the three daily retention crons (rolling sweep, consent-lifecycle sweep, storage cleanup — all Slice 4) plus the deletion cascade. Admin-SELECT only; mom never reads this table directly.';

CREATE INDEX IF NOT EXISTS idx_rdl_family_child_time
  ON public.retention_deletion_log (family_id, child_member_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rdl_job_run
  ON public.retention_deletion_log (job_run_id);

ALTER TABLE public.retention_deletion_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "rdl_select_admin" ON public.retention_deletion_log
    FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- INSERT: service role only (the retention crons).

-- ──────────────────────────────────────────────────────────────────────────
-- 8. stripe_webhook_events — router-level dedup/log (decision file §3.3).
--    Shared infrastructure: PRD-40 (Slice 2) is the first consumer,
--    PRD-31's subscription webhook events inherit the same table. Purely
--    internal plumbing — no authenticated policy of any kind, no client
--    should ever read or write this table.
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id      TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  purpose       TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
                   'received', 'processed', 'unrouted', 'error'
                 )),
  error         TEXT
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Decision file §3.3 (PRD-40-COPPA-Compliance.md). Router-level idempotency for the shared stripe-webhook-handler Edge Function: ON CONFLICT DO NOTHING short-circuit on event_id, IN ADDITION to consumer-level unique constraints (e.g. parent_verifications.stripe_payment_intent_id). Unrouted events (no handler registered for the event type + metadata.purpose) get status=unrouted and a 200 ack — never let Stripe retry-spam a purpose we do not handle. Service-role only.';

CREATE INDEX IF NOT EXISTS idx_swe_status_received
  ON public.stripe_webhook_events (status, received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM authenticated, anon;
-- No policies at all — RLS enabled with zero grants means zero access for
-- any non-service-role caller (mirrors safety_keywords, migration 100289).

-- ──────────────────────────────────────────────────────────────────────────
-- 9. Backfill coppa_age_bracket for ALL existing family_members.
--    Age-accurate via date_of_birth when present; falls back to the static
--    age snapshot; defaults 'adult' when neither is available (decision
--    file R-2). Idempotent — only touches rows still at the column default
--    with no evidence either way (re-running never overwrites a bracket a
--    human already set).
-- ──────────────────────────────────────────────────────────────────────────

UPDATE public.family_members
SET coppa_age_bracket = CASE
  WHEN date_of_birth IS NOT NULL THEN
    CASE
      WHEN date_of_birth > (CURRENT_DATE - INTERVAL '13 years') THEN 'under_13'
      WHEN date_of_birth > (CURRENT_DATE - INTERVAL '18 years') THEN '13_to_17'
      ELSE 'adult'
    END
  WHEN age IS NOT NULL THEN
    CASE
      WHEN age < 13 THEN 'under_13'
      WHEN age < 18 THEN '13_to_17'
      ELSE 'adult'
    END
  ELSE 'adult'
END
WHERE coppa_age_bracket = 'adult'  -- only rows still at the column default
  AND (date_of_birth IS NOT NULL OR age IS NOT NULL)  -- and we have evidence to act on
  AND role IN ('primary_parent', 'additional_adult', 'member', 'special_adult');
  -- role='family' (Convention #273 shadow row) is intentionally excluded —
  -- it has no age at all and must never be classified as a "child."

-- ──────────────────────────────────────────────────────────────────────────
-- 10. Seed coppa_consent_templates version 1.0.0 — DRAFT text from the
--     Attorney Review Package (claude/legal-drafts/
--     parental-consent-flow-copy-draft.md, 2026-07-04). lawyer_approved_at
--     is deliberately NULL: this is the literal dormancy gate (R-8/OD-4) —
--     no real user can be shown this version for actual consent until a
--     human lawyer's approval date is recorded against it.
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.coppa_consent_templates (
  version, section_what_we_collect, section_how_lila_uses, section_who_sees_it,
  section_your_rights, section_parent_affirmation, lawyer_approved_at, lawyer_name, notes
)
SELECT
  '1.0.0',
$section1$Because [Child Name] is under 13, U.S. federal law (COPPA) requires us to tell you exactly what we'd collect about them, get your consent, and verify you're their parent or legal guardian. Here's the complete list — this is everything:

- Their basics — the name or nickname you give them, their age, and how they fit in your family.
- Their sign-in, if you set one up — a PIN (we store only a scrambled version, never the actual number) or a secret picture they tap to sign in (we store a scrambled code, never a readable record of which picture is theirs). Behind the scenes, we also create a hidden technical login record that makes their sign-in work — it's plumbing, not a profile, and it gets deleted with everything else if you ever revoke.
- An avatar or photo, if you upload one.
- Tasks and routines you assign them, and when they check things off — including a photo of finished work, if you turn that option on.
- What they write or record in features you turn on for them — journal entries (typed or spoken; spoken entries are turned into text), goals, reflections, tracker check-ins, worksheets, and messages with family members.
- Their conversations with LiLa, our AI assistant — only if you give them LiLa access.
- Notes you write about them — like the notes in Archives you might keep about their health, schooling, or preferences.
- Allowance and reward records — points, stickers, earnings, and the like.
- The technical basics any app needs to work on their device (like a session token and the device type). We use no ad trackers and no third-party analytics — for anyone in your family, ever.

That's the whole list. If it's not on it, we don't collect it from [Child Name].$section1$,
$section2$LiLa is our AI assistant. Here's how AI features handle your child's information:

- AI works for your family, not on it. LiLa uses your family's information to answer your questions, personalize suggestions, and support your parenting — never to train AI models.
- Where processing happens. When someone in your family uses LiLa, the conversation — plus family context you've approved — is processed by our AI service providers (Anthropic, via a routing service called OpenRouter, and OpenAI for voice-to-text and search relevance). They process it to generate the response and are bound by agreements limiting their use of your data to providing our service.
- Search memory stays home. The "search memory" we build from your family's items (embeddings) is stored only in our own database and is never shared.
- LiLa doesn't fish. LiLa is designed never to ask your child for personal information. What LiLa knows about [Child Name] comes from what you set up and what your child does in features you enabled — not from LiLa quizzing them.
- You hold the off switch. You can turn off LiLa (or any AI feature) for [Child Name] at any time in Settings, and their AI conversations auto-delete after 90 days regardless.$section2$,
$section3$- You see everything. As the verifying parent, you can always see what's collected about [Child Name] — including anything they mark "private" in daily views, through your Privacy & Consent page and data export. (Daily views give kids small private corners to build honest journaling habits; your formal review tools always include everything.)
- Other family members see only what you allow. Your spouse, other trusted adults, and siblings see [Child Name]'s information only as far as the permissions you grant.
- We never sell [Child Name]'s information. Ever.
- No advertisers, no marketers, no data brokers. None of them get your child's information, full stop.
- The only outside companies that touch it are the ones that run the platform for us, under contract: Supabase (database and storage), Vercel (hosting), the AI providers from Section 2, and Stripe (which processes your verification charge — your card details go to Stripe, never to us). They may use your family's data only to provide our service.
- Law enforcement gets information only through valid legal process, and we'll tell you if we're ever required to hand something over unless the law forbids us from telling you.$section3$,
$section4$These aren't buried-in-the-fine-print rights. They're buttons in your Settings:

- See it all. Review everything collected about [Child Name], any time, in their detail view and your Privacy & Consent page.
- Take a copy. Export all of [Child Name]'s data as a readable archive, emailed to you.
- Fix or remove pieces. Edit or delete individual records whenever you like.
- Turn features off. Stop collection for any feature — including LiLa — per child, any time.
- Walk away cleanly. Revoke your consent for [Child Name] entirely. Their data is deleted after a 14-day grace window (in case you tapped by accident), and revoking for one child never touches your other children's data.
- Reach a human. Contact Three Little Lanterns LLC directly about any privacy concern: [privacy email — FOUNDER INPUT NEEDED], [phone — FOUNDER INPUT NEEDED], [mailing address — FOUNDER INPUT NEEDED].

One more promise: we never require [Child Name] to hand over more information than an activity actually needs in order to participate.$section4$,
$section5$I affirm that I am the parent or legal guardian of [Child Name] and of every child I add to this family, and I consent to the collection, use, and disclosure of their personal information as described in Sections 1-4.

To confirm you're an adult, federal law lets us use a small payment-card charge — so we'll charge your card $1.00, one time. You won't be charged again when you add more children. It will show up on your statement as MYAIM VERIFY, and we'll email you a receipt along with a copy of everything you just read.

By tapping Verify & Continue, you authorize a one-time, non-refundable $1.00 verification charge to the card above.$section5$,
  NULL,
  NULL,
  'DRAFT — pending attorney review. Source: claude/legal-drafts/parental-consent-flow-copy-draft.md (Attorney Review Package, 2026-07-05). This version cannot be shown to any real (non-founder) user for actual consent until lawyer_approved_at is set — see decision file R-8/OD-4 dormant-block behavior and Screen 8 disclosure copy. [FOUNDER INPUT NEEDED]: privacy email/phone/mailing address placeholders in section_your_rights must be filled before approval.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.coppa_consent_templates WHERE version = '1.0.0'
);

-- ──────────────────────────────────────────────────────────────────────────
-- 11. Feature keys — coppa_consent_review, coppa_consent_revoke. Never
--     tier-gated (PRD: "COPPA rights cannot be tier-gated" — both return
--     true at every tier, at all times). Registered for role_group 'mom'
--     only — every other role sees zero COPPA UI (PRD §Visibility &
--     Permissions).
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('coppa_consent_review', 'Privacy & Consent (Review)', 'Settings -> Privacy & Consent: mom''s verification history and per-child consent records, audit-replay of the exact disclosure text she agreed to. Never tier-gated -- COPPA rights cannot be paywalled.', 'PRD-40'),
  ('coppa_consent_revoke', 'Privacy & Consent (Revoke)', 'Ability to revoke COPPA consent for a specific child and start the 14-day deletion grace period, with undo. Never tier-gated.', 'PRD-40')
ON CONFLICT (feature_key) DO NOTHING;

DO $$
DECLARE
  v_essential UUID;
BEGIN
  SELECT id INTO v_essential FROM public.subscription_tiers WHERE slug = 'essential' LIMIT 1;

  IF v_essential IS NOT NULL THEN
    INSERT INTO public.feature_access_v2 (feature_key, role_group, minimum_tier_id, is_enabled)
    VALUES
      ('coppa_consent_review', 'mom', v_essential, true),
      ('coppa_consent_revoke', 'mom', v_essential, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 12. Verification block.
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_tables INTEGER;
  v_backfill_under13 INTEGER;
  v_backfill_13_17 INTEGER;
  v_backfill_adult INTEGER;
  v_template_seeded INTEGER;
  v_feature_keys INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN (
    'coppa_consent_templates', 'parent_verifications', 'coppa_consents',
    'parent_verification_attempts', 'parental_data_exports',
    'retention_deletion_log', 'stripe_webhook_events'
  );

  SELECT COUNT(*) INTO v_backfill_under13 FROM public.family_members WHERE coppa_age_bracket = 'under_13';
  SELECT COUNT(*) INTO v_backfill_13_17 FROM public.family_members WHERE coppa_age_bracket = '13_to_17';
  SELECT COUNT(*) INTO v_backfill_adult FROM public.family_members WHERE coppa_age_bracket = 'adult';

  SELECT COUNT(*) INTO v_template_seeded FROM public.coppa_consent_templates WHERE version = '1.0.0';
  SELECT COUNT(*) INTO v_feature_keys FROM public.feature_key_registry WHERE feature_key IN ('coppa_consent_review', 'coppa_consent_revoke');

  IF v_tables <> 7 THEN
    RAISE EXCEPTION 'Expected 7 PRD-40 tables, found %', v_tables;
  END IF;
  IF v_template_seeded <> 1 THEN
    RAISE EXCEPTION 'coppa_consent_templates version 1.0.0 not seeded (found %)', v_template_seeded;
  END IF;
  IF v_feature_keys <> 2 THEN
    RAISE EXCEPTION 'Expected 2 PRD-40 feature keys, found %', v_feature_keys;
  END IF;

  RAISE NOTICE '[100305] PRD-40 tables created: %', v_tables;
  RAISE NOTICE '[100305] coppa_age_bracket backfill — under_13: %, 13_to_17: %, adult: %', v_backfill_under13, v_backfill_13_17, v_backfill_adult;
  RAISE NOTICE '[100305] coppa_consent_templates 1.0.0 seeded, lawyer_approved_at NULL (dormant): %', v_template_seeded;
  RAISE NOTICE '[100305] feature keys registered: %', v_feature_keys;
END $$;

COMMIT;
