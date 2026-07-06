# Pre-Dispatch Pack — MSWP: MindSweep Remainder (PRD-17B)

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 8)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: MSWP. Priority: P5 — and the recon
> SHRANK it substantially.
> Evidence: `claude/dispatch-factory/TAIL-RECON.md` (MSWP section).
> Headline: most of the inventoried "Phase B remainder" is either DONE or belongs elsewhere.
> Share-to-app is ALREADY WIRED (manifest share_target + /sweep param handling). Offline queue +
> dedicated sweep manifest are PRD-33 scope by the PRD-17B addendum's own assignment. Email
> intake is code-complete and blocked only on DNS — an ops task the PRD itself says is "not a
> PRD." What's genuinely left: the **MindSweep Digest has settings toggles that do nothing**
> (no rendering component exists), one iOS edge-case branch, a cron health check, and two
> registry honesty corrections.

## Rulings

1. **Scope = the real gaps only:** (a) MindSweep Digest rendering — the PRD-18 section type #28
   (morning/evening/weekly digest cards driven by the EXISTING `digest_*` toggles — today those
   toggles mislead mom); (b) iOS share-target graceful degradation (hide share-to-app copy,
   emphasize email, per PRD edge case); (c) live `cron.job_run_details` verification of
   mindsweep-auto-sweep (the Convention #246 patch — prove it's succeeding, not just patched);
   (d) registry corrections.
2. **Approval-learning Phase 2 stays Post-MVP** (D-MSWP-1) — the PRD's own internal phasing;
   data collection (wired) keeps accumulating. **STUB:232's "✅ Wired" gets the honesty split**
   (collection done / learning loop not built), matching row 231's self-correction style.
3. **Email forwarding = a founder ops checklist, not a build** (D-MSWP-2): the pack's worker
   produces the exact DNS/provider steps (forwarding address, MX/records, provider webhook →
   mindsweep-email-intake) for the founder to run when she wants it live; STUB:231 stays
   honestly Partial until then.
4. **Offline/manifest boundary recorded:** IndexedDB queue, dedicated /sweep manifest, SW-level
   share registration → PRD-33 pack territory (the addendum :142-152 assignment) — never
   double-built here.
5. PRD's stale "Not Started" header recorded in the feature-decision file (prds/ read-only).

## Slice plan (single Sonnet worker, small)
| Slice | Scope | Routing |
|---|---|---|
| 1 | MindSweep Digest section component (registry + renderer for morning/evening/weekly per the PRD's section-28 spec; honors the existing toggles; self-hides when disabled or empty) + rhythm seed wiring | Sonnet xhigh |
| 2 | iOS share-target degradation branch + cron health verification (paste cron.job_run_details results) + registry corrections (231 note, 232 split) + the email ops checklist doc | Sonnet xhigh |
| 3 | E2E (`tests/e2e/features/mindsweep-digest.spec.ts`: digest renders in the rhythm when toggled + hides when off; existing /sweep + MindSweep-Lite pins stay green) + verification | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 8)
| # | Decision | Recommendation |
|---|---|---|
| D-MSWP-1 | Approval-learning Phase 2 stays Post-MVP; registry row split honestly | Yes |
| D-MSWP-2 | Email goes live via YOUR ops checklist run (DNS/provider), not a code build | Yes — run it whenever you actually want email capture |

## DISPATCH PROMPT (paste into a FRESH session — after batch-8 decisions)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for MSWP — the MindSweep remainder (deliberately small).
Pack: claude/dispatch-factory/MSWP.md (5 rulings). Evidence: claude/dispatch-factory/
TAIL-RECON.md (MSWP section). Decisions RESOLVED per recommendations unless the founder noted
otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; re-verify the recon's
refs (manifest.json share_target, MindSweepCapture.tsx:122-129, useMindSweep.ts:547-558,
migration 100093 header); check whether PRD-33's pack/build claimed any overlapping scope.

READ FIRST: (1) prds/communication/PRD-17B-MindSweep.md — the Digest section (L651-663), edge
cases (L698-699), stubs table (L719-737); (2) prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md
:142-152 (the PRD-33 boundary you must NOT cross); (3) CLAUDE.md Conventions #180-182
(MindSweep-Lite is a DIFFERENT feature sharing the classifier — touch nothing there); (4) the
pack + recon. Create .claude/rules/current-builds/MSWP-mindsweep-remainder.md (no YAML
frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES: the digest is a rhythm SECTION per the PRD's own spec — front-door-or-helpful rule
(#168) applies (it links into /sweep and the queue, never pure display); self-hides when
toggles off or nothing swept; do NOT build offline/manifest/SW work (PRD-33's); do NOT touch
mindsweep-sort or the Lite components; cron verification is evidence-pasted, not assumed;
Convention #257 dates.

PROOF: the new spec + existing MindSweep pins + tsc -b + lint. Ask before shared-fixture
suites. NOTHING COMMITS until green + founder eyes-on (eyes-on: toggle the morning digest on,
sweep something tonight, see it in tomorrow's Morning Rhythm). Selective staging; founder
confirms before push. Close-out: Checkpoint 5, STUB 231/232 corrections, the email ops
checklist delivered to the founder, archive build file.
```
