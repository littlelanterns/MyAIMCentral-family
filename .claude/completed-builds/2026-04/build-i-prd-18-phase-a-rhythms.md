# Build I: PRD-18 Rhythms & Reflections (Phase A — Foundation) — COMPLETED 2026-04-07

### PRD Files
- `prds/daily-life/PRD-18-Rhythms-Reflections.md` (full PRD — 1147 lines, read every word)

### Addenda Read
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-18-Enhancement-Addendum.md` (**8 enhancements — primary authoritative source alongside the base PRD**)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-18-Rhythms-Reflections.md`

### Build Plan
Four sub-phases A → B → C → D (full detail in the feature decision file). This CURRENT_BUILD section scopes **Phase A only**. Phases B/C/D repopulate this section on their own cycles after founder approval.

- **Phase A (this build):** Foundation — rhythm tables, Morning Rhythm, Evening Rhythm core (13-section fixed sequence, mood triage removed), dashboard section registry integration, breathing-glow cards, basic section renderers reusing existing hooks (Guiding Stars, Best Intentions, Task Preview, Calendar, Reflections via existing `useReflections`), per-role default seeding, Guided/Play handoff to DailyCelebration, Rhythms Settings page, `rhythm_capture` routing destination.
- **Phase B (next):** Periodic rhythms (Weekly/Monthly/Quarterly), Enhancement 1 (Evening Tomorrow Capture + Morning Priorities Recall), Enhancement 8 (On the Horizon with Task Breaker integration), Enhancement 5 (Carry Forward fallback behavior + midnight cron).
- **Phase C (after):** Enhancement 2 (MindSweep-Lite with Haiku dispositions, batched on Close My Day), Enhancement 3 (Morning Insight with BookShelf semantic pull), Enhancement 4 (Feature Discovery nudge engine), Enhancement 6 (tracker `rhythm_keys` configuration).
- **Phase D (final):** Enhancement 7 (Independent Teen tailored experience — 8 evening sections, 7 morning sections, teen framing, teen MindSweep-Lite dispositions, 15 teen insight questions, 1-2 reflection question count).

---

### Pre-Build Summary (Phase A)

#### Context

PRD-18 is the platform's activation engine — the daily rhythms that transform MyAIM from a collection of management tools into a living companion. The founder's family already has a nightly reflection habit from StewardShip (V1), and Reflections as a standalone page is already substantially built (migrations 100071/100072, `reflection_prompts` + `reflection_responses` tables, `useReflections` hook with 32 default lazy-seed + journal auto-creation, `ReflectionsPage` with 3 tabs). This build adds the **rhythm shell** around existing infrastructure — Morning and Evening modals that auto-open on first dashboard visit during their active hours, collapse to breathing-glow dashboard cards, and consume data from already-built features (Guiding Stars, Best Intentions, Tasks, Calendar, Reflections).

The Enhancement Addendum (2026-04-07) adds 8 enhancements that transform rhythms into the platform's onboarding engine: rotating conversational tomorrow capture with fuzzy task matching, MindSweep-Lite brain dumps with Haiku dispositions, BookShelf semantic morning insights, feature discovery nudges, carry-forward fallback behavior, tracker rhythm surfacing, On-the-Horizon 7-day lookahead, and a full tailored teen experience. Those are scoped to Phases B, C, and D — **Phase A builds only the foundation.**

Phase A is foundation, not cosmetic. Without it, none of the enhancements can render. The evening rhythm narrative arc (celebrate → plan → clear head → reflect → close) requires all 13 base sections in place even if some surface as stubs until Phase B adds the AI pieces. Guided/Play members do NOT get the adult evening rhythm — at evening rhythm time, they trigger `DailyCelebration` from PRD-11 (already built). The mood triage section is **removed** from the default evening sequence per founder decision in Enhancement 6 ("Moms will literally always be drained or tired. That's not a mood, that is the phase of life we are in."). The `mood_triage` column on `rhythm_completions` stays in schema for future use but is not populated by default.

#### Dependencies Already Built

**Reflections infrastructure (reuse wholesale — do not rebuild):**
- `reflection_prompts` table with `daily_life` category (migrations 00000000100071, 00000000100072)
- `reflection_responses` table with RLS — mom reads children's, dad's responses private via existing `rr_parent_reads_children` policy
- `useReflections.ts` hook — CRUD on prompts, save/update responses, auto-create journal entries with category tags, archive/restore, reorder, 32 default lazy-seed
- `ReflectionsPage.tsx` — 3 tabs (Today, Past, Manage) at `/reflections`
- `ReflectionsTodayTab`, `ReflectionsPastTab`, `ReflectionsManageTab`, `ReflectionQuestionCard` components
- `WriteDrawerReflections` (Guided shell) — mini reflection pattern already proven for embedding
- `reflections_basic` + `reflections_custom` feature keys already in registry
- **`journal_entries.tags TEXT[]`** already exists since migration 00000000000006 (line 17) — no column addition needed

**Dashboard section system (PRD-14 — fully operational data-driven renderer):**
- `src/components/dashboard/dashboardSections.ts` — `SECTION_KEYS` enum (`greeting`, `calendar`, `active_tasks`, `widget_grid`, `best_intentions`, `next_best_thing`, `celebrate`), `SECTION_META`, `DEFAULT_SECTIONS`, `getSections(dashboardConfig?.layout)` reads from `dashboard_configs.layout.sections` JSONB
- `DashboardSectionWrapper.tsx` — drag/collapse/visibility controls via `dnd-kit`
- `Dashboard.tsx` — `localSections` state, `updateSection()`, switch-on-section-key renderer
- Greeting section already built with Guiding Star rotation

**Data consumers already built:**
- `useGuidingStars(memberId)` — `src/hooks/useGuidingStars.ts:33` — returns active non-archived entries ordered by `entry_type + sort_order`
- `useBestIntentions(memberId)` — `src/hooks/useBestIntentions.ts:46` — returns active non-archived ordered by `is_active DESC + sort_order ASC`
- `CalendarWidget` — `src/components/calendar/CalendarWidget.tsx` — supports `personalMemberId` filter, week/month view with tasks + events
- `DashboardTasksSection` — `src/components/tasks/DashboardTasksSection.tsx` — renders active tasks list
- `NotepadDrawer` — `src/components/notepad/NotepadDrawer.tsx` — full Smart Notepad (will wrap with lighter embed shell for Brain Dump)

**Victory Recorder + activity log infrastructure:**
- `victories.source` enum ALREADY includes `'reflection_routed'` (migration 00000000100102, line 41) — no update needed
- `VictoryRecorder` page built (non-guided shells)
- `activity_log_entries` table exists (migration 00000000000009:406-423); trigger pattern established
- `DailyCelebration` component built (PRD-11 Phase 12C, 2026-04-02)

**Routing and navigation:**
- `RoutingStrip` — `src/components/shared/RoutingStrip.tsx:70-100` — destinations: calendar, tasks, list, journal, guiding_stars, best_intentions, victory, track, messages, ideas, template, hidden, lila, mindsweep, request. **No `rhythm_capture` yet — must add.**
- `Sidebar.tsx:34-141` — Capture & Reflect section already has "Journal", "Reflections", "Morning Rhythm", "Evening Review" entries pointing to `/rhythms/morning` and `/rhythms/evening` (currently placeholder pages at `src/pages/placeholder/index.tsx:38,42`)
- `App.tsx` — `/rhythms/morning` → `MorningRhythmPage` (placeholder), `/rhythms/evening` → `EveningReviewPage` (placeholder), `/reflections` → real `ReflectionsPage`, no `/rhythms/settings` route yet

**Enhancement dependencies (used in Phase B/C, not Phase A, but confirmed present):**
- `TaskBreaker` component + `task-breaker` Edge Function (for Enhancement 8 On the Horizon)
- `match_book_extractions()` RPC (migration 00000100092:56) — for Enhancement 3 Morning Insight
- `mindsweep-sort` Edge Function (migration 00000100093) — for Enhancement 2 MindSweep-Lite reuse or inspiration

#### Dependencies NOT Yet Built

- **PRD-05 (LiLa Core) day-data context assembly enhancement** — required for LiLa dynamic reflection prompts. Phase A ships without dynamic prompts.
- **PRD-05 (LiLa Core) `contextual_help` context injection** — required for tooltip "What's this?" rollout. Phase A does NOT ship tooltip enhancement.
- **PRD-03 (Design System) Tooltip component "What's this?" link support** — same deferral.
- **PRD-12A (Personal LifeLantern)** — Quarterly Inventory reads `life_lantern_areas` staleness. Stub in Phase B.
- **PRD-15 (Messages/Requests/Notifications)** — currently being built in Build G. Required for (a) teen rhythm request flow to `family_requests`, (b) MindSweep-Lite "delegate" disposition creating messages, (c) rhythm completion notifications. Phase A does not depend on PRD-15.
- **PRD-16 (Meetings)** — Weekly/Monthly Review deep-dive links + Completed Meetings section. Stub until wired.
- **Studio rhythm templates** — no `rhythm_templates` table yet. Stub until post-MVP content sprint.
- **Embedded Smart Notepad mini-component** — does NOT exist. Phase A creates a lightweight wrapper around `NotepadDrawer` for the Brain Dump rhythm section.

#### Build Items (Phase A — 15 items)

**1. Migration 00000000100103: `rhythms_foundation.sql`**
- `rhythm_configs` table — per-member configuration with `sections JSONB` (ordered array), `section_order_locked BOOLEAN` (true for evening), `timing JSONB`, `auto_open BOOLEAN`, `reflection_guideline_count INTEGER`, `source_template_id`, `archived_at`
- `rhythm_completions` table — per-period tracking with `period TEXT` (YYYY-MM-DD / YYYY-W## / YYYY-MM / YYYY-Q#), `status` ('pending','completed','dismissed','snoozed'), `mood_triage` nullable (preserved in schema but not populated), `metadata JSONB` (`priority_items`, `mindsweep_items`, `brain_dump_notepad_tab_id`), `snoozed_until`, `completed_at`, `dismissed_at`
- `feature_discovery_dismissals` table — per-member feature discovery dismissal tracking (used by Phase C but schema created in Phase A)
- `morning_insight_questions` table — empty in Phase A; Phase C seeds 20 adult + 15 teen questions
- RLS: members manage own; mom reads all family completions; mom configures all family rhythm configs
- Indexes: UNIQUE `(family_id, member_id, rhythm_key)` on configs, UNIQUE `(family_id, member_id, rhythm_key, period)` on completions, `(family_id, member_id, status)` on completions, `(family_id, member_id, enabled)` on configs
- `set_updated_at` trigger on `rhythm_configs`
- Activity log trigger on `rhythm_completions` INSERT (`event_type='rhythm_completed'`)
- Feature keys added: `rhythms_basic`, `rhythms_periodic`, `rhythms_custom`, `reflections_export`, `rhythm_dynamic_prompts`, `rhythm_morning_insight`, `rhythm_feature_discovery`, `rhythm_mindsweep_lite`, `rhythm_on_the_horizon`, `rhythm_tracker_prompts` (10 new keys; `reflections_basic` + `reflections_custom` already exist)
- Default `rhythm_configs` seeding trigger on `family_members` INSERT — per-role templates (mom/adult/teen/guided/play). Morning active, Evening active, Weekly Review active, Monthly off, Quarterly off. Teen template uses Enhancement 7 base structure (framing language seeded in Phase D)
- Backfill existing family members with default rhythm_configs via idempotent UPSERT

**2. TypeScript types (`src/types/rhythms.ts`)**
- `RhythmKey`, `RhythmType`, `RhythmStatus`, `SectionType`, `RhythmSection`, `RhythmConfig`, `RhythmCompletion`, `RhythmTiming`, per-role default template constants

**3. Hooks (`src/hooks/useRhythms.ts`)**
- `useRhythmConfigs(memberId)`, `useRhythmConfig(memberId, rhythmKey)`, `useRhythmCompletion(memberId, rhythmKey, period)`, `useTodaysRhythmCompletions(memberId)`, `useCompleteRhythm()`, `useSnoozeRhythm()`, `useDismissRhythm()`, `useUpdateRhythmConfig()`, `useActiveRhythmForTime(memberId)`

**4. Date-seeded PRNG utility (`src/lib/rhythm/dateSeedPrng.ts`)**
- Deterministic PRNG seeded by `(memberId, date, rhythm_key)`. Same inputs always produce same output — used for rotation in Guiding Star, Scripture/Quote, Reflections sections.

**5. Section renderer system (`src/components/rhythms/sections/`)**
- `SectionRendererSwitch.tsx` — switch on `section.section_type` → renders correct component
- Auto-hide logic when data empty (Guiding Star hides if no entries, Scripture hides if no entries, Completed Meetings hides if none, Milestone Celebrations hides if none, Before You Close the Day hides if nothing pending)

**6. Morning Rhythm section components**
- `GuidingStarRotationSection`, `BestIntentionsFocusSection`, `TaskPreviewSection` (wraps `DashboardTasksSection` read-only), `CalendarPreviewSection` (wraps `CalendarWidget` with `personalMemberId` day view), `BrainDumpSection` (embedded Smart Notepad, writes `notepad_tabs` with `source_type='rhythm_capture'`), `PeriodicCardsSlot` (renders nothing in Phase A)

**7. Evening Rhythm section components**
- `EveningGreetingSection`, `AccomplishmentsVictoriesSection` (reads `victories` + today's task completions, deduped), `CompletedMeetingsSection` (stub until PRD-16), `MilestoneCelebrationsSection`, `ClosingThoughtSection`, `FromYourLibrarySection`, `BeforeCloseTheDaySection`, `ReflectionsSection` (3 rotating questions via PRNG, existing `useSaveResponse` with `source_context='evening_rhythm'`, "See all questions →" link to `/reflections`), `CloseMyDayActionBar`
- Carry Forward section preserved as toggleable but OFF by default
- Mood triage NOT in default sequence (Enhancement 6 removal)
- MindSweep-Lite section component stubbed (Phase C builds the AI logic)
- Tomorrow Capture section stubbed (Phase B builds rotating prompts + fuzzy match)

**8. `MorningRhythmModal` + `MorningRhythmCard`**
- Auto-open once per day on first dashboard visit during morning hours (member's configured wake time → noon)
- Non-blocking modal, themed header, section cards, bottom action bar
- `[Start My Day]` → writes `rhythm_completions` with `status='completed'`
- `[Snooze ▾]` → dropdown (30 min / 1 hr / Dismiss for today) → `snoozed_until` or `dismissed`
- Breathing-glow card states: pending / completed / snoozed

**9. `EveningRhythmModal` + `EveningRhythmCard`**
- Same delivery pattern as morning — auto-open during evening hours
- **Fixed section sequence** — `section_order_locked=true`. Sections toggle on/off but NEVER reorder
- `[Close My Day]` commits completion + Phase B/C metadata when wired

**10. Dashboard integration**
- `dashboardSections.ts` — add `morning_rhythm` and `evening_rhythm` keys with `is_auto_managed=true`, `hideable=false`
- `Dashboard.tsx` — render rhythm cards at position 0 when their period is pending/in-progress
- Reuse existing `BreathingGlow` component from PRD-17
- Edit mode must NOT allow hiding rhythm sections

**11. `RhythmsSettingsPage` (`/rhythms/settings`)**
- New route in `App.tsx`, new sidebar entry in `Sidebar.tsx` (under Settings, not a new top-level nav)
- Member picker (mom only)
- Active Rhythms list + Available Rhythms list + Custom Rhythms list (custom creation flow stubbed with `PlannedExpansionCard` for Phase A)
- Per-rhythm settings drawer: enable/disable, timing, section toggles, section reordering (not for evening), `[Restore Defaults]`
- `[Browse Studio Templates →]` PlannedExpansionCard

**12. Sidebar + routing updates**
- Replace placeholder pages at `/rhythms/morning` and `/rhythms/evening` — routes still exist but redirect to `/dashboard` (the real experience is the auto-open modal + breathing-glow card)
- Add `/rhythms/settings` route → `RhythmsSettingsPage`
- Add "Rhythms" Settings entry in Sidebar

**13. `rhythm_capture` routing destination**
- Add to `RoutingStrip` destinations
- BrainDumpSection writes `notepad_tabs` with `source_type='rhythm_capture'` — routing from the notepad tab writes back to rhythm context

**14. Guided/Play evening handoff**
- At evening rhythm time, detect member role; if `play`, trigger `DailyCelebration` instead of EveningRhythmModal
- No rhythm card appears for Play in evening — DailyCelebration is the experience
- **(scope addition 2026-04-07)** Guided members DO get an evening rhythm — see item 16 below. Play stays unchanged.
- `rhythm_completions` records still written for completion tracking

**15. TypeScript check**
- `tsc -b` — zero errors before declaring Phase A complete

**16. Mini evening rhythm for Guided (mid-build scope addition, 2026-04-07)**
- Migration `00000000100104_guided_evening_rhythm.sql` — extends `auto_provision_member_resources()` to also seed an evening rhythm config for Guided members + backfills 3 existing active Guided members across the database (Mosiah in OurFamily, plus 2 Jordans in test families)
- Coexists with the existing CelebrateSection — Celebrate button still launches DailyCelebration overlay separately. The mini evening rhythm is a structured 3-section daily check-in modal; DailyCelebration is the sparkly celebration overlay.
- 3 new section types added to `RhythmSectionType` union: `guided_day_highlights`, `guided_pride_reflection`, `guided_tomorrow_lookahead`
- 3 new section components in `src/components/rhythms/sections/guided/`:
  - `GuidedDayHighlightsSection` — reads today's victories with kid framing ("Look at what you did today!"), warm empty state for quiet days
  - `GuidedPrideReflectionSection` — single hardcoded prompt "Is there anything you're proud of yourself for today?", textarea writes directly to `journal_entries` with `entry_type='reflection'`, `tags=['reflection','guided_evening','pride']`, `visibility='shared_parents'`
  - `GuidedTomorrowLookAheadSection` — single hardcoded prompt "What are you looking forward to tomorrow?", same architecture as Pride section, `tags=['reflection','guided_evening','tomorrow']`
- Reading Support flag (`readingSupport`) flows from `GuidedDashboard` → `RhythmDashboardCard` → `RhythmModal` → `SectionRendererSwitch` → each section component. Guided sections show a `Volume2` icon that reads the prompt aloud via `speechSynthesis` when reading support is enabled.
- `'evening_rhythm'` added to `GUIDED_SECTION_KEYS` in `src/types/guided-dashboard.ts` (slot before `celebrate`). `getGuidedSections()` auto-merges the new key into existing dashboard configs on next read — no `dashboard_configs` backfill needed.
- `GuidedDashboard.renderSection` adds a case for `evening_rhythm` that renders `<RhythmDashboardCard rhythmKey="evening" readingSupport={...} />`. The card renders without the collapsible wrapper (same pattern as `greeting` and `next_best_thing`).
- `GuidedManagementScreen.SECTION_LABELS` updated to include `evening_rhythm: 'Evening Check-in'` for the management UI
- **No new tables, no new feature keys.** Reuses the existing `rhythm_configs` / `rhythm_completions` infrastructure built in migration 100103.
- **Reflection responses do NOT use `reflection_prompts`/`reflection_responses` infrastructure.** Two reasons: (a) the lazy-seed in `useReflectionPrompts` only fires on `/reflections` page visit, which Guided kids don't visit; (b) the prompts are hardcoded so a `reflection_prompts` row would be redundant. Direct `journal_entries` writes use the existing journal RLS, which already lets mom see kids' reflections via View As.
- **Reuses existing `RhythmModal` and `RhythmDashboardCard`** rather than building Guided-specific variants. Same auto-open logic, snooze menu, completion flow. UI tightening for kid-friendly tone is deferred to a polish pass.
- Verification: Mosiah's evening rhythm config has 4 sections in correct order (highlights → pride → tomorrow → close), `section_order_locked=true`. Database total: 21 evening rhythms (was 18 adults + 3 new Guided). `tsc -b --force` clean.

**17. Position 0 fix + Guided reflections expansion (mid-build follow-up, 2026-04-07)**

Two issues surfaced after the initial Guided evening rhythm landed:

**(a) Position 0 bug.** The rhythm cards were rendering at the BOTTOM of the dashboard instead of at position 0 as PRD-18 + the Cross-PRD Impact Addendum specify. Root cause: the `getSections()` helper merges missing default keys at the END of the saved layout, not at their default position. For existing dashboard_configs whose layouts were saved before the rhythm keys were added, the rhythm sections got appended.

**Fix:** Removed `morning_rhythm` and `evening_rhythm` from the section registry entirely (`SECTION_KEYS`, `SECTION_META`, `DEFAULT_SECTIONS`). Same for Guided (`GUIDED_SECTION_KEYS`, `SECTION_LABELS`). The `RhythmDashboardCard` now renders DIRECTLY at position 0 in `Dashboard.tsx` and `GuidedDashboard.tsx`, OUTSIDE the data-driven section system. This is more robust than fixing the merge logic because:
  - The user's saved layout doesn't need to know about rhythm cards at all
  - Edit mode can never accidentally hide them
  - New rhythm types in the future don't require schema migration of dashboard_configs
  - Truly auto-managed semantics — never reorderable, never hideable
- The card itself still self-hides when outside its time window AND has no completion record, so the slot is invisible most of the day.
- Adult Dashboard renders both morning + evening cards above all sections. Guided/Play kids are excluded from the adult evening card because guided members render their own evening card inside `GuidedDashboard`.
- `sortableSectionIds` no longer needs to filter rhythm keys (they're not in `activeSections` anymore).

**(b) Guided reflections section + rotating wordings.** Tenise asked for: (i) rotating wordings on Pride and Tomorrow sections so the kid doesn't see the same exact prompt every night, and (ii) a NEW reflection section that pulls from the existing reflection_prompts library, picks one of 20 child-appropriate prompts via PRNG, with an inline "View All" expander to swap.

**Pride wordings (6 rotations):** "Is there anything you're proud of yourself for today?" / "What's something you did today that made you feel good about yourself?" / "What's a moment from today you want to remember?" / "Was there a time today when you tried hard at something?" / "What's something kind of awesome you did today?" / "Did anything happen today that you're glad about?"

**Tomorrow wordings (6 rotations):** "What are you looking forward to tomorrow?" / "What's one thing you're excited about for tomorrow?" / "Is there anything special about tomorrow?" / "What's something you want to try or do tomorrow?" / "What would make tomorrow a really good day?" / "What's on your mind for tomorrow?"

The active wording is picked deterministically via `pickOne(WORDINGS, rhythmSeed(memberId, 'evening:pride'/'evening:tomorrow', new Date()))` — same kid sees same wording all day, different tomorrow. The selected wording is saved INTO the journal entry content so the historical record shows which version was answered. Tags stay constant.

**New `GuidedReflectionsSection`:**
- Reads from existing `reflection_prompts` library via `useReflectionPrompts` (lazy-seeds 32 default prompts on first call, same as `WriteDrawerReflections`)
- Filters to 20 hardcoded child-friendly sort_orders: `[1, 2, 3, 4, 5, 8, 9, 12, 13, 20, 21, 22, 24, 25, 26, 28, 29, 30, 31, 32]` — picked from the original 32 by excluding adult/abstract/judgmental ones (full rationale in the component file)
- Date-seeded PRNG picks ONE active prompt for the day (key `'evening:guided_reflections'`)
- "View All questions" inline expander shows all 20 as tappable buttons; tapping one swaps the active prompt and collapses the list. Override is session-only — next day a new prompt rotates in via PRNG.
- Save uses the existing `useSaveResponse` mutation, which writes BOTH a `reflection_responses` row AND a `journal_entries` row with category-derived tags. Mom finds these in /reflections Past tab via View As AND in the kid's journal under the relevant category tag.
- Reading Support: Volume2 icon reads the active prompt aloud
- Already-answered prompts in the View All list show a "✓" prefix
- **Architecture mirrors the planned teen evening reflection** (Enhancement Addendum decision 30: "1-2 reflection questions per evening, pulled from teen-appropriate prompts filtered from the existing pool"). Guided gets 1 question by default with the View All escape hatch.
- Mom-controlled curation via `preferences.reflection_prompts` is NOT wired in this build — the 20 sort_orders are platform-curated. Phase B can wire the preference if needed.

**New section sequence (5 sections, was 4):**
1. `guided_day_highlights` — today's victories with kid framing
2. `guided_pride_reflection` — rotating wording, direct journal_entries write
3. `guided_reflections` — NEW, library-backed, PRNG pick, View All
4. `guided_tomorrow_lookahead` — rotating wording, direct journal_entries write
5. `close_my_day` — completion action

**Migration filename collision:** I initially named the migration `00000000100105_guided_evening_reflections.sql` but discovered there was already an `00000000100105_linked_steps_mastery_advancement.sql` from the parallel PRD-09A/09B "Build J" Linked Steps session. The Linked Steps SQL was already applied AND recorded in `supabase_migrations.schema_migrations` (verified directly), but having two files at the same version number confused `db push --dry-run`. **Renamed to `00000000100106_guided_evening_reflections.sql`** to resolve the collision. Did NOT touch the Linked Steps migration — outside this build's scope.

**Migration 00000000100106:** Replaces `auto_provision_member_resources()` to seed the new 5-section evening rhythm for new Guided members. Backfills existing 3 active Guided members across the database via idempotent UPDATE that only fires when `sections @> '[{"section_type":"guided_reflections"}]'::jsonb` is FALSE.

**TaskCard.tsx note:** During clean-rebuild verification, `tsc -b --force` initially showed errors in `src/components/tasks/TaskCard.tsx`. Investigation showed these are uncommitted changes from the parallel Linked Steps "Build J" (references `onSubmitMastery`, `GraduationCap`, `ExternalLink` — Linked Steps mastery features). Errors are NOT in any file I touched. After clearing `.tsbuildinfo` cache files, `tsc --noEmit` and `tsc -b` both exit 0 cleanly. **Surface this to the Linked Steps build owner: TaskCard.tsx has uncommitted unresolved references that may fail Vercel deploy in strict mode if not resolved before commit.**

**Verification:** Backfill confirmed via `npx supabase db query --linked` — all 3 existing Guided members have evening rhythm with 5 sections in correct order (highlights → pride → reflections → tomorrow → close). `npx tsc --noEmit` clean (zero errors). `npx tsc -b` clean after clearing tsbuildinfo cache.

#### Stubs (NOT Building Phase A)

**All 8 Enhancement Addendum enhancements deferred to later phases:**
- **Enhancement 1** (Evening Tomorrow Capture + Morning Priorities Recall + `rhythm_priority` task source) — Phase B
- **Enhancement 2** (MindSweep-Lite + Haiku dispositions + batched Close My Day commit) — Phase C
- **Enhancement 3** (Morning Insight with BookShelf semantic pull + 20 question pool) — Phase C
- **Enhancement 4** (Feature Discovery with 2-3x/week gate + dismiss + engagement tracking) — Phase C
- **Enhancement 5** (Carry Forward fallback behavior + midnight cron + backlog prompt) — Phase B
- **Enhancement 6** (Tracker `rhythm_keys` multi-select in widget settings) — Phase C
- **Enhancement 7** (Independent Teen tailored experience) — Phase D
- **Enhancement 8** (On the Horizon 7-day lookahead + Task Breaker integration) — Phase B

**Other deferrals:**
- Weekly Review / Monthly Review / Quarterly Inventory inline cards — Phase B
- Studio rhythm template library (7-10 templates) — post-MVP content sprint, no `rhythm_templates` table yet
- Teen rhythm request flow through Universal Queue Modal — depends on PRD-15
- LiLa dynamic reflection prompts — depends on PRD-05 day-data context enhancement
- Tooltip + "What's this?" → LiLa contextual help rollout — depends on PRD-03 + PRD-05 enhancements
- LifeLantern Check-in staleness — depends on PRD-12A
- Completed Meetings section — depends on PRD-16
- Weekly / Monthly Review deep-dive links — depends on PRD-16 meeting types
- Rhythm completion indicators on Family Overview — wire post-build (PRD-14C already built, just needs query)
- Reflection export as formatted document — post-MVP
- Premium reflection prompt packs — post-MVP
- Push notifications for rhythm reminders — post-MVP
- Voice-to-text for reflection answers — post-MVP
- Renewal Dimension Rotation section type — post-MVP, belongs in Sabbath studio template
- Reflection sharing on Family Hub — post-MVP
- Rhythm analytics — post-MVP

#### Key Decisions

1. **Phase A is foundation only.** None of the 8 enhancements ship in Phase A. The evening rhythm sequence is complete at 13 sections, but MindSweep-Lite / Tomorrow Capture render as stubs in Phase A and fill in during Phase B/C. This preserves the narrative arc without blocking on AI infrastructure.
2. **Reflections infrastructure is reused wholesale.** `reflection_prompts`, `reflection_responses`, `useReflections`, `ReflectionsPage`, 32 default prompts, journal entry auto-creation with tags — all already built. Phase A's `ReflectionsSection` is a thin wrapper pulling 3 rotating questions via PRNG and saving via the existing hook.
3. **`journal_entries.tags TEXT[]` already exists** (migration 100006) — the PRD-18 Cross-PRD Impact Addendum schema change is already applied.
4. **`victories.source` already includes `'reflection_routed'`** (migration 100102) — no enum update needed.
5. **Mood triage removed from default evening sequence** per Enhancement Addendum founder decision. Column preserved in schema.
6. **Guided/Play evening handoff to DailyCelebration** — already built. Phase A enforces the time-trigger handoff.
7. **Auto-open modal triggers once per period.** After dismissal, only the breathing-glow dashboard card is shown until the next period.
8. **Rhythm cards are `is_auto_managed=true`** — inserted at position 0 in Dashboard section list. Edit mode cannot hide them.
9. **Date-seeded PRNG for rotation.** Same prompts/stars on same day if user re-opens the rhythm. Non-negotiable for user trust.
10. **Sidebar nav entries already exist** — placeholder pages get replaced, nav doesn't gain morning/evening entries. Rhythms Settings is the only new nav entry.
11. **RLS inherits existing patterns** — members manage own, mom reads all children (dad's reflections remain private via existing `rr_parent_reads_children` policy).
12. **Zero blockers on PRD-15.** Phase A does not require messaging infrastructure.
13. **Embedded Smart Notepad is a thin wrapper around NotepadDrawer.** Phase A does not build a separate mini-Notepad component.
14. **The `mood_triage` column stays in schema.** Future-proofs against reactivation without requiring a new migration.
15. **Default rhythm configs seed on member insert via trigger**, with backfill for existing members via idempotent UPSERT in the migration itself.

---
