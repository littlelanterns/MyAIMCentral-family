# Manus Task: Woodland Felt Gamification Collectibles Prep & Upload

> **Status:** ✅ **DELIVERED 2026-04-07** — see Delivery Receipt below. This doc is archived as the historical instruction set. For future themes, follow [`gamification-assets-bucket-structure.md`](./gamification-assets-bucket-structure.md) (the canonical organization doc derived from this delivery).
>
> **Purpose:** Cut grid sheets of collectible icons into individual transparent PNGs, upload to Supabase Storage, and produce a manifest CSV that the MyAIM Central engineering team will use to seed the gamification collectibles database table.
>
> **Handoff point:** The manifest CSV. Once it's committed to the repo, our team takes over for the database migration and seeding.

---

## Delivery Receipt (2026-04-07)

Manus delivered more than the original scope called for — in addition to the 128 common + 25 rare/legendary creatures, the batch also included backgrounds and reveal videos. Full inventory below.

### Supabase Storage — `gamification-assets` bucket

| Folder | Contents | Count |
|---|---|---|
| `woodland-felt/common/` | Common woodland animal icons (transparent PNG) | 125 |
| `woodland-felt/rare/` | Rare + legendary fantasy-colored icons (transparent PNG) | 36 |
| `woodland-felt/backgrounds/` | Scene backgrounds — cherry blossom, Christmas (×3), fall golden hour (×4), firefly dusk, harvest festival (×4), moonlit night (×2), rainy day (×3), spring meadow (×3), summer sunrise (×4), winter wonderland | 26 |
| `woodland-felt/reveals/` | Reveal videos — Fairy Door Opens Magical Light, Mossy Chest Reveal | 2 |
| **Total** | | **189 files** |

Note on the delta from the original instruction: we asked for 128 common + 25 rare = 153 creatures. Manus delivered 125 + 36 = 161. The discrepancy is due to some grid cells being empty or visually identical across the sheets (deduped) and the rare sheet containing a few extras. Counts are what they are — use the manifest as the source of truth.

### GitHub — PR #1 on branch `manus/woodland-felt-manifest`

Two commits delivered:
1. `feat: add woodland-felt gamification asset manifest (161 icons)` — creature manifest
2. `feat: add woodland-felt backgrounds and reveal video manifests` — backgrounds + reveals manifests

Three manifest CSVs committed to `assets/gamification/woodland-felt/`:

| File | Rows | Columns |
|---|---|---|
| `woodland-felt-manifest.csv` | 161 creature rows | `filename, name, rarity, tags, description, image_url` |
| `backgrounds-manifest.csv` | 26 background rows | `filename, type, scene, season, url` |
| `reveals-manifest.csv` | 2 reveal video rows | `filename, type, description, url` |

### Scope Expansion (new precedent for future themes)

The original instruction only asked for common/ and rare/ folders. Manus correctly expanded the pattern to include `backgrounds/` and `reveals/` as first-class siblings under the theme folder. This is now the **standard organization** for every future gamification theme — see [`gamification-assets-bucket-structure.md`](./gamification-assets-bucket-structure.md) for the codified pattern.

### Next Steps (engineering team, not Manus)

- [ ] Merge PR #1 to main
- [ ] Write the seed migration consuming all three manifest CSVs (deferred — not scheduled)
- [ ] Database table design for collectibles, backgrounds, reveals (deferred — part of gamification overlay engine build, PRD-24A)

---

## Original Instruction Set (historical)

---

## Context

MyAIM Central is launching a gamification collectibles system where children earn whimsical icons (animals, pets, dragons, loot, etc.) as rewards for completing tasks and routines. The first theme is **Woodland Felt** — soft, hand-stitched-looking woodland animals in two rarity tiers:

- **Common** (8×8 grids × 2 sheets = 128 icons) — everyday woodland critters with everyday accessories
- **Rare / Legendary** (5×5 grid × 1 sheet = 25 icons, **arriving later**) — fantasy-colored variants of the same animals

You have access to our Supabase project and our GitHub repository. This task is **storage prep + manifest only** — no database work, no Python scripts to maintain, no embeddings, no RLS policies. Our engineering team handles all of that downstream.

---

## Source Files

The two 8×8 common-rarity grid PNGs are at the location you've been given (the founder will hand you the file paths or upload links separately). Each grid contains 64 icons in an 8-row × 8-column layout. Total across both sheets: **128 individual icons**.

The 5×5 rare/legendary grid is **not ready yet**. When it arrives, follow the same workflow but use the rare folder path and rare/legendary rarity values.

---

## What You Should Do

### 1. Cut both 8×8 grids into individual transparent PNGs

- Each cell in the grid becomes one standalone PNG
- Preserve transparency (no white backgrounds)
- Maintain consistent dimensions per cell — measure the source grid and crop precisely so every output PNG is the same size
- Total output from the two common sheets: **128 PNGs**

### 2. Name each file descriptively

Use this naming pattern:

```
woodland_felt_[animal]_[variant].png
```

Examples:
- `woodland_felt_fox_bowtie.png`
- `woodland_felt_owl_lantern.png`
- `woodland_felt_hedgehog_acorn.png`
- `woodland_felt_rabbit_scarf.png`
- `woodland_felt_squirrel_book.png`
- `woodland_felt_bear_honeypot.png`

**Duplicates across the two sheets are fine and expected** — they're variants. Name them distinctly so no two PNGs share a filename. If you encounter two foxes that both look like they have bowties, distinguish them: `woodland_felt_fox_bowtie_blue.png` vs `woodland_felt_fox_bowtie_red.png`, or `woodland_felt_fox_bowtie_sitting.png` vs `woodland_felt_fox_bowtie_standing.png`. Use whatever visual distinction is meaningful — color, pose, accessory color, expression.

Filename rules:
- All lowercase
- Underscores between words, no spaces, no hyphens inside the variant portion
- ASCII only — no special characters
- `.png` extension

### 3. Create the Supabase Storage bucket

Bucket name: **`gamification-assets`**

Settings:
- **Public** (publicly readable URLs — these are decorative assets, not sensitive data)
- Standard file size limits (no need to raise them — these PNGs will be small)

If the bucket already exists, skip this step and use the existing one.

### 4. Upload all common PNGs to the right folder

Upload the 128 common PNGs to:

```
gamification-assets/woodland-felt/common/
```

Final public URL pattern for each file will be:
```
https://[project-ref].supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/[filename].png
```

You will need the actual project URL when populating the manifest — get this from the Supabase dashboard (Project Settings → API → Project URL) and use it consistently for every row in the manifest.

### 5. When the rare 5×5 grid arrives, repeat the workflow

- Cut the 5×5 grid into 25 individual PNGs
- Name them with the same `woodland_felt_[animal]_[variant].png` pattern
- Upload to `gamification-assets/woodland-felt/rare/`
- Append the 25 new rows to the existing manifest CSV (don't create a second file)
- For these icons, choose `rare` or `legendary` for the rarity column based on visual prominence — the most striking 5–8 should be `legendary`, the rest `rare`

### 6. Create the manifest CSV and commit it to the repo

File path in the repo:
```
assets/gamification/woodland-felt-manifest.csv
```

**Create the `assets/gamification/` directory** if it doesn't already exist.

CSV columns (header row required, in this exact order):

```
filename,name,rarity,tags,description,image_url
```

Column definitions:

| Column | Type | Description |
|---|---|---|
| `filename` | string | Just the filename, e.g. `woodland_felt_fox_bowtie.png` |
| `name` | string | Human-readable display name, e.g. `Bowtie Fox` or `Lantern Owl`. Title Case. Whimsical and warm. |
| `rarity` | enum | One of `common`, `rare`, `legendary`. All 128 from the 8×8 sheets are `common`. The 25 from the 5×5 sheet are split between `rare` and `legendary`. |
| `tags` | string | Pipe-separated tags, no spaces around the pipes. Always include the animal type. Add any other meaningful descriptors. Examples: `fox\|woodland\|bowtie\|formal`, `owl\|woodland\|lantern\|night`, `hedgehog\|woodland\|acorn\|autumn`. |
| `description` | string | A short whimsical sentence (one line, under ~120 characters). Warm, child-friendly tone. No quotation marks inside the field — if you need them, escape per CSV rules. Examples: `A dapper fox in his finest woodland bowtie, ready for the autumn ball.` / `An owl carrying a tiny lantern, lighting the way home through the trees.` |
| `image_url` | string | Full public Supabase Storage URL for the file. |

CSV escaping:
- If any field contains a comma, wrap that field in double quotes
- If any field contains a double quote, escape it by doubling: `""`
- Use UTF-8 encoding
- Unix line endings (`\n`) are fine

Example rows:

```csv
filename,name,rarity,tags,description,image_url
woodland_felt_fox_bowtie.png,Bowtie Fox,common,fox|woodland|bowtie|formal,"A dapper fox in his finest woodland bowtie, ready for the autumn ball.",https://abcd1234.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_fox_bowtie.png
woodland_felt_owl_lantern.png,Lantern Owl,common,owl|woodland|lantern|night,"An owl carrying a tiny lantern, lighting the way home through the trees.",https://abcd1234.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_owl_lantern.png
woodland_felt_hedgehog_acorn.png,Acorn Hedgehog,common,hedgehog|woodland|acorn|autumn,"A small hedgehog cradling an acorn like a treasure.",https://abcd1234.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/common/woodland_felt_hedgehog_acorn.png
```

### 7. Commit the manifest to the repo

Branch name: `manus/woodland-felt-manifest`

Commit message:
```
chore: add Woodland Felt collectibles manifest (128 common)
```

When the rare/legendary batch is added later, use a separate commit on the same branch:
```
chore: append Woodland Felt rare/legendary collectibles to manifest
```

Open a pull request to `main` when each batch is complete. The MyAIM team will review and merge.

---

## What You Should NOT Do

These are explicitly out of scope. Doing any of these will create work the engineering team has to undo:

- **Do not create any database tables.** No `gamification_collectibles` table, no schema changes, no migrations. We handle all SQL ourselves through versioned migration files in `supabase/migrations/`.
- **Do not install pgvector or generate embeddings.** Even though similar visual asset systems use embeddings elsewhere in our project, this batch does not need them.
- **Do not write RLS policies.** Storage bucket public access is enough — we handle row-level security on the database side ourselves.
- **Do not write Python upload scripts, Node scripts, or any maintained tooling.** One-time uploads through the Supabase dashboard or `supabase storage cp` CLI are fine. Do not commit any upload scripts to the repo.
- **Do not modify any existing files in the repo** other than creating the new manifest CSV and (if needed) the parent directory.
- **Do not seed any data into existing tables.** The manifest CSV is the handoff — we will write our own seed migration that reads from it.
- **Do not generate alt text, accessibility metadata, or SEO content** beyond what's already in the `name` and `description` fields.
- **Do not resize, recolor, or visually modify the source icons.** Cut them as-is from the grid. If a source PNG has a stray pixel or alignment issue, flag it in the PR description rather than fixing it silently.

---

## Deliverables Checklist

When this task is complete, the following must all be true:

- [ ] `gamification-assets` bucket exists in Supabase Storage and is set to public
- [ ] 128 individual transparent PNGs uploaded to `gamification-assets/woodland-felt/common/`
- [ ] Every uploaded PNG follows the `woodland_felt_[animal]_[variant].png` naming pattern
- [ ] Every uploaded PNG has a unique filename
- [ ] Every uploaded PNG is publicly accessible via its storage URL (test at least 3 by opening the URL in an incognito browser)
- [ ] `assets/gamification/woodland-felt-manifest.csv` exists in the repo with 128 rows + 1 header row
- [ ] Every row in the manifest has all 6 columns populated
- [ ] Every `image_url` in the manifest resolves to a real, accessible PNG
- [ ] Every `filename` in the manifest matches an actual file in the storage bucket
- [ ] CSV is valid and parses cleanly (test with a CSV reader before committing)
- [ ] Pull request opened against `main`
- [ ] PR description summarizes: total files cut, total uploaded, total rows in manifest, any source-grid issues you noticed

When the rare/legendary batch arrives, add to the same PR or open a follow-up:

- [ ] 25 individual transparent PNGs uploaded to `gamification-assets/woodland-felt/rare/`
- [ ] Manifest CSV appended with 25 new rows
- [ ] Rarity values split between `rare` and `legendary` (most striking 5–8 are `legendary`)

---

## Future Theme Folders (For Your Awareness — Not This Task)

So you understand the bucket organization for future batches:

```
gamification-assets/
├── woodland-felt/
│   ├── common/      ← this task
│   └── rare/        ← this task (later batch)
├── pets/
│   ├── common/      ← future
│   └── rare/        ← future
├── apothecary/      ← future
├── dragons/
│   ├── cute/        ← future
│   └── ornate/      ← future
└── pixel-loot/      ← future
```

One bucket, themes as top-level folders, rarity (or sub-theme) as second-level folders. Do not create empty placeholder folders for future themes — only create what this task requires.

---

## Questions

If anything is ambiguous — naming conventions for an animal you can't identify, a grid cell that looks empty or damaged, a duplicate that's truly indistinguishable from another, the project URL — **stop and ask the founder before proceeding**. Do not guess. The manifest is the single source of truth for the database seed, and a bad row will end up as a bad collectible in production.
