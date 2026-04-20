# Scope 8a — Checklist Decisions Log

> **Status:** OPEN — Scope 8a in progress.
> **Started:** 2026-04-20
> **Purpose:** Append-only log of founder decisions per checklist item. Orchestrator proposes verdicts; founder approves, amends, or overrides. Each entry is permanent — if a verdict is later revised, add a new entry referencing the prior one, do not edit history.
>
> **Recovery pointer:** if this file is being read by a fresh session, the checklist itself lives at [CHECKLIST_INVENTORY.md](CHECKLIST_INVENTORY.md). The gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 item 8 (lines 329–335). Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §8a as SCOPE-8a.F{N}.

---

## Standing rules

1. **Beta Readiness default = Y.** Set to N only when clearly informational/tool-hygiene/doc-only with no user-facing safety/compliance impact. Founder ruling 2026-04-20.
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only for this scope.
3. **"If it doesn't work in the app, it is not wired."** Inherited rule from Scope 5 walk-through. A table existing in a migration is not sufficient; the consuming code must actually run the infrastructure. Applies especially to Bucket 3 (safety enforcement) and Bucket 5 (HITM on AI outputs).
4. **Evidence not intuition.** Every verdict must cite migration SHA, file:line, grep hit, or worker-pass report. "I remember reading..." is not evidence.
5. **Worker commits, orchestrator adjudicates.** Orchestrator does not run substantive greps or commits directly; workers in separate sessions do. Orchestrator drafts prompts, reviews outputs, proposes verdicts.

---

## Decision log format

Each entry:

### [8a-CL-{N}] {item title}
- **Date:** YYYY-MM-DD
- **Worker pass:** path to evidence report, if any
- **Orchestrator proposed verdict:** PASS / FAIL / PARTIAL / DEFERRED / N/A
- **Orchestrator proposed severity:** Blocking / High / Medium / Low / Informational (if FAIL/PARTIAL)
- **Founder decision:** (confirmed / amended / overridden) + rationale
- **Emits finding:** SCOPE-8a.F{N} / no
- **Beta Readiness flag:** Y / N (Y by default)
- **Notes:**

---

## Round 0 — Preliminary verdicts before evidence gathering

These are items where the CHECKLIST_INVENTORY.md draft already contains a preliminary verdict based on `claude/live_schema.md` or inline CLAUDE.md convention reference. They must be confirmed by the first evidence pass, not accepted on sight.

### [8a-CL-24] Safe Harbor `is_safe_harbor` column present
- **Date:** 2026-04-20
- **Worker pass:** (pending — included in Bucket 3 pass)
- **Orchestrator proposed verdict:** Preliminary PASS per live_schema.md `lila_conversations` column 8 listing `is_safe_harbor`.
- **Founder decision:** (pending)
- **Emits finding:** No (if confirmed PASS)
- **Beta Readiness flag:** N (column presence is neutral; downstream filter enforcement is 8a-CL-21, separate item)
- **Notes:** Column presence alone does not satisfy the filter-enforcement requirement in CLAUDE.md #243 — that's tested by 8a-CL-21 separately.

### [8a-CL-36] Board of Directors `disclaimer_shown` column present
- **Date:** 2026-04-20
- **Worker pass:** (pending — included in Bucket 4 pass)
- **Orchestrator proposed verdict:** Preliminary PASS on column; full verdict awaits UI/Edge-Function trace.
- **Founder decision:** (pending)
- **Notes:** live_schema.md `board_sessions` lists `disclaimer_shown` at column 6. Verdict conditional on UI/Edge Function actually reading and writing it.

---

## Decisions

## Round 1 — PRD-40 COPPA evidence pass (Bucket 1, items 01–16)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_PRD40_COPPA.md](EVIDENCE_PRD40_COPPA.md) (local commit 203878a, not pushed)
- **Aggregate:** 16/16 FAIL with high confidence. PRD-40 is entirely unbuilt. PRD header Status "Not Started" matches reality.
- **Expected outcome:** Matched. Founder confirmed before evidence pass that PRD-40 had not been intentionally built; the worker pass verifies nothing was accidentally built either.

### Per-item verdict table

| Item | Claim | Proposed verdict | Severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| 8a-CL-01 | `parent_verifications` table | FAIL | Blocking | SCOPE-8a.F1 (consolidated) | (pending) |
| 8a-CL-02 | `coppa_consents` table | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-03 | `coppa_consent_templates` table | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-04 | `parent_verification_attempts` table | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-05 | `family_members` COPPA columns | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-06 | COPPA enums | FAIL | High | SCOPE-8a.F1 | (pending) |
| 8a-CL-07 | RLS policies gate writes | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-08 | `useCoppaConsent` hook | FAIL | High | SCOPE-8a.F1 | (pending) |
| 8a-CL-09 | Consent Screens 1–5 | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-10 | First-under-13 trigger | FAIL | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-11 | Additional-child Screen 7 | FAIL | High | SCOPE-8a.F1 | (pending) |
| 8a-CL-12 | Revocation Screen 9 | FAIL | High | SCOPE-8a.F1 | (pending) |
| 8a-CL-13 | Admin verification log Screen 10 | FAIL (compound — PRD-32 also unbuilt) | Medium | SCOPE-8a.F1 + cross-reference | (pending) |
| 8a-CL-14 | Stripe webhook COPPA branch | FAIL (compound — no webhook Edge Function exists at all) | Blocking | SCOPE-8a.F1 + cross-reference | (pending) |
| 8a-CL-15 | PRD-01 retrofit — signup blocks | FAIL (same site as CL-10) | Blocking | SCOPE-8a.F1 | (pending) |
| 8a-CL-16 | Turns-13 transition trigger | FAIL | Medium | SCOPE-8a.F1 | (pending) |

### Load-bearing unexpected findings (from worker pass)

1. **No Stripe webhook Edge Function exists.** CL-14 fails not for a missing COPPA branch but because the prerequisite handler was never built. Affects PRD-31 subscription lifecycle beyond PRD-40. Logged here for Scope 8a context; referred to Scope 2/3 (PRD-31 audit in Stage C) for primary ownership.
2. **No admin console pages exist in `src/pages/`.** CL-13 is a compound gap — PRD-32 Admin Console is unbuilt, so PRD-40 Screen 10 has no shell to attach to. Logged here; referred to Scope 2/3 (PRD-32 audit in Stage C).
3. **`account_deletions` table exists** (PRD-22, migration 100027) with deletion function + RLS. Potential leverage for future PRD-40 revocation cascade but NOT currently wired to COPPA. Remediation intelligence, not a finding.

### Proposed consolidated finding structure

Rather than emitting 16 individual findings (noise), emit one consolidated **SCOPE-8a.F1** that names all 16 items in its Description, cites the evidence file, and names the two compound gaps (Stripe webhook, admin console) as prerequisite dependencies. This is a single Blocking Beta Readiness finding — not 16 — since the resolution is one build program (PRD-40 Fix Now) with two prerequisite builds (Stripe webhook + admin shell) branching from it.

See [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §8a for the applied finding once founder confirms this adjudication.

---

## Round 2 — Bucket 2 child-data handling evidence pass (items 17–22)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BUCKET_2.md](EVIDENCE_BUCKET_2.md)
- **Aggregate:** 2 PASS, 1 PASS-with-caveat, 2 PARTIAL, 1 FAIL

### Per-item verdict table

| Item | Claim | Proposed verdict | Severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| 8a-CL-17 | RLS on child-data tables | PASS | — | none (informational) | (pending) |
| 8a-CL-18 | Data export flow | PARTIAL (Archives-only; no full-family export) | High | SCOPE-8a.F2 | (pending) |
| 8a-CL-19 | Data deletion flow | PARTIAL (table + fn exist; cron commented out; soft-deactivate only; no child-data cascade) | High | SCOPE-8a.F2 + cross-ref F1 | (pending) |
| 8a-CL-20 | Voice retention cron | FAIL (no cron exists; audio persists indefinitely) | Medium | SCOPE-8a.F2 | (pending) |
| 8a-CL-21 | Safe Harbor aggregation exclusion | PASS-with-caveat (cross-member `useFamilyConversations` filters; own-member lists do not — design question) | Low | Deferred to PRD-20 pre-build | (pending) |
| 8a-CL-22 | Privacy Filtered hard enforcement | PASS (`applyPrivacyFilter` at `_shared/context-assembler.ts:623` + migration 100149 RLS defense-in-depth) | — | none (informational) | (pending) |

### Cross-reference back to F1

`process_expired_deletions()` only flips `family_members.is_active`; child-data tables are never touched on account deletion. This deepens F1's remediation scope: PRD-40 revocation cascade is not just unbuilt, it is not achievable against current code even if PRD-40 tables were in place. Captured in F2 description with cross-reference to F1.

### Deferred to PRD-20 pre-build

`useLilaConversations` and `useConversationHistory` (own-member own-list displays) do not filter `is_safe_harbor`. Under CLAUDE.md #243's "aggregation or reporting" reading these own-user lists are arguably aggregation; under a narrower reading they are single-user view surfaces exempt. This is a product-policy question, not a current code violation (no current code path sets `is_safe_harbor=TRUE` because PRD-20 is unbuilt). Flagged for PRD-20 pre-build audit — must be resolved before Safe Harbor writes anything to production.

---

## Round 3 — Bucket 3 LiLa safety enforcement evidence pass (items 23–31)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BUCKET_3.md](EVIDENCE_BUCKET_3.md)
- **Aggregate:** 2 PASS, 1 PARTIAL, 6 FAIL (6 FAILs are structural "PRD not built")

### Per-item verdict table

| Item | Claim | Proposed verdict | Severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| 8a-CL-23 | Crisis Override in every LiLa Edge Function | PARTIAL (`lila-translator` has in-prompt safety clause only, no code-level `detectCrisis`) | Medium | SCOPE-8a.F4 (founder policy call) | (pending) |
| 8a-CL-24 | `is_safe_harbor` column | PASS | — | none (informational; preliminary PASS confirmed) | (pending) |
| 8a-CL-25 | Safe Harbor flows (PRD-20) | FAIL | Blocking | SCOPE-8a.F3 (PRD-20 structural) | (pending) |
| 8a-CL-26 | PRD-30 tables (7) | FAIL | Blocking | SCOPE-8a.F3 (PRD-30 structural) | (pending) |
| 8a-CL-27 | Layer 1 keyword scanner | FAIL | Blocking | SCOPE-8a.F3 | (pending) |
| 8a-CL-28 | Layer 2 async Haiku scheduled | FAIL | Blocking | SCOPE-8a.F3 | (pending) |
| 8a-CL-29 | Monitoring scope defaults | FAIL | Medium | SCOPE-8a.F3 | (pending) |
| 8a-CL-30 | Ethics auto-reject at Edge Function level | FAIL (PRD-41 not authored per PRD-40 dependency note) | Blocking | SCOPE-8a.F3 | (pending) |
| 8a-CL-31 | Mediator safety flag persisted | PASS (`lila-mediator` is reference implementation for durable safety-flag persistence) | — | none (informational; remediation leverage) | (pending) |

### Remediation intelligence

- `lila-mediator` is the reference pattern PRD-30 / PRD-41 can generalize across every LiLa Edge Function.
- `safety_scanned` columns on `lila_messages` / `lila_conversations` are dead weight today (zero readers/writers). Already in STUB_REGISTRY; not a new finding.
- PRD-40 self-documents the PRD-30/PRD-41 gap at lines 767–775, 1217, 1250. Evidence confirms the known state.
- `mindsweep-sort:67` had a false-positive "crisis" keyword hit inside a financial-term regex (budget crisis) — correctly excluded from the per-function subtable. No finding.

---

## Round 4 — Bucket 4 Board of Directors content policy evidence pass (items 32–36)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BUCKET_4.md](EVIDENCE_BUCKET_4.md)
- **Aggregate:** 5/5 PASS. Content policy gate is wired end-to-end. Three unexpected fail-open / defense-in-depth defects surfaced as a separate finding candidate.

### Per-item verdict table

| Item | Claim | Proposed verdict | Severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| 8a-CL-32 | Content policy pre-screen precedes persona generation | PASS | — | none | (pending) |
| 8a-CL-33 | Deity → Prayer Seat redirect | PASS | — | none | (pending) |
| 8a-CL-34 | Blocked-figure hard block | PASS | — | none | (pending) |
| 8a-CL-35 | Prayer Seat generates no AI | PASS | — | none | (pending) |
| 8a-CL-36 | Disclaimer shown once per session | PASS (column + Edge Function read + write all wired) | — | none | (pending) |

### Unexpected findings (→ SCOPE-8a.F5 candidate)

1. **Fail-open on Haiku classifier error** (`lila-board-of-directors/index.ts:74`, `100–102`). On API failure or JSON parse failure, `contentPolicyCheck` returns `approved`. If Haiku is down during an attempted deity / blocked-figure request, the gate passes. Policy-direction call: should this fail-closed ("error returning content policy decision, please retry") or stay fail-open?
2. **Server-side enforcement gap in `create_persona` action** — the Edge Function's `create_persona` handler does not internally re-invoke `contentPolicyCheck`. Gate is enforced only by the single client caller (`BoardOfDirectorsModal.tsx`). A direct RPC call to `create_persona` bypassing the modal could skip the gate.
3. **Hardcoded fallback prayer questions** (`index.ts:195–201`) returned only on JSON parse failure. Violates CLAUDE.md #100 "never canned" rule IF fallback ever becomes the dominant path. Edge case; low severity.

---

## Round 5 — Bucket 5 HITM sweep evidence pass (items 37–40)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BUCKET_5.md](EVIDENCE_BUCKET_5.md)
- **Aggregate:** HITM applied in spirit across 22/30 AI-persistence surfaces, but shared `HumanInTheMix` component has reuse count = 1 and 5 surfaces have concrete concerns.

### Per-item verdict table

| Item | Claim | Proposed verdict | Severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| 8a-CL-37 | HITM component exists and is reusable | PARTIAL (component exists; reuse count = 1, only `LilaMessageBubble`) | Medium | SCOPE-8a.F8 | (pending) |
| 8a-CL-38 | HITM applied on every persistent AI output | PARTIAL (22/30 in spirit; DailyCelebration bypass → F6; MindSweep autopilot labeling → F7; BookShelf extraction + auto-titles → scope confirmation) | Mixed | SCOPE-8a.F6 + SCOPE-8a.F7 + scope confirmations | (pending) |
| 8a-CL-39 | LiLa chat exempt from HITM | DEFERRED (founder scope confirmation — not a worker verdict) | — | scope confirmation | confirmed via inventory |
| 8a-CL-40 | Embeddings exempt from HITM | DEFERRED (founder scope confirmation) | — | scope confirmation | confirmed via inventory |

### Scope confirmations (not findings)

These five surfaces commit AI output without pre-commit HITM. After founder review, each is confirmed as intentional design or metadata-level output, not a HITM violation:

1. **LiLa chat messages (CL-39)** — conversational, not persistence-bound content. HITM does not apply to chat turns per CLAUDE.md #4 reading.
2. **Embeddings (CL-40)** — async metadata, no user-facing text.
3. **BookShelf extraction pipeline** (`bookshelf-extract`, `bookshelf-study-guide`) — hundreds of extractions per book make pre-commit HITM impractical. Post-hoc Heart/Hide is the intentional user-facing review surface. Not a finding.
4. **Auto-titles** (Notepad tabs + message threads) — title is metadata, not content; mom can rename inline later. Treated as embeddings-class metadata. Not a finding.
5. **MindSweep autopilot opt-in** — mom's opt-in to `trust_obvious` / `full_autopilot` modes IS the HITM consent; every subsequent auto-route is covered by the one explicit consent. Not a HITM violation. However, the `source='manual'` labeling of autopilot-routed records IS a separate defect — see F7.

### Emitted findings proposals

- **SCOPE-8a.F6** — DailyCelebration auto-saves AI-generated celebration narrative to `victory_celebrations` on Done click with no Edit/Regenerate/Reject. Child-facing persistent record. Blocking. Beta=Y.
- **SCOPE-8a.F7** — MindSweep autopilot writes `source='manual'` to destination tables, making opt-in autopilot routes indistinguishable from hand-approved entries in the audit trail. Medium. Beta=N (opt-in covers HITM intent; defect is audit-trail integrity). Fix Next Build via enum/source rename.
- **SCOPE-8a.F8** — `HumanInTheMix` component reuse count = 1 of 22+ eligible sites; each feature reinvents Edit/Approve/Regenerate/Reject inline with inconsistent button labels. Not a safety bypass (HITM happens everywhere else). Medium. Beta=N. Tech Debt — refactor sweep during wizard phase.

---

## Founder adjudication — Rounds 1–5 closed 2026-04-20

Founder reviewed plain-UX translation of all proposed findings and returned the following rulings. This section closes the walk-through for Rounds 2–5 (Round 1 / F1 was applied in commit e3d43a7).

| Finding | Founder ruling | Severity | Beta Readiness | Resolution |
|---|---|---|---|---|
| **F2 — Privacy-data-lifecycle** | Agreed as proposed. Export (Archives-only), deletion (soft-deactivate, no child-data cascade), voice retention (no cron, audio persists indefinitely) consolidated. | Blocking | Y | Fix Now |
| **F3 — Safe Harbor + Safety Monitoring** | Agreed as proposed. Founder framing: build PRD-30/PRD-41 safety monitoring infrastructure so Safe Harbor can plug into it cleanly when PRD-20 is built. One consolidated finding with two sub-sections (PRD-20 / PRD-30+PRD-41). | Blocking | Y | Fix Now |
| **F4 — Translator crisis detection** | PARTIAL + code-fix confirmed. Founder product context captured: Translator is a style-rewrite toy (pirate/sportscaster/Gen Z), not a tone-softener. Input surface is the same arbitrary-paste field as every other LiLa tool, so same guardrail applies. Resolution: extend `detectCrisis` to Translator; remove "except Translator" exception in the shared helper. CLAUDE.md #7 stays as-is. | Medium | N | Fix Next Build |
| **F5 — Board of Directors fail-open** | Agreed as proposed. (a) Flip fail-open default to fail-closed on Haiku classifier error. (b) Add server-side `contentPolicyCheck` inside `create_persona` action. (c) Hardcoded prayer fallback is Tech Debt only. | Medium | Y | Fix Now for (a) + (b); Tech Debt for (c) |
| **F6 — DailyCelebration auto-save** | Agreed as proposed. AI-generated celebration narrative must pass through Edit/Approve/Regenerate/Reject before persisting to `victory_celebrations`. Child-facing + COPPA-adjacent. | Blocking | Y | Fix Now |
| **F7 — MindSweep autopilot audit-trail labeling** | Agreed as proposed. Rename `source='manual'` to `source='mindsweep_autopilot'` on autopilot routes so audit trail distinguishes hand-approved vs auto-routed. | Medium | N | Fix Next Build |
| **F8 — HITM component under-reuse** | Agreed as proposed. Refactor AI-output surfaces to use the shared `HumanInTheMix` component; standardize button labels. Tech Debt — address during Universal Setup Wizards phase (parallel workstream, non-concurrent zone during audit). | Medium | N | Tech Debt |

### Beta Readiness blocker summary

Scope 8a produces **5 open Beta Readiness blockers** pending Phase 3 triage + Fix Now remediation:

1. **F1** — PRD-40 COPPA entirely unbuilt (16/16 items FAIL)
2. **F2** — Privacy-data-lifecycle incomplete (export, deletion, voice retention)
3. **F3** — Safe Harbor + Safety Monitoring unbuilt (PRD-20 + PRD-30 + PRD-41)
4. **F5** — Board of Directors content policy fail-open defects
5. **F6** — DailyCelebration auto-save bypasses HITM for child-facing narrative

Non-Beta findings (F4, F7, F8) enter the Fix Next Build / Tech Debt register per standard audit flow.

Scope 8a evidence-gathering and walk-through complete. Apply-phase worker next to append F2–F8 to AUDIT_REPORT_v1.md. Archive-phase worker after that moves evidence to `.claude/completed-builds/scope-8a-evidence/`.

---
