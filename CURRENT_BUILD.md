# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: ACTIVE — PRD-25 Guided Dashboard (Phase A)

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

---
