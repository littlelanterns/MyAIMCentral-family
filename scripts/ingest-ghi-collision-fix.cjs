#!/usr/bin/env node
/**
 * One-shot re-ingestion for the 3 collision subjects from Grid G/H/I
 * (hiking, soccer, swimming) that were skipped by ingest-ghi-icons.cjs
 * because their A/B/C variant slots were already taken.
 *
 * Strategy: use feature_key suffix "_D" to mean "4th image for this subject",
 * keeping variant='B' to satisfy the existing CHECK (variant IN ('A','B','C'))
 * constraint. This matches the precedent set by vs_dress_jacket_D (also
 * stored with variant='B' but feature_key ending in _D).
 *
 * Storage files upload to vs_<subject>_D.jpg so there's no filename clash.
 */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

const ASSETS_DIR = path.join(__dirname, '..', 'seed-assets', 'visual-schedule-icons-ghi')
const OUT_DIR = path.join(__dirname, 'build-m-seeds')
const OUT_JSON = path.join(OUT_DIR, 'ghi-collision-fix.json')
const STORAGE_BUCKET = 'platform-assets'
const STORAGE_PATH_PREFIX = 'visual-schedule/512'

const COLLISION_SUBJECTS = ['hiking', 'soccer', 'swimming']

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

// ── Helpers (copied from ingest-ghi-icons.cjs) ────────────────────────────

function titleCase(s) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function callDescribeVsIcon(imageBase64, subjectName) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/describe-vs-icon', {
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
  if (!res.ok) throw new Error('describe-vs-icon failed: ' + (await res.text()))
  return res.json()
}

async function callGenerateEmbedding(text) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/embed-text-admin', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + SERVICE_ROLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('embed-text-admin failed: ' + (await res.text()))
  const data = await res.json()
  if (!Array.isArray(data.embedding) || data.embedding.length !== 1536) {
    throw new Error('Bad embedding shape')
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
  if (error) throw new Error('Storage upload failed for ' + storageFilename + ': ' + error.message)
  return SUPABASE_URL + '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + STORAGE_PATH_PREFIX + '/' + storageFilename
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Build M Sub-phase B — collision-fix re-ingestion (hiking/soccer/swimming)')
  console.log('═══════════════════════════════════════════════════════════════')

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const rows = []
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const subject of COLLISION_SUBJECTS) {
    const filename = 'vs_' + subject + '-1.jpg'
    const filePath = path.join(ASSETS_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.error('  FILE NOT FOUND: ' + filePath)
      continue
    }

    // Use feature_key _D suffix (4th image slot), variant stays 'B'
    // to satisfy platform_assets.variant CHECK (variant IN ('A','B','C'))
    const featureKey = 'vs_' + subject + '_D'
    const storageFilename = 'vs_' + subject + '_D.jpg'
    const displayName = titleCase(subject) + ' — D'

    process.stdout.write('  ' + filename + ' → ' + featureKey + ' ... ')

    try {
      const fileBuffer = fs.readFileSync(filePath)
      const base64 = fileBuffer.toString('base64')

      const desc = await callDescribeVsIcon(base64, subject)
      totalInputTokens += desc.usage?.input_tokens || 0
      totalOutputTokens += desc.usage?.output_tokens || 0

      const embedding = await callGenerateEmbedding(desc.description)
      const publicUrl = await uploadToStorage(filePath, storageFilename)

      rows.push({
        feature_key: featureKey,
        variant: 'B', // CHECK constraint requires A/B/C. _D feature_key suffix + variant='B' matches vs_dress_jacket_D precedent
        category: 'visual_schedule',
        size_512_url: publicUrl,
        size_128_url: publicUrl,
        size_32_url: publicUrl,
        description: desc.description,
        generation_prompt:
          'Paper-craft illustration of ' + titleCase(subject).toLowerCase() + ', dimensional felt aesthetic, transparent background suitable for child task tiles.',
        tags: desc.suggested_tags,
        vibe_compatibility: ['classic_myaim'],
        display_name: displayName,
        assigned_to: 'visual_schedule:vs_' + subject,
        status: 'active',
        embedding,
      })

      console.log('✓')
    } catch (err) {
      console.log('✗')
      console.error('        ' + err.message)
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2))
  console.log('\nGenerated ' + rows.length + ' rows → ' + OUT_JSON)
  console.log('Vision tokens: input=' + totalInputTokens + ' output=' + totalOutputTokens)

  // Insert directly into platform_assets
  console.log('\nInserting into platform_assets...')
  const toInsert = rows.map(r => ({
    feature_key: r.feature_key,
    variant: r.variant,
    category: r.category,
    size_512_url: r.size_512_url,
    size_128_url: r.size_128_url,
    size_32_url: r.size_32_url,
    description: r.description,
    generation_prompt: r.generation_prompt,
    tags: r.tags,
    vibe_compatibility: r.vibe_compatibility,
    display_name: r.display_name,
    assigned_to: r.assigned_to,
    status: r.status,
    embedding: '[' + r.embedding.map(n => n.toFixed(6)).join(',') + ']',
  }))

  const { error: insertErr } = await supabase.from('platform_assets').insert(toInsert)
  if (insertErr) {
    console.error('INSERT FAILED:', insertErr.message)
    process.exit(1)
  }
  console.log('✓ Inserted ' + rows.length + ' rows')

  // Verify
  const { data: verify } = await supabase
    .from('platform_assets')
    .select('feature_key, variant, display_name')
    .in('feature_key', rows.map(r => r.feature_key))
  console.log('\nVerification:')
  for (const row of verify || []) {
    console.log('  ' + row.feature_key + ' (' + row.variant + ') "' + row.display_name + '"')
  }
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
