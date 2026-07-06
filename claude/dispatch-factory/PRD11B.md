# Pre-Dispatch Pack — PRD11B: Family Celebration

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 8)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD11B. Priority: P5.
> Evidence: `claude/dispatch-factory/TAIL-RECON.md` (PRD-11B section).
> Headline: zero build despite a stale "✅ Wired" registry row; the Phase-3 godmother is an
> honest no-op waiting for this exact build; the Hub's "Celebrate Together" button is a disabled
> stub that doesn't even show a victory count. Everything it reads from (13 live victories,
> voices, celebration infra) already exists.

## Rulings

1. **Sequence: PRD-11B dispatches BEFORE PRD-14E** — it's the smaller build and it unlocks 14E's
   Screen 7 (Family Celebration on TV), turning 14E's double-blocked screen into a straight
   dependency. (D-11B-1)
2. **`family_celebration` is an explicit-grant-only permission key** per the Convention #274
   precedent (financial_tracking/studio/reward_rules class): dad sees family celebrations only
   when mom grants it; profiles never touch it. Mom's personal victories excluded by default per
   the PRD; PIN gate on the Hub trigger honored.
3. **Godmother replacement = a NEW superseding migration** (never edit landed 100213; guard-
   ledger header discipline — base on the current no-op body, document the supersession).
4. **Hub section rebuild is Slice 1** and delivers value before any AI: real aggregated victory
   count + expandable per-member breakdown (PRD-14D's own unmet MVP line) + the Celebrate
   trigger gated properly. The generation flow lands behind it.
5. **All four AI modes ship** (highlights / detailed / individual_spotlight /
   private_parenting_lens) — HITM on every narrative; celebration-only voice; the
   private-parenting-lens output is mom-only by definition and never enters any shared surface.
6. **STUB:184's false "✅ Wired" row corrected at close-out**; the 4 feature keys register in
   Slice 1; LifeLantern special filter stays a stub until PRD-12A ships (self-noted by the PRD).

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Migration (`family_victory_celebrations` + RLS + 4 keys + grant key) + godmother supersession + Hub section rebuild (real counts, breakdown, PIN-gated trigger) | Sonnet xhigh + rls-verifier |
| 2 | Generation View (filter bar: period/members/life-area/tags/special) + celebrate-family Edge Function (4 modes, voices, HITM) + Narrative Display + Archive | Sonnet xhigh |
| 3 | E2E (`tests/e2e/features/family-celebration.spec.ts`: generation per type, dad-ungranted blocked / granted sees, mom-personal-excluded-by-default probe, PIN gate, archive round trip, godmother fires real records now) + registry corrections + verification + LiLa knowledge | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 8)
| # | Decision | Recommendation |
|---|---|---|
| D-11B-1 | 11B dispatches before 14E (unlocks its Screen 7) | Yes |
| D-11B-2 | `family_celebration` = explicit-grant-only key (#274 class) | Yes |

## DISPATCH PROMPT (paste into a FRESH session — after batch-8 decisions)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-11B — Family Celebration. Pack:
claude/dispatch-factory/PRD11B.md (6 rulings). Evidence: claude/dispatch-factory/TAIL-RECON.md
(PRD-11B section). Decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; base the godmother
supersession on the CURRENT production body of execute_family_victory_godmother (100213 lineage
or later); re-verify HubVictoriesSummarySection.tsx state; next free migration number before
every push.

READ FIRST: (1) prds/personal-growth/PRD-11B-Family-Celebration.md — FULL, every word; (2) the
PRD-11 build's celebration infra (celebrate-victory EF, voices, CelebrationModal — REUSE the
voice system, never fork it); (3) CLAUDE.md #274 (grant class) + celebration-only principles;
(4) the pack + recon. Create .claude/rules/current-builds/PRD-11B-family-celebration.md (no
YAML frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES: HITM on every narrative; celebration-only (shows what WAS done, never gaps);
private_parenting_lens output is mom-only and never persisted to shared surfaces; dad access =
explicit grant only, profiles never touch the key; Hub trigger PIN-gated per PRD; supersede the
no-op godmother with a NEW migration (guard-ledger header); Convention #257 dates; zero
hardcoded colors + density; Lucide only.

PROOF: the new spec per the pack + tsc -b + lint + leak-pass pin (grant surfaces). Ask before
shared-fixture suites. NOTHING COMMITS until green + founder eyes-on (eyes-on: generate a real
Highlights celebration for your actual family week and read it aloud at the table — that IS the
acceptance test). Selective staging; founder confirms before push. Close-out: Checkpoint 5,
STUB:184 correction, live_schema regen, LiLa knowledge, FeatureGuide, archive build file, and a
coordination note for PRD-14E (its Screen 7 now unblocked).
```
