---
Status: DRAFT — awaiting founder approval before any evidence pass begins
Stage: C
Scope: 3 + 8b (cross-PRD integration; integration compliance & safety)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 and §8b; [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 305–308 for Scope 3; line 332 for Scope 8b integration overlap)
---

# Scope 3 + 8b — Cross-PRD Integration Audit Plan

> Orchestration plan for the cross-PRD integration traversal. Merged Scope 3 (design) + Scope 8b (integration compliance/safety) into one evidence traversal because both scopes walk the same addenda-defined seams. Emission tag is decided at finding time: `SCOPE-3.F{N}` for pure design/wiring defects, `SCOPE-8b.F{N}` when the defect touches a safety/compliance surface.

## 1 — Purpose and merger rationale

**Scope 3 per Gameplan lines 305–308:** every cross-PRD addendum — was it honored in code, are integration points actually wired or stubbed, does data flow across PRD boundaries as designed.

**Scope 8b per Gameplan line 332:** integration safety — whether integration points between PRDs preserve Safe Harbor exemption, Crisis Override globality, RLS boundary, HITM gates, child-data lifecycle, consent flows, and privacy filters.

**Why merged:** Both scopes traverse the same surface — cross-PRD addenda and the integration seams they describe. A single evidence pass per seam can produce findings for either scope. Running them as two separate passes would double-read every addendum. Running as one pass with emission-tag discipline at finding time preserves both audit columns in AUDIT_REPORT_v1.md while cutting traversal cost in half.

Audit report structure stays split — findings land in §3 OR §8b per emission tag — so a reader scanning for "integration safety" can find it without scanning design-only findings, and vice versa.

## 2 — Finding schema and emission-tag discipline

### 2.1 Finding schema

Copied verbatim from [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §0:

```
### [SCOPE-N.FN] Short title
- Severity: Blocking | High | Medium | Low
- Location: file:line or PRD/addendum reference
- Description: What the code does vs what the PRD/spec says vs what STUB_REGISTRY/WIRING_STATUS claims
- Evidence: specific quote, grep hit, or query result
- Proposed resolution: Fix Now | Fix Next Build | Tech Debt | Intentional-Update-Doc | Defer-to-Gate-4
- Founder decision required: Y/N
- Wizard Design Impact: (populated only when relevant)
- Beta Readiness flag: Y/N
```

### 2.2 Emission tag — decision table

The emission tag is `SCOPE-3` or `SCOPE-8b`. A single defect that has both a design component and a safety component emits **two findings** (one each), cross-referencing one another. Rationale: the remediation paths differ — a design fix may ship in a normal build; a safety fix may be a Beta Readiness blocker.

| Defect shape | Emission tag | Rationale |
|---|---|---|
| Integration designed in addendum but wired wrong or stubbed in code, no safety component | `SCOPE-3.F{N}` | Pure design/wiring defect. |
| Integration designed in addendum but wired wrong, AND the wrong wiring exposes child data, bypasses HITM, skips RLS, leaks across Safe Harbor boundary, breaks consent flow, or skips privacy filter | `SCOPE-8b.F{N}` (primary) + `SCOPE-3.F{N}` (cross-reference) | Two findings: the safety one is a Beta blocker (default Y); the design one is logged for the Scope 3 column completeness. |
| Integration absent (addendum says it should exist; code has nothing) | `SCOPE-3.F{N}` | Absent-integration is always design-level first; if the absence has safety impact (e.g., PRD-30 → child-facing feature not monitored), cross-emit `SCOPE-8b.F{N}`. |
| Integration partial (one side wired, the other side not) | `SCOPE-3.F{N}` | Partial-wiring is design; cross-emit `SCOPE-8b.F{N}` if the partial state exposes a safety gap (e.g., message-send path wired but message-safety-scan not wired). |
| Safety integration fully wired but safety semantics drift from PRD spec (e.g., privacy filter runs too late in pipeline) | `SCOPE-8b.F{N}` only | Pure safety-semantic drift, no design-layer absence. |

### 2.3 Canonical safety/compliance surfaces for Scope 8b classification

A finding is Scope 8b if it touches any of:

- **Safe Harbor exemption** — `is_safe_harbor` filter must hold across all aggregation surfaces per CLAUDE.md #243
- **Crisis Override** — global detection across every LiLa Edge Function per CLAUDE.md #7
- **HITM** — Edit/Approve/Regenerate/Reject gate before persisting AI output per CLAUDE.md #4
- **RLS** — family_id / member_id / role scoping on every table per CLAUDE.md #3
- **Child data boundary** — Guided/Play-authored data visibility per PRD-02 roles
- **Consent flow** — COPPA consent gating any child-data write (primarily Scope 8a, but integration seams between PRD-40 and everything else are Scope 8b)
- **Privacy filter** — `is_privacy_filtered = true` items excluded from non-mom context per CLAUDE.md #76
- **Ethics auto-reject** — force, coercion, manipulation, shame-based control, withholding affection per PRD-30/PRD-41

## 3 — Integration inventory — addenda list

Enumerated via Glob against `prds/addenda/` on 2026-04-20. 41 addenda present. Mapping each to the PRDs it bridges and a one-line summary derived from the filename only (no addendum contents read — that is evidence-gathering, deferred until per-surface worker runs).

### 3.1 Single-PRD addenda (scope: PRD-internal, not cross-PRD)

These addenda clarify a single PRD's own decisions rather than describing a cross-PRD seam. They are Scope 2 material, not Scope 3+8b. Listed for completeness; skipped in integration traversal unless the addendum's contents surprise (confirmed during per-surface reading).

| Addendum | PRD | Expected content (filename-only inference) |
|---|---|---|
| PRD-05-Planning-Decisions-Addendum.md | PRD-05 | LiLa planning decisions |
| PRD-07-Session-Addendum.md | PRD-07 | InnerWorkings session-specific decisions |
| PRD-23-Session-Addendum.md | PRD-23 | BookShelf session decisions |
| PRD-31-Permission-Matrix-Addendum.md | PRD-31 | Permission matrix addendum |
| PRD-24A-Game-Modes-Addendum.md | PRD-24A | Gamification game-modes |
| PRD-24B-Content-Pipeline-Tool-Decisions.md | PRD-24B | Gamification content pipeline |
| PRD-18-Enhancement-Addendum.md | PRD-18 | Rhythms enhancements |

### 3.2 Cross-PRD Impact Addenda — canonical integration surface

The bulk of the Scope 3+8b integration surface. Each names "Cross-PRD Impact" in the filename and is designed to describe a PRD's outgoing/incoming integrations with other PRDs.

| # | Addendum file | Declared PRD | Expected integration surface (filename-only inference; to be confirmed during evidence pass) |
|---|---|---|---|
| 1 | PRD-08-Cross-PRD-Impact-Addendum.md | PRD-08 | Journal/Notepad outbound integrations across Studio Queue, MindSweep, Journal routing |
| 2 | PRD-14-Cross-PRD-Impact-Addendum.md | PRD-14 | Personal Dashboard widget/reorder integrations |
| 3 | PRD-14B-Cross-PRD-Impact-Addendum.md | PRD-14B | Calendar integrations (Scheduler, events, attendees) |
| 4 | PRD-14D-Cross-PRD-Impact-Addendum.md | PRD-14D | Family Hub integrations (Victory, Countdowns) |
| 5 | PRD-15-Cross-PRD-Impact-Addendum.md | PRD-15 | Messaging/Requests/Notifications integrations across many PRDs |
| 6 | PRD-16-Cross-PRD-Impact-Addendum.md | PRD-16 | Meeting integrations (Universal Scheduler, Studio Queue, LiLa facilitation) |
| 7 | PRD-17B-Cross-PRD-Impact-Addendum.md | PRD-17B | MindSweep auto-sweep integrations across destinations |
| 8 | PRD-18-Cross-PRD-Impact-Addendum.md | PRD-18 | Rhythms integrations (Tomorrow Capture, MindSweep-Lite, Morning Insight) |
| 9 | PRD-19-Cross-PRD-Impact-Addendum.md | PRD-19 | Family Context & Relationships integrations |
| 10 | PRD-20-Cross-PRD-Impact-Addendum.md | PRD-20 | Safe Harbor aggregation-exclusion integrations ⚠ |
| 11 | PRD-21-Cross-PRD-Impact-Addendum.md | PRD-21 | Communication tools integrations |
| 12 | PRD-21A-Cross-PRD-Impact-Addendum.md | PRD-21A | AI Vault browse/content integrations |
| 13 | PRD-21B-Cross-PRD-Impact-Addendum.md | PRD-21B | AI Vault admin integrations |
| 14 | PRD-21C-Cross-PRD-Impact-Addendum.md | PRD-21C | AI Vault engagement/community integrations |
| 15 | PRD-22-Cross-PRD-Impact-Addendum.md | PRD-22 | Settings integrations (data export, account lifecycle) ⚠ |
| 16 | PRD-23-Cross-PRD-Impact-Addendum.md | PRD-23 | BookShelf integrations (Guiding Stars, Tasks, Journal prompts, AI Vault) |
| 17 | PRD-24-Cross-PRD-Impact-Addendum.md | PRD-24 | Gamification foundation integrations |
| 18 | PRD-24A-Cross-PRD-Impact-Addendum.md | PRD-24A | Overlay engine integrations |
| 19 | PRD-24B-Cross-PRD-Impact-Addendum.md | PRD-24B | Gamification visuals integrations |
| 20 | PRD-25-Cross-PRD-Impact-Addendum.md | PRD-25 | Guided Dashboard integrations |
| 21 | PRD-26-Cross-PRD-Impact-Addendum.md | PRD-26 | Play Dashboard integrations |
| 22 | PRD-27-Cross-PRD-Impact-Addendum.md | PRD-27 | Caregiver Tools integrations ⚠ |
| 23 | PRD-28-Cross-PRD-Impact-Addendum.md | PRD-28 | Tracking/Allowance/Financial integrations (dual with homework) |
| 24 | PRD-29-Cross-PRD-Impact-Addendum.md | PRD-29 | BigPlans integrations |
| 25 | PRD-30-Cross-PRD-Impact-Addendum.md | PRD-30 | Safety Monitoring integrations across all LiLa surfaces ⚠ |
| 26 | PRD-31-Cross-PRD-Impact-Addendum.md | PRD-31 | Subscription tier / feature gating integrations |
| 27 | PRD-34-Cross-PRD-Impact-Addendum.md | PRD-34 | ThoughtSift 5-tool integrations |
| 28 | PRD-35-Cross-PRD-Impact-Addendum.md | PRD-35 | Universal Scheduler integrations (cross-feature recurrence consumers) |
| 29 | PRD-36-Cross-PRD-Impact-Addendum.md | PRD-36 | Universal Timer integrations |
| 30 | PRD-17B-Cross-PRD-Impact-Addendum.md | PRD-17B | (duplicate listed for completeness — see row 7) |

⚠ = addenda expected to carry Scope 8b-classifiable content (based on PRD subject touching safety, privacy, compliance surfaces).

### 3.3 Multi-PRD Impact Addenda

Addenda that explicitly bridge 2+ PRDs in the filename.

| # | Addendum | Bridged PRDs | Expected integration surface |
|---|---|---|---|
| 31 | PRD-32-32A-Cross-PRD-Impact-Addendum.md | PRD-32, PRD-32A | Admin Console × Demand Validation Engine |
| 32 | PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md | PRD-37, PRD-28B | Family Feeds × Compliance & Progress Reporting |
| 33 | PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md | PRD-09A, PRD-09B | Tasks × Lists (linked steps, mastery) |
| 34 | PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md | PRD-09A, PRD-09B | Tasks × Lists (Studio Intelligence) |

### 3.4 Global / cross-cutting addenda

| # | Addendum | Scope |
|---|---|---|
| 35 | PRD-Audit-Readiness-Addendum.md | All PRDs — cross-cutting audit rulings |
| 36 | PRD-Template-and-Audit-Updates.md | All PRDs using templates |

### 3.5 Summary

- **Cross-PRD Impact Addenda (canonical traversal):** 29 unique files (removing the duplicate row 7/30 entry) → §3.2 table rows. These define the Scope 3+8b traversal surface.
- **Multi-PRD Impact Addenda:** 4 files → §3.3 rows.
- **Global addenda:** 2 files → §3.4 rows. Read once for cross-cutting rulings, not per-surface.
- **Single-PRD addenda:** 7 files → §3.1. Skipped by Scope 3+8b, read by Scope 2 where relevant.

**Total integration surfaces to traverse: ~33** (§3.2 + §3.3). This is the N in "~N expected integration surfaces."

Actual per-surface scope ("this addendum bridges PRDs X, Y, Z") can only be confirmed during evidence pass, when the addendum contents are actually read. The filename-only inference table in §3.2 and §3.3 is advisory.

## 4 — Per-surface packet format

Each of the ~33 integration surfaces produces one evidence file:

```
scope-3-8b-evidence/EVIDENCE_{addendum-slug}.md
```

Example filenames:
- `EVIDENCE_prd15-cross-prd-impact.md`
- `EVIDENCE_prd30-cross-prd-impact.md`
- `EVIDENCE_prd09a-09b-studio-intelligence.md`

### 4.1 Worker prompt shape

Per-surface worker prompt template (for dispatch during Stage C execution; NOT drafted now):

> "Read [prds/addenda/{filename}] in full. Identify every integration seam the addendum specifies: which PRD is the source, which PRD is the destination, what data flows, what guardrails apply. Read the PRDs on both sides of each seam *only for the sections relevant to the seam*. Grep the integration seam in code: source-side write, destination-side read, any Edge Function handling the handoff. Produce a two-column table (addendum spec × code reality) with per-row classification. Flag every seam with a safety/compliance component per PLAN §2.3 for emission-tag decision. Emit `SCOPE-3.F{N}` or `SCOPE-8b.F{N}` candidates at the finding level, with cross-references where both apply. Follow Standing Rules from DECISIONS.md."

### 4.2 Evidence file structure

Per file:

1. **Frontmatter** — Status, Stage, Scope (3 + 8b), Opened date, addendum file path, bridged PRDs.
2. **Worker cover paragraph (10–20 lines)** — scope of this addendum's traversal, which PRDs were read on each side of seams, any surprises that fall outside the row table.
3. **Per-seam two-column table** — one row per integration seam identified. Columns: `addendum spec (with §/L reference) × code reality (with file:line) × classification × proposed finding tag`. Classification uses the 5 Gameplan labels from [scope-2-evidence/PLAN.md](../scope-2-evidence/PLAN.md) §2 (Intentional-Document / Unintentional-Fix-Code / Unintentional-Fix-PRD / Deferred-Document / Scope-Creep-Evaluate). Proposed finding tag: `SCOPE-3`, `SCOPE-8b`, or `BOTH` per the §2.2 table.
4. **Unexpected findings list** — seams not covered in the addendum but surfaced during grep (e.g., an actual integration the addendum doesn't describe, OR an actual integration failure that sits outside the addendum's framing).
5. **Proposed consolidation** — worker-drafted grouping per §5 rules below.
6. **Orchestrator adjudication table** — filled during walk-through.

### 4.3 Reference for stylistic inheritance

Workers should read before drafting:
- [EVIDENCE_BUCKET_2.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_2.md) — mixed-verdict table format
- [EVIDENCE_BUCKET_3.md](../.claude/completed-builds/scope-8a-evidence/EVIDENCE_BUCKET_3.md) — structural PRD-not-built differentiation
- [scope-2-evidence/PLAN.md](../scope-2-evidence/PLAN.md) — sister plan for classification alignment

## 5 — Consolidation discipline

Inherited from Scope 2 and Scope 8a. Scope 3+8b adds one extra rule on top.

### 5.1 Per-addendum, per-pattern consolidation

Within a single addendum's evidence file, collapse multiple rows with the same classification and the same underlying pattern into one finding. Same rule as Scope 2 §5.1.

### 5.2 Cross-addendum pattern consolidation (NEW for Scope 3+8b)

When a pattern repeats across 3+ addenda (e.g., "studio_queue handoff is broken in N PRDs"), consolidate into **one cross-addendum finding** that names the pattern, lists the contributing addenda, and gives one per-addendum evidence citation. Do NOT emit one finding per affected addendum and hope a reader sees the pattern. Rationale: Scope 3+8b's value is in seeing cross-PRD patterns — single-PRD findings belong in Scope 2.

Signal for cross-addendum consolidation: the same root-cause sentence can be written for 3+ surfaces. Example: "studio_queue insert uses `source='notepad'` hardcoded regardless of actual origin — affects PRD-08, PRD-15, PRD-16, PRD-17B, PRD-34."

### 5.3 Do NOT consolidate across emission tags

A Scope 3 finding and a Scope 8b finding that describe the same seam stay as two separate entries per §2.2. The Scope 8b one carries the Beta Readiness flag; the Scope 3 one does not. Consolidating them would drop the Beta flag visibility.

### 5.4 Cardinality expectation

Most addenda evidence files emit 1–4 findings. Cross-addendum consolidations may reduce overall finding count by collapsing patterns that would otherwise surface as 5+ separate findings. Expected total Scope 3+8b finding volume: 25–50 findings across the traversal, 8–15 of which are Scope 8b-tagged.

## 6 — Beta Readiness flag default

- **Scope 3 findings (design-only):** default N, per Scope 2's default for PRD-text-vs-code-drift. Set to Y only when the design defect makes a child-facing surface confusing or broken to the point of beta non-viability.
- **Scope 8b findings (safety/compliance integration):** default Y, per Scope 8a's standing rule. Set to N only when the finding is clearly informational (e.g., "Safe Harbor filter is correctly applied in surface X, documenting for reference"), which is unlikely — Scope 8b findings by definition emit when drift is surfaced.

## 7 — Standing rules

Same seed list as Scope 2, plus two additions:

1. **Evidence not intuition.** Every verdict cites migration SHA / file:line / grep hit / PRD/addendum section reference.
2. **If it doesn't work in the app, it is not wired.** Applies especially to integration seams — both sides must actually run.
3. **Non-concurrent zones untouched** per AUDIT_REPORT_v1.md §0.
4. **Worker commits, orchestrator adjudicates.**
5. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
6. **Consolidate aggressively,** including across addenda for repeat patterns (§5.2).
7. **Emission tag decided at finding time, not addendum time.** A single addendum may produce both Scope 3 and Scope 8b findings. Don't pre-classify an addendum as "Scope 3 only" or "Scope 8b only."
8. **Cross-reference closed findings.** When a Scope 3+8b finding cites a Scope 5 or Scope 8a closed finding, link to it. Do not re-describe the closed finding's content — just cite and proceed.

## 8 — Handoff to apply-phase

Once all integration surfaces walk-through close, an apply-phase worker appends:
- `SCOPE-3.F{N}` findings to [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 (currently the stub "*Not yet started. Stage C (merged with Scope 8b).*" at line 387)
- `SCOPE-8b.F{N}` findings to §8b (currently the stub "*Not yet started. Stage C (merged with Scope 3).*" at line 391)

Apply-phase worker scope:
- Reads DECISIONS.md for adjudicated verdicts
- Reads each `EVIDENCE_{addendum-slug}.md` for finding bodies
- Splits emissions by tag (§3 vs §8b) into their respective audit report sections
- Preserves cross-references between paired findings
- Updates Beta Readiness index (Appendix C) for Y-flagged findings (mostly Scope 8b)
- Commits with message `docs(audit): apply Scope 3+8b findings — {addendum summary}`

## 9 — Sequencing

### 9.1 Gating against Scope 2

A cross-PRD seam traversal in Scope 3+8b can only run when both sides' PRD batches in Scope 2 have closed. Rationale: if Scope 2 has not yet established what each PRD's code reality is, the cross-PRD seam traversal has nothing to compare against.

**Gating table — which Scope 2 batches must close before each Scope 3+8b surface can run:**

| Integration surface | Requires Scope 2 batches closed |
|---|---|
| PRD-08 integrations (Journal/Notepad outbound) | Batches 3 (Personal Growth), 4 (Tasks/Studio), 6 (Communication), 7 (Vault), 9 (Compliance) |
| PRD-14B Calendar integrations | Batch 5 (Dashboards/Calendar), and whichever batch owns PRD-35 (Compliance batch 9) |
| PRD-15 Messaging integrations | Batch 6 (Communication), plus most other batches as downstream consumers |
| PRD-17B MindSweep integrations | Batch 4 (Tasks/Studio) + Batch 3 (Personal Growth) + Batch 5 + Batch 6 (many downstream destinations) |
| PRD-23 BookShelf integrations | Batch 7 (Vault/BookShelf) + Batch 3 (Personal Growth) + Batch 4 (Tasks) |
| PRD-30 Safety Monitoring integrations | N/A — PRD-30 is SCOPE-8a.F3 closed; Scope 3+8b traversal here becomes "what integrations MUST exist once PRD-30 is built" — essentially scoping the remediation. Flag as Deferred-to-Gate-4. |
| PRD-35 Universal Scheduler integrations | Batch 9 (Compliance) + Batches 5 + 6 (Calendar, Meetings consume Scheduler) |
| PRD-36 Universal Timer integrations | Batch 9 (Compliance) + Batches 4, 5, 8 (Tasks, Dashboard widgets, Play) |
| PRD-20 Safe Harbor integrations | Deferred — PRD-20 unbuilt per SCOPE-8a.F3. Traversal becomes prerequisite-mapping for the remediation build. |
| PRD-28 Financial integrations | Batch 9 (Compliance) + Batch 4 (Tasks allowance hooks) + Batch 8 (Gamification points separation) |

### 9.2 Parallel execution

Surfaces whose Scope 2 gating is complete may run in parallel. The Scope 3+8b walk-through is still serial (one surface per session) — parallel execution applies only to the evidence-pass workers dispatched before walk-through. Parallel worker dispatch: acceptable for surfaces whose Scope 2 sides have all closed. Walk-through: serial to preserve orchestrator context coherence.

### 9.3 Scope 4 interleave

Scope 4 (cost patterns) is independent of Scope 3+8b and can run after Scope 2 closes or interleaved with Scope 3+8b work. No gating dependencies either direction.

## 10 — Success criteria

Scope 3+8b closes when:

- All ~33 integration surfaces have evidence files committed in `scope-3-8b-evidence/`
- Surfaces blocked by unbuilt PRDs (PRD-20, PRD-30, PRD-32, etc.) have stubs in this directory that cite the closed Scope 5 or Scope 8a finding and mark as Deferred-to-Gate-4
- DECISIONS.md contains per-surface round entries with founder decisions
- Apply-phase worker has landed all SCOPE-3.F{N} findings into §3 and SCOPE-8b.F{N} findings into §8b of AUDIT_REPORT_v1.md
- Beta Readiness index (Appendix C) updated with Y-flagged Scope 8b findings
- Cross-references between paired (SCOPE-3 + SCOPE-8b) findings present
- `scope-3-8b-evidence/` moved to `.claude/completed-builds/scope-3-8b-evidence/` per the archival pattern used for Scopes 5 and 8a

### 10.1 First-batch priority traversal list

Once Scope 2 Foundation batch closes, the following Scope 3+8b surfaces can start in order of gating satisfaction and pattern-value. This is a priority-guide, not a binding order — orchestrator may shuffle based on actual Scope 2 close cadence.

| Priority | Surface | Unlocks at | Rationale |
|---|---|---|---|
| 1 | PRD-31 Cross-PRD (feature gating) | After Foundation batch closes | Feature-key registry + feature_access_v2 are Foundation concerns; PRD-31 integrations cascade across every built PRD — establishes the permission-seam pattern early. |
| 2 | PRD-35 Cross-PRD (Universal Scheduler consumers) | After Batch 5 (Dashboards/Calendar) closes | Scheduler is referenced by PRD-14B, PRD-16, PRD-18, PRD-27, PRD-35 consumers — pattern detection benefits from all downstream Scope 2 work landing first. |
| 3 | PRD-15 Cross-PRD (messaging consumers) | After Batch 6 (Communication) closes | Messaging is referenced by many PRDs as notification target — high cross-addendum pattern likelihood. |
| 4 | PRD-17B Cross-PRD (MindSweep destinations) | After Batches 3, 4, 5, 6 close | MindSweep routes to Journal/Tasks/Lists/Calendar — need all destination PRDs audited in Scope 2 first. |
| 5 | PRD-23 Cross-PRD (BookShelf → Guiding Stars / Tasks / Journal) | After Batches 3, 4, 7 close | BookShelf integrations touch both context-source PRDs and Studio Queue; pattern likely surfaces in Scope 3 only (not 8b). |
| 6 | PRD-28 Cross-PRD (tracking flag propagation) | After Batches 4, 8, 9 close | Tracking flags (`counts_for_allowance`, `counts_for_homework`, `counts_for_gamification`) cross Tasks, Gamification, and Compliance. |
| 7 | PRD-30 Cross-PRD | Deferred-to-Gate-4 | PRD-30 unbuilt (SCOPE-8a.F3); traversal becomes prerequisite-mapping. |
| 8 | Global: PRD-Audit-Readiness + PRD-Template-and-Audit-Updates | After all Scope 2 batches close | Global addenda read once to confirm any cross-cutting rulings have been incorporated. |

### 10.2 Stage C close gate

Scope 3+8b close is one of three Stage C close gates (with Scope 2 and Scope 4). Stage C close unlocks Stage D (Scope 6 LiLa content discrepancy + Scope 7 performance baseline).
