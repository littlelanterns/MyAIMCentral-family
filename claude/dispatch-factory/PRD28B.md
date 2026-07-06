# Pre-Dispatch Pack — PRD28B: Compliance & Progress Reporting

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 6)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD28B. Priority: P5.
> Evidence: `claude/dispatch-factory/PRD3728-RECON.md` (shared with PRD37).
> **Sequencing: after PRD-19 (mandatory prerequisite — it builds the `generated_reports` +
> `monthly_data_aggregations` base this PRD extends; factory-ruled in the PRD19 pack) and after
> PRD-37 (locked addendum order).** The PRD-28 substrate (subjects/configs/time logs + the
> useHomeschool surface) is fully built and reusable with zero rework.

## Reconciliation rulings (newer wins — named explicitly)

1. **PRD-19 boundary held (D-3728-1):** 28B does NOT absorb PRD-19's base tables or core
   generation flow — it EXTENDS them (adds the category dropdown, the 16+ template_type values,
   the 12 homeschool templates, standards tracking, ESA invoices). The STUB registry's twice-
   walked-back "premature Wired" rows get their final honest state at this build's close.
2. **COPPA (PRD-40 L754-765):** 28B's reports are per-family under parental consent — compliant
   by construction; this build adds an explicit assertion (code comment + Checkpoint-5
   verification row: "no cross-family aggregation exists in any report query") rather than new
   machinery. The Convention #243 CI-check obligation already landed with PRD-19's aggregation
   slice; 28B inherits the pattern on any query touching lila-sourced content.
3. **SDS early split-out DECLINED (founder 2026-07-04, overriding the pack recommendation):**
   an existing Claude artifact already covers the SDS need for the employees — no urgency. The
   SDS Report Generator stays INSIDE the main PRD-28B build (its in-app integration lands in
   Slice 3 using the fully-specified template, PRD L151-231); the standalone free Vault-tool
   variant remains an option the founder can invoke later, not a scheduled slice.
4. **Standards-on-tasks design (Convention #157 overlap):** the PRD's sequential-collection
   auto-linking predates Build J. Per the addendum's own suggestion (L114), the build-time
   pre-build decides between a `standard_tags` field vs a subject-tag mapping layer — recorded
   as an explicit Checkpoint-1 design point, not silently improvised.
5. **`education_standards` is system-level** (family_id-less, like daily_holidays) with a seed
   pipeline for Common Core + AZ/FL/UT; `report_templates` are DATA rows (templates-as-data
   convention). The family_moments.standards_links FK constraint lands here (completing PRD-37's
   forward reference).
6. **Reports are NEVER auto-generated** (PRD rule) — reminders notify; mom triggers. HITM on
   every AI-enhanced template output; the disclaimer is non-removable.
7. **ESA invoice reads `family_subscriptions` founding rates** (data live today); the PRD-31
   Settings entry button lands when PRD31 ships (noted cross-pack; the generator itself doesn't
   wait).
8. **Feature keys:** the 7 missing compliance_* keys register in Slice 1 (compliance_esa_invoice
   already seeded).

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 6 tables + generated_reports.template_type extension + education_standards seed pipeline (CC + AZ/FL/UT) + standards_links FK completion + notification category + 7 keys + RLS | Sonnet xhigh + rls-verifier |
| 2 | Homeschool Configuration settings extension + Reporting Schedule & Reminders (notification-driven, never auto-gen) | Sonnet xhigh |
| 3 | Report Generation extension (category dropdown; 6 basic templates reading homeschool_time_logs/subjects; 6 AI-enhanced via dedicated `homeschool-report-generation` EF — category-1 assembleContext; **SDS Monthly Summary generator built here per the amended ruling 3** — form-driven, Acumen-DCI-format output, HITM; Preview & Edit HITM + disclaimer) | Sonnet xhigh |
| 4 | Standards Portfolio Living View (evidence linking: family_moments + homeschool logs + the ruling-4 task-tag design; coverage %; LiLa Suggest @ Full Magic gate) | Sonnet xhigh |
| 5 | ESA Invoice Generator (sequential INV-YYYY-MM-NNN, founding-rate aware) + E2E (`tests/e2e/features/compliance-reporting.spec.ts`: template round trips per category, SDS output shape, standards coverage math, invoice numbering + rate correctness, no-cross-family assertion probe, never-auto-generated pin) + verification + LiLa knowledge | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04)

| # | Decision | Ruling |
|---|---|---|
| D-28B-1 | SDS early split-out | **DECLINED** — existing Claude artifact covers the employees; SDS stays inside the main build (Slice 3) |
| D-28B-2 | Start using Log Learning before dispatch | **YES** (approved per recommendation) |

## Dependency edges
After: PRD19 (base report infra — mandatory), PRD37 (locked order; evidence source), PRD-28
substrate (built). Slice 0 exempt from all of it. Unblocks: PRD-19's "resolved by 28B" forward
note, PRD-37 standards linkage + portfolio export + Family Newsletter template, PRD-31 ESA
Settings button target, IEP/Therapy template stubs' future home.

---

## DISPATCH PROMPT (paste into a FRESH session — after PRD19 + PRD37 close-outs)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-28B — Compliance & Progress Reporting. Pack:
claude/dispatch-factory/PRD28B.md (8 rulings + slice plan; SDS split-out DECLINED — the SDS
generator is Slice 3 scope). Evidence: claude/dispatch-factory/PRD3728-RECON.md. All decisions
RESOLVED (founder 2026-07-04).

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; VERIFY PRD-19's build
landed (generated_reports + monthly_data_aggregations must exist — if absent, STOP and tell the
founder) and PRD-37's (family_moments for evidence linking); re-read CLAUDE.md conventions
added since; next free migration number before push.

READ FIRST: (1) prds/platform-complete/PRD-28B-Compliance-Progress-Reporting.md — FULL, every
word; (2) prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md — FULL; (3) the pack + recon;
(4) the PRD-19 build's feature-decision file (the boundary you extend). Create
.claude/rules/current-builds/PRD-28B-compliance.md (no YAML frontmatter), pre-build summary —
including the ruling-4 standards-on-tasks design decision presented explicitly — founder
approval BEFORE code.

HARD RULES: reports NEVER auto-generate (reminders only; the E2E pin proves it); HITM +
non-removable disclaimer on AI templates; per-family-only queries with the no-cross-family
assertion (COPPA ruling 2) as a hard verification row; education_standards system-level;
report_templates as DATA; dedicated EFs (never ai-parse reuse), category-1 assembleContext;
minutes are the base unit (Convention #227); targets opt-in NULL default (#228); financial
data NEVER in LiLa context (#225) — invoice generation reads family_subscriptions directly,
not through context assembly; Convention #257 dates; zero hardcoded colors + density.

PROOF: the new spec per the pack list + tsc -b + lint. Ask before shared-fixture suites.
NOTHING COMMITS until green + founder eyes-on (eyes-on for Slice 0: generate a real SDS report
for Ruthie's actual month and check it against the Acumen DCI format line by line). Selective
staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing, live_schema regen,
STUB_REGISTRY final sweep (rows 261/262/349-352/359-361 + entry 606), CLAUDE.md additions,
LiLa knowledge, FeatureGuide, archive build file.
```
