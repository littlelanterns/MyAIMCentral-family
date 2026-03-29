-- PRD-10 Phase B-1: Best Intentions color column for analytics
-- Adds a color field so each intention can be visually distinguished in charts

ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN best_intentions.color IS 'Analytics chart color (auto-assigned from palette, user-overridable)';
