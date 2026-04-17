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



