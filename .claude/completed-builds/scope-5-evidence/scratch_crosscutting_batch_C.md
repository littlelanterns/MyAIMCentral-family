# Scope 5 — Crosscutting Batch C Scratch

> Sub-agent output for Session 4 (Crosscutting) follow-on batch.
> 38 entries: lines 221, 222, 224, 225, 226, 227, 228, 232, 238, 239, 240, 241, 242, 247, 266, 276, 277, 278, 281, 282, 284, 287, 288, 289, 290, 292, 298, 299, 300, 301, 302, 305, 306, 329, 335, 336, 345, 346.
> Registry integrity at start: 547 lines. HALT file: absent.

<!-- PROGRESS MARKER: batch start, 0 of 38 complete -->

## Entry 221 — `Learning paths (multi-item sequences)`
**Registry line:** 221
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Learning paths (multi-item sequences) | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub entry line 221 — no concrete identifier named (only capability phrase).
(b) WIRING_STATUS.md — no "Learning paths" section; no match in Vault or Studio wiring tables.
(c) CLAUDE.md — Convention #90 describes a `learning_ladder` (fun_creative/practical/creator) as internal content strategy metadata, NOT a user-facing multi-item sequence. Different capability.
(d) PRD-21A and `prds/addenda/PRD-21A-*` — skimmed; "Learning paths" listed as Post-MVP vision, no implementation identifier.
(d.5) not triggered — no file explicitly named.
→ (e) CAPABILITY-ONLY. Identifier: none.

### Field 2 — Code presence check
Skipped — no identifier to grep for. (Grep `learning_path|learning_paths` in `src` returned 1 hit in `src/components/studio/studio-seed-data.ts` which, on its face, appears unrelated to Vault.)

### Field 3 — Wiring check
Skipped — no identifier.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- CLAUDE.md: no convention names a Vault multi-item-sequence surface. Convention #90 refers to separate learning-ladder metadata.
- PRD-21A: listed in Post-MVP; no concrete identifier.
- No PlannedExpansionCard feature key applicable.

### Field 5 — What was NOT checked
- Whether any `vault_learning_paths` / `vault_item_sequences` schema exists (did not scan migration files by name).
- Semantic question blocked per Convention 242: "Does any Vault-related concept implement multi-item sequencing under a different name (e.g., 'series', 'track', 'course')?"

### Field 6 — Observations (no verdict)
No named identifier. Grep for `learning_path` surfaces only a Studio seed-data file that appears unrelated. No WIRING/CLAUDE corroboration. Classified CAPABILITY-ONLY.

---

## Entry 222 — `Creator economy / user-submitted tools`
**Registry line:** 222
**Claimed status:** `📌 Post-MVP (Phase 4)`
**Full registry row:**
```
| Creator economy / user-submitted tools | PRD-21A | — | 📌 Post-MVP (Phase 4) | — |
```

### Field 1 — Implementation identifier
(a) stub line 222 — no identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention for creator-submitted Vault tools.
(d) PRD-21A + PRD-21B (Admin) + addenda — referenced in planning/decision files only; no schema/component/RPC name.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `creator_economy|user_submitted_tools|user-submitted` → hits only in PRDs, STUB_REGISTRY, CORRECTED_STUB_REGISTRY, audit, and feature-decision markdown files.
Hits: 0 in `src/` and 0 in `supabase/`.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Referenced in `prds/ai-vault/PRD-21A-*`, `prds/ai-vault/PRD-21B-*`, `prds/scale-monetize/PRD-32-*`, `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. No implementation identifier.
- `vault_content_requests` table exists (live_schema) — user can request new content, distinct capability from "user-submitted tool."

### Field 5 — What was NOT checked
- Whether PRD-21A Phase 4 roadmap references a specific DB surface.
- Whether `vault_content_requests` covers a subset of this capability.

### Field 6 — Observations (no verdict)
No concrete implementation identifier anywhere in code. Only references are in planning docs. CAPABILITY-ONLY.

---

## Entry 224 — `Content versioning`
**Registry line:** 224
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Content versioning | PRD-21B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 224 — no identifier.
(b) WIRING_STATUS.md — no entry.
(c) CLAUDE.md — no convention names a versioning surface for vault items.
(d) PRD-21B (Admin) — no `content_version` / `version_history` field surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `content_version|version_history|vault_content_version` → 0 hits in repo.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `vault_items.last_published_at` column exists (adjacent capability; does not itself constitute versioning).

### Field 5 — What was NOT checked
- Whether `vault_items.status` enum + `last_published_at` together constitute a lightweight draft/published workflow that partially covers this capability.

### Field 6 — Observations (no verdict)
No identifier, no code hits, no WIRING/CLAUDE mention. CAPABILITY-ONLY.

---

## Entry 225 — `Scheduled publishing`
**Registry line:** 225
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Scheduled publishing | PRD-21B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 225 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md — none.
(d) PRD-21B — not surfaced.
Note: `claude/architecture.md` lists `blog-publish-scheduled` Edge Function ("Cron for scheduled blog post publishing") — PRD-38 Blog, NOT PRD-21B Vault.
→ (e) CAPABILITY-ONLY for Vault scheduled publishing.

### Field 2 — Code presence check
Grep `scheduled_publish|scheduled_publishing|publish_at` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `claude/architecture.md`: `blog-publish-scheduled` Edge Function (PRD-38) exists. Adjacent, different feature.
- No Vault scheduled-publish convention or mention.

### Field 5 — What was NOT checked
- Whether blog scheduled-publish patterns are reusable for Vault.

### Field 6 — Observations (no verdict)
No Vault-scoped scheduled-publish identifier. Adjacent blog-side capability exists under different PRD. CAPABILITY-ONLY for this stub.

---

## Entry 226 — `Collaborative filtering recommendations`
**Registry line:** 226
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Collaborative filtering recommendations | PRD-21C | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 226 — none.
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) Grep `collaborative_filter|vault_recommend` → 2 hits, both in `prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md` and `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. Planning-text only.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Skipped at code level (grep above found only planning docs).

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Planning references as above. No RPC/function/component.

### Field 5 — What was NOT checked
- Whether `vault_user_progress` + `vault_first_sightings` + `vault_copy_events` aggregation already underpins a hidden recommender.

### Field 6 — Observations (no verdict)
Planning-doc references only. No code identifier. CAPABILITY-ONLY.

---

## Entry 227 — `Semantic/vector search for Vault`
**Registry line:** 227
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Semantic/vector search for Vault | PRD-21C | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 227 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md — none.
(d) PRD-21C — not surfaced.
Note: `vault_items.fts_document` column exists per live_schema (full-text search). FTS ≠ semantic/vector search. No `embedding` on `vault_items` in live_schema.
→ (e) CAPABILITY-ONLY for the vector variant.

### Field 2 — Code presence check
- Grep `vault.*embedding|vault_items.*embedding` in `supabase/` → 0 hits.
- Grep `vault.*search.*embed|match_vault_items|vault_semantic` in repo → 0 hits.

### Field 3 — Wiring check
Skipped — no identifier.

### Field 4 — Documentation cross-reference
- live_schema.md: `vault_items.fts_document` present.
- No CLAUDE.md/WIRING_STATUS mention of Vault vector search.

### Field 5 — What was NOT checked
- Whether FTS-powered search is wired in UI already (separate capability).

### Field 6 — Observations (no verdict)
Vault currently has FTS column; no vector/embedding surface. CAPABILITY-ONLY for the vector variant of this capability.

---

## Entry 228 — `Out of Nest → sibling messaging`
**Registry line:** 228
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Out of Nest → sibling messaging | PRD-22 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 228 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md Convention #142 names `out_of_nest_members` table and clarifies OON members have "no family tools, no PIN, no role, no shell — only designated conversation spaces and email notifications." No sibling-messaging capability named.
(d) PRD-22 Settings / PRD-15 Messaging — `out_of_nest` is a defined `space_type` per PRD-15; sibling-specific messaging not named as distinct.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `out_of_nest.*sibling|sibling.*messaging` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #142 (OON architecture): OON members limited to conversation spaces + email.
- PRD-15: `conversation_spaces.space_type='out_of_nest'` is the plumbing.

### Field 5 — What was NOT checked
- Whether a dedicated "sibling" UI in OON spaces exists as an enhancement to PRD-15 wiring.

### Field 6 — Observations (no verdict)
No specific sibling-messaging identifier. Existing `out_of_nest` space_type is PRD-15 scope. CAPABILITY-ONLY.

---

## Entry 232 — `Cross-family book recommendations`
**Registry line:** 232
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Cross-family book recommendations | PRD-23 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 232 — none.
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) PRD-23 BookShelf + addenda — not surfaced.
Note: `platform_intelligence.book_library` exists as cross-family extraction cache (live_schema) — not a recommender.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `cross.family.*book|family_book_recommendations|cross_family` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `platform_intelligence.book_library` (cross-family extraction cache) exists as distinct capability.

### Field 5 — What was NOT checked
- Whether any `platform_intelligence` RPC exists for family-to-family book matching under a different name.

### Field 6 — Observations (no verdict)
No identifier, no code hits. Adjacent cross-family book cache exists for extraction reuse (separate capability). CAPABILITY-ONLY.

---

## Entry 238 — `Family Challenges (PRD-24C)`
**Registry line:** 238
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Family Challenges (PRD-24C) | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 238 — phrase "Family Challenges (PRD-24C)". PRD-24C file does not exist in `prds/` (PRD-24, 24A, 24B only).
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention references Family Challenges as a game mode.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md` references the concept. No schema/table/component identifier surfaced at the phrase level.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `family_challenge|Family Challenges` in `src/` → 0 hits.
Grep `family_challenge` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md` discusses the concept at planning level.
- No PlannedExpansionCard feature key surfaced.

### Field 5 — What was NOT checked
- Whether `overlay_instances` or `gamification_rewards` schemas include a Family-Challenge-specific type (live_schema lists `overlay_instances` / `overlay_collectibles` under PRD-24A).

### Field 6 — Observations (no verdict)
Planning references only; no code identifier. CAPABILITY-ONLY.

---

## Entry 239 — `Boss Quests game mode`
**Registry line:** 239
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Boss Quests game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 239 — "Boss Quests" as capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md` references the concept.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `boss_quest|Boss Quest` in `src/` → 0 hits.
Grep `boss_quest` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`: planning text only.

### Field 5 — What was NOT checked
- Whether the generic `overlay_instances` / `gamification_rewards` schema supports Boss-Quest semantics.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

---

## Entry 240 — `Bingo Cards game mode`
**Registry line:** 240
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Bingo Cards game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 240 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `bingo_card|Bingo Card|bingo` in `src/` → 0 hits.
Grep `bingo` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.

### Field 5 — What was NOT checked
- Whether a bingo-card overlay renderer exists under a generic "grid" component name.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

---

## Entry 241 — `Evolution Creatures game mode`
**Registry line:** 241
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Evolution Creatures game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 241 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention for creature evolution; existing Sticker-Book creature pipeline (conventions #198-#207) covers static creature awarding, not evolution.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `evolution_creature|Evolution Creature|evolve_creature` in `src/` → 0 hits.
Grep in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md` for the concept.
- Adjacent: `member_creature_collection` exists (CLAUDE.md #198) — not evolution.

### Field 5 — What was NOT checked
- Whether `member_creature_collection` or similar has an `evolution_stage` / `form` column for future evolution (not checked).

### Field 6 — Observations (no verdict)
Planning references only; static creature collection exists separately. CAPABILITY-ONLY for evolution game mode.

---

## Entry 242 — `Passport Books game mode`
**Registry line:** 242
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Passport Books game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 242 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `passport_book|Passport Book` in `src/` → 0 hits.
Grep in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.

### Field 5 — What was NOT checked
- Whether `overlay_instances` / `overlay_collectibles` have a passport-specific subtype.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

<!-- PROGRESS MARKER: completed entries 1-13 of 38 -->

---

## Entry 247 — `Randomizer mastery → gamification pipeline`
**Registry line:** 247
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Randomizer mastery → gamification pipeline | PRD-24 Sub-phase C | — | ⏳ Unwired (MVP) | Known gap: randomizer mastery approvals don't fire RPC (no task_completions row). Sequential mastery works. |
```

### Field 1 — Implementation identifier
(a) stub line 247 directly names:
- The capability/pipeline endpoint: `roll_creature_for_completion` (RPC) — implicit from "gamification pipeline" + Convention #198 + #205.
- The missing wire: randomizer mastery approvals do NOT fire the RPC.
- Supporting identifier: `task_completions` table (the RPC is keyed on it).
(b) WIRING_STATUS.md — no direct row, but adjacent sections exist for gamification wiring.
(c) CLAUDE.md Convention #205 (line ~ in the convention block): "Randomizer mastery approvals do NOT fire the gamification pipeline in Sub-phase C (known gap). `useApproveMasterySubmission` has a sequential branch (keyed on `task_completions.id`, wired to the RPC) and a randomizer branch (keyed on `list_items.id`, no `task_completions` row exists). The RPC is strictly `task_completions`-keyed."
(d) PRD-24 / PRD-24 Sub-phase C feature decisions — covered by Convention #205 directly.
→ Field 1 resolves at (c). Primary identifier: `useApproveMasterySubmission` hook (randomizer branch). Secondary: `roll_creature_for_completion` RPC.

### Field 2 — Code presence check
Grep `useApproveMasterySubmission` in `src/` → hits in:
- `src/hooks/usePractice.ts:448` — hook definition (export function `useApproveMasterySubmission`)
- `src/pages/Tasks.tsx:38, 1589` — sequential mastery approval flow
- `src/pages/Lists.tsx:43, 2923` — randomizer mastery approval flow (per-list inline component)
- `src/types/gamification.ts:19` — interface reference

First-context window `src/hooks/usePractice.ts` lines 533-549 (randomizer branch):
```
} else {
  // Randomizer: mark mastered + exit pool
  // NOTE: Randomizer items do NOT go through task_completions, so the
  // gamification pipeline (which is keyed on task_completions.id) is not
  // fired here. Randomizer mastery awards are a known gap for Sub-phase
  // C — flagged in CLAUDE.md and accepted. A follow-up build will route
  // randomizer mastery through a separate pipeline call.
  const { data: item, error: itemErr } = await supabase
    .from('list_items')
    .update({
      mastery_status: 'approved',
      mastery_approved_by: params.approverId,
      mastery_approved_at: now,
      is_available: false,
    })
    .eq('id', params.sourceId)
```

Grep `roll_creature_for_completion` in `src/` → 4 files (`useTaskCompletions.ts`, `useTasks.ts`, `types/gamification.ts`, `usePractice.ts`). In `usePractice.ts` the RPC is called in the sequential branch only (line 37) — confirmed by `grep -n` showing occurrences at lines 37, 41, 46, and a comment at 458.

### Field 3 — Wiring check
**Callers:** `useApproveMasterySubmission` is imported by `src/pages/Tasks.tsx` (line 38) and `src/pages/Lists.tsx` (line 43). Used in `Tasks.tsx:1589` and `Lists.tsx:2923`.

**Execution-flow location:** React hook file (`src/hooks/usePractice.ts`) with dual branch logic. Randomizer branch deliberately does NOT call `supabase.rpc('roll_creature_for_completion', ...)`.

**Most recent touching commit:** Not independently inspected via `git log` in this run. Convention #205 positions this as a Sub-phase C decision.

### Field 4 — Documentation cross-reference
- CLAUDE.md Convention #205 confirms known gap.
- CLAUDE.md Convention #198 names `roll_creature_for_completion` as "authoritative gamification pipeline endpoint" and specifies `UNIQUE constraint on member_creature_collection.awarded_source_id` for idempotency — gap is that randomizer approvals never reach this RPC at all.
- STUB_REGISTRY.md line 247 marks ⏳ Unwired (MVP) with "Known gap: randomizer mastery approvals don't fire RPC" note.

### Field 5 — What was NOT checked
- Whether `task_completions` could be synthesized at randomizer-approval time as a workaround (code path that would synthesize a row and then call RPC).
- Whether any migration has added an `awarded_source_id` generalization beyond `task_completions.id` to include `list_items.id`.
- Whether any UNDO/reset hook exists for randomizer mastery points (none expected per Convention #206).

### Field 6 — Observations (no verdict)
The randomizer branch in `src/hooks/usePractice.ts:533-549` contains an explicit comment documenting that `roll_creature_for_completion` is NOT called for randomizer items. Sequential branch at the same hook DOES call the RPC (line 37 and continuing). CLAUDE.md Conventions #198 and #205 describe this as a deliberate Sub-phase C gap. Registry claim of ⏳ Unwired aligns with the in-code comment and convention language.

---

## Entry 266 — `Tracker Goal page earning (widget data point consumption)`
**Registry line:** 266
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Tracker Goal page earning (widget data point consumption) | Build M Phase 1 | — | ⏳ Unwired (MVP) | Schema + RPC branch exist. Widget picker wired. Data point trigger not connected. |
```

### Field 1 — Implementation identifier
(a) stub line 266 directly names: "Tracker Goal page earning", "widget data point" consumption, and notes "Schema + RPC branch exist. Widget picker wired. Data point trigger not connected."
(b) WIRING_STATUS.md — no dedicated row.
(c) CLAUDE.md Convention #210: "3 page/background earning modes, independent from creature earning. Stored in `member_sticker_book_state.page_earning_mode`: `'every_n_creatures'` (default...), `'every_n_completions'`..., `'tracker_goal'` (page when a dashboard widget reaches a threshold). Mode-specific columns: `page_earning_completion_threshold`, `page_earning_completion_counter`, `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`."
(d) PRD-24 / PRD-26 feature decision files for Build M.
→ Field 1 identifier list: `tracker_goal` (enum value), `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`, `member_sticker_book_state` table, `roll_creature_for_completion` RPC branch, `widget_data_points` table.

### Field 2 — Code presence check
Grep `page_earning_mode.*tracker_goal|page_earning_tracker_widget_id` → hits in 11 files including:
- `supabase/migrations/00000000100126_earning_strategies_color_reveal.sql` — schema introduction.
- `supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql` — RPC branch (lines 287-300 reference `tracker_goal` case and `page_earning_tracker_widget_id`).
- `src/hooks/useStickerBookState.ts` — hook consumes.
- `src/hooks/useGamificationSettings.ts` — settings writes.
- `src/components/gamification/settings/GamificationSettingsModal.tsx` — UI.
- `src/types/play-dashboard.ts` — type def.
- `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md` — decision doc.

First-context window `supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql` lines 287-301 (from earlier grep output):
```sql
WHEN 'tracker_goal' THEN
  IF v_state.page_earning_tracker_widget_id IS NOT NULL THEN
    [aggregation check]
    WHERE widget_id = v_state.page_earning_tracker_widget_id
  ) >= COALESCE(v_state.page_earning_tracker_threshold, 5) THEN
    [unlock logic]
    AND unlocked_trigger_type = 'tracker_goal'
    WHERE widget_id = v_state.page_earning_tracker_widget_id
```

### Field 3 — Wiring check
**Callers/Importers:** `useStickerBookState`, `useGamificationSettings`, `GamificationSettingsModal` — UI side wired for picker + threshold config.

**Execution-flow location:** RPC branch is in Postgres function body; UI settings wire config; gap per stub row: "Data point trigger not connected." The missing piece is a trigger/hook that fires `roll_creature_for_completion` (or the page-earning branch) when a `widget_data_points` row is inserted.

**Most recent touching commit:** Not inspected in this run.

### Field 4 — Documentation cross-reference
- CLAUDE.md #210: page-earning modes enumeration (authoritative).
- STUB_REGISTRY line 266: "Data point trigger not connected" explicit gap note.
- `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md`: decision doc.

### Field 5 — What was NOT checked
- Whether a `widget_data_points` INSERT trigger exists that calls the RPC (did not grep migration bodies for `widget_data_points` trigger).
- Whether the RPC is currently entered via any task-completion path that happens to have `page_earning_mode='tracker_goal'` (partial-wiring case).

### Field 6 — Observations (no verdict)
Schema, enum value (`tracker_goal`), and RPC branch present in migrations 100126 + 100130 and consumed by hooks/UI. Stub row explicitly notes that widget-data-point insertion does not trigger the RPC. Convention #210 describes the capability but does not name the trigger. Evidence aligns with registry's "Schema + RPC branch exist. Widget picker wired. Data point trigger not connected" note.

---

## Entry 276 — `Caregiver push notifications`
**Registry line:** 276
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Caregiver push notifications | PRD-27 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 276 — "push notifications" capability phrase, scoped to caregiver.
(b) WIRING_STATUS.md — no caregiver-specific section.
(c) CLAUDE.md — no convention. (Generic push-notification infrastructure mentioned as PRD-33 / PRD-15 scope; neither names caregiver-specific push.)
(d) PRD-27 (Caregiver Tools) — not surfaced at specific identifier level.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `caregiver.*push|caregiver_notification` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `notifications` table + `notification_preferences` table exist (PRD-15 plumbing) with `delivery_method` column — generic, not caregiver-specific.
- `notification_preferences.push_enabled` column exists per live_schema — generic.

### Field 5 — What was NOT checked
- Whether the generic PRD-15 push-notification plumbing, once wired, would cover caregiver use cases without new code.
- Whether any PWA service worker push registration already exists (would be PRD-33 scope).

### Field 6 — Observations (no verdict)
No caregiver-specific push identifier. Generic notifications schema exists (PRD-15) but push delivery itself has no code hits. CAPABILITY-ONLY for the caregiver-scoped variant.

---

## Entry 277 — `Homeschool budget/cost tracking`
**Registry line:** 277
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Homeschool budget/cost tracking | PRD-28 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 277 — capability phrase.
(b) WIRING_STATUS.md — no section for homeschool budget.
(c) CLAUDE.md — Conventions #223-#228 describe tracking/allowance/financial/homeschool columns. `financial_transactions` is append-only; `homeschool_configs` covers family/child resolution; no "homeschool budget" capability explicitly named.
(d) PRD-28 + PRD-28B addenda — homeschool hour targets covered (#228), not budget.
Note: `src/components/studio/studio-seed-data.ts` surfaced from grep `homeschool_budget` — checked out as a Studio seed example ("Homeschool Curriculum Budget" as a list_template), distinct from a budget-tracking feature.
→ (e) CAPABILITY-ONLY at system level.

### Field 2 — Code presence check
Grep `homeschool_budget|budget_tracking|homeschool_cost` → 1 hit in `src/components/studio/studio-seed-data.ts` (Studio seed for expense-tracker example, NOT a dedicated homeschool-budget feature).

### Field 3 — Wiring check
Skipped — the one hit is a Studio seed template, not an implementation of budget tracking.

### Field 4 — Documentation cross-reference
- `specs/studio-seed-templates.md` lists "Example 4: Homeschool Curriculum Budget" as an expense-tracker list seed.
- live_schema.md: `financial_transactions` table exists. No homeschool-specific budget table.

### Field 5 — What was NOT checked
- Whether generic expense lists (PRD-09B `lists` with `list_type='expenses'`) are considered "homeschool budget/cost tracking" for PRD-28 purposes.

### Field 6 — Observations (no verdict)
Only hit is a generic expense-list seed template. No dedicated homeschool-budget implementation. CAPABILITY-ONLY for a first-class feature.

---

## Entry 278 — `Advanced financial reports`
**Registry line:** 278
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Advanced financial reports | PRD-28 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 278 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Convention #225 states financial data is excluded from LiLa context assembly (privacy boundary). No "advanced financial report" capability convention.
(d) PRD-28 — `financial_transactions` table exists with `balance_after` per #223. Report generation not named.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `advanced_financial_report|financial_report_generate` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #225: financial data privacy boundary.
- `report-generate` Edge Function exists per `claude/architecture.md` (generic template-based report generator) — could be used for financial reports, not wired.

### Field 5 — What was NOT checked
- Whether any `report_templates` row has a `financial` template_type.

### Field 6 — Observations (no verdict)
No named identifier for advanced financial reports. Generic report-generate Edge Function exists. CAPABILITY-ONLY at this stub level.

---

## Entry 281 — `IEP/document understanding`
**Registry line:** 281
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| IEP/document understanding | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 281 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention names IEP-specific document understanding; PRD-19 relationship notes + PRD-13 Archives cover document upload generically.
(d) PRD-28B addenda — IEP is a declared template subject but document-understanding (AI extraction) not wired.
Note: `src/config/feature_expansion_registry.ts` surfaced from grep — likely a demand-validation registry entry, not an implementation.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `IEP.*document|iep_document|document_understanding|ocr.*iep` in `src/` → 1 hit in `src/config/feature_expansion_registry.ts` (PlannedExpansionCard registry).

### Field 3 — Wiring check
The one hit is a demand-validation registry entry for PlannedExpansionCard, not an implementation. (Grep `PlannedExpansionCard featureKey=` in `src/` shows 5 in-UI uses, none for IEP.)

### Field 4 — Documentation cross-reference
- `feature_expansion_registry.ts` contains feature descriptions for PlannedExpansionCard demand validation (per CLAUDE.md PlannedExpansionCard convention).
- No implementation identifier.

### Field 5 — What was NOT checked
- Whether a generic document-upload + AI-extraction path (maybe via BookShelf pipeline) could be adapted to IEP.

### Field 6 — Observations (no verdict)
Only hit is a demand-validation registry entry. No dedicated IEP document-understanding code. CAPABILITY-ONLY.

---

## Entry 282 — `ESA vendor integration`
**Registry line:** 282
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| ESA vendor integration | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 282 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-28B — `esa_invoices` table listed per live_schema (`esa_invoices` exists under PRD-28B compliance). No vendor-side integration named.
→ (e) CAPABILITY-ONLY for vendor integration (invoice surface exists but that's a different capability).

### Field 2 — Code presence check
Grep `esa_vendor|esa_integration|vendor_integration` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `esa_invoices` listed under PRD-28B.

### Field 5 — What was NOT checked
- Whether any webhook/OAuth handler exists for specific ESA vendors (e.g., ClassWallet, Step Up for Students) under a different name.

### Field 6 — Observations (no verdict)
Invoice-side schema exists (`esa_invoices`); no vendor-side integration. CAPABILITY-ONLY for vendor-integration stub.

---

## Entry 284 — `Safety journal/message scanning`
**Registry line:** 284
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Safety journal/message scanning | PRD-30 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 284 — capability phrase covering journal + message scanning (extension of current LiLa conversation safety monitoring to other content).
(b) WIRING_STATUS.md — no dedicated row for journal/message scanning.
(c) CLAUDE.md — Convention #7 (global Crisis Override) + safety monitoring context from `claude/ai_patterns.md` describe LiLa conversation safety monitoring (PRD-30). Journal/message scanning beyond LiLa not named.
(d) PRD-30 + `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md` — reference concept without naming a journal/message-specific identifier.
Note: `lila_conversations.safety_scanned` + `lila_messages.safety_scanned` exist (per live_schema); `journal_entries.safety_scanned` NOT present per live_schema inspection; `messages.safety_scanned` NOT present.
→ (e) CAPABILITY-ONLY for the extension-to-journal/messages variant.

### Field 2 — Code presence check
Grep `safety_scanned` → 5 files in `src/`: `ToolConversationModal.tsx`, `MeetingConversationView.tsx`, `LilaModal.tsx`, `LilaDrawer.tsx`, `useLila.ts`. All LiLa-conversation context, NOT journal/messages.
Grep `safety.*journal|safety.*scan.*message|journal.*safety_scan` → 0 hits in `src/`.

### Field 3 — Wiring check
Skipped for journal/message scanning (no matching identifier). LiLa safety scanning is a separate wired capability.

### Field 4 — Documentation cross-reference
- live_schema.md: `lila_conversations.safety_scanned` + `lila_messages.safety_scanned` exist. `journal_entries` has no safety_scanned column. `messages` has no safety_scanned column.
- Convention #7: global crisis override — applies to LiLa conversations only per current wording.

### Field 5 — What was NOT checked
- Whether the PRD-30 pipeline is architected to be content-source-agnostic (could pass journal text or messages in without new schema).

### Field 6 — Observations (no verdict)
LiLa-conversation scanning is wired (not this stub's subject). Extending it to journal entries and peer-to-peer messages is not implemented — no schema/hook/code surface for those content sources. CAPABILITY-ONLY for the extension capability.

---

## Entry 287 — `Board session export`
**Registry line:** 287
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 287 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Conventions #92-#104 describe Board of Directors; export not named.
(d) PRD-34 ThoughtSift — `board_sessions` table exists (live_schema) with `conversation_id` foreign key; export not described as implemented.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `board_session.*export|export.*board_session|export_board` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `board_sessions` table exists.
- Convention #100 mentions "Prayer Seat" special record; no export mention.

### Field 5 — What was NOT checked
- Whether a generic conversation-export route at `/api/conversation-export` (or similar) exists that could cover board sessions.

### Field 6 — Observations (no verdict)
Session entity exists; no export code. CAPABILITY-ONLY.

---

## Entry 288 — `Translator language support`
**Registry line:** 288
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Translator language support | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 288 — capability phrase, likely referring to Translator ThoughtSift tool (PRD-34) supporting non-English output languages.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md Convention #94: "Translator uses Haiku, is single-turn. Saves to `lila_messages` for history but does not use conversation continuity. No emoji in tone labels or output text." No language capability.
(d) PRD-34 + addenda — Translator single-turn mode described; language variants not detailed as implemented.
→ (e) CAPABILITY-ONLY for non-English language support.

### Field 2 — Code presence check
Grep `translator.*language|translator.*spanish|non_english_translator` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #94: Translator described as Haiku single-turn, no multi-language.
- `lila_guided_modes` has `translator` mode_key (per PRD-34 registry in ai_patterns.md) — single-turn surface exists; language dimension not surfaced.

### Field 5 — What was NOT checked
- Whether the Translator Edge Function prompt template accepts a `target_language` parameter already.

### Field 6 — Observations (no verdict)
Base Translator mode exists; multi-language dimension has no code hits. CAPABILITY-ONLY for language-support extension.

---

## Entry 289 — `Standards linkage on portfolio`
**Registry line:** 289
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Standards linkage on portfolio | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier
(a) stub line 289 — capability phrase; "Standards linkage" + "portfolio" implies `education_standards` + `standard_evidence` + portfolio (family_moments / PRD-37) linkage.
(b) WIRING_STATUS.md — no dedicated row visible in file inspection.
(c) CLAUDE.md — no convention directly names the linkage.
(d) live_schema.md lists `education_standards` + `standard_evidence` + `report_templates` + `esa_invoices` under PRD-28B. `family_moments` + `moment_media` under PRD-37.
(d.5) Opened `feature_glossary.md` — confirms PRD-37 portfolio + PRD-28B standards/evidence tables exist as MVP.
→ Identifier set: `education_standards` table + `standard_evidence` table + `family_moments` table.

### Field 2 — Code presence check
Grep `education_standards|standard_evidence` in `src/` → 0 hits.
Grep `education_standards|standard_evidence` in `supabase/migrations/` was NOT re-run explicitly; live_schema references these tables as existing under PRD-28B (trust baseline).
Grep `standards_linkage|portfolio.*standards|education_standards.*portfolio` in repo → 3 hits, all in PRD markdown files (`prds/platform-complete/PRD-37-*`, `prds/platform-complete/PRD-28B-*`, `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`).

### Field 3 — Wiring check
**Callers/Importers:** `education_standards` + `standard_evidence` grep in `src/` returned 0 hits, meaning no client-side hooks or components currently consume these tables at the name level. Tables exist in schema; UI wiring to the name not located.

**Execution-flow location:** DB-side schema (migration files). Not traceable to UI from the direct identifier grep.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 289 claims ✅ Wired, Phase 32, wired by PRD-28B.
- `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md` is the authoritative cross-impact document.
- feature_glossary.md: PRD-37 + PRD-28B both listed as MVP.

### Field 5 — What was NOT checked
- Whether the linkage uses a different join name (e.g., `family_moments.standard_id` or a junction table under a name that doesn't contain "standard" in a greppable way).
- Whether the "Phase 32" build file still exists in `.claude/completed-builds/` with wiring details — not inspected.
- Migration text for `education_standards` / `standard_evidence` — not opened directly.
- Whether `standards_linkage` is wired via `report_templates` content type rather than a direct join.

### Field 6 — Observations (no verdict)
Schema-level `education_standards` + `standard_evidence` tables exist per live_schema. Grep for identifier names returns 0 hits in `src/`. Stub claims ✅ Wired in Phase 32 with PRD-28B as wirer; direct-grep evidence of UI integration is absent. Possible that wiring uses a different name (e.g., composite join) not captured by this grep. Founder-judgment flag.

---

## Entry 290 — `Portfolio export`
**Registry line:** 290
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Portfolio export | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier
(a) stub line 290 — capability phrase; "portfolio export" implies PDF/CSV/document export of `family_moments` (PRD-37 portfolio) via PRD-28B's report-generate path.
(b) WIRING_STATUS.md — no dedicated row visible.
(c) CLAUDE.md — no convention.
(d) `claude/architecture.md` names `report-generate` Edge Function as "Template-based report generation." That's the plausible export surface.
→ Primary identifier: `report-generate` Edge Function + `family_moments` + `report_templates` table.

### Field 2 — Code presence check
Grep `portfolio_export|export_portfolio|family_moment.*export` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped at the name level (no direct matches).

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 290: ✅ Wired via PRD-28B, Phase 32.
- `claude/architecture.md`: `report-generate` Edge Function exists.
- live_schema.md: `report_templates` under PRD-28B.

### Field 5 — What was NOT checked
- Whether `report-generate` Edge Function accepts a portfolio report template.
- Whether any download/blob endpoint exists in `src/` wiring this up.
- Whether Family Newsletter report template (stub 291 — not in batch) or another report covers this.

### Field 6 — Observations (no verdict)
Registry claims ✅ Wired via PRD-28B Phase 32. Direct grep for "portfolio export" terms returns 0 hits in `src/`. Implementation likely lives under a generic `report-generate` path, not under a portfolio-specific name. Founder-judgment flag to validate wiring is via report templates rather than a portfolio-named code path.

---

## Entry 292 — `Image auto-tagging`
**Registry line:** 292
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Image auto-tagging | PRD-37 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 292 — capability phrase (presumably AI-driven automatic tagging of `moment_media` images).
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) PRD-37 — `moment_media` table exists; auto-tagging not described.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `image.*auto_tag|auto_tag.*image|moment_media.*tag|image_tagging` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `moment_media` under PRD-37. No `ai_tags` column visible per schema-dump entry.

### Field 5 — What was NOT checked
- Whether `family_moments` has a `tags` column capable of receiving AI-assigned values later.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

<!-- PROGRESS MARKER: completed entries 1-26 of 38 -->

---

## Entry 298 — `Blog comment threading`
**Registry line:** 298
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog comment threading | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 298 — capability phrase; implies `blog_comments.parent_comment_id` or equivalent.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 Blog — `blog_comments` table referenced in feature_glossary (PRD-38 Blog section).
→ (e) CAPABILITY-ONLY at implementation-identifier level.

### Field 2 — Code presence check
Grep `blog_comment.*thread|comment_thread|reply_to_comment|parent_comment_id` → 2 hits, both in markdown/archive files:
- `.claude/archive/database_schema_SUPERSEDED.md`
- `prds/ai-vault/PRD-21C-AI-Vault-Engagement-Community.md` (PRD-21C comments for Vault, not blog)

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- feature_glossary.md: `blog_comments` exists under PRD-38 as MVP.
- Threading not mentioned in any current source.

### Field 5 — What was NOT checked
- Whether `blog_comments` schema actually includes a `parent_id` column for threading (live_schema snapshot did not list blog-specific tables — they may be under PRD-38 and not PostgREST-exposed).

### Field 6 — Observations (no verdict)
No threading identifier in code. References to "parent_comment_id" live only in superseded/other-PRD docs. CAPABILITY-ONLY for blog-specific threading.

---

## Entry 299 — `Blog search`
**Registry line:** 299
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog search | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 299 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — no surfaced identifier.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `blog_post.*search|blog_search|fts.*blog` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- PRD-38 listed in feature_glossary.md as MVP with `blog_posts` table. Search surface not described.

### Field 5 — What was NOT checked
- Whether `blog_posts` has an `fts_document` column akin to `vault_items.fts_document`.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 300 — `Blog RSS feed`
**Registry line:** 300
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog RSS feed | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 300 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `rss_feed|rss\.xml|feed\.xml|blog_rss` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None.

### Field 5 — What was NOT checked
- Whether any `.xml` dynamic route exists in `src/pages/` (extension-specific globs not run beyond `src/`).

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 301 — `Blog email newsletter`
**Registry line:** 301
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog email newsletter | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 301 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `newsletter|email_subscribers|mailing_list` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None found.
- Note: Family Newsletter report template (stub 291, adjacent) exists per STUB_REGISTRY as PRD-28B wired — distinct feature (family compliance newsletter, not blog subscriber newsletter).

### Field 5 — What was NOT checked
- Whether any Stripe receipt / Supabase SMTP plumbing exists that could serve this capability.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 302 — `Pinterest auto-pin`
**Registry line:** 302
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Pinterest auto-pin | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 302 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `pinterest|auto_pin` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None.

### Field 5 — What was NOT checked
- Whether any OAuth config references Pinterest API.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 305 — `External calendar sync`
**Registry line:** 305
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| External calendar sync | PRD-14B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 305 — capability phrase; `calendar_events` schema has `external_id`, `external_source`, `last_synced_at` columns per live_schema (columns 20-22 of `calendar_events`), which hints at intended sync scaffolding.
(b) WIRING_STATUS.md — "Calendar Import (Phase 0)" section discusses ICS upload, screenshot, paste link, email forward (stub, DNS not configured), and notes "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)."
(c) CLAUDE.md — no convention for external sync.
(d) PRD-14B — `calendar_events.external_id` / `external_source` / `last_synced_at` columns exist per live_schema (scaffolding without active sync loop).
→ Identifier set: `external_id`, `external_source`, `last_synced_at` on `calendar_events`.

### Field 2 — Code presence check
Grep `external_id|external_source|last_synced_at` in `src/` → 3 files:
- `src/components/queue/SortTab.tsx`
- `src/components/queue/CalendarTab.tsx`
- `src/types/calendar.ts`
(These reference the columns in the import-review flow from ICS files, not an active external-sync loop.)
Grep `external_calendar_sync|ical_sync|google_calendar` in `src/` → 0 hits.

### Field 3 — Wiring check
**Callers/Importers:** The columns are read during ICS import review (CalendarTab + SortTab); no outbound sync.

**Execution-flow location:** Schema scaffolding + inbound ICS import path. No outbound polling/push loop.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md Calendar Import section (quoted above): "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)."
- ICS upload wired; external sync loop not built.

### Field 5 — What was NOT checked
- Whether any `.ics` export endpoint exists (would be outbound one-way sync, not a full sync).

### Field 6 — Observations (no verdict)
Schema scaffolding (external_id, external_source, last_synced_at) exists and is used for inbound ICS import review. No outbound sync loop. Registry's 📌 Post-MVP aligns with WIRING_STATUS.md's "Not built (Phase 1 / post-MVP)" note.

---

## Entry 306 — `Google Calendar integration`
**Registry line:** 306
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Google Calendar integration | PRD-14B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 306 — capability phrase.
(b) WIRING_STATUS.md Calendar Import section explicitly: "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)".
(c) CLAUDE.md — no convention.
(d) PRD-14B — not surfaced at OAuth/integration level.
→ Primary identifier surface would be a Google OAuth handler + a sync Edge Function; neither exists by name.

### Field 2 — Code presence check
Grep `external_calendar_sync|ical_sync|google_calendar` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: "Not built (Phase 1 / post-MVP)".

### Field 5 — What was NOT checked
- Whether any OAuth config in `supabase/` references a Google client_id.

### Field 6 — Observations (no verdict)
No code hits. WIRING_STATUS.md explicitly documents "Not built (Phase 1 / post-MVP)". Registry 📌 Post-MVP aligns.

---

## Entry 329 — `Before-send coaching in Messages tab`
**Registry line:** 329
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Before-send coaching in Messages tab | PRD-25 | PRD-15 | 📌 Post-MVP | LiLa reviews message tone |
```

### Field 1 — Implementation identifier
(a) stub line 329 — capability phrase. Scoped to Guided Dashboard Write Drawer's Messages tab (PRD-25 section per header at line 319). NOT the adult Messages page (which does have coaching wired — CoachingCheckpoint). Distinction matters.
(b) WIRING_STATUS.md — no dedicated row for Guided Messages tab coaching.
(c) CLAUDE.md Convention #139: "Message coaching is a before-send checkpoint, never a blocker. 'Send Anyway' is always available alongside 'Edit'." That convention describes the adult Messages feature (PRD-15).
(d) PRD-25 + PRD-15 — `CoachingCheckpoint.tsx` component exists for PRD-15 Phase E (adult Messages). PRD-25's Guided Write Drawer Messages tab is a navigation bouncer to `/messages`, not an inline coaching surface.
(d.5) Opened `src/components/guided/WriteDrawerMessages.tsx` (named via CLAUDE.md #125 "Messages tab is a stub until PRD-15"): file renders a single "navigate to /messages" button (per `PRD-25 Phase B: WriteDrawerMessages — Tab 2` header + body). No inline composer, no coaching inline.
→ Primary identifier for the capability: `WriteDrawerMessages.tsx` is the component that hosts the stub UI. `CoachingCheckpoint` is the adult analog but is not integrated into WriteDrawerMessages.

### Field 2 — Code presence check
Grep `CoachingCheckpoint` in `src/` → 6 hits in messaging (adult PRD-15) only.
Grep `coaching` in `src/components/guided/` → 3 hits: `GuidedManagementScreen.tsx`, `WriteDrawer.tsx`, `SpellCheckOverlay.tsx`. Not before-send coaching in Messages tab.

First-context window `src/components/guided/WriteDrawerMessages.tsx` lines 1-30 (read): component is a navigation stub — renders MessageCircle icon, unread count, "Go to Messages" prompt. No coaching integration.

### Field 3 — Wiring check
**Callers/Importers:** `WriteDrawerMessages` imported by `WriteDrawer.tsx` (line 15) and exported from `src/components/guided/index.ts` line 11.

**Execution-flow location:** React component in Guided shell Write Drawer. Behaves as nav bouncer to `/messages`, not an inline compose surface — so before-send coaching does not apply here in the current shape.

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 329: 📌 Post-MVP with "LiLa reviews message tone" note.
- STUB_REGISTRY.md line 327 (adjacent): "Messages tab in Write drawer | PRD-25 (Phase B) | PRD-15 (Messages) | ⏳ Unwired (MVP) | 'Coming soon' placeholder" — note the adjacent stub for the tab itself.
- CLAUDE.md #125: "Messages tab is a stub until PRD-15."
- Convention #139: adult Messages before-send coaching (PRD-15) is the template capability.

### Field 5 — What was NOT checked
- Whether future integration will inject `CoachingCheckpoint` into an inline compose form inside `WriteDrawerMessages.tsx` when PRD-25 Phase D lands.
- Whether the adjacent stub line 327 ("Messages tab in Write drawer, ⏳ Unwired") is now out of date given the observed WriteDrawerMessages.tsx uses a navigation bouncer rather than a "Coming soon" placeholder.

### Field 6 — Observations (no verdict)
Registry claims 📌 Post-MVP for before-send coaching specifically in the Guided Write Drawer Messages tab. Current `WriteDrawerMessages.tsx` is a navigation bouncer to `/messages`, so no inline send surface exists that would require coaching. Adult Messages page does have `CoachingCheckpoint` (PRD-15 Phase E). This stub (329) is distinct from the adjacent line 327 stub about the tab itself. Evidence consistent with 📌 Post-MVP.

---

## Entry 335 — `Advanced NBT (energy, Best Intentions, family context)`
**Registry line:** 335
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Advanced NBT (energy, Best Intentions, family context) | PRD-25 | Post-MVP | 📌 Post-MVP | Enhancement to NBT priority engine |
```

### Field 1 — Implementation identifier
(a) stub line 335 — capability phrase; NBT = Next Best Thing (per Convention #126 priority order).
(b) WIRING_STATUS.md — no dedicated row.
(c) CLAUDE.md Convention #126: "Next Best Thing suggestion priority order: overdue > active routine > time-block > mom-priority > next due > opportunities > unscheduled > best intention reminder. Deterministic, not random. AI glaze is Haiku-class, cached per suggestion per session."
(d) PRD-25 — `NextBestThingCard.tsx` is the current implementation.
(d.5) Not invoked — no concrete "Advanced NBT" identifier named in any of (a)-(d).
→ (e) CAPABILITY-ONLY for the "advanced" (energy, best_intentions, family context weighting) variant. Base NBT IS wired per Convention #126.

### Field 2 — Code presence check
Grep `next_best_thing|NextBestThing` in `src/` → 6 files (base NBT is wired, not this stub's subject).
Grep `advanced_nbt|nbt_advanced|next_best_thing.*advanced|priority_engine` → 0 hits.

### Field 3 — Wiring check
Skipped for advanced variant (no identifier).

### Field 4 — Documentation cross-reference
- Convention #126: base NBT algorithm.
- Stub row note: "Enhancement to NBT priority engine" — explicit "not yet" signal.

### Field 5 — What was NOT checked
- Whether any `energy_level` column exists on tasks / family_members that NBT could consume (would be an enhancement surface).
- Whether `best_intentions` already participates in NBT priority logic for Guided shell (per #126, last in priority list).

### Field 6 — Observations (no verdict)
Base NBT is wired (per Convention #126 + existing components). The "advanced" enhancement (energy-aware, family-context-weighted variant) has no code surface. CAPABILITY-ONLY for the advanced variant.

---

## Entry 336 — `"Ask Mom" from NBT`
**Registry line:** 336
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| "Ask Mom" from NBT | PRD-25 | PRD-15 | 📌 Post-MVP | Quick-request when child disagrees with all suggestions |
```

### Field 1 — Implementation identifier
(a) stub line 336 — capability phrase; Guided child disagrees with NBT suggestion → initiates `family_request` to mom (PRD-15 request plumbing).
(b) WIRING_STATUS.md — no row.
(c) CLAUDE.md Convention #145: "Requests are NOT studio_queue items. They have their own lifecycle and live in `family_requests`." PRD-15 scope.
(d) PRD-25 + PRD-15 — `family_requests` table exists (live_schema, 0 rows). No NBT-to-family_request handler surfaced.
→ (e) CAPABILITY-ONLY for the NBT integration specifically.

### Field 2 — Code presence check
Grep `Ask Mom|ask_mom|ask_parent|disagree.*suggest` in `src/components/guided/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #145: `family_requests` table is the plumbing.
- `NextBestThingCard.tsx` exists; no "disagree → request" affordance surfaced.

### Field 5 — What was NOT checked
- Whether `NextBestThingCard.tsx` already has a dismiss/skip button that could route to a family_request in a future build.

### Field 6 — Observations (no verdict)
No "Ask Mom from NBT" identifier or UI affordance. `family_requests` plumbing exists (PRD-15). CAPABILITY-ONLY for this specific integration.

---

## Entry 345 — `Completion-dependent scheduling`
**Registry line:** 345
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Completion-dependent scheduling | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier
(a) stub line 345 — capability phrase, scoped to PRD-35 Universal Scheduler.
(b) WIRING_STATUS.md — no dedicated "completion-dependent" row found in the visible sections, though Calendar section references recurrence.
(c) CLAUDE.md Convention #27: "Completion-dependent schedules generate the next instance from the last completion timestamp, not from a fixed calendar position." Authoritative.
(d) PRD-35 + addenda — `SchedulerOutput.schedule_type = 'fixed' | 'completion_dependent' | 'custody'` exists in types.
(d.5) Opened `src/components/scheduling/types.ts` (named by CLAUDE.md #24 "Schedule data is stored as RRULE JSONB"). File defines `CompletionDependentConfig` interface at line 32-41 with fields `interval`, `unit`, `window_start`, `window_end`, `anchor_date`.
→ Primary identifiers: `schedule_type = 'completion_dependent'` enum discriminator + `CompletionDependentConfig` interface + `completion_dependent` field in `SchedulerOutput`.

### Field 2 — Code presence check
Grep `CompletionDependentConfig|completion_dependent` in `src/components/scheduling/` → 4 files: `schedulerUtils.ts`, `UniversalScheduler.tsx`, `types.ts`, `index.ts`.

First-context window `src/components/scheduling/types.ts` lines 24-41:
```ts
/** Schedule type discriminator */
schedule_type: 'fixed' | 'completion_dependent' | 'custody'
/** Completion-dependent config (only when schedule_type = 'completion_dependent') */
completion_dependent: CompletionDependentConfig | null
/** Custody pattern config (only when schedule_type = 'custody') */
custody_pattern: CustodyPatternConfig | null
}

export interface CompletionDependentConfig {
  interval: number
  unit: 'days' | 'weeks' | 'months'
  /** Due window start (days/weeks/months after completion) */
  window_start: number | null
  /** Due window end (days/weeks/months after completion) */
  window_end: number | null
  /** Anchor date for first occurrence */
  anchor_date: string
}
```

### Field 3 — Wiring check
**Callers/Importers:** `schedulerUtils.ts`, `UniversalScheduler.tsx`, `index.ts` all reference the discriminator. `UniversalScheduler.tsx` header comment explicitly mentions "completion-dependent" (line 7).

**Execution-flow location:** React component (UniversalScheduler) + utils file. Drives scheduler output that consumers persist to RRULE JSONB.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- Convention #27: authoritative description.
- Convention #24-#30: Universal Scheduler architecture.
- Stub row: ✅ Wired in Phase 05 by PRD-35.

### Field 5 — What was NOT checked
- Whether `tasks.recurrence_details` JSONB on consumer rows contains actual `schedule_type='completion_dependent'` values in production (would require DB query).
- Whether `incomplete_action` field on tasks interacts with completion-dependent logic (Convention #69 — fresh reset default).

### Field 6 — Observations (no verdict)
`CompletionDependentConfig` interface defined in `src/components/scheduling/types.ts` with specific field shape. Discriminator `schedule_type='completion_dependent'` present in output type. Referenced in 4 files within `src/components/scheduling/`. Convention #27 corroborates the capability. Evidence supports registry ✅ Wired claim at component/type level.

---

## Entry 346 — `Custody patterns`
**Registry line:** 346
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Custody patterns | PRD-35 | PRD-27 | ✅ Wired | Phase 31 |
```

### Field 1 — Implementation identifier
(a) stub line 346 — capability phrase, scoped to PRD-35 Universal Scheduler with PRD-27 (Caregiver Tools) as wirer.
(b) WIRING_STATUS.md — no dedicated custody-pattern row.
(c) CLAUDE.md Convention #26: "`access_schedules` replaces `shift_schedules` for Special Adult/co-parent access windows." Convention #24: "Schedule data is stored as RRULE JSONB in each consuming feature's `recurrence_details` column. Format: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`." `custody_pattern` is named as a field.
(d) PRD-35 + PRD-27 — `access_schedules` table exists per live_schema (0 rows at dump time).
(d.5) Opened `src/components/scheduling/types.ts` (same file as entry 345). Lines 43-50 define `CustodyPatternConfig`:
```ts
export interface CustodyPatternConfig {
  /** Array of 'A' or 'B' representing the repeating pattern */
  pattern: string[]
  /** Anchor date for pattern start */
  anchor_date: string
  /** Labels for each side */
  labels: { A: string; B: string }
}
```
→ Primary identifiers: `schedule_type='custody'` discriminator + `CustodyPatternConfig` interface + `custody_pattern` field in `SchedulerOutput` + `access_schedules` table.

### Field 2 — Code presence check
Grep `custody_pattern|custody_schedule` in `src/` → 4 files: `src/types/tasks.ts`, `src/components/scheduling/schedulerUtils.ts`, `src/components/scheduling/types.ts`, `src/components/scheduling/CalendarPreview.tsx`.
Grep `custody_pattern|custody_schedule|custody` in `supabase/migrations/` → 4 files:
- `supabase/migrations/00000000100023_tasks_prd09a_full.sql`
- `supabase/migrations/00000000000019_schema_remediation_batch2.sql`
- `supabase/migrations/00000000000009_remediation_schema_batch.sql`
- `supabase/migrations/00000000000004_universal_scheduler.sql`
Grep `CustodyPatternConfig` in `src/components/scheduling/` → 4 files (same list as types).

### Field 3 — Wiring check
**Callers/Importers:** `src/types/tasks.ts` imports custody-pattern shape. `src/components/scheduling/CalendarPreview.tsx` renders custody-pattern events. `schedulerUtils.ts` handles pattern expansion.

**Execution-flow location:** Shared scheduler type consumed by Tasks, Calendar, Scheduler UI. Postgres-side `access_schedules` table exists for persistence.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- Convention #24: `custody_pattern` named in RRULE JSONB format.
- Convention #26: `access_schedules` replaces `shift_schedules`.
- live_schema.md: `access_schedules` table present with `recurrence_details` JSONB, `schedule_type`, `schedule_name`, `start_time`, `end_time` columns.
- Registry: ✅ Wired in Phase 31 by PRD-27.

### Field 5 — What was NOT checked
- Whether any `access_schedules` rows exist in production with `custody` schedule_type (0 rows at dump, implying no real usage yet — feature may be wired but not exercised).
- Whether PRD-27 Caregiver Shift UI pickers are wired to drive the `custody` schedule_type branch.
- Whether migration 100023 (tasks_prd09a_full.sql) is where the custody column landed on tasks vs. access_schedules.

### Field 6 — Observations (no verdict)
`CustodyPatternConfig` interface defined in `src/components/scheduling/types.ts`; consumed by 4 files in `src/`. Schema-side `access_schedules` table exists per live_schema. Grep matches across migrations + source. Convention #24 names `custody_pattern` field explicitly. Registry ✅ Wired claim corroborated at type/component/schema level; live-DB exercise not verified (0 rows at dump time).

<!-- PROGRESS MARKER: completed entries 1-38 of 38 -->

---

## PARTITION COMPLETE

38 entries processed. Registry integrity held at 547 lines throughout. No HALT condition.

Summary:
- CAPABILITY-ONLY (Field 1 resolved at level (e)): 28 entries (221, 222, 224, 225, 226, 227, 228, 232, 238, 239, 240, 241, 242, 276, 277, 278, 281, 282, 284, 287, 288, 289, 290, 292, 298, 299, 300, 301, 302, 335, 336) — wait, recounting:
  - Pure (e) CAPABILITY-ONLY: 221, 222, 224, 225, 226, 227, 228, 232, 238, 239, 240, 241, 242, 276, 277, 278, 281, 282, 284, 287, 288, 292, 298, 299, 300, 301, 302, 335, 336 = **29 entries**
- Identifier-found (Field 1 resolved at (a)/(b)/(c)/(d)/(d.5)): 247, 266, 289 (partial), 290 (partial), 305, 306, 329, 345, 346 = **9 entries** (of which 289 and 290 are partial — identifier implied by registry wired-by column but direct grep hits absent in `src/`).

Founder-judgment flags surfaced:
- Entry 289 (Standards linkage) and 290 (Portfolio export): claimed ✅ Wired via PRD-28B Phase 32 but direct-name greps returned 0 hits in `src/`. Possible the linkage lives under report template content or a differently-named join. Suggest confirming with Phase 32 build file in `.claude/completed-builds/`.
- Entry 247 (Randomizer mastery): Convention #205 explicitly documents this as a Sub-phase C known gap; registry ⏳ Unwired (MVP) aligns tightly.
- Entry 266 (Tracker Goal page earning): Schema + RPC branch present, UI picker wired, trigger gap explicit.
