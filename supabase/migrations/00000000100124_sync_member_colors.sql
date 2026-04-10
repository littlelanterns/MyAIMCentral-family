-- Sync assigned_color to match member_color for all family members
-- Resolves historical drift where auto-seeded assigned_color diverged from mom's picks
-- Idempotent: only updates rows where they differ
UPDATE family_members
SET assigned_color = member_color
WHERE assigned_color IS DISTINCT FROM member_color
  AND member_color IS NOT NULL;
