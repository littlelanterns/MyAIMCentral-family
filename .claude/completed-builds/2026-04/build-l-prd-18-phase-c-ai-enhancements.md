# Build L: PRD-18 Phase C — AI-Powered Enhancements (MindSweep-Lite + Morning Insight + Feature Discovery + Rhythm Tracker Prompts)

### PRD Files
- `prds/daily-life/PRD-18-Rhythms-Reflections.md`

### Addenda Read
- `prds/addenda/PRD-18-Enhancement-Addendum.md` (**primary authoritative source** — Enhancements 2, 3, 4, 6)
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-18-Rhythms-Reflections.md` (lines 512–525 define Phase C scope; Phase B verification lines 693–882 catalog the four stubs this phase fills)

### Predecessor
Build K (PRD-18 Phase B) completed 2026-04-07 — 92 wired, 18 stubbed, 0 missing. Four Phase B stubs tagged for Phase C resolution: `mindsweep_lite`, `morning_insight`, `feature_discovery`, `rhythm_tracker_prompts`. All four currently render as placeholder cards from `src/components/rhythms/sections/StubSections.tsx` in the correct sections (evening position 7, morning position ~7, morning position ~9, evening position 12). Phase D still owns the Independent Teen tailored experience.

---

### Pre-Build Summary

#### Context

Phase B (Build K) closed out the narrative arc of Rhythms — morning and evening modals auto-open, Tomorrow Capture with fuzzy task matching is live, Morning Priorities Recall reads previous evening metadata, On the Horizon surfaces 7-day lookahead with Task Breaker integration, Carry Forward fallback runs hourly via pg_cron + Edge Function, periodic Weekly/Monthly/Quarterly cards render inline. Phase B also executed the mid-build section cleanup ("front door OR genuinely helpful" rule) — adult/independent morning dropped `task_preview` (duplicate of dashboard Active Tasks), Guided morning became 3 sections (encouraging_message + best_intentions_focus + calendar_preview with member-scope filter), and Closing Thought now requires ≥5 active Guiding Stars before it shows.

Phase C fills the four remaining Phase B stubs by wiring them to AI + BookShelf semantic search + activity log + widget config. The 13-section evening rhythm and ~8-section morning rhythm stay structurally unchanged — Phase C only replaces placeholder card renderers with real implementations. **Founder decision 2026-04-07:** MindSweep-Lite is NOT a new Edge Function with 5 simplified dispositions — it reuses the existing `mindsweep-sort` Edge Function with ALL 13+ routing destinations (tasks, calendar, journal, victory, guiding_stars, best_intentions, backburner, innerworkings, archives, recipe, list). The "Lite" part refers exclusively to the inline embedded UI + text-only input + batched-commit-on-Close-My-Day flow, not to a simplified classifier. The frontend adds `release` as an override-only disposition that creates no record. Phase C builds **adult-only** paths for MindSweep-Lite, Morning Insight (20 adult questions), and Feature Discovery (adult-oriented feature pool). Phase D still owns the full teen tailored experience (teen MindSweep-Lite framing, 15 teen-specific morning insight questions, teen feature pool prioritization).

The founder's end-state for Phase C: mom opens the evening rhythm, scrolls past Tomorrow Capture to MindSweep-Lite (collapsed by default). On a high-task day she auto-sees "Busy day — want to clear your head before bed?" She expands, dumps "I need to call the dentist on Tuesday. I'm worried about the girls' screen time. Email the co-op about next semester. Remember to pray for Sarah." Taps `[Parse]`. The existing `mindsweep-sort` Edge Function classifies each item into one of its full destination set and returns suggestions: dentist → Calendar (with date), screen time worry → Journal (emotional processing), co-op email → Task, pray for Sarah → Best Intention. She sees each item with a meaningful destination tag ("Calendar", "Journal", "Task", "Best Intention"). She taps the screen-time-worry tag to cycle to "Release" — she doesn't want a record, naming it is enough. She taps Close My Day. The commit creates 1 calendar event, 1 task, 1 best intention iteration record; the release item is preserved in `rhythm_completions.metadata.mindsweep_items` with no destination write. Next morning she opens the morning rhythm, scrolls past On the Horizon to "Something to think about": the question is "What matters most to you that you haven't made time for lately?" Below it, two passively-matched BookShelf extractions surface — one from a parenting book, one from a time management book. She types her response. The cards refresh with new matches based on her text. Each card is tappable to `/bookshelf/book/:id`. Further down, a Feature Discovery nudge shows once (only on 3 days per week): "Have you tried the Decision Guide? Next time you're stuck on a choice, walk through it with 15 frameworks. [Try it →]" She dismisses with [Not interested] and that feature exits her pool permanently.

#### Dependencies Already Built (reuse wholesale)

**Phase A/B rhythm infrastructure:**
- `rhythm_configs` with JSONB `sections` array — Phase A/B already seed `mindsweep_lite`, `morning_insight`, `feature_discovery`, `rhythm_tracker_prompts` section types at the correct positions in adult/independent seeds (verify during C1; backfill any missing entries in migration 100112)
- `rhythm_completions.metadata` JSONB — Phase B uses `priority_items` array; Phase C adds `mindsweep_items` array
- `RhythmMetadataContext` — modal-scoped staging store from Phase B; Phase C MindSweep-Lite writes stage into it before Close My Day commit
- `commitTomorrowCapture.ts` pattern — batched-writes-on-completion; Phase C's `commitMindSweepLite.ts` mirrors it exactly
- `RhythmModal.handleComplete` with `commitError` state — Phase C inserts its commit step in the same try/catch block between Tomorrow Capture and `useCompleteRhythm.mutateAsync`
- `rhythmSeed` + `pickOne` / `pickN` date-seeded PRNG — used for question rotation, feature discovery day picker, candidate picker
- `useRhythmCompletion` / `useCompleteRhythm` — consumed as-is
- Phase A already registered feature keys: `rhythm_mindsweep_lite`, `rhythm_morning_insight`, `rhythm_feature_discovery`, `rhythm_tracker_prompts` (all with tier grants in `feature_access_v2`)

**Phase A stub infrastructure ready to fill:**
- `morning_insight_questions` table (created in Phase A migration 100103, empty) — Phase C seeds 20 adult questions
- `feature_discovery_dismissals` table (created in Phase A migration 100103, empty, RLS live) — Phase C is the first writer
- Placeholder cards in `StubSections.tsx` for all 4 Phase C section types — Phase C removes them and imports real components in `SectionRendererSwitch.tsx`

**MindSweep + AI infrastructure:**
- **`mindsweep-sort` Edge Function** at `supabase/functions/mindsweep-sort/index.ts` (lines 1-636) — **PRIMARY REUSE for MindSweep-Lite**. Already handles Haiku classification across 10+ destinations (task, list, calendar, journal, victory, guiding_stars, best_intentions, backburner, innerworkings, archives, recipe), sensitivity filtering, cross-member detection. Phase C calls it via `supabase.functions.invoke('mindsweep-sort', { body: { items, family_id, member_id, aggressiveness: 'always_ask', source_channel: 'rhythm_evening', input_type: 'text' } })` and stages the returned `results` in `RhythmMetadataContext` instead of routing immediately.
- **`useRunSweep` shared hook** + **`routeSweepResults`** — Sprint 1+2 of MindSweep build. `routeSweepResults` does concurrent inserts via `Promise.all` for each destination type; Phase C's `commitMindSweepLite` either reuses it with a `sourceOverride` parameter OR mirrors its INSERT logic with `source='rhythm_mindsweep_lite'` attribution (decision made during C2 implementation based on how cleanly a parameter slots in).
- `task-breaker` Edge Function at `supabase/functions/task-breaker/index.ts` — pattern reference for any small new Edge Functions Phase C might need (e.g., `generate-query-embedding` if `embed` doesn't accept ad-hoc text input)
- `_shared/cors.ts`, `_shared/auth.ts`, `_shared/cost-logger.ts` — reused
- `tasks.source` CHECK constraint (Phase B added `rhythm_priority`) — Phase C adds `rhythm_mindsweep_lite` for attribution on tasks created via the rhythm commit path (regardless of which destination they flow through)

**BookShelf infrastructure:**
- `match_book_extractions` RPC from migration 100092:55-117 — signature: `(query_embedding halfvec(1536), p_family_id UUID, p_member_id UUID, p_book_library_ids UUID[], p_extraction_types TEXT[], match_threshold FLOAT DEFAULT 0.3, match_count INT DEFAULT 20)` → returns table `(id, book_library_id, book_title, extraction_type, content_type, item_text, section_title, section_index, is_key_point, is_hearted, user_note, similarity)`. Joins `platform_intelligence.book_extractions` with `platform_intelligence.book_library` and LEFT JOINs `bookshelf_user_state` for hearting/notes.
- `platform_intelligence.book_extractions` with halfvec(1536) + HNSW index + `is_deleted=false + audience='original'` filters already baked into the RPC
- `bookshelf_items.book_library_id` mapping already populated (Build F Phase 1 data migration)
- `embed` Edge Function for generating query embeddings on-the-fly (verify ad-hoc text interface during C3; otherwise create lightweight wrapper)

**Activity log + feature discovery:**
- `activity_log_entries` schema (migration 00000000000009:409-433) — `{id, family_id, member_id, event_type, source_table, source_id, metadata, created_at}` with indexes on (family_id, member_id), event_type, created_at DESC, (source_table, source_id)
- 8 event_type values currently logged: `task_completed`, `reflection_completed`, `routine_completed`, `list_item_completed`, `intention_iterated`, `tracker_entry`, `victory_recorded`, `rhythm_completed`. Sufficient for Phase C engagement signals — no new event types required.

**Widget + tracker infrastructure:**
- `dashboard_widgets.config` JSONB — flexible per-widget config, currently holds template-specific fields + multiplayer config
- `WidgetConfiguration.tsx` at `src/components/widgets/WidgetConfiguration.tsx` — central widget config modal; Phase C adds a "Show in rhythms" multi-select section below Multiplayer section
- `dashboard_widgets` query patterns already established

#### Dependencies NOT Yet Built

- **PRD-05 day-data context assembly enhancement** — required for LiLa dynamic morning insight question generation. Phase C ships with hand-authored 20-question pool only. LiLa dynamic blend is post-MVP.
- **PRD-15 Messages/Requests/Notifications** — MindSweep-Lite "delegate" disposition should create a real `family_request`. Phase C falls back to creating a task with `[Delegate]` prefix in the description. Polish pass wires PRD-15 later.
- **Teen parallel paths** — teen MindSweep-Lite dispositions (Schedule / Journal about it / Talk to someone / Let it go), teen morning insight question pool (15 questions), teen feature pool prioritization, teen framing language — all Phase D.
- **PRD-14C Family Overview rhythm completion indicators** — Phase B writes the completion rows; consumption is post-Phase-D wiring.
- **`before_close_the_day` cross-feature pending aggregation** — tagged in STUB_REGISTRY as "Phase C scope" but NOT an AI-powered enhancement. Phase C explicitly leaves this stub in place; it belongs in a later cross-feature polish pass.

#### Build Items (Phase C — 4 sub-phases)

**Sub-phase C1 — Foundation (migration + types + hooks + Edge Function skeleton)**

1. **Migration `00000000100112_rhythms_phase_c.sql`** — single idempotent file:
   - INSERT 20 adult `morning_insight_questions` rows (system-level: `family_id=NULL`, `audience='adult'`, `is_active=true`, sort_order) from the Enhancement Addendum Morning Insight Question Pool (Family Friction × 5, Personal Growth × 5, Relationships × 4, Parenting × 3, Values & Purpose × 3). Idempotent via `WHERE NOT EXISTS` check on `question_text + audience` tuple.
   - ALTER `tasks` DROP + ADD `tasks_source_check` CHECK constraint to include `'rhythm_mindsweep_lite'` (rebuild-enum pattern, preserving all prior values including `rhythm_priority` from Phase B).
   - Update `auto_provision_member_resources` trigger function: verify `morning_insight` and `feature_discovery` are in the adult/independent morning seed. If missing (to be verified against current trigger body during implementation), add `morning_insight` after `on_the_horizon` (~order 7) and `feature_discovery` after `brain_dump` (~order 9). Verify `mindsweep_lite` is in evening seed at order 7 and `rhythm_tracker_prompts` is in evening seed at order 12.
   - Backfill existing rhythm_configs: idempotent JSONB update inserting `morning_insight` and `feature_discovery` section entries into each adult/independent morning rhythm where missing. Uses same `@>` guard pattern as migration 100111.
   - Verification NOTICE queries: seed count, section presence in morning/evening seeds, `tasks.source` accepts new value.

2. **TypeScript types** in `src/types/rhythms.ts`:
   - **`MindSweepLiteDisposition`** — full union matching `mindsweep-sort`'s destination set PLUS `'release'`: `'task' | 'list' | 'calendar' | 'journal' | 'victory' | 'guiding_stars' | 'best_intentions' | 'backburner' | 'innerworkings' | 'archives' | 'recipe' | 'release'`. Imported from the shared mindsweep types where they exist; new file if not.
   - **`DISPOSITION_DISPLAY_NAMES`** constant — maps each disposition to a human-readable label: `task → "Task"`, `calendar → "Calendar Event"`, `journal → "Journal Entry"`, `victory → "Victory"`, `guiding_stars → "Guiding Star"`, `best_intentions → "Best Intention"`, `innerworkings → "Self-Knowledge"`, `archives → "Archive Note"`, `backburner → "Backburner"`, `list → "List Item"`, `recipe → "Recipe"`, `release → "Release"`. Used for the disposition tag rendering in the section UI.
   - **`MindSweepLiteItem`** = `{ text: string; disposition: MindSweepLiteDisposition; classifier_suggested: MindSweepLiteDisposition; classifier_confidence?: number; classifier_reasoning?: string; destination_detail?: Record<string, unknown>; created_record_id?: string | null; created_record_type?: string | null; commit_error?: string }`. `classifier_suggested` preserves Haiku's original suggestion even after user override, so the metadata captures the full audit trail.
   - `MorningInsightQuestion` — full row shape
   - `MorningInsightMatch = { extraction_id: string; book_library_id: string; book_title: string; extraction_type: string; item_text: string; section_title: string | null; similarity: number; is_hearted: boolean }`
   - `FeatureDiscoveryCandidate = { feature_key: string; display_name: string; tagline: string; action_text: string; action_route: string; engagement_event_types: string[]; engagement_source_tables: string[]; roles_allowed: Array<'primary_parent' | 'additional_adult' | 'independent_teen'> }`
   - Document `dashboard_widgets.config.rhythm_keys: string[]` sub-field via a `WidgetRhythmConfig` helper type (no DB column — JSONB runtime only)

3. **New hooks:**
   - `useMorningInsightQuestions(audience)` — `src/hooks/useMorningInsightQuestions.ts`
   - `useFeatureDiscoveryCandidates(memberId, memberRole)` + `useDismissFeatureDiscovery()` — `src/hooks/useFeatureDiscovery.ts`
   - `useRhythmTrackerWidgets(familyId, memberId, rhythmKey)` — `src/hooks/useRhythmTrackers.ts`

4. **Feature discovery pool constant** in `src/lib/rhythm/featureDiscoveryPool.ts`: curated array of 10-12 `FeatureDiscoveryCandidate` entries targeting features that exist today — BookShelf upload, ThoughtSift Decision Guide, ThoughtSift Board of Directors, Guiding Stars declarations, Victory Recorder weekly celebration voice, Journal with tags, InnerWorkings self-knowledge upload, Widgets gallery, Calendar recurring events, Routine checklist templates, Reflections past tab, Smart Notepad voice input. Each entry specifies `engagement_event_types` + `engagement_source_tables` for the engagement detector.

5. **NO new Edge Function this sub-phase.** MindSweep-Lite reuses the existing `mindsweep-sort` Edge Function. C1 only verifies that calling `mindsweep-sort` from the rhythm context (with `source_channel='rhythm_evening'`, `aggressiveness='always_ask'`, `input_type='text'`) returns expected classifications and does NOT auto-route. Confirm by reading the function's existing routing path — does it write records itself, or is routing entirely delegated to `routeSweepResults` on the frontend? If the function writes records itself, C2 must add a `classification_only: true` flag to its input schema to suppress writes; otherwise no Edge Function changes are needed.

6. **Verification**: `tsc -b` zero errors, migration applied, NOTICE queries green, `mindsweep-sort` smoke test from rhythm context returns classifications without side effects

**Sub-phase C2 — Enhancement 2 MindSweep-Lite (reuse `mindsweep-sort` + inline section + batched commit)**

1. **Add `classification_only` flag to `mindsweep-sort` if needed** (decision made in C1 verification):
   - If the existing function writes records itself, add an optional input parameter `classification_only?: boolean` (default false). When true, skip the routing step and return classifications only. Backward compatible — existing callers (NotepadDrawer, MindSweepCapture) pass nothing and behavior is unchanged.
   - If routing is already entirely on the frontend via `routeSweepResults`, no Edge Function change is needed — just call `mindsweep-sort` and ignore any auto-routing path.
   - Either way: no system prompt changes, no destination set changes. The existing tuned classifier handles all 11+ destinations.
   - Verify the function output already includes meaningful destination + destination_detail. If not, add a small augmentation (e.g., propose a date for calendar destinations from the text — likely already there).

2. **`MindSweepLiteSection.tsx`** in `src/components/rhythms/sections/`:
   - Props: `familyId`, `memberId`, current `rhythmCompletion` (for staging via context), `readingSupport` flag
   - Collapsed by default: chevron + "Something on your mind?" header
   - Auto-expand heuristic: query today's `activity_log_entries` count where `member_id=memberId AND event_type='task_completed'`. If ≥ 8 → auto-expand with gentle prompt "Busy day — want to clear your head before bed?"
   - Expanded state: `<textarea>` placeholder "Dump whatever's looping..." (no hard cap) + `[Parse]` button
   - On `[Parse]`: split textarea content into candidate items via newline + sentence heuristic, call `supabase.functions.invoke('mindsweep-sort', { body: { items: candidates.map(text => ({ content: text, content_type: 'text' })), family_id, member_id, aggressiveness: 'always_ask', source_channel: 'rhythm_evening', input_type: 'text', classification_only: true } })`. Stage results in `RhythmMetadataContext` as `MindSweepLiteItem[]` — each item carries `text`, Haiku's suggested `disposition` (set to `classifier_suggested`), `disposition` (initially equals classifier_suggested), `classifier_confidence`, `classifier_reasoning`, `destination_detail` (e.g., proposed date for calendar items).
   - Loading skeleton during parse
   - **Per-item render**: pill row showing `text` + a tappable disposition badge displaying `DISPOSITION_DISPLAY_NAMES[item.disposition]` ("Task", "Calendar Event", "Best Intention", "Release", etc.) + `[×]` remove button. Tap badge → opens a small dropdown listing all 12 dispositions with current selection highlighted. User picks; `disposition` updates; `classifier_suggested` stays unchanged for audit. If destination_detail has proposed values (e.g., date), show as small caption under the item.
   - `[+ Add item]` footer button → manual item with empty disposition, user must pick before commit
   - `[Parse again]` footer button → re-runs classification on the textarea (preserves manually added items)
   - All state held in `RhythmMetadataContext` via `setMindSweepItems` callback — same pattern as Phase B Tomorrow Capture
   - Volume2 icon reads header aloud when `readingSupport` is true

3. **`commitMindSweepLite.ts`** in `src/lib/rhythm/`:
   - Pure async function: `(supabase, { familyId, memberId, items }) → Promise<MindSweepLiteItem[]>` — returns enriched items with `created_record_id` + `created_record_type` or `commit_error`
   - **Strategy decision (made during C2 implementation):** either (a) reuse `routeSweepResults` with a new `sourceOverride='rhythm_mindsweep_lite'` parameter, OR (b) write per-disposition INSERT logic that mirrors `routeSweepResults` but writes `source='rhythm_mindsweep_lite'` directly. Pick whichever is cleaner after reading `routeSweepResults`. Both yield the same outcome.
   - Filter `release` items out before routing — they create no records but stay in the returned array with `created_record_id=null` so they persist in `metadata.mindsweep_items` for audit/history
   - All non-release items route through their classified destination using the existing routing pipeline's logic
   - **Partial failure handling**: per-item try/catch — if one write fails, the error is recorded on that item as `commit_error`, other items continue. The whole function never throws. Completion still proceeds.

4. **Wire into `RhythmModal.handleComplete`**: commit order = `commitTomorrowCapture` → `commitMindSweepLite` → `useCompleteRhythm.mutateAsync` with enriched metadata. Per Key Decision 2, partial commit failures in mindsweep-lite do NOT block completion.

5. **Remove `MindSweepLiteSection` stub** from `StubSections.tsx`, import real component in `SectionRendererSwitch.tsx`

6. **Playwright test**: parse "I need to call the dentist on Tuesday. I'm worried about the girls' screen time. Need to email the co-op about next semester. Remember to pray for Sarah." → verify 4 items returned with sensible classifications (calendar/journal/task/best_intention) → manually override the screen-time item to "release" → close day → verify calendar event + task + best_intention iteration row exist and the release item is in `metadata.mindsweep_items` with `created_record_id=null`. Verify NotepadDrawer's existing sweep flow still routes immediately and is unaffected by the `classification_only` flag.

7. `tsc -b` zero errors

**Sub-phase C3 — Enhancement 3 Morning Insight + Enhancement 4 Feature Discovery**

1. **`MorningInsightSection.tsx`** in `src/components/rhythms/sections/`:
   - Props: `familyId`, `memberId`, `readingSupport`
   - Query `useMorningInsightQuestions('adult')` then `pickOne(questions, rhythmSeed(memberId, 'morning:insight_question', todayLocalIso()))`
   - Display "Something to think about" header + picked question
   - Optional `<textarea>`: "What comes to mind?"
   - **Passive matches on mount**: generate query embedding for the question text via `embed` (or `generate-query-embedding`) Edge Function, call `match_book_extractions` RPC, render 1-2 passive extraction cards below textarea
   - **Active matches on input (350ms debounce)**: re-generate embedding from user's response, re-call RPC, replace cards with 2-3 active matches
   - Each card: book title + section_title + item_text snippet + `[See in BookShelf →]` link to `/bookshelf/book/:bookLibraryId` (verify route during implementation)
   - **Empty BookShelf handling**: query `bookshelf_items` count for family; if 0, render question + textarea + single onboarding card "Add a book you love to get personalized morning insights"
   - If BookShelf has items but no matches above 0.3 similarity: "No matches yet — as your library grows, we'll surface relevant wisdom here."
   - Volume2 icon reads question aloud when `readingSupport` is true

2. **Query embedding Edge Function** — verify whether `embed` accepts ad-hoc text. If only queue-driven, create lightweight `generate-query-embedding` 40-line wrapper around OpenAI text-embedding-3-small. Decision made during C3.

3. **`FeatureDiscoverySection.tsx`** in `src/components/rhythms/sections/`:
   - Props: `familyId`, `memberId`, `memberRole`
   - Query `useFeatureDiscoveryCandidates(memberId, memberRole)` — returns pool after engagement + dismissal filters
   - **Frequency gate**: `const pickedDays = pickN([0,1,2,3,4,5,6], 3, rhythmSeed(memberId, 'morning:feature_discovery_days', thisWeekIso()))`. If today's day number (Mon=0..Sun=6) is not in `pickedDays` → return `null`
   - If gate passes AND pool non-empty: `pickOne(candidates, rhythmSeed(memberId, 'morning:feature_discovery_card', todayLocalIso()))`
   - Render card: display_name header + tagline + `[action_text →]` routing to `action_route` + small `[Not interested]` dismiss link
   - Dismiss → `useDismissFeatureDiscovery.mutateAsync({ memberId, feature_key })` → invalidates query → returns null on next render
   - Empty pool: return null

4. **Engagement query** inside `useFeatureDiscoveryCandidates`:
   - For each candidate, query `activity_log_entries` WHERE `member_id=memberId AND created_at > NOW() - INTERVAL '14 days' AND (event_type = ANY(candidate.engagement_event_types) OR source_table = ANY(candidate.engagement_source_tables))` LIMIT 1. If any row → candidate excluded.
   - Client-side filter (12 small queries per rhythm open). Server-side RPC optimization deferred.

5. **Remove `MorningInsightSection` and `FeatureDiscoverySection` stubs** from `StubSections.tsx`, import real components

6. **Playwright tests**:
   - Morning Insight passive: BookShelf populated → 1-2 passive cards render
   - Morning Insight active: type response → debounced refresh → 2-3 new cards
   - Morning Insight empty BookShelf: 0 bookshelf_items → onboarding nudge
   - Feature Discovery gate: mock date to non-picked day → null
   - Feature Discovery dismiss: dismiss → next mount, candidate excluded
   - Feature Discovery engagement exit: simulate `tracker_entry` → "Widgets" candidate excluded

7. `tsc -b` zero errors

**Sub-phase C4 — Enhancement 6 Rhythm Tracker Prompts + stub flip + CLAUDE.md + verification**

1. **Extend `WidgetConfiguration.tsx`** in `src/components/widgets/`:
   - New "Show in rhythms" section below Multiplayer section
   - Checkboxes: Morning Rhythm, Evening Rhythm, Weekly Review, Monthly Review, Quarterly Inventory. Custom rhythms listed disabled with "(coming soon)".
   - Reads current `config.rhythm_keys` array on load (`[]` if missing)
   - Writes back on save: merges into existing `config` JSONB preserving all other fields
   - Hint: "This tracker will appear in the rhythms you check."

2. **`RhythmTrackerPromptsSection.tsx`** in `src/components/rhythms/sections/`:
   - Props: `familyId`, `memberId`, current `rhythmKey`
   - Query `useRhythmTrackerWidgets` — returns widgets where `config.rhythm_keys` contains the current rhythm's key
   - If empty → return null (auto-hide)
   - Header: dynamic based on rhythm — "Track for morning" / "Track for evening" / etc.
   - Per widget: compact card with title + `[Log now →]` button linking to widget's dashboard position
   - **Phase C ships link-only rendering** — inline data entry per widget type is a polish pass

3. **Remove `RhythmTrackerPromptsSection` stub** from `StubSections.tsx`, import real component

4. **STUB_REGISTRY.md updates** — flip 4 Phase B stubs to Wired with 2026-04-XX date (lines 170-173)

5. **CLAUDE.md additions** — append Phase C conventions to Rhythms section (after line 179, 8 new convention lines covering: MindSweep-Lite reuses `mindsweep-sort` Edge Function (NOT a new function) with frontend-only `release` override, batched commit with per-item error handling and `source='rhythm_mindsweep_lite'` attribution, query embedding generation on-the-fly for Morning Insight, 3-days/week PRNG gate for Feature Discovery, TypeScript pool constant for feature discovery, permanent dismissals via `feature_discovery_dismissals`, `config.rhythm_keys` widget routing, adult-only Phase C scope)

6. **Feature decision file Phase C verification table** filled — every Phase C requirement Wired/Stubbed, zero Missing

7. **Post-build verification** presented to founder for sign-off

8. `tsc -b` zero errors, `npm run check:colors` zero hardcoded colors in Phase C files

#### Stubs (NOT Building Phase C)

- **Teen MindSweep-Lite framing** (Phase D will fork the section component on `memberRole==='independent_teen'` to use teen-tone copy and the teen morning insight question pool — the underlying classification reuses the same `mindsweep-sort` Edge Function)
- **Teen morning insight question pool** (15 teen-specific questions) — Phase D
- **Teen feature discovery pool prioritization** (BookShelf-for-school framing, teen-relevant features) — Phase D
- **Teen framing language** across all Phase C sections (ownership vs directive) — Phase D
- **LiLa dynamic morning insight question generation** — PRD-05 day-data context dependency, post-MVP
- **PRD-15 messaging destination in MindSweep-Lite output** — when PRD-15 ships, `mindsweep-sort` can add a `messages` destination. Phase C inherits whatever destination set the Edge Function currently exposes; no special handling needed.
- **Inline widget data entry in `RhythmTrackerPromptsSection`** — Phase C ships link-only; inline entry is a polish pass
- **Morning Insight question pool CRUD in Rhythms Settings** — post-MVP user-authored questions
- **Feature Discovery pool expansion beyond 10-12 curated entries** — additional features added as they ship
- **`before_close_the_day` cross-feature pending aggregation** — not an AI-powered enhancement; belongs in a later cross-feature polish pass. Phase C explicitly leaves this stub in place.
- **`completed_meetings` auto-hide wiring** — PRD-16 dependency, unchanged from Phase B
- **`milestone_celebrations` auto-hide wiring** — PRD-24 gamification dependency, unchanged from Phase B
- **PRD-14C Family Overview rhythm completion indicators** — Phase B writes rows; consumption post-Phase-D

#### Key Decisions

1. **MindSweep-Lite reuses the existing `mindsweep-sort` Edge Function — NO new Edge Function.** Founder decision 2026-04-07 (reversing the original Phase C plan). The full classifier already handles 11+ destinations with tuned Haiku prompts; building a parallel "lite" classifier would be needless dual maintenance and a worse user experience (artificial 5-disposition limitation when the real thing already routes to all destinations). The "Lite" name now refers to the embedded UI (collapsed inline section) + text-only input + batched-commit-on-Close-My-Day flow, NOT to a simplified classifier. Phase C may add an optional `classification_only: true` flag to `mindsweep-sort` if its current contract auto-routes; otherwise the call is a thin wrapper around the existing function.

2. **`release` is a frontend-only override disposition** — Haiku never suggests it. The user manually overrides any classified item to Release when they want to acknowledge the thought without creating a record. The disposition is preserved in `rhythm_completions.metadata.mindsweep_items` for audit, but no destination write happens. This is the only disposition unique to MindSweep-Lite vs full MindSweep — and it lives entirely in the frontend (override UI + commit-time skip), never in the Edge Function.

3. **MindSweep-Lite partial commit failures are per-item and do NOT block completion.** `commitMindSweepLite` never throws — each item's write is wrapped in try/catch; failures are recorded as `commit_error` on the item and persisted in `rhythm_completions.metadata.mindsweep_items`. Completion still writes. This differs from `commitTomorrowCapture` which DOES block completion on failure (Tomorrow Capture items carry more weight — they're stated priorities, not braindump dispositions). Different handling for different trust levels.

4. **Morning Insight generates query embeddings on-the-fly.** Sub-500ms end-to-end (embed call ~150ms + RPC ~50ms). If `embed` Edge Function doesn't accept ad-hoc text input (currently designed for async queue), Phase C creates a 40-line `generate-query-embedding` wrapper around OpenAI text-embedding-3-small.

5. **Feature Discovery pool is a TypeScript constant**, not a DB table. 10-12 entries is small; editing is one file change; pool expands alongside new features. Phase D adds teen-relevant entries to the same constant.

6. **Feature Discovery frequency gate uses ISO week day picker with date-seeded PRNG.** `pickN(days, 3, rhythmSeed(memberId, 'morning:feature_discovery_days', thisWeekIso()))`. Today's day number must be in the picked set. Same member sees the same 3 days all week; rotates next week. Simpler than tracking nudge counts in metadata and guarantees "at least one discovery-free day per week."

7. **Feature Discovery engagement signal is `activity_log_entries` rows in last 14 days** matching the candidate's `engagement_event_types` or `engagement_source_tables`. No new event types, no new columns, uses existing infrastructure. Client-side filter Phase C; server-side RPC optimization deferred if hot.

8. **Dismissals are permanent per member.** Matches Enhancement Addendum decision 17. Dismissed features never resurface.

9. **`RhythmTrackerPromptsSection` Phase C ships link-only rendering**, not inline data entry. The section surfaces configured widgets; tapping `[Log now →]` takes the user to the main dashboard where full entry UI already exists. Inline entry per widget type is a polish pass.

10. **Morning Insight empty BookShelf handling is a single warm onboarding card**, not an error state. The question + textarea still render — the nudge replaces only the extraction cards.

11. **No teen support in Phase C.** Phase D owns parallel paths. Phase C builds clean adult-only implementations; Phase D adds teen wrappers that fork on `memberRole` or `audience`. Keeps concerns separate during Phase C build.

12. **4 sub-phases C1 → C2 → C3 → C4**, each ending at a `tsc -b` clean state for founder review checkpoints. C1 is foundation (migration + types + hooks + feature discovery pool constant + verifying mindsweep-sort can be called in classification-only mode). C2 wires MindSweep-Lite as a thin frontend layer over mindsweep-sort. C3 builds Morning Insight + Feature Discovery. C4 is integration polish (widget config UI + Rhythm Tracker Prompts + stub flip + CLAUDE.md + verification).

---

