# PRD-23 Session Addendum: BookShelf Browsing & Extraction UX
## Key Points, Abridged Mode, Study Guides, Semantic Search Panel, and Navigation Enhancements

**Created:** March 19, 2026
**Parent PRD:** PRD-23 (BookShelf)
**Source:** StewardShip PRD-25 (Manifest Browsing & Extraction UX) — proven patterns adapted for MyAIM Family architecture

---

## Purpose

This addendum extends PRD-23 with browsing, navigation, and content consumption features that were developed and proven in StewardShip after 100+ book extractions. Rather than tacking these on later, we're building them from day one in MyAIM so the architecture supports them natively.

Key additions:
1. **Key Points** — AI flags the most essential items during extraction (no separate pass)
2. **Abridged / Full Content browsing** — default view shows only key points + hearted items
3. **Unified ExtractionBrowser** — one component for single-book and multi-book views
4. **SemanticSearchPanel** — app-wide reusable semantic search, not BookShelf-specific
5. **Study Guides** — age-adapted rewrites of key points for specific children
6. **Apply This section** — focused conversation starters for book application
7. **Navigation enhancements** — sidebar, chapter jump, continue banner, library sorting

---

## 1. Key Points System

### What It Does

During extraction, the AI flags the 2-3 most essential items per section per extraction type as "key points." These form the backbone of the abridged browsing experience — when a member opens a book, they see the most important content first without scrolling through everything.

### How It Works — During Extraction (Not After)

> **Decision rationale:** StewardShip added key points as a separate Haiku pass after extraction — a retrofit that cost ~$0.01-0.02/book extra and produced lower-quality judgments (Haiku reviewing items in isolation vs. Sonnet with full chapter context). In MyAIM, Sonnet flags key points DURING extraction because it already has the full chapter context and is in the best position to judge importance. Zero extra API cost. Better quality. Instant availability.

**Extraction prompt addition (all five tabs):**
The extraction prompt includes an instruction: "For each section, mark the 2-3 most essential items as key points. These are the items a reader would want to see if they only had 30 seconds with this chapter."

The extraction response includes an `is_key_point: true/false` field per item. The Edge Function saves this directly to the database during the normal extraction write.

**Rules:**
- For sections with ≤2 items: all items are key points
- For sections with 3+ items: AI selects 2-3
- Hearted items are always shown alongside key points (regardless of key point status)
- If a section has zero key points AND zero hearted items: fallback shows first 2 items by sort_order — sections never disappear from the browsing view

### Schema Addition

Add to all five extraction tables (`bookshelf_summaries`, `bookshelf_principles`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| is_key_point | BOOLEAN | false | NOT NULL | Set during extraction by Sonnet. Determines abridged view visibility. |

### Refresh Key Points (Migration Fallback Only)

A `bookshelf-key-points` Edge Function (Haiku, ~$0.01/book) exists solely for migration scenarios — books imported from StewardShip or extracted before the key-points-during-extraction system was in place. It reviews all extracted items for a book and updates `is_key_point` flags.

This is NOT exposed as a user-facing button. In normal flow, key points are set during extraction and never need refreshing. If the extraction prompt consistently fails to set good key points, the fix is to tune the prompt — not to add a refresh button.

> **Decision rationale:** StewardShip needed a Refresh Key Points button because key points were added retroactively to 100+ already-extracted books. In MyAIM, key points are built into extraction from day one, so the button is unnecessary. The Edge Function exists only as a backend migration tool.

---

## 2. Abridged / Full Content Browsing

### What It Does

Abridged mode shows only the most important content from each book — key points and hearted items — with per-section "See more" expansion. This solves the "wall of content" problem where a fully extracted book has hundreds of items across five tabs.

> **Mom experience goal:** Opening a book you extracted months ago should feel like picking up a well-highlighted copy, not like opening a raw textbook. The best stuff surfaces immediately. Everything else is one tap away.

### Default Behavior

**Abridged mode is ON by default** on first visit. Persisted to session storage.

**What "Abridged" shows per section:**
- Items where `is_key_point = true`
- Items where `is_hearted = true`
- If a section has neither: first 2 items by `sort_order` (sections never disappear)

### Chapter/Section Collapse Rules

| View Mode | Abridged ON | Abridged OFF (Full Content) |
|-----------|-------------|---------------------------|
| Tabs view | All sections **expanded** (easy scroll through 2-3 items per section) | All sections **collapsed** (user picks which to open) |
| Chapters view | All chapters **expanded** | All chapters **collapsed** |
| Notes view | Flat list (N/A) | Flat list (N/A) |

**Toggling between modes** dynamically expands or collapses all sections and resets per-section expansion state.

### "See More" / "Key Points Only" Per Section

Each section with hidden items shows a "See N more" button at the bottom:
- Tap → that section expands to show ALL items (other sections stay abridged)
- Button changes to "Key points only"
- Tap → section collapses back to key points + hearted
- Each section expands/collapses independently

In Chapters view: "See more" appears per content TYPE within each chapter (e.g., expand Principles in Chapter 3 while Summaries stays abridged in Chapter 3).

### Tab Counts

Tab badges always reflect the FILTERED count (after abridged + search + hearted filtering). When abridged is on, the count shows how many items are currently visible, not total.

---

## 3. Unified ExtractionBrowser Architecture

### The Problem It Solves

StewardShip v1 had two separate components for browsing extractions: `ExtractionTabs` (on the book detail page) and `ExtractionsView` (for multi-book browsing). Every feature had to be built twice and kept in sync — the #1 source of bugs and inconsistency.

### The Solution: One Component, Two Modes

In MyAIM, there is ONE extraction browsing component: `ExtractionBrowser`. It accepts a `bookIds[]` prop. If one ID, it's single-book mode. If multiple IDs, it's multi-book mode. Everything else is identical: same tabs, same abridged toggle, same search, same sidebar, same chapter jump, same item actions, same see-more buttons.

**Behavior differences by mode:**

| Aspect | Single Book (`bookIds.length === 1`) | Multi-Book (`bookIds.length > 1`) |
|--------|--------------------------------------|-----------------------------------|
| Header | Book title + author | "Extractions" + Discuss button |
| Book Info | Collapsible section available | Not shown |
| Apply section | All buttons (Discuss, Study Guide, Refresh Key Points) | Discuss + Refresh Key Points only |
| Book selector | Not shown | Checkbox list with search + collection chips |
| Content headings | Chapter headings only | Book title headings with chapter headings nested |

### URL-Based Routing

```
/bookshelf                              → Library view
/bookshelf?book=<uuid>                  → Single book reading view
/bookshelf?books=<uuid1>,<uuid2>        → Multi-book reading view
/bookshelf?collection=<uuid>            → Collection reading view
/bookshelf?hearted=true                 → Hearted items view
```

Enables deep links, browser back/forward, share links, and bookmarks.

### Shared Sub-Components

**`ExtractionItem`** — renders any extraction item (used by ExtractionBrowser, SemanticSearchPanel, Rhythms resurfacing card, any future consumer):
- Content type badge with icon and left border color
- Text content
- Tag chips (if tags exist)
- Hearted emphasis (subtle warm background)
- Go Deeper indicator (sparkle icon for `is_from_go_deeper`)
- Action buttons: Heart, Note, Delete, plus type-specific routing (Send to Guiding Stars, Send to Tasks, Add to Journal Prompts)

**`ExtractionSection`** — renders a collapsible section with abridged/see-more logic:
- Sticky header with background color
- Items list
- "See N more" / "Key points only" button
- Handles per-section expand/collapse independently

---

## 4. SemanticSearchPanel — App-Wide Component

### What It Does

A reusable semantic search panel that can be opened from any feature in the app. It searches across the user's BookShelf extractions, RAG chunks, and personal context (InnerWorkings, Guiding Stars, Journal entries) — surfacing the most relevant content for whatever the user is dealing with.

> **Decision rationale:** Semantic search is NOT a BookShelf feature — it's a platform capability that BookShelf is the primary data source for. Building it as a reusable component from day one means every feature can consume it without building search UI from scratch.

### Three Search Modes

| Mode | Behavior |
|------|----------|
| **Any of these** (default) | Splits comma/semicolon/newline terms, searches each independently, merges + deduplicates, items matching multiple terms rank higher |
| **All together** | Searches entire input as one phrase |
| **Show each separately** | Splits terms, groups results by term with headers |

### Scope Toggle

| Scope | What it searches | When to use |
|-------|-----------------|-------------|
| **Book passages** | RAG chunks (`bookshelf_chunks`) — author's actual words | "What did the book say about..." |
| **Extracted insights** | All five extraction tables — AI-distilled content | "What's the framework for..." |
| **Both** (default) | Merged results from both layers, deduplicated | General exploration |

### Results Display

- Organized by relevance (default) or by book (toggle)
- Each result: content type label, similarity %, content preview (500 chars), book title + chapter
- Export button → downloads .md file respecting current mode/grouping

### Reusable Hook

```typescript
const { openSearch, SearchPanel } = useSemanticSearch();
// Call from anywhere:
openSearch({ defaultQuery: 'communicating with teens', scope: 'books' });
// Render SearchPanel in your component tree
```

### Integration Map — Where SemanticSearchPanel Surfaces

**Direct UI integration (panel opens with a button tap):**

| Feature | PRD | Trigger | Default Scope |
|---------|-----|---------|---------------|
| BookShelf | PRD-23 | "Search Library" button on library page | Books |
| Safe Harbor | PRD-20 | "What have I read about this?" | Books |
| InnerWorkings | PRD-07 | "What books relate to this?" | Books |
| Journal | PRD-08 | Sidebar: "Related from your library" | Books + Personal |
| Tasks | PRD-09A | Task detail: "Resources from your books" | Books |
| Family Context | PRD-19 | Person detail: "What do my books say about helping them?" | Books + Personal |
| LifeLantern | PRD-12A | Area detail: "Library insights" | Books + Personal |
| Meetings | PRD-16 | Pre-meeting prep | Books + Personal |

**Automatic context loading (no UI, LiLa uses silently):**

| Feature | PRD | When | What loads |
|---------|-----|------|-----------|
| LiLa Core | PRD-05 | Every message >15 chars | Top 8 BookShelf content + top 5 personal context |
| LiLa Guided Modes | PRD-05 | Mode-specific triggers | Targeted content by mode type |
| Rhythms (morning) | PRD-18 | Morning briefing generation | 1-3 hearted items for resurfacing card |
| Rhythms (evening) | PRD-18 | Evening review | Hearted content for reflection |
| BookShelf Discussions | PRD-23 | Every discussion message | Dual search: RAG chunks + extracted content |
| Victory Recorder | PRD-11 | Victory celebration | Matching Guiding Stars + book principles |

> **Forward note:** Each feature PRD's build prompt should include wiring to `useSemanticSearch()` when that feature's build phase arrives. The hook and panel are built once with BookShelf; features consume them as they're built.

### "Search Inside All Books" Fallback

On the BookShelf library page, when the title/author text search returns no results, a dashed button appears: "Search inside all books for '[query]'" → opens SemanticSearchPanel with the query pre-filled. This means a book that was uploaded but not well-titled is still findable via its content.

---

## 5. Study Guides — Age-Adapted Content

### What It Does

Study guides are transformations of existing key-point extractions, not new extractions from the raw book. The AI takes the parent's adult-level content and rewrites it for a specific child — adapting language, examples, and framing while preserving the core ideas. No book re-scan required. Cost: ~$0.01-0.02 per book per audience.

> **Mom experience goal:** You've already extracted and curated a book. Now you want your 11-year-old to engage with it too. One button, one child selection, and the book's best content is rewritten in language your child connects with — referencing their interests, using their vocabulary level, and meeting them where they are.

### How It Works

1. Mom opens an extracted book → Apply section → **"Study Guide"** button
2. Selects a child from the family member picker
3. Selects detail level: Brief / Standard (default) / Detailed
4. AI generates the study guide using the child's Archives context (personality, interests, learning style, strengths, challenges)
5. Audience selector appears above the tabs — mom switches between "Original" and "[Child's Name]"
6. Mom can edit any item before sharing
7. Toggle "Share with [Child]" → book appears in child's BookShelf with only their study guide content

### Audience Column

Add to all five extraction tables:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| audience | TEXT | 'original' | NOT NULL | 'original' for adult extractions, 'study_guide_{memberId}' for personalized child versions |

**Index:** `(bookshelf_item_id, audience)` for fast filtering by version.

All existing extraction queries filter by `audience = 'original'` by default. When a child views a shared book, queries filter by their `audience = 'study_guide_{memberId}'`.

### Detail Levels

| Level | Description | What changes |
|-------|-------------|-------------|
| **Brief** | One-sentence essence of each key point | Same item count, shorter text |
| **Standard** (default) | Clear explanation with one relatable example | Same count, moderate length |
| **Detailed** | Full explanation with examples, context, and "try this" suggestions | Same count, longer text |

### What Gets Rewritten Per Tab

| Tab | Study Guide Name | What changes |
|-----|-----------------|-------------|
| Summaries | **Key Ideas** | Simplified language, child-relatable examples |
| Action Steps | **Try This** | Adapted for a young person's daily life |
| Questions | **Think About** | Personal and conversational ("Have you ever...") |
| Declarations | **Principles to Remember** | Reframed for a young person's identity journey |
| Principles & Frameworks | **Not included** | Parent-level analytical content — not age-appropriate for most children |

> **Decision rationale:** Frameworks are excluded from study guides because they're structural/analytical content designed for adult application. The other four tabs translate naturally to age-appropriate content. If a family wants frameworks included for a mature teen, they can share the original extractions instead.

### Personalization via Archives

When generating for a specific child, the system fetches their Archives context:
- **InnerWorkings** (PRD-07): personality, communication style, learning style, strengths
- **Guiding Stars** (PRD-06): what the child cares about and aspires to
- **Task/routine patterns** (PRD-09A): what they engage with vs. avoid
- **Tracker data** (PRD-10): habits, interests
- **Family Context notes** (PRD-19): parent's observations about this child

This context feeds the AI rewrite prompt so the study guide references the child's actual interests and learning style — "Think about when you're building your Minecraft castle — you plan, test, adjust. That's the same loop this framework describes."

> **Decision rationale:** The more the family uses the platform, the better the study guides become. Archives context enriches over time, creating a virtuous cycle where platform engagement directly improves educational output.

### Access Control

- Mom generates the study guide and can review/edit before sharing
- Mom toggles "Share with [Child]" per book — child sees the book in their BookShelf
- Child sees ONLY their study guide content, never the parent's original extractions
- Permissions flow through PRD-02 (PermissionGate)
- Guided children see study guide content in their simplified view (feeds into PRD-25 Guided Dashboard when built)

### Edge Function: `bookshelf-study-guide`

- **Model:** Haiku (rewriting existing content, not extracting from raw text)
- **Input:** Existing key-point + hearted items (original audience), child's Archives context, detail level
- **Output:** Rewritten items saved with `audience = 'study_guide_{memberId}'`
- **Regenerate:** Deletes existing study guide items for that audience, creates fresh
- **Cost:** ~$0.01-0.02 per book per child

### Study Guide Items Are Always Key Points

All study guide items have `is_key_point = true` by default — they're already distilled from the parent's key points. This means abridged mode shows everything in a study guide (which is the right behavior since study guides are already concise).

---

## 6. Apply This Section

### What It Does

A row of action buttons on the book detail page (below extraction tabs) that provides focused ways to engage with and apply the book's content.

> **Decision rationale:** The Generate Goals/Questions/Tasks buttons from StewardShip are no longer needed because per-item routing buttons (Send to Guiding Stars, Send to Tasks, Add to Journal Prompts) now exist directly on extraction items. Users route content from where they find it, not from a separate section. The Refresh Key Points button is also unnecessary because key points are set during extraction in MyAIM (not added retroactively). What remains are the two actions that aren't covered by per-item buttons: starting a discussion and generating a study guide.

### Buttons

| Button | What It Does |
|--------|-------------|
| **Discuss Book** | Opens book discussion (LiLa `book_discuss` guided mode) |
| **Study Guide** | Opens study guide generation flow (see Section 5) |

In multi-book mode (ExtractionBrowser with multiple bookIds): only Discuss and Export are shown (Study Guide is a single-book action).

The **Discuss Book** button also appears as a floating FAB on desktop (right side of the book detail page) for quick access while scrolling through extractions.

---

## 7. Navigation Enhancements

### Desktop Sidebar (≥768px)

**On book detail page (single-book mode):**
- "Library" link (returns to book list)
- **Recently Viewed** section (last 5 books by `last_viewed_at`)
- **Current Book** chapter tree (expandable, click to scroll to section)
- **Extracted books** section (quick-switch to another book)
- Collapsible (state persisted to session storage)

**On multi-book mode:**
- Chapter tree for ALL selected books
- Book titles as headers with chapters nested
- Item counts per chapter
- Click chapter → scroll to that section

### Mobile Chapter Jump FAB (<768px)

- Fixed position, bottom-left, teal circle (40px)
- Tap → bottom sheet with chapter list
- Current chapter highlighted (via scroll spy / IntersectionObserver)
- Tap chapter → smooth scroll + dismiss sheet
- "Back to top" at bottom of list
- Visible when 3+ sections exist in either abridged or full content mode

### Sticky Section Headers

All section headers (`position: sticky; top: 0; z-index: 5`) with background color to prevent text bleed-through. Applied in both tabs view (section headers) and chapters view (chapter headers).

### "Continue Where You Left Off" Banner

When returning to the BookShelf page with a previously viewed book in session storage:
- Banner shows book title, active tab, view mode
- One tap restores full browsing state
- Dismiss button (×) clears session storage
- Appears above the book grid on the library page

---

## 8. Library Page Enhancements

### Sort Options

| Sort | Description |
|------|-------------|
| Newest | By upload date, newest first |
| Oldest | By upload date, oldest first |
| Name A-Z | Alphabetical by title |
| Name Z-A | Reverse alphabetical |
| Has Extractions | Extracted books first, then unextracted |
| Recently Viewed | By `last_viewed_at` descending |
| Most Annotated | By total hearted + noted items count |

Persisted to `bookshelf_member_settings`.

### Layout Toggles

- **Grid** (cards, default) / **Compact** (rows)
- **Group by:** Folder / All Books
- Both persisted to `bookshelf_member_settings`

### `last_viewed_at` Tracking

Add to `bookshelf_items`:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| last_viewed_at | TIMESTAMPTZ | null | NULL | Updated when any member opens the book detail page |

> **Note:** This is per-item (family-level), not per-member. If per-member recently-viewed tracking is needed later, it would be a separate junction table. For now, family-level is sufficient since the primary use is mom browsing her library.

### Additional `bookshelf_member_settings` Columns

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| library_sort | TEXT | 'newest' | Persisted sort preference |
| library_layout | TEXT | 'grid' | 'grid' or 'compact' |
| library_group_mode | TEXT | 'all_books' | 'by_folder' or 'all_books' |
| resurfaced_item_ids | JSONB | '[]' | Tracks which items were shown in Rhythms resurfacing (for 3-day deduplication) |

---

## 9. Rhythms Resurfacing — "From Your BookShelf" Card

### What It Does

During morning Rhythms (PRD-18), a "From Your BookShelf" card surfaces 1-3 hearted extraction items from the member's library. This is the organic way book wisdom re-enters daily life without the member having to remember to go look for it.

### How It Works

- Selects 1-3 hearted items from `bookshelf_summaries`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions` (mixed content types for variety)
- Excludes items shown in the last 3 days (tracked via `resurfaced_item_ids` JSONB on `bookshelf_member_settings`)
- Weighted random selection (hearted key points weighted higher)
- Each item shows: content type badge, full text, book title + chapter attribution
- "See more" link → navigates to `/bookshelf`

### Evening Variation

During evening Rhythms, a "Something to sit with tonight" variant can surface a single question or declaration — more reflective, less informational.

> **Depends on:** PRD-18 (Rhythms & Reflections) build. This addendum defines what data is available; the Rhythms build wires the resurfacing card component.

---

## 10. Scroll Position & State Persistence

### Session Storage Keys

| Key | Value | Used By |
|-----|-------|---------|
| `bookshelf-selected-book` | Book UUID | Continue banner |
| `bookshelf-selected-title` | Book title | Continue banner |
| `bookshelf-active-tab` | Tab name | ExtractionBrowser |
| `bookshelf-view-mode` | tabs/chapters/notes | ExtractionBrowser |
| `bookshelf-filter-mode` | all/hearted | ExtractionBrowser |
| `bookshelf-abridged` | true/false | ExtractionBrowser |
| `bookshelf-scroll-{bookId}-{tab}-{viewMode}` | scrollY | Scroll restoration |
| `bookshelf-sidebar-collapsed` | true/false | Desktop sidebar |
| `bookshelf-semantic-mode` | any/together/separate | SemanticSearchPanel |

### Scroll Position Persistence

Saved to session storage on:
- Tab switch (saves outgoing, restores incoming)
- Navigation away from book detail
- Component unmount

Restored after data loads (guarded by `useEffect` with data dependency to prevent premature scroll).

---

## 11. Content Type Visual System

### Left Border Colors

Each extraction item has a colored left border by content type for instant visual scanning:

| Content Type | Border Color | Icon |
|-------------|-------------|------|
| key_concept | Teal | Lightbulb |
| story, metaphor, character_insight | Cognac | BookOpen |
| lesson, insight, theme | Dark teal | Eye |
| quote | Slate | Quote |
| principle, framework, mental_model | Dark teal | Compass |
| process, strategy | Dark teal | Wrench |
| exercise, practice, habit | Dark teal | CheckCircle |
| conversation_starter, project | Dark teal | Users |
| daily_action, weekly_practice | Dark teal | CheckCircle |
| reflection, self_examination | Cognac | Eye |
| implementation, scenario | Teal | Lightbulb |
| discussion | Slate | Users |
| All declaration voices | Cognac | Anchor |

> **Depends on:** PRD-03 (Design System) CSS custom properties. All colors referenced via `var(--color-*)` tokens — zero hardcoded values.

### Item Actions (Universal)

Every extraction item, in every view, has these icon-only action buttons:

| Button | Icon | Action | Appears On |
|--------|------|--------|-----------|
| Heart | Heart | Toggle `is_hearted` | All items |
| Note | Sticky note | Open inline textarea for `user_note` | All items |
| Delete | Trash | Set `is_deleted = true`, fade out | All items |
| Send to Guiding Stars | Star | Create Guiding Stars entry | Declarations only |
| Send to Tasks | Checkmark | Open task creation modal | Action Steps + Questions |
| Add to Journal Prompts | Book | Create journal_prompts entry | Questions only |

"Already sent" state shows subtle italic text ("In Guiding Stars", "In Tasks", "In Prompts").

---

## Schema Changes Summary

### New Columns on Existing Tables

**On `bookshelf_summaries`, `bookshelf_principles`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| is_key_point | BOOLEAN | false | Set during extraction. Determines abridged view visibility. |
| audience | TEXT | 'original' | 'original' for adult content, 'study_guide_{memberId}' for child versions. |

**Index:** `(bookshelf_item_id, audience)` on all five tables.

**On `bookshelf_items`:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| last_viewed_at | TIMESTAMPTZ | null | Updated on book detail page open. |

**On `bookshelf_member_settings` (new columns):**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| library_sort | TEXT | 'newest' | Sort preference |
| library_layout | TEXT | 'grid' | 'grid' or 'compact' |
| library_group_mode | TEXT | 'all_books' | 'by_folder' or 'all_books' |
| resurfaced_item_ids | JSONB | '[]' | 3-day dedup tracking for Rhythms resurfacing |

### New Edge Function

| Function | Purpose | Model | Cost |
|----------|---------|-------|------|
| `bookshelf-study-guide` | Rewrites key-point items for a specific child using Archives context | Haiku | ~$0.01-0.02/book/child |
| `bookshelf-key-points` | Migration fallback only: refreshes key points for books extracted before the key-points-during-extraction system existed | Haiku | ~$0.01-0.02/book |

> **Decision rationale:** `bookshelf-key-points` exists only for the edge case where books were extracted without key point flags (e.g., data migration from StewardShip, or if the extraction prompt fails to set key points). It is NOT part of normal flow and does not need a UI button. If it becomes frequently needed, that's a signal to fix the extraction prompt.

---

## Decisions Made in This Addendum

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Key points set during extraction, not as a separate pass** | Sonnet has full chapter context during extraction — better quality than Haiku reviewing items in isolation. Zero extra API cost. Instant availability. |
| 2 | **Abridged mode ON by default** | Respects the reader's time. Full content is one tap away. Prevents the "wall of content" overwhelm on first open. |
| 3 | **Sections never disappear in abridged mode** | Fallback to first 2 items if no key points and no hearts. Every chapter stays represented. |
| 4 | **Unified ExtractionBrowser** | One component for single-book and multi-book. Eliminates the two-view bug problem from StewardShip v1. |
| 5 | **SemanticSearchPanel as app-wide component** | Not BookShelf-specific. Built once, consumed by any feature via `useSemanticSearch()` hook. |
| 6 | **Study Guides at MVP with `audience` column** | Working design from StewardShip. `audience` column added to all extraction tables from day one. Lightweight Haiku rewrite of existing key points — no re-extraction from raw book. |
| 7 | **Study guides exclude Principles & Frameworks tab** | Parent-level analytical content not age-appropriate for most children. Other four tabs translate naturally. Mature teens can receive original extractions via direct sharing. |
| 8 | **Apply section simplified to Discuss + Study Guide only** | Generate Goals/Questions/Tasks buttons removed — per-item routing buttons (Send to Guiding Stars, Send to Tasks, Add to Journal Prompts) handle this directly on extraction items. Refresh Key Points button removed — key points are set during extraction, not retroactively. |
| 9 | **`last_viewed_at` at item level, not per-member** | Sufficient for mom's library browsing. Per-member tracking is a future enhancement if needed. |
| 10 | **PWA shortcuts deferred** | BookShelf may not be a high-frequency feature for most users. Add later if power-user demand emerges. |
| 11 | **Dual-layer search (RAG chunks + extractions)** | Books uploaded but never extracted are still fully searchable via RAG chunks. Extractions add the browsing/scanning/abridged layer on top. Both available in SemanticSearchPanel via scope toggle. |

---

## Cross-PRD Impact from This Addendum

| PRD Affected | What Changes |
|-------------|-------------|
| PRD-05 (LiLa Core) | SemanticSearchPanel architecture defined here; LiLa's per-turn semantic context already wired. Confirm `useSemanticSearch()` hook pattern is available for all guided modes. |
| PRD-07 (InnerWorkings) | "What books relate to this?" trigger for SemanticSearchPanel. Forward note for build phase. |
| PRD-08 (Journal) | "Related from your library" sidebar trigger for SemanticSearchPanel. Forward note for build phase. |
| PRD-09A (Tasks) | "Resources from your books" trigger on task detail. Forward note for build phase. |
| PRD-10 (Widgets) | Study guide generation uses child's tracker data from Archives for personalization context. |
| PRD-12A (LifeLantern) | "Library insights" trigger for SemanticSearchPanel on area detail. Forward note for build phase. |
| PRD-16 (Meetings) | Pre-meeting prep trigger for SemanticSearchPanel. Forward note for build phase. |
| PRD-18 (Rhythms) | "From Your BookShelf" resurfacing card defined here. Wired during Rhythms build. Resurfacing dedup tracking in `bookshelf_member_settings`. |
| PRD-19 (Family Context) | "What do my books say about helping them?" trigger for SemanticSearchPanel on person detail. Study guide personalization pulls from family context notes. |
| PRD-20 (Safe Harbor) | "What have I read about this?" trigger for SemanticSearchPanel. Forward note for build phase. |
| PRD-25 (Guided Dashboard) | Study guide content for Guided children feeds into their simplified view. Forward note for build phase. |

---

## What "Done" Looks Like — Additions

### MVP (Must Have)

- [ ] `is_key_point` column on all five extraction tables, set during extraction by Sonnet
- [ ] `audience` column on all five extraction tables, default 'original', indexed with `bookshelf_item_id`
- [ ] Abridged/Full Content toggle with per-section "See more" / "Key points only"
- [ ] Sections never disappear: fallback to first 2 items when no key points and no hearts
- [ ] Chapter collapse behavior: expanded in abridged, collapsed in full content
- [ ] Tab counts reflect filtered state (abridged + search + hearted)
- [ ] Unified ExtractionBrowser: one component for single-book and multi-book modes
- [ ] URL-based routing: `/bookshelf?book=`, `/bookshelf?books=`, `/bookshelf?collection=`, `/bookshelf?hearted=true`
- [ ] SemanticSearchPanel: three search modes (Any/Together/Separate), scope toggle (Passages/Insights/Both), results by relevance or book, .md export
- [ ] `useSemanticSearch()` hook available app-wide
- [ ] "Search inside all books" fallback on library page when text search returns no results
- [ ] Apply This section: Discuss Book, Study Guide (single-book only). Discuss FAB on desktop.
- [ ] Study guide generation: child picker, detail level (Brief/Standard/Detailed), Archives context personalization
- [ ] Study guide audience selector: toggle between Original and child versions
- [ ] Study guide sharing: "Share with [Child]" toggle, child sees only their version
- [ ] `bookshelf-study-guide` Edge Function (Haiku)
- [ ] `bookshelf-key-points` Edge Function (Haiku, fallback refresh)
- [ ] Desktop sidebar with chapter tree, recently viewed, quick-switch
- [ ] Mobile chapter jump FAB with bottom sheet and scroll spy
- [ ] Sticky section headers with background color
- [ ] "Continue Where You Left Off" banner with full state restoration
- [ ] Library sort (7 options), layout toggle (grid/compact), group mode (folder/all)
- [ ] `last_viewed_at` tracking on `bookshelf_items`
- [ ] Content type visual system: left border colors, type icons, type badges
- [ ] All session storage persistence for scroll position, tab state, abridged state
- [ ] Rhythms resurfacing data available (card component wired when PRD-18 is built)

### Post-MVP

- [ ] PWA shortcuts for BookShelf
- [ ] Per-member `last_viewed_at` tracking (junction table)
- [ ] "Generate Tracker" button in Apply section (when tracker infrastructure supports it)
- [ ] Study guide for generic age ranges without specific child context

---

## CLAUDE.md Additions from This Addendum

- [ ] Key points are set DURING extraction (Sonnet flags `is_key_point`), not as a separate post-extraction pass. The `bookshelf-key-points` Edge Function exists only as a fallback refresh.
- [ ] Abridged mode is the default browsing experience. Sections never disappear — fallback to first 2 items. Per-section "See more" expansion is independent.
- [ ] ExtractionBrowser is ONE component that handles single-book (`bookIds.length === 1`) and multi-book modes. Do not create separate components for these views.
- [ ] `ExtractionItem` and `ExtractionSection` are shared sub-components used by ExtractionBrowser, SemanticSearchPanel, Rhythms resurfacing, and any future consumer. Do not duplicate rendering logic.
- [ ] SemanticSearchPanel is app-wide via `useSemanticSearch()` hook. It is NOT a BookShelf-specific component. Any feature can open it.
- [ ] `audience` column on all five extraction tables. Default 'original'. Study guide versions use 'study_guide_{memberId}'. ALL extraction queries must include `audience` filter (typically `WHERE audience = 'original'` for adult views).
- [ ] Study guides are Haiku rewrites of existing key points — never re-extract from raw book text. Cost ~$0.01-0.02/book/child.
- [ ] Apply section has only two buttons: Discuss Book and Study Guide. Generate Goals/Questions/Tasks buttons are NOT needed — per-item routing buttons handle this. Refresh Key Points button is NOT needed — key points are set during extraction.

---

*End of PRD-23 Session Addendum*
