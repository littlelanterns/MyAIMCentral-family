# Play Dashboard + Sticker Book Gamification — Feature Decision File

> **Status:** ✅ **FULLY APPROVED 2026-04-07** — Original 14 sections + §16 Addendum + addendum open questions A1/A2/A3 all approved. Scheduled to start as **Build M** in a fresh session per founder direction.
>
> **Scope:** PRD-26 Play Dashboard (the dashboard Play members actually see) + the first baby step of gamification — a **Sticker Book** mechanic that earns kids creature collectibles and sticker book pages as rewards for task completion. **PLUS** (via §16 addendum): Play task tiles render paper craft images from `platform_assets` instead of emoji, with an image picker in `TaskCreationModal` for Play-assigned tasks, using a hybrid tag-search + embedding-search progressive enhancement pattern.
>
> **Created:** 2026-04-07
> **Original 14 sections approved:** 2026-04-07
> **§16 Addendum added:** 2026-04-07
> **§16 Addendum approved (A1/A2/A3):** 2026-04-07
> **Build kickoff:** Fresh session — see §17 "Sub-phase A Kickoff Checklist" at end of file
>
> **Sub-phase A's first commits (in order, executed by the fresh session):**
> 1. Amend `manus/woodland-felt-manifest` reveal CSV descriptions (Mossy Chest = creature reveal, Fairy Door = page unlock reveal) — single commit on the Manus branch
> 2. Merge `manus/woodland-felt-manifest` to main
> 3. Write migration `00000000100115_play_dashboard_sticker_book.sql` per the schema specs in §7 + §16.6
> 4. Continue Sub-phase A per §9
>
> **Manus pre-build asset task** (must ship before Sub-phase B completes — see [asset-requirements/manus-vs-task-default-fallback.md](asset-requirements/manus-vs-task-default-fallback.md))

---

## 0. Founder Sign-Off (2026-04-07)

**Two-round approval.** Original 14 sections approved first; §16 addendum added later the same day after the founder addendum message about Play tile paper craft icons; addendum questions A1/A2/A3 then approved in a third message. All approvals recorded below.

### Round 3 — Addendum questions A1/A2/A3 + reveal mapping reconfirm (2026-04-07)

| Question | Answer | Note |
|---|---|---|
| **A1** Icon reference pattern | **Option B — soft reference** (`tasks.icon_asset_key TEXT + tasks.icon_variant TEXT DEFAULT 'B'`) | Matches existing `visual_schedule_routine_steps` pattern. Stable feature_keys survive Manus reseeds; UUID FKs would churn. |
| **A2** Visual schedule library reproducibility | **Option C — hybrid** (dump 328 rows WITHOUT embeddings to versioned seed migration) | Tag-based search works day one in any fresh dev environment. Embeddings get backfilled later via manual pipeline run when needed. |
| **A3** Tag vs embedding search | **Hybrid (both)** — Stage 1 instant tag search + Stage 2 debounced embedding refine | Mom sees images appear instantly from tag search, then they get smoothly refined with semantically smarter matches a moment later. On embedding failure, tag results remain. Both paths already exist in the codebase. Concrete hook spec in §16.6b. |
| **Reveal mapping reconfirm** | Mossy Chest = creature reveal, Fairy Door = page unlock reveal | Founder said "and yes, for now, mossy chest creature, fairy door page" — explicitly reconfirming Q1 + Override #4 + §15 Manus CSV amendment direction. |
| **Manus fallback asset** | Approved — generate `vs_task_default` 3 variants A/B/C, paper craft style, generic cheerful task icon | Must ship before Sub-phase B completes. Spec at [asset-requirements/manus-vs-task-default-fallback.md](asset-requirements/manus-vs-task-default-fallback.md). |
| **Phase boundary review style** | One end-to-end review after Sub-phase F | No checkpoint reviews between sub-phases. Each still ends at a `tsc -b` clean checkpoint internally for Claude Code's own quality gating. |
| **Build kickoff timing** | Fresh session for Sub-phase A | This session finishes paperwork only. Migration writing happens in the next session with a clean context. |

### Round 1 — Original 14 sections (2026-04-07)

Founder's exact review quote:

> *"This plan is solid. Approve all 10 questions with recommended options, confirm the scope splits, merge the Manus branch, and let Claude Code start Sub-phase A."*

### Approved answers

| Question | Answer | Note |
|---|---|---|
| **Q1** Reveal video mapping | Mossy Chest = creature reward. Fairy Door = page unlock reward. | Manus CSV descriptions are currently wrong — they say both videos are pet rarity reveals. **Amend the Manus branch before merge** to correct the descriptions so the seed data matches intent. See §15.1. |
| **Q2** `gamification_configs` table scope | Option A — build the full PRD-24 table now (20+ columns) | Only a subset is read this build, but the schema is right once and forever. |
| **Q3** Rarity weights | Option B — `rarity_weights JSONB` on `member_sticker_book_state` with default `{"common": 85, "rare": 12, "legendary": 3}` | Seeded in auto-provision trigger. Mom never has to touch it. Schema supports future tuning UI. |
| **Q4** `tasks.points_override` | Option C — add the column now | One-column add avoids a quick-follow-up migration. Mom will want per-task point values within the first week. |
| **Q5** Streak logic | Option B — naive consecutive-day streak | Schedule-aware upgrade deferred. Play kids are doing daily tasks, not MWF schedules. `gamification_configs.streak_schedule_aware` defaults to `false` this build. Documented as known limitation in STUB_REGISTRY + CLAUDE.md. |
| **Q6** Creature roll location | Option B — PostgreSQL RPC `roll_creature_for_completion(p_task_completion_id UUID) RETURNS JSONB` | Server-authoritative, transactional, idempotency-safe. 11-step logic in §7.5. |
| **Q7** `useCompleteTask` surgery | Option A — edit directly | Adds RPC call after task update. Same treatment for `useApproveCompletion`. Canonical completion path stays canonical. |
| **Q8** Practice earning points | Option C — only `completion_type='complete'`/NULL/`mastery_approved` trigger the pipeline | Practice is effort, mastery approval is completion. Matches existing semantic distinction. |
| **Q9** Play Dashboard routing | Option A — mirror the Guided branch pattern in `Dashboard.tsx` | Zero refactor risk. |
| **Q10** Creature placement | Option C (shipped as Option A this build) — auto-place on earn, schema supports future drag-to-reposition | `position_x/y` columns ship now; drag UI deferred to Phase 2. |

### Approved scope splits

| Split | Confirmed |
|---|---|
| Reveal task tiles (PRD-26 surprise mechanic) stubbed with `PlannedExpansionCard` — deferred to a fast-follow build | ✅ Agreed |
| Mom's Message card stubbed until PRD-15 Play integration | ✅ Agreed |
| DailyCelebration Steps 3 (streak) + 4 (overlay reveal) remain auto-skipped | ✅ Agreed |
| No treasure box, no reward menu, no Family Leaderboard, no 8-type Reveal Library this build | ✅ Agreed |

### Known gap accepted without scope change

**Sub-phase E's minimal settings screen does NOT include the sticker book page curation UI** — the "mom browses thumbnails, picks which scenes to include, sets unlock order" interface. Auto-default uses all 26 manifest pages in their seeded order, so everything works without mom touching anything. The "mom feels invested in the kids unlocking a new page" experience waits for a follow-up build.

This is accepted for the baby step. Documented in STUB_REGISTRY.md under "Sticker book page curation UI (mom-facing)".

### Founder praise notes (preserved for future build reference)

- The modal queue pattern in §8 (creature reveal → page unlock chained sequentially, never two modals at once) is correct for a kid's experience.
- The `creature_roll_chance_per_task = 40` default is correct — not every task produces a creature, keeping excitement alive; tunable if it feels too sparse/frequent.
- The backfill strategy (extend `auto_provision_member_resources` + one-shot backfill for existing members) is the right approach for live family data.

---

---

## 1. Purpose of this Build

Two tightly coupled goals:

1. **Play Dashboard is currently broken.** Play members today hit `Dashboard.tsx` inside `PlayShell` — the same data-driven dashboard adults use, wrapped in a Play shell with a Celebrate button. There is no PRD-26 implementation, no task tile grid, no reveal tiles, no widget slots sized for little fingers. A 3–7 year old cannot use this.
2. **Gamification infrastructure has been fully laid down but nothing writes to it.** `family_members.gamification_points`, `gamification_level`, `current_streak`, `longest_streak`, `last_task_completion_date`, `streak_grace_used_today` all exist as columns (migration `00000000000001`). `useCompleteTask` at [src/hooks/useTasks.ts:208-271](src/hooks/useTasks.ts#L208-L271) never touches any of them. The gamification event pipeline described in PRD-24 has zero lines of code.

This build delivers the first usable version of both — Play Dashboard becomes a real, age-appropriate surface, and task completion on that surface feels alive because every task has a real chance of earning a creature and progressing toward the next sticker book page. **The gamification baby step exists in service of Play Dashboard**, not as a separate horizontal feature build.

### What "baby step" means in this context

- Points earned on task completion → written to `family_members.gamification_points`
- A streak column updated on task completion (simple consecutive-day logic, NOT PRD-24's schedule-aware version)
- A **Sticker Book** reward loop: each task completion has a chance to award a creature collectible; creature awards accumulate and unlock sticker book pages at configurable intervals; awards play themed reveal animations
- **NO** treasure box, **NO** reward menu + redemption, **NO** overlay progression stages, **NO** Family Leaderboard, **NO** visual world color themes, **NO** DailyCelebration Step 4 overlay reveals, **NO** 8-type reveal library — those are deferred to future gamification builds

---

## 2. Source Material Read In Full

Per PRE_BUILD_PROCESS.md, every word:

### PRDs
- **PRD-24** — Gamification Overview & Foundation (`prds/gamification/PRD-24-Gamification-Overview-Foundation.md`, 1374 lines)
- **PRD-24A** — Overlay Engine & Gamification Visuals (`prds/gamification/PRD-24A-Overlay-Engine-Gamification-Visuals.md`, 1986 lines — core architecture + 5 launch themes + DailyCelebration Step 4 read in detail)
- **PRD-24B** — Gamification Visuals & Interactions (`prds/gamification/PRD-24B-Gamification-Visuals-Interactions.md`, 1443 lines — Reveal Type Library architecture, 8 reveal types, reward card shared component)
- **PRD-26** — Play Dashboard (`prds/dashboards/PRD-26-Play-Dashboard.md`, 650 lines) — read completely

### Addenda
- **PRD-24 Cross-PRD Impact Addendum** — the 15 column additions across `family_members`, `tasks`, `list_items`, `lists`, the 8 new PRD-24 tables, the notification/request enum extensions
- **PRD-24A Cross-PRD Impact Addendum** — the `visual_world_theme` → `dashboard_background_key` rename, the removal of `overlay_id` from `gamification_configs`, `overlay_instances` replacing it, `treasure_box_template` being replaced by per-theme reveal containers
- **PRD-24B Cross-PRD Impact Addendum** — `treasure_boxes.animation_template` → `treasure_boxes.reveal_type` rename, the flat Reveal Type Library replacing all prior template lists, rendering layer order for the dashboard
- **PRD-24B Content Pipeline — Tool Decisions & Research Tasks** — Nano Banana grid generation, Hugging Face Image Cutter slicing, Manus orchestration, open research tasks for video gen and zone map detection

### Reference material
- **`gamification-assets-bucket-structure.md`** — the canonical organization pattern (already in context from the previous session)
- **Three manifest CSVs on branch `origin/manus/woodland-felt-manifest`** (not yet merged to main):
  - `assets/gamification/woodland-felt/woodland-felt-manifest.csv` — **161 creature rows** (header + 161 data rows) across common + rare + legendary. Columns: `filename, name, rarity, tags, description, image_url`
  - `assets/gamification/woodland-felt/backgrounds-manifest.csv` — **26 background rows**. Columns: `filename, type, scene, season, url`
  - `assets/gamification/woodland-felt/reveals-manifest.csv` — **2 reveal video rows**. Columns: `filename, type, description, url`

### Code surveyed
- [src/components/shells/PlayShell.tsx](src/components/shells/PlayShell.tsx) (123 lines — fully read)
- [src/components/shells/RoleRouter.tsx](src/components/shells/RoleRouter.tsx) (44 lines — fully read)
- [src/components/shared/ConfettiBurst.tsx](src/components/shared/ConfettiBurst.tsx) (142 lines — fully read; confirmed reusable)
- [src/components/victories/DailyCelebration.tsx](src/components/victories/DailyCelebration.tsx) (opening 80 lines — Steps 3 and 4 confirmed as auto-skipped stubs)
- [src/hooks/useTasks.ts:208-271](src/hooks/useTasks.ts#L208-L271) — `useCompleteTask` mutation, the integration point for the gamification pipeline
- [src/hooks/useTaskCompletions.ts](src/hooks/useTaskCompletions.ts) (342 lines — fully read; `useApproveCompletion` is the second integration point for approval-gated tasks)
- [src/hooks/usePractice.ts:30-110](src/hooks/usePractice.ts#L30-L110) — `useLogPractice` flow (Build J); needed to understand the dual write pattern so the gamification pipeline doesn't double-count
- [src/pages/Dashboard.tsx:1-80, 660-680](src/pages/Dashboard.tsx) — confirms Dashboard.tsx has a `guided` branch but **no `play` branch**. Play members today render the adult Dashboard.
- All `tasks_source_check` migrations to map the current full enum value set (latest: `00000000100112_rhythms_phase_c.sql` — 15 values including `rhythm_mindsweep_lite`)
- [src/lib/permissions/useCanAccess.ts](src/lib/permissions/useCanAccess.ts) — confirmed beta stub returning `true` for everything

### Project context loaded
- `CLAUDE.md` (all 180 conventions)
- `claude/architecture.md`
- `claude/database_schema.md`
- `claude/live_schema.md` (gamification columns confirmed present; 0 rows in any gamification-adjacent table)
- `WIRING_STATUS.md`
- `CURRENT_BUILD.md` (Build L PRD-18 Phase C is the most recently active build; no in-flight work collides with this build)

---

## 3. Key Architectural Overrides (Founder Pivots That Supersede PRD Text)

PRD-24, 24A, 24B were written in March 2026. Since then the founder made the following design decisions that **supersede the PRD text where they conflict**. These must be treated as authoritative for this build.

| # | Override | What It Replaces | Rationale |
|---|---|---|---|
| 1 | **Sticker Book replaces overlay 4-stage progression** | PRD-24A Screens 6–9 (Collection View → Stage Evolution → Recipe Book → DailyCelebration Step 4 with stage animation) | Kids earn creatures and place them on page scenes like a digital sticker book instead of watching a world auto-progress through 4 hardcoded stages. Less mechanical, more tactile. |
| 2 | **Sticker book pages are Mom-configurable triggers, NOT hardcoded to creature count** | PRD-24A effort/category modes driving stage progression | Mom attaches page unlock to any measurable event (creature count, streak milestone, tracker goal, specific task, any accomplishment). Auto-default = "every 7 creatures" so the system works without setup. |
| 3 | **Mom curates the sticker book pages** | PRD-24A background library with self-selection toggle | Mom picks which background scenes to include from the full manifest pool and the order they unlock. Auto-default = use all 26 in the manifest order so mom can ignore curation entirely. |
| 4 | **Two reveal video types, each mapped to a reward category** | PRD-24B's 8-type flat Reveal Type Library | **Mossy Chest video → creature earned**. **Fairy / Tree Door video → sticker book page unlocked**. Reveal type is determined by the reward category, not configured per-context. |
| 5 | **"Woodland Felt" is its own THEME, not the "Pets" theme** | PRD-24A's hypothetical "Pets" theme listed with 12 collectibles | Pets is still a future theme with a different art style. Woodland Felt is a new parallel theme with its own 161 creatures, its own backgrounds, its own reveals. The `visual_themes` concept from PRD-24A still applies, but the Pets config in PRD-24A is treated as a placeholder, not a spec. |
| 6 | **Rarity affects reveal frequency, not collection requirements** | PRD-24A's recipe/quest collectible-type counting | Common creatures appear on most days. Rare/legendary creatures appear less frequently (e.g., once a week or on high-effort days / Perfect Days). Weight is a system config mom doesn't touch. |
| 7 | **No pgvector, no embeddings, no semantic search on creatures** | PRD-24B open research task for image similarity | Simple `tags TEXT[]` + `rarity` tier columns are enough for creature pool filtering. |
| 8 | **Stage progression images are NOT being built** | PRD-24A's 4-stage environment images per theme (`pets_stage_1.png` through `pets_stage_4.png`, etc.) | Sticker book pages replace the progression concept entirely. There are no "stage 1/2/3/4" images for Woodland Felt — there are 26 sticker book pages. |
| 9 | **Reward pool is general — creatures and pages are both reward types that ANY trigger can produce** | PRD-24's treasure box trigger chain tied to specific container animations | Mom can attach either reward type (creature OR page) to any trigger she configures. Default auto-play works without Mom doing anything; the power is there for moms who want to tie specific rewards to specific accomplishments. |

### Discrepancy flagged for founder confirmation

The Manus reveal manifest ([assets/gamification/woodland-felt/reveals-manifest.csv](assets/gamification/woodland-felt/reveals-manifest.csv)) has these two descriptions:

```csv
Fairy_Door_Opens_Magical_Light.mp4,reveal,A tiny fairy door swings open with a burst of magical golden light — used for common pet reveals,...
Mossy_Chest_Reveal_Video_Ready.mp4,reveal,A mossy woodland chest creaks open revealing a glowing interior — used for rare and legendary pet reveals,...
```

**Manus wrote:** Fairy Door = common pet reveals; Mossy Chest = rare/legendary pet reveals (both rarity-based, both for creatures).

**Founder said:** Fairy / Tree Door = page/background reveals; Mossy Chest = creature reveals (category-based).

**These are incompatible.** I'm proceeding with the founder's intent (Override #4 above) because Manus's description is content metadata, not architectural spec. The Phase A migration needs to decide one way or the other. Flagging this for explicit founder confirmation in Open Question #1 below.

---

## 4. Open Questions — Need Founder Answers Before Build

These are genuine "I don't know how to decide this without you" questions, not clarifications-for-show. Each one has my recommendation.

### Q1: Reveal video mapping — manus description vs founder intent
> *See the discrepancy above.*

**Recommendation:** Use the founder's mapping. **Mossy Chest plays when a creature is awarded. Fairy Door plays when a sticker book page unlocks.** This matches the conceptual language ("opens a door to a new page", "opens a chest to reveal a creature") and the founder's task brief. The Manus descriptions get updated in a small amendment commit on the manus branch before merge.

### Q2: Where is `gamification_configs` created in Phase A?

PRD-24 defines `gamification_configs` as an 8-table gamification schema. The full table has 20+ columns. For this baby-step build, **two options:**

- **Option A (recommended):** Create the full PRD-24 `gamification_configs` table as specified (20+ columns, all defaults). We only USE a subset (enabled, base_points_per_task, currency_name, currency_icon, streak_grace_days, streak_schedule_aware). The rest sit unused until later gamification builds. Avoids schema churn.
- **Option B:** Create a minimal 5-column `gamification_configs_lite` table just for this build. Rebuild later when the full PRD-24 ships. Creates migration churn.

**Recommendation: Option A.** The table exists anyway — let's build it correctly once.

### Q3: Rarity weighting — fixed weights vs configurable per member?

The founder said "Rarity affects reveal frequency. Common creatures appear on most days. Rare/legendary creatures appear less frequently (maybe once a week or on high-effort days / Perfect Days). The exact weighting is a config Mom doesn't need to touch."

**Two interpretations:**
- **A — Fixed system weights** — Every family gets the same roll table. Hardcoded in code or seeded platform-wide. Simple.
- **B — Per-member defaults with override** — Seed a default weights JSONB (`{"common": 85, "rare": 12, "legendary": 3}`) onto each member, mom can tune later in advanced settings. Flexible.

**Recommendation: Option B with default seeding.** Put a `rarity_weights JSONB` column on `member_sticker_book_state` with the default applied in the seed trigger. Mom never has to touch it, but it exists if she wants to later. Zero extra UI work this build.

### Q4: Points-per-task for Play — fixed 1 or configurable?

PRD-24 says Play defaults to `base_points_per_task=1`. PRD-09A adds `tasks.points_override` for per-task overrides.

**Three options:**
- **A — Hardcode 1 in code** for Play members this build
- **B — Seed `gamification_configs.base_points_per_task = 1`** for every Play member in the auto-provision trigger, read it at runtime
- **C — Option B + add `tasks.points_override` column now** so mom can have a task worth 3 stars

**Recommendation: Option C.** `tasks.points_override` is a one-column add. Mom ends up wanting "this Piano practice task earns 3 stars instead of 1" within the first week. Shipping it now avoids a quick-followup migration.

### Q5: Streak logic — schedule-aware or naive consecutive-days?

PRD-24 says streaks should be schedule-aware — MWF tasks don't break streak on T/Th/Sa/Su. Implementing this correctly requires reading each task's `recurrence_config` and checking which days are scheduled. Complex and subtle.

**Two options:**
- **A — Full schedule-aware streak (PRD-24 spec)** — correct but complex, ~200 lines of logic, potential for subtle bugs
- **B — Naive consecutive-days streak for baby step** — "if the member completed ≥1 task yesterday, today's completion increments streak; if not, reset to 1." Ships in ~20 lines. Schedule-aware upgrade later.

**Recommendation: Option B (naive).** Play members in particular don't have complex MWF task schedules — they have "do your morning routine every day." Naive is correct for the Play use case. Schedule-aware streak is a Phase 2 gamification feature, not baby step. Explicitly note this as a known simplification in the feature decision file.

### Q6: Where does the creature roll live? Client-side, RPC, or trigger?

Three architectural options for "on task completion, roll a d100 against the rarity weights and maybe award a creature":

- **A — Client-side roll in `useCompleteTask` mutation** — simplest; but trivially cheatable (kid or adult can dev-tools the response) and rolls race if two completions hit at once
- **B — PostgreSQL RPC function called from `useCompleteTask` after the `tasks` update** — server-authoritative, transactional with the task update, no client cheating
- **C — AFTER INSERT trigger on `task_completions`** — zero client coupling; fires automatically; but makes the reveal modal coordination awkward (the client has to re-query to find out what was awarded)

**Recommendation: Option B (RPC).** Name it something like `roll_creature_for_completion(p_family_id, p_member_id, p_task_id) RETURNS JSONB`. Called from `useCompleteTask` after the task update. Returns `{ creature_awarded: bool, creature: {...} | null, page_unlocked: bool, page: {...} | null }`. The client knows immediately what to show. Authoritative. Idempotency-safe by checking if a creature was already awarded for this `task_completion_id`.

### Q7: `useCompleteTask` surgery — wrap, decorate, or add a provider layer?

There are three places to fire the gamification pipeline:
- **A — Edit `useCompleteTask` directly** to call the RPC after the task update. Single-source, but touches a 20+ caller file.
- **B — New `useCompleteTaskWithGamification` hook** that wraps `useCompleteTask`. Keeps `useCompleteTask` untouched, but now every caller must choose which hook. Easy to miss.
- **C — AFTER INSERT trigger on `task_completions`** (Option 6C above — back as a design candidate here) — no hook change at all, but client modal coordination is hard.

**Recommendation: Option A.** Edit `useCompleteTask` directly. It's the single canonical completion path (per CLAUDE.md). We add a third step after the task status update: call the gamification RPC, get back the award metadata, attach it to the mutation return value so the UI can show the reveal modal. Same treatment for `useApproveCompletion` in `useTaskCompletions.ts` for approval-gated flows. The gamification pipeline becomes load-bearing infrastructure, the same way `acted_by` attribution is load-bearing today.

### Q8: Should Practice completions (Build J) earn points?

`useLogPractice` writes to `practice_log` AND dual-writes a `task_completions` row with `completion_type='practice'`. If Phase C's gamification hook fires on every `task_completions` insert, practice sessions will earn points — is that intended?

**Options:**
- **A — Yes, practice earns points** (consistent "every completion earns gamification")
- **B — Practice never earns gamification** (only `completion_type='complete'` or null triggers the pipeline)
- **C — Mastery approval earns points, intermediate practice sessions don't**

**Recommendation: Option C.** The RPC checks `completion_type`. If `'complete'` or NULL → full pipeline. If `'practice'` → no points, no creature roll. If `'mastery_submit'` → no points until the mastery is approved (the approval flow itself triggers the pipeline again). This mirrors how approval-gated tasks work. Practice is effort, not completion; mastery approval IS completion.

### Q9: Play Dashboard rendering — new page or branch inside Dashboard.tsx?

Dashboard.tsx has a `guided` branch that renders `<GuidedDashboard />`. Three options:
- **A — Add a `play` branch in Dashboard.tsx** that renders `<PlayDashboard />` when `dashboard_mode === 'play'`. Mirrors the Guided pattern exactly.
- **B — Create a separate page component and route `/dashboard` to a dispatcher** that picks the right dashboard. More refactoring.
- **C — Add a new `/play` route** rendered only for Play members. Changes routing mental model.

**Recommendation: Option A.** Mirror the Guided pattern. Zero refactor risk.

### Q10: Sticker Book storage — where do creatures "live" visually before page placement?

A kid earns a creature today. Where is it visually? Three UX options:
- **A — Auto-placed** — the system picks a random position on the current active page. Kid sees it on the page next time they open the sticker book. Simplest.
- **B — Stored in a "new creatures" tray** — kid has to tap a creature and place it on a page (drag-to-position). More interactive but requires drag-and-drop on tablet.
- **C — Auto-placed + re-positionable** — placed automatically on earn, but kid can drag to move later.

**Recommendation: Option C** — auto-placed on earn (nothing breaks if the kid never touches the sticker book), with drag-to-reposition as a Phase 2 enhancement (stub for the MVP). Phase 1 of this build ships Option A effectively (auto-place + no reposition), with a `position_x` / `position_y` column in the schema so Phase 2 adds drag-to-reposition without migration.

---

## 5. Existing Infrastructure We Reuse (Do Not Rebuild)

| Piece | Location | How We Use It |
|---|---|---|
| `ConfettiBurst` component | [src/components/shared/ConfettiBurst.tsx](src/components/shared/ConfettiBurst.tsx) | Fire on task completion celebration + creature reveal modal + page unlock modal. Same `intensity='maximum'` prop for Play shell. |
| `AnimatedList` component | `src/components/shared/AnimatedList.tsx` (confirmed in DailyCelebration imports) | Re-use for staggered entrance on reveal modals |
| `SparkleOverlay` component | `src/components/shared/SparkleOverlay.tsx` | Re-use for the ambient sparkle under the creature reveal + page unlock |
| `DailyCelebration` component | [src/components/victories/DailyCelebration.tsx](src/components/victories/DailyCelebration.tsx) | Already wired in PlayShell. Steps 3 + 4 are currently auto-skipped stubs — **we don't touch them this build**, but a future build can wire streak + points display with minimal effort. |
| `celebrate-victory` Edge Function | `supabase/functions/celebrate-victory/` | Voice narration for DailyCelebration. Not used directly this build but reused for any future celebration narration. |
| `useVoicePreference` hook | `src/hooks/useVoicePreference.ts` | Voice selection stays as-is — Play members already default to `fun_friend` voice |
| `useCompleteTask` in useTasks.ts:208 | [src/hooks/useTasks.ts](src/hooks/useTasks.ts#L208-L271) | **Primary integration point.** Phase C extends this mutation with a post-update RPC call. |
| `useApproveCompletion` in useTaskCompletions.ts:132 | [src/hooks/useTaskCompletions.ts](src/hooks/useTaskCompletions.ts#L132-L176) | **Secondary integration point.** Same RPC called after mom approves a pending completion. |
| `useActedBy` hook | `src/hooks/useActedBy.ts` | Already used by `useCompleteTask` for write attribution. Gamification RPC receives the same acted_by context. |
| `PlannedExpansionCard` component | [src/components/shared/PlannedExpansionCard.tsx](src/components/shared/PlannedExpansionCard.tsx) | Stub cards for reveal tiles, reward menu, treasure box, leaderboard — everything deferred past this build. |
| `BreathingGlow` component | `src/components/ui/BreathingGlow.tsx` | Sticker Book widget "you have a new creature waiting!" attention state |
| `ModalV2` component | `src/components/shared/ModalV2.tsx` | Creature reveal modal + page unlock modal + sticker book detail modal |
| `useFamilyMember` / `useFamily` hooks | `src/hooks/` | Used by the Play Dashboard + all gamification queries |
| `member_colors` AIMfM palette | `src/config/member_colors.ts` | Used for celebration animation accent colors (per convention #15, no hardcoded hex) |
| `gamification-assets` Supabase Storage bucket | Public, already seeded with 189 files | Creature images + sticker book page images + 2 reveal videos all served directly from Storage URLs. Zero asset pipeline needed in this build. |
| `manus/woodland-felt-manifest` branch | GitHub | Merge to main before build starts. The manifest CSVs are the seed source of truth. |
| Play shell bottom nav + celebrate button | [src/components/shells/PlayShell.tsx](src/components/shells/PlayShell.tsx) | Already built. We only need to fix the nav label ("Play" → "Fun" per PRD-26, minor) and ship the dashboard content that renders inside `children`. |

---

## 6. What This Build Does NOT Touch

Explicitly out of scope to avoid scope creep. Each of these is a future gamification build.

- **Treasure boxes** (`treasure_boxes`, `treasure_box_opens` tables, widget, reveal modal, all 4 trigger types)
- **Reward menu + redemption** (`gamification_rewards`, `reward_redemptions`, Screen 3 + Screen 7 editor, auto-approve vs. requires-approval flow, PRD-15 request creation)
- **Family Leaderboard** (widget + configuration)
- **Randomizer accept/pass flow for kid draws** (PRD-09B extension — Context B per Screen 6)
- **Availability rules on randomizer list items** (`availability_mode`, `max_instances`, `completed_instances`, `recurrence_config`, `next_available_at` columns)
- **Reveal Type Library 8-reveal system** (spinner, three doors, card flip, scratch-off, slot machine, gift box, treasure chest, cracking egg) — we only use the two mapped videos (Mossy Chest for creatures, Fairy Door for pages)
- **Overlay engine** (`overlay_instances`, `overlay_collectibles`, `recipe_completions`, `VisualThemeConfig`, `GameModeConfig`, `OverlayInstance` state)
- **4-stage visual progression** per overlay (stage_1 through stage_4 images, stage threshold logic, stage evolution animation)
- **Background celebration micro-animations** (3-tier small/medium/large themed SVG animations) — per PRD-24A Screen 1 + PRD-24B Screen 12
- **DailyCelebration Step 3 streak wiring** (reads `gamification_daily_summaries.streak_milestone_today`) — Step 3 remains auto-skipped
- **DailyCelebration Step 4 overlay reveal** (collectible reveal, stage evolution, points summary) — Step 4 remains auto-skipped
- **Gamification Settings panel** (PRD-24 Screen 8 with 9 collapsible sections)
- **Schedule-aware streaks + grace periods + pause/resume**
- **Streak milestones (7, 14, 21, 30, 60, 90 days) + bonus point awards**
- **Level thresholds + level-up events**
- **`gamification_daily_summaries` daily aggregation table** — deferred (future build). Points balance is the current total on `family_members`, no daily rollup needed.
- **`gamification_events` append-only ledger** — deferred. Phase C writes points directly to `family_members`. Ledger comes later when we need history/audit, or in the first build that ships reward redemption.
- **`gamification_achievements` badges**
- **Reveal tiles on the Play Dashboard** (PRD-26 Screen 2 Surprise Mechanic) — **deferred to a fast-follow build**. Stub with a `PlannedExpansionCard` tile type. The Randomizer list infrastructure exists already; we just don't build the tile binding + animation + draw counter on the Play dashboard this round.
- **Play → Guided graduation flow** (PRD-26 Screen 4) — stub
- **Play member message sending** (receive-only is MVP per PRD-26)
- **Calendar section on Play Dashboard** (Post-MVP per PRD-26)
- **Scratch-off + gift box reveal styles** (Post-MVP per PRD-26)
- **Drag-to-reposition creatures on sticker book pages** — the schema supports it (Q10), but the UI ships placement-on-earn only
- **Cross-theme support** — only Woodland Felt is seeded. The table structure supports multi-theme but no second theme exists yet.
- **Per-page unlock triggers configurable by mom** — the schema supports a `sticker_page_unlock_rules` table, but Phase A ships auto-default "every N creatures" only. Custom per-page triggers come in a later build.

---

## 7. Data Model

### 7.1 New platform tables (seed-driven, one-time)

All platform-level tables are `family_id IS NULL`. Readable by everyone authenticated. Only service role can INSERT/UPDATE/DELETE.

#### `gamification_themes`
Identifies a theme pack. Woodland Felt is row 1.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| theme_slug | TEXT | — | NO | UNIQUE (`'woodland_felt'`) |
| display_name | TEXT | — | NO | "Woodland Felt" |
| description | TEXT | — | YES | Marketing copy |
| creature_reveal_video_url | TEXT | — | NO | Full Supabase Storage URL for the creature reveal (Mossy Chest) |
| page_reveal_video_url | TEXT | — | NO | Full Supabase Storage URL for the page unlock reveal (Fairy Door) |
| thumbnail_image_url | TEXT | — | YES | For future theme-picker UI |
| is_active | BOOLEAN | true | NO | |
| sort_order | INTEGER | 0 | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**Seeded in migration:** 1 row (Woodland Felt) with the two video URLs from `reveals-manifest.csv`.

#### `gamification_creatures`
Platform seed — all creatures in every theme. Seeded from the 161-row `woodland-felt-manifest.csv`.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| theme_id | UUID | — | NO | FK → gamification_themes |
| slug | TEXT | — | NO | From manifest filename (without `.png`) |
| display_name | TEXT | — | NO | Manifest `name` column |
| rarity | TEXT | 'common' | NO | CHECK: `common`, `rare`, `legendary` |
| tags | TEXT[] | `'{}'` | NO | Split manifest `tags` column by `\|` |
| description | TEXT | — | YES | Manifest `description` column |
| image_url | TEXT | — | NO | Manifest `image_url` column |
| sort_order | INTEGER | 0 | NO | |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**Constraints:** `UNIQUE (theme_id, slug)`, `CHECK rarity IN ('common', 'rare', 'legendary')`
**Indexes:** `(theme_id, rarity)` for reward-pool queries, `(theme_id, is_active)`
**Seeded:** 161 rows from the Woodland Felt manifest (125 common + 36 rare/legendary per founder note; actual count from the CSV is what we seed)

#### `gamification_sticker_pages`
Platform seed — background scenes that serve as sticker book pages. Seeded from the 26-row `backgrounds-manifest.csv`.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| theme_id | UUID | — | NO | FK → gamification_themes |
| slug | TEXT | — | NO | From manifest filename |
| display_name | TEXT | — | NO | Generated from `scene` column |
| scene | TEXT | — | NO | Manifest `scene` column (e.g., "cherry blossom") |
| season | TEXT | — | YES | Manifest `season` column |
| image_url | TEXT | — | NO | Manifest `url` column |
| sort_order | INTEGER | 0 | NO | Default seed order (1..26) |
| is_active | BOOLEAN | true | NO | |
| created_at | TIMESTAMPTZ | now() | NO | |

**Constraints:** `UNIQUE (theme_id, slug)`
**Indexes:** `(theme_id, sort_order)` for ordered iteration
**Seeded:** 26 rows from backgrounds manifest

### 7.2 New per-member runtime tables

#### `gamification_configs` *(PRD-24 full table, subset used this build)*
One row per family member. Created via trigger on `family_members` INSERT. Per Q2 recommendation, ship the full PRD-24 schema even though we only read ~6 columns this build.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| family_id | UUID | — | NO | FK → families |
| family_member_id | UUID | — | NO | FK → family_members UNIQUE |
| enabled | BOOLEAN | true | NO | Master toggle (defaults: true for Play/Guided, false for Independent/Adult) |
| currency_name | TEXT | 'stars' | NO | |
| currency_icon | TEXT | '⭐' | NO | |
| base_points_per_task | INTEGER | 1 | NO | Play default 1, Guided default 10 (set in auto-provision trigger) |
| bonus_at_three | INTEGER | 3 | NO | *This build reads only the `enabled` + `base_points_per_task` + `currency_name` + `currency_icon`.* Remaining columns are future work. |
| bonus_at_five | INTEGER | 5 | NO | |
| routine_points_mode | TEXT | 'per_step' | NO | CHECK: `per_step`, `on_completion` |
| streak_grace_days | INTEGER | 1 | NO | `0`, `1`, or `2` |
| streak_schedule_aware | BOOLEAN | false | NO | **Override: default false this build** (Q5 — naive streaks) |
| streak_pause_enabled | BOOLEAN | true | NO | |
| streak_paused | BOOLEAN | false | NO | |
| streak_paused_at | TIMESTAMPTZ | — | YES | |
| visualization_mode | TEXT | 'counter' | NO | CHECK per PRD-24 |
| level_thresholds | JSONB | `'[]'` | NO | Future |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**Constraints:** `UNIQUE (family_member_id)`
**Auto-provision:** Extend the `auto_provision_member_resources` trigger to INSERT a default row for every new `family_members` record. Defaults vary by `dashboard_mode` per PRD-24 Cross-PRD Addendum.
**Backfill:** Migration backfills a row for every existing family_member.

#### `member_sticker_book_state`
One row per member. Current active theme, current active page, unlock interval, rarity weights. Created by trigger alongside `gamification_configs` when a member is created.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| family_id | UUID | — | NO | FK → families |
| family_member_id | UUID | — | NO | FK → family_members UNIQUE |
| active_theme_id | UUID | — | NO | FK → gamification_themes (defaults to Woodland Felt at seed) |
| active_page_id | UUID | — | YES | FK → gamification_sticker_pages — the page the kid is currently viewing |
| page_unlock_mode | TEXT | 'every_n_creatures' | NO | CHECK: `every_n_creatures`, `custom_trigger`. `custom_trigger` is future — this build only handles `every_n_creatures`. |
| page_unlock_interval | INTEGER | 7 | NO | Default: every 7 creatures unlocks next page |
| rarity_weights | JSONB | `'{"common": 85, "rare": 12, "legendary": 3}'` | NO | Weights must sum to 100. Simple sanity check constraint. |
| creature_roll_chance_per_task | INTEGER | 40 | NO | Percent chance that any task completion rolls a creature at all (default 40%). Keeps creatures feeling earned, not spammy. |
| is_enabled | BOOLEAN | true | NO | Master toggle — if false, no rolls happen for this member |
| creatures_earned_total | INTEGER | 0 | NO | Denormalized counter (also sum of `member_creature_collection` rows) |
| pages_unlocked_total | INTEGER | 1 | NO | Starts at 1 (first page unlocked by default on bootstrap) |
| created_at | TIMESTAMPTZ | now() | NO | |
| updated_at | TIMESTAMPTZ | now() | NO | |

**Constraints:** `UNIQUE (family_member_id)`, JSONB rarity_weights validation trigger (sum must equal 100)
**Auto-provision:** Extend `auto_provision_member_resources` to also INSERT a `member_sticker_book_state` row with active_theme_id = Woodland Felt.
**Bootstrap rule:** The trigger also inserts ONE row into `member_page_unlocks` for the first sticker page (sort_order=1) so the kid lands on a populated page the first time they open the sticker book. `active_page_id` set to that first page.

#### `member_creature_collection`
Append-only log — one row per creature earned by a member. Allows duplicates (same creature earned multiple times).

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| family_id | UUID | — | NO | FK → families |
| family_member_id | UUID | — | NO | FK → family_members |
| creature_id | UUID | — | NO | FK → gamification_creatures |
| sticker_page_id | UUID | — | YES | FK → gamification_sticker_pages — which page it was placed on |
| position_x | REAL | — | YES | 0.0–1.0 relative position (for future drag-to-reposition) |
| position_y | REAL | — | YES | 0.0–1.0 relative position |
| awarded_source_type | TEXT | — | NO | `task_completion` this build; `practice_mastery_approved` future; `manual_award` for mom-granted future |
| awarded_source_id | UUID | — | YES | FK to `task_completions.id` for this build |
| awarded_at | TIMESTAMPTZ | now() | NO | |

**Indexes:** `(family_member_id, awarded_at DESC)` for recent view, `(family_member_id, sticker_page_id)` for page rendering, `(awarded_source_id)` for idempotency check

#### `member_page_unlocks`
Append-only log — one row per sticker page unlocked.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | `gen_random_uuid()` | NO | PK |
| family_id | UUID | — | NO | FK → families |
| family_member_id | UUID | — | NO | FK → family_members |
| sticker_page_id | UUID | — | NO | FK → gamification_sticker_pages |
| unlocked_at | TIMESTAMPTZ | now() | NO | |
| unlocked_trigger_type | TEXT | 'bootstrap' | NO | `bootstrap`, `creature_count`, `manual_unlock` (future: `streak_milestone`, `task_completion`, `tracker_goal`) |
| creatures_at_unlock | INTEGER | 0 | NO | Denormalized count for analytics |

**Constraints:** `UNIQUE (family_member_id, sticker_page_id)` — a page is unlocked once per member

### 7.3 Altered existing tables

#### `tasks` — add `points_override`
```sql
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS points_override INTEGER CHECK (points_override IS NULL OR points_override >= 0);
```

Per Q4 recommendation — one-column add, avoids a follow-up migration.

#### `tasks.source` CHECK — rebuild adding `'randomizer_reveal'`
Per PRD-26. Even though we're **stubbing** reveal tiles this build, the enum value is added now so the stub can write real data once the tile is built.

```sql
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal'     -- new for PRD-26 (stubbed tile; enum added now)
  ));
```

The `tasks_source_check` constraint has now been rebuilt 7 times across migrations 28, 100023, 100054, 100105, 100110, 100112, and this build. Each rebuild preserves all prior values — the drop/readd pattern is established and working.

### 7.4 Feature key registrations

7 new rows in `feature_key_registry` + tier grants in `feature_access_v2`. `useCanAccess()` returns `true` during beta — this is infrastructure for post-beta tier gating.

| Feature key | Description | PRD | Essential | Enhanced | Full Magic |
|---|---|---|---|---|---|
| `gamification_basic` | Points earning, streak tracking | PRD-24 | ✓ | ✓ | ✓ |
| `gamification_sticker_book` | Sticker book creature collection + page unlocks | This build | ✓ | ✓ | ✓ |
| `play_dashboard` | Play Dashboard layout | PRD-26 | ✓ | ✓ | ✓ |
| `play_reveal_tiles` | Reveal task tiles (STUBBED this build) | PRD-26 | — | ✓ | ✓ |
| `play_reading_support` | Reading Support accommodations (TTS, larger font) | PRD-26 | ✓ | ✓ | ✓ |
| `play_message_receive` | Receive mom's messages on Play dashboard | PRD-26 | ✓ | ✓ | ✓ |
| `gamification_streak_milestones` | Streak milestone bonuses (STUBBED this build) | PRD-24 | — | ✓ | ✓ |

### 7.5 New RPC functions

#### `roll_creature_for_completion(p_task_completion_id UUID) RETURNS JSONB`

Per Q6 recommendation — PostgreSQL RPC is the authoritative gamification pipeline endpoint for this build. SECURITY DEFINER. Owned by `service_role`.

**Inputs:** `p_task_completion_id UUID` — the `task_completions.id` that just fired
**Returns JSONB:**
```json
{
  "points_awarded": 1,
  "new_point_total": 37,
  "creature_awarded": true,
  "creature": { "id": "...", "display_name": "Bowtie Fox", "rarity": "common", "image_url": "..." },
  "page_unlocked": false,
  "page": null,
  "streak_updated": true,
  "new_streak": 3,
  "streak_milestone": null
}
```

**Logic:**

1. **Load context.** Fetch `task_completions` → `tasks` (category, points_override) → `family_members` (dashboard_mode, gamification_points, current_streak, last_task_completion_date) → `gamification_configs` (enabled, base_points_per_task) → `member_sticker_book_state`. If gamification disabled for this member, RETURN empty JSONB.
2. **Idempotency check.** If a `member_creature_collection` row already exists with `awarded_source_id = p_task_completion_id`, skip the creature roll step but still run points + streak (for mom-approved backfills). For Phase A simpler: just skip if already processed. Return the already-awarded result if we can find it.
3. **Filter by completion_type.** If the `task_completions` row has `completion_type = 'practice'`, return empty JSONB (no points, no roll). If `completion_type = 'mastery_submit'`, also return empty (approval pending). Only `complete`, NULL, `mastery_approved` trigger the full pipeline. Per Q8 recommendation.
4. **Calculate points.** `points_override` on the task wins; fallback to `gamification_configs.base_points_per_task`. `UPDATE family_members SET gamification_points = gamification_points + N` atomically.
5. **Update streak (naive).** If `last_task_completion_date IS NULL` → streak = 1. If `last_task_completion_date = CURRENT_DATE` → streak unchanged (not the first task today). If `last_task_completion_date = CURRENT_DATE - 1` → streak + 1. Otherwise → streak = 1 (reset). Update `last_task_completion_date = CURRENT_DATE`. Update `longest_streak` if exceeded.
6. **Roll creature.** Random 1-100. If ≤ `creature_roll_chance_per_task` (default 40), roll passes. Otherwise return without creature.
7. **Pick rarity from weights.** Another random 1-100 against `rarity_weights` JSONB. Result: `common`, `rare`, or `legendary`.
8. **Pick a creature from the theme+rarity pool.** `SELECT * FROM gamification_creatures WHERE theme_id = $X AND rarity = $Y AND is_active = true ORDER BY random() LIMIT 1`. If the rarity tier has no creatures (e.g., theme has 0 legendaries), fall through to the next lower tier.
9. **Write the creature award.** INSERT `member_creature_collection` row with `awarded_source_id = p_task_completion_id`, sticker_page_id = member's `active_page_id`, random `position_x/y` within the page canvas. Increment `member_sticker_book_state.creatures_earned_total`.
10. **Check for page unlock.** If `creatures_earned_total % page_unlock_interval == 0`, find the next locked page (next `sort_order` in `gamification_sticker_pages` where a `member_page_unlocks` row doesn't exist for this member). INSERT the unlock row, increment `pages_unlocked_total`, optionally update `active_page_id` to the new page.
11. **Return JSONB.** The full award payload goes back to the client for modal coordination.

**Error handling:** Any exception rolls back the entire RPC (transactional). Points update, streak update, creature award, and page unlock are atomic — all or nothing.

**Cost to existing callers:** `useCompleteTask` and `useApproveCompletion` each gain one additional `supabase.rpc('roll_creature_for_completion', { p_task_completion_id })` call. The rpc result is returned on the mutation's `onSuccess` data.

### 7.6 Auto-provision trigger extension

The existing `auto_provision_member_resources` trigger runs on `family_members` INSERT. Phase A extends it with:

```sql
-- 1. Insert gamification_configs with shell-appropriate defaults
INSERT INTO public.gamification_configs (
  family_id, family_member_id,
  enabled, base_points_per_task, currency_name, currency_icon,
  -- etc.
) VALUES (
  NEW.family_id, NEW.id,
  CASE WHEN NEW.dashboard_mode IN ('play', 'guided') THEN true ELSE false END,
  CASE WHEN NEW.dashboard_mode = 'play' THEN 1 ELSE 10 END,
  CASE WHEN NEW.dashboard_mode = 'play' THEN 'stars' ELSE 'points' END,
  '⭐',
  -- etc.
);

-- 2. Insert member_sticker_book_state (Woodland Felt default theme)
INSERT INTO public.member_sticker_book_state (
  family_id, family_member_id, active_theme_id
) VALUES (
  NEW.family_id, NEW.id,
  (SELECT id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt')
);

-- 3. Bootstrap first sticker page unlock (sort_order=1) for Woodland Felt
WITH first_page AS (
  SELECT id FROM public.gamification_sticker_pages
  WHERE theme_id = (SELECT id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt')
    AND sort_order = (SELECT MIN(sort_order) FROM public.gamification_sticker_pages
                       WHERE theme_id = (SELECT id FROM public.gamification_themes WHERE theme_slug = 'woodland_felt'))
  LIMIT 1
)
INSERT INTO public.member_page_unlocks (
  family_id, family_member_id, sticker_page_id, unlocked_trigger_type
)
SELECT NEW.family_id, NEW.id, id, 'bootstrap' FROM first_page;

-- 4. Set active_page_id on the state row to the bootstrapped page
UPDATE public.member_sticker_book_state
  SET active_page_id = (SELECT sticker_page_id FROM public.member_page_unlocks
                         WHERE family_member_id = NEW.id ORDER BY unlocked_at LIMIT 1)
  WHERE family_member_id = NEW.id;
```

**Backfill:** A one-shot backfill query in the migration runs the same 4 steps for every existing `family_members` row that doesn't already have these rows. Idempotent via `ON CONFLICT DO NOTHING` / `NOT EXISTS` guards.

### 7.7 Row-level security

All 6 new tables need RLS:

- **Platform tables** (`gamification_themes`, `gamification_creatures`, `gamification_sticker_pages`): authenticated read, service-role-only write. No family scoping — they're global seed data.
- **Member runtime tables** (`gamification_configs`, `member_sticker_book_state`, `member_creature_collection`, `member_page_unlocks`):
  - Mom reads/writes her own family (`family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())`)
  - Each member reads their own row (`family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())`)
  - Special Adults read assigned children's rows when on shift (future — defer the special adult policy to later build)
  - Dad reads children's rows only when permitted (defer)

RLS tested against all 5 roles per convention #3 before merge. Updates `RLS-VERIFICATION.md`.

---

## 8. Play Dashboard Rendering Architecture

Per Q9 recommendation — mirror the Guided pattern exactly.

```
Dashboard.tsx (existing)
├── if (dashboard_mode === 'guided' && !isViewAsOverlay) → <GuidedDashboard />
├── if (dashboard_mode === 'play' && !isViewAsOverlay)   → <PlayDashboard />     ← NEW
└── else → existing data-driven adult render
```

### `PlayDashboard.tsx` (new page component)

**Sections (in order, rendered inside PlayShell's `children`):**

1. **Header** (always rendered, mom can't hide)
   - Giant child name: "Hi Ruthie!" with waving hand + sparkle
   - Star count + streak count as large pills (reading from `family_members.gamification_points` + `current_streak`)
   - Today's task count line: "Today you have 4 things to do!" (or "You did everything today! Amazing!" / "Today is a free day! Have fun!")
   - Optional Reading Support mini-label if enabled
2. **Task Tile Grid** (always rendered)
   - 2 columns on phone, 3-4 on tablet
   - Each tile: large emoji, task title, star value
   - Completed tiles shift to bottom with checkmark overlay + dimmed opacity
   - Pending-approval tiles show "Waiting for Mom ⏳"
   - One-tap completion → fires `useCompleteTask` → triggers gamification RPC → if creature awarded, opens `CreatureRevealModal` → if page unlocked, chains to `PageUnlockRevealModal` after modal close
   - **Routine tiles:** tap opens step-by-step view (basic rendering reusing existing `GuidedDashboard` patterns)
   - **Reveal task tiles: STUB this build.** A `PlannedExpansionCard` inline entry for each Randomizer list configured for this child in `preferences.reveal_tiles`. "Surprise tiles coming soon!" message. No animation.
3. **Sticker Book Widget (NEW, always rendered when gamification enabled)**
   - Large card spanning 2 columns
   - Shows: theme name, current active page thumbnail (pulling from `member_sticker_book_state.active_page_id` → `gamification_sticker_pages.image_url`), creature count ("You have 12 creatures!"), "new creature" badge with `BreathingGlow` when a creature was awarded today
   - Tap → opens `StickerBookDetailModal` full-screen
4. **Mom's Message Card** (PRD-15 integration — receive-only)
   - If mom has sent a message and it's unread, show inline
   - [✓ Got it] button dismisses
   - **Stub this build** if PRD-15 messaging isn't wired for Play yet. Use `PlannedExpansionCard`.
5. **Widget Grid** (reuse existing `DashboardGrid` component with Play shell tokens)
   - Renders whatever widgets mom has deployed (`useWidgets` hook — already exists)
   - **No edit mode** — Play members cannot add/remove/move widgets
6. **Celebrate! button** — already in PlayShell, not rendered by PlayDashboard
7. **Bottom nav** — already in PlayShell, not rendered by PlayDashboard

### `PlayDashboard.tsx` file layout (no code yet, just structure)

```
src/pages/PlayDashboard.tsx
  ├── imports (useFamilyMember, useFamily, useTasks, useCompleteTask,
  │            useStickerBookState, useStickerPages, usePlayMessages stub,
  │            PlayTaskTile, PlayStickerBookWidget, CreatureRevealModal,
  │            PageUnlockRevealModal, etc.)
  ├── PlayDashboard() component
  │   ├── query hooks (tasks, sticker book state, family_member, current page image)
  │   ├── state (modal queue: creatures_awarded_today, page_unlocks_pending)
  │   ├── on task complete → extract award from mutation result → push to queue
  │   ├── render header (big name + points + streak + task count)
  │   ├── render task tile grid (map over today's tasks, split completed/pending)
  │   ├── render sticker book widget
  │   ├── render mom messages stub
  │   ├── render widget grid (<DashboardGrid> with play shell tokens)
  │   └── render modal queue (CreatureRevealModal + PageUnlockRevealModal, sequential)
  └── export default PlayDashboard
```

### `PlayTaskTile.tsx` (new component)

Self-contained tile. Accepts `task`, `onComplete`. Handles:
- Rendering (big emoji, title, star value)
- Tap → `useCompleteTask({...})` → on success, fires confetti burst and passes award result up to parent
- Completed state (checkmark + dim)
- Pending approval state
- Reading Support TTS icon when enabled

### Modal queue pattern

When a task completes, the gamification RPC might return:
- Just points (no creature) → no modal, just the standard confetti burst + points popup
- Points + creature → open `CreatureRevealModal` (Mossy Chest video + reveal card)
- Points + creature + page unlock → `CreatureRevealModal` first, then `PageUnlockRevealModal` chains after close

`PlayDashboard.tsx` maintains a small queue state:

```typescript
const [revealQueue, setRevealQueue] = useState<RevealEvent[]>([])

// On task completion result:
if (result.creature_awarded) revealQueue.push({ type: 'creature', creature: result.creature })
if (result.page_unlocked)    revealQueue.push({ type: 'page_unlock', page: result.page })

// Modal watches revealQueue[0]; closing a modal shifts the queue.
```

Sequential playback — no two modals at once.

---

## 9. Phased Build Plan

Six sub-phases. Each ends at a `tsc -b` clean checkpoint. Each has its own review moment with the founder if desired.

### Sub-phase A: Foundation (migration + seeds + feature keys + RPC skeleton)

**Scope:** everything in Section 7 of this plan. One migration file.

**Migration file:** `00000000100115_play_dashboard_sticker_book.sql`

**Contents:**
1. CREATE `gamification_themes` + RLS + indexes
2. CREATE `gamification_creatures` + RLS + indexes + check constraints
3. CREATE `gamification_sticker_pages` + RLS + indexes
4. CREATE `gamification_configs` (full PRD-24 schema) + RLS + trigger for `updated_at`
5. CREATE `member_sticker_book_state` + RLS + rarity_weights sanity check trigger
6. CREATE `member_creature_collection` + RLS + indexes
7. CREATE `member_page_unlocks` + RLS + UNIQUE constraint
8. ALTER `tasks` ADD COLUMN `points_override`
9. ALTER `tasks` CHECK constraint drop/readd with `'randomizer_reveal'`
10. INSERT 1 `gamification_themes` row (Woodland Felt with the two reveal video URLs)
11. INSERT 161 `gamification_creatures` rows (seed from CSV via `COPY FROM` or inline values — see below)
12. INSERT 26 `gamification_sticker_pages` rows (same approach)
13. CREATE `roll_creature_for_completion` RPC function (SECURITY DEFINER)
14. ALTER `auto_provision_member_resources` trigger function to add steps 1–4 from §7.6
15. Backfill query: run the extended provisioning for all existing `family_members` rows (idempotent via NOT EXISTS guards)
16. INSERT 7 feature keys into `feature_key_registry` + 35 `feature_access_v2` rows (7 keys × 5 role groups)

**CSV seed approach:**
- Manifest CSVs live on branch `manus/woodland-felt-manifest`. **Merge that branch to main before this migration runs.**
- Two options for getting 161+26 rows into the migration:
  - **Option 1 (recommended):** Inline VALUES — parse the CSV locally, generate a big `INSERT ... VALUES (...), (...), ...` block in the migration. 161 lines of creature inserts is ugly but idempotent, re-runnable, works in any environment, and doesn't depend on files being present at migration time.
  - **Option 2:** A Node.js data migration script that reads the CSV and calls `supabase.from().insert()`. Cleaner code but not idempotent in Supabase's migration framework, and runs separately from `supabase db push`.
- Option 1 is the project convention. Every other seed in the codebase (38 themes, 32 reflection prompts, 20 morning insight questions) is inline VALUES. Stick with it.

**Hooks/providers:** none yet (Sub-phase B)

**Components:** none yet (Sub-phase B)

**Wires into existing code:** extends `auto_provision_member_resources` trigger. Does NOT touch `useCompleteTask` yet (Sub-phase C).

**Stubs:** Phase A itself produces zero stubs — it's pure infrastructure.

**Verification:**
- Apply migration to local Supabase
- Query: `SELECT count(*) FROM gamification_creatures` → 161
- Query: `SELECT count(*) FROM gamification_sticker_pages` → 26
- Query: `SELECT count(*) FROM gamification_configs` → equal to total `family_members` count (backfill worked)
- Query: `SELECT count(*) FROM member_sticker_book_state` → same count
- Query: `SELECT count(*) FROM member_page_unlocks WHERE unlocked_trigger_type = 'bootstrap'` → same count
- RLS tested against all 5 roles
- `tsc -b` zero errors (no TypeScript changes yet, should be a no-op)

**Deliverables:** migration file + a short data audit dump (row counts) in the sub-phase report.

---

### Sub-phase B: Play Dashboard shell — structure without gamification

**Scope:** Build the Play Dashboard page component with task tiles and widget grid rendering. Points/streak/creature reveal are STILL stubs at this point — the dashboard renders real data but the gamification pipeline isn't wired.

**New types:** `src/types/play-dashboard.ts` — interfaces for reveal_tile config JSON, modal queue events, etc.

**New hooks:**
- `useStickerBookState(familyMemberId)` — reads `member_sticker_book_state` + joined `gamification_sticker_pages` for the active page image. Returns `null` when gamification is disabled.
- `useCreaturesForMember(familyMemberId)` — reads `member_creature_collection` + joined `gamification_creatures`. Returns grouped by `sticker_page_id` for the sticker book detail modal.
- `useMemberPageUnlocks(familyMemberId)` — reads `member_page_unlocks` + joined pages. Ordered by `unlocked_at`.

**New components:**
- `src/pages/PlayDashboard.tsx` — the main page component (§8 above)
- `src/components/play-dashboard/PlayDashboardHeader.tsx` — greeting + points/streak/count
- `src/components/play-dashboard/PlayTaskTile.tsx` — the big tile
- `src/components/play-dashboard/PlayTaskTileGrid.tsx` — the grid layout wrapper, separates pending from completed, sorts by `sort_order`
- `src/components/play-dashboard/PlayStickerBookWidget.tsx` — large 2-col card showing active page thumbnail + creature count + BreathingGlow
- `src/components/play-dashboard/PlayRevealTileStub.tsx` — `PlannedExpansionCard` wrapper for reveal tiles (STUB)
- `src/components/play-dashboard/PlayMomMessageStub.tsx` — `PlannedExpansionCard` wrapper for mom messages (STUB until PRD-15 hookup)

**Wires into existing code:**
- `src/pages/Dashboard.tsx` — add the `play` branch:
  ```tsx
  if (displayMember?.dashboard_mode === 'play' && !isViewAsOverlay) {
    return <PlayDashboard memberId={displayMember.id} familyId={family.id} />
  }
  ```
- `src/components/shells/PlayShell.tsx` — fix bottom nav label "Play" → "Fun" per PRD-26 (one-line change)

**Stubs:**
- Reveal tiles (`play_reveal_tiles` feature key) — `PlayRevealTileStub` component documented in `STUB_REGISTRY.md`
- Mom message card (`play_message_receive` feature key) — `PlayMomMessageStub` component
- Reading Support (TTS on tiles) — props exist but implementation is "add `aria-label` + hidden Volume2 button"; no actual TTS playback yet (deferred)
- Routine step-by-step view — tap on a routine tile opens a minimal modal showing steps; complete logic reuses existing routine hooks. If this gets too big, defer to Sub-phase C and stub as "tap to complete the whole routine at once" for Sub-phase B.
- Graduation flow (Play → Guided) — entirely deferred

**Verification:**
- Open `/dashboard` as a Play member in dev → PlayDashboard renders with real tiles from the database
- Tap a tile → task completes (`useCompleteTask` still unmodified at this phase) → normal confetti burst from existing PRD-11 infrastructure
- Sticker book widget shows active page thumbnail + creature count 0
- DevTools mobile viewport 375px → tiles are 2 columns, sized appropriately for touch targets
- `tsc -b` zero errors
- Playwright: smoke test that logs in as a Play member and confirms `PlayDashboard` renders

**Deliverables:** ~8 new files, one small edit to Dashboard.tsx, one small edit to PlayShell.tsx. Total ~600–800 lines.

---

### Sub-phase C: Gamification write path wiring

**Scope:** connect `useCompleteTask` and `useApproveCompletion` to the `roll_creature_for_completion` RPC. Phase A built the RPC; Phase C calls it.

**Hook changes:**
- `useTasks.ts:208-271` — extend `useCompleteTask` mutation:
  1. Existing: INSERT `task_completions` row
  2. Existing: UPDATE `tasks.status`
  3. **NEW:** `supabase.rpc('roll_creature_for_completion', { p_task_completion_id: completion.id })`
  4. **NEW:** Return `{ completion, task, gamificationResult }` instead of `{ completion, task }`
  5. **NEW:** `onSuccess` invalidates `['family-member', memberId]` query so the header re-queries `gamification_points` + `current_streak`
- `useTaskCompletions.ts:132-176` — extend `useApproveCompletion` similarly. The RPC is idempotency-safe — if the approval is re-firing and a creature was already awarded for this completion, it returns the existing award.

**New hook:**
- `src/hooks/useFamilyMemberGamification.ts` — thin wrapper hook that re-reads `family_members` columns (points, streak) as a short-interval polling or on-demand refetch. Actually simpler: just invalidate `family-member` in `useCompleteTask.onSuccess` — the existing `useFamilyMember` hook re-reads from `family_members`. No new hook needed.

**New types:**
- `GamificationResult` interface in `src/types/gamification.ts` — mirrors the JSONB shape the RPC returns

**Wires into existing code:**
- `src/components/shared/ConfettiBurst.tsx` is reused as-is
- `src/components/play-dashboard/PlayTaskTile.tsx` (built in Sub-phase B) is updated to read `data.gamificationResult` from the mutation result and push award events to the parent's modal queue

**Stubs remaining:**
- `DailyCelebration` Step 3 (streak milestone) — still auto-skipped. The data is flowing now but the celebration render isn't wired.
- `DailyCelebration` Step 4 (points summary + creature reveal) — still auto-skipped.
- Practice/mastery write path — per Q8 recommendation, practice sessions do NOT trigger the pipeline. Mastery approval triggers it through the existing `useApproveCompletion` path. Document this in `CLAUDE.md`.
- Task UNMARK cascade (PRD-02 stub) — **explicitly deferred.** When a task completion is un-completed, points aren't deducted, creature isn't removed. Flag in `STUB_REGISTRY.md` as known limitation. The PRD says this cascade is required, but baby step can ship without it — mom can manually adjust.

**Verification:**
- Playwright: log in as a Play member, complete a task, verify `family_members.gamification_points` incremented by 1 (or by `tasks.points_override` if set)
- Repeat: complete enough tasks that a creature rolls (with `creature_roll_chance_per_task = 40`, statistically within 5 tasks)
- Verify `member_creature_collection` has a new row linked to the completion
- Complete enough to hit page unlock (7 creatures) → verify `member_page_unlocks` has a second row
- Complete a practice session via `useLogPractice` → verify `gamification_points` did NOT increment
- Run `tsc -b` zero errors

**Deliverables:** ~2 hook edits, 1 new type, 1 RPC call, updated test fixtures. Small surgical change.

---

### Sub-phase D: Sticker Book UI (widget + detail modal + reveal modals)

**Scope:** the visible gamification experience. Reveal modals play the two Manus videos. Detail modal renders the full creature collection on the current page.

**New components:**
- `src/components/sticker-book/CreatureRevealModal.tsx`
  - Full-screen `ModalV2` (size='full')
  - Plays `gamification_themes.creature_reveal_video_url` (Mossy Chest) as `<video playsinline muted>` with poster frame
  - Video plays for its full duration (~3-5s)
  - At the video's last 0.5s, the creature card slides in from bottom with the creature's name, rarity badge, description, image
  - `SparkleOverlay` runs during + after the video
  - `ConfettiBurst intensity='maximum'` on entrance
  - Auto-dismiss after 6s OR explicit tap
  - `onClose` callback to chain into the next modal in the queue
- `src/components/sticker-book/PageUnlockRevealModal.tsx`
  - Same structure as CreatureRevealModal but plays `page_reveal_video_url` (Fairy Door)
  - Reveal card shows the new page thumbnail + scene name
  - Message: "You unlocked [scene name]! 🌟"
  - Button: "See my new page!" → closes modal, scrolls sticker book widget into view, opens `StickerBookDetailModal` to the new page
- `src/components/sticker-book/StickerBookDetailModal.tsx`
  - Full-screen ModalV2 showing the active page image as background
  - Absolutely-positioned creature images at their stored `position_x / position_y`
  - Header: theme name, page name, creature count on this page
  - Top tabs: "Current page" / "All pages" (renders `useMemberPageUnlocks` list; tapping a page switches the active view)
  - For MVP, no drag-to-reposition — creatures are placed where the RPC put them
  - For MVP, mom's management UI is minimal (defer to Sub-phase F)
  - Close button returns to Play Dashboard
- `src/components/sticker-book/StickerOverlay.tsx`
  - Renders a single creature image at its relative position
  - Standard width (e.g., 8% of page width), maintains aspect ratio

**Wires into existing code:**
- `PlayDashboard.tsx` modal queue state pushes creature + page unlock events onto the queue
- Clicking the `PlayStickerBookWidget` opens `StickerBookDetailModal` directly (without reveal)
- `PlayTaskTile` tap → `useCompleteTask` → modal queue populated if awards returned

**Stubs remaining:**
- Drag-to-reposition (Q10 Phase 2)
- Per-page creature filtering / search (the sticker book just shows all creatures on the page)
- Sharing sticker book pages (future social feature)

**Verification:**
- Play the reveal videos in the browser — confirm `<video>` playback, poster frame, no autoplay issues
- On iOS Safari (the target for tablet kids), test that `playsinline muted` prevents full-screen video hijack
- Complete enough tasks to trigger a creature reveal → modal plays → close → verify creature is in `StickerBookDetailModal`
- Complete enough to hit a page unlock → verify `CreatureRevealModal` closes → `PageUnlockRevealModal` opens automatically
- `tsc -b` zero errors
- `npm run check:colors` zero hardcoded colors

**Deliverables:** 4 new components + `useStickerBookState` / `useCreaturesForMember` hook refinements. ~500-800 lines.

---

### Sub-phase E: Minimal Mom Management

**Scope:** the smallest possible mom-facing configuration surface. Defaults handle everything so this phase is quick — just enough to flip features on/off and tune a few numbers.

**New screen:** `src/components/settings/GamificationStickerBookSettings.tsx`
- Lives inside the existing Settings overlay (PRD-22) at Family Members → [Child] → Gamification
- Sections:
  - **Master toggle:** Enable gamification for [Name] (reads `gamification_configs.enabled`, writes back)
  - **Sticker Book toggle:** Enable sticker book (reads `member_sticker_book_state.is_enabled`, writes back)
  - **Points per task:** number input (default 1 for Play, reads `gamification_configs.base_points_per_task`)
  - **Page unlock interval:** number input "Unlock a new page every __ creatures" (default 7, reads `member_sticker_book_state.page_unlock_interval`)
  - **Reset sticker book:** button with confirmation dialog — deletes all `member_creature_collection` + `member_page_unlocks` (except bootstrap row) for this member. Used when mom wants a fresh start.

**Not shipped this phase (deferred to future builds):**
- Currency name + icon customization (PRD-24 Screen 8 Section B)
- Level thresholds customization (PRD-24 Screen 8 Section E)
- Reveal visual picker (PRD-24 Screen 8 Section I — nothing to pick this build since only two videos exist)
- Per-theme selection (only Woodland Felt exists)
- Custom page unlock triggers (PRD override #2 — schema supports but UI defers)
- **Sticker book page curation UI (mom-facing)** — browsing page thumbnails, picking which of the 26 Woodland Felt scenes to include, dragging to set unlock order. **This is the "mom feels invested in what the kids are unlocking" experience the founder called out.** Flagged as a known gap in §0 and accepted without scope change. Auto-default (all 26 pages in manifest order) means everything works without mom touching anything; the invested-mom experience ships in a follow-up build. STUB_REGISTRY entry required.
- Per-creature filtering / exclusion

**Wires into existing code:**
- Add "Gamification" to the existing Settings overlay category navigation under Family Members (hook into the existing `src/components/settings/` infrastructure)

**Stubs:**
- All deferred features in the "Not shipped" list above stub with `PlannedExpansionCard` sections within the settings screen

**Verification:**
- Navigate: Settings → Family Members → [Play child] → Gamification → settings render
- Toggle gamification off → Play Dashboard re-renders without sticker book widget, star counts hidden
- Toggle back on → everything returns
- Change points-per-task to 3 → complete a task → confirm points incremented by 3
- Change unlock interval to 3 → earn 3 creatures → confirm page unlocked
- Reset button → confirm `member_creature_collection` cleared
- `tsc -b` zero errors

**Deliverables:** 1 new settings screen. ~200-300 lines.

---

### Sub-phase F: Verification + documentation

**Scope:** the post-build checklist per PRE_BUILD_PROCESS.md.

1. **Post-build PRD verification table** in the feature decision file. Every requirement from Section 9 of this plan → Wired / Stubbed / Missing
2. **STUB_REGISTRY.md** — register all new stubs:
   - Reveal task tiles (PRD-26)
   - Mom message card (PRD-26 + PRD-15)
   - DailyCelebration Step 3 (streak display)
   - DailyCelebration Step 4 (overlay reveal)
   - Task unmark cascade (PRD-02)
   - Drag-to-reposition creatures
   - Per-page custom unlock triggers
   - Currency customization UI
   - Reveal visual picker
   - Multi-theme support
   - Practice sessions earning points (explicit "never" decision)
   - Schedule-aware streaks
   - Treasure box, reward menu, leaderboard (entire systems deferred)
   - Graduation flow
3. **CLAUDE.md additions** — conventions introduced by this build:
   - Sticker book is the gamification mechanic for Play shell. Creature collection + page unlocks replace the PRD-24A stage progression concept. Creatures and pages are both reward types that ANY trigger can produce.
   - `roll_creature_for_completion` RPC is the authoritative gamification pipeline endpoint. All task completion writes route through it. Idempotency-safe by `awarded_source_id`.
   - Mossy Chest reveal = creature reward. Fairy Door reveal = page unlock reward. Hardcoded mapping per-theme via `gamification_themes.creature_reveal_video_url` + `page_reveal_video_url`.
   - Practice sessions (Build J) do NOT earn points or trigger creature rolls. Only `completion_type='complete'` or `'mastery_approved'` do.
   - Streaks are naive consecutive-day for the baby step (NOT PRD-24 schedule-aware). Document the upgrade path.
   - Play Dashboard auto-places creatures on the active page at award time. Drag-to-reposition is schema-supported but UI-deferred.
   - `tasks.points_override` overrides `gamification_configs.base_points_per_task` per task.
   - Rarity weights are per-member with a sane default (`{"common": 85, "rare": 12, "legendary": 3}`). Config exists but mom UI is deferred.
4. **`claude/database_schema.md`** — add all 6 new tables + altered columns
5. **`WIRING_STATUS.md`** — add new rows for creature reveal route, page unlock route, points pipeline route
6. **`CURRENT_BUILD.md`** — copy verification results into this file, then reset to IDLE
7. **`claude/feature-decisions/README.md`** — add the new feature decision file to the index
8. **Mobile/desktop nav parity check** — PlayDashboard isn't a top-level nav entry so this doesn't strictly apply, but verify the Play bottom nav reads "Home / Tasks / Stars / Fun" per PRD-26
9. **`npx tsc -b` zero errors** — final check
10. **`npm run check:colors` zero hardcoded colors** in all new files
11. **Visual verification** — open the app, complete tasks as a Play member, watch the reveal videos play, verify the sticker book widget updates

---

## 10. Stubs Created by This Build (Register in STUB_REGISTRY.md)

| Stub | Wires To | Future PRD/Build |
|---|---|---|
| Play Dashboard reveal task tiles | `PlayRevealTileStub` component | PRD-26 follow-up build |
| Play Dashboard mom's message card | `PlayMomMessageStub` component | PRD-15 Play integration |
| Reading Support TTS playback on tiles | `aria-label` + hidden Volume2 button present but no actual TTS | Post-MVP |
| DailyCelebration Step 3 — streak milestone display | Step 3 still auto-skipped in `DailyCelebration.tsx` | Future gamification build |
| DailyCelebration Step 4 — points summary + creature reveal | Step 4 still auto-skipped | Future gamification build |
| Task unmark reward cascade | No reverse pipeline when a completion is undone | PRD-02 stub remains |
| Drag-to-reposition creatures on sticker book pages | `position_x/y` columns exist; UI is static | Phase 2 enhancement |
| Per-page custom unlock triggers | `page_unlock_mode='custom_trigger'` CHECK constraint exists but logic is unimplemented | Later build |
| Currency customization UI (name, icon) | `gamification_configs.currency_name/icon` columns exist but no UI | Future Settings build |
| Reveal visual picker | `gamification_configs.reveal_visual_default` not used | Future — waits for 8-type Reveal Library |
| Multi-theme selection UI | Schema supports N themes but only 1 seeded | Future theme content build |
| Practice sessions earning points | Explicit "no" design decision — documented convention | Never (design decision) |
| Schedule-aware streak calculation | `gamification_configs.streak_schedule_aware = false` default | Future build when needed |
| Treasure box system | No tables, no widget, no reveal modal | Future gamification build |
| Reward menu + redemption | No tables, no Screen 3, no PRD-15 request creation | Future gamification build |
| Family Leaderboard | No widget | Future gamification build |
| Play → Guided graduation celebration + tutorial | Not implemented | Post-MVP |
| Play calendar section | Per PRD-26 Post-MVP decision | Post-MVP |
| `gamification_events` append-only ledger | Not created this build | Future when reward redemption needs history |
| `gamification_daily_summaries` daily rollup | Not created this build | Future when DailyCelebration Step 3/4 gets wired |
| `gamification_achievements` badges | Not created this build | Future badge catalog build |
| **Sticker book page curation UI (mom-facing)** — browse thumbnails, pick pages, set unlock order | `member_sticker_book_state.active_theme_id` + `gamification_sticker_pages.sort_order` both exist but no mom UI to customize them | Follow-up build after the baby step ships (founder priority for "mom feels invested" experience) |

---

## 11. Stubs This Build Resolves

| Existing Stub | Where It Was | How This Build Fills It |
|---|---|---|
| Play Dashboard (PRD-14 Screen 5 placeholder) | PRD-14 notes "Screen 5 Play stub" | Superseded by new `PlayDashboard.tsx` |
| Play shell "Stars" bottom nav → some stub page | PRD-26 Screen 1 mention | Routes to `/victories` which already uses `GuidedVictories` for Play shell today. Unchanged this build. |
| Play shell "Fun" bottom nav → some stub page | PRD-26 Screen 1 mention | Routes to `/rewards` which is currently a placeholder. **Remains a stub this build** — reward menu deferred. |
| `family_members.gamification_points` always 0 | Migration 00000000000001 created the column but no writer exists | Now written by `roll_creature_for_completion` RPC on every task completion |
| `family_members.current_streak` / `last_task_completion_date` | Same — columns exist, no writer | Now written by the same RPC |
| Sticker book / creature collectibles mentioned in founder intent | No PRD, no code | Ships as the core gamification mechanic |
| `gamification_configs` referenced by PRD-24 but never created | Table doesn't exist in live DB | Created in Phase A per full PRD-24 spec |

---

## 12. File Inventory (What Gets Written)

### New migration
- `supabase/migrations/00000000100115_play_dashboard_sticker_book.sql`

### New types
- `src/types/gamification.ts` — `GamificationConfig`, `StickerBookState`, `Creature`, `StickerPage`, `CreatureCollection`, `PageUnlock`, `GamificationResult`, `RarityWeights`
- `src/types/play-dashboard.ts` — `PlayDashboardProps`, `RevealEvent` (for modal queue), `PlayTaskTileProps`

### New hooks
- `src/hooks/useStickerBookState.ts` — reads `member_sticker_book_state` + active page
- `src/hooks/useCreaturesForMember.ts` — reads `member_creature_collection` + joined creatures
- `src/hooks/useMemberPageUnlocks.ts` — reads `member_page_unlocks` + joined pages
- `src/hooks/useStickerBookSettings.ts` — mutations for the Mom settings screen (toggle, change interval, reset)

### Modified hooks
- `src/hooks/useTasks.ts` — `useCompleteTask` adds RPC call + returns `gamificationResult` (Sub-phase C)
- `src/hooks/useTaskCompletions.ts` — `useApproveCompletion` adds same RPC call

### New page
- `src/pages/PlayDashboard.tsx`

### Modified pages
- `src/pages/Dashboard.tsx` — add `play` branch

### New components
- `src/components/play-dashboard/PlayDashboardHeader.tsx`
- `src/components/play-dashboard/PlayTaskTile.tsx`
- `src/components/play-dashboard/PlayTaskTileGrid.tsx`
- `src/components/play-dashboard/PlayStickerBookWidget.tsx`
- `src/components/play-dashboard/PlayRevealTileStub.tsx`
- `src/components/play-dashboard/PlayMomMessageStub.tsx`
- `src/components/sticker-book/CreatureRevealModal.tsx`
- `src/components/sticker-book/PageUnlockRevealModal.tsx`
- `src/components/sticker-book/StickerBookDetailModal.tsx`
- `src/components/sticker-book/StickerOverlay.tsx`
- `src/components/settings/GamificationStickerBookSettings.tsx`

### Modified components
- `src/components/shells/PlayShell.tsx` — one-line bottom nav label fix ("Play" → "Fun")
- `src/components/settings/[SettingsOverlay or whatever the root is].tsx` — add "Gamification" category entry for Play children

### New utilities
- `src/lib/sticker-book/rarityRoll.ts` — *not needed if the RPC does all the rolling server-side.* Only needed if any client-side preview is required.
- `src/lib/sticker-book/placementRandom.ts` — *not needed if the RPC generates `position_x/y` server-side.*

### Tests
- `tests/e2e/features/play-dashboard-sticker-book.spec.ts` — Playwright suite
  - Log in as Play member, render PlayDashboard
  - Complete a task, confirm points incremented
  - Complete enough to award a creature, confirm reveal modal plays
  - Complete enough to trigger a page unlock, confirm second modal plays
  - Practice completion does NOT award points
  - Mom toggles gamification off, confirm sticker book widget hidden

### Files touched for post-build bookkeeping
- `CLAUDE.md`
- `STUB_REGISTRY.md`
- `WIRING_STATUS.md`
- `BUILD_STATUS.md`
- `claude/database_schema.md`
- `claude/feature-decisions/README.md`
- `CURRENT_BUILD.md`
- `RLS-VERIFICATION.md`
- `claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md` — the real feature decision file (this doc is the plan draft)

**Total new files:** ~19 code files + 1 migration + 1 feature decision file = **~21 new files**
**Total modified files:** ~8 existing files

---

## 13. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CSV seed approach (161+26 rows inline VALUES) produces a huge migration file | High | Low | Accept it. Prior seed migrations already do this (32 reflection prompts, 20 morning insights, 38 themes). File readability is OK. |
| Manus's reveal video descriptions conflict with founder intent | Certain | Medium | Section 3 Q1 asks for founder confirmation. Recommend: follow founder intent; update Manus CSV descriptions before merge. |
| `roll_creature_for_completion` RPC performance | Low | Medium | Single task completion → 1 rpc call → ~8 DB queries total. Indexed paths. Should be < 50ms. If it becomes hot, add an index later. |
| Idempotency bug: creature awarded twice for same completion | Medium | Medium | RPC checks for existing `member_creature_collection WHERE awarded_source_id = p_task_completion_id` before inserting. Mandatory test case. |
| Video autoplay blocked on iOS Safari / embedded webviews | Medium | High | `playsinline muted` is the standard fix and is already used in DailyCelebration. Test on iOS Safari before ship. Have a static poster frame as fallback. |
| Points/streak writes race with task completion writes | Low | Low | Both happen inside the same mutation `mutationFn`. If the RPC fails after the task is updated, we have an inconsistent state — but the points update is additive, not destructive. Log the error to Sentry/console and move on. |
| `tasks.source` enum rebuild fails because an existing row has a value not in the new list | Very low | High | Sanity-check query in the migration: `SELECT DISTINCT source FROM tasks` before running the ALTER. If any orphan values, fix them first. Convention is well-established; this has never failed across the 6 previous rebuilds. |
| Backfill of `gamification_configs` + `member_sticker_book_state` for all existing members takes too long | Low | Low | Family member count is in the low hundreds. Single insert per row. Seconds, not minutes. |
| Naive streak logic bites us when a family member's tasks are genuinely MWF-only | Medium | Low | Explicit design decision; documented as known limitation in STUB_REGISTRY. Schedule-aware upgrade path exists via `streak_schedule_aware` column already in schema. |
| Mom sees the CreatureRevealModal every time a Play kid completes a task — it becomes annoying fast | Medium | Medium | `creature_roll_chance_per_task = 40` means ~60% of completions have no reveal at all. Tune post-launch if needed. |
| Rarity weights produce almost no rare/legendary rolls, making them feel unreachable | Low | Low | Default weights (85/12/3) statistically yield ~3 rare per 25 rolls. Tune later if founder feedback says otherwise. |
| Sticker page image loading stalls the dashboard | Low | Low | Images are in a public Supabase Storage bucket with CDN. Size: ~100-500KB per page. Pre-load the active page image on dashboard mount. |
| The `auto_provision_member_resources` trigger extension breaks existing onboarding | Medium | High | Test against a fresh family + fresh member creation in a local branch before merging. Backfill query handles any rows that slip through. |
| Feature key grants wrong tier levels | Low | Low | All tiers get every feature during beta anyway — `useCanAccess` stubs `true`. Wrong values are harmless until tier gating is real. Fix in a follow-up migration. |

---

## 14. Acceptance Criteria — SATISFIED 2026-04-07

All 16 acceptance criteria were answered in founder sign-off (see §0 at the top of this document). Original checklist preserved for audit trail.

- [x] **Q1:** Mossy Chest = creature, Fairy Door = page unlock. **Manus CSV descriptions must be amended before merge** — see §15 below.
- [x] **Q2:** Full PRD-24 `gamification_configs` table (Option A)
- [x] **Q3:** Per-member rarity weights with default seed (Option B)
- [x] **Q4:** Add `tasks.points_override` now (Option C)
- [x] **Q5:** Naive streak with documented simplification (Option B)
- [x] **Q6:** Server-side RPC (Option B)
- [x] **Q7:** Edit `useCompleteTask` directly (Option A)
- [x] **Q8:** Practice sessions never earn points (Option C)
- [x] **Q9:** Mirror the Guided branch pattern (Option A)
- [x] **Q10:** Auto-place with schema for future repositioning (Option C, shipped as A)
- [x] **Reveal tiles deferred** — ✅ confirmed
- [x] **Mom's Message card stubbed** — ✅ confirmed
- [x] **DailyCelebration Step 3/4 auto-skipped** — ✅ confirmed
- [x] **No treasure box / reward menu / leaderboard / 8-reveal library** — ✅ confirmed
- [x] **Manus branch merge approved** — pending only the CSV amendment below
- [x] **Phase boundary approval** — 6 sub-phases A→B→C→D→E→F, each with a `tsc -b` checkpoint

**Next actions (in order):**
1. Amend Manus branch per §15 below
2. Merge `manus/woodland-felt-manifest` to main
3. Convert this PLAN doc to the real feature decision file at `claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md`
4. Populate `CURRENT_BUILD.md` with the finalized pre-build summary
5. Begin Sub-phase A (migration writing)

---

## 15. Pre-Build Blocker — Manus Branch CSV Amendment

**Before** `manus/woodland-felt-manifest` can be merged to main, the reveal CSV must be corrected to match the founder's actual reward mapping. Without this amendment, the Phase A migration will seed `gamification_themes` with reveal video URLs pointing at videos that don't match the descriptions, which will confuse every future content sprint.

### 15.1 What needs to change

File: `assets/gamification/woodland-felt/reveals-manifest.csv`

**Current (wrong) rows:**

```csv
filename,type,description,url
Fairy_Door_Opens_Magical_Light.mp4,reveal,A tiny fairy door swings open with a burst of magical golden light — used for common pet reveals,https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Fairy_Door_Opens_Magical_Light.mp4
Mossy_Chest_Reveal_Video_Ready.mp4,reveal,A mossy woodland chest creaks open revealing a glowing interior — used for rare and legendary pet reveals,https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Mossy_Chest_Reveal_Video_Ready.mp4
```

**Corrected rows:**

```csv
filename,type,description,url
Fairy_Door_Opens_Magical_Light.mp4,page_unlock_reveal,A tiny fairy door swings open with a burst of magical golden light — plays when a new sticker book page unlocks,https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Fairy_Door_Opens_Magical_Light.mp4
Mossy_Chest_Reveal_Video_Ready.mp4,creature_reveal,A mossy woodland chest creaks open revealing a glowing interior — plays when a new creature collectible is earned,https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets/woodland-felt/reveals/Mossy_Chest_Reveal_Video_Ready.mp4
```

**What changed:**
- `type` column: `reveal` → `page_unlock_reveal` (Fairy Door) and `creature_reveal` (Mossy Chest)
- `description` column: rewritten to reflect what each video actually plays for (category, not rarity)
- Filenames and URLs unchanged — the video files themselves are correct, only the labels were wrong

### 15.2 Who makes this change

**Not Manus.** This is a one-line-per-file correction on an already-delivered branch; it would be absurd to re-task Manus for it. Either:

- **Option A (recommended):** Founder amends locally. Check out `manus/woodland-felt-manifest`, edit the CSV in-place, commit with message `chore: correct reveal-manifest descriptions — page_unlock_reveal vs creature_reveal`, push, merge the PR. Two-minute task.
- **Option B:** Claude Code amends the branch as part of Sub-phase A startup. Adds a pre-migration commit before writing the migration file.

Either works. Founder's call.

### 15.3 Why the corrected values don't need to flow through the schema

The `gamification_themes` table stores the videos in two dedicated columns — `creature_reveal_video_url` and `page_unlock_reveal_video_url` — and the seed migration references them by filename, not by the CSV's `type` or `description` columns. So the migration seeds the right URL into the right column regardless of whether the CSV amendment happens.

**But** the CSV is source-of-truth documentation for anyone who opens it later. Leaving the wrong descriptions in place creates a trap for the next theme build ("oh, the pattern must be rarity-based reveals"). The amendment is about keeping the content pipeline self-consistent, not about making the seed migration work.

### 15.4 Also update the gamification-assets bucket structure doc

`asset-requirements/gamification-assets-bucket-structure.md` has a "reveals" column definition that says the `type` column is literal `reveal_video`. Update it to note the two reveal categories:

```markdown
| `type` | string | One of `creature_reveal` or `page_unlock_reveal` (Woodland Felt pattern); future themes may add sub-types |
```

This establishes the pattern for every future theme's reveals manifest so Manus (or whoever prepares the next theme's content) produces correctly-labeled CSVs from the start.

---

*End of original 14 sections. Continue reading §16 for the addendum on Play task tile paper craft icons (added 2026-04-07).*

---

## 16. Addendum — Play Task Tile Paper Craft Icons (from `platform_assets`)

> **Status:** ✅ **APPROVED 2026-04-07** — A1 = soft reference, A2 = hybrid seed migration without embeddings, A3 = hybrid tag + embedding search. All three answers recorded in §0 Round 3.

**Added 2026-04-07** after founder addendum message. This addendum expands Sub-phases A and B of the original plan with a new feature: Play task tiles render paper craft images from the existing `platform_assets` library instead of emoji, with an image picker integrated into `TaskCreationModal` when the task assignee is a Play member.

### 16.1 Founder's Addendum Intent

Direct paraphrase from the addendum message:

> Play tiles NEVER render emoji. Every Play task tile renders a paper craft image from `platform_assets`. When Mom creates or edits a task assigned to a Play member, the system automatically suggests the closest matching images from `platform_assets` based on the task title and category. Mom picks one, or searches for others.

The mental model: Mom types "Brush your teeth," and a horizontal row of paper craft tooth-brushing thumbnails appears below the title field. She taps one. The task saves with the selected image, and it renders on the kid's Play Dashboard as a colorful, cohesive visual tile.

### 16.2 Pre-Build Infrastructure Verification (completed 2026-04-07)

Before writing this addendum I verified every claim in the founder's message against the live codebase and database. **All core infrastructure confirmed present.** But two gaps surfaced that the founder needs to know about.

#### What's already built and works

| Piece | Location | State |
|---|---|---|
| `platform_assets` table with `visual_schedule` category | Migration `00000000000025_platform_assets.sql` | ✅ EXISTS. CHECK constraint allows `visual_schedule`. Columns: `id, feature_key, variant (A/B/C), category, size_512_url, size_128_url, size_32_url, description, generation_prompt, tags JSONB, vibe_compatibility TEXT[], display_name, embedding vector(1536), assigned_to, status`. Unique index on `(feature_key, variant, category)`. |
| `platform_assets` embedding column + `match_assets()` RPC | Migration `00000000100025_platform_assets_embeddings.sql` | ✅ EXISTS. pgvector enabled, ivfflat index on embedding column, `match_assets(query_embedding, threshold, count, category, status)` RPC ready for authenticated callers. |
| `src/lib/assets.ts` helpers | File exists | ✅ EXISTS. Has `getAsset()`, `getAssetVariants()`, `findAssetByTags()`, `getFeatureIcon()`, `getFeatureIcons()`, `useFeatureIcon()`. Confirmed functions match what the addendum references. |
| `src/lib/visual-schedule.ts` helpers | File exists | ✅ EXISTS. Has `searchVisualScheduleAssets(searchQuery, variant='B')` **that does exactly what the addendum's `useTaskIconSuggestions` is supposed to do** — accepts a search string, splits into tags, queries `platform_assets WHERE category='visual_schedule' AND variant='B' AND tags @> [tags]`, returns up to 20 rows. **We should reuse this, not rebuild it.** |
| `visual_schedule_routines` + `_routine_steps` + `_member_assignments` + `_member_tasks` tables | Migration `00000000100026_visual_schedule_tables.sql` | ✅ EXISTS. Full visual schedule subsystem already shipped. Not directly relevant to our Play tile build but shows the established patterns. |
| **Live DB — visual_schedule category coverage** | Queried via `npx supabase db query` 2026-04-07 | ✅ **328 rows**. Variant distribution: 114 A + 108 B + 106 C. ~108 distinct feature_keys with full 3-variant coverage. **All 328 rows have embeddings populated** (`SELECT COUNT(*), COUNT(embedding) FROM platform_assets WHERE category='visual_schedule'` → `total=328, with_embedding=328`). |
| **Live DB — topic coverage sample** | Same audit | ✅ Rich topic coverage confirmed. Top topics by row count: `teeth`, `potty`, `dress`, `meal`, `bath`, `hair`, `handwash`, `clean`, `face`, `feed`, `tidy`, plus activity topics like `piano`, `violin`, `soccer`, `swimming`, `cooking`, `building`, `puzzle`, `computer`, `movie`, `zoo`, `birdwatching`, `nature`, `bug`, `watercolor`, `biking`, `plant`, `ice`. |
| **Live DB — tag quality sample** | Spot-checked `vs_teeth_*_B` rows | ✅ Tags are semantic phrases, not just keywords. Example: `vs_teeth_paste_B` → `["teeth", "toothpaste", "toothbrush", "squeezing"]`. `vs_teeth_rinse_B` → `["teeth", "rinsing", "cup", "water", "after brushing"]`. Search by keyword will resolve well. |
| `TaskCreationModal.tsx` at `src/components/tasks/TaskCreationModal.tsx` | File exists | ✅ EXISTS. Accepts `initialTaskType` prop, has section-based structure, is the single canonical task-creation surface. Integration point for the new image picker section. |

**Verdict:** The founder's addendum is architecturally grounded. We have a live, populated, embedding-enabled library of 328 paper craft assets with semantic tags, and we have a helper function that already queries them. Most of the "new" work is UI glue on top of existing plumbing.

#### Gap #1 — The live library is NOT reproducible from git migrations (pre-existing, not caused by us)

The 328 `visual_schedule` rows in the live DB are **not seeded by any git-tracked migration file.** Migration `00000000100029_seed_platform_assets.sql` seeds only the 90 `app_icon` rows (30 features × 3 variants) — that migration contains ZERO `visual_schedule` inserts (`grep -c "visual_schedule" 00000000100029...` → 0).

Migration `00000000100026_visual_schedule_tables.sql` creates the routine tables and seeds 10 system routines with ~50 `asset_key` references like `vs_seq_wake_up`, `vs_potty_sit`, `vs_meal_dinner`, `vs_teeth_brush_top`. **But those exact feature_keys do NOT exist in the live `platform_assets` table.** Spot-check:

- Query: `SELECT feature_key FROM platform_assets WHERE category='visual_schedule' AND feature_key LIKE 'vs_meal_%'` → **0 rows**.
- Query: `SELECT feature_key FROM platform_assets WHERE category='visual_schedule' AND feature_key LIKE 'vs_seq_%'` → **0 rows**.
- But `vs_laundry_start_B` **does** exist as a full feature_key.

So the **live library uses a different naming convention than migration 100026's seeds** — live rows encode the variant as a `_A/_B/_C` suffix on the feature_key (`vs_laundry_start_B`), while migration 100026 seeds reference feature_keys without the variant suffix (`vs_meal_dinner`) and store variant in the separate `variant` column.

**This means migration 100026's visual_schedule routine seeds are referencing asset_keys that don't resolve in the live DB.** The existing Visual Schedule feature (as seeded by 100026) is effectively broken — not a problem we created, not a problem we're being asked to fix, but a problem we need to work around.

**The 328 live rows were added by "the asset pipeline script" mentioned in the embedding migration comment** (`COMMENT ON COLUMN platform_assets.embedding IS '... Generated and updated by the asset pipeline script.'`). That script is not in git. A fresh `supabase db reset` would wipe the 328 rows and leave only the 90 app_icon + 54 vault_thumbnail + maybe 64 login_avatar rows seeded by versioned migrations. Any new dev environment would have Play Dashboard tiles rendering the default fallback on every single tile until someone re-runs that external pipeline.

**Risk impact for this build:**
- **Production (live DB):** Works. All 328 visual_schedule rows exist with embeddings. Image suggestions will work out of the box.
- **Staging:** Unknown — depends on whether the staging DB was ever populated by the external pipeline. Likely broken unless the founder confirms otherwise.
- **Local dev (fresh clone + `supabase db reset`):** Broken. Play tiles will all render the default fallback. Nothing else in the build would fail — the gamification pipeline, sticker book, reveal modals, RPC, migrations all still work. Only the icon rendering degrades to the fallback.

**Proposed resolution (Addendum Q A2 below):** As part of Sub-phase A, dump the 328 live rows to a versioned seed migration file so the library is reproducible from git going forward. Technically this is cleanup of a pre-existing data-vs-migration drift, but we're the ones who need it to work, so we're the ones who should fix it. Alternative: accept the gap as a known dev-environment limitation.

#### Gap #2 — No generic fallback asset exists in the library

The addendum's item 7 says: *"Seed one platform_assets row with feature_key = 'play_task_default', category = 'visual_schedule', tagged as the universal fallback."*

**Verified:** Searching for `%default%`, `%generic%`, `%placeholder%`, `%star%`, `%check%`, `%todo%`, `%task%` in `visual_schedule` returned only unrelated results (a laundry-start asset tagged as "start"). **There is no existing asset that could serve as a clean, on-brand fallback** for a task with no specific match.

**This must be flagged for Manus to generate before the build ships.** The fallback is used when (a) Mom skips the image picker during task creation AND (b) auto-match returns zero results. Without it, `PlayTaskTile` would render nothing where the image should be, which violates the "NEVER emoji on Play tiles" rule in a silent broken way.

**Proposed resolution:** Append the fallback asset generation request to the Manus task queue. Must be delivered before Sub-phase B completes. Spec: paper craft style matching the existing visual_schedule library, gentle "ready for your task" vibe (checkmark-on-a-card, or a star-on-a-sunny-background, or a generic "ta-da" flourish), 3 variants (A/B/C) per convention, tags `["task", "default", "generic", "placeholder"]`, feature_key `vs_task_default`, display_name "Task — Default Icon".

### 16.3 Architectural Divergence from the Addendum

The addendum specifies: `ALTER tasks ADD COLUMN icon_asset_id UUID REFERENCES platform_assets(id)`.

**The existing visual_schedule subsystem uses a different pattern**: `visual_schedule_routine_steps.asset_key TEXT + variant TEXT DEFAULT 'B' CHECK (variant IN ('A','B','C'))`. No UUID FK, just the (feature_key, variant) composite that resolves against `platform_assets`'s unique index on `(feature_key, variant, category)`.

**The tradeoff:**

| Approach | Pros | Cons |
|---|---|---|
| **UUID FK** (`tasks.icon_asset_id UUID REFERENCES platform_assets(id)`) per the addendum | Simple one-column FK. Fast join. Foreign key constraint gives referential integrity. | Breaks if `platform_assets` rows are ever deleted + reseeded (the UUID changes, the reference goes dangling). Divergent from the established visual_schedule pattern, creating two parallel conventions. |
| **Soft reference** (`tasks.icon_asset_key TEXT + tasks.icon_variant TEXT DEFAULT 'B'`) matching the existing pattern | Consistent with existing subsystem. Survives reseed cycles because feature_keys are stable strings (`vs_teeth_top_B` stays `vs_teeth_top_B` even if the row gets deleted and reinserted). The current `platform_assets` practice IS reseed-heavy via the external pipeline, so this matters. | Two columns instead of one. No FK constraint — invalid keys aren't caught at write time. |

**Recommendation:** Use the soft reference pattern (`icon_asset_key + icon_variant`) to match the established convention. Key reasons:
1. The live DB evidence shows `platform_assets` rows DO get reseeded by the external pipeline — UUIDs would churn.
2. Consistency with `visual_schedule_routine_steps` means future migrations that unify the two subsystems don't have to reconcile two patterns.
3. The "no FK constraint" downside is mitigated by a simple write-time validation in the `useCreateTask` hook (look up the asset before saving; surface an error if not found). Which we'd want anyway for the auto-suggestion flow.

**But this is a founder call.** The addendum explicitly specified UUID FK. I'm flagging the tradeoff as Open Question A1 below.

### 16.4 What the Existing `searchVisualScheduleAssets` Function Does (and Why We Should Reuse It)

From [src/lib/visual-schedule.ts:48-63](src/lib/visual-schedule.ts#L48-L63):

```typescript
export async function searchVisualScheduleAssets(
  searchQuery: string,
  variant: 'A' | 'B' | 'C' = 'B'
) {
  const tags = searchQuery.toLowerCase().split(' ').filter(Boolean)

  const { data } = await supabase
    .from('platform_assets')
    .select('*')
    .eq('category', 'visual_schedule')
    .eq('variant', variant)
    .contains('tags', tags)
    .limit(20)

  return data || []
}
```

This is 16 lines that do the core of what the addendum's "`useTaskIconSuggestions` hook" is supposed to do:
1. Accept a search string
2. Split into tags
3. Query `platform_assets` filtered to `visual_schedule` + `variant='B'` (paper craft variant)
4. Return up to 20 results where the asset's tags array contains ALL of the search tags

The addendum's `extractTaskIconTags` utility (keyword extraction + stopword removal + synonym expansion + category mapping) is the missing intelligence layer on top. The new `useTaskIconSuggestions` hook should be a thin wrapper that:
1. Debounces the task title input
2. Calls `extractTaskIconTags(title, category)` to get an enriched tag list
3. Calls `searchVisualScheduleAssets(enrichedTags.join(' '))` — reusing the existing function
4. Returns the top N results (addendum says 6-8; I'd default to 8)

**Reuse saves ~30 lines of new hook code and keeps all Play/visual-schedule asset queries going through a single choke point.** If we later want to upgrade to embedding-based search, we change `searchVisualScheduleAssets` in ONE place and every consumer benefits.

### 16.5 Embedding-Based Search Is Ready NOW, Not a Future Enhancement

The addendum's item 5 says:

> The current approach uses tag matching, which works well for common tasks. For a more powerful search... a future enhancement could use the existing pgvector infrastructure to do semantic similarity search on `platform_assets.description`.

**The verification showed this is already fully set up:**
- `platform_assets.embedding vector(1536)` column EXISTS
- All 328 `visual_schedule` rows have embeddings populated
- `match_assets(query_embedding, threshold, count, filter_category, filter_status)` RPC is deployed and granted to `authenticated`
- `ivfflat` cosine similarity index exists

The only missing piece is **generating the query embedding from the task title string on the client or in an Edge Function.** OpenAI text-embedding-3-small is already used elsewhere in the codebase (PRD-23 BookShelf, PRD-18 Rhythms Phase C `generate-query-embedding` Edge Function). We could reuse the `generate-query-embedding` Edge Function directly.

**Should we ship embedding-based search in this build?** Tempting, but I'd recommend against it for the baby step. Reasons:
1. Adds an Edge Function call + network latency to every keystroke (even debounced)
2. Costs embedding tokens on every task title change
3. Tag-based search will produce good results given the quality of the live library's tags
4. Embedding search is an obvious "phase 2" upgrade if tag search proves insufficient in real use

**But we should document the upgrade path clearly so it's ready to ship.** In the implementation, structure `useTaskIconSuggestions` with a clean internal interface so swapping tag-search for embedding-search is a 10-line change.

This is Addendum Open Question A3.

### 16.6 Updated Build Items (Changes to Sub-phases A and B)

#### Sub-phase A additions (on top of the original Sub-phase A scope)

**Migration file additions** — still one migration `00000000100115_play_dashboard_sticker_book.sql`, just more in it:

1. **ALTER `tasks`** to add icon reference columns:
   - **If Open Question A1 = UUID FK (addendum's original proposal):**
     ```sql
     ALTER TABLE public.tasks
       ADD COLUMN IF NOT EXISTS icon_asset_id UUID REFERENCES platform_assets(id) ON DELETE SET NULL;
     CREATE INDEX IF NOT EXISTS idx_tasks_icon_asset_id
       ON public.tasks(icon_asset_id) WHERE icon_asset_id IS NOT NULL;
     ```
   - **If Open Question A1 = soft reference (matching existing visual_schedule pattern):**
     ```sql
     ALTER TABLE public.tasks
       ADD COLUMN IF NOT EXISTS icon_asset_key TEXT,
       ADD COLUMN IF NOT EXISTS icon_variant TEXT DEFAULT 'B'
         CHECK (icon_variant IS NULL OR icon_variant IN ('A','B','C'));
     CREATE INDEX IF NOT EXISTS idx_tasks_icon_asset_key
       ON public.tasks(icon_asset_key) WHERE icon_asset_key IS NOT NULL;
     ```

2. **[Conditional on Open Question A2]** — Data export and seed migration for the 328 live `visual_schedule` rows, so the library becomes reproducible from git. Approach: Claude Code runs a one-time export query, writes the results as an inline-VALUES `INSERT ... ON CONFLICT DO NOTHING` block in the migration file. **This doesn't touch the live DB** — the migration is idempotent and will no-op on the live DB where rows already exist, but will seed correctly on fresh environments.

3. **Flag for Manus before build ships** — not in the migration, but in a new section of the Manus task queue doc: generate `vs_task_default` fallback asset (3 variants). Sub-phase B can't ship without this because `PlayTaskTile` needs a real fallback URL.

**Nothing else in Sub-phase A changes.** The sticker book tables, gamification_configs, auto-provision trigger extension, feature keys, RPC, and RLS all stay as originally specified.

#### Sub-phase B additions (on top of the original Sub-phase B scope)

**New types** added to `src/types/play-dashboard.ts`:
- `TaskIconSuggestion` — `{ asset_key: string, variant: 'A'|'B'|'C', image_url_128: string, image_url_512: string, display_name: string, description: string, tags: string[] }` (or UUID if A1 = UUID FK)
- `TaskIconPickerProps` — `{ currentIcon?: TaskIconSuggestion | null, taskTitle: string, category?: string | null, onChange: (icon: TaskIconSuggestion | null) => void, assigneeIsPlayMember: boolean }`

**New utility** at `src/lib/assets/extractTaskIconTags.ts` — the keyword extraction + synonym expansion + category mapping logic from the addendum's item 4. Written exactly as the addendum specifies. No changes.

**New hook** at `src/hooks/useTaskIconSuggestions.ts` — thin wrapper:
```typescript
export function useTaskIconSuggestions(
  taskTitle: string,
  category?: string | null,
  enabled: boolean = true
) {
  const debouncedTitle = useDebounce(taskTitle, 500)
  return useQuery({
    queryKey: ['task-icon-suggestions', debouncedTitle, category],
    queryFn: async () => {
      const tags = extractTaskIconTags(debouncedTitle, category ?? undefined)
      if (tags.length === 0) return []
      const results = await searchVisualScheduleAssets(tags.join(' '), 'B')
      return results.slice(0, 8)
    },
    enabled: enabled && debouncedTitle.length >= 3,
    staleTime: 60_000, // cache suggestions for a minute — task titles don't churn
  })
}
```

**New batch hook** at `src/hooks/usePlayTaskIcons.ts` — for rendering the dashboard tile grid:
```typescript
export function usePlayTaskIcons(tasks: Task[]) {
  const iconRefs = useMemo(() => {
    // Extract the (asset_key, variant) or UUID refs from all tasks, dedupe
    return dedupeIconRefs(tasks)
  }, [tasks])

  return useQuery({
    queryKey: ['play-task-icons-batch', iconRefs],
    queryFn: async () => {
      // One query for all icons — no N+1
      return fetchIconsByRefs(iconRefs)
    },
    enabled: iconRefs.length > 0,
    staleTime: 5 * 60_000, // icons don't change often
  })
}
```

**New components:**
- `src/components/tasks/TaskIconPicker.tsx` — inline row of 8 auto-suggested thumbnails + "Browse all" button. Renders only when `assigneeIsPlayMember === true`. Highlighted border on selection. Passes selection up via `onChange`.
- `src/components/tasks/TaskIconBrowser.tsx` — full-screen `ModalV2` with search bar, tag filter chips, grid of all visual_schedule assets. Reuses `searchVisualScheduleAssets` with a larger result limit. Tap to select, closes picker, returns to TaskCreationModal with the selection.

**Modified components:**
- `src/components/tasks/TaskCreationModal.tsx` — add a new section "Pick an icon for this task" between the title field and the assignee field (or wherever makes sense in the existing layout). Conditionally rendered when **any selected assignee is a Play member** (per-assignee check, not global). Integrates `TaskIconPicker`. On save, writes the selected icon reference into the task record. If mom never interacted with the picker, auto-assigns the top suggestion at save time.
- `src/components/play-dashboard/PlayTaskTile.tsx` — removed emoji rendering. New priority order:
  1. If `task.icon_asset_key` (or `icon_asset_id`) is set → fetch + render that asset at 128px
  2. If not set → call `usePlayTaskIcons` batch query which auto-matches via `extractTaskIconTags(task.title, task.life_area_tag)` → use top result
  3. If no match → render the `vs_task_default` fallback
  4. **Never emoji. Never Lucide icons.**

**Everything else in Sub-phase B stays as originally specified.**

#### Sub-phase C, D, E, F — no additions

The gamification write path (C), sticker book UI (D), mom management (E), and verification (F) are all unchanged by this addendum.

### 16.6b Concrete Hybrid Search Hook Spec (per Round 3 A3 approval)

The founder approved a hybrid two-stage search pattern that's smarter than either tag-only or embedding-only. This subsection captures the exact design so the fresh session can implement it directly without re-deriving.

**Founder's exact direction:**

> *"Tag search fires instantly as Mom types (no API call, pure database query, immediate results). Embedding search via match_assets() fires after 500ms debounce, refines/supplements the tag results with semantically smarter matches. Mom sees images appear fast, then they improve a moment later. If the OpenAI embedding call fails, tag results remain. Both paths already exist in the codebase."*

**Two-stage progressive enhancement:**

| Stage | Trigger | Mechanism | Cost | Latency |
|---|---|---|---|---|
| Stage 1 — instant tag search | Every keystroke | `searchVisualScheduleAssets(extractTaskIconTags(title).join(' '), 'B')` — pure DB query against `platform_assets`, no API call | Free | ~30ms |
| Stage 2 — debounced embedding refine | 500ms after Mom stops typing | `generate-query-embedding` Edge Function → `match_assets()` RPC with cosine similarity | OpenAI embedding tokens (~$0.00002 per call) | ~200-400ms total |

Both stages return up to 8 results. The UI shows whichever set has results, **preferring embedding results when available**, falling back to tag results when embedding hasn't completed yet OR has failed silently.

**Hook structure** for `src/hooks/useTaskIconSuggestions.ts`:

```typescript
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce' // existing — verify path during build
import { supabase } from '@/lib/supabase/client'
import { searchVisualScheduleAssets } from '@/lib/visual-schedule'
import { extractTaskIconTags } from '@/lib/assets/extractTaskIconTags'

export interface TaskIconSuggestion {
  asset_key: string         // platform_assets.feature_key
  variant: 'A' | 'B' | 'C'
  display_name: string
  description: string
  tags: string[]
  size_128_url: string
  size_512_url: string
}

export interface UseTaskIconSuggestionsResult {
  /** The current best suggestions (embedding results when available, tag results otherwise) */
  results: TaskIconSuggestion[]
  /** True while the instant tag query is in flight (rare — should be near-instant) */
  isLoading: boolean
  /** True while the debounced embedding refine is in flight (after Mom stops typing) */
  isRefining: boolean
  /** True if the embedding stage produced results (UI can show a subtle "smart match" indicator) */
  hasEmbeddingResults: boolean
}

export function useTaskIconSuggestions(
  taskTitle: string,
  category?: string | null,
  enabled: boolean = true
): UseTaskIconSuggestionsResult {
  // ── Stage 1: Instant tag search (no debounce, fires on every change) ──
  const tagQuery = useQuery({
    queryKey: ['task-icons-tag', taskTitle, category],
    queryFn: async () => {
      const tags = extractTaskIconTags(taskTitle, category ?? undefined)
      if (tags.length === 0) return []
      const rows = await searchVisualScheduleAssets(tags.join(' '), 'B')
      return rows.slice(0, 8).map(rowToSuggestion)
    },
    enabled: enabled && taskTitle.trim().length >= 3,
    staleTime: 60_000,
  })

  // ── Stage 2: Debounced embedding-based refine ──
  const debouncedTitle = useDebounce(taskTitle, 500)
  const embeddingQuery = useQuery({
    queryKey: ['task-icons-embedding', debouncedTitle, category],
    queryFn: async () => {
      // Generate query embedding via the existing Edge Function
      const queryText = `${debouncedTitle}${category ? ' ' + category : ''}`.trim()
      const embedRes = await supabase.functions.invoke('generate-query-embedding', {
        body: { text: queryText },
      })
      if (embedRes.error || !embedRes.data?.embedding) {
        throw new Error('Embedding generation failed')
      }
      // Call the match_assets() RPC
      const { data, error } = await supabase.rpc('match_assets', {
        query_embedding: embedRes.data.embedding,
        match_threshold: 0.5,
        match_count: 8,
        filter_category: 'visual_schedule',
        filter_status: 'active',
      })
      if (error) throw error
      // Filter to variant B for visual consistency with tag search results
      const variantB = (data ?? []).filter((r: { variant: string }) => r.variant === 'B')
      return variantB.map(rowToSuggestion)
    },
    enabled: enabled && debouncedTitle.trim().length >= 3,
    staleTime: 5 * 60_000,
    retry: false, // Don't retry on failure — silently fall back to tag results
  })

  // ── Merge: prefer embedding results when available, fall back to tag results ──
  const results = useMemo(() => {
    const embedding = embeddingQuery.data ?? []
    const tag = tagQuery.data ?? []
    return embedding.length > 0 ? embedding : tag
  }, [tagQuery.data, embeddingQuery.data])

  return {
    results,
    isLoading: tagQuery.isLoading,
    isRefining: embeddingQuery.isFetching,
    hasEmbeddingResults: (embeddingQuery.data?.length ?? 0) > 0,
  }
}

// Helper — adapt the row shape from each query into the unified suggestion shape
function rowToSuggestion(row: Record<string, unknown>): TaskIconSuggestion {
  return {
    asset_key: row.feature_key as string,
    variant: row.variant as 'A' | 'B' | 'C',
    display_name: (row.display_name ?? row.description ?? row.feature_key) as string,
    description: (row.description ?? '') as string,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    size_128_url: row.size_128_url as string,
    size_512_url: row.size_512_url as string,
  }
}
```

**Edge cases handled by this design:**

1. **Mom types fast, never pauses:** Stage 1 fires repeatedly with each keystroke. Stage 2 only fires once, on the final pause. No wasted embedding calls.
2. **Embedding service down:** Stage 2 throws, `retry: false` prevents retries, `embeddingQuery.data` stays undefined, `results` falls back to `tagQuery.data`. Mom never sees an error.
3. **Mom types 1-2 characters:** Both queries are disabled (`enabled` checks `length >= 3`). Results array is empty. The picker shows the "Browse all" button.
4. **Mom edits the title back to a previously-queried value:** Both queries hit React Query cache (60s tag, 5min embedding). Instant.
5. **Tag search returns 0 results, embedding search returns 5:** Embedding wins. Mom sees 5 semantically-matched images.
6. **Both return results but embedding's are better:** Embedding wins (memo prefers it when `length > 0`).
7. **Tag search returns 8 results within 30ms, embedding takes 400ms:** Mom sees the 8 tag results instantly. 400ms later, the row smoothly swaps to the embedding results without a loading flash. The `isRefining` flag could be used to add a subtle "✨ refining..." indicator if desired (UI polish, not required for MVP).

**Verification dependencies the fresh session needs to check during build:**

- Confirm `src/hooks/useDebounce.ts` exists. If not, write a simple one (10 lines, standard pattern).
- Confirm `generate-query-embedding` Edge Function is deployed and accepts `{ text }` body returning `{ embedding: number[] }`. From the §16.2 verification: it was deployed in PRD-18 Phase C. Verify the request/response shape matches the assumption above; adjust if needed.
- Confirm `match_assets` RPC accepts `query_embedding` as a `vector(1536)` (which means the JS array gets serialized to PostgreSQL vector format — Supabase RPC handles this automatically when the param is a number array).

---

### 16.7 Updated CLAUDE.md Convention

Add to the CLAUDE.md convention list (post-build, Sub-phase F):

> **Play shell task tiles NEVER render emoji.** All Play task tiles render paper craft images from `platform_assets` (category=`visual_schedule`, variant `B` preferred). When Mom creates or edits a task for a Play member, `TaskCreationModal` auto-suggests the closest matching images via `useTaskIconSuggestions` → `extractTaskIconTags` → `searchVisualScheduleAssets`. Mom picks one from the 8 auto-suggestions or taps "Browse all" to open `TaskIconBrowser`. If Mom never interacts with the picker, the top auto-match is assigned at save time. Fallback: `vs_task_default` asset when auto-match returns zero results. This convention applies to Play shell ONLY. Adult/Independent/Guided shells continue to use emoji or Lucide icons per vibe configuration. The soft-reference pattern (`tasks.icon_asset_key + icon_variant`) matches the established `visual_schedule_routine_steps` pattern — assets are referenced by stable string keys, not by UUID FK, so reseed cycles don't break existing task icon references. *(Wording assumes Open Question A1 resolves in favor of soft reference. Adjust to "UUID FK via `tasks.icon_asset_id`" if A1 resolves that way instead.)*

### 16.8 Updated STUB_REGISTRY.md Entries

Append to the §10 "Stubs Created by This Build" table:

| Stub | Wires To | Future PRD/Build |
|---|---|---|
| Embedding-based semantic image search for task tiles | `match_assets()` RPC exists + all 328 rows have embeddings; `useTaskIconSuggestions` uses tag-based search for the baby step | Future upgrade — swap `searchVisualScheduleAssets` call for `match_assets` call when tag search proves insufficient. 10-line change. |
| Guided shell image picker | Same `TaskIconPicker` + `TaskIconBrowser` components, just render for Guided assignees too | Future Guided enhancement — the condition `assigneeIsPlayMember` becomes `assigneeIsPlayOrGuided` |
| Auto-match tag vocabulary expansion | `extractTaskIconTags` synonym map and category mapping cover common tasks but will need expansion as families create diverse tasks | Ongoing — add to the synonym map as real usage reveals gaps |
| `visual_schedule` library reproducibility from git | 328 live rows exist but are not in versioned migrations (pre-existing drift) | **[Conditional on Open Question A2]** — if A2 = "dump to seed migration", this stub resolves in Sub-phase A. If A2 = "accept the gap", it stays as a known dev-environment limitation. |
| `vs_task_default` fallback asset | Must be generated by Manus before Sub-phase B ships | Not a stub — a pre-build blocker. Listed here so it's tracked. |

### 16.9 Updated File Inventory

**Net additions to §12's inventory:**

- **New types:** `TaskIconSuggestion`, `TaskIconPickerProps` (in `src/types/play-dashboard.ts`)
- **New utilities:** `src/lib/assets/extractTaskIconTags.ts`
- **New hooks:** `src/hooks/useTaskIconSuggestions.ts`, `src/hooks/usePlayTaskIcons.ts`
- **New components:** `src/components/tasks/TaskIconPicker.tsx`, `src/components/tasks/TaskIconBrowser.tsx`
- **Modified components:** `src/components/tasks/TaskCreationModal.tsx` (add icon picker section)
- **Modified components:** `src/components/play-dashboard/PlayTaskTile.tsx` (was already in the inventory, but now the rendering logic is specified concretely — image priority order, no emoji)
- **Migration additions:** The `tasks` icon columns (A1-dependent schema) and **[conditional on A2]** the 328-row visual_schedule seed block

**Net additions to total line count:** ~600-800 additional lines across the new hooks, components, and migration seed block.

### 16.10 Pre-Build Coverage Audit Results (item 8 from the addendum — completed)

The addendum's item 8 asked: *"Query all distinct task categories and common task titles currently assigned to Play members. For each, check whether `platform_assets` has matching `visual_schedule` entries. Report gaps."*

Audit ran 2026-04-07 against the live DB. Results:

**Current Play member task dataset (production):**
- Total Play tasks (non-archived): **6 tasks across all families**
- All 6 tasks have `life_area_tag = NULL` (no categorization)
- 4 distinct titles:
  - "Participate in Family Star" (3 instances) — will match library via "star" / "family" tags but is a wrapper for family intentions, probably gets the fallback
  - "Evening wind-down routine" (1) — will auto-match to `vs_rest_bedtime_B` or similar via "evening" / "routine" / "bedtime" expansion
  - "Morning routine checklist" (1) — will auto-match to `vs_seq_wake_up` (if that key existed, which it doesn't in the live DB — so will match `vs_teeth_*` or `vs_dress_*` depending on whichever has "morning" in tags, OR will fallback)
  - "Pack therapy bag with Kylie" (1) — will auto-match to `vs_school_pack_backpack_B` via "pack" tag expansion

**The production dataset is too thin to do a meaningful coverage audit against.** 6 tasks, 4 titles, 0 categories. This tells us nothing about whether the library will cover the range of tasks real Play families will create once they start using the feature.

**Conceptual coverage audit (representative Play task vocabulary vs library topics):**

Top visual_schedule library topics (sorted by count): teeth (15+), potty (14), dress, meal, bath, hair (6), handwash (15), clean (15), face (13), feed (12), tidy (14), water (6), plus activity topics piano, violin, soccer, swimming, cooking, building, puzzle, movie, zoo, birdwatching, nature, bug, biking, plant, ice, paper, watercolor, scrub, mop, and more.

**Expected Play daily-task vocabulary:**
| Kid daily task | Library coverage |
|---|---|
| "Brush teeth" | ✅ Excellent (15+ teeth assets including `vs_teeth_top_B`, `vs_teeth_paste_B`, `vs_teeth_rinse_B`, etc.) |
| "Go potty" | ✅ Excellent (14 potty assets) |
| "Wash hands" | ✅ Excellent (15 handwash assets) |
| "Get dressed" | ✅ Good (dress category has clothing-specific steps) |
| "Eat breakfast/lunch/dinner" | ⚠️ Unclear — meal topic exists but the specific `vs_meal_*` keys referenced in migration 100026 don't exist in the live DB. Spot-check needed to confirm what meal assets ARE in the library. |
| "Take a bath" | ✅ Good (bath category) |
| "Wash face" | ✅ Good (13 face assets) |
| "Clean up toys" | ✅ Good (clean + tidy categories) |
| "Feed pet" | ✅ Good (12 feed assets) |
| "Read a book" | ⚠️ Unknown — "reading" not in the top topic list. Spot-check needed. |
| "Practice piano" | ✅ Good (3 piano assets) |
| "Go outside / play" | ⚠️ Unknown |
| "Put shoes away" | ✅ Likely covered by `vs_laundry_take_off_shoes_B` or tidy |
| "Help with dishes" | ⚠️ Unknown |
| "Pick out clothes" | ✅ Likely covered by dress category |

**Coverage assessment:** The library is rich enough to cover ~70-80% of typical Play daily-life tasks out of the box. Gaps (reading, general play, outdoor activities, helping with meal prep) can be filled:
1. Via fuzzy/synonym matching in `extractTaskIconTags` (e.g., "read" → expand to `story_time`, `books`, `bedtime_story`)
2. Via the `vs_task_default` fallback for anything that truly doesn't match
3. Via future Manus batches to fill specific gaps as they surface in real family usage

**No gaps are blocking this build.** The fallback asset (Gap #2) is the only MUST-HAVE pre-ship Manus request.

### 16.11 Updated Risks

Append to §13:

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Live `visual_schedule` library not reproducible from git (pre-existing drift) | Certain | Medium | Addendum Open Question A2 — dump 328 rows to versioned seed migration as part of Sub-phase A, OR accept as known dev-environment limitation. |
| `vs_task_default` fallback asset doesn't exist | Certain | High | Flag for Manus generation before Sub-phase B ships. Pre-build blocker listed in §16.8. |
| `TaskCreationModal` surgery adds complexity to a high-traffic component | Medium | Medium | New picker section is conditionally rendered (only when assignee is Play member). Zero impact on adult/independent/guided task creation flows. Playwright test coverage for both paths. |
| Tag-based search produces poor suggestions for unusual task titles | Medium | Low | (a) `extractTaskIconTags` has category mapping + synonym expansion; (b) fallback to the default asset is graceful; (c) Mom can always tap "Browse all" to pick manually; (d) upgrade path to embedding search is pre-wired. |
| `tasks.source` enum doesn't need an addition for this addendum | N/A | — | Confirmed — image picker writes to new icon columns, not to `source`. No enum rebuild needed beyond what the original plan already specified. |

### 16.12 Addendum Open Questions — ANSWERED 2026-04-07

All three answered in Round 3 of founder sign-off. Original question text preserved for audit trail; final answers in §0 Round 3 table.

#### Q A1: Icon reference pattern — UUID FK (per addendum) or soft reference (per existing visual_schedule pattern)?

**Option A — UUID FK (addendum's original proposal):**
```sql
ALTER TABLE public.tasks
  ADD COLUMN icon_asset_id UUID REFERENCES platform_assets(id) ON DELETE SET NULL;
```

**Option B — Soft reference matching the existing `visual_schedule_routine_steps` pattern:**
```sql
ALTER TABLE public.tasks
  ADD COLUMN icon_asset_key TEXT,
  ADD COLUMN icon_variant TEXT DEFAULT 'B' CHECK (icon_variant IS NULL OR icon_variant IN ('A','B','C'));
```

**My recommendation: Option B (soft reference).**

Reasons:
1. The live DB evidence shows `platform_assets` rows get reseeded by the external pipeline — UUIDs churn, feature_keys are stable.
2. Consistency with `visual_schedule_routine_steps` means future migrations don't have to reconcile two patterns.
3. The "no FK constraint" downside is mitigated by write-time validation in the save path.
4. Looking up an asset by `(category, feature_key, variant)` uses the existing unique index and is just as fast as a UUID join for realistic query volumes.

**Impact of choice:** Determines the exact `ALTER TABLE tasks` block in the Sub-phase A migration, the column names in the TypeScript types, the `TaskIconSuggestion` interface shape, and about 10 lines of code in the save path and the render path. Both options work; they just need to be consistent.

#### Q A2: Visual schedule library reproducibility — dump to seed migration or accept gap?

The 328 live `visual_schedule` rows are not in any versioned migration. A fresh environment cannot reproduce the library without running the external asset pipeline script (which is not in git).

**Option A — Dump to versioned seed migration in Sub-phase A.** As part of writing migration `00000000100115_play_dashboard_sticker_book.sql`, Claude Code runs a one-time export query, generates an inline-VALUES `INSERT ... ON CONFLICT (feature_key, variant, category) DO NOTHING` block for all 328 rows, and embeds it in the migration file. The migration becomes large (~400 extra lines) but the library becomes reproducible from git forever after.

**Downsides:** Large migration file; we're cleaning up pre-existing drift that isn't strictly part of this build's scope; the embedding column (`vector(1536)`) is awkward to seed inline-VALUES (the vector literal is a 1536-float string and the pgvector `halfvec` type).

**Option B — Accept the gap as a known dev-environment limitation.** Document in CLAUDE.md that `platform_assets.visual_schedule` rows are populated by an external pipeline, not by git migrations. Fresh dev environments have degraded Play tile rendering (everything shows the fallback) until someone runs the pipeline. Production and staging (presumably) are unaffected.

**Option C — Hybrid.** Dump only the seed rows WITHOUT embeddings. On fresh environments, the rows exist but semantic search won't work until someone runs an embedding backfill. Tag-based search will work immediately. This is probably the least painful option — the migration is ~400 lines of reasonable text, embeddings can be backfilled by an Edge Function later, and local dev works without needing a pipeline run.

**My recommendation: Option C (hybrid).** Dump the rows without embeddings into the seed migration. The tag-based suggestion flow works day one in any environment. Embeddings can be regenerated on-demand via a new `backfill-visual-schedule-embeddings` Edge Function run manually by the founder when needed.

**Impact of choice:** Determines whether the Sub-phase A migration is ~300 lines (Option B, Option A+no-embeddings) or ~700 lines (Option A with embeddings) or ~400 lines (Option C).

#### Q A3: Tag-based search vs embedding search for the baby step?

**Option A — Tag-based search only** (per the addendum's item 5 guidance). Reuses `searchVisualScheduleAssets`. Zero extra infrastructure. Ships fast. Upgrade path to embeddings is pre-wired in the hook structure.

**Option B — Embedding-based search from day one.** Uses the already-deployed `match_assets()` RPC. Reuses `generate-query-embedding` Edge Function. More robust to typos and non-obvious wording ("Feed the dog" vs "Give the dog food"). Adds Edge Function latency per keystroke (~150-300ms) even debounced.

**My recommendation: Option A (tag search).** Ship fast, upgrade later if needed.

**Rationale:** Tag search will give good results for the top 10-15 common Play daily-task vocabularies because the library's tags are semantic phrases. The synonym expansion in `extractTaskIconTags` covers most of the wording variation. Embedding search adds latency and cost and isn't necessary for the baby step. If real usage reveals suggestion quality is poor, the swap to `match_assets` is a 10-line change in one file.

---

### 16.13 Summary of Addendum Impact

| Change | Scope |
|---|---|
| Infrastructure verified present | ✅ `src/lib/assets.ts`, `src/lib/visual-schedule.ts`, `platform_assets` table, embedding column, `match_assets()` RPC, 328 live `visual_schedule` rows, full embedding coverage |
| Gap flagged: live library not reproducible from git | ⚠️ Pre-existing, needs Founder decision A2 |
| Gap flagged: no fallback asset exists | ⚠️ Manus pre-build task required |
| New open question A1: UUID FK vs soft reference | ⚠️ Founder decision required |
| New open question A2: library seed reproducibility | ⚠️ Founder decision required |
| New open question A3: tag vs embedding search | Recommended tag; founder can override |
| Sub-phase A additions | ALTER tasks columns (A1-dependent), [conditional] seed migration (A2-dependent) |
| Sub-phase B additions | 2 new hooks, 2 new components, `extractTaskIconTags` util, `TaskCreationModal` modification, `PlayTaskTile` rendering overhaul |
| Sub-phase C/D/E/F | No changes |
| CLAUDE.md convention | New entry: Play tiles never emoji |
| STUB_REGISTRY additions | 5 new stubs tracked |
| Risk additions | 3 new risks tracked |

**ALL ADDENDUM QUESTIONS ANSWERED 2026-04-07.** A1=B (soft reference), A2=C (hybrid seed without embeddings), A3=Hybrid (instant tag + debounced embedding refine). Manus fallback asset task approved. See §0 Round 3 for the full record.

---

*End of §16 addendum. Continue to §17 for the Sub-phase A kickoff checklist that the fresh session reads first.*

---

## 17. Sub-phase A Kickoff Checklist (Fresh Session Entry Point)

> **This section is the fresh session's entry point.** The next session that picks up Build M opens this file and starts here. Everything above is reference; this section is the action list.

> **⚠️ MIGRATION FILENAME COLLISION DISCOVERED 2026-04-07:** While this plan was originally drafted, **another session in the same conversation sequence completed Build N (PRD-18 Phase D Independent Teen rhythms) and used migration `00000000100114_rhythms_phase_d_teen.sql`** — the filename this plan originally reserved. Build M's migration filename has been updated to **`00000000100115_play_dashboard_sticker_book.sql`** throughout this document. The fresh session uses the new number.
>
> **What else the fresh session needs to know about Build N:**
> - Build N + N.2 implementation completed 2026-04-07, awaiting founder sign-off (status in CURRENT_BUILD.md)
> - Build N's migration `00000000100114_rhythms_phase_d_teen.sql` does NOT modify `tasks.source` CHECK constraint — it stays at the Build L (Phase C) baseline of 16 values defined in `00000000100112_rhythms_phase_c.sql:80-99`. So Build M's `tasks.source` rebuild copies the same 16 values + adds `'randomizer_reveal'` for a total of 17. No conflict with Build N.
> - Build N introduces a new `MindSweepLiteTeenSection.tsx` component, a `talk_to_someone` MindSweep-Lite disposition, and a teen-specific `commitMindSweepLite.ts` case. Build M does NOT touch any of these. The `RhythmModal.handleComplete` flow stays unchanged.
> - Build N adds 9 new CLAUDE.md conventions (#189-197) for the Phase D + N.2 teen experience. Build M conventions (added in Sub-phase F) start at #198 or higher. None overlap with teen-specific conventions.
> - Build N's `auto_provision_member_resources` trigger fork (independent vs adult/play branches) is in production. Build M's trigger extension in §7.6 must INSERT INTO the same trigger function that Build N already extended — meaning Build M's `CREATE OR REPLACE FUNCTION` must preserve Build N's teen branch. Read the live trigger function before writing the new version. **This is the #1 collision risk for Build M's Sub-phase A.**

### 17.1 What the fresh session reads first (in order)

1. **This file** ([claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md](claude/feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md)) — start with §0 (sign-off record), then §17 (this checklist), then skim §1-§16 as needed for specific decisions
2. **`CURRENT_BUILD.md`** — confirms Build M is the active build, contains the live pre-build summary
3. **`CLAUDE.md`** — load all conventions; the most relevant ones for this build are #14 (post-phase checklist), #121 (run `tsc -b`), #15 (member colors), #16 (mobile parity)
4. **Latest `tasks.source` CHECK** at [supabase/migrations/00000000100112_rhythms_phase_c.sql:80-99](supabase/migrations/00000000100112_rhythms_phase_c.sql#L80-L99) — copy the full enum value list so the new migration's drop/readd preserves all 15 prior values plus adds `'randomizer_reveal'`
5. **`src/lib/visual-schedule.ts`** — confirm `searchVisualScheduleAssets` exists (the fresh session reuses it, doesn't rebuild it)
6. **`src/lib/assets.ts`** — confirm `getAsset` / `findAssetByTags` / `match_assets` references match what §16 assumes
7. **`asset-requirements/manus-vs-task-default-fallback.md`** — the Manus task brief for the fallback asset; confirm it's been queued

### 17.2 First commit — Manus CSV amendment

**Before writing the migration file**, the fresh session does this single commit on the `manus/woodland-felt-manifest` branch:

```bash
git fetch origin manus/woodland-felt-manifest
git checkout manus/woodland-felt-manifest
# Edit assets/gamification/woodland-felt/reveals-manifest.csv per §15.1
git add assets/gamification/woodland-felt/reveals-manifest.csv
git commit -m "chore: correct reveal-manifest descriptions — page_unlock_reveal vs creature_reveal"
git push origin manus/woodland-felt-manifest
```

The exact CSV changes are spelled out in §15.1 of this file. Founder confirmed twice (original §3 override #4 and Round 3 reconfirm): **Mossy Chest = creature reveal, Fairy Door = page unlock reveal.**

After the commit, the fresh session also updates [asset-requirements/gamification-assets-bucket-structure.md](asset-requirements/gamification-assets-bucket-structure.md) per §15.4 to codify `creature_reveal` vs `page_unlock_reveal` as the standard `type` values for future themes' reveals manifests.

Then the fresh session merges `manus/woodland-felt-manifest` to main (or asks the founder to merge — founder's preference).

### 17.3 Sub-phase A migration file — single migration

File path: `supabase/migrations/00000000100115_play_dashboard_sticker_book.sql`

**Contents in order** (per §7 + §16.6 of this file):

1. CREATE 3 platform tables: `gamification_themes`, `gamification_creatures`, `gamification_sticker_pages` (+ RLS, indexes, comments)
2. CREATE 4 per-member runtime tables: `gamification_configs` (full PRD-24 schema), `member_sticker_book_state`, `member_creature_collection`, `member_page_unlocks` (+ RLS, indexes, rarity_weights validation trigger)
3. ALTER `tasks` ADD COLUMN `points_override` INTEGER (per Q4)
4. ALTER `tasks` ADD COLUMN `icon_asset_key` TEXT + `icon_variant` TEXT DEFAULT 'B' CHECK (per A1 = soft reference)
5. ALTER `tasks` DROP + ADD `tasks_source_check` constraint adding `'randomizer_reveal'` (16 total values)
6. INSERT 1 `gamification_themes` row (Woodland Felt) with the two CORRECTED reveal video URLs from the amended manifest
7. INSERT 161 `gamification_creatures` rows from the Woodland Felt manifest (inline VALUES per project convention)
8. INSERT 26 `gamification_sticker_pages` rows from the backgrounds manifest (inline VALUES)
9. **[A2 hybrid]** INSERT ~328 `platform_assets` rows for `visual_schedule` category, WITHOUT embeddings (`embedding` column NULL). Approach: `npx supabase db query --linked` to dump the live rows as a `pg_dump --data-only --inserts` style export, then embed inline VALUES in the migration. Use `ON CONFLICT (feature_key, variant, category) DO NOTHING` so the migration is a no-op against the live DB where rows already exist.
10. CREATE `roll_creature_for_completion(p_task_completion_id UUID) RETURNS JSONB` RPC function (SECURITY DEFINER) per §7.5's 11-step logic
11. ALTER `auto_provision_member_resources` trigger function to add the 4 steps from §7.6 (gamification_configs row + member_sticker_book_state row + bootstrap first sticker page unlock + set active_page_id)
12. Backfill query: run the extended provisioning for all existing `family_members` rows, idempotent via NOT EXISTS guards
13. INSERT 7 feature keys into `feature_key_registry` + 35 `feature_access_v2` rows (7 × 5 role groups)

**Verification queries embedded in the migration as `RAISE NOTICE` lines** so the migration self-reports row counts on apply.

### 17.4 Sub-phase A verification (before declaring complete)

- `npx supabase db push` — apply the migration to local
- Query: `SELECT count(*) FROM gamification_creatures` → 161
- Query: `SELECT count(*) FROM gamification_sticker_pages` → 26
- Query: `SELECT count(*) FROM gamification_configs` → equal to total `family_members` count
- Query: `SELECT count(*) FROM member_sticker_book_state` → same count
- Query: `SELECT count(*) FROM member_page_unlocks WHERE unlocked_trigger_type = 'bootstrap'` → same count
- Query: `SELECT count(*) FROM platform_assets WHERE category = 'visual_schedule'` → ~328 (no change against live DB; adds the rows on a fresh DB)
- Test the RPC manually: `SELECT roll_creature_for_completion('<a real task_completions row id>'::uuid)` and inspect the JSONB return shape
- RLS smoke test against all 5 family roles
- `npx tsc -b` zero errors (should be a no-op since Sub-phase A has no TypeScript changes yet)
- Update `RLS-VERIFICATION.md` with the 7 new tables

### 17.5 Sub-phases B → F

After Sub-phase A is verified clean, continue per §9 of this file. No checkpoint reviews until after Sub-phase F per founder's "one end-to-end review" decision in Round 3.

### 17.6 What this build does NOT do (re-check before each sub-phase to prevent scope creep)

See §6 for the full list. The most important "do not touch" items:
- No treasure box system
- No reward menu / redemption flow
- No Family Leaderboard
- No 8-type Reveal Library (only the 2 Woodland Felt videos)
- No overlay engine, no 4-stage progression
- No DailyCelebration Step 3/4 wiring (still auto-skipped)
- No Reveal Tiles on Play Dashboard (stubbed with `PlannedExpansionCard`)
- No Mom's Message card (stubbed)
- No drag-to-reposition creatures (schema supports it, UI deferred)
- No sticker book page curation UI (the "mom feels invested" experience — accepted gap)
- No multi-theme support (Woodland Felt only)
- No `gamification_events` ledger, no `gamification_daily_summaries`, no `gamification_achievements`
- No schedule-aware streaks (naive consecutive-day only)
- No task unmark cascade

### 17.7 Stub registry to update at Sub-phase F

Per §10 + §16.8. The fresh session adds these to STUB_REGISTRY.md during Sub-phase F:

- Reveal task tiles (PRD-26)
- Mom's message card (PRD-26 + PRD-15)
- DailyCelebration Step 3 streak display
- DailyCelebration Step 4 overlay reveal
- Task unmark reward cascade (PRD-02)
- Drag-to-reposition creatures
- Per-page custom unlock triggers
- Currency customization UI
- Reveal visual picker
- Multi-theme support
- Practice sessions earning points (explicit "no" design decision)
- Schedule-aware streaks
- Treasure box, reward menu, leaderboard
- Graduation flow
- Sticker book page curation UI (mom-facing)
- Embedding-based search as primary (currently hybrid Stage 2 only)
- Guided shell image picker
- Auto-match tag vocabulary expansion
- `visual_schedule` library reproducibility from git (resolved by A2 hybrid — note as resolved-via-this-build)
- `vs_task_default` fallback asset (track Manus delivery)

### 17.8 If something doesn't match

If during Sub-phase A the fresh session discovers anything that contradicts this plan — schema reality differs, an existing function signature changed, the Manus branch state isn't what was expected, etc. — **stop, surface the discrepancy to the founder, do not improvise.** The whole point of the pre-build process was to get the plan right before code was written. If reality has drifted since the plan was written, the plan needs updating before code, not silent improvisation.

---

*End of plan + addendum. Build M (Play Dashboard + Sticker Book) is ready to start in a fresh session. No code has been written in this document or in this session.*
