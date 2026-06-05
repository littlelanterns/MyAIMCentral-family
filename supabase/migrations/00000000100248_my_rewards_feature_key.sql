-- View As Identity-Scope Architecture (Worker 4) — My Rewards stub feature key.
--
-- Registers the kid-facing `my_rewards_page` feature key so the /my-rewards
-- route's <PlannedExpansionCard> has a registry entry to render against and so
-- the sidebar "My Rewards" entry (gated per-child by
-- family_members.preferences.show_my_rewards, founder Q2a) has a stable key.
--
-- Number 100248 deliberately skips 100247, which is reserved by the pending
-- (pre-build, not-yet-dispatched) "Member-Day Task State Canonical Source"
-- build. Idempotent — safe to re-run.
--
-- Tier assignment (feature_access_v2) is intentionally deferred: during beta
-- useCanAccess() returns true for everything (Convention #10), and the real
-- visibility gate for this surface is the per-child show_my_rewards preference,
-- not a tier threshold. Matches how prior stub keys (e.g. icon_launcher_widget,
-- migration 100233) were registered.

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  (
    'my_rewards_page',
    'My Rewards',
    'Kid-facing rewards surface — shows only what this child has earned (prizes, allowance balance, money for tasks). Counterpart to mom''s Prize Board. Visibility gated per-child via preferences.show_my_rewards.',
    'PRD-02 / PRD-28 (View As Identity-Scope)'
  )
ON CONFLICT (feature_key) DO NOTHING;
