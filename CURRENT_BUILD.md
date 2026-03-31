# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: ACTIVE — PRD-14D Family Hub (Phase A, gaps being addressed)

---

# Build A: PRD-14D Family Hub (Phase A)

### PRD Files
- `prds/dashboards/PRD-14D-Family-Hub.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-14D-Family-Hub.md`

### Build Spec
Founder-provided build spec with updated design decisions (Hub Mode kiosk pattern, simplified countdowns, hub_text_card widget). Build spec decisions override PRD where they differ.

---

### Pre-Build Summary

#### Context
Family Hub is the shared family coordination surface — "our space" — the digital kitchen bulletin board. Currently a stub page at `src/pages/Hub.tsx` with placeholder widget cards. PRD-14D replaces this with the full Hub: configurable sections (calendar, Family Best Intentions, countdowns, widget grid), Hub Mode kiosk lock for shared devices, member quick access with PIN auth, and a slideshow frame (Phase B).

The perspective switcher already shows Hub tab for Mom, Dad, and Teen (PRD-14 session). But currently it navigates to `/hub` instead of rendering inline — must be fixed.

#### Dependencies Already Built
- PerspectiveSwitcher with Hub tab for all adult/teen roles (PRD-14 session)
- Hub stub page at `src/pages/Hub.tsx` (replacement target)
- CalendarWidget with `memberIds` prop (PRD-14B/14C)
- MemberPillSelector shared component (PRD-14C)
- ViewAsModal with PIN → full shell modal pattern (PRD-14)
- useActedBy hook for write attribution (PRD-14)
- DashboardGrid for widget rendering (PRD-10)
- Widget Picker + Configuration modals (PRD-10)
- Best Intentions personal system (PRD-06)
- UniversalQueueModal (PRD-14B)
- Tasks infrastructure including opportunities (PRD-09A)

#### Dependencies NOT Yet Built
- `family_hub_configs` table (needs migration)
- `family_best_intentions` table (needs migration)
- `family_intention_iterations` table (needs migration)
- `countdowns` table (needs migration)
- `calendar_events.show_on_hub` column (needs migration)
- Hub Mode kiosk pattern (new)
- Hub text card widget type (new)
- Hub Job Board widget type (new)

#### Build Items (Phase A — 13 items)

**1. Migration: 4 new tables + 1 column + feature keys**
- `family_hub_configs` — per-family UNIQUE. hub_title, theme_override, section_order, section_visibility, victory_settings, slideshow_config (Phase B), tv_config (PRD-14E), hub_pin (hashed). RLS: all family SELECT, primary_parent CRUD.
- `family_best_intentions` — family-level intentions with title, description, participating_member_ids, require_pin_to_tally, is_active, is_included_in_ai, sort_order, archived_at. RLS: all family SELECT, primary_parent CRUD.
- `family_intention_iterations` — one row per tally tap. intention_id, member_id, day_date. RLS: all family SELECT, members INSERT own.
- `countdowns` — title, emoji, target_date, show_on_target_day, is_active, recurring_annually. RLS: all family SELECT, primary_parent CRUD.
- `calendar_events.show_on_hub` BOOLEAN DEFAULT true NOT NULL
- Feature keys: `family_hub`, `family_hub_best_intentions`, `family_hub_slideshow`, `family_hub_tv_route`

**2. `useFamilyHubConfig` hook**
- CRUD on `family_hub_configs`. Auto-create default on first access (upsert).
- Also auto-create `dashboard_configs` row with `dashboard_type = 'family_hub'` for widget grid.
- Default section order: ['family_calendar', 'family_best_intentions', 'victories_summary', 'countdowns', 'widget_grid', 'member_access']

**3. Family Best Intentions system**
- `useFamilyBestIntentions` — CRUD for family intentions (mom only creates)
- `useFamilyIntentionIterations` — insert tallies, query today's counts per member
- Hub display: intention cards with member avatar row, per-member tally badges, family total
- Tap avatar → logs tally (optimistic). PIN prompt if `require_pin_to_tally = true`.
- Auto-deploy `info_family_intention` widget to participating members' personal dashboards
- Management UI in Hub Settings: list, create, edit, archive

**4. Countdowns section**
- Display countdown cards sorted by nearest date. Title + emoji + "X days" + target date.
- Auto-hide after target date. "Today is the day!" option.
- Simple table (no scope/assignment — deferred to PRD-10 widget enhancements).

**5. FamilyHub main component**
- `context: 'standalone' | 'tab'` prop for dual rendering
- Standalone: full viewport, no shell chrome, Hub header with title + frame toggle (disabled Phase A) + settings gear + lock icon
- Tab: inline in dashboard, no member access section, settings via gear in content area
- Section renderer: loop section_order, check visibility, render registered components
- Sections NOT collapsible (unlike Personal Dashboard)
- Hub Mode: localStorage persistence, Hub PIN to activate/exit, locks UI to Hub only

**6. Hub text card widget + Job Board widget**
- `hub_text_card` — mom-titled editable text card. Can have multiples. NOT a "dinner" widget specifically.
- `hub_job_board` — read-only list of opportunity tasks with name + reward + claim status. No claim from Hub.
- `info_family_intention` — personal dashboard widget showing "You: X · Family: Y"
- `info_countdown` — personal dashboard countdown widget
- Register all in widget template catalog

**7. Member Quick Access (standalone route only)**
- Row of family member avatars/names at bottom. Lock icon on PIN-protected members.
- Tap → PIN prompt → near-full-screen shell modal → "Back to Hub" close button.
- Hidden on perspective tab view.

**8. Hub Settings (mom only)**
- Hub Appearance: title, theme override
- Hub Mode & Security: set/change Hub PIN (hashed)
- Section Visibility & Order: drag-to-reorder, eye toggle
- Family Best Intentions Management: CRUD
- Victory Settings: show count, include teens, celebrate PIN
- Calendar note about per-event "Hide from Hub"

**9. Fix Dashboard.tsx — render Hub inline**
- Remove navigation to `/hub` on Hub tab click (lines 49-55)
- Render `<FamilyHub context="tab" />` inline like FamilyOverview
- Keep `/hub` standalone route as separate entry point

**10. Add show_on_hub toggle to EventCreationModal**
- Simple "Hide from Hub" toggle in event creation/edit flow
- Default: visible (true). Toggle sets `show_on_hub = false`.

**11. Register /hub/tv route with PlannedExpansionCard**
- Add route in App.tsx
- Show PlannedExpansionCard for `family_hub_tv_route`

**12. Long-press edit mode (permission-gated)**
- Long-press on Hub surface enters edit mode: sections reorderable, visibility toggleable, widget grid edit
- Permission-gated: only mom or members with Hub CRUD permission
- Disabled in Hub Mode on shared device (kids can't edit)

**13. TypeScript check**
- `npx tsc --noEmit` — zero errors before declaring complete

### Stubs (NOT Building Phase A)
- Victories summary section — "Coming soon" with Trophy icon (PRD-11 dependency)
- Celebrate button — visible but disabled (PRD-11B dependency)
- Family Vision section — hidden entirely (PRD-12B dependency)
- Slideshow frame overlay — Phase B
- Slideshow slides table — Phase B
- TV Mode rendering — PRD-14E
- Special Adult shift-scoped Hub access — deferred to PRD-27
- Countdown push to personal dashboards — deferred to PRD-10 widget enhancements
- Countdown scope/assignment (hub_only/whole_family/specific_members) — deferred to PRD-10
- Structured meal plan widget — future PRD
- Family Check-In LiLa guided mode — future PRD

### Key Decisions
1. **Hub renders inline on perspective tab** — does NOT navigate to `/hub`. Fix existing code.
2. **Hub Mode is a kiosk lock** — Hub PIN to activate, localStorage persistence, PWA support.
3. **`hub_text_card` is a general widget type** — mom titles it. Can have multiples. No "dinner" widget.
4. **Sections NOT collapsible** — mom hides via settings, not collapse mid-view.
5. **Long-press edit mode is permission-gated** — mom or Hub CRUD permission only. Disabled in Hub Mode.
6. **Special Adult Hub access deferred** to PRD-27.
7. **Countdowns simplified** — no scope/assignment columns. Simple table.
8. **Family Best Intentions are a NEW table** — not extending personal `best_intentions`.
9. **All tally sources aggregate** — Hub, personal dashboard, any device → same table.
10. **Job Board is read-only on Hub** — claim requires personal shell auth.

---

# Build B: PRD-23 BookShelf — COMPLETED (Sessions A+B)

### PRD Files
- `prds/vault/PRD-23-BookShelf.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-23-Session-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-23-BookShelf.md` (to be created during pre-build)

### Build Spec
Founder-provided build spec for Session A: Library Mode + Pre-flight Wiring. Session scope covers route registration, sidebar nav, library page, collection CRUD, member settings, and pre-flight wiring for send-to targets.

---

### Pre-Build Summary

#### Context
BookShelf is the family's personal book wisdom library — upload books, extract structured knowledge (summaries, insights, declarations, action steps, questions), and route that wisdom into the platform (Guiding Stars, tasks, journal prompts, LiLa context). Migration 100059 is already complete with 16 BookShelf tables, 578 books, 89K extractions, and 147K embeddings loaded.

Session A builds the Library Mode (browsing, collections, settings) and pre-flight wiring for send-to targets. Session B (next session) builds ExtractionBrowser (reading mode), semantic search, and Journal Prompts page.

#### Dependencies Already Built
- Migration 100059 complete (16 BookShelf tables with data)
- 578 books loaded with extraction data
- Guiding Stars + Best Intentions system (PRD-06)
- Tasks infrastructure with TaskCreationModal (PRD-09A)
- Journal system (PRD-08)
- Sidebar navigation pattern (PRD-04)
- PermissionGate + useCanAccess (PRD-02/31)
- ModalV2 shared component
- Density system + design system conventions

#### Dependencies NOT Yet Built (Pre-flight checks needed)
- `guiding_stars.source` + `guiding_stars.source_reference_id` columns (verify/add)
- `best_intentions.source` + `best_intentions.source_reference_id` columns (verify/add)
- TaskCreationModal `source` prop support (verify/extend)
- BookShelf extraction send-to tracking columns on declarations, action_steps, questions (verify/add)
- `bookshelf_member_settings` library preference columns (verify/add)

#### Build Items (Session A — 9 items + pre-flight)

**0. Pre-flight: Verify/add missing DB columns**
- Check `guiding_stars` for `source TEXT`, `source_reference_id UUID`
- Check `best_intentions` for `source TEXT`, `source_reference_id UUID`
- Check `bookshelf_declarations` for `sent_to_guiding_stars`, `guiding_star_id`
- Check `bookshelf_action_steps` for `sent_to_tasks`, `task_id`
- Check `bookshelf_questions` for `sent_to_prompts`, `journal_prompt_id`, `sent_to_tasks`, `task_id`
- Check `bookshelf_member_settings` for `library_sort`, `library_layout`, `library_group_mode`, `resurfaced_item_ids`
- Check TaskCreationModal for `defaultTitle`, `defaultDescription`, `source`, `sourceReferenceId` props
- Single migration if any columns missing

**1. Route registration**
- `/bookshelf` in App.tsx
- URL params for reading mode: `?book=<id>`, `?books=<ids>`, `?collection=<id>`, `?hearted=true`
- Reading mode renders placeholder in Session A (Session B builds ExtractionBrowser)

**2. Sidebar navigation**
- BookShelf nav item with Library icon
- PermissionGate with `bookshelf_basic`
- Visible in Mom, Adult, Independent shells only

**3. BookShelfPage shell**
- Detects reading mode vs library mode from URL params
- Library mode → BookShelfLibrary component
- Reading mode → ReadingModePlaceholder (Session A)

**4. BookShelfLibrary component**
- Search bar (client-side filter, debounced 300ms)
- Sort dropdown (7 options)
- Layout toggle (grid/compact, persisted)
- Group mode toggle (by folder/all books, persisted)
- Multi-select with floating action bar
- "Continue Where You Left Off" banner (sessionStorage)

**5. BookCard component**
- Grid variant (card) and compact list variant (row)
- Status badges, file type badge, tag chips
- Multi-select checkbox
- Multi-part book indicator
- Click → navigate to reading mode

**6. Hooks: useBookShelf, useBookShelfSettings**
- useBookShelf: fetch books, CRUD operations, derived data
- useBookShelfSettings: read/write member settings with upsert

**7. Collection management (full CRUD)**
- useBookShelfCollections hook
- CollectionSidebar (desktop) / CollectionPanel (mobile)
- CollectionModal (create/edit with book selector)
- CollectionQuickPicker (add-to-collection from card/multi-select)
- Drag-to-reorder within collections

**8. TypeScript types**
- `src/types/bookshelf.ts` — all BookShelf types matching DB schema
- Extraction types defined now for Session B use

**9. TypeScript check**
- `npx tsc --noEmit` — zero errors before declaring complete

### Stubs (NOT Building Session A)
- ExtractionBrowser / reading mode (Session B)
- Semantic search (Session B)
- "Refresh All Key Points" button (Session B)
- Journal Prompts page (Session B)
- Go Deeper AI extraction (future session)
- Book upload flow (future session — books already loaded via migration)
- LiLa BookShelf discussion mode (future session)
- BookShelf-to-Archive routing (future session)

### Key Decisions
1. **Route is `/bookshelf`** — standalone, NOT under `/vault`
2. **Session A = Library Mode only** — reading mode is a placeholder
3. **578 books already loaded** — no upload flow needed this session
4. **Pre-flight wiring first** — verify/add send-to columns before building UI
5. **Collections are user-created groupings** — separate from folder_group
6. **Multi-select enables batch operations** — view extractions, add to collection
7. **Settings persisted to bookshelf_member_settings** — upsert on first access
8. **Reading mode params in URL** — supports deep linking and back navigation

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

---
