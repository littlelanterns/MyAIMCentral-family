# MyAIM Family: Semantic Context Infrastructure Addendum
## pgvector Embedding Layer for Intelligent Context Assembly

**Created:** March 15, 2026
**Type:** Infrastructure Addendum (not a feature PRD — shared infrastructure referenced by multiple PRDs)
**Referenced by:** PRD-05C (LiLa Optimizer), PRD-13 (Archives & Context), Knowledge Base PRD (future)
**Depends on:** Supabase project created, pgvector extension available (included in all Supabase plans)

---

## Purpose

This addendum specifies a shared semantic search infrastructure layer that multiple features consume. Instead of each feature PRD independently defining embedding logic, this document is the single source of truth for:

- pgvector extension setup
- The reusable `embed` Edge Function
- The automatic embedding queue pipeline (triggers → pgmq → cron → Edge Function)
- The shared `match_by_embedding` Postgres function
- Which tables get embedding columns and what text they embed
- Cost analysis

No feature PRD needs to re-specify this infrastructure. They reference this addendum and specify only their feature-specific query patterns.

---

## What This Enables

**Without semantic search (preset-based, current PRD-05C spec):**
Mom types "Gideon's been struggling and I want to help him feel more confident before his co-op presentation next week." → Optimizer detects "child + school" → selects Homework Help preset → pulls Gideon's academic context folder.

**With semantic search (this addendum):**
Same request → Optimizer generates one embedding → similarity search across ALL of Gideon's context → surfaces his personality note about social anxiety, the Best Intention about fostering his relationship with Mosiah, the Archives entry about his successful science fair presentation, and the faith-based encouragement approach from family context — all in one query, no preset selection needed.

The preset system (PRD-05C) remains as a manual override. Semantic search enhances auto-detect mode.

---

## Cost Analysis

**Embedding model:** OpenAI `text-embedding-3-small` — $0.02 per million tokens, 1536 dimensions.

**Per-family estimates (active family with 9 children):**

| Data Type | Est. Items | Avg Tokens/Item | Total Tokens | One-Time Embed Cost |
|-----------|-----------|-----------------|-------------|-------------------|
| Archive context items | 500 | 80 | 40,000 | $0.0008 |
| Best Intentions | 20 | 150 | 3,000 | $0.00006 |
| InnerWorkings entries | 100 | 100 | 10,000 | $0.0002 |
| Guiding Stars | 50 | 60 | 3,000 | $0.00006 |
| Journal entries (AI-opted) | 200 | 200 | 40,000 | $0.0008 |
| **Total initial embed** | **870** | | **96,000** | **$0.00192** |

**Ongoing costs:**
- ~20 new/updated items per day x 100 tokens avg = 2,000 tokens/day
- Monthly: ~60,000 tokens = **$0.0012/family/month**
- Query-time embeddings: ~100 Optimizer uses/month x 50 tokens = 5,000 tokens = **$0.0001/month**

**Total per-family AI embedding cost: < $0.01/month.** This is negligible compared to the Sonnet/Haiku calls the Optimizer already makes.

> **Decision rationale:** OpenAI `text-embedding-3-small` chosen over Supabase's built-in `gte-small` model because it produces higher-quality embeddings for the varied, personal, natural-language content families generate (not just technical docs). The cost difference is effectively zero at this scale. If OpenAI dependency becomes a concern, switching to `gte-small` (free, runs in Edge Functions) requires only changing the embed Edge Function — the rest of the pipeline is model-agnostic.

---

## Infrastructure Components

### 1. Enable pgvector Extension

One-time migration. Must run before any table gets an embedding column.

```sql
-- Migration: 001_enable_pgvector.sql
create extension if not exists vector;
```

> **Forward note:** pgvector is pre-installed on all Supabase instances. Enabling it is a single SQL statement.

### 2. Embedding Queue Infrastructure

Uses Supabase's recommended pattern: pgmq for job queuing, pg_net for Edge Function invocation, pg_cron for scheduled processing.

**Extensions to enable:**

```sql
create extension if not exists pgmq;
create extension if not exists pg_net;
create extension if not exists pg_cron;
```

**Queue creation:**

```sql
select pgmq.create('embedding_jobs');
```

**Generic trigger function** (reusable across all tables):

```sql
create or replace function util.queue_embedding_job()
returns trigger as $$
begin
  perform pgmq.send('embedding_jobs', jsonb_build_object(
    'table_name', TG_TABLE_NAME,
    'record_id', NEW.id,
    'family_id', NEW.family_id
  ));
  return NEW;
end;
$$ language plpgsql;
```

**Cron job** (processes queue every 10 seconds):

```sql
select cron.schedule(
  'process-embedding-queue',
  '10 seconds',
  $$select net.http_post(
    url := util.get_supabase_url() || '/functions/v1/embed',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || util.get_service_role_key()
    ),
    body := '{}'::jsonb
  )$$
);
```

> **Decision rationale:** Queue-based async processing chosen over synchronous embedding-on-write because: (a) mom never waits for embedding generation, (b) failed jobs retry automatically, (c) batch processing is more cost-efficient, (d) the same pattern handles both single-item updates and bulk imports.

### 3. Edge Function: `embed`

**Purpose:** Reads jobs from the embedding queue, generates embeddings via OpenAI, writes them back to the source table.

**Key behaviors:**
- Reads up to 20 jobs per invocation from the pgmq queue
- For each job: reads the record from the specified table, concatenates the embeddable fields (see Embeddable Fields Map below), calls OpenAI `text-embedding-3-small`, writes the resulting vector back to the record's `embedding` column
- Handles retries: failed jobs stay in the queue and are retried on next invocation
- Respects `is_included_in_ai` — if the item has been toggled off, the embedding is still generated (for when it's toggled back on) but the query function filters it out

**Environment variables:**
- `OPENAI_API_KEY` — stored in Supabase Vault

### 4. Shared Query Function: `match_by_embedding`

**Purpose:** Generic semantic search function callable from any feature's context assembly.

```sql
create or replace function match_by_embedding(
  query_embedding halfvec(1536),
  target_table text,
  family_id_filter uuid,
  match_threshold float default 0.3,
  match_count int default 10
)
returns table (
  id uuid,
  similarity float
)
language plpgsql
as $$
begin
  -- Dynamic query against the specified table
  -- Filters: family_id match, is_included_in_ai = true, embedding IS NOT NULL, archived_at IS NULL
  -- Orders by cosine similarity, returns top match_count above threshold
end;
$$;
```

> **Decision rationale:** Generic function with table name parameter rather than per-table functions. Reduces code duplication. The Optimizer's context assembly calls this once per table it wants to search, then merges and ranks results.

> **Forward note:** For the Knowledge Base PRD (book chunks), this same function works against the `knowledge_base_chunks` table. No new infrastructure needed — just a new table with an `embedding` column and a trigger pointing at the same queue.

---

## Embeddable Fields Map

Each table concatenates specific fields into a single text string for embedding generation. The `embed` Edge Function uses this mapping.

| Table | Embeddable Text Formula | Notes |
|-------|------------------------|-------|
| `archive_context_items` | `context_field || ': ' || context_value` | The label + content together capture meaning |
| `best_intentions` | `title || COALESCE('. ' || description, '')` | Title is the core; description adds depth |
| `self_knowledge` | `category || ': ' || content || COALESCE(' (Source: ' || source || ')', '')` | Category provides classification signal |
| `guiding_stars` | `content || COALESCE('. ' || description, '')` | The declaration text is primary |
| `journal_entries` | `text` | Full entry text. Only entries where `is_included_in_ai = true` are queried. |
| `knowledge_base_chunks` *(future)* | `chunk_text` | Book/document chunks from the Knowledge Base PRD |

---

## Tables Receiving Embedding Columns

Each table below gets one new column added to its existing schema. No other columns change.

### On `archive_context_items` (PRD-13)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| embedding | halfvec(1536) | | NULL | Auto-generated by embed Edge Function. NULL until first processing. |

**Index:** `CREATE INDEX ON archive_context_items USING hnsw (embedding halfvec_cosine_ops);`

**Trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF context_field, context_value ON archive_context_items
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

### On `best_intentions` (PRD-06)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| embedding | halfvec(1536) | | NULL | Auto-generated. |

**Index:** `CREATE INDEX ON best_intentions USING hnsw (embedding halfvec_cosine_ops);`

**Trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF title, description ON best_intentions
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

### On `self_knowledge` (PRD-07)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| embedding | halfvec(1536) | | NULL | Auto-generated. |

**Index:** `CREATE INDEX ON self_knowledge USING hnsw (embedding halfvec_cosine_ops);`

**Trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF content, source ON self_knowledge
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

### On `guiding_stars` (PRD-06)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| embedding | halfvec(1536) | | NULL | Auto-generated. |

**Index:** `CREATE INDEX ON guiding_stars USING hnsw (embedding halfvec_cosine_ops);`

**Trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF content, description ON guiding_stars
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

### On `journal_entries` (PRD-08)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| embedding | halfvec(1536) | | NULL | Auto-generated. |

**Index:** `CREATE INDEX ON journal_entries USING hnsw (embedding halfvec_cosine_ops);`

**Trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF text ON journal_entries
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

> **Note on journal entries:** All entries get embeddings generated, but the `match_by_embedding` query only returns entries where `is_included_in_ai = true`. This way, if mom toggles an entry back on, the embedding is already there — no re-processing needed.

---

## How Features Consume This Infrastructure

### LiLa Optimizer (PRD-05C) — Context Assembly Enhancement

The Optimizer's context assembly pipeline (step 4: "Apply three-tier toggles") gains a new sub-step:

1. **Existing behavior (preserved):** If mom manually selects a context preset, use preset-based folder matching as currently specified.
2. **New behavior (auto-detect mode):** When preset is "Auto-Detect":
   a. Generate one embedding for mom's input request
   b. Call `match_by_embedding` against each context table (archive_context_items, best_intentions, self_knowledge, guiding_stars, journal_entries) filtered by the relevant family members
   c. Merge results, deduplicate, rank by similarity score
   d. Take the top N items (configurable, default 15) as the context payload
   e. Apply privacy filters (is_privacy_filtered exclusion for non-mom contexts)
   f. Assemble into the system prompt's context section

> **Decision rationale:** Semantic search supplements rather than replaces the preset system. Presets remain available as manual overrides, and they still work even for families that haven't generated enough data for embeddings to be useful. Auto-detect just gets much smarter.

### Archives (PRD-13) — No Behavioral Change

Archives doesn't change its UI or behavior. It just gains an `embedding` column on `archive_context_items` with an auto-trigger. The embedding is consumed downstream by the Optimizer and (eventually) the Knowledge Base.

### Knowledge Base / Manifest (Future PRD) — Foundation Ready

When the Knowledge Base PRD is written, it defines:
- A `knowledge_base_chunks` table with `chunk_text` and `embedding` columns
- The book upload → text extraction → chunking pipeline (patterns exist in StewardShip's Manifest)
- A trigger on `knowledge_base_chunks` pointing at the same `embedding_jobs` queue
- "Chat with a book" queries use the same `match_by_embedding` function against the chunks table

**No new infrastructure is needed.** The queue, Edge Function, cron job, and query function are already built. The Knowledge Base PRD just adds a new table to the pipeline.

---

## Build Timing

**When to build:** During the first migration that creates any of the target tables — ideally the migration that creates `archive_context_items` and `best_intentions` (whichever build phase handles PRD-06 or PRD-13, whichever comes first in the build order).

**Build sequence:**
1. Enable extensions (pgvector, pgmq, pg_net, pg_cron) — in the infrastructure migration
2. Create utility schema and helper functions — same migration
3. Create the pgmq queue and cron job — same migration
4. Deploy the `embed` Edge Function — during the same build phase
5. Add `embedding` column + HNSW index + trigger to each table as that table is created in its respective build phase

**Estimated build time with Opus in Claude Code:** ~15 minutes for infrastructure (steps 1-4), then ~2 minutes per table (step 5) as each feature is built.

---

## Cost Impact: How Semantic Search Reduces AI API Spend

This infrastructure doesn't just add a capability — it actively reduces the cost of existing AI operations. The embedding pipeline pays for itself many times over.

### Reduction 1: Eliminates Context Classification Calls

Without semantic search, the Optimizer's auto-detect mode needs to figure out *which* context to load. This requires either:
- A Haiku classification call (~$0.001 per request) to categorize the prompt and select the right preset, or
- Loading everything and letting the reasoning model sort it out (token-heavy, expensive)

With semantic search, context relevance ranking is a **Postgres query** — zero AI cost. The only AI call is one embedding generation (~$0.000001). This eliminates the classification step entirely.

**Savings per family per month (at 100 Optimizer uses):**
- Without: 100 × $0.001 (Haiku classification) = **$0.10**
- With: 100 × $0.000001 (embedding) = **$0.0001**
- **Savings: ~$0.10/month per family**

### Reduction 2: Smaller, Tighter Context Windows on Reasoning Calls

When the Optimizer makes its 20% complex reasoning calls (Sonnet), the quality of the context it sends matters for both results AND cost. Without semantic search, context assembly dumps an entire category folder — maybe 40-50 items, many irrelevant. With semantic search, it sends only the 10-15 items that actually match the request.

**Impact on per-call cost:**
- Without: ~3,000 context tokens per Sonnet call (broad category dump)
- With: ~1,500 context tokens per Sonnet call (precision-ranked)
- At Sonnet input pricing ($3/1M tokens): saves ~$0.0045 per call
- At 20 Sonnet calls/month per family: **saves ~$0.09/month per family**

### Reduction 3: Fewer "Try Again" Loops

When context is imprecise, the AI produces imprecise results. Mom edits, regenerates, or starts over. Each regeneration is another full Sonnet call. Better context means better first-attempt results, which means fewer regeneration cycles.

This is harder to quantify, but conservatively: if semantic search reduces regenerations by even 20% (1 in 5 fewer retries), that's another 4 saved Sonnet calls per month at ~$0.005 each = **~$0.02/month per family**.

### Reduction 4: Cross-Feature Context Loading

Every LiLa mode — not just the Optimizer — benefits. General Chat, guided modes (self_discovery, safe_harbor, meeting frameworks), and morning/evening rhythms all load context. Semantic search means every context load is leaner and more relevant, reducing input tokens across all AI calls platform-wide.

### Net Cost Impact Summary

| Line Item | Monthly Cost Per Family |
|-----------|----------------------|
| Embedding generation (write-time) | +$0.002 |
| Embedding queries (read-time) | +$0.000 (Postgres, free) |
| Eliminated classification calls | −$0.10 |
| Reduced context window sizes | −$0.09 |
| Fewer regeneration cycles | −$0.02 |
| **Net savings** | **−$0.21/month per family** |

At 1,000 families: **~$210/month saved.** At 10,000 families: **~$2,100/month saved.**

The embedding pipeline costs roughly $2/month at 1,000 families. It saves roughly $210/month. That's a **100:1 return.**

> **AI-COST-TRACKER.md metric to track:** Average context tokens per Optimizer Sonnet call. Baseline before semantic search, then compare after. Target: 40-50% reduction in context tokens with equal or better output quality.

---

## CLAUDE.md Additions from This Addendum

- [ ] pgvector is enabled platform-wide. All embedding columns use `halfvec(1536)` with HNSW indexes using `halfvec_cosine_ops`.
- [ ] Embedding generation is async via pgmq queue → `embed` Edge Function → OpenAI `text-embedding-3-small`. Never synchronous on write.
- [ ] The `util.queue_embedding_job()` trigger function is generic. Any new table needing embeddings adds a trigger pointing at this function — do not create per-table queue functions.
- [ ] `match_by_embedding()` is the shared query function. Features call it with the target table name and family_id filter. Do not write per-feature similarity search functions.
- [ ] Embedding columns are always nullable (NULL until first processing). Queries must handle NULL embeddings gracefully (exclude from similarity search, not error).
- [ ] The `embed` Edge Function is the only place that calls the OpenAI embeddings API. No other Edge Function should generate embeddings independently. Track its costs in AI-COST-TRACKER.md.

---

## Pre-Build Audit Checklist Addition

Add to the Pre-Build Setup Checklist, Step 1 (PRD Consistency Audit):

- [ ] Verify all tables listed in this addendum's "Tables Receiving Embedding Columns" section exist in their respective PRDs
- [ ] Verify embeddable text formula matches actual column names in each PRD's schema
- [ ] Verify no PRD independently defines embedding generation (all should reference this addendum)

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **OpenAI `text-embedding-3-small` over Supabase built-in `gte-small`** | Higher quality for varied personal/natural language content. Cost difference is negligible at family-scale data volumes (~$0.002/family initial, <$0.01/month). Switching to gte-small requires only Edge Function change if needed. |
| 2 | **Async queue-based processing over synchronous embedding-on-write** | Mom never waits for embedding generation. Failed jobs retry automatically. Batch processing is more efficient. Supabase's recommended pattern. |
| 3 | **Generic infrastructure (one queue, one Edge Function, one query function) over per-feature implementations** | Prevents code duplication. New tables just add a trigger. The Knowledge Base PRD benefits from infrastructure that's already built and tested. |
| 4 | **halfvec(1536) over vector(1536)** | halfvec uses 16-bit floats (half precision) instead of 32-bit, cutting storage in half with negligible quality loss. Supabase's recommended approach for `text-embedding-3-small`. |
| 5 | **Semantic search supplements presets, doesn't replace them** | Presets still work as manual overrides. Semantic search enhances auto-detect mode. Families with sparse data still get good results via presets. |
| 6 | **All journal entries get embeddings, query filters by is_included_in_ai** | Avoids re-embedding when mom toggles an entry back on. Embedding cost is negligible. Storage cost is minimal (1536 x 2 bytes = 3KB per entry). |

---

*End of Semantic Context Infrastructure Addendum*
