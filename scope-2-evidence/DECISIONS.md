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

*(entry filled during walk-through)*

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
