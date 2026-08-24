-- ============================================================================
-- PRD-40: COPPA Compliance — Slice 4, Part 2 — private export storage bucket
-- ============================================================================
-- `coppa-exports` holds the per-child data-export ZIP archives (PRD Parental
-- Data Export flow). Private bucket, ZERO storage.objects policies for any
-- authenticated/anon role — mirrors the stripe_webhook_events "RLS enabled,
-- no grants at all = zero access for any non-service-role caller" pattern
-- (migration 100305). Mom never reads this bucket directly; she only ever
-- receives a signed, 7-day-expiring URL minted server-side by the
-- coppa-export-child-data Edge Function using the service-role key (which
-- bypasses RLS/bucket-policy entirely, same as every other service-role
-- Storage write in this codebase).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coppa-exports', 'coppa-exports', false, 104857600,
  ARRAY['application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Deliberately no CREATE POLICY statements here. RLS is already enabled
-- platform-wide on storage.objects (Supabase default); zero policies for
-- this bucket_id means zero client access, by design.

DO $$
DECLARE
  v_bucket INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bucket FROM storage.buckets WHERE id = 'coppa-exports';
  IF v_bucket <> 1 THEN
    RAISE EXCEPTION 'coppa-exports bucket not created';
  END IF;
  RAISE NOTICE '[100320] coppa-exports bucket exists (private, service-role only): %', v_bucket;
END $$;
