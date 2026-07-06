# Pre-Dispatch Pack — PRD12A: Personal LifeLantern

> **Factory status:** synthesized → decisions-pending (4 decisions, batch 4)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD12A. Priority: P3.
> Evidence: `claude/dispatch-factory/PRD12AB-RECON.md` (shared with PRD12B).
> Headline: 0% built (all 4 tables absent), but the guided mode is registered with a real prompt
> (landed via SAFETY-BETA-GATE) and the whole platform is dotted with sockets waiting for it —
> the Rhythms Quarterly Inventory card, two Archives stub cards, the goal-generation destinations.
> One more false "✅ Wired" registry row caught (STUB:185, LifeLantern→Project Planner).

## Reconciliation rulings (newer wins — named explicitly)

1. **Sequencing: SPLIT from PRD-12B; 12A dispatches first.** (D-12AB-1) 12A has the larger
   dependency fan-in (Rhythms staleness trigger, Archives aggregation, goal generation) and no
   net-new infrastructure; 12B carries the chunked-Whisper build and collaborative flows —
   de-risk it separately, immediately after.
2. **Context placement: Layer 2 relevance-triggered** (the PRDs predate the three-layer pipeline).
   New loader in `_shared/context-assembler.ts` per the BookShelf/Archive pattern; topic trigger
   joins the existing vision|purpose|legacy identity category (both GS top-5 AND the active
   personal vision statement load on that trigger — bounded, no double-load ambiguity: LifeLantern
   loader owns `life_lantern_areas` + `personal_vision_statements`, the GS loader keeps
   guiding_stars). Convention #57's stale "7 stub loaders" text corrected at close-out.
3. **Complex-goal destination: Tasks fallback NOW, BigPlans socket later.** (D-12A-2) PRD-29 is
   parked (Defer-to-Gate-4, see PRD29.md); the PRD-29 addendum's `source='goal_decomposition'`
   routing cannot land against nothing. Build Screen 6 with the original PRD text's "offer to
   break into Tasks" behavior; register the re-wire as a stub owned by the PRD-29 build.
   STUB:185's false "✅ Wired" row corrected at close-out.
4. **Feature keys: canonical `life_lantern`** (+ `life_lantern_voice`, `life_lantern_teen`)
   registered in feature_key_registry; the Sidebar's drifted `lifelantern` string fixed to match.
   (D-12A-3) Tier assignments stay TBD/beta-bypass; teen youth-lite stays post-MVP per the PRD +
   Permission Matrix (Maximum-only teen). (D-12A-4)
5. **Marketing-copy correction in scope:** feature_expansion_registry + lanterns-path-data say
   "six life areas" — corrected to the PRD's 13 (small copy fix, rides Slice 4).
6. **Crisis coverage:** the emotional/mental-health area's assessment conversations run under the
   now-global safety-preamble (SAFETY-BETA-GATE Slice A) — build verifies its presence on the
   `life_lantern` prompt path; Convention #7 satisfied by inheritance, no bespoke work.
7. **HITM via the shared `<HumanInTheMix>` component** everywhere the PRD says confirm/edit
   (assessment save, vision save, gap summary, goal cards, statement regenerate). Convention #4.
8. **Snapshots and statements are append-only** (Convention #223 spirit): area snapshots +
   personal_vision_statements never UPDATE-in-place; is_active flips via trigger.
9. **Convention #257:** staleness math ("last visited X months") server-derived; no client dates.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 4 tables + is_active trigger + RLS (mom full/sees-all; dad own; append-only snapshot policies) + feature-key registration + sidebar key fix + DOMAIN_ORDER teach | Sonnet xhigh + rls-verifier |
| 2 | AI: context-assembler LifeLantern loader (Layer 2, ruling 2), assessment + vision-casting conversation flows on the existing `life_lantern` mode (5-step + role-model flows per PRD), gap-summary generation, HITM persistence, snapshot-before-overwrite | Sonnet xhigh |
| 3 | Surfaces: Hub (area cards, staleness, drag-reorder, vision preview), Area Detail (two-panel, snapshot history, prev/next), Personal Vision Statement screen (regenerate, versions, visibility + member picker, heart toggle) | Sonnet xhigh |
| 4 | Goal Generation (Screen 6: GS/BI direct-create, Task/Tracker routed pre-filled per Convention #276 direct-deploy where reviewed, Tasks fallback for complex goals per ruling 3, Daily-Progress Path I track toggles on generated tasks — closes STUB:536 for this surface) + fill the two Archives stub cards (member-detail LifeLantern aggregation; live-reference per PRD-13 contract) + wire the Rhythms Quarterly Inventory stale-areas/quick-win sections to real data (Convention #178 trigger goes live) + marketing-copy fix | Sonnet xhigh |
| 5 | E2E (`tests/e2e/features/life-lantern.spec.ts`: assessment→snapshot→re-assess archive chain, vision statement version/visibility probes incl. RLS, goal routing per destination, staleness trigger, dad-own/mom-sees-all probes) + verification + LiLa knowledge + STUB corrections (185 + Convention #57 text) | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 4)

| # | Decision | Recommendation |
|---|---|---|
| D-12AB-1 | Split 12A/12B into two sequential dispatches, 12A first | Yes — 12B's chunked-Whisper is separately de-riskable |
| D-12A-2 | Complex goals → Tasks fallback now; BigPlans re-wire registered for the parked PRD-29 build | Yes — can't route to a feature that doesn't exist |
| D-12A-3 | Canonical key `life_lantern`; fix the drifted sidebar string | Yes — register before any gating wires |
| D-12A-4 | Teen youth-lite stays post-MVP (revisit only if you want teens in sooner given Rhythms Phase D precedent) | Yes, keep post-MVP — mom-first |

## Dependency edges
Unblocks: Rhythms Quarterly Inventory (real trigger), Archives LifeLantern aggregation, PRD-11
victory filter socket, PRD-14 widget candidate, PRD-29's LifeLantern handoff producer side.
Depends on: nothing unbuilt. Dispatch any time after approval.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-4 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-12A — Personal LifeLantern. Pre-dispatch pack:
claude/dispatch-factory/PRD12A.md (9 rulings + 5-slice plan). Evidence:
claude/dispatch-factory/PRD12AB-RECON.md. All pack decisions RESOLVED per recommendations unless
the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; re-read
CLAUDE.md conventions added since; verify the life_lantern prompt in lila-chat still carries the
safety-preamble import (SAFETY-BETA-GATE landed it); re-verify recon file:line refs; next free
migration number immediately before every push.

READ FIRST (in order):
1. prds/personal-growth/PRD-12A-Personal-LifeLantern.md — FULL read, every word (13 areas — the
   marketing copy's "six areas" is drift you will fix, not follow).
2. Any prds/addenda/ PRD-12 matches + prds/addenda/PRD-Audit-Readiness-Addendum.md sections.
3. claude/dispatch-factory/PRD12A.md + PRD12AB-RECON.md — the rulings are LAW (esp. ruling 3:
   Tasks fallback for complex goals; do NOT build studio_queue 'plan' routing).
4. Create .claude/rules/current-builds/PRD-12A-lifelantern.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code.

BUILD SLICES 1→5 per the pack table. HARD RULES: snapshots + vision statements append-only
(is_active via trigger, never UPDATE content in place); every AI output through the shared
<HumanInTheMix> component; never clinical language or scales anywhere (PRD system-prompt rules +
celebration-only); goal Task/Tracker creation respects Convention #276 (direct-create where
mom reviewed; assignee pickers via useAssignableMembers if any assignment surface appears);
Create-with-heart defaults per is_included_in_ai pattern (#8); staleness server-derived (#257);
sidebar key canonicalized to life_lantern + mobile parity check (#16) since the page goes from
stub to real; zero hardcoded colors + density system (myaim-frontend-design skill).

PROOF: tests/e2e/features/life-lantern.spec.ts per the pack list. tsc -b clean, lint clean,
regression pins green (leak-pass — you touch member-scoped RLS). Ask the founder before running
shared-fixture suites. NOTHING COMMITS until proof green AND founder eyes-on clears; selective
staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing, live_schema regen,
STUB_REGISTRY corrections (row 185 false-Wired + Convention #57 stale text + rows 193/536 this
build closes), CLAUDE.md additions, LiLa knowledge (help-patterns + feature-guide-knowledge),
FeatureGuide on the new page, archive build file. PRD-12B dispatches next — leave it a clean
coordination note listing anything you built that it consumes (loader pattern, mode plumbing).
```
