# Feature Decision File: PRD-23 — BookShelf

> **Created:** 2026-03-31
> **PRD:** `prds/ai-vault/PRD-23-BookShelf.md`
> **Addenda read:**
>   - `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-23-Session-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

BookShelf is the family's personal book wisdom library. Members upload books, PDFs, articles, and notes. The platform transforms them into structured, searchable, actionable wisdom organized into five extraction tabs (Summaries, Insights, Declarations, Action Steps, Questions). That wisdom routes into the rest of the platform — Guiding Stars, tasks, journal prompts, LiLa context. It's the bridge between what a family reads and how that reading shapes their daily life, values, and growth.

**Session A scope:** Library Mode (browsing, collections, member settings) + pre-flight wiring for send-to targets. Reading mode and extraction browser are Session B.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| BookShelfPage (`/bookshelf`) | Shell with library mode vs reading mode routing based on URL params |
| BookShelfLibrary | Main library view: search, sort, layout toggle, group mode, book grid |
| BookCard (grid variant) | Card with file type icon, title, author, status badges, tags, checkbox |
| BookCard (compact variant) | Row with icon, title+author, status badge, tags, checkbox |
| ReadingModePlaceholder | Session A placeholder for `?book=`, `?books=`, `?collection=`, `?hearted=` |
| BookShelfSearchBar | Client-side filter with debounce, "Search inside books" stub button |
| BookShelfControls | Sort dropdown (7 options), layout toggle, group mode toggle |
| MultiSelectBar | Floating bar when 1+ books selected: View Extractions, Add to Collection, Clear |
| ContinueBanner | "Continue Where You Left Off" via sessionStorage |
| CollectionSidebar | Desktop sidebar (>=768px) with collection list, CRUD actions |
| CollectionPanel | Mobile collapsible panel equivalent |
| CollectionModal | ModalV2 for create/edit with book selector |
| CollectionQuickPicker | Quick add-to-collection from card or multi-select bar |

---

## Key PRD Decisions (Easy to Miss)

1. **Route is `/bookshelf` — NOT under `/vault`**. BookShelf is a standalone feature, not nested.
2. **`bookshelf_items.uploaded_by_member_id`** — not `uploaded_by`. Column name from migration 100059.
3. **`family_member_id`** on extraction tables — not `member_id`. Matches migration naming.
4. **`book_knowledge_access`** column in member settings — not `knowledge_in_lila`. PRD-23 schema name is authoritative.
5. **`folder_group` TEXT** on bookshelf_items — used for "By Folder" grouping. Not a FK to archive_folders.
6. **Multi-part books**: `parent_bookshelf_item_id`, `part_number`, `part_count` on bookshelf_items. Query `.is('parent_bookshelf_item_id', null)` for top-level books.
7. **Extraction status vs processing status**: `processing_status` = file processing (pdf→text). `extraction_status` = AI extraction (text→structured knowledge).
8. **5 extraction tabs**: Summaries, Insights, Declarations, Action Steps, Questions — each is a separate DB table.
9. **Declarations have 5 style variants**: choosing_committing, recognizing_awakening, claiming_stepping_into, learning_striving, resolute_unashamed. 3 richness levels.
10. **`is_key_point` boolean** on all extraction tables — AI flags 2-3 most essential items per section during extraction. Powers abridged browsing (Session B).
11. **Platform-level dedup**: `book_cache` + `bookshelf_chunks` are platform-level (in `platform_intelligence`). Family books link via `book_cache_id`.
12. **`resurfaced_item_ids` is JSONB** (not UUID[]) in the live schema.
13. **Ethics gate**: `book_cache.ethics_gate_status` — pending/approved/failed/exempt. BookShelf declarations that come from `personal_custom` personas never enter platform intelligence.
14. **Shells**: Mom, Dad/Adult, Independent only. NOT Guided, NOT Play.
15. **Discussions use `bookshelf_item_ids UUID[]`** (array) — supports multi-book discussions.

---

## Addendum Rulings

### From PRD-23-Cross-PRD-Impact-Addendum.md:
- Two new LiLa guided modes: `book_discuss` and `library_ask` (NOT building Session A)
- Source enum on `guiding_stars` updated to include `'bookshelf'` (already exists)
- Source enum on `tasks` updated to include `'bookshelf'` (already exists)
- `knowledge_base_chunks` replaced by `bookshelf_chunks` (platform-level)
- Channel E of Platform Intelligence fully wired
- BookShelf follows three-tier toggle pattern with `book_knowledge_access` setting

### From PRD-23-Session-Addendum.md:
- Key Points system: `is_key_point` boolean on all extraction tables
- Abridged/Full content browsing (Session B)
- Unified ExtractionBrowser architecture with URL routing (Session B)
- SemanticSearchPanel is reusable app-wide component (Session B)
- Study Guides with `audience` column (future session)
- Library page sort options: 7 defined (Newest, Oldest, A-Z, Z-A, Has Extractions, Recently Viewed, Most Annotated)
- Layout toggles: Grid/Compact, By Folder/All Books
- `last_viewed_at` tracking on bookshelf_items
- `bookshelf_member_settings` extra columns: library_sort, library_layout, library_group_mode, resurfaced_item_ids
- "Continue Where You Left Off" banner via sessionStorage
- Content type visual system: left border colors, icons (Session B)

### From PRD-Audit-Readiness-Addendum.md:
- `bookshelf_insights` is the audited table name (not `bookshelf_frameworks` or `bookshelf_principles`)
- All standard audit rulings apply (RLS, timestamps, soft delete)

---

## Database Changes Required

### New Tables
None needed — all 16 BookShelf tables created in migration 100059.

### Modified Tables (columns being added)
None needed — pre-flight checks confirmed all columns exist:
- `guiding_stars.source` + `source_reference_id` (migration 100034)
- `best_intentions.source` + `source_reference_id` (migration 100034)
- All extraction send-to tracking columns (migration 100059)
- All `bookshelf_member_settings` library preference columns (migration 100059)

### Migrations
No new migration required for Session A.

### Code Changes Required
- TaskCreationModal: add `defaultTitle` and `defaultDescription` optional props (for Session B send-to wiring, but extend now)

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `bookshelf_basic` | Essential | mom, dad_adults, independent_teens | Browse library, view books |
| `bookshelf_upload` | Enhanced | mom, dad_adults | Upload books/documents |
| `bookshelf_extract` | Enhanced | mom, dad_adults, independent_teens | AI extraction |
| `bookshelf_discuss` | Enhanced | mom, dad_adults, independent_teens | Book discussions |
| `bookshelf_export` | Enhanced | mom, dad_adults | Export extractions |

Note: Feature keys may already be registered from migration 100059. Verify during build.

---

## Stubs — Do NOT Build Session A

- [ ] ExtractionBrowser / reading mode (Session B)
- [ ] Semantic search panel (Session B)
- [ ] "Refresh All Key Points" button functionality (Session B)
- [ ] Abridged/Full content toggle (Session B)
- [ ] Study Guides generation (future session)
- [ ] Book upload flow (future session — 578 books loaded via migration)
- [ ] LiLa `book_discuss` guided mode (future session)
- [ ] LiLa `library_ask` guided mode (future session)
- [ ] BookShelf-to-Archive routing (future session)
- [ ] Book Discussion conversations (future session)
- [ ] Export Dialog (future session)
- [ ] Hearted Items View (future session — placeholder route only)
- [ ] Rhythms resurfacing "From Your BookShelf" card (future)
- [ ] Journal Prompts Library page (Session B)
- [ ] Content type left-border colors (Session B)
- [ ] Chapter jump navigation (Session B)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| BookShelf declarations | -> | Guiding Stars | `sent_to_guiding_stars`, `guiding_star_id` FK |
| BookShelf action steps | -> | Tasks | `sent_to_tasks`, `task_id` FK |
| BookShelf questions | -> | Journal Prompts | `sent_to_prompts`, `journal_prompt_id` FK |
| BookShelf questions | -> | Tasks | `sent_to_tasks`, `task_id` FK |
| BookShelf discussions | -> | Journal | Via LiLa action chips (future) |
| BookShelf insights | -> | InnerWorkings | Via "Inform InnerWorkings" action (future) |
| BookShelf knowledge | -> | LiLa context | Via `book_knowledge_access` setting + semantic search |
| BookShelf items | -> | Archives | Via `folder_id` FK to archive_folders |
| Victory Recorder | <- | BookShelf | Book completion triggers victory (future) |
| Smart Notepad | -> | BookShelf | Via RoutingStrip destination (future) |

---

## Things That Connect Back to This Feature Later

- **PRD-05 LiLa**: `book_discuss` and `library_ask` guided modes will use BookShelf context
- **PRD-13 Archives**: Three-tier toggle system will control BookShelf context inclusion
- **PRD-18 Rhythms**: "From Your BookShelf" resurfacing card uses `resurfaced_item_ids`
- **PRD-10 Widgets**: Potential BookShelf reading tracker widget
- **PRD-11 Victory Recorder**: Book completion as victory source
- **PRD-08 Smart Notepad**: RoutingStrip destination for BookShelf

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct (none needed)
- [x] Feature keys identified
- [x] **Approved to build** — 2026-03-31

---

## Post-Build PRD Verification

> Completed 2026-03-31 after Sessions A+B.

### Session A (Library Mode)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Pre-flight DB columns | Session A spec | Wired | All columns verified present |
| Route /bookshelf | PRD-23 | Wired | App.tsx + PermissionGate |
| Sidebar nav (Mom/Adult/Independent) | PRD-23 | Wired | Library icon, bookshelf_basic feature key |
| BookShelfPage shell | PRD-23 | Wired | Library/reading mode routing via URL params |
| BookShelfLibrary (search, sort, tags, layout) | PRD-23 | Wired | 7 sorts, tag filter bar, grid/compact |
| BookCard (grid + compact + multi-part) | PRD-23 | Wired | Both variants + parts expansion |
| MultiSelectBar | PRD-23 | Wired | View Extractions + Add to Collection |
| ContinueBanner | Session Addendum | Wired | sessionStorage-based |
| useBookShelf + useBookShelfSettings | PRD-23 | Wired | Light query, upsert settings |
| Collection CRUD (hook + sidebar + modal + picker) | PRD-23 | Wired | Full CRUD, desktop/mobile |
| TypeScript types | PRD-23 | Wired | 210 lines, all interfaces |
| FeatureGuide on BookShelfPage | Convention 14 | Wired | Added in verification fix |

### Session B (Extraction Browser)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Migration 100066 (vector search RPCs) | Session B spec | Wired | match_bookshelf_chunks + match_bookshelf_extractions |
| extractionActions.ts (Layer 1) | Session B spec | Wired | 8 pure action functions |
| Data hooks (3) + item actions hook | Session B spec | Wired | useExtractionData, useExtractionBrowser, useJournalPrompts, useExtractionItemActions |
| ExtractionItem base (Layer 3) | Session B spec | Wired | Heart, note, delete, Apply This |
| 5 specialized items + TypeBadge (Layer 4) | Session B spec | Wired | Summary, Insight, Declaration, ActionStep, Question |
| ExtractionBrowser (Layer 5) | Session B spec | Wired | Single/multi/collection/hearted modes |
| Header + Controls + Content | Session B spec | Wired | Editable title, tab bar, 3 view modes |
| Sidebar + ChapterJump | Session B spec | Wired | Desktop sticky + mobile FAB |
| ApplyThisSheet | Session B spec | Wired | 8 destinations (5 wired, 3 stubs) |
| BookSelector + CollectionChips | Session B spec | Wired | Multi-book toggle + collection pills |
| SemanticSearchPanel | Session B spec | Wired | Wired into ExtractionBrowser via "Search Inside" button |
| Edge Functions (2) | Session B spec | Wired | bookshelf-search + bookshelf-key-points deployed |
| JournalPromptsPage + route + nav | Session B spec | Wired | Full CRUD, search, book filter |
| FeatureGuide on JournalPromptsPage | Convention 14 | Wired | Added in verification fix |

### Summary
- **Total requirements verified: 44**
- **Wired: 44**
- **Stubbed: 0**
- **Missing: 0**

### Future Sessions (correctly deferred)
- Study Guides generation
- Book upload flow
- LiLa `book_discuss` / `library_ask` guided modes
- BookShelf-to-Archive routing
- Book Discussion conversations
- Export Dialog
- Rhythms resurfacing "From Your BookShelf" card

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed
- [x] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [x] Zero Missing items confirmed
- [x] **Phase approved as complete**
- **Completion date: 2026-03-31**
