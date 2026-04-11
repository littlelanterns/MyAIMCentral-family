/**
 * upload-coloring-library.cjs — Build M Phase 3
 *
 * One-time script to upload coloring library images to Supabase Storage.
 *
 * Prerequisites:
 *   1. .env.local must have VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   2. The zip file at ZIP_PATH must exist (or extract manually first)
 *
 * Usage:
 *   node scripts/upload-coloring-library.cjs
 *
 * What it does:
 *   1. Extracts coloring-library-complete.zip to a temp folder
 *   2. For each of the 32 subject folders, uploads 6 PNG files to
 *      gamification-assets/woodland-felt/coloring-library/{slug}/
 *   3. Skips files that already exist (idempotent)
 *   4. Reports a summary at the end
 *
 * Total files: 32 subjects × 6 PNGs = 192 files
 * zones.json is NOT uploaded — it's already seeded into the DB.
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')

const ZIP_PATH = 'C:\\Users\\tenis\\Downloads\\coloring-library-complete.zip'
const EXTRACT_DIR = path.join(require('os').tmpdir(), 'coloring-library-upload')
const BUCKET = 'gamification-assets'
const STORAGE_PREFIX = 'woodland-felt/coloring-library'

const FILES_TO_UPLOAD = [
  'color.png',
  'grayscale.png',
  'lineart_simple.png',
  'lineart_medium.png',
  'lineart_complex.png',
  'grid_preview.png',
]

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Step 1: Extract zip if not already extracted
  const libraryDir = path.join(EXTRACT_DIR, 'coloring-library')
  if (!fs.existsSync(libraryDir)) {
    console.log(`Extracting ${ZIP_PATH} to ${EXTRACT_DIR}...`)
    if (!fs.existsSync(ZIP_PATH)) {
      console.error(`ZIP file not found at ${ZIP_PATH}`)
      process.exit(1)
    }
    fs.mkdirSync(EXTRACT_DIR, { recursive: true })
    // Use PowerShell to extract (Windows)
    execSync(
      `powershell -Command "Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${EXTRACT_DIR}' -Force"`,
      { stdio: 'inherit' },
    )
    console.log('Extraction complete.')
  } else {
    console.log(`Using already-extracted folder at ${libraryDir}`)
  }

  // Step 2: Discover subject folders
  const subjects = fs
    .readdirSync(libraryDir)
    .filter(name => fs.statSync(path.join(libraryDir, name)).isDirectory())
    .sort()

  console.log(`Found ${subjects.length} subjects: ${subjects.join(', ')}`)

  let uploaded = 0
  let skipped = 0
  let errors = 0
  const totalFiles = subjects.length * FILES_TO_UPLOAD.length
  let current = 0

  for (const slug of subjects) {
    for (const file of FILES_TO_UPLOAD) {
      current++
      const localPath = path.join(libraryDir, slug, file)
      const storagePath = `${STORAGE_PREFIX}/${slug}/${file}`

      if (!fs.existsSync(localPath)) {
        console.warn(`  MISSING: ${slug}/${file} — skipping`)
        skipped++
        continue
      }

      // Check if already exists
      const { data: existing } = await sb.storage
        .from(BUCKET)
        .list(`${STORAGE_PREFIX}/${slug}`, { search: file, limit: 1 })

      if (existing && existing.length > 0 && existing.some(f => f.name === file)) {
        console.log(`  SKIP (exists): ${storagePath} (${current}/${totalFiles})`)
        skipped++
        continue
      }

      // Upload
      const fileBuffer = fs.readFileSync(localPath)
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (error) {
        // If the error is "already exists", treat as skip
        if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
          console.log(`  SKIP (duplicate): ${storagePath} (${current}/${totalFiles})`)
          skipped++
        } else {
          console.error(`  ERROR: ${storagePath} — ${error.message}`)
          errors++
        }
      } else {
        console.log(`  Uploaded ${storagePath} (${current}/${totalFiles})`)
        uploaded++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Summary: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors`)
  console.log(`Total expected: ${totalFiles} files (${subjects.length} subjects × ${FILES_TO_UPLOAD.length} files)`)
  console.log('='.repeat(60))

  if (errors > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
