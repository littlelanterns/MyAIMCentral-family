# Pre-Dispatch Pack — RFLX: Reflections Revamp

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 5)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: RFLX. Priority: P3.
> Evidence: `claude/dispatch-factory/RFLX-MSRE-RECON.md` (RFLX section).
> Headline: the recon reframes this item. Kid-private reflections would REVERSE PRD-18's
> deliberate, documented transparency design (mom sees kids' reflections; only dad's are private;
> teens see a TransparencyIndicator saying so). The follow-up-G label made it sound like a gap —
> it's actually a product-values reversal question. Meanwhile TWO real defects surfaced: the
> auto-created journal copy of every reflection is hardcoded 'private' (so mom sees the answer on
> the Reflections page but the SAME content is RLS-invisible in her Journal views — an accidental
> inconsistency), and the PRD's route-from-Reflections-page feature was never built (the
> `routed_destinations` column has no writer).

## Rulings

1. **Kid-private reflections: recommend NO (D-RFLX-1 — the headline decision).** PRD-18's
   transparency posture is deliberate and consistently signposted to teens; the platform-wide
   kid-privacy tension is being resolved at the PRD-40 level (D-PRD40-3: daily-UX privacy where
   the product chose it + formal parental review surfaces). Reflections never chose it. If you
   rule YES instead: the pack pre-scopes the alternate — display-layer via `filterKidPrivate()`
   (soft, reversible, Convention #76-consistent), teens only, per-response Lock toggle on the
   full Reflections page only (not rhythm inline), `visibility` column default 'shared_parents',
   both indicators made conditional. Either ruling, the rest of the pack proceeds.
2. **Journal-copy visibility fix (D-RFLX-2):** NEW kid/teen reflection journal copies save with
   `visibility:'shared_parents'` (matching the transparent design and PRD :906's "the two views
   are equivalent"); dad's copies stay 'private' (spousal carve-out); EXISTING rows untouched
   (never widen visibility retroactively). If D-RFLX-1 flips to yes, the copy mirrors the
   reflection's own setting instead.
3. **Transparency-indicator consistency:** add the indicator to `GuidedReflectionsSection`
   (evening-rhythm inline — the third write surface, currently silent); the other two stay.
4. **Build the Reflections-page routing** (PRD-18 :309): RoutingStrip on the full page (Victory /
   Journal-tag / Guiding Star destinations per PRD), populating `routed_destinations` — the dead
   column gets its writer. Rhythm inline stays routing-free per the PRD.
5. **Past tab UX pass** per follow-up G: grouping/date navigation polish, prompt-category
   display, and the journal-link affordance made honest (tap-through to the journal copy).

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Journal-copy visibility fix + indicator on GuidedReflectionsSection + Past tab UX pass | Sonnet xhigh |
| 2 | Reflections-page RoutingStrip + routed_destinations writer (the alternate privacy scope is DEAD per the D-RFLX-1 ruling — never build it) | Sonnet xhigh |
| 3 | E2E (`tests/e2e/features/reflections-revamp.spec.ts`: journal-copy visibility both roles — dad private / kid shared_parents; routing round-trip writes routed_destinations; indicator presence on all 3 surfaces) | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04)
| # | Decision | Ruling |
|---|---|---|
| D-RFLX-1 | Kid-private reflections | **NO — kids cannot lock content from parents. STANDING PRINCIPLE (founder, verbatim): "we don't want to facilitate hiding things from parents." Kid-privacy resolves at the COPPA level only.** The alternate privacy scope in Slice 2 is DEAD — do not build any part of it. No NEW kid-privacy affordances anywhere on the platform without explicit founder direction. |
| D-RFLX-2 | New kid journal copies → 'shared_parents'; dad stays private; existing rows untouched | **YES** |

## Dependency edges
None blocking. Coordinate lightly with FDWA (reflection_responses shadow policy) and GDCX
(Step 2.5 writes reflections) — any order works.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-5 decisions resolve)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for RFLX — the Reflections revamp. Pack:
claude/dispatch-factory/RFLX.md (5 rulings). Evidence: claude/dispatch-factory/RFLX-MSRE-RECON.md
(RFLX section — file:line map). ALL decisions RESOLVED (founder 2026-07-04): D-RFLX-1 = NO,
with the STANDING PRINCIPLE "we don't want to facilitate hiding things from parents" — the
privacy scope is dead; propose the principle as a CLAUDE.md convention line at close-out.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; re-read CLAUDE.md
conventions added since; check whether FDWA/GDCX landed (shared touchpoints noted in the pack);
re-verify useReflections.ts:259-273 and the migration-100071 RLS refs.

READ FIRST: prds/daily-life/PRD-18-Rhythms-Reflections.md reflections sections (:280-330,
:615-641, :765-770, :906) + PRD-18 addenda reflections rulings; the pack + recon. Create
.claude/rules/current-builds/RFLX-reflections.md, pre-build summary, founder approval BEFORE code.

HARD RULES: existing journal rows NEVER retroactively widened; dad's spousal privacy untouched;
icon semantics — Lock for visibility (never Heart/Eye, Conventions in CLAUDE.md); RoutingStrip is
the shared component (#21), never a bespoke grid; rhythm inline stays routing-free (PRD :309);
celebration-only tone; Convention #257 dates.

PROOF: the new spec + tsc -b + lint. Ask before shared-fixture suites. NOTHING COMMITS until
green + founder eyes-on. Close-out: Checkpoint 5, STUB/WIRING updates (routed_destinations dead
column resolved; View-As Follow-Up G row closed with the D-RFLX-1 ruling recorded), archive.
```
