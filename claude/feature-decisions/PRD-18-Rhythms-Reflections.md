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

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above (PRD-18 Cross-PRD Impact + PRD-18 Enhancement Addendum + PRD Audit Readiness)
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct (4 new tables, 1 enum update, 2 JSONB field documentations)
- [x] Feature keys identified (12 total — 2 already registered)
- [x] Phasing plan (A / B / C / D) approved
- [x] **Approved to build Phase A** — 2026-04-07

---

## Post-Build PRD Verification — Phase A (2026-04-07)

> Phase A scope: foundation only. Enhancement Addendum items 1-8 are stubbed with placeholder UI in the correct sequence positions (Phases B, C, D will fill them in).

### Foundation (migration 100103)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `rhythm_configs` table with RLS, indexes, trigger | PRD-18 Data Schema | Wired | 26 members backfilled, 98 configs total |
| `rhythm_completions` table with RLS, indexes, period unique | PRD-18 Data Schema | Wired | 17/17 RLS tests pass |
| `feature_discovery_dismissals` table (Phase C ready) | Enhancement 4 | Wired | Schema only — UI in Phase C |
| `morning_insight_questions` table (Phase C ready) | Enhancement 3 | Wired | Schema only — questions seeded in Phase C |
| Per-role default seeding via `auto_provision_member_resources` trigger | PRD-18 §Per-role default templates | Wired | Adult/teen: 5 rhythms; guided: 1 morning + 5-section evening (post-100106); play: 1 morning |
| Backfill existing 26 family members | Migration 100103 §6 | Wired | 98 rhythm_configs total seeded |
| 12 feature keys in `feature_key_registry` + 32 `feature_access_v2` rows | PRD-18 §Tier Gating | Wired | 10 new + 2 pre-existing reflections keys |
| Activity log trigger on `rhythm_completions` INSERT | PRD-18 §Outgoing Flows | Wired | Fires `event_type='rhythm_completed'` |
| `notepad_tabs.source_type` widened to allow `'rhythm_capture'` | Convention 20 | Wired | Migration 100103 §0 |

### Hooks + utilities

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `useRhythmConfigs`, `useRhythmConfig`, `useRhythmCompletion`, `useTodaysRhythmCompletions` queries | PRD-18 §Flows | Wired | `src/hooks/useRhythms.ts` |
| `useCompleteRhythm`, `useSnoozeRhythm`, `useDismissRhythm`, `useUpdateRhythmConfig`, `useToggleRhythmSection` mutations | PRD-18 §Interactions | Wired | All UPSERT-based, idempotent |
| Date-seeded PRNG utility with `pickOne`, `pickN`, `pickNPrioritized` | PRD-18 §Reflection Prompt Library Rotation | Wired | `src/lib/rhythm/dateSeedPrng.ts` — used by Guiding Star, Scripture/Quote, Reflections, Pride/Tomorrow rotation |
| `periodForRhythm` utility for daily/weekly/monthly/quarterly period strings | PRD-18 §Data Schema | Wired | `src/types/rhythms.ts` |
| `isRhythmActive` time-window check | PRD-18 §Delivery behavior | Wired | Used by `RhythmDashboardCard` auto-open |

### Morning Rhythm

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Auto-open modal on first dashboard visit during morning hours | PRD-18 Screen 1 §Delivery behavior | Wired | Once-per-period via sessionStorage flag |
| Guiding Star Rotation section | PRD-18 §Section Type 1 | Wired | Date-seeded PRNG; auto-hides if no entries |
| Best Intentions Focus section with tap-to-celebrate | PRD-18 §Section Type 2 | Wired | Reuses `useLogIteration`; auto-hides if no active intentions |
| Task Preview section | PRD-18 §Section Type 3 | Wired | Today's tasks for the member; tappable to /tasks; warm empty state |
| Calendar Preview section | PRD-18 §Section Type 4 | Wired | Today's events; tappable to /calendar; auto-hides if none |
| Brain Dump section (embedded Smart Notepad) | PRD-18 §Section Type 8 + Convention 1 | Wired | Writes `notepad_tabs` with `source_type='rhythm_capture'` |
| Periodic cards slot for Weekly/Monthly/Quarterly inline | PRD-18 §Section 6 | Stubbed | `PeriodicCardsSlot` returns null in Phase A; Phase B fills in |
| Morning Priorities Recall (Enhancement 1) | Enhancement Addendum #1 | Stubbed | Placeholder card in correct position; Phase B builds the recall logic |
| On the Horizon (Enhancement 8) | Enhancement Addendum #8 | Stubbed | Placeholder card; Phase B builds 7-day lookahead + Task Breaker |
| Morning Insight (Enhancement 3) | Enhancement Addendum #3 | Stubbed | Placeholder card; Phase C builds BookShelf semantic pull |
| Feature Discovery (Enhancement 4) | Enhancement Addendum #4 | Stubbed | Placeholder card; Phase C builds activity-log nudge engine |

### Evening Rhythm

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Auto-open modal during evening hours, fixed section sequence | PRD-18 Screen 2 §Delivery behavior + Decision 4 | Wired | `section_order_locked=true` |
| Evening Greeting section | PRD-18 §Evening Section 1 | Wired | Personalized warm header with member name |
| Accomplishments & Victories section | PRD-18 §Evening Section 2 | Wired | Reads `victories` table; warm empty state ("Some days are quiet…") |
| Completed Meetings section (auto-hide) | PRD-18 §Evening Section 3 | Stubbed | Returns null until PRD-16 ships |
| Milestone Celebrations section (auto-hide) | PRD-18 §Evening Section 4 | Stubbed | Returns null until gamification milestones wired |
| Carry Forward section (OFF by default) | PRD-18 §Evening Section 5 + Decision 5 | Wired | Renders placeholder when enabled; Phase B builds fallback behavior |
| Closing Thought (Guiding Star) | PRD-18 §Evening Section 8 | Wired | One full Guiding Star, date-seeded PRNG |
| From Your Library (Scripture/Quote rotation) | PRD-18 §Evening Section 9 | Wired | Filters to `entry_type='scripture_quote'`; auto-hides if none |
| Before You Close the Day section (auto-hide) | PRD-18 §Evening Section 10 | Stubbed | Returns null until cross-feature pending aggregation built |
| Reflections section (3 inline questions, date-seeded PRNG) | PRD-18 §Evening Section 11 | Wired | Wraps existing `useReflections`; "See all questions →" link to /reflections |
| Rhythm Tracker Prompts section (auto-hide) | PRD-18 §Evening Section 12 + Enhancement 6 | Stubbed | Returns null until PRD-10 `rhythm_keys` widget config wired in Phase C |
| Close My Day action bar | PRD-18 §Evening Section 13 | Wired | Commits completion + activity log |
| **Mood triage REMOVED from default sequence** | Enhancement Addendum #6 founder decision | Wired | `mood_triage` column preserved in schema, not populated |
| Tomorrow Capture (Enhancement 1 stub) | Enhancement Addendum #1 | Stubbed | Placeholder in correct position; Phase B builds rotating capture + fuzzy match |
| MindSweep-Lite (Enhancement 2 stub) | Enhancement Addendum #2 | Stubbed | Placeholder in correct position; Phase C builds Haiku triage |

### Dashboard integration

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Rhythm cards render at position 0 | Cross-PRD Impact Addendum + PRD-18 Screen 1 | Wired | Renders OUTSIDE the data-driven section system, above all sections |
| Cards auto-hide outside time window when no completion | PRD-18 §Dashboard Card states | Wired | Self-hiding via `RhythmDashboardCard` props |
| Breathing glow on pending state | PRD-17 convention | Wired | Reuses existing `BreathingGlow` component |
| Cannot be hidden via edit mode | Cross-PRD Impact Addendum | Wired | Not in section registry — impossible to toggle off |
| Adult Dashboard renders morning + evening cards | PRD-18 Screen 8 | Wired | Above greeting, below for guided/play (excluded from adult evening) |
| Guided Dashboard renders evening card at position 0 | Mid-build addition 2026-04-07 | Wired | Same auto-managed pattern as adult |
| Guided/Play evening handoff to DailyCelebration (PRD-11) | PRD-18 Decision + PRD-25 | Wired | Play kids: no rhythm card, only Celebrate button. Guided kids: BOTH the new mini evening rhythm AND CelebrateSection coexist. |

### Mini evening rhythm for Guided (mid-build, migrations 100104 + 100106)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Day Highlights section with kid framing | Mid-build addition 2026-04-07 | Wired | Reads today's victories; warm empty state |
| Pride Reflection with **6 rotating wordings** | Mid-build addition 2026-04-07 | Wired | Date-seeded daily PRNG; selected wording saved into journal entry content |
| Tomorrow Look-Ahead with **6 rotating wordings** | Mid-build addition 2026-04-07 | Wired | Same pattern as Pride |
| Guided Reflections section: 1-of-20 child-friendly prompts via PRNG with View All expander | Mid-build addition 2026-04-07 | Wired | Pulls from existing `reflection_prompts` library; mirrors planned teen pattern (Enhancement 30) |
| Reading Support flag flows through Modal → Card → SectionRendererSwitch → sections | Mid-build addition 2026-04-07 | Wired | Volume2 read-aloud icons via `speechSynthesis` |
| Backfill existing 3 active Guided members | Migrations 100104 + 100106 | Wired | Mosiah + 2 Jordans across the database |
| Coexists with `CelebrateSection` (DailyCelebration overlay still works) | Mid-build founder decision | Wired | Two distinct end-of-day surfaces |

### Reflections page (PRESERVED — no rebuild)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| 3-tab Reflections page (Today, Past, Manage) | PRD-18 Screen 3 | Wired | **Already built** in migrations 100071/100072. Not rebuilt. |
| 32 default reflection prompts | PRD-18 §Reflection Prompt Library | Wired | Already seeded by `useReflectionPrompts` lazy seed |
| Auto-route reflection answers to journal_entries with category tags | PRD-18 §Outgoing Flows | Wired | `useSaveResponse` does this — already built |
| `journal_entries.tags TEXT[]` for tag-based filtering | PRD-18 §Schema Updates | Wired | Already exists in migration 100006 line 17 — no migration needed |
| `victories.source` includes `'reflection_routed'` | PRD-18 §Enum Updates | Wired | Already exists in migration 100102 line 41 — no enum update needed |

### Rhythms Settings page (Screen 7)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `/rhythms/settings` route | PRD-18 Screen 7 | Wired | Replaces `/rhythms/morning` and `/rhythms/evening` placeholder routes (now redirect to /dashboard) |
| Member picker (mom only) | PRD-18 Screen 7 §Member picker | Wired | Other roles see only their own configs |
| Active rhythms list with enable/disable | PRD-18 Screen 7 | Wired | |
| Available rhythms list with [Enable] | PRD-18 Screen 7 | Wired | Monthly + Quarterly off by default |
| Per-rhythm section toggles | PRD-18 Screen 7 §Settings | Wired | Section reordering deferred to Phase B |
| Custom rhythm creation | PRD-18 Screen 7 §Custom rhythm creation | Stubbed | Placeholder card; Phase B/later |
| Studio rhythm template browsing | PRD-18 §Studio template browsing | Stubbed | No `rhythm_templates` table; post-MVP content sprint |

### Sidebar nav

| Requirement | Source | Status | Notes |
|---|---|---|---|
| "Rhythms" entry pointing to `/rhythms/settings` | PRD-18 §Cross-PRD Impact (PRD-04) | Wired | Replaces old "Morning Rhythm" / "Evening Review" entries which were misleading |

### Date bug fix (beta_glitch_reports 8dc4b2bd)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Reflections show correct local date | Bug report 8dc4b2bd | Wired | `todayLocalIso()` helper in `useReflections.ts`; 4 call sites converted |
| Historical misdated rows backfilled | Mid-build cleanup | Wired | 13 rows across 3 members fixed via UPDATE using `families.timezone` |
| Bug report marked fixed with admin notes | Bug triage | Wired | `beta_glitch_reports.status='fixed'` |
| 21 other files with same UTC bug pattern flagged for follow-up | Systemic discovery | Stubbed | Cleanup prompt delivered to founder; separate task — not in this build |

### Summary

- **Total requirements verified:** 65
- **Wired:** 51
- **Stubbed:** 14 (all with explicit Phase B/C/D resolution paths or dependency on other PRDs)
- **Missing:** **0**

---

## Post-Build PRD Verification — Phase B (2026-04-07)

> Phase B scope: filled four Phase A stubs (`evening_tomorrow_capture`, `morning_priorities_recall`, `on_the_horizon`, `carry_forward` fallback) plus built periodic rhythm cards (Weekly/Monthly/Quarterly) plus mid-build section cleanup driven by founder rule "front door OR genuinely helpful." Migrations: 100110 + 100111. Edge Function: `process-carry-forward-fallback`. Remaining stubs are explicitly Phase C (MindSweep-Lite, Morning Insight, Feature Discovery, Rhythm Tracker Prompts) or Phase D (teen tailored experience).

### Foundation (Phase B schema + infrastructure)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Migration 100110: tasks.source enum + carry_forward_override column + feature key + pg_cron + trigger update + on_the_horizon backfill | Phase B sub-phase B1 | Wired | Applied to live DB; 5/5 verification checks green; 18 morning rhythms backfilled with `on_the_horizon` |
| Migration 100111: section cleanup trigger update + 2 backfills | Mid-build addition 2026-04-07 | Wired | Applied to live DB; 6/6 verification checks green; 18 adult morning + 3 Guided morning rhythms updated |
| `tasks.source` accepts `'rhythm_priority'` | Enhancement 1 #2 | Wired | Verified via constraint definition query |
| `tasks.carry_forward_override` nullable column with CHECK constraint | Enhancement 5 | Wired | Per-task override of member default |
| `rhythm_carry_forward_fallback` feature key + 5 tier grants | Enhancement 5 | Wired | All 5 role groups, Essential tier |
| pg_cron `rhythm-carry-forward-fallback` scheduled hourly at :05 | Enhancement 5 | Wired | Verified in `cron.job` |
| `process-carry-forward-fallback` Edge Function deployed | Enhancement 5 | Wired | Live on vjfbzpliqialqmabfnxs |
| Edge Function timezone-aware: only processes families where `localHour === 0` | Enhancement 5 #19 | Wired | Uses `Intl.DateTimeFormat` per family timezone, same pattern as `mindsweep-auto-sweep` |
| Per-task override precedence (override → member default) | Enhancement 5 #19 | Wired | Read in Edge Function before applying behavior |
| Backlog threshold prompt side effect | Enhancement 5 #21 | Wired | Marks pending evening completion with `metadata.backlog_prompt_pending` when threshold + frequency allow |
| TypeScript types: `CarryForwardFallback`, `MemberRhythmPreferences`, `EVENING_TOMORROW_CAPTURE_PROMPTS`, `OnTheHorizonConfig`, backlog metadata fields | Phase B B1 | Wired | `src/types/rhythms.ts` |
| `useMemberPreferences` hook (read with defaults, merge update) | Phase B B4 | Wired | `src/hooks/useMemberPreferences.ts` |

### Enhancement 1 — Evening Tomorrow Capture + Morning Priorities Recall

| Requirement | Source | Status | Notes |
|---|---|---|---|
| 4 rotating prompt framings cycled nightly | Enhancement 1 #5a | Wired | `EVENING_TOMORROW_CAPTURE_PROMPTS` const + `pickOne(rhythmSeed(...))` deterministic per member per day |
| 3 default text inputs with `[+ Add more]` overflow | Enhancement 1 #5b | Wired | `EveningTomorrowCaptureSection.tsx` |
| Debounced fuzzy task matching against existing active tasks | Enhancement 1 #1 | Wired | 350ms debounce, `fuzzyMatchTask` with Jaccard + substring coverage, no external lib |
| Inline confirmation card "Did you mean [X]?" with [Yes] / [No] | Enhancement 1 #1 | Wired | Per-row collapsible card with confirm/dismiss buttons |
| Matched tasks bumped to `priority='now'` on Close My Day | Enhancement 1 | Wired | `commitTomorrowCapture.ts` UPDATE statement |
| Unmatched items create new `tasks` rows with `source='rhythm_priority'`, `due_date=tomorrow` | Enhancement 1 #2 | Wired | Batched insert in commit utility |
| All writes batched on Close My Day, NOT mid-flow | Enhancement 1 | Wired | `RhythmModal.handleComplete` calls `commitTomorrowCapture` before `useCompleteRhythm` |
| Commit failure rolls back: completion NOT written, error banner shown, user can retry | Enhancement 1 | Wired | try/catch in `RhythmModal.handleComplete` with `commitError` state |
| Staged items stored in `rhythm_completions.metadata.priority_items` | Enhancement 1 #3 | Wired | Enriched with `created_task_id`, `matched_task_id`, `matched_task_title`, `focus_selected`, `prompt_variant_index` |
| Overflow handling at 6+ items | Enhancement 1 #5b | Wired | Gentle picker: [Pick top 3] / [Auto by order] / [Keep all] |
| Pick mode: checkbox UI, max 3 selectable, "Done picking" closes mode | Enhancement 1 #5b | Wired | `togglePick` enforces max 3 |
| Auto-pick falls back to insertion order (PRD says "auto by due date" but capture text doesn't have due dates yet) | Enhancement 1 #5b | Wired | First 3 populated rows |
| Morning Priorities Recall section reads previous evening's `metadata.priority_items` | Enhancement 1 #4 | Wired | `MorningPrioritiesRecallSection.tsx` queries most recent completed evening within 48h |
| Recall shows focus_selected items only when overflow happened | Enhancement 1 #5b | Wired | Falls back to all items if no focus_selected flag |
| Recall shows "and X more on your list →" link when overflow exists | Enhancement 1 #5b | Wired | Link to /tasks |
| Recall framing: "Here's what you wanted to focus on:" | Enhancement 1 #4 | Wired | Header text |
| Recall auto-hides if previous evening completion is > 48h old or has no priority items | Enhancement 1 | Wired | Stale-data guard prevents confusion |
| New section type `morning_priorities_recall` (#31) registered in adult morning seed at order 2 | Enhancement 1 #4 | Wired | Phase A migration 100103 already added it; Phase B's renderer fills it in |
| RhythmMetadataContext for modal-scoped staging | Phase B B2 | Wired | Ref-backed store, no re-render thrash |

### Enhancement 5 — Carry Forward Redesign

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Global fallback default per member with 4 options | Enhancement 5 #19 | Wired | Stay / Roll forward / Expire / Backburner |
| Stay as recommended default (ADHD-friendly) | Enhancement 5 #20 | Wired | `DEFAULT_MEMBER_RHYTHM_PREFERENCES.carry_forward_fallback = 'stay'` |
| Per-task override via `tasks.carry_forward_override` column | Enhancement 5 #19 | Wired | Nullable TEXT with CHECK constraint, partial index |
| Roll forward: `UPDATE tasks SET due_date = today` for overdue pending/in_progress | Enhancement 5 | Wired | Edge Function logic |
| Expire: cancelled + archived | Enhancement 5 | Wired | Edge Function logic |
| Backburner: copy title to backburner list, soft-delete task, only if older than `backburner_days` | Enhancement 5 | Wired | Reuses MindSweep pattern (find list by owner_id + list_type='backburner', insert into list_items) |
| Backburner days configurable (default 14) | Enhancement 5 | Wired | `family_members.preferences.carry_forward_backburner_days` |
| Backlog threshold configurable (default 10) | Enhancement 5 #21 | Wired | `family_members.preferences.carry_forward_backlog_threshold` |
| Backlog prompt frequency: weekly (default) or daily | Enhancement 5 #21 | Wired | `carry_forward_backlog_prompt_max_frequency` |
| Backlog prompt fires max once per period via `last_backlog_prompt_at` check | Enhancement 5 #21 | Wired | Edge Function reads recent evening completions |
| Backlog prompt banner renders at top of evening modal when flagged | Enhancement 5 #21 | Wired | `BacklogPromptBanner` sub-component in `RhythmModal.tsx` |
| Banner has [Start sweep] (link to /tasks?filter=overdue) and [Not now] | Enhancement 5 #21 | Wired | Both write `last_backlog_prompt_at` so the prompt doesn't re-fire |
| Carry Forward section preserved as toggleable, OFF by default | Enhancement 5 #22 | Wired | Phase A seed already had `enabled: false` for carry_forward |
| `CarryForwardFallbackSetting` UI in Rhythms Settings | Enhancement 5 | Wired | 4 radios + conditional backburner days input + threshold/frequency inputs |
| Setting wired into RhythmsSettingsPage with member picker | Enhancement 5 | Wired | Mom can configure for any family member |

### Enhancement 8 — On the Horizon

| Requirement | Source | Status | Notes |
|---|---|---|---|
| New section type `on_the_horizon` (#32) seeded into adult morning at order 5 (post-cleanup) | Enhancement 8 #37 | Wired | Migration 100110 added at order 6, migration 100111 renumbered to order 5 after cutting `task_preview` |
| 7-day default lookahead, configurable 3-14 per member | Enhancement 8 #33 | Wired | `OnTheHorizonConfig.lookahead_days`, clamped 3-14 |
| Capped at 3-5 items, nearest first | Enhancement 8 #34 | Wired | `max_items` config, default 5, range 3-10 |
| Excludes items due today (those are in Task Preview... which we cut, but the rule still applies — excluded so the section means "coming up", not "today") | Enhancement 8 | Wired | Query starts at `tomorrow` |
| Excludes items with no due date | Enhancement 8 | Wired | `gte('due_date', startDate)` filter |
| Merges tasks + calendar events sorted by date | Enhancement 8 | Wired | `OnTheHorizonSection.tsx` parallel queries + merge |
| Calendar events filtered to member-attended | Enhancement 8 | Wired | Queries `event_attendees` first, then filters `calendar_events` by attended IDs |
| Calendar events exclude routine recurring events | Enhancement 8 | Wired | `recurrence_rule IS NULL` filter |
| Items in progress (have subtasks OR `task_breaker_level` set) show "In progress" indicator instead of action buttons | Enhancement 8 | Wired | Per-row check via subtask query |
| "Want to break this into steps?" button opens Task Breaker modal | Enhancement 8 #35 | Wired | `TaskBreakerModalFromHorizon` wraps existing TaskBreaker |
| Task Breaker writes child tasks with `parent_task_id` + `source='goal_decomposition'` | Enhancement 8 | Wired | Inherits parent due_date + life_area_tag |
| Task Breaker marks parent with `task_breaker_level='detailed'` so it shows as in progress next render | Enhancement 8 | Wired | Parent UPDATE before subtask insert |
| "Schedule time for this?" — deferred to Phase C | Enhancement 8 | Stubbed | Component renders only [Break into steps] + [Open task] / [Open in calendar] for Phase B; calendar block creation deferred |
| Available for all roles including Independent Teen | Enhancement 8 #36 | Wired | Section type is in adult/independent morning seed; teen framing language is Phase D |
| Empty state: warm "Nothing on the horizon — you're ahead of schedule" (visible, NOT hidden) | Enhancement 8 + founder rule | Wired | Founder explicit decision: "positive reinforcement that they're on top of things" |
| Overflow link "and X more this week →" when total > max_items | Enhancement 8 | Wired | Link to /tasks |
| Per-item expand with action buttons | Enhancement 8 | Wired | Click row to expand; shows actions only for tasks (not events) |

### Periodic Rhythms (Weekly / Monthly / Quarterly)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `WeeklyReviewCard` renders inline in Morning Rhythm on Friday (default) | PRD-18 Screen 4 | Wired | Inside `PeriodicCardsSlot` |
| Weekly Stats: tasks completed, carry forward, intention iterations | PRD-18 §Weekly Section 1 | Wired | 3 stat tiles via direct supabase counts |
| Top Victories: up to 5, sorted by mom_pick → importance → recency | PRD-18 §Weekly Section 2 | Wired | Reuses `useVictories({period:'this_week'})` |
| Next Week Preview: tasks in next 7 days | PRD-18 §Weekly Section 3 | Wired | Direct supabase query |
| Rotating weekly reflection prompt | PRD-18 §Weekly Section 4 | Wired | 10 frontend constants, date-seeded PRNG via `rhythmSeed(memberId, 'weekly_review:prompt', weekStart)` |
| Reflection answer writes to `journal_entries` with `tags=['reflection','weekly_review']`, NOT to `reflection_responses` | Phase B key decision | Wired | Avoids bloating reflection_prompts; uses existing journal pipeline |
| Weekly review deep dive link stub (PRD-16 dependency) | PRD-18 §Weekly Section 5 | Stubbed | "Coming with Meetings" disabled card |
| `[Mark weekly review done]` writes `rhythm_completions` for `rhythm_key='weekly_review'`, `period=YYYY-W##` | PRD-18 | Wired | Uses `useCompleteRhythm` with explicit period param |
| Card hides for the rest of the week after completion via `PeriodicCardWrapper` | PRD-18 | Wired | Per-period completion check |
| `MonthlyReviewCard` renders inline on day 1 of month, OFF by default | PRD-18 Screen 5 | Wired | Phase A seed already had `enabled: false` |
| Monthly stats: tasks completed, victories, intention iterations | PRD-18 | Wired | 3 stat tiles |
| Highlight Reel: top 5 victories from month | PRD-18 | Wired | Reuses `useVictories({period:'this_month'})` |
| Reports link stub | PRD-18 | Stubbed | "Reports page coming soon" |
| Monthly deep dive stub (PRD-16) | PRD-18 | Stubbed | |
| `[Mark monthly review done]` writes completion for `period=YYYY-MM` | PRD-18 | Wired | |
| `QuarterlyInventoryCard` renders inline, OFF by default | PRD-18 Screen 6 | Wired | |
| Stale Areas section stubbed (PRD-12A LifeLantern dependency) | PRD-18 | Stubbed | "LifeLantern coming soon" placeholder |
| Quick Win Suggestion stubbed | PRD-18 | Stubbed | |
| LifeLantern launch link stubbed | PRD-18 | Stubbed | |
| `[Mark inventory done]` writes completion for `period=YYYY-Q#` | PRD-18 | Wired | |
| `PeriodicCardsSlot` real renderer (moved out of StubSections) | Phase B B4 | Wired | Renders cards based on enabled rhythm configs + completion state |
| Cards hide after completion via period-aware completion query | PRD-18 | Wired | `usePeriodicCompletion` queries by exact period string |

### Section Cleanup (Migration 100111 — mid-build founder rule)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Founder rule: "front door OR genuinely helpful" | 2026-04-07 founder decision | Wired | Applied across morning + evening rhythms |
| Adult/Independent morning drops `task_preview` (duplicate of dashboard Active Tasks) | Founder decision | Wired | Backfilled 18 existing rhythms; verified zero remain |
| Calendar Preview stays family-wide for adults | Founder explicit | Wired | No scope config on adult seed |
| `CalendarPreviewSection.scope` prop with `'family'` (default) and `'member'` modes | Founder decision | Wired | Member mode filters via `event_attendees` join |
| Member-scope filter: includes events the member attends OR family-wide events with no attendees | Founder rule | Wired | Auto-hides if zero in scope |
| `SectionRendererSwitch` reads `section.config.scope` and passes to CalendarPreviewSection | Founder decision | Wired | Falls back to 'family' default |
| Guided morning becomes 3 sections: encouraging_message + best_intentions_focus + calendar_preview (member-scoped) | Founder decision | Wired | Backfilled 3 existing Guided members; verified |
| `GuidedEncouragingMessageSection` — 20 hand-authored warm messages, PRNG rotation, name substitution, Reading Support read-aloud | Mid-build addition | Wired | Authored 20 messages, low-pressure, age 8-12 |
| `routine_checklist` removed from Guided morning seed (was duplicate of dashboard Active Tasks; renderer was always null) | Founder decision | Wired | Migration 100111 backfill |
| Closing Thought now requires 5+ active Guiding Stars to render | Founder threshold rule | Wired | `MIN_POOL_SIZE_FOR_BEDTIME_ROTATION = 5` in component; self-tunes |
| From Your Library unchanged (already auto-hides at 0 scripture/quote entries) | Founder decision | Wired | No changes needed |
| `GuidedDashboard.tsx` renders both morning AND evening rhythm cards at position 0 | Bug fix from Phase A | Wired | Phase A only wired evening; this build added morning |
| Drive-by: `TaskPreviewSection` uses `todayLocalIso()` helper instead of inline duplicate | Drive-by cleanup | Wired | Aligns with project-wide UTC sweep |

### Cross-feature integration

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Tomorrow Capture writes integrate with PRD-09A tasks (priority, source, due_date, assignee) | Cross-PRD | Wired | Uses existing `tasks` table, no new columns |
| On the Horizon Task Breaker integration via existing `TaskBreaker` component | Cross-PRD | Wired | Wrapper modal `TaskBreakerModalFromHorizon` |
| Carry Forward Backburner routing reuses MindSweep pattern (find list, insert item, soft-delete task) | Cross-PRD (PRD-17B + Backburner Addendum) | Wired | Edge Function uses identical pattern to `useMindSweep.ts` |
| Periodic rhythm completion writes activity log entries via Phase A trigger | Cross-PRD | Wired | Existing `rhythm_completed` activity log trigger fires |
| Weekly reflection writes to journal_entries with category tags (existing pipeline) | Cross-PRD (PRD-08) | Wired | No journal schema changes needed |

### Phase B stubs (still stubbed — Phase C / Phase D / external dependencies)

| Stub | Reason | Resolution path |
|---|---|---|
| MindSweep-Lite | Phase C scope | Needs Haiku Edge Function for disposition classification |
| Morning Insight | Phase C scope | Needs `match_book_extractions` semantic search + 20 question pool seed |
| Feature Discovery | Phase C scope | Needs activity log engagement queries + frequency gate |
| Rhythm Tracker Prompts | Phase C scope | Needs `dashboard_widgets.config.rhythm_keys` widget settings UI |
| Teen tailored experience | Phase D scope | Needs teen evening template seed, teen MindSweep-Lite dispositions, 15 teen morning insight questions |
| Completed Meetings section | PRD-16 dependency | Wire when Meetings ships |
| Milestone Celebrations section | Gamification dependency | Wire when PRD-24 ships |
| Before You Close The Day section | Phase C scope | Cross-feature pending aggregation |
| Weekly Review deep dive button | PRD-16 dependency | "Coming with Meetings" stub |
| Monthly Review deep dive button | PRD-16 dependency | Same |
| Reports link from Monthly Review | Reports page dependency | "Coming soon" stub |
| Quarterly Inventory Stale Areas / Quick Win / LifeLantern launch | PRD-12A dependency | Stubbed text inside the rendered card |
| On the Horizon "Schedule time for this?" calendar block creation | Phase B simplification | Component currently renders only [Break into steps] + [Open task]; calendar block creation deferred to a future polish pass |
| MindSweep-Lite "delegate" → create message/request | PRD-15 dependency | Wire when delegate disposition lands in Phase C |
| Carry Forward backburner routing in production data | Already wired in Edge Function | Will activate when a member sets fallback to backburner |
| Custom rhythm creation UI | Post-MVP | Rhythms Settings page shows "Custom rhythm creation is coming" placeholder |
| Studio rhythm template browsing | Post-MVP content sprint | "Browse Studio templates" stub |

### Summary

- **Total Phase B requirements verified:** 110
- **Wired:** 92
- **Stubbed:** 18 (all with explicit Phase C / Phase D / external dependency resolution paths)
- **Missing:** **0**

### Live database verification (post-deployment)

| Check | Expected | Actual |
|---|---|---|
| Adult/Independent morning rhythms still containing `task_preview` | 0 | **0** ✓ |
| Guided morning rhythms still containing `task_preview` or `routine_checklist` | 0 | **0** ✓ |
| Guided morning rhythms now containing `encouraging_message` | 3 | **3** ✓ |
| Guided morning rhythms now containing `calendar_preview` with `scope:'member'` | 3 | **3** ✓ |
| Adult morning rhythms total | 18 | **18** ✓ |
| Guided morning rhythms total | 3 | **3** ✓ |
| `tasks.source` allows `'rhythm_priority'` | yes | **yes** ✓ |
| `tasks.carry_forward_override` column exists | yes | **yes** ✓ |
| `rhythm_carry_forward_fallback` feature key registered | yes | **yes** ✓ |
| 5 `feature_access_v2` rows for `rhythm_carry_forward_fallback` | 5 | **5** ✓ |
| `rhythm-carry-forward-fallback` cron job scheduled | yes | **yes** ✓ |
| `process-carry-forward-fallback` Edge Function deployed | yes | **yes** ✓ |
| `tsc -b` zero errors | clean | **clean** ✓ |
| `npm run check:colors` zero hits in Phase B files | clean | **clean** ✓ |

---

## Post-Build PRD Verification — Phase C (2026-04-07)

> Phase C scope: filled the four remaining Phase B stubs — `mindsweep_lite`, `morning_insight`, `feature_discovery`, `rhythm_tracker_prompts` — by wiring them to the existing `mindsweep-sort` Edge Function, `match_book_extractions` RPC, `activity_log_entries` engagement queries, and `dashboard_widgets.config.rhythm_keys` widget configuration. Phase C is adult-only; Phase D owns the teen tailored experience. Migration: `00000000100112_rhythms_phase_c.sql`. New Edge Function: `generate-query-embedding`. Edge Function updated: `mindsweep-sort` (added `rhythm_evening` source_channel).

### Foundation (Phase C schema + infrastructure)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Migration 100112: 20 adult morning_insight_questions seeded | Phase C sub-phase C1 | Wired | NOTICE: `20 adult morning insight questions seeded` |
| Migration 100112: `tasks.source` accepts `'rhythm_mindsweep_lite'` | Phase C sub-phase C1 + Enhancement 2 | Wired | Preserves all Phase B values including `rhythm_priority` |
| Migration 100112: `mindsweep_events.source_channel` accepts `'rhythm_evening'` | Phase C sub-phase C1 + Enhancement 2 | Wired | Allows rhythm sweeps to write events |
| Migration 100112: `auto_provision_member_resources` updated (morning_insight at order 6, feature_discovery at order 8) | Phase C sub-phase C1 | Wired | New member seeds include both Phase C sections |
| Migration 100112: backfill existing 18 adult/independent morning rhythms | Phase C sub-phase C1 | Wired | NOTICE: `Morning rhythms containing morning_insight: 18 (expected = 18)` and same for feature_discovery |
| `mindsweep-sort` Zod enum updated with `rhythm_evening` | Phase C sub-phase C2 | Wired | Deployed to live project |
| `src/types/mindsweep.ts` `SweepEventSourceChannel` updated | Phase C sub-phase C2 | Wired | Keeps frontend + Edge Function in lockstep |
| `generate-query-embedding` Edge Function created + deployed | Phase C sub-phase C3 | Wired | 40-line wrapper around OpenAI text-embedding-3-small |
| TypeScript types: `MindSweepLiteDisposition` rewritten with full destination set + `release` | Phase C sub-phase C1 | Wired | 12 dispositions total; teen variants deferred to Phase D |
| TypeScript types: `DISPOSITION_DISPLAY_NAMES` + `DISPOSITION_PICK_ORDER` constants | Phase C sub-phase C1 | Wired | Drive section UI labels + override dropdown |
| TypeScript types: `RhythmMindSweepItem` rewritten with `classifier_suggested`, `classifier_confidence`, `destination_detail`, `commit_error` | Phase C sub-phase C1 | Wired | Full audit trail preserved in metadata |
| TypeScript types: `MorningInsightMatch` + `FeatureDiscoveryCandidate` + `FeatureDiscoveryAudience` + `WidgetRhythmConfig` + `SYSTEM_RHYTHM_KEYS_FOR_WIDGETS` | Phase C sub-phase C1 | Wired | `src/types/rhythms.ts` |
| Hook: `useMorningInsightQuestions(audience, familyId?)` | Phase C sub-phase C1 | Wired | Filters to system + family-authored active questions |
| Hook: `useFeatureDiscoveryCandidates(memberId, audience)` + `useDismissFeatureDiscovery()` | Phase C sub-phase C1 | Wired | Applies audience + dismissal + engagement filters (14-day window) |
| Hook: `useRhythmTrackerWidgets(familyId, memberId, rhythmKey)` | Phase C sub-phase C1 | Wired | Uses JSONB `contains` operator on `widget_config.rhythm_keys` |
| Feature discovery pool constant: 12 curated entries | Phase C sub-phase C1 | Wired | `src/lib/rhythm/featureDiscoveryPool.ts` — all target adult + teen |
| `RhythmMetadataContext` extended with `stageMindSweepItems` + `readStagedMindSweepItems` | Phase C sub-phase C2 | Wired | Ref-backed staging, no re-render thrash |

### Enhancement 2 — MindSweep-Lite

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Reuses existing `mindsweep-sort` Edge Function (no new classifier) | Enhancement 2 + Phase C founder decision | Wired | Full 11+ destination set available |
| Text-only input with freeform textarea | Enhancement 2 | Wired | No voice/scan/link — users open full MindSweep separately if needed |
| Collapsed by default with chevron expand | Enhancement 2 #7 | Wired | `collapsed_by_default` section config honored |
| Auto-expand on high-task days (≥8 task_completed today) | Enhancement 2 #7 | Wired | Gentle prompt: "Busy day — want to clear your head before bed?" |
| `[Parse]` button calls `mindsweep-sort` via `supabase.functions.invoke` | Enhancement 2 #5 | Wired | source_channel='rhythm_evening', aggressiveness='always_ask', input_type='text' |
| Per-item disposition tag with human-readable label | Enhancement 2 #5 | Wired | `DISPOSITION_DISPLAY_NAMES` — "Calendar Event", "Best Intention", etc. |
| Tap disposition tag → dropdown of 12 options (11 destinations + Release) | Enhancement 2 #5 + founder decision | Wired | Override any classification with one tap |
| `release` disposition is frontend-only; creates no record | Enhancement 2 + founder decision | Wired | Haiku never suggests it; user overrides to it |
| Manual `[+ Add item]` for items not parsed | Enhancement 2 | Wired | Defaults to 'task' disposition, user picks |
| `[Parse again]` re-runs classification on fresh text | Enhancement 2 | Wired | Appends new items, preserves manual entries |
| All state staged in `RhythmMetadataContext` — nothing written mid-flow | Enhancement 2 #6 | Wired | Ref-backed store via `stageMindSweepItems` |
| `commitMindSweepLite` commits all non-release items on Close My Day | Enhancement 2 #6 | Wired | Per-item try/catch, never throws |
| Per-item failure isolation — completion still writes on partial failure | Phase C key decision 3 | Wired | `commit_error` recorded in metadata |
| Direct destinations (journal/victory/guiding_stars/best_intentions/innerworkings/backburner) INSERT directly | Phase C key decision 2 | Wired | `source='rhythm_mindsweep_lite'` on tasks |
| Queue destinations (calendar/archives/recipe) fall back to `studio_queue` | Phase C key decision 2 | Wired | `content_details.source_context='rhythm_evening'` audit tag |
| `list` destination routes to shopping list if exists, studio_queue otherwise | Phase C implementation | Wired | Idempotent fallback |
| MindSweep-Lite section commit wired into `RhythmModal.handleComplete` | Phase C sub-phase C2 | Wired | Commits AFTER `commitTomorrowCapture`, BEFORE `useCompleteRhythm.mutateAsync` |
| Cache invalidation on commit: tasks, journal, victories, guiding_stars, best_intentions, studio_queue | Phase C | Wired | Dashboard + feature pages pick up new records next query |
| Volume2 read-aloud button when `readingSupport=true` | Phase C | Wired | Reads header aloud via `speechSynthesis` |
| Replaces Phase A/B stub in `StubSections.tsx` | Phase C sub-phase C2 | Wired | Real component imported in `SectionRendererSwitch` |

### Enhancement 3 — Morning Insight

| Requirement | Source | Status | Notes |
|---|---|---|---|
| 20 adult question pool seeded via migration 100112 | Enhancement 3 #12 | Wired | Family Friction × 5, Personal Growth × 5, Relationships × 4, Parenting × 3, Values × 3 |
| Date-seeded PRNG picks one question per member per day | Enhancement 3 | Wired | `rhythmSeed(memberId, 'morning:insight_question')` — rotates at midnight |
| `useMorningInsightQuestions('adult', familyId)` reads system + family rows | Phase C sub-phase C1 | Wired | Caches 1 hour — questions rarely change |
| Section header: "Something to think about" | Enhancement 3 #9 | Wired | Warm, inviting, not academic |
| Question displayed at base font size | Enhancement 3 | Wired | Tappable textarea below for optional response |
| Passive matches on mount via question embedding | Enhancement 3 #10 | Wired | `generate-query-embedding` + `match_book_extractions` RPC, 2 matches |
| Active matches on debounced response (350ms) | Enhancement 3 #10 | Wired | Replaces passive matches, 3 matches |
| Each match: book title + section + snippet + `[See in BookShelf →]` link | Enhancement 3 | Wired | Links to `/bookshelf/book/:book_library_id` |
| Live pgvector query via `match_book_extractions` RPC | Enhancement 3 #11 | Wired | Migration 100092, threshold 0.3 |
| Empty BookShelf handling: warm onboarding nudge card | Enhancement 3 #13 | Wired | Question + textarea still render; extractions replaced by "Add a book you love" card |
| No matches above threshold: "No matches yet — as your library grows…" | Enhancement 3 | Wired | Gentle fallback |
| Volume2 read-aloud button when `readingSupport=true` | Phase C | Wired | Reads question aloud |
| Replaces Phase A/B stub | Phase C sub-phase C3 | Wired | Registered in `SectionRendererSwitch` |

### Enhancement 4 — Feature Discovery

| Requirement | Source | Status | Notes |
|---|---|---|---|
| 3 days-per-week PRNG frequency gate | Enhancement 4 #16 + Phase C key decision 6 | Wired | `pickN([0..6], 3, rhythmSeed(memberId, 'morning:feature_discovery_days', today, thisWeekIso))` |
| At least one discovery-free day per week | Enhancement 4 #16 | Wired | Inherent to 3-of-7 pick |
| 12-candidate pool curated in TypeScript constant | Phase C key decision 5 | Wired | `src/lib/rhythm/featureDiscoveryPool.ts` — all existing features |
| Audience filter (adult Phase C; teen Phase D) | Enhancement 4 + Phase C scope | Wired | Hook accepts `audience` param; defaults to 'adult' |
| Engagement filter: 14-day lookback on `activity_log_entries` | Enhancement 4 | Wired | Per-candidate parallel queries (`useFeatureDiscoveryCandidates`) |
| "Meaningful engagement" = matching `event_type` OR `source_table` | Enhancement 4 | Wired | Either match excludes the candidate |
| Dismissal filter: permanent per member via `feature_discovery_dismissals` | Enhancement 4 #17 | Wired | UNIQUE(member_id, feature_key) with idempotent INSERT |
| Date-seeded PRNG picks one candidate per day | Phase C | Wired | `rhythmSeed(memberId, 'morning:feature_discovery_card')` |
| Card with icon + headline + tagline + action button | Enhancement 4 #15 | Wired | Lucide icon looked up by `icon_key`; warm styling |
| Direct action link (not just informational) | Enhancement 4 #15 | Wired | React Router `<Link to={action_route}>` |
| `[Not interested]` dismiss button | Enhancement 4 #17 | Wired | Calls `useDismissFeatureDiscovery.mutateAsync` and removes from pool |
| Auto-hide on non-picked days | Enhancement 4 | Wired | Returns null when today is not in `pickedDays` |
| Auto-hide on empty pool | Enhancement 4 | Wired | Returns null — no "congratulations" card |
| Replaces Phase A/B stub | Phase C sub-phase C3 | Wired | Registered in `SectionRendererSwitch` |

### Enhancement 6 — Rhythm Tracker Prompts

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `dashboard_widgets.config.rhythm_keys` runtime JSONB field | Enhancement 6 #23 | Wired | No schema change — lives inside existing `widget_config` JSONB |
| "Show in Rhythms" collapsible section in `WidgetConfiguration.tsx` | Enhancement 6 | Wired | Below Multiplayer section |
| Multi-select checkboxes for 5 system rhythms | Enhancement 6 #23 | Wired | Morning / Evening / Weekly / Monthly / Quarterly |
| Custom rhythms listed as "coming soon" | Phase C scope | Stubbed | Will unlock with Custom Rhythm creation (post-MVP) |
| Count badge showing number of selected rhythms | Phase C | Wired | Matches Multiplayer section pattern |
| Save merges `rhythm_keys` into existing widget_config preserving all other fields | Phase C | Wired | Spreads `...(rhythmKeys.length > 0 ? { rhythm_keys: rhythmKeys } : {})` |
| `useRhythmTrackerWidgets` query via `.contains()` JSONB operator | Phase C sub-phase C1 | Wired | Translates to Postgres `@>` |
| `RhythmTrackerPromptsSection` auto-hides when no widgets configured | Enhancement 6 | Wired | Returns null on empty/loading |
| Per-rhythm header text via map | Phase C | Wired | "Track for morning" / "Track for evening" / "Weekly tracking" / etc. |
| Widget card with title + `[Log now →]` link to `/dashboard` | Phase C (link-only decision) | Wired | Inline data entry deferred to polish pass |
| Section renders in ANY rhythm (not evening-only) | Enhancement 6 #23 | Wired | Previously called "Custom Tracker Prompts" — now generic |
| Section Type #23 renamed from "Custom Tracker Prompts" to "Rhythm Tracker Prompts" | Enhancement 6 #24 | Wired | Component name, UI header, and convention docs all updated |
| Replaces Phase A/B auto-hide stub | Phase C sub-phase C4 | Wired | Imported from `./RhythmTrackerPromptsSection` in `SectionRendererSwitch` |

### Cross-feature integration

| Requirement | Source | Status | Notes |
|---|---|---|---|
| MindSweep-Lite consumes existing `mindsweep-sort` classification pipeline | PRD-17B reuse | Wired | Zero new Edge Function for classification |
| MindSweep-Lite writes to PRD-09A tasks with `source='rhythm_mindsweep_lite'` attribution | PRD-09A | Wired | Analytics can count rhythm-origin tasks vs ad-hoc |
| MindSweep-Lite writes to PRD-09B list_items via backburner/shopping list reuse | PRD-09B | Wired | Same pattern as `useMindSweep.ts` |
| MindSweep-Lite writes to PRD-08 journal_entries with `tags=['rhythm_mindsweep_lite']` | PRD-08 | Wired | Findable via journal tag filter |
| MindSweep-Lite writes to PRD-11 victories | PRD-11 | Wired | Direct table insert |
| MindSweep-Lite writes to PRD-06 guiding_stars + best_intentions | PRD-06 | Wired | Direct table inserts |
| MindSweep-Lite writes to PRD-07 self_knowledge (innerworkings) | PRD-07 | Wired | Direct table insert with category='general' |
| Morning Insight consumes PRD-23 BookShelf extractions via `match_book_extractions` RPC | PRD-23 | Wired | Reuses migration 100092 semantic search infrastructure |
| Feature Discovery consumes cross-feature `activity_log_entries` | Cross-feature | Wired | Existing 8 event_types sufficient — no new telemetry added |
| Rhythm Tracker Prompts consumes PRD-10 `dashboard_widgets` | PRD-10 | Wired | Runtime config-based filter |

### Phase C stubs (still stubbed — external dependencies)

| Stub | Reason | Resolution path |
|---|---|---|
| Teen MindSweep-Lite framing | Phase D scope | Phase D forks section on `memberRole='independent'` |
| Teen morning insight question pool (15 questions) | Phase D scope | Phase D migration seeds `audience='teen'` rows |
| Teen feature discovery pool prioritization | Phase D scope | Phase D adds teen-specific entries to `featureDiscoveryPool.ts` |
| Teen framing language across all Phase C sections | Phase D scope | Phase D polish pass |
| LiLa dynamic morning insight question generation | PRD-05 day-data context dependency | Phase D or post-MVP |
| Inline widget data entry in `RhythmTrackerPromptsSection` | Polish pass | Phase C ships link-only; inline entry is a later pass |
| Morning Insight question pool CRUD in Rhythms Settings | Post-MVP | 20 seeded defaults suffice for MVP |
| Feature Discovery pool expansion beyond 12 entries | As new features ship | Add entries to `featureDiscoveryPool.ts` alongside new feature launches |
| `before_close_the_day` cross-feature pending aggregation | Not AI-powered; cross-feature polish pass | Phase C leaves stub in place |
| `completed_meetings` auto-hide wiring | PRD-16 dependency | Wire when Meetings ships |
| `milestone_celebrations` auto-hide wiring | PRD-24 gamification dependency | Wire when Gamification ships |
| PRD-14C Family Overview rhythm completion indicators | Post-Phase-D consumption | Phase B writes the rows; Family Overview read is separate |

### Summary

- **Total Phase C requirements verified:** 72 (70 initial + 2 from Build L.1 follow-up)
- **Wired:** 71
- **Stubbed:** 1 (Custom Rhythms item in "Show in Rhythms" multi-select — waits for Custom Rhythms post-MVP work)
- **Missing:** **0**

### Build L.1 follow-up (2026-04-07) — MindSweep-Lite delegate wiring + family_member_names bug fix

Post-ship audit caught two related issues:
  1. **`family_member_names: []` bug** — `MindSweepLiteSection` was passing an empty array to `mindsweep-sort`, which meant the Edge Function's existing `detectCrossMember()` helper had nothing to match against. Any "ask Tenise" / "remind Dad" / "tell the girls" reference was invisible to the classifier during the rhythm evening flow. The section had no way to detect delegation intent at all.
  2. **PRD-15 was already shipped** — my Phase C verification claimed `family_request` commit path was a "PRD-15 dependency — wire when PRD-15 ships," but PRD-15 Phases A through E + Messages group manager fix had all landed before Phase C started. `family_requests` table, RLS, hooks, and Universal Queue Modal Requests tab were fully functional. The blocker I documented didn't exist.

Build L.1 wired both:

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `MindSweepLiteSection` passes real `family_member_names` to `mindsweep-sort` | Build L.1 bug fix | Wired | Pulled from `useFamilyMembers(familyId)`, excludes current member + inactive members, includes `nicknames` array |
| `MindSweepLiteDisposition` union adds `'family_request'` | Build L.1 | Wired | Frontend-only override disposition (like `release`) |
| `DISPOSITION_DISPLAY_NAMES['family_request'] = 'Send as Request'` | Build L.1 | Wired | Human-readable label for the tag UI |
| `DISPOSITION_PICK_ORDER` includes `family_request` at position 2 (after task) | Build L.1 | Wired | Action-oriented options grouped at the top |
| `RhythmMindSweepItem.created_record_type` accepts `'family_request'` | Build L.1 | Wired | Audit metadata now records delegation writes |
| `StagedMindSweepLiteItem` carries `recipient_member_id` + `recipient_name` | Build L.1 | Wired | Required for family_request commit path |
| Cross-member detection promotes `cross_member_action='suggest_route'` results to `family_request` disposition | Build L.1 Option B | Wired | Happens entirely in `MindSweepLiteSection.handleParse` — no `mindsweep-sort` change needed |
| Recipient dropdown under family_request items | Build L.1 | Wired | Mom can override the auto-detected recipient or set one on manually-picked items |
| User-picked `family_request` disposition auto-selects first family member as default recipient | Build L.1 | Wired | Prevents empty-recipient state |
| `family_request` disposition hidden from dropdown when no other family members exist | Build L.1 | Wired | Graceful degradation (solo mom use case) |
| `commitMindSweepLite.routeItem` case `'family_request'` INSERTs into `family_requests` | Build L.1 | Wired | `sender_member_id=memberId`, `recipient_member_id=item.recipient_member_id`, `source='mindsweep_auto'`, `status='pending'` |
| Title ≤ 200 chars; longer text goes into `details` to avoid truncation | Build L.1 | Wired | Splits cleanly without silent data loss |
| Defensive fallback: `family_request` without resolved recipient → auto-downgrade to `task` | Build L.1 | Wired | Wrapper in `commitMindSweepLite` handles edge case; prevents orphan requests |
| Recipient metadata preserved in `rhythm_completions.metadata.mindsweep_items[*].destination_detail` | Build L.1 | Wired | `recipient_member_id` + `recipient_name` stored for audit/history rendering |
| `family-requests` + `family-requests-sent` cache invalidation on commit | Build L.1 | Wired | `RhythmModal.handleComplete` invalidates both PRD-15 hook keys |
| RLS verified: `fr_insert_own` policy allows member to INSERT where `sender_member_id` matches their auth.uid-mapped family_member row | Migration 100098 (pre-existing) | Wired | `commitMindSweepLite` runs client-side, works per spec |
| PRD-15 dependency line corrected in this file | Build L.1 documentation | Wired | Previous "PRD-15 dependency — wire when PRD-15 ships" claim removed; PRD-15 was always shipped |

**Total Build L.1 requirements:** 16 wired, 0 stubbed, 0 missing. `tsc -b` clean after all changes.

### Live database + TypeScript verification

| Check | Expected | Actual |
|---|---|---|
| Adult morning insight questions seeded | 20 | **20** ✓ |
| Adult/Independent morning rhythms backfilled with `morning_insight` | 18 | **18** ✓ |
| Adult/Independent morning rhythms backfilled with `feature_discovery` | 18 | **18** ✓ |
| `tasks.source` accepts `rhythm_mindsweep_lite` | yes | **yes** ✓ |
| `mindsweep_events.source_channel` accepts `rhythm_evening` | yes | **yes** ✓ |
| `mindsweep-sort` Edge Function deployed with updated source_channel enum | yes | **yes** ✓ |
| `generate-query-embedding` Edge Function deployed | yes | **yes** ✓ |
| `npx tsc -b` zero errors | clean | **clean** ✓ |
| `npm run check:colors` zero hits in Phase C files | clean | **clean** ✓ (only pre-theme auth pages remain — pre-existing, exempt per convention) |

---

## Post-Build PRD Verification — Phase D (2026-04-07)

> Phase D scope: filled the final Enhancement Addendum gap (Enhancement 7 — Independent Teen tailored rhythm experience). Forked the seeding trigger so independents get a 7-section morning + 8-section evening with teen framing, "Morning Check-in"/"Evening Check-in" display names, reflection_guideline_count=2, the 15 teen morning insight questions, the teen-only feature discovery entries, and a purpose-built `MindSweepLiteTeenSection` component with the 4-option Schedule/Journal/Talk-to-someone/Let-it-go dropdown. The new `talk_to_someone` disposition writes a PRIVATE journal entry (`"Reminder to talk to [Name] about: ..."`) and NEVER touches `family_requests`. All Phase A/B/C adult code paths are unchanged. Migration: `00000000100114_rhythms_phase_d_teen.sql`. New component: `MindSweepLiteTeenSection.tsx`. New commit case: `talk_to_someone` in `commitMindSweepLite.ts`. New types: `TeenDisposition`, `TEEN_DISPOSITION_DISPLAY_NAMES`, `TEEN_DISPOSITION_PICK_ORDER`, `RhythmAudience`. Audience derived at render time from `family_members.dashboard_mode`.

### Foundation (Phase D schema + types + plumbing)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Migration 100114: 15 teen morning_insight_questions seeded | Phase D sub-phase D1 | Wired | NOTICE: `Teen morning insight questions seeded: 15 (expected >= 15)` |
| Migration 100114: `auto_provision_member_resources` forked with `ELSIF NEW.dashboard_mode = 'independent'` branch | Phase D sub-phase D1 | Wired | New independents get teen-tailored 7/8-section rhythms automatically |
| Migration 100114: backfill 7 active independent teens — INSERT missing rows + UPDATE existing teen morning + evening rows | Phase D sub-phase D1 | Wired | NOTICE: `Teen morning rhythm_configs: 7 (expected = 7)`, same for evening |
| Migration 100114: idempotent — backfill UPDATE gated by display_name != "Morning Check-in" | Phase D sub-phase D1 | Wired | Re-running migration is a no-op after first apply |
| Adult morning rhythms unchanged (still 9 sections) | Phase D regression check | Wired | NOTICE: `Adult morning rhythms with 9 sections (unchanged): 11` |
| Adult evening rhythms unchanged (still 13 sections) | Phase D regression check | Wired | NOTICE: `Adult evening rhythms with 13 sections (unchanged): 11` |
| Guided evening rhythms unchanged (still 5 sections) | Phase D regression check | Wired | Live DB query: 3 of 3 |
| TypeScript types: `MindSweepLiteDisposition` adds `'talk_to_someone'` | Phase D sub-phase D1 | Wired | Union member added; exhaustive `never` switch in `commitMindSweepLite` validates |
| TypeScript types: `TeenDisposition` narrowed union (4 options) | Phase D sub-phase D1 | Wired | `'task' \| 'journal' \| 'talk_to_someone' \| 'release'` |
| TypeScript types: `TEEN_DISPOSITION_DISPLAY_NAMES` + `TEEN_DISPOSITION_PICK_ORDER` constants | Phase D sub-phase D1 | Wired | Drives teen UI labels + override dropdown |
| TypeScript types: `RhythmAudience = 'adult' \| 'teen'` | Phase D sub-phase D1 | Wired | Forwarded through renderer chain |
| `RhythmDashboardCard` derives audience from `dashboard_mode === 'independent'` via `useFamilyMembers` lookup | Phase D sub-phase D1 | Wired | Works correctly in ViewAs mode (memberId is the rendered member, not the viewer) |
| Audience prop plumbed `RhythmDashboardCard → RhythmModal → SectionRendererSwitch → section components` | Phase D sub-phase D1 | Wired | Defaults to `'adult'` for safety |
| `commitMindSweepLite.ts` adds `case 'talk_to_someone'` writing to `journal_entries` | Phase D sub-phase D1 | Wired | Content format: `"Reminder to talk to [Name] about: [text]"` (or `"... someone about: ..."` if no recipient) |
| `commitMindSweepLite` `talk_to_someone` writes `tags=['rhythm_mindsweep_lite','talk_to_someone']` and `visibility='private'` | Phase D sub-phase D1 | Wired | Findable via journal tag filter, never visible outside the teen's private journal |
| `commitMindSweepLite` `family_request` auto-downgrade logic untouched and still scoped to family_request only | Phase D founder rule | Wired | Teen `talk_to_someone` cannot be downgraded to anything; gracefully handles missing recipient via "someone" default |
| `tsc -b` zero errors after D1 | Phase D sub-phase D1 | Wired | Verified |

### Enhancement 7 — MindSweep-Lite teen variant (D2)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `MindSweepLiteTeenSection.tsx` is a SEPARATE component file (not a prop-fork of adult) | Phase D founder decision | Wired | Adult `MindSweepLiteSection` untouched; teen file is ~520 lines |
| Teen header reads "Anything looping?" (not "Something on your mind?") | Enhancement 7 | Wired | Auto-expand prompt: "Rough day? Dump what's in your head." |
| Teen textarea placeholder uses teen voice | Enhancement 7 | Wired | `"I said something weird in English class. Need to finish the lab report by Friday..."` |
| Teen `[Sort it]` button label (not `[Parse]`) | Enhancement 7 | Wired | Re-sort label: `[Sort again]` |
| Teen 4-option dropdown via `TEEN_DISPOSITION_PICK_ORDER` | Enhancement 7 | Wired | Hides adult-only dispositions (family_request, guiding_stars, victory, etc.) |
| `adultDestinationToTeenDisposition` translator function maps adult destinations → teen 4 options at display time | Phase D founder rule | Wired | `task/calendar → task`; `journal/innerworkings/best_intentions/etc → journal`; `cross_member_action='suggest_route' → talk_to_someone`; `release → release` |
| `mindsweep-sort` Edge Function untouched (stays platform-level) | Phase D founder rule | Wired | Teen calls the same Edge Function with the same params; translation happens in frontend only |
| Cross-member detection promotes to `talk_to_someone` (NOT `family_request`) | Phase D founder rule | Wired | The trigger that promotes to family_request in the adult component is replaced with talk_to_someone promotion in the teen component |
| Teen recipient picker UI: "Remind yourself to talk to: [Name]" | Phase D founder decision | Wired | Reinforces the private-self-reminder framing — nothing goes out |
| Teen `[+ Add item]` defaults to `journal` disposition (not `task` like adults) | Enhancement 7 | Wired | Teens manually adding items are more likely to be journaling than scheduling |
| Teen footer copy: "These get saved when you close your day. Nothing goes out — it's all yours." | Phase D founder decision | Wired | Reinforces ownership + privacy |
| Teen Volume2 read-aloud button when `readingSupport=true` | Phase D parity with adults | Wired | Reads "Anything looping?" header aloud |
| `SectionRendererSwitch` forks `mindsweep_lite` on `cfg?.audience === 'teen' \|\| audience === 'teen'` | Phase D sub-phase D2 | Wired | Config marker wins; audience prop is the fallback |
| Teen narrowed `TeenWorkingItem` interface guarantees no family_request items can be constructed | Phase D type safety | Wired | TypeScript prevents the teen section from ever staging a family_request |
| `tsc -b` zero errors after D2 | Phase D sub-phase D2 | Wired | Verified |

### Enhancement 7 — Teen framing variants (D3)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `GuidingStarRotationSection` accepts `framingText` prop (already existed) — teen passes `"You said this matters to you:"` | Enhancement 7 #28 | Wired | Seeded via `config.framingText` on the teen morning seed at section order 1; renderer also has audience-fallback default |
| `EveningGreetingSection` adds `variant?: 'adult' \| 'teen'` prop | Enhancement 7 | Wired | Teen headline: `"Hey [Name], how'd today go?"`; teen subhead: `"Let's see what went right and set you up for tomorrow."` |
| `AccomplishmentsVictoriesSection` adds `title?: string` prop | Enhancement 7 | Wired | Teen title: `"What went right today"` instead of `"Today's Wins"` (header AND empty state) |
| `ClosingThoughtSection` adds `framingText?: string` prop | Enhancement 7 #28 | Wired | Teen framing: `"Something you believe:"` rendered as small uppercase label below the star |
| `MorningInsightSection` audience prop wired (was hardcoded `'adult'` in Phase C) | Phase C → D follow-up | Wired | Teen passes `audience='teen'`, hook pulls from the 15 teen-seeded questions |
| `SectionRendererSwitch` reads `section.config.variant / .audience / .title / .framingText` first, falls back to audience-derived defaults | Phase D config-first principle | Wired | Allows future per-section mom overrides via Rhythms Settings without code changes |
| `cfgFramingText` helper extracted at top of switch — used by `guiding_star_rotation` AND `closing_thought` | Phase D code clarity | Wired | One place to read framing config; both sections use it |
| Adult `MorningInsightSection` behavior unchanged (still passes `'adult'` when not in teen context) | Phase D regression check | Wired | Default audience prop is `'adult'`; tsc + manual config check confirm |

### Enhancement 7 — Teen Feature Discovery additions (D3)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `bookshelf_for_school` teen-only entry added to `featureDiscoveryPool.ts` | Enhancement 7 #32 | Wired | `audiences: ['teen']`, school-use generic framing, dynamic book-title injection deferred post-MVP per founder |
| `thoughtsift_translator_teen` teen-only entry added | Enhancement 7 | Wired | `audiences: ['teen']`, teen-voice framing about texting friends/teachers/mom |
| `journal_tagged_teen` teen-only entry added | Enhancement 7 | Wired | `audiences: ['teen']`, emphasizes privacy ("It's just yours — mom can only see it if you choose to show her") |
| All 12 existing pool entries already have `audiences: ['adult','teen']` | Phase C foundation | Wired | No changes needed; teens see the union of shared + teen-only entries |
| Engagement exits share `source_tables` across adult + teen variants (e.g. uploading any book exits both `bookshelf_upload_first` AND `bookshelf_for_school`) | Phase D dedup principle | Wired | Avoids redundant nudges after first engagement |
| `FeatureDiscoverySection` already accepted `audience` prop in Phase C | Phase C foundation | Wired | Now actually receives `'teen'` from the renderer chain |
| `SectionRendererSwitch` resolves `feature_discovery` audience from config OR derived audience | Phase D sub-phase D3 | Wired | Same config-first pattern as morning_insight |
| `tsc -b` zero errors after D3 | Phase D sub-phase D3 | Wired | Verified |

### Cross-feature integration

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Teens use existing `mindsweep-sort` Edge Function (no teen-specific calibration) | Phase D founder rule | Wired | Translation happens in frontend; Edge Function stays platform-level |
| Teen `talk_to_someone` writes to PRD-08 `journal_entries` with teen-specific tags | PRD-08 reuse | Wired | `tags=['rhythm_mindsweep_lite','talk_to_someone']`, `visibility='private'` |
| Teen `talk_to_someone` NEVER writes to PRD-15 `family_requests` | Phase D founder rule | Wired | Teen disposition `family_request` is not in `TEEN_DISPOSITION_PICK_ORDER`; teen section never produces items with that disposition; commit case for talk_to_someone is a separate code path |
| Teens use existing `match_book_extractions` RPC for Morning Insight (PRD-23) | PRD-23 reuse | Wired | Same semantic search as adults; only the question pool differs |
| Teens use existing `activity_log_entries` for Feature Discovery engagement (PRD-11) | Cross-feature reuse | Wired | Same 14-day lookback, same engagement types |
| Audience derivation via `useFamilyMembers(familyId)` is query-cache-shared with the rest of the app | Performance | Wired | Zero additional fetch cost |

### Phase D stubs (still stubbed — external dependencies)

| Stub | Reason | Resolution path |
|---|---|---|
| Teen rhythm request flow (teen customizes a rhythm → mom's Requests tab) | Post-MVP UX scope | Future Rhythms Settings teen customization surface + Universal Queue Modal routing |
| Teen-specific weekly/monthly/quarterly rhythm differentiation | Out of Phase D scope | Phase D only forks morning + evening + reflection count; periodic rhythms identical to adults |
| LiLa dynamic teen morning insight question generation | PRD-05 day-data context dep | Post-MVP — 15 hardcoded teen questions sufficient for MVP |
| Dynamic book-title injection in teen BookShelf discovery framing ("Your library has [Biology Essentials]") | Requires BookShelf subject tagging | Post-MVP content sprint |
| Studio rhythm template library with teen-specific templates | No `rhythm_templates` table | Post-MVP content sprint |
| Gamification point events for teen rhythm completions | PRD-24 dependency | Wire when Gamification ships |
| Teen rhythm completion indicators on Family Overview | PRD-14C consumption layer | Post-Phase-D consumption work |
| Teen Rhythms Settings customization UI | Tied to teen rhythm request flow | Mom can already toggle teen sections via the existing Rhythms Settings page by member-picking the teen |

### Live database verification

| Check | Expected | Actual |
|---|---|---|
| Teen morning insight questions seeded | 15 | **15** ✓ |
| Active independent teens in DB | 7 | **7** ✓ |
| Teens with morning rhythm + display_name = "Morning Check-in" | 7 | **7** ✓ |
| Teens with evening rhythm + display_name = "Evening Check-in" | 7 | **7** ✓ |
| Teen morning + evening rhythms with reflection_guideline_count=2 | 14 | **14** ✓ |
| Adult morning rhythms still 9 sections (unchanged) | 11 | **11** ✓ |
| Adult evening rhythms still 13 sections (unchanged) | 11 | **11** ✓ |
| Guided evening rhythms still 5 sections (unchanged) | 3 | **3** ✓ |
| `npx tsc -b` zero errors | clean | **clean** ✓ |
| `npm run check:colors` zero hits in Phase D files | clean | **clean** ✓ (only pre-existing auth pages remain — exempt) |

### Summary

- **Total Phase D requirements verified:** 56
- **Wired:** 56
- **Stubbed:** 0 (the 8 entries in the "Phase D stubs" table are external-dependency or post-MVP scope, not Phase D scope)
- **Missing:** **0**

### Build N.2 follow-up (2026-04-07) — Teen "Ask someone" mid-rhythm request disposition

Post-Phase-D founder request: teens should be able to send a real outbound request to a family member from inside MindSweep-Lite when they realize mid-rhythm that they need to ask for something. Build N.2 adds this as a teen-opt-in 5th disposition that reuses the existing adult `family_request` commit path (Build L.1) — zero new schema, zero new commit case, zero touches to adult code paths.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `TeenDisposition` union expanded from 4 → 5 to include `'family_request'` | Build N.2 | Wired | `'task' \| 'family_request' \| 'journal' \| 'talk_to_someone' \| 'release'` |
| `TEEN_DISPOSITION_DISPLAY_NAMES['family_request'] = 'Ask someone'` | Build N.2 | Wired | Parallels "Talk to someone" structurally — both action-verb-first, both end in "someone" |
| `TEEN_DISPOSITION_PICK_ORDER` slots `family_request` second (after `task`, before `journal`) | Build N.2 | Wired | Mirrors adult ordering pattern; makes the founder-requested feature prominent |
| Classifier NEVER auto-suggests `family_request` for teens | Build N.2 founder rule | Wired | `adultDestinationToTeenDisposition` still maps `cross_member_action='suggest_route'` → `'talk_to_someone'` (private), NEVER → `'family_request'` (outbound) |
| Teen `family_request` is user-override-only | Build N.2 founder rule | Wired | The teen must consciously open the dropdown and pick "Ask someone" |
| `handleUpdateDisposition` extended to handle `family_request` symmetrically with `talk_to_someone` | Build N.2 | Wired | Refactored via shared `RECIPIENT_DISPOSITIONS` const; switching ON either disposition without a recipient auto-picks first family member; switching OFF clears recipient |
| Dropdown hides `family_request` when no other family members exist | Build N.2 | Wired | Solo-mom-and-teen edge case — both `family_request` and `talk_to_someone` filtered out when `familyMemberNames.length === 0` |
| Recipient picker label switches: `talk_to_someone` → "Remind yourself to talk to:", `family_request` → "Send to:" | Build N.2 founder rule | Wired | Two distinct labels make the privacy difference visible at a glance |
| Recipient picker dropdown lists ALL active family members (not parents-only) | Founder decision | Wired | Mirrors adult `family_request` scope; future per-family restriction is post-MVP |
| Footer copy adapts: shows "Anything tagged 'Ask someone' goes out as a real request — everything else stays just yours" when any item is tagged family_request, otherwise "Nothing goes out — it's all yours" | Build N.2 | Wired | Original copy was a lie once family_request became reachable; the conditional preserves the privacy assurance for the 99% case where no items are tagged for outbound |
| Help text near textarea adds "Need to actually ask someone something? Tap a tag and pick 'Ask someone.'" | Build N.2 | Wired | Discoverability nudge so teens know the option exists |
| `commitMindSweepLite.ts` `case 'family_request'` reused as-is from Build L.1 | Build N.2 (zero-touch principle) | Wired | Same `family_requests` row, same `source='mindsweep_auto'`, same `recipient_member_id` field, same defensive auto-downgrade to `task` when recipient is missing |
| Founder-critical rule preserved: `talk_to_someone` STILL never writes to `family_requests` | Phase D founder rule + Build N.2 | Wired | Two separate dispositions, two separate commit cases. Build N.2 added a SECOND outbound option, didn't merge the two private/outbound paths. |
| Adult `MindSweepLiteSection.tsx` untouched | Build N.2 zero-touch principle | Wired | Verified via grep — no changes to adult component or adult commit paths |
| `tsc -b` zero errors | Build N.2 | Wired | Verified |
| CLAUDE.md convention 192 updated (4 → 5 dispositions) | Build N.2 | Wired | Documents the addition |
| CLAUDE.md convention 197 added — opt-in-only family_request rule | Build N.2 | Wired | New convention captures the privacy-first auto-suggest defaults + the user-override-only escalation path |

**Build N.2 totals:** 17 wired, 0 stubbed, 0 missing.

### What Build N.2 unlocks for teens

A teen mid-rhythm realizes "Mom needs to sign the field trip slip by Wednesday." They type it into MindSweep-Lite. Haiku classifies it as a task. The teen taps the disposition tag, opens the dropdown, picks "Ask someone." The recipient dropdown auto-populates with Mom; teen can change to anyone in the family. They close their day. A real `family_requests` row writes with `recipient_member_id = mom`, `title = "Mom needs to sign the field trip slip by Wednesday"`, `source = 'mindsweep_auto'`, `status = 'pending'`. Mom opens her Universal Queue Modal next morning, sees the request in the Requests tab, and routes it to Calendar/Tasks/Acknowledge.

Same pipeline as adult MindSweep-Lite delegate from Build L.1 — but teen-vocabulary, teen-defaults, teen-discoverable.

### Build N.2 stubs (still stubbed — out of scope)

| Stub | Reason | Resolution path |
|---|---|---|
| Per-family restriction on teen request recipients (parents-only mode) | Founder noted "other parents may want to limit that" but it's not in current scope | Post-MVP family settings preference |
| Custom Rhythms creation surface for teens (for the OTHER kind of teen rhythm request — customizing rhythm sections themselves) | Out of Build N.2 scope; tied to the broader Custom Rhythms build | When Custom Rhythms ships, teens get the rhythm-customization request flow alongside the in-rhythm request flow shipped here |

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed per phase
- [x] All stubs are acceptable for this phase
- [x] Zero Missing items confirmed per phase
- [x] **Phase A approved as complete** — 2026-04-07
- [x] **Phase B approved as complete** — 2026-04-07
- [x] **Phase C approved as complete** — 2026-04-07
- [x] **Phase D approved as complete** — 2026-04-07 (includes Build N.2 follow-up + e2e verification)

**PRD-18 (Rhythms & Reflections) is feature-complete.** All four phases (A → B → C → D) shipped + Build N.2 "Ask someone" mid-rhythm request disposition + Playwright e2e test (`tests/e2e/features/rhythms-teen-phase-d.spec.ts`) passing end-to-end against live DB. Remaining work lives in post-MVP dependencies (PRD-05 dynamic prompts, Custom Rhythms creation surface, Studio rhythm template library, dynamic BookShelf book-title injection, PRD-14C Family Overview consumption, gamification points for rhythm completions, push notifications, voice-to-text).
