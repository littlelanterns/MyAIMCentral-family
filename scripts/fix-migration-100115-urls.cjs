/**
 * Appends .png to broken URLs in migration 00000000100115_play_dashboard_sticker_book.sql.
 *
 * The migration seeded ~162 visual_schedule rows where size_128_url / size_512_url
 * / size_32_url were written WITHOUT file extensions (e.g. `.../vs_bath_dry_A'`
 * instead of `.../vs_bath_dry_A.png'`). Production was fixed via an UPDATE, but
 * the migration file itself still contains the broken strings, so any fresh
 * dev environment that runs migrations from scratch would hit the bug.
 *
 * This script rewrites the file in-place so a rebuild produces correct URLs.
 * Idempotent — running twice is safe because only strings WITHOUT an extension
 * match the regex.
 */
const fs = require('fs')
const path = require('path')

const FILE = path.resolve(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '00000000100115_play_dashboard_sticker_book.sql',
)

const src = fs.readFileSync(FILE, 'utf-8')

// Match Supabase storage URLs ending in vs_<name>_<letter> (no extension)
// Followed by a single quote (closing the SQL string literal).
// Most rows use A/B/C as the last letter, but a few have D (bonus imagery).
// Only catches URLs that DON'T already end in .png/.jpg/.jpeg/.webp.
const RX = /(https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/platform-assets\/visual-schedule\/(?:32|128|512)\/vs_[a-z0-9_]+_[A-D])'/g

let fixCount = 0
const out = src.replace(RX, (_match, baseUrl) => {
  fixCount++
  return baseUrl + ".png'"
})

if (fixCount === 0) {
  console.log('No broken URLs found in migration file — nothing to fix.')
} else {
  fs.writeFileSync(FILE, out, 'utf-8')
  console.log('Fixed ' + fixCount + ' broken URLs in ' + FILE)
}
