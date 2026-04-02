# Feature Decision File: PRD-11 — Victory Recorder & Daily Celebration (Phase 12A)

> **Created:** 2026-04-01
> **PRD:** `prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md`
> **Addenda read:**
>   - `audit/UNRESOLVED_CROSS_PRD_ACTIONS.md` (PRD-11 section: 15+ cross-PRD actions, additional source enum values)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant)
>   - 17 other addenda reference PRD-11 but contain no PRD-11-specific overrides
> **Companion PRD:** PRD-11B (Family Celebration — separate phase)
> **Founder approved:** 2026-04-01

---

## What Is Being Built (Phase 12A)

Victory Recorder is the platform's celebration-only surface. It asks one question: "What did you do right?" Users manually record victories (a ta-da list), then trigger "Celebrate This!" to get an AI-generated identity-based narrative connecting what they *did* to who they *are becoming*. Phase 12A builds core recording, browsing, collection celebration, and the Celebration Archive for adults and teens. DailyCelebration for kids, auto-routing from other features, and voice personalities are deferred.

---

## Founder Design Overrides (Supersede PRD Where They Differ)

1. **NO AI celebration text on individual victory save.** Type it, save it, gold sparkle, done. No AI call fires on individual saves. AI is reserved exclusively for collection "Celebrate This!" moment.
2. **"Celebrate This!" is user-triggered, never automatic.** Aggregates victories for selected period and generates identity-based narrative.
3. **Model split:** Sonnet for adult/teen celebrations, Haiku for kids' DailyCelebration. Weekly/monthly family celebrations use Sonnet.
4. **Victories are claimed, not auto-generated from every task.** Auto-routing from task completions is Phase 12B. Phase 12A = manual entry only.
5. **"What Actually Got Done" prompt:** Empty-state behavior when no victories exist for the period.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| VictoryRecorder main page (`src/pages/VictoryRecorder.tsx`) | Replaces placeholder. Period filters, life area filters, victory cards, "Celebrate This!" button, FAB |
| RecordVictory modal (`src/components/victories/RecordVictory.tsx`) | Quick entry. Text + categories + importance. NO AI on save. Gold sparkle. |
| VictoryDetail modal (`src/components/victories/VictoryDetail.tsx`) | Expanded view. Edit description, life area, GS/BI connections, Mom's Picks, source info, archive |
| CelebrationModal (`src/components/victories/CelebrationModal.tsx`) | "Celebrate This!" experience. Fireworks while loading, narrative display, Human-in-the-Mix edit, save/copy/dismiss |
| CelebrationArchive (`src/components/victories/CelebrationArchive.tsx`) | Past celebration narratives. Modal with date-organized cards, copy/delete |
| Empty state on VictoryRecorder | "What Actually Got Done" prompt with Record button |
| GuidedVictories stub update | Keep as stub but improve messaging (Phase 12C: DailyCelebration) |
| CelebrateSection stub on Guided Dashboard | Already exists — no changes Phase 12A |
| InfoRecentVictories widget | Already exists as stub — wire to show actual recent victories |

---

## Key PRD Decisions (Easy to Miss)

1. **Victory Recorder is celebration-only.** NEVER shows incomplete tasks, unfinished goals, or what wasn't done.
2. **Adults' own Victory Recorders are private from each other.** Mom can't see Dad's, Dad can't see Mom's.
3. **Mom sees all children's victories** by default (mom-first architecture).
4. **Gold visual effects ONLY on Victory Recorder, DailyCelebration, and streak milestones.** Gold means victory.
5. **Life area filters are multi-selectable** and auto-sorted by usage frequency.
6. **Custom tags** (TEXT[]) supported alongside default life area categories — seasonal/focus tags.
7. **Special filter modes:** Best Intentions, Guiding Stars, LifeLantern — filter victories to those connected to the feature.
8. **Source link persistence:** Victory survives source deletion. Link becomes "Original source no longer available."
9. **Deduplication via source_reference_id** — prevents duplicate victories from same source event.
10. **Long-press on victory card** → quick actions: Mom's Pick toggle, Archive, Copy.
11. **Celebration text rules:** Identity-based, proportionate, sincerity over enthusiasm, summarize don't itemize, vary daily.
12. **`member_type`** is set from family_member role at creation time (adult/teen/guided/play).
13. **`recorder_type`** defaults to 'myaim' — 'stewardship' value exists for future data migration.
14. **Mom's Pick**: mom designates on anyone's victories (including her own). Gold star indicator + optional note.
15. **Importance levels affect celebration proportionality:** small_win gets warm acknowledgment, major_achievement gets something bigger.

---

## Addendum Rulings

### From UNRESOLVED_CROSS_PRD_ACTIONS.md:
- Additional `victories.source` enum values needed (already in migration): `'reflection_routed'`, `'homeschool_logged'`, `'plan_completed'`, `'milestone_completed'`, `'family_feed'`, `'bookshelf'`
- These are already included in the existing CHECK constraint in migration 00000000000009

### From PRD-Audit-Readiness-Addendum:
- No PRD-11-specific rulings found

---

## Database Changes Required

### Existing Tables (Already Created — Migration 00000000000009)
- `victories` — All columns match PRD-11 spec. CHECK constraints include all source values.
- `victory_celebrations` — Exists with modes: 'individual', 'review', 'collection'. Missing: 'monthly' mode.
- `victory_voice_preferences` — Exists with UNIQUE on family_member_id.

### Schema Gaps to Fix (New Migration)
1. **Add `monthly` to `victory_celebrations.mode` CHECK constraint** — PRD specifies 4 modes
2. **Add `life_area_tag` index** — `idx_v_member_area ON victories (family_id, family_member_id, life_area_tag)` — PRD specifies this but migration 00000000000009 didn't create it
3. **Add activity log trigger** — `AFTER INSERT ON victories` → insert into `activity_log_entries`
4. **Add mom INSERT policy for victories** — Current RLS only has `v_manage_own` (own member) and `v_select_parent` (read). Mom needs INSERT policy for recording children's victories.
5. **Add mom UPDATE policy for victories** — Mom needs UPDATE for Mom's Picks on children's victories.
6. **Add parent SELECT policy for victory_celebrations** — Mom needs to read children's celebrations.

### Migrations
- Single migration: `00000000100078_victory_recorder_phase_12a.sql`
  - ALTER `victory_celebrations` CHECK for `monthly` mode
  - CREATE INDEX for life_area_tag
  - CREATE activity log trigger function + trigger
  - ADD missing RLS policies for mom access

---

## Feature Keys

Already seeded in migration 00000000000009:

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `victory_recorder_basic` | Essential | mom, dad_adults, independent_teens | Manual entry, browsing |
| `victory_recorder_celebrate` | Essential | mom, dad_adults, independent_teens | "Celebrate This!" AI narrative |
| `victory_moms_picks` | Essential | mom | Mom's Picks designation |
| `daily_celebration` | Essential | guided_kids, play_kids | DailyCelebration (Phase 12C) |

---

## Stubs — Do NOT Build This Phase

- [ ] DailyCelebration 5-step sequence for Guided/Play (Phase 12C)
- [ ] Voice personality selection UI + per-member preference (Phase 12C)
- [ ] Auto-routing from tasks/trackers/intentions/widgets/lists (Phase 12B — AIR pipeline)
- [ ] Activity Log scan intelligence / suggested victories (Phase 12B)
- [ ] CompletionNotePrompt toast (Phase 12B)
- [ ] Dashboard victory widget wiring (Phase 12B — InfoRecentVictories already exists as stub)
- [ ] Notepad "Flag as Victory" routing (Phase 12B)
- [ ] LiLa victory detection action chip (Phase 12B)
- [ ] Family Celebration mode (PRD-11B)
- [ ] LifeLantern context in celebration generation (future)
- [ ] Evening Rhythm / Reckoning integration (PRD-18)
- [ ] Victory Reports (post-MVP)
- [ ] TTS audio (post-MVP)
- [ ] Premium voice personalities (post-MVP)
- [ ] Celebration Cards visual (post-MVP)
- [ ] Auto-archive to Archives (post-MVP)
- [ ] Pattern Insights for teens (post-MVP)
- [ ] Victory heatmap for adults (post-MVP)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Victory Recorder | ← reads | Guiding Stars | `guiding_stars` table (for celebration context + GS filter + GS connection) |
| Victory Recorder | ← reads | Best Intentions | `best_intentions` table (for celebration context + BI filter + BI connection) |
| Victory Recorder | ← reads | InnerWorkings | `self_knowledge` table (strengths/growth areas for celebration context) |
| Victory Recorder | → writes | Activity Log | `activity_log_entries` via trigger on INSERT |
| Victory Recorder | → writes | Victory Celebrations | `victory_celebrations` table |
| "Celebrate This!" | → calls | celebrate-victory Edge Function | OpenRouter AI (Sonnet) |
| QuickCreate FAB | → opens | RecordVictory modal | Already wired: `/victories?new=1` |
| Sidebar nav | → navigates | VictoryRecorder page | Already wired: `/victories` |
| RoutingStrip | → routes to | Victory | Already wired: destination key `victory` |

---

## Things That Connect Back to This Feature Later

- **Phase 12B:** Auto-routing from task completions, tracker entries, intention iterations, widget milestones, list completions → creates victory records silently (AIR pipeline)
- **Phase 12B:** LiLa victory detection → [Save as Victory] action chip in conversations
- **Phase 12B:** InfoRecentVictories widget → shows actual recent victories on dashboard
- **Phase 12C:** DailyCelebration → 5-step sequence for Guided/Play shells
- **Phase 12C:** Voice personalities → text style variation for celebrations
- **PRD-11B:** Family Celebration → communal ritual reading all family victories
- **PRD-18:** Evening Rhythm → reads today's victories for Reckoning review
- **PRD-13:** Archives → monthly victory aggregation

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct
- [x] Feature keys identified
- [x] **Approved to build** (2026-04-01)
- Note: Non-streaming Edge Function is correct for Phase 12A. Streaming is upgrade path if Sonnet latency becomes a UX issue.

---

## Post-Build PRD Verification (Phase 12A)

> Phase 12A completed 2026-04-01. Core recording, celebration, archive all wired.

---

## Phase 12B — Intelligence Layer & Cross-Feature Wiring

> **Started:** 2026-04-02
> **Founder approved:** 2026-04-02

### Founder Design Overrides (Phase 12B)

1. **No silent auto-routing** — PRD says auto-create victories from task completions. Founder override: Activity Log captures actions → Haiku scan surfaces meaningful patterns → user claims/edits/skips. Human-in-the-Mix applied to victory recognition.
2. **Activity Log scan looks for meaning** — Not just "task X completed" but "You've been consistently working on that project every morning" and "Three separate conversations with your kids this week."
3. **"What Actually Got Done" prompt** — Captures invisible labor when Activity Log is sparse. Source = 'reckoning_prompt'.
4. **CompletionNotePrompt** — Non-blocking 8s auto-dismiss toast enriching activity data.
5. **Evening Reckoning integration stub** — Hook for PRD-18 to consume.

### Build Items (Phase 12B — 10 items)

1. Add `reckoning_prompt` source type to VictorySource union + SOURCE_LABELS
2. scan-activity-victories Edge Function (Haiku, ~$0.001/scan)
3. Victory Suggestions UI (Scan My Activity button, suggestion cards, Claim/Edit/Skip)
4. Enhanced "What Actually Got Done" prompt (sparse activity detection)
5. CompletionNotePrompt component + wire into task completion flow
6. Activity log entries for 4 missing sources (intention, widget, list item, routine)
7. Notepad "Flag as Victory" routing (direct creation, source='notepad_routed')
8. LiLa "Record Victory" action chip (enabled, no AI detection — user-initiated)
9. useVictoryReckoningContext hook (stub API for PRD-18)
10. TypeScript check — tsc -b zero errors

### Stubs (NOT Building Phase 12B)

- DailyCelebration 5-step sequence (Phase 12C)
- Voice personalities (Phase 12C)
- Family Celebration (PRD-11B)
- Auto-route source configuration per member (Settings, future)
- Reflection response → Victory routing (PRD-18)
- Victory Reports, TTS audio, Celebration Cards, Pattern Insights (post-MVP)

### Post-Build PRD Verification (Phase 12B)

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build — Phase 12B)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**

---

## Phase 12C — DailyCelebration for Kids + Voice Personalities

> **Started:** 2026-04-02
> **PRDs read:** PRD-11 (Screen 5, voice keys, shell behavior, AI rules 9-12), PRD-25 (Celebrate button, Step 2.5), PRD-26 (Play dashboard, maximum delight)
> **Founder approved:** 2026-04-02

### What Is Being Built

DailyCelebration — 5-step sequenced celebration for Guided/Play dashboards. Voice personalities — 15 text-style variations for ALL members' celebrations. Completes PRD-11 (excluding PRD-11B Family Celebration).

### Critical Bug Fixed

**`roleToMemberType()` in celebrate-victory Edge Function always returned 'adult'** — checked `role` (which is 'member' for kids) instead of `dashboard_mode`. Fixed to read `dashboard_mode`, ensuring Haiku for guided/play kids.

### Build Items (12 — all complete)

1. celebrate-victory Edge Function: `voice` param + `roleToMemberType()` fix + 15 voice instructions
2. VoicePersonality type (15 keys: 5 essential + 10 full_magic) + constants + defaults
3. useVoicePreference hook (read/write victory_voice_preferences, shell-aware defaults)
4. VoiceSelector component (grid with labels, descriptions, sample lines)
5. DailyCelebration component (5-step overlay, shell-aware Play/Guided rendering)
6. SimplifiedRecordVictory (kid-friendly: description + category only)
7. ConfettiBurst (full-screen confetti, moderate/maximum, CSS animations, reduced-motion)
8. AnimatedList (staggered item reveal with configurable delay)
9. CelebrateSection wired in GuidedDashboard (replaced disabled stub)
10. PlayShell Celebrate button rewired to launch DailyCelebration overlay
11. VoiceSelector integrated on VictoryRecorder page
12. TypeScript check — tsc -b zero errors

### Key Decisions

1. DailyCelebration is a full-screen overlay, not page navigation
2. Play = maximum delight (56px targets, confetti, bouncing, simple excited language)
3. Guided = moderate (48px targets, clean animations, specific praise)
4. Steps 3+4 auto-skip (stubs for PRD-24)
5. Zero-victory path: greeting → "Every day is a new chance!" → manual entry → close
6. Narrative triggers during Step 2 (Haiku review, non-blocking)
7. Voice affects text style only — no TTS for MVP
8. All 15 voices available during beta
9. "Share with Mom" saves celebration record — no notification push until PRD-15

### Stubs (NOT Building)

- [ ] Step 2.5 Reflections UI (PRD-25 Phase B)
- [ ] Step 3 streak data (PRD-24)
- [ ] Step 4 Visual World + Overlay (PRD-24)
- [ ] "Share with Mom" notification delivery (PRD-15)
- [ ] Voice in Settings page (PRD-22)
- [ ] Premium voice tier gating (PRD-31)
- [ ] TTS audio (post-MVP)
- [ ] Family Celebration (PRD-11B)

### Post-Build PRD Verification (Phase 12C)

> To be completed after build verification.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build — Phase 12C)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
