---
Status: APPROVED WITH AMENDMENTS — founder isolated review complete 2026-04-21; ready for fresh-session apply-phase prompt drafting
Stage: C
Scope: 3 + 8b (cross-PRD integration; integration compliance & safety)
Opened: 2026-04-20
Adjudicated: 2026-04-21 (founder verdicts via claude.ai web session, captured in [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md))
Amended: 2026-04-21 (5 amendments + 2 flag verdicts from founder isolated review — see Sign-off section)
Final emission counts: 13 SCOPE-8b + 42 SCOPE-3 main-table findings (F1–F42 sequential) + 9 Deferred-to-Gate-4 Appendix entries (6 pre-existing + PRD-27 + PRD-29 + PRD-19 core)
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 and §8b; [PLAN.md](PLAN.md); [SYNTHESIS.md](SYNTHESIS.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 305–308, 332)
---

# Scope 3 + 8b — Decisions Log

> **Purpose:** Append-only log of founder decisions per integration surface. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_{addendum-slug}.md`; founder confirms, amends, or overrides. Each entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the pattern-level walk-through artifact lives at [SYNTHESIS.md](SYNTHESIS.md); the authoritative founder handoff (supersedes SYNTHESIS where they conflict) lives at [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 305–308 (Scope 3) and line 332 (Scope 8b). Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 (design findings) or §8b (safety/compliance findings). The integration surface inventory lives in PLAN.md §3.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md)), amended for Scope 3+8b content.

1. **Beta Readiness default = N for SCOPE-3** (design-only); **default Y for SCOPE-8b** (safety/compliance integration). Set SCOPE-3 to Y only when the design defect makes a child-facing surface non-viable for beta. Set SCOPE-8b to N only when the finding is clearly informational.
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only for this scope.
3. **"If it doesn't work in the app, it is not wired."** Applied especially to integration seams — both sides must actually run, not just exist in schema or addendum text.
4. **Evidence not intuition.** Every verdict cites migration SHA, file:line, grep hit, or addendum/PRD section reference.
5. **Worker commits, orchestrator adjudicates.** Per-surface worker runs the grep + read + write + commit loop; orchestrator does not grep substantively, only reads evidence files and proposes verdicts.
6. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
7. **Emission tag decided at finding time.** A single addendum may produce both Scope 3 and Scope 8b findings. Do not pre-classify an addendum.
8. **Consolidate across addenda when a pattern repeats 3+ times** per PLAN §5.2. Single-PRD findings belong in Scope 2.
9. **Cross-reference closed findings** from Scope 5 and Scope 8a rather than re-describing their content.

## Decision log format

Each per-surface round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md).

```
## Round {N} — {addendum short name} evidence pass

- **Date:** YYYY-MM-DD
- **Surface:** prds/addenda/{filename}
- **Bridged PRDs:** PRD-X, PRD-Y, ...
- **Worker pass:** [EVIDENCE_{addendum-slug}.md](EVIDENCE_{addendum-slug}.md)
- **Aggregate:** {row counts per classification; seam count}

### Per-seam verdict table

| Seam | Proposed classification | Proposed finding tag | Proposed severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| {seam short name} | {Intentional-Document / Unintentional-Fix-Code / etc.} | SCOPE-3 / SCOPE-8b / BOTH | Blocking/High/Medium/Low | SCOPE-3.F{N} / SCOPE-8b.F{N} | (pending) |

### Load-bearing unexpected findings
{numbered list}

### Cross-references
{Scope 5, Scope 8a, Scope 1 finding IDs that this surface cites}

### Founder adjudication
{one paragraph per decided finding}

### Emission list
{final SCOPE-3.F{N} and SCOPE-8b.F{N} titles for apply-phase}
```

## Adjudication ordering note

Rounds 1–3 capture the **three structural pushbacks** that founder delivered first in the 2026-04-21 adjudication session. These pushbacks reshape how patterns consolidate and must be read before the per-decision rounds below so Decision verdicts inherit the pushback context. Rounds 4–18 then capture **Decisions 1–15** (founder verdicts on SYNTHESIS.md §6 decision prompts). Rounds 19–20 capture **Post-Audit Recommendations** and the **Round 0 Deferred-to-Gate-4 amendment** respectively.

This is the first Scope to use the **Option A pattern-grouped walk-through** (single-session pattern-level adjudication against [SYNTHESIS.md](SYNTHESIS.md) §§1–7 instead of per-surface round-by-round adjudication). Cascade from pattern verdict to per-surface emission happens in the Synthesis pass section at the end of this file; per-evidence-file Round entries are deliberately NOT used because the pattern verdicts already supersede any per-surface verdict drafts.

## Round 0 — Preliminary notes before traversal

### Surfaces expected to be Deferred-to-Gate-4 due to unbuilt PRDs

Per PLAN §9.1, several integration surfaces cannot be evaluated because one side of the seam is unbuilt. For these, the evidence pass produces a stub file that cites the closed Scope 5 / Scope 8a finding and classifies as `Deferred-Document` / Defer-to-Gate-4. No `SCOPE-3` or `SCOPE-8b` finding is emitted — the remediation scope is already captured by the closed finding.

| Surface | Blocking unbuilt PRD | Closed finding reference |
|---|---|---|
| PRD-20 Safe Harbor integrations | PRD-20 unbuilt | SCOPE-8a.F3 |
| PRD-30 Safety Monitoring integrations | PRD-30 unbuilt | SCOPE-8a.F3 |
| PRD-32/32A Admin Console integrations | PRD-32 unbuilt | SCOPE-8a.F1 remediation scope |
| PRD-28B Compliance & Progress Reporting seam (PRD-37 × PRD-28B) | PRD-28B unbuilt | Scope 5 Finding A |
| PRD-40 COPPA consent gating integrations | PRD-40 unbuilt | SCOPE-8a.F1 |
| PRD-41 Runtime ethics enforcement integrations | PRD-41 unauthored | SCOPE-8a.F3 |

Evidence-pass worker for each of these surfaces writes a short stub file per PLAN §10 rather than a full traversal.

> **Amendment 2026-04-21 — see Round 20:** PRD-27 Caregiver Tools + PRD-29 BigPlans added to this table. Both meet identical unbuilt-PRD criteria.

### Expected cross-addendum consolidations

Flagged in advance for orchestrator attention during walk-through. Confirmed or dropped based on what evidence actually surfaces.

- **studio_queue handoff pattern** — PRD-08, PRD-15, PRD-16, PRD-17, PRD-17B, PRD-34 all write to `studio_queue`. Watch for drift in `source` field discipline, queue-vs-direct-insert decisions, requester_id population.
- **Universal Scheduler consumers pattern** — PRD-14B, PRD-16, PRD-18, PRD-27, PRD-35 addenda all describe recurrence integrations. Watch for drift in RRULE JSONB contract.
- **HITM pattern across AI Edge Functions** — SCOPE-8a.F8 already noted shared component under-reuse. Scope 3+8b examines whether the cross-PRD integration seams (e.g., MindSweep → Journal, Notepad → Tasks) preserve HITM semantics across the handoff.
- **Privacy Filtered + Safe Harbor exempt propagation** — addenda for PRD-13, PRD-19, PRD-20 may all cite these rules. Watch for drift in whether every downstream consumer of context data respects both filters.
- **`is_included_in_ai` three-tier toggle propagation** — Personal Growth context-source tables to LiLa context assembler. Classical drift pattern per Scope 5 walk-through.

### Pattern-to-watch — addenda that reference closed findings

Several cross-PRD addenda may already describe integrations to PRDs that Scope 8a closed as unbuilt. Those rows within the addendum evidence file classify as `Deferred-Document` and cross-reference the closed finding. Not a finding in their own right.

---

## Decisions

*(Rounds 1–3 = structural pushbacks; Rounds 4–18 = Decisions 1–15; Round 19 = Post-Audit Recommendations; Round 20 = Round 0 amendment)*

## Round 1 — Pushback A: consolidate F11 authenticate-not-authorize (pattern 1A + Mediator Full Picture)

- **Date:** 2026-04-21
- **Pushback source:** Founder adjudication session 2026-04-21, [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md) Pre-amble §Pushback A
- **Supersedes:** [SYNTHESIS.md](SYNTHESIS.md) §1A + §1B + §7.1 F1 / F2 split proposal
- **Reshapes:** SCOPE-8b emission roster (collapses 15→14 findings)

### Pushback text (verbatim)

> SYNTHESIS.md recommended two SCOPE-8b findings: `F1` systemic (12 surfaces, High) + `F2` Mediator Full Picture standalone (Blocking). Founder verdict: **one finding, Blocking severity, 12+ cross-refs, Mediator Full Picture as the lede paragraph's concrete example.**
>
> Rationale: same root cause, same fix (shared `authorizeForFamily(user, family_id)` helper in `_shared/auth.ts` called after `authenticateRequest`, plus `auth.uid()` membership check inside SECURITY DEFINER RPCs). Splitting creates an optics problem — Mediator gets Blocking because its data payload is worst, but the other 11 surfaces are functionally equally exploitable.

### Impact on emission roster

- **Before Pushback A:** SCOPE-8b.F1 (Pattern 1A, High, 12 cross-refs) + SCOPE-8b.F2 (Mediator standalone, Blocking) = 2 findings
- **After Pushback A:** SCOPE-8b.F1 (consolidated, Blocking, 12+ cross-refs, Mediator Full Picture as lede example) = 1 finding

### Consolidation-also-absorbs

Pattern 1F (privacy-filter gaps in `classify_by_embedding` + `match_book_extractions` SECURITY DEFINER RPCs) folds into F1's remediation. The RPC rewrite that adds `auth.uid()` membership check also adds `is_safe_harbor` / `is_included_in_ai` / `is_privacy_filtered` joins. No separate F1F finding emits.

### Remediation sequencing (founder-specified)

- Mediator Full Picture ships first as proof-of-pattern (Fix Now)
- Remaining 11 surfaces + SECURITY DEFINER RPC rewrites roll through in tight sequence (Fix Next Build)
- Functionally **one cohesive build** — founder confirmed no rush for beta; doing it right in one pass is preferred over staging

### Emission

SCOPE-8b.F1 — "Edge Functions authenticate but do not authorize (12+ surfaces including cross-family Mediator Full Picture data leakage)" — Blocking, Beta Y, Fix Now (Mediator) + Fix Next Build (remaining surfaces)

---

## Round 2 — Pushback B: separate Pattern 2A from PRD-14B .ics CHECK runtime violation

- **Date:** 2026-04-21
- **Pushback source:** Founder adjudication session 2026-04-21, [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md) Pre-amble §Pushback B
- **Supersedes:** [SYNTHESIS.md](SYNTHESIS.md) §2A "escalate PRD-14B seam #6 as standalone High AND keep in pattern" equivocation
- **Reshapes:** Pattern 2A contributing-surface count; SCOPE-8b emission roster (+1 finding)

### Pushback text (verbatim)

> SYNTHESIS.md recommended "escalate PRD-14B seam #6 as standalone High AND keep in pattern 2A." Founder verdict: **two separate findings, no overlap.**
>
> - Pattern 2A (Source/enum discipline drift, 7+ surfaces freeform TEXT with missing CHECKs) remains a Low-to-Medium SCOPE-3, Beta N, Fix Next Build, case-by-case Intentional-Update-Doc vs. Unintentional-Fix-Code remediation.
> - PRD-14B seam #6 (`.ics` import CHECK violation) emits as standalone High SCOPE-8b, Beta Y, Fix Now. This is a runtime-throwing CHECK violation on a marquee import feature — categorically different from the documentation-drift pattern. Remediation is a one-line migration.

### Impact on emission roster

- Pattern 2A (SCOPE-3) no longer counts PRD-14B seam #6 among its contributing surfaces. Pattern stays at 7+ other surfaces (PRD-08, PRD-15, PRD-16 ×2, PRD-17B ×2, PRD-18, PRD-21, PRD-23 cross-pattern).
- PRD-14B `.ics` CHECK violation emits as standalone SCOPE-8b.F7 (post-F1+F2 merge renumber) — High, Beta Y, Fix Now.
- No overlap citation between the two findings except a single "see also" cross-reference in each finding body.

### Emission

- SCOPE-3.F1 — "Source/enum discipline drift (7+ columns freeform TEXT with missing CHECKs)" — Medium, Beta N, Fix Next Build (case-by-case per contributing surface)
- SCOPE-8b.F7 — "PRD-14B `.ics` import CHECK violation (runtime failure on marquee import feature)" — High, Beta Y, Fix Now (one-line migration)

---

## Round 3 — Pushback C: restore PRD-22 `history_retention` to Pattern 1D

- **Date:** 2026-04-21
- **Pushback source:** Founder adjudication session 2026-04-21, [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md) Pre-amble §Pushback C
- **Supersedes:** [SYNTHESIS.md](SYNTHESIS.md) §1D footnote "reclassifies — degrades to cross-ref of F-C"
- **Reshapes:** Pattern 1D contributing-surface count (4 → 5 surfaces)

### Pushback text (verbatim)

> SYNTHESIS.md Pattern 1D originally included `history_retention` as a 4th surface, then footnoted "reclassifies — degrades to cross-ref of F-C." Founder verdict: **restore to Pattern 1D.**
>
> Rationale: Searching founder conversation history from the PRD-22 design session (2026-03-19) confirms `history_retention` is part of `lila_member_preferences` and was explicitly specced to trigger auto-archiving of `lila_conversations` older than the retention period — with fallback logic for kids inheriting mom's default. This is not "feature never built"; this is "feature specced, DB column exists, consumers missing." That shape IS Pattern 1D.

### Impact on emission roster

- Pattern 1D (SCOPE-8b.F4 post-F1+F2 merge renumber) now cites **5 contributing surfaces** instead of 4:
  1. PRD-14D `family_best_intentions.require_pin_to_tally` (PIN-per-intention)
  2. PRD-19 `is_available_for_mediation` on `relationship_notes` (column doesn't exist in live schema)
  3. PRD-22 `analytics_opt_in` (default TRUE, no UI toggle, no consumer check)
  4. PRD-22 `lila_member_preferences.history_retention` **← restored**
  5. PRD-14D `family_best_intentions.is_included_in_ai` (folded from Decision 10 — see Round 13)

### Remediation per surface (for history_retention specifically)

- Add Settings UI for retention selector (`forever` / `90_days` / `30_days` / `7_days`)
- Add scheduled cron job that archives `lila_conversations` past retention period (soft-archive, excluded from list queries)
- Add fallback logic: kid's preference → mom's default → system default
- **Cross-build leverage:** cron infrastructure created here also serves COPPA retention sweeps (PRD-40 uses more aggressive retention windows for under-13 children). Same architecture, different windows per member type.

### Cascaded guidance

Future evidence passes should treat "column exists + PRD spec text exists" as **consumer missing**, not feature never built. Documented in Round 19 (Post-Audit Recommendation #3) as addendum-writing habit for codification.

### Emission

SCOPE-8b.F4 — "Documented user-controlled accountability/privacy silently unenforceable (5 surfaces)" — High, Beta Y, Fix Next Build (bundled "user-control enforcement sweep")

---

## Round 4 — Decision 1: F11 Authenticate-not-authorize pattern

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 1 / §1A + §1B / §7.1 F1+F2
- **Pattern/Surface:** 12+ Edge Functions authenticate bearer token without authorizing resource ownership; most severe instance is PRD-34 Mediator Full Picture cross-family data leakage.
- **Founder verdict:** "ONE consolidated Blocking SCOPE-8b finding. 12+ cross-refs. Mediator Full Picture as lede example. (Per Pushback A.)"

### Remediation scope (founder-specified)

Shared `authorizeForFamily(user, family_id)` helper added to `_shared/auth.ts`. Every Edge Function that currently calls `authenticateRequest` then also calls `authorizeForFamily` with the resource's family_id. SECURITY DEFINER RPCs (`classify_by_embedding`, `match_book_extractions`, etc.) rewritten to add `auth.uid()` membership check inside the function body. This rewrite also picks up the privacy-filter joins that Pattern 1F identified — `is_safe_harbor`, `is_included_in_ai`, `is_privacy_filtered` enforced inside the RPC, not just at context-assembler level.

### Timing

One build. The shared helper rollout is mechanical once the helper exists — PRD-34 F-B (Mediator) ships first as proof-of-pattern (Fix Now), then the other 11 surfaces roll through in a tight sequence (Fix Next Build). Functionally **one cohesive build**.

### Resolution tag

**Fix Now** (Mediator as proof), **Fix Next Build** (remaining 11 surfaces + RPC rewrites).

### Severity + Beta

Blocking. Beta Y.

### Contributing evidence files (13 surfaces — PRD-21A folded in per founder isolated review 2026-04-21 Flag 1 verdict)

- EVIDENCE_prd15 seam #4 (per-pair `member_messaging_permissions` client-side only)
- EVIDENCE_prd17b seam #6 (`classify_by_embedding` SECURITY DEFINER + trusted `p_family_id`)
- EVIDENCE_prd18 seam #7 (`match_book_extractions` SECURITY DEFINER + trusted `p_family_id`)
- EVIDENCE_prd21 F-A (`lila_tool_permissions` not checked by 8 tool Edge Functions)
- **EVIDENCE_prd21a F-C (Vault browse role-/tier-based filtering absent — teen-visible subset; folded per Flag 1 verdict — same root cause, same `authorizeForFamily` helper class of fix with role-check extension)**
- EVIDENCE_prd22 F-C (`member_emails` login resolution not enforced; `lila_member_preferences` not loaded)
- EVIDENCE_prd25 seam #7 (`guided-nbt-glaze` has NO `authenticateRequest` call at all)
- EVIDENCE_prd27 F-A (Special Adult shift-window permission read vs write table mismatch — 2 live rows in production; compounds with Decision 15 3E remediation)
- EVIDENCE_prd34 F-A (`lila_tool_permissions` not checked by 5 ThoughtSift Edge Functions)
- **EVIDENCE_prd34 F-B (most severe — Mediator Full Picture cross-family conversation ownership bypass — lede example)**
- EVIDENCE_prd36 F-C (`time_sessions` RLS checks self + mom; no dad/Special Adult policies — compounds PRD-27 F-A)

### Remediation sequencing notes

- **Ships with Decision 4** (Crisis Override) if possible — same `_shared/` directory, same class of fix, same commit cycle, both safety substrate.
- **PRD-21A Vault teen-filter folded in per Flag 1 verdict** — not a standalone finding. One build, one helper, one fix.

### Emission

**SCOPE-8b.F1** — "Edge Functions authenticate but do not authorize (12+ surfaces including cross-family Mediator Full Picture data leakage)" — Blocking, Beta Y, Fix Now (Mediator) + Fix Next Build (remainder)

---

## Round 5 — Decision 2: HITM on non-conversation AI writes

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 2 / §1C / §7.1 F3+F4
- **Pattern/Surface:** Two Edge Function paths write AI-generated content to non-conversation tables (platform intelligence tier, draft library) without the Edit/Approve/Regenerate/Reject gate required by CLAUDE.md #4.
- **Founder verdict:** "2 standalone Beta-Y findings. High severity each. Fix Next Build."

### Founder rationale

Not consolidated because remediation UX is genuinely different per surface (message-draft Edit-Approve cycle vs. persona-generation review-before-cache). Below the 3+ consolidation threshold regardless.

### Surfaces + remediation

1. **PRD-21 `communication_drafts`** — UX addition: "Preview / Regenerate / Save" gate between stream-complete and DB insert. Mom's tap on "Save Draft" goes through Edit/Approve/Regenerate/Reject cycle before persistence.
2. **PRD-34 `board_personas`** — review step before platform-intelligence cache write. Hallucinated personas cannot amortize across all future users.

### Severity + Beta + Resolution

Both: High. Beta Y. Fix Next Build.

### Contributing evidence files

- EVIDENCE_prd21 F-B (communication_drafts persistence path)
- EVIDENCE_prd34 F-C (board_personas generation path)

### Emission

- **SCOPE-8b.F2** — "HITM gate bypassed on PRD-21 `communication_drafts` persist" — High, Beta Y, Fix Next Build
- **SCOPE-8b.F3** — "HITM gate bypassed on PRD-34 `board_personas` generation" — High, Beta Y, Fix Next Build

---

## Round 6 — Decision 3: Pattern 1D (Documented opt-out silently bypassed)

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 3 / §1D / §7.1 F5
- **Pattern/Surface:** Mom configures a user-controlled accountability or privacy mechanism. The UI toggle exists, the DB column exists, the PRD spec calls it out — and at runtime the enforcement does not fire. Trust-violation shape.
- **Founder verdict:** "Consolidate as ONE systemic SCOPE-8b finding, High severity, Beta Y, Fix Next Build. **5 surfaces total** after founder adjudication."

### Surfaces (5 — post-Pushback-C + Decision-10 folding)

1. **PRD-14D** `family_best_intentions.require_pin_to_tally` — PIN-per-intention captured in Settings, persisted in DB, never checked at tally time
2. **PRD-19** `is_available_for_mediation` on `relationship_notes` — Decision 18 per-author opt-out; **column doesn't exist in live schema**; `loadFullPictureContext` cannot filter
3. **PRD-22** `analytics_opt_in` BOOLEAN default TRUE — no UI toggle, no consumer-side check before anonymized event writes
4. **PRD-22** `lila_member_preferences.history_retention` — specced auto-archive with no Settings UI and no cron consumer *(restored per Pushback C)*
5. **PRD-14D** `family_best_intentions.is_included_in_ai` — folded from Decision 10 (see Round 13) — same trust-violation shape

### Finding body framing (founder-specified)

> "Mom's mental model is 'I flipped this, it works.' Runtime enforcement is absent. Whether the control is a PIN, a toggle, a heart icon, or a dropdown preference doesn't matter — what matters is that the UI promises control that the runtime doesn't deliver. Once one beta user discovers a setting that doesn't do what it says, confidence in every other setting degrades."

### Remediation per surface (each surgical, bundle as "user-control enforcement sweep")

- PRD-14D PIN: add `require_pin_to_tally` check + `verify_member_pin` RPC call before INSERT in `useLogFamilyIntentionTally`
- PRD-19: add columns (`is_available_for_mediation`, `sort_order`, `archived_at`) + filter in `loadFullPictureContext`
- PRD-22 analytics: add Settings toggle + `checkAnalyticsOptIn(family_id)` helper at every anonymized-event write site
- PRD-22 history_retention: Settings UI + cron job + fallback logic
- PRD-14D family_best_intentions.is_included_in_ai: wire the consumer (LiLa context assembly reads the column)

### Severity + Beta + Resolution

High. Beta Y. Fix Next Build (one build bundle).

### Contributing evidence files

- EVIDENCE_prd14d F-A (PIN-per-intention)
- EVIDENCE_prd14d F-D (family_best_intentions.is_included_in_ai — folded from Decision 10)
- EVIDENCE_prd19 F-A SCOPE-8b side (is_available_for_mediation)
- EVIDENCE_prd22 F-B (analytics_opt_in)
- EVIDENCE_prd22 F-C sub-element (history_retention — restored per Pushback C)

### Emission

**SCOPE-8b.F4** — "Documented user-controlled accountability/privacy silently unenforceable (5 surfaces)" — High, Beta Y, Fix Next Build

**Apply-phase instruction (required inside F4's finding body):** Include the following retrospective footnote (audit-trail continuity for how `history_retention` was restored to this pattern):

> "PRD-22 `history_retention` was initially triaged as 'never built' during pre-synthesis evidence pass; founder adjudication restored it as a specced-but-unwired consumer based on PRD-22 design session 2026-03-19 artifacts. Future evidence passes should treat columns with corresponding PRD spec text as 'consumer missing,' not 'feature never built.'"

**No separate §3 emission for Decision 15 3G (PRD-14D PIN-per-intention).** Folded into this finding per FOUNDER_HANDOFF Decision 15 table.

---

## Round 7 — Decision 4: Crisis Override missing in 3 Edge Functions

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 4 / §1E / §7.1 F6
- **Pattern/Surface:** 3 Edge Functions that process user text and invoke AI are missing Crisis Override (CLAUDE.md #7 non-negotiable).
- **Founder verdict:** "Consolidate as ONE systemic SCOPE-8b finding, **Blocking severity**, Beta Y, Fix Now."

### Surfaces (3)

1. `message-coach/index.ts` — imports zero crisis-detection code; sends crisis-language drafts straight to Haiku
2. `auto-title-thread/index.ts` — same bare state
3. `bookshelf-discuss` — bypasses Crisis Override + writes to `bookshelf_discussion_messages` NOT `lila_messages`, so PRD-30 Layer 2 cannot scan it when built

### Remediation (uniform)

Each Edge Function needs:
```ts
import { detectCrisis, CRISIS_RESPONSE } from '_shared/crisis-detection.ts';
// ... before any Sonnet/Haiku invocation:
const crisis = detectCrisis(content);
if (crisis) return CRISIS_RESPONSE;
```

~5 lines per file. Three files total.

### Founder rationale for Blocking

Convention #7 is non-negotiable. Crisis Override isn't a feature, it's a safety substrate.

### Ships with

Decision 1 (shared-helper rollout) — same `_shared/` directory, same class of fix, same commit cycle.

### Severity + Beta + Resolution

Blocking. Beta Y. Fix Now.

### Contributing evidence files

- EVIDENCE_prd15 seam #6 (message-coach + auto-title-thread)
- EVIDENCE_prd23 Finding A (bookshelf-discuss)

### Emission

**SCOPE-8b.F5** — "Crisis Override missing in 3 Edge Functions (message-coach, auto-title-thread, bookshelf-discuss)" — Blocking, Beta Y, Fix Now

---

## Round 8 — Decision 5: Source/enum discipline drift (post-Pushback B split)

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 5 / §2A / §7.1 F8 + §7.2 F1
- **Pattern/Surface (split per Pushback B):**
  - Pattern 2A (7+ surfaces, freeform TEXT with missing CHECKs) — SCOPE-3
  - PRD-14B .ics CHECK violation — SCOPE-8b (standalone, see Round 2 for pushback)
- **Founder verdict:** "Two separate findings, no overlap." (Per Pushback B.)

### Pattern 2A surfaces (7+, excluding PRD-14B .ics which is SCOPE-8b.F7)

| Surface | Specific drift | Evidence file |
|---|---|---|
| PRD-08 | `useNotepad.ts:535` writes `source: 'manual'` instead of `'hatch_routed'` | EVIDENCE_prd08 F-B |
| PRD-08 | Notepad→Message `studio_queue.destination='message'` orphan | EVIDENCE_prd08 F-A |
| PRD-15 | `family_requests.source` enum widened by PRD-28 without amending PRD-15 | EVIDENCE_prd15 seam #9 |
| PRD-16 | `notifications.notification_type='system'` + `category='tasks'` instead of `'meeting_completed'` + `'meetings'` | EVIDENCE_prd16 seam #1 |
| PRD-16 | `meeting_agenda_items.source` missing `'request'` per PRD flow | EVIDENCE_prd16 Unexpected #3 |
| PRD-17B | `studio_queue.source` freeform TEXT; addendum promised 4 new enum values | EVIDENCE_prd17b seam #3 |
| PRD-17B | `calendar_events.source_type` addendum demanded `'mindsweep'`; CHECK absent | EVIDENCE_prd17b seam #10 |
| PRD-18 | `studio_queue.source='rhythm_request'` addendum-promised, never wired | EVIDENCE_prd18 seam #14 |
| PRD-21 | `communication_drafts.sent_via` freeform TEXT; PRD L284 enumerated 3 values | EVIDENCE_prd21 seam #2 |
| PRD-23 | `tasks.source`, `guiding_stars.source`, `best_intentions.source` freeform TEXT | EVIDENCE_prd23 cross-pattern |

### Pattern 2A remediation (case-by-case per surface)

- Columns that SHOULD have CHECK constraints per addendum intent → add CHECK + migrate enum values (Unintentional-Fix-Code)
- Columns where the pattern is "addendum spec drifted" → update spec (Intentional-Update-Doc)

### PRD-14B .ics CHECK violation (SCOPE-8b.F7 — Round 2)

See Round 2. Standalone High SCOPE-8b, Beta Y, Fix Now. One-line migration:
```sql
ALTER TABLE calendar_events DROP CONSTRAINT calendar_events_source_type_check;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_source_type_check
  CHECK (source_type IN ([existing 7 values], 'ics_import', 'mindsweep'));
```

### Severity + Beta + Resolution

Pattern 2A: Medium. Beta N. Fix Next Build (case-by-case).

### Emission

- **SCOPE-3.F1** — "Source/enum discipline drift (7+ columns freeform TEXT with missing CHECKs)" — Medium, Beta N, Fix Next Build
- **SCOPE-8b.F7** — "PRD-14B `.ics` import CHECK violation (runtime failure)" — High, Beta Y, Fix Now *(per Round 2)*

---

## Round 9 — Decision 6: PRD-35 schedule vocabulary drift

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 6 / §2B / §7.2 F2
- **Pattern/Surface:** PRD-35 Universal Scheduler introduces THREE incompatible `schedule_type` vocabularies + a second incompatible `RecurrenceDetails` TypeScript contract. All drifts concentrate in PRD-35 but compound PRD-27's shift-session bifurcation.
- **Founder verdict:** "Standalone Medium SCOPE-3, Beta N, Fix Next Build."

### Drifts within PRD-35

1. `access_schedules.schedule_type` CHECK = `'shift'|'custody'|'always_on'` (live) vs PRD-35 spec `'recurring'|'custody'|'always_on'`
2. `access_schedules` column named `recurrence_details` (live) vs PRD-35 spec `recurrence_data`
3. `SchedulerOutput.schedule_type` TypeScript union `'fixed'|'completion_dependent'|'custody'` vs DB-bridge `buildTaskScheduleFields` hardcoded `'recurring'`
4. `calendar_events`/`meeting_schedules.recurrence_rule` CHECK missing `'completion_dependent'`, `'custody'` values that `tasks.recurrence_rule` CHECK has
5. Two incompatible `RecurrenceDetails` TypeScript types (`src/components/scheduling/types.ts` vs `src/lib/scheduling/scheduleUtils.ts`) — `parseRecurrenceDetails` silently returns `null` when it receives the UniversalScheduler shape

### Remediation sequencing (founder-specified — critical)

1. **First:** amend PRD-35 spec to match shipped code (lower-risk; migrations and schema have landed)
2. **Then:** fix PRD-27 F-A shift bifurcation by consolidating the two `RecurrenceDetails` TypeScript contracts into one canonical type. The `parseRecurrenceDetails` silently-returning-null is the root cause of PRD-27 F-A; fixing the type consolidation fixes the shift permission check cascade.

### Cross-ref

PRD-27 F-A (SCOPE-8b.F11 — Round 18 / Decision 15 3E) remediation **depends** on PRD-35 type consolidation landing first. Apply-phase worker documents this sequencing dependency in both finding bodies.

### Severity + Beta + Resolution

Medium. Beta N. Fix Next Build.

### Contributing evidence files

- EVIDENCE_prd35 F-A (seam #4 + Unexpected #1, #3, #4)

### Emission

**SCOPE-3.F2** — "PRD-35 schedule vocabulary drift (4 incompatible vocabularies + 2 RecurrenceDetails TS types)" — Medium, Beta N, Fix Next Build (spec amendment → type consolidation, sequenced)

**Note:** SYNTHESIS §7.2 also listed `F3` (PRD-35 scheduler output broken semantics) and `F4` (PRD-35 convention surface unwired) as additional PRD-35 standalone findings not addressed by Decision 6 explicitly. These remain as separate SCOPE-3 emissions (see Synthesis pass §Emission roster). Decision 6 addresses only the schedule-vocabulary-drift pattern; the other two PRD-35 findings are downstream polish items.

---

## Round 10 — Decision 7: Model-tier registry drift — SCOPE EXPANDED

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 7 / §2C / §7.2 F5
- **Pattern/Surface:** `lila_guided_modes.model_tier` is treated as documentation by Edge Functions that hardcode MODEL strings. Runtime value and DB-registered tier drift in both directions.
- **Founder verdict:** "**Medium SCOPE-3 (upgraded from Low).** Beta N. Fix Next Build. **Remediation scope expanded beyond orchestrator's original proposal.**"

### Founder-specified architectural requirement (expanded scope)

Not just "read model_tier string from DB at runtime." Founder wants:
1. Consolidated location for model assignments
2. Multi-provider capability (Anthropic, OpenAI, Google, OpenRouter-routed, future providers)
3. Easy response to pricing/capability changes as the AI landscape shifts

### Proposed architecture (finding body content)

Expand `lila_guided_modes` table to include:
- `provider` TEXT — e.g., `'anthropic'`, `'openai'`, `'google'`, `'openrouter'`
- `model_id` TEXT — provider-specific model string (e.g., `'claude-haiku-4-5-20251001'`, `'gpt-4-turbo'`, `'gemini-pro'`)
- `fallback_provider` TEXT NULL — optional outage-fallback
- `fallback_model_id` TEXT NULL — optional outage-fallback
- `max_tokens` INTEGER NULL — per-mode default
- `temperature` NUMERIC NULL — per-mode default

Build shared helper `invokeAI(mode_name, messages, options?)` in `_shared/ai-invoke.ts` that:
- Reads the mode's registry row
- Dispatches to the correct provider SDK (or parameterizes the OpenRouter call with `model_id` from the registry)
- Returns a normalized response shape
- Handles fallback logic on provider outage
- Logs the actually-used provider+model for cost audit visibility

All Edge Functions migrate from hardcoded MODEL strings to `invokeAI(mode_name, messages)`. Model/provider changes become DB migrations, not code changes.

### Rationale for Medium severity (upgrade from Low)

Not just cost drift. Architectural flexibility founder explicitly wants. Two Edge Functions are already drifting live (gratitude + decision_guide running Sonnet despite registry saying Haiku = live cost hit today). Plus one latent landmine (family_context_interview registered Sonnet, PRD specs Haiku — will hit when mode ships).

### Cross-ref

This finding **relates to Scope 4** (cost-pattern audit, closed + applied + archived 2026-04-20). Scope 4 closed 2026-04-20; this finding stays in Scope 3+8b. Cross-reference to Scope 4 cost-pattern findings is read-only citation in F5's finding body — no reopening of closed scopes. See also Round 19 Post-Audit Recommendation #2 (CLAUDE.md convention proposal).

### Severity + Beta + Resolution

Medium (upgraded from Low). Beta N. Fix Next Build.

### Contributing evidence files

- EVIDENCE_prd19 seam #8 (family_context_interview seeded Sonnet, PRD L710 specifies Haiku — latent)
- EVIDENCE_prd21 seam #9 (gratitude registry Haiku, runtime hardcoded Sonnet — live cost hit)
- EVIDENCE_prd34 seam #15 (decision_guide registry Haiku, runtime hardcoded Sonnet — live cost hit)

### Emission

**SCOPE-3.F5** — "Model-tier registry-vs-runtime drift — expanded to multi-provider `invokeAI()` helper architecture" — Medium, Beta N, Fix Next Build

---

## Round 11 — Decision 8: Build M supersession (2D) + Pre-pivot addendum drift (2F)

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 8 / §2D + §2F / §7.2 F6 + F7
- **Founder verdict:** "Keep as TWO separate findings. Both Intentional-Update-Doc. Beta N."

### 2D — PRD-24 family addenda pre-Build-M

PRD-24 family Cross-PRD Impact Addenda (PRD-24 + PRD-24A + PRD-24B) were written against a pre-pivot design. Build M (signed off 2026-04-13) replaced the overlay-engine architecture with a Sticker Book substrate. PRD-24 family addenda were never back-amended. 9 of 9 promised PRD-24A tables don't exist; 6 of 8 promised PRD-24 tables don't exist; PRD-24B's flat 8-ID reveal library pivoted to 33 themed variants.

**Severity:** Medium. **Beta N.** **Resolution:** Intentional-Update-Doc.

Remediation: amend each affected addendum with `> **Superseded by Build M 2026-04-13 — see .claude/completed-builds/2026-04/build-m-*.md**` tag or equivalent.

**Contributing evidence files:** EVIDENCE_prd24 F-α, EVIDENCE_prd24a F-A, EVIDENCE_prd24b F-α.

### 2F — Addendum self-reporting drift

3 addenda assert completion facts that live schema or code contradicts.

| Surface | Drift type | Evidence file |
|---|---|---|
| PRD-21C | Addendum L196 claims "PRD-21C completed" + "6 new tables" — ZERO tables exist | EVIDENCE_prd21c F-A |
| PRD-24 | Addendum describes pre-pivot architecture; Build M pivoted | EVIDENCE_prd24 F-α (cross-ref 2D) |
| PRD-29 | Addendum marks `tasks.source='project_planner'` stub sockets as "WIRED" despite no writer existing | EVIDENCE_prd29 F-D |

**Severity:** Low. **Beta N.** **Resolution:** Intentional-Update-Doc.

### Why kept separate (founder rationale)

2D is specific to PRD-24 family architectural pivot. 2F captures the broader "addendum asserts completion facts code contradicts" pattern (PRD-21C, PRD-29 differ in shape from PRD-24).

### Emission

- **SCOPE-3.F6** — "PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended" — Medium, Beta N, Intentional-Update-Doc
- **SCOPE-3.F7** — "Addendum self-reporting drift — 3 addenda assert completion facts code contradicts" — Low, Beta N, Intentional-Update-Doc

---

## Round 12 — Decision 9: Reusable visual primitive library — REFRAMED

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 9 / §2E / §7.2 F8
- **Founder verdict:** "Intentional-Document Low SCOPE-3. Beta N. **Not 'Fix Next Build per-component.'**" — reframed per founder's Lego/surge-protector architecture (MYAIM_GAMEPLAN v2.2 Phase 1).

### Finding body reframing (founder-specified language)

> "Reusable animation/visual primitive library (9+ components) intentionally unassigned to production consumers per Lego/surge-protector architecture (MYAIM_GAMEPLAN v2.2, Phase 1 CLAUDE.md convention addition). Components ship as a primitive library for attachment to Lists, Tasks, Routines, Rewards, Consequences, and other configurable surfaces. Each list/task/routine can be configured with connectors like reward reveals, scratch card reveals, treasure box, sticker charts, tallies that open a reveal every N iterations, etc. — a deliberately configurable library of connection-ready primitives. `GamificationShowcase.tsx` (`/dev/gamification`) serves as the internal preview surface. Production wiring happens incrementally as each consuming feature is built."

### Components covered (Lego primitives)

- PRD-24: `TreasureBoxIdle`
- PRD-24A: `BackgroundCelebration`, `ReadabilityGradient`
- PRD-24B: 4 CSS reveals (`CardFlipReveal`, `ThreeDoorsReveal`, `SpinnerWheelReveal`, `ScratchOffReveal`) + `PointsPopup`, `StreakFire`, `LevelUpBurst`, `StarChartAnimation`

### Carve-outs (NOT part of this Intentional-Document finding)

The following two are **NOT Lego primitives waiting for consumers.** They are specific surfaces that were described in addenda as wired and aren't. Different shape, different remediation. Handled by Decision 11 (Pattern 2H).

- PRD-36 `TimerConfigPanel` (509 lines orphaned from SettingsPage) → Pattern 2H (Settings nav missing)
- PRD-36 `LogLearningModal` "Use Timer" button (no onClick handler) → Pattern 2H OR standalone Low SCOPE-3

### Prerequisite for any future wire-up

Before a consumer wires a Lego component, the component's header comment / STUB_REGISTRY entry must be updated to declare its expected consumers and the connection shape. See Round 19 Post-Audit Recommendation #1 (CLAUDE.md convention proposal — Lego Connector Documentation).

### Severity + Beta + Resolution

Low. Beta N. **Intentional-Document** (not Fix-Next-Build).

### Contributing evidence files

EVIDENCE_prd24 F-β sub-element, EVIDENCE_prd24a seams cross-ref, EVIDENCE_prd24b F-β.

### Emission

**SCOPE-3.F8** — "Reusable animation/visual primitive library intentionally unassigned to production consumers (Lego/surge-protector architecture)" — Low, Beta N, Intentional-Document

---

## Round 13 — Decision 10: `is_included_in_ai` consumer no-op — SPLIT

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 10 / §2G / §7.2 F9 + F10
- **Founder verdict:** "Two surfaces, different fates."

### PRD-14 `dashboard_widgets.is_included_in_ai` → DROP COLUMN

**Verdict:** Drop the column AND the Settings UI toggle. Emit as Intentional-Update-PRD Low SCOPE-3.

**Founder rationale:** Widgets *display* data from source tables (guiding_stars, victories, family_best_intentions, etc.). Those source tables have (or should have) their own `is_included_in_ai` controls. The widget-level toggle is redundant double-control. Simplify the spec: context inclusion is controlled at source-table level, not at display-widget level.

**Remediation:** Migration drops `dashboard_widgets.is_included_in_ai`. PRD-14 spec amended to remove the toggle. Settings UI toggle removed.

**Coordination note:** This "drop the column" work needs clear distinction from Pattern 1D's "wire the consumer" work on PRD-14D `family_best_intentions.is_included_in_ai` (see below). Same convention area (heart-icon / context-inclusion), opposite fates, needs clear distinction in the respective PRD amendments.

**Contributing evidence file:** EVIDENCE_prd14 F-B.

### PRD-14D `family_best_intentions.is_included_in_ai` → FOLD into Pattern 1D

**Verdict:** Fold into Pattern 1D (Decision 3 / Round 6) as the 5th surface.

**Founder rationale:** `family_best_intentions` is its own source table with its own data. Mom should be able to say "LiLa, don't reference this specific intention right now" — meaningful, non-redundant control. Wire the consumer. Same trust-violation shape as the other Pattern 1D surfaces.

**Contributing evidence file:** EVIDENCE_prd14d F-D.

**No separate §3 emission** — surface folded into SCOPE-8b.F4 (Pattern 1D, see Round 6).

### Emission

- **SCOPE-3.F9** — "PRD-14 `dashboard_widgets.is_included_in_ai` widget toggle is no-op — drop column + UI toggle" — Low, Beta N, Intentional-Update-PRD
- PRD-14D `family_best_intentions.is_included_in_ai` → **folded into SCOPE-8b.F4** (see Round 6)

---

## Round 14 — Decision 11: Settings nav + TimerConfigPanel overlap

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 11 / §2H / §7.2 F11 + F12
- **Pattern/Surface:** SettingsPage is the intended hub for cross-PRD configuration surfaces. Multiple addenda prescribe Settings sections that SettingsPage.tsx doesn't link to; orphaned Settings panels exist as demo-only components.
- **Founder verdict:** "Primary assignment to Pattern 2H (Settings missing nav entry points). Cross-reference from Decision 9's reframed Lego finding. Low SCOPE-3. Beta N. Fix Next Build."

### 2H surfaces (consolidated)

1. **PRD-22** — 4 cross-PRD nav entries missing from SettingsPage: Calendar Settings, Messaging Settings, Notification Preferences, Faith Preferences (only Permission Hub linked)
2. **PRD-36** — `TimerConfigPanel` orphaned from SettingsPage
3. **PRD-36** — `LogLearningModal` "Use Timer" button no onClick

### Severity + Beta + Resolution

Low. Beta N. Fix Next Build (~5 nav entry additions + 1 button handler).

### Contributing evidence files

- EVIDENCE_prd22 F-D
- EVIDENCE_prd36 F-A sub-element

### Emission

**SCOPE-3.F10** — "Pattern 2H — Settings page missing nav entry points (4 PRD-22 cross-PRD entries + PRD-36 TimerConfigPanel orphan + PRD-36 LogLearningModal Use Timer button)" — Low, Beta N, Fix Next Build

**Note:** SYNTHESIS §7.2 originally split as F11 (PRD-22 nav) + F12 (PRD-36 TimerConfigPanel). Consolidated per Decision 11 into single Pattern 2H emission. Cross-referenced from SCOPE-3.F8 (Lego library finding — Round 12).

---

## Round 15 — Decision 12: Event dispatched to void

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 12 / §2I / §7.2 F13 + F14
- **Pattern/Surface:** Code paths dispatch CustomEvents intending "loose coupling — downstream consumers listen independently" — but zero listeners exist. Pure dead-letter dispatch.
- **Founder verdict:** "2 standalone Low SCOPE-3 findings. Beta N. Fix Next Build."

### Surfaces (2 — below 3+ threshold)

1. **PRD-24** `useUncompleteTask:434-438` stub comment ("wires when PRD-24 is built") — Build M shipped 2026-04-13, stub still there; Convention #206 acknowledges gap
2. **PRD-36** `time_session_completed` + `time_session_modified` events dispatched by `useTimer.ts:218,295,328` — ZERO listeners across `src/` and `supabase/functions/`

### PRD-36 specific wiring recommendation (finding body)

These events should be consumed by the gamification pipeline (Build M) for creature-roll triggers on time-based tasks. Not just "add listeners" — wire to the specific Build M hooks that listen for completion events.

### Severity + Beta + Resolution

Both: Low. Beta N. Fix Next Build.

### Contributing evidence files

- EVIDENCE_prd24 F-β sub-element
- EVIDENCE_prd36 F-A

### Emission

- **SCOPE-3.F11** — "PRD-24 useUncompleteTask stub comment stale post-Build-M" — Low, Beta N, Fix Next Build
- **SCOPE-3.F12** — "PRD-36 time_session_completed + time_session_modified events have zero listeners (wire to Build M gamification hooks)" — Low, Beta N, Fix Next Build

---

## Round 16 — Decision 13: Stub-socket-as-WIRED terminology

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 13 / §2J / §7.2 F15
- **Pattern/Surface:** PRD-29 Addendum L94-98 marks `tasks.source='project_planner'` + `tasks.related_plan_id` stubs as "WIRED" despite no writer code existing. WIRING_STATUS.md convention (L3 "If it doesn't work in the app, it is not wired") violated.
- **Founder verdict:** "Hold as PRD-29 standalone Low SCOPE-3. Beta N. Intentional-Update-Doc. Watch for 3rd occurrence before escalating to pattern."

### Follow-up

Include in Round 19 Post-Audit Recommendation #3's addendum-writing-habits bundle.

### Severity + Beta + Resolution

Low. Beta N. Intentional-Update-Doc.

### Contributing evidence file

EVIDENCE_prd29 F-D.

### Emission

**SCOPE-3.F13** — "PRD-29 addendum marks stub sockets as WIRED despite no writer code existing (WIRING_STATUS convention violation)" — Low, Beta N, Intentional-Update-Doc

---

## Round 17 — Decision 14: Add PRD-27 + PRD-29 to Deferred-to-Gate-4

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 14 / §4 / §9 note #2
- **Founder verdict:** "Yes. Add both to DECISIONS.md Round 0 Deferred-to-Gate-4 table alongside PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B."

### Impact

- EVIDENCE_prd27 F-B (the structural "PRD-27 unbuilt" consolidation of 6 seams) collapses to a one-line cross-reference rather than standalone finding
- EVIDENCE_prd29 F-A (PRD-29 structural consolidation) collapses to one-line cross-reference
- **Approximately 10 finding emissions saved**

### What does NOT collapse

- **PRD-27 F-A shift bifurcation** stays as SCOPE-8b.F11 standalone Beta-Y High — this is a live data gap (2 live `special_adult_assignments` rows in production), not an unbuilt-PRD gap (Decision 15 3E)
- **PRD-29 individual findings** F-B (guided-mode taxonomy drift), F-C (feature keys absent from registry), F-D (stub-socket WIRED — Decision 13) stay as standalone SCOPE-3 findings because they are addendum/spec discipline issues, not unbuilt-PRD gaps

### Round 0 amendment

See Round 20 for Round 0 Deferred-to-Gate-4 table amendment (append-only; Round 0 content itself unchanged).

### Emission

No new findings. Reduction from SCOPE-3 roster.

---

## Round 18 — Decision 15: §3 high-severity standalones

- **Date:** 2026-04-21
- **SYNTHESIS reference:** §6 Decision 15 / §3 / §7.1 F7–F14 + §7.2 F16
- **Founder verdict table (verbatim from FOUNDER_HANDOFF):**

| Finding | Severity | Beta | Resolution |
|---|---|---|---|
| 3A PRD-17B auto-sweep silently no-op | High SCOPE-8b | Y | Fix Next Build |
| 3B PRD-14B .ics CHECK violation | High SCOPE-8b | Y | Fix Now |
| 3C PRD-22 account_deletions GDPR unenforced | High SCOPE-8b | Y | Fix Next Build |
| 3D PRD-16 meeting impressions privacy | High SCOPE-8b | Y | Fix Next Build |
| 3D PRD-16 dad meeting permission gate | High SCOPE-8b | Y | Fix Next Build |
| 3E PRD-27 shift_sessions/time_sessions bifurcation | High SCOPE-8b | Y | Fix Now (sequenced after Decision 6 type consolidation) |
| 3F PRD-28 first allowance_periods row never created | High SCOPE-3 | Y | Fix Next Build |
| 3G PRD-14D PIN-per-intention | **Folded into Decision 3 / Pattern 1D — no separate emission** | — | — |
| 3H PRD-15 messaging safety (consolidated 4 sub-surfaces) | High SCOPE-8b | Y | Fix Next Build |

### Per-surface emission + evidence

- **SCOPE-8b.F6** — "PRD-17B auto-sweep silently a no-op" — High, Beta Y, Fix Next Build — EVIDENCE_prd17b seam #5. Marquee "wake up to sorted items" promise unimplemented; holding items vanish with no destination rows created.
- **SCOPE-8b.F7** — "PRD-14B .ics CHECK violation" — High, Beta Y, Fix Now — EVIDENCE_prd14b seam #6. *(See Round 2 / Pushback B.)* One-line migration.
- **SCOPE-8b.F8** — "PRD-22 account_deletions GDPR right-to-erasure unenforced" — High, Beta Y, Fix Next Build — EVIDENCE_prd22 F-A. pg_cron schedule commented out; `process_expired_deletions()` only soft-deactivates; no UI path.
- **SCOPE-8b.F9** — "PRD-16 meeting impressions privacy unenforced" — High, Beta Y, Fix Next Build — EVIDENCE_prd16 seam #2. Convention #232 enforced only by SQL comment. Couple meeting impressions readable by partner.
- **SCOPE-8b.F10** — "PRD-16 dad meeting permission gate absent" — High, Beta Y, Fix Next Build — EVIDENCE_prd16 seam #3. `useCreateMeeting` does NO `member_permissions` check before INSERT.
- **SCOPE-8b.F11** — "PRD-27 shift_sessions/time_sessions bifurcation (live data gap)" — High, Beta Y, Fix Now — EVIDENCE_prd27 F-A. 2 live `special_adult_assignments` rows in production. **Apply-phase instruction (required inside F11's finding body):** include the following sentence to carry the sequencing dependency forward into AUDIT_REPORT_v1.md:

  > "Remediation sequenced after SCOPE-3.F2 PRD-35 RecurrenceDetails type consolidation — that consolidation is the root cause of this bifurcation."

  Same dependency note is already placed on SCOPE-3.F2's body per Round 9. Both sides of the dependency must carry it so a reader scanning either finding sees the sequencing.
- **SCOPE-3.F14** — "PRD-28 first allowance_periods row never created" — High, Beta Y, Fix Next Build — EVIDENCE_prd28 seam #8. Allowance system functionally non-operational at first-use.
- **Decision 15 3G** → folded into SCOPE-8b.F4 Pattern 1D (Round 6). No separate emission.
- **SCOPE-8b.F12** — "PRD-15 messaging safety semantics enforced client-side only (consolidated 4 sub-surfaces)" — High, Beta Y, Fix Next Build — EVIDENCE_prd15 F-A. Coaching log fictional (`useRef` no DB write); per-pair messaging permission client-side only; safety alert DnD bypass absent; Content Corner lock client-only. (Crisis Override sub-element cross-cites SCOPE-8b.F5 from Round 7.)

---

## Round 19 — Post-Audit Recommendations (3 CLAUDE.md convention proposals)

- **Date:** 2026-04-21
- **Founder verdict on all three:** "C (both)" — emit in Scope 3+8b for audit-trail continuity AND hand off to dedicated CLAUDE.md convention session for numbering/text drafting.

### Post-Audit Recommendation #1: Lego Connector Documentation Convention

**Trigger:** Decision 9 reframe (Round 12). Without a documentation convention, future builders may mistake Lego primitives for dead code.

**Proposed convention (draft language for CLAUDE.md session):**

> **CLAUDE.md Convention #XXX — Lego Primitive Connector Documentation**
>
> Every component/table/feature that serves as a Lego primitive in the surge-protector architecture must declare its expected consumers. Format:
>
> 1. **Component header comment block** — immediately below imports, before the component definition:
>    ```tsx
>    /**
>     * Lego Primitive: [component name]
>     * Expected consumers: [list of PRDs / surfaces / features]
>     * Connection shape: [brief description of the prop/hook contract]
>     * Wired consumers: [list with date and commit SHA as they come online]
>     */
>    ```
> 2. **STUB_REGISTRY.md entry** — new category "Lego Primitives Awaiting Consumers" with the same information.
> 3. **On wire-up:** When a consumer is wired, add to "Wired consumers" list, remove from "Expected consumers" list, cross-reference the wire-up in CLAUDE.md build log.
>
> This prevents future builders from mistaking Lego primitives for dead code and provides discoverability when building consumer features.

### Post-Audit Recommendation #2: AI Model Selection is Registry-Driven

**Trigger:** Decision 7 expanded scope (Round 10). Multi-provider `invokeAI()` helper pattern.

**Proposed convention (draft language for CLAUDE.md session):**

> **CLAUDE.md Convention #XXX — AI Model Selection is Registry-Driven**
>
> AI model selection is registry-driven, never hardcoded in Edge Functions. All LiLa guided modes, tool invocations, and ad-hoc AI calls select their model/provider by reading `lila_guided_modes` (or equivalent registry) at runtime via the shared `invokeAI(mode_name, messages, options?)` helper in `_shared/ai-invoke.ts`.
>
> Model or provider changes are DB migrations, not code changes. This pattern supports:
> 1. Multi-provider capability (Anthropic, OpenAI, Google, OpenRouter-routed, future providers)
> 2. Per-mode fallback on provider outage
> 3. Cost/capability response as the AI landscape shifts
> 4. Centralized visibility for cost audit (actually-used provider+model logged per invocation)
>
> Edge Functions that hardcode MODEL strings fail CI pre-deploy check (new CI rule to be added).

**Cross-reference:** Scope 4 (cost-pattern audit) should formally adopt the `invokeAI()` pattern as enforceable convention.

### Post-Audit Recommendation #3: Addendum-writing habit — "consumer missing" vs "never built" (prospective convention only)

**Trigger:** Pushback C (Round 3) — PRD-22 `history_retention` initially triaged as "never built" when it's actually "specced with DB column, consumers missing." The retrospective footnote documenting this specific correction has been moved into SCOPE-8b.F4's finding body (see Round 6 emission instruction). This Recommendation #3 is **forward-looking only** — a prospective addendum-writing convention for future audits.

**Proposed addendum-writing habit #9 (future — for CLAUDE.md session):**

> **Addendum-writing Habit #9:** When a DB column exists and a PRD section specs it, the audit default is "consumer missing," not "feature never built." Verify against PRD text before classifying.

### Emission (all three emit for audit-trail continuity)

- **SCOPE-3.F15** — "CLAUDE.md convention proposal: Lego Primitive Connector Documentation" — Low, Beta N, Intentional-Update-CLAUDE-md (hand to dedicated CLAUDE.md session)
- **SCOPE-3.F16** — "CLAUDE.md convention proposal: AI Model Selection is Registry-Driven (`invokeAI()` helper)" — Low, Beta N, Intentional-Update-CLAUDE-md (hand to dedicated CLAUDE.md session)
- **SCOPE-3.F17** — "CLAUDE.md addendum-writing habit proposal: consumer-missing vs never-built classification (Habit #9, prospective convention only)" — Low, Beta N, Intentional-Update-CLAUDE-md (hand to dedicated CLAUDE.md session). Retrospective footnote about the PRD-22 `history_retention` correction is NOT part of this emission — it lives inside SCOPE-8b.F4's finding body per Round 6 apply-phase instruction.

### Additional global-addenda process-hygiene observations

Per SYNTHESIS.md §9 note #5, three process-hygiene observations from EVIDENCE_global-addenda pattern #1-#3 are **NOT emitted as standalone findings.** They live as Appendix notes in AUDIT_REPORT_v1.md:
1. Addendum supersession tagging (`> **SUPERSEDED BY Build X**`)
2. Addendum completion-fact verification (`> **Verified against code on YYYY-MM-DD**`)
3. Addendum stub-socket language discipline (see Round 16 cross-ref)

Apply-phase worker records these as Appendix notes, not Findings.

---

## Round 20 — Round 0 Deferred-to-Gate-4 table amendment

- **Date:** 2026-04-21
- **Triggered by:** Round 17 (Decision 14)
- **Founder verdict:** "Yes. Add PRD-27 + PRD-29 to DECISIONS.md Round 0 Deferred-to-Gate-4 table alongside PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B."

### Amended Round 0 Deferred-to-Gate-4 table

Round 0 content itself is append-only; this round records the amendment as a supplementary entry. Apply-phase worker uses the amended table below as authoritative for §3 Appendix emission.

| Surface | Blocking unbuilt PRD | Closed finding reference |
|---|---|---|
| PRD-20 Safe Harbor integrations | PRD-20 unbuilt | SCOPE-8a.F3 |
| PRD-30 Safety Monitoring integrations | PRD-30 unbuilt | SCOPE-8a.F3 |
| PRD-32/32A Admin Console integrations | PRD-32 unbuilt | SCOPE-8a.F1 remediation scope |
| PRD-28B Compliance & Progress Reporting seam (PRD-37 × PRD-28B) | PRD-28B unbuilt | Scope 5 Finding A |
| PRD-40 COPPA consent gating integrations | PRD-40 unbuilt | SCOPE-8a.F1 |
| PRD-41 Runtime ethics enforcement integrations | PRD-41 unauthored | SCOPE-8a.F3 |
| **PRD-27 Caregiver Tools integrations** ← NEW | PRD-27 mostly unbuilt (3 tables, no UI surface) | EVIDENCE_prd27 F-B; cross-ref SCOPE-3 roster |
| **PRD-29 BigPlans integrations** ← NEW | PRD-29 entirely unbuilt | EVIDENCE_prd29 F-A; cross-ref SCOPE-3 roster |
| **PRD-19 Family Context & Relationships core infrastructure** ← NEW (added per Amendment 3 — founder isolated review 2026-04-21) | PRD-19 mostly unbuilt (4 core tables absent, no UI entry) | EVIDENCE_prd19 F-B (PRD-19 fixable integration items are SCOPE-3.F39 in main table) |

### Findings that DO remain standalone after this amendment

- **PRD-27 F-A (shift bifurcation)** — SCOPE-8b.F11 Beta-Y High (live data gap, not unbuilt-PRD gap)
- **PRD-29 F-B (guided-mode taxonomy drift)** — standalone SCOPE-3
- **PRD-29 F-C (5 feature keys absent from registry)** — standalone SCOPE-3
- **PRD-29 F-D (stub-socket WIRED)** — SCOPE-3.F13 (Round 16 / Decision 13)
- **PRD-19 F-A (is_available_for_mediation)** — folded into SCOPE-8b.F4 Pattern 1D (Round 6)
- **PRD-19 F-C + F-D (lila-chat doesn't load private/relationship notes + family_context_interview drift)** — SCOPE-3.F39 (Amendment 3 — formerly labeled F39b, now takes the F39 slot since F39a is Appendix-only and not numbered in the main table)

### Emission

No new findings. PRD-27 F-B + PRD-29 F-A collapse to one-line Deferred-to-Gate-4 cross-references in AUDIT_REPORT §3 Appendix (not the main §3 finding table).

---

## Synthesis pass

> This section regenerates the final emission rosters (SCOPE-8b + SCOPE-3) per founder verdicts above. It supersedes [SYNTHESIS.md](SYNTHESIS.md) §7.1 and §7.2 on every count where pushbacks or decisions reshape the mapping. Apply-phase worker uses this section as authoritative input for AUDIT_REPORT_v1.md §3 + §8b emission.

### Walk-through protocol

This is the first Scope to use the **Option A pattern-grouped walk-through** (single-session pattern-level adjudication against [SYNTHESIS.md](SYNTHESIS.md) §§1–7 instead of per-surface round-by-round adjudication). Founder walked the 15 decision prompts in SYNTHESIS.md §6 during the 2026-04-21 claude.ai web session; pattern-level verdicts cascaded to per-surface emissions via the tables below. Handoff captured in [FOUNDER_HANDOFF.md](FOUNDER_HANDOFF.md); pushbacks captured in Rounds 1–3; decisions captured in Rounds 4–18; post-audit recommendations in Round 19; Deferred amendment in Round 20.

### Emission roster — SCOPE-8b (13 findings per Flag 1 verdict)

| ID | Title | Severity | Beta Y | Resolution | Location / Primary Evidence |
|---|---|---|---|---|---|
| SCOPE-8b.F1 | Edge Functions authenticate but do not authorize (13 surfaces including cross-family Mediator Full Picture data leakage + PRD-21A Vault teen-filter) | Blocking | Y | Fix Now (Mediator) + Fix Next Build (remainder) | EVIDENCE_prd34 F-B (lede); cross-refs: EVIDENCE_prd15 seam #4, _prd17b seam #6, _prd18 seam #7, _prd21 F-A, _prd21a F-C (teen-filter — folded per Flag 1), _prd22 F-C, _prd25 seam #7, _prd27 F-A, _prd34 F-A, _prd36 F-C |
| SCOPE-8b.F2 | HITM gate bypassed on PRD-21 `communication_drafts` persist | High | Y | Fix Next Build | EVIDENCE_prd21 F-B |
| SCOPE-8b.F3 | HITM gate bypassed on PRD-34 `board_personas` generation | High | Y | Fix Next Build | EVIDENCE_prd34 F-C |
| SCOPE-8b.F4 | Documented user-controlled accountability/privacy silently unenforceable (5 surfaces: PIN, is_available_for_mediation, analytics_opt_in, history_retention, family_best_intentions.is_included_in_ai) | High | Y | Fix Next Build (user-control enforcement sweep) | EVIDENCE_prd14d F-A + F-D, _prd19 F-A 8b side, _prd22 F-B + F-C sub-element |
| SCOPE-8b.F5 | Crisis Override missing in 3 Edge Functions (message-coach, auto-title-thread, bookshelf-discuss) | Blocking | Y | Fix Now (ships with F1) | EVIDENCE_prd15 seam #6, _prd23 Finding A |
| SCOPE-8b.F6 | PRD-17B auto-sweep silently a no-op (marquee "wake up to sorted items" promise unimplemented) | High | Y | Fix Next Build | EVIDENCE_prd17b seam #5 |
| SCOPE-8b.F7 | PRD-14B `.ics` import CHECK violation (runtime failure on marquee import feature) | High | Y | Fix Now (1-line migration) | EVIDENCE_prd14b seam #6 |
| SCOPE-8b.F8 | PRD-22 `account_deletions` GDPR right-to-erasure unenforced (pg_cron commented out; soft-deactivate only; no UI path) | High | Y | Fix Next Build | EVIDENCE_prd22 F-A |
| SCOPE-8b.F9 | PRD-16 meeting impressions privacy unenforced (Convention #232 enforced only by SQL comment) | High | Y | Fix Next Build | EVIDENCE_prd16 seam #2 |
| SCOPE-8b.F10 | PRD-16 dad meeting permission gate absent (useCreateMeeting does NO member_permissions check) | High | Y | Fix Next Build | EVIDENCE_prd16 seam #3 |
| SCOPE-8b.F11 | PRD-27 shift_sessions/time_sessions bifurcation (live data gap; 2 live rows in production). Apply-phase **must** embed sequencing sentence in finding body: "Remediation sequenced after SCOPE-3.F2 PRD-35 RecurrenceDetails type consolidation — that consolidation is the root cause of this bifurcation." | High | Y | Fix Now (sequenced after SCOPE-3.F2) | EVIDENCE_prd27 F-A |
| SCOPE-8b.F12 | PRD-15 messaging safety semantics enforced client-side only (consolidated 4 sub-surfaces) | High | Y | Fix Next Build | EVIDENCE_prd15 F-A |
| SCOPE-8b.F13 | PRD-31 server-side subscription tier enforcement absent (47 Edge Functions ungated) | High | Y | Fix Next Build | EVIDENCE_prd31 F-G |

**Count reconciliation:** Final SCOPE-8b count = **13 findings** per founder isolated review 2026-04-21 Flag 1 verdict. FOUNDER_HANDOFF initially stated "14 findings (was 15; F1+F2 merged per Pushback A)." During isolated DECISIONS.md review, founder verdicted to fold PRD-21A Vault teen-filter (originally SYNTHESIS §7.2 F69 "teen-visible SCOPE-8b primary via 1A") into SCOPE-8b.F1 as the 13th contributing surface of Pattern 1A — same root cause, same `authorizeForFamily` helper class of fix with role-check extension, one build one helper one fix. Standalone emission would fragment the remediation. SCOPE-8b count: 15 (SYNTHESIS draft) → 14 (post-Pushback A) → 13 (post-Flag 1 verdict, final).

### Emission roster — SCOPE-3 (38 findings post-consolidation)

Aggressive cross-addendum consolidation applied per PLAN §5.2 to compress SYNTHESIS §7.2's 72 pre-consolidation rows to the ~35–40 target stated in FOUNDER_HANDOFF.

| ID | Title | Severity | Beta Y | Resolution | Source |
|---|---|---|---|---|---|
| SCOPE-3.F1 | Source/enum discipline drift pattern (7+ columns freeform TEXT with missing CHECKs, excluding PRD-14B .ics → SCOPE-8b.F7) | Medium | N | Fix Next Build (case-by-case) | Pattern 2A cross-refs |
| SCOPE-3.F2 | PRD-35 schedule vocabulary drift (4 incompatible vocabularies + 2 RecurrenceDetails TS types) — sequenced: spec amendment → PRD-27 F-A type consolidation | Medium | N | Fix Next Build | EVIDENCE_prd35 F-A |
| SCOPE-3.F3 | PRD-35 scheduler output broken semantics (completion-dependent + alternating-weeks + buildTaskScheduleFields) | Medium | N | Fix Next Build | EVIDENCE_prd35 F-B |
| SCOPE-3.F4 | PRD-35 convention surface unwired (calendar preview 2/3 consumers, weekStartDay, allowedFrequencies, _legacy_recurrence, CHECK gaps, scheduler tier gating) | Low | N | Fix Next Build | EVIDENCE_prd35 F-C |
| SCOPE-3.F5 | Model-tier registry-vs-runtime drift — EXPANDED to multi-provider `invokeAI()` helper architecture | Medium | N | Fix Next Build | Pattern 2C cross-refs |
| SCOPE-3.F6 | PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended | Medium | N | Intentional-Update-Doc | Pattern 2D cross-refs |
| SCOPE-3.F7 | Addendum self-reporting drift (3 addenda: PRD-21C, PRD-24, PRD-29 assert completion facts code contradicts) | Low | N | Intentional-Update-Doc | Pattern 2F cross-refs |
| SCOPE-3.F8 | Reusable animation/visual primitive library intentionally unassigned to production consumers (Lego/surge-protector architecture, 9+ components) | Low | N | Intentional-Document | Reframed Pattern 2E cross-refs |
| SCOPE-3.F9 | PRD-14 `dashboard_widgets.is_included_in_ai` widget toggle is no-op — DROP COLUMN + UI toggle (redundant double-control) | Low | N | Intentional-Update-PRD | EVIDENCE_prd14 F-B |
| SCOPE-3.F10 | Pattern 2H — Settings page missing nav entry points (4 PRD-22 cross-PRD entries + PRD-36 TimerConfigPanel + PRD-36 LogLearningModal Use Timer button) | Low | N | Fix Next Build | EVIDENCE_prd22 F-D + _prd36 F-A sub-element |
| SCOPE-3.F11 | PRD-24 useUncompleteTask stub comment stale post-Build-M | Low | N | Fix Next Build | EVIDENCE_prd24 F-β sub-element |
| SCOPE-3.F12 | PRD-36 time_session_completed + time_session_modified events have zero listeners (wire to Build M gamification hooks) | Low | N | Fix Next Build | EVIDENCE_prd36 F-A |
| SCOPE-3.F13 | PRD-29 addendum marks stub sockets as WIRED despite no writer code existing | Low | N | Intentional-Update-Doc | EVIDENCE_prd29 F-D |
| SCOPE-3.F14 | PRD-28 first allowance_periods row never created (allowance non-operational at first-use) | High | Y | Fix Next Build | EVIDENCE_prd28 seam #8 |
| SCOPE-3.F15 | CLAUDE.md convention proposal: Lego Primitive Connector Documentation | Low | N | Intentional-Update-CLAUDE-md | Round 19 / Rec #1 |
| SCOPE-3.F16 | CLAUDE.md convention proposal: AI Model Selection is Registry-Driven (`invokeAI()` helper) | Low | N | Intentional-Update-CLAUDE-md | Round 19 / Rec #2 |
| SCOPE-3.F17 | CLAUDE.md addendum-writing habit proposal: consumer-missing vs never-built classification (Habit #9, prospective only; retrospective footnote lives in F4) | Low | N | Intentional-Update-CLAUDE-md | Round 19 / Rec #3 |
| SCOPE-3.F18 | PRD-08 Notepad→studio_queue orphan destinations (message, track, optimizer) + source tracking lost on direct destination writes (consolidated) | Low | N | Fix Next Build | EVIDENCE_prd08 F-A + F-B |
| SCOPE-3.F19 | PRD-23 BookShelf 5 outbound handoffs partially built + cross-PRD addendum schema drift (consolidated) | Medium | N | Fix Next Build + Intentional-Update-Doc | EVIDENCE_prd23 C + D |
| SCOPE-3.F20 | PRD-25 Guided cross-feature integrations ship as UI-visible placeholders (Step 2.5 Reflections, Messages tab, Write badge, SendTo Message) + bottom nav missing Victories + wrong feature_key gate on Guided LiLa modes + gamification-disable unimplemented (consolidated PRD-25 bundle) | Medium | N | Fix Next Build | EVIDENCE_prd25 F-A through F-consolidated |
| SCOPE-3.F21 | PRD-26 Build-M-superseded surfaces: Reveal Task Tile stubbed + Mom Message Card stubbed + section-key data-driven layout not implemented (hardcoded JSX) (consolidated PRD-26 bundle) | Low | N | Intentional-Document (stubs) + Fix Next Build (data-driven layout) | EVIDENCE_prd26 F-A + F-B + F-C |
| SCOPE-3.F22 | Play shell "Fun" tab 404 (/rewards route missing) | Low | N (mild Y) | Fix Now (1 line) | EVIDENCE_prd24a F-B |
| SCOPE-3.F23 | PRD-14 dashboard section col_span + grid sharing unimplemented + Today's Victories widget shows recent-3 instead of today-filtered (consolidated PRD-14 polish) | Low | N | Fix Next Build | EVIDENCE_prd14 F-A + F-C |
| SCOPE-3.F24 | PRD-14B polish bundle: calendar-parse-event Edge Function + calendar_event_create LiLa mode unbuilt + duplicate calendar_color column + getMemberColor drift + showTimeDefault={false} violates Convention #109 (consolidated) | Low | N | Fix Next Build (or Deferred for AI intake per Scope 2) | EVIDENCE_prd14b seams #3, #8, cross-refs |
| SCOPE-3.F25 | PRD-18 5 cross-feature wirings delivered as schema/type scaffolding (GIN index, rhythm_request enum, reflection_routed, contextual_help, mood_triage) | Low | N | Fix Next Build | EVIDENCE_prd18 F-consolidated |
| SCOPE-3.F26 | PRD-21 4 integration surfaces scaffolding only (Higgins Navigate skill save, AI Toolbox sidebar, Send via Message, name auto-detection) | Medium | N | Fix Next Build | EVIDENCE_prd21 F-C |
| SCOPE-3.F27 | PRD-22 infrastructure consumer gaps: member_emails + lila_member_preferences schema extensions have zero consumers + Settings overlay-vs-route architectural drift + Out of Nest notification infrastructure drift (consolidated PRD-22 bundle excluding GDPR deletion which is SCOPE-8b.F8) | Medium | N | Fix Next Build (consumers) + Intentional-Document (overlay-vs-route) | EVIDENCE_prd22 F-C + F-E + F-F |
| SCOPE-3.F28 | PRD-24 integration edges schema/primitive-only (cross-ref SCOPE-3.F6 Build M supersession) | Low | N | Fix Next Build | EVIDENCE_prd24 F-α + F-β |
| SCOPE-3.F29 | PRD-24A overlay-engine architecture entirely superseded by Build M (cross-ref SCOPE-3.F6) | Medium | N | Intentional-Document | EVIDENCE_prd24a F-A |
| SCOPE-3.F30 | PRD-24B superseded architectures: flat Reveal Type Library → reveal_animations style_category + Color-Reveal → Build M tally-counter + animation primitives demo-only (cross-ref SCOPE-3.F6, F8) | Medium | N | Intentional-Document + Fix Next Build | EVIDENCE_prd24b F-α + F-β + F-γ |
| SCOPE-3.F31 | PRD-28 enum + compliance bundle: PRD-28B compliance handoff Deferred-to-Gate-4 + hourly + financial_approval dead enum values + homework approval-path time log gap (consolidated PRD-28 bundle excluding first-allowance-period which is SCOPE-3.F14) | Low | N | Fix Next Build (enums, time log) + Deferred-Document (PRD-28B) | EVIDENCE_prd28 seams #1, #9, #10, #12, #15 |
| SCOPE-3.F32 | PRD-29 BigPlans surface-level drift: guided-mode taxonomy (4 addendum vs 5 seeded) + 5 BigPlans feature keys referenced but absent from feature_key_registry (consolidated PRD-29 bundle excluding F-A entirely-unbuilt which is Deferred per Round 20, and F-D stub-sockets which is SCOPE-3.F13) | Medium | N | Fix Next Build + Intentional-Update-Doc | EVIDENCE_prd29 F-B + F-C |
| SCOPE-3.F33 | PRD-31 tier enforcement wire-up bundle: useCanAccess + PermissionGate adoption gap + permission_level_profiles seeded never surfaced + feature_access_v2 schema drift + founding override missing onboarding-complete clause + founding_rate columns missing (consolidated PRD-31 bundle excluding server-side tier enforcement which is SCOPE-8b.F13, and monetization-unbuilt which is Deferred) | Medium | N | Fix Next Build + Intentional-Update-Doc | EVIDENCE_prd31 F-A + F-B + F-C + F-E + F-F |
| SCOPE-3.F34 | PRD-31 monetization engine entirely unbuilt at server layer (Stripe webhook + tier enforcement cascade) | Medium | N | Deferred-Document | EVIDENCE_prd31 F-D |
| SCOPE-3.F35 | PRD-34 ThoughtSift implementation drift bundle | Low-Medium | N | Fix Next Build | EVIDENCE_prd34 F-D |
| SCOPE-3.F36 | PRD-36 cross-PRD integration bundle: engine wired but cross-PRD integration dispatched to void + timer completion-side integrations partially wired + FloatingBubble z-35 below BottomNav z-40 (consolidated PRD-36 bundle excluding TimerConfigPanel which is SCOPE-3.F10, and zero-listener events which is SCOPE-3.F12) | Medium | N | Fix Next Build | EVIDENCE_prd36 F-A + F-B + F-D |
| SCOPE-3.F37 | PRD-17B mindsweep-sort 6 seams consolidated (seams 1, 2, 4, 7, 9, 12, 13, 14) — excluding auto-sweep no-op which is SCOPE-8b.F6 | Medium | N | Fix Next Build | EVIDENCE_prd17b consolidated |
| SCOPE-3.F38 | PRD-14D dashboard architecture gaps: Hub widget_grid section registered but returns null + PerspectiveSwitcher overgrants to special_adult (Family Overview + Hub) (consolidated PRD-14D bundle excluding PIN + family_best_intentions.is_included_in_ai which are SCOPE-8b.F4) | Medium | N | Fix Next Build | EVIDENCE_prd14d F-B + F-C |
| SCOPE-3.F39 | PRD-19 fixable integration items: general lila-chat doesn't load private_notes/relationship_notes + family_context_interview model-tier drift (cross-ref SCOPE-3.F5) and no UI entry (per Amendment 3 — F39 = formerly F39b; PRD-19 core infrastructure unbuilt is Appendix-only, see Deferred-to-Gate-4 table below) | Medium | N | Fix Next Build | EVIDENCE_prd19 F-C + F-D |
| SCOPE-3.F40 | PRD-21A minor wire-up + vault_tool_sessions tracking unwired + Optimizer integration unbuilt at server layer (consolidated PRD-21A bundle excluding MemberAssignmentModal broken write which is SCOPE-3.F41 Beta-Y, and Vault teen-filter which is folded into SCOPE-8b.F1 as 13th contributing surface per Flag 1 verdict) | Low | N | Fix Next Build + Deferred-Document | EVIDENCE_prd21a F-B + F-D + F-E |
| SCOPE-3.F41 | PRD-21A MemberAssignmentModal writes `is_granted`/`granted_by` to dropped columns (broken write) | High | Y | Fix Now | EVIDENCE_prd21a F-A |
| SCOPE-3.F42 | PRD-21C entire PRD deferred (cross-ref Round 0 Deferred list) | Low | N | Deferred-Document | EVIDENCE_prd21c F-A |

**Emission count: 42 SCOPE-3 main-table findings (F1–F42 sequential, no F39a/F39b in the main roster).** Per Amendment 3 the PRD-19 split produces (a) SCOPE-3.F39 = the fixable PRD-19 integration items (main-table slot, shown above), and (b) an Appendix-only Deferred-to-Gate-4 entry for PRD-19 core infrastructure unbuilt (shown in the Deferred-to-Gate-4 Appendix table below, cross-referenced from Round 20). The Appendix entry is NOT counted in the main 42-finding roster.

Founder confirmed during isolated review (2026-04-21): **keep at 42 — do not compress further.** The candidate folds originally surfaced (F28+F29+F30 PRD-24 family, F33+F34 PRD-31 tier/monetization, F15+F16+F17 CLAUDE.md proposals) all lose necessary distinctions (per-addendum traceability, resolution-tag coherence, handoff specificity). "~35–40" in FOUNDER_HANDOFF was an estimate, not a directive. 42 with cleaner logic wins.

### Appendix C (Beta Readiness index) — Scope 3+8b additions

**Expected entries: 16** (13 SCOPE-8b Beta-Y + 3 SCOPE-3 Beta-Y) — count reduced from 17 per Flag 1 verdict (F14 folded into F1). Apply-phase worker appends to existing table at [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) line 1325.

| Finding ID | Scope | Title | Beta Y source |
|---|---|---|---|
| SCOPE-8b.F1 | 3+8b | Authenticate-not-authorize (13 surfaces including PRD-21A Vault teen-filter) | Cross-tenant data leakage + paid-AI cost amplification + teen-visible cross-tier content |
| SCOPE-8b.F2 | 3+8b | HITM PRD-21 communication_drafts | AI output persisted without review |
| SCOPE-8b.F3 | 3+8b | HITM PRD-34 board_personas | Hallucinated personas amortize cross-family |
| SCOPE-8b.F4 | 3+8b | Pattern 1D user-control enforcement (5 surfaces) | Trust-violation compounding |
| SCOPE-8b.F5 | 3+8b | Crisis Override missing (3 Edge Functions) | Convention #7 non-negotiable |
| SCOPE-8b.F6 | 3+8b | PRD-17B auto-sweep no-op | Marquee ADHD-mom use case non-viable |
| SCOPE-8b.F7 | 3+8b | PRD-14B .ics CHECK violation | Runtime DB error on marquee import |
| SCOPE-8b.F8 | 3+8b | PRD-22 GDPR deletion unenforced | Compliance + child-data cascade |
| SCOPE-8b.F9 | 3+8b | PRD-16 meeting impressions privacy | Couple-tester privacy leak |
| SCOPE-8b.F10 | 3+8b | PRD-16 dad permission gate absent | Cross-parent access violation |
| SCOPE-8b.F11 | 3+8b | PRD-27 shift bifurcation | 2 live rows; Special Adult permission cascade |
| SCOPE-8b.F12 | 3+8b | PRD-15 messaging safety (4 sub-surfaces) | Client-side-only safety semantics |
| SCOPE-8b.F13 | 3+8b | PRD-31 server-side tier enforcement absent | 47 Edge Functions ungated |
| SCOPE-3.F14 | 3+8b | PRD-28 first allowance_period row never created | Allowance non-operational at first-use |
| SCOPE-3.F22 | 3+8b | Play shell Fun-tab 404 | (mild Y — 1-line fix) |
| SCOPE-3.F41 | 3+8b | PRD-21A MemberAssignmentModal broken write | High — permissions don't persist |

**Beta Readiness blocker delta from Scope 3+8b:** +16 entries to Appendix C (was +17 pre-Flag-1 verdict).

### Deferred-to-Gate-4 Appendix (not main §3 finding table)

Apply-phase worker emits as §3 Appendix or similar — NOT finding-table entries.

| Deferred Surface | Cross-Ref | Evidence |
|---|---|---|
| PRD-20 Safe Harbor integrations | SCOPE-8a.F3 | EVIDENCE_prd20 |
| PRD-30 Safety Monitoring integrations | SCOPE-8a.F3 | EVIDENCE_prd30 |
| PRD-32/32A Admin Console integrations | SCOPE-8a.F1 remediation scope | EVIDENCE_prd32-32a |
| PRD-37/PRD-28B Compliance seam | Scope 5 Finding A | EVIDENCE_prd37-prd28b |
| PRD-40 COPPA consent gating | SCOPE-8a.F1 | (see Scope 8a) |
| PRD-41 Runtime ethics enforcement | SCOPE-8a.F3 | (see Scope 8a) |
| PRD-27 Caregiver Tools (NEW per Round 20) | PRD-27 mostly unbuilt; EVIDENCE_prd27 F-B collapsed | EVIDENCE_prd27 F-B |
| PRD-29 BigPlans (NEW per Round 20) | PRD-29 entirely unbuilt; EVIDENCE_prd29 F-A collapsed | EVIDENCE_prd29 F-A |
| PRD-19 Family Context & Relationships core infrastructure (NEW per Amendment 3) | PRD-19 mostly unbuilt (4 core tables absent, no UI entry); PRD-19 fixable integration items are SCOPE-3.F39 in main table | EVIDENCE_prd19 F-B |

### Cross-references to closed findings (cite, do not re-describe)

Apply-phase worker must cite these by ID only; do not re-describe content:
- **SCOPE-8a.F3** — Safe Harbor (PRD-20) + Safety Monitoring (PRD-30) entirely unbuilt
- **SCOPE-8a.F1** — Admin Console (PRD-32) entirely unbuilt + COPPA (PRD-40) entirely unbuilt
- **Scope 5 Finding A** — PRD-28B Compliance & Progress Reporting unbuilt
- **Scope 2 batch findings** across all 28 PRD surfaces (SCOPE-2.F1 through SCOPE-2.F~100) — cite by ID per emission where relevant
- **SCOPE-4.F*** (Scope 4 cost patterns, closed 2026-04-20) — cross-ref SCOPE-3.F5 (Decision 7 invokeAI expansion) and SCOPE-8b.F5 (Crisis Override)

### Process-hygiene observations (Appendix notes, NOT standalone findings)

Per Round 19 and SYNTHESIS §9 note #5, three global-addenda process-hygiene observations ride as Appendix notes in AUDIT_REPORT_v1.md:
1. Addendum supersession tagging (`> **SUPERSEDED BY Build X**`)
2. Addendum completion-fact verification (`> **Verified against code on YYYY-MM-DD**`)
3. Addendum stub-socket language discipline (cross-ref SCOPE-3.F13 + Post-Audit Rec #3)

### Archive + push protocol (from FOUNDER_HANDOFF)

1. Orchestrator populates DECISIONS.md rounds ← **done 2026-04-21 (this file)**
2. Orchestrator drafts apply-phase worker prompt ← next session
3. Founder reviews apply-phase prompt before dispatch
4. Apply-phase worker emits findings into AUDIT_REPORT_v1.md
5. Archive evidence files to `.claude/completed-builds/scope-3-8b-evidence/`
6. Commit + push on founder approval (stagger ~30min from Scope 4 apply-phase commit per cron-fix handoff doc guidance to avoid AUDIT_REPORT_v1.md merge conflicts)

### Sign-off

All 15 Decisions + 3 Pushbacks + 3 Post-Audit Recommendations + Round 0 amendment captured as Rounds 1–20. Emission rosters regenerated.

**Founder isolated review completed 2026-04-21** with 5 amendments + 2 flag verdicts applied:

- **Amendment 1** — Split F17: retrospective PRD-22 `history_retention` footnote moved inside SCOPE-8b.F4's finding body (apply-phase instruction in Round 6); SCOPE-3.F17 now emits only the prospective Habit #9 convention proposal.
- **Amendment 2** — SCOPE-8b.F11 sequencing dependency now embedded as explicit apply-phase instruction in Round 18 (both the Round note AND the finding body carry the sentence so the dependency surfaces in AUDIT_REPORT_v1.md).
- **Amendment 3** — SCOPE-3.F39 split: (a) PRD-19 core infrastructure unbuilt moved to Deferred-to-Gate-4 Appendix (no main §3 finding-table emission, no F39a finding ID), (b) PRD-19 fixable integration items take the SCOPE-3.F39 main-table slot as standalone Medium, Beta N, Fix Next Build.
- **Amendment 4** — PRD-19 added to Round 20 Deferred-to-Gate-4 amendment table (third new row alongside PRD-27, PRD-29).
- **Amendment 5** — Round 10 (Decision 7) Scope 4 scope-move flag stricken; Scope 4 closed 2026-04-20 / applied / archived; this finding stays in Scope 3+8b with read-only cross-reference only.
- **Flag 1 verdict** — SCOPE-8b.F14 (PRD-21A Vault teen-filter) folded into SCOPE-8b.F1 as 13th contributing surface; same root cause + same `authorizeForFamily` helper class of fix + one build one helper one fix. SCOPE-8b count: 15 → 14 → **13 (final)**. Beta Readiness delta to Appendix C: +16 entries (was +17).
- **Flag 2 verdict** — SCOPE-3 compression kept at 42 main-table findings; candidate folds all lose necessary distinctions; "~35–40" in FOUNDER_HANDOFF was estimate not directive.

**Final emission counts:** 13 SCOPE-8b findings + 42 SCOPE-3 main-table findings (F1–F42 sequential, no F39a/F39b IDs — PRD-19 fixable items take the F39 slot) + 9 Deferred-to-Gate-4 Appendix entries (6 pre-existing + PRD-27 + PRD-29 + PRD-19 core).

Ready for fresh session to draft apply-phase worker prompt per established Phase 2 audit pattern. Fresh session's 4 primary inputs: DECISIONS.md (this amended commit), FOUNDER_HANDOFF.md, SYNTHESIS.md, PLAN.md. If fresh session reaches for any of the 33 evidence files, that's a signal DECISIONS.md is under-documented and should be amended before apply-phase prompt drafts.
