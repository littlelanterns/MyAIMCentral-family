# Model Routing Policy — Who Does What

> Auto-loads into every Claude Code session via `.claude/rules/` discovery.
> Founder-approved 2026-07-01; **amended 2026-08-23 (founder ruling): Fable 5 is now part of
> normal plan usage — no per-token cost constraint. Fable is usable like any other model.**
> This supersedes the 2026-07-12 re-pin question (`claude/orchestration/Model-Routing-Repin-2026-07-12.md`
> recommended demoting Fable at full price; that premise is obsolete). The one finding from that
> doc that survives is capability-based, not price-based: **security/adversarial work does not
> run on Fable — permanent** (its dual-use guardrails flagged the adversarial safety-stack
> review, red-team authoring, and exploit analysis on 2026-07-09; Opus did that work and found
> 4 critical vulnerabilities).
> Remaining date: Sonnet 5 intro pricing ($2/$10 per MTok) runs through 2026-08-31 — re-evaluate
> worker economics then (routing likely unchanged; Sonnet stays the worker tier for throughput
> reasons, not just price).
>
> The founder should never have to remember these assignments. Every session applies them
> automatically; every dispatch prompt carries its model header.

## The tier assignments

| Tier | Model | Role in this project |
|---|---|---|
| **Fable 5** | `fable` | **Judgment tier + daily driver.** Pre-build audits, post-build verification, architecture decisions spanning multiple PRDs, checkpoint synthesis, orchestration, escalated debugging, GO/NO-GO gates. Now in normal usage — use it wherever judgment quality matters. **NEVER for security/adversarial content** (permanent carve-out — see Opus). |
| **Opus 4.8** | `opus` | **Security & adversarial tier + orchestration alternate.** ALL red-team authoring, exploit analysis, adversarial security review, RPC/RLS attack-surface sweeps run here — permanent, capability-based pin (Fable's guardrails flag this class). Also fine for orchestration and checkpoint work when a window is already on it. |
| **Sonnet 5** | `sonnet` | **All coding workers.** Every implementation subagent, Explore fan-out, code-review *finder* pass, E2E spec writing, migration/scaffolding work, multi-file mechanical edits. Run coding stages at **effort `xhigh`** wherever effort is settable. |
| **Haiku 4.5** | `haiku` | Mechanical sweeps: file listing, classification, dedup, log summarization. (200K context — don't hand it huge inputs.) |

## Standing rules (apply without being asked)

1. **Spawning a coding/implementation subagent via the Agent tool → pass `model: "sonnet"`.** Do not let coding workers inherit a Fable or Opus session model. Judgment/verification subagents use the pinned agent definitions (`pre-build-auditor` and `post-build-verifier` are pinned to `fable`; `migration-writer`, `edge-function-scaffolder`, `rls-verifier` are pinned to `sonnet`; `orchestrator` may run `fable` or `opus`).
2. **In Workflows, set model + effort per stage:** coding/implementation stages `{model: 'sonnet', effort: 'xhigh'}`; mechanical stages `{model: 'haiku', effort: 'low'}` or `{model: 'sonnet', effort: 'low'}`; verify/judge stages `{model: 'fable', effort: 'high'}` — EXCEPT adversarial/security judging, which is `{model: 'opus', effort: 'high'}`.
3. **Playwright is the free verifier — never spend model tokens judging what a test can prove.** "Is it actually done / does it still work" questions are answered by running the E2E suite (`tests/e2e/...`), `tsc -b`, and lint — not by a Fable/Opus review pass. Model judgment is reserved for what tests can't check: PRD conformance, cross-feature connection correctness, design intent.
4. **Dispatch prompts carry a model header — and the model switch is a MANUAL founder step.** A pasted prompt cannot change a session's model; `/model` only works when the founder types it into the input box herself, and new windows inherit the last-used default. Every dispatch prompt MUST therefore begin with an explicit two-step instruction, e.g.:
   - `⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]` → `⚙ STEP 2: paste the rest of this prompt.`
   - Models per session type: implementation worker → `claude-sonnet-5[1m]`; judgment/audit/orchestration → `claude-fable-5[1m]`; **security/adversarial → `claude-opus-4-8[1m]` (never Fable)**.
   - If a session started on the wrong model, the founder just types the `/model` command in that window — no re-paste needed; switching early costs almost nothing.
   - **The seat ALSO states the model as a bold standalone line OUTSIDE/above every fenced prompt block** (founder missed the in-block header 2026-08-23 and ran three workers on Fable). Post-2026-08-23 that mistake is harmless (Fable is normal usage; only slower) — don't restart deep sessions over it; a mid-session `/model` switch invalidates the prompt cache. The only wrong-model case that must be corrected: security/adversarial content on Fable → move to Opus.
5. **Don't switch models mid-session** (invalidates the prompt cache). Pick per-session; if the work changes tier mid-session, that's a baton-pass signal.
6. **Effort before tier.** If a Sonnet worker is struggling, raise effort to `xhigh` before escalating the model tier.
7. **Visual verification split (Conv #277, lesson from 2026-07-04):** Haiku may DRIVE an eyes-on tour (write-from-template + run + screenshot — it does this well), but screenshot JUDGMENT is **Sonnet minimum** — observed failure mode: Haiku confidently mislabeled a points value as streak evidence and marked an unexercised interaction verified. Cheap fix: Haiku tours, Sonnet (or the dispatching session itself) reads the shots.

## The escalation ladder (stuck problems)

1. Sonnet worker at `xhigh` attempts the fix
2. Fails → Opus or Fable with full context
3. Still stuck (RLS-recursion-class, cross-device invisibility, silent-tooling-failure-class bugs) → one Fable session with everything gathered
4. **Security/adversarial carve-out at every rung:** adversarial work escalates Sonnet → Opus and STOPS. It never reaches Fable.

## Loop recipes (reference shapes)

- **Find-cheap, verify-expensive** (reviews/audits): Sonnet finders fan out per dimension → dedupe → Fable adversarial verifiers at high effort try to *refute* each finding (Opus if the content is security/adversarial). Judgment tokens only on the shortlist.
- **Plan-expensive, build-cheap, verify-expensive** (slice builds): Fable writes the slice plan + dispatch prompts → Sonnet workers implement (worktree isolation when parallel) → Playwright as ground truth → Fable reviews the diff at high effort before founder eyes-on.
- **Loop-until-dry** (bug passes): Sonnet sweepers keep hunting a surface until 2 consecutive rounds find nothing new → Fable judges what's real → fixes to Sonnet → each fix pinned by a Playwright test.

## What this policy does NOT cover

LiLa's in-app models (Sonnet/Haiku via OpenRouter, per CLAUDE.md tech stack) are a separate pipeline — this file governs the dev workflow only. When Sonnet 5 is available on OpenRouter, evaluate intro pricing for `lila-chat` as a separate decision.
