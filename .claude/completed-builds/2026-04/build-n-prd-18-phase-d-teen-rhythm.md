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

