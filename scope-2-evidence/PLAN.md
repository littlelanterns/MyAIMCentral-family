---
Status: DRAFT — awaiting founder approval before any evidence pass begins
Stage: C
Scope: 2 (PRD-to-code alignment)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2; [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 300–304)
---

# Scope 2 — PRD-to-code Alignment Plan

> Orchestration plan for the 9 domain batches that will collectively walk every built PRD against its current code reality. No evidence pass has been executed under this plan yet. This file is the map; per-batch evidence files will be produced as each batch runs.

## 1 — Purpose and boundary

Scope 2 produces the three-column discrepancy report per Gameplan lines 300–304: **what the PRD says × what the code does × status classification**. Every discrepancy needs founder review — Claude Code workers produce evidence, the orchestrator adjudicates against founder standing rules, and findings emit into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2 as `SCOPE-2.F{N}`.

**Scope boundary vs Scope 3 + 8b:** A discrepancy that can be fully described within a single PRD (column missing, empty-state copy drift, screen not implemented, enum value unused, field never displayed) is Scope 2. A discrepancy that requires *both sides of a seam* to describe — one PRD specifies the handoff, a second PRD specifies the receipt, and the seam is broken — is Scope 3 + 8b. When a finding sits on the boundary, classify by who owns the fix: if the fix lives entirely within one PRD's remediation work, Scope 2; if the fix requires coordinated change across two PRDs' scopes, Scope 3 + 8b.

**Non-goal:** Scope 2 does NOT restate what Scope 5 already established (stub-registry truth), what Scope 8a already established (binary compliance/safety checklist), or what Scope 4 will establish (cost-pattern application). When a PRD row maps 1:1 to a Scope 5 finding already closed (e.g., PRD-28B absence, AIR unbuilt, PRD-12B attribution gap), Scope 2 cites the closed finding and does not re-emit.

## 2 — Finding schema

Copied verbatim from [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §0:

```
### [SCOPE-2.FN] Short title
- Severity: Blocking | High | Medium | Low
- Location: file:line or PRD/addendum reference
- Description: What the code does vs what the PRD/spec says vs what STUB_REGISTRY/WIRING_STATUS claims
- Evidence: specific quote, grep hit, or query result
- Proposed resolution: Fix Now | Fix Next Build | Tech Debt | Intentional-Update-Doc | Defer-to-Gate-4
- Founder decision required: Y/N
- Wizard Design Impact: (populated only when relevant)
- Beta Readiness flag: Y/N
```

### Gameplan-defined status classifications (for the 3-column table row-level classification, before finding emission)

Per Gameplan line 302:

| Status | Meaning |
|---|---|
| **Intentional-Document** | Drift is intentional; PRD is stale, code is truth. Update PRD to match. |
| **Unintentional-Fix-Code** | Drift is accidental; PRD is truth, code is wrong. Fix the code. |
| **Unintentional-Fix-PRD** | Drift is accidental but PRD was the miss; update PRD rather than code. |
| **Deferred-Document** | Drift is deliberate deferral; PRD should be annotated to reflect deferred scope. |
| **Scope-Creep-Evaluate** | Drift added scope not in PRD. Founder decides whether to codify (update PRD) or revert (fix code). |

Every row in every batch evidence file carries one of these five labels. Finding emission is a consolidation step — many rows with the same classification on the same pattern collapse into one `SCOPE-2.F{N}` entry. See section 5 for consolidation discipline.

## 3 — Batch inventory — 9 domains

Domains run in the gameplan dependency order (founder-confirmed 2026-04-20). Foundation runs first; domains 2–9 queue behind it and kick off sequentially as each prior domain's orchestrator adjudication closes.

### 3.1 Domain table

| # | Domain | PRDs in scope | Count | Notes on likely volume |
|---|---|---|---|---|
| 1 | Foundation | PRD-01, PRD-02, PRD-03, PRD-04 | 4 | PRD-01 invite/auth flows + PRD-02 permission matrix are large-surface; PRD-03 theme tokens and PRD-04 shell routing are structural. Expected ~8–14 findings total. |
| 2 | LiLa | PRD-05, PRD-05C | 2 | PRD-05 is the single most load-bearing PRD; context-assembly layer, guided-mode registry, crisis override, and mode routing all audit here. PRD-05C Optimizer is smaller surface. Expected ~6–10 findings. |
| 3 | Personal Growth | PRD-06, PRD-07, PRD-08, PRD-11, PRD-11B, PRD-13 | 6 | Guiding Stars, InnerWorkings, Journal/Notepad, Victory Recorder, Family Celebration, Archives. Heavy on context-source tables + three-tier toggle + `is_included_in_ai` audit. Expected ~10–16 findings. |
| 4 | Tasks/Studio | PRD-09A, PRD-09B, PRD-17, PRD-17B | 4 | Tasks is the largest feature PRD, plus 2 addenda (Linked-Steps-Mastery-Advancement, Studio-Intelligence-Universal-Creation-Hub); Studio Queue + MindSweep integration tight. Expected ~10–14 findings. |
| 5 | Dashboards/Calendar | PRD-10, PRD-14, PRD-14B, PRD-14C, PRD-14D, PRD-14E, PRD-25, PRD-26 | 8 | Widgets, personal dashboard, calendar, family overview, family hub + TV mode, guided dashboard, play dashboard. Calendar recurrence + widget starter configs are known drift surfaces (Scope 5 findings referenced them). Expected ~12–18 findings. |
| 6 | Communication | PRD-15, PRD-16 | 2 | Messages / Requests / Notifications is large; Meetings ships with Build P verified (see completed-builds 2026-04). Expected ~6–10 findings. |
| 7 | Vault/BookShelf | PRD-21, PRD-21A, PRD-21B, PRD-21C, PRD-22, PRD-23, PRD-34 | 7 | Communication tools, Vault browse/admin/engagement, Settings, BookShelf, ThoughtSift. BookShelf has migration-heavy schema; ThoughtSift Board of Directors already surfaced defects in Scope 8a. Expected ~8–14 findings. |
| 8 | Gamification | PRD-24, PRD-24A, PRD-24B | 3 | Build M landed Sticker Book + Configurable Earning Strategies; coverage vs PRD-24A Overlay Engine likely partial. Expected ~4–8 findings. |
| 9 | Compliance | PRD-27, PRD-28, PRD-29, PRD-30, PRD-35, PRD-36, PRD-37, PRD-38 | 8 | Caregiver tools, Tracking/Allowance, BigPlans, Safety Monitoring, Scheduler, Timer, Family Feeds, Blog. PRD-30 already SCOPE-8a.F3 (Safety unbuilt) — not re-audited here; Scope 2 examines only the *structural* PRD-30 surface areas outside F3's scope (e.g., settings UX stubs if they exist). PRD-35 + PRD-36 are infrastructure-heavy and likely surface low-volume. Expected ~10–16 findings. |

**Skipped (closed via Scope 8a or out-of-scope per Gameplan):**
- **PRD-40 COPPA Compliance** — closed in SCOPE-8a.F1; re-examination would re-tread ground.
- **PRD-41 LiLa Runtime Ethics Enforcement** — closed in SCOPE-8a.F3; not authored yet, cannot be audited.

**Estimated total Scope 2 finding volume:** 74–120 findings across 9 batches. This is a guess, not a target. Actual volume is driven by what evidence surfaces.

### 3.2 PRD existence verification

Every PRD above was glob-verified present at `prds/{category}/PRD-{N}-{Name}.md` on 2026-04-20. All 44 PRDs in the domain batches exist. No missing PRDs surfaced.

### 3.3 PRDs that exist but are NOT in any Scope 2 batch

The following PRDs exist in `prds/` but are intentionally excluded from Scope 2 batches. Each exclusion is documented below so future readers can confirm the scope boundary is deliberate.

| PRD | Title | Reason for exclusion from Scope 2 |
|---|---|---|
| PRD-12A | Personal LifeLantern | Unbuilt per Scope 5 walk-through (WALKTHROUGH_DECISIONS.md Round 3). No built surface to audit. |
| PRD-12B | Family Vision Quest | Unbuilt per Scope 5 Finding J (PRD-12B attribution gap). No built surface to audit. |
| PRD-18 | Rhythms & Reflections | Built and verified through Phase B/C/D. Domain assignment was not provided by the founder. Proposed placement: add to Personal Growth batch as a deferred expansion, OR run as a standalone 10th batch if volume warrants. To be confirmed during founder plan-approval. |
| PRD-19 | Family Context & Relationships | Partially built (Archives + member docs layer intersect). Domain assignment not provided. Proposed: add to Personal Growth batch for the Archives-overlap portions; structural remainder may be stubbed and cited from Scope 5. To be confirmed. |
| PRD-20 | Safe Harbor | Closed in SCOPE-8a.F3 (unbuilt). Scope 2 would have no code to audit. |
| PRD-28B | Compliance & Progress Reporting | Closed in Scope 5 Finding A (6-table infrastructure unbuilt, 5 registry rows flipped Unwired). No built surface to audit. |
| PRD-31 | Subscription Tier System | Missing from prompt's Compliance batch. Not currently assigned to any batch. Likely belongs in Foundation (feature_key_registry + feature_access_v2 are Foundation infrastructure). To be confirmed. |
| PRD-32 | Admin Console | Unbuilt per SCOPE-8a.F1 evidence (no admin pages in `src/pages/`). No built surface to audit. |
| PRD-32A | Demand Validation Engine | Built as PlannedExpansionCard surface; limited discrete PRD-audit surface. Proposed placement: Dashboards/Calendar batch or skip. To be confirmed. |
| PRD-33 | Offline / PWA | Post-MVP per feature glossary. Not beta-relevant; skipped unless founder directs otherwise. |

**Action for founder plan-approval:** confirm whether PRD-18, PRD-19, PRD-31, and PRD-32A fold into existing batches, run as a 10th batch, or skip. Other exclusions are self-justifying.

### 3.4 Per-domain detail and known drift surfaces

The per-domain summary below names the primary PRD surfaces, the known drift surfaces already flagged by Scope 5 or Scope 8a, and specific verification areas each batch's evidence-pass worker should cover. This is worker-kickoff material, not a full spec — the worker reads each PRD in the batch and produces the actual row-table from there.

#### Batch 1 — Foundation (PRD-01, 02, 03, 04)

- **PRD-01 Auth & Family Setup** — signup flow, family creation, invite tokens, `accept_family_invite` RPC, PIN hashing. Known wired: accept-invite route (per CLAUDE.md convention #62). Known gap: first-under-13-child COPPA precondition missing (SCOPE-8a.F1 cross-ref; do not re-emit here).
- **PRD-02 Permissions & Access Control** — `member_permissions`, `feature_access_v2`, `member_feature_toggles`, View As modal, PIN lockout. Known wired: `verify_member_pin` server-side, `ViewAsShellWrapper`. Verify: 164 rows in `permission_level_profiles` align with PRD matrix.
- **PRD-03 Design System & Themes** — 38 themes × light/dark variants; 20 semantic tokens per theme. Verify: every theme token field listed in PRD-03 is present in the theme implementation; tooltip theme-adaptivity per convention #43.
- **PRD-04 Shell Routing & Layouts** — 5-shell system, routing, QuickTasks strip, BottomNav parity. Known wired: shell-aware BottomNav, NotepadProvider wrapping MomShell. Verify: sidebar/BottomNav parity per convention #16.
- **Batch-specific watch list:** permission-boundary drift (scope leak across roles) flags Y on Beta Readiness by default.

#### Batch 2 — LiLa (PRD-05, PRD-05C)

- **PRD-05 LiLa Core AI System** — the single largest audit surface. `lila_conversations`, `lila_messages`, `lila_guided_modes` (43 rows in live_schema — verify against PRD's registry). Context assembler (Layered Context Assembly per ai_patterns.md lines 96–166; Scope 4 §2.4 audits P4 application, Scope 2 audits PRD alignment). Crisis override globality per CLAUDE.md #7 (cross-ref SCOPE-8a.F4 for Translator exception).
- **PRD-05C LiLa Optimizer** — smaller surface; BYOK, optimizer outputs. Verify: optimizer gating (`optimizer_outputs`, `optimizer_context_presets` — note these tables are flagged missing in live_schema).
- **Batch-specific watch list:** guided-mode registry alignment (43 rows in DB vs PRD spec count), opening-message coverage per mode, model-tier correctness per mode (Sonnet/Haiku routing per ai_patterns.md §Model Routing).

#### Batch 3 — Personal Growth (PRD-06, 07, 08, 11, 11B, 13)

- **PRD-06 Guiding Stars & Best Intentions** — `guiding_stars`, `best_intentions`, `intention_iterations`. Known wired: AI Craft mode, three-tier toggle foundation. Watch: `is_shared_with_partner` field usage, `tracker_style` options per PRD spec.
- **PRD-07 InnerWorkings** — `self_knowledge`. Known wired. Watch: source_type enum drift.
- **PRD-08 Journal & Smart Notepad** — `journal_entries`, `notepad_tabs`, `notepad_extracted_items`, `notepad_routing_stats`. Known wired: NotepadDrawer in Mom/Adult/Independent. Watch: journal entry types per convention #20 (confirm all 11 types present in enum: journal_entry, gratitude, reflection, quick_note, commonplace, kid_quips, meeting_notes, transcript, lila_conversation, brain_dump, custom). `learning_capture` explicitly NOT a journal type per convention #20 — verify code respects this.
- **PRD-11 Victory Recorder & DailyCelebration** — `victories`, `victory_celebrations`, `victory_voice_preferences`. Cross-ref SCOPE-8a.F6 (DailyCelebration HITM bypass — already closed; do not re-emit). Watch: AIR writer absence already captured in Scope 5 Finding B; Scope 2 reports on any PRD-11 screen drift NOT already captured.
- **PRD-11B Family Celebration** — `family_victory_celebrations` flagged missing in live_schema; verify whether feature is stubbed or partially built.
- **PRD-13 Archives & Context** — `archive_folders`, `archive_context_items`, `archive_member_settings`, `faith_preferences`. Watch: three-tier toggle propagation per DECISIONS.md Round 0 pattern-to-watch; faith_preferences individual boolean columns per convention #78.
- **Batch-specific watch list:** three-tier toggle end-to-end, `is_included_in_ai` write-back to source tables per convention #75.

#### Batch 4 — Tasks/Studio (PRD-09A, 09B, 17, 17B)

- **PRD-09A Tasks, Routines & Opportunities** — huge surface. `tasks`, `task_assignments`, `task_completions`, `task_templates`, `task_template_sections`, `task_template_steps`, `sequential_collections`, `task_claims`. Plus 2 addenda: Linked-Steps-Mastery-Advancement (advancement modes — `complete`, `practice_count`, `mastery`; `practice_log` dual-write pattern; linked-step types), Studio-Intelligence-Universal-Creation-Hub. Watch: task rotation advancement wiring (WIRING_STATUS confirms wired post-2026-04-13; verify in code). Cross-ref Scope 5 Finding B (AIR task auto-victory unbuilt).
- **PRD-09B Lists, Studio & Templates** — `lists`, `list_items`, `list_shares`, `list_templates`. Known wired. Watch: randomizer draw modes (`focused`/`buffet`/`surprise`) per convention #162; `is_opportunity` field usage.
- **PRD-17 Universal Queue & Routing** — `studio_queue` authoritative. Cross-check for `task_queue` references anywhere (should not exist per PRD-17 superseding PRD-09A).
- **PRD-17B MindSweep** — classification pipeline, 5 source channels, autopilot. Cross-ref SCOPE-8a.F7 (autopilot `source='manual'` labeling — already closed; do not re-emit).
- **Batch-specific watch list:** `sequential_collections` integrity (Scope 5 previously flagged this as a broken-path-now-fixed surface via `createTaskFromData` guard), studio_queue source-field discipline.

#### Batch 5 — Dashboards/Calendar (PRD-10, 14, 14B, 14C, 14D, 14E, 25, 26)

- **PRD-10 Widgets, Trackers & Dashboard Layout** — `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `widget_templates` (0 rows), `widget_starter_configs` (39 rows). Cross-ref SCOPE-5.F2 (live_schema drift re: widget_starter_configs). Watch: widget_templates vs widget_starter_configs architectural split; visual variant rendering per widget type.
- **PRD-14 Personal Dashboard** — reorder optimistic updates.
- **PRD-14B Calendar** — `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings`. Recurrence via Universal Scheduler. Watch: event_date + start_time + end_time + end_date field structure per convention #106 (verify combined TIMESTAMPTZ approach superseded); 11 system event categories per convention #110; Week start day per convention #115.
- **PRD-14C Family Overview** — `family_overview_configs`.
- **PRD-14D Family Hub** — `family_hub_configs`, `family_best_intentions`, `family_intention_iterations`, `countdowns`.
- **PRD-14E Family Hub TV Mode** — TV-landscape mode config.
- **PRD-25 Guided Dashboard** — sections per convention #122. Watch: which sections cannot be hidden (greeting, next_best_thing, best_intentions per convention #123); Reading Support / Spelling Coaching flags.
- **PRD-26 Play Dashboard** — cross-ref Build M (already landed). Watch: age-gate + gamification coexistence.
- **Batch-specific watch list:** widget picker misleading UI (Scope 5 flagged color_reveal, gameboard entries in widget picker — already noted; Scope 2 reports only if additional surfaces surface).

#### Batch 6 — Communication (PRD-15, 16)

- **PRD-15 Messages, Requests & Notifications** — large surface; `conversation_spaces`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members`. Watch: space_type enum values per PRD spec; mom cannot read other members' messages per convention #141 (RLS verify); Content Corner lock behavior per convention #147; LiLa never-automatically-present per convention #138.
- **PRD-16 Meetings** — Build P closed 2026-04-16 with 127 requirements verified (see `.claude/rules/current-builds/IDLE.md`). Spot-check the 13 stubbed items from Build P verification table and confirm no regression. Meeting types per convention #229; agenda items always through studio_queue per convention #231.
- **Batch-specific watch list:** message-coaching triggering rules; notification priority handling (safety always bypasses DND per convention #143).

#### Batch 7 — Vault/BookShelf (PRD-21, 21A, 21B, 21C, 22, 23, 34)

- **PRD-21 Communication & Relationship Tools** — 8 tool modes (quality_time, gifts, observe_serve, words_affirmation, gratitude, cyrano, higgins_say, higgins_navigate). Watch: teaching_skill_history table (29 rows — verify schema matches PRD).
- **PRD-21A AI Vault Browse & Content** — `vault_items`, `vault_categories`, `vault_prompt_entries`, `vault_user_progress`, `vault_first_sightings`. Watch: two-layer title/description pattern per CLAUDE.md #82-83; content protection per #85; delivery method routing per #89.
- **PRD-21B AI Vault Admin** — admin surface; confirm or flag stub state per Scope 5.
- **PRD-21C AI Vault Engagement** — hearts + comments; `vault_engagement`, `vault_comments` flagged missing in live_schema.
- **PRD-22 Settings** — `member_emails`, `account_deletions`, data export. Cross-ref SCOPE-8a.F2 (data-lifecycle — already closed; do not re-emit).
- **PRD-23 BookShelf** — huge extraction pipeline; `bookshelf_items` (562 rows), `bookshelf_chunks` (58,379 rows), `bookshelf_summaries` (21,538 rows), `bookshelf_insights` (24,360 rows), `bookshelf_declarations` (16,931 rows), `bookshelf_action_steps` (16,396 rows), `bookshelf_questions` (10,168 rows). Recent Phase 1b migration per completed-builds. Watch: Platform Intelligence cache usage (`platform_intelligence.book_library`, `book_chunks`, `book_extractions`).
- **PRD-34 ThoughtSift** — 5 separate tools per convention #92. Cross-ref SCOPE-8a.F5 (BoD fail-open — already closed; do not re-emit). Watch: Mediator 8 context modes; Perspective Shifter lens chips (17 rows in `perspective_lenses` — confirm alignment); Decision Guide 15 frameworks (`decision_frameworks` 15 rows).
- **Batch-specific watch list:** BookShelf extraction counts per audience (Guided/Independent/Adult); Vault delivery method routing.

#### Batch 8 — Gamification (PRD-24, 24A, 24B)

- **PRD-24 Gamification Foundation** — `gamification_configs` (18 rows), `gamification_creatures` (161 rows), `gamification_themes` (1 row), `gamification_sticker_pages` (26 rows). Cross-ref Build M closed 2026-04-13. Watch: `roll_creature_for_completion` RPC wiring per convention #198; earning-mode configurable strategies per conventions #208-222.
- **PRD-24A Overlay Engine & Game Modes** — convention-level description extensive; live_schema may not fully reflect. Watch: overlay_instances, recipe_completions, dashboard_backgrounds — flagged missing in live_schema for some. Verify build coverage.
- **PRD-24B Gamification Visuals & Interactions** — overlap with 24A. Watch: reveal videos, SparkleOverlay usage per convention #46.
- **Batch-specific watch list:** practice-vs-completion separation per convention #200 (practice NEVER triggers gamification); `counts_for_gamification` flag per convention #224.

#### Batch 9 — Compliance (PRD-27, 28, 29, 30, 35, 36, 37, 38)

- **PRD-27 Caregiver Tools** — `trackable_event_categories`, `trackable_event_logs`, `shift_reports` flagged missing in live_schema. Verify build coverage.
- **PRD-28 Tracking, Allowance & Financial** — `allowance_configs` (4 rows), `allowance_periods` (4 rows), `financial_transactions` (0 rows), `loans` (0 rows), `homeschool_configs`, `homeschool_subjects`, `homeschool_time_logs`. Conventions #223-228 load-bearing. Watch: append-only discipline on `financial_transactions`; minutes as INTEGER per convention #227; subject hour targets opt-in-only per convention #228.
- **PRD-29 BigPlans** — `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` flagged missing in live_schema. Verify build coverage OR confirm stub state.
- **PRD-30 Safety Monitoring** — structural absence closed as SCOPE-8a.F3. Scope 2 audits only any UI stubs for settings/notification-recipients surfaces that may exist independently.
- **PRD-35 Universal Scheduler** — `access_schedules` (0 rows). Consumer-integration primarily Scope 3. Scope 2 audits scheduler internals: radio-button primary interface per convention #117, [+ Add another] pattern per convention #28, calendar preview required per convention #29.
- **PRD-36 Universal Timer** — `time_sessions` (1 row), `timer_configs` (0 rows). Conventions #32-37. Watch: timestamp-based persistence per #32, floating bubble rendering per #33, soft-delete only per #36.
- **PRD-37 Family Feeds** — `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings` flagged missing in live_schema. Verify build state.
- **PRD-38 Blog (Cookie Dough)** — `blog_posts`, `blog_engagement`, `blog_comments`, `blog_free_tools`, `blog_categories` flagged missing. Public-facing surface; verify Phase state.
- **Batch-specific watch list:** PRD-28 tracking flag propagation (`counts_for_allowance`, `counts_for_homework`, `counts_for_gamification`) per convention #224; PRD-35/36 consumer integrations (handoff to Scope 3).

## 4 — Per-batch packet format

Each of the 9 domain batches produces one evidence file:

```
scope-2-evidence/EVIDENCE_BATCH_{N}_{domain-slug}.md
```

Example filenames:
- `EVIDENCE_BATCH_1_foundation.md`
- `EVIDENCE_BATCH_2_lila.md`
- `EVIDENCE_BATCH_3_personal-growth.md`
- `EVIDENCE_BATCH_4_tasks-studio.md`
- `EVIDENCE_BATCH_5_dashboards-calendar.md`
- `EVIDENCE_BATCH_6_communication.md`
- `EVIDENCE_BATCH_7_vault-bookshelf.md`
- `EVIDENCE_BATCH_8_gamification.md`
- `EVIDENCE_BATCH_9_compliance.md`

### 4.1 Batch file structure

Each file contains, in order:

1. **Frontmatter** — Status, Stage, Scope, Opened date, Related sections (same 5-line shape as this plan).
2. **Worker cover paragraph (10–20 lines)** — written after the evidence pass completes. Names the PRDs examined, the total row count in the table, headline patterns, and any load-bearing surprises that do not fit the table format. Modeled on the cover paragraphs at the top of [EVIDENCE_BUCKET_2.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_2.md) and [EVIDENCE_BUCKET_5.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_5.md).
3. **Per-PRD three-column discrepancy table** — one table per PRD in the batch. Columns: `PRD spec (with §/L reference) × code reality (with file:line) × classification`. Classification uses the 5 Gameplan labels from §2. Every row cites evidence per the "evidence not intuition" rule.
4. **Unexpected findings list** — defects surfaced during the pass that do not fit the row-table format. Modeled on the "Unexpected Findings 1–5" blocks in EVIDENCE_BUCKET_4/5.
5. **Proposed consolidation** — worker-drafted grouping of rows into SCOPE-2.F{N} candidates, following §5 consolidation discipline. Worker proposes; orchestrator adjudicates.
6. **Orchestrator adjudication table** — filled during the walk-through, not by the evidence-pass worker. Columns: candidate finding × worker proposed severity × founder decision × emits SCOPE-2.F{N}. Modeled on CHECKLIST_DECISIONS.md §Per-item verdict table.

### 4.2 Reference for stylistic inheritance

Workers drafting evidence files should read three reference files before writing:
- [EVIDENCE_BUCKET_4.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_4.md) — Unexpected findings pattern.
- [EVIDENCE_BUCKET_5.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_5.md) — Scope-confirmations vs findings distinction (useful for intentional-drift rows).
- [EVIDENCE_PRD40_COPPA.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_PRD40_COPPA.md) — 16-item table with per-item evidence format.

### 4.3 Classification decision heuristics

Per-row classification is the evidence-pass worker's hardest call. The 5 Gameplan labels (Intentional-Document / Unintentional-Fix-Code / Unintentional-Fix-PRD / Deferred-Document / Scope-Creep-Evaluate) look similar at a glance. Apply this decision tree:

1. **Is the code correct and the PRD stale?** → `Intentional-Document`. Evidence: the code ships a later architectural decision, a completed build file references the change, or a commit message explicitly supersedes the PRD text.
2. **Is the PRD correct and the code wrong?** → `Unintentional-Fix-Code`. Evidence: the code references a field or flow the PRD defines, but the implementation diverges (wrong default, missing screen, different enum values).
3. **Is the PRD wrong in a way the implementer noticed but the PRD was never updated?** → `Unintentional-Fix-PRD`. Evidence: a commit note, completed-build-file entry, or code comment says "PRD specified X but actually Y because...". Typical shape: implementation-time discovery.
4. **Is the drift a deliberate phase-deferral?** → `Deferred-Document`. Evidence: the feature is stubbed (per STUB_REGISTRY.md post-Scope-5) or in a build phase that hasn't shipped. The PRD text is the *eventual* spec; the current state is a deliberate waypoint.
5. **Did the implementer add scope the PRD never had?** → `Scope-Creep-Evaluate`. Evidence: the code has a field, screen, or behavior that isn't mentioned in the PRD at all, and it wasn't retroactively captured via completed-build-files. Founder decides whether to codify (update PRD) or revert (remove code).

#### 4.3.1 Ambiguous-classification protocol

When a row could be classified two different ways with the same evidence strength, the worker writes the row with the more conservative label (typically `Unintentional-Fix-Code` over `Intentional-Document` — defaults to "code is wrong" rather than "PRD is stale" when ambiguous) and flags the row in a "Classification ambiguities" section of the evidence file. Orchestrator adjudicates during walk-through.

#### 4.3.2 Intentional-Document overuse guardrail

`Intentional-Document` is the easiest classification to over-apply. It produces no code change and feels resolvable by a one-line PRD update. Workers must meet a higher evidence bar for this label:

- A commit message, a completed-build file, a feature-decision file, OR a CLAUDE.md convention must *explicitly* identify the drift as intentional.
- "The code just does X" is not evidence the drift is intentional. It is evidence the drift exists.

If the worker reaches for `Intentional-Document` without one of the listed evidence types, demote to `Unintentional-Fix-Code` + flag ambiguity.

## 5 — Consolidation discipline

Inherited from Scope 8a: **16 COPPA items collapsed into SCOPE-8a.F1; 3 Board of Directors defects collapsed into SCOPE-8a.F5.** The individual row evidence is preserved in the evidence file; the finding count is kept manageable.

### 5.1 Consolidation rules

1. **Per PRD, per pattern** — when multiple rows within a single PRD's table share the same classification AND the same underlying pattern, consolidate into one finding. Examples:
   - "Multiple PRD-09A column drifts" — several column-level `Unintentional-Fix-Code` rows on `tasks` table → one finding `SCOPE-2.F{N} PRD-09A tasks-table column drift`.
   - "Multiple PRD-14B calendar recurrence mismatches" — if PRD says X, code says Y on several recurrence fields → one finding.
   - "Multiple PRD-21A gating drifts" — Vault tier-threshold mismatches across categories → one finding.
2. **Do NOT consolidate across different patterns** — a column-drift finding and a screen-not-implemented finding on the same PRD stay separate, even when both are in the same PRD.
3. **Do NOT consolidate across PRDs in Scope 2** — cross-PRD patterns are Scope 3's concern. If a pattern repeats across PRDs, emit one finding per PRD in Scope 2, and flag the pattern for Scope 3 evaluation. The flag is a line in the evidence file's "Proposed consolidation" section: `PATTERN-FLAG-FOR-SCOPE-3: {pattern description} — appears in {list of PRDs}`.
4. **Preserve per-row detail** — consolidation is a finding-level operation. The evidence file retains every row with its individual classification and evidence citation. A reader can always trace a consolidated finding back to the contributing rows.

### 5.2 Cardinality expectation

Batches typically emit 2–6 findings each even when the row-table has 15–25 rows. Foundation and Dashboards/Calendar batches may emit more; Gamification and Communication may emit fewer. Orchestrator watches for batches that try to emit 10+ findings — that usually signals the worker under-consolidated.

## 6 — Beta Readiness flag default

Per the Scope 8a standing rule (CHECKLIST_DECISIONS.md §Standing rules rule #1, amended for Scope 2): **Beta Readiness default is N for Scope 2 findings**, because most Scope 2 findings are PRD-text-vs-code-drift that do not block beta user exposure.

**Set to Y only when the drift has one of these shapes:**
- Child-facing surface affected (any Guided/Play shell drift that produces wrong or confusing UX)
- Privacy surface affected (`is_included_in_ai` / `is_privacy_filtered` / Safe Harbor exemption drift)
- Safety surface affected (Crisis Override, HITM, Safety Monitoring handoffs — though most of these are already captured in Scope 8a)
- Compliance surface affected (export/deletion/audit-trail drift — likely captured in Scope 8a.F2 already)
- Permission-boundary surface affected (mom-sees-all drift, special-adult scope drift, teen scope drift where the drift leaks data across role boundaries)

Worker default: N. Flag Y requires a 1-sentence rationale referencing one of the 5 shapes above.

## 7 — Standing rules

Inherited from Scope 5 walk-through and Scope 8a adjudication log. These apply to every evidence-pass worker, every adjudication decision, and every consolidation.

1. **Evidence not intuition.** Every verdict cites migration SHA / file:line / grep hit / PRD section reference. "I remember reading..." is not evidence.
2. **If it doesn't work in the app, it is not wired.** A table existing in a migration is not sufficient; consuming code must actually run the infrastructure. Applied especially to PRD rows that claim Wired status but have no end-to-end surface.
3. **Non-concurrent zones untouched.** Per [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §0 non-concurrent zones: `claude/feature-decisions/Universal-Setup-Wizards.md`, `claude/feature-decisions/Universal-Setup-Wizards-Session-Addendum.md`, `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md` (Claude.ai drafting), `src/components/studio/wizards/` (read-only). Do not modify. Evidence passes may read these surfaces for reference.
4. **Worker commits, orchestrator adjudicates.** The evidence-pass worker runs greps, reads PRD sections, writes the evidence file, commits the file. The orchestrator does not run substantive greps directly. Walk-through of the evidence file produces founder decisions; a separate apply-phase worker applies those decisions to AUDIT_REPORT_v1.md §2.
5. **Grep/Glob primary per Convention 242.** mgrep is per-query-approved only (inverted 2026-04-18). If a pre-build lookup is genuinely cross-cutting and keyword-grep is missing it, the worker surfaces the query to the founder for per-query approval. Do not invoke mgrep silently. If mgrep returns spend/quota/auth error, log as known gap for that batch and continue with Grep/Glob.
6. **Consolidate aggressively.** Per §5 rules. Under-consolidation is the easier failure mode; orchestrator reviews for it on every batch.
7. **Scope 2 does not re-emit Scope 5 / Scope 8a closed findings.** When a Scope 2 row maps 1:1 to a closed finding, cite the finding ID and skip emission. When a Scope 2 row identifies a *new* drift on the same PRD as a closed finding, emit normally with a cross-reference.

## 8 — Handoff to apply-phase

Once all 9 batches walk-through close, an apply-phase worker appends `SCOPE-2.F{N}` findings to [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2 (currently the stub "*Not yet started. Stage C.*" at line 383).

Apply-phase worker scope:
- Reads DECISIONS.md for the adjudicated verdicts
- Reads each EVIDENCE_BATCH_{N}_*.md for finding bodies
- Writes findings into §2 in the same shape Scope 1, Scope 5, Scope 8a findings use
- Updates the Beta Readiness index (Appendix C) for any new Y-flagged findings
- Commits with message `docs(audit): apply Scope 2 findings F{N}–F{M} — {domain summary}`
- Never modifies Scope 5 or Scope 8a finding bodies
- Adds a cross-reference back to each evidence file in the finding's `Evidence:` line

## 9 — Sequencing

Domain 1 Foundation runs first. Domains 2–9 are queued. Each kicks off after the prior domain's walk-through adjudication closes in DECISIONS.md. Parallel execution across domains is not planned for Scope 2 — walk-through and apply sequencing is cleaner if domains land one at a time.

Domains 2 (LiLa), 5 (Dashboards/Calendar), and 7 (Vault/BookShelf) may have Scope 3 + 8b cross-PRD work that cannot start until Scope 2 for both sides of a seam has closed. See [scope-3-8b-evidence/PLAN.md](../scope-3-8b-evidence/PLAN.md) §9 Sequencing for the cross-scope gating rules.

Stage C close depends on all three Stage C scopes (2, 3+8b, 4) landing. Stage D (Scope 6 and 7) gates on Stage C close.

### 9.1 Expected walk-through cadence

- Foundation batch: ~1 orchestration session. Domain 1 patterns anchor later domains.
- Typical batch: 1 session, 2 if the evidence file is large or consolidation is contested.
- Dashboards/Calendar: possibly 2 sessions (8 PRDs, highest expected finding count).
- Compliance: possibly 2 sessions (8 PRDs, uneven finding density — some PRDs trivial, some heavy).

Total estimated Scope 2 orchestration load: 11–14 walk-through sessions.

### 9.2 Worker-prompt anti-patterns

The per-batch worker prompt is drafted at dispatch time, not now, but the following anti-patterns are inherited from Scope 5 walk-through lessons and Scope 8a dispatch experience.

1. **Do not tell the worker which classification to use.** The prompt describes the evidence requirement. Classification is the worker's call, reviewed by orchestrator.
2. **Do not pre-specify consolidations.** The worker proposes consolidations; orchestrator confirms. Specifying "consolidate these 5 rows into one finding" in the prompt short-circuits the worker's own pattern detection.
3. **Do not describe expected findings.** "Verify that PRD-14B has the calendar recurrence drift" leaks the answer. Ask the worker to verify PRD-14B's recurrence-related rows and classify what they find.
4. **Do give the worker concrete file paths and line anchors the founder already named** (e.g., "FamilySetup.tsx:276 is the under-13 insert site"). Evidence bootstrapping from prior-found anchors is legitimate and speeds the pass.
5. **Do require the worker to read each PRD in full** for the batch. Skim-driven verification is the primary failure mode. The evidence file must include PRD section/line citations per row.
6. **Do require a Classification ambiguities section** if any rows were flagged ambiguous. Zero-ambiguity passes on a 20-row table are suspicious — flag for orchestrator attention.

## 10 — Synthesis patterns to watch for at orchestrator adjudication

After 2–3 batches close, orchestrator reviews the emerging findings for cross-batch patterns. Patterns that typically surface:

- **Screen-count drift** — multiple PRDs ship with fewer screens than specified. Consolidate into a batch-level finding only if 3+ PRDs in the same batch show this pattern; cross-batch instances go in the synthesis pass.
- **Field-name drift** — column or field renamed during build without PRD update. Usually `Unintentional-Fix-PRD` when consistent across use sites, `Unintentional-Fix-Code` when inconsistent.
- **Enum-value drift** — PRD-level enum values replaced or supplemented. Per-PRD consolidation usually sufficient.
- **Permission-matrix drift** — `feature_access_v2` rows or `permission_level_profiles` rows drift from PRD-02 permission matrix. Typically surfaces in Foundation batch; may recur in Compliance batch PRDs that add new feature keys.
- **AI integration drift** — a feature's AI surface differs from PRD. Usually cross-ref to Scope 4 rather than emitting in Scope 2; flag on the row as `PATTERN-FLAG-FOR-SCOPE-4` per PLAN §5.1 cross-scope rule.
- **Stub state drift** — a PRD row says "Wired" but code is stubbed, or vice versa. Cross-ref Scope 5 closed findings; emit as a new finding only if the drift is *new* (post-Scope-5 close).

## 10.1 Worker-first / orchestrator-second cadence within a batch

Once a batch evidence file is committed, walk-through runs in this order:

1. Orchestrator reads the worker's evidence file end-to-end, without interpretation.
2. Orchestrator reads any closed Scope 5 / Scope 8a findings the evidence file cross-references, confirming those citations are accurate.
3. Orchestrator drafts a preliminary consolidation plan — which rows collapse into which `SCOPE-2.F{N}` candidates — and a preliminary severity assignment per candidate.
4. Orchestrator reads the PRD section being audited *only for any row where the worker's evidence citation feels incomplete* — not the whole PRD again.
5. Walk-through with founder: orchestrator presents per-candidate proposals, founder confirms / amends / overrides, DECISIONS.md entry is populated.
6. Emission list is finalized. Apply-phase worker dispatch is separate.

This cadence keeps the orchestrator honest about using the evidence file as the authoritative surface, not re-running the audit from memory.

## 11 — Success criteria

Scope 2 closes when:

- All 9 batches have evidence files committed in `scope-2-evidence/`
- All 9 batches have orchestrator adjudication tables filled with founder decisions
- DECISIONS.md contains a per-batch round entry with founder decisions recorded
- Apply-phase worker has landed all SCOPE-2.F{N} findings into AUDIT_REPORT_v1.md §2
- Stub registry is unchanged (Scope 5 is already applied; Scope 2 does not re-open it)
- Beta Readiness index (Appendix C) is updated with any Y-flagged Scope 2 findings
- `scope-2-evidence/` is moved to `.claude/completed-builds/scope-2-evidence/` per the archival pattern used for Scopes 5 and 8a

## Appendix A — Three-column row-table template for evidence files

Workers producing `EVIDENCE_BATCH_{N}_*.md` files use this row-table template under §3 of their evidence file. One table per PRD in the batch.

```markdown
### PRD-{N}-{Name} — three-column discrepancy table

| # | PRD spec (§/L reference) | Code reality (file:line) | Classification | Proposed finding | Notes |
|---|---|---|---|---|---|
| 1 | {PRD claim, short paraphrase + §X.Y line N} | {file:line anchor or "absent"} | {Intentional-Document / Unintentional-Fix-Code / Unintentional-Fix-PRD / Deferred-Document / Scope-Creep-Evaluate} | {SCOPE-2.F{N}-CANDIDATE-SHORT-NAME or "no emission"} | {optional: ambiguity flag, cross-scope flag, cross-ref to closed finding} |
| 2 | ... | ... | ... | ... | ... |

#### Classification ambiguities (if any)
- Row {N}: {alternate classification considered and why not chosen}
```

Rules for the table:
- Every row cites a PRD line reference in column 2 and a file:line or "absent" in column 3. "Absent" is a legitimate code-reality value and means the grep surfaced no matching code.
- Every row carries exactly one of the 5 Gameplan classifications in column 4.
- Column 5 lists the worker's proposed finding grouping. Rows that group into one finding share the same candidate name (e.g., "SCOPE-2.F{N}-CANDIDATE-PRD14B-RECURRENCE-DRIFT"). Orchestrator may rename candidates during adjudication.
- Cross-scope flags live in column 6: `PATTERN-FLAG-FOR-SCOPE-3: {pattern}` or `PATTERN-FLAG-FOR-SCOPE-4: {pattern}` when the worker sees a pattern that belongs in another scope's bucket.

## Appendix B — Completed-batches ledger (filled during execution)

Once batches begin closing, the ledger below grows one row per closed batch. Populated by the apply-phase worker after each batch's `SCOPE-2.F{N}` findings land in AUDIT_REPORT_v1.md §2.

| Batch # | Domain | Evidence file | Closed date | Findings emitted | Beta flags |
|---|---|---|---|---|---|
| 1 | Foundation | EVIDENCE_BATCH_1_foundation.md | (pending) | — | — |
| 2 | LiLa | EVIDENCE_BATCH_2_lila.md | (pending) | — | — |
| 3 | Personal Growth | EVIDENCE_BATCH_3_personal-growth.md | (pending) | — | — |
| 4 | Tasks/Studio | EVIDENCE_BATCH_4_tasks-studio.md | (pending) | — | — |
| 5 | Dashboards/Calendar | EVIDENCE_BATCH_5_dashboards-calendar.md | (pending) | — | — |
| 6 | Communication | EVIDENCE_BATCH_6_communication.md | (pending) | — | — |
| 7 | Vault/BookShelf | EVIDENCE_BATCH_7_vault-bookshelf.md | (pending) | — | — |
| 8 | Gamification | EVIDENCE_BATCH_8_gamification.md | (pending) | — | — |
| 9 | Compliance | EVIDENCE_BATCH_9_compliance.md | (pending) | — | — |

## Appendix C — Glossary of recurring terms

To keep evidence-pass workers and the orchestrator on the same page across batches:

- **Batch** — one of the 9 domain groupings in §3.1. Each batch produces one evidence file.
- **Row** — a single discrepancy entry inside a batch evidence file's per-PRD three-column table. Rows carry Gameplan classifications.
- **Candidate finding** — a worker-proposed grouping of rows that would become one `SCOPE-2.F{N}` entry. Orchestrator confirms during walk-through.
- **Finding** — a confirmed candidate that appears in AUDIT_REPORT_v1.md §2 after apply-phase.
- **Seam** — a cross-PRD integration surface. Scope 2 does not traverse seams; Scope 3+8b does.
- **Emission tag** — `SCOPE-2.F{N}` for Scope 2. Emission tag is decided at candidate-confirmation time, not row time.
- **Closed finding** — a prior-scope finding (Scope 1, Scope 5, Scope 8a) already in AUDIT_REPORT_v1.md. Scope 2 cites closed findings rather than re-emitting.
- **Cross-scope flag** — a row-level note in the evidence file's column 6 that says "this pattern belongs in Scope 3+8b or Scope 4, not Scope 2." Flagged for the other scope's evidence pass to pick up.
- **Beta flag** — the Beta Readiness column on a finding. `N` by default for Scope 2; `Y` only for the 5 shapes in §6.
