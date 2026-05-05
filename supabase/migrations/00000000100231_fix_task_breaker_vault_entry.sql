-- Phase 3.8 Worker A: Fix Task Breaker vault entry routing
-- Task Breaker is a Category 2 native utility tool (Convention 248) — it has its own
-- dedicated Edge Function and should NOT route through lila-chat. The guided_mode_key
-- was incorrectly set, causing the Vault launch to open a LiLa conversation instead
-- of the working StandaloneTaskBreakerModal.

-- 1. Remove guided_mode_key from the vault_items row so it stops routing through lila-chat
UPDATE vault_items
SET guided_mode_key = NULL
WHERE detail_title = 'Task Breaker'
  AND content_type = 'ai_tool'
  AND guided_mode_key = 'task_breaker';

-- 2. Deactivate the task_breaker row in lila_guided_modes since it's architecturally wrong
-- Task Breaker is not a LiLa mode, it's a standalone utility (Convention 248)
UPDATE lila_guided_modes
SET is_active = false
WHERE mode_key = 'task_breaker';
