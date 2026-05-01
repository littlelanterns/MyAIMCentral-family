-- Migration: Deduplicate book_discussion → book_discuss mode key (Triage Row 7, NEW-A)
--
-- Two mode keys exist for BookShelf discussion:
--   - book_discussion (migration 000007, original seed — less complete config)
--   - book_discuss   (migration 100059/100076, PRD-23 — canonical, full config)
--
-- book_discuss is authoritative: it has opening_messages, avatar_key, correct
-- context_sources, and is what all PRD docs and feature decisions reference.
--
-- This migration:
--   1. Re-points any lila_conversations using the old key to the canonical key
--   2. Deactivates the deprecated lila_guided_modes row (soft — keeps FK intact)

-- Step 1: Update any conversations that reference the deprecated mode key
UPDATE public.lila_conversations
SET guided_mode = 'book_discuss'
WHERE guided_mode = 'book_discussion';

-- Step 2: Deactivate the deprecated mode row (preserves FK references)
UPDATE public.lila_guided_modes
SET is_active = false
WHERE mode_key = 'book_discussion';
