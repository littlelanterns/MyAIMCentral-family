#!/usr/bin/env node
// Build M Sub-phase B — Generate INSERT VALUES SQL from ghi-icons.json
//
// Reads:  scripts/build-m-seeds/ghi-icons.json
// Writes: supabase/migrations/00000000100117_visual_schedule_ghi.sql
//
// The output is a single INSERT block with ON CONFLICT DO NOTHING.
// 45 new rows across hygiene gap-fill + sports + music instruments.
// Idempotent — safe to run in any environment.

const fs = require('fs')
const path = require('path')

const IN_PATH = path.join(__dirname, 'build-m-seeds', 'ghi-icons.json')
const OUT_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '00000000100117_visual_schedule_ghi.sql',
)

const rows = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'))
console.log('Loaded ' + rows.length + ' rows from ' + IN_PATH)

function sqlString(s) {
  if (s === null || s === undefined) return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return 'NULL'
  return sqlString(JSON.stringify(obj)) + '::jsonb'
}

function sqlTextArray(items) {
  if (items === null || items === undefined) return 'NULL'
  if (!Array.isArray(items) || items.length === 0) return "'{}'::text[]"
  const escaped = items
    .map(s => {
      const str = String(s)
      if (/[,"\s\\{}]/.test(str)) {
        return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
      }
      return str
    })
    .join(',')
  return "'{" + escaped + "}'::text[]"
}

function sqlHalfvec(arr) {
  if (!Array.isArray(arr) || arr.length !== 1536) {
    throw new Error('Bad embedding length: ' + (arr && arr.length))
  }
  const compact = arr.map(n => n.toFixed(6)).join(',')
  return "'[" + compact + "]'::halfvec(1536)"
}

const valueLines = []
for (const r of rows) {
  const cols = [
    sqlString(r.feature_key),
    sqlString(r.variant),
    sqlString(r.category),
    sqlString(r.size_512_url),
    sqlString(r.size_128_url),
    sqlString(r.size_32_url),
    sqlString(r.description),
    sqlString(r.generation_prompt),
    sqlJsonb(r.tags),
    sqlTextArray(r.vibe_compatibility),
    sqlString(r.display_name),
    sqlString(r.assigned_to),
    sqlString(r.status),
    sqlHalfvec(r.embedding),
  ]
  valueLines.push('  (' + cols.join(', ') + ')')
}

const sql = `-- ============================================================
-- Build M Sub-phase B — visual_schedule Grids G/H/I seed (with embeddings)
-- ============================================================
-- 45 paper-craft icons across 3 grids (Manus commits 10bc79a + f6bc5c5):
--   Grid G — Sports (girls + boys, gender-balanced)
--   Grid H — Music instruments (most instrument-only, clean at small sizes)
--   Grid I — Hygiene & Routine gap-fill (explicit _boy / _girl versions
--            of brush teeth, comb hair, wash hands, shower, etc.)
--
-- All rows use variant "B" (Manus naming: -1 suffix → B).
-- 3 subjects already existed in earlier seeds and were skipped by the
-- ingestion script (hiking, soccer, swimming).
--
-- Pipeline (run during Sub-phase B):
--   1. scripts/ingest-ghi-icons.cjs read each .jpg, called describe-vs-icon
--      Edge Function (Sonnet vision) for description + suggested_tags,
--      called embed-text-admin (OpenAI text-embedding-3-small) for the
--      1536-dim embedding, uploaded the .jpg to Supabase Storage at
--      platform-assets/visual-schedule/512/, and wrote
--      scripts/build-m-seeds/ghi-icons.json
--   2. scripts/generate-ghi-icons-sql.cjs converted that JSON to this
--      SQL VALUES block
--   3. scripts/insert-ghi-icons-to-db.cjs applied the rows to the live
--      DB directly (this migration mirrors that for fresh-env rebuilds)
--
-- Storage URLs are deterministic and already populated in production.
-- Idempotent via ON CONFLICT (feature_key, variant, category) DO NOTHING.
-- ============================================================

INSERT INTO public.platform_assets (
  feature_key, variant, category,
  size_512_url, size_128_url, size_32_url,
  description, generation_prompt,
  tags, vibe_compatibility,
  display_name, assigned_to, status,
  embedding
) VALUES
${valueLines.join(',\n')}
ON CONFLICT (feature_key, variant, category) DO NOTHING;
`

fs.writeFileSync(OUT_PATH, sql)
const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1)
console.log('Wrote ' + OUT_PATH + ' (' + sizeKb + ' KB, ' + rows.length + ' value rows)')
