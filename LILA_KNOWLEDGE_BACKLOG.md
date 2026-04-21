---
Status: COMPLETE — Scope 6 audit pass 2026-04-20
Type: Discrepancy backlog (reporting-only — no fixes during audit)
Feeds: Gate 4 LiLa knowledge rewrite
Sources audited:
  - src/lib/ai/help-patterns.ts (36 patterns)
  - supabase/functions/_shared/feature-guide-knowledge.ts (8 page-knowledge entries, 13 use-case recipes)
Ground truth sources:
  - CLAUDE.md Conventions #1–#245
  - STUB_REGISTRY.md (~218 stubs)
  - WIRING_STATUS.md
  - claude/live_schema.md
  - AUDIT_REPORT_v1.md + scope-2-evidence/DECISIONS.md (70 Scope 2 findings)
---

# LiLa Knowledge Discrepancy Backlog

> Scope 6 of the Phase 2 audit is reporting-only. This document enumerates every discrepancy between what LiLa's `help-patterns.ts` + `feature-guide-knowledge.ts` tell mom vs. what the code and UI actually do. **No fixes are applied during audit.** The backlog feeds Gate 4's LiLa knowledge rewrite, where each discrepancy becomes a targeted edit.
>
> **Classification legend**
> - **Unbuilt** — LiLa tells mom a feature works, but the referenced code/UI is absent or stubbed.
> - **Superseded** — Feature works, but differently than the help/guide text describes (PRD/spec evolved; LiLa text did not follow).
> - **Missing coverage** — Feature exists and works, but LiLa has no help pattern AND no feature-guide entry for it.
> - **Outdated reference** — Cites a specific path, component, count, table, or field name that is stale (renamed/removed/changed).
>
> **Non-findings.** Scope 6 produces a single backlog document, not `SCOPE-6.F{N}` entries in `AUDIT_REPORT_v1.md`. Cross-references to Scope 2 findings and STUB_REGISTRY rows are provided for traceability.

---

## Summary

- **36 help-patterns audited** — 14 have at least one discrepancy (39%).
- **8 page-knowledge entries audited** — 3 have at least one discrepancy (38%).
- **13 use-case recipes audited** — 1 has a discrepancy (8%).
- **Total discrepancies recorded: 43**
  - Describes unbuilt feature: **9**
  - Describes superseded behavior: **7**
  - Missing coverage: **22**
  - Outdated reference: **5**

The overwhelming pattern: help text was written to aspirational PRD text and never reconciled against (a) subsequent Scope 2 unbuilt findings, (b) Build M / Build J / Build P supersessions, or (c) post-Build-H feature additions that nobody added help for. Gate 4 rewrite should start from the unbuilt category (highest user-harm risk — LiLa actively lies to mom) and finish with the missing-coverage category (largest surface area — many PRDs shipped without LiLa catching up).

---

## Describes unbuilt feature

LiLa tells mom how to use a feature that is not wired. Highest user-harm category — mom follows LiLa's instructions and hits a dead end, broken screen, or no-op.

| # | LiLa claim | Actual state | Cross-ref |
|---|---|---|---|
| D1 | `account` pattern ([help-patterns.ts:40](src/lib/ai/help-patterns.ts#L40)) — "To reset your password, go to **Settings > Account > Change Password**." | No `/settings/account` route exists. No account management UI exists. Settings is a route not an overlay per F50; account sub-page was never built. Password reset for authenticated users is not a wired flow. | SCOPE-2.F50 (Settings overlay deferred); SCOPE-2.F51 (account-deletion minor-screens deprioritized — covers Account tab family) |
| D2 | `subscription` pattern ([help-patterns.ts:45](src/lib/ai/help-patterns.ts#L45)) — "You can manage your subscription in **Settings > Billing**." + lists 4 tier prices + "Founding families get lifetime discounted rates." | No `/settings/billing` route. Zero Stripe code anywhere in the codebase. `family_subscriptions` table exists (2 seed rows) but has no consumer UI, no webhook, no checkout flow, no portal. Tier prices and founding-rate facts are accurate, but the "manage in Settings > Billing" instruction is fiction. | SCOPE-2.F1 (tier monetization infrastructure unbuilt); STUB_REGISTRY: "Recalculate tier blocks Edge Function — Unwired (MVP)" |
| D3 | `lila` pattern ([help-patterns.ts:65](src/lib/ai/help-patterns.ts#L65)) — "I have different modes: Help (troubleshooting), Assist (feature guidance), and **Optimizer (prompt crafting)**." | Optimizer mode_key exists in `lila_guided_modes` and appears in the mode picker, but tapping it does not launch an optimization flow. Explicit TODO in `PromptPackDetail.tsx:152` marks the gap. PRD-05C Optimizer is an Enhanced-tier flagship; 4 tables, 5 screens, 9-step pipeline all absent. Telling mom Optimizer is a usable mode is misleading. | SCOPE-2.F9 (PRD-05C Optimizer infrastructure unbuilt); STUB_REGISTRY L52 "MISLEADING UI: optimizer mode_key appears in LiLa mode picker, but PRD-05C Optimizer flow not built" |
| D4 | `dashboard` pattern ([help-patterns.ts:95](src/lib/ai/help-patterns.ts#L95)) — "Add widgets for **habit tracking**, countdowns, coloring pages, and more." | `task_type='habit'` enum value exists with zero consumer code. No Habit creation flow, no Habit widget. Countdowns + coloring pages are wired; habit tracking as a distinct widget is not. | SCOPE-2.F26 (Habit task type unwired — 3-mode branching remediation pending); WIRING_STATUS "Track — Stub" |
| D5 | `victories` pattern ([help-patterns.ts:100](src/lib/ai/help-patterns.ts#L100)) — "Log wins manually, or let the platform **auto-route them from task completions and Best Intention milestones**." | Automatic Intelligent Routing (AIR) is explicitly stubbed. `useTaskCompletion.ts:106-108` has the auto-victory call **commented out** with `(stub — PRD-11)` marker. `useLogIntentionIteration` writes iteration + activity_log but does not insert a victory. Widget-milestone auto-routing also unwired. Only `list_completed` auto-victory fires (migration 100102). Three of the three designed AIR sources are off. | STUB_REGISTRY L69, L93, L119 (three separate AIR stub rows); CLAUDE.md AIR definition notes silent auto-routing — reality is manual-only except list completions |
| D6 | `reward_spinner` pattern ([help-patterns.ts:236](src/lib/ai/help-patterns.ts#L236)) — "Studio > Gamification & Rewards > Reward Spinner > Customize — This opens the **tracker widget configurator with the spinner preset**." | `studio_reward_spinner` template (id: 669, templateType: `widget_randomizer_spinner`) is registered in `studio-seed-data.ts`, but **no dedicated wizard component exists**. `[Customize]` falls through to the generic widget creator per STUB_REGISTRY L416 ("Widget starter configs... deploy flow either no-ops or falls through to generic creator"). Help text implies a guided wizard; reality is a bare-bones generic configurator. | STUB_REGISTRY L393, L416 (Studio seed templates / widget starter configs partially wired with fallthrough); pending Universal Setup Wizards workstream |
| D7 | `meetings` pattern #2 ([help-patterns.ts:252](src/lib/ai/help-patterns.ts#L252)) + `/meetings` PAGE_KNOWLEDGE ([feature-guide-knowledge.ts:82](supabase/functions/_shared/feature-guide-knowledge.ts#L82)) — "**RECORD AFTER: Capture meeting retrospectively — tell LiLa what was discussed, get structured summary.**" Help also references "Hit Live Mode for real-time LiLa-facilitated conversation, or Record After to capture a meeting retrospectively." | Text-based Record After flow is wired (button confirmed at `StartMeetingModal.tsx:159` labeled "Capture what you already discussed"). However, **voice input / audio recording is not built** — the `Record After` language phrasing implies an audio capture capability mom doesn't actually get. Voice recording + transcription pipeline is Post-MVP per STUB_REGISTRY L159–L160. | STUB_REGISTRY L159 "Meeting voice input/recording (Record After) — 📌 Post-MVP"; STUB_REGISTRY L160 "Meeting transcription + Review & Route from voice — Post-MVP" |
| D8 | `/tasks` PAGE_KNOWLEDGE ([feature-guide-knowledge.ts:41](supabase/functions/_shared/feature-guide-knowledge.ts#L41)) — "TASKS PAGE — **6 tabs: My Tasks, Routines, Opportunities, Sequential, Queue, Finances.**" | Tasks.tsx ships **5 tabs** (My Tasks, Routines, Opportunities, Sequential, Queue). There is **no Finances tab**. Financial data lives in `/finances` or Settings → Allowance surfaces; it was never a Tasks-page tab. | Verified `src/pages/Tasks.tsx` — 5 tabs total; PRD-28 Allowance lives on its own surfaces |
| D9 | `subscription` + `chore_system` patterns reference **"Settings > Allowance > [child]"** ([help-patterns.ts:241](src/lib/ai/help-patterns.ts#L241)) as the path to enable allowance. | Allowance UI exists (PRD-28 Build O) but is accessible via Family Members / child-detail route per Build O wiring — not via "Settings → Allowance" as a top-level Settings sub-page. The path description is aspirational/outdated. | Verified no `/settings/allowance` route; `allowance_configs` table + UI wired via Family Members detail panel |

---

## Describes superseded behavior

Feature works, but the help/guide text describes it per an older PRD version or build state. Lower user-harm than Unbuilt (mom gets somewhere functional) but still wrong — LiLa names wrong paths, counts, or categories.

| # | LiLa claim | Actual state | Cross-ref |
|---|---|---|---|
| S1 | `theme` pattern ([help-patterns.ts:85](src/lib/ai/help-patterns.ts#L85)) — "Choose from **38 color themes** across 6 mood categories." | Live count is **46 themes**, confirmed in `src/lib/theme/tokens.ts:117-139` (9 Original + 7 Warm & Cozy + 7 Cool & Calm + 6 Bold & Rich + 5 Soft & Light + 6 Bright & Fun + 6 Seasonal). Scope 2 F6 codified 46 as truth; PRD-03 + Convention #42 scheduled for update to 46. LiLa still says 38. | SCOPE-2.F6 (theme count 46 vs spec 38 — codify 46) |
| S2 | `calendar` pattern ([help-patterns.ts:90](src/lib/ai/help-patterns.ts#L90)) — "Add events from the Calendar page or by tapping **'Add Event'** in the QuickTasks bar." | QuickTasks strip does not contain an "Add Event" pill. It contains a **"Calendar"** pill that navigates to `/calendar`; event creation happens on the Calendar page via the `[+ Event]` button. Help text describes a QuickTask that was never shipped (or was renamed). | Verified `src/components/shells/QuickTasks.tsx` — "Calendar" not "Add Event"; Quick Create FAB is the closest replacement per CLAUDE.md Convention / QuickCreate component |
| S3 | `journal` pattern ([help-patterns.ts:75](src/lib/ai/help-patterns.ts#L75)) — "Journal supports multiple entry types: daily reflections, gratitude, **prayers, letters, memories**, and more." | Real entry types per `JOURNAL_ENTRY_TYPES` in `src/hooks/useJournal.ts:4-37` and CLAUDE.md Convention #20: `journal_entry, gratitude, reflection, quick_note, commonplace, kid_quips, meeting_notes, transcript, lila_conversation, brain_dump, custom` (11 types). **"Prayers", "Letters", and "Memories" do not exist as entry types.** Mom may try to filter Journal by an entry type LiLa named that isn't there. | CLAUDE.md Convention #20 (authoritative entry type list) |
| S4 | `notepad` pattern ([help-patterns.ts:80](src/lib/ai/help-patterns.ts#L80)) — "Route content to Journal, Tasks, Lists, or **10+ other destinations**." | RoutingStrip has 13 destinations registered (ROUTING_DESTINATIONS in `useNotepad.ts:10-22`), but **Track, Message, Agenda (partially), Optimizer are stubs or deferred**. Actual fully-working destination count is ~8. WIRING_STATUS.md line-by-line confirms. "10+" overcounts functional destinations. | WIRING_STATUS.md RoutingStrip Destinations table (Track=Stub, Message=Stub, Optimizer=Stub, Acknowledge=Stub) |
| S5 | `guided_dashboard_setup` + `play_dashboard_setup` patterns ([help-patterns.ts:122](src/lib/ai/help-patterns.ts#L122), [:127](src/lib/ai/help-patterns.ts#L127)) — "**Settings > Family Management** > find the child > Edit" | Path is loosely correct but the wording implies Settings is a single settings overlay with a "Family Management" section. In reality, mom accesses the Family Members surface via the floating gear icon (Convention #53: "Settings is NOT in the sidebar. Access only via floating gear icon"), which opens Family Members directly — the "Settings > Family Management" path is a fiction. F50 documents that the Settings overlay itself is unbuilt. | SCOPE-2.F50 (Settings overlay deferred — embeds not built); CLAUDE.md Convention #53 |
| S6 | `gamification_setup` + `task_segments` + `chore_system` patterns reference **"Settings > Gamification > select the child"** ([help-patterns.ts:142](src/lib/ai/help-patterns.ts#L142), [:138](src/lib/ai/help-patterns.ts#L138), [:241](src/lib/ai/help-patterns.ts#L241)). | `GamificationSettingsModal` exists (Build M Convention #221), but per F50 the Settings overlay is a route not an overlay. The intended embedding ("go to Settings → pick child → Gamification panel inside Settings") does not exist; instead Gamification settings launch from the Family Members per-child detail surface. The path name is wrong even though the modal works. | SCOPE-2.F50 (Settings overlay + embeds deferred); CLAUDE.md Convention #221 |
| S7 | `meetings` pattern #1 ([help-patterns.ts:248](src/lib/ai/help-patterns.ts#L248)) — "Pick a meeting type: **Couple, Parent-Child, Mentor, or Family Council**." | Code accepts 4 built-in types + `custom`, so the list is accurate. But Scope 2 F42 superseded the original PRD-16 9-type enum (removing `weekly_review`, `monthly_review`, `quarterly_inventory`, `business`) — the removed types still appear in some PRD-16 text. Help text here is on the newer side, but the `business` meeting use case that mom might have read about in PRD-16 is now served by `custom` templates. If mom asks specifically about "business meeting type," LiLa has no pattern and the list she names won't include it. | SCOPE-2.F42 (PRD-16 meeting_type enum 9→5 override per feature decision 2026-04-14) |

---

## Missing coverage

Features that ship and work in production, but have **no help pattern AND no feature-guide entry**. LiLa's pattern-match misses → falls through to AI call → even the AI has no page-knowledge primer for these surfaces.

| # | Feature (wired & working) | Why LiLa needs coverage | Cross-ref |
|---|---|---|---|
| M1 | **ThoughtSift 5 tools** — Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator | All 5 wired per Build 34A/34B (PRD-34). Each has its own guided mode + Edge Function + Vault listing. Zero help pattern, zero feature-guide recipe. Users landing in any ThoughtSift tool will get a generic LiLa response. | CLAUDE.md Conventions #92–#105 (all 5 tools); STUB_REGISTRY L457–L458 (wired); lila_guided_modes has 5 mode rows |
| M2 | **AI Vault + AI Toolbox** | PRD-21A Vault fully browsable, Toolbox wired for per-member tool curation (pre-F45 sidebar removal, Toolbox still functional on dashboards). No help pattern explaining "what is the Vault" / "how do I add a tool to my Toolbox" / "what's the difference." | CLAUDE.md Convention #80 (storefront vs launcher); SCOPE-2.F45 (Toolbox sidebar to be restored); STUB_REGISTRY L208–L214 |
| M3 | **Cyrano, Higgins Say, Higgins Navigate** (PRD-21 communication tools) | All 3 wired Edge Functions + guided modes. Mom invokes via QuickTasks Cyrano/Higgins pills. No help pattern for "how does Cyrano work" / "when should I use Higgins Navigate." | STUB_REGISTRY L78; PRD-21 communication drafts table wired |
| M4 | **Love Language tools** — quality_time, gifts, observe_serve, words_affirmation, gratitude | 5 guided modes wired per PRD-21. Accessible from QuickTasks Love Languages pill. No help pattern, no use-case recipe. | claude/ai_patterns.md LiLa Modes table — all 5 listed; no LiLa knowledge entry |
| M5 | **Guided Forms — SODAS, What-If Game, Apology Reflection, Custom** | All 4 subtypes wired per PRD-09B (Guided Form assign modal, child fill view, mom review all ✅ in STUB_REGISTRY). Zero help pattern explaining "what is a guided form" or "when would I use SODAS." | STUB_REGISTRY L397–L399 (assign/fill/review all wired); specs/studio-seed-templates.md §Guided Forms |
| M6 | **Task Breaker AI** (Standalone Modal + inline in TaskCreationModal) | Wired 2026-04-13 with text + image modes, Zap pill in QuickTasks strip, dedicated `task-breaker` Edge Function (Haiku text / Sonnet image). Single AI Vault entry exists. No help pattern for "how do I break down a task" / "when do I use image mode." | WIRING_STATUS "Task Breaker AI" section — all rows Wired; AI Vault migration 100132 |
| M7 | **Randomizer draw modes** — Focused / Buffet / Surprise Me | Build J shipped all 3 modes with per-list `draw_mode` config + Surprise Me auto-draw determinism. Help text for `randomizer_opportunity` only mentions the opportunity-flag checkbox, not the three distinct draw modes mom can configure. | CLAUDE.md Convention #162–#163; Build J completed-build record |
| M8 | **Linked routine steps** (step_type: static / linked_sequential / linked_randomizer / linked_task) | Build J + 2026-04-13 follow-up wired routine steps that link to other content sources; child dashboard renders linked content expansion. No help pattern explaining "how to build a routine that pulls from a sequential list." | CLAUDE.md Convention #157; WIRING_STATUS "Linked routine steps — dashboard rendering — Wired" |
| M9 | **Practice sessions + Mastery approval workflow** | Build J wired practice_count and mastery advancement modes + PendingApprovalsSection mastery fork + randomizer mastery inline approval. Mom approves / rejects mastery submissions; rejection resets to `practicing` not `rejected`. No help pattern for "what is mastery mode" / "how do I approve mastery." | CLAUDE.md Conventions #158–#161; STUB_REGISTRY L493, L500–L501 |
| M10 | **Curriculum Parse (Paste Curriculum button)** | Dedicated `curriculum-parse` Edge Function (Haiku) wired into SequentialCreator `[Paste Curriculum]` button. Mom pastes a TOC, AI parses to items with advancement metadata. Help text's `sequential_collection` pattern mentions it as "Paste Curriculum for AI-assisted import" but gives no walkthrough recipe. | CLAUDE.md Convention #165; STUB_REGISTRY L496 |
| M11 | **Log Learning widget + Homeschool time logs** (PRD-28) | Full homeschool time logging surface wired — Log Learning widget + homework-estimate Edge Function + homeschool_time_logs table. Mom logs time, AI estimates subject allocation. Zero help pattern, zero feature-guide entry. PRD-28 Build O was one of the largest recent builds. | STUB_REGISTRY L514 (homework-estimate wired); CLAUDE.md Convention #227–#228 |
| M12 | **Allowance system** (weekly calculation, grace days, bonus tiers, loans) | PRD-28 Build O ships full allowance pipeline — allowance_configs, allowance_periods, financial_transactions append-only ledger, loans table. Mentioned only in passing in `chore_system` pattern ("optional: enable allowance"). No walkthrough recipe for "how do I set up my child's allowance." | CLAUDE.md Convention #223–#228 |
| M13 | **Family Best Intentions + Family Intention Iterations** | `family_best_intentions` + `family_intention_iterations` tables wired. Surfaces on Family Hub. `best_intentions` help pattern mentions family-level in one sentence but has no use-case recipe for "the whole family working on patience together." | claude/live_schema.md (family_best_intentions 1 row, family_intention_iterations 4 rows) |
| M14 | **Countdowns** (Family Hub) | `countdowns` table wired; mom can add vacation/birthday countdowns to Family Hub. Mentioned once in `family_hub` pattern but no guidance for setup. | claude/live_schema.md (countdowns 1 row) |
| M15 | **PerspectiveSwitcher** (mom-only: Personal / Family Overview / Family Hub) | PRD-04 Convention #50 — segmented control on dashboard page only. Zero help pattern for "switching perspectives" / "what is Family Overview." | CLAUDE.md Convention #50; PRD-14C Family Overview |
| M16 | **Beta Glitch Reporter** (beta_glitch_reports) | 49 rows in live schema — mom is actively using it. No help pattern for "how do I report a bug" / "where do I see my reports." `bug-reports` skill exists but mom-facing LiLa path is absent. | claude/live_schema.md (beta_glitch_reports 49 rows); available skill `bug-reports` |
| M17 | **Archive context items + three-tier toggle** (Heart/HeartOff `is_included_in_ai`) | Full Archives UI + three-tier context toggle pattern is the ["checked somewhere, checked everywhere"](CLAUDE.md) signature. No help pattern for "how do I control what LiLa knows about my kid" / "what does the heart icon mean." | CLAUDE.md Conventions #74–#79; live_schema archive_context_items 173 rows |
| M18 | **Content Corner** (messaging space_type='content_corner', link previews, lock state) | PRD-15 Build G shipped Content Corner. `messaging_content_corner` feature key exists. No help pattern for "what is Content Corner" / "how do I share a link to my family." | CLAUDE.md Convention #147; feature_key_registry content_corner entries |
| M19 | **Message Coaching** (per-member toggle, before-send checkpoint) | `message_coaching_settings` table wired with 4 rows. Mom configures which children get coaching. No help pattern for "what is coaching" / "how do I turn it on for my teen." | CLAUDE.md Convention #139; live_schema message_coaching_settings |
| M20 | **Out of Nest members** (separate table, messaging-only access) | `out_of_nest_members` table wired with 4 rows. Distinct from `family_members`. No help pattern for "how do I add my adult daughter" / "why can't she use the full app." | CLAUDE.md Conventions #18, #142; live_schema out_of_nest_members 4 rows |
| M21 | **MindSweep from Rhythms (MindSweep-Lite evening)** | Build L/L.1 wired MindSweep-Lite embedded in the evening rhythm with 11+ destinations + release disposition override. `mindsweep` pattern describes the standalone MindSweep flow but not the evening-embedded variant. | CLAUDE.md Conventions #180–#183 |
| M22 | **Morning Insight + Feature Discovery + Tomorrow Capture** (rhythms Phase C additions) | All wired in Build L. `rhythms` help pattern mentions them at a high level but has no recipe for "what is Morning Insight" / "how does Feature Discovery decide what to show me." | CLAUDE.md Conventions #183–#191 |

---

## Outdated reference

Specific paths, component names, counts, table names, or field names that are factually stale. These often overlap with Unbuilt or Superseded categories; items here are primarily single-token corrections rather than broader conceptual drift.

| # | Stale reference | Correct reference | Location |
|---|---|---|---|
| O1 | **"38 color themes"** in `theme` pattern | 46 themes (9 Original + 7 Warm & Cozy + 7 Cool & Calm + 6 Bold & Rich + 5 Soft & Light + 6 Bright & Fun + 6 Seasonal) | [help-patterns.ts:85](src/lib/ai/help-patterns.ts#L85) → Scope 2 F6 |
| O2 | **"6 tabs: ... Finances"** in `/tasks` PAGE_KNOWLEDGE | 5 tabs: My Tasks, Routines, Opportunities, Sequential, Queue | [feature-guide-knowledge.ts:41](supabase/functions/_shared/feature-guide-knowledge.ts#L41) |
| O3 | **"Add Event in the QuickTasks bar"** in `calendar` pattern | QuickTasks has a "Calendar" pill (navigates to /calendar); event creation is on the Calendar page via `[+ Event]`. Quick Create FAB is the only + New Event quick action | [help-parameters.ts:90](src/lib/ai/help-patterns.ts#L90) |
| O4 | Journal entry types list **"prayers, letters, memories"** in `journal` pattern | Actual entry types per Convention #20: `journal_entry, gratitude, reflection, quick_note, commonplace, kid_quips, meeting_notes, transcript, lila_conversation, brain_dump, custom` | [help-patterns.ts:75](src/lib/ai/help-patterns.ts#L75) |
| O5 | **"Settings > Billing"** / **"Settings > Account"** / **"Settings > Allowance"** in multiple patterns | These sub-routes do not exist. Allowance lives via Family Members per-child detail; Billing is unbuilt; Account management is unbuilt | [help-patterns.ts:40,45,241](src/lib/ai/help-patterns.ts#L40) → Scope 2 F1/F50/F51 |

---

## Gate 4 remediation notes (for downstream reference)

The following patterns appear in both the Unbuilt and Superseded buckets and should be rewritten as one unit during Gate 4:

- **Settings family** (`account`, `subscription`, `chore_system` Settings paths, `guided_dashboard_setup`, `play_dashboard_setup`, `gamification_setup`, `task_segments`) — most Settings-path references are currently a mix of unbuilt sub-pages (Billing, Account) and real-but-differently-accessed surfaces (Gamification, Rhythms, Timer). Gate 4 rewrite should adopt the **floating-gear-icon wording** from Convention #53 ("tap the gear icon in the top-right, then [feature]") rather than pretending Settings is a single embedded overlay until F50 ships.
- **AIR language in `victories`** — the auto-routing promise should be rewritten as "The system CAN auto-route victories from [feature], but right now that's a roadmap item — log manually in the meantime" until three AIR stubs (STUB_REGISTRY L69, L93, L119) are wired.
- **Optimizer mentions in `lila`** — drop the word "Optimizer" from the mode list until F9 ships; replace with "specialized modes for relationships, decision-making, and more" which is already the trailing clause.
- **Habit mention in `dashboard`** — drop "habit tracking" until F26 (3-mode Habit branching) ships.
- **Meeting "Record After" language** — rewrite to make text-only capture explicit ("type out what you remember") rather than implying audio input.

Missing-coverage items should be prioritized by user demand signal per Scope 2 founder direction:
- **High demand** (new help patterns recommended first): ThoughtSift tools (M1), Task Breaker AI (M6), Guided Forms SODAS (M5), Beta Glitch Reporter (M16), Log Learning (M11), Allowance (M12).
- **Moderate demand** (second pass): Cyrano/Higgins/Love Languages (M3/M4), Mastery workflow (M9), Archive three-tier toggle (M17), Message Coaching (M19), Content Corner (M18), Out of Nest (M20).
- **Completeness pass** (third): Randomizer draw modes (M7), Linked routine steps (M8), Curriculum Parse (M10), Rhythms Phase C details (M22), Family Best Intentions (M13), Countdowns (M14), PerspectiveSwitcher (M15), MindSweep-Lite evening (M21).

---

## Audit cross-scope carry-forward

Scope 6 did not emit any new Scope 2, Scope 3+8b, Scope 4, or Scope 8a findings. Cross-references to existing closed findings:

- **SCOPE-2.F1** (tier monetization unbuilt) ↔ D2
- **SCOPE-2.F6** (46 themes codified) ↔ S1, O1
- **SCOPE-2.F9** (PRD-05C Optimizer unbuilt) ↔ D3
- **SCOPE-2.F26** (Habit task type unwired) ↔ D4
- **SCOPE-2.F42** (Meeting type enum 9→5) ↔ S7
- **SCOPE-2.F50** (Settings overlay + embeds deferred) ↔ D1, S5, S6, O5
- **SCOPE-2.F51** (account deletion / minor screens deprioritized) ↔ D1, O5
- **STUB_REGISTRY L52** (Optimizer mode_key misleading UI) ↔ D3
- **STUB_REGISTRY L69, L93, L119** (3 AIR stubs) ↔ D5
- **STUB_REGISTRY L159–L160** (Meeting voice recording Post-MVP) ↔ D7
- **STUB_REGISTRY L393, L416** (Studio seed / widget starter configs partial) ↔ D6

End of Scope 6 backlog.
