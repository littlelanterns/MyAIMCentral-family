#!/usr/bin/env node
// ============================================================================
// Build M Sub-phase B — visual_schedule Grids G/H/I icon ingestion
// ============================================================================
//
// Adapted verbatim from ingest-cdef-icons.cjs. Ingests the gender-balanced
// hygiene/routine + sports + music icons the user pushed in commits
// 10bc79a (Grid G/H original) and f6bc5c5 (Grid G2/H2/I clean versions).
//
// Reads:  seed-assets/visual-schedule-icons-ghi/*.jpg (48 files, all -1 variant)
// Writes: scripts/build-m-seeds/ghi-icons.json
//
// Pipeline per file:
//   1. Read the .jpg and base64 encode
//   2. Call describe-vs-icon Edge Function (Sonnet vision) for description + tags
//   3. Call embed-text-admin Edge Function for 1536-dim embedding
//   4. Upload the .jpg to Supabase Storage at:
//      platform-assets/visual-schedule/512/vs_{subject}_B.jpg
//   5. Append row spec to the JSON output
//
// All files use suffix "-1" → variant "B" (per the Manus commits).
// Variant A / C are not generated for Grid G/H/I.
//
// Skips subjects that already exist in the DB via a pre-flight check
// (hiking, soccer, swimming already shipped in earlier grids).
//
// Idempotent:
//   - Description cache at scripts/build-m-seeds/ghi-descriptions-cache.json
//     prevents re-calling Sonnet vision on re-runs
//   - Storage uploads use upsert: true
//   - SQL generation uses ON CONFLICT DO NOTHING
// ============================================================================

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const ASSETS_DIR = path.join(__dirname, '..', 'seed-assets', 'visual-schedule-icons-ghi')
const OUT_DIR = path.join(__dirname, 'build-m-seeds')
const OUT_JSON = path.join(OUT_DIR, 'ghi-icons.json')
const DESC_CACHE = path.join(OUT_DIR, 'ghi-descriptions-cache.json')
const STORAGE_BUCKET = 'platform-assets'
const STORAGE_PATH_PREFIX = 'visual-schedule/512'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

// ── Helpers ───────────────────────────────────────────────────────────────

function listIconFiles() {
  return fs
    .readdirSync(ASSETS_DIR)
    .filter(f => f.startsWith('vs_') && f.endsWith('.jpg'))
    .sort()
}

function parseFilename(filename) {
  const m = filename.match(/^vs_(.+)-(\d+)\.jpg$/)
  if (!m) throw new Error('Bad filename: ' + filename)
  return {
    subject: m[1],
    variantSuffix: m[2],
    variant: m[2] === '1' ? 'B' : m[2] === '2' ? 'A' : null,
  }
}

function buildFeatureKey(subject, variant) {
  return 'vs_' + subject + '_' + variant
}

function buildStorageFilename(subject, variant) {
  return 'vs_' + subject + '_' + variant + '.jpg'
}

function buildPublicUrl(filename) {
  return (
    SUPABASE_URL + '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + STORAGE_PATH_PREFIX + '/' + filename
  )
}

function titleCase(s) {
  return s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildDisplayName(subject, variant) {
  return titleCase(subject) + ' — ' + variant
}

function buildAssignedTo(subject) {
  return 'visual_schedule:vs_' + subject
}

async function callDescribeVsIcon(imageBase64, subjectName) {
  const response = await fetch(SUPABASE_URL + '/functions/v1/describe-vs-icon', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + SERVICE_ROLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: 'image/jpeg',
      subject_name: subjectName,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error('describe-vs-icon failed (' + response.status + '): ' + text)
  }
  return response.json()
}

async function callGenerateEmbedding(text) {
  const response = await fetch(SUPABASE_URL + '/functions/v1/embed-text-admin', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + SERVICE_ROLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) {
    const text2 = await response.text()
    throw new Error('embed-text-admin failed (' + response.status + '): ' + text2)
  }
  const data = await response.json()
  if (!Array.isArray(data.embedding) || data.embedding.length !== 1536) {
    throw new Error('Bad embedding shape: ' + JSON.stringify(data).slice(0, 200))
  }
  return data.embedding
}

async function uploadToStorage(filePath, storageFilename) {
  const fileBuffer = fs.readFileSync(filePath)
  const storagePath = STORAGE_PATH_PREFIX + '/' + storageFilename
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, fileBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) {
    throw new Error('Storage upload failed for ' + storageFilename + ': ' + error.message)
  }
  return buildPublicUrl(storageFilename)
}

async function checkExistingKeys(featureKeys) {
  const { data } = await supabase
    .from('platform_assets')
    .select('feature_key')
    .eq('category', 'visual_schedule')
    .in('feature_key', featureKeys)
  return new Set((data || []).map(r => r.feature_key))
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Build M Sub-phase B — visual_schedule Grids G/H/I ingestion')
  console.log('═══════════════════════════════════════════════════════════════')

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = listIconFiles()
  console.log('Found ' + files.length + ' icon files in ' + ASSETS_DIR)

  if (files.length === 0) {
    console.error('No icons to process')
    process.exit(1)
  }

  // Pre-flight: skip any subject whose feature_key already exists
  const allKeys = files.map(f => {
    const p = parseFilename(f)
    return buildFeatureKey(p.subject, p.variant)
  })
  const existing = await checkExistingKeys(allKeys)
  console.log(existing.size + ' of ' + files.length + ' keys already exist in DB; will skip them')

  // Load description cache
  let descCache = {}
  if (fs.existsSync(DESC_CACHE)) {
    try {
      descCache = JSON.parse(fs.readFileSync(DESC_CACHE, 'utf8'))
      console.log('Loaded description cache: ' + Object.keys(descCache).length + ' cached descriptions')
    } catch {
      console.log('Description cache exists but is corrupt — starting fresh')
      descCache = {}
    }
  }

  function saveCache() {
    fs.writeFileSync(DESC_CACHE, JSON.stringify(descCache, null, 2))
  }

  const rows = []
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let failures = []
  let cacheHits = 0
  let skipped = 0

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const parsed = parseFilename(filename)
    if (!parsed.variant) {
      console.error('  [' + (i + 1) + '/' + files.length + '] SKIP: ' + filename + ' — bad variant suffix')
      failures.push({ filename, error: 'bad variant suffix' })
      continue
    }

    const featureKey = buildFeatureKey(parsed.subject, parsed.variant)
    if (existing.has(featureKey)) {
      console.log('  [' + (i + 1) + '/' + files.length + '] SKIP ' + featureKey + ' — already in DB')
      skipped++
      continue
    }

    const displayName = buildDisplayName(parsed.subject, parsed.variant)
    const storageFilename = buildStorageFilename(parsed.subject, parsed.variant)
    const filePath = path.join(ASSETS_DIR, filename)

    process.stdout.write('  [' + (i + 1) + '/' + files.length + '] ' + filename + ' → ' + featureKey + ' ... ')

    try {
      const fileBuffer = fs.readFileSync(filePath)
      const base64 = fileBuffer.toString('base64')

      let desc
      if (descCache[filename]) {
        desc = descCache[filename]
        cacheHits++
      } else {
        desc = await callDescribeVsIcon(base64, parsed.subject)
        totalInputTokens += desc.usage?.input_tokens || 0
        totalOutputTokens += desc.usage?.output_tokens || 0
        descCache[filename] = {
          description: desc.description,
          suggested_tags: desc.suggested_tags,
          usage: desc.usage,
        }
        saveCache()
      }

      const embedding = await callGenerateEmbedding(desc.description)
      const publicUrl = await uploadToStorage(filePath, storageFilename)

      rows.push({
        feature_key: featureKey,
        variant: parsed.variant,
        category: 'visual_schedule',
        size_512_url: publicUrl,
        size_128_url: publicUrl,
        size_32_url: publicUrl,
        description: desc.description,
        generation_prompt:
          'Paper-craft illustration of ' +
          displayName.replace(/ — [AB]$/, '').toLowerCase() +
          ', dimensional felt aesthetic, transparent background suitable for child task tiles.',
        tags: desc.suggested_tags,
        vibe_compatibility: ['classic_myaim'],
        display_name: displayName,
        assigned_to: buildAssignedTo(parsed.subject),
        status: 'active',
        embedding,
      })

      console.log('✓')
    } catch (err) {
      console.log('✗')
      console.error('        ' + err.message)
      failures.push({ filename, error: err.message })
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2))
  const sizeKb = (fs.statSync(OUT_JSON).size / 1024).toFixed(1)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Files processed:    ' + files.length)
  console.log('Skipped (existing): ' + skipped)
  console.log('Rows generated:     ' + rows.length)
  console.log('Failures:           ' + failures.length)
  console.log('Cache hits:         ' + cacheHits)
  console.log('Vision input tokens:  ' + totalInputTokens)
  console.log('Vision output tokens: ' + totalOutputTokens)
  console.log(
    'Estimated cost:     ~$' +
      (totalInputTokens / 1_000_000 * 3 + totalOutputTokens / 1_000_000 * 15).toFixed(4) +
      ' (Sonnet vision new calls only)',
  )
  console.log('Output JSON:        ' + OUT_JSON + ' (' + sizeKb + ' KB)')

  if (failures.length > 0) {
    console.log('')
    console.log('FAILURES:')
    for (const f of failures) {
      console.log('  - ' + f.filename + ': ' + f.error)
    }
    process.exit(1)
  }

  console.log('')
  console.log('✓ All icons ingested. Next: run scripts/generate-ghi-icons-sql.cjs to build the migration SQL.')
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
