#!/usr/bin/env node
/**
 * Generate migration 00000000100118_visual_schedule_ghi_collision_fix.sql
 * from ghi-collision-fix.json. 3 additional rows for hiking/soccer/swimming
 * stored under feature_key _D suffix (4th image slot) with variant='B'.
 */
const fs = require('fs')
const path = require('path')

const IN_PATH = path.join(__dirname, 'build-m-seeds', 'ghi-collision-fix.json')
const OUT_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '00000000100118_visual_schedule_ghi_collision_fix.sql',
)

const rows = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'))

function sqlString(s) {
  if (s == null) return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}
function sqlJsonb(obj) {
  if (obj == null) return 'NULL'
  return sqlString(JSON.stringify(obj)) + '::jsonb'
}
function sqlTextArray(items) {
  if (items == null) return 'NULL'
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
    throw new Error('Bad embedding length')
  }
  return "'[" + arr.map(n => n.toFixed(6)).join(',') + "]'::halfvec(1536)"
}

const valueLines = rows.map(r => {
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
  return '  (' + cols.join(', ') + ')'
})

const sql = `-- ============================================================
-- Build M Sub-phase B — Grid G/H/I collision-fix re-ingestion
-- ============================================================
-- 3 additional paper-craft icons for subjects whose A/B/C variant slots
-- were already taken in an earlier seed: hiking, soccer, swimming.
--
-- Convention: feature_key suffix _D = 4th image for this subject, but
-- variant='B' to satisfy the existing CHECK (variant IN ('A','B','C'))
-- constraint on platform_assets. This matches the precedent set by
-- vs_dress_jacket_D (also stored with variant='B').
--
-- Pipeline: scripts/ingest-ghi-collision-fix.cjs generated vision
-- descriptions + embeddings and uploaded the images to Supabase Storage.
-- This migration mirrors the live DB state for fresh-environment rebuilds.
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
console.log('Wrote ' + OUT_PATH + ' (' + rows.length + ' value rows)')
