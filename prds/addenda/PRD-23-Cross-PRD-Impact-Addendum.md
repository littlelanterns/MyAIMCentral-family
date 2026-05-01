# PRD-23 Cross-PRD Impact Addendum
## BookShelf (Book Knowledge System) — Impact on Existing PRDs

**Created:** March 15, 2026
**Parent PRD:** PRD-23 (BookShelf)

---

## Impact Summary

PRD-23 introduces BookShelf, the family's book and document knowledge system. It has significant cross-PRD impact because it:
1. Registers two new LiLa guided modes
2. Adds four new extraction tables to the semantic search infrastructure
3. Wires several stubs from earlier PRDs
4. Creates new incoming flows to Guiding Stars, Tasks, InnerWorkings, Smart Notepad, Victory Recorder, and Rhythms
5. Replaces the speculative `knowledge_base_chunks` reference in the Semantic Context Infrastructure Addendum
6. Fully wires Channel E (Book Knowledge Library) in the Platform Intelligence Pipeline

---

## PRD-05: LiLa Core AI System

### Guided Mode Registry — Two New Entries

Add to the Registered Modes table in Section "Guided Mode Registry":

| Mode Key | Display Name | Parent Mode | Model | Available To |
|----------|-------------|-------------|-------|-------------|
| `book_discuss` | Discuss This Book | bookshelf_action | Sonnet | Mom, Adult, Independent |
| `library_ask` | Ask Your Library | bookshelf_action | Sonnet | Mom, Adult, Independent |

### Context Assembly Pipeline — New Context Sources

Add to the context sources that the context assembly pipeline can load:

- `bookshelf_summaries` — extracted book summaries (filtered by `book_knowledge_access` setting + `is_included_in_ai`)
- `bookshelf_insights` — extracted principles and frameworks (same filters)
- `bookshelf_declarations` — extracted declarations (same filters)
- `bookshelf_action_steps` — extracted action steps (same filters)
- Active `bookshelf_frameworks` loaded alongside Guiding Stars when `is_active = true`
- RAG chunks (`bookshelf_chunks`) available in `book_discuss` and `library_ask` modes only

### Stubs Updated

The following PRD-05 stubs are now wired:
- "Library Vault tutorial links when Library Vault PRD is built" → BookShelf is distinct from AI Vault but its guided modes are now registered in the LiLa registry.

---

## PRD-06: Guiding Stars & Best Intentions

### New Incoming Flow

Add to Incoming Flows:

| Source | How It Works |
|--------|-------------|
| BookShelf Declarations (PRD-23) | User taps "Send to Guiding Stars" on a BookShelf declaration → creates `guiding_stars` entry with `source = 'bookshelf'`, `source_reference_id` → `bookshelf_declarations.id`. The declaration text becomes the Guiding Star content. User can edit before saving. |
| BookShelf Discussion action chip (PRD-23) | During a book discussion, "Create a Guiding Star" action chip → routes selected text through Guiding Stars creation flow. |

### Source Enum Update

If `guiding_stars` has a `source` column or enum, add `'bookshelf'` as a valid value.

---

## PRD-07: InnerWorkings

### Content Extraction Stub — Wired

The stub "Content extraction input path from Knowledge Base" is now wired:

**Flow:** User views BookShelf extractions → selects "Inform InnerWorkings" action on relevant content → AI extracts personality-relevant insights from the selected extraction(s) → user reviews and confirms via Human-in-the-Mix → saves to `self_knowledge` with:
- `source_type = 'content_extraction'`
- `source_reference_id` → the BookShelf extraction item ID (could be a summary, principle, declaration, or action step)
- User selects the appropriate InnerWorkings category during the review step

---

## PRD-08: Journal + Smart Notepad

### New Incoming Flows

Add to Smart Notepad incoming flows:

| Source | How It Works |
|--------|-------------|
| BookShelf Discussion action chip (PRD-23) | During a book discussion, "Send to Notepad" action chip → routes the selected discussion content to a new Smart Notepad tab. From there, the user can use Review & Route to send it anywhere else in the system. |
| Journal Prompts Library "Write About This" (PRD-23) | User taps "Write About This" on a saved journal prompt → opens Smart Notepad with the prompt text displayed as a context header above the writing area. User writes their reflection below. Routes to Journal via normal Smart Notepad flow. |

### New Table: `journal_prompts`

PRD-23 introduces a `journal_prompts` table (not prefixed with `bookshelf_` — it's a standalone table). This table serves as a personal prompt library that feeds the Journal writing experience. The primary source is BookShelf question extraction, but the table also supports manual prompt creation and is architecturally ready for future sources (LiLa suggestions, Rhythms & Reflections prompts, etc.).

The Journal page may add a "Prompts" view or link that surfaces saved prompts from this table. The Journal Prompts Library screen (defined in PRD-23) is the primary browsing/searching interface, but a lightweight "random prompt" card on the Journal page could also pull from this table.

> **Forward note:** The `journal_prompts` table `source` field currently supports `'manual'` and `'bookshelf_extraction'`. Future PRDs (Rhythms, LiLa) can add their own source values without schema changes.

---

## PRD-09A: Tasks, Routines & Opportunities

### New Task Source

Add `'bookshelf'` to the task source enum (or valid values for the source field on `tasks`):

| Source | How It Works |
|--------|-------------|
| BookShelf Action Steps (PRD-23) | User taps "Send to Tasks" on a BookShelf action step → opens task creation modal pre-filled with the action step text as the description and `source = 'bookshelf'`. Tracked by `bookshelf_action_steps.sent_to_tasks` + `task_id`. |
| BookShelf Questions (PRD-23) | User taps "Send to Tasks" on a BookShelf question → opens task creation modal pre-filled with the question text and `source = 'bookshelf'`. Tracked by `bookshelf_questions.sent_to_tasks` + `task_id`. Used when a question is more action-oriented (e.g., "Have a conversation with your spouse about...") than reflective. |
| BookShelf Book Assignment (PRD-23) | Mom taps "Assign as Task" on a book or collection → opens task creation modal with book/collection reference, assignee picker, and due date. Creates a standard task with `source = 'bookshelf'` and a description referencing the book. |
| BookShelf Discussion action chip (PRD-23) | During a book discussion, "Create a Task" action chip → opens task creation modal pre-filled with discussion context. |

---

## PRD-11: Victory Recorder + Daily Celebration

### New Victory Source

Add `'bookshelf'` as a valid victory source:

| Source | How It Works |
|--------|-------------|
| BookShelf book completion (PRD-23) | When a member finishes reading/extracting a book, they can record it as a victory. The victory references the book title and can include a personal reflection. Source = 'bookshelf'. |

> **Forward note:** Automatic "book completed" detection is post-MVP. For now, the user manually records the victory. Future versions could detect when all selected chapters have been extracted and offer a "Celebrate finishing this book?" prompt.

---

## PRD-13: Archives & Context

### BookShelf Follows the Three-Tier Toggle Pattern

All four BookShelf extraction tables include `is_included_in_ai` (BOOLEAN, default true), following the three-tier toggle pattern established in PRD-13:
- Person level: BookShelf member settings → `book_knowledge_access` (hearted_only / all_extracted / framework_only / none)
- Category level: per-extraction-type toggle (future, if needed)
- Item level: `is_included_in_ai` on each extraction record

> **Decision rationale:** BookShelf's `book_knowledge_access` setting serves as the person-level toggle for book content. The item-level `is_included_in_ai` provides granular control. Category-level toggling (e.g., "include summaries but not declarations") is available as a future enhancement without schema changes.

---

## PRD-18: Rhythms & Reflections

### BookShelf Content Available for Rhythm Content

BookShelf extracted content is available via semantic search during rhythm content assembly:
- Morning Rhythm: LiLa can pull devotional/inspirational content from the user's BookShelf for reflection prompts
- Evening Rhythm: if the inline reflection prompt rotation includes book-related prompts, semantic search surfaces relevant BookShelf content

This requires no schema changes to PRD-18 — the semantic search infrastructure (match_by_embedding) automatically includes BookShelf extraction tables once they're registered.

---

## Semantic Context Infrastructure Addendum

### Reference Update

The addendum's forward note in Section "How Features Consume This Infrastructure" references a speculative `knowledge_base_chunks` table:

> *"When the Knowledge Base PRD is written, it defines a `knowledge_base_chunks` table..."*

**Update:** This is now `bookshelf_chunks`, and it lives at the platform level (keyed to `platform_intelligence.book_cache`, not to `family_id`). The `match_by_embedding` function works against it for RAG search, filtered to books that exist in the requesting user's family BookShelf.

### Embeddable Fields Map — New Entries

Add to the Embeddable Fields Map table:

| Table | Embeddable Text Formula | Notes |
|-------|------------------------|-------|
| `bookshelf_chunks` | `chunk_text` | Platform-level RAG chunks. Used in `book_discuss` and `library_ask` modes. |
| `bookshelf_summaries` | `text` | Per-member extracted summaries. |
| `bookshelf_insights` | `content_type || ': ' || text` | Per-member principles & frameworks. Content type provides classification signal. |
| `bookshelf_declarations` | `COALESCE(value_name || ': ', '') || declaration_text` | Per-member declarations. Value name provides thematic signal. |
| `bookshelf_action_steps` | `content_type || ': ' || text` | Per-member action steps. Content type provides classification signal. |
| `bookshelf_questions` | `content_type || ': ' || text` | Per-member extracted questions. Content type provides classification signal. |

### Tables Receiving Embedding Columns — New Entries

Add embedding column specs for: `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, `bookshelf_chunks`. All follow the standard pattern: `halfvec(1536)`, HNSW index with `halfvec_cosine_ops`, trigger on text change → `util.queue_embedding_job()`.

---

## Platform Intelligence Pipeline v2

### Channel E — Fully Wired

Channel E (Book Knowledge Library) is now fully specified by PRD-23:

**Flow 1 (Book Extraction Caching):** Upload → AI classification → title+author embedding → `book_cache` check (similarity ≥ 0.9) → cache hit: clone extractions / cache miss: fresh Sonnet extraction → cache new extractions to `book_extraction_cache`.

**Flow 2 (Framework Curation for LiLa Training):** Framework extraction → Layer 1: Haiku pre-screen on book metadata → Layer 2: Sonnet principle-level scan → Layer 3: admin review (flagged items only) → approved frameworks → `synthesized_principles` (convergence detection via embedding similarity > 0.8).

**Ethics gate behavior:** Books that fail the ethics gate are still fully functional for personal use. Only the LiLa training pipeline is gated. The `ethics_gate_status` on `book_cache` prevents re-screening when the same book is uploaded by another family.

---

## AI Cost Optimization Patterns

### BookShelf Cost Patterns

BookShelf applies the following optimization patterns:

| Pattern | Application |
|---------|-------------|
| P1 — Semantic Context Assembly | BookShelf extraction tables searched via `match_by_embedding` for context assembly in all LiLa modes. |
| P5 — On-Demand Secondary Output | Book discussion action chips (Create a Guiding Star, Create a Task, etc.) are on-demand — no pre-generation, each triggers a focused call only when tapped. |
| P9 — Per-Turn Context Refresh | Book discussion context refreshed per message via RAG + semantic search, not loaded once at conversation start. |
| Platform cache (Channel E) | Extraction caching across families eliminates ~90% of repeat Sonnet extraction costs for popular books. |

---

## Build Order Source of Truth v2

### Updates Needed

1. **Section 2 (Completed PRDs):** Add PRD-23 to the table once written:

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-23** | BookShelf | `bookshelf_items`, `bookshelf_chunks`, `bookshelf_summaries`, `bookshelf_frameworks`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, `journal_prompts`, `bookshelf_discussions`, `bookshelf_discussion_messages`, `bookshelf_collections`, `bookshelf_collection_items`, `bookshelf_shares`, `bookshelf_member_settings` |

2. **Section 4 (Side Quests):** Mark "Personal Library / Manifest" as completed → PRD-23.

3. **Section 7 (Name Mapping):** Update the mapping:

| StewardShip Name | MyAIM v2 Name | PRD |
|-----------------|--------------|-----|
| The Manifest | BookShelf | PRD-23 |

4. **Section 8 (Guided Modes):** Add:

| Mode Key | Display Name | Registered By |
|----------|-------------|---------------|
| `book_discuss` | Discuss This Book | PRD-23 |
| `library_ask` | Ask Your Library | PRD-23 |

5. **Section 11 (Known Inconsistencies):** Add:

| Rename | Documents Still Using Old Name |
|--------|-------------------------------|
| Knowledge Base → BookShelf | Semantic Context Infrastructure Addendum (references `knowledge_base_chunks`), Platform Intelligence Pipeline v2 (references "Knowledge Base / Manifest") |

---

*End of PRD-23 Cross-PRD Impact Addendum*
