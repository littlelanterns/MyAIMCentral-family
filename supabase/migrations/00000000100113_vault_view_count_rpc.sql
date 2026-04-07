-- PRD-21A: Vault view count RPC
--
-- The Vault detail view (src/features/vault/hooks/useVaultDetail.ts:97) calls
-- supabase.rpc('increment_vault_view_count', { item_id }) on every detail open.
-- The RPC never shipped, producing a 404 on every Vault detail view. The call
-- is fire-and-forget so nothing broke, but the console noise confused debugging
-- (first spotted while tracking down the Translator launch-from-Vault bug).
--
-- This migration creates the RPC. vault_items.view_count already exists as
-- INTEGER DEFAULT 0 (unchanged since migration 00000000100039) — we just
-- increment it atomically.
--
-- Idempotent: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.increment_vault_view_count(item_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.vault_items
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE id = item_id;
$$;

-- Authenticated users can call this RPC (anyone browsing the Vault).
-- Anon cannot — we don't want unauthenticated view inflation.
GRANT EXECUTE ON FUNCTION public.increment_vault_view_count(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_vault_view_count(UUID) FROM anon, public;

COMMENT ON FUNCTION public.increment_vault_view_count(UUID) IS
  'Atomically increments vault_items.view_count for the given item. Called fire-and-forget from the Vault detail view on open.';
