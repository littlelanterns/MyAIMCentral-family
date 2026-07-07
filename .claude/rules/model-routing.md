# Model Routing Policy — Who Does What

> Auto-loads into every Claude Code session via `.claude/rules/` discovery.
> Founder-approved 2026-07-01. **Revisit after 2026-07-12** — Anthropic extended Fable 5's introductory pricing (up to 50% off) through 2026-07-12 (announced 2026-07-07; original end date was 07-07). At the new date the founder re-decides Fable usage at full price (likely narrowing it or pulling judgment gates back to Opus). Secondary date: Sonnet 5 intro pricing ($2/$10 per MTok) runs through 2026-08-31 — worker economics stay extra-cheap until then.
>
> The founder should never have to remember these assignments. Every session applies them automatically; every dispatch prompt carries its model header.

## The tier assignments

| Tier | Model | Role in this project |
|---|---|---|
| **Fable 5** | `fable` | **Judgment gates only.** Pre-build audits, post-build verification ("are we actually building what was planned, and does it all connect correctly"), architecture decisions spanning multiple PRDs, escalated debugging (see ladder below). |
| **Opus 4.8** | `opus` | **Daily driver.** Main session for slice builds, orchestration, checkpoint synthesis, dispatch-prompt generation, eyes-on-tour fixes. |
| **Sonnet 5** | `sonnet` | **All coding workers.** Every implementation subagent, Explore fan-out, code-review *finder* pass, E2E spec writing, migration/scaffolding work, multi-file mechanical edits. Run coding stages at **effort `xhigh`** wherever effort is settable. |
| **Haiku 4.5** | `haiku` | Mechanical sweeps: file listing, classification, dedup, log summarization. (200K context — don't hand it huge inputs.) |

## Standing rules (apply without being asked)

1. **Spawning a coding/implementation subagent via the Agent tool → pass `model: "sonnet"`.** Do not let coding workers inherit a Fable or Opus session model. Judgment/verification subagents use the pinned agent definitions (`pre-build-auditor` and `post-build-verifier` are pinned to `fable`; `migration-writer`, `edge-function-scaffolder`, `rls-verifier` are pinned to `sonnet`; `orchestrator` is pinned to `opus`).
2. **In Workflows, set model + effort per stage:** coding/implementation stages `{model: 'sonnet', effort: 'xhigh'}`; mechanical stages `{model: 'haiku', effort: 'low'}` or `{model: 'sonnet', effort: 'low'}`; verify/judge stages `{model: 'opus', effort: 'high'}` (or `fable` for build-plan-conformance judgment).
3. **Playwright is the free verifier — never spend model tokens judging what a test can prove.** "Is it actually done / does it still work" questions are answered by running the E2E suite (`tests/e2e/...`), `tsc -b`, and lint — not by a Fable/Opus review pass. Model judgment is reserved for what tests can't check: PRD conformance, cross-feature connection correctness, design intent.
4. **Dispatch prompts carry a model header — and the model switch is a MANUAL founder step.** A pasted prompt cannot change a session's model; `/model` only works when the founder types it into the input box herself, and new windows inherit the last-used default. Every dispatch prompt MUST therefore begin with an explicit two-step instruction, e.g.:
   - `⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]` → `⚙ STEP 2: paste the rest of this prompt.`
   - Models per session type: implementation worker → `claude-sonnet-5[1m]`; judgment/audit → `claude-fable-5[1m]`; orchestration → `claude-opus-4-8[1m]`.
   - If a session started on the wrong model, the founder just types the `/model` command in that window — no re-paste needed; switching early costs almost nothing.
5. **Don't switch models mid-session** (invalidates the prompt cache). Pick per-session; if the work changes tier mid-session, that's a baton-pass signal.
6. **Effort before tier.** If a Sonnet worker is struggling, raise effort to `xhigh` before escalating the model tier.
7. **Visual verification split (Conv #277, lesson from 2026-07-04):** Haiku may DRIVE an eyes-on tour (write-from-template + run + screenshot — it does this well), but screenshot JUDGMENT is **Sonnet minimum** — observed failure mode: Haiku confidently mislabeled a points value as streak evidence and marked an unexercised interaction verified. Cheap fix: Haiku tours, Sonnet (or the dispatching session itself) reads the shots.

## The escalation ladder (stuck problems)

Don't *start* at Fable — *arrive* at it:
1. Sonnet worker at `xhigh` attempts the fix
2. Fails → Opus with full context
3. Still stuck (RLS-recursion-class, cross-device invisibility, silent-tooling-failure-class bugs) → one Fable session with everything gathered

## Loop recipes (reference shapes)

- **Find-cheap, verify-expensive** (reviews/audits): Sonnet finders fan out per dimension → dedupe → Opus/Fable adversarial verifiers at high effort try to *refute* each finding. Premium tokens only on the shortlist.
- **Plan-expensive, build-cheap, verify-expensive** (slice builds): Fable/Opus writes the slice plan + dispatch prompts → Sonnet workers implement (worktree isolation when parallel) → Playwright as ground truth → Opus reviews the diff at high effort before founder eyes-on.
- **Loop-until-dry** (bug passes): Sonnet sweepers keep hunting a surface until 2 consecutive rounds find nothing new → Opus judges what's real → fixes to Sonnet → each fix pinned by a Playwright test.

## What this policy does NOT cover

LiLa's in-app models (Sonnet/Haiku via OpenRouter, per CLAUDE.md tech stack) are a separate pipeline — this file governs the dev workflow only. When Sonnet 5 is available on OpenRouter, evaluate intro pricing for `lila-chat` as a separate decision.
