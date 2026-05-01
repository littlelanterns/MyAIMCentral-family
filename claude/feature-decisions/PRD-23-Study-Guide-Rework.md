---
name: PRD-23 Study Guide Rework
description: On-demand Sonnet-from-chunks backfill of guided_text + independent_text columns on existing extractions, plus audience toggle in UI
type: feature-decision
status: Founder-Approved Design (2026-05-01, revised same day)
---

# PRD-23 Study Guide Rework

## Problem

The current study guide system has three compounding issues:

1. **Per-child scoping is unnecessary friction.** Study guides are scoped to `study_guide_{memberId}` — mom generates one per child, can't find them afterward, and View As scoping was broken. Family-wide access is the right model.

2. **Source material was wrong.** The original approach rewrote existing extractions via Haiku. Results were terrible — hallucinated content, false summaries, harmful action steps (encouraging secrecy). Rewriting compressed/interpreted extractions produces garbage.

3. **Haiku quality is insufficient.** Even after switching to key-point extractions as source, Haiku rewrites produced inaccurate content. Sonnet from the actual book text is required.

## Founder Decision (2026-05-01)

- **Drop per-child study guides entirely.** No `study_guide_{memberId}` audience values.
- **Generate from book chunks (raw text), not from extractions.** Same source material as the initial extraction.
- **Use Sonnet, not Haiku.** Quality is non-negotiable for content going to kids.
- **Both levels generated in ONE Sonnet pass** (cheaper than separate calls).
- **On-demand for existing books.** Mom clicks "Generate Study Guide" → `guided_text` and `independent_text` columns backfilled on existing extraction rows.
- **Automatic for new uploads.** The existing `bookshelf-extract` pipeline already generates all three versions — no change needed there.
- **Family-wide visibility.** Any family member can view any reading level. No per-child restrictions.
- **"Customize for [child]" is a someday-maybe.** Not in scope now.

## Critical Design Decision: Columns, Not Separate Rows

The new-upload pipeline (`bookshelf-extract`) stores `guided_text` and `independent_text` as **columns** on `audience='original'` rows. All three versions live on the same extraction record.

The study guide rework MUST follow the same pattern — **UPDATE existing rows to fill in the two empty columns**, not INSERT new rows with different audience values. This keeps one code path in the frontend regardless of whether a book was uploaded before or after the new pipeline.

**What this means in plain english:** Every extraction card for a book already has a slot for adult text, teen text, and kid text. New books fill all three slots during initial upload. Old books only have the adult slot filled. "Generate Study Guide" fills in the two empty slots on the existing cards. The frontend toggle just switches which slot you're reading.

## Current State (data from production 2026-05-01)

| Metric | Count |
|--------|-------|
| Total original extractions | 89,861 |
| Extractions with `guided_text` populated | 1,431 (1.6%) |
| Extractions with `independent_text` populated | 1,434 (1.6%) |
| Books with all three versions | 3 (Trusting God, Montessori Method, Christmas Jar) |
| Books with adult-only (need backfill) | ~577 |
| Old study_guide_{memberId} rows | 45 (Silver Chair for Miriam — cleanup candidate) |

**Average character counts (from the 3 books that have all three):**

| Type | Adult | Teen (60-91%) | Kid (51-70%) |
|------|-------|---------------|--------------|
| Summaries | 407 chars | 245 chars | 207 chars |
| Insights | 267 chars | 197 chars | 163 chars |
| Action Steps | 240 chars | 178 chars | 152 chars |
| Questions | 211 chars | 180 chars | 148 chars |
| Declarations | 162 chars | 148 chars | 113 chars |

Teen and kid versions are naturally shorter and simpler — not full-depth copies of the adult version.

## Architecture

### What DOESN'T Change (new-upload pipeline)
`bookshelf-extract` already generates `text`, `guided_text`, and `independent_text` in a single Sonnet call per section. Books uploaded through the UI get all three versions automatically. **No changes needed to this pipeline.**

### Edge Function Rework (`bookshelf-study-guide`)
- **Purpose:** Backfill `guided_text` and `independent_text` on existing extraction rows for books that were extracted before the age-adaptation capability existed
- **Input:** `bookshelf_item_id` (resolves to `book_library_id`)
- **Source:** `platform_intelligence.book_chunks` — the raw book text (NOT extractions)
- **Context:** Existing `audience='original'` extraction rows for this book — so Sonnet knows what adult extractions exist and can generate matching kid/teen versions
- **Model:** Sonnet via OpenRouter (not Haiku — founder tested Haiku, quality was unacceptable)
- **Output:** `guided_text` and `independent_text` for each existing extraction item
- **Storage:** UPDATE existing `platform_intelligence.book_extractions` rows — fill in the two NULL columns. Do NOT create new rows.
- **System prompt:** Same YOUTH_ADAPTATION_ADDENDUM from `bookshelf-extract`. Content safety rules mandatory (no secrecy, no hiding from parents, no exclusivity in friendships).

### Frontend Changes
- **`StudyGuideLibrary.tsx`** → Rework: show all extracted books. Per book: "View" buttons if guided/independent text exists, "Generate Study Guide" button if not. No child picker.
- **`StudyGuideModal.tsx`** → Simplify: no child picker, just "Generate Study Guide" with Sonnet progress indicator. Success shows counts + "View" buttons.
- **`ExtractionBrowser.tsx`** → Add audience toggle: Adult / Teen / Kid. Switches which column renders (`text`, `independent_text`, `guided_text`). Only show levels that have data.
- **`useExtractionData.ts`** → Already returns `guided_text` and `independent_text` from the RPC. Frontend toggle selects which field to display — no new queries needed.

### How the Toggle Works
The `get_book_extractions` RPC already returns `guided_text` and `independent_text` columns on every row. The toggle is purely a frontend display concern:
- "Adult" → render `item.text`
- "Teen" → render `item.independent_text` (fall back to `item.text` if NULL)
- "Kid" → render `item.guided_text` (fall back to `item.text` if NULL)

No separate queries, no audience parameter changes, no new RPC calls.

### Migration
- No schema changes needed — columns already exist
- Optional cleanup: delete old `study_guide_{memberId}` rows (45 rows)

## What This Replaces
- `bookshelf-study-guide` Edge Function (rewrite: chunks + existing extractions as context → Sonnet → UPDATE rows, not INSERT)
- `StudyGuideLibrary.tsx` (rework: book browser with generate button, not member-scoped list)
- `StudyGuideModal.tsx` (simplify: remove child picker)
- Old per-child study guide concept entirely

## Open Questions
- None — founder approved all decisions 2026-05-01
