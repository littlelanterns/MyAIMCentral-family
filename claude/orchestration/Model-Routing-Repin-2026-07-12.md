# Model Routing Re-Pin Recommendation — for the 2026-07-12 decision

> **Prepared:** 2026-07-09 (Fable coordination seat) — the deliverable CURRENT.md founder item 4 tracks.
> **The decision you're making:** Fable 5's introductory pricing (up to 50% off) ends 2026-07-12.
> At full price, does Fable keep its standing assignments, or does the daily judgment tier
> return to Opus? This doc is the recommendation + the exact edits to make on your word.

---

## Recommendation (plain English)

**Re-pin the judgment tier to Opus. Retire Fable from all standing assignments. Keep Fable
available only as the top rung of the escalation ladder, invoked per-instance on your say-so.**

You already got what Fable was for. The whole point of the July Fable window was to front-load
the judgment-heavy work while it was half price — and that worked: the dispatch factory banked
27+ approved build packs covering every remaining PRD, the PRD-31 and PRD-40 pre-builds are
done, PRD-41/42/43 were designed and approved, the attorney package was drafted, the Beta
Readiness audit + today's delta are written, and Family Goals was designed. What's left on the
road to beta is overwhelmingly **execution** (Sonnet workers running approved packs) and
**routine judgment** (checkpoint synthesis, batch review, GO/NO-GO gates) — which Opus has
handled well every time it's been used for exactly that.

## The three reasons

1. **The firm negative finding: security and adversarial work does not run on Fable — period.**
   All through 2026-07-09, Fable's dual-use guardrails flagged the adversarial safety-stack
   review, red-team authoring, and exploit analysis. The Opus window did that work instead and
   found 4 critical vulnerabilities. The biggest judgment items remaining on the beta path —
   the Phase-4 flip, red-team corpus maintenance, the RPC-EXECUTE sweep verification, any
   future security review — are **exactly the class Fable cannot run**. This pin is permanent
   and price-independent: **security/adversarial → Opus, always.**

2. **The Fable-dependent backlog is empty by design.** The 2026-07-04 standing rule ("P2 and
   PRD-19 must NEVER be the ones left over") was honored — every judgment-heavy pack was
   produced inside the window. The pinned agents (`pre-build-auditor`, `post-build-verifier`)
   already carry "Fable if available, else Opus" fallback language in the build packs; flipping
   the default is a two-line agent edit, not an architecture change.

3. **Worker economics are unchanged.** Sonnet 5 intro pricing ($2/$10 per MTok) runs through
   2026-08-31 — the coding tier stays cheap regardless. The only cost question is the judgment
   tier, and at full Fable price the marginal quality over Opus does not justify it for
   checkpoint/review work. (Where it might: see the carve-out below.)

## Exact edits on your word (seat executes, ~5 minutes)

1. `.claude/agents/pre-build-auditor.md` + `.claude/agents/post-build-verifier.md` —
   model pin `fable` → `opus`.
2. `.claude/rules/model-routing.md` —
   - Tier table: **Opus** takes "judgment gates + daily driver"; **Fable** row becomes
     "escalation-only: per-instance founder approval; NEVER for security/adversarial content
     (permanent — guardrails flag it, proven 2026-07-09)."
   - Escalation ladder: unchanged (arrive at Fable, don't start there) — but add the
     security carve-out at every rung: adversarial work escalates Sonnet → Opus and STOPS.
   - Replace the "Revisit after 2026-07-12" header note with the decision record.
3. Dispatch-prompt convention: judgment/audit session headers change from
   `/model claude-fable-5[1m]` to `/model claude-opus-4-8[1m]`. (Existing approved packs that
   say "Fable if available, else Opus" need no edits — the fallback clause already resolves.)
4. `.claude/state/CURRENT.md` + memory (`project_model_routing`) updated to match.

## The one carve-out worth keeping in your pocket

Per-instance Fable remains a good spend for **rare, wide-context architecture judgment** where
the work is (a) not adversarial and (b) genuinely cross-PRD: the final Beta Readiness Gate
declaration audit, and the PRD-29 Build-C family-plan machinery review are the two plausible
candidates on the current queue. Neither is committed — Opus + the existing packs will handle
both acceptably. Default no; ask-per-instance yes.

## What does NOT change

- Sonnet 5 at `xhigh` stays the universal coding-worker tier (re-evaluate at its own intro
  pricing end, 2026-08-31).
- Haiku stays on mechanical sweeps; the Convention #277 rule stands (Haiku may DRIVE tours,
  Sonnet-minimum JUDGES screenshots).
- Playwright stays the free verifier — no model reviews what a test can prove.
- LiLa's in-app model routing (OpenRouter) is a separate pipeline, untouched by this decision.
