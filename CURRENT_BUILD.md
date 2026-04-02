# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: ACTIVE — PRD-11 Victory Recorder (Phase 12C) + PRD-14D Family Hub (Phase A, gaps) + PRD-25 Guided Dashboard (Phase A)

---

# Build E: PRD-11 Victory Recorder (Phase 12C — DailyCelebration for Kids + Voice Personalities)

### PRD Files
- `prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md` (Screen 5 DailyCelebration, voice personalities, shell behavior, AI rules 9-12)
- `prds/dashboards/PRD-25-Guided-Dashboard.md` (Celebrate button, DailyCelebration integration, Step 2.5 Reflections)
- `prds/dashboards/PRD-26-Play-Dashboard.md` (giant Celebrate button, maximum delight, task tiles)

### Feature Decision File
`claude/feature-decisions/PRD-11-Victory-Recorder.md` (Phase 12A + 12B + 12C sections)

---

### Pre-Build Summary

#### Context
Phases 12A+12B built core recording/celebration for adults+teens and the intelligence layer. Phase 12C builds the kid-facing experience: DailyCelebration (5-step sequence for Guided/Play) plus voice personalities (15 text-style variations for ALL members).

#### Build Items (Phase 12C — 12 items, all complete)

1. **Fix + enhance celebrate-victory Edge Function** — Added `voice` param, fixed `roleToMemberType()` bug (was returning 'adult' for all members — now reads `dashboard_mode`), added 15 voice personality instructions to system prompt
2. **Voice personality types + constants** — `VoicePersonality` type (15 keys), `VOICE_PERSONALITIES` constant, `getDefaultVoice()`, voice on request type
3. **useVoicePreference hook** — Read/write `victory_voice_preferences` with shell-aware defaults
4. **VoiceSelector component** — Grid of 15 voices with labels, descriptions, sample lines
5. **DailyCelebration component** — 5-step full-screen overlay (opener, victories, streak stub, theme stub, close). Shell-aware: Play=maximum delight, Guided=moderate. Zero-victory warm path.
6. **SimplifiedRecordVictory** — Kid-friendly recording (description + category only)
7. **ConfettiBurst component** — Full-screen confetti, moderate/maximum intensity, CSS animations, reduced-motion
8. **AnimatedList component** — Staggered item reveals with configurable delay
9. **Wire CelebrateSection in GuidedDashboard** — Replaced stub with real gold gradient button launching overlay
10. **Wire Celebrate button in PlayShell** — Rewired from navigate to DailyCelebration overlay with bouncy pulse
11. **VoiceSelector on VictoryRecorder** — Collapsible voice picker for adults/teens
12. **TypeScript check** — `tsc -b` zero errors

### Key Decisions
1. DailyCelebration is a full-screen overlay, not a page navigation
2. Play mode = maximum delight (56px targets, confetti, bouncing text)
3. Guided mode = moderate (48px targets, clean animations, specific praise)
4. Steps 3+4 auto-skip (stubs for PRD-24 gamification)
5. Zero-victory path: greeting plays, encouraging message, manual entry, close
6. Voice affects text style only (no TTS audio for MVP)
7. All 15 voices available during beta
8. roleToMemberType() fixed — reads dashboard_mode for Haiku/Sonnet selection

### Stubs (NOT Building Phase 12C)
- Step 2.5 Reflections UI (PRD-25 Phase B)
- Step 3 streak data (PRD-24)
- Step 4 Visual World (PRD-24)
- "Share with Mom" notification push (PRD-15)
- Voice in Settings page (PRD-22)
- TTS audio (post-MVP)
- Family Celebration (PRD-11B)

---

# Build D: PRD-11 Victory Recorder (Phase 12B — Intelligence Layer & Cross-Feature Wiring)

### PRD Files
- `prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md` (full PRD — re-read for incoming flows, auto-routing, cross-feature sections)
- `prds/personal-growth/PRD-11B-Family-Celebration.md` (companion — read for awareness, NOT building)

### Addenda Read
- `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` (PRD-11 section: 15+ cross-PRD source enum values — already in types)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md` (Evening Rhythm reads victories, reflection_routed source)
- `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` (DailyCelebration Step 3/4 gamification data)
- `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md` (DailyCelebration Step 2.5 reflections)
- `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` (homeschool_logged source)
- `prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md` (plan_completed, milestone_completed sources)
- 17 other addenda reference PRD-11 — none contain overrides relevant to Phase 12B

### Feature Decision File
`claude/feature-decisions/PRD-11-Victory-Recorder.md` (Phase 12A decisions + Phase 12B additions)

### Build Spec
Founder-provided Phase 12B build prompt with 5 critical design overrides.

---

### Pre-Build Summary

#### Context
Phase 12A built core recording, browsing, and celebration. Phase 12B makes the Victory Recorder smart — connecting it to the rest of the platform via an Activity Log intelligence scan, cross-feature activity logging, and targeted UI wiring. The key architectural decision: **victories are claimed, not auto-generated**. The Activity Log captures everything silently, a Haiku scan surfaces meaningful patterns, and the user decides what to celebrate.

#### Founder Design Overrides (Supersede PRD)
1. **No silent auto-routing.** PRD says auto-create victories from task completions. Founder override: Activity Log captures actions → Haiku scan suggests → user claims. Human-in-the-Mix applied to victory recognition.
2. **Activity Log scan looks for meaning, not just completions.** Patterns, consistency, effort on hard things.
3. **"What Actually Got Done" prompt** when Activity Log is sparse — captures invisible labor.
4. **CompletionNotePrompt** — non-blocking toast on task completion (8s auto-dismiss). Enriches activity data.
5. **Evening Reckoning integration** — stub hook for PRD-18 to consume.

#### Dependencies Already Built (Phase 12A)
- VictoryRecorder page with period/life area filters, victory cards, empty state
- RecordVictory modal, VictoryDetail modal, CelebrationModal, CelebrationArchive
- useVictories hook with full CRUD + queries
- celebrate-victory Edge Function (Sonnet/Haiku)
- InfoRecentVictories widget — already rendering real data
- Activity log trigger on victories INSERT (`trg_victory_activity_log`)
- Task completion activity log entry (`event_type: 'task_completed'`) in useTaskCompletion.ts
- All 3 tables with RLS, all 16 source enum values in types
- Notepad routing destination 'victory' registered
- QuickCreate "Log Victory" navigates to `/victories?new=1`
- LiLa "Record Victory" action chip (disabled stub)

#### Dependencies NOT Yet Built
- scan-activity-victories Edge Function (new)
- Victory Suggestions UI section (new)
- CompletionNotePrompt component (new)
- Activity log entries for: intention iteration, widget data point, list item completion, routine completion (4 sources)
- Notepad "Flag as Victory" actual handler (destination registered, handler missing)
- useVictoryReckoningContext hook (new)
- `reckoning_prompt` source type (new)

#### Build Items (Phase 12B — 10 items)

**1. Add `reckoning_prompt` source type**
- Add to VictorySource union in `src/types/victories.ts`
- Add to SOURCE_LABELS map
- For "What Actually Got Done" entries captured from the proactive prompt

**2. scan-activity-victories Edge Function**
- Haiku-powered scan of activity_log_entries for a member + period
- Loads Guiding Stars + Best Intentions for context matching
- Loads existing victories to avoid duplicate suggestions
- Returns JSON array: description, pattern_note, life_area_tag, GS/BI IDs, source_log_ids
- Always Haiku (~$0.001/scan)
- Uses _shared/ utilities (cors, auth, cost-logger)

**3. Victory Suggestions UI on VictoryRecorder page**
- "Scan My Activity" button (user-initiated)
- Collapsible "LiLa noticed these..." section with suggestion cards
- Each card: Claim / Edit & Claim / Skip
- Session-only state (not persisted)
- Gold sparkle on claim

**4. Enhance "What Actually Got Done" prompt**
- Currently exists as empty state — enhance to also show as a prompt card when activity is sparse (< 3 entries today + no victories today)
- Opens RecordVictory with source = 'reckoning_prompt'

**5. CompletionNotePrompt component**
- Non-blocking toast on task completion: "Add a note?"
- Auto-dismisses after 8 seconds
- Expands to textarea on tap, pauses auto-dismiss
- Saves to task_completions.completion_note
- Wire into useTaskCompletion flow

**6. Wire activity log entries for 4 missing sources**
- Intention iteration: add to useLogIteration() in useBestIntentions.ts
- Widget data point: add to useRecordWidgetData() in useWidgets.ts
- List item completion: add to useToggleListItem() in useLists.ts
- Routine completion: add to useTaskCompletion.ts for routine-type tasks

**7. Wire Notepad "Flag as Victory" routing**
- In NotepadReviewRoute.tsx, when destination='victory': create victory record with source='notepad_routed'
- Direct creation — user explicitly chose this destination

**8. Wire LiLa "Record Victory" action chip**
- Enable disabled chip in LilaMessageBubble.tsx
- On click: navigate to /victories?new=1 with prefilled text from conversation
- Detection logic is STUB — chip always available, user decides

**9. Build useVictoryReckoningContext hook**
- Export hook providing: today's victory count, today's victories list, scan trigger, celebrate trigger
- No consumer yet — API for PRD-18

**10. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building Phase 12B)
- DailyCelebration 5-step sequence (Phase 12C)
- Voice personalities (Phase 12C)
- Family Celebration (PRD-11B)
- Auto-route source configuration per member (Settings, future)
- Reflection response → Victory routing (PRD-18)
- Victory Reports (post-MVP)
- TTS audio, Celebration Cards visual (post-MVP)
- Pattern Insights for teens (post-MVP)
- LifeLantern context in celebrations (future)

### Key Decisions
1. **No silent auto-routing** — founder override. Activity Log captures; scan suggests; user claims.
2. **Scan is user-initiated** — "Scan My Activity" button, not automatic.
3. **Suggestions are session-only** — not persisted to database.
4. **Notepad "Flag as Victory" IS direct creation** — the ONE cross-feature path that creates records directly.
5. **CompletionNotePrompt is non-blocking** — auto-dismisses 8s, never interrupts flow.
6. **InfoRecentVictories widget already works** — no additional widget work needed.
7. **LiLa detection is partial** — chip enabled for manual use, no AI detection logic.
8. **Routine completion logged client-side** — since reset is a DB trigger, we log at completion time for routine-type tasks.
9. **`reckoning_prompt`** added as new source type for "What Actually Got Done" entries.

---

# Build D (Previous): PRD-11 Victory Recorder (Phase 12A) — COMPLETED 2026-04-01

### PRD Files
- `prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md` (full PRD — read every word)
- `prds/personal-growth/PRD-11B-Family-Celebration.md` (companion — read for awareness, NOT building)

### Addenda Read
- `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` (PRD-11 section: 15+ cross-PRD source enum values — already in migration)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- 17 other addenda reference PRD-11 but contain no PRD-11-specific overrides

### Feature Decision File
`claude/feature-decisions/PRD-11-Victory-Recorder.md`

### Build Spec
Founder-provided session prompt with 5 critical design overrides (see below).

---

### Pre-Build Summary

#### Context
Victory Recorder is the emotional heartbeat of MyAIM — a celebration-only surface that asks "What did you do right?" It captures meaningful accomplishments and generates identity-based AI celebration narratives that connect what users *did* to who they *are becoming*. Phase 12A builds core recording, browsing, collection celebration, and the Celebration Archive for adults and teens.

All 3 database tables already exist (migration 00000000000009): `victories`, `victory_celebrations`, `victory_voice_preferences` — all empty, ready to use. Extensive stub infrastructure exists: VictoriesPage placeholder, GuidedVictories stub, CelebrateSection on Guided Dashboard, InfoRecentVictories widget, sidebar nav, BottomNav, QuickCreate FAB, RoutingStrip destination, SpotlightSearch entry. SparkleOverlay component already exists and is fully functional.

#### Founder Design Overrides (Supersede PRD)
1. **NO AI on individual victory save.** Type, save, gold sparkle, done. AI reserved for collection "Celebrate This!" only.
2. **"Celebrate This!" is user-triggered, never automatic.**
3. **Model split:** Sonnet for adults/teens, Haiku for kids' DailyCelebration.
4. **Victories are claimed, not auto-generated.** Auto-routing from tasks is Phase 12B.
5. **"What Actually Got Done" prompt** as empty-state behavior.

#### Dependencies Already Built
- SparkleOverlay component (`src/components/shared/SparkleOverlay.tsx`) — full celebration effects
- VictoriesPage placeholder with shell-aware routing (`src/pages/placeholder/index.tsx`)
- GuidedVictories stub page (`src/pages/GuidedVictories.tsx`)
- `/victories` route in App.tsx
- Sidebar nav "Victories" entry in "Grow" section
- BottomNav "Victories" in "Daily" section of More menu
- QuickCreate FAB "Log Victory" action → `/victories?new=1`
- RoutingStrip victory destination (key: 'victory')
- SpotlightSearch victory entry
- CelebrateSection stub on Guided Dashboard (PRD-25)
- InfoRecentVictories widget stub
- HubVictoriesSummarySection stub (PRD-14D)
- `dashboardSections.ts` celebrate section config
- Guiding Stars + Best Intentions hooks (PRD-06)
- InnerWorkings / self_knowledge data (PRD-07)
- ModalV2 shared component
- Density system + theme conventions
- Edge Function shared utilities: cors, auth, cost-logger, streaming, context-assembler, crisis-detection
- Feature keys seeded: victory_recorder_basic, victory_recorder_celebrate, victory_moms_picks, daily_celebration
- activity_log_entries table with RLS

#### Dependencies NOT Yet Built (Stubs for Phase 12A)
- celebrate-victory Edge Function (new)
- VictoryRecorder page component (replaces placeholder)
- RecordVictory modal (new)
- VictoryDetail modal (new)
- CelebrationModal (new)
- CelebrationArchive (new)
- useVictories hook (new)
- useCelebrationArchive hook (new)
- Activity log trigger on victories INSERT (new migration)

#### Build Items (Phase 12A — 11 items)

**1. Migration: Schema gaps + activity log trigger**
- ALTER `victory_celebrations` mode CHECK to add 'monthly'
- CREATE INDEX `idx_v_member_area` ON victories (family_id, family_member_id, life_area_tag)
- ADD RLS policies: mom INSERT for family, mom UPDATE for family, parent SELECT on victory_celebrations
- CREATE trigger function `log_victory_created()` → inserts into activity_log_entries
- CREATE trigger AFTER INSERT ON victories

**2. TypeScript types**
- `src/types/victories.ts` — Victory, VictoryCelebration, VoicePreference, CreateVictory, VictoryFilters

**3. useVictories hook**
- Family-member scoped CRUD with optimistic updates
- Period filtering (today, this_week, this_month, all, custom range)
- Life area filtering (multi-select)
- Mom's Pick operations (toggle + note)
- Archive/restore
- Victory count by period
- Recent victories query

**4. useCelebrationArchive hook**
- Save celebration narrative to victory_celebrations
- Fetch celebrations by member, ordered by date
- Delete celebration
- Copy celebration text

**5. celebrate-victory Edge Function**
- Non-streaming JSON response (narrative is a single block, not conversational)
- Modes: collection, review, monthly (no individual mode per founder override)
- Context loading: Guiding Stars, Best Intentions, InnerWorkings (is_included_in_ai = true)
- LifeLantern context: stub (empty array)
- Model selection: Sonnet for adults/teens, Haiku for guided/play
- Identity-based celebration rules in system prompt with few-shot examples
- Cost logging via logAICost
- Zod input validation, auth, crisis detection

**6. VictoryRecorder page**
- Replace VictoriesPage placeholder
- Page title: "Victory Recorder" + subtitle "What did you do right?"
- Period filter chips: Today | This Week | This Month | All Time | Custom Range
- Life area filter chips: multi-selectable, auto-sorted by frequency, "+ Add Custom"
- Special filter modes: Best Intentions | Guiding Stars (LifeLantern stub)
- Victory count summary
- "Celebrate This!" button (only when victories exist for period)
- "Past Celebrations" link
- Victory cards: description, life area tag, source icon, timestamp, Mom's Pick star, gold left border
- FAB: "Record a Victory"
- Empty state: "What Actually Got Done" prompt
- Long-press quick actions on cards

**7. RecordVictory modal**
- ModalV2 transient
- Text area: "What did you accomplish?"
- Quick-add category buttons (7 categories)
- Importance selector: Small Win | Standard | Big Win | Major Achievement
- NO AI call on save
- Gold SparkleOverlay quick_burst on save
- Toast: "Victory recorded!"
- Support for ?new=1 URL param auto-open
- Bulk mode toggle (paste multiple → separate records)

**8. VictoryDetail modal**
- ModalV2 transient
- Full description (editable)
- Celebration text if present (editable)
- Life area tag (editable dropdown/chips)
- Guiding Stars connection (add/change/remove)
- Best Intentions connection (add/change/remove)
- Source info with link (or "Original source no longer available")
- Date and time
- Mom's Pick toggle + note field (mom only for children's; self for own)
- Importance indicator (editable)
- Custom tags (add/remove)
- Archive button, Copy button

**9. CelebrationModal**
- ModalV2 persistent (stays open during generation)
- Opens immediately — gold firework animation while AI generates
- Loading state: "Reflecting on your accomplishments..." with gold particle effects
- Narrative display in warm typography
- Human-in-the-Mix: Edit button on narrative
- Actions: Save to Archive | Copy | Dismiss
- "Save to Journal" stub for future
- Auto-saves to victory_celebrations
- Firework burst + gold rain effects (adapt SparkleOverlay patterns)

**10. CelebrationArchive**
- ModalV2 transient
- Title: "Past Celebrations"
- Cards by date, newest first
- Each card: date header, victory count, period label, narrative text, Copy + Delete
- Scrollable, pagination

**11. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building Phase 12A)
- DailyCelebration 5-step sequence (Phase 12C)
- Voice personality selection UI (Phase 12C)
- Auto-routing from tasks/trackers/intentions/widgets/lists (Phase 12B — AIR pipeline)
- Activity Log scan intelligence / suggested victories (Phase 12B)
- Dashboard victory widget wiring (Phase 12B)
- Notepad "Flag as Victory" routing (Phase 12B)
- LiLa victory detection action chip (Phase 12B)
- Family Celebration mode (PRD-11B)
- LifeLantern context in celebrations (future)
- Evening Rhythm integration (PRD-18)
- Victory Reports (post-MVP)
- TTS audio (post-MVP)
- Celebration Cards visual (post-MVP)

### Key Decisions
1. **NO AI on individual save** — gold sparkle only. AI reserved for "Celebrate This!" collection.
2. **Non-streaming Edge Function** — narrative is a single block, not conversational SSE.
3. **Tables already exist** — migration only adds missing indexes, RLS policies, trigger, and CHECK fix.
4. **Replace placeholder page** — VictoriesPage in placeholder/index.tsx replaced with real component.
5. **Shell routing preserved** — guided → GuidedVictories stub, all others → real VictoryRecorder.
6. **Adults' victories are private** — mom can't see dad's, dad can't see mom's.
7. **Mom sees all children's victories** — RLS parent policy already exists for SELECT.
8. **Custom tags are TEXT[]** — not a separate table. Stored directly on victory record.
9. **Auto-routing deferred to Phase 12B** — Phase 12A is manual entry only.
10. **InfoRecentVictories widget** — wire to show actual data (simple query, no new widget type).

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

*PRD-23 (BookShelf Polish) completed 2026-04-01. Wired Search Library button, added History button to library, added action buttons to collection/multi-book view, removed Refresh Key Points (redundant). Fixed bookshelf-discuss: added missing discussion_type column, fixed model ID, fixed extraction query column name (user_id → family_member_id), added source honesty guardrail. Built `_shared/context-assembler.ts` — three-layer relevance-filtered context assembly module (first consumer: bookshelf-discuss). Added Layered-Context-Assembly-Spec.md for future Edge Function migrations. 5 Playwright tests with real API calls passing.*

---
