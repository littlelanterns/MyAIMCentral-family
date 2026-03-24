# PRD-23: BookShelf (Book Knowledge System)

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System), PRD-04 (Shell Routing), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks), PRD-13 (Archives & Context)
**Created:** March 15, 2026
**Last Updated:** March 15, 2026

---

## Overview

BookShelf is the family's book and document knowledge system — a place where members upload books, PDFs, articles, and notes, and the platform transforms them into structured, searchable, actionable wisdom. It is the bridge between what a family reads and how that reading shapes their daily life, their values, and their growth.

> **Mom experience goal:** BookShelf should feel like having a brilliant librarian who's read every book you own and can instantly find the passage, the principle, or the declaration that's relevant to whatever you're dealing with today — and who can help you discuss what you've read with your family.

When a member uploads a book, BookShelf extracts its structure, discovers its chapters, and — when the member is ready — produces five types of structured content: summaries of key concepts, insights for living, honest declarations that resonate with the reader's identity, concrete action steps they can take, and questions that invite deeper reflection. Members curate this extracted wisdom by hearting the items that matter most, adding personal notes, and routing the best pieces to other features — a declaration becomes a Guiding Star, an action step becomes a task, a question becomes a journal prompt for a quiet moment later, a discussion insight flows through Smart Notepad to wherever it belongs.

BookShelf is a **family-level resource**. Uploads go to the family's shared BookShelf, and mom controls which members can access which books and extractions. A teenager who uploads a book contributes to the family library. Mom can assign books or collections as tasks. Each member's curation — hearts, notes, deleted items — is entirely their own, even when they're reading the same book.

At the platform level, BookShelf participates in a shared intelligence layer. When a book is uploaded that another family has already processed, the system silently serves cached extractions — saving significant AI cost while delivering an identical experience. Approved insights feed into LiLa's synthesized wisdom, where insights from multiple books converge into universal guidance that LiLa applies naturally in conversation, never citing a single source.

> **Decision rationale:** BookShelf is distinct from the AI Vault (PRD-21A/B/C). The Vault is the admin-curated public content storefront — tutorials, tools, and resources published by Tenise. BookShelf is the family's private knowledge base — their own uploaded books and documents. They connect through LiLa context assembly: both can feed LiLa's knowledge during conversations.

---

## User Stories

### Upload & Discovery

- As a mom, I want to upload a book I'm reading so I can extract its wisdom and reference it later.
- As a teen, I want to upload a book for a school project so our family can all benefit from it.
- As a mom, I want to paste in an article or blog post I found online so I can process it alongside my books.
- As a member, I want to see my upload processing in real time so I know the system is working.

### Extraction & Curation

- As a member, I want to select which chapters to extract so I can focus on the parts that matter to me.
- As a member, I want to heart the insights that resonate with me so I can find them easily later.
- As a member, I want to add personal notes to extractions so I can capture how they connect to my life.
- As a member, I want to "Go Deeper" on a chapter to get more insights when the first pass didn't capture everything.
- As a member, I want to re-run an extraction tab when I want a fresh perspective.

### Questions & Journal Prompts

- As a member, I want the system to extract thought-provoking questions from what I read so I can come back to them later when I have time to reflect.
- As a member, I want to save a question to my Journal Prompts library so I have a personal collection of reflection prompts drawn from my reading.
- As a member, I want to scroll through and search my saved prompts so I can find one that resonates in the moment.
- As a member, I want to see which book and chapter a prompt came from so I have context when I revisit it months later.
- As a member, I want to tap "Write About This" on a prompt to start a journal entry with that question as my starting point.
- As a member, I want to send a question to my task list when it's more of a "go do this" than a "sit and reflect."

### Discussions

- As a member, I want to discuss a book with LiLa so I can explore its ideas and connect them to my life.
- As a mom, I want to discuss multiple books together so LiLa can help me see connections across my reading.
- As a mom, I want to switch the audience of a discussion to "children" so I can get ideas for how to teach these concepts to my kids.

### Sharing & Assignment

- As a mom, I want to share specific books with specific family members so I can curate what each child reads.
- As a mom, I want to assign a book as a task to a family member so they have accountability to read it.
- As a mom, I want to share a collection of books on a topic with my teenager so they have a focused reading list.

### Cross-Feature Integration

- As a member, I want to send a declaration from a book to my Guiding Stars so it becomes part of my daily identity.
- As a member, I want to turn an action step into a task so I actually do what the book suggests.
- As a member, I want book discussions to offer action chips so I can route insights to the right place without leaving the conversation.

### Export

- As a member, I want to export my hearted items as an EPUB so I can read them on my Kindle.
- As a member, I want to export a book's insights as a document so I can reference them offline.

---

## Screens

### Screen 1: BookShelf Main Page

**What the user sees:**

The BookShelf page is the family's library view. The layout has a collapsible sidebar on the left (collections navigation) and the main content area showing book cards.

**Header area:**
- Page title: "BookShelf"
- Upload button (prominent) — opens the upload flow
- Text Note button (secondary) — opens the text note creation modal
- View toggle: grid view (default) / list view
- Search bar with type-ahead filtering across titles, authors, tags
- Filter bar: by genre, by collection, by extraction status, by tag

**Main content — book cards in grid:**
Each card shows:
- Book cover thumbnail (if available from metadata extraction) or a generated placeholder with the book's initials and a color based on genre
- Title and author
- Genre badges (small, colored)
- Processing status indicator (if still processing: animated progress bar with stage label)
- Extraction status: "Not extracted" / "Extracting..." / "Extracted" with count of items
- Heart count (total hearted items across all tabs)
- Collection badges (which collections this book belongs to)

**Empty state:** Warm illustration with LiLa reading a book. "Your BookShelf is empty. Upload your first book to get started." Upload button prominent.

**Sidebar — Collections:**
- "All Books" (default, shows everything)
- "Hearted Items" (aggregated view across all books)
- User-created collections listed below, drag-to-reorder
- "+ New Collection" button at bottom
- Each collection shows book count

**Interactions:**
- Tap a book card → navigates to Screen 2 (Book Detail)
- Tap "Hearted Items" → navigates to Screen 5 (Aggregated Hearted Items)
- Tap a collection → filters main view to that collection's books
- Long-press a book card → context menu: Add to Collection, Share with Family, Assign as Task, Archive
- Upload button → Screen 3 (Upload Flow)

**Data created/updated:** None directly (display screen).

### Screen 2: Book Detail Page

**What the user sees:**

Full-page view for a single book, organized in tabs.

**Header area:**
- Back arrow → BookShelf main page
- Book title (editable inline) and author (editable inline)
- Genre badges (editable — tap to open genre picker)
- AI-generated summary (2-4 sentences, collapsible)
- Action buttons: Discuss This Book, Export, Share, Assign as Task, Archive

**Tab bar:**
- **About** — metadata, table of contents, processing info
- **Summaries** — extracted key concepts, stories, quotes, insights
- **Insights** — structured wisdom: principles, frameworks, mental models, processes, strategies, concepts, systems, tool sets
- **Declarations** — honest identity declarations in varied styles and richness
- **Action Steps** — exercises, practices, habits, conversation starters (strictly actions, not questions)
- **Questions** — reflection prompts, implementation questions, discussion starters, scenarios

**About tab:**
- Full AI summary
- Table of contents (from document structure extraction)
- File info: format, size, upload date, uploaded by [member name]
- Tags (editable, comma-separated)
- Folder/category (editable dropdown)
- Processing details: chunk count, extraction status
- "Re-classify" button (re-runs AI classification)

**Extraction tabs (Summaries, Insights, Declarations, Action Steps, Questions):**

If extraction has not been run:
- Section discovery button: "Discover Chapters" — runs Haiku to identify document structure
- After discovery: chapter list with checkboxes. User selects which chapters to extract.
- **Extraction type selector** — five checkboxes, all checked by default:
  - ✓ Summaries
  - ✓ Insights
  - ✓ Declarations
  - ✓ Action Steps
  - ✓ Questions
  - User can uncheck any types they don't want for this book (e.g., uncheck all except Insights to pull just the insights)
- "Merge Short Sections" toggle (combines small sections for better extraction quality)
- "Extract Selected" button → begins parallel extraction across only the checked tabs for the checked chapters

> **Decision rationale:** Building the tab selector from day one avoids a "tacked on" feel later. Many books warrant only one or two extraction types — a leadership book may only need Insights, a devotional may only need Declarations and Questions. Skipping unchecked types saves Sonnet tokens and reduces noise. Users can always run additional types later via per-tab "Extract" buttons on empty tabs.

If extraction is partially complete (some tabs extracted, others not):
- Extracted tabs show their content normally
- Unextracted tabs show an "Extract [Tab Name]" button, allowing the user to run that type on demand at any time
- The extraction type selector re-appears if the user wants to run additional types across chapters

If extraction is complete:
- Content organized by chapter (collapsible sections)
- Each item shows:
  - Content text
  - Content type badge (e.g., "key_concept", "principle", "mental_model", "exercise", "reflection", "scenario")
  - Heart button (toggle) with fill animation
  - Delete button (soft delete with fade animation)
  - Note indicator (if user_note exists)
  - "Go Deeper" sparkle icon on items from secondary extraction
- Per-chapter controls: "Go Deeper" button, "Re-Run" button
- Per-tab controls: "Re-Run All" button
- View modes: By Chapter (default), By Type, Notes Only
- Filter: All / Hearted Only

**Questions tab — additional interactions:**
- Each question item has two routing buttons:
  - "Add to Journal Prompts" → saves to the Journal Prompts library with book title and chapter context. Shows "Added" badge after saving.
  - "Send to Tasks" → routes to task creation modal (same as action step routing)
- Questions are stand-alone and timeless — they make sense months later without re-reading the chapter. Book title and chapter attribution travel with the question as context metadata.

**Inline note editing:** Tap any extraction item text → textarea appears below → save on blur, Escape cancels. Note appears in a distinct visual style below the extracted text.

> **Decision rationale:** Four extraction tabs kept from StewardShip because they serve distinct purposes and route to distinct features. Summaries = reference. Insights = LiLa intelligence feed. Declarations = Guiding Stars. Action Steps = Tasks. Collapsing them would lose routing clarity.

**Interactions:**
- Heart an item → toggles `is_hearted`, fill animation
- Delete an item → soft-deletes with fade, hidden from UI but retained in DB
- Tap item text → inline note editing
- "Go Deeper" per chapter → sends existing items to AI for non-duplicate supplementary extraction. New items marked `is_from_go_deeper = true` with visual indicator.
- "Re-Run" per chapter → confirmation dialog → replaces that chapter's content for this tab with fresh extraction
- "Discuss This Book" → opens Screen 6 (Book Discussion)
- "Export" → opens Screen 7 (Export Dialog)
- "Share" → opens sharing picker (select family members)
- "Assign as Task" → opens task creation modal pre-filled with book reference

**Data created/updated:**
- `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps` — created during extraction, updated on heart/delete/note
- `bookshelf_items` — updated on metadata edits

### Screen 3: Upload Flow

**What the user sees:**

Modal dialog for uploading files.

- Drag-and-drop zone with file type icons (PDF, EPUB, DOCX, TXT, MD, images)
- "Or click to browse" link
- Multi-file support — can upload several books at once
- Max file size indicator: "Up to 75 MB per file"
- Supported formats listed

**After file selection:**
- File list with per-file progress bars
- Real-time processing status per file:
  1. "Uploading..." (file transfer)
  2. "Extracting text..." (format-specific extraction)
  3. "Analyzing structure..." (chunking + TOC discovery)
  4. "Generating embeddings..." (platform-level chunk embedding)
  5. "Classifying..." (AI classification — title, author, summary, tags, genre, folder)
  6. "Ready" (processing complete)

**After processing complete:**
- AI classification review card per book:
  - Suggested title (editable)
  - Suggested author (editable)
  - Suggested genres (editable multi-select)
  - Suggested tags (editable)
  - Suggested folder (editable)
  - AI summary preview (editable)
  - "Apply" button (saves classification)
  - "Skip Classification" link (saves with defaults only)

> **Decision rationale:** Classification review is Human-in-the-Mix — AI suggests, user confirms. This prevents bad auto-classification from cluttering the library. The user can always accept defaults quickly if the AI got it right.

**Platform book cache behavior (invisible to user):**
After AI classification extracts a clean title and author, the system generates an embedding for the title+author string and checks against `platform_intelligence.book_cache` (similarity threshold ≥ 0.9). On cache hit: the book's chunks and any previously cached extractions are available for instant cloning when the user runs extraction. On cache miss: fresh processing, and results are queued for the platform cache after extraction.

**Data created/updated:**
- `bookshelf_items` — one record per uploaded file
- `bookshelf_chunks` — chunked text with embeddings (at platform level if cache miss; referenced if cache hit)
- Supabase Storage: file stored at `bookshelf-files/{family_id}/{filename}`

### Screen 4: Text Note Creation Modal

**What the user sees:**

Simple modal for pasting in content without a file.

- Title field (required)
- Author field (optional)
- Large text area for content (supports paste, plain text)
- Genre picker (optional)
- Tags field (optional)
- "Save & Process" button

The text note is processed identically to an uploaded file — chunked, embedded, classified, and available for extraction.

**Data created/updated:**
- `bookshelf_items` with `file_type = 'text_note'`
- `bookshelf_chunks` generated from the pasted text

### Screen 5: Aggregated Hearted Items View

**What the user sees:**

Cross-book view of all hearted items, accessible from the sidebar "Hearted Items" link.

- Grouped by book (collapsible sections)
- Each book section shows the book title as a header with a count of hearted items
- Within each book: items organized by tab type (Summaries, Insights, Declarations, Action Steps, Questions)
- Each item shows its content, content type badge, chapter attribution, and user note (if present)
- View modes: By Book (default), By Tab Type, Notes Only
- Export button → Screen 7 (Export Dialog) in "Hearted Items" mode

**Interactions:**
- Un-heart an item → removes from this view (with animation)
- Tap book title → navigates to that book's detail page
- Export → exports only hearted items across all books

**Data created/updated:** `is_hearted` toggles on extraction tables.

### Screen 6: Book Discussion

**What the user sees:**

Full-page conversation interface (uses the LiLa conversation engine from PRD-05).

**Header:**
- Book title(s) — shows all selected books
- Audience dropdown: Personal, Family, Teen, Spouse, Children
- "Add/Remove Books" button — opens multi-book selector
- Close button → returns to Book Detail or BookShelf main

**Book selector (when adding books):**
- Searchable list of all books in the member's BookShelf
- Checkboxes for multi-select
- Selected books shown as chips at top
- "Start Discussion" / "Update Books" button

**Conversation area:**
- Standard LiLa message thread (user messages and assistant messages)
- For multi-book discussions, LiLa's opening message synthesizes connections across selected books
- Each LiLa message includes action chips:
  - "Create a Guiding Star" → routes selected text through the Guiding Stars creation flow (PRD-06)
  - "Create a Task" → routes to task creation modal (PRD-09A) with book context pre-filled
  - "Send to Notepad" → routes to Smart Notepad (PRD-08) for further processing
  - "Go Deeper" → LiLa elaborates on the current point
  - "Give Me Examples" → LiLa provides practical applications
  - "Make It Kid-Friendly" → LiLa re-frames the current point for children

**Context building (per message):**
1. Embed the user's message using text-embedding-3-small
2. RAG search against selected books' chunks (top 8 per book, max 20 total)
3. Semantic search against selected books' extracted content (top 10)
4. Cross-book semantic search for connections (top 5 from non-selected books)
5. User's Guiding Stars and InnerWorkings loaded for personal grounding
6. Audience setting shapes AI tone and framing

> **Decision rationale:** Action chips on messages (P5 on-demand pattern) rather than separate discussion types. Mom gets the action when she wants it, not a wall of generated content she didn't ask for. Each chip triggers a focused AI call only when tapped — zero cost until used.

**Data created/updated:**
- `bookshelf_discussions` — discussion metadata
- `bookshelf_discussion_messages` — individual messages

### Screen 7: Export Dialog

**What the user sees:**

Modal dialog with export configuration.

**Export scope** (radio buttons):
- This book's extractions
- Hearted items across all books
- Notes only (items with user annotations)
- This collection (if accessed from a collection context)

**Tab selection** (checkboxes — which extraction types to include):
- Summaries ✓
- Insights ✓
- Declarations ✓
- Action Steps ✓
- Questions ✓

**Format** (radio buttons):
- Markdown (.md)
- Plain Text (.txt)
- Word Document (.docx)
- EPUB (.epub) — with navigable table of contents
- PDF (.pdf)

**EPUB-specific options** (shown when EPUB selected):
- Chapter-per-book organization (each book = a chapter with sub-sections for extraction types)
- Navigable table of contents: Book titles → Chapter headings → Extraction type headings
- Optimized for e-reader display (Kindle Paperwhite compatible)

**"Export" button** → generates file, triggers download.

> **Mom experience goal:** Exporting should feel like getting a beautiful, organized reference document — not a data dump. Chapter headings, content type labels, heart indicators, and personal notes all formatted professionally.

**Data created/updated:** None (read-only export).

### Screen 8: Journal Prompts Library

**What the user sees:**

A scrollable, searchable collection of saved reflection prompts drawn from the user's reading. Accessible from the BookShelf sidebar ("Journal Prompts" link) and from the Journal page.

> **Mom experience goal:** This should feel like a personal deck of reflection cards — each one a thought-provoking question pulled from your reading, waiting for the right quiet moment. Scroll through, find one that resonates, and write.

**Header area:**
- "Journal Prompts" title
- Search bar (searches prompt text, book titles, tags)
- "+ Add Custom" button (create a manual prompt not from a book)

**Filter bar:**
- Book filter chips — one chip per book that has contributed prompts, tap to filter. Shows book title, number of prompts from that book.
- Tag filter (if tags have been added to prompts)

**Prompt list (scrollable):**
Each prompt card shows:
- The question text (prominent, the main content)
- Book attribution line below: "From: [Book Title] — [Chapter Title]" in a muted style
- Content type badge: reflection, implementation, recognition, self_examination, discussion, scenario
- Heart indicator (if hearted in the extraction tab)
- Tags (if any)
- Action button: "Write About This" → opens Smart Notepad (PRD-08) with the prompt text as the writing context/header
- Secondary action: "Send to Tasks" → routes to task creation modal
- Inline edit (tap prompt text to edit)
- Archive button (soft delete with fade animation)

**Custom prompt creation:**
- Simple modal: prompt text (required), tags (optional)
- Saved with `source = 'manual'`, no book attribution

**Interactions:**
- Scroll through prompts in a card-based layout
- Search filters in real time as you type
- Book filter chips toggle on/off to show prompts from specific books
- "Write About This" → opens Smart Notepad with prompt as context header
- Archive → soft-deletes with fade, recoverable

**Data created/updated:**
- `journal_prompts` — created when questions are sent from extraction tab, or manually created
- Smart Notepad tab created when "Write About This" is tapped

### Screen 9: Collections Management

**What the user sees:**

Accessed from the sidebar or from the "Add to Collection" action on book cards.

**Create/Edit Collection modal:**
- Name (required)
- Description (optional)
- Book selector — searchable, checkboxes, shows current collection members
- "Share with..." — family member multi-select for collection sharing

**Collection view:**
- Books displayed in user-defined order
- Drag-to-reorder support
- Remove book from collection (doesn't delete the book, just removes the association)
- Collection-level export button
- "Assign Collection as Task" button — creates a task for a family member to work through the collection

**Data created/updated:**
- `bookshelf_collections` — collection metadata
- `bookshelf_collection_items` — junction table entries

### Screen 10: BookShelf Settings

**What the user sees:**

Accessible from a gear icon on the BookShelf main page.

**Book Knowledge in LiLa** (dropdown):
- "Hearted items only" (default) — only hearted summaries, insights, and declarations load into LiLa context
- "All extracted content" — everything non-deleted loads
- "Insights only" — only active insights
- "None" — BookShelf content doesn't feed LiLa

> **Decision rationale:** This setting lives in BookShelf settings, not global LiLa settings, because it's about how much of the user's reading feeds their AI experience. It respects the three-tier `is_included_in_ai` toggle from PRD-13 — an item must pass both this BookShelf-level setting AND the item-level toggle to enter LiLa context.

**Family Sharing Controls** (mom only):
- Per-member toggles for BookShelf access
- Per-member book/collection sharing management
- "Who uploaded what" audit view

**Data created/updated:**
- `bookshelf_member_settings` — per-member settings

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full access | Uploads, extracts, curates, shares, assigns. Sees all family uploads. Controls who can access what. |
| Dad / Additional Adult | Full access if granted by mom | Own library with own curation. Can upload (adds to family BookShelf). Mom controls feature access via `bookshelf_adult` feature key. |
| Special Adult | No access | BookShelf is outside Special Adult scope. |
| Independent (Teen) | Access if granted by mom | Can upload (adds to family BookShelf). Own curation on shared/uploaded books. Cannot delete other members' uploads. Mom controls via `bookshelf_teen` feature key. |
| Guided | Mom-assigned only | Cannot browse BookShelf independently. Sees only books/collections mom has explicitly shared with them. Simplified view. No upload. No discussions. |
| Play | Not present | BookShelf is not available in Play shell. |

> **Decision rationale:** Guided children access BookShelf content only through explicit mom assignment — either sharing a book directly or assigning it as a task. This is intentional: mom curates what younger children engage with from the family's reading.

### Shell Behavior

| Shell | Behavior |
|-------|----------|
| Mom | Full BookShelf page in sidebar navigation. Upload, extract, discuss, share, assign, export. |
| Adult | Full BookShelf page if feature access granted. Same capabilities as mom except no family sharing controls. |
| Independent (Teen) | BookShelf page if feature access granted. Upload, extract, curate own items, discuss. Cannot manage family sharing. |
| Guided | No BookShelf page. Shared books appear in a dedicated "Reading" section on their dashboard (stub until PRD-25). |
| Play | Not present. |

### Privacy & Transparency

- Each member's hearts, notes, and deleted items are strictly personal — no other member can see them.
- Mom can see what books each member has uploaded and what books they've been shared.
- Mom cannot see another member's hearts, notes, or discussion content (unless teen transparency settings from PRD-02 apply).
- Teen discussion content follows the same transparency rules as LiLa conversations (PRD-05).

---

## Data Schema

### Table: `bookshelf_items`

**Purpose:** Metadata for every uploaded file or text note in the family's BookShelf.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| uploaded_by_member_id | UUID | | NOT NULL | FK → family_members. Who uploaded this. |
| title | TEXT | | NOT NULL | Display name (AI-extracted or user-provided) |
| author | TEXT | null | NULL | AI-extracted or user-provided |
| file_type | TEXT | | NOT NULL | CHECK: 'pdf', 'epub', 'docx', 'txt', 'md', 'image', 'text_note' |
| file_name | TEXT | null | NULL | Original filename (null for text_note) |
| storage_path | TEXT | null | NULL | Supabase Storage path: `bookshelf-files/{family_id}/{filename}` |
| text_content | TEXT | null | NULL | Full extracted text |
| file_size_bytes | INTEGER | null | NULL | |
| genres | TEXT[] | '{}' | NOT NULL | Multi-select genres |
| tags | TEXT[] | '{}' | NOT NULL | GIN-indexed topic tags |
| folder_group | TEXT | null | NULL | AI-assigned or user-overridden folder |
| processing_status | TEXT | 'pending' | NOT NULL | CHECK: 'pending', 'processing', 'completed', 'failed' |
| processing_detail | TEXT | null | NULL | Real-time stage updates (cleared on completion) |
| extraction_status | TEXT | 'none' | NOT NULL | CHECK: 'none', 'discovering', 'extracting', 'completed', 'failed' |
| chunk_count | INTEGER | 0 | NOT NULL | Number of chunks created |
| intake_completed | BOOLEAN | false | NOT NULL | Whether AI classification was applied |
| ai_summary | TEXT | null | NULL | AI-generated 2-4 sentence summary |
| toc | JSONB | null | NULL | Table of contents as [{title, level}] |
| book_cache_id | UUID | null | NULL | FK → platform_intelligence.book_cache (if matched) |
| title_author_embedding | halfvec(1536) | null | NULL | For platform cache matching |
| archived_at | TIMESTAMPTZ | null | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- SELECT: Family members with BookShelf access can read items belonging to their family. Mom can read all. Other members can read items they uploaded or that have been shared with them.
- INSERT: Members with upload permission create items scoped to their family.
- UPDATE: Uploader or mom can update metadata.
- DELETE: Soft delete only (archived_at). Uploader or mom can archive.

**Indexes:**
- `family_id, archived_at` (family library query)
- `family_id, uploaded_by_member_id` (per-member view)
- `tags` (GIN index for tag filtering)
- `genres` (GIN index for genre filtering)
- `book_cache_id` (platform cache lookup)

### Table: `bookshelf_chunks`

**Purpose:** Platform-level RAG-indexed text segments with embeddings. Shared across all families who have the same book.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| book_cache_id | UUID | | NOT NULL | FK → platform_intelligence.book_cache |
| chunk_index | INTEGER | | NOT NULL | 0-based order |
| chunk_text | TEXT | | NOT NULL | ~750 tokens |
| token_count | INTEGER | null | NULL | |
| chapter_title | TEXT | null | NULL | Chapter this chunk belongs to (never crosses chapters) |
| chapter_index | INTEGER | null | NULL | Chapter order |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| metadata | JSONB | '{}' | NOT NULL | {page, section_heading} |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Decision rationale:** Chunks live at the platform level (keyed to `book_cache_id`, not `family_id`) because raw text chunks contain nothing personal. One copy of "Atomic Habits" chunks serves every family that uploads it. Massive storage and embedding cost savings at scale.

**RLS Policy:**
- SELECT: Any authenticated user can read chunks for books that exist in their family's BookShelf (join through `bookshelf_items.book_cache_id`).
- INSERT/UPDATE: Service role only (Edge Functions).
- DELETE: Service role only.

**Indexes:**
- `book_cache_id, chunk_index` (ordered chunk retrieval per book)
- HNSW index on `embedding` with `halfvec_cosine_ops` (semantic search)

**Chunking rules:**
- Target: ~750 tokens per chunk (~3000 characters)
- Overlap: 100 tokens (~400 characters)
- Chapter-aware: chunks NEVER cross chapter boundaries. Each chunk carries `chapter_title` and `chapter_index` metadata.
- Break preference: paragraph breaks > sentence breaks > hard cut
- Min progress: always advances at least one position to prevent infinite loops

### Table: `bookshelf_summaries`

**Purpose:** Extracted summary items — key concepts, stories, metaphors, lessons, quotes, insights.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (whose curation) |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| section_title | TEXT | null | NULL | Chapter grouping |
| section_index | INTEGER | null | NULL | Section order |
| content_type | TEXT | | NOT NULL | CHECK: 'key_concept', 'story', 'metaphor', 'lesson', 'quote', 'insight', 'theme', 'character_insight', 'exercise', 'principle' |
| text | TEXT | | NOT NULL | 1-3 sentences |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_hearted | BOOLEAN | false | NOT NULL | User-favorited |
| is_deleted | BOOLEAN | false | NOT NULL | Soft delete |
| is_from_go_deeper | BOOLEAN | false | NOT NULL | From Go Deeper extraction |
| user_note | TEXT | null | NULL | Personal annotation |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Three-tier toggle (PRD-13 pattern) |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own summaries (scoped by family_member_id). Mom can read all family members' summaries.

**Indexes:**
- `family_member_id, bookshelf_item_id, is_deleted` (per-member, per-book query)
- `family_member_id, is_hearted, is_deleted` (hearted items query)
- HNSW index on `embedding` with `halfvec_cosine_ops`

**Embedding trigger:**
```sql
CREATE TRIGGER queue_embedding_on_change
AFTER INSERT OR UPDATE OF text ON bookshelf_summaries
FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
```

**Embeddable text formula:** `text`

### Table: `bookshelf_insights`

**Purpose:** Extracted insights — principles, frameworks, mental models, processes, strategies, concepts, systems, and tool sets. Flat structure matching all other extraction tabs (no parent-child relationships).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| section_title | TEXT | null | NULL | Chapter grouping |
| section_index | INTEGER | null | NULL | Section order |
| content_type | TEXT | 'principle' | NOT NULL | CHECK: 'principle', 'framework', 'mental_model', 'process', 'strategy', 'concept', 'system', 'tool_set' |
| text | TEXT | | NOT NULL | The insight statement |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_user_added | BOOLEAN | false | NOT NULL | Manual vs AI-extracted |
| is_hearted | BOOLEAN | false | NOT NULL | User-favorited |
| is_deleted | BOOLEAN | false | NOT NULL | Soft delete |
| is_from_go_deeper | BOOLEAN | false | NOT NULL | From Go Deeper extraction |
| user_note | TEXT | null | NULL | Personal annotation |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Three-tier toggle |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own insights. Mom can read all.

**Indexes:**
- `family_member_id, bookshelf_item_id, is_deleted` (per-member, per-book query)
- `family_member_id, is_hearted, is_deleted` (hearted items)
- HNSW index on `embedding` with `halfvec_cosine_ops`

**Embedding trigger:** Same pattern as summaries, on `text` column.

**Embeddable text formula:** `content_type || ': ' || text`

### Table: `bookshelf_declarations`

**Purpose:** Honest identity declarations extracted from books. Rich, varied, following the Art of Honest Declarations philosophy.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| section_title | TEXT | null | NULL | Chapter grouping |
| section_index | INTEGER | null | NULL | Section order |
| value_name | TEXT | null | NULL | 1-3 word underlying value (e.g., "Courage", "Stewardship", "Discernment") |
| declaration_text | TEXT | | NOT NULL | Full declaration statement |
| declaration_voice | TEXT | | NOT NULL | CHECK: 'choosing_committing', 'recognizing_awakening', 'claiming_stepping_into', 'learning_striving', 'resolute_unashamed' |
| richness | TEXT | | NOT NULL | CHECK: 'rich', 'medium', 'concise'. Indicates the depth/length of the declaration. |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_hearted | BOOLEAN | false | NOT NULL | |
| is_deleted | BOOLEAN | false | NOT NULL | |
| is_from_go_deeper | BOOLEAN | false | NOT NULL | |
| sent_to_guiding_stars | BOOLEAN | false | NOT NULL | Whether routed to Guiding Stars |
| guiding_star_id | UUID | null | NULL | FK → guiding_stars (SET NULL on delete) |
| user_note | TEXT | null | NULL | Personal annotation |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Three-tier toggle |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Declarations use a `richness` field to track the depth/length tier. The extraction prompt generates a mix: roughly a third rich and poetic (multi-sentence, layered with identity + conviction + embodiment), a third medium (one strong sentence with a grounding phrase), and a third concise (short, punchy, direct). All follow the five honest declaration voices. The UI encourages editing: "These are starting points — make them yours."

**RLS Policy:** Members can CRUD their own declarations. Mom can read all.

**Indexes:**
- `family_member_id, bookshelf_item_id, is_deleted` (per-member, per-book)
- `family_member_id, is_hearted, is_deleted` (hearted items)
- `family_member_id, sent_to_guiding_stars` (routing audit)
- HNSW index on `embedding` with `halfvec_cosine_ops`

**Embedding trigger:** On `declaration_text` column.

**Embeddable text formula:** `COALESCE(value_name || ': ', '') || declaration_text`

### Table: `bookshelf_action_steps`

**Purpose:** Actionable exercises, practices, habits, and prompts extracted from books.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| section_title | TEXT | null | NULL | Chapter grouping |
| section_index | INTEGER | null | NULL | Section order |
| content_type | TEXT | | NOT NULL | CHECK: 'exercise', 'practice', 'habit', 'conversation_starter', 'project', 'daily_action', 'weekly_practice' |
| text | TEXT | | NOT NULL | |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_hearted | BOOLEAN | false | NOT NULL | |
| is_deleted | BOOLEAN | false | NOT NULL | |
| is_from_go_deeper | BOOLEAN | false | NOT NULL | |
| sent_to_tasks | BOOLEAN | false | NOT NULL | Whether routed to Tasks |
| task_id | UUID | null | NULL | FK → tasks (SET NULL on delete) |
| user_note | TEXT | null | NULL | |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Three-tier toggle |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own action steps. Mom can read all.

**Indexes:**
- `family_member_id, bookshelf_item_id, is_deleted` (per-member, per-book)
- `family_member_id, is_hearted, is_deleted` (hearted items)
- HNSW index on `embedding` with `halfvec_cosine_ops`

**Embedding trigger:** On `text` column.

**Embeddable text formula:** `content_type || ': ' || text`

### Table: `bookshelf_questions`

**Purpose:** Extracted reflection questions, implementation prompts, discussion starters, and scenarios from books. The fifth extraction tab.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| section_title | TEXT | null | NULL | Chapter grouping |
| section_index | INTEGER | null | NULL | Section order |
| content_type | TEXT | | NOT NULL | CHECK: 'reflection', 'implementation', 'recognition', 'self_examination', 'discussion', 'scenario' |
| text | TEXT | | NOT NULL | The question text |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_hearted | BOOLEAN | false | NOT NULL | |
| is_deleted | BOOLEAN | false | NOT NULL | |
| is_from_go_deeper | BOOLEAN | false | NOT NULL | |
| sent_to_prompts | BOOLEAN | false | NOT NULL | Whether routed to Journal Prompts library |
| journal_prompt_id | UUID | null | NULL | FK → journal_prompts (SET NULL on delete) |
| sent_to_tasks | BOOLEAN | false | NOT NULL | Whether routed to Tasks |
| task_id | UUID | null | NULL | FK → tasks (SET NULL on delete) |
| user_note | TEXT | null | NULL | Personal annotation |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Three-tier toggle |
| embedding | halfvec(1536) | null | NULL | text-embedding-3-small |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Questions are a separate extraction tab because they serve a fundamentally different purpose than action steps. Action steps say "do this." Questions say "sit with this." Mixing them in one tab (as StewardShip originally did with `reflection_prompt` in action steps) dilutes both. The dedicated tab also enables the Journal Prompts library as a natural routing destination.

**RLS Policy:** Members can CRUD their own questions. Mom can read all.

**Indexes:**
- `family_member_id, bookshelf_item_id, is_deleted` (per-member, per-book)
- `family_member_id, is_hearted, is_deleted` (hearted items)
- HNSW index on `embedding` with `halfvec_cosine_ops`

**Embedding trigger:** On `text` column.

**Embeddable text formula:** `content_type || ': ' || text`

### Table: `journal_prompts`

**Purpose:** Saved prompt library — a personal, searchable, scrollable collection of reflection prompts. Sourced primarily from BookShelf question extraction, but also supports manual creation. Feeds the Journal writing experience.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| prompt_text | TEXT | | NOT NULL | The question/prompt text |
| source | TEXT | 'manual' | NOT NULL | CHECK: 'manual', 'bookshelf_extraction'. Tracks where this prompt came from. |
| source_reference_id | UUID | null | NULL | FK → bookshelf_questions (if source = 'bookshelf_extraction') |
| source_book_title | TEXT | null | NULL | Book title for display/filtering (denormalized for performance) |
| source_chapter_title | TEXT | null | NULL | Chapter title for context attribution |
| tags | TEXT[] | '{}' | NOT NULL | User-added tags for filtering |
| archived_at | TIMESTAMPTZ | null | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** `journal_prompts` is its own table (not prefixed with `bookshelf_`) because prompts could eventually come from sources beyond BookShelf — manual creation, LiLa suggestions, Rhythms & Reflections, or other features. The `source` field tracks provenance. Book title and chapter title are denormalized for fast display without joins.

**RLS Policy:** Members can CRUD their own prompts. Mom can read all family members' prompts.

**Indexes:**
- `family_member_id, archived_at` (prompt library query)
- `family_member_id, source_book_title` (book filter)
- `tags` (GIN index for tag filtering)

### Table: `bookshelf_discussions`

**Purpose:** Book discussion conversation metadata.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| bookshelf_item_ids | UUID[] | | NOT NULL | Array of book IDs (single or multi-book) |
| audience | TEXT | 'personal' | NOT NULL | CHECK: 'personal', 'family', 'teen', 'spouse', 'children' |
| title | TEXT | null | NULL | AI-generated or user-set |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can CRUD their own discussions. Mom can read teen discussions per transparency settings.

**Indexes:**
- `family_member_id, updated_at DESC` (discussion list)

### Table: `bookshelf_discussion_messages`

**Purpose:** Individual messages within a book discussion.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| discussion_id | UUID | | NOT NULL | FK → bookshelf_discussions (ON DELETE CASCADE) |
| role | TEXT | | NOT NULL | CHECK: 'user', 'assistant' |
| content | TEXT | | NOT NULL | |
| metadata | JSONB | '{}' | NOT NULL | Action chips shown, context used |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent discussion.

**Indexes:**
- `discussion_id, created_at` (message ordering)

### Table: `bookshelf_collections`

**Purpose:** Named book groupings.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by_member_id | UUID | | NOT NULL | FK → family_members |
| name | TEXT | | NOT NULL | |
| description | TEXT | null | NULL | |
| sort_order | INTEGER | 0 | NOT NULL | |
| archived_at | TIMESTAMPTZ | null | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family members with BookShelf access can read family collections. Creator or mom can update/delete.

**Indexes:**
- `family_id, archived_at, sort_order` (collection list)

### Table: `bookshelf_collection_items`

**Purpose:** Junction table for books ↔ collections.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| collection_id | UUID | | NOT NULL | FK → bookshelf_collections (ON DELETE CASCADE) |
| bookshelf_item_id | UUID | | NOT NULL | FK → bookshelf_items (ON DELETE CASCADE) |
| sort_order | INTEGER | 0 | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**UNIQUE constraint:** `(collection_id, bookshelf_item_id)`

**Indexes:**
- `collection_id, sort_order` (ordered books in collection)

### Table: `bookshelf_shares`

**Purpose:** Tracks which books/collections are shared with which family members.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| shared_by_member_id | UUID | | NOT NULL | FK → family_members (who shared) |
| shared_with_member_id | UUID | | NOT NULL | FK → family_members (recipient) |
| share_type | TEXT | | NOT NULL | CHECK: 'book', 'collection' |
| bookshelf_item_id | UUID | null | NULL | FK → bookshelf_items (if share_type = 'book') |
| collection_id | UUID | null | NULL | FK → bookshelf_collections (if share_type = 'collection') |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**UNIQUE constraint:** `(shared_with_member_id, share_type, COALESCE(bookshelf_item_id, collection_id))`

**RLS Policy:** Mom can CRUD all shares. Members can read shares where they are the recipient.

### Table: `bookshelf_member_settings`

**Purpose:** Per-member BookShelf configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| book_knowledge_access | TEXT | 'hearted_only' | NOT NULL | CHECK: 'hearted_only', 'all_extracted', 'insights_only', 'none' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Members can read/update their own settings. Mom can read all.

### Enum/Type Updates

**Genre enum values (used as TEXT[] on bookshelf_items):**
`non_fiction`, `fiction`, `biography_memoir`, `scriptures_sacred`, `workbook`, `textbook`, `poetry_essays`, `allegory_parable`, `devotional_spiritual_memoir`

**Supabase Storage Bucket:**
- **Bucket:** `bookshelf-files` (private)
- **Size limit:** 75 MB
- **Path pattern:** `{family_id}/{filename}`
- **Allowed MIME types:** PDF, EPUB, DOCX, TXT, MD, images (png/jpeg/gif/webp)
- **RLS:** Path-based isolation by family_id

---

## Flows

### Incoming Flows (How Data Gets INTO BookShelf)

| Source | How It Works |
|--------|-------------|
| File upload | User uploads PDF/EPUB/DOCX/TXT/MD/image via upload flow. |
| Text note | User pastes content via text note modal. |
| Platform cache | When a book matches the platform cache, chunks and base extractions are cloned. |

### Outgoing Flows (How BookShelf Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Guiding Stars (PRD-06) | Declarations route via "Send to Guiding Stars" action. Creates `guiding_stars` entry with `source = 'bookshelf'`, `source_reference_id` → `bookshelf_declarations.id`. Tracked by `sent_to_guiding_stars` + `guiding_star_id`. |
| Best Intentions (PRD-06) | Discussion action chip "Create a Guiding Star" can also route to Best Intentions. |
| Tasks (PRD-09A) | Action steps route via "Send to Tasks" action. Creates task via task creation modal with pre-filled description and `source = 'bookshelf'`. Tracked by `sent_to_tasks` + `task_id`. Books/collections can also be assigned as tasks directly. Questions can also route to Tasks when they're more action-oriented than reflective. |
| Journal Prompts | Questions route via "Add to Journal Prompts" button. Creates `journal_prompts` entry with `source = 'bookshelf_extraction'`, denormalized book title and chapter title. Tracked by `sent_to_prompts` + `journal_prompt_id`. |
| Journal (PRD-08) | From Journal Prompts library: "Write About This" opens Smart Notepad with the prompt as context header. User writes a journal entry inspired by the prompt. |
| Smart Notepad (PRD-08) | Discussion action chip "Send to Notepad" routes discussion insights. Notepad's Review & Route handles downstream routing. |
| InnerWorkings (PRD-07) | Content extraction path: user selects "Inform InnerWorkings" on relevant extracted content → AI extracts personality-relevant insights → saves with `source_type = 'content_extraction'`. Wires the existing PRD-07 stub. |
| LiLa context assembly (PRD-05) | Extracted content (filtered by book_knowledge_access setting + is_included_in_ai toggles) feeds LiLa's system prompt via semantic search. |
| Platform Intelligence (Pipeline v2) | New book uploads → book_cache. Extractions → book_extraction_cache. Insights → ethics filter → synthesized_principles. |
| Victory Recorder (PRD-11) | Book completion can be recorded as a victory (source = 'bookshelf'). |
| Rhythms (PRD-18) | Morning/evening rhythms can pull devotional content from BookShelf via semantic search. Journal Prompts can also surface as morning reflection prompts. |

---

## AI Integration

### Guided Modes Registered

| Mode Key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|----------------|----------------|-------------|-------------|
| `book_discuss` | Discuss This Book | Sonnet | RAG chunks (per-book), extracted content, Guiding Stars, InnerWorkings | No | Mom, Adult, Independent | `bookshelf_discussions` |
| `library_ask` | Ask Your Library | Sonnet | RAG chunks (all books), semantic search on all extracted content, Guiding Stars, InnerWorkings | No | Mom, Adult, Independent | `bookshelf_discussions` |

**Opening messages (book_discuss, 3 variants):**
1. "I've immersed myself in [book title]. What would you like to explore? I can discuss themes, help you apply insights, or connect ideas to your life."
2. "Ready to dig into [book title] with you. Ask me anything — about a specific chapter, a concept that caught your attention, or how this connects to what matters most to you."
3. "Let's talk about [book title]. I have the full text and all extracted content ready. Where would you like to start?"

**Opening messages (library_ask, 3 variants):**
1. "Your entire BookShelf is open. Ask me anything — I'll search across all your books to find the most relevant wisdom."
2. "I can search across everything you've uploaded. What's on your mind? I'll find connections you might not have seen."
3. "Your library is ready. Ask a question, describe a situation, or name a topic — I'll pull the best insights from across your books."

### Extraction AI Behavior

**Section Discovery (Haiku):**
- Input: First ~4000 tokens of the document + TOC (if available from document structure)
- Output: Array of {title, start_position, end_position} representing chapters/sections
- The AI identifies logical divisions, not just structural headings

**Extraction (Sonnet, genre-aware):**
- Per section, per extraction type
- Genre-aware prompts customize extraction behavior (e.g., fiction emphasizes character insights and themes; workbooks emphasize exercises and reflection prompts; scriptures emphasize declarations and insights)
- Go Deeper: existing items sent as context so AI extracts non-duplicate supplementary content

**Declaration Extraction Prompt Guidance:**
The extraction prompt for declarations must follow The Art of Honest Declarations philosophy:
- Generate declarations in all five voices: Choosing & Committing, Recognizing & Awakening, Claiming & Stepping Into, Learning & Striving, Resolute & Unashamed
- Generate a mix of richness levels: ~1/3 rich (multi-sentence, layered with identity + conviction + embodiment), ~1/3 medium (one strong sentence with a grounding phrase), ~1/3 concise (short, punchy, direct)
- Varied sentence openings — never a wall of "I am..."
- Each declaration must pass the honesty test: every part of the reader can say "yes, that's true" right now
- Extract the underlying value_name (1-3 words: "Courage", "Stewardship", "Discernment")
- The UI displays a note encouraging personal editing: "These are starting points — make them yours."

> **Depends on:** The Art of Honest Declarations document in project knowledge. Build prompts should reference this for extraction prompt crafting.

**Insights Extraction Prompt Guidance:**
The extraction prompt for this tab should pull structured wisdom in multiple sub-types:
- `principle` — actionable truth statements that can guide behavior
- `framework` — named models or systems for thinking about a topic
- `mental_model` — conceptual lenses for understanding situations
- `process` — step-by-step approaches described in the book
- `strategy` — specific techniques or tactics recommended
- `concept` — key ideas or abstractions that illuminate a topic
- `system` — interconnected elements that work together as described in the book
- `tool_set` — collections of practical tools or methods presented together

If the book describes specific steps or frameworks, extract them as-is. If the book implies principles without stating them explicitly, generate clear principle statements grounded in the book's content.

**Action Steps Extraction Prompt Guidance:**
Action steps must be ACTIONS, not questions. Do NOT include journaling prompts, reflection questions, or "write about..." items — those belong in the Questions extraction tab. Action steps are things the reader can go DO:
- `exercise` — a specific activity to try
- `practice` — an ongoing discipline to adopt
- `habit` — a behavior to build into daily life
- `conversation_starter` — a specific conversation to have with someone
- `project` — a larger undertaking the book inspires
- `daily_action` — something to do today
- `weekly_practice` — something to do regularly

If the book mentions specific steps, extract them. If the book implies actionable applications without stating them explicitly, generate concrete action steps grounded in the book's content.

**Questions Extraction Prompt Guidance:**
Questions are the "I'll come back to that later" capture — the thoughts, reflections, and prompts that a reader intends to sit with but never does. They must be:
- **Open-ended** — no yes/no questions
- **Stand-alone and timeless** — must make sense and provoke thought months later without re-reading the chapter. The book context travels as metadata, but the question itself should work independently.
- **Personal language** — written in second person ("you") or first person ("I"), inviting the reader into their own reflection
- **~1-2 questions per 2-3K characters** of source material (don't over-extract)

Six content types, with genre-aware weighting:
- `reflection` — inward-looking, present-tense. "What does this stir in you?" "How does this connect to who you're becoming?"
- `implementation` — forward-looking, practical. "How could you begin applying this today?" "What's one small step you could take this week?"
- `recognition` — backward-looking, affirming. "Where has this principle already shown up in your life?" "When have you already done this without realizing it?" (Connects to the celebration-only philosophy — helping people see growth they've already made.)
- `self_examination` — pattern-seeking, honest. "What does this reveal about your habits?" "Where are you resisting this and why?"
- `discussion` — outward-looking, relational. "What would your family say about this?" "How would you explain this principle to your children?"
- `scenario` — hypothetical, exploratory. "What would you do if..." "Imagine you had to teach this to someone who disagreed."

Genre weighting: parenting books → more implementation and discussion. Spiritual memoirs → more reflection and self_examination. Leadership books → more scenario and implementation. Fiction/allegory → more reflection and recognition.

### AI Classification (Haiku)

On upload completion, Haiku processes the first ~2000 characters of extracted text:
- Suggests title (from content, not filename)
- Suggests author
- Suggests 1-3 genres
- Suggests 3-5 tags
- Suggests a folder/category
- Generates a 2-4 sentence summary

### System Prompt Notes for Book Discussions

When `book_discuss` or `library_ask` mode is active:
- LiLa references book titles and chapter names naturally when drawing from RAG content
- LiLa weaves extracted content (summaries, insights, declarations) into responses without mechanically listing them
- When semantic search surfaces connections across books, LiLa highlights the convergence
- LiLa connects book insights to the user's Guiding Stars and InnerWorkings where relevant
- Audience setting shapes tone: `personal` = reflective and direct; `family` = practical application; `teen` = engaging and age-appropriate; `spouse` = relationship-focused; `children` = simple language and story-focused
- Action chips offered contextually: when LiLa generates a principle-like statement, "Create a Guiding Star" chip appears; when LiLa suggests something actionable, "Create a Task" chip appears

### LiLa Context Integration (Non-Discussion Modes)

BookShelf extraction tables are registered with the shared `match_by_embedding` infrastructure (Semantic Context Infrastructure Addendum). This means:

1. `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, and `bookshelf_questions` are all searchable via per-turn semantic context refresh (P9 pattern)
2. When a user's message in any LiLa conversation is semantically relevant to extracted book content, that content surfaces automatically — no special wiring needed
3. The `book_knowledge_access` setting (hearted_only / all_extracted / insights_only / none) filters what's eligible for semantic search
4. Hearted insights (`bookshelf_insights.is_hearted = true`) are loaded into LiLa's system prompt alongside Guiding Stars when relevant

> **Decision rationale:** BookShelf feeds LiLa through the same infrastructure as every other context source — no special per-feature wiring. This keeps the architecture clean and means BookShelf content is automatically available in every LiLa mode, not just book discussions.

---

## Edge Cases

### Large File Processing

- Files near the 75 MB limit may take longer to process. The real-time status updates keep the user informed.
- If text extraction fails (corrupted file, DRM-protected, unsupported encoding), the processing_status moves to 'failed' with a user-friendly error in processing_detail.
- Scanned PDF pages fall back to AI vision extraction (Haiku). Processing is slower but still works.

### Duplicate Upload Detection

- Before processing, the system checks if a file with the same name and similar size already exists in the family's BookShelf. If so, a warning: "A similar book may already be in your BookShelf: [title]. Upload anyway?"
- This is a family-level check only. Platform-level deduplication happens silently via the book cache.

### Platform Cache Mismatch

- If the title+author embedding similarity is between 0.8 and 0.9 (uncertain match), the system extracts fresh rather than serving potentially wrong cached content. The fresh extractions are NOT added to the existing cache entry — they create a new cache entry if the content turns out to be a different book.
- If similarity is < 0.8, it's clearly a different book — new cache entry.
- If similarity is ≥ 0.9, confident match — clone cached content.

### Ethics Gate for Platform Intelligence

- Books that fail the Layer 1 ethics gate (Haiku pre-screen) still work fully for the user's personal BookShelf. They can extract, curate, discuss, export — everything. The ethics gate only controls whether the book's insights enter the LiLa training pipeline.
- Books that fail are flagged in `platform_intelligence.book_cache` with `ethics_gate_status = 'failed'`. If another family uploads the same book, they get the cached personal extractions but the book remains excluded from LiLa training.
- The user never knows about the ethics gate. It's entirely backend.

> **Decision rationale:** Respecting user agency — we don't restrict what families can read or extract. We only control what enters LiLa's advisory knowledge. A family that uploads a controversial parenting book gets full personal value from it; LiLa just won't recommend its approaches to other families.

### Extraction on Cached Books

- When a cached book is found, the user still sees the section discovery step and selects chapters. Cached chapters extract "instantly" (clone operation). Uncached chapters (ones no previous user selected) go through normal Sonnet extraction.
- "Go Deeper" always runs fresh AI extraction, even on cached chapters — it's generating non-duplicate supplementary content based on what already exists in this user's curation.
- "Re-Run" always runs fresh AI extraction — it replaces the content entirely.

### Teen Upload → Family Library

- When a teen uploads a book, it automatically appears in the family's BookShelf.
- Mom can see who uploaded it (uploaded_by_member_id).
- Mom can archive (soft-delete) it from the family BookShelf if she doesn't want it there.
- Archiving removes it from the family's visible BookShelf but retains the platform-level chunks and cache entries.
- The teen's own curation (hearts, notes) on the archived book is preserved but inaccessible until the book is un-archived.

### Sharing Mechanics

- When mom shares a book with a member, the system clones the base extractions (from cache or from mom's extractions) into that member's records with fresh `is_hearted = false`, `user_note = null`, `is_deleted = false`.
- If mom revokes sharing, the shared records are archived (not deleted). If re-shared later, the member's prior curation is restored.
- Sharing a collection shares all books currently in the collection. Books added to the collection later are not automatically shared — mom must re-share or share the new books individually.

### Empty BookShelf States

- No books uploaded: warm empty state with LiLa illustration and upload CTA
- Books uploaded but none extracted: books show "Not extracted" status with an "Extract" button
- Extraction complete but nothing hearted: gentle prompt on the Hearted Items view: "Heart the items that resonate with you — they'll become part of your personal collection."

---

## Tier Gating

> **Tier rationale:** BookShelf is a high-value, AI-intensive feature. Upload processing, extraction (Sonnet), and discussions all consume significant AI resources. Essential tier may include basic upload and reading, but extraction and discussions are Enhanced+ features. Monthly upload limits may vary by tier.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `bookshelf_basic` | BookShelf page, file upload, text extraction, AI classification, search | Enhanced |
| `bookshelf_extraction` | AI extraction (all 4 tabs), Go Deeper, Re-Run | Enhanced |
| `bookshelf_discussions` | Book discussions (single and multi-book) | Enhanced |
| `bookshelf_export` | Export in all formats | Enhanced |
| `bookshelf_adult` | Dad/Additional Adult BookShelf access | Enhanced |
| `bookshelf_teen` | Independent Teen BookShelf access | Enhanced |
| `bookshelf_sharing` | Family sharing and assignment features | Enhanced |

All keys return true during beta.

> **Forward note:** Monthly upload limits (e.g., 5 books/month at Enhanced, unlimited at Full Magic) are a natural tier differentiation point. To be configured post-beta based on usage data and cost analysis.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Guided child "Reading" section on their dashboard | Guided Dashboard | PRD-25 |
| Age-adapted content generation (kid-friendly extraction layer) | Guided content experience | Post-MVP |
| Google Drive export (export to Google Doc) | Google Drive integration | Post-MVP |
| Admin book ethics review UI (review queue, per-book drill-down) | System Admin Console | PRD-32 |
| BookShelf widget on Personal Dashboard | Widget infrastructure | PRD-10 (wired as widget template) |

> **Forward note:** Age-adapted content generation is a post-MVP feature where a secondary AI pass generates simplified versions of extractions for younger readers. Mom could toggle between "Original" and "Kid-Friendly" when sharing with Guided children. The data model supports this via a future `bookshelf_adapted_content` table linked to extraction records — no schema changes needed to existing tables.

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Content extraction input path to InnerWorkings (`source_type = 'content_extraction'`) | PRD-07 | "Inform InnerWorkings" action on relevant extracted content → AI extracts personality-relevant insights → saves to `self_knowledge` with `source_type = 'content_extraction'`, `source_reference_id` → extraction item ID. |
| Knowledge Base / Manifest context source in LiLa | PRD-05, Semantic Context Addendum | BookShelf extraction tables registered with `match_by_embedding`. Hearted insights loaded into LiLa context. RAG chunks available in `book_discuss` and `library_ask` modes. |
| `knowledge_base_chunks` future table reference in Semantic Context Addendum | Semantic Context Addendum | Replaced by `bookshelf_chunks` at the platform level. The addendum's forward note about "Knowledge Base PRD adding a table to the pipeline" is fulfilled by this PRD. |
| Channel E (Book Knowledge Library) in Platform Intelligence Pipeline | Platform Intelligence Pipeline v2 | Book upload → book_cache check → extraction caching → ethics filter → synthesized insights. Full pipeline wired. |
| Book knowledge as context source for Rhythms (morning/evening readings) | PRD-18 | BookShelf content available via semantic search during rhythm content selection. LiLa can pull devotional/inspirational content from the user's BookShelf for morning reflection prompts. |

---

## What "Done" Looks Like

### MVP (Must Have)

- [ ] All tables created with RLS policies: `bookshelf_items`, `bookshelf_chunks`, `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, `journal_prompts`, `bookshelf_discussions`, `bookshelf_discussion_messages`, `bookshelf_collections`, `bookshelf_collection_items`, `bookshelf_shares`, `bookshelf_member_settings`
- [ ] Supabase Storage bucket `bookshelf-files` created with 75 MB limit and family_id path isolation
- [ ] File upload flow: PDF, EPUB, DOCX, TXT, MD, image support with real-time processing status
- [ ] Text extraction pipeline: format-specific extraction with cascading fallback (client → server → AI vision)
- [ ] Chapter-aware chunking: ~750 tokens, 100-token overlap, never crosses chapter boundaries, chapter metadata on every chunk
- [ ] Embedding generation via shared pgmq queue → `embed` Edge Function → text-embedding-3-small on all tables
- [ ] AI classification (Haiku): title, author, summary, genres, tags, folder — with Human-in-the-Mix review
- [ ] Platform book cache check after classification: title+author embedding similarity matching against `platform_intelligence.book_cache`
- [ ] Section discovery (Haiku): chapter/section identification from document structure
- [ ] Extraction pipeline (Sonnet, genre-aware): all 5 tabs — Summaries, Insights, Declarations, Action Steps, Questions — running in parallel
- [ ] Extraction type selector: five checkboxes (all default checked), user can uncheck any combination. Only checked types run. Empty tabs show per-tab "Extract" button for on-demand later extraction.
- [ ] Declaration extraction follows Art of Honest Declarations: five voices, three richness levels, varied openings, honesty test
- [ ] Questions extraction: six content types (reflection, implementation, recognition, self_examination, discussion, scenario), stand-alone and timeless, genre-weighted
- [ ] Action steps extraction: strictly actions, no questions or reflection prompts (those belong in Questions tab)
- [ ] Go Deeper per chapter per tab: non-duplicate supplementary extraction
- [ ] Re-Run per chapter and per tab: fresh extraction after confirmation
- [ ] Heart/delete/note on all extraction items with animations
- [ ] Questions tab: "Add to Journal Prompts" button with "Added" badge, "Send to Tasks" button
- [ ] Journal Prompts Library (Screen 8): scrollable, searchable prompt collection with book/chapter attribution, book filter chips, "Write About This" action, custom prompt creation, archive
- [ ] "Write About This" → opens Smart Notepad with prompt as context header
- [ ] Aggregated Hearted Items view across all books (includes Questions)
- [ ] Book discussions: single-book and multi-book with audience adaptation
- [ ] Discussion action chips: Create a Guiding Star, Create a Task, Send to Notepad, Go Deeper, Give Me Examples, Make It Kid-Friendly
- [ ] Collections: create, edit, add/remove books, drag-to-reorder
- [ ] Family sharing: mom shares individual books and collections with specific members
- [ ] Book/collection assignment as task (routes through PRD-09A task creation)
- [ ] Export: Markdown, plain text, DOCX, EPUB (with navigable TOC), PDF — includes Questions tab
- [ ] BookShelf settings: book_knowledge_access dropdown
- [ ] `book_discuss` and `library_ask` guided modes registered in LiLa guided mode registry
- [ ] BookShelf extraction tables (including bookshelf_questions) registered with `match_by_embedding` for per-turn semantic context
- [ ] Hearted insights loaded into LiLa context assembly
- [ ] Platform intelligence: book_cache entry created on new book. Extractions cached to book_extraction_cache.
- [ ] Ethics pipeline: Layer 1 (Haiku gate) runs on new cache entries. Layer 2 (Sonnet scan) on insights. Results logged to framework_ethics_log. Admin review queue populated for flagged items.
- [ ] All `useCanAccess()` hooks wired, PermissionGate on all member-scoped UI
- [ ] RLS verification: members can only see their own curation; mom can see all family books; shared books visible to recipients; chunks accessible for any book in member's BookShelf
- [ ] Teen uploads auto-appear in family BookShelf; mom can archive
- [ ] Guided children see only mom-shared/assigned books (no independent browse)

### MVP When Dependency Is Ready

- [ ] InnerWorkings content extraction path wired (requires PRD-07 build — `source_type = 'content_extraction'`)
- [ ] BookShelf widget on Personal Dashboard (requires PRD-10/14 build)
- [ ] Victory Recorder "finished a book" source (requires PRD-11 build)
- [ ] Morning/Evening Rhythm BookShelf content integration (requires PRD-18 build)
- [ ] Guided child "Reading" section on Guided Dashboard (requires PRD-25)

### Post-MVP

- [ ] Age-adapted content generation (kid-friendly extraction layer for Guided children)
- [ ] Google Drive export integration
- [ ] Audio file support (podcast episodes, audiobook clips — with transcription)
- [ ] BookShelf search within LiLa drawer (quick-access search from any page)
- [ ] Reading progress tracking per book per member
- [ ] Book recommendation engine based on library content and reading patterns
- [ ] Collection templates (pre-built reading lists on topics like "Parenting Library", "Leadership Reading")

---

## CLAUDE.md Additions from This PRD

- [ ] BookShelf is the family's book and document knowledge system. Feature name: BookShelf (compound OneWord). Table prefix: `bookshelf_`. Storage bucket: `bookshelf-files`.
- [ ] BookShelf chunks live at the platform level (`bookshelf_chunks` keyed to `platform_intelligence.book_cache`, not to family_id). One copy per book serves all families. Extractions are per-member (hearts, notes, deletions are personal).
- [ ] Chapter-aware chunking is a hard rule: chunks NEVER cross chapter boundaries. Every chunk carries `chapter_title` and `chapter_index` metadata.
- [ ] All BookShelf embedding uses text-embedding-3-small via the shared pgmq queue (Semantic Context Infrastructure Addendum). No separate embedding model for RAG vs. semantic search.
- [ ] BookShelf extraction tables are registered with `match_by_embedding` for automatic per-turn semantic context. No special per-feature wiring needed.
- [ ] Declaration extraction must follow The Art of Honest Declarations: five voices (Choosing & Committing, Recognizing & Awakening, Claiming & Stepping Into, Learning & Striving, Resolute & Unashamed), three richness levels (rich/medium/concise), varied openings. The honesty test applies: every declaration must be something the reader can affirm as true right now.
- [ ] Insights extraction pulls eight sub-types: principle, framework, mental_model, process, strategy, concept, system, tool_set.
- [ ] Platform book cache: always check `platform_intelligence.book_cache` by title+author embedding similarity (threshold ≥ 0.9) before running extraction. Clone cached chapters; extract only uncached ones.
- [ ] Ethics pipeline runs on book_cache entries, NOT on individual family uploads. Personal BookShelf is never restricted by ethics gate — only the LiLa training pipeline is.
- [ ] BookShelf discussions use dual search: RAG chunks for full-text similarity + semantic search on extracted content for meaning-based discovery. Both searches run per user message.
- [ ] Action chips on discussion messages follow the P5 on-demand pattern (AI Cost Optimization Patterns). No pre-generation; each chip triggers a focused call only when tapped.
- [ ] Family sharing creates cloned extraction records with fresh curation state. Original member's hearts/notes/deletes are never visible to shared members.
- [ ] Teen uploads auto-appear in family BookShelf. Mom can archive but not delete. Platform cache retained on archive.
- [ ] Five extraction tabs, not four. The Questions tab is separate from Action Steps. Action steps are strictly actions (no reflection prompts, no "write about..." items). Questions are for reflective/introspective content.
- [ ] Questions extraction: six content types (reflection, implementation, recognition, self_examination, discussion, scenario). Must be open-ended, stand-alone (make sense months later without re-reading the chapter), and written in personal language. ~1-2 per 2-3K characters of source material.
- [ ] `journal_prompts` table is NOT prefixed with `bookshelf_` — it's a standalone table that can receive prompts from multiple sources (BookShelf, manual creation, future: LiLa, Rhythms). The `source` field tracks provenance.
- [ ] Journal Prompts Library is searchable and scrollable. Each prompt carries denormalized book title and chapter title for context attribution. "Write About This" routes to Smart Notepad with the prompt as context header.
- [ ] Extraction type selector: users choose which of the five tabs to extract (default all). Only selected types run during extraction. Unextracted tabs show a per-tab "Extract" button for on-demand later extraction. The extraction pipeline must handle partial extraction state gracefully — some tabs populated, others empty with an extract CTA.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables defined:**
- `bookshelf_items` — book/document metadata per family
- `bookshelf_chunks` — platform-level RAG text chunks
- `bookshelf_summaries` — extracted summary items per member
- `bookshelf_insights` — extracted insights (principles, frameworks, mental models, etc.) per member
- `bookshelf_declarations` — honest identity declarations per member
- `bookshelf_action_steps` — actionable exercises and practices per member
- `bookshelf_questions` — extracted reflection questions and prompts per member (5th extraction tab)
- `journal_prompts` — saved prompt library per member (standalone, multi-source)
- `bookshelf_discussions` — book discussion metadata per member
- `bookshelf_discussion_messages` — individual discussion messages
- `bookshelf_collections` — named book groupings per family
- `bookshelf_collection_items` — junction: books ↔ collections
- `bookshelf_shares` — book/collection sharing records
- `bookshelf_member_settings` — per-member BookShelf configuration

**Enums updated:** None (all use TEXT CHECK constraints)

**Triggers added:**
- `queue_embedding_on_change` on `bookshelf_summaries.text`, `bookshelf_insights.text`, `bookshelf_declarations.declaration_text`, `bookshelf_action_steps.text`, `bookshelf_questions.text` → `util.queue_embedding_job()`
- `updated_at` auto-update triggers on all tables with `updated_at` column

**Storage:** `bookshelf-files` bucket (private, 75 MB limit, family_id path isolation)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Feature name: BookShelf** (compound OneWord) | Warm, clear, signals a family resource. Pairs well with AI Vault as complementary concept. |
| 2 | **Table prefix: `bookshelf_`** | Matches feature name. Clean, unambiguous. |
| 3 | **Unified embedding model: text-embedding-3-small for everything** | Better semantic quality than ada-002, cheaper ($0.02/M vs $0.10/M), single pipeline via shared pgmq infrastructure. Departing from StewardShip's two-model approach. |
| 4 | **Platform-level chunk storage** | Raw text chunks contain nothing personal. One copy per book serves all families. Massive storage and embedding cost savings at scale. |
| 5 | **Chapter-aware chunking** | Chunks never cross chapter boundaries. Clean attribution in RAG results. Quality improvement over StewardShip. |
| 6 | **Cache check after AI classification** | Fuzzy matching on AI-extracted title+author (clean data), not on filenames. Prevents mismatches from inconsistent file naming. |
| 7 | **Ethics gate respects user agency** | Users can upload and extract anything for personal use. Ethics gate only controls what enters LiLa's advisory knowledge. No content restriction on personal BookShelf. |
| 8 | **Family-level BookShelf with per-member curation** | All uploads go to the family library. Mom controls distribution. Each member's hearts, notes, and deletions are strictly personal. |
| 9 | **Teen uploads auto-appear in family library** | Teens are often the ones who know how to get books in the right format. Mom can archive if needed. Platform cache retained on archive. |
| 10 | **Guided children: mom-assigned access only** | No independent browsing. Only books/collections mom explicitly shares or assigns appear for Guided children. |
| 11 | **Five extraction tabs with renamed/enriched content** | Summaries, Insights (broadened to 8 sub-types, flat structure), Declarations (richened), Action Steps (tightened — actions only), Questions (new — reflective/introspective content). Each serves distinct cross-feature routing. |
| 12 | **Rich declarations with variety** | Mix of richness levels (~1/3 rich, ~1/3 medium, ~1/3 concise). Five voices from Art of Honest Declarations. UI encourages personal editing. |
| 13 | **Insights: eight sub-types, flat structure** | principle, framework, mental_model, process, strategy, concept, system, tool_set. Broader than StewardShip's "actionable principles only." No parent-child relationship — all 5 extraction tabs now have identical flat structure. |
| 14 | **Action chips on discussion messages** | P5 on-demand pattern. No pre-generation. Each chip triggers a focused call only when tapped. More flexible than StewardShip's discussion types. |
| 15 | **Two guided modes: `book_discuss` and `library_ask`** | Single-book deep dive vs. cross-library search. Both registered in LiLa guided mode registry. |
| 16 | **Five export formats** | Markdown, plain text, DOCX, EPUB (Kindle-friendly with navigable TOC), PDF. |
| 17 | **75 MB file size limit** | Accommodates most books. Increase to 100 MB later if needed. |
| 18 | **Books/collections assignable as tasks** | Routes through PRD-09A task creation. Mom can assign reading to family members with accountability. |
| 19 | **Questions as 5th extraction tab (separate from Action Steps)** | Actions say "do this." Questions say "sit with this." Mixing them diluted both. The Questions tab captures the "I'll come back to that later" moments and enables the Journal Prompts library. |
| 20 | **Action Steps cleaned up: reflection_prompt removed** | Reflection prompts are questions, not actions. They belong in the Questions tab. Action Steps are strictly things the reader can go DO. |
| 21 | **Journal Prompts as standalone table (`journal_prompts`, not `bookshelf_`)** | Prompts can come from BookShelf, manual creation, and eventually other sources (LiLa, Rhythms). Standalone table with `source` field tracks provenance. |
| 22 | **Questions must be stand-alone and timeless** | Must make sense and provoke thought months later without re-reading the chapter. Book title and chapter travel as context metadata, but the question itself works independently. |
| 23 | **Selective extraction type picker (default all, choose any combination)** | Built from day one so it feels native. Many books warrant only one or two extraction types. Saves Sonnet tokens on skipped types. Users can always run additional types later via per-tab Extract buttons. |

### Deferred

| # | Item | Deferred To |
|---|------|------------|
| 1 | Age-adapted content generation for Guided children | Post-MVP. Data model accommodates without schema changes. |
| 2 | Google Drive export | Post-MVP. When Drive integration is built. |
| 3 | Audio file support (podcast/audiobook clips) | Post-MVP. Requires transcription pipeline. |
| 4 | Reading progress tracking | Post-MVP. |
| 5 | Book recommendation engine | Post-MVP. Requires sufficient platform usage data. |
| 6 | Collection templates (pre-built reading lists) | Post-MVP. Could seed from Platform Intelligence patterns. |
| 7 | Monthly upload limits per tier | Post-beta. Based on usage data and cost analysis. |
| 8 | Admin book ethics review UI | PRD-32 (System Admin Console). This PRD defines what gets queued; the admin UI lives there. |

### Cross-PRD Impact

| PRD Affected | What Changes |
|-------------|-------------|
| PRD-05 (LiLa Core) | Two new guided modes registered: `book_discuss`, `library_ask`. BookShelf extraction tables (including `bookshelf_questions`) added to context assembly pipeline. |
| PRD-06 (Guiding Stars) | New incoming flow: declarations from BookShelf route to Guiding Stars with `source = 'bookshelf'`. |
| PRD-07 (InnerWorkings) | Content extraction stub wired: `source_type = 'content_extraction'` from BookShelf extractions. |
| PRD-08 (Journal + Smart Notepad) | New incoming flow: discussion insights route to Smart Notepad via action chip. Journal Prompts library "Write About This" action opens Smart Notepad with prompt as context header. `journal_prompts` table created as a new prompt source for the journal writing experience. |
| PRD-09A (Tasks) | New task source: `source = 'bookshelf'` for action step routing, question routing, and book/collection assignment. |
| PRD-11 (Victory Recorder) | New victory source: `source = 'bookshelf'` for book completion. |
| PRD-13 (Archives) | BookShelf extraction tables follow the `is_included_in_ai` three-tier toggle pattern. |
| PRD-18 (Rhythms) | BookShelf content available via semantic search for morning/evening rhythm content. Journal Prompts can surface as morning reflection prompts. |
| Semantic Context Infrastructure Addendum | `bookshelf_chunks` replaces the speculative `knowledge_base_chunks` reference. Five extraction tables (including `bookshelf_questions`) added to the embeddable fields map. |
| Platform Intelligence Pipeline v2 | Channel E (Book Knowledge Library) fully wired by this PRD. |
| AI Cost Optimization Patterns | BookShelf discussions use P5 (on-demand action chips). BookShelf context uses P1 (semantic assembly) and P9 (per-turn refresh). |

---

*End of PRD-23*
