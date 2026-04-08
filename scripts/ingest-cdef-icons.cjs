#!/usr/bin/env node
// ============================================================================
// Build M Sub-phase A — visual_schedule Grids C/D/E/F icon ingestion pipeline
// ============================================================================
//
// One-shot script that:
//   1. Reads each .jpg in seed-assets/visual-schedule-icons-cdef/
//   2. Calls describe-vs-icon Edge Function (Sonnet vision via OpenRouter)
//      → returns description + suggested_tags
//   3. Calls generate-query-embedding Edge Function (text-embedding-3-small)
//      → returns 1536-dim embedding vector
//   4. Uploads the .jpg to Supabase Storage at:
//      platform-assets/visual-schedule/512/vs_{subject}_{B|A}.jpg
//   5. Writes a row spec to scripts/build-m-seeds/cdef-icons.json
//
// Idempotency:
//   - JSON output is rebuilt from scratch each run (no append mode)
//   - Storage uploads use upsert: true so re-runs replace existing files
//   - Migration uses ON CONFLICT DO NOTHING so DB inserts are safe to re-run
//
// Variant mapping:
//   - File suffix "-1" → variant "B" (default — every subject has one)
//   - File suffix "-2" → variant "A" (alternate, only 24 subjects have one)
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

const ASSETS_DIR = path.join(__dirname, '..', 'seed-assets', 'visual-schedule-icons-cdef')
const OUT_DIR = path.join(__dirname, 'build-m-seeds')
const OUT_JSON = path.join(OUT_DIR, 'cdef-icons.json')
const DESC_CACHE = path.join(OUT_DIR, 'cdef-descriptions-cache.json')
const STORAGE_BUCKET = 'platform-assets'
const STORAGE_PATH_PREFIX = 'visual-schedule/512'  // matches existing convention

// Build a service-role Supabase client (bypasses RLS, can upload to Storage)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

// ── Helpers ───────────────────────────────────────────────────────────────

function listIconFiles() {
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.startsWith('vs_') && f.endsWith('.jpg'))
    .sort()
}

function parseFilename(filename) {
  // vs_drink_water-1.jpg → { subject: 'drink_water', variantSuffix: '1' }
  // vs_clear_table-2.jpg → { subject: 'clear_table', variantSuffix: '2' }
  const m = filename.match(/^vs_(.+)-(\d+)\.jpg$/)
  if (!m) throw new Error(`Bad filename: ${filename}`)
  return {
    subject: m[1],
    variantSuffix: m[2],
    variant: m[2] === '1' ? 'B' : m[2] === '2' ? 'A' : null,
  }
}

function buildFeatureKey(subject, variant) {
  return `vs_${subject}_${variant}`
}

function buildStorageFilename(subject, variant) {
  return `vs_${subject}_${variant}.jpg`
}

function buildPublicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH_PREFIX}/${filename}`
}

function titleCase(s) {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildDisplayName(subject, variant) {
  return `${titleCase(subject)} — ${variant}`
}

function buildAssignedTo(subject) {
  return `visual_schedule:vs_${subject}`
}

async function callDescribeVsIcon(imageBase64, subjectName) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/describe-vs-icon`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
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
    throw new Error(`describe-vs-icon failed (${response.status}): ${text}`)
  }
  return response.json()
}

async function callGenerateEmbedding(text) {
  // Use embed-text-admin (admin-only, service-role auth) instead of
  // generate-query-embedding (which requires end-user auth and 401s
  // on service role).
  const response = await fetch(`${SUPABASE_URL}/functions/v1/embed-text-admin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) {
    const text2 = await response.text()
    throw new Error(`generate-query-embedding failed (${response.status}): ${text2}`)
  }
  const data = await response.json()
  if (!Array.isArray(data.embedding) || data.embedding.length !== 1536) {
    throw new Error(`Bad embedding shape: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return data.embedding
}

async function uploadToStorage(filePath, storageFilename) {
  const fileBuffer = fs.readFileSync(filePath)
  const storagePath = `${STORAGE_PATH_PREFIX}/${storageFilename}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, fileBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) {
    throw new Error(`Storage upload failed for ${storageFilename}: ${error.message}`)
  }
  return buildPublicUrl(storageFilename)
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Build M — visual_schedule Grids C/D/E/F ingestion')
  console.log('═══════════════════════════════════════════════════════════════')

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = listIconFiles()
  console.log(`Found ${files.length} icon files in ${ASSETS_DIR}`)

  if (files.length === 0) {
    console.error('No icons to process')
    process.exit(1)
  }

  // Load description cache (defensive: if a previous run failed mid-loop,
  // skip the vision call for any image we already have a description for)
  let descCache = {}
  if (fs.existsSync(DESC_CACHE)) {
    try {
      descCache = JSON.parse(fs.readFileSync(DESC_CACHE, 'utf8'))
      console.log(`Loaded description cache: ${Object.keys(descCache).length} cached descriptions`)
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

  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const { subject, variant } = parseFilename(filename)
    if (!variant) {
      console.error(`  [${i + 1}/${files.length}] SKIP: ${filename} — bad variant suffix`)
      failures.push({ filename, error: 'bad variant suffix' })
      continue
    }

    const featureKey = buildFeatureKey(subject, variant)
    const displayName = buildDisplayName(subject, variant)
    const storageFilename = buildStorageFilename(subject, variant)
    const filePath = path.join(ASSETS_DIR, filename)

    process.stdout.write(`  [${i + 1}/${files.length}] ${filename} → ${featureKey} ... `)

    try {
      // Step 1: read + base64 encode
      const fileBuffer = fs.readFileSync(filePath)
      const base64 = fileBuffer.toString('base64')

      // Step 2: vision description (cache-first)
      let desc
      if (descCache[filename]) {
        desc = descCache[filename]
        cacheHits++
      } else {
        desc = await callDescribeVsIcon(base64, subject)
        totalInputTokens += desc.usage?.input_tokens || 0
        totalOutputTokens += desc.usage?.output_tokens || 0
        // Cache immediately so future failures don't waste this call
        descCache[filename] = {
          description: desc.description,
          suggested_tags: desc.suggested_tags,
          usage: desc.usage,
        }
        saveCache()
      }

      // Step 3: embedding
      const embedding = await callGenerateEmbedding(desc.description)

      // Step 4: storage upload
      const publicUrl = await uploadToStorage(filePath, storageFilename)

      // Step 5: build the row spec
      rows.push({
        feature_key: featureKey,
        variant,
        category: 'visual_schedule',
        size_512_url: publicUrl,
        size_128_url: publicUrl,  // same URL — no separate 128 size yet
        size_32_url: publicUrl,   // same URL — vestigial column
        description: desc.description,
        generation_prompt: `Paper-craft illustration of ${displayName.replace(/ — [AB]$/, '').toLowerCase()}, dimensional felt aesthetic, transparent background suitable for child task tiles.`,
        tags: desc.suggested_tags,
        vibe_compatibility: ['classic_myaim'],
        display_name: displayName,
        assigned_to: buildAssignedTo(subject),
        status: 'active',
        embedding,  // 1536-dim float array
      })

      console.log('✓')
    } catch (err) {
      console.log('✗')
      console.error(`        ${err.message}`)
      failures.push({ filename, error: err.message })
    }
  }

  // Write JSON output
  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2))
  const sizeKb = (fs.statSync(OUT_JSON).size / 1024).toFixed(1)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Files processed:    ${files.length}`)
  console.log(`Rows generated:     ${rows.length}`)
  console.log(`Failures:           ${failures.length}`)
  console.log(`Cache hits (vision skipped): ${cacheHits}`)
  console.log(`Vision input tokens: ${totalInputTokens}`)
  console.log(`Vision output tokens: ${totalOutputTokens}`)
  console.log(`Estimated cost:     ~$${(totalInputTokens / 1_000_000 * 3 + totalOutputTokens / 1_000_000 * 15).toFixed(4)} (Sonnet vision new calls only)`)
  console.log(`Output JSON:        ${OUT_JSON} (${sizeKb} KB)`)

  if (failures.length > 0) {
    console.log('')
    console.log('FAILURES:')
    for (const f of failures) {
      console.log(`  - ${f.filename}: ${f.error}`)
    }
    process.exit(1)
  }

  console.log('')
  console.log('✓ All icons ingested. Next: run scripts/generate-cdef-icons-sql.cjs to build the migration SQL.')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
