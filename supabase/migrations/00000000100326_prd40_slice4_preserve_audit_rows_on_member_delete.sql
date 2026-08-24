-- ============================================================================
-- PRD-40 COPPA — Slice 4 schema correction: coppa_consents / retention_
-- deletion_log must SURVIVE the family_members row delete, not cascade with it
-- ============================================================================
-- Found live during the deletion-cascade's own E2E proof (2026-08-24):
-- `coppa_consents.child_member_id` and `retention_deletion_log.child_member_id`
-- were both created with `ON DELETE CASCADE` to family_members (migration
-- 100305). This directly contradicts the PRD/Convention #285 requirement
-- that these two rows are PERMANENT audit evidence — "coppa_consents rows are
-- preserved even after deletion_completed_at is set... the row IS the legal
-- evidence of consent and revocation timing" and "[retention_deletion_log]
-- must survive the very deletions it records, or the compliance evidence
-- disappears with the data it was proving got deleted" (childDataTables.ts's
-- own note on this exact table).
--
-- The bug fired for real in production during E2E proof — but ONLY against
-- this session's own synthetic COPPATEST fixture data (a test child inserted,
-- consented, and cascaded entirely within the Testworth fixture family; no
-- real family's consent history was ever at risk, confirmed via a zero-due-
-- rows check before every live cascade invocation this session). The
-- production `coppa_consents` table was verified empty of real rows before
-- this fix (no real family has ever completed a revocation-and-cascade
-- cycle yet — Slice 4 is the first code path capable of triggering it at
-- all). Still a genuine, must-fix-before-shipping correctness bug.
--
-- Fix: drop NOT NULL + change the FK action to ON DELETE SET NULL for both
-- child_member_id columns. After a child's cascade completes, these two
-- audit rows survive permanently with child_member_id = NULL (the family_id,
-- deletion_completed_at, deletion_completion_notes, and — for coppa_consents
-- — consent_version/acknowledged_sections/consented_at/revoked_at all remain
-- intact; only the now-meaningless FK link to a row that no longer exists is
-- cleared). `parental_data_exports.child_member_id` is deliberately NOT
-- touched here — that table has its own TIME-based 90-day-after-download
-- retention per the PRD (not "forever" like these two), so losing an export
-- audit row early via cascade is an acceptable minor inconsistency, not a
-- requirement violation.
--
-- Idempotent: safe to re-run (DO $$ EXCEPTION guards on the constraint drop).
-- ============================================================================

BEGIN;

-- ── coppa_consents.child_member_id ──
ALTER TABLE public.coppa_consents ALTER COLUMN child_member_id DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.coppa_consents DROP CONSTRAINT coppa_consents_child_member_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE public.coppa_consents
  ADD CONSTRAINT coppa_consents_child_member_id_fkey
  FOREIGN KEY (child_member_id) REFERENCES public.family_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.coppa_consents.child_member_id IS
  'PRD-40. Nullable (as of migration 100326) — set NULL when the child''s family_members row is later deleted by the consent-revocation cascade. The row itself is permanent audit evidence and must survive that deletion; only the FK link to the (now-gone) member is cleared. Never NULL for an active/in-progress consent.';

-- ── retention_deletion_log.child_member_id ──
ALTER TABLE public.retention_deletion_log ALTER COLUMN child_member_id DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.retention_deletion_log DROP CONSTRAINT retention_deletion_log_child_member_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE public.retention_deletion_log
  ADD CONSTRAINT retention_deletion_log_child_member_id_fkey
  FOREIGN KEY (child_member_id) REFERENCES public.family_members(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.retention_deletion_log.child_member_id IS
  'PRD-40. Nullable (as of migration 100326) — same reasoning as coppa_consents.child_member_id: this audit trail must outlive the family_members row deletion it records.';

-- ── Verification ──
DO $$
DECLARE
  v_cc_def TEXT;
  v_rdl_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_cc_def FROM pg_constraint WHERE conname = 'coppa_consents_child_member_id_fkey';
  SELECT pg_get_constraintdef(oid) INTO v_rdl_def FROM pg_constraint WHERE conname = 'retention_deletion_log_child_member_id_fkey';

  IF v_cc_def NOT ILIKE '%ON DELETE SET NULL%' THEN
    RAISE EXCEPTION 'coppa_consents_child_member_id_fkey is not ON DELETE SET NULL: %', v_cc_def;
  END IF;
  IF v_rdl_def NOT ILIKE '%ON DELETE SET NULL%' THEN
    RAISE EXCEPTION 'retention_deletion_log_child_member_id_fkey is not ON DELETE SET NULL: %', v_rdl_def;
  END IF;

  RAISE NOTICE '[100326] coppa_consents.child_member_id FK: %', v_cc_def;
  RAISE NOTICE '[100326] retention_deletion_log.child_member_id FK: %', v_rdl_def;
END $$;

COMMIT;
