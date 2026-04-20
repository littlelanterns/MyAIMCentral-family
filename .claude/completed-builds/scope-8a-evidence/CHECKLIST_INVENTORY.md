# Scope 8a — Binary Compliance & Safety Checklist Inventory

> **Status:** DRAFT — awaiting founder approval before evidence gathering begins.
> **Opened:** 2026-04-20
> **Gameplan:** [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 item 8 (lines 329–335)
> **Audit report:** appends to [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §8a as SCOPE-8a.F{N} findings
> **Decisions log:** [CHECKLIST_DECISIONS.md](CHECKLIST_DECISIONS.md) (append-only)

---

## 0 — Methodology

### Verdict options per item

| Verdict | Meaning |
|---|---|
| **PASS** | Claim is true, evidence confirms it. No finding emitted unless informational. |
| **FAIL** | Claim is false, infrastructure missing or non-functional. SCOPE-8a.F{N} finding emitted. |
| **PARTIAL** | Infrastructure partially exists (e.g., table built, UX not wired). Finding emitted with scope. |
| **DEFERRED** | Verification requires live testing / legal review / external dependency. Flagged for post-audit. |
| **N/A** | Claim turns out not to apply (e.g., feature out of scope). Documented, no finding. |

### Beta Readiness flag default

Per founder ruling 2026-04-20: **default Y** on all Scope 8a findings. This scope IS the beta compliance gate. Set to N only when a finding is clearly informational, tool-hygiene, or documentation-only with no user-facing safety/compliance impact.

### Evidence pattern

Every verdict must cite one or more of:
- Migration SHA + file + line range
- File path + line number for code
- `claude/live_schema.md` table reference
- PRD line/section reference for the claim being verified
- Grep hit with query + match location
- Worker-pass report filed in this directory

No verdict may rest on intuition, memory, or summary language alone.

### Non-concurrent zones (not touched by this scope)

Per AUDIT_REPORT_v1.md §0:
- `claude/feature-decisions/Universal-Setup-Wizards.md`
- `claude/feature-decisions/Universal-Setup-Wizards-Session-Addendum.md`
- `claude/feature-decisions/Universal-Setup-Wizards-User-Flows.md`
- `src/components/studio/wizards/` — read-only for reference

---

## Bucket 1 — COPPA Compliance Readiness (PRD-40)

**Source of authority:** `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md` (Status: Not Started). PRD-40 Key Decisions and Data Schema sections are binding. Gameplan line 330.

### [8a-CL-01] `parent_verifications` table exists
- **Claim:** Per PRD-40 §Data Schema L561, `parent_verifications` table is built with the specified columns.
- **Pass:** Table appears in `claude/live_schema.md` and a migration file creates it.
- **Fail:** No migration creates the table AND table is not in live_schema.md.
- **Evidence:** grep migrations + live_schema.md text search.

### [8a-CL-02] `coppa_consents` table exists
- **Claim:** Per PRD-40 §Data Schema L591, `coppa_consents` table is built (one row per child, linked to a parent verification).
- **Pass:** Table appears in live_schema.md and a migration creates it.
- **Fail:** No migration creates it AND not in live_schema.md.
- **Evidence:** grep migrations + live_schema.md.

### [8a-CL-03] `coppa_consent_templates` table exists
- **Claim:** Per PRD-40 §Data Schema L631, `coppa_consent_templates` holds the versioned disclosure text mom consented to.
- **Pass:** Migration creates + live_schema.md lists it.
- **Fail:** Neither present.
- **Evidence:** grep migrations + live_schema.md.

### [8a-CL-04] `parent_verification_attempts` table exists
- **Claim:** Per PRD-40 §Data Schema L659, `parent_verification_attempts` audits every verification try including failures.
- **Pass:** Migration creates + live_schema.md lists it.
- **Fail:** Neither present.
- **Evidence:** grep migrations + live_schema.md.

### [8a-CL-05] `family_members` has the COPPA columns
- **Claim:** Per PRD-40 §Column Addition L687: `coppa_age_bracket TEXT NOT NULL DEFAULT 'adult'` and `is_suspended_for_deletion BOOLEAN NOT NULL DEFAULT false` exist on `family_members`.
- **Pass:** Both columns present in live_schema.md `family_members` row list AND an ALTER TABLE migration adds them.
- **Fail:** Either column missing.
- **Evidence:** Read live_schema.md `family_members` section; grep migrations for `coppa_age_bracket`, `is_suspended_for_deletion`.

### [8a-CL-06] `verification_method` / `coppa_age_bracket` / `verification_attempt_status` enums exist
- **Claim:** Per PRD-40 §Enum/Type Updates L698, three enums defined.
- **Pass:** At least `coppa_age_bracket` enum present (blocking; `verification_method` has one active value so may be TEXT-with-CHECK instead). All three present is full pass.
- **Fail:** `coppa_age_bracket` not enforceable anywhere (neither enum nor CHECK constraint).
- **Evidence:** grep migrations for CREATE TYPE / CHECK constraint.

### [8a-CL-07] RLS policies gate writes on active COPPA consent
- **Claim:** Per PRD-40 §Outgoing Flows L722: "Every RLS policy that allows writes to a child's data (tasks, journal entries, tracker data, archive context, LiLa conversations, etc.) is extended to require an active `coppa_consents` row for the target `child_member_id`."
- **Pass:** RLS policies on child-scoped tables reference `coppa_consents` or a helper function that does.
- **Fail:** No RLS policy references COPPA consent state.
- **Evidence:** grep `CREATE POLICY` / `USING` blocks in migrations for `coppa_consents` references.

### [8a-CL-08] `useCoppaConsent(childMemberId)` hook / helper exists
- **Claim:** Per PRD-40 §Outgoing Flows L723: frontend hook returns `active | revoked | superseded | missing | suspended_for_deletion`.
- **Pass:** Hook file present in `src/hooks/` or equivalent.
- **Fail:** No such hook.
- **Evidence:** `Glob src/hooks/useCoppa*.ts*`, grep `useCoppaConsent`.

### [8a-CL-09] Consent screen flow (Screens 1–5) built
- **Claim:** Per PRD-40 §Screens L58–L500-ish: five-section consent modal with scrolled-past-content enforcement, section-level checkboxes, Cancel/Continue.
- **Pass:** Component(s) exist that render the five consent sections and commit a `coppa_consents` row on completion.
- **Fail:** No consent component found.
- **Evidence:** grep for `CoppaConsent`, `COPPA`, related strings in `src/`; check `src/pages/auth/` and `src/components/family/` for consent UI.

### [8a-CL-10] First-under-13-child trigger fires consent flow
- **Claim:** Per PRD-40 §Incoming Flows L710: bulk-add / manual-add save action routes to consent flow when `coppa_age_bracket='under_13'` AND no active `parent_verifications` exist.
- **Pass:** The save action in PRD-01 bulk-add and manual-add code paths contains this branching logic.
- **Fail:** Save actions commit under-13 `family_members` rows with no consent check.
- **Evidence:** Read PRD-01 bulk-add / manual-add save code; grep for `coppa_age_bracket` conditional.

### [8a-CL-11] Additional-child acknowledgment flow (Screen 7) built
- **Claim:** Per PRD-40 §Screen 7: lightweight acknowledgment modal for subsequent under-13 children when mom already has active verification.
- **Pass:** Component + state flow exists and commits a `coppa_consents` row linked to the existing `parent_verifications`.
- **Fail:** No such component; second under-13 child either re-triggers full flow or skips consent entirely.
- **Evidence:** grep for acknowledgment component; trace the save-action branching.

### [8a-CL-12] Revocation flow (Screen 9) built
- **Claim:** Per PRD-40 §Screen 9: mom can revoke consent per-child; 14-day grace period via `is_suspended_for_deletion=true`.
- **Pass:** Revocation UI exists + `is_suspended_for_deletion` set correctly + scheduled deletion job implemented.
- **Fail:** No revocation UI OR no scheduled deletion cascade.
- **Evidence:** grep revocation UI; find scheduled-deletion cron (PRD-40 L715).

### [8a-CL-13] Admin verification log (Screen 10) built
- **Claim:** Per PRD-40 §Screen 10: admin console surface showing verification events, failed attempts, consent state per family.
- **Pass:** Admin surface exists (expected in `src/pages/admin/` per PRD-32 patterns).
- **Fail:** No admin COPPA surface.
- **Evidence:** grep admin console for `coppa`, `verification_log`; check PRD-32 build status.

### [8a-CL-14] Stripe webhook handles COPPA verification events
- **Claim:** Per PRD-40 §Outgoing Flows L726: `stripe-webhook-handler` Edge Function extended for `metadata.purpose='coppa_verification'` — success path creates `parent_verifications` + commits pending `family_members`; failure logs `parent_verification_attempts`.
- **Pass:** Edge Function contains branch on `metadata.purpose='coppa_verification'`.
- **Fail:** Edge Function has no COPPA branch (or Edge Function doesn't exist).
- **Evidence:** Read `supabase/functions/stripe-webhook-handler/*` if present; grep for `coppa_verification`.

### [8a-CL-15] PRD-01 retrofit hook — under-13 signup blocks on verification
- **Claim:** Per PRD-40 dependencies: PRD-01 Auth flow cannot complete an under-13 save until consent + verification are written.
- **Pass:** Save action rejects/interrupts when consent missing.
- **Fail:** PRD-01 save completes and writes `family_members` with `coppa_age_bracket='under_13'` without any consent precondition.
- **Evidence:** Read PRD-01 bulk-add + manual-add save code paths; look for COPPA preconditions. This is the same code site as 8a-CL-10 but scoped to the retrofit question.

### [8a-CL-16] Age-bracket transition trigger (turns-13 prompt) built
- **Claim:** Per PRD-40 §Incoming Flows L716: daily job detects birthdays crossing age 13, notifies mom, sets `coppa_consents.superseded_at`.
- **Pass:** Cron/daily job exists + notification wired.
- **Fail:** No daily transition job.
- **Evidence:** grep `pg_cron` migrations, Edge Functions for turns-13 / age-bracket-transition.

---

## Bucket 2 — Child Data Handling

**Source of authority:** Gameplan line 331. CLAUDE.md #3 (RLS on every table), #6 (Safe Harbor exemption), PRD-22 (Settings — data export), account deletion per CLAUDE.md / PRD-01.

### [8a-CL-17] Every child-data table has RLS enabled
- **Claim:** CLAUDE.md Convention #3: every table MUST have RLS enabled. Child-data tables include at minimum: `tasks`, `task_completions`, `journal_entries`, `widget_data_points`, `archive_context_items`, `self_knowledge`, `best_intentions`, `guiding_stars`, `lila_conversations`, `lila_messages`, `victories`, `homeschool_time_logs`, `family_moments` (when built), `reflection_responses`, `practice_log`, `randomizer_draws`, `member_creature_collection`, `member_page_unlocks`, `member_sticker_book_state`, `rhythm_completions`, `beta_glitch_reports`.
- **Pass:** Every listed table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in a migration AND at least one `CREATE POLICY`.
- **Fail:** Any listed table lacks RLS enablement or has zero policies.
- **Evidence:** grep migrations for `ENABLE ROW LEVEL SECURITY` per table name; count `CREATE POLICY` rows.

### [8a-CL-18] Data export flow for child data exists
- **Claim:** Per CLAUDE.md data export references and PRD-22 §Settings — mom can export all her family's data. PRD-40 §Parental Access Rights reinforces COPPA-required data access.
- **Pass:** Export function present — either Edge Function, RPC, or settings page that serializes all child data for a given `family_id`.
- **Fail:** No export mechanism found.
- **Evidence:** grep `export`, `data_export`, `download` in `supabase/functions/` and `src/pages/settings/`.

### [8a-CL-19] Data deletion flow exists
- **Claim:** Per COPPA and PRD-40 §Retention Policy (L831): revocation triggers cascade deletion. Also account-level deletion per PRD-01 standards.
- **Pass:** Deletion cascade defined as DB function or Edge Function; at least scheduled deletion job per PRD-40 L715 present.
- **Fail:** No deletion cascade anywhere.
- **Evidence:** grep `delete`, `purge`, `cascade` in migrations and Edge Functions; check for `account_deletions` table usage.

### [8a-CL-20] Retention policy encoded for voice/audio recordings
- **Claim:** CLAUDE.md Architecture references pg_cron job for voice recording cleanup daily; retention encoded rather than indefinite.
- **Pass:** pg_cron job present + retention threshold documented.
- **Fail:** No cleanup job; recordings persist indefinitely.
- **Evidence:** grep `pg_cron`, `schedule` in migrations for voice/audio cleanup.

### [8a-CL-21] Safe Harbor exempt from aggregation (CLAUDE.md #6 + #243)
- **Claim:** CLAUDE.md #243 (Safe Harbor aggregation-exclusion guardrail): all queries against `lila_conversations` used for aggregation MUST filter `is_safe_harbor = false`. Convention text exists; grep-based CI check lands with first aggregation build (PRD-19/28B/30).
- **Pass:** No aggregation code currently queries `lila_conversations` without the filter (pre-build-state-of-convention).
- **Fail:** An existing aggregation query omits the filter.
- **Evidence:** grep aggregation-pattern queries against `lila_conversations` in `src/` and `supabase/functions/_shared/`.

### [8a-CL-22] Privacy Filtered hard-enforcement in Edge Functions (PRD-13 / CLAUDE.md #76)
- **Claim:** `is_privacy_filtered=true` items NEVER included in non-mom context — enforced in code, not just UI.
- **Pass:** Context-assembler code path for non-mom filters out `is_privacy_filtered=true` items regardless of toggle state.
- **Fail:** Privacy-filtered items reachable in non-mom context.
- **Evidence:** Read `supabase/functions/_shared/context-assembler.ts` (or equivalent); find the privacy-filter code path.

---

## Bucket 3 — LiLa Safety Enforcement

**Source of authority:** Gameplan line 332. CLAUDE.md #7 (Crisis Override global), #6 (Safe Harbor exemption), #96 (Mediator safety exception). PRD-20 Safe Harbor. PRD-30 Safety Monitoring. `claude/ai_patterns.md` §Safety Systems.

### [8a-CL-23] Crisis Override in every LiLa Edge Function
- **Claim:** CLAUDE.md Convention #7: Crisis Override is GLOBAL — every system prompt must include crisis detection. Applies across EVERY LiLa conversation regardless of mode.
- **Pass:** Every LiLa Edge Function (`lila-chat`, ThoughtSift tools, Cyrano, Higgins, etc.) includes crisis-keyword or crisis-detection check before returning response.
- **Fail:** Any LiLa Edge Function lacks crisis detection in its request path.
- **Evidence:** grep `crisis`, `988`, `suicide`, `self_harm` in `supabase/functions/lila*` + `supabase/functions/_shared/*`.

### [8a-CL-24] Safe Harbor `is_safe_harbor` column present and filterable
- **Claim:** PRD-20 and CLAUDE.md #6. `lila_conversations.is_safe_harbor` must exist.
- **Pass:** Column present in live_schema.md `lila_conversations` row list (confirmed — line 1 of table, column 8).
- **Fail:** Column missing.
- **Evidence:** live_schema.md `lila_conversations` — **preliminary: PASS (column 8 `is_safe_harbor` listed)**. Full verification by worker.

### [8a-CL-25] Safe Harbor orientation/literacy flows built (PRD-20)
- **Claim:** PRD-20 specifies `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`. Feature keys `safe_harbor` and `safe_harbor_guided`.
- **Pass:** Tables present in live_schema.md + orientation/literacy UI wired.
- **Fail:** Tables absent; feature unbuilt.
- **Evidence:** live_schema.md grep; WIRING_STATUS.md; STUB_REGISTRY.md entries for PRD-20.

### [8a-CL-26] PRD-30 Safety Monitoring infrastructure built
- **Claim:** PRD-30 tables per `feature_glossary.md`: `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`. Feature keys `safety_monitoring_basic`, `safety_monitoring_ai`.
- **Pass:** All 7 tables in live_schema.md + `safety-classify` Edge Function present.
- **Fail:** Any of the 7 tables missing, OR Edge Function missing.
- **Evidence:** live_schema.md table search; `Glob supabase/functions/safety*`.

### [8a-CL-27] Layer 1 keyword scanner wired in Edge Functions
- **Claim:** `ai_patterns.md` §Safety Monitoring (PRD-30): Layer 1 keyword/phrase matching runs synchronously on every message.
- **Pass:** Keyword scan code runs in the message-send pipeline before response emission.
- **Fail:** Keyword check only exists as schema/table; no code site runs it.
- **Evidence:** grep `safety_keywords` query usage in Edge Functions; trace the write-path for `lila_messages`.

### [8a-CL-28] Layer 2 async Haiku classification scheduled
- **Claim:** `ai_patterns.md` §Safety Monitoring (PRD-30): Layer 2 Haiku conversation classification runs async background.
- **Pass:** `safety-classify` Edge Function invoked by pg_cron or queue job + `safety_scanned` flag updated on `lila_messages`.
- **Fail:** No scheduler reaches `safety-classify`.
- **Evidence:** grep pg_cron migrations; grep `safety-classify` invocations.

### [8a-CL-29] Monitoring scope — children opt-out, adults opt-in
- **Claim:** `ai_patterns.md`: children monitored by default (opt-out); adults opt-in. Encoded in `safety_monitoring_configs`.
- **Pass:** Config defaults correct per role.
- **Fail:** Defaults inverted or not encoded.
- **Evidence:** Read `safety_monitoring_configs` default seed migration.

### [8a-CL-30] LiLa ethics auto-reject categories enforced at Edge Function level
- **Claim:** Gameplan line 332: ethics auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) enforced at Edge Function level, not just specified in prompts.
- **Pass:** A code-level check runs on AI output (not just prompt instruction) and blocks/rejects violating output.
- **Fail:** Enforcement lives only in system prompt text; no code-level rejection path.
- **Evidence:** grep `auto_reject`, `ethics`, `force`, `coercion`, `manipulation`, `shame` in `supabase/functions/_shared/` and `supabase/functions/lila*`.
- **Note:** PRD-40 dependency list references PRD-41 LiLa Runtime Ethics Enforcement as "not yet authored" — preliminary signal this may be FAIL.

### [8a-CL-31] Mediator safety exception flag persisted (CLAUDE.md #96)
- **Claim:** Once Mediator safety triggered (fear, harm, coercive control), `safety_triggered` flag persisted to `lila_conversations.context_snapshot`, checked from DB on every turn, survives close/reopen.
- **Pass:** Code writes flag to context_snapshot + reads it before every Mediator response.
- **Fail:** No such enforcement.
- **Evidence:** grep `safety_triggered` in Mediator Edge Function; trace read path.

---

## Bucket 4 — Deities-as-Board-Persona Block (PRD-34)

**Source of authority:** Gameplan line 333. CLAUDE.md #100, #101, #102 for Board of Directors Prayer Seat and content policy.

### [8a-CL-32] Content policy gate runs BEFORE persona generation (CLAUDE.md #102)
- **Claim:** Haiku pre-screen runs before Sonnet persona generation; separate call.
- **Pass:** Edge Function code shows pre-screen call preceding persona generation.
- **Fail:** No pre-screen; Sonnet generates immediately.
- **Evidence:** Read Board of Directors Edge Function (under `supabase/functions/board-*` or `supabase/functions/thoughtsift-*`).

### [8a-CL-33] Deity detection redirects to Prayer Seat
- **Claim:** CLAUDE.md #102: deity → Prayer Seat redirect.
- **Pass:** Pre-screen has deity category; on match, creates `board_session_personas` row with `is_prayer_seat=true` and NO AI response.
- **Fail:** Deity names pass through to AI generation.
- **Evidence:** Read pre-screen code + `board_session_personas.is_prayer_seat` default / assignment logic.

### [8a-CL-34] Blocked-figure hard block
- **Claim:** CLAUDE.md #102: blocked figure → hard block (no persona created).
- **Pass:** Pre-screen returns block + surfaces user-facing message; no `board_personas` row created.
- **Fail:** No hard block path.
- **Evidence:** Read pre-screen code.

### [8a-CL-35] Prayer Seat generates no AI responses
- **Claim:** CLAUDE.md #100: Prayer Seat = special `board_session_personas` record with `is_prayer_seat=true`. No AI responses generated for this seat.
- **Pass:** Code path for Prayer Seat skips AI generation; uses fresh-generated reflection questions only.
- **Fail:** Prayer Seat generates AI persona responses.
- **Evidence:** Read Board of Directors generation loop; find `is_prayer_seat` branch.

### [8a-CL-36] Persona disclaimer shown exactly once per session for non-personal personas (CLAUDE.md #101)
- **Claim:** `disclaimer_shown` boolean on `board_sessions` tracks one-time display; "AI interpretation of [Name]..." message.
- **Pass:** `disclaimer_shown` column exists (confirmed: live_schema.md `board_sessions` column 6) + UI renders disclaimer on first non-personal persona, then sets flag.
- **Fail:** No disclaimer UI or no flag-write.
- **Evidence:** live_schema.md preliminary PASS; trace UI/Edge Function write to `disclaimer_shown`.

---

## Bucket 5 — Legal Liability Surfaces (Human-in-the-Mix)

**Source of authority:** Gameplan line 334. CLAUDE.md #4 (every AI output through HITM), intro (HITM is non-negotiable). `claude/conventions.md` §Human-in-the-Mix Pattern.

### [8a-CL-37] Human-in-the-Mix component exists and is reusable
- **Claim:** `conventions.md` specifies `<HumanInTheMix onEdit onApprove onRegenerate onReject />` as reusable component.
- **Pass:** Component file exists in `src/components/` and is imported by multiple AI-output features.
- **Fail:** No such component; each feature reinvents the pattern OR skips it.
- **Evidence:** `Glob src/components/**/HumanInTheMix*`; count import usages.

### [8a-CL-38] HITM applied on every persistence-bound AI output
- **Claim:** CLAUDE.md #4: every AI output that persists MUST go through HITM.
- **Pass:** Every feature that persists AI output (Task Breaker subtasks, Review & Route extractions, AI Craft for Guiding Stars / Best Intentions, ai-parse results, curriculum-parse, MindSweep classification commits, AI meeting summaries, Cyrano drafts, Higgins outputs, etc.) has Edit/Approve/Regenerate/Reject before commit.
- **Fail:** Any feature persists AI output without HITM.
- **Evidence:** Feature-by-feature trace — this is a broad sweep; proposed as a dedicated worker pass emitting per-feature subverdicts.

### [8a-CL-39] LiLa conversation messages NOT subject to HITM (by design)
- **Claim:** LiLa chat messages are conversational, not persistent-deliverable output — HITM does not apply to chat turns. The HITM contract applies when AI output becomes a permanent user record (task, journal entry, Guiding Star, etc.).
- **Pass:** Confirmed design intent matches code — LiLa chat does not artificially insert HITM UI.
- **Fail:** Unclear boundary produces user-facing inconsistency.
- **Evidence:** Not an evidence-gathering item; this is a scope confirmation for the founder to acknowledge so Bucket 5 worker pass scopes correctly.

### [8a-CL-40] Embedding-only AI outputs exempt from HITM
- **Claim:** Embeddings are asynchronous, produce no user-facing text, and are not persistence-bound content — HITM does not apply.
- **Pass:** Design intent confirmed.
- **Evidence:** Scope confirmation item like 8a-CL-39.

---

## Summary Table — Checklist at a Glance

| ID | Bucket | Claim | Expected Severity if FAIL |
|---|---|---|---|
| 01 | COPPA | `parent_verifications` table | Blocking |
| 02 | COPPA | `coppa_consents` table | Blocking |
| 03 | COPPA | `coppa_consent_templates` table | Blocking |
| 04 | COPPA | `parent_verification_attempts` table | Blocking |
| 05 | COPPA | `family_members` COPPA columns | Blocking |
| 06 | COPPA | COPPA enums | High |
| 07 | COPPA | RLS gates on consent | Blocking |
| 08 | COPPA | `useCoppaConsent` hook | High |
| 09 | COPPA | Consent Screens 1–5 | Blocking |
| 10 | COPPA | First-under-13 trigger | Blocking |
| 11 | COPPA | Additional-child Screen 7 | High |
| 12 | COPPA | Revocation Screen 9 | High |
| 13 | COPPA | Admin verification log | Medium |
| 14 | COPPA | Stripe webhook COPPA branch | Blocking |
| 15 | COPPA | PRD-01 retrofit | Blocking |
| 16 | COPPA | Turns-13 transition trigger | Medium |
| 17 | Child data | RLS on child tables | Blocking |
| 18 | Child data | Data export flow | High |
| 19 | Child data | Deletion flow | High |
| 20 | Child data | Voice retention | Medium |
| 21 | Child data | Safe Harbor aggregation exclusion | High |
| 22 | Child data | Privacy Filtered hard enforcement | High |
| 23 | LiLa safety | Crisis Override universal | Blocking |
| 24 | LiLa safety | `is_safe_harbor` column | (preliminary PASS) Low |
| 25 | LiLa safety | Safe Harbor flows | High |
| 26 | LiLa safety | PRD-30 tables | High |
| 27 | LiLa safety | Layer 1 keyword scanner | High |
| 28 | LiLa safety | Layer 2 Haiku scheduled | High |
| 29 | LiLa safety | Monitoring scope defaults | Medium |
| 30 | LiLa safety | Ethics auto-reject at Edge Function | Blocking |
| 31 | LiLa safety | Mediator safety flag persisted | High |
| 32 | Deity block | Content policy pre-screen | Blocking |
| 33 | Deity block | Deity → Prayer Seat | Blocking |
| 34 | Deity block | Blocked-figure hard block | Blocking |
| 35 | Deity block | Prayer Seat has no AI | High |
| 36 | Deity block | Disclaimer shown once | Medium |
| 37 | Legal/HITM | HITM component exists | High |
| 38 | Legal/HITM | HITM on every persistent AI output | Blocking (sweep) |
| 39 | Legal/HITM | LiLa chat exempt (scope confirmation) | Informational |
| 40 | Legal/HITM | Embeddings exempt (scope confirmation) | Informational |

Total: 40 binary items. ~14 expected-Blocking-if-FAIL, ~16 High, ~6 Medium, ~2 Informational, ~2 preliminary-PASS.

---

## Proposed execution order

Work items parallel where possible. Evidence passes run in separate worker windows.

1. **PRD-40 evidence pass (items 01–16)** — single worker pass over all COPPA items. Schema + hooks + retrofit checks are tightly coupled. Starting now (worker prompt below).
2. **Bucket 2 evidence pass (items 17–22)** — RLS sweep + export/delete/retention trace.
3. **Bucket 3 evidence pass (items 23–31)** — Crisis Override grep + PRD-20/30 infrastructure trace + ethics code trace.
4. **Bucket 4 evidence pass (items 32–36)** — Board of Directors Edge Function read.
5. **Bucket 5 evidence pass (items 37–40)** — feature-by-feature HITM sweep (broadest pass).

Items 39 and 40 need founder acknowledgment, not worker pass. Raise those at the time Bucket 5 starts.

---

## Change log

- 2026-04-20 — Inventory drafted by orchestrator from gameplan Scope 8 §329–335, PRD-40 Data Schema, CLAUDE.md conventions, ai_patterns.md safety sections, feature_glossary.md compliance/safety entries.
