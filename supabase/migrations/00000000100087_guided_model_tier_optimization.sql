-- PRD-25: Optimize model tiers for knowledge-based AI tools
-- Decision Guide and Gratitude are framework-driven — Haiku handles them well.
-- Sonnet preserved for relationship/emotion tools (Mediator, Higgins Say/Navigate).

UPDATE lila_guided_modes
SET model_tier = 'haiku'
WHERE mode_key IN ('decision_guide', 'gratitude')
  AND model_tier = 'sonnet';
