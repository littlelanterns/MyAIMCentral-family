# Gamification Assets — Bucket Structure & Manifest Conventions

> **Canonical reference** for organizing gamification collectible assets in Supabase Storage and committing manifest CSVs to the repo. Any time we commission a new theme (pets, dragons, apothecary, etc.), follow this pattern exactly.
>
> **Established:** Woodland Felt delivery, 2026-04-07. See [`manus-woodland-felt-instructions.md`](./manus-woodland-felt-instructions.md) for the original delivery that set the precedent.

---

## Why This Exists

The gamification overlay engine (PRD-24A) rewards kids with collectible icons, scene backgrounds, and reveal animations as they complete tasks and routines. Each visual theme (Woodland Felt, Pets, Apothecary, Dragons, Pixel Loot, etc.) is a self-contained content pack with a consistent file organization so the engineering team can write one seed migration pattern and reuse it across every theme.

This doc is the single source of truth for: bucket name, folder structure, file naming, manifest CSV schemas, and the handoff contract between content prep (Manus or similar) and database seeding (engineering).

---

## Supabase Storage Bucket

**Bucket name:** `gamification-assets`
**Visibility:** Public (decorative assets, not sensitive data)
**One bucket for all themes.** Do not create a new bucket per theme.

---

## Standard Theme Folder Layout

Every theme follows this exact four-subfolder pattern:

```
gamification-assets/
└── [theme-slug]/
    ├── common/         ← common-rarity collectible icons (transparent PNG)
    ├── rare/           ← rare + legendary collectible icons (transparent PNG)
    ├── backgrounds/    ← scene backgrounds for the overlay canvas
    └── reveals/        ← reveal animation videos (MP4/WebM) shown when a collectible is unlocked
```

### Subfolder rules

| Subfolder | Required? | Content type | Notes |
|---|---|---|---|
| `common/` | Yes | Transparent PNG | Most common rarity tier. Every theme must have at least one common file. |
| `rare/` | Yes | Transparent PNG | Holds both `rare` and `legendary` rarity. The manifest's `rarity` column disambiguates per row. |
| `backgrounds/` | Optional | PNG or JPG | Scene backgrounds — seasonal, time-of-day, special occasions. Skip if the theme has no backgrounds. |
| `reveals/` | Optional | MP4 / WebM / animated PNG | Short reveal animations played when a collectible unlocks. Skip if the theme reuses a generic reveal. |

### Theme slug rules

- Lowercase
- Hyphens between words (the only place hyphens are allowed in this system)
- ASCII only
- Stable — once a theme ships, its slug never changes

**Established theme slugs:**
- `woodland-felt` (shipped 2026-04-07)

**Planned theme slugs (for your awareness — not yet commissioned):**
- `pets`
- `apothecary`
- `dragons-cute`
- `dragons-ornate`
- `pixel-loot`

Do not create empty placeholder folders for planned themes. Only create folders for themes actively being uploaded.

---

## File Naming Conventions

### Collectibles (`common/` and `rare/`)

Pattern:
```
[theme_slug_with_underscores]_[animal_or_item]_[variant].png
```

Note the subtle difference from the folder slug: **the filename uses underscores, the folder uses hyphens.** This matches the pattern Manus established in the Woodland Felt delivery.

Examples:
- `woodland_felt_fox_bowtie.png`
- `woodland_felt_owl_lantern.png`
- `pets_cat_napping.png` (future)
- `dragons_cute_baby_red.png` (future)

Rules:
- All lowercase
- Underscores between words
- Descriptive enough that a human skimming filenames can guess what the icon looks like
- Every file in a theme has a unique filename (no collisions between `common/` and `rare/`)
- If two visually distinct variants of the same animal exist, distinguish with a trailing modifier: `_blue`, `_sitting`, `_v2`, etc.

### Backgrounds (`backgrounds/`)

Pattern:
```
[theme_slug_with_underscores]_background_[scene]_[variant?].png
```

Examples from Woodland Felt:
- `woodland_felt_background_cherry_blossom.png`
- `woodland_felt_background_summer_sunrise_1.png`
- `woodland_felt_background_winter_wonderland.png`

If a scene has multiple variants (e.g. four fall golden hour images), number them `_1`, `_2`, `_3`, `_4`.

### Reveals (`reveals/`)

Pattern:
```
[theme_slug_with_underscores]_reveal_[description].[mp4|webm]
```

Examples from Woodland Felt:
- `woodland_felt_reveal_fairy_door_opens_magical_light.mp4`
- `woodland_felt_reveal_mossy_chest_reveal.mp4`

Keep filenames descriptive but not overly long.

---

## Manifest CSV Files (committed to the repo)

Manifests live in the repo at:
```
assets/gamification/[theme-slug]/
├── [theme-slug]-manifest.csv        ← collectibles (common + rare in one file)
├── backgrounds-manifest.csv          ← backgrounds (if the theme has any)
└── reveals-manifest.csv              ← reveals (if the theme has any)
```

**One collectibles manifest per theme**, named after the theme slug. **One backgrounds manifest per theme**, always literally named `backgrounds-manifest.csv`. Same for `reveals-manifest.csv`. This consistency matters — the future seed migration globs for these exact filenames.

### Collectibles manifest schema

File: `[theme-slug]-manifest.csv`

| Column | Type | Description |
|---|---|---|
| `filename` | string | Just the filename (not the path), e.g. `woodland_felt_fox_bowtie.png` |
| `name` | string | Human-readable display name. Title Case. Whimsical and warm. |
| `rarity` | enum | One of `common`, `rare`, `legendary`. |
| `tags` | string | Pipe-separated tags, no spaces around the pipes. Always include the animal/item type. |
| `description` | string | Short whimsical sentence, under ~120 chars, child-friendly tone. |
| `image_url` | string | Full public Supabase Storage URL. |

Include both common and rare/legendary rows in the same CSV. The `rarity` column discriminates.

### Backgrounds manifest schema

File: `backgrounds-manifest.csv`

| Column | Type | Description |
|---|---|---|
| `filename` | string | Just the filename, e.g. `woodland_felt_background_cherry_blossom.png` |
| `type` | string | `background` (literal — future themes may add sub-types like `parallax_layer`) |
| `scene` | string | Short scene descriptor, e.g. `cherry blossom`, `winter wonderland`, `firefly dusk` |
| `season` | string | One of `spring`, `summer`, `fall`, `winter`, `all`, or a holiday name like `christmas`, `harvest festival` |
| `url` | string | Full public Supabase Storage URL. |

### Reveals manifest schema

File: `reveals-manifest.csv`

| Column | Type | Description |
|---|---|---|
| `filename` | string | Just the filename, e.g. `woodland_felt_reveal_mossy_chest_reveal.mp4` |
| `type` | string | One of `creature_reveal` or `page_unlock_reveal`. Determined by **reward category**, not rarity. Future themes may add sub-types. |
| `description` | string | Short human-readable description that names what the video plays for (e.g. `A mossy wooden chest slowly opening — plays when a new creature collectible is earned`). Reference the reward category, not the rarity tier. |
| `url` | string | Full public Supabase Storage URL. |

**Reveal type → reward category mapping (Build M decision, 2026-04-07):**

| Reveal type | Plays when |
|---|---|
| `creature_reveal` | A new creature collectible is awarded to a member |
| `page_unlock_reveal` | A new sticker book page unlocks for a member |

Each theme should ship at least one of each type. Rarity (`common`/`rare`/`legendary`) lives on the creature row, NOT the reveal video — rarity affects reveal frequency via `member_sticker_book_state.rarity_weights`, but every creature reveal plays the same video for its theme.

### CSV format rules (apply to all three schemas)

- Header row required, in the exact column order shown above
- UTF-8 encoding
- Unix line endings (`\n`)
- Fields containing commas must be wrapped in double quotes
- Double quotes inside fields escape by doubling: `""`
- No trailing empty rows
- No BOM

---

## Commit & PR Workflow

For each new theme:

**Branch:** `manus/[theme-slug]-manifest`

**Commit messages:**
- `feat: add [theme-name] gamification asset manifest (N icons)` — for the creatures/items manifest
- `feat: add [theme-name] backgrounds and reveal manifests` — for backgrounds + reveals (if present)

Open a single PR per theme against `main`. Engineering reviews, merges, and schedules the seed migration as part of a later build.

---

## Hard Rules for Content Prep (Manus or equivalent)

These are out of scope for asset prep. Any of these create rework for engineering:

- ❌ **No database tables.** No schema changes, no migrations, no SQL files.
- ❌ **No pgvector / embeddings.** Not needed for gamification assets.
- ❌ **No RLS policies.** Public bucket is enough; row-level security lives on the database side.
- ❌ **No maintained upload scripts.** One-time dashboard or CLI uploads only. Do not commit Python/Node uploaders to the repo.
- ❌ **No modifications to existing repo files** outside the new theme's manifest folder.
- ❌ **No seeding data into existing tables.** Manifests are the handoff; engineering writes the seed migration.
- ❌ **No visual modifications** — no resizing, recoloring, or touching up source icons. Flag issues in the PR description instead.
- ❌ **No renaming of established theme slugs** once a theme has shipped.

---

## Handoff Contract

The manifest CSVs are the single source of truth for the database seed. When engineering writes the seed migration (part of PRD-24A gamification overlay engine), it will:

1. Parse each `[theme-slug]-manifest.csv` into a `gamification_collectibles` row
2. Parse each `backgrounds-manifest.csv` into a `gamification_backgrounds` row
3. Parse each `reveals-manifest.csv` into a `gamification_reveals` row
4. Point each row's `image_url` / `url` directly at the public Supabase Storage URL

A bad row in the manifest becomes a bad collectible in production. When in doubt about a row — ask the founder before committing.

---

## Related Docs

- [`manus-woodland-felt-instructions.md`](./manus-woodland-felt-instructions.md) — the original delivery instruction set (now archived as the historical precedent)
- [`platform-assets-manifest.md`](./platform-assets-manifest.md) — **different** bucket (`platform-assets`) for app feature icons + vault thumbnails, not gamification
- [`visual-assets-needed.md`](./visual-assets-needed.md) — open requests for platform asset work
- PRD-24A (Overlay Engine & Game Modes) — the feature that will consume these assets once seeded
