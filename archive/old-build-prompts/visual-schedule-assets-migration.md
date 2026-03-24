# Claude Code Prompt — visual_schedule_assets Migration

Create a new migration file:
`supabase/migrations/00000000000025_create_visual_schedule_assets.sql`

This migration creates the `visual_schedule_assets` table to store all visual schedule images used in the app's scheduling and routine-building features. These are paper-craft illustrated images of children performing daily activities (potty, teeth brushing, bathing, getting dressed, laundry, etc.), used to build visual schedules for kids.

---

## Migration SQL

```sql
-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── visual_schedule_assets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visual_schedule_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key     TEXT NOT NULL,
  variant         TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  category        TEXT NOT NULL DEFAULT 'visual_schedule',
  batch           TEXT NOT NULL DEFAULT 'A',
  display_name    TEXT,
  description     TEXT,
  tags            JSONB DEFAULT '[]'::jsonb,
  assigned_to     TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'draft', 'archived')),

  -- Storage URLs (3 sizes)
  size_512_url    TEXT,
  size_256_url    TEXT,
  size_128_url    TEXT,

  -- Semantic search vector
  embedding       vector(1536),

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (feature_key, variant)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vsa_feature_key
  ON visual_schedule_assets (feature_key);

CREATE INDEX IF NOT EXISTS idx_vsa_category
  ON visual_schedule_assets (category);

CREATE INDEX IF NOT EXISTS idx_vsa_batch
  ON visual_schedule_assets (batch);

CREATE INDEX IF NOT EXISTS idx_vsa_status
  ON visual_schedule_assets (status);

CREATE INDEX IF NOT EXISTS idx_vsa_tags
  ON visual_schedule_assets USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_vsa_embedding
  ON visual_schedule_assets
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ─── Updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_vsa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vsa_updated_at
  BEFORE UPDATE ON visual_schedule_assets
  FOR EACH ROW EXECUTE FUNCTION update_vsa_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE visual_schedule_assets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all active assets
CREATE POLICY "Authenticated users can read active visual schedule assets"
  ON visual_schedule_assets
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Service role has full access (used by Manus pipeline and admin)
CREATE POLICY "Service role has full access to visual schedule assets"
  ON visual_schedule_assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── Semantic search RPC ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_visual_schedule_assets(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count     INT   DEFAULT 10,
  filter_batch    TEXT  DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  feature_key TEXT,
  variant     TEXT,
  batch       TEXT,
  display_name TEXT,
  description TEXT,
  tags        JSONB,
  size_512_url TEXT,
  size_256_url TEXT,
  size_128_url TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vsa.id,
    vsa.feature_key,
    vsa.variant,
    vsa.batch,
    vsa.display_name,
    vsa.description,
    vsa.tags,
    vsa.size_512_url,
    vsa.size_256_url,
    vsa.size_128_url,
    1 - (vsa.embedding <=> query_embedding) AS similarity
  FROM visual_schedule_assets vsa
  WHERE
    vsa.status = 'active'
    AND (filter_batch IS NULL OR vsa.batch = filter_batch)
    AND vsa.embedding IS NOT NULL
    AND 1 - (vsa.embedding <=> query_embedding) > match_threshold
  ORDER BY vsa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Comments ────────────────────────────────────────────────────────────────
COMMENT ON TABLE visual_schedule_assets IS
  'Paper-craft illustrated images of children performing daily activities.
   Used to build visual schedules for kids in the scheduling features.
   Organized in batches (A = Personal Care, future batches for meals, school, etc.).
   Each activity has 3 variants: A (simple), B (standard), C (detailed).';

COMMENT ON COLUMN visual_schedule_assets.feature_key IS
  'Activity identifier, e.g. vs_potty_sit, vs_teeth_brush_top, vs_bath_dry_off.
   Matches the filename without the variant suffix.';

COMMENT ON COLUMN visual_schedule_assets.variant IS
  'Complexity variant: A = simple/bold, B = standard detail, C = fully detailed scene.';

COMMENT ON COLUMN visual_schedule_assets.batch IS
  'Asset batch identifier. A = Personal Care (potty, teeth, bath, hair, dress, laundry).
   Future batches will cover meals, school, bedtime, chores, etc.';

COMMENT ON COLUMN visual_schedule_assets.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dims).
   Source: display_name + description + tags joined as phrases.
   Used by match_visual_schedule_assets() for semantic search.';

COMMENT ON FUNCTION match_visual_schedule_assets IS
  'Semantic similarity search over visual_schedule_assets using cosine distance.
   Pass a query_embedding from OpenAI text-embedding-3-small.
   Optionally filter by batch. Returns assets ranked by similarity.
   Example: find all images matching "washing hands" or "getting dressed for school".';
```

---

## Confirm When Done

Once the migration runs successfully, reply with confirmation so Manus can proceed with uploading 540 files and inserting 180 metadata rows with embeddings.
