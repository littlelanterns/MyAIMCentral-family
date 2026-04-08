# Manus Task: `vs_task_default` Fallback Asset (3 Variants)

> **Purpose:** Generate the universal fallback paper craft asset that renders on Play Dashboard task tiles when no specific match is found in the visual_schedule library AND mom hasn't picked one during task creation.
>
> **Status:** REQUESTED 2026-04-07 — must be delivered before Build M Sub-phase B completes.
> **Build:** Play Dashboard + Sticker Book ([claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md](../claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md))
> **Why this is a pre-build blocker:** Without the fallback, `PlayTaskTile` would render nothing for tasks that don't match the auto-suggestion algorithm — silently breaking the "Play tiles NEVER render emoji" rule.

---

## Context

Build M (Play Dashboard + Sticker Book) introduces a paper craft icon system for Play-shell task tiles. When mom creates a task assigned to a Play member, `TaskCreationModal` shows an inline picker with auto-suggested images from `platform_assets` (category=`visual_schedule`). The auto-suggestion uses tag matching against the task title — and now also embedding-based search via `match_assets()` for semantic refinement.

The auto-suggestion is good for most common kid tasks (the library has 328 visual_schedule rows covering teeth, potty, dress, meal, bath, hair, handwash, clean, face, feed, tidy, plus activities like piano, violin, soccer, swimming, cooking, building, puzzle, etc.). But:

1. Sometimes mom creates a task with an unusual title that nothing matches
2. Sometimes mom skips the picker entirely
3. Fresh dev environments with no embedding backfill yet might get sparser results

In all those cases, `PlayTaskTile` needs a graceful fallback image. This is that image.

---

## What to Generate

### Style

**Paper craft / collage / cut-paper** — exactly matching the existing Woodland Felt and visual_schedule library aesthetic. Soft, hand-stitched-looking, warm palette, subtle texture. **Not** cartoon vector, **not** flat icon, **not** photorealistic. Look at the existing 328 `visual_schedule` rows for the established style direction — your output should look like it belongs in that library.

### Subject Matter

A generic, cheerful "ready for your task" icon. Concrete options (pick whichever produces the best paper craft result):

**Option A — Star + Checkmark:** A warm yellow/gold paper-craft star with a small green checkmark inside or beside it. Friendly, achievement-coded, universal.

**Option B — Sun on Card:** A bright paper sun (with rays) sitting on a small folded paper card. Day-starting energy.

**Option C — Sparkle + Heart:** A warm pink heart with a few sparkles around it. Celebration-coded, gentle.

**Option D — Ta-da Confetti Burst:** A small burst of paper confetti pieces in warm colors radiating from a center point. Celebration-coded.

**Pick whichever option photographs best as paper craft.** The goal is "warm, ready, friendly, generic enough to fit any task" — not a specific concept.

### Variants

Generate **3 variants** following the existing platform_assets convention:
- **Variant A** — slight variation 1
- **Variant B** — slight variation 2 (this is the default — see below)
- **Variant C** — slight variation 3

Variants can differ in color palette (warm yellow / soft pink / sage green), composition (centered vs offset), or small detail elements (one sparkle vs three sparkles). They should all be recognizably the same fallback icon, just with different "moods" so families with different theme palettes have at least one that fits well.

**Variant B is the default** — match the existing visual_schedule library convention where most consumers default to variant B. Make it the most universally appealing of the three.

### Sizes

Each variant gets **3 sizes** uploaded:
- **512×512px** — full-quality master
- **128×128px** — display size on dashboard tiles (most common consumer)
- **32×32px** — mini/icon size for compact displays

Total files to deliver: **3 variants × 3 sizes = 9 PNG files** with transparent backgrounds.

---

## File Naming + Storage Location

### Filenames

```
vs_task_default_A_512.png
vs_task_default_A_128.png
vs_task_default_A_32.png
vs_task_default_B_512.png
vs_task_default_B_128.png
vs_task_default_B_32.png
vs_task_default_C_512.png
vs_task_default_C_128.png
vs_task_default_C_32.png
```

### Storage Bucket + Path

Upload to the existing **`platform-assets`** bucket (NOT `gamification-assets` — that's for the woodland felt + future themes; this is a generic platform asset).

```
platform-assets/visual_schedule/vs_task_default_A_512.png
platform-assets/visual_schedule/vs_task_default_A_128.png
... (etc, same pattern)
```

If `platform-assets/visual_schedule/` doesn't exist as a folder yet, create it. Other `vs_*` assets in the live database may already be in this folder under similar paths — match the existing convention. If the existing convention is different (e.g., flat root, or per-feature subfolders), match that.

---

## Database Insert (After Upload)

Once the 9 files are uploaded, the rows need to land in `platform_assets`. **Manus does NOT insert these directly** — that's a build task for the engineering side. Instead, deliver the upload + give us the public URLs so the engineering side can write the seed migration.

The expected `platform_assets` rows look like:

```sql
INSERT INTO platform_assets (
  feature_key, variant, category,
  size_512_url, size_128_url, size_32_url,
  display_name, description, tags, status
) VALUES
  ('vs_task_default', 'A', 'visual_schedule',
   'https://[project].supabase.co/storage/v1/object/public/platform-assets/visual_schedule/vs_task_default_A_512.png',
   'https://[project].supabase.co/storage/v1/object/public/platform-assets/visual_schedule/vs_task_default_A_128.png',
   'https://[project].supabase.co/storage/v1/object/public/platform-assets/visual_schedule/vs_task_default_A_32.png',
   'Task — Default Icon (A)',
   'Generic cheerful task icon — universal fallback for Play dashboard tiles when no specific match is found',
   '["task", "default", "generic", "placeholder", "ready", "ta-da", "fallback"]'::jsonb,
   'active'),
  ('vs_task_default', 'B', 'visual_schedule', ...),
  ('vs_task_default', 'C', 'visual_schedule', ...);
```

The unique constraint is `(feature_key, variant, category)` so all three variants can coexist with the same `feature_key` differing only by `variant`.

---

## What to NOT Do

- **Do not insert into the database** — that's a Build M task. Just deliver files + URLs.
- **Do not generate more than 3 variants** — the platform_assets schema CHECK constrains variants to A/B/C.
- **Do not skip sizes** — all 3 sizes (512/128/32) are required per the existing convention.
- **Do not use a busy or distracting design** — this is a fallback, it should fade into the background, not compete with the more specific assets.
- **Do not make it task-specific** — no toothbrushes, no books, no broom. Generic only.
- **Do not commit anything to the repo** — files go to Supabase Storage, that's it.

---

## Deliverables

1. **9 PNG files** (3 variants × 3 sizes) uploaded to `platform-assets/visual_schedule/` in the Supabase Storage bucket
2. **9 public URLs** delivered in a Slack/email message to the founder so the engineering side can use them in the seed migration
3. **A short note** confirming the 3 variants are visually distinct enough to be useful but consistent enough to be recognizably the same fallback
4. **Confirmation that the existing `visual_schedule` folder convention was matched** (or, if it didn't exist, a note explaining where the files actually landed)

---

## Questions

If anything is ambiguous — what the existing visual_schedule library style looks like, where existing files actually live in the bucket, whether the engineering side wants embeddings generated alongside (no — embeddings are backfilled separately), or anything about the spec — **stop and ask the founder before generating.** This asset is small but it's a Build M blocker, so getting it right matters more than getting it fast.

---

*Created 2026-04-07 as part of Build M (Play Dashboard + Sticker Book) preparation. Tracked in [claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md](../claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md) §16.2 Gap #2.*
