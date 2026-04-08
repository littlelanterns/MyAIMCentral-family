#!/usr/bin/env node
// Build M Sub-phase A — Generate visual_schedule seed SQL from live DB JSON dump
//
// Reads:  scripts/build-m-seeds/visual_schedule_dump.json (output of supabase db query)
// Writes: scripts/build-m-seeds/visual_schedule.sql
//
// Per A2 hybrid decision: dump 328 rows WITHOUT embeddings (embedding column NULL).
// The migration uses ON CONFLICT DO NOTHING so it's a no-op against the live DB
// (where these rows already exist) and a clean seed against fresh dev environments.

const fs = require('fs')
const path = require('path')

const DUMP_PATH = path.join(__dirname, 'build-m-seeds', 'visual_schedule_dump.json')
const OUT_PATH = path.join(__dirname, 'build-m-seeds', 'visual_schedule.sql')

const dump = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf8'))
const rows = dump.rows
console.log(`Loaded ${rows.length} visual_schedule rows from dump`)

function sqlString(s) {
  if (s === null || s === undefined) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlUuid(s) {
  if (s === null || s === undefined) return 'NULL'
  return `'${s}'::uuid`
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return 'NULL'
  // Tags are arrays — store as JSONB
  return `${sqlString(JSON.stringify(obj))}::jsonb`
}

function sqlTextArray(items) {
  if (items === null || items === undefined) return 'NULL'
  if (!Array.isArray(items) || items.length === 0) return `'{}'::text[]`
  // PostgreSQL array literal: '{val1,val2}' — quote individual values that contain special chars
  const escaped = items.map((s) => {
    const str = String(s)
    if (/[,"\s\\{}]/.test(str)) {
      return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    }
    return str
  }).join(',')
  return `'{${escaped}}'::text[]`
}

const valueLines = []
for (const r of rows) {
  // Column order: id, feature_key, variant, category, size_512_url, size_128_url, size_32_url,
  //               description, generation_prompt, tags, vibe_compatibility, display_name,
  //               assigned_to, status
  // (embedding NOT included — will be NULL by default; backfilled separately)
  const cols = [
    sqlUuid(r.id),
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
  ]
  valueLines.push(`  (${cols.join(', ')})`)
}

const sql = `-- ============================================================
-- Build M Sub-phase A — visual_schedule library seed (A2 hybrid)
-- ============================================================
-- Per addendum §16.2 Gap #1 + addendum question A2 (hybrid decision):
-- The 328 visual_schedule rows in production were added by an external
-- asset pipeline that is not in git. This INSERT block makes them
-- reproducible from versioned migrations going forward.
--
-- WITHOUT EMBEDDINGS — embedding column stays NULL on these inserts.
-- Tag-based search via searchVisualScheduleAssets() works immediately
-- in any environment. Embedding-based search via match_assets() works
-- only after the embeddings are backfilled (separate manual process).
--
-- ON CONFLICT DO NOTHING — this migration is a no-op against the live
-- DB where these rows already exist with embeddings populated. It only
-- inserts rows in fresh dev environments.
-- ============================================================

INSERT INTO public.platform_assets (
  id, feature_key, variant, category,
  size_512_url, size_128_url, size_32_url,
  description, generation_prompt,
  tags, vibe_compatibility,
  display_name, assigned_to, status
) VALUES
${valueLines.join(',\n')}
ON CONFLICT (feature_key, variant, category) DO NOTHING;
`

fs.writeFileSync(OUT_PATH, sql)
const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1)
console.log(`Wrote ${OUT_PATH} (${sizeKb} KB, ${rows.length} value rows)`)
