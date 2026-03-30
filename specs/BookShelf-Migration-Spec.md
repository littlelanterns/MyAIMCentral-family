# BookShelf Migration Spec: StewardShip v1 → MyAIM Family v2

> **Status:** Planning complete, ready for execution
> **Created:** 2026-03-30
> **Purpose:** Complete specification for migrating 578 books + ~89K extraction items from StewardShip Supabase to MyAIM Family v2 BookShelf. Serves as both reference document and Claude Code build prompt.
> **Execution:** Direct database-to-database via Claude Code with parallel Sonnet agent teams.

---

## Overview

### What We're Migrating

| Source Table | Count | Destination Table |
|--------------|-------|-------------------|
| `manifest_items` | 578 books (all originals, zero clones) | `platform_intelligence.book_cache` + `bookshelf_items` |
| `manifest_chunks` | 58,115 chunks | `bookshelf_chunks` (platform-level) |
| `manifest_summaries` | 21,693 items | `bookshelf_summaries` |
| `ai_framework_principles` | 24,159 items (via 214 `ai_frameworks` parents) | `bookshelf_insights` (flat, no parent) |
| `manifest_action_steps` | 16,228 items (excluding reflection_prompts) | `bookshelf_action_steps` |
| `manifest_action_steps` (reflection_prompts only) | 2,166 items | `bookshelf_questions` (reclassified) |
| `manifest_declarations` | 17,035 items | `bookshelf_declarations` |
| `manifest_questions` | 7,786 items | `bookshelf_questions` |
| `manifest_collections` | 15 collections | `bookshelf_collections` |
| `manifest_collection_items` | 85 assignments | `bookshelf_collection_items` |

**Total extraction items migrating: ~89,067**

### What We're NOT Migrating

- All `embedding` columns (regenerated with text-embedding-3-small via pgmq triggers)
- `is_hearted`, `is_deleted`, `user_note` on all extraction tables (fresh curation state)
- `is_key_point` (regenerated via backfill heuristic: first 2 per section)
- `is_from_go_deeper` (fresh slate)
- `sent_to_mast`, `mast_entry_id`, `sent_to_compass`, `compass_task_id`, `sent_to_prompts`, `journal_prompt_id`
- `usage_designations` (deprecated)
- `related_wheel_id`, `related_goal_id` (StewardShip-specific FKs)
- `source_manifest_item_id` (cloning tracking — all 578 are originals)
- `ai_frameworks` parent table (absorbed — tags merged into book items)
- Original files from Supabase Storage (text_content + chunks are sufficient)
- Other users' data (only tenisewertman@gmail.com account)

### Three-Layer Architecture

```
Layer 1: Platform Book Cache
  platform_intelligence.book_cache  →  One record per unique book (title + author)
  bookshelf_chunks                  →  Platform-level RAG chunks (no family_id)
  Purpose: Deduplication. If anyone uploads the same book later, instant clone.

Layer 2: Founder's Family BookShelf
  bookshelf_items                   →  578 books scoped to founder's family_id
  bookshelf_summaries               →  Scoped to founder's family_member_id
  bookshelf_insights                →  Scoped to founder's family_member_id
  bookshelf_declarations            →  Scoped to founder's family_member_id
  bookshelf_action_steps            →  Scoped to founder's family_member_id
  bookshelf_questions               →  Scoped to founder's family_member_id
  Purpose: Founder's personal library with clean curation state.

Layer 3: Beta Tester Families (Phase E — separate execution)
  Each beta tester is "mom" of their own single-person family.
  Founder curates book lists per person.
  Clone script creates bookshelf_items + extraction records per beta family.
  Beta mom shares books with her family members via PersonPillSelector pattern.
```

---

## Source Database

### Connection

- **Project:** StewardShip — `dkcyaklyqxhkhcnpdtwf.supabase.co`
- **User filter:** `user_id` matching `tenisewertman@gmail.com` on all tables
- **Access:** Read-only — nothing changes in StewardShip

### Confirmed Source Schema

**manifest_items** (32 columns):
```
id, user_id, title, author, isbn, file_type, file_name, storage_path,
text_content (avg 347,421 chars — 100% populated on all 578),
file_size_bytes, usage_designations[] (DEPRECATED — drop),
tags[], genres[], folder_group (default 'uncategorized'),
related_wheel_id (drop), related_goal_id (drop),
processing_status ('pending'|'completed'), processing_detail,
extraction_status ('none'|'completed'),
chunk_count, intake_completed,
ai_summary, toc (JSONB), discovered_sections (JSONB),
source_manifest_item_id (all null — no clones),
parent_manifest_item_id (FK self-ref for multi-part),
part_number, part_count,
last_viewed_at, archived_at, created_at, updated_at
```

**manifest_chunks** (9 columns):
```
id, user_id, manifest_item_id, chunk_index, chunk_text, token_count,
embedding (vector — DROP), metadata (JSONB — chapter info inside), created_at
```
- Chapter metadata is in `metadata` JSONB field, NOT dedicated columns
- Must extract `chapter_title` and `chapter_index` from JSONB during migration

**Shared columns across manifest_summaries, manifest_action_steps, manifest_questions:**
```
id, user_id, manifest_item_id, section_title, section_index, content_type,
text, tags[], sort_order, audience,
is_hearted (DROP), is_deleted (DROP), is_from_go_deeper (DROP),
user_note (DROP), embedding (DROP), is_key_point (DROP), created_at
```

**ai_framework_principles** (unique structure):
```
id, user_id, framework_id (FK → ai_frameworks.id),
text, section_title, sort_order,
is_user_added, is_included,
is_hearted (DROP), is_deleted (DROP), is_from_go_deeper (DROP),
user_note (DROP), embedding (DROP), is_key_point (DROP),
archived_at, created_at, updated_at
```
- NO content_type column — default to 'principle' in v2
- NO section_index column — derive from section_title grouping or set NULL
- NO manifest_item_id — must JOIN through ai_frameworks to get book ID
- NO audience column
- NO tags column — tags live on ai_frameworks parent

**ai_frameworks** (intermediary parent — 214 rows, 1:1 with extracted books):
```
id, user_id, manifest_item_id, name, is_active, tags[], archived_at, created_at, updated_at
```
- `name` = AI-generated framework name (e.g., "Atomic Habits Philosophy") — not displayed in UI
- `tags[]` = AI-generated topic tags — merge into bookshelf_items.tags
- `manifest_item_id` = the FK we need to link principles → books

**manifest_declarations** (unique columns):
```
declaration_text (instead of "text"), declaration_style (instead of "content_type"),
value_name, sent_to_mast (DROP), mast_entry_id (DROP)
```

**manifest_action_steps** (unique columns):
```
sent_to_compass (DROP), compass_task_id (DROP)
```

**manifest_questions** (unique columns):
```
sent_to_prompts (DROP), journal_prompt_id (DROP)
```

### Multi-Part Book Structure

34 parent books with parts linked via `parent_manifest_item_id`. Some have more actual parts than `part_count` declares (e.g., 7 Habits: 48 actual parts vs part_count = 6).

Migration preserves this structure: parent books and parts each become separate `bookshelf_items` records. Parts link to parents via v2's equivalent FK.

### Book Status Breakdown

| Status | Count | Notes |
|--------|-------|-------|
| Extracted + processed | 195 | 62 are parts of multi-part books |
| Extracted + pending processing | 19 | All 19 are parts |
| Not extracted + processed | 267 | 5 are parts |
| Not extracted + pending | 97 | All 97 are parts |

---

## Destination Database

### Connection

- **Project:** MyAIM Central v2 — `vjfbzpliqialqmabfnxs.supabase.co`
- **Access:** Read-write
- **Founder's IDs:** Must be looked up at migration time from `families` and `family_members` tables

### Target Schema (PRD-23 + Audit Rulings)

**platform_intelligence.book_cache:**
```sql
CREATE TABLE platform_intelligence.book_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  title_author_embedding halfvec(1536),  -- for similarity matching
  genres TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  toc JSONB,
  isbn TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**bookshelf_items** (per-family): See PRD-23 full schema.
Key columns for migration: `family_id`, `uploaded_by_member_id`, `title`, `author`, `file_type`, `text_content`, `genres[]`, `tags[]`, `folder_group`, `processing_status`, `extraction_status`, `chunk_count`, `intake_completed`, `ai_summary`, `toc`, `isbn`, `book_cache_id`, `discovered_sections`, `last_viewed_at`, `created_at`.

**bookshelf_chunks** (platform-level): See PRD-23.
Key columns: `book_cache_id`, `chunk_index`, `chunk_text`, `token_count`, `chapter_title`, `chapter_index`, `embedding` (NULL — regenerated), `metadata`.

**bookshelf_summaries**: See PRD-23.
Key columns: `family_id`, `family_member_id`, `bookshelf_item_id`, `section_title`, `section_index`, `content_type`, `text`, `sort_order`, `is_key_point` (backfilled), `audience`, `is_hearted` (false), `is_deleted` (false), `embedding` (NULL — regenerated).

**bookshelf_insights** (Audit ruling: flat structure, no parent-child):
Key columns: `family_id`, `family_member_id`, `bookshelf_item_id`, `section_title`, `section_index` (derived), `content_type` (CHECK: principle, framework, mental_model, process, strategy, concept, system, tool_set), `text`, `sort_order`, `is_key_point`, `audience`, `is_included_in_ai`.

**bookshelf_declarations**: See PRD-23.
Key columns: `declaration_text`, `style_variant` (normalized snake_case).

**bookshelf_action_steps**: See PRD-23.

**bookshelf_questions**: See PRD-23.
Receives both original manifest_questions AND reclassified reflection_prompts from action_steps.

---

## Column Mapping: v1 → v2

### manifest_items → book_cache + bookshelf_items

| v1 Column | v2 Destination | Transform |
|-----------|---------------|-----------|
| `id` | — | New UUIDs generated in v2. Store v1 ID in a lookup map for FK resolution. |
| `user_id` | — | Replaced by `family_id` + `uploaded_by_member_id` (founder's IDs) |
| `title` | `book_cache.title` + `bookshelf_items.title` | Direct copy |
| `author` | `book_cache.author` + `bookshelf_items.author` | Direct copy |
| `isbn` | `book_cache.isbn` | Direct copy |
| `file_type` | `bookshelf_items.file_type` | Direct copy |
| `file_name` | `bookshelf_items.file_name` | Direct copy |
| `storage_path` | — | Not migrating files |
| `text_content` | `bookshelf_items.text_content` | Direct copy (heavy — batch separately) |
| `file_size_bytes` | `bookshelf_items.file_size_bytes` | Direct copy |
| `usage_designations` | — | DEPRECATED — drop |
| `tags[]` | `bookshelf_items.tags[]` | Copy + merge `ai_frameworks.tags` if framework exists |
| `genres[]` | `book_cache.genres[]` + `bookshelf_items.genres[]` | Direct copy |
| `folder_group` | `bookshelf_items.folder_group` | Direct copy |
| `related_wheel_id` | — | Drop |
| `related_goal_id` | — | Drop |
| `processing_status` | `bookshelf_items.processing_status` | Map: 'completed' → 'completed', 'pending' → 'completed' (all text is extracted) |
| `processing_detail` | — | Not needed post-migration |
| `extraction_status` | `bookshelf_items.extraction_status` | Direct copy |
| `chunk_count` | `book_cache.chunk_count` + `bookshelf_items.chunk_count` | Direct copy |
| `intake_completed` | `bookshelf_items.intake_completed` | Direct copy |
| `ai_summary` | `book_cache.ai_summary` + `bookshelf_items.ai_summary` | Direct copy |
| `toc` | `book_cache.toc` + `bookshelf_items.toc` | Direct copy |
| `discovered_sections` | `bookshelf_items.discovered_sections` | Direct copy (JSONB) |
| `source_manifest_item_id` | — | All null — drop |
| `parent_manifest_item_id` | `bookshelf_items.parent_bookshelf_item_id` | Resolve via v1→v2 ID lookup map |
| `part_number` | `bookshelf_items.part_number` | Direct copy |
| `part_count` | `bookshelf_items.part_count` | Direct copy |
| `last_viewed_at` | `bookshelf_items.last_viewed_at` | Direct copy |
| `archived_at` | `bookshelf_items.archived_at` | Direct copy |
| `created_at` | Both tables | Direct copy |
| `updated_at` | Both tables | Direct copy |

### manifest_chunks → bookshelf_chunks

| v1 Column | v2 Column | Transform |
|-----------|-----------|-----------|
| `id` | — | New UUID |
| `user_id` | — | Platform-level table, no user/family scoping |
| `manifest_item_id` | `book_cache_id` | Resolve: v1 item → v2 book_cache via ID lookup map |
| `chunk_index` | `chunk_index` | Direct |
| `chunk_text` | `chunk_text` | Direct |
| `token_count` | `token_count` | Direct |
| `embedding` | `embedding` | NULL — regenerated by pgmq trigger |
| `metadata` (JSONB) | `chapter_title` + `chapter_index` + `metadata` | Extract chapter fields from JSONB into dedicated columns; keep remaining JSONB |
| `created_at` | `created_at` | Direct |

**JSONB chapter extraction logic:**
```javascript
const chapterTitle = metadata?.chapter_title || metadata?.section_title || null;
const chapterIndex = metadata?.chapter_index || metadata?.section_index || null;
```

### manifest_summaries → bookshelf_summaries

| v1 Column | v2 Column | Transform |
|-----------|-----------|-----------|
| `id` | — | New UUID |
| `user_id` | `family_id` + `family_member_id` | Founder's IDs |
| `manifest_item_id` | `bookshelf_item_id` | v1→v2 ID lookup |
| `section_title` | `section_title` | Direct |
| `section_index` | `section_index` | Direct |
| `content_type` | `content_type` | Normalize (see Content Type Mapping below) |
| `text` | `text` | Direct |
| `tags[]` | — | Drop (not on v2 extraction tables per PRD-23) |
| `sort_order` | `sort_order` | Direct |
| `audience` | `audience` | Direct (default 'original') |
| `is_hearted` | `is_hearted` | Set `false` |
| `is_deleted` | `is_deleted` | Set `false` (skip any v1 rows where `is_deleted = true`) |
| `is_from_go_deeper` | `is_from_go_deeper` | Set `false` |
| `user_note` | `user_note` | Set `null` |
| `embedding` | `embedding` | NULL — regenerated |
| `is_key_point` | `is_key_point` | Set `false` — backfilled in post-processing step |
| `created_at` | `created_at` | Direct |
| — | `updated_at` | Set `now()` |
| — | `is_included_in_ai` | Set `true` |

### ai_framework_principles → bookshelf_insights

| v1 Column | v2 Column | Transform |
|-----------|-----------|-----------|
| `id` | — | New UUID |
| `user_id` | `family_id` + `family_member_id` | Founder's IDs |
| `framework_id` | `bookshelf_item_id` | JOIN: `ai_framework_principles.framework_id` → `ai_frameworks.id` → `ai_frameworks.manifest_item_id` → v2 ID lookup |
| — | `content_type` | Default `'principle'` (v1 has no content_type on this table) |
| `text` | `text` | Direct |
| `section_title` | `section_title` | Direct |
| — | `section_index` | Derive from section_title grouping within book, or set NULL |
| `sort_order` | `sort_order` | Direct |
| `is_user_added` | — | Drop (not in v2 schema) |
| `is_included` | `is_included_in_ai` | Direct rename |
| `archived_at` | — | Skip rows where `archived_at IS NOT NULL` |
| `is_hearted` | `is_hearted` | Set `false` |
| `is_deleted` | `is_deleted` | Set `false` |
| `is_from_go_deeper` | `is_from_go_deeper` | Set `false` |
| `user_note` | `user_note` | Set `null` |
| `embedding` | `embedding` | NULL — regenerated |
| `is_key_point` | `is_key_point` | Set `false` — backfilled later |
| — | `audience` | Set `'original'` |
| `created_at` | `created_at` | Direct |
| `updated_at` | `updated_at` | Direct |

**ai_frameworks.tags absorption:**
For each `ai_frameworks` record, merge its `tags[]` into the corresponding `bookshelf_items.tags[]` (append, deduplicate).

### manifest_declarations → bookshelf_declarations

| v1 Column | v2 Column | Transform |
|-----------|-----------|-----------|
| `declaration_text` | `declaration_text` | Direct (v2 keeps this column name) |
| `declaration_style` | `style_variant` | Normalize to snake_case (see mapping below) |
| `value_name` | — | Drop (not in v2 schema) |
| `sent_to_mast` | — | Drop |
| `mast_entry_id` | — | Drop |
| All shared columns | Same as summaries mapping | Same transforms |

### manifest_action_steps → bookshelf_action_steps (MINUS reflection_prompts)

| v1 Column | v2 Column | Transform |
|-----------|-----------|-----------|
| `content_type` | `content_type` | Normalize + EXCLUDE `reflection_prompt` rows (those go to questions) |
| `sent_to_compass` | — | Drop |
| `compass_task_id` | — | Drop |
| All shared columns | Same as summaries mapping | Same transforms |

### manifest_action_steps (reflection_prompts) + manifest_questions → bookshelf_questions

| Source | v2 Column | Transform |
|--------|-----------|-----------|
| `manifest_questions.*` | Standard mapping | Same as summaries |
| `manifest_action_steps WHERE content_type = 'reflection_prompt'` | `content_type` = `'reflection'` | Reclassify to questions table |

---

## Content Type Normalization

### Summaries: v1 → v2

v2 CHECK: `'key_concept', 'story', 'metaphor', 'lesson', 'quote', 'insight', 'theme', 'character_insight', 'exercise', 'principle'`

| v1 Value | v2 Value | Count | Notes |
|----------|----------|-------|-------|
| `key_concept` | `key_concept` | 5,957 | Direct |
| `narrative_summary` | `insight` | 3,413 | No v2 equivalent |
| `insight` | `insight` | 3,056 | Direct |
| `story` | `story` | 2,819 | Direct |
| `principle` | `principle` | 1,791 | Direct |
| `lesson` | `lesson` | 1,479 | Direct |
| `quote` | `quote` | 1,228 | Direct |
| `metaphor` | `metaphor` | 902 | Direct |
| `theme` | `theme` | 580 | Direct |
| `character_insight` | `character_insight` | 381 | Direct |
| `exercise` | `exercise` | ~40 | Direct |
| `framework` | `principle` | ~10 | Reclassify |
| `thematic_insight` | `insight` | ~10 | Consolidate |
| All other one-offs | `insight` | ~30 | Safe bucket |

### Action Steps: v1 → v2

v2 CHECK: `'exercise', 'practice', 'daily_action', 'habit', 'project', 'conversation_starter', 'weekly_practice'`

| v1 Value | v2 Value | Count | Notes |
|----------|----------|-------|-------|
| `exercise` | `exercise` | 4,273 | Direct |
| `practice` | `practice` | 4,139 | Direct |
| `daily_action` | `daily_action` | 2,819 | Direct |
| `reflection_prompt` | → MOVES TO `bookshelf_questions` | 2,166 | Reclassified as `content_type = 'reflection'` |
| `weekly_practice` | `weekly_practice` | 1,494 | Direct |
| `habit` | `habit` | 1,531 | Direct |
| `conversation_starter` | `conversation_starter` | 1,188 | Direct |
| `project` | `project` | 732 | Direct |
| All 28 one-offs (1-16 items each) | `exercise` | ~50 | Default bucket |

### Questions: v1 → v2 (clean — no normalization needed)

v2 CHECK: `'reflection', 'implementation', 'recognition', 'self_examination', 'discussion', 'scenario'`

| v1 Value | v2 Value | Count |
|----------|----------|-------|
| `reflection` | `reflection` | 1,747 |
| `self_examination` | `self_examination` | 1,728 |
| `implementation` | `implementation` | 1,272 |
| `discussion` | `discussion` | 1,114 |
| `recognition` | `recognition` | 1,029 |
| `scenario` | `scenario` | 896 |
| (from action_steps reclassification) | `reflection` | 2,166 |

### Declaration Styles: v1 → v2

v2 CHECK on `style_variant`: `'choosing_committing', 'learning_striving', 'recognizing_awakening', 'claiming_stepping_into', 'resolute_unashamed'`

| v1 Value | v2 Value | Count |
|----------|----------|-------|
| `choosing_committing` | `choosing_committing` | 5,983 |
| `"Choosing & Committing"` | `choosing_committing` | 13 |
| `learning_striving` | `learning_striving` | 3,183 |
| `"Learning & Striving"` | `learning_striving` | 9 |
| `recognizing_awakening` | `recognizing_awakening` | 3,137 |
| `"Recognizing & Awakening"` | `recognizing_awakening` | 12 |
| `claiming_stepping_into` | `claiming_stepping_into` | 2,647 |
| `"Claiming & Stepping Into"` | `claiming_stepping_into` | 3 |
| `resolute_unashamed` | `resolute_unashamed` | 2,032 |
| `"Resolute & Unashamed"` | `resolute_unashamed` | 6 |
| `stepping_into` | `claiming_stepping_into` | 10 |

---

## Execution Plan

### Prerequisites

1. PRD-23 BookShelf schema must exist in v2 Supabase (Phase A)
2. `platform_intelligence` schema must exist with `book_cache` table
3. pgmq queue infrastructure must be working
4. `embed` Edge Function must be deployed and functional
5. Founder's `family_id` and `family_member_id` must be known

### Phase A: Schema Creation

Standard PRD-23 build phase — create all BookShelf tables via migration SQL. This is the same work that happens during the PRD-23 build, just the database layer.

**Tables to create:**
- `platform_intelligence.book_cache`
- `bookshelf_items`
- `bookshelf_chapters` (may be populated from discovered_sections JSONB)
- `bookshelf_chunks`
- `bookshelf_summaries`
- `bookshelf_insights`
- `bookshelf_declarations`
- `bookshelf_action_steps`
- `bookshelf_questions`
- `journal_prompts`
- `bookshelf_discussions`
- `bookshelf_discussion_messages`
- `bookshelf_collections`
- `bookshelf_collection_items`
- `bookshelf_shares`
- `bookshelf_member_settings`

Plus all indexes, RLS policies, triggers (embedding triggers, updated_at triggers).

### Phase B+C: Direct Database Migration (Parallel Agent Teams)

**Environment:** Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
**Connections:** Both Supabase projects accessible via VS Code

**Orchestration (Opus):**
1. Connect to both databases
2. Look up founder's `family_id` and `family_member_id` from v2
3. Read all `manifest_items` (578 rows, excluding text_content initially)
4. Read all `ai_frameworks` (214 rows — need manifest_item_id + tags)
5. Build v1→v2 ID lookup maps (manifest_item_id → bookshelf_item_id, manifest_item_id → book_cache_id)
6. Create `book_cache` records (578 rows)
7. Create `bookshelf_items` records (578 rows, WITHOUT text_content)
8. Resolve parent_bookshelf_item_id for multi-part books
9. Merge ai_frameworks.tags into bookshelf_items.tags
10. Spawn parallel agents

**Agent 1: Chunks** (58,115 rows)
- Read `manifest_chunks` in batches of 1,000
- Extract `chapter_title` and `chapter_index` from `metadata` JSONB
- Map `manifest_item_id` → `book_cache_id`
- Insert into `bookshelf_chunks`
- Batch size: 1,000 rows per insert

**Agent 2: Summaries** (21,693 rows)
- Read `manifest_summaries` WHERE `user_id = founder AND is_deleted = false`
- Apply content_type normalization
- Map `manifest_item_id` → `bookshelf_item_id`
- Set clean curation state
- Insert into `bookshelf_summaries`
- Batch size: 500 rows per insert

**Agent 3: Insights** (24,159 rows)
- Read `ai_framework_principles` WHERE `user_id = founder AND archived_at IS NULL`
- JOIN through `ai_frameworks` to get `manifest_item_id`
- Map → `bookshelf_item_id`
- Set `content_type = 'principle'` (v1 has no content_type)
- Derive `section_index` from section_title grouping
- Carry `is_included` → `is_included_in_ai`
- Insert into `bookshelf_insights`
- Batch size: 500 rows per insert

**Agent 4: Declarations** (17,035 rows)
- Read `manifest_declarations` WHERE `user_id = founder AND is_deleted = false`
- Rename `declaration_text` → `declaration_text` (same in v2)
- Normalize `declaration_style` → `style_variant` (Title Case → snake_case, stepping_into → claiming_stepping_into)
- Drop `value_name`, `sent_to_mast`, `mast_entry_id`
- Insert into `bookshelf_declarations`
- Batch size: 500 rows per insert

**Agent 5: Action Steps + Questions** (~26,180 rows total)
- Read `manifest_action_steps` WHERE `user_id = founder AND is_deleted = false`
- Split: `content_type = 'reflection_prompt'` → bookshelf_questions (2,166 rows, mapped to `content_type = 'reflection'`)
- Remaining → bookshelf_action_steps (normalize one-off content types to `exercise`)
- Read `manifest_questions` WHERE `user_id = founder AND is_deleted = false` (7,786 rows)
- Insert questions from both sources into `bookshelf_questions`
- Insert action steps into `bookshelf_action_steps`
- Batch size: 500 rows per insert

**Post-parallel (Opus resumes):**
1. Migrate `text_content` onto `bookshelf_items` in batches of 10 (heavy column — ~3.5MB per batch)
2. Create `bookshelf_collections` (15 rows) with new UUIDs
3. Create `bookshelf_collection_items` (85 rows) mapping v1 collection+book IDs → v2
4. Run key_point backfill: `UPDATE SET is_key_point = true` on first 2 items per (bookshelf_item_id, section_title) per extraction table
5. Create `bookshelf_member_settings` record for founder
6. Report final counts and verify against expected totals

### Phase D: Embedding Regeneration (Automatic)

All inserts from Phase B+C will have fired `queue_embedding_on_change` triggers, queuing jobs in pgmq.

**Expected queue volume:**
- bookshelf_chunks: 58,115 embedding jobs
- bookshelf_summaries: ~21,693 jobs
- bookshelf_insights: ~24,159 jobs
- bookshelf_declarations: ~17,035 jobs
- bookshelf_action_steps: ~16,228 jobs
- bookshelf_questions: ~9,952 jobs
- book_cache title_author_embedding: 578 jobs
- **Total: ~147,760 embedding jobs**

**Model:** text-embedding-3-small ($0.02/M tokens)
**Estimated cost:** $2-4 (based on average extraction item length of ~50 tokens)
**Estimated time:** Depends on Edge Function throughput. At 100 embeddings/sec, ~25 minutes. At 10/sec, ~4 hours.

**Monitoring:**
```sql
SELECT count(*) FROM pgmq.q_embedding_jobs WHERE status = 'pending';
SELECT count(*) FROM pgmq.q_embedding_jobs WHERE status = 'completed';
```

### Phase E: Beta Tester Distribution (Separate Execution)

**Timing:** After Phase D completes (all embeddings generated).

**Process:**
1. Create beta tester family accounts (each person is "mom" of their own family)
2. Founder defines curated book lists per tester (e.g., "Mom: these 30 books, Daughter: these 20")
3. Clone script for each beta family:
   a. Create `bookshelf_items` scoped to their `family_id`, linked to same `book_cache_id`
   b. Clone extraction records from founder's family with beta person's `family_member_id`
   c. Clean curation state on all cloned records
4. Each beta mom uses PersonPillSelector to share books with their own family members

**The sharing flow matches existing platform patterns:**
- Mom opens a book → taps "Share" → PersonPillSelector shows family members
- Selected members get `bookshelf_shares` records
- Shared books appear in those members' BookShelf views

---

## Verification Checklist

After migration, verify:

| Check | Expected | Query |
|-------|----------|-------|
| book_cache count | 578 | `SELECT count(*) FROM platform_intelligence.book_cache` |
| bookshelf_items count | 578 | `SELECT count(*) FROM bookshelf_items WHERE family_id = ?` |
| chunks count | 58,115 | `SELECT count(*) FROM bookshelf_chunks` |
| summaries count | ~21,693 | `SELECT count(*) FROM bookshelf_summaries WHERE family_member_id = ?` |
| insights count | ~24,159 | `SELECT count(*) FROM bookshelf_insights WHERE family_member_id = ?` |
| declarations count | ~17,035 | `SELECT count(*) FROM bookshelf_declarations WHERE family_member_id = ?` |
| action_steps count | ~16,228 | `SELECT count(*) FROM bookshelf_action_steps WHERE family_member_id = ?` |
| questions count | ~9,952 | `SELECT count(*) FROM bookshelf_questions WHERE family_member_id = ?` |
| collections count | 15 | `SELECT count(*) FROM bookshelf_collections WHERE family_id = ?` |
| collection items count | 85 | `SELECT count(*) FROM bookshelf_collection_items` |
| No null bookshelf_item_id | 0 | `SELECT count(*) FROM bookshelf_summaries WHERE bookshelf_item_id IS NULL` (repeat per table) |
| No null book_cache_id on chunks | 0 | `SELECT count(*) FROM bookshelf_chunks WHERE book_cache_id IS NULL` |
| Multi-part parents resolved | 34 | `SELECT count(*) FROM bookshelf_items WHERE parent_bookshelf_item_id IS NOT NULL` should match v1 part count |
| Declaration styles normalized | 0 | `SELECT count(*) FROM bookshelf_declarations WHERE style_variant NOT IN ('choosing_committing','learning_striving','recognizing_awakening','claiming_stepping_into','resolute_unashamed')` |
| No reflection_prompts in action_steps | 0 | `SELECT count(*) FROM bookshelf_action_steps WHERE content_type = 'reflection_prompt'` |
| Key points backfilled | >0 per table | `SELECT count(*) FROM bookshelf_summaries WHERE is_key_point = true` |
| Embeddings queued | ~147,760 | Check pgmq queue |
| text_content migrated | 578 | `SELECT count(*) FROM bookshelf_items WHERE text_content IS NOT NULL` |
| Framework tags merged | spot check | Compare a few books' tags against v1 ai_frameworks.tags |

---

## Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Direct database-to-database migration | Claude Code has access to both Supabase projects. Eliminates CSV export step. |
| 2 | Parallel Sonnet agent teams | 5 extraction tables are independent — can be migrated simultaneously. |
| 3 | Drop all curation state | Fresh start. Hearts, notes, key points can be re-established in v2. |
| 4 | Regenerate all embeddings | v1 uses ada-002; v2 uses text-embedding-3-small. Different models, incompatible vectors. |
| 5 | Flatten ai_frameworks | 1:1 with books, never displayed in UI. Tags merge into book items. |
| 6 | Move reflection_prompts to questions | v2 rule: action steps are strictly actions. Reflection prompts belong in questions table. |
| 7 | Backfill key_points as first 2 per section | Same heuristic used in PRD-25 for books without AI-generated key points. |
| 8 | Skip file migration | text_content + chunks are sufficient. Original PDFs/EPUBs not needed by any feature. |
| 9 | Preserve multi-part structure | Parent-part relationships carried over via ID lookup map. |
| 10 | Preserve collections | 15 collections with 85 assignments — small but worth keeping for library organization. |
| 11 | Beta testers as separate families | Each beta mom controls her own family's sharing. Uses PersonPillSelector for member distribution. |
| 12 | Push to beta mom only | Founder curates subsets per tester. Beta mom decides which family members get which books. |
| 13 | text_content stays on bookshelf_items | Same as StewardShip pattern. Postgres TOASTs large TEXT columns automatically. Just exclude from SELECT * on list queries. |
| 14 | Study guides are post-migration, not part of migration | Study guides (PRD-25 §15) rewrite existing key-point extractions for a specific child using Haiku (~$0.01-0.02/book/child). They use the `audience` column already present on all extraction tables. Migration sets `audience = 'original'` on all records. Study guide generation is an on-demand UI feature built during PRD-23, not a data migration task. |

---

## Post-Migration Features Enabled

### Study Guides (PRD-25 §15)

The migration sets up all prerequisites for age-adapted study guides:

- **`audience` column** on all 5 extraction tables → migrated as `'original'`
- **`is_key_point` flags** → backfilled (study guides transform key-point items)
- **Full text_content + chunks** → available if study guide generation ever needs raw book context

**How study guides work (post-migration, on-demand):**
1. Mom opens an extracted book → taps "Study Guide" in Apply section
2. Selects child from family member picker + detail level (brief/standard/detailed)
3. `bookshelf-study-guide` Edge Function (Haiku) rewrites key-point items using the child's Archives context (InnerWorkings, interests, learning style, challenges)
4. New rows inserted with `audience = 'study_guide_{childId}'`
5. Mom reviews, edits if desired, toggles "Share with [child]"
6. Child sees only their personalized version in their BookShelf

**What gets generated per tab:**
- Summaries → "Key Ideas" (simplified language, relatable examples)
- Action Steps → "Try This" (adapted for young person's daily life)
- Questions → "Think About" (personal, conversational)
- Declarations → "Principles to Remember" (reframed for identity journey)
- Insights → NOT included (too analytical for kids)

**Cost:** ~$0.01-0.02 per book per child. No re-extraction from raw book text — only rewrites existing extractions.

---

*End of Migration Spec*