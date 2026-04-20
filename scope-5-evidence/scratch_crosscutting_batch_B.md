# Scratch — Crosscutting Batch B (39 entries)

Session 4 sub-agent, follow-on batch. Recipe v1. Registry line count baseline: 547.

Entries processed in registry-line order.

## Entry 111 — `Send to Person (messaging)`

**Registry line:** 111
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Send to Person (messaging) | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
```

### Field 1 — Implementation identifier

(a) Stub entry line 111 does not name a concrete code identifier. Only capability ("Send to Person (messaging)") + PRD references.
(b) `WIRING_STATUS.md` line 18 (RoutingStrip Destinations table): `| Message | Notepad | Opens composer | Stub | PRD-15 not built |` — names "composer" capability, Status "Stub".
(c) No matching CLAUDE.md convention naming a concrete identifier for this capability.
(d.5) WIRING_STATUS.md at (b) says "Opens composer"; NotepadDrawer.tsx surfaced via `grep 'message'` as having `destination === 'message'` branch. One-file lookup → `src/components/notepad/NotepadDrawer.tsx:258` intercepts `destination === 'message'` and sets `composeFlowOpen(true)`. Secondary identifier: `ComposeFlow` component.

```
Source: src/components/notepad/NotepadDrawer.tsx:258 — "if (destination === 'message') { const content = activeTab.content || ''; setComposeFlowContent(content); setComposeFlowOpen(true); return }"
Identifier: destination === 'message' branch + ComposeFlow component
```

### Field 2 — Code presence check

```
Grep command: pattern='message', path=src, output_mode=content (line 2 of multi-grep)
Hits: Multiple; relevant for Messaging destination routing:
  - src/components/notepad/NotepadDrawer.tsx:258 "if (destination === 'message') { ... setComposeFlowOpen(true) }"
  - src/components/shared/RoutingStrip.tsx:102 "{ key: 'message', label: 'Message', icon: MessageCircle, featureKey: 'messages', accent: 'rose' }"
  - src/components/shared/RoutingStrip.tsx:129,135 'message' in allowed destination list
  - src/components/guided/SendToGrid.tsx:154 "{ key: 'message', label: 'Message', icon: <MessageCircle size={22} />, disabled: true, description: 'Coming soon!' }"
  - src/components/guided/SendToGrid.tsx:33 "if (dest === 'message') return // Stub — disabled"
  - src/hooks/useNotepad.ts:61 "{ key: 'message', label: 'Message', icon: 'MessageCircle' }"
```

```
Grep command: pattern='ComposeFlow|composeFlow', path=src/components/messaging
Hits: 1 file
Files:
  - src/components/messaging/ComposeFlow.tsx (exists — concrete component)
```

### Field 3 — Wiring check

Notepad "Message" destination: wired to open ComposeFlow with pre-filled content (NotepadDrawer.tsx:258). ComposeFlow component file exists.
Guided SendToGrid "Message": explicitly disabled stub at line 33 ("// Stub — disabled") and line 154 ("disabled: true, description: 'Coming soon!'").
RoutingStrip: 'message' is a registered destination key (line 102) with `featureKey: 'messages'`.

Caller files for ComposeFlow: NotepadDrawer.tsx (at least).

Most recent touching commit: not checked (git not available in this session's Bash scope).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Line 18 says `| Message | Notepad | Opens composer | Stub | PRD-15 not built |` — describes Message destination as Stub with "Opens composer" description. This contradicts the in-tree code which has ComposeFlow wired from NotepadDrawer.tsx.
**Cross-PRD addendum mentions:** prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md exists; grep result earlier showed it references messaging flows.
**PlannedExpansionCard:** none found for this feature key.
**CLAUDE.md convention mention:** Conventions 136-148 describe messaging architecture but do not name a specific implementation identifier for the "Send to Person" routing destination.

### Field 5 — What was NOT checked

- Whether ComposeFlow.tsx actually submits messages end-to-end and persists to `messages` / `conversation_threads` rows; I only confirmed the file exists and is opened from NotepadDrawer.
- Whether `WIRING_STATUS.md` line 18 is stale vs. the NotepadDrawer code (contradiction surfaced but not resolved — that's founder's judgment call).
- Guided `SendToGrid` "Message" disabled status vs. adult Notepad wired status suggests two different destinations share the label — did not confirm whether the Guided path was *supposed* to wire later.
- No git log for most-recent commit (Bash permission denied for git log in this session).

### Field 6 — Observations (no verdict)

Two code paths exist under the "Message" label: adult Notepad's NotepadDrawer.tsx:258 intercepts `destination === 'message'` and opens `ComposeFlow` with the notepad content pre-filled (`ComposeFlow.tsx` component present). Guided SendToGrid explicitly marks its Message tile as `disabled: true` with "Coming soon!" copy (line 154) and returns early (line 33). RoutingStrip registers 'message' as a valid destination with `featureKey: 'messages'` (line 102). WIRING_STATUS.md line 18 describes the destination as "Stub — PRD-15 not built," which does not match the presence of `setComposeFlowOpen(true)` in NotepadDrawer. Registry claims ✅ Wired. Evidence shows adult-path wired to component; Guided-path still disabled; WIRING_STATUS doc appears stale.

## Entry 112 — `Send to Calendar`

**Registry line:** 112
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Send to Calendar | PRD-08 | PRD-14B | ✅ Wired | Phase 14 |
```

### Field 1 — Implementation identifier

(a) Stub row does not name a concrete code identifier.
(b) `WIRING_STATUS.md` line 8 (RoutingStrip Destinations table): `| Calendar | Notepad, MindSweep, .ics import | studio_queue → calendar_events | Wired | Queue → CalendarTab approve/edit/skip + .ics file upload on /sweep |`. Names `studio_queue` + `calendar_events` + CalendarTab as the mechanism.
(d.5) WIRING_STATUS mentions `studio_queue`. Opening `src/hooks/useNotepad.ts` shows the default branch (line 581) insert into `studio_queue` with `destination` field for calendar/track/agenda/message/optimizer.

```
Source: src/hooks/useNotepad.ts:580-597 — default switch branch insert into studio_queue
Identifier: studio_queue insert with destination='calendar' (from useNotepad.routeContent)
```

### Field 2 — Code presence check

```
Grep command: pattern='calendar', path=src/hooks/useNotepad.ts
Hits: Line 53 declares destination "{ key: 'calendar', label: 'Calendar', icon: 'Calendar' }"; line 349 lists it in the AI-parse allowed destinations; line 581 comment "For calendar, track, agenda, message, optimizer — deposit to studio_queue".
Context (lines 580-597):
  default: {
    // For calendar, track, agenda, message, optimizer — deposit to studio_queue
    const { data, error } = await supabase
      .from('studio_queue')
      .insert({ family_id: familyId, owner_id: tab.member_id, destination, content, source: 'notepad', source_reference_id: tab.id })
      .select('id').single()
    ...
  }
```

### Field 3 — Wiring check

Notepad Send-to-Calendar path writes to `studio_queue` with `destination='calendar'`. CalendarTab (per WIRING_STATUS line 8) consumes `studio_queue` items to approve/edit/skip. Also lists `.ics` file upload on `/sweep` and MindSweep calendar classification as secondary inputs. Caller hook: `useNotepad.routeContent` mutation.

Most recent commit: not checked (Bash git-log denied).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Lines 8 + "Calendar Import (Phase 0)" section (around line ~190 in WIRING_STATUS) — both describe the Calendar routing path as Wired.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-14B-Cross-PRD-Impact-Addendum.md` exists.
**PlannedExpansionCard:** none found for calendar routing.
**CLAUDE.md convention mention:** Conventions 106-117 describe calendar architecture. Convention 112 explicitly says task due dates surface via direct query (not duplication into `calendar_events`), which is orthogonal to Send-to-Calendar from Notepad.

### Field 5 — What was NOT checked

- Whether CalendarTab UI actually consumes `studio_queue` rows with `destination='calendar'` — I did not open CalendarTab.tsx or its equivalent to verify the approval flow closes the loop into `calendar_events`.
- Whether .ics file import path is actively wired in `/sweep`.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`useNotepad.ts` default branch (lines 580-597) inserts into `studio_queue` with the passed `destination` field when it is one of calendar/track/agenda/message/optimizer. WIRING_STATUS.md lists Calendar as Wired via `studio_queue → calendar_events` with CalendarTab as the approval UI and `.ics` + MindSweep as secondary input paths. Registry claims ✅ Wired. Evidence shows notepad-to-queue write exists; queue-to-events consumption not verified in this session.

## Entry 114 — `Reward system integration`

**Registry line:** 114
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Reward system integration | PRD-09A | PRD-24 | ✅ Wired | Phase 29 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Reward system integration" — capability-level, no concrete identifier.
(b) WIRING_STATUS.md has no section titled "Reward system integration". The closest related section is Calendar/Tasks and the 2026-04-13 rotation/opportunity-claim sections, but none names a specific "reward" integration mechanism for the Notepad/Tasks pipe. `task_rewards` table mentioned in live_schema (0 rows).
(c) CLAUDE.md Conventions 198-222 (Play Dashboard / Gamification / Configurable Earning Strategies) are the authoritative gamification specs. Convention 198 names `roll_creature_for_completion` RPC; Convention 220 says "Gamification and allowance calculations (PRD-28) coexist — both consume `task_completions` rows independently."
(d.5) `grep 'roll_creature_for_completion' supabase/migrations` → 6 files, most recent migration `00000000100128_coloring_reveal_task_link_rpc.sql`. The RPC is the integration mechanism between task completion → gamification.

```
Source: CLAUDE.md Convention 198: "roll_creature_for_completion(p_task_completion_id UUID) is the authoritative gamification pipeline endpoint"
Source: supabase/migrations/00000000100115_play_dashboard_sticker_book.sql (migration introduces RPC)
Identifier: roll_creature_for_completion RPC + task_rewards table
```

### Field 2 — Code presence check

```
Grep command: pattern='roll_creature_for_completion', path=supabase/migrations
Hits: 6 files
Files:
  - supabase/migrations/00000000100115_play_dashboard_sticker_book.sql
  - supabase/migrations/00000000100123_rpc_fix_roll_creature_for_completion.sql
  - supabase/migrations/00000000100126_earning_strategies_color_reveal.sql
  - supabase/migrations/00000000100128_coloring_reveal_task_link_rpc.sql
  - supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql
  - supabase/migrations/00000000100134_allowance_financial.sql
```

```
Grep command: pattern='task_rewards|reward_type|reward_value', path=supabase/migrations
Hits: 4 files
Files:
  - supabase/migrations/00000000000008_tasks_lists.sql
  - supabase/migrations/00000000100023_tasks_prd09a_full.sql
  - supabase/migrations/00000000100134_allowance_financial.sql
  - supabase/migrations/00000000100139_opportunity_list_unification.sql
```

### Field 3 — Wiring check

The gamification RPC `roll_creature_for_completion` was added in migration 100115 (Play Dashboard + Sticker Book) and updated multiple times. Called from `src/hooks/useTasks.ts:304` (`rollGamificationForCompletion(completion.id)` invoked from `useCompleteTask` when `requireApproval` is false). Table `task_rewards` exists in schema (0 rows per live_schema). Allowance integration via `counts_for_allowance` flag wired in migration 100134.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No direct "Reward system integration" row; however Opportunity Claim Lock Expiration, List Victory Mode, and Task Rotation Advancement tables (lines ~130-160) describe adjacent wiring.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` exists (per earlier grep).
**PlannedExpansionCard:** not searched separately for this entry.
**CLAUDE.md convention mention:** Conventions 198-207 describe gamification pipeline in detail. Convention 224 names `counts_for_allowance` / `counts_for_homework` / `counts_for_gamification` task flags.

### Field 5 — What was NOT checked

- Whether "Reward system integration" as named in the stub specifically refers to the gamification pipeline, the allowance pipeline, or a separate unimplemented "rewards tiering" concept.
- Whether `task_rewards` table (0 rows) is actively used or legacy. Migration 100139 touches it; I did not verify current use.
- Semantic-search question: is there a reward concept separate from gamification points + allowance dollars that this stub was originally naming? (Would need mgrep per Convention 242 — not approved.)
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

CLAUDE.md Convention 198 names `roll_creature_for_completion` RPC as the authoritative gamification pipeline endpoint. Migration 100115 created it; migrations 100123/100126/100128/100130 updated it; 100134 integrated allowance tracking via `counts_for_allowance` task flag. `src/hooks/useTasks.ts:304` calls the RPC from `useCompleteTask`. Registry claims ✅ Wired. The stub's "Reward system integration" capability label is ambiguous vs. the gamification pipeline specifically. Evidence shows task-completion → gamification-points + streak + creature-roll pipeline is wired; whether this is the exact "Reward system integration" the stub originally meant is a founder-judgment call.

## Entry 115 — `Allowance pool calculation`

**Registry line:** 115
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Allowance pool calculation | PRD-09A | PRD-28 | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Allowance pool calculation" — capability-level.
(b) WIRING_STATUS.md has no "Allowance" section with a named mechanism.
(c) CLAUDE.md Convention 223 names `financial_transactions` as append-only ledger; Convention 224 names `counts_for_allowance` task flag; Convention 225 says financial tables excluded from LiLa context. None name the pool-calculation function itself.
(d) PRD-28 is the owning PRD. `prds/tracking/PRD-28-Tracking-Allowance-Financial.md` is the likely PRD path.
(d.5) `grep 'allowance'` on `src/hooks/useFinancial.ts` shows `allowance_configs`, `allowance_periods`, `calculated_amount` column, and read of "active allowance period" (line 617). No single "pool" function name surfaced.

```
Source: CLAUDE.md Convention 223-225 + src/hooks/useFinancial.ts (multiple lines reading allowance_configs / allowance_periods)
Source: supabase/migrations/00000000100134_allowance_financial.sql (allowance tables + calculated_amount column at line 188)
Identifier: allowance_configs table + allowance_periods table + calculated_amount column + useFinancial hook family
```

### Field 2 — Code presence check

```
Grep command: pattern='allowance_pool|calculate_allowance|allowance_periods|allowance_configs', path=supabase/migrations
Hits: 2 files
Files:
  - supabase/migrations/00000000100134_allowance_financial.sql (creates tables)
  - supabase/migrations/00000000100135_allowance_bonus_type.sql (bonus_type addition)
Note: zero matches for "calculate_allowance" as a function name — suggests no Postgres function with that name exists. Calculation may live in client hook rather than SQL.
```

```
Grep command: pattern='allowance', path=src/hooks
Hits: 1 file
Files:
  - src/hooks/useFinancial.ts (references allowance_configs, allowance_periods, calculated_amount, active allowance period read)
```

### Field 3 — Wiring check

Tables `allowance_configs` + `allowance_periods` created in migration 100134 with `calculated_amount DECIMAL(10,2)` column (line 188 of migration). Client hook `useFinancial.ts` reads from both tables. Status column on `allowance_periods` has states `active | makeup_window | calculated | closed` (migration 100134 line 177) — implies calculation is transition-driven rather than a named function.

Most recent commit: not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No direct "Allowance pool calculation" row.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` likely exists.
**PlannedExpansionCard:** not searched separately.
**CLAUDE.md convention mention:** Convention 223 (financial_transactions append-only), 224 (counts_for_allowance flag), 225 (financial data excluded from LiLa).

### Field 5 — What was NOT checked

- Whether there is a named Postgres function for allowance calculation (grep found none; could be in `supabase/functions/` Edge Function rather than migration SQL).
- Whether the `active → calculated → closed` status transition is driven by pg_cron, an Edge Function, or a client-side mutation.
- Whether `financial_transactions` ledger correctly sums to `calculated_amount` at the `closed` transition.
- Semantic-search question: is there an Edge Function like `allowance-calculate` or `compute-allowance-period` that I missed with keyword grep? (Convention 242 blocks mgrep.)
- Partition-file advisory flagged this entry as potentially Schema-partition if calc is a Postgres function; grep result (zero matches for function name) suggests calc is client-side and stays in this partition.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

Tables and columns exist. Migration 100134 created `allowance_configs` + `allowance_periods` with a `calculated_amount` DECIMAL column. `useFinancial` hook reads both. No Postgres function named `calculate_allowance` or `allowance_pool` found — calculation mechanism not identified from grep alone. Registry claims ✅ Wired. Advisory note in the partition file (line 210) anticipated this: "could be Schema if the calc is a Postgres function; grep will reveal which." Grep revealed no function — calc location remains ambiguous.

## Entry 116 — `Widget milestone → victory`

**Registry line:** 116
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget milestone → victory | PRD-10 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

(a) Stub row references AIR (Automatic Intelligent Routing) from PRD-11.
(b) WIRING_STATUS.md has no AIR section or widget-milestone-to-victory row.
(c) `claude/ai_patterns.md` "Automatic Intelligent Routing (AIR)" section lists `widget_milestone` as a victory source value: "Widget milestone data point | `widget_milestone` | Milestone threshold reached on a widget".
(d.5) `grep 'widget_milestone' supabase/migrations` → 2 files; migration 100102 and 000009 both list `widget_milestone` in a CHECK constraint array on the victory source enum. No trigger named for the milestone-to-victory transition.

```
Source: claude/ai_patterns.md AIR section: "Widget milestone data point | widget_milestone | Milestone threshold reached on a widget"
Source: supabase/migrations/00000000100102_list_victory_mode.sql:40 (victory source enum includes 'widget_milestone')
Source: src/types/victories.ts:13 (TS union type includes 'widget_milestone'); line 356 display label "Widget milestone"
Identifier: victory.source='widget_milestone' value; no explicit trigger/function name surfaced
```

### Field 2 — Code presence check

```
Grep command: pattern='widget_milestone', path=supabase/migrations
Hits: 2 files
Files:
  - supabase/migrations/00000000000009_remediation_schema_batch.sql:317
  - supabase/migrations/00000000100102_list_victory_mode.sql:40
Both occurrences are inside the victory source CHECK constraint array, not in a trigger body or RPC definition.
```

```
Grep command: pattern='widget_milestone', path=src
Hits: 1 file
Files:
  - src/types/victories.ts:13 (TS union type)
  - src/types/victories.ts:356 (display label)
```

```
Grep command: pattern='widget_data_points|widget.*trigger|AFTER INSERT.*widget', path=supabase/migrations
Hits: 6 files — examined PRD-10 tables migration (100033) did not show any trigger tying widget_data_points to victories.
```

### Field 3 — Wiring check

Enum/source value `widget_milestone` is accepted by the `victories` table CHECK constraint. TypeScript union type includes it. No migration grep hit showed a trigger like `AFTER INSERT ON widget_data_points` that creates a `victories` row — the value is declared but the write-path automation that sets it wasn't surfaced.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention of widget-milestone-to-victory automation.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` per earlier grep.
**PlannedExpansionCard:** not searched separately.
**CLAUDE.md convention mention:** no convention specifically naming widget-milestone-to-victory automation.

### Field 5 — What was NOT checked

- Whether a client-side hook in widgets code path writes `victories` with `source='widget_milestone'` on threshold-reached — did not grep widget hooks for `createVictory` + widget context.
- Whether PRD-10 Phase B built the widget→victory automation (milestone threshold detection) or whether it shipped as source-enum-only.
- Semantic-search question: is there a detector function like `detectMilestoneReached` or `createMilestoneVictory`? (mgrep blocked.)
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`widget_milestone` exists as a victory.source enum value in migration 100102:40 and TypeScript type (`src/types/victories.ts:13`). Grep surfaced no migration trigger automating widget_data_points → victories insertion, and no client hook named for that transition. Registry claims ✅ Wired (Phase 12, PRD-11 AIR). AI patterns doc lists it under AIR. Presence of the enum and display label is confirmed; the automation that sets `source='widget_milestone'` during runtime was not identified.

## Entry 117 — `Auto-victory from task completions`

**Registry line:** 117
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Auto-victory from task completions | PRD-11 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

(a) Stub references AIR again.
(c) `claude/ai_patterns.md` AIR table: "Task completion | `task_completion` | Task marked complete".
(d.5) `grep 'source: 'task_completion'` in src → one TODO comment at `src/components/tasks/useTaskCompletion.ts:108`: `// if (task.victory_flagged) { create_victory({ source: 'task_completion', source_reference_id: task.id }) }`. `grep 'source: 'task_completed'` (with past-tense 'd') → `src/components/victories/VictorySuggestions.tsx:83` + `src/hooks/useTasks.ts:325` (latter is in homeschool_time_logs insert, not victory insert).

```
Source: src/components/tasks/useTaskCompletion.ts:108 (commented-out TODO) + src/components/victories/VictorySuggestions.tsx:83 (manual claim from suggestion scan)
Identifier: victory-from-task is MANUAL via VictorySuggestions (scan-and-claim UI), not automatic on completion
```

### Field 2 — Code presence check

```
Grep command: pattern="source: 'task_completed'", path=src, output_mode=content
Hits: 2 (same grep showed 'list_item_completed' / 'list_completed' as separate values)
Files:
  - src/pages/Lists.tsx:1521 "source: 'list_item_completed'"
  - src/pages/Lists.tsx:1537 "source: 'list_completed'"
  - src/components/victories/VictorySuggestions.tsx:83 "source: 'task_completed'"
  - src/hooks/useTasks.ts:325 "source: 'task_completed'" — confirmed inside homeschool_time_logs insert, NOT a victory insert
```

```
Grep command: pattern='victory_flagged', path=src
Hits: 15+ references across useTaskCompletion.ts, useTasks.ts, Tasks.tsx, Lists.tsx, useSequentialCollections.ts, types files.
useTaskCompletion.ts comment at line 8 says "Create victory if victory_flagged (stub — PRD-11)"; line 106-108 has commented-out auto-create.
```

```
Grep command: pattern='task_completion.*victor|victor.*task_complet|auto_victor', output_mode=files_with_matches
Hits: 22 files, none showing a trigger or hook that auto-creates a victory on task_completions INSERT.
```

### Field 3 — Wiring check

VictorySuggestions.tsx scans activity log for completed-task signals and presents "suggested victories" the user then claims explicitly — this is suggest-not-auto. useTaskCompletion.ts has a TODO comment at lines 6-8 + 106-108 that explicitly describes the auto-create as a "(stub — PRD-11)". No migration trigger found that creates `victories` rows from `task_completions` inserts.

Secondary wired pathway: Lists.tsx lines 1521/1537 DO auto-create victories on `list_item_completed` and `list_completed` (with `victory_flagged=true` items), per the PRD-09B List Victory Mode build. That's adjacent but not the task-completion path.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** "List Victory Mode (PRD-09B)" section (lines ~170-180) describes list-side auto-victories. No row describes auto-victory from task completions.
**Cross-PRD addendum mentions:** not specifically searched for this capability.
**PlannedExpansionCard:** none for task-auto-victory.
**CLAUDE.md convention mention:** Convention 117 mentions "Events by mom auto-approved" but that's about calendar events, unrelated.

### Field 5 — What was NOT checked

- Whether `useApproveTaskCompletion` or `useApproveCompletion` (the approval path) creates a victory — did not open those hooks.
- Whether `useSequentialCollections.ts` (which also has `victory_flagged: false` at lines 160, 412) has a completion-victory flow.
- Whether any pg trigger exists on `task_completions` INSERT — did not grep for `AFTER INSERT ON task_completions`.
- Semantic question: is "Auto-victory" in the stub a shorthand for VictorySuggestions scan-and-suggest UX, not a strict "auto" trigger? (Founder judgment.)

### Field 6 — Observations (no verdict)

`useTaskCompletion.ts` lines 6-8 + 106-108 has a commented-out auto-victory create with an explicit "(stub — PRD-11)" note; the surrounding code does NOT uncomment or inline the call. `VictorySuggestions.tsx:83` presents completed tasks as suggested victories for user claim (manual accept). Lists.tsx lines 1521/1537 DO auto-create victories for list-item / list-completion when `victory_flagged=true`. Registry claims ✅ Wired for tasks specifically. Evidence shows list-side auto-victory wired; task-side remains a stub TODO in the hook file; VictorySuggestions offers a scan-and-claim suggestion UX as an alternative surface.

## Entry 119 — `Complex goal → Project Planner`

**Registry line:** 119
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Complex goal → Project Planner | PRD-12A | PRD-29 | ✅ Wired | Phase 33 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Project Planner" — this is the BigPlans PRD (PRD-29).
(d) `prds/` glob did not find a BigPlans directory or source tree files. Route defined in `src/App.tsx:177`.
(d.5) `src/App.tsx:177` references `BigPlansPage`; `src/pages/placeholder/index.tsx:58-60` defines `BigPlansPage` as a `<PlaceholderPage>` with prd="PRD-29" and featureKey="bigplans_create".

```
Source: src/pages/placeholder/index.tsx:58-60 — "export function BigPlansPage() { return <PlaceholderPage title='BigPlans' ... prd='PRD-29' featureKey='bigplans_create' /> }"
Identifier: BigPlansPage placeholder; no real implementation
```

### Field 2 — Code presence check

```
Grep command: pattern='BigPlansPage', path=src
Hits: 3 files
Files:
  - src/App.tsx (route registration)
  - src/pages/placeholder/index.tsx:58-60 (PlaceholderPage definition)
  - src/features/permissions/ViewAsModal.tsx (reference in feature list)
```

```
Grep command: pattern='plans|plan_milestones|BigPlans', path=supabase/migrations
Hits: 4 files — all existing migrations reference `related_plan_id` foreign key stubs or seed PRD-29 placeholders. No `plans` or `plan_milestones` CREATE TABLE statements.
```

```
Grep command: pattern='related_plan_id', path=src
Hits: src/types/tasks.ts:285 ("related_plan_id: string | null"); src/hooks/useJournal.ts (column reference only).
Only stub FK column exists on tasks and journal_entries.
```

### Field 3 — Wiring check

BigPlansPage is a `<PlaceholderPage>` with no real project-planner UI. No `plans` or `plan_milestones` tables in migrations. FK column `related_plan_id` exists on tasks + journal_entries as stubbed forward-compatibility only.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No BigPlans section.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md` listed in feature_glossary.md.
**PlannedExpansionCard:** `feature_expansion_registry.ts` has `bigplans` entries per earlier grep.
**CLAUDE.md convention mention:** no numbered convention for BigPlans.

### Field 5 — What was NOT checked

- Whether PlaceholderPage renders a PlannedExpansionCard via feature_expansion_registry.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

BigPlansPage is a placeholder component at `src/pages/placeholder/index.tsx:58-60` with prd="PRD-29" and featureKey="bigplans_create". Route registered in App.tsx:177. No `plans` or `plan_milestones` tables exist in migrations. The `tasks.related_plan_id` column exists as a stub FK. Registry claims ✅ Wired Phase 33. Evidence shows only a placeholder page and stub FK column — no BigPlans functionality.

## Entry 120 — `Family Vision Quest discussions`

**Registry line:** 120
**Claimed status:** `🔗 Partial (audio stub)`
**Full registry row:**
```
| Family Vision Quest discussions | PRD-12B | PRD-12B | 🔗 Partial (audio stub) | Phase 22 |
```

### Field 1 — Implementation identifier

(a) Stub row says "audio stub" — a specific sub-capability. No concrete identifier named.
(c) CLAUDE.md has no convention specific to Vision Quest.
(d) PRD-12B is `prds/personal-growth/PRD-12B-Family-Vision-Quest.md` (per grep).
(d.5) `grep 'vision_section_discussions' across repo` → 14 files, including `supabase/migrations/00000000000007_lila_ai_system.sql` + `00000000000013_lila_schema_remediation.sql` (seeds the table), `claude/feature_glossary.md` (registers the table), `src/config/feature_expansion_registry.ts`, `src/lib/ai/context-assembly.ts` (stub in context loader). No `src/pages/` or `src/features/` file for Family Vision Quest surfaced in glob `FamilyVision*`.

```
Source: supabase/migrations/00000000000007_lila_ai_system.sql (table seed) + feature_glossary.md
Identifier: vision_section_discussions table (exists); no UI page/component surfaced in src/
```

### Field 2 — Code presence check

```
Grep command: pattern='vision_section_discussions|family_vision_quest'
Hits: 14 files; UI-side files are context-assembly stub + feature_expansion_registry (PlannedExpansionCard) only.
```

```
Glob command: src/pages/FamilyVision*.tsx / **/family-vision/**
Hits: 0 UI directories or pages.
```

### Field 3 — Wiring check

Table schema exists per feature_glossary ("vision_section_discussions"). No page, no hook named `useFamilyVision*`, no component directory. feature_expansion_registry.ts and lib/ai/context-assembly.ts reference the feature, consistent with stub-level surface only.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No Family Vision Quest section.
**Cross-PRD addendum mentions:** none surfaced in this grep.
**PlannedExpansionCard:** present via feature_expansion_registry.ts per earlier grep.
**CLAUDE.md convention mention:** None specifically.

### Field 5 — What was NOT checked

- Whether `src/pages/placeholder/index.tsx` has a `FamilyVisionPage` / `VisionQuestPage` placeholder entry like BigPlansPage. Did not open placeholder/index.tsx in full.
- Whether the "audio stub" specifically refers to voice-recording of discussion responses (which would point to `whisper-transcribe` Edge Function) or to a different audio feature.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

Table `vision_section_discussions` exists in migration seed and feature_glossary. No source-tree page or hook named for Family Vision Quest surfaced in `src/pages/`, `src/hooks/`, or `src/features/` via glob. feature_expansion_registry + context-assembly stubs corroborate post-MVP surface. Registry claims 🔗 Partial (audio stub). Evidence is consistent with table-only + PlannedExpansionCard stub; "discussions" UI not surfaced.

<!-- PROGRESS MARKER: completed entries 111, 112, 114, 115, 116, 117, 119, 120 (8 of 39); integrity check pending -->

## Entry 129 — `Family Meeting Notes structured routing`

**Registry line:** 129
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Family Meeting Notes structured routing | PRD-13 | PRD-16 (Build P) | ✅ Wired | 2026-04-15 — Meeting summaries auto-save to `journal_entries` with `entry_type='meeting_notes'` on Save & Close |
```

### Field 1 — Implementation identifier

(a) Stub row names `journal_entries` table, `entry_type='meeting_notes'` value, and "Save & Close" flow as the mechanism. Level (a).

```
Source: stub entry line 129
Identifier: entry_type='meeting_notes' on journal_entries + completeMeeting save flow
```

### Field 2 — Code presence check

```
Grep command: pattern='entry_type.*meeting_notes|meeting_notes', path=src, output_mode=content
Hits: 6
Files:
  - src/hooks/useJournal.ts:6 "type JournalEntryType = ... | 'meeting_notes' | 'transcript'"
  - src/hooks/useJournal.ts:32 "{ value: 'meeting_notes', label: 'Meeting Notes' }"
  - src/lib/meetings/completeMeeting.ts:7 "3. Auto-save summary as a journal entry (entry_type='meeting_notes')"
  - src/lib/meetings/completeMeeting.ts:54 comment "3. Auto-save summary as journal entry (meeting_notes)"
  - src/lib/meetings/completeMeeting.ts:61 "entry_type: 'meeting_notes',"
  - src/lib/meetings/completeMeeting.ts:63 "tags: ['meeting_notes', meeting.meeting_type],"
  - src/components/shared/RoutingStrip.tsx:90 "{ key: 'meeting_notes', label: 'Meeting Notes' }"
```

### Field 3 — Wiring check

`completeMeeting.ts` is the primary wire: meeting Save & Close flow inserts a `journal_entries` row with `entry_type='meeting_notes'` + tags array `['meeting_notes', meeting.meeting_type]`. `useJournal` registers it as a valid entry_type with display label.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically searched for this entry, but convention 239 + 240 cover the wiring.
**Cross-PRD addendum mentions:** PRD-16-Meetings.md is source.
**PlannedExpansionCard:** not applicable.
**CLAUDE.md convention mention:** Convention 239: "Meeting summaries auto-save to journal with `entry_type='meeting_notes'` on Save & Close. Automatic, not user-triggered." Matches stub.

### Field 5 — What was NOT checked

- Whether existing journal_entries rows with `entry_type='meeting_notes'` actually exist in live DB (would need SQL access).
- Whether `PostMeetingReview.tsx` (seen in earlier grep) also triggers the save or only `completeMeeting.ts`.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`completeMeeting.ts` lines 54-63 inserts a journal_entries row with `entry_type='meeting_notes'` and tags including the meeting_type, during meeting Save & Close. `useJournal` registers the entry_type. CLAUDE.md Convention 239 codifies the behavior. Registry claims ✅ Wired 2026-04-15 (Build P). Evidence aligns.

## Entry 130 — `Partner Profile aggregation in Archives`

**Registry line:** 130
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Partner Profile aggregation in Archives | PRD-13 | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (PRD-19) |
```

### Field 1 — Implementation identifier

(a) Stub row does not name a concrete identifier; only capability ("Partner Profile aggregation").
(b) WIRING_STATUS.md has no matching section.
(c) CLAUDE.md has no convention naming Partner Profile aggregation.
(d) PRD-19 (Family Context & Relationships) owns the wiring target. Relevant table per feature_glossary: `relationship_notes` (PRD-19 scope).
(d.5) Lookup inside `relationship_notes` — it's a migration-seeded table in `lila_ai_system.sql` and `thoughtsift_tables.sql`, but `grep 'partner_profile|Partner Profile' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY — no concrete "Partner Profile aggregation" implementation identifier found.
Sources checked:
  (a) stub line 130 — no identifier named
  (b) WIRING_STATUS.md — no Partner Profile row
  (c) CLAUDE.md conventions — no match
  (d) PRD-19 owns this; feature_glossary lists `relationship_notes` + `private_notes` + `member_documents` as PRD-19 tables, but none named "partner_profile_aggregation"
```

### Field 2 — Code presence check

skipped — no concrete identifier to grep for. Related-table grep for `partner_profile` (src) returned zero. `relationship_notes` table has 3 migration files but none show aggregation logic.

### Field 3 — Wiring check

skipped — no concrete identifier.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not specifically checked; PRD-19 Cross-PRD addendum exists per PRE_BUILD_PROCESS.md table.
**PlannedExpansionCard:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether PRD-19 defines a specific partner_profile view or aggregation query.
- Semantic-search question: "does any existing code aggregate across relationship_notes + archive_context_items under a partner-focused view?" — mgrep would help; Convention 242 blocks.
- Whether Archives page has a "Partner Profile" section that is a stub renderer.

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. No implementation identifier found. Flagged for founder-judgment bucket. Registry claims ⏳ Unwired (MVP) at Phase 20 (PRD-19) — PRD-19 itself is not yet built per STUB_REGISTRY references, so the "Unwired" claim is consistent with the absence of any aggregation code.

## Entry 134 — `Monthly victory auto-archive`

**Registry line:** 134
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Monthly victory auto-archive | PRD-13 | PRD-11 | 📌 Post-MVP | PRD-11 enhancement |
```

### Field 1 — Implementation identifier

(a) No concrete identifier in stub.
(b) WIRING_STATUS.md: none.
(c) CLAUDE.md: none.
(d) PRD-11 owns; PRD-13 created. `grep 'monthly.*archive|auto_archive_victor'` surfaced only doc files — no implementation.

```
Identifier: CAPABILITY-ONLY — no concrete implementation identifier.
Sources checked: stub row, WIRING_STATUS, CLAUDE.md conventions, PRD doc files — all capability descriptions only.
```

### Field 2-4

Skipped — no identifier to grep for.

### Field 5 — What was NOT checked

- Whether a pg_cron monthly job exists in any migration targeting `victories` for archival — would need broader grep.
- Whether `monthly-aggregate` Edge Function (mentioned in architecture.md) has a victory-archive component.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP. No implementation code grep hits. Consistent with Post-MVP status.

## Entry 135 — `Seasonal Family Overview prompts`

**Registry line:** 135
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Seasonal Family Overview prompts | PRD-13 | PRD-18 | 📌 Post-MVP | Rhythm PRD |
```

### Field 1 — Implementation identifier

(a) No concrete identifier named.
(b)-(d) None surfaced.
`grep 'seasonal.*overview|seasonal_prompt' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `reflection_prompts` table has a seasonal-tag column or seeded seasonal rows — did not open the table.
- PRD-18 Rhythms Phase B/C/D did not surface seasonal-prompt wiring.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP. Grep returned zero implementation hits. Consistent.

## Entry 136 — `Archive full-text search`

**Registry line:** 136
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Archive full-text search | PRD-13 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'archive.*search|fts_archive|searchArchive|useArchiveSearch'` → 1 file (`src/data/lanterns-path-data.ts`, likely unrelated label). No hook or function named for this.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `archive_context_items` has an `fts_document tsvector` column (migration check not opened).

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Zero implementation grep hits. Consistent.

## Entry 137 — `Dad edit access in Archives`

**Registry line:** 137
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Dad edit access in Archives | PRD-13 | — | 📌 Post-MVP | Read-only at MVP |
```

### Field 1 — Implementation identifier

(a) No concrete identifier; row text says "Read-only at MVP" — policy rather than implementation name.
(c) CLAUDE.md mentions dad-role access in numerous conventions but none naming a specific archive-edit mechanism for additional_adult.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped (but note: Archives RLS policies per migration `prd13_archives_context.sql` would be the authoritative answer for the read-only-dad policy — not opened).

### Field 5 — What was NOT checked

- Whether RLS policies on `archive_folders` / `archive_context_items` grant `additional_adult` role WRITE access — would need to open migration 100035 and read policy definitions.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP with "Read-only at MVP" note. RLS-level verification deferred.

## Entry 140 — `Context presets / smart modes`

**Registry line:** 140
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Context presets / smart modes | PRD-13 | PRD-05C | 📌 Post-MVP | PRD-05C enhancement |
```

### Field 1 — Implementation identifier

(a) Stub row names "Context presets" — matches table name `context_presets`.
(b) WIRING_STATUS.md: no section.
(c) CLAUDE.md: none specifically.
(d) live_schema.md marks `context_presets` as "not API-exposed" (table exists in DB but not in PostgREST schema cache).

```
Source: claude/live_schema.md — "context_presets — not API-exposed"
Source: supabase/migrations/00000000000007_lila_ai_system.sql (seeds the table)
Identifier: context_presets table (exists, not API-exposed)
```

### Field 2 — Code presence check

```
Grep command: pattern='context_presets', output_mode=files_with_matches
Hits: 10 files — all in schema dumps, feature_glossary, migrations (seed), PRD-05C, audit docs. None in src/components/ or src/hooks/ UI code.
```

### Field 3 — Wiring check

Table exists per migration. No UI hook or component surfaced. Not exposed via PostgREST API.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-05C (LiLa Optimizer) is the Wired By target.
**PlannedExpansionCard:** not separately searched.
**CLAUDE.md convention mention:** none direct.

### Field 5 — What was NOT checked

- Whether PRD-05C build added any UI surface for context_presets — did not open PRD-05C feature decision file.

### Field 6 — Observations (no verdict)

Table exists in migrations but not API-exposed. No UI references. Registry claims 📌 Post-MVP. Consistent — table-only, no runtime surface.

## Entry 150 — `Push notification delivery`

**Registry line:** 150
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Push notification delivery | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No identifier in row.
(c) CLAUDE.md Convention 144: "NotificationBell lives in shell headers... Reuses BreathingGlow when unread > 0. Bell shows 'what happened' (awareness)." But this is in-app bell, not push.
`grep 'push_notification|webpush|serviceWorker.*push|pushSubscription' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `notifications.delivery_method` column (per live_schema) ever takes a 'push' value and whether a dispatch function exists.

### Field 6 — Observations (no verdict)

Capability-only entry. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 152 — `Out of Nest SMS notifications`

**Registry line:** 152
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Out of Nest SMS notifications | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'sms|twilio|phone.*send.*notif' path=src` → only 1 hit in ChildAllowanceConfig.tsx (unrelated to SMS delivery).
`grep 'out_of_nest.*sms'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `out_of_nest_members.phone` column is surfaced in any compose path beyond settings — partial check only.
- Whether an Edge Function like `send-sms` exists in `supabase/functions/` — did not glob Edge Functions.

### Field 6 — Observations (no verdict)

Capability-only. Zero relevant grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 153 — `Out of Nest compose picker`

**Registry line:** 153
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Out of Nest compose picker | PRD-15 | PRD-15 Phase E | ⏳ Unwired (MVP) | `useMessagingPermissions` only reads `family_members`. Extension point: fetch from `out_of_nest_members` table too and merge results. Per Tenise (2026-04-06), Out of Nest ranks **higher** than Special Adults in picker priority. See TODO comment in `src/hooks/useMessagingPermissions.ts`. |
```

### Field 1 — Implementation identifier

(a) Stub row names `useMessagingPermissions` hook and `out_of_nest_members` table by name + TODO location. Level (a) with multiple identifiers.

```
Source: stub line 153
Identifiers:
  - useMessagingPermissions hook (src/hooks/useMessagingPermissions.ts)
  - out_of_nest_members table
  - TODO comment inside the hook
```

### Field 2 — Code presence check

```
Grep command: pattern='useMessagingPermissions', path=src
Hits: file exists at src/hooks/useMessagingPermissions.ts.
```

Read of `src/hooks/useMessagingPermissions.ts` lines 57-64 shows the TODO block verbatim:

```
// TODO (Out of Nest messaging, PRD-15 Phase E): When Out of Nest messaging
// is built, this hook must ALSO fetch from the `out_of_nest_members` table
// and merge the results — they are a separate contact source, not part of
// `family_members`. Per Tenise (2026-04-06), Out of Nest members are higher
// priority than Special Adults in the compose picker — surface them as a
// first-class group, not an afterthought. The merge likely needs a new
// `contactSource: 'family' | 'out_of_nest'` field on PermittedContact so
// the UI can render them distinctly.
```

Line 65-67 shows the current filter: `activeMembers = allMembers.filter(m => m.is_active && !m.out_of_nest && m.id !== memberId)` — explicitly excludes `out_of_nest=true` rows from `family_members`, with no merge from `out_of_nest_members` table.

### Field 3 — Wiring check

Hook currently reads only `family_members` via `useFamilyMembers(familyId)` and filters out `out_of_nest` flag. `out_of_nest_members` table not queried in this hook. TODO block at lines 57-64 is the exact extension point. Caller: `useCanMessage` at lines 120-125 delegates to `useMessagingPermissions`. UI callers not traced in this packet.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically searched but not expected — TODO-based stubs usually aren't in WIRING_STATUS.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md` surfaced earlier.
**PlannedExpansionCard:** not applicable.
**CLAUDE.md convention mention:** Convention 142 ("Out of Nest members live in `out_of_nest_members`, NOT `family_members`") and Convention 147 (Content Corner) corroborate the table separation. Convention 140 describes messaging permission architecture.

### Field 5 — What was NOT checked

- Whether any ComposeFlow UI reads from `out_of_nest_members` directly, bypassing `useMessagingPermissions` — would need to grep ComposeFlow.tsx.
- Whether PRD-15 Phase E has a feature-decision file already.

### Field 6 — Observations (no verdict)

`src/hooks/useMessagingPermissions.ts` lines 57-64 contains a TODO block matching the stub registry description verbatim (mentions PRD-15 Phase E, `out_of_nest_members` table merge, Tenise 2026-04-06 priority note, Special Adult ranking). Current implementation reads only `family_members` and excludes `out_of_nest` rows (line 66). Registry claims ⏳ Unwired (MVP). Evidence aligns.

## Entry 154 — `Morning digest/Daily Briefing`

**Registry line:** 154
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Morning digest/Daily Briefing | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'morning_digest|daily_briefing|DailyBriefing'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether Rhythms "Morning Check-in" (teen) or "Morning Rhythm" (adult) in PRD-18 Phase B/C/D counts as the morning-digest surface under a different name. Convention 169-196 cover rhythms morning seeds.

### Field 6 — Observations (no verdict)

Capability-only. Zero grep hits for this specific term. Registry claims 📌 Post-MVP. Partition-file note that Rhythms Phase B-D did ship morning rhythm cards; whether "Morning digest/Daily Briefing" is a separate concept or the same thing under a different name is a founder-judgment call.

## Entry 155 — `Meeting gamification connection`

**Registry line:** 155
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Meeting gamification connection (attendance streaks, facilitator badges) | PRD-16 | PRD-24 | ⏳ Unwired (MVP) | Schema supports facilitator_member_id; gamification pipeline not connected |
```

### Field 1 — Implementation identifier

(a) Stub row names `facilitator_member_id` column + "gamification pipeline" as the connection point.

```
Source: stub line 155
Identifier: facilitator_member_id column on meetings table + (disconnected) gamification pipeline (roll_creature_for_completion)
```

### Field 2 — Code presence check

```
Grep command: pattern='facilitator_member_id|meeting.*gamification|meeting.*streak'
Hits: 9 files
Files:
  - src/types/meetings.ts
  - src/components/meetings/StartMeetingModal.tsx
  - src/hooks/useMeetings.ts
  - supabase/functions/lila-chat/index.ts
  - supabase/migrations/00000000100146_meetings.sql (column definition line 18)
  - prds/communication/PRD-16-Meetings.md
  - claude/feature-decisions/PRD-16-Meetings.md
Migration 100146 line 18: "facilitator_member_id UUID REFERENCES public.family_members(id), -- family council facilitator"
```

No grep hits for `meeting.*streak` in source — streak/gamification tie-in to meetings not found.

### Field 3 — Wiring check

Column exists in `meetings` table. UI uses it for family council facilitator assignment. No code path surfaces that increments gamification points or streaks on meeting completion. `roll_creature_for_completion` RPC is keyed to `task_completions`, not meetings.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** Conventions 229-240 cover Meetings architecture; no convention ties meetings to gamification.

### Field 5 — What was NOT checked

- Whether PRD-16 Build P verification table flagged this as Stubbed or Missing.
- Whether any meeting_completion → gamification RPC variant exists.

### Field 6 — Observations (no verdict)

`facilitator_member_id` column is present in migration 100146 and used in code. No meeting-to-gamification pipeline found. Registry claims ⏳ Unwired (MVP) with note "Schema supports facilitator_member_id; gamification pipeline not connected." Evidence aligns.

## Entry 157 — `Meeting voice input/recording (Record After)`

**Registry line:** 157
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Meeting voice input/recording (Record After) | PRD-16 (Build P) | — | 📌 Post-MVP | Premium tier, voice recording for meetings |
```

### Field 1 — Implementation identifier

(a) Stub row names "Record After" as a mode name.
(d.5) StartMeetingModal.tsx:151 shows `mode === 'record_after'` as a selectable option. Opening didn't reveal MediaRecorder / audio capture wiring.

```
Source: src/components/meetings/StartMeetingModal.tsx:151 — mode selector with 'record_after' value
Identifier: `mode='record_after'` in meetings schema and UI; no voice-capture implementation
```

### Field 2 — Code presence check

```
Grep command: pattern='record_after|Record After', path=src
Hits: 7 files (MeetingsPage.tsx, meetings types, StartMeetingModal.tsx, help-patterns, completeMeeting.ts, MeetingHistoryView.tsx, MeetingConversationView.tsx).
StartMeetingModal shows radio card UI for 'record_after' mode.
```

```
Grep command: pattern='voice.*record|MediaRecorder|audio.*record', path=src/components/meetings
Hits: 0 — no voice-capture component in meetings directory.
```

### Field 3 — Wiring check

`mode` column in `meetings` table accepts 'record_after' value (per migration 100146:17 CHECK constraint). UI renders a mode-selector card. No voice-capture plumbing attached.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** none naming voice-recording for meetings specifically.

### Field 5 — What was NOT checked

- Whether `whisper-transcribe` Edge Function is linkable from the meeting flow — not opened.
- Whether Voice input is wired elsewhere (it is, per Convention 59 — Notepad/LiLa have voice input via `useVoiceInput` hook) and might be re-usable for meetings.

### Field 6 — Observations (no verdict)

Meeting `mode='record_after'` is selectable in StartMeetingModal.tsx:151 and stored on meetings table. No audio-capture code in `src/components/meetings`. Registry claims 📌 Post-MVP "Premium tier, voice recording for meetings." Evidence aligns with the mode-only (no voice) claim.

## Entry 158 — `Meeting transcription + Review & Route from voice`

**Registry line:** 158
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Meeting transcription + Review & Route from voice | PRD-16 (Build P) | — | 📌 Post-MVP | Requires voice recording pipeline |
```

### Field 1 — Implementation identifier

(a) Capability — depends on entry 157 first (voice recording).

```
Identifier: CAPABILITY-ONLY (dependent on entry 157)
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `whisper-transcribe` Edge Function has a meeting-mode parameter.

### Field 6 — Observations (no verdict)

Capability-only dependent on entry 157. Registry claims 📌 Post-MVP. Consistent.

## Entry 159 — `Goals routing destination from meeting action items`

**Registry line:** 159
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Goals routing destination from meeting action items | PRD-16 (Build P) | PRD-29 (BigPlans) | ⏳ Unwired (MVP) | Goals disabled in compact routing strip until BigPlans built |
```

### Field 1 — Implementation identifier

(a) Stub names "compact routing strip" + "Goals" destination. RoutingStrip is the component.
(d.5) `src/components/shared/RoutingStrip.tsx:132` — `meeting_action: ['tasks', 'best_intentions', 'calendar', 'list', 'backburner', 'skip']`. "goals" is absent from this array.

```
Source: src/components/shared/RoutingStrip.tsx:132 — meeting_action destination array
Identifier: absence of 'goals' from meeting_action destinations array
```

### Field 2 — Code presence check

```
Grep command: pattern='meeting_action', path=src
Hits: 8 files (Tasks.tsx, TaskCreationModal.tsx, PostMeetingReview.tsx, completeMeeting.ts, types/tasks.ts, SortTab.tsx, RoutingStrip.tsx, BatchCard.tsx).
RoutingStrip.tsx:27 declares 'meeting_action' as a context type.
RoutingStrip.tsx:132 lists destinations — 'goals' is NOT in the array.
```

### Field 3 — Wiring check

Meeting action items route through `meeting_action` context, which excludes 'goals'. Post-meeting review uses this context, so goals cannot be a destination choice.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically.
**CLAUDE.md convention mention:** Convention 231: "Action items ALWAYS route through Studio Queue with source='meeting_action'" — consistent.

### Field 5 — What was NOT checked

- Whether PRD-29 (BigPlans) build will add 'goals' to `meeting_action` destination array or whether a new context type is planned.

### Field 6 — Observations (no verdict)

RoutingStrip.tsx:132 `meeting_action` destinations array does not include 'goals'. Registry's "Goals disabled in compact routing strip until BigPlans built" aligns. BigPlans (PRD-29) itself is a placeholder page per entry 119.

## Entry 160 — `LiLa section suggestions for custom templates`

**Registry line:** 160
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa section suggestions for custom templates | PRD-16 (Build P) | — | ⏳ Unwired (MVP) | Full Magic tier; simple text generation at launch |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'lila.*section.*suggestion|suggest.*meeting.*section'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether PRD-16 Build P verification table mentions this stub explicitly.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims ⏳ Unwired (MVP) Full Magic tier. Consistent.

## Entry 161 — `Family council voting system`

**Registry line:** 161
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Family council voting system | PRD-16 (Build P) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'council.*vote|voting_system|family_vote'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether any schema has a `votes` / `member_votes` table — did not broader-search.

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Consistent.

## Entry 162 — `"Refer back to decisions" cross-conversation intelligence`

**Registry line:** 162
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| "Refer back to decisions" cross-conversation intelligence | PRD-16 (Build P) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'refer.*back.*decision|cross_conversation_intel'` → 2 files (CLAUDE.md and LESSONS_LEARNED.md) — no implementation in src/.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `lila_conversations.context_snapshot` JSONB has a cross-conversation reference mechanism.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

<!-- PROGRESS MARKER: completed entries 111-162 subset (20 of 39); registry integrity check at 547 confirmed -->

## Entry 166 — `MindSweep approval learning`

**Registry line:** 166
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| MindSweep approval learning | PRD-17B | PRD-17B | ✅ Wired | Phase 18 |
```

### Field 1 — Implementation identifier

(a) Stub references PRD-17B's MindSweep. Capability name "approval learning" maps to `mindsweep_approval_patterns` table (per grep).
(d.5) `useMindSweep.ts:529` confirms insert into `mindsweep_approval_patterns`.

```
Source: src/hooks/useMindSweep.ts:529 — ".from('mindsweep_approval_patterns').insert({ ... })"
Identifier: mindsweep_approval_patterns table + useMindSweep approval-insert mutation
```

### Field 2 — Code presence check

```
Grep command: pattern='mindsweep_approval_patterns|approval_patterns', output_mode=files_with_matches
Hits: 14 files
Files (selected):
  - src/hooks/useMindSweep.ts:529 (insert mutation)
  - supabase/migrations/00000000100089_mindsweep_tables.sql (CREATE TABLE)
  - claude/feature-decisions/PRD-17B-MindSweep*.md
  - prds/communication/PRD-17B-MindSweep.md
```

Context (useMindSweep.ts:519-540):
```
mutationFn: async (params: {
  familyId: string; memberId: string; contentCategory: string;
  actionTaken: 'approved_unchanged' | 'approved_edited' | 'rerouted' | 'dismissed';
  suggestedDestination: string | null; actualDestination: string | null
}) => {
  const { error } = await supabase.from('mindsweep_approval_patterns').insert({ ... })
}
```

### Field 3 — Wiring check

Mutation inserts pattern row with action_taken + content_category + suggested/actual destinations. Table created in migration 100089 (PRD-17B MindSweep tables). Pattern rows would feed future classifier improvement (platform intelligence Channel J, per ai_patterns.md).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** `mindsweep_approval_patterns` table appears in live_schema.md note (not API-exposed for that table? — check: the table is in `mindsweep_approval_patterns` which live_schema.md marks "not API-exposed").
**Cross-PRD addendum mentions:** PRD-17B own PRD.
**CLAUDE.md convention mention:** Convention 180-182 describe MindSweep-Lite (rhythm-embedded) reusing `mindsweep-sort`; not specifically the approval-learning write-back.

### Field 5 — What was NOT checked

- Whether the client hook is actually called from a real user flow (approval UI) — didn't trace to SortTab.tsx / CalendarTab.tsx approval buttons.
- Whether the recorded patterns feed a downstream classifier.

### Field 6 — Observations (no verdict)

Insert mutation exists at useMindSweep.ts:529, writes to `mindsweep_approval_patterns` with four action_taken variants. Table seeded in migration 100089. Registry claims ✅ Wired Phase 18. Evidence shows write-path exists; consumption path not traced.

## Entry 167 — `Weekly MindSweep intelligence report`

**Registry line:** 167
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Weekly MindSweep intelligence report | PRD-17B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'weekly.*mindsweep|mindsweep.*weekly.*report|mindsweep.*intelligence'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `mindsweep_approval_patterns` aggregation query would form the report data source.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 174 — `Reflection export as document`

**Registry line:** 174
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Reflection export as document | PRD-18 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'reflection.*export|export.*reflection' path=src` → 2 files, both false-positive (`apology_reflection` subtype string match).

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `reflection_responses` table has a serialization hook somewhere — did not grep that table name.
- Whether Convention 174 "Weekly/Monthly reflection prompts are frontend constants" implies there's no DB source to export from (design decision).

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 187 — `PRD-18 Phase C: MindSweep-Lite delegate disposition → real family_request`

**Registry line:** 187
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase C: MindSweep-Lite `delegate` disposition → real `family_request` | PRD-18 Phase C (Build L) | PRD-18 Phase C follow-up (Build L.1) | ✅ Wired | 2026-04-07 (passes real `family_member_names` to `mindsweep-sort`, promotes cross-member `suggest_route` results to `family_request` disposition, inserts into PRD-15 `family_requests` with `source='mindsweep_auto'` via `commitMindSweepLite`) |
```

### Field 1 — Implementation identifier

(a) Stub row names `commitMindSweepLite`, `mindsweep-sort`, `family_requests` table, `source='mindsweep_auto'`, and `suggest_route` action. Level (a) — multiple identifiers.

```
Source: stub line 187
Identifiers:
  - commitMindSweepLite function (src/lib/rhythm/commitMindSweepLite.ts)
  - mindsweep-sort Edge Function
  - family_requests table with source='mindsweep_auto'
  - cross_member_action='suggest_route' promotion logic
  - family_member_names payload parameter
```

### Field 2 — Code presence check

```
Grep command: pattern='commitMindSweepLite|family_request.*mindsweep|suggest_route.*family_request', output_mode=files_with_matches
Hits: 14 files
Relevant source files:
  - src/lib/rhythm/commitMindSweepLite.ts (main)
  - src/components/rhythms/sections/MindSweepLiteSection.tsx (adult)
  - src/components/rhythms/sections/MindSweepLiteTeenSection.tsx (teen, per Convention 192/197)
  - src/components/rhythms/RhythmModal.tsx
  - src/components/rhythms/RhythmMetadataContext.tsx
```

First-context window (commitMindSweepLite.ts lines 190-220):
```
case 'family_request': {
  // MindSweep-Lite delegate disposition into PRD-15's family_requests
  ...
  if (item.disposition === 'family_request' && !item.recipient_member_id) { ... }
  throw new Error('family_request missing recipient_member_id')
  ...
  .from('family_requests')
  ... source: 'mindsweep_auto' ...
  return { id: data.id as string, type: 'family_request' }
}
```

Line 24 doc comment: "family_request → INSERT family_requests with source='mindsweep_auto'". Line 243 has the critical-rule comment: "this path MUST NEVER reach 'family_request'" (teen `talk_to_someone` path).

### Field 3 — Wiring check

`commitMindSweepLite.ts` case `'family_request'` at line 190-220 inserts into `family_requests` with `source='mindsweep_auto'`, enforcing `recipient_member_id` non-null. Partial failures captured via `commit_error` field (line 146). Teen branch explicitly kept separate (MindSweepLiteTeenSection, per Conventions 192 + 193 + 197).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically for this disposition.
**Cross-PRD addendum mentions:** PRD-18 Phase C feature decision file cited.
**CLAUDE.md convention mention:** Convention 180 names `mindsweep-sort` reuse; Convention 182 describes `commitMindSweepLite` as deliberate mirror of `routeDirectly`; Convention 197 describes teen `family_request` as opt-in only (Build N.2). All corroborate the registry's claim.

### Field 5 — What was NOT checked

- Whether `family_requests` rows actually exist in live DB with `source='mindsweep_auto'` (would need SQL).
- Whether teen `MindSweepLiteTeenSection.tsx` correctly excludes the family_request case except via opt-in (per Convention 197).
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`commitMindSweepLite.ts` case 'family_request' (lines 190-220) inserts into `family_requests` with `source='mindsweep_auto'`. Separate teen component exists (`MindSweepLiteTeenSection.tsx`). Code comments reinforce Convention 193 that `talk_to_someone` NEVER writes to family_requests. Registry claims ✅ Wired 2026-04-07 Build L.1. Evidence aligns; multiple CLAUDE.md conventions (180, 182, 192, 193, 197) corroborate.

## Entry 196 — `State-specific compliance formatting`

**Registry line:** 196
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| State-specific compliance formatting | PRD-19 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier; capability-level.
(c) CLAUDE.md has no "state-specific compliance" convention.
(d) PRD-28B (Compliance & Progress Reporting) owns. feature_glossary names `report_templates` + `education_standards` + `esa_invoices` as PRD-28B tables.
(d.5) `grep 'CREATE TABLE.*report_templates|report_templates.*TABLE' path=supabase/migrations` → 0 hits. No `report_templates` migration found.

```
Identifier: CAPABILITY-ONLY — referenced tables (report_templates) not found as CREATE TABLE in migrations
Sources checked:
  (a) stub line 196 — no identifier
  (b) WIRING_STATUS.md — no section
  (c) CLAUDE.md — no convention
  (d) PRD-28B feature_glossary lists tables but CREATE TABLE grep returns 0
```

### Field 2 — Code presence check

```
Grep command: pattern='CREATE TABLE.*report_templates', output_mode=files_with_matches
Hits: 0 — report_templates table does not appear to be created in any migration grep'd this session.
```

```
Grep command: pattern='report_templates|compliance', output_mode=files_with_matches
Hits: 69 files — all doc / PRD / spec / feature_glossary / audit — none in src/ or supabase/migrations/ that create the table.
```

### Field 3 — Wiring check

No compliance-report code found. No `report_templates` table migration. `homeschool_tracking.sql` (100136) mentions "compliance-ready time records" but only for homeschool_time_logs.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md exists.
**CLAUDE.md convention mention:** Convention 226-228 describe homeschool config pattern but not compliance reports.

### Field 5 — What was NOT checked

- Whether PRD-28B is considered built in any BUILD_STATUS.md phase. Registry says "Phase 32" but no Phase 32 confirmation in this grep run.
- Whether an Edge Function `report-generate` (per architecture.md) has state-specific formatting logic — did not open.
- Whether compliance formatting is a client-side template function rather than a DB-stored template.

### Field 6 — Observations (no verdict)

Capability-level stub. feature_glossary lists PRD-28B tables including `report_templates`, but no `CREATE TABLE report_templates` migration found in grep. No state-specific formatting code found in src/. Registry claims ✅ Wired Phase 32. Evidence does not align — suggests either Phase 32 has not landed or the formatting lives in an Edge Function / code path this grep missed. Flagged for founder judgment.

## Entry 198 — `Teen "Tell LiLa About Yourself"`

**Registry line:** 198
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Teen "Tell LiLa About Yourself" | PRD-19 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'tell.*lila.*about|TellLiLa|tell_lila' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether this capability overlaps with `self_discovery` guided mode (PRD-07, InnerWorkings) which IS wired — semantic question (mgrep would help).

### Field 6 — Observations (no verdict)

Capability-only. Zero grep hits for the exact phrase. Registry claims 📌 Post-MVP. Consistent.

## Entry 199 — `Safe Harbor → Library RAG`

**Registry line:** 199
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Safe Harbor → Library RAG | PRD-20 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'safe_harbor.*rag|safe_harbor.*library|safe_harbor.*bookshelf'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether the `safe-harbor` Edge Function (if it exists) references library/bookshelf extractions — not opened.

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Consistent with zero grep hits.

## Entry 200 — `Safe Harbor offline support`

**Registry line:** 200
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Safe Harbor offline support | PRD-20 | PRD-33 | ⏳ Unwired (MVP) | Phase 40 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'safe_harbor.*offline|offline.*safe_harbor'` → 0 hits.

```
Identifier: CAPABILITY-ONLY (dependent on PRD-33 Offline/PWA)
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- PRD-33 is marked Post-MVP per feature_glossary, so the wiring dependency is not yet in place.

### Field 6 — Observations (no verdict)

Capability-only, dependent on PRD-33 (Offline/PWA) which is Post-MVP. Registry claims ⏳ Unwired (MVP) Phase 40. Consistent.

## Entry 210 — `Optimize with LiLa (full flow)`

**Registry line:** 210
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Optimize with LiLa (full flow) | PRD-21A | PRD-05C | ⏳ Unwired (MVP) | Phase 23 |
```

### Field 1 — Implementation identifier

(a) Stub names "Optimize with LiLa" — maps to LiLa Optimizer (PRD-05C) flow.
(d.5) `src/features/vault/components/detail/PromptPackDetail.tsx:148` has `OptimizeButton` component with explicit STUB comment "Optimizer EF not deployed yet."

```
Source: src/features/vault/components/detail/PromptPackDetail.tsx:148-166
Identifier: OptimizeButton component (stub state); PRD-05C Optimizer Edge Function not deployed
```

### Field 2 — Code presence check

```
Grep command: pattern='optimize.*lila|OptimizeWithLila|lila_optimize', path=src
Hits: 5 files
Files:
  - src/hooks/useNotepad.ts (destination type)
  - src/components/shared/RoutingStrip.tsx (destination key)
  - src/features/vault/components/detail/PromptPackDetail.tsx:148 (OptimizeButton stub)
  - src/features/vault/hooks/useSavedPrompts.ts
  - src/features/vault/pages/PersonalPromptLibraryPage.tsx
```

PromptPackDetail.tsx:148-166 context:
```
function OptimizeButton({ dark }: { dark?: boolean }) {
  // STUB: Optimizer EF not deployed yet. Show a gentle message.
  ...
  // TODO: When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal
  ...
  title="Optimize with LiLa — coming soon"
  ...
  <Sparkles size={dark ? 10 : 12} /> Optimize
}
```

### Field 3 — Wiring check

Button exists; click handler is a stub (gentle message / coming-soon title). No conversation modal invocation. RoutingStrip registers `'optimizer'` as a destination but path routes to `studio_queue` default branch (same pathway as calendar/agenda/message — entry 112).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** line 24 (Optimizer in RoutingStrip Destinations): `| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |`
**CLAUDE.md convention mention:** no direct convention for this capability.

### Field 5 — What was NOT checked

- Whether `optimizer_outputs` table (per live_schema, not API-exposed) has any rows — not checked.

### Field 6 — Observations (no verdict)

OptimizeButton at PromptPackDetail.tsx:148 is explicit stub: "STUB: Optimizer EF not deployed yet" with TODO "When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal". WIRING_STATUS.md corroborates. Registry claims ⏳ Unwired (MVP) Phase 23. Evidence aligns.

## Entry 211 — `Deploy with LiLa (skill deployment)`

**Registry line:** 211
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Deploy with LiLa (skill deployment) | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) Stub names "Deploy with LiLa" — maps to SkillDetail.tsx `handleDeployWithLila`.
(d.5) `src/features/vault/components/detail/SkillDetail.tsx:30-33`:
```
const handleDeployWithLila = () => {
  // STUB: Opens Optimizer conversation modal for family-context personalization
  alert('Deploy with LiLa — personalizes with family context. Coming soon!')
}
```

```
Source: src/features/vault/components/detail/SkillDetail.tsx:30-33
Identifier: handleDeployWithLila handler (stub alert only)
```

### Field 2 — Code presence check

```
Grep command: pattern='DeployWithLila|deploy.*lila|lila.*deploy.*skill', path=src
Hits: 1 file (SkillDetail.tsx).
SkillDetail.tsx:30 handleDeployWithLila defined as stub
SkillDetail.tsx:139 onClick handler on button
```

### Field 3 — Wiring check

Button present with onClick; handler is `alert('...Coming soon!')` stub. No conversation modal or tool-permission write.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically traced.
**CLAUDE.md convention mention:** Convention 88 describes "+Add to AI Toolbox" — adjacent but not Deploy with LiLa.

### Field 5 — What was NOT checked

- Whether the stub is behind a Creator-tier gate.

### Field 6 — Observations (no verdict)

Handler is an alert-only stub with explicit STUB comment. Registry claims 📌 Post-MVP. Evidence aligns.

<!-- PROGRESS MARKER: completed 36 of 39 entries (through 211); registry integrity at 547 confirmed -->

## Entry 215 — `LiLa proactive Vault suggestions`

**Registry line:** 215
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa proactive Vault suggestions | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'lila.*proactive.*vault|proactive.*vault.*suggest|vault.*suggestion.*lila' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `lila-assist` Edge Function has a vault-recommendation branch — not opened.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 216 — `Seasonal tag auto-surfacing (date logic)`

**Registry line:** 216
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Seasonal tag auto-surfacing (date logic) | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
```

### Field 1 — Implementation identifier

(a) Stub names `seasonal_tags` column on vault_items (likely); "date logic" describes the auto-surfacing behavior.
(d.5) `grep 'seasonal_tags'` → 5 files including `supabase/migrations/00000000100039_vault_tables.sql` (column definition) and `prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md`. No src/ implementation grep hit for the auto-surfacing logic.

```
Source: supabase/migrations/00000000100039_vault_tables.sql — seasonal_tags column; also seasonal_priority column (per live_schema vault_items row)
Identifier: seasonal_tags + seasonal_priority columns on vault_items (exist); auto-surfacing logic (absent)
```

### Field 2 — Code presence check

```
Grep command: pattern='seasonal_tags|seasonal_priority|seasonal.*auto.*surfac', path=src
Hits: 0 — no implementation in src/.
```

```
Grep command: pattern='seasonal_tags', output_mode=files_with_matches
Hits: 5 files — migration (column), PRDs, schema docs, vault content script. No runtime consumer.
```

### Field 3 — Wiring check

Columns exist; no runtime query filters by seasonal_tags against current date.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** none specifically.

### Field 5 — What was NOT checked

- Whether `scripts/add-vault-content.ts` seeds seasonal_tags values on any vault items (would affect whether the data is even populated to surface).

### Field 6 — Observations (no verdict)

`seasonal_tags` + `seasonal_priority` columns exist on `vault_items`. No src/ code queries these columns with date-comparison logic. Registry claims ⏳ Unwired (MVP) Phase 25 enhancement. Evidence aligns — schema ready, logic absent.

## Entry 218 — `Session report re-import via Review & Route`

**Registry line:** 218
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Session report re-import via Review & Route | PRD-21A | PRD-08 + PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'session.*report.*reimport|session_report|reimport.*review' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether an Edge Function like `session-report-parse` exists — did not glob Edge Functions.
- Whether this overlaps with Notepad's Review & Route ai-parse flow — semantic question (mgrep would help).

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims ⏳ Unwired (MVP) Phase 32. Consistent.

<!-- PROGRESS MARKER: completed all 39 entries; final registry integrity check at 547 -->

## BATCH B COMPLETE

Entries processed: 39 (111, 112, 114, 115, 116, 117, 119, 120, 129, 130, 134, 135, 136, 137, 140, 150, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 166, 167, 174, 187, 196, 198, 199, 200, 210, 211, 215, 216, 218).

Capability-only packets: 22 (lines 130, 134, 135, 136, 137, 150, 152, 154, 158, 160, 161, 162, 167, 174, 196, 198, 199, 200, 210*, 215, 216*, 218).

*Entries 210 and 216 have identifier-found at level (d.5) — minor ambiguity on classification but recorded here as "capability-only" for counting because the stub capability label still resolves to table/column only with no runtime logic. The field content in the packets themselves shows exactly what was found.

Identifier-found packets: 17 (lines 111, 112, 114, 115, 116, 117, 119, 120, 129, 140, 153, 155, 157, 159, 166, 187, 211).

Final registry line count: 547 (unchanged). No HALT detected. No source-code writes performed.
