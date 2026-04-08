#!/usr/bin/env node
// Build M Sub-phase A — Generate SQL seed VALUES blocks for migration 100115
//
// Reads:
//   - assets/gamification/woodland-felt/woodland-felt-manifest.csv (161 creatures)
//   - assets/gamification/woodland-felt/backgrounds-manifest.csv (26 pages)
//   - assets/gamification/woodland-felt/reveals-manifest.csv (2 reveals)
//
// Writes 3 .sql snippet files in scripts/build-m-seeds/:
//   - creatures.sql
//   - sticker_pages.sql
//   - theme.sql
//
// These get pasted into the migration file. Pure code-gen — no DB access.

const fs = require('fs')
const path = require('path')

const REPO = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(REPO, 'assets', 'gamification', 'woodland-felt')
const OUT_DIR = path.join(__dirname, 'build-m-seeds')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

// ---------- CSV parser (RFC 4180 — handles quoted fields with commas) ----------
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let i = 0
  let inQuotes = false
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// ---------- SQL escaping ----------
function sqlString(s) {
  if (s === null || s === undefined) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlTextArray(items) {
  if (!items || items.length === 0) return `'{}'::text[]`
  const escaped = items.map((s) => `"${String(s).replace(/"/g, '\\"')}"`).join(',')
  return `'{${escaped}}'::text[]`
}

// ---------- Slug derivation ----------
function slugFromFilename(filename) {
  return filename.replace(/\.(png|jpg|jpeg|mp4|webm)$/i, '')
}

function displayNameFromScene(scene, sortIdx) {
  const titled = scene
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return titled
}

// =========================================================================
// 1. CREATURES
// =========================================================================
const creaturesCsv = fs.readFileSync(path.join(ASSETS_DIR, 'woodland-felt-manifest.csv'), 'utf8')
const creatureRows = parseCSV(creaturesCsv)
const creatureHeader = creatureRows.shift()
console.log('Creature CSV header:', creatureHeader)
console.log('Creature data rows:', creatureRows.filter((r) => r.length > 1).length)

const creatureValues = []
let creatureSort = 0
let cCommon = 0,
  cRare = 0,
  cLegendary = 0
for (const row of creatureRows) {
  if (!row || row.length < 6) continue
  const [filename, name, rarity, tagsRaw, description, image_url] = row
  if (!filename || !filename.trim()) continue
  const slug = slugFromFilename(filename)
  const tags = tagsRaw
    .split('|')
    .map((t) => t.trim())
    .filter(Boolean)
  if (rarity === 'common') cCommon++
  else if (rarity === 'rare') cRare++
  else if (rarity === 'legendary') cLegendary++
  creatureSort++
  creatureValues.push(
    `  (v_theme_id, ${sqlString(slug)}, ${sqlString(name)}, ${sqlString(rarity)}, ${sqlTextArray(tags)}, ${sqlString(description)}, ${sqlString(image_url)}, ${creatureSort})`
  )
}
console.log(`Common: ${cCommon}, Rare: ${cRare}, Legendary: ${cLegendary}, Total: ${creatureValues.length}`)

const creaturesSql = `-- Seed 161 Woodland Felt creatures (${cCommon} common + ${cRare} rare + ${cLegendary} legendary)
-- Source: assets/gamification/woodland-felt/woodland-felt-manifest.csv
DO $$
DECLARE
  v_theme_id UUID;
BEGIN
  SELECT id INTO v_theme_id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt';
  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'gamification_themes row for woodland_felt missing — must be inserted before creatures';
  END IF;

  INSERT INTO public.gamification_creatures
    (theme_id, slug, display_name, rarity, tags, description, image_url, sort_order)
  VALUES
${creatureValues.join(',\n')}
  ON CONFLICT (theme_id, slug) DO NOTHING;
END $$;
`
fs.writeFileSync(path.join(OUT_DIR, 'creatures.sql'), creaturesSql)
console.log(`Wrote ${path.join(OUT_DIR, 'creatures.sql')}`)

// =========================================================================
// 2. STICKER PAGES (backgrounds)
// =========================================================================
const bgCsv = fs.readFileSync(path.join(ASSETS_DIR, 'backgrounds-manifest.csv'), 'utf8')
const bgRows = parseCSV(bgCsv)
const bgHeader = bgRows.shift()
console.log('\nBackgrounds CSV header:', bgHeader)
console.log('Background rows:', bgRows.filter((r) => r.length > 1).length)

// Capitalize the scene + use a per-scene counter so duplicates get "(2)" / "(3)" etc.
const sceneCounter = {}
const pageValues = []
let pageSort = 0
for (const row of bgRows) {
  if (!row || row.length < 5) continue
  const [filename, type, scene, season, url] = row
  if (!filename || !filename.trim()) continue
  const slug = slugFromFilename(filename)
  sceneCounter[scene] = (sceneCounter[scene] || 0) + 1
  const titledScene = scene
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  const display_name = sceneCounter[scene] === 1 ? titledScene : `${titledScene} ${sceneCounter[scene]}`
  pageSort++
  pageValues.push(
    `  (v_theme_id, ${sqlString(slug)}, ${sqlString(display_name)}, ${sqlString(scene)}, ${sqlString(season)}, ${sqlString(url)}, ${pageSort})`
  )
}
console.log(`Total pages: ${pageValues.length}`)

const pagesSql = `-- Seed 26 Woodland Felt sticker book pages (background scenes)
-- Source: assets/gamification/woodland-felt/backgrounds-manifest.csv
DO $$
DECLARE
  v_theme_id UUID;
BEGIN
  SELECT id INTO v_theme_id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt';
  IF v_theme_id IS NULL THEN
    RAISE EXCEPTION 'gamification_themes row for woodland_felt missing — must be inserted before sticker pages';
  END IF;

  INSERT INTO public.gamification_sticker_pages
    (theme_id, slug, display_name, scene, season, image_url, sort_order)
  VALUES
${pageValues.join(',\n')}
  ON CONFLICT (theme_id, slug) DO NOTHING;
END $$;
`
fs.writeFileSync(path.join(OUT_DIR, 'sticker_pages.sql'), pagesSql)
console.log(`Wrote ${path.join(OUT_DIR, 'sticker_pages.sql')}`)

// =========================================================================
// 3. THEME (1 row from reveals manifest)
// =========================================================================
const reveCsv = fs.readFileSync(path.join(ASSETS_DIR, 'reveals-manifest.csv'), 'utf8')
const reveRows = parseCSV(reveCsv)
const reveHeader = reveRows.shift()
console.log('\nReveals CSV header:', reveHeader)
console.log('Reveal rows:', reveRows.filter((r) => r.length > 1).length)

let creatureRevealUrl = null
let pageRevealUrl = null
for (const row of reveRows) {
  if (!row || row.length < 4) continue
  const [filename, type, description, url] = row
  if (type === 'creature_reveal') creatureRevealUrl = url
  else if (type === 'page_unlock_reveal') pageRevealUrl = url
}
if (!creatureRevealUrl || !pageRevealUrl) {
  console.error('ERROR: missing reveal URL', { creatureRevealUrl, pageRevealUrl })
  process.exit(1)
}

const themeSql = `-- Seed Woodland Felt theme row + 2 reveal video URLs
-- Source: assets/gamification/woodland-felt/reveals-manifest.csv (corrected per Build M decision)
INSERT INTO public.gamification_themes
  (theme_slug, display_name, description, creature_reveal_video_url, page_reveal_video_url, is_active, sort_order)
VALUES (
  'woodland_felt',
  'Woodland Felt',
  'Cozy paper-craft woodland creatures and seasonal scene backgrounds. The first gamification theme; default for all members.',
  ${sqlString(creatureRevealUrl)},
  ${sqlString(pageRevealUrl)},
  true,
  1
)
ON CONFLICT (theme_slug) DO NOTHING;
`
fs.writeFileSync(path.join(OUT_DIR, 'theme.sql'), themeSql)
console.log(`Wrote ${path.join(OUT_DIR, 'theme.sql')}`)

console.log('\n✓ All seed snippets generated successfully.')
