# Build Prompt 28: BookShelf

## PRD Reference
- PRD-23: `prds/ai-vault/PRD-23-BookShelf.md`
- Addendum: `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- Session Addendum: `prds/addenda/PRD-23-Session-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core AI) complete
- Phase 13 (Archives & Context) complete
- Phase 25 (AI Vault Browse & Content) complete

## Objective
Build the BookShelf feature for uploading, processing, and deeply engaging with books and written content. Includes upload pipeline (pdf/epub/docx/txt/image/text_note), AI processing (extract, analyze, embed, classify), 5 extraction tabs (Summaries, Principles, Declarations, Actions, Questions), chapter-based organization, "Go Deeper" AI conversations, heart/note per extraction item, multi-book discussions with RAG, collections, hearted items view, journal prompts library, LiLa knowledge control per member, platform book cache, and export. This is a Very Large phase — consider splitting into 28A (data layer + upload pipeline) and 28B (extraction UI + discussions + export).

## Extraction Pull
- StewardShip book data for seeding initial content

## Database Work
Create tables:
- `bookshelf_items` — Uploaded books/content with metadata, processing status, file references
- `bookshelf_chapters` — Chapter breakdown per book with ordering and title
- `bookshelf_chunks` — Text chunks with embeddings for RAG retrieval
- `bookshelf_summaries` — AI-generated summaries per chapter/book
- `bookshelf_insights` — Extracted insights (principles, frameworks, mental models, etc.) with source chapter reference
- `bookshelf_declarations` — Extracted declarations (I will / I am statements)
- `bookshelf_action_steps` — Extracted actionable steps with optional task linkage
- `bookshelf_questions` — Extracted reflection/discussion questions
- `bookshelf_discussions` — Multi-book discussion threads
- `bookshelf_discussion_messages` — Individual messages in discussions with RAG context
- `bookshelf_collections` — User-created collections of books
- `bookshelf_collection_items` — Join table for books in collections
- `journal_prompts` — Journal prompts library generated from book content
- `bookshelf_member_settings` — Per-member settings for LiLa knowledge access control
- `platform_intelligence.book_cache` — Platform-level book cache to avoid re-processing shared titles

Enable RLS on all tables. Members access their own books and shared family books. Platform book cache is system-level.

## Component Work
### Upload & Processing
- Upload modal — Support pdf, epub, docx, txt, image (OCR), and manual text note entry
- Processing pipeline — Extract text → analyze chapters → generate embeddings → classify content → produce extractions
- Processing status indicator — Progress bar showing pipeline stages

### Extraction Tabs
- Summaries tab — Chapter and full-book summaries with expandable detail
- Principles tab — Extracted principles with source attribution and heart/note per item
- Declarations tab — "I will" / "I am" statements extracted from content
- Actions tab — Actionable steps with optional link-to-task functionality
- Questions tab — Reflection and discussion questions for personal or group use

### Engagement
- Chapter-based organization — Navigate extractions by chapter
- "Go Deeper" — AI conversation about specific extraction items or chapters
- Heart/note per item — Heart or add personal note to any extraction
- Multi-book discussions — Discussion threads with RAG pulling top 8 chunks and 10 extractions per book
- Collections — Create, name, and organize books into collections
- Hearted items view — Aggregated view of all hearted extractions across books

### Library & Export
- Journal prompts library — Browse and use journal prompts generated from book content
- LiLa knowledge control — Per-member toggle for whether LiLa can reference their book content
- Platform book cache — Deduplicate processing for books already in the platform cache
- Export — Markdown, Text, DOCX, EPUB, PDF export of extractions and notes

## Edge Function Work
- `bookshelf-process` — Orchestrates the extraction pipeline (text extraction, chapter detection, embedding generation)
- `bookshelf-extract` — AI extraction of summaries, principles, declarations, actions, questions from chunks
- `bookshelf-discuss` — RAG-powered discussion endpoint (top 8 chunks + 10 extractions per book)

## Testing Checklist
- [ ] Upload works for all supported file types (pdf, epub, docx, txt, image, text_note)
- [ ] Processing pipeline completes and populates all 5 extraction types
- [ ] Chapter detection correctly segments content
- [ ] Embeddings generated and stored for RAG retrieval
- [ ] Each of 5 extraction tabs renders correctly with source attribution
- [ ] Heart and note functionality works on individual extraction items
- [ ] "Go Deeper" launches AI conversation with relevant context
- [ ] Multi-book discussions pull correct RAG context (8 chunks, 10 extractions per book)
- [ ] Collections CRUD works (create, add books, remove, delete)
- [ ] Hearted items view aggregates across all books
- [ ] Journal prompts library populates from book content
- [ ] LiLa knowledge control toggle respected in AI conversations
- [ ] Platform book cache prevents duplicate processing
- [ ] Export generates correct output for all 5 formats
- [ ] RLS prevents cross-member book access

## Definition of Done
- All PRD-23 MVP items checked off
- Upload pipeline handles all 6 input types
- AI extraction pipeline produces all 5 extraction categories
- RAG-powered discussions functional with correct chunk retrieval
- Collections and hearted items views operational
- Export working for all 5 formats
- Platform book cache deduplication verified
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
