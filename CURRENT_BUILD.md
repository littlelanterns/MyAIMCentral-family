# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.
> Multiple concurrent builds are tracked with separate sections below.

## Status: PRE-BUILD — Build M (PRD-24 + PRD-26 Play Dashboard + Sticker Book) approved, fresh-session start scheduled

> **Build N (PRD-18 Phase D + Build N.2 follow-up) signed off 2026-04-07.** PRD-18 (Rhythms & Reflections) is feature-complete across all four phases (A → B → C → D). Phase D implementation: 56 wired, 0 stubbed, 0 missing. Build N.2 follow-up (teen "Ask someone" mid-rhythm request disposition): 17 wired, 0 stubbed, 0 missing. Verified end-to-end via Playwright (`tests/e2e/features/rhythms-teen-phase-d.spec.ts` — Alex teen flow with 3 family_requests written to Mom/Dad/Casey, zero talk_to_someone cross-contamination, founder-critical privacy rule confirmed). Migration `00000000100114_rhythms_phase_d_teen.sql` applied. New component `MindSweepLiteTeenSection.tsx`. 9 new CLAUDE.md conventions (189–197). Verification table archived to `claude/feature-decisions/PRD-18-Rhythms-Reflections.md`. Adult Phase A/B/C code paths regression-clean. PRD-18 remaining work is all post-MVP dependencies (PRD-05 dynamic prompts, Custom Rhythms creation surface, Studio rhythm template library, dynamic BookShelf book-title injection, PRD-14C consumption, gamification points, push notifications, voice-to-text).
>
> **Build M (PRD-24 + PRD-26 Play Dashboard + Sticker Book Gamification — Baby Step)** is **APPROVED**, fresh-session start scheduled. Pre-build paperwork completed 2026-04-07; no code written yet. See the Build M section directly below + the [feature decision file](claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md) for the full plan. The fresh session reads §0 (sign-off record) → §17 (Sub-phase A kickoff checklist) FIRST, then references §1–§16 as needed.

---

# Build M: PRD-24 + PRD-26 — Play Dashboard + Sticker Book Gamification (Baby Step) — APPROVED 2026-04-07, FRESH-SESSION START

> **Status:** APPROVED, no code written, fresh-session kickoff scheduled. This build is the first gamification write-path build — `family_members.gamification_points` and related columns have existed since migration `00000000000001` but nothing writes to them yet. Build M fixes that AND replaces the broken Play Dashboard (currently rendering the adult Dashboard.tsx inside PlayShell) with a real age-appropriate surface.

### Feature Decision File
**[claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md](claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md)** — fully approved 2026-04-07. The fresh session reads §0 (sign-off record) → §17 (Sub-phase A kickoff checklist) FIRST, then references §1-§16 as needed.

### PRD Files
- `prds/dashboards/PRD-26-Play-Dashboard.md` (full PRD — 650 lines)
- `prds/gamification/PRD-24-Gamification-Overview-Foundation.md` (full PRD — 1374 lines)
- `prds/gamification/PRD-24A-Overlay-Engine-Gamification-Visuals.md` (architectural reference — 1986 lines, NOT used as direct spec — overlay 4-stage progression is replaced by sticker book mechanic per founder override #1)
- `prds/gamification/PRD-24B-Gamification-Visuals-Interactions.md` (Reveal Type Library reference — 1443 lines, NOT used as direct spec — only the 2 Manus reveal videos are used)

### Addenda Read
- `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-24A-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`
- `prds/addenda/PRD-24B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-24B-Content-Pipeline-Tool-Decisions.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Predecessor + Collision Notes
- **Build L (PRD-18 Phase C)** completed 2026-04-07
- **Build N (PRD-18 Phase D + N.2)** implementation completed 2026-04-07, awaiting founder sign-off — runs immediately above this section
- **MIGRATION FILENAME COLLISION RESOLVED:** Build N took `00000000100114_rhythms_phase_d_teen.sql` (the number Build M originally reserved). Build M's migration is now **`00000000100115_play_dashboard_sticker_book.sql`** — updated throughout the feature decision file 2026-04-07.
- **`auto_provision_member_resources` trigger collision risk:** Build N forked the trigger function to add an Independent-teen branch. Build M's trigger extension (per feature decision file §7.6) must INSERT new logic into the same trigger, **preserving Build N's teen branch**. The fresh session MUST read the live trigger function via `pg_get_functiondef('auto_provision_member_resources'::regproc)` BEFORE writing the new `CREATE OR REPLACE FUNCTION` to avoid wiping Build N's work. This is the #1 collision risk for Build M's Sub-phase A and is flagged in §17 of the feature decision file.
- **`tasks.source` CHECK constraint:** Build N did NOT modify it. Latest baseline is Build L at `00000000100112_rhythms_phase_c.sql:80-99` with 16 values. Build M's rebuild copies all 16 + adds `'randomizer_reveal'` for 17 total.

### Manus Tasks Pending Before Build Completion
1. **Manus CSV correction commit on `manus/woodland-felt-manifest` branch** — first action of Sub-phase A. Mossy Chest = creature reveal, Fairy Door = page unlock reveal. Founder reconfirmed twice. Spec at feature decision file §15.1. After commit, the Manus branch gets merged to main BEFORE the Build M migration runs.
2. **Manus `vs_task_default` fallback asset generation** — 3 variants × 3 sizes = 9 PNG files, paper craft style, generic cheerful task icon. Spec at [asset-requirements/manus-vs-task-default-fallback.md](asset-requirements/manus-vs-task-default-fallback.md). Must ship before Sub-phase B completes (Play tile rendering depends on it as the universal fallback).

### Founder Sign-Off Summary (2026-04-07, three rounds)
- **Round 1:** All 10 original questions answered (Q1-Q10) + 4 scope splits confirmed. See feature decision file §0 Round 1.
- **Round 2:** §16 addendum added for Play tile paper craft icons from `platform_assets`.
- **Round 3:** All 3 addendum questions answered (A1=soft reference `tasks.icon_asset_key + icon_variant`, A2=hybrid seed migration without embeddings, A3=hybrid tag + embedding search per concrete hook spec at §16.6b). Reveal mapping reconfirmed explicitly. Manus fallback asset task approved. One end-to-end review after Sub-phase F (no checkpoint reviews). **Build kickoff = fresh session.** This session is paperwork only.

### Pre-Build Summary

#### Context

Two tightly coupled goals:

1. **Play Dashboard is currently broken** — Play members render `Dashboard.tsx` inside `PlayShell` instead of a real Play surface. There is no `PlayDashboard.tsx`, no big task tile grid, no widget slots sized for little fingers. A 3-7 year old cannot use the current state.
2. **Gamification infrastructure has been fully laid down but nothing writes to it.** `family_members.gamification_points`, `gamification_level`, `current_streak`, `longest_streak`, `last_task_completion_date`, `streak_grace_used_today` all exist as columns. `useCompleteTask` never touches any of them. The PRD-24 gamification event pipeline has zero lines of code.

Build M fixes both with a Sticker Book mechanic:
- `useCompleteTask` extended to call a new server-side RPC `roll_creature_for_completion(p_task_completion_id)` that calculates points, updates streak, optionally awards a creature collectible, and optionally unlocks a sticker book page
- 161 Woodland Felt creatures + 26 sticker book pages + 2 reveal videos already in Supabase Storage (via Manus branch, awaiting CSV amendment + merge)
- Creature reward → Mossy Chest reveal video plays. Page unlock reward → Fairy Door reveal video plays.
- New `PlayDashboard.tsx` page renders task tiles with paper craft icons from `platform_assets` (NEVER emoji per founder addendum), the Sticker Book widget showing the active page + creature count, and the existing widget grid

Sub-phase A also adds the §16 addendum: Play task tiles render paper craft images via a hybrid tag-search + embedding-search picker integrated into `TaskCreationModal` for Play-assigned tasks.

#### What this build does NOT touch

Treasure boxes, reward menu + redemption, Family Leaderboard, 8-type Reveal Library, overlay engine, 4-stage progression, DailyCelebration Step 3/4 wiring (still auto-skipped), reveal tiles on Play Dashboard (stubbed), mom's message card (stubbed), schedule-aware streaks (naive consecutive-day for baby step), task unmark cascade, drag-to-reposition creatures, sticker book page curation UI (mom-facing), multi-theme support, `gamification_events` ledger, `gamification_daily_summaries` rollup, `gamification_achievements` badges, graduation flow, Play calendar section, currency customization UI, reveal visual picker, per-page custom unlock triggers, practice sessions earning points (explicit "no" design decision).

Full list in feature decision file §6 + §16.7.

#### Sub-phases (6, each ending at `tsc -b` checkpoint, no checkpoint reviews)

| Sub-phase | Scope | Migration / Code Changes |
|---|---|---|
| **A — Foundation** | 6 new tables, 2 altered tables, RPC, trigger extension, 7 feature keys, ~500 inline-VALUES seed rows for Woodland Felt, ~328 inline-VALUES rows for visual_schedule library WITHOUT embeddings | Migration `00000000100115_play_dashboard_sticker_book.sql` (note: 100114 collision avoided — see Predecessor section above). First commits BEFORE the migration: Manus CSV correction + branch merge. |
| **B — Play Dashboard shell + paper craft icons** | `PlayDashboard.tsx` page, 6 new components, `extractTaskIconTags` util, `useTaskIconSuggestions` hybrid hook, `TaskIconPicker` + `TaskIconBrowser` components, `TaskCreationModal` modification, `PlayTaskTile` rendering overhaul (NEVER emoji) | ~10 new files, 2 modified files. Concrete hook spec at feature decision file §16.6b. |
| **C — Gamification write path** | Extend `useCompleteTask` + `useApproveCompletion` to call `roll_creature_for_completion` RPC | 2 hook edits, 1 new type, surgical change |
| **D — Sticker Book UI** | `CreatureRevealModal` + `PageUnlockRevealModal` (plays the two Manus videos) + `StickerBookDetailModal` + `StickerOverlay` | 4 new components, modal queue pattern in PlayDashboard.tsx |
| **E — Minimal mom management** | Settings screen with master toggle, sticker book toggle, points-per-task, page unlock interval, reset button | 1 new settings screen |
| **F — Verification + documentation** | STUB_REGISTRY updates, CLAUDE.md additions (~10 new conventions starting at #198+), post-build verification table, founder sign-off | Documentation only |

#### Stubs (NOT Building Phase A)

See feature decision file §10 + §16.8 for the full list of ~25 stubs created/preserved by this build. Headline items: treasure boxes, reward menu, leaderboard, 8-reveal library, overlay engine, stage progression, DailyCelebration Step 3/4, reveal tiles, mom message card, sticker book page curation UI, drag-to-reposition.

#### Key Decisions Locked In (with feature decision file references)

| # | Decision | Reference |
|---|---|---|
| 1 | Sticker Book replaces overlay 4-stage progression | §3 Override #1 |
| 2 | Mossy Chest = creature reveal, Fairy Door = page unlock reveal | §3 Override #4 + reconfirmed twice in §0 |
| 3 | Woodland Felt is its own theme, NOT the hypothetical "Pets" theme from PRD-24A | §3 Override #5 |
| 4 | Server-side RPC `roll_creature_for_completion` is the canonical gamification pipeline endpoint | §0 Q6 + §7.5 (11-step logic) |
| 5 | Practice sessions never earn points — only `completion_type='complete'`/NULL/`mastery_approved` trigger the pipeline | §0 Q8 + §7.5 step 3 |
| 6 | Naive consecutive-day streak for baby step; schedule-aware deferred | §0 Q5 + §7.5 step 5 |
| 7 | Auto-place creatures on award; drag-to-reposition is schema-supported but UI-deferred | §0 Q10 |
| 8 | Soft reference icon pattern (`tasks.icon_asset_key + icon_variant`) matching existing `visual_schedule_routine_steps` convention | §0 Round 3 A1 |
| 9 | Hybrid seed migration for visual_schedule library — 328 rows WITHOUT embeddings, embeddings backfilled later | §0 Round 3 A2 |
| 10 | Hybrid search hook — instant tag search Stage 1 + 500ms debounced embedding refine Stage 2, embedding failure falls back silently to tag results | §0 Round 3 A3 + §16.6b concrete hook spec |

---

# Build N: PRD-18 Phase D — Independent Teen Tailored Rhythm Experience (Enhancement 7)

### PRD Files
- `prds/daily-life/PRD-18-Rhythms-Reflections.md`

### Addenda Read
- `prds/addenda/PRD-18-Enhancement-Addendum.md` (**primary authoritative source — Enhancement 7 full spec, lines 288–391**)
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-18-Rhythms-Reflections.md` (Phase D scope at lines 527–543; shell behavior override row for Independent Teen at line 253; decisions 26–32 for teen-specific ruling)

### Predecessor
Phase C (Build L + L.1) completed 2026-04-07. Current state: independents are treated IDENTICALLY to adults by the Phase C seeding trigger — they get the 9-section adult morning and 13-section adult evening with `reflection_guideline_count=3`. 7 of 35 active independent teens currently have adult-seeded rhythm_configs rows (the trigger only fired for members inserted after migration 100103); the other 28 have no rhythm_configs at all. Phase D's job is to fork the seeding trigger, backfill ALL 35 teens with teen-tailored configs, and build the section variants that make the rhythm feel like it was designed for them.

---

### Pre-Build Summary

#### Context

Phase D is adult-isolated by design. Enhancement 7 is a purpose-built teen experience — not a reduced adult rhythm, not a theme variant, not a stripped-down shell. The founder's principle: "Teens should feel like this is *their* app that happens to connect to their family, not mom's app that they're forced to use." Every section that already renders for adults stays exactly as-is for adults; teens get tailored variants where framing, content, or behavior differs.

**The core fork happens in 3 places:**
1. **The auto-provision trigger** — currently, the `ELSE` branch handles adults AND independents with the same 9/13-section seed. Phase D splits that branch so `dashboard_mode='independent'` gets an 8-section morning + 8-section evening, `reflection_guideline_count=1`, and distinct rhythm display names ("Morning Reset" / "Evening Wind-Down" per addendum tone).
2. **The section components that have teen-specific copy** — GuidingStarRotationSection already takes `framingText` as a prop (default "Remember who you are." — adults unchanged). Phase D passes `"You said this matters to you:"` for teens via a new `audience` prop on `SectionRendererSwitch`. Similar minor additions to EveningGreetingSection (greeting copy), AccomplishmentsVictoriesSection (header label), ClosingThoughtSection (add optional framing text). All as props, all with adult-default behavior preserved.
3. **MindSweep-Lite teen variant** — the biggest fork. Teens use a DIFFERENT disposition set (4 dispositions: Schedule / Journal about it / Talk to someone / Let it go) with a new `'talk_to_someone'` disposition that routes to a PERSONAL journal note, NOT to `family_requests`. This is the founder's critical point: teen delegation is private self-reminding, not outbound messaging.

Phase D does not touch the `mindsweep-sort` Edge Function, does not create new Edge Functions, and does not change how `commitTomorrowCapture` or `commitMindSweepLite` work for adults. It adds ONE new disposition (`'talk_to_someone'`), extends the commit switch with ONE new case, and forks the MindSweep-Lite section component on audience.

The founder's end-state for Phase D: a teen opens their evening rhythm. Header reads "Hey [Name], how'd today go?" They see "What Went Right Today" populated with their own victories + task completions reframed. They scroll to Tomorrow Capture and see the same rotating prompts ("What do you want to get done tomorrow?" — already teen-safe aspirational language). They expand MindSweep-Lite and see "Anything looping? Dump it." They type "I said something weird in English class. Need to ask mom about the field trip. Have to finish the lab report by Friday. Can't stop thinking about what Jordan said." Tap Parse. Haiku classifies across the full destination set. The teen frontend TRANSLATES these into the 4 teen dispositions at display time: "lab report by Friday" → Schedule (tappable to Journal about it / Talk to someone / Let it go); "ask mom about field trip" → Talk to someone (cross-member detected, "mom" resolved); "something weird in English class" → Journal about it (defaulting away from victory/innerworkings since teens don't think in those terms); "what Jordan said" → Journal about it. Teen manually overrides the last one to Let it go. Taps Close My Day. Writes: 1 task (source='rhythm_mindsweep_lite', teen-tagged), 2 journal entries (one with `tags=['rhythm_mindsweep_lite','talk_to_someone']` and content "Talk to Mom: ask about the field trip", one plain). Let it go creates no record. NO `family_requests` rows for teens. Next morning the teen opens Morning Rhythm. Header: their Guiding Star displays with "You said this matters to you:" label underneath. Morning Priorities Recall shows "Last night you said you wanted to get these done:" with the lab report task. Scrolling further, "Something to think about" surfaces question #2 from the 15-teen pool ("What kind of person do you want to be known as?"), typing a response pulls passively matched BookShelf extractions from their library. Feature Discovery surfaces BookShelf with the SCHOOL-USE framing ("Your library has [book title] — the extractions could help with your [subject] work.") and 3 days later that teen has discovered Decision Guide, Board of Directors, and the Tracker builder — organically, one at a time.

#### Dependencies Already Built (reuse wholesale)

**Per-audience infrastructure already in place (Phase C foundation):**
- `morning_insight_questions` table with `audience TEXT CHECK (audience IN ('adult','teen'))` column — Phase C seeds 20 adult rows; Phase D seeds 15 teen rows alongside
- `useMorningInsightQuestions(audience, familyId)` hook already takes `audience` parameter — currently hardcoded to `'adult'` in `MorningInsightSection.tsx` line 50
- `FeatureDiscoveryCandidate.audiences: FeatureDiscoveryAudience[]` array on every pool entry — all 12 current adult entries already include `'teen'` in the audiences array (e.g. `audiences: ['adult', 'teen']`). Phase D CAN reuse all 12 current entries for teens and just add 3-4 teen-prioritized additions with school-use framing.
- `useFeatureDiscoveryCandidates(memberId, audience)` — already accepts audience param, applies audience filter plus engagement + dismissal filters. Phase D passes `'teen'` for independents.
- `FeatureDiscoverySection` component already accepts `audience?: 'adult' | 'teen'` prop (defaults to adult)

**Section components already take framing props:**
- `GuidingStarRotationSection` — `framingText` prop, defaults to `"Remember who you are."` (adults). Pass `"You said this matters to you:"` for teens.
- `ReflectionsSection` — already takes `count?: number` prop (defaults to 3). The teen rhythm_config just needs `reflection_guideline_count=1` (or 2) and it already flows through `RhythmModal.tsx:300` → `reflectionCount={config.reflection_guideline_count}` → `SectionRendererSwitch` line 164.

**Sections that DON'T yet take framing props — Phase D extends them minimally:**
- `EveningGreetingSection` — hardcoded "How was your day, [Name]?" and "Let's notice what went right and set up tomorrow." Phase D adds optional `headline?: string` + `subhead?: string` props; `SectionRendererSwitch` passes teen copy when audience='teen'.
- `AccomplishmentsVictoriesSection` — hardcoded "Today's Wins" header. Phase D adds optional `title?: string` prop; default adult behavior unchanged.
- `ClosingThoughtSection` — no framing text currently; Phase D adds optional `framingText?: string` prop rendered below the star quote.

**MindSweep-Lite infrastructure already in place:**
- `mindsweep-sort` Edge Function — NO changes. Teens use the exact same call with `source_channel='rhythm_evening'`. The classifier returns its standard destination set; the teen section translates those destinations to teen dispositions at display time. No teen-specific system prompt, no teen calibration in the Edge Function, no platform-level pollution.
- `commitMindSweepLite.ts` — already uses a disposition-based switch. Phase D adds ONE new case (`'talk_to_someone'`) that writes to `journal_entries` with teen-specific tags. Zero changes to the adult paths.
- `RhythmMetadataContext` + `stageMindSweepItems` + `readStagedMindSweepItems` — reused as-is.
- `RhythmModal.handleComplete` commit order (tomorrow capture → mindsweep-lite → completion row) — unchanged.

**Existing teen members + seeded data to backfill:**
- 35 active family_members with `dashboard_mode='independent'`
- 7 of them currently have rhythm_configs rows (inherited from adult seeds via Phase A/B/C trigger)
- 28 of them have NO rhythm_configs yet (their insert predates the auto-provision trigger; they were never backfilled)
- Phase D migration must (a) UPDATE the 7 existing rows to teen-tailored configs, (b) INSERT rows for the 28 missing ones

**Independent shell + dashboard:**
- `IndependentShell` is already built (Phase A+ era) — no shell changes needed
- Independent dashboard already shows Active Tasks separately (per the front-door-OR-genuinely-helpful rule, this is why `task_preview` isn't in the morning rhythm for adults). Phase D follows the same rule for teens.

#### Dependencies NOT Yet Built

- **PRD-05 (LiLa Core) day-data context enhancement** — LiLa dynamic morning insight question generation is post-MVP. Phase D ships with the 15-question hardcoded teen pool only. Same approach as Phase C for adults.
- **Teen rhythm request flow (teen customizes → sends to mom's Requests tab)** — requires teen-specific Rhythms Settings + Universal Queue Modal routing. Deferred post-MVP. Teens can still use the built-in default teen rhythm, just can't customize or request custom rhythms.
- **LiLa `studio_create_guide` conversational creation** — post-MVP, unchanged from Phase A/B/C.
- **Independent teen "What Went Right" reframing of victories** — the core data already exists (`victories` + `task_completions`); Phase D only changes the **header label** and the **internal framing**, not the underlying query. The AccomplishmentsVictoriesSection already queries both sources and dedupes. Teen header: "What went right today" instead of "Today's Wins".
- **BookShelf extractions for teens** — already work via `match_book_extractions` RPC (Phase C). Phase D just changes the question pool that generates the query embedding.

#### Build Items (Phase D — 4 sub-phases)

**Sub-phase D1 — Foundation (schema + types + trigger fork + backfill + 15 teen questions)**

1. **Migration `00000000100114_rhythms_phase_d_teen.sql`** — single idempotent file:
   - INSERT 15 teen rows into `morning_insight_questions` (system-level: `family_id=NULL`, `audience='teen'`, `is_active=true`, per-category sort_order) from Enhancement 7 "Teen Morning Insight Question Pool" (Identity & Growth × 5, School & Learning × 4, Relationships & Social × 3, Life & Future × 3). Idempotent via `WHERE NOT EXISTS` on `(question_text, audience)` tuple — matches the Phase C 20-adult seed pattern.
   - ALTER `tasks` DROP + ADD `tasks_source_check` to rebuild the CHECK constraint preserving all existing values (including Phase B `rhythm_priority` and Phase C `rhythm_mindsweep_lite`). **No new tasks.source value is needed for teens** — teen Schedule items reuse the existing `rhythm_mindsweep_lite` attribution. Only ALTER if the constraint needs to be touched for other reasons (verify during implementation; may be a no-op).
   - **Fork `auto_provision_member_resources` function** — split the current `ELSE` branch (adults + independents) into two distinct branches:
     - `ELSIF NEW.dashboard_mode = 'independent' THEN` — teen-tailored seed (8 morning + 8 evening sections, `reflection_guideline_count=1`, section_order_locked=true for evening, `display_name` = "Morning Reset" / "Evening Wind-Down" per Enhancement 7 tone)
     - `ELSE` — existing adult seed unchanged (9 morning + 13 evening sections, `reflection_guideline_count=3`)
   - Teen morning seed (8 sections, timing 5–12):
     1. `guiding_star_rotation` (config `{"framingText":"You said this matters to you:"}`)
     2. `morning_priorities_recall`
     3. `task_preview` ⚠ **FLAGGED FOR FOUNDER DECISION** — Enhancement 7 table includes this (8 sections). Phase B's "front door OR genuinely helpful" rule (CLAUDE.md #168) removed `task_preview` from adult/guided seeds because the dashboard already shows Active Tasks. Independent teens ALSO have a dashboard with Active Tasks. Options: (A) Include `task_preview` per addendum table → 8 sections, violates Phase B rule for teens; (B) Remove `task_preview` per Phase B rule → 7 sections, matches addendum's text count but not its table. **Recommendation: Option B (7 sections, no task_preview).** Rationale: Phase B rule is a general principle, not adult-specific. Teens have a dashboard, task_preview duplicates it. The addendum's "7 sections" text is likely authoritative and the table was an oversight.
     4. `calendar_preview` (config `{"scope":"member"}` — teens see only their own events, matching the Guided precedent)
     5. `on_the_horizon` (config `{"lookahead_days":7,"max_items":5}` — same as adults; valuable for school assignments)
     6. `morning_insight` (no extra config — audience='teen' is inferred from member role at render time, NOT stored in config)
     7. `feature_discovery` (same — audience='teen' at render time)
     8. `rhythm_tracker_prompts`
     *(If Option A wins: add `task_preview` at order 3 and renumber; 8 sections total.)*
   - Teen evening seed (8 sections, `section_order_locked=true`, timing 18–24):
     1. `evening_greeting` (config `{"variant":"teen"}` — SectionRendererSwitch picks teen copy)
     2. `accomplishments_victories` (config `{"title":"What went right today"}`)
     3. `evening_tomorrow_capture` (no config — rotating prompts already teen-safe)
     4. `mindsweep_lite` (config `{"collapsed_by_default":true,"audience":"teen"}`)
     5. `reflections` (no extra config — `reflection_guideline_count=1` at the rhythm_config level passes count through)
     6. `closing_thought` (config `{"framingText":"Something you believe:"}`)
     7. `rhythm_tracker_prompts`
     8. `close_my_day`
   - Teen weekly_review / monthly_review / quarterly_inventory seeds: **same as adult** for now. Per the Phase D scope, periodic rhythms are not teen-differentiated in this build. Phase D only forks morning + evening + reflection count.
   - Backfill existing 7 independents: rewrite their morning + evening `sections` arrays via idempotent UPDATE guarded by `NOT (sections @> '[{"section_type":"evening_greeting","config":{"variant":"teen"}}]')` or similar marker. Update `reflection_guideline_count` to 1. Update `display_name` to teen variants.
   - Insert rhythm_configs for the 28 teen members missing them — use `INSERT ... WHERE NOT EXISTS` or trigger-style logic.
   - NOTICE queries at end: teen_questions_seeded, teen_morning_count, teen_evening_count, teen_reflection_count_updated, backfill_total.

2. **TypeScript types** — extend `src/types/rhythms.ts`:
   - Add `'talk_to_someone'` to the `MindSweepLiteDisposition` union (alongside the existing 13 dispositions). Comment explains this is a TEEN-ONLY disposition that creates a personal journal reminder, NOT a family_requests row.
   - Add `'talk_to_someone'` to `DISPOSITION_DISPLAY_NAMES` with value `"Talk to someone"`.
   - **Teen-specific constants** (new exports):
     - `TEEN_DISPOSITION_DISPLAY_NAMES: Record<TeenDisposition, string>` — `{ task: 'Schedule', journal: 'Journal about it', talk_to_someone: 'Talk to someone', release: 'Let it go' }`
     - `TEEN_DISPOSITION_PICK_ORDER: TeenDisposition[]` — `['task', 'journal', 'talk_to_someone', 'release']`
     - `type TeenDisposition = 'task' | 'journal' | 'talk_to_someone' | 'release'` (narrowed union)
   - `RhythmMindSweepItem.created_record_type` union gains no new values — `talk_to_someone` writes to `journal_entries`, so `created_record_type='journal_entry'` is correct.
   - Add `type RhythmAudience = 'adult' | 'teen'` for renderer prop clarity.

3. **`commitMindSweepLite.ts` — extend the switch with ONE new case:**
   ```ts
   case 'talk_to_someone': {
     const recipient = item.recipient_name ?? 'someone'
     const content = `Talk to ${recipient}: ${item.text.trim()}`
     const { data, error } = await supabase
       .from('journal_entries')
       .insert({
         family_id: familyId,
         member_id: memberId,
         entry_type: 'brain_dump',
         content,
         visibility: 'private',
         tags: ['rhythm_mindsweep_lite', 'talk_to_someone'],
       })
       .select('id')
       .single()
     if (error) throw error
     return { id: data.id as string, type: 'journal_entry' }
   }
   ```
   - **Critical rule preserved:** teens NEVER hit the `family_request` case. The teen MindSweep-Lite section never produces items with `disposition='family_request'` — only `talk_to_someone`. The fallback "auto-downgrade when recipient missing" stays scoped to `family_request` only. If `recipient_member_id` is null for a teen `talk_to_someone` item, the recipient display defaults to `"someone"` (no downgrade needed — `talk_to_someone` doesn't require a recipient_member_id to function).
   - **No recipient_member_id is stored in family_requests for teens.** There is no outbound write. The recipient NAME is preserved in destination_detail metadata for audit/history only.

4. **Audience plumbing through the renderer chain:**
   - `RhythmModal.tsx` — add `memberRole?: 'primary_parent' | 'additional_adult' | 'independent' | 'guided' | 'play'` prop. In `RhythmDashboardCard`, read the current member's `role` + `dashboard_mode` via `useFamilyMember` and derive `audience: RhythmAudience = dashboard_mode === 'independent' ? 'teen' : 'adult'`. Pass `audience` to `RhythmModal`.
   - `RhythmDashboardCard.tsx` — add the audience derivation + prop pass-through (one new `useFamilyMember` query, ~10 lines).
   - `SectionRendererSwitch.tsx` — accept `audience?: RhythmAudience` prop (default 'adult'). Pass it to:
     - `GuidingStarRotationSection` via new `framingText` override per audience
     - `MindSweepLiteSection` via new `audience` prop
     - `MorningInsightSection` via new `audience` prop
     - `FeatureDiscoverySection` (already accepts it)
     - `EveningGreetingSection` via new `variant` prop
     - `AccomplishmentsVictoriesSection` via new `title` prop
     - `ClosingThoughtSection` via new `framingText` prop
     - `ReflectionsSection` — already flows `count` from `rhythm_configs.reflection_guideline_count`, no audience needed
   - The `config` field on each RhythmSection can ALSO carry framing overrides (e.g. `config.framingText`). The switch reads `section.config.framingText ?? audience-default-for-section-type`. This lets mom override teen framing per-section later without code changes.

5. **TypeScript check:** `tsc -b` zero errors. Migration applied to live DB via `supabase db push`. Post-migration query confirms:
   - 15 teen morning_insight_questions present
   - 35 independent teens all have morning + evening rhythm_configs
   - All teen morning configs have 7 or 8 sections (per Option A/B decision)
   - All teen evening configs have 8 sections, section_order_locked=true
   - reflection_guideline_count = 1 on all teen rhythms

**Sub-phase D2 — MindSweep-Lite teen variant (largest fork)**

1. **Build `MindSweepLiteTeenSection.tsx`** — a companion component, NOT a fork of the adult version. Or: extract a shared `MindSweepLiteSectionBase` that both adult and teen wrap. **Decision: build a separate `MindSweepLiteTeenSection.tsx` that shares `useRhythmMetadataStaging`, `mindsweep-sort` invocation, and the auto-expand heuristic, but has its own UI + disposition dropdown + translation function.** Simpler to read; no shared component churn for adults; future teen evolution (e.g., teen-specific copy changes, different auto-expand thresholds) doesn't risk breaking adult paths.

2. **`adultDestinationToTeenDisposition` translation function** — pure TypeScript, co-located with `MindSweepLiteTeenSection.tsx`:
   ```ts
   function adultDestinationToTeenDisposition(
     dest: MindSweepLiteDisposition,
     crossMemberAction?: string | null,
   ): TeenDisposition {
     if (crossMemberAction === 'suggest_route') return 'talk_to_someone'
     switch (dest) {
       case 'task':
       case 'calendar':
         return 'task' // displayed as "Schedule"
       case 'journal':
       case 'innerworkings':
       case 'best_intentions':
       case 'guiding_stars':
       case 'victory':
       case 'archives':
         return 'journal' // displayed as "Journal about it"
       case 'list':
       case 'backburner':
       case 'recipe':
         return 'journal' // teens rarely think in list terms
       case 'release':
         return 'release' // displayed as "Let it go"
       default:
         return 'journal'
     }
   }
   ```

3. **`MindSweepLiteTeenSection` behavior differences vs adult:**
   - Header: "Anything looping?" (not "Something on your mind?")
   - Auto-expand prompt on high-task days: "Rough day? Dump what's in your head."
   - Textarea placeholder: "Whatever's stuck in your head. Venting counts."
   - Copy below textarea: "We'll sort it. Tap any tag to change it. 'Let it go' creates nothing — just the act of naming it is enough."
   - Disposition dropdown uses `TEEN_DISPOSITION_PICK_ORDER` (4 options, not 12+)
   - Override dropdown does NOT show `family_request` / `guiding_stars` / `best_intentions` / etc. — teens don't see the full destination vocabulary
   - Cross-member detection: if `mindsweep-sort` returns `cross_member_id + cross_member_action='suggest_route'`, promote to `'talk_to_someone'` (NOT `'family_request'`). Store `recipient_member_id` + `recipient_name` in the staged item for commit-time content composition. Display as "Talk to [Name]" inline below the item.
   - **Recipient picker UI for teen `talk_to_someone` items**: same dropdown pattern as adult `family_request` but WITHOUT the "will be sent" caption. Teen-safe copy: "Remind yourself to talk to:" — reinforces that nothing goes out.
   - **Manual `[+ Add item]` teen default disposition**: `'journal'` (not `'task'`). Teens are more likely to dump journal-worthy content manually.
   - Same `stageMindSweepItems` call into `RhythmMetadataContext` — the staged items flow to `commitMindSweepLite` exactly like adult items.
   - All other plumbing identical (auto-expand, parse flow, read-aloud button for Reading Support).

4. **Wire into `SectionRendererSwitch`:**
   ```tsx
   case 'mindsweep_lite': {
     const cfg = section.config as { collapsed_by_default?: boolean; audience?: string } | undefined
     const isTeen = audience === 'teen' || cfg?.audience === 'teen'
     const Component = isTeen ? MindSweepLiteTeenSection : MindSweepLiteSection
     return (
       <Component
         familyId={familyId}
         memberId={memberId}
         readingSupport={readingSupport}
         collapsedByDefault={cfg?.collapsed_by_default ?? true}
       />
     )
   }
   ```

5. **`commitMindSweepLite.ts` gains the `'talk_to_someone'` case** (sub-phase D1 item 3).

6. **Playwright test:**
   - Independent teen (seeded with teen configs) opens evening rhythm → MindSweep-Lite section header reads "Anything looping?"
   - Parse "Need to ask Jordan about the homework. Worried about the test. Should finish the lab report." → verify 3 items returned, first classified as `talk_to_someone` (cross-member Jordan detected), second + third as `journal`
   - Tap disposition tag on second item → verify dropdown shows 4 options (Schedule / Journal about it / Talk to someone / Let it go), NOT the 12-option adult dropdown
   - Override the second item to Let it go → close day → verify zero records written for that item, task + journal entry written for the other items, ZERO `family_requests` rows created
   - Journal entry for the talk_to_someone item has content `"Talk to Jordan: ..."` with `tags=['rhythm_mindsweep_lite','talk_to_someone']` and `visibility='private'`
7. `tsc -b` zero errors

**Sub-phase D3 — Teen section variants + feature discovery pool additions**

1. **`GuidingStarRotationSection`** — no code change; `SectionRendererSwitch` passes `framingText="You said this matters to you:"` when audience='teen' OR when `section.config.framingText` is explicitly set.

2. **`EveningGreetingSection`** — add optional `variant?: 'adult' | 'teen'` prop (default 'adult'):
   ```tsx
   const [headline, subhead] = variant === 'teen'
     ? [`Hey ${name}, how'd today go?`, `Let's see what went right and set you up for tomorrow.`]
     : [`How was your day${name ? `, ${name}` : ''}?`, `Let's notice what went right and set up tomorrow.`]
   ```

3. **`AccomplishmentsVictoriesSection`** — add optional `title?: string` prop (default `"Today's Wins"`). Teen path passes `"What went right today"`.

4. **`ClosingThoughtSection`** — add optional `framingText?: string` prop. When passed, render a small uppercase label below the quote (matching `GuidingStarRotationSection`'s framingText styling). Teen path passes `"Something you believe:"`.

5. **`MorningInsightSection`** — replace the hardcoded `useMorningInsightQuestions('adult', familyId)` with `useMorningInsightQuestions(audience, familyId)` driven by the new `audience` prop (default 'adult'). Adult-unchanged.

6. **`FeatureDiscoverySection`** — already accepts `audience` prop. Pass `'teen'` from SectionRendererSwitch when audience='teen'.

7. **`featureDiscoveryPool.ts` — teen-specific additions:**
   - Keep all 12 existing entries (all already have `audiences: ['adult', 'teen']`)
   - ADD 3 teen-prioritized entries that take the earliest slots in the teen weekly rotation via the PRNG shuffle (or simply add teen-relevant tags so they're equally likely):
     - `bookshelf_for_school` — "BookShelf for school" — "Your library has books that can help with what you're studying. Every morning a thought question pulls relevant ideas from your books." action: "Browse BookShelf →" icon: `BookOpen` audiences: `['teen']` (TEEN-ONLY). Engagement exit when they upload first book.
     - `thoughtsift_translator_teen` — "Rewrite what you need to say" — "Nervous about sending a text? Not sure how to phrase something to mom or a teacher? Translator rewrites it in a warmer, firmer, or more direct tone." action: "Try Translator →" audiences: `['teen']`. Engagement exit is shared with the existing adult translator entry via `engagement_source_tables` — dedupe via `feature_key` uniqueness.
     - `journal_tagged_teen` — "Your journal, your way" — "Tag entries however you want — brain dumps, rants, notes, song lyrics. You can filter by tag later. It's just yours." action: "Open Journal →" audiences: `['teen']`. Same `engagement_source_tables: ['journal_entries']` as the adult entry.
   - **Dedupe consideration:** the adult `bookshelf_upload_first` entry has `audiences: ['adult','teen']`. The new `bookshelf_for_school` teen entry should have `audiences: ['teen']` only. When teen sees both, the engagement exit on `source_tables: ['bookshelf_items']` will exclude BOTH once they upload any book — deliberate, avoids redundant nudges.

8. **Playwright tests:**
   - Teen morning rhythm: Guiding Star renders with "You said this matters to you:" label
   - Teen evening rhythm: greeting reads "Hey [Name], how'd today go?"; AccomplishmentsVictoriesSection header reads "What went right today"
   - Teen ClosingThoughtSection renders with "Something you believe:" label (only if the teen has 5+ active Guiding Stars — the Phase B threshold rule still applies)
   - Teen MorningInsightSection shows one of the 15 teen questions (not one of the 20 adult questions)
   - Teen FeatureDiscovery: mount on a simulated "day 0" (no engagement) → verify one of the teen-inclusive candidates renders

9. `tsc -b` zero errors

**Sub-phase D4 — Stub flip + CLAUDE.md conventions + verification + founder sign-off**

1. **STUB_REGISTRY.md updates** — flip the 4 Phase D stubs tagged in Phase C verification (teen MindSweep-Lite framing, teen morning insight pool, teen feature discovery pool prioritization, teen framing language) from "Stubbed — Phase D scope" to "Wired — Phase D completed 2026-04-XX"

2. **CLAUDE.md additions** — append Phase D conventions to the Rhythms section (after line 188, ~12 new convention lines):
   - **Teen rhythm audience derivation** — `RhythmDashboardCard` reads `family_members.dashboard_mode` and derives `audience: 'adult' | 'teen'` from `dashboard_mode === 'independent'`. Pass-through via `RhythmModal` → `SectionRendererSwitch` → section components. No schema change — audience is a render-time computation from existing `dashboard_mode` column.
   - **Teen morning is 7 (or 8) sections; teen evening is 8 sections, `section_order_locked=true`**. Weekly/Monthly/Quarterly rhythms are NOT teen-differentiated in Phase D.
   - **`reflection_guideline_count=1` for teens** (set on `rhythm_configs.reflection_guideline_count` at seed time). `ReflectionsSection` reads the count from rhythm_config → modal → section props.
   - **Teen display names**: "Morning Reset" + "Evening Wind-Down" instead of "Morning Rhythm" + "Evening Rhythm" — stored in `rhythm_configs.display_name` at seed time.
   - **Teen MindSweep-Lite uses 4 dispositions**: Schedule (= task) / Journal about it (= journal) / Talk to someone (NEW disposition `talk_to_someone`) / Let it go (= release). Teen override dropdown hides adult-only dispositions (family_request, guiding_stars, best_intentions, victory, innerworkings, list, calendar, archives, recipe, backburner).
   - **`'talk_to_someone'` disposition NEVER writes to `family_requests`**. It writes to `journal_entries` with `tags=['rhythm_mindsweep_lite','talk_to_someone']`, content prefixed with `"Talk to [recipient_name]: "`, visibility='private'. Teen delegation is private self-reminding, not outbound messaging. This is a founder-critical rule — teen talk_to_someone must NEVER share a code path with adult family_request.
   - **`adultDestinationToTeenDisposition` translation happens at display time**, NOT at Edge Function level. `mindsweep-sort` is platform-level and MUST NOT be teen-calibrated. The teen section reads the classifier's standard output and translates it to the 4-disposition teen vocabulary in `MindSweepLiteTeenSection.tsx`.
   - **Adult Phase C code paths are frozen for Phase D.** `MindSweepLiteSection.tsx`, adult `commitMindSweepLite` cases, `MorningInsightSection` audience-hardcoding, `FeatureDiscoverySection` defaults — all unchanged. Phase D adds variants alongside, never forks in place.
   - **Teen morning insight questions live in `morning_insight_questions` with `audience='teen'`**. `useMorningInsightQuestions(audience, familyId)` already filters by audience. 15 hand-authored questions across Identity & Growth × 5 / School & Learning × 4 / Relationships & Social × 3 / Life & Future × 3.
   - **Teen feature discovery pool entries use `audiences: ['teen']` for teen-only entries**; mixed-audience entries use `audiences: ['adult', 'teen']`. Deduplication happens naturally via `feature_discovery_dismissals` unique per feature_key per member.
   - **Teen framing overrides can ALSO be set per-section via `rhythm_configs.sections[].config.framingText`** — allows future mom customization without code changes. The section renderer reads config first, then audience default.

3. **Feature decision file Phase D verification table** filled:
   - Every Phase D requirement from this pre-build summary → Wired / Stubbed / Missing
   - Stubs limited to: teen rhythm request flow (PRD-15 post-MVP dep), Studio rhythm templates (post-MVP content sprint), LiLa dynamic teen questions (PRD-05 dep), PRD-14C teen completion indicators (post-Phase-D consumption)
   - Zero Missing target

4. **Live DB verification queries:**
   - `SELECT COUNT(*) FROM morning_insight_questions WHERE audience='teen' AND is_active=true` → **15**
   - `SELECT COUNT(*) FROM rhythm_configs rc JOIN family_members fm ON fm.id=rc.member_id WHERE fm.dashboard_mode='independent' AND rc.rhythm_key='morning'` → **35** (all active teens have morning)
   - `SELECT COUNT(*) FROM rhythm_configs rc JOIN family_members fm ON fm.id=rc.member_id WHERE fm.dashboard_mode='independent' AND rc.rhythm_key='evening'` → **35**
   - `SELECT DISTINCT reflection_guideline_count FROM rhythm_configs rc JOIN family_members fm ON fm.id=rc.member_id WHERE fm.dashboard_mode='independent'` → **only 1** (teens) + **3** (non-teen if any slip through) — expected: only 1 for independent rows
   - `SELECT DISTINCT jsonb_array_length(sections) FROM rhythm_configs rc JOIN family_members fm ON fm.id=rc.member_id WHERE fm.dashboard_mode='independent' AND rc.rhythm_key='morning'` → **7 (or 8)** based on Option A/B decision
   - Adult independence check: `SELECT DISTINCT jsonb_array_length(sections) FROM rhythm_configs rc JOIN family_members fm ON fm.id=rc.member_id WHERE fm.dashboard_mode IS NULL OR fm.dashboard_mode='personal'` → **9** (adult morning unchanged)

5. **TypeScript check**: `tsc -b` zero errors
6. **Hardcoded color audit**: `npm run check:colors` zero hits in Phase D files
7. **Present verification to founder for sign-off**

#### Stubs (NOT Building Phase D)

- **Teen rhythm request flow** (teen customizes a rhythm → sends to mom's Requests tab → mom approves/edits/declines). Requires teen-specific Rhythms Settings customization surface + Universal Queue Modal routing. Deferred post-MVP. PRD-15 is ready, but the UX surface is large — not in scope for Phase D.
- **Studio rhythm template library** — no `rhythm_templates` table yet; Phase D teens still use the built-in default teen rhythm. Post-MVP content sprint.
- **Periodic rhythms (Weekly/Monthly/Quarterly) differentiated for teens** — out of scope. Phase D only forks morning + evening + reflection count.
- **LiLa dynamic teen morning insight questions** — requires PRD-05 day-data context assembly enhancement. Phase D ships with 15 hardcoded teen questions only.
- **Teen BookShelf discovery school-use framing DYNAMIC** (e.g., "Your library has [book title] from your Biology class") — requires coupling BookShelf metadata to school subject tagging. Phase D ships the generic school-use entry; dynamic book-title injection is post-MVP.
- **`task_preview` vs no-`task_preview` for teens** — **founder decision required** (see D1 item 1 flag). Default recommendation: 7 sections, no task_preview (following Phase B rule).
- **Gamification point events for teen rhythm completions** — PRD-24 dependency, post-MVP.
- **Teen rhythm completion indicators on Family Overview** — PRD-14C consumption layer, post-Phase-D.
- **Teen Rhythms Settings customization UI** — teens use the default teen rhythm; they can't toggle sections on/off without going through a (future) request flow. Mom can toggle sections for teens via the existing Rhythms Settings page by member-picking the teen.
- **Teen-specific widget tracker suggestions in Rhythm Tracker Prompts** — `rhythm_tracker_prompts` already works for teens via the same `dashboard_widgets.config.rhythm_keys` runtime filter. If a teen has tracker widgets configured with `rhythm_keys: ['evening']`, they'll surface. Post-MVP teen-specific tracker templates (e.g., "Homework done" binary tracker) are a content sprint.

#### Key Decisions

1. **Three forks only — trigger, MindSweep-Lite section, framing props.** Everything else is audience plumbing (renderer pass-through) and seed data. No Edge Function changes, no new Edge Functions, no schema changes except one new CHECK value on a union type, no new tables.

2. **Teen `talk_to_someone` disposition NEVER writes to `family_requests`.** This is the founder-critical rule explicitly stated at the start of this build. `commitMindSweepLite.ts` gets exactly ONE new case that writes to `journal_entries` with teen-tagged content. The wrapper logic that downgrades adult `family_request` to `task` when recipient is missing does NOT apply to teens — teen `talk_to_someone` is valid with or without `recipient_member_id`.

3. **Teen MindSweep-Lite is a SEPARATE COMPONENT (`MindSweepLiteTeenSection`), not a prop-forked version of the adult section.** Reason: adult has ~600 lines including cross-member UI, family_request recipient dropdown, full 12-option dropdown. Teens have 4 options, no family_request, different copy, different default disposition. A prop-forked version would be `if (audience === 'teen') {` ladders throughout the component — unreadable. Separate components sharing only `useRhythmMetadataStaging` + `mindsweep-sort` invocation + auto-expand query is cleaner. Phase D founder can request consolidation later if it becomes tech debt.

4. **Adult destination → teen disposition translation happens in frontend, NOT in Edge Function.** `mindsweep-sort` stays platform-level and identical. The teen section reads the classifier output and runs `adultDestinationToTeenDisposition()` at display time. Keeps the classifier free of UI-layer concerns and lets future teen vocabulary changes ship without Edge Function redeploys.

5. **Audience is derived at render time from `dashboard_mode`**, not stored on `rhythm_configs`. Reasoning: `dashboard_mode` is the canonical source of truth for member type. A teen who graduates to adult mode (future Guided → Independent → Adult transition flow) instantly gets adult rhythms without needing a separate rhythm audience field to migrate. Audience is also settable per-section via `config.framingText` / `config.variant` for future mom overrides.

6. **`reflection_guideline_count=1` for teens** (not 2). Per addendum "1-2 reflection questions per evening." Start with 1 for maximum engagement; Phase D adds `reflection_guideline_count` to the Rhythms Settings UI (future) for teens who want more. Lighter touch principle: better to surface 1 than skip 3.

7. **Teen morning is 7 sections (no task_preview), teen evening is 8 sections** — **subject to founder confirmation on the task_preview flag in D1 item 1.** Default recommendation: remove task_preview per Phase B "front door OR genuinely helpful" rule (CLAUDE.md #168). Task preview duplicates the dashboard's Active Tasks section for both adults and teens. The addendum's "7 sections" text is treated as authoritative over the table's 8-item list (the task_preview row was likely an editing oversight in the addendum).

8. **Teen feature discovery pool is ADDITIVE, not a replacement.** All 12 current pool entries already include `'teen'` in their audiences array. Phase D adds 3 teen-only school-framed entries (`bookshelf_for_school`, `thoughtsift_translator_teen`, `journal_tagged_teen`) and keeps the rest. The PRNG picker shuffles deterministically by date-seed, so teens see a mix of the 15 applicable candidates rotating across the 3-days-per-week gate.

9. **Teen rhythm display names ARE changed** — "Morning Reset" + "Evening Wind-Down" instead of adult "Morning Rhythm" + "Evening Rhythm". Matches the addendum's ownership-framing principle. Small change but signals "this is yours, not mom's app with your name on it."

10. **Backfill all 35 teens, not just the 7 with existing configs.** The migration does a single `INSERT ... SELECT` from family_members WHERE dashboard_mode='independent' AND NOT EXISTS, followed by a separate `UPDATE` for the 7 rows that do exist and need teen-tailored content. Both operations idempotent.

11. **Phase D is the LAST phase of PRD-18.** After Phase D lands, PRD-18 is feature-complete except for post-MVP dependencies (PRD-05 dynamic prompts, PRD-15 teen request flow, PRD-14C Family Overview consumption, Studio rhythm templates, LifeLantern Check-in, LiLa contextual help rollout, push notifications, voice-to-text). Phase D verification table must capture "every Phase D requirement is Wired" before sign-off.

12. **Sub-phase sequence: D1 (foundation + schema) → D2 (MindSweep-Lite teen variant + commit case) → D3 (teen framing + feature discovery pool) → D4 (stub flip + CLAUDE.md + verification)**. Each sub-phase ends at a `tsc -b` clean state for founder review checkpoints.

#### Open Questions for Founder Before Build Starts

1. **Teen morning section count: 7 or 8?** Addendum table shows 8 including `task_preview`. Phase B rule says no `task_preview` (dashboard duplication). **Recommendation: 7 sections, no task_preview.** Confirm before D1 writes the trigger.

2. **Teen rhythm display names: "Morning Reset" / "Evening Wind-Down" — OK, or different wording?** The addendum doesn't prescribe exact names; this is my reading of the "ownership language" principle. Could also be "Morning Check-in" / "Evening Wind-Down" or "Start" / "Close" or keep adult names. Confirm before seeding.

3. **`reflection_guideline_count`: 1 or 2 for teens?** Addendum says "1-2 questions per evening." I'm recommending 1 as the default (easier entry, less wall of text). Confirm before seeding.

4. **Teen MindSweep-Lite component strategy: separate file vs prop-forked?** Recommendation is **separate `MindSweepLiteTeenSection.tsx`** for readability. Confirm before D2 writes code.

5. **Teen talk_to_someone journal entry format**: content = `"Talk to [recipient_name]: [original text]"` with recipient defaulting to `"someone"` if no cross-member detected — or a different composition pattern? Confirm before D2 writes the commit case.

6. **BookShelf feature discovery framing for teens**: generic "use it for school" framing in Phase D, dynamic book-title injection deferred to post-MVP? Confirm before D3 writes the pool additions.

7. **Anything else I'm missing, or ready to proceed to D1?**

---

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

# Build K: PRD-18 Phase B — Periodic Rhythms + Tomorrow Capture + On the Horizon + Carry Forward Fallback

### PRD Files
- `prds/daily-life/PRD-18-Rhythms-Reflections.md` (Screens 4, 5, 6 — Weekly/Monthly/Quarterly; Section Types 20, 27, 31, 32)

### Addenda Read
- `prds/addenda/PRD-18-Enhancement-Addendum.md` (Enhancements 1, 5, 8 — primary authoritative source for this phase)
- `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-18-Rhythms-Reflections.md` (lines 495–509 define the Phase B scope. Phase A verification lines 559–689 catalog which stubs this phase is filling.)

### Predecessor
PRD-18 Phase A (Build I) completed 2026-04-07. Foundation in place: `rhythm_configs`, `rhythm_completions`, `feature_discovery_dismissals`, `morning_insight_questions` tables; 26 family members backfilled with 98 rhythm_configs; morning + evening modals auto-opening with breathing-glow cards at position 0; `RhythmModal` + `RhythmDashboardCard` + `SectionRendererSwitch` wired; per-role default seeding trigger on `auto_provision_member_resources`; `notepad_tabs.source_type` widened to allow `'rhythm_capture'`; reflections infrastructure reused wholesale from 100071/100072. Phase A shipped 14 Enhancement Addendum stubs in the correct narrative positions — Phase B fills four of them and builds the periodic rhythm cards that were stubbed via `PeriodicCardsSlot` returning null.

---

### Pre-Build Summary

#### Context

Phase A established that the rhythms are real: mom's Morning and Evening modals auto-open once per period, collapse to breathing-glow dashboard cards, reach the Close My Day state, and the section renderer switch fans out to 14 working section components plus ~12 stub placeholders. Guided kids got a mini evening rhythm mid-build (5 sections including `guided_reflections` from the reflection_prompts library). Dad's reflections RLS is correct. 51 of 65 Phase A requirements shipped Wired; 14 shipped as documented stubs pointing at Phases B / C / D. Phase B's job is to fill in the four stubs that the Enhancement Addendum tagged as MVP-must-have and that don't depend on AI (`evening_tomorrow_capture`, `morning_priorities_recall`, `on_the_horizon`, `carry_forward`), plus build the three periodic rhythm cards (`WeeklyReviewCard`, `MonthlyReviewCard`, `QuarterlyInventoryCard`) whose section renderers are currently returning `null` inside `SectionRendererSwitch` lines 133-146. Phase C owns the AI-heavy stubs (`mindsweep_lite`, `morning_insight`, `feature_discovery`, `rhythm_tracker_prompts`). Phase D owns the teen tailored experience and final polish.

The founder's end-state for Phase B: mom opens Evening Rhythm → Tomorrow Capture section shows one of four rotating prompts ("What do you want to get done tomorrow?" / "What's on your mind for tomorrow?" / "Anything you want to remember for tomorrow?" / "What would make tomorrow feel like a good day?") with 3 text inputs and a [+] overflow button. As she types, each row fuzzy-matches against her existing active task list and offers a "Did you mean [Task Title]?" confirmation card. She confirms the matches and creates 2 new items. When she closes the day, the 2 new items are written as real `tasks` rows with `source='rhythm_priority'`, `due_date=tomorrow`, the matched items are starred (or `priority='now'`) on her existing task rows, and the priority_items metadata lands on the `rhythm_completions` row. Next morning she opens Morning Rhythm and the new Morning Priorities Recall section shows "Here's what you wanted to focus on:" with those same 3 items reflected back in her own words. Further down the morning, On the Horizon shows tasks and calendar events due in the next 7 days (capped at 5, nearest first), each with a "Want to break this into steps?" button that opens Task Breaker inline and a "Schedule time for this?" button that creates a calendar block. If she forgets to touch her tasks for 14 days and the backburner fallback is set, a pg_cron job quietly moves them to her Backburner list at midnight in her family's timezone. On Fridays, her Morning Rhythm shows a Weekly Review inline card with stats, top victories, next week preview, and a rotating weekly reflection prompt — and the "Want to do a full weekly review?" button stubs until PRD-16 ships.

#### Dependencies Already Built (reuse wholesale)

**Phase A rhythm infrastructure (all 2026-04-07):**
- `rhythm_configs` + `rhythm_completions` + `feature_discovery_dismissals` + `morning_insight_questions` tables with RLS, triggers, indexes (migration 100103)
- `useRhythmConfigs` / `useRhythmConfig` / `useRhythmCompletion` / `useTodaysRhythmCompletions` queries and `useCompleteRhythm` / `useSnoozeRhythm` / `useDismissRhythm` / `useUpdateRhythmConfig` / `useToggleRhythmSection` mutations in `src/hooks/useRhythms.ts`
- `RhythmModal` + `RhythmDashboardCard` + `SectionRendererSwitch` + `StubSections.tsx` placeholders
- Phase A morning seed for adults/independents/teens already includes `morning_priorities_recall` at order 2 (placeholder rendering only). Seed does NOT yet include `on_the_horizon` — Phase B migration adds it at order 6 and shifts `brain_dump` + `periodic_cards_slot` accordingly
- Phase A evening seed includes `evening_tomorrow_capture` at order 6 already — Phase B only upgrades the renderer, no seed change needed
- Date-seeded PRNG helper `src/lib/rhythm/dateSeedPrng.ts` (`pickOne` / `pickN`) for rotating prompts
- `periodForRhythm()` + `isRhythmActive()` helpers in `src/types/rhythms.ts` already handle weekly (`YYYY-W##`), monthly (`YYYY-MM`), quarterly (`YYYY-Q#`) period strings and weekly/monthly trigger timing
- Weekly/Monthly/Quarterly rhythm_configs ALREADY seeded in Phase A for all adult/independent members (migration 100103 lines 408-454 for trigger, 559-600 for backfill). Phase B only needs to build the section renderers — no schema or seed work for the periodic rhythm rows themselves
- `PeriodicCardsSlot` component exists in `StubSections.tsx:188` and currently returns `null` — Phase B makes it render Weekly/Monthly/Quarterly inline cards on their configured days

**Task infrastructure (PRD-09A):**
- `tasks` table with `source` CHECK constraint — currently allows: `manual`, `template_deployed`, `lila_conversation`, `notepad_routed`, `review_route`, `meeting_action`, `goal_decomposition`, `project_planner`, `member_request`, `sequential_promoted`, `recurring_generated`, `guided_form_assignment`, `list_batch` (last update in migration 100054). Phase B adds `rhythm_priority`.
- `useCreateTask` (already used by 20+ call sites) — Phase B Tomorrow Capture fuzzy-match flow writes via supabase client directly to avoid modal behavior
- `TaskBreaker` component at `src/components/tasks/TaskBreaker.tsx` — accepts `taskTitle`, `taskDescription`, `lifeAreaTag`, `onApply(subtasks)`, `onCancel`. Renders 3 detail levels (quick/detailed/granular), calls the `task-breaker` Edge Function, returns `BrokenTask[]`. Phase B wraps this in a modal launched from the On the Horizon section
- `useTasks` — queries all active tasks for a family. Phase B's fuzzy match logic filters in memory for speed (no new query)
- `tasks.priority` enum already exists (`now|next|optional|someday`) — Phase B uses `priority='now'` as the "starred for tomorrow" signal on matched existing tasks

**Calendar infrastructure (PRD-14B):**
- `calendar_events` table with `event_date`, `start_time`, `end_time` — Phase B On the Horizon reads events due in next 7 days
- `EventCreationModal` — Phase B On the Horizon "Schedule time for this?" launches this modal with pre-filled duration + member

**Backburner list infrastructure (PRD-09B):**
- `lists` table with `list_type='backburner'` — auto-created per member via `auto_provision_member_resources` trigger. Confirmed reuse pattern at `src/hooks/useMindSweep.ts:382-410` (find backburner list by `owner_id + list_type='backburner'`, insert into `list_items`)
- Phase B Carry Forward fallback "backburner" option uses the identical pattern

**Timezone + cron infrastructure:**
- `families.timezone` column (default `America/Chicago`) — used by `mindsweep-auto-sweep` Edge Function at `supabase/functions/mindsweep-auto-sweep/index.ts:65-72` via `Intl.DateTimeFormat({ hour: 'numeric', timeZone: timezone }).format(now)`
- pg_cron + pg_net pattern from `migration 00000000100093` — `cron.schedule('job-name', '0 * * * *', $$ SELECT net.http_post(...) $$)` invokes an Edge Function that handles timezone-aware batch processing
- Phase B Carry Forward fallback follows the same pattern: a new `process-carry-forward-fallback` Edge Function invoked hourly (not just at midnight — the function checks each family's timezone and only processes at the family's local midnight hour)

**Preferences storage:**
- `family_members.preferences JSONB` (default `{}`) from migration `00000000000009:62` — Phase B adds sub-fields: `carry_forward_fallback`, `carry_forward_backburner_days`, `carry_forward_backlog_threshold`, `carry_forward_backlog_prompt_max_frequency`. No schema migration needed — stored directly in the existing JSONB.
- `tasks` per-task override: Phase B adds a NEW column `carry_forward_override TEXT CHECK (... or NULL)` to enable per-task override when needed. The midnight job checks per-task override first, then falls back to member default.

#### Dependencies NOT Yet Built

- **PRD-16 (Meetings)** — Weekly Review deep-dive + Monthly Review deep-dive buttons stub with "Coming when Meetings ship" text. Completed Meetings section already stubbed (returns null) in Phase A.
- **PRD-12A (Personal LifeLantern)** — Quarterly Inventory's `stale_areas`, `quick_win_suggestion`, `lifelantern_launch_link` sections stub with "LifeLantern coming soon" text. The rhythm card itself still renders — it just shows placeholder content until PRD-12A ships.
- **Phase C AI enhancements** — `mindsweep_lite`, `morning_insight`, `feature_discovery`, `rhythm_tracker_prompts` stay stubbed (Phase C scope, not Phase B).
- **Phase D teen tailored experience** — the 8-section evening teen template + 7-section morning teen template + teen MindSweep-Lite dispositions + 15 teen morning insight questions stay stubbed (Phase D scope). Phase B's Tomorrow Capture + Morning Recall + On the Horizon render for teens the same as adults (the addendum explicitly says teen Tomorrow Capture uses the same rotating prompts, which "already use aspiration language that works for teens").

#### Build Items (Phase B — 4 sub-phases, 1 migration, 1 Edge Function)

**Sub-phase B1 — Foundation (schema + types + hooks + Edge Function skeleton)**

1. **Migration `00000000100110_rhythms_phase_b.sql`** — single file, idempotent:
   - ALTER `tasks` DROP + ADD `tasks_source_check` constraint to include `'rhythm_priority'` (full list from 100054 + the new value, matching the rebuild-enum convention from earlier migrations)
   - ALTER `tasks` ADD COLUMN `carry_forward_override TEXT CHECK (carry_forward_override IS NULL OR carry_forward_override IN ('stay','roll_forward','expire','backburner'))`
   - Update `auto_provision_member_resources` trigger function's morning rhythm seed for adult/independent/teen roles: insert `on_the_horizon` at order 6 and renumber `brain_dump` + `periodic_cards_slot` to orders 7 and 8. (Phase C will later insert `morning_insight` + `feature_discovery` before brain_dump — Phase B leaves room in the narrative by positioning on_the_horizon immediately after calendar_preview.)
   - Backfill: UPDATE existing `rhythm_configs` WHERE `rhythm_key='morning'` AND sections doesn't already contain `on_the_horizon` — insert it at position 6 and shift downstream sections. Idempotent via jsonb_path check (`NOT (sections @> '[{"section_type":"on_the_horizon"}]'::jsonb)`).
   - INSERT 1 feature key into `feature_key_registry`: `rhythm_carry_forward_fallback` (Essential, all roles, display name "Carry Forward Fallback"). The other Phase B feature keys (`rhythm_on_the_horizon`, `rhythms_periodic`) are already registered from Phase A migration 100103.
   - Grant `feature_access_v2` rows for `rhythm_carry_forward_fallback`: 5 role groups × Essential tier = 5 rows.
   - `pg_cron` job `rhythm-carry-forward-fallback` — invoked hourly at `:05` (not `:00` so it doesn't collide with `mindsweep-auto-sweep` at `:00`). Calls the `process-carry-forward-fallback` Edge Function via `net.http_post` using the same service-role auth pattern as `mindsweep-auto-sweep`.

2. **TypeScript types extension** — `src/types/rhythms.ts`:
   - Add `CarryForwardFallback` type: `'stay' | 'roll_forward' | 'expire' | 'backburner'`
   - Add interface `MemberRhythmPreferences` capturing the four new `family_members.preferences` sub-fields
   - Extend `RhythmPriorityItem` with optional `prompt_variant_index` so the stored metadata records which rotating prompt was active when the row was captured
   - No changes to `RhythmSection` / `RhythmConfig` / `RhythmCompletion` — schema stays as-is

3. **Edge Function `process-carry-forward-fallback`** — `supabase/functions/process-carry-forward-fallback/index.ts`:
   - Copies the skeleton from `mindsweep-auto-sweep` (POST + service-role auth check + CORS)
   - Queries `families` for all active families; for each family, reads `timezone` and computes the current hour in that timezone
   - If current hour in family tz is `0` (i.e. the first hour of local midnight), process all incomplete tasks for members of that family
   - For each active family member, reads `preferences->>'carry_forward_fallback'` (defaults to `'stay'` if missing). Also reads `preferences->>'carry_forward_backburner_days'` (default 14) and the backlog threshold/frequency fields
   - Per-task override takes precedence over member default: if `tasks.carry_forward_override IS NOT NULL`, use that value; otherwise use member default
   - For each task: apply the chosen fallback
     - `stay` → no-op
     - `roll_forward` → `UPDATE tasks SET due_date = CURRENT_DATE WHERE due_date < CURRENT_DATE AND status IN ('pending','in_progress')`. Only roll forward tasks with a due date strictly in the past (not tasks without due dates at all). Does not increment `due_date` by 1 day repeatedly; sets to today regardless of how overdue.
     - `expire` → `UPDATE tasks SET status = 'cancelled', archived_at = NOW() WHERE due_date < CURRENT_DATE AND status IN ('pending','in_progress')`
     - `backburner` → for tasks with `due_date < (CURRENT_DATE - INTERVAL '{backburner_days} days') AND status IN ('pending','in_progress')`: find or create the member's backburner list (reusing the pattern at `useMindSweep.ts:382-410`), insert into `list_items` with `content = task.title`, soft-delete the task (`status='cancelled', archived_at=NOW()`)
   - Backlog threshold prompt side effect: if a family member has ≥ `carry_forward_backlog_threshold` tasks with `due_date < CURRENT_DATE - INTERVAL '14 days' AND status IN ('pending','in_progress')` AND their most recent `rhythm_completions` row of `rhythm_key='evening'` doesn't already have a recent `backlog_prompt_shown_at` in `metadata`, mark the next pending evening completion with `metadata.backlog_prompt_pending = true`. The evening rhythm reads this and surfaces a gentle "You have X things sitting for a while — want to do a quick sweep?" prompt. Max once per week enforced by tracking `metadata.last_backlog_prompt_at` in the most recent completion.
   - Log cost (zero — no LLM calls, pure DB job)
   - Return `{ processed_families, tasks_rolled_forward, tasks_expired, tasks_backburnered, members_with_backlog_prompt }`

4. **`tsc -b` check** — zero errors before moving to Sub-phase B2
5. **Playwright smoke test**: migration applied; `on_the_horizon` section appears in existing members' morning rhythm configs at position 6; Edge Function reachable via service-role-auth; `rhythm_priority` accepted as a valid tasks.source value

**Sub-phase B2 — Evening Tomorrow Capture + Morning Priorities Recall (Enhancement 1)**

1. **`EveningTomorrowCaptureSection` component** — `src/components/rhythms/sections/EveningTomorrowCaptureSection.tsx`:
   - Accepts `familyId`, `memberId`, `existingCompletion` (to read already-staged priority_items)
   - Rotating prompt header via `pickOne(PROMPTS, rhythmSeed(memberId, 'evening:tomorrow_capture', new Date()))`. Prompts array: the 4 framings from the addendum (line 30-36). Same prompt all day for the same member, rotates at midnight.
   - 3 text inputs rendered by default + `[+ Add more]` button (no hard cap). Internal state: `items: Array<{ text: string; matchedTaskId: string | null; matchedTaskTitle: string | null; confirmedMatch: boolean; dismissed: boolean }>`
   - Fuzzy match via shared utility `src/lib/rhythm/fuzzyMatchTask.ts` (NEW): given a candidate text string + an array of `ActiveTask[]`, returns the best match (if any) or `null`. Algorithm: normalize both strings (lowercase, strip punctuation), compute Jaccard similarity on tokenized words, also check for substring containment. Threshold: `>= 0.55` Jaccard OR `>= 0.7` substring coverage. No external lib — ~40 lines of TypeScript.
   - Input debounced 350ms; after debounce, fuzzy-match fires against `useTasks(familyId)` filtered to `status IN ('pending','in_progress') AND assignee_id = memberId AND archived_at IS NULL`. If match found, inline confirmation card appears below the input: "Did you mean: [Task Title]?" with `[Yes, that's it]` / `[No, create new]` buttons. Yes sets `confirmedMatch=true` and marks the row for starring; No sets `matchedTaskId=null` and treats as new item.
   - **No writes happen mid-flow.** The section updates in-memory state only. On `Close My Day`, the modal's `handleComplete` reads the staged items from this section (via a `useRef` + callback or a context), writes new `tasks` rows (`source='rhythm_priority'`, `due_date=tomorrow`, `assignee_id=memberId`, `created_by=memberId`, `family_id=familyId`), updates matched tasks' `priority='now'`, and puts the full `priority_items` array into `rhythm_completions.metadata.priority_items` via the existing `useCompleteRhythm` mutation.
   - **Overflow handling at 6+ items**: a gentle focus-picker appears. "That's a full day! Want to pick your top 3 to focus on, or should we pick by due date?" [Pick top 3] / [Auto by due date]. Pick-top-3 lets the user check 3 checkboxes. Auto-by-due-date selects the 3 with the nearest due date (fallback to insertion order if no due dates). The 3 picks become `focus_selected: true` in the metadata; all items still become real tasks.

2. **Shared fuzzy match util** — `src/lib/rhythm/fuzzyMatchTask.ts`:
   - Pure function, no React, no API
   - `normalize(s: string): string` — lowercase, strip punctuation, collapse whitespace
   - `tokenize(s: string): Set<string>` — split on whitespace + stopword removal (tiny list: `the`, `a`, `an`, `and`, `or`, `to`, `of`, `for`)
   - `jaccard(a: Set<string>, b: Set<string>): number`
   - `substringCoverage(candidate: string, target: string): number` — fraction of candidate's tokens present as substrings in target
   - `fuzzyMatchTask(candidate: string, tasks: Array<{ id: string; title: string }>): { task: {id,title}; score: number } | null`
   - Threshold constants exported for tuning later

3. **`RhythmModal` wiring update** — the evening modal needs to know about staged tomorrow capture items to commit them on Close My Day. Phase A's `RhythmModal.handleComplete` passes an empty `metadata: {}`. Phase B introduces a `RhythmMetadataContext` React context scoped to the modal that section components can write into via a setter. On `handleComplete`, the modal reads the accumulated metadata and passes it to `useCompleteRhythm`. Minor refactor (~40 lines).

4. **Commit flow** — `src/lib/rhythm/commitTomorrowCapture.ts`:
   - Pure utility called from `RhythmModal.handleComplete` before `useCompleteRhythm.mutateAsync`
   - Given `{ familyId, memberId, items, focusSelected }`, executes writes in order:
     - For items with `confirmedMatch=true`: `UPDATE tasks SET priority='now' WHERE id IN (...)` (single statement)
     - For items with `confirmedMatch=false`: batch `INSERT INTO tasks (family_id, member_id=created_by, assignee_id=memberId, title, task_type='task', status='pending', source='rhythm_priority', due_date=tomorrow, sort_order=0)` returning the new IDs
     - Returns the enriched `priority_items` array with `created_task_id` populated so `rhythm_completions.metadata.priority_items` has the IDs
   - Error handling: if any write fails, the whole function throws; modal catches, shows a toast, allows retry. Completion is NOT written if commit fails (prevents orphaned staged items).

5. **`MorningPrioritiesRecallSection` component** — `src/components/rhythms/sections/MorningPrioritiesRecallSection.tsx`:
   - Accepts `familyId`, `memberId`
   - Queries the most recent `rhythm_completions` row where `member_id=memberId`, `rhythm_key='evening'`, `status='completed'`, ordered by `completed_at DESC`, limit 1. Reads `metadata.priority_items`.
   - If the row doesn't exist OR was completed > 24h ago OR priority_items is empty → renders a gentle empty state "Nothing carried over from last night. You've got a fresh start."
   - Otherwise renders up to 3 items (the focus_selected subset if overflow) with framing: "Here's what you wanted to focus on:" — same rotating prompt variant as was shown last night if `prompt_variant_index` was stored. Each item is tappable → opens Task detail.
   - If there were overflow items (total priority_items > 3): small secondary line "and X more on your list →" linking to `/tasks` filtered by source=rhythm_priority + due today.
   - Decision: render from `rhythm_completions.metadata` (not re-querying `tasks` by source) — the metadata is the authoritative "these were the focus picks" record.

6. **Replace stub in `StubSections.tsx`** — remove `EveningTomorrowCaptureSection` and `MorningPrioritiesRecallSection` exports. Update `SectionRendererSwitch.tsx` to import the real components.

7. **Playwright tests**:
   - Evening rhythm → type "Finish report" in first input → fuzzy match finds existing task "Finish the monthly report" → confirm → close day → verify matched task has priority='now' and rhythm_completions.metadata has matched_task_id set
   - Evening rhythm → type "Call dentist" (no match) → close day → verify new tasks row with source='rhythm_priority' and due_date=tomorrow
   - Evening rhythm → add 7 items → overflow picker appears → [Auto by due date] → verify 3 focus items marked; all 7 written as tasks
   - Morning rhythm next day → MorningPrioritiesRecallSection shows the 3 focus items with "and 4 more on your list" link

8. **`tsc -b` zero errors**

**Sub-phase B3 — On the Horizon (Enhancement 8)**

1. **`OnTheHorizonSection` component** — `src/components/rhythms/sections/OnTheHorizonSection.tsx`:
   - Accepts `familyId`, `memberId`
   - Reads `lookahead_days` from `config.config.lookahead_days` (defaults to 7 if missing). Per-member override configurable in Rhythms Settings (B4 adds the UI).
   - Queries two sources in parallel:
     - `tasks` where `family_id=familyId`, `assignee_id=memberId`, `status IN ('pending','in_progress')`, `due_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '{lookahead_days} days'`, `archived_at IS NULL`, ordered by `due_date ASC`, limit 10 (cap the result set)
     - `calendar_events` where `family_id=familyId`, `event_date BETWEEN tomorrow AND CURRENT_DATE + INTERVAL '{lookahead_days} days'`, joined/filtered to events where the member is an attendee (via `event_attendees` table) — excludes routine recurring events (simple heuristic: `recurrence_rule IS NULL` OR recurrence start is within the lookahead window). Limit 10.
   - Merge results, sort by (event_date/due_date ASC, days_remaining ASC), take top 5 (configurable via `config.max_items`, default 5)
   - Render each item as a card: icon (task vs calendar), title, days remaining ("in 3 days" / "in 6 days"), the two action buttons:
     - `[Break this into steps]` — opens `TaskBreaker` in a wrapping `ModalV2` pre-populated with the task's title + description. On apply, creates child task rows via the existing `createTaskFromData` path (parent_task_id=current task). Only shown for `tasks` rows, not calendar events.
     - `[Schedule time]` — opens `EventCreationModal` with a pre-filled title ("Work on: [Task Title]"), a default 30-minute duration, and the current member as attendee. On save, creates a calendar event linked to the task via `source_type='task'`, `source_reference_id=task.id`. For calendar events, this button is omitted (it's already a calendar event).
   - Items already with subtasks (`parent_task_id IS NOT NULL on any children OR task_breaker_level IS NOT NULL`) show a subtle "In progress — [X of Y] subtasks complete" indicator instead of the Task Breaker button
   - Overflow indicator: if total results > 5, "and X more this week →" links to `/tasks?filter=upcoming&range=7d` (stub route param — Tasks page already accepts filter params via the existing view system)
   - Empty state: "Nothing on the horizon in the next {lookahead_days} days. You're ahead of schedule."
   - Auto-hide logic: the section renders itself inline (not hidden), always shows something (at minimum the empty state), because the section is enabled in the morning rhythm. The empty state is brief and warm, not an "Auto-hide" null return.

2. **`TaskBreakerModalFromHorizon` wrapper** — `src/components/rhythms/sections/TaskBreakerModalFromHorizon.tsx`:
   - Thin `ModalV2` wrapper around `TaskBreaker` — TaskBreaker's current direct placement inside `TaskCreationModal` assumes it's embedded, not stand-alone. Wrapper provides the modal shell, accepts `taskId`, `taskTitle`, `taskDescription`, `lifeAreaTag`, `onClose`. On Task Breaker's `onApply`, writes child tasks via `createTaskFromData` (existing util), then closes and invalidates the tasks query.

3. **Replace stub in `StubSections.tsx`** — remove `OnTheHorizonSection` export. Update `SectionRendererSwitch.tsx` import.

4. **Playwright tests**:
   - Morning rhythm → On the Horizon shows 3 upcoming tasks sorted by due date
   - Tap [Break this into steps] → Task Breaker modal opens → generate 3 subtasks → apply → verify child tasks exist in DB
   - Tap [Schedule time] → Event creation modal opens with pre-filled title → save → verify calendar_event row
   - Empty state: clear all upcoming tasks → On the Horizon shows "Nothing on the horizon" message

5. **`tsc -b` zero errors**

**Sub-phase B4 — Periodic rhythm cards (Weekly / Monthly / Quarterly) + Carry Forward settings UI + Rhythms Settings section-picker polish**

1. **`WeeklyReviewCard` component** — `src/components/rhythms/periodic/WeeklyReviewCard.tsx`:
   - Renders inline inside `MorningRhythmModal` when `PeriodicCardsSlot` detects today matches the weekly rhythm's day-of-week trigger AND the weekly rhythm is enabled for the current member AND no `rhythm_completions` row exists for the current week period
   - Section renderers (each a small component in `src/components/rhythms/sections/weekly/`):
     - `WeeklyStatsSection` — reads tasks completed this week (by `task_completions.completed_at BETWEEN monday AND sunday`), intention iterations this week (via `useBestIntentions` + filter), carry-forward count (tasks where `due_date BETWEEN last week AND today AND status IN ('pending','in_progress')`). Renders as 3-4 stat cards
     - `TopVictoriesSection` — reads `victories` where `family_member_id=memberId`, `created_at BETWEEN monday AND sunday`, ordered by `is_moms_pick DESC, importance DESC, created_at DESC`, limit 5. Falls back to most recent 5 if no importance flags set. Renders as a vertical list with the existing `VictoryCard` style (simplified)
     - `NextWeekPreviewSection` — reads tasks where `assignee_id=memberId`, `due_date BETWEEN next_monday AND next_sunday`, `archived_at IS NULL`, union with calendar_events for same range. Sorted by date. Capped at 8 items. Tappable → `/tasks`, `/calendar`
     - `WeeklyReflectionPromptSection` — single rotating prompt via `pickOne(WEEKLY_PROMPTS, rhythmSeed(memberId, 'weekly:prompt', thisWeekStart))` where `WEEKLY_PROMPTS` is a hardcoded array of 8-10 weekly-specific reflection questions ("What was the theme of this week?" / "What will I do differently next week?" / etc.). Inline textarea. Save writes to existing `reflection_responses` via `useSaveResponse` with a synthetic prompt entry OR a new journal entry with tags `['reflection','weekly_review']`. **Decision: use a journal_entries row with `entry_type='reflection'` and tags `['reflection','weekly_review']` — avoids bloating reflection_prompts with weekly-only rows and keeps the weekly prompts as frontend constants.**
     - `WeeklyReviewDeepDiveSection` — stub with "Want to do a full weekly review? [Start Weekly Review Meeting] — coming with PRD-16" disabled button
   - Card has its own mini close button that writes a `rhythm_completions` row for `rhythm_key='weekly_review'`, `period=this_week_iso`. Once written, the card is hidden on subsequent opens until next week.

2. **`MonthlyReviewCard` component** — `src/components/rhythms/periodic/MonthlyReviewCard.tsx`:
   - Same inline rendering pattern as weekly. Triggers when today is day 1 of the month AND monthly rhythm is enabled AND no completion for this month
   - Sections:
     - `MonthAtAGlanceSection` — stats for the full calendar month (task completions, victories, intention iterations)
     - `HighlightReelSection` — up to 5 victories from the month with `is_moms_pick=true` OR top by importance. Fallback: most recent 5. Same layout as weekly Top Victories
     - `ReportsLinkSection` — stub link "View full monthly report → [Reports Page]" disabled (Reports page not built)
     - `MonthlyReviewDeepDiveSection` — stub same as weekly
   - Write `rhythm_completions` row for `rhythm_key='monthly_review'`, `period=this_month_iso` on close

3. **`QuarterlyInventoryCard` component** — `src/components/rhythms/periodic/QuarterlyInventoryCard.tsx`:
   - Renders when the quarterly rhythm is enabled AND no completion for this quarter
   - Sections:
     - `StaleAreasSection` — stub with "LifeLantern not built yet — when it ships, this will show your life areas by staleness" text. No query.
     - `QuickWinSuggestionSection` — stub
     - `LifeLanternLaunchLinkSection` — disabled button "Open LifeLantern — coming with PRD-12A"

4. **Upgrade `PeriodicCardsSlot`** — `src/components/rhythms/sections/StubSections.tsx`:
   - Replace the `return null` with real logic: queries `useRhythmConfigs(memberId)` for weekly/monthly/quarterly configs; for each enabled rhythm whose timing matches today, checks `useRhythmCompletion(memberId, rhythmKey)` — if no completion exists, renders the appropriate card
   - Or alternatively move `PeriodicCardsSlot` out of `StubSections.tsx` into its own file `src/components/rhythms/sections/PeriodicCardsSlot.tsx` and remove from StubSections. This is cleaner.
   - Decision: move to own file, leave StubSections for items that stay stubs through Phase C.

5. **`CarryForwardFallbackSetting` component** — `src/components/rhythms/settings/CarryForwardFallbackSetting.tsx`:
   - Renders inside `RhythmsSettingsPage` below the Active Rhythms list as its own section
   - Reads current `family_members.preferences` via `useFamilyMember` (extend to return preferences) OR direct query
   - 4 radio buttons: Stay / Roll forward / Expire / Backburner with 1-line descriptions
   - Backburner option reveals a number input "Move to backburner after __ days of inactivity" (default 14)
   - Backlog threshold section: "Show a gentle sweep prompt when I have __ or more old tasks" (default 10), max frequency dropdown (Weekly / Daily, default Weekly)
   - Save button writes to `family_members.preferences` via a new `useUpdateMemberPreferences` hook (or extends existing)
   - Explanation text at the top: "What happens to your tasks when their due date passes and they're not done?"

6. **`useUpdateMemberPreferences` hook** — `src/hooks/useMemberPreferences.ts` (NEW):
   - `useMemberPreferences(memberId)` query
   - `useUpdateMemberPreferences` mutation that merges partial updates into the existing `preferences` JSONB (uses `UPDATE family_members SET preferences = preferences || new_data WHERE id = ...`)
   - Invalidates `family-member`, `family-members` queries on success

7. **Rhythms Settings page updates** — extend `RhythmsSettingsPage.tsx`:
   - Add `CarryForwardFallbackSetting` as a new section
   - Add per-rhythm "Lookahead window" setting for morning rhythm (when expanded, shows a slider/input for on_the_horizon's `lookahead_days` config override between 3-14)
   - Polish the section-expander UI — Phase A ships toggle only; Phase B keeps the same behavior but lets the user configure the on_the_horizon section's lookahead

8. **Backlog threshold prompt UI** — new section component `BacklogPromptSection.tsx`:
   - Renders at the top of the evening rhythm ONLY when `existingCompletion.metadata.backlog_prompt_pending === true`
   - Shows "You have {threshold}+ things that have been sitting for a while. Want to do a quick sweep?" with a [Start Sweep] button linking to `/tasks?filter=overdue` and a [Not now] dismiss button
   - On dismiss or sweep click, writes `metadata.last_backlog_prompt_at = NOW()` and clears `metadata.backlog_prompt_pending`
   - Added to evening rhythm section order as `'backlog_prompt'` (conditional — only shows when flagged). **Decision**: make this a conditional banner rendered at the top of the evening modal, NOT a proper section type. Avoids the need for all members' evening seed to include it. Phase B: render it above the sections in `RhythmModal` based on a metadata check.

9. **Replace evening carry_forward stub** — `CarryForwardSection` in StubSections continues to render a placeholder (carry forward as a nightly per-task triage remains OFF by default). Add note text explaining the fallback system is the default replacement. No live data wire-up.

10. **Playwright tests**:
    - Weekly Review card appears inline in morning rhythm on Friday; completing writes the rhythm_completions row for the weekly period
    - Monthly Review card appears on day 1 of the month when enabled
    - Quarterly Inventory card renders but sections show stub text
    - CarryForwardFallbackSetting saves to family_members.preferences
    - Edge Function `process-carry-forward-fallback` dry-run: set member preference to `roll_forward`, create an overdue task, invoke the function (via `supabase.functions.invoke`), verify the task's `due_date` is today
    - Same for `expire` (status=cancelled, archived_at set) and `backburner` (task archived, list_item created in backburner list)

11. **CLAUDE.md additions** — append Phase B conventions:
    - Tomorrow Capture fuzzy match uses Jaccard + substring coverage, no external lib
    - Tomorrow Capture writes are batched on Close My Day — nothing written mid-flow
    - On the Horizon lookahead is configurable per member via `config.config.lookahead_days` (3-14), default 7
    - Weekly prompt pool is frontend constants, not DB rows (avoids reflection_prompts bloat)
    - Carry Forward fallback runs hourly via pg_cron → Edge Function → timezone-aware per-family midnight processing
    - `family_members.preferences` JSONB holds carry forward settings; per-task override via `tasks.carry_forward_override`

12. **`tsc -b` zero errors**, **`npm run check:colors` zero hardcoded colors**, **post-build verification table completed**, **feature decision file updated with Phase B verification results**

#### Stubs (NOT Building Phase B)

- **Enhancement 2 (MindSweep-Lite)** — deferred to Phase C
- **Enhancement 3 (Morning Insight / BookShelf semantic pull)** — deferred to Phase C
- **Enhancement 4 (Feature Discovery rotation)** — deferred to Phase C
- **Enhancement 6 (Tracker rhythm surface configuration via `dashboard_widgets.config.rhythm_keys`)** — deferred to Phase C
- **Enhancement 7 (Independent Teen tailored experience)** — deferred to Phase D
- **Studio rhythm template library** — no `rhythm_templates` table, post-MVP content sprint
- **PRD-16 deep-dive buttons** — stubbed with "coming when Meetings ship"
- **PRD-12A Quarterly Inventory sections** — stubbed with "LifeLantern coming soon"
- **Reports page link from Monthly Review** — stubbed
- **Weekly / Monthly rhythm completion badges on Family Overview** — deferred; Phase B only writes the completion rows, Family Overview consumption is separate
- **Push notifications for rhythm reminders** — post-MVP
- **LiLa dynamic rhythm prompts** — requires PRD-05 day-data context assembly enhancement
- **Tooltip "What's this?" → LiLa contextual help** — PRD-03 + PRD-05 enhancement dependency
- **Voice-to-text for reflection answers** — post-MVP

#### Key Decisions

1. **One migration file, one Edge Function.** `100110_rhythms_phase_b.sql` bundles the source enum update, new column, feature key, pg_cron schedule, and backfill. The Edge Function handles timezone-aware per-family processing. Rollback is a single file revert + `cron.unschedule`.
2. **Fuzzy match is bespoke, no library added.** Jaccard + substring coverage in ~40 lines of TS, located at `src/lib/rhythm/fuzzyMatchTask.ts`. Avoiding a new dependency (`fuse.js` etc.) keeps the bundle lean and matches the founder's "no premature abstractions" principle.
3. **Tomorrow Capture writes are batched on Close My Day — period.** No mid-flow task creation. The `RhythmModal.handleComplete` path is where all commits happen. Error recovery: if commit fails, completion is NOT written and the user can retry. Metadata staging happens in a scoped React context inside the modal.
4. **Matched tasks get `priority='now'`** (not a new column, not a new flag). `priority='now'` is the existing "top of the pile" signal on the tasks table. Reuses existing task-view infrastructure (PRD-09A's 13 prioritization views already key on `priority`).
5. **Morning Priorities Recall reads from `rhythm_completions.metadata`, not from the tasks table.** The metadata is the authoritative "these were the picks" record. Querying tasks by `source='rhythm_priority' + due today` would miss matched-existing tasks that got their priority bumped but weren't newly created.
6. **Rotating prompt framing is date-seeded, not random.** Same prompt all day for the same member via `rhythmSeed(memberId, 'evening:tomorrow_capture', date)`. Critical for user trust — mom cannot see a different prompt if she re-opens the modal.
7. **On the Horizon lookahead range is per-member configurable** via `rhythm_configs.sections[section_type='on_the_horizon'].config.lookahead_days`. Default 7. Rhythms Settings page B4 adds a UI control. No schema change — JSONB config.
8. **Task Breaker modal wrapper is thin.** Reuses the existing `TaskBreaker` component; wraps it in `ModalV2`; writes subtasks via existing `createTaskFromData`. No fork of TaskBreaker.
9. **Weekly/Monthly reflection prompts are frontend constants**, not DB rows. `reflection_prompts` stays focused on daily prompts. Weekly/monthly prompts are a small hardcoded array of 8-10 questions each. Keeps the prompt library clean and avoids a seed migration for content that rarely needs to change.
10. **Carry Forward cron runs hourly, not at midnight.** The Edge Function checks each family's timezone and only processes families at their local `hour === 0`. Matches the `mindsweep-auto-sweep` pattern exactly. Schedule time is `:05` to avoid colliding with the mindsweep cron at `:00`.
11. **Per-task override via new `tasks.carry_forward_override` column.** Nullable TEXT with CHECK constraint. Null = use member default. The midnight job reads per-task first, falls back to member default. Avoids bloating the existing `tasks.config JSONB` (which doesn't exist) and keeps the override index-queryable.
12. **Backburner fallback reuses `useMindSweep` pattern.** `find list WHERE owner_id=member AND list_type='backburner' → insert into list_items`. No schema change. The backburner list is auto-created by `auto_provision_member_resources`.
13. **Backlog prompt is a conditional banner in the evening rhythm, not a section type.** Avoids needing to add `backlog_prompt` to every member's evening sections seed. Renders above the section list in `RhythmModal` when `metadata.backlog_prompt_pending === true`.
14. **4 sub-phases B1 → B2 → B3 → B4, plus verification + CLAUDE.md updates.** Each sub-phase ends at a `tsc -b` clean state so the founder can review incremental progress. Migration + Edge Function skeleton land in B1 so downstream sub-phases can test against real data.

---



# Build J: PRD-09A/09B Linked Routine Steps, Mastery & Practice Advancement (Session 2) — COMPLETED 2026-04-06

### PRD Files
- `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

### Addenda Read
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` **(primary authoritative source for this build)**
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (Studio evolution context — Session 3 forward)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`

### Feature Decision File
`claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md`

### Predecessor
Build H (PRD-09A/09B Studio Intelligence Phase 1) completed 2026-04-06 — fixed broken sequential creation wiring, added cross-surface visibility, added capability tags foundation. Build J is the direct successor: the building blocks the founder's homeschool use case needs before Session 3 can build Studio intent-based search.

---

### Pre-Build Summary

#### Context

PRD-09A/09B Studio Intelligence Phase 1 (Build H) fixed a silent bug where sequential collection creation was broken everywhere (dead code in `SequentialCreator` / `SequentialCollectionView` with zero callers; `sequential_collections` table had 0 rows in production). It revived those dead-code components, added cross-surface visibility, and added `capability_tags` as the data foundation for Session 3's intent-based Studio search. Build J adds the content-layer features that families actually need to run a homeschool year: **per-item advancement modes** on sequential collections AND randomizer lists, **linked routine steps** that dynamically pull today's content from a sequential/randomizer/recurring source, **randomizer draw modes** including auto-rotation via Surprise Me, an **AI-assisted curriculum parse Edge Function** for paste-and-import list creation, a **Reading List Studio template**, and **routine duplication with linked step resolution** for multi-child families.

The founder's end-state: a daily school routine where "Math" auto-shows today's chapter from a sequential list, "Scripture Study" shows today's reading with duration tracking, and "Skateboard Practice" auto-draws a random trick from a mastery-enabled randomizer — all within one routine, each advancing independently. Mom sets this up in Studio once; the child experiences a simple checklist; the complexity is in setup, not in use.

#### Dependencies Already Built (can reuse wholesale)

- **`sequential_collections` table** + `useCreateSequentialCollection` + `useSequentialCollection` + `useSequentialCollections` + `useRedeploySequentialCollection` + `usePromoteNextSequentialItem` hooks (all live + working as of Build H)
- **`SequentialCreator`** + **`SequentialCreatorModal`** + **`SequentialCollectionView`** + **`SequentialCollectionCard`** components (revived in Build H, wired from Studio + Tasks tab + Lists page)
- **`Randomizer.tsx`** + `RandomizerSpinner` + `RandomizerResultCard` + `useSmartDraw` + `useSmartDrawCompletion` + `useListItemMemberTracking` + `FrequencyRulesEditor` (live + working). The weighting/cooldown/lifetime-cap logic in `useSmartDraw` is exactly what Surprise Me needs — we call `draw(1)` and store the result in the new `randomizer_draws` table.
- **`RoutineSectionEditor.tsx`** (858 lines) — section + step editor with frequency per section, step notes, instance_count, require_photo. `RoutineStep` type is local to this file; we'll extend it with step_type, linked_source_id, linked_source_type, display_name_override.
- **`RoutineBrainDump.tsx`** (641 lines) — pattern reference for the paste-and-parse UX. Uses shared `ai-parse` Edge Function via `sendAIMessage`. We deliberately diverge for `curriculum-parse`: new dedicated Edge Function per founder convention (confirmed Build H — "Each AI tool gets its own Edge Function, task-breaker has its own").
- **`task-breaker` Edge Function** (167 lines) — exact pattern reference for `curriculum-parse`: Haiku via OpenRouter, Zod validation, cost logging, `_shared/cors.ts` + `_shared/cost-logger.ts`, JSON-only output with markdown-fence fallback.
- **`createTaskFromData`** — the shared task creation utility with the Build H guard that throws on `taskType='sequential'`. Linked step persistence plugs into the existing routine section/step write path at line 203.
- **`PendingApprovalsSection`** in `src/pages/Tasks.tsx:1062` + `useTasksWithPendingApprovals` + `useApproveTaskCompletion` + `useRejectTaskCompletion`. Sequential mastery submissions reuse this existing queue by setting `tasks.status='pending_approval'` and writing a `task_completions` row with `approval_status='pending'` + new column `completion_type='mastery_submit'`. The UI forks on `task.advancement_mode==='mastery'` to render mastery-specific history and use mastery approve/reject hooks.
- **Studio seed data** in `src/components/studio/studio-seed-data.ts` — `TASK_TEMPLATES_BLANK` + `TASK_TEMPLATES_EXAMPLES` + capability_tags pattern. Reading List is added here.
- **`useActedBy`** for write attribution on practice/mastery events (already used by `useTaskCompletions`)
- **`ListItem`** already has a `url` column — the addendum's note about URLs being supported on list_items is correct. Sequential items (tasks table) did NOT have a dedicated URL column — `useCreateSequentialCollection` currently writes URLs into `image_url` (hook line 139). Build J adds the new `tasks.resource_url` column and corrects this.

#### Dependencies NOT Yet Built

- **PRD-11B Family Celebration gamification consumption of mastery events** — forward note only.
- **PRD-24 Gamification points for practice/mastery/streaks** — forward note only.
- **PRD-28B Compliance reporting consumption of `practice_log`** — schema is designed for this; reports not built here.
- **PRD-29 BigPlans Learning Path container** — forward note. Badge/award "pick N of M" logic belongs here, not in sequential lists. Curriculum-parse detects `pick_n_of_m` patterns in metadata only.
- **PRD-05 `studio_create_guide` conversational creation** — Session 3 Phase 3. Depends on PRD-05, PRD-18, PRD-29.
- **BookShelf reading assignments as a linked source type** — deferred. Reading lists are sequential collections with the Reading List template applied.

#### Build Items (4 sub-phases, one migration)

**Sub-phase A — Foundation (schema + types + hooks + Edge Function)**

1. **Migration `00000000100105_linked_steps_mastery_advancement.sql`** — single file containing all schema changes (bumped from 100104 due to collision with pre-existing `100104_guided_evening_rhythm.sql`):
   - ALTER `tasks` ADD COLUMN (11): `advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`, `mastery_approved_by`, `mastery_approved_at`, `require_mastery_approval`, `require_mastery_evidence`, `track_duration`, `resource_url`
   - ALTER `sequential_collections` ADD COLUMN (5): `default_advancement_mode`, `default_practice_target`, `default_require_approval`, `default_require_evidence`, `default_track_duration`
   - ALTER `task_completions` ADD COLUMN (4): `completion_type` (enum: complete|practice|mastery_submit), `duration_minutes`, `mastery_evidence_url`, `mastery_evidence_note`
   - ALTER `task_template_steps` ADD COLUMN (4): `step_type` (enum: static|linked_sequential|linked_randomizer|linked_task), `linked_source_id`, `linked_source_type`, `display_name_override`
   - ALTER `list_items` ADD COLUMN (10): same 10 advancement columns as tasks
   - ALTER `lists` ADD COLUMN (7): `draw_mode` (enum: focused|buffet|surprise|NULL), `max_active_draws`, and 5 default_* columns
   - CREATE TABLE `practice_log` (id, family_id, family_member_id, source_type, source_id, draw_id, practice_type, duration_minutes, evidence_url, evidence_note, period_date, created_at) + RLS + indexes
   - CREATE TABLE `randomizer_draws` (id, list_id, list_item_id, family_member_id, drawn_at, draw_source, routine_instance_date, status, completed_at, practice_count, created_at) + RLS + indexes + UNIQUE partial on (list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'
   - INSERT 6 feature keys into `feature_key_registry` + tier grants in `feature_access_v2`
   - Idempotent backfill UPDATE: copy `image_url` → `resource_url` for existing sequential task rows where `image_url` was used for URL storage (where `task_type='sequential' AND resource_url IS NULL AND image_url LIKE 'http%'`)
   - All idempotent: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`

2. **TypeScript types** — extend `src/types/tasks.ts` (`Task`, `TaskCompletion`, `SequentialCollection`, `TaskTemplateStep` interfaces) and `src/types/lists.ts` (`List`, `ListItem` interfaces) with the new columns. Add new interfaces: `PracticeLog`, `RandomizerDraw`, `AdvancementMode` enum, `MasteryStatus` enum, `DrawMode` enum, `StepType` enum, `LinkedSourceType` enum, `CompletionType` enum, `PracticeType` enum.

3. **`useCreateSequentialCollection` update** — in `src/hooks/useSequentialCollections.ts`:
   - Change `image_url: item.url ?? null` (line 139) to `resource_url: item.url ?? null`
   - Accept `defaultAdvancementMode`, `defaultPracticeTarget`, `defaultRequireApproval`, `defaultRequireEvidence`, `defaultTrackDuration` on the collection payload
   - Propagate defaults to each child task insert (so new items inherit the collection defaults)

4. **`usePractice` hook file (new)** — `src/hooks/usePractice.ts`:
   - `useLogPractice` mutation: writes practice_log row; for sequential items also writes task_completions (completion_type='practice') and increments tasks.practice_count; auto-promotes next item when practice_count reaches practice_target for practice_count mode
   - `useSubmitMastery` mutation: writes practice_log (practice_type='mastery_submit') + evidence fields; sets source row's mastery_status='submitted', mastery_submitted_at=now(); for sequential items, also sets tasks.status='pending_approval' + writes task_completions row with completion_type='mastery_submit', approval_status='pending'; for randomizer items, sets the active randomizer_draws row to status='submitted' (new status value added to enum in migration) OR just updates list_items.mastery_status — design detail to finalize in implementation
   - `useApproveMasterySubmission` mutation: sets mastery_status='approved', mastery_approved_by, mastery_approved_at; for sequential: sets task status='completed' and triggers `usePromoteNextSequentialItem`; for randomizer: sets list_items.is_available=false (exits pool); writes an audit trail entry
   - `useRejectMasterySubmission` mutation: sets mastery_status back to 'practicing' (NOT 'rejected' on the source — child continues practicing); the practice_log row keeps its rejection note for history; for sequential: resets tasks.status back to 'pending'

5. **`useRandomizerDraws` hook (new)** — `src/hooks/useRandomizerDraws.ts`: query + mutations for the `randomizer_draws` table. Used by Randomizer for Focused/Buffet slot management and by Surprise Me auto-draw.

6. **`useSurpriseMeAutoDraw` hook (new)** — same file or companion: called when a linked Surprise Me routine step renders. Checks for an existing active `randomizer_draws` row for `(list_id, family_member_id, routine_instance_date)`; if none, invokes `useSmartDraw.draw(1)` and writes the draw record with `draw_source='auto_surprise'`. Idempotent.

7. **Edge Function `curriculum-parse`** — `supabase/functions/curriculum-parse/index.ts`:
   - Haiku via OpenRouter (`anthropic/claude-haiku-4.5`)
   - Pattern: copy task-breaker structure exactly (cors, zod, fetch, parse, log cost)
   - System prompt: extract items from curriculum text, detect URLs embedded in text, flag required/starred items, suggest advancement_mode per item, suggest practice_target, detect pick_n_of_m metadata, preserve order, clean up numbering prefixes
   - Input Zod: `raw_text`, `list_type` ('sequential'|'randomizer'), optional `context.subject_area`, optional `context.target_level`, optional `family_id` + `member_id` for cost logging
   - Output: `{ items: [{ title, notes?, url?, is_required?, suggested_advancement_mode, suggested_practice_target?, suggested_require_approval?, prerequisite_note?, sort_order }], detected_metadata?: { source_name?, total_required?, pick_n_of_m? } }`
   - Return input_tokens + output_tokens + call `logAICost` with featureKey='curriculum_ai_parse'

8. **TypeScript check:** `tsc -b` zero errors
9. **Playwright smoke test:** migration applied, new columns queryable via Supabase client

**Sub-phase B — Sequential Advancement Modes UI**

1. `SequentialCreator` UI: new "Advancement defaults" section (default mode, target, approval, evidence, duration toggles) with bulk-set-then-override explanation text; `[Paste Curriculum]` button stub until Sub-phase C wires the modal
2. Item editor (inline from SequentialCollectionView): advancement mode override, practice_target, approval/evidence/duration toggles, resource URL input
3. `SequentialCollectionView` — per-item progress subtitle: "3/5 practices" / "Practiced 8 times" / "Submitted — awaiting approval" / "Mastered"
4. `PracticeCompletionDialog` component — duration prompt modal (15/30/45/60/custom minutes) shown when `track_duration=true` on practice completion
5. `MasterySubmissionModal` component — optional evidence (photo upload or text note) when `require_mastery_evidence=true`; confirms submission; calls `useSubmitMastery`
6. `TaskCard.tsx` updates — sequential task subtitle shows advancement progress; `[Submit as Mastered]` button when mastery status is 'practicing'; resource URL tappable
7. `PendingApprovalsSection` in `Tasks.tsx:1062` — detect mastery submissions via `task.advancement_mode === 'mastery' && task.mastery_status === 'submitted'`; render with practice history count, evidence if present; use `useApproveMasterySubmission` and `useRejectMasterySubmission` instead of the standard approve/reject hooks
8. Playwright tests:
   - Create sequential collection with practice_count mode, default target 3 → practice 3 times → next item auto-promotes
   - Create sequential collection with mastery mode, require_approval=true → practice 5 times → submit → mom approves → item completes + next promotes
   - Reject mastery submission → mastery_status returns to 'practicing', child can continue and resubmit
   - Duration tracking prompt appears when track_duration=true, doesn't appear otherwise
9. `tsc -b` zero errors

**Sub-phase C — Randomizer Advancement Modes + Draw Behaviors + Curriculum Parse**

1. Randomizer list editor (wherever lists are created/edited for randomizer type): add draw_mode selector (Focused/Buffet/Surprise Me), max_active_draws input, default advancement mode + defaults, per-item advancement override
2. `Randomizer.tsx` rendering updates:
   - Focused mode: Draw button locks after one draw until that item is completed/mastered
   - Buffet mode: Draw button allows up to N draws; slot opens on completion/mastery; badge "2/3 active"
   - Surprise Me mode: no Draw button; auto-drawn item rendered immediately (or "All mastered!" celebration); uses `useSurpriseMeAutoDraw`
3. Per-item progress display in the item list section (practice_count / mastery)
4. Randomizer mastery submission modal (reuse/extend the sequential one)
5. Randomizer mastery approval surfacing: inline section at top of RandomizerDetailView showing pending mastery submissions with approve/reject buttons (not going into PendingApprovalsSection for MVP — that's sequential-only)
6. `CurriculumParseModal` component — paste text area, optional subject_area / target_level, `[Parse]` button invoking `curriculum-parse` Edge Function, loading state, review table with per-item editable title / notes / URL / advancement mode dropdown / practice_target input / required flag, Human-in-the-Mix accept-all or per-item accept/reject
7. Wire `CurriculumParseModal` into SequentialCreator `[Paste Curriculum]` button
8. Add equivalent `[Paste Curriculum]` button on randomizer list creator
9. Playwright tests:
   - Create randomizer with mastery mode → practice 5 times → submit → mom approves → item exits pool (is_available=false)
   - Focused draw mode: draw → cannot draw again until item completed
   - Buffet draw mode with max_active_draws=3: can draw 3 times, 4th draw blocked until one completes
   - Surprise Me: linked routine step auto-draws on first open; refresh shows same item (deterministic per day)
   - curriculum-parse Edge Function: happy path with real curriculum text, error handling for malformed responses
10. `tsc -b` zero errors

**Sub-phase D — Linked Routine Steps + Reading List Template + Routine Duplication**

1. `RoutineSectionEditor.tsx` — `StepRow` component extended to show step type on creation:
   - `[+ Add Step]` button → inline dropdown: "Text Step" (existing) / "Linked Content" (new)
   - On "Linked Content" selection: opens `LinkedSourcePicker` modal
   - Linked steps render differently in the editor: link icon, source name, no title input (or greyed out title input with override text field)
   - `display_name_override` text input (optional, below the source display)
2. `LinkedSourcePicker` modal component — `src/components/tasks/sequential/LinkedSourcePicker.tsx`:
   - Tabs: Sequential List / Randomizer List / Recurring Task
   - Lists all family items of the selected type filtered by the assigned member's access permissions
   - Click to select; close modal with source id + type
3. Extend `RoutineStep` type in `RoutineSectionEditor.tsx` with `step_type`, `linked_source_id`, `linked_source_type`, `display_name_override`
4. `createTaskFromData` — extend the routine step persistence block (around line 193) to write the new 4 columns to `task_template_steps`
5. **Routine linked step rendering (child/dashboard view)** — wherever routine steps render (TaskCard or a new routine step renderer), detect `step_type !== 'static'` and render source-appropriate content:
   - `linked_sequential`: show source name / display override + expand to show current active item(s) from the sequential collection (query by `sequential_collection_id` + `sequential_is_active=true`) with resource URL if present, inline practice/mastery buttons
   - `linked_randomizer`: show source name + expand to show currently drawn item(s) from active `randomizer_draws` for this member + list (Surprise Me: the auto-drawn item for today; Focused/Buffet: the manually drawn items)
   - `linked_task`: show source task name + current state (simple passthrough)
6. **Reading List Studio template** — add `ex_reading_list` entry to `TASK_TEMPLATES_EXAMPLES` in `studio-seed-data.ts`:
   - templateType: 'sequential'
   - name: 'Reading List'
   - tagline: 'Sequential reading list with mastery + duration tracking. Finish one book at a time.'
   - Description explaining the workflow
   - capability_tags: ['reading', 'books', 'mastery', 'duration_tracking', 'homeschool', 'curriculum', 'one_at_a_time']
   - When the user clicks [Customize], the SequentialCreator opens with defaults preset: default_advancement_mode='mastery', default_require_approval=true, default_track_duration=true, default_active_count=1, default_promotion_timing='manual'
7. `RoutineDuplicateDialog` component — new modal:
   - Shows the routine name + destination child picker
   - For each linked step in the source routine: a resolution row — "X's routine links to [Source Name]. Which list should Y's link to?" with options: Same list (shared progress) / Pick a different list (list picker) / Create new (opens SequentialCreatorModal or list picker)
   - On submit: duplicates `task_templates` → `task_template_sections` → `task_template_steps` with resolved `linked_source_id` per linked step
8. Wire a `[Duplicate for another child]` button on routine templates in Studio "My Customized"
9. Playwright tests:
   - Build routine with a linked sequential step; assign to child; child sees source name + current item on dashboard; completing the linked item writes practice_log + advances source
   - Build routine with a linked Surprise Me randomizer step; on first dashboard open, auto-draw runs + locks in; refresh shows same item
   - Duplicate routine for second child: linked step prompts for source resolution; pick "Same list" → new routine shares progress; pick "Create new" → SequentialCreatorModal opens to create a new collection for the second child
   - Reading List template deploys with correct defaults (verify in DB that default_advancement_mode='mastery', default_track_duration=true, default_active_count=1)
10. `tsc -b` zero errors
11. **Post-build verification table filled** in feature decision file
12. **STUB_REGISTRY.md updates**: flip lines 429-435 from "⏳ Unwired (MVP) Session 2" to "✅ Wired PRD-09A/09B Linked Steps (Build J)" with 2026-04-XX date
13. **CLAUDE.md additions** (post-build checklist Part B): 10 new convention lines per addendum — linked step semantics, advancement modes, draw modes, practice_log vs task_completions, mastery exit from randomizer pool, Reading List as Studio template, badge/award deferred to BigPlans, curriculum-parse Human-in-the-Mix, linked step frequency inheritance, routine duplication source resolution
14. **Feature decision file verification table completed** with zero Missing, founder sign-off

#### Stubs (NOT Building This Session)

- LiLa `studio_create_guide` conversational creation — Session 3 Phase 3
- Community curriculum template sharing (Creator tier) — post-MVP
- Pre-built curriculum templates (Frontier Girls, classical) — content sprint, not this build
- Learning Path duplication in BigPlans — PRD-29
- Badge/award pick-N-of-M logic — PRD-29
- Gamification point events for practice/mastery — PRD-24
- Auto-Victory on mastery approval — PRD-11 enhancement
- Compliance report consumption of practice_log — PRD-28B
- BookShelf reading assignments as a linked source type — deferred
- Cross-source unified mastery approval queue — sequential uses Tasks.tsx queue; randomizer uses per-list inline section
- Rich evidence capture (camera integration, multi-file) — basic upload/note only in this phase
- Real-time Surprise Me re-draw within same day — explicitly NOT supported (that's the feature)

#### Key Decisions

1. **One migration file.** All 41 column additions + 2 new tables + RLS + indexes + feature keys + backfill in `00000000100105_linked_steps_mastery_advancement.sql`. Idempotent. Rollback is a single file revert.
2. **`practice_log` is the unified cross-source log.** Sequential items also dual-write to `task_completions` (completion_type='practice') for backward-compatible per-task audit views. Randomizer items write ONLY to `practice_log` (no task_completions parent).
3. **`curriculum-parse` is a dedicated Edge Function**, not a reuse of `ai-parse`. Founder convention confirmed Build H. Follows task-breaker code pattern exactly. The addendum's "Same as routine-brain-dump" refers to UX pattern only; routine-brain-dump actually uses shared ai-parse — we're deliberately diverging for architectural consistency with task-breaker.
4. **Mastery rejection = `mastery_status` returns to `'practicing'`**, not `'rejected'`. The completion record keeps the rejection note for history. Child keeps practicing.
5. **Mastered randomizer items exit the pool permanently** via `list_items.is_available = false`. `is_repeatable` is ignored for mastery items.
6. **Surprise Me is deterministic per day** via UNIQUE partial index on `randomizer_draws(list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'`. Refresh = same item.
7. **`resource_url` is a new `tasks` column.** `image_url` is no longer overloaded for sequential item URLs. Migration includes an idempotent backfill for existing rows where `image_url` held a URL.
8. **Sequential mastery approvals reuse `PendingApprovalsSection`** (Tasks.tsx:1062) via `task.status='pending_approval'` + new `completion_type='mastery_submit'` detection. Randomizer mastery approvals surface inline on the Lists detail view. A unified cross-source queue is NOT built in this phase.
9. **Linked steps inherit section frequency**; source advancement is cumulative and independent.
10. **Bulk-set-then-override for advancement defaults.** Collection/list defaults propagate to new items; per-item override is the exception path, not the default path.
11. **Zero new authentication or permission patterns.** Existing RLS + member_permissions apply; linked source picker filters by current member's access already.
12. **4 sub-phases A→B→C→D; Sub-phase A is foundation (schema + hooks + Edge Function); Sub-phase D is the integration layer that ties everything together.**

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

# Build F: PRD-23 BookShelf Platform Library (Phase 1: Schema + Data Migration) — COMPLETED

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

# Build G: PRD-15 Messages, Requests & Notifications

### PRD Files
- `prds/communication/PRD-15-Messages-Requests-Notifications.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md` (MindSweep cross-member routing)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-15-Messages-Requests-Notifications.md`

### Build Plan
`C:\Users\tenis\.claude\plans\structured-wibbling-riddle.md` — Founder-reviewed 5-phase plan.

---

### Pre-Build Summary

#### Context
PRD-15 defines the family communication backbone — three interconnected subsystems (Messages, Requests, Notifications) across 10 screens, 12 database tables, 11 feature keys, and 4 Edge Functions. This is the largest remaining PRD and every other feature depends on Notifications.

Only `out_of_nest_members` (migration 17, 4 rows) exists. `notifications` and `notification_preferences` exist in DB but are NOT API-exposed and have no migration file. All messaging tables and `family_requests` do NOT exist yet. `usePendingCounts.ts` query on `family_requests` silently fails (returns 0). `RequestsTab.tsx` is a stub. `MessagesPage` is a placeholder. No notification bell in any shell.

#### Dependencies Already Built
- out_of_nest_members table (migration 17, 4 rows, used in FamilySetup + ArchivesPage)
- RequestsTab.tsx stub in UniversalQueueModal
- MessagesPage placeholder at /messages route
- RoutingStrip 'message' destination (exists but no handler)
- QuickCreate "Send Request" action (falls back to Notepad)
- BreathingGlow component (src/components/ui/BreathingGlow.tsx)
- CalendarTab approve/reject handlers (ready for notification wiring)
- ListPickerModal, EventCreationModal, TaskCreationModal (for request accept routing)
- MemberPillSelector component
- ModalV2 component
- usePendingCounts.ts (queries family_requests, silently fails)
- _shared/context-assembler.ts, _shared/cost-logger.ts, _shared/cors.ts, _shared/auth.ts

#### Dependencies NOT Yet Built
- Supabase Realtime (first usage in codebase — verify enabled on project)
- Push notification infrastructure (post-MVP)
- Email delivery for Out of Nest (stub)
- PRD-16 (Meetings) — meeting action items → requests deferred
- PRD-30 (Safety) — safety flag alert notifications deferred

#### Build Phases (5 phases, A→B→C/D→E)

**Phase A: Infrastructure** — Migration 00000000100098 (9 new tables + 2 ALTER + RLS + triggers + indexes + 11 feature keys), TypeScript types, feature key registration. RLS built WITH the tables — critical privacy rule: mom cannot read other members' messages.

**Phase B: Notifications + Calendar Wiring** — NotificationBell (reuses BreathingGlow), NotificationTray, NotificationPreferencesPanel, useNotifications + useNotificationPreferences hooks, createNotification utility. Bell added to Mom/Adult/Independent shells. Wire calendar approve/reject notifications immediately for real test data.

**Phase C: Requests** — useRequests hook, QuickRequestModal, RequestCard (handles source='mindsweep_auto' attribution), wire RequestsTab, QuickCreate "Send Request", RoutingStrip 'request' destination (15th), accept routing to Calendar/Tasks/List/Acknowledge with sender notification.

**Phase D: Messages Core** — 6 hooks (spaces, threads, messages, realtime, permissions, unread count), MessagesPage (Spaces + Chats tabs), ConversationSpaceView, ChatThreadView, MessageInputBar, ComposeFlow, MessageSearch, initializeConversationSpaces (runs on first /messages visit with warm loading state). Sidebar nav + Queue Modal chat shortcut.

**Phase E: Messages Advanced** — 4 Edge Functions (lila-message-respond, message-coach, auto-title-thread, notify-out-of-nest stub), CoachingCheckpoint, ContentCorner + LinkPreviewCard, MessagingSettings (7 sections), LiLa "Ask LiLa & Send" button, "Discuss" from request → conversation thread.

#### Stubs (NOT Building)
- Push notifications, SMS/text for Out of Nest
- Morning digest / Daily Briefing
- Victory sharing / Family celebration / Permission change / LiLa suggestion notifications
- Content Corner LiLa link pre-screening
- Higgins/Cyrano coaching integration
- Read receipts, message reactions, voice messages
- Extended Out of Nest (family tree)
- Message coaching activity log
- Calendar reminder notifications via pg_cron

#### Key Decisions
1. **RLS in Phase A** — built with tables, not bolted on. Mom can't read other members' messages.
2. **Calendar notifications wired in Phase B** — real test data for notification tray from day one
3. **BreathingGlow reused** — existing component from PRD-17, not recreated
4. **usePendingCounts backward compatible** — existing query shape works after table creation, Phase C tightens
5. **Queue Modal chat shortcut in Phase D** — per PRD-15 Screen 8
6. **"Send as Request" in Phase C** — 15th RoutingStrip destination, not deferred
7. **family_requests.source includes 'mindsweep_auto'** — PRD-17B cross-member routing
8. **initializeConversationSpaces on first /messages visit** — warm loading state, idempotent, no PRD-01 coupling

---

# Build H: PRD-09A/09B Studio Intelligence Phase 1 — Sequential Wiring Fix + Cross-Surface Visibility + Capability Tags

### PRD Files
- `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
- `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`

### Addenda Read
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` (**primary authoritative source for this build — Phase 1 scope only**)
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` (read for Session 2 context — NOT building this session)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`
- `specs/studio-seed-templates.md` (founder-authoritative Studio five-layer mental model)
- `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` (forward concept capture — not in scope)

### Feature Decision File
`claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`

### Build Plan
Session 1 of a three-session sequence:
- **Session 1 (this build):** Fix broken sequential creation wiring, randomizer on Lists page, sequential cross-surface visibility, capability tags foundation on Studio seed data.
- **Session 2 (next):** Linked Steps / Mastery / Advancement addendum — advancement modes, `practice_log` + `randomizer_draws` tables, linked routine steps, `curriculum-parse` Edge Function, Reading List template, routine duplication.
- **Session 3 (after):** Studio Intelligence Phase 2 — "What do you want to create?" search bar, use case categories, enhanced template cards, "My Library" tab, post-creation recommendations.
- **Phase 3 (forward note, not scheduled):** LiLa `studio_create_guide` conversational creation mode. Depends on PRD-05, PRD-18, PRD-29.

---

### Pre-Build Summary

#### Context

The PRD-09A/09B audit discovered that sequential collection creation is **broken everywhere**. Fully-built dead-code components (`SequentialCreator.tsx`, `SequentialCollectionView.tsx`, `useCreateSequentialCollection` hook) exist but have zero callers in src/. The `sequential_collections` table has **0 rows** in the live database (confirmed in `claude/live_schema.md` line 757). Every current "Create Sequential" entry point opens `TaskCreationModal` with `initialTaskType='sequential'`, which silently writes a malformed single row to the `tasks` table with no children and no `sequential_collections` entry.

Additionally, the `Lists.tsx:357` hard-coded type picker grid excludes `'randomizer'` even though `RandomizerDetailView`, the `Randomizer` component, and the `TYPE_CONFIG` entry all exist. Randomizer creation works only via the Studio → `/lists?create=randomizer` URL-param backdoor.

This build is a deliberate architectural evolution from PRD-09A line 469's original ruling ("Sequential collections need their own tab because the management experience is unique"). Per the Studio Intelligence addendum, sequential collections will now be visible on **both** the Tasks → Sequential tab AND the Lists page. Mom thinks of sequential collections as "lists of content for my kids," not "task-system items." Dual access, not migration. The rich management experience (`SequentialCollectionView`) is the primary rendering on both surfaces. Studio remains the universal creation library. The capability tags added this session are the data foundation for Session 3's intent-based Studio search.

**No database migrations. No new tables. No new columns. Phase 1 is 100% frontend wiring plus a seed data config update.**

#### Dependencies Already Built
- `sequential_collections` table (live schema line 757) — 14 columns, 0 rows
- `useCreateSequentialCollection` hook (`src/hooks/useSequentialCollections.ts:80-165`) — fully functional mutation
- `useSequentialCollection` hook — fetches collection + child tasks + active task
- `useSequentialCollections` hook — lists all collections for a family
- `useRedeploySequentialCollection` — restart-for-another-student flow
- `SequentialCreator.tsx` — full creation UI with title, manual/URL/image, items textarea, BulkAddWithAI integration, promotion timing, active count. **Zero callers in src/**.
- `SequentialCollectionView.tsx` — full management view with progress bars, active item highlighting, restart-for-another-student, archive, member picker modal. **Zero callers in src/**.
- `TaskCreationModal.tsx` — accepts `initialTaskType` prop (line 107, 401), assigns to state (line 412, 437)
- `createTaskFromData.ts` — shared task creation utility used by 4 shells
- `Lists.tsx` — `TYPE_CONFIG` includes `randomizer`, `RandomizerDetailView` rendered when `list_type='randomizer'`, `?create=` URL param path (lines 157-164)
- `Studio.tsx` — `handleCustomize` with sequential branch (lines 223-228) currently routing to TaskCreationModal
- `studio-seed-data.ts` — `TASK_TEMPLATES_BLANK`, `TASK_TEMPLATES_EXAMPLES`, `GUIDED_FORM_TEMPLATES_BLANK`, `GUIDED_FORM_TEMPLATES_EXAMPLES`, `LIST_TEMPLATES_BLANK`, `LIST_TEMPLATES_EXAMPLES`, `RANDOMIZER_TEMPLATE_BLANK`. Sequential blank template at `sys_task_sequential` (line 66).
- `StudioTemplate` type — defined in `StudioTemplateCard.tsx`
- `BulkAddWithAI` component — already wired inside `SequentialCreator` (lines 163-179) for AI parse of table-of-contents
- `useLists` hook — simple `.from('lists').select('*').eq('family_id', familyId)` query, returns `List[]`
- `useFamily`, `useFamilyMember`, `useFamilyMembers` hooks — for context
- `ModalV2` component — for the new `SequentialCreatorModal` wrapper
- Live randomizer infrastructure: `Randomizer` component, `RandomizerDetailView`, `lists.list_type='randomizer'` support in all CRUD hooks

#### Dependencies NOT Yet Built
- **Session 2 scope (read for context only, NOT built this session):**
  - Advancement mode columns (`advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, etc.) on `tasks` and `list_items`
  - `practice_log` table
  - `randomizer_draws` table
  - `resource_url` column on `tasks`
  - Default advancement columns on `sequential_collections`
  - `draw_mode` column on `lists`
  - Linked routine steps (`step_type` enum on `task_template_steps`)
  - `curriculum-parse` Edge Function
  - Reading List Studio template
  - Routine duplication with linked step resolution
- **Session 3 scope (Phase 2):** "What do you want to create?" search bar, use case categories, enhanced template cards rendering capability tags, "My Library" tab, post-creation smart recommendation cards
- **Phase 3 scope (forward note):** LiLa `studio_create_guide` mode, conversational school year planner, proactive Studio suggestions
- **Captured concepts (not scheduled):** Living shopping list enhancement, backburner activation as victory

#### Build Items (Phase 1 — 14 items, 4 sub-phases)

**Sub-phase 1A: Revive dead sequential creation code + guard broken path (7 items)**
1. Create `src/components/tasks/sequential/SequentialCreatorModal.tsx` — tiny ModalV2 wrapper around the existing `SequentialCreator` component. Accepts `isOpen`, `onClose`, `familyId`, `createdBy`, `assigneeId` (optional), `onSaved` callback. Internally calls `useCreateSequentialCollection().mutateAsync()` with the shape: `{ collection: {family_id, title, promotion_timing, active_count}, items: [{title}], assigneeId, createdBy }`. Reused from Studio, Tasks page, and Lists page — single source of truth for the creation modal shell.
2. Update `TaskCreationModal.tsx` `useEffect` that assigns `initialTaskType` (lines 412 and 437) to skip `'sequential'` — log a `console.warn` if encountered, do not assign to state. This is a defensive change; the proper fix is the guard in step 3.
3. Add guard clause at top of `createTaskFromData()` in `src/utils/createTaskFromData.ts` — if `data.taskType === 'sequential'`, throw `new Error("Sequential collections must be created via useCreateSequentialCollection, not createTaskFromData. This is a bug — check the caller.")`. Prevents silent re-introduction of the broken path.
4. Update `Studio.tsx` `handleCustomize` branch for `sequential` template type (currently lines 223-228): instead of setting `modalInitialType='sequential'` and opening TaskCreationModal, open the new SequentialCreatorModal. Add `sequentialModalOpen` state.
5. Update `Tasks.tsx` `SequentialTab` `onCreate` handler (line 493 wiring): open the new SequentialCreatorModal instead of `setShowCreateModal(true)` (which opens TaskCreationModal). Add `sequentialModalOpen` state in the Tasks page.
6. Replace `Tasks.tsx` `SequentialTab` inline rendering (lines 1197-1302) with `<SequentialCollectionView familyId={family.id} onCreateCollection={() => setSequentialModalOpen(true)} />`. Standalone-sequential-task rendering path (lines 1292-1300) is removed — standalone sequential tasks without a collection are no longer a valid state once the creation path is fixed.
7. Verify `SequentialCollectionView.tsx` doesn't need internal changes. It already uses `useSequentialCollections(familyId)`, `useSequentialCollection(id)`, `useRedeploySequentialCollection`, and `useFamilyMembers`. All hooks exist and work. The one concern is the `onCreateCollection` callback — the component accepts it as a prop and already renders a [+ Create] button that fires it.

**Sub-phase 1B: Randomizer on Lists page type picker (1 item)**
8. Edit `Lists.tsx:357` — add `'randomizer'` to the hard-coded type array. One-line fix. After fix: `(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'reference', 'ideas', 'prayer', 'backburner', 'randomizer', 'custom'] as ListType[])`. Randomizer already has a TYPE_CONFIG entry (line 88), RandomizerDetailView already renders it (line 1025-1029), and the createList path already accepts `list_type='randomizer'`.

**Sub-phase 1C: Cross-surface visibility — sequential on Lists page (4 items)**
9. Add `'sequential'` as a TYPE_CONFIG entry in `Lists.tsx` with distinct icon (`Layers` or `BookOpen`). Label: "Sequential Collection". Description: "Ordered items that feed one at a time". Mark as a special meta-type that doesn't map to a real `list_type` enum value.
10. Add `'sequential'` to the type picker grid at `Lists.tsx:357`. When clicked, opens the SequentialCreatorModal instead of the simple list-name input path (requires adding a branch before `handleCreate`).
11. Query sequential collections on the Lists page: import `useSequentialCollections` and call with `family?.id`. Render a new `SequentialCollectionCardOnList` component for each, placed above (or alongside) the regular list cards. Cards show: BookOpen/Layers icon, "Sequential" badge (theme-tokened pill), title, progress indicator (compute from `useSequentialCollection(id)` or use the `current_index` + `total_items` fields on the row without the deeper query for performance). Tapping the card sets a new `selectedSequentialId` state.
12. When `selectedSequentialId` is set, render `<SequentialCollectionView>` in a detail view (mirroring the `selectedListId` pattern at `Lists.tsx:217-224`). Uses the same back button / detail container pattern as `ListDetailView`.

**Sub-phase 1D: Capability tags on Studio seed data (2 items)**
13. Add `capability_tags: string[]` as a **required** field (no `?`) on the `StudioTemplate` type in `src/components/studio/StudioTemplateCard.tsx`. TypeScript compile error on any template that forgets tags.
14. Populate `capability_tags` on every seed template in `studio-seed-data.ts`: all TASK_TEMPLATES_BLANK entries, all TASK_TEMPLATES_EXAMPLES, all GUIDED_FORM_TEMPLATES_BLANK, all GUIDED_FORM_TEMPLATES_EXAMPLES, all LIST_TEMPLATES_BLANK, all LIST_TEMPLATES_EXAMPLES, and RANDOMIZER_TEMPLATE_BLANK. Tag lists taken verbatim from `PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.

**Verification (3 items, part of the build)**
- `tsc -b` — zero errors. Mandatory before declaring complete (CLAUDE.md convention #121).
- Playwright E2E test file `tests/e2e/features/studio-intelligence-phase1.spec.ts` — create sequential from Studio, Tasks, Lists → each produces one `sequential_collections` row + N `tasks` rows with proper `sequential_collection_id`. Create randomizer from Lists page [+ New List] picker → produces one `lists` row with `list_type='randomizer'`. Verify sequential collection appears on Lists page AND Tasks → Sequential tab after creation.
- `npm run check:colors` — no hardcoded colors introduced. Mandatory per CLAUDE.md convention #15.

#### Stubs (NOT Building This Phase)

All Phase 2 items (search, categories, My Library, recommendations), all Phase 3 items (LiLa creation guide), all Session 2 Linked Steps items (advancement modes, practice_log, linked steps, curriculum-parse, Reading List template, routine duplication). Per-item edit/reassign/delete on SequentialCollectionView remains as-is (existing PRD-09A stub, not regressing).

#### Key Decisions
1. **Zero database changes.** Capability tags live in TypeScript seed data config (Option B from addendum §1D). Tags are a Studio presentation concern, not a runtime data concern.
2. **SequentialCreatorModal is the single source of truth** for sequential creation. Studio, Tasks page, and Lists page all open the same modal. Reuses the existing SequentialCreator component UI without modification.
3. **Dual access, not migration.** Sequential collections remain on Tasks → Sequential tab (with upgraded rendering via the revived SequentialCollectionView) AND are visible on the Lists page. Both paths open the same creation modal and the same management view.
4. **Defensive guards at two layers.** `TaskCreationModal` skips `initialTaskType='sequential'` with a warning; `createTaskFromData` throws on `taskType='sequential'`. Cannot silently create broken rows again.
5. **`capability_tags` is required on the `StudioTemplate` type.** Forgetting tags on a future template is a compile error, not a silent data quality issue. Ensures Session 3 search has complete data.
6. **The standalone-sequential-task rendering path is removed.** Lines 1292-1300 of Tasks.tsx render sequential tasks that have no `sequential_collection_id`. After the fix, such tasks cannot be created via the UI. If any exist in production from the broken period, they remain as orphaned task rows — not touched by this build.
7. **STUB_REGISTRY.md line 368 is currently wrong.** "Sequential reuse/redeploy flow | ✅ Wired | Phase 10 Repair" is incorrect — SequentialCollectionView has zero callers. Will be corrected in the post-build updates.
8. **`is_system` vs `is_system_template`.** Live schema has both columns on `task_templates`. `Studio.tsx:67-72` filters by `is_system = false` — keep using that. No change this build.

---

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

*PRD-09A/09B Studio Intelligence Phase 1 (Build H) completed 2026-04-06. Verification archived to `claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`. 27 wired, 0 stubbed, 0 missing. Fixed a critical silent bug: sequential collection creation was broken everywhere (dead code in SequentialCreator/SequentialCollectionView with zero callers; sequential_collections table had 0 rows in production). Revived dead code via new SequentialCreatorModal wrapper, wired it from Studio + Tasks → Sequential tab + Lists page [+ New List] picker, added two-layer guards (createTaskFromData throws, TaskCreationModal skips initialTaskType='sequential'), removed the broken inline SequentialTab sub-component. Cross-surface visibility: sequential collections now appear on the Lists page alongside regular lists (with Sequential badge + progress) AND on the Tasks → Sequential tab (dual access). One-line randomizer fix: added 'randomizer' to Lists.tsx type picker grid. Data foundation: capability_tags required field on StudioTemplate type, populated on all 27 seed templates + widget starter config adapter. Zero database migrations. Deliberate PRD divergence from PRD-09A line 469 documented. 4 Playwright E2E tests passing (sequential creation DB verification, Lists page visibility, Tasks tab visibility, randomizer creation). Session 2 (Linked Steps addendum — advancement modes, practice_log, curriculum-parse Edge Function, Reading List template) and Session 3 (Studio Phase 2 — intent-based search, use case categories, My Library) are the follow-ons.*

*PRD-18 Phase A — Rhythms & Reflections Foundation (Build I) completed 2026-04-07. Verification archived to `claude/feature-decisions/PRD-18-Rhythms-Reflections.md`. 51 wired, 14 stubbed, 0 missing across 65 requirements. Migration 100103 created `rhythm_configs`, `rhythm_completions`, `feature_discovery_dismissals`, `morning_insight_questions` tables + 12 feature keys + 32 feature_access_v2 rows + extended `auto_provision_member_resources` trigger. 26 family members backfilled (98 rhythm_configs total). Adult morning + evening rhythm modals built with auto-open once-per-period, snooze, dismiss, Close My Day. Date-seeded PRNG for deterministic daily rotation. 13-section evening fixed sequence with mood triage REMOVED per Enhancement 6 founder decision. Reuses existing reflection_prompts/reflection_responses infrastructure (already built in 100071/100072) — no rebuild. Rhythm cards render at position 0 OUTSIDE the data-driven section system, truly auto-managed. Sidebar simplified: old "Morning Rhythm"/"Evening Review" entries replaced with single "Rhythms" entry pointing to new /rhythms/settings page. Mid-build addition: mini evening rhythm for Guided members (migrations 100104 + 100106) — 5-section narrative arc Highlights → Pride → Reflections → Tomorrow → Close. Pride and Tomorrow sections each have 6 rotating wordings via date-seeded PRNG. NEW GuidedReflectionsSection pulls from existing reflection_prompts library, filters to 20 hardcoded child-friendly sort_orders, picks one via PRNG with inline View All expander to swap to any of the 20 (mirrors planned teen pattern from Enhancement 30). Reading Support flag flows through Modal → Card → SectionRendererSwitch → sections. 3 existing active Guided members backfilled. Coexists with existing CelebrateSection/DailyCelebration (PRD-11). Play kids stay unchanged. Bug fix: useReflections.ts UTC timezone bug (`new Date().toISOString().split('T')[0]`) caused reflections to be tagged with tomorrow's date in late evening (beta_glitch_reports 8dc4b2bd). Replaced 4 call sites with `todayLocalIso()` helper. Backfilled 13 historical misdated rows across 3 members using `families.timezone`. 17/17 RLS tests pass. `tsc -b` clean. Phases B/C/D deferred (Enhancement Addendum items 1-8). Systemic UTC bug pattern flagged in 21 other files for separate cleanup pass via shared `@/utils/dates` module.*

---
