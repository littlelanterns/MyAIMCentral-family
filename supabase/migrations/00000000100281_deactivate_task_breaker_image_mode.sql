-- ============================================================================
-- Migration: Deactivate task_breaker_image guided mode
-- Date: 2026-07-02
-- Build: SAFETY-BETA-GATE Slice A
--
-- Decision: task_breaker_image is a stray lila_guided_modes registration.
-- Task Breaker (both text and image modes) is a Category 2 native utility
-- tool (Convention #248) — it has its own dedicated Edge Function
-- (task-breaker/index.ts, handles both modes via image_base64 presence) and
-- is invoked directly by the client (StandaloneTaskBreakerModal / TaskBreaker
-- component), never routed through lila-chat. Migration 00000000100231
-- already deactivated the sibling 'task_breaker' row for exactly this reason
-- ("architecturally wrong... not a LiLa mode, it's a standalone utility").
-- task_breaker_image was left active by oversight — this migration brings it
-- into consistency with its sibling (founder decision, Safety-Beta-Gate
-- pre-build §7 item 7).
--
-- No vault_items row references task_breaker_image as guided_mode_key (grep
-- verified against all migrations), so no vault entry cleanup is needed —
-- unlike 100231, which also had to null out a vault_items.guided_mode_key.
--
-- Scope: DATA-ONLY deactivation. No tables dropped, no columns removed.
-- Idempotent: safe to re-run.
-- ============================================================================

UPDATE lila_guided_modes
SET is_active = false
WHERE mode_key = 'task_breaker_image'
  AND is_active = true;
