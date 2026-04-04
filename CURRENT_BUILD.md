# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: ACTIVE — PRD-25 Guided Dashboard (Phase A) + PRD-17B MindSweep + PRD-23 BookShelf Platform Library Phase 1

---

# Build C: PRD-25 Guided Dashboard (Phase A)

### PRD Files
- `prds/dashboards/PRD-25-Guided-Dashboard.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-25-Guided-Dashboard.md`

### Build Spec
`specs/PRD-25-Phase-A-Guided-Dashboard-Core-Spec.md` — Founder-provided implementation spec covering all Phase A build items.

---

### Pre-Build Summary

#### Context
Guided Dashboard is the dashboard experience for children aged 8-12 in the Guided shell. Currently, Guided members see the same Dashboard.tsx wrapped in GuidedShell, which provides a custom bottom nav and simplified header. PRD-25 replaces this with a purpose-built GuidedDashboard with 7 sections, the Next Best Thing suggestion engine, Best Intentions for Guided members, and Mom's Dashboard Management screen.

GuidedShell already exists (`src/components/shells/GuidedShell.tsx`) with its own custom bottom nav (hardcoded navItems, NOT using shared BottomNav.tsx). The shell wraps all Guided member pages including `/dashboard`.

#### Dependencies Already Built
- GuidedShell with custom bottom nav (PRD-04)
- Dashboard.tsx with data-driven section system via dashboard_configs.layout.sections (PRD-14)
- Best Intentions hooks: useBestIntentions with full CRUD + useLogIteration (PRD-06)
- Tasks hooks: useTasks with 12 view formats, useCompleteTask (PRD-09A)
- CalendarWidget (PRD-14B) — needs memberIds filter for self-only view
- DashboardGrid with canReorderOnly prop (PRD-10)
- Widget Picker + Configuration modals (PRD-10)
- FamilyMembers.tsx with dashboard_mode selector (PRD-22)
- Edge Function shared utilities: _shared/cors.ts, _shared/auth.ts, _shared/cost-logger.ts
- useActedBy hook for write attribution (PRD-14)
- useGuidingStars hook for greeting rotation (PRD-06)

#### Dependencies NOT Yet Built
- spelling_coaching_cache table (Phase A creates table, Phase B uses it)
- GuidedDashboard page component (new)
- NBT engine (new frontend computation)
- guided-nbt-glaze Edge Function (new)
- GuidedManagementScreen (new)
- Reading Support CSS infrastructure (new)

#### Build Items (Phase A — 12 items)

**1. Migration 00000000100077**
- `spelling_coaching_cache` table — global cache for spelling coaching explanations (Phase B usage)
- Verify best_intentions + intention_iterations have all needed columns (ADD COLUMN IF NOT EXISTS for safety)
- Feature keys: `guided_dashboard`, `guided_nbt`, `guided_best_intentions`, `guided_reading_support`, `guided_spelling_coaching`, `guided_reflections`, `guided_write_drawer`

**2. TypeScript types**
- `src/types/guided-dashboard.ts` — GuidedDashboardPreferences, GuidedSectionKey, NBTSuggestion, section defaults

**3. Hooks**
- `useGuidedDashboardConfig` — wraps dashboard_configs with Guided-specific defaults
- `useNBTEngine` — 7-level deterministic priority engine from task/intention data
- `useNBTGlaze` — calls guided-nbt-glaze Edge Function with session caching
- `useGuidedBestIntentions` — personal + family intentions for Guided member

**4. Section components (7)**
- GuidedGreetingSection — name + time greeting + Guiding Stars rotation + gamification indicators
- GuidedBestIntentionsSection — personal + family intentions, tap-to-celebrate, child creation
- NextBestThingCard — current suggestion + AI glaze + [Do This] + [Something Else]
- GuidedCalendarSection — self-only CalendarWidget in day view
- GuidedActiveTasksSection — Simple List / Now-Next-Optional, celebration animation
- GuidedWidgetGrid — canReorderOnly, no resize/delete/create
- CelebrateSection — stub with PlannedExpansionCard (PRD-11 dependency)

**5. GuidedDashboard page**
- Conditional render inside Dashboard.tsx when dashboard_mode='guided'
- Section renderer from dashboard_configs.layout.sections with Guided defaults
- Reading Support CSS class toggle

**6. GuidedShell bottom nav rename**
- Change "Journal" → "Write" in GuidedShell.tsx navItems array
- Phase A: still routes to `/journal`. Phase B: triggers Write drawer.

**7. GuidedManagementScreen**
- Section reorder/visibility (Greeting + NBT + Best Intentions unhideable)
- Feature toggles: Reading Support, Spelling Coaching
- Best Intentions CRUD for child
- child_can_create_best_intentions toggle
- Wire into FamilyMembers.tsx as "Manage Dashboard" button for guided members

**8. Edge Function: guided-nbt-glaze**
- Haiku-class model, authenticated, generates 10-20 word encouraging sentence
- Uses _shared/ utilities pattern
- Fallback: "Up next: [task title]"

**9. Reading Support CSS infrastructure**
- `.guided-reading-support` class with larger font + TTS icon visibility
- TTS via browser speechSynthesis API
- Speaker icons (Volume2) hidden by default, shown when enabled

**10. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building Phase A)
- Write drawer (3 tabs: Notepad, Messages, Reflections) — Phase B
- Spelling & Grammar Coaching UI — Phase B
- DailyCelebration Reflections step — Phase C (PRD-11 dependency)
- LiLa Homework Help modal — Future (PRD-05 guided modes)
- LiLa Communication Coach modal — Future (PRD-05 guided modes)
- Victory Recorder integration — Future (PRD-11)
- Visual World theme skinning — Future (PRD-24A)
- Gamification pipeline — Future (PRD-24)
- Before-send message coaching — Future (PRD-15)
- Graduation flow (Guided → Independent) — Post-MVP

### Key Decisions
1. **No separate route** — GuidedDashboard renders conditionally inside Dashboard.tsx based on dashboard_mode='guided'
2. **GuidedShell's own bottom nav modified directly** — not shared BottomNav.tsx
3. **Reuse existing useBestIntentions** — no new hooks for personal intentions
4. **NBT is frontend-only computation** — no database table, no server logic
5. **Gamification indicators are visual stubs** — read from family_members columns
6. **Reading Support is CSS-only** — no backend, uses browser speechSynthesis
7. **spelling_coaching_cache table created but unused in Phase A**
8. **Management screen in FamilyMembers.tsx** — opens as modal for guided members
9. **Unhideable sections: Greeting, Next Best Thing, Best Intentions** — mom cannot hide these

---

# Build D: PRD-17 Universal Queue & Routing System (Gap-Fill) — COMPLETED

### PRD Files
- `prds/communication/PRD-17-Universal-Queue-Routing-System.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`

---

### Pre-Build Summary

#### Context
PRD-17 is the central routing infrastructure — the "sorting station" where items from brain dumps, meetings, LiLa, kid requests, and goals land in one unified inbox. Mom opens the Review Queue modal, processes everything, closes it. This is critical infrastructure that PRD-17B (MindSweep) sits directly on top of.

**~75% of PRD-17 was already built** across earlier phases (PRD-14B, PRD-09A, PRD-08, PRD-14C). This session fills the remaining gaps to make the queue fully functional before MindSweep.

#### Dependencies Already Built
- UniversalQueueModal with 3 tabs, badge counts, "All caught up!" state
- SortTab with studio_queue items, QueueCard, BatchCard (Send as Group / Process All / Expand / Dismiss)
- RoutingStrip with 15+ destinations, context filtering, sub-destination drill-down
- BreathingGlow presence indicator component
- studio_queue table with full PRD-17 schema, RLS, indexes
- useStudioQueue hooks (items, count, batched, role-scoped)
- TaskCreationModal Quick Mode / Full Mode toggle with pre-population
- RoutingToastProvider with 5-second undo
- TaskRouteHandler (notepad → studio_queue)
- PendingItemsBar entry point (Family Overview)
- Feature keys registered (studio_queue, queue_modal, queue_quick_mode, routing_strip, queue_batch_processing)
- Badge style preference (glow/numeric, localStorage)
- RequestsTab stub with empty state (PRD-15 dependency)
- EventCreationModal for calendar event editing (PRD-14B)

#### Dependencies NOT Yet Built
- PRD-15 (Messages, Requests & Notifications) — RequestsTab stays stub
- PRD-16 (Meetings) — meeting_action source stays stub
- PRD-17B (MindSweep) — columns/sources not added yet

#### Build Items (Gap-Fill — 7 items)

**1. QuickTasks "Review Queue" click → opens modal**
- Change the indicator click handler from "toggle mode" to "open UniversalQueueModal"
- QuickTasks needs to import and render UniversalQueueModal
- BreathingGlow on the Inbox icon when any tab has pending items
- When modal is open, indicator remains visible but non-interactive
- Mode toggle (glow/numeric) moves to long-press or is removed (toggle exists in PendingItemsBar already)

**2. CalendarTab wired to real pending events**
- Query `calendar_events WHERE status='pending' AND family_id = currentFamilyId`
- Render approval cards with: event title, date/time, location, submitter (avatar + name via created_by)
- Transportation needs indicator if applicable
- Source indicator if from image/Route
- **Approve** — sage teal bg, sets status='approved', approved_by, approved_at
- **Edit & Approve** — soft gold bg, opens EventCreationModal in edit mode, saves as approved
- **Reject** — light blush bg, dropdown with optional rejection note, sets status='rejected'
- **Approve all (N)** — gradient button at bottom when N > 1
- Empty state: CalendarCheck icon + "No events waiting for approval."
- All colors from theme tokens

**3. List picker from Sort tab**
- When a studio_queue item has `destination='list'`, the [Add to list] button opens a list picker overlay
- List picker shows: existing family lists (filtered by owner), option to create new list
- On selection: add item content as `list_items` record in chosen list, set `studio_queue.processed_at`
- For batch items with destination='list': "Send as Group" adds all items to the same list
- Critical for MindSweep readiness — shopping items need clean list routing

**4. Dashboard queue indicator**
- Add a queue pending indicator somewhere visible on Dashboard (personal view)
- Breathing glow or badge that opens UniversalQueueModal on click
- Only visible to mom/primary_parent (and permitted additional_adults)
- Uses useStudioQueueCount + pending calendar events count

**5. Tasks page queue badge**
- Add badge indicator on Tasks page that opens modal to Sort tab
- Shows count of pending studio_queue items
- Breathing glow when items exist

**6. Calendar page queue badge**
- Add badge indicator on Calendar page that opens modal to Calendar tab
- Shows count of pending calendar events
- Breathing glow when events await approval

**7. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building This Phase)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Notification creation on approve/reject (PRD-15 not built)
- Settings page badge preference toggle (PRD-22)
- Widget/Tracker creation from Sort tab (PRD-10 stubs already in place)
- Goal decomposition → studio_queue (future PRD)
- LiLa destination suggestion hints on queue cards (post-MVP)
- Real-time concurrent processing indicators (post-MVP)
- MindSweep columns/sources/tile (PRD-17B — do not add yet)
- RequestsTab full implementation (PRD-15 — stub already correct)
- Keyboard shortcuts / swipe gestures (post-MVP)

### Key Decisions
1. **QuickTasks click = open modal** — this is the #1 priority. Mom's primary daily entry point.
2. **CalendarTab connects to existing EventCreationModal** for "Edit & Approve" — no new modal.
3. **List picker is essential for MindSweep readiness** — shopping items need list routing, not task routing.
4. **No new migration needed** — all tables and columns already exist.
5. **Stubs stay stubs** — RequestsTab, notification auto-dismiss, MindSweep columns are all correctly deferred.
6. **BreathingGlow already works** — just needs to be connected to more entry points.

---

# Build E: PRD-17B MindSweep

### PRD Files
- `prds/communication/PRD-17B-MindSweep.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17B-MindSweep.md`

---

### Pre-Build Summary

#### Context
MindSweep is the AI auto-sort intelligence layer that sits on top of the Universal Queue & Routing System (PRD-17, just completed — 30 wired, 7 stubbed, 0 missing, 24 E2E tests passing). It is a **mode**, not a separate feature. It adds automatic extraction, classification, confidence scoring, and routing to the existing Notepad -> Review & Route -> Queue pipeline. Three routing paradigms now exist: "Send to" (manual), "Review & Route" (semi-manual), "MindSweep" (automatic).

MindSweep also introduces external intake channels: quick-capture PWA at `/sweep`, share-to-app, and email forwarding (email delivery stubbed — requires DNS setup).

This is a competitive differentiator against Jam Family Calendar's "Jaime" which routes to 3 destinations. MindSweep routes to 15+ destinations with configurable intelligence, sensitivity rules, cross-member detection, and learning patterns.

#### Infrastructure Already Built
- **PRD-17 (Universal Queue)** — FULLY BUILT: UniversalQueueModal, SortTab, QueueCard, BatchCard, RoutingStrip (15+ destinations), ListPickerModal, TaskCreationModal, BreathingGlow, RoutingToastProvider, useStudioQueue hooks, QueueBadge on Dashboard/Tasks/Calendar, QuickTasks modal trigger
- **studio_queue table** — Full schema with RLS, indexes. Already has `mindsweep_confidence` + `mindsweep_event_id` columns. `source` field has no CHECK constraint (free text).
- **families table** — Already has `sweep_email_address` + `sweep_email_enabled` columns (migration 00000000000001)
- **pgvector infrastructure** — FULLY BUILT: `embed` Edge Function (processes 13+ tables), `queue_embedding_job()` trigger, pgmq `embedding_jobs` queue, halfvec(1536) with HNSW indexes on 14 tables, `match_bookshelf_chunks()` + `match_bookshelf_extractions()` RPCs, OpenAI text-embedding-3-small
- **whisper-transcribe** — Edge Function exists, processes audio via OpenAI Whisper
- **useVoiceInput hook** — Exists with MediaRecorder + Web Speech API + Whisper fallback
- **Vision OCR** — Pattern exists in bookshelf-process (Claude Haiku via OpenRouter for image text extraction)
- **All routing destinations** — Tasks, Lists (10 types), Calendar, Journal, Victory Recorder, Guiding Stars, Best Intentions, Archives, InnerWorkings, Backburner, Ideas
- **context-assembler.ts** — Three-layer relevance-filtered context assembly in `_shared/`
- **cost-logger.ts** — AI cost tracking utility in `_shared/`
- **QuickTasks MindSweep button** — Already defined (Brain icon, routes to `/sweep`)
- **QuickCreate MindSweep action** — Already defined (routes to `/sweep`)
- **Types** — `mindsweep_confidence` already typed in `src/types/tasks.ts`

#### Dependencies NOT Yet Built
- PRD-15 (Messages/Notifications) — cross-member notification creation stubbed
- PRD-16 (Meetings) — "MindSweep All" stubbed
- PRD-18 (Rhythms) — MindSweep Digest rendering stubbed (register section type only)
- PRD-33 (PWA/Offline) — full offline sync stubbed (basic IndexedDB capture for /sweep fine)

#### What's Now Built (Sprint 1+2, 2026-04-03)
- `/sweep` route in App.tsx (ProtectedRouteNoShell)
- `MindSweepCapture.tsx` page — text, voice, scan (ScanLine → Haiku vision OCR), link (URL → Haiku summarize), holding queue UI, settings panel (5 sections)
- `mindsweep-sort` Edge Function — embedding-first + Haiku LLM batch classification, sensitivity rules, cross-member detection
- `mindsweep-scan` Edge Function — 2 modes: `scan` (image → text via Haiku vision) and `link` (URL → summarized text)
- MindSweep tile on RoutingStrip wired to sweep pipeline (NotepadDrawer intercepts `destination === 'mindsweep'`)
- Processing overlay in NotepadDrawer + status display on /sweep
- `useRunSweep` shared hook — used by both NotepadDrawer and MindSweepCapture
- `useDeleteHolding` + `useMarkHoldingProcessed` mutations with cache invalidation
- `useSweepStatus` with 8-second auto-reset timer
- `routeSweepResults` concurrent inserts via Promise.all
- `useVoiceInput` — `forceHighAccuracy` option + <30s Web Speech API shortcut (skip Whisper for short recordings)
- `UndoToast` / `RoutingToastProvider` — `onUndo` made optional for MindSweep confirmation toasts
- Confidence badge on QueueCard for MindSweep-originated items
- 11 Playwright E2E tests passing
- `tsc -b` zero errors

#### Sub-Phase Plan (3 phases)

**Phase A: Data layer + mindsweep-sort Edge Function + RoutingStrip tile**
1. Migration `00000000100089_mindsweep_tables.sql` — 5 new tables with RLS + indexes + feature keys + classify_by_embedding RPC
2. TypeScript types: `src/types/mindsweep.ts`
3. `mindsweep-sort` Edge Function — embedding-first classification + Haiku LLM fallback + sensitivity rules + cross-member detection + recipe/travel detection
4. MindSweep tile on RoutingStrip — Wand2 icon, sends content through `mindsweep-sort`, handles results per aggressiveness mode
5. Processing indicator + confirmation toast
6. Confidence badge on QueueCard for MindSweep-originated items
7. `useMindSweep` hook — settings, sweep trigger, holding queue management
8. TypeScript check: `tsc -b` zero errors

**Phase B: Quick-capture PWA + voice + scan + holding queue**
1. ~~`/sweep` route in App.tsx~~ DONE (Sprint 1)
2. ~~`MindSweepCapture.tsx` page component — text, voice, scan, link~~ DONE (Sprint 1+2)
3. ~~Voice optimization: Web Speech API for <30s, Whisper for 30s+~~ DONE (Sprint 2)
4. ~~Scan: vision model OCR — image NOT stored, text extraction only~~ DONE (Sprint 2)
5. ~~Link capture: URL fetch + summarize~~ DONE (Sprint 2)
6. ~~Holding queue UI: item count, [Sweep All], [Save for Later]~~ DONE (Sprint 2)
7. Auto-sweep: pg_cron job at configured time — NOT YET
8. Share-to-app via Web Share Target API — NOT YET (investigate PWA setup)
9. PWA manifest for `/sweep` (distinct icon) — NOT YET (investigate PWA setup)
10. Basic IndexedDB offline capture — NOT YET
11. ~~QuickTasks MindSweep button opens quick-capture~~ DONE (already wired)
12. ~~TypeScript check~~ DONE

**Phase C: Settings + email stub + polish**
1. MindSweep Settings screen — 8 sections (auto-sort mode, always-review rules, processing schedule, voice, scanning info, external intake, home screen, digest)
2. Email forwarding UI (display address, allowed senders management) — delivery stubbed
3. `mindsweep-email-intake` Edge Function code (ready to enable when DNS configured)
4. Approval pattern data collection (record actions to `mindsweep_approval_patterns`)
5. Feature keys + `useCanAccess()` wiring
6. MindSweep Digest section type #28 registered (stub renderer)
7. TypeScript check
8. Post-build PRD verification

### Stubs (NOT Building Any Phase)
- Approval pattern LEARNING recommendations (Phase 2)
- Weekly MindSweep intelligence report (Phase 2)
- Email forwarding DELIVERY infrastructure (DNS + webhook)
- MindSweep onboarding prompt (add to home screen during onboarding)
- MindSweep Digest RENDERING in rhythms (PRD-18 not built)
- "MindSweep All" on meeting post-processing (PRD-16 not built)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Cross-member routing notification creation (PRD-15 not built)
- Proactive capture prompts
- MindSweep dashboard widget
- Seasonal content capture suggestions
- SMS intake channel
- Full offline sync (PRD-33 scope)

### Key Decisions
1. **Embedding-first classification is viable** — pgvector infrastructure fully built (14 tables with embeddings, `embed` Edge Function, HNSW indexes). Need new `classify_by_embedding()` RPC to compare MindSweep items against existing family content.
2. **5 mindsweep tables need creation** — none exist in live DB. Migration 00000000100089.
3. **studio_queue columns already exist** — mindsweep_confidence + mindsweep_event_id already in migration 00000000000008. No ALTER needed.
4. **families sweep columns already exist** — sweep_email_address + sweep_email_enabled in migration 00000000000001. No ALTER needed.
5. **Vision OCR reuses bookshelf-process pattern** — Claude Haiku via OpenRouter for image text extraction. Extract into shared utility or inline in mindsweep-sort.
6. **Voice optimization wraps existing useVoiceInput** — add <30s Web Speech API shortcut before Whisper.
7. **Non-queue destinations route directly** — Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives, InnerWorkings create records directly. Tasks, Lists go through studio_queue.
8. **3 sub-phases** — A (data + Edge Function + RoutingStrip), B (PWA + voice + scan + holding), C (settings + email + polish).

---

# Build F: PRD-23 BookShelf Platform Library (Phase 1: Schema + Data Migration)

### PRD Files
- `prds/ai-vault/PRD-23-BookShelf.md` (full PRD)
- `specs/BookShelf-Platform-Library-Phase1-Spec.md` (founder-approved architecture spec)

### Addenda Read
- `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-23-Session-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1.md`

---

### Pre-Build Summary

#### Context
BookShelf currently stores chunks, embeddings, and extractions at the family level — 5 separate extraction tables each with `family_id` and `family_member_id`. Every family uploading the same book pays full AI cost again (~$1-2/book). The correct architecture: books, chunks, and extractions live at the platform level in `platform_intelligence`. Personal state (hearts, notes) moves to `bookshelf_user_state`, created on-demand per member.

This is Phase 1 of 5: database-only. Create new tables, migrate existing data, set up RLS, update RPCs. No Edge Function or frontend changes.

#### Current Data State (Verified from live DB 2026-04-03)

| Table | Rows | Notes |
|---|---|---|
| bookshelf_items (total) | 559 | 348 standalone + 33 parents + 178 child parts |
| bookshelf_items (extracted) | 228 | extraction_status='completed' |
| bookshelf_items (chunked only) | 331 | extraction_status='none' |
| bookshelf_chunks | 58,115 | Platform-level via book_cache_id |
| bookshelf_summaries | 21,538 | 2 hearted |
| bookshelf_insights | 23,977 | 7 hearted |
| bookshelf_declarations | 16,931 | 4 hearted |
| bookshelf_action_steps | 16,134 | 0 hearted |
| bookshelf_questions | 9,894 | 0 hearted |
| platform_intelligence.book_cache | 578 | 19 more than bookshelf_items (orphans) |
| bookshelf_discussions | 4 | 9 messages |
| bookshelf_collections | 15 | 83 items |
| journal_prompts | 2 | |
| bookshelf_member_settings | 3 | |

- **Hearted items:** 13 total (0 user notes, 0 routing flags set)
- **book_cache_id:** populated for ALL 559 items (zero NULLs), 559 distinct values
- **Distinct families:** 1

#### Multi-Part Book Structure (33 parents, 178 children)

33 books were split into 2-9 parts during upload. Parent row has clean title + `part_count`. Child rows have `parent_bookshelf_item_id` + `part_number`. Each has its own unique `book_cache_id`.

**Chunk storage is inconsistent across multi-part books:**
- Some parents have chunks, children don't (e.g., Critical Thinking: 361 parent chunks)
- Some have BOTH duplicated (e.g., Your Forces: 699 parent + 602 child)
- Some have neither (e.g., Actionable Gamification: 0 on both)
- **Extractions always live on CHILD items, not parents** (verified: parent has 0 summaries, child part 2 has 160)

**Founder-approved consolidation decision:** Each parent maps to ONE book_library entry. All child parts' chunks + extractions consolidate under the parent's book_library_id.

#### Dependencies Already Built
- `platform_intelligence.book_cache` table (578 rows, title_author_embedding, ethics_gate_status)
- `bookshelf_items` table (32 cols) with `book_cache_id` FK, `parent_bookshelf_item_id`, `part_number`, `part_count`
- `bookshelf_chunks` table (10 cols: id, book_cache_id, chunk_index, chunk_text, token_count, chapter_title, chapter_index, embedding, metadata, created_at)
- 5 extraction tables — routing columns only on declarations (sent_to_guiding_stars, guiding_star_id), action_steps (sent_to_tasks, task_id), questions (sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id). Summaries and insights have NO routing columns.
- `match_bookshelf_chunks` + `match_bookshelf_extractions` RPCs
- Embedding pipeline (util.queue_embedding_job triggers on all extraction tables)
- Study guide components + Edge Function stub (not affected by Phase 1)

#### Dependencies NOT Yet Built
- `platform_intelligence.book_library` (renamed from book_cache — this phase)
- `platform_intelligence.book_chunks` (new — this phase)
- `platform_intelligence.book_extractions` (new unified table — this phase)
- `bookshelf_user_state` (new — this phase)
- `match_book_chunks` + `match_book_extractions` RPCs (new — this phase)

#### Build Items (Phase 1 — 8 items)

**1. Migration 00000000100090_bookshelf_platform_library.sql**
- Rename `platform_intelligence.book_cache` → `platform_intelligence.book_library`
- Add columns: extraction_status, extraction_count, discovered_sections
- Create `platform_intelligence.book_chunks` (book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count)
- Create `platform_intelligence.book_extractions` unified table
  - extraction_type discriminator (summary/insight/declaration/action_step/question)
  - 3 text levels: text, guided_text, independent_text
  - Type-specific nullable columns: content_type, declaration_text, style_variant, value_name, richness
  - Flags: is_key_point, is_from_go_deeper, is_deleted, audience
- Create `bookshelf_user_state` (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai, routing flags, UNIQUE(member_id, extraction_id))
- Add `book_library_id` column to `bookshelf_items`
- RLS + indexes + HNSW embedding indexes + updated_at triggers

**2. Data migration: Link bookshelf_items → book_library (multi-part consolidation)**
- Standalone + parent items: `book_library_id = book_cache_id` (direct 1:1)
- Child parts: `book_library_id = parent's book_cache_id` (consolidate under parent)
- Covers ALL 559 items

**3. Data migration: Chunks to platform level**
- Copy bookshelf_chunks → platform_intelligence.book_chunks
- For multi-part children: remap book_cache_id → parent's book_library_id
- For multi-part chunk ordering: `(part_number * 10000) + chunk_index` preserves sequence
- Preserve embeddings (no re-embedding); disable trigger during bulk insert
- Column mapping: chunk_text → text, token_count → tokens_count, metadata dropped

**4. Data migration: Extractions to platform level**
- Consolidate 5 tables → platform_intelligence.book_extractions
- For multi-part children: remap via bookshelf_item → parent's book_library_id
- Map extraction_type from source table name
- Map type-specific columns (declaration_text, style_variant, value_name, richness)
- **CRITICAL:** Disable embedding triggers during bulk insert to avoid 88K re-embedding jobs

**5. Data migration: Personal state (13 hearted items)**
- Create bookshelf_user_state rows for all 13 hearted items
- Match old extraction rows → new book_extractions rows by text + section_title + extraction_type
- Preserve routing flags (all currently false/null but schema supports them)

**6. Update book_library extraction_status**
- Set extraction_status='completed' and extraction_count for books with extractions
- Multi-part parents: sum extraction counts across all child parts

**7. New RPCs: match_book_chunks + match_book_extractions**
- `match_book_chunks`: queries platform_intelligence.book_chunks, filtered by family's bookshelf_items.book_library_id
- `match_book_extractions`: queries platform_intelligence.book_extractions LEFT JOIN bookshelf_user_state for personal state

**8. Verification queries**
- Row count validation (chunks, extractions, user_state)
- Multi-part consolidation check (parent book_library entries have correct counts)
- RLS check (authenticated read, service write)
- RPC smoke test

### Stubs (NOT Building This Phase)
- Edge Function changes (Phase 3)
- Frontend code changes (Phase 2)
- Old table drops (Phase 4)
- guided_text/independent_text generation (Phase 3 backfill)
- bookshelf-process cache hit/miss wiring (Phase 3)
- Multi-part chunk deduplication (Phase 4 cleanup)

### Key Decisions
1. **Multi-part consolidation** — 33 parent books each map to ONE book_library entry. 178 child parts' chunks + extractions consolidate under parent's book_library_id. Chunk ordering preserved via `(part_number * 10000) + chunk_index`.
2. **Add book_library_id, keep book_cache_id** — new column for new RPCs, old column stays for backward compat. Phase 4 drops book_cache_id.
3. **Copy chunks to new PI table** — HNSW indexes can't be built on views. ~175MB temporary duplication until Phase 4.
4. **Disable embedding triggers during bulk migration** — 88K extractions + 58K chunks would overwhelm queue. Existing embeddings copied directly.
5. **Column name mapping** — bookshelf_chunks.chunk_text → book_chunks.text, token_count → tokens_count, metadata dropped.
6. **Old tables stay functional** — no drops, no FK changes. Frontend continues on old tables until Phase 2.
7. **bookshelf_user_state on-demand only** — 13 rows created for hearted items; future hearts create rows on demand.

---

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

*Bug fixes (View As modal, Hub navigation, Notepad close) completed 2026-03-25. No new stubs.*

*PRD-21A (AI Vault Browse & Content Delivery) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. 88 requirements: 74 wired, 14 stubbed, 0 missing. 12 new tables, 3 content items loaded, sidebar simplified to Lucide icons.*

*PRD-21 (Communication & Relationship Tools) completed 2026-03-26. Verification archived to `claude/feature-decisions/PRD-21-Communication-Relationship-Tools.md`. 42 requirements: 32 wired, 10 stubbed, 0 missing. 8 Edge Functions deployed, 4 new tables, AI Toolbox sidebar + QuickTasks buttons, 198 condensed intelligence items powering system prompts.*

*PRD-34 (ThoughtSift — Decision & Thinking Tools) completed 2026-03-26. 3 sub-phases: 34A (Foundation + Translator + Decision Guide), 34B (Perspective Shifter + Mediator), 34C (Board of Directors). 6 tables, 5 Edge Functions, 18 personas + 17 lenses + 15 frameworks seeded, 5 vault items. Total: 129 wired, 22 stubbed, 0 missing across all sub-phases.*

*UX Overhaul Sessions 1-5 completed 2026-03-28. Density system, ModalV2, hardcoded color audit, QuickCreate FAB, calendar visual overhaul, DateDetailModal, calendar settings, tooltip conversion, list task type, tracker quick-create, element size preference.*

*PRD-14 (Personal Dashboard Reconciliation) completed 2026-03-30. Verification archived to `claude/feature-decisions/PRD-14-Personal-Dashboard.md`. 42 requirements: 37 wired, 5 stubbed, 0 missing. Data-driven section system, Guiding Stars greeting rotation, starter widget auto-deploy, perspective switcher expansion (all roles), View As full shell modal with theme persistence, acted_by attribution on 3 tables, permission-gated member picker, feature exclusion enforcement. BookShelf + ThemeSelector added to Independent/Adult shells.*

*PRD-14C (Family Overview) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-14C-Family-Overview.md`. 20 wired, 8 stubbed (4 planned + 4 UX polish deferred), 0 missing. Per-member config, member pill selector, pending items bar, horizontally-scrollable member columns with 7 section types, dad's scoped view.*

*PRD-23 (BookShelf Sessions A+B) completed 2026-03-31. Verification archived to `claude/feature-decisions/PRD-23-BookShelf.md`. 44 wired, 0 stubbed, 0 missing. Session A: Library page, tag filter bar, 7 sort options, grid/compact layout, collection CRUD, multi-select, continue banner. Session B: 5-layer extraction browser, ExtractionBrowser with single/multi/collection/hearted modes, 5 specialized item components, ApplyThisSheet (8 destinations), SemanticSearchPanel, ChapterJumpOverlay, 2 Edge Functions (bookshelf-search, bookshelf-key-points), JournalPromptsPage, migration 100066 (vector search RPCs). 42 new files total.*

*PRD-23 (BookShelf Polish) completed 2026-04-01. Wired Search Library button, added History button to library, added action buttons to collection/multi-book view, removed Refresh Key Points (redundant). Fixed bookshelf-discuss: added missing discussion_type column, fixed model ID, fixed extraction query column name (user_id → family_member_id), added source honesty guardrail. Built `_shared/context-assembler.ts` — three-layer relevance-filtered context assembly module (first consumer: bookshelf-discuss). Added Layered-Context-Assembly-Spec.md for future Edge Function migrations. 5 Playwright tests with real API calls passing.*

*PRD-11 (Victory Recorder Phases 12A+12B+12C) completed 2026-04-02. Verification archived to `claude/feature-decisions/PRD-11-Victory-Recorder.md`. Phase 12A: core recording, browsing, celebration for adults/teens — VictoryRecorder page, RecordVictory modal, CelebrationModal, CelebrationArchive, celebrate-victory Edge Function, useVictories hook, activity log trigger. Phase 12B: intelligence layer — scan-activity-victories Edge Function, Victory Suggestions UI, CompletionNotePrompt, 4 activity log sources, Notepad victory routing, LiLa action chip, useVictoryReckoningContext hook. Phase 12C: DailyCelebration 5-step overlay for Guided/Play, SimplifiedRecordVictory for kids, ConfettiBurst + AnimatedList components, 15 voice personalities, VoiceSelector, useVoicePreference hook, celebrate-victory voice param + roleToMemberType bug fix, CelebrateSection + PlayShell Celebrate button wired. PRD-11B (Family Celebration) NOT built — separate future phase.*

*PRD-14D (Family Hub Phase A) completed 2026-04-03. 4 tables (family_hub_configs, family_best_intentions, family_intention_iterations, countdowns) + calendar_events.show_on_hub column. Hub Mode kiosk lock with PIN (hash_hub_pin + verify_hub_pin RPCs). Member Quick Access: PIN auth modal triggers ViewAs with privacy exclusions (Safe Harbor auto-excluded per PRD-20, private journals filtered). Hub Settings: full CRUD for intentions, countdowns, section order, Hub PIN. 2 personal dashboard widgets (info_family_intention, info_countdown) registered in widget catalog. ViewAs routing: 17 missing page routes added. Pre-existing TS errors fixed (QuickTasks, CalendarTab, Tasks). Remaining stubs: Slideshow (Phase B), TV Mode (PRD-14E), Family Vision section (PRD-12B), Special Adult shift-scoped access (PRD-27).*

*PRD-17 (Universal Queue & Routing — Gap-Fill) completed 2026-04-03. Verification archived to `claude/feature-decisions/PRD-17-Universal-Queue-Routing.md`. 30 wired, 7 stubbed, 0 missing. Gap-fill: QuickTasks opens modal, CalendarTab with Approve/Edit/Reject, ListPickerModal for list items, QueueBadge on Dashboard+Tasks+Calendar, calendar status bug fixed, Quick Mode schedule passthrough, shared task visibility, RoutingToastProvider on Adult/Independent shells. 24 Playwright E2E tests (Dad flows, teen access, honey-do pipeline).*

*PRD-17B MindSweep Sprint 1+2 completed 2026-04-03. Phase A (data layer, migration 100089, mindsweep-sort Edge Function, 5 tables, classify_by_embedding RPC, useMindSweep hooks, QueueCard confidence badges, RoutingStrip tile) + Phase B partial (MindSweepCapture page at /sweep with text/voice/scan/link/holding queue/settings, mindsweep-scan Edge Function for vision OCR + link summarization, useVoiceInput <30s Web Speech optimization, useRunSweep shared hook, UndoToast optional onUndo). /simplify review applied: stale closure fix, triplicated reset extraction, shared sweep runner, cache invalidation mutations, auto-reset timer, concurrent inserts, type cleanup. 11 Playwright E2E tests passing. Phase B remaining: auto-sweep pg_cron, share-to-app, PWA manifest, IndexedDB offline. Phase C not started.*

---
