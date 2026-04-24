# COMPOSITION_ARCHITECTURE_TRIAGE_DELTA.md

> **Status:** DRAFT for founder review — 2026-04-22
> **Purpose:** Apply the Composition Architecture & Assembly Patterns doc (Parts 1 and 2) to the Phase 3 Triage Worksheet. Identifies (a) existing findings the doc reinforces, (b) existing findings the doc resolves / reclassifies, (c) conflicts requiring founder approval before any Fix-Now ↔ Intentional-Update-Doc reclassification, (d) new findings the doc surfaces that need worksheet rows.
> **Do NOT apply any changes until founder approves.** Worksheet untouched pending this review.
> **Source:** [Composition-Architecture-and-Assembly-Patterns.md](claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md) (893 lines, Parts 1 and 2 + 36 draft notes)
> **Scope constraint:** Part 3 (Wizard Library Taxonomy + Gate 2 priority reshape) is OUT OF SCOPE per brief. Do not derive Part 3 or reshape Gate 2.

---

## Brief ID discrepancy — needs resolution

The brief says *"Apply the doc to SCOPE-2.F21 (Opportunity Board recon finding)"*. **SCOPE-2.F21 is actually "PRD-18 teen experience supersession"** — unrelated to Opportunity Board. No F-heading in claude/web-sync/AUDIT_REPORT_v1.md labels "Opportunity Board recon." The Opportunity Board references in the audit live in:

- Appendix B "Opportunity Board Wizard" section (a cross-reference, not a finding)
- Line 2015 Appendix B row tying SCOPE-2.F21 to Opportunity Board Wizard teen-UX — that's where the F21↔Opportunity Board association likely came from

**The doc's Opportunity resolution actually touches these existing rows:**
- **SCOPE-2.F27** (PRD-09B list type catalog) — primary landing zone for the 4-property formalization + Lists page + Opportunity Board dissolve
- **Convention 70** (no F-heading; amendment tracked as a NEW finding below)
- Multiple cross-references below

**Action requested:** Confirm the brief meant "the Opportunity Board fragmentation concern the recon surfaced" rather than a specific F21 row. I'll proceed on that reading unless corrected.

---

## Section A — Existing findings the doc reinforces (keep current classification, expand notes)

These findings are correctly classified. The doc adds architectural framing but does not change the verdict. Propose: keep as-is; add a one-line cross-reference to the Composition Architecture doc in the Notes column.

| Finding ID | Current class | Doc's reinforcement | Proposed action |
|---|---|---|---|
| SCOPE-2.F26 | Intentional-Update-Doc | Doc §1.1 names Habit as a primitive category via trackers. Habit task type remediation ties to tracker primitives, not new flow. | Keep. Add note: "Habit remediation routes through Tracker primitive per Composition Architecture §1.1." |
| SCOPE-2.F58 | Fix Next Build | Doc §1.3 names "reward-to-reward-list" connector; reward economy IS this connector. | Keep. Add note: "Reward economy = reward-to-reward-list connector per doc §1.3." |
| SCOPE-2.F61 | Fix Next Build | Doc §1.2 reveal-attachment property + §1.3 reveal-as-task-presentation connector formalize what F61 calls "lego wiring." | Keep. Add note: "Landing target for the four CSS/SVG reveals + micro-celebrations per doc §1.2 + §1.3." |
| SCOPE-2.F62 | Fix Next Build | Doc §1.3 reveal-as-task-presentation is the architecture F62 describes. Color Reveal is a connector instance. | Keep. Add note: "Color Reveal fuller architecture = reveal-as-task-presentation connector per doc §1.3. Build M 1:1 tally counter is a special case of the general pattern." |
| SCOPE-3.F8 | Intentional-Update-Doc | Doc §1.1 + §1.3 IS the Lego/surge-protector naming the finding asks for. 9+ primitives now have doc-documented production homes. | Keep (Intentional-Update-Doc). Note: "Primitives inventoried in doc §1.1; connector patterns in doc §1.3. Production assignments per Part 3 Wizard Library Taxonomy (pending)." |
| SCOPE-3.F28 | Fix Next Build | Doc §1.3 formalizes every connector needed for PRD-24 integration edges. | Keep. Add note: "Integration edges = doc §1.3 connectors (tracker-to-reveal, reveal-to-reward-list, routine-completion-to-allowance). F28 scope is implementation of already-documented connectors." |

---

## Section B — Existing findings the doc directly resolves (reclassification proposals)

⚠️ **Founder approval required on any Fix-Now ↔ Intentional-Update-Doc crossing.** Flagged per brief.

| Finding ID | Current class | Doc's resolution | Proposed new class | ⚠️ Conflict? |
|---|---|---|---|---|
| **SCOPE-2.F27** (PRD-09B list type catalog) | Fix Next Build | Doc §1.2 introduces 4 independent list-behavior properties (`presentation_mode`, `is_browsable`, `is_opportunity`, `pick_n`) that supersede the "5 extras catalog" framing entirely. Doc §1.1 also adds `maintenance` + `consequences` + `records` as new list_types. Scope expands from "codify 5 extras" to "formalize properties + add 3 types + add Lists page primitive + retire Opportunity Board as separate surface." | **Fix Next Build (scope expanded)** — severity bump Low→Medium given scope growth. | ❌ No class crossing — severity bump only. Founder may still want to weigh in. |
| **SCOPE-3.F15** (CLAUDE.md convention proposal: Lego Primitive Connector Documentation) | Intentional-Update-Doc | The finding *proposed* authoring a Lego convention. The Composition Architecture doc IS that convention (authored 2026-04-21 as a cross-cutting architecture doc, larger in scope than a single CLAUDE.md entry). | **Closed/Resolved** (doc authored) — add pointer conventions to CLAUDE.md that reference the doc. | ⚠️ Intentional-Update-Doc → Closed/Resolved. Founder approval requested. |
| **SCOPE-2.F38** (PRD-26 reveal architecture superseded by Build M — 5 styles → 2 per-segment) | Intentional-Update-Doc | Doc §1.3 reveal-as-task-presentation connector + §1.2 reveal-attachment property reframe: reveals are UNIVERSAL presentation wrappers, Build M per-segment styles are ONE application, original 5 styles are a larger reveal library. Neither is wrong; both are valid layers of the architecture. | **Intentional-Update-Doc (scope expanded — not Closed)** — PRD-26 update should reflect the two-layer understanding (Build M per-segment + full reveal library per doc §1.3). | ❌ No class crossing. Scope note only. |
| **SCOPE-3.F21** (PRD-26 Build-M-superseded surfaces: Reveal Task Tile + Mom Message Card + section-key data-driven layout) | Fix Next Build | Doc §1.3 reveal-as-task-presentation connector IS the Reveal Task Tile pattern generalized. Section-key data-driven layout ties to Segment primitive §1.1. | Keep Fix Next Build. Scope note: "Reveal Task Tile = reveal-as-task-presentation instance per doc §1.3. Section-key layout = Segment primitive per doc §1.1." | ❌ No class crossing. |
| **SCOPE-3.F23** (PRD-14 dashboard polish bundle — col_span + grid sharing + Today's Victories widget) | Fix Next Build | Doc §1.2 introduces `display_on_dashboard` per-member + `dashboard_display_mode` (full/truncated/collapsed) properties. Col_span is a specific rendering concern underneath this property system. | Keep Fix Next Build. Scope note: "col_span ships alongside dashboard_display_mode + display_on_dashboard per doc §1.2." | ❌ No class crossing. |
| **SCOPE-3.F29** (PRD-24A overlay-engine architecture entirely superseded by Build M) | Intentional-Update-Doc | Doc §1.3 reveal library supersedes the overlay engine, but formalizes the reveal pattern as universal presentation wrapper (not just rewards). | Keep Intentional-Update-Doc. Scope note: "PRD-24A addendum should point at doc §1.3 reveal-as-task-presentation connector as the current architecture." | ❌ No class crossing. |
| **SCOPE-3.F30** (PRD-24B superseded architectures) | Intentional-Update-Doc | Same as F29 — doc §1.3 is the current architecture. | Keep Intentional-Update-Doc. Scope note: "PRD-24B supersession path anchored in doc §1.3." | ❌ No class crossing. |

**Summary of Section B conflicts:** one Intentional-Update-Doc → Closed/Resolved (SCOPE-3.F15). All other changes are scope notes, not class crossings.

---

## Section C — Draft notes mapping to existing findings (36 notes scanned)

Each of the doc's 36 draft notes is either already captured in a worksheet row (reinforce / reclassify / scope-expand) OR is a NEW finding that needs a worksheet row. Full mapping:

| Note | Summary | Maps to existing? | Proposed worksheet impact |
|---|---|---|---|
| 1 | Roster via universal person picker | No existing — doc notes "Claude Code to confirm component name" | NEW worksheet task: confirm component name; minor doc cleanup |
| 2 | Maintenance list type | **SCOPE-2.F27** (list type catalog) | Add `maintenance` to F27 scope |
| 3 | Crossed-off grace period for shopping lists | No existing | **NEW finding** — PRD-09B amendment |
| 4 | Records List list type (formerly "Annual Reference Log") | **SCOPE-2.F27** | Add `records` to F27 scope |
| 5 | Opportunity reconciliation — list-level primary, Convention 70 amendment | No existing F-heading (Convention 70 not audited). Doc §1.2 + §1.1 Lists page. | **NEW finding** — Convention 70 amendment + Lists page primitive spec (PRD-09B amendment) |
| 6 | Segment scheduling modes (always-on-collapsible default OR scheduled) | Partial overlap with SCOPE-3.F20 PRD-25 Guided bundle and SCOPE-3.F21 PRD-26 bundle | **NEW finding** or fold into existing — PRD-25 + PRD-26 updates for segment primitive |
| 7 | Per-roster scope | Informational — confirms existing scope-of-state semantics | No change |
| 8 | Person-pick-spin per-deploy config | No existing | **NEW finding** — connector spec in PRD-09B or PRD-24 |
| 9 | Book completion chain-next | No existing finding; PRD-23 BookShelf scope | **NEW finding** — PRD-23 amendment |
| 10 | Wizard vs. form terminology | Informational | No change |
| 11 | Natural Language Composition inside wizards + front door | No existing — wholly new entry point | **NEW finding** — cross-cutting; PRD-05 + PRD-08 + Studio |
| 12 | Bulk-AI-Add already built but not deployed everywhere | No existing finding names this deployment gap | **NEW finding** — deployment-gap audit across creation surfaces |
| 13 | Task Breaker invocable post-assignment by kid | No existing | **NEW finding** — PRD-09A amendment (Task Breaker as utility already covered by Convention 248) |
| 14 | Opportunity list types free-form (mom names her own categories) | **SCOPE-2.F27** | Add to F27 scope |
| 15 | `is_browsable` as universal list property | **SCOPE-2.F27** | Add to F27 scope |
| 16 | Milestone system integrated (`is_milestone` property + Milestone Map) | No existing. Lego Architecture Input Notes referenced. | **NEW finding** — multi-PRD addenda (PRD-05, PRD-08, PRD-09A, PRD-09B, PRD-11, PRD-12A/B, PRD-37, PRD-28B) |
| 17 | `tracking_tags` property | No existing | **NEW finding** — multi-PRD (every content-producing PRD needs addendum) + PRD-28B consumer spec |
| 18 | Reading Tracker primitive | No existing | **NEW finding** — PRD-28 or PRD-10 addendum; connector integration per doc §1.3 |
| 19 | Finished products inventory (Homeschool Transcript high-value/effort) | Partial — SCOPE-2.F22 PRD-19 reports; doc adds Transcript + Memory Books + Year-End Letter + Child Growth Portrait + more | **NEW finding** — expands PRD-28B scope; cross-ref F22 |
| 20 | Opportunity Board vs. individual opportunity list distinction | No existing | **NEW finding** — clarifies that Opportunity Board dissolves into Lists page (same note-5 family) |
| 21 | Drafts and Customized as explicit Studio pages | No existing | **NEW finding** — Studio Intelligence Addendum amendment |
| 22 | "Wizard vs. page" scope decision | Informational — implementation per outcome, Part 3 scope | No worksheet change |
| 23 | Four list-behavior properties unified | Same as note 5; **SCOPE-2.F27** primary landing | Fold into F27 expansion + NEW finding for Convention 70 |
| 24 | Sequential Collection framing (Option 3 — it's a list with `presentation_mode=sequential`) | No existing finding on the schema-split question | **NEW finding** — schema-consolidation tech-debt task (future schema work); doc clarifies both storage locations valid for now |
| 25 | Linked list items as a connector pattern | No existing | **NEW finding** — PRD-09B amendment (connector pattern at item level analogous to existing linked-routine-step) |
| 26 | Sequential consolidation flagged for future schema cleanup | Same as 24 | Fold into 24's NEW finding |
| 27 | `require_evidence` split into `require_photo` + `require_note` | No existing | **NEW finding** — PRD-09A amendment |
| 28 | Rotation memory expanded with per-item/per-section overrides + cooldown/frequency rules | No existing | **NEW finding** — PRD-09B amendment |
| 29 | `counts_toward_allowance` extended to Segments + dedup at calculation layer | No existing | **NEW finding** — PRD-28 amendment; touches SCOPE-3.F14 allowance bootstrap (coordinate) |
| 30 | Assignment mode applies to single tasks + list items + list-level defaults + lists | No existing finding names the formalization at all levels | **NEW finding** — PRD-09A + PRD-09B amendments |
| 31 | `kid_can_skip` per-list (or per-item) property | No existing | **NEW finding** — PRD-09B amendment |
| 32 | `is_browsable` clarified (Lists-page-access, NOT dashboard rendering) + `display_on_dashboard` + `dashboard_display_mode` | No existing finding names dashboard rendering as a property of lists | **NEW finding** — PRD-09B + PRD-10 amendment |
| 33 | Lists page replaces "Opportunity Board" as a separate surface | Same as notes 5 + 20 | Fold into Opportunity Board dissolve NEW finding |
| 34 | Reveal animations are universal presentation wrappers (not just reward delivery) | Partial — SCOPE-2.F61 + SCOPE-2.F62 touch this, but the universal-wrapper framing is new | Expand F61 + F62 scope notes; ALSO **NEW finding** for PRD-24/24A/24B formal amendment |
| 35 | Tier assignments deferred and externalized | No existing finding names this architectural move | **NEW finding** — CLAUDE.md convention + tier-assignment chart spec (single source of truth) |
| 36 | (implicit — Part 3 pending) | Out of scope per brief | No action |

---

## Section D — Summary of new findings recommended (14 rows to add)

Proposed NEW worksheet rows drawn from Section C. Each is a distinct defect/gap/amendment. Propose adding all with provisional classifications; founder adjudicates Beta flag + severity.

| Proposed ID | Source notes | Title | Proposed class | Proposed severity | Beta? | PRD touch |
|---|---|---|---|---|---|---|
| NEW-F | Note 3 | Crossed-off grace period property on lists | Fix Next Build | Low | N | PRD-09B amendment |
| NEW-G | Notes 5, 20, 23, 33 | Opportunity Board dissolves into Lists page; `is_opportunity` is list-level property; Convention 70 amendment; Lists page primitive spec | Fix Next Build | Medium | N (orthogonal to beta) | PRD-09B + Convention 70 + Studio; cross-ref SCOPE-2.F27 |
| NEW-H | Note 6 | Segment primitive: always-on-collapsible default OR scheduled; exists across all shells | Fix Next Build | Medium | N | PRD-25 + PRD-26 + PRD-09A amendments |
| NEW-I | Note 8 | Person-pick-spin per-deploy config (flow A person-first / flow B reward-first; skip-and-return) | Fix Next Build | Low | N | PRD-09B + PRD-24 |
| NEW-J | Note 9 | Book completion chain-next (auto-advance sequential OR surface browsable opportunity list) | Fix Next Build | Low | N | PRD-23 amendment |
| NEW-K | Note 11 | Natural Language Composition — first-class front-door creation entry point (Haiku compose, Human-in-the-Mix approval) | Fix Next Build | Medium | **Y** (brand promise demonstration per doc §2.9) | PRD-05 + PRD-08 + Studio |
| NEW-L | Note 12 | Bulk-AI-Add deployment gap — audit every creation surface and deploy where missing | Fix Next Build | Medium | N | Cross-cutting |
| NEW-M | Note 13 | Task Breaker invocable post-assignment by kid (in addition to mom pre-assignment) | Fix Next Build | Low | N | PRD-09A amendment |
| NEW-N | Notes 16, 20 subset | `is_milestone` property + Milestone Map surface (universal, level 1 witnessed + level 2 receipts) | Fix Next Build | Medium | N (capture layer, not beta blocker) | PRD-05, PRD-08, PRD-09A, PRD-09B, PRD-11, PRD-12A/B, PRD-37, PRD-28B addenda |
| NEW-O | Note 17 | `tracking_tags` property + Finished Products composition pipeline | Fix Next Build | Medium | N | Cross-cutting — every content-producing PRD addendum + PRD-28B consumer spec |
| NEW-P | Note 18 | Reading Tracker primitive (separate from BookShelf; general reading log) | Fix Next Build | Medium | N | PRD-28 or PRD-10 addendum |
| NEW-Q | Note 19 | Finished products inventory expansion (Homeschool Transcript, Year-End Memory Books, Child Growth Portrait, Family Vision Statement, etc.) | Fix Next Build (roadmap) | Medium | N | PRD-28B scope expansion; cross-ref SCOPE-2.F22 |
| NEW-R | Note 21 | Drafts + Customized as explicit Studio pages; Drafts→Customized deployment flow; Customized items remain editable | Fix Next Build | Medium | N | Studio Intelligence Addendum amendment |
| NEW-S | Notes 24, 26 | Schema-consolidation: decide canonical storage for sequential behavior (`sequential_collections` vs `lists` with `presentation_mode=sequential`) | Tech Debt | Low | N | Future schema cleanup; both storage locations valid until resolved |
| NEW-T | Note 25 | Linked list items as a connector pattern (item-level analogous to linked-routine-step) | Fix Next Build | Medium | N | PRD-09B amendment |
| NEW-U | Note 27 | Split `require_evidence` into independent `require_photo` + `require_note` properties | Fix Next Build | Low | N | PRD-09A amendment |
| NEW-V | Note 28 | Rotation memory per-list/per-section/per-item with cooldown + frequency rules | Fix Next Build | Low | N | PRD-09B amendment |
| NEW-W | Note 29 | `counts_toward_allowance` extended to Segments + dedup at calculation layer (coordinate with SCOPE-3.F14) | Fix Next Build | Medium | N | PRD-28 amendment |
| NEW-X | Note 30 | Assignment mode (Shared / Per-person) formalized at all levels: single tasks, list items, list-level defaults, lists with rosters | Fix Next Build | Medium | N | PRD-09A + PRD-09B amendments |
| NEW-Y | Note 31 | `kid_can_skip` per-list (or per-item) property | Fix Next Build | Low | N | PRD-09B amendment |
| NEW-Z | Note 32 | `display_on_dashboard` per-member + `dashboard_display_mode` (full/truncated/collapsed) properties on lists | Fix Next Build | Medium | N | PRD-09B + PRD-10 amendments |
| NEW-AA | Note 34 | Reveals as universal presentation wrappers convention + reveal-as-task-presentation connector formalization across PRD-24/24A/24B | Fix Next Build | Medium | N | PRD-24 family addendum; coordinate with SCOPE-2.F61 + SCOPE-2.F62 |
| NEW-BB | Note 35 | Tier assignments externalized — tier-assignment chart as single source of truth; convention: feature code references chart, never hardcodes tier | Fix Next Build | Medium | N | CLAUDE.md convention + config file + refactor audit |

**Row count impact:** 159 → **182** (23 new rows if all accepted). Beta blocker count: 27 → **28** (NEW-K is the only proposed Beta Y).

⚠️ **Founder judgment needed:** Is NEW-K (Natural Language Composition) a Beta blocker or a post-beta polish? Doc §2.9 says "flagship demonstration of brand promise," which suggests beta exposure benefits from it, but shipping beta without NLC is technically viable. Defaulting to Y per the doc's own framing.

---

## Section E — Conflicts requiring founder approval

### E.1 — Class crossings (Fix-Now ↔ Intentional-Update-Doc) flagged per brief

| Finding | From → To | Reasoning | Founder approval needed? |
|---|---|---|---|
| SCOPE-3.F15 | Intentional-Update-Doc → **Closed/Resolved** | The finding proposed authoring a Lego convention. The Composition Architecture doc IS that convention (larger in scope than a single CLAUDE.md entry). | ✅ **YES — approve before closing** |

No other class crossings surfaced. All other reclassifications are scope expansions or severity bumps within the same class.

### E.2 — Severity bumps

| Finding | From → To | Reasoning |
|---|---|---|
| SCOPE-2.F27 | Low → **Medium** | Scope expands from "codify 5 extras" to "4 properties + 3 new types + Lists page primitive + Opportunity Board dissolve + Convention 70 amendment." Founder approval recommended but not mandatory under the brief's rule. |

### E.3 — Brief-ID mismatch (orchestrator needs reply)

| Issue | Question |
|---|---|
| Brief said "Apply to SCOPE-2.F21 (Opportunity Board recon)" but F21 = PRD-18 teen experience | Confirm intent: did the brief mean "the Opportunity Board fragmentation question the doc resolves" (which maps to SCOPE-2.F27 + NEW-G) OR did you mean another F-heading? |

### E.4 — PRD-34 Board of Directors persona classifier redesign (SCOPE-4.F4) — no doc conflict

The doc does NOT conflict with the 2026-04-21 SCOPE-4.F4 reclassification (Fix Code, AI classifier personal-vs-community). Doc §1.1 Archive Item and §1.2 `is_included_in_ai` property are orthogonal. No reconciliation needed.

### E.5 — NEW-BB tier externalization vs existing tier findings — potential double-coverage

Existing findings that reference tier infrastructure:
- SCOPE-2.F1 (PRD-31 tier monetization infrastructure unbuilt) — now Fix Next Build (Wave 0)
- SCOPE-2.F2 (PRD-02 permission gate adoption low — pre-monetization prerequisite) — Fix Next Build
- SCOPE-3.F33 (PRD-31 tier enforcement wire-up bundle)
- SCOPE-3.F34 (PRD-31 monetization engine entirely unbuilt at server layer)
- SCOPE-8b.F13 (PRD-31 server-side tier enforcement absent)

NEW-BB (tier-assignment chart as single source of truth) is **additive** — it doesn't supersede tier enforcement findings, it adds the "tier assignments are data, not code" principle on top. No conflict, but worth calling out so NEW-BB and the existing tier findings coordinate.

---

## Section F — Applied-changes preview (on Tenise's approval)

If Tenise approves Sections A–E as drafted, the orchestrator will:

1. **Update claude/web-sync/TRIAGE_WORKSHEET.md** — apply scope notes from Section A; apply reclassifications from Section B; add 23 new rows from Section D; update counts; regenerate + commit.
2. **Update claude/web-sync/FIX_NOW_SEQUENCE.md** — NEW-K (if Beta Y confirmed) joins Wave 1 or Wave 3; other NEW rows slot into "non-Beta Fix Next Build" pool; no existing wave structure changes.
3. **Add CLAUDE.md conventions** (separate commits per founder guidance):
   - Outcome-named wizards convention (doc §2.1)
   - Save-and-return / Drafts / Customized convention (doc §2.2)
   - AI-fills-the-gaps in-wizard convention (doc §2.4)
   - Bulk-AI-Add universal convention (doc §2.5)
   - MindSweep composition-worthy detection convention (doc §2.6)
   - Natural Language Composition front-door convention (doc §2.9)
   - Friction-first wizard design convention (doc §2.10)
   - Tier assignments externalized convention (doc §1.7 + NEW-BB)
4. **Do NOT touch:** PRD files (these live in the Wizard Library Taxonomy work per Part 3), any Gate 2 priority reshape, Part 3 derivation.

**No changes applied until Tenise reviews and approves Sections A–E.**

---

## Questions for founder before orchestrator proceeds

1. **SCOPE-2.F21 ID intent:** Is the Opportunity Board application scoped to SCOPE-2.F27 + NEW-G as I've mapped it, or did you have a different F-heading in mind?
2. **SCOPE-3.F15 close:** Approve reclassifying Intentional-Update-Doc → Closed/Resolved (the doc authored is the convention)? ✅ / ❌
3. **NEW-K Beta flag:** Natural Language Composition — Beta Y per doc's "flagship brand promise demonstration" framing, or Beta N (post-beta polish)?
4. **23 NEW findings — batch approve or walk row-by-row?** Section D lists them all with provisional classifications; Tenise can batch-approve or pull specific rows for discussion in Session 2.
5. **CLAUDE.md conventions:** Land 8 conventions from Section F Step 3 before Session 2 opens, or batch them inside Session 2 walkthrough?

---

*End of delta report. Awaiting founder approval before any worksheet or DAG modifications.*
