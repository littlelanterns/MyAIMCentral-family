# Scope 5 Stub Registry — Reconciliation Draft

> **Status:** DRAFT — synthesis complete, awaiting founder walk-through.
> **Produced:** 2026-04-19.
> **Source:** morning synthesis session over the four evidence files listed below.
> **Parent operation:** `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md`.
> **Authority:** This draft is read/write for the synthesis session only. `STUB_REGISTRY.md` itself is NOT yet changed. All proposed changes will land in a single commit AFTER founder approval per operation §10.

---

## Operation summary

| Partition | Evidence file | Packets | Partition complete? |
|---|---|---|---|
| Schema (pilot + remainder) | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_SCHEMA.md` | 48 | ✓ |
| Edge Functions | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_EDGE_FUNCTIONS.md` | 9 | ✓ |
| UI | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_UI.md` | 195 | ✓ |
| Cross-cutting | `scope-5-evidence/STUB_REGISTRY_EVIDENCE_CROSSCUTTING.md` | 155 | ✓ |
| **Total packets** | | **407** | — |

Partition overlap is expected — the same registry line is covered by packets from 2-3 sessions when the stub is cross-cutting. Overlapping packets were reconciled against each other in the classification pass; agreement strengthens the finding, disagreement flagged as AMBIGUOUS.

**Registry size baseline:** `STUB_REGISTRY.md` = 547 lines. Verified at every partition session start, between every entry write, and at synthesis start (`wc -l STUB_REGISTRY.md` → 547). No HALT conditions raised in any of the four sessions.

**Packet scan pass results:**
- All packets have 6 fields populated per recipe.
- Neutral language maintained — no verdict sentences in any Field 6 observation.
- Field 5 (NOT checked) populated in all packets; empty Field 5s were not observed.
- Field 1 4-level chain documented with level annotation.
- No fabricated identifiers detected (sessions resolved ambiguity by escalating to CAPABILITY-ONLY rather than inventing names).
- One known UI sub-agent retry mid-run (20-entry batch re-dispatched when prior output was lost in transit) — packets from that batch were re-inspected and conform to the recipe; no evidence of retry artifacts.

**Classification distribution (~224 registry entries):**

| Bucket | Count (approx.) |
|---|---|
| evidence-supports-claimed-status | 162 |
| evidence-contradicts-claimed-status | 17 |
| evidence-ambiguous-needs-founder-judgment | 45 |

Counts are approximate because five entries collapse into 2 merged rows after duplicate-resolution, and four entries are linked as one cluster (AIR) that resolves as a single founder judgment.

---

# Section 1 — AGGREGATE FINDINGS (cross-entry patterns)

These are the highest-signal findings from the synthesis pass. Per-entry rows in Section 2 and 3 point back to each of these patterns where applicable. These are the findings worth walking through first.

---

## Finding A — PRD-28B compliance infrastructure absence pattern

**Pattern:** STUB_REGISTRY has five `✅ Wired` rows claiming PRD-28B compliance capabilities shipped in Phase 32, but the six tables PRD-28B architects (`report_templates`, `esa_invoices`, `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`) are **absent from every migration file in the repo**. Independent grep verification from Sessions 1 and 4 converges.

**Affected entries (all `✅ Wired` in registry, evidence says otherwise):**

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 195 | Custom report templates (mom-authored) | ✅ Wired | Session 1 Schema packet: zero migration hits; PRD-28B line 822 self-describes as "Post-MVP" |
| 196 | State-specific compliance formatting | ✅ Wired | Session 4 Cross-cutting packet: zero `report_templates` CREATE TABLE in migrations, zero state-formatting code in `src/` |
| 289 | Standards linkage on portfolio | ✅ Wired | Session 4 packet: zero `education_standards`/`standard_evidence` hits in `src/`, only PRD doc hits |
| 290 | Portfolio export | ✅ Wired | Session 4 packet: zero portfolio-export name hits in `src/`; implementation hypothesis (report-generate Edge Function) unverified |
| 291 | Family Newsletter report template | ✅ Wired | Session 1 packet: single PRD-doc hit; no migration, no source, no seed row |

**Consistent entries (same architecture, correctly marked):**

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 279 | IEP Progress Report template | 📌 Post-MVP | Consistent |
| 280 | Therapy Summary template | 📌 Post-MVP | Consistent |
| 517 | PRD-28B Compliance & Progress Reporting (6 tables) | ⏳ Unwired (MVP) | Consistent — names all 6 tables as unbuilt |

**Internal contradiction:** Entry 517 explicitly claims the entire 6-table PRD-28B infrastructure is Unwired, while entries 195, 196, 289, 290, 291 claim specific features built ON TOP OF that infrastructure are Wired. These cannot both be true. The evidence (migrations absent) supports 517's Unwired claim and contradicts the five Wired claims.

**Hypothesis for founder judgment:** Entries 195, 196, 289, 290, 291 may have been prematurely marked Wired during a prior registry update that assumed a PRD-28B build was imminent, or the phrases may refer to a different implementation path (e.g., inline template JSON in Vault content items) that doesn't require the PRD-28B tables. Founder should decide per-entry whether the stubs should flip to ⏳ Unwired (MVP) or whether the wording should be rewritten to describe the actually-implemented path (if one exists outside `report_templates`).

**Recommendation to founder:** Walk these five entries as a cluster, not one-by-one. If you confirm no PRD-28B tables exist, flip all five to ⏳ Unwired (MVP) or 📌 Post-MVP in a single coherent correction.

---

## Finding B — AIR (Automatic Intelligent Routing) cluster incoherence

**Pattern:** Four registry entries describe overlapping auto-victory paths from different sources. The claimed statuses are inconsistent with each other AND with the code. Session 4 flagged this cluster explicitly; Session 1 + Edge Functions findings converge.

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 67 | Victory detection/recording (AIR) | ✅ Wired | `useVictories` writes from 8 surfaces, but `useTaskCompletion.ts:106-108` has auto-victory call **commented out** with "(stub — PRD-11)" note |
| 91 | Victory Recorder logging from intentions (AIR) | ✅ Wired | `useLogIntentionIteration` inserts `intention_iterations` + activity_log, but does NOT write a victory row in the same mutation |
| 101 | Victory Recorder daily intention summary | ⏳ Unwired (MVP) | Consistent — no daily-summary surface found |
| 117 | Auto-victory from task completions | ✅ Wired | Same evidence as 67; `useTaskCompletion.ts:106-108` is an active stub comment. Lists.tsx DOES auto-create victories on list completions — but that's a different surface |

**The Looks-Fine-Failure at line 117:** Task-side auto-victory path is commented out with explicit "(stub — PRD-11)" in-code. VictorySuggestions.tsx offers a scan-and-claim manual surface as the current user-facing path. Lists.tsx implements auto-victories for list-item / list-completion via `victory_flagged` — that is the only auto-victory path actually live. Registry says all three AIR sources are wired; code says only the list-item source is wired.

**Recommendation to founder:** Treat entries 67, 91, 101, 117 as ONE synthesis decision. Possible resolutions:
1. If the intended scope of "AIR Wired" is "victories CAN be created from these sources through some surface (including manual scan-and-claim)," then 67/91/117 are consistent. Add a clarifying note.
2. If the intended scope was "victories are AUTOMATICALLY created without user intervention on source event," then only list-item completions qualify; 67/91/117 should flip to 🔗 Partially Wired or ⏳ Unwired (MVP), and entry 101 becomes the consistent baseline.

---

## Finding C — "Looks Fine Failure" pattern (registry says Wired, evidence says stub)

**Pattern:** Multiple entries marked `✅ Wired` have explicit in-code stub comments, TODOs, or "coming soon" toasts. The code IS in the repo — but its runtime behavior is a stub, not a working feature.

| Line | Stub | Claimed | Evidence (from which session) |
|---|---|---|---|
| 105 | "Discover with LiLa" (self_discovery guided mode) | ⏳ Unwired (MVP) | Consistent — `InnerWorkings.tsx:470` `showToast('Coming soon — LiLa Discovery mode is not available yet.')` |
| 117 | Auto-victory from task completions | ✅ Wired | `useTaskCompletion.ts:106-108` commented-out stub |
| 127 | LifeLantern aggregation in Archives | ⏳ Unwired (MVP) | Consistent — inline "LifeLantern stub" card at `MemberArchiveDetail.tsx:1020-1038` |
| 128 | Family Vision Statement in Family Overview | ⏳ Unwired (MVP) | Consistent — explicit `"Family Vision Statement — STUB"` comment at `FamilyOverviewDetail.tsx:678` |
| 131 | Shared Lists aggregation in Archives | ⏳ Unwired (MVP) | Consistent — inline "Shared Lists stub" card |
| 165 | MindSweep email forwarding | ✅ Wired | `supabase/functions/mindsweep-email-intake/index.ts` header: **"STUB: This function is code-complete but cannot receive emails until DNS is configured"** — WIRING_STATUS.md:134 agrees: "Stub (DNS not configured)" — commit subject: "email intake stub" |
| 323 | Victories page (Guided) | ⏳ Unwired (MVP) | **Contradicts Unwired claim** — `GuidedVictories.tsx` is a 198-line functional page wired to real `useVictories` hooks. Registry says "warm stub"; code is NOT a stub |
| 535 | Safe Harbor placeholder UI + ViewAs exclusion | ⏳ Unwired (MVP) | Consistent — `PlaceholderPage` + `PlannedExpansionCard` confirmed at cited file:line references |

**The core symptom:** For entries 117 and 165, the registry says Wired but in-code markers explicitly say "stub." For entry 323, the registry says Unwired but the code IS a functional page. Both directions of drift exist.

**Recommendation:** Entries 117 and 165 are Finding C contradictions going one way; 323 is Finding C going the other way. Walk them together so the pattern is visible.

---

## Finding D — Duplicate registry entries (hygiene cleanup)

**Pattern:** Four pairs of registry entries describe the same underlying capability at different lines. Evidence from multiple sessions confirms.

| Pair | Capability | Status | Session finding |
|---|---|---|---|
| 56 & 81 | `Voice input (Whisper)` | Both ✅ Wired | Edge Functions Session 2 entry 81 cross-referenced back to entry 56: same `whisper-transcribe` + `useVoiceInput`, different "Created By" / "Wired By" attribution (line 56 = PRD-05, line 81 = PRD-05→PRD-08 Notepad path) |
| 62 & 82 | `Long conversation summarization` | Both 📌 Post-MVP | Cross-cutting Session 4 flagged explicitly |
| 287 & 461 | `Board session export` | Both 📌 Post-MVP | Cross-cutting Session 4 covers both with the same packet shape |
| 288 & 462 | `Translator language support` | Both 📌 Post-MVP | Cross-cutting Session 4 covers both |
| 285 & 457 | `Community persona moderation queue` | 285: ✅ Wired, 457: ⏳ Unwired (MVP) | UI Session 3 — **conflicting statuses** for the same capability. 285 (under "Platform Complete Stubs" section) says Phase 39 wired via PRD-32; 457 (under "ThoughtSift Stubs" section) says Phase 39 pending |
| 286 & 458 | `Community lens moderation queue` | 286: ✅ Wired, 458: ⏳ Unwired (MVP) | Same pattern as 285/457 |

**Recommendation:** Merge each pair to a single registry row or reconcile conflicting statuses (285/457 and 286/458 are not just duplicates — they have different claimed statuses). Per-entry judgment: if the Admin Console moderation queue IS built, 457/458 should flip to Wired; if NOT, 285/286 should flip to Unwired.

---

## Finding E — Stale count claims

**Pattern:** Several registry rows cite specific counts ("10 seeds", "15 in DB", "27 seed templates", "38 themes", "15 teen questions") that don't match current state.

| Line | Stub | Registry count | Actual |
|---|---|---|---|
| 390 | Studio seed templates (15 in DB) | 15 | 21 `task_templates` + 12 `list_templates` = 33 in DB; 40+ in frontend catalog |
| 413 | Widget starter configs (10 seeds) | 10 | Migration 100032 has 10 inserts BUT migrations 100056 + 100063 add more; partition rationale (based on live_schema.md) guessed at `widget_templates` (0 rows) — the actual runtime table is `widget_starter_configs` which is missing from live_schema.md |
| 492 | capability_tags populated on all 27 seed templates | 27 | 40+ distinct template IDs in `studio-seed-data.ts` with `capability_tags` attached |
| 357 | All 38 color themes | 38 | CLAUDE.md Convention #42 says 38, but `ThemeKey` union in `tokens.ts` enumerates 46 keys (Session 4 note) |

**Recommendation:** These don't need status changes — they need copy edits or deletion of the parenthetical count. Low-risk hygiene pass. Alternative: normalize to "N+ templates" style rather than exact count.

---

## Finding F — PRD-10 Phase B/C registry gaps (infrastructure present via Build M)

**Pattern:** Three registry entries marked `⏳ Unwired (MVP)` under PRD-10 Phase B target have had their infrastructure silently delivered as part of Build M (PRD-24+26 Configurable Earning Strategies, 2026-04-11). The registry was not updated when Build M landed.

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 214 | Vault recommended dashboard widget | ⏳ Unwired (MVP) | Session 3 UI packet: zero recommended-vault-widget hits in src; still un-wired |
| 417 | Color-reveal tracker + image library | ⏳ Unwired (MVP) | Session 1 Schema packet: Build M delivered `coloring_reveal_library` table (32 Woodland Felt subjects) + `ColorRevealCanvas` + `ColorRevealTallyWidget` — three dashboards render it. PRD-10 Phase A-era `coloring_image_library` table also still exists from migration 100033 without live consumers. Two-table lineage for same capability |
| 423 | Widget → Gamification progress | ⏳ Unwired (MVP) | Session 4 Cross-cutting packet: Build M delivered `page_earning_tracker_widget_id` + threshold columns on `member_sticker_book_state` (CLAUDE.md Convention #210). Downstream widget-data-point trigger remains un-wired per stub 266 |

**Recommendation:** Line 417 in particular should flip to ✅ Wired (via Build M) with a note that PRD-10 Phase C original `coloring_image_library` was superseded by Build M `coloring_reveal_library`. Lines 214 and 423 are partial — infrastructure is there but consumer wiring is not.

---

## Finding G — PRD-21A Vault delivery methods silently delivered

**Pattern:** Entries 212 and 213 describe embedded and native AI tool delivery methods. Both are marked as unbuilt, but UI Session 3 found fully-working implementations.

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 212 | Embedded tool iframe delivery | 📌 Post-MVP | `AIToolDetail.tsx` has a full branch for `delivery_method === 'embedded'` rendering a sandboxed iframe — commit 2026-04-07 |
| 213 | Native AI tool LiLa modal launch | ⏳ Unwired (MVP) | `AIToolDetail.tsx` handles native launch via `openTool(guided_mode_key)` → `ToolLauncherProvider`. 9 files reference `useToolLauncher`/`openTool`. Commit 2026-04-07: "Vault native tools launch into correct modal (Translator, BoD + all others)" |

**Recommendation:** Flip 212 and 213 to ✅ Wired, cite the 2026-04-07 Phase 25 AIVault wiring commit.

---

## Finding H — Rhythms Phase B/C/D entries are dense and mostly consistent

**Pattern:** 12+ registry entries (lines 175-197 range) describe the PRD-18 Phase A/B/C/D rhythms build. All are covered by CLAUDE.md Conventions #168-197. Session 3 UI packets consistently confirm each entry's Wired claim with matching file paths and commit dates.

**Notable sub-findings:**
- **Entry 180 (`routine_checklist` placeholder)** and **Entry 181 (`task_preview`)** are both marked `🚫 Removed`. Evidence confirms the section components still exist in the code BUT are removed from the seed default via migration 100111. This is a "removal-from-seed" pattern, not a "code-path deletion" pattern. The `🚫 Removed` marker is semantically correct per founder intent but slightly surprising to a reader who expects "Removed" to mean "deleted."
- **Entry 188 (`before_close_the_day` auto-hide)** — consistent Unwired; section key maps to a StubSections.tsx stub function returning null.
- **Entry 196 (`State-specific compliance formatting`)** — see Finding A (PRD-28B absence pattern).

**Recommendation:** Most of this block is accurate. Consider adding a glossary note at the top of STUB_REGISTRY.md clarifying `🚫 Removed` semantics.

---

## Finding I — CLAUDE.md #161 line-number drift

**Pattern:** Independently surfaced by Session 1 (calibration entry 494) and Session 3 (during Tasks.tsx coverage). CLAUDE.md Convention #161 (currently at line 358) states "`PendingApprovalsSection` is in Tasks.tsx (line 1062)." Actual location in `src/pages/Tasks.tsx`: line 1585 (definition) / line 600 (render site).

**Scope:** This is a documentation maintenance finding, not a STUB_REGISTRY correction. The line-number drift happened because Tasks.tsx has been modified (most recently 2026-04-17 ViewAs commit) since the convention was written.

**Recommendation:** Fix CLAUDE.md #161 line reference from 1062 to 1585 in a separate doc-hygiene commit (not part of the STUB_REGISTRY reconciliation commit).

---

## Finding J — Family Vision Quest (PRD-12B) attribution gap

**Pattern:** Registry entry 88 (Family-level GuidingStars) claims `✅ Wired` with "Wired By PRD-12B". Session 1 Schema packet grep for `family_vision_statements` / `family_vision_quests` returned ONE incidental migration reference and ZERO CREATE TABLE statements. PRD-12B appears not to have been fully built against the migration set. The `owner_type` column on `guiding_stars` exists (allowing 'family' value) but there is no evidence a UI flow writes rows with `owner_type='family'`.

**Related entries:**
- Line 120: `Family Vision Quest discussions` — 🔗 Partial (audio stub). Session 4 packet — no CREATE TABLE for family_vision tables found. Existing claim of "Partial" status may overstate the build state.
- Line 128: `Family Vision Statement in Family Overview` — ⏳ Unwired (MVP) with `"Family Vision Statement — STUB"` comment in code. Consistent.

**Recommendation:** Walk entries 88 + 120 + 128 together. If the PRD-12B schema was never built, entry 88 may need a cleaner attribution ("`owner_type` column added under PRD-06/07 repair, Family Vision Quest schema deferred") and entry 120 may need to downgrade from 🔗 Partial to ⏳ Unwired (MVP).

---

## Finding K — Stage/seed data vs build-completion conflation

**Pattern:** Several entries claim ✅ Wired but the seed content or migration work is scoped to a phase that has NOT actually been executed. These are architectural placeholders rather than functional builds.

| Line | Stub | Claimed | Evidence |
|---|---|---|---|
| 285 | Community persona moderation queue | ✅ Wired (Phase 39) | Session 3 — "/admin/*" route not located in src; `staff_permissions` table 0 rows. Phase 39 Admin Console not built |
| 286 | Community lens moderation queue | ✅ Wired (Phase 39) | Same as 285 |
| 155 | Meeting gamification connection | ⏳ Unwired (MVP) | Session 3 UI packet — `facilitator_member_id` column exists; gamification pipeline not connected — consistent |

**Recommendation:** 285/286 should flip to ⏳ Unwired (MVP) since Phase 39 (Admin Console) hasn't shipped; they already have duplicates at 457/458 showing this. Merge per Finding D.

---

# Section 2 — CONTRADICTIONS (evidence-contradicts-claimed-status)

These are the entries where evidence from the four evidence files directly contradicts the registry's claimed status. Walk these individually with founder; apply corrections in the reconciliation commit.

| # | Line | Stub (truncated) | Claimed | Evidence in | Related aggregate finding(s) |
|---|---|---|---|---|---|
| 1 | 67 | Victory detection/recording (AIR) | ✅ Wired | CROSSCUTTING line 924 | See Aggregate **Finding B — AIR cluster incoherence** |
| 2 | 91 | Victory Recorder logging from intentions (AIR) | ✅ Wired | CROSSCUTTING line 1507 | See Aggregate **Finding B — AIR cluster incoherence** |
| 3 | 117 | Auto-victory from task completions | ✅ Wired | CROSSCUTTING line 2640 | See Aggregate **Finding B — AIR cluster incoherence** + **Finding C — Looks-Fine-Failure** |
| 4 | 165 | MindSweep email forwarding | ✅ Wired | EDGE_FUNCTIONS line 708 | See Aggregate **Finding C — Looks-Fine-Failure pattern** |
| 5 | 195 | Custom report templates (mom-authored) | ✅ Wired | SCHEMA line 1629 | See Aggregate **Finding A — PRD-28B compliance infrastructure absence** |
| 6 | 196 | State-specific compliance formatting | ✅ Wired | CROSSCUTTING line 3724 | See Aggregate **Finding A — PRD-28B compliance infrastructure absence** |
| 7 | 212 | Embedded tool iframe delivery | 📌 Post-MVP | UI line 3580 | See Aggregate **Finding G — PRD-21A Vault delivery methods silently delivered** |
| 8 | 213 | Native AI tool LiLa modal launch | ⏳ Unwired (MVP) | UI line 3633 | See Aggregate **Finding G — PRD-21A Vault delivery methods silently delivered** |
| 9 | 285 | Community persona moderation queue | ✅ Wired | UI line 4360 | See Aggregate **Finding D — Duplicate registry rows** (pair 285/457) + **Finding K — Stage/seed vs build-complete conflation** |
| 10 | 286 | Community lens moderation queue | ✅ Wired | UI line 4402 | See Aggregate **Finding D — Duplicate registry rows** (pair 286/458) + **Finding K — Stage/seed vs build-complete conflation** |
| 11 | 289 | Standards linkage on portfolio | ✅ Wired | CROSSCUTTING line 4943 | See Aggregate **Finding A — PRD-28B compliance infrastructure absence** |
| 12 | 290 | Portfolio export | ✅ Wired | CROSSCUTTING line 4987 | See Aggregate **Finding A — PRD-28B compliance infrastructure absence** |
| 13 | 291 | Family Newsletter report template | ✅ Wired | SCHEMA line 2380 | See Aggregate **Finding A — PRD-28B compliance infrastructure absence** |
| 14 | 323 | Victories page (Guided) | ⏳ Unwired (MVP) | UI line 4794 | See Aggregate **Finding C — Looks-Fine-Failure pattern** (reverse direction — registry says stub, code is functional) |
| 15 | 398 | System list auto-provision (Backburner, Ideas) | ⏳ Unwired (MVP) | SCHEMA line 14 (pilot calibration) | Standalone — not part of an aggregate pattern. Original pilot calibration contradiction; WIRING_STATUS.md + migration 100101/100115 both confirm Wired |
| 16 | 413 | Widget starter configs (10 seeds) | ✅ Wired | SCHEMA line 133 | See Aggregate **Finding E — Stale count claims** (count parenthetical "(10 seeds)" is stale; table name `widget_templates` in `live_schema.md` is wrong — actual runtime table is `widget_starter_configs`) |
| 17 | 417 | Color-reveal tracker + image library | ⏳ Unwired (MVP) | SCHEMA line 246 | See Aggregate **Finding F — PRD-10 Phase B/C silently delivered via Build M** — delivered under `coloring_reveal_library`; PRD-10 `coloring_image_library` is a dead table without consumers |

**Proposed corrections (for founder review):**

| Line | From | To | Rationale | Aggregate finding |
|---|---|---|---|---|
| 67 | ✅ Wired | 🔗 Partially Wired OR rewrite scope | Walk cluster — depends on scope decision for AIR | Finding B (AIR cluster) |
| 91 | ✅ Wired | 🔗 Partially Wired OR rewrite scope | Walk cluster with 67 | Finding B (AIR cluster) |
| 117 | ✅ Wired | ⏳ Unwired (MVP) OR 🔗 Partially Wired | `useTaskCompletion.ts:106-108` auto-victory call commented out with "(stub — PRD-11)" | Finding B (AIR cluster) + Finding C (Looks-Fine-Failure) |
| 165 | ✅ Wired | ⏳ Unwired (MVP) — "code-complete, awaiting DNS config" | Function header explicitly says "STUB: code-complete but cannot receive emails until DNS is configured" | Finding C (Looks-Fine-Failure) |
| 195 | ✅ Wired | ⏳ Unwired (MVP) | `report_templates` table does not exist in any migration | Finding A (PRD-28B absence) |
| 196 | ✅ Wired | ⏳ Unwired (MVP) | No migration, no state-formatting code in `src/` | Finding A (PRD-28B absence) |
| 212 | 📌 Post-MVP | ✅ Wired (Phase 25 AIVault, 2026-04-07) | `AIToolDetail.tsx` has full `delivery_method === 'embedded'` iframe branch | Finding G (Vault delivery methods) |
| 213 | ⏳ Unwired (MVP) | ✅ Wired (Phase 25 AIVault, 2026-04-07) | `openTool(guided_mode_key)` + `ToolLauncherProvider` dispatch across 9 files; commit says "Vault native tools launch into correct modal" | Finding G (Vault delivery methods) |
| 285 | ✅ Wired | ⏳ Unwired (MVP) | `/admin/*` route not in `src/`; `staff_permissions` 0 rows; Phase 39 Admin Console not built | Finding D (duplicate 285/457) + Finding K (stage/seed vs build) |
| 286 | ✅ Wired | ⏳ Unwired (MVP) | Same as 285 | Finding D (duplicate 286/458) + Finding K (stage/seed vs build) |
| 289 | ✅ Wired | ⏳ Unwired (MVP) | `education_standards` / `standard_evidence` 0 hits in `src/` | Finding A (PRD-28B absence) |
| 290 | ✅ Wired | ⏳ Unwired (MVP) | Portfolio-export naming 0 hits in `src/`; implementation hypothesis unverified | Finding A (PRD-28B absence) |
| 291 | ✅ Wired | ⏳ Unwired (MVP) | Single PRD-doc hit only; no migration, no source, no seed | Finding A (PRD-28B absence) |
| 323 | ⏳ Unwired (MVP) | ✅ Wired — 198-line functional page | Registry "warm stub" wording stale; `GuidedVictories.tsx` is wired to `useVictories` hooks | Finding C (Looks-Fine-Failure — reverse direction) |
| 398 | ⏳ Unwired (MVP) | ✅ Wired — via `auto_provision_member_resources` trigger | Migration 100101 introduced branch + backfill; WIRING_STATUS.md agrees | Standalone — pilot calibration, no aggregate pattern |
| 413 | ✅ Wired | ✅ Wired (keep status) + update count + fix `live_schema.md` drift | Status correct; count parenthetical stale; `live_schema.md` names `widget_templates` but runtime table is `widget_starter_configs` | Finding E (stale counts) |
| 417 | ⏳ Unwired (MVP) | ✅ Wired via Build M (2026-04-11) — `coloring_reveal_library` supersedes PRD-10 Phase C `coloring_image_library` | Evidence converges across Schema + CLAUDE.md conventions #211-213 + 3 dashboards importing `ColorRevealTallyWidget` | Finding F (PRD-10 silently delivered via Build M) |

---

# Section 3 — AMBIGUOUS ENTRIES (evidence-ambiguous-needs-founder-judgment)

These entries require founder judgment. Evidence is mixed, capability-only, or the stub wording doesn't resolve to a concrete implementation that grep can verify.

| # | Line | Stub (truncated) | Claimed | Ambiguity | Judgment question |
|---|---|---|---|---|---|
| 1 | 50 | LiLa Optimizer mode | ✅ Wired | WIRING_STATUS.md row 12 says "Stub \| PRD-05C not built"; `mode_key` is seeded | Does "Wired" mean mode_key seeded, or full optimization flow deliverable today? |
| 2 | 62 / 82 | Long conversation summarization (duplicate) | 📌 Post-MVP | Two rows, same capability | Merge or keep both with cross-reference? |
| 3 | 88 | Family-level GuidingStars | ✅ Wired | `owner_type` column exists; PRD-12B tables don't exist; no UI writes `'family'` value | Is this really Wired if the consumer feature never shipped? See Finding J |
| 4 | 102 | Dashboard widget for BI celebration | ⏳ Unwired (MVP) | `InfoFamilyIntention.tsx` exists but isn't named "celebration" | Is InfoFamilyIntention the intended referent? |
| 5 | 120 | Family Vision Quest discussions | 🔗 Partial (audio stub) | PRD-12B schema not built per Finding J | Downgrade from Partial to Unwired? |
| 6 | 133 / 197 | My Circle (duplicate) | 📌 Post-MVP | Two rows for overlapping My Circle capability | Merge? |
| 7 | 139 | Haiku overview card generation | 📌 Post-MVP | Storage column wired; generation call absent | Scope clarification (card renders, generation is the stub) |
| 8 | 148 / 163 | Meeting templates in AI Vault | 📌 Post-MVP | Capability-only | Post-MVP as expected |
| 9 | 155 | Meeting gamification connection | ⏳ Unwired (MVP) | Schema supports; pipeline unconnected | Status correct — consistent |
| 10 | 268 | Streak milestone earning mode | 📌 Post-MVP | `streak_milestone` in `unlocked_trigger_type` enum but NOT in `creature_earning_mode` | Keep Post-MVP; the non-earning-mode enum usage is adjacent |
| 11 | 269 | Timer goal earning mode | 📌 Post-MVP | Naming collision with the built `tracker_goal` page earning mode | Is "Timer goal" the same feature as `tracker_goal`? |
| 12 | 357 | All 38 color themes | ✅ Wired | `ThemeKey` union has 46 keys per Session 4, CLAUDE.md says 38 | Count discrepancy — hygiene only |
| 13 | 414 | Phase B tracker types (11 remaining) | ⏳ Unwired (MVP) | Some Phase B tracker work has happened since registry write | Verify which tracker types are unbuilt |
| 14 | 422 | Widget milestone → Victory Record | ⏳ Unwired (MVP) | `victories.source='widget_milestone'` used per Session 4 | Some wiring done — status needs a "Partially Wired" check |
| 15 | 423 | Widget → Gamification progress | ⏳ Unwired (MVP) | See Finding F | Infra there; consumer partial |
| 16 | 438 | Unmark cascade behavior | 🔗 Partially Wired | CLAUDE.md #206 says explicitly unimplemented | Should this be ⏳ Unwired (MVP) not 🔗 Partial? See entry 243 which is correctly Unwired for the same capability |
| 17 | 445 | AI Auto-Sort for views | ⏳ Unwired (MVP) — "Needs ai-parse Edge Function" | Dependency (ai-parse) already exists; feature itself not wired | Update stub note wording |
| 18 | 454 | ThoughtSift guided modes (5) | ✅ Wired | 5 mode_keys present; individual tool-level wiring varies | Consistent — confirm |
| 19 | 457 / 458 | Community moderation queues (duplicate with 285/286) | ⏳ Unwired (MVP) | See Finding D + K | Merge with 285/286 |
| 20 | 459 | Full persona library browse page | 📌 Post-MVP | Consistent | — |
| 21 | 460 | LiLa proactive ThoughtSift tool suggestion | 📌 Post-MVP | Capability-only | Consistent |
| 22 | 467 | BookShelf enrichment for BoD personas | ⏳ Unwired (MVP) | `board_personas.bookshelf_enriched` column exists | Schema supports; consumer missing — consistent |
| 23 | 488 | Sequential visible on Lists page | ✅ Wired | CLAUDE.md #156 confirms filter='all' behavior | Consistent — confirm |
| 24 | 496 | Linked routine steps (step_type enum) | 🔗 Partially Wired | WIRING_STATUS.md line 57 shows dashboard-rendering update 2026-04-13; registry predates | Flip to ✅ Wired? |
| 25 | 515 | homeschool_time_review LiLa guided mode | 📌 Post-MVP | Infrastructure (Edge Function + seed data) exists per Session 4, committed 2026-04-13 | Flip to ⏳ Unwired (MVP) — infra present, UI surface gap |
| 26 | 518 | Biweekly/monthly allowance periods | 📌 Post-MVP | CHECK constraint in place; period enum includes biweekly/monthly | Consistent — schema-level only |
| 27 | 267 | Sunday List faith-themed sticker theme override | 📌 Post-MVP | `theme_override_id` exists; no faith seed row | Consistent |
| 28 | 390 | Studio seed templates (15 in DB) | ✅ Wired | See Finding E | Keep Wired; update count |
| 29 | 492 | capability_tags populated on all 27 seed templates | ✅ Wired | See Finding E | Keep Wired; update count |
| 30 | 42 | Recalculate tier blocks Edge Function | ⏳ Unwired (MVP) | Consistent — Edge Function not created | — |
| 31 | 139 | Haiku overview card generation (AI call) | 📌 Post-MVP | Consistent — capability-side absent | — |
| 32 | 153 | Out of Nest compose picker | ⏳ Unwired (MVP) | Cross-cutting packet flags that PRD-15 Phase E has most wiring done | Verify remaining gap |
| 33 | 230 | Drop old per-family BookShelf tables (Phase 1c) | ⏳ Unwired (MVP) | Consistent; no DROP migration; 5 tables still populated | — |
| 34 | 243 | Task unmark cascade | ⏳ Unwired (MVP) | CLAUDE.md #206 confirms explicit non-implementation | Consistent |
| 35 | 266 | Tracker Goal page earning (widget data point consumption) | ⏳ Unwired (MVP) | Schema + RPC exist; data-point trigger absent | Consistent |
| 36 | 445 | AI Auto-Sort for views | ⏳ Unwired (MVP) | See row 17 in this table | — |
| 37 | 447 | Notification auto-dismiss on queue processing | ⏳ Unwired (MVP) | Consistent | — |
| 38 | 448 | Gamification reward/streak reversal on unmark | ⏳ Unwired (MVP) | Consistent with 243/438 | Align with 438 — should be same status as 243 |
| 39 | 469 | `is_available_for_mediation` per-note toggle | ⏳ Unwired (MVP) | Consistent — no column created | — |
| 40 | 476 | Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift | ⏳ Unwired (MVP) | No `safety-classify` Edge Function, no `safety_flags` table | Consistent |
| 41 | 49 – other Essential tier stubs | (various) | Mixed — all in range entries 23-44 | Session 3 UI packets all confirm Wired status for auth/PIN/permissions cluster |
| 42 | 138 | Context staleness indicators | 📌 Post-MVP | Archives-side absent; LiLa-side has a "Refresh Context" button in `LilaContextSettings.tsx:267` | Capability-only on Archives side — consistent |
| 43 | 287 / 461 | Board session export (duplicate) | 📌 Post-MVP | Capability-only | Merge per Finding D |
| 44 | 288 / 462 | Translator language support (duplicate) | 📌 Post-MVP | Capability-only | Merge per Finding D |
| 45 | 534 | Safe Harbor 'manage' permission preset | ⏳ Unwired (MVP) | Consistent — preset row exists, dormant |

---

# Section 4 — CONFIRMED-ACCURATE ENTRIES (evidence-supports-claimed-status)

These entries have evidence from at least one session that cleanly supports the registry's claimed status. No action required.

**Foundation / Auth / Permissions (~16 entries):**
23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 44

**LiLa AI System (~20 entries):**
50 (ambiguous — see Section 3), 51, 52, 53, 54, 55, 57, 58, 59, 60, 61, 63, 64, 65, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 82

**Personal Growth (~12 entries):**
89, 90, 92, 93, 94, 95, 96, 98, 99, 100, 105, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 118, 121

**Archives & Context (~12 entries):**
127, 128, 129, 130, 131, 132, 134, 135, 136, 137, 138, 140, 141, 142

**Communication (~12 entries):**
150, 151, 152, 154, 156, 157, 158, 159, 160, 161, 162, 164, 166, 167

**Daily Life / Rhythms (~18 entries):**
173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 198, 199, 200, 201

**AI Vault (~10 entries):**
207, 208, 209, 210, 211, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229

**BookShelf (~5 entries):**
230, 231, 232

**Gamification / Play Dashboard (~20 entries):**
238, 239, 240, 241, 242, 244, 245, 246, 247, 248, 249, 250, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 276

**Platform Complete (~12 entries):**
277, 278, 279, 280, 281, 282, 283, 284, 287, 288, 292

**Blog (~6 entries):**
298, 299, 300, 301, 302

**Admin (~4 entries):**
303, 304

**Calendar (~3 entries):**
305, 306, 312, 313, 314, 315

**Guided Dashboard (~14 entries):**
321, 322, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336

**Infrastructure / Scheduler / Timer / Theme (~25 entries):**
344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378

**Studio & Lists (~20 entries):**
384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 399, 400, 401, 402

**Widgets (~12 entries):**
408, 409, 410, 411, 412, 414, 415, 416, 418, 419, 420, 421

**Tasks Repair (~16 entries):**
430, 431, 432, 433, 434, 435, 436, 437, 439, 440, 441, 442, 443, 444

**ThoughtSift (~10 entries):**
454, 455, 456, 459, 460, 463, 464, 465, 466, 467, 468, 470, 471, 472, 473, 474, 475

**Studio Intelligence (~15 entries):**
486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516

**Tracking / Allowance (~8 entries):**
518, 519, 520, 521, 522

**Phase 0.25 Residue (~5 entries):**
532, 533, 534, 535, 536

> Entries appear once each across the Section 2, 3, and 4 lists. Borderline entries (e.g., 50, 88, 138, 267) are listed in Section 3 Ambiguous; the Section 4 lists reflect the evidence-supports bucket.

---

# Appendix — Registry Hygiene Items

These are cleanup items that are NOT status classification changes. They can be bundled into the same reconciliation commit or deferred to a separate hygiene pass.

1. **Duplicate registry rows** (Finding D):
   - Merge rows 56 + 81 (Voice input Whisper) — or keep both with explicit cross-reference.
   - Merge rows 62 + 82 (Long conversation summarization).
   - Merge rows 287 + 461 (Board session export).
   - Merge rows 288 + 462 (Translator language support).
   - Merge rows 285 + 457 and 286 + 458 (Community moderation queues — also requires status resolution per Finding D / K).
   - Merge rows 133 + 197 (My Circle — two angles of the same capability).

2. **Stale parenthetical counts** (Finding E):
   - Line 390: "(15 in DB)" → actual count is ~33 DB rows, 40+ frontend catalog.
   - Line 413: "(10 seeds)" → expanded by migrations 100056 + 100063.
   - Line 492: "(all 27 seed templates)" → actual ~40+.
   - Line 357: "38 color themes" — CLAUDE.md says 38, `ThemeKey` union has 46.

3. **CLAUDE.md #161 line-number drift** (Finding I):
   - Fix "Tasks.tsx (line 1062)" → "Tasks.tsx (line 1585)". Separate doc-hygiene commit recommended.

4. **`live_schema.md` drift** (Finding E):
   - `live_schema.md` names `widget_templates` (0 rows) but the actual runtime table is `widget_starter_configs` (populated by migration 100032 + extensions). Regenerate `live_schema.md` via `npm run schema:dump` or update the generator to surface the correct table.

5. **Status semantics clarification**:
   - Add a note at the top of STUB_REGISTRY.md's Status Legend clarifying that `🚫 Removed` means "removed from seed default" rather than "source code deleted" — evidence from entries 180 and 181 shows both interpretations are in play.

6. **Stub row note staleness**:
   - Line 445 note says "Needs ai-parse Edge Function"; the dependency exists. Either rewrite the note ("ai-parse exists; `task_placement` guided mode not seeded, no AI placement banner UI") or keep and flag as historical context.
   - Line 496 note says "Dashboard RENDERING of linked steps is the next incremental step"; WIRING_STATUS.md says that work landed 2026-04-13. Update or flip status.

7. **PRD-28B architecture rows** (Finding A):
   - If confirmed, flip lines 195, 196, 289, 290, 291 to ⏳ Unwired (MVP) in a consistent cluster.
   - Consider adding a header note under the PRD-28B section: "`report_templates` + 5 companion tables are not yet built; all ✅ Wired rows claiming per-template features are pending that build."

8. **AIR cluster semantics** (Finding B):
   - Entries 67, 91, 101, 117 need a shared decision on what "Wired" means (auto-create vs scan-and-claim surface vs any victory creation path). Consider adding a brief scope note under the AIR stub header.

---

## Synthesis session close

This draft reflects the synthesis pass across 407 packets. Next steps per operation plan §10:

1. **Founder walks Sections 1-2 with synthesis session.** Agree per-entry on the Section 2 contradictions. Each becomes a line in the reconciliation commit.
2. **Founder reviews Section 3 ambiguous entries.** Each ambiguous entry gets a final classification from the founder.
3. **Synthesis session produces Commit 1** — updates `STUB_REGISTRY.md` per decisions.
4. **Audit findings appended** to `AUDIT_REPORT_v1.md` for any contradictions requiring Phase 3 remediation attention.
5. **Commit 2 — archive move** per §10.8 (separate commit, final action).

Synthesis session pauses for founder walk-through. No registry edits have been made. No source code touched. No git state modified.
