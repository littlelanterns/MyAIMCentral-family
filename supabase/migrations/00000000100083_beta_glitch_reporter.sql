-- Beta Glitch Reporter — standalone beta utility
-- Simplified feedback capture for family beta testing
-- Full feedback system in PRD-32 will absorb this table

-- ─── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_glitch_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Who submitted
  user_id UUID NOT NULL REFERENCES auth.users(id),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID REFERENCES family_members(id),
  shell_type TEXT,
  display_name TEXT,

  -- What they described
  what_doing TEXT NOT NULL,
  what_tried TEXT NOT NULL,
  what_happened TEXT NOT NULL,
  what_expected TEXT NOT NULL,

  -- Optional user-attached image
  user_image_url TEXT,

  -- Auto-captured diagnostics
  screenshot_data_url TEXT,
  current_route TEXT,
  browser_info JSONB,
  console_errors JSONB,
  recent_routes JSONB,

  -- Admin fields (PRD-32 future)
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE beta_glitch_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own glitch reports"
  ON beta_glitch_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own glitch reports"
  ON beta_glitch_reports FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_beta_glitch_reports_status ON beta_glitch_reports(status);
CREATE INDEX idx_beta_glitch_reports_family ON beta_glitch_reports(family_id);
CREATE INDEX idx_beta_glitch_reports_created ON beta_glitch_reports(created_at DESC);

-- ─── Storage bucket ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beta-glitch-images',
  'beta-glitch-images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated upload, public read
CREATE POLICY "Authenticated users can upload glitch images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'beta-glitch-images');

CREATE POLICY "Public can read glitch images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'beta-glitch-images');
