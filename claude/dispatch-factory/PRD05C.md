# Pre-Dispatch Pack — PRD05C: LiLa Optimizer

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 9)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD05C. Priority: P5.
> Evidence: `claude/dispatch-factory/VAULT-RECON.md` (05C section).
> Headline: 0% built, but the plumbing that exists actively misleads — the Optimizer sits in
> LiLa's live mode picker and silently falls through to bare chat (registered MISLEADING UI).
> The hide-until-built interim fix rides SMFX (item 8). The real build is the PRD's 9-step
> crafting pipeline whose whole point is cost discipline: ~80% of optimizations are FREE
> (template assembly), only ~20% touch Sonnet.

## Reconciliation rulings (newer wins — named explicitly)

1. **Dad access (the PRD-vs-Permission-Matrix conflict): dad at Maximum profile GETS the
   Optimizer.** (D-05C-1) Production already seeded dad profile rows for `lila_optimizer`
   (migrations 011/012) per the Permission Matrix addendum; context assembly for a dad session
   is already filtered by the standard non-mom rules (#58 permission + privacy filtering), so
   nothing private leaks into his generated prompts. The PRD's "mom-only, no exceptions" text
   loses to the shipped permission architecture. If you'd rather honor the PRD text, say so —
   it's a one-line profile-seed removal instead.
2. **Metering/credits home: factory ruling D-PRD31-4 governs.** Costs log to the ONE pipeline
   (`ai_usage_tracking` via the shared cost-logger, feature_key granularity:
   `optimizer_quick`/`optimizer_walkthrough`); credit accounting rides PRD-31's `ai_credits`
   ledger. **05C never builds its own usage table** — the PRD's bespoke shape is amended away.
   Sequencing: dispatch AFTER PRD31 (credits ledger + thermometer exist); if dispatched earlier,
   the Usage screen ships display-only.
3. **No BYOK, copy/paste delivery only** — the PRD's explicit design wins; `ai_patterns.md`'s
   stray "BYOK support" line is corrected at close-out.
4. **Category-1 declaration:** the `optimizer` mode row's `context_sources = NULL` (predates
   Convention #248's binary) is fixed — populated array + `assembleContext()` through the
   shared pipeline, with the preset layer (7 system presets + auto-detect) selecting on top of
   the standard three-tier toggles, never around them.
5. **PRD-19 alias dependency:** external-prompt name substitution consumes the alias columns
   the PRD19 pack ships (`primary_alias`/`use_alias_in_external`). If PRD19 hasn't landed at
   dispatch, substitution degrades to display names with a registered follow-up — never blocks.
6. **Tier gating routes through the chart** (#256) — the PRD's hardcoded tier table is intent,
   not implementation. HITM on every generated prompt (card = Edit/Copy/Save/Regenerate).
   Templates and presets are DATA rows. "Optimize with LiLa" vault buttons (currently
   coming-soon) go live. Edit-in-Notepad chip wires (PRD-08 is long built).

## Slice plan (single Sonnet worker, 1-2 sessions)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: optimizer_outputs, optimization_patterns, user_prompt_templates, context_presets (+7 preset seeds, starter templates) + RLS + context_sources fix + key registration through the chart | Sonnet xhigh + rls-verifier |
| 2 | The pipeline: dedicated `lila-optimizer` Edge Function (9 steps; template path FREE, Sonnet only on the ~20% branch; Haiku context-learning check w/ Archives write-back offer via HITM), Quick + Walk-Me-Through drawer flows, Prompt Card, platform preference + copy delivery, alias substitution (ruling 5) | Sonnet xhigh |
| 3 | Templates & presets UX (save-as-template w/ placeholders, vault "Customize & Save" + Optimize-with-LiLa buttons live, preset manager) + Usage & Credits screen (reads ai_usage_tracking + ai_credits) + Edit-in-Notepad chip | Sonnet xhigh |
| 4 | E2E (`tests/e2e/features/lila-optimizer.spec.ts`: free-template path produces a prompt with ZERO model calls (cost-log probe), Sonnet path logs cost + deducts per PRD31 rules, preset context filtering probes incl. dad-session privacy filtering, is_lila_optimized flips on save, HITM card actions) + verification + LiLa knowledge + ai_patterns.md BYOK correction | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04, batch 9 — approved per recommendations)
| # | Decision | Ruling |
|---|---|---|
| D-05C-1 | Dad at Maximum profile keeps Optimizer access (filtered context) | **YES** |
| D-05C-2 | Dispatch after PRD31; Usage screen display-only if earlier | **YES** |

## DISPATCH PROMPT (paste into a FRESH session — after batch-9 decisions + ideally PRD31)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-05C — LiLa Optimizer. Pack:
claude/dispatch-factory/PRD05C.md (6 rulings). Evidence: claude/dispatch-factory/VAULT-RECON.md
(05C section). Decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; check PRD31 landed
(ai_credits ledger — ruling 2 fallback if not) and PRD19 (alias columns — ruling 5 fallback);
confirm SMFX item 8 hid the picker entry (you now UN-hide it as the feature goes real);
re-verify recon refs (LilaModeSwitcher, PromptPackDetail:148-166, mode row context_sources);
next free migration number before every push.

READ FIRST: (1) prds/personal-growth/PRD-05C-LiLa-Optimizer.md — FULL, every word (the 9-step
pipeline + 80/20 cost discipline IS the product); (2) prds/addenda/PRD-05-Planning-Decisions-
Addendum.md + PRD-31-Permission-Matrix-Addendum.md optimizer rows; (3) the pack + recon.
Create .claude/rules/current-builds/PRD-05C-optimizer.md (no YAML frontmatter), pre-build
summary, founder approval BEFORE code.

HARD RULES: the free-template path NEVER calls a model (the zero-cost E2E probe is
load-bearing); Sonnet only on the ~20% branch, Haiku only for context-learning detection; ONE
metering pipeline (extend ai_usage_tracking via the shared cost-logger — never a bespoke usage
table); credits via PRD31's ledger; HITM on every output; category-1 assembleContext with
presets layered ON TOP of the three-tier toggles; dad sessions get standard non-mom context
filtering; no BYOK, copy/paste only (+ ai_patterns.md correction at close-out); templates/
presets as DATA; Convention #257 dates; zero hardcoded colors + density.

PROOF: the new spec + tsc -b + lint. Ask before shared-fixture suites. NOTHING COMMITS until
green + founder eyes-on (eyes-on: optimize a real prompt of yours both modes — the free path
must feel instant, the card must feel like magic). Selective staging; founder confirms before
push. Close-out: Checkpoint 5, STUB:116 + coming-soon buttons resolved, live_schema regen,
LiLa knowledge, FeatureGuide, archive build file.
```
