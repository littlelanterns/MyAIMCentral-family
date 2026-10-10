# Model Routing Policy — Who Does What

> Auto-loads into every Claude Code session via `.claude/rules/` discovery.
> Founder-approved 2026-07-01; amended 2026-08-23 (Fable in normal usage); generation-refreshed
> 2026-09-07 (Fable 5.1 / Opus 5 / Sonnet 5); **re-pinned 2026-10-10 (founder ruling) for the
> October 2026 lineup: Opus 5.5 (`claude-opus-5-5`, released 2026-09-22) becomes the DAILY SEAT
> and default model; Fable 5.1 (`claude-fable-5-1`) moves to deliberately-chosen judgment gates;
> Sonnet 5.5 (`claude-sonnet-5-5`, released 2026-09-28) replaces Sonnet 5 for workers; Haiku 5.5
> (`claude-haiku-5-5`, released 2026-10-07, 1M context, 10x cheaper) replaces Haiku 4.5, whose
> earliest retirement date is 2026-10-15.**
>
> Why the seat moved (2026-10-10): Opus 5.5 is cheaper than Opus 5 was ($4/$20 vs $5/$25) and runs
> at ~40% of Fable's rate; on a subscription that is how fast the weekly allowance drains. The seat's
> work is mostly reading state files, refereeing worker reports, writing dispatch prompts, and reading
> tour screenshots. Anthropic's own notes say Opus 5.5 reads screenshots and diagrams markedly better
> out of the box, and the 2026-07-12 analysis already found Opus handles routine checkpoint judgment
> well. Fable's real edge (long unattended runs, ambiguity, cross-PRD architecture, first-shot
> implementation of a large spec) is exactly what the two pinned gate agents and the escalation
> ladder cover. The default model is also the one you run BY ACCIDENT when a `/model` step is
> missed (it happened 2026-08-23): Opus 5.5 is a safe accident, Fable is an expensive one.
>
> **The security carve-out is permanent and capability-based: security/adversarial work never runs
> on Fable.** Fable's dual-use guardrails flagged the adversarial safety-stack review, red-team
> authoring, and exploit analysis on 2026-07-09; Opus did that work and found 4 critical
> vulnerabilities. Fable 5.1 has fewer cybersecurity false positives, but the carve-out costs
> nothing now that the seat is already on Opus, so it stays.
>
> The founder should never have to remember these assignments. Every session applies them
> automatically; every dispatch prompt carries its model header.

## The tier assignments

| Tier | Model | Claude Code ID | Role in this project |
|---|---|---|---|
| **Opus 5.5** | `claude-opus-5-5` | `claude-opus-5-5[1m]` | **Daily seat + default model.** Orchestration (status / plan / resume), Checkpoints 2 and 6, referee passes on worker reports, dispatch-prompt writing, Convention #277 screenshot judgment, escalated debugging (rung 2), and ALL security/adversarial work (red-team authoring, exploit analysis, RLS attack-surface sweeps, rls-verifier interpretation, ethics-pattern review). Run at effort **high**; its default is `medium`, one step lower than every other model. |
| **Fable 5.1** | `claude-fable-5-1` | `claude-fable-5-1[1m]` | **Judgment gates, chosen on purpose.** Pre-build audits (`pre-build-auditor`), Checkpoint 5 post-build verification (`post-build-verifier`), architecture/design decisions spanning PRDs, new PRD or addendum authoring, long unattended autonomous runs, top rung of the escalation ladder. **NEVER for security/adversarial content.** |
| **Sonnet 5.5** | `claude-sonnet-5-5` | `claude-sonnet-5-5[1m]` | **All coding workers.** Implementation subagents, E2E spec authoring, migrations/scaffolding (`migration-writer`, `edge-function-scaffolder`, `rls-verifier`), Explore fan-out, code-review *finder* pass, multi-file mechanical edits that still need judgment. Effort **high** by default (5.5 recalibrated its levels); **xhigh** for hard slices (RLS, cross-feature wiring, edits inside TaskCreationModal-class files). |
| **Haiku 5.5** | `claude-haiku-5-5` | `claude-haiku-5-5` (1M native) | Mechanical sweeps: file listing, classification, dedup, log summarization, residue checks, DRIVING eyes-on tours. Now 1M context, so the old "don't hand it huge inputs" caveat is gone. Default effort `medium`. Never judges screenshots (Sonnet minimum). |

## Which model, when: the decision guide

Ask these four questions in order. The first "yes" picks the model.

1. **Is it adversarial or security-shaped?** (red-team corpus, exploit reasoning, attack-surface sweep, interpreting an rls-verifier finding, PRD-30/PRD-41 classifier work, auth/RLS bypass hunting) → **Opus 5.5.** Full stop. Never Fable, even if a Fable window is already open; switch windows, not models.
2. **Is a test the judge?** (does it build, does the suite pass, does the RLS probe reject, does the row land) → **Sonnet 5.5 builds it; Playwright / `tsc -b` / lint / rls-verifier probes judge it.** Do not spend Opus or Fable tokens judging what a test can prove.
3. **Is a PRD-conformance or design-intent gate the judge?** → **Fable 5.1** for the formal gates (pre-build summary, Checkpoint 5); **Opus 5.5** for everything in between (Checkpoint 2/6, referee, status).
4. **Is it mechanical, with an unambiguous instruction and a verification step after?** → **Haiku 5.5.**

### Choose Fable 5.1 when…

- You are running `/prebuild PRD-XX` or the `pre-build-auditor`: reading 1,200 lines of PRD plus every addendum and asking "what did we miss." Ambiguity and cross-document synthesis are Fable's strongest areas.
- You are running Checkpoint 5 (`post-build-verifier`): grading a whole build against the pre-build summary for Wired / Stubbed / Missing.
- The decision spans multiple PRDs (an architecture call, a convention amendment, a cross-PRD impact addendum, naming), or you are authoring a brand-new PRD, addendum, or dispatch pack from scratch. This replaces the old "send it to claude.ai" handoff.
- You will leave a run unattended for hours (overnight batch, long autonomous slice). Long-horizon autonomy is the single biggest Fable gain; the autonomy snippets are already in the system prompt, so let it go.
- A bug survived Sonnet-at-xhigh AND an Opus pass (the RLS-recursion / cross-device-invisibility / silent-tooling class). One Fable session with everything gathered.
- You want a large diff reviewed for *design intent* (not for bugs; tests and Opus do bugs).
- Effort: start **high**. Fable at `low`/`medium` still outperforms older models at `xhigh`, so for an interactive working session drop effort rather than switch models. At `xhigh`/`max` it can gather context and deliberate beyond the task; reserve those for the hardest gates.

### Choose Opus 5.5 when…

- You are opening the coordination seat for the day (status / plan / resume / close). This is the default model, so a fresh window is already right.
- Anything adversarial or security-shaped (question 1 above).
- You are reading eyes-on-tour screenshots and filling a Mom-UI Verification table (Convention #277). Opus 5.5's visual reading is a specific strength.
- Checkpoint 2 (inter-worker) or Checkpoint 6 (close-out / baton-pass), a referee pass on a "proof green" report, or writing the next dispatch prompt.
- A Sonnet worker is stuck after an effort raise; Opus is rung 2 of the ladder.
- You are not sure which model a task wants. Opus 5.5 is the safe default; escalate to Fable only when one of the Fable bullets above clearly applies.
- Effort: set **high** explicitly (default is `medium`). `xhigh` for a stuck-bug escalation.

### Choose Sonnet 5.5 when…

- Implementing an approved dispatch pack or slice (every build worker session).
- Writing or extending Playwright specs, vitest pins, migrations, Edge Function scaffolds.
- Explore / code-search fan-out, the finder pass of a code review, mechanical-but-judgment-bearing edits (prop drilling across the 7 view components, a rename across 20 files).
- Effort: **high** default. **xhigh** for RLS policy work, cross-feature wiring, anything inside the highest-traffic modals, or a slice the dispatch pack marks hard. **low** for Explore subagents and finder fan-out. Raise effort before escalating the tier.

### Choose Haiku 5.5 when…

- Listing, classifying, deduplicating, summarizing logs, running residue-count queries, grepping for a string across a tree.
- Driving a Convention #277 tour: write-from-template, run, screenshot. (Judging the shots is Sonnet-minimum; Haiku once confidently mislabeled a points value as streak evidence.)
- Bulk string replacements where a vitest/grep verification runs immediately after.
- NOT for anything where a wrong call is expensive to detect later.

### Signals you are on the wrong model

- Fable returns a refusal or hedges on security content → that task belongs to Opus. Move it; do not rephrase around the classifier.
- A Sonnet worker loops on the same bug for 3+ attempts → raise effort to `xhigh`; if still stuck, hand the gathered context to Opus.
- Haiku's output needed correction twice in a row → the task has judgment in it; move to Sonnet.
- The seat is running on Fable for routine status/relay work → finish the current turn, then open the next window on Opus 5.5 (don't switch mid-session; it invalidates the cache).

## Standing rules (apply without being asked)

1. **Spawning a coding/implementation subagent via the Agent tool → pass `model: "sonnet"`.** Coding workers never inherit a Fable or Opus session model. Judgment/verification subagents use the pinned agent definitions (`pre-build-auditor` and `post-build-verifier` are pinned `fable`; `migration-writer`, `edge-function-scaffolder`, `rls-verifier` are pinned `sonnet`; `orchestrator` is pinned `opus`). Aliases resolve to the current generation automatically.
2. **In Workflows, set model + effort per stage:** coding stages `{model: 'sonnet', effort: 'high'}` (`xhigh` for hard slices); mechanical stages `{model: 'haiku', effort: 'low'}`; verify/judge stages `{model: 'opus', effort: 'high'}` for routine gates and `{model: 'fable', effort: 'high'}` for PRD-conformance gates, EXCEPT adversarial/security judging, which is ALWAYS `{model: 'opus', effort: 'high'}`.
3. **Playwright is the free verifier; never spend model tokens judging what a test can prove.** "Is it actually done / does it still work" is answered by the E2E suite, `tsc -b`, and lint. Model judgment is reserved for PRD conformance, cross-feature correctness, and design intent.
4. **Dispatch prompts carry a model header, and the model switch is a MANUAL founder step.** A pasted prompt cannot change a session's model; `/model` only works when the founder types it. Every dispatch prompt MUST begin with the two-step instruction:
   - `⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5-5[1m]` → `⚙ STEP 2: paste the rest of this prompt.`
   - Models per session type: implementation worker → `claude-sonnet-5-5[1m]`; coordination seat / referee / security → `claude-opus-5-5[1m]` (this is the default, so a fresh window needs no switch); pre-build audit / Checkpoint 5 / architecture → `claude-fable-5-1[1m]`. (If a `[1m]` variant isn't in the `/model` picker, use the bare ID; all four are 1M-context by default.)
   - **The seat ALSO states the model as a bold standalone line OUTSIDE/above every fenced prompt block** plus a one-line plain-English "what this does" label (founder preference 2026-09-11).
   - A worker accidentally started on Opus or Fable is harmless (slower/costlier, not wrong); don't restart deep sessions over it, since a mid-session `/model` switch invalidates the prompt cache. The only wrong-model case that MUST be corrected: security/adversarial content on Fable → move to Opus.
5. **Don't switch models mid-session** (invalidates the prompt cache). Pick per-session; if the work changes tier mid-session, that is a baton-pass signal.
6. **Effort before tier.** If a Sonnet worker is struggling, raise effort to `xhigh` before escalating the model.
7. **Visual verification split (Conv #277):** Haiku may DRIVE an eyes-on tour; screenshot JUDGMENT is Sonnet minimum, and the seat (Opus 5.5) reads the shots for Mom-UI tables.
8. **Default model = Opus 5.5** (`~/.claude/settings.json` → `"model": "claude-opus-5-5[1m]"`). Fable is always an explicit `/model` choice, never the fallback.

## The escalation ladder (stuck problems)

1. Sonnet 5.5 worker, raise effort to `xhigh`
2. Fails → Opus 5.5 at `high`/`xhigh` with full context
3. Still stuck (RLS-recursion-class, cross-device invisibility, silent-tooling-failure-class bugs) → one Fable 5.1 session with everything gathered
4. **Security/adversarial carve-out at every rung:** adversarial work escalates Sonnet → Opus and STOPS. It never reaches Fable.

## Loop recipes (reference shapes)

- **Find-cheap, verify-expensive** (reviews/audits): Sonnet finders fan out per dimension → dedupe → Opus adversarial verifiers at high effort try to *refute* each finding (Fable only when the finding is a PRD-conformance question). Judgment tokens only on the shortlist.
- **Plan-expensive, build-cheap, verify-expensive** (slice builds): Fable writes the pre-build plan → Opus writes dispatch prompts → Sonnet workers implement (worktree isolation when parallel) → Playwright as ground truth → Opus referees the diff → Fable runs Checkpoint 5 → founder sign-off.
- **Loop-until-dry** (bug passes): Sonnet sweepers hunt a surface until 2 consecutive rounds find nothing new → Opus judges what's real → fixes to Sonnet → each fix pinned by a Playwright test.

## Decision record

- 2026-07-01: original policy (Opus 4.7 judgment, Sonnet workers, Haiku mechanical).
- 2026-07-09: security carve-out proven. Fable guardrails flagged adversarial work; Opus found 4 critical vulns.
- 2026-07-12: re-pin recommendation prepared (Fable → Opus at full price); superseded 2026-08-23.
- 2026-08-23: founder ruling, Fable 5 in normal usage, judgment tier + daily driver.
- 2026-09-07: generation refresh (Fable 5.1, Opus 5, Sonnet 5, Haiku 4.5).
- 2026-10-10: **founder ruling.** Opus 5.5 = daily seat + default model; Fable 5.1 = deliberate judgment gates; Sonnet 5.5 workers at `high` (xhigh for hard slices); Haiku 5.5 mechanical. "Which model, when" guide added at the founder's request.

## What this policy does NOT cover

LiLa's in-app models (OpenRouter, per CLAUDE.md tech stack) are a separate pipeline; this file governs the dev workflow only. **Standing note (2026-10-10):** the in-app pipeline still pins `anthropic/claude-sonnet-4` (22 call sites; Anthropic retired Sonnet 4 on 2026-06-15, and OpenRouter still answers via a partner cloud, probe-verified) and `anthropic/claude-haiku-4.5` (27 functions; earliest retirement 2026-10-15). `anthropic/claude-sonnet-5.5` ($2/$10) and `anthropic/claude-haiku-5.5` ($0.10/$0.50) are live on OpenRouter and accept the `temperature` settings the functions pass. That migration (~50 files + `cost-logger.ts` pricing + the model-id-guard test) is its own dispatch pack, not a find-and-replace.
