-- MyAIM Central v2 — Smart Notepad PRD-08 schema enhancements
-- Adds missing columns to notepad_tabs, notepad_extracted_items, notepad_routing_stats

-- ============================================================
-- notepad_tabs — add status tracking, source tracking, sort order
-- ============================================================

ALTER TABLE public.notepad_tabs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'routed', 'archived')),
  ADD COLUMN IF NOT EXISTS routed_to TEXT,
  ADD COLUMN IF NOT EXISTS routed_reference_id UUID,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'voice', 'edit_in_notepad', 'lila_optimizer')),
  ADD COLUMN IF NOT EXISTS source_reference_id UUID,
  ADD COLUMN IF NOT EXISTS is_auto_named BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Default content to empty string for NOT NULL behavior
ALTER TABLE public.notepad_tabs ALTER COLUMN content SET DEFAULT '';

-- Better indexes for active tabs and history
CREATE INDEX IF NOT EXISTS idx_nt_active
  ON public.notepad_tabs (member_id, status, sort_order)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_nt_history
  ON public.notepad_tabs (member_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_nt_status_routed
  ON public.notepad_tabs (member_id, status, routed_to);

-- ============================================================
-- notepad_extracted_items — add AI extraction fields
-- ============================================================

ALTER TABLE public.notepad_extracted_items
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'general'
    CHECK (item_type IN (
      'action_item', 'reflection', 'revelation', 'value', 'victory',
      'trackable', 'meeting_followup', 'list_item', 'general'
    )),
  ADD COLUMN IF NOT EXISTS suggested_destination TEXT,
  ADD COLUMN IF NOT EXISTS actual_destination TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS routed_reference_id UUID;

-- Update status constraint to include 'skipped'
ALTER TABLE public.notepad_extracted_items DROP CONSTRAINT IF EXISTS notepad_extracted_items_status_check;
ALTER TABLE public.notepad_extracted_items
  ADD CONSTRAINT notepad_extracted_items_status_check
  CHECK (status IN ('pending', 'routed', 'skipped', 'dismissed'));

-- ============================================================
-- notepad_routing_stats — add unique constraint
-- ============================================================

ALTER TABLE public.notepad_routing_stats
  ADD CONSTRAINT idx_nrs_unique UNIQUE (member_id, destination);

-- ============================================================
-- Additional feature keys
-- ============================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source) VALUES
  ('notepad_ai_titles', 'Notepad AI Titles', 'AI auto-titling of notepad tabs', 'PRD-08'),
  ('journal_ai_context', 'Journal AI Context', 'Journal entries feeding LiLa context', 'PRD-08')
ON CONFLICT (feature_key) DO NOTHING;
