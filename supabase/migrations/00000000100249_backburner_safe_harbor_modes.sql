-- ============================================================================
-- Migration: Backburner Safe Harbor — deactivate the 4 guided modes
-- Date: 2026-06-09
-- Decision: Founder backburnered Safe Harbor (PRD-20) on 2026-06-09.
--   Rationale: dedicated emotional-processing space is better served by other
--   platforms; the moral responsibility of doing it right doesn't fit a product
--   where it isn't the primary focus. The platform's safety story remains:
--   global crisis override (Convention #7), PRD-30 safety monitoring (still
--   roadmapped), and LiLa's bridge-to-human posture.
--   This resolves Follow-Up Build C (Safe Harbor decommission decision) from
--   the View-As Identity-Scope close-out.
--
-- Scope: DATA-ONLY deactivation. No tables dropped, no columns removed.
--   The defensive plumbing stays in place intentionally:
--   - lila_conversations.is_safe_harbor column (Convention #6/#243 filters)
--   - context-assembly Safe Harbor exclusion
--   - View-As PRIVACY_EXCLUSIONS / PRIVACY_ROUTE_MAP entries
--   These cost nothing and protect any stray data. Reactivation = flip
--   is_active back to true.
--
-- Idempotent: safe to re-run.
-- See: claude/feature-decisions/Safe-Harbor-Backburner-Decision.md
-- ============================================================================

UPDATE lila_guided_modes
SET is_active = false
WHERE mode_key IN (
  'safe_harbor',
  'safe_harbor_guided',
  'safe_harbor_orientation',
  'safe_harbor_literacy'
)
AND is_active = true;
