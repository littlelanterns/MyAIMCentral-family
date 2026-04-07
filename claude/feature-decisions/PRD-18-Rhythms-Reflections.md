# Feature Decision File: PRD-18 — Rhythms & Reflections

> **Created:** 2026-04-07
> **PRD:** `prds/daily-life/PRD-18-Rhythms-Reflections.md`
> **Addenda read:**
>   - `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-18-Enhancement-Addendum.md` (8 enhancements — Apr 7, 2026)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant)
> **Founder approved:** Pending

---

## What Is Being Built

Rhythms & Reflections is the daily heartbeat of MyAIM Family — configurable morning, evening, weekly, monthly, and quarterly check-in experiences that transform the app from a management tool into a living companion. Three rhythms ship active by default (Morning, Evening, Weekly Review), two ship available-but-off (Monthly, Quarterly), and mom can customize every section of every rhythm per family member. The Reflections page is already built as a standalone 3-tab surface (Today/Past/Manage) backed by existing `reflection_prompts` and `reflection_responses` tables — this build adds the rhythm shell around it, embeds a lightweight reflection experience inside the Evening Rhythm, and implements the 8 enhancements from the Enhancement Addendum that transform Rhythms into the platform's activation engine (conversational tomorrow capture, MindSweep-Lite brain dumps, BookShelf semantic morning insights, feature discovery nudges, carry-forward fallback behavior, tracker rhythm surfacing, On-the-Horizon awareness, and a full tailored teen experience). Rhythms auto-open as a modal on the first dashboard visit during their active hours and collapse to a breathing-glow dashboard card after dismiss. Guided and Play children do NOT get an adult evening rhythm — they trigger DailyCelebration (PRD-11) instead at evening rhythm time.

---

## Screens & Components

### Screen 1: Morning Rhythm (auto-open modal → dashboard card)
| Component | Notes |
|---|---|
| `MorningRhythmModal` | Vertically scrolling modal with themed header, section cards, bottom action bar `[Start My Day] [Snooze ▾]`. Auto-opens once per day on first dashboard visit during morning hours. Non-blocking. |
| `MorningRhythmCard` | Collapsed dashboard card state after dismiss/completion. Breathing glow when pending. Auto-inserts at position 0 in Dashboard section list. |
| `GuidingStarRotationSection` | One rotating declaration (date-seeded PRNG). Framing: "Remember who you are." Consumes `useGuidingStars` filtered by `is_included_in_ai=true`, `archived_at IS NULL`. Section hides if no entries. |
| `BestIntentionsFocusSection` | 2-3 active intentions with tap-to-celebrate checkmarks. Framing: "Today, remember to..." Consumes `useBestIntentions` filtered by `is_active=true`. Tap writes to `intention_iterations`. |
| `TaskPreviewSection` | Static snapshot of user's current dashboard task view. No carousel. Tappable → navigates to Tasks. Reuses `DashboardTasksSection` data. |
| `CalendarPreviewSection` | Today's events at a glance. Reuses `CalendarWidget` with `personalMemberId` filter and day view. Tappable → navigates to Calendar. |
| `BrainDumpSection` | Embedded Smart Notepad mini-component. Framing: "Anything on your mind?" On save, creates `notepad_tabs` with `source_type='rhythm_capture'` and rhythm context metadata. |
| `PeriodicCardsSlot` | Slot that renders Weekly/Monthly/Quarterly inline cards on their configured days. |
| `MorningPrioritiesRecallSection` | **(Enhancement 1)** "Here's what you wanted to focus on:" — reads previous evening's `rhythm_completions.metadata.priority_items` and shows the 3 selected focus items. Shows "and X more on your list" link if overflow items exist. |
| `OnTheHorizonSection` | **(Enhancement 8)** 7-day lookahead (configurable 3-14). Capped 3-5 items, nearest first. Shows title, due date, days remaining. Offers "Want to break this into steps?" launching `TaskBreaker` modal. Offers "Schedule time for this?" creating task/calendar block. Auto-hides items already in-progress. |
| `MorningInsightSection` | **(Enhancement 3)** "Something to think about" — one question from a 20-question pool + optional text input + 1-2 passively-matched BookShelf extraction snippets always shown + 2-3 semantic-search results on response via `match_book_extractions` RPC. Empty BookShelf: shows question + onboarding nudge. |
| `FeatureDiscoverySection` | **(Enhancement 4)** Appears 2-3x/week only. Activity-log-driven nudge with brief explanation + direct action link + dismiss. Dismiss removes feature from discovery pool per user. |

### Screen 2: Evening Rhythm (auto-open modal → dashboard card) — **FIXED SEQUENCE**
| # | Component | Notes |
|---|---|---|
| 1 | `EveningGreetingSection` | Personalized warm greeting. "How was your day, [Name]?" |
| 2 | `AccomplishmentsVictoriesSection` | Today's completed tasks + manual victories, deduplicated. Never shows what wasn't done. Reads from `victories` via PRD-11. |
| 3 | `CompletedMeetingsSection` | Today's meetings with summary links. Auto-hides if no meetings (PRD-16 stub — hides until wired). |
| 4 | `MilestoneCelebrationsSection` | Goal completions, streak milestones, achievement unlocks. Auto-hides if none. |
| 5 | `CarryForwardSection` | **OFF by default.** Per-task triage preserved as opt-in. Replaced by fallback behavior (Enhancement 5). |
| 6 | `EveningTomorrowCaptureSection` | **(Enhancement 1)** Rotating header (4 framings cycled nightly). 3 default text inputs + `[+]` button. Fuzzy-match against existing tasks → confirmation card → Yes (star existing) or No (create with `source='rhythm_priority'`). Overflow handling at 6+: prompt to pick top 3 or auto-select by due date. All items become real tasks; only 3 surface in morning recall. |
| 7 | `MindSweepLiteSection` | **(Enhancement 2)** Collapsed by default. Configurable auto-expand. Freeform textarea. On save → Haiku parses into discrete items + suggests disposition (Schedule/Delegate/Note/Backburner/Release). One-tap confirm or cycle dispositions. **All record creation batched on Close My Day**. Stored in `rhythm_completions.metadata.mindsweep_items`. |
| 8 | `ClosingThoughtSection` | One rotating Guiding Star entry displayed in full. |
| 9 | `FromYourLibrarySection` | One rotating Scripture/Quote entry from `guiding_stars` where `entry_type='scripture_quote'`. Auto-hides if no entries. |
| 10 | `BeforeCloseTheDaySection` | At-risk streaks, pending queue items, upcoming deadlines. Auto-hides if nothing pending. |
| 11 | `ReflectionsSection` | 3 rotating reflection questions via date-seeded PRNG from existing `reflection_prompts` library. Inline answer textareas. Saves to existing `reflection_responses` with `source_context='evening_rhythm'`. "See all questions →" link to `ReflectionsPage`. Routing NOT available here (kept lightweight). |
| 12 | `RhythmTrackerPromptsSection` | **(Enhancement 6 — renamed from "Custom Tracker Prompts")** Any trackers configured with `rhythm_keys` containing `'evening'`. Reads from `dashboard_widgets.config.rhythm_keys`. Auto-hides if none. |
| 13 | `CloseMyDayActionBar` | `[Close My Day]` commits all batched records (MindSweep-Lite dispositions, tomorrow priorities). `[Open Journal]` / `[Talk to LiLa]` secondary actions. |

> **REMOVED:** "How Was Today?" Triage (mood check). `rhythm_completions.mood_triage` column preserved for future use but not populated by default. Per founder decision in Enhancement 6.

### Screen 3: Reflections Page (already built — PRESERVE)
| Component | Notes |
|---|---|
| `ReflectionsPage` | **BUILT** — `src/pages/ReflectionsPage.tsx`. 3 tabs (Today/Past/Manage). Do not rebuild. |
| `ReflectionsTodayTab` | **BUILT** — existing. Inline answer textareas. |
| `ReflectionsPastTab` | **BUILT** — existing. Date-grouped history. |
| `ReflectionsManageTab` | **BUILT** — existing. Prompt CRUD, archive/restore, custom creation. |
| `useReflections` hook | **BUILT** — `src/hooks/useReflections.ts`. 32 default lazy-seed, CRUD, auto-create journal entries with category tags. Do not rebuild. |
| `[Route →]` mini panel | **NEW** — per-response routing to Victory / LifeLantern / People / InnerWorkings. Per PRD only on Reflections page, not in evening rhythm. |

### Screen 4: Weekly Review (inline card in Morning Rhythm)
| Component | Notes |
|---|---|
| `WeeklyReviewCard` | Renders inline inside MorningRhythmModal on configured day (default Friday). |
| `WeeklyStatsSection` | Tasks completed/carried/cancelled, Best Intention iteration totals, active streaks. |
| `TopVictoriesSection` | 3-5 highlighted victories from the week. LiLa selects by importance + Guiding Star connections (fallback: most recent 5). |
| `NextWeekPreviewSection` | Upcoming tasks + meetings + dates + milestones. |
| `WeeklyReflectionPromptSection` | One rotating weekly-specific prompt. |
| `WeeklyReviewDeepDiveLink` | "Want to do a full weekly review?" → launches PRD-16 Weekly Review meeting (stub until PRD-16 wired). |

### Screen 5: Monthly Review (inline card, off by default)
| Component | Notes |
|---|---|
| `MonthlyReviewCard` | Same pattern as Weekly. 1st of month (configurable). |
| `MonthAtAGlanceSection` | Summary stats for the month. |
| `HighlightReelSection` | LiLa selects 3-5 significant victories or patterns (fallback: top by importance). |
| `ReportsLink` | Stub to Reports page. |
| `MonthlyReviewDeepDiveLink` | Stub to PRD-16 Monthly Review meeting. |

### Screen 6: Quarterly Inventory (inline card, off by default)
| Component | Notes |
|---|---|
| `QuarterlyInventoryCard` | ~90 days since last LifeLantern check-in (personalized, not calendar quarter). |
| `StaleAreasSection` | Lists LifeLantern areas by staleness. **Stub until PRD-12A is built** — shows placeholder text. |
| `QuickWinSuggestionSection` | "Start with [most stale area] — ~10-15 minutes." |
| `LifeLanternLaunchLink` | Navigates to LifeLantern Hub when built. |

### Screen 7: Rhythms Settings Page
| Component | Notes |
|---|---|
| `RhythmsSettingsPage` | New page at `/rhythms/settings` (or under Settings). Sidebar entry added. |
| `MemberPicker` | Mom can switch to configure any family member's rhythms. Shows all family members. Non-mom sees only their own. |
| `ActiveRhythmsList` | Enabled rhythms with `[⚙]` icon per row. |
| `AvailableRhythmsList` | Off-by-default rhythms with `[Enable]` buttons. |
| `CustomRhythmsList` | User-created custom rhythms with soft limit of 20 per member. |
| `RhythmSettingsDrawer` | Per-rhythm settings: enable/disable, timing, section toggles, section reordering (except Evening which is locked), per-section config, `[+ Add Section]`, `[Restore Defaults]`, `[Archive Rhythm]`. |
| `SectionTypePicker` | Library of all 32 section types for adding to custom rhythms or enabling in default rhythms. |
| `CustomRhythmCreationModal` | Name + interval + timing + assigned members + section picker. |
| `StudioTemplatesLink` | `[Browse Studio Templates →]` — stub until rhythm templates are built. |
| `CarryForwardFallbackSetting` | **(Enhancement 5)** Global dropdown per member: Stay / Roll forward / Expire / Backburner. Written to `family_members.preferences.carry_forward_fallback`. Also shows `backburner_days` (default 14) and `backlog_threshold` (default 10). |

### Screen 8: Rhythm Dashboard Card (collapsed state)
| Component | Notes |
|---|---|
| `RhythmDashboardCard` | Compact card in Dashboard section list. Three states: pending (breathing glow), completed (subtle check), snoozed ("Snoozed until [time]"). Tapping reopens modal. Forwards `readingSupport` flag down to `RhythmModal` for Guided shell sections. |

### Screen 9: Mini Evening Rhythm for Guided (mid-build scope addition, 2026-04-07)

> **Decision rationale:** Founder added this mid-build. Original Phase A had Guided/Play kids using DailyCelebration (PRD-11) at evening time as their only end-of-day surface. The addition recognizes that 8-12 year olds benefit from a structured daily check-in: highlights of what they did, a moment of pride, and forward-looking anticipation. Coexists with DailyCelebration — same kid, different moments.
>
> **Mom experience goal:** Mom can see what her Guided kid is proud of and what they're looking forward to without asking. Both reflections write to journal_entries with shared_parents visibility, so they show up in mom's journal-via-View-As naturally.

| Component | Notes |
|---|---|
| `GuidedDayHighlightsSection` | Reads today's victories with kid framing: "Look at what you did today!" Empty state: "Some days are quiet. That's a kind of brave too." Reading Support: Volume2 icon reads heading aloud. 48px touch targets. |
| `GuidedPrideReflectionSection` | **Rotating wording (6 framings, date-seeded daily PRNG)** of "what are you proud of?" — same kid sees same wording all day, different tomorrow. Selected wording saved into journal entry content for historical fidelity. Writes directly to `journal_entries` with `entry_type='reflection'`, `tags=['reflection','guided_evening','pride']`, `visibility='shared_parents'`. No `reflection_prompts` row needed (prompts are hardcoded). Reading Support: Volume2 reads active wording aloud. |
| `GuidedReflectionsSection` | **NEW (mid-build addition)** — pulls from existing `reflection_prompts` library via `useReflectionPrompts` (lazy-seeds 32 default prompts on first call). Filters to 20 hardcoded child-friendly sort_orders. Date-seeded PRNG picks ONE active prompt for the day. **Inline "View All questions" expander** shows all 20 as tappable buttons; tapping swaps the active prompt and collapses the list. Override is session-only — next day a new prompt rotates in. Save uses existing `useSaveResponse` (writes BOTH `reflection_responses` row AND `journal_entries` row with category-derived tags). Already-answered prompts in View All show "✓" prefix. Architecture mirrors planned teen evening reflection (Enhancement Addendum decision 30). |
| `GuidedTomorrowLookAheadSection` | **Rotating wording (6 framings, date-seeded daily PRNG)** of forward-looking question. Same architecture as Pride section. `tags=['reflection','guided_evening','tomorrow']`. |
| Reused: `RhythmDashboardCard` + `RhythmModal` | No Guided-specific variants. The 5-section evening rhythm (`guided_day_highlights` → `guided_pride_reflection` → `guided_reflections` → `guided_tomorrow_lookahead` → `close_my_day`) is `section_order_locked=true`. Narrative arc: recap → celebrate → reflect → anticipate → close. |
| Wired into `GuidedDashboard` at position 0 | **(Position 0 fix)** Renders `<RhythmDashboardCard rhythmKey="evening" readingSupport={...} />` DIRECTLY at the top of GuidedDashboard, OUTSIDE the data-driven section system. Truly auto-managed — never in saved layout, never reorderable, never hideable. Self-hides when outside evening window AND no completion. Replaces the earlier (broken) approach of including `evening_rhythm` in `GUIDED_SECTION_KEYS`. |
| Migration `00000000100104_guided_evening_rhythm.sql` | Initial trigger + backfill for 4-section evening rhythm. Replaces `auto_provision_member_resources()` to seed both morning AND evening for Guided. Backfills 3 existing Guided members. **Play kids stay unchanged — no evening rhythm.** |
| Migration `00000000100106_guided_evening_reflections.sql` | **(Mid-build follow-up)** Updates the trigger AND backfills the 3 existing Guided members' evening sections JSONB to add the new `guided_reflections` section in correct order (between Pride and Tomorrow). Idempotent — only updates rows whose sections array doesn't already contain `guided_reflections`. **Renamed from 100105 → 100106** due to filename collision with parallel Linked Steps "Build J" migration. |

### Shared / Pattern components
| Component | Notes |
|---|---|
| `EmbeddedNotepad` | **NEW** — Mini Smart Notepad for rhythm text inputs. Simpler than `NotepadDrawer`. Writes to `notepad_tabs` with `source_type='rhythm_capture'` + rhythm context metadata. Auto-routes when destination obvious; manual routing when ambiguous. |
| `SectionRendererSwitch` | Switch on `section.section_type` → renders correct component. Extensible — new section types require only new component + registry entry. |

---

## Key PRD Decisions (Easy to Miss)

1. **Reflections tables & page are ALREADY BUILT** — `reflection_prompts`, `reflection_responses`, `ReflectionsPage`, `useReflections.ts`. This build does NOT rebuild them. The Evening Rhythm `ReflectionsSection` wraps the existing data layer with a 3-prompt rotation and `source_context='evening_rhythm'`.
2. **`journal_entries.tags TEXT[]` ALREADY EXISTS** (migration 00000000000006, line 17). No new migration needed for this column. The Cross-PRD Impact Addendum's PRD-08 schema change is already applied.
3. **`victories.source` ALREADY INCLUDES `'reflection_routed'`** (migration 00000000100102, line 41). No enum update needed.
4. **Sidebar nav already has Morning Rhythm / Evening Review entries** pointing to `/rhythms/morning` and `/rhythms/evening` placeholder pages. This build replaces the placeholders, does not add new nav entries.
5. **Dashboard section system is data-driven** via `src/components/dashboard/dashboardSections.ts` — `SECTION_KEYS` enum + `SECTION_META` + `DEFAULT_SECTIONS`. Adding rhythm sections requires: (a) add keys to enum, (b) add metadata, (c) add renderer in Dashboard.tsx switch, (d) set `is_auto_managed=true` so edit mode cannot hide them.
6. **Evening Rhythm has FIXED section sequence** — toggleable on/off but NOT reorderable. Intentional exception to the general reorderable pattern. Narrative arc: celebrate → plan → clear head → reflect → close.
7. **Mood triage section REMOVED from default evening sequence** per Enhancement Addendum founder decision. `mood_triage` column on `rhythm_completions` stays in schema for future use but is not populated by default. Mood tracking, if desired, is a user-created tracker widget per Enhancement 6.
8. **Carry Forward section is OFF by default** and stays toggleable. Enhancement 5 replaces it with a global fallback behavior setting (Stay/Roll forward/Expire/Backburner) at the member level, applied silently at midnight by a pg_cron job or trigger.
9. **Guided and Play children do NOT get an adult evening rhythm.** At evening rhythm time, they trigger `DailyCelebration` from PRD-11 (already built). PRD-18 only specifies the handoff.
10. **Rhythm cards auto-manage visibility** — they insert at position 0 in the Dashboard section list when due, show completed state after completion, disappear after period boundary resets. Dashboard edit mode must not allow hiding them.
11. **Rotation is date-seeded PRNG, not random** — same prompts/stars appear on same day if user re-opens the rhythm. Critical for user trust.
12. **Tomorrow Capture uses rotating prompt framing** — 4 wordings cycled nightly so the section doesn't feel like a nightly to-do list chore. Fuzzy match behavior identical regardless of framing.
13. **Tomorrow Capture overflow at 6+ items** — all items become real tasks with `source='rhythm_priority'`; only 3 surface in Morning Priorities Recall (either user-selected or auto-selected by nearest due date).
14. **MindSweep-Lite record creation is BATCHED on Close My Day** — nothing gets created mid-flow. User dumps text, AI suggests dispositions, user confirms, system waits. Only when user taps Close My Day do the records actually get created. Stored as intent in `rhythm_completions.metadata.mindsweep_items` until commit.
15. **MindSweep-Lite "Release" disposition creates NO record.** The act of naming it and choosing to release is the value.
16. **Morning Insight does LIVE pgvector queries** — not precomputed. HNSW index is sub-100ms. Passive matches on the question + active matches on the response. Empty BookShelf shows question + onboarding nudge, not empty state.
17. **Feature Discovery nudges appear 2-3x/week, NOT every day** — at least one discovery-free morning per week. Engagement tracking distinguishes "viewed" (does NOT exit pool) from "engaged" (creates content — exits pool).
18. **On the Horizon excludes items due TODAY** (those are in Task Preview) and items with no due date.
19. **Teen morning framing uses ownership language** ("You said this matters to you:") not directive language ("Remember who you are").
20. **Teen MindSweep-Lite dispositions DIFFER from adult** — Schedule / Journal about it / Talk to someone / Let it go. Haiku prompt must include teen-calibrated examples in system prompt.
21. **Teen evening shows 1-2 reflection questions, not 3.** Lighter touch. Teen morning insight questions come from a SEPARATE 15-question teen pool.
22. **Dad's reflections are PRIVATE.** Mom cannot read them via View As. The existing RLS on `reflection_responses` already enforces this (`rr_parent_reads_children` policy excludes `additional_adult` role).
23. **Teen reflections are VISIBLE to mom** via standard View As. Teen sees TransparencyIndicator on Reflections page (already built).
24. **Auto-open modal triggers EXACTLY ONCE per period.** If user dismisses, only the dashboard card is shown until the next period begins (next morning / next evening).

---

## Addendum Rulings

### From `PRD-18-Cross-PRD-Impact-Addendum.md`:
- **Journal tag-based filtering is the architectural direction**: one unified Journal with `tags TEXT[]` filtered views, not sub-pages per entry_type. Already implemented — `journal_entries.tags` exists and `useReflections` auto-creates entries with category tags.
- **Add `rhythm_request` to `studio_queue.source` enum** for teen rhythm requests (deferred until teen request flow is built in Phase D).
- **Rhythm cards auto-insert at position 0 in Dashboard section list** with `is_auto_managed=true` — Dashboard edit mode cannot hide them.
- **PRD-03 tooltip "What's this?" enhancement is deferred** — pattern is established here; each future feature implements it. This build does NOT ship tooltip enhancement.
- **PRD-05 contextual_help context injection is deferred** — same reason. Dynamic prompt generation also deferred until PRD-05 day-data context is ready.
- **`rhythm_completions.mood_triage` is available as LiLa context source** — will wire when PRD-05 context enhancement is built. Column exists from Phase A but empty.
- **Rhythms do NOT register in LiLa guided mode registry.** They are consumption surfaces and context sources, not conversation modes.
- **Guided/Play evening handoff to DailyCelebration (PRD-11)** — already built, this build only enforces the time-trigger handoff.

### From `PRD-18-Enhancement-Addendum.md` (37 numbered decisions):

**Enhancement 1 — Evening Tomorrow Capture:**
1. Fuzzy match with confirmation, not silent — "Did you mean this task?" with [Yes].
2. Auto-created tasks tagged `source='rhythm_priority'`.
3. Stored in `rhythm_completions.metadata.priority_items` JSONB.
4. New section type **#31 "Morning Priorities Recall"** — sits between Guiding Star rotation and Task Preview in morning.
5a. Rotating prompt language (4 framings cycled nightly).
5b. 3 default inputs + `[+]` overflow + ADHD-aware overflow handling at 6+.

**Enhancement 2 — MindSweep-Lite:**
5. Haiku auto-suggests disposition with one-tap confirm/override.
6. Batch all record creation on Close My Day.
7. Collapsed by default, occasionally auto-expands.
8. New section type **#28 "MindSweep-Lite"** — available in Evening + Custom.

**Enhancement 3 — Morning BookShelf Semantic Pull:**
9. Section name: "Something to think about".
10. Both passive (on question) + active (on response) semantic matches.
11. Live pgvector query via `match_book_extractions` RPC, not precomputed.
12. 20-30 hand-authored questions + LiLa dynamic blend when ready.
13. Empty BookShelf shows question + onboarding nudge.
14. New section type **#29 "Morning Insight / BookShelf Discovery"** — morning + custom.

**Enhancement 4 — Smart Discovery Rotation:**
15. Interactive with direct action link, not just informational.
16. 2-3x/week, not every morning. At least one discovery-free day.
17. Dismiss per nudge + engagement tracking (viewed vs engaged).
18. New section type **#30 "Feature Discovery"** — morning + custom.

**Enhancement 5 — Carry Forward Redesign:**
19. Global fallback default with per-task override.
20. "Stay" as recommended default (ADHD-friendly).
21. Occasional backlog prompt, threshold-based, max once per week.
22. Carry Forward section preserved but OFF by default.

**Enhancement 6 — Tracker Rhythm Surface:**
23. Any tracker in any rhythm via `rhythm_keys` TEXT[] widget config.
24. Section Type #23 renamed from "Custom Tracker Prompts" to "Rhythm Tracker Prompts".
25. Mood tracking is NOT a default rhythm section. Founder quote: "Moms will literally always be drained or tired. That's not a mood, that is the phase of life we are in."

**Enhancement 7 — Independent Teen:**
26. Teens get full rhythm experience, not reduced sections.
27. Teen MindSweep-Lite dispositions differ: Schedule / Journal about it / Talk to someone / Let it go.
28. Teen morning framing uses ownership language ("You said this matters to you:").
29. Teen evening framing uses aspiration language ("What do you want to get done?").
30. 1-2 reflection questions per evening for teens (not 3).
31. 15 teen-specific morning insight questions.
32. BookShelf discovery nudge highlights school use case for teens.

**Enhancement 8 — On the Horizon:**
33. 7-day default lookahead, configurable 3-14.
34. Capped at 3-5 items, nearest first.
35. Task Breaker integration from the rhythm card.
36. Available for all roles, not just adults.
37. New section type **#32 "On the Horizon"** — morning + custom.

### From `PRD-Audit-Readiness-Addendum.md`:
- Record rationale on non-obvious decisions (applies to implementation comments).
- Tag deferred items consistently with `> **Deferred:**` notation in documentation.
- Name cross-PRD dependencies explicitly (applies to feature decision file — done above).
- Shell behavior tables must cover all 5 shells with no blanks (covered in Shell Behavior section below).
- Feature tooltips with "What's this?" convention established by PRD-18 — deferred implementation.
- "Mom experience goal" notes on key flows — preserved in PRD-18 section comments.
- Forward notes on launch-scoped constraints — see phasing decisions below.

---

## Shell Behavior (Audit Readiness Addendum Compliance)

| Shell | Morning Rhythm | Evening Rhythm | Reflections Page | Rhythms Settings |
|-------|---------------|---------------|-----------------|-----------------|
| Mom / Primary Parent | Full modal + card, 6 default sections + periodic cards + enhancements | Full 13-section fixed sequence (mood triage removed) | **BUILT** 3-tab page | Full config + member picker |
| Dad / Additional Adult | Full modal + card (own rhythms only) | Full 13-section fixed sequence | **BUILT** 3-tab page — responses PRIVATE from mom via RLS | Own rhythms only, cannot see/configure others without grant |
| Special Adult | Not present — rhythms outside Special Adult scope | Not present | Not present | Not present |
| Independent (Teen) | **Full tailored template** (Enhancement 7): Guiding Star with ownership framing, Morning Priorities Recall, Task Preview, Calendar Preview, On the Horizon, Something to Think About (teen question pool), Feature Discovery (teen prioritization), Rhythm Tracker Prompts — 7 sections | **Full tailored template** (Enhancement 7): Evening Greeting, What Went Right Today, Tomorrow Capture, MindSweep-Lite (teen dispositions), Reflection 1-2 questions, Closing Thought ("Something you believe:"), Rhythm Tracker Prompts, Close My Day — 8 sections | **BUILT** 3-tab page (visible to mom via View As, TransparencyIndicator shown) | Own rhythms + Studio template browsing with request flow (deferred until PRD-15 ready) |
| Guided | Encouraging Message + Routine Checklist + Task Preview (simplified) — mom configures everything | **Mini evening rhythm (scope addition 2026-04-07, expanded same day)**: 5 sections in fixed order — Day Highlights (today's victories), Pride Reflection (rotating wording), Reflections (1 of 20 child-friendly library prompts via PRNG, with View All swap), Tomorrow Look-Ahead (rotating wording), Close My Day. Renders at position 0 above all dashboard sections. Coexists with Celebrate button which still launches DailyCelebration (PRD-11) overlay separately. Auto-managed — mom cannot hide it via management screen (truly auto-rendered, not in section registry). | Not present as standalone (WriteDrawerReflections embedded in write drawer already built) | Not present — mom configures |
| Play | Encouraging Message (big/colorful) + Routine Checklist (visual) — mom configures everything | **DailyCelebration (PRD-11) instead** — maximum delight | Not present | Not present — mom configures |

---

## Database Changes Required

### New Tables

**1. `rhythm_configs`** — per-member rhythm configuration
```sql
CREATE TABLE rhythm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  rhythm_key TEXT NOT NULL, -- 'morning', 'evening', 'weekly_review', 'monthly_review', 'quarterly_inventory', or custom slug
  display_name TEXT NOT NULL,
  rhythm_type TEXT NOT NULL DEFAULT 'default' CHECK (rhythm_type IN ('default', 'custom', 'template_activated')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sections JSONB NOT NULL DEFAULT '[]', -- ordered array: {section_type, enabled, order, config}
  section_order_locked BOOLEAN NOT NULL DEFAULT false, -- TRUE for evening rhythm
  timing JSONB NOT NULL DEFAULT '{}', -- {start_hour, end_hour, day_of_week, day_of_month, trigger_type}
  auto_open BOOLEAN NOT NULL DEFAULT true,
  reflection_guideline_count INTEGER NOT NULL DEFAULT 3, -- soft guideline per rhythm
  source_template_id UUID, -- FK to studio rhythm template (future)
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_rhythm_configs_unique ON rhythm_configs(family_id, member_id, rhythm_key);
CREATE INDEX idx_rhythm_configs_active ON rhythm_configs(family_id, member_id, enabled);
CREATE TRIGGER set_rhythm_configs_updated_at BEFORE UPDATE ON rhythm_configs FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();
ALTER TABLE rhythm_configs ENABLE ROW LEVEL SECURITY;
-- Members manage own; mom manages all family
```

**2. `rhythm_completions`** — tracks completion per period
```sql
CREATE TABLE rhythm_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  rhythm_key TEXT NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM-DD' / 'YYYY-W##' / 'YYYY-MM' / 'YYYY-Q#'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed', 'snoozed')),
  mood_triage TEXT, -- 'course_correcting' / 'smooth_sailing' / 'rough_waters' — column kept for future, not populated by default
  snoozed_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}', -- {priority_items:[], mindsweep_items:[], brain_dump_notepad_tab_id}
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_rhythm_completions_unique ON rhythm_completions(family_id, member_id, rhythm_key, period);
CREATE INDEX idx_rhythm_completions_status ON rhythm_completions(family_id, member_id, status);
ALTER TABLE rhythm_completions ENABLE ROW LEVEL SECURITY;
-- Members manage own; mom reads all family completions (for Family Overview indicators)
```

**3. `feature_discovery_dismissals`** — per-user feature discovery dismissal tracking (Enhancement 4)
```sql
CREATE TABLE feature_discovery_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_fdd_unique ON feature_discovery_dismissals(member_id, feature_key);
ALTER TABLE feature_discovery_dismissals ENABLE ROW LEVEL SECURITY;
-- Members manage own
```

**4. `morning_insight_questions`** — 20 seeded adult + 15 seeded teen questions for Enhancement 3
```sql
CREATE TABLE morning_insight_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE, -- NULL = system default
  audience TEXT NOT NULL CHECK (audience IN ('adult', 'teen')),
  category TEXT NOT NULL, -- 'family_friction', 'personal_growth', 'relationships', 'parenting', 'time_energy', 'values', 'curiosity', 'identity_growth', 'school_learning', 'life_future'
  question_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_miq_active ON morning_insight_questions(audience, is_active) WHERE is_active = true;
-- Seed 20 adult + 15 teen questions from Enhancement Addendum
```

### Modified Tables

**`tasks`** — add `'rhythm_priority'` to `source` enum
```sql
-- Drop + recreate CHECK constraint on tasks.source to add 'rhythm_priority'
-- Pattern same as migration 100072 category rename
```

**`dashboard_widgets.config`** (JSONB) — document new `rhythm_keys` TEXT[] sub-field (Enhancement 6)
- No migration required (JSONB — runtime only). Widget settings UI reads/writes this field.

**`family_members.preferences`** (JSONB) — document new sub-fields for Carry Forward fallback (Enhancement 5)
- `carry_forward_fallback`: 'stay' / 'roll_forward' / 'expire' / 'backburner' (default: 'stay')
- `carry_forward_backburner_days`: INTEGER (default 14)
- `carry_forward_backlog_threshold`: INTEGER (default 10)
- `carry_forward_backlog_prompt_max_frequency`: 'daily' / 'weekly' (default 'weekly')
- No migration required. Stored in existing `preferences` JSONB.

### Migrations

**Migration 00000000100103: `rhythms_and_enhancements.sql`**
- CREATE TABLE rhythm_configs + RLS
- CREATE TABLE rhythm_completions + RLS
- CREATE TABLE feature_discovery_dismissals + RLS
- CREATE TABLE morning_insight_questions + seed 20 adult + 15 teen questions
- ALTER TABLE tasks DROP + ADD CHECK constraint on source to add 'rhythm_priority'
- INSERT feature keys into feature_key_registry
- Default rhythm_configs seeding trigger/function on family_members INSERT (morning active, evening active, weekly_review active, monthly_review off, quarterly_inventory off, per-role defaults from Enhancement 7 for teens)
- Activity log trigger on rhythm_completions INSERT (`event_type = 'rhythm_completed'`)

**Migration 00000000100104: `carry_forward_fallback_cron.sql`** (Phase B)
- pg_cron job: `process_carry_forward_fallbacks()` runs daily at midnight per family timezone
- Function queries all tasks with due_date < today AND status IN ('pending','in_progress') AND no per-task override, applies member's fallback behavior setting
- Backlog threshold prompt: mark completion metadata so evening rhythm can surface prompt when threshold exceeded

---

## Feature Keys

| Feature Key | Display Name | Minimum Tier | Role Groups | Notes |
|---|---|---|---|---|
| `rhythms_basic` | Rhythms | Essential | mom, dad_adults, independent_teens, guided_kids, play_kids | Morning + Evening rhythms with default templates |
| `rhythms_periodic` | Periodic Rhythms | Enhanced | mom, dad_adults, independent_teens | Weekly Review, Monthly Review, Quarterly Inventory |
| `rhythms_custom` | Custom Rhythms | Enhanced | mom, dad_adults, independent_teens | Custom rhythm creation + Studio template activation |
| `reflections_basic` | Reflections | Essential | mom, dad_adults, independent_teens | **Already registered** (migration 100071) |
| `reflections_custom` | Custom Reflections | Enhanced | mom, dad_adults, independent_teens | **Already registered** (migration 100071) |
| `reflections_export` | Export Reflections | Full Magic | mom, dad_adults, independent_teens | Post-MVP — deferred |
| `rhythm_dynamic_prompts` | AI Dynamic Prompts | Full Magic | mom, dad_adults | LiLa-generated contextual reflection prompts (MVP When Ready) |
| `rhythm_morning_insight` | Morning Insight | Enhanced | mom, dad_adults, independent_teens | Enhancement 3 — BookShelf semantic pull |
| `rhythm_feature_discovery` | Feature Discovery | Essential | mom, dad_adults, independent_teens | Enhancement 4 — platform onboarding engine |
| `rhythm_mindsweep_lite` | MindSweep-Lite | Essential | mom, dad_adults, independent_teens | Enhancement 2 — embedded brain dump |
| `rhythm_on_the_horizon` | On the Horizon | Essential | mom, dad_adults, independent_teens, guided_kids | Enhancement 8 — 7-day lookahead (exec function training for kids) |
| `rhythm_tracker_prompts` | Rhythm Tracker Prompts | Enhanced | mom, dad_adults, independent_teens | Enhancement 6 — any tracker in any rhythm |

During beta: `useCanAccess()` returns true for all. Infrastructure registered day 1.

---

## Stubs — Do NOT Build This Phase

These are deferred — either because dependencies aren't built or they're explicitly post-MVP. Each must be registered in `STUB_REGISTRY.md`.

- [ ] **Studio rhythm template library** — template browsing, preview, activation, 7-10 templates (Sabbath/Renewal, Priority Reevaluation, Goal Evaluation, Marriage Check-in, Homeschool Week Review, Semester Review, Medication/Health Check, Mid-Day Reset, Bedtime Prayer, Children & Youth Program). Requires new `rhythm_templates` table. "Browse Studio Templates →" button shows `PlannedExpansionCard`.
- [ ] **Teen rhythm request flow** — teen customizes → sends to mom's Requests tab → mom approves/edits/declines. Requires PRD-15 (Messages/Requests/Notifications) — currently being built in Build G. Wire post-PRD-15.
- [ ] **LiLa dynamic reflection prompts** — LiLa generates contextual prompts based on day data. Requires PRD-05 day-data context assembly enhancement. `source='lila_dynamic'` column exists, generation deferred.
- [ ] **Tooltip + "What's this?" → LiLa contextual help** — system-wide rollout. Established as convention here; PRD-03 Tooltip enhancement + PRD-05 `contextual_help` context injection are both prerequisites. Not built this phase.
- [ ] **LifeLantern Check-in staleness** — Quarterly Inventory reads `life_lantern_areas` staleness. Requires PRD-12A (Personal LifeLantern) which is not yet built. Stub shows "LifeLantern coming soon" text.
- [ ] **Reflection export as formatted document** — filtered by tags, date range. Requires export engine. Post-MVP.
- [ ] **Premium reflection prompt packs** — themed collections (Spiritual Growth, Marriage Enrichment, Parenting). Post-MVP content.
- [ ] **Push notifications for rhythm reminders** — off by default, configurable per rhythm. Post-MVP.
- [ ] **Voice-to-text for reflection answers** — requires voice infrastructure wiring in reflection inputs. Post-MVP.
- [ ] **Rhythm analytics** — completion patterns, engagement metrics. Post-MVP.
- [ ] **Morning/Evening dashboard layouts** — saved layouts that auto-switch by time of day. Post-MVP (PRD-14).
- [ ] **Renewal Dimension Rotation section type** — 4-week physical/spiritual/mental/social focus. Post-MVP, belongs in Sabbath studio template.
- [ ] **Reflection sharing on Family Hub** — opt-in per answer. Post-MVP (PRD-14D).
- [ ] **MindSweep-Lite "delegate" → create message/request** — requires PRD-15. Until PRD-15 is fully wired, "delegate" creates a task with a note "for: [member]" as a placeholder.
- [ ] **Backlog threshold prompt** (Enhancement 5 occasional prompt) — UI exists but the once-per-week gate requires completion history tracking. Phase B.
- [ ] **Carry Forward backburner routing** — requires Backburner list integration (already built per CURRENT_BUILD.md). Wire Phase B.
- [ ] **BookShelf discovery nudge for empty libraries** — shows onboarding nudge; works without a dependency but needs a clean BookShelf empty state detection query.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Rhythm sections | ← | Guiding Stars (PRD-06) | `useGuidingStars` filtered by `is_included_in_ai`, `archived_at IS NULL` |
| Rhythm sections | ← | Best Intentions (PRD-06) | `useBestIntentions` + `intention_iterations` |
| Task Preview section | ← | Tasks (PRD-09A) | `DashboardTasksSection` data |
| Calendar Preview section | ← | Calendar (PRD-14B) | `CalendarWidget` with `personalMemberId` |
| Victory Summary section | ← | Victory Recorder (PRD-11) | `victories` table, deduplicated with task completions |
| Completed Meetings section | ← | Meetings (PRD-16) | `meetings` table — stubbed until PRD-16 built |
| Custom Tracker Prompts | ← | Widgets (PRD-10) | `dashboard_widgets.config.rhythm_keys` array |
| Morning Insight section | ← | BookShelf (PRD-23) | `match_book_extractions` RPC |
| LifeLantern Check-in | ← | LifeLantern (PRD-12A) | `life_lantern_areas` staleness — stubbed |
| Reflection responses | → | Journal (PRD-08) | Auto-create `journal_entries` with category-based `tags` — **already built in useReflections** |
| Tomorrow Capture tasks | → | Tasks (PRD-09A) | INSERT `tasks` with `source='rhythm_priority'`, `due_date=tomorrow` |
| Morning Priorities Recall | ← | Evening rhythm_completions | `metadata.priority_items` from previous evening |
| MindSweep-Lite dispositions | → | Tasks / Notepad / Backburner / Messages / (release) | Batched inserts on Close My Day |
| Brain Dump / Capture | → | Smart Notepad (PRD-08) | `notepad_tabs` with `source_type='rhythm_capture'` |
| Victory flag from reflections | → | Victory Recorder (PRD-11) | `victories` with `source='reflection_routed'` (enum already exists) |
| Mood triage | → | LiLa context (PRD-05) | `rhythm_completions.mood_triage` — deferred until PRD-05 context enhancement |
| Teen rhythm requests | → | Studio Queue (PRD-17) | `studio_queue` with `source='rhythm_request'` — **deferred, depends on PRD-15** |
| Rhythm completion indicators | → | Family Overview (PRD-14C) | `rhythm_completions` query — deferred (PRD-14C stub wire) |
| Feature Discovery engagement | ← | Activity log (cross-feature) | `activity_log_entries` engagement queries |
| On the Horizon Task Breaker | → | TaskBreaker (PRD-09A) | Opens existing `TaskBreaker` modal component |
| On the Horizon scheduling | → | Calendar (PRD-14B) | Creates calendar blocks via existing `EventCreationModal` |
| Carry Forward fallback midnight job | → | Tasks (PRD-09A) | pg_cron applies fallback behavior per member preference |

---

## Things That Connect Back to This Feature Later

- **PRD-15 (Messages/Requests/Notifications) — currently building in Build G:** When PRD-15 ships, wire (a) teen rhythm request flow to `family_requests` and Requests tab, (b) MindSweep-Lite "delegate" disposition to create real messages, (c) PRD-18 rhythm completion notifications (optional, off by default). Enhancement Addendum notes these as deferred explicitly.
- **PRD-16 (Meetings):** Weekly Review and Monthly Review "deep dive" links launch meeting types. Completed Meetings section reads `meetings` data.
- **PRD-14C (Family Overview) — already built:** Consume `rhythm_completions` to show per-member completion indicators ("[Name] completed morning rhythm" / "[Name] hasn't done evening rhythm yet"). Wire as stub completion.
- **PRD-12A (Personal LifeLantern):** Quarterly Inventory reads `life_lantern_areas` staleness. LifeLantern Check-in section type consumes this data.
- **PRD-05 (LiLa Core) enhancements:** (a) `mood_triage` becomes a LiLa context source, (b) `contextual_help` context injection for tooltip "What's this?" links, (c) dynamic reflection prompt generation based on day data, (d) Morning Insight dynamic question generation blended with static pool.
- **PRD-03 (Design System) tooltip enhancement:** Add "What's this?" link support that opens LiLa contextual help. PRD-18 establishes the convention; PRD-03 delivers the component enhancement.
- **PRD-23 (BookShelf) guided mode from Morning Insight:** Clicking an extraction could open BookShelf in a guided study mode — future enhancement.
- **Studio rhythm template library:** New `rhythm_templates` table + seeding + browsing UI. Post-MVP content sprint. 7-10 templates planned.
- **Reports/Export engine:** Reflection export as formatted document, filtered by tags and date range. Post-MVP.
- **Premium reflection prompt packs:** Themed collections gated to `Full Magic` tier. Post-MVP.

---

## Proposed Phasing

This is a large build. Recommended 4 sub-phases that respect dependency order and allow founder review between phases:

### Phase A — Foundation (Rhythm Infrastructure + Core Morning/Evening)
**Goal:** Rhythms exist. Morning and Evening auto-open, render base sections from existing data, and reach the Close My Day state.

1. Migration 100103: `rhythm_configs`, `rhythm_completions`, `feature_discovery_dismissals`, `morning_insight_questions` tables + RLS + indexes + triggers + feature keys + per-member default seeding trigger + activity log trigger
2. TypeScript types (`src/types/rhythms.ts`)
3. Hooks: `useRhythmConfig`, `useRhythmCompletion`, `useCompleteRhythm`, `useSnoozeRhythm`, `useDismissRhythm`, `useMemberRhythms`, `useRhythmForPeriod`
4. `dashboardSections.ts` registry update: add `morning_rhythm` and `evening_rhythm` keys with `is_auto_managed=true`
5. `MorningRhythmModal` + `MorningRhythmCard` with breathing glow
6. `EveningRhythmModal` + `EveningRhythmCard` with fixed 13-section sequence (mood triage already removed per Enhancement 6)
7. Section components — **basic set** (Phase A scope):
   - `GuidingStarRotationSection`, `BestIntentionsFocusSection`, `TaskPreviewSection`, `CalendarPreviewSection`, `BrainDumpSection` (reuses existing NotepadDrawer via embed wrapper)
   - `EveningGreetingSection`, `AccomplishmentsVictoriesSection`, `CompletedMeetingsSection` (stub), `MilestoneCelebrationsSection`, `ClosingThoughtSection`, `FromYourLibrarySection`, `BeforeCloseTheDaySection`, `ReflectionsSection` (wraps existing `useReflections` data), `CloseMyDayActionBar`
8. Date-seeded PRNG utility for deterministic rotation
9. `SectionRendererSwitch` — extensible section type → component dispatcher
10. `RhythmsSettingsPage` stub (enable/disable, timing, section toggles, member picker) — full config UI in later phase if needed
11. Sidebar nav wire-up (replace placeholder routes)
12. `rhythm_capture` destination added to RoutingStrip
13. Per-role default templates on family member insert (adult/teen/guided/play)
14. Guided/Play evening handoff: at evening rhythm time, dashboard triggers `DailyCelebration` instead of modal
15. `tsc -b` zero errors

**Phase A stubs:** All Enhancement Addendum items (1-8), periodic rhythms (Weekly/Monthly/Quarterly), Carry Forward fallback cron, Studio templates, teen tailored template, LifeLantern Check-in, LiLa dynamic prompts, tooltip enhancement, Feature Discovery.

### Phase B — Periodic Rhythms + Tomorrow Capture + On the Horizon + Carry Forward Fallback
**Goal:** Weekly/Monthly/Quarterly cards work. Evening captures tomorrow's intent. Morning recalls it. On the Horizon surfaces upcoming items. Carry Forward fallback runs automatically.

1. `WeeklyReviewCard` + sections (Weekly Stats, Top Victories, Next Week Preview, Weekly Reflection Prompt, Deep Dive link stub)
2. `MonthlyReviewCard` + sections (off by default)
3. `QuarterlyInventoryCard` + sections (off by default, LifeLantern integration stubbed)
4. **Enhancement 1:** `EveningTomorrowCaptureSection` with rotating prompts + fuzzy match + overflow handling at 6+ + `source='rhythm_priority'` task creation
5. **Enhancement 1:** `MorningPrioritiesRecallSection` reading previous evening `metadata.priority_items`
6. `tasks.source` enum: add `'rhythm_priority'`
7. **Enhancement 8:** `OnTheHorizonSection` — 7-day lookahead query + Task Breaker integration + scheduling prompt
8. **Enhancement 5:** `CarryForwardFallbackSetting` UI in Rhythms Settings + Task Settings, writes to `family_members.preferences`
9. **Enhancement 5:** Migration 100104 — `process_carry_forward_fallbacks()` pg_cron function running daily per family timezone
10. **Enhancement 5:** Occasional backlog prompt in evening rhythm (threshold + max frequency enforcement)
11. `tsc -b` zero errors

**Phase B stubs:** AI enhancements (MindSweep-Lite, Morning Insight, Feature Discovery), tracker rhythm_keys UI, teen tailored experience.

### Phase C — AI-Powered Enhancements
**Goal:** MindSweep-Lite, Morning Insight, Feature Discovery, tracker rhythm surfacing all work.

1. **Enhancement 2:** `MindSweepLiteSection` with freeform text input + auto-expand logic
2. **Enhancement 2:** `mindsweep-sort-lite` Edge Function (or reuse existing `mindsweep-sort`) with 5-disposition classification
3. **Enhancement 2:** Batched record creation on Close My Day — commits tasks, notepad tabs, backburner items, messages (stub), releases
4. **Enhancement 3:** `MorningInsightSection` — question pool seed via migration (20 adult + 15 teen), text input, `match_book_extractions` RPC calls for passive + active matches, BookShelf link routing, empty BookShelf onboarding nudge
5. **Enhancement 3:** Morning Insight question pool CRUD in Rhythms Settings (archive/restore/custom)
6. **Enhancement 4:** `FeatureDiscoverySection` — activity log engagement queries, dismiss handling via `feature_discovery_dismissals`, 2-3x/week frequency gate, feature pool curation
7. **Enhancement 6:** `dashboard_widgets.config.rhythm_keys` widget settings UI (multi-select: Morning/Evening/Weekly/custom)
8. **Enhancement 6:** `RhythmTrackerPromptsSection` renders widgets where `rhythm_keys` contains current rhythm's key. Renamed from "Custom Tracker Prompts" in section registry
9. `tsc -b` zero errors

**Phase C stubs:** Teen tailored experience, LiLa dynamic prompts, PRD-15-dependent items (delegate disposition messaging, teen request flow), tooltip enhancement.

### Phase D — Independent Teen Experience + Polish
**Goal:** Teens have a fully tailored rhythm experience. Minor polish and final verification.

1. **Enhancement 7:** Teen evening template seed (8 sections with teen framing, ownership language)
2. **Enhancement 7:** Teen morning template seed (7 sections with teen framing)
3. **Enhancement 7:** Teen MindSweep-Lite dispositions (Schedule / Journal about it / Talk to someone / Let it go) — Haiku prompt calibrated with teen examples
4. **Enhancement 7:** 15 teen morning insight questions seeded in `morning_insight_questions` table (audience='teen')
5. **Enhancement 7:** Teen evening reflection count (1-2 vs 3) — parameter on `ReflectionsSection`
6. **Enhancement 7:** Teen Guiding Star framing ("You said this matters to you:")
7. **Enhancement 7:** Teen evening priorities framing ("What do you want to get done tomorrow?")
8. **Enhancement 7:** Feature Discovery teen feature pool prioritization
9. **Enhancement 7:** BookShelf discovery nudge teen school-use-case framing
10. Polish pass: empty states, transitions, edge cases
11. Post-build verification against every PRD + addendum requirement
12. `tsc -b` zero errors

**Phase D stubs (permanent until dependency ships):** PRD-15 teen request flow, PRD-15 delegate disposition, PRD-05 contextual help, PRD-05 dynamic prompts, LifeLantern Check-in, Studio rhythm templates, export, premium packs, push notifications.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above (PRD-18 Cross-PRD Impact + PRD-18 Enhancement Addendum + PRD Audit Readiness)
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct (4 new tables, 1 enum update, 2 JSONB field documentations)
- [ ] Feature keys identified (12 total — 2 already registered)
- [ ] Phasing plan (A / B / C / D) approved
- [ ] **Approved to build Phase A**

---

## Post-Build PRD Verification

> Completed after each phase, before declaring the phase done.
> Every requirement from the PRD and addenda — accounted for.
> Zero Missing = phase complete.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| (to be filled after each phase) | | | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed per phase
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed per phase
- [ ] **Phase A approved as complete** — date:
- [ ] **Phase B approved as complete** — date:
- [ ] **Phase C approved as complete** — date:
- [ ] **Phase D approved as complete** — date:
