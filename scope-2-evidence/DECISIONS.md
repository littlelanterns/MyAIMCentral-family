---
Status: OPEN — walk-through has not started
Stage: C
Scope: 2 (PRD-to-code alignment)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2; [PLAN.md](PLAN.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 300–304)
---

# Scope 2 — Decisions Log

> **Purpose:** Append-only log of founder decisions per Scope 2 domain batch. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_BATCH_{N}_*.md`; founder confirms, amends, or overrides. Each round entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 300–304. Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2 as `SCOPE-2.F{N}`. The 9 domain batches run in the order listed in PLAN.md §3.1.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) §Standing rules), amended for Scope 2 content.

1. **Beta Readiness default = N** for Scope 2 findings. Set to Y only when the drift affects child-facing UX, privacy boundary, safety surface, compliance lifecycle, or role-boundary data leak. Most Scope 2 findings are PRD-text-vs-code-drift and do not block beta. Founder ruling 2026-04-20 (PLAN.md §6).
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only for this scope.
3. **"If it doesn't work in the app, it is not wired."** Inherited rule from Scope 5 walk-through. Applies to any row where the PRD claim is "built" but no consuming code actually runs the infrastructure. Applies especially to Foundation (PRD-01/02 invite + permission flows) and Personal Growth (context-source tables that require three-tier toggle wiring all the way to LiLa context assembly).
4. **Evidence not intuition.** Every verdict must cite migration SHA, `file:line`, grep hit, PRD section/line reference, or worker-pass report. "I remember reading..." is not evidence.
5. **Worker commits, orchestrator adjudicates.** The batch worker runs greps and writes `EVIDENCE_BATCH_{N}_*.md` and commits it. The orchestrator does not run substantive greps directly; it reads the evidence file, proposes verdicts, and captures founder adjudication here.
6. **Scope 2 does not re-emit Scope 5 / Scope 8a closed findings.** When a Scope 2 row maps 1:1 to a closed finding, the evidence file cites the finding ID and skips emission. When a Scope 2 row identifies a *new* drift on the same PRD as a closed finding, emit normally with a cross-reference.

## Decision log format

Each batch round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) Round format.

```
## Round {N} — {Domain name} evidence pass (Batch {N}, PRDs {...})

- **Date:** YYYY-MM-DD
- **Worker pass:** [EVIDENCE_BATCH_{N}_{slug}.md](EVIDENCE_BATCH_{N}_{slug}.md)
- **Aggregate:** {row counts per classification}

### Per-candidate-finding verdict table

| Candidate | PRD rows contributing | Proposed verdict | Proposed severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| SCOPE-2.F{N} title | {row refs} | {proposed} | Blocking/High/Medium/Low | SCOPE-2.F{N} | (pending) |

### Load-bearing unexpected findings

{numbered list drawn from evidence file's Unexpected Findings section}

### Cross-references
{links to any prior finding this batch cites — Scope 5, Scope 8a, Scope 1}

### Founder adjudication

{one paragraph per decided finding — confirmed/amended/overridden + rationale}

### Emission list

{final list of SCOPE-2.F{N} titles that will be written to AUDIT_REPORT_v1.md §2 by the apply-phase worker}
```

Each per-candidate row in the verdict table uses one of the 5 Gameplan classifications from PLAN.md §2 at the row level; the `Proposed verdict` column reflects that classification. Finding emission is the consolidation step — rows with the same classification and pattern collapse into one `SCOPE-2.F{N}`.

## Round 0 — Preliminary notes before evidence gathering

Items flagged for consideration before Foundation batch kicks off. Confirmed or overridden at Round 1 kickoff.

### Resolved pre-walkthrough (2026-04-20)

Four PRDs not initially assigned to Scope 2 batches were placed per founder ruling 2026-04-20:

- PRD-18 Rhythms & Reflections → Personal Growth (batch 3)
- PRD-19 Family Context & Relationships → Personal Growth (batch 3)
- PRD-31 Subscription Tier System → Foundation (batch 1)
- PRD-32A Demand Validation Engine → excluded from Scope 2 (PlannedExpansionCard stub; PRD-32-32A Cross-PRD addendum stays in Scope 3+8b as Deferred-to-Gate-4)

Plan amended same commit as §3.5 addenda-per-PRD inventory (see PLAN.md §3.1 updated batch counts, §3.3 exclusion table, §3.4 per-domain detail additions, §3.5 new section, §4.1 column shape, §7 new rule 8). Original open-question paragraph removed to prevent confusion for fresh sessions.

### Pattern-to-watch — three-tier toggle wiring drift

Scope 5 confirmed several context-source tables have `is_included_in_ai` columns but the three-tier toggle (person/category/item) may not be wired end-to-end in every case. Scope 2 Personal Growth batch (PRD-06/07/08/13) is the natural surface for verifying this drift per-PRD. Watch for cross-PRD pattern; may flag to Scope 3+8b.

### Pattern-to-watch — screen count drift

Several PRDs (notably PRD-14B Calendar, PRD-15 Messages, PRD-21A Vault) specify large numbers of screens. Scope 5 did not enumerate every screen. Scope 2 batches touching these PRDs should enumerate screen count claimed vs present; expect Deferred-Document classification on partial builds.

## Decisions

## Round 1 — Foundation evidence pass (Batch 1, PRDs 01, 02, 03, 04, 31)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_1_foundation.md](EVIDENCE_BATCH_1_foundation.md)
- **Aggregate:** 34 rows across 5 PRDs (PRD-01: 6, PRD-02: 9, PRD-03: 6, PRD-04: 5, PRD-31: 8). 6 ambiguity flags. 5 unexpected findings. 9 worker-proposed candidates.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD31-TIER-MONETIZATION-UNBUILT | PRD-01 R5, PRD-31 R1–R8 | Deferred-Document | Medium | SCOPE-2.F1 | Confirmed — intentional beta-deferral per Convention #10; linked to F2 as pre-monetization prerequisite work | N |
| PRD02-GATE-ADOPTION | PRD-02 R4, R5 | Unintentional-Fix-Code | Low | SCOPE-2.F2 | Confirmed as pre-monetization prerequisite — cannot flip paid tiers on without wrapping features; Low during beta, escalates to High when tier-gating activates | N |
| PRD02-ACCESS-LEVEL-PICKER-MISSING | PRD-02 R6 | Unintentional-Fix-Code | Medium | SCOPE-2.F3 | Confirmed — ESCALATED per founder: build soon rather than next normal build sprint. Every new founding family hits this degraded onboarding surface; 164 profile rows seeded ready to consume. Near-term build priority. | N |
| PRD01-LEGACY-HUB-COLUMNS | PRD-01 R3, PRD-04 R1 | Intentional-Document | Low | SCOPE-2.F4 | Confirmed — documentation cleanup per PRD-14D supersession. Optional drop migration Phase 3 triage. | N |
| PRD02-SHIFT-SUPERSESSION | PRD-02 R1, R2 | Intentional-Document → Overridden to Unintentional-Fix-PRD | Low | SCOPE-2.F5 | Orchestrator override confirmed by founder: update PRD-02 text to cite Conventions #26 + #40 rather than leaving archaeology. PRDs stay authoritative only if kept accurate. | N |
| PRD03-THEME-COUNT-DRIFT | PRD-03 R1 | Scope-Creep-Evaluate | Low | SCOPE-2.F6 | Confirmed — founder direction: codify 46 themes as truth (update PRD-03 + Convention #42 to 46). Future consolidation/rework logged as post-audit product workstream (reduce themes + make each deliberately differentiated); not audit scope. | N |
| PRD03-SHARED-COMPONENT-GAP | PRD-03 R4 | Unintentional-Fix-Code | Low | SCOPE-2.F7 | Confirmed — inventory reconciliation needed across PRD-03 (18) vs Convention #44 (13) vs STUB_REGISTRY (11). PATTERN-FLAG-FOR-SCOPE-3 preserved since shared components cross PRDs. | N |
| PRD04-HUB-TV-STUB | PRD-04 R2 | Deferred-Document | Low | SCOPE-2.F8 | Confirmed — founder confirmed no TV mode advertising exists, PlannedExpansionCard placeholder is honest. Post-MVP per PRD-33 PWA PRD. | N |
| PRD01-FIELD-NAME-DRIFT | PRD-01 R1 | Unintentional-Fix-PRD | Low | Downgraded to batch-hygiene note (not a finding) | Orchestrator proposed, founder confirmed: one-line PRD-01 field-name typo (auth_user_id → user_id) does not warrant full finding. Captured in Emission list below as batch-hygiene note. | N |

### Load-bearing unexpected findings

1. Low adoption of tier-gating wrapping conventions — consolidated into SCOPE-2.F2. See [EVIDENCE_BATCH_1_foundation.md](EVIDENCE_BATCH_1_foundation.md) §Unexpected findings #1.
2. `permission_level_profiles` seeded with 164 rows but zero consumer — consolidated into SCOPE-2.F3. See §Unexpected findings #2.
3. Three dead Hub columns on `families` table post-PRD-14D — consolidated into SCOPE-2.F4. See §Unexpected findings #3.
4. Zero Stripe code anywhere in the codebase — consolidated into SCOPE-2.F1. Cross-ref SCOPE-8a.F1 prerequisite note. See §Unexpected findings #4.
5. `feature_key_registry` 196 rows vs Feature Glossary "130+" — documentation-staleness; not a finding. Flagged as doc-hygiene for Phase 3 triage.

### Cross-references

- CROSS-REF: SCOPE-8a.F1 prerequisite gap (Stripe webhook Edge Function absence) cited by SCOPE-2.F1
- CROSS-REF: SCOPE-5.F4 walk-through (Foundation-touching registry decisions) inherited; no re-emission
- CROSS-REF: CLAUDE.md Convention #10 (beta-unlock `useCanAccess` returns true) anchors F1, F2 classification
- CROSS-REF: CLAUDE.md Conventions #26 + #40 (shift supersession architectural decisions) anchor F5 addendum supersession
- CROSS-REF: CLAUDE.md Convention #31 (PlannedExpansionCard pattern) anchors F8 stub legitimacy
- CROSS-REF: CLAUDE.md Convention #207 (`member_color` + `assigned_color` sync rule) anchors PRD-03 R3 scope confirmation

### Founder adjudication

- **F1 tier monetization:** Intentional beta-deferral. Nothing to sell until the app is worth subscribing to, which it isn't yet. Build the full monetization surface when founder decides the app has crossed that threshold. Forward-thinking consideration: F1, F2, and F3 together form the pre-monetization prerequisite stack.
- **F2 gate adoption:** Deferred but explicitly linked to F1 as mandatory prerequisite. The permission matrix covers Layer 1 (feature registry) and Layer 2 (tier-to-feature mapping) but NOT Layer 3 (UI gate enforcement via PermissionGate wrapping). When tier-gating flips on, unwrapped features stay unrestricted regardless of matrix rows. Beta has no visible impact; paid tier activation requires wrapping catchup pass.
- **F3 access-level picker missing:** ESCALATED to near-term build. Light/Balanced/Maximum picker is a signature onboarding moment specified in the Permission-Matrix addendum. Every founding family recruited from this point forward hits the degraded Permission-Hub-only flow. Founder prioritizes restoring the intended onboarding for founding family acquisition.
- **F4 legacy hub columns:** Documentation cleanup per PRD-14D supersession. Optional drop migration during Phase 3 triage.
- **F5 shift supersession:** Override to Unintentional-Fix-PRD. Update PRD-02 text to cite CLAUDE.md Conventions #26 and #40 explicitly. Reason: PRDs remain authoritative references; leaving them stale (even with conventions documenting the change) degrades the spec surface for future contributors and AI-assisted builds.
- **F6 theme count 46 vs 38:** Codify 46 as truth. Update PRD-03 and Convention #42 to reflect 46. Founder plans post-audit product workstream to consolidate overlapping themes and make each deliberately differentiated — tracked as future product work, not audit scope.
- **F7 shared component count:** Low-priority inventory reconciliation. Three docs disagree; one needs to become the source of truth during doc-hygiene pass.
- **F8 TV mode stub:** Honest placeholder stays. No TV mode advertising anywhere; PlannedExpansionCard is correctly framed as post-MVP per PRD-33 PWA PRD.

### Emission list

Findings to emit (8 total):
- SCOPE-2.F1 — PRD-31 monetization infrastructure unbuilt (Medium, Deferred-Document, Beta-Readiness N)
- SCOPE-2.F2 — Permission gate adoption low; pre-monetization prerequisite (Low, Unintentional-Fix-Code, Beta-Readiness N)
- SCOPE-2.F3 — Access-level picker missing for member onboarding (Medium, Unintentional-Fix-Code, Beta-Readiness N, ESCALATED for near-term build)
- SCOPE-2.F4 — Legacy Hub columns on `families` table post-PRD-14D (Low, Intentional-Document, Beta-Readiness N)
- SCOPE-2.F5 — PRD-02 shift-scheduling text superseded by access_schedules + time_sessions (Low, Unintentional-Fix-PRD, Beta-Readiness N)
- SCOPE-2.F6 — Theme count 46 vs spec 38; codify 46 (Low, Scope-Creep-Evaluate → resolved Codify, Beta-Readiness N)
- SCOPE-2.F7 — Shared component inventory mismatch across PRD-03 / Convention #44 / STUB_REGISTRY (Low, Unintentional-Fix-Code, Beta-Readiness N)
- SCOPE-2.F8 — `/hub/tv` PlannedExpansionCard stub; PRD-14E spec as MVP but feature glossary Post-MVP (Low, Deferred-Document, Beta-Readiness N)

Batch 1 hygiene note (not a finding — apply-phase includes in a hygiene sub-list):
- PRD-01 §Data Schema L424 calls the column `auth_user_id`; live schema uses `user_id`. One-line PRD-01 text amendment.

### Open flags (tech-debt register for post-walk-through triage)

1. **Permission-Matrix addendum vs CLAUDE.md sparse/dense `member_feature_toggles` semantics.** Addendum's Light/Balanced/Maximum profile seeder implies dense pre-populated rows per profile; Convention says sparse "no row = enabled." Neither is consistently implemented today (PermissionHub writes sparsely; the addendum's profile seeder doesn't exist). Not a Scope 2 finding (spec-to-spec divergence, not PRD-to-code). Defer to addendum-amendment decision OR profile-seeder-build decision during F3 build kickoff pre-build audit.
2. **Theme consolidation / differentiation product workstream (post-audit).** Founder direction 2026-04-20: reduce theme count and make each theme deliberately differentiated rather than many-that-look-similar. Future product workstream, not audit scope. Tracked here so it doesn't get lost.

## Round 2 — LiLa evidence pass (Batch 2, PRDs 05, 05C)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_2_lila.md](EVIDENCE_BATCH_2_lila.md)
- **Decision-support:** [ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md](ANALYSIS_F11_CONTEXT_ARCHITECTURE_COMPARISON.md) (commit 0fe6c3d) — comparison analysis informing F11 adjudication; founder confirmed 3-layer wraps 8 concepts (option c), `context_sources` field retired as registry documentation per founder direction.
- **Aggregate:** 12 rows across 2 PRDs (PRD-05: 8, PRD-05C: 4). 4 ambiguity flags. 5 unexpected findings. 7 worker-proposed candidates.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD05C-OPTIMIZER-UNBUILT | PRD-05C R1, R2, R3 | Deferred-Document | Medium | SCOPE-2.F9 | Confirmed — same shape as F1 tier monetization; Enhanced-tier flagship unbuilt; beta-deferred per Convention #10; misleading UI already captured in Scope 5 | N |
| PRD05-DOWNSTREAM-SUPERSESSION | PRD-05 R1, R2, R3 | Intentional-Document | Low | SCOPE-2.F10 | Confirmed as Intentional-Document — NOT mirroring F5 override. F5 was unambiguous table replacement (shift_schedules → access_schedules). F10 is spec-snapshot drift with extensibility documented at PRD-05 L398. No PRD text rewrite needed; snapshot refresh sufficient | N |
| PRD05-CONTEXT-ASSEMBLY-LAYERED | PRD-05 R6 | Intentional-Document | Medium (orchestrator override from worker's Low) | SCOPE-2.F11 | Confirmed Intentional-Document; severity override to Medium — highest-weight system in the platform (context assembly drives every LiLa surface). F11 comparison analysis (option c, complementary) confirms 3-layer wraps 8 concepts; no capability lost; 7 new capabilities added. Remediation: PRD-05 §Context Assembly prose amendment citing ai_patterns.md + Convention #105 + context_sources field retirement. No code changes. | N |
| PRD05-PRIVACY-FILTERED-FOLDER-DEFERRED | PRD-05 R4 | Deferred-Document | Low | SCOPE-2.F12 | Confirmed — privacy boundary holds via item-level is_privacy_filtered + applyPrivacyFilter(). Folder-level category UI deferred to PRD-13. Beta Y flag considered per PLAN §6 shape #2 (privacy-adjacent) and rejected — Beta Y reserved for actual exposure risk; discoverability UX gap does not meet that bar | N |
| PRD05-OPENING-MESSAGE-COVERAGE-GAP | PRD-05 R7 | Unintentional-Fix-Code | Low | SCOPE-2.F13 | Confirmed. Remediation direction per founder 2026-04-20: do NOT generate openings at runtime (latency makes UX messy across every mode). Seed rotating hard-coded greetings in migration for all 35 missing modes. Tone: invitational, not directive. Pattern to AVOID: BookShelf mode's current funneling into LiLa-selected discussion rather than letting mom lead. Openers describe mode capability (good), not pick mode topic (bad). 35 of 43 modes affected; core 4 + task_breaker variants + homeschool_time_review already have openings | N |
| PRD05-FAITH-DEAD-HELPER-DRIFT | PRD-05 R8 | Unintentional-Fix-Code | Low | SCOPE-2.F14 | Confirmed. src/lib/ai/system-prompts.ts buildFaithContext() reads a response_approach field that doesn't exist in schema. Edge Function context-assembler correctly reads individual boolean columns. Helper is likely dead code. Remediation: deletion (not schema change). Classification stays Unintentional-Fix-Code regardless of dead-code confirmation — deleting dead code is "fix code" shape | N |
| PRD05C-AI-USAGE-TRACKING-SCHEMA-DRIFT | PRD-05C R4 | Intentional-Document | Low | SCOPE-2.F15 | Confirmed — live ai_usage_tracking (531 active rows) is a generic platform-level per-AI-call tracker, which is the shipped truth. PRD-05C specified an Optimizer-specific rollup shape; generic is broader and correct. PRD-05C text amendment to cite generic schema | N |

### Load-bearing unexpected findings

1. Crisis Override text duplicated in `src/lib/ai/system-prompts.ts:14–31` and `supabase/functions/lila-chat/index.ts:39–44` with slight drift. Both functionally correct; SCOPE-8a.F4 already closed Translator exemption. Tech-debt item for Phase 3 triage: consolidate into `supabase/functions/_shared/crisis-detection.ts` (the file exists and is imported by lila-chat L9, suggesting the inline duplication is vestigial). Not a Scope 2 finding.
2. `lila_tool_permissions` wired end-to-end but 0 rows in live schema — adoption absence, not code drift. Noted for orchestrator visibility; if Scope 4 or Scope 6 finds no non-mom user has successfully launched a LiLa modal, the adoption gap is the explanation. Not a Scope 2 finding.
3. Opening messages silent-degradation schema pattern — `opening_messages JSONB` defaults to `'[]'` with no CHECK constraint enforcing `jsonb_array_length >= 2`. Consolidated into SCOPE-2.F13.
4. Higgins Multi-Person Selector Family tab per Planning-Decisions-Addendum L66–70 not found in code. Higgins is PRD-21 surface (Batch 7 territory); forward-flagged to Batch 7 PRD-21 evidence pass rather than emitted here.
5. `lila_tool_permissions` RLS policy verification — PRD-05 L718 specifies "Mom can CRUD; members read own." Deeper RLS policy trace out of Scope 2 scope; deferred to Scope 3+8b integration/RLS review.

### Cross-references

- CROSS-REF: SCOPE-8a.F3 cited by SCOPE-2.F11 analysis (PRD-20/30/41 structural absence affects safety-context assembly downstream)
- CROSS-REF: SCOPE-8a.F4 cited by Unexpected Finding #1 (Translator crisis exemption already closed)
- CROSS-REF: SCOPE-8a.F5 noted for Batch 7 Vault/BookShelf walk-through (PRD-34 BoD content-policy fail-open)
- CROSS-REF: SCOPE-5.F4 cited by SCOPE-2.F9 (Foundation-touching registry decisions; misleading-UI Vault pattern for optimizer mode_key)
- CROSS-REF: SCOPE-2.F1 (Foundation tier monetization unbuilt) — SCOPE-2.F9 shares same pattern (Enhanced-tier flagship unbuilt, beta-deferred)
- CROSS-REF: SCOPE-2.F5 (Foundation shift-supersession override) — SCOPE-2.F10 explicitly NOT mirroring the override per different drift shape

### Founder adjudication

- **F9 Optimizer unbuilt:** Intentional beta-deferral, same shape as F1. Optimizer is an Enhanced-tier flagship — 4 tables, 5 screens, 9-step optimization pipeline, prompt cards, "What did I add?" explainer, Quick/Walk-Me-Through modes, context presets, usage thermometer — none exist. Build when app is worth subscribing to, per founder's F1 direction. Misleading UI already captured in Scope 5.
- **F10 Downstream registry supersession:** PRD-05 lists 15 modes, live has 43 (downstream PRDs register modes per PRD-05 L398 extensibility mechanism). Similar pattern applies to `lila_conversations` columns added by PRD-20/21A/30 and `member_self_insights` superseded by PRD-07 `self_knowledge`. Not mirroring F5 override — F10 is snapshot-drift with extensibility explicitly documented, not archaeology pointing at replaced tables. PRD-05 schema section gets a "current state at time of writing, extensible via X/Y/Z" disclaimer rather than a full rewrite.
- **F11 Context assembly architecture drift:** Founder-directed comparison analysis (commit 0fe6c3d) confirmed option (c) — complementary, not replacement. 3-layer framework wraps 8 PRD-05 concepts. No capability lost. 7 new capabilities added (name detection, topic matching, Layer 3 semantic RPCs, P9 per-turn refresh, per-tool overrides, explainability metadata, baseline fallback). `context_sources` field retained as registry documentation per founder direction — the code-hardcoded per-tool steering IS superior because modes diverged beyond what a single-field list can express. Server-side per-tool-per-person enforcement (Q2 from analysis §7) deferred to Scope 3+8b RLS/seams review per founder agreement. Severity override to Medium: highest-weight system; future AI-assisted LiLa builds reading PRD-05 alone would implement against the wrong architecture. Remediation: PRD-05 §Context Assembly prose amendment describing wrapping relationship, citing ai_patterns.md §Context Assembly Pipeline Layered Architecture + CLAUDE.md Convention #105, plus one sentence on `context_sources` retirement as registry documentation only.
- **F12 Privacy Filtered folder:** Item-level privacy enforcement is wired and correct. Folder-level UX discoverability is missing but not a privacy leak. Beta Y flag evaluated and rejected — `applyPrivacyFilter()` already enforces the hard boundary at the Edge Function level. Folder UI is PRD-13 Archives territory and surfaces there in natural build sequence.
- **F13 Opening message gap:** 35 of 43 modes launch without warm openings. Remediation direction captured per founder 2026-04-20: runtime generation rejected (latency makes UX messy); rotating hard-coded openings seeded via migration, invitational tone, not directive. BookShelf mode's current funneling (LiLa drives discussion vs. letting mom lead) flagged forward to Batch 7 PRD-23 evidence pass as a separate defect — that is mode-level system prompt behavior, not an opening message issue.
- **F14 Faith helper dead code:** `buildFaithContext()` in `src/lib/ai/system-prompts.ts` reads a TEXT field that doesn't exist in schema. Edge Function context-assembler correctly reads individual boolean columns (Convention #78). Helper is almost certainly dead code. Remediation: deletion.
- **F15 AI usage tracking schema drift:** PRD-05C specified an Optimizer-specific rollup schema; live table is generic platform-wide per-AI-call tracker with 531 active rows. Generic schema is the shipped truth and is broader/better than PRD-05C's original design. PRD-05C text amendment to cite the generic schema.

### Emission list

Findings to emit (7 total):
- SCOPE-2.F9  — PRD-05C Optimizer infrastructure unbuilt (Medium, Deferred-Document, Beta N)
- SCOPE-2.F10 — PRD-05 downstream registry supersession (Low, Intentional-Document, Beta N)
- SCOPE-2.F11 — PRD-05 context assembly architecture wrapping drift (Medium, Intentional-Document, Beta N; remediation cites ai_patterns.md + Convention #105 + context_sources field retirement)
- SCOPE-2.F12 — PRD-05 Privacy Filtered folder category deferred to PRD-13 (Low, Deferred-Document, Beta N)
- SCOPE-2.F13 — PRD-05 opening messages missing for 35 of 43 modes (Low, Unintentional-Fix-Code, Beta N; remediation: seed rotating hard-coded invitational openings via migration)
- SCOPE-2.F14 — PRD-05 buildFaithContext() reads nonexistent schema field — likely dead code (Low, Unintentional-Fix-Code, Beta N; remediation: deletion)
- SCOPE-2.F15 — PRD-05C ai_usage_tracking schema drift from spec (Low, Intentional-Document, Beta N)

No Batch 2 hygiene notes. No Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

### Open flags (tech-debt + cross-scope register)

1. **Crisis Override text duplication** — `src/lib/ai/system-prompts.ts:14–31` vs `supabase/functions/lila-chat/index.ts:39–44`. Consolidate into `supabase/functions/_shared/crisis-detection.ts` (already exists, already imported by lila-chat L9). Phase 3 tech-debt triage.
2. **Higgins Multi-Person Selector Family tab** (Planning-Decisions-Addendum L66–70) — forward to Batch 7 PRD-21 evidence pass for verification.
3. **`lila_tool_permissions` RLS policy verification** — PRD-05 L718 spec vs live policy not verified during Batch 2. Defer to Scope 3+8b RLS/seams review.
4. **Server-side per-tool-per-person context-sharing enforcement in `assembleContext()`** — F11 analysis §7 Q2. Current UI-layer enforcement works for beta but server-side is the defense-in-depth posture. Defer to Scope 3+8b (likely SCOPE-8b finding with Beta Readiness Y when surfaced).
5. **BookShelf Discussion mode funneling behavior** — LiLa drives discussion topic vs. letting mom lead. Mode-level system prompt defect (not opening message issue). Forward to Batch 7 PRD-23 evidence pass.
6. **`lila_tool_permissions` 0-row adoption gap** — wired end-to-end but no production use. If Scope 4 or Scope 6 finds no non-mom user has launched a LiLa modal, this is the explanation. Logged for visibility; not a finding.

## Round 3 — Personal Growth evidence pass (Batch 3, PRDs 06, 07, 08, 11, 11B, 13)

*(entry filled during walk-through)*

## Round 4 — Tasks/Studio evidence pass (Batch 4, PRDs 09A, 09B, 17, 17B)

*(entry filled during walk-through)*

## Round 5 — Dashboards/Calendar evidence pass (Batch 5, PRDs 10, 14, 14B, 14C, 14D, 14E, 25, 26)

*(entry filled during walk-through)*

## Round 6 — Communication evidence pass (Batch 6, PRDs 15, 16)

*(entry filled during walk-through)*

## Round 7 — Vault/BookShelf evidence pass (Batch 7, PRDs 21, 21A, 21B, 21C, 22, 23, 34)

*(entry filled during walk-through)*

## Round 8 — Gamification evidence pass (Batch 8, PRDs 24, 24A, 24B)

*(entry filled during walk-through)*

## Round 9 — Compliance evidence pass (Batch 9, PRDs 27, 28, 29, 30, 35, 36, 37, 38)

*(entry filled during walk-through)*

## Synthesis pass

*(optional — if cross-batch patterns emerge that warrant a consolidation-level finding, captured here. Modeled on [WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md) aggregate findings section.)*
