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

## Round 3 — Personal Growth evidence pass (Batch 3, PRDs 06, 07, 08, 11, 11B, 13, 18, 19)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_3_personal-growth.md](EVIDENCE_BATCH_3_personal-growth.md)
- **Aggregate:** 52 rows across 8 PRDs (PRD-06: 6, PRD-07: 5, PRD-08: 7, PRD-11: 7, PRD-11B: 5, PRD-13: 7, PRD-18: 8, PRD-19: 7). 9 ambiguity flags. 5 unexpected findings. 8 worker-proposed candidates.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD06-PARTNER-SHARE-UI | PRD-06 R1, R2 | Unintentional-Fix-Code | Low | SCOPE-2.F16 | Confirmed — column wired on `guiding_stars` + `best_intentions`; per-entry UI toggle missing. Person-level backup via `archive_member_settings` exists. PATTERN-FLAG-FOR-SCOPE-3 preserved (partner-sharing pattern recurs across PRD-06, PRD-07, PRD-19) | N |
| PRD08-MESSAGING-SUPERSESSION | PRD-08 R2 | Intentional-Document | Low | SCOPE-2.F17 | Confirmed — emit as finding (NOT downgrade to hygiene note). Drift is structural (2 tables vs 3-table PRD-15 architecture), warrants proper audit record. Founder flagged separate concern: "messaging not working exactly as envisioned, some is working" — that product-level concern is carried forward to Batch 6 Communication walk-through for PRD-15 behavior-vs-intent review; outside Scope 2 F17 scope which is doc-drift only | N |
| PRD08-JOURNAL-VISIBILITY-UI | PRD-08 R3 | Unintentional-Fix-Code | Low | SCOPE-2.F18 | Confirmed — `journal_visibility_settings` table wired (6 columns, 0 rows); mom-configurable per-child-per-entry-type visibility UI missing. RLS default protects teens at baseline. Fix when mom-configurable visibility becomes roadmap priority | N |
| PRD11B-FAMILY-CELEBRATION-UNBUILT | PRD-11B R1–R5 | Unintentional-Fix-Code | Medium | SCOPE-2.F19 | Confirmed Medium — matches F1/F9 tier-monetization-unbuilt pattern. Founder direction 2026-04-20: "sooner than later, but not urgent" — added as product-timing note to finding remediation section. STUB_REGISTRY.md line 120 falsely claims "Wired Phase 12" — flagged for Phase 3 doc-hygiene note (Scope 5 closed, not reopening) | N |
| PRD18-MOOD-TRIAGE-SUPERSESSION | PRD-18 R2 | Intentional-Document | Low | SCOPE-2.F20 | Confirmed — Enhancement Addendum §Evening Rhythm Revised Section Sequence + Convention 25 ("Mood tracking is NOT a default rhythm section") superseded base PRD-18. Column preserved on `rhythm_completions` for future use | N |
| PRD18-TEEN-EXPERIENCE-SUPERSESSION | PRD-18 R4 | Intentional-Document | Low | SCOPE-2.F21 | Confirmed Intentional-Document — NOT mirroring F5 override. Enhancement Addendum §Enhancement 7 + Conventions #189–197 captures teen tailored template fully. Base PRD-18 gets one-line pointer ("see Enhancement Addendum §Enhancement 7") not a rewrite. Different shape from F5 (F5 was archaeological table definitions; F21 is properly addendum-captured) | N |
| PRD19-INFRASTRUCTURE-UNBUILT | PRD-19 R1–R4 | Unintentional-Fix-Code | Medium | SCOPE-2.F22 | Confirmed Medium — 4 of 6 PRD-19 tables missing (`member_documents`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports`). Founder direction 2026-04-20: near-term roadmap (2–3 month horizon), build posture "wait until app has content to load onto" but ensure connection readiness. Two critical coupling notes: (a) F23 column drift must land BEFORE or CONCURRENT WITH F22 feature build — otherwise reports pipeline gets built against schema missing addendum-specified columns; (b) PRD-28B infrastructure prerequisite decision (merge into PRD-19 OR build PRD-28B separately) must be made BEFORE F22 build — flagged for Batch 9 walk-through | N |
| PRD19-ARCHIVE-COLUMN-DRIFT | PRD-19 R5, R6 | Unintentional-Fix-Code | Low | SCOPE-2.F23 | Confirmed — PRD-19 Cross-PRD Impact Addendum §PRD-13 specifies 5 column additions on `archive_context_items` + 3 on `archive_member_settings`; none migrated. `display_name_aliases` provides partial alias coverage. Cross-ref coupling to F22: F23 migration must land before/with F22 feature build per founder's 2–3 month horizon direction | N |

### Load-bearing unexpected findings

1. STUB_REGISTRY.md:120 falsely claims Family Celebration "Wired Phase 12" — actual state is entirely unbuilt (0 tables, 0 components, 0 feature keys). Meta-finding: stub registry integrity issue surfaced by Scope 2 after Scope 5 walk-through missed it. Consolidated into SCOPE-2.F19. Phase 3 doc-hygiene triage addresses registry correction alongside feature build.
2. Five `archive_context_items` column additions specified in PRD-19 addendum absent from live schema. Silent addendum drift — addendum written 2026-03-13; no STUB_REGISTRY entry captures the gap. Consolidated into SCOPE-2.F23.
3. PRD-19 reports pipeline completely unbuilt — 4 of 6 PRD-19 tables missing. Connects to closed SCOPE-5.F4 Finding A (PRD-28B absence) for combined compliance-reporting surface. Consolidated into SCOPE-2.F22. Founder flagged 2–3 month timing horizon.
4. `is_shared_with_partner` column-wired-UI-absent pattern across 3 context tables (`guiding_stars`, `best_intentions`, potentially `self_knowledge`) — same shape as SCOPE-2.F2 gate-adoption pattern. Consolidated into SCOPE-2.F16. PATTERN-FLAG-FOR-SCOPE-3 preserved.
5. MemberArchiveDetail.tsx "Looks-Fine-Failure" — page renders aggregation but misses PRD-19 layer (private notes, relationship notes, aliases, How-to-Reach-Me) because backing columns absent (rolls into F23). Noted, not emitted separately.

### Cross-references

- CROSS-REF: SCOPE-5.F4 Finding B cited by SCOPE-2.F22 (AIR unbuilt — PRD-11 + PRD-06 auto-victory routing to PRD-19 aggregation pipeline)
- CROSS-REF: SCOPE-5.F4 Finding A cited by SCOPE-2.F22 (PRD-28B absence — compliance reporting surface overlap with PRD-19)
- CROSS-REF: SCOPE-5.F4 Finding J noted (PRD-12B unbuilt — PRD-13 Family Vision Statement aggregation dependency; no Scope 2 re-emission)
- CROSS-REF: SCOPE-8a.F6 cited by PRD-11 R2 evidence (DailyCelebration HITM bypass already closed)
- CROSS-REF: Convention #92 (ThoughtSift Mediator supersedes PRD-19 relationship_mediation) confirmed in PRD-19 R7 evidence
- CROSS-REF: Enhancement Addendum §Enhancement 7 + Conventions #189–197 anchor F21
- CROSS-REF: Enhancement Addendum §Evening Rhythm Revised Section Sequence + Convention 25 anchor F20
- PATTERN-FLAG-FOR-SCOPE-3: partner-sharing pattern (F16) recurs across PRD-06, PRD-07, PRD-19

### Founder adjudication

- **F16 Partner-share UI missing:** Per-entry "Share with partner" toggle specified on Guiding Stars Screen 1 + Best Intentions Screen 2; backing columns wired on both tables but UI never surfaced. Person-level backup via `archive_member_settings` toggle exists. Low priority — fix when per-entry granular sharing becomes roadmap priority.
- **F17 PRD-08 messaging supersession:** PRD-08 text describes 2-table messaging architecture; PRD-15 ships 3-table spaces/threads/messages model. Update PRD-08 text. Founder flagged separate product concern: "not working exactly as I envisioned, some is working" — distinct from F17 doc-drift scope; carried forward to Batch 6 Communication walk-through for PRD-15 behavior-vs-intent review.
- **F18 Per-child journal visibility UI:** `journal_visibility_settings` table wired with 6 columns, 0 rows. Mom-configurable per-child-per-entry-type visibility UI missing. RLS default protects at baseline. Yes, eventually fix when mom-configurable visibility becomes roadmap priority.
- **F19 Family Celebration unbuilt:** Entire surface absent (`family_victory_celebrations` table missing, no component, no feature keys, no journal-entry-type support, no prompt modes). STUB_REGISTRY.md line 120 falsely claims "Wired Phase 12" — meta-finding flagged for Phase 3 doc-hygiene (Scope 5 closed). Founder direction: "sooner than later, but not urgent" — baked into finding as product-timing note on remediation queue.
- **F20 PRD-18 mood triage supersession:** Base PRD had mood_triage ON in default evening rhythm; Enhancement Addendum removed it (Convention 25 "Mood tracking is NOT a default rhythm section"). Column preserved for future. Clean supersession, update PRD-18 base to cite addendum.
- **F21 PRD-18 teen rhythm supersession:** Base PRD described teens as "reduced sections"; Enhancement Addendum §Enhancement 7 + Conventions #189–197 capture full tailored template (7 morning + 8 evening, 15 teen-specific questions, teen MindSweep-Lite dispositions including `talk_to_someone` as PRIVATE journal write). Intentional-Document confirmed — NOT mirroring F5 override. F5 was archaeological tables; F21 is properly-addendum-captured supersession. Base PRD-18 gets pointer amendment, not rewrite.
- **F22 PRD-19 reports + aggregation unbuilt:** 4 of 6 PRD-19 tables missing (`member_documents`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports`). Founder direction 2026-04-20: near-term roadmap (next 2–3 months), build posture "wait until app has content to load onto" but ensure forward-thinking integration readiness. Two critical coupling notes baked into finding: (a) F23 archive column drift MUST land before or concurrent with F22 feature build (reports pipeline else built against wrong schema); (b) PRD-28B infrastructure prerequisite decision (merge PRD-28B into PRD-19 OR build PRD-28B separately) must be made BEFORE F22 build kicks off — flagged for Batch 9 walk-through.
- **F23 PRD-19 archive column drift:** 5 columns on `archive_context_items` + 3 on `archive_member_settings` specified in PRD-19 Cross-PRD Impact Addendum §PRD-13; none migrated. Dual-context sharing, drag-reorder priority, alias system for external LLM privacy all unbacked. `display_name_aliases` provides partial alias coverage. Cross-ref F22 coupling: migration must land before or with F22 build.

### Emission list

Findings to emit (8 total):
- SCOPE-2.F16 — PRD-06 partner-share UI missing (Low, Unintentional-Fix-Code, Beta N)
- SCOPE-2.F17 — PRD-08 messaging supersession (Low, Intentional-Document, Beta N; Batch 6 carry-forward for founder product concern)
- SCOPE-2.F18 — PRD-08 per-child journal visibility UI missing (Low, Unintentional-Fix-Code, Beta N)
- SCOPE-2.F19 — PRD-11B Family Celebration unbuilt (Medium, Unintentional-Fix-Code, Beta N; founder product-timing note "sooner than later, not urgent"; STUB_REGISTRY line 120 correction)
- SCOPE-2.F20 — PRD-18 mood triage supersession (Low, Intentional-Document, Beta N)
- SCOPE-2.F21 — PRD-18 teen rhythm supersession (Low, Intentional-Document, Beta N; base PRD pointer amendment only)
- SCOPE-2.F22 — PRD-19 reports + aggregation pipeline unbuilt (Medium, Unintentional-Fix-Code, Beta N; 2–3 month roadmap horizon; F23 + PRD-28B prerequisite coupling)
- SCOPE-2.F23 — PRD-19 archive column drift (Low, Unintentional-Fix-Code, Beta N; must land before/with F22)

No Batch 3 hygiene notes. No new Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

### Open flags (tech-debt + cross-scope register)

1. **STUB_REGISTRY.md line 120 false-Wired claim** (PRD-11B Family Celebration) — registry claim "Wired Phase 12" predates any build work. Scope 5 walk-through missed this. Phase 3 doc-hygiene triage correction alongside F19 feature build. Not reopening Scope 5.
2. **PRD-08 messaging behavior vs founder intent** — separate from F17 doc-drift. Carried forward to Batch 6 Communication walk-through for PRD-15 behavior-vs-intent review per founder 2026-04-20 signal.
3. **F22 / F23 coupling** — F23 archive column migration must land before or concurrent with F22 feature build. Not independently schedulable.
4. **PRD-28B prerequisite decision for F22** — before PRD-19 reports feature build kicks off, founder must decide whether to merge PRD-28B infrastructure into PRD-19 OR build PRD-28B separately. Flagged for Batch 9 walk-through when PRD-37-PRD-28B shared addendum surfaces.
5. **PATTERN-FLAG-FOR-SCOPE-3 — partner-sharing pattern** recurs across PRD-06, PRD-07, PRD-19 (F16 + F23 cross-PRD seam); Scope 3+8b evidence pass for PRD-19 cross-PRD addendum should examine as an integration pattern rather than single-PRD drift.
6. **MemberArchiveDetail.tsx Looks-Fine-Failure** — page renders aggregation layer but misses PRD-19 layer (private notes, relationship notes, aliases, How-to-Reach-Me). Rolls into F22 + F23 build; noted for visibility.

## Round 4 — Tasks/Studio evidence pass (Batch 4, PRDs 09A, 09B, 17, 17B)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_4_tasks-studio.md](EVIDENCE_BATCH_4_tasks-studio.md)
- **Aggregate:** 28 rows across 4 PRDs (PRD-09A: 10, PRD-09B: 7, PRD-17: 5, PRD-17B: 6). 6 ambiguity flags. 5 unexpected findings. 6 worker-proposed candidates.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD09A-TASK-QUEUE-LEGACY-NAMING | PRD-09A R1, R9; PRD-09B R7 | Unintentional-Fix-PRD | Low | SCOPE-2.F24 | Confirmed — PRD-09A text uses task_queue 10 times across Screens, Stubs, CLAUDE.md Additions, Tier Gating; PRD-17 §Schema Reconciliation Note mandated rename that was never applied. Feature key tasks_queue also obsolete (not in registry; code ships canonical keys per PRD-17 §Tier Gating). Remediation: PRD-09A text update to use studio_queue consistently | N |
| PRD09A-PRIORITIZATION-VIEWS-PARTIAL | PRD-09A R2 | Deferred-Document | Low | SCOPE-2.F25 | Confirmed — PRD text internally inconsistent (13 vs 14 views); code ships 12 options with 7 real view components + 5 PlannedViewStub placeholders + ABCDE explicitly removed per founder decision 2026-04-13. Keep as single finding; ABCDE-removal sub-note embedded in primary Deferred-Document classification | N |
| PRD09A-HABIT-TYPE-UNWIRED | PRD-09A R3 | Unintentional-Fix-Code | Low | SCOPE-2.F26 | Confirmed — Habit task_type spec'd but no consumer. Founder product direction 2026-04-20 CLARIFIES: Habit is a meta-type that branches into 3 rendering modes based on user tracking preference — (a) tally-type (wire to PRD-10 widget), (b) calendar-day-mark-type (wire to PRD-10 widget), (c) task-at-interval-type (wire to existing routine/recurrence infrastructure). Habit is a legitimate concept (not redundant with routines/trackers) — it mixes task+best-intention semantics and lets the user pick how it gets surfaced. Remediation: build Habit creation flow with 3 rendering-mode pickers, each creating the appropriate downstream artifact (widget row or scheduled task). Enum + PRD text stay | N |
| PRD09B-LIST-TYPE-CATALOG-EXPANSION | PRD-09B R1 | Intentional-Document (orchestrator override from worker's Scope-Creep-Evaluate) | Low | SCOPE-2.F27 | Confirmed — Scope-Creep-Evaluate resolved to codify per founder direction 2026-04-20. All 5 extra list types have legitimate provenance: backburner + ideas (CLAUDE.md Convention #21 auto-system lists), prayer (specs/studio-seed-templates.md §List Formats), sequential (Studio Intelligence addendum Phase 1C), reference (founder direction: static reference materials like Nicholeen Peck parenting-response skills cards — content to refer to, not interact with). Remediation: update PRD-09B + specs/studio-seed-templates.md to catalog all 5 extras with their documented use cases. Doc-only pass | N |
| PRD17-NUMERIC-INDICATOR-PREF | PRD-17 R4 | Deferred-Document | Low | SCOPE-2.F28 | Confirmed — breathing glow (Discreet default) is live; Numeric mode has no opt-in path. PRD-17 §L570 explicitly defers to Settings PRD (future); not currently in STUB_REGISTRY. Tied to Settings PRD (PRD-22) timeline — surfaces naturally when Settings build kicks off | N |
| PRD17B-AUTOSEED-MEMBER-SETTINGS | PRD-17B R2 | Unintentional-Fix-Code | Medium | SCOPE-2.F29 | Confirmed Medium — addendum contract unmet (18 family_members, 0 rows in mindsweep_settings + mindsweep_allowed_senders). Founder context 2026-04-20: the 18 family_members predate MindSweep build; even with seed code wired, no backfill would populate pre-existing families. MindSweep is in "halfway state especially email-related" (see STUB_REGISTRY L167 email forwarding Partially Wired DNS blocker). Remediation: group with broader MindSweep halfway-state completion bucket — auto-seed implementation AND backfill for pre-existing families land together when MindSweep build is finished. Classification stays Unintentional-Fix-Code (addendum contract is the target); severity Medium (addendum promise broken, affects every family's MindSweep first-use experience) | N |

### Load-bearing unexpected findings

1. `task_queue` nomenclature staleness across PRD-09A despite PRD-17's explicit reconciliation mandate. 10 occurrences remain. Consolidated into SCOPE-2.F24. PATTERN-FLAG-FOR-SCOPE-3 preserved (cross-PRD staleness surfaces in both PRD-09A and PRD-09B).
2. 14-view prioritization framework ships 7 real + 5 PlannedViewStub + ABCDE removed; PRD text internally inconsistent on count. Consolidated into SCOPE-2.F25.
3. `task_type = 'habit'` enum value with zero consumer and no STUB_REGISTRY entry. Consolidated into SCOPE-2.F26. Founder-clarified Habit semantics (meta-type branching to 3 rendering modes) reshape remediation.
4. MindSweep `mindsweep_settings` auto-seed on family creation not observed in live data — 18 family_members, 0 rows in both `mindsweep_settings` and `mindsweep_allowed_senders`. Founder context: family predates MindSweep; no backfill for pre-existing families. Consolidated into SCOPE-2.F29.
5. `reference` as 12th list_type with no spec provenance — founder-confirmed use case (static reference materials, Nicholeen Peck skills example). Consolidated into SCOPE-2.F27 as codified.

### Cross-references

- CROSS-REF: SCOPE-5.F4 cited by PRD-09A R4 (View As unmark cascade + Convention #206 task unmark cascade — already closed; not re-emitted)
- CROSS-REF: SCOPE-5.F{B} cited by PRD-09A R5 (AIR auto-victory from task completions — Scope 5 closed; not re-emitted)
- CROSS-REF: SCOPE-5.F4 cited by PRD-09A R6 (sequential_collections Studio Intelligence Phase 1 fix — Phase 1 closed; zero-row table state is legitimate empty-state, not re-emitted)
- CROSS-REF: SCOPE-2.F5 cited by PRD-09A R8 (`activity_log_entries.shift_session_id` FK to superseded `shift_sessions` table — rolls into Foundation F5 shift-supersession finding scope)
- CROSS-REF: SCOPE-8a.F7 cited by PRD-17B R4 (MindSweep autopilot `source='manual'` labeling — already closed; not re-emitted)
- CROSS-REF: STUB_REGISTRY L167 (MindSweep email forwarding Partially Wired DNS blocker) grouped with SCOPE-2.F29 as MindSweep halfway-state completion bucket
- PATTERN-FLAG-FOR-SCOPE-3: `task_queue` → `studio_queue` naming staleness (F24)
- PATTERN-FLAG-FOR-SCOPE-4: MindSweep embedding-first classification (P2 pattern) — PRD-17B R6 wired by inspection; Scope 4 pattern audit will verify the ~90% LLM-call reduction claim against production `ai_usage_tracking` data

### Founder adjudication

- **F24 PRD-09A task_queue legacy naming:** PRD-17 §Schema Reconciliation Note explicitly mandated the rename to `studio_queue` as a pre-build audit amendment; the mandate was applied in code (entire codebase uses `studio_queue` consistently) but never applied to PRD-09A text. 10 occurrences remain across Screens, Stubs, CLAUDE.md Additions, Tier Gating. PRD-09B correctly cites the rename; PRD-09A itself stayed stale. Remediation: PRD-09A text pass to replace `task_queue` → `studio_queue`, `tasks_queue` feature key → canonical PRD-17 keys (`studio_queue`, `queue_modal`, `queue_quick_mode`, `routing_strip`, `queue_batch_processing`). Pure doc update.

- **F25 Prioritization views partial:** PRD-09A internally inconsistent (13 vs 14 views); code ships 12 options with 7 real view components (Simple List, Now/Next/Optional, By Category, Eisenhower, Eat the Frog, 1-3-5, Kanban) + 5 PlannedViewStub placeholders (Big Rocks, Ivy Lee, MoSCoW, Impact/Effort, By Member) + ABCDE explicitly removed per founder decision 2026-04-13. Keep as single finding rather than splitting. Honest stub pattern is graceful degradation.

- **F26 Habit task type unwired:** Founder direction 2026-04-20 clarified Habit is a meta-type that branches into 3 rendering modes based on user tracking preference — (a) tally type (PRD-10 widget), (b) calendar-day-mark type (PRD-10 widget), (c) task-at-interval type (existing routine/recurrence infrastructure). Not redundant with routines or trackers alone — mixes task+best-intention semantics and lets user pick how the habit surfaces. Remediation: build Habit creation flow with 3 rendering-mode pickers, each creating appropriate downstream artifact. Enum value + PRD-09A §Screen 3 text stay; code gets the build work.

- **F27 List type catalog expansion:** Scope-Creep-Evaluate resolved to codify per founder direction. All 5 extras legitimate: `backburner` + `ideas` (Convention #21), `prayer` (Studio seed spec), `sequential` (Studio Intelligence addendum Phase 1C), `reference` (founder-described use case — static reference materials, Nicholeen Peck parenting-response skills cards, content to refer to not interact with). Remediation: update PRD-09B catalog + specs/studio-seed-templates.md to document all 5 with their use cases. One doc pass.

- **F28 Numeric indicator preference:** Breathing glow (Discreet default) works; Numeric mode has no opt-in UI. PRD-17 §L570 explicitly defers to Settings PRD. Tied to Settings PRD (PRD-22) timeline. Not urgent — surfaces naturally when Settings build kicks off.

- **F29 MindSweep auto-seed contract unmet:** Addendum promise (auto-create `mindsweep_settings` + populate `mindsweep_allowed_senders` during family setup) unmet — 18 family_members, 0 rows in both tables. Founder context 2026-04-20: family predates MindSweep build; even wired seed code would only populate NEW families after seed-code-land, not backfill. Combined with "MindSweep halfway state especially email-related" signal. Remediation groups with broader MindSweep completion bucket (auto-seed + backfill + email-forwarding DNS resolution per STUB_REGISTRY L167). Medium severity — addendum contract broken, affects every family's MindSweep first-use experience.

### Emission list

Findings to emit (6 total):
- SCOPE-2.F24 — PRD-09A task_queue legacy naming (Low, Unintentional-Fix-PRD, Beta N)
- SCOPE-2.F25 — PRD-09A prioritization views partial with ABCDE removed (Low, Deferred-Document, Beta N)
- SCOPE-2.F26 — PRD-09A Habit task type unwired — 3-mode branching remediation (Low, Unintentional-Fix-Code, Beta N)
- SCOPE-2.F27 — PRD-09B list type catalog codification (Low, Intentional-Document, Beta N; orchestrator override from Scope-Creep-Evaluate per founder direction to codify 5 extras)
- SCOPE-2.F28 — PRD-17 numeric indicator preference deferred to Settings PRD (Low, Deferred-Document, Beta N)
- SCOPE-2.F29 — PRD-17B MindSweep auto-seed contract unmet — group with halfway-state completion bucket (Medium, Unintentional-Fix-Code, Beta N)

No Batch 4 hygiene notes. No new Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

### Open flags (tech-debt + cross-scope register)

1. **PRD-09A task_queue nomenclature staleness** pattern-flagged for Scope 3+8b — cross-PRD staleness between PRD-09A and PRD-09B indicates a broader "upstream PRD text not updated after downstream reconciliation mandate" pattern that may recur. Flagged for Scope 3+8b integration-traversal pass to evaluate whether the pattern warrants a cross-PRD finding beyond F24's per-PRD scope.
2. **MindSweep halfway-state completion bucket** — F29 auto-seed groups with STUB_REGISTRY L167 (email forwarding DNS blocker). When MindSweep completion pass lands, F29 + email forwarding + any other halfway-state items close together. Single build scope.
3. **PRD-09A R2 inconsistency** (13 vs 14 views count) — batch-hygiene item embedded in F25 rather than separate hygiene note. PRD-09A text update pass (same update that fixes F24 task_queue naming) should also reconcile the count.
4. **MindSweep embedding-first classification P2 pattern** — PATTERN-FLAG-FOR-SCOPE-4 preserved. Scope 4 P2 pattern audit will verify the ~90% LLM-call reduction claim against production `ai_usage_tracking` data when that scope runs.

## Round 5 — Dashboards/Calendar evidence pass (Batch 5, PRDs 10, 14, 14B, 14C, 14D, 14E, 25, 26)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_5_dashboards-calendar.md](EVIDENCE_BATCH_5_dashboards-calendar.md)
- **Aggregate:** 46 rows across 8 PRDs (PRD-10: 7, PRD-14: 5, PRD-14B: 11, PRD-14C: 4, PRD-14D: 6, PRD-14E: 2, PRD-25: 7, PRD-26: 4). 10 ambiguity flags. 5 unexpected findings. 9 worker-proposed candidates + 1 Foundation F8 cross-ref (not re-emitted).

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD10-TRACKER-CATALOG-EXPANSION | PRD-10 R1 | Unintentional-Fix-PRD | Low | SCOPE-2.F30 | Confirmed — internal PRD-10 contradiction (Overview L18 "19" vs enum L624-629 lists 17) + 4 post-PRD extras (`randomizer_spinner`, `privilege_status`, `log_learning`, `best_intention`) lack PRD coverage. Remediation per F27 pattern: codify 17 canonical + 4 extras with use-case notes in one PRD-10 doc pass. Founder confirmed all 4 extras legitimate: randomizer_spinner = widget version of randomizer list type; privilege_status = permission/access tracking; log_learning = homeschool time logging (Build K); best_intention = Best Intentions counter/tracker | N |
| PRD10-WIDGET-TEMPLATES-VS-STARTER-CONFIGS | PRD-10 R2 | Intentional-Document | Low | SCOPE-2.F31 | Confirmed — architectural split (`widget_templates` 0 rows vs `widget_starter_configs` 39 rows) already documented as SCOPE-5.F2 closed finding. PRD-10 §Data Schema L596-611 text update to cite `widget_starter_configs` as shipped truth. Doc-only pass | N |
| PRD14-COL-SPAN-UNBUILT | PRD-14 R1 | Unintentional-Fix-Code | Low | SCOPE-2.F32 | Confirmed — zero code adoption despite PRD-14 Decision #14 + Cross-PRD addendum L28-33 reinforcement. Founder direction 2026-04-20: "needs to be fixed eventually" — baked as "will-be-built" flag rather than indefinite polish. Not currently stub-registered; remediation notes include "consider adding to STUB_REGISTRY so future contributors see it as a tracked unbuilt feature." No code path consumes `col_span`; sections render full-width as fallback | N |
| PRD14B-SCHEMA-REFACTOR-DOCS | PRD-14B R1, R2, R3 | Intentional-Document | Low | SCOPE-2.F33 | Confirmed — 3 schema drifts documented by CLAUDE.md Conventions #110 (category_id UUID FK, not text), #114 (auto_approve_members UUID[], not JSONB), #115 (week_start_day INTEGER column added). Code is truth; PRD-14B §Data Schema text update. SUPERSEDES citations present in worker pass | N |
| PRD14B-AI-INTAKE-UNBUILT | PRD-14B R6, R7, R8 | Deferred-Document | Medium | SCOPE-2.F34 | Confirmed Medium with founder product-timing note 2026-04-20: "this needs to be working" — near-term build priority similar to F22 homeschool reporting. `calendar-parse-event` Edge Function absent from `supabase/functions/` (45 Edge Functions verified); Image-to-Event Screen 6 vision-model flow unbuilt; "Help Me Plan This" LiLa Guided Intake + `calendar_event_create` guided mode not seeded. 3 MVP checklist items missing (PRD-14B L881-884). PATTERN-FLAG-FOR-SCOPE-4 preserved (AI cost analysis when built) | N |
| PRD14C-POLISH-DEFERRED | PRD-14C R2, R3, R4 | Deferred-Document | Low | SCOPE-2.F35 | Confirmed — 4 Family Overview polish items stub-registered Post-MVP (column drag-to-reorder, section drag-to-reorder, per-column override via long-press, calendar week/month toggle). Core FamilyOverview.tsx surface ships; interaction polish deferred per STUB_REGISTRY:315-318 | N |
| PRD25-LILA-TOOLS-UNBUILT | PRD-25 R2 | Deferred-Document | Medium (orchestrator severity escalation from worker's Low) | SCOPE-2.F36 | Escalated to Medium per founder direction 2026-04-20: "my son has requested and asked how to use these" — active user demand elevates seeded-but-unwired `guided_homework_help` + `guided_communication_coach` from academic concern to real UX gap. Migration 00000000000013 seeds both modes into `lila_guided_modes` (43 rows total) with complete system_prompt_key + opening_messages. Zero invoking UI — grep surfaces only type declaration. STUB_REGISTRY:333-334 marks both ⏳ Unwired (MVP). Registry is ready; consuming Guided shell LiLa modal surface missing | N |
| PRD25-GRADUATION-UNBUILT | PRD-25 R4, PRD-26 R4 | Deferred-Document | Low | SCOPE-2.F37 | Confirmed — Post-MVP per STUB_REGISTRY:337 ("Data flag only"). Both graduation flows (Guided→Independent from PRD-25 Screen 7, Play→Guided from PRD-26 Screen 4) share the same shape: celebration overlay + interactive tutorial + welcome card + `graduation_tutorial_completed` preference. Only the preference key ships; UX flows absent. Consolidated across both PRDs into one finding | N |
| PRD26-REVEAL-ARCHITECTURE-SUPERSESSION | PRD-26 R1, R2 | Intentional-Document | Low | SCOPE-2.F38 | Confirmed — Build M Convention #215 (Build M completed-build record 2026-04-11) superseded PRD-26's 5-style per-tile model (`spinner`/`mystery_doors`/`card_flip`/`scratch_off`/`gift_box` stored in `dashboard_configs.preferences.reveal_tiles[]`) with 2-style per-segment model (`show_upfront`/`mystery_tap` on `task_segments.randomizer_reveal_style`). PRD-26 §Screen 2 + Data Schema L329-398 text update. PRD-26 `reveal_tiles` JSONB preferences architecture never shipped — `play_reveal_tiles` ships as a PlannedExpansionCard stub | N |

### Load-bearing unexpected findings

1. PRD-26 reveal-style vocabulary entirely rewritten during Build M without back-propagation to PRD-26 text — 5 styles → 2 styles, per-tile → per-segment. Documented as intentional via Convention #215 and Build M completed-build record. Consolidated into SCOPE-2.F38.
2. PRD-25 two LiLa Tool Modals are seeded-but-unwired — `guided_homework_help` + `guided_communication_coach` seeded in migration 00000000000013, zero invoking UI. Elevated to Medium severity per founder's active-user-demand signal. Consolidated into SCOPE-2.F36.
3. PRD-14B `calendar-parse-event` Edge Function absent from all 45 Edge Functions in `supabase/functions/`. Image OCR + LiLa Guided Intake + Send-to-Calendar AI parsing all blocked. Consolidated into SCOPE-2.F34 with near-term build priority per founder direction.
4. PRD-14 `col_span` responsive-section feature has zero code adoption despite PRD Decision #14 + Cross-PRD addendum reinforcement. Not currently stub-registered. Consolidated into SCOPE-2.F32 with will-be-built flag and STUB_REGISTRY add recommendation.
5. PRD-26 `tasks.source='randomizer_reveal'` expectation vs Build J `randomizer_draws` table actuality — cross-PRD seam between PRD-26 and PRD-09A/09B Build J architecture. Flagged as PATTERN-FLAG-FOR-SCOPE-3 rather than emitted as a Scope 2 finding.

### Cross-references

- CROSS-REF: SCOPE-2.F8 (Foundation PRD-04 HubTV stub) cited by PRD-14E R1, R2 — entire PRD-14E maps 1:1 to Foundation finding, not re-emitted per §7 Rule 7
- CROSS-REF: SCOPE-5.F2 (widget_starter_configs live_schema drift) cited by SCOPE-2.F31
- CROSS-REF: SCOPE-5.F4 (widget picker misleading UI — color_reveal, gameboard) cited by PRD-10 R5 evidence, not re-emitted
- CROSS-REF: SCOPE-2.F27 (PRD-09B list type catalog expansion codify pattern) anchors F30 remediation shape
- CROSS-REF: SCOPE-2.F22 (PRD-19 reports pipeline near-term build) anchors F34 product-timing pattern
- CROSS-REF: CLAUDE.md Convention #215 + Build M completed-build record (2026-04-11) anchor F38 supersession evidence bar per PLAN §4.3.2
- CROSS-REF: CLAUDE.md Conventions #110, #114, #115 anchor F33 schema-refactor supersession
- PATTERN-FLAG-FOR-SCOPE-3: PRD-26 `tasks.source='randomizer_reveal'` expectation vs Build J `randomizer_draws` table — cross-PRD seam between PRD-26 and PRD-09A/09B
- PATTERN-FLAG-FOR-SCOPE-3: PRD-14 `col_span` feature may recur across PRD-25 and PRD-26 section rendering — flagged for cross-PRD integration evaluation
- PATTERN-FLAG-FOR-SCOPE-4: PRD-14B AI intake cost analysis applicable when `calendar-parse-event` Edge Function eventually built (vision-model per-call cost)

### Founder adjudication

- **F30 PRD-10 tracker catalog expansion:** Internal PRD-10 contradiction — Overview L18 claims "19 tracker types" while enum L624-629 lists 17. Code ships the 17-value enum plus 4 extras that arrived post-PRD. Founder confirmed 2026-04-20 all 4 extras are legitimate and should be codified per F27 pattern: `randomizer_spinner` (widget version of randomizer list type), `privilege_status` (permission/access tracking for kids), `log_learning` (homeschool time logging per Build K), `best_intention` (Best Intentions counter/tracker). Remediation: one PRD-10 doc pass to reconcile Overview count and add 4 extras with brief use-case notes. No code changes.

- **F31 PRD-10 widget_templates vs widget_starter_configs:** Architectural split already closed as SCOPE-5.F2. `widget_templates` (0 rows, PRD-10 spec) was superseded by `widget_starter_configs` (39 rows, architectural reality). Code is truth. Remediation: PRD-10 §Data Schema L596-611 text update to describe the shipped architecture. Doc-only.

- **F32 PRD-14 col_span unbuilt:** Zero code adoption despite PRD-14 Decision #14 + Cross-PRD addendum L28-33 reinforcement. Founder direction 2026-04-20: "needs to be fixed eventually" — baked into remediation as "will-be-built" flag rather than indefinite polish. Sections currently render full-width as fallback; no functional regression today, but responsive grid utility is lost. Recommendation in open flags: add to STUB_REGISTRY so future contributors see it as a tracked unbuilt feature rather than forgotten spec text.

- **F33 PRD-14B schema refactor docs:** 3 schema drifts — category→category_id UUID FK (Convention #110), auto_approve_members JSONB→UUID[] (Convention #114), week_start_day INTEGER column added (Convention #115). All deliberately superseded via Conventions. Evidence bar per §4.3.2 met. PRD-14B §Data Schema text update. Doc-only.

- **F34 PRD-14B AI intake unbuilt:** 3 MVP checklist items (PRD-14B L881-884) missing from code — `calendar-parse-event` Edge Function not in any of the 45 Edge Functions in `supabase/functions/`, Image-to-Event Screen 6 vision-model flow absent from EventCreationModal, "Help Me Plan This" LiLa Guided Intake + `calendar_event_create` guided mode not seeded in `lila_guided_modes`. Founder direction 2026-04-20: "this needs to be working" — near-term build priority similar to F22 homeschool reporting. Not urgent blocker, but next-build-queue priority. PATTERN-FLAG-FOR-SCOPE-4 preserved: when the vision-model pipeline is eventually built, Scope 4 cost analysis applicable.

- **F35 PRD-14C polish deferred:** 4 Family Overview UX polish items stub-registered Post-MVP per STUB_REGISTRY:315-318 (column drag-to-reorder, section drag-to-reorder, per-column override via long-press gesture, calendar week/month toggle on Family Overview). Core [FamilyOverview.tsx](../src/components/family-overview/FamilyOverview.tsx) surface ships; interaction polish deferred. Low severity — no functional regression.

- **F36 PRD-25 LiLa tools unbuilt:** Severity escalated from Low to Medium per founder direction 2026-04-20: "my son has requested and asked how to use these." Active user demand elevates the finding from academic seeded-but-unwired concern to real UX gap — a kid is asking about features that don't launch. Migration 00000000000013 seeds both `guided_homework_help` (Socratic homework assistance, Haiku-class) and `guided_communication_coach` (kid-adapted Higgins, Haiku-class) into `lila_guided_modes` with complete opening_messages + system_prompt_key. Zero invoking UI — grep for the mode keys in `src/` surfaces only type declarations. Guided shell LiLa modal surface is the missing piece; the AI infrastructure is ready. Remediation: wire permission-gated LiLa modals for Guided members on Homework Help + Communication Coach per PRD-25 §AI Integration L520-539.

- **F37 PRD-25/26 graduation unbuilt:** Both graduation flows share the same shape (celebration overlay + interactive tutorial + welcome card + `graduation_tutorial_completed` preference). PRD-25 Screen 7 (Guided→Independent, 5-step tutorial) and PRD-26 Screen 4 (Play→Guided, 4-step tutorial) both only ship the preference flag. STUB_REGISTRY:337 marks "Graduation celebration + tutorial" as 📌 Post-MVP. Consolidated across both PRDs into one finding. Low severity — member experience on shell transition is functional (data carries over) without the celebration/tutorial polish.

- **F38 PRD-26 reveal architecture supersession:** Build M (2026-04-11 completed-build record) + CLAUDE.md Convention #215 superseded PRD-26's 5-style per-tile model with 2-style per-segment model. PRD-26 Screen 2 (Reveal Task Tile Flow L168-221) + Data Schema L329-398 describe the 5 reveal styles (`spinner`, `mystery_doors`, `card_flip`, `scratch_off`, `gift_box`) stored in `dashboard_configs.preferences.reveal_tiles[]` — none of that shipped. Build M ships `show_upfront`/`mystery_tap` on `task_segments.randomizer_reveal_style` per-segment. `play_reveal_tiles` feature key ships as a PlannedExpansionCard stub. Evidence bar per §4.3.2 met (Convention #215 + completed-build record are explicit architectural decisions). PRD-26 text update. Doc-only.

### Emission list

Findings to emit (9 total):
- SCOPE-2.F30 — PRD-10 tracker catalog expansion (Low, Unintentional-Fix-PRD, Beta N; codify 17 canonical + 4 extras per F27 pattern)
- SCOPE-2.F31 — PRD-10 widget_templates vs widget_starter_configs (Low, Intentional-Document, Beta N; CROSS-REF SCOPE-5.F2)
- SCOPE-2.F32 — PRD-14 col_span unbuilt (Low, Unintentional-Fix-Code, Beta N; founder "will-be-built eventually" flag; STUB_REGISTRY add recommended)
- SCOPE-2.F33 — PRD-14B schema refactor docs (Low, Intentional-Document, Beta N; SUPERSEDES Conventions #110, #114, #115)
- SCOPE-2.F34 — PRD-14B AI intake unbuilt (Medium, Deferred-Document, Beta N; founder "this needs to be working" — near-term build priority; PATTERN-FLAG-FOR-SCOPE-4)
- SCOPE-2.F35 — PRD-14C polish deferred (Low, Deferred-Document, Beta N)
- SCOPE-2.F36 — PRD-25 Guided LiLa tools unbuilt (Medium per user demand elevation, Deferred-Document, Beta N; founder "my son has requested and asked how to use these")
- SCOPE-2.F37 — PRD-25/26 graduation unbuilt (Low, Deferred-Document, Beta N; Post-MVP per STUB_REGISTRY:337)
- SCOPE-2.F38 — PRD-26 reveal architecture supersession (Low, Intentional-Document, Beta N; SUPERSEDES Convention #215 + Build M completed-build record)

No Batch 5 hygiene notes. No new Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

### Open flags (tech-debt + cross-scope register)

1. **F34 user-demand elevation — near-term build priority.** Founder direction 2026-04-20 "this needs to be working" marks PRD-14B AI intake (Edge Function + Image OCR + Help-Me-Plan-This guided mode) as next-build-queue priority similar to F22 homeschool reporting. Product-timing signal for post-audit remediation queue prioritization.
2. **F36 user-demand elevation — active kid demand.** Founder direction 2026-04-20 "my son has requested and asked how to use these" marks PRD-25 Guided LiLa tools (Homework Help + Communication Coach modals) as near-term build priority. Distinct from F34 shape — F36 is seeded-but-unwired UI adoption rather than unbuilt infrastructure. Low code lift, high user value.
3. **F32 STUB_REGISTRY add recommendation.** PRD-14 `col_span` responsive-section feature has zero code adoption and no STUB_REGISTRY entry tracking it. Consider adding to STUB_REGISTRY so future contributors see it as a tracked unbuilt feature rather than forgotten spec text. Low priority registry hygiene.
4. **PRD-26 randomizer_reveal source value vs Build J randomizer_draws seam** — PATTERN-FLAG-FOR-SCOPE-3. PRD-26 §Data Schema L399 adds `'randomizer_reveal'` to `tasks.source`; Build J ships separate `randomizer_draws` table (Convention #163) with no source-flagged task. Cross-PRD seam between PRD-26 and PRD-09A/09B Build J architecture. Scope 3+8b evidence pass for PRD-26 cross-PRD addendum should examine as an integration pattern.
5. **F32 col_span may recur across PRD-25/PRD-26 section rendering** — PATTERN-FLAG-FOR-SCOPE-3. If Guided and Play dashboards reference the same `col_span` model, multi-PRD integration pattern surfaces during Scope 3+8b traversal.
6. **PRD-14B vision-model cost analysis** — PATTERN-FLAG-FOR-SCOPE-4. When `calendar-parse-event` Edge Function is eventually built (per F34 near-term queue), Scope 4 cost analysis applicable — OpenRouter vision-model per-call cost vs. Haiku text-only extraction cost for the same intake pipeline.
7. **PRD-14E entirely rolls to Foundation SCOPE-2.F8.** All 7 PRD-14E MVP checklist items absent from code; `/hub/tv` route renders PlannedExpansionCard. Foundation F8 captures the full stub state. No separate Batch 5 emission. When PRD-14E build kicks off, scope inherits from PRD-33 PWA PRD timeline.



## Round 6 — Communication evidence pass (Batch 6, PRDs 15, 16)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_6_communication.md](EVIDENCE_BATCH_6_communication.md)
- **Aggregate:** 19 rows across 2 PRDs (PRD-15: 12, PRD-16: 7). 6 ambiguity flags. 4 unexpected findings. 6 worker-proposed candidates.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD15-MOM-VISIBILITY-ARCHITECTURE | PRD-15 R6 | Unintentional-Fix-Code (orchestrator override from worker's Unintentional-Fix-PRD) | Medium (orchestrator override from worker's Low) | SCOPE-2.F39 | Confirmed — reshaped from doc-drift to architectural build. Founder direction 2026-04-20: mom-decides-privacy-with-transparency architecture supersedes current strict privacy. Three-state model: (a) default mom cannot observe (current code), (b) mom opts-in per member/conversation → participants notified observation is active, (c) mom flags specific conversations/members as private → mom cannot observe even if adjacent conversations are observable. Example: mom observes any conversation involving Helam or Mosiah, allows Miriam and Gideon privacy. Matches "mom decides, privacy transparent to anyone involved" principle from PRD-02 Teen Transparency Panel. Remediation scope includes: new observation flag columns, notification event on observation toggle, Teen Transparency Panel indicator extension, Convention #141 REWRITE (current "Mom CANNOT read" is wrong per founder intent), PRD §685/§690/§702 rewrite. Beta stays N — current strict is safer beta default; loosening lands with full transparency architecture | N |
| PRD15-DND-NON-SAFETY-SUPPRESSION | PRD-15 R10 | Unintentional-Fix-Code | Medium (orchestrator override from worker's Low) | SCOPE-2.F40 | Confirmed — ESCALATED to Medium per founder direction 2026-04-20: "let's fix" + founder surfaced broader concern ("do we have any notifications yet? I don't know how any of that works") indicating the notification surface may be in halfway-state similar to MindSweep (F29). DND toggle is UI-complete and stores flag; no consumer reads it to suppress non-safety notifications. Convention #143 "Safety alerts always bypass DND" implies the inverse (non-safety respects DND) is baseline. ~5-line query filter in `useNotifications.ts` + `useUnreadNotificationCount` closes the immediate defect. Open flag for Phase 3: audit which notifications actually fire in production today | N |
| PRD15-WIRING-STATUS-DOC-DRIFT | PRD-15 R11 | Unintentional-Fix-PRD | Low | SCOPE-2.F41 | Confirmed — pure post-build checklist-update miss. WIRING_STATUS.md lines 18, 19, 26, 123, 182 still label PRD-15 destinations "Stub — PRD-15 not built" post-Build-G. Line 19 also stale for PRD-16 post-Build-P. Single doc pass closes it | N |
| PRD16-MEETING-TYPE-OVERRIDE | PRD-16 R1 | Intentional-Document | Low | SCOPE-2.F42 | Confirmed — feature decision file carries the override per PLAN §4.3.2 evidence bar (not the addendum). Founder decision 2026-04-14: weekly_review/monthly_review/quarterly_inventory moved to Rhythms (PRD-18, already in Build K); `business` → custom template. PRD-16 §589 gets pointer amendment citing feature decision, not a rewrite. Different shape from F5 archaeological-table override — F42 is addendum-adjacent-via-feature-decision supersession | N |
| PRD16-NOTIFICATION-ENUM-MISSING | PRD-16 R2 | Unintentional-Fix-Code | Medium | SCOPE-2.F43 | Confirmed Medium — mirror F19 precedent. PRD-16 Cross-PRD Impact Addendum §Impact-on-PRD-15 requires 3 new `notifications.notification_type` values (`meeting_reminder`, `meeting_completed`, `meeting_action_routed`) + `notifications.category='meetings'`. Migration 100146 applied 2 other addendum enum additions but missed these 4. `completeMeeting.ts:86-87` workaround uses `notification_type='system'` + `category='tasks'`. Build P verification row 47 passed "Wired — createNotification in completeMeeting" without checking enum-value alignment. Emit as standalone finding; do NOT reopen Build P sign-off. Build P 127/114/13/0 tally correction flagged as Phase 3 doc-hygiene open flag (mirror Round 3 F19 STUB_REGISTRY L120 pattern) | N |
| PRD16-VERIFICATION-TABLE-DRIFT | PRD-16 R5 | Unintentional-Fix-PRD | Low | SCOPE-2.F44 | Confirmed — `GuidedThingsToTalkAboutSection.tsx` is fully built and functional; Build P verification rows 99 and 116 in `claude/feature-decisions/PRD-16-Meetings.md` mark it "Stubbed — widget not built." Post-verification drift only. Update rows 99 + 116 to Wired; correct Build P tally from 127/114/13/0 to 127/116/11/0. Same Phase 3 doc-hygiene bucket as F43 Build-P-tally correction flag. Does NOT warrant reopening Build P sign-off | N |

### Load-bearing unexpected findings

1. Notifications Do Not Disturb has UI toggle but no query-level suppression for non-safety categories. `useNotifications.ts:15-33` sorts by priority DESC (correct for safety-first) but never filters against `notification_preferences.do_not_disturb`. Toggle writes the flag (`NotificationPreferencesPanel.tsx:188-214`); no consumer reads it. Consolidated into SCOPE-2.F40. Founder surfaced broader concern ("do we have any notifications yet?") — flagged as Phase 3 production-notification-audit open flag.
2. `completeMeeting.ts:86-87` uses `notification_type='system'` + `category='tasks'` instead of addendum-required `'meeting_completed'` + `'meetings'`. Migration 100146 applied calendar_events.source_type + conversation_threads.source_type additions but missed notifications.notification_type + notifications.category. Build P verification row 47 passed the `createNotification` invocation check without checking enum alignment. Consolidated into SCOPE-2.F43.
3. `GuidedThingsToTalkAboutSection.tsx` is fully built (text input + `useAddAgendaItem` with `suggested_by_guided: true` + `useRemoveAgendaItem` + TTS support) but Build P verification rows 99 + 116 mark "Stubbed — widget not built." Stub count should be 11, not 13. Consolidated into SCOPE-2.F44.
4. WIRING_STATUS.md lines 18/19/26/123/182 retain "PRD-15 not built" / "PRD-16 not built" stub labels post-Build-G / post-Build-P. Pure post-build checklist-update miss. Consolidated into SCOPE-2.F41.

### Cross-references

- CROSS-REF: Convention #141 (current "Mom CANNOT read other members' messages" text) anchors SCOPE-2.F39 for REWRITE per founder's three-state model 2026-04-20
- CROSS-REF: PRD-02 Teen Transparency Panel (Convention #134, PRD-02 §Screen 4) anchors SCOPE-2.F39 observation-notification mechanism + transparency principle ("mom decides, privacy transparent to anyone involved")
- CROSS-REF: Convention #143 (safety-always-bypasses-DND) anchors SCOPE-2.F40 inverse-rule (non-safety respects DND as baseline)
- CROSS-REF: SCOPE-2.F29 (MindSweep halfway-state completion bucket) noted as pattern analog for SCOPE-2.F40 broader notification-completion bucket; founder concern "do we have any notifications yet?" suggests similar shape
- CROSS-REF: SCOPE-2.F3 pattern (column-seeded / UI-absent) cited as same shape as SCOPE-2.F40 (config-flag-stored / filter-absent)
- CROSS-REF: SCOPE-2.F19 precedent (STUB_REGISTRY L120 false-Wired claim meta-finding, Scope 5 closed, flagged for Phase 3 doc-hygiene not reopened) cited by SCOPE-2.F43 + SCOPE-2.F44 for Build P tally correction handling
- CROSS-REF: SCOPE-2.F17 (PRD-08 messaging supersession — Batch 3 carry-forward for "PRD-15 not working exactly as I envisioned") — founder confirmed 2026-04-20 she couldn't identify the specific UX concern; remains on open-flags register
- CROSS-REF: `claude/feature-decisions/PRD-16-Meetings.md §Meeting Types` (founder decision 2026-04-14) anchors SCOPE-2.F42 supersession evidence per PLAN §4.3.2
- CROSS-REF: Build P completion file `.claude/completed-builds/2026-04/build-p-prd-16-meetings.md` anchors F43 + F44 as post-sign-off regression findings
- CROSS-REF: STUB_REGISTRY.md 13-stub list from Build P is the target for F44 correction (stub count drops to 11)
- PATTERN-FLAG-FOR-SCOPE-3: mom-decides-privacy-with-transparency architecture (F39) may cascade across other per-member visibility surfaces (PRD-06 partner-share per F16, PRD-08 per-child journal visibility per F18, PRD-19 relationship notes) — Scope 3+8b should evaluate as a cross-PRD pattern, not just PRD-15 single-PRD drift
- PATTERN-FLAG-FOR-SCOPE-3: post-build-verification enum-alignment miss (F43) may recur across builds that depend on addendum-specified enum additions — Scope 3+8b pre-emission check on Build O/P/Q-class builds

### Founder adjudication

- **F39 PRD-15 mom-visibility architecture:** Founder direction 2026-04-20 reshaped this from doc-drift (the evidence worker's original Unintentional-Fix-PRD) into an architectural build finding. Founder intent: mom decides which conversations she can observe, participants are notified when observation is active, mom can also flag specific conversations/members as private so she cannot observe them. Example given: "mom might observe any conversation that involves Helam or Mosiah, but allow Miriam and Gideon to have privacy." The same mom-decides-privacy-with-transparency principle governs every other visibility surface in the app (PRD-02 Teen Transparency Panel precedent). Current code implements strict privacy via space-membership-only RLS — correct for beta defaults but does NOT match founder intent for the full product. CLAUDE.md Convention #141 ("Mom CANNOT read other members' messages") is wrong per founder's three-state model and gets REWRITE, not affirmation. PRD §685/§690/§702 text all need rewrite to describe the three-state model. Remediation scope: new observation flag columns (likely on `conversation_spaces` and/or `member_messaging_permissions`), notification event on observation toggle, Teen Transparency Panel indicator extension, RLS policy expansion so observation-flagged spaces surface to mom, private-flag enforcement so flagged spaces stay hidden even when adjacent ones are observable. Severity Medium: active product demand + architectural principle divergence from built code. Beta Readiness N: current strict version is the safer beta default; loosening lands with full transparency architecture.

- **F40 DND non-safety suppression unwired:** Worker originally proposed Low severity. Founder direction 2026-04-20: "let's fix" with broader concern "do we have any notifications yet? I don't know how any of that works." Escalated to Medium per PLAN §default-severity rule ("Escalate to Medium when founder surfaces active product demand"). Immediate defect: `useNotifications.ts:15-33` never filters non-safety notifications when `notification_preferences.do_not_disturb = true`. Convention #143 (safety-always-bypasses-DND) presupposes the inverse rule is baseline. ~5-line query-filter addition closes the defect. Broader concern (founder unsure what notifications actually fire in production) flagged as Phase 3 open: audit which `notification_type` values have been inserted over the last 30 days, compare against the PRD-15 MVP list, surface halfway-state items similar to MindSweep F29 pattern.

- **F41 WIRING_STATUS.md PRD-15/PRD-16 drift:** Pure post-build checklist-update miss. Build G shipped PRD-15 full messaging/requests/notifications infrastructure. Build P shipped PRD-16 meetings. WIRING_STATUS.md never updated — lines 18/19/26/123/182 still label destinations "Stub — PRD-15 not built" / "PRD-16 not built." Single doc pass closes it.

- **F42 PRD-16 meeting type 9→5 override:** Founder decision 2026-04-14 documented only in the feature decision file — `claude/feature-decisions/PRD-16-Meetings.md §Meeting Types`. weekly_review/monthly_review/quarterly_inventory moved to PRD-18 Rhythms (already in Build K Phase B). `business` removed because it's a custom template not a built-in type. Per PLAN §4.3.2 evidence bar, feature decision files qualify as Intentional-Document evidence. Different shape from F5 archaeological-table override (F5 was whole tables that no longer exist); F42 is enum-value reduction with extensibility via `custom` type preserved. PRD-16 §589 gets pointer amendment citing feature decision, not a rewrite.

- **F43 PRD-16 notification enum missing:** PRD-16 Cross-PRD Impact Addendum §Impact-on-PRD-15 explicitly requires 3 new `notifications.notification_type` values (`meeting_reminder`, `meeting_completed`, `meeting_action_routed`) plus new `notifications.category='meetings'`. Migration 100146 (2026-04-15) correctly applied two OTHER addendum enum additions — `calendar_events.source_type='meeting_schedule'` at L301 and `conversation_threads.source_type='meeting_summary'` at L306 — but missed the notifications enum additions entirely. `completeMeeting.ts:86-87` works around this by using pre-existing PRD-15 enum values `notification_type='system'` + `category='tasks'`. Build P verification row 47 passed "Wired — createNotification in completeMeeting" without checking enum-value alignment against the addendum. Functional impact: post-meeting participant notifications arrive correctly; category filter in notification tray miscategorises meeting events under "Tasks" instead of "Meetings." Small migration (4 enum additions) + 1-line update to `completeMeeting.ts` closes it. Mirrors F19 precedent: do NOT reopen Build P sign-off; flag Build P 127/114/13/0 tally correction as Phase 3 doc-hygiene alongside this feature fix. Medium severity: addendum contract broken + post-build verification let it through + forward-blocker for category-filtered notifications working properly.

- **F44 PRD-16 verification table drift — Guided TTA:** `GuidedThingsToTalkAboutSection.tsx` is fully built — text input, `useAddAgendaItem` with `suggested_by_guided: true`, `useRemoveAgendaItem`, optional TTS support. Build P verification rows 99 ("Guided children: indirect only (suggested_by_guided) — Stubbed — Schema supports; widget not built") and 116 ("Guided 'Things to Talk About' widget — Stubbed — Schema supports suggested_by_guided; widget not built") both mark it Stubbed. Correct state is Wired on both rows. Stub count drops from 13 to 11 (or 12 if the two entries consolidate). Phase 3 doc-hygiene update to `claude/feature-decisions/PRD-16-Meetings.md` rows 99 + 116 + Build P summary tally 127/114/13/0 → 127/116/11/0. Same bucket as F43 Build P tally correction flag. Does NOT warrant reopening Build P sign-off.

### Emission list

Findings to emit (6 total):

- SCOPE-2.F39 — PRD-15 mom-visibility architecture — three-state observation/private model supersedes Convention #141 strict privacy (Medium, Unintentional-Fix-Code, Beta N; orchestrator override from worker's Unintentional-Fix-PRD Low per founder direction 2026-04-20)
- SCOPE-2.F40 — PRD-15 DND non-safety suppression unwired (Medium, Unintentional-Fix-Code, Beta N; escalated from worker's Low per founder "let's fix" direction; Phase 3 open flag for broader notification-surface production audit)
- SCOPE-2.F41 — WIRING_STATUS.md PRD-15 / PRD-16 post-build checklist drift (Low, Unintentional-Fix-PRD, Beta N)
- SCOPE-2.F42 — PRD-16 meeting_type enum 9→5 override per feature decision 2026-04-14 (Low, Intentional-Document, Beta N; pointer amendment only)
- SCOPE-2.F43 — PRD-16 notification enum additions missing from migration 100146 — `completeMeeting.ts` workaround uses mis-categorised enum values (Medium, Unintentional-Fix-Code, Beta N; mirror F19 precedent; do NOT reopen Build P; Build P tally correction flagged for Phase 3 doc-hygiene)
- SCOPE-2.F44 — PRD-16 Build P verification table drift — `GuidedThingsToTalkAboutSection` marked Stubbed but fully built (Low, Unintentional-Fix-PRD, Beta N; Build P tally correction 127/114/13/0 → 127/116/11/0)

No Batch 6 hygiene notes. No new Scope 4 emissions from this batch. Two PATTERN-FLAG-FOR-SCOPE-3 items logged (mom-decides-privacy architecture cross-PRD pattern; post-build-verification enum-alignment miss pattern).

### Open flags (tech-debt + cross-scope register)

1. **Notification surface halfway-state audit** — founder direction 2026-04-20: "do we have any notifications yet? I don't know how any of that works." Similar shape to MindSweep F29 halfway-state completion bucket. Phase 3 audit: query `notifications` insert log over the last 30 days, compare against the 13 `notification_type` values defined in PRD-15, surface which types have never fired. F40 DND-fix pairs with this audit as a broader notification-completion pass.
2. **Convention #141 REWRITE required** — part of F39 remediation. Current Convention #141 ("Mom CANNOT read other members' messages. She controls WHO communicates and WHAT coaching is active, but message content between other members is private. RLS enforces this — mom only sees messages in spaces where she is herself a member. Coaching activity log shows that coaching fired, never the draft content.") is the WRONG architectural principle per founder intent. Rewrite captures three-state model: (a) default private, (b) mom opts-in to observe with participant notification, (c) mom flags specific conversations/members as private override.
3. **PRD-15 §685/§690/§702 rewrite required** — part of F39 remediation. All three need text update to match the three-state model.
4. **Teen Transparency Panel extension** — part of F39 remediation. PRD-02 Screen 4 Teen Transparency Panel needs an "observation-enabled" indicator when a conversation's mom-observation flag is on. Cross-scope flag for Scope 3+8b integration traversal.
5. **Batch 3 F17 carry-forward remains open** — founder confirmed 2026-04-20 she could not identify the specific PRD-15 behavior-vs-intent concern beyond DND (F40) and mom-visibility (F39). The "messaging not working exactly as I envisioned, some is working" signal from Batch 3 walk-through stays on register for future surfacing.
6. **Build P tally correction bucket** (F43 + F44) — Phase 3 doc-hygiene pass updates `claude/feature-decisions/PRD-16-Meetings.md` rows 99 + 116 + summary tally. Paired with migration follow-up for F43 notification enum additions. Does NOT reopen Build P sign-off per F19 precedent.
7. **PATTERN-FLAG-FOR-SCOPE-3 — mom-decides-privacy architecture cross-PRD cascade** — F39 is the PRD-15 instance. May cascade across PRD-06 partner-share (F16), PRD-08 per-child journal visibility (F18), PRD-19 relationship/private notes (F22/F23). Scope 3+8b should evaluate as a cross-PRD pattern, not as PRD-15-only.
8. **PATTERN-FLAG-FOR-SCOPE-3 — post-build-verification enum-alignment miss pattern** — F43 shape (addendum specifies enum additions → migration misses them → verification passes on invocation without checking enum values) may recur across future Build O/P/Q-class builds. Flag for Scope 3+8b pre-emission verification-discipline audit.

## Round 7 — Vault/BookShelf evidence pass (Batch 7, PRDs 21, 21A, 21B, 21C, 22, 23, 34)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_7_vault-bookshelf.md](EVIDENCE_BATCH_7_vault-bookshelf.md)
- **Aggregate:** 46 rows across 7 PRDs (PRD-21: 6, PRD-21A: 8, PRD-21B: 6, PRD-21C: 6, PRD-22: 8, PRD-23: 6, PRD-34: 6). 10 ambiguity flags. 6 unexpected findings. 17 worker-proposed candidates → 13 emitted findings after founder-directed consolidation (PRD-22 R1+R2+R3 merged into F50; PRD-22 R4+R5+R6+R7 merged into F51).
- **Numbering note:** Round 7 emits finding IDs **F45–F57**, continuing sequentially from Round 6's F39–F44. The adjudication prompt originally proposed F39–F51 but those IDs were consumed by Round 6 when it closed (commit `ccefe1d`, 2026-04-20). Renumbering preserves audit cross-reference integrity — no two findings share an ID across rounds.

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD21-AI-TOOLBOX-REMOVED | PRD-21 R2 | Scope-Creep-Evaluate → Unintentional-Fix-Code (founder override: restore, not codify) | Medium (founder override from worker's Low per active demand "ideal even now honestly") | SCOPE-2.F45 | Confirmed — REBUILD the sidebar AI Toolbox section. Founder clarified 2026-04-20: removal was a demo-time decision; Convention #80 "storefront vs launcher" remains authoritative. Current state preserved (AI Vault in all adult/Independent dashboards; mom-only commenting preserved). Future: not all tools for non-mom members; mom opts family in per tool. Severity Medium per F36 user-demand elevation precedent. Remediation: rebuild sidebar section consuming `lila_tool_permissions`, respect `source='default'` + `source='vault'` + future `saved_prompt_id` rendering | N |
| PRD34-THOUGHTSIFT-PAGE-STUB | PRD-34 R1 | Deferred-Document → Unintentional-Fix-Code (founder override: remove route) | Low | SCOPE-2.F46 | Confirmed — REMOVE the `/thoughtsift` route and `ThoughtSiftPage` placeholder. Founder direction 2026-04-20: ThoughtSift tools live in AI Vault; ThoughtSift QuickTasks button already launches the 5-tool submenu. Sidebar entry was scope creep. Remediation: delete route registration in [src/App.tsx:178](../src/App.tsx#L178) + remove `ThoughtSiftPage` from [src/pages/placeholder/index.tsx:62-64](../src/pages/placeholder/index.tsx#L62). Confirm no sidebar nav entry references `/thoughtsift` after removal | N |
| PRD34-PERSONA-SCHEMA-SPLIT-MISSING | PRD-34 R2 | Unintentional-Fix-Code | Low | SCOPE-2.F47 | Confirmed as-is — founder accepted verdict 2026-04-20 ("not sure what this all is, verdict looks correct"). `board_personas` shipped as single public table; PRD-34 addendum mandates `platform_intelligence` for system/community tiers + public for `personal_custom`. RLS + `persona_type` enforce ownership today; schema split matters when Channel D community-persona promotion pipeline runs. Cheap to defer; fix when community pipeline is built | N |
| PRD21B-ADMIN-CONSOLE-UNBUILT | PRD-21B R1–R5 | Deferred-Document | Medium | SCOPE-2.F48 | Confirmed Medium per F1/F9/F19 pattern — founder acknowledged 2026-04-20: "not built yet. Correct." Same shape as F1 tier monetization unbuilt and F49 (this batch) engagement-surface-absent. No `/admin` route, no tabbed nav, no vault CRUD, no content request queue UI, no analytics, no image manager, no LiLa content suggestions. `staff_permissions` table wired with no consumer | N |
| PRD21C-ENGAGEMENT-UNBUILT | PRD-21C R1–R6 | Deferred-Document | Medium | SCOPE-2.F49 | Confirmed Medium — founder confirmed 2026-04-20 both F48/F49 unbuilt. All 6 engagement tables absent (`vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config`). 4 denormalized counters on `vault_items` migrated but nothing writes to them. Partial forward-prep: `shared_with_member_id` + `saved_prompt_id` columns already wired for future share-from-my-prompts flow. Mom-only commenting posture preserves privacy when discussion UI eventually lands | N |
| PRD22-SETTINGS-OVERLAY-EMBEDS (consolidates R1 + R2 + R3) | PRD-22 R1, R2, R3 | Deferred-Document | Medium (founder severity elevation from worker's Low per "mom should not lose her place. Basically anywhere. That is annoying") | SCOPE-2.F50 | Confirmed Medium — active UX-annoyance demand matches F36 elevation precedent. Two sub-concerns consolidated: (a) Settings is a route not an overlay per PRD-22 Decision #1 — [SettingsProvider.tsx:6](../src/components/settings/SettingsProvider.tsx#L6) explicitly documents the deferral; (b) PRD-22 Screens 5, 6, 8, 9 (Permission Hub, Notification Preferences, Calendar Settings, Messaging Settings, LiLa Context Settings) all exist as standalone surfaces but none are embedded within Settings per PRD-22 spec. Founder enhancement direction captured as open flag: during "View As" mode, inline permission grant/revoke embeds on each feature page. Remediation: build PRD-22 Settings overlay + embeds together as one Settings build; View-As inline permissions as post-audit product workstream | N |
| PRD22-MINOR-SCREENS-DEPRIORITIZED (consolidates R4 + R5 + R6 + R7) | PRD-22 R4, R5, R6, R7 | Deferred-Document | Low | SCOPE-2.F51 | Confirmed Low — founder direction 2026-04-20 deprioritizes or amends all 4 surfaces: (a) Account deletion → NO self-serve deletion; manual request path with grace period instead (PRD-22 Screen 2 spec amended); (b) Data export "not the biggest priority for me"; (c) Multi-email "not too worried yet"; (d) LiLa Preferences UI "should probably be built when we build the core lila features that I believe are still unbuilt" — bundles with F9 PRD-05C Optimizer build queue. Severity dropped from per-row Medium (R4/R5 originally compliance-adjacent) to Low via founder deprioritization. Manual deletion workflow documentation flagged for Phase 3 (open flag) so beta users have a visible account-closure path | N |
| PRD21A-OPTIMIZER-INTEGRATION-STUB | PRD-21A R4 | Deferred-Document | Low | SCOPE-2.F52 | Confirmed — gated on F9 PRD-05C Optimizer Edge Function build. Archives side (`reference_photos`, `physical_description` on `archive_member_settings`) fully wired. `OptimizeButton` at [PromptPackDetail.tsx:148-168](../src/features/vault/components/detail/PromptPackDetail.tsx#L148) is an explicit STUB with "coming soon" tooltip. Bundle with F9 build | N |
| PRD21A-SKILL-DEPLOY-STUB | PRD-21A R5 | Deferred-Document | Low | SCOPE-2.F53 | Confirmed — gated on F9 Optimizer + External Tool Registry infrastructure (PRD-05C + PRD-19 per PRD-21A Forward Note). "Deploy with LiLa" button handler is `alert('Coming soon!')` at [SkillDetail.tsx:32](../src/features/vault/components/detail/SkillDetail.tsx#L32). Platform download/copy buttons functional for raw skill use; premium personalized flow + session report re-import pipeline gated. Bundle with F9 build | N |
| PRD21-SKILL-CHECK-MODE-MISSING | PRD-21 R6 | Deferred-Document | Low | SCOPE-2.F54 | Confirmed — founder direction 2026-04-20: "isn't necessary yet... eventually I'd like them to be able to utilize this, and be coached through finding their own words to use." Confirms PRD-21 intent (make-itself-unnecessary coaching flow). Core craft-first flow in `lila-cyrano` + `lila-higgins-say` is wired. Skill-check branch (5+ interaction threshold) is advanced-stage polish. No STUB_REGISTRY entry; add during remediation queue | N |
| PRD21-HIGGINS-DISPLAY-NAME-DRIFT | PRD-21 R3 | Unintentional-Fix-Code | Low | SCOPE-2.F55 | Confirmed — one-line UPDATE migration. `lila_guided_modes.display_name` seeds "What to Say" / "How to Navigate" ([00000000000007_lila_ai_system.sql:233-234](../supabase/migrations/00000000000007_lila_ai_system.sql#L233)); PRD-21 + QuickTasks labels specify "Help Me Say Something" / "Help Me Navigate This." User-visible QuickTasks submenu correct; registry column wrong. Any surface reading `display_name` shows wrong names (conversation history, mode switcher). Cheapest fix in batch | N |
| PRD23-ADDENDUM-INSIGHTS-RENAME-DRIFT | PRD-23 R1 | Unintentional-Fix-PRD | Low | SCOPE-2.F56 | Confirmed — one-line addendum amendment. PRD-23 Cross-PRD Impact Addendum references `bookshelf_principles` at lines 36-46, 172-180; base PRD-23 and code both use `bookshelf_insights`. Same pattern as F21 (addendum-properly-captured supersession with base-PRD pointer amendment). Pure doc drift | N |
| PRD23-SEMANTIC-SEARCH-CROSS-FEATURE-STUB | PRD-23 R3 | Deferred-Document | Low | SCOPE-2.F57 | Confirmed — founder direction 2026-04-20: "Would like semantic search to be useable whenever/wherever it would be valuable to user." Confirms addendum's 8-feature integration map (Safe Harbor, InnerWorkings, Journal, Tasks, Family Context, LifeLantern, Meetings + BookShelf). `useSemanticSearch()` hook + `SemanticSearchPanel` exist; only BookShelf consumes today. Each consumer wires during its own feature build phase. PATTERN-FLAG-FOR-SCOPE-3 preserved (each consumer-PRD integration is a Scope 3 seam) | N |

### Load-bearing unexpected findings

1. **AI Toolbox sidebar section removed via undocumented code comment** ([src/components/shells/Sidebar.tsx:487](../src/components/shells/Sidebar.tsx#L487)). Originally classified Scope-Creep-Evaluate pending founder direction. Founder clarified 2026-04-20: demo-time decision, not a permanent architectural choice. Convention #80 reaffirmed. Consolidated into SCOPE-2.F45 — Unintentional-Fix-Code Medium (restore per founder "ideal even now honestly"). Remediation: rebuild sidebar section consuming `lila_tool_permissions`.

2. **Settings is a route, not an overlay, with explicit deferral comment** ([src/components/settings/SettingsProvider.tsx:6,29-33](../src/components/settings/SettingsProvider.tsx#L6)). Founder-level UX annoyance signal 2026-04-20: "Mom should not lose her place. Basically anywhere. That is annoying." Severity elevated Low → Medium per F36 user-demand precedent. Consolidated into SCOPE-2.F50.

3. **Higgins display name seed registry drift** ([00000000000007_lila_ai_system.sql:233-234](../supabase/migrations/00000000000007_lila_ai_system.sql#L233)). Two-layer divergence — QuickTasks submenu matches PRD ("Help Me Say Something"), `lila_guided_modes.display_name` column does not ("What to Say"). Consolidated into SCOPE-2.F55. One-line UPDATE migration.

4. **`board_personas` schema split not implemented** (PRD-34-Cross-PRD-Impact-Addendum §Platform Intelligence Pipeline v2). Founder accepted verdict as-is 2026-04-20. RLS + `persona_type` row-level isolation functional; schema split deferred until Channel D community-persona promotion pipeline runs. Consolidated into SCOPE-2.F47.

5. **PRD-23 Cross-PRD Impact Addendum references obsolete `bookshelf_principles` table name.** Base PRD-23 and code both use `bookshelf_insights`. Same pattern as F21 (addendum-properly-captured supersession). Consolidated into SCOPE-2.F56.

6. **`SemanticSearchPanel` `useSemanticSearch()` app-wide hook has zero external consumers** (PRD-23-Session-Addendum §4). Founder reaffirmed 2026-04-20: "Would like semantic search to be useable whenever/wherever it would be valuable." Hook architecture correct; per-consumer build phases drive adoption. Consolidated into SCOPE-2.F57 with PATTERN-FLAG-FOR-SCOPE-3.

### Cross-references

- CROSS-REF: CLAUDE.md Convention #80 ("AI Vault = storefront, AI Toolbox = personalized launcher") reaffirmed as authoritative per founder 2026-04-20 — anchors F45 Unintentional-Fix-Code override
- CROSS-REF: SCOPE-2.F1 (Foundation tier monetization unbuilt) + SCOPE-2.F9 (LiLa Optimizer unbuilt) + SCOPE-2.F19 (Family Celebration unbuilt) — F48 (Admin Console) + F49 (Engagement) share the same beta-deferred-Medium shape
- CROSS-REF: SCOPE-2.F36 (PRD-25 Guided LiLa tools user-demand elevation Low→Medium) — F45 AI Toolbox restoration + F50 Settings overlay both invoke the same elevation pattern ("ideal even now honestly" / "mom should not lose her place")
- CROSS-REF: SCOPE-2.F21 (PRD-18 teen rhythm addendum-properly-captured supersession) — F56 BookShelf addendum drift uses identical shape (base-PRD pointer amendment, not rewrite)
- CROSS-REF: SCOPE-2.F9 (PRD-05C Optimizer infrastructure unbuilt) — F52 (Optimize with LiLa) + F53 (Skill Deploy with LiLa) both bundled with F9 build
- CROSS-REF: SCOPE-8a.F2 (data-lifecycle compliance scope) — F51 originally had R4 (account deletion) + R5 (data export) sub-rows Medium compliance-adjacent; founder amendment 2026-04-20 deprioritized both to Low. Manual deletion workflow documentation carried forward as open flag
- CROSS-REF: SCOPE-8a.F4 (Translator crisis exemption closed) + SCOPE-8a.F5 (BoD content-policy fail-open closed) — both referenced in PRD-34 R4/R6 evidence as closed, not re-emitted
- CROSS-REF: SCOPE-5.F4 Finding G (Vault delivery methods reconciled) — PRD-21A R8 evidence cited, not re-emitted
- PATTERN-FLAG-FOR-SCOPE-3: AI Toolbox pattern recurs across PRD-21 (default tools), PRD-21A (Vault +Add to Toolbox), PRD-21C (`saved_prompt_id` share-from-my-prompts), PRD-34 (ThoughtSift tool assignment) — Scope 3+8b evidence pass should examine Toolbox integration as a cross-PRD pattern rather than single-PRD drift
- PATTERN-FLAG-FOR-SCOPE-3: `SemanticSearchPanel` integration map — 7 downstream consumer PRDs (PRD-05/07/08/09A/12A/16/19/20) each have their own seam to wire

### Founder adjudication

- **F45 AI Toolbox sidebar restoration:** Worker classified Scope-Creep-Evaluate pending founder direction; founder 2026-04-20 overrode worker's "codify removal" recommendation and directed restoration. Context: the sidebar removal at [Sidebar.tsx:487](../src/components/shells/Sidebar.tsx#L487) was a demo-time decision, not a permanent architectural choice. Convention #80 ("AI Vault = storefront, AI Toolbox = personalized launcher") remains authoritative. Current production state preserved (AI Vault in all adult/Independent dashboards; mom-only commenting preserved as privacy boundary). Future-state clarification: not all tools are designed for non-mom members, so mom will opt family in per tool — which is precisely why the per-member curated Toolbox launcher matters. Classification flips to Unintentional-Fix-Code. Severity Medium per F36 active-demand precedent ("ideal even now honestly"). Remediation: rebuild sidebar section consuming `lila_tool_permissions`, honor `source='default'` (PRD-21 starter 8 tools) + `source='vault'` (Vault-assigned tools) + future `saved_prompt_id` rendering (PRD-21C shared LiLa-customized prompts).

- **F46 ThoughtSift `/thoughtsift` route removal:** Worker classified Deferred-Document pending founder direction; founder 2026-04-20 overrode worker's "build landing page" recommendation and directed route removal. Context: ThoughtSift tools live in AI Vault and launch from the ThoughtSift QuickTasks submenu already. The sidebar route with placeholder was scope creep — PRD-34 never specified a landing page. Classification flips to Unintentional-Fix-Code. Remediation: delete `<Route path="/thoughtsift">` in [src/App.tsx:178](../src/App.tsx#L178), remove `ThoughtSiftPage` export from [src/pages/placeholder/index.tsx:62-64](../src/pages/placeholder/index.tsx#L62), confirm no remaining sidebar nav entries reference `/thoughtsift`.

- **F47 `board_personas` schema split:** Founder accepted verdict as-is 2026-04-20. PRD-34 Cross-PRD Impact Addendum §Platform Intelligence Pipeline v2 specifies system/community-tier personas in `platform_intelligence` schema + `personal_custom` in `public` schema; migration `00000000100049` ships all personas as single public table with `persona_type` row-level tagging. RLS policies enforce ownership correctly (personal Grandma Rose personas stay private). Schema split matters when Channel D community-persona promotion pipeline runs (someone creates Gandalf → moderation approves → becomes available to all families). Remediation deferred until Channel D build.

- **F48 Admin Console unbuilt:** Founder confirmed 2026-04-20 "F48 and F49 are not built yet. Correct." Matches F1 (tier monetization) + F9 (Optimizer) + F19 (Family Celebration) beta-deferred-Medium pattern. Every Vault content change currently requires migration/SQL edits. 17 seeded `vault_items` rows all arrived via migrations. Remediation: build Admin Console Shell (`/admin` route + tab nav + `staff_permissions` gating) as one unit; all 6 PRD-21B screens land together. No urgent near-term signal.

- **F49 Vault Engagement unbuilt:** Founder confirmed 2026-04-20 same signal. All 6 engagement tables absent; denormalized counters on `vault_items` migrated but nothing writes to them (always read 0). Preserves mom-only commenting posture per current product direction — non-mom members do not comment, keeping discussion space mom-exclusive. Partial forward-prep complete: `shared_with_member_id` + `saved_prompt_id` columns wired for future share-from-my-prompts flow.

- **F50 PRD-22 Settings overlay + embeds deferred:** Severity elevated to Medium per founder 2026-04-20 UX-annoyance direction: "Mom should not lose her place. Basically anywhere. That is annoying." Active-demand signal matches F36 precedent. Consolidates PRD-22 R1 (Settings page vs overlay) + R2 (Permission Hub embed) + R3 (Calendar/Messaging/Notification/LiLa Context Settings embeds). PRD-22 Screens 5/6/8/9 all exist as standalone surfaces; PRD-22 overlay + embedded Permission Hub + Calendar Settings + Messaging Settings + Notification Preferences + LiLa Context Settings all land together during PRD-22 build. [SettingsProvider.tsx:6](../src/components/settings/SettingsProvider.tsx#L6) explicit deferral comment documents the waypoint. Founder enhancement direction captured as open flag: during "View As" mode, inline permission grant/revoke embeds on each feature page she navigates to — scope addition beyond base PRD-22, post-audit product workstream.

- **F51 PRD-22 minor screens founder-deprioritized:** Consolidates PRD-22 R4 (account deletion) + R5 (data export) + R6 (multi-email) + R7 (LiLa preferences) per founder direction 2026-04-20. Four distinct founder amendments: (a) account deletion — NO self-serve deletion; users cancel subscriptions with data preserved; manual deletion with grace period only on request — PRD-22 Screen 2 spec amended; (b) data export — "not the biggest priority for me. My focus is making things as great as they can be while on the app"; (c) multi-email — "not too worried yet"; (d) LiLa Preferences UI — "should probably be built when we build the core lila features that I believe are still unbuilt," bundling with F9 PRD-05C Optimizer build queue. Severity dropped from per-row Medium (R4/R5 originally compliance-adjacent) to Low via founder deprioritization. Manual deletion workflow documentation flagged as open flag for Phase 3 — beta users need a visible account-closure path even if the mechanism is "email Tenise."

- **F52 Optimize with LiLa stub:** Founder did not specifically address, accepted worker's Deferred-Document Low verdict by inference (grouping with LiLa build). Bundle with F9 PRD-05C Optimizer build. `OptimizeButton` at [PromptPackDetail.tsx:148-168](../src/features/vault/components/detail/PromptPackDetail.tsx#L148) is an explicit STUB with "coming soon" tooltip and TODO comment. Archives side wired; dependency-gated.

- **F53 Deploy with LiLa stub:** Same shape as F52. Gated on F9 PRD-05C Optimizer + External Tool Registry infrastructure (PRD-05C + PRD-19 per PRD-21A Forward Note). Premium skill-personalization flow + session report re-import pipeline bundled.

- **F54 Skill-check mode missing:** Founder direction 2026-04-20: "isn't necessary yet... eventually I'd like them to be able to utilize this, and be coached through finding their own words to use." Confirms PRD-21 spec intent (make-itself-unnecessary coaching flow). Core craft-first flow in `lila-cyrano` + `lila-higgins-say` wired; skill-check 5+-interaction branch is advanced-stage polish. Add to STUB_REGISTRY during remediation queue (not currently tracked).

- **F55 Higgins display name seed drift:** One-line UPDATE migration — cheapest fix in batch. `lila_guided_modes.display_name` seeds "What to Say" / "How to Navigate"; PRD-21 + QuickTasks submenu both specify "Help Me Say Something" / "Help Me Navigate This." Two-layer divergence: user-visible QuickTasks correct; conversation history + mode switcher + any future registry-driven UI wrong. Remediation: `UPDATE lila_guided_modes SET display_name` for the two `mode_key` rows.

- **F56 PRD-23 addendum insights rename drift:** Same pattern as F21 — addendum-properly-captured supersession with base-PRD pointer amendment, not rewrite. Base PRD-23 §Data Schema L623-657 says `bookshelf_insights`; code ships `bookshelf_insights`; Cross-PRD Impact Addendum at lines 36-46, 172-180 references obsolete `bookshelf_principles`. One-line addendum text amendment.

- **F57 `SemanticSearchPanel` cross-feature forward notes:** Founder direction 2026-04-20: "Would like semantic search to be useable whenever/wherever it would be valuable to user." Confirms PRD-23-Session-Addendum §4 integration map (8 features). Hook + panel architecture correct. Each consumer wires during its own feature build phase. PATTERN-FLAG-FOR-SCOPE-3 preserved — each consumer integration is a Scope 3 seam, not a Scope 2 per-PRD drift.

### Emission list

Findings to emit (13 total):

- SCOPE-2.F45 — PRD-21 AI Toolbox sidebar restoration (Medium, Unintentional-Fix-Code, Beta N; founder override from worker's Scope-Creep-Evaluate codify recommendation to Unintentional-Fix-Code restore per "ideal even now honestly"; Convention #80 reaffirmed)
- SCOPE-2.F46 — PRD-34 ThoughtSift `/thoughtsift` route removal (Low, Unintentional-Fix-Code, Beta N; founder override from worker's Deferred-Document build-landing-page recommendation to route-removal revert)
- SCOPE-2.F47 — PRD-34 `board_personas` schema split missing (Low, Unintentional-Fix-Code, Beta N; deferred until Channel D build)
- SCOPE-2.F48 — PRD-21B Admin Console unbuilt (Medium, Deferred-Document, Beta N; beta-deferred per F1/F9/F19 pattern)
- SCOPE-2.F49 — PRD-21C Vault Engagement layer unbuilt (Medium, Deferred-Document, Beta N; mom-only commenting privacy posture preserved)
- SCOPE-2.F50 — PRD-22 Settings overlay + embeds deferred (Medium, Deferred-Document, Beta N; severity elevated per founder "mom should not lose her place" annoyance; consolidates PRD-22 R1+R2+R3)
- SCOPE-2.F51 — PRD-22 minor screens deprioritized by founder (Low, Deferred-Document, Beta N; consolidates PRD-22 R4+R5+R6+R7; no self-serve account deletion per founder amendment)
- SCOPE-2.F52 — PRD-21A Optimize with LiLa stub (Low, Deferred-Document, Beta N; gated on F9 PRD-05C Optimizer build)
- SCOPE-2.F53 — PRD-21A Deploy with LiLa skill stub (Low, Deferred-Document, Beta N; gated on F9 + External Tool Registry)
- SCOPE-2.F54 — PRD-21 skill-check mode missing for Cyrano + Higgins Say (Low, Deferred-Document, Beta N; founder "eventually... coached through finding their own words")
- SCOPE-2.F55 — PRD-21 Higgins display name seed registry drift (Low, Unintentional-Fix-Code, Beta N; one-line UPDATE migration)
- SCOPE-2.F56 — PRD-23 Cross-PRD Impact Addendum `bookshelf_principles`→`bookshelf_insights` rename drift (Low, Unintentional-Fix-PRD, Beta N; same pattern as F21 base-PRD pointer amendment)
- SCOPE-2.F57 — PRD-23 `SemanticSearchPanel` app-wide hook zero external consumers (Low, Deferred-Document, Beta N; per-consumer wiring during each feature PRD build phase; PATTERN-FLAG-FOR-SCOPE-3)

No Batch 7 hygiene notes. No new Scope 4 emissions from this batch (cross-scope carry-forwards logged in open flags below).

### Open flags (tech-debt + cross-scope register)

1. **F45 user-demand elevation — AI Toolbox sidebar restoration is next-build priority.** Founder direction 2026-04-20 "ideal even now honestly" elevates sidebar rebuild from academic concern to real product gap. Convention #80 reaffirmed as authoritative. Bundle with forward-looking work on per-member tool curation (mom opts family in per tool).

2. **F50 user-demand elevation — Settings overlay context preservation.** Founder direction 2026-04-20 "mom should not lose her place. Basically anywhere. That is annoying" marks PRD-22 Settings build as UX-urgent. Bundle Settings overlay + embeds into one build; PRD-22 build kickoff surfaces this alongside F51 LiLa Preferences sub-concern.

3. **View-As inline permissions enhancement** — founder expressed post-audit product direction 2026-04-20: "When doing a 'View As' for any member, it would be especially great if she went to a feature, and it allowed her to click an embedding to grant/revoke permissions from there." Scope addition beyond base PRD-22. Post-audit product workstream; flag during PRD-22 build kickoff pre-build audit.

4. **Manual account deletion workflow documentation.** Founder direction 2026-04-20: "If they contact us to remove their data/account, then we would do that with the grace period." `account_deletions` table with grace period columns migrated; manual admin-triggered deletion is the process. Beta users need a visible path (e.g., Settings → account help → "how do I close my account?" copy pointing to support email). Phase 3 doc-hygiene triage.

5. **F52 + F53 bundle with F9 PRD-05C Optimizer build.** Both Vault premium LiLa actions (Optimize + Deploy) gated on PRD-05C Optimizer Edge Function + External Tool Registry infrastructure.

6. **F51 PRD-22 LiLa Preferences UI sub-concern bundles with broader LiLa core build queue.** Founder direction 2026-04-20: "should probably be built when we build the core lila features that I believe are still unbuilt." Group with F9 Optimizer + F50 Settings for single build sequence.

7. **F48 + F49 beta-deferred matching F1/F9/F19 pattern.** Admin Console + Engagement layer both large beta-deferred surfaces. Close together when you decide the Vault is worth admin-managed authoring + the community is worth social proof.

8. **PATTERN-FLAG-FOR-SCOPE-3 — AI Toolbox cross-PRD integration pattern.** Toolbox pattern recurs across PRD-21 (default 8 tools), PRD-21A (Vault +Add to Toolbox), PRD-21C (`saved_prompt_id` share-from-my-prompts), PRD-34 (ThoughtSift tool assignment). Scope 3+8b evidence pass for PRD-21 Cross-PRD addendum should examine Toolbox integration as cross-PRD pattern rather than single-PRD drift.

9. **PATTERN-FLAG-FOR-SCOPE-3 — `SemanticSearchPanel` cross-feature consumer integration.** 8 downstream consumer PRDs each have their own seam to wire (PRD-05/07/08/09A/12A/16/19/20). Not Scope 2 single-PRD drift.

10. **STUB_REGISTRY add recommendation for F54 Skill-check mode.** Not currently registry-tracked. Add during remediation queue alongside F32 `col_span` recommendation (Round 5 open flag #3) — same shape, both "spec'd feature, zero code adoption, no registry entry."

11. **`BookShelfStub.tsx` dead code.** PRD-23 R6 evidence notes [src/pages/BookShelfStub.tsx](../src/pages/BookShelfStub.tsx) exists but no route points to it — `/bookshelf` routes to real `BookShelfPage`. Minor cleanup opportunity, not a Scope 2 finding. Phase 3 doc-hygiene.

## Round 8 — Gamification evidence pass (Batch 8, PRDs 24, 24A, 24B)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_8_gamification.md](EVIDENCE_BATCH_8_gamification.md)
- **Aggregate:** 22 rows across 3 PRDs (PRD-24: 12, PRD-24A: 5, PRD-24B: 5). 7 ambiguity flags. 5 unexpected findings. 6 worker-proposed candidates expanded to 8 during walk-through (F41 split into F41a/F41b/F41c per founder direction).

### Per-candidate-finding verdict table

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD24-REWARD-ECONOMY-UNBUILT | PRD-24 R1, R2, R3, R4, R5, R7; PRD-24A R4 | Deferred-Document | Medium | SCOPE-2.F39 | Confirmed Medium, shifted from F1/F9 "when paid tiers ship" pattern → F22/F34 "near-term roadmap, lego piece plugs into everything" pattern. Founder direction 2026-04-20: "Reward economy, that should be a lego piece as well, that can plug into any/all relevant lists, tasks, routines, best intentions, goals, etc." Remediation scope expands beyond PRD-24 Screen 3 reward menu — reward containment as cross-feature connector. 7 tables still planned (per founder "We do still plan to have a lot of the other tables, most all of those"). Build M deferred this as baby-step scope cut per feature decision file §6; build kicks off when founder prioritizes reward economy onto the active queue. | N |
| PRD24-PIPELINE-BUILD-M-SUPERSESSION | PRD-24 R9, R10 | Intentional-Document | Low (orchestrator severity override from worker's Medium) | SCOPE-2.F40 | Confirmed Intentional-Document; severity downgraded to Low per F21 precedent (PRD-18 teen rhythm — same "PRD staleness harms future contributors" rationale resolved Low, not Medium). Conventions #198–207 + #221 captured Build M's 11-step RPC pipeline + 6-section settings modal supersession. PRD-24 §Gamification Event Pipeline L596-623 + §Screen 8 Settings Panel L462-502 get pointer amendment citing Conventions #198–222, not rewrite. | N |
| PRD24A-DASHBOARD-BACKGROUNDS-SUPERSEDED | PRD-24A R1 (dashboard_backgrounds + background_library subset) | Intentional-Document | Low | SCOPE-2.F41a | Confirmed — clean F21/F38 addendum supersession pattern. Founder direction 2026-04-20: "The only thing we kind of changed was the sticker book background pages instead of the background being an overlay/background for the entire dashboard." Sticker Book pages (gamification_sticker_pages 26 rows) replace PRD-24A's dashboard_backgrounds + background_library (13 seeded backgrounds). Conventions #198–207 capture the replacement. PRD-24A §Data Schema L1122-1139 + L1232-1252 get pointer amendment. | N |
| PRD24A-OVERLAY-ENGINE-DEFERRED-INDEFINITELY | PRD-24A R1 (overlay_instances + overlay_collectibles + recipe_completions subset) | Deferred-Document | Medium | SCOPE-2.F41b | Confirmed — founder direction 2026-04-20: "The overlay engine I'd like to pause on, I don't want it deleted forever, but I do want it deferred as an idea to possibly implement at a much later date. Maybe never..." Distinct from F41c — overlay engine specifically (dashboard-wide narrative game layer with 4-stage progression, category-to-collectible mapping, stage evolution animations) is paused indefinitely. Sticker Book substitutes as the kid-facing mechanic. STUB_REGISTRY entry with "deferred indefinitely — possibly never" framing; feature decision file documents Override #1 (Sticker Book replaces overlay 4-stage progression). Not near-term; not deleted. | N |
| PRD24A-THEMES-GAME-MODES-ROADMAP | PRD-24A R2, R3, R5; PRD-24A-Game-Modes-Addendum (boss_quests, bingo_cards, evolution_creatures, passport_books tables) | Deferred-Document | Medium | SCOPE-2.F41c | Confirmed — F22/F34 near-term roadmap pattern. Founder direction 2026-04-20: "All of the other themes and game modes are still needing to be built. They need to be on the roadmap. All of those... Ideally, some of the same images made in each theme can be used in different ways for different game modes, so woodland felt could be a bingo theme, or a recipe thing at some point, or a sized collection by however much they accomplish that day, etc." 5 launch visual themes (Pets, Apothecary Bottles, Dragons, Pixel Loot, Mythical Creatures) + 7 game modes (Daily Growth, Category Collection, Recipe & Quest, Stamp Passport, Streak Evolution, Boss Battle/Party Quest, Family Bingo) + 4 Game Modes Addendum tables (boss_quests, bingo_cards, evolution_creatures, passport_books) + LiLa bingo/boss/passport generation all on active roadmap. Woodland Felt asset reuse across game modes confirmed as founder architectural intent (modular Visual Theme × Game Mode per PRD-24A). STUB_REGISTRY L239-243 "Post-MVP" entries upgraded to "active roadmap" framing. | N |
| PRD24B-REVEAL-LIBRARY-NEEDS-CROSS-FEATURE-WIRING | PRD-24B R1, R2, R4, R5 | Unintentional-Fix-Code (orchestrator classification flip from worker's Deferred-Document) | Medium | SCOPE-2.F42 | Flipped from Deferred-Document to Unintentional-Fix-Code per founder direction 2026-04-20: "The gamification reveal library needs to be connected as additional lego pieces to different tasks or streams of tasks. So mom can have an opportunity list, or a sequential list, and every [choose number] they can do a reveal for a prize, or mom can have a randomized list of consequences and decide whether she wants that hooked to a card reveal, the doors, scratch off, or spinner, or a rotation of all of those... It has not been wired, but all of the pieces of the app should work together like buildable blocks that can connect at several points or at any point with each other. A routine could have one item on it connected to a sequential list, another attached to a randomized opportunity list, etc. It is not currently that way, but it needs to be. asap." Active builder direction to wire as cross-feature connector — severity Medium, NOT delete dead code. 4 CSS/SVG reveals (CardFlipReveal, ThreeDoorsReveal, SpinnerWheelReveal, ScratchOffReveal) + 4 micro-celebrations (PointsPopup, StreakFire, LevelUpBurst, BackgroundCelebration) + StarChartAnimation + TreasureBoxIdle + ReadabilityGradient all need production wire-up. Open architectural question flagged to pre-build: reward-reveals/ parallel architecture (reward_reveals + reward_reveal_attachments + reveal_animations 33 rows + earned_prizes + congratulations_messages) — does the wiring merge reward-reveals/ + gamification/reveals/ into single lego-piece architecture, or coexist for different purposes? Pre-build decision required before F42 implementation kicks off. | N |
| PRD24B-COLOR-REVEAL-NEEDS-FULLER-ARCHITECTURE | PRD-24B R3 | Unintentional-Fix-Code (orchestrator classification flip from worker's Intentional-Document) | Medium | SCOPE-2.F43 | Flipped from Intentional-Document to Unintentional-Fix-Code per founder direction 2026-04-20: "I would like color reveal to also be able to connect to multiple tasks [click all that apply] or attach to streaks, book chapters, or any type of list etc. It would again be like a lego piece connector that mom can connect anywhere to anything..." Build M Conventions #211–213 (1:1 task-linked tally counter, 4-field config, 6 step-count variants) are NOT the end state — they were a baby-step simplification. PRD-24B Screen 10's original model (any achievement source + Sequential/Gradual/Random strategies + complexity 1-5 with 3-100 zones) needs to be rebuilt AND expanded (multi-task click-all-that-apply, streak milestones, book chapter completions, any list type). Conventions #211–213 need amendment/retirement when full lego-connector architecture ships. Severity Medium (active builder demand, cross-feature integration). | N |
| PRD24-SCREENS-UNBUILT | PRD-24 R6, R7, R8, R11 | Unintentional-Fix-Code | Low | SCOPE-2.F44 | Confirmed — same shape as F2/F16/F32 gate-adoption pattern. Schema supports 5 Points widget visualization modes (Counter, Level, Progress Ring, Minimal Badge, Hidden); code ships Counter only (Play-only). `gamification_level` column dormant — no level threshold logic. Family Leaderboard widget type registered in [src/types/widgets.ts:389](../src/types/widgets.ts#L389) but percentage-based ranking + period toggle + Play collaborative framing missing. Fix when roadmap-relevant; surfaces naturally during F39 reward economy build. | N |

### Load-bearing unexpected findings

1. **PRD-24B's 4 CSS/SVG reveal components + 4 micro-celebrations are architectural dead-code today** — ~500 lines of production-quality shell-aware React code consumed only by `/dev/gamification` demo. Founder-directed 2026-04-20 to wire as cross-feature lego connector (F42), NOT delete. [RewardRevealModal.tsx:314](../src/components/reward-reveals/RewardRevealModal.tsx#L314) placeholder comment ("For now, render a generic animation. Phase 4 or later can wire the named components") is the explicit hook point. Consolidated into SCOPE-2.F42.

2. **`gamification_configs` shipped full PRD-24 schema but 80% of columns dormant** — `visualization_mode`, `bonus_at_three`, `bonus_at_five`, `routine_points_mode`, `streak_schedule_aware`, `streak_pause_enabled`, `streak_paused`, `streak_paused_at`, `level_thresholds` all read zero times. Consolidated into SCOPE-2.F44 SCREENS-UNBUILT. Founder roadmap intent (per F41c) restores these columns to active roadmap as the broader gamification system expands.

3. **Parallel reveal-library architectures** — `src/components/gamification/reveals/` (PRD-24B demo-only) vs `src/components/reward-reveals/` (production, 5 tables, 33 `reveal_animations` seeded). Founder direction 2026-04-20 reshapes this from "delete dead code" to "wire both into cross-feature lego architecture." Pre-build architectural question flagged into F42 open flag #2 — reconciliation decision required before F42 implementation kicks off.

4. **Build M's Color Reveal simplification is NOT the end state** — Conventions #211–213 shipped a 1:1 task-linked tally model; founder wants the original PRD-24B Screen 10 any-source-with-strategies model PLUS multi-task + streaks + book chapters + any list. Flipped SCOPE-2.F43 to Unintentional-Fix-Code. Conventions need amendment when full architecture ships.

5. **LiLa bingo/boss/passport generation (PRD-24A Cross-PRD Addendum §PRD-05) structurally impossible today** — no `boss_quests` / `bingo_cards` / `passport_books` tables, no Edge Function in `supabase/functions/`, no `lila_guided_modes` rows. Cascading absence from F41c. Builds back when overlay-adjacent game modes enter roadmap queue. Flag preserved in open flag #5.

### Cross-references

- CROSS-REF: SCOPE-5.F4 Finding F (Build M silent delivery — registry updated during Scope 5 walk-through) cited by F39, F40, F41a/b/c; not re-emitted per §7 Rule 7
- CROSS-REF: SCOPE-5.F4 (task unmark cascade known gap, Convention #206; randomizer mastery gap, Convention #205) cited by F39 remediation scope; registry entries stand, not re-emitted
- CROSS-REF: SCOPE-2.F1 + SCOPE-2.F9 (Foundation/LiLa tier-monetization unbuilt pattern) — F39 shares shape but shifted to F22/F34 near-term roadmap pattern per founder direction
- CROSS-REF: SCOPE-2.F19 + SCOPE-2.F22 + SCOPE-2.F34 (near-term-build-priority pattern with product-timing note) — F39, F41c anchor to this precedent
- CROSS-REF: SCOPE-2.F21 + SCOPE-2.F38 (addendum-captured supersession → Low severity, pointer amendment) — F40, F41a anchor to this precedent
- CROSS-REF: SCOPE-2.F2 + SCOPE-2.F16 + SCOPE-2.F32 (column-wired-UI-absent gate-adoption pattern) — F44 anchors to this precedent
- CROSS-REF: CLAUDE.md Conventions #198–222 (Build M + Configurable Earning Strategies expansion) anchor F40, F41a supersession evidence bar per §4.3.2
- CROSS-REF: CLAUDE.md Conventions #211–213 (Color Reveal simplification) flagged for amendment/retirement when F43 ships — Conventions are NOT final per founder direction
- CROSS-REF: STUB_REGISTRY L239-243 (Family Challenges / Boss Quests / Bingo Cards / Evolution Creatures / Passport Books "Post-MVP") upgrade to "active roadmap" per F41c
- **PATTERN-FLAG-FOR-SCOPE-3: Gamification-as-lego-pieces cross-feature composability** — founder architectural principle 2026-04-20: "all of the pieces of the app should work together like buildable blocks that can connect at several points or at any point with each other." Reward economy + Reveal Library + Color Reveal + Treasure Box + Gamification earning modes all need to compose across tasks, lists, routines, best intentions, goals, book chapters, streaks. Scope 3+8b integration-traversal should evaluate as a platform architectural pattern rather than single-PRD drift; candidate for CLAUDE.md convention after batch closes.
- **PATTERN-FLAG-FOR-SCOPE-3: PRD-05 ↔ PRD-24A LiLa generation seam** — bingo/boss/passport generation cascading absence resolves when F41c builds kick off; cross-PRD traversal should verify LiLa context-assembler hooks land alongside the write-target tables.

### Founder adjudication

- **F39 Reward economy unbuilt — near-term lego-piece connector:** 7 of PRD-24's 8 tables absent + 6 screens absent + DailyCelebration Step 3/4 auto-skipped. Founder direction 2026-04-20: "Reward economy, that should be a lego piece as well, that can plug into any/all relevant lists, tasks, routines, best intentions, goals, etc." Shifted from F1/F9 "when paid tiers ship" pattern to F22/F34 "near-term roadmap with cross-feature composability" pattern. Remediation scope: not just Screen 3 reward menu — reward containment + treasure box + reward redemption as cross-feature connectors that plug into any task/list/routine/best-intention/goal source. Build when founder prioritizes onto active queue.

- **F40 PRD-24 pipeline + settings supersession:** Conventions #198–207 + #221 captured the architectural pivot. PRD-24 text stays with pointer amendment citing Conventions, not rewrite. F21 precedent anchors Low severity (addendum properly captured). Worker proposed Medium; orchestrator override to Low matches F21 "addendum-captured supersession does not harm more than text-stale other PRDs" reasoning.

- **F41a PRD-24A dashboard backgrounds → Sticker Book pages:** Clean subset supersession. Founder direction: "The only thing we kind of changed was the sticker book background pages instead of the background being an overlay/background for the entire dashboard." `dashboard_backgrounds` + `background_library` specifically replaced by `gamification_sticker_pages`. Conventions #198–207 capture. PRD-24A §Data Schema L1122-1139 + L1232-1252 pointer amendment. Low severity per F21/F38 precedent.

- **F41b PRD-24A overlay engine deferred indefinitely:** Founder direction: "The overlay engine I'd like to pause on, I don't want it deleted forever, but I do want it deferred as an idea to possibly implement at a much later date. Maybe never..." Distinct shape from F41c — dashboard-wide narrative game layer with 4-stage progression paused indefinitely. Sticker Book substitutes. STUB_REGISTRY add with "deferred indefinitely — possibly never" framing to distinguish from active-roadmap F41c entries. Not deleted, not near-term. Medium severity acknowledges the scope of architecture paused (3 tables: overlay_instances + overlay_collectibles + recipe_completions + entire engine concept).

- **F41c PRD-24A themes + game modes on active roadmap:** Founder direction: "All of the other themes and game modes are still needing to be built. They need to be on the roadmap. All of those." 5 launch visual themes (Pets, Apothecary Bottles, Dragons, Pixel Loot, Mythical Creatures) + 7 game modes (Daily Growth, Category Collection, Recipe & Quest, Stamp Passport, Streak Evolution, Boss Battle, Family Bingo) + Game Modes Addendum tables (boss_quests, bingo_cards, evolution_creatures, passport_books) + LiLa bingo/boss/passport generation. F22/F34 near-term-roadmap pattern. Additional founder architectural intent: Woodland Felt asset reuse across game modes (bingo theme, recipe mode, sized collection) — confirms modular Visual Theme × Game Mode per PRD-24A design. STUB_REGISTRY L239-243 Post-MVP entries upgrade to "active roadmap."

- **F42 PRD-24B reveal library needs cross-feature wiring:** Founder direction explicitly flips the "delete dead code" read to "wire it as cross-feature lego." Opportunity list every N completions → reveal, sequential list milestone → reveal, randomized consequence list → card/door/scratch-off/spinner or rotation, routine with mixed connectors (sequential item + randomized item). Classification flipped to Unintentional-Fix-Code, severity Medium. Pre-build architectural question: reward-reveals/ parallel architecture (5 tables, 33 reveal_animations rows) needs reconciliation with gamification/reveals/ — either merge into one lego library or preserve both for different purposes. Decision required before F42 build kicks off.

- **F43 PRD-24B Color Reveal needs fuller architecture:** Founder direction: "I would like color reveal to also be able to connect to multiple tasks [click all that apply] or attach to streaks, book chapters, or any type of list etc. It would again be like a lego piece connector that mom can connect anywhere to anything..." Build M Conventions #211–213 NOT final — they were baby-step simplification. Classification flipped to Unintentional-Fix-Code, severity Medium. Full architecture restores PRD-24B Screen 10 rich model (any achievement source + Sequential/Gradual/Random strategies + complexity 1-5 with 3-100 zones) AND expands to multi-task click-all-that-apply, streak milestones, book chapter completions, any list type. Conventions #211–213 amendment/retirement when F43 ships.

- **F44 PRD-24 screen features unbuilt:** Schema-ready, code-dormant. 5 visualization modes → 1 ships, `gamification_level` unused, Family Leaderboard widget generic scaffolding. F2/F16/F32 gate-adoption pattern. Fix when roadmap-relevant; surfaces naturally during F39 reward economy build.

### Emission list

Findings to emit (8 total):
- SCOPE-2.F39 — PRD-24 reward economy unbuilt — near-term lego-piece connector (Medium, Deferred-Document, Beta N; F22/F34 near-term roadmap pattern; cross-feature composability remediation scope)
- SCOPE-2.F40 — PRD-24 pipeline + settings panel superseded by Build M (Low, Intentional-Document, Beta N; F21 precedent; pointer amendment per Conventions #198–222)
- SCOPE-2.F41a — PRD-24A dashboard backgrounds → Sticker Book pages (Low, Intentional-Document, Beta N; SUPERSEDES Conventions #198–207)
- SCOPE-2.F41b — PRD-24A overlay engine deferred indefinitely (Medium, Deferred-Document, Beta N; founder "pause, maybe never"; STUB_REGISTRY entry with "deferred indefinitely" framing)
- SCOPE-2.F41c — PRD-24A themes + game modes + Game Modes Addendum tables on active roadmap (Medium, Deferred-Document, Beta N; F22/F34 near-term roadmap pattern; STUB_REGISTRY L239-243 Post-MVP → active roadmap upgrade)
- SCOPE-2.F42 — PRD-24B reveal library needs cross-feature lego wiring (Medium, Unintentional-Fix-Code [classification flip from Deferred-Document], Beta N; reward-reveals/ architecture reconciliation as pre-build question)
- SCOPE-2.F43 — PRD-24B Color Reveal needs fuller lego-connector architecture (Medium, Unintentional-Fix-Code [classification flip from Intentional-Document], Beta N; Conventions #211–213 amendment when F43 ships)
- SCOPE-2.F44 — PRD-24 screen features unbuilt (Low, Unintentional-Fix-Code, Beta N; F2/F16/F32 gate-adoption pattern)

No Batch 8 hygiene notes. No new Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

**Finding-number placeholder note:** F39–F46 placeholder range used here. Batches 6 + 7 closed earlier in the same session and absorbed F39–F{N} ranges; actual final numbering shifts once apply-phase renumbers at Stage C close. Candidate IDs (SCOPE-2.F{PENDING}-CANDIDATE-...) are the cross-reference keys until renumbering lands.

### Open flags (tech-debt + cross-scope register)

1. **"Gamification-as-lego-pieces" cross-feature composability pattern** — founder architectural principle 2026-04-20. Reward economy + Reveal Library + Color Reveal + Treasure Box + Gamification earning modes all need to compose across tasks, lists, routines, best intentions, goals, book chapters, streaks. PATTERN-FLAG-FOR-SCOPE-3 preserved. Candidate for CLAUDE.md convention after batch closes. Scope 3+8b integration-traversal should evaluate as platform architectural pattern rather than single-PRD drift.

2. **F42 reward-reveals/ vs gamification/reveals/ architectural reconciliation** — pre-build decision required before F42 implementation. Options: (a) merge both into unified lego reveal library; (b) preserve both for distinct purposes with documented scope boundaries; (c) retire gamification/reveals/ once reward-reveals/ expands to cover PRD-24B's 8-type flat catalog. Not Scope 2 scope to decide; flagged as F42 pre-build gate.

3. **F43 Conventions #211–213 amendment/retirement** — when F43 full lego-connector architecture ships, Conventions #211 (1:1 task-linked tally counter), #212 (4-field config), #213 (32 Woodland Felt subjects) need amendment to cite the new multi-source model. STUB_REGISTRY color-reveal entry updates from "deferred expansion" to "wired as cross-feature connector" at build completion.

4. **F41c STUB_REGISTRY L239-243 upgrade** — current entries mark Family Challenges (PRD-24C), Boss Quests, Bingo Cards, Evolution Creatures, Passport Books as "📌 Post-MVP." Per founder direction, these upgrade to "active roadmap" framing (e.g., "⏳ Unwired (MVP)" or "⏳ Roadmap"). Phase 3 registry-hygiene pass.

5. **PRD-05 ↔ PRD-24A LiLa bingo/boss/passport generation seam** — cascading absence from F41c. Resolves when F41c builds land. Scope 3+8b traversal should verify LiLa context-assembler hooks + `lila_guided_modes` rows + Edge Functions land alongside `boss_quests` + `bingo_cards` + `passport_books` table creation. Cross-PRD seam evidence captured in EVIDENCE_BATCH_8 Row PRD-24A R5.

6. **F42 `lists.reveal_type` dormant column** — column landed (migration `00000000000008_tasks_lists.sql:310`) but no consumer. Dormant until F42 wires the reveal library. Note: `lists.reveal_visual` was PRD-24 Cross-PRD's original name; PRD-24B's Cross-PRD flagged the naming reconciliation. Live schema shipped `reveal_type` — stale `reveal_visual` references in PRD-24 text should update as part of F42 remediation.

7. **F41b overlay engine "deferred indefinitely" STUB_REGISTRY framing** — distinct category from "Post-MVP" + "Active roadmap." Founder language "pause, maybe never" suggests a third bucket for ideas preserved-but-not-scheduled. Phase 3 registry-hygiene pass may warrant a new status marker.

## Round 9 — Compliance evidence pass (Batch 9, PRDs 27, 28, 29, 30, 35, 36, 37, 38)

- **Date:** 2026-04-20
- **Worker pass:** [EVIDENCE_BATCH_9_compliance.md](EVIDENCE_BATCH_9_compliance.md)
- **Aggregate:** 38 rows across 8 PRDs (PRD-27: 6, PRD-28: 8, PRD-29: 5, PRD-30: 4, PRD-35: 4, PRD-36: 5, PRD-37: 3, PRD-38: 3). 4 ambiguity flags. 5 unexpected findings. 3 worker-proposed candidates → 5 emitted findings after orchestrator split + 1 batch-hygiene note.

### Per-candidate-finding verdict table

Orchestrator split the worker's mega-consolidation (PRD27-29-30-37-38-SCREEN-LAYER-UNBUILT) into per-PRD findings per PLAN §5.1 rule 3 ("Do NOT consolidate across PRDs in Scope 2") and Round 1–5 precedent (F1, F9, F19, F22, F34 all kept per-PRD scope for unbuilt features). PRD-30 cross-refs SCOPE-8a.F3 (closed) and does not emit.

| Candidate | Contributing rows | Proposed verdict | Proposed severity | Emits into | Founder decision | Beta Readiness |
|---|---|---|---|---|---|---|
| PRD27-CAREGIVER-TOOLS-UNBUILT | PRD-27 R1, R2, R4, R5, R6 | Deferred-Document | Medium | SCOPE-2.F66 | Confirmed — Enhanced-tier flagship unbuilt, honest PlannedExpansionCard stub registered, beta-deferred per Convention #31. Same shape as F1/F9/F19 pattern. Purpose-built CaregiverLayout + 3 tables (trackable_event_categories, trackable_event_logs, shift_reports) absent; only shift_sessions.is_co_parent_session column shipped. Most beta families won't have caregivers during beta window | N |
| PRD29-BIGPLANS-UNBUILT | PRD-29 R1, R2, R3, R4 | Deferred-Document | Medium | SCOPE-2.F67 | Confirmed — Enhanced-tier flagship unbuilt. 5 tables absent (plans, plan_milestones, plan_components, plan_check_ins, friction_diagnosis_templates). 4 guided modes (bigplans, bigplans_goal, bigplans_project, bigplans_system) unseeded. bigplans-compile Edge Function absent. Coupling: PRD-12A LifeLantern goal decomposition stub routes to BigPlans (PRD-29 Cross-PRD Impact Addendum §PRD-12A) | N |
| PRD37-FAMILY-FEEDS-UNBUILT | PRD-37 R1, R2, R3 | Deferred-Document | Medium | SCOPE-2.F68 | Confirmed — 6 tables absent (family_moments, moment_media, moment_reactions, moment_comments, out_of_nest_feed_settings, feed_approval_settings). homeschool_bulk_summary guided mode unseeded. /feeds renders honest FamilyFeedsStub PlannedExpansionCard. Paired in build order with PRD-28B per shared addendum — PRD-28B merge-vs-separate prerequisite decision preserved in open flags (defer to F22 pre-build audit) | N |
| PRD38-BLOG-UNBUILT | PRD-38 R1, R2, R3 | Deferred-Document | Medium | SCOPE-2.F69 | Confirmed — 5 tables absent (blog_posts, blog_engagement, blog_comments, blog_free_tools, blog_categories). Zero Supabase Storage buckets. No domain routing between aimagicformoms.com + myaimcentral.com. No blog-comment-moderate / blog-publish-scheduled Edge Functions. Pre-launch stack finding — pairs with F1 (tier monetization) + F2 (gate adoption) + F3 (access-level picker) as pre-paid-launch prerequisite. Not beta blocker; launch blocker | N |
| PRD35-FIELD-NAME-DRIFT | PRD-35 R1 | Unintentional-Fix-PRD | Low | SCOPE-2.F70 | Confirmed — PRD-35 §Data Schema specifies access_schedules.special_adult_id + recurrence_data; live schema + migration 00000000000004_universal_scheduler.sql:13-22 ship member_id + recurrence_details. Consumer code consistent. Neither PRD-27 addendum nor Convention #26 reference field names literally. Same shape as F24 (PRD-09A task_queue naming staleness). One-line PRD-35 amendment closes it | N |
| PRD28-SUBJECT-TRACKING-STUB-REGISTRY-STALE | PRD-28 R7 | Intentional-Document → downgraded to batch-hygiene note (not a finding) | Low | Not emitted — batch-hygiene note | Orchestrator proposed, founder confirmed: STUB_REGISTRY row 516 claims "Subject Tracking section in TaskCreationModal" is Unwired (MVP). Code reality: wired at TaskCreationModal.tsx:1947-1966 via countsForHomework + homeworkSubjectIds. Pure registry drift. One-line STUB_REGISTRY amendment. Matches Round 1 PRD01-FIELD-NAME-DRIFT batch-hygiene downgrade precedent | N |

### Load-bearing unexpected findings

1. `access_schedules` field-name drift (`special_adult_id` → `member_id`, `recurrence_data` → `recurrence_details`) between PRD-35 spec and implementation. Consumer code consistent; PRD text never updated after remediation migration 00000000000019. Consolidated into SCOPE-2.F70.
2. `lila_messages.safety_scanned` column exists but is stub infrastructure — no logic reads or writes it per STUB_REGISTRY rows 532–533. Only PRD-30 artifact in the live schema independent of the unbuilt core. Already captured in SCOPE-8a.F3 scope — not re-emitted, noted for orchestrator visibility only.
3. STUB_REGISTRY row 516 stale re: Subject Tracking in TaskCreationModal — claims Unwired, actually wired. Downgraded to batch-hygiene note per founder direction. Matches Round 1 PRD01-FIELD-NAME-DRIFT shape.
4. 5 Compliance-batch PRDs unbuilt at screen layer (PRD-27, PRD-29, PRD-30, PRD-37, PRD-38). Worker's mega-consolidation violated PLAN §5.1 rule 3 and Round 1–5 precedent. Orchestrator split into 4 per-PRD findings (F66–F69); PRD-30 cross-refs SCOPE-8a.F3 and does not emit. Each PRD has honest PlannedExpansionCard stub registered in `feature_expansion_registry.ts` per Convention #31.
5. PRD-28 is the only Compliance-batch PRD at MVP parity with its spec (migrations 100134/100135/100136/100138 — 7 tables, 2 Edge Functions, 2 pg_cron jobs, feature keys wired). Healthy baseline confirming Compliance-domain density is deliberate build-order outcome, not accidental drift. No finding needed.

### Cross-references

- CROSS-REF: SCOPE-8a.F3 cited by SCOPE-2 Batch 9 for PRD-30 structural absence. Not re-emitted per PLAN §7 Rule 7.
- CROSS-REF: SCOPE-5.F4 Finding A (PRD-28B 6-table infrastructure unbuilt) cited by PRD-37 evidence rows covering shared addendum; PRD-28B-exclusive clauses classified Deferred-Document per scope clarification.
- CROSS-REF: SCOPE-2.F1 / SCOPE-2.F9 / SCOPE-2.F19 anchor F66–F69 Deferred-Document Medium pattern (unbuilt Enhanced-tier flagship).
- CROSS-REF: SCOPE-2.F24 (PRD-09A task_queue naming staleness) anchors F70 Unintentional-Fix-PRD Low pattern (consumer code consistent, PRD text stale).
- CROSS-REF: SCOPE-2.F22 (PRD-19 reports near-term build) — F68 PRD-37 Family Feeds pairs in build order with PRD-28B per shared addendum; prerequisite merge-vs-separate decision deferred to F22 pre-build audit.
- CROSS-REF: Batch 3 Round 3 open flag #4 (PRD-28B prerequisite decision) — resolved per founder direction 2026-04-20 to defer to pre-build audit when F22 kicks off; preserved in open flags below.
- CROSS-REF: Round 1 PRD01-FIELD-NAME-DRIFT batch-hygiene note precedent anchors Row 7 downgrade shape.
- PATTERN-FLAG-FOR-SCOPE-4: PRD-28 Row 6 financial data exclusion from LiLa context assembly enforced by omission rather than active filter. No CI guard prevents future regression. If Scope 4 audits AI-cost-pattern application + LiLa context assembler surface, grep-based CI guard decision surfaces there.

### Founder adjudication

- **F66 PRD-27 Caregiver Tools unbuilt:** Same shape as F1/F9/F19 pattern — Enhanced-tier flagship unbuilt, honest PlannedExpansionCard stub registered, beta-deferred. Purpose-built CaregiverLayout two-view model (Caregiver View + Kid View), swipeable columns, trackable event logging, LiLa-compiled shift reports all absent. The only infrastructure shipped: `shift_sessions.is_co_parent_session` column (PRD-27 L429 addition). Most beta families won't have babysitters/grandma/aide/co-parent during beta window. Founder direction: defer per tier-monetization stack; when PRD-27 build kicks off, Scope 3+8b integration with PRD-02 permissions + PRD-15 messaging + PRD-25/26 Kid View rendering verified at pre-build audit.

- **F67 PRD-29 BigPlans unbuilt:** Same shape as F66. Enhanced-tier flagship unbuilt. Planning/system-design tool (Friction Detective diagnostic with four-category taxonomy, goal backward-planning, multi-track projects, trial period with check-ins) entirely absent. Cross-coupling: PRD-12A LifeLantern goal decomposition stub routes to BigPlans (PRD-29 Cross-PRD Impact Addendum §PRD-12A); PRD-09A `tasks.related_plan_id` column + `source='project_planner'` enum value ARE pre-wired stub sockets from PRD-09A build. Consumer deferred until F67 builds. No urgency during beta.

- **F68 PRD-37 Family Feeds unbuilt:** Same shape as F66/F67. Family Life Feed + Homeschool Portfolio Feed + Out of Nest adult-child PWA entry point all absent. `homeschool_bulk_summary` guided mode unseeded. Paired in build order with PRD-28B (Compliance Reporting) per shared addendum — PRD-28B merge-vs-separate prerequisite decision preserved in open flags (founder direction: defer to F22 pre-build audit when PRD-19 reports pipeline kicks off, 2–3 month horizon per Round 3).

- **F69 PRD-38 Blog (Cookie Dough & Contingency Plans) unbuilt:** Same shape but distinct timing context. Public marketing blog at aimagicformoms.com — the Pinterest traffic funnel, SEO surface, free-tools hub, founder-voice customer-acquisition hook — entirely unbuilt. Pairs with F1 (tier monetization) + F2 (gate adoption) + F3 (access-level picker) as pre-paid-launch prerequisite stack. Not beta blocker (beta ships without a public site); becomes prerequisite when pricing goes live. Severity stays Medium; open flag pairs it with F1/F2/F3.

- **F70 PRD-35 field-name drift:** Pure PRD-text-stale-doc-drift. PRD-35 §Data Schema L326–343 specifies `access_schedules` columns `special_adult_id UUID NOT NULL` + `recurrence_data JSONB`. Migration 00000000000004 created with `member_id` + `recurrence_details`; remediation migration 00000000000019 added missing `schedule_name`/`start_time`/`end_time` columns but did not rename the base two. Neither PRD-27 Cross-PRD addendum nor CLAUDE.md Convention #26 reference the column names literally. All consumer code consistent. Same shape as F24 (PRD-09A task_queue naming staleness) — one-line PRD-35 amendment closes it.

- **PRD-28 Row 7 (batch-hygiene note, not finding):** STUB_REGISTRY row 516 claims Subject Tracking is Unwired (MVP); actually wired at `TaskCreationModal.tsx:1947-1966` via `countsForHomework` + `homeworkSubjectIds` and persisted via `createTaskFromData.ts:96-99`. Pure registry drift — feature works, doc is stale. Downgraded to batch-hygiene note per Round 1 PRD01-FIELD-NAME-DRIFT precedent. One-line STUB_REGISTRY amendment captured in Emission list hygiene sub-list.

### Emission list

Findings to emit (5 total):

- SCOPE-2.F66 — PRD-27 Caregiver Tools unbuilt (Medium, Deferred-Document, Beta-Readiness N; tier-monetization-stack shape per F1/F9/F19)
- SCOPE-2.F67 — PRD-29 BigPlans unbuilt (Medium, Deferred-Document, Beta-Readiness N; Enhanced-tier flagship; couples with PRD-12A goal decomposition stub)
- SCOPE-2.F68 — PRD-37 Family Feeds unbuilt (Medium, Deferred-Document, Beta-Readiness N; PRD-28B merge-vs-separate prerequisite decision preserved in open flags)
- SCOPE-2.F69 — PRD-38 Blog (Cookie Dough & Contingency Plans) unbuilt (Medium, Deferred-Document, Beta-Readiness N; pre-paid-launch prerequisite stack with F1/F2/F3)
- SCOPE-2.F70 — PRD-35 `access_schedules` field-name drift (Low, Unintentional-Fix-PRD, Beta-Readiness N; SUPERSEDES: current live schema per migrations 00000000000004 + 00000000000019)

Batch 9 hygiene note (not a finding — apply-phase includes in a hygiene sub-list):

- STUB_REGISTRY row 516 claims "Subject Tracking section in TaskCreationModal" is Unwired (MVP); code reality at `TaskCreationModal.tsx:1947-1966` shows it wired. One-line STUB_REGISTRY amendment: flip row 516 from Unwired (MVP) to Wired.

No new Scope 4 / Scope 3+8b emissions from this batch (cross-scope carry-forwards logged in open flags below).

**Numbering note:** Round 9 emits finding IDs **F66–F70**, continuing sequentially after Round 7's F45–F57 (real IDs) and leaving F58–F65 for Round 8 once apply-phase renumbers its placeholder range (Round 8 closed with F39–F46 placeholder IDs + an explicit renumber-at-Stage-C note, producing 8 findings that will occupy F58–F65). Fresh-worker prompt originally proposed F39–F43; founder direction 2026-04-20 during adjudication: "use available numbers that come after the other ones" — renumbered to F66–F70 to preserve audit cross-reference integrity.

### Open flags (tech-debt + cross-scope register)

1. **PRD-28B merge-vs-separate prerequisite decision** — preserved from Round 3 open flag #4. Founder direction 2026-04-20 at Batch 9 walk-through: defer to pre-build audit when F22 PRD-19 reports pipeline kicks off (2–3 month horizon). Before F22 build begins, founder decides whether to merge PRD-28B's 6-table infrastructure (`homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`) into PRD-19's build OR build PRD-28B as its own phase first. F68 PRD-37 Family Feeds shares the PRD-28B addendum and will also surface this decision at its build time.
2. **Pre-paid-launch prerequisite stack** — F69 PRD-38 Blog joins F1 (tier monetization infrastructure) + F2 (permission-gate adoption) + F3 (access-level picker) as the pre-launch prerequisite stack. Beta ships without these; they become blockers when pricing goes live. Founder's "100 founding family" customer-acquisition funnel requires F69 operational. No urgency during beta.
3. **PRD-28 financial data exclusion enforced by omission** — PATTERN-FLAG-FOR-SCOPE-4. `supabase/functions/_shared/context-assembler.ts:13-14` carries a comment documenting the exclusion but the file simply never queries `financial_transactions` / `allowance_configs` / `allowance_periods` / `loans`. No CI guard prevents future regression. When Scope 4 audits AI-cost-pattern application + LiLa context assembler surface, grep-based CI guard decision surfaces there.
4. **`lila_messages.safety_scanned` column unwired but present** — STUB_REGISTRY rows 532–533 already capture. Only PRD-30 artifact in live schema independent of the unbuilt core. Will be wired when PRD-30 build kicks off; no independent remediation needed. Captured in SCOPE-8a.F3 scope, not re-emitted.
5. **`homeschool_time_review` LiLa guided mode seeded but consumer unwired** — STUB_REGISTRY row 515 captures. Mode exists in DB (migration 00000000100138); `homework-estimate` Edge Function wired for inline subject estimation but conversational guided-mode UI surface absent. Will be wired when PRD-05 day-data context enhancement lands. No independent remediation.
6. **`access_schedules` field-name drift may recur in PRD-27 build** — when PRD-27 Caregiver Tools (F66) eventually builds, its Cross-PRD Impact Addendum §PRD-02 references `access_schedules` without naming the columns. PRD-35 amendment per F70 should land before or concurrent with F66 build so PRD-27 implementation reads correct field names. Coupling note for future pre-build audit.

## Synthesis pass

*(optional — if cross-batch patterns emerge that warrant a consolidation-level finding, captured here. Modeled on [WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md) aggregate findings section.)*
