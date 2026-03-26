-- PRD-34 Phase 34C: Add disclaimer_shown tracking to board_sessions
ALTER TABLE public.board_sessions
  ADD COLUMN IF NOT EXISTS disclaimer_shown BOOLEAN NOT NULL DEFAULT false;
