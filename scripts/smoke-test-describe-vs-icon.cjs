#!/usr/bin/env node
// Smoke test: invoke describe-vs-icon with one real icon file to verify
// the Edge Function works end-to-end before running the full ingestion.

const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const TEST_FILE = path.join(__dirname, '..', 'seed-assets', 'visual-schedule-icons-cdef', 'vs_drink_water-1.jpg')

if (!fs.existsSync(TEST_FILE)) {
  console.error(`Test file not found: ${TEST_FILE}`)
  process.exit(1)
}

async function main() {
  console.log(`Reading: ${TEST_FILE}`)
  const buf = fs.readFileSync(TEST_FILE)
  const base64 = buf.toString('base64')
  console.log(`File size: ${buf.length} bytes, base64 length: ${base64.length}`)

  const url = `${SUPABASE_URL}/functions/v1/describe-vs-icon`
  console.log(`POST ${url}`)

  const start = Date.now()
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: base64,
      mime_type: 'image/jpeg',
      subject_name: 'drink_water',
    }),
  })
  const elapsed = Date.now() - start

  console.log(`Response status: ${response.status} (${elapsed}ms)`)
  const text = await response.text()
  console.log('Response body:', text)

  if (!response.ok) {
    console.error('SMOKE TEST FAILED')
    process.exit(1)
  }

  const json = JSON.parse(text)
  if (!json.description || !Array.isArray(json.suggested_tags)) {
    console.error('Response missing expected fields')
    process.exit(1)
  }

  console.log('\n✓ SMOKE TEST PASSED')
  console.log(`  description: "${json.description}"`)
  console.log(`  suggested_tags: ${JSON.stringify(json.suggested_tags)}`)
  console.log(`  tokens: in=${json.usage.input_tokens}, out=${json.usage.output_tokens}`)
}

main().catch((err) => {
  console.error('Smoke test error:', err)
  process.exit(1)
})
