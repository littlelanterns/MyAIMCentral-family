-- ============================================================================
-- Migration: PRD-31 Slice 2 fix — founding_codes.minted_by must be nullable
-- ============================================================================
-- Found live during the Slice-2 E2E suite run (2026-09-11): migration 100334
-- declared `minted_by UUID NOT NULL REFERENCES auth.users(id)` and
-- mint_founding_code() unconditionally inserts `auth.uid()` into it. For an
-- AUTHENTICATED staff caller this is fine — auth.uid() resolves to their real
-- user id. But the function's own gate deliberately ALSO permits
-- `auth.role() = 'service_role'` callers (the migration's own header comment:
-- "the seat mints on the founder's word via the RPC" — i.e. calling this via
-- a service-role client before Slice 6's admin UI exists is the PRIMARY
-- near-term usage, not an edge case). auth.uid() is NULL for a service-role
-- invocation (there is no JWT, hence no "current user"), which violated the
-- NOT NULL constraint and made the sanctioned service-role calling pattern
-- fail every time: "null value in column \"minted_by\" ... violates not-null
-- constraint" (23502).
--
-- Fix: make minted_by nullable. NULL now legitimately means "minted via a
-- service-role call (the seat, on the founder's behalf) rather than by an
-- identified staff user" — an honest representation of that calling pattern,
-- not a loss of audit trail for the case that actually has one (an
-- authenticated staff session still gets its real auth.uid() recorded).
-- ============================================================================

ALTER TABLE public.founding_codes ALTER COLUMN minted_by DROP NOT NULL;

COMMENT ON COLUMN public.founding_codes.minted_by IS
  'PRD-31 Slice 2. auth.users id of the staff session that minted this code, or NULL when minted via a service-role call (the seat, on the founder''s word, per the mint_founding_code() header comment) — the primary near-term calling pattern before Slice 6''s admin UI exists.';

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'founding_codes' AND column_name = 'minted_by' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'founding_codes.minted_by is still NOT NULL';
  END IF;
  RAISE NOTICE 'migration 100336 verification passed';
END $verify$;
